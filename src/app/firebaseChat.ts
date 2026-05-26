import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where 
} from 'firebase/firestore';
import { db, auth, hasConfiguredFirebase, ensureAuth, getStableGuestId, handleFirestoreError, OperationType } from '../firebase';

export interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  panel?: any;
  initialData?: Record<string, unknown>;
  timestamp: Date;
  isJcStep?: boolean;
  jcStepCode?: string;
}

export interface ChatSession {
  id: string;
  label: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// Check if Firebase is active and initialized correctly
export function isFirebaseEnabled() {
  return hasConfiguredFirebase && auth !== null && db !== null;
}

// 1. Fetch all chat sessions for the current authenticated user or guest fallback
export async function fetchChatSessions(): Promise<ChatSession[]> {
  if (!isFirebaseEnabled()) return [];
  const user = await ensureAuth();
  const userId = user ? user.uid : getStableGuestId();

  const path = 'chat_sessions';
  try {
    const q = query(
      collection(db, path), 
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );
    const snap = await getDocs(q);
    const sessions: ChatSession[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      sessions.push({
        id: data.id,
        label: data.label,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        userId: data.userId,
      });
    });
    return sessions;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// 2. Fetch all messages for a specific session
export async function fetchChatMessages(sessionId: string): Promise<Message[]> {
  if (!isFirebaseEnabled()) return [];
  await ensureAuth();

  const path = `chat_sessions/${sessionId}/messages`;
  try {
    const q = query(collection(db, path), orderBy("timestamp", "asc"));
    const snap = await getDocs(q);
    const messages: Message[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      messages.push({
        id: data.id,
        role: data.role as "user" | "bot",
        text: data.text || "",
        panel: data.panel || undefined,
        initialData: data.initialData?.initialData || data.initialData || undefined,
        timestamp: data.timestamp?.toDate() || new Date(),
        isJcStep: data.isJcStep || undefined,
        jcStepCode: data.jcStepCode || undefined,
      });
    });
    return messages;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// 3. Create or update session metadata
export async function saveChatSession(sessionId: string, label: string): Promise<void> {
  if (!isFirebaseEnabled()) return;
  const user = await ensureAuth();
  const userId = user ? user.uid : getStableGuestId();

  const path = `chat_sessions`;
  try {
    const docRef = doc(db, path, sessionId);
    const docSnap = await getDoc(docRef);
    const now = new Date();
    
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        id: sessionId,
        label: label.substring(0, 80) || "New Conversation",
        createdAt: now,
        updatedAt: now,
        userId: userId,
      });
    } else {
      await updateDoc(docRef, {
        label: label.substring(0, 80),
        updatedAt: now,
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${sessionId}`);
  }
}

// 4. Save/Update a single message inside a chat session
export async function saveChatMessage(sessionId: string, msg: Message): Promise<void> {
  if (!isFirebaseEnabled()) return;
  await ensureAuth();

  const path = `chat_sessions/${sessionId}/messages`;
  try {
    const docRef = doc(db, path, msg.id);
    const payload: any = {
      id: msg.id,
      role: msg.role,
      text: msg.text || "",
      timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
    };
    if (msg.panel !== undefined) payload.panel = msg.panel;
    if (msg.initialData !== undefined) payload.initialData = msg.initialData;
    if (msg.isJcStep !== undefined) payload.isJcStep = msg.isJcStep;
    if (msg.jcStepCode !== undefined) payload.jcStepCode = msg.jcStepCode;

    await setDoc(docRef, payload);

    // Touch the parent session documents' updatedAt timestamp for clean chronological sorted indexing
    const sessionRef = doc(db, 'chat_sessions', sessionId);
    await updateDoc(sessionRef, {
      updatedAt: new Date(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${msg.id}`);
  }
}

// 5. Use user authorization permissions to delete a session and its subcollection messages
export async function deleteChatSession(sessionId: string): Promise<void> {
  if (!isFirebaseEnabled()) return;
  await ensureAuth();

  try {
    const sessionRef = doc(db, 'chat_sessions', sessionId);
    
    // First clear nested subcollection documents
    const messagesPath = `chat_sessions/${sessionId}/messages`;
    const msgsSnap = await getDocs(collection(db, messagesPath));
    const deletePromises: Promise<void>[] = [];
    msgsSnap.forEach((mDoc) => {
      deletePromises.push(deleteDoc(doc(db, messagesPath, mDoc.id)));
    });
    await Promise.all(deletePromises);

    // Then delete parent session document
    await deleteDoc(sessionRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `chat_sessions/${sessionId}`);
  }
}

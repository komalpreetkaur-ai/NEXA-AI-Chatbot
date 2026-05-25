import { useState, useRef, useEffect, forwardRef } from "react"
import { jsPDF } from "jspdf"
import {
  Calendar, Car, FileText, ClipboardList, CheckSquare, Bell, Newspaper,
  Send, Search, ChevronDown, ChevronLeft, Plus, Minus,
  AlertTriangle, CheckCircle, Clock, User, Mail, Fuel,
  ArrowRight, Bot, Check, Wrench, Download, Eye, Printer,
  Zap, LogOut, Settings, RefreshCw, Hash, MessageSquare,
  Phone, LayoutDashboard, ChevronRight,
  Wifi, Lightbulb, X, Camera, CameraOff, Mic, Volume2, VolumeX,
  Sun, Moon
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

// ── Types ─────────────────────────────────────────────────────────────────────
type PanelType = "welcome" | "appointments" | "vehicle-history" | "jc-opening" | "all-jobcards" | "tasks" | "notifications" | "service-news" | "my-calls" | "suzuki-connect-form" | "suzuki-connect-advice"

interface Appointment {
  regNo: string; timeSlot: string; serviceType: string; omr: number
  model: string; status: "Not Arrived" | "Arrived" | "In Service" | "JC Opened" | "Completed"
  appType?: string
  regNoDisplay?: string
  date?: string
}
interface VehicleRecord {
  date: string; serviceType: string; mileage: number; dealer: string; jcNo?: string
}
interface JobCard {
  jcNo: string; model: string; regNo: string; serviceType: string
  status: "In Progress" | "Completed" | "Pending" | "OCAS Pending"; date: string; amount: number
}
interface JCDetail {
  jcNo: string; dealer: string; dealerMapCode: string; visitDate: string; gateIn: string
  serviceType: string; billedDate: string; techName: string; pinStatus: string; attendedThrough: string
  remark: string; unauthorizedFitments: string; odometer: number; bay: string; group: string
  paymentMode: string; promisedDate: string; promisedTime: string
  customer: {
    name: string; regNo: string; mobile1: string; mobile2: string; model: string; vin: string
    variant: string; saleDate: string; tvSaleDate: string; fcOkDate: string; address: string
    email: string; state: string; city: string; pinCode: string; customerCategory: string
  }
  demands: { sno: number; type: string; code: string; desc: string; voice: string }[]
  labour: { sno: number; code: string; desc: string; qty: number; prnHrs: number; billableType: string; amount: number }[]
  parts: { sno: number; code: string; desc: string; qty: number; price: number; amount: number }[]
  pricing: { scheduledLabour: number; scheduledParts: number; estLabour: number; estParts: number }
}
interface Task { id: string; text: string; time: string; done: boolean; priority: "high" | "medium" | "low" }
interface Notification { id: string; text: string; type: "urgent" | "warning" | "success" | "info"; time: string; read: boolean }
interface Message { id: string; role: "user" | "bot"; text: string; panel?: PanelType; initialData?: Record<string, unknown>; timestamp: Date }

// ── Mock Data ─────────────────────────────────────────────────────────────────
const APPOINTMENTS: Appointment[] = [
  { regNo: "HR26DS6144", timeSlot: "08:15-08:30", serviceType: "PAID SERVICE", omr: 40002, model: "MARUTI BALENO PETROL", status: "Not Arrived", appType: "", date: "2026-04-16" },
  { regNo: "HR26FN3715", timeSlot: "10:30-10:45", serviceType: "PAID SERVICE", omr: 29998, model: "MARUTI GRAND VITARA Strong Hybrid", status: "Not Arrived", appType: "Service Parts Enquiry", date: "2026-04-16" },
  { regNo: "HR26FN3715-DUP", regNoDisplay: "HR26FN3715", timeSlot: "10:30-10:45", serviceType: "PAID SERVICE", omr: 29998, model: "MARUTI GRAND VITARA Strong Hybrid", status: "Not Arrived", appType: "Service Parts Enquiry", date: "2026-04-16" },
  { regNo: "HR26FK2786", timeSlot: "09:00-09:15", serviceType: "PAID SERVICE", omr: 20000, model: "MARUTI GRAND VITARA Smart Hybrid", status: "Not Arrived", appType: "Referrals", date: "2026-04-16" },
  { regNo: "HR26CW7677", timeSlot: "09:15-09:30", serviceType: "PAID SERVICE", omr: 39998, model: "MARUTI BALENO PETROL", status: "Not Arrived", appType: "Service Parts Enquiry", date: "2026-04-16" },
  { regNo: "HR82C0640", timeSlot: "09:30-09:45", serviceType: "2ND FREE SERVICE", omr: 3000, model: "NEW BALENO CNG", status: "Not Arrived", appType: "", date: "2026-04-16" },
  { regNo: "HR10X2772", timeSlot: "11:45-12:00", serviceType: "3RD FREE SERVICE", omr: 9999, model: "BREZZA S-CNG", status: "Not Arrived", appType: "", date: "2026-04-16" },
]

const VEHICLE_HISTORY: Record<string, { model: string; vin: string; records: VehicleRecord[] }> = {
  "DL6CR1517": {
    model: "MARUTI BALENO PETROL", vin: "MA3FJEB1SND123456",
    records: [
      { date: "30-MAY-2024 09:44", serviceType: "RUNNING REPAIR", mileage: 54321, dealer: "MAGIC AUTO PVT LTD, METRO PARKING-2S(NEXA)", jcNo: "JC25000890" },
      { date: "29-DEC-2023 16:19", serviceType: "RUNNING REPAIR", mileage: 48120, dealer: "PREM MOTORS PVT. LTD., GURGAON-2S(NEXA)", jcNo: "JC24001145" },
      { date: "20-DEC-2023 10:36", serviceType: "BODY REPAIR", mileage: 48105, dealer: "PREM MOTORS PVT. LTD., OPP SECTOR-14-SRV", jcNo: "JC24001090" },
      { date: "19-DEC-2023 16:02", serviceType: "PAID SERVICE", mileage: 48101, dealer: "PREM MOTORS PVT. LTD., GURGAON-2S(NEXA)", jcNo: "JC24001088" },
      { date: "19-JUL-2023 18:04", serviceType: "RUNNING REPAIR", mileage: 37012, dealer: "ORBIT MOTORS PRIVATE LTD, VEDVYAS", jcNo: "JC23000765" },
      { date: "08-MAR-2023 10:29", serviceType: "RUNNING REPAIR", mileage: 36609, dealer: "PREM MOTORS PVT. LTD., GURGAON-2S(NEXA)", jcNo: "JC23000210" },
      { date: "11-AUG-2022 09:43", serviceType: "PAID SERVICE", mileage: 30420, dealer: "PREM MOTORS PVT. LTD., OPP SECTOR-14-SRV", jcNo: "JC22001005" },
      { date: "07-JAN-2022 09:23", serviceType: "RUNNING REPAIR", mileage: 25486, dealer: "PREM MOTORS PVT. LTD., GURGAON-2S(NEXA)", jcNo: "JC22000052" },
    ]
  },
  "HR26DS6144": {
    model: "MARUTI BALENO PETROL", vin: "MA3FJEB1SND789012",
    records: [
      { date: "15-FEB-2026 10:00", serviceType: "PMS", mileage: 39800, dealer: "PREM MOTORS PVT. LTD., GURGAON-2S(NEXA)", jcNo: "JC26000312" },
      { date: "10-SEP-2025 14:30", serviceType: "RUNNING REPAIR", mileage: 32100, dealer: "PREM MOTORS PVT. LTD., GURGAON-2S(NEXA)", jcNo: "JC25001890" },
      { date: "22-APR-2025 09:15", serviceType: "PAID SERVICE", mileage: 28450, dealer: "PREM MOTORS PVT. LTD., GURGAON-2S(NEXA)", jcNo: "JC25000780" },
    ]
  },
}

const JOB_CARDS: JobCard[] = [
  { jcNo: "JH10CK2349", model: "NEW WAGON R 1L PETROL", regNo: "MH10CK2349", serviceType: "PAID SERVICE", status: "In Progress", date: "21-MAY-2026", amount: 3503 },
  { jcNo: "JC26000501", model: "MARUTI BALENO PETROL", regNo: "HR26CW7677", serviceType: "PAID SERVICE", status: "OCAS Pending", date: "21-MAY-2026", amount: 4850 },
  { jcNo: "JC26000499", model: "MARUTI ERTIGA PETROL", regNo: "HR05AB1234", serviceType: "RUNNING REPAIR", status: "In Progress", date: "21-MAY-2026", amount: 2200 },
  { jcNo: "JC26000490", model: "BREZZA S-CNG", regNo: "HR10X2772", serviceType: "3RD FREE SERVICE", status: "Pending", date: "20-MAY-2026", amount: 0 },
  { jcNo: "JC26000445", model: "MARUTI BALENO PETROL", regNo: "DL6CR1517", serviceType: "RUNNING REPAIR", status: "Completed", date: "18-MAY-2026", amount: 5680 },
  { jcNo: "JC26000420", model: "NEW SWIFT PETROL", regNo: "HR26FN1234", serviceType: "PMS", status: "Completed", date: "17-MAY-2026", amount: 3290 },
]

const JC_DETAILS: Record<string, JCDetail> = {
  "JH10CK2349": {
    jcNo: "JH10CK2349", dealer: "PREM MOTORS PVT. LTD., GURGAON-2S(NEXA)", dealerMapCode: "PMG2S001",
    visitDate: "21-MAY-2026", gateIn: "08:42", serviceType: "PAID SERVICE", billedDate: "—",
    techName: "RAJESH KUMAR", pinStatus: "Pinned", attendedThrough: "Service Advisor",
    remark: "Customer reports engine noise on cold start. Check and rectify.",
    unauthorizedFitments: "None", odometer: 40125, bay: "Bay-03", group: "Group-A",
    paymentMode: "Cash", promisedDate: "21-MAY-2026", promisedTime: "17:00",
    customer: {
      name: "AMIT SHARMA", regNo: "MH10CK2349", mobile1: "9876543210", mobile2: "9811234567",
      model: "NEW WAGON R 1L PETROL", vin: "MA3FHEB1SND334521", variant: "VXI AMT",
      saleDate: "12-MAR-2022", tvSaleDate: "12-MAR-2022", fcOkDate: "12-MAR-2030",
      address: "H-42, Sector-14, Gurgaon, Haryana", email: "amit.sharma@email.com",
      state: "HARYANA", city: "GURGAON", pinCode: "122001", customerCategory: "Regular"
    },
    demands: [
      { sno: 1, type: "L", code: "ZE6IL0P", desc: "PMS – 1P 20K", voice: "PMS as per schedule" },
      { sno: 2, type: "P", code: "99000M24120", desc: "Engine Oil 1L Petrol", voice: "Oil change required" },
      { sno: 3, type: "L", code: "ENGN001", desc: "Engine Noise Investigation", voice: "Noise on cold start" },
    ],
    labour: [
      { sno: 1, code: "ZE6IL0P", desc: "PMS – 1P 20K", qty: 1, prnHrs: 1.5, billableType: "Scheduled", amount: 850 },
      { sno: 2, code: "ENGN001", desc: "Engine Noise Check & Rectify", qty: 1, prnHrs: 0.5, billableType: "Running Repair", amount: 350 },
    ],
    parts: [
      { sno: 1, code: "99000M24120-579", desc: "Brake Fluid Petrol", qty: 0.5, price: 185, amount: 93 },
      { sno: 2, code: "09168M14015", desc: "Gasket – Oil Pan Drain Plug", qty: 1, price: 9, amount: 9 },
      { sno: 3, code: "99999MN0W16", desc: "Engine Oil Petrol 2.8L", qty: 2.8, price: 480, amount: 1344 },
      { sno: 4, code: "16510M65L10", desc: "Oil Filter Petrol", qty: 1, price: 94, amount: 94 },
    ],
    pricing: { scheduledLabour: 850, scheduledParts: 1540, estLabour: 1200, estParts: 1540 },
  },
  "JC26000501": {
    jcNo: "JC26000501", dealer: "PREM MOTORS PVT. LTD., GURGAON-2S(NEXA)", dealerMapCode: "PMG2S001",
    visitDate: "21-MAY-2026", gateIn: "09:10", serviceType: "PAID SERVICE", billedDate: "—",
    techName: "SURESH YADAV", pinStatus: "Not Pinned", attendedThrough: "Digital (Suzuki Connect)",
    remark: "OCAS pending – customer needs cost breakup before approval.",
    unauthorizedFitments: "Aftermarket music system", odometer: 39998, bay: "Bay-01", group: "Group-B",
    paymentMode: "UPI", promisedDate: "21-MAY-2026", promisedTime: "18:30",
    customer: {
      name: "PRIYA VERMA", regNo: "HR26CW7677", mobile1: "9654321098", mobile2: "",
      model: "MARUTI BALENO PETROL", vin: "MA3FJEB1SND789012", variant: "ALPHA",
      saleDate: "05-NOV-2021", tvSaleDate: "05-NOV-2021", fcOkDate: "05-NOV-2029",
      address: "C-21, DLF Phase-2, Gurgaon, Haryana", email: "priya.verma@gmail.com",
      state: "HARYANA", city: "GURGAON", pinCode: "122002", customerCategory: "Premium"
    },
    demands: [
      { sno: 1, type: "L", code: "ZE6IL1P", desc: "PMS – 1P 40K", voice: "Due for 40K service" },
      { sno: 2, type: "P", code: "TYRE001", desc: "Front Tyre Replacement", voice: "Tyre worn out" },
      { sno: 3, type: "L", code: "AC001", desc: "AC Filter Cleaning", voice: "AC not cooling properly" },
    ],
    labour: [
      { sno: 1, code: "ZE6IL1P", desc: "PMS – 1P 40K", qty: 1, prnHrs: 2.0, billableType: "Scheduled", amount: 1200 },
      { sno: 2, code: "AC001", desc: "AC Filter Cleaning", qty: 1, prnHrs: 0.5, billableType: "Paid", amount: 400 },
    ],
    parts: [
      { sno: 1, code: "99999MN0W20", desc: "Engine Oil Petrol 3L", qty: 3, price: 480, amount: 1440 },
      { sno: 2, code: "16510M65L10", desc: "Oil Filter Petrol", qty: 1, price: 94, amount: 94 },
      { sno: 3, code: "09168M14015", desc: "Gasket – Oil Pan Drain Plug", qty: 1, price: 9, amount: 9 },
      { sno: 4, code: "AC-FILTER-01", desc: "AC Cabin Filter", qty: 1, price: 650, amount: 650 },
      { sno: 5, code: "WIPER-FR-001", desc: "Wiper Blade Front Pair", qty: 1, price: 457, amount: 457 },
    ],
    pricing: { scheduledLabour: 1200, scheduledParts: 2650, estLabour: 1600, estParts: 2650 },
  },
  "JC26000499": {
    jcNo: "JC26000499", dealer: "PREM MOTORS PVT. LTD., GURGAON-2S(NEXA)", dealerMapCode: "PMG2S001",
    visitDate: "21-MAY-2026", gateIn: "09:45", serviceType: "RUNNING REPAIR", billedDate: "—",
    techName: "MANISH TIWARI", pinStatus: "Pinned", attendedThrough: "Service Advisor",
    remark: "Customer complained of brake vibration and steering pull to left.",
    unauthorizedFitments: "None", odometer: 52100, bay: "Bay-05", group: "Group-C",
    paymentMode: "Card", promisedDate: "21-MAY-2026", promisedTime: "16:00",
    customer: {
      name: "DEEPAK MALHOTRA", regNo: "HR05AB1234", mobile1: "9812345670", mobile2: "9711234560",
      model: "MARUTI ERTIGA PETROL", vin: "MA3GGKB1SND456789", variant: "ZXI+",
      saleDate: "18-JUL-2020", tvSaleDate: "18-JUL-2020", fcOkDate: "18-JUL-2028",
      address: "Plot-8, Sec-57, Gurugram, Haryana", email: "deepak.malhotra@business.com",
      state: "HARYANA", city: "GURUGRAM", pinCode: "122011", customerCategory: "Corporate"
    },
    demands: [
      { sno: 1, type: "L", code: "BRK001", desc: "Brake Disc Inspection & Replacement", voice: "Vibration while braking" },
      { sno: 2, type: "L", code: "STR001", desc: "Wheel Alignment & Balancing", voice: "Car pulls left" },
      { sno: 3, type: "P", code: "BRK-PAD-FR", desc: "Front Brake Pads Replacement", voice: "Squealing sound" },
    ],
    labour: [
      { sno: 1, code: "BRK001", desc: "Brake Disc R&R Front Pair", qty: 1, prnHrs: 1.5, billableType: "Running Repair", amount: 600 },
      { sno: 2, code: "STR001", desc: "4-Wheel Alignment & Balancing", qty: 1, prnHrs: 0.75, billableType: "Paid", amount: 500 },
    ],
    parts: [
      { sno: 1, code: "55200M80J10", desc: "Disc Brake Front LH", qty: 1, price: 485, amount: 485 },
      { sno: 2, code: "55300M80J10", desc: "Disc Brake Front RH", qty: 1, price: 485, amount: 485 },
      { sno: 3, code: "55810M80J10", desc: "Front Brake Pad Set", qty: 1, price: 430, amount: 430 },
    ],
    pricing: { scheduledLabour: 0, scheduledParts: 0, estLabour: 1100, estParts: 1400 },
  },
  "JC26000490": {
    jcNo: "JC26000490", dealer: "PREM MOTORS PVT. LTD., GURGAON-2S(NEXA)", dealerMapCode: "PMG2S001",
    visitDate: "20-MAY-2026", gateIn: "11:30", serviceType: "3RD FREE SERVICE", billedDate: "—",
    techName: "ARUN CHAUHAN", pinStatus: "Not Pinned", attendedThrough: "Digital (Suzuki Connect)",
    remark: "Free service under warranty. Customer also requested CNG kit inspection.",
    unauthorizedFitments: "None", odometer: 9999, bay: "Bay-02", group: "Group-A",
    paymentMode: "NA (Free Service)", promisedDate: "20-MAY-2026", promisedTime: "17:00",
    customer: {
      name: "SUNITA RAWAT", regNo: "HR10X2772", mobile1: "9988776655", mobile2: "",
      model: "BREZZA S-CNG", vin: "MA3GAHB1SND001234", variant: "ZXI CNG",
      saleDate: "10-SEP-2025", tvSaleDate: "10-SEP-2025", fcOkDate: "10-SEP-2033",
      address: "23A, Sec-40, Gurugram, Haryana", email: "sunita.rawat@email.com",
      state: "HARYANA", city: "GURUGRAM", pinCode: "122003", customerCategory: "Regular"
    },
    demands: [
      { sno: 1, type: "L", code: "ZFREE3", desc: "3rd Free Service – 10K", voice: "Due for 3rd free service" },
      { sno: 2, type: "L", code: "CNG001", desc: "CNG Kit Inspection", voice: "CNG kit check requested" },
    ],
    labour: [
      { sno: 1, code: "ZFREE3", desc: "3rd Free Service Check", qty: 1, prnHrs: 1.0, billableType: "Free Service", amount: 0 },
      { sno: 2, code: "CNG001", desc: "CNG Kit General Inspection", qty: 1, prnHrs: 0.5, billableType: "Free Service", amount: 0 },
    ],
    parts: [
      { sno: 1, code: "09168M14015", desc: "Gasket – Oil Pan Drain Plug", qty: 1, price: 9, amount: 0 },
      { sno: 2, code: "16510M65L10", desc: "Oil Filter Petrol/CNG", qty: 1, price: 94, amount: 0 },
    ],
    pricing: { scheduledLabour: 0, scheduledParts: 0, estLabour: 0, estParts: 0 },
  },
  "JC26000445": {
    jcNo: "JC26000445", dealer: "PREM MOTORS PVT. LTD., GURGAON-2S(NEXA)", dealerMapCode: "PMG2S001",
    visitDate: "18-MAY-2026", gateIn: "08:55", serviceType: "RUNNING REPAIR", billedDate: "18-MAY-2026",
    techName: "VIKRAM SINGH", pinStatus: "Pinned", attendedThrough: "Service Advisor",
    remark: "Battery replaced under OCAS approval. Customer informed and signature collected.",
    unauthorizedFitments: "Aftermarket reverse camera", odometer: 54321, bay: "Bay-04", group: "Group-B",
    paymentMode: "UPI", promisedDate: "18-MAY-2026", promisedTime: "15:00",
    customer: {
      name: "RAHUL MEHTA", regNo: "DL6CR1517", mobile1: "9810001122", mobile2: "9560001122",
      model: "MARUTI BALENO PETROL", vin: "MA3FJEB1SND123456", variant: "DELTA",
      saleDate: "15-JAN-2020", tvSaleDate: "15-JAN-2020", fcOkDate: "15-JAN-2028",
      address: "F-15, Green Park Ext., New Delhi", email: "rahul.mehta@gmail.com",
      state: "DELHI", city: "NEW DELHI", pinCode: "110016", customerCategory: "Regular"
    },
    demands: [
      { sno: 1, type: "P", code: "BATT001", desc: "Battery Replacement (55B24LS)", voice: "Car not starting – battery dead" },
      { sno: 2, type: "L", code: "ELEC001", desc: "Electrical System Check", voice: "Check why battery drained" },
    ],
    labour: [
      { sno: 1, code: "ELEC001", desc: "Electrical System Check", qty: 1, prnHrs: 0.5, billableType: "Running Repair", amount: 300 },
      { sno: 2, code: "BATT-FIT", desc: "Battery Fitting Charges", qty: 1, prnHrs: 0.25, billableType: "Running Repair", amount: 200 },
    ],
    parts: [
      { sno: 1, code: "BATT-55B24LS", desc: "Battery 55B24LS Maruti OEM", qty: 1, price: 5180, amount: 5180 },
    ],
    pricing: { scheduledLabour: 0, scheduledParts: 0, estLabour: 500, estParts: 5180 },
  },
  "JC26000420": {
    jcNo: "JC26000420", dealer: "PREM MOTORS PVT. LTD., GURGAON-2S(NEXA)", dealerMapCode: "PMG2S001",
    visitDate: "17-MAY-2026", gateIn: "09:00", serviceType: "PMS", billedDate: "17-MAY-2026",
    techName: "PRAKASH NAIR", pinStatus: "Pinned", attendedThrough: "Digital (Suzuki Connect)",
    remark: "PMS completed. All checks passed. Customer collected vehicle at 16:30.",
    unauthorizedFitments: "None", odometer: 20010, bay: "Bay-06", group: "Group-C",
    paymentMode: "Card", promisedDate: "17-MAY-2026", promisedTime: "16:00",
    customer: {
      name: "NEHA KAPOOR", regNo: "HR26FN1234", mobile1: "9899001122", mobile2: "",
      model: "NEW SWIFT PETROL", vin: "MA3FHDB1SND567890", variant: "ZXI+",
      saleDate: "02-AUG-2024", tvSaleDate: "02-AUG-2024", fcOkDate: "02-AUG-2032",
      address: "D-7, Sec-15, Faridabad, Haryana", email: "neha.kapoor@work.com",
      state: "HARYANA", city: "FARIDABAD", pinCode: "121007", customerCategory: "Premium"
    },
    demands: [
      { sno: 1, type: "L", code: "ZE6IL0P", desc: "PMS – 1P 20K", voice: "Due for 20K service" },
      { sno: 2, type: "P", desc: "Brake Fluid Top-up", code: "BF001", voice: "Routine brake fluid check" },
    ],
    labour: [
      { sno: 1, code: "ZE6IL0P", desc: "PMS – 1P 20K", qty: 1, prnHrs: 1.5, billableType: "Scheduled", amount: 900 },
    ],
    parts: [
      { sno: 1, code: "99999MN0W16", desc: "Engine Oil Petrol 2.5L", qty: 2.5, price: 480, amount: 1200 },
      { sno: 2, code: "16510M65L10", desc: "Oil Filter Petrol", qty: 1, price: 94, amount: 94 },
      { sno: 3, code: "09168M14015", desc: "Gasket – Oil Pan Drain Plug", qty: 1, price: 9, amount: 9 },
      { sno: 4, code: "99000M24120-579", desc: "Brake Fluid Petrol", qty: 0.5, price: 185, amount: 93 },
      { sno: 5, code: "AIR-FILTER-SW", desc: "Air Filter Swift", qty: 1, price: 394, amount: 394 },
      { sno: 6, code: "SPARK-01", desc: "Spark Plug (Set of 3)", qty: 1, price: 600, amount: 600 },
    ],
    pricing: { scheduledLabour: 900, scheduledParts: 2390, estLabour: 900, estParts: 2390 },
  },
}

const TASKS_DATA: Task[] = [
  { id: "t1", text: "Call HR26FN3715 — Customer hasn't confirmed arrival", time: "09:00", done: false, priority: "high" },
  { id: "t2", text: "Send OCAS approval for JH10CK2349", time: "10:00", done: false, priority: "high" },
  { id: "t3", text: "Follow up on parts availability for HR05AB1234", time: "11:00", done: false, priority: "medium" },
  { id: "t4", text: "Morning vehicle inventory check", time: "08:00", done: true, priority: "low" },
  { id: "t5", text: "Submit warranty claim for JC26000445", time: "14:00", done: false, priority: "medium" },
  { id: "t6", text: "Service news briefing with team", time: "15:30", done: false, priority: "low" },
  { id: "t7", text: "Customer feedback call — BREZZA owner", time: "16:00", done: false, priority: "low" },
]

const NOTIFS_DATA: Notification[] = [
  { id: "n1", text: "URGENT: Customer HR26CW7677 waiting in lounge — Bay still occupied", type: "urgent", time: "10 min ago", read: false },
  { id: "n2", text: "Parts pending for JH10CK2349 — Engine Oil filter (2 units) out of stock", type: "warning", time: "25 min ago", read: false },
  { id: "n3", text: "OCAS approved for JC26000445 — Authorized by Madan Kumar", type: "success", time: "1 hr ago", read: false },
  { id: "n4", text: "New appointment booked: MH01HK4521 — 28-MAY-2026 10:00 AM", type: "info", time: "2 hrs ago", read: true },
  { id: "n5", text: "Tyre replacement reminder: HR26FN3715 — Tyre health critical (2mm)", type: "warning", time: "3 hrs ago", read: true },
  { id: "n6", text: "OCAS submitted for JH10CK2349 — Awaiting customer approval", type: "info", time: "3 hrs ago", read: true },
]

let globalNotifs: Notification[] = (() => {
  try {
    const raw = localStorage.getItem("nexa_notifications")
    return raw ? JSON.parse(raw) : [...NOTIFS_DATA]
  } catch (e) {
    return [...NOTIFS_DATA]
  }
})();
const listeners = new Set<() => void>();

export function useSharedNotifications() {
  const [notifs, setNotifsState] = useState<Notification[]>(globalNotifs);

  useEffect(() => {
    const handler = () => {
      setNotifsState([...globalNotifs]);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const setNotifs = (newNotifs: Notification[] | ((prev: Notification[]) => Notification[])) => {
    if (typeof newNotifs === "function") {
      globalNotifs = newNotifs(globalNotifs);
    } else {
      globalNotifs = newNotifs;
    }
    try {
      localStorage.setItem("nexa_notifications", JSON.stringify(globalNotifs));
    } catch (e) {}
    listeners.forEach(l => l());
  };

  return [notifs, setNotifs] as const;
}

const SERVICE_NEWS = [
  { id: "sn1", title: "Jimny Front Suspension Inspection Campaign", date: "20-MAY-2026", category: "Campaign", summary: "Mandatory inspection for all Jimny models (2023–2024). Complete before 30-JUN-2026." },
  { id: "sn2", title: "Suzuki Connect 2.0 Training Mandatory", date: "19-MAY-2026", category: "Training", summary: "All Service Advisors must complete Suzuki Connect 2.0 training by 31-MAY-2026." },
  { id: "sn3", title: "PMS Package Update — June 2026", date: "15-MAY-2026", category: "Update", summary: "Updated labor rates and parts pricing effective from 01-JUN-2026. Download new rate card." },
]

const JC_DEMANDS = [
  { type: "L", desc: "PMS – 1P 20K", code: "ZE6IL0P", qty: 1, price: 2390, accepted: true },
  { type: "P", desc: "Brake Fluid Petrol", code: "99000M24120-579", qty: 0.5, price: 185, accepted: true },
  { type: "P", desc: "Gasket – Oil Pan Drain Plug Petrol", code: "09168M14015", qty: 1, price: 9, accepted: true },
  { type: "P", desc: "Engine Oil Petrol", code: "99999MN0W16-IDT", qty: 2.8, price: 1344, accepted: true },
  { type: "P", desc: "Oil Filter Petrol", code: "16510M65L10", qty: 1, price: 94, accepted: true },
]

// ── Utilities ─────────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const map: Record<string, string> = {
    "Not Arrived": "bg-[#1C2A3E] text-[#6A8FAB] border border-[rgba(61,142,240,0.2)]",
    "Arrived": "bg-[#0D2E1A] text-[#4ADE80] border border-[#4ADE80]/20",
    "In Service": "bg-[#1A1A0D] text-[#FACC15] border border-[#FACC15]/20",
    "JC Opened": "bg-[#0D1E3A] text-[#60A5FA] border border-[#60A5FA]/20",
    "Completed": "bg-[#0D1F2A] text-[#22D3EE] border border-[#22D3EE]/20",
    "In Progress": "bg-[#1A1A0D] text-[#FACC15] border border-[#FACC15]/20",
    "OCAS Pending": "bg-[#2A0D0D] text-[#F87171] border border-[#F87171]/20",
    "Pending": "bg-[#1C2A3E] text-[#6A8FAB] border border-[rgba(61,142,240,0.2)]",
  }
  return map[status] || "bg-muted text-muted-foreground"
}

function priorityColor(p: string) {
  return p === "high" ? "bg-[#F87171]/20 text-[#F87171]" : p === "medium" ? "bg-[#FACC15]/20 text-[#FACC15]" : "bg-[#6A8FAB]/20 text-[#6A8FAB]"
}

function notifStyle(type: string) {
  const styles: Record<string, { border: string; icon: string; bg: string }> = {
    urgent: { border: "border-l-[#F87171]", icon: "text-[#F87171]", bg: "bg-[#2A0D0D]/40" },
    warning: { border: "border-l-[#FACC15]", icon: "text-[#FACC15]", bg: "bg-[#2A1A0D]/40" },
    success: { border: "border-l-[#4ADE80]", icon: "text-[#4ADE80]", bg: "bg-[#0D2E1A]/40" },
    info: { border: "border-l-[#3D8EF0]", icon: "text-[#3D8EF0]", bg: "bg-[#0D1626]/40" },
  }
  return styles[type] || styles.info
}

function parseInput(input: string): { panel: PanelType | null; botText: string } {
  const lower = input.toLowerCase()
  if (/appointment|schedule|booking|my appointment/.test(lower))
    return { panel: "appointments", botText: "Here are your appointments for today, 21-May-2026. You have 7 scheduled visits." }
  if (/vehicle history|service history|check history|history|past service/.test(lower))
    return { panel: "vehicle-history", botText: "Enter a registration number or VIN to pull the complete vehicle service history." }
  if (/open job card|new jc|create jc|open jc|jc opening|start job|new job/.test(lower))
    return { panel: "jc-opening", botText: "Starting the Job Card Opening process. Please scan or enter the vehicle registration number." }
  if (/all job cards|my jobcards|jobcards|all jc|job card list/.test(lower))
    return { panel: "all-jobcards", botText: "Here are all your active and recent Job Cards." }
  if (/task|to-do|my tasks|today task/.test(lower))
    return { panel: "tasks", botText: "Here are your tasks for today, 21-May-2026. You have 6 pending items." }
  if (/notification|alert|update/.test(lower))
    return { panel: "notifications", botText: "You have 3 unread notifications — including 1 urgent." }
  if (/service news|news|bulletin|campaign/.test(lower))
    return { panel: "service-news", botText: "Latest service news, campaigns, and updates from NEXA." }
  return {
    panel: null,
    botText: "I can help you with appointments, vehicle history, job cards, tasks, and notifications. You can also use the quick action buttons above to get started quickly."
  }
}

// ── Welcome Panel ─────────────────────────────────────────────────────────────
function WelcomePanel({ onAction }: { onAction: (a: PanelType) => void }) {
  const tiles = [
    { id: "appointments" as PanelType, icon: Calendar, label: "My Appointments", count: "7 Today", color: "#3D8EF0" },
    { id: "vehicle-history" as PanelType, icon: Car, label: "Vehicle History", count: "Search", color: "#0DCAF0" },
    { id: "jc-opening" as PanelType, icon: FileText, label: "Open Job Card", count: "New JC", color: "#4ADE80" },
    { id: "my-calls" as PanelType, icon: Phone, label: "My Calls", count: "2 Missed", color: "#4ADE80" },
    { id: "all-jobcards" as PanelType, icon: ClipboardList, label: "All Job Cards", count: "6 Active", color: "#FACC15" },
    { id: "tasks" as PanelType, icon: CheckSquare, label: "Tasks For Today", count: "6 Pending", color: "#A78BFA" },
    { id: "service-news" as PanelType, icon: Newspaper, label: "Service News", count: "3 New", color: "#FB923C" },
    { id: "all-jobcards" as PanelType, icon: Wrench, label: "Quick JC View", count: "Today", color: "#34D399" },
  ]
  return (
    <div className="grid grid-cols-4 gap-3 p-1">
      {tiles.map((t, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onAction(t.id)}
          className="flex flex-col items-start gap-2 p-4 rounded-xl bg-[#0E1626] border border-[rgba(61,142,240,0.12)] hover:border-[rgba(61,142,240,0.35)] hover:bg-[#111E32] transition-all duration-200 text-left group"
        >
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${t.color}18` }}>
            <t.icon size={18} style={{ color: t.color }} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground font-['Rajdhani']">{t.label}</p>
            <p className="text-[11px] text-muted-foreground font-['JetBrains_Mono']">{t.count}</p>
          </div>
        </motion.button>
      ))}
    </div>
  )
}

// ── Appointments Panel ────────────────────────────────────────────────────────
function AppointmentsPanel({ onAction }: { onAction: (a: PanelType, data?: Record<string, unknown>) => void }) {
  const [view, setView] = useState<"DAY" | "WEEK" | "MONTH">("DAY")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>(() => {
    try {
      const cached = localStorage.getItem("nexa_appointments")
      return cached ? JSON.parse(cached) : APPOINTMENTS
    } catch (e) {
      return APPOINTMENTS
    }
  })

  useEffect(() => {
    localStorage.setItem("nexa_appointments", JSON.stringify(appointmentsList))
  }, [appointmentsList])

  const [showAddPopup, setShowAddPopup] = useState(false)
  const [selectedDate, setSelectedDate] = useState("2026-04-16")
  const dateInputRef = useRef<HTMLInputElement>(null)

  // ── SMS Flow State ────────────────────────────────────────────────────────
  const [smsApp, setSmsApp] = useState<Appointment | null>(null)
  const [smsLoading, setSmsLoading] = useState(false)
  const [smsSuccess, setSmsSuccess] = useState(false)
  const [smsText, setSmsText] = useState("")
  const [smsPhone, setSmsPhone] = useState("")
  const [smsClientName, setSmsClientName] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("reminder")

  const getContactInfo = (regNo: string) => {
    const map: Record<string, { name: string; phone: string }> = {
      "HR26DS6144": { name: "PREM MOTORS", phone: "+91 87084 67728" },
      "HR26FN3715": { name: "AMIT SHARMA", phone: "+91 99100 22345" },
      "HR26FN3715-DUP": { name: "AMIT SHARMA", phone: "+91 99100 22345" },
      "HR26FK2786": { name: "ROHIT MEHTA", phone: "+91 98112 34567" },
      "HR26CW7677": { name: "VIKRAM JOSHI", phone: "+91 95600 98765" },
      "HR82C0640": { name: "SANJEEV SURI", phone: "+91 88001 23456" },
      "HR10X2772": { name: "ANIL GUPTA", phone: "+91 90135 79246" },
    }
    return map[regNo] || { name: "VALUED NEXA CLIENT", phone: "+91 99999 88888" }
  }

  const openSmsModal = (a: Appointment) => {
    const contact = getContactInfo(a.regNoDisplay || a.regNo)
    setSmsApp(a)
    setSmsPhone(contact.phone)
    setSmsClientName(contact.name)
    setSmsSuccess(false)
    setSmsLoading(false)
    const displayReg = a.regNoDisplay || a.regNo
    setSmsText(`Dear NEXA Patron, this is to remind you about your upcoming ${a.serviceType} appointment for ${a.model} (${displayReg}) today at ${a.timeSlot}. Thank you. - Nexa Care`)
    setSelectedTemplate("reminder")
  }

  const handleTemplateChange = (a: Appointment, type: string) => {
    setSelectedTemplate(type)
    const displayReg = a.regNoDisplay || a.regNo
    if (type === "reminder") {
      setSmsText(`Dear NEXA Patron, this is to remind you about your upcoming ${a.serviceType} appointment for ${a.model} (${displayReg}) today at ${a.timeSlot}. Thank you. - Nexa Care`)
    } else if (type === "ready") {
      setSmsText(`Dear NEXA Customer, good news! Your vehicle ${a.model} (${displayReg}) is serviced & ready. Odometer: ${a.omr.toLocaleString()} KMS. Welcome back to NEXA.`)
    } else if (type === "parts") {
      setSmsText(`Dear NEXA Patron, your Service Parts enquiry status is updated for ${a.model}. Required items have arrived at our workshop. Regards, Nexa Service.`)
    } else {
      setSmsText(`Dear Patron, regarding your booking at Nexa Workshop for ${a.model} (${displayReg}). Please consult with our Service Manager. Call +91 87084 67728.`)
    }
  }

  const sendSmsTrigger = async () => {
    setSmsLoading(true)
    await new Promise(r => setTimeout(r, 1400))
    setSmsLoading(false)
    setSmsSuccess(true)
    setTimeout(() => {
      setSmsApp(null)
    }, 1800)
  }
  
  const [formData, setFormData] = useState({
    regNo: "HR26DS6144",
    date1: "16-APR-2026 00:00",
    date2: "21-May-2026 16:27",
    lastAttendedSm: "PARVEEN KUMAR",
    currentSm: "VISHAL YADAV",
    slot: "08:15–08:30",
    timeSlot: "08:15–08:30",
    remarks: "call later",
    omr: "40002",
    serviceType: "PAID SERVICE",
    model: "MARUTI BALENO PETROL",
    variant: "MARUTI BALENO ZETA PETROL",
    vin: "MBHEWB22SJJ223312",
    customerCategory: "N/A",
    customerName: "PREM MOTORS TRUE VALUE",
    mobile1: "8708 467 728",
    mobile2: "N/A",
    email: "ab@123gmail.com",
    address: "SECTOR - 17-18",
    state: "HARYANA",
    city: "GURUGRAM"
  })

  const filtered = appointmentsList.filter(a => {
    const matchesSearch = a.regNo.toLowerCase().includes(search.toLowerCase()) ||
                          a.model.toLowerCase().includes(search.toLowerCase())
    const appDate = a.date || "2026-04-16"
    return matchesSearch && appDate === selectedDate
  })

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newApp: Appointment = {
      regNo: formData.regNo.toUpperCase() || "HR26DS6144",
      timeSlot: formData.slot || "08:15–08:30",
      serviceType: formData.serviceType || "PAID SERVICE",
      omr: parseInt(formData.omr) || 40002,
      model: formData.model || "MARUTI BALENO PETROL",
      status: "Not Arrived",
      appType: "Service Parts Enquiry",
      date: selectedDate
    }
    setAppointmentsList(prev => [newApp, ...prev])
    setShowAddPopup(false)
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-[#0E1626] overflow-hidden">
      {/* ── Black Banner Header ── */}
      <div className="bg-[#070C16] py-2.5 px-4 flex items-center justify-between text-white font-sans border-b border-[rgba(61,142,240,0.1)]">
        <div className="text-[12px] sm:text-[13px] font-semibold tracking-wider uppercase text-neutral-300 font-['Rajdhani']">
          My Appointments
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search by Reg No."
            className="bg-[#121B2A] text-white px-3 py-1 text-[11px] rounded-md border border-[rgba(61,142,240,0.2)] focus:border-[#00AAFF] w-[110px] sm:w-[150px] outline-none placeholder-neutral-500 font-medium font-sans" 
          />
          <button 
            onClick={() => setShowAddPopup(true)} 
            className="text-white hover:text-[#00AAFF] transition-colors leading-none text-[22px] font-light px-2"
          >
            +
          </button>
        </div>
      </div>

      {/* ── Subheader Bar: Date selector & DAY/WEEK/MONTH pill switcher ── */}
      <div className="bg-[#121B2A] px-4 py-2.5 flex items-center justify-between border-b border-border/50">
        {/* Date Selector */}
        {(() => {
          const formatDateDisplay = (dateStr: string) => {
            try {
              const parts = dateStr.split("-")
              if (parts.length !== 3) return dateStr
              const year = parts[0]
              const monthIdx = parseInt(parts[1], 10) - 1
              const day = parseInt(parts[2], 10)
              const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
              ]
              return `${day}-${months[monthIdx] || "April"}-${year}`
            } catch (e) {
              return dateStr
            }
          }

          const shiftDate = (days: number) => {
            try {
              const current = new Date(selectedDate)
              current.setDate(current.getDate() + days)
              const yStr = current.getFullYear()
              const mStr = String(current.getMonth() + 1).padStart(2, "0")
              const dStr = String(current.getDate()).padStart(2, "0")
              setSelectedDate(`${yStr}-${mStr}-${dStr}`)
            } catch (e) {
              console.error(e)
            }
          }

          return (
            <div className="flex items-center text-foreground font-bold text-[12px] font-sans relative">
              <div 
                onClick={() => {
                  if (dateInputRef.current) {
                    try {
                      dateInputRef.current.showPicker();
                    } catch (e) {
                      // Older browsers or restricted iframe environments fallback
                      // The absolute inset-0 z-10 native transparent input below handles native clicks directly.
                    }
                  }
                }}
                className="flex items-center gap-2 bg-[#14223A] border border-[rgba(61,142,240,0.25)] hover:border-[#00AAFF] hover:bg-[#1C2A3E]/70 transition-all rounded-lg px-3 py-1.5 cursor-pointer relative shadow-sm"
              >
                <Calendar size={13} className="text-[#00AAFF]" />
                <span className="tracking-wide text-[11.5px] text-foreground font-semibold select-none">
                  {formatDateDisplay(selectedDate)}
                </span>
                <ChevronDown size={11} className="text-neutral-400" />
                <input 
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value)
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
              </div>
            </div>
          )
        })()}

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#070C16] border border-border/40 rounded-full p-0.5">
          {(["DAY", "WEEK", "MONTH"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-0.5 text-[10px] font-extrabold rounded-full transition-all tracking-wider font-sans ${view === v ? "bg-primary text-white shadow-sm font-black" : "text-muted-foreground hover:text-foreground"}`}>{v}</button>
          ))}
        </div>
      </div>

      {/* ── Beautiful Table exactly as represented in Image ── */}
      <div className="overflow-x-auto rounded-xl border border-border/50 bg-[#070C16]/20 mx-4 mb-1">
        <table className="w-full text-[11.5px] border-collapse">
          <thead>
            <tr className="bg-[#1C2A3E]/80 border-b border-border">
              <th className="px-4 py-2.5 text-left font-bold text-muted-foreground text-[10px] tracking-wider uppercase whitespace-nowrap font-['Rajdhani']">S.No.</th>
              <th className="px-3 py-2.5 text-left font-bold text-muted-foreground text-[10px] tracking-wider uppercase whitespace-nowrap font-['Rajdhani']">Reg No</th>
              <th className="px-3 py-2.5 text-left font-bold text-muted-foreground text-[10px] tracking-wider uppercase whitespace-nowrap font-['Rajdhani']">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  Time Slot
                  <span className="inline-flex flex-col items-center justify-center bg-[#2B3B52] hover:bg-[#324560] cursor-pointer rounded px-1 py-0.5 text-[7px] leading-[4px] text-white">
                    <span>▲</span>
                    <span>▼</span>
                  </span>
                </span>
              </th>
              <th className="px-3 py-2.5 text-left font-bold text-muted-foreground text-[10px] tracking-wider uppercase whitespace-nowrap font-['Rajdhani']">Service Type</th>
              <th className="px-3 py-2.5 text-left font-bold text-muted-foreground text-[10px] tracking-wider uppercase whitespace-nowrap font-['Rajdhani']">OMR(KMS)</th>
              <th className="px-3 py-2.5 text-left font-bold text-muted-foreground text-[10px] tracking-wider uppercase whitespace-nowrap font-['Rajdhani']">Model</th>
              <th className="px-3 py-2.5 text-left font-bold text-muted-foreground text-[10px] tracking-wider uppercase whitespace-nowrap font-['Rajdhani']">Status</th>
              <th className="px-3 py-2.5 text-left font-bold text-muted-foreground text-[10px] tracking-wider uppercase whitespace-nowrap font-['Rajdhani']">App Type</th>
              <th className="px-3 py-2.5 text-center font-bold text-muted-foreground text-[10px] tracking-wider uppercase whitespace-nowrap font-['Rajdhani']">Send SMS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-muted-foreground font-sans">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Calendar size={24} className="text-neutral-500 opacity-60" />
                    <p className="text-[12px] font-semibold text-neutral-400">No scheduled appointments for this date</p>
                    <button 
                      onClick={() => setSelectedDate("2026-04-16")} 
                      className="mt-1 text-[11px] text-[#00AAFF] hover:underline font-bold"
                    >
                      Reset to April 16, 2026
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((a, i) => (
                <tr key={a.regNo} onClick={() => setSelected(selected?.regNo === a.regNo ? null : a)}
                  className={`border-b border-border/40 cursor-pointer transition-colors hover:bg-[#1C2A3E]/30 ${selected?.regNo === a.regNo ? "bg-primary/10 border-l-2 border-l-primary" : "bg-transparent"}`}>
                  <td className="px-4 py-3 text-muted-foreground font-bold text-[11.5px]">{i + 1}</td>
                  <td className="px-3 py-3 font-['JetBrains_Mono'] text-[#00AAFF] font-black text-[12.5px] hover:underline cursor-pointer">{a.regNoDisplay || a.regNo}</td>
                  <td className="px-3 py-3 text-foreground font-semibold text-[11.5px] font-['JetBrains_Mono']">{a.timeSlot}</td>
                  <td className="px-3 py-3 text-foreground font-bold text-[11.5px] uppercase whitespace-nowrap">{a.serviceType}</td>
                  <td className="px-3 py-3 text-foreground font-['JetBrains_Mono'] font-bold text-[12px]">{a.omr.toLocaleString()}</td>
                  <td className="px-3 py-3 text-foreground font-bold text-[11.5px]">{a.model}</td>
                  <td className="px-3 py-3 text-neutral-300 font-semibold text-[11px]">{a.status}</td>
                  <td className="px-3 py-3 text-muted-foreground font-semibold text-[10.5px] max-w-[130px] leading-tight whitespace-pre-line">{a.appType || "—"}</td>
                  <td className="px-3 py-3 text-center">
                    <button onClick={(e) => { e.stopPropagation(); openSmsModal(a); }} className="inline-flex items-center justify-center p-1 rounded hover:bg-[#1C2A3E]/80 active:scale-95 transition-all text-[#00AAFF] hover:text-sky-300">
                      <svg className="w-6 h-5 stroke-[1.8]" viewBox="0 0 24 20" fill="none" stroke="currentColor">
                        <line x1="1" y1="6" x2="5" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <line x1="0" y1="10" x2="4" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <line x1="1" y1="14" x2="5" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <rect x="7" y="4" width="15" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M7 6l7.5 5 7.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-primary/20 bg-[#0A1422] mx-4">
            <div className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1 grid grid-cols-3 gap-3 text-[12px]">
                <div className="bg-[#14223A] border border-[rgba(61,142,240,0.15)] rounded-lg p-3 hover:border-primary/45 transition-colors duration-150">
                  <p className="text-[#3A8ADB] text-[9px] uppercase font-bold tracking-wider mb-1">Registration No.</p>
                  <p className="text-[#00AAFF] font-['JetBrains_Mono'] font-bold text-[13px] tracking-wide uppercase">{selected.regNo}</p>
                </div>
                <div className="bg-[#14223A] border border-[rgba(61,142,240,0.15)] rounded-lg p-3 hover:border-primary/45 transition-colors duration-150">
                  <p className="text-[#3A8ADB] text-[9px] uppercase font-bold tracking-wider mb-1">Model / Vehicle</p>
                  <p className="text-white font-bold text-[12.5px] uppercase">{selected.model}</p>
                </div>
                <div className="bg-[#14223A] border border-[rgba(61,142,240,0.15)] rounded-lg p-3 hover:border-primary/45 transition-colors duration-150">
                  <p className="text-[#3A8ADB] text-[9px] uppercase font-bold tracking-wider mb-1">Time Slot / Schedule</p>
                  <p className="text-white font-['JetBrains_Mono'] font-bold text-[12.5px]">{selected.timeSlot}</p>
                </div>
                <div className="bg-[#14223A] border border-[rgba(61,142,240,0.15)] rounded-lg p-3 hover:border-primary/45 transition-colors duration-150">
                  <p className="text-[#3A8ADB] text-[9px] uppercase font-bold tracking-wider mb-1">Service Type</p>
                  <p className="text-white font-bold text-[12.5px] uppercase">{selected.serviceType}</p>
                </div>
                <div className="bg-[#14223A] border border-[rgba(61,142,240,0.15)] rounded-lg p-3 hover:border-primary/45 transition-colors duration-150">
                  <p className="text-[#3A8ADB] text-[9px] uppercase font-bold tracking-wider mb-1">Odometer Reading</p>
                  <p className="text-white font-['JetBrains_Mono'] font-bold text-[12.5px]">{selected.omr.toLocaleString()} KMS</p>
                </div>
                <div className="bg-[#14223A] border border-[rgba(61,142,240,0.15)] rounded-lg p-3 hover:border-primary/45 transition-colors duration-150">
                  <p className="text-[#3A8ADB] text-[9px] uppercase font-bold tracking-wider mb-1">Application Type</p>
                  <p className="text-white font-bold text-[12.5px] uppercase">{selected.appType || "—"}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => onAction("jc-opening", { regNo: selected.regNo })}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[12px] font-semibold rounded-lg hover:bg-primary/90 transition-all font-['Rajdhani']">
                  <FileText size={13} /> Open JC
                </button>
                <button onClick={() => onAction("vehicle-history", { regNo: selected.regNo })}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1C2A3E] text-foreground text-[12px] font-semibold rounded-lg hover:bg-[#253347] transition-all font-['Rajdhani']">
                  <Car size={13} /> History
                </button>
                <button onClick={() => openSmsModal(selected)} className="flex items-center gap-2 px-4 py-2 bg-[#1C2A3E] text-foreground text-[12px] font-semibold rounded-lg hover:bg-[#253347] transition-all font-['Rajdhani']">
                  <Mail size={13} /> Send SMS
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="text-[11px] text-muted-foreground font-['JetBrains_Mono']">Showing {filtered.length} of {appointmentsList.length} appointments · 21-May-2026</p>

      {/* --- Highly Detailed Add Appointment / Update Appointment Flow Popup --- */}
      <AnimatePresence>
        {showAddPopup && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.96, y: 10 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.96, y: 10 }}
              className="relative w-full max-w-6xl bg-[#0A1422] rounded-lg border border-[rgba(61,142,240,0.15)] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-foreground"
            >
              {/* Top Banner Header - Dark Slate Styling */}
              <div className="bg-[#14223A] border-b border-[rgba(61,142,240,0.15)] text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddPopup(false)} 
                    className="p-1 hover:bg-[#1C2A3E]/70 rounded-full transition-colors text-white"
                  >
                    <ChevronLeft size={20} className="stroke-[2.5px]" />
                  </button>
                </div>
                
                <div className="text-[12px] font-semibold tracking-widest text-[#00AAFF] font-sans">
                  UPDATE APPOINTMENT
                </div>
              </div>

              {/* Sub-header bar of Details & Action Trigger Row */}
              <div className="bg-[#0E1B30] border-b border-[rgba(61,142,240,0.15)] px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-8">
                  {/* Registration No. Box */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#3A8ADB] font-bold uppercase tracking-wide">Registration No.</span>
                    <input 
                      type="text" 
                      value={formData.regNo} 
                      onChange={e => setFormData(p => ({ ...p, regNo: e.target.value.toUpperCase() }))}
                      className="text-[14px] font-bold text-[#00AAFF] uppercase bg-transparent border-none p-0 outline-none w-[110px] font-mono"
                    />
                  </div>

                  {/* Vertical separator */}
                  <div className="hidden md:block border-l border-[rgba(61,142,240,0.15)] h-10"></div>

                  <div className="hidden md:flex flex-col items-start w-auto">
                    <span className="text-[10px] font-extrabold tracking-wide text-[#3A8ADB] uppercase mb-1">
                      CUSTOMER & VEHICLE DETAILS
                    </span>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={formData.date1} 
                        onChange={e => setFormData(p => ({ ...p, date1: e.target.value }))}
                        className="text-[11px] bg-[#14223A] border border-[rgba(61,142,240,0.15)] text-foreground font-mono rounded px-2.5 py-1 outline-none w-[130px]"
                      />
                      <div className="relative flex items-center bg-[#14223A] border border-[rgba(61,142,240,0.15)] rounded px-2.5 py-1">
                        <input 
                          type="text" 
                          value={formData.date2} 
                          onChange={e => setFormData(p => ({ ...p, date2: e.target.value }))}
                          className="text-[11px] bg-transparent text-foreground font-mono outline-none w-[115px] mr-1"
                        />
                        <Calendar size={12} className="text-[#00AAFF] cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Big Number and Details */}
                  <div className="flex items-center gap-6">
                    <span className="text-[32px] font-light text-[#3A8ADB] leading-none">0</span>
                    <button type="button" className="text-[10px] text-[#00AAFF] hover:text-sky-300 font-bold uppercase tracking-wide transition-all">
                      VIEW DETAILS
                    </button>
                  </div>
                  
                  {/* Blue Pill Appointment Button */}
                  <button 
                    onClick={handleAddSubmit}
                    className="px-5 py-2 bg-[#00AAFF] hover:bg-[#009beb] text-white text-[10.5px] tracking-wider font-extrabold uppercase rounded-full shadow-lg transition-all duration-150"
                  >
                    UPDATE APPOINTMENT
                  </button>
                </div>
              </div>

              {/* Editable Body layout with specific NEXA-styled cards */}
              <div className="flex-1 overflow-y-auto p-4 md:p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* COLUMN 1 (4/12 width) - Service Details */}
                <div className="md:col-span-4 bg-[#14223A] rounded-lg border border-[rgba(61,142,240,0.15)] p-5 flex flex-col">
                  <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-[#00AAFF] text-center pb-3 font-sans border-b border-[rgba(61,142,240,0.15)] mb-4">
                    Service Details
                  </h3>
                  
                  <div className="flex flex-col gap-4">
                    {/* LAST ATTENDED SM */}
                    <div className="border-b border-[rgba(61,142,240,0.15)] pb-1.5">
                      <label className="block text-[9px] font-bold text-[#3A8ADB] uppercase tracking-wider">
                        LAST ATTENDED SM
                      </label>
                      <div className="text-[12px] text-foreground font-bold py-1">
                        {formData.lastAttendedSm || "PARVEEN KUMAR"}
                      </div>
                    </div>

                    {/* CURRENT SM * with red star */}
                    <div className="border-b border-[rgba(61,142,240,0.15)] pb-1.5 relative">
                      <label className="block text-[9px] font-bold text-[#3A8ADB] uppercase tracking-wider">
                        CURRENT SM <span className="text-red-550 font-bold">*</span>
                      </label>
                      <select 
                        value={formData.currentSm}
                        onChange={e => setFormData(p => ({ ...p, currentSm: e.target.value }))}
                        className="w-full text-[12px] bg-transparent text-foreground font-bold py-1 outline-none appearance-none pr-6 cursor-pointer"
                      >
                        <option value="VISHAL YADAV" className="bg-[#14223A] text-white">VISHAL YADAV</option>
                        <option value="PARVEEN KUMAR" className="bg-[#14223A] text-white">PARVEEN KUMAR</option>
                        <option value="AMAN VASHIST" className="bg-[#14223A] text-white">AMAN VASHIST</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-1 bottom-2.5 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* SLOT * with red star */}
                    <div className="border-b border-[rgba(61,142,240,0.15)] pb-1.5 relative">
                      <label className="block text-[9px] font-bold text-[#3A8ADB] uppercase tracking-wider">
                        SLOT <span className="text-red-550 font-bold">*</span>
                      </label>
                      <select 
                        value={formData.slot}
                        onChange={e => setFormData(p => ({ ...p, slot: e.target.value }))}
                        className="w-full text-[12px] bg-transparent text-foreground font-bold py-1 outline-none appearance-none pr-6 cursor-pointer"
                      >
                        <option value="-Select-" className="bg-[#14223A] text-white">-Select-</option>
                        <option value="08:15–08:30" className="bg-[#14223A] text-white">08:15–08:30</option>
                        <option value="09:15–09:30" className="bg-[#14223A] text-white">09:15–09:30</option>
                        <option value="10:30–10:45" className="bg-[#14223A] text-white">10:30–10:45</option>
                        <option value="11:45–12:00" className="bg-[#14223A] text-white">11:45–12:00</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-1 bottom-2.5 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* TIME * with red star */}
                    <div className="border-b border-[rgba(61,142,240,0.15)] pb-1.5 relative">
                      <label className="block text-[9px] font-bold text-[#3A8ADB] uppercase tracking-wider">
                        TIME <span className="text-red-550 font-bold">*</span>
                      </label>
                      <select 
                        value={formData.timeSlot}
                        onChange={e => setFormData(p => ({ ...p, timeSlot: e.target.value }))}
                        className="w-full text-[12px] bg-transparent text-foreground font-bold py-1 outline-none appearance-none pr-6 cursor-pointer"
                      >
                        <option value="-Select-" className="bg-[#14223A] text-white">-Select-</option>
                        <option value="08:15" className="bg-[#14223A] text-white">08:15</option>
                        <option value="09:15" className="bg-[#14223A] text-white">09:15</option>
                        <option value="10:30" className="bg-[#14223A] text-white">10:30</option>
                        <option value="11:45" className="bg-[#14223A] text-white">11:45</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-1 bottom-2.5 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* REMARKS(IF NOT SELECTED PREVIOUS SA) * */}
                    <div className="border-b border-[rgba(61,142,240,0.15)] pb-1.5">
                      <label className="block text-[9px] font-bold text-[#3A8ADB] uppercase tracking-wider">
                        REMARKS(IF NOT SELECTED PREVIOUS SA) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={formData.remarks}
                        onChange={e => setFormData(p => ({ ...p, remarks: e.target.value }))}
                        className="w-full text-[12px] bg-transparent text-foreground font-bold py-1 outline-none" 
                      />
                    </div>

                    {/* OMR(KMS) * with red star */}
                    <div className="border-b border-[rgba(61,142,240,0.15)] pb-1.5">
                      <label className="block text-[9px] font-bold text-[#3A8ADB] uppercase tracking-wider">
                        OMR(KMS) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={formData.omr}
                        onChange={e => setFormData(p => ({ ...p, omr: e.target.value }))}
                        className="w-full text-[12px] bg-transparent text-[#00AAFF] font-mono font-bold py-1 outline-none" 
                      />
                    </div>

                    {/* SERVICE TYPE * */}
                    <div className="border-b border-[rgba(61,142,240,0.15)] pb-1.5 relative">
                      <label className="block text-[9px] font-bold text-[#3A8ADB] uppercase tracking-wider">
                        SERVICE TYPE <span className="text-[#00AAFF] font-bold">*</span>
                      </label>
                      <select 
                        value={formData.serviceType}
                        onChange={e => setFormData(p => ({ ...p, serviceType: e.target.value }))}
                        className="w-full text-[12px] bg-transparent text-foreground font-bold py-1 outline-none appearance-none pr-6 cursor-pointer"
                      >
                        <option value="PAID SERVICE" className="bg-[#14223A] text-white">PAID SERVICE</option>
                        <option value="2ND FREE SERVICE" className="bg-[#14223A] text-white">2ND FREE SERVICE</option>
                        <option value="3RD FREE SERVICE" className="bg-[#14223A] text-white">3RD FREE SERVICE</option>
                        <option value="RUNNING REPAIR" className="bg-[#14223A] text-white">RUNNING REPAIR</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-1 bottom-2.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* COLUMN 2 (4/12 width) - Available SM & Vehicle Details */}
                <div className="md:col-span-4 flex flex-col gap-5">
                  {/* Available SM */}
                  <div className="bg-[#14223A] rounded-lg border border-[rgba(61,142,240,0.15)] p-5 flex flex-col">
                    <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-[#00AAFF] text-center pb-3 font-sans border-b border-[rgba(61,142,240,0.15)] mb-3">
                      Available SM
                    </h3>
                    <div className="flex flex-col gap-3 text-[11px] py-1 font-mono font-medium">
                      <div className="flex justify-between items-center text-[#00AAFF] hover:underline cursor-pointer">
                        <span>AMAN VASHIST</span>
                        <span className="text-muted-foreground font-extrabold">N/A</span>
                      </div>
                      <div className="flex justify-between items-center text-[#00AAFF] hover:underline cursor-pointer">
                        <span>ATUL</span>
                        <span className="text-muted-foreground font-extrabold">N/A</span>
                      </div>
                      <div className="flex justify-between items-center text-[#00AAFF] hover:underline cursor-pointer">
                        <span>GAJENDER SINGH</span>
                        <span className="text-muted-foreground font-extrabold">N/A</span>
                      </div>
                    </div>
                    
                    <button type="button" className="text-[#3A8ADB] font-black uppercase tracking-wider text-[9px] text-right mt-2 hover:text-[#00AAFF] transition-colors font-sans">
                      VIEW ALL
                    </button>
                  </div>

                  {/* Vehicle Details */}
                  <div className="bg-[#14223A] rounded-lg border border-[rgba(61,142,240,0.15)] p-5 flex flex-col gap-4">
                    <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-[#00AAFF] text-center pb-3 font-sans border-b border-[rgba(61,142,240,0.15)] mb-1">
                      Vehicle Details
                    </h3>
                    
                    <div>
                      <span className="block text-[8.5px] font-bold text-[#3A8ADB] uppercase tracking-wider mb-0.5">MODEL</span>
                      <input 
                        type="text" 
                        value={formData.model}
                        onChange={e => setFormData(p => ({ ...p, model: e.target.value }))}
                        className="w-full text-[12px] bg-transparent text-foreground font-bold outline-none border-b border-dashed border-[rgba(61,142,240,0.15)] pb-1" 
                      />
                    </div>

                    <div>
                      <span className="block text-[8.5px] font-bold text-[#3A8ADB] uppercase tracking-wider mb-0.5">VARIANT</span>
                      <input 
                        type="text" 
                        value={formData.variant}
                        onChange={e => setFormData(p => ({ ...p, variant: e.target.value }))}
                        className="w-full text-[12px] bg-transparent text-foreground font-bold outline-none border-b border-dashed border-[rgba(61,142,240,0.15)] pb-1" 
                      />
                    </div>

                    <div>
                      <span className="block text-[8.5px] font-bold text-[#3A8ADB] uppercase tracking-wider mb-0.5">VIN</span>
                      <input 
                        type="text" 
                        value={formData.vin}
                        onChange={e => setFormData(p => ({ ...p, vin: e.target.value.toUpperCase() }))}
                        className="w-full text-[12px] bg-transparent text-foreground font-mono font-bold outline-none border-b border-dashed border-[rgba(61,142,240,0.15)] pb-1" 
                      />
                    </div>

                    <div>
                      <span className="block text-[8.5px] font-bold text-[#3A8ADB] uppercase tracking-wider mb-0.5">CUSTOMER CATEGORY</span>
                      <div className="text-[12.5px] text-[#00AAFF] font-bold uppercase font-mono">
                        {formData.customerCategory}
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 3 (4/12 width) - Customer Details */}
                <div className="md:col-span-4 bg-[#14223A] rounded-lg border border-[rgba(61,142,240,0.15)] p-5 flex flex-col gap-4">
                  <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-[#00AAFF] text-center pb-3 font-sans border-b border-[rgba(61,142,240,0.15)] mb-1">
                    Customer Details
                  </h3>
                  
                  <div>
                    <label className="block text-[8.5px] font-bold text-[#3A8ADB] uppercase tracking-wider mb-0.5">
                      CUSTOMER NAME
                    </label>
                    <input 
                      type="text" 
                      value={formData.customerName}
                      onChange={e => setFormData(p => ({ ...p, customerName: e.target.value }))}
                      className="w-full text-[12.5px] bg-transparent text-foreground font-bold outline-none border-b border-dashed border-[rgba(61,142,240,0.15)] pb-1" 
                    />
                  </div>

                  <div>
                    <label className="block text-[8.5px] font-bold text-[#3A8ADB] uppercase tracking-wider mb-0.5">
                      MOBILE NO.1
                    </label>
                    <div className="relative flex items-center justify-between border-b border-dashed border-[rgba(61,142,240,0.15)] pb-1">
                      <input 
                        type="text" 
                        value={formData.mobile1}
                        onChange={e => setFormData(p => ({ ...p, mobile1: e.target.value }))}
                        className="w-full text-[12.5px] bg-transparent text-foreground font-mono font-bold outline-none pr-16" 
                      />
                      <div className="absolute right-0 flex items-center gap-1 text-green-400 rounded text-[9px] font-extrabold tracking-wide uppercase">
                        <Check size={10} className="stroke-[3.5px]" /> Verified
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8.5px] font-bold text-[#3A8ADB] uppercase tracking-wider mb-0.5">
                      MOBILE NO.2
                    </label>
                    <input 
                      type="text" 
                      value={formData.mobile2}
                      onChange={e => setFormData(p => ({ ...p, mobile2: e.target.value }))}
                      className="w-full text-[12.5px] bg-transparent text-foreground font-bold outline-none border-b border-dashed border-[rgba(61,142,240,0.15)] pb-1" 
                    />
                  </div>

                  <div>
                    <label className="block text-[8.5px] font-bold text-[#3A8ADB] uppercase tracking-wider mb-0.5">
                      EMAIL
                    </label>
                    <input 
                      type="text" 
                      value={formData.email}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      className="w-full text-[12px] bg-transparent text-foreground font-bold outline-none border-b border-dashed border-[rgba(61,142,240,0.15)] pb-1" 
                    />
                  </div>

                  <div>
                    <label className="block text-[8.5px] font-bold text-[#3A8ADB] uppercase tracking-wider mb-0.5">
                      ADDRESS
                    </label>
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                      className="w-full text-[12px] bg-transparent text-foreground font-bold outline-none border-b border-dashed border-[rgba(61,142,240,0.15)] pb-1" 
                    />
                  </div>

                  <div>
                    <label className="block text-[8.5px] font-bold text-[#3A8ADB] uppercase tracking-wider mb-0.5">
                      STATE
                    </label>
                    <input 
                      type="text" 
                      value={formData.state}
                      onChange={e => setFormData(p => ({ ...p, state: e.target.value }))}
                      className="w-full text-[12.5px] bg-transparent text-foreground font-bold outline-none border-b border-dashed border-[rgba(61,142,240,0.15)] pb-1" 
                    />
                  </div>

                  <div>
                    <label className="block text-[8.5px] font-bold text-[#3A8ADB] uppercase tracking-wider mb-0.5">
                      CITY
                    </label>
                    <input 
                      type="text" 
                      value={formData.city}
                      onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                      className="w-full text-[12.5px] bg-transparent text-foreground font-bold outline-none border-b border-dashed border-[rgba(61,142,240,0.15)] pb-1" 
                    />
                  </div>
                </div>

              </div>

              {/* Form Bottom Bar - Dark Theme Styling */}
              <div className="bg-[#0E1B30] px-6 py-3.5 flex justify-end gap-3 border-t border-[rgba(61,142,240,0.15)]">
                <button 
                  type="button" 
                  onClick={() => setShowAddPopup(false)}
                  className="px-5 py-2 text-[#6A8FAB] bg-[#1C2A3E] hover:bg-[#253347] transition-colors rounded font-extrabold uppercase text-[11px] font-sans tracking-wide"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddSubmit}
                  className="px-6 py-2 bg-[#00AAFF] hover:bg-[#009beb] text-white rounded font-extrabold uppercase text-[11px] font-sans tracking-wide transition-all"
                >
                  Create Appointment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NEXA High-Precision SMS Dispatcher Overlay ── */}
      <AnimatePresence>
        {smsApp && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-[#0A1422] rounded-2xl border border-[rgba(61,142,240,0.25)] overflow-hidden shadow-2xl flex flex-col text-foreground font-sans text-left"
            >
              {/* Top Banner */}
              <div className="bg-[#14223A] border-b border-[rgba(61,142,240,0.15)] text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00AAFF] animate-pulse" />
                  <span className="text-[13px] font-extrabold uppercase tracking-widest font-serif text-white">N E X A &nbsp; S M S &nbsp; C E N T E R</span>
                </div>
                <button 
                  onClick={() => setSmsApp(null)} 
                  className="text-neutral-400 hover:text-white transition-colors text-[20px] leading-none"
                >
                  &times;
                </button>
              </div>

              {/* Success Screen state */}
              {smsSuccess ? (
                <div className="p-8 flex flex-col items-center justify-center text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 mb-4 animate-bounce">
                    <Check size={32} className="stroke-[3]" />
                  </div>
                  <h3 className="text-[18px] font-bold text-white uppercase tracking-wider mb-2">Message Dispatched</h3>
                  <p className="text-neutral-400 text-[12.5px] max-w-xs leading-relaxed">
                    The SMS has been successfully transmitted via Nexa SMS gateway to <span className="text-[#00AAFF] font-semibold">{smsPhone}</span>.
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-4 font-mono">Payload Reference: SMS_OK_200</p>
                </div>
              ) : (
                <div className="p-5 flex flex-col gap-4">
                  
                  {/* Recipient summary cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#14223A]/60 border border-[rgba(61,142,240,0.1)] rounded-xl p-3">
                      <p className="text-[#3A8ADB] text-[9.5px] uppercase font-bold tracking-wider mb-1">RECIPIENT CLIENT</p>
                      <p className="text-white font-bold text-[13px] tracking-wide uppercase">{smsClientName}</p>
                    </div>
                    <div className="bg-[#14223A]/60 border border-[rgba(61,142,240,0.1)] rounded-xl p-3">
                      <p className="text-[#3A8ADB] text-[9.5px] uppercase font-bold tracking-wider mb-1">TARGET MOBILE</p>
                      <input 
                        type="text" 
                        value={smsPhone} 
                        onChange={(e) => setSmsPhone(e.target.value)}
                        className="bg-transparent text-[#00AAFF] font-['JetBrains_Mono'] font-bold text-[13px] outline-none border-b border-dashed border-primary/30 w-full"
                      />
                    </div>
                  </div>

                  {/* Template Selectors */}
                  <div>
                    <label className="block text-[9.5px] font-bold text-[#3A8ADB] uppercase tracking-wider mb-2">SELECT COMM TEMPLATE</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "reminder", label: "Reminder", desc: "Appointment Schedule Slot" },
                        { id: "ready", label: "Ready", desc: "Vehicle Serviced & Ready" },
                        { id: "parts", label: "Parts Enquiry", desc: "Service Parts updates" }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleTemplateChange(smsApp, t.id)}
                          className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between h-[65px] ${
                            selectedTemplate === t.id 
                              ? "bg-primary/20 border-primary text-white" 
                              : "bg-[#14223A]/30 border-border/40 text-neutral-400 hover:bg-[#1C2A3E]/40"
                          }`}
                        >
                          <span className={`text-[12px] font-bold ${selectedTemplate === t.id ? "text-[#00AAFF]" : "text-white"}`}>
                            {t.label}
                          </span>
                          <span className="text-[9px] leading-tight text-neutral-400 font-sans">{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom draft preview box */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[9.5px] font-bold text-[#3A8ADB] uppercase tracking-wider">SMS TRANSMISSION PAYLOAD</label>
                      <span className="text-[9.5px] font-mono text-neutral-400">{smsText.length} Characters</span>
                    </div>
                    <textarea
                      rows={4}
                      value={smsText}
                      onChange={(e) => setSmsText(e.target.value)}
                      className="w-full bg-[#0D1828] border border-border/50 rounded-xl p-3.5 text-[12px] text-[#E2E8F0] leading-relaxed outline-none focus:border-primary/65 resize-none font-sans"
                    />
                  </div>

                  {/* Buttons footer */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSmsApp(null)}
                      className="px-4 py-2 text-[#6A8FAB] bg-[#1C2A3E] hover:bg-[#253347] transition-all rounded-lg font-extrabold uppercase text-[10.5px] tracking-wider"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={sendSmsTrigger}
                      disabled={smsLoading || !smsText}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#00AAFF] to-primary hover:opacity-95 text-white active:scale-[0.98] transition-all rounded-lg font-extrabold uppercase text-[10.5px] tracking-wider disabled:opacity-50"
                    >
                      {smsLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Broadcasting...
                        </>
                      ) : (
                        <>
                          <Mail size={13} />
                          Transmit SMS
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Vehicle History Panel ─────────────────────────────────────────────────────
function PlateScanner({ onScan, onClose }: { onScan: (res: string) => void, onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [isSimulated, setIsSimulated] = useState(false);
  const [scanningStatus, setScanningStatus] = useState("Initializing camera sensor...");
  const [selectedSimPlate, setSelectedSimPlate] = useState("DL6CR1517");
  const [simProgress, setSimProgress] = useState(0);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let fallbackTimeout: number;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play().catch(() => {});
        }
        setScanningStatus("Align vehicle plate in focus frame...");
        
        fallbackTimeout = window.setTimeout(() => {
          onScan(selectedSimPlate);
        }, 3200);
      })
      .catch(err => {
        setIsSimulated(true);
        setScanningStatus("Iframe sandbox constraint. Activating Optical HUD simulation...");
      });

    return () => {
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [selectedSimPlate, onScan]);

  // Handle simulation countdown and progress bar
  useEffect(() => {
    if (!isSimulated) return;

    setSimProgress(0);
    const interval = setInterval(() => {
      setSimProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onScan(selectedSimPlate);
          }, 300);
          return 100;
        }
        return p + 4;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isSimulated, selectedSimPlate, onScan]);

  // Stage text logs based on progress
  useEffect(() => {
    if (!isSimulated) return;
    if (simProgress < 25) {
      setScanningStatus("CONNECTING COGNITIVE WEBCAM MATRIX...");
    } else if (simProgress < 55) {
      setScanningStatus("LOCALIZING PLATE CONTOURS...");
    } else if (simProgress < 85) {
      setScanningStatus("RUNNING CHARACTER RECOGNITION (OCR)...");
    } else {
      setScanningStatus(`SUCCESS — RECOGNIZED PLATE: ${selectedSimPlate}`);
    }
  }, [simProgress, selectedSimPlate, isSimulated]);

  return (
    <div className="p-4 rounded-xl border border-[rgba(61,142,240,0.18)] bg-[#0B121F] flex flex-col gap-3 relative max-w-full w-full mx-auto shadow-2xl">
      <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
        <span className="text-[12px] font-bold text-foreground font-['Rajdhani'] uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
          <Camera size={13} className="text-primary" /> 
          {isSimulated ? "Optical HUD OCR Simulator" : "License Plate OCR Scanner"}
        </span>
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-white rounded hover:bg-[#1C2A3E] cursor-pointer transition-colors" title="Close"><X size={14} /></button>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-border/80 bg-[#040811] aspect-video flex flex-col items-center justify-center min-h-[170px]">
        {/* Unifying standard overlays across BOTH simulated & raw feed */}
        
        {/* 1. Global Scan Ambient Tech grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,30,55,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(18,30,55,0.05)_1px,transparent_1px)] bg-[size:14px_14px] opacity-75 pointer-events-none z-10" />

        {/* 2. Scanning View Feed (The Base Layer) */}
        {isSimulated ? (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-[#060B16] to-[#03060C]">
            {/* Simulated plate target card */}
            <div className="relative z-10 flex flex-col items-center justify-center p-3">
              {/* High-Contrast Plate UI mimicking standard license plates */}
              <div className="px-5 py-2.5 bg-yellow-400 text-black border-2 border-yellow-500 rounded font-bold font-mono tracking-widest text-center shadow-[0_4px_12px_rgba(250,204,21,0.25)] flex flex-col items-center select-none leading-none scale-105">
                <span className="text-[8px] tracking-wide text-black/60 uppercase font-black">IND</span>
                <span className="text-base text-black mt-0.5">{selectedSimPlate}</span>
              </div>
            </div>
            
            {/* Bottom notification banner */}
            <div className="absolute bottom-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3 py-1 text-[9px] rounded-md font-['Rajdhani'] font-semibold backdrop-blur-sm z-20">
              ℹ️ Sandbox Iframe Constraints Active — Running HUD Emulator Flow
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
          </div>
        )}

        {/* 3. High-Contrast Overlay Frame Alignment Guide & Laser Sweeper (Shared overlay) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-12 pointer-events-none select-none">
          {/* Top telemetry lines */}
          <div className="absolute top-2.5 left-3 right-3 flex justify-between text-[8px] font-mono text-primary/60 tracking-wider">
            <span>SYS_CAM: ACTIVE_FEED_1080P</span>
            <span className="animate-pulse">STATUS: {isSimulated ? "SIMULATED_DEVICES" : "LIVE_SENSOR_STABLE"}</span>
          </div>

          {/* Letterbox dark overlays to frame the license plate spotlight */}
          <div className="absolute top-0 inset-x-0 h-[22%] bg-black/65 border-b border-primary/10 flex items-center justify-center">
            <span className="text-[9px] text-primary/50 tracking-widest font-mono select-none uppercase font-bold">ALIGN LICENSE PLATE CENTER</span>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-[22%] bg-black/65 border-t border-primary/10" />
          <div className="absolute top-[22%] bottom-[22%] left-0 w-[10%] bg-black/65" />
          <div className="absolute top-[22%] bottom-[22%] right-0 w-[10%] bg-black/65" />

          {/* Inner focal alignment zone (The bounding box visual guide) */}
          <div className="relative w-[80%] h-[56%] border border-primary/30 rounded-lg flex flex-col justify-between p-2 shadow-[0_0_20px_rgba(61,142,240,0.15)] bg-primary/2">
            
            {/* Corner Bracket Elements matching focus target alignment */}
            <div className="absolute -top-[1.5px] -left-[1.5px] w-4 h-4 border-t-2 border-l-2 border-[#4ADE80] rounded-tl shadow-[0_0_8px_rgba(74,222,128,0.5)] transition-all duration-300 animate-pulse" />
            <div className="absolute -top-[1.5px] -right-[1.5px] w-4 h-4 border-t-2 border-r-2 border-[#4ADE80] rounded-tr shadow-[0_0_8px_rgba(74,222,128,0.5)] transition-all duration-300 animate-pulse" />
            <div className="absolute -bottom-[1.5px] -left-[1.5px] w-4 h-4 border-b-2 border-l-2 border-[#4ADE80] rounded-bl shadow-[0_0_8px_rgba(74,222,128,0.5)] transition-all duration-300 animate-pulse" />
            <div className="absolute -bottom-[1.5px] -right-[1.5px] w-4 h-4 border-b-2 border-r-2 border-[#4ADE80] rounded-br shadow-[0_0_8px_rgba(74,222,128,0.5)] transition-all duration-300 animate-pulse" />

            {/* Central crosshair alignment aid */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center opacity-30">
              <div className="w-5 h-0.5 bg-primary rounded-full absolute" />
              <div className="h-5 w-0.5 bg-primary rounded-full absolute" />
            </div>

            {/* Guide markers or text indicators side labels inside alignment scope */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[7px] font-mono text-primary/50 flex flex-col gap-0.5">
              <span>L_ALIGN</span>
              <span>- - - - -</span>
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[7px] font-mono text-primary/50 text-right flex flex-col gap-0.5">
              <span>R_ALIGN</span>
              <span>- - - - -</span>
            </div>

            {/* Progress Bar inside HUD (Displays character recognition percentage dynamically) */}
            <div className="mt-auto w-full z-10 flex flex-col gap-0.5 max-w-[200px] mx-auto bg-black/75 px-2.5 py-1 rounded border border-primary/20 backdrop-blur-sm">
              <div className="flex justify-between text-[7.5px] font-mono text-primary font-bold">
                <span>OCR ANALYSIS</span>
                <span>{isSimulated ? `${simProgress}%` : "READY"}</span>
              </div>
              <div className="w-full h-1 bg-[#142035] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#4ADE80] shadow-[0_0_6px_#4ADE80]" 
                  style={{ 
                    width: isSimulated ? `${simProgress}%` : '100%', 
                    transition: isSimulated ? 'width 0.1s linear' : 'none' 
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Glowing Animated Lateral Sweeper (The laser sweep scanning line!) */}
          <div 
            className="absolute inset-x-0 h-0.5 bg-primary shadow-[0_0_12px_rgba(61,142,240,1)] z-20 pointer-events-none"
            style={{ 
              top: isSimulated 
                ? `${Math.sin((simProgress / 100) * Math.PI) * 45 + 50}%` 
                : 'auto',
              animation: isSimulated ? undefined : 'laserPulse 2s ease-in-out infinite alternate'
            }} 
          />
        </div>
      </div>

      {/* Embedded CSS custom laser Pulse animations for global usage */}
      <style>{`
        @keyframes laserPulse {
          0% { top: 22%; opacity: 0.3; }
          50% { opacity: 0.95; }
          100% { top: 78%; opacity: 0.3; }
        }
      `}</style>

      <div className="bg-[#1C2A3E]/50 p-2.5 rounded-lg border border-border/40 text-center">
        <p className="text-[11px] text-muted-foreground font-semibold font-['Rajdhani'] flex items-center justify-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          {scanningStatus}
        </p>
      </div>

      <div className="flex flex-col gap-1.5 mt-1 border-t border-border pt-2.5">
        <p className="text-[10px] text-muted-foreground/80 uppercase font-bold font-['Rajdhani'] tracking-widest text-left">Click a vehicle below to target & scan instantly:</p>
        <div className="flex gap-2">
          {["DL6CR1517", "HR26DS6144"].map(plate => (
            <button 
              key={plate} 
              onClick={() => {
                setSelectedSimPlate(plate);
                if (isSimulated) setSimProgress(0); // restart progress bar with new target
              }} 
              className={`px-3 py-1.5 border font-['JetBrains_Mono'] text-[11.5px] rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${selectedSimPlate === plate ? 'bg-primary/20 border-primary text-primary font-bold' : 'bg-[#1C2A3E] border-border/80 text-foreground hover:border-primary/50'}`}
            >
              🚗 {plate}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function VehicleHistoryPanel({ initialReg }: { initialReg?: string }) {
  const [regNo, setRegNo] = useState(initialReg || "")
  const [searched, setSearched] = useState(!!initialReg)
  const [yearFilter, setYearFilter] = useState<"2" | "5" | "5+">("2")
  const [showConfirm, setShowConfirm] = useState<"5" | "5+" | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<VehicleRecord | null>(null)
  
  // Camera scanning state variable
  const [isScanningPlate, setIsScanningPlate] = useState(false)

  const vehicleData = VEHICLE_HISTORY[regNo.toUpperCase()]
  const allRecords = vehicleData?.records || []
  const now = new Date()
  const cutoffs = { "2": 2, "5": 5, "5+": 100 }
  const records = allRecords.filter(r => {
    const year = parseInt(r.date.slice(-4))
    const diff = now.getFullYear() - year
    if (yearFilter === "5+") return diff > 5
    return diff <= cutoffs[yearFilter]
  })

  function handleSearch() {
    if (regNo.trim().length < 4) return
    setSearched(true); setSelectedRecord(null)
  }

  // Handle immediate search after updating via effects if needed
  const triggerScanDone = (scannedPlate: string) => {
    setRegNo(scannedPlate);
    setSearched(true);
    setSelectedRecord(null);
    setIsScanningPlate(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {isScanningPlate ? (
        <PlateScanner onScan={triggerScanDone} onClose={() => setIsScanningPlate(false)} />
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={regNo} onChange={e => setRegNo(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Enter Reg No or VIN…"
              className="w-full pl-8 pr-3 py-2.5 text-[13px] bg-[#1C2A3E] border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 font-['JetBrains_Mono'] uppercase" />
          </div>
          
          <button onClick={() => setIsScanningPlate(true)} id="plate-camera-trigger"
            className="px-4 py-2.5 bg-[#1C2A3E] border border-border text-primary hover:text-white hover:bg-[#253347] text-[13px] font-bold rounded-lg transition-all font-['Rajdhani'] flex items-center gap-1.5 cursor-pointer"
            title="Scan License Plate using Camera">
            <Camera size={14} /> SCAN
          </button>
          
          <button onClick={handleSearch}
            className="px-5 py-2.5 bg-primary text-white text-[13px] font-bold rounded-lg hover:bg-primary/90 transition-all font-['Rajdhani'] cursor-pointer">GO</button>
        </div>
      )}
      {searched && !vehicleData && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-[#2A0D0D]/40 border border-[#F87171]/20 text-[#F87171] text-[13px]">
          <AlertTriangle size={15} /> Invalid registration number. Please check and try again.
        </div>
      )}
      {searched && vehicleData && (
        <>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#1C2A3E]/50 border border-border">
            <div className="flex gap-6 text-[12px]">
              <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide">Reg No</p>
                <p className="text-primary font-['JetBrains_Mono'] font-medium">{regNo.toUpperCase()}</p></div>
              <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide">Model</p>
                <p className="text-foreground">{vehicleData.model}</p></div>
              <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide">VIN</p>
                <p className="text-foreground font-['JetBrains_Mono']">{vehicleData.vin}</p></div>
              <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide">Records</p>
                <p className="text-foreground font-['JetBrains_Mono']">{allRecords.length} total</p></div>
            </div>
            <div className="relative">
              <select value={yearFilter} onChange={e => {
                const val = e.target.value as "2" | "5" | "5+"
                if (val !== "2") setShowConfirm(val); else setYearFilter("2")
              }}
                className="appearance-none px-3 py-1.5 pr-7 text-[12px] bg-[#1C2A3E] border border-border rounded-lg text-foreground outline-none font-['Rajdhani'] font-semibold cursor-pointer">
                <option value="2">Last 2 Years</option>
                <option value="5">Last 5 Years</option>
                <option value="5+">More than 5 Years</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <AnimatePresence>
            {showConfirm && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                className="p-3 rounded-xl bg-[#1A1A0D]/60 border border-[#FACC15]/20 flex items-center justify-between text-[12px]">
                <p className="text-[#FACC15]">Fetching {showConfirm === "5+" ? "history older than 5 years" : "last 5 years"} may include third-party records. Confirm?</p>
                <div className="flex gap-2">
                  <button onClick={() => { setYearFilter(showConfirm); setShowConfirm(null) }}
                    className="px-3 py-1 bg-[#FACC15]/20 border border-[#FACC15]/30 text-[#FACC15] rounded-lg font-semibold font-['Rajdhani']">Confirm</button>
                  <button onClick={() => setShowConfirm(null)}
                    className="px-3 py-1 bg-[#1C2A3E] text-muted-foreground rounded-lg font-['Rajdhani']">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-[13px]">No Vehicle History Available for selected period.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="border-b border-border bg-[#1C2A3E]/60">
                    {["#", "Service Date", "Service Type", "Mileage", "Dealer / Description"].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-muted-foreground font-['Rajdhani'] text-[11px] tracking-wide uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i} onClick={() => setSelectedRecord(selectedRecord?.jcNo === r.jcNo ? null : r)}
                      className={`border-b border-border/50 cursor-pointer transition-colors hover:bg-[#1C2A3E]/40 ${selectedRecord?.jcNo === r.jcNo ? "bg-primary/8 border-l-2 border-l-primary" : ""}`}>
                      <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2.5 text-primary font-['JetBrains_Mono'] font-medium">{r.date}</td>
                      <td className="px-3 py-2.5 text-foreground whitespace-nowrap">{r.serviceType}</td>
                      <td className="px-3 py-2.5 text-foreground font-['JetBrains_Mono']">{r.mileage.toLocaleString()} km</td>
                      <td className="px-3 py-2.5 text-foreground">{r.dealer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AnimatePresence>
            {selectedRecord && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-xl border border-primary/20 bg-[#0A1422] p-4 mt-3">
                <p className="text-[11px] text-muted-foreground uppercase font-['Rajdhani'] font-semibold tracking-wide mb-3">JC Details — {selectedRecord.jcNo}</p>
                <div className="grid grid-cols-3 gap-3 text-[12px] mb-3">
                  <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide mb-0.5">JC Number</p>
                    <p className="text-primary font-['JetBrains_Mono']">{selectedRecord.jcNo}</p></div>
                  <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide mb-0.5">Service Type</p>
                    <p className="text-foreground">{selectedRecord.serviceType}</p></div>
                  <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide mb-0.5">Mileage at Visit</p>
                    <p className="text-foreground font-['JetBrains_Mono']">{selectedRecord.mileage.toLocaleString()} km</p></div>
                </div>
                <div className="text-[12px] mb-3">
                  <p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide mb-0.5">Dealer</p>
                  <p className="text-foreground">{selectedRecord.dealer}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2A3E] text-foreground text-[11px] font-semibold rounded-lg hover:bg-[#253347] font-['Rajdhani']"><Eye size={12} /> View JC</button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2A3E] text-foreground text-[11px] font-semibold rounded-lg hover:bg-[#253347] font-['Rajdhani']"><Download size={12} /> Download</button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2A3E] text-foreground text-[11px] font-semibold rounded-lg hover:bg-[#253347] font-['Rajdhani']"><Printer size={12} /> Print</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      {!searched && (
        <p className="text-[12px] text-muted-foreground">Try: <span className="text-primary font-['JetBrains_Mono'] cursor-pointer" onClick={() => { setRegNo("DL6CR1517"); setSearched(true) }}>DL6CR1517</span> or <span className="text-primary font-['JetBrains_Mono'] cursor-pointer" onClick={() => { setRegNo("HR26DS6144"); setSearched(true) }}>HR26DS6144</span></p>
      )}
    </div>
  )
}

// ── JC Opening Panel ─────────────────────────────────────────────────────────

function SignaturePad({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#4ADE80"; // NEXA Success Green Accent
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if ('touches' in e) {
      if (e.cancelable) e.preventDefault();
    }

    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if ('touches' in e) {
      if (e.cancelable) e.preventDefault();
    }

    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL());
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-24 rounded-lg border border-[rgba(61,142,240,0.14)] bg-[#070D18] overflow-hidden flex flex-col justify-between">
        <canvas
          ref={canvasRef}
          width={400}
          height={96}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair touch-none"
        />
        {value === null && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/35 text-[11px] uppercase tracking-wider font-semibold font-['Rajdhani']">
            Draw customer signature here
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={clear}
          className="px-2.5 py-1 text-[10px] uppercase tracking-wider bg-[#1C2A3E] text-muted-foreground hover:text-foreground font-bold font-['Rajdhani'] rounded hover:bg-[#253347] transition-all cursor-pointer"
        >
          Clear Pad
        </button>
      </div>
    </div>
  );
}

const STEP_LABELS = ["VIN / Reg", "Details", "Vehicle Status", "Tyre & Battery", "Demands", "Summary"]

function JCOpeningPanel({ initialReg }: { initialReg?: string }) {
  const [step, setStep] = useState(initialReg ? 1 : 0)
  const [regNo, setRegNo] = useState(initialReg || "")
  const [scanned, setScanned] = useState(!!initialReg)
  const [isScanning, setIsScanning] = useState(false)
  const [odometer, setOdometer] = useState("40002")
  const [serviceType, setServiceType] = useState("PAID SERVICE")
  const [fuel, setFuel] = useState(50)
  const [tyre, setTyre] = useState({ fl: "4", fr: "fr", rl: "3", rr: "4" })
  const [battery, setBattery] = useState("Good")
  const [demands, setDemands] = useState(JC_DEMANDS)
  const [showAddDemandRow, setShowAddDemandRow] = useState(false)
  const [newType, setNewType] = useState<"L" | "P">("L")
  const [newDesc, setNewDesc] = useState("")
  const [newCode, setNewCode] = useState("")
  const [newQty, setNewQty] = useState(1)
  const [newPrice, setNewPrice] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)

  const simulateScan = () => { setIsScanning(true) }
  const handleScanComplete = (res: string) => { setRegNo(res); setScanned(true); setIsScanning(false); }
  const fuelLevels = [0, 25, 50, 75, 100]
  const labourTotal = demands.filter(d => d.type === "L").reduce((s, d) => s + d.price * d.qty, 0)
  const partsTotal = demands.filter(d => d.type === "P").reduce((s, d) => s + d.price * d.qty, 0)

  if (submitted) {
    const handleActionClick = (act: 'download' | 'print') => {
      const mockCreatedJC = {
        jcNo: "JC26000512",
        dealer: "PREM MOTORS PVT. LTD., GURGAON-2S(NEXA)",
        dealerMapCode: "PMG2S001",
        visitDate: "21-MAY-2026",
        gateIn: "09:42",
        serviceType: serviceType,
        techName: "VISHAL ADITYA",
        bay: "BAY-04",
        paymentMode: "ONLINE / CASH",
        promisedDate: "21-MAY-2026",
        promisedTime: "06:00 PM",
        customer: {
          name: "RAJAT AGARWAL",
          mobile1: "+91 99110 03322",
          email: "rajat.agarwal@gmail.com",
          address: "DLF Phase 3, Cyber City",
          city: "Gurugram",
          regNo: regNo || "HR26CW7677",
          vin: "MA3YFDS75K008432",
          model: "MARUTI BALENO PETROL",
        },
        demands: demands.map((d, s) => ({ ...d, sno: s + 1 })),
        labour: demands.filter(d => d.type === 'L').map((d, s) => ({
          sno: s + 1,
          code: d.code,
          desc: d.desc,
          qty: d.qty,
          prnHrs: 1.0,
          billableType: "Billable",
          amount: d.price * d.qty
        })),
        parts: demands.filter(d => d.type === 'P').map((d, s) => ({
          sno: s + 1,
          code: d.code,
          desc: d.desc,
          qty: d.qty,
          price: d.price,
          amount: d.price * d.qty
        })),
        odometer: parseInt(odometer) || 40002
      };
      generateJcPdf(mockCreatedJC, act);
    };

    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-8">
        <div className="w-16 h-16 rounded-full bg-[#4ADE80]/20 flex items-center justify-center">
          <CheckCircle size={32} className="text-[#4ADE80]" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground font-['Rajdhani']">Job Card Generated!</p>
          <p className="text-[13px] text-muted-foreground">JC26000512 — {regNo}</p>
          <p className="text-[12px] text-muted-foreground mt-1">OCAS sent to customer for approval</p>
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={() => handleActionClick('print')} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[12px] font-semibold rounded-lg font-['Rajdhani'] cursor-pointer"><Eye size={13} /> View JC</button>
          <button onClick={() => handleActionClick('download')} className="flex items-center gap-2 px-4 py-2 bg-[#1C2A3E] text-foreground text-[12px] font-semibold rounded-lg font-['Rajdhani'] cursor-pointer"><Download size={13} /> Download</button>
          <button onClick={() => handleActionClick('print')} className="flex items-center gap-2 px-4 py-2 bg-[#1C2A3E] text-foreground text-[12px] font-semibold rounded-lg font-['Rajdhani'] cursor-pointer"><Printer size={13} /> Print</button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold font-['Rajdhani'] transition-all ${i < step ? "bg-[#4ADE80] text-[#070C16]" : i === step ? "bg-primary text-white" : "bg-[#1C2A3E] text-muted-foreground"}`}>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <p className={`text-[10px] font-['Rajdhani'] font-semibold whitespace-nowrap ${i === step ? "text-primary" : i < step ? "text-[#4ADE80]" : "text-muted-foreground"}`}>{label}</p>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-px mx-1 transition-all ${i < step ? "bg-[#4ADE80]/50" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Scan */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
          <p className="text-[12px] text-muted-foreground">Scan the VIN barcode or enter registration number manually.</p>
          
          {isScanning ? (
            <PlateScanner onScan={handleScanComplete} onClose={() => setIsScanning(false)} />
          ) : (
            <>
              <div className="flex gap-2">
                <input value={regNo} onChange={e => setRegNo(e.target.value.toUpperCase())} placeholder="Enter Reg No or VIN…"
                  className="flex-1 px-3 py-2.5 text-[13px] bg-[#1C2A3E] border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 font-['JetBrains_Mono'] uppercase" />
                <button onClick={simulateScan}
                  className="px-4 py-2.5 bg-[#1C2A3E] border border-border text-foreground text-[12px] font-semibold rounded-lg hover:bg-[#253347] transition-all font-['Rajdhani'] flex items-center gap-2">
                  <Camera size={13} /> Scan
                </button>
              </div>
              {scanned && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-[#0D2E1A]/60 border border-[#4ADE80]/20 text-[#4ADE80] text-[12px]">
                  <CheckCircle size={14} /> Scanned: <span className="font-['JetBrains_Mono'] font-medium">{regNo}</span>
                </motion.div>
              )}
            </>
          )}
          
          <button disabled={!regNo} onClick={() => setStep(1)}
            className="self-end flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-[13px] font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-['Rajdhani']">
            Next <ArrowRight size={14} />
          </button>
        </motion.div>
      )}

      {/* Step 1: Customer & Vehicle Details */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12px]">
            <div className="col-span-2 p-3 rounded-xl bg-[#1C2A3E]/40 border border-border flex gap-6">
              <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide mb-0.5">Model</p><p className="text-foreground font-semibold">MARUTI BALENO PETROL</p></div>
              <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide mb-0.5">Reg No</p><p className="text-primary font-['JetBrains_Mono']">{regNo}</p></div>
              <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide mb-0.5">VIN</p><p className="text-foreground font-['JetBrains_Mono']">MA3FJEB1SND789012</p></div>
              <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide mb-0.5">FC OK Date</p><p className="text-foreground">21-MAY-27</p></div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-['Rajdhani'] font-semibold tracking-wide text-muted-foreground">Odometer Reading *</label>
              <input value={odometer} onChange={e => setOdometer(e.target.value)}
                className="px-3 py-2 bg-[#1C2A3E] border border-border rounded-lg text-foreground outline-none focus:border-primary/50 font-['JetBrains_Mono']" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-['Rajdhani'] font-semibold tracking-wide text-muted-foreground">Service Type *</label>
              <div className="relative">
                <select value={serviceType} onChange={e => setServiceType(e.target.value)}
                  className="w-full appearance-none px-3 py-2 bg-[#1C2A3E] border border-border rounded-lg text-foreground outline-none font-['Rajdhani']">
                  {["PAID SERVICE", "1ST FREE SERVICE", "2ND FREE SERVICE", "3RD FREE SERVICE", "RUNNING REPAIR", "PMS"].map(s => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-['Rajdhani'] font-semibold tracking-wide text-muted-foreground">Customer Name</label>
              <input defaultValue="PREM MOTORS TRUE VALUE" className="px-3 py-2 bg-[#1C2A3E]/50 border border-border/50 rounded-lg text-muted-foreground outline-none font-['Rajdhani'] cursor-not-allowed" readOnly />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-['Rajdhani'] font-semibold tracking-wide text-muted-foreground">Mobile No. *</label>
              <input defaultValue="8708 467 728" className="px-3 py-2 bg-[#1C2A3E] border border-border rounded-lg text-foreground outline-none focus:border-primary/50 font-['JetBrains_Mono']" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-['Rajdhani'] font-semibold tracking-wide text-muted-foreground">Email *</label>
              <input defaultValue="ab@123gmail.com" className="px-3 py-2 bg-[#1C2A3E] border border-border rounded-lg text-foreground outline-none focus:border-primary/50 font-['JetBrains_Mono']" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-['Rajdhani'] font-semibold tracking-wide text-muted-foreground">Gate In Date / Time</label>
              <input defaultValue="21-May-2026 10:30" className="px-3 py-2 bg-[#1C2A3E] border border-border rounded-lg text-foreground outline-none focus:border-primary/50 font-['JetBrains_Mono']" />
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <button onClick={() => setStep(0)} className="flex items-center gap-2 px-4 py-2 bg-[#1C2A3E] text-foreground text-[12px] font-semibold rounded-lg hover:bg-[#253347] font-['Rajdhani']"><ChevronLeft size={13} /> Back</button>
            <button onClick={() => setStep(2)} className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-[12px] font-bold rounded-lg hover:bg-primary/90 font-['Rajdhani']">Next <ArrowRight size={13} /></button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Vehicle Status */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#1C2A3E]/40 border border-border">
              <p className="text-[11px] uppercase font-['Rajdhani'] font-semibold tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5"><Fuel size={12} /> Fuel Level</p>
              <div className="flex gap-2 mb-3">
                {fuelLevels.map(level => (
                  <button key={level} onClick={() => setFuel(level)}
                    className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all font-['Rajdhani'] ${fuel === level ? "bg-primary text-white" : "bg-[#1C2A3E] text-muted-foreground hover:text-foreground"}`}>
                    {level}%
                  </button>
                ))}
              </div>
              <div className="h-3 rounded-full bg-[#1C2A3E] overflow-hidden">
                <motion.div animate={{ width: `${fuel}%` }} className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" />
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#1C2A3E]/40 border border-border">
              <p className="text-[11px] uppercase font-['Rajdhani'] font-semibold tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5"><Wrench size={12} /> Vehicle Inventory</p>
              <div className="flex flex-col gap-2">
                {["Spare Tyre", "Service Schedule", "Wheel Cover", "Toolkit", "Music System"].map((item, i) => (
                  <label key={item} className="flex items-center gap-2 text-[12px] text-foreground cursor-pointer">
                    <input type="checkbox" defaultChecked={i < 3} className="w-3.5 h-3.5 accent-primary" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#1A1A0D]/40 border border-[#FACC15]/20 text-[#FACC15] text-[12px] flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Please capture at least 3 interior images before proceeding. Smart Eye process recommended for exterior.
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2 bg-[#1C2A3E] text-foreground text-[12px] font-semibold rounded-lg hover:bg-[#253347] font-['Rajdhani']"><ChevronLeft size={13} /> Back</button>
            <button onClick={() => setStep(3)} className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-[12px] font-bold rounded-lg hover:bg-primary/90 font-['Rajdhani']">Next <ArrowRight size={13} /></button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Tyre & Battery */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#1C2A3E]/40 border border-border">
              <p className="text-[11px] uppercase font-['Rajdhani'] font-semibold tracking-wide text-muted-foreground mb-4">Tyre Health (mm)</p>
              <div className="grid grid-cols-2 gap-3">
                {(["fl", "fr", "rl", "rr"] as const).map(k => (
                  <div key={k} className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-['Rajdhani'] font-semibold text-muted-foreground tracking-wide">{k.toUpperCase()}</label>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setTyre(t => ({ ...t, [k]: String(Math.max(0, parseInt(t[k]) - 1)) }))}
                        className="w-7 h-7 rounded-lg bg-[#1C2A3E] text-muted-foreground hover:text-foreground flex items-center justify-center"><Minus size={11} /></button>
                      <input value={tyre[k]} onChange={e => setTyre(t => ({ ...t, [k]: e.target.value }))}
                        className="flex-1 px-2 py-1.5 bg-[#1C2A3E] border border-border rounded-lg text-foreground text-center text-[13px] outline-none font-['JetBrains_Mono']" />
                      <button onClick={() => setTyre(t => ({ ...t, [k]: String(parseInt(t[k]) + 1) }))}
                        className="w-7 h-7 rounded-lg bg-[#1C2A3E] text-muted-foreground hover:text-foreground flex items-center justify-center"><Plus size={11} /></button>
                    </div>
                    {parseInt(tyre[k]) < 3 && (
                      <p className="text-[#F87171] text-[10px] font-['Rajdhani']">Critical — replacement needed</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#1C2A3E]/40 border border-border">
              <p className="text-[11px] uppercase font-['Rajdhani'] font-semibold tracking-wide text-muted-foreground mb-4">Battery Health</p>
              <div className="flex flex-col gap-2">
                {["Good", "Charge and Test", "Poor"].map(opt => (
                  <label key={opt} onClick={() => setBattery(opt)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${battery === opt ? "border-primary bg-primary/10" : "border-border hover:border-border/80"}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${battery === opt ? "border-primary" : "border-muted-foreground"}`}>
                      {battery === opt && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className={`text-[13px] font-['Rajdhani'] font-semibold ${battery === opt ? "text-primary" : "text-foreground"}`}>{opt}</span>
                  </label>
                ))}
              </div>
              {battery === "Poor" && (
                <p className="text-[#F87171] text-[11px] mt-2 font-['Rajdhani']">Battery replacement demand will be auto-added.</p>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 px-4 py-2 bg-[#1C2A3E] text-foreground text-[12px] font-semibold rounded-lg hover:bg-[#253347] font-['Rajdhani']"><ChevronLeft size={13} /> Back</button>
            <button onClick={() => setStep(4)} className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-[12px] font-bold rounded-lg hover:bg-primary/90 font-['Rajdhani']">Next <ArrowRight size={13} /></button>
          </div>
        </motion.div>
      )}

      {/* Step 4: Demands */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] text-muted-foreground uppercase font-['Rajdhani'] font-semibold tracking-wide">Service Menu Detail List (Demanded Repair)</p>
            <button 
              onClick={() => { setShowAddDemandRow(!showAddDemandRow); setNewDesc(""); setNewCode(""); setNewPrice(0); setNewQty(1); }}
              className="flex items-center gap-1.5 text-primary text-[11px] font-semibold font-['Rajdhani'] hover:text-accent transition-colors cursor-pointer"
            >
              <Plus size={12} /> Add Demand
            </button>
          </div>

          {showAddDemandRow && (
            <div className="p-4 rounded-xl border border-primary/20 bg-[#0E1626] flex flex-wrap gap-3 items-end transition-all">
              <div className="flex-1 min-w-[100px]">
                <label className="text-[10px] uppercase font-['Rajdhani'] text-muted-foreground block mb-1 font-bold">Type</label>
                <select value={newType} onChange={e => setNewType(e.target.value as "L" | "P")} className="w-full text-[12px] px-3.5 py-2 bg-[#1C2A3E] border border-border/60 rounded focus:border-primary/50 text-foreground outline-none cursor-pointer">
                  <option value="L">Labour (L)</option>
                  <option value="P">Part (P)</option>
                </select>
              </div>
              <div className="flex-[3] min-w-[200px]">
                <label className="text-[10px] uppercase font-['Rajdhani'] text-muted-foreground block mb-1 font-bold">Description</label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="e.g. Front Brake Pads Replacement" className="w-full text-[12px] px-3.5 py-2 bg-[#1C2A3E] border border-border/60 rounded focus:border-primary/50 text-foreground outline-none font-sans" />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-[10px] uppercase font-['Rajdhani'] text-muted-foreground block mb-1 font-bold">Code</label>
                <input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="e.g. BRK-PAD-01" className="w-full text-[12px] px-3.5 py-2 bg-[#1C2A3E] border border-border/60 rounded focus:border-primary/50 text-foreground outline-none font-['JetBrains_Mono']" />
              </div>
              <div className="w-[70px]">
                <label className="text-[10px] uppercase font-['Rajdhani'] text-muted-foreground block mb-1 font-bold">Qty</label>
                <input type="number" value={newQty} onChange={e => setNewQty(parseInt(e.target.value) || 1)} className="w-full text-[12px] px-3.5 py-2 bg-[#1C2A3E] border border-border/60 rounded focus:border-primary/50 text-foreground outline-none font-['JetBrains_Mono']" />
              </div>
              <div className="w-[100px]">
                <label className="text-[10px] uppercase font-['Rajdhani'] text-muted-foreground block mb-1 font-bold">Price (₹)</label>
                <input type="number" value={newPrice} onChange={e => setNewPrice(parseInt(e.target.value) || 0)} className="w-full text-[12px] px-3.5 py-2 bg-[#1C2A3E] border border-border/60 rounded focus:border-primary/50 text-foreground outline-none font-['JetBrains_Mono']" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (!newDesc.trim()) return;
                    setDemands(prev => [...prev, {
                      type: newType,
                      desc: newDesc,
                      code: newCode || (newType === "L" ? "LBR" : "PRT") + Math.trunc(Math.random() * 900 + 100),
                      qty: newQty,
                      price: newPrice,
                      accepted: true
                    }]);
                    setShowAddDemandRow(false);
                  }} 
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-[12px] rounded font-['Rajdhani'] cursor-pointer animate-pulse"
                >
                  ADD
                </button>
                <button 
                  onClick={() => setShowAddDemandRow(false)} 
                  className="px-4 py-2 bg-[#1C2A3E] border border-border/60 text-foreground font-bold text-[12px] rounded font-['Rajdhani'] cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="border-b border-border bg-[#1C2A3E]/60">
                  {["Type", "Description", "Part/Labour Code", "QTY", "Price", "Accepted"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-muted-foreground font-['Rajdhani'] text-[10px] tracking-wide uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {demands.map((d, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-3 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-['Rajdhani'] ${d.type === "L" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>{d.type}</span>
                    </td>
                    <td className="px-3 py-2.5 text-foreground max-w-[140px] truncate">{d.desc}</td>
                    <td className="px-3 py-2.5 text-muted-foreground font-['JetBrains_Mono'] text-[10px]">{d.code}</td>
                    <td className="px-3 py-2.5 text-foreground font-['JetBrains_Mono']">{d.qty}</td>
                    <td className="px-3 py-2.5 text-foreground font-['JetBrains_Mono']">₹{d.price.toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-[#4ADE80] font-['Rajdhani'] font-semibold text-[11px]">YES</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-[#1C2A3E]/40 border border-border text-[12px] font-['JetBrains_Mono']">
            <div className="flex gap-6">
              <span className="text-muted-foreground">Labour: <span className="text-foreground font-semibold">₹{labourTotal.toLocaleString()}</span></span>
              <span className="text-muted-foreground">Parts: <span className="text-foreground font-semibold">₹{partsTotal.toLocaleString()}</span></span>
            </div>
            <span className="text-foreground font-bold text-[14px]">Grand Total: ₹{(labourTotal + partsTotal).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(3)} className="flex items-center gap-2 px-4 py-2 bg-[#1C2A3E] text-foreground text-[12px] font-semibold rounded-lg hover:bg-[#253347] font-['Rajdhani']"><ChevronLeft size={13} /> Back</button>
            <button onClick={() => setStep(5)} className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-[12px] font-bold rounded-lg hover:bg-primary/90 font-['Rajdhani']">Next <ArrowRight size={13} /></button>
          </div>
        </motion.div>
      )}

      {/* Step 5: Summary */}
      {step === 5 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-[#1C2A3E]/40 border border-border">
            <p className="text-[11px] uppercase font-['Rajdhani'] font-semibold tracking-wide text-muted-foreground mb-3">Job Card Summary</p>
            <div className="grid grid-cols-3 gap-3 text-[12px] mb-4">
              <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide mb-0.5">Registration</p><p className="text-primary font-['JetBrains_Mono']">{regNo}</p></div>
              <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide mb-0.5">Model</p><p className="text-foreground">MARUTI BALENO PETROL</p></div>
              <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide mb-0.5">Service Type</p><p className="text-foreground">{serviceType}</p></div>
              <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide mb-0.5">Odometer</p><p className="text-foreground font-['JetBrains_Mono']">{parseInt(odometer).toLocaleString()} KMS</p></div>
              <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide mb-0.5">Total Est. Amount</p><p className="text-foreground font-['JetBrains_Mono'] font-bold">₹{(labourTotal + partsTotal).toLocaleString()}</p></div>
              <div><p className="text-muted-foreground text-[10px] uppercase font-['Rajdhani'] tracking-wide mb-0.5">Battery</p><p className="text-foreground">{battery}</p></div>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-[10px] uppercase font-['Rajdhani'] font-semibold tracking-wide text-muted-foreground mb-2">Demand Repairs ({demands.length})</p>
              {demands.map((d, i) => (
                <div key={i} className="flex justify-between text-[11px] py-1 border-b border-border/30 last:border-0">
                  <span className="text-foreground">{d.desc}</span>
                  <span className="text-muted-foreground font-['JetBrains_Mono']">₹{(d.price * d.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#1C2A3E]/40 border border-border">
            <p className="text-[10px] uppercase font-['Rajdhani'] font-semibold tracking-wide text-muted-foreground mb-2">Customer Signature</p>
            <SignaturePad value={signatureData} onChange={setSignatureData} />
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(4)} className="flex items-center gap-2 px-4 py-2 bg-[#1C2A3E] text-foreground text-[12px] font-semibold rounded-lg hover:bg-[#253347] font-['Rajdhani']"><ChevronLeft size={13} /> Back</button>
            <button onClick={() => setSubmitted(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#4ADE80] text-[#070C16] text-[13px] font-bold rounded-lg hover:bg-[#4ADE80]/90 transition-all font-['Rajdhani']">
              <Zap size={14} /> Generate Job Card
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export function generateJcPdf(jc: any, action: 'download' | 'print') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pColor = [61, 142, 240]; // NEXA Blue Accent
  const dColor = [14, 22, 38];   // NEXA Dark Theme Tone
  const textDark = [33, 37, 41];
  const borderLight = 220;

  // Header Banner
  doc.setFillColor(dColor[0], dColor[1], dColor[2]);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("NEXA Service", 15, 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("PREMIUM AUTOMOBILE WORKSPACE · HYPER-LOCAL DIGITAL LOGISTICS", 15, 24);
  
  doc.setFillColor(pColor[0], pColor[1], pColor[2]);
  doc.rect(145, 0, 65, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("JOB CARD NO.", 152, 13);
  doc.setFontSize(15);
  doc.text(jc.jcNo || "JC-NEW", 152, 22);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${jc.visitDate || "21-MAY-2026"}`, 152, 29);
  doc.text(`Gate In: ${jc.gateIn || "08:30 AM"}`, 152, 34);

  let curY = 50;

  const renderSectionHeader = (title: string, yPos: number) => {
    doc.setFillColor(242, 246, 253);
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(pColor[0], pColor[1], pColor[2]);
    doc.text(title.toUpperCase(), 19, yPos + 5.5);
  };

  // Section 1: Customer & Vehicle details
  renderSectionHeader("Customer & Vehicle Information", curY);
  curY += 14;

  const cust = jc.customer || {
    name: "Customer Name", mobile1: "+91 99999 88888", email: "customer@gmail.com",
    address: "DLF Phase 4, Gurugram", city: "Gurugram", regNo: jc.regNo || "HR26CW7677",
    vin: "MA3YFDS75K008432", model: jc.model || "MARUTI BALENO PETROL"
  };

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(33, 37, 41);

  // Column 1
  doc.setFont("helvetica", "bold"); doc.text("Customer Profile", 15, curY); curY += 5;
  doc.setFont("helvetica", "normal"); doc.text(`Name: ${cust.name}`, 15, curY); curY += 4.5;
  doc.text(`Mobile: ${cust.mobile1}`, 15, curY); curY += 4.5;
  doc.text(`Email: ${cust.email}`, 15, curY); curY += 4.5;
  doc.text(`Address: ${cust.address || ""}, ${cust.city || ""}`, 15, curY);

  // Column 2
  let col2Y = curY - 18.5;
  doc.setFont("helvetica", "bold"); doc.text("Vehicle Profile", 115, col2Y); col2Y += 5;
  doc.setFont("helvetica", "normal"); doc.text(`Model: ${cust.model || "MARUTI BALENO PETROL"}`, 115, col2Y); col2Y += 4.5;
  doc.text(`Reg No: ${cust.regNo || jc.regNo}`, 115, col2Y); col2Y += 4.5;
  doc.text(`Chassis/VIN: ${cust.vin || "MA3YFDS75K008432"}`, 115, col2Y); col2Y += 4.5;
  doc.text(`Odometer: ${(jc.odometer || 40002).toLocaleString()} KMS`, 115, col2Y);

  curY += 12;

  // Section 2: Job Card Logistics
  renderSectionHeader("Job Card Details & Assigned Staff", curY);
  curY += 14;

  // Column 1
  doc.setFont("helvetica", "bold"); doc.text("Logistics", 15, curY); curY += 5;
  doc.setFont("helvetica", "normal"); doc.text(`Service Type: ${jc.serviceType || "PAID SERVICE"}`, 15, curY); curY += 4.5;
  doc.text(`Promised Date: ${jc.promisedDate || "21-MAY-2026"} ${jc.promisedTime || "06:00 PM"}`, 15, curY); curY += 4.5;
  doc.text(`Payment Mode: ${jc.paymentMode || "CASH / DIGITAL"}`, 15, curY);

  // Column 2
  let logCol2Y = curY - 14;
  doc.setFont("helvetica", "bold"); doc.text("Workshop Setup", 115, logCol2Y); logCol2Y += 5;
  doc.setFont("helvetica", "normal"); doc.text(`Technician: ${jc.techName || "RAJESH KUMAR"}`, 115, logCol2Y); logCol2Y += 4.5;
  doc.text(`Assigned Bay: ${jc.bay || "BAY-03"}`, 115, logCol2Y); logCol2Y += 4.5;
  doc.text(`Workshop Dealer: ${jc.dealer || "PREM MOTORS PVT. LTD., GURGAON-2S(NEXA)"}`, 115, logCol2Y);

  curY += 14;

  // Section 3: Repairs voice
  renderSectionHeader("Demanded Repairs & Complaints Voice", curY);
  curY += 13;

  doc.setFillColor(248, 248, 248);
  doc.rect(15, curY, 180, 7, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(33, 37, 41);
  doc.text("S.No", 18, curY + 4.5);
  doc.text("Ref Code", 35, curY + 4.5);
  doc.text("Repairs Requested & Customer Feedback", 65, curY + 4.5);
  doc.text("Repairs Type", 165, curY + 4.5);
  curY += 7;

  doc.setFont("helvetica", "normal");
  const dList = jc.demands || [];
  if (dList.length === 0) {
    doc.text("No specific demands associated.", 18, curY + 4);
    curY += 8;
  } else {
    dList.forEach((d: any, idx: number) => {
      doc.text(String(idx + 1), 18, curY + 4.5);
      doc.text(d.code || "DEM-01", 35, curY + 4.5);
      doc.text(d.desc || d.text || "—", 65, curY + 4.5);
      doc.text(d.type === "L" ? "Labor" : "Spare", 165, curY + 4.5);
      doc.setDrawColor(borderLight);
      doc.line(15, curY + 6.5, 195, curY + 6.5);
      curY += 7.5;
    });
  }

  curY += 8;

  // Check Page break
  if (curY > 230) {
    doc.addPage();
    curY = 20;
  }

  // Section 4: Labor & Parts Estimation tables
  renderSectionHeader("Financial Labor & Parts Cost Estimation", curY);
  curY += 13;

  // Labor Table Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(33, 37, 41);
  doc.text("Labor/Workshop Operations Breakdown", 15, curY);
  curY += 5;

  doc.setFillColor(248, 248, 248);
  doc.rect(15, curY, 180, 6, 'F');
  doc.setFontSize(8.5);
  doc.text("Code", 18, curY + 4);
  doc.text("Operation Description", 40, curY + 4);
  doc.text("Hrs", 115, curY + 4);
  doc.text("Billable", 135, curY + 4);
  doc.text("Total", 170, curY + 4);
  curY += 6;

  doc.setFont("helvetica", "normal");
  let customLaborTotal = 0;
  const lList = jc.labour || [];
  lList.forEach((l: any) => {
    doc.text(l.code, 18, curY + 4);
    doc.text(l.desc || "—", 40, curY + 4);
    doc.text(String(l.prnHrs || 1), 115, curY + 4);
    doc.text(l.billableType || "Billable", 135, curY + 4);
    doc.text(`INR ${(l.amount || 0).toLocaleString()}`, 170, curY + 4);
    customLaborTotal += (l.amount || 0);
    doc.setDrawColor(borderLight);
    doc.line(15, curY + 6, 195, curY + 6);
    curY += 7;
  });

  doc.setFont("helvetica", "bold");
  doc.text(`Labor Total: INR ${customLaborTotal.toLocaleString()}`, 135, curY + 3);
  curY += 12;

  if (curY > 230) {
    doc.addPage();
    curY = 20;
  }

  // Parts Table Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Recommended Spares & Lubricants", 15, curY);
  curY += 5;

  doc.setFillColor(248, 248, 248);
  doc.rect(15, curY, 180, 6, 'F');
  doc.setFontSize(8.5);
  doc.text("Part Number", 18, curY + 4);
  doc.text("Part Description", 40, curY + 4);
  doc.text("Qty", 115, curY + 4);
  doc.text("Rate", 135, curY + 4);
  doc.text("Total", 170, curY + 4);
  curY += 6;

  doc.setFont("helvetica", "normal");
  let customPartsTotal = 0;
  const pList = jc.parts || [];
  pList.forEach((p: any) => {
    doc.text(p.code, 18, curY + 4);
    doc.text(p.desc || "—", 40, curY + 4);
    doc.text(String(p.qty || 1), 115, curY + 4);
    doc.text(`INR ${(p.price || 0).toLocaleString()}`, 135, curY + 4);
    doc.text(`INR ${(p.amount || 0).toLocaleString()}`, 170, curY + 4);
    customPartsTotal += (p.amount || 0);
    doc.setDrawColor(borderLight);
    doc.line(15, curY + 6, 195, curY + 6);
    curY += 7;
  });

  doc.setFont("helvetica", "bold");
  doc.text(`Parts Total: INR ${customPartsTotal.toLocaleString()}`, 135, curY + 3);
  curY += 13;

  if (curY > 230) {
    doc.addPage();
    curY = 20;
  }

  // Total Summary
  doc.setFillColor(242, 246, 253);
  doc.rect(110, curY, 85, 25, 'F');
  doc.setFontSize(9.5);
  doc.text("GRAND ESTIMATED AMOUNT:", 114, curY + 8);
  doc.setFontSize(13);
  doc.setTextColor(pColor[0], pColor[1], pColor[2]);
  doc.text(`INR ${(customLaborTotal + customPartsTotal).toLocaleString()}`, 114, curY + 17);

  // Bottom text & line
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.setFont("helvetica", "normal");
  doc.text("Automated workshop ledger for representative audits only.", 15, curY + 8);
  doc.text("Awaiting secure customer approval via OCAS gateway links.", 15, curY + 14);
  doc.line(15, curY + 19, 80, curY + 19);
  doc.text("Workshop Advisor Signature", 15, curY + 23);

  if (action === 'download') {
    doc.save(`NEXA_JobCard_${jc.jcNo || "JC26000512"}.pdf`);
  } else {
    const sUrl = doc.output('bloburl');
    window.open(sUrl);
  }
}

// ── JC Detail Modal ───────────────────────────────────────────────────────────
function JCDetailModal({ jcNo, onClose }: { jcNo: string; onClose: () => void }) {
  const [tab, setTab] = useState(0)
  const jc = JC_DETAILS[jcNo]
  if (!jc) return null

  const tabs = ["JC Details", "Customer & Vehicle", "Demanded Repairs", "Labour & Parts", "Pricing"]
  const labourTotal = jc.labour.reduce((s, l) => s + l.amount, 0)
  const partsTotal = jc.parts.reduce((s, p) => s + p.amount, 0)
  const grandTotal = labourTotal + partsTotal

  const Field = ({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) => (
    <div className="flex flex-col gap-0.5">
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-['Rajdhani'] font-semibold">{label}</p>
      <p className={`text-[12px] text-foreground ${mono ? "font-['JetBrains_Mono']" : "font-['Rajdhani'] font-semibold"}`}>{value || "—"}</p>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-4xl bg-[#0E1626] border border-[rgba(61,142,240,0.25)] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#070C16] border-b border-[rgba(61,142,240,0.15)]">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <FileText size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-[16px] font-bold font-['Rajdhani'] text-foreground tracking-wide">Job Card — <span className="text-primary font-['JetBrains_Mono']">{jc.jcNo}</span></p>
              <p className="text-[11px] text-muted-foreground">{jc.customer.model} · {jc.customer.regNo} · {jc.visitDate}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1C2A3E] hover:bg-[#253347] border border-border flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground text-[16px] font-bold">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[rgba(61,142,240,0.15)] bg-[#070C16] px-4 gap-0.5 overflow-x-auto">
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              className={`px-4 py-3 text-[11px] font-semibold font-['Rajdhani'] tracking-wide whitespace-nowrap transition-all border-b-2 ${tab === i
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {tab === 0 && (
              <motion.div key="tab0" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="grid grid-cols-3 gap-x-8 gap-y-5">
                <Field label="JC Number" value={jc.jcNo} mono />
                <Field label="Dealer" value={jc.dealer} />
                <Field label="Dealer Map Code" value={jc.dealerMapCode} mono />
                <Field label="Visit Date" value={jc.visitDate} />
                <Field label="Gate In Time" value={jc.gateIn} mono />
                <Field label="Service Type" value={jc.serviceType} />
                <Field label="Billed Date" value={jc.billedDate} />
                <Field label="Technician" value={jc.techName} />
                <Field label="Bay" value={jc.bay} />
                <Field label="Group" value={jc.group} />
                <Field label="Pin Status" value={jc.pinStatus} />
                <Field label="Attended Through" value={jc.attendedThrough} />
                <Field label="Odometer (KMS)" value={jc.odometer.toLocaleString()} mono />
                <Field label="Payment Mode" value={jc.paymentMode} />
                <Field label="Promised Date & Time" value={`${jc.promisedDate} ${jc.promisedTime}`} />
                <div className="col-span-3 border-t border-border pt-4 mt-1">
                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-['Rajdhani'] font-semibold mb-1.5">Remark</p>
                  <p className="text-[12px] text-foreground font-['Rajdhani'] font-semibold">{jc.remark}</p>
                </div>
                <div className="col-span-3">
                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-['Rajdhani'] font-semibold mb-1.5">Unauthorized Fitments</p>
                  <p className={`text-[12px] font-['Rajdhani'] font-semibold ${jc.unauthorizedFitments === "None" ? "text-[#4ADE80]" : "text-[#F87171]"}`}>{jc.unauthorizedFitments}</p>
                </div>
              </motion.div>
            )}
            {tab === 1 && (
              <motion.div key="tab1" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="flex flex-col gap-6">
                <div>
                  <p className="text-[11px] uppercase font-['Rajdhani'] font-bold tracking-widest text-primary mb-4">Customer Information</p>
                  <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                    <Field label="Customer Name" value={jc.customer.name} />
                    <Field label="Mobile 1" value={jc.customer.mobile1} mono />
                    <Field label="Mobile 2" value={jc.customer.mobile2 || "—"} mono />
                    <Field label="Email" value={jc.customer.email} />
                    <Field label="Customer Category" value={jc.customer.customerCategory} />
                    <div className="col-span-1" />
                    <div className="col-span-3">
                      <Field label="Address" value={jc.customer.address} />
                    </div>
                    <Field label="State" value={jc.customer.state} />
                    <Field label="City" value={jc.customer.city} />
                    <Field label="Pin Code" value={jc.customer.pinCode} mono />
                  </div>
                </div>
                <div className="border-t border-border pt-6">
                  <p className="text-[11px] uppercase font-['Rajdhani'] font-bold tracking-widest text-accent mb-4">Vehicle Information</p>
                  <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                    <Field label="Registration No." value={jc.customer.regNo} mono />
                    <Field label="Model" value={jc.customer.model} />
                    <Field label="Variant" value={jc.customer.variant} />
                    <Field label="VIN / Chassis No." value={jc.customer.vin} mono />
                    <Field label="Sale Date" value={jc.customer.saleDate} />
                    <Field label="TV Sale Date" value={jc.customer.tvSaleDate} />
                    <Field label="FC OK Date" value={jc.customer.fcOkDate} />
                  </div>
                </div>
              </motion.div>
            )}
            {tab === 2 && (
              <motion.div key="tab2" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-[11.5px]">
                    <thead>
                      <tr className="border-b border-border bg-[#1C2A3E]/60">
                        {["S.No", "Type", "Demand Code", "Demand Description", "Customer Voice"].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left font-semibold text-muted-foreground font-['Rajdhani'] text-[10px] tracking-wide uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {jc.demands.map((d, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-[#1C2A3E]/20 transition-colors">
                          <td className="px-3 py-3 text-muted-foreground font-['JetBrains_Mono']">{d.sno}</td>
                          <td className="px-3 py-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-['Rajdhani'] ${d.type === "L" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>{d.type}</span>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground font-['JetBrains_Mono'] text-[10px]">{d.code}</td>
                          <td className="px-3 py-3 text-foreground font-['Rajdhani'] font-semibold">{d.desc}</td>
                          <td className="px-3 py-3 text-muted-foreground italic">{d.voice}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
            {tab === 3 && (
              <motion.div key="tab3" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="flex flex-col gap-6">
                <div>
                  <p className="text-[11px] uppercase font-['Rajdhani'] font-bold tracking-widest text-primary mb-3">Labour</p>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-[11.5px]">
                      <thead>
                        <tr className="border-b border-border bg-[#1C2A3E]/60">
                          {["S.No", "Labour Code", "Description", "Qty", "PRN Hrs", "Billable Type", "Amount"].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left font-semibold text-muted-foreground font-['Rajdhani'] text-[10px] tracking-wide uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {jc.labour.map((l, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-[#1C2A3E]/20 transition-colors">
                            <td className="px-3 py-2.5 text-muted-foreground font-['JetBrains_Mono']">{l.sno}</td>
                            <td className="px-3 py-2.5 text-muted-foreground font-['JetBrains_Mono'] text-[10px]">{l.code}</td>
                            <td className="px-3 py-2.5 text-foreground font-['Rajdhani'] font-semibold max-w-[160px]">{l.desc}</td>
                            <td className="px-3 py-2.5 text-foreground font-['JetBrains_Mono']">{l.qty}</td>
                            <td className="px-3 py-2.5 text-foreground font-['JetBrains_Mono']">{l.prnHrs}</td>
                            <td className="px-3 py-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-['Rajdhani'] bg-primary/10 text-primary">{l.billableType}</span>
                            </td>
                            <td className="px-3 py-2.5 text-foreground font-['JetBrains_Mono'] font-medium">₹{l.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="bg-[#1C2A3E]/40">
                          <td colSpan={6} className="px-3 py-2 text-right text-[11px] font-bold text-muted-foreground font-['Rajdhani'] uppercase tracking-wide">Labour Total</td>
                          <td className="px-3 py-2 text-primary font-['JetBrains_Mono'] font-bold">₹{labourTotal.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase font-['Rajdhani'] font-bold tracking-widest text-accent mb-3">Parts</p>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-[11.5px]">
                      <thead>
                        <tr className="border-b border-border bg-[#1C2A3E]/60">
                          {["S.No", "Part Code", "Description", "Qty", "Price", "Amount"].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left font-semibold text-muted-foreground font-['Rajdhani'] text-[10px] tracking-wide uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {jc.parts.map((p, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-[#1C2A3E]/20 transition-colors">
                            <td className="px-3 py-2.5 text-muted-foreground font-['JetBrains_Mono']">{p.sno}</td>
                            <td className="px-3 py-2.5 text-muted-foreground font-['JetBrains_Mono'] text-[10px]">{p.code}</td>
                            <td className="px-3 py-2.5 text-foreground font-['Rajdhani'] font-semibold">{p.desc}</td>
                            <td className="px-3 py-2.5 text-foreground font-['JetBrains_Mono']">{p.qty}</td>
                            <td className="px-3 py-2.5 text-foreground font-['JetBrains_Mono']">₹{p.price.toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-foreground font-['JetBrains_Mono'] font-medium">₹{p.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="bg-[#1C2A3E]/40">
                          <td colSpan={5} className="px-3 py-2 text-right text-[11px] font-bold text-muted-foreground font-['Rajdhani'] uppercase tracking-wide">Parts Total</td>
                          <td className="px-3 py-2 text-accent font-['JetBrains_Mono'] font-bold">₹{partsTotal.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
            {tab === 4 && (
              <motion.div key="tab4" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Scheduled Labour Amount", value: jc.pricing.scheduledLabour, color: "text-primary" },
                    { label: "Scheduled Parts Amount", value: jc.pricing.scheduledParts, color: "text-accent" },
                    { label: "Estimated Labour Cost", value: jc.pricing.estLabour, color: "text-primary" },
                    { label: "Estimated Parts Cost", value: jc.pricing.estParts, color: "text-accent" },
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[#1C2A3E]/40 border border-border flex flex-col gap-1">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-['Rajdhani'] font-semibold">{item.label}</p>
                      <p className={`text-[20px] font-bold font-['JetBrains_Mono'] ${item.color}`}>₹{item.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="p-5 rounded-xl bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/30 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-['Rajdhani'] font-semibold">Grand Total (Tax not included)</p>
                    <p className="text-[28px] font-bold font-['JetBrains_Mono'] text-foreground mt-1">₹{grandTotal.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-muted-foreground font-['Rajdhani'] font-semibold mb-1">Payment Mode</p>
                    <p className="text-[14px] font-bold font-['Rajdhani'] text-foreground">{jc.paymentMode}</p>
                    <p className="text-[10px] text-muted-foreground font-['Rajdhani'] mt-0.5">Promised by {jc.promisedDate} {jc.promisedTime}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-[11px]">
                  <div className="p-3 rounded-lg bg-[#1C2A3E]/30 border border-border text-center">
                    <p className="text-muted-foreground font-['Rajdhani'] mb-0.5">Labour</p>
                    <p className="text-primary font-bold font-['JetBrains_Mono']">₹{labourTotal.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#1C2A3E]/30 border border-border text-center">
                    <p className="text-muted-foreground font-['Rajdhani'] mb-0.5">Parts</p>
                    <p className="text-accent font-bold font-['JetBrains_Mono']">₹{partsTotal.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#1C2A3E]/30 border border-border text-center">
                    <p className="text-muted-foreground font-['Rajdhani'] mb-0.5">Items</p>
                    <p className="text-foreground font-bold font-['JetBrains_Mono']">{jc.labour.length + jc.parts.length}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Action Buttons */}
        <div className="px-6 py-4 bg-[#070C16] border-t border-[rgba(61,142,240,0.15)] flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1C2A3E] hover:bg-[#253347] border border-border text-[11px] font-semibold font-['Rajdhani'] text-muted-foreground hover:text-foreground transition-all">
              <Mail size={12} /> Email JC
            </button>
            <button 
              onClick={() => generateJcPdf(jc, 'print')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1C2A3E] hover:bg-[#253347] border border-border text-[11px] font-semibold font-['Rajdhani'] text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <Eye size={12} /> View JC
            </button>
            <button 
              onClick={() => generateJcPdf(jc, 'print')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1C2A3E] hover:bg-[#253347] border border-border text-[11px] font-semibold font-['Rajdhani'] text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <Printer size={12} /> Print JC
            </button>
            <button 
              onClick={() => generateJcPdf(jc, 'download')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1C2A3E] hover:bg-[#253347] border border-border text-[11px] font-semibold font-['Rajdhani'] text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <Download size={12} /> Download JC
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1C2A3E] hover:bg-[#253347] border border-border text-[11px] font-semibold font-['Rajdhani'] text-muted-foreground hover:text-foreground transition-all">
              <Hash size={12} /> Probing Sheet
            </button>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-[11px] font-bold font-['Rajdhani'] text-white transition-all">
            <RefreshCw size={12} /> OCAS Status
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── All Job Cards Panel ────────────────────────────────────────────────────────
function AllJobCardsPanel() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const [selectedJC, setSelectedJC] = useState<string | null>(null)
  const [jobs, setJobs] = useState<JobCard[]>(() => {
    try {
      const cached = localStorage.getItem("nexa_job_cards")
      return cached ? JSON.parse(cached) : JOB_CARDS
    } catch (e) {
      return JOB_CARDS
    }
  })

  useEffect(() => {
    localStorage.setItem("nexa_job_cards", JSON.stringify(jobs))
  }, [jobs])

  const filters = ["All", "In Progress", "OCAS Pending", "Pending", "Completed"]
  const filtered = jobs.filter(jc =>
    (filter === "All" || jc.status === filter) &&
    (jc.jcNo.toLowerCase().includes(search.toLowerCase()) ||
      jc.regNo.toLowerCase().includes(search.toLowerCase()) ||
      jc.model.toLowerCase().includes(search.toLowerCase()))
  )

  function handleStatusChange(jcNo: string, newStatus: string) {
    setJobs(prev => prev.map(j => j.jcNo === jcNo ? { ...j, status: newStatus } : j))
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search JC No, Reg, Model…"
              className="w-full pl-8 pr-3 py-2 text-[12px] bg-[#1C2A3E] border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 font-['JetBrains_Mono']" />
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-all font-['Rajdhani'] ${filter === f ? "bg-primary text-white" : "bg-[#1C2A3E] text-muted-foreground hover:text-foreground"}`}>{f}</button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-[11.5px]">
            <thead>
              <tr className="border-b border-border bg-[#1C2A3E]/60">
                {["JC Number", "Model", "Reg No", "Service Type", "Status", "Date", "Amount"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-muted-foreground font-['Rajdhani'] text-[10px] tracking-wide uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(jc => (
                <tr key={jc.jcNo} className="border-b border-border/50 hover:bg-[#1C2A3E]/30 cursor-pointer transition-colors group">
                  <td className="px-3 py-2.5">
                    <button onClick={() => setSelectedJC(jc.jcNo)}
                      className="text-primary font-['JetBrains_Mono'] font-medium hover:text-accent hover:underline underline-offset-2 transition-colors">
                      {jc.jcNo}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-foreground max-w-[140px] truncate">{jc.model}</td>
                  <td className="px-3 py-2.5 text-foreground font-['JetBrains_Mono']">{jc.regNo}</td>
                  <td className="px-3 py-2.5 text-foreground whitespace-nowrap">{jc.serviceType}</td>
                  <td className="px-3 py-2.5 relative" onClick={e => e.stopPropagation()}>
                    <select
                      value={jc.status}
                      onChange={e => handleStatusChange(jc.jcNo, e.target.value)}
                      className={`appearance-none px-2 py-0.5 pr-6 rounded-full text-[10px] font-semibold whitespace-nowrap font-['Rajdhani'] outline-none cursor-pointer ${statusBadge(jc.status)}`}
                    >
                      {filters.filter(f => f !== "All").map(f => (
                        <option key={f} value={f} className="bg-[#1C2A3E] text-foreground">{f}</option>
                      ))}
                    </select>
                    <ChevronRight size={10} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 rotate-90" />
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground font-['JetBrains_Mono']">{jc.date}</td>
                  <td className="px-3 py-2.5 text-foreground font-['JetBrains_Mono']">{jc.amount > 0 ? `₹${jc.amount.toLocaleString()}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground font-['JetBrains_Mono']">{filtered.length} job card{filtered.length !== 1 ? "s" : ""} shown · click a JC number for full details</p>
      </div>
      <AnimatePresence>
        {selectedJC && (
          <motion.div
            key={selectedJC}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <JCDetailModal jcNo={selectedJC} onClose={() => setSelectedJC(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Tasks Panel ───────────────────────────────────────────────────────────────
function TasksPanel() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const cached = localStorage.getItem("nexa_tasks")
      return cached ? JSON.parse(cached) : TASKS_DATA
    } catch (e) {
      return TASKS_DATA
    }
  })

  useEffect(() => {
    localStorage.setItem("nexa_tasks", JSON.stringify(tasks))
  }, [tasks])
  const done = tasks.filter(t => t.done).length
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1C2A3E] flex items-center justify-center">
            <span className="text-[13px] font-bold text-primary font-['Rajdhani']">{done}/{tasks.length}</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground font-['Rajdhani']">Tasks For Today</p>
            <p className="text-[11px] text-muted-foreground">21-May-2026 · {tasks.length - done} pending</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 text-primary text-[11px] font-semibold font-['Rajdhani'] hover:text-accent">
          <Plus size={12} /> Add Task
        </button>
      </div>
      <div className="h-1.5 rounded-full bg-[#1C2A3E] overflow-hidden">
        <motion.div animate={{ width: `${(done / tasks.length) * 100}%` }} className="h-full rounded-full bg-gradient-to-r from-primary to-accent" />
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map(task => (
          <div key={task.id} onClick={() => setTasks(ts => ts.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${task.done ? "border-border/40 bg-[#0E1626]/50 opacity-60" : "border-border bg-[#0E1626] hover:border-primary/30"}`}>
            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.done ? "border-[#4ADE80] bg-[#4ADE80]" : "border-muted-foreground"}`}>
              {task.done && <Check size={11} className="text-[#070C16]" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[12px] font-['Rajdhani'] font-semibold ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.text}</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock size={10} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-['JetBrains_Mono']">{task.time}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-['Rajdhani'] uppercase ${priorityColor(task.priority)}`}>{task.priority}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Notifications Panel ───────────────────────────────────────────────────────
function NotificationsPanel() {
  const [notifs, setNotifs] = useSharedNotifications()
  const [filter, setFilter] = useState<"All" | "Unread">("All")
  const unread = notifs.filter(n => !n.read).length
  const visible = notifs.filter(n => filter === "All" || !n.read)
  const icons: Record<string, typeof AlertTriangle> = { urgent: AlertTriangle, warning: AlertTriangle, success: CheckCircle, info: Bell }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {(["All", "Unread"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-full transition-all font-['Rajdhani'] ${filter === f ? "bg-primary text-white" : "bg-[#1C2A3E] text-muted-foreground hover:text-foreground"}`}>
              {f}{f === "Unread" && unread > 0 && <span className="px-1 py-0.5 rounded bg-[#F87171]/20 text-[#F87171] text-[9px]">{unread}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setNotifs(ns => ns.map(n => ({ ...n, read: true })))}
          className="text-[11px] text-muted-foreground hover:text-foreground font-['Rajdhani'] transition-colors">Mark all read</button>
      </div>
      <div className="flex flex-col gap-2">
        {visible.map(n => {
          const s = notifStyle(n.type)
          const Icon = icons[n.type]
          return (
            <div key={n.id} onClick={() => setNotifs(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x))}
              className={`flex gap-3 p-3 rounded-xl border border-l-4 cursor-pointer transition-all ${s.border} ${s.bg} ${n.read ? "border-border/30 opacity-70" : "border-border"}`}>
              <Icon size={15} className={`mt-0.5 shrink-0 ${s.icon}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-['Rajdhani'] font-semibold ${n.read ? "text-muted-foreground" : "text-foreground"}`}>{n.text}</p>
                <p className="text-[10px] text-muted-foreground mt-1 font-['JetBrains_Mono']">{n.time}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Service News Panel ────────────────────────────────────────────────────────
function ServiceNewsPanel() {
  const catColors: Record<string, string> = {
    Campaign: "bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/20",
    Training: "bg-primary/20 text-primary border border-primary/20",
    Update: "bg-[#FACC15]/20 text-[#FACC15] border border-[#FACC15]/20",
  }
  return (
    <div className="flex flex-col gap-3">
      {SERVICE_NEWS.map((news, i) => (
        <motion.div key={news.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
          className="p-4 rounded-xl bg-[#0E1626] border border-border hover:border-primary/25 transition-all cursor-pointer group">
          <div className="flex items-start justify-between gap-3 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-['Rajdhani'] ${catColors[news.category] || "bg-muted text-muted-foreground"}`}>{news.category}</span>
            <span className="text-[10px] text-muted-foreground font-['JetBrains_Mono']">{news.date}</span>
          </div>
          <p className="text-[13px] font-semibold text-foreground font-['Rajdhani'] mb-1 group-hover:text-primary transition-colors">{news.title}</p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">{news.summary}</p>
          <div className="flex gap-2 mt-3">
            <button className="flex items-center gap-1.5 text-primary text-[11px] font-semibold font-['Rajdhani'] hover:text-accent transition-colors">
              <Eye size={11} /> Read More
            </button>
            <button className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-semibold font-['Rajdhani'] hover:text-foreground transition-colors">
              <Download size={11} /> Download
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── My Calls Panel ────────────────────────────────────────────────────────────
interface CallLog {
  id: string;
  name: string;
  number: string;
  status: "missed" | "scheduled" | "completed";
  time: string;
  vehicle: string;
  reason: string;
}

const INITIAL_CALLS: CallLog[] = [
  { id: "c1", name: "Rajat Sharma", number: "+91 98101 23456", status: "missed", time: "10:15 AM today", vehicle: "HR26CW7677", reason: "Service progress update request" },
  { id: "c2", name: "Anjali Gupta", number: "+91 99532 98765", status: "missed", time: "11:30 AM today", vehicle: "HR26FN3715", reason: "Confirming estimated delivery time" },
  { id: "c3", name: "Amit Kumar", number: "+91 97111 00223", status: "scheduled", time: "02:00 PM (Callback)", vehicle: "JH10CK2349", reason: "Part delay callback requested" },
  { id: "c4", name: "Preeti Singh", number: "+91 98188 55432", status: "completed", time: "09:45 AM today", vehicle: "MH01HK4521", reason: "Appointment confirmation" },
];

function CallsPanel() {
  const [calls, setCalls] = useState<CallLog[]>(() => {
    try {
      const cached = localStorage.getItem("nexa_calls")
      return cached ? JSON.parse(cached) : INITIAL_CALLS
    } catch (e) {
      return INITIAL_CALLS
    }
  })

  useEffect(() => {
    localStorage.setItem("nexa_calls", JSON.stringify(calls))
  }, [calls])
  const [filter, setFilter] = useState<"all" | "missed" | "scheduled">("all");
  const [activeCall, setActiveCall] = useState<CallLog | null>(null);
  const [callStatus, setCallStatus] = useState<"dialing" | "connected" | "ended">("dialing");
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeCall && callStatus === "connected") {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [activeCall, callStatus]);

  useEffect(() => {
    let connectTimer: NodeJS.Timeout;
    if (activeCall && callStatus === "dialing") {
      connectTimer = setTimeout(() => {
        setCallStatus("connected");
      }, 2000);
    }
    return () => clearTimeout(connectTimer);
  }, [activeCall, callStatus]);

  const handleCall = (c: CallLog) => {
    setActiveCall(c);
    setCallStatus("dialing");
  };

  const handleEndCall = () => {
    setCallStatus("ended");
    setTimeout(() => {
      setCalls((prev) =>
        prev.map((item) =>
          item.id === activeCall?.id ? { ...item, status: "completed" } : item
        )
      );
      setActiveCall(null);
    }, 1200);
  };

  const filteredCalls = calls.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-4 font-['Rajdhani']">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {(["all", "missed", "scheduled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                filter === f
                  ? "bg-primary text-white border-primary"
                  : "bg-[#1C2A3E]/60 border border-border text-muted-foreground hover:text-foreground hover:bg-[#1C2A3E]/90"
              }`}
            >
              {f} ({calls.filter((c) => f === "all" || c.status === f).length})
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filteredCalls.map((c) => (
          <div
            key={c.id}
            className={`p-4 rounded-xl border transition-all duration-300 bg-gradient-to-br from-[#0D1527] to-[#080E1C] ${
              c.status === "missed"
                ? "border-[#F87171]/20 hover:border-[#F87171]/40"
                : c.status === "scheduled"
                ? "border-[#FACC15]/20 hover:border-[#FACC15]/40"
                : "border-[rgba(255,255,255,0.03)] hover:border-border"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    c.status === "missed"
                      ? "bg-[#F87171]/10 text-[#F87171]"
                      : c.status === "scheduled"
                      ? "bg-[#FACC15]/10 text-[#FACC15]"
                      : "bg-[#4ADE80]/10 text-[#4ADE80]"
                  }`}
                >
                  <Phone size={15} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-bold text-foreground leading-none">{c.name}</p>
                    <span className="text-[10px] text-muted-foreground font-['JetBrains_Mono']">{c.number}</span>
                  </div>
                  <p className="text-[11.5px] text-muted-foreground/85 font-medium mt-1">
                    Req: <span className="text-primary font-bold font-['JetBrains_Mono']">{c.vehicle}</span> · {c.reason}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground font-['JetBrains_Mono'] mt-1.5 flex items-center gap-1">
                    <Clock size={10} /> {c.time}
                  </p>
                </div>
              </div>

              {c.status !== "completed" && (
                <button
                  onClick={() => handleCall(c)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary text-primary hover:text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 cursor-pointer shadow-sm active:scale-95 shrink-0"
                >
                  <Phone size={11} /> Call Back
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredCalls.length === 0 && (
          <div className="text-center py-6 text-[12px] text-muted-foreground uppercase tracking-wider font-semibold">
            No calls found in this category
          </div>
        )}
      </div>

      {/* Simulated Phone Call Overlay */}
      <AnimatePresence>
        {activeCall && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="w-full max-w-sm bg-[#0E1626] border border-primary/30 rounded-2xl p-6 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
              
               <div className="relative mt-4 mb-6 inline-flex p-4 rounded-full bg-primary/10 border border-primary/20 animate-pulse">
                <div className="p-4 rounded-full bg-primary/20">
                  <Phone size={32} className="text-primary animate-bounce" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-foreground">{activeCall.name}</h3>
              <p className="text-[11.5px] text-muted-foreground font-['JetBrains_Mono'] mt-1">{activeCall.number}</p>
              
              <div className="my-6 py-2.5 px-4 bg-[#142035]/60 rounded-xl inline-block">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80 font-bold leading-none">
                  {callStatus === "dialing" ? "DIALING..." : callStatus === "connected" ? "CONNECTED" : "CALL ENDED"}
                </p>
                {callStatus === "connected" && (
                  <p className="text-[18px] font-bold font-['JetBrains_Mono'] text-primary mt-1">
                    {formatDuration(callDuration)}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={handleEndCall}
                  className="w-12 h-12 rounded-full bg-[#F87171] hover:bg-[#F87171]/90 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Phone size={20} className="rotate-[135deg]" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Suzuki Connect request form panel ─────────────────────────────────────────
function SuzukiConnectFormPanel({ onAction }: { onAction: (a: PanelType, d?: Record<string, unknown>) => void }) {
  const [selectedReg, setSelectedReg] = useState("HR26CW7677")
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "complete">("idle")
  const [progress, setProgress] = useState(0)
  const [activeLog, setActiveLog] = useState("")

  const vehiclesList = [
    { reg: "HR26CW7677", model: "Baleno Petrol Alpha" },
    { reg: "DL6CR1517", model: "Baleno Petrol Delta" },
    { reg: "JH10CK2349", model: "New Wagon R 1L" },
    { reg: "HR26FN3715", model: "Grand Vitara Strong Hybrid" }
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (scanStatus === "scanning") {
      setProgress(0)
      const logs = [
        "Initializing secure cellular session with vehicle telematics server...",
        "Authorizing connection using encrypted CAN-Bus digital keys...",
        "Sending live remote query signal to On-Board Diagnostic (OBD) board...",
        "Retrieving powertrain control, fuel distribution & throttle sensor indices...",
        "Decoding live diagnostic trouble codes (DTC) and battery wear thresholds...",
        "Parsing final automotive diagnostic status report..."
      ]
      let step = 0
      setActiveLog(logs[0])

      interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + 8
          if (next >= 100) {
            clearInterval(interval)
            setScanStatus("complete")
            return 100
          }
          const logIdx = Math.floor((next / 100) * logs.length)
          if (logs[logIdx] && logs[logIdx] !== activeLog) {
            setActiveLog(logs[logIdx])
          }
          return next
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [scanStatus])

  return (
    <div className="flex flex-col gap-5 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-bold font-['Rajdhani'] uppercase tracking-wider text-foreground">Suzuki Connect Diagnostic Hub</h2>
          <p className="text-[11.5px] text-muted-foreground font-sans mt-0.5">Query live vehicle telemetry and run off-board electronic diagnostic protocols.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onAction("suzuki-connect-advice")} className="px-3.5 py-1.5 bg-[#1C2A3E] hover:bg-[#253347] font-semibold text-[11.5px] text-foreground rounded-lg border border-border/80 transition-colors cursor-pointer font-['Rajdhani'] flex items-center gap-1.5"><Lightbulb size={13} className="text-primary" /> Advice Board</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-1 p-5 rounded-2xl bg-card border border-border flex flex-col justify-between">
          <div>
            <p className="text-[11px] uppercase font-['Rajdhani'] font-black tracking-widest text-[#FB923C] mb-4">Diagnostics Console</p>
            
            <label className="text-[11px] uppercase font-['Rajdhani'] font-bold text-muted-foreground block mb-1.5">Select Workshop Vehicle</label>
            <div className="relative mb-4">
              <select 
                value={selectedReg} 
                onChange={e => { setSelectedReg(e.target.value); setScanStatus("idle"); }}
                className="w-full text-[13px] px-3.5 py-2 bg-[#0E1626] border border-border/80 focus:border-primary/50 text-foreground rounded-xl outline-none font-['JetBrains_Mono'] appearance-none cursor-pointer"
              >
                {vehiclesList.map(v => (
                  <option key={v.reg} value={v.reg}>{v.reg} — {v.model}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-3.5 text-muted-foreground pointer-events-none" size={13} />
            </div>

            <div className="space-y-2 text-[12px] font-sans text-muted-foreground mb-6">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Hardware Module</span>
                <span className="text-foreground font-['JetBrains_Mono']">Suzuki-Connect v2.9</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>IP Address</span>
                <span className="text-foreground font-['JetBrains_Mono']">10.158.45.192</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>CAN-Bus Integrity</span>
                <span className="text-[#4ADE80] font-semibold font-['Rajdhani']">SECURE SEC-3</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => { setScanStatus("scanning"); }}
            disabled={scanStatus === "scanning"}
            className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/95 hover:to-accent/95 text-white font-bold text-[13px] rounded-xl font-['Rajdhani'] tracking-wider cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {scanStatus === "scanning" ? "DIAGNOSTIC SCAN ACTIVE..." : "RUN FULL OBD SCAN"}
          </button>
        </div>

        <div className="md:col-span-2 p-5 rounded-2xl bg-card border border-border min-h-[300px] flex flex-col justify-center relative overflow-hidden">
          {scanStatus === "idle" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-[56px] h-[56px] rounded-full bg-[#FB923C]/10 border border-[#FB923C]/20 flex items-center justify-center text-[#FB923C] mb-4">
                <Wifi size={24} />
              </div>
              <h3 className="text-[14px] font-bold font-['Rajdhani'] uppercase tracking-wider text-foreground mb-1.5">No Active Diagnosis Protocol</h3>
              <p className="text-[12px] text-muted-foreground font-sans max-w-sm">Select a vehicle from the console and run OBD diagnostics scan to retrieve dynamic telematics status.</p>
            </div>
          )}

          {scanStatus === "scanning" && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-[#142035]" />
                <motion.div 
                  className="absolute inset-0 rounded-full border-4 border-[#FB923C] border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[#FB923C] text-[15px] font-black font-['Rajdhani']">
                  {progress}%
                </div>
              </div>
              <h3 className="text-[14px] font-bold font-['Rajdhani'] uppercase tracking-wider text-foreground mb-2">OBD Diagnostics Check In Progress</h3>
              <p className="text-[11px] text-muted-foreground font-sans max-w-sm h-12 leading-relaxed italic">
                "{activeLog}"
              </p>
            </div>
          )}

          {scanStatus === "complete" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] animate-pulse" />
                  <span className="text-[12px] font-bold font-['Rajdhani'] uppercase tracking-widest text-[#4ADE80]">{selectedReg} TELEMETRY FEED LIVE</span>
                </div>
                <button onClick={() => setScanStatus("idle")} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline transition-all cursor-pointer font-['Rajdhani']">CLEAN START</button>
              </div>

              {/* Bento diagnostics details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-1">
                <div className="p-3 bg-[#0E1626]/60 rounded-xl border border-border/50 text-left">
                  <p className="text-[10px] text-muted-foreground uppercase font-['Rajdhani'] tracking-wide">Fuel Remaining</p>
                  <p className="text-[18px] font-bold font-['JetBrains_Mono'] text-white mt-1">68%</p>
                  <div className="w-full h-1 bg-[#142035] rounded-full overflow-hidden mt-2.5">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: "68%" }} />
                  </div>
                </div>
                <div className="p-3 bg-[#0E1626]/60 rounded-xl border border-border/50 text-left">
                  <p className="text-[10px] text-muted-foreground uppercase font-['Rajdhani'] tracking-wide">Battery Status</p>
                  <p className="text-[18px] font-bold font-['JetBrains_Mono'] text-[#4ADE80] mt-1">12.6V</p>
                  <p className="text-[10px] font-semibold font-['Rajdhani'] text-[#4ADE80] mt-1 uppercase">Excellent (89%)</p>
                </div>
                <div className="p-3 bg-[#0E1626]/60 rounded-xl border border-border/50 text-left">
                  <p className="text-[10px] text-muted-foreground uppercase font-['Rajdhani'] tracking-wide">Tire Pressures</p>
                  <p className="text-[18px] font-bold font-['JetBrains_Mono'] text-white mt-1">32 PSI</p>
                  <p className="text-[10px] font-medium font-sans text-muted-foreground mt-1">FL 32 · FR 32 · RL 31</p>
                </div>
                <div className="p-3 bg-[#0E1626]/60 rounded-xl border border-border/50 text-left">
                  <p className="text-[10px] text-muted-foreground uppercase font-['Rajdhani'] tracking-wide">OBD Diagnostics</p>
                  <p className="text-[18px] font-bold font-['JetBrains_Mono'] text-white mt-1">0 Codes</p>
                  <span className="inline-block mt-1 px-1.5 py-0.2 px-1 text-[9px] font-bold font-['Rajdhani'] rounded bg-[#4ADE80]/15 text-[#4ADE80] uppercase">HEALTHY</span>
                </div>
              </div>

              {/* Systems checklist */}
              <div className="rounded-xl border border-border/40 bg-[#0E1626]/30 overflow-hidden">
                <div className="bg-[#1C2A3E]/40 px-4 py-2 text-[10px] uppercase font-['Rajdhani'] font-bold tracking-wider text-muted-foreground">ECU Module Integrity Checks</div>
                <div className="grid grid-cols-2 gap-3 p-4 text-[11.5px] font-sans">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-[#4ADE80]" size={14} />
                    <span className="text-foreground">Engine Control Unit (ECU)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-[#4ADE80]" size={14} />
                    <span className="text-foreground">Anti-lock Braking System (ABS)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-[#4ADE80]" size={14} />
                    <span className="text-foreground">Supplemental Restraint (SRS)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-[#4ADE80]" size={14} />
                    <span className="text-foreground">Dynamic Cruise & ADAS</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground font-sans">
                <span>Diagnostic code: SUZ-CAN-PASS_OK17 - Gurugram Workshop</span>
                <span className="text-primary font-bold cursor-pointer hover:underline font-['Rajdhani'] uppercase flex items-center gap-1.5"><Download size={11} strokeWidth={2.5} /> Save Report Logs</span>
              </div>
            </motion.div>
          )}

          {/* Grid lines styling to match dashboard feel */}
          <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-primary/5 to-transparent blur-xl h-24 rotate-3 opacity-20 pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

// ── Suzuki Connect drivable advice panel ──────────────────────────────────────
function SuzukiConnectAdvicePanel({ onAction }: { onAction: (a: PanelType, d?: Record<string, unknown>) => void }) {
  const [advices, setAdvices] = useState([
    { reg: "HR26FN3715", model: "Grand Vitara Hybrid", priority: "HIGH", code: "BAT-092", problem: "Weak Battery Drain Alert (11.8V)", action: "Recharge/replace battery under warranty, inspect remote drainage leak.", status: "Pending Decision" },
    { reg: "HR26FK2786", model: "Grand Vitara Smart", priority: "MEDIUM", code: "TYR-201", problem: "Continuous drop on FL Tyre (24 PSI)", action: "Schedule puncture strip visual checks and valve micro-leak audit.", status: "Pending Decision" },
    { reg: "JH10CK2349", model: "New Wagon R 1L", priority: "LOW", code: "TEL-001", problem: "Frequent cellular telematics packet drops", action: "Perform ECU TCU update to firmware build v4.2 under current JC.", status: "In Progress" },
    { reg: "DL6CR1517", model: "Baleno Petrol Delta", priority: "INFO", code: "BRK-404", problem: "Brake Lining Sensor Threshold Warning", action: "Brake pad replacement recommendation at next PMS visit (~2,500km).", status: "Completed" }
  ])

  const notifyUser = (reg: string) => {
    alert(`Alert notification has been successfully dispatched to the assigned Service Advisor workspace for vehicle ${reg}.`);
  }

  return (
    <div className="flex flex-col gap-5 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-bold font-['Rajdhani'] uppercase tracking-wider text-foreground">Suzuki Connect Drivable Advice</h2>
          <p className="text-[11.5px] text-muted-foreground font-sans mt-0.5">Live telemetry notifications and pre-emptive maintenance warnings.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onAction("suzuki-connect-form")} className="px-3.5 py-1.5 bg-[#1C2A3E] hover:bg-[#253347] font-semibold text-[11.5px] text-foreground rounded-lg border border-border/80 transition-colors cursor-pointer font-['Rajdhani'] flex items-center gap-1.5"><Wifi size={13} className="text-[#FB923C]" /> Manual Diagnostics</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-[11.5px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-[#1C2A3E]/60 text-muted-foreground">
              <th className="px-4 py-3 text-left font-semibold text-[10px] tracking-wider uppercase font-['Rajdhani']">Vehicle</th>
              <th className="px-4 py-3 text-left font-semibold text-[10px] tracking-wider uppercase font-['Rajdhani']">Priority</th>
              <th className="px-4 py-3 text-left font-semibold text-[10px] tracking-wider uppercase font-['Rajdhani']">Telemetry Advisory</th>
              <th className="px-4 py-3 text-left font-semibold text-[10px] tracking-wider uppercase font-['Rajdhani']">Recommended SA Action</th>
              <th className="px-4 py-3 text-left font-semibold text-[10px] tracking-wider uppercase font-['Rajdhani']">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-[10px] tracking-wider uppercase font-['Rajdhani']">Control Screen</th>
            </tr>
          </thead>
          <tbody>
            {advices.map((a, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-[#142035]/25 transition-colors duration-150">
                <td className="px-4 py-3.5 whitespace-nowrap text-left">
                  <p className="text-[12.5px] font-bold font-['JetBrains_Mono'] text-primary">{a.reg}</p>
                  <p className="text-[10px] text-muted-foreground font-sans mt-0.5">{a.model}</p>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-left">
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold font-['Rajdhani'] ${
                    a.priority === "HIGH" ? "bg-red-400/15 text-[#F87171] border border-red-400/20" :
                    a.priority === "MEDIUM" ? "bg-[#FB923C]/15 text-[#FB923C] border border-[#FB923C]/20" :
                    a.priority === "LOW" ? "bg-primary/20 text-primary border border-primary/20" :
                    "bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/20"
                  }`}>
                    {a.priority}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-left max-w-[180px]">
                  <p className="text-[11.5px] font-bold font-sans text-foreground">{a.problem}</p>
                  <p className="text-[9.5px] font-['JetBrains_Mono'] text-muted-foreground/80 mt-0.5 uppercase">ID: {a.code}</p>
                </td>
                <td className="px-4 py-3.5 text-left max-w-[200px] text-muted-foreground leading-relaxed font-sans">{a.action}</td>
                <td className="px-4 py-3.5 whitespace-nowrap text-left">
                  <span className={`text-[11px] font-bold font-['Rajdhani'] ${
                    a.status === "Pending Decision" ? "text-[#FB923C]" :
                    a.status === "In Progress" ? "text-primary" : "text-[#4ADE80]"
                  }`}>
                    {a.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => {
                        setAdvices(prev => {
                          const n = [...prev]
                          n[i].status = "In Progress"
                          return n
                        })
                        notifyUser(a.reg)
                      }}
                      disabled={a.status === "Completed" || a.status === "In Progress"}
                      className="px-2.5 py-1 text-[10px] font-bold font-['Rajdhani'] bg-[#1C2A3E] border border-border/70 hover:bg-[#253347] disabled:opacity-30 disabled:cursor-not-allowed text-foreground rounded transition-colors"
                    >
                      PUSH TO TERMINAL
                    </button>
                    {a.status === "Pending Decision" && (
                      <button 
                        onClick={() => {
                          setAdvices(prev => {
                            const n = [...prev]
                            n[i].status = "Completed"
                            return n
                          })
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold font-['Rajdhani'] bg-primary text-white hover:bg-primary/95 rounded transition-colors"
                      >
                        DISPATCH ESTIMATE
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Panel Renderer ─────────────────────────────────────────────────────────────
function PanelRenderer({ panel, onAction, initialData }: { panel: PanelType; onAction: (a: PanelType, d?: Record<string, unknown>) => void; initialData?: Record<string, unknown> }) {
  if (panel === "welcome") return <WelcomePanel onAction={onAction} />
  if (panel === "appointments") return <AppointmentsPanel onAction={onAction} />
  if (panel === "vehicle-history") return <VehicleHistoryPanel initialReg={initialData?.regNo as string} />
  if (panel === "jc-opening") return <JCOpeningPanel initialReg={initialData?.regNo as string} />
  if (panel === "all-jobcards") return <AllJobCardsPanel />
  if (panel === "tasks") return <TasksPanel />
  if (panel === "notifications") return <NotificationsPanel />
  if (panel === "service-news") return <ServiceNewsPanel />
  if (panel === "my-calls") return <CallsPanel />
  if (panel === "suzuki-connect-form") return <SuzukiConnectFormPanel onAction={onAction} />
  if (panel === "suzuki-connect-advice") return <SuzukiConnectAdvicePanel onAction={onAction} />
  return null
}

// ── Message Components ─────────────────────────────────────────────────────────
function UserBubble({ text, timestamp }: { text: string; timestamp: Date }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end">
      <div className="max-w-[70%]">
        <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-primary text-white text-[13px] font-['Rajdhani'] font-medium">{text}</div>
        <p className="text-right text-[10px] text-muted-foreground mt-1 font-['JetBrains_Mono']">{timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      </div>
    </motion.div>
  )
}

function BotBubble({ text, panel, onAction, timestamp, initialData }: { text: string; panel?: PanelType; onAction: (a: PanelType, d?: Record<string, unknown>) => void; timestamp: Date; initialData?: Record<string, unknown> }) {
  const triggerSpeak = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ""));
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.includes("en-IN") || v.lang.includes("en-US") || v.lang.includes("en-"));
      if (englishVoice) utterance.voice = englishVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
        <Bot size={15} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] text-muted-foreground font-['Rajdhani'] font-semibold">NEXA AI</p>
          <button 
            onClick={triggerSpeak} 
            className="text-muted-foreground hover:text-primary transition-all p-1 hover:bg-[#1C2A3E]/65 rounded flex items-center gap-1 text-[9px] font-['Rajdhani'] uppercase tracking-widest cursor-pointer"
            title="Read out loud"
          >
            <Volume2 size={11} /> Speak
          </button>
        </div>
        <div className="p-4 rounded-2xl rounded-tl-sm bg-card border border-border">
          <p className="text-[13px] text-foreground mb-3 font-['Rajdhani']">{text}</p>
          {panel && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <PanelRenderer panel={panel} onAction={onAction} initialData={initialData} />
            </motion.div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 font-['JetBrains_Mono']">{timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
        <Bot size={15} className="text-primary" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
            className="w-1.5 h-1.5 rounded-full bg-primary/60" />
        ))}
      </div>
    </div>
  )
}

// ── Dashboard Tiles Config ────────────────────────────────────────────────────
const DASH_TILES: { panel: PanelType | null; label: string; sublabel: string; icon: typeof Calendar; color: string; count: string; badge?: number }[] = [
  { panel: "appointments", label: "My Appointments", sublabel: "2 arrived · 1 in service", icon: Calendar, color: "#3D8EF0", count: "7 Today", badge: 7 },
  { panel: "all-jobcards", label: "My Jobcards", sublabel: "1 OCAS pending", icon: ClipboardList, color: "#FACC15", count: "6 Active" },
  { panel: "vehicle-history", label: "Vehicle History", sublabel: "Enter Reg No / VIN", icon: Car, color: "#0DCAF0", count: "Search" },
  { panel: "my-calls", label: "My Calls", sublabel: "2 missed today", icon: Phone, color: "#4ADE80", count: "2 Missed" },
  { panel: "tasks", label: "Tasks For Today", sublabel: "2 high priority", icon: CheckSquare, color: "#A78BFA", count: "6 Pending" },
  { panel: "suzuki-connect-form", label: "SUZUKI CONNECT\nRequest Form", sublabel: "Drivable requests", icon: Wifi, color: "#FB923C", count: "Submit" },
  { panel: "suzuki-connect-advice", label: "Suzuki Connect\nDrivable Advice", sublabel: "View recommendations", icon: Lightbulb, color: "#34D399", count: "Advice" },
]

const DASH_STATS = [
  { label: "Appointments", value: "7", icon: Calendar, color: "#3D8EF0", sub: "Today · 2 arrived" },
  { label: "Active JCs", value: "3", icon: FileText, color: "#FACC15", sub: "1 OCAS pending" },
  { label: "Pending Tasks", value: "6", icon: CheckSquare, color: "#A78BFA", sub: "2 high priority" },
  { label: "Unread Alerts", value: "3", icon: Bell, color: "#F87171", sub: "1 urgent" },
]

// ── Dashboard View ────────────────────────────────────────────────────────────
function DashboardView({ onTileClick }: { onTileClick: (panel: PanelType) => void }) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-none">
      {/* Stats Metrics Bar */}
      <div className="px-6 pt-5 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {DASH_STATS.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            whileHover={{ y: -3, scale: 1.02 }}
            className="relative flex flex-col justify-between p-4.5 rounded-xl bg-gradient-to-br from-[#0D1527] to-[#080E1C] border border-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.08)] shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-all duration-300 group cursor-default overflow-hidden"
            style={{ 
              borderLeft: `3px solid ${s.color}`,
              boxShadow: `inset 0 1px 1px rgba(255,255,255,0.02), 0 4px 20px rgba(0,0,0,0.5)`
            }}>
            {/* Ambient Background Glow matching the card color */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-[35px] opacity-10 group-hover:opacity-20 transition-all duration-500 pointer-events-none"
              style={{ background: s.color }} />

            {/* Top Row: Icon container + Label */}
            <div className="flex items-center justify-between w-full mb-3 shrink-0">
              <p className="text-[10px] font-bold text-muted-foreground/85 uppercase tracking-widest font-['Rajdhani'] leading-none">{s.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:rotate-12"
                style={{ background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
                <s.icon size={14} style={{ color: s.color }} />
              </div>
            </div>

            {/* Bottom Row: Large Value + Sub info */}
            <div className="min-w-0 mt-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[28px] font-black font-['Rajdhani'] leading-none tracking-tight" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9.5px] text-muted-foreground font-['JetBrains_Mono'] truncate max-w-[50%]">{s.sub}</p>
              </div>
              
              {/* Sleek customized progress/meter bar underneath */}
              <div className="w-full h-1 bg-[#142035] rounded-full overflow-hidden mt-3.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: i === 0 ? "70%" : i === 1 ? "45%" : i === 2 ? "60%" : "30%" }}
                  transition={{ duration: 1, delay: 0.1 }}
                  className="h-full rounded-full"
                  style={{ 
                    background: `linear-gradient(90deg, ${s.color}88, ${s.color})`,
                    boxShadow: `0 0 6px ${s.color}bf`
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main 4×2 Tile Grid */}
      <div className="px-6 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DASH_TILES.map((t, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.055, type: "spring", stiffness: 280, damping: 22 }}
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => t.panel && onTileClick(t.panel)}
            className="relative flex flex-col items-center justify-center gap-3 pt-6 pb-5 px-4 rounded-2xl bg-card border transition-all duration-300 group overflow-hidden text-center cursor-pointer"
            style={{ borderColor: `${t.color}18` }}
          >
            {/* Radial glow on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 50% 40%, ${t.color}14 0%, transparent 68%)` }} />

            {/* Top accent line */}
            <motion.div className="absolute top-0 left-6 right-6 h-[2px] rounded-full"
              style={{ background: `linear-gradient(90deg, transparent, ${t.color}, transparent)` }}
              initial={{ scaleX: 0, opacity: 0 }}
              whileHover={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.3 }} />

            {/* Badge */}
            {t.badge && (
              <div className="absolute top-3 right-3 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-white text-[10px] font-bold font-['Rajdhani']"
                style={{ background: t.color }}>
                {t.badge}
              </div>
            )}

            {/* Icon container */}
            <div className="relative w-[60px] h-[60px] rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{ background: `${t.color}14`, border: `1.5px solid ${t.color}28` }}>
              {/* Inner glow ring */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ boxShadow: `0 0 20px ${t.color}40` }} />
              <t.icon size={26} style={{ color: t.color }} />
            </div>

            {/* Labels */}
            <div>
              <p className="text-[13px] font-bold text-foreground font-['Rajdhani'] leading-tight whitespace-pre-line group-hover:text-white transition-colors">{t.label}</p>
              <p className="text-[11px] font-semibold font-['JetBrains_Mono'] mt-1 transition-colors" style={{ color: t.color }}>{t.count}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{t.sublabel}</p>
            </div>

            {/* Bottom arrow on hover */}
            {t.panel && (
              <div className="absolute bottom-2.5 right-3 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                <ArrowRight size={12} style={{ color: t.color }} />
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Service News */}
      <div className="px-6 pb-6">
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          {/* Section header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-[#0A1020]/50">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-primary" />
              <p className="text-[12px] uppercase font-['Rajdhani'] font-black tracking-widest text-foreground">Service News</p>
            </div>
            <button className="flex items-center gap-1 text-primary text-[11px] font-semibold font-['Rajdhani'] hover:text-accent transition-colors">
              VIEW ALL <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border">
            {SERVICE_NEWS.map((news, i) => (
              <motion.div key={news.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 + i * 0.07 }}
                className="p-4 hover:bg-[#1C2A3E]/30 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-['Rajdhani'] ${
                    news.category === "Campaign" ? "bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/20" :
                    news.category === "Training" ? "bg-primary/15 text-primary border border-primary/20" :
                    "bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/20"
                  }`}>{news.category}</span>
                  <span className="text-[10px] text-muted-foreground font-['JetBrains_Mono']">{news.date}</span>
                </div>
                <p className="text-[12.5px] font-bold text-foreground font-['Rajdhani'] mb-1.5 group-hover:text-primary transition-colors leading-snug">{news.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{news.summary}</p>
                <div className="flex items-center gap-3 mt-3">
                  <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-['Rajdhani']"><Eye size={11} /> Read</button>
                  <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-['Rajdhani']"><Download size={11} /> Save</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sidebar Data ──────────────────────────────────────────────────────────────
const CHAT_HISTORY = [
  { id: "h1", label: "JC opening for HR26CW7677 Baleno", section: "Today" },
  { id: "h2", label: "Vehicle history – DL6CR1517", section: "Today" },
  { id: "h3", label: "OCAS approval for JH10CK2349", section: "Yesterday" },
  { id: "h4", label: "Customer follow-up task list", section: "Yesterday" },
  { id: "h5", label: "PMS schedule – June 2026 update", section: "7 Days" },
  { id: "h6", label: "Battery OCAS – Rahul Mehta Baleno", section: "7 Days" },
  { id: "h7", label: "Jimny campaign inspection list", section: "7 Days" },
]

const NAV_ITEMS: { id: PanelType; icon: typeof Calendar; label: string; badge?: number }[] = [
  { id: "appointments", icon: Calendar, label: "Appointments", badge: 7 },
  { id: "all-jobcards", icon: ClipboardList, label: "Job Cards" },
  { id: "vehicle-history", icon: Car, label: "Vehicle History" },
  { id: "my-calls", icon: Phone, label: "My Calls", badge: 2 },
  { id: "jc-opening", icon: FileText, label: "Open New JC" },
  { id: "tasks", icon: CheckSquare, label: "My Tasks" },
  { id: "service-news", icon: Newspaper, label: "Service News" },
]

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ onNav, onNewChat, setSidebarOpen }: {
  onNav: (id: PanelType) => void
  onNewChat: () => void
  setSidebarOpen: (v: boolean) => void
}) {
  const [search, setSearch] = useState("")
  const [history, setHistory] = useState(CHAT_HISTORY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const sections = ["Today", "Yesterday", "7 Days"]
  const filtered = history.filter(h => h.label.toLowerCase().includes(search.toLowerCase()))

  function startEdit(id: string, label: string, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingId(id)
    setEditingValue(label)
  }

  function commitEdit(id: string) {
    const trimmed = editingValue.trim()
    if (trimmed) setHistory(prev => prev.map(h => h.id === id ? { ...h, label: trimmed } : h))
    setEditingId(null)
  }

  return (
    <div className="w-64 shrink-0 h-full flex flex-col bg-[#080E1C] border-r border-[rgba(61,142,240,0.1)]">
      {/* Logo + collapse */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-[rgba(61,142,240,0.08)] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/40">
            <span className="text-white text-[11px] font-black font-['Rajdhani']">N</span>
          </div>
          <span className="text-[15px] font-black text-foreground tracking-[0.18em] font-['Rajdhani']">NEXA</span>
        </div>
        <button onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#1C2A3E]/60 transition-colors">
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* New Conversation */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <button onClick={onNewChat}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[rgba(61,142,240,0.18)] bg-[#1C2A3E]/50 hover:bg-[#1C2A3E] text-[12.5px] font-semibold font-['Rajdhani'] text-foreground transition-all group">
          <div className="w-4 h-4 rounded-md bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors shrink-0">
            <Plus size={11} className="text-primary" />
          </div>
          New conversation
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3 shrink-0">
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="w-full pl-7 pr-3 py-1.5 text-[12px] bg-[#1C2A3E]/40 border border-[rgba(61,142,240,0.12)] rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/30 font-['Rajdhani'] transition-colors" />
        </div>
      </div>

      {/* Quick nav */}
      <div className="px-3 pb-3 shrink-0">
        <p className="px-2 pb-1.5 text-[9.5px] uppercase tracking-widest text-muted-foreground/60 font-['Rajdhani'] font-bold">Quick Access</p>
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => onNav(item.id)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] text-muted-foreground hover:text-foreground hover:bg-[#1C2A3E]/60 transition-all font-['Rajdhani'] font-semibold group">
              <item.icon size={13} className="shrink-0 text-muted-foreground/70 group-hover:text-primary transition-colors" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[#F87171]/15 text-[#F87171] font-['Rajdhani']">{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto px-3 scrollbar-none">
        {sections.map(section => {
          const items = filtered.filter(h => h.section === section)
          if (!items.length) return null
          return (
            <div key={section} className="mb-3">
              <p className="px-2 pb-1.5 pt-1 text-[9.5px] uppercase tracking-widest text-muted-foreground/50 font-['Rajdhani'] font-bold">{section}</p>
              <div className="flex flex-col gap-0.5">
                {items.map(h => (
                  <div key={h.id} className="group relative flex items-center rounded-lg hover:bg-[#1C2A3E]/50 transition-all">
                    {editingId === h.id ? (
                      <input
                        autoFocus
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onBlur={() => commitEdit(h.id)}
                        onKeyDown={e => {
                          if (e.key === "Enter") commitEdit(h.id)
                          if (e.key === "Escape") setEditingId(null)
                        }}
                        className="flex-1 px-2.5 py-1.5 text-[12px] bg-[#1C2A3E] border border-primary/40 rounded-lg text-foreground outline-none font-['Rajdhani'] min-w-0"
                      />
                    ) : (
                      <>
                        <button
                          className="flex-1 text-left px-2.5 py-1.5 text-[12px] text-muted-foreground group-hover:text-foreground transition-colors font-['Rajdhani'] truncate min-w-0">
                          {h.label}
                        </button>
                        <button
                          onClick={e => startEdit(h.id, h.label, e)}
                          className="shrink-0 mr-1.5 p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* User profile */}
      <div className="px-3 py-3 border-t border-[rgba(61,142,240,0.08)] shrink-0">
        <div className="flex items-center gap-2.5 px-1.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
            <span className="text-white text-[10px] font-black font-['Rajdhani']">VY</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold text-foreground font-['Rajdhani'] truncate">Vishal Yadav</p>
            <p className="text-[10px] text-muted-foreground truncate">Service Advisor · NEXA Gurgaon</p>
          </div>
          <button className="p-1.5 rounded-lg text-muted-foreground hover:text-[#F87171] hover:bg-[#F87171]/10 transition-colors shrink-0">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Welcome Screen ─────────────────────────────────────────────────────────────
function WelcomeScreen({ 
  onAction, 
  onScanTrigger 
}: { 
  onAction: (id: PanelType, data?: Record<string, unknown>) => void,
  onScanTrigger: () => void 
}) {
  const cards = [
    {
      id: "scan-plate",
      icon: Camera,
      label: "Camera for scan",
      desc: "Align and capture vehicle license plate OCR content instantly"
    },
    {
      id: "jc-opening",
      icon: FileText,
      label: "Add new job card",
      desc: "Initiate digital inventory walkaround checklists and estimates"
    },
    {
      id: "appointments",
      icon: Calendar,
      label: "Upcoming appointment",
      desc: "Check arrived vehicles and allocate active shop service bays"
    },
    {
      id: "service-news",
      icon: Newspaper,
      label: "New news update",
      desc: "Check campaigns, active service advisories, and spare parts updates"
    }
  ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 pb-4">
      {/* Orb */}
      <div className="relative w-[76px] h-[76px] mb-7">
        <div className="absolute inset-0 rounded-full bg-primary/25 blur-2xl scale-[1.8] animate-pulse" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/70 to-accent/50 blur-[8px]" />
        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#5AAEFF] via-[#3D8EF0] to-[#0DCAF0]"
          style={{ boxShadow: "0 0 36px rgba(61,142,240,0.65), 0 0 72px rgba(13,202,240,0.25), inset 0 1px 1px rgba(255,255,255,0.35)" }} />
      </div>

      {/* Greeting */}
      <p className="text-[16px] font-bold font-['Rajdhani'] text-primary tracking-wider mb-1">Hello, Vishal</p>
      <p className="text-[27px] font-black text-foreground font-['Rajdhani'] mb-3 text-center leading-tight">
        How can I assist you today?
      </p>
      <p className="text-[13px] text-muted-foreground mb-10 text-center max-w-md leading-relaxed">
        Manage appointments, open job cards, check vehicle history, or ask anything about today's service work.
      </p>

      {/* Feature cards */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-[760px]">
        {cards.map((card, idx) => (
          <motion.button key={idx} onClick={() => {
            if (card.id === "scan-plate") {
              onScanTrigger();
            } else {
              onAction(card.id as PanelType);
            }
          }}
            whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(61,142,240,0.12)" }} whileTap={{ scale: 0.97 }}
            className="flex flex-col gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/25 transition-all text-left cursor-pointer group">
            <card.icon size={17} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <div>
              <p className="text-[13px] font-bold text-foreground font-['Rajdhani'] mb-1">{card.label}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{card.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [view, setView] = useState<"dashboard" | "chat">("chat")
  const [activeDashPanel, setActiveDashPanel] = useState<PanelType | null>(null)
  const [activeDashPanelData, setActiveDashPanelData] = useState<Record<string, unknown> | undefined>(undefined)
  const [sharedNotifs, setSharedNotifs] = useSharedNotifications()
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const unreadCount = sharedNotifs.filter(n => !n.read).length
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [attachedFile, setAttachedFile] = useState<{name: string, type: 'image' | 'pdf' | 'other'} | null>(null)
  const [isScanningInChat, setIsScanningInChat] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  // Theme Sync State & Hook
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("nexa-theme")
    return (saved as "light" | "dark") || "dark"
  })

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("nexa-theme", theme)
  }, [theme])

  // Speech Assistant States
  const [isListening, setIsListening] = useState(false)
  const [isVoiceHUDOpen, setIsVoiceHUDOpen] = useState(false)
  const [speakResponses, setSpeakResponses] = useState(false)
  const [interimText, setInterimText] = useState("")
  const [speechError, setSpeechError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Initialize Speech Recognition natively in-browser
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = true
      rec.lang = 'en-IN' // Tailored for Indian region pronunciation (Maruti Suzuki NEXA)

      rec.onstart = () => {
        setIsListening(true)
        setIsVoiceHUDOpen(true)
        setSpeechError(null)
        setInterimText("Listening for NEXA command...")
      }

      rec.onresult = (event: any) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }

        if (finalTranscript) {
          setInput(finalTranscript)
          handleSendVoice(finalTranscript)
          setInterimText("")
        } else {
          setInterimText(interimTranscript || "Transcribing...")
        }
      }

      rec.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error)
        setIsListening(false)
        if (event.error === 'not-allowed') {
          setSpeechError(
            "Microphone blocked: Browser iframe standards require top-level focus. " +
            "To activate actual physical microphone capture, click the 'Open in new tab' button at top-right. " +
            "Alternatively, use our instant hands-free simulation dashboard triggers below!"
          )
        } else if (event.error === 'no-speech') {
          setSpeechError("No voice detected. Please click Simulated Triggers below or speak closer to your microphone.")
        } else {
          setSpeechError(`Voice status error: ${event.error}`)
        }
      }

      rec.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = rec
    } else {
      setSpeechError("Web Speech API is not supported on this browser context. Please use our HUD Voice Emulator below.")
    }
  }, [])

  const toggleListening = () => {
    setSpeakResponses(true)
    const nextHUDOpen = !isVoiceHUDOpen
    setIsVoiceHUDOpen(nextHUDOpen)
    
    if (!recognitionRef.current) {
      // Toggle simulated overlay
      setIsListening(nextHUDOpen)
      setSpeechError("Browser iframe sandboxed. Activating NEXA OCR & HUD Voice Emulator.")
      return
    }
    
    setSpeechError(null)
    if (nextHUDOpen) {
      try {
        recognitionRef.current.start()
      } catch (e) {
        console.error(e)
        // Recover state
        try { recognitionRef.current.stop() } catch(_) {}
        setTimeout(() => {
          try { recognitionRef.current.start() } catch(err) {
            console.error("Failed to recover voice start:", err)
            setSpeechError(
              "Sandbox constraints detected. Open this app in a New Tab to grant microphone access, " +
              "or click the simulation toggles below to execute vocal flows instantly!"
            )
          }
        }, 100)
      }
    } else {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.error(e)
      }
      setIsListening(false)
    }
  }

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    
    const voices = window.speechSynthesis.getVoices();
    const desiredVoice = voices.find(v => v.lang.includes("en-IN") || v.lang.includes("en-US") || v.lang.includes("en-"));
    if (desiredVoice) utterance.voice = desiredVoice;
    
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages, typing])

  function addUserMessage(text: string) {
    const msg: Message = { id: Date.now().toString(), role: "user", text, timestamp: new Date() }
    setMessages(prev => [...prev, msg])
  }

  function addBotMessageSync(text: string, panel?: PanelType, initialData?: Record<string, unknown>) {
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(), role: "bot", text, panel, initialData,
      timestamp: new Date(),
    }]);
  }

  async function handleSendVoice(text: string) {
    if (!text.trim()) return
    addUserMessage(text)
    setTyping(true)
    await processChatMessage(text.trim())
  }

  async function processChatMessage(trimmed: string) {
    const upperText = trimmed.toUpperCase();
    
    // Check if user is asking to add or open a job card
    if (
      upperText.includes("ADD JOB CARD") || 
      upperText.includes("OPEN JOB CARD") || 
      upperText.includes("NEW JOB CARD") || 
      upperText.includes("CREATE JOB CARD") || 
      upperText.includes("ADD JC") || 
      upperText.includes("OPEN JC") ||
      upperText.includes("JOB CARD PROCESS")
    ) {
      // Find reg number inside prompt
      const regMatch = trimmed.match(/[A-Za-z]{2}\d{1,2}[A-Za-z]{1,2}\d{4}/) || trimmed.match(/DL6CR1517/i) || trimmed.match(/HR26DS6144/i) || trimmed.match(/HR26CW7677/i);
      const regNoVal = regMatch ? regMatch[0].toUpperCase() : "";
      
      const responseText = regNoVal 
        ? `Initiating guided Job Card setup workflow for vehicle **${regNoVal}**. Advancing to Step 1: Customer & Vehicle Details...`
        : `Opening the digital walkaround workspace to create a new Job Card. Please enter or scan the vehicle number plate.`;
      
      setTimeout(() => {
        setTyping(false);
        addBotMessageSync(responseText, "jc-opening", { regNo: regNoVal });
        
        // Hands-free Navigation Transition
        setActiveDashPanel("jc-opening");
        setActiveDashPanelData({ regNo: regNoVal });
        setView("dashboard");
        
        if (speakResponses) {
          speakText(responseText.replace(/\*\*/g, ""));
        }
      }, 700);
      return;
    }

    // Check if user is asking for vehicle history
    if (
      upperText.includes("VEHICLE HISTORY") || 
      upperText.includes("CAR HISTORY") || 
      upperText.includes("CHECK HISTORY") || 
      upperText.includes("PAST RECORDS") ||
      upperText.includes("VEHICLE RECORD")
    ) {
      const regMatch = trimmed.match(/[A-Za-z]{2}\d{1,2}[A-Za-z]{1,2}\d{4}/) || trimmed.match(/DL6CR1517/i) || trimmed.match(/HR26DS6144/i) || trimmed.match(/HR26CW7677/i);
      const regNoVal = regMatch ? regMatch[0].toUpperCase() : "DL6CR1517"; // default to valid history reg
      
      const responseText = `Searching databases... Found past history files for vehicle **${regNoVal}**. Displaying comprehensive workshop logs now.`;
      
      setTimeout(() => {
        setTyping(false);
        addBotMessageSync(responseText, "vehicle-history", { regNo: regNoVal });
        
        // Hands-free Navigation Transition
        setActiveDashPanel("vehicle-history");
        setActiveDashPanelData({ regNo: regNoVal });
        setView("dashboard");

        if (speakResponses) {
          speakText(responseText.replace(/\*\*/g, ""));
        }
      }, 700);
      return;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const data = await response.json();
      setTyping(false);
      addBotMessageSync(data.botText, data.panel || undefined, data.initialData);
      
      // Hands-free navigation from custom AI responses
      if (data.panel) {
        setActiveDashPanel(data.panel);
        setView("dashboard");
        if (data.initialData) {
          setActiveDashPanelData(data.initialData);
        }
      }

      if (speakResponses && data.botText) {
        speakText(data.botText.replace(/\*\*/g, ""));
      }
    } catch (error) {
      setTyping(false);
      let fallbackText = "I have processed your request. Opening relevant screen in your dashboard now.";
      let matchedPanel: PanelType | undefined = undefined;
      let matchedData: Record<string, unknown> | undefined = undefined;
      
      if (upperText.includes("HELLO") || upperText.includes("HI")) {
        fallbackText = "Hello! I am NEXA AI voice-enabled copilot assistant. You can speak to me or type to navigate today's appointments, trigger a vehicle number plate scan, or open a job card.";
      } else if (upperText.includes("APPOINTMENT")) {
        fallbackText = "Now pulling today's scheduled service appointments database.";
        matchedPanel = "appointments";
      } else if (upperText.includes("TASK")) {
        fallbackText = "Opening your pending daily tasks audit dashboard.";
        matchedPanel = "tasks";
      } else if (upperText.includes("CALL")) {
        fallbackText = "Loading scheduled callback queues and customer query response logs.";
        matchedPanel = "my-calls";
      }

      addBotMessageSync(fallbackText, matchedPanel, matchedData);
      
      if (matchedPanel) {
        setActiveDashPanel(matchedPanel);
        setView("dashboard");
        if (matchedData) {
          setActiveDashPanelData(matchedData);
        }
      }

      if (speakResponses) {
        speakText(fallbackText);
      }
    }
  }

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed && !attachedFile) return
    setInput("")

    let displayMessage = trimmed
    if (attachedFile) {
      displayMessage = `[📎 Attached ${attachedFile.type.toUpperCase()}: ${attachedFile.name}] ${trimmed}`
    }

    addUserMessage(displayMessage)
    setTyping(true)

    const currentAttachment = attachedFile;
    setAttachedFile(null);

    if (currentAttachment) {
      setTimeout(() => {
        setTyping(false);
        if (currentAttachment.type === 'image') {
          addBotMessageSync(
            `📎 Received image file: **${currentAttachment.name}**\n\n` +
            `🤖 **NEXA AI Body Damage Detection analysis complete:**\n` +
            `- **Rear Left Fender**: Moderate scratch section depth (32cm, repairable surface)\n` +
            `- **Rear Bumper Outer Shell**: Slight alignment drift on clip-mount locks\n` +
            `- **Suggested Job Card Demands**: *Rear left panel painting & bumper alignment audit* (Diagnostic estimate: **₹4,200**)\n\n` +
            `*Automatically opening Job Card Panel to view or complete checklist demands.*`,
            "jc-opening",
            { regNo: "" }
          );
          setActiveDashPanel("jc-opening");
          setActiveDashPanelData({ regNo: "" });
          setView("dashboard");
        } else if (currentAttachment.type === 'pdf') {
          addBotMessageSync(
            `📎 Received documents folder/PDF: **${currentAttachment.name}**\n\n` +
            `🤖 **NEXA AI Historical Service Summary:**\n` +
            `- **Vehicle Record ID**: DL6CR1517 (Matched past dealership databases)\n` +
            `- **Repairs summary**: 8 historic services successfully recorded. Fuel injectors serviced, battery updated with 36-month standard warranty coverage, sparks replaced (~45K km).\n` +
            `- **Advisories**: Brake pads wear was flagged at 3.5mm thickness limit. Recommending inspect pads.\n\n` +
            `*Automatically launching Vehicle History Search workspace panel.*`,
            "vehicle-history",
            { regNo: "DL6CR1517" }
          );
          setActiveDashPanel("vehicle-history");
          setActiveDashPanelData({ regNo: "DL6CR1517" });
          setView("dashboard");
        } else {
          addBotMessageSync(
            `📎 Upload folder processed successfully: **${currentAttachment.name}**.\n` +
            `Please specify what you would like me to extract or review from this custom workspace document.`
          );
        }
      }, 1200);
      return;
    }

    await processChatMessage(trimmed);
  }

  const BOT_TEXTS: Record<PanelType, string> = {
    welcome: "Welcome back, Vishal.",
    appointments: "Here are your appointments for today, 21-May-2026. You have 7 scheduled visits.",
    "vehicle-history": "Enter a registration number or VIN to pull the complete vehicle service history.",
    "jc-opening": "Starting Job Card Opening. Please scan or enter the vehicle registration number.",
    "all-jobcards": "Here are all your active and recent Job Cards.",
    tasks: "Here are your tasks for today, 21-May-2026. You have 6 pending items.",
    notifications: "You have 3 unread notifications — including 1 urgent alert.",
    "service-news": "Latest service news, campaigns, and mandatory updates from NEXA.",
    "my-calls": "You have 2 missed customer callback requests pending handling.",
    "suzuki-connect-form": "Starting Suzuki Connect Telematics request setup form.",
    "suzuki-connect-advice": "Loading telematics diagnostic feedback guidelines.",
  }

  const ACTION_LABELS: Record<PanelType, string> = {
    welcome: "Home",
    appointments: "Show my appointments",
    "vehicle-history": "Check vehicle history",
    "jc-opening": "Open a new Job Card",
    "all-jobcards": "Show all Job Cards",
    tasks: "Show today's tasks",
    notifications: "Show notifications",
    "service-news": "Show service news",
    "my-calls": "Check Missed Calls Queue",
    "suzuki-connect-form": "Suzuki Connect installation request",
    "suzuki-connect-advice": "Suzuki Connect telematics advice",
  }

  function handleQuickAction(id: PanelType, data?: Record<string, unknown>) {
    if (view !== "chat") setView("chat")
    addUserMessage(ACTION_LABELS[id])
    addBotMessageSync(BOT_TEXTS[id], id, data)
    setActiveDashPanel(id)
    setActiveDashPanelData(data)
  }

  function handleTileClick(panel: PanelType) {
    setView("chat")
    setTimeout(() => handleQuickAction(panel), 180)
  }

  function handleNewChat() {
    setMessages([])
    setView("chat")
  }

  const showWelcome = messages.length === 0 && view === "chat"

  return (
    <div className="h-screen flex bg-background overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && view === "chat" && (
          <motion.div key="sidebar"
            initial={{ width: 0, opacity: 0 }} animate={{ width: 256, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="shrink-0 overflow-hidden h-full">
            <Sidebar 
              onNav={(id) => {
                if (view === "dashboard") {
                  setActiveDashPanel(id);
                } else {
                  handleQuickAction(id);
                }
              }} 
              onNewChat={handleNewChat} 
              setSidebarOpen={setSidebarOpen} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main panel ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">

        {/* Top bar */}
        <div className="shrink-0 h-12 flex items-center justify-between px-4 border-b border-[rgba(61,142,240,0.1)] bg-[#070C16]">
          <div className="flex items-center gap-3">
            {view === "chat" && !sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#1C2A3E] transition-colors">
                <ChevronRight size={14} />
              </button>
            )}
            {/* View toggle */}
            <div className="flex items-center bg-[#1C2A3E]/50 rounded-lg p-0.5 border border-[rgba(61,142,240,0.12)]">
              <button onClick={() => setView("chat")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-semibold font-['Rajdhani'] transition-all ${view === "chat" ? "bg-primary text-white shadow-sm shadow-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
                <MessageSquare size={11} /> AI Chat
              </button>
              <button onClick={() => setView("dashboard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-semibold font-['Rajdhani'] transition-all ${view === "dashboard" ? "bg-primary text-white shadow-sm shadow-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
                <LayoutDashboard size={11} /> Dashboard
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1.5 px-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
              <span className="text-[10.5px] text-muted-foreground font-['JetBrains_Mono']">21 May 2026 · 10:32 AM</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 mr-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#1C2A3E]/80 transition-colors cursor-pointer flex items-center justify-center"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              {theme === "dark" ? <Sun size={14} className="text-[#FACC15]" /> : <Moon size={14} className="text-secondary-foreground" />}
            </button>

            <div className="relative">
              <button 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#1C2A3E]/80 transition-colors cursor-pointer"
              >
                <Bell size={14} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#F87171] text-white text-[7.5px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setNotifDropdownOpen(false)} />
              )}

              <AnimatePresence>
                {notifDropdownOpen && (
                  <motion.div
                    key="notif-dropdown"
                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-[#0E1726] border border-[rgba(61,142,240,0.18)] rounded-xl shadow-2xl z-50 overflow-hidden font-['Rajdhani']"
                  >
                    <div className="p-3.5 border-b border-[rgba(61,142,240,0.08)] flex items-center justify-between bg-[#111C2E]">
                      <span className="text-[13px] font-bold tracking-wide text-foreground uppercase">Notifications ({unreadCount} new)</span>
                      <button 
                        onClick={() => setSharedNotifs(ns => ns.map(n => ({ ...n, read: true })))}
                        className="text-[11px] text-primary hover:text-accent font-semibold transition-colors cursor-pointer"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-[rgba(255,255,255,0.03)] scrollbar-none">
                      {sharedNotifs.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground text-[12px]">
                          No notifications
                        </div>
                      ) : (
                        sharedNotifs.map(n => {
                          const s = notifStyle(n.type);
                          const Icon = n.type === 'urgent' || n.type === 'warning' ? AlertTriangle : n.type === 'success' ? CheckCircle : Bell;
                          return (
                              <div 
                                key={n.id} 
                                onClick={() => {
                                  setSharedNotifs(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x));
                                }}
                                className={`flex gap-2.5 p-3.5 hover:bg-[#14223A] transition-colors cursor-pointer text-left ${!n.read ? 'bg-[#121E33]/30' : 'opacity-65'}`}
                              >
                                <Icon size={14} className={`mt-0.5 shrink-0 ${s.icon}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[12px] font-semibold leading-snug break-words ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {n.text}
                                  </p>
                                  <p className="text-[9.5px] text-muted-foreground font-['JetBrains_Mono'] mt-1">
                                    {n.type.toUpperCase()} · {n.time}
                                  </p>
                                </div>
                                {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#1C2A3E] transition-colors">
              <Settings size={14} />
            </button>
            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-[rgba(61,142,240,0.12)]">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm shadow-primary/30">
                <span className="text-white text-[9px] font-black font-['Rajdhani']">VY</span>
              </div>
              <span className="text-[12px] font-semibold text-foreground font-['Rajdhani']">Vishal Yadav</span>
            </div>
          </div>
        </div>

        {/* Content area */}
        <AnimatePresence mode="wait">
          {view === "dashboard" ? (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-none bg-[#070C16]">
              {activeDashPanel ? (
                <div className="flex-1 flex flex-col min-h-0 bg-[#070C16] p-6">
                  {/* Standalone Dashboard Flow Header */}
                  <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-[rgba(61,142,240,0.1)] shrink-0">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setActiveDashPanel(null)}
                        className="text-muted-foreground hover:text-foreground text-[12px] font-semibold font-['Rajdhani'] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111A2E] hover:bg-[#1C2A3E] border border-[rgba(61,142,240,0.1)] transition-all cursor-pointer"
                      >
                        <ChevronLeft size={13} /> Return to Dashboard
                      </button>
                      <span className="text-muted-foreground/30 font-['Rajdhani']">/</span>
                      <span className="text-foreground text-[14px] font-bold uppercase tracking-wider font-['Rajdhani'] flex items-center gap-1.5">
                        {activeDashPanel.replace("-", " ")} Workspace
                      </span>
                    </div>
                  </div>
                  
                  {/* Standalone Panel Workspace */}
                  <div className="flex-1 overflow-y-auto scrollbar-none min-h-0">
                    <PanelRenderer 
                      panel={activeDashPanel} 
                      initialData={activeDashPanelData}
                      onAction={(actionId, data) => {
                        if (actionId === "welcome") {
                          setActiveDashPanel(null);
                          setActiveDashPanelData(undefined);
                        } else {
                          setActiveDashPanel(actionId);
                          setActiveDashPanelData(data);
                        }
                      }} 
                    />
                  </div>
                </div>
              ) : (
                <DashboardView onTileClick={(panel) => setActiveDashPanel(panel)} />
              )}
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="flex-1 flex flex-col min-h-0">

              {/* Welcome or chat messages */}
              <AnimatePresence mode="wait">
                {showWelcome ? (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }} className="flex-1 flex flex-col min-h-0">
                    <WelcomeScreen 
                      onAction={handleQuickAction} 
                      onScanTrigger={() => setIsScanningInChat(true)} 
                    />
                  </motion.div>
                ) : (
                  <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    ref={chatRef} className="flex-1 overflow-y-auto py-8 flex flex-col gap-7 scrollbar-none">
                    <div className="max-w-3xl mx-auto w-full px-6 flex flex-col gap-7">
                      {messages.map(msg => (
                        msg.role === "user"
                          ? <UserBubble key={msg.id} text={msg.text} timestamp={msg.timestamp} />
                          : <BotBubble key={msg.id} text={msg.text} panel={msg.panel} onAction={handleQuickAction} timestamp={msg.timestamp} initialData={msg.initialData} />
                      ))}
                      <AnimatePresence>
                        {typing && (
                          <motion.div
                            key="typing-indicator"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <TypingIndicator />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="h-2" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input bar — always visible in chat view */}
              <div className="shrink-0 px-6 pb-5 pt-3 border-t border-[rgba(61,142,240,0.08)] bg-[#070C16]">
                <div className="max-w-3xl mx-auto">
                  {isScanningInChat && (
                    <div className="mb-3.5 bg-[#090F1C] rounded-2xl border border-dashed border-primary/30 p-1 overflow-hidden shadow-2xl">
                      <PlateScanner 
                        onScan={(res) => {
                          setInput(`Check vehicle history for ${res}`);
                          setIsScanningInChat(false);
                        }} 
                        onClose={() => setIsScanningInChat(false)} 
                      />
                    </div>
                  )}
                  {isVoiceHUDOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="mb-3.5 p-4 rounded-2xl border border-[rgba(239,68,68,0.25)] bg-[#0B0609] shadow-2xl relative overflow-hidden"
                    >
                      {/* Tech grid style */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                      
                      <div className="relative z-10 flex flex-col gap-3">
                        <div className="flex items-center justify-between border-b border-red-500/10 pb-2">
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-amber-400'}`} />
                            <span className={`text-[11.5px] uppercase tracking-wider font-extrabold font-['Rajdhani'] flex items-center gap-1 ${isListening ? 'text-red-500' : 'text-amber-400'}`}>
                              <Mic size={12} className={isListening ? "text-red-500 animate-bounce" : "text-amber-400"} /> 
                              {isListening ? "NEXA Voice Assistant - Live Listening" : "NEXA Voice Assistant - Standby"}
                            </span>
                          </div>
                          
                          {/* Live Rhythmic Sound Wave */}
                          <div className="flex gap-1.5 items-center bg-[#170C0E]/70 px-2.5 py-1 rounded-full border border-red-500/10">
                            {[0.1, 0.4, 0.2, 0.6, 0.3, 0.5, 0.2].map((delay, index) => (
                              <div 
                                key={index} 
                                className={`w-0.5 rounded-full transition-all duration-300 ${isListening ? (index === 3 ? 'bg-[#4ADE80]' : 'bg-red-500') : 'bg-muted-foreground/30'}`}
                                style={{
                                  height: index % 2 === 0 ? '12px' : '18px',
                                  animation: isListening ? `bounce 0.5s infinite alternate` : undefined,
                                  animationDelay: isListening ? `${delay}s` : undefined
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Transcript Preview */}
                        <div className="bg-[#1C0F12]/40 rounded-xl px-3 py-2.5 border border-red-500/5 min-h-[44px] flex flex-col justify-center">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground/50 tracking-wider">Sound Input Live Transcript:</span>
                          <span className="text-[12.5px] font-medium text-foreground tracking-wide mt-0.5 font-sans italic">
                            "{interimText || (isListening ? 'Speak now... (e.g. "Open Job Card dl6cr1517")' : 'Voice capture inactive. Press microphone button above to start, or simulate below.')}"
                          </span>
                        </div>

                        {/* Fallback & Helper HUD options */}
                        <div className="flex flex-col gap-2 mt-1 border-t border-red-500/5 pt-3">
                          <div className="flex items-center gap-1.5 justify-between">
                            <span className="text-[10px] text-red-400 font-['Rajdhani'] font-bold uppercase tracking-wider flex items-center gap-1">
                              ℹ️ Voice HUD Control Center
                            </span>
                            <button 
                              onClick={() => {
                                setIsListening(false);
                                setIsVoiceHUDOpen(false);
                                setInterimText("");
                              }}
                              className="text-[9.5px] text-muted-foreground hover:text-white underline cursor-pointer"
                            >
                              Dismiss HUD
                            </button>
                          </div>
                          
                          {speechError && (
                            <p className="text-[11px] text-amber-400 font-semibold bg-[#2A180E] px-2.5 py-1.5 rounded-lg border border-amber-500/20 leading-relaxed font-sans">
                              🛡️ {speechError}
                            </p>
                          )}

                          <p className="text-[9.5px] text-muted-foreground uppercase font-bold font-['Rajdhani'] tracking-widest mt-1">
                            Click to simulate vocal command instantly (Hands-Free Demonstration):
                          </p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              { label: "🎙️ Open Job Card for DL6CR1517", val: "Open Job Card for DL6CR1517" },
                              { label: "🔬 Check vehicle history for HR26DS6144", val: "Check vehicle history for HR26DS6144" },
                              { label: "📅 Show today's scheduled appointments", val: "Show today's scheduled appointments" },
                              { label: "✅ Review pending tasks", val: "Review pending tasks" }
                            ].map((cmd, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setInput(cmd.val);
                                  handleSendVoice(cmd.val);
                                  setIsListening(false);
                                  setIsVoiceHUDOpen(false);
                                  setInterimText("");
                                }}
                                className="px-3 py-2 bg-[#1A0E11] border border-red-500/10 text-left text-[11.5px] rounded-lg text-red-300 hover:border-red-500/40 hover:text-white hover:bg-red-500/5 transition-all text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer flex items-center gap-2 font-semibold"
                              >
                                {cmd.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {attachedFile && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl mb-3 inline-flex max-w-[280px]">
                      <span className="text-[11px] font-bold text-primary font-['Rajdhani'] uppercase shrink-0">{attachedFile.type}:</span>
                      <span className="text-[11.5px] text-foreground truncate font-sans">{attachedFile.name}</span>
                      <button onClick={() => setAttachedFile(null)} className="text-muted-foreground hover:text-white p-0.5 rounded cursor-pointer shrink-0"><X size={12} /></button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-[#0E1626] rounded-2xl border border-[rgba(61,142,240,0.18)] focus-within:border-primary/35 transition-all px-4 py-3 shadow-lg shadow-black/20">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSend()}
                      placeholder="Ask or speak to open a job card, fetch vehicle history, check appointments..."
                      className="flex-1 bg-transparent outline-none text-foreground text-[13px] placeholder:text-muted-foreground font-sans"
                    />
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={toggleListening}
                        className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                          isListening 
                            ? "text-red-400 bg-red-500/10 animate-pulse border border-red-500/20" 
                            : isVoiceHUDOpen 
                            ? "text-amber-400 bg-amber-500/10 border border-amber-500/20" 
                            : "text-muted-foreground hover:text-primary hover:bg-[#1C2A3E]"
                        }`}
                        title={isListening ? "Listening... click to stop" : isVoiceHUDOpen ? "Voice Hub Active (Simulation mode)" : "Speak to Voice Assistant"}
                      >
                        <Mic size={14} className={isListening ? "scale-110 text-red-400" : ""} />
                      </button>
                      <button 
                        onClick={() => setIsScanningInChat(!isScanningInChat)}
                        className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${isScanningInChat ? "text-primary bg-primary/10 animate-pulse border border-primary/20" : "text-muted-foreground hover:text-primary hover:bg-[#1C2A3E]"}`}
                        title="Scan license plate using camera / OCR"
                      >
                        <Camera size={14} className={isScanningInChat ? "text-primary scale-110" : "text-muted-foreground"} />
                      </button>
                      <button onClick={handleSend} disabled={!input.trim() && !attachedFile}
                        className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-25 disabled:cursor-not-allowed shadow-md shadow-primary/20 cursor-pointer">
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 px-1">
                    <div className="flex gap-4">
                      <button onClick={() => {
                        const promptOptions = [
                          "Open Job Card for DL6CR1517",
                          "Check vehicle history for HR26DS6144",
                          "Show today's scheduled appointments",
                          "Review pending tasks"
                        ];
                        const randomPrompt = promptOptions[Math.floor(Math.random() * promptOptions.length)];
                        setInput(randomPrompt);
                      }}
                        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-['Rajdhani'] font-semibold cursor-pointer">
                        <Zap size={11} className="text-primary" /> Saved prompts
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-['Rajdhani'] font-semibold cursor-pointer font-medium">
                        <Download size={11} /> Attach file
                      </button>
                      <button 
                        onClick={() => {
                          const nextVal = !speakResponses;
                          setSpeakResponses(nextVal);
                          if (!nextVal && window.speechSynthesis) {
                            window.speechSynthesis.cancel();
                          }
                        }} 
                        className={`flex items-center gap-1.5 text-[11px] select-none cursor-pointer font-['Rajdhani'] font-semibold transition-colors ${speakResponses ? "text-[#4ADE80]" : "text-muted-foreground hover:text-foreground"}`}
                        title="Toggles reading out loud NEXA response bubbles"
                      >
                        {speakResponses ? <Volume2 size={11} className="text-[#4ADE80]" /> : <VolumeX size={11} />}
                        {speakResponses ? "Voice Out: ON" : "Voice Out: OFF"}
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const name = file.name
                            const type = file.type.includes("pdf") ? "pdf" : file.type.includes("image") ? "image" : "other"
                            setAttachedFile({ name, type })
                          }
                          e.target.value = ""
                        }} 
                        style={{ display: "none" }} 
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground/35 font-['JetBrains_Mono']">NEXA Voice Assistant · Offline Link Active</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

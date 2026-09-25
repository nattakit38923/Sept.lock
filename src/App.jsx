import { useState, useEffect, useMemo, useRef } from "react";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwocfUyVBXLLSVtGCme-9kNm3pAMQvt-p0oVoCjFgzRS_lYSB2G9EHiAdTj_zPkR7Cw/exec";

const INK = "#3E2A1E";      // น้ำตาลกาแฟเข้ม
const PAPER = "#F1EEE6"; // ขาวอมเทาอ่อน ใกล้สีตู้เก็บกุญแจ
const WHITE = "#FFFFFF";
const GREEN = "#6B8E4E"; // เขียวมอส เข้ากับโทนน้ำตาล-ครีมมากกว่าเขียวสดเดิม
const RED = "#B5533F";
const ALERT = "#C7893A";    // ส้มอมน้ำตาล
const MUTE = "#8A7A6B";     // น้ำตาลอ่อนสำหรับตัวหนังสือรอง
const LINE = "#E8DFD3";     // เส้นขอบน้ำตาลอ่อนมาก

const RATE_INFO = [
  { key: "r1", th: "1 ชม.", en: "1 hr", price: 20 },
  { key: "r3", th: "3 ชม.", en: "3 hrs", price: 40 },
  { key: "r5", th: "5 ชม.+/วัน", en: "5 hrs+/day", price: 70 },
];
const FREE_TEMP_OPENS = 2;
const POLL_MS = 8000;
const PIN_LENGTH = 6;
const LINE_QR_SRC = "/line-admin-qr.jpg";
const PROMPTPAY_QR_SRC = "/promptpay-qr.jpg";
const LINE_OA_URL = "https://lin.ee/yNXtldL"; // ลิงก์เพิ่มเพื่อน LINE OA — เช็คว่าเปิดถูกบัญชี


const TR = {
  th: {
    appTitle: "Sept.Lock",
    appSubtitle: (n) => `${n} ช่อง · เชื่อมต่อระบบแล้ว`,
    currentTime: (t) => `เวลาปัจจุบัน ${t}`,
    alertBanner: (ids) => `ตรวจพบการเปิดตู้ผิดปกติที่ช่อง ${ids} — แตะที่ช่องเพื่อดูรายละเอียด`,
    available: "ว่าง",
    occupied: "ไม่ว่าง",
    ready: "พร้อมใช้งาน",
    connecting: "กำลังเชื่อมต่อระบบ...",
    connectFail: "เชื่อมต่อ backend ไม่สำเร็จ ลองใหม่อีกครั้ง",
    tempOpenSuffix: (n, max) => `เปิดชั่วคราว ${n}/${max}`,
    rateTitle: "อัตราค่าบริการ",
    lockerLabel: (id) => `ช่อง ${id}`,
    securityOkMsg: "สถานะความปลอดภัย ปกติ",
    securityAlertMsg: "ตรวจพบการเปิดตู้ผิดปกติ — ตรวจสอบก่อนใช้งาน",
    acknowledge: "รับทราบแจ้งเตือน",
    setPinPrompt: "— ตั้งรหัส 6 หลักไว้เพื่อดูสถานะและใช้เช็คเอาท์ —",
    verifyPrompt: (elapsed) => `ใช้งานมาแล้ว ${elapsed} — กรอกรหัส 6 หลักที่ตั้งไว้ตอนเช็คอิน`,
    lockedMsg: (sec) => `⚠ กรอกรหัสผิดครบ 3 ครั้ง กรุณารออีก ${sec} วินาที`,
    pinError: (n) => `รหัสไม่ถูกต้อง (${n}/3)`,
    forgotPin: "ลืมรหัส?",
    menuPrompt: "ยืนยันตัวตนสำเร็จ — เลือกดำเนินการ",
    tempOpenBtn: "เปิดตู้กุญแจชั่วคราว",
    quotaSuffix: " · ครบโควตาแล้ว",
    finishBtn: "จบการทำงาน — ไปหน้าชำระเงิน",
    quotaNote: (max) => `เปิดชั่วคราวครบ ${max} ครั้งแล้ว`,
    close: "ปิด",
    checkoutTitle: (id) => `ช่อง ${id} · เช็คเอาท์`,
    elapsedTier: (elapsed, tier) => `ใช้เวลา ${elapsed} · คิดเป็น ${tier}`,
    payQr: "จ่ายด้วย QR PromptPay",
    payCash: "จ่ายเงินสด",
    cancel: "ยกเลิก",
    scanQr: "สแกนจ่าย PromptPay",
    confirmPaid: "ยืนยันการชำระเงิน - ปลดล็อก",
    cashInstruction: (amt) => `กรุณาหยอดเงิน ฿${amt} ลงในกล่องรับเงินสดข้างตู้`,
    cashConfirm: "ยืนยันการชำระเงิน — ปลดล็อก",
    toastCheckin: (id) => `เช็คอินช่อง ${id} แล้ว`,
    toastTempOpen: (id) => `เปิดตู้ชั่วคราว ช่อง ${id} — เวลายังนับต่อ`,
    toastForgot: "ส่งคำขอรีเซ็ตรหัสไปยังแอดมินแล้ว รอการติดต่อกลับ",
    toastAck: (id) => `รับทราบแจ้งเตือนช่อง ${id} แล้ว`,
    toastDone: (amt, id) => `ทำรายการสำเร็จ ฿${amt} ช่อง ${id} ว่างแล้ว`,
    working: "กำลังดำเนินการ...",
    closeDoorTitle: "หยิบของเรียบร้อยแล้ว",
    closeDoorBody: "กรุณาปิดประตูตู้ให้สนิท ระบบจะล็อกอัตโนมัติ",
    closeDoorAck: "ปิดตู้เรียบร้อย",
    setPhonePrompt: "กรอกเบอร์โทรศัพท์ 10 หลัก สำหรับยืนยันตัวตน",
    setPinPrompt2: "— ตั้งรหัส 6 หลักไว้เพื่อดูสถานะและใช้เช็คเอาท์ —",
    confirmPinPrompt: "กรอกรหัสเดิมอีกครั้งเพื่อยืนยัน",
    pinMismatch: "รหัสไม่ตรงกัน กรุณาตั้งรหัสใหม่อีกครั้ง",
    forgotPhonePrompt: "กรอกเบอร์โทรศัพท์ที่ใช้ตอนเช็คอิน",
    phoneNotMatch: "เบอร์โทรไม่ตรงกับที่ลงทะเบียนไว้",
    contactAdminLine: "กรุณาติดต่อแอดมินผ่าน LINE OA @sept.lock เพื่อขอความช่วยเหลือ",
		gotCodeBtn: "ได้รับรหัสจากแอดมินแล้ว",
		enterCodePrompt: "กรอกรหัส 6 หลักที่ได้รับจากแอดมิน",
		codeWrong: "รหัสไม่ถูกต้อง",
		codeExpired: "รหัสหมดอายุแล้ว กรุณาติดต่อแอดมิน",
		codeMissing: "ยังไม่มีรหัสสำหรับช่องนี้ กรุณาติดต่อแอดมิน",
    resetPinPrompt: "ตั้งรหัสใหม่ 6 หลัก",
    confirmResetPinPrompt: "กรอกรหัสใหม่อีกครั้งเพื่อยืนยัน",
    resetPinSuccess: "ตั้งรหัสใหม่สำเร็จแล้ว",
    takeKeyTitle: "หยิบกุญแจแล้วปิดตู้ให้เรียบร้อย",
		takeKeyBody: (id) => `หยิบกุญแจหมายเลข ${id} แล้วปิดตู้เก็บกุญแจให้สนิท`,
		returnKeyTitle: "ชำระเงินเรียบร้อยแล้ว",
		returnKeyBody: (id) => `แขวนกุญแจคืนที่ช่อง ${id} แล้วปิดตู้เก็บกุญแจให้สนิท`,
    scanLineQr: "สแกน QR เพื่อติดต่อแอดมิน",
    phoneRetry: (n) => `เบอร์โทรไม่ตรงกับที่ลงทะเบียนไว้ ลองใหม่ได้อีก ${n} ครั้ง`,
    contactAdminLink:"ลืมเบอร์ที่ลงทะเบียนไว้?",
    openLineBtn: "เปิด LINE เพื่อติดต่อแอดมิน",
    saveQrBtn: "บันทึกรูป QR code",
    saveQrHint: "หรือกดค้างที่รูป QR แล้วเลือกบันทึกรูปภาพ",
    overridePendingNote: "ช่องนี้รอรหัสยืนยันจากแอดมิน กรอกรหัส 6 หลักที่ได้รับทาง LINE",
    noCodeYet: "ยังไม่ได้รับรหัส? ติดต่อแอดมิน",
    resetExpired: "หมดเวลาตั้งรหัสใหม่ กรุณายืนยันตัวตนอีกครั้ง",
    checkinOccupied: "ช่องนี้มีคนใช้งานแล้ว กรุณาเลือกช่องอื่น",
    genericError: "ทำรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
  },
  en: {
    appTitle: "Sept.Lock",
    appSubtitle: (n) => `${n} bays · Connected to live system`,
    currentTime: (t) => `Now ${t}`,
    alertBanner: (ids) => `Unusual opening detected at bay ${ids} — tap the bay for details`,
    available: "Available",
    occupied: "Occupied",
    ready: "Ready to use",
    connecting: "Connecting...",
    connectFail: "Could not reach backend. Please retry.",
    tempOpenSuffix: (n, max) => `Temp open ${n}/${max}`,
    rateTitle: "Rates",
    lockerLabel: (id) => `Bay ${id}`,
    securityOkMsg: "Security status normal",
    securityAlertMsg: "Unusual opening detected — please check before use",
    acknowledge: "Acknowledge alert",
    setPinPrompt: "— Set a 6-digit PIN to check status and check out later —",
    verifyPrompt: (elapsed) => `In use for ${elapsed} — enter the 6-digit PIN`,
    lockedMsg: (sec) => `⚠ Wrong PIN 3 times. Please wait ${sec}s`,
    pinError: (n) => `Incorrect PIN (${n}/3)`,
    forgotPin: "Forgot PIN?",
    menuPrompt: "Verified — choose an action",
    tempOpenBtn: "Temporary open key box",
    quotaSuffix: " · Quota reached",
    finishBtn: "Finish — go to payment",
    quotaNote: (max) => `Free temporary opens (${max}) used up.`,
    close: "Close",
    checkoutTitle: (id) => `Bay ${id} · Check-out`,
    elapsedTier: (elapsed, tier) => `Duration ${elapsed} · Tier ${tier}`,
    payQr: "Pay with PromptPay QR",
    payCash: "Pay cash",
    cancel: "Cancel",
    scanQr: "Scan to pay via PromptPay",
    confirmPaid: "Confirm paid — unlock",
    cashInstruction: (amt) => `Please drop ฿${amt} into the cash box beside the locker`,
    cashConfirm: "Cash dropped — unlock",
    toastCheckin: (id) => `Checked in bay ${id}.`,
    toastTempOpen: (id) => `Bay ${id} opened temporarily — timer still running`,
    toastForgot: "Reset request sent to admin. Please wait to be contacted.",
    toastAck: (id) => `Alert acknowledged for bay ${id}`,
    toastDone: (amt, id) => `Done. Paid ฿${amt}. Bay ${id} is now available.`,
    working: "Working...",
    closeDoorTitle: "Items retrieved",
    closeDoorBody: "Please close the locker door firmly. It will lock automatically.",
    closeDoorAck: "Got it.",
    setPhonePrompt: "Enter your 10-digit phone number for identity verification.",
    setPinPrompt2: "— Set a 6-digit PIN to check status and check out later —",
    confirmPinPrompt: "Re-enter the same PIN to confirm",
    pinMismatch: "PINs don't match. Please set your PIN again.",
    forgotPhonePrompt: "Enter the phone number you used at check-in",
    phoneNotMatch: "Phone number doesn't match our records",
    contactAdminLine: "Please contact admin via LINE OA @sept.lock for help",
		gotCodeBtn: "I received a code from admin",
		enterCodePrompt: "Enter the 6-digit code from admin",
		codeWrong: "Incorrect code",
		codeExpired: "Code has expired. Please contact admin for a new one.",
		codeMissing: "No code has been issued for this bay. Please contact admin.",
    resetPinPrompt: "Set a new 6-digit PIN",
    confirmResetPinPrompt: "Re-enter the new PIN to confirm",
    resetPinSuccess: "PIN reset successful",
    takeKeyTitle: "Take your key and close the box",
		takeKeyBody: (id) => `Take the key number ${id},then close the key box firmly.`,
		returnKeyTitle: "Payment complete",
		returnKeyBody: (id) => `Hang the key back at bay ${id} and close the key box firmly.`,
		scanLineQr: "Scan the QR code to contact admin",
    phoneRetry: (n) => `Phone number doesn't match. ${n} attempt(s) left.`,
    contactAdminLink: "Not sure which number? Contact admin",
    openLineBtn: "Open LINE to chat with admin",
    saveQrBtn: "Save QR image",
    saveQrHint: "Or long-press the QR image and choose Save Image",
    overridePendingNote: "This bay is waiting for an admin code. Enter the 6-digit code you received on LINE.",
    noCodeYet: "No code yet?",
    resetExpired: "Time to set a new PIN has expired. Please verify again.",
    checkinOccupied: "This bay is already in use. Please pick another one.",
    genericError: "Something went wrong. Please try again.",

  },
};

function computeBill(ms, lang) {
  const hoursExact = ms / 3600000;
  const roundedHours = Math.max(1, Math.ceil(hoursExact - 1e-9)); // ปัดขึ้นเป็นชั่วโมง ขั้นต่ำ 1 ชม.

  // 5 ชม. ขึ้นไป (จนถึง 24 ชม.) คิดเหมาวันละ 70 บาท
  if (roundedHours >= 5 && roundedHours <= 24) {
    return { price: 70, tier: lang === "th" ? "5 ชม.+ (เหมาวัน)" : "5 hrs+ (day rate)" };
  }
  // เกิน 24 ชม. คิดเพิ่มวันละ 70 บาทต่อวัน
  if (roundedHours > 24) {
    const extraDays = Math.ceil((roundedHours - 24) / 24);
    const label = lang === "th" ? `1 วัน + ${extraDays} วันเพิ่ม` : `1 day + ${extraDays} extra day(s)`;
    return { price: 70 + extraDays * 70, tier: label };
  }

  // 1-4 ชม.: แตกเป็นบล็อก 3 ชม. (40 บาท) + เศษชั่วโมงละ 20 บาท
  // เช่น 1:30 -> ปัดเป็น 2 ชม. -> 1+1 ชม. = 40 บาท
  // เช่น 4 ชม. -> 3+1 ชม. = 40+20 = 60 บาท
  const threeHourBlocks = Math.floor(roundedHours / 3);
  const remainderHours = roundedHours % 3;
  const price = threeHourBlocks * 40 + remainderHours * 20;

  const parts = [];
  if (threeHourBlocks > 0) parts.push(lang === "th" ? `${threeHourBlocks * 3} ชม.` : `${threeHourBlocks * 3}h`);
  if (remainderHours > 0) parts.push(lang === "th" ? `${remainderHours} ชม.` : `${remainderHours}h`);
  const tier = parts.join(" + ");

  return { price, tier };
}
function fmtElapsed(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}
function fmtClock(date, lang) {
  return date.toLocaleTimeString(lang === "th" ? "th-TH" : "en-US", { hour: "2-digit", minute: "2-digit" });
}

// ---------- ตัวช่วยเรียก backend ----------
async function callApi(action, params = {}) {
  const qs = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${SCRIPT_URL}?${qs}`);
  const text = await res.text();
  return text;
}
async function fetchStatus() {
  const res = await fetch(`${SCRIPT_URL}?action=getStatus`);
  return res.json();
}
function mapRow(row) {
  return {
    id: row.bay,
    status: row.occupied ? "occupied" : "available",
    security: row.security || "ok",
    checkinAt: row.checkin_at ? new Date(row.checkin_at).getTime() : null,
    tempOpens: Number(row.temp_opens) || 0,
    lockUntil: row.lock_until ? new Date(row.lock_until).getTime() : null,
    overrideRequested: row.override_requested === true, // รอรหัสจากแอดมินอยู่ (เก็บใน Sheet ปิดหน้าแล้วก็ยังค้าง)
  };
}

function TimerDial({ progressMs, totalMs, active }) {
  const size = 46, r = 18, cx = size / 2, cy = size / 2;
  const angle = totalMs > 0 ? Math.min(progressMs / totalMs, 1) * 360 : 0;
  const rad = ((angle - 90) * Math.PI) / 180;
  const hx = cx + r * Math.cos(rad), hy = cy + r * Math.sin(rad);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill={active ? INK : PAPER} stroke={active ? INK : LINE} strokeWidth="1.5" />
      {active && <line x1={cx} y1={cy} x2={hx} y2={hy} stroke={WHITE} strokeWidth="2" strokeLinecap="round" />}
      <circle cx={cx} cy={cy} r={1.6} fill={active ? WHITE : MUTE} />
    </svg>
  );
}
function PinPad({ length = 4, onComplete, resetKey, disabled, masked = true }) {
  const [digits, setDigits] = useState([]);
  useEffect(() => setDigits([]), [resetKey]);
  const press = (d) => {
    if (disabled || digits.length >= length) return;
    const next = [...digits, d];
    setDigits(next);
    if (next.length === length) setTimeout(() => onComplete(next.join("")), 120);
  };
  const backspace = () => setDigits((d) => d.slice(0, -1));
  return (
    <div>
      {masked ? (
        <div style={{ display: "flex", justifyContent: "center", gap: 12, margin: "14px 0 18px", flexWrap: "wrap" }}>
          {Array.from({ length }).map((_, i) => (
            <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", border: `1.5px solid ${INK}`, background: i < digits.length ? INK : "transparent" }} />
          ))}
        </div>
      ) : (
        <div
          style={{
            margin: "14px 0 18px",
            padding: "12px 16px",
            border: `1.5px solid ${LINE}`,
            borderRadius: 8,
            textAlign: "center",
            fontFamily: "'Nunito', sans-serif",
            fontSize: 24,
            letterSpacing: 3,
            color: digits.length > 0 ? INK : MUTE,
            minHeight: 52,
          }}
        >
          {digits.length > 0 ? digits.join("") : "—".repeat(length)}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, maxWidth: 240, margin: "0 auto", opacity: disabled ? 0.4 : 1 }}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} disabled={disabled} onClick={() => press(d)} style={{ padding: "14px 0", fontSize: 18, fontFamily: "'Nunito', sans-serif", background: WHITE, border: `1px solid ${LINE}`, borderRadius: 8, color: INK }}>
            {d}
          </button>
        ))}
        <div />
        <button disabled={disabled} onClick={() => press("0")} style={{ padding: "14px 0", fontSize: 18, fontFamily: "'Nunito', sans-serif", background: WHITE, border: `1px solid ${LINE}`, borderRadius: 8, color: INK }}>0</button>
        <button disabled={disabled} onClick={backspace} style={{ padding: "14px 0", fontSize: 14, background: WHITE, border: `1px solid ${LINE}`, borderRadius: 8, color: MUTE }}>⌫</button>
      </div>
    </div>
  );
}

export default function TrailLockerApp() {
  const [lang, setLang] = useState("th");
  const t = (key, ...args) => {
    const v = TR[lang][key];
    return typeof v === "function" ? v(...args) : v;
  };

  const [now, setNow] = useState(Date.now());
  const [lockers, setLockers] = useState([]);
  const [connState, setConnState] = useState("connecting"); // connecting | ok | error
  const [selected, setSelected] = useState(null);
  const [stage, setStage] = useState(null);
  const [pinError, setPinError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checkoutFlow, setCheckoutFlow] = useState(null);
  const [closeDoorReminder, setCloseDoorReminder] = useState(null); // { bay }
  const [pendingPhone, setPendingPhone] = useState("");
  const [pendingPin, setPendingPin] = useState("");
  const [flowError, setFlowError] = useState(null);
  const [verifiedPin, setVerifiedPin] = useState("");
  const [toast, setToast] = useState(null);
  const [resetToken, setResetToken] = useState("");   // ได้จาก backend หลังยืนยันเบอร์/รหัสแอดมินสำเร็จ
  const [resetSource, setResetSource] = useState(null); // "phone" | "admin"
  const [phoneFailed, setPhoneFailed] = useState(false);  // มาหน้าติดต่อแอดมินเพราะกรอกเบอร์ผิดครบหรือไม่
  const pinResetKey = useRef(0);
  const imgCache = useRef({});

  const markOverrideRequested = (bay) =>
    setLockers((prev) => prev.map((l) => (l.id === bay ? { ...l, overrideRequested: true } : l)));

  useEffect(() => {
    const tm = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tm);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchStatus();
        if (cancelled) return;
        setLockers(data.map(mapRow));
        setConnState("ok");
      } catch (err) {
        if (!cancelled) setConnState("error");
      }
    };
    load();
    const poll = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const tm = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(tm);
  }, [toast]);

  const refreshOne = async () => {
    try {
      const data = await fetchStatus();
      setLockers(data.map(mapRow));
    } catch (e) {}
  };

  const openLocker = (locker) => {
   setSelected(locker.id);
   setPinError(null);
   setFlowError(null);
   setPendingPhone("");
   setPendingPin("");
   setResetToken("");
   setResetSource(null);
   setPhoneFailed(false);
   pinResetKey.current += 1;
   if (locker.status === "available") setStage("setphone");
   else if (locker.overrideRequested) setStage("entercode"); // ค้างหน้าใส่รหัสแอดมินไว้ แม้ปิดหน้าไปแล้ว
   else setStage("verify");
   setCheckoutFlow(null);
  };

  const handleSetPhone = (phone) => {
   setPendingPhone(phone);
   setFlowError(null);
   setStage("setpin");
  pinResetKey.current += 1;
  };

  const handleFirstPin = (pin) => {
   setPendingPin(pin);
   setStage("confirmpin");
  pinResetKey.current += 1;
  };

  const handleConfirmPin = async (pin) => {
     if (pin !== pendingPin) {
    setFlowError(t("pinMismatch"));
    setStage("setpin");
    pinResetKey.current += 1;
    return;
   }
    setBusy(true);
    const result = await callApi("setPin", { bay: selected, pin, phone: pendingPhone });
    setBusy(false);
    if (result !== "ok") {
      setToast(result === "occupied" ? t("checkinOccupied") : t("genericError"));
      setStage(null);
      setSelected(null);
      refreshOne();
      return;
    }
    setToast(t("toastCheckin", selected));
    setStage(null);
    setCloseDoorReminder({ bay: selected, phase: "pickup" }); // ★ เพิ่ม
    setSelected(null);
    setPendingPhone("");
    setPendingPin("");
    setFlowError(null);
    refreshOne();
  };

 const handleVerifyPin = async (locker, pin) => {
    setBusy(true);
    const result = await callApi("verifyPin", { bay: locker.id, pin });
    setBusy(false);
    pinResetKey.current += 1;

    if (result === "ok") {
      setPinError(null);
      setVerifiedPin(pin);   // ★ เพิ่ม
      setStage("menu");
    } else if (result.startsWith("locked:")) {
      const sec = Number(result.split(":")[1]);
      setLockers((prev) => prev.map((l) => (l.id === locker.id ? { ...l, lockUntil: Date.now() + sec * 1000 } : l)));
      setPinError("locked");
    } else if (result.startsWith("wrong:")) {
      const n = Number(result.split(":")[1]);
      setPinError(t("pinError", n));
    }
  };

 const handleTempOpen = async (locker) => {
      setBusy(true);
      const result = await callApi("tempOpen", { bay: locker.id });
      setBusy(false);
      if (result === "ok") {
      setToast(t("toastTempOpen", locker.id));
      setStage(null);
      setSelected(null);
      refreshOne();
    }
  };

 const handleForgotPin = () => {
      setFlowError(null);
      pinResetKey.current += 1;
      setStage(selectedLocker?.overrideRequested ? "entercode" : "forgotphone");
  };

 const handleContactAdmin = async () => {
      setBusy(true);
      await callApi("requestOverride", { bay: selected });
      setBusy(false);
      markOverrideRequested(selected);
      setPhoneFailed(false);
      setFlowError(null);
      setStage("phonefail");
  };

 const handleCheckPhoneSubmit = async (phone) => {
      setBusy(true);
      const result = await callApi("checkPhone", { bay: selected, phone });
      setBusy(false);
      pinResetKey.current += 1;
      if (result.startsWith("match:")) {
        setResetToken(result.slice(6));
        setResetSource("phone");
        setFlowError(null);
        setStage("resetpin");
      } else if (result.startsWith("no_match:")) {
        // กรอกผิดรอบแรก ให้ลองใหม่ได้อีกครั้ง
        setFlowError(t("phoneRetry", Number(result.split(":")[1]) || 1));
      } else if (result === "need_admin") {
        setPhoneFailed(true);
        markOverrideRequested(selected);
        setFlowError(null);
        setStage("phonefail");
      } else {
        setFlowError(t("genericError"));
      }
    };

  const handleVerifyOverrideCode = async (code) => {
  		setBusy(true);
  		const result = await callApi("verifyOverrideCode", { bay: selected, code });
  		setBusy(false);
  		pinResetKey.current += 1;
  		if (result.startsWith("ok:")) {
    		setResetToken(result.slice(3));
    		setResetSource("admin");
    		setFlowError(null);
    		setStage("resetpin");
  		} else if (result === "wrong") {
    		setFlowError(t("codeWrong"));
  		} else if (result === "expired") {
    		setFlowError(t("codeExpired"));
  		} else {
    		setFlowError(t("codeMissing"));
  		}
		};

   const handleNewPinFirst = (pin) => {
      setPendingPin(pin);
      setStage("confirmresetpin");
      pinResetKey.current += 1;
    };

   const handleNewPinConfirm = async (pin) => {
      if (pin !== pendingPin) {
       setFlowError(t("pinMismatch"));
       setStage("resetpin");
       pinResetKey.current += 1;
      return;
    }
      setBusy(true);
      const result = await callApi("resetPin", { bay: selected, newPin: pin, token: resetToken });
      setBusy(false);
      pinResetKey.current += 1;
      setPendingPin("");
      if (result !== "ok") {
        // token หมดอายุ/ไม่ถูกต้อง ให้ยืนยันตัวตนใหม่ (รหัสแอดมินเดิมยังใช้ได้จนหมดอายุ)
        setResetToken("");
        setFlowError(result === "token_expired" || result === "invalid_token" ? t("resetExpired") : t("genericError"));
        setStage(resetSource === "admin" ? "entercode" : "forgotphone");
        return;
      }
      setResetToken("");
      setVerifiedPin(pin); // ใช้ PIN ใหม่ตอนเช็คเอาท์ (เดิมยังส่ง PIN เก่าไป ทำให้เช็คเอาท์ไม่ผ่าน)
      setLockers((prev) => prev.map((l) => (l.id === selected ? { ...l, overrideRequested: false } : l)));
      setToast(t("resetPinSuccess"));
      setFlowError(null);
      setStage("menu");
      refreshOne();
   };

  const acknowledgeAlert = async (locker) => {
    setBusy(true);
    await callApi("acknowledgeAlert", { bay: locker.id });
    setBusy(false);
    setToast(t("toastAck", locker.id));
    refreshOne();
  };

  const beginCheckout = (locker) => {
    const elapsed = now - locker.checkinAt;
    const bill = computeBill(elapsed, lang);
    setCheckoutFlow({ locker, bill, payMethod: null, elapsed ,pin: verifiedPin});
    setStage(null);
    setSelected(null);
  };
  const confirmPayment = (method) => setCheckoutFlow((cf) => ({ ...cf, payMethod: method }));

  const finishCheckout = async () => {
     if (!checkoutFlow) return;
     const { locker, bill, payMethod ,pin } = checkoutFlow;
     setBusy(true);
     const result = await callApi("finishCheckout", { bay: locker.id, amount: bill.price, method: payMethod ,pin });
     setBusy(false);
     if (result !== "ok") {
       setToast(t("genericError"));
       setCheckoutFlow(null);
       refreshOne();
       return;
     }
     setToast(t("toastDone", bill.price, locker.id));
     setCheckoutFlow(null);
     setCloseDoorReminder({ bay: locker.id, phase: "return" }); // ★ เพิ่ม phase
     refreshOne();
   };
  const acknowledgeCloseDoor = () => setCloseDoorReminder(null);
  const cancelCheckout = () => setCheckoutFlow(null);

  const closeSheet = () => {
    setSelected(null);
    setStage(null);
    setPinError(null);
    setFlowError(null);
    setResetToken("");
  };

  // โหลดรูป QR ไว้ล่วงหน้าตอนถึงหน้าติดต่อแอดมิน เพื่อให้กดแชร์/บันทึกได้ทันที (iOS ต้องเรียก share ในจังหวะที่กดปุ่ม)
    const preloadImage = (src, filename) => {
    if (imgCache.current[src]) return;
    fetch(src)
      .then((r) => r.blob())
      .then((blob) => {
        imgCache.current[src] = new File([blob], filename, { type: blob.type || "image/jpeg" });
      })
      .catch(() => {});
  };
  useEffect(() => {
    if (stage === "phonefail") preloadImage(LINE_QR_SRC, "sept-lock-line-qr.jpg");
  }, [stage]);
  useEffect(() => {
    if (checkoutFlow?.payMethod === "qr") preloadImage(PROMPTPAY_QR_SRC, "sept-lock-promptpay-qr.jpg");
  }, [checkoutFlow?.payMethod]);

  const saveImage = async (src, filename) => {
    const file = imgCache.current[src];
    try {
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
      const url = file ? URL.createObjectURL(file) : src;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (file) setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      if (err && err.name === "AbortError") return;
      window.open(src, "_blank");
    }
  };
  const saveLineQr = () => saveImage(LINE_QR_SRC, "sept-lock-line-qr.jpg");
  const savePayQr = () => saveImage(PROMPTPAY_QR_SRC, "sept-lock-promptpay-qr.jpg");
  };
  const selectedLocker = lockers.find((l) => l.id === selected);
  const lockedNow = selectedLocker?.lockUntil && now < selectedLocker.lockUntil;
  const lockRemainSec = lockedNow ? Math.ceil((selectedLocker.lockUntil - now) / 1000) : 0;

  return (
    <div style={{ minHeight: "100vh", background: PAPER, fontFamily: "'Inter', system-ui, sans-serif", color: INK, padding: "0 0 40px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,600&family=Edu+VIC+WA+NT+Hand:wght@400..700&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
        button:disabled { opacity: 0.4; cursor: not-allowed; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      `}</style>

      <div style={{ background: INK, padding: "22px 20px 18px", textAlign: "center", position: "relative"
 			}}>
        <div style={{ position: "absolute", top: 14, right: 16, display: "flex", background: "#2E2A24", borderRadius: 20, padding: 3, gap: 2 }}>
          {["th", "en"].map((code) => (
            <button key={code} onClick={() => setLang(code)} style={{ padding: "5px 12px", borderRadius: 16, border: "none", fontSize: 11, fontWeight: 600, background: lang === code ? WHITE : "transparent", color: lang === code ? INK : "#B9B4AC" }}>
              {code === "th" ? "ไทย" : "EN"}
            </button>
          ))}
        </div>
        <div style={{ fontFamily: "'Edu VIC WA NT Hand', cursive", fontSize: 27, fontWeight: 700, color: WHITE, letterSpacing: 0.5, marginTop: 6 }}>{t("appTitle")}</div>
        <div style={{ fontSize: 10.5, color: connState === "error" ? "#E0791F" : "#B9B4AC", letterSpacing: 1, marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
          {connState === "connecting" ? t("connecting") : connState === "error" ? t("connectFail") : t("appSubtitle", lockers.length)}
        </div>
      </div>

      <div style={{ maxWidth: 460, margin: "0 auto", padding: "22px 18px" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: MUTE }}>{t("currentTime", fmtClock(new Date(now), lang))}</span>
        </div>

        {lockers.some((l) => l.security === "alert") && (
          <div style={{ background: "#FBEAD9", border: `1.5px solid ${ALERT}`, borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: "#8A4A0F", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚠</span>
            <span>{t("alertBanner", lockers.filter((l) => l.security === "alert").map((l) => l.id).join(", "))}</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {lockers.map((locker) => {
            const isOccupied = locker.status === "occupied";
            const elapsed = isOccupied && locker.checkinAt ? now - locker.checkinAt : 0;
            const bill = isOccupied && locker.checkinAt ? computeBill(elapsed, lang) : null;
            const totalMs = 3600000; // วงแหวนเติมเต็มทุก 1 ชั่วโมง (ไม่ผูกกับแพ็กเกจคงที่แล้ว)
            const ringProgress = elapsed % 3600000;

            return (
              <button key={locker.id} onClick={() => openLocker(locker)} style={{ background: isOccupied ? INK : WHITE, border: `2px solid ${locker.security === "alert" ? ALERT : INK}`, borderRadius: 4, padding: "12px 10px", textAlign: "left", position: "relative", boxShadow: locker.security === "alert" ? `0 0 0 3px ${ALERT}33` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: isOccupied ? WHITE : INK }}>{locker.id}</span>
                </div>
                <div style={{ marginTop: 10, display: "inline-block", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, padding: "3px 8px", borderRadius: 20, background: isOccupied ? RED : GREEN, color: WHITE }}>
                  {isOccupied ? t("occupied") : t("available")}
                </div>
                {isOccupied && bill && (
                  <div style={{ marginTop: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                    <div style={{ fontSize: 15, color: WHITE, fontWeight: 600 }}>{fmtElapsed(elapsed)}</div>
                    <div style={{ fontSize: 10, color: "#B9B4AC", marginTop: 2 }}>
                      {bill.tier} ฿{bill.price}
                      {locker.tempOpens > 0 && ` · ${t("tempOpenSuffix", locker.tempOpens, FREE_TEMP_OPENS)}`}
                    </div>
                  </div>
                )}
                {!isOccupied && <div style={{ marginTop: 8, fontSize: 11, color: MUTE }}>{t("ready")}</div>}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 20, border: `1px solid ${LINE}`, borderRadius: 4, padding: "14px 16px", background: WHITE }}>
          <div style={{ fontSize: 11, letterSpacing: 1, color: MUTE, marginBottom: 8, fontWeight: 600 }}>{t("rateTitle")}</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {RATE_INFO.map((p) => (
              <div key={p.key} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 600 }}>฿{p.price}</div>
                <div style={{ fontSize: 11, color: MUTE }}>{p[lang]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected != null && selectedLocker && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(26,26,26,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 40 }} onClick={closeSheet}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: WHITE, width: "100%", maxWidth: 460, borderRadius: "12px 12px 0 0", padding: "22px 20px 30px", maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, background: LINE, borderRadius: 4, margin: "0 auto 18px" }} />
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, textAlign: "center" }}>{t("lockerLabel", selectedLocker.id)}</div>

            {selectedLocker.status === "occupied" && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, padding: "8px 10px", borderRadius: 6, background: selectedLocker.security === "alert" ? "#FBEAD9" : "#EAF5EC", color: selectedLocker.security === "alert" ? "#8A4A0F" : "#256B34" }}>
                <span>{selectedLocker.security === "alert" ? "⚠" : "🗝️"}</span>
                <span>{selectedLocker.security === "alert" ? t("securityAlertMsg") : t("securityOkMsg")}</span>
              </div>
            )}
            {selectedLocker.security === "alert" && (
              <button disabled={busy} onClick={() => acknowledgeAlert(selectedLocker)} style={{ marginTop: 10, width: "100%", background: ALERT, color: WHITE, border: "none", borderRadius: 6, padding: "10px 0", fontSize: 13, fontWeight: 600 }}>
                {t("acknowledge")}
              </button>
            )}

            {stage === "setphone" && (
  <>
    <p style={{ fontSize: 13, color: MUTE, marginTop: 14, lineHeight: 1.6, textAlign: "center" }}>{t("setPhonePrompt")}</p>
    <PinPad length={10} resetKey={pinResetKey.current} onComplete={handleSetPhone} disabled={busy} masked={false} />
  </>
)}

            {stage === "setpin" && (
             <>
              <p style={{ fontSize: 13, color: MUTE, marginTop: 14, lineHeight: 1.6, textAlign: "center" }}>{t("setPinPrompt2")}</p>
              {flowError && <div style={{ textAlign: "center", color: RED, fontSize: 12.5, marginBottom: 8 }}>{flowError}</div>}
              <PinPad length={PIN_LENGTH} resetKey={pinResetKey.current} onComplete={handleFirstPin} disabled={busy} />
              </>
           )}

            {stage === "confirmpin" && (
             <>
               <p style={{ fontSize: 13, color: MUTE, marginTop: 14, lineHeight: 1.6, textAlign: "center" }}>{t("confirmPinPrompt")}</p>
               <PinPad length={PIN_LENGTH} resetKey={pinResetKey.current} onComplete={handleConfirmPin} disabled={busy} />
             </>
           )}

            {stage === "forgotphone" && (
             <>
              <p style={{ fontSize: 13, color: MUTE, marginTop: 14, lineHeight: 1.6, textAlign: "center" }}>{t("forgotPhonePrompt")}</p>
              {flowError && <div style={{ textAlign: "center", color: RED, fontSize: 12.5, marginBottom: 8 }}>{flowError}</div>}
              <PinPad length={10} resetKey={pinResetKey.current} onComplete={handleCheckPhoneSubmit} disabled={busy} masked={false} />
              <button disabled={busy} onClick={handleContactAdmin} style={{ marginTop: 12, width: "100%", background: "transparent", border: "none", color: MUTE, fontSize: 12.5, textDecoration: "underline" }}>
                {t("contactAdminLink")}
              </button>
             </>
          )}

            {stage === "phonefail" && (
              <>
  						<div style={{ marginTop: 16, textAlign: "center", padding: "18px 12px", background: "#FBEAD9", borderRadius: 8 }}>
    					<div style={{ fontSize: 28, marginBottom: 8 }}>⚠</div>
    					<div style={{ fontSize: 13.5, color: "#8A4A0F", marginBottom: 6, fontWeight: 600 }}>{phoneFailed ? t("phoneNotMatch") : t("contactAdminLine")}</div>
    					{phoneFailed && <div style={{ fontSize: 12.5, color: "#8A4A0F", marginBottom: 14 }}>{t("contactAdminLine")}</div>}
    					<img
      				src={LINE_QR_SRC}
      				alt="LINE OA QR"
      				style={{ width: 160, height: 160, border: `1px solid ${LINE}`, padding: 8, background: WHITE, borderRadius: 6 }}
    				/>
    			<div style={{ fontSize: 11.5, color: "#8A4A0F", marginTop: 8 }}>{t("scanLineQr")}</div>
    			<button
    			  onClick={saveLineQr}
    			  style={{ marginTop: 12, width: "100%", background: WHITE, color: INK, border: `1.5px solid ${INK}`, borderRadius: 6, padding: "10px 0", fontSize: 13, fontWeight: 600 }}
    			>
    			  ⬇ {t("saveQrBtn")}
    			</button>
    			<div style={{ fontSize: 11, color: "#8A4A0F", marginTop: 6 }}>{t("saveQrHint")}</div>
  			</div>
            <a
              href={LINE_OA_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", marginTop: 12, width: "100%", background: "#06C755", color: WHITE, borderRadius: 6, padding: "11px 0", fontSize: 13, fontWeight: 600, textAlign: "center", textDecoration: "none" }}
            >
              {t("openLineBtn")}
            </a>
            <button
            onClick={() => { setStage("entercode"); pinResetKey.current += 1; setFlowError(null); }}
            style={{ marginTop: 14, width: "100%", background: INK, color: WHITE, border: "none", borderRadius: 6, padding: "11px 0", fontSize: 13, fontWeight: 600 }}
            >
            {t("gotCodeBtn")}
            </button>
            </>
			)}
      
      			{stage === "entercode" && (
  					<>
    					{selectedLocker.overrideRequested && (
    					  <div style={{ marginTop: 14, padding: "10px 12px", background: "#FBEAD9", borderRadius: 6, fontSize: 12.5, color: "#8A4A0F", lineHeight: 1.6, textAlign: "center" }}>{t("overridePendingNote")}</div>
    					)}
    					<p style={{ fontSize: 13, color: MUTE, marginTop: 14, lineHeight: 1.6, textAlign: "center" }}>{t("enterCodePrompt")}</p>
    					{flowError && <div style={{ textAlign: "center", color: RED, fontSize: 12.5, marginBottom: 8 }}>{flowError}</div>}
    					<PinPad length={6} resetKey={pinResetKey.current} onComplete={handleVerifyOverrideCode} disabled={busy} masked={false} />
    					<button onClick={() => { setFlowError(null); setPhoneFailed(false); setStage("phonefail"); }} style={{ marginTop: 12, width: "100%", background: "transparent", border: "none", color: MUTE, fontSize: 12.5, textDecoration: "underline" }}>
    					  {t("noCodeYet")}
    					</button>
  					</>
			)}

            {stage === "resetpin" && (
             <>
              <p style={{ fontSize: 13, color: MUTE, marginTop: 14, lineHeight: 1.6, textAlign: "center" }}>{t("resetPinPrompt")}</p>
              {flowError && <div style={{ textAlign: "center", color: RED, fontSize: 12.5, marginBottom: 8 }}>{flowError}</div>}
              <PinPad length={PIN_LENGTH} resetKey={pinResetKey.current} onComplete={handleNewPinFirst} disabled={busy} />
            </>
           )}

            {stage === "confirmresetpin" && (
             <>
              <p style={{ fontSize: 13, color: MUTE, marginTop: 14, lineHeight: 1.6, textAlign: "center" }}>{t("confirmResetPinPrompt")}</p>
              {flowError && <div style={{ textAlign: "center", color: RED, fontSize: 12.5, marginBottom: 8 }}>{flowError}</div>}
              <PinPad length={PIN_LENGTH} resetKey={pinResetKey.current} onComplete={handleNewPinConfirm} disabled={busy} />
             </>
            )}

            {stage === "verify" && (
              <>
                <p style={{ fontSize: 13, color: MUTE, marginTop: 14, lineHeight: 1.6, textAlign: "center" }}>{t("verifyPrompt", fmtElapsed(now - (selectedLocker.checkinAt || now)))}</p>
                {lockedNow ? (
                  <div style={{ marginTop: 16, textAlign: "center", padding: "16px 10px", background: "#FBEAD9", borderRadius: 8, color: "#8A4A0F", fontSize: 13 }}>{t("lockedMsg", lockRemainSec)}</div>
                ) : (
                  <>
                    <PinPad length={PIN_LENGTH} resetKey={pinResetKey.current} onComplete={(pin) => handleVerifyPin(selectedLocker, pin)} disabled={busy} />
                    {pinError && pinError !== "locked" && <div style={{ textAlign: "center", color: RED, fontSize: 12.5, marginTop: -8, marginBottom: 8 }}>{pinError}</div>}
                  </>
                )}
                <button onClick={handleForgotPin} style={{ marginTop: 12, width: "100%", background: "transparent", border: "none", color: MUTE, fontSize: 12.5, textDecoration: "underline" }}>
                 {t("forgotPin")}
                </button>
                 </>
            )}

            {stage === "menu" && (
              <>
                <p style={{ fontSize: 13, color: MUTE, marginTop: 14, lineHeight: 1.6, textAlign: "center" }}>{t("menuPrompt")}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                  <button disabled={busy || selectedLocker.tempOpens >= FREE_TEMP_OPENS} onClick={() => handleTempOpen(selectedLocker)} style={{ background: WHITE, color: INK, border: `2px solid ${INK}`, borderRadius: 6, padding: "13px 0", fontSize: 14, fontWeight: 600 }}>
                    {t("tempOpenBtn")}
                    {selectedLocker.tempOpens >= FREE_TEMP_OPENS && t("quotaSuffix")}
                  </button>
                  <button disabled={busy} onClick={() => beginCheckout(selectedLocker)} style={{ background: INK, color: WHITE, border: "none", borderRadius: 6, padding: "13px 0", fontSize: 14, fontWeight: 600 }}>
                    {t("finishBtn")}
                  </button>
                </div>
                {selectedLocker.tempOpens >= FREE_TEMP_OPENS && <p style={{ fontSize: 11.5, color: MUTE, marginTop: 10, textAlign: "center" }}>{t("quotaNote", FREE_TEMP_OPENS)}</p>}
              </>
            )}

            <button onClick={closeSheet} style={{ marginTop: 14, width: "100%", background: "transparent", color: MUTE, border: "none", padding: "8px 0", fontSize: 13 }}>{t("close")}</button>
          </div>
        </div>
      )}

      {checkoutFlow && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(26,26,26,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: WHITE, width: "100%", maxWidth: 380, borderRadius: 10, padding: "24px 22px", textAlign: "center" }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: MUTE, fontWeight: 600 }}>{t("checkoutTitle", checkoutFlow.locker.id)}</div>

            {!checkoutFlow.payMethod && (
              <>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 36, fontWeight: 600, margin: "14px 0 2px" }}>฿ {checkoutFlow.bill.price}</div>
                <div style={{ fontSize: 12, color: MUTE, marginBottom: 18 }}>{t("elapsedTier", fmtElapsed(checkoutFlow.elapsed), checkoutFlow.bill.tier)}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={() => confirmPayment("qr")} style={{ background: INK, color: WHITE, border: "none", borderRadius: 6, padding: "13px 0", fontSize: 14, fontWeight: 600 }}>{t("payQr")}</button>
                  <button onClick={() => confirmPayment("cash")} style={{ background: WHITE, color: INK, border: `2px solid ${INK}`, borderRadius: 6, padding: "13px 0", fontSize: 14, fontWeight: 600 }}>{t("payCash")}</button>
                </div>
                <button onClick={cancelCheckout} style={{ marginTop: 14, background: "transparent", border: "none", color: MUTE, fontSize: 12 }}>{t("cancel")}</button>
              </>
            )}

            {checkoutFlow.payMethod === "qr" && (
              <>
                <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
  <img
    src="/promptpay-qr.jpg"
    alt="PromptPay QR"
    style={{ width: 180, height: 180, border: `1px solid ${LINE}`, padding: 8, background: WHITE }}
  />
</div>
                <button
  onClick={savePayQr}
  style={{ width: "100%", background: WHITE, color: INK, border: `1.5px solid ${INK}`, borderRadius: 6, padding: "10px 0", fontSize: 13, fontWeight: 600, marginBottom: 6 }}
>
  ⬇ {t("saveQrBtn")}
								</button>
								<div style={{ fontSize: 11, color: MUTE, marginBottom: 14 }}>{t("saveQrHint")}</div>
                <div style={{ fontSize: 12, color: MUTE, marginBottom: 4 }}>{t("scanQr")}</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 600, marginBottom: 18 }}>฿ {checkoutFlow.bill.price}</div>
                <button disabled={busy} onClick={finishCheckout} style={{ width: "100%", background: GREEN, color: WHITE, border: "none", borderRadius: 6, padding: "13px 0", fontSize: 14, fontWeight: 600 }}>{t("confirmPaid")}</button>
                <button onClick={cancelCheckout} style={{ marginTop: 14, background: "transparent", border: "none", color: MUTE, fontSize: 12 }}>{t("cancel")}</button>
              </>
            )}

            {checkoutFlow.payMethod === "cash" && (
              <>
                <div style={{ margin: "16px 0", padding: "18px 14px", border: `1.5px dashed ${LINE}`, borderRadius: 8, background: PAPER }}>
                  <div style={{ fontSize: 30 }}>📥</div>
                  <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>{t("cashInstruction", checkoutFlow.bill.price)}</div>
                </div>
                <button disabled={busy} onClick={finishCheckout} style={{ width: "100%", background: GREEN, color: WHITE, border: "none", borderRadius: 6, padding: "13px 0", fontSize: 14, fontWeight: 600 }}>{t("cashConfirm")}</button>
                <button onClick={cancelCheckout} style={{ marginTop: 14, background: "transparent", border: "none", color: MUTE, fontSize: 12 }}>{t("cancel")}</button>
              </>
            )}
          </div>
        </div>
      )}

            {closeDoorReminder && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: "fixed", inset: 0, background: "rgba(62,42,30,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}
        >
          <div style={{ background: WHITE, width: "100%", maxWidth: 360, borderRadius: 12, padding: "28px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 6 }}>❕</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600, color: INK, marginBottom: 8 }}>
              {closeDoorReminder.phase === "pickup" ? t("takeKeyTitle") : t("returnKeyTitle")}</div>
            <p style={{ fontSize: 13.5, color: MUTE, lineHeight: 1.7, marginBottom: 20 }}>
              {closeDoorReminder.phase === "pickup" ? t("takeKeyBody", closeDoorReminder.bay) : t("returnKeyBody", closeDoorReminder.bay)}</p>
            <button
              onClick={acknowledgeCloseDoor}
              style={{ width: "100%", background: INK, color: WHITE, border: "none", borderRadius: 6, padding: "13px 0", fontSize: 14, fontWeight: 600 }}
            >
              {t("closeDoorAck")}
            </button>
          </div>
        </div>
      )}


      {toast && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: INK, color: WHITE, padding: "10px 18px", borderRadius: 30, fontSize: 12.5, maxWidth: "90%", textAlign: "center", zIndex: 60, boxShadow: "0 6px 20px rgba(0,0,0,0.25)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
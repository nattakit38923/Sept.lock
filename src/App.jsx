import { useState, useEffect, useMemo, useRef } from "react";

// ⚠️ แก้ URL นี้ให้เป็นของคุณเอง (จาก Apps Script > Deploy > Web app)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyTvr0L5QGt7ccbNfFEvHUuJOimhf3qEaC6QppP5Bk3W8aTHcPMWbnZsislVFKIJ9GH/exec";

const INK = "#3E2A1E";      // น้ำตาลกาแฟเข้ม (แทนที่ดำ)
const PAPER = "#FAF6F0";    // ขาวออฟไวท์อุ่นๆ
const WHITE = "#FFFFFF";
const GREEN = "#3E9B4F";
const RED = "#B5533F";      // ปรับให้เข้ากับโทนน้ำตาล
const ALERT = "#C7893A";    // ส้มอมน้ำตาล เข้ากับธีม
const MUTE = "#8A7A6B";     // น้ำตาลอ่อนสำหรับตัวหนังสือรอง
const LINE = "#E8DFD3";     // เส้นขอบน้ำตาลอ่อนมาก

const RATE_INFO = [
  { key: "r1", th: "1 ชม.", en: "1 hr", price: 20 },
  { key: "r3", th: "3 ชม.", en: "3 hrs", price: 40 },
  { key: "r5", th: "5 ชม.+/วัน", en: "5 hrs+/day", price: 70 },
];
const FREE_TEMP_OPENS = 2;
const POLL_MS = 8000;

const TR = {
  th: {
    appTitle: "SEPT.LOCK",
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
    securityOkMsg: "สถานะความปลอดภัยปกติ",
    securityAlertMsg: "ตรวจพบการเปิดตู้ผิดปกติ — ตรวจสอบก่อนใช้งาน",
    acknowledge: "รับทราบแจ้งเตือน / ปิดเคส",
    setPinPrompt: "ตั้งรหัส 4 หลักไว้ดูสถานะและใช้เช็คเอาท์ทีหลัง — จำไว้ให้ดี ไม่มีการแสดงรหัสซ้ำ",
    verifyPrompt: (elapsed) => `ใช้งานมาแล้ว ${elapsed} — กรอกรหัส 4 หลักที่ตั้งไว้ตอนเช็คอิน`,
    lockedMsg: (sec) => `⚠ กรอกรหัสผิดครบ 3 ครั้ง กรุณารออีก ${sec} วินาที`,
    pinError: (n) => `รหัสไม่ถูกต้อง (${n}/3)`,
    forgotPin: "ลืมรหัส? ขอรีเซ็ตผ่านแอดมิน",
    menuPrompt: "ยืนยันตัวตนสำเร็จ — เลือกดำเนินการ",
    tempOpenBtn: "เปิดชั่วคราว (หยิบของ) — จับเวลาต่อ",
    quotaSuffix: " · ครบโควตาแล้ว",
    finishBtn: "จบการทำงาน — ไปหน้าชำระเงิน",
    quotaNote: (max) => `เปิดชั่วคราวครบ ${max} ครั้งแล้ว ครั้งต่อไปต้องจบการทำงานและชำระเงินก่อน`,
    close: "ปิด",
    checkoutTitle: (id) => `ช่อง ${id} · เช็คเอาท์`,
    elapsedTier: (elapsed, tier) => `ใช้เวลา ${elapsed} · เข้าเกณฑ์ ${tier}`,
    payQr: "จ่ายด้วย QR PromptPay",
    payCash: "จ่ายเงินสด",
    cancel: "ยกเลิก",
    scanQr: "สแกนจ่าย PromptPay",
    confirmPaid: "ยืนยันชำระแล้ว — ปลดล็อก",
    cashInstruction: (amt) => `กรุณาหยอดเงิน ฿${amt} ลงกล่องรับเงินสดข้างตู้`,
    cashConfirm: "หยอดเงินแล้ว — ปลดล็อก",
    toastCheckin: (id) => `เช็คอินช่อง ${id} แล้ว จำรหัสไว้ใช้ตอนเช็คเอาท์`,
    toastTempOpen: (id) => `เปิดตู้ชั่วคราวแล้ว ช่อง ${id} — เวลายังนับต่อ`,
    toastForgot: "ส่งคำขอรีเซ็ตรหัสไปยังแอดมินแล้ว รอการติดต่อกลับ",
    toastAck: (id) => `รับทราบแจ้งเตือนช่อง ${id} แล้ว`,
    toastDone: (amt, id) => `ทำรายการสำเร็จ ฿${amt} ช่อง ${id} ว่างแล้ว`,
    working: "กำลังดำเนินการ...",
  },
  en: {
    appTitle: "SEPT.LOCK",
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
    acknowledge: "Acknowledge alert / close case",
    setPinPrompt: "Set a 4-digit PIN to check status and check out later — remember it, it won't be shown again.",
    verifyPrompt: (elapsed) => `In use for ${elapsed} — enter the PIN you set at check-in`,
    lockedMsg: (sec) => `⚠ Wrong PIN 3 times. Please wait ${sec}s`,
    pinError: (n) => `Incorrect PIN (${n}/3)`,
    forgotPin: "Forgot PIN? Request admin reset",
    menuPrompt: "Verified — choose an action",
    tempOpenBtn: "Temporary open (grab items) — timer continues",
    quotaSuffix: " · Quota reached",
    finishBtn: "Finish — go to payment",
    quotaNote: (max) => `Free temporary opens (${max}) used up. Next time you must finish and pay first.`,
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
    toastCheckin: (id) => `Checked in bay ${id}. Remember your PIN for checkout.`,
    toastTempOpen: (id) => `Bay ${id} opened temporarily — timer still running`,
    toastForgot: "Reset request sent to admin. Please wait to be contacted.",
    toastAck: (id) => `Alert acknowledged for bay ${id}`,
    toastDone: (amt, id) => `Done. Paid ฿${amt}. Bay ${id} is now available.`,
    working: "Working...",
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

function seedGrid(seed, size = 9) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const cells = [];
  for (let i = 0; i < size * size; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    cells.push((h >>> 16) % 2 === 0);
  }
  return cells;
}
function FakeQR({ seed, size = 9, dim = 132 }) {
  const cells = useMemo(() => seedGrid(seed, size), [seed, size]);
  const cell = dim / size;
  return (
    <div style={{ width: dim, height: dim, background: WHITE, padding: 8, border: `1px solid ${LINE}` }}>
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        <rect width={dim} height={dim} fill={WHITE} />
        {cells.map((on, i) => {
          if (!on) return null;
          const x = (i % size) * cell, y = Math.floor(i / size) * cell;
          return <rect key={i} x={x} y={y} width={cell} height={cell} fill={INK} />;
        })}
        {[[0, 0], [dim - cell * 2.4, 0], [0, dim - cell * 2.4]].map(([fx, fy], idx) => (
          <g key={idx}>
            <rect x={fx} y={fy} width={cell * 2.2} height={cell * 2.2} fill={INK} />
            <rect x={fx + cell * 0.4} y={fy + cell * 0.4} width={cell * 1.4} height={cell * 1.4} fill={WHITE} />
            <rect x={fx + cell * 0.8} y={fy + cell * 0.8} width={cell * 0.6} height={cell * 0.6} fill={INK} />
          </g>
        ))}
      </svg>
    </div>
  );
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
function PinPad({ length = 4, onComplete, resetKey, disabled }) {
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
      <div style={{ display: "flex", justifyContent: "center", gap: 12, margin: "14px 0 18px" }}>
        {Array.from({ length }).map((_, i) => (
          <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", border: `1.5px solid ${INK}`, background: i < digits.length ? INK : "transparent" }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, maxWidth: 240, margin: "0 auto", opacity: disabled ? 0.4 : 1 }}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} disabled={disabled} onClick={() => press(d)} style={{ padding: "14px 0", fontSize: 18, fontFamily: "'JetBrains Mono', monospace", background: WHITE, border: `1px solid ${LINE}`, borderRadius: 8, color: INK }}>
            {d}
          </button>
        ))}
        <div />
        <button disabled={disabled} onClick={() => press("0")} style={{ padding: "14px 0", fontSize: 18, fontFamily: "'JetBrains Mono', monospace", background: WHITE, border: `1px solid ${LINE}`, borderRadius: 8, color: INK }}>0</button>
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
  const [toast, setToast] = useState(null);
  const pinResetKey = useRef(0);

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
        setLockers(
          data.map((row) => ({
            id: row.bay,
            status: row.occupied ? "occupied" : "available",
            security: row.security || "ok",
            checkinAt: row.checkin_at ? new Date(row.checkin_at).getTime() : null,
            tempOpens: Number(row.temp_opens) || 0,
            lockUntil: row.lock_until ? new Date(row.lock_until).getTime() : null,
          }))
        );
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
      setLockers(
        data.map((row) => ({
          id: row.bay,
          status: row.occupied ? "occupied" : "available",
          security: row.security || "ok",
          checkinAt: row.checkin_at ? new Date(row.checkin_at).getTime() : null,
          tempOpens: Number(row.temp_opens) || 0,
          lockUntil: row.lock_until ? new Date(row.lock_until).getTime() : null,
        }))
      );
    } catch (e) {}
  };

  const openLocker = (locker) => {
    setSelected(locker.id);
    setPinError(null);
    pinResetKey.current += 1;
    setStage(locker.status === "available" ? "setpin" : "verify");
    setCheckoutFlow(null);
  };

  const handleSetPin = async (pin) => {
    setBusy(true);
    await callApi("setPin", { bay: selected, pin });
    setBusy(false);
    setToast(t("toastCheckin", selected));
    setStage(null);
    setSelected(null);
    refreshOne();
  };

  const handleVerifyPin = async (locker, pin) => {
    setBusy(true);
    const result = await callApi("verifyPin", { bay: locker.id, pin });
    setBusy(false);
    pinResetKey.current += 1;

    if (result === "ok") {
      setPinError(null);
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

  const handleForgotPin = async (locker) => {
    setBusy(true);
    await callApi("forgotPin", { bay: locker.id });
    setBusy(false);
    setToast(t("toastForgot"));
    setStage(null);
    setSelected(null);
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
    setCheckoutFlow({ locker, bill, payMethod: null, elapsed });
    setStage(null);
    setSelected(null);
  };
  const confirmPayment = (method) => setCheckoutFlow((cf) => ({ ...cf, payMethod: method }));

  const finishCheckout = async () => {
    if (!checkoutFlow) return;
    const { locker, bill, payMethod } = checkoutFlow;
    setBusy(true);
    await callApi("finishCheckout", { bay: locker.id, amount: bill.price, method: payMethod });
    setBusy(false);
    setToast(t("toastDone", bill.price, locker.id));
    setCheckoutFlow(null);
    refreshOne();
  };

  const cancelCheckout = () => setCheckoutFlow(null);
  const closeSheet = () => {
    setSelected(null);
    setStage(null);
    setPinError(null);
  };

  const selectedLocker = lockers.find((l) => l.id === selected);
  const lockedNow = selectedLocker?.lockUntil && now < selectedLocker.lockUntil;
  const lockRemainSec = lockedNow ? Math.ceil((selectedLocker.lockUntil - now) / 1000) : 0;

  return (
    <div style={{ minHeight: "100vh", background: PAPER, fontFamily: "'Inter', system-ui, sans-serif", color: INK, padding: "0 0 40px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
        button:disabled { opacity: 0.4; cursor: not-allowed; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      `}</style>

      <div style={{ background: INK, padding: "22px 20px 18px", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: 14, right: 16, display: "flex", background: "#2E2A24", borderRadius: 20, padding: 3, gap: 2 }}>
          {["th", "en"].map((code) => (
            <button key={code} onClick={() => setLang(code)} style={{ padding: "5px 12px", borderRadius: 16, border: "none", fontSize: 11, fontWeight: 600, background: lang === code ? WHITE : "transparent", color: lang === code ? INK : "#B9B4AC" }}>
              {code === "th" ? "ไทย" : "EN"}
            </button>
          ))}
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: WHITE, letterSpacing: 0.5, marginTop: 6 }}>{t("appTitle")}</div>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {lockers.map((locker) => {
            const isOccupied = locker.status === "occupied";
            const elapsed = isOccupied && locker.checkinAt ? now - locker.checkinAt : 0;
            const bill = isOccupied && locker.checkinAt ? computeBill(elapsed, lang) : null;
            const totalMs = 3600000; // วงแหวนเติมเต็มทุก 1 ชั่วโมง (ไม่ผูกกับแพ็กเกจคงที่แล้ว)
            const ringProgress = elapsed % 3600000;

            return (
              <button key={locker.id} onClick={() => openLocker(locker)} style={{ background: isOccupied ? INK : WHITE, border: `2px solid ${locker.security === "alert" ? ALERT : INK}`, borderRadius: 4, padding: "16px 14px", textAlign: "left", position: "relative", boxShadow: locker.security === "alert" ? `0 0 0 3px ${ALERT}33` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: isOccupied ? WHITE : INK }}>{locker.id}</span>
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
                <span>{selectedLocker.security === "alert" ? "⚠" : "🛡"}</span>
                <span>{selectedLocker.security === "alert" ? t("securityAlertMsg") : t("securityOkMsg")}</span>
              </div>
            )}
            {selectedLocker.security === "alert" && (
              <button disabled={busy} onClick={() => acknowledgeAlert(selectedLocker)} style={{ marginTop: 10, width: "100%", background: ALERT, color: WHITE, border: "none", borderRadius: 6, padding: "10px 0", fontSize: 13, fontWeight: 600 }}>
                {t("acknowledge")}
              </button>
            )}

            {stage === "setpin" && (
              <>
                <p style={{ fontSize: 13, color: MUTE, marginTop: 14, lineHeight: 1.6, textAlign: "center" }}>{t("setPinPrompt")}</p>
                <PinPad resetKey={pinResetKey.current} onComplete={handleSetPin} disabled={busy} />
              </>
            )}

            {stage === "verify" && (
              <>
                <p style={{ fontSize: 13, color: MUTE, marginTop: 14, lineHeight: 1.6, textAlign: "center" }}>{t("verifyPrompt", fmtElapsed(now - (selectedLocker.checkinAt || now)))}</p>
                {lockedNow ? (
                  <div style={{ marginTop: 16, textAlign: "center", padding: "16px 10px", background: "#FBEAD9", borderRadius: 8, color: "#8A4A0F", fontSize: 13 }}>{t("lockedMsg", lockRemainSec)}</div>
                ) : (
                  <>
                    <PinPad resetKey={pinResetKey.current} onComplete={(pin) => handleVerifyPin(selectedLocker, pin)} disabled={busy} />
                    {pinError && pinError !== "locked" && <div style={{ textAlign: "center", color: RED, fontSize: 12.5, marginTop: -8, marginBottom: 8 }}>{pinError}</div>}
                  </>
                )}
                <button disabled={busy} onClick={() => handleForgotPin(selectedLocker)} style={{ marginTop: 12, width: "100%", background: "transparent", border: "none", color: MUTE, fontSize: 12.5, textDecoration: "underline" }}>
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
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(26,26,26,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }} onClick={cancelCheckout}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: WHITE, width: "100%", maxWidth: 380, borderRadius: 10, padding: "24px 22px", textAlign: "center" }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: MUTE, fontWeight: 600 }}>{t("checkoutTitle", checkoutFlow.locker.id)}</div>

            {!checkoutFlow.payMethod && (
              <>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 600, margin: "14px 0 2px" }}>฿{checkoutFlow.bill.price}</div>
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
                <div style={{ fontSize: 12, color: MUTE, marginBottom: 4 }}>{t("scanQr")}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 600, marginBottom: 18 }}>฿{checkoutFlow.bill.price}</div>
                <button disabled={busy} onClick={finishCheckout} style={{ width: "100%", background: GREEN, color: WHITE, border: "none", borderRadius: 6, padding: "13px 0", fontSize: 14, fontWeight: 600 }}>{t("confirmPaid")}</button>
              </>
            )}

            {checkoutFlow.payMethod === "cash" && (
              <>
                <div style={{ margin: "16px 0", padding: "18px 14px", border: `1.5px dashed ${LINE}`, borderRadius: 8, background: PAPER }}>
                  <div style={{ fontSize: 30 }}>💵</div>
                  <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>{t("cashInstruction", checkoutFlow.bill.price)}</div>
                </div>
                <button disabled={busy} onClick={finishCheckout} style={{ width: "100%", background: GREEN, color: WHITE, border: "none", borderRadius: 6, padding: "13px 0", fontSize: 14, fontWeight: 600 }}>{t("cashConfirm")}</button>
              </>
            )}
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

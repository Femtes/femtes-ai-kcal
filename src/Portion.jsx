import React, { useState, useRef, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

const colors = {
  bg: "#121317",
  surface: "#1C1E24",
  surfaceMuted: "#26282F",
  text: "#F5F6F8",
  textDim: "#8B8D97",
  hairline: "#33353D",
  primary: "#8B6BFF",
  primaryLight: "#2A2340",
  water: "#3FB6D3",
  carbs: "#6FCF57",
  protein: "#F0924B",
  fat: "#E8C34F",
  fiber: "#B98B5E",
  coral: "#FF6B4A",
  pink: "#F0567F",
  onPrimary: "#FFFFFF",
};

const MACRO_BAR_COLORS = { carbs: "#6FCF57", protein: "#4E8CFF", fat: "#F0924B", fiber: "#B98B5E" };

const CATEGORIES = [
  { key: "breakfast", label: "Frukost" },
  { key: "lunch", label: "Lunch" },
  { key: "snack", label: "Mellanmål" },
  { key: "dinner", label: "Middag" },
  { key: "other", label: "Övrigt" },
];

const WATER_QUICK_ADDS = [200, 330, 500];
const DAY_LETTERS = ["M", "T", "O", "T", "F", "L", "S"];
const CATEGORY_KCAL_SPLIT = { breakfast: 0.25, lunch: 0.35, snack: 0.1, dinner: 0.3, other: 0 };
const TABS = [
  { key: "budget", label: "Översikt" },
  { key: "scanner", label: "Måltids scanner" },
  { key: "training", label: "Träning" },
  { key: "fasting", label: "Fasta" },
  { key: "trends", label: "Trender" },
  { key: "weight", label: "Viktgång" },
  { key: "legal", label: "Legal" },
];

const KCAL_PER_KG_PER_KM = 0.7;
const STEPS_PER_KM = 1333; // ~0,75 m per steg, matchar ca 7,5 km per 10 000 steg

function stepsToKcal(steps, weightKg) {
  const km = (Number(steps) || 0) / STEPS_PER_KM;
  return Math.round(KCAL_PER_KG_PER_KM * weightKg * km);
}

const EXERCISE_TYPES = [
  { key: "walk", label: "Promenad", mode: "steps", icon: "🚶" },
  { key: "brisk_walk", label: "Rask promenad", mode: "steps", icon: "🚶" },
  { key: "run", label: "Löpning", mode: "distance", kcalPerKgPerKm: 1.0, icon: "🏃" },
  { key: "cycle", label: "Cykling", mode: "distance", kcalPerKgPerKm: 0.5, icon: "🚴" },
  { key: "strength", label: "Styrketräning", mode: "time", met: 5.0, icon: "🏋️" },
  { key: "swim", label: "Simning", mode: "distance", kcalPerKgPerKm: 4.0, icon: "🏊" },
  { key: "yoga", label: "Yoga", mode: "time", met: 2.5, icon: "🧘" },
  { key: "jump_rope", label: "Hopprep", mode: "time", met: 11.0, icon: "🤸" },
  { key: "other", label: "Övrigt (ange kcal själv)", mode: "manual", icon: "✨" },
];

const DEFAULT_BODYWEIGHT_KG = 70;

const ACTIVITY_COLORS = {
  walk: "#6FCF57",
  brisk_walk: "#6FCF57",
  run: "#FF6B4A",
  cycle: "#3FB6D3",
  strength: "#F0924B",
  swim: "#8B6BFF",
  yoga: "#F0567F",
  jump_rope: "#B98B5E",
  other: "#E8C34F",
};

const FASTING_METHODS = [
  { key: "12:12", fastHours: 12, label: "12:12" },
  { key: "14:10", fastHours: 14, label: "14:10" },
  { key: "16:8", fastHours: 16, label: "16:8" },
  { key: "18:6", fastHours: 18, label: "18:6" },
  { key: "20:4", fastHours: 20, label: "20:4" },
  { key: "omad", fastHours: 23, label: "OMAD (23:1)" },
  { key: "24h", fastHours: 24, label: "24 timmar" },
  { key: "36h", fastHours: 36, label: "36 timmar" },
  { key: "48h", fastHours: 48, label: "48 timmar" },
  { key: "72h", fastHours: 72, label: "72 timmar" },
];

const STORAGE_PREFIX = "portion-day:";
const WATER_GOAL_KEY = "portion-water-goal";
const STEP_GOAL_KEY = "portion-step-goal";
const FLEXIBLE_BUDGET_KEY = "portion-flexible-budget";
const VISUAL_MODE_KEY = "portion-visual-mode";
const FOOD_LIBRARY_KEY = "portion-food-library-v1";
const FOOD_LIBRARY_MAX = 150;
const AUTH_ACCOUNT_KEY = "portion-auth-account-v1";
const AUTH_SESSION_KEY = "portion-auth-session-v1";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_STEP_GOAL = 8000;
const PROFILE_KEY = "portion-profile-v1";
const CATEGORY_SPLIT_KEY = "portion-category-split-v1";
const WEIGHT_LOG_KEY = "portion-weight-log-v1";
const FASTING_KEY = "portion-fasting-v1";
const DEFAULT_WATER_GOAL = 2000;

const ACTIVITY_LEVELS = [
  { key: "sedentary", label: "Stillasittande", hint: "Lite eller ingen träning" },
  { key: "light", label: "Lätt aktiv", hint: "Träning 1–3 ggr/vecka" },
  { key: "moderate", label: "Måttligt aktiv", hint: "Träning 3–5 ggr/vecka" },
  { key: "active", label: "Mycket aktiv", hint: "Träning 6–7 ggr/vecka" },
];

const GOAL_TYPES = [
  { key: "lose", label: "Gå ner i vikt" },
  { key: "maintain", label: "Behålla vikt" },
  { key: "gain", label: "Gå upp i vikt" },
];

const ACTIVITY_MULTIPLIERS = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
const GOAL_ADJUST = { lose: -500, maintain: 0, gain: 500 };

const emptyDraft = { name: "", kcal: "", protein: "", carbs: "", fat: "", fiber: "", co2: "", cost: "", portion_note: "", image: null, emoji: "" };

const FOOD_EMOJI_MAP = [
  [["ägg"], "🥚"],
  [["vindruv"], "🍇"],
  [["banan"], "🍌"],
  [["äpple"], "🍎"],
  [["apelsin", "clementin", "mandarin"], "🍊"],
  [["citron"], "🍋"],
  [["jordgubb"], "🍓"],
  [["blåbär"], "🫐"],
  [["ananas"], "🍍"],
  [["mango"], "🥭"],
  [["persika", "nektarin"], "🍑"],
  [["päron"], "🍐"],
  [["melon", "vattenmelon"], "🍉"],
  [["kiwi"], "🥝"],
  [["avokado"], "🥑"],
  [["tomat"], "🍅"],
  [["gurka"], "🥒"],
  [["morot", "morötter"], "🥕"],
  [["majs"], "🌽"],
  [["potatis"], "🥔"],
  [["broccoli"], "🥦"],
  [["paprika"], "🫑"],
  [["lök"], "🧅"],
  [["vitlök"], "🧄"],
  [["sallad", "sallat"], "🥗"],
  [["svamp", "champinjon"], "🍄"],
  [["kyckling"], "🍗"],
  [["kalkon"], "🦃"],
  [["biff", "nötkött", "köttbulle", "köttfärs", "fläsk", "korv", "bacon", "skinka"], "🥩"],
  [["fisk", "lax", "torsk"], "🐟"],
  [["räka", "räkor"], "🍤"],
  [["ost"], "🧀"],
  [["mjölk"], "🥛"],
  [["yoghurt", "yoghurt", "kvarg", "fil", "gröt"], "🥣"],
  [["smör"], "🧈"],
  [["bröd", "smörgås", "macka", "baguette"], "🍞"],
  [["bulle", "croissant"], "🥐"],
  [["bagel"], "🥯"],
  [["pannkak", "våffl"], "🧇"],
  [["ris"], "🍚"],
  [["pasta", "spagetti", "makaroner"], "🍝"],
  [["pizza"], "🍕"],
  [["hamburgare", "burgare"], "🍔"],
  [["falafel"], "🧆"],
  [["taco", "burrito", "wrap"], "🌮"],
  [["sushi"], "🍣"],
  [["soppa"], "🍲"],
  [["kaka", "kex"], "🍪"],
  [["choklad"], "🍫"],
  [["glass"], "🍨"],
  [["tårta", "bakelse"], "🍰"],
  [["godis"], "🍬"],
  [["nöt", "mandel", "cashew", "jordnöt"], "🥜"],
  [["popcorn"], "🍿"],
  [["kaffe"], "☕"],
  [["te"], "🍵"],
  [["juice", "saft"], "🧃"],
  [["vatten"], "💧"],
  [["öl"], "🍺"],
  [["vin"], "🍷"],
  [["honung"], "🍯"],
  [["bönor", "linser", "kikärt"], "🫘"],
];

function guessFoodEmoji(name) {
  if (!name) return "🍽️";
  const lower = name.toLowerCase();
  for (const [keywords, emoji] of FOOD_EMOJI_MAP) {
    if (keywords.some((k) => lower.includes(k))) return emoji;
  }
  return "🍽️";
}
const SHARED_MEAL_PREFIX = "portion-shared-meal:";

function generateShareCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
const emptyDay = () => ({ breakfast: [], lunch: [], snack: [], dinner: [], other: [], water: [], exercise: [], steps: "" });
const emptyFasting = { method: "14:10", methodKey: "14:10", fastHours: 14, isFasting: false, startTime: null, lastEnd: null };
const emptyProfile = {
  sex: "female",
  age: "",
  weightKg: "",
  heightCm: "",
  activity: "light",
  goalType: "maintain",
  manualOverride: false,
  kcalGoal: "",
  proteinGoal: "",
  fatGoal: "",
  carbsGoal: "",
  fiberGoal: "",
};

function computeGoals(p) {
  const age = Number(p.age);
  const weightKg = Number(p.weightKg);
  const heightCm = Number(p.heightCm);
  if (!age || !weightKg || !heightCm) return null;

  const bmr =
    p.sex === "female"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

  const tdee = bmr * (ACTIVITY_MULTIPLIERS[p.activity] || 1.2);
  let kcalGoal = Math.round(tdee + (GOAL_ADJUST[p.goalType] ?? 0));
  kcalGoal = Math.max(1200, kcalGoal);

  const proteinGoal = Math.round(weightKg * 1.6);
  const fatGoal = Math.round((kcalGoal * 0.3) / 9);
  const fiberGoal = Math.round((kcalGoal / 1000) * 14);
  const carbsGoal = Math.max(0, Math.round((kcalGoal - proteinGoal * 4 - fatGoal * 9) / 4));

  return { kcalGoal, proteinGoal, fatGoal, carbsGoal, fiberGoal };
}

function resolveGoals(profile) {
  if (!profile) return null;
  if (profile.manualOverride) {
    const kcalGoal = Number(profile.kcalGoal);
    if (!kcalGoal) return null;
    return {
      kcalGoal,
      proteinGoal: Number(profile.proteinGoal) || 0,
      fatGoal: Number(profile.fatGoal) || 0,
      carbsGoal: Number(profile.carbsGoal) || 0,
      fiberGoal: Number(profile.fiberGoal) || 0,
    };
  }
  return computeGoals(profile);
}

function compressImage(file, maxWidth = 480, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Kunde inte läsa bilden"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Kunde inte läsa bilden"));
    reader.readAsDataURL(file);
  });
}

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function shiftDateKey(key, days) {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Mars",
  "April",
  "Maj",
  "Juni",
  "Juli",
  "Augusti",
  "September",
  "Oktober",
  "November",
  "December",
];

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

function shiftMonthKey(key, delta) {
  const d = parseMonthKey(key);
  d.setMonth(d.getMonth() + delta);
  return monthKey(d);
}

function monthLabel(key) {
  const d = parseMonthKey(key);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function daysInMonthCount(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function getMonthDateKeys(key) {
  const d = parseMonthKey(key);
  const n = daysInMonthCount(d);
  const keys = [];
  for (let i = 1; i <= n; i++) keys.push(dateKey(new Date(d.getFullYear(), d.getMonth(), i)));
  return keys;
}

function dateLabel(key) {
  const todayKey = dateKey(new Date());
  const yesterdayKey = shiftDateKey(todayKey, -1);
  if (key === todayKey) return "Idag";
  if (key === yesterdayKey) return "Igår";
  const d = parseDateKey(key);
  const label = d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getWeekDates(selectedKey) {
  const d = parseDateKey(selectedKey);
  const offset = (d.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return dt;
  });
}

function Ring({ size, stroke, baseColor, overlayColor, fraction, children }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, fraction));
  const overlayLength = circumference * clamped;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={baseColor} strokeWidth={stroke} fill="none" />
        {clamped > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={overlayColor}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${overlayLength} ${circumference}`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function HeartIcon({ fraction, size = 26 }) {
  const isGreen = fraction <= 0.5;
  const isYellow = fraction > 0.5 && fraction < 1.0;
  const color = isGreen ? colors.carbs : isYellow ? colors.fat : colors.coral;
  const width = Math.round(size * (26 / 24));

  return (
    <div className="flex items-center justify-center flex-shrink-0" style={{ width, height: size }}>
      <svg
        width={width}
        height={size}
        viewBox="0 0 24 22"
        style={{ filter: `drop-shadow(0 0 4px ${color}) drop-shadow(0 0 7px ${color}88)` }}
      >
        <path
          d="M12,20.35l-1.45-1.32C5.4,14.86,2,11.78,2,8.5C2,5.86,4.09,3.77,6.73,3.77c1.49,0,2.92,0.7,3.83,1.79l1.44,1.7l1.44-1.7c0.91-1.09,2.34-1.79,3.83-1.79C19.91,3.77,22,5.86,22,8.5c0,3.28-3.4,6.36-8.55,10.54L12,20.35z"
          fill="none"
          stroke={color}
          strokeWidth="1.7"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function InfoBanner({ children }) {
  return (
    <div
      className="rounded-xl px-3.5 py-3 mb-5 flex items-start gap-2.5"
      style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}` }}
    >
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
      <p className="text-xs" style={{ color: colors.textDim, lineHeight: 1.5 }}>
        {children}
      </p>
    </div>
  );
}

function SemiGauge({ size, stroke, baseColor, overlayColor, fraction, children }) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const halfCirc = Math.PI * r;
  const clamped = Math.min(1, Math.max(0, fraction));
  const dash = halfCirc * clamped;
  const path = `M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`;
  const height = size / 2 + stroke;

  return (
    <div className="relative" style={{ width: size, height }}>
      <svg width={size} height={height}>
        <path d={path} stroke={baseColor} strokeWidth={stroke} fill="none" strokeLinecap="round" />
        {clamped > 0 && (
          <path
            d={path}
            stroke={overlayColor}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${halfCirc}`}
          />
        )}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-1">{children}</div>
    </div>
  );
}

export default function Portion() {
  const todayKey = dateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [mealsCache, setMealsCache] = useState({});
  const [dayLoading, setDayLoading] = useState(true);
  const [flow, setFlow] = useState(null);
  const [waterGoal, setWaterGoal] = useState(DEFAULT_WATER_GOAL);
  const [stepGoal, setStepGoal] = useState(DEFAULT_STEP_GOAL);
  const [flexibleBudget, setFlexibleBudget] = useState(true);
  const [visualMode, setVisualMode] = useState(false);
  const [weeklyCalc, setWeeklyCalc] = useState(null);
  const [reactiveBurn, setReactiveBurn] = useState(null);
  const [reactiveDismissed, setReactiveDismissed] = useState(false);
  const [reactiveSuggestFlow, setReactiveSuggestFlow] = useState(null);
  const [shareModal, setShareModal] = useState(null);
  const [foodLibrary, setFoodLibrary] = useState([]);
  const [authScreen, setAuthScreen] = useState(null);
  const [authAccount, setAuthAccount] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authForm, setAuthForm] = useState({ email: "", password: "", confirmPassword: "", acceptTerms: false, rememberMe: true });
  const [authError, setAuthError] = useState("");
  const [authInfo, setAuthInfo] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(DEFAULT_WATER_GOAL));
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState(emptyProfile);
  const [categorySplit, setCategorySplit] = useState(null);
  const [categorySplitOpen, setCategorySplitOpen] = useState(false);
  const [categorySplitDraft, setCategorySplitDraft] = useState({ breakfast: "", lunch: "", snack: "", dinner: "" });
  const [activeTab, setActiveTab] = useState("budget");
  const [trendsData, setTrendsData] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsMetric, setTrendsMetric] = useState("kcal");
  const [trendsSelectedDay, setTrendsSelectedDay] = useState(todayKey);
  const [weightLog, setWeightLog] = useState([]);
  const [weightLogLoaded, setWeightLogLoaded] = useState(false);
  const [weightLogLoading, setWeightLogLoading] = useState(false);
  const [weightDraft, setWeightDraft] = useState({ kg: "", date: todayKey });
  const [fasting, setFasting] = useState(emptyFasting);
  const [fastingLoaded, setFastingLoaded] = useState(false);
  const [fastingMethodOpen, setFastingMethodOpen] = useState(false);
  const [editingFastStart, setEditingFastStart] = useState(false);
  const [fastStartDraft, setFastStartDraft] = useState("");
  const [customFastHours, setCustomFastHours] = useState("");
  const [exerciseFlow, setExerciseFlow] = useState(null);
  const [scannerCategory, setScannerCategory] = useState("dinner");
  const [scannerFlow, setScannerFlow] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [fastCompletedMsg, setFastCompletedMsg] = useState(null);
  const fileInputRef = useRef(null);
  const manualImageInputRef = useRef(null);
  const scannerFileInputRef = useRef(null);
  const dateInputRef = useRef(null);
  const cacheRef = useRef({});

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(WATER_GOAL_KEY, false);
        if (res && res.value) {
          const parsed = Number(res.value);
          if (parsed > 0) setWaterGoal(parsed);
        }
      } catch (e) {}
      try {
        const res = await window.storage.get(STEP_GOAL_KEY, false);
        if (res && res.value) {
          const parsed = Number(res.value);
          if (parsed > 0) setStepGoal(parsed);
        }
      } catch (e) {}
      try {
        const res = await window.storage.get(FLEXIBLE_BUDGET_KEY, false);
        if (res && res.value != null) setFlexibleBudget(res.value === "true");
      } catch (e) {}
      try {
        const res = await window.storage.get(VISUAL_MODE_KEY, false);
        if (res && res.value != null) setVisualMode(res.value === "true");
      } catch (e) {}
      try {
        const res = await window.storage.get(FOOD_LIBRARY_KEY, false);
        if (res && res.value) setFoodLibrary(JSON.parse(res.value));
      } catch (e) {}
      try {
        const res = await window.storage.get(PROFILE_KEY, false);
        if (res && res.value) setProfile(JSON.parse(res.value));
      } catch (e) {
      } finally {
        setProfileLoading(false);
      }
      try {
        const res = await window.storage.get(CATEGORY_SPLIT_KEY, false);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          const isLegacyFormat = Object.values(parsed).some((v) => v > 1);
          if (isLegacyFormat) {
            window.storage.delete(CATEGORY_SPLIT_KEY, false).catch(() => {});
          } else {
            setCategorySplit(parsed);
          }
        }
      } catch (e) {}
      try {
        const res = await window.storage.get(FASTING_KEY, false);
        if (res && res.value) setFasting({ ...emptyFasting, ...JSON.parse(res.value) });
      } catch (e) {
      } finally {
        setFastingLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!fasting.isFasting) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [fasting.isFasting]);

  async function ensureDateLoaded(date) {
    if (cacheRef.current[date]) return;
    setDayLoading(true);
    try {
      const res = await window.storage.get(STORAGE_PREFIX + date, false);
      const value = res && res.value ? { ...emptyDay(), ...JSON.parse(res.value) } : emptyDay();
      cacheRef.current = { ...cacheRef.current, [date]: value };
      setMealsCache((prev) => ({ ...prev, [date]: value }));
    } catch (e) {
      cacheRef.current = { ...cacheRef.current, [date]: emptyDay() };
      setMealsCache((prev) => ({ ...prev, [date]: emptyDay() }));
    } finally {
      setDayLoading(false);
    }
  }

  useEffect(() => {
    ensureDateLoaded(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => {
    if (activeTab === "trends") loadTrends();
    if (activeTab === "weight" && !weightLogLoaded) loadWeightLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, trendsSelectedDay]);

  async function loadTrends() {
    setTrendsLoading(true);
    const keys = getWeekDates(trendsSelectedDay).map(dateKey);
    const results = await Promise.all(
      keys.map(async (k) => {
        if (cacheRef.current[k]) return { date: k, day: cacheRef.current[k] };
        try {
          const res = await window.storage.get(STORAGE_PREFIX + k, false);
          const value = res && res.value ? { ...emptyDay(), ...JSON.parse(res.value) } : emptyDay();
          cacheRef.current = { ...cacheRef.current, [k]: value };
          return { date: k, day: value };
        } catch (e) {
          return { date: k, day: emptyDay() };
        }
      })
    );
    const data = results.map((r) => {
      const totals = CATEGORIES.reduce(
        (acc, c) => {
          r.day[c.key].forEach((item) => {
            acc.kcal += item.kcal || 0;
            acc.protein += item.protein || 0;
            acc.carbs += item.carbs || 0;
            acc.fat += item.fat || 0;
            acc.fiber += item.fiber || 0;
          });
          return acc;
        },
        { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      );
      const d = parseDateKey(r.date);
      return { date: r.date, ...totals, label: String(d.getDate()) };
    });
    setTrendsData(data);
    setTrendsLoading(false);
  }

  async function loadWeightLog() {
    setWeightLogLoading(true);
    try {
      const res = await window.storage.get(WEIGHT_LOG_KEY, false);
      setWeightLog(res && res.value ? JSON.parse(res.value) : []);
    } catch (e) {
      setWeightLog([]);
    } finally {
      setWeightLogLoaded(true);
      setWeightLogLoading(false);
    }
  }

  function persistWeightLog(next) {
    window.storage.set(WEIGHT_LOG_KEY, JSON.stringify(next), false).catch(() => {});
  }

  function addWeightEntry() {
    const kg = Number(weightDraft.kg);
    if (!kg || !weightDraft.date) return;
    const next = [...weightLog.filter((e) => e.date !== weightDraft.date), { id: Date.now(), date: weightDraft.date, kg }];
    next.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    setWeightLog(next);
    persistWeightLog(next);
    setWeightDraft({ kg: "", date: todayKey });
  }

  function deleteWeightEntry(id) {
    const next = weightLog.filter((e) => e.id !== id);
    setWeightLog(next);
    persistWeightLog(next);
  }

  function persistFasting(next) {
    window.storage.set(FASTING_KEY, JSON.stringify(next), false).catch(() => {});
  }

  function startFast() {
    const next = { ...fasting, isFasting: true, startTime: new Date().toISOString() };
    setFasting(next);
    persistFasting(next);
  }

  function endFast() {
    const next = { ...fasting, isFasting: false, lastEnd: new Date().toISOString() };
    setFasting(next);
    persistFasting(next);
  }

  const FAST_COMPLETE_MESSAGES = [
    "Snyggt jobbat! Du klarade hela fastan 🎉",
    "Wow, du gjorde det! Kroppen tackar dig 💪",
    "Fastan är avklarad — riktigt bra genomfört 🌟",
    "Mål uppnått! Du ska vara stolt över dig själv ✨",
    "Helt klart! Bra jobbat idag 🙌",
  ];

  useEffect(() => {
    if (!fasting.isFasting || !fasting.startTime) return;
    const elapsed = (nowTick - new Date(fasting.startTime).getTime()) / 1000;
    if (elapsed >= fasting.fastHours * 3600) {
      const msg = FAST_COMPLETE_MESSAGES[Math.floor(Math.random() * FAST_COMPLETE_MESSAGES.length)];
      setFastCompletedMsg(msg);
      endFast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowTick, fasting.isFasting, fasting.startTime, fasting.fastHours]);

  function chooseFastingMethod(m) {
    const next = { ...fasting, method: m.label, methodKey: m.key, fastHours: m.fastHours };
    setFasting(next);
    persistFasting(next);
    setFastingMethodOpen(false);
  }

  function applyCustomFastHours(hoursValue) {
    const h = Number(hoursValue);
    if (!h || h <= 0 || h > 72) return;
    chooseFastingMethod({ key: "custom", fastHours: h, label: `${h} timmar` });
  }

  function openEditFastStart() {
    if (fasting.startTime) {
      const d = new Date(fasting.startTime);
      const pad = (n) => String(n).padStart(2, "0");
      const localValue = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setFastStartDraft(localValue);
    }
    setEditingFastStart(true);
  }

  function saveFastStart() {
    if (!fastStartDraft) return;
    const iso = new Date(fastStartDraft).toISOString();
    const next = { ...fasting, startTime: iso };
    setFasting(next);
    persistFasting(next);
    setEditingFastStart(false);
  }

  async function persistDate(date, data) {
    try {
      await window.storage.set(STORAGE_PREFIX + date, JSON.stringify(data), false);
    } catch (e) {}
  }

  function updateDay(nextDay) {
    cacheRef.current = { ...cacheRef.current, [selectedDate]: nextDay };
    setMealsCache((prev) => ({ ...prev, [selectedDate]: nextDay }));
    persistDate(selectedDate, nextDay);
  }

  const dayData = mealsCache[selectedDate] || emptyDay();
  const waterEntries = dayData.water || [];
  const waterTotal = waterEntries.reduce((s, w) => s + w.ml, 0);
  const waterPercent = Math.min(100, Math.round((waterTotal / waterGoal) * 100));

  const consumed = CATEGORIES.reduce(
    (acc, c) => {
      dayData[c.key].forEach((item) => {
        acc.kcal += item.kcal || 0;
        acc.protein += item.protein || 0;
        acc.fat += item.fat || 0;
        acc.carbs += item.carbs || 0;
        acc.fiber += item.fiber || 0;
        acc.co2 += item.co2 || 0;
        acc.cost += item.cost || 0;
      });
      return acc;
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, co2: 0, cost: 0 }
  );

  const goals = resolveGoals(profile);
  const weekDates = getWeekDates(selectedDate);
  const exerciseKcalToday = (dayData.exercise || []).reduce((s, e) => s + (e.kcal || 0), 0);

  useEffect(() => {
    if (!flexibleBudget || !goals || !goals.kcalGoal || selectedDate !== todayKey) {
      setWeeklyCalc(null);
      return;
    }
    (async () => {
      const pastDates = getWeekDates(todayKey).map(dateKey).filter((k) => k < todayKey);
      if (pastDates.length === 0) {
        setWeeklyCalc({ pastSurplus: 0, remainingDaysCount: 7, adjustedGoal: goals.kcalGoal });
        return;
      }
      const results = await Promise.all(
        pastDates.map(async (k) => {
          if (cacheRef.current[k]) return cacheRef.current[k];
          try {
            const res = await window.storage.get(STORAGE_PREFIX + k, false);
            const value = res && res.value ? { ...emptyDay(), ...JSON.parse(res.value) } : emptyDay();
            cacheRef.current = { ...cacheRef.current, [k]: value };
            return value;
          } catch (e) {
            return emptyDay();
          }
        })
      );
      const pastActual = results.reduce(
        (sum, day) => sum + CATEGORIES.reduce((s, c) => s + day[c.key].reduce((ss, m) => ss + (m.kcal || 0), 0), 0),
        0
      );
      const pastBudget = goals.kcalGoal * pastDates.length;
      const pastSurplus = pastActual - pastBudget;
      const remainingDaysCount = 7 - pastDates.length; // today + resten av veckan
      let adjustedGoal = Math.round(goals.kcalGoal - pastSurplus / remainingDaysCount);
      // säkerhetsgolv/tak så justeringen aldrig blir extrem
      const floor = Math.max(1200, Math.round(goals.kcalGoal * 0.75));
      const ceiling = Math.round(goals.kcalGoal * 1.25);
      adjustedGoal = Math.min(ceiling, Math.max(floor, adjustedGoal));
      setWeeklyCalc({ pastSurplus: Math.round(pastSurplus), remainingDaysCount, adjustedGoal });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flexibleBudget, goals?.kcalGoal, selectedDate, todayKey]);
  const burnedToday = exerciseKcalToday;

  useEffect(() => {
    if (selectedDate !== todayKey || dayLoading) {
      return;
    }
    (async () => {
      const pastDates = [];
      for (let i = 1; i <= 7; i++) pastDates.push(shiftDateKey(todayKey, -i));
      const results = await Promise.all(
        pastDates.map(async (k) => {
          if (cacheRef.current[k]) return cacheRef.current[k];
          try {
            const res = await window.storage.get(STORAGE_PREFIX + k, false);
            const value = res && res.value ? { ...emptyDay(), ...JSON.parse(res.value) } : emptyDay();
            cacheRef.current = { ...cacheRef.current, [k]: value };
            return value;
          } catch (e) {
            return emptyDay();
          }
        })
      );
      const pastBurns = results.map((day) => (day.exercise || []).reduce((s, e) => s + (e.kcal || 0), 0));
      const avgBurn = pastBurns.reduce((s, v) => s + v, 0) / pastBurns.length;
      const todayBurn = (dayData.exercise || []).reduce((s, e) => s + (e.kcal || 0), 0);
      const surplus = Math.round(todayBurn - avgBurn);
      const meaningful = todayBurn > 0 && surplus >= 200 && todayBurn >= avgBurn * 1.3;
      setReactiveBurn({ avgBurn: Math.round(avgBurn), todayBurn, surplus, meaningful });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, todayKey, dayLoading, dayData.exercise]);

  function goToDate(key) {
    setSelectedDate(key);
  }

  function openCalendarPicker() {
    if (!dateInputRef.current) return;
    if (dateInputRef.current.showPicker) dateInputRef.current.showPicker();
    else dateInputRef.current.click();
  }

  function addWater(ml) {
    const entry = { id: Date.now(), ml };
    updateDay({ ...dayData, water: [...waterEntries, entry] });
  }

  function undoLastWater() {
    updateDay({ ...dayData, water: waterEntries.slice(0, -1) });
  }

  function saveWaterGoal() {
    const val = Number(goalDraft);
    if (val > 0) {
      setWaterGoal(val);
      window.storage.set(WATER_GOAL_KEY, String(val), false).catch(() => {});
    }
    setEditingGoal(false);
  }

  function saveStepGoal(val) {
    const parsed = Number(val);
    if (parsed > 0) {
      setStepGoal(parsed);
      window.storage.set(STEP_GOAL_KEY, String(parsed), false).catch(() => {});
    }
  }

  function addStepsToGoal(steps) {
    setStepGoal((prev) => {
      const next = prev + steps;
      window.storage.set(STEP_GOAL_KEY, String(next), false).catch(() => {});
      return next;
    });
  }

  function toggleFlexibleBudget() {
    setFlexibleBudget((prev) => {
      const next = !prev;
      window.storage.set(FLEXIBLE_BUDGET_KEY, String(next), false).catch(() => {});
      return next;
    });
  }

  function toggleVisualMode() {
    setVisualMode((prev) => {
      const next = !prev;
      window.storage.set(VISUAL_MODE_KEY, String(next), false).catch(() => {});
      return next;
    });
  }

  function openProfile() {
    setProfileDraft(profile || emptyProfile);
    setProfileOpen(true);
  }

  function saveProfile() {
    const computed = computeGoals(profileDraft);
    const next = { ...profileDraft };
    if (next.manualOverride) {
      if (!next.kcalGoal && computed) next.kcalGoal = computed.kcalGoal;
    } else if (computed) {
      next.kcalGoal = computed.kcalGoal;
      next.proteinGoal = computed.proteinGoal;
      next.fatGoal = computed.fatGoal;
      next.carbsGoal = computed.carbsGoal;
      next.fiberGoal = computed.fiberGoal;
    }
    setProfile(next);
    window.storage.set(PROFILE_KEY, JSON.stringify(next), false).catch(() => {});
    setProfileOpen(false);
  }

  function updateProfileDraft(field, value) {
    setProfileDraft((p) => ({ ...p, [field]: value }));
  }

  function toggleManualOverride() {
    setProfileDraft((p) => {
      const willBeManual = !p.manualOverride;
      if (willBeManual) {
        const computed = computeGoals(p) || {};
        return {
          ...p,
          manualOverride: true,
          kcalGoal: p.kcalGoal || computed.kcalGoal || "",
          proteinGoal: p.proteinGoal || computed.proteinGoal || "",
          fatGoal: p.fatGoal || computed.fatGoal || "",
          carbsGoal: p.carbsGoal || computed.carbsGoal || "",
          fiberGoal: p.fiberGoal || computed.fiberGoal || "",
        };
      }
      return { ...p, manualOverride: false };
    });
  }

  function openCategory(key) {
    setFlow({ category: key, step: "menu", draft: emptyDraft, errorMsg: "" });
  }

  function openEditEntry(categoryKey, item) {
    setFlow({
      category: categoryKey,
      step: "manual",
      editId: item.id,
      draft: {
        name: item.name,
        kcal: String(item.kcal),
        protein: String(item.protein || 0),
        carbs: String(item.carbs || 0),
        fat: String(item.fat || 0),
        fiber: String(item.fiber || 0),
        co2: item.co2 ? String(item.co2) : "",
        cost: item.cost ? String(item.cost) : "",
        portion_note: item.portion_note || "",
        image: item.image || null,
        emoji: item.emoji || "",
      },
    });
  }

  function upsertFoodLibrary(item) {
    if (!item.name || !item.name.trim()) return;
    const key = item.name.trim().toLowerCase();
    setFoodLibrary((prev) => {
      const existingIndex = prev.findIndex((f) => f.key === key);
      const entry = {
        key,
        name: item.name,
        kcal: item.kcal || 0,
        protein: item.protein || 0,
        carbs: item.carbs || 0,
        fat: item.fat || 0,
        fiber: item.fiber || 0,
        co2: item.co2 || 0,
        cost: item.cost || 0,
        emoji: item.image ? "" : item.emoji || guessFoodEmoji(item.name),
        useCount: existingIndex >= 0 ? (prev[existingIndex].useCount || 1) + 1 : 1,
        lastUsed: Date.now(),
      };
      let next;
      if (existingIndex >= 0) {
        next = [...prev];
        next[existingIndex] = entry;
      } else {
        next = [entry, ...prev];
      }
      next.sort((a, b) => b.lastUsed - a.lastUsed);
      if (next.length > FOOD_LIBRARY_MAX) next = next.slice(0, FOOD_LIBRARY_MAX);
      window.storage.set(FOOD_LIBRARY_KEY, JSON.stringify(next), false).catch(() => {});
      return next;
    });
  }

  function shareMeal(item) {
    const code = generateShareCode();
    const payload = {
      name: item.name,
      kcal: item.kcal,
      protein: item.protein || 0,
      carbs: item.carbs || 0,
      fat: item.fat || 0,
      fiber: item.fiber || 0,
      co2: item.co2 || 0,
      cost: item.cost || 0,
      portion_note: item.portion_note || "",
    };
    setShareModal({ step: "sharing", code });
    window.storage
      .set(SHARED_MEAL_PREFIX + code, JSON.stringify(payload), true)
      .then(() => setShareModal({ step: "shared", code }))
      .catch(() => setShareModal({ step: "error" }));
  }

  function closeShareModal() {
    setShareModal(null);
  }

  function openReceiveMeal() {
    setFlow((f) => ({ ...f, step: "receive", receiveCode: "", receiveError: false }));
  }

  function updateReceiveCode(value) {
    setFlow((f) => ({ ...f, receiveCode: value.toUpperCase() }));
  }

  async function fetchSharedMeal() {
    const code = flow && flow.receiveCode && flow.receiveCode.trim();
    if (!code) return;
    setFlow((f) => ({ ...f, receiveLoading: true, receiveError: false }));
    try {
      const res = await window.storage.get(SHARED_MEAL_PREFIX + code, true);
      if (!res || !res.value) throw new Error("not found");
      const meal = JSON.parse(res.value);
      setFlow((f) => ({
        ...f,
        step: "manual",
        receiveLoading: false,
        draft: {
          name: meal.name || "",
          kcal: String(meal.kcal || ""),
          protein: String(meal.protein || 0),
          carbs: String(meal.carbs || 0),
          fat: String(meal.fat || 0),
          fiber: String(meal.fiber || 0),
          co2: meal.co2 ? String(meal.co2) : "",
          cost: meal.cost ? String(meal.cost) : "",
          portion_note: meal.portion_note || "",
          image: null,
        },
      }));
    } catch (e) {
      setFlow((f) => ({ ...f, receiveLoading: false, receiveError: true }));
    }
  }


  function getCategoryBudget(catKey) {
    if (categorySplit && categorySplit[catKey] != null) {
      if (!goals) return catKey === "other" ? 0 : null;
      return Math.round(goals.kcalGoal * categorySplit[catKey]);
    }
    if (catKey === "other") return 0;
    if (!goals) return null;
    return Math.round(goals.kcalGoal * CATEGORY_KCAL_SPLIT[catKey]);
  }

  function openCategorySplit() {
    const current = {};
    CATEGORIES.forEach((c) => {
      current[c.key] = String(getCategoryBudget(c.key) ?? "");
    });
    setCategorySplitDraft(current);
    setCategorySplitOpen(true);
  }

  function updateCategorySplitDraft(key, value) {
    setCategorySplitDraft((d) => ({ ...d, [key]: value }));
  }

  const categorySplitValid = CATEGORIES.every((c) =>
    c.key === "other" ? categorySplitDraft.other !== "" && Number(categorySplitDraft.other) >= 0 : Number(categorySplitDraft[c.key]) > 0
  );

  function saveCategorySplit() {
    if (!categorySplitValid || !goals || !goals.kcalGoal) return;
    const next = {};
    CATEGORIES.forEach((c) => {
      // stored as a fraction of the daily goal, so it stays in sync if the goal changes later
      next[c.key] = Number(categorySplitDraft[c.key]) / goals.kcalGoal;
    });
    setCategorySplit(next);
    window.storage.set(CATEGORY_SPLIT_KEY, JSON.stringify(next), false).catch(() => {});
    setCategorySplitOpen(false);
  }

  function resetCategorySplit() {
    setCategorySplit(null);
    window.storage.delete(CATEGORY_SPLIT_KEY, false).catch(() => {});
    setCategorySplitOpen(false);
  }

  function closeFlow() {
    setFlow(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function triggerCamera() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function openManual() {
    setFlow((f) => ({ ...f, step: "manual", draft: emptyDraft }));
  }

  function openVoiceEntry() {
    setFlow((f) => ({ ...f, step: "voice", voiceText: "", voiceItems: null, voiceLoading: false }));
  }

  function updateVoiceText(value) {
    setFlow((f) => ({ ...f, voiceText: value }));
  }

  async function runVoiceParse() {
    setFlow((f) => (f ? { ...f, voiceLoading: true } : f));
    const text = flow && flow.voiceText;
    if (!text || !text.trim()) return;

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system:
            "Du är en assistent som tolkar en fritextbeskrivning av en måltid och delar upp den i separata livsmedel. Användaren kan nämna flera saker i en och samma mening, t.ex. \"Åt en skål havregrynsgröt med en banan och en skvätt lättmjölk\". Identifiera varje separat livsmedel som nämns, uppskatta en rimlig portionsstorlek utifrån beskrivningen (t.ex. \"en skål\", \"en banan\", \"en skvätt\") och ange näringsvärden, klimatavtryck och kostnad för just den portionen. Svara ENDAST med giltig JSON, utan markdown-formatering, utan kodblock, utan inledande text, i denna form: [{\"name\": string (livsmedelsnamn på svenska, inkl. uppskattad mängd, t.ex. \"Havregrynsgröt (1 skål)\"), \"kcal\": number, \"protein_g\": number, \"carbs_g\": number, \"fat_g\": number, \"fiber_g\": number, \"co2_kg\": number (uppskattat klimatavtryck i kg CO2e för portionen), \"cost_sek\": number (uppskattad kostnad i svenska kronor för portionen)}]. Om texten inte verkar beskriva någon mat, svara med en tom array [].",
          text,
          image: null,
        }),
      });
      const data = await response.json();
      const raw = data.text || "";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const items = (Array.isArray(parsed) ? parsed : []).map((p, i) => ({
        tempId: i,
        name: p.name || "",
        kcal: Math.round(Number(p.kcal)) || 0,
        protein: Math.round(Number(p.protein_g)) || 0,
        carbs: Math.round(Number(p.carbs_g)) || 0,
        fat: Math.round(Number(p.fat_g)) || 0,
        fiber: Math.round(Number(p.fiber_g)) || 0,
        co2: Math.round((Number(p.co2_kg) || 0) * 100) / 100,
        cost: Math.round(Number(p.cost_sek)) || 0,
      }));
      setFlow((f) => (f ? { ...f, step: "voice-results", voiceItems: items, voiceLoading: false } : f));
    } catch (e) {
      setFlow((f) => (f ? { ...f, step: "voice-results", voiceItems: [], voiceLoading: false, voiceError: true } : f));
    }
  }

  function removeVoiceItem(tempId) {
    setFlow((f) => ({ ...f, voiceItems: f.voiceItems.filter((it) => it.tempId !== tempId) }));
  }

  function saveVoiceItems() {
    if (!flow || !flow.voiceItems || flow.voiceItems.length === 0) return;
    const entries = flow.voiceItems.map((it) => ({
      id: Date.now() + it.tempId,
      name: it.name,
      kcal: it.kcal,
      protein: it.protein,
      carbs: it.carbs,
      fat: it.fat,
      fiber: it.fiber,
      co2: it.co2 || 0,
      cost: it.cost || 0,
      portion_note: "",
      image: null,
      emoji: guessFoodEmoji(it.name),
    }));
    updateDay({ ...dayData, [flow.category]: [...entries, ...dayData[flow.category]] });
    entries.forEach(upsertFoodLibrary);
    closeFlow();
  }

  function openSearch() {
    setFlow((f) => ({
      ...f,
      step: "search",
      searchQuery: "",
      searchResults: null,
      searchLoading: false,
      selectedProducts: [],
    }));
  }

  function updateSearchQuery(value) {
    setFlow((f) => ({ ...f, searchQuery: value }));
  }

  async function runSearch() {
    setFlow((f) => {
      if (!f || !f.searchQuery || !f.searchQuery.trim()) return f;
      return { ...f, searchLoading: true };
    });
    const query = flow && flow.searchQuery;
    if (!query || !query.trim()) return;

    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        query
      )}&search_simple=1&action=process&json=1&page_size=20&lc=sv`;
      const res = await fetch(url);
      const data = await res.json();

      const products = (data.products || [])
        .filter((p) => p.product_name && p.nutriments)
        .map((p) => ({
          name: p.product_name,
          brand: p.brands ? p.brands.split(",")[0].trim() : "",
          image: p.image_small_url || p.image_url || null,
          kcalPer100: Math.round(p.nutriments["energy-kcal_100g"] || 0),
          proteinPer100: Math.round(p.nutriments["proteins_100g"] || 0),
          carbsPer100: Math.round(p.nutriments["carbohydrates_100g"] || 0),
          fatPer100: Math.round(p.nutriments["fat_100g"] || 0),
          fiberPer100: Math.round(p.nutriments["fiber_100g"] || 0),
          co2Per100: 0,
          costPer100: 0,
        }))
        .filter((p) => p.kcalPer100 > 0)
        .slice(0, 20);

      setFlow((f) => (f ? { ...f, searchLoading: false, searchResults: products } : f));
    } catch (e) {
      setFlow((f) => (f ? { ...f, searchLoading: false, searchResults: [] } : f));
    }
  }

  function toggleSearchSelection(product) {
    setFlow((f) => {
      const list = f.selectedProducts || [];
      const existing = list.find((sp) => sp.product.name === product.name && sp.product.brand === product.brand);
      if (existing) {
        return { ...f, selectedProducts: list.filter((sp) => sp !== existing) };
      }
      return { ...f, selectedProducts: [...list, { product, grams: "100" }] };
    });
  }

  function removeSearchSelection(index) {
    setFlow((f) => ({ ...f, selectedProducts: f.selectedProducts.filter((_, i) => i !== index) }));
  }

  function updateSelectionGrams(index, value) {
    setFlow((f) => {
      const next = [...f.selectedProducts];
      next[index] = { ...next[index], grams: value };
      return { ...f, selectedProducts: next };
    });
  }

  function combineNames(names) {
    if (names.length <= 1) return names[0] || "";
    return names.slice(0, -1).join(", ") + " med " + names[names.length - 1];
  }

  function goToSearchConfirm() {
    setFlow((f) => {
      const names = (f.selectedProducts || []).map((sp) => sp.product.name);
      return { ...f, step: "search-confirm", comboName: combineNames(names) };
    });
  }

  function updateComboName(value) {
    setFlow((f) => ({ ...f, comboName: value }));
  }

  function quickAddFromLibrary(libItem) {
    if (!flow) return;
    const entry = {
      id: Date.now(),
      name: libItem.name,
      kcal: libItem.kcal,
      protein: libItem.protein,
      carbs: libItem.carbs,
      fat: libItem.fat,
      fiber: libItem.fiber,
      co2: libItem.co2 || 0,
      cost: libItem.cost || 0,
      portion_note: "",
      image: null,
      emoji: libItem.emoji || guessFoodEmoji(libItem.name),
    };
    updateDay({ ...dayData, [flow.category]: [entry, ...dayData[flow.category]] });
    upsertFoodLibrary(entry);
    closeFlow();
  }

  function saveSearchSelection() {
    if (!flow || !flow.selectedProducts || flow.selectedProducts.length === 0) return;
    const totals = flow.selectedProducts.reduce(
      (acc, sp) => {
        const factor = (Number(sp.grams) || 0) / 100;
        acc.kcal += sp.product.kcalPer100 * factor;
        acc.protein += sp.product.proteinPer100 * factor;
        acc.carbs += sp.product.carbsPer100 * factor;
        acc.fat += sp.product.fatPer100 * factor;
        acc.fiber += sp.product.fiberPer100 * factor;
        acc.co2 += (sp.product.co2Per100 || 0) * factor;
        acc.cost += (sp.product.costPer100 || 0) * factor;
        return acc;
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, co2: 0, cost: 0 }
    );
    const name =
      (flow.comboName && flow.comboName.trim()) || combineNames(flow.selectedProducts.map((sp) => sp.product.name));

    const entry = {
      id: Date.now(),
      name,
      kcal: Math.round(totals.kcal),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
      fiber: Math.round(totals.fiber),
      co2: Math.round(totals.co2 * 100) / 100,
      cost: Math.round(totals.cost),
      portion_note: flow.selectedProducts.map((sp) => `${sp.grams || 0} g`).join(" + "),
      image: null,
      emoji: guessFoodEmoji(name),
    };

    updateDay({ ...dayData, [flow.category]: [entry, ...dayData[flow.category]] });
    upsertFoodLibrary(entry);
    closeFlow();
  }

  async function handleManualImage(e) {
    const file = e.target.files && e.target.files[0];
    if (!file || !flow) return;
    try {
      const compressed = await compressImage(file);
      updateDraft("image", compressed);
    } catch (err) {}
    if (manualImageInputRef.current) manualImageInputRef.current.value = "";
  }

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file || !flow) return;

    setFlow((f) => ({ ...f, step: "analyzing" }));

    try {
      const compressed = await compressImage(file);
      const base64Data = compressed.split(",")[1];

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system:
            "Du är en assistent som uppskattar näringsinnehåll, klimatavtryck och kostnad för mat från bilder. Svara ENDAST med giltig JSON, utan markdown-formatering, utan kodblock, utan inledning. Använd exakt denna form: {\"name\": string (kort maträttsnamn på svenska), \"portion_note\": string (kort kommentar om uppskattad portionsstorlek, på svenska), \"kcal\": number, \"protein_g\": number, \"carbs_g\": number, \"fat_g\": number, \"fiber_g\": number, \"co2_kg\": number (uppskattat klimatavtryck i kg CO2e för portionen, baserat på ingredienserna), \"cost_sek\": number (uppskattad kostnad i svenska kronor för portionen, baserat på ungefärliga svenska matvarupriser), \"confidence\": string (en av 'låg', 'medel', 'hög')}. Om bilden inte visar mat, svara med {\"error\": \"no_food_detected\"}.",
          text: "Analysera den här maträtten.",
          image: base64Data,
          mimeType: "image/jpeg",
        }),
      });

      const data = await response.json();
      const raw = data.text || "";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.error) {
        setFlow((f) => ({
          ...f,
          step: "error",
          errorMsg: "Kunde inte identifiera någon mat i bilden. Försök igen med bättre belysning, eller lägg in maträtten manuellt.",
        }));
        return;
      }

      setFlow((f) => ({
        ...f,
        step: "confirm",
        draft: {
          name: parsed.name || "",
          kcal: Math.round(parsed.kcal) || "",
          protein: Math.round(parsed.protein_g) || "",
          carbs: Math.round(parsed.carbs_g) || "",
          fat: Math.round(parsed.fat_g) || "",
          fiber: Math.round(parsed.fiber_g) || "",
          co2: parsed.co2_kg != null ? String(Math.round(parsed.co2_kg * 100) / 100) : "",
          cost: parsed.cost_sek != null ? String(Math.round(parsed.cost_sek)) : "",
          portion_note: parsed.portion_note || "",
          image: compressed,
        },
      }));
    } catch (err) {
      setFlow((f) => ({
        ...f,
        step: "error",
        errorMsg: "Något gick fel vid analysen. Försök igen, eller lägg in maträtten manuellt.",
      }));
    }
  }

  function updateDraft(field, value) {
    setFlow((f) => ({ ...f, draft: { ...f.draft, [field]: value } }));
  }

  function saveDraft() {
    if (!flow) return;
    const d = flow.draft;
    if (!d.name || d.kcal === "") return;

    const entry = {
      id: flow.editId || Date.now(),
      name: d.name,
      kcal: Number(d.kcal) || 0,
      protein: Number(d.protein) || 0,
      carbs: Number(d.carbs) || 0,
      fat: Number(d.fat) || 0,
      fiber: Number(d.fiber) || 0,
      co2: Number(d.co2) || 0,
      cost: Number(d.cost) || 0,
      portion_note: d.portion_note,
      image: d.image,
      emoji: d.image ? "" : d.emoji || guessFoodEmoji(d.name),
    };

    if (flow.editId) {
      updateDay({
        ...dayData,
        [flow.category]: dayData[flow.category].map((m) => (m.id === flow.editId ? entry : m)),
      });
    } else {
      updateDay({ ...dayData, [flow.category]: [entry, ...dayData[flow.category]] });
    }
    upsertFoodLibrary(entry);
    closeFlow();
  }

  function deleteEntry(categoryKey, id) {
    updateDay({ ...dayData, [categoryKey]: dayData[categoryKey].filter((m) => m.id !== id) });
  }

  function openExerciseMenu() {
    setExerciseFlow({ step: "menu" });
  }

  function closeExerciseFlow() {
    setExerciseFlow(null);
  }

  function selectExerciseType(type) {
    const defaultKm = type.key === "swim" ? "0.5" : type.key === "cycle" ? "10" : "5";
    setExerciseFlow({ step: "details", type, minutes: "30", km: defaultKm, steps: "2000", kcalManual: "" });
  }

  function openEditExercise(entry) {
    const type =
      EXERCISE_TYPES.find((t) => t.key === entry.typeKey) ||
      EXERCISE_TYPES.find((t) => t.label === entry.label) ||
      EXERCISE_TYPES[EXERCISE_TYPES.length - 1];
    setExerciseFlow({
      step: "details",
      type,
      editId: entry.id,
      minutes: entry.minutes != null ? String(entry.minutes) : "30",
      km: entry.km != null ? String(Number(entry.km.toFixed ? entry.km.toFixed(2) : entry.km)) : "5",
      steps: entry.steps != null ? String(entry.steps) : "2000",
      kcalManual: type.mode === "manual" ? String(entry.kcal) : "",
    });
  }

  function updateExerciseDraft(field, value) {
    setExerciseFlow((f) => ({ ...f, [field]: value }));
  }

  function saveExercise() {
    if (!exerciseFlow || !exerciseFlow.type) return;
    const weightKg = Number(profile?.weightKg) || DEFAULT_BODYWEIGHT_KG;
    let kcal;
    let stepsVal = 0;
    if (exerciseFlow.type.mode === "steps") {
      stepsVal = Number(exerciseFlow.steps) || 0;
      kcal = stepsToKcal(stepsVal, weightKg);
    } else if (exerciseFlow.type.mode === "distance") {
      const km = Number(exerciseFlow.km) || 0;
      kcal = Math.round(exerciseFlow.type.kcalPerKgPerKm * weightKg * km);
    } else if (exerciseFlow.type.mode === "time") {
      const minutes = Number(exerciseFlow.minutes) || 0;
      kcal = Math.round(exerciseFlow.type.met * weightKg * (minutes / 60));
    } else {
      kcal = Number(exerciseFlow.kcalManual) || 0;
    }
    if (!kcal) return;

    const entry = {
      id: exerciseFlow.editId || Date.now(),
      typeKey: exerciseFlow.type.key,
      label: exerciseFlow.type.label,
      icon: exerciseFlow.type.icon,
      minutes: exerciseFlow.type.mode === "time" ? Number(exerciseFlow.minutes) || 0 : null,
      km:
        exerciseFlow.type.mode === "distance"
          ? Number(exerciseFlow.km) || 0
          : exerciseFlow.type.mode === "steps"
          ? stepsVal / STEPS_PER_KM
          : null,
      steps: exerciseFlow.type.mode === "steps" ? stepsVal : null,
      kcal,
    };

    if (exerciseFlow.editId) {
      updateDay({
        ...dayData,
        exercise: (dayData.exercise || []).map((e) => (e.id === exerciseFlow.editId ? entry : e)),
      });
    } else {
      updateDay({ ...dayData, exercise: [entry, ...(dayData.exercise || [])] });
    }
    closeExerciseFlow();
  }

  function deleteExercise(id) {
    updateDay({ ...dayData, exercise: (dayData.exercise || []).filter((e) => e.id !== id) });
  }

  function triggerScannerCamera() {
    if (scannerFileInputRef.current) scannerFileInputRef.current.click();
  }

  function closeScannerFlow() {
    setScannerFlow(null);
    if (scannerFileInputRef.current) scannerFileInputRef.current.value = "";
  }

  async function handleScannerFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setScannerFlow({ step: "analyzing", image: null, ingredients: [], suggestions: [] });

    try {
      const compressed = await compressImage(file);
      const base64Data = compressed.split(",")[1];

      const mealLabel = CATEGORIES.find((c) => c.key === scannerCategory)?.label || "middag";
      let budgetLine = "Användarens dagliga kalorimål är inte inställt, ge därför måttliga, balanserade förslag.";
      if (goals) {
        const remKcal = Math.max(0, goals.kcalGoal - consumed.kcal);
        const remProtein = Math.max(0, goals.proteinGoal - consumed.protein);
        const remCarbs = Math.max(0, goals.carbsGoal - consumed.carbs);
        const remFat = Math.max(0, goals.fatGoal - consumed.fat);
        budgetLine = `Användaren har ungefär ${remKcal} kcal kvar av sitt dagsmål, samt ca ${remProtein}g protein, ${remCarbs}g kolhydrater och ${remFat}g fett kvar. Föreslå måltider som passar väl in i detta.`;
      }

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system:
            `Du är en assistent som hjälper användare att komma på måltidsförslag utifrån vad de har hemma i kylskåp eller skafferi. Titta på bilden och identifiera synliga råvaror. Föreslå sedan 2-3 olika förslag på "${mealLabel}" som huvudsakligen använder dessa råvaror. ${budgetLine} Svara ENDAST med giltig JSON, utan markdown-formatering, utan kodblock, utan inledande text, i denna form: {"ingredients": [string, ...], "suggestions": [{"name": string, "description": string (kort, en till två meningar, på svenska), "kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number, "fiber_g": number}]}. Om bilden inte visar mat, ett kylskåp eller ett skafferi, svara med {"error": "no_food_detected"}.`,
          text: `Vad kan jag laga till ${mealLabel.toLowerCase()} med det som syns här?`,
          image: base64Data,
          mimeType: "image/jpeg",
        }),
      });

      const data = await response.json();
      const raw = data.text || "";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.error) {
        setScannerFlow({
          step: "error",
          errorMsg: "Kunde inte identifiera några matvaror i bilden. Försök igen med bättre belysning eller en tydligare vy.",
        });
        return;
      }

      setScannerFlow({
        step: "results",
        image: compressed,
        ingredients: parsed.ingredients || [],
        suggestions: parsed.suggestions || [],
        addedIds: {},
      });
    } catch (err) {
      setScannerFlow({
        step: "error",
        errorMsg: "Något gick fel vid analysen. Försök igen.",
      });
    }
  }

  function addScannerSuggestion(suggestion, index) {
    const entry = {
      id: Date.now(),
      name: suggestion.name,
      kcal: Math.round(suggestion.kcal) || 0,
      protein: Math.round(suggestion.protein_g) || 0,
      carbs: Math.round(suggestion.carbs_g) || 0,
      fat: Math.round(suggestion.fat_g) || 0,
      fiber: Math.round(suggestion.fiber_g) || 0,
      portion_note: suggestion.description || "",
      image: null,
      emoji: guessFoodEmoji(suggestion.name),
    };
    updateDay({ ...dayData, [scannerCategory]: [entry, ...dayData[scannerCategory]] });
    upsertFoodLibrary(entry);
    setScannerFlow((f) => (f ? { ...f, addedIds: { ...f.addedIds, [index]: true } } : f));
  }

  async function loadReactiveSuggestions() {
    if (!reactiveBurn) return;
    setReactiveSuggestFlow({ step: "loading", suggestions: [], addedIds: {} });
    const targetKcal = Math.max(150, Math.min(500, Math.round(reactiveBurn.surplus / 2)));

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system:
            `Du är en assistent som föreslår mellanmål. Föreslå 3 olika, varierade mellanmål på svenska som ligger nära ${targetKcal} kcal styck. Svara ENDAST med giltig JSON, utan markdown-formatering, utan kodblock, utan inledande text, i denna form: [{"name": string, "description": string (kort, en mening), "kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number, "fiber_g": number}]`,
          text: `Ge mig 3 mellanmålsförslag på ca ${targetKcal} kcal.`,
          image: null,
        }),
      });
      const data = await response.json();
      const raw = data.text || "";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setReactiveSuggestFlow({ step: "results", suggestions: Array.isArray(parsed) ? parsed : [], addedIds: {} });
    } catch (e) {
      setReactiveSuggestFlow({ step: "error", suggestions: [], addedIds: {} });
    }
  }

  function addReactiveSuggestion(suggestion, index) {
    const entry = {
      id: Date.now(),
      name: suggestion.name,
      kcal: Math.round(suggestion.kcal) || 0,
      protein: Math.round(suggestion.protein_g) || 0,
      carbs: Math.round(suggestion.carbs_g) || 0,
      fat: Math.round(suggestion.fat_g) || 0,
      fiber: Math.round(suggestion.fiber_g) || 0,
      portion_note: suggestion.description || "",
      image: null,
      emoji: guessFoodEmoji(suggestion.name),
    };
    updateDay({ ...dayData, snack: [entry, ...dayData.snack] });
    upsertFoodLibrary(entry);
    setReactiveSuggestFlow((f) => (f ? { ...f, addedIds: { ...f.addedIds, [index]: true } } : f));
  }

  const draftValid = flow && flow.draft.name.trim() !== "" && flow.draft.kcal !== "";
  const livePreview = computeGoals(profileDraft);
  const effectiveKcalGoal = weeklyCalc && weeklyCalc.adjustedGoal ? weeklyCalc.adjustedGoal : goals ? goals.kcalGoal : 0;
  const remaining = goals ? effectiveKcalGoal - consumed.kcal : 0;
  const remainingFraction = goals && effectiveKcalGoal ? Math.max(0, remaining) / effectiveKcalGoal : 0;
  const consumedFraction = goals && effectiveKcalGoal ? consumed.kcal / effectiveKcalGoal : 0;
  const budgetZone = consumedFraction <= 0.5 ? "green" : consumedFraction < 1.0 ? "amber" : "red";
  const zoneColor = budgetZone === "green" ? colors.carbs : budgetZone === "amber" ? colors.fat : colors.coral;
  const zoneText =
    budgetZone === "green" ? "Bra flyt idag 🌿" : budgetZone === "amber" ? "Nästan vid målet ⚡" : "Över idag — helt okej 💜";

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center"
      style={{ backgroundColor: colors.bg, color: colors.text, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
    >
      <div className="w-full max-w-md flex flex-col min-h-screen pb-10">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 flex items-center justify-between gap-3">
          <span className="text-base font-extrabold truncate" style={{ letterSpacing: "-0.02em" }}>
            Calio Bite
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={openCalendarPicker}
              className="flex items-center gap-1 text-sm font-semibold"
              style={{ color: colors.textDim }}
            >
              {dateLabel(selectedDate)}
              <span style={{ fontSize: 10 }}>▾</span>
            </button>
            <span className="text-[10px]" style={{ color: colors.textDim, opacity: 0.6 }}>
              v0.0.0.1
            </span>
          </div>
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            max={todayKey}
            onChange={(e) => e.target.value && goToDate(e.target.value)}
            className="w-0 h-0 opacity-0 absolute"
            tabIndex={-1}
          />
        </div>

        {/* Tabs */}
        <div className="px-5 mb-5">
          <div className="flex gap-1 p-1 rounded-full" style={{ backgroundColor: colors.surfaceMuted }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="flex-1 rounded-full py-2 text-xs font-bold"
                style={{
                  backgroundColor: activeTab === t.key ? colors.surface : "transparent",
                  color: activeTab === t.key ? colors.text : colors.textDim,
                  boxShadow: activeTab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "budget" && (
          <>
        <div className="px-5">
          <InfoBanner>
            Detta är din dagliga översikt. Bläddra mellan dagar med veckoremsan, se hur mycket kalorier och makron du har
            kvar, och tryck på <strong>+</strong> vid en måltid för att logga vad du ätit.
          </InfoBanner>
        </div>
        {/* Week strip */}
        <div className="px-5 flex items-center gap-1.5 mb-6">
          <button
            onClick={() => goToDate(shiftDateKey(selectedDate, -7))}
            aria-label="Föregående vecka"
            className="w-5 h-12 flex items-center justify-center text-sm flex-shrink-0"
            style={{ color: colors.textDim }}
          >
            ‹
          </button>
          <div className="flex-1 flex justify-between">
            {weekDates.map((dt, i) => {
              const key = dateKey(dt);
              const isSelected = key === selectedDate;
              const isToday = key === todayKey;
              const isFuture = key > todayKey;
              return (
                <button
                  key={key}
                  onClick={() => !isFuture && goToDate(key)}
                  disabled={isFuture}
                  className="w-11 h-11 rounded-full flex flex-col items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isSelected ? colors.primary : "transparent",
                    border: isFuture
                      ? `1px dashed ${colors.hairline}`
                      : isSelected
                      ? `1px solid ${colors.primary}`
                      : isToday
                      ? `2px solid ${colors.primary}`
                      : `1px solid ${colors.hairline}`,
                    opacity: isFuture ? 0.45 : 1,
                  }}
                >
                  <span
                    className="text-[9px] font-bold leading-none"
                    style={{ color: isSelected ? colors.surface : isToday ? colors.primary : colors.textDim }}
                  >
                    {DAY_LETTERS[i]}
                  </span>
                  <span
                    className="text-xs font-bold leading-none mt-0.5"
                    style={{ color: isSelected ? colors.surface : isToday ? colors.primary : colors.text }}
                  >
                    {dt.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => goToDate(shiftDateKey(selectedDate, 7))}
            aria-label="Nästa vecka"
            className="w-5 h-12 flex items-center justify-center text-sm flex-shrink-0"
            style={{ color: colors.textDim }}
          >
            ›
          </button>
        </div>

        {fasting.isFasting && (
          <div className="px-5 mb-5">
            <div
              className="rounded-xl py-3 text-center"
              style={{ backgroundColor: colors.primaryLight }}
            >
              <span className="text-sm font-bold" style={{ color: colors.primary }}>
                🕐 Du fastar · Återstår {formatHoursMinutes(Math.max(0, fasting.fastHours * 3600 - (nowTick - new Date(fasting.startTime).getTime()) / 1000))}
              </span>
            </div>
          </div>
        )}

        {reactiveBurn && reactiveBurn.meaningful && !reactiveDismissed && (
          <div className="px-5 mb-5">
            <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: colors.primaryLight }}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm" style={{ color: colors.text }}>
                  <span className="font-bold">Bra jobbat! 🔥</span> Du har bränt {reactiveBurn.surplus} kcal mer än vanligt
                  idag. Det ger marginal för ett större mellanmål.
                </p>
                <button
                  onClick={() => setReactiveDismissed(true)}
                  aria-label="Stäng"
                  className="flex-shrink-0 text-sm"
                  style={{ color: colors.textDim }}
                >
                  ×
                </button>
              </div>
              <button
                onClick={loadReactiveSuggestions}
                className="text-xs font-bold mt-2"
                style={{ color: colors.primary }}
              >
                Visa förslag →
              </button>
            </div>
          </div>
        )}

        {/* Budget */}
        {!dayLoading && !profileLoading && (
          <div className="px-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-extrabold">Dagens mål</h2>
              <div className="flex items-center gap-3">
                <button onClick={toggleVisualMode} className="text-xs font-semibold" style={{ color: colors.primary }}>
                  {visualMode ? "🔢 Visa siffror" : "🌿 Sifferfritt läge"}
                </button>
                <button onClick={openProfile} className="text-xs font-semibold" style={{ color: colors.primary }}>
                  ✎ Redigera
                </button>
              </div>
            </div>

            {!goals ? (
              <div
                className="rounded-2xl px-4 py-6 text-center"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}
              >
                <p className="text-sm mb-3" style={{ color: colors.textDim }}>
                  Lägg in vikt och längd för att räkna ut ditt dagliga kalorimål
                </p>
                <button
                  onClick={openProfile}
                  className="rounded-full px-5 py-2.5 text-sm font-bold"
                  style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
                >
                  Ställ in mål
                </button>
              </div>
            ) : (
              <div
                className="rounded-2xl px-5 py-6"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}
              >
                <p className="text-xs font-bold text-center mb-2" style={{ color: colors.primary, letterSpacing: "0.02em" }}>
                  DAGLIG SAMMANFATTNING
                </p>

                {visualMode ? (
                  <>
                    <div className="flex justify-center py-2">
                      <SemiGauge size={196} stroke={14} baseColor={colors.surfaceMuted} overlayColor={zoneColor} fraction={consumedFraction}>
                        <HeartIcon fraction={consumedFraction} size={56} />
                      </SemiGauge>
                    </div>
                    <p className="text-base font-bold text-center mt-2" style={{ color: zoneColor }}>
                      {zoneText}
                    </p>
                    <p className="text-xs text-center mt-1" style={{ color: colors.textDim }}>
                      Så länge du är i den gröna zonen är allt bra — inga siffror att fixera vid idag.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col items-start pb-2">
                        <span className="text-lg font-extrabold">{consumed.kcal}</span>
                        <span className="text-[10px] font-medium" style={{ color: colors.textDim }}>
                          kcal
                        </span>
                        <span className="text-[10px] mt-1" style={{ color: colors.textDim }}>
                          Konsumerat
                        </span>
                      </div>

                      <SemiGauge
                        size={196}
                        stroke={14}
                        baseColor={colors.surfaceMuted}
                        overlayColor={colors.primary}
                        fraction={consumedFraction}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-extrabold leading-tight">{Math.max(0, remaining)}</span>
                          <span className="text-[10px] font-medium" style={{ color: colors.textDim }}>
                            {consumed.kcal > goals.kcalGoal ? "kcal över" : "kcal kvar"}
                          </span>
                        </div>
                      </SemiGauge>

                      <div className="flex flex-col items-end pb-2">
                        <span className="text-lg font-extrabold">{burnedToday}</span>
                        <span className="text-[10px] font-medium" style={{ color: colors.textDim }}>
                          kcal
                        </span>
                        <span className="text-[10px] mt-1" style={{ color: colors.textDim }}>
                          Bränt
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-center -mt-1 mb-1" style={{ color: colors.textDim }}>
                      {weeklyCalc && weeklyCalc.adjustedGoal !== goals.kcalGoal ? (
                        <>
                          Mål idag {effectiveKcalGoal} kcal{" "}
                          <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{goals.kcalGoal}</span>
                        </>
                      ) : (
                        <>Mål {goals.kcalGoal} kcal</>
                      )}
                    </p>

                    {weeklyCalc && Math.abs(weeklyCalc.pastSurplus) >= 50 && (
                      <div className="rounded-xl px-4 py-3 mt-3 mb-1" style={{ backgroundColor: colors.surfaceMuted }}>
                        <p className="text-xs" style={{ color: colors.textDim }}>
                          {weeklyCalc.pastSurplus > 0 ? (
                            <>
                              Du låg <span className="font-bold" style={{ color: colors.text }}>{weeklyCalc.pastSurplus} kcal</span>{" "}
                              över tidigare i veckan. Vi jämnar ut det med ett något lägre mål de {weeklyCalc.remainingDaysCount} dagar
                              som är kvar.
                            </>
                          ) : (
                            <>
                              Du låg{" "}
                              <span className="font-bold" style={{ color: colors.text }}>
                                {Math.abs(weeklyCalc.pastSurplus)} kcal
                              </span>{" "}
                              under tidigare i veckan. Du har lite extra utrymme idag utan att tappa veckomålet.
                            </>
                          )}{" "}
                          <button onClick={toggleFlexibleBudget} className="font-semibold underline" style={{ color: colors.primary }}>
                            Stäng av
                          </button>
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-5 flex flex-col gap-3.5">
                  <MacroBar label="Kolhydrater" color={MACRO_BAR_COLORS.carbs} value={consumed.carbs} goal={goals.carbsGoal} hideNumbers={visualMode} />
                  <MacroBar label="Protein" color={MACRO_BAR_COLORS.protein} value={consumed.protein} goal={goals.proteinGoal} hideNumbers={visualMode} />
                  <MacroBar label="Fett" color={MACRO_BAR_COLORS.fat} value={consumed.fat} goal={goals.fatGoal} hideNumbers={visualMode} />
                  <MacroBar label="Fiber" color={MACRO_BAR_COLORS.fiber} value={consumed.fiber} goal={goals.fiberGoal} hideNumbers={visualMode} />
                </div>

                {!visualMode && (consumed.co2 > 0 || consumed.cost > 0) && (
                  <div
                    className="flex items-center justify-around mt-5 pt-4"
                    style={{ borderTop: `1px solid ${colors.hairline}` }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontSize: 16 }}>🌍</span>
                        <span className="text-lg font-extrabold">{Math.round(consumed.co2 * 100) / 100}</span>
                      </div>
                      <span className="text-[10px] mt-0.5" style={{ color: colors.textDim }}>
                        kg CO2e idag
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontSize: 16 }}>💰</span>
                        <span className="text-lg font-extrabold">{Math.round(consumed.cost)}</span>
                      </div>
                      <span className="text-[10px] mt-0.5" style={{ color: colors.textDim }}>
                        kr på mat idag
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!dayLoading && (
          <div className="px-5 mt-5">
            {/* Water tracker */}
            <div
              className="rounded-2xl px-4 py-4"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-baseline gap-2">
                  <span style={{ color: colors.water }}>●</span>
                  <h3 className="text-sm font-bold">Vatten</h3>
                </div>

                {editingGoal ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={goalDraft}
                      onChange={(e) => setGoalDraft(e.target.value.replace(/[^0-9]/g, ""))}
                      inputMode="numeric"
                      className="w-16 rounded-lg px-2 py-1 text-xs text-right"
                      style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                    />
                    <span className="text-xs" style={{ color: colors.textDim }}>
                      ml
                    </span>
                    <button onClick={saveWaterGoal} className="text-xs font-bold" style={{ color: colors.primary }}>
                      Spara
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setGoalDraft(String(waterGoal));
                      setEditingGoal(true);
                    }}
                    className="text-xs"
                    style={{ color: colors.textDim }}
                  >
                    {waterTotal} / {waterGoal} ml
                  </button>
                )}
              </div>

              <div className="w-full h-2 rounded-full overflow-hidden mb-4" style={{ backgroundColor: colors.surfaceMuted }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${waterPercent}%`, backgroundColor: colors.water, transition: "width 0.3s ease" }}
                />
              </div>

              <div className="flex items-center gap-2">
                {WATER_QUICK_ADDS.map((ml) => (
                  <button
                    key={ml}
                    onClick={() => addWater(ml)}
                    className="flex-1 rounded-lg py-2.5 text-xs font-bold"
                    style={{ backgroundColor: colors.surfaceMuted, color: colors.water }}
                  >
                    +{ml} ml
                  </button>
                ))}
                {waterEntries.length > 0 && (
                  <button
                    onClick={undoLastWater}
                    aria-label="Ångra senaste"
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ border: `1px solid ${colors.hairline}`, color: colors.textDim }}
                  >
                    ↺
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="px-5 mt-2">
          {!dayLoading && goals && (
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-extrabold">Måltider</h2>
              <button onClick={openCategorySplit} className="text-xs font-semibold" style={{ color: colors.primary }}>
                Ändra fördelning
              </button>
            </div>
          )}
          {dayLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div
                className="w-8 h-8 rounded-full animate-spin"
                style={{ border: `3px solid ${colors.hairline}`, borderTopColor: colors.primary }}
              />
              <p className="text-sm" style={{ color: colors.textDim }}>
                Hämtar loggen …
              </p>
            </div>
          ) : (
            CATEGORIES.map((cat) => {
              const items = dayData[cat.key];
              const catTotal = items.reduce((s, m) => s + m.kcal, 0);
              const categoryBudget = getCategoryBudget(cat.key);
              const catFraction = categoryBudget ? Math.min(1, catTotal / categoryBudget) : 0;
              const overBudget = categoryBudget && catTotal > categoryBudget;
              return (
                <div key={cat.key} className="mt-6">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-sm font-bold">{cat.label}</h3>
                      {!visualMode &&
                        (categoryBudget ? (
                          <span
                            className="text-xs font-medium"
                            style={{ color: overBudget ? "#E0554B" : colors.textDim }}
                          >
                            {catTotal} / {categoryBudget} kcal
                          </span>
                        ) : (
                          items.length > 0 && (
                            <span className="text-xs" style={{ color: colors.textDim }}>
                              {catTotal} kcal
                            </span>
                          )
                        ))}
                    </div>
                    <button
                      onClick={() => openCategory(cat.key)}
                      aria-label={`Lägg till i ${cat.label}`}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
                    >
                      +
                    </button>
                  </div>

                  {categoryBudget > 0 && (
                    <div className="w-full h-1 rounded-full overflow-hidden mb-3" style={{ backgroundColor: colors.surfaceMuted }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round(catFraction * 100)}%`,
                          backgroundColor: overBudget ? "#E0554B" : colors.primary,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  )}

                  {items.length === 0 ? (
                    <div
                      className="rounded-2xl py-4 text-center text-sm"
                      style={{ backgroundColor: colors.surface, color: colors.textDim, border: `1px solid ${colors.hairline}` }}
                    >
                      Inget tillagt än
                    </div>
                  ) : (
                    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${colors.hairline}` }}>
                      {items.map((item, i) => (
                        <button
                          key={item.id}
                          onClick={() => openEditEntry(cat.key, item)}
                          className="w-full flex items-center gap-3 px-3 py-3 text-left"
                          style={{
                            backgroundColor: colors.surface,
                            borderTop: i === 0 ? "none" : `1px solid ${colors.hairline}`,
                          }}
                        >
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div
                              className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center"
                              style={{ backgroundColor: colors.surfaceMuted }}
                            >
                              <span style={{ fontSize: 24 }}>{item.emoji || "🍽️"}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate mb-1">{item.name}</p>
                            <div className="flex items-center gap-1.5 mb-1">
                              {visualMode ? (
                                <HeartIcon
                                  fraction={
                                    categoryBudget
                                      ? item.kcal / categoryBudget
                                      : item.kcal / 600
                                  }
                                />
                              ) : (
                                <>
                                  <span style={{ fontSize: 11 }}>🔥</span>
                                  <span className="text-sm font-extrabold" style={{ color: colors.primary }}>
                                    {item.kcal} kcal
                                  </span>
                                </>
                              )}
                            </div>
                            {!visualMode && (
                              <p className="text-[11px]" style={{ color: colors.textDim }}>
                                P {item.protein}g · K {item.carbs}g · F {item.fat}g · Fi {item.fiber || 0}g
                              </p>
                            )}
                            {!visualMode && (item.co2 > 0 || item.cost > 0) && (
                              <p className="text-[11px] mt-0.5" style={{ color: colors.textDim }}>
                                {item.co2 > 0 && <>🌍 {item.co2} kg CO2e</>}
                                {item.co2 > 0 && item.cost > 0 && " · "}
                                {item.cost > 0 && <>💰 {item.cost} kr</>}
                              </p>
                            )}
                          </div>
                          <span
                            onClick={(ev) => {
                              ev.stopPropagation();
                              shareMeal(item);
                            }}
                            role="button"
                            aria-label="Dela måltid"
                            className="flex-shrink-0 text-sm px-1 self-start"
                            style={{ color: colors.textDim }}
                          >
                            🤝
                          </span>
                          <span
                            onClick={(ev) => {
                              ev.stopPropagation();
                              deleteEntry(cat.key, item.id);
                            }}
                            role="button"
                            aria-label="Ta bort"
                            className="flex-shrink-0 text-sm px-1 self-start"
                            style={{ color: colors.textDim }}
                          >
                            ×
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
          </>
        )}

        {activeTab === "trends" && (
          <TrendsPanel
            data={trendsData}
            loading={trendsLoading}
            goals={goals}
            metric={trendsMetric}
            onMetricChange={setTrendsMetric}
            selectedDay={trendsSelectedDay}
            onSelectDay={setTrendsSelectedDay}
            todayKey={todayKey}
          />
        )}

        {activeTab === "weight" && (
          <WeightPanel
            log={weightLog}
            loading={weightLogLoading}
            draft={weightDraft}
            onDraftChange={setWeightDraft}
            onAdd={addWeightEntry}
            onDelete={deleteWeightEntry}
            todayKey={todayKey}
            profile={profile}
          />
        )}

        {activeTab === "legal" && <LegalPanel />}

        {activeTab === "scanner" && (
          <ScannerPanel
            category={scannerCategory}
            onCategoryChange={setScannerCategory}
            flow={scannerFlow}
            onTriggerCamera={triggerScannerCamera}
            onClose={closeScannerFlow}
            onAddSuggestion={addScannerSuggestion}
            goals={goals}
            consumed={consumed}
          />
        )}

        {activeTab === "training" && (
          <TrainingPanel
            key={selectedDate}
            dayData={dayData}
            dayLoading={dayLoading}
            selectedDate={selectedDate}
            profile={profile}
            flow={exerciseFlow}
            onOpenMenu={openExerciseMenu}
            onClose={closeExerciseFlow}
            onSelectType={selectExerciseType}
            onUpdateDraft={updateExerciseDraft}
            onSave={saveExercise}
            onDelete={deleteExercise}
            onEdit={openEditExercise}
            stepGoal={stepGoal}
            onSaveStepGoal={saveStepGoal}
          />
        )}

        {activeTab === "fasting" && (
          <FastingPanel
            fasting={fasting}
            loaded={fastingLoaded}
            nowTick={nowTick}
            onStart={startFast}
            onEnd={endFast}
            methodOpen={fastingMethodOpen}
            onOpenMethod={() => setFastingMethodOpen(true)}
            onCloseMethod={() => setFastingMethodOpen(false)}
            onChooseMethod={chooseFastingMethod}
            editingStart={editingFastStart}
            onOpenEditStart={openEditFastStart}
            onCancelEditStart={() => setEditingFastStart(false)}
            startDraft={fastStartDraft}
            onStartDraftChange={setFastStartDraft}
            onSaveStart={saveFastStart}
            customHours={customFastHours}
            onCustomHoursChange={setCustomFastHours}
            onApplyCustomHours={() => applyCustomFastHours(customFastHours)}
          />
        )}
      </div>

      {/* Meal entry overlay */}
      {flow && (
        <div
          className="fixed inset-0 flex items-end justify-center z-50"
          style={{ backgroundColor: "rgba(15, 17, 21, 0.45)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget && flow.step === "menu") closeFlow();
          }}
        >
          <div
            className="w-full max-w-md rounded-t-2xl px-5 pt-5"
            style={{ backgroundColor: colors.surface, maxHeight: "88vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">
                {flow.editId ? "Redigera – " : ""}
                {CATEGORIES.find((c) => c.key === flow.category)?.label}
                <span className="text-xs font-normal ml-2" style={{ color: colors.textDim }}>
                  {dateLabel(selectedDate)}
                </span>
              </h3>
              <button onClick={closeFlow} className="text-lg" style={{ color: colors.textDim }} aria-label="Stäng">
                ×
              </button>
            </div>

            {flow.step === "menu" && (
              <div className="flex flex-col gap-2 pb-6">
                <button
                  onClick={triggerCamera}
                  className="w-full rounded-xl py-4 text-sm font-bold"
                  style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
                >
                  Fota maträtt
                </button>
                <button
                  onClick={openSearch}
                  className="w-full rounded-xl py-4 text-sm font-medium"
                  style={{ border: `1px solid ${colors.hairline}`, color: colors.text }}
                >
                  🔍 Sök livsmedel
                </button>
                <button
                  onClick={openVoiceEntry}
                  className="w-full rounded-xl py-4 text-sm font-medium"
                  style={{ border: `1px solid ${colors.hairline}`, color: colors.text }}
                >
                  🎙️ Beskriv med ord
                </button>
                <button
                  onClick={openReceiveMeal}
                  className="w-full rounded-xl py-4 text-sm font-medium"
                  style={{ border: `1px solid ${colors.hairline}`, color: colors.text }}
                >
                  🤝 Hämta delad måltid
                </button>
                <button
                  onClick={openManual}
                  className="w-full rounded-xl py-4 text-sm font-medium"
                  style={{ border: `1px solid ${colors.hairline}`, color: colors.text }}
                >
                  Lägg till manuellt
                </button>
              </div>
            )}

            {flow.step === "receive" && (
              <div className="pb-6">
                <p className="text-xs mb-4" style={{ color: colors.textDim }}>
                  Be din vän om koden de fick när de delade måltiden, och skriv in den här.
                </p>
                <input
                  autoFocus
                  value={flow.receiveCode}
                  onChange={(e) => updateReceiveCode(e.target.value)}
                  placeholder="T.ex. A7K2M"
                  className="w-full rounded-lg px-3 py-3 text-center text-lg font-bold tracking-widest mb-3"
                  style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                />
                {flow.receiveError && (
                  <p className="text-xs mb-3" style={{ color: colors.coral }}>
                    Hittade ingen måltid med den koden. Kolla att den stämmer, eller be din vän dela igen.
                  </p>
                )}
                <button
                  onClick={fetchSharedMeal}
                  disabled={!flow.receiveCode || !flow.receiveCode.trim() || flow.receiveLoading}
                  className="w-full rounded-xl py-3.5 text-sm font-bold"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.onPrimary,
                    opacity: !flow.receiveCode || !flow.receiveCode.trim() ? 0.5 : 1,
                  }}
                >
                  {flow.receiveLoading ? "Hämtar …" : "Hämta måltid"}
                </button>
              </div>
            )}

            {flow.step === "voice" && (
              <div className="pb-6">
                <p className="text-xs mb-3" style={{ color: colors.textDim }}>
                  Beskriv vad du åt med egna ord — tryck gärna på mikrofonen i din tangentbord för att diktera istället för att
                  skriva.
                </p>
                <textarea
                  autoFocus
                  value={flow.voiceText}
                  onChange={(e) => updateVoiceText(e.target.value)}
                  placeholder='T.ex. "Åt en skål havregrynsgröt med en banan och en skvätt lättmjölk"'
                  rows={4}
                  className="w-full rounded-lg px-3 py-2.5 text-sm mb-4"
                  style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                />
                <button
                  onClick={runVoiceParse}
                  disabled={!flow.voiceText || !flow.voiceText.trim() || flow.voiceLoading}
                  className="w-full rounded-xl py-3.5 text-sm font-bold"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.onPrimary,
                    opacity: !flow.voiceText || !flow.voiceText.trim() ? 0.5 : 1,
                  }}
                >
                  {flow.voiceLoading ? "Analyserar …" : "Analysera"}
                </button>
              </div>
            )}

            {flow.step === "voice-results" && (
              <div className="pb-6">
                {flow.voiceError && (
                  <p className="text-sm mb-4" style={{ color: colors.textDim }}>
                    Något gick fel vid tolkningen. Försök igen, eller lägg till manuellt.
                  </p>
                )}
                {!flow.voiceError && flow.voiceItems && flow.voiceItems.length === 0 && (
                  <p className="text-sm mb-4" style={{ color: colors.textDim }}>
                    Kunde inte tolka någon mat ur texten. Försök beskriva det lite tydligare.
                  </p>
                )}
                {flow.voiceItems && flow.voiceItems.length > 0 && (
                  <>
                    <p className="text-xs font-bold mb-3" style={{ color: colors.textDim }}>
                      Vi tolkade det här — ta bort något som blev fel innan du lägger till
                    </p>
                    <div className="flex flex-col gap-2 mb-5">
                      {flow.voiceItems.map((it) => (
                        <div
                          key={it.tempId}
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                          style={{ backgroundColor: colors.surfaceMuted }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{it.name}</p>
                            <p className="text-xs" style={{ color: colors.textDim }}>
                              {it.kcal} kcal · P {it.protein}g · K {it.carbs}g · F {it.fat}g
                            </p>
                          </div>
                          <button
                            onClick={() => removeVoiceItem(it.tempId)}
                            aria-label="Ta bort"
                            className="flex-shrink-0 text-sm px-1"
                            style={{ color: colors.textDim }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={saveVoiceItems}
                    disabled={!flow.voiceItems || flow.voiceItems.length === 0}
                    className="w-full rounded-xl py-3.5 text-sm font-bold"
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.onPrimary,
                      opacity: !flow.voiceItems || flow.voiceItems.length === 0 ? 0.5 : 1,
                    }}
                  >
                    Lägg till {flow.voiceItems ? flow.voiceItems.length : 0} livsmedel
                  </button>
                  <button onClick={openVoiceEntry} className="text-xs font-semibold" style={{ color: colors.primary }}>
                    Försök igen
                  </button>
                </div>
              </div>
            )}

            {flow.step === "search" && (
              <div className="pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    autoFocus
                    value={flow.searchQuery}
                    onChange={(e) => updateSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runSearch()}
                    placeholder="T.ex. köttbullar, potatissallad …"
                    className="flex-1 rounded-lg px-3 py-2.5 text-sm"
                    style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                  />
                  <button
                    onClick={runSearch}
                    className="rounded-lg px-4 py-2.5 text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
                  >
                    Sök
                  </button>
                </div>

                {flow.selectedProducts && flow.selectedProducts.length > 0 && (
                  <p className="text-xs mb-3" style={{ color: colors.textDim }}>
                    {flow.selectedProducts.length} valda — sök gärna på fler rätter att lägga till i samma måltid
                  </p>
                )}

                {(() => {
                  const q = (flow.searchQuery || "").trim().toLowerCase();
                  const libraryMatches = foodLibrary
                    .filter((f) => !q || f.name.toLowerCase().includes(q))
                    .slice(0, 6);
                  if (libraryMatches.length === 0) return null;
                  return (
                    <div className="mb-5">
                      <p className="text-xs font-bold mb-2" style={{ color: colors.textDim }}>
                        {q ? "Mina livsmedel" : "Dina senaste"}
                      </p>
                      <div className="flex flex-col gap-2">
                        {libraryMatches.map((f) => (
                          <button
                            key={f.key}
                            onClick={() => quickAddFromLibrary(f)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                            style={{ backgroundColor: colors.surfaceMuted }}
                          >
                            <span style={{ fontSize: 20 }} className="flex-shrink-0">
                              {f.emoji || "🍽️"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{f.name}</p>
                              <p className="text-xs" style={{ color: colors.textDim }}>
                                {f.kcal} kcal · P {f.protein}g · K {f.carbs}g · F {f.fat}g
                              </p>
                            </div>
                            <span className="text-lg font-bold flex-shrink-0" style={{ color: colors.primary }}>
                              +
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs font-bold mt-4 mb-2" style={{ color: colors.textDim }}>
                        Eller sök på nätet
                      </p>
                    </div>
                  );
                })()}

                {flow.searchLoading && (
                  <div className="flex flex-col items-center justify-center gap-3 py-10">
                    <div
                      className="w-8 h-8 rounded-full animate-spin"
                      style={{ border: `3px solid ${colors.hairline}`, borderTopColor: colors.primary }}
                    />
                  </div>
                )}

                {!flow.searchLoading && flow.searchResults && flow.searchResults.length === 0 && (
                  <p className="text-sm text-center py-6" style={{ color: colors.textDim }}>
                    Inga träffar. Prova ett annat sökord, eller lägg till maträtten manuellt.
                  </p>
                )}

                {!flow.searchLoading && flow.searchResults && flow.searchResults.length > 0 && (
                  <div className="flex flex-col gap-2 mb-2" style={{ maxHeight: "40vh", overflowY: "auto" }}>
                    {flow.searchResults.map((p, i) => {
                      const isSelected = (flow.selectedProducts || []).some(
                        (sp) => sp.product.name === p.name && sp.product.brand === p.brand
                      );
                      return (
                        <button
                          key={i}
                          onClick={() => toggleSearchSelection(p)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                          style={{
                            backgroundColor: isSelected ? colors.primaryLight : colors.surfaceMuted,
                            border: `1px solid ${isSelected ? colors.primary : "transparent"}`,
                          }}
                        >
                          <div
                            className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor: isSelected ? colors.primary : "transparent",
                              border: `1px solid ${isSelected ? colors.primary : colors.hairline}`,
                              color: colors.onPrimary,
                            }}
                          >
                            {isSelected ? "✓" : ""}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            {p.brand && (
                              <p className="text-xs truncate" style={{ color: colors.textDim }}>
                                {p.brand}
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-bold flex-shrink-0" style={{ color: colors.textDim }}>
                            {p.kcalPer100} kcal/100g
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <button onClick={openManual} className="text-xs font-semibold mt-3 mb-2 block" style={{ color: colors.primary }}>
                  Hittar du inte det du söker? Lägg till manuellt
                </button>

                {flow.selectedProducts && flow.selectedProducts.length > 0 && (
                  <button
                    onClick={goToSearchConfirm}
                    className="w-full rounded-xl py-3.5 text-sm font-bold mt-2"
                    style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
                  >
                    Gå vidare med {flow.selectedProducts.length} valda
                  </button>
                )}
              </div>
            )}

            {flow.step === "search-confirm" && flow.selectedProducts && (
              <div className="pb-6">
                <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>
                  Namn på måltiden
                </label>
                <input
                  value={flow.comboName}
                  onChange={(e) => updateComboName(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm mb-4"
                  style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                />

                <div className="flex flex-col gap-2 mb-4">
                  {flow.selectedProducts.map((sp, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                      style={{ backgroundColor: colors.surfaceMuted }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sp.product.name}</p>
                        <p className="text-xs" style={{ color: colors.textDim }}>
                          {Math.round(sp.product.kcalPer100 * ((Number(sp.grams) || 0) / 100))} kcal
                        </p>
                      </div>
                      <input
                        value={sp.grams}
                        onChange={(e) => updateSelectionGrams(i, e.target.value.replace(/[^0-9]/g, ""))}
                        inputMode="numeric"
                        className="w-16 rounded-lg px-2 py-1.5 text-sm text-center flex-shrink-0"
                        style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}`, color: colors.text }}
                      />
                      <span className="text-xs flex-shrink-0" style={{ color: colors.textDim }}>
                        g
                      </span>
                      <button
                        onClick={() => removeSearchSelection(i)}
                        aria-label="Ta bort"
                        className="flex-shrink-0 text-sm px-1"
                        style={{ color: colors.textDim }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {(() => {
                  const totals = flow.selectedProducts.reduce(
                    (acc, sp) => {
                      const factor = (Number(sp.grams) || 0) / 100;
                      acc.kcal += sp.product.kcalPer100 * factor;
                      acc.protein += sp.product.proteinPer100 * factor;
                      acc.carbs += sp.product.carbsPer100 * factor;
                      acc.fat += sp.product.fatPer100 * factor;
                      acc.fiber += sp.product.fiberPer100 * factor;
                      return acc;
                    },
                    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
                  );
                  return (
                    <div className="rounded-xl px-4 py-3 mb-3" style={{ backgroundColor: colors.surfaceMuted }}>
                      <p className="text-2xl font-extrabold mb-1">{Math.round(totals.kcal)} kcal totalt</p>
                      <p className="text-xs" style={{ color: colors.textDim }}>
                        Protein {Math.round(totals.protein)}g · Kolhydrater {Math.round(totals.carbs)}g · Fett{" "}
                        {Math.round(totals.fat)}g · Fibrer {Math.round(totals.fiber)}g
                      </p>
                    </div>
                  );
                })()}

                <WalkOffCard
                  kcal={flow.selectedProducts.reduce(
                    (s, sp) => s + sp.product.kcalPer100 * ((Number(sp.grams) || 0) / 100),
                    0
                  )}
                  weightKg={Number(profile?.weightKg) || DEFAULT_BODYWEIGHT_KG}
                  onAddStepGoal={addStepsToGoal}
                />

                <button
                  onClick={saveSearchSelection}
                  disabled={flow.selectedProducts.length === 0}
                  className="w-full rounded-xl py-3.5 text-sm font-bold"
                  style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
                >
                  Lägg till i {CATEGORIES.find((c) => c.key === flow.category)?.label.toLowerCase()}
                </button>
              </div>
            )}

            {flow.step === "analyzing" && (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <div
                  className="w-10 h-10 rounded-full animate-spin"
                  style={{ border: `3px solid ${colors.hairline}`, borderTopColor: colors.primary }}
                />
                <p className="text-sm font-medium">Läser av maträtten …</p>
              </div>
            )}

            {flow.step === "error" && (
              <div className="pb-6">
                <p className="text-sm mb-4" style={{ color: colors.textDim }}>
                  {flow.errorMsg}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={triggerCamera}
                    className="w-full rounded-xl py-3.5 text-sm font-bold"
                    style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
                  >
                    Försök fota igen
                  </button>
                  <button
                    onClick={openManual}
                    className="w-full rounded-xl py-3.5 text-sm font-medium"
                    style={{ border: `1px solid ${colors.hairline}`, color: colors.text }}
                  >
                    Lägg till manuellt
                  </button>
                </div>
              </div>
            )}

            {(flow.step === "confirm" || flow.step === "manual") && (
              <div className="pb-6">
                {flow.draft.image ? (
                  <div className="relative mb-4">
                    <img src={flow.draft.image} alt="" className="w-full h-40 object-cover rounded-xl" />
                    <button
                      onClick={() => manualImageInputRef.current && manualImageInputRef.current.click()}
                      className="absolute bottom-2 right-2 rounded-full px-3 py-1.5 text-xs font-bold"
                      style={{ backgroundColor: colors.surface, color: colors.text, border: `1px solid ${colors.hairline}` }}
                    >
                      Byt bild
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => manualImageInputRef.current && manualImageInputRef.current.click()}
                    className="w-full rounded-xl py-3 text-sm font-medium mb-4 flex items-center justify-center gap-2"
                    style={{ border: `1px dashed ${colors.hairline}`, color: colors.textDim }}
                  >
                    📷 Lägg till bild (valfritt)
                  </button>
                )}
                {flow.draft.portion_note && (
                  <p className="text-xs mb-3" style={{ color: colors.textDim }}>
                    {flow.draft.portion_note}
                  </p>
                )}

                <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>
                  Maträtt
                </label>
                <input
                  value={flow.draft.name}
                  onChange={(e) => updateDraft("name", e.target.value)}
                  placeholder="T.ex. Kycklingsallad"
                  className="w-full rounded-lg px-3 py-2.5 text-sm mb-3"
                  style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                />

                <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>
                  Kalorier (kcal)
                </label>
                <input
                  value={flow.draft.kcal}
                  onChange={(e) => updateDraft("kcal", e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  placeholder="0"
                  className="w-full rounded-lg px-3 py-2.5 text-sm mb-3"
                  style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                />

                <WalkOffCard
                  kcal={Number(flow.draft.kcal) || 0}
                  weightKg={Number(profile?.weightKg) || DEFAULT_BODYWEIGHT_KG}
                  onAddStepGoal={addStepsToGoal}
                />

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <MacroInput label="Protein (g)" value={flow.draft.protein} onChange={(v) => updateDraft("protein", v)} />
                  <MacroInput label="Kolhydrater (g)" value={flow.draft.carbs} onChange={(v) => updateDraft("carbs", v)} />
                  <MacroInput label="Fett (g)" value={flow.draft.fat} onChange={(v) => updateDraft("fat", v)} />
                  <MacroInput label="Fibrer (g)" value={flow.draft.fiber} onChange={(v) => updateDraft("fiber", v)} />
                </div>

                <p className="text-xs font-bold mb-2 mt-4" style={{ color: colors.textDim }}>
                  Klimat &amp; plånbok (valfritt)
                </p>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  <MacroInput label="CO2 (kg)" value={flow.draft.co2} onChange={(v) => updateDraft("co2", v)} decimal />
                  <MacroInput label="Kostnad (kr)" value={flow.draft.cost} onChange={(v) => updateDraft("cost", v)} />
                </div>

                <button
                  onClick={saveDraft}
                  disabled={!draftValid}
                  className="w-full rounded-xl py-3.5 text-sm font-bold"
                  style={{ backgroundColor: colors.primary, color: colors.onPrimary, opacity: draftValid ? 1 : 0.5 }}
                >
                  {flow.editId ? "Spara ändringar" : `Lägg till i ${CATEGORIES.find((c) => c.key === flow.category)?.label.toLowerCase()}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile / goal overlay */}
      {profileOpen && (
        <div
          className="fixed inset-0 flex items-end justify-center z-50"
          style={{ backgroundColor: "rgba(15, 17, 21, 0.45)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setProfileOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-t-2xl px-5 pt-5 pb-6"
            style={{ backgroundColor: colors.surface, maxHeight: "88vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Dina mål</h3>
              <button onClick={() => setProfileOpen(false)} className="text-lg" style={{ color: colors.textDim }} aria-label="Stäng">
                ×
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              {["female", "male"].map((s) => (
                <button
                  key={s}
                  onClick={() => updateProfileDraft("sex", s)}
                  className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                  style={{
                    backgroundColor: profileDraft.sex === s ? colors.primary : colors.surfaceMuted,
                    color: profileDraft.sex === s ? colors.surface : colors.text,
                  }}
                >
                  {s === "female" ? "Kvinna" : "Man"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <MacroInput label="Ålder" value={profileDraft.age} onChange={(v) => updateProfileDraft("age", v)} />
              <MacroInput label="Vikt (kg)" value={profileDraft.weightKg} onChange={(v) => updateProfileDraft("weightKg", v)} />
              <MacroInput label="Längd (cm)" value={profileDraft.heightCm} onChange={(v) => updateProfileDraft("heightCm", v)} />
            </div>

            <p className="text-xs mb-2" style={{ color: colors.textDim }}>
              Aktivitetsnivå
            </p>
            <div className="flex flex-col gap-2 mb-4">
              {ACTIVITY_LEVELS.map((a) => (
                <button
                  key={a.key}
                  onClick={() => updateProfileDraft("activity", a.key)}
                  className="w-full rounded-lg px-3 py-2.5 text-left"
                  style={{
                    backgroundColor: profileDraft.activity === a.key ? colors.primaryLight : colors.surfaceMuted,
                    border: `1px solid ${profileDraft.activity === a.key ? colors.primary : "transparent"}`,
                  }}
                >
                  <p className="text-sm font-medium">{a.label}</p>
                  <p className="text-xs" style={{ color: colors.textDim }}>
                    {a.hint}
                  </p>
                </button>
              ))}
            </div>

            <p className="text-xs mb-2" style={{ color: colors.textDim }}>
              Mål
            </p>
            <div className="flex gap-2 mb-5">
              {GOAL_TYPES.map((g) => (
                <button
                  key={g.key}
                  onClick={() => updateProfileDraft("goalType", g.key)}
                  className="flex-1 rounded-lg py-2.5 text-xs font-medium"
                  style={{
                    backgroundColor: profileDraft.goalType === g.key ? colors.primary : colors.surfaceMuted,
                    color: profileDraft.goalType === g.key ? colors.surface : colors.text,
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {livePreview && !profileDraft.manualOverride && (
              <div className="rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: colors.primaryLight }}>
                <p className="text-xs mb-2" style={{ color: colors.textDim }}>
                  Beräknat dagsmål
                </p>
                <p className="text-2xl font-extrabold mb-1" style={{ color: colors.primary }}>
                  {livePreview.kcalGoal} kcal
                </p>
                <p className="text-xs" style={{ color: colors.textDim }}>
                  Protein {livePreview.proteinGoal}g · Kolhydrater {livePreview.carbsGoal}g · Fett {livePreview.fatGoal}g · Fibrer {livePreview.fiberGoal}g
                </p>
              </div>
            )}

            <button onClick={toggleManualOverride} className="text-xs font-medium mb-4" style={{ color: colors.primary }}>
              {profileDraft.manualOverride ? "Använd beräknat mål istället" : "Justera målen manuellt"}
            </button>

            {profileDraft.manualOverride && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <MacroInput label="Kalorier (kcal)" value={profileDraft.kcalGoal} onChange={(v) => updateProfileDraft("kcalGoal", v)} />
                <MacroInput label="Protein (g)" value={profileDraft.proteinGoal} onChange={(v) => updateProfileDraft("proteinGoal", v)} />
                <MacroInput label="Kolhydrater (g)" value={profileDraft.carbsGoal} onChange={(v) => updateProfileDraft("carbsGoal", v)} />
                <MacroInput label="Fett (g)" value={profileDraft.fatGoal} onChange={(v) => updateProfileDraft("fatGoal", v)} />
                <MacroInput label="Fibrer (g)" value={profileDraft.fiberGoal} onChange={(v) => updateProfileDraft("fiberGoal", v)} />
              </div>
            )}

            <button
              onClick={toggleFlexibleBudget}
              className="w-full flex items-center justify-between rounded-xl px-4 py-3 mb-2 mt-2"
              style={{ backgroundColor: colors.surfaceMuted }}
            >
              <div className="text-left pr-3">
                <p className="text-sm font-medium">Flexibel veckobudget</p>
                <p className="text-xs" style={{ color: colors.textDim }}>
                  Äter du för mycket en dag jämnas det ut med ett lite lägre mål resten av veckan
                </p>
              </div>
              <span
                className="flex-shrink-0 w-10 h-6 rounded-full relative"
                style={{ backgroundColor: flexibleBudget ? colors.primary : colors.hairline }}
              >
                <span
                  className="absolute top-0.5 rounded-full"
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: colors.onPrimary,
                    left: flexibleBudget ? 18 : 2,
                    transition: "left 0.2s ease",
                  }}
                />
              </span>
            </button>

            <button
              onClick={saveProfile}
              className="w-full rounded-xl py-3.5 text-sm font-bold mt-4"
              style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
            >
              Spara mål
            </button>
          </div>
        </div>
      )}

      {/* Fast auto-completed celebration */}
      {fastCompletedMsg && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-8"
          style={{ backgroundColor: "rgba(15, 17, 21, 0.6)" }}
          onClick={() => setFastCompletedMsg(null)}
        >
          <div
            className="w-full max-w-xs rounded-2xl px-6 py-8 text-center"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-bold mb-5">{fastCompletedMsg}</p>
            <button
              onClick={() => setFastCompletedMsg(null)}
              className="rounded-full px-6 py-3 text-sm font-bold"
              style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
            >
              Toppen!
            </button>
          </div>
        </div>
      )}

      {/* Share meal overlay */}
      {shareModal && (
        <div
          className="fixed inset-0 flex items-end justify-center z-50"
          style={{ backgroundColor: "rgba(15, 17, 21, 0.45)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeShareModal();
          }}
        >
          <div
            className="w-full max-w-md rounded-t-2xl px-5 pt-5 pb-6"
            style={{ backgroundColor: colors.surface, maxHeight: "70vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Dela måltid</h3>
              <button onClick={closeShareModal} className="text-lg" style={{ color: colors.textDim }} aria-label="Stäng">
                ×
              </button>
            </div>

            {shareModal.step === "sharing" && (
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <div
                  className="w-8 h-8 rounded-full animate-spin"
                  style={{ border: `3px solid ${colors.hairline}`, borderTopColor: colors.primary }}
                />
              </div>
            )}

            {shareModal.step === "error" && (
              <p className="text-sm text-center py-6" style={{ color: colors.textDim }}>
                Kunde inte dela just nu. Försök igen om en stund.
              </p>
            )}

            {shareModal.step === "shared" && (
              <div className="pb-2">
                <p className="text-xs mb-4" style={{ color: colors.textDim }}>
                  Skicka den här koden till din vän (t.ex. via SMS) — de kan hämta måltiden i sin egen app under{" "}
                  <span style={{ color: colors.text }}>+ → "Hämta delad måltid"</span>.
                </p>
                <div
                  className="rounded-xl py-5 text-center mb-4"
                  style={{ backgroundColor: colors.surfaceMuted }}
                >
                  <span className="text-3xl font-extrabold tracking-widest" style={{ color: colors.primary }}>
                    {shareModal.code}
                  </span>
                </div>
                <p className="text-[11px] mb-4" style={{ color: colors.textDim }}>
                  Koden lagras i ett delat utrymme som tekniskt sett går att nå av andra som använder samma app om de gissar
                  koden — dela den bara med personer du litar på.
                </p>
                <button
                  onClick={closeShareModal}
                  className="w-full rounded-xl py-3.5 text-sm font-bold"
                  style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
                >
                  Klar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reactive burn suggestions overlay */}
      {reactiveSuggestFlow && (
        <div
          className="fixed inset-0 flex items-end justify-center z-50"
          style={{ backgroundColor: "rgba(15, 17, 21, 0.45)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setReactiveSuggestFlow(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-t-2xl px-5 pt-5 pb-6"
            style={{ backgroundColor: colors.surface, maxHeight: "80vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Förslag på mellanmål</h3>
              <button
                onClick={() => setReactiveSuggestFlow(null)}
                className="text-lg"
                style={{ color: colors.textDim }}
                aria-label="Stäng"
              >
                ×
              </button>
            </div>

            {reactiveSuggestFlow.step === "loading" && (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <div
                  className="w-9 h-9 rounded-full animate-spin"
                  style={{ border: `3px solid ${colors.hairline}`, borderTopColor: colors.primary }}
                />
              </div>
            )}

            {reactiveSuggestFlow.step === "error" && (
              <p className="text-sm text-center py-6" style={{ color: colors.textDim }}>
                Något gick fel. Försök igen om en stund.
              </p>
            )}

            {reactiveSuggestFlow.step === "results" && (
              <div className="flex flex-col gap-3 pb-2">
                {reactiveSuggestFlow.suggestions.map((s, i) => {
                  const added = reactiveSuggestFlow.addedIds && reactiveSuggestFlow.addedIds[i];
                  return (
                    <div
                      key={i}
                      className="rounded-2xl p-4"
                      style={{ backgroundColor: colors.surfaceMuted }}
                    >
                      <p className="text-sm font-bold mb-1">{s.name}</p>
                      <p className="text-xs mb-3" style={{ color: colors.textDim }}>
                        {s.description}
                      </p>
                      <p className="text-xs mb-3" style={{ color: colors.textDim }}>
                        <span className="font-bold" style={{ color: colors.text }}>
                          {Math.round(s.kcal)} kcal
                        </span>{" "}
                        · P {Math.round(s.protein_g)}g · K {Math.round(s.carbs_g)}g · F {Math.round(s.fat_g)}g
                      </p>
                      <button
                        onClick={() => addReactiveSuggestion(s, i)}
                        disabled={added}
                        className="w-full rounded-lg py-2.5 text-xs font-bold"
                        style={{
                          backgroundColor: added ? colors.surface : colors.primary,
                          color: added ? colors.textDim : colors.onPrimary,
                        }}
                      >
                        {added ? "Tillagt ✓" : "Lägg till i mellanmål"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category split overlay */}
      {categorySplitOpen && (
        <div
          className="fixed inset-0 flex items-end justify-center z-50"
          style={{ backgroundColor: "rgba(15, 17, 21, 0.45)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setCategorySplitOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-t-2xl px-5 pt-5 pb-6"
            style={{ backgroundColor: colors.surface, maxHeight: "88vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold">Fördelning per måltid</h3>
              <button onClick={() => setCategorySplitOpen(false)} className="text-lg" style={{ color: colors.textDim }} aria-label="Stäng">
                ×
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: colors.textDim }}>
              Som standard delas ditt dagsmål upp automatiskt. Fått andra siffror av t.ex. en dietist? Ange dem här så används de istället.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {CATEGORIES.map((c) => (
                <MacroInput
                  key={c.key}
                  label={`${c.label} (kcal)`}
                  value={categorySplitDraft[c.key]}
                  onChange={(v) => updateCategorySplitDraft(c.key, v)}
                />
              ))}
            </div>

            {goals && (
              <p className="text-xs mb-5" style={{ color: colors.textDim }}>
                Summa: {CATEGORIES.reduce((s, c) => s + (Number(categorySplitDraft[c.key]) || 0), 0)} kcal · Dagsmål: {goals.kcalGoal} kcal
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={saveCategorySplit}
                className="w-full rounded-xl py-3.5 text-sm font-bold"
                style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
              >
                Spara fördelning
              </button>
              {categorySplit && (
                <button
                  onClick={resetCategorySplit}
                  className="w-full rounded-xl py-3.5 text-sm font-medium"
                  style={{ border: `1px solid ${colors.hairline}`, color: colors.text }}
                >
                  Återställ till automatisk fördelning
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <input ref={manualImageInputRef} type="file" accept="image/*" onChange={handleManualImage} className="hidden" />
      <input
        ref={scannerFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleScannerFile}
        className="hidden"
      />
    </div>
  );
}

const TREND_METRICS = [
  { key: "kcal", label: "Kalorier", unit: "kcal", color: colors.primary, goalKey: "kcalGoal" },
  { key: "protein", label: "Protein", unit: "g", color: colors.protein, goalKey: "proteinGoal" },
  { key: "carbs", label: "Kolhyd.", unit: "g", color: colors.carbs, goalKey: "carbsGoal" },
  { key: "fat", label: "Fett", unit: "g", color: colors.fat, goalKey: "fatGoal" },
  { key: "fiber", label: "Fibrer", unit: "g", color: colors.fiber, goalKey: "fiberGoal" },
];

function TrendsPanel({ data, loading, goals, metric, onMetricChange, selectedDay, onSelectDay, todayKey }) {
  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div
          className="w-8 h-8 rounded-full animate-spin"
          style={{ border: `3px solid ${colors.hairline}`, borderTopColor: colors.primary }}
        />
        <p className="text-sm" style={{ color: colors.textDim }}>
          Hämtar kalender …
        </p>
      </div>
    );
  }

  const selectedData = data.find((d) => d.date === selectedDay) || { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const weekDates = getWeekDates(selectedDay);

  return (
    <div className="px-5">
      <h2 className="text-lg font-extrabold mb-1">Trender</h2>
      <InfoBanner>
        Här kan du gå tillbaka i historiken vecka för vecka. Tryck på en dag för att se just den dagens kalorier och
        makron i detalj.
      </InfoBanner>

      {/* Week strip */}
      <div className="flex items-center gap-1 mb-5">
        <button
          onClick={() => onSelectDay(shiftDateKey(selectedDay, -7))}
          aria-label="Föregående vecka"
          className="w-6 h-9 flex items-center justify-center text-sm flex-shrink-0"
          style={{ color: colors.textDim }}
        >
          ‹
        </button>
        <div className="flex-1 grid grid-cols-7 gap-1">
          {weekDates.map((dt, i) => {
            const key = dateKey(dt);
            const isSelected = key === selectedDay;
            const isFuture = key > todayKey;
            const entry = data.find((d) => d.date === key);
            const hasData = entry && entry.kcal > 0;
            return (
              <button
                key={key}
                onClick={() => !isFuture && onSelectDay(key)}
                disabled={isFuture}
                className="rounded-xl py-2 flex flex-col items-center gap-1"
                style={{
                  backgroundColor: isSelected ? colors.text : colors.surface,
                  border: `1px solid ${isSelected ? colors.text : colors.hairline}`,
                  opacity: isFuture ? 0.35 : 1,
                }}
              >
                <span className="text-[10px] font-bold" style={{ color: isSelected ? colors.surface : colors.textDim }}>
                  {DAY_LETTERS[i]}
                </span>
                <span className="text-sm font-bold" style={{ color: isSelected ? colors.surface : colors.text }}>
                  {dt.getDate()}
                </span>
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: hasData ? colors.primary : "transparent" }}
                />
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onSelectDay(shiftDateKey(selectedDay, 7))}
          aria-label="Nästa vecka"
          className="w-6 h-9 flex items-center justify-center text-sm flex-shrink-0"
          style={{ color: colors.textDim }}
        >
          ›
        </button>
      </div>

      <h3 className="text-sm font-bold mb-3">Sammanfattning – {dateLabel(selectedDay)}</h3>
      {goals ? (
        <div className="rounded-2xl p-5" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}>
          <div className="grid grid-cols-2 gap-y-6">
            <DarkMacroRing color={colors.carbs} label="Kolhydrater" consumed={selectedData.carbs} goal={goals.carbsGoal} />
            <DarkMacroRing color={colors.protein} label="Protein" consumed={selectedData.protein} goal={goals.proteinGoal} />
            <DarkMacroRing color={colors.fat} label="Fett" consumed={selectedData.fat} goal={goals.fatGoal} />
            <DarkMacroRing color={colors.fiber} label="Fiber" consumed={selectedData.fiber} goal={goals.fiberGoal} />
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-5 text-center text-sm"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}`, color: colors.textDim }}
        >
          Ställ in dina mål under "Översikt" för att se sammanfattningen
        </div>
      )}

      <div className="mt-6 rounded-2xl p-5" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-base font-extrabold">Specifikation &amp; Makrovärden</h3>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: colors.textDim }}>
            Näringsämne
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: colors.textDim }}>
            Mängd / Energiandel
          </span>
        </div>

        {SPEC_ROWS.map((row, i) => {
          const grams = Math.round(selectedData[row.key] || 0);
          const kcalFromRow = grams * row.calPerGram;
          const percent = selectedData.kcal > 0 ? Math.round((kcalFromRow / selectedData.kcal) * 100) : 0;
          return (
            <div
              key={row.key}
              className="flex items-center justify-between gap-3 py-3"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${colors.hairline}` }}
            >
              <div className="flex items-start gap-2 min-w-0">
                <span className="mt-1 flex-shrink-0" style={{ color: row.color, fontSize: 10 }}>
                  ◆
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold">{row.label}</p>
                  <p className="text-xs" style={{ color: colors.textDim }}>
                    {row.func}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold">{grams} g</p>
                <p className="text-xs" style={{ color: colors.textDim }}>
                  {percent} %
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const SPEC_ROWS = [
  { key: "protein", label: "Protein", func: "Muskelreparation & mättnad", color: colors.protein, calPerGram: 4 },
  { key: "carbs", label: "Kolhydrater", func: "Hjärnans & musklernas primära bränsle", color: colors.carbs, calPerGram: 4 },
  { key: "fat", label: "Fett", func: "Hormonreglering & essentiella fettsyror", color: colors.fat, calPerGram: 9 },
  { key: "fiber", label: "Kostfiber", func: "Matsmältning & jämn blodsockerreglering", color: colors.fiber, calPerGram: 2 },
];

function DarkMacroRing({ color, label, consumed, goal }) {
  const safeGoal = goal || 0;
  const remaining = Math.max(0, Math.round(safeGoal - consumed));
  const fraction = safeGoal ? Math.min(1, consumed / safeGoal) : 0;

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-extrabold mb-3 text-center" style={{ color, letterSpacing: "0.02em" }}>
        {label.toUpperCase()}
      </p>
      <SemiGauge size={140} stroke={10} baseColor={colors.surfaceMuted} overlayColor={color} fraction={fraction}>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-extrabold leading-tight">{remaining}</span>
          <span className="text-[10px]" style={{ color: colors.textDim }}>
            g kvar
          </span>
        </div>
      </SemiGauge>
      <p className="text-xs mt-1" style={{ color: colors.textDim }}>
        Mål {Math.round(goal) || 0}g
      </p>
    </div>
  );
}

const BMI_CATEGORIES = [
  { label: "Undervikt", min: 0, max: 18.5, color: colors.water, rangeText: "12,0-18,5" },
  { label: "Hälsosam", min: 18.5, max: 25, color: colors.carbs, rangeText: "18,5-25,0" },
  { label: "Övervikt", min: 25, max: 30, color: colors.fat, rangeText: "25,0-30,0" },
  { label: "Fetma", min: 30, max: Infinity, color: colors.coral, rangeText: ">30,0" },
];

function computeBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function bmiCategoryFor(bmi) {
  return BMI_CATEGORIES.find((c) => bmi >= c.min && bmi < c.max) || BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
}

function WeightPanel({ log, loading, draft, onDraftChange, onAdd, onDelete, todayKey, profile }) {
  const [bmiExpanded, setBmiExpanded] = useState(false);

  const chartData = log.map((e) => ({
    ...e,
    label: parseDateKey(e.date).toLocaleDateString("sv-SE", { day: "numeric", month: "short" }),
  }));

  const latestWeight = log.length ? [...log].sort((a, b) => (a.date < b.date ? 1 : -1))[0].kg : Number(profile?.weightKg) || null;
  const heightCm = Number(profile?.heightCm) || null;
  const bmi = computeBMI(latestWeight, heightCm);
  const bmiCat = bmi ? bmiCategoryFor(bmi) : null;
  const bmiScalePercent = bmi ? Math.min(100, Math.max(0, ((bmi - 12) / (40 - 12)) * 100)) : 0;

  return (
    <div className="px-5">
      <h2 className="text-lg font-extrabold mb-1">Viktgång</h2>
      <InfoBanner>
        Logga din vikt regelbundet för att se utvecklingen som en graf över tid, och håll koll på ditt uträknade BMI
        högst upp.
      </InfoBanner>

      {bmi ? (
        <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}>
          <p className="text-xs mb-1" style={{ color: colors.textDim }}>
            Nuvarande BMI
          </p>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-4xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>
              {bmi.toFixed(1).replace(".", ",")}
            </span>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${bmiCat.color}22`, color: bmiCat.color }}
            >
              {bmiCat.label}
            </span>
          </div>

          <div className="relative mb-1.5">
            <div
              className="w-full h-2 rounded-full"
              style={{
                background: `linear-gradient(to right, ${colors.water} 0%, ${colors.water} 23%, ${colors.carbs} 23%, ${colors.carbs} 46%, ${colors.fat} 46%, ${colors.fat} 64%, ${colors.coral} 64%, ${colors.coral} 100%)`,
              }}
            />
            <div
              className="absolute -top-2.5 text-xs"
              style={{ left: `${bmiScalePercent}%`, transform: "translateX(-50%)", color: colors.text }}
            >
              ▼
            </div>
          </div>
          <div className="flex justify-between text-[11px]" style={{ color: colors.textDim }}>
            <span>12,0</span>
            <span>18,5</span>
            <span>24,9</span>
            <span>30,0</span>
            <span>40,0</span>
          </div>

          <div className="flex justify-end mt-3">
            <button onClick={() => setBmiExpanded((v) => !v)} className="text-xs font-bold" style={{ color: colors.primary }}>
              {bmiExpanded ? "Visa mindre" : "Visa mer"}
            </button>
          </div>

          {bmiExpanded && (
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.hairline}` }}>
              <h3 className="text-sm font-bold mb-3">BMI-kategorier</h3>
              <div className="flex flex-col gap-2.5 mb-5">
                {BMI_CATEGORIES.map((c) => (
                  <div key={c.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-sm font-medium">{c.label}</span>
                      {bmiCat.label === c.label && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${c.color}22`, color: c.color }}
                        >
                          Nuvarande BMI
                        </span>
                      )}
                    </div>
                    <span className="text-sm" style={{ color: colors.textDim }}>
                      {c.rangeText}
                    </span>
                  </div>
                ))}
              </div>

              <h3 className="text-sm font-bold mb-2">Beräkning av BMI</h3>
              <p className="text-xs mb-4" style={{ color: colors.textDim }}>
                BMI räknas ut genom att dela vikten i kilogram med längden i meter i kvadrat (BMI = kg / m²).
              </p>

              <p className="text-[11px] font-bold mb-1" style={{ color: colors.textDim }}>
                Notera
              </p>
              <p className="text-[11px]" style={{ color: colors.textDim }}>
                BMI är ett vanligt screeningmått men har begränsningar. Faktorer som graviditet eller hög muskelmassa kan ge ett
                missvisande resultat, och måttet är mindre tillförlitligt för barn och äldre.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div
          className="rounded-2xl p-5 mb-4 text-center text-sm"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}`, color: colors.textDim }}
        >
          Lägg in din längd under "Översikt" och logga en vikt för att se ditt BMI
        </div>
      )}

      <div
        className="rounded-2xl p-4 mb-4 flex items-end gap-2"
        style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}
      >
        <div className="flex-1">
          <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>
            Vikt (kg)
          </label>
          <input
            value={draft.kg}
            onChange={(e) => onDraftChange({ ...draft, kg: e.target.value.replace(/[^0-9.]/g, "") })}
            inputMode="decimal"
            placeholder="0"
            className="w-full rounded-lg px-3 py-2.5 text-sm"
            style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>
            Datum
          </label>
          <input
            type="date"
            value={draft.date}
            max={todayKey}
            onChange={(e) => onDraftChange({ ...draft, date: e.target.value })}
            className="w-full rounded-lg px-3 py-2.5 text-sm"
            style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
          />
        </div>
        <button
          onClick={onAdd}
          className="rounded-lg px-4 py-2.5 text-sm font-bold"
          style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
        >
          Lägg till
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div
            className="w-8 h-8 rounded-full animate-spin"
            style={{ border: `3px solid ${colors.hairline}`, borderTopColor: colors.primary }}
          />
        </div>
      ) : log.length === 0 ? (
        <div
          className="rounded-2xl py-6 text-center text-sm"
          style={{ backgroundColor: colors.surface, color: colors.textDim, border: `1px solid ${colors.hairline}` }}
        >
          Ingen vikt loggad än
        </div>
      ) : (
        <>
          <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}>
            <div style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.hairline} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: colors.textDim }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: colors.textDim }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    domain={["dataMin - 1", "dataMax + 1"]}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${colors.hairline}` }}
                    formatter={(v) => [`${v} kg`, "Vikt"]}
                  />
                  <Line type="monotone" dataKey="kg" stroke={colors.primary} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${colors.hairline}` }}>
            {[...log].reverse().map((e, i) => (
              <div
                key={e.id}
                className="flex items-center justify-between px-4 py-2.5"
                style={{ backgroundColor: colors.surface, borderTop: i === 0 ? "none" : `1px solid ${colors.hairline}` }}
              >
                <span className="text-sm" style={{ color: colors.textDim }}>
                  {dateLabel(e.date)}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{e.kg} kg</span>
                  <button onClick={() => onDelete(e.id)} aria-label="Ta bort" className="text-sm" style={{ color: colors.textDim }}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TrainingPanel({
  dayData,
  dayLoading,
  selectedDate,
  profile,
  flow,
  onOpenMenu,
  onClose,
  onSelectType,
  onUpdateDraft,
  onSave,
  onDelete,
  onEdit,
  stepGoal,
  onSaveStepGoal,
}) {
  const [editingStepGoal, setEditingStepGoal] = useState(false);
  const [stepGoalDraft, setStepGoalDraft] = useState(String(stepGoal));

  function handleSaveStepGoal() {
    onSaveStepGoal(stepGoalDraft);
    setEditingStepGoal(false);
  }

  if (dayLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div
          className="w-8 h-8 rounded-full animate-spin"
          style={{ border: `3px solid ${colors.hairline}`, borderTopColor: colors.primary }}
        />
        <p className="text-sm" style={{ color: colors.textDim }}>
          Hämtar loggen …
        </p>
      </div>
    );
  }

  const exercises = dayData.exercise || [];
  const exerciseKcal = exercises.reduce((s, e) => s + e.kcal, 0);
  const exerciseKm = exercises.reduce((s, e) => s + (e.km || 0), 0);
  const weightKg = Number(profile?.weightKg) || DEFAULT_BODYWEIGHT_KG;
  const stepsNum = exercises.reduce((s, e) => s + (e.steps || 0), 0);
  const totalBurned = exerciseKcal;
  const totalKm = exerciseKm;
  const stepsFraction = stepGoal ? Math.min(1, stepsNum / stepGoal) : 0;

  const previewKcal =
    flow && flow.step === "details" && flow.type
      ? flow.type.mode === "steps"
        ? stepsToKcal(Number(flow.steps) || 0, weightKg)
        : flow.type.mode === "distance"
        ? Math.round(flow.type.kcalPerKgPerKm * weightKg * (Number(flow.km) || 0))
        : flow.type.mode === "time"
        ? Math.round(flow.type.met * weightKg * ((Number(flow.minutes) || 0) / 60))
        : Number(flow.kcalManual) || 0
      : 0;

  return (
    <div className="px-5">
      <h2 className="text-lg font-extrabold mb-1">Träning</h2>
      <p className="text-xs mb-4" style={{ color: colors.textDim }}>
        Träning för {dateLabel(selectedDate)}
      </p>

      <InfoBanner>
        Logga steg och träningspass här. Kalorierna du bränner räknas automatiskt in i dagens budget på Översikt-fliken.
      </InfoBanner>

      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}>
        <div className="flex justify-center mb-1">
          <Ring size={188} stroke={14} baseColor={colors.surfaceMuted} overlayColor={colors.primary} fraction={stepsFraction}>
            <div className="flex flex-col items-center">
              <span style={{ fontSize: 20 }}>👟</span>
              <span className="text-3xl font-extrabold mt-1" style={{ letterSpacing: "-0.02em" }}>
                {stepsNum.toLocaleString("sv-SE")}
              </span>
              <span className="text-xs" style={{ color: colors.textDim }}>
                steg
              </span>
            </div>
          </Ring>
        </div>

        <div className="flex justify-center mb-5">
          {editingStepGoal ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={stepGoalDraft}
                onChange={(e) => setStepGoalDraft(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                className="w-20 rounded-lg px-2 py-1 text-xs text-center"
                style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
              />
              <button onClick={handleSaveStepGoal} className="text-xs font-bold" style={{ color: colors.primary }}>
                Spara
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setStepGoalDraft(String(stepGoal));
                setEditingStepGoal(true);
              }}
              className="flex items-center gap-1.5"
            >
              <span className="text-sm font-bold">{stepGoal.toLocaleString("sv-SE")}</span>
              <span className="text-xs" style={{ color: colors.textDim }}>
                dagligt mål
              </span>
              <span style={{ fontSize: 12, color: colors.textDim }}>✎</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-around" style={{ borderTop: `1px solid ${colors.hairline}`, paddingTop: 18 }}>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 16 }}>🔥</span>
              <span className="text-2xl font-extrabold">{totalBurned}</span>
            </div>
            <span className="text-xs mt-0.5" style={{ color: colors.textDim }}>
              kcal
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 16 }}>📍</span>
              <span className="text-2xl font-extrabold">{totalKm.toFixed(2)}</span>
            </div>
            <span className="text-xs mt-0.5" style={{ color: colors.textDim }}>
              km
            </span>
          </div>
        </div>
      </div>

      {/* Exercise log */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">Träningspass</h3>
        <button
          onClick={onOpenMenu}
          aria-label="Lägg till träningspass"
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
          style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
        >
          +
        </button>
      </div>

      {exercises.length === 0 ? (
        <div
          className="rounded-2xl py-4 text-center text-sm"
          style={{ backgroundColor: colors.surface, color: colors.textDim, border: `1px solid ${colors.hairline}` }}
        >
          Inget tillagt än
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${colors.hairline}` }}>
          {exercises.map((e, i) => (
            <button
              key={e.id}
              onClick={() => onEdit(e)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
              style={{ backgroundColor: colors.surface, borderTop: i === 0 ? "none" : `1px solid ${colors.hairline}` }}
            >
              <div
                className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: colors.surfaceMuted, fontSize: 18 }}
              >
                {e.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{e.label}</p>
                {e.steps ? (
                  <p className="text-xs" style={{ color: colors.textDim }}>
                    {e.steps.toLocaleString("sv-SE")} steg
                  </p>
                ) : e.minutes ? (
                  <p className="text-xs" style={{ color: colors.textDim }}>
                    {e.minutes} min
                  </p>
                ) : e.km ? (
                  <p className="text-xs" style={{ color: colors.textDim }}>
                    {e.km} km
                  </p>
                ) : null}
              </div>
              <span className="text-sm font-bold flex-shrink-0">{e.kcal} kcal</span>
              <span
                onClick={(ev) => {
                  ev.stopPropagation();
                  onDelete(e.id);
                }}
                role="button"
                aria-label="Ta bort"
                className="flex-shrink-0 text-sm px-1"
                style={{ color: colors.textDim }}
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      {(() => {
        const groups = {};
        exercises.forEach((e) => {
          const key = e.typeKey || e.label;
          if (!groups[key]) {
            groups[key] = {
              key,
              label: e.label,
              color: ACTIVITY_COLORS[e.typeKey] || colors.primary,
              km: 0,
              steps: 0,
              minutes: 0,
              kcal: 0,
            };
          }
          groups[key].km += e.km || 0;
          groups[key].steps += e.steps || 0;
          groups[key].minutes += e.minutes || 0;
          groups[key].kcal += e.kcal || 0;
        });
        const groupList = Object.values(groups);
        if (groupList.length === 0) return null;

        return (
          <div className="mt-8">
            <h3 className="text-sm font-bold mb-5">Aktiviteter idag</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-7">
              {groupList.map((g) => {
                let value, unit;
                if (g.steps > 0) {
                  value = g.steps.toLocaleString("sv-SE");
                  unit = "steg";
                } else if (g.km > 0) {
                  value = g.km.toFixed(2).replace(".", ",");
                  unit = "km";
                } else if (g.minutes > 0) {
                  value = g.minutes;
                  unit = "min";
                } else {
                  value = g.kcal;
                  unit = "kcal";
                }
                const fraction = totalBurned ? g.kcal / totalBurned : 1;
                return (
                  <ActivityCircle
                    key={g.key}
                    label={g.label}
                    color={g.color}
                    value={value}
                    unit={unit}
                    kcal={g.kcal}
                    fraction={fraction}
                  />
                );
              })}
            </div>
          </div>
        );
      })()}

      {flow && (
        <div
          className="fixed inset-0 flex items-end justify-center z-50"
          style={{ backgroundColor: "rgba(15, 17, 21, 0.45)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget && flow.step === "menu") onClose();
          }}
        >
          <div
            className="w-full max-w-md rounded-t-2xl px-5 pt-5 pb-6"
            style={{ backgroundColor: colors.surface, maxHeight: "88vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">{flow.editId ? "Redigera träning" : "Lägg till träning"}</h3>
              <button onClick={onClose} className="text-lg" style={{ color: colors.textDim }} aria-label="Stäng">
                ×
              </button>
            </div>

            {flow.step === "menu" && (
              <div className="grid grid-cols-2 gap-2">
                {EXERCISE_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => onSelectType(t)}
                    className="rounded-xl px-3 py-3 flex flex-col items-start gap-1"
                    style={{ backgroundColor: colors.surfaceMuted }}
                  >
                    <span style={{ fontSize: 20 }}>{t.icon}</span>
                    <span className="text-xs font-bold text-left">{t.label}</span>
                  </button>
                ))}
              </div>
            )}

            {flow.step === "details" && flow.type && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span style={{ fontSize: 22 }}>{flow.type.icon}</span>
                  <p className="text-sm font-bold">{flow.type.label}</p>
                </div>

                {flow.type.mode === "steps" ? (
                  <>
                    <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>
                      Antal steg
                    </label>
                    <input
                      value={flow.steps}
                      onChange={(e) => onUpdateDraft("steps", e.target.value.replace(/[^0-9]/g, ""))}
                      inputMode="numeric"
                      placeholder="T.ex. 2000"
                      className="w-full rounded-lg px-3 py-2.5 text-sm mb-3"
                      style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                    />
                    <p className="text-xs mb-5" style={{ color: colors.textDim }}>
                      Uppskattad förbränning: <span className="font-bold" style={{ color: colors.text }}>{previewKcal} kcal</span>
                      <br />
                      (baserat på ca 1 333 steg/km och 0,7 kcal per kg kroppsvikt och kilometer)
                    </p>
                  </>
                ) : flow.type.mode === "distance" ? (
                  <>
                    <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>
                      Antal kilometer
                    </label>
                    <input
                      value={flow.km}
                      onChange={(e) => onUpdateDraft("km", e.target.value.replace(/[^0-9.]/g, ""))}
                      inputMode="decimal"
                      placeholder="3"
                      className="w-full rounded-lg px-3 py-2.5 text-sm mb-3"
                      style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                    />
                    <p className="text-xs mb-5" style={{ color: colors.textDim }}>
                      Uppskattad förbränning: <span className="font-bold" style={{ color: colors.text }}>{previewKcal} kcal</span>
                      <br />
                      ({String(flow.type.kcalPerKgPerKm).replace(".", ",")} kcal per kg kroppsvikt och kilometer)
                    </p>
                  </>
                ) : flow.type.mode === "time" ? (
                  <>
                    <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>
                      Antal minuter
                    </label>
                    <input
                      value={flow.minutes}
                      onChange={(e) => onUpdateDraft("minutes", e.target.value.replace(/[^0-9]/g, ""))}
                      inputMode="numeric"
                      placeholder="30"
                      className="w-full rounded-lg px-3 py-2.5 text-sm mb-3"
                      style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                    />
                    <p className="text-xs mb-5" style={{ color: colors.textDim }}>
                      Uppskattad förbränning: <span className="font-bold" style={{ color: colors.text }}>{previewKcal} kcal</span>
                    </p>
                  </>
                ) : (
                  <>
                    <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>
                      Kalorier (kcal)
                    </label>
                    <input
                      value={flow.kcalManual}
                      onChange={(e) => onUpdateDraft("kcalManual", e.target.value.replace(/[^0-9]/g, ""))}
                      inputMode="numeric"
                      placeholder="0"
                      className="w-full rounded-lg px-3 py-2.5 text-sm mb-5"
                      style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                    />
                  </>
                )}

                <button
                  onClick={onSave}
                  disabled={!previewKcal}
                  className="w-full rounded-xl py-3.5 text-sm font-bold"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.onPrimary,
                    opacity: !previewKcal ? 0.5 : 1,
                  }}
                >
                  {flow.editId ? "Spara ändringar" : "Lägg till"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityCircle({ label, color, value, unit, kcal, fraction }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-[10px] font-bold uppercase tracking-wide mb-2 text-center"
        style={{ color }}
      >
        {label}
      </span>
      <Ring size={124} stroke={7} baseColor={colors.surfaceMuted} overlayColor={color} fraction={fraction}>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-extrabold">{value}</span>
          <span className="text-[10px]" style={{ color: colors.textDim }}>
            {unit}
          </span>
        </div>
      </Ring>
      <span className="text-xs mt-2" style={{ color: colors.textDim }}>
        🔥 {kcal} kcal
      </span>
    </div>
  );
}

const SCANNER_CATEGORIES = [
  { key: "breakfast", label: "Frukost" },
  { key: "lunch", label: "Lunch" },
  { key: "snack", label: "Mellanmål" },
  { key: "dinner", label: "Middag" },
];

function LegalPanel() {
  return (
    <div className="px-5">
      <h2 className="text-lg font-extrabold mb-1">Legal</h2>
      <p className="text-xs mb-5" style={{ color: colors.textDim }}>
        Villkor och ansvarsbegränsning för Calio Bite.
      </p>

      <div className="rounded-2xl p-5" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}>
        <h3 className="text-base font-bold mb-4">Disclaimer and Limitation of Liability</h3>

        <p className="text-sm font-bold mb-1">1. For Educational and Informational Purposes Only</p>
        <p className="text-xs mb-4" style={{ color: colors.textDim, lineHeight: 1.6 }}>
          The information provided by this application, including but not limited to caloric calculations,
          nutritional data, and dietary suggestions, is for general educational and informational purposes only. It
          is not intended as medical advice, diagnosis, or treatment.
        </p>

        <p className="text-sm font-bold mb-1">2. Not Medical Advice</p>
        <p className="text-xs mb-4" style={{ color: colors.textDim, lineHeight: 1.6 }}>
          Always seek the advice of a qualified healthcare professional or dietitian before starting any new diet,
          nutrition program, or making changes to your lifestyle. Never disregard professional medical advice
          because of something you have read or calculated in this application.
        </p>

        <p className="text-sm font-bold mb-1">3. Accuracy of Data and "As Is" Basis</p>
        <p className="text-xs mb-4" style={{ color: colors.textDim, lineHeight: 1.6 }}>
          This application is provided on an "as is" and "as available" basis without any warranties of any kind.
          While we strive to provide accurate nutritional data, we cannot guarantee that the calculations, food
          databases, or metrics are 100% correct or up to date. Nutritional values can vary significantly.
        </p>

        <p className="text-sm font-bold mb-1">4. Limitation of Liability</p>
        <p className="text-xs" style={{ color: colors.textDim, lineHeight: 1.6 }}>
          In no event shall the creators, developers, or owners of this application be liable for any direct,
          indirect, incidental, or consequential damages resulting from the use of, or inability to use, this
          application, including but not limited to reliance on any information obtained herein. You use this
          application entirely at your own risk.
        </p>
      </div>

      <p className="text-[11px] text-center mt-5" style={{ color: colors.textDim }}>
        © {new Date().getFullYear()} Femtes. Alla rättigheter förbehållna.
      </p>
    </div>
  );
}

function ScannerPanel({ category, onCategoryChange, flow, onTriggerCamera, onClose, onAddSuggestion, goals, consumed }) {
  const remainingKcal = goals ? Math.max(0, goals.kcalGoal - consumed.kcal) : null;

  return (
    <div className="px-5">
      <h2 className="text-lg font-extrabold mb-1">Måltids scanner</h2>
      <InfoBanner>
        Fota insidan av ditt kylskåp eller skafferi, så föreslår Calio Bite måltider utifrån vad du har hemma och hur
        mycket du har kvar av dagens kalorimål.
      </InfoBanner>

      <p className="text-xs font-bold mb-2" style={{ color: colors.textDim }}>
        Vad vill du ha förslag på?
      </p>
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {SCANNER_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => onCategoryChange(c.key)}
            className="rounded-full px-4 py-2 text-xs font-bold flex-shrink-0"
            style={{
              backgroundColor: category === c.key ? colors.primary : colors.surfaceMuted,
              color: category === c.key ? colors.onPrimary : colors.textDim,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {goals ? (
        <div className="rounded-2xl px-4 py-3 mb-5" style={{ backgroundColor: colors.surfaceMuted }}>
          <p className="text-xs" style={{ color: colors.textDim }}>
            Du har <span className="font-bold" style={{ color: colors.text }}>{remainingKcal} kcal</span> kvar av dagens mål —
            förslagen anpassas efter det.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl px-4 py-3 mb-5" style={{ backgroundColor: colors.surfaceMuted }}>
          <p className="text-xs" style={{ color: colors.textDim }}>
            Ställ in dina mål under "Översikt" så kan förslagen anpassas efter hur mycket du har kvar att äta.
          </p>
        </div>
      )}

      {(!flow || flow.step === "results" || flow.step === "error") && (
        <button
          onClick={onTriggerCamera}
          className="w-full rounded-xl py-4 text-sm font-bold mb-6"
          style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
        >
          📷 Fota kylskåp / skafferi
        </button>
      )}

      {flow && flow.step === "analyzing" && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div
            className="w-9 h-9 rounded-full animate-spin"
            style={{ border: `3px solid ${colors.hairline}`, borderTopColor: colors.primary }}
          />
          <p className="text-sm" style={{ color: colors.textDim }}>
            Analyserar innehållet …
          </p>
        </div>
      )}

      {flow && flow.step === "error" && (
        <div
          className="rounded-2xl px-4 py-4 mb-4 text-sm"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}`, color: colors.textDim }}
        >
          {flow.errorMsg}
        </div>
      )}

      {flow && flow.step === "results" && (
        <div className="pb-4">
          {flow.image && <img src={flow.image} alt="" className="w-full h-36 object-cover rounded-xl mb-4" />}

          {flow.ingredients.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold mb-2" style={{ color: colors.textDim }}>
                Vi hittade bland annat
              </p>
              <div className="flex flex-wrap gap-1.5">
                {flow.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: colors.surfaceMuted, color: colors.text }}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm font-bold mb-3">
            Förslag på {SCANNER_CATEGORIES.find((c) => c.key === category)?.label.toLowerCase()}
          </p>

          <div className="flex flex-col gap-3">
            {flow.suggestions.map((s, i) => {
              const added = flow.addedIds && flow.addedIds[i];
              return (
                <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}>
                  <p className="text-sm font-bold mb-1">{s.name}</p>
                  <p className="text-xs mb-3" style={{ color: colors.textDim }}>
                    {s.description}
                  </p>
                  <p className="text-xs mb-3" style={{ color: colors.textDim }}>
                    <span className="font-bold" style={{ color: colors.text }}>
                      {Math.round(s.kcal)} kcal
                    </span>{" "}
                    · P {Math.round(s.protein_g)}g · K {Math.round(s.carbs_g)}g · F {Math.round(s.fat_g)}g · Fi{" "}
                    {Math.round(s.fiber_g)}g
                  </p>
                  <button
                    onClick={() => onAddSuggestion(s, i)}
                    disabled={added}
                    className="w-full rounded-lg py-2.5 text-xs font-bold"
                    style={{
                      backgroundColor: added ? colors.surfaceMuted : colors.primary,
                      color: added ? colors.textDim : colors.onPrimary,
                    }}
                  >
                    {added ? "Tillagt ✓" : `Lägg till i ${SCANNER_CATEGORIES.find((c) => c.key === category)?.label.toLowerCase()}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatHMS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

function formatHoursMinutes(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}


const FASTING_STAGE_GROUPS = [
  {
    title: "Kortare fasta (0–24 timmar)",
    stages: [
      {
        minH: 0,
        maxH: 4,
        title: "Det mätta tillståndet",
        text: "Kroppen bryter ner den senaste måltiden. Blodsocker och insulin stiger för att transportera ut energi till cellerna.",
        color: colors.fat,
      },
      {
        minH: 4,
        maxH: 12,
        title: "Nedbrytningsfasen",
        text: "Blodsocker och insulin börjar sjunka. Kroppen övergår till att använda lagrad energi (glykogen) från lever och muskler.",
        color: colors.protein,
      },
      {
        minH: 12,
        maxH: 16,
        title: "Fettförbränningen startar",
        text: "Glykogenlagren börjar sina. Kroppen ökar fettförbränningen och börjar bilda små mängder ketoner som energi till hjärnan.",
        color: colors.coral,
      },
      {
        minH: 16,
        maxH: 24,
        title: "Autofagi påbörjas",
        text: "Kroppen går in i tidig autofagi, cellernas eget städsystem. Gamla, skadade proteiner och celldelar börjar brytas ner och återvinnas.",
        color: colors.pink,
      },
    ],
  },
  {
    title: "Förlängd fasta (24–72+ timmar)",
    stages: [
      {
        minH: 24,
        maxH: 48,
        title: "Ketos och glukoneogenes",
        text: "Leverns glykogenlager är tomma. Kroppen tillverkar nu socker själv via glukoneogenes och går in i en djupare ketos där fett är det primära bränslet. Autofagin ökar.",
        color: colors.primary,
      },
      {
        minH: 48,
        maxH: 72,
        title: "Tillväxthormon och cellförnyelse",
        text: "Nivåerna av tillväxthormon stiger för att skydda muskelmassa. Inflammation i kroppen minskar och cellsignaleringen förbättras.",
        color: colors.water,
      },
      {
        minH: 72,
        maxH: Infinity,
        title: "Immunförsvaret förnyas",
        text: "Efter tre dygns fasta börjar kroppen bryta ner gamla immunceller och stimulerar stamceller till att skapa nya vita blodkroppar.",
        color: colors.carbs,
      },
    ],
  },
];

function FastingPanel({
  fasting,
  loaded,
  nowTick,
  onStart,
  onEnd,
  methodOpen,
  onOpenMethod,
  onCloseMethod,
  onChooseMethod,
  editingStart,
  onOpenEditStart,
  onCancelEditStart,
  startDraft,
  onStartDraftChange,
  onSaveStart,
  customHours,
  onCustomHoursChange,
  onApplyCustomHours,
}) {
  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div
          className="w-8 h-8 rounded-full animate-spin"
          style={{ border: `3px solid ${colors.hairline}`, borderTopColor: colors.primary }}
        />
      </div>
    );
  }

  const goalSeconds = fasting.fastHours * 3600;
  const elapsedSeconds = fasting.isFasting && fasting.startTime ? (nowTick - new Date(fasting.startTime).getTime()) / 1000 : 0;
  const remainingSeconds = Math.max(0, goalSeconds - elapsedSeconds);
  const fraction = goalSeconds ? elapsedSeconds / goalSeconds : 0;
  const overGoal = elapsedSeconds > goalSeconds;

  const startParts = fasting.startTime
    ? { day: dateLabel(dateKey(new Date(fasting.startTime))), time: new Date(fasting.startTime).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }) }
    : null;
  const targetEndDate = fasting.startTime ? new Date(new Date(fasting.startTime).getTime() + goalSeconds * 1000) : null;
  const endParts = fasting.isFasting && targetEndDate
    ? { day: dateLabel(dateKey(targetEndDate)), time: targetEndDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }) }
    : fasting.lastEnd
    ? { day: dateLabel(dateKey(new Date(fasting.lastEnd))), time: new Date(fasting.lastEnd).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }) }
    : null;

  const elapsedHours = elapsedSeconds / 3600;
  const allStages = FASTING_STAGE_GROUPS.flatMap((g) => g.stages);
  const currentStage = fasting.isFasting ? allStages.find((s) => elapsedHours >= s.minH && elapsedHours < s.maxH) : null;

  const ringSize = 220;
  const radius = ringSize * 0.42;

  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-extrabold">Fasta</h2>
      </div>

      <InfoBanner>
        Välj en fastemetod, tryck "Starta fasta" och håll koll på hur länge du fastat. Fastan avslutas automatiskt och du
        får en fas-uppdatering när målet är nått.
      </InfoBanner>

      {fasting.isFasting && (
        <div className="flex justify-center mb-4">
          <span
            className="rounded-full px-4 py-1.5 text-xs font-bold"
            style={{ backgroundColor: colors.primaryLight, color: colors.primary }}
          >
            {overGoal ? "Fastemål uppnått 🎉" : "Du fastar"}
          </span>
        </div>
      )}

      <div className="flex justify-center py-3 relative" style={{ height: ringSize }}>
        <Ring
          size={ringSize}
          stroke={16}
          baseColor={colors.surfaceMuted}
          overlayColor={currentStage?.color || colors.primary}
          fraction={fraction}
        >
          <div className="flex flex-col items-center px-4">
            <span
              className="text-xs font-semibold text-center"
              style={{ color: fasting.isFasting && currentStage ? currentStage.color : colors.textDim }}
            >
              {fasting.isFasting ? currentStage?.title || "Fastat i" : "Redo att fasta"}
            </span>
            <span className="text-3xl font-extrabold mt-1" style={{ letterSpacing: "-0.02em" }}>
              {fasting.isFasting ? formatHMS(elapsedSeconds) : fasting.method}
            </span>
            {fasting.isFasting && (
              <span className="text-xs mt-1" style={{ color: colors.textDim }}>
                {overGoal ? `${formatHoursMinutes(elapsedSeconds - goalSeconds)} extra` : `Återstår: ${formatHoursMinutes(remainingSeconds)}`}
              </span>
            )}
          </div>
        </Ring>
      </div>

      <div className="flex justify-center mb-5">
        <button
          onClick={onOpenMethod}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
          style={{ backgroundColor: colors.surfaceMuted, color: colors.text }}
        >
          {fasting.method}
          <span style={{ color: colors.textDim }}>⇌</span>
        </button>
      </div>

      {fasting.isFasting ? (
        <button
          onClick={onEnd}
          className="w-full rounded-full py-3.5 text-sm font-bold mb-6 flex items-center justify-center gap-2"
          style={{ backgroundColor: colors.primaryLight, color: colors.primary }}
        >
          ⏸ Avsluta fastan
        </button>
      ) : (
        <button
          onClick={onStart}
          className="w-full rounded-full py-3.5 text-sm font-bold mb-6"
          style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
        >
          Starta fasta
        </button>
      )}

      {(startParts || endParts) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}>
            <p className="text-xs mb-1" style={{ color: colors.textDim }}>
              Starta fasta
            </p>
            {editingStart ? (
              <div className="flex flex-col gap-2">
                <input
                  type="datetime-local"
                  value={startDraft}
                  onChange={(e) => onStartDraftChange(e.target.value)}
                  className="w-full rounded-lg px-2 py-1.5 text-xs"
                  style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                />
                <div className="flex gap-2">
                  <button onClick={onSaveStart} className="text-xs font-bold" style={{ color: colors.primary }}>
                    Spara
                  </button>
                  <button onClick={onCancelEditStart} className="text-xs" style={{ color: colors.textDim }}>
                    Avbryt
                  </button>
                </div>
              </div>
            ) : startParts ? (
              <>
                <p className="text-sm font-bold">{startParts.day}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-base font-extrabold">{startParts.time}</p>
                  {fasting.isFasting && (
                    <button onClick={onOpenEditStart} aria-label="Ändra starttid" style={{ color: colors.primary, fontSize: 12 }}>
                      ✎
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm" style={{ color: colors.textDim }}>
                –
              </p>
            )}
          </div>

          <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}>
            <p className="text-xs mb-1" style={{ color: colors.textDim }}>
              {fasting.isFasting ? "Avsluta fasta" : "Senast avslutad"}
            </p>
            {endParts ? (
              <>
                <p className="text-sm font-bold">{endParts.day}</p>
                <p className="text-base font-extrabold">{endParts.time}</p>
              </>
            ) : (
              <p className="text-sm" style={{ color: colors.textDim }}>
                –
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-base font-extrabold mb-1">Faser under en fasta</h3>
        <p className="text-xs mb-4" style={{ color: colors.textDim }}>
          Generell översikt över vad som händer i kroppen ju längre en fasta pågår
        </p>

        {FASTING_STAGE_GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: colors.textDim }}>
              {group.title}
            </p>
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${colors.hairline}` }}>
              {group.stages.map((s, i) => {
                const isCurrent = fasting.isFasting && elapsedSeconds / 3600 >= s.minH && elapsedSeconds / 3600 < s.maxH;
                const rangeLabel = s.maxH === Infinity ? `${s.minH}+ timmar` : `${s.minH}–${s.maxH} timmar`;
                return (
                  <div
                    key={s.title}
                    className="px-4 py-3"
                    style={{
                      backgroundColor: isCurrent ? `${s.color}1F` : colors.surface,
                      borderTop: i === 0 ? "none" : `1px solid ${colors.hairline}`,
                      transition: "background-color 0.6s ease",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold" style={{ color: isCurrent ? s.color : colors.textDim }}>
                        {rangeLabel}
                      </span>
                      {isCurrent && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: s.color, color: colors.onPrimary }}
                        >
                          Nu
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold mb-1" style={{ color: isCurrent ? s.color : colors.text }}>
                      {s.title}
                    </p>
                    <p className="text-xs" style={{ color: colors.textDim }}>
                      {s.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {methodOpen && (
        <div
          className="fixed inset-0 flex items-end justify-center z-50"
          style={{ backgroundColor: "rgba(15, 17, 21, 0.45)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseMethod();
          }}
        >
          <div
            className="w-full max-w-md rounded-t-2xl px-5 pt-5 pb-6"
            style={{ backgroundColor: colors.surface, maxHeight: "70vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Välj fastemetod</h3>
              <button onClick={onCloseMethod} className="text-lg" style={{ color: colors.textDim }} aria-label="Stäng">
                ×
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {FASTING_METHODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => onChooseMethod(m)}
                  className="w-full rounded-xl px-4 py-3 text-left flex items-center justify-between"
                  style={{
                    backgroundColor: fasting.methodKey === m.key ? colors.primaryLight : colors.surfaceMuted,
                    border: `1px solid ${fasting.methodKey === m.key ? colors.primary : "transparent"}`,
                  }}
                >
                  <span className="text-sm font-bold">{m.label}</span>
                  <span className="text-xs" style={{ color: colors.textDim }}>
                    {m.fastHours}h fasta
                  </span>
                </button>
              ))}
            </div>

            <p className="text-xs mt-4 mb-2" style={{ color: colors.textDim }}>
              Eller ange ett eget antal timmar (upp till 72h)
            </p>
            <div className="flex items-center gap-2">
              <input
                value={customHours}
                onChange={(e) => onCustomHoursChange(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                placeholder="T.ex. 30"
                className="flex-1 rounded-xl px-3 py-2.5 text-sm"
                style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
              />
              <button
                onClick={onApplyCustomHours}
                disabled={!customHours || Number(customHours) <= 0 || Number(customHours) > 72}
                className="rounded-xl px-4 py-2.5 text-sm font-bold"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.onPrimary,
                  opacity: !customHours || Number(customHours) <= 0 || Number(customHours) > 72 ? 0.5 : 1,
                }}
              >
                Använd
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MacroBar({ label, color, value, goal, hideNumbers }) {
  const fraction = goal ? Math.min(1, value / goal) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: colors.textDim }}>
          {label}
        </span>
        {!hideNumbers && (
          <span className="text-xs font-bold">
            {Math.round(value)}g <span style={{ color: colors.textDim, fontWeight: 500 }}>/ {Math.round(goal) || 0}g</span>
          </span>
        )}
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.surfaceMuted }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.round(fraction * 100)}%`, backgroundColor: color, transition: "width 0.3s ease" }}
        />
      </div>
    </div>
  );
}

function MacroRow({ icon, color, label, value, goal }) {
  const fraction = goal ? value / goal : 0;
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div>
        <p className="text-base font-extrabold leading-tight">
          {Math.round(value)} <span className="text-xs font-medium" style={{ color: colors.textDim }}>/ {Math.round(goal) || 0}g</span>
        </p>
        <p className="text-xs" style={{ color: colors.textDim }}>
          {label}
        </p>
      </div>
      <Ring size={40} stroke={4} baseColor={colors.surfaceMuted} overlayColor={color} fraction={fraction}>
        <span style={{ fontSize: 14 }}>{icon}</span>
      </Ring>
    </div>
  );
}

function WalkOffCard({ kcal, weightKg, onAddStepGoal }) {
  const [addedForKcal, setAddedForKcal] = useState(null);
  if (!kcal || kcal <= 0) return null;

  const steps = Math.round((kcal * STEPS_PER_KM) / (KCAL_PER_KG_PER_KM * weightKg));
  const minutes = Math.round(steps / 100);
  const isAdded = addedForKcal === kcal;

  return (
    <div className="rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: colors.surfaceMuted }}>
      <p className="text-xs mb-2" style={{ color: colors.textDim }}>
        🚶 Det här motsvarar{" "}
        <span className="font-bold" style={{ color: colors.text }}>
          {steps.toLocaleString("sv-SE")} steg
        </span>{" "}
        eller{" "}
        <span className="font-bold" style={{ color: colors.text }}>
          {minutes} minuters promenad
        </span>
      </p>
      <button
        onClick={() => {
          onAddStepGoal(steps);
          setAddedForKcal(kcal);
        }}
        disabled={isAdded}
        className="text-xs font-bold"
        style={{ color: isAdded ? colors.textDim : colors.primary }}
      >
        {isAdded ? "Tillagt i dagens stegmål ✓" : "Lägg till som stegmål"}
      </button>
    </div>
  );
}

function MacroInput({ label, value, onChange, decimal }) {
  return (
    <div>
      <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, ""))}
        inputMode={decimal ? "decimal" : "numeric"}
        placeholder="0"
        className="w-full rounded-lg px-2 py-2.5 text-sm text-center"
        style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
      />
    </div>
  );
}

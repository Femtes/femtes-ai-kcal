import React, { useState, useRef, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { logout } from "./lib/auth.js";

const colors = {
  bg: "#121317",
  surface: "#1C1E24",
  surfaceMuted: "#26282F",
  text: "#F5F6F8",
  textDim: "#8B8D97",
  hairline: "#33353D",
  primary: "#8DC63F",
  primaryLight: "#1E2A14",
  water: "#3FB6D3",
  carbs: "#3FBF7F",
  protein: "#F0924B",
  fat: "#E8C34F",
  fiber: "#B98B5E",
  coral: "#FF6B4A",
  pink: "#F0567F",
  onPrimary: "#14180D",
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
  { key: "news", label: "Nyheter" },
  { key: "help", label: "Hjälp" },
  { key: "legal", label: "Legal" },
];

const CHANGELOG = [
  {
    version: "0.3.0",
    date: "2026-09-06",
    headline: "Riktig databas, ny meny och grön design",
    headline_en: "Real database, new menu and green design",
    summary: [
      "All data sparas nu i en riktig databas — försvinner aldrig vid uppdateringar",
      "Ny hamburgermeny istället för flikrad",
      "Möjlighet att logga ut",
      "Ny grön design som matchar logotypen",
    ],
    summary_en: [
      "All data is now saved in a real database — never disappears when the app is updated",
      "New hamburger menu instead of a tab row",
      "Ability to log out",
      "New green design matching the logo",
    ],
    details: [
      "Bytt lagring från webbläsarens tillfälliga minne till en riktig databas kopplad till ditt konto — dina uppgifter finns kvar oavsett enhet eller uppdatering.",
      "Navigeringen är omgjord till en hamburgermeny (☰) till vänster om logotypen istället för en flikrad.",
      "Lagt till en utloggningsknapp i menyn.",
      "Hela appens färgschema är omgjort från lila till grönt för att matcha den nya logotypen.",
      "Lagt till den här nyhetsfliken samt en popup som visar vad som är nytt efter en uppdatering.",
    ],
    details_en: [
      "Switched storage from the browser's temporary memory to a real database tied to your account — your data stays put no matter the device or update.",
      "Navigation has been redesigned into a hamburger menu (☰) to the left of the logo instead of a tab row.",
      "Added a log-out button in the menu.",
      "The entire app colour scheme has been changed from purple to green to match the new logo.",
      "Added this news tab as well as a popup showing what's new after an update.",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-09-05",
    headline: "Logotyp och juridisk information",
    headline_en: "Logo and legal information",
    summary: ["Ny logotyp på plats", "Juridisk info och copyright tillagt", "Tydlig beta-märkning"],
    summary_en: ["New logo in place", "Legal info and copyright added", "Clear beta labelling"],
    details: [
      "Lagt till appens riktiga logotyp på inloggningssidan, i headern och som favicon.",
      "Ny flik 'Legal' med användarvillkor och ansvarsbegränsning.",
      "Copyright-text tillagd på inloggningssidan.",
      "Tydlig BETA-markering så användare vet att appen fortfarande testas.",
    ],
    details_en: [
      "Added the app's real logo to the login screen, the header and as the favicon.",
      "New 'Legal' tab with terms of use and disclaimer.",
      "Copyright text added to the login screen.",
      "Clear BETA labelling so users know the app is still being tested.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-09-01",
    headline: "Första betaversionen",
    headline_en: "First beta version",
    summary: ["Kalorispårning, träning, fasta, vikt och trender", "Kontosystem med inloggning"],
    summary_en: ["Calorie tracking, training, fasting, weight and trends", "Account system with login"],
    details: [
      "Första publika testversionen av Calio Bite.",
      "Daglig kaloribudget, måltidsloggning, träningsspårning, fasteschema, viktlogg och trender.",
      "Riktiga konton med registrering och inloggning.",
    ],
    details_en: [
      "First public test version of Calio Bite.",
      "Daily calorie budget, meal logging, training tracking, fasting schedule, weight log and trends.",
      "Real accounts with sign-up and login.",
    ],
  },
];

const APP_VERSION = CHANGELOG[0].version;
const LAST_SEEN_VERSION_KEY = "app-last-seen-version";
const LANGUAGE_KEY = "app-language";

const LANGUAGES = [
  { code: "sv", flag: "🇸🇪", label: "Svenska" },
  { code: "en", flag: "🇬🇧", label: "English" },
];

const TAB_LABELS_EN = {
  budget: "Overview",
  scanner: "Meal Scanner",
  training: "Training",
  fasting: "Fasting",
  trends: "Trends",
  weight: "Weight",
  news: "News",
  help: "Help",
  legal: "Legal",
};

function getTabLabel(key, language) {
  if (language === "en" && TAB_LABELS_EN[key]) return TAB_LABELS_EN[key];
  return TABS.find((t) => t.key === key)?.label || "";
}

const EN_STRINGS = {
  "Idag": "Today",
  "Igår": "Yesterday",
  "✎ Redigera": "✎ Edit",
  "🌿 Sifferfritt läge": "🌿 Number-free mode",
  "🔢 Visa siffror": "🔢 Show numbers",
  "Dagens mål": "Today's goal",
  "Lägg in vikt och längd för att räkna ut ditt dagliga kalorimål": "Enter your weight and height to calculate your daily calorie goal",
  "Ställ in mål": "Set goal",
  "Konsumerat": "Consumed",
  "Bränt": "Burned",
  "kcal kvar": "kcal left",
  "kcal över": "kcal over",
  "Mål": "Goal",
  "Mål idag": "Goal today",
  "Stäng av": "Turn off",
  "Kolhydrater": "Carbs",
  "Protein": "Protein",
  "Fett": "Fat",
  "Fiber": "Fiber",
  "kg CO2e idag": "kg CO2e today",
  "kr på mat idag": "spent on food today",
  "Vatten": "Water",
  "ml": "ml",
  "Ångra senaste": "Undo last",
  "Skapa eller spara ett recept": "Create or save a recipe",
  "Låt AI:n komma på ett recept utifrån vad du har eller vill äta, eller spara ditt eget favoritrecept för att snabbt logga det igen senare.":
    "Let AI come up with a recipe based on what you have or want to eat, or save your own favourite recipe to quickly log it again later.",
  "🤖 Skapa med AI": "🤖 Create with AI",
  "✏️ Eget recept": "✏️ My own recipe",
  "Recept": "Recipe",
  "Recept med AI": "AI recipe",
  "Eget recept": "My recipe",
  "Har du några ingredienser du vill utgå från? Lämna tomt så hittar AI:n på något gott själv.":
    "Do you have any ingredients you'd like to use? Leave it blank and AI will come up with something tasty on its own.",
  "T.ex. kyckling, broccoli, ris": "E.g. chicken, broccoli, rice",
  "✨ Skapa recept": "✨ Create recipe",
  "Komponerar ett recept …": "Composing a recipe …",
  "Något gick fel. Försök igen om en stund.": "Something went wrong. Please try again shortly.",
  "Försök igen": "Try again",
  "Ingredienser": "Ingredients",
  "Gör så här": "Instructions",
  "Lägg till i": "Add to",
  "Logga och spara": "Log and save",
  "Spara bara i biblioteket (logga inte nu)": "Only save to library (don't log now)",
  "Namn på receptet": "Recipe name",
  "T.ex. Mammas köttbullar": "E.g. Grandma's meatballs",
  "Ingredienser (en per rad, valfritt)": "Ingredients (one per line, optional)",
  "Gör så här (valfritt)": "Instructions (optional)",
  "Kalorier": "Calories",
  "Kalorier (kcal)": "Calories (kcal)",
  "Protein (g)": "Protein (g)",
  "Kolhydrater (g)": "Carbs (g)",
  "Fett (g)": "Fat (g)",
  "Fibrer (g)": "Fiber (g)",
  "Lägg till i (valfritt)": "Add to (optional)",
  "Logga och spara recept": "Log and save recipe",
  "Spara recept": "Save recipe",
  "Måltider": "Meals",
  "Ändra fördelning": "Edit distribution",
  "Frukost": "Breakfast",
  "Lunch": "Lunch",
  "Mellanmål": "Snack",
  "Middag": "Dinner",
  "Övrigt": "Other",
  "Inget tillagt än": "Nothing added yet",
  "Lägg till manuellt": "Add manually",
  "Fota maträtt": "Photograph meal",
  "🔍 Sök livsmedel": "🔍 Search food",
  "🎙️ Beskriv med ord": "🎙️ Describe with words",
  "🤝 Hämta delad måltid": "🤝 Get a shared meal",
  "Läser av maträtten …": "Analysing the meal …",
  "Kunde inte identifiera någon mat i bilden. Försök igen med bättre belysning, eller lägg in maträtten manuellt.":
    "Couldn't identify any food in the photo. Try again with better lighting, or add the meal manually.",
  "Något gick fel vid analysen. Försök igen, eller lägg in maträtten manuellt.":
    "Something went wrong during analysis. Try again, or add the meal manually.",
  "Försök fota igen": "Try photographing again",
  "Maträtt": "Meal",
  "T.ex. Kycklingsallad": "E.g. Chicken salad",
  "Kalorier (kcal)v2": "Calories (kcal)",
  "Klimat & plånbok (valfritt)": "Climate & wallet (optional)",
  "CO2 (kg)": "CO2 (kg)",
  "Kostnad (kr)": "Cost",
  "Spara ändringar": "Save changes",
  "Beskriv vad du åt med egna ord — tryck gärna på mikrofonen i din tangentbord för att diktera istället för att skriva.":
    "Describe what you ate in your own words — feel free to use your keyboard's microphone to dictate instead of typing.",
  "Analyserar …": "Analysing …",
  "Analysera": "Analyse",
  "Vi tolkade det här — ta bort något som blev fel innan du lägger till": "Here's what we understood — remove anything that's wrong before adding",
  "Kunde inte tolka någon mat ur texten. Försök beskriva det lite tydligare.": "Couldn't understand any food from the text. Try describing it a bit more clearly.",
  "Något gick fel vid tolkningen. Försök igen, eller lägg till manuellt.": "Something went wrong while interpreting. Try again, or add manually.",
  "livsmedel": "items",
  "Sök efter livsmedel": "Search for food",
  "Sök livsmedel, t.ex. mjölk": "Search for food, e.g. milk",
  "Sök": "Search",
  "Söker …": "Searching …",
  "Mina livsmedel": "My foods",
  "Dina senaste": "Your recent items",
  "Eller sök på nätet": "Or search online",
  "valda — sök gärna på fler rätter att lägga till i samma måltid": "selected — feel free to search for more dishes to add to the same meal",
  "Inga träffar. Prova ett annat sökord.": "No results. Try a different search term.",
  "Namnge kombinationen (valfritt)": "Name the combination (optional)",
  "Lägg till": "Add",
  "Be din vän om koden de fick när de delade måltiden, och skriv in den här.": "Ask your friend for the code they got when sharing the meal, and enter it here.",
  "T.ex. A7K2M": "E.g. A7K2M",
  "Hittade ingen måltid med den koden. Kolla att den stämmer, eller be din vän dela igen.": "Couldn't find a meal with that code. Double-check it, or ask your friend to share again.",
  "Hämtar …": "Fetching …",
  "Hämta måltid": "Get meal",
  "Dela måltid": "Share meal",
  "Skicka den här koden till din vän (t.ex. via SMS) — de kan hämta måltiden i sin egen app under": "Send this code to your friend (e.g. via text) — they can get the meal in their own app under",
  "Koden lagras i ett delat utrymme som tekniskt sett går att nå av andra som använder samma app om de gissar koden — dela den bara med personer du litar på.":
    "The code is stored in a shared space that could technically be reached by others using the same app if they guess the code — only share it with people you trust.",
  "Klar": "Done",
  "Kunde inte dela just nu. Försök igen om en stund.": "Couldn't share right now. Please try again shortly.",
  "Dina mål": "Your goals",
  "Kvinna": "Female",
  "Man": "Male",
  "Ålder": "Age",
  "Vikt (kg)": "Weight (kg)",
  "Längd (cm)": "Height (cm)",
  "Aktivitetsnivå": "Activity level",
  "Stillasittande": "Sedentary",
  "Lite eller ingen träning": "Little or no exercise",
  "Lätt aktiv": "Lightly active",
  "Träning 1–3 ggr/vecka": "Exercise 1–3 times/week",
  "Måttligt aktiv": "Moderately active",
  "Träning 3–5 ggr/vecka": "Exercise 3–5 times/week",
  "Mycket aktiv": "Very active",
  "Träning 6–7 ggr/vecka": "Exercise 6–7 times/week",
  "Gå ner i vikt": "Lose weight",
  "Behålla vikt": "Maintain weight",
  "Gå upp i vikt": "Gain weight",
  "Beräknat dagsmål": "Calculated daily goal",
  "Justera målen manuellt": "Adjust goals manually",
  "Använd beräknat mål istället": "Use calculated goal instead",
  "Spara mål": "Save goal",
  "Fördelning per måltid": "Distribution per meal",
  "Som standard delas ditt dagsmål upp automatiskt. Fått andra siffror av t.ex. en dietist? Ange dem här så används de istället.":
    "By default your daily goal is split up automatically. Got different numbers from e.g. a dietitian? Enter them here to use those instead.",
  "Spara fördelning": "Save distribution",
  "Återställ till automatisk fördelning": "Reset to automatic distribution",
  "Hämtar loggen …": "Loading the log …",
  "Hämtar kalender …": "Loading calendar …",
  "Bra jobbat! 🔥": "Nice work! 🔥",
  "Du har bränt": "You've burned",
  "kcal mer än vanligt idag. Det ger marginal för ett större mellanmål.": "kcal more than usual today. That leaves room for a bigger snack.",
  "Visa förslag →": "Show suggestions →",
  "Förslag på mellanmål": "Snack suggestions",
  "Tillagt ✓": "Added ✓",
  "Lägg till i mellanmål": "Add to snacks",
  "Ta bort": "Remove",
  "Stäng": "Close",
  "Öppna meny": "Open menu",
  "Stäng meny": "Close menu",
  "Information om fliken": "Information about this tab",
  "Okej": "Got it",
  "NYTT": "NEW",
  "Tryck här för att läsa mer": "Tap here to read more",
  "Allt som är nytt i Calio Bite, senaste versionen överst.": "Everything new in Calio Bite, latest version first.",
  "Tryck på ett ämne nedan för att öppna en steg-för-steg-guide för just den delen av appen.":
    "Tap a topic below to open a step-by-step guide for that part of the app.",
  "Villkor och ansvarsbegränsning för Calio Bite.": "Terms and disclaimer for Calio Bite.",
  "Alla rättigheter förbehållna.": "All rights reserved.",
  "Träning för": "Training for",
  "Steg idag": "Steps today",
  "Stegmål": "Step goal",
  "Bränt idag": "Burned today",
  "Lägg till träningspass": "Add exercise",
  "Redigera träningspass": "Edit exercise",
  "Typ av träning": "Type of exercise",
  "Minuter": "Minutes",
  "Kilometer": "Kilometres",
  "Antal steg": "Number of steps",
  "Beräknat kaloriförbrukning": "Estimated calories burned",
  "Spara pass": "Save session",
  "Inga träningspass loggade idag": "No exercise logged today",
  "Fördelning per aktivitet": "Breakdown per activity",
  "Du fastar": "You're fasting",
  "Återstår": "Remaining",
  "Starta fasta": "Start fast",
  "Avsluta fastan": "End fast",
  "Fastemetod": "Fasting method",
  "Eget antal timmar": "Custom number of hours",
  "timmar": "hours",
  "Startade": "Started",
  "Ändra starttid": "Change start time",
  "Nu": "Now",
  "Bläddra mellan veckor och tryck på en dag för att se detaljer": "Browse between weeks and tap a day to see details",
  "Sammanfattning": "Summary",
  "Ställ in dina mål under": "Set your goals under",
  "för att se sammanfattningen": "to see the summary",
  "kvar": "left",
  "Specifikation & Makrovärden": "Breakdown & Macro values",
  "Näringsämne": "Nutrient",
  "Mängd / Energiandel": "Amount / Energy share",
  "Muskelreparation & mättnad": "Muscle repair & satiety",
  "Hjärnans & musklernas primära bränsle": "Primary fuel for brain & muscles",
  "Hormonreglering & essentiella fettsyror": "Hormone regulation & essential fatty acids",
  "Matsmältning & jämn blodsockerreglering": "Digestion & steady blood sugar",
  "Kostfiber": "Dietary fiber",
  "Logga din vikt för att se utvecklingen över tid": "Log your weight to see progress over time",
  "Lägg in din längd under": "Enter your height under",
  "och logga en vikt för att se ditt BMI": "and log a weight to see your BMI",
  "Vikt (kg)v2": "Weight (kg)",
  "Datum": "Date",
  "Ingen vikt loggad än": "No weight logged yet",
  "Undervikt": "Underweight",
  "Hälsosam vikt": "Healthy weight",
  "Övervikt": "Overweight",
  "Fetma": "Obesity",
  "Visa mer": "Show more",
  "Visa mindre": "Show less",
  "BMI-kategorier": "BMI categories",
  "BMI räknas ut som vikt (kg) delat med längd (m) i kvadrat. Det är ett grovt mått och tar t.ex. inte hänsyn till muskelmassa.":
    "BMI is calculated as weight (kg) divided by height (m) squared. It's a rough measure and doesn't account for e.g. muscle mass.",
  "Fota insidan av ditt kylskåp eller skafferi": "Photograph the inside of your fridge or pantry",
  "Vad kan du laga": "What can you cook",
  "Identifierade ingredienser": "Identified ingredients",
  "Läser av kylskåpet …": "Reading the fridge …",
  "Kunde inte identifiera mat i bilden. Försök med bättre belysning.": "Couldn't identify food in the photo. Try better lighting.",
  "Förslag": "Suggestions",
  "Du låg": "You were",
  "Summa": "Total",
  "Dagsmål": "Daily goal",
  "Uppskattad förbränning": "Estimated calories burned",
  "Antal kilometer": "Number of kilometres",
  "Så länge du är i den gröna zonen är allt bra — inga siffror att fixera vid idag.":
    "As long as you're in the green zone, everything's fine — no numbers to fixate on today.",
  "Inga träffar. Prova ett annat sökord, eller lägg till maträtten manuellt.":
    "No results. Try a different search term, or add the meal manually.",
  "Hittar du inte det du söker? Lägg till manuellt": "Can't find what you're looking for? Add manually",
  "Namn på måltiden": "Name of the meal",
  "📷 Lägg till bild (valfritt)": "📷 Add photo (optional)",
  "Äter du för mycket en dag jämnas det ut med ett lite lägre mål resten av veckan":
    "If you eat too much one day, it's evened out with a slightly lower goal for the rest of the week",
  "Beräkning av BMI": "How BMI is calculated",
  "dagligt mål": "daily goal",
  "Träningspass": "Exercise session",
  "Vad vill du ha förslag på?": "What would you like suggestions for?",
  "så kan förslagen anpassas efter hur mycket du har kvar att äta.": "so suggestions can be tailored to how much you have left to eat.",
  "📷 Fota kylskåp / skafferi": "📷 Photograph fridge / pantry",
  "Analyserar innehållet …": "Analysing the contents …",
  "Generell översikt över vad som händer i kroppen ju längre en fasta pågår": "General overview of what happens in the body the longer a fast continues",
  "Välj fastemetod": "Choose fasting method",
};

function tr(text, language) {
  if (language === "en") return EN_STRINGS[text] || text;
  return text;
}

function aiLangInstruction(language) {
  return language === "en"
    ? " Respond in English (all text fields, names and descriptions should be in English)."
    : " Svara på svenska.";
}

const TAB_INFO = {
  budget:
    "Detta är din dagliga översikt. Bläddra mellan dagar med veckoremsan, se hur mycket kalorier och makron du har kvar, och tryck på + vid en måltid för att logga vad du ätit.",
  scanner:
    "Fota insidan av ditt kylskåp eller skafferi, så föreslår Calio Bite måltider utifrån vad du har hemma och hur mycket du har kvar av dagens kalorimål.",
  training:
    "Logga steg och träningspass här. Kalorierna du bränner räknas automatiskt in i dagens budget på Översikt-fliken.",
  fasting:
    "Välj en fastemetod, tryck \"Starta fasta\" och håll koll på hur länge du fastat. Fastan avslutas automatiskt och du får en fas-uppdatering när målet är nått.",
  trends:
    "Här kan du gå tillbaka i historiken vecka för vecka. Tryck på en dag för att se just den dagens kalorier och makron i detalj.",
  weight:
    "Logga din vikt regelbundet för att se utvecklingen som en graf över tid, och håll koll på ditt uträknade BMI högst upp.",
  news: "Allt som är nytt i Calio Bite, senaste versionen överst.",
  help: "Tryck på ett ämne för att öppna en steg-för-steg-guide för just den delen av appen.",
  legal: "Villkor och ansvarsbegränsning för Calio Bite.",
};

function InfoIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9.5" stroke={colors.primary} strokeWidth="2" />
      <circle cx="12" cy="7.7" r="1.4" fill={colors.primary} />
      <rect x="10.6" y="10.5" width="2.8" height="7" rx="0.5" fill={colors.primary} />
    </svg>
  );
}

function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

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
  swim: "#3FB6D3",
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNewsPopup, setShowNewsPopup] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
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
  const [recipeFlow, setRecipeFlow] = useState(null);
  const [language, setLanguage] = useState("sv");
  const [helpOpenTopic, setHelpOpenTopic] = useState(null);
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
        const res = await window.storage.get(LAST_SEEN_VERSION_KEY, false);
        const seen = res && res.value;
        if (!seen || compareVersions(APP_VERSION, seen) > 0) setShowNewsPopup(true);
      } catch (e) {
        // ingen tidigare version sparad — visa popupen (första inloggningen)
        setShowNewsPopup(true);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(LANGUAGE_KEY, false);
        if (res && res.value) setLanguage(res.value);
      } catch (e) {}
    })();
  }, []);

  function changeLanguage(code) {
    setLanguage(code);
    window.storage.set(LANGUAGE_KEY, code, false).catch(() => {});
  }

  function dismissNewsPopup() {
    setShowNewsPopup(false);
    window.storage.set(LAST_SEEN_VERSION_KEY, APP_VERSION, false).catch(() => {});
  }

  function openNewsFromPopup() {
    setActiveTab("news");
    dismissNewsPopup();
  }

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
            "Du är en assistent som tolkar en fritextbeskrivning av en måltid och delar upp den i separata livsmedel. Användaren kan nämna flera saker i en och samma mening, t.ex. \"Åt en skål havregrynsgröt med en banan och en skvätt lättmjölk\". Identifiera varje separat livsmedel som nämns, uppskatta en rimlig portionsstorlek utifrån beskrivningen (t.ex. \"en skål\", \"en banan\", \"en skvätt\") och ange näringsvärden, klimatavtryck och kostnad för just den portionen. Svara ENDAST med giltig JSON, utan markdown-formatering, utan kodblock, utan inledande text, i denna form: [{\"name\": string (livsmedelsnamn, inkl. uppskattad mängd, t.ex. \"Havregrynsgröt (1 skål)\"), \"kcal\": number, \"protein_g\": number, \"carbs_g\": number, \"fat_g\": number, \"fiber_g\": number, \"co2_kg\": number (uppskattat klimatavtryck i kg CO2e för portionen), \"cost_sek\": number (uppskattad kostnad i svenska kronor för portionen)}]. Om texten inte verkar beskriva någon mat, svara med en tom array []." +
            aiLangInstruction(language),
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
            "Du är en assistent som uppskattar näringsinnehåll, klimatavtryck och kostnad för mat från bilder. Svara ENDAST med giltig JSON, utan markdown-formatering, utan kodblock, utan inledning. Använd exakt denna form: {\"name\": string (kort maträttsnamn), \"portion_note\": string (kort kommentar om uppskattad portionsstorlek), \"kcal\": number, \"protein_g\": number, \"carbs_g\": number, \"fat_g\": number, \"fiber_g\": number, \"co2_kg\": number (uppskattat klimatavtryck i kg CO2e för portionen, baserat på ingredienserna), \"cost_sek\": number (uppskattad kostnad i svenska kronor för portionen, baserat på ungefärliga svenska matvarupriser), \"confidence\": string (en av 'låg', 'medel', 'hög')}. Om bilden inte visar mat, svara med {\"error\": \"no_food_detected\"}." +
            aiLangInstruction(language),
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
            `Du är en assistent som hjälper användare att komma på måltidsförslag utifrån vad de har hemma i kylskåp eller skafferi. Titta på bilden och identifiera synliga råvaror. Föreslå sedan 2-3 olika förslag på "${mealLabel}" som huvudsakligen använder dessa råvaror. ${budgetLine} Svara ENDAST med giltig JSON, utan markdown-formatering, utan kodblock, utan inledande text, i denna form: {"ingredients": [string, ...], "suggestions": [{"name": string, "description": string (kort, en till två meningar), "kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number, "fiber_g": number}]}. Om bilden inte visar mat, ett kylskåp eller ett skafferi, svara med {"error": "no_food_detected"}.` +
            aiLangInstruction(language),
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
            `Du är en assistent som föreslår mellanmål. Föreslå 3 olika, varierade mellanmål som ligger nära ${targetKcal} kcal styck. Svara ENDAST med giltig JSON, utan markdown-formatering, utan kodblock, utan inledande text, i denna form: [{"name": string, "description": string (kort, en mening), "kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number, "fiber_g": number}]` +
            aiLangInstruction(language),
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

  function closeRecipeFlow() {
    setRecipeFlow(null);
  }

  function openRecipeAI() {
    setRecipeFlow({ step: "ai-input", ingredients: "", category: "lunch" });
  }

  function openRecipeManual() {
    setRecipeFlow({
      step: "manual",
      category: "lunch",
      name: "",
      ingredientsText: "",
      instructions: "",
      kcal: "",
      protein: "",
      carbs: "",
      fat: "",
      fiber: "",
    });
  }

  function updateRecipeFlow(field, value) {
    setRecipeFlow((f) => ({ ...f, [field]: value }));
  }

  async function generateRecipeAI() {
    const ingredients = recipeFlow && recipeFlow.ingredients ? recipeFlow.ingredients.trim() : "";
    setRecipeFlow((f) => ({ ...f, step: "ai-loading" }));

    let budgetLine = "Föreslå ett balanserat recept med rimliga proportioner.";
    if (goals) {
      const remKcal = Math.max(0, goals.kcalGoal - consumed.kcal);
      budgetLine = `Receptet ska vara en portion på ungefär ${remKcal} kcal eller mindre, så det passar användarens återstående dagsmål.`;
    }
    const ingredientLine = ingredients
      ? `Utgå gärna från dessa ingredienser om möjligt: ${ingredients}.`
      : "Användaren har inte angett några särskilda ingredienser — hitta på ett gott, enkelt recept.";

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system:
            `Du är en assistent som skapar recept. ${ingredientLine} ${budgetLine} Svara ENDAST med giltig JSON, utan markdown-formatering, utan kodblock, utan inledande text, i denna form: {"name": string (receptnamn), "ingredients": [string, ...] (varje ingrediens med ungefärlig mängd), "instructions": [string, ...] (steg för steg, korta meningar), "kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number, "fiber_g": number}. Värdena för näring ska gälla hela portionen/receptet.` +
            aiLangInstruction(language),
          text: "Skapa ett recept åt mig.",
          image: null,
        }),
      });
      const data = await response.json();
      const raw = data.text || "";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const recipe = JSON.parse(cleaned);
      setRecipeFlow((f) => ({ ...f, step: "ai-result", recipe }));
    } catch (e) {
      setRecipeFlow((f) => ({ ...f, step: "ai-error" }));
    }
  }

  function saveRecipeToLibraryAndMaybeLog(recipe, categoryKey) {
    const entry = {
      id: Date.now(),
      name: recipe.name,
      kcal: Math.round(recipe.kcal) || 0,
      protein: Math.round(recipe.protein_g ?? recipe.protein) || 0,
      carbs: Math.round(recipe.carbs_g ?? recipe.carbs) || 0,
      fat: Math.round(recipe.fat_g ?? recipe.fat) || 0,
      fiber: Math.round(recipe.fiber_g ?? recipe.fiber) || 0,
      portion_note: Array.isArray(recipe.ingredients) ? recipe.ingredients.join(", ") : "",
      image: null,
      emoji: guessFoodEmoji(recipe.name),
    };
    upsertFoodLibrary(entry);
    if (categoryKey) {
      updateDay({ ...dayData, [categoryKey]: [entry, ...dayData[categoryKey]] });
    }
    closeRecipeFlow();
  }

  function saveManualRecipe(categoryKey) {
    if (!recipeFlow || !recipeFlow.name || !recipeFlow.name.trim() || recipeFlow.kcal === "") return;
    const recipe = {
      name: recipeFlow.name.trim(),
      ingredients: recipeFlow.ingredientsText
        ? recipeFlow.ingredientsText.split("\n").map((s) => s.trim()).filter(Boolean)
        : [],
      kcal: Number(recipeFlow.kcal) || 0,
      protein_g: Number(recipeFlow.protein) || 0,
      carbs_g: Number(recipeFlow.carbs) || 0,
      fat_g: Number(recipeFlow.fat) || 0,
      fiber_g: Number(recipeFlow.fiber) || 0,
    };
    saveRecipeToLibraryAndMaybeLog(recipe, categoryKey);
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
        <div className="px-5 pt-6 pb-4 flex items-center justify-between gap-3 relative">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label={tr("Öppna meny", language)}
              className="w-8 h-8 flex items-center justify-center flex-shrink-0"
            >
              <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                <rect y="0" width="20" height="2.4" rx="1.2" fill="#FFFFFF" />
                <rect y="6.8" width="20" height="2.4" rx="1.2" fill="#FFFFFF" />
                <rect y="13.6" width="20" height="2.4" rx="1.2" fill="#FFFFFF" />
              </svg>
            </button>
            <img src="/logo.png" alt="Calio Bite" className="h-7 w-auto flex-shrink-0" style={{ objectFit: "contain" }} />
          </div>
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
              v{APP_VERSION}
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

        {/* Language selector */}
        <div className="px-5 mb-3 flex items-center justify-end gap-1.5">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => changeLanguage(l.code)}
              aria-label={l.label}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
              style={{
                border: language === l.code ? `1.5px solid ${colors.primary}` : `1px solid ${colors.hairline}`,
                opacity: language === l.code ? 1 : 0.5,
              }}
            >
              {l.flag}
            </button>
          ))}
        </div>

        {/* Current tab label with info icon */}
        <div className="px-5 mb-5 flex items-center justify-between">
          <h1 className="text-lg font-extrabold">{getTabLabel(activeTab, language)}</h1>
          <button onClick={() => setInfoOpen(true)} aria-label={tr("Information om fliken", language)} className="flex-shrink-0">
            <InfoIcon />
          </button>
        </div>

        {infoOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 px-6"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => setInfoOpen(false)}
          >
            <div
              className="w-full max-w-xs rounded-2xl px-5 py-5"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-3">
                <InfoIcon size={18} />
                <h3 className="text-sm font-bold">{TABS.find((t) => t.key === activeTab)?.label}</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: colors.textDim, lineHeight: 1.6 }}>
                {TAB_INFO[activeTab]}
              </p>
              <button
                onClick={() => setInfoOpen(false)}
                className="w-full rounded-full py-2.5 text-xs font-bold"
                style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
              >{tr("Okej", language)}</button>
            </div>
          </div>
        )}

        {menuOpen && (
          <div
            className="fixed inset-0 z-50 flex"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => setMenuOpen(false)}
          >
            <div
              className="h-full flex flex-col"
              style={{ width: "78%", maxWidth: 300, backgroundColor: "#0B0B0D", borderRight: `1px solid ${colors.hairline}` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 pt-6 pb-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${colors.hairline}` }}>
                <img src="/logo.png" alt="Calio Bite" className="h-7 w-auto" style={{ objectFit: "contain" }} />
                <button onClick={() => setMenuOpen(false)} aria-label={tr("Stäng meny", language)} style={{ color: "#FFFFFF", fontSize: 20 }}>
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => {
                      setActiveTab(t.key);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-5 py-3.5 text-sm font-semibold"
                    style={{
                      color: activeTab === t.key ? colors.primary : "#FFFFFF",
                      backgroundColor: activeTab === t.key ? colors.primaryLight : "transparent",
                    }}
                  >
                    {getTabLabel(t.key, language)}
                  </button>
                ))}
              </div>
              <div className="px-5 py-4" style={{ borderTop: `1px solid ${colors.hairline}` }}>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left text-sm font-semibold"
                  style={{ color: colors.coral }}
                >
                  {language === "en" ? "Log out" : "Logga ut"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "budget" && (
          <>
        <div className="px-5">
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
                  <span className="font-bold">{tr("Bra jobbat! 🔥", language)}</span> Du har bränt {reactiveBurn.surplus} kcal mer än vanligt
                  idag. Det ger marginal för ett större mellanmål.
                </p>
                <button
                  onClick={() => setReactiveDismissed(true)}
                  aria-label={tr("Stäng", language)}
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
              >{tr("Visa förslag →", language)}</button>
            </div>
          </div>
        )}

        {/* Budget */}
        {!dayLoading && !profileLoading && (
          <div className="px-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-extrabold">{tr("Dagens mål", language)}</h2>
              <div className="flex items-center gap-3">
                <button onClick={toggleVisualMode} className="text-xs font-semibold" style={{ color: colors.primary }}>
                  {visualMode ? "🔢 Visa siffror" : "🌿 Sifferfritt läge"}
                </button>
                <button onClick={openProfile} className="text-xs font-semibold" style={{ color: colors.primary }}>{tr("✎ Redigera", language)}</button>
              </div>
            </div>

            {!goals ? (
              <div
                className="rounded-2xl px-4 py-6 text-center"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}
              >
                <p className="text-sm mb-3" style={{ color: colors.textDim }}>{tr("Lägg in vikt och längd för att räkna ut ditt dagliga kalorimål", language)}</p>
                <button
                  onClick={openProfile}
                  className="rounded-full px-5 py-2.5 text-sm font-bold"
                  style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
                >{tr("Ställ in mål", language)}</button>
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
                      {tr("Så länge du är i den gröna zonen är allt bra — inga siffror att fixera vid idag.", language)}
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
                        <span className="text-[10px] mt-1" style={{ color: colors.textDim }}>{tr("Konsumerat", language)}</span>
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
                            {consumed.kcal > goals.kcalGoal ? tr("kcal över", language) : tr("kcal kvar", language)}
                          </span>
                        </div>
                      </SemiGauge>

                      <div className="flex flex-col items-end pb-2">
                        <span className="text-lg font-extrabold">{burnedToday}</span>
                        <span className="text-[10px] font-medium" style={{ color: colors.textDim }}>
                          kcal
                        </span>
                        <span className="text-[10px] mt-1" style={{ color: colors.textDim }}>{tr("Bränt", language)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-center -mt-1 mb-1" style={{ color: colors.textDim }}>
                      {weeklyCalc && weeklyCalc.adjustedGoal !== goals.kcalGoal ? (
                        <>
                          {tr("Mål idag", language)} {effectiveKcalGoal} kcal{" "}
                          <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{goals.kcalGoal}</span>
                        </>
                      ) : (
                        <>{tr("Mål", language)} {goals.kcalGoal} kcal</>
                      )}
                    </p>

                    {weeklyCalc && Math.abs(weeklyCalc.pastSurplus) >= 50 && (
                      <div className="rounded-xl px-4 py-3 mt-3 mb-1" style={{ backgroundColor: colors.surfaceMuted }}>
                        <p className="text-xs" style={{ color: colors.textDim }}>
                          {weeklyCalc.pastSurplus > 0 ? (
                            <>
                              {tr("Du låg", language)} <span className="font-bold" style={{ color: colors.text }}>{weeklyCalc.pastSurplus} kcal</span>{" "}
                              {language === "en"
                                ? `over earlier this week. We're evening it out with a slightly lower goal for the ${weeklyCalc.remainingDaysCount} days left.`
                                : <>över tidigare i veckan. Vi jämnar ut det med ett något lägre mål de {weeklyCalc.remainingDaysCount} dagar som är kvar.</>}
                            </>
                          ) : (
                            <>
                              {tr("Du låg", language)}{" "}
                              <span className="font-bold" style={{ color: colors.text }}>
                                {Math.abs(weeklyCalc.pastSurplus)} kcal
                              </span>{" "}
                              {language === "en"
                                ? "under earlier this week. You have a little extra room today without losing the weekly goal."
                                : "under tidigare i veckan. Du har lite extra utrymme idag utan att tappa veckomålet."}
                            </>
                          )}{" "}
                          <button onClick={toggleFlexibleBudget} className="font-semibold underline" style={{ color: colors.primary }}>{tr("Stäng av", language)}</button>
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-5 flex flex-col gap-3.5">
                  <MacroBar label={tr("Kolhydrater", language)} color={MACRO_BAR_COLORS.carbs} value={consumed.carbs} goal={goals.carbsGoal} hideNumbers={visualMode} />
                  <MacroBar label="Protein" color={MACRO_BAR_COLORS.protein} value={consumed.protein} goal={goals.proteinGoal} hideNumbers={visualMode} />
                  <MacroBar label={tr("Fett", language)} color={MACRO_BAR_COLORS.fat} value={consumed.fat} goal={goals.fatGoal} hideNumbers={visualMode} />
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
                      <span className="text-[10px] mt-0.5" style={{ color: colors.textDim }}>{tr("kg CO2e idag", language)}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontSize: 16 }}>💰</span>
                        <span className="text-lg font-extrabold">{Math.round(consumed.cost)}</span>
                      </div>
                      <span className="text-[10px] mt-0.5" style={{ color: colors.textDim }}>{tr("kr på mat idag", language)}</span>
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
                  <h3 className="text-sm font-bold">{tr("Vatten", language)}</h3>
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
                    <span className="text-xs" style={{ color: colors.textDim }}>{tr("ml", language)}</span>
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
                    aria-label={tr("Ångra senaste", language)}
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

        {/* Recipe feature — sticks out a bit from the rest */}
        {!dayLoading && (
          <div className="px-5 mt-5 mb-1">
            <div className="relative rounded-2xl overflow-hidden" style={{ backgroundColor: "#0E140A" }}>
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 15% 20%, ${colors.primary}33, transparent 60%)`,
                }}
              />
              <div
                className="absolute inset-0 rounded-2xl"
                style={{ border: `1px solid ${colors.primary}55` }}
              />
              <div className="relative px-5 py-5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span style={{ fontSize: 16 }}>✨</span>
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.primary, letterSpacing: "0.06em" }}>{tr("Recept", language)}</span>
                </div>
                <p className="text-sm font-bold mb-1">{tr("Skapa eller spara ett recept", language)}</p>
                <p className="text-xs mb-4" style={{ color: colors.textDim }}>{tr("Låt AI:n komma på ett recept utifrån vad du har eller vill äta, eller spara ditt eget favoritrecept för att snabbt logga det igen senare.", language)}</p>
                <div className="flex gap-2.5">
                  <button
                    onClick={openRecipeAI}
                    className="flex-1 rounded-xl py-3 text-xs font-bold"
                    style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
                  >{tr("🤖 Skapa med AI", language)}</button>
                  <button
                    onClick={openRecipeManual}
                    className="flex-1 rounded-xl py-3 text-xs font-bold"
                    style={{ border: `1px solid ${colors.primary}66`, color: colors.primary }}
                  >{tr("✏️ Eget recept", language)}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="px-5 mt-2">
          {!dayLoading && goals && (
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-extrabold">{tr("Måltider", language)}</h2>
              <button onClick={openCategorySplit} className="text-xs font-semibold" style={{ color: colors.primary }}>{tr("Ändra fördelning", language)}</button>
            </div>
          )}
          {dayLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div
                className="w-8 h-8 rounded-full animate-spin"
                style={{ border: `3px solid ${colors.hairline}`, borderTopColor: colors.primary }}
              />
              <p className="text-sm" style={{ color: colors.textDim }}>{tr("Hämtar loggen …", language)}</p>
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
                      <h3 className="text-sm font-bold">{tr(cat.label, language)}</h3>
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
                      aria-label={`${tr("Lägg till i", language)} ${tr(cat.label, language)}`}
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
                    >{tr("Inget tillagt än", language)}</div>
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
                                P {item.protein}g · {language === "en" ? "C" : "K"} {item.carbs}g · F {item.fat}g · Fi {item.fiber || 0}g
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
                            aria-label={tr("Dela måltid", language)}
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
                            aria-label={tr("Ta bort", language)}
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
            language={language}
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
            language={language}
          />
        )}

        {activeTab === "news" && <NewsPanel language={language} />}

        {activeTab === "help" && <HelpPanel openTopic={helpOpenTopic} onToggleTopic={setHelpOpenTopic} language={language} />}

        {activeTab === "legal" && <LegalPanel language={language} />}

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
            language={language}
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
            language={language}
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
            language={language}
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
              <button onClick={closeFlow} className="text-lg" style={{ color: colors.textDim }} aria-label={tr("Stäng", language)}>
                ×
              </button>
            </div>

            {flow.step === "menu" && (
              <div className="flex flex-col gap-2 pb-6">
                <button
                  onClick={triggerCamera}
                  className="w-full rounded-xl py-4 text-sm font-bold"
                  style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
                >{tr("Fota maträtt", language)}</button>
                <button
                  onClick={openSearch}
                  className="w-full rounded-xl py-4 text-sm font-medium"
                  style={{ border: `1px solid ${colors.hairline}`, color: colors.text }}
                >{tr("🔍 Sök livsmedel", language)}</button>
                <button
                  onClick={openVoiceEntry}
                  className="w-full rounded-xl py-4 text-sm font-medium"
                  style={{ border: `1px solid ${colors.hairline}`, color: colors.text }}
                >{tr("🎙️ Beskriv med ord", language)}</button>
                <button
                  onClick={openReceiveMeal}
                  className="w-full rounded-xl py-4 text-sm font-medium"
                  style={{ border: `1px solid ${colors.hairline}`, color: colors.text }}
                >{tr("🤝 Hämta delad måltid", language)}</button>
                <button
                  onClick={openManual}
                  className="w-full rounded-xl py-4 text-sm font-medium"
                  style={{ border: `1px solid ${colors.hairline}`, color: colors.text }}
                >{tr("Lägg till manuellt", language)}</button>
              </div>
            )}

            {flow.step === "receive" && (
              <div className="pb-6">
                <p className="text-xs mb-4" style={{ color: colors.textDim }}>{tr("Be din vän om koden de fick när de delade måltiden, och skriv in den här.", language)}</p>
                <input
                  autoFocus
                  value={flow.receiveCode}
                  onChange={(e) => updateReceiveCode(e.target.value)}
                  placeholder={tr("T.ex. A7K2M", language)}
                  className="w-full rounded-lg px-3 py-3 text-center text-lg font-bold tracking-widest mb-3"
                  style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                />
                {flow.receiveError && (
                  <p className="text-xs mb-3" style={{ color: colors.coral }}>{tr("Hittade ingen måltid med den koden. Kolla att den stämmer, eller be din vän dela igen.", language)}</p>
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
                <p className="text-xs mb-3" style={{ color: colors.textDim }}>{tr("Beskriv vad du åt med egna ord — tryck gärna på mikrofonen i din tangentbord för att diktera istället för att skriva.", language)}</p>
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
                  <p className="text-sm mb-4" style={{ color: colors.textDim }}>{tr("Något gick fel vid tolkningen. Försök igen, eller lägg till manuellt.", language)}</p>
                )}
                {!flow.voiceError && flow.voiceItems && flow.voiceItems.length === 0 && (
                  <p className="text-sm mb-4" style={{ color: colors.textDim }}>{tr("Kunde inte tolka någon mat ur texten. Försök beskriva det lite tydligare.", language)}</p>
                )}
                {flow.voiceItems && flow.voiceItems.length > 0 && (
                  <>
                    <p className="text-xs font-bold mb-3" style={{ color: colors.textDim }}>{tr("Vi tolkade det här — ta bort något som blev fel innan du lägger till", language)}</p>
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
                              {it.kcal} kcal · P {it.protein}g · {language === "en" ? "C" : "K"} {it.carbs}g · F {it.fat}g
                            </p>
                          </div>
                          <button
                            onClick={() => removeVoiceItem(it.tempId)}
                            aria-label={tr("Ta bort", language)}
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
                    {tr("Lägg till", language)} {flow.voiceItems ? flow.voiceItems.length : 0} {tr("livsmedel", language)}
                  </button>
                  <button onClick={openVoiceEntry} className="text-xs font-semibold" style={{ color: colors.primary }}>{tr("Försök igen", language)}</button>
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
                  >{tr("Sök", language)}</button>
                </div>

                {flow.selectedProducts && flow.selectedProducts.length > 0 && (
                  <p className="text-xs mb-3" style={{ color: colors.textDim }}>
                    {flow.selectedProducts.length} {tr("valda — sök gärna på fler rätter att lägga till i samma måltid", language)}
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
                                {f.kcal} kcal · P {f.protein}g · {language === "en" ? "C" : "K"} {f.carbs}g · F {f.fat}g
                              </p>
                            </div>
                            <span className="text-lg font-bold flex-shrink-0" style={{ color: colors.primary }}>
                              +
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs font-bold mt-4 mb-2" style={{ color: colors.textDim }}>{tr("Eller sök på nätet", language)}</p>
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
                    {tr("Inga träffar. Prova ett annat sökord, eller lägg till maträtten manuellt.", language)}
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
                  {tr("Hittar du inte det du söker? Lägg till manuellt", language)}
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
                  {tr("Namn på måltiden", language)}
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
                        aria-label={tr("Ta bort", language)}
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
                  language={language}
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
                <p className="text-sm font-medium">{tr("Läser av maträtten …", language)}</p>
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
                  >{tr("Försök fota igen", language)}</button>
                  <button
                    onClick={openManual}
                    className="w-full rounded-xl py-3.5 text-sm font-medium"
                    style={{ border: `1px solid ${colors.hairline}`, color: colors.text }}
                  >{tr("Lägg till manuellt", language)}</button>
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
                    {tr("📷 Lägg till bild (valfritt)", language)}
                  </button>
                )}
                {flow.draft.portion_note && (
                  <p className="text-xs mb-3" style={{ color: colors.textDim }}>
                    {flow.draft.portion_note}
                  </p>
                )}

                <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>{tr("Maträtt", language)}</label>
                <input
                  value={flow.draft.name}
                  onChange={(e) => updateDraft("name", e.target.value)}
                  placeholder={tr("T.ex. Kycklingsallad", language)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm mb-3"
                  style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                />

                <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>{tr("Kalorier (kcal)", language)}</label>
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
                  language={language}
                />

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <MacroInput label={tr("Protein (g)", language)} value={flow.draft.protein} onChange={(v) => updateDraft("protein", v)} />
                  <MacroInput label={tr("Kolhydrater (g)", language)} value={flow.draft.carbs} onChange={(v) => updateDraft("carbs", v)} />
                  <MacroInput label={tr("Fett (g)", language)} value={flow.draft.fat} onChange={(v) => updateDraft("fat", v)} />
                  <MacroInput label={tr("Fibrer (g)", language)} value={flow.draft.fiber} onChange={(v) => updateDraft("fiber", v)} />
                </div>

                <p className="text-xs font-bold mb-2 mt-4" style={{ color: colors.textDim }}>
                  {tr("Klimat & plånbok (valfritt)", language)}
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
              <h3 className="text-base font-bold">{tr("Dina mål", language)}</h3>
              <button onClick={() => setProfileOpen(false)} className="text-lg" style={{ color: colors.textDim }} aria-label={tr("Stäng", language)}>
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

            <p className="text-xs mb-2" style={{ color: colors.textDim }}>{tr("Aktivitetsnivå", language)}</p>
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

            <p className="text-xs mb-2" style={{ color: colors.textDim }}>{tr("Mål", language)}</p>
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
                <p className="text-xs mb-2" style={{ color: colors.textDim }}>{tr("Beräknat dagsmål", language)}</p>
                <p className="text-2xl font-extrabold mb-1" style={{ color: colors.primary }}>
                  {livePreview.kcalGoal} kcal
                </p>
                <p className="text-xs" style={{ color: colors.textDim }}>
                  Protein {livePreview.proteinGoal}g · Kolhydrater {livePreview.carbsGoal}g · Fett {livePreview.fatGoal}g · Fibrer {livePreview.fiberGoal}g
                </p>
              </div>
            )}

            <button onClick={toggleManualOverride} className="text-xs font-medium mb-4" style={{ color: colors.primary }}>
              {profileDraft.manualOverride ? tr("Använd beräknat mål istället", language) : tr("Justera målen manuellt", language)}
            </button>

            {profileDraft.manualOverride && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <MacroInput label="Kalorier (kcal)" value={profileDraft.kcalGoal} onChange={(v) => updateProfileDraft("kcalGoal", v)} />
                <MacroInput label={tr("Protein (g)", language)} value={profileDraft.proteinGoal} onChange={(v) => updateProfileDraft("proteinGoal", v)} />
                <MacroInput label={tr("Kolhydrater (g)", language)} value={profileDraft.carbsGoal} onChange={(v) => updateProfileDraft("carbsGoal", v)} />
                <MacroInput label={tr("Fett (g)", language)} value={profileDraft.fatGoal} onChange={(v) => updateProfileDraft("fatGoal", v)} />
                <MacroInput label={tr("Fibrer (g)", language)} value={profileDraft.fiberGoal} onChange={(v) => updateProfileDraft("fiberGoal", v)} />
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
                  {tr("Äter du för mycket en dag jämnas det ut med ett lite lägre mål resten av veckan", language)}
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
            >{tr("Spara mål", language)}</button>
          </div>
        </div>
      )}

      {/* What's new popup */}
      {showNewsPopup && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
          onClick={dismissNewsPopup}
        >
          <div
            className="w-full max-w-xs rounded-2xl px-6 py-7"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full mb-3"
              style={{ backgroundColor: colors.primaryLight, color: colors.primary }}
            >
              {tr("NYTT", language)} · v{APP_VERSION}
            </span>
            <h3 className="text-base font-extrabold mb-3">{language === "en" ? CHANGELOG[0].headline_en : CHANGELOG[0].headline}</h3>
            <ul className="mb-5" style={{ paddingLeft: 18 }}>
              {(language === "en" ? CHANGELOG[0].summary_en : CHANGELOG[0].summary).map((line, i) => (
                <li key={i} className="text-xs mb-1.5" style={{ color: colors.textDim, listStyleType: "disc" }}>
                  {line}
                </li>
              ))}
            </ul>
            <button
              onClick={openNewsFromPopup}
              className="w-full rounded-full py-3 text-sm font-bold mb-2"
              style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
            >{tr("Tryck här för att läsa mer", language)}</button>
            <button onClick={dismissNewsPopup} className="w-full text-xs font-semibold py-1" style={{ color: colors.textDim }}>{tr("Stäng", language)}</button>
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
              <h3 className="text-base font-bold">{tr("Dela måltid", language)}</h3>
              <button onClick={closeShareModal} className="text-lg" style={{ color: colors.textDim }} aria-label={tr("Stäng", language)}>
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
              <p className="text-sm text-center py-6" style={{ color: colors.textDim }}>{tr("Kunde inte dela just nu. Försök igen om en stund.", language)}</p>
            )}

            {shareModal.step === "shared" && (
              <div className="pb-2">
                <p className="text-xs mb-4" style={{ color: colors.textDim }}>
                  Skicka den här koden till din vän (t.ex. via SMS) — de kan hämta måltiden i sin egen app under{" "}
                  <span style={{ color: colors.text }}>+ → "{tr("🤝 Hämta delad måltid", language).replace("🤝 ", "")}"</span>.
                </p>
                <div
                  className="rounded-xl py-5 text-center mb-4"
                  style={{ backgroundColor: colors.surfaceMuted }}
                >
                  <span className="text-3xl font-extrabold tracking-widest" style={{ color: colors.primary }}>
                    {shareModal.code}
                  </span>
                </div>
                <p className="text-[11px] mb-4" style={{ color: colors.textDim }}>{tr("Koden lagras i ett delat utrymme som tekniskt sett går att nå av andra som använder samma app om de gissar koden — dela den bara med personer du litar på.", language)}</p>
                <button
                  onClick={closeShareModal}
                  className="w-full rounded-xl py-3.5 text-sm font-bold"
                  style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
                >{tr("Klar", language)}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recipe overlay */}
      {recipeFlow && (
        <div
          className="fixed inset-0 flex items-end justify-center z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeRecipeFlow();
          }}
        >
          <div
            className="w-full max-w-md rounded-t-2xl px-5 pt-5 pb-6"
            style={{ backgroundColor: colors.surface, maxHeight: "85vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">
                {recipeFlow.step === "manual" ? "Eget recept" : "Recept med AI"}
              </h3>
              <button onClick={closeRecipeFlow} className="text-lg" style={{ color: colors.textDim }} aria-label={tr("Stäng", language)}>
                ×
              </button>
            </div>

            {recipeFlow.step === "ai-input" && (
              <div className="pb-4">
                <p className="text-xs mb-3" style={{ color: colors.textDim }}>{tr("Har du några ingredienser du vill utgå från? Lämna tomt så hittar AI:n på något gott själv.", language)}</p>
                <textarea
                  autoFocus
                  value={recipeFlow.ingredients}
                  onChange={(e) => updateRecipeFlow("ingredients", e.target.value)}
                  placeholder={tr("T.ex. kyckling, broccoli, ris", language)}
                  rows={3}
                  className="w-full rounded-lg px-3 py-2.5 text-sm mb-5"
                  style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                />
                <button
                  onClick={generateRecipeAI}
                  className="w-full rounded-xl py-3.5 text-sm font-bold"
                  style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
                >{tr("✨ Skapa recept", language)}</button>
              </div>
            )}

            {recipeFlow.step === "ai-loading" && (
              <div className="flex flex-col items-center justify-center gap-3 py-14">
                <div
                  className="w-9 h-9 rounded-full animate-spin"
                  style={{ border: `3px solid ${colors.hairline}`, borderTopColor: colors.primary }}
                />
                <p className="text-xs" style={{ color: colors.textDim }}>{tr("Komponerar ett recept …", language)}</p>
              </div>
            )}

            {recipeFlow.step === "ai-error" && (
              <div className="py-6 text-center">
                <p className="text-sm mb-4" style={{ color: colors.textDim }}>{tr("Något gick fel. Försök igen om en stund.", language)}</p>
                <button onClick={openRecipeAI} className="text-xs font-semibold" style={{ color: colors.primary }}>{tr("Försök igen", language)}</button>
              </div>
            )}

            {recipeFlow.step === "ai-result" && recipeFlow.recipe && (
              <div className="pb-2">
                <h4 className="text-base font-bold mb-2">{recipeFlow.recipe.name}</h4>
                <p className="text-xs font-bold mb-3" style={{ color: colors.primary }}>
                  {Math.round(recipeFlow.recipe.kcal)} kcal · P {Math.round(recipeFlow.recipe.protein_g)}g · {language === "en" ? "C" : "K"}{" "}
                  {Math.round(recipeFlow.recipe.carbs_g)}g · F {Math.round(recipeFlow.recipe.fat_g)}g
                </p>

                {Array.isArray(recipeFlow.recipe.ingredients) && recipeFlow.recipe.ingredients.length > 0 && (
                  <>
                    <p className="text-xs font-bold mb-1.5">{tr("Ingredienser", language)}</p>
                    <ul className="mb-4" style={{ paddingLeft: 18 }}>
                      {recipeFlow.recipe.ingredients.map((ing, i) => (
                        <li key={i} className="text-xs mb-1" style={{ color: colors.textDim, listStyleType: "disc" }}>
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {Array.isArray(recipeFlow.recipe.instructions) && recipeFlow.recipe.instructions.length > 0 && (
                  <>
                    <p className="text-xs font-bold mb-1.5">{tr("Gör så här", language)}</p>
                    <ol className="mb-5" style={{ paddingLeft: 18 }}>
                      {recipeFlow.recipe.instructions.map((step, i) => (
                        <li key={i} className="text-xs mb-1.5" style={{ color: colors.textDim, listStyleType: "decimal" }}>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </>
                )}

                <p className="text-xs font-bold mb-2">{tr("Lägg till i", language)}</p>
                <div className="flex gap-1.5 mb-4 flex-wrap">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => updateRecipeFlow("category", c.key)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold"
                      style={{
                        backgroundColor: recipeFlow.category === c.key ? colors.primary : colors.surfaceMuted,
                        color: recipeFlow.category === c.key ? colors.onPrimary : colors.textDim,
                      }}
                    >
                      {tr(c.label, language)}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => saveRecipeToLibraryAndMaybeLog(recipeFlow.recipe, recipeFlow.category)}
                    className="w-full rounded-xl py-3.5 text-sm font-bold"
                    style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
                  >{tr("Logga och spara", language)}</button>
                  <button
                    onClick={() => saveRecipeToLibraryAndMaybeLog(recipeFlow.recipe, null)}
                    className="w-full rounded-xl py-3 text-xs font-semibold"
                    style={{ color: colors.textDim }}
                  >{tr("Spara bara i biblioteket (logga inte nu)", language)}</button>
                </div>
              </div>
            )}

            {recipeFlow.step === "manual" && (
              <div className="pb-2">
                <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>{tr("Namn på receptet", language)}</label>
                <input
                  value={recipeFlow.name}
                  onChange={(e) => updateRecipeFlow("name", e.target.value)}
                  placeholder={tr("T.ex. Mammas köttbullar", language)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm mb-3"
                  style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                />

                <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>{tr("Ingredienser (en per rad, valfritt)", language)}</label>
                <textarea
                  value={recipeFlow.ingredientsText}
                  onChange={(e) => updateRecipeFlow("ingredientsText", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg px-3 py-2.5 text-sm mb-3"
                  style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                />

                <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>{tr("Gör så här (valfritt)", language)}</label>
                <textarea
                  value={recipeFlow.instructions}
                  onChange={(e) => updateRecipeFlow("instructions", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg px-3 py-2.5 text-sm mb-4"
                  style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                />

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <MacroInput label="Kalorier" value={recipeFlow.kcal} onChange={(v) => updateRecipeFlow("kcal", v)} />
                  <MacroInput label={tr("Protein (g)", language)} value={recipeFlow.protein} onChange={(v) => updateRecipeFlow("protein", v)} />
                  <MacroInput label={tr("Kolhydrater (g)", language)} value={recipeFlow.carbs} onChange={(v) => updateRecipeFlow("carbs", v)} />
                  <MacroInput label={tr("Fett (g)", language)} value={recipeFlow.fat} onChange={(v) => updateRecipeFlow("fat", v)} />
                </div>

                <p className="text-xs font-bold mb-2">{tr("Lägg till i (valfritt)", language)}</p>
                <div className="flex gap-1.5 mb-5 flex-wrap">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => updateRecipeFlow("category", recipeFlow.category === c.key ? null : c.key)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold"
                      style={{
                        backgroundColor: recipeFlow.category === c.key ? colors.primary : colors.surfaceMuted,
                        color: recipeFlow.category === c.key ? colors.onPrimary : colors.textDim,
                      }}
                    >
                      {tr(c.label, language)}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => saveManualRecipe(recipeFlow.category)}
                  disabled={!recipeFlow.name.trim() || recipeFlow.kcal === ""}
                  className="w-full rounded-xl py-3.5 text-sm font-bold"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.onPrimary,
                    opacity: !recipeFlow.name.trim() || recipeFlow.kcal === "" ? 0.5 : 1,
                  }}
                >
                  {recipeFlow.category ? "Logga och spara recept" : "Spara recept"}
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
              <h3 className="text-base font-bold">{tr("Förslag på mellanmål", language)}</h3>
              <button
                onClick={() => setReactiveSuggestFlow(null)}
                className="text-lg"
                style={{ color: colors.textDim }}
                aria-label={tr("Stäng", language)}
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
              <p className="text-sm text-center py-6" style={{ color: colors.textDim }}>{tr("Något gick fel. Försök igen om en stund.", language)}</p>
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
                        · P {Math.round(s.protein_g)}g · {language === "en" ? "C" : "K"} {Math.round(s.carbs_g)}g · F {Math.round(s.fat_g)}g
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
              <h3 className="text-base font-bold">{tr("Fördelning per måltid", language)}</h3>
              <button onClick={() => setCategorySplitOpen(false)} className="text-lg" style={{ color: colors.textDim }} aria-label={tr("Stäng", language)}>
                ×
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: colors.textDim }}>{tr("Som standard delas ditt dagsmål upp automatiskt. Fått andra siffror av t.ex. en dietist? Ange dem här så används de istället.", language)}</p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {CATEGORIES.map((c) => (
                <MacroInput
                  key={c.key}
                  label={`${tr(c.label, language)} (kcal)`}
                  value={categorySplitDraft[c.key]}
                  onChange={(v) => updateCategorySplitDraft(c.key, v)}
                />
              ))}
            </div>

            {goals && (
              <p className="text-xs mb-5" style={{ color: colors.textDim }}>
                {tr("Summa", language)}: {CATEGORIES.reduce((s, c) => s + (Number(categorySplitDraft[c.key]) || 0), 0)} kcal · {tr("Dagsmål", language)}: {goals.kcalGoal} kcal
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={saveCategorySplit}
                className="w-full rounded-xl py-3.5 text-sm font-bold"
                style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
              >{tr("Spara fördelning", language)}</button>
              {categorySplit && (
                <button
                  onClick={resetCategorySplit}
                  className="w-full rounded-xl py-3.5 text-sm font-medium"
                  style={{ border: `1px solid ${colors.hairline}`, color: colors.text }}
                >{tr("Återställ till automatisk fördelning", language)}</button>
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

function TrendsPanel({ data, loading, goals, metric, onMetricChange, selectedDay, onSelectDay, todayKey, language }) {
  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div
          className="w-8 h-8 rounded-full animate-spin"
          style={{ border: `3px solid ${colors.hairline}`, borderTopColor: colors.primary }}
        />
        <p className="text-sm" style={{ color: colors.textDim }}>{tr("Hämtar kalender …", language)}</p>
      </div>
    );
  }

  const selectedData = data.find((d) => d.date === selectedDay) || { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const weekDates = getWeekDates(selectedDay);

  return (
    <div className="px-5">
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
            <DarkMacroRing color={colors.carbs} label={tr("Kolhydrater", language)} consumed={selectedData.carbs} goal={goals.carbsGoal} />
            <DarkMacroRing color={colors.protein} label="Protein" consumed={selectedData.protein} goal={goals.proteinGoal} />
            <DarkMacroRing color={colors.fat} label={tr("Fett", language)} consumed={selectedData.fat} goal={goals.fatGoal} />
            <DarkMacroRing color={colors.fiber} label="Fiber" consumed={selectedData.fiber} goal={goals.fiberGoal} />
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-5 text-center text-sm"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}`, color: colors.textDim }}
        >
          {tr("Ställ in dina mål under", language)} "{getTabLabel("budget", language)}" {tr("för att se sammanfattningen", language)}
        </div>
      )}

      <div className="mt-6 rounded-2xl p-5" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-base font-extrabold">{tr("Specifikation & Makrovärden", language)}</h3>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: colors.textDim }}>{tr("Näringsämne", language)}</span>
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: colors.textDim }}>{tr("Mängd / Energiandel", language)}</span>
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

function WeightPanel({ log, loading, draft, onDraftChange, onAdd, onDelete, todayKey, profile, language }) {
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
              {bmiExpanded ? tr("Visa mindre", language) : tr("Visa mer", language)}
            </button>
          </div>

          {bmiExpanded && (
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.hairline}` }}>
              <h3 className="text-sm font-bold mb-3">{tr("BMI-kategorier", language)}</h3>
              <div className="flex flex-col gap-2.5 mb-5">
                {BMI_CATEGORIES.map((c) => (
                  <div key={c.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-sm font-medium">{tr(c.label, language)}</span>
                      {bmiCat.label === c.label && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${c.color}22`, color: c.color }}
                        >
                          {tr("Nuvarande BMI", language)}
                        </span>
                      )}
                    </div>
                    <span className="text-sm" style={{ color: colors.textDim }}>
                      {c.rangeText}
                    </span>
                  </div>
                ))}
              </div>

              <h3 className="text-sm font-bold mb-2">{tr("Beräkning av BMI", language)}</h3>
              <p className="text-xs mb-4" style={{ color: colors.textDim }}>
                {language === "en"
                  ? "BMI is calculated by dividing weight in kilograms by height in metres squared (BMI = kg / m²)."
                  : "BMI räknas ut genom att dela vikten i kilogram med längden i meter i kvadrat (BMI = kg / m²)."}
              </p>

              <p className="text-[11px] font-bold mb-1" style={{ color: colors.textDim }}>
                {language === "en" ? "Note" : "Notera"}
              </p>
              <p className="text-[11px]" style={{ color: colors.textDim }}>
                {language === "en"
                  ? "BMI is a common screening measure but has limitations. Factors such as pregnancy or high muscle mass can give a misleading result, and the measure is less reliable for children and the elderly."
                  : "BMI är ett vanligt screeningmått men har begränsningar. Faktorer som graviditet eller hög muskelmassa kan ge ett missvisande resultat, och måttet är mindre tillförlitligt för barn och äldre."}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div
          className="rounded-2xl p-5 mb-4 text-center text-sm"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}`, color: colors.textDim }}
        >
          {tr("Lägg in din längd under", language)} "{getTabLabel("budget", language)}" {tr("och logga en vikt för att se ditt BMI", language)}
        </div>
      )}

      <div
        className="rounded-2xl p-4 mb-4 flex items-end gap-2"
        style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}
      >
        <div className="flex-1">
          <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>{tr("Vikt (kg)", language)}</label>
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
          <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>{tr("Datum", language)}</label>
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
        >{tr("Lägg till", language)}</button>
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
        >{tr("Ingen vikt loggad än", language)}</div>
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
                  <button onClick={() => onDelete(e.id)} aria-label={tr("Ta bort", language)} className="text-sm" style={{ color: colors.textDim }}>
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
  language,
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
        <p className="text-sm" style={{ color: colors.textDim }}>{tr("Hämtar loggen …", language)}</p>
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
      <p className="text-xs mb-4" style={{ color: colors.textDim }}>
        Träning för {dateLabel(selectedDate)}
      </p>

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
                {tr("dagligt mål", language)}
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
        <h3 className="text-sm font-bold">{tr("Träningspass", language)}</h3>
        <button
          onClick={onOpenMenu}
          aria-label={tr("Lägg till träningspass", language)}
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
        >{tr("Inget tillagt än", language)}</div>
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
                aria-label={tr("Ta bort", language)}
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
              <button onClick={onClose} className="text-lg" style={{ color: colors.textDim }} aria-label={tr("Stäng", language)}>
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
                    <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>{tr("Antal steg", language)}</label>
                    <input
                      value={flow.steps}
                      onChange={(e) => onUpdateDraft("steps", e.target.value.replace(/[^0-9]/g, ""))}
                      inputMode="numeric"
                      placeholder="T.ex. 2000"
                      className="w-full rounded-lg px-3 py-2.5 text-sm mb-3"
                      style={{ backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, color: colors.text }}
                    />
                    <p className="text-xs mb-5" style={{ color: colors.textDim }}>
                      {tr("Uppskattad förbränning", language)}: <span className="font-bold" style={{ color: colors.text }}>{previewKcal} kcal</span>
                      <br />
                      {language === "en" ? "(based on approx. 1,333 steps/km and 0.7 kcal per kg body weight per kilometre)" : "(baserat på ca 1 333 steg/km och 0,7 kcal per kg kroppsvikt och kilometer)"}
                    </p>
                  </>
                ) : flow.type.mode === "distance" ? (
                  <>
                    <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>
                      {tr("Antal kilometer", language)}
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
                      {tr("Uppskattad förbränning", language)}: <span className="font-bold" style={{ color: colors.text }}>{previewKcal} kcal</span>
                      <br />
                      ({language === "en" ? String(flow.type.kcalPerKgPerKm) : String(flow.type.kcalPerKgPerKm).replace(".", ",")} kcal {language === "en" ? "per kg body weight per kilometre" : "per kg kroppsvikt och kilometer"})
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
                      {tr("Uppskattad förbränning", language)}: <span className="font-bold" style={{ color: colors.text }}>{previewKcal} kcal</span>
                    </p>
                  </>
                ) : (
                  <>
                    <label className="text-xs block mb-1.5" style={{ color: colors.textDim }}>{tr("Kalorier (kcal)", language)}</label>
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

const HELP_TOPICS = [
  {
    title: "Ställa in ditt kalorimål och dina uppgifter",
    steps: [
      "Gå till fliken Översikt och tryck på ✎ Redigera uppe till höger.",
      "Fyll i kön, ålder, vikt, längd och aktivitetsnivå — appen räknar då ut ett rekommenderat kaloriemål åt dig automatiskt.",
      "Vill du istället bestämma målet själv? Slå på \"Ange eget mål manuellt\" i samma ruta och skriv in det kaloriantal du vill ha.",
      "Du kan när som helst gå tillbaka hit och ändra uppgifterna — kaloriemålet räknas då om direkt.",
    ],
  },
  {
    title: "Logga en måltid — fyra olika sätt",
    steps: [
      "Tryck på + vid en måltidskategori (Frukost, Lunch, Mellanmål, Middag eller Övrigt) på Översikt-fliken.",
      "📷 Fota maträtt: ta ett foto så uppskattar AI:n kalorier och näring automatiskt.",
      "🔍 Sök livsmedel: sök på ett namn, välj mängd i gram — fungerar både mot dina egna sparade livsmedel och mot en öppen produktdatabas.",
      "🎙️ Beskriv med ord: skriv (eller diktera med tangentbordets mikrofon) en mening om vad du åt, t.ex. \"en skål gröt med banan\" — AI:n delar upp det i separata livsmedel.",
      "✏️ Manuellt: fyll i namn, kalorier och näringsvärden själv, med möjlighet att lägga till ett eget foto.",
    ],
  },
  {
    title: "Redigera eller ta bort något du loggat",
    steps: [
      "Tryck direkt på en loggad måltid i listan för att öppna den i redigeringsläge.",
      "Ändra vilket fält du vill (namn, kalorier, näring) och tryck \"Spara ändringar\".",
      "Vill du ta bort helt? Tryck på × längst till höger på raden istället.",
    ],
  },
  {
    title: "Ändra hur kalorierna fördelas mellan måltider",
    steps: [
      "Tryck på \"Ändra fördelning\" ovanför måltidslistan på Översikt-fliken.",
      "Skriv in hur många kalorier du vill ha till Frukost, Lunch, Mellanmål, Middag och Övrigt.",
      "Fördelningen sparas som andelar av din totala kaloribudget, så den skalar automatiskt om du senare ändrar ditt kaloriemål.",
    ],
  },
  {
    title: "Logga vatten",
    steps: [
      "Vattenspåraren finns direkt under din dagliga sammanfattning på Översikt-fliken.",
      "Tryck på snabbknapparna (t.ex. +250 ml) för att lägga till en klunk i taget.",
      "Ångra senaste tillägg med pilen om du klickade fel.",
    ],
  },
  {
    title: "Träning och steg",
    steps: [
      "Gå till fliken Träning.",
      "Ställ in ditt stegmål högst upp och logga dagens steg.",
      "Tryck på + för att lägga till ett träningspass — välj typ (promenad, löpning, styrketräning m.fl.), så räknas kalorierna du bränt ut automatiskt.",
      "Bränd energi räknas alltid in i din dagliga kaloribudget på Översikt-fliken.",
    ],
  },
  {
    title: "Fasta (periodisk fasta)",
    steps: [
      "Gå till fliken Fasta.",
      "Välj en fastemetod, t.ex. 16:8, eller ställ in ett eget antal timmar.",
      "Tryck \"Starta fasta\" — ringen och texten visar vilken fas du är i just nu.",
      "Fastan avslutas automatiskt när tiden är ute, och du får en peppande bekräftelse.",
    ],
  },
  {
    title: "Viktgång och BMI",
    steps: [
      "Gå till fliken Viktgång.",
      "Skriv in dagens vikt och tryck spara — den läggs till i grafen.",
      "Ditt BMI räknas ut automatiskt utifrån vikten och längden du angett under Översikt → Redigera.",
    ],
  },
  {
    title: "Flexibel veckobudget",
    steps: [
      "Om du ätit mer eller mindre än ditt mål tidigare i veckan jämnar appen automatiskt ut det över resterande dagar.",
      "Du ser en informationsruta om detta direkt på Översikt-fliken när det är aktuellt.",
      "Vill du stänga av det och alltid ha exakt samma mål varje dag? Tryck \"Stäng av\" i rutan, eller ändra inställningen under ✎ Redigera.",
    ],
  },
  {
    title: "Sifferfritt läge",
    steps: [
      "Tryck på \"🌿 Sifferfritt läge\" bredvid ✎ Redigera på Översikt-fliken.",
      "Exakta kalorisiffror döljs och ersätts med färgkodade hjärtan och en enkel status (grönt/gult/rött).",
      "Perfekt de dagar du vill hålla koll utan att fastna i siffror. Tryck på samma knapp igen för att visa siffrorna.",
    ],
  },
  {
    title: "Dela en måltid med en vän",
    steps: [
      "Tryck på 🤝-ikonen bredvid en loggad måltid.",
      "En kort kod genereras — skicka den till din vän via SMS eller valfri app.",
      "Din vän trycker + på en kategori i sin egen app → \"Hämta delad måltid\" → skriver in koden, så dyker hela måltiden upp hos dem.",
    ],
  },
  {
    title: "Måltids scanner (fota kylskåpet)",
    steps: [
      "Gå till fliken Måltids scanner.",
      "Välj vilken måltid du vill ha förslag till (t.ex. Middag).",
      "Fota insidan av kylskåpet eller skafferiet — AI:n identifierar ingredienserna och föreslår 2–3 rätter anpassade efter hur mycket du har kvar av dagens kalorimål.",
      "Gillar du ett förslag? Tryck \"Lägg till\" så loggas det direkt.",
    ],
  },
  {
    title: "Recept med AI eller eget recept",
    steps: [
      "Rutan \"Recept\" finns på Översikt-fliken, mellan vatten och måltider.",
      "🤖 Skapa med AI: skriv gärna in ingredienser du vill använda (valfritt), så komponerar AI:n ett helt recept med ingredienser, gör-så-här-steg och näringsvärden.",
      "✏️ Eget recept: skriv in ditt eget recept manuellt, med ingredienser, instruktioner och näringsvärden.",
      "Båda sparas i ditt livsmedelsbibliotek för snabb återanvändning, och du kan logga dem direkt i valfri måltidskategori samtidigt.",
    ],
  },
  {
    title: "Klimat- och kostnadsuppskattning",
    steps: [
      "När du loggar mat uppskattar appen även klimatavtryck (CO2) och ungefärlig kostnad.",
      "Vid manuell inmatning kan du själv fylla i egna värden under \"Klimat & plånbok\".",
      "Dagens totala klimatavtryck och matkostnad visas längst ner i sammanfattningen på Översikt-fliken.",
    ],
  },
  {
    title: "Konto och utloggning",
    steps: [
      "Tryck på de tre strecken (☰) uppe till vänster för att öppna menyn.",
      "Där hittar du alla flikar samlade, samt knappen \"Logga ut\" längst ner.",
      "All din data är kopplad till ditt konto och sparas i en databas, så den finns kvar oavsett vilken enhet du loggar in från.",
    ],
  },
];

const HELP_TOPICS_EN = [
  {
    title: "Set your calorie goal and personal details",
    steps: [
      "Go to the Overview tab and tap ✎ Edit in the top right.",
      "Fill in your sex, age, weight, height and activity level — the app will calculate a recommended calorie goal for you automatically.",
      "Prefer to set the goal yourself? Turn on \"Set goal manually\" in the same screen and type in the calorie count you want.",
      "You can come back here and change these details any time — your calorie goal is recalculated instantly.",
    ],
  },
  {
    title: "Log a meal — four different ways",
    steps: [
      "Tap + next to a meal category (Breakfast, Lunch, Snack, Dinner or Other) on the Overview tab.",
      "📷 Photograph meal: take a photo and AI estimates the calories and nutrition automatically.",
      "🔍 Search food: search by name, choose the amount in grams — works against both your own saved foods and an open product database.",
      "🎙️ Describe with words: type (or dictate using your keyboard's microphone) a sentence about what you ate, e.g. \"a bowl of porridge with a banana\" — AI splits it into separate food items.",
      "✏️ Manually: fill in the name, calories and nutrition values yourself, with the option to attach your own photo.",
    ],
  },
  {
    title: "Edit or delete something you've logged",
    steps: [
      "Tap directly on a logged meal in the list to open it in edit mode.",
      "Change whichever field you like (name, calories, nutrition) and tap \"Save changes\".",
      "Want to remove it entirely? Tap the × on the far right of the row instead.",
    ],
  },
  {
    title: "Change how calories are split between meals",
    steps: [
      "Tap \"Edit distribution\" above the meal list on the Overview tab.",
      "Enter how many calories you want for Breakfast, Lunch, Snack, Dinner and Other.",
      "The split is saved as a share of your total calorie budget, so it automatically scales if you later change your calorie goal.",
    ],
  },
  {
    title: "Log water",
    steps: [
      "The water tracker sits right under your daily summary on the Overview tab.",
      "Tap the quick-add buttons (e.g. +250 ml) to log a drink at a time.",
      "Undo the last entry with the arrow if you tapped the wrong one.",
    ],
  },
  {
    title: "Training and steps",
    steps: [
      "Go to the Training tab.",
      "Set your step goal at the top and log today's steps.",
      "Tap + to add an exercise session — pick a type (walk, run, strength training, etc.), and the calories you burned are calculated automatically.",
      "Calories burned always count towards your daily calorie budget on the Overview tab.",
    ],
  },
  {
    title: "Fasting (intermittent fasting)",
    steps: [
      "Go to the Fasting tab.",
      "Choose a fasting method, e.g. 16:8, or set a custom number of hours.",
      "Tap \"Start fast\" — the ring and text show which phase you're currently in.",
      "The fast ends automatically once the time is up, and you'll get an encouraging confirmation.",
    ],
  },
  {
    title: "Weight tracking and BMI",
    steps: [
      "Go to the Weight tab.",
      "Enter today's weight and tap save — it's added to the graph.",
      "Your BMI is calculated automatically from the weight and height you entered under Overview → Edit.",
    ],
  },
  {
    title: "Flexible weekly budget",
    steps: [
      "If you've eaten more or less than your goal earlier in the week, the app automatically evens it out over the remaining days.",
      "You'll see an info box about this directly on the Overview tab when it's relevant.",
      "Want to turn it off and always have exactly the same goal every day? Tap \"Turn off\" in the box, or change the setting under ✎ Edit.",
    ],
  },
  {
    title: "Number-free mode",
    steps: [
      "Tap \"🌿 Number-free mode\" next to ✎ Edit on the Overview tab.",
      "Exact calorie numbers are hidden and replaced with colour-coded hearts and a simple status (green/yellow/red).",
      "Perfect for days when you want to keep track without getting stuck on numbers. Tap the same button again to show numbers.",
    ],
  },
  {
    title: "Share a meal with a friend",
    steps: [
      "Tap the 🤝 icon next to a logged meal.",
      "A short code is generated — send it to your friend via text or any app.",
      "Your friend taps + on a category in their own app → \"Get a shared meal\" → enters the code, and the whole meal appears for them.",
    ],
  },
  {
    title: "Meal scanner (photograph the fridge)",
    steps: [
      "Go to the Meal Scanner tab.",
      "Choose which meal you want suggestions for (e.g. Dinner).",
      "Photograph the inside of your fridge or pantry — AI identifies the ingredients and suggests 2–3 dishes tailored to how much you have left of today's calorie goal.",
      "Like a suggestion? Tap \"Add\" to log it right away.",
    ],
  },
  {
    title: "Recipes with AI or your own recipe",
    steps: [
      "The \"Recipe\" box is on the Overview tab, between water and meals.",
      "🤖 Create with AI: optionally enter ingredients you'd like to use, and AI composes a complete recipe with ingredients, instructions and nutrition values.",
      "✏️ My own recipe: enter your own recipe manually, with ingredients, instructions and nutrition values.",
      "Both are saved to your food library for quick reuse, and you can log them directly into any meal category at the same time.",
    ],
  },
  {
    title: "Climate and cost estimates",
    steps: [
      "When you log food, the app also estimates its climate footprint (CO2) and approximate cost.",
      "When entering food manually, you can fill in your own values under \"Climate & wallet\".",
      "Today's total climate footprint and food cost are shown at the bottom of the summary on the Overview tab.",
    ],
  },
  {
    title: "Account and logging out",
    steps: [
      "Tap the three lines (☰) in the top left to open the menu.",
      "There you'll find all the tabs gathered together, plus the \"Log out\" button at the bottom.",
      "All your data is tied to your account and saved in a database, so it stays there no matter which device you log in from.",
    ],
  },
];

function HelpPanel({ openTopic, onToggleTopic, language }) {
  const topics = language === "en" ? HELP_TOPICS_EN : HELP_TOPICS;
  return (
    <div className="px-5">
      <p className="text-xs mb-5" style={{ color: colors.textDim }}>{tr("Tryck på ett ämne nedan för att öppna en steg-för-steg-guide för just den delen av appen.", language)}</p>

      <div className="flex flex-col gap-2.5">
        {topics.map((topic, i) => {
          const isOpen = openTopic === i;
          return (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}
            >
              <button
                onClick={() => onToggleTopic(isOpen ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left"
              >
                <span className="text-sm font-semibold pr-3">{topic.title}</span>
                <span
                  className="flex-shrink-0 text-sm font-bold"
                  style={{ color: colors.primary, transform: isOpen ? "rotate(180deg)" : "none" }}
                >
                  ▾
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <ol style={{ paddingLeft: 18 }}>
                    {topic.steps.map((step, j) => (
                      <li key={j} className="text-xs mb-2" style={{ color: colors.textDim, listStyleType: "decimal", lineHeight: 1.5 }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewsPanel({ language }) {
  return (
    <div className="px-5">
      <p className="text-xs mb-5" style={{ color: colors.textDim }}>{tr("Allt som är nytt i Calio Bite, senaste versionen överst.", language)}</p>

      <div className="flex flex-col gap-4">
        {CHANGELOG.map((entry, i) => (
          <div
            key={entry.version}
            className="rounded-2xl p-5"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: i === 0 ? colors.primaryLight : colors.surfaceMuted,
                  color: i === 0 ? colors.primary : colors.textDim,
                }}
              >
                v{entry.version}
              </span>
              <span className="text-[11px]" style={{ color: colors.textDim }}>
                {entry.date}
              </span>
            </div>
            <h3 className="text-sm font-bold mb-2">{language === "en" ? entry.headline_en : entry.headline}</h3>
            <ul style={{ paddingLeft: 18 }}>
              {(language === "en" ? entry.details_en : entry.details).map((line, j) => (
                <li key={j} className="text-xs mb-1" style={{ color: colors.textDim, listStyleType: "disc" }}>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegalPanel({ language }) {
  const [section, setSection] = useState("disclaimer");

  return (
    <div className="px-5">
      <p className="text-xs mb-4" style={{ color: colors.textDim }}>{tr("Villkor och ansvarsbegränsning för Calio Bite.", language)}</p>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setSection("disclaimer")}
          className="rounded-full px-4 py-2 text-xs font-bold"
          style={{
            backgroundColor: section === "disclaimer" ? colors.primary : colors.surfaceMuted,
            color: section === "disclaimer" ? colors.onPrimary : colors.textDim,
          }}
        >
          Disclaimer
        </button>
        <button
          onClick={() => setSection("terms")}
          className="rounded-full px-4 py-2 text-xs font-bold"
          style={{
            backgroundColor: section === "terms" ? colors.primary : colors.surfaceMuted,
            color: section === "terms" ? colors.onPrimary : colors.textDim,
          }}
        >
          Terms of Service
        </button>
      </div>

      {section === "disclaimer" && (
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
      )}

      {section === "terms" && <TermsOfServiceContent />}

      <p className="text-[11px] text-center mt-5" style={{ color: colors.textDim }}>
        © {new Date().getFullYear()} Femtes. {tr("Alla rättigheter förbehållna.", language)}
      </p>
    </div>
  );
}

function TermsOfServiceContent() {
  const h = "text-sm font-bold mt-5 mb-1.5";
  const h0 = "text-base font-bold mt-6 mb-2";
  const p = "text-xs mb-3";
  const pStyle = { color: colors.textDim, lineHeight: 1.6 };
  const li = "text-xs mb-1.5";

  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}>
      <h3 className="text-base font-bold mb-1">Terms of Service</h3>
      <p className="text-xs mb-4" style={{ color: colors.textDim }}>Last Updated Date: 7th September, 2026</p>

      <h4 className={h0}>General Terms – All Users</h4>
      <p className={p} style={pStyle}>
        Welcome to Calio Bite (the "Platform"), which is provided and controlled by Femtes (the "Company", "we" or
        "us").
      </p>
      <p className={p} style={pStyle}>
        You are reading the Terms of Service (the "Terms"), which govern the relationship and serve as an agreement
        between you and the Company and set forth the terms and conditions by which you may access and use the
        Platform and our related websites, services, applications, products and content (collectively, the
        "Services"). Our Services are provided for private, non-commercial use. For purposes of these Terms, "you"
        and "your" means you as the user of the Services.
      </p>
      <p className={p} style={pStyle}>
        The Terms form a legally binding agreement between you and the Company. Please take the time to read them
        carefully. By accessing or using the Services you agree to be bound by these Terms. If you disagree with any
        part of the Terms, then you may not access the Service. The calculation results are for reference only and
        do not constitute medical advice. The user shall be solely responsible for any actions and consequences
        resulting from the output information of this product.
      </p>

      <h4 className={h0}>I. Your Agreement with the Company</h4>
      <p className={p} style={pStyle}>
        1. Individual users. CALIO BITE IS NOT AVAILABLE TO PERSONS UNDER THE AGE OF 16. If you are under the age of
        16, you must have permission from your legal guardian before using Calio Bite.
      </p>
      <p className={p} style={pStyle}>
        2. Non-individual users. If you are accessing or using the Services on behalf of a business or entity, then
        (a) "you" and "your" includes you and that business or entity, (b) you represent and warrant that you are an
        authorized representative of the business or entity with the authority to bind the business or entity to
        these Terms and that you agree to these Terms on behalf of the business or entity, and (c) your business or
        entity is legally and financially responsible for your access or use of the Services as well as for the
        access or use of your account by others affiliated with your business or entity, including any employees,
        agents or contractors.
      </p>
      <p className={p} style={pStyle}>
        3. Supplemental Terms. If you access or use the Services from a jurisdiction for which there are separate
        supplemental terms, you also hereby agree to the supplemental terms applicable to users in each jurisdiction
        as outlined in the relevant "Supplemental Terms – Jurisdiction Specific" section below. In the event of a
        conflict between the provisions of the Supplemental Terms – Jurisdiction Specific that is relevant to your
        jurisdiction from which you access or use the Services, and the rest of these Terms, the relevant
        jurisdiction's Supplemental Terms – Jurisdiction Specific will supersede and control with respect to your use
        of the Services from that jurisdiction.
      </p>
      <p className={p} style={pStyle}>
        4. Changes to the Terms. We may amend these Terms from time to time, for instance when we update the
        functionality of our Services, when we combine apps or services operated by us or our affiliates into one
        single combined service or app, or when there are regulatory changes. We use commercially reasonable efforts
        to generally notify all users of any material changes to these Terms, such as through a notice on the
        Platform, however, you should look at the Terms regularly to check for such changes. We will also update the
        "Last Updated" date at the top of these Terms, which reflects the effective date of such Terms. Your
        continued access or use of the Services after the date of the new Terms constitutes your acceptance of the
        new Terms. If you do not agree to the new Terms, you must stop accessing or using the Services.
      </p>

      <h4 className={h0}>II. Use of the Services</h4>
      <p className={h}>1. License</p>
      <p className={p} style={pStyle}>
        Subject to the Terms, you are hereby granted a non-exclusive, limited, non-transferable, non-sublicensable,
        revocable license to access and use the Services, including to download the Platform onto a permitted
        device, and to access the Company's Content (defined below) solely for your personal, non-commercial use
        through your use of the Services and solely in compliance with these Terms. The Company reserves all rights
        not expressly granted herein in the Services and the Company's Content. You acknowledge and agree that the
        Company may terminate this license at any time for any reason or no reason.
      </p>
      <p className={p} style={pStyle}>
        NO RIGHTS ARE LICENSED WITH RESPECT TO SOUND RECORDINGS AND THE MUSICAL WORKS EMBODIED THEREIN THAT ARE MADE
        AVAILABLE FROM OR THROUGH THE SERVICE.
      </p>
      <p className={h}>2. Restrictions on Use</p>
      <p className={p} style={pStyle}>
        Your access to and use of the Services shall be subject to these Terms and all applicable laws and
        regulations. You may not:
      </p>
      <ul style={{ paddingLeft: 18 }} className="mb-3">
        {[
          "access or use the Services if you are not fully able and legally competent to agree to these Terms or are authorized to use the Services by your parent or legal guardian;",
          "make unauthorized copies, modify, adapt, translate, reverse engineer, disassemble, decompile or create any derivative works of the Services or any content included therein, including any files, tables, or documentation (or any portion thereof) or determine or attempt to determine any source code, algorithms, methods or techniques embodied by the Services or any derivative works thereof;",
          "incorporate the Services or any portion thereof into any other program or product;",
          "distribute, license, transfer, or sell, in whole or in part, any of the Services or any derivative works thereof;",
          "market, rent or lease the Services for a fee or charge, or use the Services to advertise or perform any commercial solicitation;",
          "use the Services, without our express written consent, for any commercial or unauthorized purpose, including communicating or facilitating any commercial advertisement or solicitation or spamming;",
          "interfere with or attempt to interfere with the proper working of the Services, disrupt our website or any networks connected to the Services, or bypass any measures we may use to prevent or restrict access to the Services;",
          "use automated scripts to collect information from or otherwise interact with the Services;",
          "impersonate any person or entity, or falsely state or otherwise misrepresent you or your affiliation with any person or entity, including giving the impression that any content you upload, post, transmit, distribute or otherwise make available emanates from the Services;",
          "promote sexually explicit material, violence, or discrimination based on race, sex, religion, nationality, disability, sexual orientation, or age;",
          "use the services to upload, transmit, distribute, store or otherwise make available in any way files that contain viruses, trojans, worms, logic bombs, or other material that is malicious or technologically harmful;",
          "hack into, or insert malicious code, including viruses, or harmful data, into, our services;",
          "use the Services in a manner that violates or infringes on someone else's rights of publicity, privacy, copyright, trademark, or other intellectual property rights;",
          "use the Services in a manner that is harmful, fraudulent, deceptive, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, or otherwise objectionable;",
          "in any way promote or incite anyone to commit or assist in any unlawful or criminal activity or anti-social behavior, or encourage activities which could endanger the safety or wellbeing of others;",
          "disclose anyone's personal information or invade their privacy;",
          "engage in any other conduct that restricts or inhibits any person from using or enjoying the Services, or that, in our sole judgment, exposes us or any of our users, affiliates, or any other third party to any liability, damages, or detriment.",
        ].map((item, i) => (
          <li key={i} className={li} style={{ ...pStyle, listStyleType: "disc" }}>
            {item}
          </li>
        ))}
      </ul>
      <p className={p} style={pStyle}>
        Violations of system or network security may result in civil or criminal liability. We may investigate and
        work with law enforcement authorities to prosecute users who violate the Terms. We may also suspend or
        terminate your access to the Services at any time without notice for any reason.
      </p>

      <h4 className={h0}>III. Payment</h4>
      <p className={h}>1. Fees</p>
      <p className={p} style={pStyle}>
        Certain Services, features or contents are only offered for payment (such as paid content and VIP account).
        You agree to pay whatever fees and other charges are presented to you when you decide to purchase such paid
        services (collectively the "Fees"). If you download the App from the Apple App Store, refunds are permissible
        following Apple's refund policy; otherwise, refunds are not allowed following our refund policies. Except as
        stated in those policies or stipulated in applicable laws, all Fees are non-refundable and non-cancellable.
      </p>
      <p className={h}>2. Payment Methods and Processing</p>
      <p className={p} style={pStyle}>
        Payments may be processed via the relevant App Marketplace, as well as any other third-party payment methods
        which we make available (such as via PayPal and certain supported payment cards). You must provide accurate
        billing information, and promptly update any changes to it (such as card numbers and expiry dates). If you
        are paying via credit or debit card, you represent that you are the authorized user of the card, and you
        authorize us (and any third-party payment processor) to collect payment from you, on a recurring basis (if
        applicable), and to take all other necessary billing actions. If payment is made via a third-party payment
        processor, you will also be subject to its terms and conditions (over which we have no control) – so
        carefully read those terms.
      </p>

      <h4 className={h0}>IV. Intellectual Property Rights</h4>
      <p className={p} style={pStyle}>
        The Services are protected under the laws of copyright, patent, trademarks and other intellectual property
        rights of the countries where Services are available. All copyrights in the Services are owned by us or our
        third-party licensors to the full extent permitted under all applicable laws. Consistent with the other terms
        in this document, you may not publish, reproduce, distribute, display, perform, edit, adapt, modify, or
        otherwise exploit any part of the Services without our written consent.
      </p>
      <p className={p} style={pStyle}>
        We respect intellectual property rights and require you to do the same. As a condition of your access to and
        use of the Services, you agree not to infringe on any intellectual property rights while accessing or using
        the Services or use any content therein for any commercial or unauthorized purposes. We reserve the right,
        with or without notice, at any time and in our sole discretion to block access to the Services, including
        without limitation for any user who infringes or is alleged to infringe any intellectual property rights or
        proprietary rights.
      </p>

      <h4 className={h0}>V. Content</h4>
      <p className={h}>1. The Company's Content</p>
      <p className={p} style={pStyle}>
        As between you and the Company, all content, software, images, text, graphics, illustrations, logos,
        stickers, filters, patents, trademarks, service marks, copyrights, photographs, audio, videos, music on and
        "look and feel" of the Services, and all intellectual property rights related thereto (the "Company's
        Content"), are either owned or licensed by the Company. Use of the Company's Content or materials on the
        Services for any purpose not expressly permitted by these Terms is strictly prohibited. The Company's Content
        may not be downloaded, copied, reproduced, distributed, transmitted, broadcast, displayed, sold, licensed or
        otherwise exploited for any purpose whatsoever without our or, where applicable, our licensors' prior written
        consent. We and our licensors reserve all rights not expressly granted in and to their content.
      </p>
      <p className={p} style={pStyle}>
        We make no representations, warranties or guarantees, whether express or implied, that any Company's Content
        is accurate, complete or up to date. Where our Services contain links to other sites and resources provided
        by third parties, these links are provided for your information only. We have no control over the contents
        of those sites or resources. Such links should not be interpreted as approval by us of those linked websites
        or information you may obtain from them.
      </p>
      <p className={h}>2. User-Generated Content</p>
      <p className={p} style={pStyle}>
        By using our Services, you provide us with information, photos, entries and other material that you submit
        to and create on the Platform (collectively your "User Content").
      </p>
      <p className={p} style={pStyle}>
        You retain full ownership to your User Content. We don't claim any ownership to any of it. These Terms do not
        grant us any rights to your User Content or intellectual property except for the limited rights that are
        needed to provide the Services, as explained below.
      </p>
      <p className={p} style={pStyle}>
        In order to provide the Services, we need your permission to host, store, and process your User Content. This
        is called a license. By uploading User Content to the Services, you grant us this license solely as is
        necessary to provide the corresponding Services, including where you actively choose to share a logged meal
        with another user via the sharing feature.
      </p>
      <p className={p} style={pStyle}>
        You are solely responsible for maintaining and protecting all of your User Content. We will not be liable for
        any loss or damage of your User Content, or for any costs or expenses associated with backing up or restoring
        any of your User Content.
      </p>
      <p className={h}>3. Input and Generative AI</p>
      <p className={p} style={pStyle}>
        You retain any copyright and other proprietary rights that you may hold in the Input (including photos,
        text descriptions, and ingredients) that you upload to the Services, subject to the licenses granted in this
        Agreement. You are responsible for your Input, including its content and accuracy, and will comply with
        applicable laws when using the Services. You represent and warrant that you have obtained all rights,
        consents, and permissions necessary for us to collect, access, use, disclose, transfer, transmit, store,
        host, or otherwise process Input as set forth in this Agreement without violating or infringing any laws or
        third-party rights.
      </p>
      <p className={p} style={pStyle}>
        You must not upload Input if you are not the owner of or are not fully authorized to grant rights in all of
        the elements of that Input. We disclaim any and all liability in connection with Input. You are solely
        responsible for your Input and the consequences of providing Input via the Services. By providing Input via
        the Services (such as photos of meals or ingredients, or written descriptions), you affirm, represent, and
        warrant to us that: (1) you are the creator and owner of the Input, or have the necessary rights and
        permissions to provide it; (2) the Input does not infringe, violate, misappropriate, or otherwise breach any
        third-party right; (3) the Input could not be deemed by a reasonable person to be objectionable, profane,
        indecent, pornographic, harassing, threatening, embarrassing, hateful, or otherwise inappropriate.
      </p>
      <p className={h}>4. Input Disclaimer</p>
      <p className={p} style={pStyle}>
        We are under no obligation to edit or control any Output (such as AI-estimated nutrition values, recipes, or
        suggestions) or any Input that you or other users upload, and we will not be in any way responsible or liable
        for Input or Output. We may, however, at any time and without prior notice, screen, remove, edit, or block
        any Input or Output that in our sole judgment violates this Agreement, is alleged to violate the rights of
        third parties, or is otherwise objectionable. You understand that Output generated by artificial intelligence
        may be inaccurate, incomplete, or objectionable, and you agree to waive any legal or equitable right or
        remedy you have or may have against us with respect to Input or Output.
      </p>
      <p className={h}>5. Output</p>
      <p className={p} style={pStyle}>
        YOU HEREBY ACKNOWLEDGE AND AGREE THAT: (A) THERE MAY BE ERRORS, INCONSISTENCIES, OR INACCURACIES IN OUTPUT
        (INCLUDING ESTIMATED CALORIES, MACRONUTRIENTS, CLIMATE IMPACT, OR COST) FOR VARIOUS REASONS, INCLUDING THE
        QUALITY OF THE INPUT AND THE INHERENT TECHNICAL LIMITATIONS AND PROBABILISTIC NATURE OF THE ARTIFICIAL
        INTELLIGENCE TECHNOLOGY USED IN CONNECTION WITH THE SERVICES; (B) OUTPUT MAY NOT BE UNIQUE OR EXCLUSIVE TO YOU
        AND OTHER USERS MAY RECEIVE SIMILAR OUTPUT; AND (C) WE MAKE NO REPRESENTATION OR WARRANTY THAT THE OUTPUT WILL
        BE ACCURATE, RELIABLE, OR FREE FROM ERRORS OR OTHER DEFECTS. YOU WILL BE SOLELY RESPONSIBLE FOR VERIFYING THE
        ACCURACY OF THE OUTPUT, INCLUDING BEFORE MAKING ANY HEALTH, DIETARY, OR MEDICAL DECISIONS BASED ON IT, AND ARE
        SOLELY LIABLE FOR ANY RELIANCE PLACED THEREON.
      </p>

      <h4 className={h0}>VI. Indemnify</h4>
      <p className={p} style={pStyle}>
        You agree to defend, indemnify, and hold harmless the Company, its parents, subsidiaries, and affiliates, and
        each of their respective officers, directors, employees, agents, assigns, and advisors from and against any
        and all loss, claims, liabilities, damages, costs, and expenses, including, but not limited to, attorneys'
        fees and expenses, arising out of a breach by you or any user of your account of these Terms or arising out
        of a breach of your obligations, representations and warranties under these Terms.
      </p>

      <h4 className={h0}>VII. Exclusion of Warranties</h4>
      <p className={p} style={pStyle}>
        NOTHING IN THESE TERMS SHALL AFFECT ANY STATUTORY RIGHTS THAT YOU CANNOT CONTRACTUALLY AGREE TO ALTER OR WAIVE
        AND ARE LEGALLY ALWAYS ENTITLED TO AS A CONSUMER.
      </p>
      <p className={p} style={pStyle}>
        THE SERVICES ARE PROVIDED "AS IS" AND WE MAKE NO WARRANTY OR REPRESENTATION OF ANY KIND, EITHER EXPRESS OR
        IMPLIED, TO YOU WITH RESPECT TO THEM. IN PARTICULAR WE DO NOT REPRESENT OR WARRANT TO YOU THAT: YOUR USE OF
        THE SERVICES WILL MEET YOUR REQUIREMENTS; YOUR USE OF THE SERVICES WILL BE UNINTERRUPTED, TIMELY, SECURE OR
        FREE FROM ERROR; ANY INFORMATION OBTAINED BY YOU AS A RESULT OF YOUR USE OF THE SERVICES WILL BE ACCURATE OR
        RELIABLE; OR DEFECTS IN THE OPERATION OR FUNCTIONALITY OF ANY SOFTWARE PROVIDED TO YOU AS PART OF THE SERVICES
        WILL BE CORRECTED.
      </p>
      <p className={p} style={pStyle}>
        NO CONDITIONS, WARRANTIES OR OTHER TERMS (INCLUDING ANY IMPLIED TERMS OR WARRANTIES AS TO SATISFACTORY
        QUALITY, MERCHANTABILITY, FITNESS FOR PURPOSE, CONFORMANCE WITH DESCRIPTION, NON-INFRINGEMENT, OR OTHER
        VIOLATION OF RIGHTS) APPLY TO THE SERVICES EXCEPT TO THE EXTENT THAT THEY ARE EXPRESSLY SET OUT IN THE TERMS.
        WE MAY CHANGE, SUSPEND, WITHDRAW OR RESTRICT THE AVAILABILITY OF ALL OR ANY PART OF THE PLATFORM FOR BUSINESS
        AND OPERATIONAL REASONS AT ANY TIME WITHOUT NOTICE.
      </p>

      <h4 className={h0}>VIII. Limitation of Liability</h4>
      <p className={p} style={pStyle}>
        NOTHING IN THESE TERMS SHALL EXCLUDE OR LIMIT OUR LIABILITY FOR LOSSES WHICH MAY NOT BE LAWFULLY EXCLUDED OR
        LIMITED BY APPLICABLE LAW, INCLUDING MANDATORY CONSUMER PROTECTION LAW OF THE EUROPEAN UNION. THIS INCLUDES
        LIABILITY FOR DEATH OR PERSONAL INJURY CAUSED DIRECTLY BY OUR NEGLIGENCE OR THE NEGLIGENCE OF OUR EMPLOYEES OR
        AGENTS AND FOR FRAUD OR FRAUDULENT MISREPRESENTATION.
      </p>
      <p className={p} style={pStyle}>
        SUBJECT TO THE PARAGRAPH ABOVE, WE SHALL NOT BE LIABLE TO YOU FOR: (I) ANY LOSS OF PROFIT; (II) ANY LOSS OF
        GOODWILL; (III) ANY LOSS OF OPPORTUNITY; (IV) ANY LOSS, MISUSE, MANIPULATION OR OTHER UTILIZATION OF DATA
        SUFFERED BY YOU OR COMPUTER VIRUS; OR (V) ANY INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL OR PUNITIVE DAMAGES
        WHATSOEVER WHICH MAY BE INCURRED BY YOU, INCLUDING LOSS OR DAMAGE ARISING FROM ANY CHANGES WE MAY MAKE TO THE
        SERVICES, ANY CESSATION OF THE SERVICES, OR THE DELETION OF, CORRUPTION OF, OR FAILURE TO STORE ANY CONTENT.
      </p>
      <p className={p} style={pStyle}>
        THESE LIMITATIONS ON OUR LIABILITY TO YOU SHALL APPLY WHETHER OR NOT WE HAVE BEEN ADVISED OF OR SHOULD HAVE
        BEEN AWARE OF THE POSSIBILITY OF ANY SUCH LOSSES ARISING. YOU ARE RESPONSIBLE FOR ANY MOBILE OR DATA CHARGES
        THAT MAY APPLY TO YOUR USE OF OUR SERVICE. IF YOU'RE UNSURE WHAT THOSE CHARGES MAY BE, YOU SHOULD ASK YOUR
        SERVICE PROVIDER BEFORE USING THE SERVICE.
      </p>

      <h4 className={h0}>IX. Termination</h4>
      <p className={p} style={pStyle}>
        1. Termination by us. We reserve the right to suspend and/or terminate our Services at any time, with or
        without cause, and with or without notice.
      </p>
      <p className={p} style={pStyle}>
        2. Termination by you. You may stop using the Services at any time via the functionality offered or by
        cancelling your Account (see the "Log out" option in the menu, or contact us to request account deletion).
        Termination will take effect immediately, so please confirm there's no unused property interests in your
        account. We are not responsible for any loss of your rights and interests caused by your voluntary
        termination of the Services. Termination of your account does not relieve you of any obligation to pay any
        outstanding fees.
      </p>
      <p className={p} style={pStyle}>
        3. Survival. Upon the expiration or termination of the Terms, some or all of the Services may cease to
        operate without prior notice. Your indemnification obligations, our warranty disclaimers and limitations of
        liabilities, and dispute resolution provisions stated in the Terms will survive.
      </p>

      <h4 className={h0}>X. Miscellaneous</h4>
      <p className={p} style={pStyle}>
        1. Applicable Law and Jurisdiction. Calio Bite is operated by Femtes, based in Sweden. These Terms shall be
        construed in accordance with the laws of Sweden, without regard to its conflict of laws rules. Any dispute
        arising out of or in connection with these Terms, including any question regarding the existence, validity
        or termination of these Terms, shall be subject to the non-exclusive jurisdiction of the courts of Sweden.
        This does not deprive you, as a consumer, of the protection afforded to you by mandatory provisions of the
        law of the European Union member state in which you are resident, which cannot be derogated from by
        agreement.
      </p>
      <p className={p} style={pStyle}>
        2. Open Source. The Platform contains certain open source software. Each item of open source software is
        subject to its own applicable license terms.
      </p>
      <p className={p} style={pStyle}>
        3. Entire Agreement. These Terms constitute the whole legal agreement between you and the Company and govern
        your use of the Services, superseding any prior or contemporaneous communications and proposals (whether
        oral, written or electronic) between you and us.
      </p>
      <p className={p} style={pStyle}>
        4. No Waiver. Our failure to enforce any provisions of these Terms or respond to a violation by any party
        does not waive our right to subsequently enforce any terms or conditions of the Terms or respond to any
        violations.
      </p>
      <p className={p} style={pStyle}>
        5. Security. We do not guarantee that our Services will be secure or free from bugs or viruses. You are
        responsible for configuring your information technology, computer programs and platform to access our
        Services. You should use your own virus protection software.
      </p>
      <p className={p} style={pStyle}>
        6. Severability. If any court of law, having jurisdiction to decide on this matter, rules that any provision
        of these Terms is invalid, then that provision will be removed from the Terms without affecting the rest of
        the Terms, and the remaining provisions of the Terms will continue to be valid and enforceable.
      </p>
      <p className={p} style={pStyle}>
        7. Assignment. You may not assign these Terms or assign any rights or delegate any obligations hereunder, in
        whole or in part, without our prior written consent. We may assign these Terms or any rights hereunder
        without your consent and without notice.
      </p>
      <p className={p} style={pStyle}>
        8. Third-Party Services. Our Services may include links to features and services provided by third parties
        (such as Open Food Facts for product data, and Google's Gemini for AI-based photo and text analysis). We do
        not control such third-party services and are not responsible for their content or functionality. The terms
        applicable to such third-party services will apply, and we will not be responsible for anything done by you
        or the third-party service provider in connection with your use of their service.
      </p>
      <p className={p} style={pStyle}>
        9. Privacy Policy. Your privacy is very important to us. Please refer to our Privacy Policy for information
        on how we collect, use and disclose personal information.
      </p>
      <p className={p} style={pStyle}>
        10. Contact. If you have any questions regarding these Terms, please feel free to contact us at:{" "}
        support@caliobite.com.
      </p>

      <h4 className={h0}>Supplemental Terms – Jurisdiction Specific</h4>
      <p className={h}>European Union</p>
      <p className={p} style={pStyle}>The following terms apply if you reside in the European Union:</p>
      <p className={p} style={pStyle}>
        Dispute Resolution. If you are a "consumer" as defined under EU Directive 2011/83/EU, any dispute,
        controversy or claim (whether in contract, tort or otherwise) between us and you, arising out of, relating
        to, or in connection with these Terms, may be referred to and finally resolved by the court of your place of
        residence or domicile, in addition to the courts of Sweden. You can also file a complaint at the online
        platform for alternative dispute resolution (ODR platform), which you can find at:{" "}
        https://ec.europa.eu/consumers/odr.
      </p>
      <p className={p} style={pStyle}>
        Loss or damage. If any Calio Bite services or features which we have supplied damage a device or digital
        content belonging to you, and this is caused by our failure to use reasonable care and skill, we will either
        repair the damage or pay you reasonable compensation for such damage. However, we will not be liable for
        damage which you could have avoided by following our advice to apply an update offered to you free of
        charge, or for damage caused by you failing to correctly follow installation instructions or to have in place
        the minimum system requirements advised by us. We only supply the Services accessible via the Platform for
        domestic and private use. If you use the Services for any commercial or business purpose, we will have no
        liability to you for any loss of profit, loss of business, business interruption, or loss of business
        opportunity.
      </p>
      <p className={p} style={pStyle}>
        Nothing in these Terms affects any legal rights that you are entitled to as a consumer under European Union
        member state laws which cannot be contractually altered or waived. Accordingly, some of the exclusions and
        limitations in Sections VII and VIII of these Terms will not apply to you if you are a consumer living in a
        European Union country.
      </p>
    </div>
  );
}

function ScannerPanel({ category, onCategoryChange, flow, onTriggerCamera, onClose, onAddSuggestion, goals, consumed, language }) {
  const remainingKcal = goals ? Math.max(0, goals.kcalGoal - consumed.kcal) : null;

  return (
    <div className="px-5">
      <p className="text-xs font-bold mb-2" style={{ color: colors.textDim }}>
        {tr("Vad vill du ha förslag på?", language)}
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
            {tr(c.label, language)}
          </button>
        ))}
      </div>

      {goals ? (
        <div className="rounded-2xl px-4 py-3 mb-5" style={{ backgroundColor: colors.surfaceMuted }}>
          <p className="text-xs" style={{ color: colors.textDim }}>
            {language === "en" ? (
              <>You have <span className="font-bold" style={{ color: colors.text }}>{remainingKcal} kcal</span> left of today's goal — suggestions are adapted accordingly.</>
            ) : (
              <>Du har <span className="font-bold" style={{ color: colors.text }}>{remainingKcal} kcal</span> kvar av dagens mål — förslagen anpassas efter det.</>
            )}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl px-4 py-3 mb-5" style={{ backgroundColor: colors.surfaceMuted }}>
          <p className="text-xs" style={{ color: colors.textDim }}>
            {tr("Ställ in dina mål under", language)} "{getTabLabel("budget", language)}" {tr("så kan förslagen anpassas efter hur mycket du har kvar att äta.", language)}
          </p>
        </div>
      )}

      {(!flow || flow.step === "results" || flow.step === "error") && (
        <button
          onClick={onTriggerCamera}
          className="w-full rounded-xl py-4 text-sm font-bold mb-6"
          style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
        >
          {tr("📷 Fota kylskåp / skafferi", language)}
        </button>
      )}

      {flow && flow.step === "analyzing" && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div
            className="w-9 h-9 rounded-full animate-spin"
            style={{ border: `3px solid ${colors.hairline}`, borderTopColor: colors.primary }}
          />
          <p className="text-sm" style={{ color: colors.textDim }}>
            {tr("Analyserar innehållet …", language)}
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
                    · P {Math.round(s.protein_g)}g · {language === "en" ? "C" : "K"} {Math.round(s.carbs_g)}g · F {Math.round(s.fat_g)}g · Fi{" "}
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
  language,
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
        >{tr("Starta fasta", language)}</button>
      )}

      {(startParts || endParts) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.hairline}` }}>
            <p className="text-xs mb-1" style={{ color: colors.textDim }}>{tr("Starta fasta", language)}</p>
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
                    <button onClick={onOpenEditStart} aria-label={tr("Ändra starttid", language)} style={{ color: colors.primary, fontSize: 12 }}>
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
          {tr("Generell översikt över vad som händer i kroppen ju längre en fasta pågår", language)}
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
                        >{tr("Nu", language)}</span>
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
              <h3 className="text-base font-bold">{tr("Välj fastemetod", language)}</h3>
              <button onClick={onCloseMethod} className="text-lg" style={{ color: colors.textDim }} aria-label={tr("Stäng", language)}>
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
                {language === "en" ? "Use" : "Använd"}
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

function WalkOffCard({ kcal, weightKg, onAddStepGoal, language }) {
  const [addedForKcal, setAddedForKcal] = useState(null);
  if (!kcal || kcal <= 0) return null;

  const steps = Math.round((kcal * STEPS_PER_KM) / (KCAL_PER_KG_PER_KM * weightKg));
  const minutes = Math.round(steps / 100);
  const isAdded = addedForKcal === kcal;

  return (
    <div className="rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: colors.surfaceMuted }}>
      <p className="text-xs mb-2" style={{ color: colors.textDim }}>
        🚶 {language === "en" ? "This is equivalent to" : "Det här motsvarar"}{" "}
        <span className="font-bold" style={{ color: colors.text }}>
          {steps.toLocaleString(language === "en" ? "en-US" : "sv-SE")} {language === "en" ? "steps" : "steg"}
        </span>{" "}
        {language === "en" ? "or" : "eller"}{" "}
        <span className="font-bold" style={{ color: colors.text }}>
          {minutes} {language === "en" ? "minutes of walking" : "minuters promenad"}
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
        {isAdded
          ? language === "en"
            ? "Added to today's step goal ✓"
            : "Tillagt i dagens stegmål ✓"
          : language === "en"
          ? "Add as step goal"
          : "Lägg till som stegmål"}
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

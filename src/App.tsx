// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://hbzqalhbkaojavxteelm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhienFhbGhia2FvamF2eHRlZWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjkzMzQsImV4cCI6MjA4ODcwNTMzNH0.D77-lMvr5_v5J1Ycj7_t3rcNXEog9bgadVALnckvrLA";

async function dbLoad() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/finance_data?id=eq.main&select=data`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
  });
  const rows = await res.json();
  return rows?.[0]?.data || null;
}

async function dbSave(payload) {
  await fetch(`${SUPABASE_URL}/rest/v1/finance_data?id=eq.main`, {
    method: "PATCH",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    body: JSON.stringify({ data: payload, updated_at: new Date().toISOString() })
  });
}

const VAT_RATE = 0.18;
const INCOME_TAX = 0.23;
const MONTHS_HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const INCOME_CATEGORIES = [
  { key: "retainers", label: "ריטיינרים", icon: "🔁" },
  { key: "partnerships", label: "שיתופי פעולה", icon: "🤝" },
  { key: "variable", label: "הכנסות משתנות", icon: "📊" },
  { key: "onetime", label: "הכנסות חד פעמיות", icon: "⚡" },
  { key: "affiliate", label: "אפיליאייט", icon: "🔗" },
];
const EXPENSE_CATEGORIES = [
  { key: "fixed", label: "הוצאות קבועות", icon: "📌" },
  { key: "variable", label: "הוצאות משתנות", icon: "📉" },
];
const STATUS_OPTIONS = [
  { value: "paid",     label: "שולם",              color: "#16a34a", bg: "#dcfce7" },
  { value: "invoice",  label: "תישלח חשבונית",     color: "#7c3aed", bg: "#ede9fe" },
  { value: "pending",  label: "נשלחה חשבונית",     color: "#b45309", bg: "#fef3c7" },
  { value: "unpaid",   label: "לא שולם",            color: "#dc2626", bg: "#fee2e2" },
];
const INCOME_COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899"];
const EXPENSE_COLORS = ["#ef4444","#f97316"];

let _id = 0;
function genId() { return "e" + (++_id); }
function todayStr() { return new Date().toISOString().slice(0,10); }
function newEntry(name="", net="", status="paid") { return { id: genId(), name, net, status, reminderSent:"", reminderCount:0 }; }
function initMonth() {
  return {
    income: { retainers:[newEntry()], partnerships:[newEntry()], variable:[newEntry()], onetime:[newEntry()], affiliate:[newEntry()] },
    expenses: { fixed:[newEntry()], variable:[newEntry()] }
  };
}
function entryNetVal(e) { return parseFloat(e.net)||0; }
function calcNetEntries(entries) { return entries.reduce((s,e)=>s+entryNetVal(e),0); }
function fmt(n) { if(!n && n!==0) return "—"; return "₪"+Math.round(n).toLocaleString("he-IL"); }
function fmtPct(n) { return n.toFixed(1)+"%"; }
function getMonthStats(m) {
  const inc = INCOME_CATEGORIES.reduce((s,c)=>s+calcNetEntries(m.income[c.key]),0);
  const exp = EXPENSE_CATEGORIES.reduce((s,c)=>s+calcNetEntries(m.expenses[c.key]),0);
  const pb = inc - exp;
  const tax = pb>0 ? pb*INCOME_TAX : 0;
  const pa = pb - tax;
  const margin = inc>0 ? (pa/inc)*100 : 0;
  return { inc, exp, pb, tax, pa, margin };
}

function build2025() {
  const months = Array.from({length:12}, initMonth);
  function addI(mi, cat, name, net) {
    const arr = months[mi].income[cat];
    if(arr.length===1 && !arr[0].name) arr[0] = newEntry(name, String(net));
    else arr.push(newEntry(name, String(net)));
  }
  function addE(mi, cat, name, net) {
    const arr = months[mi].expenses[cat];
    if(arr.length===1 && !arr[0].name) arr[0] = newEntry(name, String(net));
    else arr.push(newEntry(name, String(net)));
  }

  [["מנטרה",2000],["סאני נדל״ן",4000],["סאני לאונג׳",4000],["Stage",2500],["גוני",3500],["KG4",2500],["ג׳ובאיקס",4000],["ליפט ליווי",3000],["Buona Casa",5000],["Vide",3000],["OKOA",3500],["Flexit",3500],["ליפט וואטסאפ",700]].forEach(([n,v])=>addI(0,"retainers",n,v));
  [["שיינא",0],["מדיקליק",963]].forEach(([n,v])=>addI(0,"partnerships",n,v));
  addI(0,"variable","סאני תקציב מדיה",10000);
  [["מיטל",4500],["ליפט אתר",4500],["אלי טאוב",7000],["דניאל גוראלניק",3500]].forEach(([n,v])=>addI(0,"onetime",n,v));
  addI(0,"affiliate","שופייפי",100);
  [["מדג׳יקס",1423],["גוגל מי ביזנס",116],["פאנל io",5198],["שרת יוחאי",99],["רמי לוי",30],["טלור",1000],["מידג׳רני",357],["אוטומציית וואטסאפ ליפט",700],["משרד",5300],["הלוואה",2188],["ריבית להלוואה",860],["עומר",15600],["נושן",1213]].forEach(([n,v])=>addE(0,"fixed",n,v));
  [["משכורת",31424],["תוכנה מזדמנת",2861],["סאני מדיה",5792],["מדיקליק מדיה",118],["אמיר סדן",3859],["דומיין",160],["רשם החברות",1306],["Mokrocket",215]].forEach(([n,v])=>addE(0,"variable",n,v));

  [["מנטרה",2000],["סאני נדל״ן",4000],["סאני לאונג׳",4000],["Stage",2500],["גוני",6263],["ג׳ובאיקס",4000],["ליפט ליווי",3000],["Buona Casa",5769],["Vide",3000],["OKOA",3185],["Flexit",2000],["ליפט וואטסאפ",700],["BOSCH",1214],["SIEMENS",980],["גרנטי",4000],["VENUS",1500]].forEach(([n,v])=>addI(1,"retainers",n,v));
  [["שיינא",0],["מדיקליק",0]].forEach(([n,v])=>addI(1,"partnerships",n,v));
  addI(1,"variable","סאני תקציב מדיה",10000);
  [["רז-גל דפוס",9150],["דף נחיתה - אביב",2588],["גרנטי",3777],["רז גל",10000]].forEach(([n,v])=>addI(1,"onetime",n,v));
  addI(1,"affiliate","שופייפי",100);
  [["מדג׳יקס",1400],["גוגל מי ביזנס",116],["פאנל io",2600],["שרת יוחאי",1603],["טלור",1000],["אוטומציית וואטסאפ ליפט",700],["משרד",5300],["הלוואה",2188],["ריבית להלוואה",860],["עומר",15600]].forEach(([n,v])=>addE(1,"fixed",n,v));
  [["משכורת",27752],["תבניות שופיפיי",2841],["שילוט סאני",3600],["סאני מדיה",4392],["דפוס ביט",300],["ליגרף",6200],["אסף פוני",1250],["שגיא אלומה",1650],["מייסן",2675],["בונת אתרים",500]].forEach(([n,v])=>addE(1,"variable",n,v));

  [["מנטרה",2000],["סאני נדל״ן",4000],["סאני לאונג׳",4000],["Stage",2500],["גוני",2500],["ג׳ובאיקס",4000],["ליפט ליווי",4500],["Buona Casa",5790],["Vide",3000],["OKOA",3185],["Flexit",2000],["ליפט וואטסאפ",700],["בוש",2769],["סימנס",2047],["אתא",7000],["פרפיום",4000],["ונוס",1500],["דומינוס",3500],["גרנטי",4000]].forEach(([n,v])=>addI(2,"retainers",n,v));
  addI(2,"partnerships","מדיקליק",28678);
  addI(2,"variable","סאני תקציב מדיה",10000);
  [["רויאלי",600],["אתר ונוס 1/3",3000]].forEach(([n,v])=>addI(2,"onetime",n,v));
  addI(2,"affiliate","שופייפי",100);
  [["גוגל מי ביזנס",200],["פאנל io",2592],["רמי לוי",30],["טלור",1000],["אוטומציית וואטסאפ ליפט",700],["משרד",5300],["הלוואה",2188],["ריבית להלוואה",860],["ניוקר טלפון",40]].forEach(([n,v])=>addE(2,"fixed",n,v));
  [["סאני מדיה",8685],["מדיה איקומון",1664],["יקב סנילביץ",2080],["איתן אוטומציות",2500],["אייבורי",529],["KSP",229],["שגיא אלומה",1800],["משכורת שחר ואופיר",30000],["משכורת עומר",12000],["משכורת רועי",12000]].forEach(([n,v])=>addE(2,"variable",n,v));

  [["מנטרה",2000],["סאני נדל״ן",4000],["סאני לאונג׳",4000],["Stage",2500],["גוני",5300],["ג׳ובאיקס",6000],["LIFT",4500],["Buona Casa",5782],["Vide",3000],["OKOA",3000],["בוש",2109],["Think & Drink",4000],["סימנס",815],["אתא",7000],["פרפיום",4000],["ונוס",1500],["לוטם",2000],["דומינוס פיצה",7000]].forEach(([n,v])=>addI(3,"retainers",n,v));
  addI(3,"partnerships","שיינא",0);
  addI(3,"variable","סאני תקציב מדיה",10000);
  [["ליפט אתר 1/2",3500],["טרבל בייסיק",1875],["נועם חזן - 6 שעות",1500],["סנסו שעות - 10",3000]].forEach(([n,v])=>addI(3,"onetime",n,v));
  addI(3,"affiliate","שופייפי",280);
  [["גוגל מי ביזנס",200],["פאנל io",3143],["רמי לוי",30],["טלור",1000],["אוטומציית וואטסאפ ליפט",700],["משרד",5300],["הלוואה",2188],["ריבית להלוואה",860],["ניוקר טלפון",40]].forEach(([n,v])=>addE(3,"fixed",n,v));
  [["סאני מדיה",7122],["מדיה איקומון",1526],["שגיא אלומה",2050],["איתן אוטומציות",2500],["עדי לנדאו",3000],["משכורת שחר",15712],["משכורת אופיר",15712],["משכורת עומר",10410],["משכורת רועי",12000],["מתנות לחג",600],["פנסיה רועי",2500]].forEach(([n,v])=>addE(3,"variable",n,v));

  [["מנטרה",2000],["סאני נדל״ן",4000],["סאני לאונג׳",4000],["Stage",2500],["גוני",6300],["ג׳ובאיקס",6000],["LIFT",5000],["Buona Casa",6186],["Vide",3000],["HOT TUNA",2000],["DIAMANT",1500],["Guaranty",4000],["בוש",662],["Think & Drink",2000],["סימנס",1521],["אתא",7000],["פרפיום",4000],["ונוס",1500]].forEach(([n,v])=>addI(4,"retainers",n,v));
  addI(4,"partnerships","שיינא",0);
  addI(4,"variable","סאני תקציב מדיה",10000);
  [["לונגוויטי אתר",3500],["סנסו שעות - 10",3000],["אתר ליפט - 2",600],["אתר ונוס - 2/3",3000]].forEach(([n,v])=>addI(4,"onetime",n,v));
  addI(4,"affiliate","שופייפי",221);
  [["גוגל מי ביזנס",218],["פאנל io",3047],["רמי לוי",30],["טלור",1300],["זפייר",346],["משרד",5300],["הלוואה",2293],["ריבית להלוואה",783],["ניוקר טלפון",40],["We Tracker IO",553]].forEach(([n,v])=>addE(4,"fixed",n,v));
  [["סאני מדיה",6684],["מדיה איקומון",526],["בלה - שעות אתר",400],["משכורת שחר",15712],["משכורת אופיר",15712],["משכורת רועי",12000],["פנסיה עתידית",2500]].forEach(([n,v])=>addE(4,"variable",n,v));

  [["מנטרה",5000],["סאני נדל״ן",4000],["סאני לאונג׳",4000],["Stage",2500],["גוני",6300],["ג׳ובאיקס",6000],["LIFT",5000],["Buona Casa",6800],["Vide",2250],["HOT TUNA",3000],["DIAMANT",3000],["Guaranty",2000],["סימנס",350],["אתא",3500],["פרפיום",7000],["ונוס",1500],["דומינוס פיצה",7000],["SENSO",1500],["FemmeFun",2350],["שקל גרופ",3000],["לוטם",1000]].forEach(([n,v])=>addI(5,"retainers",n,v));
  addI(5,"partnerships","שיינא",0);
  addI(5,"variable","סאני תקציב מדיה",10000);
  [["פנים פריז - 9 שעות",2700],["סנסו שעות - 9",1800],["רון פלקסיט - 2 שעות",600],["מקסיקו",11600]].forEach(([n,v])=>addI(5,"onetime",n,v));
  addI(5,"affiliate","שופייפי",200);
  [["גוגל מי ביזנס",169],["פאנל io",2912],["רמי לוי",30],["טלור",1300],["wetracked io",535],["zapier",360],["הלוואה",2188],["ריבית להלוואה",860],["ניוקר טלפון",40]].forEach(([n,v])=>addE(5,"fixed",n,v));
  [["סאני מדיה",8555],["בלה",396],["יוחאי",350],["מחשבים",10650],["משכורת שחר",12300],["משכורת אופיר",12300],["משכורת רועי",8700],["פנסיה רועי",2500],["ב.ל",6070],["מ.ה",7759]].forEach(([n,v])=>addE(5,"variable",n,v));

  [["מנטרה",6000],["סאני נדל״ן",4000],["סאני לאונג׳",4000],["Stage",2500],["גוני",3900],["ג׳ובאיקס",6000],["LIFT",5000],["Buona Casa",6103],["Vide",3000],["HOT TUNA",3000],["DIAMANT",2100],["Guaranty",2000],["פאטרן",4000],["בלאקדוט",3000],["פרפיום",7000],["ונוס",1500],["FemmeFun",3577],["שקל גרופ",3000],["Lngvt",1500],["יוסי ומנש",3000]].forEach(([n,v])=>addI(6,"retainers",n,v));
  addI(6,"partnerships","שיינא",0);
  addI(6,"variable","סאני תקציב מדיה",10000);
  [["שעות אתר ליפט - 5",1500],["שעות לונגוויטי - 4",1200],["רון פלקסיט",600],["בואנה קאסה סופר פארם",800],["יילו פנדה - מיתוג",3000],["דאבלטיז אתר - 1/2",3228],["דומינוס",700]].forEach(([n,v])=>addI(6,"onetime",n,v));
  addI(6,"affiliate","שופייפי",200);
  [["גוגל מי ביזנס",169],["פאנל io",2928],["רמי לוי",30],["טלור",1300],["wetracked io",535],["zapier",3081],["הלוואה",2188],["ריבית להלוואה",860],["ניוקר טלפון",40]].forEach(([n,v])=>addE(6,"fixed",n,v));
  [["סאני מדיה",9511],["עדי לנדאו",6000],["בלה",517],["תבנית שופיפיי",1069],["מחשבים",10650],["משכורת שחר",12300],["משכורת אופיר",12300],["משכורת רועי",8700],["פנסיה רועי",2500],["ב.ל",6070],["מ.ה",7759]].forEach(([n,v])=>addE(6,"variable",n,v));

  [["מנטרה",4000],["סאני נדל״ן",4000],["סאני לאונג׳",4000],["Stage",2500],["גוני",10643],["ג׳ובאיקס",6000],["LIFT",5000],["Buona Casa",6000],["Vide",3000],["HOT TUNA",3000],["DIAMANT",1500],["פאטרן",4000],["בלאקדוט",3000],["פרפיום",8000],["ונוס",3250],["FemmeFun",3600],["שקל גרופ",5000],["Lngvt",2500],["נדלן יוון",2000]].forEach(([n,v])=>addI(7,"retainers",n,v));
  addI(7,"partnerships","ווטרלנד",2500);
  addI(7,"variable","סאני תקציב מדיה",10000);
  [["בואנה קאסה סופר פארם -12",2400],["דאבלטיז אתר - 2/2",4500],["יילו פנדה - מיתוג",3000],["אתר נגה",3000],["דף נחיתה וויטנס",1500],["הקמת אוטומציות לונגוויטי",2500],["פלקסיט",600],["דומינוס פיצה",720]].forEach(([n,v])=>addI(7,"onetime",n,v));
  addI(7,"affiliate","שופייפי",0);
  [["גוגל מי ביזנס",200],["פאנל io",2929],["רמי לוי",30],["טלור",1300],["wetracked io",535],["הלוואה",2188],["ריבית להלוואה",860],["ניוקר טלפון",40]].forEach(([n,v])=>addE(7,"fixed",n,v));
  [["סאני מדיה",8900],["עדי לנדאו",1500],["בוט - שנתי",7500],["ווטרלנד",7100],["דיוור ביטוח",200],["דומיין",145],["משכורת שחר",12300],["משכורת אופיר",12300],["משכורת רועי",8700],["פנסיה רועי",2500],["ב.ל",6070],["מ.ה",7759]].forEach(([n,v])=>addE(7,"variable",n,v));

  [["מנטרה",3000],["סאני נדל״ן",4000],["סאני לאונג׳",4000],["Stage",2500],["ג׳ובאיקס",6000],["LIFT",5000],["Buona Casa",6467],["Vide",3000],["DIAMANT",1500],["נדלן יוון",4000],["בלאקדוט",3000],["פרפיום",8000],["ונוס",3400],["FemmeFun",5100],["שקל גרופ",4000],["Lngvt",2500],["גולדה",1000]].forEach(([n,v])=>addI(8,"retainers",n,v));
  addI(8,"partnerships","שיינא",0);
  addI(8,"variable","סאני תקציב מדיה",10000);
  [["מולאטו - 1/2",6000],["שעות אתר - פאטרן",1200],["יילו פנדה - מיתוג",1500],["שעות אתר - לונגוויטי",2000],["הקמת בוט - כביסכל",1400]].forEach(([n,v])=>addI(8,"onetime",n,v));
  addI(8,"affiliate","שופייפי",0);
  [["גוגל מי ביזנס",189],["רמי לוי",30],["טלור",1300],["wetracked io",535],["zapier",244],["הלוואה",2188],["ריבית להלוואה",860],["ניוקר טלפון",40]].forEach(([n,v])=>addE(8,"fixed",n,v));
  [["סאני מדיה",9239],["יוסי",2025],["8N8",96],["CAPCUT",60],["ENVATO",113],["כיסאות",676],["ביימי",1110],["Open AI",34],["משכורת שחר",12300],["משכורת אופיר",12300],["משכורת רועי",8700],["פנסיה רועי",2500],["ב.ל",6070],["מ.ה",7759]].forEach(([n,v])=>addE(8,"variable",n,v));

  [["מנטרה",6000],["סאני נדל״ן",4000],["סאני לאונג׳",4000],["Stage",2500],["סיינסאנדקו",4000],["ג׳ובאיקס",6000],["LIFT",5000],["Buona Casa",6700],["DIAMANT",1700],["בלאקדוט",3000],["פרפיום",8450],["ונוס",3000],["FemmeFun",5100],["שקל גרופ",3000],["Lngvt",2500],["יוסי ומנש",1000],["נדלן יוון",4000]].forEach(([n,v])=>addI(9,"retainers",n,v));
  addI(9,"partnerships","שיינא",0);
  addI(9,"variable","סאני תקציב מדיה",10000);
  [["בואנה קאסה",400],["פאטרן (2)",600],["Lngvt - שעות",600],["דף נחיתה נדלן יוון 1/2",900]].forEach(([n,v])=>addI(9,"onetime",n,v));
  addI(9,"affiliate","שופייפי",0);
  [["גוגל מי ביזנס",200],["רמי לוי",30],["טלור",1300],["wetracked io",535],["הלוואה",2188],["ריבית להלוואה",860],["ניוקר טלפון",40]].forEach(([n,v])=>addE(9,"fixed",n,v));
  [["סאני מדיה",8000],["עדי לנדאו",2500],["תבנית בואנה קאסה",1280],["תבנית מולאטו",1315],["יוסי",5000],["בלה",400],["משכורת שחר",12300],["משכורת אופיר",12300],["משכורת רועי",8700],["פנסיה רועי",2500],["ב.ל",4500],["מ.ה",5000]].forEach(([n,v])=>addE(9,"variable",n,v));

  [["מנטרה",4000],["סאני נדל״ן",4000],["סאני לאונג׳",4000],["Stage",1500],["סיינסאנדקו",4000],["ג׳ובאיקס",7650],["LIFT",5000],["Buona Casa",6888],["DIAMANT",1500],["בלאקדוט",3000],["פרפיום",8450],["ונוס",3400],["FemmeFun",5123],["שקל גרופ",3000],["Lngvt",3000],["עדי בבלר",1000],["ביזי אתונה",4000],["GonSurfing",4500],["Ruze",5000],["סאבטקסט",7500]].forEach(([n,v])=>addI(10,"retainers",n,v));
  addI(10,"partnerships","שיינא",0);
  addI(10,"variable","סאני תקציב מדיה",10000);
  [["דף נחיתה נדלן יוון 2/2",900],["מולאטו אתר 2/2",6000],["עדי קולטון - 1/2",5000]].forEach(([n,v])=>addI(10,"onetime",n,v));
  addI(10,"affiliate","שופייפי",0);
  [["גוגל מי ביזנס",200],["What A Graph",3300],["רמי לוי",30],["טלור",1300],["wetracked io",535],["zapier",200],["הלוואה",2188],["ריבית להלוואה",860],["ניוקר טלפון",40]].forEach(([n,v])=>addE(10,"fixed",n,v));
  [["סאני מדיה",8989],["מאנדיי",2600],["בלה",2122],["דאפ",5000],["יוסי",5000],["משכורת שחר",12300],["משכורת אופיר",12300],["משכורת רועי",8700],["פנסיה רועי",2500],["ב.ל",4500],["מ.ה",5000]].forEach(([n,v])=>addE(10,"variable",n,v));

  [["מנטרה",2000],["סאני נדל״ן",4000],["סאני לאונג׳",4000],["Stage",1500],["ג׳ובאיקס",7284],["LIFT",5000],["Buona Casa",7602],["DIAMANT",1500],["פרפיום",8000],["ונוס",3431],["FemmeFun",5123],["שקל גרופ",4708],["Lngvt",2500],["עדי בבלר",1000],["GonSurfing",5000],["Ruze",5000],["סאבטקסט",4000],["מעיין",3000],["פיצי",3000],["מאור סבאג",1000],["בר ביצוע",2000]].forEach(([n,v])=>addI(11,"retainers",n,v));
  [["ליפט",200],["כביסכל",450],["אתונה",200]].forEach(([n,v])=>addI(11,"partnerships",n,v));
  addI(11,"variable","סאני תקציב מדיה",10000);
  [["שעות יקב סנילביץ",800],["שעות קידום פלקסיט",400],["עדי קולטון - 2/2",5000],["תום ביזי אתונה",1050],["דשבורד",1400],["סאם דומיין",100],["משק לב ארי",500],["דף נחיתה וויטנס",2000],["שעות lngvt",500]].forEach(([n,v])=>addI(11,"onetime",n,v));
  [["שופייפי",200],["פלאשי",240],["שרתי יוחאי",100]].forEach(([n,v])=>addI(11,"affiliate",n,v));
  [["גוגל מי ביזנס",200],["What A Graph",3300],["רמי לוי",30],["טלור",1300],["wetracked io",535],["zapier",200],["הלוואה",2188],["ריבית להלוואה",860],["ניוקר טלפון",40]].forEach(([n,v])=>addE(11,"fixed",n,v));
  [["סאני מדיה",8989],["שושן",870],["בלה",2000],["אביב",6000],["יוסי",5000],["משכורת שחר",12300],["משכורת אופיר",12300],["ב.ל",4500],["מ.ה",5000]].forEach(([n,v])=>addE(11,"variable",n,v));

  return months;
}

function build2026() {
  const months = Array.from({length:12}, initMonth);
  function addI(mi, cat, name, net) {
    const arr = months[mi].income[cat];
    if(arr.length===1 && !arr[0].name) arr[0] = newEntry(name, String(net));
    else arr.push(newEntry(name, String(net)));
  }
  function addE(mi, cat, name, net) {
    const arr = months[mi].expenses[cat];
    if(arr.length===1 && !arr[0].name) arr[0] = newEntry(name, String(net));
    else arr.push(newEntry(name, String(net)));
  }

  [["מנטרה",2500],["דפוס בארי",10322],["Stage",1500],["מאידן",5000],["ג׳ובאיקס",8324],["LIFT",5000],["Buona Casa",7856],["DIAMANT",1500],["פרפיום",8000],["ונוס",3385],["FemmeFun",5120],["שקל גרופ",3000],["Lngvt",2500],["עדי בבלר - גולדה",1000],["GonSurfing",5000],["Ruze",4000],["סאבטקסט",4000],["מעיין",3000],["פיצי",3000],["מאור סבאג",0],["בר ביצוע",6000],["רוסיו",5000],["חמדה",3500],["תינוקות",1500]].forEach(([n,v])=>addI(0,"retainers",n,v));
  [["ליפט - monday",200],["כביסכל - לחייב עומר",450],["מעיין - הקמת מאנדיי",750]].forEach(([n,v])=>addI(0,"partnerships",n,v));
  [["ליפט - שעות אתר",500],["טום - ביזי אתונה",600],["הקמת אתר - מאטו מאצ׳ה 1/2",4000],["יילו פנדה 2/2",12500],["Lngvt",250]].forEach(([n,v])=>addI(0,"onetime",n,v));
  [["שופייפי",200],["פלאשי",240],["שרתי יוחאי",100]].forEach(([n,v])=>addI(0,"affiliate",n,v));
  [["גוגל מי ביזנס",300],["What A Graph",3300],["רמי לוי",30],["טלור",1300],["wetracked io",535],["zapier",200],["הלוואה",2188],["ריבית להלוואה",860],["ניוקר טלפון",40],["דשבורד - PPG",1600]].forEach(([n,v])=>addE(0,"fixed",n,v));
  [["מאור לוי - Pivot",4500],["יוחאי",700],["אלעד פלדר",903],["יוסי",10000],["תשלום עמלה PPG",500],["תבנית מאטו",1235],["משכורת שחר",12300],["משכורת אופיר",12300],["ב.ל",4500],["מ.ה",5000]].forEach(([n,v])=>addE(0,"variable",n,v));

  [["מנטרה",4000],["קנדל קלאב",5000],["דפוס בארי",8914],["Stage",1500],["מאידן",5000],["ג׳ובאיקס",6531],["LIFT",5000],["Buona Casa",6444],["DIAMANT",1500],["פרפיום",12000],["ונוס",3400],["FemmeFun",6600],["שקל גרופ",3000],["Lngvt",2500],["עדי בבלר - גולדה",1000],["GonSurfing",4000],["Ruze",5000],["סאבטקסט",5000],["מעיין",3000],["פיצי",3000],["מאור סבאג",3000],["בר ביצוע",6000],["רוסיו",5000],["חמדה",3500],["תינוקות",1500]].forEach(([n,v])=>addI(1,"retainers",n,v));
  [["ליפט - monday",200],["כביסכל - לחייב עומר",450],["בונה קאסה בוט",900]].forEach(([n,v])=>addI(1,"partnerships",n,v));
  [["הקמת אתר - מאטו מאצ׳ה 2/2",2500],["קנדל קלאב 1/2",5000]].forEach(([n,v])=>addI(1,"onetime",n,v));
  [["שופייפי",200],["פלאשי",240],["שרתי יוחאי",100]].forEach(([n,v])=>addI(1,"affiliate",n,v));
  [["גוגל מי ביזנס",300],["רמי לוי",30],["טלור",1300],["wetracked io",535],["zapier",200],["הלוואה",2188],["ריבית להלוואה",860],["ניוקר טלפון",40],["דשבורד - PPG",4800]].forEach(([n,v])=>addE(1,"fixed",n,v));
  [["אלומה",6000],["אלעד פלדר",3500],["יוסי",10000],["תשלום עמלה PPG",500],["משכורת שחר",12300],["משכורת אופיר",12300],["ב.ל",4500],["מ.ה",5000]].forEach(([n,v])=>addE(1,"variable",n,v));

  return months;
}

// ===================== FIX 1: Smart StatusBadge - detects direction =====================
function StatusBadge({ value, onChange }) {
  const opt = STATUS_OPTIONS.find(o=>o.value===value)||STATUS_OPTIONS[0];
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [dropDir, setDropDir] = useState("down"); // "down" | "up"

  // FIX: detect if there's space below, if not - open upward
  useEffect(()=>{
    if(!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setDropDir(spaceBelow < 160 ? "up" : "down");
  }, [open]);

  // Close on outside click
  useEffect(()=>{
    if(!open) return;
    const handler = (e)=>{
      if(btnRef.current && !btnRef.current.closest('[data-status-badge]')?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return ()=>document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div data-status-badge style={{position:"relative"}} ref={btnRef}>
      <button
        onClick={e=>{e.stopPropagation();setOpen(o=>!o);}}
        style={{padding:"2px 8px",borderRadius:9999,border:"none",cursor:"pointer",background:opt.bg,color:opt.color,fontSize:11,fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>
        {opt.label}
      </button>
      {open && (
        <div style={{
          position:"fixed", // FIX: use fixed instead of absolute to escape overflow:hidden containers
          zIndex:9999,
          background:"#fff",
          borderRadius:8,
          boxShadow:"0 4px 24px rgba(0,0,0,0.18)",
          overflow:"hidden",
          minWidth:130,
          // Position will be set via JS below
        }}
        ref={el=>{
          if(el && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if(spaceBelow < 160) {
              el.style.bottom = (window.innerHeight - rect.top + 4) + "px";
              el.style.top = "auto";
            } else {
              el.style.top = (rect.bottom + 4) + "px";
              el.style.bottom = "auto";
            }
            // Align right edge with button right edge
            el.style.right = (window.innerWidth - rect.right) + "px";
            el.style.left = "auto";
          }
        }}>
          {STATUS_OPTIONS.map(o=>(
            <button key={o.value} onClick={e=>{e.stopPropagation();onChange(o.value);setOpen(false);}}
              style={{display:"block",width:"100%",padding:"8px 14px",border:"none",background:value===o.value?o.bg:"#fff",color:o.color,fontWeight:700,fontSize:12,cursor:"pointer",textAlign:"right",fontFamily:"inherit",transition:"background 0.1s"}}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function useIsMobile() {
  const [mobile, setMobile] = useState(()=>typeof window!=="undefined"&&window.innerWidth<640);
  useEffect(()=>{
    if(typeof window==="undefined") return;
    const h=()=>setMobile(window.innerWidth<640);
    window.addEventListener("resize",h);
    return ()=>window.removeEventListener("resize",h);
  },[]);
  return mobile;
}

// ── ecommon. design tokens ──────────────────────────────────────
// Primary:  #7c3aed (purple)   Secondary: #22c55e (green)
// Accent:   #a855f7             Surface:   #ffffff
// BG:       #f8f7ff (very light purple tint)
// Text:     #0f0a1e             Muted:     #6b7280
// Font:     Heebo (Google)
// ────────────────────────────────────────────────────────────────

let _cssInjected = false;
function injectCSS() {
  if(_cssInjected || typeof document==="undefined") return;
  _cssInjected = true;

  // Inject Heebo font
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap";
  document.head.appendChild(link);

  const style = document.createElement("style");
  style.textContent = `
    :root {
      --ec-purple:     #7c3aed;
      --ec-purple-lt:  #a855f7;
      --ec-purple-bg:  #f5f3ff;
      --ec-purple-mid: #ede9fe;
      --ec-green:      #22c55e;
      --ec-green-bg:   #f0fdf4;
      --ec-text:       #0f0a1e;
      --ec-muted:      #6b7280;
      --ec-border:     #e5e7eb;
      --ec-surface:    #ffffff;
      --ec-bg:         #f8f7ff;
      --ec-radius:     12px;
      --ec-radius-lg:  16px;
      --ec-shadow:     0 1px 8px rgba(124,58,237,0.07);
      --ec-shadow-md:  0 4px 20px rgba(124,58,237,0.12);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--ec-bg);
      font-family: 'Heebo', 'Segoe UI', Arial, sans-serif !important;
      color: var(--ec-text);
    }
    input, select, textarea, button {
      font-family: 'Heebo', 'Segoe UI', Arial, sans-serif !important;
      color: var(--ec-text) !important;
    }
    input::placeholder, textarea::placeholder { color: #b0adc0 !important; }

    /* ── KPI grids ── */
    .rsp-kpi-7 { display:grid; grid-template-columns:repeat(7,1fr); gap:10px; }
    .rsp-kpi-5 { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; }
    .rsp-kpi-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
    .rsp-2col  { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .rsp-clients-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:14px; }

    /* ── Layout ── */
    .page-pad  { padding: 20px 32px; }
    .header-pad{ padding: 0 32px; }
    .tbl-wrap  { overflow-x:auto; -webkit-overflow-scrolling:touch; }
    .hide-mobile { display:block; }

    /* ── Tab bar ── */
    .tab-bar {
      display: flex;
      overflow-x: auto;
      padding: 0 32px;
      scrollbar-width: none;
      gap: 2px;
    }
    .tab-bar::-webkit-scrollbar { display:none; }
    .tab-btn {
      padding: 14px 18px;
      border: none;
      background: none;
      cursor: pointer;
      font-family: 'Heebo', sans-serif !important;
      font-size: 13px;
      font-weight: 500;
      color: var(--ec-muted);
      border-bottom: 3px solid transparent;
      margin-bottom: -1.5px;
      white-space: nowrap;
      transition: color 0.15s;
      letter-spacing: 0.01em;
    }
    .tab-btn:hover { color: var(--ec-purple); }
    .tab-btn.active {
      color: var(--ec-purple);
      font-weight: 700;
      border-bottom-color: var(--ec-purple);
    }

    /* ── Cards ── */
    .ec-card {
      background: var(--ec-surface);
      border-radius: var(--ec-radius);
      border: 1.5px solid var(--ec-border);
      box-shadow: var(--ec-shadow);
    }
    .ec-kpi-card {
      background: var(--ec-surface);
      border-radius: var(--ec-radius);
      padding: 14px 16px;
      box-shadow: var(--ec-shadow);
      border: 1.5px solid var(--ec-border);
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .ec-kpi-card:hover {
      box-shadow: var(--ec-shadow-md);
      transform: translateY(-1px);
    }

    /* ── Buttons ── */
    .ec-btn-primary {
      background: var(--ec-purple);
      color: #fff;
      border: none;
      border-radius: 9px;
      padding: 8px 18px;
      font-family: 'Heebo', sans-serif !important;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
    }
    .ec-btn-primary:hover { background: var(--ec-purple-lt); transform: translateY(-1px); }

    .ec-btn-ghost {
      background: transparent;
      color: var(--ec-purple);
      border: 1.5px solid var(--ec-purple-mid);
      border-radius: 9px;
      padding: 7px 16px;
      font-family: 'Heebo', sans-serif !important;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .ec-btn-ghost:hover { background: var(--ec-purple-bg); }

    /* ── Section headers ── */
    .ec-section-header {
      font-size: 13px;
      font-weight: 800;
      color: var(--ec-text);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* ── Table shared ── */
    .ec-th {
      padding: 10px 14px;
      font-weight: 700;
      font-size: 11px;
      color: var(--ec-muted);
      background: #faf9ff;
      border-bottom: 1.5px solid var(--ec-border);
      text-align: right;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    /* ── Pill badges ── */
    .ec-pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 9px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.01em;
    }

    /* ── Scrollbar for content areas ── */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #d4d0e8; border-radius: 9999px; }

    /* ── Mobile ── */
    @media(max-width:639px){
      .rsp-kpi-7 { grid-template-columns:repeat(2,1fr); gap:8px; }
      .rsp-kpi-5 { grid-template-columns:repeat(2,1fr); }
      .rsp-kpi-4 { grid-template-columns:repeat(2,1fr); }
      .rsp-2col  { grid-template-columns:1fr; gap:12px; }
      .rsp-clients-grid { grid-template-columns:repeat(2,1fr); gap:8px; }
      .page-pad  { padding: 12px 14px; }
      .header-pad{ padding: 0 14px; }
      .hide-mobile { display:none; }
      .tab-bar { padding: 0 8px; }
      .tab-btn  { font-size:11px !important; padding:10px 10px !important; }
      input, select { font-size:16px !important; }
    }
  `;
  document.head.appendChild(style);
}

function ConfirmDialog({ open, title, message, confirmLabel="אישור", confirmColor="#ef4444", onConfirm, onCancel }) {
  if(!open) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onCancel}>
      <div style={{background:"#fff",borderRadius:16,padding:28,width:360,maxWidth:"92vw",boxShadow:"0 24px 64px rgba(0,0,0,0.22)",direction:"rtl"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:24,marginBottom:8,textAlign:"center"}}>⚠️</div>
        <div style={{fontWeight:800,fontSize:16,color:"#0f172a",marginBottom:8,textAlign:"center"}}>{title}</div>
        {message && <div style={{fontSize:13,color:"#6b7280",marginBottom:20,textAlign:"center",lineHeight:1.5}}>{message}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={onCancel} style={{padding:"9px 22px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#fff",color:"#374151",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",flex:1}}>ביטול</button>
          <button onClick={onConfirm} style={{padding:"9px 22px",borderRadius:10,border:"none",background:confirmColor,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",flex:1}}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function useConfirm() {
  const [state, setState] = useState(null);
  function confirm(opts) {
    return new Promise(resolve=>{ setState({...opts, resolve}); });
  }
  function handleConfirm() { state.resolve(true); setState(null); }
  function handleCancel() { state.resolve(false); setState(null); }
  const dialog = state ? (
    <ConfirmDialog open={true} title={state.title} message={state.message}
      confirmLabel={state.confirmLabel} confirmColor={state.confirmColor}
      onConfirm={handleConfirm} onCancel={handleCancel}/>
  ) : null;
  return [confirm, dialog];
}

function UndoToast({ onUndo, onDismiss, action }) {
  useEffect(()=>{
    const t = setTimeout(onDismiss, 5000);
    return ()=>clearTimeout(t);
  }, []);
  return (
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:3000,background:"#1e293b",color:"#fff",borderRadius:12,padding:"12px 20px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px rgba(0,0,0,0.25)",fontSize:13,fontFamily:"inherit",direction:"rtl",whiteSpace:"nowrap"}}>
      <span>{action}</span>
      <button onClick={onUndo} style={{background:"#6366f1",border:"none",color:"#fff",borderRadius:8,padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>↩ בטל</button>
      <button onClick={onDismiss} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:16,padding:"0 2px"}}>×</button>
    </div>
  );
}

// FIX 2: EntryRow - stable keys, no stale state issues
function EntryRow({ entry, onChange, onRemove, selected, onSelect }) {
  const isMobile = useIsMobile();
  const net = parseFloat(entry.net) || 0;
  const vatOverride = entry.vatOverride !== undefined ? parseFloat(entry.vatOverride) : null;
  const vatMode = entry.vatMode || "net";
  let displayNet = net;
  let displayVat = vatOverride !== null ? vatOverride : net * VAT_RATE;
  let displayGross = displayNet + displayVat;

  function handleNetChange(val) {
    const n = val.replace(/[^\d.]/g,"");
    if(vatMode==="custom") onChange({...entry,net:n});
    else onChange({...entry,net:n,vatOverride:undefined});
  }
  function handleVatChange(val) {
    onChange({...entry,vatOverride:val.replace(/[^\d.]/g,""),vatMode:"custom"});
  }
  function handleGrossChange(val) {
    const g = parseFloat(val.replace(/[^\d.]/g,""))||0;
    const n = (g/(1+VAT_RATE)).toFixed(2);
    onChange({...entry,net:n,vatMode:"gross",vatOverride:undefined});
  }
  function cycleVatMode() {
    const modes=["net","gross","custom"];
    const next=modes[(modes.indexOf(vatMode)+1)%3];
    onChange({...entry,vatMode:next,vatOverride:undefined});
  }
  const modeLabel=vatMode==="net"?"נטו→מע״מ":vatMode==="gross"?"ברוטו→נטו":"ידני";
  const modeBg=vatMode==="net"?"#eff6ff":vatMode==="gross"?"#f0fdf4":"#fefce8";
  const modeColor=vatMode==="net"?"#2563eb":vatMode==="gross"?"#16a34a":"#b45309";

  const rowBase={marginBottom:4,padding:"5px 7px",borderRadius:9,background:selected?"#eef2ff":"transparent",border:selected?"1.5px solid #a5b4fc":"1.5px solid transparent",transition:"background 0.15s"};

  if(isMobile) return (
    <div style={rowBase}>
      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
        <input type="checkbox" checked={selected} onChange={onSelect} style={{cursor:"pointer",accentColor:"#6366f1",width:15,height:15,flexShrink:0}}/>
        <input value={entry.name} onChange={e=>onChange({...entry,name:e.target.value})} placeholder="שם לקוח / ספק" dir="rtl"
          style={{flex:1,border:"1.5px solid #e5e7eb",borderRadius:7,padding:"5px 9px",fontSize:13,fontFamily:"inherit",background:"#fafafa",minWidth:0}}/>
        <button onClick={onRemove} style={{background:"none",border:"none",color:"#d1d5db",cursor:"pointer",fontSize:18,padding:"0 3px",flexShrink:0}}>×</button>
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center",paddingRight:21}}>
        {vatMode==="gross"?(
          <input value={String(displayGross||"")} onChange={e=>handleGrossChange(e.target.value)} placeholder="ברוטו" dir="ltr"
            style={{flex:1,border:"1.5px solid #bbf7d0",borderRadius:7,padding:"5px 8px",fontSize:13,fontFamily:"inherit",background:"#f0fdf4",textAlign:"right"}}/>
        ):(
          <input value={entry.net} onChange={e=>handleNetChange(e.target.value)} placeholder="נטו" dir="ltr"
            style={{flex:1,border:"1.5px solid #e5e7eb",borderRadius:7,padding:"5px 8px",fontSize:13,fontFamily:"inherit",background:"#fafafa",textAlign:"right"}}/>
        )}
        <input value={vatMode==="custom"&&entry.vatOverride!==undefined?entry.vatOverride:Math.round(displayVat)||""} onChange={e=>handleVatChange(e.target.value)} placeholder="מע״מ" dir="ltr"
          style={{width:64,border:`1.5px solid ${vatMode==="custom"?"#fcd34d":"#e5e7eb"}`,borderRadius:7,padding:"5px 8px",fontSize:13,fontFamily:"inherit",background:vatMode==="custom"?"#fefce8":"#f9fafb",textAlign:"right",color:vatMode==="custom"?"#92400e":"#6b7280"}}/>
        <button onClick={cycleVatMode} style={{fontSize:9,padding:"3px 6px",borderRadius:5,border:`1px solid ${modeColor}40`,background:modeBg,color:modeColor,cursor:"pointer",fontFamily:"inherit",fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>{modeLabel}</button>
        <StatusBadge value={entry.status} onChange={v=>onChange({...entry,status:v})}/>
      </div>
    </div>
  );

  return (
    <div style={{...rowBase,display:"flex",gap:5,alignItems:"center"}}>
      <input type="checkbox" checked={selected} onChange={onSelect} style={{cursor:"pointer",accentColor:"#6366f1",width:14,height:14,flexShrink:0}}/>
      <input value={entry.name} onChange={e=>onChange({...entry,name:e.target.value})} placeholder="שם" dir="rtl"
        style={{flex:2,border:"1.5px solid #e5e7eb",borderRadius:6,padding:"3px 7px",fontSize:12,fontFamily:"inherit",background:"#fafafa",minWidth:0,color:"#1e293b"}}/>
      {vatMode==="gross"?(
        <input value={String(displayGross||"")} onChange={e=>handleGrossChange(e.target.value)} placeholder="ברוטו" dir="ltr"
          style={{width:72,border:"1.5px solid #bbf7d0",borderRadius:6,padding:"3px 6px",fontSize:12,fontFamily:"inherit",background:"#f0fdf4",textAlign:"right"}}/>
      ):(
        <input value={entry.net} onChange={e=>handleNetChange(e.target.value)} placeholder="נטו" dir="ltr"
          style={{width:72,border:"1.5px solid #e5e7eb",borderRadius:6,padding:"3px 6px",fontSize:12,fontFamily:"inherit",background:"#fafafa",textAlign:"right"}}/>
      )}
      <div style={{display:"flex",alignItems:"center",gap:2}}>
        <span style={{fontSize:10,color:"#9ca3af",whiteSpace:"nowrap"}}>מע״מ:</span>
        <input value={vatMode==="custom"&&entry.vatOverride!==undefined?entry.vatOverride:Math.round(displayVat)||""} onChange={e=>handleVatChange(e.target.value)} placeholder="מע״מ" dir="ltr"
          style={{width:58,border:`1.5px solid ${vatMode==="custom"?"#fcd34d":"#e5e7eb"}`,borderRadius:6,padding:"3px 6px",fontSize:12,fontFamily:"inherit",background:vatMode==="custom"?"#fefce8":"#f9fafb",textAlign:"right",color:vatMode==="custom"?"#92400e":"#6b7280"}}/>
      </div>
      {vatMode!=="gross"&&(
        <div style={{fontSize:11,color:"#6b7280",minWidth:58,textAlign:"right",whiteSpace:"nowrap"}}>
          {net?"₪"+Math.round(displayGross).toLocaleString("he-IL"):""}
        </div>
      )}
      <button onClick={cycleVatMode} style={{fontSize:9,padding:"2px 5px",borderRadius:5,border:`1px solid ${modeColor}40`,background:modeBg,color:modeColor,cursor:"pointer",fontFamily:"inherit",fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>{modeLabel}</button>
      <StatusBadge value={entry.status} onChange={v=>onChange({...entry,status:v})}/>
      <button onClick={onRemove} style={{background:"none",border:"none",color:"#d1d5db",cursor:"pointer",fontSize:16,padding:"0 2px",flexShrink:0}}>×</button>
    </div>
  );
}

function DuplicateModal({ count, allYears, currentYear, currentMonth, onDuplicate, onClose }) {
  const [targetYear, setTargetYear] = useState(currentYear);
  const [targetMonths, setTargetMonths] = useState({});
  const years = Object.keys(allYears).map(Number).sort();

  function toggleMonth(mi) { setTargetMonths(s=>({...s,[mi]:!s[mi]})); }
  const selectedMonths = Object.entries(targetMonths).filter(([,v])=>v).map(([mi])=>parseInt(mi));

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,padding:24,width:380,maxWidth:"95vw",boxShadow:"0 20px 60px rgba(0,0,0,0.25)",direction:"rtl"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontWeight:800,fontSize:16,marginBottom:4,color:"#0f172a"}}>📋 שכפול פריטים</div>
        <div style={{fontSize:12,color:"#6b7280",marginBottom:18}}>{count} פריטים נבחרו — בחר לאיזה חודשים לשכפל</div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:"#374151",marginBottom:6}}>שנה</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {years.map(y=>(
              <button key={y} onClick={()=>{setTargetYear(y);setTargetMonths({});}}
                style={{padding:"5px 14px",borderRadius:8,border:"1.5px solid",borderColor:targetYear===y?"#6366f1":"#e2e8f0",background:targetYear===y?"#eef2ff":"#fff",color:targetYear===y?"#4338ca":"#374151",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                {y}
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{fontSize:12,fontWeight:700,color:"#374151"}}>חודשים</div>
            <button onClick={()=>{
              const all = MONTHS_HE.reduce((a,_,i)=>({...a,[i]:true}),{});
              setTargetMonths(selectedMonths.length===0?all:{});
            }} style={{fontSize:11,color:"#6366f1",background:"none",border:"none",cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>
              {selectedMonths.length===0?"בחר הכל":"נקה"}
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {MONTHS_HE.map((m,mi)=>{
              const isCurrent = targetYear===currentYear && mi===currentMonth;
              const sel = !!targetMonths[mi];
              return (
                <button key={mi} onClick={()=>!isCurrent&&toggleMonth(mi)} disabled={isCurrent}
                  style={{padding:"6px 4px",borderRadius:8,border:"1.5px solid",borderColor:sel?"#6366f1":"#e2e8f0",background:sel?"#eef2ff":isCurrent?"#f9fafb":"#fff",color:sel?"#4338ca":isCurrent?"#c4c9d4":"#374151",fontWeight:sel?700:500,fontSize:12,cursor:isCurrent?"default":"pointer",fontFamily:"inherit",opacity:isCurrent?0.5:1}}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"8px 16px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",color:"#6b7280",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>ביטול</button>
          <button onClick={()=>selectedMonths.length>0&&onDuplicate(targetYear,selectedMonths)} disabled={selectedMonths.length===0}
            style={{padding:"8px 16px",borderRadius:9,border:"none",background:selectedMonths.length>0?"#6366f1":"#e2e8f0",color:selectedMonths.length>0?"#fff":"#9ca3af",fontWeight:700,fontSize:13,cursor:selectedMonths.length>0?"pointer":"default",fontFamily:"inherit"}}>
            שכפל ל-{selectedMonths.length} חודשים
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkToolbar({ count, onStatusChange, onDelete, onDeselect, onDuplicate }) {
  const isMobile = useIsMobile();
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",marginBottom:8,background:"#eef2ff",borderRadius:9,border:"1.5px solid #a5b4fc",flexWrap:"wrap"}}>
      <span style={{fontSize:12,fontWeight:700,color:"#4338ca"}}>{count} נבחרו</span>
      <div style={{flex:1,minWidth:8}}/>
      {!isMobile && <span style={{fontSize:12,color:"#6b7280"}}>שנה סטטוס:</span>}
      {STATUS_OPTIONS.map(o=>(
        <button key={o.value} onClick={()=>onStatusChange(o.value)}
          style={{padding:"3px 9px",borderRadius:9999,border:"none",cursor:"pointer",background:o.bg,color:o.color,fontSize:11,fontWeight:700,fontFamily:"inherit"}}>
          {o.label}
        </button>
      ))}
      <button onClick={onDuplicate} style={{padding:"3px 9px",borderRadius:9999,border:"1.5px solid #a5b4fc",cursor:"pointer",background:"#eef2ff",color:"#4338ca",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>
        📋 {isMobile?"":"שכפל"}
      </button>
      <button onClick={onDelete} style={{padding:"3px 9px",borderRadius:9999,border:"1.5px solid #fca5a5",cursor:"pointer",background:"#fee2e2",color:"#dc2626",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>
        🗑 {isMobile?"":"מחק"}
      </button>
      <button onClick={onDeselect} style={{padding:"3px 9px",borderRadius:9999,border:"1.5px solid #e5e7eb",cursor:"pointer",background:"#fff",color:"#6b7280",fontSize:11,fontWeight:600,fontFamily:"inherit"}}>✕</button>
    </div>
  );
}

function SectionCard({ title, icon, color, total, children, onAdd, allSelected, someSelected, onSelectAll, entries }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const filteredChildren = statusFilter === "all" ? children :
    React.Children.map(children, child => {
      if(!child?.props?.entry) return child;
      return child.props.entry.status === statusFilter ? child : null;
    });
  const counts = {};
  (entries||[]).forEach(e=>{ counts[e.status] = (counts[e.status]||0)+1; });
  const activeStatuses = STATUS_OPTIONS.filter(s=>counts[s.value]>0);

  return (
    <div style={{background:"#fff",borderRadius:12,border:`1.5px solid ${color}22`,boxShadow:"0 1px 8px rgba(124,58,237,0.05)",overflow:"visible",marginBottom:10}}>
      <div style={{padding:"8px 12px",background:`${color}0e`,borderBottom:`1px solid ${color}20`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <input type="checkbox" checked={allSelected}
            ref={el=>{ if(el) el.indeterminate = someSelected && !allSelected; }}
            onChange={onSelectAll}
            style={{cursor:"pointer",accentColor:color,width:14,height:14,flexShrink:0,opacity:0.8}}/>
          <span style={{fontWeight:700,fontSize:13,color:"#1f2937"}}>{icon} {title}</span>
        </div>
        <span style={{fontWeight:800,fontSize:13,color}}>{fmt(total)}</span>
      </div>
      {activeStatuses.length > 1 && (
        <div style={{padding:"6px 12px",borderBottom:`1px solid ${color}15`,display:"flex",gap:4,flexWrap:"wrap",background:`${color}05`}}>
          <button onClick={()=>setStatusFilter("all")}
            style={{padding:"2px 8px",borderRadius:9999,border:"1.5px solid",borderColor:statusFilter==="all"?color:"#e2e8f0",background:statusFilter==="all"?color+"22":"#fff",color:statusFilter==="all"?color:"#6b7280",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            הכל ({entries?.length||0})
          </button>
          {activeStatuses.map(s=>(
            <button key={s.value} onClick={()=>setStatusFilter(statusFilter===s.value?"all":s.value)}
              style={{padding:"2px 8px",borderRadius:9999,border:"1.5px solid",borderColor:statusFilter===s.value?s.color:"#e2e8f0",background:statusFilter===s.value?s.bg:"#fff",color:statusFilter===s.value?s.color:"#6b7280",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              {s.label} ({counts[s.value]})
            </button>
          ))}
        </div>
      )}
      <div style={{padding:"8px 12px"}}>
        {filteredChildren}
        {statusFilter !== "all" && filteredChildren?.filter(Boolean).length === 0 && (
          <div style={{textAlign:"center",color:"#94a3b8",fontSize:12,padding:"8px 0"}}>אין פריטים בסטטוס זה</div>
        )}
        <button onClick={onAdd} style={{background:"none",border:`1.5px dashed ${color}60`,color,borderRadius:7,padding:"3px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:600,marginTop:4}}>+ הוסף</button>
      </div>
    </div>
  );
}

function MonthView({ data, setData, allYears, setAllYears, currentYear, currentMonth, onConfirm, onSaveSnapshot, goals, setGoals }) {
  const [selected, setSelected] = useState({});
  const [showDuplicate, setShowDuplicate] = useState(false);

  // FIX 3: Clear selection when month/year changes to prevent stale selection bugs
  useEffect(()=>{ setSelected({}); }, [currentYear, currentMonth]);

  function selKey(section, cat, id) { return `${section}:${cat}:${id}`; }
  function toggleSel(section, cat, id) {
    const k = selKey(section,cat,id);
    setSelected(s=>({...s,[k]:!s[k]}));
  }
  function deselectAll() { setSelected({}); }
  const selectedCount = Object.values(selected).filter(Boolean).length;

  function isCatAllSelected(section, cat, entries) {
    return entries.length > 0 && entries.every(e=>!!selected[selKey(section,cat,e.id)]);
  }
  function isCatSomeSelected(section, cat, entries) {
    return entries.some(e=>!!selected[selKey(section,cat,e.id)]);
  }
  function toggleSelectAllInCat(section, cat, entries) {
    const allSel = isCatAllSelected(section, cat, entries);
    setSelected(s=>{
      const ns = {...s};
      entries.forEach(e=>{ ns[selKey(section,cat,e.id)] = !allSel; });
      return ns;
    });
  }

  function bulkStatusChange(status) {
    setData(d=>{
      const nd = JSON.parse(JSON.stringify(d));
      Object.entries(selected).forEach(([k,v])=>{
        if(!v) return;
        const [section,cat] = k.split(":");
        const id = k.split(":").slice(2).join(":");
        const arr = nd[section][cat];
        const idx = arr.findIndex(e=>e.id===id);
        if(idx>=0) arr[idx].status = status;
      });
      return nd;
    });
    deselectAll();
  }

  async function bulkDelete() {
    const ok = await onConfirm({title:`מחיקת ${selectedCount} פריטים`,message:"הפריטים שנבחרו יימחקו. ניתן לבטל עם כפתור Undo.",confirmLabel:"מחק",confirmColor:"#ef4444"});
    if(!ok) return;
    onSaveSnapshot(`מחיקת ${selectedCount} פריטים`);
    setData(d=>{
      const nd = JSON.parse(JSON.stringify(d));
      Object.entries(selected).forEach(([k,v])=>{
        if(!v) return;
        const [section,cat] = k.split(":");
        const id = k.split(":").slice(2).join(":");
        nd[section][cat] = nd[section][cat].filter(e=>e.id!==id);
        if(nd[section][cat].length===0) nd[section][cat]=[newEntry()];
      });
      return nd;
    });
    deselectAll(); // FIX: clear selection after delete
  }

  function bulkDuplicate(targetYear, targetMonths) {
    const toDup = [];
    Object.entries(selected).forEach(([k,v])=>{
      if(!v) return;
      const [section,cat] = k.split(":");
      const id = k.split(":").slice(2).join(":");
      const arr = data[section][cat];
      const entry = arr.find(e=>e.id===id);
      if(entry) toDup.push({ section, cat, entry });
    });
    setAllYears(ay=>{
      const nd = JSON.parse(JSON.stringify(ay));
      if(!nd[targetYear]) nd[targetYear] = Array.from({length:12}, initMonth);
      targetMonths.forEach(mi=>{
        toDup.forEach(({section,cat,entry})=>{
          nd[targetYear][mi][section][cat].push({...entry, id: genId(), reminderSent:"", reminderCount:0});
        });
      });
      return nd;
    });
    setShowDuplicate(false);
    deselectAll();
    alert(`✅ שוכפלו ${toDup.length} פריטים ל-${targetMonths.length} חודשים`);
  }

  function upd(section, cat, idx, val) {
    setData(d=>{const e=[...d[section][cat]];e[idx]=val;return{...d,[section]:{...d[section],[cat]:e}};});
  }

  // FIX 3: rem - clear selection for removed item to prevent ghost selections
  function rem(section, cat, idx) {
    onSaveSnapshot("מחיקת פריט");
    const removedId = data[section][cat][idx]?.id;
    setData(d=>{
      let e=d[section][cat].filter((_,i)=>i!==idx);
      if(e.length===0) e=[newEntry()];
      return{...d,[section]:{...d[section],[cat]:e}};
    });
    // Clear selection for the removed entry
    if(removedId) {
      setSelected(s=>{
        const ns={...s};
        delete ns[selKey(section,cat,removedId)];
        return ns;
      });
    }
  }

  function add(section, cat) {
    setData(d=>{const e=[...d[section][cat],newEntry()];return{...d,[section]:{...d[section],[cat]:e}};});
  }

  const totInc = INCOME_CATEGORIES.reduce((s,c)=>s+calcNetEntries(data.income[c.key]),0);
  const totExp = EXPENSE_CATEGORIES.reduce((s,c)=>s+calcNetEntries(data.expenses[c.key]),0);
  const pb = totInc - totExp;
  const tax = pb>0?pb*INCOME_TAX:0;
  const pa = pb-tax;
  const margin = totInc>0?(pa/totInc)*100:0;

  const kpis = [
    {label:"הכנסות",       value:fmt(totInc), color:"#22c55e",  bg:"#f0fdf4", border:"#bbf7d0"},
    {label:"הוצאות",       value:fmt(totExp), color:"#ef4444",  bg:"#fef2f2", border:"#fecaca"},
    {label:"מע״מ לתשלום", value:fmt(totInc*VAT_RATE-totExp*VAT_RATE), color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe"},
    {label:"רווח לפני מס", value:fmt(pb),     color:"#0ea5e9",  bg:"#f0f9ff", border:"#bae6fd"},
    {label:"מס 23%",       value:fmt(tax),    color:"#a855f7",  bg:"#faf5ff", border:"#e9d5ff"},
    {label:"רווח נטו",     value:fmt(pa),     color:pa>=0?"#22c55e":"#ef4444", bg:pa>=0?"#f0fdf4":"#fef2f2", border:pa>=0?"#bbf7d0":"#fecaca"},
    {label:"אחוז רווח",    value:fmtPct(margin), color:margin>=20?"#22c55e":margin>=0?"#f59e0b":"#ef4444", bg:margin>=20?"#f0fdf4":margin>=0?"#fffbeb":"#fef2f2", border:margin>=20?"#bbf7d0":margin>=0?"#fde68a":"#fecaca"},
  ];

  return (
    <div style={{direction:"rtl"}}>
      {showDuplicate && (
        <DuplicateModal count={selectedCount} allYears={allYears} currentYear={currentYear} currentMonth={currentMonth}
          onDuplicate={bulkDuplicate} onClose={()=>setShowDuplicate(false)}/>
      )}

      {/* KPI strip */}
      <div className="rsp-kpi-7" style={{marginBottom:18}}>
        {kpis.map(c=>(
          <div key={c.label} className="ec-kpi-card" style={{borderTop:`3px solid ${c.color}`,background:c.bg,borderColor:c.border}}>
            <div style={{fontSize:10,color:"#6b7280",marginBottom:4,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase"}}>{c.label}</div>
            <div style={{fontSize:16,fontWeight:800,color:c.color,letterSpacing:"-0.3px"}}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Goals bar */}
      <GoalsBar year={currentYear} month={currentMonth} goals={goals} setGoals={setGoals} totInc={totInc} pa={pa}/>

      {/* VAT legend */}
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:14,fontSize:11,color:"#6b7280",background:"#fff",borderRadius:10,padding:"8px 14px",border:"1.5px solid #ede9fe"}}>
        <span style={{fontWeight:700,color:"#7c3aed"}}>מצבי מע״מ:</span>
        <span style={{background:"#eff6ff",color:"#2563eb",borderRadius:6,padding:"2px 8px",fontWeight:700}}>נטו→מע״מ</span>
        <span style={{background:"#f0fdf4",color:"#16a34a",borderRadius:6,padding:"2px 8px",fontWeight:700}}>ברוטו→נטו</span>
        <span style={{background:"#fefce8",color:"#b45309",borderRadius:6,padding:"2px 8px",fontWeight:700}}>ידני</span>
      </div>

      {selectedCount > 0 && (
        <BulkToolbar count={selectedCount} onStatusChange={bulkStatusChange} onDelete={bulkDelete} onDeselect={deselectAll} onDuplicate={()=>setShowDuplicate(true)}/>
      )}

      <div className="rsp-2col">
        <div>
          <div className="ec-section-header">
            <span style={{background:"#f0fdf4",color:"#22c55e",borderRadius:8,padding:"3px 8px",fontSize:12}}>💚</span>
            <span>הכנסות</span>
          </div>
          {INCOME_CATEGORIES.map((cat,ci)=>(
            <SectionCard key={cat.key} title={cat.label} icon={cat.icon} color={INCOME_COLORS[ci]} total={calcNetEntries(data.income[cat.key])} onAdd={()=>add("income",cat.key)}
              entries={data.income[cat.key]}
              allSelected={isCatAllSelected("income",cat.key,data.income[cat.key])}
              someSelected={isCatSomeSelected("income",cat.key,data.income[cat.key])}
              onSelectAll={()=>toggleSelectAllInCat("income",cat.key,data.income[cat.key])}>
              {data.income[cat.key].map((e,i)=>(
                <EntryRow key={e.id} entry={e}
                  selected={!!selected[selKey("income",cat.key,e.id)]}
                  onSelect={()=>toggleSel("income",cat.key,e.id)}
                  onChange={v=>upd("income",cat.key,i,v)}
                  onRemove={()=>rem("income",cat.key,i)}/>
              ))}
            </SectionCard>
          ))}
        </div>
        <div>
          <div className="ec-section-header">
            <span style={{background:"#fef2f2",color:"#ef4444",borderRadius:8,padding:"3px 8px",fontSize:12}}>🔴</span>
            <span>הוצאות</span>
          </div>
          {EXPENSE_CATEGORIES.map((cat,ci)=>(
            <SectionCard key={cat.key} title={cat.label} icon={cat.icon} color={EXPENSE_COLORS[ci]} total={calcNetEntries(data.expenses[cat.key])} onAdd={()=>add("expenses",cat.key)}
              entries={data.expenses[cat.key]}
              allSelected={isCatAllSelected("expenses",cat.key,data.expenses[cat.key])}
              someSelected={isCatSomeSelected("expenses",cat.key,data.expenses[cat.key])}
              onSelectAll={()=>toggleSelectAllInCat("expenses",cat.key,data.expenses[cat.key])}>
              {data.expenses[cat.key].map((e,i)=>(
                <EntryRow key={e.id} entry={e}
                  selected={!!selected[selKey("expenses",cat.key,e.id)]}
                  onSelect={()=>toggleSel("expenses",cat.key,e.id)}
                  onChange={v=>upd("expenses",cat.key,i,v)}
                  onRemove={()=>rem("expenses",cat.key,i)}/>
              ))}
            </SectionCard>
          ))}
        </div>
      </div>
    </div>
  );
}

function YearSummary({ months, year, goals, setGoals }) {
  const rows = months.map((m,i)=>({name:MONTHS_HE[i],...getMonthStats(m),mi:i}));
  const tot = rows.reduce((a,r)=>({inc:a.inc+r.inc,exp:a.exp+r.exp,pb:a.pb+r.pb,tax:a.tax+r.tax,pa:a.pa+r.pa}),{inc:0,exp:0,pb:0,tax:0,pa:0});
  const avgM = tot.inc>0?(tot.pa/tot.inc)*100:0;
  const maxInc = Math.max(...rows.map(r=>r.inc),1);
  const th = {padding:"9px 12px",fontWeight:700,fontSize:11,color:"#6b7280",background:"#faf9ff",borderBottom:"1.5px solid #ede9fe",textAlign:"right",letterSpacing:"0.03em"};
  const td = (x={})=>({padding:"8px 12px",fontSize:12,borderBottom:"1px solid #f5f3ff",textAlign:"right",...x});

  return (
    <div style={{direction:"rtl"}}>
      <div className="rsp-kpi-5" style={{marginBottom:18}}>
        {[{l:`הכנסות ${year}`,v:fmt(tot.inc),c:"#10b981"},{l:`הוצאות ${year}`,v:fmt(tot.exp),c:"#ef4444"},{l:"רווח לפני מס",v:fmt(tot.pb),c:"#0ea5e9"},{l:"מס חברות 23%",v:fmt(tot.tax),c:"#9333ea"},{l:"רווח נטו שנתי",v:fmt(tot.pa),c:tot.pa>=0?"#10b981":"#ef4444"}].map(c=>(
          <div key={c.l} style={{background:"#fff",borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 8px rgba(0,0,0,0.06)",borderTop:`3px solid ${c.c}`}}>
            <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{c.l}</div>
            <div style={{fontSize:20,fontWeight:800,color:c.c}}>{c.v}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#fff",borderRadius:14,padding:18,marginBottom:18,boxShadow:"0 1px 8px rgba(0,0,0,0.05)"}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>📊 הכנסות מול הוצאות — {year}</div>
        <div style={{display:"flex",gap:3,alignItems:"flex-end",height:120}}>
          {rows.map((r,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <div style={{width:"100%",display:"flex",gap:1,alignItems:"flex-end",height:90}}>
                <div style={{flex:1,background:"#10b981",borderRadius:"3px 3px 0 0",height:`${(r.inc/maxInc)*100}%`,minHeight:r.inc?2:0}}/>
                <div style={{flex:1,background:"#ef4444",borderRadius:"3px 3px 0 0",height:`${(r.exp/maxInc)*100}%`,minHeight:r.exp?2:0}}/>
              </div>
              <div style={{fontSize:8,color:"#9ca3af",writingMode:"vertical-rl",transform:"rotate(180deg)",height:26}}>{r.name}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:12,marginTop:8,fontSize:11,color:"#6b7280"}}>
          <span><span style={{display:"inline-block",width:10,height:10,background:"#10b981",borderRadius:2,marginLeft:4}}/>הכנסות</span>
          <span><span style={{display:"inline-block",width:10,height:10,background:"#ef4444",borderRadius:2,marginLeft:4}}/>הוצאות</span>
        </div>
      </div>
      <div className="tbl-wrap" style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 8px rgba(124,58,237,0.05)",border:"1.5px solid #ede9fe"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:560}}>
          <thead><tr>{["חודש","הכנסה","יעד הכנסה","הוצאות","רווח לפני מס","מס 23%","רווח נטו","יעד רווח","אחוז רווח"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r,i)=>{
              const gKey = `${year}-${r.mi}`;
              const g = goals?.[gKey]||{};
              const incGoal = g.incomeGoal||0;
              const profGoal = g.profitGoal||0;
              const incPct = incGoal>0?(r.inc/incGoal)*100:null;
              const profPct = profGoal>0?(r.pa/profGoal)*100:null;
              return (
                <tr key={i} style={{background:i%2===0?"#fff":"#fdf8ff"}}>
                  <td style={td({fontWeight:700})}>{r.name}</td>
                  <td style={td({color:"#22c55e",fontWeight:600})}>{r.inc?fmt(r.inc):"—"}</td>
                  <td style={td()}>
                    {incGoal>0 ? (
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{flex:1,height:5,background:"#f3f0ff",borderRadius:9999,overflow:"hidden",minWidth:40}}>
                          <div style={{width:`${Math.min(incPct,100)}%`,height:"100%",background:incPct>=100?"#22c55e":"#7c3aed",borderRadius:9999}}/>
                        </div>
                        <span style={{fontSize:10,color:incPct>=100?"#22c55e":"#7c3aed",fontWeight:700,whiteSpace:"nowrap"}}>{incPct.toFixed(0)}%</span>
                      </div>
                    ) : <span style={{color:"#d1d5db",fontSize:11}}>—</span>}
                  </td>
                  <td style={td({color:"#ef4444"})}>{r.exp?fmt(r.exp):"—"}</td>
                  <td style={td()}>{r.pb?fmt(r.pb):"—"}</td>
                  <td style={td({color:"#a855f7"})}>{r.tax?fmt(r.tax):"—"}</td>
                  <td style={td({fontWeight:700,color:r.pa>=0?"#22c55e":"#ef4444"})}>{r.pa?fmt(r.pa):"—"}</td>
                  <td style={td()}>
                    {profGoal>0 ? (
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{flex:1,height:5,background:"#f3f0ff",borderRadius:9999,overflow:"hidden",minWidth:40}}>
                          <div style={{width:`${Math.min(Math.max(profPct,0),100)}%`,height:"100%",background:profPct>=100?"#22c55e":"#7c3aed",borderRadius:9999}}/>
                        </div>
                        <span style={{fontSize:10,color:profPct>=100?"#22c55e":"#7c3aed",fontWeight:700,whiteSpace:"nowrap"}}>{profPct.toFixed(0)}%</span>
                      </div>
                    ) : <span style={{color:"#d1d5db",fontSize:11}}>—</span>}
                  </td>
                  <td style={td()}>{r.inc?<span style={{padding:"2px 7px",borderRadius:9999,fontSize:10,fontWeight:700,background:r.margin>=20?"#dcfce7":r.margin>=0?"#fef3c7":"#fee2e2",color:r.margin>=20?"#16a34a":r.margin>=0?"#92400e":"#dc2626"}}>{fmtPct(r.margin)}</span>:"—"}</td>
                </tr>
              );
            })}
            <tr style={{background:"#f5f3ff"}}>
              <td style={td({fontWeight:800})}>סה״כ</td>
              <td style={td({color:"#22c55e",fontWeight:800})}>{fmt(tot.inc)}</td>
              <td style={td()}/>
              <td style={td({color:"#ef4444",fontWeight:800})}>{fmt(tot.exp)}</td>
              <td style={td({fontWeight:800})}>{fmt(tot.pb)}</td>
              <td style={td({color:"#a855f7",fontWeight:800})}>{fmt(tot.tax)}</td>
              <td style={td({fontWeight:800,color:tot.pa>=0?"#22c55e":"#ef4444"})}>{fmt(tot.pa)}</td>
              <td style={td()}/>
              <td style={td()}><span style={{padding:"2px 7px",borderRadius:9999,fontSize:10,fontWeight:800,background:avgM>=20?"#dcfce7":avgM>=0?"#fef3c7":"#fee2e2",color:avgM>=20?"#16a34a":avgM>=0?"#92400e":"#dc2626"}}>{fmtPct(avgM)}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MultiYear({ allYears }) {
  const yrs = Object.keys(allYears).sort();
  const ys = yrs.map(y=>{
    const rows = allYears[y].map(m=>getMonthStats(m));
    const tot = rows.reduce((a,r)=>({inc:a.inc+r.inc,exp:a.exp+r.exp,pb:a.pb+r.pb,tax:a.tax+r.tax,pa:a.pa+r.pa}),{inc:0,exp:0,pb:0,tax:0,pa:0});
    return {year:y,...tot,margin:tot.inc>0?(tot.pa/tot.inc)*100:0};
  });
  const maxInc = Math.max(...ys.map(y=>y.inc),1);
  const th = {padding:"12px 16px",fontWeight:700,fontSize:12,color:"#6b7280",background:"#f9fafb",borderBottom:"1.5px solid #e5e7eb",textAlign:"right"};
  const td = (x={})=>({padding:"12px 16px",fontSize:13,borderBottom:"1px solid #f3f4f6",textAlign:"right",...x});
  return (
    <div style={{direction:"rtl"}}>
      <div style={{fontWeight:800,fontSize:18,marginBottom:18}}>📅 השוואה שנתית</div>
      <div style={{background:"#fff",borderRadius:14,padding:22,marginBottom:18,boxShadow:"0 1px 8px rgba(0,0,0,0.05)"}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>הכנסות לפי שנה</div>
        <div style={{display:"flex",gap:30,alignItems:"flex-end",height:150,justifyContent:"center"}}>
          {ys.map(y=>(
            <div key={y.year} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:80}}>
              <div style={{fontSize:11,fontWeight:700,color:"#10b981"}}>{fmt(y.inc)}</div>
              <div style={{display:"flex",gap:4,alignItems:"flex-end",height:100,width:60}}>
                <div style={{flex:1,background:"#10b981",borderRadius:"4px 4px 0 0",height:`${(y.inc/maxInc)*100}%`,minHeight:4}}/>
                <div style={{flex:1,background:"#ef4444",borderRadius:"4px 4px 0 0",height:`${(y.exp/maxInc)*100}%`,minHeight:4}}/>
              </div>
              <div style={{fontWeight:800,fontSize:18,color:"#1f2937"}}>{y.year}</div>
              <div style={{fontSize:11,fontWeight:700,color:y.pa>=0?"#10b981":"#ef4444"}}>{fmt(y.pa)} נטו</div>
            </div>
          ))}
        </div>
      </div>
      <div className="tbl-wrap" style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 8px rgba(0,0,0,0.05)"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:480}}>
          <thead><tr>{["שנה","הכנסה נטו","הוצאות נטו","רווח לפני מס","מס 23%","רווח נטו","אחוז רווח"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {ys.map((y,i)=>(
              <tr key={y.year} style={{background:i%2===0?"#fff":"#fafafa"}}>
                <td style={td({fontWeight:800,fontSize:16})}>{y.year}</td>
                <td style={td({color:"#10b981",fontWeight:700,fontSize:15})}>{fmt(y.inc)}</td>
                <td style={td({color:"#ef4444"})}>{fmt(y.exp)}</td>
                <td style={td()}>{fmt(y.pb)}</td>
                <td style={td({color:"#9333ea"})}>{fmt(y.tax)}</td>
                <td style={td({fontWeight:800,color:y.pa>=0?"#10b981":"#ef4444",fontSize:15})}>{fmt(y.pa)}</td>
                <td style={td()}><span style={{padding:"3px 9px",borderRadius:9999,fontSize:11,fontWeight:700,background:y.margin>=20?"#dcfce7":y.margin>=0?"#fef3c7":"#fee2e2",color:y.margin>=20?"#16a34a":y.margin>=0?"#92400e":"#dc2626"}}>{fmtPct(y.margin)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CAT_COLORS = {"retainers":"#6366f1","partnerships":"#0ea5e9","variable":"#10b981","onetime":"#f59e0b","affiliate":"#ec4899"};
const CAT_LABELS = {"retainers":"ריטיינרים","partnerships":"שיתופי פעולה","variable":"משתנות","onetime":"חד פעמיות","affiliate":"אפיליאייט"};

function MiniBar({value, max, color="#6366f1", height=8}) {
  const pct = max>0 ? Math.min((value/max)*100,100) : 0;
  return (
    <div style={{background:"#f1f5f9",borderRadius:9999,height,overflow:"hidden",flex:1}}>
      <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:9999,transition:"width 0.4s"}}/>
    </div>
  );
}

function ClientDetail({client, allYears, onClose}) {
  const allMonths = [];
  Object.keys(allYears).sort().forEach(yr=>{
    for(let mi=0;mi<12;mi++) {
      const entries = allYears[yr][mi];
      let net=0;
      INCOME_CATEGORIES.forEach(cat=>{
        entries.income[cat.key].forEach(e=>{
          if((e.name||'').trim()===client.name) net+=parseFloat(e.net)||0;
        });
      });
      allMonths.push({yr:Number(yr),mi,net,label:`${MONTHS_HE[mi].slice(0,3)} ${yr}`});
    }
  });
  const activeMonths = allMonths.filter(m=>m.net>0);
  const maxMonth = Math.max(...activeMonths.map(m=>m.net),1);
  const avgNet = activeMonths.length ? client.totalNet/activeMonths.length : 0;
  const statusCount = {paid:0,pending:0,unpaid:0};
  client.months.forEach(m=>{ if(statusCount[m.status]!==undefined) statusCount[m.status]++; });

  const th={padding:"8px 12px",fontWeight:700,fontSize:11,color:"#6b7280",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",textAlign:"right"};
  const td=(x={})=>({padding:"7px 12px",fontSize:12,borderBottom:"1px solid #f8fafc",textAlign:"right",...x});

  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(15,23,42,0.55)",backdropFilter:"blur(4px)"}}
      onClick={e=>{if(e.target===e.currentTarget) onClose();}}>
      <div style={{background:"#fff",borderRadius:20,width:"min(820px,95vw)",maxHeight:"88vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.2)",direction:"rtl"}}>
        <div style={{padding:"20px 24px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,#1e293b,#0f172a)",borderRadius:"20px 20px 0 0"}}>
          <div>
            <div style={{color:"#f1f5f9",fontSize:20,fontWeight:800}}>{client.name}</div>
            <div style={{color:"#94a3b8",fontSize:12,marginTop:3}}>{activeMonths.length} חודשים פעילים · {Object.keys(client.cats).length} קטגוריות</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#f1f5f9",borderRadius:9999,width:32,height:32,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"20px 24px"}}>
          <div className="rsp-kpi-4" style={{marginBottom:20}}>
            {[
              {l:"סה״כ הכנסות",v:fmt(client.totalNet),c:"#6366f1"},
              {l:"ממוצע חודשי",v:fmt(avgNet),c:"#0ea5e9"},
              {l:"חודש שיא",v:fmt(maxMonth),c:"#10b981"},
              {l:"חודשים פעילים",v:String(activeMonths.length),c:"#f59e0b"},
            ].map(k=>(
              <div key={k.l} style={{background:"#f8fafc",borderRadius:12,padding:"12px 14px",borderTop:`3px solid ${k.c}`}}>
                <div style={{fontSize:10,color:"#6b7280",marginBottom:4}}>{k.l}</div>
                <div style={{fontSize:18,fontWeight:800,color:k.c}}>{k.v}</div>
              </div>
            ))}
          </div>
          <div style={{background:"#f8fafc",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>📈 ציר זמן הכנסות</div>
            <div style={{display:"flex",gap:3,alignItems:"flex-end",height:64}}>
              {allMonths.map((m,i)=>(
                <div key={i} title={`${m.label}: ${fmt(m.net)}`} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                  <div style={{width:"100%",background:m.net>0?"#6366f1":"#e5e7eb",borderRadius:"2px 2px 0 0",height:`${m.net>0?(m.net/maxMonth)*52+4:2}px`,transition:"height 0.3s",opacity:m.net>0?1:0.3,minHeight:2}}/>
                </div>
              ))}
            </div>
          </div>
          <div className="tbl-wrap" style={{background:"#fff",borderRadius:12,border:"1px solid #f1f5f9"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:380}}>
              <thead><tr>{["שנה","חודש","קטגוריה","סכום נטו","סטטוס"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {client.months.sort((a,b)=>b.yr-a.yr||b.mi-a.mi).map((m,i)=>{
                  const so = STATUS_OPTIONS.find(s=>s.value===m.status)||STATUS_OPTIONS[0];
                  return (
                    <tr key={i} style={{background:i%2===0?"#fff":"#fafafa"}}>
                      <td style={td()}>{m.yr}</td>
                      <td style={td({fontWeight:600})}>{MONTHS_HE[m.mi]}</td>
                      <td style={td()}><span style={{fontSize:11,padding:"1px 6px",borderRadius:4,background:`${CAT_COLORS[m.catKey]||"#6366f1"}18`,color:CAT_COLORS[m.catKey]||"#6366f1",fontWeight:600}}>{m.cat}</span></td>
                      <td style={td({fontWeight:700,color:"#10b981"})}>{fmt(m.net)}</td>
                      <td style={td()}><span style={{padding:"1px 7px",borderRadius:9999,fontSize:11,fontWeight:700,background:so.bg,color:so.color}}>{so.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpenseAnalysis({ allYears }) {
  const [selYears, setSelYears] = useState("all");
  const allExpenses = [];
  const years = Object.keys(allYears).map(Number).sort();
  years.forEach(yr=>{
    if(selYears !== "all" && yr !== parseInt(selYears)) return;
    allYears[yr].forEach((month, mi)=>{
      ["fixed","variable"].forEach(cat=>{
        (month.expenses[cat]||[]).forEach(e=>{
          allExpenses.push({ name: e.name, net: parseFloat(e.net)||0, cat, yr, mi, status: e.status });
        });
      });
    });
  });
  const activeMonthsSet = new Set(allExpenses.map(e=>`${e.yr}-${e.mi}`));
  const activeMonths = Math.max(activeMonthsSet.size, 1);
  const byName = {};
  allExpenses.forEach(e=>{
    if(!e.name?.trim()) return;
    if(!byName[e.name]) byName[e.name] = { total:0, count:0, months: new Set(), values:[] };
    byName[e.name].total += e.net;
    byName[e.name].count++;
    byName[e.name].months.add(`${e.yr}-${e.mi}`);
    byName[e.name].values.push(e.net);
  });
  const items = Object.entries(byName).map(([name, d])=>({
    name, total: d.total, count: d.count, monthCount: d.months.size,
    avg: d.total / d.months.size,
    recurrence: d.months.size / activeMonths,
    variance: d.values.length > 1 ? Math.sqrt(d.values.reduce((s,v)=>(s + Math.pow(v - d.total/d.values.length, 2)),0) / d.values.length) : 0,
  })).sort((a,b)=>b.total-a.total);
  const totalExpenses = allExpenses.reduce((s,e)=>s+e.net, 0);
  const monthlyAvg = totalExpenses / activeMonths;
  const topItems = items.slice(0, 5);
  const recurring = items.filter(i=>i.recurrence >= 0.7).sort((a,b)=>b.total-a.total);
  const savings = items.filter(i=>i.recurrence < 0.7 && i.total > 500).sort((a,b)=>b.total-a.total);
  const recurrenceColor = r => r>=0.9?"#16a34a":r>=0.6?"#b45309":"#6b7280";
  const recurrenceLabel = r => r>=0.9?"קבועה":r>=0.6?"רוב החודשים":"לא קבועה";

  function ExpMiniBar({ value, max, color }) {
    const pct = Math.min((value/max)*100, 100);
    return <div style={{background:"#f1f5f9",borderRadius:4,height:8,width:"100%",overflow:"hidden"}}>
      <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:4,transition:"width 0.4s"}}/>
    </div>;
  }

  return (
    <div style={{direction:"rtl"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#0f172a"}}>🔍 ניתוח הוצאות חכם</div>
          <div style={{fontSize:13,color:"#6b7280",marginTop:3}}>זיהוי דפוסים, חוזרות, והזדמנויות חיסכון</div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          {["all",...years].map(y=>(
            <button key={y} onClick={()=>setSelYears(String(y))}
              style={{padding:"6px 14px",borderRadius:20,border:"1.5px solid",borderColor:selYears===String(y)?"#6366f1":"#e2e8f0",background:selYears===String(y)?"#6366f1":"#fff",color:selYears===String(y)?"#fff":"#374151",fontWeight:selYears===String(y)?700:500,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
              {y==="all"?"כל השנים":y}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:24}}>
        {[
          { label:"סה״כ הוצאות", value: fmt(totalExpenses), icon:"💸", bg:"#fef2f2", border:"#fecaca" },
          { label:"ממוצע חודשי", value: fmt(monthlyAvg), icon:"📅", bg:"#fff7ed", border:"#fed7aa" },
          { label:"הוצאות קבועות", value: fmt(recurring.reduce((s,i)=>s+i.avg,0)), icon:"📌", bg:"#f0fdf4", border:"#bbf7d0" },
          { label:"הוצאות לא קבועות", value: fmt(savings.reduce((s,i)=>s+i.avg,0)), icon:"⚡", bg:"#fefce8", border:"#fde68a" },
        ].map((k,i)=>(
          <div key={i} style={{background:k.bg,border:`1.5px solid ${k.border}`,borderRadius:14,padding:"16px 20px"}}>
            <div style={{fontSize:22}}>{k.icon}</div>
            <div style={{fontSize:11,color:"#6b7280",marginTop:4}}>{k.label}</div>
            <div style={{fontSize:20,fontWeight:800,color:"#0f172a",marginTop:2}}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        <div style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:14,padding:"16px 20px"}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>🏆 הוצאות הגדולות ביותר</div>
          {topItems.map((item,i)=>(
            <div key={i} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{background:"#6366f1",color:"#fff",borderRadius:"50%",width:20,height:20,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{i+1}</span>
                  <span style={{fontSize:13,fontWeight:600}}>{item.name}</span>
                </div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#ef4444"}}>{fmt(item.total)}</div>
                  <div style={{fontSize:10,color:"#94a3b8"}}>ממוצע {fmt(item.avg)}/חודש</div>
                </div>
              </div>
              <ExpMiniBar value={item.total} max={topItems[0].total} color="#6366f1"/>
            </div>
          ))}
        </div>
        <div style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:14,padding:"16px 20px"}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>🔁 הוצאות חוזרות</div>
          {recurring.slice(0,6).map((item,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<recurring.slice(0,6).length-1?"1px solid #f1f5f9":"none"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>{item.name}</div>
                <div style={{fontSize:11,color:recurrenceColor(item.recurrence),fontWeight:600,marginTop:2}}>{recurrenceLabel(item.recurrence)} · {item.monthCount} חודשים</div>
              </div>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:13,fontWeight:700}}>{fmt(item.avg)}/חודש</div>
                <div style={{fontSize:10,color:"#94a3b8"}}>סה״כ {fmt(item.total)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:14,padding:"16px 20px"}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>📋 כל ההוצאות — פירוט מלא</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#f8fafc"}}>
                {["שם","סה״כ","ממוצע/חודש","חודשים","תדירות","שונות"].map(h=>(
                  <th key={h} style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:"#374151",borderBottom:"2px solid #e5e7eb"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item,i)=>(
                <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#f8fafc"}}>
                  <td style={{padding:"8px 12px",fontWeight:600}}>{item.name}</td>
                  <td style={{padding:"8px 12px",fontWeight:700,color:"#ef4444"}}>{fmt(item.total)}</td>
                  <td style={{padding:"8px 12px"}}>{fmt(item.avg)}</td>
                  <td style={{padding:"8px 12px",color:"#6b7280"}}>{item.monthCount}</td>
                  <td style={{padding:"8px 12px"}}>
                    <span style={{background:recurrenceColor(item.recurrence)+"22",color:recurrenceColor(item.recurrence),borderRadius:6,padding:"2px 8px",fontWeight:600,fontSize:11}}>
                      {Math.round(item.recurrence*100)}% · {recurrenceLabel(item.recurrence)}
                    </span>
                  </td>
                  <td style={{padding:"8px 12px",color:"#6b7280"}}>{item.variance > 0 ? `±${fmt(item.variance)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ARView({ allYears, onUpdateEntry }) {
  const [filterStatus, setFilterStatus] = useState("unpaid-pending");
  const [sortBy, setSortBy] = useState("amount");
  const [groupBy, setGroupBy] = useState("client");
  const [search, setSearch] = useState("");
  const [expandedClients, setExpandedClients] = useState({});

  function toggleClient(name) { setExpandedClients(s=>({...s,[name]:!s[name]})); }
  function markReminder(item) {
    const today = new Date().toISOString().slice(0,10);
    onUpdateEntry(item.yr, item.mi, item.id, e=>({...e, reminderSent: today, reminderCount: (e.reminderCount||0)+1}));
  }

  const allItems = [];
  Object.entries(allYears).forEach(([yr,ms])=>{
    ms.forEach((m,mi)=>{
      INCOME_CATEGORIES.forEach(cat=>{
        m.income[cat.key].forEach(e=>{
          const name = (e.name||'').trim();
          const net = parseFloat(e.net)||0;
          if(!name || net===0) return;
          allItems.push({id:e.id, name, net, status:e.status, reminderSent:e.reminderSent||"", reminderCount:e.reminderCount||0, yr:Number(yr), mi, cat:cat.label, catKey:cat.key});
        });
      });
    });
  });

  let items = allItems.filter(e=>{
    if(filterStatus==="unpaid-pending" && e.status==="paid") return false;
    if(filterStatus==="unpaid" && e.status!=="unpaid") return false;
    if(filterStatus==="pending" && e.status!=="pending") return false;
    if(filterStatus==="invoice" && e.status!=="invoice") return false;
    if(search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  items = [...items].sort((a,b)=>{
    if(sortBy==="amount") return b.net-a.net;
    if(sortBy==="name") return a.name.localeCompare(b.name,"he");
    if(sortBy==="month") return (a.yr*12+a.mi)-(b.yr*12+b.mi);
    return 0;
  });

  const totalUnpaid  = allItems.filter(e=>e.status==="unpaid").reduce((s,e)=>s+e.net,0);
  const totalPending = allItems.filter(e=>e.status==="pending").reduce((s,e)=>s+e.net,0);
  const totalInvoice = allItems.filter(e=>e.status==="invoice").reduce((s,e)=>s+e.net,0);
  const totalOpen    = totalUnpaid + totalPending + totalInvoice;
  const totalPaid    = allItems.filter(e=>e.status==="paid").reduce((s,e)=>s+e.net,0);
  const countUnpaid  = allItems.filter(e=>e.status==="unpaid").length;
  const countPending = allItems.filter(e=>e.status==="pending").length;
  const countInvoice = allItems.filter(e=>e.status==="invoice").length;

  const byClient = {};
  items.forEach(e=>{
    if(!byClient[e.name]) byClient[e.name]={name:e.name,items:[],total:0};
    byClient[e.name].items.push(e);
    byClient[e.name].total+=e.net;
  });
  const clientGroups = Object.values(byClient).sort((a,b)=>b.total-a.total);

  const th={padding:"9px 14px",fontWeight:700,fontSize:11,color:"#6b7280",background:"#f9fafb",borderBottom:"1.5px solid #e5e7eb",textAlign:"right"};
  const td=(x={})=>({padding:"9px 14px",fontSize:12,borderBottom:"1px solid #f3f4f6",textAlign:"right",...x});

  function ReminderCell({e}) {
    return e.reminderSent ? (
      <div style={{display:"flex",flexDirection:"column",gap:2}}>
        <span style={{fontSize:10,color:"#2563eb",fontWeight:700}}>📨 {e.reminderSent}</span>
        {e.reminderCount>1 && <span style={{fontSize:10,color:"#9ca3af"}}>× {e.reminderCount} פעמים</span>}
        <button onClick={()=>markReminder(e)} style={{fontSize:10,padding:"2px 6px",borderRadius:5,border:"1px solid #bfdbfe",background:"#eff6ff",color:"#2563eb",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>שלח שוב</button>
      </div>
    ) : (
      <button onClick={()=>markReminder(e)} style={{padding:"4px 10px",borderRadius:7,border:"1.5px solid #e5e7eb",background:"#f9fafb",color:"#374151",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
        📨 סמן תזכורת
      </button>
    );
  }

  return (
    <div style={{direction:"rtl"}}>
      <div className="rsp-kpi-4" style={{marginBottom:16}}>
        {[
          {l:"סה״כ חוב פתוח", v:fmt(totalOpen), sub:`${countUnpaid+countPending+countInvoice} רשומות`, c:"#dc2626", bg:"#fee2e2", icon:"🔴"},
          {l:"לא שולם",        v:fmt(totalUnpaid), sub:`${countUnpaid} רשומות`,   c:"#b91c1c", bg:"#fecaca", icon:"❌"},
          {l:"נשלחה חשבונית",  v:fmt(totalPending), sub:`${countPending} רשומות`, c:"#b45309", bg:"#fef3c7", icon:"🟡"},
          {l:"שולם (היסטורי)", v:fmt(totalPaid), sub:"כל הזמנים",                 c:"#16a34a", bg:"#dcfce7", icon:"✅"},
        ].map(k=>(
          <div key={k.l} style={{background:k.bg,borderRadius:12,padding:"14px 16px",border:`1.5px solid ${k.c}22`}}>
            <div style={{fontSize:11,color:k.c,fontWeight:700,marginBottom:4}}>{k.icon} {k.l}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
            <div style={{fontSize:11,color:k.c,opacity:0.7,marginTop:2}}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 חפש לקוח..." dir="rtl"
          style={{flex:"1 1 130px",minWidth:120,border:"1.5px solid #e5e7eb",borderRadius:8,padding:"6px 10px",fontSize:12,fontFamily:"inherit",background:"#f9fafb"}}/>
        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
          {[{k:"unpaid-pending",l:"חובות פתוחים"},{k:"unpaid",l:"לא שולם"},{k:"pending",l:"נשלחה חשבונית"},{k:"invoice",l:"תישלח חשבונית"},{k:"all",l:"הכל"}].map(s=>(
            <button key={s.k} onClick={()=>setFilterStatus(s.k)}
              style={{padding:"5px 11px",borderRadius:7,border:"1.5px solid",borderColor:filterStatus===s.k?"#6366f1":"#e5e7eb",background:filterStatus===s.k?"#6366f1":"#fff",color:filterStatus===s.k?"#fff":"#374151",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              {s.l}
            </button>
          ))}
        </div>
        <span style={{fontSize:11,color:"#6b7280",marginRight:"auto"}}>{items.length} רשומות · {fmt(items.reduce((s,e)=>s+e.net,0))}</span>
      </div>
      {groupBy==="client" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {clientGroups.length===0 && (
            <div style={{background:"#fff",borderRadius:14,padding:48,textAlign:"center",color:"#6b7280",fontSize:15}}>✅ אין חובות פתוחים</div>
          )}
          {clientGroups.map(cg=>{
            const isOpen = !!expandedClients[cg.name];
            return (
              <div key={cg.name} style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 8px rgba(0,0,0,0.05)"}}>
                <div onClick={()=>toggleClient(cg.name)}
                  style={{padding:"13px 18px",background:"#f8fafc",borderBottom:isOpen?"1px solid #f1f5f9":"none",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,cursor:"pointer",userSelect:"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontWeight:800,fontSize:15}}>{cg.name}</span>
                    <span style={{fontSize:12,color:"#9ca3af"}}>{cg.items.length} חשבוניות</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontWeight:800,fontSize:20,color:"#dc2626"}}>{fmt(cg.total)}</span>
                    <span style={{color:"#9ca3af",fontSize:14}}>{isOpen?"▲":"▼"}</span>
                  </div>
                </div>
                {isOpen && (
                  <div className="tbl-wrap">
                    <table style={{width:"100%",borderCollapse:"collapse",minWidth:420}}>
                      <thead><tr>{["חודש","קטגוריה","סכום נטו","סטטוס","תזכורת"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {cg.items.map((e,i)=>{
                          const so = STATUS_OPTIONS.find(s=>s.value===e.status)||STATUS_OPTIONS[0];
                          return (
                            <tr key={e.id} style={{background:i%2===0?"#fff":"#fafafa"}}>
                              <td style={td({fontWeight:600})}>{MONTHS_HE[e.mi]} {e.yr}</td>
                              <td style={td()}><span style={{fontSize:11,padding:"2px 7px",borderRadius:4,background:`${CAT_COLORS[e.catKey]||"#6366f1"}18`,color:CAT_COLORS[e.catKey]||"#6366f1",fontWeight:600}}>{e.cat}</span></td>
                              <td style={td({fontWeight:700,fontSize:13})}>{fmt(e.net)}</td>
                              <td style={td()}><span style={{padding:"3px 9px",borderRadius:9999,fontSize:11,fontWeight:700,background:so.bg,color:so.color}}>{so.label}</span></td>
                              <td style={td()}><ReminderCell e={e}/></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function strSimilarity(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  if(a===b) return 1;
  if(a.length===0||b.length===0) return 0;
  if(a.includes(b)||b.includes(a)) return 0.85;
  function bigrams(s) { const bg=new Set(); for(let i=0;i<s.length-1;i++) bg.add(s.slice(i,i+2)); return bg; }
  const ba=bigrams(a), bb=bigrams(b);
  let inter=0; ba.forEach(g=>{ if(bb.has(g)) inter++; });
  return (2*inter)/(ba.size+bb.size||1);
}
function getSuggestedPairs(names) {
  const pairs = [];
  for(let i=0;i<names.length;i++) for(let j=i+1;j<names.length;j++) {
    const s = strSimilarity(names[i], names[j]);
    if(s>=0.45) pairs.push({a:names[i], b:names[j], score:s});
  }
  return pairs.sort((x,y)=>y.score-x.score).slice(0,20);
}

function MergeClientsModal({ allNames, onMerge, onClose }) {
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState([]);
  const [canonical, setCanonical] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [tab, setTab] = useState("suggest");
  const suggestions = getSuggestedPairs(allNames);
  const filtered = allNames.filter(n=>!search || n.toLowerCase().includes(search.toLowerCase()));
  const grouped = new Set(groups.flatMap(g=>[g.canonical,...g.aliases]));

  function toggleSelect(name) { setSelected(s=>{ const ns=new Set(s); ns.has(name)?ns.delete(name):ns.add(name); return ns; }); }
  function createGroup() {
    if(selected.size<2||!canonical.trim()) return;
    const others = [...selected].filter(n=>n!==canonical.trim());
    setGroups(g=>[...g, {canonical:canonical.trim(), aliases:others}]);
    setSelected(new Set()); setCanonical("");
  }
  function acceptSuggestion(a, b) {
    const can = a.length>=b.length ? a : b;
    const ali = can===a ? b : a;
    setGroups(g=>[...g, {canonical:can, aliases:[ali]}]);
  }
  function applyAll() { groups.forEach(g=>onMerge([...g.aliases], g.canonical)); onClose(); }

  return (
    <div style={{position:"fixed",inset:0,zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(15,23,42,0.6)",backdropFilter:"blur(4px)"}}
      onClick={e=>{if(e.target===e.currentTarget) onClose();}}>
      <div style={{background:"#fff",borderRadius:20,width:"min(780px,96vw)",maxHeight:"90vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.25)",direction:"rtl",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"18px 22px",borderBottom:"1px solid #f1f5f9",background:"linear-gradient(135deg,#1e293b,#0f172a)",borderRadius:"20px 20px 0 0",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{color:"#f1f5f9",fontSize:17,fontWeight:800}}>🔗 איחוד לקוחות</div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#f1f5f9",borderRadius:9999,width:32,height:32,cursor:"pointer",fontSize:18}}>×</button>
          </div>
          <div style={{display:"flex",gap:4,marginTop:14}}>
            {[{k:"suggest",l:"✨ הצעות"},{k:"manual",l:"✏️ ידני"},{k:"groups",l:`📦 קבוצות (${groups.length})`}].map(t=>(
              <button key={t.k} onClick={()=>setTab(t.k)}
                style={{padding:"6px 12px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:tab===t.k?700:500,background:tab===t.k?"#6366f1":"rgba(255,255,255,0.1)",color:tab===t.k?"#fff":"#94a3b8"}}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
        <div style={{padding:"18px 22px",overflowY:"auto",flex:1}}>
          {tab==="suggest" && (
            <div>
              {suggestions.map((p,i)=>{
                const alreadyGrouped = grouped.has(p.a)&&grouped.has(p.b);
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,marginBottom:8,background:alreadyGrouped?"#f0fdf4":"#f8fafc",border:`1.5px solid ${alreadyGrouped?"#86efac":"#e5e7eb"}`,flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flex:1,flexWrap:"wrap"}}>
                      <span style={{fontWeight:700,fontSize:13}}>{p.a}</span>
                      <span style={{color:"#9ca3af"}}>↔</span>
                      <span style={{fontWeight:700,fontSize:13}}>{p.b}</span>
                      <span style={{padding:"1px 7px",borderRadius:9999,fontSize:10,fontWeight:700,background:p.score>=0.8?"#dcfce7":p.score>=0.6?"#fef3c7":"#fee2e2",color:p.score>=0.8?"#16a34a":p.score>=0.6?"#92400e":"#dc2626"}}>
                        {Math.round(p.score*100)}% דמיון
                      </span>
                    </div>
                    {alreadyGrouped ? <span style={{fontSize:12,color:"#16a34a",fontWeight:700}}>✓ כבר מאוחד</span> : (
                      <button onClick={()=>acceptSuggestion(p.a,p.b)} style={{padding:"5px 12px",borderRadius:8,border:"none",background:"#6366f1",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                        אחד
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {tab==="manual" && (
            <div>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 חפש שם לקוח..." dir="rtl"
                style={{width:"100%",border:"1.5px solid #e5e7eb",borderRadius:9,padding:"8px 12px",fontSize:13,fontFamily:"inherit",marginBottom:12,background:"#f9fafb"}}/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:6,maxHeight:320,overflowY:"auto"}}>
                {filtered.map(n=>{
                  const inGroup = grouped.has(n);
                  const isSel = selected.has(n);
                  return (
                    <div key={n} onClick={()=>!inGroup&&toggleSelect(n)}
                      style={{padding:"8px 12px",borderRadius:9,border:`1.5px solid ${isSel?"#6366f1":inGroup?"#86efac":"#e5e7eb"}`,background:isSel?"#eef2ff":inGroup?"#f0fdf4":"#fafafa",cursor:inGroup?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:4}}>
                      <span style={{fontSize:12,fontWeight:isSel?700:500,color:inGroup?"#16a34a":"#1f2937",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n}</span>
                      {isSel && <span style={{color:"#6366f1",fontSize:14}}>✓</span>}
                    </div>
                  );
                })}
              </div>
              {selected.size>=2 && (
                <div style={{marginTop:12,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <select value={canonical} onChange={e=>setCanonical(e.target.value)}
                    style={{flex:1,minWidth:140,border:"1.5px solid #a5b4fc",borderRadius:7,padding:"5px 8px",fontSize:12,fontFamily:"inherit"}}>
                    <option value="">— בחר שם מייצג —</option>
                    {[...selected].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                  <button onClick={createGroup} disabled={!canonical.trim()}
                    style={{padding:"6px 14px",borderRadius:8,border:"none",background:canonical.trim()?"#6366f1":"#e5e7eb",color:canonical.trim()?"#fff":"#9ca3af",fontSize:12,fontWeight:700,cursor:canonical.trim()?"pointer":"default",fontFamily:"inherit"}}>
                    צור קבוצה ✓
                  </button>
                </div>
              )}
            </div>
          )}
          {tab==="groups" && (
            <div>
              {groups.length===0 && <div style={{textAlign:"center",padding:40,color:"#6b7280"}}>עדיין לא נוצרו קבוצות</div>}
              {groups.map((g,gi)=>(
                <div key={gi} style={{background:"#f8fafc",borderRadius:12,border:"1.5px solid #e5e7eb",marginBottom:10,overflow:"hidden"}}>
                  <div style={{padding:"10px 14px",background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontWeight:800,fontSize:14,color:"#4338ca"}}>{g.canonical}</span>
                    <button onClick={()=>setGroups(gs=>gs.filter((_,i)=>i!==gi))} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>הסר</button>
                  </div>
                  <div style={{padding:"10px 14px",display:"flex",flexWrap:"wrap",gap:6}}>
                    {g.aliases.map(a=>(
                      <span key={a} style={{background:"#fee2e2",color:"#dc2626",borderRadius:9999,padding:"3px 10px",fontSize:12,fontWeight:600}}>{a}</span>
                    ))}
                    <span style={{color:"#9ca3af"}}>→</span>
                    <span style={{background:"#dcfce7",color:"#16a34a",borderRadius:9999,padding:"3px 10px",fontSize:12,fontWeight:700}}>{g.canonical}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{padding:"14px 22px",borderTop:"1px solid #f1f5f9",background:"#f9fafb",borderRadius:"0 0 20px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <span style={{fontSize:12,color:"#6b7280"}}>{groups.length} קבוצות</span>
          <div style={{display:"flex",gap:8}}>
            <button onClick={onClose} style={{padding:"7px 16px",borderRadius:9,border:"1.5px solid #e5e7eb",background:"#fff",color:"#6b7280",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>ביטול</button>
            <button onClick={applyAll} disabled={groups.length===0}
              style={{padding:"7px 18px",borderRadius:9,border:"none",background:groups.length?"#6366f1":"#e5e7eb",color:groups.length?"#fff":"#9ca3af",fontSize:13,fontWeight:700,cursor:groups.length?"pointer":"default",fontFamily:"inherit"}}>
              ✅ החל שינויים
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== GOALS BAR =====================
function GoalsBar({ year, month, goals, setGoals, totInc, pa }) {
  const key = `${year}-${month}`;
  const g = goals[key] || {};
  const [editing, setEditing] = useState(false);
  const [incGoal, setIncGoal] = useState(String(g.incomeGoal||""));
  const [profGoal, setProfGoal] = useState(String(g.profitGoal||""));

  function save() {
    setGoals(gs=>({...gs,[key]:{incomeGoal:parseFloat(incGoal)||0,profitGoal:parseFloat(profGoal)||0}}));
    setEditing(false);
  }

  const incGoalVal = g.incomeGoal||0;
  const profGoalVal = g.profitGoal||0;
  const incPct = incGoalVal>0 ? Math.min((totInc/incGoalVal)*100,100) : 0;
  const profPct = profGoalVal>0 ? Math.min((pa/profGoalVal)*100,100) : 0;
  const incColor = incPct>=100?"#22c55e":incPct>=70?"#0ea5e9":"#7c3aed";
  const profColor = profPct>=100?"#22c55e":profPct>=70?"#0ea5e9":pa<0?"#ef4444":"#7c3aed";

  if(!incGoalVal && !profGoalVal && !editing) return (
    <div style={{marginBottom:14}}>
      <button onClick={()=>setEditing(true)}
        style={{background:"none",border:"1.5px dashed #c4b5fd",color:"#7c3aed",borderRadius:9,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
        🎯 הגדר יעדים לחודש זה
      </button>
    </div>
  );

  return (
    <div style={{background:"#fff",borderRadius:12,padding:"14px 16px",marginBottom:14,border:"1.5px solid #ede9fe",boxShadow:"0 1px 6px rgba(124,58,237,0.06)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <span style={{fontWeight:700,fontSize:13,color:"#7c3aed"}}>🎯 יעדים חודשיים</span>
        <button onClick={()=>setEditing(e=>!e)}
          style={{background:"none",border:"none",color:"#a78bfa",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit"}}>
          {editing?"✕ סגור":"✏️ עריכה"}
        </button>
      </div>

      {editing ? (
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div>
            <div style={{fontSize:11,color:"#6b7280",marginBottom:3,fontWeight:600}}>יעד הכנסות (₪)</div>
            <input type="number" value={incGoal} onChange={e=>setIncGoal(e.target.value)}
              placeholder="0" dir="ltr"
              style={{width:130,border:"1.5px solid #c4b5fd",borderRadius:7,padding:"6px 10px",fontSize:13,fontFamily:"inherit",background:"#faf5ff"}}/>
          </div>
          <div>
            <div style={{fontSize:11,color:"#6b7280",marginBottom:3,fontWeight:600}}>יעד רווח נטו (₪)</div>
            <input type="number" value={profGoal} onChange={e=>setProfGoal(e.target.value)}
              placeholder="0" dir="ltr"
              style={{width:130,border:"1.5px solid #c4b5fd",borderRadius:7,padding:"6px 10px",fontSize:13,fontFamily:"inherit",background:"#faf5ff"}}/>
          </div>
          <button onClick={save}
            style={{padding:"7px 18px",borderRadius:8,border:"none",background:"#7c3aed",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            שמור
          </button>
        </div>
      ) : (
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {incGoalVal>0 && (
            <div style={{flex:"1 1 200px",minWidth:180}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                <span style={{color:"#6b7280",fontWeight:600}}>הכנסות</span>
                <span style={{fontWeight:700,color:incColor}}>{fmt(totInc)} / {fmt(incGoalVal)} <span style={{fontSize:10,opacity:0.7}}>({incPct.toFixed(0)}%)</span></span>
              </div>
              <div style={{height:8,background:"#f3f0ff",borderRadius:9999,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${incPct}%`,background:incColor,borderRadius:9999,transition:"width 0.5s"}}/>
              </div>
              {incPct>=100 && <div style={{fontSize:10,color:"#22c55e",fontWeight:700,marginTop:3}}>✅ יעד הושג!</div>}
            </div>
          )}
          {profGoalVal>0 && (
            <div style={{flex:"1 1 200px",minWidth:180}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                <span style={{color:"#6b7280",fontWeight:600}}>רווח נטו</span>
                <span style={{fontWeight:700,color:profColor}}>{fmt(pa)} / {fmt(profGoalVal)} <span style={{fontSize:10,opacity:0.7}}>({profPct.toFixed(0)}%)</span></span>
              </div>
              <div style={{height:8,background:"#f3f0ff",borderRadius:9999,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.max(profPct,0)}%`,background:profColor,borderRadius:9999,transition:"width 0.5s"}}/>
              </div>
              {profPct>=100 && <div style={{fontSize:10,color:"#22c55e",fontWeight:700,marginTop:3}}>✅ יעד הושג!</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===================== NEW CLIENT VIEW =====================
function ClientCard({ client, profile, contracts, onEdit, onSelect, onAddIncome, allYears, years }) {
  const avg = client.months.length ? client.totalNet/client.months.length : 0;
  const paidPct = client.months.length ? (client.months.filter(m=>m.status==="paid").length/client.months.length)*100 : 0;
  const topCat = Object.entries(client.cats).sort((a,b)=>b[1]-a[1])[0];
  const contract = contracts.find(c=>c.clientName===client.name && c.status==="active");
  // seniority in months
  const now = new Date();
  const fs = client.firstSeen;
  const seniorityMonths = fs ? (now.getFullYear()-fs.yr)*12+(now.getMonth()-fs.mi) : 0;

  return (
    <div style={{background:"#fff",borderRadius:14,border:"1.5px solid #ede9fe",boxShadow:"0 1px 8px rgba(124,58,237,0.06)",overflow:"hidden",transition:"box-shadow 0.2s,transform 0.2s",cursor:"pointer"}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 6px 24px rgba(124,58,237,0.14)";e.currentTarget.style.transform="translateY(-2px)";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 8px rgba(124,58,237,0.06)";e.currentTarget.style.transform="";}}>

      {/* Header strip */}
      <div style={{background:"linear-gradient(135deg,#f5f3ff,#faf5ff)",padding:"12px 14px",borderBottom:"1px solid #ede9fe",display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
        <div onClick={()=>onSelect(client)} style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:800,fontSize:15,color:"#0f0a1e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{client.name}</div>
          <div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}>
            {topCat && <span style={{fontSize:10,padding:"1px 7px",borderRadius:9999,background:`${CAT_COLORS[topCat[0]]||"#7c3aed"}18`,color:CAT_COLORS[topCat[0]]||"#7c3aed",fontWeight:700}}>{CAT_LABELS[topCat[0]]}</span>}
            {contract && <span style={{fontSize:10,padding:"1px 7px",borderRadius:9999,background:"#f0fdf4",color:"#16a34a",fontWeight:700}}>📄 חוזה פעיל</span>}
            {seniorityMonths>0 && <span style={{fontSize:10,padding:"1px 7px",borderRadius:9999,background:"#f1f5f9",color:"#6b7280",fontWeight:600}}>{seniorityMonths} חודשים</span>}
          </div>
        </div>
        <button onClick={e=>{e.stopPropagation();onEdit(client.name);}}
          style={{background:"#fff",border:"1.5px solid #ede9fe",borderRadius:7,padding:"4px 8px",fontSize:11,color:"#7c3aed",cursor:"pointer",fontWeight:600,flexShrink:0,fontFamily:"inherit"}}>
          ✏️
        </button>
      </div>

      {/* Body */}
      <div style={{padding:"12px 14px"}} onClick={()=>onSelect(client)}>
        <div style={{fontSize:22,fontWeight:900,color:"#7c3aed",marginBottom:2,letterSpacing:"-0.5px"}}>{fmt(client.totalNet)}</div>
        <div style={{fontSize:11,color:"#6b7280",marginBottom:8}}>ממוצע {fmt(avg)}/חודש · {client.months.length} רשומות</div>

        {/* Income progress bar */}
        <div style={{height:5,background:"#f3f0ff",borderRadius:9999,overflow:"hidden",marginBottom:4}}>
          <div style={{width:`${paidPct}%`,height:"100%",background:"#22c55e",borderRadius:9999}}/>
        </div>
        <div style={{fontSize:10,color:"#9ca3af",marginBottom:10}}>{paidPct.toFixed(0)}% שולם</div>

        {/* Contact info if exists */}
        {profile?.phone && <div style={{fontSize:11,color:"#6b7280",marginBottom:2}}>📞 {profile.phone}</div>}
        {profile?.email && <div style={{fontSize:11,color:"#6b7280",marginBottom:6}}>✉️ {profile.email}</div>}
      </div>

      {/* Add income button */}
      <div style={{padding:"0 14px 12px"}} onClick={e=>e.stopPropagation()}>
        <AddIncomeInline clientName={client.name} onAddIncome={onAddIncome} years={years}/>
      </div>
    </div>
  );
}

function AddIncomeInline({ clientName, onAddIncome, years }) {
  const [open, setOpen] = useState(false);
  const [yr, setYr] = useState(years[years.length-1]||2026);
  const [mo, setMo] = useState(new Date().getMonth());
  const [cat, setCat] = useState("retainers");
  const [net, setNet] = useState("");
  const [status, setStatus] = useState("paid");

  function submit() {
    if(!net || isNaN(parseFloat(net))) return;
    onAddIncome(clientName, yr, mo, cat, parseFloat(net), status);
    setNet(""); setOpen(false);
  }

  if(!open) return (
    <button onClick={()=>setOpen(true)}
      style={{width:"100%",padding:"6px",borderRadius:8,border:"1.5px dashed #c4b5fd",background:"#faf5ff",color:"#7c3aed",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
      + הוסף הכנסה
    </button>
  );

  return (
    <div style={{background:"#faf5ff",borderRadius:9,border:"1.5px solid #c4b5fd",padding:"10px 12px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
        <select value={yr} onChange={e=>setYr(Number(e.target.value))}
          style={{border:"1px solid #ddd6fe",borderRadius:6,padding:"4px 6px",fontSize:11,fontFamily:"inherit",background:"#fff"}}>
          {years.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <select value={mo} onChange={e=>setMo(Number(e.target.value))}
          style={{border:"1px solid #ddd6fe",borderRadius:6,padding:"4px 6px",fontSize:11,fontFamily:"inherit",background:"#fff"}}>
          {MONTHS_HE.map((m,i)=><option key={i} value={i}>{m}</option>)}
        </select>
        <select value={cat} onChange={e=>setCat(e.target.value)}
          style={{border:"1px solid #ddd6fe",borderRadius:6,padding:"4px 6px",fontSize:11,fontFamily:"inherit",background:"#fff"}}>
          {INCOME_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <select value={status} onChange={e=>setStatus(e.target.value)}
          style={{border:"1px solid #ddd6fe",borderRadius:6,padding:"4px 6px",fontSize:11,fontFamily:"inherit",background:"#fff"}}>
          {STATUS_OPTIONS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div style={{display:"flex",gap:6}}>
        <input type="number" value={net} onChange={e=>setNet(e.target.value)} placeholder="סכום נטו ₪" dir="ltr"
          style={{flex:1,border:"1px solid #ddd6fe",borderRadius:6,padding:"5px 8px",fontSize:12,fontFamily:"inherit",background:"#fff"}}/>
        <button onClick={submit}
          style={{padding:"5px 12px",borderRadius:6,border:"none",background:"#7c3aed",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
          ✓
        </button>
        <button onClick={()=>setOpen(false)}
          style={{padding:"5px 8px",borderRadius:6,border:"1px solid #ddd6fe",background:"#fff",color:"#6b7280",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
          ✕
        </button>
      </div>
    </div>
  );
}

function ClientProfileModal({ clientName, profile, onSave, onClose }) {
  const [form, setForm] = useState({
    phone: profile?.phone||"",
    email: profile?.email||"",
    contact: profile?.contact||"",
    notes: profile?.notes||"",
  });
  const inp = {width:"100%",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"7px 10px",fontSize:13,fontFamily:"inherit",background:"#fafafa",direction:"rtl"};

  return (
    <div style={{position:"fixed",inset:0,zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(15,23,42,0.5)",backdropFilter:"blur(4px)"}}
      onClick={e=>{if(e.target===e.currentTarget) onClose();}}>
      <div style={{background:"#fff",borderRadius:18,width:"min(480px,95vw)",boxShadow:"0 24px 80px rgba(0,0,0,0.18)",direction:"rtl",overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{color:"#fff",fontWeight:800,fontSize:16}}>👤 {clientName}</div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",borderRadius:9999,width:28,height:28,cursor:"pointer",fontSize:16}}>×</button>
        </div>
        <div style={{padding:"20px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {[
              {l:"טלפון",k:"phone",ph:"050-0000000"},
              {l:"אימייל",k:"email",ph:"name@example.com"},
              {l:"איש קשר",k:"contact",ph:"שם איש הקשר"},
            ].map(f=>(
              <div key={f.k}>
                <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:3}}>{f.l}</div>
                <input value={form[f.k]} onChange={e=>setForm(s=>({...s,[f.k]:e.target.value}))} placeholder={f.ph} style={inp}/>
              </div>
            ))}
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:3}}>הערות</div>
              <textarea value={form.notes} onChange={e=>setForm(s=>({...s,notes:e.target.value}))}
                placeholder="הערות על הלקוח..." rows={3}
                style={{...inp,resize:"vertical",lineHeight:1.6}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
            <button onClick={onClose} style={{padding:"8px 16px",borderRadius:8,border:"1.5px solid #e5e7eb",background:"#fff",color:"#6b7280",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>ביטול</button>
            <button onClick={()=>onSave(form)} style={{padding:"8px 20px",borderRadius:8,border:"none",background:"#7c3aed",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>שמור</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientDetailModal({ client, profile, allYears, contracts, onClose, onAddIncome, years }) {
  const allMonths = [];
  Object.keys(allYears).sort().forEach(yr=>{
    for(let mi=0;mi<12;mi++) {
      const entries = allYears[yr][mi];
      let net=0;
      INCOME_CATEGORIES.forEach(cat=>{
        entries.income[cat.key].forEach(e=>{
          if((e.name||'').trim()===client.name) net+=parseFloat(e.net)||0;
        });
      });
      allMonths.push({yr:Number(yr),mi,net,label:`${MONTHS_HE[mi].slice(0,3)} ${yr}`});
    }
  });
  const maxMonth = Math.max(...allMonths.filter(m=>m.net>0).map(m=>m.net),1);
  const avg = client.months.length ? client.totalNet/client.months.length : 0;
  const contract = contracts.find(c=>c.clientName===client.name && c.status==="active");
  const th={padding:"8px 12px",fontWeight:700,fontSize:11,color:"#6b7280",background:"#faf9ff",borderBottom:"1px solid #ede9fe",textAlign:"right"};
  const td=(x={})=>({padding:"8px 12px",fontSize:12,borderBottom:"1px solid #f5f3ff",textAlign:"right",...x});

  return (
    <div style={{position:"fixed",inset:0,zIndex:1500,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(15,23,42,0.55)",backdropFilter:"blur(4px)"}}
      onClick={e=>{if(e.target===e.currentTarget) onClose();}}>
      <div style={{background:"#fff",borderRadius:20,width:"min(820px,95vw)",maxHeight:"88vh",overflow:"auto",boxShadow:"0 24px 80px rgba(124,58,237,0.2)",direction:"rtl"}}>

        {/* Header */}
        <div style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)",padding:"20px 24px",borderRadius:"20px 20px 0 0",display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
          <div>
            <div style={{color:"#fff",fontSize:22,fontWeight:900,letterSpacing:"-0.3px"}}>{client.name}</div>
            <div style={{color:"rgba(255,255,255,0.75)",fontSize:12,marginTop:4,display:"flex",gap:12,flexWrap:"wrap"}}>
              {profile?.phone && <span>📞 {profile.phone}</span>}
              {profile?.email && <span>✉️ {profile.email}</span>}
              {profile?.contact && <span>👤 {profile.contact}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",borderRadius:9999,width:32,height:32,cursor:"pointer",fontSize:18}}>×</button>
        </div>

        <div style={{padding:"20px 24px"}}>
          {/* KPIs */}
          <div className="rsp-kpi-4" style={{marginBottom:18}}>
            {[
              {l:"סה״כ הכנסות",v:fmt(client.totalNet),c:"#7c3aed"},
              {l:"ממוצע חודשי", v:fmt(avg),           c:"#0ea5e9"},
              {l:"חודש שיא",    v:fmt(Math.max(...client.months.map(m=>m.net),0)),c:"#22c55e"},
              {l:"חודשים פעילים",v:String(client.months.length),c:"#f59e0b"},
            ].map(k=>(
              <div key={k.l} style={{background:"#faf5ff",borderRadius:12,padding:"12px 14px",borderTop:`3px solid ${k.c}`,border:`1.5px solid #ede9fe`,borderTopWidth:3,borderTopColor:k.c}}>
                <div style={{fontSize:10,color:"#6b7280",marginBottom:4,fontWeight:600}}>{k.l}</div>
                <div style={{fontSize:18,fontWeight:800,color:k.c}}>{k.v}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div style={{background:"#faf5ff",borderRadius:12,padding:"14px 16px",marginBottom:16,border:"1.5px solid #ede9fe"}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:"#7c3aed"}}>📈 ציר זמן הכנסות</div>
            <div style={{display:"flex",gap:2,alignItems:"flex-end",height:56}}>
              {allMonths.map((m,i)=>(
                <div key={i} title={`${m.label}: ${fmt(m.net)}`} style={{flex:1}}>
                  <div style={{width:"100%",background:m.net>0?"#7c3aed":"#ede9fe",borderRadius:"2px 2px 0 0",
                    height:`${m.net>0?(m.net/maxMonth)*48+4:2}px`,opacity:m.net>0?1:0.3,minHeight:2,transition:"height 0.3s"}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Contract if exists */}
          {contract && (
            <div style={{background:"#f0fdf4",borderRadius:12,padding:"12px 16px",marginBottom:16,border:"1.5px solid #bbf7d0"}}>
              <div style={{fontWeight:700,fontSize:13,color:"#16a34a",marginBottom:6}}>📄 חוזה פעיל</div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:12,color:"#374151"}}>
                <span>סוג: {CONTRACT_TYPES.find(t=>t.value===contract.type)?.label}</span>
                {contract.monthlyValue && <span>שווי: {fmt(parseFloat(contract.monthlyValue))}/חודש</span>}
                {contract.endDate && <span>עד: {contract.endDate}</span>}
              </div>
            </div>
          )}

          {/* Notes */}
          {profile?.notes && (
            <div style={{background:"#fefce8",borderRadius:12,padding:"12px 16px",marginBottom:16,border:"1.5px solid #fde68a"}}>
              <div style={{fontWeight:700,fontSize:12,color:"#92400e",marginBottom:4}}>📝 הערות</div>
              <div style={{fontSize:13,color:"#78350f",whiteSpace:"pre-wrap"}}>{profile.notes}</div>
            </div>
          )}

          {/* Add income */}
          <div style={{background:"#faf5ff",borderRadius:12,padding:"14px 16px",marginBottom:16,border:"1.5px solid #ede9fe"}}>
            <div style={{fontWeight:700,fontSize:13,color:"#7c3aed",marginBottom:10}}>+ הוסף הכנסה לחודש</div>
            <AddIncomeInline clientName={client.name} onAddIncome={onAddIncome} years={years}/>
          </div>

          {/* History table */}
          <div className="tbl-wrap" style={{borderRadius:12,border:"1.5px solid #ede9fe",overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:360}}>
              <thead><tr>{["שנה","חודש","קטגוריה","סכום נטו","סטטוס"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {client.months.sort((a,b)=>b.yr-a.yr||b.mi-a.mi).map((m,i)=>{
                  const so=STATUS_OPTIONS.find(s=>s.value===m.status)||STATUS_OPTIONS[0];
                  return (
                    <tr key={i} style={{background:i%2===0?"#fff":"#fdf8ff"}}>
                      <td style={td()}>{m.yr}</td>
                      <td style={td({fontWeight:600})}>{MONTHS_HE[m.mi]}</td>
                      <td style={td()}><span style={{fontSize:11,padding:"1px 7px",borderRadius:4,background:`${CAT_COLORS[m.catKey]||"#7c3aed"}18`,color:CAT_COLORS[m.catKey]||"#7c3aed",fontWeight:600}}>{m.cat}</span></td>
                      <td style={td({fontWeight:700,color:"#7c3aed"})}>{fmt(m.net)}</td>
                      <td style={td()}><span style={{padding:"1px 7px",borderRadius:9999,fontSize:11,fontWeight:700,background:so.bg,color:so.color}}>{so.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientView({ clientList, allYears, onMerge, clientProfiles, setClientProfiles, contracts, onAddIncome, years }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("total");
  const [filterCat, setFilterCat] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null); // clientName
  const [showMerge, setShowMerge] = useState(false);

  // Filter + sort
  let filtered = clientList.filter(c=>{
    if(search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if(filterCat!=="all" && !c.cats[filterCat]) return false;
    if(filterYear!=="all" && !c.months.some(m=>String(m.yr)===filterYear)) return false;
    return true;
  });

  filtered = [...filtered].sort((a,b)=>{
    if(sortBy==="total")    return b.totalNet - a.totalNet;
    if(sortBy==="avg")      return (b.totalNet/Math.max(b.months.length,1)) - (a.totalNet/Math.max(a.months.length,1));
    if(sortBy==="name")     return a.name.localeCompare(b.name,"he");
    if(sortBy==="seniority"){
      const aMs = a.firstSeen ? a.firstSeen.yr*12+a.firstSeen.mi : 9999*12;
      const bMs = b.firstSeen ? b.firstSeen.yr*12+b.firstSeen.mi : 9999*12;
      return aMs - bMs; // oldest first
    }
    if(sortBy==="months")   return b.months.length - a.months.length;
    return 0;
  });

  const totalRevenue = clientList.reduce((s,c)=>s+c.totalNet,0);
  const retainerClients = clientList.filter(c=>c.cats["retainers"]).length;

  function saveProfile(name, form) {
    setClientProfiles(p=>({...p,[name]:{...form,updatedAt:new Date().toISOString()}}));
    setEditingProfile(null);
  }

  return (
    <div style={{direction:"rtl"}}>
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          profile={clientProfiles[selectedClient.name]}
          allYears={allYears}
          contracts={contracts}
          onClose={()=>setSelectedClient(null)}
          onAddIncome={onAddIncome}
          years={years}/>
      )}
      {editingProfile && (
        <ClientProfileModal
          clientName={editingProfile}
          profile={clientProfiles[editingProfile]}
          onSave={form=>saveProfile(editingProfile, form)}
          onClose={()=>setEditingProfile(null)}/>
      )}
      {showMerge && <MergeClientsModal allNames={clientList.map(c=>c.name)} onMerge={onMerge} onClose={()=>setShowMerge(false)}/>}

      {/* KPIs */}
      <div className="rsp-kpi-4" style={{marginBottom:18}}>
        {[
          {l:"סה״כ לקוחות",   v:String(clientList.length), c:"#7c3aed", bg:"#f5f3ff", icon:"👥"},
          {l:"סה״כ הכנסות",   v:fmt(totalRevenue),          c:"#22c55e", bg:"#f0fdf4", icon:"💰"},
          {l:"לקוחות ריטיינר",v:String(retainerClients),    c:"#0ea5e9", bg:"#f0f9ff", icon:"🔁"},
          {l:"ממוצע ללקוח",   v:fmt(clientList.length?totalRevenue/clientList.length:0), c:"#f59e0b", bg:"#fffbeb", icon:"📊"},
        ].map(k=>(
          <div key={k.l} style={{background:k.bg,borderRadius:12,padding:"14px 16px",border:`1.5px solid ${k.c}22`}}>
            <div style={{fontSize:11,color:k.c,fontWeight:700,marginBottom:4}}>{k.icon} {k.l}</div>
            <div style={{fontSize:20,fontWeight:800,color:k.c}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Filters + sort */}
      <div style={{background:"#fff",borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",border:"1.5px solid #ede9fe",boxShadow:"0 1px 6px rgba(124,58,237,0.04)"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 חפש לקוח..." dir="rtl"
          style={{flex:"1 1 160px",minWidth:130,border:"1.5px solid #e5e7eb",borderRadius:8,padding:"7px 10px",fontSize:13,fontFamily:"inherit",background:"#faf5ff"}}/>

        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)}
          style={{border:"1.5px solid #e5e7eb",borderRadius:8,padding:"7px 10px",fontSize:12,fontFamily:"inherit",background:"#fafafa",cursor:"pointer"}}>
          <option value="all">כל הקטגוריות</option>
          {INCOME_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
        </select>

        <select value={filterYear} onChange={e=>setFilterYear(e.target.value)}
          style={{border:"1.5px solid #e5e7eb",borderRadius:8,padding:"7px 10px",fontSize:12,fontFamily:"inherit",background:"#fafafa",cursor:"pointer"}}>
          <option value="all">כל השנים</option>
          {years.map(y=><option key={y} value={y}>{y}</option>)}
        </select>

        {/* Sort buttons */}
        <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:"#7c3aed",fontWeight:600}}>מיין:</span>
          {[
            {k:"total",     l:"שווי"},
            {k:"avg",       l:"ממוצע"},
            {k:"seniority", l:"וותק"},
            {k:"months",    l:"פעילות"},
            {k:"name",      l:"א-ת"},
          ].map(s=>(
            <button key={s.k} onClick={()=>setSortBy(s.k)}
              style={{padding:"5px 11px",borderRadius:20,border:"1.5px solid",borderColor:sortBy===s.k?"#7c3aed":"#e5e7eb",background:sortBy===s.k?"#7c3aed":"#fff",color:sortBy===s.k?"#fff":"#374151",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
              {s.l}
            </button>
          ))}
        </div>

        <div style={{display:"flex",gap:6,marginRight:"auto"}}>
          <button onClick={()=>setShowMerge(true)}
            style={{padding:"6px 14px",borderRadius:8,border:"1.5px solid #ddd6fe",background:"#f5f3ff",color:"#7c3aed",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            🔗 איחוד
          </button>
        </div>
        <span style={{fontSize:12,color:"#6b7280"}}>{filtered.length} לקוחות</span>
      </div>

      {/* Grid */}
      <div className="rsp-clients-grid">
        {filtered.map(c=>(
          <ClientCard
            key={c.name}
            client={c}
            profile={clientProfiles[c.name]}
            contracts={contracts}
            onEdit={name=>setEditingProfile(name)}
            onSelect={setSelectedClient}
            onAddIncome={onAddIncome}
            allYears={allYears}
            years={years}
          />
        ))}
        {filtered.length===0 && (
          <div style={{gridColumn:"1/-1",background:"#fff",borderRadius:14,padding:48,textAlign:"center",color:"#6b7280",border:"1.5px solid #ede9fe"}}>
            <div style={{fontSize:36,marginBottom:8}}>👥</div>
            <div style={{fontWeight:700,fontSize:16,color:"#7c3aed"}}>לא נמצאו לקוחות</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== CONTRACTS VIEW =====================
const CONTRACT_STATUS_OPTIONS = [
  { value: "active",    label: "פעיל",       color: "#16a34a", bg: "#dcfce7" },
  { value: "pending",   label: "ממתין לחתימה", color: "#b45309", bg: "#fef3c7" },
  { value: "expired",   label: "פג תוקף",    color: "#dc2626", bg: "#fee2e2" },
  { value: "cancelled", label: "בוטל",       color: "#6b7280", bg: "#f3f4f6" },
];
const CONTRACT_TYPES = [
  { value: "retainer",   label: "ריטיינר חודשי" },
  { value: "project",    label: "פרויקט חד פעמי" },
  { value: "annual",     label: "שנתי" },
  { value: "partnership",label: "שותפות" },
  { value: "other",      label: "אחר" },
];

function newContract() {
  return {
    id: "c" + Date.now() + Math.random().toString(36).slice(2,6),
    clientName: "",
    type: "retainer",
    status: "active",
    signDate: "",
    startDate: "",
    endDate: "",
    monthlyValue: "",
    totalValue: "",
    noticeDays: "30",
    autoRenew: false,
    paymentTerms: "שוטף+30",
    services: "",
    notes: "",
    files: [],
    createdAt: new Date().toISOString(),
  };
}

function getDaysUntilExpiry(endDate) {
  if(!endDate) return null;
  const diff = Math.ceil((new Date(endDate) - new Date()) / (1000*60*60*24));
  return diff;
}

function ContractForm({ contract, onSave, onCancel, clientNames }) {
  const [form, setForm] = useState({...contract});
  const f = (k, v) => setForm(s=>({...s,[k]:v}));

  const daysLeft = getDaysUntilExpiry(form.endDate);
  const expiryWarning = daysLeft !== null && daysLeft <= 60 && form.status === "active";

  const inputStyle = {
    width:"100%", border:"1.5px solid #e5e7eb", borderRadius:8, padding:"7px 10px",
    fontSize:13, fontFamily:"inherit", background:"#fafafa", color:"#1e293b", direction:"rtl"
  };
  const labelStyle = { fontSize:12, fontWeight:700, color:"#374151", marginBottom:4, display:"block" };

  return (
    <div style={{direction:"rtl"}}>
      {expiryWarning && (
        <div style={{background:"#fef3c7",border:"1.5px solid #fcd34d",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#92400e",fontWeight:600}}>
          ⚠️ החוזה יפוג בעוד {daysLeft} ימים
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        {/* Client */}
        <div>
          <label style={labelStyle}>שם לקוח *</label>
          <input list="client-names-list" value={form.clientName} onChange={e=>f("clientName",e.target.value)}
            placeholder="הקלד או בחר לקוח..." style={inputStyle} dir="rtl"/>
          <datalist id="client-names-list">
            {clientNames.map(n=><option key={n} value={n}/>)}
          </datalist>
        </div>
        {/* Type */}
        <div>
          <label style={labelStyle}>סוג הסכם</label>
          <select value={form.type} onChange={e=>f("type",e.target.value)} style={inputStyle}>
            {CONTRACT_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {/* Status */}
        <div>
          <label style={labelStyle}>סטטוס</label>
          <select value={form.status} onChange={e=>f("status",e.target.value)} style={inputStyle}>
            {CONTRACT_STATUS_OPTIONS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        {/* Sign date */}
        <div>
          <label style={labelStyle}>תאריך חתימה</label>
          <input type="date" value={form.signDate} onChange={e=>f("signDate",e.target.value)} style={inputStyle}/>
        </div>
        {/* Start date */}
        <div>
          <label style={labelStyle}>תחילת הסכם</label>
          <input type="date" value={form.startDate} onChange={e=>f("startDate",e.target.value)} style={inputStyle}/>
        </div>
        {/* End date */}
        <div>
          <label style={labelStyle}>סיום הסכם</label>
          <input type="date" value={form.endDate} onChange={e=>f("endDate",e.target.value)} style={inputStyle}/>
        </div>
        {/* Monthly value */}
        <div>
          <label style={labelStyle}>שווי חודשי (₪ נטו)</label>
          <input type="number" value={form.monthlyValue} onChange={e=>f("monthlyValue",e.target.value)}
            placeholder="0" style={inputStyle} dir="ltr"/>
        </div>
        {/* Total value */}
        <div>
          <label style={labelStyle}>שווי כולל (₪ נטו)</label>
          <input type="number" value={form.totalValue} onChange={e=>f("totalValue",e.target.value)}
            placeholder="0" style={inputStyle} dir="ltr"/>
        </div>
        {/* Notice period */}
        <div>
          <label style={labelStyle}>ימי הודעה מראש</label>
          <input type="number" value={form.noticeDays} onChange={e=>f("noticeDays",e.target.value)}
            placeholder="30" style={inputStyle} dir="ltr"/>
        </div>
        {/* Payment terms */}
        <div>
          <label style={labelStyle}>תנאי תשלום</label>
          <input value={form.paymentTerms} onChange={e=>f("paymentTerms",e.target.value)}
            placeholder="שוטף+30" style={inputStyle} dir="rtl"/>
        </div>
      </div>

      {/* Auto renew */}
      <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
        <input type="checkbox" id="auto-renew" checked={form.autoRenew} onChange={e=>f("autoRenew",e.target.checked)}
          style={{width:16,height:16,accentColor:"#6366f1",cursor:"pointer"}}/>
        <label htmlFor="auto-renew" style={{fontSize:13,color:"#374151",cursor:"pointer",fontWeight:600}}>
          חידוש אוטומטי
        </label>
      </div>

      {/* Services */}
      <div style={{marginBottom:14}}>
        <label style={labelStyle}>שירותים / היקף עבודה</label>
        <textarea value={form.services} onChange={e=>f("services",e.target.value)}
          placeholder="תאר את השירותים הכלולים בהסכם..." rows={3}
          style={{...inputStyle, resize:"vertical", lineHeight:1.6}}/>
      </div>

      {/* Notes */}
      <div style={{marginBottom:20}}>
        <label style={labelStyle}>הערות ותנאים מיוחדים</label>
        <textarea value={form.notes} onChange={e=>f("notes",e.target.value)}
          placeholder="תנאים מיוחדים, הגבלות, הערות לעצמך..." rows={3}
          style={{...inputStyle, resize:"vertical", lineHeight:1.6}}/>
      </div>

      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={{padding:"9px 20px",borderRadius:9,border:"1.5px solid #e5e7eb",background:"#fff",color:"#6b7280",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
          ביטול
        </button>
        <button onClick={()=>onSave(form)} disabled={!form.clientName.trim()}
          style={{padding:"9px 22px",borderRadius:9,border:"none",background:form.clientName.trim()?"#6366f1":"#e5e7eb",color:form.clientName.trim()?"#fff":"#9ca3af",fontWeight:700,fontSize:13,cursor:form.clientName.trim()?"pointer":"default",fontFamily:"inherit"}}>
          💾 שמור חוזה
        </button>
      </div>
    </div>
  );
}

function ContractsView({ contracts, setContracts, clientList }) {
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("signDate");
  const [expandedId, setExpandedId] = useState(null);

  const clientNames = clientList.map(c=>c.name);

  function saveContract(form) {
    if(editingContract) {
      setContracts(cs=>cs.map(c=>c.id===form.id ? form : c));
    } else {
      setContracts(cs=>[...cs, form]);
    }
    setShowForm(false);
    setEditingContract(null);
  }

  function deleteContract(id) {
    if(!window.confirm("למחוק חוזה זה?")) return;
    setContracts(cs=>cs.filter(c=>c.id!==id));
  }

  function startEdit(contract) {
    setEditingContract(contract);
    setShowForm(true);
  }

  function startNew() {
    setEditingContract(null);
    setShowForm(true);
  }

  // Filter & sort
  let filtered = contracts.filter(c=>{
    if(search && !c.clientName.toLowerCase().includes(search.toLowerCase()) && !c.services?.toLowerCase().includes(search.toLowerCase())) return false;
    if(filterStatus!=="all" && c.status!==filterStatus) return false;
    if(filterType!=="all" && c.type!==filterType) return false;
    return true;
  });
  filtered = [...filtered].sort((a,b)=>{
    if(sortBy==="signDate") return (b.signDate||"").localeCompare(a.signDate||"");
    if(sortBy==="client") return a.clientName.localeCompare(b.clientName,"he");
    if(sortBy==="value") return (parseFloat(b.monthlyValue)||0)-(parseFloat(a.monthlyValue)||0);
    if(sortBy==="expiry") return (a.endDate||"9999").localeCompare(b.endDate||"9999");
    return 0;
  });

  // Stats
  const activeContracts = contracts.filter(c=>c.status==="active");
  const totalMonthly = activeContracts.reduce((s,c)=>s+(parseFloat(c.monthlyValue)||0),0);
  const expiringCount = contracts.filter(c=>{
    const d = getDaysUntilExpiry(c.endDate);
    return d!==null && d<=60 && d>0 && c.status==="active";
  }).length;
  const pendingCount = contracts.filter(c=>c.status==="pending").length;

  const th={padding:"10px 14px",fontWeight:700,fontSize:11,color:"#6b7280",background:"#f9fafb",borderBottom:"1.5px solid #e5e7eb",textAlign:"right"};

  return (
    <div style={{direction:"rtl"}}>

      {/* Modal */}
      {showForm && (
        <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(15,23,42,0.55)",backdropFilter:"blur(4px)"}}
          onClick={e=>{if(e.target===e.currentTarget){setShowForm(false);setEditingContract(null);}}}>
          <div style={{background:"#fff",borderRadius:20,width:"min(760px,95vw)",maxHeight:"90vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.2)",direction:"rtl"}}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid #f1f5f9",background:"linear-gradient(135deg,#1e293b,#0f172a)",borderRadius:"20px 20px 0 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{color:"#f1f5f9",fontSize:17,fontWeight:800}}>
                {editingContract ? "✏️ עריכת חוזה" : "📄 חוזה חדש"}
              </div>
              <button onClick={()=>{setShowForm(false);setEditingContract(null);}}
                style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#f1f5f9",borderRadius:9999,width:32,height:32,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{padding:"24px"}}>
              <ContractForm
                contract={editingContract || newContract()}
                onSave={saveContract}
                onCancel={()=>{setShowForm(false);setEditingContract(null);}}
                clientNames={clientNames}/>
            </div>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="rsp-kpi-4" style={{marginBottom:18}}>
        {[
          {l:"חוזים פעילים",    v:String(activeContracts.length),      c:"#10b981", bg:"#f0fdf4", icon:"✅"},
          {l:"הכנסה חודשית",    v:"₪"+Math.round(totalMonthly).toLocaleString("he-IL"), c:"#6366f1", bg:"#eef2ff", icon:"💰"},
          {l:"עומדים לפוג (60י׳)", v:String(expiringCount),            c:"#b45309", bg:"#fef3c7", icon:"⏰"},
          {l:"ממתינים לחתימה",  v:String(pendingCount),                 c:"#7c3aed", bg:"#ede9fe", icon:"✍️"},
        ].map(k=>(
          <div key={k.l} style={{background:k.bg,borderRadius:12,padding:"14px 16px",border:`1.5px solid ${k.c}22`}}>
            <div style={{fontSize:11,color:k.c,fontWeight:700,marginBottom:4}}>{k.icon} {k.l}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{background:"#fff",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 חפש לקוח או שירות..."
          dir="rtl" style={{flex:"1 1 160px",minWidth:140,border:"1.5px solid #e5e7eb",borderRadius:8,padding:"6px 10px",fontSize:13,fontFamily:"inherit",background:"#f9fafb"}}/>

        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {[{k:"all",l:"הכל"},...CONTRACT_STATUS_OPTIONS.map(s=>({k:s.value,l:s.label}))].map(s=>(
            <button key={s.k} onClick={()=>setFilterStatus(s.k)}
              style={{padding:"5px 11px",borderRadius:7,border:"1.5px solid",borderColor:filterStatus===s.k?"#6366f1":"#e5e7eb",background:filterStatus===s.k?"#6366f1":"#fff",color:filterStatus===s.k?"#fff":"#374151",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              {s.l}
            </button>
          ))}
        </div>

        <select value={filterType} onChange={e=>setFilterType(e.target.value)}
          style={{border:"1.5px solid #e5e7eb",borderRadius:8,padding:"6px 10px",fontSize:12,fontFamily:"inherit",background:"#f9fafb",cursor:"pointer"}}>
          <option value="all">כל הסוגים</option>
          {CONTRACT_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <span style={{fontSize:11,color:"#6b7280"}}>מיין:</span>
          {[{k:"signDate",l:"תאריך"},{k:"client",l:"לקוח"},{k:"value",l:"שווי"},{k:"expiry",l:"פקיעה"}].map(s=>(
            <button key={s.k} onClick={()=>setSortBy(s.k)}
              style={{padding:"5px 10px",borderRadius:7,border:"1.5px solid",borderColor:sortBy===s.k?"#6366f1":"#e5e7eb",background:sortBy===s.k?"#6366f1":"#fff",color:sortBy===s.k?"#fff":"#374151",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              {s.l}
            </button>
          ))}
        </div>

        <button onClick={startNew}
          style={{marginRight:"auto",padding:"8px 18px",borderRadius:9,border:"none",background:"#6366f1",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
          + חוזה חדש
        </button>
        <span style={{fontSize:12,color:"#6b7280"}}>{filtered.length} חוזים</span>
      </div>

      {/* Empty state */}
      {filtered.length===0 && (
        <div style={{background:"#fff",borderRadius:16,padding:"60px 40px",textAlign:"center",boxShadow:"0 1px 8px rgba(0,0,0,0.05)"}}>
          <div style={{fontSize:48,marginBottom:12}}>📄</div>
          <div style={{fontWeight:700,fontSize:18,color:"#1f2937",marginBottom:8}}>
            {contracts.length===0 ? "אין חוזים עדיין" : "לא נמצאו תוצאות"}
          </div>
          <div style={{color:"#6b7280",fontSize:14,marginBottom:20}}>
            {contracts.length===0 ? "התחל לתעד הסכמים עם לקוחות" : "נסה לשנות את הסינון"}
          </div>
          {contracts.length===0 && (
            <button onClick={startNew}
              style={{padding:"10px 24px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
              + הוסף חוזה ראשון
            </button>
          )}
        </div>
      )}

      {/* Contracts list */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map(c=>{
          const statusOpt = CONTRACT_STATUS_OPTIONS.find(s=>s.value===c.status)||CONTRACT_STATUS_OPTIONS[0];
          const typeOpt = CONTRACT_TYPES.find(t=>t.value===c.type)||CONTRACT_TYPES[0];
          const daysLeft = getDaysUntilExpiry(c.endDate);
          const isExpiringSoon = daysLeft!==null && daysLeft<=60 && daysLeft>0 && c.status==="active";
          const isExpanded = expandedId===c.id;

          // Compute contract duration label
          let durationLabel = "";
          if(c.startDate && c.endDate) {
            const months = Math.round((new Date(c.endDate)-new Date(c.startDate))/(1000*60*60*24*30.4));
            durationLabel = months > 0 ? `${months} חודשים` : "";
          }

          return (
            <div key={c.id} style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 8px rgba(0,0,0,0.06)",border:`1.5px solid ${isExpiringSoon?"#fcd34d":"#f1f5f9"}`}}>
              {/* Row header */}
              <div style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",cursor:"pointer"}}
                onClick={()=>setExpandedId(isExpanded ? null : c.id)}>

                {/* Status dot */}
                <div style={{width:10,height:10,borderRadius:"50%",background:statusOpt.color,flexShrink:0}}/>

                {/* Client + type */}
                <div style={{flex:"1 1 160px",minWidth:0}}>
                  <div style={{fontWeight:800,fontSize:15,color:"#1f2937",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.clientName||"—"}</div>
                  <div style={{fontSize:11,color:"#6b7280",marginTop:2,display:"flex",gap:6,flexWrap:"wrap"}}>
                    <span style={{background:`${statusOpt.color}18`,color:statusOpt.color,borderRadius:4,padding:"1px 6px",fontWeight:700}}>{statusOpt.label}</span>
                    <span style={{background:"#f1f5f9",color:"#6b7280",borderRadius:4,padding:"1px 6px"}}>{typeOpt.label}</span>
                    {c.autoRenew && <span style={{background:"#eff6ff",color:"#2563eb",borderRadius:4,padding:"1px 6px",fontWeight:600}}>🔄 חידוש אוטומטי</span>}
                  </div>
                </div>

                {/* Dates */}
                <div style={{fontSize:12,color:"#6b7280",textAlign:"center",minWidth:80}}>
                  {c.startDate && <div style={{fontWeight:600,color:"#374151"}}>{c.startDate}</div>}
                  {c.endDate && (
                    <div style={{color:isExpiringSoon?"#b45309":"#6b7280",fontWeight:isExpiringSoon?700:400}}>
                      → {c.endDate}
                      {isExpiringSoon && <span style={{marginRight:4,fontSize:10}}>⏰ {daysLeft} י׳</span>}
                    </div>
                  )}
                  {durationLabel && <div style={{fontSize:10,color:"#9ca3af"}}>{durationLabel}</div>}
                </div>

                {/* Values */}
                <div style={{textAlign:"left",minWidth:100}}>
                  {c.monthlyValue && <div style={{fontWeight:800,fontSize:16,color:"#6366f1"}}>₪{Math.round(parseFloat(c.monthlyValue)).toLocaleString("he-IL")}<span style={{fontSize:10,color:"#9ca3af",fontWeight:400}}>/חודש</span></div>}
                  {c.totalValue && <div style={{fontSize:11,color:"#6b7280"}}>סה״כ ₪{Math.round(parseFloat(c.totalValue)).toLocaleString("he-IL")}</div>}
                </div>

                {/* Notice days */}
                {c.noticeDays && (
                  <div style={{fontSize:11,color:"#6b7280",textAlign:"center",minWidth:60}}>
                    <div style={{fontWeight:700,color:"#374151"}}>{c.noticeDays} יום</div>
                    <div>הודעה</div>
                  </div>
                )}

                {/* Actions */}
                <div style={{display:"flex",gap:6,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>startEdit(c)}
                    style={{padding:"5px 12px",borderRadius:7,border:"1.5px solid #e5e7eb",background:"#f9fafb",color:"#374151",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                    ✏️ עריכה
                  </button>
                  <button onClick={()=>deleteContract(c.id)}
                    style={{padding:"5px 10px",borderRadius:7,border:"1.5px solid #fecaca",background:"#fef2f2",color:"#dc2626",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                    🗑
                  </button>
                  <span style={{color:"#9ca3af",fontSize:14,alignSelf:"center",cursor:"pointer"}}>{isExpanded?"▲":"▼"}</span>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div style={{padding:"0 18px 18px",borderTop:"1px solid #f8fafc"}}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14,marginTop:14}}>
                    {c.paymentTerms && (
                      <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px"}}>
                        <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>💳 תנאי תשלום</div>
                        <div style={{fontSize:13,fontWeight:600,color:"#1f2937"}}>{c.paymentTerms}</div>
                      </div>
                    )}
                    {c.signDate && (
                      <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px"}}>
                        <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>✍️ תאריך חתימה</div>
                        <div style={{fontSize:13,fontWeight:600,color:"#1f2937"}}>{c.signDate}</div>
                      </div>
                    )}
                    {c.services && (
                      <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px",gridColumn:"1 / -1"}}>
                        <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:6}}>🛠 שירותים / היקף עבודה</div>
                        <div style={{fontSize:13,color:"#374151",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{c.services}</div>
                      </div>
                    )}
                    {c.notes && (
                      <div style={{background:"#fefce8",borderRadius:10,padding:"12px 14px",border:"1px solid #fde68a",gridColumn:"1 / -1"}}>
                        <div style={{fontSize:10,color:"#92400e",fontWeight:700,marginBottom:6}}>📝 הערות ותנאים מיוחדים</div>
                        <div style={{fontSize:13,color:"#78350f",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{c.notes}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===================== MAIN APP =====================
export default function App() {
  const [tab, setTab] = useState("month");
  const [selYear, setSelYear] = useState(2025);
  const [selMonth, setSelMonth] = useState(0);
  const [allYears, setAllYears] = useState(()=>({ 2025: build2025(), 2026: build2026() }));
  const [nameAliases, setNameAliases] = useState({});
  const [contracts, setContracts] = useState([]);
  const [goals, setGoals] = useState({}); // { "2026-1": { incomeGoal: 150000, profitGoal: 30000 } }
  const [clientProfiles, setClientProfiles] = useState({}); // { "clientName": { phone, email, contact, notes, createdAt } }
  const [dbLoaded, setDbLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [undoToast, setUndoToast] = useState(null);
  const [confirm, confirmDialog] = useConfirm();

  useEffect(()=>{
    dbLoad().then(saved=>{
      if(saved?.allYears) setAllYears(saved.allYears);
      if(saved?.nameAliases) setNameAliases(saved.nameAliases);
      if(saved?.contracts) setContracts(saved.contracts);
      if(saved?.goals) setGoals(saved.goals);
      if(saved?.clientProfiles) setClientProfiles(saved.clientProfiles);
      setDbLoaded(true);
    }).catch(()=>setDbLoaded(true));
  }, []);

  useEffect(()=>{
    if(!dbLoaded) return;
    const interval = setInterval(()=>{
      if(saving) return;
      dbLoad().then(saved=>{
        if(saved?.allYears) setAllYears(saved.allYears);
        if(saved?.nameAliases) setNameAliases(saved.nameAliases);
        if(saved?.contracts) setContracts(saved.contracts);
        if(saved?.goals) setGoals(saved.goals);
        if(saved?.clientProfiles) setClientProfiles(saved.clientProfiles);
      }).catch(()=>{});
    }, 30000);
    return ()=>clearInterval(interval);
  }, [dbLoaded, saving]);

  useEffect(()=>{
    if(!dbLoaded) return;
    setSaving(true);
    const t = setTimeout(()=>{
      dbSave({ allYears, nameAliases, contracts, goals, clientProfiles }).then(()=>{
        setSaving(false);
        setLastSaved(new Date().toLocaleTimeString("he-IL"));
      });
    }, 2000);
    return ()=>clearTimeout(t);
  }, [allYears, nameAliases, contracts, goals, clientProfiles, dbLoaded]);

  const years = Object.keys(allYears).map(Number).sort();

  function saveSnapshot(label) {
    const snapshot = JSON.parse(JSON.stringify(allYears));
    setUndoStack(s=>[{snapshot,label},...s].slice(0,20));
    setUndoToast({label});
  }
  function performUndo() {
    setUndoStack(s=>{
      if(s.length===0) return s;
      setAllYears(s[0].snapshot);
      return s.slice(1);
    });
    setUndoToast(null);
  }

  function mergeClientNames(fromNames, toName) {
    setAllYears(ay=>{
      const nd = JSON.parse(JSON.stringify(ay));
      Object.values(nd).forEach(ms=>ms.forEach(m=>{
        INCOME_CATEGORIES.forEach(cat=>{ m.income[cat.key].forEach(e=>{ if(fromNames.includes((e.name||'').trim())) e.name = toName; }); });
        EXPENSE_CATEGORIES.forEach(cat=>{ m.expenses[cat.key].forEach(e=>{ if(fromNames.includes((e.name||'').trim())) e.name = toName; }); });
      }));
      return nd;
    });
  }

  function importCSV(text) {
    const lines = text.trim().split("\n").filter(l=>l.trim());
    if(lines.length < 2) return alert("הקובץ ריק או לא תקין");
    const rows = lines.slice(1);
    let imported = 0, errors = 0;
    const newYears = JSON.parse(JSON.stringify(allYears));
    rows.forEach(line=>{
      const sep = line.includes(";") ? ";" : ",";
      const cols = line.split(sep).map(c=>c.trim().replace(/^"|"$/g,""));
      const [yr, mo, type, cat, name, amount, status] = cols;
      const year = parseInt(yr);
      const month = parseInt(mo) - 1;
      const net = parseFloat(amount?.replace(/[^\d.]/g,""));
      if(!year || isNaN(month) || month<0 || month>11 || !name || isNaN(net)) { errors++; return; }
      if(!newYears[year]) newYears[year] = Array.from({length:12}, initMonth);
      const isIncome = type?.includes("הכנסה") || type?.toLowerCase().includes("income");
      const isExpense = type?.includes("הוצאה") || type?.toLowerCase().includes("expense");
      const catMap = {"ריטיינר":"retainers","שותפויות":"partnerships","משתנה":"variable","חד פעמי":"onetime","אפיליאציה":"affiliate","קבועות":"fixed","משתנות":"variable","retainers":"retainers","partnerships":"partnerships","onetime":"onetime","affiliate":"affiliate","fixed":"fixed"};
      const catKey = catMap[cat?.trim()] || "variable";
      const statusMap = {"שולם":"paid","ממתין":"pending","נשלחה חשבונית":"pending","תישלח חשבונית":"invoice","לא שולם":"unpaid","paid":"paid","pending":"pending","invoice":"invoice","unpaid":"unpaid"};
      const entryStatus = statusMap[status?.trim()] || "paid";
      const entry = newEntry(name, String(net), entryStatus);
      if(isIncome) newYears[year][month].income[catKey].push(entry);
      else if(isExpense) newYears[year][month].expenses[catKey].push(entry);
      else { errors++; return; }
      imported++;
    });
    setAllYears(newYears);
    alert(`✅ יובאו ${imported} רשומות${errors ? `\n⚠️ ${errors} שורות דולגו` : ""}`);
  }

  function setMonthData(year, mi, upd) {
    setAllYears(ay=>{const ms=[...ay[year]];ms[mi]=typeof upd==="function"?upd(ms[mi]):upd;return{...ay,[year]:ms};});
  }
  function updateEntry(year, mi, entryId, updFn) {
    setAllYears(ay=>{
      const nd = JSON.parse(JSON.stringify(ay));
      const m = nd[year][mi];
      [...INCOME_CATEGORIES,...EXPENSE_CATEGORIES].forEach(cat=>{
        const sec = INCOME_CATEGORIES.includes(cat)?"income":"expenses";
        const arr = m[sec][cat.key];
        const idx = arr.findIndex(e=>e.id===entryId);
        if(idx>=0) arr[idx] = updFn(arr[idx]);
      });
      return nd;
    });
  }
  function addYear() {
    const ny = Math.max(...Object.keys(allYears).map(Number))+1;
    setAllYears(ay=>({...ay,[ny]:Array.from({length:12},initMonth)}));
    setSelYear(ny);
  }

  const alerts = [];
  Object.entries(allYears).forEach(([yr,ms])=>ms.forEach((m,mi)=>[...INCOME_CATEGORIES,...EXPENSE_CATEGORIES].forEach(cat=>{
    const sec = INCOME_CATEGORIES.includes(cat)?"income":"expenses";
    m[sec][cat.key].forEach(e=>{if(e.status==="unpaid"&&e.name&&e.net) alerts.push({yr,mi,name:e.name,net:e.net,cat:cat.label});});
  })));

  // Build client index — FIX: skip entries with net=0 to prevent ghost duplicates
  const clientMap = {};
  Object.entries(allYears).forEach(([yr,ms])=>{
    ms.forEach((m,mi)=>{
      INCOME_CATEGORIES.forEach(cat=>{
        m.income[cat.key].forEach(e=>{
          const name = (e.name||'').trim();
          const net = parseFloat(e.net)||0;
          if(!name || net===0) return; // FIX: skip empty/zero entries
          if(!clientMap[name]) clientMap[name]={
            name, months:[], totalNet:0, cats:{},
            firstSeen:{yr:Number(yr),mi} // for seniority sort
          };
          clientMap[name].months.push({yr:Number(yr),mi,cat:cat.label,catKey:cat.key,net,status:e.status,entryId:e.id});
          clientMap[name].totalNet += net;
          clientMap[name].cats[cat.key]=(clientMap[name].cats[cat.key]||0)+net;
          // update firstSeen to earliest appearance
          const cur = clientMap[name].firstSeen;
          if(Number(yr)<cur.yr || (Number(yr)===cur.yr && mi<cur.mi)) {
            clientMap[name].firstSeen = {yr:Number(yr),mi};
          }
        });
      });
    });
  });
  const clientList = Object.values(clientMap).sort((a,b)=>b.totalNet-a.totalNet);
  const unpaidCount = Object.values(allYears).flatMap(ms=>ms.flatMap(m=>[...INCOME_CATEGORIES,...EXPENSE_CATEGORIES].flatMap(cat=>m[INCOME_CATEGORIES.includes(cat)?"income":"expenses"][cat.key]))).filter(e=>e.status==="unpaid"&&e.name&&e.net).length;

  // Add income entry directly from client card → updates the monthly board
  function addIncomeForClient(clientName, year, month, catKey, net, status) {
    setAllYears(ay=>{
      const nd = JSON.parse(JSON.stringify(ay));
      if(!nd[year]) nd[year] = Array.from({length:12}, initMonth);
      const entry = newEntry(clientName, String(net), status);
      nd[year][month].income[catKey].push(entry);
      return nd;
    });
  }

  const TABS = [
    {k:"month",    l:"חודשי"},
    {k:"year",     l:"סיכום שנתי"},
    {k:"multi",    l:"השוואה שנתית"},
    {k:"expenses", l:"ניתוח הוצאות 🔍"},
    {k:"ar",       l:`תגבייה${unpaidCount?` 🔴${unpaidCount}`:""}`},
    {k:"clients",  l:"לקוחות 👥"},
    {k:"contracts",l:"חוזים 📄"},
    {k:"alerts",   l:`התראות${alerts.length?` (${alerts.length})`:""}`},
  ];

  injectCSS();

  if(!dbLoaded) return (
    <div style={{minHeight:"100vh",background:"#fff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,fontFamily:"'Heebo',sans-serif"}}>
      <div style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#22c55e)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
        <span style={{color:"#fff",fontSize:20,fontWeight:900}}>e.</span>
      </div>
      <div style={{color:"#0f0a1e",fontSize:20,fontWeight:800,letterSpacing:"-0.3px"}}>ecommon.</div>
      <div style={{color:"#a855f7",fontSize:13,fontWeight:500}}>טוען נתונים...</div>
      <div style={{width:36,height:36,border:"3px solid #ede9fe",borderTopColor:"#7c3aed",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--ec-bg)",fontFamily:"'Heebo',sans-serif",direction:"rtl"}}>
      {confirmDialog}
      {undoToast && <UndoToast action={`בוטל: ${undoToast.label}`} onUndo={performUndo} onDismiss={()=>setUndoToast(null)}/>}

      {/* ═══ HEADER ═══════════════════════════════════════════════ */}
      <div style={{background:"#fff",borderBottom:"1.5px solid #ede9fe",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 12px rgba(124,58,237,0.06)"}}>

        {/* Top bar */}
        <div className="header-pad" style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:56,gap:12}}>

          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#22c55e)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{color:"#fff",fontSize:13,fontWeight:900,letterSpacing:"-0.5px"}}>e.</span>
            </div>
            <div className="hide-mobile">
              <div style={{fontSize:15,fontWeight:800,color:"#0f0a1e",letterSpacing:"-0.3px",lineHeight:1}}>ecommon.</div>
              <div style={{fontSize:10,color:"#a855f7",fontWeight:600,letterSpacing:"0.05em",marginTop:1}}>מעקב פיננסי</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            {saving ? (
              <div style={{background:"#fef3c7",borderRadius:20,padding:"4px 12px",color:"#92400e",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                <span style={{animation:"spin 0.8s linear infinite",display:"inline-block"}}>⏳</span> שומר...
              </div>
            ) : lastSaved ? (
              <div style={{background:"#f0fdf4",borderRadius:20,padding:"4px 12px",color:"#16a34a",fontSize:11,fontWeight:700,border:"1px solid #bbf7d0"}}>✓ נשמר {lastSaved}</div>
            ) : null}

            {undoStack.length > 0 && (
              <button onClick={performUndo} style={{background:"#f5f3ff",border:"1.5px solid #ede9fe",color:"#7c3aed",borderRadius:8,padding:"5px 11px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                ↩ בטל ({undoStack.length})
              </button>
            )}

            {alerts.length>0 && (
              <div style={{background:"#fee2e2",borderRadius:20,padding:"4px 12px",color:"#dc2626",fontSize:11,fontWeight:700,border:"1px solid #fecaca"}}>⚠️ {alerts.length}</div>
            )}

            <button onClick={addYear} className="ec-btn-ghost" style={{fontSize:12,padding:"5px 12px"}}>+ שנה</button>

            <label className="ec-btn-primary" style={{fontSize:12,padding:"6px 14px",display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}>
              <span>📥</span>
              <span className="hide-mobile">ייבוא CSV</span>
              <input type="file" accept=".csv,.txt" style={{display:"none"}} onChange={e=>{
                const file = e.target.files[0]; if(!file) return;
                const reader = new FileReader();
                reader.onload = ev => importCSV(ev.target.result);
                reader.readAsText(file, "UTF-8");
                e.target.value = "";
              }}/>
            </label>

            <button onClick={async()=>{
              const ok = await confirm({title:"איפוס כל הנתונים",message:"פעולה זו תמחק את כל הנתונים לצמיתות.",confirmLabel:"מחק הכל",confirmColor:"#ef4444"});
              if(ok){localStorage.clear();window.location.reload();}
            }} style={{background:"#f8f7ff",border:"1.5px solid #e5e7eb",color:"#6b7280",borderRadius:8,padding:"5px 11px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>↺</button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="tab-bar" style={{background:"#fff",borderTop:"1px solid #f3f0ff"}}>
          {TABS.map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} className={`tab-btn${tab===t.k?" active":""}`}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ CONTENT ═══════════════════════════════════════════ */}
      <div className="page-pad" style={{maxWidth:1600,margin:"0 auto"}}>

        {/* Year / Month selectors */}
        {(tab==="month"||tab==="year") && (
          <div style={{marginBottom:16,background:"#fff",borderRadius:12,padding:"12px 16px",border:"1.5px solid #ede9fe",boxShadow:"0 1px 6px rgba(124,58,237,0.04)"}}>
            <div style={{display:"flex",gap:6,marginBottom:tab==="month"?10:0,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:12,color:"#2563eb",fontWeight:700}}>שנה:</span>
              {years.map(y=>(
                <button key={y} onClick={()=>setSelYear(y)}
                  style={{padding:"4px 14px",borderRadius:20,border:"1.5px solid",borderColor:selYear===y?"#2563eb":"#e5e7eb",background:selYear===y?"#2563eb":"#fff",color:selYear===y?"#fff":"#374151",fontWeight:selYear===y?700:500,fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
                  {y}
                </button>
              ))}
            </div>
            {tab==="month" && (
              <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:12,color:"#2563eb",fontWeight:700}}>חודש:</span>
                {MONTHS_HE.map((name,i)=>(
                  <button key={i} onClick={()=>setSelMonth(i)}
                    style={{padding:"4px 10px",borderRadius:20,border:"1.5px solid",borderColor:selMonth===i?"#2563eb":"#e5e7eb",background:selMonth===i?"#2563eb":"#fff",color:selMonth===i?"#fff":"#374151",fontWeight:selMonth===i?700:500,fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab==="month" && (
          <MonthView
            data={allYears[selYear][selMonth]}
            setData={u=>setMonthData(selYear,selMonth,u)}
            allYears={allYears}
            setAllYears={setAllYears}
            currentYear={selYear}
            currentMonth={selMonth}
            onConfirm={confirm}
            onSaveSnapshot={saveSnapshot}
            goals={goals}
            setGoals={setGoals}
          />
        )}
        {tab==="year" && <YearSummary months={allYears[selYear]} year={selYear} goals={goals} setGoals={setGoals}/>}
        {tab==="multi" && <MultiYear allYears={allYears}/>}
        {tab==="expenses" && <ExpenseAnalysis allYears={allYears}/>}
        {tab==="ar" && <ARView allYears={allYears} onUpdateEntry={updateEntry}/>}
        {tab==="clients" && (
          <ClientView
            clientList={clientList}
            allYears={allYears}
            onMerge={mergeClientNames}
            clientProfiles={clientProfiles}
            setClientProfiles={setClientProfiles}
            contracts={contracts}
            onAddIncome={addIncomeForClient}
            years={years}
          />
        )}
        {tab==="contracts" && <ContractsView contracts={contracts} setContracts={setContracts} clientList={clientList}/>}
        {tab==="alerts" && (
          <div>
            <div style={{fontWeight:800,fontSize:20,marginBottom:16,color:"#0f0a1e",letterSpacing:"-0.3px"}}>⚠️ פריטים לא שולמו</div>
            {alerts.length===0 ? (
              <div style={{background:"#fff",borderRadius:14,padding:48,textAlign:"center",color:"#6b7280",fontSize:16,border:"1.5px solid #ede9fe"}}>
                <div style={{fontSize:32,marginBottom:8}}>✅</div>
                <div style={{fontWeight:700,color:"#22c55e"}}>אין פריטים שלא שולמו</div>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {alerts.map((a,i)=>(
                  <div key={i} style={{background:"#fff",borderRadius:12,padding:"14px 18px",boxShadow:"0 1px 6px rgba(124,58,237,0.06)",borderRight:"4px solid #ef4444",display:"flex",alignItems:"center",justifyContent:"space-between",border:"1.5px solid #fecaca",borderRightWidth:4}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:"#0f0a1e"}}>{a.name}</div>
                      <div style={{color:"#6b7280",fontSize:11,marginTop:2}}>{a.yr} · {MONTHS_HE[a.mi]} · {a.cat}</div>
                    </div>
                    <div style={{fontWeight:800,color:"#ef4444",fontSize:18}}>{fmt(parseFloat(a.net))}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

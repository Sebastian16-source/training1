"use strict";

// ================= Geräte, Ziele, Erfahrung =================

// Kraftgeräte. In einer Übung heißt ["a", "b"]: beides nötig, [["a", "b"]]: eins von beiden reicht.
const GERAETE = {
  lh: "Langhantel (freie Stange) & Rack",
  smith: "Multipresse (Smith-Maschine)",
  kh: "Kurzhanteln",
  bank: "Hantelbank (verstellbar)",
  latzug: "Latzug / Rudermaschine",
  kabel: "Kabelzug / Seilzugturm",
  beinpresse: "Beinpresse",
  bauch: "Bauchmaschine",
  maschine: "Weitere Geräte (Brustpresse, Butterfly, Beinbeuger, Beinstrecker …)",
  stange: "Klimmzugstange",
  barren: "Dipbarren",
};
// Ausdauergeräte – zum Aufwärmen und für Cardio nach dem Krafttraining
const CARDIO = {
  laufband: { name: "Laufband", bild: "Jogging_Treadmill", tipp: "Zügig gehen oder locker joggen, 1–3 % Steigung." },
  crosstrainer: { name: "Crosstrainer", bild: "Elliptical_Trainer", tipp: "Gelenkschonend, Arme aktiv mitnehmen." },
  ergometer: { name: "Fahrrad-Ergometer", bild: "Bicycling_Stationary", tipp: "Sattel so hoch, dass das Knie unten fast gestreckt ist." },
  rudergeraet: { name: "Rudergerät", bild: "Rowing_Stationary", tipp: "Erst Beine, dann Oberkörper, zuletzt Arme." },
  // Draußen – brauchen kein Gerät
  joggen: { name: "Joggen", bild: "Trail_Running_Walking", tipp: "Locker, du solltest dich noch unterhalten können.", immer: true, pace: true },
  radfahren: { name: "Radfahren", bild: "Bicycling", tipp: "Gleichmäßig treten, Hügel locker nehmen.", immer: true },
};
const CARDIO_OPTIONEN = {
  separat: { name: "Ausdauer an eigenen Tagen", text: "Z. B. Joggen oder Radfahren draußen. Im Studio nur 5 Min. Aufwärmen" },
  danach: { name: "Ausdauer nach dem Krafttraining", text: "5 Min. Aufwärmen, 20 Min. Ausdauer am Ende" },
  aufwaermen: { name: "Nur zum Aufwärmen", text: "5 Min. locker vor dem Krafttraining" },
  nein: { name: "Kein Cardio", text: "" },
};
const CARDIO_MINUTEN = { aufwaermen: 5, ausdauer: 20, einzeln: 30 };

// ================= Muskelgruppen & Wochenvolumen =================
// Für einen ausgewogenen, natürlich wirkenden Muskelaufbau soll jede Gruppe genug Sätze pro Woche bekommen.
// Richtwert aus der Forschung: etwa 10–20 harte Sätze pro Muskel und Woche (Einsteiger kommen mit weniger aus).
// muster: womit der Plan eine Gruppe auffüllt, wenn sie zu kurz kommt. min: Anteil der Untergrenze.
const GRUPPEN = {
  brust: { name: "Brust", muster: ["druecken_h", "druecken_schraeg", "brust_iso"] },
  ruecken: { name: "Rücken", muster: ["ziehen_h", "ziehen_v"] },
  schulter_seite: { name: "Seitliche Schulter", muster: ["seitheben"] },
  schulter_hinten: { name: "Hintere Schulter", muster: ["hintere_schulter"] },
  bizeps: { name: "Bizeps", muster: ["bizeps"] },
  trizeps: { name: "Trizeps", muster: ["trizeps"] },
  beine_vorne: { name: "Vorderer Oberschenkel", muster: ["kniebeuge", "einbeinig", "beinstrecker"] },
  beinrueckseite: { name: "Beinrückseite", muster: ["beinbeuger", "huefte"] },
  gesaess: { name: "Gesäß", muster: ["huefte", "einbeinig"] },
  waden: { name: "Waden", muster: ["waden"], min: 0.75 },
  bauch: { name: "Bauch", muster: ["core"], min: 0.5 },
};
const VOLUMEN = { anfaenger: [6, 12], fortgeschritten: [10, 18], erfahren: [12, 22] };

// Welche Gruppen eine Übung trainiert: 1 = Hauptmuskel, .5 = arbeitet mit (zählt als halber Satz)
const MUSKELN_ROH = {
  "Barbell_Squat Leg_Press Smith_Machine_Squat Hack_Squat Goblet_Squat Dumbbell_Squat Front_Barbell_Squat Bodyweight_Squat": "beine_vorne 1, gesaess .5",
  "Dumbbell_Lunges Dumbbell_Step_Ups Dumbbell_Rear_Lunge Bodyweight_Walking_Lunge": "beine_vorne 1, gesaess .5",
  "Romanian_Deadlift Smith_Machine_Stiff-Legged_Deadlift Stiff-Legged_Dumbbell_Deadlift": "beinrueckseite 1, gesaess .5",
  "Barbell_Deadlift": "beinrueckseite .5, gesaess .5, beine_vorne .5, ruecken .5",
  "Barbell_Hip_Thrust Pull_Through Single_Leg_Glute_Bridge Butt_Lift_Bridge": "gesaess 1, beinrueckseite .5",
  "Hyperextensions_Back_Extensions": "beinrueckseite .5, gesaess .5",
  "Superman": "gesaess .5",
  "Lying_Leg_Curls Seated_Leg_Curl": "beinrueckseite 1",
  "Leg_Extensions": "beine_vorne 1",
  "Standing_Calf_Raises Seated_Calf_Raise Calf_Press_On_The_Leg_Press_Machine Smith_Machine_Calf_Raise Standing_Dumbbell_Calf_Raise": "waden 1",
  "Barbell_Bench_Press_-_Medium_Grip Smith_Machine_Bench_Press Dumbbell_Bench_Press Leverage_Chest_Press Standing_Cable_Chest_Press Dumbbell_Floor_Press Pushups": "brust 1, trizeps .5",
  "Incline_Dumbbell_Press Barbell_Incline_Bench_Press_-_Medium_Grip Smith_Machine_Incline_Bench_Press Leverage_Incline_Chest_Press Decline_Push-Up": "brust 1, trizeps .5",
  "Seated_Dumbbell_Press Standing_Military_Press Smith_Machine_Overhead_Shoulder_Press Machine_Shoulder_Military_Press Dumbbell_Shoulder_Press Arnold_Dumbbell_Press Handstand_Push-Ups": "schulter_seite .5, trizeps .5",
  "Side_Lateral_Raise Standing_Low-Pulley_Deltoid_Raise Seated_Side_Lateral_Raise": "schulter_seite 1",
  "Face_Pull": "schulter_hinten 1, ruecken .5",
  "Reverse_Machine_Flyes Cable_Rear_Delt_Fly Reverse_Flyes": "schulter_hinten 1",
  "Butterfly Cable_Crossover Low_Cable_Crossover Dumbbell_Flyes": "brust 1",
  "Wide-Grip_Lat_Pulldown Close-Grip_Front_Lat_Pulldown Pullups Chin-Up": "ruecken 1, bizeps .5",
  "Straight-Arm_Pulldown": "ruecken 1",
  "One_Arm_Lat_Pulldown": "ruecken 1, bizeps .5",
  "Bent-Arm_Dumbbell_Pullover": "ruecken 1, brust .5",
  "Incline_Dumbbell_Curl": "bizeps 1",
  "Incline_Cable_Flye": "brust 1",
  "Smith_Machine_Close-Grip_Bench_Press": "trizeps 1, brust .5",
  "Seated_Cable_Rows Bent_Over_Barbell_Row One-Arm_Dumbbell_Row Smith_Machine_Bent_Over_Row Leverage_Iso_Row Dumbbell_Incline_Row Bent_Over_Two-Dumbbell_Row Inverted_Row": "ruecken 1, bizeps .5, schulter_hinten .5",
  "Barbell_Curl Dumbbell_Bicep_Curl Hammer_Curls Standing_Biceps_Cable_Curl Cable_Hammer_Curls_-_Rope_Attachment Preacher_Curl": "bizeps 1",
  "Triceps_Pushdown Cable_Rope_Overhead_Triceps_Extension Lying_Triceps_Press Standing_Dumbbell_Triceps_Extension Tricep_Dumbbell_Kickback Bench_Dips": "trizeps 1",
  "Dips_-_Triceps_Version": "trizeps 1, brust .5",
  "Plank Side_Bridge Dead_Bug Cable_Crunch Ab_Crunch_Machine Hanging_Leg_Raise Pallof_Press Standing_Cable_Wood_Chop Reverse_Crunch": "bauch 1",
};
const MUSKELN = {};
for (const [ids, text] of Object.entries(MUSKELN_ROH)) {
  const gruppen = Object.fromEntries(text.split(",").map((t) => { const [g, f] = t.trim().split(" "); return [g, +f]; }));
  for (const id of ids.split(" ")) MUSKELN[id] = gruppen;
}

const GERAETE_VORLAGEN = {
  // Dein Studio: Precor-Geräte, Kurzhanteln, FTS Glide (Kabelzug) – keine Langhantel
  meins: ["smith", "kh", "bank", "latzug", "kabel", "beinpresse", "bauch", "stange", "laufband", "crosstrainer", "ergometer"],
  studio: [...Object.keys(GERAETE), ...Object.keys(CARDIO)].filter((k) => !CARDIO[k]?.immer),
  zuhause: ["kh", "bank", "stange"],
  koerper: [],
};

// Wiederholungsbereiche und Pausen je Ziel – Verbundübungen (mehrere Gelenke) und Isolationsübungen
const ZIELE = {
  kraft: { name: "Kraft", text: "Schwerer, weniger Wiederholungen", verbund: [5, 8], isolation: [8, 12], pause: { verbund: 180, isolation: 120 } },
  muskel: { name: "Muskelaufbau", text: "Ausgewogen, alle Muskelgruppen – für natürliche Proportionen", verbund: [8, 12], isolation: [10, 15], pause: { verbund: 90, isolation: 60 } },
  fit: { name: "Fitter werden", text: "Leichter, mehr Wiederholungen, kurze Pausen", verbund: [10, 15], isolation: [12, 15], pause: { verbund: 75, isolation: 60 } },
};
// Pausen: Längere Pausen bringen nur einen kleinen Vorteil (Singer 2024: große Überschneidung zwischen
// kurzen und langen Pausen). In begrenzter Zeit sind mehr Sätze wichtiger (Pelland 2025).
// Für Maximalkraft bleiben die Pausen länger (Schoenfeld 2016).
const PAUSEN_VORLAGEN = {
  kurz: { name: "Kurz", verbund: 90, isolation: 60 },
  mittel: { name: "Mittel", verbund: 120, isolation: 90 },
  lang: { name: "Lang", verbund: 180, isolation: 120 },
};
// Alle bisherigen Standardwerte: Wer einen davon eingestellt hat, hat die Pausen nie selbst gewählt
const ALTE_PAUSEN = [
  { verbund: 180, isolation: 90 }, { verbund: 120, isolation: 75 }, { verbund: 90, isolation: 60 },
  { verbund: 150, isolation: 90 }, { verbund: 120, isolation: 90 }, { verbund: 90, isolation: 75 }, { verbund: 180, isolation: 120 },
];

// Wiederholungen in Reserve: so viele Wdh. hättest du am Satzende noch geschafft.
// 2–3 bei großen Übungen bringt fast denselben Zuwachs wie Muskelversagen, mit weniger Erholungsbedarf
// und Verletzungsrisiko (ACSM 2026). Bei kleinen Übungen darf es näher ans Versagen gehen.
// ⁠ verhindert einen Zeilenumbruch mitten in "2–3"
const RESERVE = { verbund: "2–⁠3", isolation: "1–⁠2" };

// Übungen ohne Zusatzgewicht steigern Wiederholungen bzw. Sekunden statt Kilo
const BEREICH_KOERPER = { verbund: [8, 12], isolation: [10, 15] };
const BEREICH_SEK = [20, 30];

const ERFAHRUNG = {
  anfaenger: { name: "Anfänger", text: "unter 6 Monate", level: 1, saetze: { verbund: 3, isolation: 2 } },
  fortgeschritten: { name: "Fortgeschritten", text: "6 Monate bis 2 Jahre", level: 2, saetze: { verbund: 3, isolation: 3 } },
  erfahren: { name: "Erfahren", text: "über 2 Jahre", level: 3, saetze: { verbund: 4, isolation: 3 } },
};

const DAUER = { 30: 4, 45: 5, 60: 6, 75: 7 }; // Minuten -> Anzahl Übungen

const BESCHWERDEN = { knie: "Knie", schulter: "Schulter", ruecken: "Unterer Rücken" };

// ================= Übungen =================
// Schlüssel = Ordnername in free-exercise-db (Bilder: bilder/<id>-0.jpg und -1.jpg)
// einheit: "kg" (mit Gewicht), "wdh" (Körpergewicht), "sek" (Halten)
// level: ab welcher Erfahrung die Übung vorgeschlagen wird
// belastet: wird bei diesen Beschwerden nach hinten sortiert

const UEBUNGEN = {
  // ---------- Kniebeuge ----------
  Barbell_Squat: {
    name: "Kniebeuge (Langhantel)", geraete: ["lh"], level: 1, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Oberschenkel, Gesäß", belastet: ["ruecken"],
    tipps: ["Stange auf dem oberen Rücken, nicht auf dem Nacken.", "Füße etwa schulterbreit, Knie zeigen in Richtung Zehen.", "So tief, wie du den Rücken gerade halten kannst – Ziel: Oberschenkel waagerecht.", "Aus der ganzen Fußsohle hochdrücken, Brust bleibt oben."],
  },
  Smith_Machine_Squat: {
    name: "Kniebeuge an der Multipresse", geraete: ["smith"], level: 1, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Oberschenkel, Gesäß",
    tipps: ["Stange auf dem oberen Rücken, Füße etwas vor dem Körper.", "Stange entriegeln, Brust bleibt oben.", "So tief wie mit geradem Rücken möglich, dann hochdrücken.", "Die Führung nimmt dir das Balancieren ab – gut zum sicheren Schwer-Trainieren ohne Partner."],
  },
  Leg_Press: {
    name: "Beinpresse", geraete: ["beinpresse"], level: 1, art: "verbund", einheit: "kg", schritt: 5,
    muskeln: "Oberschenkel, Gesäß",
    tipps: ["Sitz so einstellen, dass die Knie am Start etwa 90° oder etwas mehr gebeugt sind, Rücken fest an der Lehne.", "Füße schulterbreit mittig auf die Platte, Platte nach vorne wegdrücken.", "Knie vorne nicht ganz durchdrücken, langsam zurück – der Po bleibt am Polster."],
  },
  Hack_Squat: {
    name: "Hackenschmidt-Kniebeuge", geraete: ["maschine"], level: 1, art: "verbund", einheit: "kg", schritt: 5,
    muskeln: "Vorderer Oberschenkel, Gesäß", belastet: ["knie"],
    tipps: ["Rücken fest ans Polster, Schultern unter die Pads.", "Kontrolliert tief beugen.", "Über die ganze Fußsohle hochdrücken."],
  },
  Goblet_Squat: {
    name: "Goblet Squat", geraete: ["kh"], level: 1, art: "verbund", einheit: "kg", schritt: 2,
    muskeln: "Oberschenkel, Gesäß, Rumpf",
    tipps: ["Eine Kurzhantel senkrecht vor der Brust halten.", "Zwischen die Knie absetzen, Ellbogen innen an den Knien.", "Oberkörper aufrecht, aus den Fersen hochdrücken."],
  },
  Dumbbell_Squat: {
    name: "Kniebeuge mit Kurzhanteln", geraete: ["kh"], level: 1, art: "verbund", einheit: "kg", schritt: 2,
    muskeln: "Oberschenkel, Gesäß",
    tipps: ["Hanteln seitlich neben dem Körper halten.", "Hüfte nach hinten unten, Rücken gerade.", "Bis die Oberschenkel waagerecht sind, dann hochdrücken."],
  },
  Front_Barbell_Squat: {
    name: "Frontkniebeuge", geraete: ["lh"], level: 3, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Vorderer Oberschenkel, Rumpf", belastet: ["knie"],
    tipps: ["Stange vorne auf den Schultern, Ellbogen hoch.", "Oberkörper bleibt sehr aufrecht.", "Tief beugen, ohne dass die Ellbogen absinken."],
  },
  Bodyweight_Squat: {
    name: "Kniebeuge ohne Gewicht", geraete: [], level: 1, art: "verbund", einheit: "wdh",
    muskeln: "Oberschenkel, Gesäß",
    tipps: ["Arme nach vorne strecken als Gegengewicht.", "Hüfte nach hinten unten, Knie über den Zehen.", "Langsam runter (3 Sek.), zügig hoch. Wird es zu leicht: unten 2 Sek. Pause."],
  },

  // ---------- Einbeinig ----------
  Dumbbell_Lunges: {
    name: "Ausfallschritte mit Kurzhanteln", geraete: ["kh"], level: 1, art: "verbund", einheit: "kg", schritt: 2, jeSeite: true,
    muskeln: "Oberschenkel, Gesäß", belastet: ["knie"],
    tipps: ["Großer Schritt nach vorne, hinteres Knie fast bis zum Boden.", "Vorderes Knie bleibt über dem Fuß.", "Über die vordere Ferse zurückdrücken, Seiten abwechseln."],
  },
  Dumbbell_Step_Ups: {
    name: "Step-ups mit Kurzhanteln", geraete: ["kh", "bank"], level: 1, art: "verbund", einheit: "kg", schritt: 2, jeSeite: true,
    muskeln: "Oberschenkel, Gesäß",
    tipps: ["Ganzen Fuß auf die Bank oder eine stabile Stufe setzen.", "Mit dem oberen Bein hochdrücken, nicht mit dem unteren abstoßen.", "Langsam wieder absteigen."],
  },
  Dumbbell_Rear_Lunge: {
    name: "Ausfallschritt rückwärts", geraete: ["kh"], level: 1, art: "verbund", einheit: "kg", schritt: 2, jeSeite: true,
    muskeln: "Oberschenkel, Gesäß",
    tipps: ["Schritt nach hinten statt nach vorne – schont das Knie.", "Oberkörper aufrecht, hinteres Knie fast bis zum Boden.", "Mit dem vorderen Bein zurück in den Stand drücken."],
  },
  Bodyweight_Walking_Lunge: {
    name: "Ausfallschritte gehend", geraete: [], level: 1, art: "verbund", einheit: "wdh", jeSeite: true,
    muskeln: "Oberschenkel, Gesäß", belastet: ["knie"],
    tipps: ["Abwechselnd große Schritte nach vorne gehen.", "Hinteres Knie fast bis zum Boden.", "Oberkörper aufrecht, Rumpf fest."],
  },

  // ---------- Hüfte & Beinrückseite ----------
  Romanian_Deadlift: {
    name: "Rumänisches Kreuzheben", geraete: ["lh"], level: 1, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Beinrückseite, Gesäß, unterer Rücken",
    tipps: ["Stange nah an den Beinen, Knie leicht gebeugt.", "Hüfte nach hinten schieben, Rücken bleibt gerade.", "Runter, bis die Beinrückseite deutlich zieht (etwa Schienbeinmitte), dann Hüfte nach vorne."],
  },
  Barbell_Deadlift: {
    name: "Kreuzheben", geraete: ["lh"], level: 2, art: "verbund", einheit: "kg", schritt: 5,
    muskeln: "Rücken, Gesäß, Beine", belastet: ["ruecken"],
    tipps: ["Füße hüftbreit, Stange über der Fußmitte.", "Rücken gerade und fest, dann die Stange vom Boden wegdrücken.", "Stange am Körper entlang führen, oben die Hüfte strecken, ohne zurückzulehnen."],
  },
  Barbell_Hip_Thrust: {
    name: "Hip Thrust (Langhantel)", geraete: ["lh", "bank"], level: 1, art: "verbund", einheit: "kg", schritt: 5,
    muskeln: "Gesäß, Beinrückseite",
    tipps: ["Schulterblätter an der Bankkante, Stange mit Polster auf der Hüfte.", "Füße so stellen, dass oben die Schienbeine senkrecht sind.", "Hüfte hochdrücken, oben das Gesäß 1 Sek. anspannen, Kinn zur Brust."],
  },
  "Smith_Machine_Stiff-Legged_Deadlift": {
    name: "Rumänisches Kreuzheben (Multipresse)", geraete: ["smith"], level: 1, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Beinrückseite, Gesäß, unterer Rücken",
    tipps: ["Stange auf Oberschenkelmitte einhängen, schulterbreit greifen.", "Knie leicht gebeugt, Hüfte nach hinten schieben, Rücken gerade.", "Runter, bis die Beinrückseite deutlich zieht, dann Hüfte nach vorne."],
  },
  Pull_Through: {
    name: "Pull Through am Kabel", geraete: ["kabel"], level: 1, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Gesäß, Beinrückseite",
    tipps: ["Seil am unteren Kabel, mit dem Rücken zum Turm, breiter Stand.", "Hüfte nach hinten schieben, Seil zwischen den Beinen durchführen lassen.", "Hüfte kräftig nach vorne strecken, oben das Gesäß anspannen. Die Arme ziehen nicht."],
  },
  "Stiff-Legged_Dumbbell_Deadlift": {
    name: "Rumänisches Kreuzheben (Kurzhanteln)", geraete: ["kh"], level: 1, art: "verbund", einheit: "kg", schritt: 2,
    muskeln: "Beinrückseite, Gesäß",
    tipps: ["Hanteln vor den Oberschenkeln, Knie leicht gebeugt.", "Hüfte nach hinten schieben, Rücken gerade, Hanteln nah an den Beinen.", "Runter, bis die Beinrückseite zieht, dann Hüfte nach vorne."],
  },
  Hyperextensions_Back_Extensions: {
    name: "Rückenstrecker (Hyperextension)", geraete: ["maschine"], level: 1, art: "isolation", einheit: "wdh",
    muskeln: "Unterer Rücken, Gesäß",
    tipps: ["Hüfte liegt knapp vor dem Polster, Füße eingehakt.", "Mit geradem Rücken nach vorne absenken.", "Hoch bis der Körper eine Linie bildet – nicht ins Hohlkreuz. Zu leicht? Scheibe vor die Brust nehmen."],
  },
  Single_Leg_Glute_Bridge: {
    name: "Einbeinige Glute Bridge", geraete: [], level: 1, art: "isolation", einheit: "wdh", jeSeite: true,
    muskeln: "Gesäß, Beinrückseite",
    tipps: ["Rückenlage, ein Fuß aufgestellt, das andere Knie zur Brust.", "Über die Ferse die Hüfte hochdrücken.", "Oben kurz halten, langsam ablegen."],
  },
  Butt_Lift_Bridge: {
    name: "Glute Bridge", geraete: [], level: 1, art: "isolation", einheit: "wdh",
    muskeln: "Gesäß",
    tipps: ["Rückenlage, Knie gebeugt, Füße hüftbreit.", "Über die Fersen die Hüfte hochdrücken, bis Knie, Hüfte und Schultern eine Linie bilden.", "Oben 1–2 Sek. halten."],
  },
  Superman: {
    name: "Superman", geraete: [], level: 1, art: "isolation", einheit: "wdh",
    muskeln: "Unterer Rücken, Gesäß",
    tipps: ["Bauchlage, Arme lang nach vorne.", "Arme, Brust und Beine gleichzeitig leicht anheben.", "2 Sek. halten, langsam ablegen. Blick zum Boden."],
  },

  // ---------- Beinbeuger, Beinstrecker, Waden ----------
  Lying_Leg_Curls: {
    name: "Beinbeuger liegend", geraete: ["maschine"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Beinrückseite",
    tipps: ["Polster knapp über den Fersen.", "Fersen Richtung Po ziehen, Hüfte bleibt auf dem Polster.", "Langsam ablassen."],
  },
  Seated_Leg_Curl: {
    name: "Beinbeuger sitzend", geraete: ["maschine"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Beinrückseite",
    tipps: ["Knie auf Höhe des Drehpunkts, Oberschenkelpolster fest.", "Fersen nach unten hinten ziehen.", "Langsam zurück, nicht abprallen lassen."],
  },
  Leg_Extensions: {
    name: "Beinstrecker", geraete: ["maschine"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Vorderer Oberschenkel", belastet: ["knie"],
    tipps: ["Knie auf Höhe des Drehpunkts der Maschine.", "Beine strecken, oben kurz halten.", "Langsam ablassen, nicht fallen lassen."],
  },
  Standing_Calf_Raises: {
    name: "Wadenheben stehend", geraete: ["maschine"], level: 1, art: "isolation", einheit: "kg", schritt: 5,
    muskeln: "Waden",
    tipps: ["Fußballen auf die Kante, Fersen tief absenken.", "So hoch wie möglich auf die Zehenspitzen, 1 Sek. halten.", "Langsam und ohne zu federn."],
  },
  Seated_Calf_Raise: {
    name: "Wadenheben sitzend", geraete: ["maschine"], level: 1, art: "isolation", einheit: "kg", schritt: 5,
    muskeln: "Waden",
    tipps: ["Polster auf die Oberschenkel knapp über den Knien.", "Fersen tief, dann ganz hoch auf die Ballen.", "Oben kurz halten."],
  },
  Calf_Press_On_The_Leg_Press_Machine: {
    name: "Wadendrücken an der Beinpresse", geraete: ["beinpresse"], level: 1, art: "isolation", einheit: "kg", schritt: 5,
    muskeln: "Waden",
    tipps: ["Nur die Fußballen unten auf die Platte, Beine fast gestreckt.", "Platte mit den Zehen wegdrücken, oben kurz halten.", "Fersen langsam weit zurückkommen lassen. Sicherung nicht lösen, solange die Beine gebeugt sind."],
  },
  Smith_Machine_Calf_Raise: {
    name: "Wadenheben an der Multipresse", geraete: ["smith"], level: 1, art: "isolation", einheit: "kg", schritt: 5,
    muskeln: "Waden",
    tipps: ["Hantelscheibe oder Stufe unter die Stange legen, Ballen auf die Kante.", "Stange auf dem oberen Rücken, Fersen tief absenken.", "Ganz hoch auf die Zehenspitzen, 1 Sek. halten."],
  },
  Standing_Dumbbell_Calf_Raise: {
    name: "Wadenheben mit Kurzhanteln", geraete: ["kh"], level: 1, art: "isolation", einheit: "kg", schritt: 2,
    muskeln: "Waden",
    tipps: ["Hanteln seitlich halten, Ballen auf einer Stufe oder Hantelscheibe.", "Fersen tief absenken, dann ganz hoch.", "Oben 1 Sek. halten."],
  },

  // ---------- Brust drücken ----------
  "Barbell_Bench_Press_-_Medium_Grip": {
    name: "Bankdrücken (Langhantel)", geraete: ["lh", "bank"], level: 1, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Brust, vordere Schulter, Trizeps", belastet: ["schulter"],
    tipps: ["Schulterblätter zusammen und nach unten ziehen, Füße fest am Boden.", "Griff etwas breiter als schulterbreit.", "Stange kontrolliert zur unteren Brust senken, Ellbogen etwa 45° vom Körper.", "Mit Sicherheitsablage oder Partner trainieren."],
  },
  Smith_Machine_Bench_Press: {
    name: "Bankdrücken an der Multipresse", geraete: ["smith", "bank"], level: 1, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Brust, vordere Schulter, Trizeps",
    tipps: ["Flachbank so unter die Stange, dass sie über der unteren Brust läuft.", "Schulterblätter zusammen, Griff etwas breiter als schulterbreit.", "Kontrolliert zur Brust senken, hochdrücken. Sicherheitsstopper auf Brusthöhe einstellen."],
  },
  Standing_Cable_Chest_Press: {
    name: "Brustdrücken am Kabel stehend", geraete: ["kabel"], level: 1, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Brust, vordere Schulter, Trizeps, Rumpf",
    tipps: ["Beide Kabel auf Brusthöhe, Schrittstellung mit dem Rücken zum Turm.", "Griffe neben der Brust, Ellbogen etwa 45° vom Körper.", "Nach vorne zusammendrücken, langsam zurück. Der Rumpf bleibt stabil."],
  },
  Dumbbell_Bench_Press: {
    name: "Bankdrücken (Kurzhanteln)", geraete: ["kh", "bank"], level: 1, art: "verbund", einheit: "kg", schritt: 2,
    muskeln: "Brust, vordere Schulter, Trizeps",
    tipps: ["Schulterblätter zusammen, Füße fest am Boden.", "Hanteln seitlich der Brust absenken, Ellbogen etwa 45° vom Körper.", "Über der Brust zusammenführen, ohne sie aneinanderzuschlagen."],
  },
  Leverage_Chest_Press: {
    name: "Brustpresse (Maschine)", geraete: ["maschine"], level: 1, art: "verbund", einheit: "kg", schritt: 5,
    muskeln: "Brust, vordere Schulter, Trizeps",
    tipps: ["Sitz so einstellen, dass die Griffe auf Brustmitte sind.", "Brust raus, Schulterblätter zurück.", "Nach vorne drücken, langsam zurück – Gewicht nicht ablegen."],
  },
  Dumbbell_Floor_Press: {
    name: "Bodendrücken (Kurzhanteln)", geraete: ["kh"], level: 1, art: "verbund", einheit: "kg", schritt: 2,
    muskeln: "Brust, Trizeps",
    tipps: ["Rückenlage am Boden, Knie gebeugt.", "Hanteln absenken, bis die Oberarme den Boden berühren.", "Kurz Pause, dann hochdrücken."],
  },
  Pushups: {
    name: "Liegestütze", geraete: [], level: 1, art: "verbund", einheit: "wdh",
    muskeln: "Brust, Trizeps, Rumpf",
    tipps: ["Hände etwas breiter als schulterbreit, Körper bildet eine Linie.", "Brust bis knapp über den Boden senken.", "Zu schwer? Hände erhöht auf Bank oder Tisch stützen."],
  },
  Incline_Dumbbell_Press: {
    name: "Schrägbankdrücken (Kurzhanteln)", geraete: ["kh", "bank"], level: 1, art: "verbund", einheit: "kg", schritt: 2,
    muskeln: "Obere Brust, vordere Schulter",
    tipps: ["Bank auf etwa 30° stellen.", "Hanteln seitlich der oberen Brust absenken.", "Schräg nach oben zusammendrücken."],
  },
  "Barbell_Incline_Bench_Press_-_Medium_Grip": {
    name: "Schrägbankdrücken (Langhantel)", geraete: ["lh", "bank"], level: 2, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Obere Brust, vordere Schulter", belastet: ["schulter"],
    tipps: ["Bank auf etwa 30°, Schulterblätter zurück.", "Stange zur oberen Brust absenken.", "Senkrecht nach oben drücken."],
  },
  Smith_Machine_Incline_Bench_Press: {
    name: "Schrägbankdrücken an der Multipresse", geraete: ["smith", "bank"], level: 1, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Obere Brust, vordere Schulter",
    tipps: ["Bank auf etwa 30° unter die Stange, sie läuft über der oberen Brust.", "Schulterblätter zurück, Stange entriegeln.", "Zur oberen Brust senken und hochdrücken."],
  },
  Leverage_Incline_Chest_Press: {
    name: "Schräge Brustpresse (Maschine)", geraete: ["maschine"], level: 1, art: "verbund", einheit: "kg", schritt: 5,
    muskeln: "Obere Brust, vordere Schulter",
    tipps: ["Griffe auf Höhe der oberen Brust einstellen.", "Brust raus, Schulterblätter zurück.", "Drücken, langsam zurück, Spannung halten."],
  },
  "Decline_Push-Up": {
    name: "Liegestütze mit erhöhten Füßen", geraete: [], level: 2, art: "verbund", einheit: "wdh",
    muskeln: "Obere Brust, Schultern, Trizeps",
    tipps: ["Füße auf Bank, Stuhl oder Stufe.", "Körper bleibt eine Linie, Bauch fest.", "Brust kontrolliert zum Boden senken."],
  },

  // ---------- Schulter ----------
  Seated_Dumbbell_Press: {
    name: "Schulterdrücken sitzend (Kurzhanteln)", geraete: ["kh", "bank"], level: 1, art: "verbund", einheit: "kg", schritt: 2,
    muskeln: "Schultern, Trizeps",
    tipps: ["Lehne fast senkrecht, Rücken angelehnt.", "Hanteln auf Schulterhöhe, Ellbogen leicht vor dem Körper.", "Nach oben drücken, nicht ins Hohlkreuz."],
  },
  Standing_Military_Press: {
    name: "Schulterdrücken stehend (Langhantel)", geraete: ["lh"], level: 2, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Schultern, Trizeps, Rumpf", belastet: ["schulter", "ruecken"],
    tipps: ["Stange auf Höhe der Schlüsselbeine, Griff schulterbreit.", "Po und Bauch fest anspannen.", "Senkrecht nach oben drücken, Kopf oben leicht durch die Arme."],
  },
  Smith_Machine_Overhead_Shoulder_Press: {
    name: "Schulterdrücken an der Multipresse", geraete: ["smith", "bank"], level: 1, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Schultern, Trizeps",
    tipps: ["Bank mit Lehne fast senkrecht unter die Stange.", "Stange vor dem Gesicht bis auf Kinnhöhe senken.", "Nach oben drücken, Rücken bleibt an der Lehne."],
  },
  Machine_Shoulder_Military_Press: {
    name: "Schulterpresse (Maschine)", geraete: ["maschine"], level: 1, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Schultern, Trizeps",
    tipps: ["Sitz so, dass die Griffe auf Schulterhöhe sind.", "Rücken am Polster.", "Nach oben drücken, langsam zurück."],
  },
  Dumbbell_Shoulder_Press: {
    name: "Schulterdrücken stehend (Kurzhanteln)", geraete: ["kh"], level: 1, art: "verbund", einheit: "kg", schritt: 2,
    muskeln: "Schultern, Trizeps, Rumpf",
    tipps: ["Hanteln auf Schulterhöhe, Bauch und Po fest.", "Nach oben drücken, ohne ins Hohlkreuz zu fallen.", "Kontrolliert ablassen."],
  },
  Arnold_Dumbbell_Press: {
    name: "Arnold Press", geraete: ["kh", "bank"], level: 2, art: "verbund", einheit: "kg", schritt: 2,
    muskeln: "Schultern",
    tipps: ["Start: Hanteln vor dem Gesicht, Handflächen zu dir.", "Beim Hochdrücken die Hände nach außen drehen.", "Auf dem Weg nach unten zurückdrehen."],
  },
  "Handstand_Push-Ups": {
    name: "Handstand-Liegestütze an der Wand", geraete: [], level: 3, art: "verbund", einheit: "wdh",
    muskeln: "Schultern, Trizeps", belastet: ["schulter"],
    tipps: ["Handstand mit den Füßen an der Wand, Hände schulterbreit.", "Kopf kontrolliert Richtung Boden senken.", "Wieder hochdrücken. Nur mit sicherem Handstand."],
  },
  Side_Lateral_Raise: {
    name: "Seitheben (Kurzhanteln)", geraete: ["kh"], level: 1, art: "isolation", einheit: "kg", schritt: 1,
    muskeln: "Seitliche Schulter",
    tipps: ["Leicht vorgebeugt stehen, Arme minimal gebeugt.", "Hanteln seitlich bis Schulterhöhe heben – Ellbogen führen.", "Langsam ablassen, nicht schwingen."],
  },
  Seated_Side_Lateral_Raise: {
    name: "Seitheben sitzend", geraete: ["kh", "bank"], level: 1, art: "isolation", einheit: "kg", schritt: 1,
    muskeln: "Seitliche Schulter",
    tipps: ["Aufrecht am Bankende sitzen.", "Arme seitlich bis Schulterhöhe heben.", "Langsam ablassen – im Sitzen geht kein Schwung."],
  },
  "Standing_Low-Pulley_Deltoid_Raise": {
    name: "Seitheben am Kabel", geraete: ["kabel"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5, jeSeite: true,
    muskeln: "Seitliche Schulter",
    tipps: ["Seitlich zum unteren Kabel, Griff mit der äußeren Hand vor dem Körper.", "Arm leicht gebeugt seitlich bis Schulterhöhe heben.", "Langsam ablassen – das Kabel hält die Spannung auch unten."],
  },
  Face_Pull: {
    name: "Face Pulls", geraete: ["kabel"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Hintere Schulter, oberer Rücken",
    tipps: ["Seil am Kabelzug auf Kopfhöhe.", "Zum Gesicht ziehen und die Hände dabei auseinanderziehen.", "Oberarme bleiben etwa waagerecht, oben kurz halten."],
  },
  Reverse_Machine_Flyes: {
    name: "Reverse Butterfly (Maschine)", geraete: ["maschine"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Hintere Schulter",
    tipps: ["Brust ans Polster, Griffe auf Schulterhöhe.", "Arme leicht gebeugt im Halbkreis nach hinten führen.", "Kurz halten, langsam zurück."],
  },
  Cable_Rear_Delt_Fly: {
    name: "Reverse Flys am Kabel", geraete: ["kabel"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Hintere Schulter, oberer Rücken",
    tipps: ["Beide Kabel auf Kopfhöhe, Griffe über Kreuz greifen (links nach rechts).", "Arme leicht gebeugt nach hinten außen ziehen.", "Schulterblätter zusammen, langsam zurück."],
  },
  Reverse_Flyes: {
    name: "Reverse Flys (Kurzhanteln)", geraete: ["kh"], level: 1, art: "isolation", einheit: "kg", schritt: 1,
    muskeln: "Hintere Schulter, oberer Rücken",
    tipps: ["Weit vorgebeugt, Rücken gerade.", "Arme leicht gebeugt seitlich anheben.", "Schulterblätter oben zusammenziehen, langsam ablassen."],
  },

  // ---------- Brust isoliert ----------
  Butterfly: {
    name: "Butterfly (Maschine)", geraete: ["maschine"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Brust",
    tipps: ["Oberarme etwa waagerecht, Rücken am Polster.", "Griffe vor der Brust zusammendrücken.", "Kurz halten, langsam öffnen."],
  },
  Cable_Crossover: {
    name: "Cable Crossover", geraete: ["kabel"], level: 2, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Brust",
    tipps: ["Zwischen zwei oberen Kabeln, ein Schritt nach vorne.", "Arme leicht gebeugt im Bogen vor dem Körper zusammenführen.", "Langsam öffnen, bis die Brust gedehnt ist."],
  },
  Incline_Cable_Flye: {
    name: "Fliegende am Kabel (Schrägbank)", geraete: ["kabel", "bank"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Obere Brust",
    tipps: ["Schrägbank (30–45°) zwischen die beiden unteren Kabel stellen.", "Arme leicht gebeugt weit öffnen, bis die Brust dehnt.", "Im Bogen über der oberen Brust zusammenführen, langsam öffnen."],
  },
  Low_Cable_Crossover: {
    name: "Cable Crossover von unten", geraete: ["kabel"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Obere Brust",
    tipps: ["Beide Kabel ganz unten, ein Schritt nach vorne.", "Arme leicht gebeugt im Bogen nach vorne oben bis auf Brusthöhe führen.", "Langsam zurück, bis die Brust dehnt."],
  },
  Dumbbell_Flyes: {
    name: "Fliegende (Kurzhanteln)", geraete: ["kh", "bank"], level: 1, art: "isolation", einheit: "kg", schritt: 1,
    muskeln: "Brust",
    tipps: ["Rückenlage, Hanteln über der Brust, Arme leicht gebeugt.", "Im weiten Bogen seitlich absenken, bis die Brust dehnt.", "Im gleichen Bogen zurückführen."],
  },

  // ---------- Ziehen ----------
  "Wide-Grip_Lat_Pulldown": {
    name: "Latziehen breit", geraete: ["latzug"], level: 1, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Breiter Rücken, Bizeps",
    tipps: ["Knie unter dem Polster fixieren, Griff breit.", "Stange zur oberen Brust ziehen, Brust raus.", "Ellbogen nach unten führen, langsam zurück."],
  },
  "Close-Grip_Front_Lat_Pulldown": {
    name: "Latziehen eng", geraete: ["latzug"], level: 1, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Breiter Rücken, Bizeps",
    tipps: ["Enger Griff, leicht zurückgelehnt.", "Zur oberen Brust ziehen, Ellbogen nah am Körper.", "Langsam nach oben strecken lassen."],
  },
  "Straight-Arm_Pulldown": {
    name: "Überzüge am Kabel (Straight-Arm Pulldown)", geraete: [["latzug", "kabel"]], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Breiter Rücken",
    tipps: ["Stange am oberen Kabel, zwei Schritte zurück, leicht vorgebeugt.", "Mit gestreckten Armen die Stange im Bogen bis zu den Oberschenkeln ziehen.", "Langsam zurück, Arme bleiben gestreckt."],
  },
  "One_Arm_Lat_Pulldown": {
    name: "Einarmiges Latziehen", geraete: [["latzug", "kabel"]], level: 1, art: "verbund", einheit: "kg", schritt: 2.5, jeSeite: true,
    muskeln: "Breiter Rücken, Bizeps",
    tipps: ["Einzelgriff am oberen Kabel, kniend oder sitzend.", "Arm oben ganz strecken lassen, bis der Rücken dehnt.", "Ellbogen zur Hüfte ziehen, kurz halten, langsam zurück."],
  },
  "Bent-Arm_Dumbbell_Pullover": {
    name: "Kurzhantel-Pullover", geraete: ["kh", "bank"], level: 1, art: "isolation", einheit: "kg", schritt: 2,
    muskeln: "Breiter Rücken, Brust",
    tipps: ["Quer auf der Bank, nur die Schultern liegen auf, Hüfte tief.", "Eine Kurzhantel mit beiden Händen über der Brust, Arme leicht gebeugt.", "Im Bogen hinter den Kopf senken, bis Rücken und Brust dehnen, dann zurückziehen."],
  },
  Pullups: {
    name: "Klimmzüge", geraete: ["stange"], level: 2, art: "verbund", einheit: "wdh",
    muskeln: "Breiter Rücken, Bizeps",
    tipps: ["Obergriff etwas breiter als schulterbreit.", "Hochziehen, bis das Kinn über der Stange ist.", "Ganz kontrolliert in den gestreckten Hang ablassen."],
  },
  "Chin-Up": {
    name: "Klimmzüge im Untergriff", geraete: ["stange"], level: 1, art: "verbund", einheit: "wdh",
    muskeln: "Breiter Rücken, Bizeps",
    tipps: ["Untergriff, schulterbreit.", "Brust zur Stange ziehen.", "Noch keiner möglich? Hochspringen und 3–5 Sek. langsam ablassen – zählt als Wiederholung."],
  },
  Seated_Cable_Rows: {
    name: "Rudern am Kabel sitzend", geraete: [["latzug", "kabel"]], level: 1, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Mittlerer Rücken, Bizeps",
    tipps: ["Aufrecht sitzen, Knie leicht gebeugt.", "Griff zum Bauch ziehen, Schulterblätter zusammen.", "Langsam nach vorne strecken, ohne den Rücken zu runden."],
  },
  Bent_Over_Barbell_Row: {
    name: "Langhantelrudern vorgebeugt", geraete: ["lh"], level: 2, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Rücken, Bizeps", belastet: ["ruecken"],
    tipps: ["Oberkörper etwa 45° vorgebeugt, Rücken gerade.", "Stange zum Bauchnabel ziehen.", "Kontrolliert ablassen, Oberkörper bleibt ruhig."],
  },
  "One-Arm_Dumbbell_Row": {
    name: "Einarmiges Kurzhantelrudern", geraete: ["kh", "bank"], level: 1, art: "verbund", einheit: "kg", schritt: 2, jeSeite: true,
    muskeln: "Rücken, Bizeps",
    tipps: ["Knie und Hand auf der Bank, Rücken waagerecht.", "Hantel zur Hüfte ziehen, Ellbogen nah am Körper.", "Unten ganz strecken lassen."],
  },
  Smith_Machine_Bent_Over_Row: {
    name: "Rudern vorgebeugt an der Multipresse", geraete: ["smith"], level: 1, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Rücken, Bizeps", belastet: ["ruecken"],
    tipps: ["Stange knapp unter Kniehöhe einhängen.", "Knie leicht gebeugt, Oberkörper weit vorgebeugt, Rücken gerade.", "Stange zum Bauch ziehen, langsam ablassen."],
  },
  Leverage_Iso_Row: {
    name: "Rudermaschine", geraete: ["maschine"], level: 1, art: "verbund", einheit: "kg", schritt: 5,
    muskeln: "Rücken, Bizeps",
    tipps: ["Sitz so, dass die Griffe auf Brusthöhe sind.", "Griffe zum Körper ziehen, Schulterblätter zusammen.", "Langsam zurück, Gewicht nicht ablegen."],
  },
  Dumbbell_Incline_Row: {
    name: "Rudern auf der Schrägbank", geraete: ["kh", "bank"], level: 1, art: "verbund", einheit: "kg", schritt: 2,
    muskeln: "Rücken, hintere Schulter",
    tipps: ["Bauchlage auf der schrägen Bank.", "Hanteln nach oben ziehen, Schulterblätter zusammen.", "Langsam ablassen – die Bank schont den unteren Rücken."],
  },
  "Bent_Over_Two-Dumbbell_Row": {
    name: "Kurzhantelrudern vorgebeugt", geraete: ["kh"], level: 1, art: "verbund", einheit: "kg", schritt: 2,
    muskeln: "Rücken, Bizeps", belastet: ["ruecken"],
    tipps: ["Vorgebeugt, Rücken gerade, Knie leicht gebeugt.", "Beide Hanteln zur Hüfte ziehen.", "Langsam ablassen."],
  },
  Inverted_Row: {
    name: "Rudern rücklings (Inverted Row)", geraete: [], level: 1, art: "verbund", einheit: "wdh",
    muskeln: "Rücken, Bizeps",
    tipps: ["An einer Stange auf Hüfthöhe – zu Hause unter einem sehr stabilen Tisch.", "Körper gestreckt, Fersen am Boden.", "Brust zur Stange ziehen. Leichter: Knie beugen."],
  },

  // ---------- Arme ----------
  Barbell_Curl: {
    name: "Bizepscurls (Langhantel)", geraete: ["lh"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Bizeps",
    tipps: ["Schulterbreiter Untergriff, Ellbogen am Körper.", "Stange zur Brust beugen, ohne Schwung.", "Langsam ganz strecken."],
  },
  Dumbbell_Bicep_Curl: {
    name: "Bizepscurls (Kurzhanteln)", geraete: ["kh"], level: 1, art: "isolation", einheit: "kg", schritt: 1,
    muskeln: "Bizeps",
    tipps: ["Ellbogen bleiben an der Seite.", "Hanteln hochbeugen und Handflächen dabei nach oben drehen.", "Langsam ablassen."],
  },
  Hammer_Curls: {
    name: "Hammercurls", geraete: ["kh"], level: 1, art: "isolation", einheit: "kg", schritt: 1,
    muskeln: "Bizeps, Unterarme",
    tipps: ["Daumen zeigen nach oben (Hammergriff).", "Ellbogen bleiben ruhig am Körper.", "Hoch und kontrolliert runter."],
  },
  Standing_Biceps_Cable_Curl: {
    name: "Bizepscurls am Kabel", geraete: ["kabel"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Bizeps",
    tipps: ["Stange am unteren Kabel, Untergriff schulterbreit.", "Ellbogen bleiben am Körper, Stange zur Brust beugen.", "Langsam strecken – das Kabel hält die Spannung."],
  },
  "Cable_Hammer_Curls_-_Rope_Attachment": {
    name: "Hammercurls am Kabel (Seil)", geraete: ["kabel"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Bizeps, Unterarme",
    tipps: ["Seil am unteren Kabel, Handflächen zueinander.", "Ellbogen fest an der Seite, Seil hochbeugen.", "Langsam ablassen."],
  },
  Incline_Dumbbell_Curl: {
    name: "Schrägbank-Curls (Kurzhanteln)", geraete: ["kh", "bank"], level: 1, art: "isolation", einheit: "kg", schritt: 1,
    muskeln: "Bizeps (in Dehnung)",
    tipps: ["Bank auf etwa 45–60°, zurücklehnen, Arme hängen gestreckt nach unten.", "Oberarme bleiben ruhig hinter dem Körper, nur die Unterarme bewegen sich.", "Unten ganz strecken – in der Dehnung arbeitet der Bizeps besonders."],
  },
  Preacher_Curl: {
    name: "Scottcurls", geraete: ["lh", "maschine"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Bizeps",
    tipps: ["Oberarme flach auf das Polster der Scottbank.", "Stange hochbeugen.", "Langsam fast ganz strecken."],
  },
  Triceps_Pushdown: {
    name: "Trizepsdrücken am Kabel", geraete: [["kabel", "latzug"]], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Trizeps",
    tipps: ["Ellbogen fest an der Seite.", "Griff nach unten drücken, bis die Arme gestreckt sind.", "Langsam bis etwa 90° zurück."],
  },
  "Smith_Machine_Close-Grip_Bench_Press": {
    name: "Enges Bankdrücken (Multipresse)", geraete: ["smith", "bank"], level: 1, art: "verbund", einheit: "kg", schritt: 2.5,
    muskeln: "Trizeps, Brust",
    tipps: ["Flachbank unter die Stange, Griff etwa schulterbreit.", "Ellbogen beim Absenken nah am Körper führen.", "Stange zur unteren Brust senken und mit den Armen hochdrücken."],
  },
  Cable_Rope_Overhead_Triceps_Extension: {
    name: "Trizepsstrecken über Kopf (Kabel)", geraete: ["kabel"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Trizeps",
    tipps: ["Mit dem Rücken zum Kabel, Seil hinter dem Kopf.", "Arme nach vorne oben strecken, Oberarme bleiben ruhig.", "Langsam beugen, bis der Trizeps dehnt."],
  },
  Lying_Triceps_Press: {
    name: "French Press (SZ-Stange)", geraete: ["lh", "bank"], level: 2, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Trizeps",
    tipps: ["Rückenlage, Stange mit gestreckten Armen über der Brust.", "Nur die Ellbogen beugen, Stange Richtung Stirn senken.", "Oberarme bleiben ruhig, wieder strecken."],
  },
  Standing_Dumbbell_Triceps_Extension: {
    name: "Trizepsstrecken über Kopf (Kurzhantel)", geraete: ["kh"], level: 1, art: "isolation", einheit: "kg", schritt: 1,
    muskeln: "Trizeps",
    tipps: ["Eine Hantel mit beiden Händen über dem Kopf.", "Hinter den Kopf absenken, Ellbogen zeigen nach vorne oben.", "Wieder strecken."],
  },
  Tricep_Dumbbell_Kickback: {
    name: "Trizeps-Kickbacks", geraete: ["kh"], level: 1, art: "isolation", einheit: "kg", schritt: 1, jeSeite: true,
    muskeln: "Trizeps",
    tipps: ["Vorgebeugt, Oberarm parallel zum Oberkörper.", "Unterarm nach hinten strecken.", "Oben kurz halten, langsam zurück."],
  },
  "Dips_-_Triceps_Version": {
    name: "Dips", geraete: ["barren"], level: 2, art: "verbund", einheit: "wdh",
    muskeln: "Trizeps, Brust", belastet: ["schulter"],
    tipps: ["Am Barren hochstützen, Oberkörper aufrecht.", "Absenken, bis die Oberarme etwa waagerecht sind.", "Wieder hochdrücken."],
  },
  Bench_Dips: {
    name: "Bankdips", geraete: [], level: 1, art: "isolation", einheit: "wdh",
    muskeln: "Trizeps", belastet: ["schulter"],
    tipps: ["Hände hinter dir auf Bank oder stabilem Stuhl.", "Absenken, bis die Ellbogen etwa 90° gebeugt sind.", "Ellbogen zeigen nach hinten. Schwerer: Beine strecken."],
  },

  // ---------- Rumpf ----------
  Plank: {
    name: "Unterarmstütz (Plank)", geraete: [], level: 1, art: "isolation", einheit: "sek",
    muskeln: "Rumpf",
    tipps: ["Ellbogen unter den Schultern.", "Körper eine Linie, Po und Bauch fest.", "Ruhig weiteratmen."],
  },
  Side_Bridge: {
    name: "Seitstütz", geraete: [], level: 1, art: "isolation", einheit: "sek", jeSeite: true,
    muskeln: "Seitlicher Rumpf",
    tipps: ["Ellbogen unter der Schulter, Füße übereinander.", "Hüfte hoch, Körper eine Linie.", "Leichter: unteres Knie am Boden lassen."],
  },
  Dead_Bug: {
    name: "Dead Bug", geraete: [], level: 1, art: "isolation", einheit: "wdh", jeSeite: true,
    muskeln: "Tiefe Bauchmuskeln",
    tipps: ["Rückenlage, Arme zur Decke, Hüfte und Knie 90°.", "Unteren Rücken fest an den Boden drücken.", "Gegengleich Arm und Bein langsam strecken – der Rücken bleibt unten."],
  },
  Ab_Crunch_Machine: {
    name: "Bauchmaschine (Crunch)", geraete: ["bauch"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Bauch",
    tipps: ["Sitz so einstellen, dass die Griffe bzw. Polster auf Brusthöhe sind.", "Oberkörper einrollen, als wolltest du die Rippen zur Hüfte ziehen.", "Langsam zurück, nicht mit den Armen ziehen."],
  },
  Standing_Cable_Wood_Chop: {
    name: "Holzhacker am Kabel", geraete: ["kabel"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5, jeSeite: true,
    muskeln: "Seitlicher Rumpf",
    tipps: ["Kabel ganz oben, seitlich zum Turm, Griff mit beiden Händen.", "Diagonal nach unten zur gegenüberliegenden Hüfte ziehen, Arme fast gestreckt.", "Die Drehung kommt aus dem Rumpf, Füße bleiben stehen."],
  },
  Cable_Crunch: {
    name: "Kabel-Crunch kniend", geraete: [["kabel", "latzug"]], level: 1, art: "isolation", einheit: "kg", schritt: 2.5,
    muskeln: "Bauch",
    tipps: ["Kniend vor dem Kabel, Seil neben dem Kopf.", "Oberkörper einrollen, Ellbogen Richtung Knie.", "Die Hüfte bleibt ruhig."],
  },
  Hanging_Leg_Raise: {
    name: "Beinheben hängend", geraete: ["stange"], level: 2, art: "isolation", einheit: "wdh",
    muskeln: "Bauch, Hüftbeuger",
    tipps: ["An der Stange hängen, nicht schwingen.", "Beine bis mindestens waagerecht heben.", "Langsam ablassen. Leichter: Knie anziehen."],
  },
  Pallof_Press: {
    name: "Pallof Press", geraete: ["kabel"], level: 1, art: "isolation", einheit: "kg", schritt: 2.5, jeSeite: true,
    muskeln: "Rumpf (Anti-Rotation)",
    tipps: ["Seitlich zum Kabel, Griff vor der Brust.", "Arme gerade nach vorne strecken, ohne dass der Körper mitdreht.", "Kurz halten, zurück zur Brust."],
  },
  Reverse_Crunch: {
    name: "Reverse Crunch", geraete: [], level: 1, art: "isolation", einheit: "wdh",
    muskeln: "Unterer Bauch",
    tipps: ["Rückenlage, Knie angezogen.", "Becken einrollen und vom Boden heben.", "Langsam ablegen, kein Schwung."],
  },
};

// Bewegungsmuster: Kandidaten in Reihenfolge der Vorliebe. Der Plan nimmt die erste Übung,
// für die du die Geräte hast; Variante 1, 2 … nimmt die zweite, dritte … (für Abwechslung zwischen den Einheiten).
const MUSTER = {
  kniebeuge: { name: "Kniebeuge", ids: ["Barbell_Squat", "Leg_Press", "Smith_Machine_Squat", "Hack_Squat", "Goblet_Squat", "Dumbbell_Squat", "Front_Barbell_Squat", "Bodyweight_Squat"] },
  einbeinig: { name: "Einbeinig", ids: ["Dumbbell_Lunges", "Dumbbell_Step_Ups", "Dumbbell_Rear_Lunge", "Bodyweight_Walking_Lunge"] },
  huefte: { name: "Hüfte & Beinrückseite", ids: ["Romanian_Deadlift", "Barbell_Deadlift", "Barbell_Hip_Thrust", "Smith_Machine_Stiff-Legged_Deadlift", "Stiff-Legged_Dumbbell_Deadlift", "Pull_Through", "Hyperextensions_Back_Extensions", "Single_Leg_Glute_Bridge", "Butt_Lift_Bridge", "Superman"] },
  beinbeuger: { name: "Beinbeuger", ids: ["Lying_Leg_Curls", "Seated_Leg_Curl"] },
  beinstrecker: { name: "Beinstrecker", ids: ["Leg_Extensions"] },
  waden: { name: "Waden", ids: ["Standing_Calf_Raises", "Seated_Calf_Raise", "Calf_Press_On_The_Leg_Press_Machine", "Smith_Machine_Calf_Raise", "Standing_Dumbbell_Calf_Raise"] },
  druecken_h: { name: "Brust drücken", ids: ["Barbell_Bench_Press_-_Medium_Grip", "Smith_Machine_Bench_Press", "Dumbbell_Bench_Press", "Leverage_Chest_Press", "Standing_Cable_Chest_Press", "Dumbbell_Floor_Press", "Pushups"] },
  druecken_schraeg: { name: "Schräg drücken", ids: ["Incline_Dumbbell_Press", "Barbell_Incline_Bench_Press_-_Medium_Grip", "Smith_Machine_Incline_Bench_Press", "Leverage_Incline_Chest_Press", "Decline_Push-Up"] },
  druecken_v: { name: "Schulter drücken", ids: ["Seated_Dumbbell_Press", "Standing_Military_Press", "Smith_Machine_Overhead_Shoulder_Press", "Machine_Shoulder_Military_Press", "Dumbbell_Shoulder_Press", "Arnold_Dumbbell_Press", "Handstand_Push-Ups"] },
  seitheben: { name: "Seitliche Schulter", ids: ["Side_Lateral_Raise", "Standing_Low-Pulley_Deltoid_Raise", "Seated_Side_Lateral_Raise"] },
  hintere_schulter: { name: "Hintere Schulter", ids: ["Face_Pull", "Reverse_Machine_Flyes", "Cable_Rear_Delt_Fly", "Reverse_Flyes"] },
  brust_iso: { name: "Brust isoliert", ids: ["Butterfly", "Cable_Crossover", "Incline_Cable_Flye", "Low_Cable_Crossover", "Dumbbell_Flyes"] },
  ziehen_v: { name: "Ziehen von oben", ids: ["Wide-Grip_Lat_Pulldown", "Pullups", "Close-Grip_Front_Lat_Pulldown", "One_Arm_Lat_Pulldown", "Chin-Up", "Straight-Arm_Pulldown", "Bent-Arm_Dumbbell_Pullover"] },
  ziehen_h: { name: "Rudern", ids: ["Seated_Cable_Rows", "Bent_Over_Barbell_Row", "One-Arm_Dumbbell_Row", "Smith_Machine_Bent_Over_Row", "Leverage_Iso_Row", "Dumbbell_Incline_Row", "Bent_Over_Two-Dumbbell_Row", "Inverted_Row"] },
  bizeps: { name: "Bizeps", ids: ["Barbell_Curl", "Incline_Dumbbell_Curl", "Dumbbell_Bicep_Curl", "Hammer_Curls", "Standing_Biceps_Cable_Curl", "Cable_Hammer_Curls_-_Rope_Attachment", "Preacher_Curl", "Chin-Up"] },
  // Über Kopf zuerst: In gedehnter Position wuchs der Trizeps 1,4-mal so stark (Maeo 2021)
  trizeps: { name: "Trizeps", ids: ["Cable_Rope_Overhead_Triceps_Extension", "Triceps_Pushdown", "Smith_Machine_Close-Grip_Bench_Press", "Lying_Triceps_Press", "Standing_Dumbbell_Triceps_Extension", "Tricep_Dumbbell_Kickback", "Dips_-_Triceps_Version", "Bench_Dips"] },
  core: { name: "Rumpf", ids: ["Plank", "Ab_Crunch_Machine", "Cable_Crunch", "Hanging_Leg_Raise", "Dead_Bug", "Pallof_Press", "Standing_Cable_Wood_Chop", "Side_Bridge", "Reverse_Crunch", "Superman"] },
};

// Muskelgruppen, die eine Einheit beim Ausgleichen bekommen darf (Ganzkörper: alle)
const OBEN = ["brust", "ruecken", "schulter_seite", "schulter_hinten", "bizeps", "trizeps", "bauch"];
// Schulterübungen (seitlich, hinten) passen auch an Beintage und entlasten die Oberkörper-Tage
const UNTEN = ["beine_vorne", "beinrueckseite", "gesaess", "waden", "bauch", "schulter_seite", "schulter_hinten"];
const PUSH = ["brust", "schulter_seite", "trizeps", "bauch"];
const PULL = ["ruecken", "schulter_hinten", "bizeps", "bauch"];

// Trainingseinheiten: "muster:variante", wichtigste zuerst. Kürzere Trainings nehmen nur die ersten Übungen.
const EINHEIT_VORLAGEN = {
  gk_a: { name: "Ganzkörper A", muster: ["kniebeuge:0", "druecken_h:0", "ziehen_v:0", "huefte:0", "seitheben:0", "trizeps:0", "core:0"] },
  gk_b: { name: "Ganzkörper B", muster: ["huefte:1", "druecken_v:0", "ziehen_h:0", "einbeinig:0", "druecken_schraeg:0", "bizeps:0", "core:1"] },
  gk_c: { name: "Ganzkörper C", muster: ["kniebeuge:1", "druecken_h:1", "ziehen_v:1", "beinbeuger:0", "hintere_schulter:0", "bizeps:1", "waden:0"] },
  ok_a: { name: "Oberkörper A", muster: ["druecken_h:0", "ziehen_h:0", "druecken_v:0", "ziehen_v:0", "seitheben:0", "bizeps:0", "trizeps:0"], fokus: OBEN },
  ok_b: { name: "Oberkörper B", muster: ["ziehen_v:1", "druecken_schraeg:0", "ziehen_h:1", "brust_iso:0", "hintere_schulter:0", "trizeps:1", "bizeps:1"], fokus: OBEN },
  uk_a: { name: "Unterkörper A", muster: ["kniebeuge:0", "huefte:0", "einbeinig:0", "beinbeuger:0", "waden:0", "core:0", "beinstrecker:0"], fokus: UNTEN },
  uk_b: { name: "Unterkörper B", muster: ["huefte:1", "kniebeuge:1", "beinbeuger:1", "einbeinig:1", "beinstrecker:0", "waden:1", "core:1"], fokus: UNTEN },
  push_a: { name: "Push A (Brust, Schulter, Trizeps)", muster: ["druecken_h:0", "druecken_v:0", "druecken_schraeg:0", "seitheben:0", "trizeps:0", "brust_iso:0", "trizeps:1"], fokus: PUSH },
  pull_a: { name: "Pull A (Rücken, Bizeps)", muster: ["ziehen_v:0", "ziehen_h:0", "ziehen_h:1", "hintere_schulter:0", "bizeps:0", "bizeps:1", "core:0"], fokus: PULL },
  beine_a: { name: "Beine A", muster: ["kniebeuge:0", "huefte:0", "einbeinig:0", "beinbeuger:0", "waden:0", "beinstrecker:0", "core:1"], fokus: UNTEN },
  push_b: { name: "Push B (Brust, Schulter, Trizeps)", muster: ["druecken_schraeg:1", "druecken_v:1", "druecken_h:1", "brust_iso:1", "seitheben:1", "trizeps:1", "trizeps:2"], fokus: PUSH },
  pull_b: { name: "Pull B (Rücken, Bizeps)", muster: ["ziehen_h:2", "ziehen_v:1", "ziehen_v:2", "hintere_schulter:1", "bizeps:1", "bizeps:2", "core:1"], fokus: PULL },
  beine_b: { name: "Beine B", muster: ["huefte:1", "kniebeuge:1", "beinbeuger:1", "einbeinig:1", "beinstrecker:0", "waden:1", "core:0"], fokus: UNTEN },
};

// Trainingstage pro Woche -> Aufteilung
const SPLITS = {
  1: { name: "Ganzkörper", einheiten: ["gk_a"] },
  2: { name: "Ganzkörper A/B", einheiten: ["gk_a", "gk_b"] },
  3: { name: "Ganzkörper A/B/C", einheiten: ["gk_a", "gk_b", "gk_c"] },
  4: { name: "Oberkörper/Unterkörper", einheiten: ["ok_a", "uk_a", "ok_b", "uk_b"] },
  5: { name: "Push/Pull/Beine + Ober/Unter", einheiten: ["push_a", "pull_a", "beine_a", "ok_b", "uk_b"] },
  6: { name: "Push/Pull/Beine ×2", einheiten: ["push_a", "pull_a", "beine_a", "push_b", "pull_b", "beine_b"] },
};

// Wenn für ein Muster keine Übung passt (z. B. kein Beinbeuger zu Hause), wird hiermit aufgefüllt
const FUELLER = ["core:0", "core:1", "einbeinig:0", "ziehen_h:0", "druecken_h:0", "huefte:1", "bizeps:0", "trizeps:0"];

// ================= Mobility =================

const DEHNUNGEN = {
  Cat_Stretch: { name: "Katze-Kuh", tipps: ["Vierfüßlerstand, Hände unter den Schultern.", "Ausatmen: Rücken rund machen, Kopf sinken lassen.", "Einatmen: Rücken sanft durchhängen lassen, Blick nach vorne. Langsam abwechseln."] },
  Childs_Pose: { name: "Kindhaltung", tipps: ["Aus dem Vierfüßlerstand den Po auf die Fersen setzen.", "Arme lang nach vorne, Stirn ablegen.", "Ruhig in den Rücken atmen. Bei Knieproblemen auslassen."] },
  Worlds_Greatest_Stretch: { name: "World's Greatest Stretch", tipps: ["Tiefer Ausfallschritt, hinteres Knie knapp über dem Boden.", "Den Ellbogen der gleichen Seite innen neben den vorderen Fuß senken.", "Dann den Arm zur Decke drehen, der Blick folgt der Hand. Im Wechsel wiederholen."] },
  Kneeling_Hip_Flexor: { name: "Hüftbeuger kniend", tipps: ["Kniestand, ein Fuß vorne aufgestellt.", "Po anspannen und die Hüfte sanft nach vorne schieben.", "Oberkörper aufrecht – es zieht vorne an der Hüfte des hinteren Beins."] },
  Ankle_On_The_Knee: { name: "Gesäß-Dehnung (Figur 4)", tipps: ["Rückenlage, den Knöchel auf das andere Knie legen.", "Das untere Bein am Oberschenkel Richtung Brust ziehen.", "Nacken und Schultern locker lassen."] },
  Runners_Stretch: { name: "Läufer-Dehnung", tipps: ["Ein Bein weit nach hinten, Hände links und rechts vom vorderen Fuß.", "Vordere Ferse bleibt am Boden.", "Po langsam heben und senken – dehnt vorne die Beinrückseite und hinten den Hüftbeuger."] },
  Seated_Floor_Hamstring_Stretch: { name: "Beinrückseite sitzend", tipps: ["Ein Bein lang, der andere Fuß innen am Oberschenkel.", "Mit geradem Rücken aus der Hüfte zum Knöchel lehnen.", "Nicht wippen, ruhig halten."] },
  Spinal_Stretch: { name: "Rotation im Sitzen", tipps: ["Aufrecht auf einem Stuhl, Hände hinter dem Kopf.", "Oberkörper langsam zur Seite drehen, die Hüfte bleibt gerade.", "Ein paar Mal sanft nachdrehen."] },
  Upper_Back_Stretch: { name: "Oberer Rücken", tipps: ["Finger verschränken, Arme nach vorne strecken.", "Schultern nach vorne rund werden lassen, Kinn leicht zur Brust.", "Zwischen den Schulterblättern auseinanderziehen."] },
  Elbows_Back: { name: "Brustöffner", tipps: ["Hände an den unteren Rücken, Finger zeigen nach unten.", "Ellbogen sanft nach hinten zusammenziehen.", "Brust heben, Schultern weg von den Ohren."] },
  Dynamic_Chest_Stretch: { name: "Arme öffnen (dynamisch)", tipps: ["Arme gestreckt vor dem Körper zusammen.", "Schwungvoll weit nach hinten öffnen und wieder zurück – wie ein großes Klatschen.", "Tempo langsam steigern."] },
  One_Arm_Against_Wall: { name: "Lat-Dehnung an der Wand", tipps: ["Gebeugten Unterarm hoch an Wand oder Türrahmen legen.", "Oberkörper langsam Richtung Arm lehnen, bis die Rückenseite zieht."] },
  Shoulder_Circles: { name: "Schulterkreisen", tipps: ["Arme locker hängen lassen.", "Schultern nach vorne, oben, hinten und unten kreisen.", "Nach der Hälfte die Richtung wechseln."] },
  Arm_Circles: { name: "Armkreisen", tipps: ["Arme seitlich auf Schulterhöhe strecken.", "Kleine Kreise, langsam größer werden.", "Nach der Hälfte die Richtung wechseln."] },
  Standing_Hip_Circles: { name: "Hüftkreisen stehend", tipps: ["An Wand oder Stuhl festhalten, ein Knie auf Hüfthöhe heben.", "Mit dem Knie große, langsame Kreise nach außen ziehen."] },
  Hip_Circles_prone: { name: "Hüftkreisen im Vierfüßlerstand", tipps: ["Vierfüßlerstand, ein gebeugtes Knie leicht anheben.", "Mit dem Knie große, langsame Kreise ziehen.", "Rücken bleibt ruhig."] },
  Front_Leg_Raises: { name: "Beinschwingen", tipps: ["Seitlich an Wand oder Stuhl festhalten.", "Gestrecktes Bein locker vor und zurück schwingen.", "Die Bewegung langsam größer werden lassen."] },
  Inchworm: { name: "Inchworm", tipps: ["Aus dem Stand mit möglichst gestreckten Beinen die Hände zum Boden.", "Mit den Händen nach vorne laufen bis in den Liegestütz.", "Mit kleinen Schritten die Füße zu den Händen laufen, aufrichten, wiederholen."] },
  On_Your_Side_Quad_Stretch: { name: "Oberschenkel vorne", tipps: ["Seitlage, das untere Knie angewinkelt vor dem Körper.", "Oberen Fuß greifen und zum Po ziehen.", "Hüfte nach vorne schieben für mehr Dehnung."] },
  Calf_Stretch_Hands_Against_Wall: { name: "Waden an der Wand", tipps: ["Hände an die Wand, ein Bein weit nach hinten.", "Hintere Ferse bleibt am Boden, Körper eine Linie.", "Zur Wand lehnen, bis die Wade zieht."] },
  Side_Neck_Stretch: { name: "Nacken seitlich", tipps: ["Schultern locker, Kopf zur Seite neigen.", "Mit der Hand nur ganz leicht nachziehen."] },
  Chin_To_Chest_Stretch: { name: "Nacken hinten", tipps: ["Aufrecht sitzen, Hände am Hinterkopf.", "Kinn sanft Richtung Brust sinken lassen.", "Ruhig atmen."] },
  Standing_Lateral_Stretch: { name: "Seitdehnung stehend", tipps: ["Etwas breiter als hüftbreit stehen, Knie locker.", "Eine Hand an die Hüfte, die andere hinter den Kopf.", "Oberkörper zur Seite neigen, Gewicht auf beiden Beinen."] },
  Side_Lying_Groin_Stretch: { name: "Innenseite Oberschenkel", tipps: ["Seitlage, unteres Knie vor dem Körper.", "Oberes Bein an der Kniekehle greifen und Richtung Schulter ziehen.", "Für mehr Dehnung das Bein strecken."] },
  Pelvic_Tilt_Into_Bridge: { name: "Becken kippen in die Brücke", tipps: ["Rückenlage, Fersen unter den Knien.", "Erst nur das Steißbein heben, Bauch fest.", "Dann Wirbel für Wirbel in die Brücke rollen und langsam wieder ablegen."] },
  Hug_Knees_To_Chest: { name: "Knie zur Brust", tipps: ["Rückenlage, beide Knie zur Brust ziehen.", "Hände unter den Knien greifen, nicht darüber.", "Locker lassen und leicht hin und her wiegen."] },
  Overhead_Stretch: { name: "Strecken über Kopf", tipps: ["Finger verschränken, Handflächen zur Decke.", "Arme lang nach oben strecken, Schultern bleiben unten."] },
  Shoulder_Stretch: { name: "Schulter quer", tipps: ["Einen gestreckten Arm vor dem Körper zur anderen Seite ziehen.", "Mit der anderen Hand am Oberarm sanft nachhelfen."] },
};

// Ablauf: [Übung, Sekunden, je Seite?] – Übungen aus UEBUNGEN sind auch erlaubt
const MOBILITY = [
  {
    id: "morgen", name: "Morgen-Routine", text: "Sanft wach werden: Wirbelsäule, Hüfte, Schultern.",
    ablauf: [["Cat_Stretch", 45], ["Arm_Circles", 30], ["Standing_Hip_Circles", 30, true], ["Worlds_Greatest_Stretch", 30, true], ["Kneeling_Hip_Flexor", 30, true], ["Spinal_Stretch", 20, true], ["Childs_Pose", 45]],
  },
  {
    id: "aufwaermen", name: "Aufwärmen vor dem Training", text: "Dynamisch, damit Gelenke und Muskeln bereit sind.",
    ablauf: [["Arm_Circles", 30], ["Dynamic_Chest_Stretch", 30], ["Front_Leg_Raises", 20, true], ["Standing_Hip_Circles", 20, true], ["Inchworm", 45], ["Worlds_Greatest_Stretch", 30, true], ["Bodyweight_Squat", 30]],
  },
  {
    id: "nachher", name: "Dehnen nach dem Training", text: "Runterkommen und die großen Muskelgruppen dehnen.",
    ablauf: [["On_Your_Side_Quad_Stretch", 30, true], ["Seated_Floor_Hamstring_Stretch", 30, true], ["Ankle_On_The_Knee", 30, true], ["Calf_Stretch_Hands_Against_Wall", 30, true], ["Elbows_Back", 30], ["One_Arm_Against_Wall", 30, true], ["Childs_Pose", 45]],
  },
  {
    id: "huefte", name: "Hüfte & unterer Rücken", text: "Gut nach langem Sitzen.",
    ablauf: [["Pelvic_Tilt_Into_Bridge", 45], ["Hug_Knees_To_Chest", 45], ["Kneeling_Hip_Flexor", 45, true], ["Ankle_On_The_Knee", 45, true], ["Side_Lying_Groin_Stretch", 30, true], ["Hip_Circles_prone", 20, true], ["Runners_Stretch", 30, true], ["Childs_Pose", 60]],
  },
  {
    id: "schreibtisch", name: "Schultern & Nacken", text: "Kurze Pause vom Schreibtisch, geht auch im Stehen.",
    ablauf: [["Shoulder_Circles", 30], ["Side_Neck_Stretch", 30, true], ["Chin_To_Chest_Stretch", 30], ["Elbows_Back", 30], ["Upper_Back_Stretch", 30], ["Shoulder_Stretch", 30, true], ["Standing_Lateral_Stretch", 30, true], ["Overhead_Stretch", 30]],
  },
];

const STANDARD_EINSTELLUNGEN = {
  ton: true,
  pause: { verbund: 90, isolation: 60 },
  pauseEigen: false, // true, sobald du die Pausen selbst einstellst – dann bleiben sie
  wechsel: 5, // Sekunden zwischen Mobility-Übungen
};

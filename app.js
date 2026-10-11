"use strict";

// ================= Hilfsfunktionen =================

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clone = (x) => JSON.parse(JSON.stringify(x));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const neueId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const zahl = (x) => (x == null ? "" : Number(x).toLocaleString("de-DE", { maximumFractionDigits: 2 }));
const parseZahl = (s) => {
  const n = parseFloat(String(s ?? "").replace(",", ".").trim());
  return isNaN(n) ? null : n;
};
const rund = (x, schritt) => Math.round(Math.round(x / schritt) * schritt * 100) / 100;

// ================= Datum =================

const TAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const TAGE_LANG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const MONATE = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."];
const MONATE_LANG = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function datumKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function keyDatum(k) {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addTage(k, n) {
  const d = keyDatum(k);
  d.setDate(d.getDate() + n);
  return datumKey(d);
}
const wochentag = (k) => (keyDatum(k).getDay() + 6) % 7; // 0 = Montag
const montag = (k) => addTage(k, -wochentag(k));
const heute = () => datumKey(new Date());
const kurzDatum = (k) => { const d = keyDatum(k); return `${d.getDate()}.${d.getMonth() + 1}.`; };
const langDatum = (k) => { const d = keyDatum(k); return `${TAGE_LANG[wochentag(k)]}, ${d.getDate()}. ${MONATE[d.getMonth()]}`; };

function fmtDauer(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sek = s % 60;
  const zwei = (x) => String(x).padStart(2, "0");
  return h ? `${h}:${zwei(m)}:${zwei(sek)}` : `${m}:${zwei(sek)}`;
}
const fmtMin = (ms) => `${Math.max(1, Math.round(ms / 60000))} Min.`;

// ================= Übungen =================

const uebung = (id) => UEBUNGEN[id] || DEHNUNGEN[id] || { name: id, tipps: [], geraete: [], art: "isolation", einheit: "wdh", level: 1 };
const bild = (id, n = 0) => `bilder/${id}-${n}.jpg`;
const bildKlein = (id, klasse = "mini") => `<img class="${klasse}" src="${bild(id)}" alt="" loading="lazy">`;
// Die zwei Bilder (Start- und Endposition) wechseln sich ab – wirkt wie eine kleine Animation
const bildWechsel = (id) =>
  `<div class="bild-wechsel"><img src="${bild(id, 0)}" alt=""><img src="${bild(id, 1)}" alt="" aria-hidden="true"></div>`;
const jeHantel = (id) => { const u = uebung(id); return u.einheit === "kg" && u.geraete.includes("kh"); };

// Eintrag in geraete: "kh" = nötig, ["latzug", "kabel"] = eins davon reicht
const geraetDa = (g, p) => (Array.isArray(g) ? g.some((x) => p.geraete.includes(x)) : p.geraete.includes(g));
const geraetName = (g) => (Array.isArray(g) ? g.map((x) => GERAETE[x]).join(" oder ") : GERAETE[g]);
const hatGeraete = (id, p = state.profil) => !p || uebung(id).geraete.every((g) => geraetDa(g, p));
const fehlendeGeraete = (id, p = state.profil) => (p ? uebung(id).geraete.filter((g) => !geraetDa(g, p)) : []);
const verfuegbar = (id, p) => hatGeraete(id, p) && UEBUNGEN[id].level <= ERFAHRUNG[p.erfahrung].level;
const belastet = (id, p) => (UEBUNGEN[id].belastet || []).some((b) => p.beschwerden.includes(b));

// Passende Übungen für ein Bewegungsmuster; was bei deinen Beschwerden stärker belastet, kommt nach hinten
function kandidaten(muster, p) {
  const ids = MUSTER[muster].ids.filter((id) => verfuegbar(id, p));
  return [...ids.filter((id) => !belastet(id, p)), ...ids.filter((id) => belastet(id, p))];
}

const saetzeStandard = (id, p = state.profil) => ERFAHRUNG[p?.erfahrung || "anfaenger"].saetze[uebung(id).art];

const mitGewicht = (id) => UEBUNGEN[id].einheit === "kg";

// Geräte, die eine Übung bei dir belegt (die Bank zählt nicht als eigenes Gerät)
const geraeteVon = (id, p) => uebung(id).geraete.flat().filter((g) => g !== "bank" && p.geraete.includes(g));
const bringtNeuesGeraet = (id, p, belegt) => geraeteVon(id, p).some((g) => !belegt.has(g));

// Wählt aus den Kandidaten: Variante bestimmt den Startpunkt; mit "Gerätevielfalt" gewinnt
// die erste Übung, die ein in dieser Einheit noch unbenutztes Gerät bringt
function waehle(auswahl, variante, p, belegt) {
  const start = (+variante || 0) % auswahl.length;
  const reihe = [...auswahl.slice(start), ...auswahl.slice(0, start)];
  return (p.vielfalt !== false && reihe.find((id) => bringtNeuesGeraet(id, p, belegt))) || reihe[0];
}

// Welche Muskelgruppe ein Bewegungsmuster hauptsächlich trainiert
const MUSTER_GRUPPE = {};
for (const [g, info] of Object.entries(GRUPPEN)) for (const m of info.muster) MUSTER_GRUPPE[m] ??= g;

function einheitBauen(vorlage, p) {
  const anzahl = DAUER[p.dauer] || 5;
  const genutzt = new Set(), belegt = new Set(), uebungen = [], muster = new Set();
  for (const [i, eintrag] of [...vorlage.muster, ...FUELLER].entries()) {
    if (uebungen.length >= anzahl) break;
    const [m, variante] = eintrag.split(":");
    // Lückenfüller: kein Muster doppelt und nur Gruppen, die zur Einheit passen
    const fueller = i >= vorlage.muster.length;
    if (fueller && (muster.has(m) || (vorlage.fokus && MUSTER_GRUPPE[m] && !vorlage.fokus.includes(MUSTER_GRUPPE[m])))) continue;
    const k = kandidaten(m, p).filter((id) => !genutzt.has(id));
    if (!k.length) continue;
    muster.add(m);
    // Varianten nur unter Übungen derselben Art wählen: gibt es eine mit Gewicht, keine ohne nehmen
    const id = waehle(k.filter((x) => mitGewicht(x) === mitGewicht(k[0])), variante, p, belegt);
    genutzt.add(id);
    geraeteVon(id, p).forEach((g) => belegt.add(g));
    uebungen.push({ id, saetze: saetzeStandard(id, p) });
  }
  return uebungen;
}

function planErstellen(p) {
  // Ohne Geräte gibt es zu wenige Übungen für Push/Pull-Tage – dann Ganzkörper A/B/C im Wechsel
  const maxEinheiten = p.geraete.length ? 6 : 3;
  const split = SPLITS[clamp(p.tage.length, 1, maxEinheiten)];
  const einheiten = split.einheiten.map((typ) => ({
    id: neueId(), typ, name: EINHEIT_VORLAGEN[typ].name, uebungen: einheitBauen(EINHEIT_VORLAGEN[typ], p),
  }));
  const plan = { split: split.name, erstellt: heute(), einheiten };
  ausgleichen(plan, p);
  return plan;
}

// ================= Muskelbalance =================

// Sätze pro Woche je Muskelgruppe (Mitarbeit zählt halb). Gibt es weniger Einheiten als
// Trainingstage, kommt jede Einheit entsprechend öfter dran.
function wochenVolumen(plan, p) {
  const proWoche = p.tage.length / Math.max(1, plan.einheiten.length);
  const v = Object.fromEntries(Object.keys(GRUPPEN).map((g) => [g, 0]));
  for (const e of plan.einheiten) {
    for (const x of e.uebungen) {
      for (const [g, f] of Object.entries(MUSKELN[x.id] || {})) v[g] += x.saetze * f * proWoche;
    }
  }
  return v;
}
const zielBereich = (g, p) => { const [a, b] = VOLUMEN[p.erfahrung]; return [a * (GRUPPEN[g].min ?? 1), b]; };
const satzSekunden = (id, p) => 45 + ZIELE[p.ziel].pause[uebung(id).art];
const einheitSekunden = (e, p) => e.uebungen.reduce((t, x) => t + x.saetze * satzSekunden(x.id, p), 0);
// Zeit fürs Krafttraining: geplante Dauer minus Aufwärmen
const zeitBudget = (p) => (p.dauer - (p.cardio === "nein" ? 0 : CARDIO_MINUTEN.aufwaermen)) * 60;
const darfGruppe = (e, g) => (EINHEIT_VORLAGEN[e.typ]?.fokus || Object.keys(GRUPPEN)).includes(g);

// Bringt jede Muskelgruppe möglichst in ihren Zielbereich – innerhalb der Trainingszeit.
// Erst zu viel abbauen, dann fehlende Gruppen auffüllen: zuerst +1 Satz bei einer passenden Übung,
// sonst eine neue Übung für die Gruppe. Gibt die Zahl der Änderungen zurück.
function ausgleichen(plan, p) {
  const maxSaetze = 4; // mehr Sätze pro Übung bringen wenig – dann lieber eine zweite Übung
  const proWoche = p.tage.length / Math.max(1, plan.einheiten.length);
  let aenderungen = 0;
  for (let runde = 0; runde < 60; runde++) {
    const v = wochenVolumen(plan, p);
    // Würde ein weiterer Satz dieser Übung eine Gruppe über die Obergrenze treiben?
    const sprengt = (id) => Object.entries(MUSKELN[id] || {}).some(([g, f]) => v[g] + f * proWoche > zielBereich(g, p)[1] + 0.01);

    // 1. Zu viel: Isolationssätze der Gruppe abbauen (nicht unter 2)
    const zuViel = Object.keys(GRUPPEN).find((g) => v[g] > zielBereich(g, p)[1] + 0.01);
    if (zuViel) {
      const x = plan.einheiten.flatMap((e) => e.uebungen)
        .filter((u) => (MUSKELN[u.id]?.[zuViel] || 0) >= 1 && u.saetze > 2)
        .sort((a, b) => (uebung(a.id).art === "isolation" ? -1 : 1) - (uebung(b.id).art === "isolation" ? -1 : 1) || b.saetze - a.saetze)[0];
      if (x) { x.saetze--; aenderungen++; continue; }
    }

    // 2. Zu wenig: größtes Defizit (relativ) zuerst
    const defizite = Object.keys(GRUPPEN)
      .map((g) => [g, (zielBereich(g, p)[0] - v[g]) / zielBereich(g, p)[0]])
      .filter(([, d]) => d > 0.01)
      .sort((a, b) => b[1] - a[1]);
    let geschafft = false;
    for (const [g] of defizite) {
      // a) +1 Satz bei einer Übung, die die Gruppe als Hauptmuskel trainiert
      const kandidat = plan.einheiten.flatMap((e) => {
        const rest = zeitBudget(p) - einheitSekunden(e, p);
        return e.uebungen
          .filter((x) => (MUSKELN[x.id]?.[g] || 0) >= 1 && x.saetze < maxSaetze && satzSekunden(x.id, p) <= rest && !sprengt(x.id))
          .map((x) => ({ x, rest }));
      }).sort((a, b) => a.x.saetze - b.x.saetze || b.rest - a.rest)[0];
      if (kandidat) { kandidat.x.saetze++; geschafft = true; break; }

      // b) neue Übung (2 Sätze) in der Einheit mit der meisten freien Zeit, die zur Gruppe passt
      const einheiten = plan.einheiten
        .filter((e) => darfGruppe(e, g))
        .map((e) => ({ e, rest: zeitBudget(p) - einheitSekunden(e, p) }))
        .sort((a, b) => b.rest - a.rest);
      for (const { e, rest } of einheiten) {
        const vorhanden = new Set(e.uebungen.map((x) => x.id));
        const belegt = new Set(e.uebungen.flatMap((x) => geraeteVon(x.id, p)));
        const passend = GRUPPEN[g].muster.flatMap((m) => kandidaten(m, p))
          .filter((id, i, l) => l.indexOf(id) === i && !vorhanden.has(id) && 2 * satzSekunden(id, p) <= rest && !sprengt(id));
        // Am liebsten Übungen, die die Gruppe als Hauptmuskel trainieren
        const haupt = passend.filter((id) => (MUSKELN[id]?.[g] || 0) >= 1);
        const liste = haupt.length ? haupt : passend;
        if (!liste.length) continue;
        const id = waehle(liste, 0, p, belegt);
        // Verbundübungen vor die Isolationsübungen, sonst ans Ende
        const pos = uebung(id).art === "verbund" ? e.uebungen.findIndex((x) => uebung(x.id).art === "isolation") : -1;
        e.uebungen.splice(pos < 0 ? e.uebungen.length : pos, 0, { id, saetze: 2 });
        geschafft = true;
        break;
      }
      if (geschafft) break;
    }
    if (!geschafft) break;
    aenderungen++;
  }
  return aenderungen;
}

// Wiederholungsbereich: bei Gewichtsübungen nach Ziel, sonst Grundbereich + bisherige Steigerung
function bereich(id) {
  const u = uebung(id), plus = state.stand[id]?.plus || 0;
  if (u.einheit === "sek") return [BEREICH_SEK[0] + plus, BEREICH_SEK[1] + plus];
  if (u.einheit === "wdh") return BEREICH_KOERPER[u.art].map((x) => x + plus);
  return ZIELE[state.profil?.ziel || "muskel"][u.art];
}
const pauseFuer = (id) => state.einstellungen.pause[uebung(id).art] || 90;

function zielText(id, saetze) {
  const u = uebung(id), [a, b] = bereich(id);
  return `${saetze} × ${a}–${b}${u.einheit === "sek" ? " Sek." : ""}${u.jeSeite ? " je Seite" : ""}`;
}
function gewichtText(id) {
  const kg = state.stand[id]?.gewicht;
  if (uebung(id).einheit !== "kg" || kg == null) return "";
  return `${zahl(kg)} kg${jeHantel(id) ? " je Hantel" : ""}`;
}

// "60 kg × 10, 10, 9" oder "60×10, 62,5×8" oder "12, 11, 10"
function saetzeKurz(id, saetze) {
  const u = uebung(id);
  if (!saetze.length) return "";
  if (u.einheit === "sek") return saetze.map((s) => `${s.wdh} s`).join(", ");
  if (u.einheit !== "kg") return `${saetze.map((s) => s.wdh).join(", ")} Wdh.`;
  const gleich = saetze.every((s) => s.kg === saetze[0].kg);
  if (gleich) return `${zahl(saetze[0].kg)} kg × ${saetze.map((s) => s.wdh).join(", ")}`;
  return saetze.map((s) => `${zahl(s.kg)}×${s.wdh}`).join(", ");
}

function letzteAusfuehrung(id) {
  for (let i = state.verlauf.length - 1; i >= 0; i--) {
    const t = state.verlauf[i];
    if (t.typ !== "kraft") continue;
    const u = t.uebungen.find((x) => x.id === id);
    if (u) return { datum: t.datum, saetze: u.saetze };
  }
  return null;
}

// Geschätztes Maximum für eine Wiederholung (Epley)
const e1rm = (kg, wdh) => (wdh <= 1 ? kg : kg * (1 + wdh / 30));
// Eine Zahl, mit der sich Sätze vergleichen lassen: bei Gewichtsübungen das geschätzte Maximum, sonst Wdh./Sek.
const leistung = (id, s) => (uebung(id).einheit === "kg" ? e1rm(s.kg || 0, s.wdh) : s.wdh);
function bestwert(id) {
  let best = null;
  for (const t of state.verlauf) {
    if (t.typ !== "kraft") continue;
    const u = t.uebungen.find((x) => x.id === id);
    if (u) for (const s of u.saetze) best = Math.max(best ?? -Infinity, leistung(id, s));
  }
  return best;
}

const dauerSchaetzen = (e) =>
  Math.max(5, Math.round(e.uebungen.reduce((t, x) => t + x.saetze * (45 + pauseFuer(x.id)), 0) / 60 / 5) * 5);

// ================= Zustand =================

const SPEICHER_KEY = "trainingsplaner-v1";

function neuerState() {
  return {
    version: 1,
    profil: null,   // Antworten aus dem Fragebogen
    plan: null,     // { split, erstellt, einheiten: [{ id, name, uebungen: [{ id, saetze }] }] }
    naechste: 0,    // Index der nächsten Einheit
    stand: {},      // Übung -> { gewicht, plus, fehl, zuletzt }: Grundlage für die Steigerung
    verlauf: [],    // abgeschlossene Trainings (typ "kraft") und Mobility-Routinen (typ "mobility")
    aktiv: null,    // laufendes Training
    einstellungen: clone(STANDARD_EINSTELLUNGEN),
  };
}

function laden(roh) {
  let s = null;
  try { s = JSON.parse(roh ?? localStorage.getItem(SPEICHER_KEY)); } catch { s = null; }
  const basis = neuerState();
  if (!s || typeof s !== "object" || !Array.isArray(s.verlauf)) return basis;
  for (const k of Object.keys(basis)) if (s[k] === undefined) s[k] = basis[k];
  s.einstellungen = { ...basis.einstellungen, ...s.einstellungen, pause: { ...basis.einstellungen.pause, ...s.einstellungen?.pause } };
  // Profil v2: Geräte feiner aufgeteilt (Beinpresse, Bauchmaschine, Latzug, Dipbarren) und Cardio-Frage
  if (s.profil && !s.profil.v) {
    const g = new Set(s.profil.geraete);
    if (g.has("maschine")) { g.add("beinpresse"); g.add("bauch"); }
    if (g.has("kabel")) g.add("latzug");
    if (g.has("stange")) g.add("barren");
    s.profil.geraete = [...g];
    s.profil.cardio ||= "aufwaermen";
    s.profil.v = 2;
  }
  if (s.profil) { s.profil.vielfalt ??= true; s.profil.cardioProWoche ??= 2; }
  // Pausen auf die neuen Standards heben, sofern noch ein alter Standardwert eingestellt ist
  const pause = s.einstellungen.pause;
  if (ALTE_PAUSEN.some((x) => x.verbund === pause.verbund && x.isolation === pause.isolation)) {
    s.einstellungen.pause = clone(ZIELE[s.profil?.ziel || "muskel"].pause);
  }
  // "Draußen" heißt jetzt Joggen bzw. Radfahren
  for (const t of s.verlauf) if (t.typ === "cardio" && !CARDIO[t.geraet]) { t.geraet = "joggen"; t.name = CARDIO.joggen.name; }
  // Übungen, die es nicht mehr gibt, aus Plan und laufendem Training entfernen
  if (s.plan) for (const e of s.plan.einheiten) e.uebungen = e.uebungen.filter((x) => UEBUNGEN[x.id]);
  if (s.aktiv) {
    s.aktiv.uebungen = s.aktiv.uebungen.filter((x) => UEBUNGEN[x.id]);
    s.aktiv.cardio ||= [];
  }
  return s;
}

let state = laden();

function speichern() {
  try { localStorage.setItem(SPEICHER_KEY, JSON.stringify(state)); }
  catch { toast("Speichern nicht möglich (privater Modus?)"); }
}

// ================= Training: Ablauf & Steigerung =================

function neueSessionUebung(id, anzahl) {
  const kg = uebung(id).einheit === "kg" ? state.stand[id]?.gewicht ?? null : null;
  return {
    id,
    letzte: letzteAusfuehrung(id),
    saetze: Array.from({ length: anzahl }, () => ({ kg, wdh: null, fertig: false })),
  };
}

function trainingStarten(index) {
  if (state.aktiv) { toast("Es läuft schon ein Training"); ui.tab = "training"; closeModal(); render(); return; }
  const e = state.plan.einheiten[index];
  state.aktiv = {
    einheit: e.id, name: e.name, start: Date.now(), pauseEnde: null, pauseDauer: 0,
    uebungen: e.uebungen.map((x) => neueSessionUebung(x.id, x.saetze)),
    cardio: cardioPlan(),
  };
  ui.tab = "training";
  closeModal();
  speichernRender();
  window.scrollTo(0, 0);
}

// ================= Cardio =================

// Vorhandene Ausdauergeräte; "Draußen" geht immer, außer zum Aufwärmen im Studio
const cardioGeraete = (art = "ausdauer", p = state.profil) =>
  Object.keys(CARDIO).filter((k) => (CARDIO[k].immer ? art !== "aufwaermen" : p?.geraete.includes(k)));

function letztesCardioGeraet(art, erlaubt) {
  for (let i = state.verlauf.length - 1; i >= 0; i--) {
    const t = state.verlauf[i];
    if (t.typ === "cardio" && t.art === art && erlaubt.includes(t.geraet)) return t.geraet;
  }
  return null;
}

// Cardio-Blöcke für ein neues Training: Aufwärmen vorne, Ausdauer am Ende (je nach Fragebogen)
function cardioPlan() {
  const p = state.profil;
  if (!p || p.cardio === "nein") return [];
  const arten = p.cardio === "danach" ? ["aufwaermen", "ausdauer"] : ["aufwaermen"];
  return arten.map((art) => {
    const erlaubt = cardioGeraete(art);
    return { art, geraet: letztesCardioGeraet(art, erlaubt) || erlaubt[0] || null, minuten: CARDIO_MINUTEN[art], km: null, fertig: false };
  });
}

const cardioEintrag = (c, start, sitzung) => ({
  id: neueId(), typ: "cardio", geraet: c.geraet, art: c.art, name: CARDIO[c.geraet].name,
  datum: datumKey(new Date(start)), start, ende: start + c.minuten * 60000, minuten: c.minuten, km: c.km, sitzung,
});
// Beim Laufen ist die Pace (Minuten pro km) üblich, beim Radfahren km/h
const paceText = (min) => { const s = Math.round(min * 60); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const tempoWert = (t) => (CARDIO[t.geraet]?.pace ? t.minuten / t.km : Math.round((t.km / t.minuten) * 600) / 10);
const tempoText = (t) => (!t.km ? "" : CARDIO[t.geraet]?.pace ? `${paceText(tempoWert(t))} /km` : `${zahl(tempoWert(t))} km/h`);
const cardioText = (t) => [`${t.minuten} Min.`, t.km ? `${zahl(t.km)} km` : "", tempoText(t)].filter(Boolean).join(" · ");

// Zielwiederholungen für einen Satz: letztes Mal +1 (gleiches Gewicht), sonst untere Grenze
function zielWdh(u, s) {
  const [a, b] = bereich(u.id), ex = uebung(u.id);
  const l = u.letzte?.saetze[s] || u.letzte?.saetze.at(-1);
  if (!l) return a;
  if (ex.einheit === "kg" && l.kg !== u.saetze[s].kg) return a;
  return clamp(l.wdh + (ex.einheit === "sek" ? 5 : 1), a, b);
}

// Doppelte Progression: erst Wiederholungen bis zur oberen Grenze, dann mehr Gewicht.
// Zweimal hintereinander unter der unteren Grenze -> 10 % leichter.
function auswerten(u) {
  const ex = uebung(u.id);
  const fertig = u.saetze.filter((s) => s.fertig && s.wdh > 0);
  if (!fertig.length) return null;
  const [min, max] = bereich(u.id);
  const alt = state.stand[u.id] || { gewicht: null, plus: 0, fehl: 0 };
  const neu = { ...alt, zuletzt: heute() };
  const alleSaetze = fertig.length >= u.saetze.length;
  let text, hoch = false;

  if (ex.einheit === "kg") {
    const kg = Math.max(...fertig.map((s) => s.kg || 0));
    const arbeit = fertig.filter((s) => (s.kg || 0) === kg);
    neu.gewicht = kg;
    if (alleSaetze && arbeit.length === fertig.length && arbeit.every((s) => s.wdh >= max)) {
      neu.gewicht = rund(kg + ex.schritt, ex.schritt);
      neu.fehl = 0;
      hoch = true;
      text = `Nächstes Mal ${zahl(neu.gewicht)} kg`;
    } else if (arbeit.some((s) => s.wdh < min)) {
      neu.fehl = (alt.gewicht === kg ? alt.fehl || 0 : 0) + 1;
      if (neu.fehl >= 2) {
        neu.gewicht = Math.max(0, Math.floor((kg * 0.9) / ex.schritt) * ex.schritt);
        neu.fehl = 0;
        text = `Zweimal unter ${min} Wdh. – nächstes Mal ${zahl(neu.gewicht)} kg`;
      } else {
        text = `Bei ${zahl(kg)} kg bleiben und ${min}+ Wdh. schaffen`;
      }
    } else {
      neu.fehl = 0;
      text = `Bei ${zahl(kg)} kg bleiben, Wdh. steigern bis ${max}`;
    }
  } else {
    const schritt = ex.einheit === "sek" ? 5 : 2;
    if (alleSaetze && fertig.every((s) => s.wdh >= max)) {
      neu.plus = (alt.plus || 0) + schritt;
      hoch = true;
      text = `Ziel steigt auf ${min + schritt}–${max + schritt}${ex.einheit === "sek" ? " Sek." : " Wdh."}`;
      if (ex.einheit === "wdh" && max + schritt > 25) text += " – Zeit für eine schwerere Variante (Tauschen)";
    } else {
      text = `Ziel bleibt ${min}–${max}${ex.einheit === "sek" ? " Sek." : " Wdh."}`;
    }
  }
  state.stand[u.id] = neu;
  return { id: u.id, text, hoch };
}

function trainingBeenden() {
  const a = state.aktiv;
  const uebungen = a.uebungen
    .map((u) => ({ id: u.id, saetze: u.saetze.filter((s) => s.fertig && s.wdh > 0).map(({ kg, wdh }) => ({ kg, wdh })) }))
    .filter((u) => u.saetze.length);
  const cardio = (a.cardio || []).filter((c) => c.fertig && c.geraet && c.minuten > 0);
  if (!uebungen.length && !cardio.length) { toast("Noch kein Satz abgehakt"); return; }
  if (!uebungen.length) {
    for (const c of cardio) state.verlauf.push(cardioEintrag(c, a.start));
    state.aktiv = null;
    ui.pauseFertigBis = 0;
    speichernRender();
    toast("Cardio gespeichert");
    return;
  }

  // Rekorde vor dem Speichern prüfen (nur wenn es schon einen Vergleichswert gibt)
  const rekorde = uebungen.flatMap((u) => {
    const vorher = bestwert(u.id);
    const jetzt = Math.max(...u.saetze.map((s) => leistung(u.id, s)));
    return vorher != null && jetzt > vorher + 0.01 ? [u.id] : [];
  });
  const meldungen = a.uebungen.map(auswerten).filter(Boolean);
  const eintrag = {
    id: neueId(), typ: "kraft", einheit: a.einheit, name: a.name,
    datum: datumKey(new Date(a.start)), start: a.start, ende: Date.now(), uebungen,
  };
  state.verlauf.push(eintrag);
  // Cardio aus dem Training als eigene Einträge, mit Verweis auf das Training
  const cardioEintraege = cardio.map((c) => cardioEintrag(c, a.start, eintrag.id));
  state.verlauf.push(...cardioEintraege);
  const idx = state.plan?.einheiten.findIndex((e) => e.id === a.einheit) ?? -1;
  if (idx >= 0) state.naechste = (idx + 1) % state.plan.einheiten.length;
  state.aktiv = null;
  ui.pauseFertigBis = 0;
  speichernRender();
  window.scrollTo(0, 0);
  zusammenfassungZeigen(eintrag, meldungen, rekorde, cardioEintraege);
}

function pauseStarten(sek) {
  const a = state.aktiv;
  a.pauseEnde = Date.now() + sek * 1000;
  a.pauseDauer = sek;
  ui.pauseFertigBis = 0;
}

// ================= Ton, Vibration, Bildschirm an =================

let audio = null;
function audioBereit() {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
  } catch { audio = null; }
}
function piep(freq = 880, dauer = 0.15, verzoegerung = 0) {
  if (!state.einstellungen.ton || !audio) return;
  try {
    const t = audio.currentTime + verzoegerung;
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + dauer + 0.05);
  } catch { /* kein Ton möglich */ }
}
// Vibrieren erlauben Browser erst nach einer Berührung (iPhones vibrieren über den Browser gar nicht)
const vibrieren = (muster) => { if (navigator.userActivation?.hasBeenActive !== false) navigator.vibrate?.(muster); };
function signal(art) {
  if (art === "tick") return piep(660, 0.07);
  if (art === "start") { piep(990, 0.3); vibrieren(200); return; }
  piep(880, 0.15);
  piep(880, 0.15, 0.22);
  vibrieren([200, 100, 200]);
}

let wakeLock = null, wakeLockWartet = false, wakeLockGeht = "wakeLock" in navigator;
function wachHaltenPruefen() {
  const brauchen = (!!ui.mob && !ui.mob.pausiert) || !!state.aktiv?.pauseEnde;
  if (brauchen && !wakeLock && !wakeLockWartet && wakeLockGeht && document.visibilityState === "visible") {
    wakeLockWartet = true;
    navigator.wakeLock.request("screen")
      .then((l) => { wakeLock = l; l.addEventListener("release", () => { wakeLock = null; }); })
      .catch(() => { wakeLockGeht = false; })
      .finally(() => { wakeLockWartet = false; });
  } else if (!brauchen && wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}

// ================= Takt: Trainingsdauer, Pause, Mobility =================

let letzterPausenPiep = null;
function tick() {
  const jetzt = Date.now();
  const a = state.aktiv;
  const dauer = $("#dauer");
  if (dauer && a) dauer.textContent = fmtDauer(jetzt - a.start);

  const leiste = $("#pausenleiste");
  if (a?.pauseEnde) {
    const rest = a.pauseEnde - jetzt;
    if (rest <= 0) {
      a.pauseEnde = null;
      speichern();
      signal("ende");
      ui.pauseFertigBis = jetzt + 4000;
    } else {
      const s = Math.ceil(rest / 1000);
      if (s <= 3 && letzterPausenPiep !== s) { letzterPausenPiep = s; signal("tick"); }
      if (s > 3) letzterPausenPiep = null;
      leiste.classList.remove("fertig");
      $("#pl-label").textContent = "Pause";
      $("#pl-zeit").textContent = fmtDauer(rest);
      $("#pl-fortschritt").style.width = `${clamp(100 - rest / (a.pauseDauer * 10), 0, 100)}%`;
    }
  }
  const zeigen = !!a?.pauseEnde || (!!a && ui.pauseFertigBis > jetzt);
  if (a && !a.pauseEnde && zeigen) {
    leiste.classList.add("fertig");
    $("#pl-label").textContent = "Pause vorbei";
    $("#pl-zeit").textContent = "Nächster Satz";
    $("#pl-fortschritt").style.width = "100%";
  }
  if (leiste.hidden === zeigen) {
    leiste.hidden = !zeigen;
    document.body.classList.toggle("mit-leiste", zeigen);
  }

  mobTick(jetzt);
  wachHaltenPruefen();
}

// ================= Mobility =================

function mobSchritte(r) {
  return r.ablauf.flatMap(([id, sek, seiten]) =>
    (seiten ? [{ id, sek, seite: "Links" }, { id, sek, seite: "Rechts" }] : [{ id, sek }]));
}
function mobDauer(r) {
  const s = mobSchritte(r);
  return s.reduce((t, x) => t + x.sek, 0) + s.length * state.einstellungen.wechsel;
}
// Vorbereitungszeit vor einem Schritt: kürzer, wenn nur die Seite wechselt
function mobPhaseDauer(m) {
  if (m.phase === "laeuft") return m.schritte[m.i].sek;
  const vorher = m.schritte[m.i - 1];
  if (vorher && vorher.id === m.schritte[m.i].id) return Math.min(3, state.einstellungen.wechsel);
  return state.einstellungen.wechsel;
}
function mobPhaseSetzen(m, phase) {
  m.phase = phase;
  m.dauer = mobPhaseDauer(m);
  if (m.phase === "bereit" && m.dauer <= 0) m.phase = "laeuft", m.dauer = mobPhaseDauer(m);
  m.ende = Date.now() + m.dauer * 1000;
  m.rest = null;
  m.pausiert = false;
}

function mobStarten(rid) {
  const r = MOBILITY.find((x) => x.id === rid);
  ui.mob = { rid, schritte: mobSchritte(r), i: 0, start: Date.now(), erledigt: 0, sekunden: 0 };
  mobPhaseSetzen(ui.mob, "bereit");
  closeModal();
  ui.tab = "mobility";
  render();
  window.scrollTo(0, 0);
}

function mobVor(m, manuell = false) {
  if (m.phase === "bereit") {
    mobPhaseSetzen(m, "laeuft");
  } else {
    m.erledigt++;
    m.sekunden += manuell ? Math.round(m.dauer - Math.max(0, m.ende - Date.now()) / 1000) : m.dauer;
    m.i++;
    if (m.i >= m.schritte.length) return mobFertig(true);
    mobPhaseSetzen(m, "bereit");
  }
  render();
}

function mobZurueck(m) {
  const lief = m.phase === "laeuft" && m.dauer * 1000 - (m.ende - Date.now()) > 3000;
  if (!lief && m.i > 0) m.i--;
  mobPhaseSetzen(m, "bereit");
  render();
}

function mobFertig(komplett) {
  const m = ui.mob, r = MOBILITY.find((x) => x.id === m.rid);
  ui.mob = null;
  if (komplett || m.erledigt >= m.schritte.length / 2) {
    state.verlauf.push({
      id: neueId(), typ: "mobility", routine: r.id, name: r.name, datum: heute(),
      start: m.start, ende: Date.now(), sekunden: m.sekunden,
    });
    speichern();
    if (komplett) signal("ende");
    toast(komplett ? `${r.name} geschafft` : "Gespeichert");
  }
  render();
}

function mobTick(jetzt) {
  const m = ui.mob;
  if (!m || m.pausiert) return;
  const rest = m.ende - jetzt;
  if (rest <= 0) {
    signal(m.phase === "bereit" ? "start" : "ende");
    mobVor(m);
    return;
  }
  const s = Math.ceil(rest / 1000);
  const zeit = $("#mob-zeit");
  if (zeit) zeit.textContent = s;
  const ring = $("#mob-ring");
  if (ring) ring.style.strokeDashoffset = String(RING_UMFANG * (rest / (m.dauer * 1000)));
  const key = `${m.i}-${m.phase}-${s}`;
  if (s <= 3 && m.letzterPiep !== key) { m.letzterPiep = key; signal("tick"); }
}

// ================= UI-Zustand & Grundgerüst =================

const ui = {
  tab: "training",
  verlaufAnsicht: "uebungen",
  picker: null,
  mob: null,
  pauseFertigBis: 0,
};

const TITEL = { training: "Training", verlauf: "Verlauf", mobility: "Mobility", mehr: "Einstellungen" };

function render() {
  const a = state.aktiv;
  $("#titel").textContent =
    ui.tab === "training" && a ? a.name : ui.tab === "training" && !state.profil ? "Willkommen" : TITEL[ui.tab];
  document.querySelectorAll(".tabbar button").forEach((b) => {
    b.classList.toggle("aktiv", b.dataset.tab === ui.tab);
    b.classList.toggle("laeuft", (b.dataset.tab === "training" && !!a) || (b.dataset.tab === "mobility" && !!ui.mob));
  });
  const ansichten = {
    training: a ? renderSession : state.profil && state.plan ? renderTraining : renderWillkommen,
    verlauf: renderVerlauf,
    mobility: ui.mob ? renderMobPlayer : renderMobility,
    mehr: renderMehr,
  };
  $("#main").innerHTML = ansichten[ui.tab]();
  tick();
}

function speichernRender() {
  speichern();
  render();
}

function openModal(html) {
  $("#modal .modal-blatt").innerHTML = html;
  $("#modal").hidden = false;
  document.body.classList.add("modal-offen");
}
function closeModal() {
  $("#modal").hidden = true;
  document.body.classList.remove("modal-offen");
  ui.picker = null;
}

let toastTimer;
function toast(text) {
  const el = $("#toast");
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2800);
}

const sheetKopf = (titel) =>
  `<div class="sheet-kopf"><h2>${esc(titel)}</h2><button class="icon-btn" data-action="modal-zu" aria-label="Schließen">×</button></div>`;

const ueZeile = (id, meta, aktion = "info", extra = "") =>
  `<button class="ue-zeile" data-action="${aktion}" data-id="${esc(id)}" ${extra}>${bildKlein(id)}
    <span class="ue-text"><span class="ue-name">${esc(uebung(id).name)}</span>${meta ? `<span class="ue-meta">${meta}</span>` : ""}</span>
  </button>`;

const ICON = {
  zurueck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M19 5L9 12l10 7z"/></svg>',
  vor: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14M5 5l10 7-10 7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>',
};

// ================= Fragebogen =================

const STANDARD_PROFIL = {
  ziel: "muskel", erfahrung: "anfaenger", tage: [0, 2, 4], dauer: 60, geraete: GERAETE_VORLAGEN.meins, beschwerden: [],
  cardio: "separat", cardioProWoche: 2, vielfalt: true,
};

function fragebogenHtml(p = state.profil || STANDARD_PROFIL) {
  const radio = (name, wert, titel, text, an) =>
    `<label class="wahl-karte"><input type="radio" name="${name}" value="${wert}" ${an ? "checked" : ""}>
      <span><strong>${esc(titel)}</strong>${text ? `<small>${esc(text)}</small>` : ""}</span></label>`;
  const chip = (name, wert, text, an, typ = "checkbox") =>
    `<label class="chip-check"><input type="${typ}" name="${name}" value="${wert}" ${an ? "checked" : ""}><span>${esc(text)}</span></label>`;
  return `<form class="formular fragebogen" data-form="fragebogen">
    <fieldset>
      <legend>Was ist dein Ziel?</legend>
      <div class="wahl">${Object.entries(ZIELE).map(([k, z]) => radio("ziel", k, z.name, z.text, p.ziel === k)).join("")}</div>
    </fieldset>
    <fieldset>
      <legend>Wie lange machst du schon Krafttraining?</legend>
      <div class="wahl">${Object.entries(ERFAHRUNG).map(([k, e]) => radio("erfahrung", k, e.name, e.text, p.erfahrung === k)).join("")}</div>
    </fieldset>
    <fieldset>
      <legend>An welchen Tagen willst du trainieren?</legend>
      <div class="chips">${TAGE.map((t, i) => chip("tage", i, t, p.tage.includes(i))).join("")}</div>
      <small>2–3 Tage: Ganzkörper · 4 Tage: Ober-/Unterkörper · 5–6 Tage: Push/Pull/Beine</small>
    </fieldset>
    <fieldset>
      <legend>Wie lange pro Training?</legend>
      <div class="chips">${Object.keys(DAUER).map((m) => chip("dauer", m, `${m} Min.`, +m === p.dauer, "radio")).join("")}</div>
    </fieldset>
    <fieldset>
      <legend>Welche Geräte hast du?</legend>
      <div class="chips vorlagen">
        <button type="button" class="chip" data-action="geraete-vorlage" data-vorlage="meins">Mein Studio</button>
        <button type="button" class="chip" data-action="geraete-vorlage" data-vorlage="studio">Großes Fitnessstudio</button>
        <button type="button" class="chip" data-action="geraete-vorlage" data-vorlage="zuhause">Zuhause mit Hanteln</button>
        <button type="button" class="chip" data-action="geraete-vorlage" data-vorlage="koerper">Nur Körpergewicht</button>
      </div>
      <div class="chips">${Object.entries(GERAETE).map(([k, n]) => chip("geraete", k, n, p.geraete.includes(k))).join("")}</div>
      <small><strong>Langhantel</strong> nur anhaken, wenn du eine freie Stange mit Scheiben hast – Multipresse oder ein Rack allein zählen nicht.</small>
      <small>Kurzhanteln in verschiedenen Gewichten reichen – die App schlägt Gewichte vor, du trägst ein, was du nimmst.</small>
      <label class="schalter"><input type="checkbox" name="vielfalt" value="1" ${p.vielfalt !== false ? "checked" : ""}>
        Möglichst viele verschiedene Geräte pro Training</label>
    </fieldset>
    <fieldset>
      <legend>Ausdauer</legend>
      <div class="wahl">${Object.entries(CARDIO_OPTIONEN).map(([k, o]) => radio("cardio", k, o.name, o.text, (p.cardio || "separat") === k)).join("")}</div>
      <p class="frage">Ausdauer-Einheiten pro Woche</p>
      <div class="chips">${[0, 1, 2, 3, 4].map((n) => chip("cardioProWoche", n, n ? `${n}×` : "keine", n === (p.cardioProWoche ?? 2), "radio")).join("")}</div>
      <p class="frage">Ausdauergeräte im Studio <small>(zum Aufwärmen)</small></p>
      <div class="chips">${Object.entries(CARDIO).filter(([, c]) => !c.immer).map(([k, c]) => chip("geraete", k, c.name, p.geraete.includes(k))).join("")}</div>
      <small>Joggen und Radfahren draußen gehen immer. Für den Muskelaufbau: Laufen möglichst nicht direkt vor dem Beintraining – ein paar Stunden oder einen Tag Abstand. Radfahren stört weniger.</small>
    </fieldset>
    <fieldset>
      <legend>Beschwerden? <small>optional</small></legend>
      <div class="chips">${Object.entries(BESCHWERDEN).map(([k, n]) => chip("beschwerden", k, n, p.beschwerden.includes(k))).join("")}</div>
      <small>Übungen, die diese Stelle stärker belasten, kommen nach hinten. Bei Schmerzen bitte ärztlich abklären.</small>
    </fieldset>
    <button class="btn primaer gross">Plan erstellen</button>
  </form>`;
}

function renderWillkommen() {
  return `<section class="karte">
      <h2>Dein Trainingsplan in einer Minute</h2>
      <p class="hinweis">Beantworte ein paar Fragen, dann stellt die App deinen Plan zusammen. Im Training trägst du Gewicht und Wiederholungen ein – die App sagt dir, wann du steigern kannst.</p>
    </section>
    ${fragebogenHtml()}`;
}

// ================= Ansicht: Training (Übersicht) =================

function renderTraining() {
  const p = state.profil, plan = state.plan, h = heute();
  if (!plan.einheiten.length) return `<p class="leer-hinweis">Kein Plan vorhanden.</p>`;
  const n = state.naechste % plan.einheiten.length;
  const e = plan.einheiten[n];
  const erledigt = state.verlauf.some((t) => t.typ === "kraft" && t.datum === h);
  let kopf = "Heute frei";
  if (erledigt) kopf = "Heute erledigt ✓";
  else if (p.tage.includes(wochentag(h))) kopf = "Heute ist Trainingstag";
  else {
    const tag = [1, 2, 3, 4, 5, 6, 7].map((d) => addTage(h, d)).find((d) => p.tage.includes(wochentag(d)));
    if (tag) kopf = `Heute frei · nächster Trainingstag: ${TAGE_LANG[wochentag(tag)]}`;
  }
  return `
    <section class="karte heute-karte">
      <span class="label">${esc(kopf)}</span>
      <h2>Als Nächstes: ${esc(e.name)}</h2>
      <p class="slot-meta">${e.uebungen.length} Übungen · ca. ${dauerSchaetzen(e)} Min.</p>
      <button class="btn primaer gross" data-action="start" data-index="${n}">Training starten</button>
      <button class="link-btn zentriert" data-action="cardio-eintragen">Nur Cardio eintragen</button>
    </section>
    ${renderWoche()}
    ${renderLanghantelHinweis()}
    <h3 class="kat-titel">Dein Plan · ${esc(plan.split)}</h3>
    ${plan.einheiten.map((x, i) => einheitKarte(x, i, i === n)).join("")}
    ${renderBalance()}
    <p class="hinweis zentriert-text">${ZIELE[p.ziel].name} · ${ERFAHRUNG[p.erfahrung].name} · ${p.dauer} Min.
      <button class="link-btn" data-action="fragebogen">Fragebogen ändern</button></p>`;
}

// Viele haken "Langhantel" an, obwohl sie nur Multipresse oder ein Rack haben – dann kurz nachfragen
function renderLanghantelHinweis() {
  const mitLh = state.plan.einheiten.flatMap((e) => e.uebungen).filter((x) => uebung(x.id).geraete.flat().includes("lh"));
  if (!mitLh.length) return "";
  const namen = [...new Set(mitLh.map((x) => uebung(x.id).name))].slice(0, 3).join(", ");
  return `<section class="karte hinweis-karte">
      <p><strong>Dein Plan nutzt eine freie Langhantel</strong> (z. B. ${esc(namen)}).</p>
      <p class="hinweis">Keine Langhantel? Im Fragebogen „Mein Studio“ wählen oder den Haken bei Langhantel entfernen – dann gibt es Multipresse und Kurzhanteln stattdessen.</p>
      <button class="btn klein" data-action="fragebogen">Fragebogen öffnen</button>
    </section>`;
}

// Sätze pro Woche je Muskelgruppe als Balken, grauer Bereich = Ziel
function renderBalance() {
  const p = state.profil, v = wochenVolumen(state.plan, p);
  const [, oben] = VOLUMEN[p.erfahrung];
  const skala = Math.max(oben * 1.25, ...Object.values(v));
  const pz = (x) => `${Math.min(100, (x / skala) * 100).toFixed(1)}%`;
  let abweichungen = 0;
  const zeilen = Object.entries(GRUPPEN).map(([g, info]) => {
    const [min, max] = zielBereich(g, p), wert = Math.round(v[g] * 2) / 2;
    const status = wert < min - 0.01 ? "unter" : wert > max + 0.01 ? "ueber" : "ok";
    if (status !== "ok") abweichungen++;
    const zeichen = { ok: "✓", unter: "↓", ueber: "↑" }[status];
    return `<div class="bz ${status}">
        <span class="bz-name">${esc(info.name)}</span>
        <span class="bz-spur" aria-hidden="true"><span class="bz-band" style="left:${pz(min)};width:calc(${pz(max)} - ${pz(min)})"></span><span class="bz-balken" style="width:${pz(wert)}"></span></span>
        <span class="bz-wert">${zahl(wert)} <span class="bz-zeichen">${zeichen}</span></span>
      </div>`;
  }).join("");
  return `<section class="karte balance">
      <div class="einheit-kopf"><h2>Muskelbalance</h2>${abweichungen ? '<button class="btn klein" data-action="ausgleichen">Ausgleichen</button>' : '<span class="badge">alles im Ziel</span>'}</div>
      <p class="hinweis">Sätze pro Woche je Muskelgruppe. Grauer Bereich = Ziel (${ERFAHRUNG[p.erfahrung].name}: ${VOLUMEN[p.erfahrung].join("–")}). Arbeitet ein Muskel nur mit, zählt der Satz halb – z. B. Bizeps beim Rudern.</p>
      <div class="bz-liste" role="list">${zeilen}</div>
      ${abweichungen ? `<p class="hinweis">${abweichungen} ${abweichungen === 1 ? "Gruppe liegt" : "Gruppen liegen"} außerhalb (↓ zu wenig, ↑ zu viel). „Ausgleichen“ passt Sätze an oder ergänzt Übungen, soweit die Trainingszeit reicht.</p>` : ""}
    </section>`;
}

function renderWoche() {
  const p = state.profil, h = heute(), m = montag(h);
  const tage = TAGE.map((t, i) => {
    const d = addTage(m, i);
    const kraft = state.verlauf.some((x) => x.typ === "kraft" && x.datum === d);
    const mob = state.verlauf.some((x) => x.typ === "mobility" && x.datum === d);
    // Aufwärmen zählt nicht als eigene Cardio-Einheit
    const cardio = state.verlauf.some((x) => x.typ === "cardio" && x.art !== "aufwaermen" && x.datum === d);
    const klassen = ["wt", p.tage.includes(i) && "geplant", kraft && "erledigt", d === h && "heute"].filter(Boolean).join(" ");
    return `<div class="${klassen}"><span class="wt-name">${t}</span><span class="wt-punkt">${kraft ? "✓" : ""}</span>
      <span class="wt-extra">${cardio ? "<span>Cardio</span>" : ""}${mob ? "<span>Mob</span>" : ""}</span></div>`;
  }).join("");
  const anzahl = state.verlauf.filter((x) => x.typ === "kraft" && x.datum >= m).length;
  const cardioMin = state.verlauf.filter((x) => x.typ === "cardio" && x.datum >= m).reduce((s, x) => s + x.minuten, 0);
  const ausdauer = state.verlauf.filter((x) => x.typ === "cardio" && x.art !== "aufwaermen" && x.datum >= m).length;
  const cardioZeile = p.cardioProWoche
    ? `${ausdauer} von ${p.cardioProWoche} Ausdauer-Einheiten${cardioMin ? ` · ${cardioMin} Min.` : ""}`
    : cardioMin ? `${cardioMin} Min. Cardio` : "";
  return `<section class="karte woche-karte">
      <div class="woche">${tage}</div>
      <p class="slot-meta">${anzahl} von ${p.tage.length} Krafttrainings diese Woche${cardioZeile ? `<br>${cardioZeile}` : ""}</p>
    </section>`;
}

function einheitKarte(e, i, naechste) {
  return `<section class="karte einheit">
      <div class="einheit-kopf"><h2>${esc(e.name)}</h2>${naechste ? '<span class="badge">als Nächstes</span>' : ""}</div>
      <div class="ue-liste">${e.uebungen.map((x) =>
        ueZeile(x.id, [zielText(x.id, x.saetze), gewichtText(x.id)].filter(Boolean).join(" · "))).join("")}</div>
      <div class="aktionen klein">
        <button class="btn" data-action="bearbeiten" data-index="${i}">Bearbeiten</button>
        <button class="btn" data-action="start" data-index="${i}">Starten</button>
      </div>
    </section>`;
}

// ================= Ansicht: laufendes Training =================

function renderSession() {
  const a = state.aktiv;
  const alle = a.uebungen.flatMap((u) => u.saetze);
  const fertig = alle.filter((s) => s.fertig).length;
  const offen = fertig < alle.length ? 'data-bestaetigen="Offene Sätze – trotzdem beenden?"' : "";
  const aufwaermen = aufwaermUebungen(a.uebungen);
  return `
    <div class="karte session-kopf">
      <div><span class="label">Dauer</span><strong id="dauer">${fmtDauer(Date.now() - a.start)}</strong></div>
      <div><span class="label">Sätze</span><strong>${fertig} / ${alle.length}</strong></div>
      <button class="btn primaer" data-action="training-beenden" ${offen}>Beenden</button>
    </div>
    ${a.cardio.map((c, k) => (c.art === "aufwaermen" ? renderCardioKarte(c, k) : "")).join("")}
    ${a.uebungen.map((u, i) => renderSessionUebung(u, i, aufwaermen.has(i))).join("")}
    <button class="slot-add" data-action="aktiv-hinzufuegen">+ Übung hinzufügen</button>
    ${a.cardio.map((c, k) => (c.art !== "aufwaermen" ? renderCardioKarte(c, k) : "")).join("")}
    <div class="aktionen">
      <button class="btn primaer" data-action="training-beenden" ${offen}>Training beenden und speichern</button>
      <button class="btn gefahr" data-action="training-verwerfen" data-bestaetigen="Wirklich verwerfen?">Verwerfen</button>
    </div>`;
}

// Aufwärmsätze bei der ersten Verbundübung je Körperbereich (Oberkörper, Beine) – danach sind
// die Gelenke warm, weitere Übungen für denselben Bereich brauchen keine eigenen Aufwärmsätze
const BEINE = ["beine_vorne", "beinrueckseite", "gesaess"];
const bereichVon = (id) => (Object.entries(MUSKELN[id] || {}).some(([g, f]) => f >= 1 && BEINE.includes(g)) ? "beine" : "oben");
function aufwaermUebungen(uebungen) {
  const gewaermt = new Set(), auswahl = new Set();
  uebungen.forEach((u, i) => {
    if (uebung(u.id).art !== "verbund" || gewaermt.has(bereichVon(u.id))) return;
    gewaermt.add(bereichVon(u.id));
    auswahl.add(i);
  });
  return auswahl;
}
function aufwaermText(u) {
  const ex = uebung(u.id), kg = state.stand[u.id]?.gewicht;
  if (ex.einheit !== "kg") return "Aufwärmen: 1 lockerer Satz mit halber Wiederholungszahl – zählt nicht mit.";
  if (kg == null) return "Aufwärmen: 2 leichte Sätze – etwa die Hälfte deines Arbeitsgewichts × 8, dann drei Viertel × 3. Zählen nicht mit.";
  if (kg < 15) return "Aufwärmen: 1 leichter Satz × 10 – zählt nicht mit.";
  return `Aufwärmen: ${zahl(rund(kg * 0.5, ex.schritt))} kg × 8, dann ${zahl(rund(kg * 0.75, ex.schritt))} kg × 3 – zählen nicht mit.`;
}

function renderSessionUebung(u, i, aufwaermen = false) {
  const ex = uebung(u.id), kg = ex.einheit === "kg";
  const zielKg = state.stand[u.id]?.gewicht;
  const meta = [zielText(u.id, u.saetze.length), gewichtText(u.id)].filter(Boolean).join(" · ");
  const letzte = u.letzte ? `Letztes Mal (${kurzDatum(u.letzte.datum)}): ${saetzeKurz(u.id, u.letzte.saetze)}` : "Zum ersten Mal";
  const hinweise = [];
  if (aufwaermen) hinweise.push(aufwaermText(u));
  if (kg && zielKg == null) hinweise.push(`Wähle ein Gewicht, bei dem du am Satzende noch ${RESERVE[ex.art]} Wiederholungen schaffen würdest.`);
  const reserve = ex.einheit === "sek" ? "Halten, bis es deutlich anstrengend wird – nicht bis zum Zittern" : `Jeder Satz: ${RESERVE[ex.art]} Wdh. Reserve lassen`;
  const fertig = u.saetze.every((s) => s.fertig);
  const angefangen = u.saetze.some((s) => s.fertig);
  const spalte = ex.einheit === "sek" ? "Sek." : "Wdh.";
  return `<section class="karte uebung ${fertig ? "fertig" : ""}">
      <div class="ue-kopf">
        <button class="ue-bild" data-action="info" data-id="${esc(u.id)}" aria-label="Anleitung">${bildKlein(u.id, "thumb")}</button>
        <div class="ue-text">
          <button class="ue-name link-name" data-action="info" data-id="${esc(u.id)}">${esc(ex.name)}</button>
          <span class="ue-meta">${esc(meta)}</span>
          <span class="ue-meta">${esc(letzte)}</span>
          <span class="ue-meta reserve">${esc(reserve)}</span>
        </div>
      </div>
      ${hinweise.map((h) => `<p class="tipp">${esc(h)}</p>`).join("")}
      <div class="saetze" role="table">
        <div class="satz kopf" role="row"><span>Satz</span><span>${kg ? (jeHantel(u.id) ? "kg/Hantel" : "kg") : ""}</span><span>${spalte}</span><span></span></div>
        ${u.saetze.map((s, j) => `
          <div class="satz ${s.fertig ? "erledigt" : ""}" role="row">
            <span class="satz-nr">${j + 1}</span>
            ${kg
              ? `<input class="satz-feld" inputmode="decimal" autocomplete="off" data-input="satz" data-feld="kg" data-u="${i}" data-s="${j}"
                  value="${s.kg != null ? zahl(s.kg) : ""}" placeholder="kg" aria-label="Kilo, Satz ${j + 1}">`
              : `<span class="satz-ohne">${ex.einheit === "sek" ? "Halten" : "Körper"}</span>`}
            <input class="satz-feld" inputmode="numeric" autocomplete="off" data-input="satz" data-feld="wdh" data-u="${i}" data-s="${j}"
              value="${s.wdh ?? ""}" placeholder="${zielWdh(u, j)}" aria-label="${spalte}, Satz ${j + 1}">
            <button class="satz-check" data-action="satz-fertig" data-u="${i}" data-s="${j}" aria-pressed="${s.fertig}" aria-label="Satz ${j + 1} erledigt">✓</button>
          </div>`).join("")}
      </div>
      <div class="satz-knoepfe">
        <button class="link-btn" data-action="satz-plus" data-u="${i}">+ Satz</button>
        ${u.saetze.length > 1 ? `<button class="link-btn" data-action="satz-minus" data-u="${i}">− Satz</button>` : ""}
        <button class="link-btn" data-action="aktiv-tauschen" data-u="${i}" ${angefangen ? 'data-bestaetigen="Erledigte Sätze gehen verloren"' : ""}>Tauschen</button>
      </div>
    </section>`;
}

const CARDIO_ART = {
  aufwaermen: { titel: "Aufwärmen", text: "Locker – du kannst dich noch gut unterhalten." },
  ausdauer: { titel: "Ausdauer", text: "Mittleres Tempo – leicht außer Atem, aber gleichmäßig." },
};

function renderCardioKarte(c, k) {
  const info = CARDIO_ART[c.art], g = CARDIO[c.geraet], auswahl = cardioGeraete(c.art);
  const routine = c.art === "aufwaermen"
    ? `<button class="link-btn" data-action="mob-start" data-id="aufwaermen">${g ? "Stattdessen" : "Dafür"} die Aufwärm-Routine (Mobility)</button>` : "";
  return `<section class="karte cardio-karte ${c.fertig ? "fertig" : ""}">
      <div class="ue-kopf">
        ${g ? bildKlein(g.bild, "thumb") : ""}
        <div class="ue-text">
          <span class="ue-name">${info.titel}${g ? ` · ${esc(g.name)}` : ""}</span>
          <span class="ue-meta">${esc(info.text)}</span>
          ${g ? `<span class="ue-meta">${esc(g.tipp)}</span>` : `<span class="ue-meta">Kein Ausdauergerät ausgewählt.</span>`}
        </div>
      </div>
      ${auswahl.length > 1 ? `<div class="chips">${auswahl.map((x) =>
        `<button class="chip ${x === c.geraet ? "an" : ""}" data-action="cardio-geraet" data-k="${k}" data-g="${x}">${esc(CARDIO[x].name)}</button>`).join("")}</div>` : ""}
      ${g ? `<div class="cardio-felder">
        <label>Minuten<input class="satz-feld" inputmode="numeric" autocomplete="off" data-input="cardio" data-k="${k}" data-feld="minuten" value="${c.minuten ?? ""}"></label>
        <label>km<input class="satz-feld" inputmode="decimal" autocomplete="off" data-input="cardio" data-k="${k}" data-feld="km" value="${c.km != null ? zahl(c.km) : ""}" placeholder="optional"></label>
        <button class="satz-check" data-action="cardio-fertig" data-k="${k}" aria-pressed="${c.fertig}" aria-label="${info.titel} erledigt">✓</button>
      </div>` : ""}
      ${routine}
    </section>`;
}

function cardioFormular() {
  // Draußen (Joggen, Radfahren) zuerst – Studio-Geräte dahinter
  const auswahl = cardioGeraete("ausdauer").sort((a, b) => !!CARDIO[b].immer - !!CARDIO[a].immer);
  const vorwahl = letztesCardioGeraet("einzeln", auswahl) || letztesCardioGeraet("ausdauer", auswahl) || auswahl[0];
  openModal(`${sheetKopf("Cardio eintragen")}
    <form class="formular" data-form="cardio">
      <div class="chips">${auswahl.map((k) => `<label class="chip-check"><input type="radio" name="geraet" value="${k}" ${k === vorwahl ? "checked" : ""}><span>${esc(CARDIO[k].name)}</span></label>`).join("")}</div>
      <div class="zwei-spalten">
        <label class="feld">Minuten<input name="minuten" inputmode="numeric" value="${CARDIO_MINUTEN.einzeln}" autocomplete="off"></label>
        <label class="feld">Kilometer <small>optional</small><input name="km" inputmode="decimal" autocomplete="off"></label>
      </div>
      <label class="feld">Datum<input type="date" name="datum" value="${heute()}"></label>
      <button class="btn primaer gross">Speichern</button>
    </form>`);
}

function zusammenfassungZeigen(t, meldungen, rekorde, cardio = []) {
  const saetze = t.uebungen.reduce((s, u) => s + u.saetze.length, 0);
  const cardioMin = cardio.reduce((s, c) => s + c.minuten, 0);
  openModal(`${sheetKopf("Training gespeichert")}
    <div class="kacheln">
      <div class="kachel"><span class="label">Dauer</span><strong>${fmtMin(t.ende - t.start)}</strong></div>
      <div class="kachel"><span class="label">Übungen</span><strong>${t.uebungen.length}</strong></div>
      <div class="kachel"><span class="label">Sätze</span><strong>${saetze}</strong></div>
      ${cardioMin ? `<div class="kachel"><span class="label">Cardio</span><strong>${cardioMin} Min.</strong></div>` : ""}
    </div>
    ${rekorde.length ? `<div class="karte rekord"><h3>Neue Bestleistung</h3>
      <ul class="liste">${rekorde.map((id) => `<li>${esc(uebung(id).name)}</li>`).join("")}</ul></div>` : ""}
    <h3 class="kat-titel">Nächstes Mal</h3>
    <ul class="meldungen">${meldungen.map((m) => `<li class="${m.hoch ? "hoch" : ""}">
      <strong>${esc(uebung(m.id).name)}</strong><span>${m.hoch ? "↑ " : ""}${esc(m.text)}</span></li>`).join("")}</ul>
    <div class="aktionen">
      <button class="btn primaer" data-action="mob-start" data-id="nachher">Jetzt dehnen (${Math.round(mobDauer(MOBILITY.find((r) => r.id === "nachher")) / 60)} Min.)</button>
      <button class="btn" data-action="modal-zu">Fertig</button>
    </div>`);
}

// ================= Übung: Anleitung, Auswahl, Plan bearbeiten =================

// YouTube-Suche statt fester Video-Links: veraltet nicht und zeigt mehrere Erklärungen zur Auswahl
const videoLink = (suche) => `https://www.youtube.com/results?search_query=${encodeURIComponent(suche)}`;

function infoZeigen(id) {
  const ex = uebung(id);
  const geraete = (ex.geraete || []).map(geraetName).join(", ");
  const meta = [ex.muskeln, UEBUNGEN[id] ? geraete || "ohne Geräte" : ""].filter(Boolean).join(" · ");
  const hatVerlauf = !!UEBUNGEN[id] && !!letzteAusfuehrung(id);
  const fehlt = UEBUNGEN[id] ? fehlendeGeraete(id) : [];
  // Alternativen aus denselben Bewegungsmustern, die mit deinen Geräten gehen
  const alternativen = fehlt.length
    ? [...new Set(Object.values(MUSTER).filter((m) => m.ids.includes(id)).flatMap((m) => m.ids))]
        .filter((x) => x !== id && hatGeraete(x)).slice(0, 4)
    : [];
  openModal(`${sheetKopf(ex.name)}
    ${fehlt.length ? `<div class="tipp">Dafür fehlt dir: ${esc(fehlt.map(geraetName).join(", "))}.
      ${alternativen.length ? "Mit deinen Geräten geht stattdessen:" : ""}</div>
      ${alternativen.length ? `<div class="ue-liste">${alternativen.map((x) => ueZeile(x, esc(uebung(x).muskeln))).join("")}</div>` : ""}` : ""}
    ${bildWechsel(id)}
    ${meta ? `<p class="hinweis">${esc(meta)}</p>` : ""}
    <ol class="schritte">${ex.tipps.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>
    <div class="video-links">
      <span class="label">Video-Anleitung</span>
      <a class="btn" href="${videoLink(`${ex.name} richtige Ausführung`)}" target="_blank" rel="noopener">Auf Deutsch</a>
      <a class="btn" href="${videoLink(`${id.replace(/_/g, " ")} proper form`)}" target="_blank" rel="noopener">Auf Englisch</a>
    </div>
    ${hatVerlauf ? `<button class="btn" data-action="uebung-verlauf" data-id="${esc(id)}">Verlauf ansehen</button>` : ""}
    <p class="nachweise">Bilder: <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener">free-exercise-db</a> (gemeinfrei)</p>`);
}

function pickerOeffnen(opts) {
  ui.picker = { suche: "", alle: false, ...opts };
  const titel = opts.modus === "tauschen" ? "Übung tauschen" : "Übung hinzufügen";
  openModal(`${sheetKopf(titel)}
    ${opts.modus === "tauschen" ? `<p class="hinweis">Statt: <strong>${esc(uebung(opts.alt).name)}</strong></p>` : ""}
    <input class="suche" type="search" placeholder="Übung suchen" data-input="picker-suche" autocomplete="off">
    <div id="picker-liste"></div>`);
  renderPickerListe();
}

function renderPickerListe() {
  const pk = ui.picker, q = pk.suche.trim().toLowerCase();
  const nurAehnliche = pk.modus === "tauschen" && !pk.alle && !q;
  const gesehen = new Set();
  const gruppen = Object.values(MUSTER).filter((m) => !nurAehnliche || m.ids.includes(pk.alt));
  const html = gruppen.map((m) => {
    const ids = m.ids.filter((id) => !gesehen.has(id) && id !== pk.alt && (!q || uebung(id).name.toLowerCase().includes(q)));
    ids.forEach((id) => gesehen.add(id));
    if (!ids.length) return "";
    // Übungen, für die dir Geräte fehlen, stehen gedimmt am Ende
    ids.sort((a, b) => hatGeraete(b) - hatGeraete(a));
    return `<h3 class="kat-titel">${esc(m.name)}</h3><div class="ue-liste">${ids.map((id) => {
      const fehlt = fehlendeGeraete(id);
      const meta = esc(uebung(id).muskeln) + (fehlt.length ? ` · fehlt: ${esc(fehlt.map(geraetName).join(", "))}` : "");
      return ueZeile(id, meta, "picker-waehlen", fehlt.length ? 'data-gedimmt="1"' : "");
    }).join("")}</div>`;
  }).join("");
  $("#picker-liste").innerHTML = (html || '<p class="leer-hinweis">Nichts gefunden</p>') +
    (nurAehnliche ? '<button class="link-btn zentriert" data-action="picker-alle">Alle Übungen anzeigen</button>' : "");
}

function pickerWaehlen(id) {
  const pk = ui.picker;
  if (pk.ziel === "aktiv") {
    const a = state.aktiv;
    if (pk.modus === "tauschen") {
      a.uebungen[pk.pos] = neueSessionUebung(id, a.uebungen[pk.pos].saetze.length);
      toast("Nur für heute getauscht – dauerhaft unter „Bearbeiten“");
    } else {
      a.uebungen.push(neueSessionUebung(id, saetzeStandard(id)));
    }
    closeModal();
    speichernRender();
    return;
  }
  const e = state.plan.einheiten[pk.einheit];
  if (pk.modus === "tauschen") e.uebungen[pk.pos].id = id;
  else e.uebungen.push({ id, saetze: saetzeStandard(id) });
  speichern();
  render();
  editorOeffnen(pk.einheit);
}

function editorOeffnen(i) {
  ui.picker = null;
  const e = state.plan.einheiten[i];
  openModal(`${sheetKopf("Einheit bearbeiten")}
    <label class="feld">Name<input value="${esc(e.name)}" data-change="einheit-name" data-i="${i}"></label>
    <ol class="editor-liste">${e.uebungen.map((x, j) => `
      <li class="editor-zeile">
        <button class="ue-bild" data-action="info" data-id="${esc(x.id)}" aria-label="Anleitung">${bildKlein(x.id)}</button>
        <div class="ue-text">
          <span class="ue-name">${esc(uebung(x.id).name)}</span>
          <span class="ue-meta">${esc(zielText(x.id, x.saetze))}</span>
          <div class="editor-knoepfe">
            <span class="stepper">
              <button data-action="ed-saetze" data-i="${i}" data-j="${j}" data-delta="-1" aria-label="Ein Satz weniger">−</button>
              <span>${x.saetze} Sätze</span>
              <button data-action="ed-saetze" data-i="${i}" data-j="${j}" data-delta="1" aria-label="Ein Satz mehr">+</button>
            </span>
            <button class="link-btn" data-action="ed-tauschen" data-i="${i}" data-j="${j}">Tauschen</button>
          </div>
        </div>
        <div class="editor-seite">
          <button class="icon-btn klein" data-action="ed-hoch" data-i="${i}" data-j="${j}" aria-label="Nach oben" ${j === 0 ? "disabled" : ""}>↑</button>
          <button class="icon-btn klein" data-action="ed-weg" data-i="${i}" data-j="${j}" aria-label="Entfernen">×</button>
        </div>
      </li>`).join("")}</ol>
    <button class="slot-add" data-action="ed-hinzufuegen" data-i="${i}">+ Übung hinzufügen</button>
    <div class="aktionen"><button class="btn primaer" data-action="start" data-index="${i}">Diese Einheit starten</button></div>`);
}

// ================= Ansicht: Verlauf =================

const METRIKEN = {
  kg: [["gewicht", "Gewicht"], ["e1rm", "Geschätztes Maximum"], ["volumen", "Volumen"]],
  wdh: [["beste", "Beste Serie"], ["summe", "Wdh. gesamt"]],
  sek: [["beste", "Längste Zeit"], ["summe", "Zeit gesamt"]],
};
function metrikWert(saetze, metrik) {
  switch (metrik) {
    case "gewicht": return Math.max(...saetze.map((s) => s.kg || 0));
    case "e1rm": return Math.round(Math.max(...saetze.map((s) => e1rm(s.kg || 0, s.wdh))) * 10) / 10;
    case "volumen": return saetze.reduce((t, s) => t + (s.kg || 0) * s.wdh, 0);
    case "beste": return Math.max(...saetze.map((s) => s.wdh));
    default: return saetze.reduce((t, s) => t + s.wdh, 0);
  }
}
const metrikEinheit = (id, metrik) => {
  const e = uebung(id).einheit;
  return e === "kg" ? "kg" : e === "sek" ? "s" : metrik === "beste" ? "Wdh." : "Wdh.";
};
// Pace (min/km) als 5:30 statt 5,5 anzeigen
const fmtZahl = (wert, einheit) => (einheit === "min/km" ? paceText(wert) : zahl(wert));
const fmtWert = (wert, einheit) => `${fmtZahl(wert, einheit)} ${einheit}`;

function verlaufPunkte(id, metrik) {
  return state.verlauf.flatMap((t) => {
    if (t.typ !== "kraft") return [];
    const u = t.uebungen.find((x) => x.id === id);
    return u ? [{ datum: t.datum, wert: metrikWert(u.saetze, metrik), saetze: u.saetze }] : [];
  });
}

function renderVerlauf() {
  if (!state.verlauf.length) {
    return `<p class="leer-hinweis">Noch keine Trainings. Nach dem ersten Training siehst du hier deinen Fortschritt.</p>`;
  }
  const h = heute(), m = montag(h);
  const kraft = state.verlauf.filter((t) => t.typ === "kraft");
  const woche = kraft.filter((t) => t.datum >= m).length;
  const cardioMin = state.verlauf.filter((t) => t.typ === "cardio" && t.datum >= m).reduce((s, t) => s + t.minuten, 0);
  const mob = state.verlauf.filter((t) => t.typ === "mobility" && t.datum >= m).length;
  const ziel = state.profil ? `<small> / ${state.profil.tage.length}</small>` : "";
  const ansicht = ui.verlaufAnsicht;
  return `
    <div class="kacheln">
      <div class="kachel"><span class="label">Kraft</span><strong>${woche}${ziel}</strong><span>diese Woche</span></div>
      <div class="kachel"><span class="label">Cardio</span><strong>${cardioMin}<small> Min.</small></strong><span>diese Woche</span></div>
      <div class="kachel"><span class="label">Mobility</span><strong>${mob}</strong><span>diese Woche</span></div>
    </div>
    <div class="chips">
      <button class="chip ${ansicht === "uebungen" ? "an" : ""}" data-action="verlauf-ansicht" data-ansicht="uebungen">Übungen</button>
      <button class="chip ${ansicht === "trainings" ? "an" : ""}" data-action="verlauf-ansicht" data-ansicht="trainings">Trainings</button>
    </div>
    ${ansicht === "uebungen" ? renderUebungsListe(kraft) : renderTrainingsListe()}`;
}

function renderUebungsListe(kraft) {
  const zuletzt = new Map();
  for (const t of kraft) for (const u of t.uebungen) zuletzt.set(u.id, t.datum);
  const ids = [...zuletzt.keys()].filter((id) => UEBUNGEN[id]).sort((a, b) => zuletzt.get(b).localeCompare(zuletzt.get(a)));
  const cardio = renderCardioListe();
  if (!ids.length) return cardio || `<p class="leer-hinweis">Noch keine Übungen im Verlauf.</p>`;
  return `${cardio}${cardio ? '<h3 class="kat-titel">Kraft</h3>' : ""}<div class="ue-liste">${ids.map((id) => {
    const metrik = METRIKEN[uebung(id).einheit][0][0];
    const punkte = verlaufPunkte(id, metrik);
    const l = letzteAusfuehrung(id);
    return `<button class="ue-zeile karte-zeile" data-action="uebung-verlauf" data-id="${esc(id)}">${bildKlein(id)}
      <span class="ue-text"><span class="ue-name">${esc(uebung(id).name)}</span>
        <span class="ue-meta">${kurzDatum(l.datum)} · ${esc(saetzeKurz(id, l.saetze))}</span></span>
      ${sparkline(punkte.map((p) => p.wert))}</button>`;
  }).join("")}</div>`;
}

const cardioEintraege = (g) => state.verlauf.filter((t) => t.typ === "cardio" && t.geraet === g).sort((a, b) => a.start - b.start);

function renderCardioListe() {
  const geraete = [...new Set(state.verlauf.filter((t) => t.typ === "cardio").map((t) => t.geraet))].filter((g) => CARDIO[g]);
  if (!geraete.length) return "";
  return `<h3 class="kat-titel">Ausdauer</h3><div class="ue-liste">${geraete.map((g) => {
    const liste = cardioEintraege(g), l = liste.at(-1);
    return `<button class="ue-zeile karte-zeile" data-action="cardio-verlauf" data-g="${g}">${bildKlein(CARDIO[g].bild)}
      <span class="ue-text"><span class="ue-name">${esc(CARDIO[g].name)}</span>
        <span class="ue-meta">${kurzDatum(l.datum)} · ${cardioText(l)}</span></span>
      ${sparkline(liste.map((t) => t.minuten))}</button>`;
  }).join("")}</div>`;
}

const CARDIO_METRIKEN = [["minuten", "Dauer", "Min."], ["km", "Distanz", "km"], ["tempo", "Tempo", "km/h"]];

function cardioVerlaufZeigen(g, metrik = "minuten") {
  const liste = cardioEintraege(g), mitKm = liste.some((t) => t.km);
  // Beim Laufen heißt das Tempo "Pace" und wird in min/km gemessen (kleiner = schneller)
  const optionen = CARDIO_METRIKEN.filter(([k]) => k === "minuten" || mitKm)
    .map((o) => (o[0] === "tempo" && CARDIO[g].pace ? ["tempo", "Pace", "min/km"] : o));
  const [, name, einheit] = optionen.find(([k]) => k === metrik) || optionen[0];
  const wert = (t) => (metrik === "km" ? t.km : metrik === "tempo" ? tempoWert(t) : t.minuten);
  const punkte = liste.filter((t) => metrik === "minuten" || t.km).map((t) => ({ datum: t.datum, wert: wert(t) }));
  const gesamt = liste.reduce((s, t) => s + t.minuten, 0);
  const kmGesamt = liste.reduce((s, t) => s + (t.km || 0), 0);
  openModal(`${sheetKopf(CARDIO[g].name)}
    ${optionen.length > 1 ? `<div class="chips">${optionen.map(([k, n]) =>
      `<button class="chip ${k === metrik ? "an" : ""}" data-action="cardio-metrik" data-g="${g}" data-metrik="${k}">${n}</button>`).join("")}</div>` : ""}
    ${diagramm(punkte, einheit, name)}
    <div class="kacheln">
      <div class="kachel"><span class="label">Einheiten</span><strong>${liste.length}</strong></div>
      <div class="kachel"><span class="label">Gesamt</span><strong>${zahl(Math.round(gesamt / 6) / 10)} <small>Std.</small></strong></div>
      ${kmGesamt ? `<div class="kachel"><span class="label">Distanz</span><strong>${zahl(Math.round(kmGesamt * 10) / 10)} <small>km</small></strong></div>` : ""}
    </div>
    ${!mitKm ? '<p class="hinweis">Trägst du auch Kilometer ein, gibt es hier zusätzlich Distanz und Tempo.</p>' : ""}
    <h3 class="kat-titel">Alle Einheiten</h3>
    <table class="tabelle">
      <thead><tr><th>Datum</th><th>Art</th><th class="zahl">Dauer</th><th class="zahl">km</th><th class="zahl">${CARDIO[g].pace ? "Pace" : "Tempo"}</th></tr></thead>
      <tbody>${[...liste].reverse().map((t) => `<tr><td>${kurzDatum(t.datum)}</td><td>${t.art === "aufwaermen" ? "Aufwärmen" : t.art === "ausdauer" ? "nach Kraft" : "einzeln"}</td>
        <td class="zahl">${t.minuten} Min.</td><td class="zahl">${t.km ? zahl(t.km) : "–"}</td><td class="zahl">${tempoText(t) || "–"}</td></tr>`).join("")}</tbody>
    </table>`);
}

function renderTrainingsListe() {
  // Cardio aus einem Krafttraining steht beim Training selbst, nicht als eigene Zeile
  const liste = state.verlauf.filter((t) => !(t.typ === "cardio" && t.sitzung)).sort((a, b) => b.start - a.start);
  let monat = "";
  return liste.map((t) => {
    const d = keyDatum(t.datum);
    const m = `${MONATE_LANG[d.getMonth()]} ${d.getFullYear()}`;
    const kopf = m !== monat ? `<h3 class="kat-titel">${m}</h3>` : "";
    monat = m;
    const dazu = state.verlauf.filter((c) => c.typ === "cardio" && c.sitzung === t.id).reduce((s, c) => s + c.minuten, 0);
    const meta = t.typ === "kraft"
      ? `${fmtMin(t.ende - t.start)} · ${t.uebungen.length} Übungen · ${t.uebungen.reduce((s, u) => s + u.saetze.length, 0)} Sätze${dazu ? ` · +${dazu} Min. Cardio` : ""}`
      : t.typ === "cardio" ? `Cardio · ${cardioText(t)}` : `Mobility · ${fmtMin(t.sekunden * 1000)}`;
    return `${kopf}<button class="ue-zeile karte-zeile" data-action="training-zeigen" data-id="${t.id}">
      <span class="tl-datum ${t.typ}"><strong>${d.getDate()}.</strong><span>${TAGE[wochentag(t.datum)]}</span></span>
      <span class="ue-text"><span class="ue-name">${esc(t.name)}</span><span class="ue-meta">${meta}</span></span></button>`;
  }).join("");
}

function trainingZeigen(id) {
  const t = state.verlauf.find((x) => x.id === id);
  if (!t) return;
  const cardioZeile = (c) => `<button class="ue-zeile" data-action="cardio-verlauf" data-g="${c.geraet}">${bildKlein(CARDIO[c.geraet].bild)}
    <span class="ue-text"><span class="ue-name">${esc(c.name)}${c.art === "aufwaermen" ? " (Aufwärmen)" : ""}</span><span class="ue-meta">${cardioText(c)}</span></span></button>`;
  const dazu = state.verlauf.filter((c) => c.typ === "cardio" && c.sitzung === t.id);
  const inhalt = t.typ === "kraft"
    ? `<div class="ue-liste">${dazu.filter((c) => c.art === "aufwaermen").map(cardioZeile).join("")}
         ${t.uebungen.map((u) => ueZeile(u.id, esc(saetzeKurz(u.id, u.saetze)), "uebung-verlauf")).join("")}
         ${dazu.filter((c) => c.art !== "aufwaermen").map(cardioZeile).join("")}</div>
       <p class="hinweis">Dauer ${fmtMin(t.ende - t.start)}</p>`
    : t.typ === "cardio" ? `<div class="ue-liste">${cardioZeile(t)}</div>`
    : `<p class="hinweis">Mobility-Routine, ${fmtMin(t.sekunden * 1000)}.</p>`;
  openModal(`${sheetKopf(t.name)}
    <p class="label">${esc(langDatum(t.datum))}</p>
    ${inhalt}
    <div class="aktionen"><button class="btn gefahr" data-action="training-loeschen" data-id="${t.id}" data-bestaetigen="Wirklich löschen?">Eintrag löschen</button></div>`);
}

function uebungVerlaufZeigen(id, metrik) {
  const ex = uebung(id), optionen = METRIKEN[ex.einheit];
  metrik ||= optionen[0][0];
  const name = optionen.find(([k]) => k === metrik)[1];
  const einheit = metrikEinheit(id, metrik);
  const punkte = verlaufPunkte(id, metrik);
  const alle = punkte.flatMap((p) => p.saetze);
  const best = alle.length ? (ex.einheit === "kg"
    ? [["Schwerster Satz", `${zahl(Math.max(...alle.map((s) => s.kg || 0)))} kg`],
       ["Geschätztes Maximum", `${zahl(Math.round(Math.max(...alle.map((s) => e1rm(s.kg || 0, s.wdh)))))} kg`],
       ["Trainings", punkte.length]]
    : [[ex.einheit === "sek" ? "Längste Zeit" : "Beste Serie", `${Math.max(...alle.map((s) => s.wdh))} ${ex.einheit === "sek" ? "s" : "Wdh."}`],
       ["Trainings", punkte.length]]) : [];
  openModal(`${sheetKopf(ex.name)}
    <div class="chips">${optionen.map(([k, n]) =>
      `<button class="chip ${k === metrik ? "an" : ""}" data-action="metrik" data-id="${esc(id)}" data-metrik="${k}">${n}</button>`).join("")}</div>
    ${diagramm(punkte, einheit, name)}
    <div class="kacheln">${best.map(([l, w]) => `<div class="kachel"><span class="label">${l}</span><strong>${w}</strong></div>`).join("")}</div>
    ${metrik === "e1rm" ? `<p class="hinweis">Das Gewicht, das du ungefähr einmal schaffen würdest – geschätzt aus Gewicht und Wiederholungen (Epley-Formel). So lassen sich Sätze mit unterschiedlich vielen Wiederholungen vergleichen.</p>` : ""}
    <h3 class="kat-titel">Alle Trainings</h3>
    <table class="tabelle">
      <thead><tr><th>Datum</th><th>Sätze</th><th class="zahl">${esc(name)}</th></tr></thead>
      <tbody>${[...punkte].reverse().map((p) => `<tr><td>${kurzDatum(p.datum)}</td><td>${esc(saetzeKurz(id, p.saetze))}</td>
        <td class="zahl">${fmtWert(p.wert, einheit)}</td></tr>`).join("")}</tbody>
    </table>
    <button class="link-btn" data-action="info" data-id="${esc(id)}">Anleitung ansehen</button>`);
}

// ================= Diagramme =================

function schoeneTicks(min, max, anzahl = 4) {
  if (min === max) { const d = Math.max(1, Math.abs(min) * 0.1); min -= d; max += d; }
  const roh = (max - min) / anzahl;
  const mag = 10 ** Math.floor(Math.log10(roh));
  const schritt = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s >= roh);
  const ticks = [];
  for (let v = Math.floor(min / schritt) * schritt; v <= Math.ceil(max / schritt) * schritt + schritt / 1000; v += schritt) {
    ticks.push(Math.round(v * 1000) / 1000);
  }
  return ticks;
}

function sparkline(werte) {
  if (werte.length < 2) return "";
  const B = 64, H = 24, min = Math.min(...werte), max = Math.max(...werte);
  const pts = werte.map((w, i) => `${((i / (werte.length - 1)) * (B - 6) + 3).toFixed(1)},${(H - 3 - ((w - min) / (max - min || 1)) * (H - 6)).toFixed(1)}`);
  const [lx, ly] = pts.at(-1).split(",");
  return `<svg class="spark" viewBox="0 0 ${B} ${H}" aria-hidden="true"><polyline points="${pts.join(" ")}"/><circle cx="${lx}" cy="${ly}" r="3"/></svg>`;
}

// Koordinaten etwa in CSS-Pixeln eines Handys, damit die Beschriftung lesbar groß bleibt
const DG = { B: 360, H: 190, L: 34, R: 34, O: 12, U: 24 };

function diagramm(punkte, einheit, name) {
  if (punkte.length < 2) {
    return `<p class="leer-hinweis">${punkte.length ? `Bisher ein Training: ${fmtWert(punkte[0].wert, einheit)}. ` : ""}Ab zwei Trainings gibt es hier ein Diagramm.</p>`;
  }
  const { B, H, L, R, O, U } = DG, n = punkte.length;
  const werte = punkte.map((p) => p.wert);
  const ticks = schoeneTicks(Math.min(...werte), Math.max(...werte));
  const y0 = ticks[0], y1 = ticks.at(-1);
  const x = (i) => L + (i / (n - 1)) * (B - L - R);
  const y = (v) => O + (1 - (v - y0) / (y1 - y0 || 1)) * (H - O - U);
  const xy = punkte.map((p, i) => [Math.round(x(i) * 10) / 10, Math.round(y(p.wert) * 10) / 10]);
  const linie = xy.map(([a, b], i) => `${i ? "L" : "M"}${a},${b}`).join("");
  const flaeche = `${linie}L${xy.at(-1)[0]},${H - U}L${xy[0][0]},${H - U}Z`;
  const gitter = ticks.map((t) => `<line class="dg-gitter" x1="${L}" x2="${B - R}" y1="${y(t)}" y2="${y(t)}"/>
    <text class="dg-achse" x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${fmtZahl(t, einheit)}</text>`).join("");
  const xIdx = n >= 5 ? [0, Math.floor((n - 1) / 2), n - 1] : [0, n - 1];
  const xLabels = xIdx.map((i) => `<text class="dg-achse" x="${x(i)}" y="${H - 8}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}">${kurzDatum(punkte[i].datum)}</text>`).join("");
  const [ex, ey] = xy.at(-1);
  const daten = esc(JSON.stringify({ xy, d: punkte.map((p) => p.datum), w: werte, e: einheit }));
  return `<figure class="diagramm" data-dg="${daten}">
      <svg viewBox="0 0 ${B} ${H}" role="img" aria-label="${esc(name)} über ${n} Trainings, zuletzt ${esc(fmtWert(werte.at(-1), einheit))}">
        ${gitter}${xLabels}
        <path class="dg-flaeche" d="${flaeche}"/>
        <path class="dg-linie" d="${linie}"/>
        <circle class="dg-ende" cx="${ex}" cy="${ey}" r="4"/>
        <text class="dg-wert" x="${ex + 10}" y="${ey + 4}">${fmtZahl(werte.at(-1), einheit)}</text>
        <line class="dg-kreuz" x1="0" x2="0" y1="${O}" y2="${H - U}" visibility="hidden"/>
        <circle class="dg-punkt" cx="0" cy="0" r="5" visibility="hidden"/>
        <rect class="dg-flaeche-hit" x="${L}" y="0" width="${B - L - R}" height="${H}"/>
      </svg>
      <div class="dg-tooltip" hidden></div>
    </figure>`;
}

// Fadenkreuz + Tooltip: springt zum nächsten Training unter dem Finger bzw. Mauszeiger
function diagrammZeigen(fig, clientX) {
  const daten = JSON.parse(fig.dataset.dg);
  const svg = fig.querySelector("svg"), r = svg.getBoundingClientRect();
  const px = ((clientX - r.left) / r.width) * DG.B;
  let i = 0;
  daten.xy.forEach(([a], j) => { if (Math.abs(a - px) < Math.abs(daten.xy[i][0] - px)) i = j; });
  const [a, b] = daten.xy[i];
  const kreuz = svg.querySelector(".dg-kreuz"), punkt = svg.querySelector(".dg-punkt");
  kreuz.setAttribute("x1", a); kreuz.setAttribute("x2", a); kreuz.setAttribute("visibility", "visible");
  punkt.setAttribute("cx", a); punkt.setAttribute("cy", b); punkt.setAttribute("visibility", "visible");
  const tip = fig.querySelector(".dg-tooltip");
  tip.textContent = `${langDatum(daten.d[i])}: ${fmtWert(daten.w[i], daten.e)}`;
  tip.hidden = false;
  tip.style.left = `${(a / DG.B) * 100}%`;
  tip.style.top = `${(b / DG.H) * r.height}px`;
  tip.classList.toggle("links", a > DG.B * 0.6);
  tip.classList.toggle("rechts", a < DG.B * 0.3);
}
function diagrammeVerstecken(ausser) {
  document.querySelectorAll(".diagramm").forEach((fig) => {
    if (fig === ausser) return;
    fig.querySelector(".dg-tooltip").hidden = true;
    fig.querySelectorAll(".dg-kreuz, .dg-punkt").forEach((el) => el.setAttribute("visibility", "hidden"));
  });
}
for (const typ of ["pointermove", "pointerdown"]) {
  document.addEventListener(typ, (ev) => {
    const fig = ev.target.closest?.(".diagramm");
    diagrammeVerstecken(fig);
    if (fig) diagrammZeigen(fig, ev.clientX);
  });
}

// ================= Ansicht: Mobility =================

function renderMobility() {
  return `<p class="hinweis">Geführte Routinen mit Timer. Ein Ton sagt dir, wann es weitergeht, und der Bildschirm bleibt an.</p>
    ${MOBILITY.map((r) => {
      const zuletzt = [...state.verlauf].reverse().find((t) => t.typ === "mobility" && t.routine === r.id);
      const ids = [...new Set(r.ablauf.map(([id]) => id))].slice(0, 4);
      return `<section class="karte routine">
        <div class="routine-bilder">${ids.map((id) => bildKlein(id)).join("")}</div>
        <h2>${esc(r.name)}</h2>
        <p class="slot-meta">${Math.round(mobDauer(r) / 60)} Min. · ${r.ablauf.length} Übungen${zuletzt ? ` · zuletzt ${kurzDatum(zuletzt.datum)}` : ""}</p>
        <p class="hinweis">${esc(r.text)}</p>
        <div class="aktionen klein">
          <button class="btn primaer" data-action="mob-start" data-id="${r.id}">Starten</button>
          <button class="btn" data-action="mob-ansehen" data-id="${r.id}">Übungen ansehen</button>
        </div>
      </section>`;
    }).join("")}`;
}

function mobAnsehen(rid) {
  const r = MOBILITY.find((x) => x.id === rid);
  openModal(`${sheetKopf(r.name)}
    <p class="hinweis">${esc(r.text)} Etwa ${Math.round(mobDauer(r) / 60)} Minuten.</p>
    <div class="ue-liste">${r.ablauf.map(([id, sek, seiten]) => ueZeile(id, `${sek} Sek.${seiten ? " je Seite" : ""}`)).join("")}</div>
    <div class="aktionen"><button class="btn primaer" data-action="mob-start" data-id="${r.id}">Starten</button></div>`);
}

const RING_UMFANG = 2 * Math.PI * 54;

function renderMobPlayer() {
  const m = ui.mob, r = MOBILITY.find((x) => x.id === m.rid);
  const s = m.schritte[m.i], ex = uebung(s.id), naechster = m.schritte[m.i + 1];
  const rest = m.pausiert ? m.rest : m.ende - Date.now();
  return `<div class="player ${m.phase}">
      <div class="player-kopf">
        <span class="label">${esc(r.name)} · ${m.i + 1} / ${m.schritte.length}</span>
        <div class="player-fortschritt"><span style="width:${(m.i / m.schritte.length) * 100}%"></span></div>
      </div>
      ${bildWechsel(s.id)}
      <h2 class="player-name">${m.phase === "bereit" ? '<span class="label">Gleich</span>' : ""}${esc(ex.name)}${s.seite ? ` <span class="badge">${s.seite}</span>` : ""}</h2>
      <div class="player-mitte">
        <button class="rund" data-action="mob-zurueck" aria-label="Zurück">${ICON.zurueck}</button>
        <div class="player-uhr">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle class="ring-hg" cx="60" cy="60" r="54"/>
            <circle id="mob-ring" class="ring" cx="60" cy="60" r="54" stroke-dasharray="${RING_UMFANG}" stroke-dashoffset="${RING_UMFANG * (rest / (m.dauer * 1000))}"/>
          </svg>
          <div class="player-zahl"><strong id="mob-zeit">${Math.ceil(rest / 1000)}</strong><span>${m.pausiert ? "Pausiert" : m.phase === "bereit" ? "Vorbereiten" : "Sekunden"}</span></div>
        </div>
        <button class="rund" data-action="mob-vor" aria-label="Überspringen">${ICON.vor}</button>
      </div>
      <button class="btn primaer gross" data-action="mob-pause">${m.pausiert ? "Weiter" : "Pause"}</button>
      <ul class="liste tipps">${ex.tipps.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      <p class="slot-meta">${naechster ? `Danach: ${esc(uebung(naechster.id).name)}${naechster.seite ? ` (${naechster.seite})` : ""}` : "Letzte Übung"}</p>
      <button class="btn gefahr" data-action="mob-ende" data-bestaetigen="Wirklich beenden?">Beenden</button>
    </div>`;
}

// ================= Ansicht: Einstellungen =================

function renderMehr() {
  const p = state.profil, e = state.einstellungen;
  const profil = p ? `<p class="hinweis">${ZIELE[p.ziel].name} · ${ERFAHRUNG[p.erfahrung].name} · ${p.tage.map((t) => TAGE[t]).join(", ")} · ${p.dauer} Min.<br>
      Geräte: ${p.geraete.length ? p.geraete.map((g) => GERAETE[g] || CARDIO[g]?.name).filter(Boolean).join(", ") : "keine"}<br>
      ${p.vielfalt !== false ? "Möglichst viele Geräte pro Training<br>" : ""}
      Cardio: ${CARDIO_OPTIONEN[p.cardio || "separat"].name}${p.cardioProWoche ? `, ${p.cardioProWoche}× pro Woche` : ""}
      ${p.beschwerden.length ? `<br>Beschwerden: ${p.beschwerden.map((b) => BESCHWERDEN[b]).join(", ")}` : ""}</p>` : "";
  return `
    <section class="karte">
      <h2>Dein Profil</h2>
      ${profil}
      <button class="btn" data-action="fragebogen">Fragebogen ${p ? "ändern" : "ausfüllen"}</button>
      <p class="hinweis">Ein neuer Plan ersetzt deine Änderungen an den Einheiten. Verlauf und Gewichte bleiben erhalten.</p>
    </section>

    <section class="karte">
      <h2>Pausen</h2>
      <p class="hinweis">Die Pause startet automatisch, wenn du einen Satz abhakst.</p>
      <div class="zahlen-raster">
        <span>Verbundübungen (Sek.)</span><input type="number" inputmode="numeric" min="15" step="15" value="${e.pause.verbund}" data-change="pause" data-art="verbund">
        <span>Isolationsübungen (Sek.)</span><input type="number" inputmode="numeric" min="15" step="15" value="${e.pause.isolation}" data-change="pause" data-art="isolation">
      </div>
    </section>

    <section class="karte">
      <h2>Ton & Mobility</h2>
      <label class="schalter"><input type="checkbox" data-change="ton" ${e.ton ? "checked" : ""}> Ton bei Pausenende und Übungswechsel</label>
      <div class="zahlen-raster">
        <span>Vorbereitung zwischen Mobility-Übungen (Sek.)</span><input type="number" inputmode="numeric" min="0" max="30" value="${e.wechsel}" data-change="wechsel">
      </div>
      <button class="btn klein" data-action="ton-test">Ton testen</button>
      <p class="hinweis">Auf dem iPhone ist der Ton nur zu hören, wenn der Stumm-Schalter aus ist. Bei gesperrtem Bildschirm gibt es keinen Ton – während Pausen und Mobility bleibt der Bildschirm deshalb an.</p>
    </section>

    <section class="karte">
      <h2>So steigert die App</h2>
      <p class="hinweis">Jede Übung hat einen Wiederholungsbereich, z. B. 8–12. Bis zur oberen Grenze steigerst du die Wiederholungen – das Ziel pro Satz steht grau im Feld, ein Tipp auf ✓ übernimmt es. Schaffst du in allen Sätzen die obere Grenze, gibt es beim nächsten Mal mehr Gewicht (Multipresse +2,5 kg, Kurzhanteln +2 kg, Beinpresse +5 kg …) und du startest wieder unten im Bereich.</p>
      <p class="hinweis"><strong>Nicht bis zum Muskelversagen:</strong> Lass bei großen Übungen 2–3 Wiederholungen Reserve, bei kleinen 1–2. Das bringt fast denselben Muskelaufbau, braucht weniger Erholung und senkt das Verletzungsrisiko (Empfehlung des American College of Sports Medicine 2026). Die obere Grenze zählt also nur, wenn du sie mit dieser Reserve schaffst.</p>
      <p class="hinweis">Liegst du zweimal hintereinander unter dem Bereich, geht es 10 % runter. Übungen ohne Gewicht steigern den Bereich um 2 Wiederholungen, Halteübungen um 5 Sekunden.</p>
    </section>

    <section class="karte">
      <h2>Daten</h2>
      <p class="hinweis">Alles liegt nur auf diesem Gerät. Exportiere ab und zu eine Sicherung.</p>
      <div class="aktionen">
        <button class="btn" data-action="export">Exportieren</button>
        <label class="btn">Importieren<input type="file" accept="application/json,.json" data-change="import" hidden></label>
        <button class="btn gefahr" data-action="alles-reset" data-bestaetigen="Wirklich alles löschen?">Alles zurücksetzen</button>
      </div>
    </section>

    <section class="karte">
      <h2>Nachweise</h2>
      <p class="nachweise">Übungsbilder aus <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener">free-exercise-db</a> (Unlicense, gemeinfrei), zugeschnitten und verkleinert.</p>
    </section>`;
}

// ================= Aktionen (Klicks) =================

const aktivUebung = (d) => state.aktiv.uebungen[+d.u];

const AKTIONEN = {
  "modal-zu": () => closeModal(),
  tab: (d) => { closeModal(); ui.tab = d.tab; render(); window.scrollTo(0, 0); },

  // Fragebogen & Plan
  fragebogen: () => openModal(`${sheetKopf("Fragebogen")}${fragebogenHtml()}`),
  "geraete-vorlage": (d, el) => {
    const form = el.closest("form"), liste = GERAETE_VORLAGEN[d.vorlage];
    form.querySelectorAll('input[name="geraete"]').forEach((c) => { c.checked = liste.includes(c.value); });
  },
  start: (d) => trainingStarten(+d.index),
  ausgleichen: () => {
    const n = ausgleichen(state.plan, state.profil);
    speichernRender();
    toast(n ? "Plan ausgeglichen" : "Mehr geht in der Trainingszeit nicht – längere Einheiten oder mehr Tage helfen");
  },
  bearbeiten: (d) => editorOeffnen(+d.index),
  "ed-saetze": (d) => {
    const x = state.plan.einheiten[+d.i].uebungen[+d.j];
    x.saetze = clamp(x.saetze + +d.delta, 1, 8);
    speichern(); render(); editorOeffnen(+d.i);
  },
  "ed-hoch": (d) => {
    const l = state.plan.einheiten[+d.i].uebungen, j = +d.j;
    [l[j - 1], l[j]] = [l[j], l[j - 1]];
    speichern(); render(); editorOeffnen(+d.i);
  },
  "ed-weg": (d) => {
    state.plan.einheiten[+d.i].uebungen.splice(+d.j, 1);
    speichern(); render(); editorOeffnen(+d.i);
  },
  "ed-tauschen": (d) => {
    const x = state.plan.einheiten[+d.i].uebungen[+d.j];
    pickerOeffnen({ modus: "tauschen", ziel: "plan", einheit: +d.i, pos: +d.j, alt: x.id });
  },
  "ed-hinzufuegen": (d) => pickerOeffnen({ modus: "hinzufuegen", ziel: "plan", einheit: +d.i }),
  "picker-alle": () => { ui.picker.alle = true; renderPickerListe(); },
  "picker-waehlen": (d) => pickerWaehlen(d.id),
  info: (d) => infoZeigen(d.id),

  // Laufendes Training
  "satz-fertig": (d) => {
    const u = aktivUebung(d), s = u.saetze[+d.s], ex = uebung(u.id);
    if (s.fertig) { s.fertig = false; speichernRender(); return; }
    if (ex.einheit === "kg" && s.kg == null) {
      toast("Erst das Gewicht eintragen");
      $(`input[data-feld="kg"][data-u="${d.u}"][data-s="${d.s}"]`)?.focus();
      return;
    }
    if (s.wdh == null) s.wdh = zielWdh(u, +d.s);
    s.fertig = true;
    for (const t of u.saetze.slice(+d.s + 1)) if (!t.fertig && t.kg == null) t.kg = s.kg;
    const allesFertig = state.aktiv.uebungen.every((x) => x.saetze.every((y) => y.fertig));
    if (!allesFertig) pauseStarten(pauseFuer(u.id));
    speichernRender();
  },
  "satz-plus": (d) => {
    const u = aktivUebung(d), letzter = u.saetze.at(-1);
    u.saetze.push({ kg: letzter?.kg ?? null, wdh: null, fertig: false });
    speichernRender();
  },
  "satz-minus": (d) => {
    const u = aktivUebung(d);
    if (u.saetze.length > 1) u.saetze.pop();
    speichernRender();
  },
  "cardio-geraet": (d) => { state.aktiv.cardio[+d.k].geraet = d.g; speichernRender(); },
  "cardio-fertig": (d) => {
    const c = state.aktiv.cardio[+d.k];
    if (!c.fertig && !(c.minuten > 0)) { toast("Erst die Minuten eintragen"); return; }
    c.fertig = !c.fertig;
    speichernRender();
  },
  "cardio-eintragen": () => cardioFormular(),
  "cardio-verlauf": (d) => cardioVerlaufZeigen(d.g),
  "cardio-metrik": (d) => cardioVerlaufZeigen(d.g, d.metrik),
  "aktiv-tauschen": (d) => pickerOeffnen({ modus: "tauschen", ziel: "aktiv", pos: +d.u, alt: aktivUebung(d).id }),
  "aktiv-hinzufuegen": () => pickerOeffnen({ modus: "hinzufuegen", ziel: "aktiv" }),
  "training-beenden": () => trainingBeenden(),
  "training-verwerfen": () => { state.aktiv = null; ui.pauseFertigBis = 0; speichernRender(); toast("Training verworfen"); },
  "pause-plus": (d) => {
    const a = state.aktiv;
    if (!a?.pauseEnde) return;
    a.pauseEnde = Math.max(Date.now() + 1000, a.pauseEnde + +d.sek * 1000);
    a.pauseDauer = Math.max(1, a.pauseDauer + +d.sek);
    speichern(); tick();
  },
  "pause-weg": () => {
    if (state.aktiv) state.aktiv.pauseEnde = null;
    ui.pauseFertigBis = 0;
    speichern(); tick();
  },

  // Verlauf
  "verlauf-ansicht": (d) => { ui.verlaufAnsicht = d.ansicht; render(); },
  "uebung-verlauf": (d) => uebungVerlaufZeigen(d.id),
  metrik: (d) => uebungVerlaufZeigen(d.id, d.metrik),
  "training-zeigen": (d) => trainingZeigen(d.id),
  "training-loeschen": (d) => {
    state.verlauf = state.verlauf.filter((t) => t.id !== d.id && t.sitzung !== d.id);
    closeModal(); speichernRender(); toast("Gelöscht");
  },

  // Mobility
  "mob-start": (d) => mobStarten(d.id),
  "mob-ansehen": (d) => mobAnsehen(d.id),
  "mob-pause": () => {
    const m = ui.mob;
    if (m.pausiert) { m.ende = Date.now() + m.rest; m.pausiert = false; }
    else { m.rest = Math.max(0, m.ende - Date.now()); m.pausiert = true; }
    render();
  },
  "mob-vor": () => mobVor(ui.mob, true),
  "mob-zurueck": () => mobZurueck(ui.mob),
  "mob-ende": () => mobFertig(false),

  // Einstellungen
  "ton-test": () => { const an = state.einstellungen.ton; state.einstellungen.ton = true; signal("ende"); state.einstellungen.ton = an; },
  export: () => {
    const blob = new Blob([JSON.stringify(state, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `trainingsplaner-${heute()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  "alles-reset": () => { state = neuerState(); ui.mob = null; speichernRender(); toast("Zurückgesetzt"); },
};

document.addEventListener("click", (ev) => {
  audioBereit(); // iOS erlaubt Ton erst nach einer Berührung
  const el = ev.target.closest("[data-action]");
  if (!el || el.disabled) return;
  // Gefährliche Aktionen brauchen einen zweiten Tipp
  if (el.dataset.bestaetigen && !el.classList.contains("scharf")) {
    ev.preventDefault();
    const original = el.textContent;
    el.classList.add("scharf");
    el.textContent = el.dataset.bestaetigen;
    setTimeout(() => { if (el.isConnected) { el.classList.remove("scharf"); el.textContent = original; } }, 3000);
    return;
  }
  const fn = AKTIONEN[el.dataset.action];
  if (fn) { ev.preventDefault(); fn(el.dataset, el); }
});

// ================= Eingaben (change / input / submit) =================

const AENDERUNGEN = {
  "einheit-name": (el) => {
    const name = el.value.trim();
    if (name) { state.plan.einheiten[+el.dataset.i].name = name; speichern(); render(); }
  },
  pause: (el) => {
    const v = parseZahl(el.value);
    if (v != null) state.einstellungen.pause[el.dataset.art] = clamp(Math.round(v), 10, 600);
    speichern();
  },
  ton: (el) => { state.einstellungen.ton = el.checked; speichern(); },
  wechsel: (el) => {
    const v = parseZahl(el.value);
    if (v != null) state.einstellungen.wechsel = clamp(Math.round(v), 0, 30);
    speichern();
  },
  import: (el) => {
    const datei = el.files?.[0];
    if (!datei) return;
    datei.text().then((text) => {
      let ok = false;
      try { ok = Array.isArray(JSON.parse(text).verlauf); } catch { ok = false; }
      if (!ok) { toast("Die Datei passt nicht"); return; }
      state = laden(text);
      speichernRender();
      toast("Daten importiert");
    });
  },
};

const EINGABEN = {
  "picker-suche": (el) => { ui.picker.suche = el.value; renderPickerListe(); },
  // Eingaben im Training sofort merken, ohne neu zu zeichnen (sonst springt der Cursor)
  satz: (el) => {
    const d = el.dataset, u = aktivUebung(d), j = +d.s;
    const wert = parseZahl(el.value);
    if (d.feld === "wdh") { u.saetze[j].wdh = wert == null ? null : Math.round(wert); speichern(); return; }
    // Neues Gewicht auch für die folgenden offenen Sätze übernehmen, die noch das alte hatten
    const alt = u.saetze[j].kg;
    u.saetze[j].kg = wert;
    u.saetze.forEach((s, k) => {
      if (k <= j || s.fertig || s.kg !== alt) return;
      s.kg = wert;
      const feld = $(`input[data-feld="kg"][data-u="${d.u}"][data-s="${k}"]`);
      if (feld) feld.value = el.value;
    });
    speichern();
  },
};

EINGABEN.cardio = (el) => {
  const c = state.aktiv.cardio[+el.dataset.k], wert = parseZahl(el.value);
  if (el.dataset.feld === "minuten") c.minuten = wert == null ? null : Math.round(wert);
  else c.km = wert;
  speichern();
};

const FORMULARE = {
  cardio: (f) => {
    const geraet = feldWert(f, "geraet"), minuten = Math.round(parseZahl(feldWert(f, "minuten")) || 0);
    if (!geraet || minuten <= 0) { toast("Gerät und Minuten angeben"); return; }
    const datum = feldWert(f, "datum") || heute();
    const start = keyDatum(datum).getTime() + 12 * 3600000; // ohne Uhrzeit: Mittag des Tages
    state.verlauf.push(cardioEintrag({ geraet, art: "einzeln", minuten, km: parseZahl(feldWert(f, "km")) }, datum === heute() ? Date.now() - minuten * 60000 : start));
    closeModal();
    speichernRender();
    toast(`${CARDIO[geraet].name}: ${minuten} Min. gespeichert`);
  },
  fragebogen: (f) => {
    const fd = new FormData(f);
    const p = {
      ziel: fd.get("ziel") || "muskel",
      erfahrung: fd.get("erfahrung") || "anfaenger",
      dauer: +fd.get("dauer") || 60,
      tage: fd.getAll("tage").map(Number).sort((a, b) => a - b),
      geraete: fd.getAll("geraete"),
      beschwerden: fd.getAll("beschwerden"),
      cardio: fd.get("cardio") || "separat",
      cardioProWoche: +(fd.get("cardioProWoche") ?? 2),
      vielfalt: fd.get("vielfalt") === "1",
      v: 2,
    };
    if (!p.tage.length) { toast("Bitte mindestens einen Trainingstag wählen"); return; }
    const neu = !state.profil;
    state.profil = p;
    state.plan = planErstellen(p);
    state.naechste = 0;
    state.einstellungen.pause = clone(ZIELE[p.ziel].pause);
    closeModal();
    ui.tab = "training";
    speichernRender();
    window.scrollTo(0, 0);
    toast(neu ? "Dein Plan ist fertig" : "Neuer Plan erstellt");
  },
};

function feldWert(form, name) {
  const el = form.elements.namedItem(name);
  if (el instanceof RadioNodeList) return el.value;
  return el?.value ?? "";
}

document.addEventListener("change", (ev) => {
  const k = ev.target.dataset?.change;
  if (k && AENDERUNGEN[k]) AENDERUNGEN[k](ev.target);
});
document.addEventListener("input", (ev) => {
  const k = ev.target.dataset?.input;
  if (k && EINGABEN[k]) EINGABEN[k](ev.target);
});
document.addEventListener("submit", (ev) => {
  const k = ev.target.dataset?.form;
  if (!k) return;
  ev.preventDefault();
  FORMULARE[k]?.(ev.target);
});
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && !$("#modal").hidden) closeModal();
});
// Nach dem Zurückkommen (Handy war gesperrt) Zeiten sofort aktualisieren
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") tick(); });

// ================= Start =================

render();
setInterval(tick, 250);

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

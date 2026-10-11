# Trainingsplaner

Web-App für Krafttraining und Mobility. Läuft im Browser und lässt sich auf dem iPhone als App auf den Home-Bildschirm legen. Ohne Server, ohne Konto: Alle Daten liegen lokal auf dem Gerät.

## Funktionen

- **Fragebogen → Plan:** Ziel (Kraft, Muskelaufbau, Fitter werden), Erfahrung, Trainingstage, Dauer, vorhandene Geräte, Ausdauergeräte, Cardio-Wunsch und optional Beschwerden. Daraus entsteht der Plan: 1–3 Tage Ganzkörper, 4 Tage Ober-/Unterkörper, 5–6 Tage Push/Pull/Beine. Es kommen nur Übungen vor, für die du die Geräte hast. Übungen, die eine angegebene Beschwerde stärker belasten, rücken nach hinten.
- **Geräte:** Langhantel, Multipresse, Kurzhanteln, Hantelbank, Latzug/Rudermaschine, Kabelzug (z. B. Precor FTS Glide), Beinpresse (mit Wadendrücken), Bauchmaschine, weitere Studiogeräte, Klimmzugstange, Dipbarren. Manche Übungen gehen an mehreren Geräten, z. B. Rudern am Latzug oder am Kabelzug.
- **Cardio:** Joggen und Radfahren draußen, im Studio Laufband, Crosstrainer, Fahrrad-Ergometer oder Rudergerät. Standard: Ausdauer an eigenen Tagen mit Wochenziel (z. B. 2×), im Studio nur 5 Min. Aufwärmen. Alternativ 20 Min. Ausdauer direkt nach dem Krafttraining. Im Verlauf: Dauer, Distanz und Tempo pro Art. Beim Joggen als Pace (min/km), beim Radfahren in km/h.
- **Muskelbalance:** Für einen ausgewogenen, natürlich wirkenden Muskelaufbau rechnet die App die Sätze pro Woche je Muskelgruppe aus (Brust, Rücken, seitliche und hintere Schulter, Bizeps, Trizeps, vorderer Oberschenkel, Beinrückseite, Gesäß, Waden, Bauch). Arbeitet ein Muskel nur mit, zählt der Satz halb. Der Plan wird automatisch so ausgeglichen, dass jede Gruppe im Zielbereich liegt (Anfänger 6–12, Fortgeschrittene 10–18, Erfahrene 12–22 Sätze), soweit die Trainingszeit reicht. Höchstens 4 Sätze pro Übung, sonst kommt eine zweite Übung dazu. Nach eigenen Änderungen lässt sich mit „Ausgleichen“ nachjustieren.
- **Gerätevielfalt:** Optional bevorzugt jede Einheit Übungen, die ein dort noch unbenutztes Gerät nutzen.
- **Plan bearbeiten:** Übungen tauschen (passende Alternativen zuerst), hinzufügen, entfernen, umsortieren, Sätze ändern.
- **Training:** Gewicht und Wiederholungen pro Satz eintragen. Das Ziel pro Satz steht grau im Feld, ein Tipp auf ✓ übernimmt es. Ein geändertes Gewicht wandert in die folgenden Sätze mit. Aufwärm-Vorschlag bei schweren Verbundübungen.
- **Pausentimer:** Startet beim Abhaken automatisch, ±15 Sekunden, Ton und Vibration am Ende. Während der Pause bleibt der Bildschirm an. Standard beim Muskelaufbau: 2 Min. bei großen, 90 Sek. bei kleinen Übungen (einstellbar).
- **Reserve statt Muskelversagen:** Bei jeder Übung steht, wie viele Wiederholungen du übrig lassen sollst: 2–3 bei großen, 1–2 bei kleinen Übungen (Empfehlung des American College of Sports Medicine 2026).
- **Aufwärmsätze:** Bei der ersten großen Übung für Oberkörper und für Beine schlägt die App zwei leichte Sätze vor (etwa 50 % × 8, 75 % × 3). Dazu kommen 5 Min. locker auf einem Ausdauergerät oder die Aufwärm-Routine aus Mobility.
- **Automatische Steigerung (doppelte Progression):** Schaffst du in allen Sätzen die obere Grenze des Bereichs, gibt es beim nächsten Mal mehr Gewicht. Bis dahin steigerst du die Wiederholungen. Liegst du zweimal hintereinander unter dem Bereich, geht es 10 % runter. Übungen ohne Gewicht steigern Wiederholungen bzw. Sekunden.
- **Verlauf:** Diagramm pro Übung (Gewicht, geschätztes Maximum, Volumen), Bestwerte, alle Sätze als Tabelle, Liste aller Trainings, Wochenübersicht.
- **Mobility:** 5 geführte Routinen (Morgen, Aufwärmen, Dehnen nach dem Training, Hüfte & unterer Rücken, Schultern & Nacken) mit Timer, Seitenwechsel, Ton und Bildschirm-an.
- **Anleitungen:** Jede Übung mit zwei Bildern (Start- und Endposition im Wechsel), Kurzanleitung und Links zu Video-Erklärungen auf YouTube (deutsch und englisch).

## Lokal ausprobieren

Für den vollen Funktionsumfang (Offline-Modus, Bilder-Cache) braucht es einen kleinen Server:

```
cd Trainingsplaner
python -m http.server 8000
```

Dann <http://localhost:8000> öffnen. `index.html` per Doppelklick geht auch, aber ohne Offline-Modus.

## Aufs iPhone bringen (GitHub Pages, kostenlos)

1. Auf github.com ein neues **öffentliches** Repository anlegen, z. B. `training`.
2. „Add file“ → „Upload files“ und alle Dateien aus diesem Ordner hochladen, dazu den Ordner `bilder` als Ganzes ins Upload-Feld ziehen.
3. Im Repository: **Settings** → **Pages** → Source „Deploy from a branch“, Branch `main`, Ordner `/ (root)` → Save.
4. Nach etwa einer Minute ist die App unter `https://<dein-name>.github.io/training/` erreichbar.
5. Auf dem iPhone in **Safari** öffnen → Teilen-Symbol → **Zum Home-Bildschirm**.

Beim ersten Öffnen lädt die App alle Übungsbilder (etwa 6 MB) in den Hintergrund-Speicher, danach funktioniert sie auch ohne Empfang im Studio.

Updates: geänderte Dateien wieder hochladen. Die App lädt beim nächsten Öffnen die neue Version.

**Ton:** Auf dem iPhone nur hörbar, wenn der Stumm-Schalter aus ist. Bei gesperrtem Bildschirm gibt es keinen Ton, deshalb bleibt der Bildschirm während Pausen und Mobility an. Vibration unterstützt Safari nicht.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seitengerüst, Navigation, Pausenleiste |
| `app.js` | Logik und Ansichten (Fragebogen, Plan, Training, Verlauf, Mobility, Einstellungen) |
| `data.js` | Übungen, Bewegungsmuster, Einheiten-Vorlagen, Splits, Wiederholungsbereiche, Mobility-Routinen |
| `style.css` | Gestaltung (hell/dunkel) |
| `bilder/` | Übungsbilder `<id>-0.jpg` (Start) und `<id>-1.jpg` (Ende), 600 × 400 px |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | Home-Bildschirm-App und Offline-Modus |

## Übungen ergänzen

1. Passende Übung in [free-exercise-db](https://github.com/yuhonas/free-exercise-db) suchen (Ordner unter `exercises/`), z. B. `Dumbbell_Lunges`.
2. In `data.js` unter `UEBUNGEN` mit diesem Namen als Schlüssel eintragen: deutscher Name, Geräte, Level, Art (`verbund`/`isolation`), Einheit (`kg`/`wdh`/`sek`), Steigerungsschritt, Muskeln, Tipps.
3. In `MUSTER` in die passende Liste aufnehmen. Die Reihenfolge bestimmt, was der Plan bevorzugt.
4. Die beiden Bilder `0.jpg` und `1.jpg` als `bilder/<id>-0.jpg` und `bilder/<id>-1.jpg` ablegen (3:2, z. B. 600 × 400 px).

## Nachweise

Übungsbilder und Grundlage der Übungsauswahl: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) von yuhonas, Unlicense (gemeinfrei). Bilder zugeschnitten und verkleinert, Anleitungen auf Deutsch neu geschrieben.

## Ideen für später

- Sporttage mit dem Essensplaner abgleichen (mehr Kohlenhydrate an Trainingstagen).
- Eigene Mobility-Routinen zusammenstellen.
- Körpergewicht und Maße mit Verlauf.

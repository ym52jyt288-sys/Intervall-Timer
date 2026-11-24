# Umsetzungsplan für Codex · Intervalltimer fürs iPhone

## Auftrag

Erstelle eine deutschsprachige, statische Web-App für GitHub Pages. Wer dehnt, soll einen eigenen Intervalltimer in wenigen Schritten anlegen, am iPhone speichern und beim nächsten Training mit einem Tipp starten können. Beim Training steht das iPhone sichtbar in der Nähe. Der Countdown muss aus etwas Entfernung lesbar sein. Ein kurzer Ton kündigt jeden Phasenwechsel an.

## Bedienung

| Ansicht | Inhalt und Verhalten |
| --- | --- |
| Meine Timer | Im leeren Zustand führt „Timer erstellen“ direkt zum ersten Intervall. Jeder gespeicherte Timer zeigt Name, Übung oder Blockanzahl, Gesamtdauer und eine direkt erreichbare Starttaste. Bearbeiten und Löschen liegen im Menü des jeweiligen Timers. |
| Timer bearbeiten | Unter dem Timernamen startet der Editor mit einem Block. Jeder Block hat einen optionalen Übungsnamen sowie Felder für Belastung, Pause und Runden. „Block hinzufügen“ hängt einen weiteren an. Dauer in Sekunden, Runden als Anzahl eingeben. Zeitwerte lassen sich direkt per Zahlentastatur ändern. Vorschau und Gesamtdauer reagieren sofort. „Speichern“ führt zur Übersicht. |
| Laufender Timer | Oben stehen Übungsname, Phase und „Runde 2 von 4“. Bei mehreren Blöcken ergänzt „Block 1 von 2“ die Orientierung. In der Mitte steht groß die verbleibende Phasenzeit, etwa **00:28**. Darunter folgt eine einzelne Vorschau, etwa „Danach 10 s Pause“ oder „Danach Hüfte · 20 s“. Im letzten Schritt steht „Danach fertig“. Unten liegt die große Taste „Anhalten“, im angehaltenen Zustand „Fortsetzen“. |
| Abschluss | Nach dem letzten Schritt erscheinen „Geschafft“, der Name des Timers und die Aktionen „Erneut starten“ und „Meine Timer“. |

## Intervallregeln

- Ein Timer besteht aus mindestens einem Block. Jeder Block wiederholt seine eigene Folge von Belastung und Pause. Mit der letzten Runde geht der Timer automatisch zum nächsten Block über.
- Im Editor bleibt jeder Block auch bei vielen Wiederholungen eine kompakte Zeile, etwa **Wade · 4 × 30 s · 10 s Pause**. Antippen öffnet die Felder. Blöcke lassen sich verschieben und entfernen. Fehlt ein Übungsname, verwendet die App „Block 1“, „Block 2“ usw.
- „Pause nach der letzten Belastung“ gilt für den gesamten Timer und ist beim Anlegen ausgeschaltet. Als Regel für den Blockwechsel gilt die Pause des gerade beendeten Blocks einmal als Wechselzeit. Beispiel: Nach der letzten Wadenrunde folgen 10 Sekunden Pause, dann beginnt die Hüftübung.


- Timer starten sofort mit der ersten Belastung. Beim Anhalten friert die Restzeit ein. Fortsetzen beginnt genau an dieser Stelle. „Beenden“ ist eine eigene Aktion mit Bestätigung.
- Gültige Eingaben sind ein ausgefüllter Name, ganzzahlige Belastungszeit ab 1 Sekunde, Pausenzeit ab 0 Sekunden und mindestens eine ganze Runde. Bei 0 Sekunden Pause wechseln die Runden direkt. Zeige Eingabefehler direkt am Feld und erhalte die bisherigen Eingaben.
- Für den ersten Entwurf 30 Sekunden Belastung, 10 Sekunden Pause und 4 Runden vorbelegen. Der Nutzer kann alle drei Werte direkt ändern.

## Gestaltung

Helle, ruhige Oberfläche, iPhone-Systemschrift und großzügige Abstände. Eine Akzentfarbe kennzeichnet Belastung, eine zweite zurückhaltende Farbe kennzeichnet Pause. Jede Phase trägt zusätzlich ihren ausgeschriebenen Namen. Den Countdown mit gleich breiten Ziffern setzen, damit beim Sekundenwechsel nichts springt. Die Hauptaktion liegt im unteren, mit dem Daumen erreichbaren Bereich. Bedienelemente mindestens 44 × 44 CSS-Pixel groß gestalten und den Abstand zum Home-Indikator berücksichtigen. Im Trainingsmodus zeigt die App nur den aktuellen Schritt, den Fortschritt und den nächsten Wechsel.

## Umsetzung in vier Schritten

1. **Abläufe berechnen.** Definiere das Datenmodell mit stabiler Timer-ID, Name, geordneten Blöcken und einer Einstellung für die letzte Pause. Jeder Block enthält eine ID, den Übungsnamen, beide Dauern und die Rundenzahl. Erzeuge daraus eine geordnete Phasenliste. Vorschau, Gesamtdauer, Wiedergabe und Abschluss verwenden dieselbe Berechnung.
2. **Erstellen und speichern.** Baue Übersicht und Editor. Speichere beim Bestätigen lokal auf dem Gerät, etwa als versioniertes JSON in `localStorage` unter einem app-spezifischen Schlüssel. Fange Speicherfehler ab und lass den Entwurf in diesem Fall geöffnet. Bearbeiten aktualisiert den gewählten Timer, Löschen erfordert eine Bestätigung.
3. **Timer und Signale.** Berechne die laufende Zeit aus einer Zeitreferenz. Nutze Aktualisierungstakte nur für die Anzeige. Aktiviere die Audioausgabe beim Tippen auf „Starten“. Verwende kurze, unterscheidbare Töne für Belastung, Pause und Abschluss. Ein Tonschalter merkt sich die Auswahl. Fordere während eines sichtbaren, laufenden Timers nach Möglichkeit einen Screen Wake Lock an und gib ihn bei Stopp oder Ende frei. Beim Zurückkehren die aktuelle Phase aus der verstrichenen Zeit bestimmen und überholte Signale überspringen.
4. **Für GitHub Pages bereitstellen.** Für ein neues Repository reichen HTML, CSS und JavaScript-Module. Liefere eine statische Startseite, App-Manifest, App-Symbol und iPhone-Home-Bildschirm-Symbol. Verwende relative Ressourcenpfade, damit die App auch unter `/<repository>/` funktioniert. Beschreibe in der README knapp die lokale Vorschau, das Aktivieren von Pages und „Zum Home-Bildschirm“ auf dem iPhone.

## Abnahme

| Testablauf | Erwartetes Ergebnis |
| --- | --- |
| Wade · 4 Runden · 30 s Belastung · 10 s Pause | 4 Belastungen und 3 Pausen ergeben **2:30 min**. |
| Derselbe Timer, letzte Pause aktiviert | Eine vierte Pause kommt hinzu. Die Vorschau und der Timer enden bei **2:40 min** Gesamtdauer. |
| Wade wie oben, danach Hüfte · 2 Runden · 20 s Belastung · 5 s Pause | Bei deaktivierter letzter Pause dauert der Timer **3:25 min**. Die 10 s Wechselzeit nach Wade zählen genau einmal. Währenddessen kündigt die Vorschau „Hüfte“ an. |
| 1 Runde · 15 s Belastung · 0 s Pause | Nach **15 s** erfolgt unmittelbar der Abschluss, auch bei aktivierter letzter Pause. |

- Einen Timer speichern, die Web-App schließen und erneut öffnen. Name und Werte sind in derselben Web-App wieder verfügbar. Eine Änderung erzeugt kein Duplikat.
- Mit einem kurzen Testtimer die Phasenwechsel in iPhone-Safari und beim Start über den Home-Bildschirm prüfen. Jeder Wechsel spielt bei aktiviertem Ton genau ein Signal. Bei ausgeschaltetem Ton bleiben alle Phasen visuell eindeutig.
- Während der Belastung anhalten, einige Sekunden warten und fortsetzen. Die Restzeit ist während des Anhaltens unverändert. Ein zwischenzeitlicher App-Wechsel während eines laufenden Timers führt beim Zurückkehren zur zeitlich richtigen Phase oder zum Abschluss.
- Auf einem schmalen iPhone prüfen, ob Start, Anhalten und Fortsetzen ohne horizontales Scrollen erreichbar sind. Auf der veröffentlichten Projektseite prüfen, ob Symbole, Stil und Skripte geladen werden.

## Option für später

Bei Bedarf einzelne Timer als kleine JSON-Datei exportieren, über das iPhone teilen und auf einem zweiten Gerät importieren. Beim Import Struktur und Werte validieren und eine neue lokale Kopie anlegen. Die erste Version konzentriert sich auf das Speichern und Starten auf demselben Gerät.

## Technische Referenzen

- [GitHub Docs – Hosting und Projektpfad von GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [WebKit – Web-Apps auf dem Home-Bildschirm](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)
- [MDN – Bildschirm während der Nutzung aktiv halten](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)

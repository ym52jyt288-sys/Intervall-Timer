# Intervall

Deutschsprachiger Intervalltimer für Dehnübungen auf dem iPhone. Beim ersten Öffnen stehen Fokus, Takt und Horizont zur Auswahl. Ein Tipp auf „Design“ in „Meine Timer“ öffnet den Vergleich erneut. Timer, Design und Tonwahl werden lokal im jeweiligen Browser bzw. in der installierten Web-App gespeichert.

## Lokale Vorschau

Für einen schnellen Designvergleich lässt sich `index.html` direkt im Browser öffnen. Für einen stabilen Speicherort die App im Projektordner mit `python3 -m http.server 8000` starten und [die lokale Vorschau](http://localhost:8000/) öffnen. Die App benötigt keinen Build.

## GitHub Pages

Die App-Dateien einschließlich des Ordners `icons` in das Stammverzeichnis des gewünschten Repository-Branches übernehmen. Unter **Settings → Pages → Build and deployment** die Quelle **Deploy from a branch** wählen, den Branch und **/(root)** auswählen und speichern. Nach dem Deployment die unter Pages angezeigte HTTPS-Adresse öffnen. Alle Ressourcen verwenden relative Pfade. [GitHub-Anleitung](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Auf dem iPhone

Die veröffentlichte Adresse in Safari öffnen. Über **Teilen → Zum Home-Bildschirm** hinzufügen und, falls angeboten, **Als Web-App öffnen** aktivieren. Anschließend Intervall über das neue Symbol starten und dort die eigenen Timer anlegen. [WebKit zur Home-Bildschirm-App](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)

„Timer erstellen“ öffnet den ersten Block. Belastung, Pause und Rundenzahl eingeben und bei Bedarf weitere Blöcke hinzufügen. Die Vorschau berücksichtigt die Wechselpause zwischen zwei Übungen. Nach dem Speichern startet der Timer über die Starttaste neben seinem Namen.

Im Training wechselt „Zurück“ zum Anfang des vorherigen Schritts und „Weiter“ zum Anfang des nächsten. „Neu starten“ wiederholt die aktuelle Belastung oder Pause. Im letzten Schritt führt „Abschließen“ zum Abschluss. Mit „Anhalten“ friert die Restzeit ein. Du kannst auch dann den Schritt wechseln und anschließend mit „Fortsetzen“ weitermachen. Bei der Rückkehr aus einer anderen App berechnet Intervall die aktuelle Phase aus der verstrichenen Zeit. Der Tonschalter steuert die Signale. Solange der Timer sichtbar läuft, fordert er auf unterstützten Geräten einen Screen Wake Lock an. [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)

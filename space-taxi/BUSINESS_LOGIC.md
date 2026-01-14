# Space Taxi - Business Logik Dokumentation

Dieses Dokument beschreibt die Business Logik und die Spielmechaniken des "Space Taxi - Ultra 16-Bit Edition" Spiels, basierend auf der Implementierung in `index.html`.

## 1. Spielkonzept
Space Taxi ist ein physikbasierter Simulator, in dem der Spieler ein Weltraum-Taxi steuert, um Passagiere zwischen verschiedenen Plattformen zu transportieren. Das Ziel ist es, durch effizientes Fliegen Geld zu verdienen und alle Level erfolgreich zu absolvieren.

## 2. Kern-Mechaniken

### 2.1 Steuerung & Physik
*   **Schub (Thrust):**
    *   **Oben (W/↑):** Erzeugt vertikalen Schub gegen die Schwerkraft. Hoher Treibstoffverbrauch.
    *   **Links/Rechts (A/D/←/→):** Erzeugt horizontalen Schub und neigt das Taxi leicht.
*   **Schwerkraft:** Eine konstante Kraft zieht das Taxi nach unten (vy += 0.04).
*   **Dämpfung:** Sowohl horizontale als auch vertikale Geschwindigkeiten werden über Zeit leicht gedämpft (Faktor 0.98).
*   **Rotation:** Das Taxi neigt sich bei seitlichem Schub (angle = +/- 0.15), stabilisiert sich aber automatisch im Schwebeflug (angle *= 0.85).

### 2.2 Lande-Logik
Eine Landung ist erfolgreich, wenn:
1.  Das Taxi eine Plattform berührt.
2.  Die Gesamtgeschwindigkeit (Speed) unter `MAX_LANDING_SPD` (aktuell `1.0`) liegt.
3.  Der Neigungswinkel des Taxis minimal ist (Absolutwert < `0.25`).
*   **Fehler:** Bei zu hoher Geschwindigkeit oder zu starker Neigung explodiert das Taxi (Crash).

### 2.3 Treibstoff-Management (Fuel)
*   **Verbrauch:** Jede Form von Schub verbraucht Treibstoff. Vertikaler Schub ist teurer (`0.18`) als horizontaler Schub (`0.07`).
*   **Warnung:** Sinkt der Tank unter 20%, blinkt die Anzeige. Bei 0% fällt der Antrieb aus.
*   **Auftanken:** An markierten Tankstellen (Platform mit `fuel: true`, grün leuchtend) kann der Tank aufgefüllt werden, solange das Taxi dort gelandet ist (Rate: `0.5` pro Frame).
*   **Kosten:** Das Auftanken kostet Geld (Rate: `0.1` pro Frame).

## 3. Wirtschaftssystem & Fortschritt

### 3.1 Geld (Cash)
*   **Einnahmen:** Pro erfolgreich abgeliefertem Passagier erhält der Spieler `100$`.
*   **Ausgaben:** Treibstoffkosten werden beim Tanken direkt vom Konto abgezogen.

### 3.2 Passagier-Logik
Jedes Level hat eine Liste von Passagieren mit einem Start- (`f` für from) und Zielpunkt (`t` für to).
1.  **Zustand WAITING:** Der Passagier wartet auf seiner Startplattform.
2.  **Pick-Up:** Das Taxi muss auf der Plattform des Passagiers landen.
3.  **Zustand IN_TAXI:** Der Passagier ist an Bord. Die Zielplattform wird im HUD angezeigt.
4.  **Delivery:** Das Taxi landet auf der Zielplattform. Der Passagier steigt aus und das Geld wird gutgeschrieben.

### 3.3 Level-Struktur
*   Ein Level gilt als abgeschlossen ("Sektor klar"), sobald alle (standardmäßig 3) Passagiere transportiert wurden.
*   In `index.html` gibt es aktuell 2 definierte Sektoren.
*   Nach dem letzten Level wird der Gesamtstatus "GALAXY TAXI TYCOON" verliehen.

## 4. Game States (Spielzustände)
*   **START:** Startbildschirm mit Missionsbeschreibung.
*   **PLAYING:** Aktives Gameplay.
*   **CRASHED:** Taxi zerstört durch Kollision oder harte Landung.
*   **SUCCESS:** Alle Level erfolgreich absolviert.

*Hinweis: Ein Pause-System (PAUSED) ist in dieser Version der index.html nicht implementiert.*

## 5. Game-Over Bedingungen
Das Spiel endet bzw. muss neugestartet werden, wenn:
1.  Das Taxi eine Wand berührt.
2.  Eine Landung zu hart erfolgt.
3.  Das Taxi ohne Treibstoff auf einer Plattform landet, die keine Tankstelle ist (Gestrandet).
4.  Der Treibstoff im Flug ausgeht und das Taxi unkontrolliert abstürzt.

---
*Dokumentation aktualisiert von Antigravity am 14. Januar 2026 basierend auf index.html.*

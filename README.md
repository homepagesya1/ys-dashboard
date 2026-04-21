# ys-dashboard

Persönliches Web-Dashboard für [dashboard.yannicksalm.ch](https://dashboard.yannicksalm.ch)

## Was ist das?

Ein modulares, persönliches Dashboard mit Widgets für Fitness-Tracking, Bike-Stats, DJ-Logs, Tech-Infra-Monitoring und mehr. Gebaut mit React + Vite, gehostet auf Cloudflare Pages, Datenbank via Supabase.

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React + Vite (JavaScript) |
| Styling | CSS (custom, kein Framework) |
| Datenbank | Supabase (PostgreSQL) |
| Hosting | Cloudflare Pages |
| Domain | dashboard.yannicksalm.ch |

## Seiten & Features

- **Overview** — Haupt-Dashboard mit frei konfigurierbaren Widgets
- **Fitness** — Gewicht tracken, Gym-Sessions und Cardio-Runs loggen
- **Bike & Cycling** — Strava-Integration, Scott Spark Status, Ride-History
- **Tech & Infra** — GitHub Repos, Cloudflare Status, Geräte-Übersicht
- **DJ** — Set-Logs, Setup-Infos, Mixxx/Controller-Status

## Projektstruktur

```
src/
├── components/
│   ├── Topbar.jsx          # Topbar mit Hamburger-Menü
│   ├── SideMenu.jsx        # Slide-in Navigation
│   └── widgets/            # Wiederverwendbare Widget-Komponenten
├── pages/
│   ├── Overview.jsx
│   ├── Fitness.jsx
│   ├── Bike.jsx
│   ├── Tech.jsx
│   └── DJ.jsx
├── App.jsx                 # Routing + Layout
├── App.css                 # Globale Styles
└── main.jsx                # Entry Point
```

## Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Dev-Server starten
npm run dev
# → http://localhost:5173
```

## Deploy

Automatisch via Cloudflare Pages bei jedem Push auf `main`:

```bash
git add .
git commit -m "deine nachricht"
git push
```

Cloudflare baut und deployed automatisch auf `dashboard.yannicksalm.ch`.

## APIs & Integrationen

| Service | Zweck | Status |
|---|---|---|
| OpenWeatherMap | Wetter Zürich | geplant |
| GitHub API | Repo-Status | geplant |
| Cloudflare API | DNS + Pages Status | geplant |
| Strava API | Bike Rides | geplant |
| Supabase | Fitness-Daten | geplant |

## Roadmap

- [x] Projekt Setup (React + Vite)
- [x] GitHub Repo
- [ ] Shell: Topbar, Navigation, Widget-Grid
- [ ] Supabase: Gewicht, Gym, Cardio
- [ ] Live APIs einbinden
- [ ] Deploy auf dashboard.yannicksalm.ch

---

*Privates Projekt — Yannick Salm - ttt*

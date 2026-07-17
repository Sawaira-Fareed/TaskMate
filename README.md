# Zaria — Your Medium to Everything

![Vite](https://img.shields.io/badge/Vite-6.x-purple)
![React](https://img.shields.io/badge/React-19-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-cyan)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![PWA](https://img.shields.io/badge/PWA-Ready-orange)

## Overview

**Zaria** is a Progressive Web Application that connects customers with local service providers in Pakistan. Just type what you need in Urdu or English — AI handles the rest.

No phone calls. No manual searching. Just describe your problem and get matched with the nearest available provider.

---

## Try It

🔗 **[zaria-pk.vercel.app](https://zaria-pk.vercel.app)**

---

## Features

- 🔍 **AI-Powered Request Parsing** — Type in plain Urdu or English
- 🎯 **Smart Provider Matching** — Sorted by distance, rating, and tier
- ⚡ **Real-Time Updates** — Live status on all dashboards via Supabase Realtime
- 📱 **PWA** — Install on mobile, works offline, push notifications
- 🎤 **Voice Notes** — Record and send audio messages with requests
- ⭐ **Rating System** — Rate providers after job completion
- 🛡️ **CNIC Verification** — Identity verification with camera upload
- 👑 **Admin Dashboard** — Approve, reject with reason, or permanently block providers
- 🌙 **Dark Mode** — Full light/dark theme toggle
- 🌐 **Bilingual** — Urdu and English throughout the entire app

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React 19 + TailwindCSS |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| AI | Gemini API + Groq API (fallback) |
| PWA | Web Push API, Service Worker |
| Hosting | Vercel |

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Customer | `customer@gmail.com` | `customer123` |
| Provider | `provider@gmail.com` | `provider123` |
| Admin | `admin@gmail.com` | `admin123` |

> Providers must be approved by an admin before receiving requests.

---

## Team

- Hanzala Ahsan
- Sawaira Fareed

---

## License

© 2026 Zaria. All rights reserved.
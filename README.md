# Zaria — Your Medium to Everything

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
![Vite](https://img.shields.io/badge/Vite-6.x-purple) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
![React](https://img.shields.io/badge/React-19-blue) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-cyan) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
![PWA](https://img.shields.io/badge/PWA-Ready-orange)

## Overview

**Zaria** is a Progressive Web Application that connects customers with local service providers and ride drivers in Pakistan. No phone calls. No manual searching. Just describe what you need and get matched instantly.

---

## Try It

🔗 **[zaria-pk.vercel.app](https://zaria-pk.vercel.app)**

---

## What Zaria Does

### For Customers
- **Book a Service.** Need a plumber, electrician, grocery delivery, or computer repair? Type what you need in Urdu or English and get matched with the nearest verified provider.
- **Book a Ride.** Need a rickshaw, bike, or car? Enter pickup and dropoff — drivers bid their fares and you pick the best offer.
- **Browse Providers.** See all available providers with ratings, completed jobs, and service types. Book directly from their profile.
- **In-App Chat.** Message your provider without sharing your phone number. Real-time chat with read receipts.
- **Real-Time Tracking.** Watch your request go from pending to confirmed — no refreshing needed.

### For Providers
- **Get Leads Passively.** Receive service requests and ride bookings without being online 24/7.
- **Set Your Own Fares.** For rides, offer your price. Customer chooses the best deal.
- **Build Your Reputation.** Earn ratings, complete jobs, and climb from Bronze to Gold tier.
- **Free & Pro Plans.** Free providers get 4 bookings per week. Go Pro for unlimited bookings, priority matching, and a verified badge.
- **Push Notifications.** Get alerted about new requests even when the app is closed.

### For Admins
- **Verify Providers.** Review CNIC images, certificates, and approve or reject with a reason message.
- **Manage Pro Upgrades.** Approve Pro plan requests after verifying payment screenshots.
- **Platform-Wide Announcements.** Send notifications to all users from one dashboard.
- **Block Malicious Users.** Permanently block providers who misuse the platform.

---

## Key Features

- **No Phone Calls.** Everything happens through the app — booking, chat, and confirmation.
- **Urdu & English.** Full bilingual support across every page.
- **Location Sharing.** Share your GPS coordinates or type a mohalla name. No address needed in Jand.
- **Dark Mode.** Built-in theme toggle across all screens.
- **Installable PWA.** Add to home screen — works like a native app. Push notifications even when closed.
- **Realtime Everything.** Requests, bookings, messages, and notifications update live via Supabase Realtime.
- **Verified Providers.** CNIC verification + certificate upload before going live.
- **Voice Notes.** Record and send voice notes with your service requests.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React 19 + TailwindCSS |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| AI | Gemini API + Groq API (fallback) |
| PWA | vite-plugin-pwa, Web Push API, Service Worker |
| Hosting | Vercel |

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Customer | `customer@gmail.com` | `customer123` |
| Provider | `provider@gmail.com` | `provider123` |
| Admin | `admin@gmail.com` | `admin123` |

> Providers must be approved by an admin before receiving requests. Ride providers must also select a vehicle type.

---

## Team

- Hanzala Ahsan
- Sawaira Fareed

---

## License

© 2026 Zaria. All rights reserved.
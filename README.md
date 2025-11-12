# 🏍️ GARAGE CONNECT - B2B2C Motorcycle Platform

## 🎯 Overview

**Garage Connect** trasforma le officine moto in community digitali. Ogni officina ha la propria app brandizzata dove i clienti possono:
- Tracciare i propri viaggi
- Gestire la manutenzione con storico verificato
- Condividere esperienze con altri motociclisti della stessa officina
- Scoprire ristoranti e percorsi consigliati dalla community
- Prenotare appuntamenti online

## 📁 Struttura Progetto

```
garage-connect/
├── customer-app/          # React app per motociclisti
├── workshop-dashboard/    # React dashboard per officine  
├── landing-page/          # Marketing website
├── supabase/             # Database schema + migrations
└── docs/                 # Documentazione setup
```

## 🚀 Quick Start

### 1. Setup Supabase

```bash
# Vai su https://supabase.com
# Crea nuovo progetto: "garage-connect"
# Copia le credenziali
```

### 2. Esegui SQL Schema

```bash
cd supabase
# Copia il contenuto di schema.sql
# Incollalo in Supabase SQL Editor
# Run
```

### 3. Setup Customer App

```bash
cd customer-app
npm install
cp .env.example .env.local
# Aggiungi le tue credenziali Supabase
npm run dev
```

### 4. Setup Workshop Dashboard

```bash
cd workshop-dashboard
npm install
cp .env.example .env.local
npm run dev
```

### 5. Deploy

```bash
# Customer App su Vercel
vercel --prod

# Workshop Dashboard su Vercel  
vercel --prod
```

## 🎨 Demo per Aroni Moto

### Setup Tenant Aroni

1. Crea workshop in Supabase:
```sql
INSERT INTO workshops (name, slug, logo_url, primary_color, secondary_color)
VALUES (
  'Aroni Moto',
  'aroni-moto',
  'https://www.aronimoto.it/logo.png',
  '#E30613',
  '#1A1A1A'
);
```

2. Crea clienti demo
3. Popola con dati di esempio
4. Deploy su: aroni-moto.garageconnect.app

## 💰 Business Model

| Piano | Prezzo | Clienti | Features |
|-------|--------|---------|----------|
| FREE | €0 | 20 | Base features |
| PRO | €49/mese | 100 | Community + Branding |
| ENTERPRISE | €149/mese | ∞ | Analytics + API |

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Maps**: Leaflet.js
- **Charts**: Recharts
- **Deploy**: Vercel
- **Payments**: Stripe (coming soon)

## 📞 Support

Created by Ray - EAR LAB Digital Solutions
Contact: [tuo@email.com]

## 📄 License

Proprietary - © 2024 Garage Connect

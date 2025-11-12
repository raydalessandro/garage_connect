# 🚀 GARAGE CONNECT - GUIDA SETUP COMPLETA

## 📋 Prerequisiti

- Account Supabase (gratuito)
- Account Vercel (gratuito)
- Account GitHub
- Node.js installato (v18+)

---

## PARTE 1: SETUP SUPABASE (15 minuti)

### Step 1: Crea Progetto Supabase

1. Vai su https://supabase.com
2. Sign up / Login
3. Click "New project"
4. Compila:
   - **Name**: garage-connect
   - **Database Password**: scegli una password sicura (salvala!)
   - **Region**: Europe West (Frankfurt)
   - **Pricing Plan**: Free
5. Click "Create new project"
6. Aspetta 2-3 minuti che il database venga creato

### Step 2: Esegui SQL Schema

1. Nel dashboard Supabase, vai in **SQL Editor** (sidebar sinistra)
2. Click "New query"
3. Apri il file `/supabase/schema.sql`
4. Copia TUTTO il contenuto
5. Incollalo nell'editor SQL
6. Click **Run** (o CMD+Enter)
7. Dovresti vedere "Success. No rows returned"

✅ Database creato con tutte le tabelle!

### Step 3: Configura Storage

1. Vai in **Storage** (sidebar)
2. Click "Create a new bucket"
3. Crea 3 buckets con queste impostazioni:

**Bucket 1: avatars**
- Name: `avatars`
- Public bucket: ✅ SI
- File size limit: 2 MB
- Allowed MIME types: image/*

**Bucket 2: trip-photos**
- Name: `trip-photos`
- Public bucket: ✅ SI
- File size limit: 5 MB
- Allowed MIME types: image/*

**Bucket 3: workshop-logos**
- Name: `workshop-logos`
- Public bucket: ✅ SI
- File size limit: 1 MB
- Allowed MIME types: image/*

### Step 4: Ottieni Credenziali

1. Vai in **Settings** > **API** (sidebar)
2. Copia e salva questi valori:

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbG...lungo...
```

⚠️ **IMPORTANTE**: Salva questi valori in un file di testo, ti serviranno dopo!

### Step 5: Setup Aroni Moto (Workshop Demo)

1. Torna in **SQL Editor**
2. Crea una nuova query
3. Copia e incolla:

```sql
-- Inserisci workshop Aroni Moto
INSERT INTO workshops (
  name, 
  slug, 
  owner_email, 
  logo_url, 
  primary_color, 
  secondary_color,
  address,
  city,
  phone,
  email,
  website,
  plan
) VALUES (
  'Aroni Moto',
  'aroni-moto',
  'info@aronimoto.it',
  'https://www.aronimoto.it/images/logo.png',
  '#E30613',
  '#1A1A1A',
  'Via Example 123',
  'Milano',
  '+39 123 456 7890',
  'officina@aronimoto.it',
  'https://www.aronimoto.it',
  'pro'
);

-- Crea cliente demo per testing
INSERT INTO customers (
  workshop_id,
  email,
  name,
  bike_brand,
  bike_model,
  bike_year,
  current_km,
  active
) 
SELECT 
  id,
  'demo@aronimoto.it',
  'Cliente Demo',
  'BMW',
  'R 1250 GS',
  2023,
  5000,
  true
FROM workshops 
WHERE slug = 'aroni-moto';
```

4. Click **Run**
5. Dovresti vedere "Success"

✅ Workshop Aroni Moto creato!

---

## PARTE 2: SETUP CUSTOMER APP (10 minuti)

### Step 1: Installa Dipendenze

```bash
cd customer-app
npm install
```

Aspetta che installi tutto (~2-3 minuti).

### Step 2: Configura Environment

```bash
# Copia file example
cp .env.example .env.local

# Apri .env.local con editor
nano .env.local
# oppure
code .env.local
```

Incolla le tue credenziali Supabase:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...la.tua.chiave...
VITE_APP_NAME=Garage Connect
VITE_APP_URL=https://garageconnect.app
```

Salva e chiudi (CTRL+X, poi Y, poi Enter se usi nano).

### Step 3: Test in Locale

```bash
npm run dev
```

Apri http://localhost:3000

**Per testare il tenant Aroni Moto in locale:**

1. Apri la console browser (F12)
2. Vai su **Console** tab
3. Scrivi:
```javascript
localStorage.setItem('dev_workshop_slug', 'aroni-moto')
```
4. Ricarica la pagina

Dovresti vedere:
- ✅ Branding Aroni Moto (colori rosso/nero)
- ✅ Login screen

**Test Login:**
- Registrati con qualsiasi email (es: ray@test.com)
- Password di tua scelta
- Nome: Il tuo nome
- Completa registrazione
- Login

✅ App funzionante in locale!

### Step 4: Build & Deploy su Vercel

**Opzione A: Deploy via Dashboard**

1. Vai su https://vercel.com
2. Login con GitHub
3. Click "Add New" > "Project"
4. Importa la repository `garage-connect`
5. Seleziona la cartella `customer-app`
6. Aggiungi le **Environment Variables**:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
7. Click **Deploy**

**Opzione B: Deploy via CLI**

```bash
# Installa Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Segui le domande:
# ? Set up and deploy? Yes
# ? Which scope? (il tuo account)
# ? Link to existing project? No
# ? What's your project's name? garage-connect-customer
# ? In which directory? ./
# ? Override settings? No
```

Alla fine vedrai:
```
✅ Production: https://garage-connect-customer-xxxxx.vercel.app
```

### Step 5: Configura Custom Domain (Opzionale ma Importante)

Per il multi-tenant serve un pattern tipo:
```
aroni-moto.garageconnect.app
workshop2.garageconnect.app
```

**Setup:**

1. In Vercel dashboard, vai nel progetto
2. Settings > Domains
3. Add domain: `garageconnect.app`
4. Vercel ti darà dei DNS records
5. Vai dal tuo provider DNS e aggiungi:
   ```
   A record: @ → 76.76.21.21
   CNAME: * → cname.vercel-dns.com
   ```
6. Aspetta propagazione (5-60 min)

**Test subdomain Aroni:**
```
https://aroni-moto.garageconnect.app
```

✅ Dovresti vedere l'app con branding Aroni!

---

## PARTE 3: DEMO AD ARONI MOTO (Il pitch!)

### Setup Demo Perfetto

1. **Popola dati demo** (SQL):

```sql
-- Aggiungi viaggi demo
INSERT INTO trips (customer_id, workshop_id, title, start_date, distance, duration, notes, is_shared)
SELECT 
  c.id,
  c.workshop_id,
  'Weekend Dolomiti',
  CURRENT_DATE - 7,
  350.5,
  6.5,
  'Giro incredibile con 3 passi in un giorno. Tempo perfetto!',
  true
FROM customers c
JOIN workshops w ON c.workshop_id = w.id
WHERE w.slug = 'aroni-moto'
LIMIT 1;

-- Aggiungi ristoranti demo
INSERT INTO restaurants (workshop_id, name, location, type, rating, lat, lng, notes)
SELECT 
  id,
  'Osteria della Pista',
  'Vallelunga, Roma',
  'traditional',
  5,
  42.2567,
  12.3956,
  'Vicino al circuito, ottima carbonara!'
FROM workshops WHERE slug = 'aroni-moto';

-- Aggiungi manutenzione demo
INSERT INTO maintenance (customer_id, workshop_id, date, km, type, description, cost, verified)
SELECT 
  c.id,
  c.workshop_id,
  CURRENT_DATE - 30,
  4500,
  'service',
  'Tagliando 5000 km - Olio, filtri, check completo',
  180.00,
  true
FROM customers c
JOIN workshops w ON c.workshop_id = w.id
WHERE w.slug = 'aroni-moto'
LIMIT 1;
```

2. **Prepara pitch** (5 minuti a video o di persona):

**Slide 1: Il Problema**
> "I vostri clienti vengono per il service e poi spariscono. Zero engagement, zero passaparola, zero loyalty."

**Slide 2: La Soluzione**
> "Un'app brandizzata Aroni Moto dove i vostri clienti gestiscono la moto, condividono viaggi, e diventano una community."

**Slide 3: Demo Live**
> "Eccola qui - [apri https://aroni-moto.garageconnect.app]
> - Brandizzata con i vostri colori
> - Trip tracking con foto
> - Storico manutenzione verificato da voi
> - Community per condividere route
> - Prenotazioni online"

**Slide 4: Il Costo**
> "€49/mese. Meno di 2 caffè al giorno per 100 clienti sempre connessi. ROI: se anche 1 solo cliente torna grazie all'app, si è già pagata."

**Slide 5: Next Steps**
> "6 mesi gratis se ci aiutate a testare. Dopo, €49/mese. Cancellabile quando volete."

### Durante la Demo

**Mostra:**
1. ✅ Login veloce
2. ✅ Dashboard con stats
3. ✅ Viaggio condiviso nella community
4. ✅ Mappa ristoranti
5. ✅ Storico manutenzione verificato
6. ✅ Prenotazione appuntamento (coming soon)

**Emphasizza:**
- "È LORO, con il LORO logo"
- "I clienti la installano come app sul telefono"
- "Storico manutenzione = vendor lock-in soft"
- "Community locale = passaparola organico"

---

## PARTE 4: POST-DEMO

### Se dicono SI:

1. **Onboarding Aroni:**
   - Setup email loro per login officina
   - Caricamento clienti esistenti (CSV)
   - Training 30 minuti via call
   - Materiale marketing (QR code app)

2. **Launch:**
   - Email a clienti Aroni: "Scarica la nuova app!"
   - Poster in officina con QR code
   - Social post

3. **Iterate:**
   - Feedback settimanale primo mese
   - Features richieste → prioritize
   - Analytics utilizzo

### Pricing Reale Post-Pilota:

```
FREE: €0 (max 20 clienti)
PRO: €49/mese (max 100 clienti)
ENTERPRISE: €149/mese (unlimited + analytics)
```

---

## 🐛 TROUBLESHOOTING

### "Workshop non trovato"
- Check: subdomain è corretto?
- Check: workshop.slug nel database = subdomain
- In dev: localStorage.setItem('dev_workshop_slug', 'aroni-moto')

### "Invalid API key"
- Check: .env.local ha le credenziali corrette
- Check: restart dev server dopo cambio .env
- Check: VITE_SUPABASE_ANON_KEY inizia con "eyJ"

### "RLS policy error"
- Check: hai eseguito TUTTO lo schema.sql
- Check: le policies sono abilitate
- Verifica in Supabase: Authentication > Policies

### Map non funziona
- Check: Leaflet CSS è importato in index.html
- Check: react-leaflet è installato (npm install)
- Check: markers hanno lat/lng validi

---

## 📞 SUPPORT

**Per Ray:**
- Codice: tutto in `/garage-connect`
- Deploy: https://aroni-moto.garageconnect.app
- Database: Supabase dashboard

**Prossimi Step:**
1. ✅ Setup completato
2. ⬜ Demo ad Aroni
3. ⬜ Feedback + iterate
4. ⬜ Launch con primi 10 clienti
5. ⬜ Scale a più officine

---

🔥 **RAY, SEI PRONTO A VENDERE?** 🔥

L'MVP è production-ready. Mostralo ad Aroni, raccogli feedback, e inizia a scalare.

**Next workshop after Aroni:**
- Trova 2-3 officine simili
- Pitch deck ready
- Case study Aroni

**LET'S GO!** 🏍️

# ⚡ DEPLOY VELOCE - 20 MINUTI

## 1. Supabase (5 min)
```bash
1. Vai su supabase.com
2. New project: "garage-connect"
3. SQL Editor → Copia/incolla `/supabase/schema.sql`
4. Run
5. Copia URL + anon key
```

## 2. Customer App (5 min)
```bash
cd customer-app
npm install
cp .env.example .env.local
# Modifica .env.local con le tue credenziali
npm run dev
# Test su localhost:3000
```

## 3. Deploy Vercel (5 min)
```bash
npm i -g vercel
vercel login
vercel
# Aggiungi env variables nel dashboard
```

## 4. Setup Aroni Moto (5 min)
```sql
-- In Supabase SQL Editor:
INSERT INTO workshops (name, slug, primary_color, ...)
VALUES ('Aroni Moto', 'aroni-moto', '#E30613', ...);
```

## 5. Test
```
https://aroni-moto.tuo-domain.vercel.app
```

## ✅ DONE!

**Demo ad Aroni:**
- Mostra app live
- Pitch: €49/mese
- Offer: 6 mesi gratis per testare

**Vedi `/docs/SETUP.md` per guida completa**

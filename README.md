# FinKorb Web

## Moderované recenzie cez Vercel

Táto verzia webu obsahuje workflow:

- klient odošle recenziu cez formulár na stránke
- recenzia sa uloží do `pending` v Vercel KV
- admin ju schváli alebo zamietne na stránke `/reviews-admin.html`
- po schválení sa recenzia zobrazí na webe

### 1. Nastav Vercel KV

1. V projekte na Verceli pridaj integráciu `Vercel KV` (Upstash).
2. Over, že sú dostupné env premenné:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### 2. Nastav admin token

Pridaj env premennú:

- `REVIEWS_ADMIN_TOKEN` = tvoje silné heslo/token pre schvaľovanie recenzií

### 3. Deploy

Po deployi:

- verejné odosielanie: formulár recenzií na hlavnej stránke
- administrácia: `https://tvoj-web.sk/reviews-admin.html`

Admin stránku nedávaj do verejného menu, používaj ju len ty.

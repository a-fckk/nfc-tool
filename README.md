# Outil mobile — lien direct d'avis Google

Cette petite application :

1. recherche un établissement avec Google Places API (New) ;
2. affiche jusqu'à 5 résultats ;
3. récupère le Place ID ;
4. construit le lien direct :
   `https://search.google.com/local/writereview?placeid=PLACE_ID`
5. permet de copier le lien pour l'écrire dans NFC Tools.

## Pourquoi la clé API est côté serveur

La clé Google n'est jamais envoyée au navigateur. La recherche passe par une fonction Netlify afin d'éviter d'exposer la clé dans le code public.

## Configuration Google Cloud

1. Crée ou sélectionne un projet Google Cloud.
2. Active **Places API (New)**.
3. Active la facturation Google Maps Platform.
4. Crée une clé API.
5. Restreins cette clé à **Places API (New)**.
6. Évite de mettre la clé directement dans `src/main.js`.

## Déploiement Netlify

### Méthode Git

1. Mets ce dossier sur GitHub.
2. Dans Netlify : **Add new site → Import an existing project**.
3. Sélectionne le dépôt.
4. Netlify détectera `netlify.toml`.
5. Dans **Site configuration → Environment variables**, ajoute :
   - clé : `GOOGLE_MAPS_API_KEY`
   - valeur : ta clé Google
6. Déploie.

### Sous-domaine

Dans Netlify :

1. **Domain management → Add a domain alias**
2. Ajoute par exemple `nfc.emea.website`
3. Chez ton gestionnaire DNS, crée le CNAME demandé par Netlify.

## Test local

Installe Node.js, puis :

```bash
npm install
cp .env.example .env
```

Ajoute ta clé dans `.env`, puis :

```bash
npm run dev
```

Ouvre l'adresse affichée par Netlify CLI, normalement `http://localhost:8888`.

## Utilisation terrain

1. Saisis `Nom du commerce + ville`.
2. Sélectionne le bon établissement.
3. Appuie sur **Copier le lien d'avis**.
4. Dans NFC Tools : **Écrire → Ajouter un enregistrement → URL/URI**.
5. Colle le lien et écris-le sur la plaque.
6. Utilise **Tester** avant d'entrer dans le commerce.

## Remarques

- Les Place IDs peuvent évoluer avec le temps ; Google recommande de les rafraîchir lorsqu'ils ont été stockés longtemps.
- Le nombre de champs demandé à Google est volontairement limité.
- L'application ne permet pas d'écrire directement un NFC depuis Safari sur iPhone : le lien est copié afin de l'utiliser dans NFC Tools.

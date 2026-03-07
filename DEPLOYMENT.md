# Deploiement Simple - AdViewer

## Render (recommande)

1. Poussez le projet sur GitHub.
2. Sur Render, creez un `Web Service` relie a votre repo.
3. Configurez:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
4. Ajoutez les variables d'environnement:
   - `SECRET_KEY`
   - `JWT_SECRET_KEY`
   - `DATABASE_URL`
   - `GOOGLE_CLIENT_ID` (optionnel)
   - `GOOGLE_CLIENT_SECRET` (optionnel)
5. Deployez.

## Verifier apres deploiement

- Ouvrir la page d'accueil
- Tester inscription / login / logout
- Tester dashboard et view-ad

## Mise a jour

```bash
git add .
git commit -m "update"
git push origin main
```

Render redeploie automatiquement.

# Lumen Admin

Standalone admin console. Separate deployable: own `package.json`, port 3001.

```
cp .env.example .env.local
npm install
npm run dev      # http://localhost:3001
npm run build && npm start
```

Environment: `NEXT_PUBLIC_API_URL` (API base URL, default `http://localhost:4000`). It is read at build time and also sets the CSP `connect-src`.

Deployment requirements:
- The admin origin (e.g. `https://admin.example.com`) must equal `ADMIN_ORIGIN` in the API environment (CORS).
- The admin origin must be in Firebase Console > Authentication > Settings > Authorized domains.
- Only profiles with the admin role can use the app; admin sign-ins older than 12h require signing in again.

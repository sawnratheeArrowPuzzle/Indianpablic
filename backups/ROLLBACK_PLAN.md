# SavvvnLab Rebuild — Backup & Safe Rollback Plan

## Backup Archive
- Archive Path: `backups/indianpublic-legacy-backup.tar.gz`
- Created At: 2026-11-21
- Contents Backed Up:
  - `src/` (entire legacy IndianPublic frontend, components, services, types, utils)
  - `server.ts` (legacy Express routes)
  - `index.html`, `metadata.json`
  - `firestore.rules`, `firebase-blueprint.json`
  - `data/records.json` (preserved intact on disk)
  - `public/robots.txt`, `public/sitemap.xml`

## Preserved Credentials & Data (Untouched)
- `firebase-applet-config.json` (Production project `gen-lang-client-0627643856`, Firestore DB `ai-studio-independencedays-744e963b-e9c3-46ce-af33-0444a207b29f`)
- `firebase-staging-config.json`
- `data/records.json`
- All existing Firebase Authentication users and live Firestore collections remain untouched (no `DeployRules` or destructive database actions executed without explicit approval).

## Rollback Procedure
To restore the previous IndianPublic website locally:
```bash
tar -xzf backups/indianpublic-legacy-backup.tar.gz -C .
```
Then restart the server (`npm run dev`).

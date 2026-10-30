# 737 HOLDOVER

App pédagogique **B737 NG/MAX — dégivrage / antigivrage et Holdover Time (HOT)**, basée sur le MANEX A Air Algérie §8.2.4 (Éd. 02, Rév. 36, NOV.25 — tableaux FAA HOT Winter 2025-2026).

> Outil pédagogique. En cas de différence, le MANEX A en vigueur fait foi. Le HOT n'est qu'un repère et ne dispense jamais de l'inspection des surfaces critiques. La décision finale appartient au commandant de bord.

## Utilisation
- **`index.html`** est l'app complète : un seul fichier, hors ligne (données MANEX, polices et icône intégrées). Il s'ouvre directement dans Safari / Chrome.
- Pour l'installer en PWA (iPhone / iPad) : héberger le dossier (ex. GitHub Pages), ouvrir dans Safari → Partager → « Sur l'écran d'accueil ». `manifest.webmanifest`, `sw.js` et `icons/` servent à l'installation et au cache hors ligne.

## Écrans
Écran d'ouverture « Winter is coming » · Comprendre en 2 minutes · Calculateur HOT (fluide → OAT → concentration → condition, case du MANEX surlignée) · Minuteur HOT · Procédure pas à pas · Décoder l'annonce du sol · Quiz (10 questions) · Montréal YUL · À propos.

## Développement
| Fichier | Rôle |
|---|---|
| `src/app.html` | Gabarit de l'app (HTML/CSS/JS) |
| `data/hot_tables_manexA_2025-2026.json` | Tableaux MANEX (source unique des valeurs) |
| `src/fonts/` | Cinzel (sous-ensemble), Orbitron, Share Tech Mono |
| `tools/build.py` | Assemble `index.html` et `sw.js` |
| `tools/make_icons.js` | Génère les icônes PWA (Playwright) |
| `tests/run_tests.js` | Tests du cahier des charges §6 + parcours UI (Playwright) |

```
node tools/make_icons.js   # seulement si l'icône change
python3 tools/build.py
node tests/run_tests.js
```

Prepared by CPT M.A BOUCHENAFA
Fleet Training Manager B737NG/MAX

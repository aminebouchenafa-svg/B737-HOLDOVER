# Cahier des charges — App « 737 HOLDOVER » (dégivrage / antigivrage expliqué)

À donner à Claude Code avec le fichier `hot_tables_manexA_2025-2026.json`.

## 0. Nom et écran d'ouverture
- **Nom de l'app** : `737 HOLDOVER` (icône PWA : flocon stylisé + « HOT », fond noir, néon bleu glacier).
- **Écran d'ouverture (splash, ~3 s, touche pour passer)** :
  - fond noir, neige qui tombe doucement (animation CSS/canvas légère, 60 fps max, désactivée si `prefers-reduced-motion`) ;
  - texte géant centré **WINTER IS COMING**, en capitales espacées, police à empattements de style gravé (Google Font **Cinzel** intégrée en base64 pour rester hors ligne), effet métal froid / givre (dégradé gris-acier → blanc, léger halo bleu glacier) ;
  - apparition lente du texte (fondu + léger zoom), puis sous-titre en Share Tech Mono : `B737 NG/MAX · De-icing & Holdover Time · MANEX A §8.2.4` ;
  - en bas, signature sur deux lignes : `Prepared by CPT M.A BOUCHENAFA` / `Fleet Training Manager B737NG/MAX`.
  - **Design 100 % original** : aucun logo, blason, typographie ou visuel de la série Game of Thrones.

## 1. Objectif
Rendre le dégivrage compréhensible pour un pilote B737 NG/MAX Air Algérie qui « ne comprend rien aux tableaux ».
L'app ne remplace pas le MANEX A : elle **explique**, **guide pas à pas** et **lit le tableau à la place du pilote**, en montrant toujours la case exacte du MANEX utilisée.

Source unique : **MANEX A, §8.2.4 « Dégivrage et antigivrage au sol »** (Éd. 02, Rév. 36, NOV.25), tableaux FAA HOT Guidelines **Winter 2025-2026**.
Les données des tableaux sont dans le JSON (vérifiées sur les pages 12, 14, 17, 34, 66, 67, 68). **Ne jamais inventer ni interpoler une valeur.**

## 2. Contraintes techniques (conventions habituelles)
- Un seul fichier HTML autonome, sans dépendance externe à l'exécution, installable en PWA, utilisable hors ligne (le JSON est intégré dans le fichier).
- Optimisé iPhone et iPad, utilisable au poste (grands boutons, gros chiffres).
- Thème sombre (gris profond / noir), accents néon ; Orbitron pour les titres, Share Tech Mono pour les données.
- Langue de l'interface : français. Termes météo/OACI en anglais conservés (FZFG, FZRA, HOT, LOUT…).
- Pied de page / écran « À propos », sur deux lignes :
  `Prepared by CPT M.A BOUCHENAFA`
  `Fleet Training Manager B737NG/MAX`

## 3. Écrans

### Écran 1 — « Comprendre en 2 minutes » (pédagogie)
Cartes courtes, une idée par carte :
1. **Avion propre** : aucun décollage avec givre, glace, neige ou slush adhérant aux surfaces critiques (8.2.4.1). Tolérances : fine couche de givre sur le dessus du fuselage (inscriptions visibles) ; ≤ 3 mm à l'intrados au droit des réservoirs (8.2.4.6.2).
2. **Dégivrer ≠ antigivrer** : dégivrer = enlever (fluide chaud) ; antigivrer = protéger pendant un temps limité, le HOT (8.2.4.3).
3. **Une étape / deux étapes** : en une étape, le même mélange dégivre et protège ; en deux étapes, on dégivre puis on antigivre avant que le 1er fluide gèle, en ≈ 3 min (8.2.4.3, 8.2.4.6.3).
4. **Les 4 fluides** : Type I (fluide fin, chaud, HOT court, plus concentré ≠ plus long) ; Type II / IV épaissis (HOT plus long, dépend de la dilution, maximum en 100/0) ; Type III intermédiaire (8.2.4.4).
5. **Le chrono démarre quand ?** Au début de l'application (une étape) ou au début de la 2e étape (deux étapes). L'heure annoncée et notée à l'ATL démarre le HOT (8.2.4.5, 8.2.4.7.3).
6. **Règle d'or Air Algérie** : on n'utilise que **le temps le plus court** de la case (8.2.4.9 NOTE). Le HOT n'est qu'un repère : les fortes précipitations, le vent, le souffle réacteur ou une aile plus froide que l'air le raccourcissent.
7. **En Algérie** : pas de dégivrage. Le mécanicien contrôle les surfaces critiques et le CDB décide de faire ou d'annuler le vol. **À l'étranger** : à la demande du CDB, l'escale contacte le sous-traitant ; la décision finale d'accepter l'avion et de partir appartient au CDB (8.2.4.2).

### Écran 2 — « Calculateur HOT » (le cœur de l'app)
Saisie en 4 étapes, une question par écran, avec un bouton « Pourquoi ? » à chaque étape :
1. **Fluide** : Type I / Type II / Type IV (Type III : afficher « non utilisé B737 — marque spécifique, voir MANEX Tableaux 16-18 »).
2. **Concentration** (Types II/IV seulement) : 100/0, 75/25, 50/50 — ne proposer que celles qui existent pour la bande de température (Tableau 52) ; griser les autres en expliquant pourquoi.
3. **OAT** en °C (pavé numérique). Pour le givre actif de longue durée : rappeler d'utiliser l'OAT la plus froide rencontrée depuis l'application.
4. **Condition météo** : choix illustrés (icônes) parmi les conditions du JSON (`conditions`).
   - Si **neige** choisie : demander **visibilité METAR en mètres** + **jour/nuit** → calculer l'intensité avec le Tableau 50. Afficher « METAR dit -SN, mais le tableau dit MODÉRÉE : on retient MODÉRÉE ». Interdire la RVR (message explicite).
   - Si intensité **Heavy**, ou condition « Other » (neige forte, granules de glace, FZRA modérée/forte, grêle) → **AUCUN HOT**, écran rouge.

**Résultat :**
- Le HOT en très gros = **valeur basse de la case** (règle Air Algérie), avec la fourchette complète en petit.
- Un **minuteur** à démarrer sur l'heure de début annoncée par le sol (saisie de l'heure UTC), avec compte à rebours et alerte à l'échéance.
- « **Voici la case du MANEX** » : une mini-reproduction du tableau avec la ligne et la colonne surlignées, et la référence (ex. *MANEX A 8.2.4.9 — Tableau 19, page 34*).
- Messages automatiques :
  - case vide → « Aucun HOT dans cette condition » ;
  - FZDZ ou FZRA en Type II/IV entre -8 et -14 °C et sous -10 °C → aucun HOT ;
  - SN_RA_M ou RA_COLDSOAK à 0 °C ou moins → aucun HOT ;
  - toujours : « HOT = repère. Doute ou HOT dépassé → contrôle des surfaces avant décollage ».

### Écran 3 — « La procédure pas à pas »
Une timeline cochable (cases à cocher), du parking au décollage :
1. **Prévol** (8.2.4.10.1) : visite prévol ; si le gel ou la neige empêchent les vérifications → informer l'escale ; prévoir le carburant supplémentaire.
2. **Avant dégivrage** : check-lists FCOM « Cold Weather Operation » / « Ice and Rain Protection » (SP) ; avion configuré ; APU/moteurs au ralenti possibles, **conditionnement d'air OFF** (8.2.4.6.4) ; informer PNC et passagers (8.2.4.8).
3. **Phraséologie sol** (8.2.4.8) : reproduire le dialogue CREW / GROUND du MANEX (demande « Type I / II / IV, Wings and Flight Control surfaces, Engines », « de-icing complete Type II/75 at 1650 »…). Bouton « mode écoute » qui affiche le dialogue en bulles.
4. **Pendant** : rester à l'écoute de l'ATC et du technicien ; en urgence, contacter la tour et le responsable du dégivrage (8.2.4.10.2).
5. **Après** : relire le **code** annoncé (Type / concentration / heure UTC), démarrer le minuteur HOT, check-list après dégivrage, **inscrire à l'ATL** : heure de début, type de fluide (celui de la 2e étape si deux étapes), mélange (8.2.4.7.2, 8.2.4.7.3).
6. **Avant le décollage** : si HOT dépassé ou moindre doute → contrôle des surfaces critiques par une personne qualifiée (OPL) juste avant d'entrer sur la piste ; en cas de doute sur un dépôt pouvant affecter les performances → **pas de décollage** (8.2.4.6.1).
7. **Pièges** : ne jamais remettre un antigivrant froid sur une couche existante (nettoyer d'abord au mélange chaud) ; pare-brise : enlever toute trace de Type II/IV, ne pas utiliser les essuie-glaces pour cela ; **verglas d'aile froide** (glace transparente) quand beaucoup de carburant froid reste dans les réservoirs, même jusqu'à +15 °C OAT (8.2.4.6.5) ; aile froide → pas de 50/50 Type II/IV (Tableau 52).

### Écran 4 — « Décoder l'annonce du sol »
Champ de saisie ou boutons : l'utilisateur tape « Type IV/75 1432 » → l'app traduit : « Type IV, 75 % fluide / 25 % eau, début 14:32 UTC → HOT démarré à 14:32 ». Bouton « Calculer le HOT » qui préremplit l'écran 2.

### Écran 5 — « Quiz » (10 questions)
Cas pratiques tirés du MANEX, par exemple :
- METAR « 1600 -SN M06 », de nuit, Type IV 100/0 → intensité ? HOT retenu ?
- Deux étapes : à quel moment démarre le HOT ?
- FZRA modérée → quel HOT ? (aucun)
- Quel fluide noter à l'ATL après une procédure en deux étapes ?
- Peut-on décoller si le HOT est dépassé ? (oui, seulement après contrôle des surfaces critiques, et en l'absence de doute)

### Écran 6 — Montréal (optionnel)
Fréquences et procédure du pad AeroMag de YUL (MANEX 8.2.4.8 p.8-10) sous forme de carte : 123.425 Montreal Deice (30 min avant), 122.525 Aeromag Pad Control, 123.125 ICEMAN, puis fluides utilisés (Type I CHEMCO CHEMR REG1 ; Type IV DOW UCAR ENDURANCE EG106).

## 4. Logique de lecture des tableaux (pour le code)
- Type I → `table2_typeI_aluminum` (B737 = aluminium).
- Type II → `table4_typeII_generic` (une seule colonne neige `SN`, intensité ≤ modérée) ; Type IV → `table19_typeIV_generic`.
- Givre actif → `table1_active_frost` (Type I : 0:45 aluminium à toutes températures jusqu'au LOUT).
- Bande de température : la valeur de bande « sous X à Y » s'applique pour Y ≤ OAT < X (bornes du MANEX : « -3 °C et au-dessus », puis « sous -3 à -8 °C »…).
- Valeur affichée = `min` de la case (règle de l'écran 1, point 6).
- Neige → intensité via `table50_snow_intensity`, avec les colonnes jour/nuit × (≤ -1 °C / > -1 °C).
- Afficher toujours la mention : *« Tables génériques. Si la marque du fluide est connue, la table de la marque dans le MANEX A peut donner un HOT différent. »*

## 5. Avertissement obligatoire (écran d'accueil)
« Outil pédagogique basé sur le MANEX A §8.2.4 (Rév. 36, tableaux FAA Winter 2025-2026). En cas de différence, le MANEX A en vigueur fait foi. Le HOT n'est qu'un repère et ne dispense jamais de l'inspection des surfaces critiques. La décision finale appartient au commandant de bord. »

## 6. Tests à faire passer avant diffusion
- Type IV 100/0, -5 °C, FZFG → 0:15 (case 0:15-0:35, Tableau 19).
- Type I, -2 °C, neige légère → 0:11 (Tableau 2).
- Type II 75/25, -12 °C, FZRA_L → « aucun HOT » (sous -10 °C) ; à -10 °C exactement → 0:09.
- Neige, visibilité 1600 m, nuit, -6 °C → intensité MODÉRÉE.
- Type IV 50/50 à -5 °C → concentration refusée (Tableau 52).
- Givre actif, Type IV 100/0, -12 °C → 6:00.

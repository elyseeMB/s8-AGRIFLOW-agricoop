# Restructuration frontend — plan d'exécution

Objectif : aligner tous les HTML/CSS sur le design system (`components.html` / `css/index.css`).
Ne jamais toucher au JS. Chaque HTML ne charge que `../css/index.css`.

## 1. `frontend/css/index.css`

- Retirer les imports `design-system/` (démos).
- `:root` : ajouter `--background` (= `--backgroud`), ajouter `--ds-purple: hsl(262deg 52% 47%)`, corriger `--ds-muted-text: hsl(0, 0%, 45%)`.
- Supprimer les blocs `.main-content` / `.main-content::after` (déplacés vers `login.css`).
- Conserver imports tools + 8 pages + 10 composants.

## 2. `frontend/css/showcase.css` (nouveau)

- Reprendre les 5 fichiers `css/design-system/` (root, palettes, typography, navigation, alert).
- `components.html` liera `index.css` + `showcase.css`.

## 3. `frontend/css/tools/reset.css`

- Ajouter `[hidden] { display: none !important; }` (les pages comptes/membres s'appuient sur l'attribut `hidden` via main.js).

## 4. `frontend/css/components/Badge.css`

- Alias JS membres : `.badge.ok` (groupe `.badge--ok`) et `.badge.alerte` (groupe `.badge--alerte`).
- Base `.stock-mini .card .badge` (ventes) en pilule verte + variantes `.epuise/.faible/.disponible` sur tokens.

## 5. `frontend/css/components/layout.css`

- Ajouter `.page-content` (colonne, gap, max-width 1180px, margin auto).

## 6. CSS de pages (réécrits, plus de `:root`/`*`/`body`/`table` globaux)

### `comptes.css`

- `#acces-refuse-comptes:not(:empty)` (alerte danger), `#form-nouveau-compte` (grille champs),
  messages erreur/succès, `tbody:empty::after` « Aucun compte… ».

### `membres.css`

- `.membres-section` (carte), `.membres-header` + `.membre-ligne` (grille 5 cols),
  `.filters-bar` + `.filter-group` + `#filtre-statut` + `.search-group`,
  `.new-member-panel` + `.new-member-form` (grille 4 champs + bouton), messages erreurs/succès.
  (Badges : via alias Badge.css `.badge.ok/.alerte`.)

### `livraisons.css`

- Retirer les ~30 classes dupliquées (sidebar, brand, navigation, topbar, stat, card, form, table, message).
- Garder : `.delivery-section`, `.delivery-grid` (2fr/1fr ≥1024px), `.history-card` (padding 0, grille rows),
  `.history-header`, `.btn-sort`, `.table-filters`, `.filter-select`, `.table-footer`, `.pagination`, `.btn-submit` → remplacé par `.btn .btn__primary` dans le HTML.

### `paiements.css`

- Garder : `.page-content` (retiré si partagé), `.page-heading`, `.eyebrow`, `.content-grid` (370px/1fr), paddings `.panel.payment-panel` / `.history-panel`, `.history-heading`. Retirer `.sidebar-footer` (sidebar partagée).
- Alias `.message.error`/`.message.success` dans message.css (compat `#message-erreur-paiement`).
- Bouton `#form-paiement button` → `.btn .btn__primary` dans le HTML (class `.primary-button` retirée).

### `statistiques.css`

- Retirer `@import` + `body` + tout le bloc `.sidebar` (sidebar partagée).
- Garder : `.main-content` retiré (remplacé par `.layout__main`), `.row-four` (4 → 2 → 1 cols),
  `.row-two`, `.card-indicator`, `.ranking-list` (+ top 3), `.table-cultures`, `.rapport-grid`, `.card-subtitle`.
- Hex → tokens (`#6b7280` → `var(--ds-muted-text)`, etc.).

### `ventes.css`

- Retirer `@import` + `body` + bloc `.sidebar`.
- Garder : `.row-three`, `.row-two`, `.stock-mini` + `.stock-mini .card` (+ `h3/p`), `.stock-footer`,
  `.label/.value`, `.card-vente` (form), `.btn-block`, `.control-info/.control-resultat`,
  `.alerte-item/.alerte-badge`, `.resume-item(.highlight)`, `.table-header`, `.table-ventes`,
  `.alertsuccess`/`.alertdanger` (→ tokens), responsive.
- `.barre-stock-fond`/`-remplissage` retirés (dans progress.css).
- Bouton `#form-vente` → `.btn .btn__primary .btn-block` (class `.btnprimary` retirée).

### `login.css`

- Conserver tout + recevoir `.main-content` / `.main-content::after` (splash d'index.html racine).
- Retirer `.form`, `.form-divider`, `.form-legacy`, `.input-group__*`, `.form__input`, `.alert[hidden]` dupliqués de form.css/alert.css.

### `dashboard.css`

- Créer : `#dashboard-cartes` (grille 1→2→4), `.stat-card`-like pour `#carte-stock`… (style des 4 cartes),
  `#jours-actifs` (bandeau), `#graphique-semaine` (barres via chart.css déjà). Attention : les cartes reçoivent `.textContent` → style sur `#carte-stock` etc.

## 7. HTML de pages (layout unifié)

Structure commune : `.layout > aside.sidebar (brand + .navigation 7 modules + .sidebar-session #utilisateur-connecte/#btn-deconnexion + .sidebar-help) + main.layout__main > header.topbar (.topbar-main h1 + actions, .breadcrumb) > .page-content`.
Navigation (7 modules existants) : Tableau de bord, Membres, Livraisons, Paiements, Ventes & Stock, Statistiques, Comptes (icônes unicode ▦ ♙ ▣ ▤ ▥ ▧ ▨).
IDs JS conservés (grep de contrôle) : utilisateur-connecte, btn-deconnexion, form-login, l-nom-utilisateur, l-mot-de-passe, message-erreur-login, dashboard-cartes, carte-stock, carte-montant-du, carte-membres, carte-livraisons, jours-actifs, graphique-semaine, liste-membres, filtre-statut, champ-recherche-membre, liste-livraisons, btn-trier-livraisons, form-livraison, f-membre, f-culture, f-quantite, message-erreur-livraison, message-succes-livraison, liste-paiements, total-paiements, form-paiement, p-membre, p-montant, p-mode-paiement, message-erreur-paiement, message-succes-paiement, cartes-stock, liste-ventes, form-vente, v-acheteur, v-produit, v-quantite, v-prix, v-date, message-erreur-vente, message-succes-vente, ctrl-produit, ctrl-stock, ctrl-demande, ctrl-resultat, alerte-stock-faible, alerte-rupture, resume-ca, resume-nb-ventes, resume-meilleur-acheteur, classement-membres, tableau-cultures, top-acheteur, rapport-bailleur-contenu, rb-volume, rb-montant, rb-taux, rb-membres, form-nouveau-compte, liste-comptes, acces-refuse-comptes, c-nom-utilisateur, c-mot-de-passe, c-nom-complet, c-role, message-erreur-compte, message-succes-compte, form-nouveau-membre, nm-prenom, nm-nom, nm-village, nm-contact, erreurs-nouveau-membre, message-succes-nouveau-membre.

- `comptes.html` : layout + form card + table card (formulaire = `.card > .form`, liste = `.card > .table-container`).
- `membres.html` : layout + page-header + filters-bar + membres-section (header grille + #liste-membres + empty-state) + new-member-panel.
- `livraisons.html` : passer `section.livraisons-section > aside.sidebar + main.main-content` → `.layout > aside.sidebar + main.layout__main > header.topbar` ; contenu identique (IDs conservés) ; bouton `.btn-submit` → `.btn.btn__primary` ; retirer `main-content` wrapper.
- `paiements.html` : ajouter sidebar ; `.page-content` → `.layout__main > topbar + .page-content` ; `.primary-button` → `.btn.btn__primary` ; `.message.error/success` conservés (alias CSS).
- `statistiques.html` / `ventes.html` : remplacer `nav.sidebar` + `.main-content` → `.layout > aside.sidebar + main.layout__main` ; ne lier que `../css/index.css` (retirer `statistiques.css`/`ventes.css` links + fonts dupliquées) ; `.btndanger` → `.btn.btn__small btn__outline` ; `.btnprimary` → `.btn.btn__primary.btn-block`.
- `login.html` : conserver (déjà sur index.css), retirer rien d'important.
- `dashboard.html` : ajouter layout/sidebar/topbar, garder `#dashboard-cartes` (+ 4 ids), `#jours-actifs`, `#graphique-semaine`.
- `index.html` (racine) : refaire sur `.login`/`.wrapper__*` (garde le meta refresh).

## 8. `components.html`

- Ajouter `<link rel="stylesheet" href="frontend/css/showcase.css" />` après index.css.

## 9. Vérification finale (grep)

- Plus de `--ds-backgroud` nulle part.
- Plus de `:root {`, `body {`, `* {` dans les css de pages (sauf index.css/reset).
- Plus de `<link rel="stylesheet" href=".../xxx.css">` dans les HTML de pages (seul index.css + showcase.css pour components.html).
- `--background` défini dans index.css ; plus de référence orpheline.

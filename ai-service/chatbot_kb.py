NEXTEST_KNOWLEDGE = """
# NexTest — Plateforme de test automatisé par IA

## Vue d'ensemble
NexTest génère, exécute et analyse des tests pour n'importe quelle app web,
sans script manuel. Moteur IA : Groq LLaMA 3.3-70b-versatile.

## Architecture
- Frontend : React (Vite) — dashboard, formulaires, graphiques temps réel
- Backend : Laravel + PostgreSQL — auth, CRUD projets, stockage, rapports PDF
- AI service : FastAPI + Groq LLaMA — génération de tests, scraping, exécution

### Flux d'une génération de test
1. React envoie la requête à Laravel (URL, framework, type de test, credentials)
2. Laravel valide le projet/utilisateur et transmet à FastAPI
3. FastAPI scrape le DOM (Playwright/Selenium/Cypress) et envoie le contexte à Groq LLaMA
4. LLaMA génère les cas de test et scripts, exécutés par FastAPI sur la page réelle
5. Résultats renvoyés à Laravel pour stockage, puis affichés dans React + export PDF/HTML/CSV

### Services complémentaires
- n8n / Gmail SMTP : envoi d'emails de résultats planifiés (PDF/HTML/CSV en pièce jointe)
- pm2 : gestionnaire de process gardant le scheduler et les workers Laravel actifs


## Types de projets
- **Public** : sites web, landing pages, interfaces utilisateur — pas de login requis
  Types de tests disponibles : Smoke, Functional, Performance, SEO
  Frameworks : Selenium, Cypress, Playwright, Pytest, Postman/Newman
- **Internal** : APIs, microservices, infrastructure privée — credentials/JWT requis
  Types de tests disponibles : Smoke, Functional, Performance, Regression, Security, API
  Frameworks : Playwright, Selenium, Cypress, Pytest, Postman/Newman

## Types de tests

### Smoke Test (~30s, Public & Internal)
Vérifie que les éléments UI clés (nav, boutons, formulaires, images) sont présents dans le DOM.
Frameworks : Selenium, Cypress, Playwright.
Idéal après chaque déploiement pour détecter les régressions UI critiques instantanément.

### Functional Test (~1min, Public & Internal)
Simule des interactions réelles : clic, remplissage de formulaire, navigation, assertions.
Framework : Playwright uniquement.
LLaMA génère les étapes selon la structure de la page. Screenshots automatiques en cas d'échec.
Idéal pour valider les flux de login, soumissions de formulaire, parcours utilisateur.

### Performance Test (~3min, Public & Internal)
Mesure les Core Web Vitals (LCP, FCP, TTI, temps de chargement).
Supporte aussi k6 pour les tests de charge (load/stress/spike/soak testing).
Frameworks : Playwright (Web Vitals), k6 (charge).
Score sur 100 avec recommandations. À utiliser avant chaque déploiement.

### Security Test (~5min, Internal uniquement)
Détecte XSS, contournement d'authentification, headers HTTP manquants, problèmes de session.
Framework : Pytest.
Résultats classés par sévérité (critique/haute/moyenne/basse) et par catégorie
(auth, XSS, session, headers, exposition d'informations).
Les findings critiques doivent bloquer un déploiement.

### Regression Test (~3min, Internal uniquement)
Vérifie que les fonctionnalités existantes n'ont pas cassé après des changements de code.
Framework : Playwright.
Couvre navigation, contenu, authentification, fonctionnalité.
À lancer après chaque sprint ou changement de code majeur.

### API Test (~2min, Internal uniquement)
Teste les endpoints REST : status codes, payloads, authentification, opérations CRUD, cas limites.
Frameworks : Pytest (requests), Postman/Newman (collection).
LLaMA découvre les endpoints et génère les cas de test automatiquement.
Export Postman disponible en .json prêt à importer.

### SEO Test (~1min, Public uniquement)
Audite meta tags, headings, temps de chargement, robots.txt, sitemap, Open Graph, données structurées.
Framework : Requests + BeautifulSoup.
Aucun login requis — toujours 100% public. Score sur 100.



## Pass Rate
Calcul : (Tests passés / Total tests) × 100
- ≥ 80% → Bon
- 50-79% → Moyen
- < 50% → Critique
Visible dans History, Projects et Test Execution.

## Frameworks supportés
- **Selenium** (Python) — legacy, le plus compatible tous navigateurs, projets Public
- **Cypress** (JavaScript) — UI de debug intégrée, idéal E2E moderne, projets Public
- **Playwright** (Python) — framework principal, rapide et fiable, Chromium/Firefox/WebKit,
  supporte Smoke/Functional/Performance/Regression
- **Pytest** (Python) — pour les suites API et Security
- **Postman/Newman** — tests API basés sur des collections
- **k6** (JavaScript) — moteur de test de charge/stress/spike/soak
- **Requests + BeautifulSoup** (Python) — fetch et parse HTML léger pour les audits SEO


## Résultats (Test Execution)
- ✅ Pass — assertion réussie
- ❌ Fail — assertion échouée (screenshot automatique)
- ⚠️ Skip — non exécuté (l'IA n'a pas pu localiser l'élément/sélecteur avec confiance)
Cliquer le badge ASSERTION affiche Expected vs Actual.

## Rapports & Exports
Depuis Execution → Download Report :
- PDF — rapport complet avec graphiques, recommandations IA, verdict (pour audits/stakeholders)
- HTML — rapport interactif, autonome, ouvrable dans n'importe quel navigateur
- CSV — données brutes pour tableurs ou analyses personnalisées

## Tâches planifiées (Scheduled Tasks)
Relance automatique et récurrente d'un test, avec envoi d'email des résultats
(PDF/HTML/CSV en pièce jointe) via Gmail SMTP en production, ou webhook n8n en dev local.

## Dashboard
Affiche : scripts générés, apps analysées, couverture moyenne, graphique des générations
de la semaine, résultats globaux (Pass/Fail/Skip), top URLs testées, activité récente,
et un panneau d'insights IA résumant les tendances.

## Notifications
Icône cloche en haut à droite. Chaque génération terminée crée une notification avec
le compte Pass/Fail, l'URL testée et le framework utilisé.

## Compte utilisateur (Account)
Modifier nom/email, changer photo de profil, consulter ses statistiques.
Changer le mot de passe : Account → Change Password.

## Paramètres (Settings)
Notifications email, framework par défaut, thème (Dark/Light/System),
langue (English, Français, العربية).
Danger Zone : suppression de l'historique ou du compte (irréversible, taper CONFIRM).

## Recherche globale
Recherche par URL, projet ou framework depuis le header ; les résultats mènent
directement au projet ou à la génération concernée.

## Limites connues
Le tier gratuit Groq est plafonné à 100K tokens/jour. De gros documents de contexte
projet ou plusieurs générations en parallèle peuvent atteindre cette limite.
"""
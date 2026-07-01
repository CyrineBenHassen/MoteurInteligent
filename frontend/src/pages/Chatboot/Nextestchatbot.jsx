import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Language Detection ────────────────────────────────────────────────────────
function detectLanguage(text) {
  const arMarkers = /[\u0600-\u06FF]/;
  if (arMarkers.test(text)) return 'ar';
  const frMarkers = [
    /\b(qu[' ]est|c[' ]est|comment|pourquoi|quand|quel|quelle|où|bonjour|salut|merci|aide|lancer|générer|télécharger|résultats|historique|paramètres|projet|je|veux|mon|mes|une|des|les|est|avoir|faire|peux|peut|donne|dis)\b/i,
    /[àâäéèêëîïôùûüç]/,
  ];
  return frMarkers.some(r => r.test(text)) ? 'fr' : 'en';
}

// ─── Knowledge Base (Trilingual) ──────────────────────────────────────────────
const KB = [
  {
    tags: ['smoke', 'smoke test', 'smoke testing'],
    fr: '**Smoke Test** vérifie que les fonctionnalités principales sont dans le DOM. C\'est le plus rapide (~30s). Dans Nextest, choisissez **Smoke** à l\'étape 02 de la génération.',
    en: '**Smoke Test** checks that the core functionalities are present in the DOM. It\'s the fastest option (~30s). In Nextest, choose **Smoke** at step 02 of the generation wizard.',
    ar: '**Smoke Test** يتحقق من وجود الوظائف الأساسية في DOM. هو الأسرع (~30 ثانية). في Nextest، اختر **Smoke** في الخطوة 02 من معالج الإنشاء.',
  },
  {
    tags: ['run', 'launch', 'execute', 'generate', 'lancer', 'exécuter', 'générer', 'démarrer', 'start', 'create test', 'generete', 'generat', 'genere'],
    fr: 'Pour générer des tests :\n1. **Projects** → sélectionnez un projet\n2. Ajoutez une page (URL cible)\n3. Cliquez **Generate** sur la page\n4. Choisissez type de test + framework\n5. Cliquez **Generate Tests ▶**\n\nRésultats dans **Test Execution**.',
    en: 'To generate tests:\n1. **Projects** → select a project\n2. Add a page (target URL)\n3. Click **Generate** on the page row\n4. Choose test type + framework\n5. Click **Generate Tests ▶**\n\nResults appear in **Test Execution**.',
    ar: 'لإنشاء الاختبارات:\n1. **Projects** → اختر مشروعاً\n2. أضف صفحة (URL المستهدف)\n3. انقر **Generate** على الصف\n4. اختر نوع الاختبار + الإطار\n5. انقر **Generate Tests ▶**\n\nالنتائج تظهر في **Test Execution**.',
  },
  {
    tags: ['url', 'endpoint', 'page', 'link', 'tester une url', 'test a url', 'add page', 'ajouter une page'],
    fr: 'Pour tester une URL :\n1. **Projects → votre projet → Add Page**\n2. Entrez l\'URL (`https://monsite.com/login`)\n3. Cliquez **Generate** sur la ligne\n4. Remplissez le formulaire et lancez',
    en: 'To test a URL:\n1. **Projects → your project → Add Page**\n2. Enter the URL (`https://mysite.com/login`)\n3. Click **Generate** on that row\n4. Fill in the form and run',
    ar: 'لاختبار URL:\n1. **Projects → مشروعك → Add Page**\n2. أدخل الـ URL (`https://mysite.com/login`)\n3. انقر **Generate** على الصف\n4. املأ النموذج وابدأ',
  },
  {
    tags: ['result', 'results', 'résultat', 'résultats', 'explain', 'expliquer', 'execution', 'assertion', 'pass', 'fail'],
    fr: 'Dans **Test Execution** :\n✅ **Pass** — assertion réussie\n❌ **Fail** — assertion échouée\n⚠️ **Skip** — non exécuté\n\nCliquez le badge **ASSERTION** pour voir Expected vs Actual. Exportez via **Download Report**.',
    en: 'In **Test Execution**:\n✅ **Pass** — assertion succeeded\n❌ **Fail** — assertion failed\n⚠️ **Skip** — not executed\n\nClick the **ASSERTION** badge to see Expected vs Actual. Export via **Download Report**.',
    ar: 'في **Test Execution**:\n✅ **Pass** — الاختبار نجح\n❌ **Fail** — الاختبار فشل\n⚠️ **Skip** — لم يُنفَّذ\n\nانقر شارة **ASSERTION** لرؤية Expected مقابل Actual. صدّر عبر **Download Report**.',
  },
  {
    tags: ['regression', 'régression', 'regression test', 'breaking change'],
    fr: '**Regression Test** — vérifie que les nouvelles modifs n\'ont pas cassé l\'existant. Disponible pour les projets **Internal**. Durée ~3min.',
    en: '**Regression Test** — verifies that new changes haven\'t broken existing features. Available for **Internal** projects. Duration ~3min.',
    ar: '**Regression Test** — يتحقق أن التعديلات الجديدة لم تكسر الميزات الموجودة. متاح لمشاريع **Internal**. المدة ~3 دقائق.',
  },
  {
    tags: ['functional', 'fonctionnel', 'functional test', 'interaction', 'click', 'form'],
    fr: '**Functional Test** — simule des interactions réelles (clics, formulaires, assertions). Durée ~1min. Idéal pour tester les comportements utilisateur.',
    en: '**Functional Test** — simulates real interactions (clicks, forms, assertions). Duration ~1min. Ideal for testing user behaviors.',
    ar: '**Functional Test** — يحاكي التفاعلات الحقيقية (نقرات، نماذج، تأكيدات). المدة ~دقيقة. مثالي لاختبار سلوك المستخدم.',
  },
  {
    tags: ['performance', 'speed', 'vitesse', 'chargement', 'load', 'loading time'],
    fr: '**Performance Test** — mesure le temps de chargement et les réponses. Durée ~2min. Idéal avant chaque déploiement.',
    en: '**Performance Test** — measures load times and response speeds. Duration ~2min. Ideal before every deployment.',
    ar: '**Performance Test** — يقيس أوقات التحميل وسرعة الاستجابة. المدة ~دقيقتان. مثالي قبل كل نشر.',
  },
  {
    tags: ['selenium', 'python', '.py'],
    fr: '**Selenium** génère des scripts Python (`.py`). Le plus compatible tous navigateurs. Recommandé pour les projets **Public**.',
    en: '**Selenium** generates Python scripts (`.py`). The most cross-browser compatible framework. Recommended for **Public** projects.',
    ar: '**Selenium** يُنشئ سكريبتات Python (`.py`). الأكثر توافقاً مع جميع المتصفحات. موصى به لمشاريع **Public**.',
  },
  {
    tags: ['cypress vs playwright', 'playwright vs cypress', 'cypress playwright'],
    fr: '**Cypress vs Playwright :**\n\n🟡 **Cypress** → JavaScript `.js` · UI de debug intégrée · Idéal E2E moderne · Projets **Public**\n\n🔵 **Playwright** → Python `.py` · Chromium, Firefox, WebKit · Multi-navigateurs · Projets **Internal**\n\n💡 **Conseil :** Cypress si tu veux du JS, Playwright si tu veux du Python multi-browser.',
    en: '**Cypress vs Playwright:**\n\n🟡 **Cypress** → JavaScript `.js` · Built-in debug UI · Best for modern E2E · **Public** projects\n\n🔵 **Playwright** → Python `.py` · Chromium, Firefox, WebKit · Multi-browser · **Internal** projects\n\n💡 **Tip:** Cypress if you want JS, Playwright if you want Python multi-browser.',
    ar: '**Cypress مقابل Playwright:**\n\n🟡 **Cypress** → JavaScript `.js` · واجهة تصحيح مدمجة · الأفضل لـ E2E · مشاريع **Public**\n\n🔵 **Playwright** → Python `.py` · Chromium، Firefox، WebKit · متعدد المتصفحات · مشاريع **Internal**\n\n💡 **نصيحة:** Cypress إذا أردت JS، Playwright إذا أردت Python متعدد المتصفحات.',
  },
  {
    tags: ['cypress vs selenium', 'selenium vs cypress', 'cypress selenium'],
    fr: '**Cypress vs Selenium :**\n\n🟡 **Cypress** → JavaScript `.js` · Plus moderne · UI de debug · Projets **Public**\n\n🟢 **Selenium** → Python `.py` · Plus compatible tous navigateurs · Projets **Public**\n\n💡 **Conseil :** Cypress pour les apps modernes, Selenium pour la compatibilité maximale.',
    en: '**Cypress vs Selenium:**\n\n🟡 **Cypress** → JavaScript `.js` · More modern · Debug UI · **Public** projects\n\n🟢 **Selenium** → Python `.py` · Most browser compatible · **Public** projects\n\n💡 **Tip:** Cypress for modern apps, Selenium for maximum compatibility.',
    ar: '**Cypress مقابل Selenium:**\n\n🟡 **Cypress** → JavaScript `.js` · أحدث · واجهة تصحيح · مشاريع **Public**\n\n🟢 **Selenium** → Python `.py` · الأكثر توافقاً · مشاريع **Public**\n\n💡 **نصيحة:** Cypress للتطبيقات الحديثة، Selenium للتوافق الأقصى.',
  },
  {
    tags: ['playwright vs selenium', 'selenium vs playwright', 'playwright selenium'],
    fr: '**Playwright vs Selenium :**\n\n🔵 **Playwright** → Python `.py` · Multi-browser moderne · Projets **Internal**\n\n🟢 **Selenium** → Python `.py` · Compatible tous navigateurs · Projets **Public**\n\n💡 **Conseil :** Playwright pour APIs/microservices, Selenium pour apps web publiques.',
    en: '**Playwright vs Selenium:**\n\n🔵 **Playwright** → Python `.py` · Modern multi-browser · **Internal** projects\n\n🟢 **Selenium** → Python `.py` · All browsers compatible · **Public** projects\n\n💡 **Tip:** Playwright for APIs/microservices, Selenium for public web apps.',
    ar: '**Playwright مقابل Selenium:**\n\n🔵 **Playwright** → Python `.py` · متعدد المتصفحات الحديث · مشاريع **Internal**\n\n🟢 **Selenium** → Python `.py` · متوافق مع جميع المتصفحات · مشاريع **Public**\n\n💡 **نصيحة:** Playwright للـ APIs والـ Microservices، Selenium لتطبيقات الويب العامة.',
  },
  {
    tags: ['compare all', 'tous les frameworks', 'all frameworks', 'quel framework', 'which framework', 'cypress playwright selenium'],
    fr: '**Cypress vs Playwright vs Selenium :**\n\n🟡 **Cypress** → JS · E2E moderne · Public\n🔵 **Playwright** → Python · Multi-browser · Internal\n🟢 **Selenium** → Python · Compatible max · Public\n⚡ **Both** → génère les 3 en même temps',
    en: '**Cypress vs Playwright vs Selenium:**\n\n🟡 **Cypress** → JS · Modern E2E · Public\n🔵 **Playwright** → Python · Multi-browser · Internal\n🟢 **Selenium** → Python · Max compatible · Public\n⚡ **Both** → generates all 3 at once',
    ar: '**Cypress مقابل Playwright مقابل Selenium:**\n\n🟡 **Cypress** → JS · E2E حديث · Public\n🔵 **Playwright** → Python · متعدد المتصفحات · Internal\n🟢 **Selenium** → Python · أقصى توافق · Public\n⚡ **Both** → يُنشئ الثلاثة في آنٍ واحد',
  },
  {
    tags: ['playwright', 'chromium', 'firefox', 'webkit', 'cross browser'],
    fr: '**Playwright** génère des scripts Python (`.py`). Supporte Chromium, Firefox, WebKit. Recommandé pour les projets **Internal**.',
    en: '**Playwright** generates Python scripts (`.py`). Supports Chromium, Firefox, and WebKit. Recommended for **Internal** projects.',
    ar: '**Playwright** يُنشئ سكريبتات Python (`.py`). يدعم Chromium وFirefox وWebKit. موصى به لمشاريع **Internal**.',
  },
  {
    tags: ['project', 'projet', 'public', 'internal', 'new project', 'nouveau projet', 'type'],
    fr: '2 types de projets :\n🌐 **Public** — apps web, landing pages, interfaces\n🔒 **Internal** — APIs, microservices, infra privée\n\n**Projects → New Project** pour commencer.',
    en: '2 project types:\n🌐 **Public** — web apps, landing pages, interfaces\n🔒 **Internal** — APIs, microservices, private infrastructure\n\n**Projects → New Project** to get started.',
    ar: 'نوعان من المشاريع:\n🌐 **Public** — تطبيقات ويب، صفحات هبوط، واجهات\n🔒 **Internal** — APIs، microservices، بنية تحتية خاصة\n\n**Projects → New Project** للبدء.',
  },
  {
    tags: ['history', 'historique', 'past', 'previous', 'log', 'logs'],
    fr: 'L\'**Historique** liste toutes vos générations. Filtrez par framework, triez par date/pass rate, cliquez une ligne pour les détails.',
    en: '**History** lists all your past generations. Filter by framework, sort by date/pass rate, click a row for details.',
    ar: '**History** يعرض جميع عمليات الإنشاء السابقة. صفّ حسب الإطار، رتّب حسب التاريخ/pass rate، انقر صفاً للتفاصيل.',
  },
  {
    tags: ['download', 'télécharger', 'pdf', 'csv', 'html', 'rapport', 'report', 'export'],
    fr: 'Dans **Execution → Download Report** :\n📊 **CSV** — données brutes\n🌐 **HTML** — rapport visuel\n📄 **PDF** — rapport complet',
    en: 'In **Execution → Download Report**:\n📊 **CSV** — raw data\n🌐 **HTML** — visual report\n📄 **PDF** — full report',
    ar: 'في **Execution → Download Report**:\n📊 **CSV** — بيانات خام\n🌐 **HTML** — تقرير مرئي\n📄 **PDF** — تقرير كامل',
  },
  {
    tags: ['theme', 'dark', 'light', 'mode', 'thème', 'appearance', 'apparence'],
    fr: 'Changez le thème via le **bouton lune/soleil** dans le header, ou via **Settings → Appearance**.',
    en: 'Change the theme via the **moon/sun button** in the header, or go to **Settings → Appearance**.',
    ar: 'غيّر الثيم عبر **زر القمر/الشمس** في الهيدر، أو عبر **Settings → Appearance**.',
  },
  {
    tags: ['settings', 'paramètres', 'langue', 'language', 'notification', 'preferences'],
    fr: 'Dans **Settings** :\n• Notifications email / rapport hebdo\n• Framework par défaut\n• Thème (Dark / Light / System)\n• Langue (English, Français, العربية)',
    en: 'In **Settings**:\n• Email notifications / weekly report\n• Default framework\n• Theme (Dark / Light / System)\n• Language (English, Français, العربية)',
    ar: 'في **Settings**:\n• إشعارات البريد / التقرير الأسبوعي\n• الإطار الافتراضي\n• الثيم (Dark / Light / System)\n• اللغة (English, Français, العربية)',
  },
  {
    tags: ['hello', 'bonjour', 'salut', 'hi', 'hey', 'help', 'aide', 'start', 'commencer'],
    fr: 'Bonjour ! 👋 Je suis **Nextest AI** — posez-moi n\'importe quelle question sur Nextest : tests, frameworks, projets, résultats, exports.',
    en: 'Hello! 👋 I\'m the **Nextest AI** assistant. Ask me anything about Nextest: tests, frameworks, projects, results, exports!',
    ar: 'مرحباً! 👋 أنا **Nextest AI** — اسألني أي شيء عن Nextest: اختبارات، أطر عمل، مشاريع، نتائج، تصدير!',
  },
  {
    tags: ['account', 'compte', 'profile', 'profil', 'avatar', 'photo', 'image'],
    fr: 'Dans **Account** :\n• Modifiez votre **nom** et **email**\n• Changez votre **photo de profil** (cliquez sur l\'avatar)\n• Consultez vos stats : générations et projets',
    en: 'In **Account**:\n• Edit your **name** and **email**\n• Change your **profile picture** (click the avatar)\n• View your stats: generations and projects',
    ar: 'في **Account**:\n• عدّل **اسمك** و**بريدك الإلكتروني**\n• غيّر **صورة ملفك الشخصي** (انقر الأفاتار)\n• اعرض إحصائياتك: الإنشاءات والمشاريع',
  },
  {
    tags: ['password', 'mot de passe', 'changer mot de passe', 'change password', 'update password', 'sécurité', 'security'],
    fr: 'Pour changer votre mot de passe :\n1. **Account** → section **Change Password**\n2. Entrez votre mot de passe actuel\n3. Entrez le nouveau mot de passe\n4. Confirmez et cliquez **Update Password**',
    en: 'To change your password:\n1. **Account** → **Change Password** section\n2. Enter your current password\n3. Enter the new password\n4. Confirm and click **Update Password**',
    ar: 'لتغيير كلمة المرور:\n1. **Account** → قسم **Change Password**\n2. أدخل كلمة مرورك الحالية\n3. أدخل كلمة المرور الجديدة\n4. أكّد وانقر **Update Password**',
  },
  {
    tags: ['notification', 'notifications', 'notif', 'badge', 'alerte', 'alert', 'cloche', 'bell'],
    fr: 'Les **notifications** apparaissent en haut à droite (icône cloche).\n\nChaque génération terminée crée une notification avec :\n✅ Pass / ❌ Fail count\n🔗 URL testée\n⚙️ Framework utilisé\n\nVous pouvez supprimer une notif ou toutes les effacer.',
    en: 'The **notifications** appear top right (bell icon).\n\nEach completed generation creates a notification with:\n✅ Pass / ❌ Fail count\n🔗 Tested URL\n⚙️ Framework used\n\nYou can delete one or clear all.',
    ar: 'تظهر **الإشعارات** أعلى اليمين (أيقونة الجرس).\n\nكل إنشاء مكتمل يُنشئ إشعاراً يحتوي على:\n✅ عدد Pass / ❌ عدد Fail\n🔗 URL المختبر\n⚙️ الإطار المستخدم\n\nيمكنك حذف إشعار أو مسح الكل.',
  },
  {
    tags: ['supprimer projet', 'delete project', 'effacer projet', 'remove project', 'supprimer', 'delete'],
    fr: 'Pour supprimer un projet :\n**Projects** → survolez la carte → cliquez l\'icône 🗑️\n\n⚠️ La suppression est **irréversible** et efface toutes les générations associées.',
    en: 'To delete a project:\n**Projects** → hover the card → click the 🗑️ icon\n\n⚠️ Deletion is **irreversible** and removes all associated generations.',
    ar: 'لحذف مشروع:\n**Projects** → مرّر فوق البطاقة → انقر أيقونة 🗑️\n\n⚠️ الحذف **لا رجعة فيه** ويزيل جميع الإنشاءات المرتبطة.',
  },
  {
    tags: ['modifier projet', 'edit project', 'renommer', 'rename', 'update project', 'changer nom projet'],
    fr: 'Pour modifier un projet :\n**Projects** → survolez la carte → cliquez l\'icône ✏️\n\nVous pouvez modifier :\n• Le **nom** du projet\n• La **description**\n\n⚠️ Le **type** (Public/Internal) ne peut pas être changé après création.',
    en: 'To edit a project:\n**Projects** → hover the card → click the ✏️ icon\n\nYou can edit:\n• The **name**\n• The **description**\n\n⚠️ The **type** (Public/Internal) cannot be changed after creation.',
    ar: 'لتعديل مشروع:\n**Projects** → مرّر فوق البطاقة → انقر أيقونة ✏️\n\nيمكنك تعديل:\n• **الاسم**\n• **الوصف**\n\n⚠️ لا يمكن تغيير **النوع** (Public/Internal) بعد الإنشاء.',
  },
  {
    tags: ['search', 'recherche', 'chercher', 'trouver', 'find', 'filter', 'filtrer'],
    fr: 'Nextest propose une **recherche globale** dans le header :\n• Recherchez par **URL**, **projet**, ou **framework**\n• Les résultats affichent projets et générations\n• Cliquez un résultat pour naviguer directement',
    en: 'Nextest has a **global search** in the header:\n• Search by **URL**, **project**, or **framework**\n• Results show projects and generations\n• Click a result to navigate directly',
    ar: 'يوفر Nextest **بحثاً شاملاً** في الهيدر:\n• ابحث بـ **URL** أو **مشروع** أو **إطار**\n• تعرض النتائج المشاريع والإنشاءات\n• انقر نتيجة للانتقال مباشرةً',
  },
  {
    tags: ['dashboard', 'tableau de bord', 'accueil', 'home', 'overview', 'statistiques', 'stats'],
    fr: 'Le **Dashboard** affiche :\n📊 Scripts générés, apps analysées, couverture moyenne\n📈 Graphique des générations de la semaine\n🍩 Résultats globaux (Pass/Fail/Skip)\n🔗 Top URLs testées\n⚡ Activité récente',
    en: 'The **Dashboard** shows:\n📊 Scripts generated, apps analyzed, avg coverage\n📈 Weekly generations chart\n🍩 Global results (Pass/Fail/Skip)\n🔗 Top tested URLs\n⚡ Recent activity',
    ar: 'يعرض **Dashboard**:\n📊 السكريبتات المُنشأة، التطبيقات المحللة، متوسط التغطية\n📈 مخطط إنشاءات الأسبوع\n🍩 النتائج الإجمالية (Pass/Fail/Skip)\n🔗 أكثر URLs اختباراً\n⚡ النشاط الأخير',
  },
  {
    tags: ['theme', 'dark mode', 'light mode', 'mode sombre', 'mode clair', 'apparence', 'appearance', 'couleur'],
    fr: 'Pour changer le thème :\n• **Header** → bouton 🌙/☀️ (toggle rapide)\n• **Settings → Appearance** → choisissez Dark / Light / System\n\nLe thème est sauvegardé automatiquement.',
    en: 'To change the theme:\n• **Header** → 🌙/☀️ button (quick toggle)\n• **Settings → Appearance** → choose Dark / Light / System\n\nThe theme is saved automatically.',
    ar: 'لتغيير الثيم:\n• **Header** → زر 🌙/☀️ (تبديل سريع)\n• **Settings → Appearance** → اختر Dark / Light / System\n\nيُحفظ الثيم تلقائياً.',
  },
  {
    tags: ['langue', 'language', 'français', 'english', 'arabic', 'arabe', 'changer langue', 'change language'],
    fr: 'Pour changer la langue :\n**Settings → Language**\n\n3 langues disponibles :\n🇬🇧 English\n🇫🇷 Français\n🇹🇳 العربية',
    en: 'To change the language:\n**Settings → Language**\n\n3 languages available:\n🇬🇧 English\n🇫🇷 Français\n🇹🇳 العربية',
    ar: 'لتغيير اللغة:\n**Settings → Language**\n\n3 لغات متاحة:\n🇬🇧 English\n🇫🇷 Français\n🇹🇳 العربية',
  },
  {
    tags: ['supprimer historique', 'delete history', 'effacer historique', 'clear history', 'vider historique'],
    fr: 'Pour supprimer tout l\'historique :\n**Settings → Danger Zone → Delete all history**\n\nTapez **CONFIRM** pour valider.\n\n⚠️ Toutes vos générations seront **définitivement supprimées**.',
    en: 'To delete all history:\n**Settings → Danger Zone → Delete all history**\n\nType **CONFIRM** to proceed.\n\n⚠️ All your generations will be **permanently deleted**.',
    ar: 'لحذف كل السجل:\n**Settings → Danger Zone → Delete all history**\n\naكتب **CONFIRM** للمتابعة.\n\n⚠️ ستُحذف جميع إنشاءاتك **نهائياً**.',
  },
  {
    tags: ['supprimer compte', 'delete account', 'effacer compte', 'fermer compte', 'close account'],
    fr: 'Pour supprimer votre compte :\n**Settings → Danger Zone → Delete Account**\n\nTapez **CONFIRM** pour valider.\n\n⚠️ Action **irréversible** — tous vos projets, générations et données seront supprimés.',
    en: 'To delete your account:\n**Settings → Danger Zone → Delete Account**\n\nType **CONFIRM** to proceed.\n\n⚠️ **Irreversible** — all your projects, generations and data will be deleted.',
    ar: 'لحذف حسابك:\n**Settings → Danger Zone → Delete Account**\n\naكتب **CONFIRM** للمتابعة.\n\n⚠️ **لا رجعة فيه** — ستُحذف جميع مشاريعك وإنشاءاتك وبياناتك.',
  },
  {
    tags: ['unit test', 'unit', 'test unitaire', 'unitaire', 'composant', 'component', 'isolation'],
    fr: '**Unit Test** — teste des fonctions et composants de manière **isolée**.\n\nDisponible pour les projets **Internal**.\nDurée ~15s · Framework : Playwright ou Selenium.',
    en: '**Unit Test** — tests individual functions and components in **isolation**.\n\nAvailable for **Internal** projects.\nDuration ~15s · Framework: Playwright or Selenium.',
    ar: '**Unit Test** — يختبر الدوال والمكونات بشكل **معزول**.\n\nمتاح لمشاريع **Internal**.\nالمدة ~15 ثانية · الإطار: Playwright أو Selenium.',
  },
  {
    tags: ['security', 'sécurité', 'security test', 'test sécurité', 'vulnérabilité', 'vulnerability', 'injection', 'auth'],
    fr: '**Security Test** — détecte les vulnérabilités, problèmes d\'authentification et risques d\'injection.\n\nDisponible pour les projets **Internal**.\nDurée ~5min · Framework : Playwright.',
    en: '**Security Test** — detects vulnerabilities, auth issues and injection risks.\n\nAvailable for **Internal** projects.\nDuration ~5min · Framework: Playwright.',
    ar: '**Security Test** — يكتشف الثغرات، مشاكل المصادقة ومخاطر الحقن.\n\nمتاح لمشاريع **Internal**.\nالمدة ~5 دقائق · الإطار: Playwright.',
  },
  {
    tags: ['screenshot', 'capture', 'capture écran', 'photo test', 'image test', 'voir erreur'],
    fr: 'Les **screenshots** sont capturés automatiquement lors d\'un test **échoué** (Fail).\n\nPour les voir :\n**Test Execution → Results** → cliquez **Show details** sur un test échoué → section **Screenshot on Fail**',
    en: '**Screenshots** are automatically captured when a test **fails**.\n\nTo view them:\n**Test Execution → Results** → click **Show details** on a failed test → **Screenshot on Fail** section',
    ar: 'تُلتقط **Screenshots** تلقائياً عند **فشل** الاختبار.\n\nلعرضها:\n**Test Execution → Results** → انقر **Show details** على اختبار فاشل → قسم **Screenshot on Fail**',
  },
  {
    tags: ['pass rate', 'taux de réussite', 'taux', 'score', 'pourcentage', 'percentage', 'résumé'],
    fr: 'Le **Pass Rate** est calculé automatiquement :\n\n`Pass Rate = (Tests passés / Total tests) × 100`\n\n🟢 ≥ 80% → Bon\n🟡 50-79% → Moyen\n🔴 < 50% → Critique\n\nVisible dans **History**, **Projects** et **Test Execution**.',
    en: 'The **Pass Rate** is calculated automatically:\n\n`Pass Rate = (Passed tests / Total tests) × 100`\n\n🟢 ≥ 80% → Good\n🟡 50-79% → Medium\n🔴 < 50% → Critical\n\nVisible in **History**, **Projects** and **Test Execution**.',
    ar: 'يُحسب **Pass Rate** تلقائياً:\n\n`Pass Rate = (الاختبارات الناجحة / إجمالي الاختبارات) × 100`\n\n🟢 ≥ 80% → جيد\n🟡 50-79% → متوسط\n🔴 < 50% → حرج\n\nظاهر في **History** و**Projects** و**Test Execution**.',
  },
  {
    tags: ['both', 'les deux', 'tous les frameworks', 'multi framework', 'selenium et cypress', 'generate all'],
    fr: 'Le framework **Both** génère les scripts pour **Selenium + Playwright + Cypress** en même temps.\n\nVous pouvez télécharger :\n• `.py` Selenium\n• `.py` Playwright\n• `.js` Cypress\n\nIdéal pour comparer les résultats entre frameworks.',
    en: 'The **Both** framework generates scripts for **Selenium + Playwright + Cypress** at once.\n\nYou can download:\n• `.py` Selenium\n• `.py` Playwright\n• `.js` Cypress\n\nIdeal for comparing results across frameworks.',
    ar: 'إطار **Both** يُنشئ سكريبتات لـ **Selenium + Playwright + Cypress** في آنٍ واحد.\n\nيمكنك تنزيل:\n• `.py` Selenium\n• `.py` Playwright\n• `.js` Cypress\n\nمثالي لمقارنة النتائج بين الأطر.',
  },
  {
    tags: ['internal', 'interne', 'api', 'microservice', 'backend', 'privé', 'private'],
    fr: 'Les projets **Internal** sont conçus pour :\n🔒 APIs REST\n🔒 Microservices\n🔒 Infrastructure privée\n\nTypes de tests disponibles :\n• Smoke · Functional · Performance\n• Unit · Regression · Security\n\nFrameworks : Playwright · Selenium · Cypress',
    en: '**Internal** projects are designed for:\n🔒 REST APIs\n🔒 Microservices\n🔒 Private infrastructure\n\nAvailable test types:\n• Smoke · Functional · Performance\n• Unit · Regression · Security\n\nFrameworks: Playwright · Selenium · Cypress',
    ar: 'مشاريع **Internal** مصممة لـ:\n🔒 REST APIs\n🔒 Microservices\n🔒 البنية التحتية الخاصة\n\nأنواع الاختبارات المتاحة:\n• Smoke · Functional · Performance\n• Unit · Regression · Security\n\nالأطر: Playwright · Selenium · Cypress',
  },
  {
    tags: ['public', 'web app', 'landing page', 'interface', 'site web', 'website', 'frontend'],
    fr: 'Les projets **Public** sont conçus pour :\n🌐 Applications web\n🌐 Landing pages\n🌐 Interfaces utilisateur\n\nTypes de tests disponibles :\n• Smoke · Functional · Performance\n\nFrameworks : Selenium · Cypress · Playwright · Both',
    en: '**Public** projects are designed for:\n🌐 Web applications\n🌐 Landing pages\n🌐 User interfaces\n\nAvailable test types:\n• Smoke · Functional · Performance\n\nFrameworks: Selenium · Cypress · Playwright · Both',
    ar: 'مشاريع **Public** مصممة لـ:\n🌐 تطبيقات الويب\n🌐 صفحات الهبوط\n🌐 واجهات المستخدم\n\nأنواع الاختبارات المتاحة:\n• Smoke · Functional · Performance\n\nالأطر: Selenium · Cypress · Playwright · Both',
  },
  {
    tags: ['temps génération', 'generation time', 'durée', 'duration', 'combien de temps', 'how long', 'lent', 'slow'],
    fr: 'Durées estimées par type de test :\n⚡ **Smoke** → ~30 secondes\n🔬 **Functional** → ~1 minute\n📊 **Performance** → ~3 minutes\n🔧 **Unit** → ~15 secondes\n🔄 **Regression** → ~3 minutes\n🔐 **Security** → ~5 minutes',
    en: 'Estimated duration by test type:\n⚡ **Smoke** → ~30 seconds\n🔬 **Functional** → ~1 minute\n📊 **Performance** → ~3 minutes\n🔧 **Unit** → ~15 seconds\n🔄 **Regression** → ~3 minutes\n🔐 **Security** → ~5 minutes',
    ar: 'المدة التقديرية حسب نوع الاختبار:\n⚡ **Smoke** → ~30 ثانية\n🔬 **Functional** → ~دقيقة\n📊 **Performance** → ~3 دقائق\n🔧 **Unit** → ~15 ثانية\n🔄 **Regression** → ~3 دقائق\n🔐 **Security** → ~5 دقائق',
  },
  {
    tags: ['cypress', 'javascript', '.js', 'e2e', 'end to end'],
    fr: '**Cypress** génère des scripts JavaScript (`.js`). Il inclut une **UI de debug intégrée** et est idéal pour les tests E2E modernes. Recommandé pour les projets **Public**.',
    en: '**Cypress** generates JavaScript scripts (`.js`). It includes a **built-in debug UI** and is ideal for modern E2E testing. Recommended for **Public** projects.',
    ar: '**Cypress** يُنشئ سكريبتات JavaScript (`.js`). يتضمن **واجهة تصحيح مدمجة** وهو مثالي لاختبارات E2E الحديثة. موصى به لمشاريع **Public**.',
  },
];

// ─── Strict KB-only matching ───────────────────────────────────────────────────
const NEXTEST_VOCABULARY = new Set([
  'smoke','functional','regression','assertion','assertions',
  'test','tests','testing',
  'cypress','playwright','selenium','framework','frameworks',
  'chromium','webkit',
  'nextest','generate','génération','generation','générer',
  'execution','passrate',
  'dashboard','historique','paramètres','notifications',
  'rapport','télécharger','screenshot',
  'supprimer','renommer','lancer','exécuter','démarrer',
  'microservice','webapp','couverture','cloche',
  'nextest','bonjour','salut',
]);

function tokenize(text) {
  return text.toLowerCase().replace(/['']/g, "'").split(/[\s,?!.;:()[\]{}]+/).filter(Boolean);
}

function scoreEntry(entry, tokens) {
  let score = 0;
  const joined = tokens.join(' ');
  for (const tag of entry.tags) {
    const tagTokens = tokenize(tag);
    if (tagTokens.length > 1 && joined.includes(tag.toLowerCase())) {
      score += tagTokens.length * 3;
    } else {
      for (const tt of tagTokens) {
        if (tokens.some(t => t === tt ||
          (Math.abs(t.length - tt.length) <= 1 && levenshtein(t, tt) <= 1)
        )) score += 2;
      }
    }
  }
  return score;
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => i || j)
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[a.length][b.length];
}

function isNextestRelated(tokens) {
  return tokens.some(t => {
    if (NEXTEST_VOCABULARY.has(t)) return true;
    for (const v of NEXTEST_VOCABULARY) {
      if (Math.abs(t.length - v.length) <= 1 && levenshtein(t, v) <= 1) return true;
    }
    return false;
  });
}

const GREETING_TOKENS = new Set(['hello','hi','hey','bonjour','salut','help','aide','start','commencer','مرحبا','مرحباً','هلا','ساعدني']);

function findKBAnswer(input, lang) {
  const tokens = tokenize(input);
  const isGreeting = tokens.length <= 3 && tokens.every(t => GREETING_TOKENS.has(t));
  if (!isGreeting && !isNextestRelated(tokens)) return null;

  let best = null, bestScore = 0;
  for (const entry of KB) {
    const s = scoreEntry(entry, tokens);
    if (s > bestScore) { bestScore = s; best = entry; }
  }

  const minScore = isGreeting ? 1 : 3;
  if (best && bestScore >= minScore) return best[lang] || best.en;
  return null;
}

async function getBotResponse(message, lang) {
  const kbAnswer = findKBAnswer(message, lang);
  if (kbAnswer) {
    await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
    return { text: kbAnswer, source: 'kb' };
  }

  const offTopic = {
    fr: "Je suis uniquement conçu pour répondre aux questions sur **Nextest**.\n\nVoici ce que je peux vous aider avec :\n• Types de tests (Smoke, Functional, Performance…)\n• Frameworks (Cypress, Playwright, Selenium)\n• Projets, résultats, historique\n• Paramètres, exports, notifications",
    en: "I'm only able to answer questions about **Nextest**.\n\nHere's what I can help with:\n• Test types (Smoke, Functional, Performance…)\n• Frameworks (Cypress, Playwright, Selenium)\n• Projects, results, history\n• Settings, exports, notifications",
    ar: "أنا مصمم فقط للإجابة على أسئلة **Nextest**.\n\nإليك ما يمكنني مساعدتك به:\n• أنواع الاختبارات (Smoke, Functional, Performance…)\n• الأطر (Cypress, Playwright, Selenium)\n• المشاريع، النتائج، السجل\n• الإعدادات، التصدير، الإشعارات",
  };

  await new Promise(r => setTimeout(r, 200));
  return { text: offTopic[lang] || offTopic.en, source: 'kb' };
}

function renderText(text, isLight) {
  const codeColor = isLight ? '#4338ca' : '#a5b4fc';
  const codeBg    = isLight ? 'rgba(99,102,241,.1)' : 'rgba(99,102,241,.15)';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, `<code style="font-family:monospace;font-size:11px;background:${codeBg};color:${codeColor};padding:1px 5px;border-radius:4px">$1</code>`)
    .replace(/\\n/g, '<br/>')
    .replace(/\n/g, '<br/>');
}

const SUGGESTIONS = {
  fr: ["C'est quoi un smoke test ?", 'Comment générer des tests ?', 'Cypress vs Playwright ?', 'Expliquer les résultats'],
  en: ['What is a smoke test?', 'How to run tests?', 'Cypress vs Playwright?', 'Explain test results'],
  ar: ['ما هو smoke test؟', 'كيف أُنشئ اختبارات؟', 'Cypress مقابل Playwright؟', 'اشرح النتائج'],
};

const BotIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="7" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.8"/>
    <circle cx="9" cy="13" r="1.4" fill="currentColor"/>
    <circle cx="15" cy="13" r="1.4" fill="currentColor"/>
    <path d="M12 3v4M9 3h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M6 20v2M18 20v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="#a5b4fc" opacity=".8"/>
  </svg>
);

export default function NextestChatbot({ theme = 'dark' }) {
  const isLight = theme === 'light';
  const [, forceUpdate] = useState(0);
  useEffect(() => { forceUpdate(v => v + 1); }, [theme]);

  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([{
    id: 1, from: 'bot', lang: 'fr', source: 'kb',
    text: 'Bonjour ! 👋 Je suis **Nextest AI** — je réponds uniquement aux questions sur Nextest : tests, frameworks, projets, résultats, exports. Comment puis-je vous aider ?',
    time: new Date(),
  }]);
  const [input,    setInput]    = useState('');
  const [typing,   setTyping]   = useState(false);
  const [showSugg, setShowSugg] = useState(true);
  const [unread,   setUnread]   = useState(0);
  const [pulse,    setPulse]    = useState(true);
  const [uiLang,   setUiLang]   = useState('fr');

  const endRef   = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => setPulse(false), 6000); return () => clearTimeout(t); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);
  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 320); }
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const q = (text || input).trim();
    if (!q || typing) return;
    const lang = detectLanguage(q);
    setUiLang(lang);
    setInput('');
    setShowSugg(false);
    setMessages(m => [...m, { id: Date.now(), from: 'user', lang, text: q, time: new Date() }]);
    setTyping(true);
    try {
      const { text: answer, source } = await getBotResponse(q, lang);
      setMessages(m => [...m, { id: Date.now() + 1, from: 'bot', lang, source, text: answer, time: new Date() }]);
      setShowSugg(true);
    } catch {
      const errMsgs = { fr: 'Une erreur est survenue.', en: 'An error occurred.', ar: 'حدث خطأ.' };
      setMessages(m => [...m, { id: Date.now() + 1, from: 'bot', lang, source: 'error', text: errMsgs[lang] || errMsgs.en, time: new Date() }]);
    } finally {
      setTyping(false);
      if (!open) setUnread(u => u + 1);
    }
  }, [input, typing, open]);

  const fmt = d => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const currentSuggestions = SUGGESTIONS[uiLang] || SUGGESTIONS.en;
  const isRTL = uiLang === 'ar';

  const headerSub = { fr: 'Spécialiste Nextest · Instantané', en: 'Nextest specialist · Instant', ar: 'متخصص Nextest · فوري' };
  const tooltipText = { fr: 'Demandez à Nextest AI', en: 'Ask Nextest AI', ar: 'اسأل Nextest AI' };
  const placeholder = { fr: 'Posez une question sur Nextest…', en: 'Ask anything about Nextest…', ar: 'اسأل أي شيء عن Nextest…' };

  return (
    <>
    <style key={theme}>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        .nxc-fab-wrap { position:fixed;bottom:28px;right:28px;z-index:10000; }
        .nxc-fab {
          width:56px;height:56px;border-radius:50%;
          background:#4f46e5;border:3px solid #6366f1;
          cursor:pointer;color:#fff;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 6px rgba(0,0,0,.25),0 10px 30px rgba(79,70,229,.8),0 0 0 4px rgba(99,102,241,.25);
          transition:transform .22s cubic-bezier(.34,1.56,.64,1),box-shadow .2s;
          font-family:'DM Sans',sans-serif;position:relative;
        }
        .nxc-fab:hover { transform:scale(1.08);box-shadow:0 6px 10px rgba(0,0,0,.3),0 16px 40px rgba(79,70,229,.9),0 0 0 6px rgba(99,102,241,.2); }
        .nxc-fab:active { transform:scale(.93); }
        .nxc-tooltip {
          position:absolute;right:calc(100% + 10px);top:50%;transform:translateY(-50%);
          background:${isLight ? '#ffffff' : 'rgba(13,21,38,.96)'};
          border:1px solid ${isLight ? 'rgba(99,102,241,.22)' : 'rgba(99,102,241,.3)'};
          color:${isLight ? '#0f1729' : '#e2e8f0'};
          font-size:11px;font-weight:600;font-family:'DM Sans',sans-serif;
          padding:5px 11px;border-radius:8px;white-space:nowrap;pointer-events:none;
          box-shadow:${isLight ? '0 4px 16px rgba(15,23,41,.14)' : '0 6px 20px rgba(0,0,0,.4)'};
          opacity:0;transition:opacity .18s ease;
        }
        .nxc-tooltip::after {
          content:'';position:absolute;left:100%;top:50%;transform:translateY(-50%);
          border:5px solid transparent;
          border-left-color:${isLight ? '#ffffff' : 'rgba(13,21,38,.96)'};
        }
        .nxc-fab-wrap:hover .nxc-tooltip { opacity:1; }
        .nxc-ring { position:absolute;inset:-5px;border-radius:50%;border:2px solid rgba(99,102,241,.4);animation:nxcRing 2.4s ease-out 3; }
        @keyframes nxcRing{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.65);opacity:0}}
        .nxc-online-dot { position:absolute;bottom:2px;right:2px;width:12px;height:12px;border-radius:50%;background:#10b981;border:2.5px solid #4f46e5;box-shadow:0 0 0 1.5px #fff,0 0 8px rgba(16,185,129,.7); }
        .nxc-badge { position:absolute;top:-3px;right:-3px;width:18px;height:18px;border-radius:50%;background:#ef4444;border:2px solid ${isLight ? '#f4f6fb' : '#040914'};color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;animation:nxcPop .35s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes nxcPop{from{transform:scale(0)}to{transform:scale(1)}}
        .nxc-win {
          position:fixed;bottom:96px;right:28px;z-index:9999;
          width:372px;max-height:calc(100vh - 130px);
          background:${isLight ? '#ffffff' : '#0d1526'};
          border:1px solid ${isLight ? 'rgba(99,102,241,.2)' : 'rgba(99,102,241,.22)'};
          border-radius:20px;
          box-shadow:${isLight ? '0 28px 80px rgba(15,23,41,.18),0 0 0 1px rgba(99,102,241,.1)' : '0 28px 80px rgba(0,0,0,.7),0 0 0 1px rgba(99,102,241,.1),0 0 60px rgba(99,102,241,.05)'};
          display:flex;flex-direction:column;overflow:hidden;
          transform-origin:bottom right;font-family:'DM Sans',sans-serif;
          transition:transform .35s cubic-bezier(.34,1.4,.64,1),opacity .25s ease,filter .25s ease;
        }
        .nxc-win.closed { transform:scale(.55) translateY(36px);opacity:0;pointer-events:none;filter:blur(4px) }
        .nxc-win.open   { transform:scale(1) translateY(0);opacity:1;filter:blur(0) }
        .nxc-hdr { padding:13px 15px;background:${isLight ? '#f4f6fb' : '#040914'};border-bottom:1px solid ${isLight ? 'rgba(99,102,241,.14)' : 'rgba(99,102,241,.1)'};display:flex;align-items:center;gap:10px;flex-shrink:0; }
        .nxc-hdr-av { width:33px;height:33px;border-radius:9px;flex-shrink:0;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 4px 12px rgba(99,102,241,.4); }
        .nxc-hdr-info { flex:1 }
        .nxc-hdr-title { color:${isLight ? '#0f1729' : '#e2e8f0'};font-size:13px;font-weight:700;letter-spacing:-.01em }
        .nxc-hdr-sub { color:${isLight ? 'rgba(75,86,117,.6)' : 'rgba(148,163,184,.55)'};font-size:10px;margin-top:2px;display:flex;align-items:center;gap:5px; }
        .nxc-hdr-dot { width:5px;height:5px;border-radius:50%;background:#10b981;box-shadow:0 0 6px rgba(16,185,129,.6);animation:nxcBlink 2s ease-in-out infinite; }
        @keyframes nxcBlink{0%,100%{opacity:1}50%{opacity:.25}}
        .nxc-xbtn { width:25px;height:25px;border-radius:7px;flex-shrink:0;border:1px solid ${isLight ? 'rgba(99,102,241,.18)' : 'rgba(99,102,241,.1)'};background:${isLight ? 'rgba(99,102,241,.07)' : 'rgba(255,255,255,.04)'};color:${isLight ? 'rgba(75,86,117,.65)' : 'rgba(148,163,184,.55)'};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s,color .15s,border-color .15s; }
        .nxc-xbtn:hover { background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.25);color:#ef4444 }
        .nxc-msgs { flex:1;overflow-y:auto;padding:13px;display:flex;flex-direction:column;gap:11px;scroll-behavior:smooth;min-height:180px;max-height:320px;background:${isLight ? '#f0f4ff' : '#070e1c'}; }
        .nxc-msgs::-webkit-scrollbar{width:3px}
        .nxc-msgs::-webkit-scrollbar-thumb{background:${isLight ? 'rgba(99,102,241,.22)' : 'rgba(99,102,241,.15)'};border-radius:3px}
        .nxc-row { display:flex;gap:7px;align-items:flex-end;animation:nxcSlideIn .28s cubic-bezier(.34,1.4,.64,1) both }
        .nxc-row.user { flex-direction:row-reverse }
        @keyframes nxcSlideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .nxc-av { width:24px;height:24px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px; }
        .nxc-av.bot { background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff }
        .nxc-av.user { background:${isLight ? 'rgba(99,102,241,.09)' : 'rgba(255,255,255,.04)'};border:1px solid ${isLight ? 'rgba(99,102,241,.18)' : 'rgba(99,102,241,.1)'}; }
        .nxc-bub { max-width:82%;padding:9px 12px;border-radius:13px;font-size:12px;line-height:1.65;white-space:normal;color:${isLight ? '#0f1729' : '#e2e8f0'}; }
        .nxc-bub br { display:block;content:'';margin:5px 0; }
        .nxc-bub.bot { background:${isLight ? '#ffffff' : 'rgba(255,255,255,.04)'};border:1px solid ${isLight ? 'rgba(99,102,241,.15)' : 'rgba(99,102,241,.1)'};border-bottom-left-radius:3px;box-shadow:${isLight ? '0 1px 4px rgba(15,23,41,.08)' : 'none'};color:${isLight ? '#0f1729' : '#e2e8f0'}; }
        .nxc-bub.user { background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border-bottom-right-radius:3px;box-shadow:0 4px 14px rgba(99,102,241,.35); }
        .nxc-bub strong { color:${isLight ? '#4338ca' : '#a5b4fc'};font-weight:700 }
        .nxc-bub.user strong { color:#e0d9ff }
        .nxc-ts { font-size:9px;color:${isLight ? 'rgba(75,86,117,.45)' : 'rgba(148,163,184,.3)'};margin-top:3px;padding:0 1px;display:flex;align-items:center;gap:4px; }
        .nxc-row.user .nxc-ts { justify-content:flex-end }
        .nxc-typing { display:flex;gap:4px;align-items:center;padding:7px 11px }
        .nxc-typing span { width:5px;height:5px;border-radius:50%;background:#6366f1;animation:nxcTyp 1.2s ease-in-out infinite; }
        .nxc-typing span:nth-child(2){animation-delay:.2s}
        .nxc-typing span:nth-child(3){animation-delay:.4s}
        @keyframes nxcTyp{0%,60%,100%{transform:translateY(0);opacity:.3}30%{transform:translateY(-5px);opacity:1}}
        .nxc-suggs { padding:0 12px 10px;display:flex;flex-wrap:wrap;gap:5px;flex-shrink:0;background:${isLight ? '#f4f6fb' : '#070e1c'};animation:nxcFadeIn .3s ease both; }
        @keyframes nxcFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        .nxc-sug { font-size:10.5px;font-weight:600;padding:4px 10px;border-radius:20px;border:1px solid ${isLight ? 'rgba(99,102,241,.22)' : 'rgba(99,102,241,.22)'};background:${isLight ? 'rgba(99,102,241,.08)' : 'rgba(99,102,241,.08)'};color:${isLight ? '#4338ca' : '#a5b4fc'};cursor:pointer;transition:all .15s;white-space:nowrap;font-family:'DM Sans',sans-serif; }
        .nxc-sug:hover { background:rgba(99,102,241,.16);transform:translateY(-1px);box-shadow:0 4px 12px rgba(99,102,241,.2) }
        .nxc-sug:active { transform:scale(.95) }
        .nxc-sep { height:1px;background:${isLight ? 'rgba(99,102,241,.12)' : 'rgba(99,102,241,.1)'};flex-shrink:0 }
        .nxc-inp-area { padding:9px 11px 11px;display:flex;gap:7px;align-items:flex-end;flex-shrink:0;background:${isLight ? '#f4f6fb' : '#040914'}; }
        .nxc-textarea { flex:1;background:${isLight ? '#ffffff' : 'rgba(255,255,255,.04)'};border:1.5px solid ${isLight ? 'rgba(99,102,241,.2)' : 'rgba(255,255,255,.05)'};border-radius:10px;padding:8px 11px;color:${isLight ? '#0f1729' : '#e2e8f0'};font-size:12px;font-family:'DM Sans',sans-serif;outline:none;resize:none;line-height:1.5;min-height:36px;max-height:86px;transition:border-color .15s,box-shadow .15s; }
        .nxc-textarea::placeholder { color:${isLight ? 'rgba(75,86,117,.45)' : 'rgba(148,163,184,.3)'} }
        .nxc-textarea:focus { border-color:rgba(99,102,241,.4);box-shadow:0 0 0 3px rgba(99,102,241,.1);background:${isLight ? '#ffffff' : '#0d1526'}; }
        .nxc-send-btn { width:36px;height:36px;border-radius:9px;flex-shrink:0;background:linear-gradient(135deg,#6366f1,#4f46e5);border:none;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(99,102,241,.4);transition:transform .15s,opacity .15s,box-shadow .15s; }
        .nxc-send-btn:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,.55) }
        .nxc-send-btn:active { transform:scale(.91) }
        .nxc-send-btn:disabled { opacity:.32;cursor:not-allowed;transform:none }
        .nxc-ftr { text-align:center;padding:0 0 9px;font-size:9px;letter-spacing:.05em;color:${isLight ? 'rgba(75,86,117,.4)' : 'rgba(148,163,184,.3)'};flex-shrink:0;background:${isLight ? '#f4f6fb' : '#040914'}; }
        .nxc-ftr em { color:${isLight ? '#6366f1' : '#a5b4fc'};font-style:normal;font-weight:600 }
        @media (max-width: 480px) {
          .nxc-win { width:calc(100vw - 20px);right:10px;bottom:82px;border-radius:16px;max-height:calc(100vh - 110px) }
          .nxc-fab-wrap { bottom:18px;right:16px }
          .nxc-tooltip { display:none }
          .nxc-msgs { max-height:calc(100vh - 320px) }
        }
      `}</style>

      <div className="nxc-fab-wrap">
        <div className="nxc-tooltip">{tooltipText[uiLang] || tooltipText.en}</div>
        {!open && pulse && (
          <div style={{
            position:'absolute',bottom:'68px',right:0,
            background:isLight?'#ffffff':'#0d1526',
            border:`1px solid ${isLight?'rgba(99,102,241,.2)':'rgba(99,102,241,.3)'}`,
            borderRadius:'12px 12px 2px 12px',padding:'8px 12px',
            fontSize:11,fontWeight:600,color:isLight?'#0f1729':'#e2e8f0',
            whiteSpace:'nowrap',
            boxShadow:isLight?'0 4px 16px rgba(15,23,41,.12)':'0 4px 20px rgba(0,0,0,.4)',
            animation:'nxcSlideIn .4s cubic-bezier(.34,1.4,.64,1) both',cursor:'pointer',
          }} onClick={() => setOpen(true)}>
            👋 Need assistance? I'm here to help.
          </div>
        )}
        <button className="nxc-fab" onClick={() => setOpen(v => !v)}>
          {pulse && <span className="nxc-ring" />}
          <span className="nxc-online-dot" />
          {unread > 0 && !open && <span className="nxc-badge">{unread > 9 ? '9+' : unread}</span>}
          {open ? <XIcon /> : <BotIcon />}
        </button>
      </div>

      <div className={`nxc-win ${open ? 'open' : 'closed'}`} role="dialog" aria-label="Nextest AI Assistant" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="nxc-hdr">
          <div className="nxc-hdr-av"><BotIcon /></div>
          <div className="nxc-hdr-info">
            <div className="nxc-hdr-title">Nextest AI ✦</div>
            <div className="nxc-hdr-sub">
              <span className="nxc-hdr-dot" />
              {headerSub[uiLang] || headerSub.en}
            </div>
          </div>
          <button className="nxc-xbtn" onClick={() => setOpen(false)} aria-label="Close"><XIcon /></button>
        </div>

        <div className="nxc-msgs" role="log" aria-live="polite">
          {messages.map(msg => (
            <div key={msg.id} className={`nxc-row ${msg.from}`}>
              <div className={`nxc-av ${msg.from}`}>
                {msg.from === 'bot' ? <BotIcon /> : <span style={{ color: isLight ? '#0f1729' : '#e2e8f0' }}>🧑</span>}
              </div>
              <div>
                <div className={`nxc-bub ${msg.from}`} dangerouslySetInnerHTML={{ __html: renderText(msg.text, isLight) }} />
                <div className="nxc-ts">{fmt(msg.time)}</div>
              </div>
            </div>
          ))}
          {typing && (
            <div className="nxc-row bot">
              <div className="nxc-av bot"><BotIcon /></div>
              <div><div className="nxc-bub bot"><div className="nxc-typing"><span /><span /><span /></div></div></div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {showSugg && (
          <div className="nxc-suggs">
            {currentSuggestions.map(s => (
              <button key={s} className="nxc-sug" onClick={() => sendMessage(s)}>{s}</button>
            ))}
          </div>
        )}

        <div className="nxc-sep" />

        <div className="nxc-inp-area">
          <textarea
            ref={inputRef}
            className="nxc-textarea"
            placeholder={placeholder[uiLang] || placeholder.en}
            value={input}
            rows={1}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            aria-label="Message input"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          <button className="nxc-send-btn" onClick={() => sendMessage()} disabled={!input.trim() || typing} aria-label="Send">
            <SendIcon />
          </button>
        </div>

        <div className="nxc-ftr">Propulsé par <em>Nextest AI</em></div>
      </div>
    </>
  );
}
import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Language Detection ────────────────────────────────────────────────────────
function detectLanguage(text) {
  const frMarkers = [
    /\b(qu[' ]est|c[' ]est|comment|pourquoi|quand|quel|quelle|où|bonjour|salut|merci|aide|lancer|générer|télécharger|résultats|historique|paramètres|projet|je|veux|mon|mes|une|des|les|est|avoir|faire|peux|peut|donne|dis)\b/i,
    /[àâäéèêëîïôùûüç]/,
  ];
  return frMarkers.some(r => r.test(text)) ? 'fr' : 'en';
}

// ─── Knowledge Base (Bilingual) ───────────────────────────────────────────────
const KB = [
  {
    tags: ['smoke', 'smoke test', 'smoke testing'],
    fr: '**Smoke Test** vérifie que les fonctionnalités principales sont dans le DOM. C\'est le plus rapide (~30s). Dans Nextest, choisissez **Smoke** à l\'étape 02 de la génération.',
    en: '**Smoke Test** checks that the core functionalities are present in the DOM. It\'s the fastest option (~30s). In Nextest, choose **Smoke** at step 02 of the generation wizard.',
  },
  {
    tags: ['run', 'launch', 'execute', 'generate', 'lancer', 'exécuter', 'générer', 'démarrer', 'start', 'create test'],
    fr: 'Pour générer des tests :\n1. **Projects** → sélectionnez un projet\n2. Ajoutez une page (URL cible)\n3. Cliquez **Generate** sur la page\n4. Choisissez type de test + framework\n5. Cliquez **Generate Tests ▶**\n\nRésultats dans **Test Execution**.',
    en: 'To generate tests:\n1. **Projects** → select a project\n2. Add a page (target URL)\n3. Click **Generate** on the page row\n4. Choose test type + framework\n5. Click **Generate Tests ▶**\n\nResults appear in **Test Execution**.',
  },
  {
    tags: ['url', 'endpoint', 'page', 'link', 'tester une url', 'test a url', 'add page', 'ajouter une page'],
    fr: 'Pour tester une URL :\n1. **Projects → votre projet → Add Page**\n2. Entrez l\'URL (`https://monsite.com/login`)\n3. Cliquez **Generate** sur la ligne\n4. Remplissez le formulaire et lancez',
    en: 'To test a URL:\n1. **Projects → your project → Add Page**\n2. Enter the URL (`https://mysite.com/login`)\n3. Click **Generate** on that row\n4. Fill in the form and run',
  },
  {
    tags: ['result', 'results', 'résultat', 'résultats', 'explain', 'expliquer', 'execution', 'assertion', 'pass', 'fail'],
    fr: 'Dans **Test Execution** :\n✅ **Pass** — assertion réussie\n❌ **Fail** — assertion échouée\n⚠️ **Skip** — non exécuté\n\nCliquez le badge **ASSERTION** pour voir Expected vs Actual. Exportez via **Download Report**.',
    en: 'In **Test Execution**:\n✅ **Pass** — assertion succeeded\n❌ **Fail** — assertion failed\n⚠️ **Skip** — not executed\n\nClick the **ASSERTION** badge to see Expected vs Actual. Export via **Download Report**.',
  },
  {
    tags: ['regression', 'régression', 'regression test', 'breaking change'],
    fr: '**Regression Test** — vérifie que les nouvelles modifs n\'ont pas cassé l\'existant. Disponible pour les projets **Internal**. Durée ~3min.',
    en: '**Regression Test** — verifies that new changes haven\'t broken existing features. Available for **Internal** projects. Duration ~3min.',
  },
  {
    tags: ['functional', 'fonctionnel', 'functional test', 'interaction', 'click', 'form'],
    fr: '**Functional Test** — simule des interactions réelles (clics, formulaires, assertions). Durée ~1min. Idéal pour tester les comportements utilisateur.',
    en: '**Functional Test** — simulates real interactions (clicks, forms, assertions). Duration ~1min. Ideal for testing user behaviors.',
  },
  {
    tags: ['performance', 'speed', 'vitesse', 'chargement', 'load', 'loading time'],
    fr: '**Performance Test** — mesure le temps de chargement et les réponses. Durée ~2min. Idéal avant chaque déploiement.',
    en: '**Performance Test** — measures load times and response speeds. Duration ~2min. Ideal before every deployment.',
  },
  {
    tags: ['selenium', 'python', '.py'],
    fr: '**Selenium** génère des scripts Python (`.py`). Le plus compatible tous navigateurs. Recommandé pour les projets **Public**.',
    en: '**Selenium** generates Python scripts (`.py`). The most cross-browser compatible framework. Recommended for **Public** projects.',
  },
  {
    tags: ['cypress vs playwright', 'playwright vs cypress', 'cypress playwright'],
    fr: '**Cypress vs Playwright :**\n\n🟡 **Cypress** → JavaScript `.js` · UI de debug intégrée · Idéal E2E moderne · Projets **Public**\n\n🔵 **Playwright** → Python `.py` · Chromium, Firefox, WebKit · Multi-navigateurs · Projets **Internal**\n\n💡 **Conseil :** Cypress si tu veux du JS, Playwright si tu veux du Python multi-browser.',
    en: '**Cypress vs Playwright:**\n\n🟡 **Cypress** → JavaScript `.js` · Built-in debug UI · Best for modern E2E · **Public** projects\n\n🔵 **Playwright** → Python `.py` · Chromium, Firefox, WebKit · Multi-browser · **Internal** projects\n\n💡 **Tip:** Cypress if you want JS, Playwright if you want Python multi-browser.',
  },
  {
    tags: ['cypress vs selenium', 'selenium vs cypress', 'cypress selenium'],
    fr: '**Cypress vs Selenium :**\n\n🟡 **Cypress** → JavaScript `.js` · Plus moderne · UI de debug · Projets **Public**\n\n🟢 **Selenium** → Python `.py` · Plus compatible tous navigateurs · Projets **Public**\n\n💡 **Conseil :** Cypress pour les apps modernes, Selenium pour la compatibilité maximale.',
    en: '**Cypress vs Selenium:**\n\n🟡 **Cypress** → JavaScript `.js` · More modern · Debug UI · **Public** projects\n\n🟢 **Selenium** → Python `.py` · Most browser compatible · **Public** projects\n\n💡 **Tip:** Cypress for modern apps, Selenium for maximum compatibility.',
  },
  {
    tags: ['playwright vs selenium', 'selenium vs playwright', 'playwright selenium'],
    fr: '**Playwright vs Selenium :**\n\n🔵 **Playwright** → Python `.py` · Multi-browser moderne · Projets **Internal**\n\n🟢 **Selenium** → Python `.py` · Compatible tous navigateurs · Projets **Public**\n\n💡 **Conseil :** Playwright pour APIs/microservices, Selenium pour apps web publiques.',
    en: '**Playwright vs Selenium:**\n\n🔵 **Playwright** → Python `.py` · Modern multi-browser · **Internal** projects\n\n🟢 **Selenium** → Python `.py` · All browsers compatible · **Public** projects\n\n💡 **Tip:** Playwright for APIs/microservices, Selenium for public web apps.',
  },
  {
    tags: ['compare all', 'tous les frameworks', 'all frameworks', 'quel framework', 'which framework', 'cypress playwright selenium'],
    fr: '**Cypress vs Playwright vs Selenium :**\n\n🟡 **Cypress** → JS · E2E moderne · Public\n🔵 **Playwright** → Python · Multi-browser · Internal\n🟢 **Selenium** → Python · Compatible max · Public\n⚡ **Both** → génère les 3 en même temps',
    en: '**Cypress vs Playwright vs Selenium:**\n\n🟡 **Cypress** → JS · Modern E2E · Public\n🔵 **Playwright** → Python · Multi-browser · Internal\n🟢 **Selenium** → Python · Max compatible · Public\n⚡ **Both** → generates all 3 at once',
  },
  {
    tags: ['playwright', 'chromium', 'firefox', 'webkit', 'cross browser'],
    fr: '**Playwright** génère des scripts Python (`.py`). Supporte Chromium, Firefox, WebKit. Recommandé pour les projets **Internal**.',
    en: '**Playwright** generates Python scripts (`.py`). Supports Chromium, Firefox, and WebKit. Recommended for **Internal** projects.',
  },
  {
    tags: ['project', 'projet', 'public', 'internal', 'new project', 'nouveau projet', 'type'],
    fr: '2 types de projets :\n🌐 **Public** — apps web, landing pages, interfaces\n🔒 **Internal** — APIs, microservices, infra privée\n\n**Projects → New Project** pour commencer.',
    en: '2 project types:\n🌐 **Public** — web apps, landing pages, interfaces\n🔒 **Internal** — APIs, microservices, private infrastructure\n\n**Projects → New Project** to get started.',
  },
  {
    tags: ['history', 'historique', 'past', 'previous', 'log', 'logs'],
    fr: 'L\'**Historique** liste toutes vos générations. Filtrez par framework, triez par date/pass rate, cliquez une ligne pour les détails.',
    en: '**History** lists all your past generations. Filter by framework, sort by date/pass rate, click a row for details.',
  },
  {
    tags: ['download', 'télécharger', 'pdf', 'csv', 'html', 'rapport', 'report', 'export'],
    fr: 'Dans **Execution → Download Report** :\n📊 **CSV** — données brutes\n🌐 **HTML** — rapport visuel\n📄 **PDF** — rapport complet',
    en: 'In **Execution → Download Report**:\n📊 **CSV** — raw data\n🌐 **HTML** — visual report\n📄 **PDF** — full report',
  },
  {
    tags: ['theme', 'dark', 'light', 'mode', 'thème', 'appearance', 'apparence'],
    fr: 'Changez le thème via le **bouton lune/soleil** dans le header, ou via **Settings → Appearance**.',
    en: 'Change the theme via the **moon/sun button** in the header, or go to **Settings → Appearance**.',
  },
  {
    tags: ['settings', 'paramètres', 'langue', 'language', 'notification', 'preferences'],
    fr: 'Dans **Settings** :\n• Notifications email / rapport hebdo\n• Framework par défaut\n• Thème (Dark / Light / System)\n• Langue (English, Français, العربية)',
    en: 'In **Settings**:\n• Email notifications / weekly report\n• Default framework\n• Theme (Dark / Light / System)\n• Language (English, Français, العربية)',
  },
  {
    tags: ['hello', 'bonjour', 'salut', 'hi', 'hey', 'help', 'aide', 'start', 'commencer'],
    fr: 'Bonjour ! 👋 Je suis **Nextest AI** — je peux répondre à n\'importe quelle question, sur Nextest ou autre chose. Posez-moi n\'importe quoi !',
    en: 'Hello! 👋 I\'m the **Nextest AI** assistant. I can answer any question — about Nextest or anything else!\n\nWhat would you like to know?',
  },
];

// ─── Smart KB Matching ─────────────────────────────────────────────────────────
function tokenize(text) {
  return text.toLowerCase().replace(/['']/g, "'").split(/[\s,?!.;:()[\]{}]+/).filter(Boolean);
}

function scoreEntry(entry, tokens) {
  let score = 0;
  const joined = tokens.join(' ');
  for (const tag of entry.tags) {
    const tagTokens = tokenize(tag);
    if (joined.includes(tag.toLowerCase())) {
      score += tagTokens.length * 3;
    } else {
      for (const tt of tagTokens) {
        if (tokens.some(t => t === tt || t.startsWith(tt) || tt.startsWith(t))) score += 1;
      }
    }
  }
  return score;
}

function findKBAnswer(input, lang) {
  const tokens = tokenize(input);
  let best = null, bestScore = 0;
  for (const entry of KB) {
    const s = scoreEntry(entry, tokens);
    if (s > bestScore) { bestScore = s; best = entry; }
  }
  if (best && bestScore >= 2) return best[lang] || best.fr;
  return null;
}

// ─── Groq API via FastAPI ──────────────────────────────────────────────────────
async function askNexTest(message, lang, conversationHistory) {
  const response = await fetch('http://127.0.0.1:8001/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      lang,
      history: conversationHistory,
    }),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.reply;
}

// ─── Main getBotResponse (KB first → Groq fallback) ───────────────────────────
async function getBotResponse(message, lang, conversationHistory) {
  const kbAnswer = findKBAnswer(message, lang);
  if (kbAnswer) {
    await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
    return { text: kbAnswer, source: 'kb' };
  }
  const text = await askNexTest(message, lang, conversationHistory);
  return { text, source: 'ai' };
}

// ─── Markdown Renderer ────────────────────────────────────────────────────────
function renderText(text, isLight) {
  const codeColor = isLight ? '#4338ca' : '#a5b4fc';
  const codeBg    = isLight ? 'rgba(99,102,241,.1)' : 'rgba(99,102,241,.15)';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, `<code style="font-family:monospace;font-size:11px;background:${codeBg};color:${codeColor};padding:1px 5px;border-radius:4px">$1</code>`)
    .replace(/\\n/g, '<br/>')
    .replace(/\n/g, '<br/>');
}

// ─── Dynamic Suggestions ──────────────────────────────────────────────────────
const SUGGESTIONS = {
  fr: ["C'est quoi un smoke test ?", 'Comment générer des tests ?', 'Cypress vs Playwright ?', 'Expliquer les résultats'],
  en: ['What is a smoke test?', 'How to run tests?', 'Cypress vs Playwright?', 'Explain test results'],
};

// ─── Icons ────────────────────────────────────────────────────────────────────
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NextestChatbot({ theme = 'dark' }) {
  const isLight = theme === 'light';
   // Force re-render when theme changes
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    forceUpdate(v => v + 1);
  }, [theme]);

  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([{
    id: 1, from: 'bot', lang: 'fr', source: 'kb',
    text: 'Bonjour ! 👋 Je suis **Nextest AI** — je peux répondre à n\'importe quelle question, sur Nextest ou n\'importe quel autre sujet. Demandez-moi tout !',
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

  const buildHistory = useCallback(() => {
    return messages
      .filter(m => m.from === 'user' || (m.from === 'bot' && m.source === 'ai'))
      .map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
  }, [messages]);

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
      const history = buildHistory();
      const { text: answer, source } = await getBotResponse(q, lang, history);
      setMessages(m => [...m, { id: Date.now() + 1, from: 'bot', lang, source, text: answer, time: new Date() }]);
    } catch {
      const errMsg = lang === 'fr'
        ? 'Une erreur est survenue. Vérifiez votre connexion et réessayez.'
        : 'An error occurred. Check your connection and try again.';
      setMessages(m => [...m, { id: Date.now() + 1, from: 'bot', lang, source: 'error', text: errMsg, time: new Date() }]);
    } finally {
      setTyping(false);
      if (!open) setUnread(u => u + 1);
    }
  }, [input, typing, open, buildHistory]);

  const fmt = d => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const currentSuggestions = SUGGESTIONS[uiLang] || SUGGESTIONS.fr;

  return (
    <>
    <style key={theme}>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        .nxc-fab-wrap { position:fixed;bottom:28px;right:28px;z-index:10000; }
        .nxc-fab {
          width:56px;height:56px;border-radius:50%;
          background:#4f46e5;
          border:3px solid #6366f1;
          cursor:pointer;color:#fff;
          display:flex;align-items:center;justify-content:center;
          box-shadow:
            0 4px 6px rgba(0,0,0,.25),
            0 10px 30px rgba(79,70,229,.8),
            0 0 0 4px rgba(99,102,241,.25);
          transition:transform .22s cubic-bezier(.34,1.56,.64,1),box-shadow .2s;
          font-family:'DM Sans',sans-serif;position:relative;
        }
        .nxc-fab:hover {
          transform:scale(1.08);
          box-shadow:0 6px 10px rgba(0,0,0,.3),0 16px 40px rgba(79,70,229,.9),0 0 0 6px rgba(99,102,241,.2);
        }
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

        .nxc-ring {
          position:absolute;inset:-5px;border-radius:50%;
          border:2px solid rgba(99,102,241,.4);
          animation:nxcRing 2.4s ease-out 3;
        }
        @keyframes nxcRing{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.65);opacity:0}}

        .nxc-online-dot {
          position:absolute;bottom:2px;right:2px;width:12px;height:12px;border-radius:50%;
          background:#10b981;border:2.5px solid #4f46e5;
          box-shadow:0 0 0 1.5px #fff,0 0 8px rgba(16,185,129,.7);
        }
        .nxc-badge {
          position:absolute;top:-3px;right:-3px;width:18px;height:18px;border-radius:50%;
          background:#ef4444;border:2px solid ${isLight ? '#f4f6fb' : '#040914'};
          color:#fff;font-size:9px;font-weight:800;
          display:flex;align-items:center;justify-content:center;
          animation:nxcPop .35s cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes nxcPop{from{transform:scale(0)}to{transform:scale(1)}}

        /* ── Chat window ── */
        .nxc-win {
          position:fixed;bottom:96px;right:28px;z-index:9999;
          width:372px;max-height:calc(100vh - 130px);
          background:${isLight ? '#ffffff' : '#0d1526'};
          border:1px solid ${isLight ? 'rgba(99,102,241,.2)' : 'rgba(99,102,241,.22)'};
          border-radius:20px;
          box-shadow:${isLight
            ? '0 28px 80px rgba(15,23,41,.18),0 0 0 1px rgba(99,102,241,.1)'
            : '0 28px 80px rgba(0,0,0,.7),0 0 0 1px rgba(99,102,241,.1),0 0 60px rgba(99,102,241,.05)'};
          display:flex;flex-direction:column;overflow:hidden;
          transform-origin:bottom right;font-family:'DM Sans',sans-serif;
          transition:transform .35s cubic-bezier(.34,1.4,.64,1),opacity .25s ease,filter .25s ease;
        }
        .nxc-win.closed { transform:scale(.55) translateY(36px);opacity:0;pointer-events:none;filter:blur(4px) }
        .nxc-win.open   { transform:scale(1) translateY(0);opacity:1;filter:blur(0) }

        /* ── Header ── */
        .nxc-hdr {
          padding:13px 15px;
          background:${isLight ? '#f4f6fb' : '#040914'};
          border-bottom:1px solid ${isLight ? 'rgba(99,102,241,.14)' : 'rgba(99,102,241,.1)'};
          display:flex;align-items:center;gap:10px;flex-shrink:0;
        }
        .nxc-hdr-av {
          width:33px;height:33px;border-radius:9px;flex-shrink:0;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          display:flex;align-items:center;justify-content:center;color:#fff;
          box-shadow:0 4px 12px rgba(99,102,241,.4);
        }
        .nxc-hdr-info { flex:1 }
        .nxc-hdr-title { color:${isLight ? '#0f1729' : '#e2e8f0'};font-size:13px;font-weight:700;letter-spacing:-.01em }
        .nxc-hdr-sub { color:${isLight ? 'rgba(75,86,117,.6)' : 'rgba(148,163,184,.55)'};font-size:10px;margin-top:2px;display:flex;align-items:center;gap:5px; }
        .nxc-hdr-dot {
          width:5px;height:5px;border-radius:50%;background:#10b981;
          box-shadow:0 0 6px rgba(16,185,129,.6);animation:nxcBlink 2s ease-in-out infinite;
        }
        @keyframes nxcBlink{0%,100%{opacity:1}50%{opacity:.25}}
        .nxc-xbtn {
          width:25px;height:25px;border-radius:7px;flex-shrink:0;
          border:1px solid ${isLight ? 'rgba(99,102,241,.18)' : 'rgba(99,102,241,.1)'};
          background:${isLight ? 'rgba(99,102,241,.07)' : 'rgba(255,255,255,.04)'};
          color:${isLight ? 'rgba(75,86,117,.65)' : 'rgba(148,163,184,.55)'};
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;transition:background .15s,color .15s,border-color .15s;
        }
        .nxc-xbtn:hover { background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.25);color:#ef4444 }

        /* ── Messages ── */
        .nxc-msgs {
          flex:1;overflow-y:auto;padding:13px;display:flex;flex-direction:column;gap:11px;
          scroll-behavior:smooth;min-height:180px;max-height:320px;
          background:${isLight ? '#f0f4ff' : '#070e1c'};
        }
        .nxc-msgs::-webkit-scrollbar{width:3px}
        .nxc-msgs::-webkit-scrollbar-thumb{background:${isLight ? 'rgba(99,102,241,.22)' : 'rgba(99,102,241,.15)'};border-radius:3px}

        .nxc-row { display:flex;gap:7px;align-items:flex-end;animation:nxcSlideIn .28s cubic-bezier(.34,1.4,.64,1) both }
        .nxc-row.user { flex-direction:row-reverse }
        @keyframes nxcSlideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

        .nxc-av { width:24px;height:24px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px; }
        .nxc-av.bot { background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff }
        .nxc-av.user {
          background:${isLight ? 'rgba(99,102,241,.09)' : 'rgba(255,255,255,.04)'};
          border:1px solid ${isLight ? 'rgba(99,102,241,.18)' : 'rgba(99,102,241,.1)'};
        }

        /* ── Bubbles ── */
        .nxc-bub {
          max-width:82%;padding:9px 12px;border-radius:13px;
          font-size:12px;line-height:1.65;
          white-space:normal;
          color:${isLight ? '#0f1729' : '#e2e8f0'};
        }
        .nxc-bub br { display:block;content:'';margin:5px 0; }
        .nxc-bub.bot {
          background:${isLight ? '#ffffff' : 'rgba(255,255,255,.04)'};
          border:1px solid ${isLight ? 'rgba(99,102,241,.15)' : 'rgba(99,102,241,.1)'};
          border-bottom-left-radius:3px;
          box-shadow:${isLight ? '0 1px 4px rgba(15,23,41,.08)' : 'none'};
          color:${isLight ? '#0f1729' : '#e2e8f0'};
        }
        .nxc-bub.user {
          background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;
          border-bottom-right-radius:3px;box-shadow:0 4px 14px rgba(99,102,241,.35);
        }
        .nxc-bub strong { color:${isLight ? '#4338ca' : '#a5b4fc'};font-weight:700 }
        .nxc-bub.user strong { color:#e0d9ff }

        .nxc-ts {
          font-size:9px;color:${isLight ? 'rgba(75,86,117,.45)' : 'rgba(148,163,184,.3)'};margin-top:3px;
          padding:0 1px;display:flex;align-items:center;gap:4px;
        }
        .nxc-row.user .nxc-ts { justify-content:flex-end }
        .nxc-ai-badge {
          display:inline-flex;align-items:center;gap:3px;
          font-size:8.5px;font-weight:700;letter-spacing:.04em;
          color:#a5b4fc;
          background:${isLight ? 'rgba(99,102,241,.1)' : 'rgba(99,102,241,.12)'};
          border:1px solid rgba(99,102,241,.2);border-radius:4px;padding:1px 5px;
        }

        /* ── Typing ── */
        .nxc-typing { display:flex;gap:4px;align-items:center;padding:7px 11px }
        .nxc-typing span {
          width:5px;height:5px;border-radius:50%;
          background:${isLight ? '#6366f1' : '#6366f1'};
          animation:nxcTyp 1.2s ease-in-out infinite;
        }
        .nxc-typing span:nth-child(2){animation-delay:.2s}
        .nxc-typing span:nth-child(3){animation-delay:.4s}
        @keyframes nxcTyp{0%,60%,100%{transform:translateY(0);opacity:.3}30%{transform:translateY(-5px);opacity:1}}

        /* ── Suggestions ── */
        .nxc-suggs {
          padding:0 12px 10px;display:flex;flex-wrap:wrap;gap:5px;flex-shrink:0;
          background:${isLight ? '#f4f6fb' : '#070e1c'};
          animation:nxcFadeIn .3s ease both;
        }
        @keyframes nxcFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        .nxc-sug {
          font-size:10.5px;font-weight:600;padding:4px 10px;border-radius:20px;
          border:1px solid ${isLight ? 'rgba(99,102,241,.22)' : 'rgba(99,102,241,.22)'};
          background:${isLight ? 'rgba(99,102,241,.08)' : 'rgba(99,102,241,.08)'};
          color:${isLight ? '#4338ca' : '#a5b4fc'};
          cursor:pointer;transition:all .15s;white-space:nowrap;font-family:'DM Sans',sans-serif;
        }
        .nxc-sug:hover { background:rgba(99,102,241,.16);transform:translateY(-1px);box-shadow:0 4px 12px rgba(99,102,241,.2) }
        .nxc-sug:active { transform:scale(.95) }

        /* ── Separator ── */
        .nxc-sep { height:1px;background:${isLight ? 'rgba(99,102,241,.12)' : 'rgba(99,102,241,.1)'};flex-shrink:0 }

        /* ── Input area ── */
        .nxc-inp-area {
          padding:9px 11px 11px;display:flex;gap:7px;align-items:flex-end;flex-shrink:0;
          background:${isLight ? '#f4f6fb' : '#040914'};
        }
        .nxc-textarea {
          flex:1;
          background:${isLight ? '#ffffff' : 'rgba(255,255,255,.04)'};
          border:1.5px solid ${isLight ? 'rgba(99,102,241,.2)' : 'rgba(255,255,255,.05)'};
          border-radius:10px;padding:8px 11px;
          color:${isLight ? '#0f1729' : '#e2e8f0'};
          font-size:12px;font-family:'DM Sans',sans-serif;
          outline:none;resize:none;line-height:1.5;min-height:36px;max-height:86px;
          transition:border-color .15s,box-shadow .15s;
        }
        .nxc-textarea::placeholder { color:${isLight ? 'rgba(75,86,117,.45)' : 'rgba(148,163,184,.3)'} }
        .nxc-textarea:focus {
          border-color:rgba(99,102,241,.4);
          box-shadow:0 0 0 3px rgba(99,102,241,.1);
          background:${isLight ? '#ffffff' : '#0d1526'};
        }
        .nxc-send-btn {
          width:36px;height:36px;border-radius:9px;flex-shrink:0;
          background:linear-gradient(135deg,#6366f1,#4f46e5);
          border:none;cursor:pointer;color:#fff;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 14px rgba(99,102,241,.4);
          transition:transform .15s,opacity .15s,box-shadow .15s;
        }
        .nxc-send-btn:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,.55) }
        .nxc-send-btn:active { transform:scale(.91) }
        .nxc-send-btn:disabled { opacity:.32;cursor:not-allowed;transform:none }

        /* ── Footer ── */
        .nxc-ftr {
          text-align:center;padding:0 0 9px;font-size:9px;letter-spacing:.05em;
          color:${isLight ? 'rgba(75,86,117,.4)' : 'rgba(148,163,184,.3)'};flex-shrink:0;
          background:${isLight ? '#f4f6fb' : '#040914'};
        }
        .nxc-ftr em { color:${isLight ? '#6366f1' : '#a5b4fc'};font-style:normal;font-weight:600 }

        @media (max-width: 480px) {
          .nxc-win { width:calc(100vw - 20px);right:10px;bottom:82px;border-radius:16px;max-height:calc(100vh - 110px) }
          .nxc-fab-wrap { bottom:18px;right:16px }
          .nxc-tooltip { display:none }
          .nxc-msgs { max-height:calc(100vh - 320px) }
        }
      `}</style>

      {/* ── FAB ── */}
      <div className="nxc-fab-wrap">
        <div className="nxc-tooltip">
          {uiLang === 'fr' ? 'Demandez à Nextest AI' : 'Ask Nextest AI'}
        </div>
        <button className="nxc-fab" onClick={() => setOpen(v => !v)}>
          {pulse && <span className="nxc-ring" />}
          <span className="nxc-online-dot" />
          {unread > 0 && !open && <span className="nxc-badge">{unread > 9 ? '9+' : unread}</span>}
          {open ? <XIcon /> : <BotIcon />}
        </button>
      </div>

      {/* ── Chat window ── */}
      <div className={`nxc-win ${open ? 'open' : 'closed'}`} role="dialog" aria-label="Nextest AI Assistant">

        {/* Header */}
        <div className="nxc-hdr">
          <div className="nxc-hdr-av"><BotIcon /></div>
          <div className="nxc-hdr-info">
            <div className="nxc-hdr-title">Nextest AI ✦</div>
            <div className="nxc-hdr-sub">
              <span className="nxc-hdr-dot" />
              {uiLang === 'fr' ? 'Répond à tout · Instantané' : 'Answers everything · Instant'}
            </div>
          </div>
          <button className="nxc-xbtn" onClick={() => setOpen(false)} aria-label="Close">
            <XIcon />
          </button>
        </div>

        {/* Messages */}
        <div className="nxc-msgs" role="log" aria-live="polite">
          {messages.map(msg => (
            <div key={msg.id} className={`nxc-row ${msg.from}`}>
              <div className={`nxc-av ${msg.from}`}>
                {msg.from === 'bot'
                  ? <BotIcon />
                  : <span style={{ color: isLight ? '#0f1729' : '#e2e8f0' }}>🧑</span>
                }
              </div>
              <div>
                <div
                  className={`nxc-bub ${msg.from}`}
                  dangerouslySetInnerHTML={{ __html: renderText(msg.text, isLight) }}
                />
                <div className="nxc-ts">
                  {fmt(msg.time)}
                  {msg.from === 'bot' && msg.source === 'ai' && (
                    <span className="nxc-ai-badge"><SparkleIcon /> AI</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {typing && (
            <div className="nxc-row bot">
              <div className="nxc-av bot"><BotIcon /></div>
              <div>
                <div className="nxc-bub bot">
                  <div className="nxc-typing"><span /><span /><span /></div>
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Suggestions */}
        {showSugg && (
          <div className="nxc-suggs">
            {currentSuggestions.map(s => (
              <button key={s} className="nxc-sug" onClick={() => sendMessage(s)}>{s}</button>
            ))}
          </div>
        )}

        <div className="nxc-sep" />

        {/* Input */}
        <div className="nxc-inp-area">
          <textarea
            ref={inputRef}
            className="nxc-textarea"
            placeholder={uiLang === 'fr' ? "Posez n'importe quelle question…" : 'Ask anything…'}
            value={input}
            rows={1}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            aria-label="Message input"
          />
          <button
            className="nxc-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || typing}
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </div>

        {/* Footer */}
        <div className="nxc-ftr">Propulsé par <em>Nextest AI</em> · Groq</div>
      </div>
    </>
  );
}
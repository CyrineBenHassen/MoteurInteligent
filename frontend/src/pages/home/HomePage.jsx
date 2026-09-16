import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

//Translations
const TRANSLATIONS = {
  en: {
    features:    'Features',
    howItWorks:  'How it Works',
    stats:       'Stats',
    signIn:      'Sign In',
    getStarted:  'Get Started',
    heroLead: (
  <>
    Provide your web application's URL — NexTest supports both public and
    internal applications, analyzes your interface using AI, generates automated
    test cases across multiple testing types, and exports ready-to-use
    <strong> multi-framework</strong> automation scripts. In seconds.
  </>
),
    startFree:   'Start for free',
    seeHow:      'See how it works',
    trust:       ['No credit card', 'Open-source AI', 'Results in 60s'],
    ctaFree:     'Create a free account',
    ctaSignIn:   'Already have an account? Sign in →',
  },
  fr: {
    features:    'Fonctionnalités',
    howItWorks:  'Comment ça marche',
    stats:       'Statistiques',
    signIn:      'Connexion',
    getStarted:  'Commencer',
    heroLead:    <>Fournissez l'URL de votre application web — le moteur analyse votre interface,
                    génère des cas de test fonctionnels et exporte des scripts
                    <strong> multi-framework</strong> prêts à l'emploi (Selenium, Cypress, Playwright). En quelques secondes.</>,
    startFree:   'Commencer gratuitement',
    seeHow:      'Voir comment ça marche',
    trust:       ['Sans carte bancaire', 'IA open-source', 'Résultats en 60s'],
    ctaFree:     'Créer un compte gratuit',
    ctaSignIn:   'Déjà un compte ? Se connecter →',
  },
  ar: {
    features:    'الميزات',
    howItWorks:  'كيف يعمل',
    stats:       'الإحصائيات',
    signIn:      'تسجيل الدخول',
    getStarted:  'ابدأ الآن',
    heroLead:    <>أدخل رابط تطبيقك — يقوم المحرك بتحليل الواجهة،
                    وتوليد حالات الاختبار، وتصدير سكريبتات
                    <strong> متعددة الأطر</strong> (Selenium, Cypress, Playwright). في ثوانٍ.</>,
    startFree:   'ابدأ مجاناً',
    seeHow:      'اكتشف كيف يعمل',
    trust:       ['بدون بطاقة بنكية', 'ذكاء اصطناعي مفتوح', 'نتائج في 60 ثانية'],
    ctaFree:     'إنشاء حساب مجاني',
    ctaSignIn:   'لديك حساب؟ تسجيل الدخول ←',
  },
};

//Language Switcher (Dropdown)
const LANGS = [
  { code: 'en', flag: '🇬🇧', label: 'EN', full: 'English'  },
  { code: 'fr', flag: '🇫🇷', label: 'FR', full: 'Français' },
  { code: 'ar', flag: '🇹🇳', label: 'AR', full: 'العربية'  },
];

function LangSwitcher({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGS.find(l => l.code === lang);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="lang-dropdown" ref={ref}>
      {/* Trigger button */}
      <button
        className={`lang-trigger ${open ? 'lang-trigger--open' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="lang-trigger__flag">{current.flag}</span>
        <span className="lang-trigger__label">{current.label}</span>
        <svg
          className={`lang-trigger__chevron ${open ? 'lang-trigger__chevron--up' : ''}`}
          width="10" height="10" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="lang-panel" role="listbox">
          {LANGS.map(l => (
            <button
              key={l.code}
              className={`lang-option ${lang === l.code ? 'lang-option--active' : ''}`}
              role="option"
              aria-selected={lang === l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
            >
              <span className="lang-option__flag">{l.flag}</span>
              <span className="lang-option__full">{l.full}</span>
              <span className="lang-option__code">{l.label}</span>
              {lang === l.code && (
                <svg className="lang-option__check" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

//Hooks
function useCounter(target, duration = 2200, started = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!started) return;
    let raf, start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setVal(Math.floor(e * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);
  return val;
}

function useVisible(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

//Data
const FEATURES = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V12h2a2 2 0 0 1 2 2v2h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1v-2a2 2 0 0 1 2-2h2V9.5A4 4 0 0 1 12 2z"/>
        <circle cx="12" cy="6" r="1.5" fill="#a78bfa" stroke="none"/>
      </svg>
    ),
    iconColor: '#a78bfa',   // violet
    tag: 'Generative AI', title: 'AI-Powered Analysis',
    desc: 'Automatically scans application interfaces, detects interactive elements, and prepares intelligent test scenarios.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    iconColor: '#fb923c',   // orange
    tag: 'Speed', title: 'Fast Test Generation',
    desc: 'Generate automated test cases within seconds, including user flows, validations, and edge cases.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
        <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
      </svg>
    ),
    iconColor: '#38bdf8',   // bleu ciel
    tag: 'Export', title: 'Multi-Framework Support',
    desc: 'Export ready-to-use scripts for Selenium, Cypress, and Playwright with seamless CI/CD integration.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    iconColor: '#4ade80',   // vert
    tag: 'Quality', title: 'Comprehensive Testing',
    desc: 'Support multiple testing types including functional, UI, regression, and performance testing.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0 1 14.36-3.36L23 10M1 14l5.13 4.36A9 9 0 0 0 20.49 15"/>
      </svg>
    ),
    iconColor: '#f472b6',   // rose
    tag: 'Reliability', title: 'Smart Adaptation',
    desc: 'Automatically detects interface changes and updates affected test scenarios dynamically.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c9a227" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    iconColor: '#c9a227',   // gold
    tag: 'Reports', title: 'Reports & Insights',
    desc: 'Access smart recommendations, reports, alerts, history, and generated test scripts from a centralized dashboard.',
  },
];

const STEPS = [
  {
    n: '01', color: '#38bdf8',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
    title: 'Provide a URL',
    desc: 'Enter a public or internal web application URL to start the automated testing process.',
  },
  {
    n: '02', color: '#a78bfa',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
    title: 'AI Analyzes the Application',
    desc: 'The system scans the interface, detects interactive elements, pages, and user flows automatically.',
  },
  {
    n: '03', color: '#4ade80',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    title: 'Generate & Execute Automated Tests',
    desc: 'Run different types of automated tests including smoke, functional, regression, UI, and performance testing directly from the dashboard.',
  },
  {
    n: '04', color: '#fb923c',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Smart Recommendations, Reports & Script Generation',
    desc: 'Receive intelligent recommendations, detailed reports, execution history and automatically generated test scripts to improve application quality.',
  },
];

// Component
export default function HomePage() {
  const [navSolid, setNavSolid] = useState(false);
  const [lang,     setLang]     = useState('en');
  const [statsRef, statsOn] = useVisible(0.3);
  const [featRef,  featOn]  = useVisible(0.1);
  const [howRef,   howOn]   = useVisible(0.1);

  const c1 = useCounter(120000, 2400, statsOn);
  const c2 = useCounter(5000,   2000, statsOn);
  const c3 = useCounter(97,     1800, statsOn);
  const c4 = useCounter(80,     1500, statsOn);
  const fmt = v => v >= 1000 ? `${Math.floor(v/1000)}K` : v;

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  useEffect(() => {
    const h = () => setNavSolid(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    return () => { document.documentElement.dir = 'ltr'; };
  }, [isRtl]);

 const NAV_ITEMS = [
  {
    label: t.features,
    id: 'features',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    )
  },
  {
    label: t.howItWorks,
    id: 'howitworks',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M10 8l6 4-6 4V8z" fill="currentColor"/>
      </svg>
    )
  },
  {
    label: t.stats,
    id: 'stats',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    )
  },
];

  return (
    <div className="hp" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ══ NAV ══ */}
      <nav className={`nav ${navSolid ? 'nav--solid' : ''}`}>
        <div className="nav__inner">
         
 <Link to="/" className="nav__brand">
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" width="42" height="42" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="hexGradHome" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8a6a00"/>
          <stop offset="40%" stopColor="#C9A227"/>
          <stop offset="100%" stopColor="#E8C84A"/>
        </linearGradient>
        <filter id="glowHome">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <polygon points="45,8 77,27 77,63 45,82 13,63 13,27"
        fill="rgba(201,162,39,0.08)" stroke="url(#hexGradHome)" strokeWidth="2"/>
      <circle cx="45" cy="8"  r="2.5" fill="#C9A227" opacity="0.8"/>
      <circle cx="77" cy="27" r="2.5" fill="#C9A227" opacity="0.8"/>
      <circle cx="77" cy="63" r="2.5" fill="#C9A227" opacity="0.8"/>
      <circle cx="45" cy="82" r="2.5" fill="#C9A227" opacity="0.8"/>
      <circle cx="13" cy="63" r="2.5" fill="#C9A227" opacity="0.8"/>
      <circle cx="13" cy="27" r="2.5" fill="#C9A227" opacity="0.8"/>
      {/* ← #ffffff → #C9A227 */}
      <text x="45" y="56" textAnchor="middle"
        fontFamily="Georgia, serif" fontSize="36" fontWeight="700"
        fill="#C9A227" filter="url(#glowHome)">N</text>
    </svg>
    <div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 15, fontWeight: 700, color: '#ffffff',
        letterSpacing: '4px', textTransform: 'uppercase', lineHeight: 1,
      }}>NexTest</div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 8.5, fontWeight: 500, color: '#a5b4fc',
        letterSpacing: '3.5px', textTransform: 'uppercase', marginTop: 5,
      }}>Test Automation</div>
    </div>
  </div>
</Link>

          <ul className="nav__links">
  {NAV_ITEMS.map(item => (
    <li key={item.id}>
      <a href={`#${item.id}`}>
        {item.icon}
        {item.label}
      </a>
    </li>
  ))}
</ul>

          <div className="nav__actions">
            {/* ── Dropdown Language Switcher ── */}
            <LangSwitcher lang={lang} setLang={setLang} />

            <Link to="/login"    className="nav__ghost">{t.signIn}</Link>
            <Link to="/register" className="nav__cta"><span>{t.getStarted}</span></Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="hero">
        <div className="hero__bg" aria-hidden="true">
          <div className="blob b1"/><div className="blob b2"/><div className="blob b3"/>
          <div className="ring r1"/><div className="ring r2"/><div className="ring r3"/>
          <div className="dot" style={{top:'12%',left:'6%',animationDelay:'0s'}}/>
          <div className="dot" style={{top:'44%',left:'3.5%',animationDelay:'1.5s',width:'4px',height:'4px',opacity:.2}}/>
          <div className="dot" style={{top:'70%',left:'8%',animationDelay:'2.8s',width:'8px',height:'8px'}}/>
          <div className="dot" style={{top:'20%',right:'5%',animationDelay:'.8s',opacity:.18}}/>
          <div className="dot" style={{bottom:'20%',right:'8%',animationDelay:'2s',width:'4px',height:'4px'}}/>
          <div className="hero__grid"/>
        </div>

        <div className="hero__body">
          <div className="hero__copy">
            <h1 className="hero__h1">
              <span className="h1--plain">Generate</span>
              <span className="h1--italic">Web Tests</span>
              <span className="h1--gold">Automatically</span>
            </h1>

            <p className="hero__lead">{t.heroLead}</p>

            <div className="hero__actions">
              <Link to="/register" className="btn btn--fill">
                {t.startFree}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <a href="#howitworks" className="btn btn--ring">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4V8z" fill="currentColor"/></svg>
                {t.seeHow}
              </a>
            </div>

            <div className="hero__trust">
              {t.trust.map(item => (
                <span key={item} className="trust__item">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c9a227" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="hero__visual">
            <div className="chip chip--tl">
              <span className="chip__dot chip__dot--green"/>
              AI Platform Active
            </div>
            <div className="chip chip--br">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Generated in <b style={{color:'var(--gold)',marginLeft:3}}>2.1s</b>
            </div>

            <div className="score">
              <svg viewBox="0 0 36 36" className="score__ring">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(201,162,39,0.1)" strokeWidth="2.5"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--gold)" strokeWidth="2.5"
                  strokeDasharray="97 100" strokeDashoffset="25" strokeLinecap="round"
                  style={{animation:'scoreDraw 2s cubic-bezier(.22,1,.36,1) .5s both'}}/>
              </svg>
              <span className="score__val">97%</span>
              <span className="score__lbl">Accuracy</span>
            </div>

            <div className="terminal">
              <div className="term__bar">
                <div className="term__dots">
                  <span style={{background:'#ff5f57'}}/><span style={{background:'#febc2e'}}/><span style={{background:'#28c840'}}/>
                </div>
                <span className="term__title">nextest — analyze</span>
                <span className="term__ver">v1.0.0</span>
              </div>
              <div className="term__body">
                <p className="tl"><span className="p">❯</span><span className="cmd"> nextest analyze </span><span className="url">https://myapp.com</span></p>
                <div className="gap"/>
                <p className="tl dim"><span className="ico">◆</span> Connecting to target…</p>
                <p className="tl dim"><span className="ico">◆</span> Scanning DOM — <b>24 elements</b> detected</p>
                <p className="tl dim"><span className="ico">◆</span> Mapping flows &amp; interactive components</p>
                <p className="tl dim"><span className="ico">◆</span> Running generative AI pipeline…</p>
                <div className="gap"/>
                <p className="tl ok"><span className="ico">✓</span> 42 test cases generated <span className="badge-time">2.1s</span></p>
                <p className="tl ok"><span className="ico">✓</span> Selenium · Cypress · Playwright exported</p>
                <div className="gap"/>
                <p className="tl"><span className="cur">▋</span></p>
              </div>
              <div className="term__foot">
                <span className="pill">Selenium</span>
                <span className="pill">Cypress</span>
                <span className="pill">Playwright</span>
                <span className="pill pill--gold">42 tests ready</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero__scroll">
          <div className="scroll__line"/>
          <span className="scroll__lbl">Scroll</span>
        </div>
      </section>

      {/* ══ BAND ══ */}
      <div className="band">
        <div className="band__inner">
          <span className="band__label">Built with</span>
          {['React', 'Laravel', 'FastAPI','Python', 'GROQ', 'LLAMA3', 'PostgreSQL'].map(item => (
            <span key={item} className="band__item">{item}</span>
          ))}
        </div>
      </div>

      {/* ══ FEATURES ══ */}
      <section className="sec features" id="features" ref={featRef}>
        <div className="sec__wrap">
          <div className="sec__head">
            <div className="sec__left">
              <span className="eyebrow">Features</span>
              <h2 className="sec__h2">Everything your<br/><span className="h2__gold">QA team needs</span></h2>
            </div>
            <p className="sec__lead">From URL to full test suite — automated, accurate, zero configuration. No prior QA expertise required.</p>
          </div>

          <div className={`feat__grid ${featOn ? 'is-visible' : ''}`}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feat__card" style={{'--i': i}}>
                <div className="feat__top">
                  <div className="feat__icon">{f.icon}</div>
                  <span className="feat__tag">{f.tag}</span>
                </div>
                <h3 className="feat__title">{f.title}</h3>
                <p className="feat__desc">{f.desc}</p>
                <span className="feat__more">Learn more <em>→</em></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="sec how" id="howitworks" ref={howRef}>
        <div className="how__decor" aria-hidden="true">
          <div className="how__orb how__orb--1"/><div className="how__orb how__orb--2"/>
        </div>
        <div className="sec__wrap">
          <span className="eyebrow eyebrow--c">How It Works</span>
          <h2 className="sec__h2 sec__h2--c">From URL to tests <span className="h2__gold">in 4 steps</span></h2>

          <div className={`how__grid ${howOn ? 'is-visible' : ''}`}>
            {STEPS.map((s, i) => (
  <div key={s.n} className="how__card" style={{'--i': i}}>
    <div className="how__num" style={{color: s.color}}>{s.n}</div>
    <div
      className="how__icon"
      style={{
        background: `${s.color}14`,
        border: `1px solid ${s.color}30`,
        borderRadius: '16px',
        width: '72px', height: '72px',
        margin: '0 auto 22px',
      }}
    >
      {s.icon}
    </div>
    <h3 className="how__title">{s.title}</h3>
    <p className="how__desc">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="how__arrow" aria-hidden="true">
                    <div className="how__line"/><span className="how__arr">›</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="sec stats" id="stats" ref={statsRef}>
        <div className="sec__wrap">
          <span className="eyebrow eyebrow--c">By the numbers</span>
          <h2 className="sec__h2 sec__h2--c">Concrete results</h2>

          <div className="stats__grid">
            {[
  {
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    val: fmt(c1), suf: '+', label: 'Scripts Generated', accent: '#4f86e8',
  },
  {
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    val: fmt(c2), suf: '+', label: 'Apps Analyzed', accent: '#c9a227',
  },
  {
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    val: c3, suf: '%', label: 'Accuracy Rate', accent: '#4ade80',
  },
  {
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    val: c4, suf: '%', label: 'Faster QA Cycles', accent: '#fb923c',
  },
].map((s, i) => (
  <div key={s.label} className="stat__card" style={{ '--accent': s.accent, '--i': i }}>
    <span className="stat__ghost">{s.val}{s.suf}</span>
    <span className="stat__icon" style={{ color: s.accent }}>{s.icon}</span>
    <div className="stat__val">{s.val}<span style={{ color: s.accent }}>{s.suf}</span></div>
    <div className="stat__label">{s.label}</div>
    <div className="stat__bar"><div className="stat__fill" style={{ background: s.accent }}/></div>
  </div>
))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="cta-sec">
        <div className="cta__bg" aria-hidden="true">
          <div className="cta__blob cta__blob--1"/><div className="cta__blob cta__blob--2"/>
          <div className="cta__ring cta__ring--1"/><div className="cta__ring cta__ring--2"/>
          <div className="cta__grid"/>
        </div>
        <div className="cta__body">
          <span className="eyebrow eyebrow--c">Get Started Today</span>
          <h2 className="cta__h2">Stop writing tests.<br/><span className="h2__gold">Start shipping faster.</span></h2>
          <p className="cta__lead">
            Join development teams who have automated their QA process with generative AI.
            Free, no credit card, no complex setup required.
          </p>
          <div className="cta__actions">
            <Link to="/register" className="btn btn--fill btn--lg">
              {t.ctaFree}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link to="/login" className="cta__link">{t.ctaSignIn}</Link>
          </div>
          <div className="cta__trust">
            {[
              {icon:'🔒', text:'Secured user data'},
              {icon:'⚡', text:'99.9% uptime SLA'},
              {icon:'🤖', text:'Open-source AI (LLam3)'},
            ].map(x => (
              <span key={x.text} className="ctrust">{x.icon} {x.text}</span>
            ))}
          </div>
        </div>
      </section>

 {/* ══ FOOTER ══ */}
<footer className="footer">
  <div className="footer__inner">
    <div className="footer__brand">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" width="36" height="36" style={{ flexShrink: 0 }}>
          <defs>
            <linearGradient id="hexGradFooterDB" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8a6a00"/>
              <stop offset="40%" stopColor="#C9A227"/>
              <stop offset="100%" stopColor="#E8C84A"/>
            </linearGradient>
            <filter id="glowFooterDB">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <polygon points="45,8 77,27 77,63 45,82 13,63 13,27"
            fill="rgba(201,162,39,0.08)" stroke="url(#hexGradFooterDB)" strokeWidth="2"/>
          <circle cx="45" cy="8"  r="2.5" fill="#C9A227" opacity="0.7"/>
          <circle cx="77" cy="27" r="2.5" fill="#C9A227" opacity="0.7"/>
          <circle cx="77" cy="63" r="2.5" fill="#C9A227" opacity="0.7"/>
          <circle cx="45" cy="82" r="2.5" fill="#C9A227" opacity="0.7"/>
          <circle cx="13" cy="63" r="2.5" fill="#C9A227" opacity="0.7"/>
          <circle cx="13" cy="27" r="2.5" fill="#C9A227" opacity="0.7"/>
          <text x="45" y="56" textAnchor="middle"
            fontFamily="Georgia, serif" fontSize="36" fontWeight="700"
            fill="#C9A227" filter="url(#glowFooterDB)">N</text>
        </svg>
        <div>
          <div className="nav__name">NexTest</div>
          <div className="nav__sub">Test Automation</div>
        </div>
      </Link>
    </div>
    <p className="footer__copy">© 2025–2026 NexTest · Software Engineering PFE — Cyrine Ben Hassen · Tac-Tic</p>
    <nav className="footer__links">
      {['Privacy', 'Terms', 'Documentation', 'Status'].map(l => (
        <a key={l} href="#">{l}</a>
      ))}
    </nav>
  </div>
</footer>
    </div>
  );
}
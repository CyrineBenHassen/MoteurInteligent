import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../dashboard/LanguageSwitcher';
import api from '../../api/axios';
import './Onboarding.css';

import {
  Code2, Bug, LayoutGrid, User,
  Flame, CheckCircle2, Zap, CircleDot, Leaf, Theater,
  BarChart3, RefreshCw, Shield, RotateCcw,
  Webhook, Search, Bot, Gauge, Send, Globe,
  ArrowLeft, ArrowRight, Check, Rocket
} from 'lucide-react';

const ROLES = [
  {
    id: 'developer',
    icon: <Code2 size={22} strokeWidth={1.8} />,
  },
  {
    id: 'tester',
    icon: <Bug size={22} strokeWidth={1.8} />,
  },
  {
    id: 'lead',
    icon: <LayoutGrid size={22} strokeWidth={1.8} />,
  },
  {
    id: 'other',
    icon: <User size={22} strokeWidth={1.8} />,
  },
];

const INTERESTS = [
  { id: 'smoke',       icon: <Flame size={14} /> },
  { id: 'functional',  icon: <CheckCircle2 size={14} /> },
  { id: 'performance', icon: <Zap size={14} /> },
  { id: 'selenium',    icon: <CircleDot size={14} /> },
  { id: 'cypress',     icon: <Leaf size={14} /> },
  { id: 'playwright',  icon: <Theater size={14} /> },
  { id: 'reports',     icon: <BarChart3 size={14} /> },
  { id: 'ci',          icon: <RefreshCw size={14} /> },
  { id: 'security',    icon: <Shield size={14} /> },
  { id: 'regression',  icon: <RotateCcw size={14} /> },
  { id: 'api',         icon: <Webhook size={14} /> },
  { id: 'seo',         icon: <Search size={14} /> },
  { id: 'automation',  icon: <Bot size={14} /> },
  { id: 'k6',          icon: <Gauge size={14} /> },
  { id: 'requests',    icon: <Globe size={14} /> },
  { id: 'postman',     icon: <Send size={14} /> },
];

const EXP_LEVELS = [
  { id: 'beginner' },
  { id: 'intermediate' },
  { id: 'expert' },
];

function NexLogo() {
  return (
    <div className="ob-logo">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" width="40" height="40" style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id="hexGradOb" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8a6a00"/>
            <stop offset="40%" stopColor="#C9A227"/>
            <stop offset="100%" stopColor="#E8C84A"/>
          </linearGradient>
          <filter id="glowOb">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <polygon points="45,8 77,27 77,63 45,82 13,63 13,27"
          fill="rgba(201,162,39,0.08)" stroke="url(#hexGradOb)" strokeWidth="2"/>
        <circle cx="45" cy="8"  r="2.5" fill="#C9A227" opacity="0.8"/>
        <circle cx="77" cy="27" r="2.5" fill="#C9A227" opacity="0.8"/>
        <circle cx="77" cy="63" r="2.5" fill="#C9A227" opacity="0.8"/>
        <circle cx="45" cy="82" r="2.5" fill="#C9A227" opacity="0.8"/>
        <circle cx="13" cy="63" r="2.5" fill="#C9A227" opacity="0.8"/>
        <circle cx="13" cy="27" r="2.5" fill="#C9A227" opacity="0.8"/>
        <text x="45" y="56" textAnchor="middle"
          fontFamily="Georgia, serif" fontSize="36" fontWeight="700"
          fill="#C9A227" filter="url(#glowOb)">N</text>
      </svg>
      <div>
        <div className="ob-brand-name">NEXTEST</div>
        <div className="ob-brand-sub">TEST AUTOMATION</div>
      </div>
    </div>
  );
}

function StepBar({ step, total }) {
  return (
    <div className="ob-step-bar">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`ob-step-pip${i < step ? ' active' : ''}`} />
      ))}
    </div>
  );
}

function StepRole({ selected, onSelect, onNext, onSkip }) {
  const { t, lang } = useLang();
  
  return (
    <div className="ob-screen">
      <div className="ob-eyebrow">
        {lang === 'ar' ? 'الخطوة 1 من 3' : lang === 'fr' ? 'ÉTAPE 1 SUR 3' : 'STEP 1 OF 3'}
      </div>
      <h1 className="ob-title">{t('whatRole')}</h1>
      <p className="ob-sub">{t('onboardingDesc')}</p>

      <div className="ob-roles">
        {ROLES.map(role => {
          const name = t(`role${role.id.charAt(0).toUpperCase() + role.id.slice(1)}`);
          const desc = t(`role${role.id.charAt(0).toUpperCase() + role.id.slice(1)}Desc`);
          return (
            <button
              key={role.id}
              className={`ob-role-card${selected === role.id ? ' selected' : ''}`}
              onClick={() => onSelect(role.id)}
            >
              <span className="ob-role-icon">{role.icon}</span>
              <span className="ob-role-name">{name}</span>
              <span className="ob-role-desc">{desc}</span>
              {selected === role.id && (
                <span className="ob-role-check">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="ob-actions">
        <button className="ob-skip" onClick={onSkip}>
          {lang === 'ar' ? 'تخطي الآن' : lang === 'fr' ? 'Passer pour le moment' : 'Skip for now'}
        </button>
        <button
          className="ob-btn-next"
          disabled={!selected}
          onClick={onNext}
        >
          {t('next')}
          <ArrowRight size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function StepInterests({ interests, exp, onToggleInterest, onSelectExp, onNext, onBack }) {
  const { t, lang } = useLang();

  const interestLabel = (id) => {
    const map = {
      smoke: lang === 'ar' ? 'اختبار Smoke' : lang === 'fr' ? 'Test de fumée' : 'Smoke testing',
      functional: lang === 'ar' ? 'اختبارات وظيفية' : lang === 'fr' ? 'Tests fonctionnels' : 'Functional tests',
      performance: lang === 'ar' ? 'الأداء' : lang === 'fr' ? 'Performance' : 'Performance',
      selenium: 'Selenium',
      cypress: 'Cypress',
      playwright: 'Playwright',
      reports: lang === 'ar' ? 'التقارير' : lang === 'fr' ? 'Rapports' : 'Reports',
      ci: 'CI/CD',
      security: lang === 'ar' ? 'الأمان' : lang === 'fr' ? 'Sécurité' : 'Security',
      regression: lang === 'ar' ? 'اختبارات التراجع' : lang === 'fr' ? 'Regression' : 'Regression',
      api: 'API Testing',
      seo: 'SEO Testing',
      automation: lang === 'ar' ? 'الأتمتة' : lang === 'fr' ? 'Automatisation' : 'Automation',
      k6: 'k6',
      requests: lang === 'ar' ? 'الطلبات' : lang === 'fr' ? 'Requêtes' : 'Requests',
      postman: 'Postman'
    };
    return map[id] || id;
  };

  const getExpLabel = (id) => {
    return t(`exp${id.charAt(0).toUpperCase() + id.slice(1)}`);
  };

  const getExpDesc = (id) => {
    if (id === 'beginner') return lang === 'ar' ? 'أقل من عام' : lang === 'fr' ? '< 1 an' : '< 1 year';
    if (id === 'intermediate') return lang === 'ar' ? 'من عام إلى 3 أعوام' : lang === 'fr' ? '1–3 ans' : '1–3 years';
    return lang === 'ar' ? 'أكثر من 3 أعوام' : lang === 'fr' ? 'Plus de 3 ans' : '3+ years';
  };

  return (
    <div className="ob-screen">
      <div className="ob-eyebrow">
        {lang === 'ar' ? 'الخطوة 2 من 3' : lang === 'fr' ? 'ÉTAPE 2 SUR 3' : 'STEP 2 OF 3'}
      </div>
      <h1 className="ob-title">{t('whatInterests')}</h1>
      <p className="ob-sub">
        {lang === 'ar' 
          ? 'اختر كل ما ينطبق — سنقوم بضبط تجربتك.' 
          : lang === 'fr' 
          ? 'Sélectionnez tout ce qui s\'applique — nous adapterons votre expérience.' 
          : 'Select everything that applies — we\'ll tune your experience.'}
      </p>

      <div className="ob-interests">
        {INTERESTS.map(item => (
          <button
            key={item.id}
            className={`ob-interest-pill${interests.includes(item.id) ? ' selected' : ''}`}
            onClick={() => onToggleInterest(item.id)}
          >
            <span className="ob-interest-icon">{item.icon}</span>
            {interestLabel(item.id)}
          </button>
        ))}
      </div>

      <div className="ob-exp-label">{t('experienceLevel')}</div>
      <div className="ob-exp-options">
        {EXP_LEVELS.map(lvl => (
          <button
            key={lvl.id}
            className={`ob-exp-btn${exp === lvl.id ? ' selected' : ''}`}
            onClick={() => onSelectExp(lvl.id)}
          >
            <span className="ob-exp-btn-label">{getExpLabel(lvl.id)}</span>
            <span className="ob-exp-btn-desc">{getExpDesc(lvl.id)}</span>
          </button>
        ))}
      </div>

      <div className="ob-actions">
        <button className="ob-btn-back" onClick={onBack}>
          <ArrowLeft size={13} strokeWidth={2.5} />
          {t('previous')}
        </button>
        <button className="ob-btn-next" onClick={onNext}>
          {t('next')}
          <ArrowRight size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function StepReady({ role, interests, exp, onBack, onFinish, loading }) {
  const { t, lang } = useLang();
  
  const getRoleLabel = (id) => {
    return t(`role${id.charAt(0).toUpperCase() + id.slice(1)}`);
  };

  const getExpLabel = (id) => {
    return t(`exp${id.charAt(0).toUpperCase() + id.slice(1)}`);
  };

  const interestLabel = (id) => {
    const map = {
      smoke: lang === 'ar' ? 'Smoke' : lang === 'fr' ? 'Smoke' : 'Smoke testing',
      functional: lang === 'ar' ? 'وظيفية' : lang === 'fr' ? 'Fonctionnel' : 'Functional',
      performance: lang === 'ar' ? 'الأداء' : 'Performance',
      selenium: 'Selenium',
      cypress: 'Cypress',
      playwright: 'Playwright',
      reports: lang === 'ar' ? 'تقارير' : 'Rapports',
      ci: 'CI/CD',
      security: lang === 'ar' ? 'أمان' : lang === 'fr' ? 'Sécurité' : 'Security',
      regression: lang === 'ar' ? 'تراجع' : lang === 'fr' ? 'Régression' : 'Regression',
      api: 'API',
      seo: 'SEO',
      automation: lang === 'ar' ? 'أتمتة' : lang === 'fr' ? 'Automate' : 'Automation',
      k6: 'k6',
      requests: 'Requests',
      postman: 'Postman'
    };
    return map[id] || id;
  };

  return (
    <div className="ob-screen">
      <div className="ob-eyebrow">
        {lang === 'ar' ? 'أنت جاهز تماماً' : lang === 'fr' ? 'VOUS ÊTES PRÊT' : "YOU'RE ALL SET"}
      </div>
      <h1 className="ob-title">
        {lang === 'ar' ? 'مرحباً بك في NexTest!' : lang === 'fr' ? 'Bienvenue sur NexTest !' : 'Welcome to NexTest!'}
      </h1>
      <p className="ob-sub">
        {lang === 'ar' 
          ? 'إليك إعدادك المخصص. يمكنك دائماً تحديثه من الإعدادات.' 
          : lang === 'fr' 
          ? 'Voici votre configuration personnalisée. Vous pouvez toujours la modifier dans les paramètres.' 
          : "Here's your personalized setup. You can always update it in settings."}
      </p>

      <div className="ob-summary">
        <div className="ob-summary-row">
          <span className="ob-summary-label">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            {lang === 'ar' ? 'الدور' : lang === 'fr' ? 'Rôle' : 'Role'}
          </span>
          <span className="ob-summary-val">{role ? getRoleLabel(role) : '—'}</span>
        </div>
        <div className="ob-summary-row">
          <span className="ob-summary-label">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {lang === 'ar' ? 'الاهتمامات' : lang === 'fr' ? 'Intérêts' : 'Interests'}
          </span>
          <span className="ob-summary-val">
            {interests.length > 0
              ? interests.slice(0, 4).map(id => interestLabel(id)).join(', ') + (interests.length > 4 ? ` +${interests.length - 4}` : '')
              : (lang === 'ar' ? 'كل الميزات' : lang === 'fr' ? 'Toutes les fonctionnalités' : 'All features')}
          </span>
        </div>
        <div className="ob-summary-row">
          <span className="ob-summary-label">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            {lang === 'ar' ? 'المستوى' : lang === 'fr' ? 'Niveau' : 'Level'}
          </span>
          <span className="ob-summary-val">{exp ? getExpLabel(exp) : '—'}</span>
        </div>
      </div>

      <div className="ob-ready-note">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        {lang === 'ar' 
          ? 'لوحة التحكم الخاصة بك جاهزة الآن مع توصيات مخصصة.' 
          : lang === 'fr' 
          ? 'Votre tableau de bord est prêt avec des recommandations personnalisées.' 
          : 'Your dashboard is ready with personalized recommendations.'}
      </div>

      <div className="ob-actions">
        <button className="ob-btn-back" onClick={onBack} disabled={loading}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {t('previous')}
        </button>
        <button className="ob-btn-next ob-btn-finish" onClick={onFinish} disabled={loading}>
          {loading ? (
            <><span className="spinner" /> {t('completeProfile')}</>
          ) : (
            <>
              {lang === 'ar' ? 'الذهاب إلى لوحة التحكم' : lang === 'fr' ? 'Aller au tableau de bord' : 'Go to Dashboard'}
              <ArrowRight size={13} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const [step,      setStep]      = useState(1);
  const [role,      setRole]      = useState(null);
  const [interests, setInterests] = useState([]);
  const [exp,       setExp]       = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [animKey,   setAnimKey]   = useState(0);

  const navigate  = useNavigate();
  const { setUser } = useAuth();
  const { lang, setLanguage } = useLang();

  const goTo = (n) => {
    setAnimKey(k => k + 1);
    setStep(n);
  };

  const toggleInterest = (id) =>
    setInterests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const res = await api.post('/onboarding', { role, interests, experience: exp });
      if (res.data?.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('[Onboarding] Save failed:', err);
      setUser(prev => ({ ...prev, onboarding_completed: true }));
    } finally {
      setLoading(false);
      navigate('/dashboard');
    }
  };

  return (
    <div className="ob-root">
      {/* Absolute positioning language switcher */}
      <div style={{ 
        position: 'absolute', 
        top: '24px', 
        [lang === 'ar' ? 'left' : 'right']: '24px', 
        zIndex: 100 
      }}>
        <LanguageSwitcher lang={lang} setLang={setLanguage} />
      </div>

      {/* Ambient background */}
      <div className="ob-bg" aria-hidden="true">
        <div className="ob-blob ob-blob-a" />
        <div className="ob-blob ob-blob-b" />
        <div className="ob-grid" />
      </div>

      <div className="ob-card" key={animKey}>
        <NexLogo />
        <StepBar step={step} total={3} />

        {step === 1 && (
          <StepRole
            selected={role}
            onSelect={setRole}
            onNext={() => goTo(2)}
            onSkip={() => goTo(2)}
          />
        )}
        {step === 2 && (
          <StepInterests
            interests={interests}
            exp={exp}
            onToggleInterest={toggleInterest}
            onSelectExp={setExp}
            onNext={() => goTo(3)}
            onBack={() => goTo(1)}
          />
        )}
        {step === 3 && (
          <StepReady
            role={role}
            interests={interests}
            exp={exp}
            onBack={() => goTo(2)}
            onFinish={handleFinish}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
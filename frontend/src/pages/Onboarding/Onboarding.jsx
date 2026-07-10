import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
    name: 'Developer',
    desc: 'I write code and want to automate my tests',
  },
  {
    id: 'tester',
    icon: <Bug size={22} strokeWidth={1.8} />,
    name: 'QA / Tester',
    desc: 'I focus on quality assurance and test coverage',
  },
  {
    id: 'lead',
    icon: <LayoutGrid size={22} strokeWidth={1.8} />,
    name: 'Tech Lead',
    desc: 'I manage teams and care about overall quality',
  },
  {
    id: 'other',
    icon: <User size={22} strokeWidth={1.8} />,
    name: 'Other',
    desc: 'Student, researcher, or just exploring',
  },
];

const INTERESTS = [
  { id: 'smoke',       label: 'Smoke testing',    icon: <Flame size={14} /> },
  { id: 'functional',  label: 'Functional tests', icon: <CheckCircle2 size={14} /> },
  { id: 'performance', label: 'Performance',      icon: <Zap size={14} /> },
  { id: 'selenium',    label: 'Selenium',         icon: <CircleDot size={14} /> },
  { id: 'cypress',     label: 'Cypress',          icon: <Leaf size={14} /> },
  { id: 'playwright',  label: 'Playwright',       icon: <Theater size={14} /> },
  { id: 'reports',     label: 'Reports',          icon: <BarChart3 size={14} /> },
  { id: 'ci',          label: 'CI/CD',            icon: <RefreshCw size={14} /> },
  { id: 'security',    label: 'Security',         icon: <Shield size={14} /> },
  { id: 'regression',  label: 'Regression',       icon: <RotateCcw size={14} /> },
  // --- nouveaux ---
  { id: 'api',         label: 'API Testing',      icon: <Webhook size={14} /> },
  { id: 'seo',         label: 'SEO Testing',      icon: <Search size={14} /> },
  { id: 'automation',  label: 'Automation',       icon: <Bot size={14} /> },
  { id: 'k6',          label: 'k6',               icon: <Gauge size={14} /> },
  { id: 'requests',    label: 'Requests',         icon: <Globe size={14} /> },
  { id: 'postman',     label: 'Postman',          icon: <Send size={14} /> },
];

const EXP_LEVELS = [
  { id: 'beginner',     label: 'Beginner',      desc: '< 1 year' },
  { id: 'intermediate', label: 'Intermediate',  desc: '1–3 years' },
  { id: 'expert',       label: 'Expert',        desc: '3+ years' },
];

const ROLE_LABELS = {
  developer: 'Developer',
  tester:    'QA / Tester',
  lead:      'Tech Lead',
  other:     'Other',
};



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
  return (
    <div className="ob-screen">
      <div className="ob-eyebrow">STEP 1 OF 3</div>
      <h1 className="ob-title">What's your role?</h1>
      <p className="ob-sub">This helps us personalize your dashboard and recommendations.</p>

      <div className="ob-roles">
        {ROLES.map(role => (
          <button
            key={role.id}
            className={`ob-role-card${selected === role.id ? ' selected' : ''}`}
            onClick={() => onSelect(role.id)}
          >
            <span className="ob-role-icon">{role.icon}</span>
            <span className="ob-role-name">{role.name}</span>
            <span className="ob-role-desc">{role.desc}</span>
            {selected === role.id && (
              <span className="ob-role-check">
                <Check size={11} strokeWidth={3} />
                  
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="ob-actions">
        <button className="ob-skip" onClick={onSkip}>Skip for now</button>
        <button
          className="ob-btn-next"
          disabled={!selected}
          onClick={onNext}
        >
           Continue
          <ArrowRight size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}



function StepInterests({ interests, exp, onToggleInterest, onSelectExp, onNext, onBack }) {
  return (
    <div className="ob-screen">
      <div className="ob-eyebrow">STEP 2 OF 3</div>
      <h1 className="ob-title">What are you here for?</h1>
      <p className="ob-sub">Select everything that applies — we'll tune your experience.</p>

      <div className="ob-interests">
        {INTERESTS.map(item => (
          <button
            key={item.id}
            className={`ob-interest-pill${interests.includes(item.id) ? ' selected' : ''}`}
            onClick={() => onToggleInterest(item.id)}
          >
            <span className="ob-interest-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="ob-exp-label">Your automation experience</div>
      <div className="ob-exp-options">
        {EXP_LEVELS.map(lvl => (
          <button
            key={lvl.id}
            className={`ob-exp-btn${exp === lvl.id ? ' selected' : ''}`}
            onClick={() => onSelectExp(lvl.id)}
          >
            <span className="ob-exp-btn-label">{lvl.label}</span>
            <span className="ob-exp-btn-desc">{lvl.desc}</span>
          </button>
        ))}
      </div>

      <div className="ob-actions">
        <button className="ob-btn-back" onClick={onBack}>
          <ArrowLeft size={13} strokeWidth={2.5} />
          Back
        </button>
        <button className="ob-btn-next" onClick={onNext}>
          Continue
          <ArrowRight size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}



function StepReady({ role, interests, exp, onBack, onFinish, loading }) {
  const expLabel = EXP_LEVELS.find(l => l.id === exp)?.label;

  return (
    <div className="ob-screen">
      <div className="ob-eyebrow">YOU'RE ALL SET</div>
      <h1 className="ob-title">Welcome to NexTest!</h1>
      <p className="ob-sub">Here's your personalized setup. You can always update it in settings.</p>

      <div className="ob-summary">
        <div className="ob-summary-row">
          <span className="ob-summary-label">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            Role
          </span>
          <span className="ob-summary-val">{role ? ROLE_LABELS[role] : '—'}</span>
        </div>
        <div className="ob-summary-row">
          <span className="ob-summary-label">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            Interests
          </span>
          <span className="ob-summary-val">
            {interests.length > 0
              ? interests.slice(0, 4).map(id => INTERESTS.find(i => i.id === id)?.label).join(', ') + (interests.length > 4 ? ` +${interests.length - 4}` : '')
              : 'All features'}
          </span>
        </div>
        <div className="ob-summary-row">
          <span className="ob-summary-label">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Level
          </span>
          <span className="ob-summary-val">{expLabel || '—'}</span>
        </div>
      </div>

      <div className="ob-ready-note">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        Your dashboard is ready with personalized recommendations.
      </div>

      <div className="ob-actions">
        <button className="ob-btn-back" onClick={onBack} disabled={loading}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
        <button className="ob-btn-next ob-btn-finish" onClick={onFinish} disabled={loading}>
          {loading ? (
            <><span className="spinner" /> Saving…</>
          ) : (
            <>
              Go to Dashboard
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
      setUser(res.data.user); // ← met onboarding_completed: true dans le context
    }
  } catch (err) {
    console.error('[Onboarding] Save failed:', err);
    // Force quand même le passage (non-bloquant)
    setUser(prev => ({ ...prev, onboarding_completed: true }));
  } finally {
    setLoading(false);
    navigate('/dashboard');
  }
};

  return (
    <div className="ob-root">
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
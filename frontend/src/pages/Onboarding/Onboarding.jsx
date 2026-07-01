import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './Onboarding.css';



const ROLES = [
  {
    id: 'developer',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    name: 'Developer',
    desc: 'I write code and want to automate my tests',
  },
  {
    id: 'tester',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5m4 0h10m-10 0v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4m0 0H9"/>
      </svg>
    ),
    name: 'QA / Tester',
    desc: 'I focus on quality assurance and test coverage',
  },
  {
    id: 'lead',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    name: 'Tech Lead',
    desc: 'I manage teams and care about overall quality',
  },
  {
    id: 'other',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
    name: 'Other',
    desc: 'Student, researcher, or just exploring',
  },
];

const INTERESTS = [
  { id: 'smoke',      label: 'Smoke testing',   icon: '🔥' },
  { id: 'functional', label: 'Functional tests', icon: '✅' },
  { id: 'performance',label: 'Performance',      icon: '⚡' },
  { id: 'selenium',   label: 'Selenium',         icon: '🟢' },
  { id: 'cypress',    label: 'Cypress',          icon: '🌿' },
  { id: 'playwright', label: 'Playwright',       icon: '🎭' },
  { id: 'reports',    label: 'Reports',          icon: '📊' },
  { id: 'ci',         label: 'CI/CD',            icon: '🔄' },
  { id: 'security',   label: 'Security',         icon: '🛡️' },
  { id: 'regression', label: 'Regression',       icon: '🔁' },
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
      <div className="ob-gem">
        <svg width="20" height="20" viewBox="0 0 44 44" fill="none">
          <circle cx="22" cy="22" r="17" stroke="#060e1e" strokeWidth="2" fill="none" opacity="0.6"/>
          <polyline points="13,22 20,30 32,14" stroke="#060e1e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
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
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
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
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
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
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
        <button className="ob-btn-next" onClick={onNext}>
          Continue
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
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
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
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
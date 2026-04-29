import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import api from '../../api/axios';
import './Dashboard.css';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Hooks & Micro-composants
// ─────────────────────────────────────────────────────────────────────────────

function useCountUp(target, duration = 1200) {
  const ref = useRef(null);
  useEffect(() => {
    const numeric = parseFloat(target);
    const suffix  = String(target).replace(/[\d.]/g, '');
    if (!ref.current || isNaN(numeric)) return;
    let start = null; let raf;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      if (ref.current) ref.current.textContent = Math.round(eased * numeric) + suffix;
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return ref;
}

function AnimatedStat({ val }) {
  const ref = useCountUp(val);
  return <span ref={ref}>{val}</span>;
}

function NexLogo({ collapsed }) {
  return (
    <div className="s-logo">
      <div className="nav__gem">
        <svg width="22" height="22" viewBox="0 0 44 44" fill="none">
          <rect width="44" height="44" rx="11" fill="none"/>
          <polyline points="8,14 22,30 36,14" stroke="#060e1e" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="8" y1="30" x2="36" y2="30" stroke="rgba(6,14,30,0.5)" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>
      {!collapsed && (
        <div className="logo-words">
          <div className="nav__name">NexTest</div>
          <div className="nav__sub">Test Automation</div>
        </div>
      )}
    </div>
  );
}

const IC = {
  dashboard: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  generate:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  execution: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  history:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  account:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  settings:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
};

function SItem({ id, label, badge, active, collapsed, onClick }) {
  return (
    <button className={`s-item${active ? ' active' : ''}`} onClick={() => onClick(id)} title={collapsed ? label : ''}>
      <span className="s-icon">{IC[id]}</span>
      {!collapsed && <span className="s-label-txt">{label}</span>}
      {!collapsed && badge && <span className="s-badge">{badge}</span>}
      {active && <span className="s-active-bar" />}
    </button>
  );
}

function StatusIcon({ s }) {
  if (s === 'pass') return <svg width="15" height="15" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>;
  if (s === 'fail') return <svg width="15" height="15" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>;
  return <svg width="15" height="15" fill="none" stroke="#f59e0b" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>;
}

// ─────────────────────────────────────────────────────────────────────────────
// AssertionBadge — affiche expected vs actual par step
// ─────────────────────────────────────────────────────────────────────────────

function AssertionBadge({ assertion_result, step_meta }) {
  const [open, setOpen] = useState(false);
  if (!assertion_result) return null;

  const { passed, type, expected, actual, error } = assertion_result;
  const color  = passed ? '#10b981' : '#ef4444';
  const bg     = passed ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)';
  const border = passed ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)';
  const icon   = passed ? '✓' : '✗';

  const TYPE_LABELS = {
    url_contains:    '🔗 URL',
    element_visible: '👁 Visible',
    element_exists:  '🔍 Exists',
    text_contains:   '📝 Text',
    input_value:     '⌨ Input',
  };

  return (
    <div style={{ marginTop: 6 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
          background: bg, border: `1px solid ${border}`,
          fontSize: 10, fontWeight: 700, color, userSelect: 'none',
          transition: 'all .15s',
        }}
      >
        <span>{icon}</span>
        <span>ASSERTION · {TYPE_LABELS[type] || type}</span>
        <span style={{ opacity: .6, fontSize: 9 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{
          marginTop: 6, padding: '10px 12px', borderRadius: 8,
          background: passed ? 'rgba(16,185,129,.04)' : 'rgba(239,68,68,.04)',
          border: `1px solid ${border}`,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {step_meta && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
              <span style={{
                padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                background: 'rgba(79,134,232,.1)', color: '#4f86e8',
                border: '1px solid rgba(79,134,232,.2)',
              }}>{step_meta.action}</span>
              <span style={{
                padding: '2px 8px', borderRadius: 10, fontSize: 10,
                background: 'var(--bg)', color: 'var(--muted)',
                border: '1px solid var(--border)', fontFamily: 'monospace',
                maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{step_meta.selector}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Expected</div>
              <div style={{ padding: '5px 8px', borderRadius: 6, fontSize: 10, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--navy)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {expected || '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: passed ? '#10b981' : '#ef4444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Actual</div>
              <div style={{ padding: '5px 8px', borderRadius: 6, fontSize: 10, background: passed ? 'rgba(16,185,129,.06)' : 'rgba(239,68,68,.06)', border: `1px solid ${border}`, color: passed ? '#059669' : '#dc2626', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {actual || '—'}
              </div>
            </div>
          </div>

          {!passed && error && (
            <div style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)', fontSize: 10, color: '#dc2626' }}>
              ⚠ {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Panel
// ─────────────────────────────────────────────────────────────────────────────

const TOP_URLS = [
  { url: 'https://github.com/login',      framework: 'Selenium', tests: 12, pass: 10, date: '2h ago' },
  { url: 'https://trello.com/login',      framework: 'Cypress',  tests: 8,  pass: 8,  date: '1d ago' },
  { url: 'https://app.slack.com/sign-in', framework: 'Both',     tests: 15, pass: 12, date: '3d ago' },
];

function TopURLsSection({ goTo }) {
  const { t } = useLang();
  return (
    <div className="section-box" style={{ marginBottom: 24 }}>
      <div className="sb-head">
        <span className="sb-title">🔗 {t('topUrls') || 'Top Tested URLs'}</span>
        <span className="sb-action" onClick={() => goTo('history')}>{t('viewAll') || 'View all'}</span>
      </div>
      <div style={{ padding: '8px 0' }}>
        {TOP_URLS.map((item, i) => {
          const rate = Math.round((item.pass / item.tests) * 100);
          const statusColor = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderBottom: i < TOP_URLS.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: 'var(--goldbg)', border: '1px solid rgba(201,162,39,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--gold)' }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.url}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{item.tests} tests · {item.date}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', padding: '3px 10px', borderRadius: 20, background: 'rgba(79,134,232,.1)', color: '#4f86e8', border: '1px solid rgba(79,134,232,.2)', flexShrink: 0 }}>{item.framework}</span>
              <div style={{ width: 80, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>pass rate</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>{rate}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, width: `${rate}%`, background: statusColor, transition: 'width 1s ease' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DashboardPanel({ user, goTo }) {
  const { t } = useLang();
  const STATS = [
    { icon: '🚀', val: '12',  lbl: t('scriptsGenerated'), accent: 'linear-gradient(90deg,#4f86e8,#6fa3ff)' },
    { icon: '🔬', val: '3',   lbl: t('appsAnalyzed'),     accent: 'linear-gradient(90deg,#c9a227,#e8c84a)' },
    { icon: '🎯', val: '82%', lbl: t('avgCoverage'),      accent: 'linear-gradient(90deg,#10b981,#34d399)' },
    { icon: '⚡', val: '2s',  lbl: t('avgGenTime'),       accent: 'linear-gradient(90deg,#f97316,#fb923c)' },
  ];
  const barData = [
    { day: 'Mon', count: 3 }, { day: 'Tue', count: 7 }, { day: 'Wed', count: 2 },
    { day: 'Thu', count: 9 }, { day: 'Fri', count: 5 }, { day: 'Sat', count: 1 }, { day: 'Sun', count: 4 },
  ];
  const donutData = [
    { name: 'Passed',  value: 62, color: '#10b981' },
    { name: 'Failed',  value: 23, color: '#ef4444' },
    { name: 'Skipped', value: 15, color: '#f59e0b' },
  ];
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="panel">
      <div className="p-header">
        <div>
          <h1 className="p-title">{t('welcome')}, <span className="g">{user?.name?.split(' ')[0] || 'User'}</span></h1>
          <p className="p-sub">{t('overview')}</p>
        </div>
        <button className="btn-primary" onClick={() => goTo('generate')}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          {t('newGeneration')}
        </button>
      </div>
      <div className="stats-grid">
        {STATS.map((s, i) => (
          <div className="stat-card" key={s.lbl} style={{ '--i': i }}>
            <div className="stat-card-top">
              <div className="stat-icon-wrap">{s.icon}</div>
            </div>
            <span className="stat-val"><AnimatedStat val={s.val} /></span>
            <span className="stat-lbl">{s.lbl}</span>
            <div className="stat-accent" style={{ background: s.accent }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="section-box">
          <div className="sb-head"><span className="sb-title">{t('generationsPerWeek') || 'Generations this week'}</span></div>
          <div style={{ padding: '12px 8px 8px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={26}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--navy)', fontSize: 12 }} cursor={{ fill: 'rgba(201,162,39,0.07)' }} formatter={(val) => [val, 'Generations']} />
                <Bar dataKey="count" fill="#c9a227" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="section-box">
          <div className="sb-head"><span className="sb-title">{t('testResults') || 'Test Results'}</span></div>
          <div style={{ padding: '12px 8px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" labelLine={false}>
                  {donutData.map((entry, index) => (<Cell key={index} fill={entry.color} stroke="none" />))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--navy)', fontSize: 12 }} formatter={(val, name) => [`${val}%`, name]} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                  <tspan x="50%" dy="-8" fontSize="20" fontWeight="700" fill="#10b981">{Math.round((donutData[0].value / donutTotal) * 100)}%</tspan>
                  <tspan x="50%" dy="18" fontSize="10" fill="var(--muted)">pass rate</tspan>
                </text>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 4 }}>
              {donutData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{d.name} <span style={{ color: 'var(--navy)' }}>{d.value}%</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <TopURLsSection goTo={goTo} />
      <div className="section-box" style={{ marginBottom: 24 }}>
        <div className="sb-head">
          <span className="sb-title">{t('recentActivity')}</span>
          <span className="sb-action" onClick={() => goTo('history')}>{t('viewAll')}</span>
        </div>
        <div className="empty-row">{t('noActivity')}</div>
      </div>
      <div className="quick-start">
        <div className="qs-icon-wrap">
          <svg width="32" height="32" fill="none" stroke="rgba(201,162,39,.8)" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <h3>{t('noGenerations')}</h3>
        <p>{t('noGenerationsDesc')}</p>
        <button className="btn-gold" onClick={() => goTo('generate')}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          {t('generateFirst')}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate Panel — avec test_type + framework
// ─────────────────────────────────────────────────────────────────────────────

function GeneratePanel({ goTo, setGeneration }) {
  const { t } = useLang();
  const [url,      setUrl]      = useState('');
  const [fw,       setFw]       = useState('Selenium');
  const [testType, setTestType] = useState('smoke');
  const [loading,  setLoad]     = useState(false);
  const [error,    setError]    = useState('');
  const [urlValid, setUrlValid] = useState(null);

const TEST_TYPES = [
  {
    key: 'smoke',
    label: 'Smoke Test',
    desc: 'Visibility checks — elements present in DOM',
    letter: 'S',
    letterClass: 'gp4-letter-s',
    badge: 'Quick',
    badgeClass: 'gp-badge-quick',
    time: '~30s',
  },
  {
    key: 'functional',
    label: 'Functional Test',
    desc: 'Interactions — click, fill, submit + assertions',
    letter: 'F',
    letterClass: 'gp4-letter-f',
    badge: 'Medium',
    badgeClass: 'gp-badge-mid',
    time: '~1min',
  },
  {
    key: 'performance',
    label: 'Performance Test',
    desc: 'Performance test scenarios with load time and response time assertions',
    letter: 'P',
    letterClass: 'gp4-letter-r',
    badge: 'Full',
    badgeClass: 'gp-badge-full',
    time: '~2min',
  },
];

const FRAMEWORKS = [
  {
    key: 'Selenium',
    color: '#43B02A',
    letters: 'Se',
    letterClass: 'gp4-letter-se',
  },
  {
    key: 'Cypress',
    color: '#00BFA5',
    letters: 'Cy',
    letterClass: 'gp4-letter-cy',
  },
  {
    key: 'Playwright',
    color: '#E2574C',
    letters: 'Pl',
    letterClass: 'gp4-letter-pl',
  },
];

  const validateUrl = (val) => {
    try { new URL(val); setUrlValid(true); }
    catch { setUrlValid(val.length > 0 ? false : null); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoad(true); setError('');
    try {
      const res = await api.post('/generate', { url, framework: fw, test_type: testType });
      setGeneration(res.data);
      goTo('execution');
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    }
    setLoad(false);
  };

  const selectedType = TEST_TYPES.find(t => t.key === testType);
  const selectedFw   = FRAMEWORKS.find(f => f.key === fw);
  const isReady      = urlValid === true;

  return (
    <div className="panel">
      {/* Header */}
      <div className="p-header" style={{ marginBottom: 32 }}>
        <div>
          
          <h1 className="p-title">
            New <span className="g">Generation</span>
          </h1>
          <p className="p-sub">{t('generateDesc')}</p>
        </div>
        {isReady && (
          <div className="gp-ready-badge">
            <span className="gp-ready-dot" />
            Ready to generate
          </div>
        )}
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 24 }}>✗ {error}</div>}

      <form onSubmit={submit}>
        <div className="gp4-layout">

          {/* ── LEFT COLUMN ── */}
          <div className="gp4-left">

            {/* STEP 1 — URL */}
            <div className="gp4-section">
              <div className="gp4-section-header">
                <span className="gp4-num">01</span>
                <div>
                  <div className="gp4-section-title">Target URL</div>
                  <div className="gp4-section-sub">Enter the web application you want to test</div>
                </div>
              </div>
              <div className={`gp4-url-wrap${urlValid === true ? ' valid' : urlValid === false ? ' invalid' : ''}`}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <input
                  type="url"
                  placeholder="https://myapp.com"
                  value={url}
                  onChange={e => { setUrl(e.target.value); validateUrl(e.target.value); }}
                  required
                />
                {urlValid === true && (
                  <svg width="16" height="16" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
                {urlValid === false && (
                  <svg width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                )}
              </div>
              {urlValid === false && (
                <div className="gp4-url-error">Please enter a valid URL starting with https://</div>
              )}
            </div>

            {/* STEP 2 — TEST TYPE */}
            <div className="gp4-section">
              <div className="gp4-section-header">
                <span className="gp4-num">02</span>
                <div>
                  <div className="gp4-section-title">Test Type</div>
                  <div className="gp4-section-sub">Choose the depth of test coverage</div>
                </div>
              </div>
              <div className="gp4-types">
                {TEST_TYPES.map(tt => (
                  <div
                    key={tt.key}
                    className={`gp4-type-card${testType === tt.key ? ' selected' : ''}`}
                    onClick={() => setTestType(tt.key)}
                  >
                    <div className="gp4-type-left">
                      <div className={`gp4-letter-badge ${tt.letterClass}`}>
  {tt.letter}
</div>
                      <div>
                        <div className="gp4-type-name">{tt.label}</div>
                        <div className="gp4-type-desc">{tt.desc}</div>
                      </div>
                    </div>
                    <div className="gp4-type-right">
                      <span className={`gp-badge ${tt.badgeClass}`}>{tt.badge}</span>
                      <span className="gp4-type-time">{tt.time}</span>
                      <div className="gp4-radio">
                        {testType === tt.key && <div className="gp4-radio-dot" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 3 — FRAMEWORK */}
            <div className="gp4-section">
              <div className="gp4-section-header">
                <span className="gp4-num">03</span>
                <div>
                  <div className="gp4-section-title">Framework</div>
                  <div className="gp4-section-sub">Export format for your test scripts</div>
                </div>
              </div>
              <div className="gp4-frameworks">
                {FRAMEWORKS.map(f => (
                  <div
                    key={f.key}
                    className={`gp4-fw-card${fw === f.key ? ' selected' : ''}`}
                    onClick={() => setFw(f.key)}
                    style={{ '--fw-color': f.color }}
                  >
                   <div className={`gp4-fw-letter-badge ${f.letterClass}`}>
                    {f.letters}
                      </div>
                    
                  <span className="gp4-fw-name">{f.key}</span>
                    {fw === f.key && (
                      <div className="gp4-fw-check">
                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* GENERATE BUTTON */}
            <button
              type="submit"
              className="gp4-submit"
              disabled={loading || !isReady}
            >
              {loading ? (
                <><span className="spinner" /> Analyzing & Generating...</>
              ) : (
                <>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  Generate Tests
                  {isReady && <span className="gp4-submit-arrow"></span>}
                </>
              )}
            </button>

          </div>

          {/* ── RIGHT COLUMN — Config Summary ── */}
          <div className="gp4-right">

            {/* Live Config */}
            <div className="gp4-summary-card">
              <div className="gp4-summary-head">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Configuration Summary
              </div>
              <div className="gp4-summary-body">
                <div className="gp4-sum-row">
                  <span className="gp4-sum-label">URL</span>
                  <span className="gp4-sum-val">
                    {url ? (
                      <span style={{ color: urlValid ? 'var(--green)' : 'var(--red)', fontSize: 11, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {url}
                      </span>
                    ) : (
                      <span className="gp4-sum-empty">Not set</span>
                    )}
                  </span>
                </div>
                <div className="gp4-sum-divider" />
                <div className="gp4-sum-row">
                  <span className="gp4-sum-label">Test Type</span>
                  <span className="gp4-sum-val">
                    {selectedType?.icon} {selectedType?.label}
                  </span>
                </div>
                <div className="gp4-sum-divider" />
                <div className="gp4-sum-row">
                  <span className="gp4-sum-label">Framework</span>
                  <span className="gp4-sum-val">
                    {selectedFw?.logo} {selectedFw?.key}
                  </span>
                </div>
                <div className="gp4-sum-divider" />
                <div className="gp4-sum-row">
                  <span className="gp4-sum-label">Est. Time</span>
                  <span className="gp4-sum-val" style={{ color: 'var(--indigo2)' }}>
                    {selectedType?.time}
                  </span>
                </div>
              </div>
              <div className={`gp4-summary-status ${isReady ? 'ready' : 'waiting'}`}>
                <span className={`gp4-status-dot ${isReady ? 'ready' : ''}`} />
                {isReady ? 'Ready to generate' : 'Waiting for valid URL'}
              </div>
            </div>

            {/* How it works */}
            <div className="gp4-how-card">
              <div className="gp4-how-head">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                How it works
              </div>
              <div className="gp4-how-steps">
                {[
                  { n: '01', title: t('domScanning'),    desc: t('domScanningDesc'),    icon: '🔍' },
                  { n: '02', title: t('aiAnalysis'),     desc: t('aiAnalysisDesc'),     icon: '🤖' },
                  { n: '03', title: t('testGeneration'), desc: t('testGenerationDesc'), icon: '⚡' },
                  { n: '04', title: t('scriptExport'),   desc: t('scriptExportDesc'),   icon: '📄' },
                ].map((s, i, arr) => (
                  <div key={s.n} className="gp4-how-step">
                    <div className="gp4-how-step-left">
                      <div className="gp4-how-circle">{s.icon}</div>
                      {i < arr.length - 1 && <div className="gp4-how-line" />}
                    </div>
                    <div className="gp4-how-body">
                      <div className="gp4-how-title">{s.title}</div>
                      <div className="gp4-how-desc">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// Execution Panel — affichage riche avec assertions
// ─────────────────────────────────────────────────────────────────────────────


function ExecutionPanel({ generation }) {
  const { t } = useLang();
  const [filter,       setFilter]       = useState('all');
  const [activeTab,    setActiveTab]    = useState('selenium');
  const [pdfLoading,   setPdfLoading]   = useState(false);
  const [runResults,   setRunResults]   = useState(null);
  const [running,      setRunning]      = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const framework = generation?.generation?.framework || generation?.framework || 'Selenium';
  const testType  = generation?.result?.test_type     || generation?.test_type  || 'smoke';

  useEffect(() => {
    if (!generation) return;
    const savedResults = generation?.result?.execution_results
      || generation?.generation?.execution_results || [];
    if (savedResults.length > 0) { setRunResults({ results: savedResults }); return; }
    if (!generation?.result?.test_cases?.length) return;
    const currentFramework = generation?.generation?.framework || generation?.framework || 'Selenium';
    const run = async () => {
      setRunning(true); setRunResults(null);
      try {
        const res = await api.post('/run', {
          script:     generation.result.script     || '',
          framework:  currentFramework,
          test_cases: generation.result.test_cases || [],
        });
        setRunResults(res.data);
      } catch (err) { console.error('[RUN ERROR]', err.response?.data || err.message); }
      finally { setRunning(false); }
    };
    run();
  }, [generation]);

  const buildTests = (test_cases, execution_results) => {
    if (execution_results && execution_results.length > 0) {
      return execution_results.map((r, i) => ({
        id: i + 1, name: r.name, status: r.status,
        duration: r.duration || '—',
        suite: r.reason_pass || r.reason || r.error || 'Test',
        assertion_result: r.assertion_result || null,
        step_meta: r.step_meta || null,
        category: r.category || 'smoke',
        priority: r.priority || 'medium',
      }));
    }
    return (test_cases || []).map((tc, i) => ({
      id: tc.id || i + 1, name: tc.name, status: 'skip',
      duration: '—', suite: 'Not executed',
      assertion_result: null, step_meta: null,
      category: tc.category || 'smoke', priority: tc.priority || 'medium',
    }));
  };

  const executionResults = runResults?.results || [];
  const isBoth           = framework === 'Both';
  const testsSelenium    = buildTests(generation?.result?.test_cases_selenium, executionResults);
  const testsCypress     = buildTests(generation?.result?.test_cases_cypress,  []);
  const testsSingle      = buildTests(generation?.result?.test_cases, executionResults);
  const tests = isBoth ? (activeTab === 'selenium' ? testsSelenium : testsCypress) : testsSingle;
  const pass  = tests.filter(t => t.status === 'pass').length;
  const fail  = tests.filter(t => t.status === 'fail').length;
  const skip  = tests.filter(t => t.status === 'skip').length;
  const rate  = tests.length > 0 ? Math.round((pass / tests.length) * 100) : 0;
  const shown = filter === 'all' ? tests : tests.filter(t => t.status === filter);

  const url        = generation?.generation?.url || generation?.url || '';
  const loadTimeMs = generation?.generation?.load_time_ms || generation?.scraped?.load_time_ms || 0;

  const rateColor = rate >= 80 ? '#10B981' : rate >= 50 ? '#F59E0B' : '#EF4444';
  const rateGrad  = rate >= 80
    ? 'linear-gradient(90deg,#10b981,#34d399)'
    : rate >= 50
    ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
    : 'linear-gradient(90deg,#ef4444,#f87171)';

  const TEST_TYPE_BADGE = {
    smoke:       { label: 'Smoke',       color: '#64748b', bg: 'rgba(148,163,184,.12)', border: 'rgba(148,163,184,.3)',  letter: 'S' },
    functional:  { label: 'Functional',  color: '#6366f1', bg: 'rgba(99,102,241,.1)',   border: 'rgba(99,102,241,.25)', letter: 'F' },
    performance: { label: 'Performance', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)',   border: 'rgba(139,92,246,.25)', letter: 'P' },
  };
  const ttBadge = TEST_TYPE_BADGE[testType] || TEST_TYPE_BADGE.smoke;

  const EP_FW = {
    Selenium:   { letters: 'Se', color: '#43B02A' },
    Cypress:    { letters: 'Cy', color: '#00BFA5' },
    Playwright: { letters: 'Pl', color: '#E2574C' },
    Both:       { letters: '∞',  color: '#C9A227' },
  };
  const fwConf = EP_FW[framework] || EP_FW.Selenium;

  const downloadScript = (type = 'selenium') => {
    let content, filename;
    if (isBoth) {
      content  = type === 'selenium'   ? generation?.result?.script_selenium
               : type === 'playwright' ? generation?.result?.script_playwright
               :                         generation?.result?.script_cypress;
      filename = type === 'selenium'   ? 'test_selenium.py'
               : type === 'playwright' ? 'test_playwright.py'
               :                         'test_cypress.js';
    } else {
      const fw = framework?.toLowerCase();
      content  = fw === 'playwright' ? (generation?.result?.script_playwright || generation?.result?.script || '')
               : fw === 'cypress'    ? (generation?.result?.script_cypress    || generation?.result?.script || '')
               :                       (generation?.result?.script_selenium   || generation?.result?.script || '');
      filename = fw === 'playwright' ? 'test_playwright.py'
               : fw === 'cypress'    ? 'test_cypress.js'
               :                       'test_selenium.py';
    }
    const blob = new Blob([content || ''], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = filename; link.click();
  };

  const downloadCsv = () => {
    const headers = ['ID', 'Name', 'Status', 'Duration', 'Category', 'Suite'];
    const rows = tests.map(t => [
      t.id, `"${t.name}"`, t.status, t.duration, t.category, `"${t.suite}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_${generation?.generation?.id || 'nextest'}.csv`;
    link.click();
    setDropdownOpen(false);
  };

  const downloadHtml = () => {
    const passRate = rate;
    const rateCol  = passRate >= 80 ? '#10b981' : passRate >= 50 ? '#f59e0b' : '#ef4444';
    const rows = tests.map(t => `
      <tr style="border-bottom:1px solid #1e293b">
        <td style="padding:10px 14px;color:#e2e8f0;font-weight:600">${t.name}</td>
        <td style="padding:10px 14px">
          <span style="padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;
            background:${t.status==='pass'?'rgba(16,185,129,.15)':t.status==='fail'?'rgba(239,68,68,.15)':'rgba(245,158,11,.15)'};
            color:${t.status==='pass'?'#10b981':t.status==='fail'?'#ef4444':'#f59e0b'}">
            ${t.status.toUpperCase()}
          </span>
        </td>
        <td style="padding:10px 14px;color:#94a3b8">${t.category}</td>
        <td style="padding:10px 14px;color:#94a3b8;font-family:monospace">${t.duration}</td>
        <td style="padding:10px 14px;color:#94a3b8;font-size:12px">${t.suite}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Rapport NexTest</title>
  <style>
    body{margin:0;font-family:'DM Sans',sans-serif;background:#070e1c;color:#e2e8f0}
    .container{max-width:960px;margin:40px auto;padding:0 24px}
    h1{font-family:Georgia,serif;font-size:36px;font-weight:700;margin-bottom:4px}
    h1 span{color:#818cf8;font-style:italic;font-weight:300}
    .meta{font-size:13px;color:#64748b;margin-bottom:32px}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:32px}
    .stat{background:#0d1526;border:1px solid rgba(99,102,241,.15);border-radius:14px;padding:20px;text-align:center}
    .stat-val{font-family:Georgia,serif;font-size:40px;font-weight:700;line-height:1}
    .stat-lbl{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#64748b;margin-top:4px}
    table{width:100%;border-collapse:collapse;background:#0d1526;border:1px solid rgba(99,102,241,.15);border-radius:12px;overflow:hidden}
    thead{background:#0a1220}
    th{padding:12px 14px;text-align:left;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#64748b;font-weight:700}
  </style>
</head>
<body>
<div class="container">
  <h1>Test <span>Report</span></h1>
  <div class="meta">URL : ${url} &nbsp;·&nbsp; Framework : ${framework} &nbsp;·&nbsp; Généré par NexTest</div>
  <div class="stats">
    <div class="stat"><div class="stat-val" style="color:#10b981">${pass}</div><div class="stat-lbl">Passed</div></div>
    <div class="stat"><div class="stat-val" style="color:#ef4444">${fail}</div><div class="stat-lbl">Failed</div></div>
    <div class="stat"><div class="stat-val" style="color:#f59e0b">${skip}</div><div class="stat-lbl">Skipped</div></div>
    <div class="stat"><div class="stat-val" style="color:${rateCol}">${passRate}%</div><div class="stat-lbl">Pass Rate</div></div>
  </div>
  <table>
    <thead><tr><th>Test</th><th>Status</th><th>Catégorie</th><th>Durée</th><th>Suite</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_${generation?.generation?.id || 'nextest'}.html`;
    link.click();
    setDropdownOpen(false);
  };

  const downloadPdf = async () => {
    try {
      setPdfLoading(true);
      setDropdownOpen(false);
      const id = generation?.generation?.id;
      if (!id) return;
      const res = await api.get(`/generations/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `nextest_report_${id}.pdf`; link.click();
    } catch (err) { console.error(err); }
    finally { setPdfLoading(false); }
  };

  if (!generation) {
    return (
      <div className="panel">
        <div className="ep-empty">
          <div className="ep-empty-icon">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
          <h3>No Execution Yet</h3>
          <p>Generate tests first from <strong>New Generation</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">

      {/* ── HEADER ── */}
      <div className="ep-header">
        <div className="ep-header-left">
          <div className="gp-tag" style={{ marginBottom: 8 }}>
            <span className="gp-tag-dot" />
            Test Execution
          </div>
          <h1 className="p-title">
            Test <span className="g">Execution</span>
          </h1>
          <div className="ep-info-bar">
            <div className="ep-info-chip">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span>{url}</span>
            </div>
            <div className="ep-info-chip" style={{ color: fwConf.color, borderColor: `${fwConf.color}33`, background: `${fwConf.color}11` }}>
              <span className="ep-fw-dot" style={{ background: fwConf.color }} />
              {fwConf.letters} · {framework}
            </div>
            <div className="ep-info-chip" style={{ color: ttBadge.color, borderColor: ttBadge.border, background: ttBadge.bg }}>
              {ttBadge.letter} · {ttBadge.label}
            </div>
          </div>
        </div>

        {/* ── DOWNLOAD BUTTONS ── */}
        <div className="ep-actions">
          {isBoth ? (
            <>
              <button className="ep-dl-btn" onClick={() => downloadScript('selenium')}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span className="ep-dl-letters" style={{ color: '#43B02A' }}>Se</span> .py
              </button>
              <button className="ep-dl-btn" onClick={() => downloadScript('playwright')}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span className="ep-dl-letters" style={{ color: '#E2574C' }}>Pl</span> .py
              </button>
              <button className="ep-dl-btn" onClick={() => downloadScript('cypress')}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span className="ep-dl-letters" style={{ color: '#00BFA5' }}>Cy</span> .js
              </button>
            </>
          ) : (
            <button className="ep-dl-btn" onClick={() => downloadScript()}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span className="ep-dl-letters" style={{ color: fwConf.color }}>{fwConf.letters}</span>
              {framework === 'Cypress' ? '.js' : '.py'}
            </button>
          )}

          {/* ── DROPDOWN RAPPORT ── */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className="ep-pdf-btn"
              onClick={() => setDropdownOpen(o => !o)}
              disabled={pdfLoading}
            >
              {pdfLoading ? (
                <><span className="spinner" /> Generating...</>
              ) : (
                <>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  Download Report
                  <svg
                    width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    style={{ marginLeft: 2, transition: 'transform .2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </>
              )}
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 6,
                boxShadow: '0 8px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(99,102,241,.08)',
                zIndex: 200, minWidth: 190,
                animation: 'dFadeUp .18s var(--ease) both',
              }}>

                {/* CSV */}
                <button
                  onClick={downloadCsv}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--sub)', fontFamily: 'var(--D)',
                    fontSize: 13, fontWeight: 600, transition: 'all .15s', textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--green-bg)'; e.currentTarget.style.color = 'var(--green)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sub)'; }}
                >
                  <span style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: '#10b981', letterSpacing: .5,
                  }}>CSV</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>rapport.csv</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>Données tabulaires</div>
                  </div>
                </button>

                {/* HTML */}
                <button
                  onClick={downloadHtml}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--sub)', fontFamily: 'var(--D)',
                    fontSize: 13, fontWeight: 600, transition: 'all .15s', textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--indigo-bg)'; e.currentTarget.style.color = 'var(--indigo3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sub)'; }}
                >
                  <span style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: 'var(--indigo-dim)', border: '1px solid var(--indigo-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: 'var(--indigo2)', letterSpacing: .5,
                  }}>HTML</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>rapport.html</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>Rapport visuel</div>
                  </div>
                </button>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 6px' }} />

                {/* PDF */}
                <button
                  onClick={downloadPdf}
                  disabled={pdfLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--sub)', fontFamily: 'var(--D)',
                    fontSize: 13, fontWeight: 600, transition: 'all .15s', textAlign: 'left',
                    opacity: pdfLoading ? .5 : 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.08)'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sub)'; }}
                >
                  <span style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: '#ef4444', letterSpacing: .5,
                  }}>PDF</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>rapport.pdf</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>Rapport complet</div>
                  </div>
                  {pdfLoading && <span className="spinner" />}
                </button>

              </div>
            )}
          </div>
          {/* ── FIN DROPDOWN ── */}

        </div>
      </div>

      {/* ── TABS (Both mode) ── */}
      {isBoth && (
        <div className="ep-tabs">
          {[
            { key: 'selenium', label: 'Selenium', letters: 'Se', color: '#43B02A', count: testsSelenium.length },
            { key: 'cypress',  label: 'Cypress',  letters: 'Cy', color: '#00BFA5', count: testsCypress.length  },
          ].map(tab => (
            <button
              key={tab.key}
              className={`ep-tab${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => { setActiveTab(tab.key); setFilter('all'); }}
              style={{ '--tab-color': tab.color }}
            >
              <span className="ep-tab-letters" style={{ color: tab.color }}>{tab.letters}</span>
              {tab.label}
              <span className="ep-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── STAT CARDS ── */}
      <div className="ep-stats">
        {[
          {
            label: 'Passed', val: pass, color: '#10B981',
            bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',
            icon: <svg width="18" height="18" fill="none" stroke="#10B981" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>,
          },
          {
            label: 'Failed', val: fail, color: '#EF4444',
            bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',
            icon: <svg width="18" height="18" fill="none" stroke="#EF4444" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>,
          },
          {
            label: 'Skipped', val: skip, color: '#F59E0B',
            bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
            icon: <svg width="18" height="18" fill="none" stroke="#F59E0B" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>,
          },
          {
            label: 'Pass Rate', val: `${rate}%`, color: rateColor,
            bg: `${rateColor}12`, border: `${rateColor}33`,
            icon: <svg width="18" height="18" fill="none" stroke={rateColor} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
          },
        ].map((s, i) => (
          <div key={s.label} className="ep-stat" style={{ '--sc': s.color, '--sb': s.bg, '--sbo': s.border, '--i': i }}>
            <div className="ep-stat-icon">{s.icon}</div>
            <div className="ep-stat-body">
              <div className="ep-stat-val" style={{ color: s.color }}>{s.val}</div>
              <div className="ep-stat-lbl">{s.label}</div>
            </div>
            <div className="ep-stat-bar-wrap">
              <div className="ep-stat-bar-fill" style={{
                height: `${s.label === 'Pass Rate' ? rate : s.label === 'Passed' ? (pass / Math.max(tests.length,1)) * 100 : s.label === 'Failed' ? (fail / Math.max(tests.length,1)) * 100 : (skip / Math.max(tests.length,1)) * 100}%`,
                background: s.color,
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── PROGRESS ── */}
      <div className="ep-progress-card">
        <div className="ep-progress-top">
          <div className="ep-progress-info">
            {running ? (
              <><span className="spinner" style={{ marginRight: 8 }} /><span style={{ color: 'var(--indigo2)' }}>Running tests...</span></>
            ) : (
              <>
                <svg width="14" height="14" fill="none" stroke="var(--green)" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                <span>{tests.length} tests executed</span>
                <span className="ep-progress-sep">·</span>
                <span style={{ color: 'var(--muted)' }}>{loadTimeMs}ms load time</span>
              </>
            )}
          </div>
          <div className="ep-progress-rate" style={{ color: rateColor }}>
            {rate}% pass rate
          </div>
        </div>
        <div className="ep-progress-track">
          <div className="ep-progress-fill" style={{
            width: `${running ? 100 : rate}%`,
            background: running ? 'linear-gradient(90deg,var(--indigo),var(--indigo2))' : rateGrad,
          }} />
          {!running && rate > 0 && (
            <div className="ep-progress-label-inside" style={{ left: `${Math.min(rate, 92)}%` }}>
              {rate}%
            </div>
          )}
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="ep-filters">
        {[
          { key: 'all',  label: 'All',     count: tests.length },
          { key: 'pass', label: 'Passed',  count: pass },
          { key: 'fail', label: 'Failed',  count: fail },
          { key: 'skip', label: 'Skipped', count: skip },
        ].map(f => (
          <button
            key={f.key}
            className={`ep-filter${filter === f.key ? ' on' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.key === 'pass' && <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>}
            {f.key === 'fail' && <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>}
            {f.key === 'skip' && <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>}
            {f.label}
            <span className="ep-filter-count">{f.count}</span>
          </button>
        ))}
        <div className="ep-filter-right">
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
            Showing {shown.length} of {tests.length}
          </span>
        </div>
      </div>

      {/* ── TEST LIST ── */}
      <div className="ep-list">
        {running
          ? Array.from({ length: tests.length || 4 }).map((_, i) => (
              <div key={i} className="ep-row ep-row--skeleton" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="ep-row-status-wrap"><div className="ep-skeleton-circle" /></div>
                <div className="ep-row-body">
                  <div className="ep-skeleton-line" style={{ width: '55%', height: 13 }} />
                  <div className="ep-skeleton-line" style={{ width: '35%', height: 10, marginTop: 6 }} />
                </div>
                <div className="ep-skeleton-pill" />
              </div>
            ))
          : shown.length === 0
          ? (
            <div className="ep-no-results">
              <svg width="24" height="24" fill="none" stroke="var(--muted)" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              No tests match this filter
            </div>
          )
          : shown.map((test, i) => (
            <div
              key={test.id}
              className={`ep-row ep-row--${test.status}`}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="ep-row-status-wrap">
                <StatusIcon s={test.status} />
              </div>
              <div className="ep-row-body">
                <div className="ep-row-name">{test.name}</div>
                <div className="ep-row-suite">{test.suite}</div>
                {test.assertion_result && (
                  <AssertionBadge
                    assertion_result={test.assertion_result}
                    step_meta={test.step_meta}
                  />
                )}
              </div>
              <div className="ep-row-meta">
                <span className="ep-cat-badge" style={{
                  color: test.category === 'functional' ? '#6366f1' : test.category === 'performance' ? '#8b5cf6' : '#64748b',
                  background: test.category === 'functional' ? 'rgba(99,102,241,.1)' : test.category === 'performance' ? 'rgba(139,92,246,.1)' : 'rgba(100,116,139,.1)',
                  border: `1px solid ${test.category === 'functional' ? 'rgba(99,102,241,.2)' : test.category === 'performance' ? 'rgba(139,92,246,.2)' : 'rgba(100,116,139,.2)'}`,
                }}>
                  {test.category === 'smoke' ? 'S' : test.category === 'functional' ? 'F' : 'R'}
                </span>
                <span className={`ep-status-badge ep-status-badge--${test.status}`}>
                  {test.status}
                </span>
                <span className="ep-duration">{test.duration}</span>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// History Panel
// ─────────────────────────────────────────────────────────────────────────────

const FW_CONFIG = {
  Selenium:   { color: '#43B02A', bg: 'rgba(67,176,42,.12)',  border: 'rgba(67,176,42,.3)',  letters: 'Se' },
  Cypress:    { color: '#00BFA5', bg: 'rgba(0,191,165,.12)',  border: 'rgba(0,191,165,.3)',  letters: 'Cy' },
  Playwright: { color: '#E2574C', bg: 'rgba(226,87,76,.12)',  border: 'rgba(226,87,76,.3)',  letters: 'Pl' },
  Both:       { color: '#C9A227', bg: 'rgba(201,162,39,.12)', border: 'rgba(201,162,39,.3)', letters: '∞'  },
};
 
const TYPE_CONFIG = {
  smoke:      { color: '#64748B', bg: 'rgba(100,116,139,.1)', border: 'rgba(100,116,139,.25)', label: 'Smoke',      letter: 'S' },
  functional: { color: '#6366F1', bg: 'rgba(99,102,241,.1)',  border: 'rgba(99,102,241,.25)',  label: 'Functional', letter: 'F' },
  performance: { color: '#8B5CF6', bg: 'rgba(139,92,246,.1)',  border: 'rgba(139,92,246,.25)',  label: 'performance', letter: 'P' },
};
 
const rateColor = (r) => r >= 80 ? '#10B981' : r >= 50 ? '#F59E0B' : '#EF4444';
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
 
const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)     return `${Math.floor(diff)}s ago`;
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
};
 
// ─── Sort icon ────────────────────────────────────────────────────────────────
 
function SortIcon({ active, dir }) {
  return (
    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5"
      viewBox="0 0 24 24" style={{ opacity: active ? 1 : .3, transition: 'opacity .2s' }}>
      {active && dir === 'desc'
        ? <path d="M7 10l5 5 5-5"/>
        : <path d="M7 14l5-5 5 5"/>
      }
    </svg>
  );
}
 
// ─── Detail Sidebar ───────────────────────────────────────────────────────────
 
function DetailSidebar({ item, onClose, onView, onDelete, deleting }) {
  if (!item) return null;
 
  const fw    = FW_CONFIG[item.framework]   || FW_CONFIG.Selenium;
  const type  = TYPE_CONFIG[item.test_type] || TYPE_CONFIG.smoke;
  const total = (item.pass_count || 0) + (item.fail_count || 0) + (item.skip_count || 0);
  const rc    = rateColor(item.pass_rate || 0);
 
  return (
    <aside className="hp2-sidebar">
 
      <div className="hp2-sb-head">
        <span className="hp2-sb-title">Generation Details</span>
        <button className="hp2-sb-close" onClick={onClose}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
 
      <div className="hp2-sb-body">
 
        <div className="hp2-sb-sec">
          <div className="hp2-sb-sec-title">Target URL</div>
          <div className="hp2-sb-url">{item.url}</div>
        </div>
 
        <div className="hp2-sb-sec">
          <div className="hp2-sb-sec-title">Configuration</div>
          <div className="hp2-sb-meta">
            <div className="hp2-sb-meta-row">
              <span className="hp2-sb-meta-label">Framework</span>
              <span className="hp2-fw-badge"
                style={{ color: fw.color, background: fw.bg, border: `1px solid ${fw.border}` }}>
                {fw.letters} · {item.framework}
              </span>
            </div>
            <div className="hp2-sb-meta-row">
              <span className="hp2-sb-meta-label">Test Type</span>
              <span className="hp2-type-badge"
                style={{ color: type.color, background: type.bg, border: `1px solid ${type.border}` }}>
                {type.label}
              </span>
            </div>
            <div className="hp2-sb-meta-row">
              <span className="hp2-sb-meta-label">Load Time</span>
              <span className="hp2-sb-meta-val" style={{ color: 'var(--indigo2)', fontSize: 12 }}>
                {item.load_time_ms || 0}ms
              </span>
            </div>
            <div className="hp2-sb-meta-row">
              <span className="hp2-sb-meta-label">Generated</span>
              <span className="hp2-sb-meta-val" style={{ fontSize: 12 }}>
                {timeAgo(item.created_at)}
              </span>
            </div>
          </div>
        </div>
 
        <div className="hp2-sb-sec">
          <div className="hp2-sb-sec-title">Test Results · {total} total</div>
          <div className="hp2-sb-results">
            {[
              { val: item.pass_count || 0, lbl: 'Passed',  color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)' },
              { val: item.fail_count || 0, lbl: 'Failed',  color: 'var(--red)',   bg: 'var(--red-bg)',   border: 'var(--red-border)'   },
              { val: item.skip_count || 0, lbl: 'Skipped', color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)' },
            ].map(s => (
              <div key={s.lbl} className="hp2-sb-res-card"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <div className="hp2-sb-res-val" style={{ color: s.color }}>{s.val}</div>
                <div className="hp2-sb-res-lbl" style={{ color: s.color }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
 
        <div className="hp2-sb-sec">
          <div className="hp2-sb-sec-title">Distribution</div>
          <div className="hp2-sb-progress">
            {[
              { label: 'Pass', pct: total > 0 ? Math.round((item.pass_count || 0) / total * 100) : 0, color: 'var(--green)' },
              { label: 'Fail', pct: total > 0 ? Math.round((item.fail_count || 0) / total * 100) : 0, color: 'var(--red)'   },
              { label: 'Skip', pct: total > 0 ? Math.round((item.skip_count || 0) / total * 100) : 0, color: 'var(--amber)' },
            ].map(p => (
              <div key={p.label} className="hp2-sb-prog-row">
                <span className="hp2-sb-prog-label">{p.label}</span>
                <div className="hp2-sb-prog-track">
                  <div className="hp2-sb-prog-fill" style={{ width: `${p.pct}%`, background: p.color }}/>
                </div>
                <span className="hp2-sb-prog-pct" style={{ color: p.color }}>{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>
 
        <div className="hp2-sb-sec" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{
            fontFamily: 'var(--C)', fontSize: 56, fontWeight: 700,
            color: rc, lineHeight: 1, marginBottom: 6,
          }}>
            {item.pass_rate || 0}%
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '2px',
            textTransform: 'uppercase', color: 'var(--muted)',
          }}>
            Global Pass Rate
          </div>
          <div style={{ height: 6, borderRadius: 6, background: 'var(--bg2)', marginTop: 14, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 6,
              width: `${item.pass_rate || 0}%`,
              background: `linear-gradient(90deg, ${rc}, ${rc}88)`,
              transition: 'width 1.2s var(--ease)',
            }}/>
          </div>
        </div>
 
      </div>
 
      <div className="hp2-sb-actions">
        <button className="hp2-sb-btn-primary" onClick={() => onView(item)}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          View Full Results
        </button>
        <button className="hp2-sb-btn-danger"
          onClick={() => onDelete(item.id)}
          disabled={deleting === item.id}>
          {deleting === item.id ? '...' : (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
          )}
        </button>
      </div>
 
    </aside>
  );
}
 
// ─────────────────────────────────────────────────────────────────────────────
// HistoryPanel
// ─────────────────────────────────────────────────────────────────────────────
 
function HistoryPanel({ goTo, setGeneration }) {
  const { t } = useLang();
 
  const [histories, setHistories] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filterFw,  setFilterFw]  = useState('all');
  const [sortKey,   setSortKey]   = useState('date');
  const [sortDir,   setSortDir]   = useState('desc');
  const [selected,  setSelected]  = useState(null);
  const [deleting,  setDeleting]  = useState(null);
 
  useEffect(() => {
    api.get('/generations')
      .then(res => setHistories(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
 
  const totalGen   = histories.length;
  const totalTests = histories.reduce((s, h) => s + (h.pass_count || 0) + (h.fail_count || 0) + (h.skip_count || 0), 0);
  const totalPass  = histories.reduce((s, h) => s + (h.pass_count || 0), 0);
  const avgRate    = histories.length
    ? Math.round(histories.reduce((s, h) => s + (h.pass_rate || 0), 0) / histories.length)
    : 0;
 
  const filtered = histories
    .filter(h =>
      h.url.toLowerCase().includes(search.toLowerCase()) &&
      (filterFw === 'all' || h.framework === filterFw)
    )
    .sort((a, b) => {
      let va, vb;
      if (sortKey === 'date')  { va = new Date(a.created_at); vb = new Date(b.created_at); }
      if (sortKey === 'rate')  { va = a.pass_rate  || 0; vb = b.pass_rate  || 0; }
      if (sortKey === 'tests') {
        va = (a.pass_count || 0) + (a.fail_count || 0) + (a.skip_count || 0);
        vb = (b.pass_count || 0) + (b.fail_count || 0) + (b.skip_count || 0);
      }
      return sortDir === 'desc' ? vb - va : va - vb;
    });
 
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };
 
  const handleView = (item) => {
    setGeneration({
      url: item.url, framework: item.framework,
      generation: { id: item.id, url: item.url, framework: item.framework, load_time_ms: item.load_time_ms },
      result: {
        test_cases:          item.test_cases          || [],
        test_cases_selenium: item.test_cases_selenium || [],
        test_cases_cypress:  item.test_cases_cypress  || [],
        script:              item.script              || '',
        script_selenium:     item.script_selenium     || '',
        script_playwright:   item.script_playwright   || '',
        script_cypress:      item.script_cypress      || '',
        execution_results:   item.execution_results   || [],
      },
    });
    goTo('execution');
  };
 
  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/generations/${id}`);
      setHistories(prev => prev.filter(h => h.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e) { console.error(e); }
    setDeleting(null);
  };
 
  const COLUMNS = [
    { label: '#',         key: null    },
    { label: 'URL',       key: null    },
    { label: 'Framework', key: null    },
    { label: 'Type',      key: null    },
    { label: 'Tests',     key: 'tests' },
    { label: 'Pass Rate', key: 'rate'  },
    { label: 'Date',      key: 'date'  },
    { label: 'Actions',   key: null    },
  ];
 
  return (
    <div className="panel">
 
      {/* Header */}
      <div className="hp2-header">
        <div>
          <h1 className="p-title">
            {t('generation')} <span className="g">{t('history')}</span>
          </h1>
          <p className="p-sub">{t('historyDesc')}</p>
        </div>
        <button className="btn-primary" onClick={() => goTo('generate')}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New Generation
        </button>
      </div>
 
      {/* Stat cards */}
      {histories.length > 0 && (
        <div className="hp2-stats">
          {[
            { icon: '🚀', val: totalGen,      lbl: 'Total Generations', sc: 'var(--gold)'    },
            { icon: '🔬', val: totalTests,    lbl: 'Tests Executed',    sc: 'var(--indigo2)' },
            { icon: '✅', val: totalPass,     lbl: 'Tests Passed',      sc: 'var(--green)'   },
            { icon: '🎯', val: `${avgRate}%`, lbl: 'Avg Pass Rate',     sc: 'var(--amber)'   },
          ].map((s, i) => (
            <div key={s.lbl} className="hp2-stat" style={{ '--i': i, '--sc': s.sc }}>
              <div className="hp2-stat-icon">{s.icon}</div>
              <div>
                <div className="hp2-stat-val">{s.val}</div>
                <div className="hp2-stat-lbl">{s.lbl}</div>
              </div>
            </div>
          ))}
        </div>
      )}
 
      {/* Toolbar */}
      {histories.length > 0 && (
        <div className="hp2-toolbar">
          <div className="hp2-search">
            <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              placeholder="Search by URL…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
 
          <div className="hp2-filters">
            {['all', 'Selenium', 'Cypress', 'Playwright', 'Both'].map(fw => {
              const conf = FW_CONFIG[fw];
              return (
                <button key={fw}
                  className={`hp2-filter-btn ${filterFw === fw ? 'on' : ''}`}
                  onClick={() => setFilterFw(fw)}>
                  {conf && (
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: filterFw === fw ? '#fff' : conf.color,
                      display: 'inline-block', flexShrink: 0,
                    }}/>
                  )}
                  {fw === 'all' ? 'All' : fw}
                </button>
              );
            })}
          </div>
 
          {[
            { key: 'date',  label: 'Date',
              icon: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            { key: 'rate',  label: 'Pass Rate',
              icon: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
            { key: 'tests', label: 'Tests',
              icon: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/></svg> },
          ].map(s => (
            <button key={s.key}
              className={`hp2-sort-btn ${sortKey === s.key ? 'active' : ''}`}
              onClick={() => toggleSort(s.key)}>
              {s.icon} {s.label}
              <SortIcon active={sortKey === s.key} dir={sortDir}/>
            </button>
          ))}
 
          <div className="hp2-count-badge">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
 
      {/* Table + Sidebar */}
      <div className="hp2-layout">
 
        <div className="hp2-table-wrap">
 
          {histories.length > 0 && (
            <div className="hp2-thead">
              {COLUMNS.map(col => (
                <div key={col.label}
                  className={`hp2-th ${sortKey === col.key ? 'sorted' : ''}`}
                  onClick={() => col.key && toggleSort(col.key)}>
                  {col.label}
                  {col.key && <SortIcon active={sortKey === col.key} dir={sortDir}/>}
                </div>
              ))}
            </div>
          )}
 
          <div className="hp2-tbody">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="hp2-row" style={{ cursor: 'default', padding: '16px 26px' }}>
                  <div className="hp2-skel-line" style={{ width: '100%', height: 13 }}/>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="hp2-empty">
                <div className="hp2-empty-icon">
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
                <h3>{search || filterFw !== 'all' ? 'No results found' : t('noHistoryYet')}</h3>
                <p>{search || filterFw !== 'all' ? 'Try adjusting your search or filters' : t('noHistoryDesc')}</p>
              </div>
            ) : (
              filtered.map((item, i) => {
                const fw    = FW_CONFIG[item.framework]   || FW_CONFIG.Selenium;
                const type  = TYPE_CONFIG[item.test_type] || TYPE_CONFIG.smoke;
                const total = (item.pass_count || 0) + (item.fail_count || 0) + (item.skip_count || 0);
                const rc    = rateColor(item.pass_rate || 0);
                const isSel = selected?.id === item.id;
 
                return (
                  <div key={item.id}
                    className={`hp2-row ${isSel ? 'selected' : ''}`}
                    style={{ '--ri': i }}
                    onClick={() => setSelected(isSel ? null : item)}>
 
                    <div className="hp2-td">
                      <span className="hp2-num">{i + 1}</span>
                    </div>
 
                    <div className="hp2-td hp2-url-cell">
                      <span className="hp2-url-main">{item.url}</span>
                      <span className="hp2-url-sub">ID #{item.id} · {item.load_time_ms || 0}ms</span>
                    </div>
 
                    <div className="hp2-td">
                      <span className="hp2-fw-badge"
                        style={{ color: fw.color, background: fw.bg, border: `1px solid ${fw.border}` }}>
                        {fw.letters}
                      </span>
                    </div>
 
                    <div className="hp2-td">
                      <span className="hp2-type-badge"
                        style={{ color: type.color, background: type.bg, border: `1px solid ${type.border}` }}>
                        {type.letter}
                      </span>
                    </div>
 
                    <div className="hp2-td hp2-tests-cell">
                      <div className="hp2-tests-nums">
                        <span style={{ color: 'var(--green)', fontWeight: 700 }}>{item.pass_count || 0}</span>
                        <span style={{ color: 'var(--muted)' }}>·</span>
                        <span style={{ color: 'var(--red)' }}>{item.fail_count || 0}</span>
                        <span style={{ color: 'var(--muted)' }}>·</span>
                        <span style={{ color: 'var(--amber)' }}>{item.skip_count || 0}</span>
                      </div>
                      <div className="hp2-tests-bar">
                        <div className="hp2-tests-bar-seg"
                          style={{ width: `${total ? (item.pass_count || 0) / total * 100 : 0}%`, background: 'var(--green)' }}/>
                        <div className="hp2-tests-bar-seg"
                          style={{ width: `${total ? (item.fail_count || 0) / total * 100 : 0}%`, background: 'var(--red)' }}/>
                        <div className="hp2-tests-bar-seg"
                          style={{ width: `${total ? (item.skip_count || 0) / total * 100 : 0}%`, background: 'var(--amber)' }}/>
                      </div>
                    </div>
 
                    <div className="hp2-td hp2-rate-cell">
                      <span className="hp2-rate-num" style={{ color: rc }}>{item.pass_rate || 0}%</span>
                      <div className="hp2-rate-bar">
                        <div className="hp2-rate-fill" style={{ width: `${item.pass_rate || 0}%`, background: rc }}/>
                      </div>
                    </div>
 
                    <div className="hp2-td">
                      <span className="hp2-date">{timeAgo(item.created_at)}</span>
                    </div>
 
                    <div className="hp2-td hp2-actions-cell" onClick={e => e.stopPropagation()}>
                      <button className="hp2-act-btn view" title="View results" onClick={() => handleView(item)}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                      </button>
                      <button className="hp2-act-btn del" title="Delete"
                        onClick={() => handleDelete(item.id)} disabled={deleting === item.id}>
                        {deleting === item.id ? '...' : (
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                          </svg>
                        )}
                      </button>
                    </div>
 
                  </div>
                );
              })
            )}
          </div>
        </div>
 
        {selected && (
          <DetailSidebar
            item={selected}
            onClose={() => setSelected(null)}
            onView={handleView}
            onDelete={handleDelete}
            deleting={deleting}
          />
        )}
 
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Account Panel
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// AccountPanel — Modern floating label fields, 2026
// Remplace l'ancienne fonction AccountPanel dans Dashboard.jsx
// CSS à coller à la fin de Dashboard.css (bloc marqué /* ACCOUNT PANEL v2 */)
// ─────────────────────────────────────────────────────────────────────────────

function AccountPanel({ user }) {
  const { setUser } = useAuth();
  const { t } = useLang();

  const [name,       setName]       = useState(user?.name  || '');
  const [email,      setEmail]      = useState(user?.email || '');
  const [currPwd,    setCurrPwd]    = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [msg,        setMsg]        = useState('');
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);

  const saveProfile = async () => {
    setLoading(true); setMsg(''); setError('');
    try {
      const res = await api.put('/profile/update', { name, email });
      setUser(res.data.user);
      setMsg(t('profileUpdated'));
    } catch (err) {
      setError(err.response?.data?.message || t('errorOccurred'));
    }
    setLoading(false);
  };

  const changePassword = async () => {
    if (newPwd !== confirmPwd) { setError(t('passwordMismatch')); return; }
    setLoading(true); setMsg(''); setError('');
    try {
      await api.put('/profile/password', {
        current_password:      currPwd,
        new_password:          newPwd,
        new_password_confirmation: confirmPwd,
      });
      setMsg(t('passwordChanged'));
      setCurrPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err) {
      setError(err.response?.data?.errors?.current_password?.[0] || t('errorOccurred'));
    }
    setLoading(false);
  };

  // ── Eye icons ───────────────────────────────────────────────────────────────
  const IconEyeOn = (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
  const IconEyeOff = (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  // ── Floating label field ────────────────────────────────────────────────────
  function FloatField({ label, value, onChange, type = 'text', icon }) {
    const [focused,  setFocused]  = useState(false);
    const [showPwd,  setShowPwd]  = useState(false);
    const isPassword = type === 'password';
    const inputType  = isPassword ? (showPwd ? 'text' : 'password') : type;
    const active     = focused || value?.length > 0;

    return (
      <div className={`ac2-field ${active ? 'active' : ''} ${focused ? 'focused' : ''}`}>
        <div className="ac2-field-icon">{icon}</div>
        <div className="ac2-field-inner">
          <label className="ac2-label">{label}</label>
          <input
            className="ac2-input"
            type={inputType}
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoComplete="off"
          />
        </div>
        {isPassword && (
          <button
            type="button"
            className={`ac2-eye-btn ${showPwd ? 'visible' : ''}`}
            onClick={() => setShowPwd(v => !v)}
            tabIndex={-1}
            title={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd ? IconEyeOff : IconEyeOn}
          </button>
        )}
        <div className="ac2-field-bar" />
      </div>
    );
  }

  // ── Icons ───────────────────────────────────────────────────────────────────
  const IconUser = (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
  const IconMail = (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
  const IconLock = (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
  const IconShield = (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );

  return (
    <div className="panel">

      {/* ── Header ── */}
      <div className="p-header">
        <div>
          <h1 className="p-title">{t('my')} <span className="g">{t('account')}</span></h1>
          <p className="p-sub">{t('accountDesc')}</p>
        </div>
      </div>

      {/* ── Feedback ── */}
      {msg   && (
        <div className="ac2-feedback ac2-feedback--ok">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
          {msg}
        </div>
      )}
      {error && (
        <div className="ac2-feedback ac2-feedback--err">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          {error}
        </div>
      )}

      {/* ── Avatar hero ── */}
      <div className="ac2-hero">
        <div className="ac2-avatar-wrap">
          <div className="ac2-avatar">
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}/>
              : <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
            }
          </div>
          <input type="file" id="avatar-upload" accept="image/*" style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const fd = new FormData();
              fd.append('avatar', file);
              try {
                const res = await api.post('/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                setUser(prev => ({ ...prev, avatar: res.data.avatar }));
              } catch (err) { console.error(err); }
            }}
          />
          <button className="ac2-avatar-btn" onClick={() => document.getElementById('avatar-upload').click()}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
        </div>
        <div className="ac2-hero-info">
          <div className="ac2-hero-name">{user?.name || 'User'}</div>
          <div className="ac2-hero-email">{user?.email || '—'}</div>
          <div className="ac2-hero-badge">
            <span className="ac2-badge-dot"/>
            QA Engineer
          </div>
        </div>
      </div>

      {/* ── Two columns ── */}
      <div className="ac2-grid">

        {/* LEFT — Profile */}
        <div className="ac2-card">
          <div className="ac2-card-head">
            <div className="ac2-card-head-icon">{IconUser}</div>
            <div>
              <div className="ac2-card-title">{t('profileInformation')}</div>
              <div className="ac2-card-sub">Update your display name and email</div>
            </div>
          </div>

          <div className="ac2-card-body">
            <FloatField
              label={t('fullName')}
              value={name}
              onChange={setName}
              type="text"
              icon={IconUser}
            />
            <FloatField
              label={t('emailAddress')}
              value={email}
              onChange={setEmail}
              type="email"
              icon={IconMail}
            />

            <button className="ac2-btn" onClick={saveProfile} disabled={loading}>
              {loading ? (
                <><span className="spinner"/> {t('saving')}</>
              ) : (
                <>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  {t('saveChanges')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT — Security */}
        <div className="ac2-card">
          <div className="ac2-card-head">
            <div className="ac2-card-head-icon">{IconShield}</div>
            <div>
              <div className="ac2-card-title">{t('changePassword')}</div>
              <div className="ac2-card-sub">Keep your account secure</div>
            </div>
          </div>

          <div className="ac2-card-body">
            <FloatField
              label={t('currentPassword')}
              value={currPwd}
              onChange={setCurrPwd}
              type="password"
              icon={IconLock}
            />
            <FloatField
              label={t('newPassword')}
              value={newPwd}
              onChange={setNewPwd}
              type="password"
              icon={IconLock}
            />
            <FloatField
              label={t('confirmNewPassword')}
              value={confirmPwd}
              onChange={setConfirmPwd}
              type="password"
              icon={IconLock}
            />

            {/* Password strength */}
            {newPwd.length > 0 && (
              <div className="ac2-strength">
                <div className="ac2-strength-bars">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className={`ac2-strength-bar ${
                      newPwd.length >= n * 3
                        ? n <= 1 ? 'weak' : n <= 2 ? 'fair' : n <= 3 ? 'good' : 'strong'
                        : ''
                    }`}/>
                  ))}
                </div>
                <span className="ac2-strength-label">
                  {newPwd.length < 4 ? 'Weak' : newPwd.length < 7 ? 'Fair' : newPwd.length < 10 ? 'Good' : 'Strong'}
                </span>
              </div>
            )}

            <button className="ac2-btn ac2-btn--indigo" onClick={changePassword} disabled={loading}>
              {loading ? (
                <><span className="spinner"/> {t('updating')}</>
              ) : (
                <>
                  {IconShield}
                  {t('updatePassword')}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings Panel
// ─────────────────────────────────────────────────────────────────────────────

function SettingsPanel({ theme, setTheme }) {
  const { t, setLanguage: applyLang } = useLang();
  const [notifs,    setNotifs]    = useState(true);
  const [weekly,    setWeekly]    = useState(false);
  const [framework, setFramework] = useState('Selenium');
  const [language,  setLanguage]  = useState('en');
  const [msg,       setMsg]       = useState('');
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    api.get('/settings').then(res => {
      setNotifs(res.data.email_notifications);
      setWeekly(res.data.weekly_report);
      setFramework(res.data.default_framework);
      if (!theme || theme === 'light') setTheme(res.data.theme || 'light');
      setLanguage(res.data.language || 'en');
    });
  }, []);

  const saveSettings = async () => {
    setLoading(true); setMsg('');
    try {
      await api.put('/settings/update', { email_notifications: notifs, weekly_report: weekly, default_framework: framework, theme, language });
      applyLang(language);
      setMsg(t('settingsSaved'));
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const LANGS = [
    { code: 'en', label: 'English',  flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية',  flag: '🇹🇳' },
  ];

  return (
    <div className="panel">
      <div className="p-header">
        <div><h1 className="p-title">{t('appSettings')} <span className="g">{t('settings')}</span></h1><p className="p-sub">{t('customize')}</p></div>
        <button className="btn-primary" onClick={saveSettings} disabled={loading}>
          {loading ? <><span className="spinner" />{t('saving')}</> : <>{t('saveSettings')}</>}
        </button>
      </div>
      {msg && <div className="success-msg">✓ {msg}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="set-group">
          <div className="set-group-title">{t('notifications')}</div>
          <div className="set-row"><div><div className="set-name">{t('emailNotif')}</div><div className="set-desc">{t('emailNotifDesc')}</div></div><div className={`toggle${notifs ? ' on' : ''}`} onClick={() => setNotifs(p => !p)}><span className="toggle-knob" /></div></div>
          <div className="set-row"><div><div className="set-name">{t('weeklyReport')}</div><div className="set-desc">{t('weeklyReportDesc')}</div></div><div className={`toggle${weekly ? ' on' : ''}`} onClick={() => setWeekly(p => !p)}><span className="toggle-knob" /></div></div>
        </div>
        <div className="set-group">
          <div className="set-group-title">{t('exportDefaults')}</div>
          <div className="set-row"><div><div className="set-name">{t('defaultFramework')}</div><div className="set-desc">{t('defaultFrameworkDesc')}</div></div>
            <select className="set-select" value={framework} onChange={e => setFramework(e.target.value)}>
              <option>Selenium</option><option>Cypress</option><option>Playwright</option><option>Both</option>
            </select>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="set-group">
          <div className="set-group-title">{t('appearance')}</div>
          <div style={{ padding: '16px 20px' }}>
            <div className="set-name" style={{ marginBottom: 4 }}>{t('theme')}</div>
            <div className="set-desc" style={{ marginBottom: 14 }}>{t('themeDesc')}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[{ key: 'light', emoji: '☀️', label: 'Light' }, { key: 'dark', emoji: '🌙', label: 'Dark' }, { key: 'system', emoji: '💻', label: 'System' }].map(th => (
                <div key={th.key} onClick={() => { setTheme(th.key); api.put('/settings/update', { theme: th.key }); }} style={{ flex: 1, padding: '14px 12px', borderRadius: 12, cursor: 'pointer', border: theme === th.key ? '2px solid var(--gold)' : '1.5px solid var(--border)', background: theme === th.key ? 'var(--goldbg)' : 'var(--bg)', transition: 'all .2s', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{th.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: theme === th.key ? 'var(--gold)' : 'var(--muted)' }}>{th.label}</div>
                  {theme === th.key && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', margin: '6px auto 0' }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="set-group">
          <div className="set-group-title">{t('language')}</div>
          <div style={{ padding: '16px 20px' }}>
            <div className="set-name" style={{ marginBottom: 4 }}>{t('interfaceLang')}</div>
            <div className="set-desc" style={{ marginBottom: 14 }}>{t('langDesc')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LANGS.map(l => (
                <div key={l.code} onClick={() => setLanguage(l.code)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, cursor: 'pointer', border: language === l.code ? '2px solid var(--gold)' : '1.5px solid var(--border)', background: language === l.code ? 'var(--goldbg)' : 'var(--bg)', transition: 'all .2s' }}>
                  <span style={{ fontSize: 20 }}>{l.flag}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: language === l.code ? 'var(--gold)' : 'var(--muted)', flex: 1 }}>{l.label}</span>
                  {language === l.code && <svg width="16" height="16" fill="none" stroke="var(--gold)" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [page,       setPage]      = useState('dashboard');
  const [collapsed,  setCollapse]  = useState(false);
  const [theme,      setTheme]     = useState('light');
  const [generation, setGeneration] = useState(null);
  const { user, logout } = useAuth();
  const { t }            = useLang();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const NAV_MAIN = [
    { id: 'dashboard', label: t('dashboard'),     badge: null     },
    { id: 'generate',  label: t('newGeneration'), badge: t('new') },
    { id: 'execution', label: t('testExecution'), badge: null     },
    { id: 'history',   label: t('history'),       badge: null     },
  ];
  const NAV_USER = [
    { id: 'account',  label: t('account')  },
    { id: 'settings', label: t('settings') },
  ];
  const LABELS = {
    dashboard: t('dashboard'), generate: t('newGeneration'),
    execution: t('testExecution'), history: t('history'),
    account: t('account'), settings: t('settings'),
  };

  return (
    <div className="dash-root" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <NexLogo collapsed={collapsed} />
        <button className="s-toggle" onClick={() => setCollapse(p => !p)}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
          </svg>
        </button>
        <nav className="s-nav">
          <div className="s-group">
            {!collapsed && <div className="s-label">{t('main')}</div>}
            {NAV_MAIN.map(it => (<SItem key={it.id} {...it} active={page === it.id} collapsed={collapsed} onClick={setPage} />))}
          </div>
          <div className="s-divider" />
          <div className="s-group">
            {!collapsed && <div className="s-label">{t('user')}</div>}
            {NAV_USER.map(it => (<SItem key={it.id} {...it} active={page === it.id} collapsed={collapsed} onClick={setPage} />))}
          </div>
        </nav>
        <div className="s-footer">
          <button className="s-item s-logout" onClick={logout} title={t('logout')}>
            <span className="s-icon">{IC.logout}</span>
            {!collapsed && <span className="s-label-txt">{t('logout')}</span>}
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="header">
          <div className="h-left">
            <div className="h-breadcrumb">
              <span className="h-bc-root">NexTest</span>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: '#e5e7f0' }}><path d="M9 18l6-6-6-6" /></svg>
              <span className="h-bc-page">{LABELS[page]}</span>
            </div>
          </div>
          <div className="h-search">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: '#9ca3af', flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder={t('searchPlaceholder')} />
          </div>
          <div className="h-right">
            <button className="h-icon-btn">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className="notif-dot" />
            </button>
            <div className="h-sep" />
            <div className="h-avatar">
              {user?.avatar ? <img src={user.avatar} alt="av" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>}
            </div>
            <div>
              <div className="h-user-name">{user?.name?.split(' ')[0] || 'User'}</div>
              <div className="h-user-role">{t('qaEngineer')}</div>
            </div>
          </div>
        </header>

        <div className="content">
          {page === 'dashboard' && <DashboardPanel user={user} goTo={setPage} />}
          {page === 'generate'  && <GeneratePanel  goTo={setPage} setGeneration={setGeneration} />}
          {page === 'execution' && <ExecutionPanel generation={generation} />}
          {page === 'history'   && <HistoryPanel   goTo={setPage} setGeneration={setGeneration} />}
          {page === 'account'   && <AccountPanel   user={user} />}
          {page === 'settings'  && <SettingsPanel  theme={theme} setTheme={setTheme} />}
        </div>
      </div>
    </div>
  );
}
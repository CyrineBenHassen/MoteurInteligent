import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import api from '../../api/axios';
import './Dashboard.css';
import { createPortal } from 'react-dom';
import NextestChatbot from '../../pages/Chatboot/Nextestchatbot';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';

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
      <div className="nav__gem nex-icon" style={{ background: 'linear-gradient(135deg, #8a6a00, #C9A227, #E8C84A)', boxShadow: '0 4px 16px rgba(201,162,39,0.5)' }}>
        <svg width="22" height="22" viewBox="0 0 44 44" fill="none">
          <circle cx="22" cy="22" r="17" stroke="#060e1e" strokeWidth="2" fill="none" opacity="0.6" />
          <polyline points="13,22 20,30 32,14" stroke="#060e1e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
      {!collapsed && (
        <div className="logo-words">
          <div className="nav__name nex-name">NexTest</div>
          <div className="nav__sub">Test Automation</div>
        </div>
      )}
    </div>
  );
}

function ThemeToggle({ theme, setTheme }) {
  const isDark = theme !== 'light';
  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('nextest-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };
  return (
    <button onClick={toggle} className={`tt-btn${isDark ? '' : ' tt-btn--light'}`} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} aria-label="Toggle theme">
      <span className="tt-track">
        <span className="tt-knob">
          {isDark ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </span>
        <span className="tt-hint tt-hint--sun">☀</span>
        <span className="tt-hint tt-hint--moon">☽</span>
      </span>
    </button>
  );
}

const IC = {
  dashboard: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  generate:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
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

function AssertionBadge({ assertion_result, step_meta }) {
  const [open, setOpen] = useState(false);
  if (!assertion_result) return null;
  const { passed, type, expected, actual, error } = assertion_result;
  const color  = passed ? '#10b981' : '#ef4444';
  const bg     = passed ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)';
  const border = passed ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)';
  const icon   = passed ? '✓' : '✗';
  const TYPE_LABELS = { url_contains: '🔗 URL', element_visible: '👁 Visible', element_exists: '🔍 Exists', text_contains: '📝 Text', input_value: '⌨ Input' };
  return (
    <div style={{ marginTop: 6 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, cursor: 'pointer', background: bg, border: `1px solid ${border}`, fontSize: 10, fontWeight: 700, color, userSelect: 'none', transition: 'all .15s' }}>
        <span>{icon}</span>
        <span>ASSERTION · {TYPE_LABELS[type] || type}</span>
        <span style={{ opacity: .6, fontSize: 9 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ marginTop: 6, padding: '10px 12px', borderRadius: 8, background: passed ? 'rgba(16,185,129,.04)' : 'rgba(239,68,68,.04)', border: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {step_meta && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
              <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: 'rgba(79,134,232,.1)', color: '#4f86e8', border: '1px solid rgba(79,134,232,.2)' }}>{step_meta.action}</span>
              <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)', fontFamily: 'monospace', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step_meta.selector}</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Expected</div>
              <div style={{ padding: '5px 8px', borderRadius: 6, fontSize: 10, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--navy)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{expected || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: passed ? '#10b981' : '#ef4444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Actual</div>
              <div style={{ padding: '5px 8px', borderRadius: 6, fontSize: 10, background: passed ? 'rgba(16,185,129,.06)' : 'rgba(239,68,68,.06)', border: `1px solid ${border}`, color: passed ? '#059669' : '#dc2626', fontFamily: 'monospace', wordBreak: 'break-all' }}>{actual || '—'}</div>
            </div>
          </div>
          {!passed && error && <div style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)', fontSize: 10, color: '#dc2626' }}>⚠ {error}</div>}
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
            <div className="stat-card-top"><div className="stat-icon-wrap">{s.icon}</div></div>
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

export function ProjectsListPanel({ onNewProject, onSelectProject }) {
  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [deleting,   setDeleting]   = useState(null);
  const [search,     setSearch]     = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setDeleting(id);
    try { await api.delete(`/projects/${id}`); setProjects(prev => prev.filter(p => p.id !== id)); } catch (err) { console.error(err); }
    setDeleting(null);
  };

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchType   = filterType === 'all' || p.type === filterType;
    return matchSearch && matchType;
  });

  const totalPublic   = projects.filter(p => p.type === 'public').length;
  const totalInternal = projects.filter(p => p.type === 'internal').length;

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60)    return `${Math.floor(diff)}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="panel">
      <div className="p-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="p-title">My <span className="g">Projects</span></h1>
          <p className="p-sub">Select a project to generate tests, or create a new one.</p>
        </div>
        <button className="btn-primary" onClick={onNewProject}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          New Project
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { icon: '📁', val: projects.length, lbl: 'Total Projects',    accent: 'linear-gradient(90deg,#6366f1,#818cf8)' },
          { icon: '🌐', val: totalPublic,     lbl: 'Public Projects',   accent: 'linear-gradient(90deg,#4f86e8,#6fa3ff)' },
          { icon: '🔒', val: totalInternal,   lbl: 'Internal Projects', accent: 'linear-gradient(90deg,#8b5cf6,#a78bfa)' },
          
        ].map((s, i) => (
          <div key={s.lbl} className="stat-card" style={{ '--i': i, minHeight: 120 }}>
            <div className="stat-card-top"><div className="stat-icon-wrap">{s.icon}</div></div>
            <span className="stat-val" style={{ fontSize: 40 }}>{s.val}</span>
            <span className="stat-lbl">{s.lbl}</span>
            <div className="stat-accent" style={{ background: s.accent }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
          <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', width: '100%' }} placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        {['all', 'public', 'internal'].map(f => (
          <button key={f} onClick={() => setFilterType(f)} style={{ padding: '9px 16px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.5px', border: filterType === f ? 'none' : '1.5px solid var(--border)', background: filterType === f ? (f === 'public' ? '#4f86e8' : f === 'internal' ? '#8b5cf6' : 'var(--indigo)') : 'var(--card)', color: filterType === f ? '#fff' : 'var(--muted)', boxShadow: filterType === f ? '0 2px 10px rgba(99,102,241,.3)' : 'none', transition: 'all .18s', textTransform: 'capitalize' }}>
            {f === 'all' ? 'All' : f === 'public' ? '🌐 Public' : '🔒 Internal'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--muted)', padding: '6px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}>
          {filtered.length} project{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', opacity: .5 }}>
              <div style={{ height: 14, borderRadius: 4, background: 'var(--border)', width: '40%', marginBottom: 10 }} />
              <div style={{ height: 11, borderRadius: 4, background: 'var(--border)', width: '60%' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--indigo-bg)', border: '1px solid var(--indigo-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 20 }}>📁</div>
          <h3 style={{ fontFamily: 'var(--C)', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{search || filterType !== 'all' ? 'No results found' : 'No projects yet'}</h3>
          <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.7, maxWidth: 300, marginBottom: 24 }}>{search || filterType !== 'all' ? 'Try adjusting your search or filters' : 'Create your first project to start generating tests'}</p>
          {!search && filterType === 'all' && (
            <button className="btn-primary" onClick={onNewProject}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              Create First Project
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map((project, i) => {
            const isPublic = project.type === 'public';
            const color   = isPublic ? '#4f86e8' : '#8b5cf6';
            const colorBg = isPublic ? 'rgba(79,134,232,.08)' : 'rgba(139,92,246,.08)';
            const colorBd = isPublic ? 'rgba(79,134,232,.2)'  : 'rgba(139,92,246,.2)';
            return (
              <div key={project.id} onClick={() => onSelectProject(project)}
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'all .25s', animation: `dFadeUp .35s var(--ease) ${i * 0.05}s both`, boxShadow: 'var(--shadow)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,.3), 0 0 0 1px ${color}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: colorBg, border: `1px solid ${colorBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{isPublic ? '🌐' : '🔒'}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{project.name}</div>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20, color, background: colorBg, border: `1px solid ${colorBd}` }}>{isPublic ? 'Public' : 'Internal'}</span>
                    </div>
                  </div>
                  <button onClick={(e) => handleDelete(e, project.id)} disabled={deleting === project.id}
                    style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .18s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.borderColor = 'var(--red-border)'; e.currentTarget.style.color = 'var(--red)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}>
                    {deleting === project.id ? '...' : (<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>)}
                  </button>
                </div>
                {project.description ? (
                  <p style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{project.description}</p>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--dimmed)', fontStyle: 'italic', marginBottom: 16 }}>No description</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--border3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    {project.generations_count || 0} generation{project.generations_count !== 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {timeAgo(project.created_at)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color, letterSpacing: '.5px', textTransform: 'uppercase' }}>
                    Open
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ProjectDetailPanel({ project, onBack, onNewGeneration, setGeneration, goTo }) {
  const [generations, setGenerations] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [deleting,    setDeleting]    = useState(null);

  const isPublic = project?.type === 'public';
  const color    = isPublic ? '#4f86e8' : '#8b5cf6';
  const colorBg  = isPublic ? 'rgba(79,134,232,.08)' : 'rgba(139,92,246,.08)';
  const colorBd  = isPublic ? 'rgba(79,134,232,.2)'  : 'rgba(139,92,246,.2)';

  useEffect(() => {
    api.get(`/projects/${project.id}/generations`).then(res => setGenerations(res.data)).catch(console.error).finally(() => setLoading(false));
  }, [project.id]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try { await api.delete(`/generations/${id}`); setGenerations(prev => prev.filter(g => g.id !== id)); } catch (e) { console.error(e); }
    setDeleting(null);
  };

  const handleView = (item) => {
    setGeneration({
      url: item.url, framework: item.framework, test_type: item.test_type,
      generation: { id: item.id, url: item.url, framework: item.framework, load_time_ms: item.load_time_ms, test_type: item.test_type },
      result: {
        test_type: item.test_type || 'smoke', test_cases: item.test_cases || [],
        test_cases_selenium: item.test_cases_selenium || [], test_cases_cypress: item.test_cases_cypress || [],
        script: item.script || '', script_selenium: item.script_selenium || '',
        script_playwright: item.script_playwright || '', script_cypress: item.script_cypress || '',
        execution_results: item.execution_results || [],
        performance: item.performance_data || item.performance || null,
      },
    });
    goTo('execution');
  };

  const totalGen  = generations.length;
  const avgRate   = totalGen ? Math.round(generations.reduce((s, g) => s + (g.pass_rate || 0), 0) / totalGen) : 0;
  const totalPass = generations.reduce((s, g) => s + (g.pass_count || 0), 0);
  const urlCards  = generations;
  const rateColor = (r) => r >= 80 ? '#10b981' : r >= 50 ? '#f59e0b' : '#ef4444';
  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60)    return `${Math.floor(diff)}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };
  const FW_CONFIG = {
    Selenium:   { color: '#43B02A', letters: 'Se' },
    Cypress:    { color: '#00BFA5', letters: 'Cy' },
    Playwright: { color: '#E2574C', letters: 'Pl' },
    Both:       { color: '#C9A227', letters: '∞'  },
  };

  return (
    <div className="panel">
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 20px', transition: 'color .18s', letterSpacing: '.5px', textTransform: 'uppercase' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--indigo2)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to projects
      </button>

      <div className="p-header" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: colorBg, border: `1px solid ${colorBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
            {isPublic ? '🌐' : '🔒'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 className="p-title" style={{ marginBottom: 0 }}>{project?.name}</h1>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, color, background: colorBg, border: `1px solid ${colorBd}` }}>{isPublic ? 'Public' : 'Internal'}</span>
            </div>
            <p className="p-sub" style={{ marginBottom: 0 }}>{project?.description || 'No description'}</p>
          </div>
        </div>
        <button className="btn-primary" onClick={onNewGeneration}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          New Generation
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { icon: '🚀', val: totalGen,       lbl: 'Generations',       accent: `linear-gradient(90deg,${color},${color}88)` },
          { icon: '🔗', val: urlCards.length, lbl: 'Total Generations', accent: 'linear-gradient(90deg,#6366f1,#818cf8)' },
          { icon: '✅', val: totalPass,      lbl: 'Total Passed',      accent: 'linear-gradient(90deg,#10b981,#34d399)' },
          { icon: '🎯', val: `${avgRate}%`,  lbl: 'Avg Pass Rate',     accent: avgRate >= 80 ? 'linear-gradient(90deg,#10b981,#34d399)' : avgRate >= 50 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)' },
        ].map((s, i) => (
          <div key={s.lbl} className="stat-card" style={{ '--i': i, minHeight: 110 }}>
            <div className="stat-card-top"><div className="stat-icon-wrap">{s.icon}</div></div>
            <span className="stat-val" style={{ fontSize: 36 }}>{s.val}</span>
            <span className="stat-lbl">{s.lbl}</span>
            <div className="stat-accent" style={{ background: s.accent }} />
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, opacity: .5 }}>
              <div style={{ height: 14, borderRadius: 4, background: 'var(--border)', width: '40%', marginBottom: 10 }} />
              <div style={{ height: 10, borderRadius: 4, background: 'var(--border)', width: '60%' }} />
            </div>
          ))}
        </div>
      ) : urlCards.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: colorBg, border: `1px solid ${colorBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 20 }}>⚡</div>
          <h3 style={{ fontFamily: 'var(--C)', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No generations yet</h3>
          <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.7, maxWidth: 300, marginBottom: 24 }}>Start generating tests for this project</p>
          <button className="btn-primary" onClick={onNewGeneration}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            New Generation
          </button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>🔗 All Generations — {urlCards.length} total</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {urlCards.map((item, i) => {
              const fw    = FW_CONFIG[item.framework] || FW_CONFIG.Selenium;
              const rawRate = item.pass_rate != null ? item.pass_rate : (
  item.pass_count != null && (item.pass_count + item.fail_count + item.skip_count) > 0
    ? Math.round(item.pass_count / (item.pass_count + item.fail_count + item.skip_count) * 100)
    : 0
);
const rc = rateColor(rawRate);
              const total = (item.pass_count || 0) + (item.fail_count || 0) + (item.skip_count || 0);
              return (
                <div key={item.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', transition: 'all .25s', position: 'relative', overflow: 'hidden', animation: `dFadeUp .3s var(--ease) ${i * 0.05}s both` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,.2), 0 0 0 1px ${color}`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${rc}, transparent)` }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, background: `${rc}15`, border: `2px solid ${rc}44`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: rc, lineHeight: 1 }}>
                        {item.test_type === 'performance' && (item.performance_data?.global_score ?? item.performance?.global_score) != null
                          ? (item.performance_data?.global_score ?? item.performance?.global_score)
                          : item.pass_rate || 0}%
                      </span>
                      <span style={{ fontSize: 8, color: 'var(--muted)', letterSpacing: .5 }}>PASS</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 6 }}>{item.url}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: fw.color, background: `${fw.color}15`, border: `1px solid ${fw.color}30` }}>{fw.letters} · {item.framework}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{total} tests</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>· {timeAgo(item.created_at)}</span>
                      </div>
                      <div style={{ display: 'flex', height: 4, borderRadius: 4, overflow: 'hidden', marginTop: 10, background: 'var(--border)' }}>
                        <div style={{ width: `${total ? (item.pass_count || 0) / total * 100 : 0}%`, background: '#10b981' }} />
                        <div style={{ width: `${total ? (item.fail_count || 0) / total * 100 : 0}%`, background: '#ef4444' }} />
                        <div style={{ width: `${total ? (item.skip_count || 0) / total * 100 : 0}%`, background: '#f59e0b' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                        {[{ val: item.pass_count || 0, color: '#10b981', lbl: 'pass' }, { val: item.fail_count || 0, color: '#ef4444', lbl: 'fail' }, { val: item.skip_count || 0, color: '#f59e0b', lbl: 'skip' }].map(s => (
                          <span key={s.lbl} style={{ fontSize: 11, color: s.color, fontWeight: 700 }}>{s.val} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{s.lbl}</span></span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => handleView(item)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: `linear-gradient(135deg, ${color}, ${color}cc)`, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.5px', boxShadow: `0 3px 10px ${color}44`, transition: 'all .2s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        View
                      </button>
                      <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                        style={{ width: '100%', padding: '7px', borderRadius: 8, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .18s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.borderColor = 'var(--red-border)'; e.currentTarget.style.color = 'var(--red)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}>
                        {deleting === item.id ? '...' : (<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>)}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CreateProjectPanel
// ─────────────────────────────────────────────────────────────────────────────

export function CreateProjectPanel({ onProjectCreated }) {
  const [projectType, setProjectType] = useState(null);
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [nameError,   setNameError]   = useState('');
  const inputRef = useRef(null);

  const isReady = projectType !== null && name.trim().length > 0;
  const SUGGESTIONS = {
    public:   ['Login Flow QA', 'Homepage E2E', 'Checkout Suite', 'Auth Regression'],
    internal: ['API Auth Tests', 'Internal Gateway', 'Microservice Suite', 'CI Security Scan'],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setNameError('Project name is required'); inputRef.current?.focus(); return; }
    if (!projectType) return;
    setSubmitting(true);
    try {
      const res = await api.post('/projects', { name: name.trim(), type: projectType, description: description.trim() });
      onProjectCreated(res.data);
    } catch (err) { console.error(err); setNameError('Error creating project, try again.'); }
    setSubmitting(false);
  };

  const fwConf = projectType === 'public' ? { bc: '#4f86e8', bshadow: 'rgba(79,134,232,.35)' } : projectType === 'internal' ? { bc: '#8b5cf6', bshadow: 'rgba(139,92,246,.35)' } : {};
  const CheckIcon = (<svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>);

  const steps = [
    { n: 1, label: 'Project Type', val: projectType ? (projectType === 'public' ? '🌐 Public Test' : '🔒 Internal Test') : 'Not selected yet', done: !!projectType, active: !projectType },
    { n: 2, label: 'Project Name', val: name.trim() || 'Enter a name…', done: name.trim().length > 0, active: !!projectType && !name.trim() },
    { n: 3, label: 'Description', val: description.trim() ? description.trim().slice(0, 30) + (description.length > 30 ? '…' : '') : 'Optional — skip if not needed', done: description.trim().length > 0, active: !!projectType && name.trim().length > 0 },
    { n: 4, label: 'Launch Project', val: isReady ? 'Ready to launch →' : 'Complete fields above', done: false, active: isReady },
  ];

  return (
    <div className="cpv5-root">
      <div className="p-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="p-title">New <span className="g">Project</span></h1>
          <p className="p-sub">Configure your project — your test options will adapt to the type you choose.</p>
        </div>
        {isReady && (<div className="gp-ready-badge"><span className="gp-ready-dot" />Ready to launch</div>)}
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
          <div className="cpv5-left">
            <div className="cpv5-section">
              <div className="cpv5-section-header">
                <span className="cpv5-sec-num">01</span>
                <div><div className="cpv5-sec-title">Project Type</div><div className="cpv5-sec-sub">Choose the kind of application you want to test</div></div>
              </div>
              <div className="cpv5-type-grid">
                <div className={`cpv5-type-card${projectType === 'public' ? ' selected' : ''}`} style={{ '--tc': '#4f86e8', '--tg': 'rgba(79,134,232,.1)', '--tb': 'rgba(79,134,232,.25)' }} onClick={() => setProjectType('public')}>
                  <div className="cpv5-type-top"><div className="cpv5-type-icon">🌐</div>{projectType === 'public' && <div className="cpv5-type-check">{CheckIcon}</div>}</div>
                  <div className="cpv5-type-name">Public Test</div>
                  <div className="cpv5-type-desc">Web apps, landing pages & user-facing interfaces</div>
                  <div className="cpv5-type-tags"><span>Smoke</span><span>Functional</span><span>Performance</span></div>
                  <div className="cpv5-type-fws"><span style={{ color: '#43B02A' }}>Selenium</span><span style={{ color: '#00BFA5' }}>Cypress</span><span style={{ color: '#E2574C' }}>Playwright</span></div>
                  <div className="cpv5-type-edge" />
                </div>
                <div className={`cpv5-type-card${projectType === 'internal' ? ' selected' : ''}`} style={{ '--tc': '#8b5cf6', '--tg': 'rgba(139,92,246,.1)', '--tb': 'rgba(139,92,246,.25)' }} onClick={() => setProjectType('internal')}>
                  <div className="cpv5-type-top"><div className="cpv5-type-icon">🔒</div>{projectType === 'internal' && <div className="cpv5-type-check">{CheckIcon}</div>}</div>
                  <div className="cpv5-type-name">Internal Test</div>
                  <div className="cpv5-type-desc">APIs, microservices & private infrastructure</div>
                  <div className="cpv5-type-tags"><span>Unit</span><span>Regression</span><span>Security</span></div>
                  <div className="cpv5-type-fws"><span style={{ color: '#E2574C' }}>Playwright</span><span style={{ color: '#43B02A' }}>Selenium</span></div>
                  <div className="cpv5-type-edge" />
                </div>
              </div>
            </div>
            <div className="cpv5-section">
              <div className="cpv5-section-header">
                <span className="cpv5-sec-num">02</span>
                <div><div className="cpv5-sec-title">Project Name</div><div className="cpv5-sec-sub">Give your project a clear, descriptive name</div></div>
              </div>
              <div className={`cpv5-input-wrap${nameError ? ' error' : ''}${name ? ' filled' : ''}`}>
                <svg className="cpv5-input-ico" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <input ref={inputRef} className="cpv5-input" type="text" placeholder="e.g. Login Flow QA" value={name} maxLength={60} onChange={e => { setName(e.target.value); setNameError(''); }} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} autoComplete="off" />
                {name.length > 0 && <span className="cpv5-input-count">{name.length}/60</span>}
              </div>
              {nameError && (<div className="cpv5-error"><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>{nameError}</div>)}
              {projectType && (
                <div className="cpv5-suggestions">
                  {SUGGESTIONS[projectType].map(s => (
                    <button key={s} type="button" className="cpv5-sug"
                      style={projectType === 'public' ? { '--sc': '#4f86e8', '--sb': 'rgba(79,134,232,.08)', '--sbo': 'rgba(79,134,232,.2)' } : { '--sc': '#8b5cf6', '--sb': 'rgba(139,92,246,.08)', '--sbo': 'rgba(139,92,246,.2)' }}
                      onClick={() => { setName(s); setNameError(''); }}>{s}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="cpv5-section">
              <div className="cpv5-section-header">
                <span className="cpv5-sec-num">03</span>
                <div>
                  <div className="cpv5-sec-title">Description <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '2px 8px', marginLeft: 8 }}>optional</span></div>
                  <div className="cpv5-sec-sub">Briefly describe what this project tests</div>
                </div>
              </div>
              <div className="cpv5-textarea-wrap">
                <textarea className="cpv5-textarea" placeholder="e.g. End-to-end tests for the login flow including OAuth and 2FA…" value={description} maxLength={280} rows={4} onChange={e => setDescription(e.target.value)} />
                {description.length > 0 && <span className="cpv5-textarea-count">{description.length}/280</span>}
              </div>
              <div className="cpv5-optional-hint"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>You can always add or edit the description later from project settings.</div>
            </div>
            <button type="submit" className={`cpv5-submit${isReady ? ' colored' : ''}`} disabled={submitting || !isReady} style={projectType ? { '--bc': fwConf.bc, '--bshadow': fwConf.bshadow } : {}}>
              {submitting ? (<><span className="spinner" /> Creating project…</>) : (<><svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>{isReady ? 'Launch Project →' : 'Fill in the fields above'}</>)}
            </button>
          </div>
          <div className="cpv5-right">
            <div className="cpv5-progress-card">
              <div className="cpv5-progress-head"><span className="cpv5-progress-head-dot" />Project Setup</div>
              <div className="cpv5-steps">
                {steps.map((s, i) => (
                  <div key={s.n} className="cpv5-step-row">
                    <div className="cpv5-step-left">
                      <div className={`cpv5-step-circle${s.done ? ' done' : s.active ? ' active' : ''}`}>
                        {s.done ? (<svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>) : s.n}
                      </div>
                      {i < steps.length - 1 && (<div className={`cpv5-step-line${s.done ? ' done' : ''}`} />)}
                    </div>
                    <div className="cpv5-step-body">
                      <div className={`cpv5-step-title${s.done ? ' done' : s.active ? ' active' : ''}`}>{s.label}</div>
                      <div className={`cpv5-step-val${s.done || (s.active && s.val !== 'Not selected yet' && s.val !== 'Enter a name…') ? ' filled' : ''}`}>{s.val}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className={`cpv5-summary-status${isReady ? ' ready' : ' waiting'}`}>
                <span className={`cpv5-status-dot${isReady ? ' ready' : ''}`} />
                {isReady ? 'Ready to launch your project' : 'Complete the required fields'}
              </div>
            </div>
            <div className="cpv5-tips-card">
              <div className="cpv5-tips-head"><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>What happens next</div>
              <div className="cpv5-tips-body">
                {[{ icon: '🔗', text: 'Enter the URL or API endpoint you want to test' }, { icon: '🎯', text: 'Choose your test type: Smoke, Functional, or Performance' }, { icon: '⚡', text: 'Select a framework' }, { icon: '📄', text: 'Download your generated test scripts instantly' }].map((tip, i) => (
                  <div key={i} className="cpv5-tip-row"><div className="cpv5-tip-icon">{tip.icon}</div><div className="cpv5-tip-text">{tip.text}</div></div>
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
// GeneratePanel
// ─────────────────────────────────────────────────────────────────────────────

function GeneratePanel({ goTo, setGeneration, project, initialUrl = '' }) {
  const { t } = useLang();
  const [url,      setUrl]      = useState(initialUrl);
  const [fw,       setFw]       = useState('');
  const [testType, setTestType] = useState('');
  const [loading,  setLoad]     = useState(false);
  const [error,    setError]    = useState('');
  const [urlValid, setUrlValid] = useState(() => {
    if (!initialUrl) return null;
    try { new URL(initialUrl); return true; } catch { return false; }
  });

  const isInternal = project?.type === 'internal';

  const PUBLIC_TEST_TYPES = [
    { key: 'smoke',       label: 'Smoke Test',       desc: 'Visibility checks — elements present in DOM',                   letter: 'S', letterClass: 'gp4-letter-s', badge: 'Quick',    badgeClass: 'gp-badge-quick', time: '~30s'  },
    { key: 'functional',  label: 'Functional Test',  desc: 'Interactions — click, fill, submit + assertions',              letter: 'F', letterClass: 'gp4-letter-f', badge: 'Medium',   badgeClass: 'gp-badge-mid',   time: '~1min' },
    { key: 'performance', label: 'Performance Test', desc: 'Web Vitals: LCP, FCP, TTI, Load Time, Resource Size',          letter: 'P', letterClass: 'gp4-letter-r', badge: 'Advanced', badgeClass: 'gp-badge-full',  time: '~3min' },
  ];
  const INTERNAL_TEST_TYPES = [
    { key: 'smoke',       label: 'Smoke Test',       desc: 'Visibility checks — elements present in DOM',                  letter: 'S', letterClass: 'gp4-letter-s',    badge: 'Quick',    badgeClass: 'gp-badge-quick', time: '~30s'  },
    { key: 'functional',  label: 'Functional Test',  desc: 'Interactions — click, fill, submit + assertions',             letter: 'F', letterClass: 'gp4-letter-f',    badge: 'Medium',   badgeClass: 'gp-badge-mid',   time: '~1min' },
    { key: 'performance', label: 'Performance Test', desc: 'Web Vitals: LCP, FCP, TTI, Load Time, Resource Size',         letter: 'P', letterClass: 'gp4-letter-r',    badge: 'Advanced', badgeClass: 'gp-badge-full',  time: '~3min' },
    { key: 'unit',        label: 'Unit Test',        desc: 'Test individual functions and components in isolation',        letter: 'U', letterClass: 'gp4-letter-unit', badge: 'Fast',     badgeClass: 'gp-badge-quick', time: '~15s'  },
    { key: 'regression',  label: 'Regression Test',  desc: 'Ensure existing features still work after changes',           letter: 'R', letterClass: 'gp4-letter-reg',  badge: 'Thorough', badgeClass: 'gp-badge-mid',   time: '~3min' },
    { key: 'security',    label: 'Security Test',    desc: 'Check for vulnerabilities, auth issues, injection risks',     letter: 'S', letterClass: 'gp4-letter-sec',  badge: 'Critical', badgeClass: 'gp-badge-full',  time: '~5min' },
  ];
  const PUBLIC_FRAMEWORKS   = [{ key: 'Selenium', color: '#43B02A', letters: 'Se', letterClass: 'gp4-letter-se' }, { key: 'Cypress', color: '#00BFA5', letters: 'Cy', letterClass: 'gp4-letter-cy' }, { key: 'Playwright', color: '#E2574C', letters: 'Pl', letterClass: 'gp4-letter-pl' }];
  const INTERNAL_FRAMEWORKS = [{ key: 'Playwright', color: '#E2574C', letters: 'Pl', letterClass: 'gp4-letter-pl' }, { key: 'Selenium', color: '#43B02A', letters: 'Se', letterClass: 'gp4-letter-se' }, { key: 'Cypress', color: '#00BFA5', letters: 'Cy', letterClass: 'gp4-letter-cy' }];
  const PERFORMANCE_FRAMEWORKS = [{ key: 'Playwright', color: '#E2574C', letters: 'Pl', letterClass: 'gp4-letter-pl', note: 'Web Vitals' }];
  const BACKEND_FRAMEWORKS     = [{ key: 'k6', color: '#7D64FF', letters: 'k6', letterClass: 'gp4-letter-k6', note: 'Load Test' }];

  const TEST_TYPES = isInternal ? INTERNAL_TEST_TYPES : PUBLIC_TEST_TYPES;
  const FRAMEWORKS = testType === 'performance' ? (isInternal ? [...PERFORMANCE_FRAMEWORKS, ...BACKEND_FRAMEWORKS] : PERFORMANCE_FRAMEWORKS) : isInternal ? INTERNAL_FRAMEWORKS : PUBLIC_FRAMEWORKS;

  const validateUrl = (val) => {
    try { new URL(val); setUrlValid(true); } catch { setUrlValid(val.length > 0 ? false : null); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoad(true); setError('');
    try {
      const res = await api.post('/generate', { url, framework: fw, test_type: testType, project_name: project?.name, project_type: project?.type, project_id: project?.id });
      const genData = res.data;
      if (genData.test_type === 'performance' || genData.result?.test_type === 'performance') {
        genData.result = genData.result || {};
        genData.result.performance = genData.performance || genData.result?.performance;
        genData.result.test_cases  = genData.result.test_cases || genData.generation?.test_cases || [];
      }
      setGeneration(genData);
      goTo('execution');
    } catch (err) { setError(err.response?.data?.error || 'Une erreur est survenue'); }
    setLoad(false);
  };

  const selectedType = TEST_TYPES.find(t => t.key === testType);
  const selectedFw   = FRAMEWORKS.find(f => f.key === fw);
  const isReady      = urlValid === true && testType !== '' && fw !== '';
  const urlPlaceholder = isInternal ? 'https://api.internal.company.com/v1' : 'https://myapp.com';
  const urlLabel       = isInternal ? 'Target URL or API Endpoint' : 'Target URL';
  const urlHint        = isInternal ? 'Supports REST API endpoints and internal services' : 'Enter the web application you want to test';

  return (
    <div className="panel">
      <div className="p-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="p-title">New <span className="g">Generation</span></h1>
          {project && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'var(--card)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)' }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                {project.name}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: isInternal ? 'rgba(139,92,246,.1)' : 'rgba(79,134,232,.1)', border: `1px solid ${isInternal ? 'rgba(139,92,246,.25)' : 'rgba(79,134,232,.25)'}`, fontSize: 12, fontWeight: 700, color: isInternal ? '#8b5cf6' : '#4f86e8' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: isInternal ? '#8b5cf6' : '#4f86e8' }} />
                {isInternal ? 'Internal' : 'Public'}
              </div>
            </div>
          )}
          <p className="p-sub" style={{ marginTop: 8 }}>{t('generateDesc')}</p>
        </div>
        {isReady && (<div className="gp-ready-badge"><span className="gp-ready-dot" />Ready to generate</div>)}
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 24 }}>✗ {error}</div>}

      <form onSubmit={submit}>
        <div className="gp4-layout">
          <div className="gp4-left">
            <div className="gp4-section">
              <div className="gp4-section-header">
                <span className="gp4-num">01</span>
                <div><div className="gp4-section-title">{urlLabel}</div><div className="gp4-section-sub">{urlHint}</div></div>
              </div>
              <div className={`gp4-url-wrap${urlValid === true ? ' valid' : urlValid === false ? ' invalid' : ''}`}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {isInternal ? <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/> : <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>}
                </svg>
                <input type="url" placeholder={urlPlaceholder} value={url} onChange={e => { setUrl(e.target.value); validateUrl(e.target.value); }} required />
                {urlValid === true  && <svg width="16" height="16" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>}
                {urlValid === false && <svg width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>}
              </div>
              {urlValid === false && <div className="gp4-url-error">Please enter a valid URL starting with https://</div>}
            </div>

            <div className="gp4-section">
              <div className="gp4-section-header">
                <span className="gp4-num">02</span>
                <div><div className="gp4-section-title">Test Type</div><div className="gp4-section-sub">{isInternal ? 'Choose testing strategy for internal services' : 'Choose the depth of test coverage'}</div></div>
              </div>
              <div className="gp4-types">
                {TEST_TYPES.map(tt => (
                  <div key={tt.key} className={`gp4-type-card${testType === tt.key ? ' selected' : ''}`} onClick={() => { setTestType(tt.key); setFw(''); }}>
                    <div className="gp4-type-left">
                      <div className={`gp4-letter-badge ${tt.letterClass}`}>{tt.letter}</div>
                      <div><div className="gp4-type-name">{tt.label}</div><div className="gp4-type-desc">{tt.desc}</div></div>
                    </div>
                    <div className="gp4-type-right">
                      <span className={`gp-badge ${tt.badgeClass}`}>{tt.badge}</span>
                      <span className="gp4-type-time">{tt.time}</span>
                      <div className="gp4-radio">{testType === tt.key && <div className="gp4-radio-dot" />}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="gp4-section">
              <div className="gp4-section-header">
                <span className="gp4-num">03</span>
                <div><div className="gp4-section-title">Framework</div><div className="gp4-section-sub">Export format for your test scripts</div></div>
              </div>
              <div className="gp4-frameworks">
                {FRAMEWORKS.map(f => (
                  <div key={f.key} className={`gp4-fw-card${fw === f.key ? ' selected' : ''}${f.note ? ' gp4-fw-card--optional' : ''}`} onClick={() => setFw(f.key)} style={{ '--fw-color': f.color }}>
                    <div className={`gp4-fw-letter-badge ${f.letterClass}`}>{f.letters}</div>
                    <span className="gp4-fw-name">{f.key}</span>
                    {f.note && <span className="gp4-fw-note">{f.note}</span>}
                    {fw === f.key && (<div className="gp4-fw-check"><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div>)}
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="gp4-submit" disabled={loading || !isReady}>
              {loading ? (<><span className="spinner" /> Analyzing & Generating...</>) : (<><svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>Generate Tests{isReady && <span className="gp4-submit-arrow">→</span>}</>)}
            </button>
          </div>

          <div className="gp4-right">
            <div className="gp4-summary-card">
              <div className="gp4-summary-head">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Configuration Summary
              </div>
              <div className="gp4-summary-body">
                {project && (<><div className="gp4-sum-row"><span className="gp4-sum-label">Project</span><span className="gp4-sum-val" style={{ fontSize: 11, color: 'var(--indigo3)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{project.name}</span></div><div className="gp4-sum-divider" /></>)}
                <div className="gp4-sum-row"><span className="gp4-sum-label">URL</span><span className="gp4-sum-val">{url ? <span style={{ color: urlValid ? 'var(--green)' : 'var(--red)', fontSize: 11, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{url}</span> : <span className="gp4-sum-empty">Not set</span>}</span></div>
                <div className="gp4-sum-divider" />
                <div className="gp4-sum-row"><span className="gp4-sum-label">Test Type</span><span className="gp4-sum-val">{selectedType?.label || <span className="gp4-sum-empty">Not selected</span>}</span></div>
                <div className="gp4-sum-divider" />
                <div className="gp4-sum-row"><span className="gp4-sum-label">Framework</span><span className="gp4-sum-val">{selectedFw?.key || <span className="gp4-sum-empty">Not selected</span>}</span></div>
                <div className="gp4-sum-divider" />
                <div className="gp4-sum-row"><span className="gp4-sum-label">Est. Time</span><span className="gp4-sum-val" style={{ color: 'var(--indigo2)' }}>{selectedType?.time || '—'}</span></div>
              </div>
              <div className={`gp4-summary-status ${isReady ? 'ready' : 'waiting'}`}>
                <span className={`gp4-status-dot ${isReady ? 'ready' : ''}`} />
                {isReady ? 'Ready to generate' : 'Complete all fields'}
              </div>
            </div>
            <div className="gp4-how-card">
              <div className="gp4-how-head"><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>How it works</div>
              <div className="gp4-how-steps">
                {[{ n: '01', title: t('domScanning'), desc: t('domScanningDesc'), icon: '🔍' }, { n: '02', title: t('aiAnalysis'), desc: t('aiAnalysisDesc'), icon: '🤖' }, { n: '03', title: t('testGeneration'), desc: t('testGenerationDesc'), icon: '⚡' }, { n: '04', title: t('scriptExport'), desc: t('scriptExportDesc'), icon: '📄' }].map((s, i, arr) => (
                  <div key={s.n} className="gp4-how-step">
                    <div className="gp4-how-step-left"><div className="gp4-how-circle">{s.icon}</div>{i < arr.length - 1 && <div className="gp4-how-line" />}</div>
                    <div className="gp4-how-body"><div className="gp4-how-title">{s.title}</div><div className="gp4-how-desc">{s.desc}</div></div>
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
// Performance Components
// ─────────────────────────────────────────────────────────────────────────────

function PerformanceScoreRing({ score, label, color }) {
  const radius = 54;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="10" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 1.5s ease' }} />
        <text x="70" y="65" textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight="800" fill={color} fontFamily="var(--C)">{score}</text>
        <text x="70" y="88" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="var(--muted)" fontFamily="var(--D)">/ 100</text>
      </svg>
      <div style={{ padding: '4px 14px', borderRadius: 20, background: `${color}15`, border: `1px solid ${color}33`, fontSize: 12, fontWeight: 700, color }}>{label}</div>
    </div>
  );
}

function MetricBar({ value, good, poor, unit }) {
  if (value == null) return <div style={{ fontSize: 11, color: 'var(--muted)' }}>N/A</div>;
  const pct   = Math.min(100, (value / poor) * 100);
  const color = value <= good ? '#10b981' : value >= poor ? '#ef4444' : '#f59e0b';
  return (
    <div style={{ width: '100%' }}>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(good / poor) * 100}%`, background: 'rgba(16,185,129,.1)', borderRight: '1px dashed rgba(16,185,129,.3)' }} />
        <div style={{ height: '100%', borderRadius: 6, width: `${pct}%`, background: color, transition: 'width 1.2s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        <span style={{ fontSize: 9, color: '#10b981' }}>Good ≤{good}{unit}</span>
        <span style={{ fontSize: 9, color: '#ef4444' }}>Poor ≥{poor}{unit}</span>
      </div>
    </div>
  );
}

function RecommendationCard({ rec, index }) {
  const PRIORITY_CONFIG = {
    critical: { color: '#ef4444', bg: 'rgba(239,68,68,.08)', border: 'rgba(239,68,68,.2)',   icon: '🔴' },
    high:     { color: '#f97316', bg: 'rgba(249,115,22,.08)', border: 'rgba(249,115,22,.2)', icon: '🟠' },
    medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.2)', icon: '🟡' },
    low:      { color: '#10b981', bg: 'rgba(16,185,129,.08)', border: 'rgba(16,185,129,.2)', icon: '🟢' },
  };
  const CATEGORY_ICONS = { images: '🖼', javascript: '⚡', css: '🎨', server: '🖥', caching: '📦', fonts: '✍', network: '🌐' };
  const conf    = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.medium;
  const catIcon = CATEGORY_ICONS[rec.category]  || '🔧';
  return (
    <div style={{ background: conf.bg, border: `1px solid ${conf.border}`, borderRadius: 12, padding: '14px 16px', animation: `dFadeUp .3s var(--ease) ${index * 0.06}s both` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{catIcon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{rec.title}</span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: '2px 8px', borderRadius: 20, color: conf.color, background: `${conf.color}15`, border: `1px solid ${conf.color}33`, textTransform: 'uppercase' }}>{conf.icon} {rec.priority}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--sub)', margin: 0, lineHeight: 1.6 }}>{rec.description}</p>
          {rec.impact && (<div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>Impact: {rec.impact}</div>)}
        </div>
      </div>
    </div>
  );
}

function PerformanceMetricRow({ test, index }) {
  const SECTION_COLORS = { timing: '#6366f1', network: '#0ea5e9', dom: '#8b5cf6', assets: '#f97316' };
  const color      = SECTION_COLORS[test.section] || '#6366f1';
  const scoreColor = test.status === 'pass' ? '#10b981' : test.status === 'fail' ? '#ef4444' : '#f59e0b';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center', animation: `dFadeUp .25s var(--ease) ${index * 0.04}s both`, background: test.status === 'fail' ? 'rgba(239,68,68,.02)' : 'transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: `${color}12`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{test.name.split(' ')[0]}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{test.name.replace(/^[^\s]+\s/, '')}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{test.section}</div>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 800, color: scoreColor, fontFamily: 'var(--C)' }}>{test.value}</div><div style={{ fontSize: 9, color: 'var(--muted)' }}>measured</div></div>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>≤ {test.metric_good}{test.metric_unit || ''}</div><div style={{ fontSize: 9, color: 'var(--dimmed)' }}>good</div></div>
      <div style={{ textAlign: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: test.status === 'pass' ? 'rgba(16,185,129,.1)' : test.status === 'fail' ? 'rgba(239,68,68,.1)' : 'rgba(245,158,11,.1)', color: scoreColor, border: `1px solid ${scoreColor}33` }}>
          {test.status === 'pass' ? '✓' : test.status === 'fail' ? '✗' : '—'} {test.status}
        </span>
      </div>
      <MetricBar value={test.metric_value} good={test.metric_good} poor={test.metric_poor} unit={test.metric_unit || ''} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PerformanceExecutionPanel
// ─────────────────────────────────────────────────────────────────────────────

function PerformanceExecutionPanel({ generation }) {
  const [activeSection, setActiveSection] = useState('metrics');
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [pdfLoading,    setPdfLoading]    = useState(false);
  const dropdownRef = useRef(null);



const downloadHtml_Performance = () => {
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const genId   = generation?.generation?.id || 'nextest';

  // ── Pull all data (mirrors how PDF pulls it) ──────────────────────────────
  const result     = generation?.result || {};
  const perf       = result?.performance || generation?.performance || {};
  const tests      = result?.test_cases || result?.execution_results || [];
  const metrics    = perf?.metrics || result?.metrics || {};
  const recs       = perf?.recommendations || [];
  const score      = perf?.global_score  || 0;
  const scoreLabel = perf?.score_label   || 'N/A';
  const scoreColor = perf?.score_color   || '#f59e0b';
  const siteType   = perf?.site_type     || 'landing';
  const analysis   = perf?.site_analysis || '';
  const summary    = perf?.performance_summary || '';
  const urlVal     = generation?.generation?.url || generation?.url || '';
  const framework  = generation?.framework || generation?.generation?.framework || 'Playwright';
  const loadMs     = metrics?.load_time_ms || 0;

  const pass = tests.filter(t => t.status === 'pass').length;
  const fail = tests.filter(t => t.status === 'fail').length;
  const skip = tests.filter(t => t.status === 'skip').length;
  const total = tests.length || 1;
  const passRate = Math.round(pass / total * 100);

  const rc = score >= 90 ? '#10b981' : score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const loadBadgeC = loadMs > 3000 ? '#ef4444' : '#10b981';
  const loadBadgeL = loadMs > 3000 ? 'SLOW' : 'GOOD';

  // ── SECTION BUILDER (matches PDF section_header style) ────────────────────
  const secHdr = (emoji, title, c = '#c9a227') => `
    <div style="display:flex;align-items:center;gap:10px;margin:36px 0 14px;
      padding-bottom:10px;border-bottom:2.5px solid ${c}">
      <span style="font-size:18px">${emoji}</span>
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;
        font-weight:700;color:#e2e8f0">${title}</span>
    </div>`;

  const tblWrap = (inner, accent = '#6366f1') => `
    <div style="background:#0d1526;border:1px solid ${accent}44;border-radius:14px;
      overflow:hidden;margin-bottom:20px;box-shadow:0 4px 20px rgba(0,0,0,.3)">
      ${inner}
    </div>`;

  const tblHdrRow = cols => `
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#040914">
        ${cols.map(c => `<th style="padding:11px 14px;text-align:${c.align || 'left'};
          font-size:9px;letter-spacing:1.5px;text-transform:uppercase;
          color:#4f6480;font-weight:700;white-space:nowrap">${c.l}</th>`).join('')}
      </tr></thead>`;

  // ── Score Ring SVG (matches PDF PerformanceScoreRing) ─────────────────────
  const radius = 54;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const scoreRingSvg = `
    <svg width="160" height="160" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r="${radius}" fill="none"
        stroke="rgba(255,255,255,.06)" stroke-width="10"/>
      <circle cx="70" cy="70" r="${radius}" fill="none" stroke="${scoreColor}"
        stroke-width="10" stroke-dasharray="${circ.toFixed(2)}"
        stroke-dashoffset="${offset.toFixed(2)}" stroke-linecap="round"
        transform="rotate(-90 70 70)"/>
      <text x="70" y="65" text-anchor="middle" dominant-baseline="middle"
        font-size="28" font-weight="800" fill="${scoreColor}"
        font-family="'Cormorant Garamond',Georgia,serif">${score}</text>
      <text x="70" y="88" text-anchor="middle" dominant-baseline="middle"
        font-size="10" fill="#64748b" font-family="'DM Sans',sans-serif">/ 100</text>
    </svg>`;

  // ── 1. PAGE ANALYSIS (matches PDF build_page_analysis) ───────────────────
  const detectedItems = [];
  if (metrics?.dom_size)      detectedItems.push({ n: 'DOM Elements',   c: '#3b82f6', d: `${metrics.dom_size} elements in DOM` });
  if (metrics?.js_count)      detectedItems.push({ n: 'JavaScript',     c: '#f59e0b', d: `${metrics.js_count} script resource(s)` });
  if (metrics?.css_count)     detectedItems.push({ n: 'CSS',            c: '#8b5cf6', d: `${metrics.css_count} stylesheet(s)` });
  if (metrics?.image_count)   detectedItems.push({ n: 'Images',         c: '#ec4899', d: `${metrics.image_count} image(s)` });
  if (metrics?.request_count) detectedItems.push({ n: 'Network Requests', c: '#0d9488', d: `${metrics.request_count} total requests` });
  if (!detectedItems.length)  detectedItems.push({ n: 'General',        c: '#64748b', d: 'Standard page performance metrics collected' });

  const pageAnalysisRows = detectedItems.map(i => `
    <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
      <td style="padding:10px 14px">
        <span style="font-weight:800;color:${i.c}">${i.n}</span>
      </td>
      <td style="padding:10px 14px;color:#94a3b8;font-size:12px">${i.d}</td>
    </tr>`).join('');

  const pageWarnings = [];
  if (loadMs > 3000) pageWarnings.push(`⚠ Slow page load (${loadMs}ms) — critical performance issue`);
  if (loadMs > 1500 && loadMs <= 3000) pageWarnings.push(`⚠ Page load needs improvement (${loadMs}ms)`);
  if (metrics?.dom_size > 3000) pageWarnings.push('⚠ Large DOM detected — may impact rendering performance');
  if (metrics?.js_size_kb > 1024) pageWarnings.push(`⚠ Heavy JavaScript bundle (${metrics.js_size_kb}KB) — consider code splitting`);

  const sectionPageAnalysis = `
    ${secHdr('🔍', 'Page Analysis')}
    ${tblWrap(`
      ${tblHdrRow([{ l: 'Element' }, { l: 'Details' }])}
      <tbody>${pageAnalysisRows}</tbody></table>`)}
    ${pageWarnings.map(w => `
      <div style="font-size:12px;color:#f59e0b;padding:5px 2px;
        display:flex;align-items:center;gap:6px">${w}</div>`).join('')}`;

  // ── 2. PERFORMANCE TEST PLAN (matches PDF build_test_plan) ────────────────
  const SITE_TYPE_LABELS = {
    ecommerce: 'E-Commerce Page — cart, checkout, product performance',
    saas:      'SaaS Application — dashboard and app performance',
    blog:      'Blog / Content — reading experience and load speed',
    landing:   'Landing Page — first impression and Core Web Vitals',
    media:     'Media Site — video/image load and streaming performance',
    corporate: 'Corporate Site — brand and navigation performance',
  };
  const ptStrategy = SITE_TYPE_LABELS[siteType] || 'General Page performance analysis';
  const passTests  = tests.filter(t => t.status === 'pass').length;
  const failTests  = tests.filter(t => t.status === 'fail').length;

  const testPlanMeta = [
    ['Detected Site Type', `<span style="color:#e2e8f0">${siteType.toUpperCase()} — ${ptStrategy}</span>`],
    ['Framework',          `<span style="color:#E2574C;font-weight:700">${framework}</span>`],
    ['Total Metrics',      `<span style="color:#e2e8f0">${tests.length} performance metric(s) measured</span>`],
    ['Coverage',
      `<span style="color:#10b981;font-weight:700">${passTests} metric(s) within threshold</span>
       <span style="color:#64748b"> | </span>
       <span style="color:#ef4444;font-weight:700">${failTests} metric(s) exceeded threshold</span>`],
  ].map(([l, v]) => `
    <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
      <td style="padding:10px 14px;background:rgba(255,255,255,.02);color:#64748b;
        font-weight:700;font-size:12px;white-space:nowrap">${l}</td>
      <td style="padding:10px 14px;font-size:12px">${v}</td>
    </tr>`).join('');

  // Metric rows in the test plan table
  const SECTION_COLORS_MAP = { timing: '#6366f1', network: '#0ea5e9', assets: '#f97316', dom: '#8b5cf6' };
  const metricPlanRows = tests.map((t, i) => {
    const sc = t.status === 'pass' ? '#10b981' : t.status === 'fail' ? '#ef4444' : '#f59e0b';
    const sectionC = SECTION_COLORS_MAP[t.section] || '#6366f1';
    return `
      <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
        <td style="padding:10px 14px;color:#64748b;font-weight:700;
          text-align:center;font-size:11px">${t.id || i + 1}</td>
        <td style="padding:10px 14px">
          <div style="font-weight:700;color:#e2e8f0;font-size:13px;
            margin-bottom:3px">${t.name}</div>
          <div style="font-size:10px;color:#64748b">
            Threshold: ≤ ${t.metric_good || '—'}${t.metric_unit || ''}</div>
        </td>
        <td style="padding:10px 14px;font-size:11px;color:#94a3b8">
          ${t.suite || t.description || 'Performance threshold check'}</td>
        <td style="padding:10px 14px;text-align:center">
          <span style="font-size:9px;font-weight:800;letter-spacing:1px;padding:3px 8px;
            border-radius:12px;color:${sc};background:${sc}18;border:1px solid ${sc}33">
            ${t.status === 'pass' ? '✓ PASS' : t.status === 'fail' ? '✗ FAIL' : '— SKIP'}
          </span>
        </td>
        <td style="padding:10px 14px;text-align:center">
          <span style="font-size:9px;font-weight:800;padding:3px 8px;border-radius:6px;
            color:${sectionC};background:${sectionC}18;border:1px solid ${sectionC}33">
            ${(t.section || 'METRIC').toUpperCase()}
          </span>
        </td>
      </tr>`;
  }).join('');

  const sectionTestPlan = `
    ${secHdr('📋', 'Performance Test Plan')}
    ${tblWrap(`<table style="width:100%;border-collapse:collapse">
      <tbody>${testPlanMeta}</tbody></table>`)}
    <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin:16px 0 10px">
      Measured Metrics</div>
    ${tblWrap(`
      ${tblHdrRow([
        { l: '#', align: 'center' },
        { l: 'Metric' },
        { l: 'Objective' },
        { l: 'Status', align: 'center' },
        { l: 'Section', align: 'center' },
      ])}
      <tbody>${metricPlanRows}</tbody></table>`)}`;

  // ── 3. PLANNED UI ELEMENTS → for perf: "Key Web Vitals" ──────────────────
  const KEY_METRICS_DEF = [
    { key: 'load_time_ms', label: 'Page Load Time',           icon: '⏱', unit: 'ms', sel: 'window.performance.timing' },
    { key: 'fcp_ms',       label: 'First Contentful Paint',   icon: '🎨', unit: 'ms', sel: 'paint-timing-api: first-contentful-paint' },
    { key: 'lcp_ms',       label: 'Largest Contentful Paint', icon: '🖼', unit: 'ms', sel: 'largest-contentful-paint observer' },
    { key: 'tti_ms',       label: 'Time to Interactive',      icon: '🖱', unit: 'ms', sel: 'long-tasks-api / domInteractive' },
    { key: 'total_size_kb',label: 'Total Resource Size',      icon: '📦', unit: 'KB', sel: 'resource-timing-api transferSize' },
    { key: 'dom_size',     label: 'DOM Elements Count',       icon: '🌲', unit: '',   sel: 'document.querySelectorAll("*").length' },
    { key: 'js_size_kb',   label: 'JavaScript Bundle Size',   icon: '⚡', unit: 'KB', sel: 'script[src] transferSize' },
    { key: 'css_size_kb',  label: 'CSS Stylesheets Size',     icon: '🎨', unit: 'KB', sel: 'link[rel=stylesheet] transferSize' },
    { key: 'image_size_kb',label: 'Images Total Size',        icon: '🖼', unit: 'KB', sel: 'img transferSize aggregate' },
  ];

  const vitalRows = KEY_METRICS_DEF.map((m, i) => {
    const val   = metrics?.[m.key] ?? null;
    const test  = tests.find(t => t.metric_key === m.key);
    const color = test?.status === 'pass' ? '#10b981' : test?.status === 'fail' ? '#ef4444' : '#f59e0b';
    const displayVal = val != null ? `${val.toLocaleString()}${m.unit}` : 'N/A';
    const good  = test?.metric_good;
    const behavior = good ? `Value must be ≤ ${good}${m.unit} to pass threshold` : 'Performance threshold check';
    return `
      <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
        <td style="padding:10px 14px;color:#64748b;text-align:center;
          font-weight:700;font-size:11px">${i + 1}</td>
        <td style="padding:10px 14px">
          <div style="font-size:9px;font-weight:800;color:${color};margin-bottom:2px">
            ${m.section ? m.section.toUpperCase() : 'METRIC'}</div>
          <div style="font-size:11px;color:#94a3b8">${m.icon} ${m.label}</div>
        </td>
        <td style="padding:10px 14px;font-family:monospace;font-size:10px;color:#818cf8">
          ${m.sel}</td>
        <td style="padding:10px 14px;text-align:center">
          <span style="font-size:9px;font-weight:800;padding:3px 8px;border-radius:6px;
            color:${color};background:${color}18;border:1px solid ${color}33">PERF</span>
        </td>
        <td style="padding:10px 14px;font-size:11px;color:#94a3b8">${behavior}</td>
      </tr>`;
  }).join('');

  const sectionPlannedMetrics = `
    ${secHdr('🎯', 'Planned Performance Metrics', '#6366f1')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      AI-predicted measurement points and browser APIs used during execution.
    </div>
    ${tblWrap(`
      ${tblHdrRow([
        { l: '#', align: 'center' },
        { l: 'Metric Name' },
        { l: 'Browser API / Selector' },
        { l: 'Type', align: 'center' },
        { l: 'Expected Behavior' },
      ])}
      <tbody>${vitalRows}</tbody></table>`, '#6366f1')}`;

  // ── 4. TEST SUMMARY (matches PDF build_stats_section) ────────────────────
  const rateGrad = passRate >= 80 ? 'linear-gradient(135deg,#10b981,#34d399)'
                 : passRate >= 50 ? 'linear-gradient(135deg,#f59e0b,#fbbf24)'
                 : 'linear-gradient(135deg,#ef4444,#f87171)';

  const sectionSummary = `
    ${secHdr('📊', 'Test Summary', '#c9a227')}
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:20px">
      ${[
        { icon: '✅', val: pass,          lbl: 'PASSED',    acc: '#10b981', bg: 'rgba(16,185,129,.08)',  bd: 'rgba(16,185,129,.25)'  },
        { icon: '❌', val: fail,          lbl: 'FAILED',    acc: '#ef4444', bg: 'rgba(239,68,68,.08)',   bd: 'rgba(239,68,68,.25)'   },
        { icon: '⏭️', val: skip,          lbl: 'SKIPPED',   acc: '#f59e0b', bg: 'rgba(245,158,11,.08)',  bd: 'rgba(245,158,11,.25)'  },
        { icon: '🎯', val: `${score}`,    lbl: 'SCORE/100', acc: scoreColor, bg: `${scoreColor}12`, bd: `${scoreColor}33` },
        { icon: '🔢', val: tests.length,  lbl: 'TOTAL',     acc: '#3b82f6', bg: 'rgba(59,130,246,.08)',  bd: 'rgba(59,130,246,.25)'  },
      ].map(s => `
        <div style="background:${s.bg};border:1px solid ${s.bd};border-radius:16px;
          padding:22px 16px;text-align:center;position:relative;overflow:hidden">
          <div style="font-size:20px;margin-bottom:10px">${s.icon}</div>
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:40px;
            font-weight:700;color:${s.acc};line-height:1;margin-bottom:6px">${s.val}</div>
          <div style="font-size:9px;font-weight:700;letter-spacing:2px;
            color:${s.acc}99;text-transform:uppercase">${s.lbl}</div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:3px;
            background:${s.acc}88"></div>
        </div>`).join('')}
    </div>
    <div style="background:#0d1526;border:1px solid rgba(255,255,255,.06);
      border-radius:12px;padding:18px 20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-size:13px;font-weight:600;color:#e2e8f0">Overall Pass Rate</span>
        <span style="font-size:18px;font-weight:700;
          font-family:'Cormorant Garamond',serif;color:${rc}">${passRate}%</span>
      </div>
      <div style="height:10px;background:rgba(255,255,255,.06);border-radius:10px;overflow:hidden">
        <div style="height:100%;width:${passRate}%;background:${rateGrad};border-radius:10px"></div>
      </div>
    </div>`;

  // ── 5. EXECUTION VERDICT SUMMARY (matches PDF build_execution_verdict_summary)
  const SECTION_LABELS_MAP = { timing: 'Timing', network: 'Network', assets: 'Assets', dom: 'DOM' };
  const bySection = tests.reduce((acc, t) => {
    const s = t.section || 'other';
    if (!acc[s]) acc[s] = { pass: 0, fail: 0, skip: 0 };
    acc[s][t.status === 'pass' ? 'pass' : t.status === 'fail' ? 'fail' : 'skip']++;
    return acc;
  }, {});

  const PASS_MSG_PERF = {
    timing:  'Core timing metrics are within acceptable thresholds — page loads quickly',
    network: 'Network efficiency is good — request count and transfer size are optimized',
    assets:  'Asset sizes are within limits — JS, CSS, and images are well-optimized',
    dom:     'DOM complexity is manageable — no rendering bottlenecks detected',
  };
  const FAIL_MSG_PERF = {
    timing:  'Critical: page load or paint timings exceed thresholds — users experience slow loads',
    network: 'Moderate: excessive network requests or transfer size detected',
    assets:  'Moderate: oversized assets detected — images or JS bundles too large',
    dom:     'Minor: DOM tree is too large — may slow rendering and interaction',
  };

  const verdictRows = Object.entries(bySection).map(([section, counts]) => {
    const v = counts.fail > 0
      ? { l: 'FAIL', c: '#ef4444', bg: 'rgba(239,68,68,.06)',  msg: FAIL_MSG_PERF[section] || `Performance issues in ${section}` }
      : counts.pass > 0
      ? { l: 'PASS', c: '#10b981', bg: 'rgba(16,185,129,.06)', msg: PASS_MSG_PERF[section] || `${section} metrics are healthy` }
      : { l: 'SKIP', c: '#f59e0b', bg: 'rgba(245,158,11,.06)', msg: 'Not measured — metric unavailable' };
    return `
      <tr style="background:${v.bg};border-bottom:1px solid rgba(255,255,255,.05)">
        <td style="padding:11px 14px;font-weight:700;color:#e2e8f0">
          ${SECTION_LABELS_MAP[section] || section}</td>
        <td style="padding:11px 14px;text-align:center">
          <span style="font-size:9px;font-weight:800;letter-spacing:1px;padding:4px 10px;
            border-radius:12px;color:${v.c};background:${v.c}18;border:1px solid ${v.c}44">
            ${v.l}</span>
        </td>
        <td style="padding:11px 14px;text-align:center;color:#10b981;font-weight:700">
          ${counts.pass}</td>
        <td style="padding:11px 14px;text-align:center;color:#ef4444;font-weight:700">
          ${counts.fail}</td>
        <td style="padding:11px 14px;text-align:center;color:#f59e0b;font-weight:700">
          ${counts.skip}</td>
        <td style="padding:11px 14px;font-size:11px;color:#94a3b8">${v.msg}</td>
      </tr>`;
  }).join('');

  const critFails = tests.filter(t => t.status === 'fail' && t.section === 'timing');
  const overallV = critFails.length
    ? { c: '#ef4444', bg: 'rgba(239,68,68,.08)', bd: 'rgba(239,68,68,.3)', i: '🔴',
        t: `Performance validation FAILED — critical timing metrics exceed thresholds. Core Web Vitals are impacted.` }
    : fail > 0
    ? { c: '#f59e0b', bg: 'rgba(245,158,11,.08)', bd: 'rgba(245,158,11,.3)', i: '🟡',
        t: `Performance validation passed with ${fail} metric(s) exceeding thresholds. Non-critical performance improvements recommended.` }
    : { c: '#10b981', bg: 'rgba(16,185,129,.08)', bd: 'rgba(16,185,129,.3)', i: '🟢',
        t: `All performance metrics are within acceptable thresholds. The application delivers a good user experience.` };

  const sectionVerdictSummary = `
    ${secHdr('🏁', 'Execution Verdict Summary', '#c9a227')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Business-oriented interpretation of performance results — maps raw metrics to user experience impact.
    </div>
    ${tblWrap(`
      ${tblHdrRow([
        { l: 'Section' },
        { l: 'Verdict', align: 'center' },
        { l: 'Passed',  align: 'center' },
        { l: 'Failed',  align: 'center' },
        { l: 'Skipped', align: 'center' },
        { l: 'Interpretation' },
      ])}
      <tbody>${verdictRows}</tbody></table>`, '#c9a227')}
    <div style="background:${overallV.bg};border:2px solid ${overallV.bd};border-radius:12px;
      padding:16px 18px;display:flex;gap:12px;align-items:flex-start">
      <span style="font-size:22px">${overallV.i}</span>
      <div>
        <div style="font-size:12px;font-weight:700;color:${overallV.c};margin-bottom:4px">
          Overall Verdict</div>
        <p style="font-size:12px;color:${overallV.c};margin:0;line-height:1.6">${overallV.t}</p>
      </div>
    </div>`;

  // ── 6. DETAILED METRICS TABLE (matches PDF PerformanceMetricRow) ──────────
  const SECTION_COLORS_ALL = { timing: '#6366f1', network: '#0ea5e9', assets: '#f97316', dom: '#8b5cf6' };
  const bySectionAll = tests.reduce((acc, t) => {
    const s = t.section || 'other';
    if (!acc[s]) acc[s] = [];
    acc[s].push(t);
    return acc;
  }, {});

  const metricsDetailHtml = ['timing', 'network', 'assets', 'dom'].map(sec => {
    const secTests = bySectionAll[sec] || [];
    if (!secTests.length) return '';
    const sc = SECTION_COLORS_ALL[sec] || '#6366f1';
    const rows = secTests.map(t => {
      const statusColor = t.status === 'pass' ? '#10b981' : t.status === 'fail' ? '#ef4444' : '#f59e0b';
      const pct = t.metric_value != null && t.metric_poor
        ? Math.min(100, (t.metric_value / t.metric_poor) * 100) : 0;
      const barColor = statusColor;
      return `
        <tr style="border-bottom:1px solid rgba(255,255,255,.04);
          background:${t.status === 'fail' ? 'rgba(239,68,68,.02)' : 'transparent'}">
          <td style="padding:14px 20px">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:32px;height:32px;border-radius:8px;flex-shrink:0;
                background:${sc}12;border:1px solid ${sc}22;
                display:flex;align-items:center;justify-content:center;font-size:15px">
                ${t.name.split(' ')[0]}
              </div>
              <div>
                <div style="font-size:13px;font-weight:600;color:#e2e8f0">
                  ${t.name.replace(/^[^\s]+\s/, '')}</div>
                <div style="font-size:10px;color:#64748b;text-transform:uppercase;
                  letter-spacing:1px">${t.section || ''}</div>
              </div>
            </div>
          </td>
          <td style="padding:14px 12px;text-align:center">
            <div style="font-size:16px;font-weight:800;color:${statusColor};
              font-family:'Cormorant Garamond',serif">${t.value || 'N/A'}</div>
            <div style="font-size:9px;color:#64748b">measured</div>
          </td>
          <td style="padding:14px 12px;text-align:center">
            <div style="font-size:12px;font-weight:600;color:#64748b">
              ≤ ${t.metric_good || '—'}${t.metric_unit || ''}</div>
            <div style="font-size:9px;color:#475569">good</div>
          </td>
          <td style="padding:14px 12px;text-align:center">
            <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;
              border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;
              background:${statusColor}18;color:${statusColor};border:1px solid ${statusColor}33">
              ${t.status === 'pass' ? '✓' : t.status === 'fail' ? '✗' : '—'} ${t.status}
            </span>
          </td>
          <td style="padding:14px 20px;min-width:160px">
            <div style="height:6px;background:rgba(255,255,255,.06);border-radius:6px;
              overflow:hidden;position:relative">
              <div style="position:absolute;left:0;top:0;bottom:0;
                width:${t.metric_good && t.metric_poor
                  ? Math.round((t.metric_good / t.metric_poor) * 100) : 40}%;
                background:rgba(16,185,129,.1);
                border-right:1px dashed rgba(16,185,129,.3)"></div>
              <div style="height:100%;border-radius:6px;width:${pct.toFixed(1)}%;
                background:${barColor}"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:3px">
              <span style="font-size:9px;color:#10b981">
                Good ≤${t.metric_good || ''}${t.metric_unit || ''}</span>
              <span style="font-size:9px;color:#ef4444">
                Poor ≥${t.metric_poor || ''}${t.metric_unit || ''}</span>
            </div>
          </td>
        </tr>`;
    }).join('');
    return `
      <div style="padding:8px 20px;background:${sc}08;
        border-bottom:1px solid rgba(255,255,255,.04);font-size:10px;font-weight:700;
        letter-spacing:2px;text-transform:uppercase;color:${sc};
        display:flex;align-items:center;gap:6px">
        <div style="width:6px;height:6px;border-radius:50%;background:${sc}"></div>
        ${SECTION_LABELS_MAP[sec] || sec}
      </div>
      ${rows}`;
  }).join('');

 const SECTION_META = {
  timing:  { color: '#6366f1', label: '⏱ Timing',   bgAlpha: 'rgba(99,102,241,.1)',  bdAlpha: 'rgba(99,102,241,.2)'  },
  network: { color: '#0ea5e9', label: '🌐 Network',  bgAlpha: 'rgba(14,165,233,.1)',  bdAlpha: 'rgba(14,165,233,.2)'  },
  assets:  { color: '#f97316', label: '📦 Assets',   bgAlpha: 'rgba(249,115,22,.1)',  bdAlpha: 'rgba(249,115,22,.2)'  },
  dom:     { color: '#8b5cf6', label: '🌲 DOM',      bgAlpha: 'rgba(139,92,246,.1)',  bdAlpha: 'rgba(139,92,246,.2)'  },
};
 
const bySectionNew = tests.reduce((acc, t) => {
  const s = t.section || 'other';
  if (!acc[s]) acc[s] = [];
  acc[s].push(t);
  return acc;
}, {});
 
const metricsGridHtml = ['timing', 'network', 'assets', 'dom'].map(sec => {
  const secTests = bySectionNew[sec] || [];
  if (!secTests.length) return '';
  const sm = SECTION_META[sec] || { color: '#6366f1', label: sec, bgAlpha: 'rgba(99,102,241,.1)', bdAlpha: 'rgba(99,102,241,.2)' };
  const count = secTests.length;
 
  const cards = secTests.map(t => {
    const sc     = t.status === 'pass' ? '#10b981' : t.status === 'fail' ? '#ef4444' : '#f59e0b';
    const scBg   = t.status === 'pass' ? 'rgba(16,185,129,.12)' : t.status === 'fail' ? 'rgba(239,68,68,.12)' : 'rgba(245,158,11,.12)';
    const scBd   = t.status === 'pass' ? 'rgba(16,185,129,.3)'  : t.status === 'fail' ? 'rgba(239,68,68,.3)'  : 'rgba(245,158,11,.3)';
    const icon   = t.status === 'pass' ? '✓' : t.status === 'fail' ? '✗' : '—';
    const label  = t.status === 'pass' ? 'pass' : t.status === 'fail' ? 'fail' : 'skip';
    const cardBorder = t.status === 'pass' ? 'rgba(16,185,129,.2)' : t.status === 'fail' ? 'rgba(239,68,68,.25)' : 'rgba(245,158,11,.2)';
    const topBar = t.status === 'pass'
      ? 'linear-gradient(90deg,transparent,#10b981,transparent)'
      : t.status === 'fail'
      ? 'linear-gradient(90deg,transparent,#ef4444,transparent)'
      : 'linear-gradient(90deg,transparent,#f59e0b,transparent)';
 
    const pct = t.metric_value != null && t.metric_poor
      ? Math.min(100, (t.metric_value / t.metric_poor) * 100).toFixed(1)
      : 0;
    const goodPct = t.metric_good && t.metric_poor
      ? Math.round((t.metric_good / t.metric_poor) * 100)
      : 50;
 
    return `
      <div style="background:#0d1526;border-radius:14px;padding:18px 20px;
        position:relative;overflow:hidden;border:1px solid ${cardBorder}">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;
          background:${topBar}"></div>
 
        <!-- top row: icon + name + badge -->
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px">
          <div style="width:38px;height:38px;border-radius:10px;flex-shrink:0;
            background:${sm.bgAlpha};border:1px solid ${sm.bdAlpha};
            display:flex;align-items:center;justify-content:center;font-size:18px">
            ${t.name.split(' ')[0]}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:#e2e8f0;
              margin-bottom:3px;line-height:1.3">
              ${t.name.replace(/^[^\s]+\s/, '')}
            </div>
            <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;
              text-transform:uppercase;color:${sm.color}">${sec}</div>
          </div>
          <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;
            border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;
            background:${scBg};color:${sc};border:1px solid ${scBd};
            flex-shrink:0;align-self:flex-start">
            ${icon} ${label}
          </span>
        </div>
 
        <!-- value row -->
        <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:12px">
          <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;
            font-weight:700;line-height:1;color:${sc}">${t.value || 'N/A'}</span>
          <span style="font-size:11px;color:#64748b;font-weight:600">
            / ≤${t.metric_good || '—'}${t.metric_unit || ''} good
          </span>
        </div>
 
        <!-- gauge bar -->
        <div style="height:8px;background:rgba(255,255,255,.06);border-radius:8px;
          overflow:hidden;position:relative;margin-bottom:5px">
          <div style="position:absolute;top:0;bottom:0;left:0;width:${goodPct}%;
            background:rgba(16,185,129,.08);
            border-right:1px dashed rgba(16,185,129,.3)"></div>
          <div style="height:100%;border-radius:8px;width:${pct}%;
            background:${sc};position:relative;z-index:1"></div>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="font-size:9px;font-weight:600;color:#10b981">
            Good ≤${t.metric_good || ''}${t.metric_unit || ''}
          </span>
          <span style="font-size:9px;font-weight:600;color:#ef4444">
            Poor ≥${t.metric_poor || ''}${t.metric_unit || ''}
          </span>
        </div>
      </div>`;
  }).join('');
 
  return `
    <!-- Group header -->
    <div style="display:flex;align-items:center;gap:10px;
      padding:10px 0 8px;margin-bottom:12px;
      border-bottom:1px solid rgba(255,255,255,.06)">
      <div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;
        background:${sm.color}"></div>
      <span style="font-size:10px;font-weight:800;letter-spacing:2.5px;
        text-transform:uppercase;color:${sm.color}">${sm.label}</span>
      <span style="margin-left:auto;font-size:10px;font-weight:700;padding:2px 10px;
        border-radius:20px;color:${sm.color};background:${sm.bgAlpha};
        border:1px solid ${sm.bdAlpha}">${count} metric${count !== 1 ? 's' : ''}</span>
    </div>
 
    <!-- Cards grid -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));
      gap:12px;margin-bottom:28px">
      ${cards}
    </div>`;
}).join('');
 
const sectionDetailedMetrics = `
  ${secHdr('🔬', 'Detailed Metrics', '#0d9488')}
  <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:20px">
    Each metric card shows the measured value, pass/fail threshold, and
    a distribution bar relative to the good/poor range.
  </div>
  ${metricsGridHtml || '<div style="padding:20px;color:#64748b;text-align:center">No metrics available</div>'}
`;

  // ── 7. KEY WEB VITALS CARDS (matches PDF Key Metrics section) ─────────────
  const KEY_METRICS_LIST = [
    { key: 'load_time_ms', label: 'Load Time', icon: '⏱', unit: 'ms' },
    { key: 'fcp_ms',       label: 'FCP',       icon: '🎨', unit: 'ms' },
    { key: 'lcp_ms',       label: 'LCP',       icon: '🖼', unit: 'ms' },
    { key: 'tti_ms',       label: 'TTI',       icon: '🖱', unit: 'ms' },
  ];
  const keyMetricsHtml = KEY_METRICS_LIST.map(m => {
    const val   = metrics?.[m.key] ?? null;
    const test  = tests.find(t => t.metric_key === m.key);
    const color = test?.status === 'pass' ? '#10b981' : test?.status === 'fail' ? '#ef4444' : '#f59e0b';
    return `
      <div style="background:#0d1526;border:1px solid ${color}33;border-radius:12px;
        padding:16px;border-top:3px solid ${color}">
        <div style="font-size:20px;margin-bottom:8px">${m.icon}</div>
        <div style="font-size:22px;font-weight:800;color:${color};
          font-family:'Cormorant Garamond',serif;line-height:1">
          ${val != null ? `${val.toLocaleString()}${m.unit}` : 'N/A'}
        </div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">${m.label}</div>
      </div>`;
  }).join('');

  // ── 8. AI RECOMMENDATIONS (matches PDF build_ai_recommendations) ──────────
  const PRIORITY_CONFIG = {
    critical: { color: '#ef4444', bg: 'rgba(239,68,68,.08)',  bd: 'rgba(239,68,68,.2)',   icon: '🔴' },
    high:     { color: '#f97316', bg: 'rgba(249,115,22,.08)', bd: 'rgba(249,115,22,.2)',  icon: '🟠' },
    medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,.08)', bd: 'rgba(245,158,11,.2)',  icon: '🟡' },
    low:      { color: '#10b981', bg: 'rgba(16,185,129,.08)', bd: 'rgba(16,185,129,.2)',  icon: '🟢' },
  };
  const CAT_ICONS = {
    images: '🖼', javascript: '⚡', css: '🎨', server: '🖥',
    caching: '📦', fonts: '✍', network: '🌐',
  };

  // Performance-specific recommendations if none provided
  const effectiveRecs = recs.length > 0 ? recs : (() => {
    const autoRecs = [];
    if (loadMs > 3000) autoRecs.push({ priority: 'critical', category: 'server',
      title: 'Critical: Page Load Exceeds 3s',
      description: `Page loads in ${loadMs}ms — far above the 3000ms good threshold. Compress images, enable CDN, and audit third-party scripts.`,
      impact: 'Could reduce load time by 40-60%' });
    if (metrics?.js_size_kb > 512) autoRecs.push({ priority: 'high', category: 'javascript',
      title: 'Reduce JavaScript Bundle Size',
      description: `JavaScript bundle is ${metrics.js_size_kb}KB (threshold: 512KB). Implement code splitting and tree shaking.`,
      impact: 'Improved TTI by 1-2 seconds' });
    if (metrics?.image_size_kb > 1024) autoRecs.push({ priority: 'high', category: 'images',
      title: 'Optimize Image Assets',
      description: `Images total ${metrics.image_size_kb}KB (threshold: 1024KB). Convert to WebP format and implement lazy loading.`,
      impact: '20-40% reduction in page weight' });
    if (metrics?.dom_size > 1500) autoRecs.push({ priority: 'medium', category: 'network',
      title: 'Simplify DOM Structure',
      description: `DOM has ${metrics.dom_size} elements (threshold: 1500). Reduce nesting and virtualize long lists.`,
      impact: 'Faster rendering and reduced memory usage' });
    if (autoRecs.length === 0) autoRecs.push({ priority: 'low', category: 'caching',
      title: 'Maintain Performance Budget',
      description: 'Current metrics are within thresholds. Continue monitoring Core Web Vitals with each release.',
      impact: 'Sustained good user experience' });
    return autoRecs;
  })();

  const recsHtml = effectiveRecs.map((rec, i) => {
    const conf    = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.medium;
    const catIcon = CAT_ICONS[rec.category] || '🔧';
    return `
      <div style="background:${conf.bg};border:1px solid ${conf.bd};border-radius:12px;
        padding:14px 16px;margin-bottom:10px">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:20px;flex-shrink:0">${catIcon}</span>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="font-size:13px;font-weight:700;color:#e2e8f0">${rec.title}</span>
              <span style="font-size:9px;font-weight:700;letter-spacing:1px;padding:2px 8px;
                border-radius:20px;color:${conf.color};background:${conf.color}15;
                border:1px solid ${conf.color}33;text-transform:uppercase">
                ${conf.icon} ${rec.priority}
              </span>
            </div>
            <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6">
              ${rec.description}</p>
            ${rec.impact ? `<div style="margin-top:8px;font-size:11px;font-weight:600;
              color:#10b981">⚡ Impact: ${rec.impact}</div>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  // Quality score calculation (mirrors PDF _compute_quality_score)
  let qScore = passRate;
  if (loadMs < 1500) qScore = Math.min(100, qScore + 5);
  else if (loadMs > 5000) qScore = Math.max(0, qScore - 15);
  else if (loadMs > 3000) qScore = Math.max(0, qScore - 8);
  qScore = Math.max(0, Math.min(100, Math.round(qScore - (critFails.length * 10))));

  const riskLevel = qScore >= 80 && !critFails.length ? { l: 'LOW',    c: '#10b981' }
                  : qScore >= 60                       ? { l: 'MEDIUM', c: '#f59e0b' }
                  :                                      { l: 'HIGH',   c: '#ef4444' };

  const sectionRecs = `
    ${secHdr('🤖', 'AI Recommendations', '#6366f1')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:14px">
      Actionable recommendations generated from performance evidence,
      site type analysis, and Core Web Vitals signals.
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      ${['critical','high','medium','low'].map(p => {
        const count = effectiveRecs.filter(r => r.priority === p).length;
        if (!count) return '';
        const colors = { critical:'#ef4444',high:'#f97316',medium:'#f59e0b',low:'#10b981' };
        return `<span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;
          color:${colors[p]};background:${colors[p]}12;border:1px solid ${colors[p]}30;
          text-transform:capitalize">${count} ${p}</span>`;
      }).join('')}
    </div>
    ${recsHtml}`;

  // ── 9. SCRIPT SUMMARY (matches PDF build_script_section FIX 1) ────────────
  const scriptContent = generation?.result?.script_playwright || generation?.result?.script || '';
  const sectionScript = `
    ${secHdr('📄', `Generated Script Summary — ${framework}`)}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Summary of the AI-generated performance test script.
      The full script file is available as a separate download.
    </div>
    ${tblWrap(`<table style="width:100%;border-collapse:collapse"><tbody>
      ${[
        ['Tests Generated',  `<span style="color:#e2e8f0;font-weight:700">${tests.length}</span> <span style="color:#64748b">${framework} performance tests</span>`],
        ['Framework',        `<span style="color:#E2574C;font-weight:700">${framework}</span>`],
        ['Test Type',        `<span style="color:#8b5cf6;font-weight:700">Performance — Core Web Vitals</span>`],
        ['Site Type',        `<span style="color:#818cf8">${siteType.charAt(0).toUpperCase() + siteType.slice(1)}</span>`],
        ['Metrics Measured', `<span style="color:#818cf8">${['Load Time','FCP','LCP','TTI','DOM Size','JS Size','CSS Size','Image Size'].join(', ')}</span>`],
      ].map(([l, v]) => `
        <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
          <td style="padding:10px 14px;background:rgba(255,255,255,.02);color:#64748b;
            font-weight:700;font-size:12px;white-space:nowrap">${l}</td>
          <td style="padding:10px 14px;font-size:12px">${v}</td>
        </tr>`).join('')}
    </tbody></table>`)}
    <div style="text-align:center;font-size:11px;color:#64748b;font-style:italic;padding:8px">
      * Full Playwright script available as a separate .py download.
      Raw code omitted to keep the report concise.
    </div>`;

  // ── 10. FINAL AI VERDICT (matches PDF build_ai_recommendations final block)
  const finalV = critFails.length
    ? { c: '#ef4444', bg: 'rgba(239,68,68,.08)', bd: 'rgba(239,68,68,.3)', i: '🔴',
        t: `Performance validation FAILED — critical timing metrics exceed thresholds. Core Web Vitals are impacted. Optimization is required before production.` }
    : fail > 0 && passRate >= 60
    ? { c: '#f59e0b', bg: 'rgba(245,158,11,.08)', bd: 'rgba(245,158,11,.3)', i: '🟡',
        t: `Performance validation passed with ${fail} metric(s) exceeding thresholds. Optimizations recommended to improve user experience.` }
    : passRate === 100
    ? { c: '#10b981', bg: 'rgba(16,185,129,.08)', bd: 'rgba(16,185,129,.3)', i: '🟢',
        t: `All performance metrics are within acceptable thresholds. ${loadMs > 3000
          ? 'Performance optimization is recommended to improve load time.'
          : 'The application delivers excellent performance and is ready for production.'}` }
    : { c: '#f59e0b', bg: 'rgba(245,158,11,.08)', bd: 'rgba(245,158,11,.3)', i: '🟡',
        t: `Performance validation completed with a ${passRate}% pass rate. Review failed metrics and confirm optimization strategy.` };

  const sectionFinalVerdict = `
    <div style="background:${finalV.bg};border:2px solid ${finalV.bd};border-radius:14px;
      padding:20px 22px;display:flex;gap:14px;align-items:flex-start;margin-top:8px">
      <span style="font-size:28px;flex-shrink:0">${finalV.i}</span>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:700;color:${finalV.c};margin-bottom:8px">
          Final AI Verdict</div>
        <p style="font-size:13px;color:${finalV.c};margin:0 0 12px;line-height:1.6">
          ${finalV.t}</p>
        <div style="display:flex;gap:24px;flex-wrap:wrap">
          <div>
            <span style="font-size:11px;color:#64748b;font-weight:700">Quality Score </span>
            <span style="font-size:20px;font-family:'Cormorant Garamond',serif;
              font-weight:700;color:${finalV.c}">${qScore}<span style="font-size:12px">/100</span></span>
          </div>
          <div>
            <span style="font-size:11px;color:#64748b;font-weight:700">Risk Level </span>
            <span style="font-size:13px;font-weight:800;color:${riskLevel.c};padding:3px 12px;
              border-radius:12px;background:${riskLevel.c}18;border:1px solid ${riskLevel.c}44">
              ${riskLevel.l}</span>
          </div>
          <div>
            <span style="font-size:11px;color:#64748b;font-weight:700">Global Score </span>
            <span style="font-size:20px;font-family:'Cormorant Garamond',serif;
              font-weight:700;color:${scoreColor}">${score}<span style="font-size:12px">/100</span></span>
          </div>
        </div>
      </div>
    </div>`;

  // ── FULL HTML DOCUMENT ────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>NexTest Performance Report #${genId}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,300;1,700&family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    background:#070e1c;color:#e2e8f0;font-family:'DM Sans',sans-serif;min-height:100vh;
    background-image:
      linear-gradient(rgba(99,102,241,.025) 1px,transparent 1px),
      linear-gradient(90deg,rgba(99,102,241,.025) 1px,transparent 1px);
    background-size:48px 48px;
  }
  .page{max-width:1140px;margin:0 auto;padding:48px 32px 80px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .anim{animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both}
  table{width:100%;border-collapse:collapse}
  th,td{vertical-align:top}
  @media print{
    body{background:#fff;color:#000;background-image:none}
    .no-print{display:none}
    .page{padding:10mm}
    @page{margin:15mm;size:A4}
  }
  @media(max-width:768px){
    .page{padding:24px 16px 60px}
    .stats-row{grid-template-columns:repeat(2,1fr)!important}
  }
</style>
</head>
<body>
<div class="page">

  <!-- ══ REPORT HEADER (matches PDF on_page + header section) ══ -->
  <div class="anim" style="background:linear-gradient(135deg,#040914 0%,#0a1035 50%,#040914 100%);
    border:1px solid rgba(201,162,39,.15);border-radius:24px;padding:40px 48px;margin-bottom:32px;
    position:relative;overflow:hidden">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 60% 80% at 90% 50%,rgba(99,102,241,.08) 0%,transparent 60%);pointer-events:none"></div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,#c9a227,transparent)"></div>

    <!-- Brand + Title -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:16px">
        <div style="width:52px;height:52px;border-radius:14px;flex-shrink:0;
          background:linear-gradient(135deg,#8a6a00,#c9a227,#e8c84a);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 20px rgba(201,162,39,.5)">
          <svg width="26" height="26" viewBox="0 0 44 44" fill="none">
            <circle cx="22" cy="22" r="17" stroke="#060e1e" stroke-width="2" fill="none" opacity=".6"/>
            <polyline points="13,22 20,30 32,14" stroke="#060e1e" stroke-width="3.5"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;
            font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#e2e8f0">
            Nex<span style="color:#c9a227;font-style:italic;font-weight:300">Test</span>
          </div>
          <div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;
            color:#a5b4fc;opacity:.7;margin-top:2px">Performance Analysis</div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:38px;
          font-weight:700;color:#e2e8f0;line-height:1;margin-bottom:8px">
          Performance <em style="color:#818cf8;font-style:italic;font-weight:300">Report</em>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:10px">
          <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;
            border-radius:20px;background:rgba(255,255,255,.04);
            border:1px solid rgba(255,255,255,.08);font-size:11px;color:#94a3b8">
            🕐 ${dateStr} · ${timeStr}
          </span>
          <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;
            border-radius:20px;background:rgba(226,87,76,.08);
            border:1px solid rgba(226,87,76,.2);font-size:11px;font-weight:700;color:#E2574C">
            <b>Pl</b> ${framework}
          </span>
          <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;
            border-radius:20px;background:rgba(99,102,241,.08);
            border:1px solid rgba(99,102,241,.2);font-size:11px;color:#818cf8">
            Performance · ${siteType}
          </span>
        </div>
      </div>
    </div>

    <!-- Info grid (matches PDF info_data table) -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:28px">
      ${[
        { l: 'URL',       v: `<span style="color:#818cf8;font-size:11px;word-break:break-all">${urlVal}</span>` },
        { l: 'Score',     v: `<span style="font-size:22px;font-weight:800;color:${scoreColor};font-family:'Cormorant Garamond',serif">${score}/100 — ${scoreLabel}</span>` },
        { l: 'Load Time', v: `<span style="color:#e2e8f0">${loadMs}ms</span> <span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:10px;color:${loadBadgeC};background:${loadBadgeC}18;border:1px solid ${loadBadgeC}33;margin-left:4px">${loadBadgeL}</span>` },
        { l: 'Site Type', v: `<span style="color:#e2e8f0;text-transform:capitalize">${siteType}</span>` },
      ].map(r => `
        <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);
          border-radius:10px;padding:12px 14px">
          <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
            color:#4f6480;margin-bottom:5px">${r.l}</div>
          <div style="font-size:12px">${r.v}</div>
        </div>`).join('')}
    </div>
  </div>

  <!-- Print button -->
  <div class="no-print" style="display:flex;gap:10px;margin-bottom:28px">
    <button onclick="window.print()"
      style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;
      border-radius:10px;background:linear-gradient(135deg,#6366f1,#4f46e5);
      border:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:11px;
      font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;
      box-shadow:0 4px 16px rgba(99,102,241,.3)">
      🖨 Print / Save as PDF
    </button>
  </div>

  <!-- ══ SCORE + STATS ══ -->
  <div style="margin:36px 0 14px;padding-bottom:10px;border-bottom:2.5px solid #c9a227;
    display:flex;align-items:center;gap:10px">
    <span style="font-size:18px">🎯</span>
    <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;
      font-weight:700;color:#e2e8f0">Global Score</span>
  </div>
  <div style="display:flex;align-items:center;gap:40px;margin-bottom:24px;flex-wrap:wrap">
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
      ${scoreRingSvg}
      <div style="padding:4px 14px;border-radius:20px;background:${scoreColor}15;
        border:1px solid ${scoreColor}33;font-size:12px;font-weight:700;color:${scoreColor}">
        ${scoreLabel}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;flex:1;min-width:280px">
      ${[
        { icon: '✅', val: pass, lbl: 'Passed',    acc: '#10b981', bg: 'rgba(16,185,129,.08)', bd: 'rgba(16,185,129,.25)' },
        { icon: '❌', val: fail, lbl: 'Failed',    acc: '#ef4444', bg: 'rgba(239,68,68,.08)',  bd: 'rgba(239,68,68,.25)'  },
        { icon: '⏭️', val: skip, lbl: 'Skipped',   acc: '#f59e0b', bg: 'rgba(245,158,11,.08)', bd: 'rgba(245,158,11,.25)' },
        { icon: '🎯', val: `${score}/100`, lbl: 'Score', acc: scoreColor, bg: `${scoreColor}12`, bd: `${scoreColor}33` },
      ].map(s => `
        <div style="background:${s.bg};border:1px solid ${s.bd};border-radius:14px;
          padding:18px;text-align:center">
          <div style="font-size:18px;margin-bottom:6px">${s.icon}</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:700;
            color:${s.acc};line-height:1;margin-bottom:4px">${s.val}</div>
          <div style="font-size:9px;font-weight:700;letter-spacing:2px;
            color:${s.acc}99;text-transform:uppercase">${s.lbl}</div>
        </div>`).join('')}
    </div>
  </div>

  <!-- LLaMA Analysis -->
  ${analysis ? `
    <div style="background:rgba(99,102,241,.04);border:1px solid rgba(99,102,241,.15);
      border-radius:12px;padding:14px 18px;margin-bottom:24px;
      display:flex;align-items:flex-start;gap:12px">
      <span style="font-size:22px;flex-shrink:0">🤖</span>
      <div>
        <div style="font-size:11px;font-weight:700;color:#6366f1;letter-spacing:1px;
          text-transform:uppercase;margin-bottom:4px">LLaMA Analysis</div>
        <p style="font-size:13px;color:#94a3b8;margin:0;line-height:1.7">${analysis}</p>
        ${summary ? `<p style="font-size:12px;color:#64748b;margin-top:6px;
          font-style:italic">${summary}</p>` : ''}
      </div>
    </div>` : ''}

  <!-- KEY WEB VITALS -->
  <div style="margin:36px 0 14px;padding-bottom:10px;border-bottom:2.5px solid #6366f1;
    display:flex;align-items:center;gap:10px">
    <span style="font-size:18px">📊</span>
    <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;
      font-weight:700;color:#e2e8f0">Key Web Vitals</span>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:32px">
    ${keyMetricsHtml}
  </div>

  <!-- ALL SECTIONS in PDF order -->
  ${sectionPageAnalysis}
  ${sectionTestPlan}
  ${sectionPlannedMetrics}
  ${sectionSummary}
  ${sectionVerdictSummary}
  ${sectionDetailedMetrics}
  ${sectionRecs}
  ${sectionScript}

  <!-- FINAL AI VERDICT (matches PDF final verdict block) -->
  <div style="margin:36px 0 14px;padding-bottom:10px;border-bottom:2.5px solid #6366f1;
    display:flex;align-items:center;gap:10px">
    <span style="font-size:18px">🤖</span>
    <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;
      font-weight:700;color:#e2e8f0">Final AI Verdict + Quality Score</span>
  </div>
  ${sectionFinalVerdict}

  <!-- FOOTER (matches PDF footer) -->
  <div style="margin-top:60px;padding:24px 32px;background:rgba(6,9,20,.6);
    border:1px solid rgba(255,255,255,.05);border-radius:16px;
    display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;
      font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#64748b">
      Nex<span style="color:#c9a227">Test</span> · AI-Powered Automation
    </div>
    <div style="font-size:11px;color:#64748b">
      Generated ${dateStr} · Performance Test ·
      ${tests.length} metrics · Score: ${score}/100 · Quality: ${qScore}/100
    </div>
  </div>

</div><!-- /page -->
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `performance_report_${genId}.html`;
  link.click();
  setDropdownOpen(false);
};

  useEffect(() => {
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const result     = generation?.result || {};
  const perf       = result?.performance || generation?.performance || {};
  const tests      = result?.test_cases || result?.execution_results || [];
  const metrics    = perf?.metrics || result?.performance?.metrics || result?.metrics || {};
  const recs       = perf?.recommendations || [];
  const score      = perf?.global_score  || 0;
  const scoreLabel = perf?.score_label   || 'N/A';
  const scoreColor = perf?.score_color   || '#f59e0b';
  const siteType   = perf?.site_type     || 'landing';
  const analysis   = perf?.site_analysis || '';
  const summary    = perf?.performance_summary || '';
  const url        = generation?.generation?.url || generation?.url || '';
  const framework  = generation?.framework || generation?.generation?.framework || generation?.result?.framework || generation?.result?.performance?.framework || '';
  const pass = tests.filter(t => t.status === 'pass').length;
  const fail = tests.filter(t => t.status === 'fail').length;
  const skip = tests.filter(t => t.status === 'skip').length;

  const bySection = tests.reduce((acc, t) => {
    const s = t.section || 'other';
    if (!acc[s]) acc[s] = [];
    acc[s].push(t);
    return acc;
  }, {});

  const SECTIONS       = ['timing', 'network', 'assets', 'dom'];
  const SECTION_LABELS = { timing: '⏱ Timing', network: '🌐 Network', assets: '📦 Assets', dom: '🌲 DOM' };
  const SECTION_COLORS = { timing: '#6366f1', network: '#0ea5e9', assets: '#f97316', dom: '#8b5cf6' };

  return (
    <div className="panel">

      {/* ── HEADER ── */}
      <div className="ep-header">

        {/* LEFT */}
        <div className="ep-header-left">
          <div className="gp-tag" style={{ marginBottom: 8, background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)' }}>
            <span className="gp-tag-dot" style={{ background: '#6366f1' }} />
            Performance Analysis
          </div>
          <h1 className="p-title">Performance <span className="g">Test</span></h1>
          <div className="ep-info-bar">
            <div className="ep-info-chip">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"/></svg>
              <span>{url}</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', background: 'rgba(99,102,241,.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,.2)' }}>{siteType}</span>
          </div>
        </div>

        {/* RIGHT — flex column with actions + score ring */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>

          {/* ACTIONS */}
          <div className="ep-actions">

            {/* Download Script */}
            <button onClick={() => {
              const content = generation?.result?.script_playwright || generation?.result?.script || '';
              const blob = new Blob([content], { type: 'text/plain' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = 'performance_playwright.py';
              link.click();
            }} className="ep-dl-btn">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span className="ep-dl-letters" style={{ color: '#E2574C' }}>Pl</span> .py
            </button>

            {/* Dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button className="ep-pdf-btn" onClick={() => setDropdownOpen(o => !o)} disabled={pdfLoading}>
                {pdfLoading ? (<><span className="spinner" /> Generating...</>) : (<>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Download Report
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginLeft: 2, transition: 'transform .2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}><path d="M6 9l6 6 6-6"/></svg>
                </>)}
              </button>

              {dropdownOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 6, boxShadow: '0 8px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(99,102,241,.08)', zIndex: 200, minWidth: 190, animation: 'dFadeUp .18s var(--ease) both' }}>

                  {/* CSV */}
                  <button onClick={() => {
                    const headers = ['ID', 'Metric', 'Value', 'Status', 'Section'];
                    const rows = tests.map(t => [t.id, `"${t.name}"`, t.value || '—', t.status, t.section || 'performance']);
                    const csv  = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `performance_report_${generation?.generation?.id || 'nextest'}.csv`;
                    link.click();
                    setDropdownOpen(false);
                  }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 600, transition: 'all .15s', textAlign: 'left' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--green-bg)'; e.currentTarget.style.color = 'var(--green)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sub)'; }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#10b981' }}>CSV</span>
                    <div><div style={{ fontSize: 12, fontWeight: 700 }}>rapport.csv</div><div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>Métriques tabulaires</div></div>
                  </button>

                  {/* HTML */}
<button onClick={downloadHtml_Performance} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 600, transition: 'all .15s', textAlign: 'left' }}
  onMouseEnter={e => { e.currentTarget.style.background = 'var(--indigo-bg)'; e.currentTarget.style.color = 'var(--indigo3)'; }}
  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sub)'; }}>
  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'var(--indigo-dim)', border: '1px solid var(--indigo-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'var(--indigo2)' }}>HTML</span>
  <div><div style={{ fontSize: 12, fontWeight: 700 }}>rapport.html</div><div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>Rapport visuel</div></div>
</button>
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 6px' }} />

                  {/* PDF */}
                  <button onClick={async () => {
                    try {
                      setPdfLoading(true); setDropdownOpen(false);
                      const id = generation?.generation?.id;
                      if (!id) return;
                      const res  = await api.get(`/generations/${id}/pdf`, { responseType: 'blob' });
                      const blob = new Blob([res.data], { type: 'application/pdf' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = `performance_report_${id}.pdf`;
                      link.click();
                    } catch (err) { console.error(err); }
                    finally { setPdfLoading(false); }
                  }} disabled={pdfLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 600, transition: 'all .15s', textAlign: 'left', opacity: pdfLoading ? .5 : 1 }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.08)'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sub)'; }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#ef4444' }}>PDF</span>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700 }}>rapport.pdf</div><div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>Rapport complet</div></div>
                    {pdfLoading && <span className="spinner" />}
                  </button>

                </div>
              )}
            </div>
            {/* ↑ closes dropdownRef div */}

          </div>
          {/* ↑ closes ep-actions — THE FIX: this was missing/misplaced before */}

          {/* Score ring is INSIDE the right flex column, AFTER ep-actions */}
          <PerformanceScoreRing score={score} label={scoreLabel} color={scoreColor} />

        </div>
        {/* ↑ closes right flex column */}

      </div>
      {/* ↑ closes ep-header */}

      {/* ── SITE ANALYSIS ── */}
      {analysis && (
        <div style={{ background: 'rgba(99,102,241,.04)', border: '1px solid rgba(99,102,241,.15)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🤖</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>LLaMA Analysis</div>
            <p style={{ fontSize: 13, color: 'var(--sub)', margin: 0, lineHeight: 1.7 }}>{analysis}</p>
            {summary && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, fontStyle: 'italic' }}>{summary}</p>}
          </div>
        </div>
      )}

      {/* ── STAT CARDS ── */}
      <div className="ep-stats" style={{ marginBottom: 24 }}>
        {[
          { label: 'Passed',  val: pass,       color: '#10B981', bg: 'rgba(16,185,129,.08)',  border: 'rgba(16,185,129,.2)'  },
          { label: 'Failed',  val: fail,       color: '#EF4444', bg: 'rgba(239,68,68,.08)',   border: 'rgba(239,68,68,.2)'   },
          { label: 'Skipped', val: skip,       color: '#F59E0B', bg: 'rgba(245,158,11,.08)',  border: 'rgba(245,158,11,.2)'  },
          { label: 'Score',   val: `${score}`, color: scoreColor, bg: `${scoreColor}12`, border: `${scoreColor}33` },
        ].map((s, i) => (
          <div key={s.label} className="ep-stat" style={{ '--sc': s.color, '--sb': s.bg, '--sbo': s.border, '--i': i }}>
            <div className="ep-stat-body"><div className="ep-stat-val" style={{ color: s.color }}>{s.val}</div><div className="ep-stat-lbl">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* ── KEY METRICS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { key: 'load_time_ms', label: 'Load Time', icon: '⏱', unit: 'ms' },
          { key: 'fcp_ms',       label: 'FCP',       icon: '🎨', unit: 'ms' },
          { key: 'lcp_ms',       label: 'LCP',       icon: '🖼', unit: 'ms' },
          { key: 'tti_ms',       label: 'TTI',       icon: '🖱', unit: 'ms' },
        ].map(m => {
          const val   = metrics[m.key] ?? perf?.[m.key] ?? null;
          const test  = tests.find(t => t.metric_key === m.key);
          const color = test?.status === 'pass' ? '#10b981' : test?.status === 'fail' ? '#ef4444' : '#f59e0b';
          return (
            <div key={m.key} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', borderTop: `3px solid ${color}` }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--C)', lineHeight: 1 }}>{val != null ? `${val.toLocaleString()}${m.unit}` : 'N/A'}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[{ key: 'metrics', label: '📊 Metrics', count: tests.length }, { key: 'recommendations', label: '💡 Recommendations', count: recs.length }].map(tab => (
          <button key={tab.key} onClick={() => setActiveSection(tab.key)}
            style={{ padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 700, color: activeSection === tab.key ? 'var(--indigo2)' : 'var(--muted)', borderBottom: activeSection === tab.key ? '2px solid var(--indigo2)' : '2px solid transparent', marginBottom: -1, transition: 'all .18s', display: 'flex', alignItems: 'center', gap: 8 }}>
            {tab.label}
            <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: activeSection === tab.key ? 'var(--indigo-bg)' : 'var(--bg2)', color: activeSection === tab.key ? 'var(--indigo2)' : 'var(--muted)' }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ── METRICS TAB ── */}
      {activeSection === 'metrics' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr', gap: 12, padding: '12px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
            {['Metric', 'Value', 'Threshold', 'Status', 'Distribution'].map(h => (<div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</div>))}
          </div>
          {SECTIONS.map(sec => {
            const secTests = bySection[sec] || [];
            if (!secTests.length) return null;
            return (
              <div key={sec}>
                <div style={{ padding: '8px 20px', background: `${SECTION_COLORS[sec]}08`, borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: SECTION_COLORS[sec], display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: SECTION_COLORS[sec] }} />
                  {SECTION_LABELS[sec] || sec}
                </div>
                {secTests.map((test, i) => (<PerformanceMetricRow key={test.id} test={test} index={i} />))}
              </div>
            );
          })}
        </div>
      )}

      {/* ── RECOMMENDATIONS TAB ── */}
      {activeSection === 'recommendations' && (
        <div>
          {recs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 32px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>No recommendations!</h3>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Your site performs well — LLaMA found no major issues.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                {['critical', 'high', 'medium', 'low'].map(p => {
                  const count  = recs.filter(r => r.priority === p).length;
                  if (!count) return null;
                  const colors = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' };
                  return (<span key={p} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: colors[p], background: `${colors[p]}12`, border: `1px solid ${colors[p]}30`, textTransform: 'capitalize' }}>{count} {p}</span>);
                })}
              </div>
              {recs.map((rec, i) => (<RecommendationCard key={i} rec={rec} index={i} />))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ExecutionPanel
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
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const framework = generation?.generation?.framework || generation?.framework || 'Selenium';
  const testType  = generation?.result?.test_type     || generation?.test_type  || 'smoke';

  if (testType === 'performance') {

    
    return <PerformanceExecutionPanel generation={generation} />;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!generation) return;
    const savedResults = generation?.result?.execution_results || generation?.generation?.execution_results || [];
    if (savedResults.length > 0) { setRunResults({ results: savedResults }); return; }
    if (!generation?.result?.test_cases?.length) return;
    const currentFramework = generation?.generation?.framework || generation?.framework || 'Selenium';
    const run = async () => {
      setRunning(true); setRunResults(null);
      try {
        const res = await api.post('/run', { script: generation.result.script || '', framework: currentFramework, test_cases: generation.result.test_cases || [] });
        setRunResults(res.data);
      } catch (err) { console.error('[RUN ERROR]', err.response?.data || err.message); }
      finally { setRunning(false); }
    };
    run();
  }, [generation]);

  const buildTests = (test_cases, execution_results) => {
    if (execution_results && execution_results.length > 0) {
      return execution_results.map((r, i) => ({ id: i + 1, name: r.name, status: r.status, duration: r.duration || '—', suite: r.reason_pass || r.reason || r.error || 'Test', assertion_result: r.assertion_result || null, step_meta: r.step_meta || null, category: r.category || 'smoke', priority: r.priority || 'medium' }));
    }
    return (test_cases || []).map((tc, i) => ({ id: tc.id || i + 1, name: tc.name, status: 'skip', duration: '—', suite: 'Not executed', assertion_result: null, step_meta: null, category: tc.category || 'smoke', priority: tc.priority || 'medium' }));
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
  const rateGrad  = rate >= 80 ? 'linear-gradient(90deg,#10b981,#34d399)' : rate >= 50 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)';

  const TEST_TYPE_BADGE = {
    smoke:       { label: 'Smoke',       color: '#64748b', bg: 'rgba(148,163,184,.12)', border: 'rgba(148,163,184,.3)',  letter: 'S' },
    functional:  { label: 'Functional',  color: '#6366f1', bg: 'rgba(99,102,241,.1)',   border: 'rgba(99,102,241,.25)', letter: 'F' },
    performance: { label: 'Performance', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)',   border: 'rgba(139,92,246,.25)', letter: 'P' },
  };
  const ttBadge = TEST_TYPE_BADGE[testType] || TEST_TYPE_BADGE.smoke;

  const EP_FW = { Selenium: { letters: 'Se', color: '#43B02A' }, Cypress: { letters: 'Cy', color: '#00BFA5' }, Playwright: { letters: 'Pl', color: '#E2574C' }, Both: { letters: '∞', color: '#C9A227' } };
  const fwConf = EP_FW[framework] || EP_FW.Selenium;

  const downloadScript = (type = 'selenium') => {
    let content, filename;
    if (isBoth) {
      content  = type === 'selenium' ? generation?.result?.script_selenium : type === 'playwright' ? generation?.result?.script_playwright : generation?.result?.script_cypress;
      filename = type === 'selenium' ? 'test_selenium.py' : type === 'playwright' ? 'test_playwright.py' : 'test_cypress.js';
    } else {
      const fw = framework?.toLowerCase();
      content  = fw === 'playwright' ? (generation?.result?.script_playwright || generation?.result?.script || '') : fw === 'cypress' ? (generation?.result?.script_cypress || generation?.result?.script || '') : (generation?.result?.script_selenium || generation?.result?.script || '');
      filename = fw === 'playwright' ? 'test_playwright.py' : fw === 'cypress' ? 'test_cypress.js' : 'test_selenium.py';
    }
    const blob = new Blob([content || ''], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = filename; link.click();
  };

  const downloadCsv = () => {
    const headers = ['ID', 'Test Name', 'Status', 'Duration', 'Category', 'Section', 'Suite/Reason'];
    const rows    = tests.map(t => [t.id, `"${t.name.replace(/"/g, '""')}"`, t.status, t.duration, t.category || 'smoke', t.section || '—', `"${(t.suite || '').replace(/"/g, '""')}"`]);
    const csv     = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob    = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link    = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nextest_report_${generation?.generation?.id || 'export'}.csv`;
    link.click();
    setDropdownOpen(false);
  };


const downloadHtml = () => {
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const genId   = generation?.generation?.id || 'nextest';

  const allTests     = tests;
  const pass         = allTests.filter(t => t.status === 'pass').length;
  const fail         = allTests.filter(t => t.status === 'fail').length;
  const skip         = allTests.filter(t => t.status === 'skip').length;
  const total        = allTests.length;
  const rate         = total > 0 ? Math.round((pass / total) * 100) : 0;
  const rateColor    = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
  const loadTime     = generation?.generation?.load_time_ms || 0;
  const loadBadge    = loadTime > 3000 ? 'SLOW' : 'GOOD';
  const loadColor    = loadTime > 3000 ? '#ef4444' : '#10b981';
  const scraped      = generation?.result?.scraped || generation?.scraped || {};
  const pageType     = generation?.result?.page_type || generation?.generation?.page_type || 'general';
  const isSpa        = scraped?.is_spa || false;
  const execResults  = generation?.result?.execution_results || [];

  // ── Helpers ──
  const inferArea = (tc) => {
    const combined = ((tc.name || '') + ' ' + (tc.selector || '')).toLowerCase();
    if (/nav|menu|navigation/.test(combined))    return 'Navigation';
    if (/search|recherche/.test(combined))        return 'Search Bar';
    if (/hero|banner|slider/.test(combined))      return 'Hero Section';
    if (/logo|brand/.test(combined))              return 'Branding';
    if (/main|content|core/.test(combined))       return 'Main Content';
    if (/auth|login|signin/.test(combined))       return 'Authentication';
    if (/cart|checkout|panier/.test(combined))    return 'Cart / Checkout';
    if (/form|input|field/.test(combined))        return 'Form';
    if (/footer/.test(combined))                  return 'Footer';
    if (/h1|heading|identity/.test(combined))     return 'Page Identity';
    return (tc.name || 'UI Element').substring(0, 30);
  };

  const inferElemType = (tc) => {
    const name = ((tc.name || '') + ' ' + (tc.selector || '')).toLowerCase();
    if (/search|recherche/.test(name))     return 'SEARCH';
    if (/nav|menu|link/.test(name))        return 'NAV';
    if (/button|btn|submit/.test(name))    return 'BUTTON';
    if (/hero|banner/.test(name))          return 'HERO';
    if (/image|img|photo/.test(name))      return 'IMAGE';
    if (/form|formulaire|login/.test(name)) return 'FORM';
    if (/input|field|email|password/.test(name)) return 'INPUT';
    if (/modal|dialog/.test(name))         return 'MODAL';
    if (/table|grid|list/.test(name))      return 'TABLE';
    if (/pagination/.test(name))           return 'PAGINATION';
    if (/alert|error/.test(name))          return 'ALERT';
    if (/cart|checkout/.test(name))        return 'CART';
    return 'GENERAL';
  };

  const elemTypeColors = {
    SEARCH:'#3b82f6', NAV:'#10b981', BUTTON:'#8b5cf6', HERO:'#f59e0b',
    IMAGE:'#ec4899', FORM:'#ef4444', INPUT:'#0d9488', LINK:'#06b6d4',
    MODAL:'#6366f1', TABLE:'#f97316', PAGINATION:'#14b8a6',
    ALERT:'#dc2626', CART:'#7c3aed', GENERAL:'#64748b',
  };

  const inferSeverity = (tc) => {
    const h = ((tc.name||'') + ' ' + (tc.selector||'')).toLowerCase();
    if (/nav|menu|header/.test(h))         return ['HIGH',   '#ef4444'];
    if (/auth|login|signin/.test(h))       return ['HIGH',   '#ef4444'];
    if (/dashboard|main content/.test(h))  return ['HIGH',   '#ef4444'];
    if (/checkout|cart/.test(h))           return ['HIGH',   '#ef4444'];
    if (/search/.test(h))                  return ['MEDIUM', '#f59e0b'];
    if (/form|input/.test(h))              return ['MEDIUM', '#f59e0b'];
    if (/hero|banner/.test(h))             return ['MEDIUM', '#f59e0b'];
    if (/logo|brand|image/.test(h))        return ['LOW',    '#10b981'];
    if (/footer|pagination/.test(h))       return ['LOW',    '#10b981'];
    return ['MEDIUM', '#f59e0b'];
  };

  const secHdr = (emoji, title, color = '#c9a227') => `
    <div style="display:flex;align-items:center;gap:10px;margin:32px 0 12px;
      padding-bottom:8px;border-bottom:2.5px solid ${color}">
      <span style="font-size:18px">${emoji}</span>
      <span style="font-size:20px;font-weight:700;color:#1e293b">${title}</span>
    </div>`;

  const tblWrap = (inner, border = '#cbd5e1') => `
    <div style="background:#fff;border:1px solid ${border};border-radius:12px;
      overflow:hidden;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
      ${inner}
    </div>`;

  const tblHdr = (cols) => `
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#0a0f1e">
        ${cols.map(c => `<th style="padding:10px 12px;text-align:${c.align||'left'};
          font-size:9px;letter-spacing:1.5px;text-transform:uppercase;
          color:#94a3b8;font-weight:700">${c.l}</th>`).join('')}
      </tr></thead>`;

  // ── 1. PAGE ANALYSIS ──
  const detected = [];
  if (scraped.inputs?.length)    detected.push({ n: 'Inputs',      c: '#3b82f6', d: `${scraped.inputs.length} champ(s)` });
  if (scraped.buttons?.length)   detected.push({ n: 'Buttons',     c: '#8b5cf6', d: `${scraped.buttons.length} bouton(s)` });
  if (scraped.nav_links?.length) detected.push({ n: 'Navigation',  c: '#10b981', d: `${scraped.nav_links.length} lien(s) de navigation` });
  if (scraped.images?.length)    detected.push({ n: 'Images',      c: '#ec4899', d: `${scraped.images.length} image(s)` });
  if (scraped.forms?.length)     detected.push({ n: 'Forms',       c: '#f59e0b', d: `${scraped.forms.length} formulaire(s)` });
  if (scraped.alerts?.length)    detected.push({ n: 'Alerts',      c: '#ef4444', d: `${scraped.alerts.length} alert(s)` });
  if (scraped.pagination?.length) detected.push({ n: 'Pagination', c: '#06b6d4', d: `${scraped.pagination.length} element(s)` });

  const risks = [];
  if (loadTime > 3000) risks.push(`⚠ Page lente (${loadTime}ms) — test de performance inclus`);
  if (isSpa)           risks.push('⚠ SPA detecte (React/Vue/Angular) — waits explicites requis');
  if (!scraped.inputs?.length && !scraped.buttons?.length) risks.push('⚠ Peu d\'elements interactifs — tests generiques generes');
  if (!scraped.alerts?.length) risks.push('ℹ Aucun conteneur d\'erreur — tests negatifs limites');

  const pageAnalysisRows = detected.length > 0
    ? detected.map(d => `<tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:8px 12px;font-weight:700;color:${d.c}">${d.n}</td>
        <td style="padding:8px 12px;color:#475569;font-size:12px">${d.d}</td>
      </tr>`).join('')
    : `<tr><td colspan="2" style="padding:16px;color:#94a3b8;text-align:center">Aucun element interactif detecte</td></tr>`;

  const sectionPageAnalysis = `
    ${secHdr('🔍', 'Page Analysis')}
    ${tblWrap(`${tblHdr([{l:'Element'},{l:'Details'}])}
      <tbody>${pageAnalysisRows}</tbody></table>`)}
    ${risks.map(r => `<div style="font-size:12px;color:#f59e0b;margin:4px 0">${r}</div>`).join('')}`;

  // ── 2. TEST PLAN ──
  const pageTypeLabels = {
    login: 'Page de connexion', ecommerce: 'Page e-commerce',
    form: 'Page formulaire', dashboard: 'Dashboard', general: 'Page generale',
  };
  const strategy = pageTypeLabels[pageType] || 'Page generale';
  const positiveCount = allTests.filter(t => t.category !== 'negative').length;
  const negativeCount = allTests.filter(t => t.category === 'negative').length;

  const planMetaRows = [
    ['Type de page detecte', `${pageType.toUpperCase()} — ${strategy}`],
    ['Framework', framework],
    ['Nombre de tests', `${total} tests planifies`],
    ['Coverage',
      `<span style="color:#10b981;font-weight:700">${positiveCount} positive smoke validation(s)</span>
       <span style="color:#94a3b8"> | </span>
       <span style="color:#ef4444;font-weight:700">${negativeCount} negative validation(s)</span>`],
  ].map(([l, v]) => `<tr style="border-bottom:1px solid #f1f5f9">
    <td style="padding:8px 12px;background:#f8fafc;color:#64748b;font-weight:700;font-size:12px">${l}</td>
    <td style="padding:8px 12px;font-size:12px">${v}</td>
  </tr>`).join('');

  const scenarioRows = allTests.map((t, i) => {
    const priority  = t.priority || 'high';
    const category  = t.category || 'smoke';
    const priColor  = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#10b981';
    const catColor  = category === 'functional' ? '#3b82f6' : category === 'performance' ? '#8b5cf6' : '#64748b';
    return `<tr style="border-bottom:1px solid #f1f5f9;background:${i%2===0?'#fff':'#f8fafc'}">
      <td style="padding:8px 12px;color:#64748b;font-weight:700;text-align:center">${t.id || i+1}</td>
      <td style="padding:8px 12px">
        <div style="font-weight:700;color:#1e293b;font-size:13px">${t.name}</div>
        <div style="font-size:10px;color:#94a3b8">Pre: Page accessible</div>
      </td>
      <td style="padding:8px 12px;font-size:12px;color:#475569">${t.suite || ''}</td>
      <td style="padding:8px 12px;text-align:center">
        <span style="font-size:9px;font-weight:700;color:${priColor}">${priority.toUpperCase()}</span>
      </td>
      <td style="padding:8px 12px;text-align:center">
        <span style="font-size:9px;font-weight:700;color:${catColor}">${category.toUpperCase()}</span>
      </td>
    </tr>`;
  }).join('');

  const sectionTestPlan = `
    ${secHdr('📋', 'Test Plan')}
    ${tblWrap(`${tblHdr([{l:'Critere'},{l:'Valeur'}])}
      <tbody>${planMetaRows}</tbody></table>`)}
    <div style="font-size:13px;font-weight:700;color:#1e293b;margin:14px 0 8px">Scenarios planifies</div>
    ${tblWrap(`${tblHdr([{l:'#',align:'center'},{l:'Scenario'},{l:'Objectif'},{l:'Priorite',align:'center'},{l:'Categorie',align:'center'}])}
      <tbody>${scenarioRows}</tbody></table>`)}`;

  // ── 3. PLANNED UI ELEMENTS ──
  const plannedRows = allTests.map((t, i) => {
    const elemType  = inferElemType(t);
    const selector  = t.selector || `[data-testid="${(t.name||'').toLowerCase().replace(/\s+/g,'-')}"]`;
    const typeColor = elemTypeColors[elemType] || '#64748b';
    return `<tr style="border-bottom:1px solid #f1f5f9;background:${i%2===0?'#fff':'#f0f4ff'}">
      <td style="padding:8px 12px;color:#64748b;font-weight:700;text-align:center">${t.id||i+1}</td>
      <td style="padding:8px 12px;font-weight:700;color:#1e293b;font-size:12px">${t.name}</td>
      <td style="padding:8px 12px;font-size:11px;color:#4f46e5;font-family:monospace">${selector}</td>
      <td style="padding:8px 12px;text-align:center">
        <span style="color:${typeColor};font-weight:700;font-size:11px">${elemType}</span>
      </td>
      <td style="padding:8px 12px;font-size:11px;color:#475569">${t.suite || 'Element renders and responds correctly'}</td>
    </tr>`;
  }).join('');

  const sectionPlanned = `
    ${secHdr('🎯', 'Planned UI Elements', '#4f46e5')}
    <p style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      AI-predicted DOM elements and selectors before execution.
    </p>
    ${tblWrap(`${tblHdr([{l:'#',align:'center'},{l:'Test Scenario'},{l:'Expected Selector'},{l:'Element Type',align:'center'},{l:'Expected Behavior'}])}
      <tbody>${plannedRows}</tbody></table>`, '#4f46e5')}`;

  // ── 4. TEST SUMMARY ──
  const sectionSummary = `
    ${secHdr('📊', 'Test Summary')}
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">
      ${[
        {icon:'✅', val:pass,       lbl:'PASSED',    c:'#10b981', bg:'#d1fae5', bd:'#a7f3d0'},
        {icon:'❌', val:fail,       lbl:'FAILED',    c:'#ef4444', bg:'#fee2e2', bd:'#fca5a5'},
        {icon:'⏭️', val:skip,       lbl:'SKIPPED',   c:'#f59e0b', bg:'#fef3c7', bd:'#fde68a'},
        {icon:'🎯', val:`${rate}%`, lbl:'PASS RATE', c:rateColor, bg:'#f0f4ff', bd:'#c7d2fe'},
        {icon:'🔢', val:total,      lbl:'TOTAL',     c:'#3b82f6', bg:'#dbeafe', bd:'#93c5fd'},
      ].map(s => `
        <div style="background:${s.bg};border:1px solid ${s.bd};border-radius:14px;padding:20px;text-align:center">
          <div style="font-size:20px;margin-bottom:8px">${s.icon}</div>
          <div style="font-size:36px;font-weight:700;color:${s.c};line-height:1;margin-bottom:4px">${s.val}</div>
          <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:${s.c};opacity:.8;text-transform:uppercase">${s.lbl}</div>
        </div>`).join('')}
    </div>`;

  // ── 5. EXECUTION VERDICT SUMMARY ──
  const areaMap = {};
  allTests.forEach((t, i) => {
    const area = inferArea(t);
    if (!areaMap[area]) areaMap[area] = {pass:0, fail:0, skip:0};
    const st = execResults[i]?.status || t.status || 'skip';
    areaMap[area][st] = (areaMap[area][st] || 0) + 1;
  });

  const passMsg = {
    Navigation: 'Routing system is operational — users can move between pages',
    'Main Content': 'Core content rendered — page body is intact and functional',
    'Search Bar': 'Discovery feature available — users can search for content',
    'Hero Section': 'Above-the-fold content visible — first impression is intact',
    Branding: 'Site identity confirmed — correct domain and brand loaded',
    Authentication: 'Auth entry point is reachable — login flow can be initiated',
    'Cart / Checkout': 'Purchase flow accessible — commerce functionality operational',
    Form: 'Data entry interface available — submission flow can proceed',
    'Page Identity': 'Correct page loaded — H1 and content identity confirmed',
    Footer: 'Page structure complete — footer links and info accessible',
  };

  const verdictRows = Object.entries(areaMap).map(([area, counts]) => {
    const v = counts.fail > 0
      ? {l:'FAIL', c:'#ef4444', bg:'#fef2f2', msg:`Critical: issues detected in ${area}`}
      : counts.pass > 0
      ? {l:'PASS', c:'#10b981', bg:'#f0fdf4', msg: passMsg[area] || `${area} is operational`}
      : {l:'SKIP', c:'#f59e0b', bg:'#fffbeb', msg: 'Not executed — element may be optional'};
    return `<tr style="background:${v.bg};border-bottom:1px solid #f1f5f9">
      <td style="padding:10px 12px;font-weight:700;color:#1e293b">${area}</td>
      <td style="padding:10px 12px;text-align:center">
        <span style="font-size:9px;font-weight:800;padding:3px 10px;border-radius:12px;
          color:${v.c};background:${v.c}18;border:1px solid ${v.c}44">${v.l}</span>
      </td>
      <td style="padding:10px 12px;text-align:center;color:#10b981;font-weight:700">${counts.pass||0}</td>
      <td style="padding:10px 12px;text-align:center;color:#ef4444;font-weight:700">${counts.fail||0}</td>
      <td style="padding:10px 12px;text-align:center;color:#f59e0b;font-weight:700">${counts.skip||0}</td>
      <td style="padding:10px 12px;font-size:11px;color:#475569">${v.msg}</td>
    </tr>`;
  }).join('');

  const critFails = allTests.filter((t,i) => t.status==='fail' && inferSeverity(t)[0]==='HIGH');
  const overallV = critFails.length
    ? {c:'#ef4444', bg:'#fef2f2', i:'🔴', t:`Smoke validation FAILED — critical UI issues detected. Core user journeys are blocked.`}
    : fail > 0
    ? {c:'#b45309', bg:'#fffbeb', i:'🟡', t:`Smoke validation passed with ${fail} medium-priority issue(s). Improvements recommended.`}
    : {c:'#059669', bg:'#f0fdf4', i:'🟢', t:`Core user journey elements are operational. No critical UI blockers detected. Application is ready for functional testing.`};

  const sectionVerdict = `
    ${secHdr('🏁', 'Execution Verdict Summary')}
    <p style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Business-oriented interpretation of test results — maps raw pass/fail data to application health per UI area.
    </p>
    ${tblWrap(`${tblHdr([{l:'UI Area'},{l:'Verdict',align:'center'},{l:'Passed',align:'center'},{l:'Failed',align:'center'},{l:'Skipped',align:'center'},{l:'Interpretation'}])}
      <tbody>${verdictRows}</tbody></table>`)}
    <div style="background:${overallV.bg};border:2px solid ${overallV.c};border-radius:10px;
      padding:14px 18px;display:flex;gap:12px;align-items:flex-start;margin-top:8px">
      <span style="font-size:22px">${overallV.i}</span>
      <div style="font-size:12px;color:${overallV.c};font-weight:600;line-height:1.6">
        <b>Overall Verdict:</b> ${overallV.t}
      </div>
    </div>`;

  // ── 6. TEST CASES ──
  const testCaseRows = allTests.map((t, i) => {
    const sc       = t.status === 'pass' ? '#10b981' : t.status === 'fail' ? '#ef4444' : '#f59e0b';
    const stLabel  = t.status === 'pass' ? '✓ PASS' : t.status === 'fail' ? '✗ FAIL' : '■ SKIP';
    const stBg     = t.status === 'pass' ? '#f0fdf4' : t.status === 'fail' ? '#fef2f2' : '#fffbeb';
    const exec     = execResults[i] || {};
    const [sev, sevColor] = inferSeverity(t);
    const priority = t.priority || 'high';
    const category = t.category || 'smoke';
    const priColor = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#10b981';
    const catColor = category === 'functional' ? '#3b82f6' : '#64748b';

    const deepLines = [];
    if (t.status === 'pass') {
      deepLines.push(`<b style="color:#64748b">assertion_result:</b> <span style="color:#059669">element_found = true</span>`);
      deepLines.push(`<b style="color:#64748b">selector_matched:</b> <span style="color:#059669">"${(t.selector||'').substring(0,40)}" resolved in DOM tree</span>`);
      deepLines.push(`<b style="color:#64748b">render_status:</b> <span style="color:#059669">element rendered successfully after hydration</span>`);
      deepLines.push(`<b style="color:#64748b">visibility_check:</b> <span style="color:#059669">computed style: ${exec.visibility||'unknown'} — check PASSED</span>`);
      deepLines.push(`<b style="color:#64748b">no_exception:</b> <span style="color:#059669">no timeout or exception occurred</span>`);
      if (exec.reason_pass) deepLines.push(`<b style="color:#64748b">ai_note:</b> <span style="color:#059669">${exec.reason_pass.substring(0,60)}</span>`);
    } else if (t.status === 'fail') {
      deepLines.push(`<b style="color:#64748b">severity:</b> <span style="color:${sevColor}">${sev}</span>`);
      deepLines.push(`<b style="color:#64748b">assertion_result:</b> <span style="color:#dc2626">element_found = false</span>`);
      deepLines.push(`<b style="color:#64748b">selector_status:</b> <span style="color:#dc2626">"${(t.selector||'').substring(0,35)}" NOT resolved</span>`);
      deepLines.push(`<b style="color:#64748b">possible_cause:</b> <span style="color:#dc2626">element not rendered or stale locator</span>`);
      if (exec.error || exec.reason) deepLines.push(`<b style="color:#64748b">ai_note:</b> <span style="color:#dc2626">${(exec.error||exec.reason||'').substring(0,60)}</span>`);
    } else {
      deepLines.push(`<b style="color:#64748b">assertion_result:</b> <span style="color:#b45309">skipped = true</span>`);
      deepLines.push(`<b style="color:#64748b">condition_status:</b> <span style="color:#b45309">precondition not met</span>`);
    }

    return `<tr style="border-bottom:1px solid #e2e8f0;background:${i%2===0?'#fff':'#f8fafc'}">
      <td style="padding:10px 12px;color:#64748b;font-weight:700;text-align:center;vertical-align:top">${t.id||i+1}</td>
      <td style="padding:10px 12px;vertical-align:top">
        <div style="font-weight:700;color:#1e293b;font-size:13px;margin-bottom:3px">${t.name}</div>
        <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">${(t.suite||'').substring(0,50)}</div>
        <span style="font-size:9px;font-weight:700;color:${priColor}">${priority.toUpperCase()}</span>
        <span style="color:#94a3b8;font-size:9px"> | </span>
        <span style="font-size:9px;font-weight:700;color:${catColor}">${category.toUpperCase()}</span>
      </td>
      <td style="padding:10px 12px;text-align:center;vertical-align:top">
        <span style="font-size:9px;font-weight:800;padding:4px 10px;border-radius:12px;
          display:inline-block;color:${sc};background:${sc}18;border:1px solid ${sc}44">${stLabel}</span>
      </td>
      <td style="padding:10px 12px;font-size:11px;color:#475569;vertical-align:top">${t.suite||'—'}</td>
      <td style="padding:10px 12px;font-size:10px;line-height:1.7;background:${stBg};vertical-align:top">
        ${deepLines.join('<br/>')}
      </td>
    </tr>`;
  }).join('');

  const sectionTestCases = `
    ${secHdr('🧪', 'Test Cases')}
    ${tblWrap(`${tblHdr([{l:'#',align:'center'},{l:'Test Name'},{l:'Status',align:'center'},{l:'Expected'},{l:'Deep Analysis'}])}
      <tbody>${testCaseRows}</tbody></table>`)}`;

  // ── 7. REAL EXECUTION EVIDENCE ──
  const evidenceRows = allTests.map((t, i) => {
    if (!execResults[i]) return '';
    const exec       = execResults[i];
    const status     = exec.status || t.status;
    const found      = status === 'pass' ? 'YES' : status === 'fail' ? 'NO' : 'N/A';
    const foundColor = status === 'pass' ? '#10b981' : status === 'fail' ? '#ef4444' : '#f59e0b';
    const foundBg    = status === 'pass' ? '#f0fdf4' : status === 'fail' ? '#fef2f2' : '#fffbeb';
    const extracted  = exec.extracted_text || exec.value || (status === 'pass' ? '[empty text]' : 'Not Found');
    const selector   = exec.selector_used || t.selector || '—';
    const visibility = exec.visibility || (status === 'pass' ? 'VISIBLE' : 'DETACHED');
    const visColor   = visibility === 'VISIBLE' || visibility === 'visible' ? '#10b981' : '#ef4444';
    const timing     = exec.response_time_ms ? `${(exec.response_time_ms/1000).toFixed(2)}s` : 'N/A';
    return `<tr style="border-bottom:1px solid #f1f5f9;background:${i%2===0?'#fff':'#f0fdf9'}">
      <td style="padding:8px 12px;color:#64748b;font-weight:700;text-align:center">${t.id||i+1}</td>
      <td style="padding:8px 12px">
        <div style="font-weight:700;color:#1e293b;font-size:12px">${(t.name||'').substring(0,30)}</div>
        <div style="font-size:10px;color:#4f46e5;font-family:monospace">${selector.substring(0,38)}</div>
      </td>
      <td style="padding:8px 12px;text-align:center;background:${foundBg}">
        <span style="font-weight:800;color:${foundColor}">${found}</span>
      </td>
      <td style="padding:8px 12px;font-size:11px;color:#475569">${extracted.substring(0,40)}</td>
      <td style="padding:8px 12px;text-align:center;font-size:11px;color:#6366f1;font-weight:700">${exec.action||t.action||'check_visible'}</td>
      <td style="padding:8px 12px;text-align:center;font-size:11px;font-weight:700;color:${visColor}">${(visibility||'').toUpperCase()}</td>
      <td style="padding:8px 12px;text-align:center;font-size:11px;color:#64748b">${timing}</td>
    </tr>`;
  }).filter(Boolean).join('');

  const sectionEvidence = execResults.length > 0 ? `
    ${secHdr('🔬', 'Real Execution Evidence', '#0d9488')}
    <p style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      DOM-level evidence captured during test run. Each row represents actual browser state at execution time.
    </p>
    ${tblWrap(`${tblHdr([{l:'#',align:'center'},{l:'Test / Selector Used'},{l:'Found',align:'center'},{l:'Extracted Value'},{l:'Action',align:'center'},{l:'Visibility',align:'center'},{l:'Time',align:'center'}])}
      <tbody>${evidenceRows}</tbody></table>`, '#0d9488')}` : '';

  // ── 8. REAL PAGE EVIDENCE ──
  const pageEvidRows = allTests.map((t, i) => {
    const exec       = execResults[i] || {};
    const status     = exec.status || t.status;
    const selector   = t.selector || '—';
    const actualSel  = exec.selector_used || selector;
    const found      = status === 'pass' ? 'YES' : status === 'fail' ? 'NO' : 'N/E';
    const foundColor = status === 'pass' ? '#10b981' : status === 'fail' ? '#ef4444' : '#94a3b8';
    const foundBg    = status === 'pass' ? '#f0fdf4' : status === 'fail' ? '#fef2f2' : '#fff';
    const extracted  = exec.extracted_text || (status==='pass' ? '[empty text]' : 'Not Found');
    const visibility = exec.visibility || (status==='pass' ? 'VISIBLE' : 'unknown');
    const visColor   = visibility==='visible'||visibility==='VISIBLE' ? '#10b981' : '#94a3b8';
    const elemType   = inferElemType(t);
    const typeColor  = elemTypeColors[elemType] || '#64748b';
    return `<tr style="background:${foundBg};border-bottom:1px solid #f1f5f9">
      <td style="padding:8px 12px">
        <span style="color:${typeColor};font-weight:700;font-size:11px">${elemType}</span><br/>
        <span style="color:#475569;font-size:10px">${(t.name||'').substring(0,28)}</span>
      </td>
      <td style="padding:8px 12px;font-size:10px;color:#4f46e5;font-family:monospace">${selector.substring(0,32)}</td>
      <td style="padding:8px 12px;font-size:10px;font-family:monospace;color:${actualSel===selector?'#10b981':'#f59e0b'}">${actualSel.substring(0,32)}</td>
      <td style="padding:8px 12px;text-align:center;font-weight:800;color:${foundColor}">${found}</td>
      <td style="padding:8px 12px;font-size:11px;color:#475569">"${extracted.substring(0,30)}"</td>
      <td style="padding:8px 12px;text-align:center;font-size:10px;font-weight:700;color:${visColor}">${(visibility||'').toUpperCase()}</td>
    </tr>`;
  }).join('');

  const sectionPageEvidence = `
    ${secHdr('📡', 'Real Page Evidence', '#8b5cf6')}
    <p style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Cross-reference of AI-predicted selectors vs. actual DOM elements captured during execution.
    </p>
    ${tblWrap(`${tblHdr([{l:'UI Element'},{l:'Expected Selector'},{l:'Actual Selector'},{l:'Found',align:'center'},{l:'Extracted Value'},{l:'Visibility',align:'center'}])}
      <tbody>${pageEvidRows}</tbody></table>`, '#8b5cf6')}`;

  // ── 9. AI RECOMMENDATIONS ──
  const perfRecs = [];
  if (loadTime > 5000) perfRecs.push(`Page load is critical (${loadTime}ms). Compress images, enable CDN caching, and audit third-party scripts.`);
  else if (loadTime > 3000) perfRecs.push(`Page load is slow (${loadTime}ms). Optimize asset loading and reduce blocking resources.`);
  else perfRecs.push(`Page load is fast (${loadTime}ms). Performance baseline is healthy.`);
  if (isSpa) perfRecs.push('SPA framework detected (React/Vue/Angular). Ensure waits for hydration before asserting element presence.');

  const relRecs = [];
  const fragile = allTests.filter(t => {
    const s = t.selector || '';
    return s === 'body' || s.startsWith('h1') || s === 'img' || s === 'nav' || s.length < 5;
  });
  if (fragile.length > 0) {
    fragile.slice(0, 4).forEach(t => {
      relRecs.push(`"${(t.name||'').substring(0,35)}" uses generic selector (${(t.selector||'').substring(0,40)}). Recommendation: add data-testid="${(t.name||'').toLowerCase().replace(/\s+/g,'-')}" for selector stability.`);
    });
  } else {
    relRecs.push('Selectors appear specific and stable. Continue using ID-based and attribute selectors.');
  }
  if (skip > 0) relRecs.push(`${skip} test(s) skipped. Verify optional elements are not misclassified as required.`);

  const uxRecs = [];
  const navPassed = allTests.some((t,i) => inferArea(t)==='Navigation' && (execResults[i]?.status||t.status)==='pass');
  uxRecs.push(navPassed
    ? 'Core navigation is visible — users can access main site sections.'
    : 'Navigation is non-functional or untested. User flow between sections is at risk.');
  const contentPassed = allTests.some((t,i) => ['Main Content','Page Identity'].includes(inferArea(t)) && (execResults[i]?.status||t.status)==='pass');
  if (contentPassed) uxRecs.push('Primary content area is rendered — reading experience is intact.');
  const searchTested = allTests.some(t => /search/.test((t.name||'').toLowerCase()));
  if (!searchTested) uxRecs.push('Search functionality was not tested. Consider adding a search smoke check if it is a core feature.');

  const recCategories = [
    { emoji: '⚡', label: 'Performance',       recs: perfRecs, color: '#f59e0b', bg: '#fef3c7' },
    { emoji: '🔧', label: 'Reliability',        recs: relRecs,  color: '#4f46e5', bg: '#e0e7ff' },
    { emoji: '👤', label: 'UX & Accessibility', recs: uxRecs,   color: '#10b981', bg: '#d1fae5' },
  ];

  const recsHtml = recCategories.map(cat => `
    <div style="background:${cat.bg};border:1px solid ${cat.color};border-radius:8px;
      padding:10px 14px;margin-bottom:4px;font-weight:700;color:${cat.color}">
      ${cat.emoji} ${cat.label}
    </div>
    ${cat.recs.map(r => `
      <div style="background:#fafafa;border-left:3px solid ${cat.color};
        padding:8px 14px 8px 16px;margin-bottom:2px;font-size:12px;color:#475569;
        border-bottom:1px solid #f1f5f9">
        • ${r}
      </div>`).join('')}
    <div style="margin-bottom:10px"></div>`).join('');

  // Quality score
  let qScore = rate;
  if (loadTime < 1500) qScore = Math.min(100, qScore + 5);
  else if (loadTime > 5000) qScore = Math.max(0, qScore - 15);
  else if (loadTime > 3000) qScore = Math.max(0, qScore - 8);
  qScore = Math.max(0, Math.min(100, Math.round(qScore - critFails.length * 10)));
  const riskLevel = qScore >= 80 && !critFails.length ? {l:'LOW',c:'#10b981'} : qScore >= 60 ? {l:'MEDIUM',c:'#f59e0b'} : {l:'HIGH',c:'#ef4444'};

  const finalVc = critFails.length ? '#ef4444' : fail > 0 && rate >= 60 ? '#b45309' : rate === 100 ? '#059669' : '#b45309';
  const finalVbg = critFails.length ? '#fef2f2' : fail > 0 && rate >= 60 ? '#fffbeb' : rate === 100 ? '#f0fdf4' : '#fffbeb';
  const finalVi = critFails.length ? '🔴' : fail > 0 && rate >= 60 ? '🟡' : rate === 100 ? '🟢' : '🟡';
  const finalVt = critFails.length
    ? `Smoke validation FAILED due to critical issues. Core user journeys are blocked — do not promote to staging until resolved.`
    : fail > 0 && rate >= 60
    ? `Smoke validation passed with ${fail} medium-priority issue(s) detected. Improvements recommended before production release.`
    : rate === 100
    ? `Smoke validation passed successfully with no critical UI issues detected. ${loadTime > 3000 ? 'Performance optimization is recommended to improve load time.' : 'Application is stable and ready for functional testing.'}`
    : `Smoke validation completed with a ${rate}% pass rate. Review skipped tests and confirm selector health before proceeding.`;

  const sectionRecs = `
    ${secHdr('🤖', 'AI Recommendations', '#4f46e5')}
    <p style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:14px">
      Actionable recommendations generated from execution evidence, page profile analysis, and selector health signals.
    </p>
    ${recsHtml}
    <div style="background:${finalVbg};border:2px solid ${finalVc};border-radius:12px;
      padding:16px 20px;margin-top:12px">
      <div style="font-size:14px;font-weight:700;color:${finalVc};margin-bottom:8px">
        ${finalVi} Final AI Verdict
      </div>
      <p style="font-size:12px;color:${finalVc};margin:0 0 12px;line-height:1.6">${finalVt}</p>
      <div style="font-size:12px">
        <span style="color:#64748b;font-weight:700">Quality Score: </span>
        <span style="color:${finalVc};font-weight:700">${qScore}/100</span>
        <span style="color:#94a3b8;margin:0 12px">|</span>
        <span style="color:#64748b;font-weight:700">Risk Level: </span>
        <span style="color:${riskLevel.c};font-weight:700">${riskLevel.l}</span>
      </div>
    </div>`;

  // ── 10. GENERATED SCRIPT SUMMARY ──
  const scriptContent = generation?.result?.script || generation?.result?.script_playwright || generation?.result?.script_selenium || '';
  const hasWaits    = /WebDriverWait|waitFor|cy\.wait|wait_for/.test(scriptContent);
  const hasHeadless = /headless/i.test(scriptContent);
  const areas       = [...new Set(allTests.map(t => inferArea(t)))].slice(0, 8).join(', ');

  const scriptMetaRows = [
    ['Tests Generated', `<b>${total}</b> ${framework} tests`],
    ['Framework', framework],
    ['Explicit Waits', hasWaits ? '<span style="color:#10b981;font-weight:700">Enabled</span>' : '<span style="color:#f59e0b;font-weight:700">Not detected</span>'],
    ['Headless Mode', hasHeadless ? '<span style="color:#10b981;font-weight:700">Headless Chrome configured</span>' : '<span style="color:#94a3b8">Not configured</span>'],
    ['Tested UI Areas', `<span style="color:#4f46e5">${areas || 'General'}</span>`],
  ].map(([l, v]) => `<tr style="border-bottom:1px solid #f1f5f9">
    <td style="padding:8px 12px;background:#f8fafc;color:#64748b;font-weight:700;font-size:12px">${l}</td>
    <td style="padding:8px 12px;font-size:12px">${v}</td>
  </tr>`).join('');

  const sectionScript = `
    ${secHdr('📄', `Generated Script Summary — ${framework}`)}
    <p style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Summary of the AI-generated test script. The full script file is available as a separate download.
    </p>
    ${tblWrap(`${tblHdr([{l:'Property'},{l:'Value'}])}
      <tbody>${scriptMetaRows}</tbody></table>`)}
    <p style="font-size:10px;color:#94a3b8;text-align:center;font-style:italic;margin-top:8px">
      * Full script available as a separate downloadable file. Raw code omitted from this report to keep it concise.
    </p>`;

  // ── FULL HTML DOCUMENT ──
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>NexTest Report #${genId}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#f8fafc;color:#1e293b;font-family:'DM Sans',sans-serif;min-height:100vh}
  .page{max-width:1100px;margin:0 auto;padding:48px 32px 80px}
  table{width:100%;border-collapse:collapse}
  th,td{vertical-align:top}
  @media print{
    body{background:#fff}
    .no-print{display:none}
    .page{padding:10mm}
    @page{margin:15mm;size:A4}
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#0a0f1e 0%,#1e2a4a 50%,#0a0f1e 100%);
    border-radius:20px;padding:40px 48px;margin-bottom:32px;position:relative;overflow:hidden">
    <div style="position:absolute;bottom:0;left:0;right:0;height:4px;
      background:linear-gradient(90deg,transparent,#c9a227,transparent)"></div>
    <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#c9a227"></div>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:20px">
      <div>
        <div style="font-size:28px;font-weight:700;color:#fff;letter-spacing:2px;margin-bottom:4px">
          <span style="color:#c9a227">NEX</span>TEST
        </div>
        <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:12px">Test Automation Report</div>
        <div style="font-size:11px;color:#94a3b8">Generated ${dateStr} · ${timeStr}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:11px;color:#64748b;margin-bottom:6px">Generated by NexTest — AI-Powered Test Automation Platform</div>
      </div>
    </div>

    <!-- INFO GRID -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:28px">
      ${[
        {l:'URL', v:`<span style="color:#818cf8;font-size:11px;word-break:break-all">${url}</span>`},
        {l:'Framework', v:`<span style="font-weight:700;color:#fff">${framework}</span>`},
        {l:'Load Time', v:`<span style="color:#fff">${loadTime}ms</span> <span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px;color:${loadColor};background:${loadColor}18;border:1px solid ${loadColor}33;margin-left:6px">${loadBadge}</span>`},
        {l:'Page Type', v:`<span style="color:#fff;text-transform:capitalize">${isSpa ? 'SPA (React/Vue/Angular)' : 'Standard HTML'}</span>`},
      ].map(r => `
        <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);
          border-radius:10px;padding:12px 14px">
          <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
            color:#4f6480;margin-bottom:5px">${r.l}</div>
          <div style="font-size:12px">${r.v}</div>
        </div>`).join('')}
    </div>
  </div>

  <!-- LEGEND -->
  <div style="font-size:11px;color:#64748b;margin-bottom:28px;padding:10px 16px;
    background:#fff;border:1px solid #e2e8f0;border-radius:8px">
    <b>Priority:</b>
    <span style="color:#ef4444;font-weight:700;margin-left:8px">HIGH</span>
    <span style="color:#f59e0b;font-weight:700;margin-left:8px">MEDIUM</span>
    <span style="color:#10b981;font-weight:700;margin-left:8px">LOW</span>
    <span style="color:#94a3b8;margin:0 8px">|</span>
    <b>Category:</b>
    <span style="color:#3b82f6;font-weight:700;margin-left:8px">FUNCTIONAL</span>
    <span style="color:#8b5cf6;font-weight:700;margin-left:8px">PERFORMANCE</span>
    <span style="color:#ec4899;font-weight:700;margin-left:8px">UI</span>
    <span style="color:#10b981;font-weight:700;margin-left:8px">NAVIGATION</span>
  </div>

  <!-- PRINT BUTTON -->
  <div class="no-print" style="margin-bottom:28px">
    <button onclick="window.print()" style="padding:10px 24px;border-radius:10px;
      background:linear-gradient(135deg,#6366f1,#4f46e5);border:none;color:#fff;
      font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;
      box-shadow:0 4px 14px rgba(99,102,241,.3)">
      🖨 Print / Save as PDF
    </button>
  </div>

  ${sectionPageAnalysis}
  ${sectionTestPlan}
  ${sectionPlanned}
  ${sectionSummary}
  ${sectionVerdict}
  ${sectionTestCases}
  ${sectionEvidence}
  ${sectionPageEvidence}
  ${sectionRecs}
  ${sectionScript}

  <!-- FOOTER -->
  <div style="margin-top:48px;padding:20px 28px;background:#f1f5f9;border-radius:12px;
    display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;
    border:1px solid #e2e8f0">
    <div style="font-size:14px;font-weight:700;color:#64748b">
      <span style="color:#0a0f1e">NEX</span><span style="color:#c9a227">TEST</span>
      <span style="font-weight:400;margin-left:6px">· AI-Powered Test Automation</span>
    </div>
    <div style="font-size:11px;color:#94a3b8">
      Generated ${dateStr} · ${framework} · ${total} tests · ${rate}% pass rate
    </div>
  </div>

</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `nextest_report_${genId}.html`;
  link.click();
  setDropdownOpen(false);
};
 

  const downloadPdf = async () => {
    try {
      setPdfLoading(true); setDropdownOpen(false);
      const id = generation?.generation?.id;
      if (!id) return;
      const res  = await api.get(`/generations/${id}/pdf`, { responseType: 'blob' });
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
          <div className="ep-empty-icon"><svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
          <h3>No Execution Yet</h3>
          <p>Generate tests first from <strong>New Generation</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="ep-header">
        <div className="ep-header-left">
          <div className="gp-tag" style={{ marginBottom: 8 }}><span className="gp-tag-dot" />Test Execution</div>
          <h1 className="p-title">Test <span className="g">Execution</span></h1>
          <div className="ep-info-bar">
            <div className="ep-info-chip">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span>{url}</span>
            </div>
            <div className="ep-info-chip" style={{ color: fwConf.color, borderColor: `${fwConf.color}33`, background: `${fwConf.color}11` }}>
              <span className="ep-fw-dot" style={{ background: fwConf.color }} />{fwConf.letters} · {framework}
            </div>
            <div className="ep-info-chip" style={{ color: ttBadge.color, borderColor: ttBadge.border, background: ttBadge.bg }}>{ttBadge.letter} · {ttBadge.label}</div>
          </div>
        </div>

        <div className="ep-actions">
          {isBoth ? (
            <>
              <button className="ep-dl-btn" onClick={() => downloadScript('selenium')}><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span className="ep-dl-letters" style={{ color: '#43B02A' }}>Se</span> .py</button>
              <button className="ep-dl-btn" onClick={() => downloadScript('playwright')}><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span className="ep-dl-letters" style={{ color: '#E2574C' }}>Pl</span> .py</button>
              <button className="ep-dl-btn" onClick={() => downloadScript('cypress')}><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span className="ep-dl-letters" style={{ color: '#00BFA5' }}>Cy</span> .js</button>
            </>
          ) : (
            <button className="ep-dl-btn" onClick={() => downloadScript()}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span className="ep-dl-letters" style={{ color: fwConf.color }}>{fwConf.letters}</span>
              {framework === 'Cypress' ? '.js' : '.py'}
            </button>
          )}

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button className="ep-pdf-btn" onClick={() => setDropdownOpen(o => !o)} disabled={pdfLoading}>
              {pdfLoading ? (<><span className="spinner" /> Generating...</>) : (<>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                Download Report
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginLeft: 2, transition: 'transform .2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}><path d="M6 9l6 6 6-6"/></svg>
              </>)}
            </button>

            {dropdownOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 6, boxShadow: '0 8px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(99,102,241,.08)', zIndex: 200, minWidth: 190, animation: 'dFadeUp .18s var(--ease) both' }}>
                <button onClick={downloadCsv} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 600, transition: 'all .15s', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--green-bg)'; e.currentTarget.style.color = 'var(--green)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sub)'; }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#10b981', letterSpacing: .5 }}>CSV</span>
                  <div><div style={{ fontSize: 12, fontWeight: 700 }}>rapport.csv</div><div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>Données tabulaires</div></div>
                </button>
                <button onClick={downloadHtml} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 600, transition: 'all .15s', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--indigo-bg)'; e.currentTarget.style.color = 'var(--indigo3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sub)'; }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'var(--indigo-dim)', border: '1px solid var(--indigo-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'var(--indigo2)', letterSpacing: .5 }}>HTML</span>
                  <div><div style={{ fontSize: 12, fontWeight: 700 }}>rapport.html</div><div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>Rapport visuel</div></div>
                </button>
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 6px' }} />
                <button onClick={downloadPdf} disabled={pdfLoading} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 600, transition: 'all .15s', textAlign: 'left', opacity: pdfLoading ? .5 : 1 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.08)'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sub)'; }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#ef4444', letterSpacing: .5 }}>PDF</span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700 }}>rapport.pdf</div><div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>Rapport complet</div></div>
                  {pdfLoading && <span className="spinner" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isBoth && (
        <div className="ep-tabs">
          {[{ key: 'selenium', label: 'Selenium', letters: 'Se', color: '#43B02A', count: testsSelenium.length }, { key: 'cypress', label: 'Cypress', letters: 'Cy', color: '#00BFA5', count: testsCypress.length }].map(tab => (
            <button key={tab.key} className={`ep-tab${activeTab === tab.key ? ' active' : ''}`} onClick={() => { setActiveTab(tab.key); setFilter('all'); }} style={{ '--tab-color': tab.color }}>
              <span className="ep-tab-letters" style={{ color: tab.color }}>{tab.letters}</span>{tab.label}<span className="ep-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="ep-stats">
        {[
          { label: 'Passed',    val: pass,       color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', icon: <svg width="18" height="18" fill="none" stroke="#10B981" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> },
          { label: 'Failed',    val: fail,       color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   icon: <svg width="18" height="18" fill="none" stroke="#EF4444" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg> },
          { label: 'Skipped',   val: skip,       color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  icon: <svg width="18" height="18" fill="none" stroke="#F59E0B" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> },
          { label: 'Pass Rate', val: `${rate}%`, color: rateColor, bg: `${rateColor}12`, border: `${rateColor}33`, icon: <svg width="18" height="18" fill="none" stroke={rateColor} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
        ].map((s, i) => (
          <div key={s.label} className="ep-stat" style={{ '--sc': s.color, '--sb': s.bg, '--sbo': s.border, '--i': i }}>
            <div className="ep-stat-icon">{s.icon}</div>
            <div className="ep-stat-body"><div className="ep-stat-val" style={{ color: s.color }}>{s.val}</div><div className="ep-stat-lbl">{s.label}</div></div>
            <div className="ep-stat-bar-wrap">
              <div className="ep-stat-bar-fill" style={{ height: `${s.label === 'Pass Rate' ? rate : s.label === 'Passed' ? (pass / Math.max(tests.length,1)) * 100 : s.label === 'Failed' ? (fail / Math.max(tests.length,1)) * 100 : (skip / Math.max(tests.length,1)) * 100}%`, background: s.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="ep-progress-card">
        <div className="ep-progress-top">
          <div className="ep-progress-info">
            {running ? (<><span className="spinner" style={{ marginRight: 8 }} /><span style={{ color: 'var(--indigo2)' }}>Running tests...</span></>) : (<><svg width="14" height="14" fill="none" stroke="var(--green)" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg><span>{tests.length} tests executed</span><span className="ep-progress-sep">·</span><span style={{ color: 'var(--muted)' }}>{loadTimeMs}ms load time</span></>)}
          </div>
          <div className="ep-progress-rate" style={{ color: rateColor }}>{rate}% pass rate</div>
        </div>
        <div className="ep-progress-track">
          <div className="ep-progress-fill" style={{ width: `${running ? 100 : rate}%`, background: running ? 'linear-gradient(90deg,var(--indigo),var(--indigo2))' : rateGrad }} />
          {!running && rate > 0 && (<div className="ep-progress-label-inside" style={{ left: `${Math.min(rate, 92)}%` }}>{rate}%</div>)}
        </div>
      </div>

      <div className="ep-filters">
        {[{ key: 'all', label: 'All', count: tests.length }, { key: 'pass', label: 'Passed', count: pass }, { key: 'fail', label: 'Failed', count: fail }, { key: 'skip', label: 'Skipped', count: skip }].map(f => (
          <button key={f.key} className={`ep-filter${filter === f.key ? ' on' : ''}`} onClick={() => setFilter(f.key)}>
            {f.key === 'pass' && <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>}
            {f.key === 'fail' && <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>}
            {f.key === 'skip' && <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>}
            {f.label}<span className="ep-filter-count">{f.count}</span>
          </button>
        ))}
        <div className="ep-filter-right"><span style={{ fontSize: 11, color: 'var(--muted)' }}>Showing {shown.length} of {tests.length}</span></div>
      </div>

      <div className="ep-list">
        {running
          ? Array.from({ length: tests.length || 4 }).map((_, i) => (
              <div key={i} className="ep-row ep-row--skeleton" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="ep-row-status-wrap"><div className="ep-skeleton-circle" /></div>
                <div className="ep-row-body"><div className="ep-skeleton-line" style={{ width: '55%', height: 13 }} /><div className="ep-skeleton-line" style={{ width: '35%', height: 10, marginTop: 6 }} /></div>
                <div className="ep-skeleton-pill" />
              </div>
            ))
          : shown.length === 0
          ? (<div className="ep-no-results"><svg width="24" height="24" fill="none" stroke="var(--muted)" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>No tests match this filter</div>)
          : shown.map((test, i) => (
              <div key={test.id} className={`ep-row ep-row--${test.status}`} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="ep-row-status-wrap"><StatusIcon s={test.status} /></div>
                <div className="ep-row-body">
                  <div className="ep-row-name">{test.name}</div>
                  <div className="ep-row-suite">{test.suite}</div>
                  {test.assertion_result && <AssertionBadge assertion_result={test.assertion_result} step_meta={test.step_meta} />}
                </div>
                <div className="ep-row-meta">
                  <span className="ep-cat-badge" style={{ color: test.category === 'functional' ? '#6366f1' : test.category === 'performance' ? '#8b5cf6' : '#64748b', background: test.category === 'functional' ? 'rgba(99,102,241,.1)' : test.category === 'performance' ? 'rgba(139,92,246,.1)' : 'rgba(100,116,139,.1)', border: `1px solid ${test.category === 'functional' ? 'rgba(99,102,241,.2)' : test.category === 'performance' ? 'rgba(139,92,246,.2)' : 'rgba(100,116,139,.2)'}` }}>
                    {test.category === 'smoke' ? 'S' : test.category === 'functional' ? 'F' : 'R'}
                  </span>
                  <span className={`ep-status-badge ep-status-badge--${test.status}`}>{test.status}</span>
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
};

const TYPE_CONFIG = {
  smoke:       { color: '#64748B', bg: 'rgba(100,116,139,.1)', border: 'rgba(100,116,139,.25)', label: 'Smoke',       letter: 'S' },
  functional:  { color: '#6366F1', bg: 'rgba(99,102,241,.1)',  border: 'rgba(99,102,241,.25)',  label: 'Functional',  letter: 'F' },
  performance: { color: '#8B5CF6', bg: 'rgba(139,92,246,.1)',  border: 'rgba(139,92,246,.25)',  label: 'Performance', letter: 'P' },
};

const rateColor = (r) => r >= 80 ? '#10B981' : r >= 50 ? '#F59E0B' : '#EF4444';

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)     return `${Math.floor(diff)}s ago`;
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
};

function SortIcon({ active, dir }) {
  return (
    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ opacity: active ? 1 : .3, transition: 'opacity .2s' }}>
      {active && dir === 'desc' ? <path d="M7 10l5 5 5-5"/> : <path d="M7 14l5-5 5 5"/>}
    </svg>
  );
}

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
        <button className="hp2-sb-close" onClick={onClose}><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
      <div className="hp2-sb-body">
        <div className="hp2-sb-sec"><div className="hp2-sb-sec-title">Target URL</div><div className="hp2-sb-url">{item.url}</div></div>
        <div className="hp2-sb-sec">
          <div className="hp2-sb-sec-title">Configuration</div>
          <div className="hp2-sb-meta">
            <div className="hp2-sb-meta-row"><span className="hp2-sb-meta-label">Framework</span><span className="hp2-fw-badge" style={{ color: fw.color, background: fw.bg, border: `1px solid ${fw.border}` }}>{fw.letters} · {item.framework}</span></div>
            <div className="hp2-sb-meta-row"><span className="hp2-sb-meta-label">Test Type</span><span className="hp2-type-badge" style={{ color: type.color, background: type.bg, border: `1px solid ${type.border}` }}>{type.label}</span></div>
            <div className="hp2-sb-meta-row"><span className="hp2-sb-meta-label">Load Time</span><span className="hp2-sb-meta-val" style={{ color: 'var(--indigo2)', fontSize: 12 }}>{item.load_time_ms || 0}ms</span></div>
            <div className="hp2-sb-meta-row"><span className="hp2-sb-meta-label">Generated</span><span className="hp2-sb-meta-val" style={{ fontSize: 12 }}>{timeAgo(item.created_at)}</span></div>
          </div>
        </div>
        <div className="hp2-sb-sec">
          <div className="hp2-sb-sec-title">Test Results · {total} total</div>
          <div className="hp2-sb-results">
            {[{ val: item.pass_count||0, lbl:'Passed', color:'var(--green)', bg:'var(--green-bg)', border:'var(--green-border)' }, { val:item.fail_count||0, lbl:'Failed', color:'var(--red)', bg:'var(--red-bg)', border:'var(--red-border)' }, { val:item.skip_count||0, lbl:'Skipped', color:'var(--amber)', bg:'var(--amber-bg)', border:'var(--amber-border)' }].map(s => (
              <div key={s.lbl} className="hp2-sb-res-card" style={{ background: s.bg, border: `1px solid ${s.border}` }}><div className="hp2-sb-res-val" style={{ color: s.color }}>{s.val}</div><div className="hp2-sb-res-lbl" style={{ color: s.color }}>{s.lbl}</div></div>
            ))}
          </div>
        </div>
        <div className="hp2-sb-sec">
          <div className="hp2-sb-sec-title">Distribution</div>
          <div className="hp2-sb-progress">
            {[{ label: 'Pass', pct: total > 0 ? Math.round((item.pass_count||0)/total*100):0, color:'var(--green)' }, { label:'Fail', pct:total>0?Math.round((item.fail_count||0)/total*100):0, color:'var(--red)' }, { label:'Skip', pct:total>0?Math.round((item.skip_count||0)/total*100):0, color:'var(--amber)' }].map(p => (
              <div key={p.label} className="hp2-sb-prog-row"><span className="hp2-sb-prog-label">{p.label}</span><div className="hp2-sb-prog-track"><div className="hp2-sb-prog-fill" style={{ width:`${p.pct}%`, background:p.color }}/></div><span className="hp2-sb-prog-pct" style={{ color:p.color }}>{p.pct}%</span></div>
            ))}
          </div>
        </div>
        <div className="hp2-sb-sec" style={{ textAlign:'center', padding:'20px' }}>
          <div style={{ fontFamily:'var(--C)', fontSize:56, fontWeight:700, color:rc, lineHeight:1, marginBottom:6 }}>{item.pass_rate||0}%</div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)' }}>Global Pass Rate</div>
          <div style={{ height:6, borderRadius:6, background:'var(--bg2)', marginTop:14, overflow:'hidden' }}><div style={{ height:'100%', borderRadius:6, width:`${item.pass_rate||0}%`, background:`linear-gradient(90deg,${rc},${rc}88)`, transition:'width 1.2s var(--ease)' }}/></div>
        </div>
      </div>
      <div className="hp2-sb-actions">
        <button className="hp2-sb-btn-primary" onClick={() => onView(item)}><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>View Full Results</button>
        <button className="hp2-sb-btn-danger" onClick={() => onDelete(item.id)} disabled={deleting === item.id}>{deleting === item.id ? '...' : (<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>)}</button>
      </div>
    </aside>
  );
}

function ProjectDropdown({ projects, filterProject, setFilterProject }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const dropRef = useRef(null);
  const selected = projects.find(p => String(p.id) === filterProject);

  useEffect(() => {
    const handler = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        dropRef.current && !dropRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropH = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const goUp = spaceBelow < dropH;
      setPos({
        top: goUp ? rect.top - dropH - 4 : rect.bottom + 4,
        left: rect.left,
      });
    }
    setOpen(o => !o);
  };

  const dropdown = open ? createPortal(
    <div
      ref={dropRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: 200,
        background: '#0D1526',
        border: '1px solid rgba(99,102,241,.3)',
        borderRadius: 10,
        padding: 4,
        boxShadow: '0 12px 40px rgba(0,0,0,.7), 0 0 0 1px rgba(99,102,241,.1)',
        zIndex: 999999,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{
        padding: '6px 10px',
        fontSize: 8, fontWeight: 700, letterSpacing: 1.5,
        textTransform: 'uppercase', color: 'rgba(165,180,252,.6)',
        borderBottom: '1px solid rgba(99,102,241,.08)',
        marginBottom: 4,
      }}>
        Filter by Project
      </div>

      {/* All Projects */}
      <button
        onClick={() => { setFilterProject('all'); setOpen(false); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: '7px 10px', borderRadius: 7,
          background: filterProject === 'all' ? 'rgba(99,102,241,.12)' : 'transparent',
          border: filterProject === 'all' ? '1px solid rgba(99,102,241,.25)' : '1px solid transparent',
          cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 11, fontWeight: 600, textAlign: 'left',
          marginBottom: 1, transition: 'all .15s',
          color: filterProject === 'all' ? '#a5b4fc' : '#94a3b8',
        }}
        onMouseEnter={e => {
          if (filterProject !== 'all') e.currentTarget.style.background = 'rgba(255,255,255,.04)';
        }}
        onMouseLeave={e => {
          if (filterProject !== 'all') e.currentTarget.style.background = 'transparent';
        }}
      >
        <span style={{
          width: 24, height: 24, borderRadius: 6, flexShrink: 0,
          background: filterProject === 'all' ? 'rgba(99,102,241,.15)' : 'rgba(255,255,255,.05)',
          border: filterProject === 'all' ? '1px solid rgba(99,102,241,.25)' : '1px solid rgba(255,255,255,.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
        }}>📁</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: filterProject === 'all' ? '#a5b4fc' : '#e2e8f0' }}>
            All Projects
          </div>
          <div style={{ fontSize: 9, color: 'rgba(148,163,184,.5)', marginTop: 1 }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </div>
        </div>
        {filterProject === 'all' && (
          <svg width="11" height="11" fill="none" stroke="#a5b4fc" strokeWidth="3" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        )}
      </button>

      {/* Divider */}
      {projects.length > 0 && (
        <div style={{ height: 1, background: 'rgba(99,102,241,.08)', margin: '4px 4px 5px' }} />
      )}

      {/* Liste projets */}
      <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {projects.map(p => {
          const isActive = String(p.id) === filterProject;
          const isPublic = p.type === 'public';
          const color   = isPublic ? '#4f86e8' : '#8b5cf6';
          const colorBg = isPublic ? 'rgba(79,134,232,.1)'  : 'rgba(139,92,246,.1)';
          const colorBd = isPublic ? 'rgba(79,134,232,.25)' : 'rgba(139,92,246,.25)';
          return (
            <button
              key={p.id}
              onClick={() => { setFilterProject(String(p.id)); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '7px 10px', borderRadius: 7,
                background: isActive ? colorBg : 'transparent',
                border: isActive ? `1px solid ${colorBd}` : '1px solid transparent',
                cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 11, fontWeight: 600, textAlign: 'left',
                transition: 'all .15s',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,.04)';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{
                width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                background: colorBg, border: `1px solid ${colorBd}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
              }}>
                {isPublic ? '🌐' : '🔒'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700, fontSize: 11,
                  color: isActive ? color : '#e2e8f0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 9, marginTop: 2 }}>
                  <span style={{
                    color, fontWeight: 700,
                    fontSize: 8, letterSpacing: '.5px', textTransform: 'uppercase',
                  }}>
                    {isPublic ? 'Public' : 'Internal'}
                  </span>
                </div>
              </div>
              {isActive && (
                <svg width="11" height="11" fill="none" stroke={color} strokeWidth="3" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', borderRadius: 8,
          background: open ? 'rgba(99,102,241,.1)' : '#0D1526',
          border: open ? '1.5px solid rgba(99,102,241,.4)' : '1.5px solid rgba(99,102,241,.15)',
          color: '#e2e8f0', fontSize: 11, fontWeight: 600,
          fontFamily: 'inherit', cursor: 'pointer',
          minWidth: 150, transition: 'all .2s',
          boxShadow: open ? '0 0 0 3px rgba(99,102,241,.12)' : 'none',
        }}
      >
        <span style={{ fontSize: 12 }}>
          {filterProject === 'all' ? '📁' : selected?.type === 'public' ? '🌐' : '🔒'}
        </span>
        <span style={{
          flex: 1, textAlign: 'left',
          overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', maxWidth: 110,
          color: open ? '#a5b4fc' : '#e2e8f0',
        }}>
          {filterProject === 'all' ? 'All Projects' : selected?.name || 'Project'}
        </span>
        <svg
          width="10" height="10" fill="none"
          stroke={open ? '#818cf8' : '#64748b'}
          strokeWidth="2.5" viewBox="0 0 24 24"
          style={{ flexShrink: 0, transition: 'transform .22s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {dropdown}
    </div>
  );
}

function HistoryPanel({ goTo, setGeneration }) {
  const { t } = useLang();
  const [histories,     setHistories]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [filterFw,      setFilterFw]      = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [projects,      setProjects]      = useState([]);
  const [sortKey,       setSortKey]       = useState('date');
  const [sortDir,       setSortDir]       = useState('desc');
  const [selected,      setSelected]      = useState(null);
  const [deleting,      setDeleting]      = useState(null);

useEffect(() => {
  Promise.all([api.get('/generations'), api.get('/projects')])
    .then(([genRes, projRes]) => {
      setHistories(genRes.data);
      setProjects(projRes.data);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);

  const totalGen   = histories.length;
  const totalTests = histories.reduce((s, h) => s + (h.pass_count||0) + (h.fail_count||0) + (h.skip_count||0), 0);
  const totalPass  = histories.reduce((s, h) => s + (h.pass_count||0), 0);
  const avgRate    = histories.length ? Math.round(histories.reduce((s, h) => s + (h.pass_rate||0), 0) / histories.length) : 0;

  const filtered = histories
  .filter(h => {
    const matchSearch = (h.url || '').toLowerCase().includes(search.toLowerCase());
    const matchFw      = filterFw === 'all' || h.framework === filterFw;
    const matchProject = filterProject === 'all' || String(h.project_id) === String(filterProject);
    return matchSearch && matchFw && matchProject;
  })
    .sort((a, b) => {
      let va, vb;
      if (sortKey === 'date')  { va = new Date(a.created_at); vb = new Date(b.created_at); }
      if (sortKey === 'rate')  { va = a.pass_rate||0; vb = b.pass_rate||0; }
      if (sortKey === 'tests') { va = (a.pass_count||0)+(a.fail_count||0)+(a.skip_count||0); vb = (b.pass_count||0)+(b.fail_count||0)+(b.skip_count||0); }
      return sortDir === 'desc' ? vb - va : va - vb;
    });

  const toggleSort = (key) => { if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortKey(key); setSortDir('desc'); } };

  const handleView = (item) => {
    setGeneration({
      url: item.url, framework: item.framework, test_type: item.test_type,
      generation: { id: item.id, url: item.url, framework: item.framework, load_time_ms: item.load_time_ms, test_type: item.test_type },
      result: {
        test_type: item.test_type||'smoke', test_cases: item.test_cases||[],
        test_cases_selenium: item.test_cases_selenium||[], test_cases_cypress: item.test_cases_cypress||[],
        script: item.script||'', script_selenium: item.script_selenium||'',
        script_playwright: item.script_playwright||'', script_cypress: item.script_cypress||'',
        execution_results: item.execution_results||[],
        performance: item.performance_data || item.performance || null,
      },
    });
    goTo('execution');
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try { await api.delete(`/generations/${id}`); setHistories(prev => prev.filter(h => h.id !== id)); if (selected?.id === id) setSelected(null); } catch (e) { console.error(e); }
    setDeleting(null);
  };

  const COLUMNS = [{ label:'#', key:null }, { label:'URL', key:null }, { label:'Framework', key:null }, { label:'Type', key:null }, { label:'Tests', key:'tests' }, { label:'Pass Rate', key:'rate' }, { label:'Date', key:'date' }, { label:'Actions', key:null }];

  return (
    <div className="panel">
      <div className="hp2-header">
        <div><h1 className="p-title">{t('generation')} <span className="g">{t('history')}</span></h1><p className="p-sub">{t('historyDesc')}</p></div>
        <button className="btn-primary" onClick={() => goTo('generate')}><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>New Generation</button>
      </div>

      {histories.length > 0 && (
        <div className="hp2-stats">
          {[{ icon:'🚀', val:totalGen, lbl:'Total Generations', sc:'var(--gold)' }, { icon:'🔬', val:totalTests, lbl:'Tests Executed', sc:'var(--indigo2)' }, { icon:'✅', val:totalPass, lbl:'Tests Passed', sc:'var(--green)' }, { icon:'🎯', val:`${avgRate}%`, lbl:'Avg Pass Rate', sc:'var(--amber)' }].map((s, i) => (
            <div key={s.lbl} className="hp2-stat" style={{ '--i':i, '--sc':s.sc }}><div className="hp2-stat-icon">{s.icon}</div><div><div className="hp2-stat-val">{s.val}</div><div className="hp2-stat-lbl">{s.lbl}</div></div></div>
          ))}
        </div>
      )}

      {histories.length > 0 && (
        <div className="hp2-toolbar">
          <div className="hp2-search">
            <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Search by URL…" value={search} onChange={e => setSearch(e.target.value)} />
            {search && (<button onClick={() => setSearch('')} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', padding:0, display:'flex' }}><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button>)}
          </div>
          <ProjectDropdown projects={projects} filterProject={filterProject} setFilterProject={setFilterProject} />

          <div className="hp2-filters">
            {['all','Selenium','Cypress','Playwright'].map(fw => {
              const conf = FW_CONFIG[fw];
              return (<button key={fw} className={`hp2-filter-btn ${filterFw===fw?'on':''}`} onClick={() => setFilterFw(fw)}>{conf && <span style={{ width:8, height:8, borderRadius:'50%', background:filterFw===fw?'#fff':conf.color, display:'inline-block', flexShrink:0 }}/>}{fw==='all'?'All':fw}</button>);
            })}
          </div>
          {[{ key:'date', label:'Date', icon:<svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }, { key:'rate', label:'Pass Rate', icon:<svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> }, { key:'tests', label:'Tests', icon:<svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/></svg> }].map(s => (
            <button key={s.key} className={`hp2-sort-btn ${sortKey===s.key?'active':''}`} onClick={() => toggleSort(s.key)}>{s.icon} {s.label}<SortIcon active={sortKey===s.key} dir={sortDir}/></button>
          ))}
          <div className="hp2-count-badge">{filtered.length} result{filtered.length!==1?'s':''}</div>
        </div>
      )}

      <div className="hp2-layout">
        <div className="hp2-table-wrap">
          {histories.length > 0 && (
            <div className="hp2-thead">
              {COLUMNS.map(col => (<div key={col.label} className={`hp2-th ${sortKey===col.key?'sorted':''}`} onClick={() => col.key && toggleSort(col.key)}>{col.label}{col.key && <SortIcon active={sortKey===col.key} dir={sortDir}/>}</div>))}
            </div>
          )}
          <div className="hp2-tbody">
            {loading ? (
              Array.from({ length:5 }).map((_,i) => (<div key={i} className="hp2-row" style={{ cursor:'default', padding:'16px 26px' }}><div className="hp2-skel-line" style={{ width:'100%', height:13 }}/></div>))
            ) : filtered.length === 0 ? (
              <div className="hp2-empty">
                <div className="hp2-empty-icon"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
                <h3>{search||filterFw!=='all'?'No results found':t('noHistoryYet')}</h3>
                <p>{search||filterFw!=='all'?'Try adjusting your search or filters':t('noHistoryDesc')}</p>
              </div>
            ) : (
              filtered.map((item, i) => {
                const fw    = FW_CONFIG[item.framework]   || FW_CONFIG.Selenium;
                const type  = TYPE_CONFIG[item.test_type] || TYPE_CONFIG.smoke;
                const total = (item.pass_count||0)+(item.fail_count||0)+(item.skip_count||0);
                const rc    = rateColor(item.pass_rate||0);
                const isSel = selected?.id === item.id;
                return (
                  <div key={item.id} className={`hp2-row ${isSel?'selected':''}`} style={{ '--ri':i }} onClick={() => setSelected(isSel?null:item)}>
                    <div className="hp2-td"><span className="hp2-num">{i+1}</span></div>
                    <div className="hp2-td hp2-url-cell"><span className="hp2-url-main">{item.url}</span><span className="hp2-url-sub">ID #{item.id} · {item.load_time_ms||0}ms</span></div>
                    <div className="hp2-td"><span className="hp2-fw-badge" style={{ color:fw.color, background:fw.bg, border:`1px solid ${fw.border}` }}>{fw.letters}</span></div>
                    <div className="hp2-td"><span className="hp2-type-badge" style={{ color:type.color, background:type.bg, border:`1px solid ${type.border}` }}>{type.letter}</span></div>
                    <div className="hp2-td hp2-tests-cell">
                      <div className="hp2-tests-nums"><span style={{ color:'var(--green)', fontWeight:700 }}>{item.pass_count||0}</span><span style={{ color:'var(--muted)' }}>·</span><span style={{ color:'var(--red)' }}>{item.fail_count||0}</span><span style={{ color:'var(--muted)' }}>·</span><span style={{ color:'var(--amber)' }}>{item.skip_count||0}</span></div>
                      <div className="hp2-tests-bar"><div className="hp2-tests-bar-seg" style={{ width:`${total?(item.pass_count||0)/total*100:0}%`, background:'var(--green)' }}/><div className="hp2-tests-bar-seg" style={{ width:`${total?(item.fail_count||0)/total*100:0}%`, background:'var(--red)' }}/><div className="hp2-tests-bar-seg" style={{ width:`${total?(item.skip_count||0)/total*100:0}%`, background:'var(--amber)' }}/></div>
                    </div>
                    <div className="hp2-td hp2-rate-cell"><span className="hp2-rate-num" style={{ color:rc }}>{item.pass_rate||0}%</span><div className="hp2-rate-bar"><div className="hp2-rate-fill" style={{ width:`${item.pass_rate||0}%`, background:rc }}/></div></div>
                    <div className="hp2-td"><span className="hp2-date">{timeAgo(item.created_at)}</span></div>
                    <div className="hp2-td hp2-actions-cell" onClick={e => e.stopPropagation()}>
                      <button className="hp2-act-btn view" title="View results" onClick={() => handleView(item)}><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>
                      <button className="hp2-act-btn del" title="Delete" onClick={() => handleDelete(item.id)} disabled={deleting===item.id}>{deleting===item.id?'...':(<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>)}</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        {selected && (<DetailSidebar item={selected} onClose={() => setSelected(null)} onView={handleView} onDelete={handleDelete} deleting={deleting} />)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AccountPanel
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
    try { const res = await api.put('/profile/update', { name, email }); setUser(res.data.user); setMsg(t('profileUpdated')); }
    catch (err) { setError(err.response?.data?.message || t('errorOccurred')); }
    setLoading(false);
  };

  const changePassword = async () => {
    if (newPwd !== confirmPwd) { setError(t('passwordMismatch')); return; }
    setLoading(true); setMsg(''); setError('');
    try { await api.put('/profile/password', { current_password: currPwd, new_password: newPwd, new_password_confirmation: confirmPwd }); setMsg(t('passwordChanged')); setCurrPwd(''); setNewPwd(''); setConfirmPwd(''); }
    catch (err) { setError(err.response?.data?.errors?.current_password?.[0] || t('errorOccurred')); }
    setLoading(false);
  };

  const IconEyeOn  = (<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
  const IconEyeOff = (<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);

 function FloatField({ label, value, onChange, type = 'text', icon }) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === 'password';
  const inputType  = isPassword ? (showPwd ? 'text' : 'password') : type;
  const active     = focused || (value?.length > 0);

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

    {/* ← œil visible SEULEMENT quand le champ est actif (focus ou valeur) */}
    {isPassword && active && (
      <button
        type="button"
        className={`ac2-eye-btn${showPwd ? ' visible' : ''}`}
        onClick={() => setShowPwd(v => !v)}
        tabIndex={-1}
      >
        {showPwd ? IconEyeOn : IconEyeOff}
      </button>
    )}

    <div className="ac2-field-bar" />
  </div>
);
}
  const IconUser   = (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>);
  const IconMail   = (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
  const IconLock   = (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
  const IconShield = (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);

  return (
    <div className="panel">
      <div className="p-header"><div><h1 className="p-title">{t('my')} <span className="g">{t('account')}</span></h1><p className="p-sub">{t('accountDesc')}</p></div></div>
      {msg   && (<div className="ac2-feedback ac2-feedback--ok"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>{msg}</div>)}
      {error && (<div className="ac2-feedback ac2-feedback--err"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>{error}</div>)}
      <div className="ac2-hero">
        <div className="ac2-avatar-wrap">
          <div className="ac2-avatar">{user?.avatar ? <img src={user.avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/> : <span>{user?.name?.[0]?.toUpperCase()||'U'}</span>}</div>
          <input type="file" id="avatar-upload" accept="image/*" style={{ display:'none' }} onChange={async (e) => { const file=e.target.files[0]; if(!file) return; const fd=new FormData(); fd.append('avatar',file); try { const res=await api.post('/profile/avatar',fd,{headers:{'Content-Type':'multipart/form-data'}}); setUser(prev=>({...prev,avatar:res.data.avatar})); } catch(err){console.error(err);} }} />
          <button className="ac2-avatar-btn" onClick={() => document.getElementById('avatar-upload').click()}><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></button>
        </div>
        <div className="ac2-hero-info"><div className="ac2-hero-name">{user?.name||'User'}</div><div className="ac2-hero-email">{user?.email||'—'}</div><div className="ac2-hero-badge"><span className="ac2-badge-dot"/>QA Engineer</div></div>
      </div>
      <div className="ac2-grid">
        <div className="ac2-card">
          <div className="ac2-card-head"><div className="ac2-card-head-icon">{IconUser}</div><div><div className="ac2-card-title">{t('profileInformation')}</div><div className="ac2-card-sub">Update your display name and email</div></div></div>
          <div className="ac2-card-body">
            <FloatField label={t('fullName')} value={name} onChange={setName} type="text" icon={IconUser} />
            <FloatField label={t('emailAddress')} value={email} onChange={setEmail} type="email" icon={IconMail} />
            <button className="ac2-btn" onClick={saveProfile} disabled={loading}>{loading ? (<><span className="spinner"/> {t('saving')}</>) : (<><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>{t('saveChanges')}</>)}</button>
          </div>
        </div>
        <div className="ac2-card">
          <div className="ac2-card-head"><div className="ac2-card-head-icon">{IconShield}</div><div><div className="ac2-card-title">{t('changePassword')}</div><div className="ac2-card-sub">Keep your account secure</div></div></div>
          <div className="ac2-card-body">
            <FloatField label={t('currentPassword')} value={currPwd} onChange={setCurrPwd} type="password" icon={IconLock} />
            <FloatField label={t('newPassword')} value={newPwd} onChange={setNewPwd} type="password" icon={IconLock} />
            <FloatField label={t('confirmNewPassword')} value={confirmPwd} onChange={setConfirmPwd} type="password" icon={IconLock} />
            {newPwd.length > 0 && (
              <div className="ac2-strength">
                <div className="ac2-strength-bars">{[1,2,3,4].map(n => (<div key={n} className={`ac2-strength-bar ${newPwd.length>=n*3?(n<=1?'weak':n<=2?'fair':n<=3?'good':'strong'):''}`}/>))}</div>
                <span className="ac2-strength-label">{newPwd.length<4?'Weak':newPwd.length<7?'Fair':newPwd.length<10?'Good':'Strong'}</span>
              </div>
            )}
            <button className="ac2-btn ac2-btn--indigo" onClick={changePassword} disabled={loading}>{loading ? (<><span className="spinner"/> {t('updating')}</>) : (<>{IconShield}{t('updatePassword')}</>)}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SettingsPanel
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
    api.get('/settings').then(res => { setNotifs(res.data.email_notifications); setWeekly(res.data.weekly_report); setFramework(res.data.default_framework); if (!theme||theme==='light') setTheme(res.data.theme||'light'); setLanguage(res.data.language||'en'); });
  }, []);

  const saveSettings = async () => {
    setLoading(true); setMsg('');
    try { await api.put('/settings/update', { email_notifications:notifs, weekly_report:weekly, default_framework:framework, theme, language }); applyLang(language); setMsg(t('settingsSaved')); setTimeout(() => setMsg(''), 3000); }
    catch (err) { console.error(err); }
    setLoading(false);
  };

  const LANGS = [{ code:'en', label:'English', flag:'🇬🇧' }, { code:'fr', label:'Français', flag:'🇫🇷' }, { code:'ar', label:'العربية', flag:'🇹🇳' }];

  return (
    <div className="panel">
      <div className="p-header"><div><h1 className="p-title">{t('appSettings')} <span className="g">{t('settings')}</span></h1><p className="p-sub">{t('customize')}</p></div><button className="btn-primary" onClick={saveSettings} disabled={loading}>{loading?<><span className="spinner"/>{t('saving')}</>:<>{t('saveSettings')}</>}</button></div>
      {msg && <div className="success-msg">✓ {msg}</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div className="set-group">
          <div className="set-group-title">{t('notifications')}</div>
          <div className="set-row"><div><div className="set-name">{t('emailNotif')}</div><div className="set-desc">{t('emailNotifDesc')}</div></div><div className={`toggle${notifs?' on':''}`} onClick={() => setNotifs(p=>!p)}><span className="toggle-knob"/></div></div>
          <div className="set-row"><div><div className="set-name">{t('weeklyReport')}</div><div className="set-desc">{t('weeklyReportDesc')}</div></div><div className={`toggle${weekly?' on':''}`} onClick={() => setWeekly(p=>!p)}><span className="toggle-knob"/></div></div>
        </div>
        <div className="set-group">
          <div className="set-group-title">{t('exportDefaults')}</div>
          <div className="set-row"><div><div className="set-name">{t('defaultFramework')}</div><div className="set-desc">{t('defaultFrameworkDesc')}</div></div><select className="set-select" value={framework} onChange={e => setFramework(e.target.value)}><option>Selenium</option><option>Cypress</option><option>Playwright</option><option>Both</option></select></div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div className="set-group">
          <div className="set-group-title">{t('appearance')}</div>
          <div style={{ padding:'16px 20px' }}>
            <div className="set-name" style={{ marginBottom:4 }}>{t('theme')}</div>
            <div className="set-desc" style={{ marginBottom:14 }}>{t('themeDesc')}</div>
            <div style={{ display:'flex', gap:12 }}>
              {[{ key:'light', emoji:'☀️', label:'Light' }, { key:'dark', emoji:'🌙', label:'Dark' }, { key:'system', emoji:'💻', label:'System' }].map(th => (
                <div key={th.key} onClick={() => { setTheme(th.key); api.put('/settings/update', { theme:th.key }); }} style={{ flex:1, padding:'14px 12px', borderRadius:12, cursor:'pointer', border:theme===th.key?'2px solid var(--gold)':'1.5px solid var(--border)', background:theme===th.key?'var(--goldbg)':'var(--bg)', transition:'all .2s', textAlign:'center' }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>{th.emoji}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:theme===th.key?'var(--gold)':'var(--muted)' }}>{th.label}</div>
                  {theme===th.key && <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--gold)', margin:'6px auto 0' }}/>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="set-group">
          <div className="set-group-title">{t('language')}</div>
          <div style={{ padding:'16px 20px' }}>
            <div className="set-name" style={{ marginBottom:4 }}>{t('interfaceLang')}</div>
            <div className="set-desc" style={{ marginBottom:14 }}>{t('langDesc')}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {LANGS.map(l => (
                <div key={l.code} onClick={() => setLanguage(l.code)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:10, cursor:'pointer', border:language===l.code?'2px solid var(--gold)':'1.5px solid var(--border)', background:language===l.code?'var(--goldbg)':'var(--bg)', transition:'all .2s' }}>
                  <span style={{ fontSize:20 }}>{l.flag}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:language===l.code?'var(--gold)':'var(--muted)', flex:1 }}>{l.label}</span>
                  {language===l.code && <svg width="16" height="16" fill="none" stroke="var(--gold)" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>}
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
  const [page,           setPage]          = useState('dashboard');
  const [collapsed,      setCollapse]      = useState(false);
  const [theme,          setTheme]         = useState(() => {
    const saved = localStorage.getItem('nextest-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    localStorage.setItem('nextest-theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    return 'dark';
  });
  const [generation,      setGeneration]    = useState(null);
  const [currentProject,  setCurrentProject] = useState(null);
  const [selectedPageUrl, setSelectedPageUrl] = useState('');
  const [projectStep,     setProjectStep]   = useState('list');

  const { user, logout } = useAuth();
  const { t }            = useLang();

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('nextest-theme', theme); }, [theme]);

  const handleGenerateNav = () => { setProjectStep('list'); setCurrentProject(null); setSelectedPageUrl(''); setPage('generate'); };

  const NAV_MAIN = [
    { id: 'dashboard', label: t('dashboard'),     badge: null     },
    { id: 'generate',  label: 'Projects',          badge: t('new') },
    { id: 'execution', label: t('testExecution'), badge: null     },
    { id: 'history',   label: t('history'),       badge: null     },
  ];
  const NAV_USER = [{ id: 'account', label: t('account') }, { id: 'settings', label: t('settings') }];
  const LABELS   = { dashboard: t('dashboard'), generate: t('newGeneration'), execution: t('testExecution'), history: t('history'), account: t('account'), settings: t('settings') };

  return (
    <div className="dash-root" style={{ position:'fixed', top:0, left:0, right:0, bottom:0, width:'100vw', height:'100vh', display:'flex', flexDirection:'row', overflow:'hidden' }}>
      <aside className={`sidebar${collapsed?' collapsed':''}`}>
        <NexLogo collapsed={collapsed} />
        <button className="s-toggle" onClick={() => setCollapse(p=>!p)}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">{collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}</svg>
        </button>
        <nav className="s-nav">
          <div className="s-group">
            {!collapsed && <div className="s-label">{t('main')}</div>}
            {NAV_MAIN.map(it => (<SItem key={it.id} {...it} active={page===it.id} collapsed={collapsed} onClick={it.id==='generate'?handleGenerateNav:setPage} />))}
          </div>
          <div className="s-divider" />
          <div className="s-group">
            {!collapsed && <div className="s-label">{t('user')}</div>}
            {NAV_USER.map(it => (<SItem key={it.id} {...it} active={page===it.id} collapsed={collapsed} onClick={setPage} />))}
          </div>
        </nav>
        <div className="s-footer">
          <button className="s-item s-logout" onClick={logout} title={t('logout')}><span className="s-icon">{IC.logout}</span>{!collapsed && <span className="s-label-txt">{t('logout')}</span>}</button>
        </div>
      </aside>

      <div className="main">
        <header className="header">
          <div className="h-left">
            <div className="h-breadcrumb">
              <span className="h-bc-root">NexTest</span>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color:'#e5e7f0' }}><path d="M9 18l6-6-6-6"/></svg>
              <span className="h-bc-page">{LABELS[page]}</span>
            </div>
          </div>
          <div className="h-search"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color:'#9ca3af', flexShrink:0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input type="text" placeholder={t('searchPlaceholder')} /></div>
          <div className="h-right">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button className="h-icon-btn"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg><span className="notif-dot"/></button>
            <div className="h-sep"/>
            <div className="h-avatar">{user?.avatar ? <img src={user.avatar} alt="av" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }}/> : <span>{user?.name?.[0]?.toUpperCase()||'U'}</span>}</div>
            <div><div className="h-user-name">{user?.name?.split(' ')[0]||'User'}</div><div className="h-user-role">{t('qaEngineer')}</div></div>
          </div>
        </header>

        <div className="content">
          {page === 'dashboard' && <DashboardPanel user={user} goTo={setPage} />}
          {page === 'generate' && (
            <>
              {projectStep === 'list' && (<ProjectsListPanel onNewProject={() => setProjectStep('create')} onSelectProject={(project) => { setCurrentProject(project); setProjectStep('detail'); }} />)}
              {projectStep === 'detail' && (<ProjectDetailPanel project={currentProject} onBack={() => setProjectStep('list')} onNewGeneration={() => { setSelectedPageUrl(''); setProjectStep('generate'); }} setGeneration={setGeneration} goTo={setPage} />)}
              {projectStep === 'create' && (
                <>
                  <button onClick={() => setProjectStep('list')} style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, color:'var(--muted)', background:'none', border:'none', cursor:'pointer', padding:'0 0 20px', transition:'color .18s', letterSpacing:'.5px', textTransform:'uppercase' }} onMouseEnter={e=>e.currentTarget.style.color='var(--indigo2)'} onMouseLeave={e=>e.currentTarget.style.color='var(--muted)'}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>Back to projects
                  </button>
                  <CreateProjectPanel onProjectCreated={(project) => { setCurrentProject(project); setProjectStep('detail'); }} />
                </>
              )}
              {projectStep === 'generate' && (
                <>
                  <button onClick={() => setProjectStep('detail')} style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, color:'var(--muted)', background:'none', border:'none', cursor:'pointer', padding:'0 0 20px', transition:'color .18s', letterSpacing:'.5px', textTransform:'uppercase' }} onMouseEnter={e=>e.currentTarget.style.color='var(--indigo2)'} onMouseLeave={e=>e.currentTarget.style.color='var(--muted)'}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>Back to project
                  </button>
                  <GeneratePanel goTo={(p) => { setProjectStep('list'); setPage(p); }} setGeneration={setGeneration} project={currentProject} initialUrl={selectedPageUrl} />
                </>
              )}
            </>
          )}
          {page === 'execution' && <ExecutionPanel generation={generation} />}
          {page === 'history'   && <HistoryPanel   goTo={setPage} setGeneration={setGeneration} />}
          {page === 'account'   && <AccountPanel   user={user} />}
          {page === 'settings'  && <SettingsPanel  theme={theme} setTheme={setTheme} />}
        </div>
      </div>
      <NextestChatbot theme={theme} />
    </div>
  );
}
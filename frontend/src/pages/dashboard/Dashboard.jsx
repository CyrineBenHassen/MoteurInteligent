import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

/* ══════════════════════════════════════════════════════
   LOGO — 100% identique à nav__brand de HomePage.jsx
   Gem dorée gradient + NexTest (Cormorant) + Test Automation
══════════════════════════════════════════════════════ */
function NexLogo() {
  return (
    <div className="s-logo">
      {/* .nav__gem copié exactement depuis Home.css */}
      <div className="nav__gem">
        <svg width="22" height="22" viewBox="0 0 44 44" fill="none">
          <rect width="44" height="44" rx="11" fill="none"/>
          <polyline
            points="8,14 22,30 36,14"
            stroke="#060e1e" strokeWidth="4" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
          />
          <line
            x1="8" y1="30" x2="36" y2="30"
            stroke="rgba(6,14,30,0.5)" strokeWidth="2.5" strokeLinecap="round"
          />
        </svg>
      </div>

      {/* .logo-words masqué quand collapsed */}
      <div className="logo-words">
        {/* .nav__name — Cormorant Garamond 700, uppercase, letter-spacing 3px */}
        <div className="nav__name">NexTest</div>
        {/* .nav__sub — DM Sans 500, gold, uppercase, letter-spacing 4px */}
        <div className="nav__sub">Test Automation</div>
      </div>
    </div>
  );
}

/* ══ ICÔNES SVG pour la nav ══ */
const IC = {
  dashboard: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  generate:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  execution: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  history:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  account:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  settings:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
};

const NAV_MAIN = [
  { id:'dashboard', label:'Dashboard',      badge:null  },
  { id:'generate',  label:'New Generation', badge:'New' },
  { id:'execution', label:'Test Execution', badge:null  },
  { id:'history',   label:'History',        badge:null  },
];
const NAV_USER = [
  { id:'account',  label:'Account'  },
  { id:'settings', label:'Settings' },
];

function SItem({ id, label, badge, active, collapsed, onClick }) {
  return (
    <button
      className={`s-item${active ? ' active' : ''}`}
      onClick={() => onClick(id)}
      title={collapsed ? label : ''}
    >
      <span className="s-icon">{IC[id]}</span>
      {!collapsed && <span className="s-label-txt">{label}</span>}
      {!collapsed && badge && <span className="s-badge">{badge}</span>}
      {active && <span className="s-active-bar" />}
    </button>
  );
}

/* ══════════════════════════════════════
   PANEL : DASHBOARD
══════════════════════════════════════ */
function DashboardPanel({ user, goTo }) {
  const STATS = [
    { icon:'🚀', val:'0',  lbl:'Scripts Generated', accent:'linear-gradient(90deg,#4f86e8,#6fa3ff)', trend:'+0%' },
    { icon:'🔬', val:'0',  lbl:'Apps Analyzed',      accent:'linear-gradient(90deg,#c9a227,#e8c84a)', trend:'+0%' },
    { icon:'🎯', val:'0%', lbl:'Avg. Coverage',      accent:'linear-gradient(90deg,#10b981,#34d399)', trend:'—'   },
    { icon:'⚡', val:'0s', lbl:'Avg. Gen. Time',     accent:'linear-gradient(90deg,#f97316,#fb923c)', trend:'—'   },
  ];
  return (
    <div className="panel">
      <div className="p-header">
        <div>
          <h1 className="p-title">Welcome back, <span className="g">{user?.name?.split(' ')[0] || 'User'}</span> 👋</h1>
          <p className="p-sub">Here's your AI test generation overview</p>
        </div>
        <button className="btn-primary" onClick={() => goTo('generate')}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          New Generation
        </button>
      </div>

      <div className="stats-grid">
        {STATS.map((s, i) => (
          <div className="stat-card" key={s.lbl} style={{'--i': i}}>
            <div className="stat-card-top">
              <div className="stat-icon-wrap">{s.icon}</div>
              <span className="stat-trend">{s.trend}</span>
            </div>
            <span className="stat-val">{s.val}</span>
            <span className="stat-lbl">{s.lbl}</span>
            <div className="stat-accent" style={{background: s.accent}} />
          </div>
        ))}
      </div>

      <div className="quick-start">
        <div className="qs-icon-wrap">
          <svg width="32" height="32" fill="none" stroke="rgba(201,162,39,.8)" strokeWidth="1.6" viewBox="0 0 24 24">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <h3>No generations yet</h3>
        <p>Provide a URL — the AI engine analyzes your interface and exports Selenium & Cypress scripts automatically.</p>
        <button className="btn-gold" onClick={() => goTo('generate')}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Generate your first tests
        </button>
      </div>

      <div className="section-box">
        <div className="sb-head">
          <span className="sb-title">Recent Activity</span>
          <span className="sb-action" onClick={() => goTo('history')}>View all →</span>
        </div>
        <div className="empty-row">No recent activity — your generations will appear here.</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   PANEL : GENERATE
══════════════════════════════════════ */
function GeneratePanel({ goTo }) {
  const [url,     setUrl]  = useState('');
  const [fw,      setFw]   = useState('Selenium');
  const [loading, setLoad] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!url) return;
    setLoad(true);
    setTimeout(() => { setLoad(false); goTo('execution'); }, 2800);
  };

  return (
    <div className="panel">
      <div className="p-header">
        <div>
          <h1 className="p-title">New <span className="g">Generation</span></h1>
          <p className="p-sub">Provide a URL — AI analyzes and generates test scripts</p>
        </div>
      </div>
      <div className="gen-layout">
        <div className="gen-card">
          <form className="gen-form" onSubmit={submit}>
            <div className="field">
              <label>Target URL</label>
              <div className="field-wrap">
                <span className="field-ico">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </span>
                <input type="url" placeholder="https://myapp.com" value={url} onChange={e => setUrl(e.target.value)} required />
              </div>
            </div>
            <div className="field">
              <label>Export Framework</label>
              <div className="fw-tabs">
                {['Selenium','Cypress','Both'].map(f => (
                  <button key={f} type="button" className={`fw-tab${fw===f?' on':''}`} onClick={() => setFw(f)}>{f}</button>
                ))}
              </div>
            </div>
            <button type="submit" className="btn-gen" disabled={loading || !url}>
              {loading
                ? <><span className="spinner"/>Analyzing…</>
                : <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>Generate Tests</>}
            </button>
          </form>
        </div>

        <div className="steps-card">
          <div className="steps-title">How it works</div>
          {[
            ['01','DOM Scanning',    'All elements and interactions detected'],
            ['02','AI Analysis',     'Maps flows and edge cases automatically'],
            ['03','Test Generation', 'Functional test cases in plain language'],
            ['04','Script Export',   'Ready-to-run Selenium & Cypress scripts'],
          ].map(([n,t,d], i, arr) => (
            <div className="i-step" key={n}>
              <div className="i-step-l">
                <div className="i-step-num">{n}</div>
                {i < arr.length - 1 && <div className="i-step-line"/>}
              </div>
              <div className="i-step-body">
                <div className="i-step-t">{t}</div>
                <div className="i-step-d">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   PANEL : TEST EXECUTION
══════════════════════════════════════ */
const TESTS = [
  { id:1, name:'Login — valid credentials',        status:'pass', duration:'0.8s', suite:'Authentication' },
  { id:2, name:'Login — invalid password',         status:'pass', duration:'0.5s', suite:'Authentication' },
  { id:3, name:'Login — empty fields validation',  status:'pass', duration:'0.4s', suite:'Authentication' },
  { id:4, name:'Register — new user flow',         status:'fail', duration:'1.2s', suite:'Registration'   },
  { id:5, name:'Register — duplicate email',       status:'pass', duration:'0.6s', suite:'Registration'   },
  { id:6, name:'Dashboard — stats load',           status:'pass', duration:'0.9s', suite:'Dashboard'      },
  { id:7, name:'Navigation — sidebar links',       status:'skip', duration:'—',    suite:'Navigation'     },
  { id:8, name:'Generate — URL submission',        status:'fail', duration:'2.1s', suite:'Generation'     },
];

function StatusIcon({ s }) {
  if (s==='pass') return <svg width="15" height="15" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>;
  if (s==='fail') return <svg width="15" height="15" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>;
  return          <svg width="15" height="15" fill="none" stroke="#f59e0b" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>;
}

function ExecutionPanel() {
  const [running,  setRunning]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [done,     setDone]     = useState(false);
  const [fw,       setFw]       = useState('Selenium');
  const [filter,   setFilter]   = useState('all');

  const runAll = () => {
    setRunning(true); setDone(false); setProgress(0); setFilter('all');
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 11 + 4;
      if (p >= 100) { p = 100; clearInterval(iv); setRunning(false); setDone(true); }
      setProgress(Math.min(p, 100));
    }, 180);
  };

  const pass = TESTS.filter(t => t.status==='pass').length;
  const fail = TESTS.filter(t => t.status==='fail').length;
  const skip = TESTS.filter(t => t.status==='skip').length;
  const rate = Math.round((pass / TESTS.length) * 100);

  const shown = filter==='all' ? TESTS : TESTS.filter(t => t.status===filter);

  return (
    <div className="panel">
      {/* Header */}
      <div className="p-header">
        <div>
          <h1 className="p-title">Test <span className="g">Execution</span></h1>
          <p className="p-sub">Run and monitor your generated test suites in real time</p>
        </div>
        <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap'}}>
          <div className="fw-tabs">
            {['Selenium','Cypress'].map(f => (
              <button key={f} type="button"
                className={`fw-tab${fw===f?' on':''}`}
                onClick={() => setFw(f)}
                style={{minWidth:90}}
              >{f}</button>
            ))}
          </div>
          <button className="btn-primary" onClick={runAll} disabled={running}>
            {running
              ? <><span className="spinner"/>Running…</>
              : done
                ? <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.71"/></svg>Re-run All</>
                : <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>Run All Tests</>}
          </button>
        </div>
      </div>

      {/* Progress */}
      {(running || done) && (
        <div className="exec-progress-wrap">
          <div className="exec-progress-header">
            <span className="exec-progress-label">
              {done ? '✓ Execution complete' : `Running tests… ${Math.round(progress)}%`}
            </span>
            {done && <span className="exec-progress-done">{TESTS.length} tests · 6.5s total</span>}
          </div>
          <div className="exec-progress-bar">
            <div className="exec-progress-fill" style={{width:`${progress}%`}}/>
          </div>
        </div>
      )}

      {/* Summary cards */}
      {done && (
        <div className="exec-summary">
          <div className="exec-sum-card exec-sum-pass"><div className="exec-sum-val">{pass}</div><div className="exec-sum-lbl">Passed</div></div>
          <div className="exec-sum-card exec-sum-fail"><div className="exec-sum-val">{fail}</div><div className="exec-sum-lbl">Failed</div></div>
          <div className="exec-sum-card exec-sum-skip"><div className="exec-sum-val">{skip}</div><div className="exec-sum-lbl">Skipped</div></div>
          <div className="exec-sum-card exec-sum-rate"><div className="exec-sum-val">{rate}%</div><div className="exec-sum-lbl">Pass Rate</div></div>
        </div>
      )}

      {/* Filters */}
      {(done || running) && (
        <div className="exec-filters">
          <button className={`exec-filter${filter==='all' ?' on':''}`} onClick={() => setFilter('all')}>All ({TESTS.length})</button>
          <button className={`exec-filter${filter==='pass'?' on':''}`} onClick={() => setFilter('pass')}>✓ Passed ({pass})</button>
          <button className={`exec-filter${filter==='fail'?' on':''}`} onClick={() => setFilter('fail')}>✗ Failed ({fail})</button>
          <button className={`exec-filter${filter==='skip'?' on':''}`} onClick={() => setFilter('skip')}>⚠ Skipped ({skip})</button>
        </div>
      )}

      {/* Test rows */}
      <div className="exec-list">
        {!done && !running && (
          <div className="exec-empty">
            <div className="exec-empty-icon">
              <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <p>Click <strong>Run All Tests</strong> to execute your {fw} suite</p>
          </div>
        )}

        {(done || running) && shown.map((t, i) => (
          <div
            key={t.id}
            className={`exec-row exec-row--${done ? t.status : 'pending'}`}
            style={{animationDelay:`${i * 0.045}s`}}
          >
            <div className="exec-row-status">
              {done ? <StatusIcon s={t.status}/> : <span className="exec-spinner-sm"/>}
            </div>
            <div className="exec-row-info">
              <div className="exec-row-name">{t.name}</div>
              <div className="exec-row-suite">{t.suite}</div>
            </div>
            <div className="exec-row-meta">
              <span className={`exec-badge exec-badge--${done ? t.status : 'pending'}`}>
                {done ? t.status : 'running'}
              </span>
              <span className="exec-duration">{done ? t.duration : '…'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Export actions */}
      {done && (
        <div style={{marginTop:18, display:'flex', gap:10}}>
          <button className="btn-primary" style={{fontSize:11, padding:'9px 18px'}}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Report
          </button>
          <button className="btn-outline" style={{fontSize:11, padding:'9px 18px'}}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            Share Results
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   PANEL : HISTORY
══════════════════════════════════════ */
function HistoryPanel() {
  return (
    <div className="panel">
      <div className="p-header">
        <div>
          <h1 className="p-title">Generation <span className="g">History</span></h1>
          <p className="p-sub">All your past test generations</p>
        </div>
      </div>
      <div className="hist-empty">
        <div className="he-ring">
          <svg width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h3>No history yet</h3>
        <p>Your past generations will appear here once you start analyzing your first web app.</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   PANEL : ACCOUNT
══════════════════════════════════════ */
function AccountPanel({ user }) {
  return (
    <div className="panel">
      <div className="p-header">
        <div>
          <h1 className="p-title">My <span className="g">Account</span></h1>
          <p className="p-sub">Manage your profile and access</p>
        </div>
      </div>
      <div className="acc-hero">
        <div className="acc-avatar">
          {user?.avatar
            ? <img src={user.avatar} alt="av" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/>
            : <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>}
        </div>
        <div>
          <div className="acc-name">{user?.name || 'User'}</div>
          <div className="acc-email">{user?.email || '—'}</div>
          {user?.google_id && <div className="acc-pill">✓ Connected with Google</div>}
        </div>
      </div>
      <div className="acc-fields">
        <div className="acc-fields-title">Profile Information</div>
        <div className="field"><label>Full Name</label><div className="field-wrap"><input type="text" defaultValue={user?.name || ''}/></div></div>
        <div className="field"><label>Email</label><div className="field-wrap"><input type="email" defaultValue={user?.email || ''}/></div></div>
        <div className="field"><label>New Password</label><div className="field-wrap"><input type="password" placeholder="Leave blank to keep current"/></div></div>
        <button className="btn-primary" style={{width:'fit-content'}}>Save Changes</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   PANEL : SETTINGS
══════════════════════════════════════ */
function SettingsPanel() {
  const [notifs, setNotifs] = useState(true);
  const [weekly, setWeekly] = useState(false);
  return (
    <div className="panel">
      <div className="p-header">
        <div>
          <h1 className="p-title">App <span className="g">Settings</span></h1>
          <p className="p-sub">Customize your NexTest experience</p>
        </div>
      </div>
      <div className="set-group">
        <div className="set-group-title">Notifications</div>
        <div className="set-row">
          <div><div className="set-name">Email Notifications</div><div className="set-desc">Get notified when a generation is complete</div></div>
          <div className={`toggle${notifs?' on':''}`} onClick={() => setNotifs(p => !p)}><span className="toggle-knob"/></div>
        </div>
        <div className="set-row">
          <div><div className="set-name">Weekly Report</div><div className="set-desc">Summary of your weekly test activity</div></div>
          <div className={`toggle${weekly?' on':''}`} onClick={() => setWeekly(p => !p)}><span className="toggle-knob"/></div>
        </div>
      </div>
      <div className="set-group">
        <div className="set-group-title">Export Defaults</div>
        <div className="set-row">
          <div><div className="set-name">Default Framework</div><div className="set-desc">Pre-selected for new generations</div></div>
          <select className="set-select"><option>Selenium</option><option>Cypress</option><option>Both</option></select>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════ */
export default function Dashboard() {
  const [page,      setPage]     = useState('dashboard');
  const [collapsed, setCollapse] = useState(false);
  const { user, logout }         = useAuth();

  const LABELS = {
    dashboard:'Dashboard', generate:'New Generation',
    execution:'Test Execution', history:'History',
    account:'Account', settings:'Settings',
  };

  return (
    <div className="dash-root" style={{position:"fixed",top:0,left:0,right:0,bottom:0,width:"100vw",height:"100vh",display:"flex",flexDirection:"row",overflow:"hidden"}}>

      {/* ════ SIDEBAR ════ */}
      <aside className={`sidebar${collapsed?' collapsed':''}`}>

        {/* Logo identique à HomePage nav */}
        <NexLogo collapsed={collapsed}/>

        {/* Bouton collapse */}
        <button className="s-toggle" onClick={() => setCollapse(p => !p)}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            {collapsed
              ? <path d="M9 18l6-6-6-6"/>
              : <path d="M15 18l-6-6 6-6"/>}
          </svg>
        </button>

        {/* Navigation */}
        <nav className="s-nav">
          <div className="s-group">
            {!collapsed && <div className="s-label">Main</div>}
            {NAV_MAIN.map(it => (
              <SItem key={it.id} {...it} active={page===it.id} collapsed={collapsed} onClick={setPage}/>
            ))}
          </div>
          <div className="s-divider"/>
          <div className="s-group">
            {!collapsed && <div className="s-label">User</div>}
            {NAV_USER.map(it => (
              <SItem key={it.id} {...it} active={page===it.id} collapsed={collapsed} onClick={setPage}/>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="s-footer">
          <button className="s-item s-logout" onClick={logout} title="Logout">
            <span className="s-icon">{IC.logout}</span>
            {!collapsed && <span className="s-label-txt">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <div className="main">

        {/* Header */}
        <header className="header">
          <div className="h-left">
            <div className="h-breadcrumb">
              <span className="h-bc-root">NexTest</span>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{color:'#e5e7f0'}}>
                <path d="M9 18l6-6-6-6"/>
              </svg>
              <span className="h-bc-page">{LABELS[page]}</span>
            </div>
          </div>

          <div className="h-search">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{color:'#9ca3af',flexShrink:0}}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search generations, history…"/>
          </div>

          <div className="h-right">
            <button className="h-icon-btn">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="notif-dot"/>
            </button>
            <div className="h-sep"/>
            <div className="h-avatar">
              {user?.avatar
                ? <img src={user.avatar} alt="av" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/>
                : <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>}
            </div>
            <div>
              <div className="h-user-name">{user?.name?.split(' ')[0] || 'User'}</div>
              <div className="h-user-role">QA Engineer</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="content">
          {page==='dashboard' && <DashboardPanel user={user} goTo={setPage}/>}
          {page==='generate'  && <GeneratePanel  goTo={setPage}/>}
          {page==='execution' && <ExecutionPanel/>}
          {page==='history'   && <HistoryPanel/>}
          {page==='account'   && <AccountPanel   user={user}/>}
          {page==='settings'  && <SettingsPanel/>}
        </div>
      </div>
    </div>
  );
}
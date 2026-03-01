import { useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import './Dashboard.css';

/* ══ NAV ITEMS ══ */
const NAV = [
  { id:'dashboard', label:'Dashboard',      badge:null,  icon:<svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
  { id:'generate',  label:'New Generation', badge:'New', icon:<svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
  { id:'history',   label:'History',        badge:null,  icon:<svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
];
const NAV2 = [
  { id:'account',  label:'Account',  icon:<svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
  { id:'settings', label:'Settings', icon:<svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

/* ══ SIDEBAR ITEM ══ */
function SItem({ item, active, collapsed, onClick }) {
  return (
    <button
      className={`s-item ${active ? 'active' : ''}`}
      onClick={() => onClick(item.id)}
      title={collapsed ? item.label : ''}
    >
      <span className="s-item-icon">{item.icon}</span>
      {!collapsed && <span className="s-item-label">{item.label}</span>}
      {!collapsed && item.badge && <span className="s-badge">{item.badge}</span>}
      {active && !collapsed && <span className="s-dot"/>}
    </button>
  );
}

/* ══ PANELS ══ */
function DashboardPanel({ user, goTo }) {
  const stats = [
    { icon:'🚀', val:'0',   label:'Scripts Generated', color:'#4f86e8' },
    { icon:'🔬', val:'0',   label:'Apps Analyzed',     color:'#c9a227' },
    { icon:'🎯', val:'0%',  label:'Avg. Coverage',     color:'#4ade80' },
    { icon:'⚡', val:'0s',  label:'Avg. Gen. Time',    color:'#fb923c' },
  ];
  return (
    <div className="panel">
      <div className="p-header">
        <div>
          <h1 className="p-title">Welcome back, <span className="g">{user?.name?.split(' ')[0] || 'User'}</span> 👋</h1>
          <p className="p-sub">Here's your AI test generation overview</p>
        </div>
        <button className="btn-gold" onClick={() => goTo('generate')}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          New Generation
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((s,i) => (
          <div className="stat-card" key={s.label} style={{'--i':i,'--sc':s.color}}>
            <span className="stat-icon">{s.icon}</span>
            <span className="stat-val" style={{color:s.color}}>{s.val}</span>
            <span className="stat-lbl">{s.label}</span>
            <div className="stat-bar"><div className="stat-fill" style={{background:s.color,width:'0%'}}/></div>
          </div>
        ))}
      </div>

      <div className="quick-start">
        <div className="qs-orbit">
          <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24" style={{color:'var(--gold)'}}>
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

function GeneratePanel() {
  const [url, setUrl] = useState('');
  const [fw, setFw]   = useState('Selenium');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setTimeout(() => setLoading(false), 2800);
  };

  return (
    <div className="panel">
      <div className="p-header">
        <div>
          <h1 className="p-title">New <span className="g">Generation</span></h1>
          <p className="p-sub">Provide a URL — AI does the rest</p>
        </div>
      </div>
      <div className="gen-layout">
        <div className="gen-card">
          <form className="gen-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Target URL</label>
              <div className="field-wrap">
                <span className="field-ico"><svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>
                <input type="url" placeholder="https://myapp.com" value={url} onChange={e => setUrl(e.target.value)} required/>
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
                : <><svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>Generate Tests</>
              }
            </button>
          </form>
        </div>
        <div className="gen-card" style={{padding:'28px 24px'}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'var(--gold)',marginBottom:20,opacity:.8}}>How it works</div>
          {[['01','DOM Scanning','All elements, forms & interactions detected'],['02','AI Analysis','Generative AI maps flows and edge cases'],['03','Test Generation','Functional test cases in plain language'],['04','Script Export','Selenium & Cypress scripts for CI/CD']].map(([n,t,d],i,a)=>(
            <div className="i-step" key={n}>
              <div className="i-step-l"><div className="i-step-num">{n}</div>{i<a.length-1&&<div className="i-step-line"/>}</div>
              <div className="i-step-body"><div className="i-step-t">{t}</div><div className="i-step-d">{d}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryPanel() {
  return (
    <div className="panel">
      <div className="p-header"><div><h1 className="p-title">Generation <span className="g">History</span></h1><p className="p-sub">All your past test generations</p></div></div>
      <div className="hist-empty">
        <div className="he-ring"><svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
        <h3>No history yet</h3>
        <p>Your past generations will appear here. Start by analyzing your first web app.</p>
      </div>
    </div>
  );
}

function AccountPanel({ user }) {
  return (
    <div className="panel">
      <div className="p-header"><div><h1 className="p-title">My <span className="g">Account</span></h1><p className="p-sub">Manage your profile and access</p></div></div>
      <div className="acc-card">
        <div className="acc-avatar">{user?.avatar ? <img src={user.avatar} alt="av" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/> : <span>{user?.name?.[0]?.toUpperCase()||'U'}</span>}</div>
        <div>
          <div className="acc-name">{user?.name||'User'}</div>
          <div className="acc-email">{user?.email||'—'}</div>
          {user?.google_id && <div className="acc-pill">✓ Connected with Google</div>}
        </div>
      </div>
      <div className="acc-fields">
        <div className="field"><label>Full Name</label><div className="field-wrap"><input type="text" defaultValue={user?.name||''}/></div></div>
        <div className="field"><label>Email</label><div className="field-wrap"><input type="email" defaultValue={user?.email||''}/></div></div>
        <div className="field"><label>New Password</label><div className="field-wrap"><input type="password" placeholder="Leave blank to keep current"/></div></div>
        <button className="btn-gold" style={{width:'fit-content'}}>Save Changes</button>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [notifs, setNotifs] = useState(true);
  const [weekly, setWeekly] = useState(false);
  return (
    <div className="panel">
      <div className="p-header"><div><h1 className="p-title">App <span className="g">Settings</span></h1><p className="p-sub">Customize your NexTest experience</p></div></div>
      <div className="set-group">
        <div className="set-group-title">Notifications</div>
        <div className="set-row"><div><div className="set-name">Email Notifications</div><div className="set-desc">Get notified when a generation is complete</div></div><div className={`toggle${notifs?' on':''}`} onClick={()=>setNotifs(p=>!p)}><span className="toggle-knob"/></div></div>
        <div className="set-row"><div><div className="set-name">Weekly Report</div><div className="set-desc">Summary of your weekly test activity</div></div><div className={`toggle${weekly?' on':''}`} onClick={()=>setWeekly(p=>!p)}><span className="toggle-knob"/></div></div>
      </div>
      <div className="set-group">
        <div className="set-group-title">Export Defaults</div>
        <div className="set-row"><div><div className="set-name">Default Framework</div><div className="set-desc">Pre-selected for new generations</div></div><select className="set-select"><option>Selenium</option><option>Cypress</option><option>Both</option></select></div>
      </div>
    </div>
  );
}

/* ══ MAIN DASHBOARD ══ */
export default function Dashboard() {
  const [page, setPage]         = useState('dashboard');
  const [collapsed, setCollapse] = useState(false);
  const { user, logout }         = useAuth();

  const pages = { dashboard:'Dashboard', generate:'New Generation', history:'History', account:'Account', settings:'Settings' };

  return (
    <div className="dash-root">

      {/* SIDEBAR */}
      <aside className={`sidebar${collapsed?' collapsed':''}`}>
        <div className="s-logo">
          <div className="s-logo-icon">
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <polyline points="7,12 20,28 33,12" stroke="#060e1e" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {!collapsed && <div className="s-logo-text"><span className="s-logo-name">NexTest</span><span className="s-logo-sub">AI Platform</span></div>}
        </div>

        <button className="s-toggle" onClick={() => setCollapse(p => !p)}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            {collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}
          </svg>
        </button>

        <nav className="s-nav">
          <div className="s-group">
            {!collapsed && <div className="s-label">Main</div>}
            {NAV.map(item => <SItem key={item.id} item={item} active={page===item.id} collapsed={collapsed} onClick={setPage}/>)}
          </div>
          <div className="s-divider"/>
          <div className="s-group">
            {!collapsed && <div className="s-label">User</div>}
            {NAV2.map(item => <SItem key={item.id} item={item} active={page===item.id} collapsed={collapsed} onClick={setPage}/>)}
          </div>
        </nav>

        <div className="s-footer">
          <button className={`s-item s-logout${collapsed?' collapsed':''}`} onClick={logout} title="Logout">
            <span className="s-item-icon"><svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg></span>
            {!collapsed && <span className="s-item-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main">

        {/* HEADER */}
        <header className="header">
          <div className="h-left">
            <div className="h-breadcrumb">
              <span className="h-bc-root">NexTest</span>
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{color:'var(--dim)'}}><path d="M9 18l6-6-6-6"/></svg>
              <span className="h-bc-page">{pages[page]}</span>
            </div>
          </div>

          <div className="h-search">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{color:'var(--muted)',flexShrink:0}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Search generations, history…"/>
          </div>

          <div className="h-right">
            <button className="h-icon-btn">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className="notif-dot"/>
            </button>
            <div className="h-sep"/>
            <div className="h-avatar">
              {user?.avatar ? <img src={user.avatar} alt="av" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/> : <span>{user?.name?.[0]?.toUpperCase()||'U'}</span>}
            </div>
            <div className="h-user-info">
              <div className="h-user-name">{user?.name?.split(' ')[0]||'User'}</div>
              <div className="h-user-role">QA Engineer</div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="content">
          {page==='dashboard' && <DashboardPanel user={user} goTo={setPage}/>}
          {page==='generate'  && <GeneratePanel/>}
          {page==='history'   && <HistoryPanel/>}
          {page==='account'   && <AccountPanel user={user}/>}
          {page==='settings'  && <SettingsPanel/>}
        </div>

      </div>
    </div>
  );
}
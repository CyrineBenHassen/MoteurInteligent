import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import api from '../../api/axios';
import './Dashboard.css';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';

function useCountUp(target, duration = 1200) {
  const ref = useRef(null);
  useEffect(() => {
    const numeric = parseFloat(target);
    const suffix = String(target).replace(/[\d.]/g, '');
    if (!ref.current || isNaN(numeric)) return;
    let start = null;
    let raf;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * numeric);
      if (ref.current) ref.current.textContent = current + suffix;
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

function NexLogo() {
  return (
    <div className="s-logo">
      <div className="nav__gem">
        <svg width="22" height="22" viewBox="0 0 44 44" fill="none">
          <rect width="44" height="44" rx="11" fill="none"/>
          <polyline points="8,14 22,30 36,14" stroke="#060e1e" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="8" y1="30" x2="36" y2="30" stroke="rgba(6,14,30,0.5)" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="logo-words">
        <div className="nav__name">NexTest</div>
        <div className="nav__sub">Test Automation</div>
      </div>
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

const TOP_URLS = [
  { url: 'https://github.com/login',       framework: 'Selenium', tests: 12, pass: 10, date: '2h ago' },
  { url: 'https://trello.com/login',       framework: 'Cypress',  tests: 8,  pass: 8,  date: '1d ago' },
  { url: 'https://app.slack.com/sign-in',  framework: 'Both',     tests: 15, pass: 12, date: '3d ago' },
];

function TopURLsSection({ goTo }) {
  const { t } = useLang();
  return (
    <div className="section-box" style={{ marginBottom: 24 }}>
      <div className="sb-head">
        <span className="sb-title">🔗 {t('topUrls') || 'Top Tested URLs'}</span>
        <span className="sb-action" onClick={() => goTo('history')}>{t('viewAll') || 'View all'} </span>
      </div>
      <div style={{ padding: '8px 0' }}>
        {TOP_URLS.map((item, i) => {
          const rate = Math.round((item.pass / item.tests) * 100);
          const statusColor = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
          return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:'12px 20px', borderBottom: i < TOP_URLS.length-1 ? '1px solid var(--border)' : 'none', transition:'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width:26, height:26, borderRadius:'50%', flexShrink:0, background:'var(--goldbg)', border:'1px solid rgba(201,162,39,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--gold)' }}>{i + 1}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--navy)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.url}</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{item.tests} tests · {item.date}</div>
              </div>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'1px', padding:'3px 10px', borderRadius:20, background:'rgba(79,134,232,.1)', color:'#4f86e8', border:'1px solid rgba(79,134,232,.2)', flexShrink:0 }}>{item.framework}</span>
              <div style={{ width:80, flexShrink:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:10, color:'var(--muted)' }}>pass rate</span>
                  <span style={{ fontSize:11, fontWeight:700, color:statusColor }}>{rate}%</span>
                </div>
                <div style={{ height:4, borderRadius:4, background:'var(--border)', overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:4, width:`${rate}%`, background:statusColor, transition:'width 1s ease' }}/>
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
    { icon:'🚀', val:'12',  lbl:t('scriptsGenerated'), accent:'linear-gradient(90deg,#4f86e8,#6fa3ff)', trend:'+12%' },
    { icon:'🔬', val:'3',   lbl:t('appsAnalyzed'),     accent:'linear-gradient(90deg,#c9a227,#e8c84a)', trend:'+3%'  },
    { icon:'🎯', val:'82%', lbl:t('avgCoverage'),      accent:'linear-gradient(90deg,#10b981,#34d399)', trend:'—'    },
    { icon:'⚡', val:'2s',  lbl:t('avgGenTime'),       accent:'linear-gradient(90deg,#f97316,#fb923c)', trend:'—'    },
  ];
  const barData = [
    { day:'Mon', count:3 }, { day:'Tue', count:7 }, { day:'Wed', count:2 },
    { day:'Thu', count:9 }, { day:'Fri', count:5 }, { day:'Sat', count:1 }, { day:'Sun', count:4 },
  ];
  const donutData = [
    { name:'Passed',  value:62, color:'#10b981' },
    { name:'Failed',  value:23, color:'#ef4444' },
    { name:'Skipped', value:15, color:'#f59e0b' },
  ];
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="panel">
      <div className="p-header">
        <div>
          <h1 className="p-title">{t('welcome')}, <span className="g">{user?.name?.split(' ')[0] || 'User'}</span> </h1>
          <p className="p-sub">{t('overview')}</p>
        </div>
        <button className="btn-primary" onClick={() => goTo('generate')}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          {t('newGeneration')}
        </button>
      </div>
      <div className="stats-grid">
        {STATS.map((s, i) => (
          <div className="stat-card" key={s.lbl} style={{'--i': i}}>
            <div className="stat-card-top">
              <div className="stat-icon-wrap">{s.icon}</div>
              <span className="stat-trend">{s.trend}</span>
            </div>
            <span className="stat-val"><AnimatedStat val={s.val} /></span>
            <span className="stat-lbl">{s.lbl}</span>
            <div className="stat-accent" style={{background: s.accent}} />
          </div>
        ))}
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24}}>
        <div className="section-box">
          <div className="sb-head"><span className="sb-title">{t('generationsPerWeek') || 'Generations this week'}</span></div>
          <div style={{padding:'12px 8px 8px'}}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={26}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="day" tick={{fill:'var(--muted)', fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'var(--muted)', fontSize:11}} axisLine={false} tickLine={false} width={24}/>
                <Tooltip contentStyle={{background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, color:'var(--navy)', fontSize:12}} cursor={{fill:'rgba(201,162,39,0.07)'}} formatter={(val) => [val, 'Generations']}/>
                <Bar dataKey="count" fill="#c9a227" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="section-box">
          <div className="sb-head"><span className="sb-title">{t('testResults') || 'Test Results'}</span></div>
          <div style={{padding:'12px 8px 8px', display:'flex', flexDirection:'column', alignItems:'center'}}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" labelLine={false}>
                  {donutData.map((entry, index) => (<Cell key={index} fill={entry.color} stroke="none"/>))}
                </Pie>
                <Tooltip contentStyle={{background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, color:'var(--navy)', fontSize:12}} formatter={(val, name) => [`${val}%`, name]}/>
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                  <tspan x="50%" dy="-8" fontSize="20" fontWeight="700" fill="#10b981">{Math.round((donutData[0].value / donutTotal) * 100)}%</tspan>
                  <tspan x="50%" dy="18" fontSize="10" fill="var(--muted)">pass rate</tspan>
                </text>
              </PieChart>
            </ResponsiveContainer>
            <div style={{display:'flex', gap:20, justifyContent:'center', marginTop:4}}>
              {donutData.map(d => (
                <div key={d.name} style={{display:'flex', alignItems:'center', gap:6}}>
                  <div style={{width:10, height:10, borderRadius:'50%', background:d.color, flexShrink:0}}/>
                  <span style={{fontSize:11, color:'var(--muted)', fontWeight:600}}>{d.name} <span style={{color:'var(--navy)'}}>{d.value}%</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <TopURLsSection goTo={goTo} />
      <div className="section-box" style={{marginBottom:24}}>
        <div className="sb-head">
          <span className="sb-title">{t('recentActivity')}</span>
          <span className="sb-action" onClick={() => goTo('history')}>{t('viewAll')} </span>
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

function GeneratePanel({ goTo, setGeneration }) {
  const { t } = useLang();
  const [url,     setUrl]   = useState('');
  const [fw,      setFw]    = useState('Selenium');
  const [loading, setLoad]  = useState(false);
  const [error,   setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoad(true);
    setError('');
    try {
      const res = await api.post('/generate', { url, framework: fw });
      setGeneration(res.data);
      goTo('execution');
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    }
    setLoad(false);
  };

  return (
    <div className="panel">
      <div className="p-header">
        {error && <div className="error-msg">✗ {error}</div>}
        <div>
          <h1 className="p-title">{t('new')} <span className="g">{t('generation')}</span></h1>
          <p className="p-sub">{t('generateDesc')}</p>
        </div>
      </div>
      <div className="gen-layout">
        <div className="gen-card">
          <form className="gen-form" onSubmit={submit}>
            <div className="field">
              <label>{t('targetUrl')}</label>
              <div className="field-wrap">
                <span className="field-ico">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </span>
                <input type="url" placeholder="https://myapp.com" value={url} onChange={e => setUrl(e.target.value)} required />
              </div>
            </div>
            <div className="field">
              <label>{t('exportFramework')}</label>
              <div className="fw-tabs">
                {['Selenium','Cypress','Both'].map(f => (
                  <button key={f} type="button" className={`fw-tab${fw===f?' on':''}`} onClick={() => setFw(f)}>{f}</button>
                ))}
              </div>
            </div>
            <button type="submit" className="btn-gen" disabled={loading || !url}>
              {loading
                ? <><span className="spinner"/>{t('analyzing')}</>
                : <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>{t('generateTests')}</>}
            </button>
          </form>
        </div>
        <div className="steps-card">
          <div className="steps-title">{t('howItWorks')}</div>
          {[
            ['01', t('domScanning'),    t('domScanningDesc')],
            ['02', t('aiAnalysis'),     t('aiAnalysisDesc')],
            ['03', t('testGeneration'), t('testGenerationDesc')],
            ['04', t('scriptExport'),   t('scriptExportDesc')],
          ].map(([n,title,desc], i, arr) => (
            <div className="i-step" key={n}>
              <div className="i-step-l">
                <div className="i-step-num">{n}</div>
                {i < arr.length - 1 && <div className="i-step-line"/>}
              </div>
              <div className="i-step-body">
                <div className="i-step-t">{title}</div>
                <div className="i-step-d">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ s }) {
  if (s==='pass') return <svg width="15" height="15" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>;
  if (s==='fail') return <svg width="15" height="15" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>;
  return <svg width="15" height="15" fill="none" stroke="#f59e0b" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>;
}

function ExecutionPanel({ generation }) {
  const { t } = useLang();
  const [filter,    setFilter]    = useState('all');
  const [activeTab, setActiveTab] = useState('selenium');
  const [pdfLoading, setPdfLoading] = useState(false);

  const framework = generation?.framework || generation?.generation?.framework || 'Selenium';

  const mapStatus = (type) =>
    type === 'positive'   ? 'pass'
    : type === 'negative' ? 'fail'
    : type === 'boundary' ? 'skip'
    : ['navigation','add_to_cart','pagination','modal','image','performance'].includes(type) ? 'pass'
    : 'skip';

  const buildTests = (test_cases) =>
    (test_cases || []).map((tc, i) => ({
      id:       tc.id || i + 1,
      name:     tc.name,
      status:   mapStatus(tc.type),
      duration: '—',
      suite:    tc.description?.slice(0, 40) || 'Test',
    }));

  const testsSelenium = buildTests(generation?.result?.test_cases_selenium);
  const testsCypress  = buildTests(generation?.result?.test_cases_cypress);
  const testsSingle   = buildTests(generation?.result?.test_cases);

  const isBoth = framework === 'Both';
  const tests  = isBoth
    ? (activeTab === 'selenium' ? testsSelenium : testsCypress)
    : testsSingle;

  const pass = tests.filter(t => t.status === 'pass').length;
  const fail = tests.filter(t => t.status === 'fail').length;
  const skip = tests.filter(t => t.status === 'skip').length;
  const rate = tests.length > 0 ? Math.round((pass / tests.length) * 100) : 0;
  const shown = filter === 'all' ? tests : tests.filter(t => t.status === filter);

  const url = generation?.url || generation?.generation?.url || '';

  const progressColor = rate >= 80
    ? 'linear-gradient(90deg, #10b981, #34d399)'
    : rate >= 50
      ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
      : 'linear-gradient(90deg, #ef4444, #f87171)';

  const progressTextColor = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';

  const downloadScript = (type = 'selenium') => {
    let content, filename;
    if (isBoth) {
      content  = type === 'selenium' ? generation?.result?.script_selenium : generation?.result?.script_cypress;
      filename = type === 'selenium' ? 'test_selenium.py' : 'test_cypress.js';
    } else {
      content  = generation?.result?.script || '';
      filename = framework === 'Cypress' ? 'test_cypress.js' : 'test_selenium.py';
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href  = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const downloadPdf = async () => {
    try {
      setPdfLoading(true);
      const id = generation?.generation?.id;
      if (!id) return;
      const res = await api.get(`/generations/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href  = URL.createObjectURL(blob);
      link.download = `nextest_report_${id}.pdf`;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setPdfLoading(false);
    }
  };

  if (!generation) {
    return (
      <div className="panel">
        <div className="p-header">
          <div>
            <h1 className="p-title">{t('test')} <span className="g">{t('execution')}</span></h1>
            <p className="p-sub">{t('executionDesc')}</p>
          </div>
        </div>
        <div className="exec-empty">
          <div className="exec-empty-icon">
            <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <p>Génère d'abord des tests depuis <strong>New Generation</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      {/* Header */}
      <div className="p-header">
        <div>
          <h1 className="p-title">{t('test')} <span className="g">{t('execution')}</span></h1>
          <p className="p-sub" style={{wordBreak:'break-all'}}>{url} · {framework}</p>
        </div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          {isBoth ? (
            <>
              <button className="btn-outline" style={{fontSize:11, padding:'9px 18px'}} onClick={() => downloadScript('selenium')}>
                🐍 Selenium .py
              </button>
              <button className="btn-outline" style={{fontSize:11, padding:'9px 18px'}} onClick={() => downloadScript('cypress')}>
                🌲 Cypress .js
              </button>
            </>
          ) : (
            <button className="btn-outline" style={{fontSize:11, padding:'9px 18px'}} onClick={() => downloadScript()}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Script
            </button>
          )}
          {/* ✅ Bouton PDF */}
          <button className="btn-primary" style={{fontSize:11, padding:'9px 18px'}} onClick={downloadPdf} disabled={pdfLoading}>
            {pdfLoading
              ? <><span className="spinner"/>Generating...</>
              : <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>📄 Download PDF</>}
          </button>
        </div>
      </div>

      {/* Tabs pour Both */}
      {isBoth && (
        <div style={{display:'flex', gap:'8px', marginBottom:'20px'}}>
          <button onClick={() => { setActiveTab('selenium'); setFilter('all'); }} style={{ padding:'8px 20px', borderRadius:'20px', fontWeight:700, fontSize:13, cursor:'pointer', border:'2px solid', borderColor: activeTab==='selenium' ? 'var(--gold)' : 'var(--border)', background: activeTab==='selenium' ? 'var(--goldbg)' : 'transparent', color: activeTab==='selenium' ? 'var(--gold)' : 'var(--muted)', transition:'all .2s' }}>
            🐍 Selenium ({testsSelenium.length})
          </button>
          <button onClick={() => { setActiveTab('cypress'); setFilter('all'); }} style={{ padding:'8px 20px', borderRadius:'20px', fontWeight:700, fontSize:13, cursor:'pointer', border:'2px solid', borderColor: activeTab==='cypress' ? 'var(--gold)' : 'var(--border)', background: activeTab==='cypress' ? 'var(--goldbg)' : 'transparent', color: activeTab==='cypress' ? 'var(--gold)' : 'var(--muted)', transition:'all .2s' }}>
            🌲 Cypress ({testsCypress.length})
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="exec-summary">
        <div className="exec-sum-card exec-sum-pass"><div className="exec-sum-val">{pass}</div><div className="exec-sum-lbl">{t('passed')}</div></div>
        <div className="exec-sum-card exec-sum-fail"><div className="exec-sum-val">{fail}</div><div className="exec-sum-lbl">{t('failed')}</div></div>
        <div className="exec-sum-card exec-sum-skip"><div className="exec-sum-val">{skip}</div><div className="exec-sum-lbl">{t('skipped')}</div></div>
        <div className="exec-sum-card exec-sum-rate"><div className="exec-sum-val">{rate}%</div><div className="exec-sum-lbl">{t('passRate')}</div></div>
      </div>

      {/* ✅ Progress Bar colorée */}
      <div className="exec-progress-wrap" style={{marginBottom:18}}>
        <div className="exec-progress-header">
          <span className="exec-progress-label">
            ✓ {tests.length} tests generated · {generation?.generation?.load_time_ms || 0}ms load time
          </span>
          <span className="exec-progress-done" style={{color: progressTextColor}}>
            {rate}% pass rate
          </span>
        </div>
        <div className="exec-progress-bar">
          <div className="exec-progress-fill" style={{ width:`${rate}%`, background: progressColor }}/>
        </div>
      </div>

      {/* Filtres */}
      <div className="exec-filters">
        <button className={`exec-filter${filter==='all' ?' on':''}`} onClick={() => setFilter('all')}>{t('all')} ({tests.length})</button>
        <button className={`exec-filter${filter==='pass'?' on':''}`} onClick={() => setFilter('pass')}>✓ {t('passed')} ({pass})</button>
        <button className={`exec-filter${filter==='fail'?' on':''}`} onClick={() => setFilter('fail')}>✗ {t('failed')} ({fail})</button>
        <button className={`exec-filter${filter==='skip'?' on':''}`} onClick={() => setFilter('skip')}>⚠ {t('skipped')} ({skip})</button>
      </div>

      {/* Liste des tests */}
      <div className="exec-list">
        {shown.map((test, i) => (
          <div key={test.id} className={`exec-row exec-row--${test.status}`} style={{animationDelay:`${i*0.045}s`}}>
            <div className="exec-row-status"><StatusIcon s={test.status}/></div>
            <div className="exec-row-info">
              <div className="exec-row-name">{test.name}</div>
              <div className="exec-row-suite">{test.suite}</div>
            </div>
            <div className="exec-row-meta">
              <span className={`exec-badge exec-badge--${test.status}`}>{test.status}</span>
              <span className="exec-duration">{test.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({ goTo, setGeneration }) {
  const { t } = useLang();
  const [histories, setHistories] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [deleting,  setDeleting]  = useState(null);
  const [search,    setSearch]    = useState('');
  const [filterFw,  setFilterFw]  = useState('all');

  useEffect(() => {
    api.get('/generations')
      .then(res => setHistories(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/generations/${id}`);
      setHistories(prev => prev.filter(h => h.id !== id));
    } catch (e) { console.error(e); }
    setDeleting(null);
  };

  const handleReview = (item) => {
    setGeneration({
      url: item.url, framework: item.framework,
      generation: { id: item.id, url: item.url, framework: item.framework, load_time_ms: item.load_time_ms },
      result: {
        test_cases:          item.test_cases          || [],
        test_cases_selenium: item.test_cases_selenium || [],
        test_cases_cypress:  item.test_cases_cypress  || [],
        script:              item.script              || '',
        script_selenium:     item.script_selenium     || '',
        script_cypress:      item.script_cypress      || '',
      }
    });
    goTo('execution');
  };

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60)    return `${Math.floor(diff)}s ago`;
    if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  const fwConfig = {
    Selenium: { color:'#4f86e8', bg:'rgba(79,134,232,.1)',  border:'rgba(79,134,232,.2)',  emoji:'🐍' },
    Cypress:  { color:'#10b981', bg:'rgba(16,185,129,.1)',  border:'rgba(16,185,129,.2)',  emoji:'🌲' },
    Both:     { color:'#c9a227', bg:'rgba(201,162,39,.1)',  border:'rgba(201,162,39,.2)',  emoji:'⚡' },
  };

  const filtered = histories.filter(h => {
    const matchSearch = h.url.toLowerCase().includes(search.toLowerCase());
    const matchFw     = filterFw === 'all' || h.framework === filterFw;
    return matchSearch && matchFw;
  });

  const totalTests = histories.reduce((s, h) => s + (h.pass_count||0) + (h.fail_count||0) + (h.skip_count||0), 0);
  const totalPass  = histories.reduce((s, h) => s + (h.pass_count||0), 0);
  const avgRate    = histories.length > 0 ? Math.round(histories.reduce((s,h) => s + (h.pass_rate||0), 0) / histories.length) : 0;

  return (
    <div className="panel">
      <div className="p-header">
        <div>
          <h1 className="p-title">{t('generation')} <span className="g">{t('history')}</span></h1>
          <p className="p-sub">{t('historyDesc')}</p>
        </div>
        <button className="btn-primary" onClick={() => goTo('generate')}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          New Generation
        </button>
      </div>

      {histories.length > 0 && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24}}>
          {[
            { label:'Total Generations', val: histories.length, color:'var(--gold)', icon:'🚀' },
            { label:'Total Tests',       val: totalTests,       color:'#4f86e8',     icon:'🔬' },
            { label:'Tests Passed',      val: totalPass,        color:'#10b981',     icon:'✅' },
            { label:'Avg Pass Rate',     val: `${avgRate}%`,    color:'#f59e0b',     icon:'🎯' },
          ].map((s, i) => (
            <div key={i} style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:14, padding:'18px 20px', boxShadow:'var(--shadow)', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'var(--bg2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{s.icon}</div>
              <div>
                <div style={{fontFamily:'var(--C)', fontSize:28, fontWeight:700, color:s.color, lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:10, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--muted)', marginTop:4}}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {histories.length > 0 && (
        <div style={{display:'flex', gap:12, marginBottom:20, alignItems:'center'}}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:10, padding:'10px 14px' }}>
            <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Search by URL..." value={search} onChange={e => setSearch(e.target.value)} style={{background:'none', border:'none', color:'var(--text)', fontSize:13, width:'100%'}}/>
          </div>
          <div style={{display:'flex', gap:6}}>
            {['all','Selenium','Cypress','Both'].map(fw => (
              <button key={fw} onClick={() => setFilterFw(fw)} style={{ padding:'8px 16px', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', border:'1.5px solid', borderColor: filterFw===fw ? 'var(--navy)' : 'var(--border)', background: filterFw===fw ? 'var(--navy)' : 'var(--card)', color: filterFw===fw ? '#fff' : 'var(--muted)', transition:'all .2s' }}>
                {fw === 'all' ? 'All' : `${fwConfig[fw]?.emoji} ${fw}`}
              </button>
            ))}
          </div>
          <div style={{fontSize:12, color:'var(--muted)', fontWeight:600, flexShrink:0}}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</div>
        </div>
      )}

      {loading ? (
        <div style={{textAlign:'center', padding:'60px 0', color:'var(--muted)'}}><span className="spinner" style={{marginRight:8}}/>Loading...</div>
      ) : histories.length === 0 ? (
        <div className="hist-empty">
          <div className="he-ring"><svg width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <h3>{t('noHistoryYet')}</h3>
          <p>{t('noHistoryDesc')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="hist-empty">
          <div className="he-ring">🔍</div>
          <h3>No results found</h3>
          <p>Try a different search or filter</p>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(480px, 1fr))', gap:16}}>
          {filtered.map((item, i) => {
            const rate        = item.pass_rate || 0;
            const total       = (item.pass_count||0) + (item.fail_count||0) + (item.skip_count||0);
            const statusColor = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
            const fw          = fwConfig[item.framework] || fwConfig['Selenium'];
            return (
              <div key={item.id} style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, overflow:'hidden', boxShadow:'var(--shadow)', transition:'all .25s', animation:`dFadeUp .4s cubic-bezier(.22,1,.36,1) ${i*.05}s both` }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='var(--shadow2)'; e.currentTarget.style.borderColor=fw.border; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='var(--shadow)'; e.currentTarget.style.borderColor='var(--border)'; }}
              >
                <div style={{height:4, background:`linear-gradient(90deg, ${fw.color}, ${statusColor})`}}/>
                <div style={{padding:'20px'}}>
                  <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16}}>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize:13, fontWeight:700, color:'var(--navy)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:6}}>🔗 {item.url}</div>
                      <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
                        <span style={{fontSize:10, fontWeight:700, letterSpacing:'1px', padding:'3px 10px', borderRadius:20, background:fw.bg, color:fw.color, border:`1px solid ${fw.border}`}}>{fw.emoji} {item.framework}</span>
                        <span style={{fontSize:11, color:'var(--muted)'}}>🕐 {timeAgo(item.created_at)}</span>
                        <span style={{fontSize:11, color:'var(--muted)'}}>📋 {total} tests</span>
                      </div>
                    </div>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16}}>
                    {[
                      { label:'Passed',  val:item.pass_count||0, color:'#10b981', bg:'rgba(16,185,129,.08)', border:'rgba(16,185,129,.15)' },
                      { label:'Failed',  val:item.fail_count||0, color:'#ef4444', bg:'rgba(239,68,68,.08)',  border:'rgba(239,68,68,.15)'  },
                      { label:'Skipped', val:item.skip_count||0, color:'#f59e0b', bg:'rgba(245,158,11,.08)', border:'rgba(245,158,11,.15)' },
                    ].map(s => (
                      <div key={s.label} style={{background:s.bg, border:`1px solid ${s.border}`, borderRadius:10, padding:'10px', textAlign:'center'}}>
                        <div style={{fontFamily:'var(--C)', fontSize:24, fontWeight:700, color:s.color, lineHeight:1}}>{s.val}</div>
                        <div style={{fontSize:10, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:s.color, opacity:.8, marginTop:4}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginBottom:16}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
                      <span style={{fontSize:11, fontWeight:600, color:'var(--muted)'}}>Pass Rate</span>
                      <span style={{fontSize:13, fontWeight:700, color:statusColor}}>{rate}%</span>
                    </div>
                    <div style={{height:6, borderRadius:6, background:'var(--border)', overflow:'hidden'}}>
                      <div style={{height:'100%', borderRadius:6, width:`${rate}%`, background:`linear-gradient(90deg, ${fw.color}, ${statusColor})`, transition:'width 1s ease'}}/>
                    </div>
                  </div>
                  <div style={{display:'flex', gap:8}}>
                    <button onClick={() => handleReview(item)} style={{ flex:1, padding:'9px', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', border:'1.5px solid var(--border)', background:'var(--bg)', color:'var(--navy)', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all .2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background='var(--navy)'; e.currentTarget.style.color='#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='var(--bg)'; e.currentTarget.style.color='var(--navy)'; }}
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      View Results
                    </button>
                    <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id} style={{ padding:'9px 14px', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', border:'1.5px solid rgba(239,68,68,.3)', background:'rgba(239,68,68,.05)', color:'#ef4444', transition:'all .2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#ef4444'; e.currentTarget.style.color='#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,.05)'; e.currentTarget.style.color='#ef4444'; }}
                    >
                      {deleting === item.id ? '...' : '🗑'}
                    </button>
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
    } catch (err) { setError(err.response?.data?.message || t('errorOccurred')); }
    setLoading(false);
  };

  const changePassword = async () => {
    if (newPwd !== confirmPwd) { setError(t('passwordMismatch')); return; }
    setLoading(true); setMsg(''); setError('');
    try {
      await api.put('/profile/password', { current_password:currPwd, new_password:newPwd, new_password_confirmation:confirmPwd });
      setMsg(t('passwordChanged'));
      setCurrPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err) { setError(err.response?.data?.errors?.current_password?.[0] || t('errorOccurred')); }
    setLoading(false);
  };

  return (
    <div className="panel">
      <div className="p-header">
        <div>
          <h1 className="p-title">{t('my')} <span className="g">{t('account')}</span></h1>
          <p className="p-sub">{t('accountDesc')}</p>
        </div>
      </div>
      {msg   && <div className="success-msg">✓ {msg}</div>}
      {error && <div className="error-msg">✗ {error}</div>}
      <div style={{background:'linear-gradient(135deg,#060e1e 0%,#0f2744 50%,#0b1829 100%)',borderRadius:20,padding:'32px 36px',marginBottom:28,position:'relative',overflow:'hidden',border:'1px solid rgba(201,162,39,.15)',boxShadow:'0 8px 32px rgba(6,14,30,.2)'}}>
        <div style={{position:'absolute',top:-60,right:-60,width:220,height:220,borderRadius:'50%',background:'radial-gradient(circle,rgba(201,162,39,.12) 0%,transparent 70%)'}}/>
        <div style={{position:'absolute',bottom:-40,left:'40%',width:160,height:160,borderRadius:'50%',background:'radial-gradient(circle,rgba(201,162,39,.06) 0%,transparent 70%)'}}/>
        <div style={{display:'flex',alignItems:'center',gap:28,position:'relative'}}>
          <div style={{position:'relative',flexShrink:0}}>
            <div style={{width:88,height:88,borderRadius:'50%',background:'linear-gradient(135deg,#c9a227,#e8c84a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,fontFamily:'Cormorant Garamond,serif',fontWeight:700,color:'#060e1e',border:'3px solid rgba(255,255,255,.15)',boxShadow:'0 4px 20px rgba(201,162,39,.35)',overflow:'hidden'}}>
              {user?.avatar?<img src={user.avatar} alt="av" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span>{user?.name?.[0]?.toUpperCase()||'U'}</span>}
            </div>
            <input type="file" id="avatar-upload" accept="image/*" style={{display:'none'}} onChange={async(e)=>{const file=e.target.files[0];if(!file)return;const fd=new FormData();fd.append('avatar',file);try{const res=await api.post('/profile/avatar',fd,{headers:{'Content-Type':'multipart/form-data'}});setUser(prev=>({...prev,avatar:res.data.avatar}));}catch(err){console.error(err);}}}/>
            <button style={{position:'absolute',bottom:0,right:0,width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#c9a227,#e8c84a)',border:'2px solid #060e1e',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,.3)',transition:'transform .2s'}} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.15)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'} onClick={()=>document.getElementById('avatar-upload').click()} title={t('changePhoto')}>
              <svg width="13" height="13" fill="none" stroke="#060e1e" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:28,fontWeight:700,color:'#fff',marginBottom:4,lineHeight:1}}>{user?.name||'User'}</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,.5)',marginBottom:12}}>{user?.email||'—'}</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:600,color:'rgba(255,255,255,.6)',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',padding:'4px 12px',borderRadius:20}}>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                {t('qaEngineer')}
              </span>
              {user?.google_id&&(<span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:600,color:'rgba(255,255,255,.6)',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',padding:'4px 12px',borderRadius:20}}>✓ {t('connectedGoogle')}</span>)}
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8,flexShrink:0}}>
            <div style={{background:'rgba(201,162,39,.1)',border:'1px solid rgba(201,162,39,.25)',borderRadius:12,padding:'12px 20px',textAlign:'center'}}>
              <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:28,fontWeight:700,color:'#c9a227',lineHeight:1}}>0</div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(201,162,39,.7)',marginTop:4}}>{t('testsGenerated')}</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div className="set-group">
          <div className="set-group-title">{t('profileInformation')}</div>
          <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:16}}>
            <div className="field">
              <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:6,display:'block'}}>{t('fullName')}</label>
              <div className="field-wrap">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{color:'var(--muted)',flexShrink:0}}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                <input type="text" value={name} placeholder={t('yourFullName')} onChange={e=>setName(e.target.value)}/>
              </div>
            </div>
            <div className="field">
              <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:6,display:'block'}}>{t('emailAddress')}</label>
              <div className="field-wrap">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{color:'var(--muted)',flexShrink:0}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input type="email" value={email} placeholder={t('yourEmail')} onChange={e=>setEmail(e.target.value)}/>
              </div>
            </div>
            <button className="btn-primary" style={{width:'100%',justifyContent:'center',marginTop:4}} onClick={saveProfile} disabled={loading}>
              {loading?<><span className="spinner"/>{t('saving')}</>:<><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>{t('saveChanges')}</>}
            </button>
          </div>
        </div>
        <div className="set-group">
          <div className="set-group-title">{t('changePassword')}</div>
          <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:16}}>
            <div className="field">
              <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:6,display:'block'}}>{t('currentPassword')}</label>
              <div className="field-wrap">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{color:'var(--muted)',flexShrink:0}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input type="password" value={currPwd} placeholder={t('enterCurrentPassword')} onChange={e=>setCurrPwd(e.target.value)}/>
              </div>
            </div>
            <div className="field">
              <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:6,display:'block'}}>{t('newPassword')}</label>
              <div className="field-wrap">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{color:'var(--muted)',flexShrink:0}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input type="password" value={newPwd} placeholder={t('minChars')} onChange={e=>setNewPwd(e.target.value)}/>
              </div>
            </div>
            <div className="field">
              <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:6,display:'block'}}>{t('confirmNewPassword')}</label>
              <div className="field-wrap">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{color:'var(--muted)',flexShrink:0}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input type="password" value={confirmPwd} placeholder={t('confirmNewPassword')} onChange={e=>setConfirmPwd(e.target.value)}/>
              </div>
            </div>
            <button className="btn-primary" style={{width:'100%',justifyContent:'center',marginTop:4}} onClick={changePassword} disabled={loading}>
              {loading?<><span className="spinner"/>{t('updating')}</>:<><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>{t('updatePassword')}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      await api.put('/settings/update', { email_notifications:notifs, weekly_report:weekly, default_framework:framework, theme, language });
      applyLang(language);
      setMsg(t('settingsSaved'));
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const LANGS = [
    { code:'en', label:'English',  flag:'🇬🇧' },
    { code:'fr', label:'Français', flag:'🇫🇷' },
    { code:'ar', label:'العربية',  flag:'🇹🇳' },
  ];

  return (
    <div className="panel">
      <div className="p-header">
        <div>
          <h1 className="p-title">{t('appSettings')} <span className="g">{t('settings')}</span></h1>
          <p className="p-sub">{t('customize')}</p>
        </div>
        <button className="btn-primary" onClick={saveSettings} disabled={loading}>
          {loading?<><span className="spinner"/>{t('saving')}</>:<><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>{t('saveSettings')}</>}
        </button>
      </div>
      {msg && <div className="success-msg">✓ {msg}</div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        <div className="set-group">
          <div className="set-group-title">{t('notifications')}</div>
          <div className="set-row">
            <div><div className="set-name">{t('emailNotif')}</div><div className="set-desc">{t('emailNotifDesc')}</div></div>
            <div className={`toggle${notifs?' on':''}`} onClick={()=>setNotifs(p=>!p)}><span className="toggle-knob"/></div>
          </div>
          <div className="set-row">
            <div><div className="set-name">{t('weeklyReport')}</div><div className="set-desc">{t('weeklyReportDesc')}</div></div>
            <div className={`toggle${weekly?' on':''}`} onClick={()=>setWeekly(p=>!p)}><span className="toggle-knob"/></div>
          </div>
        </div>
        <div className="set-group">
          <div className="set-group-title">{t('exportDefaults')}</div>
          <div className="set-row">
            <div><div className="set-name">{t('defaultFramework')}</div><div className="set-desc">{t('defaultFrameworkDesc')}</div></div>
            <select className="set-select" value={framework} onChange={e=>setFramework(e.target.value)}>
              <option>Selenium</option><option>Cypress</option><option>Both</option>
            </select>
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div className="set-group">
          <div className="set-group-title">{t('appearance')}</div>
          <div style={{padding:'16px 20px'}}>
            <div className="set-name" style={{marginBottom:4}}>{t('theme')}</div>
            <div className="set-desc" style={{marginBottom:14}}>{t('themeDesc')}</div>
            <div style={{display:'flex',gap:12}}>
              {[{key:'light',emoji:'☀️',label:'Light'},{key:'dark',emoji:'🌙',label:'Dark'},{key:'system',emoji:'💻',label:'System'}].map(th=>(
                <div key={th.key} onClick={()=>{ setTheme(th.key); api.put('/settings/update',{theme:th.key}); }} style={{flex:1,padding:'14px 12px',borderRadius:12,cursor:'pointer',border:theme===th.key?'2px solid var(--gold)':'1.5px solid var(--border)',background:theme===th.key?'var(--goldbg)':'var(--bg)',transition:'all .2s',textAlign:'center'}}>
                  <div style={{fontSize:24,marginBottom:6}}>{th.emoji}</div>
                  <div style={{fontSize:12,fontWeight:700,color:theme===th.key?'var(--gold)':'var(--muted)'}}>{th.label}</div>
                  {theme===th.key&&<div style={{width:8,height:8,borderRadius:'50%',background:'var(--gold)',margin:'6px auto 0'}}/>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="set-group">
          <div className="set-group-title">{t('language')}</div>
          <div style={{padding:'16px 20px'}}>
            <div className="set-name" style={{marginBottom:4}}>{t('interfaceLang')}</div>
            <div className="set-desc" style={{marginBottom:14}}>{t('langDesc')}</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {LANGS.map(l=>(
                <div key={l.code} onClick={()=>setLanguage(l.code)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderRadius:10,cursor:'pointer',border:language===l.code?'2px solid var(--gold)':'1.5px solid var(--border)',background:language===l.code?'var(--goldbg)':'var(--bg)',transition:'all .2s'}}>
                  <span style={{fontSize:20}}>{l.flag}</span>
                  <span style={{fontSize:13,fontWeight:600,color:language===l.code?'var(--gold)':'var(--muted)',flex:1}}>{l.label}</span>
                  {language===l.code&&(<svg width="16" height="16" fill="none" stroke="var(--gold)" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    { id:'dashboard', label:t('dashboard'),     badge:null      },
    { id:'generate',  label:t('newGeneration'), badge:t('new')  },
    { id:'execution', label:t('testExecution'), badge:null      },
    { id:'history',   label:t('history'),       badge:null      },
  ];
  const NAV_USER = [
    { id:'account',  label:t('account')  },
    { id:'settings', label:t('settings') },
  ];
  const LABELS = {
    dashboard:t('dashboard'), generate:t('newGeneration'),
    execution:t('testExecution'), history:t('history'),
    account:t('account'), settings:t('settings'),
  };

  return (
    <div className="dash-root" style={{position:"fixed",top:0,left:0,right:0,bottom:0,width:"100vw",height:"100vh",display:"flex",flexDirection:"row",overflow:"hidden"}}>
      <aside className={`sidebar${collapsed?' collapsed':''}`}>
        <NexLogo collapsed={collapsed}/>
        <button className="s-toggle" onClick={()=>setCollapse(p=>!p)}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            {collapsed?<path d="M9 18l6-6-6-6"/>:<path d="M15 18l-6-6 6-6"/>}
          </svg>
        </button>
        <nav className="s-nav">
          <div className="s-group">
            {!collapsed&&<div className="s-label">{t('main')}</div>}
            {NAV_MAIN.map(it=>(<SItem key={it.id} {...it} active={page===it.id} collapsed={collapsed} onClick={setPage}/>))}
          </div>
          <div className="s-divider"/>
          <div className="s-group">
            {!collapsed&&<div className="s-label">{t('user')}</div>}
            {NAV_USER.map(it=>(<SItem key={it.id} {...it} active={page===it.id} collapsed={collapsed} onClick={setPage}/>))}
          </div>
        </nav>
        <div className="s-footer">
          <button className="s-item s-logout" onClick={logout} title={t('logout')}>
            <span className="s-icon">{IC.logout}</span>
            {!collapsed&&<span className="s-label-txt">{t('logout')}</span>}
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="header">
          <div className="h-left">
            <div className="h-breadcrumb">
              <span className="h-bc-root">NexTest</span>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{color:'#e5e7f0'}}><path d="M9 18l6-6-6-6"/></svg>
              <span className="h-bc-page">{LABELS[page]}</span>
            </div>
          </div>
          <div className="h-search">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{color:'#9ca3af',flexShrink:0}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder={t('searchPlaceholder')}/>
          </div>
          <div className="h-right">
            <button className="h-icon-btn">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className="notif-dot"/>
            </button>
            <div className="h-sep"/>
            <div className="h-avatar">
              {user?.avatar?<img src={user.avatar} alt="av" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/>:<span>{user?.name?.[0]?.toUpperCase()||'U'}</span>}
            </div>
            <div>
              <div className="h-user-name">{user?.name?.split(' ')[0]||'User'}</div>
              <div className="h-user-role">{t('qaEngineer')}</div>
            </div>
          </div>
        </header>

        <div className="content">
          {page==='dashboard'&&<DashboardPanel user={user} goTo={setPage}/>}
          {page==='generate' &&<GeneratePanel  goTo={setPage} setGeneration={setGeneration}/>}
          {page==='execution'&&<ExecutionPanel generation={generation}/>}
          {page==='history'  &&<HistoryPanel   goTo={setPage} setGeneration={setGeneration}/>}
          {page==='account'  &&<AccountPanel   user={user}/>}
          {page==='settings' &&<SettingsPanel  theme={theme} setTheme={setTheme}/>}
        </div>
      </div>
    </div>
  );
}
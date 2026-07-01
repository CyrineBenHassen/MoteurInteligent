import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';


import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, CartesianGrid,
} from 'recharts';


import {
  IconShieldExclamation, IconClockExclamation, IconFlame, IconCircleDashedCheck,
  IconZoomScan, IconBellOff, IconTrashX, IconZoom, IconRotateClockwise,
  IconCircleX, IconCircleCheck, IconChevronDown, IconX,
  IconShieldBolt, IconTrendingUp, IconChartDonut, IconChartBar,
  IconRefresh, IconSearch,
} from '@tabler/icons-react';

/* ─── severity / status maps (matches your badge style: PI/SMOKE pill look) ── */
const SEV = {
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.3)', icon: <IconFlame size={13} color="#ef4444" /> },
 High: { color: '#f59e0b', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.3)', icon: <IconShieldExclamation size={13} color="#f59e0b" /> },
  Medium:   { color: '#eab308', bg: 'rgba(234,179,8,.12)',  border: 'rgba(234,179,8,.3)',  icon: <IconClockExclamation size={13} color="#eab308" /> },
  Low:      { color: '#3b82f6', bg: 'rgba(59,130,246,.12)', border: 'rgba(59,130,246,.3)', icon: <IconCircleDashedCheck size={13} color="#3b82f6" /> },
};
const STAT = {
  Active:   { color: '#ef4444', bg: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.3)'  },
  Resolved: { color: '#10b981', bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.3)' },
  Muted:    { color: '#64748b', bg: 'rgba(100,116,139,.12)', border: 'rgba(100,116,139,.3)' },
};

const TEMPLATES = [
  { name: 'HTTP 500 Error Detected',          severity: 'Critical', category: 'Failures'     },
  { name: 'Endpoint Unreachable',              severity: 'Critical', category: 'Availability' },
  { name: 'Service Unavailable',               severity: 'Critical', category: 'Availability' },
  { name: 'SSL Certificate Validation Failed', severity: 'Critical', category: 'Security'     },
  { name: 'High Failure Rate Detected',        severity: 'High',     category: 'Failures'     },
  { name: 'Multiple Consecutive Failures',     severity: 'High',     category: 'Failures'     },
  { name: 'Pass Rate Below 80%',               severity: 'High',     category: 'Failures'     },
  { name: 'Response Time Exceeded Threshold',  severity: 'Medium',   category: 'Performance'  },
  { name: 'Performance Degradation Detected',  severity: 'Medium',   category: 'Performance'  },
  { name: 'Timeout Detected',                  severity: 'Medium',   category: 'Timeout'      },
  { name: 'Slow Response Warning',             severity: 'Low',      category: 'Performance'  },
  { name: 'Temporary Network Instability',     severity: 'Low',      category: 'Availability' },
  { name: 'Excessive Redirects Detected',      severity: 'Low',      category: 'Failures'     },
];

const URLS = [
  '/api/v1/dossiers', '/api/v1/auth/login', '/api/v1/users', '/reception',
  '/dashboard', '/api/v1/reports', '/api/v1/smoke/run', '/api/v1/regression/run',
];

function mapAlert(a) {
  const severityMap = { 
    critical: 'Critical', 
    flaky: 'High', 
    warning: 'Medium', 
    stable: 'Low' 
  };
  const categoryMap = { 
    critical: 'Failures', 
    flaky: 'Failures', 
    warning: 'Performance', 
    stable: 'Availability' 
  };

  const triggeredAt = new Date(a.created_at);
  const todayCutoff = new Date(); 
  todayCutoff.setHours(0, 0, 0, 0);

  const statusMap = {
    resolved: 'Resolved',
    muted:    'Muted',
    stable:   'Resolved',
  };

  // ← pour severity, on utilise previous_status si resolved/muted
  const severitySource = ['resolved', 'muted'].includes(a.status)
    ? (a.previous_status ?? a.status)
    : a.status;

  return {
    id:              a.id,
    name:            a.url,
    test_name:       a.test_name,
    test_type:       a.test_type,
    severity:        severityMap[severitySource] ?? 'Low',
    status:          statusMap[a.status] ?? 'Active',
    category:        categoryMap[severitySource] ?? 'Failures',
    url:             a.url,
    triggeredAt,
    triggeredToday:  triggeredAt >= todayCutoff,
    read:            a.read,
    flakiness_score: a.flakiness_score,
  };
}

function generateAlerts(count = 28) {
  return Array.from({ length: count }, (_, i) => {
    const t = TEMPLATES[i % TEMPLATES.length];
    const triggered = new Date(Date.now() - Math.random() * 48 * 3600000);
    const todayCutoff = new Date(); todayCutoff.setHours(0, 0, 0, 0);
    const statuses = ['Active', 'Active', 'Active', 'Resolved', 'Muted'];
    return {
      id: i + 1, ...t,
      url: URLS[i % URLS.length],
      status: statuses[i % statuses.length],
      triggeredAt: triggered,
      triggeredToday: triggered >= todayCutoff,
      read: i > 4,
    };
  });
}

function buildTrendData(alerts) {
  const days = 7, now = Date.now();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now - (days - 1 - i) * 86400000);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayAlerts = alerts.filter(a => new Date(a.triggeredAt).toDateString() === d.toDateString());
    return {
      date: label,
      Critical: dayAlerts.filter(a => a.severity === 'Critical').length,
      High:     dayAlerts.filter(a => a.severity === 'High').length,
      Medium:   dayAlerts.filter(a => a.severity === 'Medium').length,
      Low:      dayAlerts.filter(a => a.severity === 'Low').length,
    };
  });
}

function buildDonutData(alerts) {
  return Object.keys(SEV).map(k => ({ name: k, value: alerts.filter(a => a.severity === k).length, color: SEV[k].color }));
}

function buildCategoryData(alerts) {
  return ['Failures', 'Performance', 'Availability', 'Security', 'Timeout'].map(c => ({
    name: c, count: alerts.filter(a => a.category === c).length,
  }));
}

/* ─── small components ──────────────────────────────────────────────── */
function Badge({ label, color, bg, border }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 12px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, color, background: bg, border: `1px solid ${border}`,
    }}>{label}</span>
  );
}
function KpiCard({ icon, label, value, sub, color, loading, progress }) {

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
      padding: '20px 22px', position: 'relative', overflow: 'hidden',
      boxShadow: 'var(--shadow)',
    }}>
      {/* Top gradient bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      
      {/* Glow background */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `${color}10`, filter: 'blur(20px)', pointerEvents: 'none' }} />

      {/* Icon + trend indicator */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>{icon}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${color}12`, border: `1px solid ${color}25`, borderRadius: 20, padding: '3px 10px' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: 0.5 }}>LIVE</span>
        </div>
      </div>

      {/* Value */}
      {loading ? (
        <div style={{ height: 36, width: 60, borderRadius: 6, background: 'var(--border)', animation: 'shimmer 1.5s ease-in-out infinite', marginBottom: 8 }} />
      ) : (
        <div style={{ fontFamily: 'var(--C)', fontSize: 34, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 6 }}>{value}</div>
      )}

      {/* Label */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</div>
      
      {/* Sub + progress bar */}
      {sub && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--dimmed)', marginBottom: 6 }}>{sub}</div>
          <div style={{ height: 3, borderRadius: 3, background: 'var(--border)' }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${progress ?? 30}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, transition: 'width .6s ease' }} />
          </div>
        </div>
      )}
    </div>
  );
}

function ActionMenu({ alert, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const actions = [
  { id: 'view',    label: 'View Details',  icon: <IconZoomScan size={13} />,      show: true },
  { id: 'resolve', label: 'Resolve Alert', icon: <IconCircleCheck size={13} />,   show: alert.status !== 'Resolved' },
  { id: 'mute',    label: 'Mute Alert',    icon: <IconBellOff size={13} />,       show: alert.status !== 'Muted' },
  { id: 'delete',  label: 'Delete Alert',  icon: <IconTrashX size={13} />,        show: true, danger: true },
].filter(a => a.show);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--bg2)', border: '1px solid var(--border)',
        color: 'var(--sub)', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      }}>Actions <IconChevronDown size={11} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} /></button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50, background: 'var(--card)',
          border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', minWidth: 165, boxShadow: '0 8px 28px rgba(0,0,0,.4)',
        }}>
          {actions.map(a => (
            <button key={a.id} onClick={() => { onAction(alert.id, a.id); setOpen(false); }} style={{
              display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 14px', fontSize: 12,
              background: 'none', border: 'none', cursor: 'pointer', color: a.danger ? 'var(--red)' : 'var(--text)',
              textAlign: 'left', fontFamily: 'inherit', transition: 'background .12s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{a.icon} {a.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailModal({ alert, onClose }) {
  if (!alert) return null;
  const sev = SEV[alert.severity], st = STAT[alert.status];

  const sevGradient = {
    Critical: 'linear-gradient(135deg, #ef444422, #ef444408)',
    High:     'linear-gradient(135deg, #f9731622, #f9731608)',
    Medium:   'linear-gradient(135deg, #eab30822, #eab30808)',
    Low:      'linear-gradient(135deg, #3b82f622, #3b82f608)',
  }[alert.severity] ?? 'none';

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, width: 500, maxWidth: '92vw', boxShadow: '0 24px 64px rgba(0,0,0,.7)', overflow: 'hidden' }}>

        {/* ── Header coloré selon severity ── */}
        <div style={{ background: sevGradient, borderBottom: '1px solid var(--border)', padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: sev.color, boxShadow: `0 0 8px ${sev.color}` }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'var(--muted)', textTransform: 'uppercase' }}>Alert #{alert.id}</span>
            </div>
            <div style={{ fontFamily: 'var(--C)', fontSize: 16, fontWeight: 700, color: 'var(--text)', wordBreak: 'break-all', lineHeight: 1.4 }}>
              {alert.url}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12 }}>
            <IconX size={14} />
          </button>
        </div>

        {/* ── Badges severity + status ── */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 26px', borderBottom: '1px solid var(--border3)' }}>
          <div style={{ flex: 1, background: sev.bg, border: `1px solid ${sev.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ color: sev.color }}>{sev.icon}</div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Severity</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: sev.color }}>{alert.severity}</div>
            </div>
          </div>
          <div style={{ flex: 1, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Status</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: st.color }}>{alert.status}</div>
            </div>
          </div>
          <div style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Flakiness</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: alert.flakiness_score > 50 ? '#ef4444' : alert.flakiness_score > 20 ? '#f97316' : '#10b981' }}>
              {alert.flakiness_score ?? '—'}%
            </div>
            <div style={{ marginTop: 6, height: 4, borderRadius: 4, background: 'var(--border)' }}>
              <div style={{ height: '100%', borderRadius: 4, width: `${alert.flakiness_score ?? 0}%`, background: alert.flakiness_score > 50 ? '#ef4444' : alert.flakiness_score > 20 ? '#f97316' : '#10b981', transition: 'width .4s' }} />
            </div>
          </div>
        </div>

        {/* ── Infos détaillées ── */}
        <div style={{ padding: '16px 26px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Test Name */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Test Name</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{alert.test_name}</span>
          </div>

          {/* Test Type + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Test Type</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--indigo2)' }}>{alert.test_type}</div>
            </div>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Category</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{alert.category}</div>
            </div>
          </div>

          {/* Last Triggered + Today */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Last Triggered</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{alert.triggeredAt.toLocaleString()}</div>
            </div>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Triggered Today</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: alert.triggeredToday ? '#10b981' : 'var(--muted)' }}>
                {alert.triggeredToday ? '✓ Yes' : '✗ No'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '0 26px 22px' }}>
          <button onClick={onClose} style={{ width: '100%', padding: '12px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--indigo)', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.5 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function AlertsPanel() {
  const [allAlerts, setAllAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const PAGE_SIZE = 8;

const loadAlerts = () => {
    setLoading(true);
    api.get('/alerts', { params: { per_page: 100 } })
      .then(res => {
        const data = res.data.data ?? res.data;
        setAllAlerts(Array.isArray(data) ? data.map(mapAlert) : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAlerts(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    api.get('/alerts', { params: { per_page: 100 } })
      .then(res => {
        const data = res.data.data ?? res.data;
        setAllAlerts(Array.isArray(data) ? data.map(mapAlert) : []);
      })
      .catch(console.error)
      .finally(() => setRefreshing(false));
  };

  const handleAction = async (id, action) => {
  if (action === 'view') return setDetail(allAlerts.find(a => a.id === id));

  if (action === 'delete') {
    try {
      await api.delete(`/alerts/${id}`);
      setAllAlerts(prev => prev.filter(a => a.id !== id));
    } catch (e) { console.error(e); }
    return;
  }

  const newStatus = action === 'resolve' ? 'resolved' : 'muted';
  try {
    await api.patch(`/alerts/${id}/status`, { status: newStatus });
    setAllAlerts(prev => prev.map(a => a.id === id ? { ...a, status: action === 'resolve' ? 'Resolved' : 'Muted' } : a));
  } catch (e) { console.error(e); }
};

  const kpi = {
    active:   allAlerts.filter(a => a.status === 'Active').length,
    today:    allAlerts.filter(a => a.triggeredToday).length,
    critical: allAlerts.filter(a => a.severity === 'Critical').length,
    resolved: allAlerts.filter(a => a.status === 'Resolved').length,
  };

  const FILTERS = ['All', 'Active', 'Critical', 'Resolved', 'Muted'];
  const filtered = allAlerts.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.url.toLowerCase().includes(q);
    const matchFilter = filter === 'All' ? true : filter === 'Critical' ? a.severity === 'Critical' : a.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const pageAlerts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const trendData = buildTrendData(allAlerts);
  const donutData = buildDonutData(allAlerts);
  const categoryData = buildCategoryData(allAlerts);

  return (
    <div className="panel">
      {/* ── header ── */}
      <div className="p-header">
        <div>
          <h1 className="p-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  <IconShieldBolt size={22} style={{ color: 'var(--indigo2)' }} />
  <span className="g">Alerts</span>
</h1>
          <p className="p-sub">Monitor and manage all notifications generated by your test executions.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px' }}>
    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
      {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
    </span>
  </div>
  <button className="btn-primary" onClick={handleRefresh} style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}>
    <IconRefresh size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
    Refresh
  </button>
</div>
          
      </div>

 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
      <KpiCard icon={<IconShieldExclamation size={18} />} label="Active Alerts"   value={kpi.active}   color="#ef4444" loading={loading} sub={`${allAlerts.length ? Math.round(kpi.active / allAlerts.length * 100) : 0}% of total`}   progress={allAlerts.length ? Math.round(kpi.active / allAlerts.length * 100) : 0} />
      <KpiCard icon={<IconClockExclamation size={18} />}  label="Triggered Today" value={kpi.today}    color="#f97316" loading={loading} sub="Last 24 hours" progress={allAlerts.length ? Math.round(kpi.today / allAlerts.length * 100) : 0} />
      <KpiCard icon={<IconFlame size={18} />}              label="Critical Alerts" value={kpi.critical} color="#eab308" loading={loading} sub="Needs immediate action" progress={allAlerts.length ? Math.round(kpi.critical / allAlerts.length * 100) : 0} />
      <KpiCard icon={<IconCircleDashedCheck size={18} />}  label="Resolved Alerts" value={kpi.resolved} color="#10b981" loading={loading} sub="Cleared successfully" progress={allAlerts.length ? Math.round(kpi.resolved / allAlerts.length * 100) : 0} />
    </div>
      {/* ── table card ── */}
      <div className="section-box" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border3)', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => { setFilter(f); setPage(1); }} style={{
                padding: '6px 15px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                border: filter === f ? '1.5px solid var(--indigo-border)' : '1.5px solid var(--border)',
                background: filter === f ? 'var(--indigo-bg)' : 'var(--bg)',
                color: filter === f ? 'var(--indigo2)' : 'var(--muted)', transition: 'all .15s',
              }}>{f}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', minWidth: 220 }}>
            <IconSearch size={14} color="var(--muted)" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search alerts..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}><IconX size={13} /></button>}
          </div>
        </div>

       {loading ? (
  <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
    <div style={{ position: 'relative', width: 48, height: 48 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--indigo2)', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#f59e0b', animation: 'spin 1.2s linear infinite reverse' }} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Loading alerts</span>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>Fetching your monitoring data…</span>
    </div>
    {[1, 2, 3].map(i => (
      <div key={i} style={{ width: '100%', display: 'grid', gridTemplateColumns: '110px 1.5fr 110px 150px 100px', gap: 8, padding: '11px 20px', borderBottom: '1px solid var(--border3)', alignItems: 'center', opacity: 1 - i * 0.2 }}>
        {[90, 300, 80, 100, 70].map((w, j) => (
          <div key={j} style={{ height: 14, width: w, borderRadius: 6, background: 'var(--border)', animation: `shimmer 1.5s ease-in-out ${i * 0.15}s infinite` }} />
        ))}
      </div>
    ))}
  </div>
) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔔</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>No alerts found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search or filters.</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '110px 2fr 110px 130px 100px', gap: 8, padding: '10px 20px', borderBottom: '1px solid var(--border3)' }}>
              {['Severity', 'Alert URL', 'Status', 'Last Triggered', 'Actions'].map(h =>  (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</div>
              ))}
            </div>
            {pageAlerts.map(a => {
  const sev = SEV[a.severity], st = STAT[a.status];
  const diff = Date.now() - a.triggeredAt;
  const ago = diff < 3600000 ? `${Math.floor(diff / 60000)}m ago` : `${Math.floor(diff / 3600000)}h ago`;
  return (
    <div key={a.id}
  style={{
    display: 'grid', gridTemplateColumns: '110px 3fr 110px 150px 100px',
    gap: 8, padding: '11px 20px',
    borderBottom: '1px solid var(--border3)',
    alignItems: 'center',
    borderLeft: `3px solid ${sev.color}`,
    background: `linear-gradient(90deg, ${sev.color}08 0%, transparent 40%)`,
  }}
>
      {/* Severity */}
      <div>
        <Badge label={a.severity} {...sev} />
      </div>

      {/* Alert URL */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: sev.color, flexShrink: 0, boxShadow: `0 0 5px ${sev.color}` }} />
          <code style={{
  fontSize: 12, color: 'var(--indigo2)', background: 'var(--indigo-bg)',
  padding: '3px 10px', borderRadius: 6, fontWeight: 600,
  maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis',
  whiteSpace: 'nowrap', display: 'inline-block',
}}>
  {a.url}
</code>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, marginLeft: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 7px', fontSize: 10, fontWeight: 700, color: 'var(--sub)' }}>{a.category}</span>
        </div>
      </div>

      {/* Status */}
      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          color: st.color, background: st.bg, border: `1px solid ${st.border}`,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: st.color, animation: a.status === 'Active' ? 'pulse 1.5s infinite' : 'none' }} />
          {a.status}
        </div>
      </div>

      {/* Last Triggered */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{ago}</span>
        <span style={{ fontSize: 10, color: 'var(--muted)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', display: 'inline-block', width: 'fit-content' }}>
          {a.triggeredAt.toLocaleDateString()}
        </span>
      </div>

      {/* Actions */}
      <div><ActionMenu alert={a} onAction={handleAction} /></div>
    </div>
  );
})}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} alerts</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', color: page === 1 ? 'var(--muted)' : 'var(--text)', cursor: page === 1 ? 'default' : 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>‹ Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    background: p === page ? 'var(--indigo)' : 'var(--card)', border: p === page ? '1px solid var(--indigo2)' : '1px solid var(--border)',
                    color: p === page ? '#fff' : 'var(--muted)',
                  }}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', color: page === totalPages ? 'var(--muted)' : 'var(--text)', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>Next ›</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 20 }}>
        {/* Trend */}
        <div className="section-box" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="sb-head" style={{ padding: '16px 20px' }}>
            
<span className="sb-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
  <IconTrendingUp size={15} color="#6366f1" />
  Alerts Trigger Trend
</span>

          </div>
          <div style={{ flex: 1, padding: '8px 8px 16px', minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
  <BarChart data={trendData} margin={{ top: 12, right: 12, bottom: 0, left: -10 }} barSize={6}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.4} />
    <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
    <YAxis tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={26} />
    <Tooltip content={<ChartTooltip />} />
    <Bar dataKey="Critical" fill="#ef4444" radius={[3,3,0,0]} opacity={0.9} />
    <Bar dataKey="High"     fill="#f59e0b" radius={[3,3,0,0]} opacity={0.9} />
    <Bar dataKey="Medium"   fill="#eab308" radius={[3,3,0,0]} opacity={0.9} />
    <Bar dataKey="Low"      fill="#3b82f6" radius={[3,3,0,0]} opacity={0.9} />
  </BarChart>
</ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 14, padding: '0 20px 16px', flexWrap: 'wrap' }}>
            {Object.entries(SEV).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                <div style={{ width: 10, height: 3, borderRadius: 2, background: v.color }} /> {k}
              </div>
            ))}
          </div>
        </div>

        {/* Donut severity */}
        <div className="section-box">
          <div className="sb-head" style={{ padding: '16px 20px' }}>
            <span className="sb-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
  <IconChartDonut size={15} color="#ef4444" />
  Alerts by Severity
</span>
          </div>

          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 150, height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontFamily: 'var(--C)', fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{allAlerts.length}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>alerts</div>
              </div>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {donutData.map(d => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: d.color }} />
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar category */}
        {/* Bar category */}
<div className="section-box">
  <div className="sb-head" style={{ padding: '16px 20px' }}>
    <span className="sb-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <IconChartBar size={15} color="#f97316" />
      Alerts by Category
    </span>
  </div>

  <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
    {(() => {
      const colors = ['#ef4444', '#f97316', '#eab308', '#6366f1', '#3b82f6'];
      const total = categoryData.reduce((s, c) => s + c.count, 0);
      return categoryData.map((c, i) => {
        const pct = total > 0 ? Math.round(c.count / total * 100) : 0;
        return (
          <div key={c.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[i] }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{c.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: colors[i] }}>{c.count}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', background: `${colors[i]}15`, border: `1px solid ${colors[i]}30`, borderRadius: 10, padding: '1px 7px' }}>{pct}%</span>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 6, background: 'var(--border)' }}>
              <div style={{
                height: '100%', borderRadius: 6,
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${colors[i]}88, ${colors[i]})`,
                transition: 'width .6s ease',
                boxShadow: `0 0 6px ${colors[i]}44`,
              }} />
            </div>
          </div>
        );
      });
    })()}
    <div style={{ marginTop: 6, paddingTop: 10, borderTop: '1px solid var(--border3)', display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Total</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
        {categoryData.reduce((s, c) => s + c.count, 0)} alerts
      </span>
    </div>
  </div>
</div>
      </div>

      <DetailModal alert={detail} onClose={() => setDetail(null)} />
        <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .4; transform: scale(.7); }
        }
      `}</style>
    </div>
  );
}

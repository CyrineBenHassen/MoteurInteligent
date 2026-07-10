import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

import {
  IconShieldExclamation, IconClockExclamation, IconFlame, IconCircleDashedCheck,
  IconZoomScan, IconBellOff, IconTrashX, IconCircleCheck, IconChevronDown, IconX,
  IconShieldBolt, IconTrendingUp, IconChartBar, IconRefresh, IconSearch,
  IconWorldSearch, IconSettings2, IconBolt, IconApi, IconShieldCheck,
} from '@tabler/icons-react';


const SEV = {
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.3)', icon: <IconFlame size={18} stroke={1.8} /> },
  High:     { color: '#f59e0b', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.3)', icon: <IconShieldExclamation size={18} stroke={1.8} /> },
  Medium:   { color: '#eab308', bg: 'rgba(234,179,8,.12)',  border: 'rgba(234,179,8,.3)',  icon: <IconClockExclamation size={18} stroke={1.8} /> },
  Low:      { color: '#3b82f6', bg: 'rgba(59,130,246,.12)', border: 'rgba(59,130,246,.3)', icon: <IconCircleDashedCheck size={18} stroke={1.8} /> },
};
const STAT = {
  Active:   { color: '#ef4444', bg: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.3)'  },
  Resolved: { color: '#10b981', bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.3)' },
  Muted:    { color: '#64748b', bg: 'rgba(100,116,139,.12)', border: 'rgba(100,116,139,.3)' },
};
const TEST_TYPE_ICONS = {
  smoke: <IconFlame size={13} stroke={2} />, seo: <IconWorldSearch size={13} stroke={2} />,
  performance: <IconBolt size={13} stroke={2} />, api: <IconApi size={13} stroke={2} />,
  functional: <IconSettings2 size={13} stroke={2} />, security: <IconShieldCheck size={13} stroke={2} />,
};


function mapAlert(a) {
  const severityMap  = { critical: 'Critical', flaky: 'High', warning: 'Medium', stable: 'Low' };
  const categoryMap  = { critical: 'Failures', flaky: 'Failures', warning: 'Performance', stable: 'Availability' };
  const statusMap    = { resolved: 'Resolved', muted: 'Muted', active: 'Active' };
  const triggeredAt  = new Date(a.created_at);
  const todayCutoff  = new Date(); todayCutoff.setHours(0, 0, 0, 0);
  const severitySource = a.status; 

  return {
    id: a.id,
    project_name: a.project?.name ?? '—',
    test_name: a.test_name,
    test_type: a.test_type,
    severity: severityMap[severitySource] ?? 'Low',
    status: statusMap[a.alert_state] ?? 'Active',
    category: categoryMap[severitySource] ?? 'Failures',
    url: a.url,
    triggeredAt,
    triggeredToday: triggeredAt >= todayCutoff,
    read: a.read,
    flakiness_score: a.flakiness_score,
  };
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

function buildTopProjectsData(alerts) {
  const counts = {};
  alerts.forEach(a => {
    const p = a.project_name || 'Unknown';
    counts[p] = (counts[p] || 0) + 1;
  });
  const colors = ['#ef4444', '#f97316', '#eab308', '#6366f1', '#3b82f6'];
  return Object.entries(counts)
    .map(([name, count], i) => ({ name, count, color: colors[i % colors.length] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
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

function IconBtn({ icon, onClick, color, bg, border, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 30, height: 30, borderRadius: 8, background: bg, border: `1px solid ${border}`,
      color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'transform .15s',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >{icon}</button>
  );
}

function getPageNumbers(current, total) {
  const delta = 1; // pages autour de la page actuelle
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }

  for (const i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l > 2) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
}
export default function AlertsPanel({ onAlertRead }) {
  const [allAlerts, setAllAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const PAGE_SIZE = 6;

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
    loadAlerts();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleAction = async (id, action, e) => {
  e?.stopPropagation();

  if (action === 'view') {
    setExpandedId(prev => prev === id ? null : id);
    const alert = allAlerts.find(a => a.id === id);
    if (alert && !alert.read) {
      try {
        await api.patch(`/alerts/${id}/read`);
        setAllAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
        onAlertRead?.();
      } catch (err) { console.error(err); }
    }
    return;
  }

    if (action === 'delete') {
      try {
        await api.delete(`/alerts/${id}`);
        setAllAlerts(prev => prev.filter(a => a.id !== id));
      } catch (err) { console.error(err); }
      return;
    }

    const newStatus = action === 'resolve' ? 'resolved' : 'muted';
    try {
      await api.patch(`/alerts/${id}/status`, { alert_state: newStatus });
      setAllAlerts(prev => prev.map(a => a.id === id ? { ...a, status: action === 'resolve' ? 'Resolved' : 'Muted' } : a));
    } catch (err) { console.error(err); }
  };

  const kpi = {
    active:   allAlerts.filter(a => a.status === 'Active').length,
    today:    allAlerts.filter(a => a.triggeredToday).length,
    critical: allAlerts.filter(a => a.severity === 'Critical').length,
    resolved: allAlerts.filter(a => a.status === 'Resolved').length,
  };


  const nowTs = Date.now();
  const WEEK = 7 * 86400000;
  const thisWeek = allAlerts.filter(a => nowTs - a.triggeredAt.getTime() < WEEK);
  const lastWeek = allAlerts.filter(a => {
    const d = nowTs - a.triggeredAt.getTime();
    return d >= WEEK && d < 2 * WEEK;
  });
  const calcTrend = (thisVal, lastVal, invertBad = false) => {
    if (lastVal === 0 && thisVal === 0) return { label: 'No data yet', positive: null };
    if (lastVal === 0) return { label: `+${thisVal} this week`, positive: !invertBad };
    const pct = Math.round(((thisVal - lastVal) / lastVal) * 100);
    const sign = pct >= 0 ? '+' : '';
    return { label: `${sign}${pct}% vs last week`, positive: pct === 0 ? null : (pct > 0 ? !invertBad : invertBad) };
  };
  const trendActive   = calcTrend(thisWeek.filter(a => a.status === 'Active').length, lastWeek.filter(a => a.status === 'Active').length, true);
  const trendToday    = calcTrend(kpi.today, allAlerts.filter(a => {
    const d = nowTs - a.triggeredAt.getTime();
    return d >= 86400000 && d < 2 * 86400000;
  }).length, true);
  const trendCritical = calcTrend(thisWeek.filter(a => a.severity === 'Critical').length, lastWeek.filter(a => a.severity === 'Critical').length, true);
  const trendResolved = calcTrend(thisWeek.filter(a => a.status === 'Resolved').length, lastWeek.filter(a => a.status === 'Resolved').length, false);

  const FILTERS = ['All', 'Active', 'Critical', 'Resolved', 'Muted'];
  const filtered = allAlerts.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.url.toLowerCase().includes(q) || a.project_name.toLowerCase().includes(q);
    const matchFilter = filter === 'All' ? true : filter === 'Critical' ? a.severity === 'Critical' : a.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const pageAlerts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const trendData = buildTrendData(allAlerts);
  const topProjectsData = buildTopProjectsData(allAlerts);

  return (
    <div className="panel">
      {/* ── HEADER ── */}
      <div className="p-header">
        <div>
          <h1 className="p-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconShieldBolt size={22} style={{ color: 'var(--indigo2)' }} />
            <span className="g">Alerts</span>
          </h1>
          <p className="p-sub">Monitor and manage all notifications generated by your test executions.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 9, background: 'var(--card)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <button onClick={handleRefresh} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 9, background: 'linear-gradient(135deg,var(--indigo),#4f46e5)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(99,102,241,.3)' }}>
            <IconRefresh size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { Icon: IconShieldExclamation, val: kpi.active,   lbl: 'Active Alerts',   color: '#ef4444', trend: trendActive,   barW: `${allAlerts.length ? Math.round(kpi.active / allAlerts.length * 100) : 0}%` },
          { Icon: IconClockExclamation,  val: kpi.today,    lbl: 'Triggered Today', color: '#f97316', trend: trendToday,    barW: `${allAlerts.length ? Math.round(kpi.today / allAlerts.length * 100) : 0}%` },
          { Icon: IconFlame,             val: kpi.critical, lbl: 'Critical Alerts', color: '#eab308', trend: trendCritical, barW: `${allAlerts.length ? Math.round(kpi.critical / allAlerts.length * 100) : 0}%` },
          { Icon: IconCircleDashedCheck, val: kpi.resolved, lbl: 'Resolved Alerts', color: '#10b981', trend: trendResolved, barW: `${allAlerts.length ? Math.round(kpi.resolved / allAlerts.length * 100) : 0}%` },
        ].map(s => (
          <div key={s.lbl} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderTop: `3px solid ${s.color}`, borderRadius: 14, padding: 16,
            transition: 'transform .2s, box-shadow .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}22`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}15`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                <s.Icon size={18} stroke={1.6} />
              </div>
              {!loading && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                  color:      s.trend.positive === true ? '#10b981' : s.trend.positive === false ? '#ef4444' : 'var(--muted)',
                  background: s.trend.positive === true ? 'rgba(16,185,129,.1)' : s.trend.positive === false ? 'rgba(239,68,68,.1)' : 'var(--bg2)',
                  border:    `1px solid ${s.trend.positive === true ? 'rgba(16,185,129,.2)' : s.trend.positive === false ? 'rgba(239,68,68,.2)' : 'var(--border)'}`,
                }}>
                  {s.trend.positive === true ? '↑' : s.trend.positive === false ? '↓' : '—'} {s.trend.label}
                </span>
              )}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--C)', lineHeight: 1, marginBottom: 4 }}>{loading ? '—' : s.val}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{s.lbl}</div>
            <div style={{ height: 3, borderRadius: 2, background: 'var(--border)', marginTop: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, background: s.color, width: loading ? '0%' : s.barW, transition: 'width 1s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── CHARTS (styled like Reports analytics row) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Trend */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconTrendingUp size={15} stroke={1.5} style={{ color: '#818cf8' }} />
            Alerts Trigger Trend
          </div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barSize={7}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.4} />
                <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="Critical" fill="#ef4444" radius={[3,3,0,0]} />
                <Bar dataKey="High"     fill="#f59e0b" radius={[3,3,0,0]} />
                <Bar dataKey="Medium"   fill="#eab308" radius={[3,3,0,0]} />
                <Bar dataKey="Low"      fill="#3b82f6" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
            {Object.entries(SEV).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                <div style={{ width: 10, height: 3, borderRadius: 2, background: v.color }} /> {k}
              </div>
            ))}
          </div>
        </div>

        {/* Top Projects */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconChartBar size={15} stroke={1.5} style={{ color: '#f97316' }} />
            Top Projects by Alerts
          </div>
          {topProjectsData.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '30px 0' }}>No data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(() => {
                const total = topProjectsData.reduce((s, c) => s + c.count, 0);
                return topProjectsData.map(c => {
                  const pct = total > 0 ? Math.round(c.count / total * 100) : 0;
                  return (
                    <div key={c.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: c.color, flexShrink: 0 }}>{c.count} <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>({pct}%)</span></span>
                      </div>
                      <div style={{ height: 5, borderRadius: 5, background: 'var(--border)' }}>
                        <div style={{ height: '100%', borderRadius: 5, width: `${pct}%`, background: `linear-gradient(90deg, ${c.color}88, ${c.color})`, transition: 'width .6s ease' }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 220px', minWidth: 200, background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '9px 14px' }}>
          <IconSearch size={14} color="var(--muted)" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by URL or project…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}><IconX size={13} /></button>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }} style={{
              padding: '7px 13px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              border: filter === f ? '1.5px solid var(--indigo-border)' : '1.5px solid var(--border)',
              background: filter === f ? 'var(--indigo-bg)' : 'var(--card)',
              color: filter === f ? 'var(--indigo2)' : 'var(--muted)', transition: 'all .18s',
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* ── ALERTS LIST (card style) ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 76, borderRadius: 14, background: 'var(--card)', border: '1px solid var(--border)', opacity: 1 - i * 0.15 }}>
              <div style={{ height: '100%', borderRadius: 14, background: 'var(--border)', animation: `shimmer 1.5s ease-in-out ${i * 0.15}s infinite`, opacity: .3 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '48px 32px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
          🔔 No alerts found. Try adjusting your search or filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {pageAlerts.map(a => {
            const sev = SEV[a.severity], st = STAT[a.status];
            const isOpen = expandedId === a.id;
            const diff = Date.now() - a.triggeredAt;
            const ago = diff < 3600000 ? `${Math.floor(diff / 60000)}m ago` : diff < 86400000 ? `${Math.floor(diff / 3600000)}h ago` : `${Math.floor(diff / 86400000)}d ago`;

            return (
              <div key={a.id} style={{
                background: 'var(--card)', border: `1px solid ${isOpen ? sev.color : 'var(--border)'}`,
                borderRadius: 14, overflow: 'hidden', transition: 'all .2s',
                boxShadow: isOpen ? `0 4px 24px ${sev.color}18` : 'none',
              }}>
                {/* MAIN ROW */}
                 <div onClick={(e) => handleAction(a.id, 'view', e)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', cursor: 'pointer' }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.parentElement.style.borderColor = `${sev.color}55`; }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.parentElement.style.borderColor = 'var(--border)'; }}
                >
                  {/* severity icon */}
                  <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: sev.bg, border: `1px solid ${sev.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sev.color }}>
                    {sev.icon}
                  </div>

                  {/* url + badges */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <code style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.url}</code>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, color: sev.color, background: sev.bg, border: `1px solid ${sev.border}`, textTransform: 'uppercase', letterSpacing: .5 }}>
                        {a.severity}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: 'var(--indigo2)', background: 'var(--indigo-bg)', border: '1px solid var(--indigo-border)' }}>
                        {a.project_name}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: '#a78bfa', background: 'rgba(167,139,250,.12)', border: '1px solid rgba(167,139,250,.3)', textTransform: 'capitalize' }}>
                        {TEST_TYPE_ICONS[a.test_type]} {a.test_type}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>{ago}</span>
                    </div>
                  </div>

                  {/* status pill */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20,
                    fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, border: `1px solid ${st.border}`, flexShrink: 0,
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: st.color, animation: a.status === 'Active' ? 'pulse 1.5s infinite' : 'none' }} />
                    {a.status}
                  </div>

                  {/* action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    {a.status !== 'Resolved' && (
                      <IconBtn icon={<IconCircleCheck size={14} />} onClick={e => handleAction(a.id, 'resolve', e)}
                        color="#10b981" bg="rgba(16,185,129,.1)" border="rgba(16,185,129,.3)" title="Resolve" />
                    )}
                    {a.status !== 'Muted' && (
                      <IconBtn icon={<IconBellOff size={14} />} onClick={e => handleAction(a.id, 'mute', e)}
                        color="var(--sub)" bg="var(--bg2)" border="var(--border)" title="Mute" />
                    )}
                    <IconBtn icon={<IconTrashX size={14} />} onClick={e => handleAction(a.id, 'delete', e)}
                      color="var(--red)" bg="rgba(239,68,68,.1)" border="rgba(239,68,68,.3)" title="Delete" />
                  </div>

                  <IconChevronDown size={16} stroke={2.5} style={{ color: 'var(--muted)', flexShrink: 0, transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </div>

                {/* EXPANDED */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Test Name</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.test_name || '—'}</div>
                    </div>
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Category</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.category}</div>
                    </div>
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Flakiness</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: a.flakiness_score > 50 ? '#ef4444' : a.flakiness_score > 20 ? '#f97316' : '#10b981' }}>
                        {a.flakiness_score ?? '—'}%
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Last Triggered</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{a.triggeredAt.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* pagination */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 24 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            Showing <span style={{ color: 'var(--text)', fontWeight: 700 }}>{(page - 1) * PAGE_SIZE + 1}</span> to{' '}
            <span style={{ color: 'var(--text)', fontWeight: 700 }}>{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{' '}
            <span style={{ color: 'var(--indigo2)', fontWeight: 700 }}>{filtered.length}</span> alerts
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', background: 'var(--card)', border: '1px solid var(--border)', color: page === 1 ? 'var(--muted)' : 'var(--text)', opacity: page === 1 ? 0.5 : 1 }}>Prev</button>
            {getPageNumbers(page, totalPages).map((p, idx) =>
  p === '...' ? (
    <span key={`dots-${idx}`} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--muted)' }}>…</span>
  ) : (
    <button key={p} onClick={() => setPage(p)} style={{
      width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      background: page === p ? 'linear-gradient(135deg,var(--indigo),#4f46e5)' : 'var(--card)',
      border: page === p ? 'none' : '1px solid var(--border)',
      color: page === p ? '#fff' : 'var(--text)',
      boxShadow: page === p ? '0 4px 12px rgba(99,102,241,.3)' : 'none',
    }}>{p}</button>
  )
)}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontFamily: 'inherit', background: 'var(--card)', border: '1px solid var(--border)', color: page === totalPages ? 'var(--muted)' : 'var(--text)', opacity: page === totalPages ? 0.5 : 1 }}>Next</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(.7); } }
        @keyframes shimmer { 0% { opacity: .5; } 50% { opacity: 1; } 100% { opacity: .5; } }
      `}</style>
    </div>
  );
}
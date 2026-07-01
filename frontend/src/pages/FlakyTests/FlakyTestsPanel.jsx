import { useState, useEffect, useCallback, useRef  } from 'react';
import api from '../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';

import {
  IconFlame, IconActivity, IconBolt, IconCircleX, IconCircleCheck,
  IconEye, IconSearch, IconChevronDown, IconAlertTriangle, IconWorld,
  IconShield, IconClick, IconApi,
} from '@tabler/icons-react';


const STATUS_CONFIG = {
  stable:   { label: 'Stable',   color: '#10b981' },
  warning:  { label: 'Warning',  color: '#f59e0b' },
  flaky:    { label: 'Flaky',    color: '#f97316' },
  critical: { label: 'Critical', color: '#ef4444' },
  broken:   { label: 'Broken',   color: '#ef4444' },
  muted:    { label: 'Muted',    color: '#64748b' },
};

function FlakyKpiCard({ icon, color, label, value }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: 14 }}>
        {icon}
      </div>
      <div style={{ fontFamily: 'var(--C)', fontSize: 32, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.stable;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700,
      padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5,
      color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}33`,
    }}>
      {cfg.label}
    </span>
  );
}

export default function FlakyTestsPanel() {
  const [kpis, setKpis] = useState({ total_flaky_tests: 0, flakiness_rate: 0, total_executions: 0, failed_runs: 0 });
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedKey, setExpandedKey] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
const [detailsMap, setDetailsMap] = useState({});
const [dateFilter, setDateFilter] = useState('all');
const [detailsLoading, setDetailsLoading] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const URLS_PER_PAGE = 8;
  
  

  const keyOf = (t) => `${t.url}|${t.test_type}|${t.test_name}`;

const fetchData = useCallback(() => {
  setLoading(true);
  const params = {};
  if (search) params.search = search;
  if (statusFilter !== 'all') params.status = statusFilter;
  if (dateFilter !== 'all') params.date_filter = dateFilter;
  api.get('/flaky-tests', { params })
    .then(res => { setKpis(res.data.kpis); setTests(res.data.tests); })
    .catch(console.error)
    .finally(() => setLoading(false));
}, [search, statusFilter, dateFilter]);

const fetchDetailsRef = useRef(null);

const invalidateDetails = useCallback((test) => {
  const key = `${test.url}|${test.test_type}`;
  setDetailsMap(prev => {
    const next = { ...prev };
    delete next[key];
    return next;
  });
  if (expandedKey === test.url) {
    setTimeout(() => fetchDetailsRef.current?.(test), 0);
  }
}, [expandedKey]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);
useEffect(() => { setCurrentPage(1); }, [search, statusFilter, dateFilter]);

  useEffect(() => {
    const t = setTimeout(fetchData, 350);
    return () => clearTimeout(t);
  }, [fetchData]);

  

 

  const handleFlag = async (test, status) => {
    const key = keyOf(test);
    setActionLoading(key);
    try {
      await api.post('/flaky-tests/flag', {
        project_id: test.project_id,
        url: test.url,
        test_type: test.test_type,
        test_name: test.test_name,
        status,
      });
      invalidateDetails(test);
fetchData();
    } catch (err) {
      console.error('[Flag]', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnflag = async (test) => {
    const key = keyOf(test);
    setActionLoading(key);
    try {
      await api.delete('/flaky-tests/flag', {
        data: { project_id: test.project_id, url: test.url, test_type: test.test_type, test_name: test.test_name },
      });
      invalidateDetails(test);
fetchData();
    } catch (err) {
      console.error('[Unflag]', err);
    } finally {
      setActionLoading(null);
    }
  };


  const fetchDetails = async (test) => {
  const key = `${test.url}|${test.test_type}`;
  if (detailsMap[key]) return;
  setDetailsLoading(key);
  try {
    const res = await api.get('/flaky-tests/details', {
      params: { url: test.url, test_type: test.test_type, project_id: test.project_id }
    });
    setDetailsMap(prev => ({ ...prev, [key]: res.data.cases }));
  } catch (err) {
    console.error('[Details]', err);
  } finally {
    setDetailsLoading(null);
  }
};
fetchDetailsRef.current = fetchDetails; 




  // ── Charts dérivés des vraies données ──
  const urlStats = {};
  tests.forEach(t => {
    if (!urlStats[t.url]) urlStats[t.url] = { url: t.url, totalScore: 0, count: 0 };
    urlStats[t.url].totalScore += t.flakiness_score;
    urlStats[t.url].count += 1;
  });
  const mostUnstableUrls = Object.values(urlStats)
    .map(u => ({ url: u.url.replace(/^https?:\/\//, ''), avgScore: Math.round(u.totalScore / u.count) }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5);

  const statusCounts = {};
  tests.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
  const statusData = Object.entries(statusCounts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: STATUS_CONFIG[k]?.label || k, value: v, color: STATUS_CONFIG[k]?.color || '#64748b' }));

  return (
    <div className="panel">
      <div className="p-header" style={{ marginBottom: 24 }}>
  <div>
    <h1 className="p-title">Flaky <span className="g">Tests</span></h1>
    <p className="p-sub">Automatically detected unstable tests based on your execution history.</p>
  </div>

  {/* Date du jour + filtre */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
    
    {/* Date badge */}
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '9px 14px', borderRadius: 9,
      background: 'var(--card)', border: '1px solid var(--border)',
      fontSize: 12, fontWeight: 600, color: 'var(--muted)',
    }}>
      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
    </div>

    {/* Date filter */}
    <select
      value={dateFilter}
      onChange={e => { setDateFilter(e.target.value); setCurrentPage(1); }}
      style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 9, color: 'var(--text)', fontSize: 12, fontWeight: 700,
        padding: '9px 14px', cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
        transition: 'border-color .2s',
      }}
      onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,.5)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
    >
      <option value="all">All time</option>
      <option value="today">Today</option>
      <option value="week">This week</option>
      <option value="month">This month</option>
    </select>

  </div>
</div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <FlakyKpiCard icon={<IconFlame size={20} stroke={1.6} />} color="#f97316" label="Total Flaky Tests" value={kpis.total_flaky_tests} />
        <FlakyKpiCard icon={<IconActivity size={20} stroke={1.6} />} color="#f59e0b" label="Flakiness Rate" value={`${kpis.flakiness_rate}%`} />
        <FlakyKpiCard icon={<IconBolt size={20} stroke={1.6} />} color="#6366f1" label="Total Executions" value={kpis.total_executions} />
        <FlakyKpiCard icon={<IconCircleX size={20} stroke={1.6} />} color="#ef4444" label="Failed Runs" value={kpis.failed_runs} />
      </div>

      {/* ── SEARCH + FILTERS ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 220, background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '9px 14px' }}>
          <IconSearch size={14} stroke={2} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by test name or URL…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'stable', 'warning', 'flaky', 'critical', 'muted'].map(s => {
            const cfg = STATUS_CONFIG[s];
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{
                  padding: '7px 13px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  border: active ? `1.5px solid ${cfg?.color || '#818cf8'}` : '1.5px solid var(--border)',
                  background: active ? `${cfg?.color || '#818cf8'}15` : 'var(--card)',
                  color: active ? (cfg?.color || '#818cf8') : 'var(--muted)', transition: 'all .18s', textTransform: 'capitalize',
                }}>
                {s === 'all' ? 'All' : cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── GROUPED BY URL TABLE ── */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', opacity: 0.5 }}>
              <div style={{ height: 12, borderRadius: 4, background: 'var(--border)', width: '60%' }} />
            </div>
          ))
        ) : tests.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--muted)' }}>
            <IconAlertTriangle size={28} stroke={1.5} style={{ marginBottom: 10, opacity: 0.5 }} />
            <div style={{ fontSize: 13 }}>Aucun test détecté pour l'instant.</div>
          </div>
        ) : (
          (() => {
            const grouped = {};
            tests.forEach(test => {
              const url = test.url || 'Unknown';
              if (!grouped[url]) grouped[url] = [];
              grouped[url].push(test);
            });

           const sortedEntries = Object.entries(grouped).sort(([, a], [, b]) => {
              const worstScore = arr => Math.max(...arr.map(t => t.flakiness_score || 0));
              return worstScore(b) - worstScore(a);
            });
            const totalUrlPages = Math.ceil(sortedEntries.length / URLS_PER_PAGE);
            const paginatedEntries = sortedEntries.slice((currentPage - 1) * URLS_PER_PAGE, currentPage * URLS_PER_PAGE);

            return paginatedEntries.map(([url, urlTests]) => {
                const isUrlOpen = expandedKey === url;
                const totalRuns = urlTests.reduce((s, t) => s + (t.total_runs || 0), 0);
                const criticalCount = urlTests.filter(t => t.status === 'critical').length;
                const flakyCount = urlTests.filter(t => t.status === 'flaky').length;
                const warningCount = urlTests.filter(t => t.status === 'warning').length;
                const stableCount = urlTests.filter(t => t.status === 'stable' || t.status === 'muted').length;
                const worstStatus = criticalCount > 0 ? 'critical' : flakyCount > 0 ? 'flaky' : warningCount > 0 ? 'warning' : 'stable';
                const worstCfg = STATUS_CONFIG[worstStatus] || STATUS_CONFIG.stable;
                const globalScore = urlTests[0]?.flakiness_score || 0;
                const scoreColor = globalScore > 50 ? '#ef4444' : globalScore > 20 ? '#f97316' : globalScore > 0 ? '#f59e0b' : '#10b981';
                 const TYPE_CONFIG = {
  functional:  { icon: <IconClick size={16} stroke={1.8} />,   color: '#6366f1' },
  smoke:       { icon: <IconFlame size={16} stroke={1.8} />,   color: '#f97316' },
  security:    { icon: <IconShield size={16} stroke={1.8} />,  color: '#ef4444' },
  performance: { icon: <IconBolt size={16} stroke={1.8} />,    color: '#f59e0b' },
  regression:  { icon: <IconActivity size={16} stroke={1.8} />, color: '#8b5cf6' },
  api:         { icon: <IconApi size={16} stroke={1.8} />,     color: '#10b981' },
  seo:         { icon: <IconSearch size={16} stroke={1.8} />,  color: '#06b6d4' },
};
const typeCfg = TYPE_CONFIG[urlTests[0]?.test_type] || { icon: <IconWorld size={16} stroke={1.8} />, color: '#64748b' };
                return (
                  <div key={url} style={{ borderBottom: '1px solid var(--border)' }}>

                    {/* ── URL HEADER ROW ── */}
                    <div
                      onClick={() => {
  const newOpen = isUrlOpen ? null : url;
  setExpandedKey(newOpen);
  if (newOpen) fetchDetails(urlTests[0]);
}}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 20px', cursor: 'pointer',
                        background: isUrlOpen ? `${worstCfg.color}08` : 'transparent',
                        transition: 'background .18s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = `${worstCfg.color}08`}
                      onMouseLeave={e => { if (!isUrlOpen) e.currentTarget.style.background = 'transparent'; }}
                    >
                     <div style={{
  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
  background: `${typeCfg.color}15`, border: `1px solid ${typeCfg.color}33`,
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: typeCfg.color,
}}>
  {typeCfg.icon}
</div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>
                          {url}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, color: 'var(--muted)' }}>{urlTests.length} test{urlTests.length !== 1 ? 's' : ''}</span>
                          <span style={{ fontSize: 10, color: 'var(--muted)' }}>·</span>
                          <span style={{ fontSize: 10, color: 'var(--muted)' }}>{totalRuns} runs</span>
                          {criticalCount > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: '#ef4444', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)' }}>{criticalCount} critical</span>}
                          {flakyCount > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: '#f97316', background: 'rgba(249,115,22,.1)', border: '1px solid rgba(249,115,22,.2)' }}>{flakyCount} flaky</span>}
                          {warningCount > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: '#f59e0b', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)' }}>{warningCount} warning</span>}
                          {stableCount > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: '#10b981', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)' }}>{stableCount} stable</span>}
                          <span style={{ fontSize: 10, color: 'var(--muted)' }}>·</span>
<span style={{ fontSize: 11, fontWeight: 700, color: scoreColor }}>
  {globalScore}% flakiness
</span>
                        </div>
                      </div>

                      <StatusBadge status={worstStatus} />

                      <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2.5" viewBox="0 0 24 24"
                        style={{ flexShrink: 0, transition: 'transform .2s', transform: isUrlOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </div>

                    {/* ── TESTS LIST (expanded) ── */}
{isUrlOpen && (
  <div style={{ background: 'var(--bg)' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.6fr 1fr 0.9fr 1.6fr', gap: 8, padding: '10px 20px 10px 56px', borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
      {['Test Name', 'Pass', 'Fail', 'Flakiness', 'Status', 'Actions'].map(h => (
        <div key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</div>
      ))}
    </div>

    {detailsLoading === `${url}|${urlTests[0]?.test_type}` ? (
      Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ padding: '14px 20px 14px 56px', borderTop: '1px solid var(--border)', opacity: 0.4 }}>
          <div style={{ height: 10, borderRadius: 4, background: 'var(--border)', width: '50%' }} />
        </div>
      ))
    ) : (
      (detailsMap[`${url}|${urlTests[0]?.test_type}`] || []).map((cas, i) => {
        const casKey = `${urlTests[0]?.url}|${urlTests[0]?.test_type}|${cas.test_name}`;
        const isActing = actionLoading === casKey;
        const scoreColor = globalScore > 50 ? '#ef4444' : globalScore > 20 ? '#f97316' : globalScore > 0 ? '#f59e0b' : '#10b981';
        const casFull = { ...urlTests[0], test_name: cas.test_name, generation_id: cas.generation_id };
        const casCfg = STATUS_CONFIG[cas.status] || STATUS_CONFIG.stable;

                          return (
                            <div key={casKey} style={{
                              display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.6fr 1fr 0.9fr 1.6fr',
                              gap: 8, padding: '12px 20px 12px 56px',
                              borderTop: '1px solid var(--border)',
                              alignItems: 'center',
                              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.01)',
                              transition: 'background .15s',
                            }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.01)'}
                            >
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {cas.test_name}
                            </div>

                            <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>{cas.passes}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>{cas.fails}</div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor, minWidth: 28 }}>{globalScore}%</span>
                              <div style={{ flex: 1, height: 5, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 4, width: `${globalScore}%`, background: scoreColor }} />
                              </div>
                            </div>

                            <StatusBadge status={cas.status} />

                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                              

                              {cas.status === 'muted' ? (
                                <button onClick={() => handleUnflag(casFull)} disabled={isActing} style={{ fontSize: 10, fontWeight: 700, padding: '0 8px', height: 26, borderRadius: 6, background: 'rgba(100,116,139,.1)', border: '1px solid rgba(100,116,139,.25)', color: '#64748b', cursor: 'pointer' }}>Unmute</button>
                              ) : (
                                <button onClick={() => handleFlag(casFull, 'muted')} disabled={isActing} style={{ fontSize: 10, fontWeight: 700, padding: '0 8px', height: 26, borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}>Mute</button>
                              )}

                              <button onClick={() => handleFlag(casFull, 'stable')} disabled={isActing} style={{ fontSize: 10, fontWeight: 700, padding: '0 8px', height: 26, borderRadius: 6, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', color: '#10b981', cursor: 'pointer' }}>Stable</button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
                  </div>
                );
              });
          })()
        )}
      </div>
     {!loading && tests.length > 0 && (() => {
  const grouped = {};
  tests.forEach(t => { (grouped[t.url] ||= []).push(t); });
  const totalUrlPages = Math.ceil(Object.keys(grouped).length / URLS_PER_PAGE);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', marginBottom: 24 }}>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
        Showing {(currentPage - 1) * URLS_PER_PAGE + 1}–{Math.min(currentPage * URLS_PER_PAGE, Object.keys(grouped).length)} of {Object.keys(grouped).length} URLs
      </span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
          style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', color: currentPage === 1 ? 'var(--muted)' : 'var(--text)', cursor: currentPage === 1 ? 'default' : 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
          ‹ Prev
        </button>
        {Array.from({ length: totalUrlPages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => setCurrentPage(p)} style={{
            width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            background: p === currentPage ? 'var(--indigo)' : 'var(--card)',
            border: p === currentPage ? '1px solid var(--indigo2)' : '1px solid var(--border)',
            color: p === currentPage ? '#fff' : 'var(--muted)',
          }}>{p}</button>
        ))}
        <button onClick={() => setCurrentPage(p => Math.min(totalUrlPages, p + 1))} disabled={currentPage === totalUrlPages}
          style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', color: currentPage === totalUrlPages ? 'var(--muted)' : 'var(--text)', cursor: currentPage === totalUrlPages ? 'default' : 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
          Next ›
        </button>
      </div>
    </div>
  );
})()}

      {/* ── CHARTS ── */}
{!loading && tests.length > 0 && (
  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
    
    {/* Most Unstable URLs */}
    <div className="section-box">
      <div className="sb-head">
        <span className="sb-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <IconFlame size={15} color="#f97316" />
          Most Unstable URLs
        </span>
      </div>
      <div style={{ padding: '12px 16px 20px', height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mostUnstableUrls} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} opacity={0.5} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="url" width={140} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={v => [`${v}%`, 'Avg flakiness']} />
            <Bar dataKey="avgScore" radius={[0, 6, 6, 0]}>
  {mostUnstableUrls.map((entry, i) => {
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#6366f1', '#3b82f6'];
    return <Cell key={i} fill={colors[i % colors.length]} />;
  })}
</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Status Distribution */}
    <div className="section-box">
      <div className="sb-head">
        <span className="sb-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <IconActivity size={15} color="#6366f1" />
          Status Distribution
        </span>
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(() => {
          const total = statusData.reduce((s, d) => s + d.value, 0);
          return statusData.map((d, i) => {
            const pct = total > 0 ? Math.round(d.value / total * 100) : 0;
            return (
              <div key={d.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{d.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', background: `${d.color}15`, border: `1px solid ${d.color}30`, borderRadius: 10, padding: '1px 7px' }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 6, background: 'var(--border)' }}>
                  <div style={{
                    height: '100%', borderRadius: 6,
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${d.color}88, ${d.color})`,
                    transition: 'width .6s ease',
                    boxShadow: `0 0 6px ${d.color}44`,
                  }} />
                </div>
              </div>
            );
          });
        })()}
        <div style={{ marginTop: 6, paddingTop: 10, borderTop: '1px solid var(--border3)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Total</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            {statusData.reduce((s, d) => s + d.value, 0)} tests
          </span>
        </div>
      </div>
    </div>

  </div>
)}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
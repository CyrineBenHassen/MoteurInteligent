import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';

import {
  IconFlame, IconActivity, IconBolt, IconCircleX, IconCircleCheck,
  IconEye, IconSearch, IconChevronDown, IconAlertTriangle, IconWorld,
  IconShield, IconClick, IconApi, IconTrash, IconArrowsRightLeft,
  IconTrendingUp, IconTrendingDown, IconMinus, IconInfoCircle, IconPlayerSkipForward, IconClock, IconArrowsHorizontal,

} from '@tabler/icons-react';


import { LogoSpinner } from '../Dashboard/Dashboard';



const STATUS_CONFIG = {
  stable:   { label: 'Stable',   color: '#10b981' },
  warning:  { label: 'Warning',  color: '#f59e0b' },
  flaky:    { label: 'Flaky',    color: '#f97316' },
  critical: { label: 'Critical', color: '#ef4444' },
  broken:   { label: 'Broken',   color: '#ef4444' },
  ignored:  { label: 'Ignored',    color: '#64748b' },
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
      width: 'fit-content', justifySelf: 'start',
    }}>
      {cfg.label}
    </span>
  );
}
function ComparisonCard({ comparison }) {
  if (!comparison) {
    return (
      <div style={{ padding: '16px 20px 20px 56px', borderTop: '1px dashed var(--border)', background: 'var(--bg2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>!</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
            Not enough history to compare (minimum 4 executions required).
          </div>
        </div>
      </div>
    );
  }

  const { v1, v2, reason } = comparison;
  const rateDelta = v2.rate - v1.rate;
  const trend = rateDelta < 0 ? 'degraded' : rateDelta > 0 ? 'improved' : 'stable';

  const TREND_CONFIG = {
  degraded: { color: '#ef4444', bg: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.35)', label: 'Degraded',  Icon: IconTrendingDown },
  improved: { color: '#10b981', bg: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.35)', label: 'Improved', Icon: IconTrendingUp },
  stable:   { color: '#6366f1', bg: 'rgba(99,102,241,.1)', border: 'rgba(99,102,241,.35)', label: 'Stable',   Icon: IconArrowsHorizontal },
};
  const cfg = TREND_CONFIG[trend];

  const durationDelta = (v2.avg_duration ?? 0) - (v1.avg_duration ?? 0);
  const newReasons = (v2.fail_reasons || []).filter(r => !(v1.fail_reasons || []).includes(r));
  const resolvedReasons = (v1.fail_reasons || []).filter(r => !(v2.fail_reasons || []).includes(r));
  const persistentReasons = (v2.fail_reasons || []).filter(r => (v1.fail_reasons || []).includes(r));

 const MetricCard = ({ icon, label, v1val, v2val, delta, unit = '', accent }) => {
  const [hover, setHover] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? `${accent}0D` : 'var(--card)',
        border: `1px solid ${hover ? `${accent}55` : 'var(--border)'}`,
        borderRadius: 12, padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'background .18s, border-color .18s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: accent }}>
          {icon}
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</span>
        </div>
        {delta !== 0 && (
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 20,
            color: accent, background: `${accent}18`, border: `1px solid ${accent}40`,
          }}>
            {delta > 0 ? '+' : ''}{delta}{unit}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 0.4 }}>Before</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#818cf8' }}>{v1val}{unit}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: 0.4 }}>After</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#f97316' }}>{v2val}{unit}</span>
        </div>
      </div>
    </div>
  );
};

  const ReasonList = ({ title, reasons, color, bg, border }) => {
    if (!reasons.length) return null;
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {reasons.map((r, i) => (
            <div key={i} style={{
              fontSize: 11.5, color: 'var(--text)', padding: '7px 10px', borderRadius: 8,
              background: bg, border: `1px solid ${border}`, lineHeight: 1.5,
            }}>
              {r}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '18px 20px 22px 56px', borderTop: '1px dashed var(--border)', background: 'var(--bg2)' }}>

      {/* ── Header : badge trend + rappel période ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20,
          background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
          fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          <cfg.Icon size={13} stroke={2.5} /> {cfg.label}
        </div>
        <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>
          {v1.total_runs} runs before · {v2.total_runs} runs after
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
  <MetricCard icon={<IconCircleCheck size={14} stroke={2} />} label="Pass" v1val={v1.passes} v2val={v2.passes} delta={v2.passes - v1.passes} accent="#10b981" />
  <MetricCard icon={<IconCircleX size={14} stroke={2} />} label="Fail" v1val={v1.fails} v2val={v2.fails} delta={v2.fails - v1.fails} accent="#ef4444" />
  <MetricCard icon={<IconPlayerSkipForward size={14} stroke={2} />} label="Skip" v1val={v1.skips} v2val={v2.skips} delta={v2.skips - v1.skips} accent="#f59e0b" />
  <MetricCard icon={<IconClock size={14} stroke={2} />} label="Avg time" v1val={v1.avg_duration ?? 0} v2val={v2.avg_duration ?? 0} delta={durationDelta} unit="ms" accent="#8b5cf6" />
</div>

      {/* ── Success rate — barre unique empilée avant/après ── */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Success Rate</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: cfg.color }}>
            {v1.rate}% → {v2.rate}% <span style={{ opacity: 0.7 }}>({rateDelta > 0 ? '+' : ''}{rateDelta}%)</span>
          </span>
        </div>
        {[{ label: 'Before', rate: v1.rate, color: '#818cf8' }, { label: 'After', rate: v2.rate, color: '#f97316' }].map(r => (
          <div key={r.label} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: r.label === 'Before' ? 8 : 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: r.color, width: 44 }}>{r.label}</span>
            <div style={{ flex: 1, height: 9, borderRadius: 6, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${r.rate}%`, background: r.color, borderRadius: 6, transition: 'width .5s ease' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, width: 38, textAlign: 'right', color: 'var(--text)' }}>{r.rate}%</span>
          </div>
        ))}
      </div>

      {/* ── Ce qui a réellement changé ── */}
      {(newReasons.length > 0 || resolvedReasons.length > 0 || persistentReasons.length > 0) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>What actually changed</div>
          <ReasonList title="New failure causes" reasons={newReasons} color="#ef4444" bg="rgba(239,68,68,.08)" border="rgba(239,68,68,.25)" />
          <ReasonList title="Resolved causes" reasons={resolvedReasons} color="#10b981" bg="rgba(16,185,129,.08)" border="rgba(16,185,129,.25)" />
          <ReasonList title="Still occurring" reasons={persistentReasons} color="#f59e0b" bg="rgba(245,158,11,.08)" border="rgba(245,158,11,.25)" />
        </div>
      )}

      {/* ── Conclusion ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', background: 'var(--card)', border: `1px solid ${cfg.border}`, borderRadius: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0,
        }}>
          <IconInfoCircle size={14} stroke={2} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
          <strong style={{ color: cfg.color }}>Conclusion: </strong>{reason}
        </div>
      </div>
    </div>
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
  const [comparisonOpen, setComparisonOpen] = useState(null);
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

    const detailsKey = `${test.url}|${test.test_type}`;
    setDetailsMap(prev => {
      if (!prev[detailsKey]) return prev;
      return {
        ...prev,
        [detailsKey]: prev[detailsKey].map(c =>
          c.test_name === test.test_name ? { ...c, status } : c
        ),
      };
    });

    try {
      await api.post('/flaky-tests/flag', {
        project_id: test.project_id,
        url: test.url,
        test_type: test.test_type,
        test_name: test.test_name,
        status,
      });
      fetchData();
    } catch (err) {
      console.error('[Flag]', err);
      invalidateDetails(test);
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
const handleDeleteUrl = async (url, projectId) => {
  setActionLoading(url);
  try {
    await api.delete('/flaky-tests/url', {
      data: { project_id: projectId, url },
    });

    // Retire directement les tests de cette URL du state local, sans refetch
    setTests(prev => prev.filter(t => t.url !== url));

    setDetailsMap(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { if (k.startsWith(`${url}|`)) delete next[k]; });
      return next;
    });
    if (expandedKey === url) setExpandedKey(null);
  } catch (err) {
    console.error('[DeleteUrl]', err);
  } finally {
    setActionLoading(null);
  }
};
const handleDelete = async (test) => {
  const key = keyOf(test);
  setActionLoading(key);
  try {
    await api.delete('/flaky-tests', {
      data: { project_id: test.project_id, url: test.url, test_type: test.test_type, test_name: test.test_name },
    });
    invalidateDetails(test);
    fetchData();
  } catch (err) {
    console.error('[Delete]', err);
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
        {['all', 'stable', 'warning', 'flaky', 'critical', 'broken'].map(s => {
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
                {s === 'all' ? 'All' : (cfg?.label || s)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── GROUPED BY URL TABLE ── */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
        {loading ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 14, padding: '40px 0',
          }}>
            <LogoSpinner size={64} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
              Loading flaky tests…
            </span>
          </div>
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
  const testType = test.test_type || 'unknown';
  const key = `${url}|${testType}`;
  if (!grouped[key]) grouped[key] = [];
  grouped[key].push(test);
});

           const sortedEntries = Object.entries(grouped).sort(([, a], [, b]) => {
              const worstScore = arr => Math.max(...arr.map(t => t.flakiness_score || 0));
              return worstScore(b) - worstScore(a);
            });
            const totalUrlPages = Math.ceil(sortedEntries.length / URLS_PER_PAGE);
            const paginatedEntries = sortedEntries.slice((currentPage - 1) * URLS_PER_PAGE, currentPage * URLS_PER_PAGE);

            return paginatedEntries.map(([groupKey, urlTests]) => {
    const url = urlTests[0]?.url;
    const testType = urlTests[0]?.test_type;
    const isUrlOpen = expandedKey === groupKey;
                const totalRuns = urlTests.reduce((s, t) => s + (t.total_runs || 0), 0);
                const criticalCount = urlTests.filter(t => t.status === 'critical').length;
const brokenCount   = urlTests.filter(t => t.status === 'broken').length;
const flakyCount    = urlTests.filter(t => t.status === 'flaky').length;
const warningCount  = urlTests.filter(t => t.status === 'warning').length;
const stableCount   = urlTests.filter(t => t.status === 'stable' || t.status === 'ignored').length;

const worstStatus = brokenCount > 0
  ? 'broken'
  : criticalCount > 0
    ? 'critical'
    : flakyCount > 0
      ? 'flaky'
      : warningCount > 0
        ? 'warning'
        : 'stable';
        {brokenCount > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: '#ef4444', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)' }}>{brokenCount} broken</span>}
                const worstCfg = STATUS_CONFIG[worstStatus] || STATUS_CONFIG.stable;
                const globalScore = urlTests[0]?.flakiness_score || 0;
                const scoreColor = globalScore > 50 ? '#ef4444' : globalScore > 20 ? '#f97316' : globalScore > 0 ? '#f59e0b' : '#10b981';
                 const TYPE_CONFIG = {
  functional:  { icon: <IconClick size={16} stroke={1.8} />,   color: '#6366f1' },
  smoke:       { icon: <IconFlame size={16} stroke={1.8} />,   color: '#f97316' },
  security: { icon: <IconShield size={16} stroke={1.8} />, color: '#a855f7' },
  performance: { icon: <IconBolt size={16} stroke={1.8} />,    color: '#f59e0b' },
  regression:  { icon: <IconActivity size={16} stroke={1.8} />, color: '#8b5cf6' },
  api:         { icon: <IconApi size={16} stroke={1.8} />,     color: '#10b981' },
  seo:         { icon: <IconSearch size={16} stroke={1.8} />,  color: '#06b6d4' },
};
const typeCfg = TYPE_CONFIG[urlTests[0]?.test_type] || { icon: <IconWorld size={16} stroke={1.8} />, color: '#64748b' };
                return (
                      <div key={groupKey} style={{ borderBottom: '1px solid var(--border)' }}>
                    {/* ── URL HEADER ROW ── */}
                    <div
 onClick={() => {
  const newOpen = isUrlOpen ? null : groupKey;
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
{worstStatus === 'broken' ? (
  <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>Always failing</span>
) : (
  <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor }}>{globalScore}% flakiness</span>
)}
                        </div>
                      </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
  <span style={{
    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
    textTransform: 'capitalize', letterSpacing: 0.5,
    color: typeCfg.color, background: `${typeCfg.color}15`, border: `1px solid ${typeCfg.color}33`,
  }}>
    {urlTests[0]?.test_type || 'unknown'}
  </span>
  <StatusBadge status={worstStatus} />
</div>

                      <button
  onClick={(e) => { e.stopPropagation(); handleDeleteUrl(url, urlTests[0]?.project_id); }}
  disabled={actionLoading === url}
  title="Delete"
  style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: 6, flexShrink: 0,
    background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
    color: '#ef4444', cursor: 'pointer',
  }}
>
  <IconTrash size={13} stroke={2} />
</button>

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
                            <React.Fragment key={casKey}>
                            <div style={{
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
    {cas.status === 'ignored' ? (
<button onClick={() => handleUnflag(casFull)} disabled={isActing} style={{ fontSize: 10, fontWeight: 700, padding: '0 8px', height: 26, borderRadius: 6, background: 'rgba(100,116,139,.1)', border: '1px solid rgba(100,116,139,.25)', color: '#64748b', cursor: 'pointer' }}>Unignore</button>  ) : (
<button onClick={() => handleFlag(casFull, 'ignored')} disabled={isActing} style={{ fontSize: 10, fontWeight: 700, padding: '0 8px', height: 26, borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}>Ignore</button>  )}

  <button onClick={() => handleFlag(casFull, 'stable')} disabled={isActing} style={{ fontSize: 10, fontWeight: 700, padding: '0 8px', height: 26, borderRadius: 6, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', color: '#10b981', cursor: 'pointer' }}>Stable</button>

  <button
    onClick={() => setComparisonOpen(comparisonOpen === casKey ? null : casKey)}
    disabled={isActing}
    title="Comparer avant / après"
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 26, height: 26, borderRadius: 6,
      background: comparisonOpen === casKey ? 'rgba(99,102,241,.15)' : 'var(--bg2)',
      border: comparisonOpen === casKey ? '1px solid rgba(99,102,241,.4)' : '1px solid var(--border)',
      color: comparisonOpen === casKey ? '#6366f1' : 'var(--muted)', cursor: 'pointer',
    }}
  >
    <IconArrowsRightLeft size={13} stroke={2} />
  </button>

  <button
    onClick={() => handleDelete(casFull)}
    disabled={isActing}
    title="Delete"
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 26, height: 26, borderRadius: 6,
      background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
      color: '#ef4444', cursor: 'pointer',
    }}
  >
    <IconTrash size={13} stroke={2} />
  </button>
</div>
                          </div>

                          {comparisonOpen === casKey && (
  <ComparisonCard comparison={cas.comparison} />
)}
                          </React.Fragment>
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
  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>

    {/* Most Unstable URLs */}
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
      <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'linear-gradient(135deg, #f9731622, #ef444422)',
            border: '1px solid #f9731633',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316',
          }}>
            <IconFlame size={15} stroke={2} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>Most Unstable URLs</div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 500 }}>Ranked by average flakiness score</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {mostUnstableUrls.map((u, i) => {
          const color = u.avgScore > 50 ? '#ef4444' : u.avgScore > 20 ? '#f97316' : u.avgScore > 0 ? '#f59e0b' : '#10b981';
          return (
            <div key={u.url}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{
                    fontSize: 9.5, fontWeight: 800, color: 'var(--muted)', width: 14, flexShrink: 0,
                  }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{u.url}</span>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 800, color, flexShrink: 0, marginLeft: 10 }}>{u.avgScore}%</span>
              </div>
              <div style={{ height: 7, borderRadius: 6, background: 'var(--border)', overflow: 'hidden', marginLeft: 22 }}>
                <div style={{
                  height: '100%', borderRadius: 6, width: `${u.avgScore}%`,
                  background: `linear-gradient(90deg, ${color}99, ${color})`,
                  transition: 'width .6s ease',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
  <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--border)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 9,
        background: 'linear-gradient(135deg, #6366f122, #818cf822)',
        border: '1px solid #6366f133',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1',
      }}>
        <IconActivity size={15} stroke={2} />
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>Status Distribution</div>
        <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 500 }}>Share of tests per status</div>
      </div>
    </div>
  </div>

  <div style={{
    padding: '22px 22px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    minHeight: 170,
  }}>
    <div style={{ width: 150, height: 150, position: 'relative', flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={statusData}
            dataKey="value"
            nameKey="name"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={statusData.length > 1 ? 3 : 0}
            stroke="none"
          >
            {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
            formatter={(v, n) => [`${v} tests`, n]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
          {statusData.reduce((s, d) => s + d.value, 0)}
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3 }}>
          Tests
        </div>
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
      {statusData.map(d => {
        const total = statusData.reduce((s, x) => s + x.value, 0);
        const pct = total > 0 ? Math.round(d.value / total * 100) : 0;
        return (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 9, height: 9, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{d.name}</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: d.color, marginLeft: 4 }}>{pct}%</span>
          </div>
        );
      })}
    </div>
  </div>

  {/* ── Bande de mini-stats ── */}
  <div style={{
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    borderTop: '1px solid var(--border)',
  }}>
    {[
      { label: 'Executions', value: kpis.total_executions, color: '#6366f1' },
      { label: 'Failed Runs', value: kpis.failed_runs, color: '#ef4444' },
      { label: 'Flakiness Rate', value: `${kpis.flakiness_rate}%`, color: '#f59e0b' },
    ].map((s, i) => (
      <div key={s.label} style={{
        padding: '14px 16px', textAlign: 'center',
        borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
      }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: s.color, marginBottom: 3 }}>{s.value}</div>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
      </div>
    ))}
  </div>
</div>

  </div>
)}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
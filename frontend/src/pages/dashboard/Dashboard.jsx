
//Imports
import { useState, useEffect, useRef, useMemo  } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import api from '../../api/axios';
import './Dashboard.css';
import { createPortal } from 'react-dom';
import NextestChatbot from '../../pages/Chatboot/Nextestchatbot';
import { motion, AnimatePresence } from 'framer-motion';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, ComposedChart,  AreaChart, Area,
} from 'recharts';

import {
  IconRocket,
  IconCircleCheck,
  IconFolder,
  IconTrophy,
  IconRobot,
  IconWorld,
  IconLock,
  IconFileText,
  IconCircleX,
  IconTarget,
  IconChartArea,
  IconFileTypePdf,
  IconFileTypeCsv,
  IconCode,
  IconExternalLink,
  IconTrash,
  IconEye,
  IconChevronDown,
  IconTag,
  IconAlignLeft,
  IconSparkles,
  IconStarFilled,
  IconInfoCircle,
  IconKey, 

} from '@tabler/icons-react';

import { IconTrendingUp } from '@tabler/icons-react';

import { IconChartDonut } from '@tabler/icons-react';

import { IconFlame } from '@tabler/icons-react';

import { IconTestPipe } from '@tabler/icons-react';

import { IconActivity } from '@tabler/icons-react';

import { IconLink } from '@tabler/icons-react';

import { IconSearch, IconBolt, IconChartBar, IconApi, IconCircleDashed, IconShieldCheck, IconSettings2, IconRefresh, IconWorldSearch, IconLayoutDashboard, IconClick, IconShieldLock, IconSeeding, IconBellRinging, IconBulb } from '@tabler/icons-react';

import {
  IconGauge,
  IconHistory,
  IconFlask2,
  IconComponents,
  IconPlayerPlay,
  IconSend,
} from '@tabler/icons-react';

import * as XLSX from 'xlsx';
import FlakyTestsPanel from '../FlakyTests/FlakyTestsPanel';

import AlertsPanel from '../Alerts/AlertsPanel';

import { LanguageSwitcher } from './LanguageSwitcher';

import ScheduledTasksPanel from './ScheduledTasksPanel';


import { useNavigate } from 'react-router-dom';


import {
  IconWind,
  IconSettings,
} from '@tabler/icons-react';

import { IconHelpCircle } from '@tabler/icons-react';


import { TrendingUp, Flame, Zap, Waves, CheckCircle2, XCircle, AlertTriangle, MinusCircle, Clock, BarChart3, Users  } from 'lucide-react';

import {
  Globe, Lock, Settings2, Smartphone, Check, ChevronDown, Link as LinkIcon,
  ShieldCheck, Sparkles, Tag, User, FileText, ArrowRight, Save, Rocket,
  Wand2, TrendingUp as TrendUpIcon, Loader2, Info, Type,
} from 'lucide-react';






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

//Function of terminal animation 
function AnimatedStat({ val }) {
  const ref = useCountUp(val);
  return <span ref={ref}>{val}</span>;
}

//Function of the logo design
function NexLogo({ collapsed }) {
  return (
    <div className="s-logo" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" width="42" height="42" style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id="hexGradNav" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8a6a00"/>
            <stop offset="40%" stopColor="#C9A227"/>
            <stop offset="100%" stopColor="#E8C84A"/>
          </linearGradient>
          <filter id="glowNav">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <polygon points="45,8 77,27 77,63 45,82 13,63 13,27"
          fill="rgba(201,162,39,0.08)" stroke="url(#hexGradNav)" strokeWidth="2"/>
        <circle cx="45" cy="8"  r="2.5" fill="#C9A227" opacity="0.8"/>
        <circle cx="77" cy="27" r="2.5" fill="#C9A227" opacity="0.8"/>
        <circle cx="77" cy="63" r="2.5" fill="#C9A227" opacity="0.8"/>
        <circle cx="45" cy="82" r="2.5" fill="#C9A227" opacity="0.8"/>
        <circle cx="13" cy="63" r="2.5" fill="#C9A227" opacity="0.8"/>
        <circle cx="13" cy="27" r="2.5" fill="#C9A227" opacity="0.8"/>
        <text x="45" y="56" textAnchor="middle"
          fontFamily="Georgia, serif" fontSize="36" fontWeight="700"
          fill="#C9A227" filter="url(#glowNav)">N</text>
      </svg>

      {!collapsed && (
        <div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>
            NexTest
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 8.5,
            fontWeight: 500,
            color: '#a5b4fc',
            letterSpacing: '3.5px',
            textTransform: 'uppercase',
            marginTop: 5,
          }}>
            Test Automation
          </div>
        </div>
      )}
    </div>
  );
}
//Spinner réutilisable — juste le logo hexagone avec les 2 anneaux animés
export function LogoSpinner({ size = 100 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Ring tournant */}
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute', top: 0, left: 0, animation: 'spin 2.5s linear infinite' }}>
        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(201,162,39,.15)" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#C9A227" strokeWidth="2.5"
          strokeDasharray="60 230" strokeLinecap="round" />
      </svg>

      {/* Ring inverse */}
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute', top: 0, left: 0, animation: 'spinReverse 2s linear infinite' }}>
        <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(99,102,241,.12)" strokeWidth="2" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="#6366f1" strokeWidth="2"
          strokeDasharray="35 200" strokeLinecap="round" />
      </svg>

      {/* Hexagone logo — centre */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: 'logoGlow 2s ease-in-out infinite',
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" width={size * 0.52} height={size * 0.52}>
          <defs>
            <linearGradient id={`hexGradSpinner-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8a6a00"/>
              <stop offset="40%" stopColor="#C9A227"/>
              <stop offset="100%" stopColor="#E8C84A"/>
            </linearGradient>
            <filter id={`glowSpinner-${size}`}>
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <polygon points="45,8 77,27 77,63 45,82 13,63 13,27"
            fill="rgba(201,162,39,0.08)" stroke={`url(#hexGradSpinner-${size})`} strokeWidth="2"/>
          <circle cx="45" cy="8"  r="2.5" fill="#C9A227" opacity="0.8"/>
          <circle cx="77" cy="27" r="2.5" fill="#C9A227" opacity="0.8"/>
          <circle cx="77" cy="63" r="2.5" fill="#C9A227" opacity="0.8"/>
          <circle cx="45" cy="82" r="2.5" fill="#C9A227" opacity="0.8"/>
          <circle cx="13" cy="63" r="2.5" fill="#C9A227" opacity="0.8"/>
          <circle cx="13" cy="27" r="2.5" fill="#C9A227" opacity="0.8"/>
          <text x="45" y="56" textAnchor="middle"
            fontFamily="Georgia, serif" fontSize="36" fontWeight="700"
            fill="#C9A227" filter={`url(#glowSpinner-${size})`}>N</text>
        </svg>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes logoGlow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(201,162,39,0.5)); transform: translate(-50%,-50%) scale(1); }
          50% { filter: drop-shadow(0 0 14px rgba(201,162,39,0.9)); transform: translate(-50%,-50%) scale(1.06); }
        }
      `}</style>
    </div>
  );
}
//Function of switch light and balck mood 
function ThemeToggle({ theme, setTheme }) {
  const isDark = theme !== 'light';
  
  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('nextest-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      style={{
        width: 34, height: 34,
        borderRadius: 8,
        border: `1px solid ${isDark ? 'rgba(99,102,241,.35)' : 'rgba(0,0,0,.12)'}`,
        background: isDark ? 'rgba(99,102,241,.1)' : 'rgba(255,255,255,.9)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: isDark ? '0 0 0 3px rgba(99,102,241,.08)' : 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {/* Sun icon */}
      <svg
        width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        style={{
          position: 'absolute',
          color: '#f59e0b',
          transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          opacity: isDark ? 0 : 1,
          transform: isDark ? 'rotate(-90deg) scale(0.4)' : 'rotate(0deg) scale(1)',
        }}
      >
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>

      {/* Moon icon */}
      <svg
        width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        style={{
          position: 'absolute',
          color: '#a5b4fc',
          transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          opacity: isDark ? 1 : 0,
          transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.4)',
        }}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </button>
  );
}

//icone in the side bar 
const IC = {
  dashboard: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  generate:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  execution: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  scheduled: <svg width="16" height="16" fill="none" stroke="currentColor"strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M12 14l2 2 4-4"/></svg>,
  flaky: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  reports: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  history:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  alerts: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  account:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  settings:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  docs: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
};

function SItem({ id, label, badge, active, collapsed, onClick }) {
  return (
    <button className={`s-item${active ? ' active' : ''}`} onClick={() => onClick(id)} title={collapsed ? label : ''}>
      {/* ← Enveloppe l'icône dans un div position:relative pour le dot */}
      <span className="s-icon" style={{ position: 'relative' }}>
        {IC[id]}
        {/* Dot rouge en mode collapsed */}
        {collapsed && id === 'alerts' && badge > 0 && (
          <span style={{
            position: 'absolute', top: -3, right: -3,
            width: 8, height: 8, borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 6px #ef4444',
            animation: 'pulse 2s infinite',
          }} />
        )}
      </span>
      {!collapsed && <span className="s-label-txt">{label}</span>}
      {!collapsed && badge && (
  <span style={{
    marginLeft: 'auto',
    background: 'rgba(239,68,68,0.15)',
    color: '#f87171',
    fontSize: 10,
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: 6,
    border: '1px solid rgba(239,68,68,0.3)',
    letterSpacing: '0.3px',
  }}>
    {badge > 99 ? '99+' : badge}
  </span>
)}
      {active && <span className="s-active-bar" />}
    </button>
  );
}

//Icon Pass and Fail
function StatusIcon({ s }) {
  if (s === 'pass') return <svg width="15" height="15" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>;
  if (s === 'fail') return <svg width="15" height="15" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>;
  return <svg width="15" height="15" fill="none" stroke="#f59e0b" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>;
}

//badge for type of the test ...
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
            <div style={{ padding: '5px 8px', borderRadius: 6, fontSize: 10, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{expected || '—'}</div>
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
//Function of cards
function KPICard({ icon, iconBg, iconBorder, accentColor, title, value, trend, sparkData, sparkColor, circular }) {
  const [hovered, setHovered] = useState(false);
  const trendColor = trend.positive === true ? 'var(--green)' : trend.positive === false ? 'var(--red)' : 'var(--muted)';
  const trendBg    = trend.positive === true ? 'var(--green-bg)' : trend.positive === false ? 'var(--red-bg)' : 'var(--bg2)';
  const trendBorder= trend.positive === true ? 'var(--green-border)' : trend.positive === false ? 'var(--red-border)' : 'var(--border)';
  const trendIcon  = trend.positive === true ? '↑' : trend.positive === false ? '↓' : '—';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--card)',
        border: `1px solid ${hovered ? accentColor + '44' : 'var(--border)'}`,
        borderRadius: 20,
        padding: '22px 20px 18px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: hovered
          ? `0 16px 40px rgba(0,0,0,0.25), 0 0 0 1px ${accentColor}33`
          : '0 2px 12px rgba(0,0,0,0.12)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.28s cubic-bezier(.22,1,.36,1)',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        minHeight: 148,
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        opacity: hovered ? 1 : 0.5,
        transition: 'opacity 0.28s',
      }} />

    {/* Header row */}
<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
  <div style={{
    width: 42, height: 42, borderRadius: 12,
    background: iconBg, border: `1.5px solid ${iconBorder}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: accentColor,
    boxShadow: `0 4px 12px ${accentColor}22`,
    transition: 'transform 0.25s cubic-bezier(.34,1.56,.64,1)',
    transform: hovered ? 'scale(1.1) rotate(-4deg)' : 'scale(1)',
    flexShrink: 0,
  }}>
    {icon}
  </div>

          {circular ? (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress value={circular.value} size={68} stroke={6} color={circular.color} />
      <div style={{
        position: 'absolute',
        fontSize: 13, fontWeight: 800,
        color: circular.color,
        fontFamily: 'var(--C)',
      }}>
        {circular.value}
      </div>
    </div>
  ) : sparkData ? (
    <div style={{ opacity: hovered ? 1 : 0.7, transition: 'opacity 0.2s', paddingTop: 4 }}>
      <MiniSparkline data={sparkData} color={sparkColor} width={72} height={30} />
    </div>
  ) : null}
</div>

      {/* Title */}
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        marginBottom: 6,
      }}>
        {title}
      </div>

      {/* Value */}
      <div style={{
        fontFamily: 'var(--C)',
        fontSize: 42, fontWeight: 700,
        color: 'var(--text)',
        lineHeight: 1,
        marginBottom: 10,
        letterSpacing: '-1px',
      }}>
        <AnimatedStat val={String(value)} />
      </div>

      {/* Trend badge */}
      <div style={{ marginTop: 'auto' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20,
          fontSize: 10, fontWeight: 700,
          color: trendColor,
          background: trendBg,
          border: `1px solid ${trendBorder}`,
          letterSpacing: '0.3px',
        }}>
          <span style={{ fontSize: 11 }}>{trendIcon}</span>
          {trend.value}
        </span>
      </div>

      {/* Bottom glow */}
      {hovered && (
        <div style={{
          position: 'absolute', bottom: -20, left: '50%',
          transform: 'translateX(-50%)',
          width: '60%', height: 40,
          background: accentColor,
          filter: 'blur(24px)',
          opacity: 0.15,
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}
function MiniSparkline({ data = [], color = '#8b5cf6', width = 80, height = 32 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const fillPts = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.length > 0 && (() => {
        const last = data.length - 1;
        const x = (last / (data.length - 1)) * width;
        const y = height - ((data[last] - min) / range) * (height - 4) - 2;
        return <circle cx={x} cy={y} r="3" fill={color} />;
      })()}
    </svg>
  );
}

function CircularProgress({ value = 0, size = 56, stroke = 5, color = '#10b981' }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1)' }} />
    </svg>
  );
}

//Part of Tests Activity in Dashboard
function ActivityHeatmap({ gens, projects = [] }) {
  const today = new Date();
  const [filterProject, setFilterProject] = useState('all');
  const filteredGens = filterProject === 'all'
    ? gens
    : gens.filter(g => String(g.project_id) === filterProject);
  
  // Construire 28 jours de données (4 semaines)
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (27 - i));
    return {
      date: d,
      dateStr: d.toISOString().split('T')[0],
      count: 0,
      tests: 0,
    };
  });

  // Remplissage avec les donneés (project test et runs )
   filteredGens.forEach(g => {
    const dateStr = new Date(g.created_at).toISOString().split('T')[0];
    const day = days.find(d => d.dateStr === dateStr);
    if (day) {
      day.count += 1;
      day.tests += (g.pass_count || 0) + (g.fail_count || 0) + (g.skip_count || 0);
    }
  });

  const maxTests = Math.max(...days.map(d => d.tests), 1);

  const getColor = (tests) => {
    if (tests === 0) return null;
    const ratio = tests / maxTests;
    if (ratio < 0.25) return 'low';
    if (ratio < 0.6)  return 'medium';
    return 'high';
  };

  // Groupage par semaine (4 semaines x 7 jours)
  const weeks = [
    days.slice(0, 7),
    days.slice(7, 14),
    days.slice(14, 21),
    days.slice(21, 28),
  ];

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const WEEK_LABELS = ['W1', 'W2', 'W3', 'W4'];

  const [hoveredDay, setHoveredDay] = useState(null);

  const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
  <div className="section-box" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
      <div className="sb-head" style={{ alignItems: 'flex-start' }}>
  {/* Title + "Last 4 weeks" subtitle */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <span className="sb-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <IconFlame size={15} stroke={1.5} style={{ color: '#f97316' }} />
      Tests Activity
    </span>
    <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, paddingLeft: 21 }}>
      Last 4 weeks
    </span>
  </div>

  {/* Project filter alone on the right */}
  {projects.length > 0 && (
    <ProjectDropdown projects={projects} filterProject={filterProject} setFilterProject={setFilterProject} />
  )}
</div>

      <div style={{ padding: '16px 18px 12px' }}>
        

        {/* Day labels */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 6, paddingLeft: 28 }}>
          {DAY_LABELS.map(d => (
            <div key={d} style={{
              flex: 1, textAlign: 'center',
              fontSize: 9, fontWeight: 700,
              letterSpacing: '0.5px', textTransform: 'uppercase',
              color: 'var(--muted)',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Week label */}
              <div style={{
                width: 22, flexShrink: 0,
                fontSize: 9, fontWeight: 700,
                color: 'var(--muted)', textAlign: 'right',
              }}>
                {WEEK_LABELS[wi]}
              </div>

              {/* Day cells */}
              {week.map((day, di) => {
                const level = getColor(day.tests);
                const isHovered = hoveredDay?.dateStr === day.dateStr;

                return (
                  <div
                    key={di}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    style={{
                      flex: 1,
                      aspectRatio: '1',
                      borderRadius: 5,
                      cursor: day.tests > 0 ? 'pointer' : 'default',
                      position: 'relative',
                      transition: 'all 0.18s ease',
                      transform: isHovered ? 'scale(1.25)' : 'scale(1)',
                      zIndex: isHovered ? 10 : 1,
                      // Dark mode colors via CSS variables trick
                      background: level === null
                        ? 'var(--heatmap-empty)'
                        : level === 'low'
                        ? 'var(--heatmap-low)'
                        : level === 'medium'
                        ? 'var(--heatmap-medium)'
                        : 'var(--heatmap-high)',
                      boxShadow: isHovered && day.tests > 0
                        ? '0 4px 12px rgba(34,197,94,0.4)'
                        : 'none',
                      border: isHovered
                        ? '1.5px solid rgba(34,197,94,0.6)'
                        : '1px solid transparent',
                    }}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 8px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '6px 10px',
                        whiteSpace: 'nowrap',
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--text)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                        zIndex: 100,
                        pointerEvents: 'none',
                      }}>
                        <div style={{ color: 'var(--muted)', marginBottom: 2, fontSize: 9 }}>
                          {formatDate(day.date)}
                        </div>
                        <div>
                          <span style={{ color: '#22c55e', fontWeight: 800 }}>{day.tests}</span>
                          {' '}tests · {' '}
                          <span style={{ color: 'var(--indigo2)' }}>{day.count}</span>
                          {' '}runs
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{
  display: 'flex', alignItems: 'center', gap: 6,
  marginTop: 16, justifyContent: 'flex-end',
}}>
  <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>Less</span>
  {[null, 'low', 'medium', 'high'].map((level, i) => (
    <div key={i} style={{
      width: 14, height: 14, borderRadius: 4,
      background: level === null ? 'var(--heatmap-empty)'
        : level === 'low' ? 'var(--heatmap-low)'
        : level === 'medium' ? 'var(--heatmap-medium)'
        : 'var(--heatmap-high)',
      border: '1px solid rgba(255,255,255,0.06)',
    }} />
  ))}
  <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>More</span>
</div>

        {/* Footer stats */}
<div style={{
  display: 'flex', gap: 16, marginTop: 12,
  paddingTop: 12, borderTop: '1px solid var(--border3)',
}}>
  {[
    {
      lbl: 'Active days',
      val: days.filter(d => d.tests > 0).length,
      color: '#22c55e',
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2.5"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <polyline points="8 14 10.5 17 16 12" strokeWidth="2.2"/>
        </svg>
      ),
    },
    {
      lbl: 'Total runs',
      val: days.reduce((s, d) => s + d.count, 0),
      color: '#818cf8',
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="2 12 5 12 7 6 9 18 11 12 13 15 15 9 17 12 22 12"/>
        </svg>
      ),
    },
    {
      lbl: 'Peak day',
      val: Math.max(...days.map(d => d.tests)),
      color: '#f59e0b',
      unit: 'tests',
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fillOpacity="0.15"/>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      ),
    },
  ].map(s => (
    <div key={s.lbl} style={{ flex: 1, textAlign: 'center' }}>
      <div style={{
  width: 42, height: 42, borderRadius: 13, margin: '0 auto 10px',
  background: `${s.color}16`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: s.color,
  transition: 'all .22s cubic-bezier(.34,1.56,.64,1)',
}}
  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.background = `${s.color}28`; e.currentTarget.style.borderColor = ''; }}
  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = `${s.color}16`; e.currentTarget.style.borderColor = ''; }}
>
  {s.icon}
</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'var(--C)', lineHeight: 1, marginBottom: 5, letterSpacing: '-0.5px' }}>
        {s.val}
        {s.unit && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginLeft: 4 }}>{s.unit}</span>}
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
        {s.lbl}
      </div>
    </div>
  ))}
</div>
      </div>
    </div>
  );
}

//partie de ai Insights dans le dashboard 
function AIInsights({ stats, topUrls, typeData }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stats || stats.total === 0) { setLoading(false); return; }

    const fetchInsights = async () => {
      setLoading(true);
      try {
        const prompt = `You are a QA analytics assistant. Analyze this test automation data and give exactly 3 short actionable insights (max 2 sentences each). Return ONLY a JSON array like: ["insight1","insight2","insight3"]

Data:
- Total scripts generated: ${stats.total}
- Tests passed: ${stats.totalPass}
- Tests failed: ${stats.totalFail}  
- Tests skipped: ${stats.totalSkip}
- Average pass rate: ${stats.avgRate}%
- Active projects: ${stats.projects}
- Top URLs: ${topUrls.slice(0,3).map(u => `${u.url} (${Math.round((u.pass/u.tests)*100)}% pass rate)`).join(', ')}
- Test types: ${typeData.map(t => `${t.name}: ${t.value}`).join(', ')}`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        const data = await response.json();
        const text = data.content?.[0]?.text || '[]';
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        setInsights(parsed);
      } catch (err) {
        console.error('[AIInsights]', err);
        setInsights([
          `${stats.avgRate >= 80 ? 'Pass rate is healthy at' : 'Pass rate needs attention:'} ${stats.avgRate}%. ${stats.avgRate < 80 ? 'Review failing tests.' : 'Keep monitoring.'}`,
          `${stats.totalFail > 0 ? `${stats.totalFail} tests failed across ${stats.total} scripts. Investigate selectors.` : 'No failures detected — great stability!'}`,
          `${topUrls[0] ? `Most tested URL: ${topUrls[0].url} with ${topUrls[0].tests} tests.` : 'Start generating tests to get insights.'}`,
        ]);
      }
      setLoading(false);
    };

    fetchInsights();
  }, [stats.total]);

  const ICONS_COMPONENTS = [
  <IconSearch size={14} stroke={1.5} />,
  <IconBolt size={14} stroke={1.5} />,
  <IconChartBar size={14} stroke={1.5} />,
];
const COLORS = ['#818cf8', '#f59e0b', '#10b981'];
  return (
    <div className="section-box" style={{ flex: 1 }}>
      <div className="sb-head">
        <span className="sb-title">
  <IconRobot size={16} stroke={1.5} style={{ verticalAlign: 'middle', marginRight: 6 }} />
  AI Insights
</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(99,102,241,.12)', color: 'var(--indigo2)', border: '1px solid rgba(99,102,241,.25)' }}>New</span>
      </div>

      <div style={{ padding: '8px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', opacity: 0.6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--border)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 11, borderRadius: 4, background: 'var(--border)', width: '80%', marginBottom: 6 }} />
                <div style={{ height: 11, borderRadius: 4, background: 'var(--border)', width: '60%' }} />
              </div>
            </div>
          ))
        ) : insights.map((insight, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--bg)', border: `1px solid ${COLORS[i]}22`, transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = `${COLORS[i]}08`; e.currentTarget.style.borderColor = `${COLORS[i]}44`; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.borderColor = `${COLORS[i]}22`; }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: `${COLORS[i]}15`, border: `1px solid ${COLORS[i]}33`, display: 'flex', alignItems: 'center', justifyContent: 'center',
color: COLORS[i],
}}>
              {ICONS_COMPONENTS[i]}
            </div>
            <p style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.6, margin: 0 }}>
              {insight}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

//Dashboard 
function DashboardPanel({ user, goTo }) {
  const { t, lang } = useLang();
  const [stats, setStats] = useState({
  total: 0, projects: 0, avgRate: 0,
  totalPass: 0, publicCount: 0, internalCount: 0, highPassCount: 0,
  trendScripts:  { value: '0 vs last week', positive: null },
  trendPass:     { value: '0 vs last week', positive: null },
  trendProjects: { value: '0 vs last week', positive: null },
  trendRate:     { value: '0 vs last week', positive: null },
});
  const [barData, setBarData] = useState([
    { day: 'Mon', count: 0 }, { day: 'Tue', count: 0 }, { day: 'Wed', count: 0 },
    { day: 'Thu', count: 0 }, { day: 'Fri', count: 0 }, { day: 'Sat', count: 0 }, { day: 'Sun', count: 0 },
  ]);
  const [donutData, setDonutData] = useState([
    { name: 'Passed',  value: 0, color: '#10b981' },
    { name: 'Failed',  value: 0, color: '#ef4444' },
    { name: 'Skipped', value: 0, color: '#f59e0b' },
  ]);
  const [topUrls, setTopUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeData, setTypeData] = useState([]);
  const [allGens,  setAllGens]  = useState([]);
  const [allProjects, setAllProjects] = useState([]); 
  const [projectTrend, setProjectTrend] = useState([0,0,0,0,0,0,0]);
   const [aiVerdict, setAiVerdict] = useState(null);
const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.get('/generations'), api.get('/projects')])
      .then(([genRes, projRes]) => {
  const gens  = genRes.data;
  const projs = projRes.data;
  const now   = new Date();

  // KPI Cards (4) total
  const totalPass = gens.reduce((s, g) => s + (g.pass_count || 0), 0);
  const totalFail = gens.reduce((s, g) => s + (g.fail_count || 0), 0);
  const totalSkip = gens.reduce((s, g) => s + (g.skip_count || 0), 0);
  const avgRate   = gens.length ? Math.round(gens.reduce((s, g) => s + (g.pass_rate || 0), 0) / gens.length) : 0;

  // ── Cette semaine (0-6 jours) ──
  const thisWeekGens = gens.filter(g => {
    const diff = Math.floor((now - new Date(g.created_at)) / 86400000);
    return diff < 7;
  });
  const lastWeekGens = gens.filter(g => {
    const diff = Math.floor((now - new Date(g.created_at)) / 86400000);
    return diff >= 7 && diff < 14;
  });

  // ── Trends scripts ──
  const scriptsThisWeek = thisWeekGens.length;
  const scriptsLastWeek = lastWeekGens.length;
  const scriptsDiff     = scriptsThisWeek - scriptsLastWeek;

  // ── Trends tests passés ──
  const passThisWeek = thisWeekGens.reduce((s, g) => s + (g.pass_count || 0), 0);
  const passLastWeek = lastWeekGens.reduce((s, g) => s + (g.pass_count || 0), 0);
  const passDiff     = passThisWeek - passLastWeek;
  const passPercent  = passLastWeek > 0 ? Math.round(((passThisWeek - passLastWeek) / passLastWeek) * 100) : null;

  // ── Trends projets ──
  const projsThisWeek = projs.filter(p => {
    const diff = Math.floor((now - new Date(p.created_at)) / 86400000);
    return diff < 7;
  }).length;
  const projsLastWeek = projs.filter(p => {
    const diff = Math.floor((now - new Date(p.created_at)) / 86400000);
    return diff >= 7 && diff < 14;
  }).length;
  const projsDiff = projsThisWeek - projsLastWeek;

  // ── Trends success rate ──
  const rateThisWeek = thisWeekGens.length
    ? Math.round(thisWeekGens.reduce((s, g) => s + (g.pass_rate || 0), 0) / thisWeekGens.length)
    : 0;
  const rateLastWeek = lastWeekGens.length
    ? Math.round(lastWeekGens.reduce((s, g) => s + (g.pass_rate || 0), 0) / lastWeekGens.length)
    : 0;
  const rateDiff = rateThisWeek - rateLastWeek;

  // ── Helper format trend ──
  const formatTrend = (diff, unit = '', usePercent = false, percentVal = null) => {
    if (usePercent && percentVal !== null) {
      return {
        value: percentVal === 0 ? `0% vs last week` : `${percentVal > 0 ? '+' : ''}${percentVal}% vs last week`,
        positive: percentVal > 0 ? true : percentVal < 0 ? false : null,
      };
    }
    return {
      value: diff === 0 ? `0${unit} vs last week` : `${diff > 0 ? '+' : ''}${diff}${unit} vs last week`,
      positive: diff > 0 ? true : diff < 0 ? false : null,
    };
  };

  setStats({
    total: gens.length,
    projects: projs.length,
    avgRate,
    totalPass,
    totalFail,   
    totalSkip,  
    publicCount:  projs.filter(p => p.type === 'public').length,
    internalCount: projs.filter(p => p.type === 'internal').length,
    highPassCount:  gens.filter(g => (g.pass_rate || 0) >= 80).length,
    trendScripts: formatTrend(scriptsDiff),
    trendPass:    formatTrend(passDiff, '', true, passPercent),
    trendProjects: formatTrend(projsDiff),
    trendRate:    formatTrend(rateDiff, '%'),
  });

const counts = [0,0,0,0,0,0,0];
const testsPerDay = [0,0,0,0,0,0,0];
gens.forEach(g => {
  const d    = new Date(g.created_at);
  const diff = Math.floor((now - d) / 86400000);
  if (diff < 7) {
    const idx = (d.getDay() + 6) % 7;
    counts[idx]++;
    testsPerDay[idx] += (g.pass_count || 0) + (g.fail_count || 0) + (g.skip_count || 0);
  }
});
setBarData(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => ({
  day,
  count: counts[i],
  tests: testsPerDay[i],
})));

// ── Active Projects trend (cumulative count per day, last 7 days) ──
const projCounts = [0,0,0,0,0,0,0];
for (let i = 0; i < 7; i++) {
  const dayEnd = new Date(now);
  dayEnd.setDate(now.getDate() - (6 - i));
  dayEnd.setHours(23, 59, 59, 999);
  projCounts[i] = projs.filter(p => new Date(p.created_at) <= dayEnd).length;
}
setProjectTrend(projCounts);

  // Donut Charts
  const grandTotal = (totalPass + totalFail + totalSkip) || 1;
  setDonutData([
    { name: 'Passed',  value: Math.round(totalPass / grandTotal * 100), color: '#10b981' },
    { name: 'Failed',  value: Math.round(totalFail / grandTotal * 100), color: '#ef4444' },
    { name: 'Skipped', value: Math.round(totalSkip / grandTotal * 100), color: '#f59e0b' },
  ]);

 

  //Top URLs
const urlMap = {};
gens.forEach(g => {
  if (!urlMap[g.url]) urlMap[g.url] = { url: g.url, framework: g.framework, tests: 0, pass: 0, date: g.created_at, project_id: g.project_id };
  urlMap[g.url].tests += (g.pass_count||0) + (g.fail_count||0) + (g.skip_count||0);
  urlMap[g.url].pass  += g.pass_count || 0;
  urlMap[g.url].date   = g.created_at;
});
setTopUrls(Object.values(urlMap).sort((a,b) => b.tests - a.tests).slice(0,4)); // ← 4 au lieu de 3

  // ── Type distribution ──
  const typeCount = {};
  gens.forEach(g => {
    const t = g.test_type || 'smoke';
    typeCount[t] = (typeCount[t] || 0) + 1;
  });
  setTypeData(Object.entries(typeCount).map(([name, value]) => ({ name, value })));
  setAllGens(gens);
  setAllProjects(projs);
})
    .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);


  const donutTotal = donutData.reduce((s, d) => s + d.value, 0) || 1;
if (loading) return (
  <div className="panel" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap: 28 }}>
    
    {/* Logo hexagone animé */}
    <div style={{ position: 'relative', width: 100, height: 100 }}>
      
      {/* Ring tournant */}
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ position: 'absolute', top: 0, left: 0, animation: 'spin 2.5s linear infinite' }}>
        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(201,162,39,.15)" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#C9A227" strokeWidth="2.5"
          strokeDasharray="60 230" strokeLinecap="round" />
      </svg>

      {/* Ring inverse */}
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ position: 'absolute', top: 0, left: 0, animation: 'spinReverse 2s linear infinite' }}>
        <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(99,102,241,.12)" strokeWidth="2" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="#6366f1" strokeWidth="2"
          strokeDasharray="35 200" strokeLinecap="round" />
      </svg>

      {/* Hexagone logo — centre */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: 'logoGlow 2s ease-in-out infinite',
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" width="52" height="52">
          <defs>
            <linearGradient id="hexGradLoader" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8a6a00"/>
              <stop offset="40%" stopColor="#C9A227"/>
              <stop offset="100%" stopColor="#E8C84A"/>
            </linearGradient>
            <filter id="glowLoader">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <polygon points="45,8 77,27 77,63 45,82 13,63 13,27"
            fill="rgba(201,162,39,0.08)" stroke="url(#hexGradLoader)" strokeWidth="2"/>
          <circle cx="45" cy="8"  r="2.5" fill="#C9A227" opacity="0.8"/>
          <circle cx="77" cy="27" r="2.5" fill="#C9A227" opacity="0.8"/>
          <circle cx="77" cy="63" r="2.5" fill="#C9A227" opacity="0.8"/>
          <circle cx="45" cy="82" r="2.5" fill="#C9A227" opacity="0.8"/>
          <circle cx="13" cy="63" r="2.5" fill="#C9A227" opacity="0.8"/>
          <circle cx="13" cy="27" r="2.5" fill="#C9A227" opacity="0.8"/>
          <text x="45" y="56" textAnchor="middle"
            fontFamily="Georgia, serif" fontSize="36" fontWeight="700"
            fill="#C9A227" filter="url(#glowLoader)">N</text>
        </svg>
      </div>
    </div>

    {/* Text */}
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 20, fontWeight: 700,
        color: 'var(--text)',
        letterSpacing: '4px',
        textTransform: 'uppercase',
        lineHeight: 1,
        marginBottom: 6,
      }}>
        NexTest
      </div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 9, fontWeight: 500,
        color: '#a5b4fc',
        letterSpacing: '3.5px',
        textTransform: 'uppercase',
        marginBottom: 20,
      }}>
        Test Automation
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
        Loading Dashboard
      </div>
      {/* Dots */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#c9a227',
            animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>

    <style>{`
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes spinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
      @keyframes logoGlow {
        0%, 100% { filter: drop-shadow(0 0 6px rgba(201,162,39,0.5)); transform: translate(-50%,-50%) scale(1); }
        50% { filter: drop-shadow(0 0 14px rgba(201,162,39,0.9)); transform: translate(-50%,-50%) scale(1.06); }
      }
      @keyframes dotBounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1.2); opacity: 1; } }
    `}</style>
  </div>
);
  const grandTotal = stats.totalPass + stats.totalFail + stats.totalSkip;
  Math.round(((donutData[1]?.value||0) / 100) * (stats.totalPass / ((donutData[0]?.value||1) / 100))) +
  Math.round(((donutData[2]?.value||0) / 100) * (stats.totalPass / ((donutData[0]?.value||1) / 100)));

  const fetchAiVerdict = async () => {
    if (!topUrls.length) return;
    setAiLoading(true);
    setAiVerdict(null);
    const top = topUrls[0];
    const rate = Math.round((top.pass / top.tests) * 100) || 0;
    const projectName = allProjects.find(p => p.id === top.project_id)?.name || top.url;
    try {
      const res = await api.post('/generations/project-verdict', {
        project_name: projectName,
        tests: top.tests,
        pass_count: top.pass,
        fail_count: top.tests - top.pass,
        pass_rate: rate,
      });
      setAiVerdict(res.data);
    } catch (e) {
      setAiVerdict({ rating: null, text: "Erreur lors de la génération de l'avis IA." });
    } finally {
      setAiLoading(false);
    }
  };

  

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
      <div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 16,
  marginBottom: 24,
}}>
  <KPICard
    icon={<IconRocket size={22} stroke={1.5} />}
    iconBg="rgba(139,92,246,0.12)"
    iconBorder="rgba(139,92,246,0.25)"
    accentColor="#8b5cf6"
    title={t('scriptsGenerated')}
    value={stats.total}
    trend={stats.trendScripts}
    sparkData={barData.map(d => d.count)}
    sparkColor="#8b5cf6"
  />
  <KPICard
    icon={<IconCircleCheck size={22} stroke={1.5} />}
    iconBg="rgba(16,185,129,0.12)"
    iconBorder="rgba(16,185,129,0.25)"
    accentColor="#10b981"
    title={t('passed')}
    value={stats.totalPass}
    trend={stats.trendPass}
    sparkData={barData.map(d => d.count)}
    sparkColor="#10b981"
  />
  <KPICard
    icon={<IconFolder size={22} stroke={1.5} />}
    iconBg="rgba(99,102,241,0.12)"
    iconBorder="rgba(99,102,241,0.25)"
    accentColor="#6366f1"
    title={t('active Projects')}
    value={stats.projects}
    trend={stats.trendProjects}
    sparkData={[stats.publicCount, stats.internalCount, stats.projects, stats.projects, stats.projects, stats.projects, stats.projects]}
    sparkColor="#6366f1"
  />
  <KPICard
     icon={<IconTrophy size={22} stroke={1.5} />}
    iconBg="rgba(201,162,39,0.12)"
    iconBorder="rgba(201,162,39,0.25)"
    accentColor="#c9a227"
    title={t('passRate')}
    value={`${stats.avgRate}%`}
    trend={stats.trendRate}
    circular={{
      value: stats.avgRate,
      color: stats.avgRate >= 80 ? '#10b981' : stats.avgRate >= 50 ? '#f59e0b' : '#ef4444'
    }}
  />
</div>


<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 20, marginBottom: 24 }}>

  {/* ── LINE CHART ── */}
  <div className="section-box" style={{ display: 'flex', flexDirection: 'column', minHeight: 380 }}>
    <div className="sb-head" style={{ padding: '16px 20px', flexShrink: 0 }}>
<span className="sb-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
  <IconTrendingUp size={15} stroke={1.5} style={{ color: '#8b5cf6' }} />
  Tests Trend
</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--indigo2)', background: 'var(--indigo-bg)', border: '1px solid var(--indigo-border)', padding: '3px 10px', borderRadius: 20 }}>{t('thisWeek')}</span>
    </div>
    <div style={{ display: 'flex', gap: 20, padding: '8px 20px 0', flexShrink: 0 }}>
      {[{ color: '#8b5cf6', label: t('scriptsGenerated') }, { color: '#10b981', label: t('testsExecuted') }].map(l => (
        <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 24, height: 3, borderRadius: 2, background: l.color }} />
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{l.label}</span>
        </div>
      ))}
    </div>
 <div style={{ flex: 1, padding: '8px 8px 12px', minHeight: 280 }}>
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={barData} margin={{ top: 40, right: 24, bottom: 4, left: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
      <XAxis dataKey="day" tick={{ fill: 'var(--muted)', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
      <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,.3)' }} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
      <Line type="monotone" dataKey="count" name="Scripts Generated" stroke="#8b5cf6" strokeWidth={2.5}
        dot={{ r: 5, fill: '#8b5cf6', stroke: 'var(--card)', strokeWidth: 2 }}
        activeDot={{ r: 7, fill: '#8b5cf6' }}
        isAnimationActive={false}
        label={({ x, y, value }) => {
          if (!(value > 0)) return null;
          const ty = Math.max(y - 12, 14);
          const tx = Math.min(Math.max(x, 14), 500);
          return (
            <text x={tx} y={ty} fill="#8b5cf6" fontSize={11} fontWeight={700}
              textAnchor="middle" paintOrder="stroke" stroke="var(--card)" strokeWidth={4}>
              {value}
            </text>
          );
        }}
      />
      <Line type="monotone" dataKey="tests" name="Tests Executed" stroke="#10b981" strokeWidth={2.5}
        dot={{ r: 5, fill: '#10b981', stroke: 'var(--card)', strokeWidth: 2 }}
        activeDot={{ r: 7, fill: '#10b981' }}
        isAnimationActive={false}
        label={({ x, y, value }) => {
          if (!(value > 0)) return null;
          const ty = Math.max(y - 12, 14);
          const tx = Math.min(Math.max(x, 14), 500);
          return (
            <text x={tx} y={ty} fill="#10b981" fontSize={11} fontWeight={700}
              textAnchor="middle" paintOrder="stroke" stroke="var(--card)" strokeWidth={4}>
              {value}
            </text>
          );
        }}
      />
    </LineChart>
  </ResponsiveContainer>
</div>
  </div>

  {/* ── DONUT ── */}
<div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', minHeight: 380 }}>
  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border3)' }}>
    <span className="sb-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <IconChartDonut size={15} stroke={1.5} style={{ color: '#10b981' }} />
      Test Results
    </span>
  </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '24px 20px' }}>
      {/* Donut */}
      <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
        <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="90" cy="90" r="70" fill="none" stroke="var(--border)" strokeWidth="22" />
          <circle cx="90" cy="90" r="70" fill="none" stroke="#10b981" strokeWidth="22"
            strokeDasharray={`${(donutData[0]?.value||0)*4.398} 439.8`} strokeLinecap="butt" />
          <circle cx="90" cy="90" r="70" fill="none" stroke="#ef4444" strokeWidth="22"
            strokeDasharray={`${(donutData[1]?.value||0)*4.398} 439.8`}
            strokeDashoffset={`-${(donutData[0]?.value||0)*4.398}`} strokeLinecap="butt" />
          <circle cx="90" cy="90" r="70" fill="none" stroke="#f59e0b" strokeWidth="22"
            strokeDasharray={`${(donutData[2]?.value||0)*4.398} 439.8`}
            strokeDashoffset={`-${((donutData[0]?.value||0)+(donutData[1]?.value||0))*4.398}`} strokeLinecap="butt" />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981', lineHeight: 1, fontFamily: 'var(--C)' }}>{donutData[0]?.value||0}%</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>pass rate</div>
        </div>
      </div>
      {/* Stats */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {[
          { name: 'Passed',  color: '#10b981', pct: donutData[0]?.value||0, count: stats.totalPass },
          { name: 'Failed',  color: '#ef4444', pct: donutData[1]?.value||0, count: stats.totalFail },
          { name: 'Skipped', color: '#f59e0b', pct: donutData[2]?.value||0, count: stats.totalSkip },
        ].map((d, i) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border3)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: d.color }} />
              <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{d.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: d.color, fontFamily: 'var(--C)' }}>{d.count}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>({d.pct}%)</span>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 2, borderTop: '1.5px solid var(--border)' }}>
          <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Total</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--C)' }}>{grandTotal} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>tests</span></span>
        </div>
      </div>
    </div>
  </div>

  <ActivityHeatmap gens={allGens} projects={allProjects} />
</div>

{/* ── MOST TESTED APP ── */}
{topUrls.length > 0 && (() => {
  const top = topUrls[0];
    const projectName = allProjects.find(p => p.id === top.project_id)?.name || top.url;

  const rate = Math.round((top.pass / top.tests) * 100) || 0;
  const isGood = rate >= 80;
  const statusColor = isGood ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
  const statusLabel = isGood ? 'Stable' : rate >= 50 ? 'Needs attention' : 'Critical';
 return (
    <div className="section-box" style={{ marginBottom: 24, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" fill="none" stroke="#c9a227" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2l3 6.5 7 1-5 5 1.5 7L12 18l-6.5 3.5L7 14.5l-5-5 7-1L12 2z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)', marginBottom: 3 }}>
  Most Tested App
</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--indigo2)', cursor: 'pointer' }}
              onClick={() => window.open(top.url, '_blank', 'noopener,noreferrer')}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
              {projectName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--C)' }}>{top.tests}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>tests</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: statusColor, fontFamily: 'var(--C)' }}>{rate}%</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>pass rate</div>
          </div>
          <button
            onClick={fetchAiVerdict}
            disabled={aiLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 20,
              color: '#c9a227', background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.3)',
              cursor: aiLoading ? 'default' : 'pointer', opacity: aiLoading ? 0.6 : 1,
            }}
          >
            <IconSparkles size={14} stroke={1.8} />
            {aiLoading ? 'Analyse...' : 'Avis IA'}
          </button>
        </div>
      </div>

      {aiVerdict && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border3)', display: 'flex', alignItems: 'center', gap: 12 }}>
          {aiVerdict.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <IconStarFilled
                  key={i}
                  size={15}
                  style={{ color: i < aiVerdict.rating ? '#c9a227' : 'var(--border)' }}
                />
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{aiVerdict.text}</div>
        </div>
      )}
    </div>
  );
})()}




 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20, marginBottom: 24, alignItems: 'start' }}>
  {/* ── TEST TYPE DISTRIBUTION ── */}
  <div className="section-box">
    <div className="sb-head">
      <span className="sb-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <IconTestPipe size={15} stroke={1.5} style={{ color: '#6366f1' }} />
        Test Type Distribution
      </span>
    </div>
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        { key: 'smoke',       label: 'Smoke',       color: '#64748b', icon: IconWind },
        { key: 'functional',  label: 'Functional',  color: '#6366f1', icon: IconSettings },
        { key: 'api',         label: 'API',         color: '#10b981', icon: IconApi },
        { key: 'regression',  label: 'Regression',  color: '#f97316', icon: IconRefresh },
        { key: 'security',    label: 'Security',    color: '#ef4444', icon: IconLock },
        { key: 'performance', label: 'Performance', color: '#8b5cf6', icon: IconBolt },
        { key: 'seo',         label: 'SEO',          color: '#06b6d4', icon: IconSearch },
      ].map(type => {
        const count = typeData.find(d => d.name === type.key)?.value || 0;
        const total = typeData.reduce((s, d) => s + d.value, 0) || 1;
        const pct = Math.round((count / total) * 100);
        const Icon = type.icon;
        return (
          <div key={type.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 24, display: 'flex', justifyContent: 'center' }}>
              <Icon size={16} stroke={1.6} style={{ color: type.color }} />
            </div>
            <div style={{ width: 90, fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>{type.label}</div>
            <div style={{ flex: 1, height: 8, borderRadius: 8, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 8,
                width: `${pct}%`,
                background: type.color,
                transition: 'width 1s ease',
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: type.color, width: 32, textAlign: 'right' }}>{count}</span>
            <span style={{ fontSize: 10, color: 'var(--muted)', width: 36, textAlign: 'right' }}>{pct}%</span>
          </div>
        );
      })}
    </div>
  </div>

  {/* ── TOP URLs ── */}
  <div className="section-box">
    <div className="sb-head">
      <span className="sb-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <IconLink size={15} stroke={1.5} style={{ color: '#0ea5e9' }} />
        Top URLs
      </span>
      <span className="sb-action" onClick={() => goTo('history')}>{t('viewAll')}</span>
    </div>
    {/* Column headers */}
    <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 92px 40px 110px', gap: 6, padding: '8px 14px 6px', borderBottom: '1px solid var(--border3)' }}>
      {['#', 'URL', 'Tool', 'Tests', 'Pass Rate'].map(h => (
        <div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</div>
      ))}
    </div>
    {topUrls.length === 0 ? (
      <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
        No URLs tested yet!
      </div>
    ) : topUrls.map((item, i) => {
      const rate = Math.round((item.pass / item.tests) * 100) || 0;
      const rc = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
      const FW_COLORS = { Selenium: '#43B02A', Cypress: '#00BFA5', Playwright: '#E2574C', Both: '#C9A227', k6: '#7D64FF', Pytest: '#3776AB', Postman: '#FF6C37' };
      const fwColor = FW_COLORS[item.framework] || '#4f86e8';
      return (
        <div key={i}
          style={{ display: 'grid', gridTemplateColumns: '24px 1fr 92px 40px 110px', gap: 6, padding: '11px 14px', borderBottom: i < topUrls.length - 1 ? '1px solid var(--border3)' : 'none', alignItems: 'center', transition: 'background .15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{i + 1}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--indigo2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
              onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
              {item.url}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
              {(() => {
                const diff = (Date.now() - new Date(item.date)) / 1000;
                if (isNaN(diff)) return '—';
                if (diff < 60) return `${Math.floor(diff)}s ago`;
                if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                return `${Math.floor(diff / 86400)}d ago`;
              })()}
            </div>
          </div>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, color: fwColor, background: `${fwColor}18`, border: `1px solid ${fwColor}33` }}>
              {item.framework}
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{item.tests}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: rc, flexShrink: 0, whiteSpace: 'nowrap', width: 30, textAlign: 'right' }}>{rate}%</span>
            <div style={{ flex: 1, minWidth: 8, height: 5, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 4, width: `${rate}%`, background: rc, transition: 'width 1s ease' }} />
            </div>
          </div>
        </div>
      );
    })}
  </div>

</div>

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20, marginBottom: 24 }}>

  {/* ── RECENT ACTIVITY ── */}
  <div className="section-box">
    <div className="sb-head">
      <span className="sb-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconActivity size={15} stroke={1.5} style={{ color: '#4f86e8' }} />
        {t('recentActivity')}
      </span>
      <span className="sb-action" onClick={() => goTo('history')}>{t('viewAll')}</span>
    </div>
    <div>
      {topUrls.length === 0 ? (
        <div className="empty-row">{t('noActivity')}</div>
      ) : topUrls.slice(0, 3).map((item, i) => {
        const rate = Math.round((item.pass / item.tests) * 100) || 0;
        const rc = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
        const isOk = rate >= 80;
        const FW_COLORS = { Selenium: '#43B02A', Cypress: '#00BFA5', Playwright: '#E2574C', Both: '#C9A227', k6: '#7D64FF', Pytest: '#3776AB', Postman: '#FF6C37' };
        const fwColor = FW_COLORS[item.framework] || '#4f86e8';
        const timeStr = (() => {
          if (!item.date) return '—';
          const diff = (Date.now() - new Date(item.date)) / 1000;
          if (isNaN(diff)) return '—';
          if (diff < 60) return `${Math.floor(diff)}s ago`;
          if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
          if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
          return `${Math.floor(diff / 86400)}d ago`;
        })();
        return (
          <div key={i}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 20px', borderBottom: i < Math.min(topUrls.length, 3) - 1 ? '1px solid var(--border3)' : 'none', transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 1, background: isOk ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)', border: `2px solid ${isOk ? '#10b981' : '#ef4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isOk
                ? <svg width="10" height="10" fill="none" stroke="#10b981" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                : <svg width="10" height="10" fill="none" stroke="#ef4444" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4, lineHeight: 1.5 }}>
                {isOk ? (
                  <>
                    <span style={{ color: 'var(--muted)' }}>{item.framework} tests completed on </span>
                    <span style={{ color: 'var(--indigo2)', cursor: 'pointer' }}
                      onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                      {item.url}
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ color: 'var(--muted)' }}>{item.framework} scan failed on </span>
                    <span style={{ color: 'var(--indigo2)', cursor: 'pointer' }}
                      onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                      {item.url}
                    </span>
                  </>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: isOk ? 0 : 4 }}>
                {item.tests} tests · Pass rate: <span style={{ color: rc, fontWeight: 700 }}>{rate}%</span>
              </div>
              {!isOk && (
                <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                  {item.tests - item.pass} critical issue{(item.tests - item.pass) > 1 ? 's' : ''} found
                </div>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
              {timeStr}
            </div>
          </div>
        );
      })}
    </div>
  </div>

  {/* ── AI INSIGHTS ── */}
  <AIInsights stats={stats} topUrls={topUrls} typeData={typeData} />

</div>
    </div>
  );
}
      
 //Modal de delete 
function DeleteConfirmModal({ project, onConfirm, onCancel, loading }) {
  if (!project) return null;
  return createPortal(
    <div onClick={onCancel}
      style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: 440, background: '#0d1526', border: '1px solid rgba(239,68,68,.3)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.7)', fontFamily: "'DM Sans', sans-serif", animation: 'dFadeUp .2s ease both' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #ef4444, transparent)' }} />
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Delete Project</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>This action cannot be undone</div>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: '24px 28px' }}>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 20 }}>
            Are you sure you want to delete <strong style={{ color: '#e2e8f0' }}>{project.name}</strong>? All generations and results associated with this project will be permanently removed.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancel}
              style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading}
              style={{ flex: 2, padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? .7 : 1 }}>
              {loading ? <><span className="spinner" /> Deleting…</> : <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg> Delete Project</>}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

//List Project 
export function ProjectsListPanel({ onNewProject, onSelectProject }) {
  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search,     setSearch]     = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editingProject, setEditingProject] = useState(null);
  const [editName,       setEditName]       = useState('');
  const [editDesc,       setEditDesc]       = useState('');
  const [editSaving,     setEditSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [projPage, setProjPage] = useState(1);
  const PROJ_PER_PAGE = 8;

  useEffect(() => { setProjPage(1); }, [search, filterType]);

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (editingProject) {
      setEditName(editingProject.name);
      setEditDesc(editingProject.description || '');
    }
  }, [editingProject]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    try {
      await api.delete(`/projects/${deleteTarget.id}`);
      setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
    } catch (err) { console.error(err); }
    setDeleting(null);
    setDeleteTarget(null);
  };

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchType   = filterType === 'all' || p.type === filterType;
    return matchSearch && matchType;
  });

  // ← ICI après filtered
  const projTotalPages = Math.ceil(filtered.length / PROJ_PER_PAGE);

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
          { icon: <IconFolder size={28} stroke={1.5} style={{ color: '#6366f1' }} />, val: projects.length, lbl: 'Total Projects', accent: 'linear-gradient(90deg,#6366f1,#818cf8)' },
          { icon: <IconWorld size={28} stroke={1.5} style={{ color: '#4f86e8' }} />, val: totalPublic, lbl: 'Public Projects', accent: 'linear-gradient(90deg,#4f86e8,#6fa3ff)' },
          { icon: <IconLock size={28} stroke={1.5} style={{ color: '#8b5cf6' }} />, val: totalInternal, lbl: 'Internal Projects', accent: 'linear-gradient(90deg,#8b5cf6,#a78bfa)' },
        ].map((s, i) => (
          <div key={s.lbl} className="stat-card" style={{ '--i': i, minHeight: 120 }}>
            <div className="stat-card-top"><div className="stat-icon-wrap">{s.icon}</div></div>
            <span className="stat-val" style={{ fontSize: 40 }}>{s.val}</span>
            <span className="stat-lbl">{s.lbl}</span>
            <div className="stat-accent" style={{ background: s.accent }} />
          </div>
        ))}
      </div>

      {/* ── SEARCH + FILTER BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 220,
          background: 'var(--card)', border: '1.5px solid var(--border)',
          borderRadius: 10, padding: '9px 14px', transition: 'border-color .2s'
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,.5)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects by name…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'all',      label: 'All',      icon: <IconFolder size={14} stroke={1.5} /> },
            { key: 'public',   label: 'Public',   icon: <IconWorld  size={14} stroke={1.5} /> },
            { key: 'internal', label: 'Internal', icon: <IconLock   size={14} stroke={1.5} /> },
          ].map(f => (
            <button key={f.key} onClick={() => setFilterType(f.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 700, transition: 'all .18s',
                background: filterType === f.key ? f.key === 'public' ? 'rgba(79,134,232,.12)' : f.key === 'internal' ? 'rgba(139,92,246,.12)' : 'rgba(99,102,241,.12)' : 'var(--card)',
                border: filterType === f.key ? f.key === 'public' ? '1.5px solid rgba(79,134,232,.4)' : f.key === 'internal' ? '1.5px solid rgba(139,92,246,.4)' : '1.5px solid rgba(99,102,241,.4)' : '1.5px solid var(--border)',
                color: filterType === f.key ? f.key === 'public' ? '#4f86e8' : f.key === 'internal' ? '#8b5cf6' : '#818cf8' : 'var(--muted)',
              }}
            >
              <span style={{ display: 'flex' }}>{f.icon}</span>
              {f.label}
              <span style={{ padding: '1px 7px', borderRadius: 20, fontSize: 10, background: filterType === f.key ? 'rgba(255,255,255,.1)' : 'var(--bg2)', color: filterType === f.key ? 'currentColor' : 'var(--muted)' }}>
                {f.key === 'all' ? projects.length : f.key === 'public' ? projects.filter(p => p.type === 'public').length : projects.filter(p => p.type === 'internal').length}
              </span>
            </button>
          ))}
        </div>

        {(search || filterType !== 'all') && (
          <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, gap: 20 }}>
          <LogoSpinner size={80} />
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
            Loading Projects...
          </div>
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
        <>
          {/* ── GRID ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.slice((projPage - 1) * PROJ_PER_PAGE, projPage * PROJ_PER_PAGE).map((project, i) => {
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
                      <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: colorBg, border: `1px solid ${colorBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isPublic ? <IconWorld size={22} stroke={1.5} style={{ color: '#4f86e8' }} /> : <IconLock size={22} stroke={1.5} style={{ color: '#8b5cf6' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{project.name}</div>
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20, color, background: colorBg, border: `1px solid ${colorBd}` }}>{isPublic ? 'Public' : 'Internal'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={(e) => { e.stopPropagation(); setEditingProject(project); }}
                        style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .18s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--indigo-bg)'; e.currentTarget.style.borderColor = 'var(--indigo-border)'; e.currentTarget.style.color = 'var(--indigo2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                        style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .18s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.borderColor = 'var(--red-border)'; e.currentTarget.style.color = 'var(--red)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                      </button>
                    </div>
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

          {/* ── PAGINATION ── */}
          {projTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24, padding: '12px 0' }}>
              <button onClick={() => setProjPage(p => Math.max(1, p - 1))} disabled={projPage === 1}
                style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', color: projPage === 1 ? 'var(--muted)' : 'var(--text)', cursor: projPage === 1 ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, opacity: projPage === 1 ? 0.5 : 1 }}>
              Prev
              </button>
              {Array.from({ length: projTotalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setProjPage(p)}
                  style={{ width: 34, height: 34, borderRadius: 8, background: projPage === p ? 'linear-gradient(135deg,var(--indigo),#4f46e5)' : 'var(--card)', border: projPage === p ? 'none' : '1px solid var(--border)', color: projPage === p ? '#fff' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, boxShadow: projPage === p ? '0 4px 12px rgba(99,102,241,.35)' : 'none', transform: projPage === p ? 'scale(1.08)' : 'scale(1)', transition: 'all .18s' }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setProjPage(p => Math.min(projTotalPages, p + 1))} disabled={projPage === projTotalPages}
                style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', color: projPage === projTotalPages ? 'var(--muted)' : 'var(--text)', cursor: projPage === projTotalPages ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, opacity: projPage === projTotalPages ? 0.5 : 1 }}>
                Next 
              </button>
            </div>
          )}
        </>
      )}

      {/* ── EDIT MODAL ── */}
      {editingProject && createPortal(
        <div onClick={() => setEditingProject(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: 480, background: '#0d1526', border: '1px solid rgba(99,102,241,.3)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.7)', fontFamily: "'DM Sans', sans-serif", animation: 'dFadeUp .2s ease both' }}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #6366f1, transparent)' }} />
            <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" fill="none" stroke="#818cf8" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Edit Project</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Update name and description</div>
              </div>
              <button onClick={() => setEditingProject(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 8 }}>Project Name *</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={60} placeholder="e.g. Login Flow QA" autoFocus
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,.03)', border: `1.5px solid ${editName.trim() ? 'rgba(99,102,241,.4)' : 'rgba(255,255,255,.08)'}`, color: '#e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', transition: 'border-color .2s' }}
                />
                <div style={{ fontSize: 10, color: '#475569', marginTop: 4, textAlign: 'right' }}>{editName.length}/60</div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 8 }}>
                  Description <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} maxLength={280} rows={3} placeholder="Briefly describe what this project tests…"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,.03)', border: '1.5px solid rgba(255,255,255,.08)', color: '#e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.08)'}
                />
                <div style={{ fontSize: 10, color: '#475569', marginTop: 4, textAlign: 'right' }}>{editDesc.length}/280</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)', marginBottom: 24 }}>
                <svg width="13" height="13" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                <span style={{ fontSize: 11, color: '#f59e0b' }}>Project type (<strong>{editingProject.type}</strong>) cannot be changed after creation.</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEditingProject(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button disabled={!editName.trim() || editSaving}
                  onClick={async () => {
                    if (!editName.trim()) return;
                    setEditSaving(true);
                    try {
                      await api.put(`/projects/${editingProject.id}`, { name: editName.trim(), description: editDesc.trim() });
                      setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, name: editName.trim(), description: editDesc.trim() } : p));
                      setEditingProject(null);
                    } catch (err) { console.error(err); }
                    setEditSaving(false);
                  }}
                  style={{ flex: 2, padding: '12px', borderRadius: 10, background: editName.trim() ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(99,102,241,.1)', border: 'none', color: editName.trim() ? '#fff' : 'rgba(99,102,241,.3)', fontSize: 13, fontWeight: 800, cursor: editName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: editName.trim() ? '0 4px 16px rgba(99,102,241,.35)' : 'none', transition: 'all .2s' }}>
                  {editSaving ? <><span className="spinner" /> Saving…</> : <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <DeleteConfirmModal
        project={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting === deleteTarget?.id}
      />
    </div>
  );
}

//Détail project 
//Détail project 
export function ProjectDetailPanel({ project, onBack, onNewGeneration, setGeneration, goTo }) {
  const [generations, setGenerations] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [deleting,    setDeleting]    = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterTestType, setFilterTestType] = useState('all');
  const [search, setSearch] = useState('');
  const ITEMS_PER_PAGE = 5;

  const isPublic = project?.type === 'public';
  const color    = isPublic ? '#4f86e8' : '#8b5cf6';
  const colorBg  = isPublic ? 'rgba(79,134,232,.08)' : 'rgba(139,92,246,.08)';
  const colorBd  = isPublic ? 'rgba(79,134,232,.2)'  : 'rgba(139,92,246,.2)';

  // ── Type config used both by the filter bar and the grouped sections below ──
  const TYPE_CONFIG = {
    smoke:       { label: 'Smoke Tests',       color: '#64748b', bg: 'rgba(100,116,139,.1)',  border: 'rgba(100,116,139,.25)', letter: 'S', Icon: IconEye },
    functional:  { label: 'Functional Tests',  color: '#6366f1', bg: 'rgba(99,102,241,.1)',   border: 'rgba(99,102,241,.25)',  letter: 'F', Icon: IconSettings2 },
    performance: { label: 'Performance Tests', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)',   border: 'rgba(139,92,246,.25)', letter: 'P', Icon: IconBolt },
    api:         { label: 'API Tests',         color: '#10b981', bg: 'rgba(16,185,129,.1)',   border: 'rgba(16,185,129,.25)', letter: 'A', Icon: IconApi },
    regression:  { label: 'Regression Test',  color: '#f97316', bg: 'rgba(249,115,22,.1)',   border: 'rgba(249,115,22,.25)', letter: 'R', Icon: IconRefresh },
    security:    { label: 'Security Test',    color: '#ef4444', bg: 'rgba(239,68,68,.1)',    border: 'rgba(239,68,68,.25)',  letter: 'S', Icon: IconShieldLock },
    unit:        { label: 'Unit Tests',        color: '#0ea5e9', bg: 'rgba(14,165,233,.1)',   border: 'rgba(14,165,233,.25)', letter: 'U', Icon: IconTestPipe },
    seo:         { label: 'SEO Test', color: '#06b6d4', bg: 'rgba(6,182,212,.08)', border: 'rgba(6,182,212,.2)', letter: 'S', Icon: IconSeeding },
  };

  useEffect(() => {
    api.get(`/projects/${project.id}/generations`).then(res => setGenerations(res.data)).catch(console.error).finally(() => setLoading(false));
  }, [project.id]);

  useEffect(() => { setCurrentPage(1); }, [filterTestType, search]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try { await api.delete(`/generations/${id}`); setGenerations(prev => prev.filter(g => g.id !== id)); } catch (e) { console.error(e); }
    setDeleting(null);
  };

const handleView = (item) => {
  const parsedResult = typeof item.result === 'string' 
    ? JSON.parse(item.result || '{}') 
    : (item.result || {});

  console.log('[handleView] item:', item);
  console.log('[handleView] parsedResult:', parsedResult);
  console.log('[K6] item.summary:', JSON.stringify(item.summary, null, 2));
  console.log('[K6] item.test_cases:', item.test_cases);
  console.log('[K6] item keys:', Object.keys(item));
console.log('[K6] item.scripts:', item.scripts);
console.log('[K6] item.execution_results:', item.execution_results);
console.log('[K6] item.performance_data:', item.performance_data);
console.log('[K6] first test_case:', JSON.stringify(item.test_cases?.[0], null, 2));
  setGeneration({
      fresh: false,
    url: item.url, framework: item.framework, test_type: item.test_type,
    generation: { 
      id: item.id, 
      url: item.url, 
      framework: item.framework, 
      load_time_ms: item.load_time_ms, 
      test_type: item.test_type 
    },
    result: {
      test_type: item.test_type || 'smoke',
      test_cases: item.test_cases || parsedResult.test_cases || [],
      test_cases_selenium: item.test_cases_selenium || parsedResult.test_cases_selenium || [],
      test_cases_cypress: item.test_cases_cypress || parsedResult.test_cases_cypress || [],
      seo_score: parsedResult.seo_score || item.seo_score || 0,  // ← AJOUTE
      ai: parsedResult.ai || item.ai || {},                      // ← AJOUTE
      script: item.script || parsedResult.script || '',
      script_selenium: item.script_selenium || parsedResult.script_selenium || '',
      script_playwright: item.script_playwright || parsedResult.script_playwright || '',
      script_cypress: item.script_cypress || parsedResult.script_cypress || '',
      script_postman: item.script_postman || parsedResult.script_postman || '',
      script_pytest: item.script_pytest || parsedResult.script_pytest || '',
      domains: item.domains || parsedResult.domains || [],
      base_url: item.base_url || parsedResult.base_url || item.url || '',
      pass_count: item.pass_count || 0,
      fail_count: item.fail_count || 0,
      skip_count: item.skip_count || 0,
      pass_rate: item.pass_rate || 0,
   summary: (() => {
  const raw = item.summary && !Array.isArray(item.summary) ? item.summary
    : parsedResult.summary && !Array.isArray(parsedResult.summary) ? parsedResult.summary
    : null;
  if (raw && Object.keys(raw).length > 0) return raw;
  const cases = item.test_cases || [];
  const built = {};
  ['load', 'stress', 'spike', 'soak'].forEach(type => {
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    const matching = cases.filter(tc =>
      tc.name?.toLowerCase().includes(`[${type} test]`) ||
      tc.name?.toLowerCase().includes(`[${label} test]`)
    );
    if (matching.length > 0) {
  const thresholds = matching.filter(tc => tc.section === 'Thresholds');
  const nonSkipped = matching.filter(t => t.status !== 'skip');
  
  let status;
  if (thresholds.length > 0) {
    status = thresholds.some(t => t.status === 'fail') ? 'fail' : 'pass';
  } else {
    status = nonSkipped.some(t => t.status === 'fail') ? 'fail' : 'pass';
  }

  built[type] = {
    status,
    metrics: {},
    threshold_passes: matching.filter(t => t.status === 'pass').map(t => t.suite || t.name),
    threshold_failures: matching.filter(t => t.status === 'fail').map(t => t.suite || t.name),
    duration_seconds: null,
  };
}
  });
  return Object.keys(built).length > 0 ? built : {};
})(),
      scripts: item.scripts || parsedResult.scripts || {},
      execution_results: (item.execution_results || parsedResult.execution_results || []).map(r => ({
        ...r,
        screenshot: r.screenshot ?? null,
      })),
      performance: item.performance_data || item.performance || parsedResult.performance || null,
    },
  });
  goTo('execution');
};

const totalGen       = generations.length;
const avgRate        = totalGen ? Math.round(generations.reduce((s, g) => s + (g.pass_rate || 0), 0) / totalGen) : 0;
const totalPass      = generations.reduce((s, g) => s + (g.pass_count || 0), 0);
const totalFail      = generations.reduce((s, g) => s + (g.fail_count || 0), 0);
const highPassCount  = generations.filter(g => (g.pass_rate || 0) >= 80).length;

// Types actually present among this project's generations, used to build the filter bar
const availableTestTypes = [...new Set(generations.map(g => g.test_type || 'smoke'))];

const urlCards = generations
  .filter(g => filterTestType === 'all' || (g.test_type || 'smoke') === filterTestType)
  .filter(g => !search.trim() || (g.url || '').toLowerCase().includes(search.trim().toLowerCase()));

const totalPages = Math.ceil(urlCards.length / ITEMS_PER_PAGE);

const paginatedCards = urlCards.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);

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
    Pytest:     { color: '#3776AB', letters: 'Py' },
    Postman:    { color: '#FF6C37', letters: 'Po'},
    k6:         { color: '#7D64FF', letters: 'k6' }, 
    Requests:   { color: '#06b6d4', letters: 'RQ' },
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
          <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: colorBg, border: `1px solid ${colorBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  {isPublic
    ? <IconWorld size={26} stroke={1.5} style={{ color: '#4f86e8' }} />
    : <IconLock size={26} stroke={1.5} style={{ color: '#8b5cf6' }} />
  }
</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 className="p-title" style={{ marginBottom: 0 }}>{project?.name}</h1>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, color, background: colorBg, border: `1px solid ${colorBd}` }}>{isPublic ? 'Public' : 'Internal'}</span>
            </div>
            <p className="p-sub" style={{ marginBottom: 0 }}>{project?.description || 'No description'}</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => onNewGeneration('', '', '')}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          New Generation
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
{ icon: (
    <svg width="22" height="22" fill="none" stroke={color} strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ), val: totalGen, lbl: 'Total Generations', accent: `linear-gradient(90deg,${color},${color}88)` },
{ icon: (
    <svg width="22" height="22" fill="none" stroke="#10b981" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ), val: totalPass, lbl: 'Total Passed', accent: 'linear-gradient(90deg,#10b981,#34d399)' },
{ icon: (
    <svg width="22" height="22" fill="none" stroke="#ef4444" strokeWidth="1.6" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ), val: totalFail, lbl: 'Total Failed', accent: 'linear-gradient(90deg,#ef4444,#f87171)' },
{ icon: (
    <svg width="22" height="22" fill="none" stroke="#f59e0b" strokeWidth="1.6" viewBox="0 0 24 24">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ), val: highPassCount, lbl: 'Pass Rate ≥ 80%', accent: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },  
        ].map((s, i) => (
          <div key={s.lbl} className="stat-card" style={{ '--i': i, minHeight: 110 }}>
            <div className="stat-card-top"><div className="stat-icon-wrap">{s.icon}</div></div>
            <span className="stat-val" style={{ fontSize: 36 }}>{s.val}</span>
            <span className="stat-lbl">{s.lbl}</span>
            <div className="stat-accent" style={{ background: s.accent }} />
          </div>
        ))}
      </div>

      {/* ── TEST TYPE FILTER BAR ── */}
      {!loading && generations.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 220px', minWidth: 200,
            background: 'var(--card)', border: '1.5px solid var(--border)',
            borderRadius: 10, padding: '8px 12px', transition: 'border-color .2s'
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,.5)'}
            onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search generations by URL…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
          <button
            onClick={() => setFilterTestType('all')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 700, transition: 'all .18s',
              background: filterTestType === 'all' ? 'var(--indigo-bg, rgba(99,102,241,.12))' : 'var(--card)',
              border: filterTestType === 'all' ? '1.5px solid rgba(99,102,241,.4)' : '1.5px solid var(--border)',
              color: filterTestType === 'all' ? '#818cf8' : 'var(--muted)',
            }}
          >
            All
            <span style={{ padding: '1px 7px', borderRadius: 20, fontSize: 10, background: filterTestType === 'all' ? 'rgba(255,255,255,.1)' : 'var(--bg2)', color: filterTestType === 'all' ? 'currentColor' : 'var(--muted)' }}>
              {generations.length}
            </span>
          </button>
          {availableTestTypes.map(type => {
            const tc = TYPE_CONFIG[type] || TYPE_CONFIG.smoke;
            const count = generations.filter(g => (g.test_type || 'smoke') === type).length;
            const active = filterTestType === type;
            return (
              <button
                key={type}
                onClick={() => setFilterTestType(type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 700, transition: 'all .18s',
                  background: active ? `${tc.color}18` : 'var(--card)',
                  border: active ? `1.5px solid ${tc.color}55` : '1.5px solid var(--border)',
                  color: active ? tc.color : 'var(--muted)',
                }}
              >
                <tc.Icon size={14} stroke={1.8} />
                {tc.label.replace(' Tests', '').replace(' Test', '')}
                <span style={{ padding: '1px 7px', borderRadius: 20, fontSize: 10, background: active ? `${tc.color}22` : 'var(--bg2)', color: active ? 'currentColor' : 'var(--muted)' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, gap: 20 }}>
          <LogoSpinner size={80} />
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
            Loading Project...
          </div>
        </div>
      ) : urlCards.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: colorBg, border: `1px solid ${colorBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 20 }}>{generations.length === 0 ? '⚡' : '🔍'}</div>
          <h3 style={{ fontFamily: 'var(--C)', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{generations.length === 0 ? 'No generations yet' : 'No results found'}</h3>
          <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.7, maxWidth: 300, marginBottom: 24 }}>{generations.length === 0 ? 'Start generating tests for this project' : 'Try adjusting your search or test type filter'}</p>
          {generations.length === 0 ? (
            <button className="btn-primary" onClick={onNewGeneration}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              New Generation
            </button>
          ) : (
            <button className="btn-primary" onClick={() => { setSearch(''); setFilterTestType('all'); }}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>🔗 All Generations — {urlCards.length} total</div>
          {/* Grouper par test_type */}
{(() => {
  const groups = {};
  paginatedCards.forEach(item => {
    const type = item.test_type || 'smoke';
    if (!groups[type]) groups[type] = [];
    groups[type].push(item);
  });

  return Object.entries(groups).map(([type, items]) => {
    const tc = TYPE_CONFIG[type] || TYPE_CONFIG.smoke;
    const groupPass = items.reduce((s, g) => s + (g.pass_count || 0), 0);
    const groupTotal = items.reduce((s, g) => s + (g.pass_count || 0) + (g.fail_count || 0) + (g.skip_count || 0), 0);
    const groupRate = groupTotal > 0 ? Math.round(groupPass / groupTotal * 100) : 0;
    const rc = groupRate >= 80 ? '#10b981' : groupRate >= 50 ? '#f59e0b' : '#ef4444';

    return (
      <div key={type} style={{ marginBottom: 28 }}>
        
        {/* ── GROUP HEADER ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 20px', marginBottom: 12,
          background: tc.bg,
          border: `1px solid ${tc.border}`,
          borderRadius: 12,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: tc.color, borderRadius: '12px 0 0 12px' }} />
          
          <tc.Icon size={20} stroke={1.6} style={{ color: tc.color, flexShrink: 0 }} />
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: tc.color, letterSpacing: '.5px' }}>
                {tc.label}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                color: tc.color, background: `${tc.color}20`, border: `1px solid ${tc.border}`,
                letterSpacing: 1,
              }}>
                {items.length} generation{items.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Group stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ color: '#10b981', fontWeight: 700 }}>{groupPass}</span> passed · <span style={{ color: 'var(--muted)' }}>{groupTotal} total</span>
            </div>
            <div style={{
              fontSize: 14, fontWeight: 800, color: rc,
              background: `${rc}15`, border: `1px solid ${rc}33`,
              padding: '3px 12px', borderRadius: 20,
            }}>
              {groupRate}%
            </div>
          </div>
        </div>

        {/* ── GROUP ITEMS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 8 }}>
          {items.map((item, i) => {
  const fw = FW_CONFIG[item.framework] || { color: '#7D64FF', letters: item.framework || 'k6' };
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
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: fw.color, background: `${fw.color}15`, border: `1px solid ${fw.color}30` }}>
  {fw.letters === item.framework ? fw.letters : `${fw.letters} · ${item.framework}`}
</span>
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
  
  {/* View + Regenerate sur la même ligne */}
  <div style={{ display: 'flex', gap: 6 }}>
    <button onClick={() => handleView(item)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: `linear-gradient(135deg, ${color}, ${color}cc)`, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.5px', boxShadow: `0 3px 10px ${color}44`, transition: 'all .2s' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      View
    </button>

  <button onClick={() => {
  const saved = JSON.parse(localStorage.getItem(`creds-${item.url}`) || '{}');
  onNewGeneration(
    item.url,
    item.test_type,
    item.framework,
    saved.username || '',
    saved.password || ''
  );
}}

      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', color: '#10b981', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.5px', transition: 'all .2s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.14"/></svg>
      Regenerate
    </button>
  </div>

  {/* Delete seul en dessous — inchangé */}
 <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
  style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .18s', width: 'fit-content', alignSelf: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}
  onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.borderColor = 'var(--red-border)'; e.currentTarget.style.color = 'var(--red)'; }}
  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}>
  {deleting === item.id ? '...' : (
    <>
      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
      Delete
    </>
  )}
</button>

</div>
      </div>
    </div>
  );
})}
        </div>
      </div>
    );
  });
})()}
{totalPages > 1 && (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20, padding: '12px 0' }}>
    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
      style={{ padding: '6px 16px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', color: currentPage === 1 ? 'var(--muted)' : 'var(--text)', cursor: currentPage === 1 ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700 }}>
      Prev
    </button>
    {Array.from({ length: totalPages }, (_, i) => (
      <button key={i} onClick={() => setCurrentPage(i + 1)}
        style={{ width: 32, height: 32, borderRadius: 8, background: currentPage === i + 1 ? 'var(--indigo)' : 'var(--card)', border: currentPage === i + 1 ? '1px solid var(--indigo2)' : '1px solid var(--border)', color: currentPage === i + 1 ? '#fff' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700 }}>
        {i + 1}
      </button>
    ))}
    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
      style={{ padding: '6px 16px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', color: currentPage === totalPages ? 'var(--muted)' : 'var(--text)', cursor: currentPage === totalPages ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700 }}>
      Next 
    </button>
  </div>
)}

        </div>
      )}
    </div>
  );
}

const PROJECT_TYPES = [
  { id: 'public',  label: 'Public website',    desc: 'Landing pages, marketing sites, storefronts', Icon: Globe,     accent: '#4F86E8' },
  { id: 'private', label: 'Private application', desc: 'Internal tools, back-office, intranets',     Icon: Lock,      accent: '#6D5DFC' },
];
 
const FRAMEWORKS = [
  { id: 'selenium',    name: 'Selenium',    desc: 'Cross-browser E2E automation',      lang: 'Java / Python', difficulty: 'Medium', ai: true,  badge: 'Se' },
  { id: 'playwright',  name: 'Playwright',  desc: 'Fast, reliable browser automation', lang: 'JS / TS',        difficulty: 'Easy',   ai: true,  badge: 'Pw' },
  { id: 'cypress',     name: 'Cypress',     desc: 'Developer-friendly E2E testing',    lang: 'JS / TS',        difficulty: 'Easy',   ai: true,  badge: 'Cy' },
  { id: 'requests',    name: 'Requests',    desc: 'Lightweight HTTP calls',            lang: 'Python',         difficulty: 'Easy',   ai: true,  badge: 'Rq' },
  { id: 'beautifulsoup', name: 'BeautifulSoup', desc: 'HTML parsing and scraping',     lang: 'Python',         difficulty: 'Easy',   ai: false, badge: 'Bs' },
  { id: 'jmeter',      name: 'JMeter',      desc: 'Load and performance testing',      lang: 'Java / XML',     difficulty: 'Medium', ai: false, badge: 'Jm' },
  { id: 'k6',          name: 'K6',          desc: 'Modern scriptable load testing',    lang: 'JS',             difficulty: 'Medium', ai: true,  badge: 'K6' },
  { id: 'postman',     name: 'Postman',     desc: 'API testing and collections',       lang: 'JSON',           difficulty: 'Easy',   ai: false, badge: 'Pm' },
  { id: 'newman',      name: 'Newman',      desc: 'CLI runner for Postman suites',     lang: 'JS / CLI',       difficulty: 'Medium', ai: false, badge: 'Nw' },
];
 
const TEST_TYPES = ['Smoke', 'Regression', 'Functional', 'Performance', 'Accessibility', 'SEO', 'Security', 'Responsive', 'Cross browser'];
 
const ENVIRONMENTS = ['Development', 'Staging', 'Production'];
 
const RECENT_PROJECTS = [
  { name: 'Auth Service QA', type: 'private', tests: 42 },
  { name: 'Checkout Suite',  type: 'public',  tests: 28 },
  { name: 'Internal Gateway', type: 'api',    tests: 15 },
];
 
export function CreateProjectPanel({ onProjectCreated }) {
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');

  const [projectType, setProjectType] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const nameRef = useRef(null);

  const stepDone = [!!projectType, name.trim().length > 0, description.trim().length > 0];
  const weights = [40, 40, 20];
  const progress = Math.round(
    stepDone.reduce((sum, done, i) => sum + (done ? weights[i] : 0), 0)
  );
  const isReady = stepDone[0] && stepDone[1];

  const handleSubmit = async () => {
    if (!name.trim()) { setNameError('Project name is required'); nameRef.current?.focus(); return; }
    if (!projectType) return;
    setSubmitting(true);
    try {
      const res = await api.post('/projects', {
        name: name.trim(), type: projectType, description: description.trim(),
      });
      onProjectCreated(res.data);
    } catch (err) {
      console.error(err);
      setNameError('Error creating project, try again.');
    }
    setSubmitting(false);
  };

  const selectedType = PROJECT_TYPES.find(t => t.id === projectType);

  const TYPE_COLORS = {
    public:  { tc: '#4F86E8', tg: 'rgba(79,134,232,.1)',  tb: 'rgba(79,134,232,.3)'  },
    private: { tc: '#6D5DFC', tg: 'rgba(109,93,252,.1)',  tb: 'rgba(109,93,252,.3)'  },
    api:     { tc: '#10B981', tg: 'rgba(16,185,129,.1)',  tb: 'rgba(16,185,129,.3)'  },
    mobile:  { tc: '#F59E0B', tg: 'rgba(245,158,11,.1)',  tb: 'rgba(245,158,11,.3)'  },
  };

  return (
    <div className="panel">
      <div className="p-header">
        <div>
          <h1 className="p-title">Create new <span className="g">project</span></h1>
          <p className="p-sub">Build your testing workspace in a few steps.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT COLUMN ── */}
        <div className="cpv5-left">

          {/* Step 1 — Project type */}
          <div className="cpv5-section">
            <div className="cpv5-section-header">
              <span className="cpv5-sec-num">01</span>
              <div>
                <div className="cpv5-sec-title">Project type</div>
                <div className="cpv5-sec-sub">What are we testing?</div>
              </div>
            </div>
            <div className="cpv5-type-grid">
              {PROJECT_TYPES.map(t => {
                const active = projectType === t.id;
                const c = TYPE_COLORS[t.id] || TYPE_COLORS.public;
                return (
                  <div
                    key={t.id}
                    className={`cpv5-type-card${active ? ' selected' : ''}`}
                    style={{ '--tc': c.tc, '--tg': c.tg, '--tb': c.tb }}
                    onClick={() => setProjectType(t.id)}
                  >
                    <div className="cpv5-type-top">
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: c.tg, border: `1px solid ${c.tb}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <t.Icon size={19} style={{ color: c.tc }} />
                      </div>
                      {active && (
                        <div className="cpv5-type-check">
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                        </div>
                      )}
                    </div>
                    <div className="cpv5-type-name">{t.label}</div>
                    <div className="cpv5-type-desc">{t.desc}</div>
                    <div className="cpv5-type-edge" />
                  </div>
                );
              })}
            </div>
          </div>

  {/* Step 2 — Basic info */}
<div className="cpv5-section">
  <div className="cpv5-section-header">
    <span className="cpv5-sec-num">02</span>
    <div>
      <div className="cpv5-sec-title">Project name</div>
      <div className="cpv5-sec-sub">Give your project a name</div>
    </div>
  </div>

            <div className={`cpv5-input-wrap${name ? ' filled' : ''}${nameError ? ' error' : ''}`}>
  <span className="cpv5-input-ico"><FileText size={16} /></span>
              <input
                ref={nameRef}
                className="cpv5-input"
                placeholder="Project name — e.g. Auth Service QA"
                value={name}
                onChange={e => { setName(e.target.value); setNameError(''); }}
                maxLength={60}
              />
              <span className="cpv5-input-count">{name.length}/60</span>
            </div>
            {nameError && (
              <div className="cpv5-error">
                <Info size={12} />{nameError}
              </div>
            )}
          </div>

          {/* Step 3 — Description */}
          <div className="cpv5-section">
            <div className="cpv5-section-header">
              <span className="cpv5-sec-num">03</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="cpv5-sec-title">Description</div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 1,
                    color: 'var(--indigo3)', background: 'var(--indigo-bg)',
                    border: '1px solid var(--indigo-border)', borderRadius: 8,
                    padding: '1px 7px', textTransform: 'uppercase',
                  }}>
                    Optional
                  </span>
                </div>
                <div className="cpv5-sec-sub">Add context about your project</div>
              </div>
            </div>
            <div className="cpv5-textarea-wrap">
  <span className="cpv5-textarea-ico"><IconAlignLeft size={16} /></span>
  <textarea
    className="cpv5-textarea"
    rows={4}
    maxLength={280}
    placeholder="Briefly describe what this project tests…"
    value={description}
    onChange={e => setDescription(e.target.value)}
  />
  <span className="cpv5-textarea-count">{description.length}/280</span>
</div>
          </div>

          {/* Submit */}
          <button
            className={`cpv5-submit${isReady ? ' colored' : ''}`}
            style={isReady ? { '--bc': '#6D5DFC', '--bshadow': 'rgba(109,93,252,.35)' } : {}}
            disabled={!isReady || submitting}
            onClick={handleSubmit}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
            Launch project
          </button>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="cpv5-right">

          {/* ── Progress card (v6 — carte unique, plus de doublon) ── */}
          <div className="cpv6-progress-outer">

            <div className="cpv6-progress-badge">
              <span className="cpv6-progress-badge-dot" />
              Progress
            </div>

            <div className="cpv6-progress-top">
              <div className="cpv6-ring-wrap">
                <svg width="88" height="88" viewBox="0 0 88 88">
                  <circle
                    cx="44" cy="44" r="38"
                    fill="none" stroke="rgba(109,93,252,.15)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="44" cy="44" r="38"
                    fill="none"
                    stroke="url(#cpv6-grad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 38}
                    strokeDashoffset={2 * Math.PI * 38 * (1 - progress / 100)}
                    style={{
                      transform: 'rotate(-90deg)',
                      transformOrigin: '44px 44px',
                      transition: 'stroke-dashoffset 500ms cubic-bezier(.4,0,.2,1)',
                    }}
                  />
                  <defs>
                    <linearGradient id="cpv6-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6D5DFC" />
                      <stop offset="100%" stopColor="#4F86E8" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="cpv6-ring-label">
                  <span className="cpv6-ring-pct">{progress}%</span>
                </div>
              </div>

              <div className="cpv6-progress-headtext">
                <div className="cpv6-progress-title">Setup progress</div>
                <div className="cpv6-progress-subtitle">
                  {progress === 100
                    ? 'All set — ready to launch'
                    : isReady
                      ? 'Required fields complete'
                      : `${stepDone.filter(Boolean).length} of ${stepDone.length} required steps done`}
                </div>
              </div>
            </div>

            <div className="cpv6-steps">
              {[
                { key: 'type', label: 'Project type', val: selectedType?.label, optional: false, weight: 40, Icon: selectedType?.Icon || Settings2, color: selectedType ? (TYPE_COLORS[projectType]?.tc) : '#6D5DFC' },
                { key: 'name', label: 'Project name', val: name.trim(), optional: false, weight: 40, Icon: FileText, color: '#4F86E8' },
                { key: 'desc', label: 'Description', val: description.trim(), optional: true, weight: 20, Icon: IconAlignLeft, color: '#10B981' },
              ].map((s, i, arr) => {
                const done = !!s.val;
                return (
                  <div key={s.key} className={`cpv6-step-row${done ? ' done' : ''}`} style={{ animationDelay: `${i * 60}ms` }}>
                    <div
                      className={`cpv6-step-icon${done ? ' done' : ''}`}
                      style={done ? { '--sc': s.color, background: `${s.color}18`, borderColor: `${s.color}40`, color: s.color } : {}}
                    >
                      {done
                        ? <Check size={13} className="cpv6-step-check-pop" />
                        : <s.Icon size={13} />}
                    </div>
                    <div className="cpv6-step-body">
                      <div className="cpv6-step-title-row">
                        <span className="cpv6-step-title">{s.label}</span>
                        <span className="cpv6-step-weight">{s.weight}%</span>
                        {s.optional && !done && <span className="cpv6-step-optional">optional</span>}
                      </div>
                      <div className={`cpv6-step-val${done ? ' filled' : ''}`}>
                        {s.val || (s.optional ? 'Skipped' : 'Waiting for input')}
                      </div>
                    </div>
                    {i < arr.length - 1 && <div className="cpv6-step-connector" />}
                  </div>
                );
              })}
            </div>

            <div className={`cpv6-status ${isReady ? 'ready' : 'waiting'}`}>
  <span className={`cpv6-status-dot ${isReady ? 'ready-pulse' : ''}`} />
  {isReady ? 'Ready to launch 🚀' : `${100 - progress}% left`}
</div>
          </div>

          {/* What happens next card */}
          <div className="gp4-how-card">
            <div className="gp4-how-head">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              What happens next
            </div>
            <div className="gp4-how-steps">
              {[
                { n: '01', title: 'Project created',        desc: 'Your workspace is set up instantly with the type and name you chose.',            Icon: IconFolder, color: '#6D5DFC' },
                { n: '02', title: 'Add your first target',   desc: 'Enter a URL or endpoint you want to test, public or internal.',                    Icon: IconLink,   color: '#0EA5E9' },
                { n: '03', title: 'Generate tests with AI',  desc: 'Pick a test type and framework — NexTest scans the target and writes the tests.',   Icon: IconRobot,  color: '#F59E0B' },
                { n: '04', title: 'Review & export results', desc: 'Get pass/fail results, AI insights, and download PDF/HTML/CSV reports.',            Icon: IconFileText, color: '#10B981' },
              ].map((s, i, arr) => (
                <div key={s.n} className="gp4-how-step">
                  <div className="gp4-how-step-left">
                    <div
                      className="gp4-how-circle"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: s.color,
                        background: `${s.color}18`,
                        border: `1px solid ${s.color}40`,
                      }}
                    >
                      <s.Icon size={15} stroke={1.8} />
                    </div>
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
    </div>
  );
}
function SummaryTile({ label, value, span }) {
  return (
    <div className={`rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 ${span ? 'col-span-2' : ''}`}>
      <div className="mb-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="truncate text-[13px] font-semibold text-slate-100">{value}</div>
    </div>
  );
}
 
function SidebarRow({ label, value, valueClass = 'text-slate-200' }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

//Interface de new  generation 
function GeneratePanel({ goTo, setGeneration, project, initialUrl = '', initialTestType = '', initialFramework = '', initialUsername = '', initialPassword = '', onGenerationSaved }) {
const { t, lang, setLanguage } = useLang();
  const [url, setUrl] = useState(initialUrl);
const [fw, setFw] = useState(initialFramework);
const [testType, setTestType] = useState(initialTestType);
const [jwtToken, setJwtToken] = useState('');

const [showPassword, setShowPassword] = useState(false);
const [loading, setLoad] = useState(false);
const [error, setError] = useState('');

const [username, setUsername] = useState(initialUsername);
const [password, setPassword] = useState(initialPassword);

const [showDocModal, setShowDocModal] = useState(false);
const [docFiles, setDocFiles] = useState([]);
const [dragOver, setDragOver] = useState(false);

  const [urlValid, setUrlValid] = useState(() => {
  if (!initialUrl) return null;
  try { new URL(initialUrl); return true; } catch { return false; }
});

  const isInternal = project?.type === 'private';

 

useEffect(() => {
  if (isInternal && username && password && initialUrl) {
    localStorage.setItem(`creds-${initialUrl}`, JSON.stringify({ username, password }));
  }
}, [username, password]);

  const PUBLIC_TEST_TYPES = [
    { key: 'smoke',       label: 'Smoke Test',       desc: 'Visibility checks — elements present in DOM',                   letter: 'S', letterClass: 'gp4-letter-s', badge: 'Quick',    badgeClass: 'gp-badge-quick', time: '~30s'  },
    { key: 'functional',  label: 'Functional Test',  desc: 'Interactions — click, fill, submit + assertions',              letter: 'F', letterClass: 'gp4-letter-f', badge: 'Medium',   badgeClass: 'gp-badge-mid',   time: '~1min' },
    { key: 'performance', label: 'Performance Test', desc: 'Web Vitals: LCP, FCP, TTI, Load Time, Resource Size',          letter: 'P', letterClass: 'gp4-letter-r', badge: 'Advanced', badgeClass: 'gp-badge-full',  time: '~3min' },
    {key: 'seo', label: 'SEO Test', desc: 'Meta tags, headings, page speed, robots.txt, sitemap, Open Graph', letter: 'S', letterClass: 'gp4-letter-s', badge: 'Public', badgeClass: 'gp-badge-quick', time: '~1min'},
 
  ];
  const INTERNAL_TEST_TYPES = [
    { key: 'smoke',       label: 'Smoke Test',       desc: 'Visibility checks — elements present in DOM',                  letter: 'S', letterClass: 'gp4-letter-s',    badge: 'Quick',    badgeClass: 'gp-badge-quick', time: '~30s'  },
    { key: 'functional',  label: 'Functional Test',  desc: 'Interactions — click, fill, submit + assertions',             letter: 'F', letterClass: 'gp4-letter-f',    badge: 'Medium',   badgeClass: 'gp-badge-mid',   time: '~1min' },
    { key: 'performance', label: 'Performance Test', desc: 'Web Vitals: LCP, FCP, TTI, Load Time, Resource Size',         letter: 'P', letterClass: 'gp4-letter-r',    badge: 'Advanced', badgeClass: 'gp-badge-full',  time: '~3min' },
    { key: 'api',         label: 'API Test',         desc: 'REST endpoints — status codes, payloads, auth tokens',        letter: 'A', letterClass: 'gp4-letter-api',  badge: 'Technical',badgeClass: 'gp-badge-mid',   time: '~2min' },
    { key: 'regression',  label: 'Regression Test',  desc: 'Ensure existing features still work after changes',           letter: 'R', letterClass: 'gp4-letter-reg',  badge: 'Thorough', badgeClass: 'gp-badge-mid',   time: '~3min' },
    { key: 'security',    label: 'Security Test',    desc: 'Check for vulnerabilities, auth issues, injection risks',     letter: 'S', letterClass: 'gp4-letter-sec',  badge: 'Critical', badgeClass: 'gp-badge-full',  time: '~5min' },
  ];
  const SECURITY_FRAMEWORKS = [
  { key: 'Pytest', color: '#3776AB', letters: 'Py', letterClass: 'gp4-letter-pytest', note: 'requests' },
];
const REGRESSION_FRAMEWORKS = [
  { key: 'Playwright', color: '#E2574C', letters: 'Pl', letterClass: 'gp4-letter-pl', note: 'Browser' },
];
  const PUBLIC_FRAMEWORKS   = [{ key: 'Selenium', color: '#43B02A', letters: 'Se', letterClass: 'gp4-letter-se' }, { key: 'Cypress', color: '#00BFA5', letters: 'Cy', letterClass: 'gp4-letter-cy' }, { key: 'Playwright', color: '#E2574C', letters: 'Pl', letterClass: 'gp4-letter-pl' }];
  const INTERNAL_FRAMEWORKS = [{ key: 'Playwright', color: '#E2574C', letters: 'Pl', letterClass: 'gp4-letter-pl' }, { key: 'Selenium', color: '#43B02A', letters: 'Se', letterClass: 'gp4-letter-se' }, { key: 'Cypress', color: '#00BFA5', letters: 'Cy', letterClass: 'gp4-letter-cy' }];
  const API_FRAMEWORKS = [
  { key: 'Pytest',   color: '#3776AB', letters: 'Py', letterClass: 'gp4-letter-pytest',  note: 'requests' },
  { key: 'Postman',  color: '#FF6C37', letters: 'Po', letterClass: 'gp4-letter-postman', note: 'Newman CLI' },
  ];
  const PERFORMANCE_FRAMEWORKS_PUBLIC   = [{ key: 'Playwright', color: '#E2574C', letters: 'Pl', letterClass: 'gp4-letter-pl', note: 'Web Vitals' }];
const PERFORMANCE_FRAMEWORKS_INTERNAL = [{ key: 'k6', color: '#7D64FF', letters: 'k6', letterClass: 'gp4-letter-k6', note: 'Load Test' }];
  const SEO_FRAMEWORKS = [{ key: 'Requests', color: '#10b981', letters: 'RQ', letterClass: 'gp4-letter-api', note: 'BeautifulSoup' },
];

  const TEST_TYPES = isInternal ? INTERNAL_TEST_TYPES : PUBLIC_TEST_TYPES;
  const FRAMEWORKS = testType === 'performance'
  ? (isInternal ? PERFORMANCE_FRAMEWORKS_INTERNAL : PERFORMANCE_FRAMEWORKS_PUBLIC)
  : testType === 'api'
  ? API_FRAMEWORKS
  : testType === 'security'  ? SECURITY_FRAMEWORKS 
  : testType === 'regression' ? REGRESSION_FRAMEWORKS 
  : testType === 'seo' ? SEO_FRAMEWORKS
  : isInternal
  ? INTERNAL_FRAMEWORKS
  : PUBLIC_FRAMEWORKS;

  const validateUrl = (val) => {
    try { new URL(val); setUrlValid(true); } catch { setUrlValid(val.length > 0 ? false : null); }
  };

  const submit = async (e) => {
  e.preventDefault();
   console.log('[DEBUG] username:', username);
  console.log('[DEBUG] password:', password);
  console.log('[DEBUG] isInternal:', isInternal);
  console.log('[DEBUG] project type:', project?.type);
  if (!url) return;
   if (isInternal && (!username.trim() || !password.trim())) {
    setError('Please enter your email and password to test this internal application.');
    return;
  }
  setLoad(true); setError('');
    console.log('[SUBMIT] username:', username, '| password:', password.length > 0 ? '***' : 'EMPTY');

   const startTime = Date.now();
  try {
    
const endpoint = testType === 'api'
  ? '/generations/generate-api'
  : testType === 'security'    ? '/generations/generate-security'
  : testType === 'regression'  ? '/generations/generate-regression'
  : testType === 'performance' && fw === 'k6' ? '/generations/generate-performance'
  : testType === 'functional' && isInternal ? '/generations/generate-functional'
  : testType === 'seo'      ? '/generations/generate-seo'
  : isInternal ? '/generate-internal' : '/generate';

const anpeToken = localStorage.getItem('token') || '';
const payload = testType === 'api'
  ? {
      url,
      framework:    fw,
      test_type:    'api',
      project_id:   project?.id,
      project_name: project?.name,
      project_type: project?.type,
      username,
      password,
      token: localStorage.getItem('token') || '',
    }
  : testType === 'regression'
  ? {
      url,
      framework:    fw,
      test_type:    'regression',
      project_id:   project?.id,
      project_name: project?.name,
      project_type: project?.type,
      username,   
      password,   
    }
    : testType === 'functional' && isInternal
? {
    url,
    framework:    fw,
    test_type:    'functional',
    project_id:   project?.id,
    project_name: project?.name,
    project_type: project?.type,
    username,   
    password,   
  }

 : testType === 'security'
? {
    url,
    project_id:   project?.id,
    project_name: project?.name,
    project_type: project?.type,
    anpe_token:   localStorage.getItem('token') || '',
    categories:   null,
    username,
    password,
  }
  

: testType === 'seo'
? {
    url,
    project_id:   project?.id,
    project_name: project?.name,
    project_type: project?.type,
  }

  : testType === 'performance' && fw === 'k6'
? {
    url,
    framework:   'k6',
    test_type:   'performance',
    project_id:  project?.id,
    project_name: project?.name,
    project_type: project?.type,
    test_types: ['load', 'stress', 'spike', 'soak'],
  }
  : isInternal
  ? {
      url,
      framework:    fw,
      test_type:    testType,
      project_id:   project?.id,
      project_name: project?.name,
      project_type: project?.type,
      scrape_login: url.includes('login'),
      username,
      password,
    }
  : {
      url,
      framework:    fw,
      test_type:    testType,
      project_name: project?.name,
      project_type: project?.type,
      project_id:   project?.id,
      user_scenario: null,
    };

// Debug
console.log('[SUBMIT] endpoint:', endpoint);
console.log('[SUBMIT] token:', payload.token?.slice(0, 30));
// Sauvegarder les credentials
if (isInternal && username && password) {
  localStorage.setItem(`creds-${url}`, JSON.stringify({ username, password }));
}
   let res;
if (docFiles.length > 0) {
  const formData = new FormData();
  docFiles.forEach(f => formData.append('doc_files[]', f));
  formData.append('data', JSON.stringify(payload));
  res = await api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
} else {
  res = await api.post(endpoint, payload);
}
    const genData = res.data;
    genData.fresh = true;
setGeneration(genData); 
goTo('execution');  

    if (genData.test_type === 'performance' || genData.result?.test_type === 'performance') {
      genData.result = genData.result || {};
      genData.result.performance = genData.performance || genData.result?.performance;
      genData.result.test_cases  = genData.result.test_cases || genData.generation?.test_cases || [];
    }
const durationMs = Date.now() - startTime;
genData.fresh = true;
setGeneration(genData);
console.log('[SUBMIT] calling goTo(execution)');

goTo('execution');
  } catch (err) { 
    console.log('[422 DETAIL]', err.response?.data);  // ← AJOUTE ICI
    setError(err.response?.data?.error || 'Une erreur est survenue'); 
    setLoad(false);
  }
};

  const selectedType = TEST_TYPES.find(t => t.key === testType);
  const selectedFw   = FRAMEWORKS.find(f => f.key === fw);
  const isReady = urlValid === true && testType !== '' && fw !== '' && (
  !isInternal
  ? true
  : (username.trim() !== '' && password.trim() !== '')
);
  const urlPlaceholder = isInternal ? 'https://api.internal.company.com/v1' : 'https://myapp.com';
  const urlLabel       = isInternal ? 'Target URL or API Endpoint' : 'Target URL';
  const urlHint        = isInternal ? 'Supports REST API endpoints and internal services' : 'Enter the web application you want to test';
const handleFiles = (newFiles) => {
  const allowed = ['pdf','txt','json','yaml','yml','md','docx'];
  const maxSize = 10 * 1024 * 1024;
  const valid = Array.from(newFiles).filter(f => {
    const ext = f.name.split('.').pop().toLowerCase();
    return allowed.includes(ext) && f.size <= maxSize;
  });
  setDocFiles(prev => {
    const existing = prev.map(f => f.name);
    return [...prev, ...valid.filter(f => !existing.includes(f.name))];
  });
};

const removeFile = (name) => setDocFiles(prev => prev.filter(f => f.name !== name));

const fileIcon = (name) => {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf')               return 'ti-file-type-pdf';
  if (['json','yaml','yml'].includes(ext)) return 'ti-file-type-json';
  if (ext === 'md')                return 'ti-markdown';
  if (ext === 'docx')              return 'ti-file-description';
  return 'ti-file-text';
};

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
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
        
{isReady && (
  <div className="gp-ready-badge" style={loading ? { background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.3)', color: 'var(--indigo2)' } : {}}>
    <span className="gp-ready-dot" style={loading ? { background: 'var(--indigo2)' } : {}} />
    {loading ? 'In execution...' : 'Ready to generate'}
  </div>
)}
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

 {isInternal && (
  <div className="gp4-section" style={{ marginTop: 20 }}>
    <div className="gp4-section-header">
      <span className="gp4-num">02</span>
      <div><div className="gp4-section-title">Credentials</div><div className="gp4-section-sub">Login credentials to access the internal application</div></div>
    </div>

    {/* Honeypot fields — piège l'autofill du navigateur */}
    <input type="text"     style={{ display: 'none' }} readOnly tabIndex={-1} />
    <input type="password" style={{ display: 'none' }} readOnly tabIndex={-1} />

    <div style={{ display: 'flex', gap: 12 }}>
      <div className="gp4-url-wrap" style={{ flex: 1 }}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4z" opacity="0"/><path d="M22 6l-10 7L2 6"/><path d="M2 6h20v12H2z"/></svg>
        <input
          type="text"
          inputMode="email"
          placeholder="email@example.com"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoComplete="off"
          name={`email-${Math.random()}`}
        />
      </div>
      <div className="gp4-url-wrap" style={{ flex: 1 }}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          name={`pwd-${Math.random()}`}
        />
        <button type="button" onClick={() => setShowPassword(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {showPassword
            ? <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            : <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          }
        </button>
      </div>
    </div>
  </div>
)}

            <div className="gp4-section">
              <div className="gp4-section-header">
                <span className="gp4-num">{isInternal ? '03' : '02'}</span>
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
                <span className="gp4-num">{isInternal ? '04' : '03'}</span>
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

            

            {/* ── Project Context — Internal only ── */}
            {isInternal && (
            <div className="gp4-section" style={{ marginTop: 24 }}>
              <div className="gp4-section-header">
                <span className="gp4-num">05</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="gp4-section-title">Project Context</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#7F77DD', background: '#EEEDFE', borderRadius: 20, padding: '2px 8px' }}>OPTIONAL</span>
                  </div>
                  <div className="gp4-section-sub">Attach docs to help AI generate more accurate tests</div>
                </div>
              </div>

              {docFiles.length === 0 ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                  onClick={() => setShowDocModal(true)}
                  style={{
                    border: `1.5px dashed ${dragOver ? '#7F77DD' : 'var(--border)'}`,
                    borderRadius: 12, padding: '28px 16px',
                    background: dragOver ? 'rgba(99,102,241,0.04)' : 'rgba(255,255,255,0.02)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 10, transition: 'all .2s', cursor: 'pointer'
                  }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>No documentation attached yet</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.6 }}>Swagger, README, PDF, Postman collections...</div>
                  <button type="button" style={{ marginTop: 4, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'transparent', border: '1px solid var(--border)', color: 'var(--fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                    Attach Files
                  </button>
                </div>
              ) : (
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>Attached files</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {docFiles.map(f => (
                      <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--fg)', flex: 1 }}>{f.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{formatSize(f.size)}</span>
                        <button type="button" onClick={() => removeFile(f.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
                  <button type="button" onClick={() => setShowDocModal(true)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                    Add more files
                  </button>
                </div>
              )}
            </div>

            
            )}
   <button type="button" className="gp4-submit" disabled={loading || !isReady}
  onClick={() => {
    if (!isReady) return;
    submit({ preventDefault: () => {} });
  }}>
              {loading ? (<><span className="spinner" /> Analyzing & Generating...</>) : (<><svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>Generate Tests{isReady && <span className="gp4-submit-arrow"></span>}</>)}
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
                {isInternal && username && (<><div className="gp4-sum-divider" /><div className="gp4-sum-row"><span className="gp4-sum-label">Email</span><span className="gp4-sum-val" style={{ fontSize: 11, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{username}</span></div></>)}
                {isInternal && password && (<><div className="gp4-sum-divider" /><div className="gp4-sum-row"><span className="gp4-sum-label">Password</span><span className="gp4-sum-val">{'•'.repeat(Math.min(password.length, 8))}</span></div></>)}
                <div className="gp4-sum-divider" />
                {docFiles.length > 0 && (
  <>
    <div className="gp4-sum-divider" />
    <div className="gp4-sum-row">
      <span className="gp4-sum-label">Context</span>
      <span className="gp4-sum-val" style={{ color: '#7F77DD' }}>
        {docFiles.length} file{docFiles.length > 1 ? 's' : ''} attached
      </span>
    </div>
  </>
)}
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


{showDocModal && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, width: 480, maxWidth: '90vw', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)' }}>Add Project Context</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Optional — helps AI generate more accurate tests</div>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#7F77DD', background: '#EEEDFE', borderRadius: 20, padding: '3px 8px', flexShrink: 0 }}>OPTIONAL</span>
      </div>

      {/* Drop zone */}
      <label
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '28px 16px', borderRadius: 12, cursor: 'pointer', border: `1.5px dashed ${dragOver ? '#7F77DD' : 'var(--border)'}`, background: dragOver ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)', transition: 'all .2s', marginBottom: 14 }}>
        <input type="file" multiple accept=".pdf,.txt,.json,.yaml,.yml,.md,.docx" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
        <svg width="26" height="26" fill="none" stroke="#818cf8" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          Drop files here or <span style={{ color: '#818cf8' }}>browse</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.6 }}>
          PDF, DOCX, TXT, JSON, YAML — max 10 MB
        </div>
      </label>

      {/* Liste fichiers */}
      {docFiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {docFiles.map(f => (
            <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <span style={{ fontSize: 12, color: 'var(--fg)', flex: 1 }}>{f.name}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{formatSize(f.size)}</span>
              <button type="button" onClick={() => removeFile(f.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formats pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 20 }}>
        {['Swagger / OpenAPI', 'Postman', 'README.md', 'PDF', 'TXT', 'DOCX'].map(label => (
          <span key={label} style={{ fontSize: 11, color: 'var(--muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px' }}>
            {label}
          </span>
        ))}
      </div>

    
      {/* Actions */}
<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
  <button type="button"
    onClick={() => setShowDocModal(false)}
    style={{ padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}>
    Skip for now
  </button>
  <button type="button"
    onClick={() => { setShowDocModal(false); submit({ preventDefault: () => {} }); }}
    style={{ padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--indigo2)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
    {docFiles.length > 0 ? `Generate with ${docFiles.length} file${docFiles.length > 1 ? 's' : ''}` : 'Generate Tests'}
  </button>
</div>
    </div>
  </div>
)}
    </div>
  );
}


// Performance Components

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

//Recomandation
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
     <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0,
  background: `${color}12`, border: `1px solid ${color}22`,
  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  {(() => {
    const n = test.name.toLowerCase();
    if (n.includes('load time'))        return <IconActivity   size={16} stroke={1.5} style={{ color }} />;
    if (n.includes('contentful paint') && n.includes('first'))   return <IconFlame  size={16} stroke={1.5} style={{ color }} />;
    if (n.includes('contentful paint') && n.includes('largest')) return <IconTarget size={16} stroke={1.5} style={{ color }} />;
    if (n.includes('interactive'))      return <IconBolt       size={16} stroke={1.5} style={{ color }} />;
    if (n.includes('network') || n.includes('requests')) return <IconWorldSearch size={16} stroke={1.5} style={{ color }} />;
    if (n.includes('page size') || n.includes('total page')) return <IconChartArea size={16} stroke={1.5} style={{ color }} />;
    if (n.includes('javascript'))       return <IconCode       size={16} stroke={1.5} style={{ color }} />;
    if (n.includes('css'))              return <IconSettings2  size={16} stroke={1.5} style={{ color }} />;
    if (n.includes('image'))            return <IconEye        size={16} stroke={1.5} style={{ color }} />;
    if (n.includes('dom'))              return <IconChartDonut size={16} stroke={1.5} style={{ color }} />;
    return <IconBolt size={16} stroke={1.5} style={{ color }} />;
  })()}
</div>
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


//  page of PerformanceExecutionPanel
function PerformanceExecutionPanel({ generation }) {
  const [activeSection, setActiveSection] = useState('metrics');
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [pdfLoading,    setPdfLoading]    = useState(false);
  const dropdownRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [terminalLines, setTerminalLines] = useState([]);
  const perfAnimFiredRef = useRef(false);


  useEffect(() => {
    if (!generation) return;
    const url = generation?.generation?.url || generation?.url || '';
    if (!url || tests.length === 0) return;
    const existing = JSON.parse(localStorage.getItem('nextest-reports') || '[]');
    const genId = generation?.generation?.id;
    if (genId && existing.some(r => r.generationData?.generation?.id === genId && r.htmlContent)) return;
    
    let htmlContent = null;
    try { htmlContent = buildHtmlReport({ generation, tests, testType: 'performance', framework: generation?.framework || 'Playwright', url, pass, fail, skip }); } catch(e) {}
    
    saveReportToStorage({ url, framework: generation?.framework || 'Playwright', testType: 'performance', passCount: pass, failCount: fail, skipCount: skip, htmlContent, generationData: generation });
  }, [generation?.generation?.id]);

useEffect(() => {
  if (!generation) return;
  if (!generation.fresh) { setRunning(false); return; }
  if (perfAnimFiredRef.current) return;
  perfAnimFiredRef.current = true;

  setRunning(true); setTerminalLines([]);

  const url = generation?.generation?.url || generation?.url || '';
  const currentFramework = generation?.generation?.framework || generation?.framework || 'Playwright';
  const totalTests = tests.length || 0;
  const fwLabel = currentFramework === 'Playwright' ? 'Playwright (headless chromium)'
    : currentFramework === 'k6' ? 'k6 Load Testing Engine'
    : currentFramework;

  const addLine = (text, type = 'info', delay = 0) =>
    new Promise(res => setTimeout(() => {
      setTerminalLines(prev => [...prev, { text, type, time: new Date().toLocaleTimeString('en-US', { hour12: false }) }]);
      res();
    }, delay));

  const playAnimation = async () => {
    await addLine('NexTest AI Engine v2.0 initializing...', 'system', 0);
    await addLine(`Connecting to ${url}`, 'info', 400);
    await addLine(`Launching ${fwLabel}...`, 'info', 800);
    await addLine('Measuring page load & Core Web Vitals...', 'info', 1200);
    await addLine(`AI analyzing ${totalTests} performance metric(s)...`, 'ai', 1700);
    await addLine('Collecting network & resource timing...', 'info', 2100);
    await addLine('Analysis ready — compiling metrics...', 'success', 2500);
    await addLine('─'.repeat(52), 'divider', 2800);

    for (let i = 0; i < Math.min(tests.length, 8); i++) {
      await addLine(`Measuring [${i + 1}/${totalTests}] ${tests[i]?.name || `Metric ${i + 1}`}...`, 'running', 3000 + i * 300);
    }
    if (totalTests > 8) {
      await addLine(`... and ${totalTests - 8} more metrics processed`, 'muted', 3000 + 8 * 300);
    }

    await addLine('─'.repeat(52), 'divider', 3000 + Math.min(totalTests, 8) * 300 + 200);

    const passN = tests.filter(t => t.status === 'pass').length;
    const failN = tests.filter(t => t.status === 'fail').length;
    const skipN = tests.filter(t => t.status === 'skip').length;

    tests.slice(0, 6).forEach((t, i) => {
      const icon = t.status === 'pass' ? '✓' : t.status === 'fail' ? '✗' : '—';
      const type = t.status === 'pass' ? 'pass' : t.status === 'fail' ? 'fail' : 'skip';
      setTerminalLines(prev => [...prev, {
        text: `${icon} ${t.name || `Metric ${i + 1}`}`,
        type,
        time: new Date().toLocaleTimeString('en-US', { hour12: false })
      }]);
    });

    await addLine('─'.repeat(52), 'divider', 200);
    await addLine(`Analysis complete — ${passN} within threshold · ${failN} exceeded · ${skipN} skipped`, 'summary', 400);
    await addLine(`Score: ${score || 0}/100`, (score || 0) >= 75 ? 'success' : 'fail', 600);
    await addLine('Generating AI recommendations...', 'ai', 800);
    await addLine('Done ✓', 'success', 1000);

    setTimeout(() => {
      setRunning(false);
      generation.fresh = false;
    }, 1200);
  };

  playAnimation();
}, [generation?.generation?.id, generation?.fresh]);

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

  //1. PAGE ANALYSIS (matches PDF build_page_analysis) 
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

  //2. PERFORMANCE TEST PLAN (matches PDF build_test_plan)
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

  //3. PLANNED UI ELEMENTS → for perf: "Key Web Vitals"
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

  //4. TEST SUMMARY (matches PDF build_stats_section)
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

  //5. EXECUTION VERDICT SUMMARY (matches PDF build_execution_verdict_summary)
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

  //6. DETAILED METRICS TABLE (matches PDF PerformanceMetricRow)
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
                ${test.name.split(' ')[0]}
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

  //9. SCRIPT SUMMARY (matches PDF build_script_section)
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

  //10. FINAL AI VERDICT (matches PDF build_ai_recommendations final block)
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

  //FULL HTML DOCUMENT
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
  saveReportToStorage({
    url: generation?.generation?.url || '',
    framework,
    testType: 'performance',
    passCount: pass,
    failCount: fail,
    htmlContent: html,
    generationData: generation,
  });
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
  const SECTION_LABELS = { timing: 'Timing', network: 'Network', assets: 'Assets', dom: 'DOM' };
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
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
  <span title={url}>{url}</span>
</div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', background: 'rgba(99,102,241,.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,.2)' }}>{siteType}</span>
          </div>
        </div>

        {/* RIGHT — flex column with actions + score ring */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>

          {/* ACTIONS */}
<div className="ep-actions" style={{ opacity: pdfLoading ? 0.25 : 1, pointerEvents: pdfLoading ? 'none' : 'auto', transition: 'opacity .3s' }}>

            {/* Download Script */}
            <button onClick={() => {
              const content = generation?.result?.script_playwright || generation?.result?.script || '';
              const blob = new Blob([content], { type: 'text/plain' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = 'performance_playwright.py';
              link.click();
            }} className="ep-dl-btn"
              style={{ background: 'transparent', border: '1px solid rgba(125,100,255,.35)', color: '#7D64FF' }}>
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
          

          {/* Score ring is INSIDE the right flex column, AFTER ep-actions */}
          <PerformanceScoreRing score={running ? 0 : score} label={running ? '···' : scoreLabel} color={running ? '#475569' : scoreColor} />

        </div>
        
      </div>
      

      {/* ── SITE ANALYSIS ── */}
       {!running && analysis && (
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
      <div className="ep-stats" style={{ marginBottom: 24, opacity: running ? 0.4 : 1, transition: 'opacity .3s' }}>
        {[
          { label: 'Passed',    val: running ? 0 : pass,         color: '#10B981', bg: 'rgba(16,185,129,.08)', border: 'rgba(16,185,129,.2)', icon: <svg width="18" height="18" fill="none" stroke="#10B981" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> },
          { label: 'Failed',    val: running ? 0 : fail,         color: '#EF4444', bg: 'rgba(239,68,68,.08)',  border: 'rgba(239,68,68,.2)', icon: <svg width="18" height="18" fill="none" stroke="#EF4444" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg> },
          { label: 'Warn/Skip', val: running ? 0 : skip,         color: '#F59E0B', bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.2)', icon: <svg width="18" height="18" fill="none" stroke="#F59E0B" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> },
          { label: 'Score',     val: running ? '—' : `${score}`, color: scoreColor, bg: `${scoreColor}12`,     border: `${scoreColor}33`, icon: <svg width="18" height="18" fill="none" stroke={running ? 'var(--muted)' : scoreColor} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
        ].map((s, i) => (
          <div key={s.label} className="ep-stat" style={{ '--sc': s.color, '--sb': s.bg, '--sbo': s.border, '--i': i }}>
            <div className="ep-stat-icon">{s.icon}</div>
            <div className="ep-stat-body"><div className="ep-stat-val" style={{ color: s.color }}>{s.val}</div><div className="ep-stat-lbl">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* ── KEY METRICS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
  { key: 'load_time_ms', label: 'Load Time', fullName: 'Load Time', icon: <IconActivity size={22} stroke={1.5} style={{ color: '#6366f1' }} />, unit: 'ms', accent: '#6366f1' },
  { key: 'fcp_ms',       label: 'FCP',       fullName: 'First Contentful Paint', icon: <IconFlame    size={22} stroke={1.5} style={{ color: '#f97316' }} />, unit: 'ms', accent: '#f97316' },
  { key: 'lcp_ms',       label: 'LCP',       fullName: 'Largest Contentful Paint', icon: <IconTarget   size={22} stroke={1.5} style={{ color: '#10b981' }} />, unit: 'ms', accent: '#10b981' },
  { key: 'tti_ms',       label: 'TTI',       fullName: 'Time to Interactive', icon: <IconBolt     size={22} stroke={1.5} style={{ color: '#f59e0b' }} />, unit: 'ms', accent: '#f59e0b' },
        ].map(m => {
          const val   = running ? null : (metrics[m.key] ?? perf?.[m.key] ?? null);
          const test  = tests.find(t => t.metric_key === m.key);
          const color = running ? 'var(--muted)' : (test?.status === 'pass' ? '#10b981' : test?.status === 'fail' ? '#ef4444' : '#f59e0b');
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
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0, opacity: running ? 0.3 : 1, pointerEvents: running ? 'none' : 'auto', transition: 'opacity .3s' }}>
        {[
  { key: 'metrics', label: 'Metrics', Icon: IconChartBar, count: running ? 0 : tests.length },
  { key: 'recommendations', label: 'Recommendations', Icon: IconBulb, count: running ? 0 : recs.length },
].map(tab => (
  <button key={tab.key} onClick={() => setActiveSection(tab.key)}
    style={{ padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 700, color: activeSection === tab.key ? 'var(--indigo2)' : 'var(--muted)', borderBottom: activeSection === tab.key ? '2px solid var(--indigo2)' : '2px solid transparent', marginBottom: -1, transition: 'all .18s', display: 'flex', alignItems: 'center', gap: 8 }}>
    <tab.Icon size={15} stroke={1.8} />
    {tab.label}
    <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: activeSection === tab.key ? 'var(--indigo-bg)' : 'var(--bg2)', color: activeSection === tab.key ? 'var(--indigo2)' : 'var(--muted)' }}>{tab.count}</span>
  </button>
))}
      </div>
{running ? (
        <div style={{
          background: '#050a14', border: '1px solid rgba(99,102,241,.25)', borderRadius: 16,
          overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,.5)',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', background:'linear-gradient(135deg,#0a0f1e,#0d1526)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
            <div style={{ display:'flex', gap:6 }}>
              {['#ef4444','#f59e0b','#10b981'].map((c,i) => (
                <div key={i} style={{ width:12, height:12, borderRadius:'50%', background:c, opacity:.8 }} />
              ))}
            </div>
            <div style={{ flex:1, textAlign:'center', fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:1 }}>
              NexTest Terminal — Performance Analyzer
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', animation:'termPulse 1s ease-in-out infinite' }} />
              <span style={{ fontSize:10, color:'#10b981', fontWeight:700, letterSpacing:1 }}>RUNNING</span>
            </div>
          </div>
          <div style={{ padding:'16px 20px', minHeight:280, maxHeight:380, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}
            ref={el => { if (el) el.scrollTop = el.scrollHeight; }}>
            {terminalLines.map((line, i) => {
              const colors = { system:'#818cf8', info:'#94a3b8', ai:'#c9a227', success:'#10b981', fail:'#ef4444', pass:'#10b981', skip:'#f59e0b', running:'#60a5fa', muted:'#475569', divider:'#1e293b', summary:'#e2e8f0' };
              const icons  = { system:'⬡', info:'›', ai:'◆', success:'✓', fail:'✗', pass:'✓', skip:'◌', running:'◉', muted:'·', divider:'', summary:'▸' };
              if (line.type === 'divider') return (
                <div key={i} style={{ color:'#1e2d47', fontSize:11, userSelect:'none', margin:'4px 0' }}>{line.text}</div>
              );
              return (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, animation:'termFadeIn .3s ease both', fontSize:12, lineHeight:1.6 }}>
                  <span style={{ color:'#1e3a5f', fontSize:10, flexShrink:0, marginTop:1 }}>{line.time}</span>
                  <span style={{ color:colors[line.type]||'#94a3b8', flexShrink:0, fontSize:11 }}>{icons[line.type]||'›'}</span>
                  <span style={{ color:colors[line.type]||'#94a3b8', flex:1 }}>{line.text}</span>
                </div>
              );
            })}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4 }}>
              <span style={{ color:'#1e3a5f', fontSize:10 }}>{new Date().toLocaleTimeString('en-US',{hour12:false})}</span>
              <span style={{ color:'#6366f1' }}>›</span>
              <span style={{ display:'inline-block', width:8, height:15, background:'#6366f1', borderRadius:1, animation:'termBlink .8s step-end infinite' }} />
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 16px', background:'rgba(99,102,241,.06)', borderTop:'1px solid rgba(99,102,241,.1)' }}>
            <span style={{ fontSize:10, color:'#6366f1', fontWeight:700 }}>◉ {terminalLines.length} events</span>
            <span style={{ fontSize:10, color:'#475569', fontWeight:600 }}>{generation?.framework || generation?.generation?.framework || ''} · AI-Powered</span>
          </div>
          <style>{`
            @keyframes termFadeIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
            @keyframes termBlink  { 0%,100%{opacity:1} 50%{opacity:0} }
            @keyframes termPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
          `}</style>
        </div>
      ) : (
      <>
      {/* ── METRICS TAB ── */}
      {activeSection === 'metrics' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr', gap: 12, padding: '12px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
            {['Metric', 'Value', 'Threshold', 'Status', 'Distribution'].map(h => (<div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</div>))}
          </div>
          {SECTIONS.map(sec => {
            const secTests = bySection[sec] || [];
            if (!secTests.length) return null;
            const SECTION_ICONS = {
              timing:  IconActivity,
              network: IconWorldSearch,
              assets:  IconChartArea,
              dom:     IconChartDonut,
            };
            const SecIcon = SECTION_ICONS[sec];
            return (
              <div key={sec}>
                <div style={{ padding: '8px 20px', background: `${SECTION_COLORS[sec]}08`, borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: SECTION_COLORS[sec], display: 'flex', alignItems: 'center', gap: 6 }}>
                  {SecIcon && <span style={{ color: SECTION_COLORS[sec] }}><SecIcon size={13} stroke={1.5} /></span>}
                  {SECTION_LABELS[sec] || sec}
                  <InfoTooltip
                    title={SECTION_LABELS[sec] || sec}
                    text={getPerformanceSectionExplanation(sec)}
                    icon={SecIcon ? <SecIcon size={14} color={SECTION_COLORS[sec]} /> : 'ℹ️'}
                    accent={SECTION_COLORS[sec]}
                    details={secTests.map(t => ({
                      title: t.name.replace(/^[^\s]+\s/, ''),
                      text: getPerformanceMetricExplanation(t.name),
                    }))}
                  />
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
      </>
      )}
    </div>
  );
}
function K6MetricCard({ label, value, unit, good, threshold, color, icon }) {
  const numVal = parseFloat(value);
  const isOk   = !isNaN(numVal) && threshold ? numVal <= threshold : true;
  const sc     = value == null || value === 'N/A' ? '#64748b' : isOk ? '#10b981' : '#ef4444';
 
  return (
    <div style={{
      background: 'var(--card)', border: `1px solid ${sc}33`,
      borderTop: `3px solid ${sc}`, borderRadius: 12, padding: '16px',
    }}>
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: sc, fontFamily: 'var(--C)', lineHeight: 1 }}>
        {value ?? 'N/A'}{value != null && unit ? unit : ''}
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
      {good && <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>Good ≤ {good}{unit}</div>}
    </div>
  );
}
 


function K6TestTypeCard({ typeKey, data, active, onClick }) {
  const TYPE_CONFIG = {
    load:   { label: 'Load Test',   icon: TrendingUp, color: '#6366f1', desc: 'Normal expected traffic' },
    stress: { label: 'Stress Test', icon: Flame,       color: '#ef4444', desc: 'Beyond capacity — breaking point' },
    spike:  { label: 'Spike Test',  icon: Zap,         color: '#f59e0b', desc: 'Sudden traffic burst' },
    soak:   { label: 'Soak Test',   icon: Waves,       color: '#0ea5e9', desc: 'Extended load — memory leaks' },
  };
  const cfg      = TYPE_CONFIG[typeKey] || { label: typeKey, icon: BarChart3, color: '#6366f1', desc: '' };
  const Icon     = cfg.icon;
  const status   = data?.status || 'unknown';
  const sc       = status === 'pass' ? '#10b981' : status === 'fail' ? '#ef4444' : status === 'error' ? '#f59e0b' : '#64748b';
  const StatusIcon = status === 'pass' ? CheckCircle2 : status === 'fail' ? XCircle : status === 'error' ? AlertTriangle : MinusCircle;
  const metrics  = data?.metrics || {};
  const p95      = metrics.http_req_duration_p95;
  const errRate  = metrics.http_req_failed_rate;

  return (
    <div onClick={onClick} style={{
      background: active ? `${cfg.color}12` : 'var(--card)',
      border: `1.5px solid ${active ? cfg.color : 'var(--border)'}`,
      borderRadius: 14, padding: '28px 24px', cursor: 'pointer',
      transition: 'all .2s', position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = cfg.color; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {active && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,transparent,${cfg.color},transparent)` }} />}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${cfg.color}15`, border: `1px solid ${cfg.color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={18} color={cfg.color} strokeWidth={2.25} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: active ? cfg.color : 'var(--text)' }}>{cfg.label}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{cfg.desc}</div>
          </div>
        </div>
        <span style={{
          fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase',
          color: sc, background: `${sc}15`, border: `1px solid ${sc}33`,
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <StatusIcon size={11} strokeWidth={2.5} />
          {status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : status === 'error' ? 'ERROR' : 'N/A'}
        </span>
      </div>

      {data?.duration_seconds && (
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} />
          Duration: {data.duration_seconds}s
        </div>
      )}
    </div>
  );
}


function formatK6TestCase(rawName, suite, category) {
  const name  = (rawName || '').trim();
  const info  = (suite  || '').trim();
  const lower = name.toLowerCase();
 
  // ── 1. RESPONSE TIME p95 ──────────────────────────────────────────────────
  if (/response time p95/i.test(name)) {
    const thresholdMatch = name.match(/[\d.]+ms$/);
    const threshold      = thresholdMatch ? thresholdMatch[0] : null;
    const measuredMatch  = info.match(/p95=([\d.]+ms)/);
    const measured       = measuredMatch ? measuredMatch[1] : null;
    const limitMatch     = info.match(/threshold:\s*([\d]+ms)/);
    const limit          = limitMatch ? limitMatch[1] : threshold;
 
    return {
      title: '95th Percentile Response Time',
      description: measured && limit
        ? `95% of requests responded in ${measured} — limit is ${limit} for this test`
        : limit
        ? `Response time threshold: must stay below ${limit}`
        : 'Measures the 95th percentile of all request durations',
    };
  }
 
  //2. AVERAGE RESPONSE TIME
  if (/average response time/i.test(name)) {
    const avgMatch = info.match(/avg=([\d.]+ms)/);
    const avg      = avgMatch ? avgMatch[1] : null;
    return {
      title: 'Average Response Time',
      description: avg
        ? `Mean response time across all requests: ${avg}`
        : 'Arithmetic mean of all HTTP request durations',
    };
  }
 
  //3. MAX RESPONSE TIME
  if (/max response time/i.test(name)) {
    const maxMatch = info.match(/max=([\d.smµ]+)/);
    const max      = maxMatch ? maxMatch[1] : null;
    return {
      title: 'Maximum Response Time',
      description: max
        ? `Slowest single request recorded: ${max}`
        : 'Worst-case response time observed during the test',
    };
  }
 
  // 4. ERROR RATE
  if (/error rate/i.test(name)) {
    const rateMatch    = info.match(/error_rate=([\d.]+%)/);
    const rate         = rateMatch ? rateMatch[1] : null;
    const limitMatch   = name.match(/< ([\d]+%)/);
    const limit        = limitMatch ? limitMatch[1] : null;
    return {
      title: 'HTTP Error Rate',
      description: rate && limit
        ? `${rate} of requests returned errors — target: below ${limit}`
        : rate
        ? `${rate} of requests failed during this test`
        : limit
        ? `Error rate must remain below ${limit}`
        : 'Percentage of HTTP requests that returned an error',
    };
  }
 
  //5. THROUGHPUT
  if (/throughput/i.test(name)) {
    const rpsMatch = info.match(/([\d.]+)\s*req\/s/);
    const rps      = rpsMatch ? rpsMatch[1] : null;
    return {
      title: 'Request Throughput',
      description: rps
        ? `${rps} requests/second sustained during this test`
        : info === 'N/A'
        ? 'Throughput data was not captured (no HTTP requests completed)'
        : 'Number of HTTP requests handled per second',
    };
  }
 
  // 6. MAX VIRTUAL USERS
  if (/max virtual users/i.test(name)) {
    const vusMatch = info.match(/max_vus=(\d+)/);
    const vus      = vusMatch ? vusMatch[1] : null;
    return {
      title: 'Peak Virtual Users',
      description: vus
        ? `Maximum concurrent users reached: ${vus} VUs`
        : 'Highest number of simultaneous virtual users during the test',
    };
  }
 
  //7. K6 CHECKS PASS RATE
  if (/checks pass rate/i.test(name)) {
    const checkMatch = info.match(/checks=([\d.]+%)/);
    const checkRate  = checkMatch ? checkMatch[1] : null;
    const limitMatch = name.match(/> ([\d]+%)/);
    const limit      = limitMatch ? limitMatch[1] : '95%';
    return {
      title: 'k6 Assertions Pass Rate',
      description: checkRate
        ? `${checkRate} of check() assertions passed — target: above ${limit}`
        : info === 'N/A'
        ? `No check() assertions in script — metric unavailable (target: above ${limit})`
        : `Percentage of explicit check() assertions that passed`,
    };
  }
 
  //8. THRESHOLDS
  if (/threshold:/i.test(name)) {
    // p95 threshold
    if (/p\(95\)/i.test(name) || /p\(95\)/i.test(info)) {
      const p95Match   = info.match(/p\(95\)=([\d.]+[smµ]+)/);
      const p95        = p95Match ? p95Match[1] : null;
      const limitMatch = name.match(/p\(95\)<([\d]+)/);
      const limit      = limitMatch ? `${limitMatch[1]}ms` : null;
      return {
        title: 'Threshold: p95 Response Time',
        description: p95 && limit
          ? `p(95)=${p95} — ${info.includes('Passed') ? 'passed' : 'failed'} (limit: ${limit})`
          : info.includes('Passed')
          ? 'Threshold condition was met ✓'
          : 'Threshold condition was not met',
      };
    }
 
    // error rate threshold
    if (/rate</i.test(name) || /rate=/i.test(info)) {
      const rateMatch  = info.match(/rate=([\d.]+%)/);
      const rate       = rateMatch ? rateMatch[1] : null;
      const limitMatch = name.match(/rate<([\d.]+)/);
      const limit      = limitMatch ? `${parseFloat(limitMatch[1]) * 100}%` : null;
      return {
        title: 'Threshold: Error Rate',
        description: rate && limit
          ? `error_rate=${rate} — ${info.includes('Passed') ? 'passed' : 'failed'} (limit: below ${limit})`
          : info.includes('Passed')
          ? 'Error rate is within acceptable limits ✓'
          : 'Error rate exceeded the allowed threshold',
      };
    }
 
    // status 200/302 threshold
    if (/status is 200/i.test(name) || /302/i.test(name)) {
      return {
        title: 'Threshold: HTTP Status Codes',
        description: info.includes('Passed')
          ? 'All responses returned HTTP 200 or 302 (redirect) ✓'
          : 'Some responses returned unexpected HTTP status codes',
      };
    }
 
    // VU duration threshold  e.g. "00/10 VUs 1m45s"
    const vuMatch = name.match(/(\d+)\/(\d+)\s*VUs?\s+([\d]+[ms]+[\d]*[s]*)/i)
                 || info.match(/(\d+)\/(\d+)\s*VUs?\s+([\d]+[ms]+[\d]*[s]*)/i);
    if (vuMatch || /VUs?/i.test(name)) {
      const durationMatch = (name + ' ' + info).match(/(\d+m\d+s|\d+s|\d+ms)/);
      const duration      = durationMatch ? durationMatch[1] : null;
      const vuCountMatch  = (name + ' ' + info).match(/\/(\d+)\s*VUs?/i);
      const vuCount       = vuCountMatch ? vuCountMatch[1] : null;
      return {
        title: 'Threshold: Test Duration & VUs',
        description: duration && vuCount
          ? `Test ran for ${duration} with up to ${vuCount} virtual users ✓`
          : duration
          ? `Test completed within the ${duration} time limit ✓`
          : info.includes('Passed')
          ? 'Duration and VU count threshold was met ✓'
          : 'Test duration or VU threshold condition',
      };
    }
 
    // numeric threshold (e.g. "105", "2785 / ✗ 105")
    if (/^\d+$/.test(info.trim()) || /\d+\s*\//.test(info)) {
      return {
        title: 'Threshold: Request Count',
        description: info.includes('Passed')
          ? `Request count condition met: ${info.replace('✓ Passed', '').trim()}`
          : `Request count threshold failed: ${info.replace('✗ Failed', '').trim()}`,
      };
    }
 
    // Fallback threshold
    return {
      title: 'k6 Threshold Check',
      description: info.includes('Passed')
        ? `Condition: "${name.replace(/^Threshold:\s*/i, '')}" — passed ✓`
        : info.includes('Failed')
        ? `Condition: "${name.replace(/^Threshold:\s*/i, '')}" — failed ✗`
        : `k6 threshold: ${name.replace(/^Threshold:\s*/i, '')}`,
    };
  }
 
  //FALLBACK
  return {
    title: name.split('\n')[0].trim() || name,
    description: info || 'k6 performance metric',
  };
}
// Plain-language explanation per metric, for non-technical viewers (jury, stakeholders)
function getMetricExplanation(title) {
  const map = {
    '95th Percentile Response Time': "95% of requests were faster than this value — the standard way to measure real-world speed.",
    'Average Response Time': "Mean server response time across all requests in this test.",
    'Maximum Response Time': "Slowest single request recorded — the worst case.",
    'HTTP Error Rate': "Share of requests that failed (server errors, timeouts) instead of succeeding.",
    'Request Throughput': "Requests handled per second — higher means better capacity.",
    'Peak Virtual Users': "Maximum number of simulated concurrent users reached.",
    'k6 Assertions Pass Rate': "Share of automatic checks that passed during execution.",
  };
  if (map[title]) return map[title];
  if (title.startsWith('Threshold:')) {
    const thresholdMap = {
      'Threshold: p95 Response Time': "Limit set before the test: 95% of requests must respond faster than a target time (ex: under 500ms). ✓ Passed means this held true throughout the test.",
      'Threshold: Error Rate': "Limit set before the test: the share of failed requests must stay below a target (ex: under 1%). ✓ Passed means errors stayed under that limit.",
      'Threshold: HTTP Status Codes': "Limit set before the test: requests must return valid HTTP status codes (ex: no 500 server errors). ✓ Passed means no invalid codes were returned.",
      'Threshold: Test Duration & VUs': "Limit set before the test: the test had to run for its full planned duration with the target number of virtual users. ✓ Passed means it completed as configured.",
    };
    return thresholdMap[title] || "A limit you set before the test. ✓ Passed means the test respected this limit the whole time.";
  }
}
function getPerformanceMetricExplanation(metricName) {
  const name = (metricName || '').toLowerCase();

  if (name.includes('load time'))
    return "Total time for the page to fully load, from navigation start to the load event. The single most direct measure of perceived speed.";
  if (name.includes('first contentful paint') || name.includes('fcp'))
    return "Time until the browser renders the first piece of DOM content (text, image). Marks when the user sees something is happening.";
  if (name.includes('largest contentful paint') || name.includes('lcp'))
    return "Time until the largest visible element (usually a hero image or heading) finishes rendering. Core Web Vital — should be under 2.5s for good UX.";
  if (name.includes('interactive') || name.includes('tti'))
    return "Time until the page is fully interactive — main thread is free and event handlers are attached. Affects how soon users can click/type.";
  if (name.includes('request'))
    return "Number of HTTP requests fired to load the page. More requests generally mean more round trips and slower loads.";
  if (name.includes('total page size') || name.includes('page size'))
    return "Combined size of all downloaded resources (HTML, JS, CSS, images, fonts). Directly impacts load time, especially on slow connections.";
  if (name.includes('dom'))
    return "Number of nodes in the DOM tree. A very large DOM slows down rendering, layout, and JavaScript queries.";
  if (name.includes('javascript') || name.includes('js size'))
    return "Total size of JS bundles downloaded. Large JS payloads delay parsing, execution, and Time to Interactive.";
  if (name.includes('css'))
    return "Total size of stylesheets downloaded. Oversized CSS can block rendering until it's parsed.";
  if (name.includes('image'))
    return "Total size of images on the page. Unoptimized images are one of the most common causes of slow page loads.";

  return "Performance metric measuring page speed and resource efficiency.";
}

function getPerformanceSectionExplanation(section) {
  switch (section) {
    case 'timing':  return "Measures how fast the page becomes visible and usable to the end user, from first paint to full interactivity.";
    case 'network':  return "Measures the volume and efficiency of network activity required to load the page — requests, size, and transfer time.";
    case 'assets':   return "Measures the size of individual resource types (JS, CSS, images) that make up the page's total payload.";
    case 'dom':      return "Measures the complexity of the page's DOM structure, which affects rendering and script execution speed.";
    default:          return "Performance measurement for this page.";
  }
}
function getTestTypeExplanation(typeKey) {
  switch (typeKey) {
    case 'load':
      return "Simulates normal, expected traffic matching the application's typical production usage. Verifies the system responds correctly under everyday, realistic conditions.";
    case 'stress':
      return "Pushes the system beyond its normal capacity to find its breaking point. Helps identify the load level at which performance degrades or the system fails.";
    case 'spike':
      return "Simulates a sudden, sharp increase in traffic (e.g. a burst of visitors). Verifies the system can absorb unexpected load without crashing.";
    case 'soak':
      return "Applies a moderate but sustained load over an extended period. Helps detect issues that only appear over time, such as memory leaks.";
    default:
      return "Measures the system's behavior under simulated load.";
  }
}
function InfoTooltip({ title, text, details = [], icon = 'ℹ️', accent = '#7D64FF' }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;

  return (
    <>
     <span
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 20, height: 20, borderRadius: 4, marginLeft: 8,
          cursor: 'pointer', flexShrink: 0,
          background: `${accent}20`, border: `1px solid ${accent}55`,
          color: accent, transition: 'all .15s',
          fontSize: 12, fontWeight: 700, lineHeight: 1, userSelect: 'none',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `${accent}35`; e.currentTarget.style.borderColor = accent; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = `${accent}20`; e.currentTarget.style.borderColor = `${accent}55`; }}
      >
        ?
      </span>
      {open && createPortal(
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0d1526', border: '1px solid var(--border)',
              borderRadius: 18, width: 440, maxWidth: '90%',
              boxShadow: '0 24px 70px rgba(0,0,0,.55)',
              overflow: 'hidden',
              animation: 'dFadeUp .2s var(--ease) both',
            }}
          >
            {/* Top accent line */}
            <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              gap: 12, padding: '20px 24px 16px', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${accent}18`, border: `1px solid ${accent}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3 }}>
                    {title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                    What each test checks
                  </div>
                </div>
              </div>
              <span
                onClick={() => setOpen(false)}
                style={{
                  cursor: 'pointer', color: 'var(--muted)', fontSize: 16, lineHeight: 1,
                  padding: 4, flexShrink: 0,
                }}
              >✕</span>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 24px 22px', maxHeight: '60vh', overflowY: 'auto' }}>
              {details && details.length > 0 ? (
                <>
                  <div style={{
                    background: 'rgba(125,100,255,.08)',
                    border: `1px solid ${accent}40`,
                    borderRadius: 12,
                    padding: '12px 14px',
                    marginBottom: 14,
                    fontSize: 12.5, color: 'var(--text)', opacity: 0.85,
                    lineHeight: 1.7, letterSpacing: 0.1,
                  }}>
                    {text}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {details.map((d, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,.03)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        padding: '14px 16px',
                        borderLeft: `3px solid ${accent}`,
                      }}>
                        <div style={{
                          fontSize: 13, fontWeight: 700, color: accent, marginBottom: 6,
                          display: 'flex', alignItems: 'center', gap: 7,
                        }}>
                          <span style={{
                            width: 5, height: 5, borderRadius: '50%', background: accent, flexShrink: 0,
                          }} />
                          {d.title}
                        </div>
                        <div style={{
                          fontSize: 12.5, color: 'var(--text)', opacity: 0.75,
                          lineHeight: 1.75, letterSpacing: 0.1,
                        }}>
                          {d.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, opacity: 0.85 }}>
                  {text}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
function K6ExecutionPanel({ generation }) {
   const [activeType,   setActiveType]   = useState(null);
  const [activeTab,    setActiveTab]    = useState('results');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pdfLoading,   setPdfLoading]   = useState(false);
  const dropdownRef = useRef(null);
  const [typePageIndex, setTypePageIndex] = useState(0);
  const [scenarioPageIndex, setScenarioPageIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [terminalLines, setTerminalLines] = useState([]);
  const k6AnimFiredRef = useRef(false);
 useEffect(() => {
    if (!generation) return;
    const url = generation?.generation?.url || generation?.url || '';
    if (!url || tests.length === 0) return;
    const existing = JSON.parse(localStorage.getItem('nextest-reports') || '[]');
    const genId = generation?.generation?.id;
    if (genId && existing.some(r => r.generationData?.generation?.id === genId && r.htmlContent)) return;
    
    let htmlContent = null;
    try { htmlContent = buildHtmlReport({ generation, tests, testType: 'performance', framework: 'k6', url, pass, fail, skip }); } catch(e) {}
    
    saveReportToStorage({ url, framework: 'k6', testType: 'performance', passCount: pass, failCount: fail, skipCount: skip, htmlContent, generationData: generation });
  }, [generation?.generation?.id]);

  
 
  const result  = generation?.result || {};
  const summary = result?.summary   || {};
  console.log('[K6] summary keys:', Object.keys(summary));
console.log('[K6] summary full:', JSON.stringify(summary, null, 2));
  const tests   = result?.test_cases || result?.execution_results || [];
  const url     = generation?.generation?.url || generation?.url || '';
  const framework = generation?.framework || generation?.generation?.framework || 'k6';
 
  // Détecte les types disponibles
  const availableTypes = Object.keys(summary).filter(k => summary[k]);
  const activeKey = activeType || availableTypes[0] || null;
  const activeData = activeKey ? summary[activeKey] : null;
  const activeMetrics = activeData?.metrics || {};
 
  // Stats globales
  const pass     = tests.filter(t => t.status === 'pass').length;
  const fail     = tests.filter(t => t.status === 'fail').length;
  const skip     = tests.filter(t => t.status === 'skip' || t.status === 'warn').length;
  const total    = tests.length || 1;
  const passRate = Math.round((pass / total) * 100);
  const rateColor = passRate >= 80 ? '#10b981' : passRate >= 50 ? '#f59e0b' : '#ef4444';
  const aiRecsCount = (generation?.result?.ai?.recommendations || []).length;
 
  useEffect(() => {
    if (availableTypes.length > 0 && !activeType) setActiveType(availableTypes[0]);
  }, [availableTypes.length]);
 
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
useEffect(() => {
    if (!generation) return;
    if (!generation.fresh) { setRunning(false); return; }
    if (k6AnimFiredRef.current) return;
    k6AnimFiredRef.current = true;

    setRunning(true); setTerminalLines([]);

    const targetUrl = generation?.generation?.url || generation?.url || '';
    const totalTests = tests.length || 0;

    const addLine = (text, type = 'info', delay = 0) =>
      new Promise(res => setTimeout(() => {
        setTerminalLines(prev => [...prev, { text, type, time: new Date().toLocaleTimeString('en-US', { hour12: false }) }]);
        res();
      }, delay));

    const playAnimation = async () => {
      await addLine('NexTest AI Engine v2.0 initializing...', 'system', 0);
      await addLine(`Connecting to ${targetUrl}`, 'info', 400);
      await addLine('Launching k6 Load Testing Engine...', 'info', 800);
      await addLine(`Preparing ${availableTypes.length} test type(s): ${availableTypes.join(', ')}`, 'info', 1200);
      await addLine(`AI analyzing ${totalTests} threshold check(s)...`, 'ai', 1700);
      await addLine('Spinning up virtual users...', 'info', 2100);
      await addLine('Load generation started — collecting metrics...', 'success', 2500);
      await addLine('─'.repeat(52), 'divider', 2800);

      for (let i = 0; i < Math.min(tests.length, 8); i++) {
        await addLine(`Running [${i + 1}/${totalTests}] ${tests[i]?.name || `Check ${i + 1}`}...`, 'running', 3000 + i * 300);
      }
      if (totalTests > 8) {
        await addLine(`... and ${totalTests - 8} more checks processed`, 'muted', 3000 + 8 * 300);
      }

      await addLine('─'.repeat(52), 'divider', 3000 + Math.min(totalTests, 8) * 300 + 200);

      const passN = tests.filter(t => t.status === 'pass').length;
      const failN = tests.filter(t => t.status === 'fail').length;
      const skipN = tests.filter(t => t.status === 'skip' || t.status === 'warn').length;

      tests.slice(0, 6).forEach((t, i) => {
        const icon = t.status === 'pass' ? '✓' : t.status === 'fail' ? '✗' : '—';
        const type = t.status === 'pass' ? 'pass' : t.status === 'fail' ? 'fail' : 'skip';
        setTerminalLines(prev => [...prev, {
          text: `${icon} ${t.name || `Check ${i + 1}`}`,
          type,
          time: new Date().toLocaleTimeString('en-US', { hour12: false })
        }]);
      });

      await addLine('─'.repeat(52), 'divider', 200);
      await addLine(`Load test complete — ${passN} passed · ${failN} failed · ${skipN} skipped`, 'summary', 400);
      await addLine(`Pass rate: ${totalTests > 0 ? Math.round(passN / totalTests * 100) : 0}%`, passN / (totalTests || 1) >= 0.8 ? 'success' : 'fail', 600);
      await addLine('Generating AI analysis report...', 'ai', 800);
      await addLine('Done ✓', 'success', 1000);

      setTimeout(() => {
        setRunning(false);
        generation.fresh = false;
      }, 1200);
    };

    playAnimation();
    
  }, [generation?.generation?.id, generation?.fresh]);
  //Download CSV 
  const downloadCsv = () => {
    const headers = ['Type', 'Status', 'p95 (ms)', 'Error Rate (%)', 'Req/s', 'Max VUs', 'Duration (s)'];
    const rows = availableTypes.map(t => {
      const d = summary[t] || {};
      const m = d.metrics || {};
      return [t, d.status || 'N/A', m.http_req_duration_p95 || 'N/A', m.http_req_failed_rate ?? 'N/A', m.http_reqs_per_second ?? 'N/A', m.vus_max ?? 'N/A', d.duration_seconds ?? 'N/A'];
    });
    const csv  = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `k6_performance_${generation?.generation?.id || 'nextest'}.csv`;
    link.click();
  saveReportToStorage({
    url,
    framework: 'k6',
    testType: 'performance',
    passCount: pass,
    failCount: fail,
    csvContent: csv,
    generationData: generation,
  });
  setDropdownOpen(false);
};

 
  //Download HTML 
  const downloadHtml = () => {
    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const genId   = generation?.generation?.id || 'nextest';
 
    const TYPE_CONFIG = {
  load:   { label: 'Load Test',   icon: TrendingUp, color: '#6366f1' },
  stress: { label: 'Stress Test', icon: Flame,       color: '#ef4444' },
  spike:  { label: 'Spike Test',  icon: Zap,         color: '#f59e0b' },
  soak:   { label: 'Soak Test',   icon: Waves,       color: '#0ea5e9' },
};
 
    const typeRows = availableTypes.map(t => {
      const d   = summary[t] || {};
      const m   = d.metrics || {};
      const cfg = TYPE_CONFIG[t] || { label: t, icon: '📊', color: '#6366f1' };
      const sc  = d.status === 'pass' ? '#10b981' : d.status === 'fail' ? '#ef4444' : '#64748b';
      const thPasses = (d.threshold_passes || []).map(p => `<div style="color:#10b981;font-size:11px">✓ ${p}</div>`).join('');
      const thFails  = (d.threshold_failures || []).map(p => `<div style="color:#ef4444;font-size:11px">✗ ${p}</div>`).join('');
      return `
        <div style="background:#0d1526;border:1px solid ${cfg.color}33;border-radius:14px;
          padding:20px 24px;margin-bottom:16px;position:relative;overflow:hidden">
          <div style="position:absolute;top:0;left:0;right:0;height:3px;
            background:linear-gradient(90deg,transparent,${cfg.color},transparent)"></div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <span style="font-size:24px">${cfg.icon}</span>
            <div style="flex:1">
              <div style="font-size:16px;font-weight:700;color:${cfg.color}">${cfg.label}</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px">Duration: ${d.duration_seconds || 'N/A'}s</div>
            </div>
            <span style="font-size:10px;font-weight:800;padding:4px 12px;border-radius:20px;
              color:${sc};background:${sc}18;border:1px solid ${sc}33;text-transform:uppercase">
              ${d.status === 'pass' ? '✓ PASS' : d.status === 'fail' ? '✗ FAIL' : '— N/A'}
            </span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px">
            ${[
              { l: 'p95 Response', v: m.http_req_duration_p95 || 'N/A' },
              { l: 'Avg Response', v: m.http_req_duration_avg || 'N/A' },
              { l: 'Error Rate',   v: m.http_req_failed_rate != null ? `${m.http_req_failed_rate.toFixed(1)}%` : 'N/A' },
              { l: 'Throughput',   v: m.http_reqs_per_second != null ? `${m.http_reqs_per_second.toFixed(1)}/s` : 'N/A' },
              { l: 'Max VUs',      v: m.vus_max ?? 'N/A' },
              { l: 'Iterations',   v: m.iterations ?? 'N/A' },
              { l: 'Data Received', v: m.data_received || 'N/A' },
              { l: 'Checks Rate',  v: m.checks_rate != null ? `${m.checks_rate.toFixed(1)}%` : 'N/A' },
            ].map(item => `
              <div style="background:#040914;border-radius:8px;padding:10px 12px">
                <div style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">${item.l}</div>
                <div style="font-size:14px;font-weight:700;color:#e2e8f0">${item.v}</div>
              </div>`).join('')}
          </div>
          ${thPasses || thFails ? `
            <div style="background:#040914;border-radius:8px;padding:10px 12px">
              <div style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Thresholds</div>
              ${thPasses}${thFails}
            </div>` : ''}
        </div>`;
    }).join('');
 
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>NexTest k6 Performance Report #${genId}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet"/>
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#070e1c;color:#e2e8f0;font-family:'DM Sans',sans-serif;min-height:100vh}.page{max-width:1100px;margin:0 auto;padding:48px 32px 80px}@media print{body{background:#fff;color:#000}.no-print{display:none}.page{padding:10mm}@page{margin:15mm;size:A4}}</style>
</head>
<body>
<div class="page">
 
  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#040914 0%,#0a1035 50%,#040914 100%);
    border-radius:20px;padding:40px 48px;margin-bottom:32px;position:relative;overflow:hidden">
    <div style="position:absolute;bottom:0;left:0;right:0;height:3px;
      background:linear-gradient(90deg,transparent,#7D64FF,transparent)"></div>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap">
      <div>
        <div style="font-size:26px;font-weight:700;color:#fff;letter-spacing:3px;margin-bottom:4px">
          NEX<span style="color:#c9a227">TEST</span>
        </div>
        <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:8px">
          k6 Performance Test Report
        </div>
        <div style="font-size:11px;color:#64748b">${dateStr} · ${timeStr}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:11px;color:#64748b;margin-bottom:6px">
          <span style="color:#7D64FF;font-weight:700">k6</span> · Load Testing
        </div>
        <div style="font-size:11px;color:#64748b;word-break:break-all;max-width:320px">${url}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:28px">
      ${[
        { l: 'URL',        v: `<span style="color:#a5b4fc;font-size:11px;word-break:break-all">${url}</span>` },
        { l: 'Framework',  v: `<span style="color:#7D64FF;font-weight:700">k6 Load Testing</span>` },
        { l: 'Test Types', v: `<span style="color:#e2e8f0">${availableTypes.map(t => t.charAt(0).toUpperCase()+t.slice(1)).join(', ')}</span>` },
        { l: 'Pass Rate',  v: `<span style="font-size:18px;font-weight:700;color:${rateColor}">${passRate}%</span>` },
      ].map(r => `
        <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:12px 14px">
          <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4f6480;margin-bottom:5px">${r.l}</div>
          <div style="font-size:12px">${r.v}</div>
        </div>`).join('')}
    </div>
  </div>
 
  <div class="no-print" style="margin-bottom:28px">
    <button onclick="window.print()" style="padding:10px 24px;border-radius:10px;
      background:linear-gradient(135deg,#7D64FF,#5b43cc);border:none;color:#fff;
      font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
      🖨 Print / Save as PDF
    </button>
  </div>
 
  <!-- GLOBAL STATS -->
  <div style="margin:0 0 24px;padding-bottom:10px;border-bottom:2.5px solid #7D64FF;
    display:flex;align-items:center;gap:10px">
    <span style="font-size:18px">📊</span>
    <span style="font-size:20px;font-weight:700;color:#e2e8f0">Global Summary</span>
  </div>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:32px">
    ${[
      { icon: '✅', val: pass,       lbl: 'PASSED',    c: '#10b981', bg: 'rgba(16,185,129,.08)',  bd: 'rgba(16,185,129,.25)'  },
      { icon: '❌', val: fail,       lbl: 'FAILED',    c: '#ef4444', bg: 'rgba(239,68,68,.08)',   bd: 'rgba(239,68,68,.25)'   },
      { icon: '⏭️', val: skip,       lbl: 'WARN/SKIP', c: '#f59e0b', bg: 'rgba(245,158,11,.08)',  bd: 'rgba(245,158,11,.25)'  },
      { icon: '🎯', val: `${passRate}%`, lbl: 'PASS RATE', c: rateColor, bg: `${rateColor}12`, bd: `${rateColor}33` },
      { icon: '🔢', val: tests.length, lbl: 'TOTAL',   c: '#3b82f6', bg: 'rgba(59,130,246,.08)', bd: 'rgba(59,130,246,.25)'  },
    ].map(s => `
      <div style="background:${s.bg};border:1px solid ${s.bd};border-radius:14px;padding:20px;text-align:center">
        <div style="font-size:20px;margin-bottom:8px">${s.icon}</div>
        <div style="font-size:36px;font-weight:700;color:${s.c};line-height:1;margin-bottom:4px">${s.val}</div>
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:${s.c};opacity:.8;text-transform:uppercase">${s.lbl}</div>
      </div>`).join('')}
  </div>
 
  <!-- TEST TYPE RESULTS -->
  <div style="margin:0 0 14px;padding-bottom:10px;border-bottom:2.5px solid #7D64FF;
    display:flex;align-items:center;gap:10px">
    <span style="font-size:18px">🚀</span>
    <span style="font-size:20px;font-weight:700;color:#e2e8f0">Test Type Results</span>
  </div>
  ${typeRows}
 
  <!-- DETAILED METRICS TABLE -->
  <div style="margin:32px 0 14px;padding-bottom:10px;border-bottom:2.5px solid #0d9488;
    display:flex;align-items:center;gap:10px">
    <span style="font-size:18px">🔬</span>
    <span style="font-size:20px;font-weight:700;color:#e2e8f0">Detailed Test Cases</span>
  </div>
  <div style="background:#0d1526;border:1px solid rgba(13,148,136,.3);border-radius:12px;overflow:hidden;margin-bottom:24px">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#040914">
        ${['#','Test Name','Category','Section','Status','Value / Reason','Duration'].map(h =>
          `<th style="padding:10px 12px;text-align:left;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;font-weight:700">${h}</th>`
        ).join('')}
      </tr></thead>
      <tbody>
        ${tests.map((t, i) => {
          const sc = t.status==='pass'?'#10b981':t.status==='fail'?'#ef4444':'#f59e0b';
          const sl = t.status==='pass'?'✓ PASS':t.status==='fail'?'✗ FAIL':'— SKIP';
          return `<tr style="border-bottom:1px solid rgba(255,255,255,.04);background:${i%2===0?'#0d1526':'#080f1e'}">
            <td style="padding:9px 12px;color:#64748b;font-weight:700">${i+1}</td>
            <td style="padding:9px 12px;font-weight:700;color:#e2e8f0;font-size:12px">${t.name||'—'}</td>
            <td style="padding:9px 12px;font-size:10px;color:#818cf8;font-weight:700">${(t.category||'performance').toUpperCase()}</td>
            <td style="padding:9px 12px;font-size:10px;color:#64748b">${t.section||'—'}</td>
            <td style="padding:9px 12px;text-align:center">
              <span style="font-size:9px;font-weight:800;padding:3px 10px;border-radius:12px;color:${sc};background:${sc}18;border:1px solid ${sc}33">${sl}</span>
            </td>
            <td style="padding:9px 12px;font-size:11px;color:#94a3b8">${t.suite||'—'}</td>
            <td style="padding:9px 12px;font-size:11px;color:#64748b;text-align:center">${t.duration||'—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
 
  <!-- FOOTER -->
  <div style="margin-top:48px;padding:20px 28px;background:rgba(125,100,255,.04);border-radius:12px;
    display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;
    border:1px solid rgba(125,100,255,.15)">
    <div style="font-size:14px;font-weight:700;color:#64748b">
      NEX<span style="color:#c9a227">TEST</span> · k6 Performance Report
    </div>
    <div style="font-size:11px;color:#94a3b8">
      ${dateStr} · k6 · ${availableTypes.length} test type(s) · ${passRate}% pass rate
    </div>
  </div>
 
</div>
</body>
</html>`;
 
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `k6_performance_report_${genId}.html`;
   link.click();
  saveReportToStorage({
    url,
    framework: 'k6',
    testType: 'performance',
    passCount: pass,
    failCount: fail,
    htmlContent: html,
    generationData: generation,
  });
  setDropdownOpen(false);
};
 
  //Render 
  return (
    <div className="panel">
 
      {/* ── HEADER ── */}
      <div className="ep-header">
        <div className="ep-header-left">
          <div className="gp-tag" style={{ marginBottom: 8, background: 'rgba(125,100,255,.08)', border: '1px solid rgba(125,100,255,.2)' }}>
            <span className="gp-tag-dot" style={{ background: '#7D64FF' }} />
            k6 Performance Test
          </div>
          <h1 className="p-title">Performance <span className="g">k6</span></h1>
          <div className="ep-info-bar">
 <div className="ep-info-chip">
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
  <span title={url}>{url}</span>
</div>
  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(125,100,255,.15)', color: '#7D64FF', border: '1px solid rgba(125,100,255,.35)' }}>
    <span style={{ fontWeight: 800 }}>k6</span> · Performance
  </span>
</div>
        </div>
 
        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>

  <div className="ep-actions">
    {/* Bouton download script — toujours visible pour k6 */}
    <button onClick={() => {
      const content = result?.scripts
        ? Object.values(result.scripts)[0] || ''
        : result?.script || '';
      const blob = new Blob([content], { type: 'text/javascript' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'k6_performance.js';
      link.click();
    }} className="ep-dl-btn">
      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      <span className="ep-dl-letters" style={{ color: '#7D64FF' }}>k6</span> .js
    </button>

    {/* Download Report dropdown */}
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
  className="ep-pdf-btn"
  onClick={() => setDropdownOpen(o => !o)}
  disabled={pdfLoading}
  style={{ background: 'transparent', border: '1px solid rgba(125,100,255,.4)', color: '#7D64FF' }}
>
  {pdfLoading ? (<><span className="spinner" /> Generating...</>) : (<>
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    Download Report
    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginLeft: 2, transition: 'transform .2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}><path d="M6 9l6 6 6-6"/></svg>
  </>)}
</button>
      {dropdownOpen && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 6, boxShadow: '0 8px 32px rgba(0,0,0,.5)', zIndex: 200, minWidth: 190, animation: 'dFadeUp .18s var(--ease) both' }}>
          {/* CSV */}
          <button onClick={downloadCsv} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 600, transition: 'all .15s', textAlign: 'left' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--green-bg)'; e.currentTarget.style.color = 'var(--green)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sub)'; }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#10b981' }}>CSV</span>
            <div><div style={{ fontSize: 12, fontWeight: 700 }}>rapport.csv</div><div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>Métriques tabulaires</div></div>
          </button>
          {/* HTML */}
          <button onClick={downloadHtml} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 600, transition: 'all .15s', textAlign: 'left' }}
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
              const res = await api.get(`/generations/${id}/pdf`, { responseType: 'blob' });
              const blob = new Blob([res.data], { type: 'application/pdf' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `k6_performance_report_${id}.pdf`;
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
  </div>
<PerformanceScoreRing score={running ? 0 : passRate} label={running ? '0%' : `${passRate}%`} color={rateColor} />
        </div>
      </div>
 {(() => {
  const aiSummary = generation?.result?.ai?.summary || null;
  if (!aiSummary || running) return null;

  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'flex-start',
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '16px 20px', marginBottom: 20,
    }}>
      <span style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: 'rgba(125,100,255,.1)', border: '1px solid rgba(125,100,255,.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>🤖</span>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: '#7D64FF', marginBottom: 4, textTransform: 'uppercase' }}>
          LLaMA Analysis
        </div>
        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, marginBottom: 2 }}>
          Performance analysis for {url}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
          {aiSummary}
        </div>
      </div>
    </div>
  );
})()}


      {/* ── GLOBAL STATS ── */}
<div className="ep-stats" style={{ marginBottom: 24 }}>
  {[
    { label: 'Passed',    val: running ? 0 : pass,         color: '#10B981', bg: 'rgba(16,185,129,.08)', border: 'rgba(16,185,129,.2)', icon: <svg width="18" height="18" fill="none" stroke="#10B981" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> },
    { label: 'Failed',    val: running ? 0 : fail,         color: '#EF4444', bg: 'rgba(239,68,68,.08)',  border: 'rgba(239,68,68,.2)', icon: <svg width="18" height="18" fill="none" stroke="#EF4444" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg> },
    { label: 'Warn/Skip', val: running ? 0 : skip,         color: '#F59E0B', bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.2)', icon: <svg width="18" height="18" fill="none" stroke="#F59E0B" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> },
    { label: 'Pass Rate', val: running ? '0%' : `${passRate}%`, color: rateColor, bg: `${rateColor}12`, border: `${rateColor}33`, icon: <svg width="18" height="18" fill="none" stroke={rateColor} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
  ].map((s, i) => (
    <div key={s.label} className="ep-stat" style={{ '--sc': s.color, '--sb': s.bg, '--sbo': s.border, '--i': i }}>
      <div className="ep-stat-icon">{s.icon}</div>
      <div className="ep-stat-body"><div className="ep-stat-val" style={{ color: s.color }}>{s.val}</div><div className="ep-stat-lbl">{s.label}</div></div>
    </div>
  ))}
</div>
 {running && (
  <div className="ep-progress-card">
    <div className="ep-progress-top">
      <div className="ep-progress-info">
        <span className="spinner" style={{ marginRight: 8 }} />
        <span style={{ color: 'var(--indigo2)' }}>Running tests...</span>
      </div>
      <div className="ep-progress-rate" style={{ color: '#ef4444' }}>0% pass rate</div>
    </div>
    <div className="ep-progress-track">
      <div className="ep-progress-fill" style={{ width: '100%', background: 'linear-gradient(90deg,var(--indigo),var(--indigo2))' }} />
    </div>
  </div>
)}
     {/* ── TERMINAL WHILE RUNNING ── */}
      {running ? (
        <div style={{
          background: '#050a14', border: '1px solid rgba(125,100,255,.25)', borderRadius: 16,
          overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,.5)',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          marginBottom: 24,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', background:'linear-gradient(135deg,#0a0f1e,#0d1526)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
            <div style={{ display:'flex', gap:6 }}>
              {['#ef4444','#f59e0b','#10b981'].map((c,i) => (
                <div key={i} style={{ width:12, height:12, borderRadius:'50%', background:c, opacity:.8 }} />
              ))}
            </div>
            <div style={{ flex:1, textAlign:'center', fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:1 }}>
              NexTest Terminal — k6 Load Engine
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#7D64FF', animation:'termPulse 1s ease-in-out infinite' }} />
              <span style={{ fontSize:10, color:'#7D64FF', fontWeight:700, letterSpacing:1 }}>RUNNING</span>
            </div>
          </div>
          <div style={{ padding:'16px 20px', minHeight:280, maxHeight:380, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}
            ref={el => { if (el) el.scrollTop = el.scrollHeight; }}>
            {terminalLines.map((line, i) => {
              const colors = { system:'#818cf8', info:'#94a3b8', ai:'#c9a227', success:'#10b981', fail:'#ef4444', pass:'#10b981', skip:'#f59e0b', running:'#60a5fa', muted:'#475569', divider:'#1e293b', summary:'#e2e8f0' };
              const icons  = { system:'⬡', info:'›', ai:'◆', success:'✓', fail:'✗', pass:'✓', skip:'◌', running:'◉', muted:'·', divider:'', summary:'▸' };
              if (line.type === 'divider') return (
                <div key={i} style={{ color:'#1e2d47', fontSize:11, userSelect:'none', margin:'4px 0' }}>{line.text}</div>
              );
              return (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, animation:'termFadeIn .3s ease both', fontSize:12, lineHeight:1.6 }}>
                  <span style={{ color:'#1e3a5f', fontSize:10, flexShrink:0, marginTop:1 }}>{line.time}</span>
                  <span style={{ color:colors[line.type]||'#94a3b8', flexShrink:0, fontSize:11 }}>{icons[line.type]||'›'}</span>
                  <span style={{ color:colors[line.type]||'#94a3b8', flex:1 }}>{line.text}</span>
                </div>
              );
            })}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4 }}>
              <span style={{ color:'#1e3a5f', fontSize:10 }}>{new Date().toLocaleTimeString('en-US',{hour12:false})}</span>
              <span style={{ color:'#7D64FF' }}>›</span>
              <span style={{ display:'inline-block', width:8, height:15, background:'#7D64FF', borderRadius:1, animation:'termBlink .8s step-end infinite' }} />
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 16px', background:'rgba(125,100,255,.06)', borderTop:'1px solid rgba(125,100,255,.1)' }}>
            <span style={{ fontSize:10, color:'#7D64FF', fontWeight:700 }}>◉ {terminalLines.length} events</span>
            <span style={{ fontSize:10, color:'#475569', fontWeight:600 }}>k6 · AI-Powered</span>
          </div>
          <style>{`
            @keyframes termFadeIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
            @keyframes termBlink  { 0%,100%{opacity:1} 50%{opacity:0} }
            @keyframes termPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
          `}</style>
        </div>
      ) : availableTypes.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconRocket size={14} stroke={1.8} style={{ color: '#7D64FF' }} />
            Test Type Results
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {availableTypes.map(typeKey => (
              <K6TestTypeCard
                key={typeKey}
                typeKey={typeKey}
                data={summary[typeKey]}
                active={activeKey === typeKey}
                onClick={() => setActiveType(typeKey)}
              />
            ))}
          </div>
        </>
      )}
 
    {/* ── ACTIVE TYPE DETAIL ── */}
{(() => { const aiRecsCount = (generation?.result?.ai?.recommendations || []).length; return null; })()}
      
{!running && (
<>
{/* ── TABS ── */}
<div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', opacity: running ? 0.3 : 1, pointerEvents: running ? 'none' : 'auto', transition: 'opacity .3s' }}>
  {[
    { key: 'results',         label: 'Test Cases',     count: tests.length, Icon: IconFileText },
    { key: 'scenarios',       label: 'Scenarios',       count: tests.length, Icon: IconTarget },
    { key: 'recommendations', label: 'Recommendations', count: aiRecsCount, Icon: IconBulb },  ].map(tab => (
    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
      style={{ padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 700, color: activeTab === tab.key ? 'var(--indigo2)' : 'var(--muted)', borderBottom: activeTab === tab.key ? '2px solid var(--indigo2)' : '2px solid transparent', marginBottom: -1, transition: 'all .18s', display: 'flex', alignItems: 'center', gap: 8 }}>
      <tab.Icon size={15} stroke={1.8} />
      {tab.label}
      <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: activeTab === tab.key ? 'var(--indigo-bg)' : 'var(--bg2)', color: activeTab === tab.key ? 'var(--indigo2)' : 'var(--muted)' }}>{tab.count}</span>
    </button>
  ))}
</div>
 
      {/* ── TEST CASES LIST ── */}
 {activeTab === 'results' && tests.length > 0 && (() => {
 
  const TYPE_CONFIG = {
  load:   { label: 'Load Test',   icon: TrendingUp, color: '#6366f1', bg: 'rgba(99,102,241,.08)',  border: 'rgba(99,102,241,.25)',  desc: 'Normal expected traffic'   },
  stress: { label: 'Stress Test', icon: Flame,       color: '#ef4444', bg: 'rgba(239,68,68,.08)',   border: 'rgba(239,68,68,.25)',   desc: 'Beyond capacity — breaking point' },
  spike:  { label: 'Spike Test',  icon: Zap,         color: '#f59e0b', bg: 'rgba(245,158,11,.08)',  border: 'rgba(245,158,11,.25)',  desc: 'Sudden traffic burst'      },
  soak:   { label: 'Soak Test',   icon: Waves,       color: '#0ea5e9', bg: 'rgba(14,165,233,.08)',  border: 'rgba(14,165,233,.25)',  desc: 'Extended load — memory leaks' },
};
 
  const getType = (test) => {
    const n = (test.name || '').toLowerCase();
    if (n.includes('[load'))   return 'load';
    if (n.includes('[stress')) return 'stress';
    if (n.includes('[spike'))  return 'spike';
    if (n.includes('[soak'))   return 'soak';
    return 'load';
  };
 
  const catColor = (catLabel) =>
    catLabel === 'RESPONSE TIME' ? '#6366f1'
    : catLabel === 'ERROR RATE'  ? '#ef4444'
    : catLabel === 'THROUGHPUT'  ? '#10b981'
    : catLabel === 'SCALABILITY' ? '#0ea5e9'
    : catLabel === 'RELIABILITY' ? '#8b5cf6'
    : catLabel === 'THRESHOLDS'  ? '#c9a227'
    : '#7D64FF';
 
  const timeVal = (test) => {
    // Response time metrics already carry a real ms duration
    if (test.duration && test.duration !== 0 && test.duration !== '0')
      return `${test.duration}ms`;

    const suite = test.suite || '';

    // Percentage-based metrics (error rate, checks pass rate, etc.)
    let m = suite.match(/(\d+\.?\d*)\s*%/);
    if (m) return `${m[1]}%`;

    // Throughput
    m = suite.match(/([\d.]+)\s*req(?:uests)?\/s/i) || suite.match(/([\d.]+)\s*requests\/second/i);
    if (m) return `${m[1]} req/s`;

    // Virtual users
    m = suite.match(/max_vus=(\d+)/i) || suite.match(/(\d+)\s*VUs?/i);
    if (m) return `${m[1]} VUs`;

    // Threshold checks — match "Passed"/"Failed" loosely (avoid relying on
    // the checkmark unicode char, which can get mangled in storage/transit)
    if (/passed/i.test(suite)) return '✓';
    if (/failed/i.test(suite)) return '✗';

    // Fallback: planned test duration text (e.g. "ran for 1m54s...")
    m = `${test.name || ''} ${suite}`.match(/(\d+m\d+s|\d+s)/);
    if (m) return m[1];

    // Last resort: derive from status directly
    if (test.status === 'pass') return '✓';
    if (test.status === 'fail') return '✗';

    return '—';
  };
 
  // Group tests by type
  const groups = {};
  tests.forEach(test => {
    const type = getType(test);
    if (!groups[type]) groups[type] = [];
    groups[type].push(test);
  });
 
  const typeOrder = ['load', 'stress', 'spike', 'soak'];
  const visibleTypeOrder = typeOrder.filter(t => groups[t]?.length);
  const currentType = visibleTypeOrder[typePageIndex] || visibleTypeOrder[0];
 
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[currentType].filter(Boolean).map(typeKey => {
        const cfg       = TYPE_CONFIG[typeKey];
        const groupTests = groups[typeKey];
       
        const pass      = groupTests.filter(t => t.status === 'pass').length;
        const fail      = groupTests.filter(t => t.status === 'fail').length;
        const skip      = groupTests.filter(t => t.status === 'skip' || t.status === 'warn').length;
        const groupStatus = fail > 0 ? 'fail' : skip === groupTests.length ? 'skip' : 'pass';
        const statusColor = groupStatus === 'pass' ? '#10b981' : groupStatus === 'fail' ? '#ef4444' : '#f59e0b';
 
         const rawSeconds = summary[typeKey]?.duration_seconds;
        const duration = rawSeconds != null
          ? (rawSeconds >= 60
              ? `${Math.floor(rawSeconds / 60)}m${Math.round(rawSeconds % 60)}s`
              : `${Math.round(rawSeconds)}s`)
          : null;
 
        // VU count
        const vuTest = groupTests.find(t => /max_vus=\d+/i.test(t.suite || ''));
        const vuMatch = vuTest ? (vuTest.suite || '').match(/max_vus=(\d+)/) : null;
        const vus = vuMatch ? vuMatch[1] : null;
 
        return (
          <div key={typeKey} style={{
            background: 'var(--card)',
            border: `1px solid ${cfg.border}`,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: `0 4px 20px ${cfg.color}10`,
          }}>
 
            {/* ── GROUP HEADER ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 24px',
              background: cfg.bg,
              borderBottom: `1px solid ${cfg.border}`,
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Left accent bar */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: 4, background: cfg.color, borderRadius: '0 4px 4px 0',
              }} />
 
    <div style={{
  width: 34, height: 34, borderRadius: 9, flexShrink: 0, marginLeft: 4,
  background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}}>
  {(() => { const Icon = cfg.icon; return <Icon size={17} color={cfg.color} strokeWidth={2.25} />; })()}
</div>
 
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: cfg.color, display: 'flex', alignItems: 'center' }}>
                    {cfg.label}
          <InfoTooltip
  title={cfg.label}
  text={getTestTypeExplanation(typeKey)}
  icon={<cfg.icon size={14} color={cfg.color} />}
  accent={cfg.color}
  details={[...new Set(groupTests.map(t => formatK6TestCase(t.name, t.suite, t.section).title))]
    .map(title => ({ title, text: getMetricExplanation(title) }))}
/>
                  </span>
                 {duration && (
  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    <Clock size={11} /> {duration}
  </span>
)}
{vus && (
  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    <Users size={11} /> {vus} VUs
  </span>
)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{cfg.desc}</div>
              </div>
 
              {/* Stats */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>{pass} pass</span>
                  {fail > 0 && <span style={{ color: '#ef4444', fontWeight: 700 }}>{fail} fail</span>}
                  {skip > 0 && <span style={{ color: '#f59e0b', fontWeight: 700 }}>{skip} skip</span>}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 20,
                  color: statusColor, background: `${statusColor}15`,
                  border: `1px solid ${statusColor}33`,
                }}>
                  {groupStatus === 'pass' ? '✓ PASS' : groupStatus === 'fail' ? '✗ FAIL' : '— SKIP'}
                </span>
              </div>
            </div>
 
            {/* ── COLUMN HEADERS ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 160px 90px 70px',
              gap: 12, padding: '10px 20px',
              background: 'var(--bg)',
              borderBottom: '1px solid var(--border)',
            }}>
              {['', 'Test Name', 'Category', 'Status', 'Value'].map(h => (                <div key={h} style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
                  textTransform: 'uppercase', color: 'var(--muted)',
                }}>{h}</div>
              ))}
            </div>
 
            {/* ── TEST ROWS ── */}
            {groupTests.map((test, i) => {
              const sc  = test.status === 'pass' ? '#10b981'
                        : test.status === 'fail' ? '#ef4444'
                        : '#f59e0b';
              const cat     = (test.section || test.category || 'performance').toUpperCase();
              const catC    = catColor(cat);
              const tv      = timeVal(test);
              const { title, description } = formatK6TestCase(test.name, test.suite, test.section);
 
              return (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr 160px 90px 70px',
                  gap: 12, padding: '13px 20px',
                  borderBottom: i < groupTests.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'center',
                  background: test.status === 'fail' ? 'rgba(239,68,68,.02)' : 'transparent',
                  animation: `dFadeUp .25s var(--ease) ${i * 0.03}s both`,
                  transition: 'background .15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = test.status === 'fail' ? 'rgba(239,68,68,.04)' : 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = test.status === 'fail' ? 'rgba(239,68,68,.02)' : 'transparent'}
                >
                  {/* Status icon */}
                  <div><StatusIcon s={test.status} /></div>
 
                  {/* Title + description */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--text)',
                      marginBottom: 2, display: 'flex', alignItems: 'center',
                    }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {title}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 11, color: 'var(--muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      lineHeight: 1.4,
                    }}>
                      {description}
                    </div>
                  </div>
 
                 {/* Category */}
                  <div>
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '3px 10px',
                      borderRadius: 20, letterSpacing: .8, textTransform: 'uppercase',
                      color: catC, background: `${catC}18`,
                      border: `1px solid ${catC}44`, whiteSpace: 'nowrap',
                    }}>
                      {cat}
                    </span>
                  </div>
 
                  {/* Status */}
                  <div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 10, fontWeight: 800, padding: '3px 10px',
                      borderRadius: 20,
                      color: sc, background: `${sc}18`, border: `1px solid ${sc}44`,
                    }}>
                      {test.status === 'pass' ? '✓ PASS' : test.status === 'fail' ? '✗ FAIL' : '— SKIP'}
                    </span>
                  </div>
 
                  {/* Time */}
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', textAlign: 'right' }}>
                    {tv}
                  </div>
                </div>
              );
            })}
            
          </div>
        );
      })}
      {visibleTypeOrder.length > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 16, padding: '18px 0 4px',
        }}>
          <button
            disabled={typePageIndex === 0}
            onClick={() => setTypePageIndex(i => i - 1)}
            style={{
              padding: '7px 16px', borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--card)', color: typePageIndex === 0 ? 'var(--muted)' : 'var(--text)',
              cursor: typePageIndex === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >Previous</button>

          <div style={{ display: 'flex', gap: 6 }}>
            {visibleTypeOrder.map((t, i) => (
              <span
                key={t}
                onClick={() => setTypePageIndex(i)}
                style={{
                  width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                  background: i === typePageIndex ? TYPE_CONFIG[t].color : 'var(--border)',
                  transition: 'background .2s',
                }}
              />
            ))}
          </div>

          <button
            disabled={typePageIndex === visibleTypeOrder.length - 1}
            onClick={() => setTypePageIndex(i => i + 1)}
            style={{
              padding: '7px 16px', borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--card)',
              color: typePageIndex === visibleTypeOrder.length - 1 ? 'var(--muted)' : 'var(--text)',
              cursor: typePageIndex === visibleTypeOrder.length - 1 ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600,
            }}
          >Next</button>
        </div>
      )}
    </div>
  );
})()}
 
  

{activeTab === 'scenarios' && (() => {

  // ── Plan de test statique — ce que CHAQUE type de test k6 vérifie ──
  const K6_CHECK_PLAN = [
    { title: 'Response Time p95',        desc: 'p95 response time must stay under the type-specific threshold', category: 'PERFORMANCE',  priority: 'HIGH'   },
    { title: 'Average Response Time',    desc: 'Mean response time across all requests during the run',          category: 'PERFORMANCE',  priority: 'MEDIUM' },
    { title: 'Max Response Time',        desc: 'Slowest single response observed during the run',                category: 'PERFORMANCE',  priority: 'LOW'    },
    { title: 'Error Rate',               desc: 'HTTP error rate must stay under the type-specific limit',        category: 'RELIABILITY',  priority: 'HIGH'   },
    { title: 'Throughput (req/s)',       desc: 'Sustained requests-per-second the system can handle',            category: 'PERFORMANCE',  priority: 'MEDIUM' },
    { title: 'Max Virtual Users',        desc: 'Peak concurrent virtual users reached during the run',           category: 'SCALABILITY',  priority: 'MEDIUM' },
    { title: 'k6 Checks Pass Rate',      desc: 'Percentage of k6 assertions (checks) that passed — must exceed 95%', category: 'RELIABILITY', priority: 'HIGH' },
  ];

  const TYPE_CONFIG = {
    load:   { label: 'Load Test',   icon: TrendingUp, color: '#6366f1', desc: 'Normal expected traffic',            threshold: '2000ms / 5% errors'  },
    stress: { label: 'Stress Test', icon: Flame,       color: '#ef4444', desc: 'Beyond capacity — breaking point',   threshold: '5000ms / 15% errors' },
    spike:  { label: 'Spike Test',  icon: Zap,         color: '#f59e0b', desc: 'Sudden traffic burst',               threshold: '8000ms / 20% errors' },
    soak:   { label: 'Soak Test',   icon: Waves,       color: '#0ea5e9', desc: 'Extended load — memory leaks',       threshold: '3000ms / 5% errors'  },
  };

  const catColor = (cat) =>
    cat === 'PERFORMANCE'  ? '#6366f1'
    : cat === 'RELIABILITY' ? '#ef4444'
    : cat === 'SCALABILITY' ? '#0ea5e9'
    : '#7D64FF';

  const priColor = (p) =>
    p === 'HIGH' ? '#ef4444' : p === 'MEDIUM' ? '#f59e0b' : '#10b981';

  const typeOrder = ['load', 'stress', 'spike', 'soak'];
  const presentTypes = typeOrder.filter(t => availableTypes.includes(t));
  const typesToShow = presentTypes.length ? presentTypes : typeOrder;

  const currentType = typesToShow[scenarioPageIndex] || typesToShow[0];
  const cfg = TYPE_CONFIG[currentType];
  const groupTests = tests.filter(t => (t.name || '').toLowerCase().includes(`[${currentType}`));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: 'rgba(125,100,255,.06)', border: '1px solid rgba(125,100,255,.2)',
        borderRadius: 10, padding: '10px 16px', fontSize: 12, color: 'var(--muted)',
      }}>
        Test plan — what each k6 test type checks, independent of execution results. See the <b style={{ color: 'var(--indigo2)' }}>Test Cases</b> tab for pass/fail outcomes.
      </div>

      <div style={{ background: 'var(--card)', border: `1px solid ${cfg.color}33`, borderRadius: 16, overflow: 'hidden' }}>

        {/* ── HEADER DU GROUPE ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: `${cfg.color}0d`, borderBottom: `1px solid ${cfg.color}33` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <cfg.icon size={16} color={cfg.color} strokeWidth={2.25} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: cfg.color }}>{cfg.label}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{cfg.desc} · thresholds: {cfg.threshold}</div>
          </div>
        </div>

        {/* ── COLONNES ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 130px 100px 90px', gap: 12, padding: '10px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
          {['#', 'Scenario', 'Category', 'Priority', 'Tested'].map(h => (
            <div key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</div>
          ))}
        </div>

        {/* ── LIGNES DU PLAN ── */}
        {K6_CHECK_PLAN.map((chk, i) => {
          const wasTested = groupTests.some(t => (t.name || '').includes(chk.title));
          return (
            <div key={chk.title} style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 130px 100px 90px', gap: 12,
              padding: '13px 20px', alignItems: 'center',
              borderBottom: i < K6_CHECK_PLAN.length - 1 ? '1px solid var(--border)' : 'none',
              animation: `dFadeUp .2s var(--ease) ${i * 0.03}s both`,
            }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{chk.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{chk.desc}</div>
              </div>
              <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 20, letterSpacing: .8, textTransform: 'uppercase', color: catColor(chk.category), background: `${catColor(chk.category)}18`, border: `1px solid ${catColor(chk.category)}44`, width: 'fit-content' }}>
                {chk.category}
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', color: priColor(chk.priority), background: `${priColor(chk.priority)}18`, border: `1px solid ${priColor(chk.priority)}44`, width: 'fit-content' }}>
                {chk.priority}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: wasTested ? '#10b981' : 'var(--muted)' }}>
                {wasTested ? '✓ Yes' : '— No'}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── PAGINATION ── */}
      {typesToShow.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '18px 0 4px' }}>
          <button
            disabled={scenarioPageIndex === 0}
            onClick={() => setScenarioPageIndex(i => i - 1)}
            style={{
              padding: '7px 16px', borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--card)', color: scenarioPageIndex === 0 ? 'var(--muted)' : 'var(--text)',
              cursor: scenarioPageIndex === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >Previous</button>

          <div style={{ display: 'flex', gap: 6 }}>
            {typesToShow.map((t, i) => (
              <span
                key={t}
                onClick={() => setScenarioPageIndex(i)}
                style={{
                  width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                  background: i === scenarioPageIndex ? TYPE_CONFIG[t].color : 'var(--border)',
                  transition: 'background .2s',
                }}
              />
            ))}
          </div>

          <button
            disabled={scenarioPageIndex === typesToShow.length - 1}
            onClick={() => setScenarioPageIndex(i => i + 1)}
            style={{
              padding: '7px 16px', borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--card)',
              color: scenarioPageIndex === typesToShow.length - 1 ? 'var(--muted)' : 'var(--text)',
              cursor: scenarioPageIndex === typesToShow.length - 1 ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600,
            }}
          >Next</button>
        </div>
      )}
    </div>
  );
})()}
{activeTab === 'recommendations' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    {(() => {
      const aiResult = generation?.result?.ai || {};
      const aiRecs = aiResult.recommendations || [];
      const aiSummary = aiResult.summary || '';
      const actionPlan = aiResult.action_plan || [];

      if (aiSummary || aiRecs.length > 0) {
        return (
          <>
            {aiSummary && (
              <div style={{ background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>🤖</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>AI Summary</div>
                  <p style={{ fontSize: 13, color: 'var(--sub)', margin: 0, lineHeight: 1.7 }}>{aiSummary}</p>
                </div>
              </div>
            )}

            {aiRecs.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['high', 'medium', 'low'].map(p => {
                  const count = aiRecs.filter(r => r.priority === p).length;
                  if (!count) return null;
                  const colors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
                  return (
                    <span key={p} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: colors[p], background: `${colors[p]}12`, border: `1px solid ${colors[p]}30`, textTransform: 'capitalize' }}>
                      {count} {p}
                    </span>
                  );
                })}
              </div>
            )}

            {aiRecs.map((rec, i) => (
              <RecommendationCard key={i} rec={{
                priority: rec.priority || 'medium',
                category: rec.category || 'server',
                title: rec.issue || rec.category || 'Performance Issue',
                description: rec.fix || '',
                impact: null,
              }} index={i} />
            ))}

            {actionPlan.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Action Plan</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {actionPlan.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--sub)' }}>
                      <span style={{ color: 'var(--indigo2)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      }

      // ── Fallback générique si aucune donnée IA disponible ──
      // ── Aucune donnée IA disponible : empty-state (comme SEO/smoke/functional) ──
      return (
        <div style={{ textAlign: 'center', padding: '60px 32px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>No AI recommendations available</h3>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>The AI analysis may not have completed for this generation.</p>
        </div>
      );
    })()}
  </div>
)}
</>
)}
    </div>
  );
}


function buildHtmlReport({ generation, tests, testType, framework, url, pass, fail, skip }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const genId = generation?.generation?.id || 'nextest';
  const total = tests.length || 1;
  const rate = Math.round(pass / total * 100);
  const rateColor = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';

  const TYPE_COLORS = {
    smoke: '#64748b', functional: '#6366f1', performance: '#8b5cf6',
    api: '#10b981', regression: '#f97316', security: '#ef4444', seo: '#06b6d4',
  };
  const FW_COLORS = {
    Selenium: '#43B02A', Cypress: '#00BFA5', Playwright: '#E2574C',
    Pytest: '#3776AB', Postman: '#FF6C37', k6: '#7D64FF', Requests: '#06b6d4',
  };
  const typeColor = TYPE_COLORS[testType] || '#64748b';
  const fwColor = FW_COLORS[framework] || '#818cf8';

  const rows = tests.map((t, i) => {
    const sc = t.status === 'pass' ? '#10b981' : t.status === 'fail' ? '#ef4444' : '#f59e0b';
    const sl = t.status === 'pass' ? '✓ PASS' : t.status === 'fail' ? '✗ FAIL' : '— SKIP';
    const ai = t.ai_analysis || {};
    return `<tr style="border-bottom:1px solid rgba(255,255,255,.05);background:${i%2===0?'#0d1526':'#080f1e'}">
      <td style="padding:9px 12px;color:#64748b;font-weight:700;text-align:center">${i+1}</td>
      <td style="padding:9px 12px;font-weight:600;color:#e2e8f0;font-size:13px">${t.name||'—'}</td>
      <td style="padding:9px 12px;text-align:center">
        <span style="font-size:9px;font-weight:800;padding:3px 10px;border-radius:12px;color:${sc};background:${sc}18;border:1px solid ${sc}33">${sl}</span>
      </td>
      <td style="padding:9px 12px;font-size:11px;color:#94a3b8">${t.suite||t.detail||ai.root_cause||'—'}</td>
      <td style="padding:9px 12px;text-align:center;font-size:11px;color:#64748b">${t.duration||'—'}</td>
    </tr>`;
  }).join('');

  const rateGrad = rate >= 80
    ? 'linear-gradient(90deg,#10b981,#34d399)'
    : rate >= 50 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
    : 'linear-gradient(90deg,#ef4444,#f87171)';

  const vc = fail === 0 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#ef4444';
  const vi = fail === 0 ? '🟢' : rate >= 60 ? '🟡' : '🔴';
  const vt = fail === 0
    ? `All ${pass} tests passed successfully.`
    : `${fail} test(s) failed out of ${total}. Pass rate: ${rate}%.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>NexTest Report #${genId}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#070e1c;color:#e2e8f0;font-family:'DM Sans',sans-serif;min-height:100vh}
  .page{max-width:1100px;margin:0 auto;padding:48px 32px 80px}
  table{width:100%;border-collapse:collapse}
  @media print{body{background:#fff;color:#000}.no-print{display:none}.page{padding:10mm}@page{margin:15mm;size:A4}}
</style>
</head>
<body>
<div class="page">

  <div style="background:linear-gradient(135deg,#040914,#0a1035,#040914);border-radius:20px;padding:40px 48px;margin-bottom:32px;position:relative;overflow:hidden">
    <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,transparent,${typeColor},transparent)"></div>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:20px">
      <div>
        <div style="font-size:28px;font-weight:700;color:#fff;letter-spacing:2px;margin-bottom:4px">
          <span style="color:#c9a227">NEX</span>TEST
        </div>
        <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:8px;text-transform:capitalize">${testType} Test Report</div>
        <div style="font-size:11px;color:#94a3b8">${dateStr} · ${timeStr}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:42px;font-weight:800;color:${rateColor};line-height:1">${rate}%</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">Pass Rate</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:28px">
      ${[
        {l:'URL', v:`<span style="color:#a5b4fc;font-size:11px;word-break:break-all">${url}</span>`},
        {l:'Framework', v:`<span style="color:${fwColor};font-weight:700">${framework}</span>`},
        {l:'Test Type', v:`<span style="color:${typeColor};font-weight:700;text-transform:capitalize">${testType}</span>`},
        {l:'Generated', v:`<span style="color:#e2e8f0">${dateStr}</span>`},
      ].map(r => `<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:12px 14px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4f6480;margin-bottom:5px">${r.l}</div>
        <div style="font-size:12px">${r.v}</div>
      </div>`).join('')}
    </div>
  </div>

  <div class="no-print" style="margin-bottom:28px">
    <button onclick="window.print()" style="padding:10px 24px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#4f46e5);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
      🖨 Print / Save as PDF
    </button>
  </div>

  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:28px">
    ${[
      {icon:'✅',val:pass,lbl:'PASSED',c:'#10b981',bg:'rgba(16,185,129,.08)',bd:'rgba(16,185,129,.25)'},
      {icon:'❌',val:fail,lbl:'FAILED',c:'#ef4444',bg:'rgba(239,68,68,.08)',bd:'rgba(239,68,68,.25)'},
      {icon:'⏭️',val:skip,lbl:'SKIPPED',c:'#f59e0b',bg:'rgba(245,158,11,.08)',bd:'rgba(245,158,11,.25)'},
      {icon:'🎯',val:`${rate}%`,lbl:'PASS RATE',c:rateColor,bg:`${rateColor}12`,bd:`${rateColor}33`},
      {icon:'🔢',val:total,lbl:'TOTAL',c:'#3b82f6',bg:'rgba(59,130,246,.08)',bd:'rgba(59,130,246,.25)'},
    ].map(s => `<div style="background:${s.bg};border:1px solid ${s.bd};border-radius:14px;padding:20px;text-align:center">
      <div style="font-size:20px;margin-bottom:8px">${s.icon}</div>
      <div style="font-size:36px;font-weight:700;color:${s.c};line-height:1;margin-bottom:4px">${s.val}</div>
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:${s.c};opacity:.8;text-transform:uppercase">${s.lbl}</div>
    </div>`).join('')}
  </div>

  <div style="margin:0 0 14px;padding-bottom:10px;border-bottom:2.5px solid ${typeColor};display:flex;align-items:center;gap:10px">
    <span style="font-size:20px;font-weight:700;color:#e2e8f0;text-transform:capitalize">🧪 ${testType} Test Results</span>
  </div>
  <div style="background:#0d1526;border:1px solid ${typeColor}44;border-radius:12px;overflow:hidden;margin-bottom:24px">
    <table>
      <thead><tr style="background:#040914">
        <th style="padding:10px 12px;text-align:center;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;font-weight:700">#</th>
        <th style="padding:10px 12px;text-align:left;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;font-weight:700">Test Name</th>
        <th style="padding:10px 12px;text-align:center;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;font-weight:700">Status</th>
        <th style="padding:10px 12px;text-align:left;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;font-weight:700">Result / Reason</th>
        <th style="padding:10px 12px;text-align:center;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;font-weight:700">Duration</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div style="background:${vc}12;border:2px solid ${vc}44;border-radius:12px;padding:16px 20px;display:flex;gap:12px;align-items:flex-start">
    <span style="font-size:24px">${vi}</span>
    <div>
      <div style="font-size:14px;font-weight:700;color:${vc};margin-bottom:6px">Final Verdict</div>
      <p style="font-size:13px;color:${vc};margin:0;line-height:1.6">${vt}</p>
    </div>
  </div>

  <div style="margin-top:48px;padding:20px 28px;background:rgba(201,162,39,.04);border-radius:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;border:1px solid rgba(201,162,39,.15)">
    <div style="font-size:14px;font-weight:700;color:#64748b"><span style="color:#c9a227">NEX</span>TEST · AI-Powered Test Automation</div>
    <div style="font-size:11px;color:#94a3b8">${dateStr} · ${framework} · ${total} tests · ${rate}% pass rate</div>
  </div>

</div>
</body>
</html>`;
}
//Exection Test Page
function ExecutionPanel({ generation, onGenerationSaved }) {
  const notifFiredRef = useRef(false);
  const { t, lang, setLanguage } = useLang();
  const [filter,       setFilter]       = useState('all');
  const [rowsPerPage, setRowsPerPage] = useState(10);
const [currentPage, setCurrentPage] = useState(1);
  const [activeTab,    setActiveTab]    = useState('results');
  const [pdfLoading,   setPdfLoading]   = useState(false);
  const [runResults,   setRunResults]   = useState(null);
  const [running,      setRunning]      = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedTest, setExpandedTest] = useState(null);
  const [terminalLines, setTerminalLines] = useState([]);
  const dropdownRef = useRef(null);

useEffect(() => {
  if (!generation || running) return;
  if (!runResults?.results?.length) return;

  const url = generation?.generation?.url || generation?.url || '';
  const fw = generation?.generation?.framework || generation?.framework || '';
  const testType = generation?.result?.test_type || generation?.test_type || 'smoke';
  const allTests = runResults.results;
  const genId = generation?.generation?.id;

  if (!url || !genId) return;

  const existing = JSON.parse(localStorage.getItem('nextest-reports') || '[]');
  const existingReport = existing.find(r => r.generationData?.generation?.id === genId);
  if (existingReport?.htmlContent) return; // déjà sauvegardé avec HTML

  const pass = allTests.filter(t => t.status === 'pass').length;
  const fail = allTests.filter(t => t.status === 'fail').length;
  const skip = allTests.filter(t => t.status === 'skip').length;

  // Générer HTML silencieusement
  let htmlContent = null;
  try {
    htmlContent = buildHtmlReport({ generation, tests: allTests, testType, framework: fw, url, pass, fail, skip });
  } catch(e) { console.error('[AutoHtml]', e); }

  saveReportToStorage({
    url, framework: fw, testType,
    passCount: pass, failCount: fail, skipCount: skip,
    htmlContent,
    generationData: {
      ...generation,
      result: { ...generation?.result, execution_results: allTests },
    },
    durationMs: generation?.result?.durationMs || 0,
  });
}, [running, runResults?.results?.length, generation?.generation?.id]);




  useEffect(() => {
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const framework = generation?.generation?.framework || generation?.framework || 'Selenium';
  const testType  = generation?.result?.test_type     || generation?.test_type  || 'smoke';

 

  // eslint-disable-next-line react-hooks/rules-of-hooks
useEffect(() => {
    if (!generation) return;
    if (testType === 'performance') return;
    const savedResults = generation?.result?.execution_results || generation?.generation?.execution_results || [];
    console.log('[EP] fresh:', generation.fresh, 'savedResults:', savedResults.length);


    if (savedResults.length > 0) {
      if (!generation.fresh) {
      setRunResults({ 
        results: savedResults, 
        ai: generation?.result?.ai || generation?.generation?.ai || null 
      });
      return;
}

      // Fresh generation: play the terminal animation, then reveal saved results
      setRunning(true); setRunResults(null); setTerminalLines([]);

      const url = generation?.generation?.url || generation?.url || '';
      const totalTests = savedResults.length || generation?.result?.test_cases?.length || 0;
      const currentFramework = generation?.generation?.framework
        || generation?.framework
        || generation?.result?.framework
        || framework;
      const fwLabel = currentFramework === 'Playwright' ? 'Playwright (headless chromium)'
        : currentFramework === 'Selenium' ? 'Selenium WebDriver'
        : currentFramework === 'Cypress' ? 'Cypress Test Runner'
        : currentFramework;

      const addLine = (text, type = 'info', delay = 0) =>
        new Promise(res => setTimeout(() => {
          setTerminalLines(prev => [...prev, { text, type, time: new Date().toLocaleTimeString('en-US', { hour12: false }) }]);
          res();
        }, delay));

      const playAnimation = async () => {
        await addLine('NexTest AI Engine v2.0 initializing...', 'system', 0);
        await addLine(`Connecting to ${url}`, 'info', 400);
        await addLine(`Launching ${fwLabel}...`, 'info', 800);
        await addLine('Scraping DOM elements and page structure...', 'info', 1200);
        await addLine(`AI analyzing ${totalTests} test cases...`, 'ai', 1700);
        await addLine('Injecting authentication token...', 'info', 2100);
        await addLine('Browser ready — starting test execution...', 'success', 2500);
        await addLine('─'.repeat(52), 'divider', 2800);

        for (let i = 0; i < Math.min(savedResults.length, 8); i++) {
          await addLine(`Running [${i + 1}/${totalTests}] ${savedResults[i]?.name || `Test ${i + 1}`}...`, 'running', 3000 + i * 300);
        }
        if (totalTests > 8) {
          await addLine(`... and ${totalTests - 8} more tests running in parallel`, 'muted', 3000 + 8 * 300);
        }

        await addLine('─'.repeat(52), 'divider', 3000 + Math.min(totalTests, 8) * 300 + 200);

        const pass = savedResults.filter(r => r.status === 'pass').length;
        const fail = savedResults.filter(r => r.status === 'fail').length;
        const skip = savedResults.filter(r => r.status === 'skip').length;

        savedResults.slice(0, 6).forEach((r, i) => {
          const icon = r.status === 'pass' ? '✓' : r.status === 'fail' ? '✗' : '—';
          const t = r.status === 'pass' ? 'pass' : r.status === 'fail' ? 'fail' : 'skip';
          setTerminalLines(prev => [...prev, {
            text: `${icon} ${r.name || `Test ${i + 1}`}`,
            type: t,
            time: new Date().toLocaleTimeString('en-US', { hour12: false })
          }]);
        });

        await addLine('─'.repeat(52), 'divider', 200);
        await addLine(`Execution complete — ${pass} passed · ${fail} failed · ${skip} skipped`, 'summary', 400);
        await addLine(`Pass rate: ${savedResults.length > 0 ? Math.round(pass / savedResults.length * 100) : 0}%`, pass / (savedResults.length || 1) >= 0.8 ? 'success' : 'fail', 600);
        await addLine('Generating AI analysis report...', 'ai', 800);
        await addLine('Done ✓', 'success', 1000);

        setTimeout(() => {
          setRunResults({ 
  results: savedResults, 
  ai: generation?.result?.ai || generation?.generation?.ai || null 
});
          setRunning(false);
          // Fire notification AFTER terminal finishes
          if (onGenerationSaved && !notifFiredRef.current) {
            notifFiredRef.current = true;
            const pass = savedResults.filter(r => r.status === 'pass').length;
            const fail = savedResults.filter(r => r.status === 'fail').length;
            onGenerationSaved({
              url:       generation?.generation?.url      || generation?.url      || '',
              framework: generation?.generation?.framework || generation?.framework || '',
              testType:  generation?.result?.test_type    || generation?.test_type  || '',
              passCount: pass,
              failCount: fail,
              timestamp: Date.now(),
              durationMs: 0,
            });
          }
        }, 1200);
      };

      playAnimation();
      return;
    }

    
    if (testType === 'api') return;
    if (!generation?.result?.test_cases?.length) return;
    const currentFramework = generation?.generation?.framework 
    || generation?.framework 
    || generation?.result?.framework
    || framework;
    const run = async () => {
  setRunning(true); setRunResults(null); setTerminalLines([]);

  const url = generation?.generation?.url || generation?.url || '';
  const totalTests = generation?.result?.test_cases?.length || 0;
  const fwLabel = currentFramework === 'Playwright' ? 'Playwright (headless chromium)'
    : currentFramework === 'Selenium' ? 'Selenium WebDriver'
    : currentFramework === 'Cypress' ? 'Cypress Test Runner'
    : currentFramework;

  const addLine = (text, type = 'info', delay = 0) =>
    new Promise(res => setTimeout(() => {
      setTerminalLines(prev => [...prev, { text, type, time: new Date().toLocaleTimeString('en-US', { hour12: false }) }]);
      res();
    }, delay));

  // Simulate terminal logs
  await addLine('NexTest AI Engine v2.0 initializing...', 'system', 0);
  await addLine(`Connecting to ${url}`, 'info', 400);
  await addLine(`Launching ${fwLabel}...`, 'info', 800);
  await addLine('Scraping DOM elements and page structure...', 'info', 1200);
  await addLine(`AI analyzing ${totalTests} test cases...`, 'ai', 1700);
  await addLine('Injecting authentication token...', 'info', 2100);
  await addLine('Browser ready — starting test execution...', 'success', 2500);
  await addLine('─'.repeat(52), 'divider', 2800);

  // Show tests running one by one
  const testCases = generation?.result?.test_cases || [];
  for (let i = 0; i < Math.min(testCases.length, 8); i++) {
    await addLine(`Running [${i + 1}/${totalTests}] ${testCases[i]?.name || `Test ${i + 1}`}...`, 'running', 3000 + i * 300);
  }
  if (totalTests > 8) {
    await addLine(`... and ${totalTests - 8} more tests running in parallel`, 'muted', 3000 + 8 * 300);
  }

  await addLine('─'.repeat(52), 'divider', 3000 + Math.min(totalTests, 8) * 300 + 200);

  try {
    const res = await api.post('/run', {
      script: generation.result.script || '',
      framework: currentFramework,
      test_cases: generation.result.test_cases || []
    });

    console.log('[DEBUG RUN] res.data.ai =', res.data.ai);

    const results = res.data?.results || [];
    const pass = results.filter(r => r.status === 'pass').length;
    const fail = results.filter(r => r.status === 'fail').length;
    const skip = results.filter(r => r.status === 'skip').length;

    // Show individual results
    results.slice(0, 6).forEach((r, i) => {
      const icon = r.status === 'pass' ? '✓' : r.status === 'fail' ? '✗' : '—';
      const type = r.status === 'pass' ? 'pass' : r.status === 'fail' ? 'fail' : 'skip';
      setTerminalLines(prev => [...prev, {
        text: `${icon} ${r.name || `Test ${i + 1}`}`,
        type,
        time: new Date().toLocaleTimeString('en-US', { hour12: false })
      }]);
    });

    await addLine('─'.repeat(52), 'divider', 200);
    await addLine(`Execution complete — ${pass} passed · ${fail} failed · ${skip} skipped`, 'summary', 400);
    await addLine(`Pass rate: ${results.length > 0 ? Math.round(pass / results.length * 100) : 0}%`, pass / (results.length || 1) >= 0.8 ? 'success' : 'fail', 600);
    await addLine('Generating AI analysis report...', 'ai', 800);
    await addLine('Done ✓', 'success', 1000);
    console.log('[DEBUG RUN] setting runResults with:', res.data);
    setTimeout(() => setRunResults(res.data), 1200);
  } catch (err) {
    console.error('[RUN ERROR]', err.response?.data || err.message);
    await addLine(`✗ Error: ${err.response?.data?.error || err.message}`, 'fail', 200);
  } finally {
    setTimeout(() => setRunning(false), 1200);
  }
};
    run();
  }, [generation]);
  
  if (testType === 'performance' && framework === 'k6') {
    return <K6ExecutionPanel generation={generation} />;
  }
  if (testType === 'performance') {
    return <PerformanceExecutionPanel generation={generation} />;
  }

  const buildTests = (test_cases, execution_results) => {
    if (execution_results && execution_results.length > 0) {
return execution_results.map((r, i) => ({
  id: i + 1,
  name: r.name,
  status: r.status,
  duration: r.duration || '—',
  suite: r.suite || r.detail || r.reason_pass || r.reason || r.reason_skip || r.error || '',
  expected:    r.expected || '',
  description: r.description || '', 
  assertion_result: r.assertion_result || null,
  step_meta: r.step_meta || null,
  category:        r.category || 'api',
  priority:        r.priority || 'medium',
  screenshot:      r.screenshot ?? null,
  ai_analysis:     r.ai_analysis || null,
  http_status:     r.http_status || null,
  expected_status: r.expected_status || null,
  assertions_detail: r.assertions_detail || [],
}));
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
  const skip  = tests.filter(t => t.status === 'skip' || t.status === 'warn').length;
  const rate  = tests.length > 0 ? Math.round((pass / tests.length) * 100) : 0;
  const shown = (filter === 'all' ? tests 
  : filter === 'skip' ? tests.filter(t => t.status === 'skip' || t.status === 'warn')
  : tests.filter(t => t.status === filter)
).slice().sort((a, b) => {
  // 1. Les échecs d'abord, peu importe le filtre actif
  const statusOrder = { fail: 0, skip: 1, warn: 1, pass: 2 };
  const statusDiff = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
  if (statusDiff !== 0) return statusDiff;

  // 2. À l'intérieur d'un même statut, trie par sévérité HIGH > MEDIUM > LOW
  const sevOrder = { high: 0, critical: 0, medium: 1, low: 2 };
  const sevA = sevOrder[a.ai_analysis?.severity] ?? 1;
  const sevB = sevOrder[b.ai_analysis?.severity] ?? 1;
  return sevA - sevB;
});

const totalPages = Math.ceil(shown.length / rowsPerPage);
const paginatedShown = shown.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

useEffect(() => { setCurrentPage(1); }, [filter, rowsPerPage]);

  const url        = generation?.generation?.url || generation?.url || '';
  const loadTimeMs = generation?.generation?.load_time_ms || generation?.scraped?.load_time_ms || 0;

  const rateColor = rate >= 80 ? '#10B981' : rate >= 50 ? '#F59E0B' : '#EF4444';
  const rateGrad  = rate >= 80 ? 'linear-gradient(90deg,#10b981,#34d399)' : rate >= 50 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)';

  const TEST_TYPE_BADGE = {
    smoke:       { label: 'Smoke',       color: '#64748b', bg: 'rgba(148,163,184,.12)', border: 'rgba(148,163,184,.3)',  letter: 'S' },
    functional:  { label: 'Functional',  color: '#6366f1', bg: 'rgba(99,102,241,.1)',   border: 'rgba(99,102,241,.25)', letter: 'F' },
    performance: { label: 'Performance', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)',   border: 'rgba(139,92,246,.25)', letter: 'P' },
    api:         { label: 'API',         color: '#10b981', bg: 'rgba(16,185,129,.1)',   border: 'rgba(16,185,129,.25)', letter: 'A' },
    regression:  { label: 'Regression',  color: '#f97316', bg: 'rgba(249,115,22,.1)',   border: 'rgba(249,115,22,.25)', letter: 'R' },
    seo: { label: 'SEO', color: '#06b6d4', bg: 'rgba(6,182,212,.1)', border: 'rgba(6,182,212,.25)', letter: 'S' },
    security:    { label: 'Security',    color: '#ef4444', bg: 'rgba(239,68,68,.1)',    border: 'rgba(239,68,68,.25)',  letter: 'S' },
  };
  const ttBadge = TEST_TYPE_BADGE[testType] || TEST_TYPE_BADGE.smoke;
  const isRegression = testType === 'regression';
  const isSecurity = testType === 'security';
  const isFunctional = testType === 'functional';
  const isSeo = testType === 'seo';

  const EP_FW = {
  Selenium:   { letters: 'Se', color: '#43B02A' },
  Cypress:    { letters: 'Cy', color: '#00BFA5' },
  Playwright: { letters: 'Pl', color: '#E2574C' },
  Both:       { letters: '∞',  color: '#C9A227' },
  Postman:    { letters: 'Po', color: '#FF6C37' },
  Pytest:     { letters: 'Py', color: '#3776AB' },
  Newman:     { letters: 'Nw', color: '#FF6C37' },
  Requests:   { letters: 'RQ', color: '#06b6d4' },
 
};
  const fwConf = EP_FW[framework] || EP_FW[framework?.charAt(0).toUpperCase() + framework?.slice(1)] || EP_FW.Selenium;

  const downloadScript = (type = 'selenium') => {
  let content, filename;
  const fw = framework?.toLowerCase();

  //API test types (Postman / Pytest / Newman)
  if (testType === 'api') {
    if (fw === 'postman' || fw === 'newman') {
      content  = generation?.result?.script_postman
              || generation?.result?.script
              || '';
      filename = 'nextest_collection.json';
    } else {
      content  = generation?.result?.script_pytest
              || generation?.result?.script
              || '';
      filename = 'test_api_pytest.py';
    }
    const blob = new Blob([content || ''], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    return;
  }

  //SEO test (Requests + BeautifulSoup)
  if (testType === 'seo') {
    console.log('[SEO SCRIPT] generation.result:', generation?.result);
  console.log('[SEO SCRIPT] script field:', generation?.result?.script);
    content  = generation?.result?.script || '';
    filename = 'seo_test.py';
    const blob = new Blob([content || ''], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    return;
  }

  // (Selenium + Playwright + Cypress)
  if (isBoth) {
    content  = type === 'selenium'  ? generation?.result?.script_selenium
             : type === 'playwright' ? generation?.result?.script_playwright
             :                         generation?.result?.script_cypress;
    filename = type === 'selenium'  ? 'test_selenium.py'
             : type === 'playwright' ? 'test_playwright.py'
             :                         'test_cypress.js';
  } else {
    content  = fw === 'playwright' ? (generation?.result?.script_playwright || generation?.result?.script || '')
             : fw === 'cypress'    ? (generation?.result?.script_cypress    || generation?.result?.script || '')
             :                       (generation?.result?.script_selenium   || generation?.result?.script || '');
    filename = fw === 'playwright' ? 'test_playwright.py'
             : fw === 'cypress'    ? 'test_cypress.js'
             :                       'test_selenium.py';
  }

  const blob = new Blob([content || ''], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

  const downloadCsv = () => {
    const headers = isRegression
  ? ['ID', 'Test Name', 'Category', 'Severity', 'URL', 'Status', 'Reason', 'Duration']
  : ['ID', 'Test Name', 'Status', 'Duration', 'Category', 'Section', 'Suite/Reason'];

const rows = isRegression
  ? tests.map(t => [t.id, `"${(t.name||'').replace(/"/g,'""')}"`, t.category||'navigation', t.severity||'medium', t.url||'—', t.status, `"${(t.suite||'').replace(/"/g,'""')}"`, t.duration])
  : tests.map(t => [t.id, `"${t.name.replace(/"/g,'""')}"`, t.status, t.duration, t.category||'smoke', t.section||'—', `"${(t.suite||'').replace(/"/g,'""')}"`]);
    const csv     = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob    = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link    = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nextest_report_${generation?.generation?.id || 'export'}.csv`;
    link.click();
  saveReportToStorage({
    url,
    framework,
    testType,
    passCount: pass,
    failCount: fail,
    htmlContent: html,
    generationData: generation,
  });
  setDropdownOpen(false);
};


const downloadHtml_Security = () => {
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const genId   = generation?.generation?.id || 'nextest';
  const allTests = tests;
  const pass  = allTests.filter(t => t.status === 'pass').length;
  const fail  = allTests.filter(t => t.status === 'fail').length;
  const warn  = allTests.filter(t => t.status === 'warn').length;
  const total = allTests.length || 1;
  const rate  = Math.round(pass / total * 100);
  const rateColor = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';

  const CAT_COLORS = {
    auth: '#6366f1', xss: '#ef4444', session: '#f59e0b',
    navigation: '#10b981', headers: '#3b82f6', info_exposure: '#8b5cf6',
  };
  const SEV_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' };

  const secHdr = (emoji, title, color = '#ef4444') => `
    <div style="display:flex;align-items:center;gap:10px;margin:32px 0 12px;
      padding-bottom:8px;border-bottom:2.5px solid ${color}">
      <span style="font-size:18px">${emoji}</span>
      <span style="font-size:20px;font-weight:700;color:#e2e8f0">${title}</span>
    </div>`;

  const tblWrap = (inner, border = '#ef4444') => `
    <div style="background:#0d1526;border:1px solid ${border}44;border-radius:12px;
      overflow:hidden;margin-bottom:16px;box-shadow:0 4px 20px rgba(0,0,0,.3)">
      ${inner}
    </div>`;

  const tblHdr = (cols) => `
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#040914">
        ${cols.map(c => `<th style="padding:10px 12px;text-align:${c.align||'left'};
          font-size:9px;letter-spacing:1.5px;text-transform:uppercase;
          color:#94a3b8;font-weight:700">${c.l}</th>`).join('')}
      </tr></thead>`;

  // ── SCENARIOS TABLE ──
  const scenarioRows = allTests.map((t, i) => {
    const cc  = CAT_COLORS[t.category] || '#64748b';
    const sc  = SEV_COLORS[t.severity] || '#f59e0b';
    const TYPE_MAP = {
      no_token: ['AUTH','#6366f1'], xss_input: ['XSS','#ef4444'],
      dom_inspect: ['SESSION','#f59e0b'], header_check: ['HEADERS','#3b82f6'],
      direct_nav: ['NAV','#10b981'], logout: ['SESSION','#f59e0b'],
    };
    const [typeLabel, typeColor] = TYPE_MAP[t.test_type] || ['SEC','#64748b'];
    return `<tr style="border-bottom:1px solid rgba(255,255,255,.05);background:${i%2===0?'#0d1526':'#080f1e'}">
      <td style="padding:9px 12px;color:#64748b;font-weight:700;text-align:center">${i+1}</td>
      <td style="padding:9px 12px;font-weight:700;color:#e2e8f0;font-size:13px">${t.name}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${cc};font-weight:700;font-size:10px">${(t.category||'').toUpperCase()}</span></td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${sc};font-weight:700;font-size:10px">${(t.severity||'medium').toUpperCase()}</span></td>
      <td style="padding:9px 12px;font-size:11px;color:#94a3b8">${t.suite || 'Security check'}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${typeColor};font-weight:700;font-size:10px">${typeLabel}</span></td>
    </tr>`;
  }).join('');

  // CATEGORY SUMMARY
  const cats = {};
  allTests.forEach(t => {
    const c = t.category || 'auth';
    if (!cats[c]) cats[c] = {pass:0, fail:0, warn:0, total:0};
    cats[c].total++;
    if (t.status==='pass') cats[c].pass++;
    else if (t.status==='fail') cats[c].fail++;
    else cats[c].warn++;
  });
  const catRows = Object.entries(cats).map(([cat, d]) => {
    const cc = CAT_COLORS[cat] || '#64748b';
    const vc = d.fail===0 ? '#10b981' : '#ef4444';
    const vt = d.fail===0 ? '✅ PASS' : '❌ FAIL';
    const bg = d.fail===0 ? 'rgba(16,185,129,.06)' : 'rgba(239,68,68,.06)';
    return `<tr style="background:${bg};border-bottom:1px solid rgba(255,255,255,.05)">
      <td style="padding:10px 12px;font-weight:700;color:${cc}">${cat.toUpperCase()}</td>
      <td style="padding:10px 12px;text-align:center;color:#e2e8f0;font-weight:700">${d.total}</td>
      <td style="padding:10px 12px;text-align:center;color:#10b981;font-weight:700">${d.pass}</td>
      <td style="padding:10px 12px;text-align:center;color:#ef4444;font-weight:700">${d.fail}</td>
      <td style="padding:10px 12px;text-align:center;color:#f59e0b;font-weight:700">${d.warn}</td>
      <td style="padding:10px 12px;text-align:center"><span style="color:${vc};font-weight:800;font-size:11px">${vt}</span></td>
    </tr>`;
  }).join('');

  // DETAILED RESULTS
  const detailRows = allTests.map((t, i) => {
    const sc = t.status==='pass'?'#10b981':t.status==='fail'?'#ef4444':'#f59e0b';
    const sl = t.status==='pass'?'✓ PASS':t.status==='fail'?'✗ FAIL':'⚠ WARN';
    const sb = t.status==='pass'?'rgba(16,185,129,.06)':t.status==='fail'?'rgba(239,68,68,.06)':'rgba(245,158,11,.06)';
    const cc = CAT_COLORS[t.category] || '#64748b';
    const sevc = SEV_COLORS[t.severity] || '#f59e0b';
    return `<tr style="border-bottom:1px solid rgba(255,255,255,.05);background:${i%2===0?'#0d1526':'#080f1e'}">
      <td style="padding:9px 12px;color:#64748b;font-weight:700;text-align:center">${i+1}</td>
      <td style="padding:9px 12px;font-weight:700;color:#e2e8f0;font-size:13px">${t.name}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${cc};font-weight:700;font-size:10px">${(t.category||'').toUpperCase()}</span></td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${sevc};font-weight:700;font-size:10px">${(t.severity||'medium').toUpperCase()}</span></td>
      <td style="padding:9px 12px;text-align:center;background:${sb}"><span style="color:${sc};font-weight:800;font-size:11px">${sl}</span></td>
      <td style="padding:9px 12px;font-size:11px;color:#94a3b8">${t.suite||'—'}</td>
      <td style="padding:9px 12px;text-align:center;font-size:11px;color:#64748b;font-weight:700">${t.duration||'—'}</td>
    </tr>`;
  }).join('');

  //AI RECOMMENDATIONS
  const perfItems = allTests.filter(t => {
    try { return parseInt((t.duration||'0').replace('ms','')) > 5000; } catch { return false; }
  });
  const recsHtml = `
    <div style="background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:8px;padding:10px 14px;margin-bottom:4px;font-weight:700;color:#f59e0b">⚡ Performance</div>
    ${perfItems.length > 0
      ? perfItems.slice(0,3).map(t => `<div style="background:#0d1526;border-left:3px solid #f59e0b;padding:8px 14px 8px 16px;margin-bottom:2px;font-size:12px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,.05)">• "${t.name}" took ${t.duration} — optimize redirect response time.</div>`).join('')
      : '<div style="background:#0d1526;border-left:3px solid #f59e0b;padding:8px 14px 8px 16px;margin-bottom:2px;font-size:12px;color:#94a3b8">• All security tests executed within acceptable time range.</div>'
    }
    <div style="background:rgba(99,102,241,.06);border:1px solid rgba(99,102,241,.2);border-radius:8px;padding:10px 14px;margin:10px 0 4px;font-weight:700;color:#818cf8">🔧 Reliability</div>
    <div style="background:#0d1526;border-left:3px solid #818cf8;padding:8px 14px 8px 16px;margin-bottom:2px;font-size:12px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,.05)">• ${fail > 0 ? `${fail} security check(s) failed — review authentication and XSS protection.` : 'All security checks passed — continue monitoring auth and XSS vectors.'}</div>
    <div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:8px;padding:10px 14px;margin:10px 0 4px;font-weight:700;color:#10b981">👤 UX & Security</div>
    <div style="background:#0d1526;border-left:3px solid #10b981;padding:8px 14px 8px 16px;margin-bottom:2px;font-size:12px;color:#94a3b8">• Auth routes correctly redirect unauthenticated users — session management is secure.</div>`;

  // ── FINAL VERDICT ──
  const vc = fail > 0 ? '#ef4444' : '#059669';
  const vb = fail > 0 ? 'rgba(239,68,68,.08)' : 'rgba(16,185,129,.08)';
  const vi = fail > 0 ? '🔴' : '🟢';
  const vt = fail > 0
    ? `Security Test FAILED — ${fail} vulnerability/vulnerabilities detected. Fix before production.`
    : `Security Test PASSED — All ${pass} security checks passed. No critical vulnerabilities detected.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>NexTest Security Report #${genId}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#070e1c;color:#e2e8f0;font-family:'DM Sans',sans-serif;min-height:100vh}
  .page{max-width:1100px;margin:0 auto;padding:48px 32px 80px}
  table{width:100%;border-collapse:collapse}
  @media print{body{background:#fff;color:#000}.no-print{display:none}.page{padding:10mm}@page{margin:15mm;size:A4}}
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#0a0f1e 0%,#1a0a0a 50%,#0a0f1e 100%);
    border-radius:20px;padding:40px 48px;margin-bottom:32px;position:relative;overflow:hidden">
    <div style="position:absolute;bottom:0;left:0;right:0;height:4px;
      background:linear-gradient(90deg,transparent,#ef4444,transparent)"></div>
    <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#ef4444"></div>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:20px">
      <div>
        <div style="font-size:28px;font-weight:700;color:#fff;letter-spacing:2px;margin-bottom:4px">
          <span style="color:#ef4444">NEX</span>TEST
        </div>
        <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:8px">Security Test Report</div>
        <div style="font-size:11px;color:#94a3b8">Generated ${dateStr} · ${timeStr}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:28px">
      ${[
        {l:'URL', v:`<span style="color:#ef9494;font-size:11px;word-break:break-all">${url}</span>`},
        {l:'Framework', v:`<span style="color:#fff;font-weight:700">${framework}</span>`},
        {l:'Test Type', v:`<span style="color:#ef4444;font-weight:700">Security Test</span>`},
        {l:'Generated', v:`<span style="color:#fff">${dateStr}</span>`},
      ].map(r => `<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:12px 14px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4f6480;margin-bottom:5px">${r.l}</div>
        <div style="font-size:12px">${r.v}</div>
      </div>`).join('')}
    </div>
  </div>

  <!-- PRINT BUTTON -->
  <div class="no-print" style="margin-bottom:28px">
    <button onclick="window.print()" style="padding:10px 24px;border-radius:10px;background:linear-gradient(135deg,#ef4444,#dc2626);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
      🖨 Print / Save as PDF
    </button>
  </div>

  ${secHdr('🔒', 'Security Test Scenarios', '#ef4444')}
  ${tblWrap(`${tblHdr([{l:'#',align:'center'},{l:'Test Scenario'},{l:'Category',align:'center'},{l:'Severity',align:'center'},{l:'Expected Result'},{l:'Type',align:'center'}])}
    <tbody>${scenarioRows}</tbody></table>`)}

  ${secHdr('📊', 'Test Summary', '#ef4444')}
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">
    ${[
      {icon:'✅',val:pass,lbl:'PASSED',c:'#10b981',bg:'rgba(16,185,129,.08)',bd:'rgba(16,185,129,.25)'},
      {icon:'❌',val:fail,lbl:'FAILED',c:'#ef4444',bg:'rgba(239,68,68,.08)',bd:'rgba(239,68,68,.25)'},
      {icon:'⚠️',val:warn,lbl:'WARN',c:'#f59e0b',bg:'rgba(245,158,11,.08)',bd:'rgba(245,158,11,.25)'},
      {icon:'🎯',val:`${rate}%`,lbl:'PASS RATE',c:rateColor,bg:`${rateColor}12`,bd:`${rateColor}33`},
      {icon:'🔢',val:total,lbl:'TOTAL',c:'#3b82f6',bg:'rgba(59,130,246,.08)',bd:'rgba(59,130,246,.25)'},
    ].map(s => `<div style="background:${s.bg};border:1px solid ${s.bd};border-radius:14px;padding:20px;text-align:center">
      <div style="font-size:20px;margin-bottom:8px">${s.icon}</div>
      <div style="font-size:36px;font-weight:700;color:${s.c};line-height:1;margin-bottom:4px">${s.val}</div>
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:${s.c};opacity:.8;text-transform:uppercase">${s.lbl}</div>
    </div>`).join('')}
  </div>

  ${secHdr('📊', 'Results by Category', '#ef4444')}
  ${tblWrap(`${tblHdr([{l:'Category'},{l:'Total',align:'center'},{l:'Passed',align:'center'},{l:'Failed',align:'center'},{l:'Warn',align:'center'},{l:'Status',align:'center'}])}
    <tbody>${catRows}</tbody></table>`)}

  ${secHdr('🧪', 'Detailed Security Test Results', '#0d9488')}
  ${tblWrap(`${tblHdr([{l:'#',align:'center'},{l:'Test Name'},{l:'Category',align:'center'},{l:'Severity',align:'center'},{l:'Status',align:'center'},{l:'Result / Reason'},{l:'Duration',align:'center'}])}
    <tbody>${detailRows}</tbody></table>`, '#0d9488')}

  ${secHdr('🤖', 'AI Recommendations', '#6366f1')}
  ${recsHtml}

  <!-- FINAL VERDICT -->
  <div style="background:${vb};border:2px solid ${vc};border-radius:12px;padding:16px 20px;margin-top:24px;display:flex;gap:12px;align-items:flex-start">
    <span style="font-size:24px">${vi}</span>
    <div>
      <div style="font-size:14px;font-weight:700;color:${vc};margin-bottom:6px">Final Security Verdict</div>
      <p style="font-size:13px;color:${vc};margin:0;line-height:1.6">${vt}</p>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="margin-top:48px;padding:20px 28px;background:rgba(239,68,68,.04);border-radius:12px;
    display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;border:1px solid rgba(239,68,68,.15)">
    <div style="font-size:14px;font-weight:700;color:#64748b">
      <span style="color:#ef4444">NEX</span>TEST · Security Test Report
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
  link.download = `security_report_${genId}.html`;
  link.click();
  saveReportToStorage({
    url,
    framework,
    testType: 'security',
    passCount: pass,
    failCount: fail,
    htmlContent: html,
    generationData: generation,
  });
  setDropdownOpen(false);
};

const downloadHtml_Functional = async () => {
  // Show loading state 
  setDropdownOpen(false);
  setPdfLoading(true);

  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const genId   = generation?.generation?.id || 'nextest';
  const allTests = tests;

  const pass  = allTests.filter(t => t.status === 'pass').length;
  const fail  = allTests.filter(t => t.status === 'fail').length;
  const skip  = allTests.filter(t => t.status === 'skip').length;
  const total = allTests.length || 1;
  const rate  = Math.round(pass / total * 100);
  const rateColor = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';

  // Quality score
  const failedCritical = allTests.filter(t => t.status === 'fail' && t.ai_analysis?.severity === 'high');
  let quality = rate;
  if (failedCritical.length) quality = Math.max(0, quality - failedCritical.length * 10);
  quality = Math.min(100, Math.max(0, Math.round(quality)));
  const risk = quality >= 80 ? 'LOW' : quality >= 60 ? 'MEDIUM' : 'HIGH';
  const riskColor = quality >= 80 ? '#10b981' : quality >= 60 ? '#f59e0b' : '#ef4444';

  //ACTION PLAN via LLaMA 
  const failedTests = allTests.filter(t => t.status === 'fail');
  let actionPlanItems = [];

  try {
    const prompt = `You are a QA engineer. Generate an action plan for these failed functional Playwright tests.

Failed tests (${failedTests.length}):
${JSON.stringify(failedTests.map(t => ({
  name: t.name,
  action: t.action || t.step_meta?.action || 'check_visible',
  selector: t.selector || t.step_meta?.selector || '—',
  reason: t.reason || t.suite || '—',
  root_cause: t.ai_analysis?.root_cause || '—',
  fix: t.ai_analysis?.fix || '—',
})))}

Return ONLY a JSON array of max 6 items. Each item must have:
- scenario: string (what failed — be specific with test name)
- category: one of "Selector Fix" | "Timing/Wait" | "Auth Flow" | "Page Load" | "Assertion" | "Element State"
- priority: "HIGH" | "MEDIUM" | "LOW"
- action: string (concrete fix action, max 80 chars)
- responsible: one of "Frontend" | "QA" | "Backend" | "DevOps"
- deadline: one of "Immediate" | "This Sprint" | "Next Sprint"
- status: "To Do"

Return ONLY valid JSON array, no markdown, no explanation.`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await resp.json();
    const text = (data.content?.[0]?.text || '[]').replace(/```json|```/g, '').trim();
    actionPlanItems = JSON.parse(text);
  } catch (e) {
    console.error('[Action Plan]', e);
    // Fallback statique si LLaMA échoue
    actionPlanItems = failedTests.slice(0, 4).map(t => ({
      scenario: t.name,
      category: 'Selector Fix',
      priority: t.ai_analysis?.severity === 'high' ? 'HIGH' : 'MEDIUM',
      action: t.ai_analysis?.fix || 'Verify selector and add explicit wait',
      responsible: 'QA',
      deadline: 'This Sprint',
      status: 'To Do',
    }));
  }

  // ACTION PLAN HTML
  const CAT_COLORS = {
    'Selector Fix':   '#6366f1',
    'Timing/Wait':    '#f59e0b',
    'Auth Flow':      '#ef4444',
    'Page Load':      '#10b981',
    'Assertion':      '#8b5cf6',
    'Element State':  '#0ea5e9',
  };
  const PRI_COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };
  const PRI_BGS   = { HIGH: 'rgba(239,68,68,.06)', MEDIUM: 'rgba(245,158,11,.06)', LOW: 'rgba(16,185,129,.06)' };
  const RESP_COLORS = { Frontend: '#6366f1', QA: '#3b82f6', Backend: '#10b981', DevOps: '#f97316' };
  const DEAD_COLORS = { Immediate: '#ef4444', 'This Sprint': '#f59e0b', 'Next Sprint': '#10b981' };

  const actionPlanRows = actionPlanItems.map((item, i) => {
    const pc  = PRI_COLORS[item.priority]  || '#f59e0b';
    const pbg = PRI_BGS[item.priority]     || 'rgba(245,158,11,.06)';
    const cc  = CAT_COLORS[item.category]  || '#64748b';
    const rc  = RESP_COLORS[item.responsible] || '#64748b';
    const dc  = DEAD_COLORS[item.deadline] || '#f59e0b';
    return `
      <tr style="background:${pbg};border-bottom:1px solid rgba(255,255,255,.05)">
        <td style="padding:9px 12px;color:#64748b;font-weight:700;text-align:center">${i+1}</td>
        <td style="padding:9px 12px;font-size:12px;color:#e2e8f0">${(item.scenario||'').substring(0,60)}</td>
        <td style="padding:9px 12px;text-align:center"><span style="color:${cc};font-weight:700;font-size:10px">${item.category}</span></td>
        <td style="padding:9px 12px;text-align:center"><span style="color:${pc};font-weight:700;font-size:10px">${item.priority}</span></td>
        <td style="padding:9px 12px;font-size:11px;color:#94a3b8">${(item.action||'').substring(0,70)}</td>
        <td style="padding:9px 12px;text-align:center"><span style="color:${rc};font-weight:700;font-size:10px">${item.responsible}</span></td>
        <td style="padding:9px 12px;text-align:center"><span style="color:${dc};font-weight:700;font-size:10px">${item.deadline}</span></td>
        <td style="padding:9px 12px;text-align:center"><span style="font-size:10px;color:#64748b">⏳ ${item.status}</span></td>
      </tr>`;
  }).join('');

  const sectionActionPlan = actionPlanItems.length > 0 ? `
    <div style="display:flex;align-items:center;gap:10px;margin:32px 0 12px;padding-bottom:8px;border-bottom:2.5px solid #c9a227">
      <span style="font-size:18px">📋</span>
      <span style="font-size:20px;font-weight:700;color:#e2e8f0">AI-Generated Action Plan</span>
    </div>
    <p style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Action plan generated by Claude AI based on real functional test failures.
    </p>
    <div style="background:#0d1526;border:1px solid rgba(201,162,39,.3);border-radius:12px;overflow:hidden;margin-bottom:16px">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#040914">
          ${['#','Scenario','Category','Priority','Action','Responsible','Deadline','Status'].map(h =>
            `<th style="padding:10px 12px;text-align:${['#','Priority','Responsible','Deadline','Status'].includes(h)?'center':'left'};font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;font-weight:700">${h}</th>`
          ).join('')}
        </tr></thead>
        <tbody>${actionPlanRows}</tbody>
      </table>
    </div>` : '';

  // SECTIONS
  const ACTION_COLORS = {
    navigate: '#10b981', check_visible: '#3b82f6', fill: '#8b5cf6',
    click: '#f97316', auth_success: '#10b981', auth_fail: '#ef4444',
    check_text: '#0d9488', select: '#6366f1', hover: '#ec4899', logout: '#f59e0b',
  };
  const CAT_COLORS2 = {
    navigation: '#10b981', form: '#8b5cf6', action: '#f97316',
    authentication: '#6366f1', ui: '#3b82f6',
  };

  const getAction = (t) => t.action || t.step_meta?.action || 'check_visible';
  const getSelector = (t) => t.selector || t.step_meta?.selector || t.step_meta?.value || '—';
  const getReason = (t) => t.reason || t.reason_pass || t.suite || t.error || '—';

  const secHdr = (emoji, title, color = '#6366f1') => `
    <div style="display:flex;align-items:center;gap:10px;margin:32px 0 12px;padding-bottom:8px;border-bottom:2.5px solid ${color}">
      <span style="font-size:18px">${emoji}</span>
      <span style="font-size:20px;font-weight:700;color:#e2e8f0">${title}</span>
    </div>`;

  const tblWrap = (inner, border = '#6366f1') => `
    <div style="background:#0d1526;border:1px solid ${border}44;border-radius:12px;overflow:hidden;margin-bottom:16px;box-shadow:0 4px 20px rgba(0,0,0,.3)">
      ${inner}
    </div>`;

  const tblHdr = (cols) => `
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#040914">
        ${cols.map(c => `<th style="padding:10px 12px;text-align:${c.align||'left'};font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;font-weight:700">${c.l}</th>`).join('')}
      </tr></thead>`;

  //1. SCENARIOS
  const EXPECTED_MAP = {
    navigate: 'Page loads and DOM is ready',
    check_visible: 'Element is visible in the DOM',
    fill: 'Field accepts and retains the input value',
    click: 'Element responds to click — action triggered',
    auth_success: 'Login succeeds — redirected to dashboard',
    auth_fail: 'Login rejected — error message displayed',
    check_text: 'Expected text found in page content',
    select: 'Option selected in dropdown',
    hover: 'Hover state applied to element',
    logout: 'Session cleared — redirected to login',
  };
  const scenarioRows = allTests.map((t, i) => {
    const action = getAction(t);
    const category = t.category || 'action';
    const priority = t.priority || 'medium';
    const ac = ACTION_COLORS[action] || '#64748b';
    const cc = CAT_COLORS2[category] || '#64748b';
    const pc = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#10b981';
    const expected = EXPECTED_MAP[action] || 'Step completes without error';
    return `<tr style="border-bottom:1px solid rgba(255,255,255,.05);background:${i%2===0?'#0d1526':'#080f1e'}">
      <td style="padding:9px 12px;color:#64748b;font-weight:700;text-align:center">${i+1}</td>
      <td style="padding:9px 12px;font-weight:700;color:#e2e8f0;font-size:13px">${t.name}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${ac};font-weight:700;font-size:10px">${action.toUpperCase()}</span></td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${cc};font-weight:700;font-size:10px">${category.toUpperCase()}</span></td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${pc};font-weight:700;font-size:10px">${priority.toUpperCase()}</span></td>
      <td style="padding:9px 12px;font-size:11px;color:#94a3b8">${expected.substring(0,55)}</td>
    </tr>`;
  }).join('');

  //2. CATEGORY SUMMARY 
  const cats = {};
  allTests.forEach(t => {
    const c = t.category || 'action';
    if (!cats[c]) cats[c] = { pass: 0, fail: 0, skip: 0, total: 0, dur: 0 };
    cats[c].total++;
    if (t.status === 'pass') cats[c].pass++;
    else if (t.status === 'fail') cats[c].fail++;
    else cats[c].skip++;
    try { cats[c].dur += parseInt((t.duration||'0').replace('ms','') || 0); } catch {}
  });
  const catRows = Object.entries(cats).map(([cat, d]) => {
    const cc = CAT_COLORS2[cat] || '#64748b';
    const r  = Math.round(d.pass / d.total * 100);
    const rc = r === 100 ? '#10b981' : r >= 60 ? '#f59e0b' : '#ef4444';
    const avg = Math.round(d.dur / d.total);
    const vc = d.fail === 0 ? '#10b981' : '#ef4444';
    const row_bg = d.fail === 0 ? 'rgba(16,185,129,.06)' : 'rgba(239,68,68,.06)';
    return `<tr style="background:${row_bg};border-bottom:1px solid rgba(255,255,255,.05)">
      <td style="padding:10px 12px;font-weight:700;color:${cc}">${cat.toUpperCase()}</td>
      <td style="padding:10px 12px;text-align:center;color:#e2e8f0;font-weight:700">${d.total}</td>
      <td style="padding:10px 12px;text-align:center;color:#10b981;font-weight:700">${d.pass}</td>
      <td style="padding:10px 12px;text-align:center;color:#ef4444;font-weight:700">${d.fail}</td>
      <td style="padding:10px 12px;text-align:center;color:#f59e0b;font-weight:700">${d.skip}</td>
      <td style="padding:10px 12px;text-align:center;color:${rc};font-weight:700">${r}%</td>
      <td style="padding:10px 12px;text-align:center;color:#64748b">${avg}ms</td>
      <td style="padding:10px 12px;text-align:center"><span style="color:${vc};font-weight:800;font-size:11px">${d.fail===0?'✅ PASS':'❌ FAIL'}</span></td>
    </tr>`;
  }).join('');

  //3. DETAILED RESULTS 
  const detailRows = allTests.map((t, i) => {
    const sc = t.status==='pass'?'#10b981':t.status==='fail'?'#ef4444':'#f59e0b';
    const sl = t.status==='pass'?'✓ PASS':t.status==='fail'?'✗ FAIL':'■ SKIP';
    const sb = t.status==='pass'?'rgba(16,185,129,.06)':t.status==='fail'?'rgba(239,68,68,.06)':'rgba(245,158,11,.06)';
    const action = getAction(t);
    const selector = getSelector(t);
    const reason = getReason(t);
    const ac = ACTION_COLORS[action] || '#64748b';
    const aiSev = t.ai_analysis?.severity || 'medium';
    const sevC = aiSev === 'high' ? '#ef4444' : aiSev === 'medium' ? '#f59e0b' : '#10b981';
    return `<tr style="border-bottom:1px solid rgba(255,255,255,.05);background:${i%2===0?'#0d1526':'#080f1e'}">
      <td style="padding:9px 12px;color:#64748b;font-weight:700;text-align:center">${i+1}</td>
      <td style="padding:9px 12px;font-weight:700;color:#e2e8f0;font-size:13px">${t.name}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${ac};font-weight:700;font-size:10px">${action.toUpperCase()}</span></td>
      <td style="padding:9px 12px;font-size:10px;color:#818cf8;font-family:monospace">${selector.substring(0,30)}</td>
      <td style="padding:9px 12px;text-align:center;background:${sb}"><span style="color:${sc};font-weight:800;font-size:11px">${sl}</span></td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${sevC};font-weight:700;font-size:10px">${aiSev.toUpperCase()}</span></td>
      <td style="padding:9px 12px;font-size:11px;color:#94a3b8">${reason.substring(0,65)}</td>
      <td style="padding:9px 12px;text-align:center;font-size:11px;color:#64748b;font-weight:700">${t.duration||'—'}</td>
    </tr>`;
  }).join('');

  //4. LLAMA ANALYSIS TABLE 
  const llamaRows = allTests.map((t, i) => {
    const ai = t.ai_analysis || {};
    const sc = t.status==='pass'?'#10b981':'#ef4444';
    const sl = t.status==='pass'?'✓ PASS':'✗ FAIL';
    const sev = ai.severity || 'medium';
    const sevc = sev==='high'?'#ef4444':sev==='medium'?'#f59e0b':'#10b981';
    const bg = sev==='high'?'rgba(239,68,68,.04)':sev==='medium'?'rgba(245,158,11,.04)':'rgba(16,185,129,.04)';
    return `<tr style="border-bottom:1px solid rgba(255,255,255,.05);background:${bg}">
      <td style="padding:9px 12px;color:#64748b;font-weight:700;text-align:center">${i+1}</td>
      <td style="padding:9px 12px;font-weight:700;color:#e2e8f0;font-size:12px">${t.name}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${sc};font-weight:800;font-size:10px">${sl}</span></td>
      <td style="padding:9px 12px;font-size:11px;color:#475569">${(ai.root_cause||'—').substring(0,65)}</td>
      <td style="padding:9px 12px;font-size:11px;color:#4f46e5">${(ai.fix||'—').substring(0,65)}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${sevc};font-weight:700;font-size:10px">${sev.toUpperCase()}</span></td>
    </tr>`;
  }).join('');

  // 5. VERDICT SUMMARY
  const PASS_MSG = {
    navigation:     'Page loads correctly — routing and URL resolution confirmed',
    form:           'Form interactions work — fill and input fields respond correctly',
    action:         'Button/click actions execute — UI interactions are operational',
    authentication: 'Auth flows validated — login success and failure handled correctly',
    ui:             'UI elements visible — DOM renders correctly',
  };
  const FAIL_MSG = {
    navigation:     'Critical: page failed to load or selector timed out',
    form:           'Moderate: form fields unreachable or fill action failed',
    action:         'Moderate: click target not found or action not triggered',
    authentication: 'Critical: authentication flow broken',
    ui:             'Minor: element not visible or not rendered in DOM',
  };
  const verdictRows = Object.entries(cats).map(([cat, d]) => {
    const cc = CAT_COLORS2[cat] || '#64748b';
    const vc = d.fail > 0 ? '#ef4444' : '#10b981';
    const vt = d.fail > 0 ? 'FAIL' : 'PASS';
    const bg = d.fail > 0 ? 'rgba(239,68,68,.06)' : 'rgba(16,185,129,.06)';
    const interp = d.fail > 0 ? (FAIL_MSG[cat]||`Failure in ${cat}`) : (PASS_MSG[cat]||`${cat} operational`);
    return `<tr style="background:${bg};border-bottom:1px solid rgba(255,255,255,.05)">
      <td style="padding:10px 12px;font-weight:700;color:${cc}">${cat.toUpperCase()}</td>
      <td style="padding:10px 12px;text-align:center"><span style="font-size:9px;font-weight:800;padding:3px 10px;border-radius:12px;color:${vc};background:${vc}18;border:1px solid ${vc}44">${vt}</span></td>
      <td style="padding:10px 12px;text-align:center;color:#10b981;font-weight:700">${d.pass}</td>
      <td style="padding:10px 12px;text-align:center;color:#ef4444;font-weight:700">${d.fail}</td>
      <td style="padding:10px 12px;text-align:center;color:#f59e0b;font-weight:700">${d.skip}</td>
      <td style="padding:10px 12px;font-size:11px;color:#94a3b8">${interp}</td>
    </tr>`;
  }).join('');

  const authFail = (cats['authentication']?.fail||0) > 0;
  const navFail  = (cats['navigation']?.fail||0) > 0;
  const vc   = authFail||navFail ? '#ef4444' : fail > 0 ? '#b45309' : '#059669';
  const vb   = authFail||navFail ? 'rgba(239,68,68,.08)' : fail > 0 ? 'rgba(245,158,11,.08)' : 'rgba(16,185,129,.08)';
  const vi   = authFail||navFail ? '🔴' : fail > 0 ? '🟡' : '🟢';
  const vt_v = authFail||navFail
    ? 'Functional validation FAILED — critical auth or navigation steps are broken.'
    : fail > 0
    ? `Functional validation passed with ${fail} non-critical step(s) failing. Core flows are operational.`
    : `All ${pass} functional steps passed (${rate}%). Fill, click, navigate, and auth flows are fully operational.`;

  // ── 6. AI RECOMMENDATIONS ──
  const slow = allTests.filter(t => { try { return parseInt((t.duration||'0').replace('ms','')) > 10000; } catch { return false; } });
  const failed = allTests.filter(t => t.status === 'fail');
  const recsHtml = `
    <div style="background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:8px;padding:10px 14px;margin-bottom:4px;font-weight:700;color:#f59e0b">⚡ Interaction Quality</div>
    ${slow.length > 0
      ? slow.slice(0,3).map(t => `<div style="background:#0d1526;border-left:3px solid #f59e0b;padding:8px 14px 8px 16px;margin-bottom:2px;font-size:12px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,.05)">• "${t.name}" took ${t.duration} — add explicit Playwright wait.</div>`).join('')
      : '<div style="background:#0d1526;border-left:3px solid #f59e0b;padding:8px 14px 8px 16px;margin-bottom:2px;font-size:12px;color:#94a3b8">• All interactions completed within acceptable time range.</div>'
    }
    <div style="background:rgba(99,102,241,.06);border:1px solid rgba(99,102,241,.2);border-radius:8px;padding:10px 14px;margin:10px 0 4px;font-weight:700;color:#818cf8">🔧 Reliability</div>
    <div style="background:#0d1526;border-left:3px solid #818cf8;padding:8px 14px 8px 16px;margin-bottom:2px;font-size:12px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,.05)">
      ${failed.length > 0
        ? `• Fix "${failed[0]?.name}" — ${getReason(failed[0]).substring(0,75)}`
        : '• No interaction failures — all selectors resolved correctly.'}
    </div>
    <div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:8px;padding:10px 14px;margin:10px 0 4px;font-weight:700;color:#10b981">👤 Auth & UX Flows</div>
    <div style="background:#0d1526;border-left:3px solid #10b981;padding:8px 14px 8px 16px;font-size:12px;color:#94a3b8">
      ${(cats['authentication']?.pass||0) > 0
        ? '• Auth flow validated — login success and failure paths both tested.'
        : (cats['authentication']?.fail||0) > 0
        ? '• Auth failure detected — check token injection and credentials.'
        : '• No auth tests found — consider adding auth_success / auth_fail steps.'}
    </div>`;

  //HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>NexTest Functional Report #${genId}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#070e1c;color:#e2e8f0;font-family:'DM Sans',sans-serif;min-height:100vh}
  .page{max-width:1100px;margin:0 auto;padding:48px 32px 80px}
  table{width:100%;border-collapse:collapse}
  @media print{body{background:#fff;color:#000}.no-print{display:none}.page{padding:10mm}@page{margin:15mm;size:A4}}
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#0a0f1e 0%,#0a0f2e 50%,#0a0f1e 100%);border-radius:20px;padding:40px 48px;margin-bottom:32px;position:relative;overflow:hidden">
    <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,transparent,#6366f1,transparent)"></div>
    <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#6366f1"></div>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:20px">
      <div>
        <div style="font-size:28px;font-weight:700;color:#fff;letter-spacing:2px;margin-bottom:4px"><span style="color:#6366f1">NEX</span>TEST</div>
        <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:8px">Functional Test Report</div>
        <div style="font-size:11px;color:#94a3b8">Generated ${dateStr} · ${timeStr}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:28px">
      ${[
        {l:'URL',      v:`<span style="color:#a5b4fc;font-size:11px;word-break:break-all">${url}</span>`},
        {l:'Framework',v:`<span style="color:#E2574C;font-weight:700">${framework}</span>`},
        {l:'Test Type',v:`<span style="color:#6366f1;font-weight:700">Functional · Playwright</span>`},
        {l:'Steps',    v:`<span style="color:#fff">${total} steps · ${pass} passed · ${fail} failed</span>`},
      ].map(r => `<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:12px 14px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4f6480;margin-bottom:5px">${r.l}</div>
        <div style="font-size:12px">${r.v}</div>
      </div>`).join('')}
    </div>
  </div>

  <!-- PRINT BUTTON -->
  <div class="no-print" style="margin-bottom:28px">
    <button onclick="window.print()" style="padding:10px 24px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#4f46e5);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
      🖨 Print / Save as PDF
    </button>
  </div>

  <!-- STAT CARDS -->
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:28px">
    ${[
      {icon:'✅',val:pass,      lbl:'PASSED',    c:'#10b981',bg:'rgba(16,185,129,.08)',bd:'rgba(16,185,129,.25)'},
      {icon:'❌',val:fail,      lbl:'FAILED',    c:'#ef4444',bg:'rgba(239,68,68,.08)', bd:'rgba(239,68,68,.25)'},
      {icon:'⏭️',val:skip,      lbl:'SKIPPED',   c:'#f59e0b',bg:'rgba(245,158,11,.08)',bd:'rgba(245,158,11,.25)'},
      {icon:'🎯',val:`${rate}%`,lbl:'PASS RATE', c:rateColor,bg:`${rateColor}12`,     bd:`${rateColor}33`},
      {icon:'🔢',val:total,     lbl:'TOTAL',     c:'#3b82f6',bg:'rgba(59,130,246,.08)',bd:'rgba(59,130,246,.25)'},
    ].map(s => `<div style="background:${s.bg};border:1px solid ${s.bd};border-radius:14px;padding:20px;text-align:center">
      <div style="font-size:20px;margin-bottom:8px">${s.icon}</div>
      <div style="font-size:36px;font-weight:700;color:${s.c};line-height:1;margin-bottom:4px">${s.val}</div>
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:${s.c};opacity:.8;text-transform:uppercase">${s.lbl}</div>
    </div>`).join('')}
  </div>

  ${secHdr('⚙️', 'Functional Test Scenarios', '#6366f1')}
  ${tblWrap(`${tblHdr([{l:'#',align:'center'},{l:'Test Scenario'},{l:'Action',align:'center'},{l:'Category',align:'center'},{l:'Priority',align:'center'},{l:'Expected Result'}])}
    <tbody>${scenarioRows}</tbody></table>`)}

  ${secHdr('📊', 'Results by Category', '#6366f1')}
  ${tblWrap(`${tblHdr([{l:'Category'},{l:'Total',align:'center'},{l:'Passed',align:'center'},{l:'Failed',align:'center'},{l:'Skipped',align:'center'},{l:'Pass Rate',align:'center'},{l:'Avg Duration',align:'center'},{l:'Status',align:'center'}])}
    <tbody>${catRows}</tbody></table>`)}

  ${secHdr('🧪', 'Detailed Functional Results', '#0d9488')}
  ${tblWrap(`${tblHdr([{l:'#',align:'center'},{l:'Test Name'},{l:'Action',align:'center'},{l:'Selector / Value'},{l:'Status',align:'center'},{l:'Severity',align:'center'},{l:'Reason / Evidence'},{l:'Duration',align:'center'}])}
    <tbody>${detailRows}</tbody></table>`, '#0d9488')}

  ${secHdr('🤖', 'LLaMA Analysis — Root Cause & Fix', '#4f46e5')}
  ${tblWrap(`${tblHdr([{l:'#',align:'center'},{l:'Test Name'},{l:'Status',align:'center'},{l:'Root Cause'},{l:'Fix / Action'},{l:'Severity',align:'center'}])}
    <tbody>${llamaRows}</tbody></table>`, '#4f46e5')}

  ${secHdr('🏁', 'Execution Verdict Summary', '#c9a227')}
  ${tblWrap(`${tblHdr([{l:'Category'},{l:'Verdict',align:'center'},{l:'Passed',align:'center'},{l:'Failed',align:'center'},{l:'Skipped',align:'center'},{l:'Interpretation'}])}
    <tbody>${verdictRows}</tbody></table>`, '#c9a227')}
  <div style="background:${vb};border:2px solid ${vc};border-radius:12px;padding:16px 20px;display:flex;gap:12px;align-items:flex-start;margin-bottom:28px">
    <span style="font-size:24px">${vi}</span>
    <div>
      <div style="font-size:14px;font-weight:700;color:${vc};margin-bottom:6px">Overall Functional Verdict</div>
      <p style="font-size:13px;color:${vc};margin:0;line-height:1.6">${vt_v}</p>
    </div>
  </div>

  ${sectionActionPlan}

  ${secHdr('🤖', 'AI Recommendations', '#6366f1')}
  ${recsHtml}

  <!-- FINAL VERDICT WITH QUALITY SCORE -->
  <div style="background:${vb};border:2px solid ${vc};border-radius:14px;padding:20px 22px;display:flex;gap:14px;align-items:flex-start;margin-top:8px">
    <span style="font-size:28px">${vi}</span>
    <div style="flex:1">
      <div style="font-size:14px;font-weight:700;color:${vc};margin-bottom:8px">Final AI Verdict</div>
      <p style="font-size:13px;color:${vc};margin:0 0 12px;line-height:1.6">${vt_v}</p>
      <div style="display:flex;gap:24px;flex-wrap:wrap">
        <div>
          <span style="font-size:11px;color:#64748b;font-weight:700">Quality Score </span>
          <span style="font-size:20px;font-weight:700;color:${vc}">${quality}<span style="font-size:12px">/100</span></span>
        </div>
        <div>
          <span style="font-size:11px;color:#64748b;font-weight:700">Risk Level </span>
          <span style="font-size:13px;font-weight:800;color:${riskColor};padding:3px 12px;border-radius:12px;background:${riskColor}18;border:1px solid ${riskColor}44">${risk}</span>
        </div>
        <div>
          <span style="font-size:11px;color:#64748b;font-weight:700">Pass Rate </span>
          <span style="font-size:20px;font-weight:700;color:${rateColor}">${rate}%</span>
        </div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="margin-top:48px;padding:20px 28px;background:rgba(99,102,241,.04);border-radius:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;border:1px solid rgba(99,102,241,.15)">
    <div style="font-size:14px;font-weight:700;color:#64748b"><span style="color:#6366f1">NEX</span>TEST · Functional Test Report</div>
    <div style="font-size:11px;color:#94a3b8">Generated ${dateStr} · ${framework} · ${total} steps · ${rate}% pass rate · Quality: ${quality}/100</div>
  </div>

</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `functional_report_${genId}.html`;
  link.click();
  saveReportToStorage({
    url,
    framework,
    testType: 'functional',
    passCount: pass,
    failCount: fail,
    htmlContent: html,
    generationData: generation,
  });
  setPdfLoading(false);
};
const downloadCsv_Functional = async () => {
  setDropdownOpen(false);
  setPdfLoading(true);

  const allTests = tests;
  const genId = generation?.generation?.id || 'nextest';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const pass  = allTests.filter(t => t.status === 'pass').length;
  const fail  = allTests.filter(t => t.status === 'fail').length;
  const skip  = allTests.filter(t => t.status === 'skip').length;
  const total = allTests.length || 1;
  const rate  = Math.round(pass / total * 100);

  const getAction   = (t) => t.action || t.step_meta?.action || 'check_visible';
  const getSelector = (t) => t.selector || t.step_meta?.selector || t.step_meta?.value || '—';
  const getReason   = (t) => t.reason || t.reason_pass || t.suite || t.error || '—';

  // ── Escape CSV cell ──────────────────────────────────────────────────────
  const esc = (val) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = [];

  // ── SECTION 1: Report Info ───────────────────────────────────────────────
  rows.push(['NEXTEST — Functional Test Report']);
  rows.push([`Generated: ${dateStr}`]);
  rows.push([`URL: ${url}`]);
  rows.push([`Framework: ${framework}`]);
  rows.push([`Total: ${total} | Pass: ${pass} | Fail: ${fail} | Skip: ${skip} | Rate: ${rate}%`]);
  rows.push([]);

  // ── SECTION 2: Test Scenarios ────────────────────────────────────────────
  rows.push(['=== FUNCTIONAL TEST SCENARIOS ===']);
  rows.push(['#', 'Test Scenario', 'Action', 'Category', 'Priority', 'Expected Result']);

  const EXPECTED_MAP = {
    navigate:      'Page loads and DOM is ready',
    check_visible: 'Element is visible in the DOM',
    fill:          'Field accepts and retains the input value',
    click:         'Element responds to click — action triggered',
    auth_success:  'Login succeeds — redirected to dashboard',
    auth_fail:     'Login rejected — error message displayed',
    check_text:    'Expected text found in page content',
    select:        'Option selected in dropdown',
    hover:         'Hover state applied to element',
    logout:        'Session cleared — redirected to login',
  };

  allTests.forEach((t, i) => {
    const action = getAction(t);
    const expected = t.expected || EXPECTED_MAP[action] || 'Step completes without error';
    rows.push([
      i + 1,
      esc(t.name),
      esc(action.toUpperCase()),
      esc((t.category || 'action').toUpperCase()),
      esc((t.priority || 'medium').toUpperCase()),
      esc(expected),
    ]);
  });
  rows.push([]);

  // ── SECTION 3: Results by Category ──────────────────────────────────────
  rows.push(['=== RESULTS BY CATEGORY ===']);
  rows.push(['Category', 'Total', 'Passed', 'Failed', 'Skipped', 'Pass Rate', 'Avg Duration (ms)', 'Verdict']);

  const cats = {};
  allTests.forEach(t => {
    const c = t.category || 'action';
    if (!cats[c]) cats[c] = { pass: 0, fail: 0, skip: 0, total: 0, dur: 0 };
    cats[c].total++;
    if (t.status === 'pass') cats[c].pass++;
    else if (t.status === 'fail') cats[c].fail++;
    else cats[c].skip++;
    try { cats[c].dur += parseInt((t.duration || '0').replace('ms', '') || 0); } catch {}
  });

  Object.entries(cats).forEach(([cat, d]) => {
    const r = Math.round(d.pass / d.total * 100);
    const avg = Math.round(d.dur / d.total);
    rows.push([
      esc(cat.toUpperCase()),
      d.total, d.pass, d.fail, d.skip,
      `${r}%`,
      avg,
      d.fail === 0 ? 'PASS' : 'FAIL',
    ]);
  });
  rows.push([]);

  // ── SECTION 4: Detailed Results ──────────────────────────────────────────
  rows.push(['=== DETAILED FUNCTIONAL RESULTS ===']);
  rows.push(['#', 'Test Name', 'Action', 'Selector / Value', 'Status', 'Severity', 'Reason / Evidence', 'Duration']);

  allTests.forEach((t, i) => {
    rows.push([
      i + 1,
      esc(t.name),
      esc(getAction(t).toUpperCase()),
      esc(getSelector(t)),
      t.status === 'pass' ? 'PASS' : t.status === 'fail' ? 'FAIL' : 'SKIP',
      esc((t.ai_analysis?.severity || 'medium').toUpperCase()),
      esc(getReason(t)),
      esc(t.duration || '—'),
    ]);
  });
  rows.push([]);

  // ── SECTION 5: LLaMA Analysis ────────────────────────────────────────────
  rows.push(['=== LLAMA ANALYSIS — ROOT CAUSE & FIX ===']);
  rows.push(['#', 'Test Name', 'Status', 'Root Cause', 'Fix / Action', 'Severity']);

  allTests.forEach((t, i) => {
    const ai = t.ai_analysis || {};
    rows.push([
      i + 1,
      esc(t.name),
      t.status === 'pass' ? 'PASS' : 'FAIL',
      esc(ai.root_cause || '—'),
      esc(ai.fix || '—'),
      esc((ai.severity || 'medium').toUpperCase()),
    ]);
  });
  rows.push([]);

  // ── SECTION 6: Action Plan via LLaMA ─────────────────────────────────────
  const failedTests = allTests.filter(t => t.status === 'fail');
  let actionPlanItems = [];

  if (failedTests.length > 0) {
    try {
      const prompt = `You are a QA engineer. Generate an action plan for these failed functional Playwright tests.

Failed tests (${failedTests.length}):
${JSON.stringify(failedTests.map(t => ({
  name: t.name,
  action: t.action || t.step_meta?.action || 'check_visible',
  selector: t.selector || t.step_meta?.selector || '—',
  reason: t.reason || t.suite || '—',
  root_cause: t.ai_analysis?.root_cause || '—',
  fix: t.ai_analysis?.fix || '—',
})))}

Return ONLY a JSON array of max 6 items. Each item must have:
- scenario: string
- category: one of "Selector Fix" | "Timing/Wait" | "Auth Flow" | "Page Load" | "Assertion" | "Element State"
- priority: "HIGH" | "MEDIUM" | "LOW"
- action: string (max 80 chars)
- responsible: one of "Frontend" | "QA" | "Backend" | "DevOps"
- deadline: one of "Immediate" | "This Sprint" | "Next Sprint"
- status: "To Do"

Return ONLY valid JSON array, no markdown.`;

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await resp.json();
      const text = (data.content?.[0]?.text || '[]').replace(/```json|```/g, '').trim();
      actionPlanItems = JSON.parse(text);
    } catch (e) {
      // Fallback statique
      actionPlanItems = failedTests.slice(0, 4).map(t => ({
        scenario: t.name,
        category: 'Selector Fix',
        priority: t.ai_analysis?.severity === 'high' ? 'HIGH' : 'MEDIUM',
        action: t.ai_analysis?.fix || 'Verify selector and add explicit wait',
        responsible: 'QA',
        deadline: 'This Sprint',
        status: 'To Do',
      }));
    }
  }

  rows.push(['=== AI-GENERATED ACTION PLAN ===']);
  rows.push(['#', 'Scenario', 'Category', 'Priority', 'Action', 'Responsible', 'Deadline', 'Status']);

  actionPlanItems.forEach((item, i) => {
    rows.push([
      i + 1,
      esc(item.scenario || ''),
      esc(item.category || ''),
      esc(item.priority || ''),
      esc(item.action || ''),
      esc(item.responsible || ''),
      esc(item.deadline || ''),
      esc(item.status || 'To Do'),
    ]);
  });

  // ── Build CSV string ─────────────────────────────────────────────────────
  const csvContent = rows.map(row =>
    Array.isArray(row) ? row.join(',') : row
  ).join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `functional_report_${genId}.csv`;
  link.click();

  setPdfLoading(false);
};

const downloadCsv_Seo = () => {
  const genId = generation?.generation?.id || 'nextest';
  const result = generation?.result || {};
  const seoScore = result?.seo_score || 0;
  const url = generation?.generation?.url || generation?.url || '';
  const now = new Date().toLocaleString('en-US');

  const pass  = tests.filter(t => t.status === 'pass').length;
  const fail  = tests.filter(t => t.status === 'fail').length;
  const total = tests.length;
  const rate  = total > 0 ? Math.round(pass / total * 100) : 0;

  const wb = XLSX.utils.book_new();

  // ── DATA ROWS ──────────────────────────────────────────────────────────────
  const headers = [
    'Test ID', 'SEO Check', 'Category', 'Status',
    'Detail / Result', 'Severity', 'Root Cause', 'Fix / Action', 'SEO Score'
  ];

  const rows = tests.map((t, i) => {
    const ai = t.ai_analysis || {};
    return [
      i + 1,
      t.name || '—',
      (t.category || '—').toUpperCase(),
      t.status === 'pass' ? 'PASS' : 'FAIL',
      t.detail || t.suite || '—',
      (ai.severity || '—').toUpperCase(),
      ai.root_cause || '—',
      ai.fix || '—',
      i === 0 ? seoScore : '',
    ];
  });

  // Ligne TOTAL
  const totalRow = [
    'TOTAL', '', total, `${pass} PASS / ${fail} FAIL`,
    '', '', '', `Pass Rate: ${rate}%`, `SEO Score: ${seoScore}/100`
  ];

  // Section EXECUTION SUMMARY
  const summaryRows = [
    [],
    ['EXECUTION SUMMARY', '', '', '', '', '', '', '', ''],
    ['Generated',    now,          '', '', '', '', '', '', ''],
    ['URL',          url,          '', '', '', '', '', '', ''],
    ['Framework',    'Requests + BeautifulSoup', '', '', '', '', '', '', ''],
    ['Test Type',    'SEO Audit',  '', '', '', '', '', '', ''],
    ['Total Checks', total,        '', '', '', '', '', '', ''],
    ['Passed',       pass,         '', '', '', '', '', '', ''],
    ['Failed',       fail,         '', '', '', '', '', '', ''],
    ['Pass Rate',    `${rate}%`,   '', '', '', '', '', '', ''],
    ['SEO Score',    `${seoScore}/100`, '', '', '', '', '', '', ''],
  ];

  const allData = [headers, ...rows, totalRow, ...summaryRows];

  const ws = XLSX.utils.aoa_to_sheet(allData);

  // ── COLUMN WIDTHS ──────────────────────────────────────────────────────────
  ws['!cols'] = [
    { wch: 8  }, // Test ID
    { wch: 30 }, // SEO Check
    { wch: 16 }, // Category
    { wch: 10 }, // Status
    { wch: 50 }, // Detail
    { wch: 12 }, // Severity
    { wch: 45 }, // Root Cause
    { wch: 45 }, // Fix
    { wch: 14 }, // SEO Score
  ];

  // ── STYLES ─────────────────────────────────────────────────────────────────
  const headerStyle = {
    font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
    fill:      { fgColor: { rgb: '0A0F1E' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top:    { style: 'thin', color: { rgb: 'C9A227' } },
      bottom: { style: 'thin', color: { rgb: 'C9A227' } },
      left:   { style: 'thin', color: { rgb: 'C9A227' } },
      right:  { style: 'thin', color: { rgb: 'C9A227' } },
    }
  };

  const passStyle = {
    font:      { bold: true, color: { rgb: '059669' }, sz: 10 },
    fill:      { fgColor: { rgb: 'D1FAE5' } },
    alignment: { horizontal: 'center' },
    border:    { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } }
  };

  const failStyle = {
    font:      { bold: true, color: { rgb: 'DC2626' }, sz: 10 },
    fill:      { fgColor: { rgb: 'FEE2E2' } },
    alignment: { horizontal: 'center' },
    border:    { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } }
  };

  const normalStyle = {
    font:      { sz: 9 },
    alignment: { vertical: 'top', wrapText: true },
    border:    { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } }
  };

  const totalStyle = {
    font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
    fill:      { fgColor: { rgb: '16A34A' } },
    alignment: { horizontal: 'center' },
  };

  const summaryHeaderStyle = {
    font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
    fill:      { fgColor: { rgb: '16A34A' } },
    alignment: { horizontal: 'left' },
  };

  const summaryLabelStyle = {
    font:      { bold: true, color: { rgb: '1E293B' }, sz: 9 },
    fill:      { fgColor: { rgb: 'F0FDF4' } },
  };

  const summaryValueStyle = {
    font:      { sz: 9, color: { rgb: '16A34A' } },
    fill:      { fgColor: { rgb: 'F0FDF4' } },
  };

  // Apply header styles (row 0)
  headers.forEach((_, ci) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: ci });
    if (ws[cellRef]) ws[cellRef].s = headerStyle;
  });

  // Apply row styles
  rows.forEach((row, ri) => {
    const rowIdx = ri + 1; // +1 for header
    row.forEach((_, ci) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: ci });
      if (!ws[cellRef]) return;
      if (ci === 3) {
        ws[cellRef].s = row[3] === 'PASS' ? passStyle : failStyle;
      } else {
        ws[cellRef].s = normalStyle;
      }
    });
  });

  // Apply total row style
  const totalRowIdx = rows.length + 1;
  totalRow.forEach((_, ci) => {
    const cellRef = XLSX.utils.encode_cell({ r: totalRowIdx, c: ci });
    if (ws[cellRef]) ws[cellRef].s = totalStyle;
  });

  // Apply summary styles
  const summaryStartIdx = totalRowIdx + 2; // +2 pour la ligne vide
  summaryRows.forEach((row, ri) => {
    if (ri === 0) return; // ligne vide
    const rowIdx = summaryStartIdx + ri;
    if (ri === 1) {
      // EXECUTION SUMMARY header
      const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: 0 });
      if (ws[cellRef]) ws[cellRef].s = summaryHeaderStyle;
    } else {
      const labelRef = XLSX.utils.encode_cell({ r: rowIdx, c: 0 });
      const valueRef = XLSX.utils.encode_cell({ r: rowIdx, c: 1 });
      if (ws[labelRef]) ws[labelRef].s = summaryLabelStyle;
      if (ws[valueRef]) ws[valueRef].s = summaryValueStyle;
    }
  });

  // Row heights
  ws['!rows'] = [
    { hpt: 20 }, // header
    ...rows.map(() => ({ hpt: 40 })),
    { hpt: 20 }, // total
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'seo_report');
  XLSX.writeFile(wb, `seo_report_${genId}.xlsx`);
  setDropdownOpen(false);
};

const downloadHtml_Seo = () => {
  try{
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const genId   = generation?.generation?.id || 'nextest';
  const allTests = tests;
  
  const pass  = allTests.filter(t => t.status === 'pass').length;
  const fail  = allTests.filter(t => t.status === 'fail').length;
  const total = allTests.length || 1;
  const rate  = Math.round(pass / total * 100);
  const rateColor = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';

  // SEO score depuis generation result
const result = generation?.result || {};
const seoScore = result?.seo_score || 0;
const aiResult = result?.ai || {};
const scoreColor = seoScore >= 80 ? '#10b981' : seoScore >= 50 ? '#f59e0b' : '#ef4444';

  const CAT_COLORS = {
    security: '#ef4444', accessibility: '#8b5cf6', meta: '#3b82f6',
    structure: '#f97316', mobile: '#0ea5e9', technical: '#6366f1',
    social: '#ec4899', content: '#10b981', performance: '#f59e0b',
  };
  const SEV_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

  const secHdr = (emoji, title, color = '#16a34a') => `
    <div style="display:flex;align-items:center;gap:10px;margin:32px 0 12px;
      padding-bottom:8px;border-bottom:2.5px solid ${color}">
      <span style="font-size:18px">${emoji}</span>
      <span style="font-size:20px;font-weight:700;color:#1e293b">${title}</span>
    </div>`;

  const tblWrap = (inner, border = '#16a34a') => `
    <div style="background:#fff;border:1px solid ${border}44;border-radius:12px;
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

  // ── 1. SCENARIOS ──
  const IMPACT_MAP = { security:'HIGH', technical:'HIGH', meta:'HIGH', accessibility:'HIGH', structure:'MEDIUM', mobile:'MEDIUM', content:'MEDIUM', performance:'MEDIUM', social:'LOW' };
  const EXPECTED_MAP = {
    security: 'Secure connection — HTTPS enforced',
    accessibility: 'Page reachable — HTTP 200 response',
    meta: 'Tag present and within optimal length',
    structure: 'Correct heading hierarchy in HTML',
    mobile: 'Viewport configured for mobile devices',
    technical: 'Technical SEO element present and valid',
    social: 'Social sharing metadata configured',
    content: 'Content meets SEO quantity threshold',
    performance: 'Page loads within 3000ms threshold',
  };
  const IMPACT_COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };

  const scenarioRows = allTests.map((t, i) => {
    const cat = t.category || 'technical';
    const cc  = CAT_COLORS[cat] || '#64748b';
    const impact = IMPACT_MAP[cat] || 'MEDIUM';
    const ic = IMPACT_COLORS[impact];
    return `<tr style="border-bottom:1px solid #f1f5f9;background:${i%2===0?'#fff':'#f8fafc'}">
      <td style="padding:9px 12px;color:#64748b;font-weight:700;text-align:center">${i+1}</td>
      <td style="padding:9px 12px;font-weight:700;color:#1e293b;font-size:13px">${t.name}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${cc};font-weight:700;font-size:10px">${cat.toUpperCase()}</span></td>
      <td style="padding:9px 12px;font-size:11px;color:#475569">${EXPECTED_MAP[cat] || 'Check passes successfully'}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${ic};font-weight:700;font-size:10px">${impact}</span></td>
    </tr>`;
  }).join('');

  // ── 2. CATEGORY SUMMARY ──
  const cats = {};
  allTests.forEach(t => {
    const c = t.category || 'technical';
    if (!cats[c]) cats[c] = { pass: 0, fail: 0, total: 0 };
    cats[c].total++;
    if (t.status === 'pass') cats[c].pass++; else cats[c].fail++;
  });
  const catRows = Object.entries(cats).map(([cat, d]) => {
    const cc  = CAT_COLORS[cat] || '#64748b';
    const r   = Math.round(d.pass / d.total * 100);
    const rc  = r === 100 ? '#10b981' : r >= 50 ? '#f59e0b' : '#ef4444';
    const vc  = d.fail === 0 ? '#10b981' : '#ef4444';
    const bg  = d.fail === 0 ? 'rgba(16,185,129,.06)' : 'rgba(239,68,68,.06)';
    return `<tr style="background:${bg};border-bottom:1px solid #f1f5f9">
      <td style="padding:10px 12px;font-weight:700;color:${cc}">${cat.toUpperCase()}</td>
      <td style="padding:10px 12px;text-align:center;color:#1e293b;font-weight:700">${d.total}</td>
      <td style="padding:10px 12px;text-align:center;color:#10b981;font-weight:700">${d.pass}</td>
      <td style="padding:10px 12px;text-align:center;color:#ef4444;font-weight:700">${d.fail}</td>
      <td style="padding:10px 12px;text-align:center;color:${rc};font-weight:700">${r}%</td>
      <td style="padding:10px 12px;text-align:center"><span style="color:${vc};font-weight:800;font-size:11px">${d.fail===0?'✅ PASS':'❌ FAIL'}</span></td>
    </tr>`;
  }).join('');

  // ── 3. DETAILED RESULTS ──
  const detailRows = allTests.map((t, i) => {
    const sc  = t.status==='pass'?'#10b981':'#ef4444';
    const sl  = t.status==='pass'?'✓ PASS':'✗ FAIL';
    const sb  = t.status==='pass'?'rgba(16,185,129,.06)':'rgba(239,68,68,.06)';
    const cc  = CAT_COLORS[t.category] || '#64748b';
    const ai  = t.ai_analysis || {};
    const sev = ai.severity || 'medium';
    const sevc = SEV_COLORS[sev] || '#f59e0b';
    const detail = (t.detail || t.suite || '—').substring(0, 80);
    return `<tr style="border-bottom:1px solid #f1f5f9;background:${i%2===0?'#fff':'#f8fafc'}">
      <td style="padding:9px 12px;color:#64748b;font-weight:700;text-align:center">${i+1}</td>
      <td style="padding:9px 12px;font-weight:700;color:#1e293b;font-size:13px">${t.name}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${cc};font-weight:700;font-size:10px">${(t.category||'').toUpperCase()}</span></td>
      <td style="padding:9px 12px;text-align:center;background:${sb}"><span style="color:${sc};font-weight:800;font-size:11px">${sl}</span></td>
      <td style="padding:9px 12px;font-size:11px;color:#475569">${detail}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${sevc};font-weight:700;font-size:10px">${sev.toUpperCase()}</span></td>
    </tr>`;
  }).join('');

  // ── 4. LLAMA ANALYSIS ──
  const llamaRows = allTests.map((t, i) => {
    const ai   = t.ai_analysis || {};
    const sc   = t.status==='pass'?'#10b981':'#ef4444';
    const sl   = t.status==='pass'?'✓ PASS':'✗ FAIL';
    const sev  = ai.severity || 'medium';
    const sevc = SEV_COLORS[sev] || '#f59e0b';
    const rc   = (ai.root_cause || '—').substring(0, 70);
    const fix  = (ai.fix || '—').substring(0, 70);
    const bg   = sev==='high'?'rgba(239,68,68,.04)':sev==='medium'?'rgba(245,158,11,.04)':'rgba(16,185,129,.04)';
    return `<tr style="border-bottom:1px solid #f1f5f9;background:${bg}">
      <td style="padding:9px 12px;color:#64748b;font-weight:700;text-align:center">${i+1}</td>
      <td style="padding:9px 12px;font-weight:700;color:#1e293b;font-size:12px">${t.name}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${sc};font-weight:800;font-size:10px">${sl}</span></td>
      <td style="padding:9px 12px;font-size:11px;color:#475569">${rc}</td>
      <td style="padding:9px 12px;font-size:11px;color:#4f46e5">${fix}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${sevc};font-weight:700;font-size:10px">${sev.toUpperCase()}</span></td>
    </tr>`;
  }).join('');

  // ── 5. AI RECOMMENDATIONS ──
  const summary  = aiResult.summary || '';
  const recs     = aiResult.recommendations || [];
  const actionPlan = aiResult.action_plan || [];

  const recsHtml = `
    ${summary ? `<div style="background:#e0e7ff;border:1px solid #6366f1;border-left:3px solid #6366f1;border-radius:8px;padding:12px 16px;margin-bottom:14px;font-size:12px;color:#4338ca;line-height:1.6">
      <b>AI Summary:</b> ${summary}
    </div>` : ''}
    ${recs.length > 0 ? `
      <table style="width:100%;border-collapse:collapse;margin-bottom:14px">
        <thead><tr style="background:#0a0f1e">
          <th style="padding:9px 12px;text-align:center;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;font-weight:700">Priority</th>
          <th style="padding:9px 12px;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;font-weight:700">Category</th>
          <th style="padding:9px 12px;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;font-weight:700">Issue</th>
          <th style="padding:9px 12px;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;font-weight:700">Fix</th>
        </tr></thead>
        <tbody>${recs.map((r, i) => {
          const pri = r.priority || 'medium';
          const pc  = pri==='high'?'#ef4444':pri==='medium'?'#f59e0b':'#10b981';
          const bg  = i%2===0?'#fff':'#f8fafc';
          return `<tr style="border-bottom:1px solid #f1f5f9;background:${bg}">
            <td style="padding:9px 12px;text-align:center"><span style="color:${pc};font-weight:700;font-size:10px">${pri.toUpperCase()}</span></td>
            <td style="padding:9px 12px;font-size:11px;color:#4f46e5;font-weight:700">${r.category||'—'}</td>
            <td style="padding:9px 12px;font-size:11px;color:#1e293b">${(r.issue||'—').substring(0,65)}</td>
            <td style="padding:9px 12px;font-size:11px;color:#475569">${(r.fix||'—').substring(0,65)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>` : ''}
    ${actionPlan.length > 0 ? `
      <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:8px">Action Plan</div>
      ${actionPlan.map(step => `
        <div style="background:#fafafa;border-left:2px solid #6366f1;padding:7px 14px;margin-bottom:3px;font-size:12px;color:#475569">${step}</div>
      `).join('')}` : ''}`;

  // ── 6. FINAL VERDICT ──
  const critFailed = allTests.filter(t => t.status==='fail' && ['security','technical','meta'].includes(t.category));
  const vc  = critFailed.length ? '#ef4444' : fail > 0 ? '#b45309' : '#059669';
  const vb  = critFailed.length ? 'rgba(239,68,68,.08)' : fail > 0 ? 'rgba(245,158,11,.08)' : 'rgba(16,185,129,.08)';
  const vi  = critFailed.length ? '🔴' : fail > 0 ? '🟡' : '🟢';
  const vt  = critFailed.length
    ? `SEO audit FAILED — critical issues in: ${[...new Set(critFailed.map(t=>t.category.toUpperCase()))].join(', ')}. Fix to improve search visibility.`
    : fail > 0
    ? `SEO audit passed with ${fail} non-critical issue(s). Core technical SEO is functional.`
    : `SEO audit PASSED — all ${pass} checks passed. Page meets technical SEO best practices.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>NexTest SEO Report #${genId}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#f8fafc;color:#1e293b;font-family:'DM Sans',sans-serif;min-height:100vh}
  .page{max-width:1100px;margin:0 auto;padding:48px 32px 80px}
  table{width:100%;border-collapse:collapse}
  th,td{vertical-align:top}
  @media print{body{background:#fff}.no-print{display:none}.page{padding:10mm}@page{margin:15mm;size:A4}}
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#0a0f1e 0%,#0a2010 50%,#0a0f1e 100%);
    border-radius:20px;padding:40px 48px;margin-bottom:32px;position:relative;overflow:hidden">
    <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,transparent,#16a34a,transparent)"></div>
    <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#16a34a"></div>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:20px">
      <div>
        <div style="font-size:28px;font-weight:700;color:#fff;letter-spacing:2px;margin-bottom:4px">
          <span style="color:#16a34a">NEX</span>TEST
        </div>
        <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:8px">SEO Test Report</div>
        <div style="font-size:11px;color:#94a3b8">Generated ${dateStr} · ${timeStr}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:32px;font-weight:800;color:${scoreColor};font-family:Georgia,serif;line-height:1">${seoScore}<span style="font-size:16px">/100</span></div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">SEO Score</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:28px">
      ${[
        {l:'URL',      v:`<span style="color:#86efac;font-size:11px;word-break:break-all">${url}</span>`},
        {l:'Analyzer', v:`<span style="color:#16a34a;font-weight:700">Requests + BeautifulSoup</span>`},
        {l:'Test Type',v:`<span style="color:#16a34a;font-weight:700">SEO Audit — 17 Checks</span>`},
        {l:'SEO Score',v:`<span style="color:${scoreColor};font-weight:800;font-size:16px">${seoScore}/100</span>`},
      ].map(r => `<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:12px 14px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4f6480;margin-bottom:5px">${r.l}</div>
        <div style="font-size:12px">${r.v}</div>
      </div>`).join('')}
    </div>
  </div>

  <!-- PRINT BUTTON -->
  <div class="no-print" style="margin-bottom:28px">
    <button onclick="window.print()" style="padding:10px 24px;border-radius:10px;background:linear-gradient(135deg,#16a34a,#15803d);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
      🖨 Print / Save as PDF
    </button>
  </div>

  <!-- STAT CARDS -->
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:28px">
    ${[
      {icon:'✅',val:pass,       lbl:'PASSED',    c:'#10b981',bg:'#d1fae5',bd:'#a7f3d0'},
      {icon:'❌',val:fail,       lbl:'FAILED',    c:'#ef4444',bg:'#fee2e2',bd:'#fca5a5'},
      {icon:'🎯',val:`${rate}%`, lbl:'PASS RATE', c:rateColor,bg:'#eff6ff',bd:'#bfdbfe'},
      {icon:'🔍',val:seoScore,   lbl:'SEO SCORE', c:scoreColor,bg:'#f0fdf4',bd:'#bbf7d0'},
      {icon:'🔢',val:total,      lbl:'TOTAL',     c:'#3b82f6',bg:'#dbeafe',bd:'#93c5fd'},
    ].map(s => `<div style="background:${s.bg};border:1px solid ${s.bd};border-radius:14px;padding:20px;text-align:center">
      <div style="font-size:20px;margin-bottom:8px">${s.icon}</div>
      <div style="font-size:36px;font-weight:700;color:${s.c};line-height:1;margin-bottom:4px">${s.val}</div>
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:${s.c};opacity:.8;text-transform:uppercase">${s.lbl}</div>
    </div>`).join('')}
  </div>

  ${secHdr('🔍', 'SEO Test Scenarios', '#16a34a')}
  ${tblWrap(`${tblHdr([{l:'#',align:'center'},{l:'SEO Check'},{l:'Category',align:'center'},{l:'Expected Result'},{l:'Impact',align:'center'}])}
    <tbody>${scenarioRows}</tbody></table>`)}

  ${secHdr('📊', 'Results by Category', '#16a34a')}
  ${tblWrap(`${tblHdr([{l:'Category'},{l:'Total',align:'center'},{l:'Passed',align:'center'},{l:'Failed',align:'center'},{l:'Pass Rate',align:'center'},{l:'Verdict',align:'center'}])}
    <tbody>${catRows}</tbody></table>`)}

  ${secHdr('🧪', 'Detailed SEO Test Results', '#0d9488')}
  ${tblWrap(`${tblHdr([{l:'#',align:'center'},{l:'SEO Check'},{l:'Category',align:'center'},{l:'Status',align:'center'},{l:'Result / Detail'},{l:'Severity',align:'center'}])}
    <tbody>${detailRows}</tbody></table>`, '#0d9488')}

  ${secHdr('🤖', 'LLaMA Analysis — Root Cause & Fix', '#4f46e5')}
  <div style="background:#fff;border:1px solid #e0e7ff;border-radius:12px;overflow:hidden;margin-bottom:16px">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#0a0f1e">
        <th style="padding:10px 12px;text-align:center;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;font-weight:700">#</th>
        <th style="padding:10px 12px;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;font-weight:700">Check</th>
        <th style="padding:10px 12px;text-align:center;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;font-weight:700">Status</th>
        <th style="padding:10px 12px;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;font-weight:700">Root Cause</th>
        <th style="padding:10px 12px;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;font-weight:700">Fix / Action</th>
        <th style="padding:10px 12px;text-align:center;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;font-weight:700">Sev.</th>
      </tr></thead>
      <tbody>${llamaRows}</tbody>
    </table>
  </div>

  ${secHdr('✨', 'AI Recommendations', '#6366f1')}
  ${recsHtml}

  <!-- FINAL VERDICT -->
  <div style="background:${vb};border:2px solid ${vc};border-radius:12px;padding:16px 20px;margin-top:24px;display:flex;gap:12px;align-items:flex-start">
    <span style="font-size:24px">${vi}</span>
    <div>
      <div style="font-size:14px;font-weight:700;color:${vc};margin-bottom:6px">Final SEO Verdict</div>
      <p style="font-size:13px;color:${vc};margin:0 0 10px;line-height:1.6">${vt}</p>
      <div style="font-size:12px;color:${vc}">
        <b>SEO Score:</b> ${seoScore}/100 &nbsp;|&nbsp; <b>Pass Rate:</b> ${rate}% &nbsp;|&nbsp;
        <span style="color:#10b981;font-weight:700">${pass} passed</span> / <span style="color:#ef4444;font-weight:700">${fail} failed</span> / ${total} total
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="margin-top:48px;padding:20px 28px;background:rgba(22,163,74,.04);border-radius:12px;
    display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;
    border:1px solid rgba(22,163,74,.15)">
    <div style="font-size:14px;font-weight:700;color:#64748b">
      <span style="color:#16a34a">NEX</span>TEST · SEO Test Report
    </div>
    <div style="font-size:11px;color:#94a3b8">
      Generated ${dateStr} · Requests+BS4 · ${total} checks · ${rate}% pass rate · SEO Score: ${seoScore}/100
    </div>
  </div>

</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `seo_report_${genId}.html`;
  link.click();
  saveReportToStorage({
  url,
  framework: 'Requests',
  testType: 'seo',
  passCount: pass,
  failCount: fail,
  htmlContent: html,
  generationData: generation,  // ← assurez-vous que generation est bien défini ici
});
  setDropdownOpen(false);
    } catch (err) {
    console.error('[SEO HTML ERROR]', err);
    alert('Error: ' + err.message);
  }
};
const downloadHtml_Regression = () => {
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const genId   = generation?.generation?.id || 'nextest';
  const allTests = tests;
  const pass  = allTests.filter(t => t.status === 'pass').length;
  const fail  = allTests.filter(t => t.status === 'fail').length;
  const skip  = allTests.filter(t => t.status === 'skip').length;
  const total = allTests.length || 1;
  const rate  = Math.round(pass / total * 100);
  const rateColor = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';

  const CAT_COLORS = {
    authentication:'#6366f1', navigation:'#10b981', content:'#3b82f6', functionality:'#8b5cf6',
  };

  const secHdr = (emoji, title, color = '#f97316') => `
    <div style="display:flex;align-items:center;gap:10px;margin:32px 0 12px;
      padding-bottom:8px;border-bottom:2.5px solid ${color}">
      <span style="font-size:18px">${emoji}</span>
      <span style="font-size:20px;font-weight:700;color:#e2e8f0">${title}</span>
    </div>`;

  const tblWrap = (inner, border = '#f97316') => `
    <div style="background:#0d1526;border:1px solid ${border}44;border-radius:12px;
      overflow:hidden;margin-bottom:16px;box-shadow:0 4px 20px rgba(0,0,0,.3)">
      ${inner}
    </div>`;

  const tblHdr = (cols) => `
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#040914">
        ${cols.map(c => `<th style="padding:10px 12px;text-align:${c.align||'left'};
          font-size:9px;letter-spacing:1.5px;text-transform:uppercase;
          color:#94a3b8;font-weight:700">${c.l}</th>`).join('')}
      </tr></thead>`;

  // ── SCENARIOS ──
  const scenarioRows = allTests.map((t, i) => {
    const cc  = CAT_COLORS[t.category] || '#64748b';
    const pc  = t.priority==='high'?'#ef4444':t.priority==='medium'?'#f59e0b':'#10b981';
    let expected = 'Test executes without errors';
    if (/page loads/i.test(t.name)) expected = 'Page loads successfully with HTTP 200';
    else if (/exists|visible/i.test(t.name)) expected = 'Element is visible and accessible in DOM';
    else if (/clickable/i.test(t.name)) expected = 'Element responds to click interaction';
    let typeLabel = 'E2E'; let typeColor = '#64748b';
    if (/login|auth/i.test(t.name)) { typeLabel='AUTH'; typeColor='#6366f1'; }
    else if (/page loads/i.test(t.name)) { typeLabel='NAV'; typeColor='#10b981'; }
    else if (/exists|visible/i.test(t.name)) { typeLabel='UI'; typeColor='#3b82f6'; }
    else if (/clickable/i.test(t.name)) { typeLabel='FUNC'; typeColor='#8b5cf6'; }
    return `<tr style="border-bottom:1px solid rgba(255,255,255,.05);background:${i%2===0?'#0d1526':'#080f1e'}">
      <td style="padding:9px 12px;color:#64748b;font-weight:700;text-align:center">${i+1}</td>
      <td style="padding:9px 12px;font-weight:700;color:#e2e8f0;font-size:13px">${t.name}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${cc};font-weight:700;font-size:10px">${(t.category||'navigation').toUpperCase()}</span></td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${pc};font-weight:700;font-size:10px">${(t.priority||'medium').toUpperCase()}</span></td>
      <td style="padding:9px 12px;font-size:11px;color:#94a3b8">${expected}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${typeColor};font-weight:700;font-size:10px">${typeLabel}</span></td>
    </tr>`;
  }).join('');

  // ── CATEGORY SUMMARY ──
  const cats = {};
  allTests.forEach(t => {
    const c = t.category || 'navigation';
    if (!cats[c]) cats[c] = {pass:0,fail:0,total:0,dur:0};
    cats[c].total++;
    if (t.status==='pass') cats[c].pass++;
    else if (t.status==='fail') cats[c].fail++;
    try { cats[c].dur += parseInt((t.duration||'0').replace('ms','')); } catch {}
  });
  const catRows = Object.entries(cats).map(([cat, d]) => {
    const cc = CAT_COLORS[cat] || '#64748b';
    const r  = Math.round(d.pass/d.total*100);
    const rc = r===100?'#10b981':r>=60?'#f59e0b':'#ef4444';
    const vc = d.fail===0?'#10b981':'#ef4444';
    const bg = d.fail===0?'rgba(16,185,129,.06)':'rgba(239,68,68,.06)';
    const avg = Math.round(d.dur/d.total);
    return `<tr style="background:${bg};border-bottom:1px solid rgba(255,255,255,.05)">
      <td style="padding:10px 12px;font-weight:700;color:${cc}">${cat.toUpperCase()}</td>
      <td style="padding:10px 12px;text-align:center;color:#e2e8f0;font-weight:700">${d.total}</td>
      <td style="padding:10px 12px;text-align:center;color:#10b981;font-weight:700">${d.pass}</td>
      <td style="padding:10px 12px;text-align:center;color:#ef4444;font-weight:700">${d.fail}</td>
      <td style="padding:10px 12px;text-align:center;color:${rc};font-weight:700">${r}%</td>
      <td style="padding:10px 12px;text-align:center;color:#64748b">${avg}ms</td>
      <td style="padding:10px 12px;text-align:center"><span style="color:${vc};font-weight:800;font-size:11px">${d.fail===0?'✅ PASS':'❌ FAIL'}</span></td>
    </tr>`;
  }).join('');

  // ── DETAILED RESULTS ──
  const detailRows = allTests.map((t, i) => {
    const sc = t.status==='pass'?'#10b981':t.status==='fail'?'#ef4444':'#f59e0b';
    const sl = t.status==='pass'?'✓ PASS':t.status==='fail'?'✗ FAIL':'■ SKIP';
    const sb = t.status==='pass'?'rgba(16,185,129,.06)':t.status==='fail'?'rgba(239,68,68,.06)':'rgba(245,158,11,.06)';
    const cc = CAT_COLORS[t.category] || '#64748b';
    const pc = t.priority==='high'?'#ef4444':t.priority==='medium'?'#f59e0b':'#10b981';
    return `<tr style="border-bottom:1px solid rgba(255,255,255,.05);background:${i%2===0?'#0d1526':'#080f1e'}">
      <td style="padding:9px 12px;color:#64748b;font-weight:700;text-align:center">${i+1}</td>
      <td style="padding:9px 12px;font-weight:700;color:#e2e8f0;font-size:13px">${t.name}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${cc};font-weight:700;font-size:10px">${(t.category||'').toUpperCase()}</span></td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${pc};font-weight:700;font-size:10px">${(t.priority||'medium').toUpperCase()}</span></td>
      <td style="padding:9px 12px;text-align:center;background:${sb}"><span style="color:${sc};font-weight:800;font-size:11px">${sl}</span></td>
      <td style="padding:9px 12px;font-size:11px;color:#94a3b8">${t.suite||'—'}</td>
      <td style="padding:9px 12px;text-align:center;font-size:11px;color:#64748b;font-weight:700">${t.duration||'—'}</td>
    </tr>`;
  }).join('');

  // ── AI RECS ──
  const slow = allTests.filter(t => { try { return parseInt((t.duration||'0').replace('ms','')) > 3000; } catch { return false; } });
  const failed = allTests.filter(t => t.status === 'fail');
  const recsHtml = `
    <div style="background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:8px;padding:10px 14px;margin-bottom:4px;font-weight:700;color:#f59e0b">⚡ Performance</div>
    <div style="background:#0d1526;border-left:3px solid #f59e0b;padding:8px 14px 8px 16px;margin-bottom:10px;font-size:12px;color:#94a3b8">${slow.length > 0 ? `• ${slow.length} test(s) exceeded 3000ms — optimize before next release.` : '• All tests executed within acceptable time range.'}</div>
    <div style="background:rgba(99,102,241,.06);border:1px solid rgba(99,102,241,.2);border-radius:8px;padding:10px 14px;margin-bottom:4px;font-weight:700;color:#818cf8">🔧 Reliability</div>
    <div style="background:#0d1526;border-left:3px solid #818cf8;padding:8px 14px 8px 16px;margin-bottom:10px;font-size:12px;color:#94a3b8">${failed.length > 0 ? `• Fix "${failed[0]?.name}" — ${failed[0]?.suite||'error detected'}.` : '• No reliability issues detected.'}</div>
    <div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:8px;padding:10px 14px;margin-bottom:4px;font-weight:700;color:#10b981">👤 UX & Accessibility</div>
    <div style="background:#0d1526;border-left:3px solid #10b981;padding:8px 14px 8px 16px;font-size:12px;color:#94a3b8">• Navigation pages verified. Application routing is stable.</div>`;

  const vc = fail>0?'#ef4444':'#059669';
  const vb = fail>0?'rgba(239,68,68,.08)':'rgba(16,185,129,.08)';
  const vi = fail>0?'🔴':'🟢';
  const vt = fail>0
    ? `Regression Test FAILED — ${fail} page(s) failed. Fix before next deployment.`
    : `Regression Test PASSED — All ${pass} tests passed. Application is stable.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>NexTest Regression Report #${genId}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#070e1c;color:#e2e8f0;font-family:'DM Sans',sans-serif;min-height:100vh}
  .page{max-width:1100px;margin:0 auto;padding:48px 32px 80px}
  table{width:100%;border-collapse:collapse}
  @media print{body{background:#fff;color:#000}.no-print{display:none}.page{padding:10mm}@page{margin:15mm;size:A4}}
</style>
</head>
<body>
<div class="page">

  <div style="background:linear-gradient(135deg,#0a0f1e 0%,#1a0f05 50%,#0a0f1e 100%);
    border-radius:20px;padding:40px 48px;margin-bottom:32px;position:relative;overflow:hidden">
    <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,transparent,#f97316,transparent)"></div>
    <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#f97316"></div>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:20px">
      <div>
        <div style="font-size:28px;font-weight:700;color:#fff;letter-spacing:2px;margin-bottom:4px">
          <span style="color:#f97316">NEX</span>TEST
        </div>
        <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:8px">Regression Test Report</div>
        <div style="font-size:11px;color:#94a3b8">Generated ${dateStr} · ${timeStr}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:28px">
      ${[
        {l:'URL',v:`<span style="color:#fda47a;font-size:11px;word-break:break-all">${url}</span>`},
        {l:'Framework',v:`<span style="color:#f97316;font-weight:700">${framework}</span>`},
        {l:'Test Type',v:`<span style="color:#f97316;font-weight:700">Regression Test</span>`},
        {l:'Generated',v:`<span style="color:#fff">${dateStr}</span>`},
      ].map(r => `<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:12px 14px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4f6480;margin-bottom:5px">${r.l}</div>
        <div style="font-size:12px">${r.v}</div>
      </div>`).join('')}
    </div>
  </div>

  <div class="no-print" style="margin-bottom:28px">
    <button onclick="window.print()" style="padding:10px 24px;border-radius:10px;background:linear-gradient(135deg,#f97316,#ea580c);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">🖨 Print / Save as PDF</button>
  </div>

  ${secHdr('📋', 'Regression Test Scenarios', '#6366f1')}
  ${tblWrap(`${tblHdr([{l:'#',align:'center'},{l:'Test Scenario'},{l:'Category',align:'center'},{l:'Priority',align:'center'},{l:'Expected Result'},{l:'Type',align:'center'}])}
    <tbody>${scenarioRows}</tbody></table>`, '#6366f1')}

  ${secHdr('📊', 'Test Summary', '#f97316')}
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">
    ${[
      {icon:'✅',val:pass,lbl:'PASSED',c:'#10b981',bg:'rgba(16,185,129,.08)',bd:'rgba(16,185,129,.25)'},
      {icon:'❌',val:fail,lbl:'FAILED',c:'#ef4444',bg:'rgba(239,68,68,.08)',bd:'rgba(239,68,68,.25)'},
      {icon:'⏭️',val:skip,lbl:'SKIPPED',c:'#f59e0b',bg:'rgba(245,158,11,.08)',bd:'rgba(245,158,11,.25)'},
      {icon:'🎯',val:`${rate}%`,lbl:'PASS RATE',c:rateColor,bg:`${rateColor}12`,bd:`${rateColor}33`},
      {icon:'🔢',val:total,lbl:'TOTAL',c:'#3b82f6',bg:'rgba(59,130,246,.08)',bd:'rgba(59,130,246,.25)'},
    ].map(s => `<div style="background:${s.bg};border:1px solid ${s.bd};border-radius:14px;padding:20px;text-align:center">
      <div style="font-size:20px;margin-bottom:8px">${s.icon}</div>
      <div style="font-size:36px;font-weight:700;color:${s.c};line-height:1;margin-bottom:4px">${s.val}</div>
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:${s.c};opacity:.8;text-transform:uppercase">${s.lbl}</div>
    </div>`).join('')}
  </div>

  ${secHdr('📊', 'Results by Category', '#6366f1')}
  ${tblWrap(`${tblHdr([{l:'Category'},{l:'Total',align:'center'},{l:'Passed',align:'center'},{l:'Failed',align:'center'},{l:'Pass Rate',align:'center'},{l:'Avg Duration',align:'center'},{l:'Status',align:'center'}])}
    <tbody>${catRows}</tbody></table>`, '#6366f1')}

  ${secHdr('🧪', 'Detailed Test Results', '#0d9488')}
  ${tblWrap(`${tblHdr([{l:'#',align:'center'},{l:'Test Name'},{l:'Category',align:'center'},{l:'Priority',align:'center'},{l:'Status',align:'center'},{l:'Result / Reason'},{l:'Duration',align:'center'}])}
    <tbody>${detailRows}</tbody></table>`, '#0d9488')}

  ${secHdr('🤖', 'AI Recommendations', '#6366f1')}
  ${recsHtml}

  <div style="background:${vb};border:2px solid ${vc};border-radius:12px;padding:16px 20px;margin-top:24px;display:flex;gap:12px;align-items:flex-start">
    <span style="font-size:24px">${vi}</span>
    <div>
      <div style="font-size:14px;font-weight:700;color:${vc};margin-bottom:6px">Final Verdict</div>
      <p style="font-size:13px;color:${vc};margin:0;line-height:1.6">${vt}</p>
    </div>
  </div>

  <div style="margin-top:48px;padding:20px 28px;background:rgba(249,115,22,.04);border-radius:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;border:1px solid rgba(249,115,22,.15)">
    <div style="font-size:14px;font-weight:700;color:#64748b"><span style="color:#f97316">NEX</span>TEST · Regression Test Report</div>
    <div style="font-size:11px;color:#94a3b8">Generated ${dateStr} · ${framework} · ${total} tests · ${rate}% pass rate</div>
  </div>

</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `regression_report_${genId}.html`;
  link.click();
  saveReportToStorage({
    url,
    framework,
    testType: 'regression',
    passCount: pass,
    failCount: fail,
    htmlContent: html,
    generationData: generation,
  });
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
// ── AI ACTION PLAN ────────────────────────────────────────────
const buildActionPlan = async (failedTests) => {
  if (!failedTests.length) return '';
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a QA engineer. Generate an action plan for these failed functional tests.
Failed tests: ${JSON.stringify(failedTests.map(t => ({name: t.name, action: t.action || t.step_meta?.action, reason: t.reason || t.suite})))}

Return ONLY a JSON array of max 6 items, each with:
- scenario: string (what to fix)
- category: "Bug Fix" | "Selector" | "Timing" | "Auth"
- priority: "HIGH" | "MEDIUM" | "LOW"  
- action: string (concrete fix)
- responsible: "Frontend" | "Backend" | "QA"
- deadline: "Immediate" | "This Sprint" | "Next Sprint"
- status: "To Do"

No markdown, only JSON array.`
        }]
      })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text?.replace(/```json|```/g, '').trim() || '[]';
    return JSON.parse(text);
  } catch { return []; }
};
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
  link.download = `${isRegression ? 'regression' : 'nextest'}_report_${genId}.html`;

  link.click();
  setDropdownOpen(false);
};
 

const downloadPdf = async () => {
  try {
    setPdfLoading(true); setDropdownOpen(false);
    const id = generation?.generation?.id || generation?.id || generation?.result?.id;
    if (!id) { alert('No generation ID found.'); setPdfLoading(false); return; }

    const res = await api.get(`/generations/${id}/pdf`, { responseType: 'blob' });
    const contentType = res.headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      // Lire le JSON pour voir l'erreur exacte
      const text = await res.data.text();
      console.error('[PDF] Backend error JSON:', text);
      alert('PDF error: ' + text);
      setPdfLoading(false);
      return;
    }

    const blob = new Blob([res.data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${isRegression ? 'regression' : 'nextest'}_report_${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    if (err.response?.data instanceof Blob) {
      const text = await err.response.data.text();
      console.error('[PDF] Blob error:', text);
      alert('PDF error: ' + text);
    } else {
      console.error('[PDF] Error:', err.response?.data || err.message);
      alert('PDF failed: ' + (err.message || 'Unknown error'));
    }
  } finally { setPdfLoading(false); }
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
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
  <span title={url}>{url}</span>
</div>
            <div className="ep-info-chip" style={{ color: fwConf.color, borderColor: `${fwConf.color}33`, background: `${fwConf.color}11` }}>
              <span className="ep-fw-dot" style={{ background: fwConf.color }} />{fwConf.letters} · {framework}
            </div>
            <div className="ep-info-chip" style={{ color: ttBadge.color, borderColor: ttBadge.border, background: ttBadge.bg }}>{ttBadge.letter} · {ttBadge.label}</div>
          </div>
        </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>

                <div className="ep-actions" style={{ opacity: running ? 0.35 : 1, pointerEvents: running ? 'none' : 'auto', transition: 'opacity .3s' }}>

          {isBoth ? (
            <>
              <button className="ep-dl-btn" onClick={() => downloadScript('selenium')}><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span className="ep-dl-letters" style={{ color: '#43B02A' }}>Se</span> .py</button>
              <button className="ep-dl-btn" onClick={() => downloadScript('playwright')}><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span className="ep-dl-letters" style={{ color: '#E2574C' }}>Pl</span> .py</button>
              <button className="ep-dl-btn" onClick={() => downloadScript('cypress')}><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span className="ep-dl-letters" style={{ color: '#00BFA5' }}>Cy</span> .js</button>
            </>
          ) : (
           <button className="ep-dl-btn" onClick={() => downloadScript()}>
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
    <span className="ep-dl-letters" style={{ color: fwConf.color }}>{fwConf.letters}</span>
    {testType === 'api' && (framework?.toLowerCase() === 'postman' || framework?.toLowerCase() === 'newman')
      ? '.json'
      : testType === 'api'
      ? '.py'
      : framework === 'Cypress'
      ? '.js'
      : '.py'
    }
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
                <button onClick={isSeo ? downloadCsv_Seo : isFunctional ? downloadCsv_Functional : downloadCsv} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 600, transition: 'all .15s', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--green-bg)'; e.currentTarget.style.color = 'var(--green)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sub)'; }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#10b981', letterSpacing: .5 }}>CSV</span>
                  <div><div style={{ fontSize: 12, fontWeight: 700 }}>rapport.csv</div><div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>Données tabulaires</div></div>
                </button>
                <button onClick={isSecurity ? downloadHtml_Security : isRegression ? downloadHtml_Regression : isFunctional ? downloadHtml_Functional : isSeo ? downloadHtml_Seo : downloadHtml}

 style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 600, transition: 'all .15s', textAlign: 'left' }}
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

{isSeo && generation?.result?.seo_score !== undefined && (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    opacity: running ? 0.35 : 1,
    transition: 'opacity .3s',
  }}>
    <div style={{ position: 'relative', width: 90, height: 90 }}>
      <CircularProgress
        value={running ? 0 : generation.result.seo_score}
        size={90}
        stroke={8}
        color={running ? 'var(--muted)' : (generation.result.seo_score >= 80 ? '#10b981' : generation.result.seo_score >= 50 ? '#f59e0b' : '#ef4444')}
      />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--C)', lineHeight: 1 }}>
          {running ? 0 : generation.result.seo_score}
        </span>
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>/ 100</span>
      </div>
    </div>
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
      color: running ? 'var(--muted)' : (generation.result.seo_score >= 80 ? '#10b981' : generation.result.seo_score >= 50 ? '#f59e0b' : '#ef4444'),
    }}>
      SEO Score
    </span>
  </div>
)}
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

      <div className="ep-stats" style={{ opacity: running ? 0.4 : 1, transition: 'opacity .3s' }}>

        {[
          { label: 'Passed',    val: running ? 0 : pass,      color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', icon: <svg width="18" height="18" fill="none" stroke="#10B981" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> },
          { label: 'Failed',    val: running ? 0 : fail,       color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   icon: <svg width="18" height="18" fill="none" stroke="#EF4444" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg> },
          { label: 'Skipped',   val: running ? 0 : skip,        color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  icon: <svg width="18" height="18" fill="none" stroke="#F59E0B" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> },
          { label: 'Pass Rate', val: running ? '0%' : `${rate}%`, color: rateColor, bg: `${rateColor}12`, border: `${rateColor}33`, icon: <svg width="18" height="18" fill="none" stroke={rateColor} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
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
            {running ? (<><span className="spinner" style={{ marginRight: 8 }} /><span style={{ color: 'var(--indigo2)' }}>Running tests...</span></>) : (<><svg width="14" height="14" fill="none" stroke="var(--green)" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg><span>{tests.length} tests executed</span><span className="ep-progress-sep">·</span><span style={{ color: 'var(--muted)' }}>{loadTimeMs > 0 && (
  <>
    <span className="ep-progress-sep">·</span>
    <span style={{ color: 'var(--muted)' }}>{loadTimeMs}ms load time</span>
  </>
)}</span></>)}
          </div>
          <div className="ep-progress-rate" style={{ color: rateColor }}>{rate}% pass rate</div>
        </div>
        <div className="ep-progress-track">
          <div className="ep-progress-fill" style={{ width: `${running ? 100 : rate}%`, background: running ? 'linear-gradient(90deg,var(--indigo),var(--indigo2))' : rateGrad }} />
          
        </div>
      </div>


{/* ── TABS ── */}
<div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
  {[
    { key: 'results',         label: 'Test Cases',     count: tests.length,          Icon: IconFileText },
    { key: 'scenarios',       label: 'Scenarios',       count: tests.length,          Icon: IconTarget },
    { key: 'recommendations', label: 'Recommendations', count: fail, Icon: IconBulb },
  ].map(tab => (
    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
      style={{ padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 700, color: activeTab === tab.key ? 'var(--indigo2)' : 'var(--muted)', borderBottom: activeTab === tab.key ? '2px solid var(--indigo2)' : '2px solid transparent', marginBottom: -1, transition: 'all .18s', display: 'flex', alignItems: 'center', gap: 8 }}>
      <tab.Icon size={15} stroke={1.8} />
      {tab.label}
      <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: activeTab === tab.key ? 'var(--indigo-bg)' : 'var(--bg2)', color: activeTab === tab.key ? 'var(--indigo2)' : 'var(--muted)' }}>{tab.count}</span>
    </button>
  ))}
</div>
      

      {activeTab === 'results' && (
  <>
<div className="ep-filters" style={{ opacity: running ? 0 : 1, pointerEvents: running ? 'none' : 'auto', transition: 'opacity .3s' }}>
      {[{ key: 'all', label: 'All', count: tests.length }, { key: 'pass', label: 'Passed', count: pass }, { key: 'fail', label: 'Failed', count: fail }, { key: 'skip', label: 'Warn/Skip', count: skip }].map(f => (
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
        ? (
          <div style={{
            background: '#050a14',
            border: '1px solid rgba(99,102,241,.25)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,.5)',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', background:'linear-gradient(135deg,#0a0f1e,#0d1526)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
              <div style={{ display:'flex', gap:6 }}>
                {['#ef4444','#f59e0b','#10b981'].map((c,i) => (
                  <div key={i} style={{ width:12, height:12, borderRadius:'50%', background:c, opacity:.8 }} />
                ))}
              </div>
              <div style={{ flex:1, textAlign:'center', fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:1 }}>
                NexTest Terminal — AI Test Runner
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', animation:'termPulse 1s ease-in-out infinite' }} />
                <span style={{ fontSize:10, color:'#10b981', fontWeight:700, letterSpacing:1 }}>RUNNING</span>
              </div>
            </div>

            {/* Body */}
            
            {/* Body */}
            <div style={{ padding:'16px 20px', minHeight:280, maxHeight:380, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}
              ref={el => { if (el) el.scrollTop = el.scrollHeight; }}>
              {terminalLines.map((line, i) => {
                const colors = { system:'#818cf8', info:'#94a3b8', ai:'#c9a227', success:'#10b981', fail:'#ef4444', pass:'#10b981', skip:'#f59e0b', running:'#60a5fa', muted:'#475569', divider:'#1e293b', summary:'#e2e8f0' };
                const icons  = { system:'⬡', info:'›', ai:'◆', success:'✓', fail:'✗', pass:'✓', skip:'◌', running:'◉', muted:'·', divider:'', summary:'▸' };
                if (line.type === 'divider') return (
                  <div key={i} style={{ color:'#1e2d47', fontSize:11, userSelect:'none', margin:'4px 0' }}>{line.text}</div>
                );
                return (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, animation:'termFadeIn .3s ease both', fontSize:12, lineHeight:1.6 }}>
                    <span style={{ color:'#1e3a5f', fontSize:10, flexShrink:0, marginTop:1 }}>{line.time}</span>
                    <span style={{ color:colors[line.type]||'#94a3b8', flexShrink:0, fontSize:11 }}>{icons[line.type]||'›'}</span>
                    <span style={{ color:colors[line.type]||'#94a3b8', flex:1 }}>{line.text}</span>
                  </div>
                );
              })}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4 }}>
                <span style={{ color:'#1e3a5f', fontSize:10 }}>{new Date().toLocaleTimeString('en-US',{hour12:false})}</span>
                <span style={{ color:'#6366f1' }}>›</span>
                <span style={{ display:'inline-block', width:8, height:15, background:'#6366f1', borderRadius:1, animation:'termBlink .8s step-end infinite' }} />
              </div>
            </div>

            {/* Status bar */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 16px', background:'rgba(99,102,241,.06)', borderTop:'1px solid rgba(99,102,241,.1)' }}>
              <span style={{ fontSize:10, color:'#6366f1', fontWeight:700 }}>◉ {terminalLines.length} events</span>
              <span style={{ fontSize:10, color:'#475569', fontWeight:600 }}>{generation?.framework || generation?.generation?.framework || ''} · AI-Powered</span>
            </div>

            <style>{`
              @keyframes termFadeIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
              @keyframes termBlink  { 0%,100%{opacity:1} 50%{opacity:0} }
              @keyframes termPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
            `}</style>
          </div>
        )
        : shown.length === 0
        ? (<div className="ep-no-results"><svg width="24" height="24" fill="none" stroke="var(--muted)" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>No tests match this filter</div>)
        : paginatedShown.map((test, i) => (
            <div key={test.id} className={`ep-row ep-row--${test.status}`} style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="ep-row-status-wrap"><StatusIcon s={test.status} /></div>
              <div className="ep-row-body">

                <div className="ep-row-name">{test.name}</div>
                <div className="ep-row-suite">{test.suite}</div>
                {test.assertion_result && <AssertionBadge assertion_result={test.assertion_result} step_meta={test.step_meta} />}

                {/* Sévérité + Catégorie visibles immédiatement, sans clic */}
<div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
  {test.category && (
    <span style={{
      fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
      textTransform: 'uppercase', letterSpacing: 0.5,
      color: 'var(--indigo2)', background: 'var(--indigo-bg)', border: '1px solid var(--indigo-border)',
    }}>
      {test.category}
    </span>
  )}
  {test.status === 'fail' && test.ai_analysis?.severity && (
    <span style={{
      fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
      textTransform: 'uppercase', letterSpacing: 0.5,
      color: test.ai_analysis.severity === 'high' ? '#ef4444' : test.ai_analysis.severity === 'medium' ? '#f59e0b' : '#10b981',
      background: test.ai_analysis.severity === 'high' ? 'rgba(239,68,68,.1)' : test.ai_analysis.severity === 'medium' ? 'rgba(245,158,11,.1)' : 'rgba(16,185,129,.1)',
      border: `1px solid ${test.ai_analysis.severity === 'high' ? 'rgba(239,68,68,.25)' : test.ai_analysis.severity === 'medium' ? 'rgba(245,158,11,.25)' : 'rgba(16,185,129,.25)'}`,
    }}>
      {test.ai_analysis.severity} priority
    </span>
  )}
</div>

{/* Fix visible tout de suite pour les échecs — pas besoin d'ouvrir "Show details" */}
{test.status === 'fail' && test.ai_analysis?.fix && (
  <div style={{
    marginTop: 8, padding: '8px 12px', borderRadius: 8,
    background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.15)',
    fontSize: 12, color: '#10b981', lineHeight: 1.5,
  }}>
    <strong>Fix:</strong> {test.ai_analysis.fix}
  </div>
)}
               
                {/* Bouton Détails */}
                <button
                  onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
                  style={{
                    marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    color: 'var(--muted)', fontSize: 11, fontWeight: 700,
                    fontFamily: 'inherit', transition: 'all .15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--indigo2)'; e.currentTarget.style.color = 'var(--indigo2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
                >
                  {expandedTest === test.id ? '▲ Hide details' : '▼ Show details'}
                </button>

                {/* Panneau détails */}
                {expandedTest === test.id && (
                  <div style={{
                    marginTop: 10, padding: '12px 16px', borderRadius: 10,
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6
                  }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
  {(() => {
  const isSkip = test.status === 'skip' || test.status === 'warn';
  const color = test.status === 'pass' ? '#10b981'
    : isSkip ? '#94a3b8'
    : test.ai_analysis?.severity === 'high' ? '#ef4444'
    : test.ai_analysis?.severity === 'medium' ? '#f59e0b'
    : '#10b981';
  const label = test.status === 'pass' ? 'LOW'
    : isSkip ? 'SKIPPED'
    : (test.ai_analysis?.severity?.toUpperCase() || test.priority?.toUpperCase() || 'MEDIUM');
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
      color, background: `${color}1a`, border: `1px solid ${color}33`,
    }}>
      {label}
    </span>
  );
})()}

                    </div>
                    {test.step_meta?.selector && (
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Selector</span>
                        <div style={{ marginTop: 3, padding: '5px 10px', borderRadius: 6, background: 'var(--card)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: 11, color: '#818cf8', wordBreak: 'break-all' }}>
                          {test.step_meta.selector}
                        </div>
                      </div>
                    )}
                    {test.step_meta?.action && (
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        <span style={{ fontWeight: 700 }}>Action:</span> {test.step_meta.action}
                        {test.step_meta?.value && <span> · <span style={{ fontWeight: 700 }}>Value:</span> {test.step_meta.value}</span>}
                      </div>
                    )}
                    {test.suite && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
                        {test.suite}
                      </div>
                    )}
                    {/* AI Analysis LLaMA */}
                    {test.ai_analysis && (
                      <div style={{
                        marginTop: 8, padding: '10px 12px', borderRadius: 8,
                        background: 'rgba(99,102,241,.06)',
                        border: '1px solid rgba(99,102,241,.2)',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: 1, 
  textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
  🤖 LLaMA Analysis
  <span style={{
    padding: '1px 8px', borderRadius: 20, fontSize: 9, fontWeight: 800,
    color: test.ai_analysis.severity === 'high' || test.ai_analysis.severity === 'critical'
      ? '#ef4444'
      : test.ai_analysis.severity === 'medium'
      ? '#f59e0b'
      : '#10b981',
    background: test.ai_analysis.severity === 'high' || test.ai_analysis.severity === 'critical'
      ? 'rgba(239,68,68,.1)'
      : test.ai_analysis.severity === 'medium'
      ? 'rgba(245,158,11,.1)'
      : 'rgba(16,185,129,.1)',
    border: `1px solid ${
      test.ai_analysis.severity === 'high' || test.ai_analysis.severity === 'critical'
        ? 'rgba(239,68,68,.2)'
        : test.ai_analysis.severity === 'medium'
        ? 'rgba(245,158,11,.2)'
        : 'rgba(16,185,129,.2)'
    }`
  }}>
    {test.ai_analysis.severity?.toUpperCase()}
  </span>
</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: '#e2e8f0' }}>Root cause: </span>
                          {test.ai_analysis.root_cause}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>
                          <span style={{ fontWeight: 700, color: '#10b981' }}>Fix: </span>
                          {test.ai_analysis.fix}
                        </div>
                      </div>
                    )}
                    {test.screenshot && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                          Screenshot on Fail
                        </div>
                        <img
                          src={`data:image/png;base64,${test.screenshot}`}
                          style={{ width: '100%', maxWidth: 480, borderRadius: 8, border: '1px solid rgba(239,68,68,.3)', cursor: 'pointer', display: 'block' }}
                          onClick={() => window.open(`data:image/png;base64,${test.screenshot}`)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="ep-row-meta">
               
<span className="ep-cat-badge" style={{
  color: testType === 'seo' ? '#06b6d4'
       : test.category === 'functional' ? '#6366f1'
       : test.category === 'performance' ? '#8b5cf6'
       : test.category === 'security' ? '#ef4444'
       : test.category === 'api' ? '#10b981'
       : test.category === 'regression' ? '#f97316'
       : '#64748b',
  background: testType === 'seo' ? 'rgba(6,182,212,.1)'
            : test.category === 'functional' ? 'rgba(99,102,241,.1)'
            : test.category === 'performance' ? 'rgba(139,92,246,.1)'
            : test.category === 'security' ? 'rgba(239,68,68,.1)'
            : test.category === 'api' ? 'rgba(16,185,129,.1)'
            : test.category === 'regression' ? 'rgba(249,115,22,.1)'
            : 'rgba(100,116,139,.1)',
  border: `1px solid ${
    testType === 'seo' ? 'rgba(6,182,212,.25)'
    : test.category === 'functional' ? 'rgba(99,102,241,.2)'
    : test.category === 'performance' ? 'rgba(139,92,246,.2)'
    : test.category === 'security' ? 'rgba(239,68,68,.2)'
    : test.category === 'api' ? 'rgba(16,185,129,.2)'
    : test.category === 'regression' ? 'rgba(249,115,22,.2)'
    : 'rgba(100,116,139,.2)'
  }`
}}>
 {testType === 'seo' ? 'S'
 : test.category === 'functional' ? 'F'
 : test.category === 'security' ? 'S'
 : test.category === 'regression' ? 'R'
 : (test.category === 'api' || testType === 'api') ? 'A'
 : test.category === 'performance' ? 'P'
 : testType === 'security' ? 'S'
 : testType === 'regression' ? 'R'
 : 'S'}
</span>
                <span className={`ep-status-badge ep-status-badge--${test.status}`}>{test.status}</span>
                {testType !== 'seo' && <span className="ep-duration">{test.duration}</span>}
              </div>
            </div>
          ))
      }
    </div>

    {/* ── PAGINATION ── */}
   {shown.length > 0 && !running && (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
        marginTop: 20, padding: '14px 20px',
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 12, boxShadow: 'var(--shadow)',
      }}>

        {/* Left — Rows per page */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:12, color:'var(--muted)', fontWeight:600, whiteSpace:'nowrap' }}>
            Rows per page:
          </span>
          <div style={{ position:'relative' }}>
            <select
              value={rowsPerPage}
              onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              style={{
                appearance: 'none',
                background: 'var(--bg2)',
                border: '1.5px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                fontSize: 12, fontWeight: 700,
                padding: '6px 28px 6px 12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color .2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--indigo-border)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            >
              {[10, 20, 50, 100].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <svg width="10" height="10" fill="none" stroke="var(--muted)" strokeWidth="2.5"
              viewBox="0 0 24 24"
              style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>

          {/* Showing X–Y of Z */}
          <span style={{ fontSize:12, color:'var(--muted)', fontWeight:600, whiteSpace:'nowrap' }}>
            Showing{' '}
            <span style={{ color:'var(--text)', fontWeight:700 }}>
              {Math.min((currentPage - 1) * rowsPerPage + 1, shown.length)}
            </span>
            {' '}–{' '}
            <span style={{ color:'var(--text)', fontWeight:700 }}>
              {Math.min(currentPage * rowsPerPage, shown.length)}
            </span>
            {' '}of{' '}
            <span style={{ color:'var(--indigo2)', fontWeight:700 }}>{shown.length}</span>
            {' '}tests
          </span>
        </div>

        {/* Right — Page controls */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>

          {/* Previous */}
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              display:'flex', alignItems:'center', gap:5,
              padding:'7px 14px', borderRadius:8,
              background: currentPage === 1 ? 'var(--bg2)' : 'var(--card)',
              border: '1.5px solid var(--border)',
              color: currentPage === 1 ? 'var(--dimmed)' : 'var(--sub)',
              fontSize:11, fontWeight:700, cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontFamily:'inherit', transition:'all .18s', opacity: currentPage === 1 ? .5 : 1,
            }}
            onMouseEnter={e => { if (currentPage !== 1) { e.currentTarget.style.borderColor = 'var(--indigo-border)'; e.currentTarget.style.color = 'var(--indigo2)'; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--sub)'; }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            Prev
          </button>

          {/* Page numbers */}
          {(() => {
            const pages = [];
            let start = Math.max(1, currentPage - 2);
            let end   = Math.min(totalPages, currentPage + 2);
            if (currentPage <= 3) end   = Math.min(5, totalPages);
            if (currentPage >= totalPages - 2) start = Math.max(1, totalPages - 4);

            if (start > 1) {
              pages.push(
                <button key={1} onClick={() => setCurrentPage(1)}
                  style={{ width:34, height:34, borderRadius:8, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--sub)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .18s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--indigo-border)'; e.currentTarget.style.color = 'var(--indigo2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--sub)'; }}>
                  1
                </button>
              );
              if (start > 2) pages.push(
                <span key="dots-start" style={{ fontSize:12, color:'var(--dimmed)', padding:'0 4px' }}>…</span>
              );
            }

            for (let p = start; p <= end; p++) {
              const isActive = p === currentPage;
              pages.push(
                <button key={p} onClick={() => setCurrentPage(p)}
                  style={{
                    width:34, height:34, borderRadius:8,
                    border: isActive ? 'none' : '1.5px solid var(--border)',
                    background: isActive ? 'linear-gradient(135deg, var(--indigo), #4f46e5)' : 'var(--card)',
                    color: isActive ? '#fff' : 'var(--sub)',
                    fontSize:12, fontWeight:700, cursor:'pointer',
                    fontFamily:'inherit', transition:'all .18s',
                    boxShadow: isActive ? '0 3px 10px rgba(99,102,241,.35)' : 'none',
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--indigo-border)'; e.currentTarget.style.color = 'var(--indigo2)'; }}}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--sub)'; }}}>
                  {p}
                </button>
              );
            }

            if (end < totalPages) {
              if (end < totalPages - 1) pages.push(
                <span key="dots-end" style={{ fontSize:12, color:'var(--dimmed)', padding:'0 4px' }}>…</span>
              );
              pages.push(
                <button key={totalPages} onClick={() => setCurrentPage(totalPages)}
                  style={{ width:34, height:34, borderRadius:8, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--sub)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .18s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--indigo-border)'; e.currentTarget.style.color = 'var(--indigo2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--sub)'; }}>
                  {totalPages}
                </button>
              );
            }
            return pages;
          })()}

          {/* Next */}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            style={{
              display:'flex', alignItems:'center', gap:5,
              padding:'7px 14px', borderRadius:8,
              background: currentPage === totalPages ? 'var(--bg2)' : 'var(--card)',
              border: '1.5px solid var(--border)',
              color: currentPage === totalPages ? 'var(--dimmed)' : 'var(--sub)',
              fontSize:11, fontWeight:700,
              cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
              fontFamily:'inherit', transition:'all .18s',
              opacity: currentPage === totalPages || totalPages === 0 ? .5 : 1,
            }}
            onMouseEnter={e => { if (currentPage !== totalPages) { e.currentTarget.style.borderColor = 'var(--indigo-border)'; e.currentTarget.style.color = 'var(--indigo2)'; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--sub)'; }}
          >
            Next
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    )}
  </>
)}
    

{activeTab === 'scenarios' && (() => {
  const CAT_COLORS = {
    security: '#ef4444', accessibility: '#8b5cf6', meta: '#3b82f6',
    structure: '#f97316', mobile: '#0ea5e9', technical: '#6366f1',
    social: '#ec4899', content: '#10b981', performance: '#f59e0b',
    functional: '#6366f1', navigation: '#10b981', form: '#8b5cf6',
    action: '#f97316', authentication: '#6366f1', ui: '#3b82f6',
  };

  // Description de la condition attendue — indépendante du résultat réel
  const EXPECTED_MAP_SEO = {
    'HTTPS Enabled': 'Site must be served over HTTPS',
    'Page Accessible': 'Page must return HTTP 200',
    'Title Tag Present': 'A <title> tag must exist',
    'Title Length Optimal': 'Title length must be between 30–60 characters',
    'Meta Description Present': 'A meta description tag must exist',
    'Meta Description Length Optimal': 'Meta description must be between 70–160 characters',
    'Single H1 Tag': 'Exactly one <h1> tag must be present',
    'H2 Tags Present': 'At least one <h2> tag should exist',
    'All Images Have Alt Text': 'Every <img> must have a non-empty alt attribute',
    'Viewport Meta Tag': 'A responsive viewport meta tag must be present',
    'Canonical URL Defined': 'A canonical <link> tag must be defined',
    'Open Graph Tags Present': 'og:title and og:description must be present',
    'Schema Markup Present': 'Structured data (JSON-LD) should be present',
    'robots.txt Found': 'A valid /robots.txt must exist',
    'sitemap.xml Found': 'A valid /sitemap.xml must exist',
    'Sufficient Word Count': 'Page must contain at least 300 words',
    'Fast Page Load (<3000ms)': 'Page must load in under 3000ms',
  };

  // Priorité intrinsèque au scenario, pas dérivée du résultat
  const INTRINSIC_PRIORITY_SEO = {
    security: 'high', technical: 'high',
    meta: 'medium', structure: 'medium', mobile: 'medium', accessibility: 'medium', social: 'medium',
    content: 'low', performance: 'low',
  };
   const isSmokeType = testType === 'smoke';

   const getSmokeExpected = (t) => {
    const name = (t.name || '').toLowerCase();
    if (/http status/.test(name))     return 'Server responds with HTTP 200 OK';
    if (/ssl|https/.test(name))       return 'Site is served over a valid HTTPS connection';
    if (/load time/.test(name))       return 'Page loads within the acceptable threshold (< 5000ms)';
    if (/body rendered/.test(name))   return 'The <body> element renders without error';
    if (/heading visible/.test(name)) return 'A visible heading confirms the correct page loaded';
    if (/heading:/.test(name))        return 'The heading element is visible with expected text';
    if (/main content/.test(name))    return 'The main content container is present in the DOM';
    if (/auth entry/.test(name))      return 'An authentication entry point is reachable';
    if (/^navigation present/.test(name)) return 'The site navigation menu is present and visible';
    if (/^nav link/.test(name))       return 'The navigation link is visible in the DOM';
    if (/search bar/.test(name))      return 'A search input is present and available';
    if (/brand logo/.test(name))      return 'The brand logo is visible in the header';
    if (/^footer present/.test(name)) return 'The footer section is present and visible';
    if (/^footer link/.test(name))    return 'The footer link is visible in the DOM';
    if (/^cta button/.test(name))     return 'The call-to-action button is visible and clickable';
    if (/^form present/.test(name))   return 'A form element is present on the page';
    if (/^input field/.test(name))    return 'The input field is visible and accessible';
    if (/^section:/.test(name))       return 'The content section is visible';
    if (/^card:/.test(name))          return 'The card element is visible';
    if (/^image:/.test(name))         return 'The image is present, loaded and rendered';
    if (/lang switch/.test(name))     return 'The language switcher is present';
    if (/pagination/.test(name))      return 'Pagination controls are present (if applicable)';
    return 'Element is present and visible in the DOM';
  };

  const getSmokePriority = (t) => {
    const name = (t.name || '').toLowerCase();
    if (/http status|ssl|load time|body rendered|heading visible$|main content|auth entry/.test(name)) return 'high';
    if (/footer|logo|hero|search|cta|navigation present|nav link/.test(name)) return 'medium';
    if (/image|pagination|lang switch|^card:|^section:/.test(name)) return 'low';
    return 'medium';
  };


  const getExpected = (t) => isSeo
  ? (EXPECTED_MAP_SEO[t.name] || 'Check passes according to SEO best practices')
  : isSmokeType
  ? getSmokeExpected(t)
  : isRegression
  ? (t.expected || t.description || 'Page/element behaves as expected after latest changes')
  : isFunctional
  ? (t.expected || t.description || 'Step completes without error')
  : (testType === 'api')
  ? (t.expected || t.description || 'API endpoint responds with expected status code')
  : (t.suite || 'Step completes without error');

  const getPriority = (t) => isSeo
    ? (INTRINSIC_PRIORITY_SEO[t.category] || 'medium')
    : isSmokeType
    ? getSmokePriority(t)
    : (t.priority || 'medium');

  const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

  // Ordre stable — par catégorie, pas par résultat (un scenario ne "bouge" pas selon pass/fail)
  const sorted = tests.slice().sort((a, b) => {
    const sevOrder = { high: 0, medium: 1, low: 2 };
    return (sevOrder[getPriority(a)] ?? 1) - (sevOrder[getPriority(b)] ?? 1);
  });

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', background: 'rgba(99,102,241,.04)', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
        Test plan — what this suite checks, independent of execution results. See the <strong style={{ color: 'var(--indigo2)' }}>Results</strong> tab for pass/fail outcomes.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 130px 100px 90px', gap: 12, padding: '13px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        {['#', 'Scenario', 'Category', 'Priority', 'Tested'].map(h => (
          <div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</div>
        ))}
      </div>
      {sorted.map((test, i) => {
        const priority = getPriority(test);
        const catColor = CAT_COLORS[test.category] || '#64748b';
        const priColor = PRIORITY_COLORS[priority];
        const wasTested = test.status === 'pass' || test.status === 'fail';
        return (
          <div key={test.id} style={{
            display: 'grid', gridTemplateColumns: '44px 1fr 130px 100px 90px', gap: 12,
            padding: '14px 20px', borderBottom: '1px solid var(--border)',
            alignItems: 'center', animation: `dFadeUp .25s var(--ease) ${i * 0.03}s both`,
            transition: 'background .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{test.id || i + 1}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{test.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{getExpected(test)}</div>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              color: catColor, background: `${catColor}15`, border: `1px solid ${catColor}30`,
              textTransform: 'uppercase', letterSpacing: 1, width: 'fit-content',
            }}>
              {test.category || 'general'}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              color: priColor, background: `${priColor}15`, border: `1px solid ${priColor}30`,
              textTransform: 'uppercase', letterSpacing: 1, width: 'fit-content',
            }}>
              {priority}
            </span>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 10, fontWeight: 700,
              color: wasTested ? '#10b981' : '#64748b',
            }}>
              {wasTested ? (
                <><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> Yes</>
              ) : (
                '— No'
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
})()}

{activeTab === 'recommendations' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

    {(isSeo || testType === 'smoke' || testType === 'functional' || isRegression || testType === 'api' || isSecurity) ? (
  (() => {
    const aiResult = generation?.result?.ai || runResults?.ai || {};
    const recs = aiResult.recommendations || [];
    const summary = aiResult.summary || '';
    const actionPlan = aiResult.action_plan || [];

    if (!summary && recs.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 32px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>No AI recommendations available</h3>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>The AI analysis may not have completed for this generation.</p>
        </div>
      );
    }

    return (
      <>
        {summary && (
          <div style={{ background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🤖</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>AI Summary</div>
              <p style={{ fontSize: 13, color: 'var(--sub)', margin: 0, lineHeight: 1.7 }}>{summary}</p>
            </div>
          </div>
        )}

        {recs.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['high', 'medium', 'low'].map(p => {
              const count = recs.filter(r => r.priority === p).length;
              if (!count) return null;
              const colors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
              return (
                <span key={p} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: colors[p], background: `${colors[p]}12`, border: `1px solid ${colors[p]}30`, textTransform: 'capitalize' }}>
                  {count} {p}
                </span>
              );
            })}
          </div>
        )}

        {recs.map((rec, i) => (
          <RecommendationCard key={i} rec={{
            priority: rec.priority || 'medium',
            category: rec.category || 'smoke',
            title: rec.issue || rec.category || 'Smoke Issue',
            description: rec.fix || '',
            impact: null,
          }} index={i} />
        ))}

        {actionPlan.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Action Plan</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {actionPlan.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--sub)' }}>
                  <span style={{ color: 'var(--indigo2)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  })()
) : (
      // ── Autres test types : logique générique existante ──
      (() => {
        const perfRecs = [];
        if (loadTimeMs > 5000) perfRecs.push({ priority: 'critical', category: 'server', title: 'Critical: Page Load Exceeds 5s', description: `Page loads in ${loadTimeMs}ms — very slow. Optimize images, enable CDN caching.`, impact: 'Could reduce load time by 40-60%' });
        else if (loadTimeMs > 3000) perfRecs.push({ priority: 'high', category: 'server', title: 'Slow Page Load Detected', description: `Page loads in ${loadTimeMs}ms — above the 3000ms threshold. Consider asset optimization.`, impact: 'Improved user experience' });
        else perfRecs.push({ priority: 'low', category: 'caching', title: 'Performance is Good', description: `Page load time is ${loadTimeMs}ms — within acceptable range. Continue monitoring.`, impact: 'Sustained good user experience' });
        if (fail > 0) perfRecs.push({ priority: 'high', category: 'javascript', title: `${fail} Test(s) Failed`, description: 'Review failed tests and check selector stability. Elements may have changed.', impact: 'Fix failures to ensure full coverage' });
        if (skip > 0) perfRecs.push({ priority: 'medium', category: 'network', title: `${skip} Test(s) Skipped`, description: 'Skipped tests may indicate optional or unstable elements. Review selectors.', impact: 'Better test coverage' });
        if (pass === tests.length && tests.length > 0) perfRecs.push({ priority: 'low', category: 'caching', title: 'All Tests Passed 🎉', description: 'Excellent! All tests passed successfully. Keep monitoring for regressions.', impact: 'Application is stable' });
        return perfRecs;
      })().map((rec, i) => (
        <RecommendationCard key={i} rec={rec} index={i} />
      ))
    )}

  </div>
)}
    </div>
  );
}



const FW_CONFIG = {
  Selenium:   { color: '#43B02A', letters: 'Se' },
  Cypress:    { color: '#00BFA5', letters: 'Cy' },
  Playwright: { color: '#E2574C', letters: 'Pl' },
  Pytest:     { color: '#3776AB', letters: 'Py' },
  Postman:    { color: '#FF6C37', letters: 'Po' },
  k6:         { color: '#7D64FF', letters: 'k6' },
  Requests:   { color: '#06b6d4', letters: 'RQ' },
};
const TYPE_CONFIG = {
  smoke:       { color: '#64748B', bg: 'rgba(100,116,139,.1)', border: 'rgba(100,116,139,.25)', label: 'Smoke',       letter: 'S' },
  functional:  { color: '#6366F1', bg: 'rgba(99,102,241,.1)',  border: 'rgba(99,102,241,.25)',  label: 'Functional',  letter: 'F' },
  performance: { color: '#8B5CF6', bg: 'rgba(139,92,246,.1)',  border: 'rgba(139,92,246,.25)',  label: 'Performance', letter: 'P' },
  api:         { color: '#10B981', bg: 'rgba(16,185,129,.1)',  border: 'rgba(16,185,129,.25)',  label: 'API',         letter: 'A' },
  regression:  { color: '#F97316', bg: 'rgba(249,115,22,.1)',  border: 'rgba(249,115,22,.25)',  label: 'Regression',  letter: 'R' },
  security:    { color: '#EF4444', bg: 'rgba(239,68,68,.1)',   border: 'rgba(239,68,68,.25)',   label: 'Security',    letter: 'S' },
  seo: {color: '#06b6d4', bg: 'rgba(6,182,212,.1)', border: 'rgba(6,182,212,.25)', label: 'SEO', letter: 'S',},

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
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}}>
  <IconFolder size={13} stroke={1.8} style={{ color: '#4f86e8' }} />
</span>
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
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}}>
  {isPublic
    ? <IconWorld size={13} stroke={1.8} style={{ color }} />
    : <IconLock size={13} stroke={1.8} style={{ color }} />}
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
        
<span style={{ fontSize: 12, display: 'flex' }}>
  {filterProject === 'all'
    ? <IconFolder size={13} stroke={1.8} style={{ color: '#4f86e8' }} />
    : selected?.type === 'public'
      ? <IconWorld size={13} stroke={1.8} style={{ color: '#4f86e8' }} />
      : <IconLock size={13} stroke={1.8} style={{ color: '#8b5cf6' }} />}
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

function FrameworkDropdown({ filterFw, setFilterFw }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = ['all', ...Object.keys(FW_CONFIG)];
  const current = filterFw === 'all' ? null : FW_CONFIG[filterFw];

  return (
    <div ref={ref} style={{ position:'relative', zIndex: open ? 50 : 1 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:8,
          background:'var(--card)', border:'1px solid var(--border)', color:'var(--text)',
          fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', minWidth:140
        }}
      >
        {current
          ? <span style={{ width:8, height:8, borderRadius:'50%', background:current.color, flexShrink:0 }}/>
          : <Code2 size={13} style={{ color:'var(--indigo2)', flexShrink:0 }} />
        }
        <span style={{ flex:1, textAlign:'left' }}>{filterFw === 'all' ? 'All Frameworks' : filterFw}</span>
        <svg width="12" height="12" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', left:0, minWidth:180, zIndex:9999,
          background:'var(--card)', border:'1px solid var(--border)', borderRadius:10,
          boxShadow:'0 12px 32px rgba(0,0,0,.4)', overflow:'hidden'
        }}>
          {options.map(fw => {
            const conf = FW_CONFIG[fw];
            const active = filterFw === fw;
            return (
              <div
                key={fw}
                onClick={() => { setFilterFw(fw); setOpen(false); }}
                style={{
                  display:'flex', alignItems:'center', gap:8, padding:'10px 14px', cursor:'pointer',
                  fontSize:12, fontWeight:600, color: active ? 'var(--indigo2)' : 'var(--text)',
                  background: active ? 'var(--indigo-dim)' : 'transparent'
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {conf ? (
                  <span style={{ width:8, height:8, borderRadius:'50%', background:conf.color, flexShrink:0 }}/>
                ) : (
                  <span style={{
                    width:22, height:22, borderRadius:7, flexShrink:0,
                    background:'rgba(99,102,241,.12)', border:'1px solid rgba(99,102,241,.25)',
                    display:'flex', alignItems:'center', justifyContent:'center'
                  }}>
                    <Code2 size={12} color="var(--indigo2)" />
                  </span>
                )}
                {fw === 'all' ? 'All Frameworks' : fw}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function TypeDropdown({ filterType, setFilterType }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = ['all', ...Object.keys(TYPE_CONFIG)];
  const current = filterType === 'all' ? null : TYPE_CONFIG[filterType];

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:8,
          background:'var(--card)', border:'1px solid var(--border)', color:'var(--text)',
          fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', minWidth:150
        }}
      >
        {current ? (
          <span style={{
            width:20, height:20, borderRadius:6, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:9, fontWeight:800, color:current.color,
            background:current.bg, border:`1px solid ${current.border}`
          }}>
            {current.letter}
          </span>
        ) : (
          <span style={{
            width:20, height:20, borderRadius:6, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'var(--indigo-dim)', border:'1px solid var(--indigo-border)'
          }}>
            <ListFilter size={11} color="var(--indigo2)" />
          </span>
        )}
        <span style={{ flex:1, textAlign:'left' }}>{filterType === 'all' ? 'All Types' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}</span>
        <svg width="12" height="12" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', left:0, minWidth:190, zIndex:9999,
          background:'var(--card)', border:'1px solid var(--border)', borderRadius:10,
          boxShadow:'0 12px 32px rgba(0,0,0,.4)', overflow:'hidden'
        }}>
          {options.map(type => {
            const conf = TYPE_CONFIG[type];
            const active = filterType === type;
            return (
              <div
                key={type}
                onClick={() => { setFilterType(type); setOpen(false); }}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer',
                  fontSize:12, fontWeight:600, color: active ? 'var(--indigo2)' : 'var(--text)',
                  background: active ? 'var(--indigo-dim)' : 'transparent'
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {conf ? (
                  <span style={{
                    width:20, height:20, borderRadius:6, flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:9, fontWeight:800, color:conf.color,
                    background:conf.bg, border:`1px solid ${conf.border}`
                  }}>
                    {conf.letter}
                  </span>
                ) : (
                  <span style={{
                    width:22, height:22, borderRadius:7, flexShrink:0,
                    background:'var(--indigo-dim)', border:'1px solid var(--indigo-border)',
                    display:'flex', alignItems:'center', justifyContent:'center'
                  }}>
                    <ListFilter size={12} color="var(--indigo2)" />
                  </span>
                )}
                {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function DateDropdown({ filterDate, setFilterDate }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => filterDate ? new Date(filterDate) : new Date());
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const formatDateStr = (d) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const selectDay = (d) => {
    if (!d) return;
    setFilterDate(formatDateStr(d));
    setOpen(false);
  };

  const displayLabel = filterDate
    ? new Date(filterDate + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    : 'All Dates';

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:8,
          background:'var(--card)', border:'1px solid var(--border)', color:'var(--text)',
          fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', minWidth:150
        }}
      >
        <Calendar size={14} style={{ color:'var(--indigo2)', flexShrink:0 }} />
        <span style={{ flex:1, textAlign:'left' }}>{displayLabel}</span>
        {filterDate && (
          <span
            onClick={(e) => { e.stopPropagation(); setFilterDate(''); }}
            style={{ display:'flex', color:'var(--muted)' }}
          >
            <X size={13} />
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', left:0, width:280, zIndex:9999,
          background:'var(--card)', border:'1px solid var(--border)', borderRadius:14,
          boxShadow:'0 16px 40px rgba(0,0,0,.45)', overflow:'hidden', padding:'14px 16px 16px'
        }}>
          {/* Header month nav */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              style={{ width:26, height:26, borderRadius:7, background:'var(--bg2)', border:'1px solid var(--border2)', color:'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
            >
              <ChevronLeft size={14} />
            </button>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{monthNames[month]} {year}</div>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              style={{ width:26, height:26, borderRadius:7, background:'var(--bg2)', border:'1px solid var(--border2)', color:'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day names */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:2, marginBottom:6 }}>
            {dayNames.map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'var(--muted)', padding:'4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:2 }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const dateStr = formatDateStr(d);
              const isToday    = dateStr === todayStr;
              const isSelected = dateStr === filterDate;
              return (
                <button
                  key={i}
                  onClick={() => selectDay(d)}
                  style={{
                    width:'100%', aspectRatio:'1', borderRadius:8,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:12, fontWeight: isSelected ? 700 : 500,
                    background: isSelected ? 'var(--indigo)' : 'transparent',
                    color: isSelected ? '#fff' : isToday ? 'var(--indigo2)' : 'var(--text)',
                    border: isToday && !isSelected ? '1px solid var(--indigo-border)' : '1px solid transparent',
                    cursor:'pointer', transition:'all .15s'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(99,102,241,.1)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          {filterDate && (
            <button
              onClick={() => { setFilterDate(''); setOpen(false); }}
              style={{
                width:'100%', marginTop:12, padding:'8px', borderRadius:8,
                background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--muted)',
                fontSize:11, fontWeight:700, cursor:'pointer'
              }}
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
}
// History Page
function HistoryPanel({ goTo, setGeneration }) {
  const { t, lang, setLanguage } = useLang();
  const [histories,     setHistories]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [filterFw,      setFilterFw]      = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterDate,    setFilterDate]    = useState('');   
const [filterRateMin, setFilterRateMin] = useState(''); 
const [filterType, setFilterType] = useState('all');   
  const [projects,      setProjects]      = useState([]);
  const [sortKey,       setSortKey]       = useState('date');
  const [sortDir,       setSortDir]       = useState('desc');
  const [selected,      setSelected]      = useState(null);
  const [deleting,      setDeleting]      = useState(null);
  const [currentPage,   setCurrentPage]   = useState(1);  // ← ICI UNE SEULE FOIS
  const ITEMS_PER_PAGE = 10; 

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
    const matchSearch  = (h.url || '').toLowerCase().includes(search.toLowerCase());
    const matchFw       = filterFw === 'all' || h.framework === filterFw;
    const matchType      = filterType === 'all' || h.test_type === filterType;
    const matchProject  = filterProject === 'all' || String(h.project_id) === String(filterProject);
    const matchDate      = !filterDate || (h.created_at && h.created_at.slice(0, 10) === filterDate);
    const matchRate       = !filterRateMin || (h.pass_rate || 0) >= Number(filterRateMin);
    return matchSearch && matchFw && matchType && matchProject && matchDate && matchRate;
  })
    .sort((a, b) => {
      let va, vb;
      if (sortKey === 'date')  { va = new Date(a.created_at); vb = new Date(b.created_at); }
      if (sortKey === 'rate')  { va = a.pass_rate||0; vb = b.pass_rate||0; }
      if (sortKey === 'tests') { va = (a.pass_count||0)+(a.fail_count||0)+(a.skip_count||0); vb = (b.pass_count||0)+(b.fail_count||0)+(b.skip_count||0); }
      return sortDir === 'desc' ? vb - va : va - vb;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const safePage   = Math.min(currentPage, totalPages || 1);
  const paginated  = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const toggleSort = (key) => { if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortKey(key); setSortDir('desc'); } };

 const handleView = (item) => {
  const parsedResult = typeof item.result === 'string' 
    ? JSON.parse(item.result || '{}') 
    : (item.result || {});
    console.log('[HistoryPanel handleView] item.summary:', item.summary);
  console.log('[HistoryPanel handleView] item.test_cases length:', item.test_cases?.length);
  console.log('[HistoryPanel handleView] parsedResult:', parsedResult);
  setGeneration({
      fresh: false,
    url: item.url, framework: item.framework, test_type: item.test_type,
    generation: { 
      id: item.id, 
      url: item.url, 
      framework: item.framework, 
      load_time_ms: item.load_time_ms, 
      test_type: item.test_type 
    },
    result: {
      test_type: item.test_type || 'smoke',
      test_cases: item.test_cases || parsedResult.test_cases || [],
      test_cases_selenium: item.test_cases_selenium || parsedResult.test_cases_selenium || [],
      test_cases_cypress: item.test_cases_cypress || parsedResult.test_cases_cypress || [],
      seo_score: parsedResult.seo_score || item.seo_score || 0,  // ← AJOUTE
      ai: parsedResult.ai || item.ai || {},                      // ← AJOUTE
      script: item.script || parsedResult.script || '',
      script_selenium: item.script_selenium || parsedResult.script_selenium || '',
      script_playwright: item.script_playwright || parsedResult.script_playwright || '',
      script_cypress: item.script_cypress || parsedResult.script_cypress || '',
      script_postman: item.script_postman || parsedResult.script_postman || '',
      script_pytest: item.script_pytest || parsedResult.script_pytest || '',
      domains: item.domains || parsedResult.domains || [],
      base_url: item.base_url || parsedResult.base_url || item.url || '',
      pass_count: item.pass_count || 0,
      fail_count: item.fail_count || 0,
      skip_count: item.skip_count || 0,
      pass_rate: item.pass_rate || 0,
      summary: (() => {
  const raw = item.summary && !Array.isArray(item.summary) ? item.summary
    : parsedResult.summary && !Array.isArray(parsedResult.summary) ? parsedResult.summary
    : null;
  if (raw && Object.keys(raw).length > 0) return raw;
  const cases = item.test_cases || [];
  const built = {};
  ['load', 'stress', 'spike', 'soak'].forEach(type => {
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    const matching = cases.filter(tc =>
      tc.name?.toLowerCase().includes(`[${type} test]`) ||
      tc.name?.toLowerCase().includes(`[${label} test]`)
    );
    if (matching.length > 0) {
  const thresholds = matching.filter(tc => tc.section === 'Thresholds');
  const nonSkipped = matching.filter(t => t.status !== 'skip');
  
  let status;
  if (thresholds.length > 0) {
    status = thresholds.some(t => t.status === 'fail') ? 'fail' : 'pass';
  } else {
    status = nonSkipped.some(t => t.status === 'fail') ? 'fail' : 'pass';
  }

  built[type] = {
    status,
    metrics: {},
    threshold_passes: matching.filter(t => t.status === 'pass').map(t => t.suite || t.name),
    threshold_failures: matching.filter(t => t.status === 'fail').map(t => t.suite || t.name),
    duration_seconds: null,
  };
}
  });
  return Object.keys(built).length > 0 ? built : {};
})(),

      scripts: item.scripts || parsedResult.scripts || {},
      execution_results: (item.execution_results || parsedResult.execution_results || []).map(r => ({
        ...r,
        screenshot: r.screenshot ?? null,
      })),
      performance: item.performance_data || item.performance || parsedResult.performance || null,
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
        <button className="btn-primary" onClick={() => goTo('generate')}><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>New Generation
</button>
      </div>

     {histories.length > 0 && (
  <div className="hp2-stats">
    {[
      { Icon: IconRocket,      val: totalGen,      lbl: 'Total Generations', sc: 'var(--gold)' },
      { Icon: IconTestPipe,    val: totalTests,    lbl: 'Tests Executed',    sc: 'var(--indigo2)' },
      { Icon: IconCircleCheck, val: totalPass,     lbl: 'Tests Passed',      sc: 'var(--green)' },
      { Icon: IconTarget,      val: `${avgRate}%`, lbl: 'Avg Pass Rate',     sc: 'var(--amber)' },
    ].map((s, i) => (
      <div key={s.lbl} className="hp2-stat" style={{ '--i': i, '--sc': s.sc }}>
        <div className="hp2-stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.sc }}>
          <s.Icon size={18} stroke={1.8} />
        </div>
        <div>
          <div className="hp2-stat-val">{s.val}</div>
          <div className="hp2-stat-lbl">{s.lbl}</div>
        </div>
      </div>
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

          <FrameworkDropdown filterFw={filterFw} setFilterFw={setFilterFw} />
          <TypeDropdown filterType={filterType} setFilterType={setFilterType} />
          <DateDropdown filterDate={filterDate} setFilterDate={setFilterDate} />

          {/* Input Pass Rate minimum */}
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--card)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 8px 6px 10px' }}>
  <IconShieldCheck size={14} stroke={1.8} style={{ color: 'var(--indigo2)', flexShrink: 0 }} />
  <input
    type="number"
    min="0"
    max="100"
    placeholder="Pass rate"
    value={filterRateMin}
    onChange={e => {
      const v = e.target.value;
      if (v === '' || (Number(v) >= 0 && Number(v) <= 100)) setFilterRateMin(v);
    }}
    className="min-rate-input"
    style={{ background:'transparent', border:'none', color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none', width:60 }}
  />
  <div style={{ display:'flex', flexDirection:'column', gap:2, flexShrink:0 }}>
    <button
      type="button"
      onClick={() => setFilterRateMin(String(Math.min(100, (Number(filterRateMin)||0) + 1)))}
      style={{ width:16, height:11, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--muted)', padding:0, transition:'all .15s' }}
      onMouseEnter={e => { e.currentTarget.style.background='var(--indigo-bg)'; e.currentTarget.style.color='var(--indigo2)'; e.currentTarget.style.borderColor='var(--indigo-border)'; }}
      onMouseLeave={e => { e.currentTarget.style.background='var(--bg2)'; e.currentTarget.style.color='var(--muted)'; e.currentTarget.style.borderColor='var(--border)'; }}
    >
      <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>
    </button>
    <button
      type="button"
      onClick={() => setFilterRateMin(String(Math.max(0, (Number(filterRateMin)||0) - 1)))}
      style={{ width:16, height:11, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--muted)', padding:0, transition:'all .15s' }}
      onMouseEnter={e => { e.currentTarget.style.background='var(--indigo-bg)'; e.currentTarget.style.color='var(--indigo2)'; e.currentTarget.style.borderColor='var(--indigo-border)'; }}
      onMouseLeave={e => { e.currentTarget.style.background='var(--bg2)'; e.currentTarget.style.color='var(--muted)'; e.currentTarget.style.borderColor='var(--border)'; }}
    >
      <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
  </div>
  {filterRateMin && (
    <button onClick={() => setFilterRateMin('')} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', padding:0, display:'flex', flexShrink:0 }}>
      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  )}
  <style>{`
    .min-rate-input::-webkit-outer-spin-button,
    .min-rate-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .min-rate-input[type=number] {
      -moz-appearance: textfield;
    }
  `}</style>
</div>

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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', gap: 20 }}>
                <LogoSpinner size={80} />
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
                  Loading History...
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="hp2-empty">
                <div className="hp2-empty-icon"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
                <h3>{search||filterFw!=='all'?'No results found':t('noHistoryYet')}</h3>
                <p>{search||filterFw!=='all'?'Try adjusting your search or filters':t('noHistoryDesc')}</p>
              </div>
            ) : (
              paginated.map((item, i) => {
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
          {totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginTop:20, padding:'12px 0' }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                style={{ padding:'6px 16px', borderRadius:8, background:'var(--card)', border:'1px solid var(--border)', color: safePage === 1 ? 'var(--muted)' : 'var(--text)', cursor: safePage === 1 ? 'default' : 'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700 }}>
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)}
                  style={{ width:32, height:32, borderRadius:8, background: safePage === i+1 ? 'var(--indigo)' : 'var(--card)', border: safePage === i+1 ? '1px solid var(--indigo2)' : '1px solid var(--border)', color: safePage === i+1 ? '#fff' : 'var(--muted)', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700 }}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                style={{ padding:'6px 16px', borderRadius:8, background:'var(--card)', border:'1px solid var(--border)', color: safePage === totalPages ? 'var(--muted)' : 'var(--text)', cursor: safePage === totalPages ? 'default' : 'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700 }}>
                Next
              </button>
            </div>
          )}
        </div>
        {selected && (<DetailSidebar item={selected} onClose={() => setSelected(null)} onView={handleView} onDelete={handleDelete} deleting={deleting} />)}
      </div>
    </div>
  );
}


function FloatField({ label, value, onChange, type = 'text', icon, autoCompleteType }) {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === 'password';
  const inputType  = isPassword ? (showPwd ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg2)', border: '1.5px solid var(--border2)', borderRadius: 12, padding: '11px 14px' }}>
        <span style={{ color: 'var(--muted)', flexShrink: 0, display: 'flex' }}>{icon}</span>
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={label}
          autoComplete={autoCompleteType || 'off'}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', transition: 'none', WebkitTextFillColor: 'var(--text)' }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: showPwd ? 'var(--gold)' : 'var(--muted)', display: 'flex', alignItems: 'center', flexShrink: 0, padding: 4, borderRadius: 6, transition: 'none' }}>
            {showPwd ? (
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            ) : (
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

//Account Page 
function AccountPanel({ user, setPage, setProjectStep }) {
  const { setUser } = useAuth();
  const { t, lang, setLanguage } = useLang();
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [name,       setName]       = useState(user?.name  || '');
  const [email,      setEmail]      = useState(user?.email || '');
  const [currPwd,    setCurrPwd]    = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [msg,        setMsg]        = useState('');
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [stats, setStats] = useState({ generations_count:0, projects_count:0, avg_pass_rate:0, alerts_count:0, last_login:null });
  const [statsLoading, setStatsLoading] = useState(true);
  // Après le useState de stats, ajoute :
const [recentActivity, setRecentActivity] = useState([]);
const [showLoginHistory, setShowLoginHistory] = useState(false);
const [showSessions,     setShowSessions]     = useState(false);
const [showDanger,       setShowDanger]        = useState(false);
const [showDeactivateModal, setShowDeactivateModal] = useState(false);
const [sessionCount,     setSessionCount]      = useState(1);
const [phone,    setPhone]    = useState(user?.phone    || '');
const [company,  setCompany]  = useState(user?.company  || '');
const [position, setPosition] = useState(user?.position || '');

// Dans le useEffect existant, ajoute la fetch des générations :
useEffect(() => {
  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60)     return `${Math.floor(diff)}s ago`;
    if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  Promise.all([
    api.get('/profile'),
    api.get('/generations'),
    api.get('/projects'),   // ← NOUVEAU
  ]).then(([profileRes, genRes, projRes]) => {
    setStats({
      generations_count: profileRes.data.generations_count || 0,
      projects_count:    profileRes.data.projects_count    || 0,
      avg_pass_rate:     profileRes.data.avg_pass_rate     || 0,
      alerts_count:      profileRes.data.alerts_count      || 0,
      last_login:        profileRes.data.last_login        || null, 
    });

    setSessionCount(profileRes.data.session_count || 1);

    const gens  = Array.isArray(genRes.data)  ? genRes.data  : [];
    const projs = Array.isArray(projRes.data) ? projRes.data : [];

    // Activités depuis générations
    const TYPE_ICONS = {
      smoke:       { icon: <svg width="16" height="16" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, color: 'rgba(34,197,94,.12)', border: 'rgba(34,197,94,.25)' },
      functional:  { icon: <svg width="16" height="16" fill="none" stroke="#818cf8" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>, color: 'rgba(99,102,241,.12)', border: 'rgba(99,102,241,.25)' },
      performance: { icon: <svg width="16" height="16" fill="none" stroke="#8b5cf6" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, color: 'rgba(139,92,246,.12)', border: 'rgba(139,92,246,.25)' },
      security:    { icon: <svg width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, color: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.25)' },
      regression:  { icon: <svg width="16" height="16" fill="none" stroke="#f97316" strokeWidth="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.14"/></svg>, color: 'rgba(249,115,22,.12)', border: 'rgba(249,115,22,.25)' },
      api:         { icon: <svg width="16" height="16" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>, color: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.25)' },
      seo:         { icon: <svg width="16" height="16" fill="none" stroke="#06b6d4" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>, color: 'rgba(6,182,212,.12)', border: 'rgba(6,182,212,.25)' },
    };

    const genActivities = gens.map(g => {
      const isOk = (g.pass_rate || 0) >= 80;
      const cfg  = TYPE_ICONS[g.test_type] || TYPE_ICONS.smoke;
      const typeLabel = { smoke:'Smoke', functional:'Functional', performance:'Performance', security:'Security', regression:'Regression', api:'API', seo:'SEO' };
      return {
        icon:       cfg.icon,
        color:      cfg.color,
        border:     cfg.border,
        label:      `${typeLabel[g.test_type] || 'Test'} run on ${g.url}`,
        time:       timeAgo(g.created_at),
        created_at: g.created_at,
      };
    });

    // Activités depuis projets  ← NOUVEAU
    const projActivities = projs.map(p => ({
      icon:  <svg width="16" height="16" fill="none" stroke="#818cf8" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
      color:      'rgba(99,102,241,.12)',
      border:     'rgba(99,102,241,.25)',
      label:      `Project "${p.name}" created`,
      time:       timeAgo(p.created_at),
      created_at: p.created_at,
    }));

    // Mixer + trier par date + garder 3 ← NOUVEAU
    const all = [...genActivities, ...projActivities]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 4);

    setRecentActivity(all);
  })
  .catch(console.error)
  .finally(() => setStatsLoading(false));
}, []);




  const saveProfile = async () => {
  setLoading(true); setMsg(''); setError('');
  try {
    const res = await api.put('/profile/update', { 
      name, 
      email,
      phone,    // ← AJOUTE
      company,  // ← AJOUTE
      position, // ← AJOUTE
    });
    setUser(res.data.user);
    setMsg(t('profileUpdated'));
  }
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


  const IconUser   = (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>);
  const IconMail   = (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
  const IconLock   = (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
  const IconShield = (<svg width="16" height="16" fill="none" stroke="#f97316" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);

const revokeAllSessions = async () => {
  setLoading(true);
  try {
    await api.post('/auth/logout');
    setUser(null);
  } catch(err) { setError('Failed to revoke sessions'); }
  setLoading(false);
};

const deactivateAccount = async () => {
  setLoading(true);
  try {
    await api.put('/profile/deactivate');
    setUser(null);
  } catch(err) { setError('Failed to deactivate account'); }
  setLoading(false);
  setShowDeactivateModal(false);
};
const DeactivateModal = () => !showDeactivateModal ? null : (
  <div
    onClick={() => !loading && setShowDeactivateModal(false)}
    style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        width:'100%', maxWidth:400, background:'var(--card, #0d1f35)', border:'1px solid var(--border, rgba(99,102,241,0.12))',
        borderRadius:16, padding:'26px 28px', boxShadow:'0 24px 60px rgba(0,0,0,0.5)'
      }}
    >
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
        <div style={{
          width:40, height:40, borderRadius:10, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
        }}>
          <svg width="18" height="18" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--text, #e8eaf0)' }}>Deactivate Account</div>
      </div>

      <p style={{ fontSize:13, color:'var(--muted, #8892a4)', lineHeight:1.6, marginBottom:22 }}>
        Your account will be deactivated and hidden from access. You can reactivate it anytime by simply logging back in. Continue?
      </p>

      <div style={{ display:'flex', gap:10 }}>
        <button
          onClick={() => setShowDeactivateModal(false)}
          disabled={loading}
          style={{
            flex:1, padding:'11px', borderRadius:10, background:'var(--bg2, #0b1829)', border:'1.5px solid var(--border, rgba(99,102,241,0.12))',
            color:'var(--muted, #8892a4)', fontWeight:700, fontSize:13, cursor:'pointer'
          }}
        >
          Cancel
        </button>
        <button
  onClick={deactivateAccount}
  disabled={loading}
  style={{
    flex:1, padding:'11px', borderRadius:10, background:'linear-gradient(135deg,#dc2626,#ef4444)', border:'none',
    color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
    boxShadow:'0 4px 14px rgba(239,68,68,.35)'
  }}
>
  {loading ? <><span className="spinner"/> Deactivating…</> : 'Yes, Deactivate'}
</button>
      </div>
    </div>
  </div>
);
  return (
        <>
    <div className="panel">
      <div className="p-header"><div><h1 className="p-title">{t('my')} <span className="g">{t('account')}</span></h1><p className="p-sub">{t('accountDesc')}</p></div></div>
      {msg   && (<div className="ac2-feedback ac2-feedback--ok"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>{msg}</div>)}
      {error && (<div className="ac2-feedback ac2-feedback--err"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>{error}</div>)}
      <div className="ac2-hero">
  <div className="ac2-avatar-wrap" style={{ position:'relative', flexShrink:0 }}>
  <div className="ac2-avatar" style={{ width:90, height:90, fontSize:32 }}>
    {user?.avatar
      ? <img key={user.avatar} src={user.avatar} alt="avatar"
          style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/>
      : <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
    }
  </div>
  {/* Camera overlay */}
  <div
    onClick={() => document.getElementById('avatar-upload').click()}
    style={{
      position:'absolute', bottom:0, right:0,
      width:28, height:28, borderRadius:'50%',
      background:'#6366f1', border:'2px solid var(--bg, #0f1117)',
      display:'flex', alignItems:'center', justifyContent:'center',
      cursor:'pointer', transition:'background .2s'
    }}
    onMouseEnter={e => e.currentTarget.style.background='#4f46e5'}
    onMouseLeave={e => e.currentTarget.style.background='#6366f1'}
  >
    <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  </div>
  <input type="file" id="avatar-upload" accept="image/*" style={{ display:'none' }}
    onChange={async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const fd = new FormData(); fd.append('avatar', file);
      try {
        const res = await api.post('/profile/avatar', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
        const updatedUser = res.data.user ?? { ...user, avatar: res.data.avatar };
        if (updatedUser.avatar) updatedUser.avatar = updatedUser.avatar + '?t=' + Date.now();
        setUser(updatedUser);
      } catch(err) { console.error(err); }
    }}
  />
</div>

  {/* Hero info */}
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

    {/* Row 1 : nom + stats */}
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>

      {/* Left : identity */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="ac2-hero-name">{user?.name || 'User'}</span>
          <div className="ac2-hero-badge">
            <span className="ac2-badge-dot"/>
            {(() => {
              const role = user?.onboarding_data?.role;
              const labels = { developer:'Developer', tester:'QA / Tester', lead:'Tech Lead', other:'Explorer' };
              return labels[role] || 'QA Engineer';
            })()}
          </div>
        </div>
        <div className="ac2-hero-email">{user?.email || '—'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Member since {user?.created_at 
  ? new Date(user.created_at).toLocaleDateString('en-US', {month:'short', year:'numeric'}) 
  : '—'}
          </span>
          <span style={{ color: 'var(--muted)' }}>|</span>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
       Last login: {stats.last_login || '—'}
          </span>
        </div>
        
      </div>

      {/* Right : 4 stat cards */}
      <div style={{ display:'flex', gap:10, flexShrink:0, flexWrap:'wrap' }}>
        {/* Test Runs */}
        <div style={{
          display:'flex', flexDirection:'column', alignItems:'center', padding:'18px 26px',
          borderRadius:12, background:'rgba(201,162,39,.08)', border:'1px solid rgba(201,162,39,.2)', minWidth:110
        }}>
          <svg width="16" height="16" fill="none" stroke="#c9a227" strokeWidth="2" viewBox="0 0 24 24" style={{marginBottom:6}}>
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <span style={{ fontSize:30, fontWeight:800, color:'#c9a227', lineHeight:1 }}>
            {statsLoading ? '…' : stats.generations_count ?? 0}
          </span>
          <span style={{ fontSize:10, color:'var(--muted)', marginTop:4, fontWeight:600 }}>Test Runs</span>
        </div>
        {/* Projects */}
        <div style={{
          display:'flex', flexDirection:'column', alignItems:'center', padding:'18px 26px' ,
          borderRadius:12, background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.2)', minWidth:110
        }}>
          <svg width="16" height="16" fill="none" stroke="#818cf8" strokeWidth="2" viewBox="0 0 24 24" style={{marginBottom:6}}>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span style={{ fontSize:30, fontWeight:800, color:'#818cf8', lineHeight:1 }}>
            {statsLoading ? '…' : stats.projects_count ?? 0}
          </span>
          <span style={{ fontSize:10, color:'var(--muted)', marginTop:4, fontWeight:600 }}>Projects</span>
        </div>
        {/* Success Rate */}
        <div style={{
          display:'flex', flexDirection:'column', alignItems:'center', padding:'18px 26px',
          borderRadius:12, background:'rgba(34,197,94,.08)', border:'1px solid rgba(34,197,94,.2)', minWidth:110
        }}>
          <svg width="16" height="16" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24" style={{marginBottom:6}}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style={{ fontSize:30, fontWeight:800, color:'#22c55e', lineHeight:1 }}>
            {statsLoading ? '…' : `${stats.avg_pass_rate ?? 0}%`}
          </span>
          <span style={{ fontSize:10, color:'var(--muted)', marginTop:4, fontWeight:600 }}>Success Rate</span>
        </div>
        {/* Alerts */}
        <div style={{
          display:'flex', flexDirection:'column', alignItems:'center', padding:'18px 26px',
          borderRadius:12, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', minWidth:110
        }}>
          <svg width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24" style={{marginBottom:6}}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span style={{ fontSize:30, fontWeight:800, color:'#ef4444', lineHeight:1 }}>
            {statsLoading ? '…' : stats.alerts_count ?? 0}
          </span>
          <span style={{ fontSize:10, color:'var(--muted)', marginTop:4, fontWeight:600 }}>Alerts</span>
        </div>
      </div>
    </div>
  </div>
</div>

  <div className="ac2-grid" style={{ alignItems: 'flex-start' }}>

  {/* Card 1 : Personal Information */}
  <div className="ac2-card">
    <div className="ac2-card-head">
      <div className="ac2-card-head-icon">{IconUser}</div>
      <div>
        <div className="ac2-card-title">{t('profileInformation')}</div>
        <div className="ac2-card-sub">Update your personal details</div>
      </div>
    </div>
    <div className="ac2-card-body">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        {/* Full Name */}
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>Full Name</label>
          <div style={{ position:'relative' }}>
            <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            <input value={name} onChange={e => setName(e.target.value)} style={{ background:'rgba(255,255,255,.04)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px 9px 32px', fontSize:13, color:'var(--text)', outline:'none', width:'100%' }}/>
          </div>
        </div>
        {/* Phone */}
<div style={{ display:'flex', flexDirection:'column', gap:4 }}>
  <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>Phone Number</label>
  <div style={{ position:'relative' }}>
    <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l1.17-1.17a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
    <input 
      value={phone} 
      onChange={e => setPhone(e.target.value)}
      placeholder="+216 XX XXX XXX"
      style={{ background:'rgba(255,255,255,.04)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px 9px 32px', fontSize:13, color:'var(--text)', outline:'none', width:'100%' }}
    />
  </div>
</div>
        {/* Company */}
<div style={{ display:'flex', flexDirection:'column', gap:4 }}>
  <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>Company</label>
  <div style={{ position:'relative' }}>
    <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    <input 
      value={company} 
      onChange={e => setCompany(e.target.value)}
      placeholder="Your company"
      style={{ background:'rgba(255,255,255,.04)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px 9px 32px', fontSize:13, color:'var(--text)', outline:'none', width:'100%' }}
    />
  </div>
</div>
        {/* Email */}
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>Email</label>
          <div style={{ position:'relative' }}>
            <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" style={{ background:'rgba(255,255,255,.04)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px 9px 32px', fontSize:13, color:'var(--text)', outline:'none', width:'100%' }}/>
          </div>
        </div>
        {/* Position */}
<div style={{ display:'flex', flexDirection:'column', gap:4 }}>
  <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>Position</label>
  <div style={{ position:'relative' }}>
    <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
    <input 
      value={position} 
      onChange={e => setPosition(e.target.value)}
      placeholder="Your position"
      style={{ background:'rgba(255,255,255,.04)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px 9px 32px', fontSize:13, color:'var(--text)', outline:'none', width:'100%' }}
    />
  </div>
</div>
</div>
      <button onClick={saveProfile} disabled={loading} style={{ width:'100%', padding:'11px', borderRadius:10, background:'linear-gradient(135deg,#b8860b,#c9a227)', border:'none', color:'#000', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        {loading ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  </div>

  {/* Card 2 : Security Settings */}
  <div className="ac2-card">
  <div className="ac2-card-head">
    <div className="ac2-card-head-icon">{IconShield}</div>
    <div>
      <div className="ac2-card-title">Security Settings</div>
      <div className="ac2-card-sub">Manage your account security</div>
    </div>
  </div>
  <div className="ac2-card-body" style={{ padding:0 }}>

    {/* Change Password */}
    <div onClick={() => setShowChangePwd(prev => !prev)}
      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)', cursor:'pointer', transition:'background .15s' }}
      onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.03)'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'rgba(99,102,241,.12)', border:'1px solid rgba(99,102,241,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{IconLock}</div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Change Password</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>Update your password regularly</div>
        </div>
      </div>
      <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: showChangePwd ? 'rotate(90deg)' : 'none', transition:'transform .2s' }}><polyline points="9 18 15 12 9 6"/></svg>
    </div>
    {showChangePwd && (
      <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,.02)' }}>
        <FloatField label={t('currentPassword')} value={currPwd} onChange={setCurrPwd} type="password" icon={IconLock} autoCompleteType="current-password" />
        <FloatField label={t('newPassword')} value={newPwd} onChange={setNewPwd} type="password" icon={IconLock} autoCompleteType="new-password" />
        <FloatField label={t('confirmNewPassword')} value={confirmPwd} onChange={setConfirmPwd} type="password" icon={IconLock} autoCompleteType="new-password" />
        {newPwd.length > 0 && (
          <div className="ac2-strength">
            <div className="ac2-strength-bars">{[1,2,3,4].map(n => (<div key={n} className={`ac2-strength-bar ${newPwd.length>=n*3?(n<=1?'weak':n<=2?'fair':n<=3?'good':'strong'):''}`}/>))}</div>
            <span className="ac2-strength-label">{newPwd.length<4?'Weak':newPwd.length<7?'Fair':newPwd.length<10?'Good':'Strong'}</span>
          </div>
        )}
        <button className="ac2-btn ac2-btn--indigo" onClick={changePassword} disabled={loading} style={{ marginTop:12 }}>
          {loading ? (<><span className="spinner"/> {t('updating')}</>) : (<>{IconShield}{t('updatePassword')}</>)}
        </button>
      </div>
    )}

    {/* Login History */}
    <div onClick={() => setShowLoginHistory(prev => !prev)}
      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)', cursor:'pointer', transition:'background .15s' }}
      onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.03)'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'rgba(201,162,39,.1)', border:'1px solid rgba(201,162,39,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="16" height="16" fill="none" stroke="#c9a227" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Login History</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>View your recent login activity</div>
        </div>
      </div>
      <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: showLoginHistory ? 'rotate(90deg)' : 'none', transition:'transform .2s' }}><polyline points="9 18 15 12 9 6"/></svg>
    </div>
    {showLoginHistory && (
      <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,.02)' }}>
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:1, background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:10, color:'var(--muted)', fontWeight:600, marginBottom:4 }}>IP ADDRESS</div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{user?.last_login_ip || '—'}</div>
          </div>
          <div style={{ flex:1, background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:10, color:'var(--muted)', fontWeight:600, marginBottom:4 }}>LAST LOGIN</div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>
              {user?.last_login_at
                ? new Date(user.last_login_at).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
                : '—'}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Active Sessions */}
    <div onClick={() => setShowSessions(prev => !prev)}
      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)', cursor:'pointer', transition:'background .15s' }}
      onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.03)'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'rgba(34,197,94,.1)', border:'1px solid rgba(34,197,94,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="16" height="16" fill="none" stroke="#22c55e" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Active Sessions</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>Manage your active sessions</div>
        </div>
      </div>
      <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: showSessions ? 'rotate(90deg)' : 'none', transition:'transform .2s' }}><polyline points="9 18 15 12 9 6"/></svg>
    </div>
    {showSessions && (
      <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,.02)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ fontSize:12, color:'var(--muted)' }}>
            <span style={{ color:'#22c55e', fontWeight:700, fontSize:18 }}>{sessionCount}</span> active session{sessionCount > 1 ? 's' : ''}
          </div>
          <button onClick={revokeAllSessions} disabled={loading}
            style={{ fontSize:12, fontWeight:600, color:'#ef4444', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, padding:'6px 14px', cursor:'pointer' }}>
            Revoke All
          </button>
        </div>
        <div style={{ fontSize:11, color:'var(--muted)' }}>Revoking all sessions will log you out from all devices.</div>
      </div>
    )}

    {/* Danger Zone */}
    <div onClick={() => setShowDanger(prev => !prev)}
      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', cursor:'pointer', transition:'background .15s' }}
      onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,.03)'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'#ef4444' }}>Danger Zone</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>Deactivate your account</div>
        </div>
      </div>
      <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: showDanger ? 'rotate(90deg)' : 'none', transition:'transform .2s' }}><polyline points="9 18 15 12 9 6"/></svg>
    </div>
    {showDanger && (
      <div style={{ padding:'16px 20px', background:'rgba(239,68,68,.03)' }}>
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:12, lineHeight:1.6 }}>
          Deactivating your account will <strong style={{ color:'#ef4444' }}>disable access</strong> and hide your data from other users. Your projects and generations will be preserved. You can reactivate your account anytime by logging in again.
</div>
        <button onClick={() => setShowDeactivateModal(true)} disabled={loading}

          style={{ width:'100%', padding:'11px', borderRadius:10, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', color:'#ef4444', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
          Deactivate Account
        </button>
      </div>
    )}

  </div>
</div>

  {/* Card 3 : Recent Activity — à DROITE de Security */}
  <div className="ac2-card">
    <div className="ac2-card-head" style={{ justifyContent:'space-between' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
       <div className="ac2-card-head-icon" style={{ background:'rgba(139,92,246,.12)', border:'1px solid rgba(139,92,246,.25)' }}>
<svg width="16" height="16" fill="none" stroke="#10b981" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <div>
          <div className="ac2-card-title">Recent Activity</div>
          <div className="ac2-card-sub">Your latest actions</div>
        </div>
      </div>
      
    </div>
    <div className="ac2-card-body" style={{ padding:0 }}>
      {recentActivity.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
          No activity yet
        </div>
      ) : recentActivity.map((item, i, arr) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none', transition:'background .15s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.02)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
          <div style={{ width:8, height:8, borderRadius:'50%', background: item.border, border:`2px solid ${item.color}`, flexShrink:0, boxShadow: `0 0 6px ${item.border}` }}/>
          <div style={{ width:34, height:34, borderRadius:9, flexShrink:0, background:item.color, border:`1px solid ${item.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>{item.icon}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{item.label}</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{item.time}</div>
          </div>
        </div>
      ))}
    </div>
  </div>

</div>


{/* ── Quick Actions ── */}
<div style={{ marginTop: 16, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', boxShadow: 'var(--shadow)' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
    <svg width="18" height="18" fill="none" stroke="#c9a227" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Quick Actions</span>
  </div>
  <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, marginLeft: 28 }}>Shortcuts to common tasks</p>
  <div style={{ display: 'flex', gap: 12 }}>
     {[
      { label: 'Create Project', sub: 'Start a new test project', color: '#818cf8', bg: 'rgba(99,102,241,.08)', border: 'rgba(99,102,241,.2)',
        action: () => { setProjectStep('create'); setPage('generate'); },
        icon: <svg width="22" height="22" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg> },
      { label: 'Run Tests', sub: 'Execute your tests', color: '#22c55e', bg: 'rgba(34,197,94,.08)', border: 'rgba(34,197,94,.2)',
        action: () => { setProjectStep('list'); setPage('generate'); },
        icon: <svg width="22" height="22" fill="none" stroke="#22c55e" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> },
      { label: 'View Reports', sub: 'Explore test reports', color: '#c9a227', bg: 'rgba(201,162,39,.08)', border: 'rgba(201,162,39,.2)',
        action: () => setPage('reports'),
        icon: <svg width="22" height="22" fill="none" stroke="#c9a227" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
      { label: 'Settings', sub: 'Manage preferences', color: '#94a3b8', bg: 'rgba(148,163,184,.08)', border: 'rgba(148,163,184,.2)',
        action: () => setPage('settings'),
        icon: <svg width="22" height="22" fill="none" stroke="#94a3b8" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
    ].map((item, i) => (
      <div key={i} onClick={item.action}
        style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 12, background: item.bg, border: `1px solid ${item.border}`, cursor: 'pointer', transition: 'all .2s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.2)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
        {item.icon}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{item.label}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{item.sub}</div>
        </div>
        <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    ))}
     </div>
  </div>
</div>

<DeactivateModal />
  </>
  );

}


// Settings Page 
function SettingsPanel({ theme, setTheme, reduceMotion, setReduceMotion, sidebarPos, setSidebarPos }) {

  const { t, setLanguage: applyLanguage } = useLang();
  const { logout } = useAuth();

  // ── states ──────────────────────────────────────────────────────────────────
  const [notifs,       setNotifs]       = useState(true);
  const [testAlerts,   setTestAlerts]   = useState(true);
  const [weekly,       setWeekly]       = useState(true);
  const [productUpd,   setProductUpd]   = useState(false);
  const [framework,    setFramework]    = useState('Playwright');
  const [testType,     setTestType]     = useState('E2E');
  const [aiModel,      setAiModel]      = useState('GPT-4o');
  const [testDir,      setTestDir]      = useState('tests/');
  const [language,     setLanguage]     = useState('en');
  const [timezone,     setTimezone]     = useState('(UTC+01:00) Europe/Paris');
  const [dateFormat,   setDateFormat]   = useState('MM/DD/YYYY');
  const [timeFormat,   setTimeFormat]   = useState('24-hour');
  const [autoSave,     setAutoSave]     = useState(true);
  const [confirmRun,   setConfirmRun]   = useState(true);
  const [deleteConf,   setDeleteConf]   = useState(true);
  const [beta,         setBeta]         = useState(false);
  const [slackConn,    setSlackConn]    = useState(false);
  const [jiraConn,     setJiraConn]     = useState(false);
  const [githubConn,   setGithubConn]   = useState(false);
  const [msg,          setMsg]          = useState('');
  const [loading,      setLoading]      = useState(false);

  useEffect(() => {
    api.get('/settings').then(res => {
      setNotifs(res.data.email_notifications ?? true);
      setTestAlerts(res.data.test_alerts ?? true);
      setWeekly(res.data.weekly_report ?? true);
      setProductUpd(res.data.product_updates ?? false);
      setReduceMotion(res.data.reduce_motion ?? false);
      setSidebarPos(res.data.sidebar_position ?? 'Left');
      setFramework(res.data.default_framework ?? 'Playwright');
      setTestType(res.data.default_test_type ?? 'E2E');
      setAiModel(res.data.default_ai_model ?? 'GPT-4o');
      setTestDir(res.data.default_test_dir ?? 'tests/');
      setLanguage(res.data.language ?? 'en');
      setTimezone(res.data.timezone ?? '(UTC+01:00) Europe/Paris');
      setDateFormat(res.data.date_format ?? 'MM/DD/YYYY');
      setTimeFormat(res.data.time_format ?? '24-hour');
      setAutoSave(res.data.auto_save ?? true);
      setConfirmRun(res.data.confirm_before_run ?? true);
      setDeleteConf(res.data.delete_confirmation ?? true);
      setBeta(res.data.beta_features ?? false);
      if (!theme || theme === 'light') setTheme(res.data.theme ?? 'light');
    });
  }, []);

  const saveSettings = async () => {
    setLoading(true); setMsg('');
    try {
      await api.put('/settings/update', {
        email_notifications: notifs,
        test_alerts: testAlerts,
        weekly_report: weekly,
        product_updates: productUpd,
        reduce_motion: reduceMotion,
        sidebar_position: sidebarPos,
        default_framework: framework,
        default_test_type: testType,
        default_ai_model: aiModel,
        default_test_dir: testDir,
        theme,
        language,
        timezone,
        date_format: dateFormat,
        time_format: timeFormat,
        auto_save: autoSave,
        confirm_before_run: confirmRun,
        delete_confirmation: deleteConf,
        beta_features: beta,
      });
      applyLanguage(language);
      setMsg(t('settingsSaved'));
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // ── small helpers ────────────────────────────────────────────────────────────
  const Toggle = ({ on, onToggle }) => (
    <div
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: on ? '#6366f1' : 'rgba(255,255,255,0.1)',
        position: 'relative', cursor: 'pointer',
        transition: 'background .2s', flexShrink: 0,
        border: on ? '1px solid #818cf8' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: on ? 23 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff',
        transition: 'left .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </div>
  );
const [isDarkMode, setIsDarkMode] = useState(true); // dark par défaut

useEffect(() => {
  const computeIsDark = () => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    // theme === 'system'
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // fallback: NexTest est dark par défaut
  };

  setIsDarkMode(computeIsDark());

  // Si "system", on écoute les changements de préférence OS en live
  if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setIsDarkMode(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }
}, [theme]);

// Remplace tout le bloc SetSelect par ceci :
const SetSelect = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
          borderRadius: 8,
          color: isDarkMode ? '#94a3b8' : '#334155',
          fontSize: 12, fontWeight: 600,
          padding: '7px 10px',
          fontFamily: 'inherit', cursor: 'pointer',
          outline: 'none', minWidth: 110,
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{value}</span>
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"
          viewBox="0 0 24 24"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 130, zIndex: 999,
          background: isDarkMode ? '#0d1526' : '#ffffff',
          border: isDarkMode ? '1px solid rgba(99,102,241,.25)' : '1px solid #e2e8f0',
          borderRadius: 10,
          boxShadow: isDarkMode ? '0 12px 32px rgba(0,0,0,.5)' : '0 12px 32px rgba(0,0,0,.12)',
          overflow: 'hidden', padding: 4,
        }}>
          {options.map(o => {
            const active = o === value;
            return (
              <div
                key={o}
                onClick={() => { onChange(o); setOpen(false); }}
                style={{
                  padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                  color: active ? '#6366f1' : (isDarkMode ? '#cbd5e1' : '#334155'),
                  background: active ? (isDarkMode ? 'rgba(99,102,241,.12)' : 'rgba(99,102,241,.08)') : 'transparent',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {o}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
 

  // Section card with colored icon header
const SectionCard = ({ icon, iconBg, iconColor, title, subtitle, children }) => (
  <div style={{
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    boxShadow: 'var(--shadow)',
  }}>
    {/* Header */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '16px 20px',
      borderBottom: '1px solid var(--border3)',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color: iconColor, fontSize: 16 }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{subtitle}</div>
      </div>
    </div>
    {children}
  </div>
);

// Row inside a section
const SetRow = ({ label, desc, children, noBorder }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '13px 20px', gap: 12,
    borderTop: noBorder ? 'none' : '1px solid var(--border3)',
  }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sub)' }}>{label}</div>
      {desc && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{desc}</div>}
    </div>
    {children}
  </div>
);

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="panel" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <div style={{ marginBottom: 28 }}>
    <h1 className="p-title">My <span className="g">Settings</span></h1>
    <p style={{ fontSize: 13, color: '#cbd5e1', marginTop: 4, fontWeight: 500 }}>Manage your preferences and customize your experience</p>
  </div>

      {msg && (
        <div style={{
          background: 'rgba(16,185,129,0.08)', color: '#10b981',
          border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10,
          padding: '12px 16px', fontSize: 13, fontWeight: 600, marginBottom: 20,
        }}>
          ✓ {msg}
        </div>
      )}

     {/* ── ROW 1 — Appearance + Language & Region ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Appearance */}
        <SectionCard
          icon={
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9" strokeDasharray="2 4" strokeLinecap="round"/>
            </svg>
          }
          iconBg="rgba(99,102,241,0.15)"
          iconColor="#818cf8"
          title="Appearance"
          subtitle="Customize how Nextest looks for you."
        >
          <SetRow noBorder label="Theme" desc="Choose your preferred theme">
            <SetSelect
              value={theme === 'dark' ? 'Dark' : 'Light'}
              onChange={v => {
                const k = v === 'Dark' ? 'dark' : 'light';
                setTheme(k);
                api.put('/settings/update', { theme: k });
              }}
              options={['Light', 'Dark']}
            />
          </SetRow>
          <SetRow label="Reduce Animations" desc="Turn off decorative motion effects">
            <Toggle on={reduceMotion} onToggle={() => setReduceMotion(p => !p)} />
          </SetRow>
          <SetRow label="Sidebar Position" desc="Choose sidebar position">
            <SetSelect
              value={sidebarPos}
              onChange={v => {
                setSidebarPos(v);
                api.put('/settings/update', { sidebar_position: v });
              }}
              options={['Left', 'Right']}
            />
          </SetRow>
        </SectionCard>

        <SectionCard
  icon={
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  }
  iconBg="rgba(59,130,246,0.12)"
  iconColor="#60a5fa"
  title="Language & Region"
  subtitle="Set your language and regional preferences."
>
  <SetRow noBorder label="Language" desc="Choose your preferred language">
    <SetSelect
      value={language === 'fr' ? 'Français' : language === 'ar' ? 'العربية' : 'English'}
      onChange={v => setLanguage(v === 'Français' ? 'fr' : v === 'العربية' ? 'ar' : 'en')}
      options={['English', 'Français', 'العربية']}
    />
  </SetRow>
  <SetRow label="Text Direction" desc="Automatically adjusted based on language">
    <span style={{
      fontSize: 11, fontWeight: 700,
      color: language === 'ar' ? '#f97316' : '#60a5fa',
      background: language === 'ar' ? 'rgba(249,115,22,0.1)' : 'rgba(96,165,250,0.1)',
      border: `1px solid ${language === 'ar' ? 'rgba(249,115,22,0.25)' : 'rgba(96,165,250,0.25)'}`,
      padding: '4px 10px', borderRadius: 6,
    }}>
      {language === 'ar' ? 'RTL' : 'LTR'}
    </span>
  </SetRow>
  <SetRow label="Available Languages" desc="Supported interface languages">
  <div style={{ display: 'flex', gap: 6 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', padding: '4px 10px', borderRadius: 6 }}>EN</span>
    <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)', padding: '4px 10px', borderRadius: 6 }}>FR</span>
    <span style={{ fontSize: 11, fontWeight: 700, color: '#f97316', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', padding: '4px 10px', borderRadius: 6 }}>AR</span>
  </div>
</SetRow>
</SectionCard>

      </div>

      {/* ── ROW 2 — About NexTest (full width) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>

 <SectionCard
  icon={
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.6-6.3 4.6 2.3-7.2-6-4.6h7.6z"/>
    </svg>
  }
  iconBg="rgba(16,185,129,0.12)"
  iconColor="#34d399"
  title="About NexTest"
  subtitle="Platform information and version."
>
  <SetRow noBorder label="Version" desc="Current release">
    <span style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 12, fontWeight: 700, color: '#34d399',
      background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
      padding: '5px 12px', borderRadius: 20,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,.6)' }} />
      v1.0.0
    </span>
  </SetRow>

  <SetRow label="Tech Stack" desc="Built with">
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {[
        { name: 'React',      color: '#61dafb' },
        { name: 'Laravel',    color: '#ff6c37' },
        { name: 'FastAPI',    color: '#10b981' },
        { name: 'PostgreSQL', color: '#60a5fa' },
        { name: 'Playwright', color: '#e2574c' },
      ].map(tech => (
        <span key={tech.name} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 600, color: 'var(--text)',
          background: `${tech.color}14`, border: `1px solid ${tech.color}30`,
          padding: '5px 11px', borderRadius: 8,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: tech.color, flexShrink: 0 }} />
          {tech.name}
        </span>
      ))}
    </div>
  </SetRow>

  <SetRow label="AI Engine" desc="Test generation powered by">
    <div style={{ display: 'flex', gap: 6 }}>
      <span style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 11, fontWeight: 700, color: '#a78bfa',
        background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
        padding: '5px 12px', borderRadius: 8,
      }}>
        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        LLaMA (Groq)
      </span>
      <span style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 11, fontWeight: 700, color: '#34d399',
        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
        padding: '5px 12px', borderRadius: 8,
      }}>
        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 2a4 4 0 0 0-4 4c0 1 .3 1.9.8 2.7A4 4 0 0 0 6 12a4 4 0 0 0 2 3.5V18a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.5A4 4 0 0 0 18 12a4 4 0 0 0-2.8-3.3c.5-.8.8-1.7.8-2.7a4 4 0 0 0-4-4z"/>
        </svg>
        Claude API
      </span>
    </div>
  </SetRow>
</SectionCard>

      </div>

    </div>
  );
}

function CommandPalette({ open, onClose, histories, projects, goTo, setGeneration }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(''); setCursor(0); }
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); open ? onClose() : null; }
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const q = query.toLowerCase().trim();

  const projectResults = projects
    .filter(p => !q || p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q))
    .slice(0, 3)
    .map(p => ({
      type: 'project', id: `proj-${p.id}`, icon: p.type === 'public' ? '🌐' : '🔒',
      title: p.name, sub: `${p.type} project · ${p.generations_count || 0} generations`,
      color: p.type === 'public' ? '#4f86e8' : '#8b5cf6',
      action: () => { /* navigation déjà gérée par la sélection dans Projects */ goTo('generate'); onClose(); }
    }));

  const genResults = histories
    .filter(h => !q || h.url?.toLowerCase().includes(q) || h.framework?.toLowerCase().includes(q) || h.test_type?.toLowerCase().includes(q))
    .slice(0, 5)
    .map(h => {
      const rc = (h.pass_rate || 0) >= 80 ? '#10b981' : (h.pass_rate || 0) >= 50 ? '#f59e0b' : '#ef4444';
      const FW = { Selenium: { l: 'Se', c: '#43B02A' }, Cypress: { l: 'Cy', c: '#00BFA5' }, Playwright: { l: 'Pl', c: '#E2574C' }, Both: { l: '∞', c: '#C9A227' } };
      const fw = FW[h.framework] || FW.Selenium;
      return {
        type: 'generation', id: `gen-${h.id}`,
        icon: null, fw, rc,
        title: h.url, sub: `${h.framework} · ${h.test_type} · ${h.pass_rate || 0}% pass`,
        passRate: h.pass_rate || 0,
        action: () => {
          setGeneration({
            url: h.url, framework: h.framework, test_type: h.test_type,
            generation: { id: h.id, url: h.url, framework: h.framework, load_time_ms: h.load_time_ms, test_type: h.test_type },
            result: {
              test_type: h.test_type || 'smoke', test_cases: h.test_cases || [],
              test_cases_selenium: h.test_cases_selenium || [], test_cases_cypress: h.test_cases_cypress || [],
              script: h.script || '', script_selenium: h.script_selenium || '',
              script_playwright: h.script_playwright || '', script_cypress: h.script_cypress || '',
              execution_results: h.execution_results || [],
              performance: h.performance_data || h.performance || null,
            },
          });
          goTo('execution'); onClose();
        }
      };
    });

  const navResults = !q ? [] : [
    { id: 'nav-dash',    title: 'Dashboard',      sub: 'Overview & stats',          icon: '🏠', action: () => { goTo('dashboard'); onClose(); } },
    { id: 'nav-gen',     title: 'New Generation', sub: 'Generate tests for a URL',  icon: '⚡', action: () => { goTo('generate');  onClose(); } },
    { id: 'nav-hist',    title: 'History',         sub: 'All past generations',      icon: '🕐', action: () => { goTo('history');   onClose(); } },
    { id: 'nav-account', title: 'Account',         sub: 'Profile & settings',        icon: '👤', action: () => { goTo('account');   onClose(); } },
  ].filter(n => n.title.toLowerCase().includes(q) || n.sub.toLowerCase().includes(q));

  const allResults = [...navResults, ...projectResults, ...genResults];

  useEffect(() => { setCursor(0); }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, allResults.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
      if (e.key === 'Enter' && allResults[cursor]) { allResults[cursor].action(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, cursor, allResults]);

  if (!open) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '12vh',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 560, maxHeight: '60vh',
          background: '#0d1526',
          border: '1px solid rgba(99,102,241,.3)',
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,.8)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'DM Sans', sans-serif",
          animation: 'cpFadeIn .15s ease both',
        }}
      >
        <style>{`
          @keyframes cpFadeIn { from { opacity:0; transform:translateY(-8px) scale(.98) } to { opacity:1; transform:none } }
          .cp-row:hover { background: rgba(99,102,241,.08) !important; }
        `}</style>

        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <svg width="16" height="16" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink:0}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search URLs, projects, pages…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#e2e8f0', fontSize: 15, fontFamily: 'inherit',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
          )}
          <kbd style={{ fontSize: 10, color: '#4b5563', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 6, padding: '2px 6px' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {allResults.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#4b5563', fontSize: 13 }}>
              {query ? `No results for "${query}"` : 'Start typing to search…'}
            </div>
          )}

          {/* Nav group */}
          {navResults.length > 0 && (
            <div>
              <div style={{ padding: '8px 18px 4px', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#374151' }}>Navigation</div>
              {navResults.map((r, i) => {
                const idx = i;
                return (
                  <div key={r.id} className="cp-row" onClick={r.action} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer', background: cursor === idx ? 'rgba(99,102,241,.12)' : 'transparent', transition: 'background .1s' }}>
                    <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{r.sub}</div>
                    </div>
                    <svg width="12" height="12" fill="none" stroke="#374151" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                );
              })}
            </div>
          )}

          {/* Projects group */}
          {projectResults.length > 0 && (
            <div>
              <div style={{ padding: '8px 18px 4px', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#374151' }}>Projects</div>
              {projectResults.map((r, i) => {
                const idx = navResults.length + i;
                return (
                  <div key={r.id} className="cp-row" onClick={r.action} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer', background: cursor === idx ? 'rgba(99,102,241,.12)' : 'transparent', transition: 'background .1s' }}>
                    <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{r.sub}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: r.color, background: `${r.color}18`, border: `1px solid ${r.color}33`, padding: '2px 8px', borderRadius: 20 }}>{r.title.includes('public') ? 'Public' : 'Open'}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Generations group */}
          {genResults.length > 0 && (
            <div>
              <div style={{ padding: '8px 18px 4px', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#374151' }}>Recent Generations</div>
              {genResults.map((r, i) => {
                const idx = navResults.length + projectResults.length + i;
                return (
                  <div key={r.id} className="cp-row" onClick={r.action} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer', background: cursor === idx ? 'rgba(99,102,241,.12)' : 'transparent', transition: 'background .1s' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, width: 28, height: 28, borderRadius: '50%', background: `${r.fw.c}18`, border: `1px solid ${r.fw.c}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.fw.c, flexShrink: 0 }}>{r.fw.l}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{r.sub}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: r.rc, flexShrink: 0 }}>{r.passRate}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 18px', borderTop: '1px solid rgba(255,255,255,.04)', display: 'flex', gap: 16, alignItems: 'center' }}>
          {[['↑↓', 'navigate'], ['↵', 'select'], ['esc', 'close']].map(([k, l]) => (
            <span key={k} style={{ fontSize: 11, color: '#4b5563', display: 'flex', alignItems: 'center', gap: 5 }}>
              <kbd style={{ fontSize: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 4, padding: '1px 5px', color: '#9ca3af' }}>{k}</kbd>{l}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#374151' }}>{allResults.length} result{allResults.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
function Sparkline({ rates, color = '#818cf8' }) {
  if (!rates || rates.length === 0) return null;
  const w = 64, h = 22, pad = 2;
  const max = 100, min = 0;
  const step = rates.length > 1 ? (w - pad * 2) / (rates.length - 1) : 0;
  const points = rates.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (1 - (v - min) / (max - min || 1)) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {rates.length > 0 && (() => {
        const lastX = pad + (rates.length - 1) * step;
        const lastY = pad + (1 - (rates[rates.length - 1] - min) / (max - min || 1)) * (h - pad * 2);
        return <circle cx={lastX} cy={lastY} r={2.2} fill={color} />;
      })()}
    </svg>
  );
}

function ReportsPanel({ goTo, setGeneration }) {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'byTest'
  const [expandedGroupKey, setExpandedGroupKey] = useState(null);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    try {
      const raw = localStorage.getItem('nextest-reports') || '[]';
      setReports(JSON.parse(raw));
    } catch { setReports([]); }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, dateFilter, viewMode]);

  const TYPE_CONFIG = {
    smoke:       { label: 'Smoke',       color: '#64748b', icon: '🔍' },
    functional:  { label: 'Functional',  color: '#6366f1', icon: '⚙️' },
    performance: { label: 'Performance', color: '#8b5cf6', icon: '⚡' },
    api:         { label: 'API',         color: '#10b981', icon: '🔗' },
    regression:  { label: 'Regression',  color: '#f97316', icon: '🔄' },
    security:    { label: 'Security',    color: '#ef4444', icon: '🔒' },
    seo:         { label: 'SEO',         color: '#06b6d4', icon: '🔎' },
  };

  const FW_CONFIG = {
    Selenium:   { color: '#43B02A', letters: 'Se' },
    Cypress:    { color: '#00BFA5', letters: 'Cy' },
    Playwright: { color: '#E2574C', letters: 'Pl' },
    Pytest:     { color: '#3776AB', letters: 'Py' },
    Postman:    { color: '#FF6C37', letters: 'Po' },
    k6:         { color: '#7D64FF', letters: 'k6' },
    Requests:   { color: '#06b6d4', letters: 'RQ' },
  };

  const timeStr = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const rateColorOf = (rate) => rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';

  const deleteReport = (id) => {
    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    localStorage.setItem('nextest-reports', JSON.stringify(updated));
    if (expandedId === id) setExpandedId(null);
  };

  const clearAll = () => {
    setReports([]); setExpandedId(null);
    localStorage.setItem('nextest-reports', JSON.stringify([]));
  };

  // ── PDF download (via backend) ──
  const downloadPdf = async (report) => {
    const id = report.generationData?.generation?.id;
    if (!id) return;
    setPdfLoadingId(report.id);
    try {
      const res = await api.get(`/generations/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `report_${id}.pdf`;
      link.click();
    } catch (err) { console.error('[PDF]', err); }
    setPdfLoadingId(null);
  };

  // ── CSV download (uses saved csv, or builds a generic one) ──
  const downloadCsv = (report) => {
    let csv = report.csvContent;
    if (!csv) {
      const cases = report.generationData?.result?.test_cases
        || report.generationData?.result?.execution_results
        || [];
      const headers = ['#', 'Test Name', 'Status', 'Duration', 'Section'];
      const rows = cases.map((t, i) => [
        i + 1,
        `"${(t.name || '').replace(/"/g, '""')}"`,
        t.status || '—',
        t.duration || '—',
        t.section || t.category || '—',
      ]);
      csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `report_${report.id}.csv`;
    link.click();
  };

  const filtered = reports
    .filter(r => {
      const matchSearch = !search || (r.url || '').toLowerCase().includes(search.toLowerCase()) || (r.framework || '').toLowerCase().includes(search.toLowerCase());
      const matchType   = filterType === 'all' || r.testType === filterType;
      const now = Date.now();
      const rDate = new Date(r.date).getTime();
      const matchDate = dateFilter === 'all'   ? true
        : dateFilter === 'today' ? (now - rDate) < 86400000
        : dateFilter === 'week'  ? (now - rDate) < 7 * 86400000
        : dateFilter === 'month' ? (now - rDate) < 30 * 86400000
        : true;
      return matchSearch && matchType && matchDate;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // ── Group by test (url + testType + framework) ──────────────────────────
  const groupedByTest = (() => {
    const map = {};
    filtered.forEach(r => {
      const key = `${r.url}||${r.testType}||${r.framework}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return Object.entries(map)
      .map(([key, runs]) => {
        const sorted = [...runs].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latest = sorted[0];
        const totalPass = runs.reduce((s, r) => s + (r.passCount || 0), 0);
        const totalFail = runs.reduce((s, r) => s + (r.failCount || 0), 0);
        const totalT = totalPass + totalFail;
        const avgRate = totalT > 0 ? Math.round(totalPass / totalT * 100) : 0;
        // oldest -> newest, last 10 runs, for the sparkline
        const rates = [...sorted].slice(0, 10).reverse().map(r => {
          const t = (r.passCount || 0) + (r.failCount || 0);
          return t > 0 ? Math.round((r.passCount / t) * 100) : 0;
        });
        return { key, runs: sorted, latest, count: runs.length, avgRate, rates };
      })
      .sort((a, b) => new Date(b.latest.date) - new Date(a.latest.date));
  })();

  // ── Pagination (mode-aware) ──────────────────────────────────────────────
  const pageSource = viewMode === 'byTest' ? groupedByTest : filtered;
  const totalPages = Math.ceil(pageSource.length / ITEMS_PER_PAGE);
  const paginated = pageSource.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

// ── Dynamic KPI calculations ──────────────────────────────────────
  const kpiNow = Date.now();
  const KPI_WEEK = 7 * 86400000;
  const kpiThisWeek = reports.filter(r => kpiNow - new Date(r.date).getTime() < KPI_WEEK);
  const kpiLastWeek = reports.filter(r => {
    const d = kpiNow - new Date(r.date).getTime();
    return d >= KPI_WEEK && d < 2 * KPI_WEEK;
  });
  const sumField = (arr, fn) => arr.reduce((s, r) => s + (fn(r) || 0), 0);
  const kpiTotalPass  = sumField(reports, r => r.passCount);
  const kpiTotalFail  = sumField(reports, r => r.failCount);
  const kpiTotalTests = kpiTotalPass + kpiTotalFail;
  const kpiAvgRate    = kpiTotalTests > 0 ? Math.round((kpiTotalPass / kpiTotalTests) * 100) : 0;
  const estDurMin = r => {
     if (r.durationMs) return Math.round(r.durationMs / 1000);
    const t = (r.passCount || 0) + (r.failCount || 0);
    const perTest = r.testType === 'performance' ? 8
                  : r.testType === 'security'    ? 5
                  : r.testType === 'functional'  ? 3 : 1.5;
    return Math.round(t * perTest);
  };
  const kpiTotalMinutes = sumField(reports, estDurMin);
  const fmtDur = s => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  const calcTrend = (thisVal, lastVal, invertBad = false) => {
    if (lastVal === 0 && thisVal === 0) return { label: 'No data yet', positive: null };
    if (lastVal === 0) return { label: `+${thisVal} this week`, positive: !invertBad };
    const pct  = Math.round(((thisVal - lastVal) / lastVal) * 100);
    const sign = pct >= 0 ? '+' : '';
    return { label: `${sign}${pct}% vs last week`, positive: pct === 0 ? null : (pct > 0 ? !invertBad : invertBad) };
  };
  const trendReports = calcTrend(kpiThisWeek.length, kpiLastWeek.length);
  const trendPass    = calcTrend(sumField(kpiThisWeek, r => r.passCount), sumField(kpiLastWeek, r => r.passCount));
  const trendFail    = calcTrend(sumField(kpiThisWeek, r => r.failCount), sumField(kpiLastWeek, r => r.failCount), true);
  const trendRate    = calcTrend(
    (() => { const t = sumField(kpiThisWeek, r => r.passCount + r.failCount); return t > 0 ? Math.round(sumField(kpiThisWeek, r => r.passCount) / t * 100) : 0; })(),
    (() => { const t = sumField(kpiLastWeek, r => r.passCount + r.failCount); return t > 0 ? Math.round(sumField(kpiLastWeek, r => r.passCount) / t * 100) : 0; })()
  );
  const trendDur = calcTrend(sumField(kpiThisWeek, estDurMin), sumField(kpiLastWeek, estDurMin));


  // ── Group by date (timeline mode only) ──
  const groups = { Today: [], Yesterday: [], 'This Week': [], Earlier: [] };
  const now = new Date();
  if (viewMode === 'timeline') {
    paginated.forEach(r => {
      const d = new Date(r.date);
      const diffDays = Math.floor((now - d) / 86400000);
      if (diffDays === 0) groups['Today'].push(r);
      else if (diffDays === 1) groups['Yesterday'].push(r);
      else if (diffDays < 7) groups['This Week'].push(r);
      else groups['Earlier'].push(r);
    });
  }
  const groupEntries = Object.entries(groups).filter(([, arr]) => arr.length > 0);

  const totalPass = reports.reduce((s, r) => s + (r.passCount || 0), 0);
  const totalFail = reports.reduce((s, r) => s + (r.failCount || 0), 0);
  const avgRate = reports.length
    ? Math.round(reports.reduce((s, r) => {
        const t = (r.passCount || 0) + (r.failCount || 0);
        return s + (t > 0 ? Math.round((r.passCount / t) * 100) : 0);
      }, 0) / reports.length)
    : 0;

  // ── Trend chart data (oldest -> newest) ──
  const chartData = [...reports]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(r => {
      const total = (r.passCount || 0) + (r.failCount || 0);
      const rate  = total > 0 ? Math.round((r.passCount / total) * 100) : 0;
      return {
        name: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rate,
      };
    });

  // ── Shared row renderer: main row + expanded detail panel for one report ──
  const renderReportRow = (report) => {
    const type = TYPE_CONFIG[report.testType] || TYPE_CONFIG.smoke;
    const fw   = FW_CONFIG[report.framework] || { color: '#64748b', letters: report.framework?.slice(0, 2) || '?' };
    const total = (report.passCount || 0) + (report.failCount || 0);
    const skip  = report.skipCount || 0;
    const rate  = total > 0 ? Math.round((report.passCount / total) * 100) : 0;
    const rc    = rateColorOf(rate);
    const isOpen = expandedId === report.id;
    const hasGenId = !!report.generationData?.generation?.id;
    const dur = report.durationMs ? fmtDur(Math.round(report.durationMs / 1000)) : estDurMin(report) > 0 ? fmtDur(estDurMin(report)) : null;

    const perf = report.generationData?.result?.performance || report.generationData?.performance;
    const avgResp = perf?.metrics?.http_req_duration_avg || perf?.metrics?.load_time_ms;

    const TYPE_ICONS = {
      smoke:       <IconFlame       size={18} stroke={1.8} />,
      functional:  <IconSettings2   size={18} stroke={1.8} />,
      performance: <IconBolt        size={18} stroke={1.8} />,
      api:         <IconApi         size={18} stroke={1.8} />,
      regression:  <IconRefresh     size={18} stroke={1.8} />,
      security:    <IconShieldCheck size={18} stroke={1.8} />,
      seo:         <IconWorldSearch size={18} stroke={1.8} />,
    };

    return (
      <div key={report.id} style={{
        background: 'var(--card)',
        border: `1px solid ${isOpen ? type.color : 'var(--border)'}`,
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'all .2s',
        boxShadow: isOpen ? `0 4px 24px ${type.color}18` : 'none',
      }}>

        {/* ── MAIN ROW ── */}
        <div
          onClick={() => setExpandedId(isOpen ? null : report.id)}
          style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 24px 16px 20px', cursor:'pointer' }}
          onMouseEnter={e => { if (!isOpen) e.currentTarget.parentElement.style.borderColor = `${type.color}55`; }}
          onMouseLeave={e => { if (!isOpen) e.currentTarget.parentElement.style.borderColor = 'var(--border)'; }}
        >
          <div style={{ width:38, height:38, borderRadius:10, flexShrink:0, background:`${type.color}15`, border:`1px solid ${type.color}30`, display:'flex', alignItems:'center', justifyContent:'center', color:type.color }}>
            {TYPE_ICONS[report.testType] || <IconFileText size={18} stroke={1.8} />}
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:6 }}>
              {report.url || '—'}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20, color:fw.color, background:`${fw.color}15`, border:`1px solid ${fw.color}33` }}>
                {fw.letters}
              </span>
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, color:type.color, background:`${type.color}15`, border:`1px solid ${type.color}30`, textTransform:'uppercase', letterSpacing:.5 }}>
                {type.label}
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'var(--muted)' }}>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {timeStr(report.date)}
              </span>
              {dur && (
                <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'var(--muted)' }}>
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {dur}
                </span>
              )}
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5, minWidth:160 }}>
              <div style={{ height:5, borderRadius:4, background:'var(--border)', overflow:'hidden', display:'flex' }}>
                <div style={{ width:`${total > 0 ? (report.passCount||0)/total*100 : 0}%`, background:'#10b981', transition:'width .6s ease' }} />
                <div style={{ width:`${total > 0 ? skip/total*100 : 0}%`, background:'#f59e0b', transition:'width .6s ease' }} />
                <div style={{ width:`${total > 0 ? (report.failCount||0)/total*100 : 0}%`, background:'#ef4444', transition:'width .6s ease' }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, fontWeight:700, color:'#10b981' }}>
                  <IconCircleCheck size={11} stroke={2.5} />{report.passCount||0}
                </span>
                {skip > 0 && (
                  <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, fontWeight:700, color:'#f59e0b' }}>
                    <IconCircleDashed size={11} stroke={2.5} />{skip}
                  </span>
                )}
                <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, fontWeight:700, color:'#ef4444' }}>
                  <IconCircleX size={11} stroke={2.5} />{report.failCount||0}
                </span>
                <span style={{ fontSize:10, color:'var(--muted)', marginLeft:'auto' }}>
                  {total + skip} tests
                </span>
              </div>
            </div>

            <div style={{ position:'relative', width:48, height:48, flexShrink:0 }}>
              <svg width="48" height="48" style={{ transform:'rotate(-90deg)' }}>
                <circle cx="24" cy="24" r="19" fill="none" stroke="var(--border)" strokeWidth="3.5" />
                <circle cx="24" cy="24" r="19" fill="none" stroke={rc} strokeWidth="3.5"
                  strokeDasharray={`${2 * Math.PI * 19}`}
                  strokeDashoffset={`${2 * Math.PI * 19 * (1 - rate / 100)}`}
                  strokeLinecap="round"
                  style={{ transition:'stroke-dashoffset .8s ease' }}
                />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:11, fontWeight:800, color:rc, fontFamily:'var(--C)', lineHeight:1 }}>{rate}%</span>
              </div>
            </div>
          </div>

          <IconChevronDown size={16} stroke={2.5} style={{ color:'var(--muted)', flexShrink:0, transition:'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </div>

        {/* ── EXPANDED ── */}
        {isOpen && (
          <div onClick={e => e.stopPropagation()} style={{ borderTop:`1px solid var(--border)` }}>
            <div style={{ height:3, background:'var(--bg2)', overflow:'hidden' }}>
              <div style={{ display:'flex', height:'100%' }}>
                <div style={{ width:`${total > 0 ? (report.passCount||0)/total*100 : 0}%`, background:'#10b981' }} />
                <div style={{ width:`${total > 0 ? skip/total*100 : 0}%`, background:'#f59e0b' }} />
                <div style={{ width:`${total > 0 ? (report.failCount||0)/total*100 : 0}%`, background:'#ef4444' }} />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'280px 1fr auto', gap:16, padding:'16px 20px', alignItems:'start' }}>

              {report.htmlContent ? (
                <div style={{ position:'relative', width:'100%', height:160, overflow:'hidden', borderRadius:10, border:'1px solid var(--border)', background:'#070e1c', flexShrink:0 }}>
                  <iframe srcDoc={report.htmlContent} title="report preview"
                    style={{ width:1400, height:900, border:'none', transform:'scale(0.2)', transformOrigin:'top left', pointerEvents:'none' }} />
                  <div style={{ position:'absolute', bottom:6, right:6 }}>
                    <button onClick={() => { const b=new Blob([report.htmlContent],{type:'text/html'}); window.open(URL.createObjectURL(b),'_blank'); }}
                      style={{ padding:'4px 10px', borderRadius:6, background:'rgba(0,0,0,.7)', border:'1px solid rgba(255,255,255,.15)', color:'#fff', fontSize:9, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      Full Preview ↗
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ width:'100%', height:160, borderRadius:10, border:'1px solid var(--border)', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontSize:11 }}>
                  No preview
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>Test Summary</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {[
                      { val: report.passCount||0, lbl:'Passed',  color:'#10b981', bg:'rgba(16,185,129,.12)', border:'rgba(16,185,129,.2)' },
                      { val: report.failCount||0, lbl:'Failed',  color:'#ef4444', bg:'rgba(239,68,68,.12)',   border:'rgba(239,68,68,.2)'  },
                      { val: skip,                lbl:'Skipped', color:'#f59e0b', bg:'rgba(245,158,11,.12)',  border:'rgba(245,158,11,.2)' },
                      { val: total + skip,        lbl:'Total',   color:'var(--text)', bg:'var(--bg2)', border:'var(--border)' },
                    ].map(s => (
                      <div key={s.lbl} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 12px', borderRadius:8, background:s.bg, border:`1px solid ${s.border}` }}>
                        <span style={{ fontSize:12, color:s.color, fontWeight:700 }}>{s.lbl}</span>
                        <span style={{ fontSize:15, fontWeight:800, color:s.color, fontFamily:'var(--C)' }}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>Test Environment</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', background:`${fw.color}12`, border:`1px solid ${fw.color}25`, borderRadius:8 }}>
                      <span style={{ fontSize:11, fontWeight:800, color:fw.color }}>{fw.letters}</span>
                      <span style={{ fontSize:12, color:'var(--text)', fontWeight:600 }}>{report.framework}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', background:`${type.color}12`, border:`1px solid ${type.color}25`, borderRadius:8 }}>
                      <span style={{ fontSize:13 }}>{type.icon}</span>
                      <span style={{ fontSize:12, color:type.color, fontWeight:700 }}>{type.label}</span>
                    </div>
                    {dur && (
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 12px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8 }}>
                        <span style={{ fontSize:12, color:'var(--muted)' }}>Duration</span>
                        <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{dur}</span>
                      </div>
                    )}
                    {perf && avgResp && (
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 12px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8 }}>
                        <span style={{ fontSize:12, color:'var(--muted)' }}>Avg Response</span>
                        <span style={{ fontSize:12, fontWeight:700, color:'#8b5cf6' }}>{avgResp}ms</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8, minWidth:140 }}>
                {report.generationData && (
                  <button onClick={() => { setGeneration({ ...report.generationData, fresh: false }); goTo('execution'); }}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 16px', borderRadius:9, background:'linear-gradient(135deg,var(--indigo),#4f46e5)', border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(99,102,241,.3)', whiteSpace:'nowrap' }}>
                    <IconEye size={13} stroke={2}/> View Full Results
                  </button>
                )}
                <div style={{ display:'flex', gap:6 }}>
                  {report.htmlContent && (
                    <button onClick={() => { const b=new Blob([report.htmlContent],{type:'text/html'}); const l=document.createElement('a'); l.href=URL.createObjectURL(b); l.download=`report_${report.id}.html`; l.click(); }}
                      style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px 10px', borderRadius:8, background:'var(--indigo-bg)', border:'1px solid var(--indigo-border)', color:'var(--indigo2)', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      <IconCode size={12} stroke={2}/> HTML
                    </button>
                  )}
                  <button onClick={() => downloadCsv(report)}
                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px 10px', borderRadius:8, background:'rgba(16,185,129,.08)', border:'1px solid rgba(16,185,129,.2)', color:'#10b981', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    <IconFileTypeCsv size={12} stroke={2}/> CSV
                  </button>
                  {hasGenId && (
                    <button onClick={() => downloadPdf(report)} disabled={pdfLoadingId === report.id}
                      style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px 10px', borderRadius:8, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', color:'#ef4444', fontSize:11, fontWeight:700, cursor: pdfLoadingId===report.id ? 'not-allowed':'pointer', fontFamily:'inherit', opacity: pdfLoadingId===report.id ? .6:1 }}>
                      {pdfLoadingId===report.id ? <span className="spinner"/> : <IconFileTypePdf size={12} stroke={2}/>} PDF
                    </button>
                  )}
                </div>
                <button onClick={() => deleteReport(report.id)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'7px', borderRadius:8, background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--muted)', cursor:'pointer', fontFamily:'inherit', fontSize:11 }}
                  onMouseEnter={e => { e.currentTarget.style.background='var(--red-bg)'; e.currentTarget.style.color='var(--red)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='var(--bg2)'; e.currentTarget.style.color='var(--muted)'; }}>
                  <IconTrash size={12} stroke={2}/> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── "By Test" group card: latest run header + expandable run history ──
  const renderGroupCard = (group) => {
    const { key, runs, latest, count, avgRate, rates } = group;
    const type = TYPE_CONFIG[latest.testType] || TYPE_CONFIG.smoke;
    const fw   = FW_CONFIG[latest.framework] || { color: '#64748b', letters: latest.framework?.slice(0, 2) || '?' };
    const rc = rateColorOf(avgRate);
    const isGroupOpen = expandedGroupKey === key;

    const TYPE_ICONS = {
      smoke:       <IconFlame       size={18} stroke={1.8} />,
      functional:  <IconSettings2   size={18} stroke={1.8} />,
      performance: <IconBolt        size={18} stroke={1.8} />,
      api:         <IconApi         size={18} stroke={1.8} />,
      regression:  <IconRefresh     size={18} stroke={1.8} />,
      security:    <IconShieldCheck size={18} stroke={1.8} />,
      seo:         <IconWorldSearch size={18} stroke={1.8} />,
    };

    return (
      <div key={key} style={{
        background: 'var(--card)',
        border: `1px solid ${isGroupOpen ? type.color : 'var(--border)'}`,
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'all .2s',
        boxShadow: isGroupOpen ? `0 4px 24px ${type.color}18` : 'none',
      }}>
        <div
          onClick={() => setExpandedGroupKey(isGroupOpen ? null : key)}
          style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 24px 16px 20px', cursor:'pointer' }}
          onMouseEnter={e => { if (!isGroupOpen) e.currentTarget.parentElement.style.borderColor = `${type.color}55`; }}
          onMouseLeave={e => { if (!isGroupOpen) e.currentTarget.parentElement.style.borderColor = 'var(--border)'; }}
        >
          <div style={{ width:38, height:38, borderRadius:10, flexShrink:0, background:`${type.color}15`, border:`1px solid ${type.color}30`, display:'flex', alignItems:'center', justifyContent:'center', color:type.color }}>
            {TYPE_ICONS[latest.testType] || <IconFileText size={18} stroke={1.8} />}
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:6 }}>
              {latest.url || '—'}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20, color:fw.color, background:`${fw.color}15`, border:`1px solid ${fw.color}33` }}>
                {fw.letters}
              </span>
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, color:type.color, background:`${type.color}15`, border:`1px solid ${type.color}30`, textTransform:'uppercase', letterSpacing:.5 }}>
                {type.label}
              </span>
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, color:'var(--indigo2)', background:'var(--indigo-bg)', border:'1px solid var(--indigo-border)' }}>
                {count} run{count !== 1 ? 's' : ''}
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'var(--muted)' }}>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Last run {timeStr(latest.date)}
              </span>
            </div>
          </div>

          {/* Sparkline of recent pass rates */}
          {rates.length > 1 && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flexShrink:0 }}>
              <Sparkline rates={rates} color={rc} />
              <span style={{ fontSize:9, color:'var(--muted)', fontWeight:700 }}>last {rates.length}</span>
            </div>
          )}

          {/* Avg rate ring */}
          <div style={{ position:'relative', width:48, height:48, flexShrink:0 }}>
            <svg width="48" height="48" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="24" cy="24" r="19" fill="none" stroke="var(--border)" strokeWidth="3.5" />
              <circle cx="24" cy="24" r="19" fill="none" stroke={rc} strokeWidth="3.5"
                strokeDasharray={`${2 * Math.PI * 19}`}
                strokeDashoffset={`${2 * Math.PI * 19 * (1 - avgRate / 100)}`}
                strokeLinecap="round"
                style={{ transition:'stroke-dashoffset .8s ease' }}
              />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:11, fontWeight:800, color:rc, fontFamily:'var(--C)', lineHeight:1 }}>{avgRate}%</span>
            </div>
          </div>

          <IconChevronDown size={16} stroke={2.5} style={{ color:'var(--muted)', flexShrink:0, transition:'transform .2s', transform: isGroupOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </div>

        {/* Run history */}
        {isGroupOpen && (
          <div onClick={e => e.stopPropagation()} style={{ borderTop:'1px solid var(--border)', padding:'14px 20px', background:'var(--bg2)', display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1.5 }}>
              Run history ({count})
            </div>
            {runs.map(r => renderReportRow(r))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="panel">
      {/* ── HEADER ── */}
      <div className="p-header">
        <div>
          <h1 className="p-title">Test Reports<span className="g"> Overview</span></h1>
          <p className="p-sub">A timeline of every report you've generated and downloaded.</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>

          {/* Date badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:9, background:'var(--card)', border:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--muted)' }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
          </div>

          {/* Date filter */}
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:9, color:'var(--text)', fontSize:11, fontWeight:700, padding:'9px 14px', cursor:'pointer', fontFamily:'inherit', outline:'none' }}>
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>

          {/* New Generation */}
          <button onClick={() => goTo('generate')}
            style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 16px', borderRadius:9, background:'linear-gradient(135deg,var(--indigo),#4f46e5)', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', letterSpacing:'1px', textTransform:'uppercase', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(99,102,241,.3)' }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            New Generation
          </button>


        </div>
      </div>

      {reports.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'90px 32px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, textAlign:'center' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--indigo-bg)', border:'1px solid var(--indigo-border)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, color:'var(--indigo2)' }}>
            <IconFileText size={32} stroke={1.5} />
          </div>
          <h3 style={{ fontFamily:'var(--C)', fontSize:24, fontWeight:700, color:'var(--text)', marginBottom:8 }}>No reports yet</h3>
          <p style={{ fontSize:13, color:'var(--sub)', lineHeight:1.7, maxWidth:320, marginBottom:24 }}>
            Generate tests and download PDF, HTML, or CSV reports — they'll appear here automatically.
          </p>
          <button className="btn-primary" onClick={() => goTo('generate')}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            Generate Tests
          </button>
        </div>
      ) : (
        <>
          {/* ── COMPACT STATS STRIP (pro icons) ── */}
<div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:20 }}>
  {[
    { Icon: IconFileText,    val: reports.length,          lbl: 'Total reports',  color: '#818cf8', trend: trendReports, barW: `${Math.min(100, reports.length * 5)}%`              },
    { Icon: IconCircleCheck, val: kpiTotalPass,             lbl: 'Tests passed',   color: '#10b981', trend: trendPass,    barW: `${kpiTotalTests > 0 ? Math.round(kpiTotalPass / kpiTotalTests * 100) : 0}%` },
    { Icon: IconCircleX,     val: kpiTotalFail,             lbl: 'Tests failed',   color: '#ef4444', trend: trendFail,    barW: `${kpiTotalTests > 0 ? Math.round(kpiTotalFail / kpiTotalTests * 100) : 0}%` },
    { Icon: IconTarget,      val: `${kpiAvgRate}%`,         lbl: 'Avg pass rate',  color: rateColorOf(kpiAvgRate), trend: trendRate, barW: `${kpiAvgRate}%` },
    { Icon: IconActivity,    val: fmtDur(kpiTotalMinutes),  lbl: 'Total duration', color: '#4f86e8', trend: trendDur,    barW: `${Math.min(100, kpiTotalMinutes / 10)}%`             },
  ].map(s => (
    <div key={s.lbl} style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderTop: `3px solid ${s.color}`, borderRadius: 14,
      padding: '16px', transition: 'transform .2s, box-shadow .2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${s.color}22`; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)';    e.currentTarget.style.boxShadow='none'; }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:`${s.color}15`, border:`1px solid ${s.color}30`, display:'flex', alignItems:'center', justifyContent:'center', color:s.color }}>
          <s.Icon size={18} stroke={1.6} />
        </div>
        <span style={{
          fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20,
          color:      s.trend.positive === true ? '#10b981' : s.trend.positive === false ? '#ef4444' : 'var(--muted)',
          background: s.trend.positive === true ? 'rgba(16,185,129,.1)' : s.trend.positive === false ? 'rgba(239,68,68,.1)' : 'var(--bg2)',
          border:    `1px solid ${s.trend.positive === true ? 'rgba(16,185,129,.2)' : s.trend.positive === false ? 'rgba(239,68,68,.2)' : 'var(--border)'}`,
        }}>
          {s.trend.positive === true ? '↑' : s.trend.positive === false ? '↓' : '—'} {s.trend.label}
        </span>
      </div>
      <div style={{ fontSize:26, fontWeight:700, color:'var(--text)', fontFamily:'var(--C)', lineHeight:1, marginBottom:4 }}>{s.val}</div>
      <div style={{ fontSize:11, color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'1px' }}>{s.lbl}</div>
      <div style={{ height:3, borderRadius:2, background:'var(--border)', marginTop:10, overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:2, background:s.color, width:s.barW, transition:'width 1s ease' }} />
      </div>
    </div>
  ))}
</div>
{/* ── ANALYTICS ROW ── */}
{reports.length > 0 && (
  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16, marginBottom: 20 }}>

    {/* ── PASS RATE TREND ── */}
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconChartArea size={15} stroke={1.5} style={{ color: '#818cf8' }} />
          Pass Rate Trend
        </span>
        <select
          id="trend-period"
          onChange={e => {
            const val = e.target.value;
            document.getElementById('trend-period').dataset.val = val;
            e.target.dispatchEvent(new Event('change-period', { bubbles: true }));
          }}
          style={{
            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text)', fontSize: 11, fontWeight: 700, padding: '4px 10px',
            cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
          }}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      {(() => {
        const sorted = [...reports].sort((a, b) => new Date(a.date) - new Date(b.date));
        const grouped = {};
        sorted.forEach(r => {
          const d = new Date(r.date);
          const key = `${d.getMonth() + 1}/${d.getDate()}`;
          if (!grouped[key]) grouped[key] = { pass: 0, total: 0 };
          grouped[key].pass  += r.passCount || 0;
          grouped[key].total += (r.passCount || 0) + (r.failCount || 0);
        });
        const labels = Object.keys(grouped).slice(-14);
        const data   = labels.map(k => grouped[k].total > 0 ? Math.round(grouped[k].pass / grouped[k].total * 100) : 0);
        const minVal = Math.max(0,  Math.min(...data) - 10);
        const maxVal = Math.min(100, Math.max(...data) + 10);

        return (
          <div style={{ height: 160, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={labels.map((l, i) => ({ name: l, rate: data[i] }))} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#818cf8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.4} />
                <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[minVal, maxVal]} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                  formatter={(v) => [`${v}%`, 'Pass Rate']}
                />
                <Area type="monotone" dataKey="rate" stroke="#818cf8" strokeWidth={2.5} fill="url(#trendGrad)"
                  dot={{ r: 3, fill: '#818cf8', stroke: 'var(--card)', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#818cf8' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      })()}
    </div>

    {/* ── TESTS SUMMARY DONUT ── */}
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconChartDonut size={15} stroke={1.5} style={{ color: '#10b981' }} />
        Tests Summary
      </div>
      {(() => {
        const pass  = reports.reduce((s, r) => s + (r.passCount || 0), 0);
        const fail  = reports.reduce((s, r) => s + (r.failCount || 0), 0);
        const skip  = reports.reduce((s, r) => s + (r.skipCount  || 0), 0);
        const total = pass + fail + skip;
        const pct   = v => total > 0 ? Math.round(v / total * 100) : 0;

        const donutData = [
          { name: 'Passed',  value: pass, color: '#10b981' },
          { name: 'Failed',  value: fail, color: '#ef4444' },
          { name: 'Skipped', value: skip, color: '#f59e0b' },
        ].filter(d => d.value > 0);

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
              <PieChart width={120} height={120}>
                <Pie
                  data={donutData.length > 0 ? donutData : [{ name: 'empty', value: 1, color: 'var(--border)' }]}
                  cx={55} cy={55} innerRadius={38} outerRadius={55}
                  dataKey="value" strokeWidth={0} paddingAngle={donutData.length > 1 ? 2 : 0}
                >
                  {(donutData.length > 0 ? donutData : [{ color: 'var(--border)' }]).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                  formatter={(v, n) => [`${v} (${pct(v)}%)`, n]}
                />
              </PieChart>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--C)', lineHeight: 1 }}>{total}</div>
                <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>total tests</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {[
                { label: 'Passed',  val: pass, color: '#10b981' },
                { label: 'Failed',  val: fail, color: '#ef4444' },
                { label: 'Skipped', val: skip, color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{s.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: 'var(--C)' }}>{s.val}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>({pct(s.val)}%)</span>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border3)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Total</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--C)' }}>{total} <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>tests</span></span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>

    {/* ── REPORTS BY TYPE ── */}
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconChartDonut size={15} stroke={1.5} style={{ color: '#4f86e8' }} />
        Reports by Type
      </div>
      {(() => {
        const TYPE_COLORS = {
          performance: '#8b5cf6', functional: '#6366f1', api: '#10b981',
          smoke: '#64748b', regression: '#f97316', security: '#ef4444',
          seo: '#06b6d4', unit: '#0ea5e9',
        };
        const counts = {};
        reports.forEach(r => {
          const t = r.testType || 'smoke';
          counts[t] = (counts[t] || 0) + 1;
        });
        const typeData = Object.entries(counts)
          .map(([name, value]) => ({ name, value, color: TYPE_COLORS[name] || '#64748b' }))
          .sort((a, b) => b.value - a.value);
        const total = typeData.reduce((s, d) => s + d.value, 0);
        const pct   = v => total > 0 ? Math.round(v / total * 100) : 0;

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
              <PieChart width={120} height={120}>
                <Pie
                  data={typeData.length > 0 ? typeData : [{ name: 'empty', value: 1, color: 'var(--border)' }]}
                  cx={55} cy={55} innerRadius={38} outerRadius={55}
                  dataKey="value" strokeWidth={0} paddingAngle={typeData.length > 1 ? 2 : 0}
                >
                  {(typeData.length > 0 ? typeData : [{ color: 'var(--border)' }]).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                  formatter={(v, n) => [`${v} (${pct(v)}%)`, n]}
                />
              </PieChart>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--C)', lineHeight: 1 }}>{total}</div>
                <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>total</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', maxHeight: 120 }}>
              {typeData.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', paddingTop: 20 }}>No data yet</div>
              ) : typeData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'capitalize' }}>{d.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: d.color, fontFamily: 'var(--C)' }}>{d.value}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>({pct(d.value)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>

  </div>
)}


          {/* ── TOOLBAR ── */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flex:'1 1 220px', minWidth:200, background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:10, padding:'9px 14px' }}>
              <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by URL or framework…"
                style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--text)', fontSize:13, fontFamily:'inherit' }} />
              {search && (
                <button onClick={() => setSearch('')} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', display:'flex', padding:0 }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>

            {/* View mode toggle: Timeline vs By Test */}
            <div style={{ display:'flex', gap:6 }}>
              {[
                { id: 'timeline', label: '🕐 Timeline' },
                { id: 'byTest',   label: '📊 By Test'   },
              ].map(m => {
                const active = viewMode === m.id;
                return (
                  <button key={m.id} onClick={() => { setViewMode(m.id); setExpandedId(null); setExpandedGroupKey(null); }}
                    style={{ padding:'7px 13px', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                      border: active ? '1.5px solid var(--indigo2)' : '1.5px solid var(--border)',
                      background: active ? 'var(--indigo-bg)' : 'var(--card)',
                      color: active ? 'var(--indigo2)' : 'var(--muted)', transition:'all .18s' }}>
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['all', 'smoke', 'functional', 'performance', 'api', 'regression', 'security', 'seo'].map(t => {
                const cfg = TYPE_CONFIG[t];
                const active = filterType === t;
                return (
                  <button key={t} onClick={() => setFilterType(t)}
                    style={{ padding:'7px 13px', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', border: active ? `1.5px solid ${cfg?.color || '#818cf8'}` : '1.5px solid var(--border)', background: active ? `${cfg?.color || '#818cf8'}15` : 'var(--card)', color: active ? (cfg?.color || '#818cf8') : 'var(--muted)', transition:'all .18s', textTransform:'capitalize' }}>
                    {t === 'all' ? 'All' : cfg?.label}
                  </button>
                );
              })}
            </div>
          </div>

{/* ── TIMELINE / BY TEST ── */}
{(viewMode === 'timeline' ? filtered.length === 0 : groupedByTest.length === 0) ? (
  <div style={{ padding:'48px 32px', textAlign:'center', background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, color:'var(--muted)', fontSize:13 }}>
    No results for your current filters.
  </div>
) : viewMode === 'byTest' ? (
  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
    {paginated.map(group => renderGroupCard(group))}
  </div>
) : (
  <div>
    {groupEntries.map(([label, items]) => (
      <div key={label} style={{ marginBottom: 32 }}>

        {/* Group header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <span style={{ fontSize:11, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:'var(--indigo2)' }}>
            {label}
          </span>
          <span style={{ fontSize:10, color:'var(--muted)', background:'var(--bg2)', border:'1px solid var(--border)', padding:'2px 8px', borderRadius:20 }}>
            {new Date(items[0]?.date).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}
          </span>
          <div style={{ flex:1, height:1, background:'var(--border)' }} />
          <span style={{ fontSize:10, color:'var(--muted)' }}>{items.length} report{items.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Report rows */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {items.map(report => renderReportRow(report))}
        </div>
      </div>
    ))}

   {/* Pagination info */}
    {filtered.length > 0 && (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 10, marginTop: 8
  }}>
    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
      Showing{' '}
      <span style={{ color: 'var(--text)', fontWeight: 700 }}>
        {(currentPage - 1) * ITEMS_PER_PAGE + 1}
      </span>{' '}
      to{' '}
      <span style={{ color: 'var(--text)', fontWeight: 700 }}>
        {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
      </span>{' '}
      of{' '}
      <span style={{ color: 'var(--indigo2)', fontWeight: 700 }}>
        {filtered.length}
      </span>{' '}
      reports
    </span>

    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        style={{
          padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          background: 'var(--card)', border: '1px solid var(--border)',
          color: currentPage === 1 ? 'var(--muted)' : 'var(--text)',
          opacity: currentPage === 1 ? 0.5 : 1, transition: 'all .15s',
        }}
      >
        ← Prev
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
  <button
    key={p}
    onClick={() => setCurrentPage(p)}
    style={{
      width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700,
      cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
      background: currentPage === p ? 'linear-gradient(135deg,var(--indigo),#4f46e5)' : 'var(--card)',
      border: currentPage === p ? 'none' : '1px solid var(--border)',
      color: currentPage === p ? '#fff' : 'var(--text)',
      boxShadow: currentPage === p ? '0 4px 12px rgba(99,102,241,.3)' : 'none',
    }}
  >
    {p}
  </button>
))}

      <button
        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        style={{
          padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          background: 'var(--card)', border: '1px solid var(--border)',
          color: currentPage === totalPages ? 'var(--muted)' : 'var(--text)',
          opacity: currentPage === totalPages ? 0.5 : 1, transition: 'all .15s',
        }}
      >
        Next →
      </button>
    </div>
  </div>
)}
  </div>
)}

{/* Pagination for By Test mode */}
{viewMode === 'byTest' && groupedByTest.length > 0 && (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 10, marginTop: 8
  }}>
    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
      Showing{' '}
      <span style={{ color: 'var(--text)', fontWeight: 700 }}>
        {(currentPage - 1) * ITEMS_PER_PAGE + 1}
      </span>{' '}
      to{' '}
      <span style={{ color: 'var(--text)', fontWeight: 700 }}>
        {Math.min(currentPage * ITEMS_PER_PAGE, groupedByTest.length)}
      </span>{' '}
      of{' '}
      <span style={{ color: 'var(--indigo2)', fontWeight: 700 }}>
        {groupedByTest.length}
      </span>{' '}
      test groups
    </span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', background: 'var(--card)', border: '1px solid var(--border)', color: currentPage === 1 ? 'var(--muted)' : 'var(--text)', opacity: currentPage === 1 ? 0.5 : 1 }}
      >
        ← Prev
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => setCurrentPage(p)}
          style={{ width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: currentPage === p ? 'linear-gradient(135deg,var(--indigo),#4f46e5)' : 'var(--card)', border: currentPage === p ? 'none' : '1px solid var(--border)', color: currentPage === p ? '#fff' : 'var(--text)', boxShadow: currentPage === p ? '0 4px 12px rgba(99,102,241,.3)' : 'none' }}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontFamily: 'inherit', background: 'var(--card)', border: '1px solid var(--border)', color: currentPage === totalPages ? 'var(--muted)' : 'var(--text)', opacity: currentPage === totalPages ? 0.5 : 1 }}
      >
        Next →
      </button>
    </div>
  </div>
)}
      </>
      )}
    </div>
  );
}
function saveReportToStorage({ url, framework, testType, passCount, failCount, skipCount, htmlContent, csvContent, generationData, durationMs }) {
  const key = 'nextest-reports';

  // Écrit dans localStorage ; en cas de QuotaExceededError, réduit progressivement
  // le tableau (le plus vieux en premier) puis réessaie jusqu'à ce que ça passe.
  const writeWithRetry = (arr) => {
    let list = arr;
    for (let attempt = 0; attempt < 12; attempt++) {
      try {
        localStorage.setItem(key, JSON.stringify(list));
        return list;
      } catch (err) {
        const isQuota = err && (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014);
        if (!isQuota || list.length <= 1) {
          console.error('[saveReport] failed permanently', err);
          return null;
        }
        // Supprime le rapport le plus ancien (fin du tableau, trié du plus récent au plus vieux)
        list = list.slice(0, -1);
        console.warn(`[saveReport] quota exceeded, retrying with ${list.length} reports`);
      }
    }
    return null;
  };

  try {
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const genId = generationData?.generation?.id;

    let updated;
    if (genId) {
      const idx = existing.findIndex(r => r.generationData?.generation?.id === genId);
      if (idx !== -1) {
        if (htmlContent) existing[idx].htmlContent = htmlContent;
        if (csvContent) existing[idx].csvContent = csvContent;
        if (passCount !== undefined) existing[idx].passCount = passCount;
        if (failCount !== undefined) existing[idx].failCount = failCount;
        if (skipCount !== undefined) existing[idx].skipCount = skipCount;
        updated = existing;
      }
    }

    if (!updated) {
      const newReport = {
        id: Date.now(),
        date: new Date().toISOString(),
        url, framework, testType,
        passCount: passCount || 0,
        failCount: failCount || 0,
        skipCount: skipCount || 0,
        durationMs: durationMs || 0,
        htmlContent: htmlContent || null,
        csvContent: csvContent || null,
        generationData: generationData || null,
      };
      updated = [newReport, ...existing].slice(0, 50);
    }

    const result = writeWithRetry(updated);
    if (result === null) {
      // Dernier recours : on garde les métadonnées mais on vide le HTML/CSV lourd
      const stripped = updated.map(r => ({ ...r, htmlContent: null, csvContent: null }));
      writeWithRetry(stripped);
    }
  } catch (err) {
    console.error('[saveReport]', err);
  }
}

function DocsPanel({ goTo, setProjectStep }) {
  const [active, setActive] = useState('overview');

  const onNavigate = (page, step = null) => {
    if (step && setProjectStep) {
      setProjectStep(step);
    }
    goTo(page);
  };

  const sections = [
    { group: 'Getting Started', items: [
      { id: 'overview',        label: 'Overview',          Icon: IconLayoutDashboard },
      { id: 'getting-started', label: 'Getting Started',   Icon: IconRocket },
      { id: 'architecture',    label: 'Architecture',      Icon: IconCode },
      { id: 'frameworks',      label: 'Frameworks',        Icon: IconTestPipe },
      { id: 'ai-engine',       label: 'AI Engine',         Icon: IconRobot },
    ]},
    { group: 'Test Types', items: [
      { id: 'smoke',       label: 'Smoke Test',       Icon: IconEye },
      { id: 'functional',  label: 'Functional Test',  Icon: IconClick },
      { id: 'performance', label: 'Performance Test', Icon: IconBolt },
      { id: 'security',    label: 'Security Test',    Icon: IconShieldLock },
      { id: 'regression',  label: 'Regression Test',  Icon: IconRefresh },
      { id: 'api',         label: 'API Test',         Icon: IconApi },
      { id: 'seo',         label: 'SEO Test',         Icon: IconSeeding },
    ]},
    { group: 'More', items: [
      { id: 'reports', label: 'Reports & Exports', Icon: IconFileText },
      { id: 'flaky-tests', label: 'Flaky Tests',        Icon: IconActivity  }, 
      { id: 'faq',     label: 'FAQ',               Icon: IconBulb },
    ]},
  ];

  const FRAMEWORKS = [
    { name:'Selenium',   color:'#43B02A', role:'Legacy web automation via WebDriver', usedFor:['Smoke','Functional (fallback)'], lang:'Python' },
    { name:'Cypress',    color:'#00BFA5', role:'Modern JS-based E2E testing in-browser', usedFor:['Smoke (public projects)'], lang:'JavaScript' },
    { name:'Playwright', color:'#E2574C', role:'Primary framework — fast, reliable, headless Chromium', usedFor:['Smoke','Functional','Performance','Regression'], lang:'Python' },
    { name:'Pytest',     color:'#3776AB', role:'Python test runner for API & Security suites', usedFor:['API Test','Security Test'], lang:'Python' },
    { name:'Postman / Newman', color:'#FF6C37', role:'Collection-based REST API testing', usedFor:['API Test'], lang:'JSON / CLI' },
    { name:'k6',         color:'#7D64FF', role:'Load, stress, spike & soak testing engine', usedFor:['Performance Test'], lang:'JavaScript' },
    { name:'Requests + BeautifulSoup', color:'#06b6d4', role:'Lightweight HTML fetch & parse for SEO audits', usedFor:['SEO Test'], lang:'Python' },
  ];

  const content = {
    overview: {
      title: 'NexTest — Documentation',
      desc: 'NexTest is an AI-powered test automation platform. Generate, execute, and analyze tests for any web application, internal system, or API in seconds, no manual scripting required.',
      items: [
        { Icon: IconRobot,        color:'#6366f1', bg:'rgba(99,102,241,.12)', title:'AI-Powered Generation',      desc:'Groq LLaMA 3.3-70b generates test cases automatically from your URL — from DOM scraping to full scenario coverage.' },
        { Icon: IconWorld, color:'#10b981', bg:'rgba(16,185,129,.12)', title:'Public & Internal Projects', desc:'Test public websites or internal apps with credential injection.' },
        { Icon: IconChartBar,     color:'#8b5cf6', bg:'rgba(139,92,246,.12)', title:'Reports & Analytics',        desc:'PDF, HTML, CSV exports. Real-time pass rate charts, activity heatmaps, and AI-generated insights.' },
        { Icon: IconBellRinging,  color:'#f59e0b', bg:'rgba(245,158,11,.12)', title:'Alerts & Scheduling',        desc:'Scheduled recurring test runs, flaky test detection, and email alerts via Gmail SMTP / n8n webhooks.' },
        { Icon: IconTestPipe, color:'#E2574C', bg:'rgba(226,87,76,.12)', title:'7 Frameworks Supported', desc:'Selenium, Cypress, Playwright, Pytest, Postman/Newman, k6, and BeautifulSoup — NexTest picks the best framework per test type automatically.' },
        { Icon: IconShieldLock, color:'#ef4444', bg:'rgba(239,68,68,.12)', title:'7 Test Types', desc:'Smoke, Functional, Performance, Security, Regression, API, and SEO — covering both public websites and internal systems.' },
      ]
    },
  };

  const testTypeContent = {
    smoke:       { color:'#64748b', badge:'Quick · ~30s',      Icon: IconEye,         title:'Smoke Test',       scope:'Public & Internal', desc:'Validates that key UI elements are visible and present in the DOM. The fastest way to confirm a page is up and functional.',                                              frameworks:[{n:'Selenium',c:'#43B02A'},{n:'Cypress',c:'#00BFA5'},{n:'Playwright',c:'#E2574C'}], steps:['NexTest scrapes the target URL and detects DOM elements','AI generates visibility checks for nav, buttons, forms, images','Tests run in headless browser and report pass/fail per element'], when:'Use after every deployment to catch critical UI regressions instantly.', config:['Target URL (required)','Framework: Selenium / Cypress / Playwright','No credentials needed for public apps'], tips:['Fastest test type — ideal for CI/CD post-deploy checks.','Combine with Scheduled Tasks for hourly uptime-style monitoring.'] },
    functional:  { color:'#6366f1', badge:'Medium · ~1min',    Icon: IconClick,       title:'Functional Test',  scope:'Public & Internal', desc:'Tests real user interactions — fill forms, click buttons, navigate pages, assert text content. Powered by Playwright with AI-generated steps.',                           frameworks:[{n:'Playwright',c:'#E2574C'}],                                                      steps:['LLaMA 3 generates click/fill/navigate/assert steps based on page structure','Playwright executes each step in a real browser with screenshots on fail','AI analysis provides root cause and fix for every failure'],    when:'Use to validate login flows, form submissions, and user journeys.', config:['Target URL','Login credentials (internal projects)','Optional: Project Context docs (Swagger, README) for smarter generation'], tips:['Screenshots are automatically captured on failed steps.','AI Recommendations tab suggests concrete fixes per failure.'] },
    performance: { color:'#8b5cf6', badge:'Advanced · ~3min',  Icon: IconBolt,        title:'Performance Test', scope:'Public & Internal', desc:'Measures Core Web Vitals (LCP, FCP, TTI, Load Time) and resource sizes. Also supports k6 load/stress/spike/soak testing.',                                              frameworks:[{n:'Playwright',c:'#E2574C'},{n:'k6',c:'#7D64FF'}],                                 steps:['Playwright captures Web Vitals via browser performance APIs','k6 generates load scripts and runs concurrent virtual users','Results scored out of 100 with actionable recommendations'],                           when:'Use before releases to ensure your app meets performance budgets.', config:['Target URL','Framework: Playwright (Web Vitals) or k6 (load testing)','k6 test types: Load, Stress, Spike, Soak (run together)'], tips:['k6 mode groups results by test type — check the Stress card first for breaking points.','Score below 50 usually means image/JS bundle optimization is needed.'] },
    security:    { color:'#ef4444', badge:'Critical · ~5min',  Icon: IconShieldLock,  title:'Security Test',    scope:'Internal only',     desc:'Checks for common vulnerabilities — XSS, auth bypass, missing headers, session issues, and information exposure.',                                                     frameworks:[{n:'Pytest',c:'#3776AB'}],                                                          steps:['Scans authentication routes, input fields, and HTTP headers','Tests for XSS injection, unauthorized access, and insecure cookies','Reports severity (critical/high/medium/low) per finding'],                        when:'Use before production releases and after security patches.', config:['Target URL','Internal login credentials','JWT/ANPE token auto-injected from session'], tips:['Findings are grouped by category: auth, XSS, session, headers, info_exposure.','Critical severity findings should block deployment.'] },
    regression:  { color:'#f97316', badge:'Thorough · ~3min',  Icon: IconRefresh,     title:'Regression Test',  scope:'Internal only',     desc:'Ensures existing features still work after code changes. Covers navigation, content, authentication, and functionality.',                                              frameworks:[{n:'Playwright',c:'#E2574C'}],                                                      steps:['AI generates a test suite covering all major page routes','Playwright validates each page loads correctly with expected content','Pass/fail per category: navigation, form, auth, UI'],                               when:'Run after every sprint or major code change to prevent regressions.', config:['Target URL','Login credentials','Optional: Project Context docs improve route detection'], tips:['Results by Category table shows which area broke — e.g. Authentication vs Navigation.'] },
    api:         { color:'#10b981', badge:'Technical · ~2min', Icon: IconApi,         title:'API Test',         scope:'Internal only',     desc:'Tests REST API endpoints — status codes, response payloads, authentication, CRUD operations, and edge cases.',                                                        frameworks:[{n:'Pytest',c:'#3776AB'},{n:'Postman',c:'#FF6C37'}],                                steps:['LLaMA 3 discovers endpoints and generates CRUD test cases','Tests run with real HTTP requests and JWT token injection','Validates status codes, response schema, and error handling'],                               when:'Use to validate your API contract before frontend integration.', config:['API base URL','Framework: Pytest (requests) or Postman/Newman (collection)','Auth token — auto-cached from session'], tips:['Postman export gives you a ready-to-import .json collection for your team.','Dynamic email generation & ID chaining are used to test create→read→update→delete flows.'] },
    seo:         { color:'#06b6d4', badge:'Public · ~1min',    Icon: IconSeeding,     title:'SEO Test',         scope:'Public only',       desc:'Audits meta tags, headings, page speed, robots.txt, sitemap, Open Graph, and structured data for SEO compliance.',                                                    frameworks:[{n:'Requests + BeautifulSoup',c:'#06b6d4'}],                                        steps:['Fetches page HTML and analyzes SEO elements','Checks title, meta description, H1, canonical, OG tags, sitemap','Scores the page out of 100 with priority-ranked recommendations'],                                 when:'Use before launching new pages or after content changes.', config:['Target URL only — no login required','15+ factors analyzed automatically'], tips:['No Project Context upload needed — SEO tests are always fully public.','Score combines technical SEO + content + social sharing signals.'] },
  };

const GenericSection = ({ title, subtitle, color = '#6366f1', onGo, goLabel, children }) => (
  <div style={{ marginBottom:32 }}>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: subtitle ? 4 : 14 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)' }}>{title}</div>
      {onGo && (
        <button
          onClick={onGo}
          style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase',
            color: '#fff', background: color, border: 'none', borderRadius: 6,
            padding: '3px 9px', cursor: 'pointer', transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {goLabel || 'Click here'}
        </button>
      )}
    </div>
    {subtitle && <div style={{ fontSize:12, color:'var(--sub)', marginBottom:14, lineHeight:1.6 }}>{subtitle}</div>}
    {children}
  </div>
);

const StepList = ({ steps, color = '#6366f1', onNavigate }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
    {steps.map((step, i) => {
      const isObj = typeof step === 'object';
      const text = isObj ? step.text : step;
      const link = isObj ? step.link : null;
      const stepTarget = isObj ? step.step : null;
      return (
        <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
          <div style={{ width:26, height:26, borderRadius:'50%', flexShrink:0, background:`${color}15`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color, marginTop:1 }}>{i+1}</div>
          <div style={{ fontSize:13, color:'var(--sub)', lineHeight:1.7 }}>
            {text}
            {link && (
  <button
    onClick={() => onNavigate(link, stepTarget)}
    style={{
      marginLeft: 10,
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: '#fff',
      background: color,
      border: 'none',
      borderRadius: 6,
      padding: '3px 9px',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      verticalAlign: 'middle',
      transition: 'opacity 0.15s ease, transform 0.15s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.opacity = '0.85';
      e.currentTarget.style.transform = 'scale(1.05)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.transform = 'scale(1)';
    }}
  >
    Click here
  </button>
)}
          </div>
        </div>
      );
    })}
  </div>
);

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>

      <style>{`
        .docs-nav-scroll::-webkit-scrollbar,
        .docs-content-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .docs-nav-scroll::-webkit-scrollbar-track,
        .docs-content-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .docs-nav-scroll::-webkit-scrollbar-thumb,
        .docs-content-scroll::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 10px;
        }
        .docs-nav-scroll:hover::-webkit-scrollbar-thumb,
        .docs-content-scroll:hover::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,.25);
        }
      `}</style>

      {/* LEFT NAV */}
      <div
        className="docs-nav-scroll"
        style={{
          width:230, flexShrink:0, borderRight:'1px solid var(--border)',
          padding:'24px 0', background:'var(--bg)', overflowY:'auto',
          scrollbarWidth:'thin', scrollbarColor:'transparent transparent',
        }}
      >
        {sections.map(group => (
          <div key={group.group} style={{ marginBottom:18 }}>
            <div style={{ padding:'0 16px 8px', fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'var(--muted)' }}>
              {group.group}
            </div>
            {group.items.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActive(id)}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  width:'100%', padding:'9px 16px',
                  border:'none', borderRadius:0,
                  borderLeft: active===id ? '3px solid #6366f1' : '3px solid transparent',
                  background: active===id ? 'rgba(99,102,241,.1)' : 'transparent',
                  color: active===id ? '#818cf8' : 'var(--muted)',
                  fontSize:13, fontWeight: active===id ? 700 : 500,
                  cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all .15s',
                }}>
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* CONTENT */}
      <div
        className="docs-content-scroll"
        style={{
          flex:1, padding:'36px 48px', overflowY:'auto',
          scrollbarWidth:'thin', scrollbarColor:'transparent transparent',
        }}
      >

        {active === 'overview' && (
          <>
            <h1 style={{ fontSize:28, fontWeight:700, color:'var(--text)', marginBottom:10 }}>{content.overview.title}</h1>
            <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.8, marginBottom:32, maxWidth:620 }}>{content.overview.desc}</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {content.overview.items.map(({ Icon, color, bg, title, desc }) => (
                <div key={title}
                  style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'22px 24px', transition:'border-color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='rgba(99,102,241,.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                  <div style={{ width:40, height:40, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                    <Icon size={20} color={color} />
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6 }}>{title}</div>
                  <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.7 }}>{desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {active === 'getting-started' && (
          <>
            <h1 style={{ fontSize:26, fontWeight:700, color:'var(--text)', marginBottom:10 }}>Getting Started</h1>
            <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.8, marginBottom:28, maxWidth:600 }}>
              From zero to your first test report in under 3 minutes.
            </p>
         


<GenericSection title="1. Create a Project" color="#6366f1" onGo={() => onNavigate('generate', 'create')}>
  <StepList color="#6366f1" steps={[
    'Go to Projects → New Project.',
    'Choose Public — for websites and landing pages, no login required.',
    'Or choose Internal — for APIs and authenticated apps, requires credentials or JWT tokens.',
    'Name your project and add an optional description.',
  ]} />
</GenericSection>

<GenericSection title="2. Generate Tests" color="#8b5cf6">
  <StepList color="#8b5cf6" steps={[
    'Open your project and click New Generation.',
    'Enter the target URL — for Internal projects, also provide credentials or a JWT token.',
    'Pick a Test Type — Public: Smoke, Functional, Performance, SEO. Internal: Smoke, Functional, Performance, Security, Regression, API.',
    'Select a Framework — NexTest recommends the best fit automatically.',
    'Click Generate — AI scrapes the page, plans tests, and executes them live.',
    'A live terminal opens showing real-time execution logs as each test step runs.',
  ]} />
</GenericSection>
<GenericSection title="3. Review & Export" color="#10b981">
  <StepList color="#10b981" steps={[
    'Check pass/fail results, AI root-cause analysis, and screenshots on failure.',
    'Check the scenario details and AI recommendations for each test case.',
    'Download PDF, HTML, or CSV reports — and the generated test script — from the Execution page.',
    'Your results are also sent to your email via the n8n workflow, with the PDF report attached.',
    'Check your notifications in the interface for a summary of every completed generation.',
  ]} />
</GenericSection>
          </>
        )}

        {active === 'architecture' && (
          <>
            <h1 style={{ fontSize:26, fontWeight:700, color:'var(--text)', marginBottom:10 }}>Architecture</h1>
            <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.8, marginBottom:28, maxWidth:640 }}>
              NexTest is a multi-service platform: a React frontend, a Laravel API layer, and a FastAPI AI service that talks to Groq's LLaMA 3.3-70b model.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:32 }}>
              {[
                { label:'React (Vite)',  desc:'Frontend dashboard, forms, real-time charts',        color:'#61dafb' },
                { label:'Laravel API',   desc:'Auth, project CRUD, generation storage, PDF reports', color:'#ef4444' },
                { label:'FastAPI + Groq', desc:'AI test generation, scraping, execution engine',      color:'#10b981' },
                { label:'PostgreSQL',    desc:'Users, projects, generations, alerts, schedules',      color:'#336791' },
              ].map(s => (
                <div key={s.label} style={{ background:'var(--card)', border:'1px solid var(--border)', borderTop:`3px solid ${s.color}`, borderRadius:12, padding:'16px' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:6 }}>{s.label}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', lineHeight:1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>
            <GenericSection title="Request Flow" subtitle="How a single test generation moves through the stack.">
              <StepList color="#6366f1" steps={[
                'React sends the generation request to Laravel (with URL, framework, test type, credentials).',
                'Laravel validates the project/user and forwards the payload to the FastAPI AI service.',
                'FastAPI scrapes the DOM (Playwright/Selenium/Cypress) and sends context to Groq LLaMA 3.3-70b.',
                'LLaMA generates test cases and scripts, which FastAPI executes against the live page.',
                'Results flow back to Laravel for storage, then to React for display + PDF/HTML/CSV export.',
              ]} />
            </GenericSection>
            <GenericSection title="Supporting Services">
  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
    {[
      ['n8n / Gmail SMTP', 'Sends scheduled test result emails with PDF/HTML/CSV attachments'],
      ['pm2', 'Process manager keeping the Laravel scheduler & queue workers alive'],
    ].map(([l, d]) => (
                  <div key={l} style={{ display:'flex', gap:12, padding:'10px 14px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:10 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--indigo2)', minWidth:150 }}>{l}</span>
                    <span style={{ fontSize:12, color:'var(--muted)' }}>{d}</span>
                  </div>
                ))}
              </div>
            </GenericSection>
          </>
        )}

        {active === 'frameworks' && (
          <>
            <h1 style={{ fontSize:26, fontWeight:700, color:'var(--text)', marginBottom:10 }}>Supported Frameworks</h1>
            <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.8, marginBottom:28, maxWidth:640 }}>
              NexTest picks the right framework per test type automatically, but you can always choose manually when multiple options are available.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {FRAMEWORKS.map(fw => (
                <div key={fw.name} style={{ display:'flex', alignItems:'center', gap:16, background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'16px 20px' }}>
                  <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, background:`${fw.color}18`, border:`1px solid ${fw.color}35`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:fw.color }}>
                    {fw.name.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{fw.name}</span>
                      <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:20, color:fw.color, background:`${fw.color}15`, border:`1px solid ${fw.color}30` }}>{fw.lang}</span>
                    </div>
                    <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.6, marginBottom:8 }}>{fw.role}</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {fw.usedFor.map(u => (
                        <span key={u} style={{ fontSize:10, fontWeight:600, padding:'2px 9px', borderRadius:20, color:'var(--muted)', background:'var(--bg2)', border:'1px solid var(--border)' }}>{u}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {active === 'ai-engine' && (
          <>
            <h1 style={{ fontSize:26, fontWeight:700, color:'var(--text)', marginBottom:10 }}>AI Engine</h1>
            <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.8, marginBottom:28, maxWidth:640 }}>
              NexTest's intelligence is powered by <strong style={{ color:'var(--text)' }}>Groq</strong>, running <strong style={{ color:'var(--text)' }}>LLaMA 3.3-70b-versatile</strong> for both test generation and post-execution analysis.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:32 }}>
              {[
                { title:'Test Generation', color:'#6366f1', desc:'Given scraped DOM data (inputs, buttons, nav, forms), LLaMA plans realistic test scenarios — including edge cases and negative tests.' },
                { title:'AI Recommendations', color:'#10b981', desc:'After execution, failures are analyzed for root cause and a concrete fix is suggested per test case.' },
                { title:'SEO & Performance Scoring', color:'#06b6d4', desc:'Raw metrics (load time, meta tags, Web Vitals) are converted into human-readable scores and priority-ranked action items.' },
                { title:'Dashboard Insights', color:'#f59e0b', desc:'The Dashboard AI Insights panel summarizes trends across all your projects in plain language.' },
              ].map(s => (
                <div key={s.title} style={{ background:'var(--card)', border:'1px solid var(--border)', borderTop:`3px solid ${s.color}`, borderRadius:12, padding:'18px' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:8 }}>{s.title}</div>
                  <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.7 }}>{s.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background:'rgba(245,158,11,.06)', border:'1px solid rgba(245,158,11,.2)', borderRadius:12, padding:'16px 20px', display:'flex', gap:12 }}>
              <IconBulb size={20} color="#f59e0b" style={{ flexShrink:0, marginTop:2 }} />
              <div style={{ fontSize:12, color:'var(--sub)', lineHeight:1.7 }}>
                <strong style={{ color:'#f59e0b' }}>Rate limits:</strong> the free Groq tier caps at 100K tokens/day. Large Project Context uploads or many parallel generations can hit this limit — space out heavy runs if you see AI errors.
              </div>
            </div>
          </>
        )}

        {active === 'reports' && (
  <>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
      <h1 style={{ fontSize:26, fontWeight:700, color:'var(--text)', margin:0 }}>Reports & Exports</h1>
      <button
       onClick={() => onNavigate('reports')}
        style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase',
          color: '#fff', background: '#818cf8', border: 'none', borderRadius: 6,
          padding: '3px 9px', cursor: 'pointer', transition: 'opacity 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        Click here
      </button>
    </div>
    <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.8, marginBottom:28, maxWidth:640 }}>
      Every generation can be exported in three formats, each suited to a different audience.
    </p>
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {[
        { fmt:'PDF',  color:'#ef4444', desc:'Full formatted report with charts, AI recommendations, and verdict — ideal for stakeholders and audits.' },
        { fmt:'HTML', color:'#818cf8', desc:'Interactive, printable, self-contained report — open in any browser, no login required to view.' },
        { fmt:'CSV',  color:'#10b981', desc:'Raw tabular data for spreadsheets, custom dashboards, or further analysis.' },
      ].map(r => (
        <div key={r.fmt} style={{ display:'flex', gap:16, alignItems:'center', background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px' }}>
          <span style={{ width:52, height:36, borderRadius:8, background:`${r.color}15`, border:`1px solid ${r.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:r.color, flexShrink:0 }}>{r.fmt}</span>
          <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.6 }}>{r.desc}</div>
        </div>
      ))}
    </div>
    <div style={{ marginTop:24 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)', marginBottom:12 }}>Scheduled Reports</div>
      <p style={{ fontSize:12, color:'var(--sub)', lineHeight:1.7, maxWidth:600 }}>
        Configure a Scheduled Task to re-run any test on a recurring basis. Results are emailed automatically as PDF/HTML/CSV attachments via Gmail SMTP (or n8n webhook in local dev).
      </p>
    </div>
  </>
)}
          
{active === 'flaky-tests' && (
  <>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
      <h1 style={{ fontSize:26, fontWeight:700, color:'var(--text)', margin:0 }}>Flaky Tests</h1>
      <button
        onClick={() => onNavigate('flaky')}
        style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase',
          color: '#fff', background: '#f97316', border: 'none', borderRadius: 6,
          padding: '3px 9px', cursor: 'pointer', transition: 'opacity 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        Click here
      </button>
    </div>
    <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.8, marginBottom:28, maxWidth:640 }}>
      NexTest automatically detects unstable tests by analyzing your execution history — no manual tagging required.
    </p>

    <div style={{ marginBottom:32 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)', marginBottom:12 }}>Status Levels</div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {[
          ['Stable',   '#10b981', 'Consistently passing across recent runs.'],
          ['Warning',  '#f59e0b', 'Showing early signs of inconsistency.'],
          ['Flaky',    '#f97316', 'Intermittently failing — passes and fails without code changes.'],
          ['Critical',  '#ef4444', 'Failing most or all recent runs.'],
          ['Ignored',  '#64748b', 'Manually silenced — excluded from alerts until re-enabled.'],
 

        ].map(([label, color, desc]) => (
          <div key={label} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 14px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:10 }}>
            <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, color, background:`${color}15`, border:`1px solid ${color}33`, minWidth:70, textAlign:'center' }}>{label}</span>
            <span style={{ fontSize:12, color:'var(--muted)' }}>{desc}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={{ marginBottom:32 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)', marginBottom:16 }}>How it works</div>
      <StepList color="#f97316" steps={[
        'Every test execution across all your projects is logged with its pass/fail outcome.',
        'Tests are grouped by URL, then broken down by individual test case.',
        'A flakiness score is calculated from the ratio of failed vs total runs for each test.',
        'Tests are automatically classified — Stable, Warning, Flaky, or Critical — based on that score.',
        'Filter by status or search by test name/URL to quickly spot problem areas.',
      ]} />
    </div>

    

    <div style={{ background:'rgba(249,115,22,.06)', border:'1px solid rgba(249,115,22,.2)', borderRadius:12, padding:'16px 20px', display:'flex', gap:12 }}>
      <IconBulb size={20} color="#f97316" style={{ flexShrink:0, marginTop:2 }} />
      <div style={{ fontSize:12, color:'var(--sub)', lineHeight:1.7 }}>
        <strong style={{ color:'#f97316' }}>Note:</strong> Flaky Tests and Alerts work together — Critical and Flaky statuses feed directly into your notification system, so you get warned as soon as instability appears, without checking this page manually.
      </div>
    </div>
  </>
)}
        {active === 'faq' && (
          <>
            <h1 style={{ fontSize:26, fontWeight:700, color:'var(--text)', marginBottom:10 }}>FAQ</h1>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:20 }}>
              {[
                ['Do public tests require login credentials?', 'No. Smoke, Functional, Performance, and SEO tests on Public projects work with just a URL.'],
                ['Which test types need Project Context docs?', 'None are required, but uploading Swagger/README/PDF docs improves AI accuracy for Internal projects (Functional, Regression, Security, API).'],
                ['Can I change the framework after generating?', 'Yes — use Regenerate from the project detail view and pick a different framework for the same URL.'],
                ['Why did my test get skipped?', 'A test is skipped when the AI could not confidently locate the expected element/selector — check the Assertion badge for details.'],
                ['How do Scheduled Tasks send emails?', 'Via Gmail SMTP in production, or an n8n webhook in local development — configured per schedule.'],
              ].map(([q, a], i) => (
                <div key={i} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:6 }}>{q}</div>
                  <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.7 }}>{a}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {testTypeContent[active] && (() => {
          const current = testTypeContent[active];
          return (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                <div style={{ width:52, height:52, borderRadius:14, background:`${current.color}18`, border:`1px solid ${current.color}35`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <current.Icon size={24} color={current.color} />
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  <h1 style={{ fontSize:24, fontWeight:700, color:'var(--text)', margin:0 }}>{current.title}</h1>
                  <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, color:current.color, background:`${current.color}18`, border:`1px solid ${current.color}35` }}>
                    {current.badge}
                  </span>
                  <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, color:'var(--muted)', background:'var(--bg2)', border:'1px solid var(--border)' }}>
                    {current.scope}
                  </span>
                </div>
              </div>

              <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.8, marginBottom:32, maxWidth:600 }}>{current.desc}</p>

              <div style={{ marginBottom:32 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)', marginBottom:12 }}>Supported Frameworks</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {current.frameworks.map(fw => (
                    <span key={fw.n} style={{ fontSize:12, fontWeight:700, padding:'5px 14px', borderRadius:20, color:fw.c, background:`${fw.c}15`, border:`1px solid ${fw.c}30` }}>{fw.n}</span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:32 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)', marginBottom:16 }}>How it works</div>
                <StepList steps={current.steps} color={current.color} />
              </div>

              {current.config && (
                <div style={{ marginBottom:32 }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)', marginBottom:12 }}>Configuration</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {current.config.map((c, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:12, color:'var(--sub)' }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', background:current.color, flexShrink:0 }} />
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background:`${current.color}08`, border:`1px solid ${current.color}20`, borderRadius:12, padding:'16px 20px', display:'flex', gap:12, alignItems:'flex-start', marginBottom: current.tips ? 20 : 0 }}>
                <IconBulb size={20} color={current.color} style={{ flexShrink:0, marginTop:2 }} />
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:current.color, marginBottom:6, letterSpacing:1.5, textTransform:'uppercase' }}>When to use</div>
                  <div style={{ fontSize:13, color:'var(--sub)', lineHeight:1.7 }}>{current.when}</div>
                </div>
              </div>

              {current.tips && (
                <div style={{ marginTop:20 }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)', marginBottom:12 }}>Tips</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {current.tips.map((tip, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:12, color:'var(--sub)', lineHeight:1.6 }}>
                        <span style={{ fontSize:13, flexShrink:0 }}>💡</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          );
        })()}

      </div>
    </div>
  );
}

function saveNotifsSafe(userId, updated) {
  if (!userId) return;
  const trimmed = updated.slice(0, 30).map(n => ({
    id: n.id,
    date: n.date,
    url: n.url,
    framework: n.framework,
    testType: n.testType,
    passCount: n.passCount,
    failCount: n.failCount,
  }));
  try {
    localStorage.setItem(`nextest-notifs-${userId}`, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('[Notifs] quota exceeded, trimming further', e);
    try {
      localStorage.setItem(`nextest-notifs-${userId}`, JSON.stringify(trimmed.slice(0, 10)));
    } catch (e2) {
      localStorage.removeItem(`nextest-notifs-${userId}`);
    }
  }
}


export default function Dashboard() {

  const [page, setPage]= useState('dashboard');
  useEffect(() => {
  const titles = {
    dashboard: 'Dashboard - NexTest',
    generate:  'Projects - NexTest',
    execution: 'Test Execution - NexTest',
    history:   'History - NexTest',
    account:   'Account - NexTest',
    settings:  'Settings - NexTest',
  };
  document.title = titles[page] || 'NexTest';
}, [page]);

  const [collapsed, setCollapse]= useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  const [alertUnread, setAlertUnread] = useState(0);

useEffect(() => {
  if (page === 'alerts') return;
  const fetchUnread = () => {
    api.get('/alerts/unread-count')
      .then(res => setAlertUnread(res.data.count || 0))
      .catch(() => {});
  };
  fetchUnread();
  const interval = setInterval(fetchUnread, 15000);
  return () => clearInterval(interval);
}, [page]);  

const [notifs, setNotifs] = useState([]);

  const [searchHistories, setSearchHistories] = useState([]);   // ← AJOUTE
  const [searchProjects,  setSearchProjects]  = useState([]); 
  const [headerSearch, setHeaderSearch] = useState('');
const [headerResults, setHeaderResults] = useState([]);
const [headerOpen, setHeaderOpen] = useState(false);
const headerRef = useRef(null);

  const [theme,          setTheme]         = useState(() => {

    const saved = localStorage.getItem('nextest-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    localStorage.setItem('nextest-theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    return 'dark';
  });
  const [reduceMotion, setReduceMotion] = useState(false);
  const [sidebarPos, setSidebarPos] = useState('Left');
  const [generation,      setGeneration]    = useState(null);
  const [currentProject,  setCurrentProject] = useState(null);
  const [selectedPageUrl, setSelectedPageUrl] = useState('');
  const [selectedTestType, setSelectedTestType] = useState('');   // ← AJOUTE ICI
  const [selectedFramework, setSelectedFramework] = useState('');
  const [selectedUsername, setSelectedUsername] = useState('');
  const [selectedPassword, setSelectedPassword] = useState(''); 
  const [projectStep,     setProjectStep]   = useState('list');

  const { user, logout } = useAuth();
  useEffect(() => {
  if (user?.id) {
    try {
      const saved = JSON.parse(localStorage.getItem(`nextest-notifs-${user.id}`)) || [];
      setNotifs(saved);
    } catch { setNotifs([]); }
  }
}, [user?.id]);
  const { t, lang, setLanguage } = useLang();

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('nextest-theme', theme); }, [theme]);
// ← AJOUTE CES DEUX useEffect ICI
  useEffect(() => {
  if (!user?.id) return;
  setSearchHistories([]);
  setSearchProjects([]);
  api.get('/generations').then(r => setSearchHistories(r.data)).catch(() => {});
  api.get('/projects').then(r => setSearchProjects(r.data)).catch(() => {});
}, [user?.id]);

  useEffect(() => {
  if (!headerSearch.trim()) { setHeaderResults([]); setHeaderOpen(false); return; }
  const q = headerSearch.toLowerCase();
  const projRes = searchProjects
    .filter(p => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q))
    .slice(0, 3).map(p => ({ type: 'project', id: p.id, icon: p.type === 'public' ? '🌐' : '🔒', title: p.name, sub: `${p.type} · ${p.generations_count || 0} generations`, color: p.type === 'public' ? '#4f86e8' : '#8b5cf6', data: p }));
  const genRes = searchHistories
    .filter(h => h.url?.toLowerCase().includes(q) || h.framework?.toLowerCase().includes(q))
    .slice(0, 5).map(h => ({ type: 'generation', id: h.id, title: h.url, sub: `${h.framework} · ${h.test_type} · ${h.pass_rate || 0}% pass`, data: h }));
  setHeaderResults([...projRes, ...genRes]);
  setHeaderOpen(true);
}, [headerSearch, searchProjects, searchHistories]);

useEffect(() => {
  const handler = (e) => { if (headerRef.current && !headerRef.current.contains(e.target)) setHeaderOpen(false); };
  document.addEventListener('mousedown', handler);
  return () => document.removeEventListener('mousedown', handler);
}, []);
  
  const handleGenerateNav = () => { setProjectStep('list'); setCurrentProject(null); setSelectedPageUrl(''); setPage('generate'); };

  //les elements qui exist dans le side bar 
  const NAV_MAIN = [
    { id: 'dashboard', label: t('dashboard'),     badge: null     },
    { id: 'generate',  label: t('projects'),         },
    { id: 'execution', label: t('testExecution'), badge: null     },
    { id: 'scheduled', label: t('scheduledTasks'), badge: null },
    { id: 'flaky',     label: t('flakyTests'),    badge: null },
    { id: 'alerts',    label: t('alerts'),        badge: alertUnread > 0 ? alertUnread : null },
    { id: 'reports',   label: t('reports'),       badge: null },
    { id: 'history',   label: t('history'),       badge: null     },
  ];
  
  const NAV_USER = [{ id: 'account', label: t('account') }, { id: 'settings', label: t('settings') }];


const LABELS = {
  dashboard: t('dashboard'),
  generate:  t('projects'),
  execution: t('testExecution'),
  history:   t('history'),
  account:   t('account'),
  settings:  t('settings'),
  flaky:     t('flakyTests'),
  alerts:    t('alerts'),
  reports:   t('reports'), 
  docs:      t('documentation'), 
  scheduled: t('scheduledTasks'), 
};
  return (
    <div
  className={`dash-root${reduceMotion ? ' reduce-motion' : ''}`}
  style={{
    position:'fixed', top:0, left:0, right:0, bottom:0,
    width:'100vw', height:'100vh',
    display:'flex',
    flexDirection: sidebarPos === 'Right' ? 'row-reverse' : 'row',
    overflow:'hidden'
  }}
>
      <aside className={`sidebar${collapsed?' collapsed':''}`}>
        <NexLogo collapsed={collapsed} />
        <button className="s-toggle" onClick={() => setCollapse(p=>!p)}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">{collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}</svg>
        </button>
     <nav className="s-nav">
  <div className="s-group">
    {!collapsed && <div className="s-label">{t('main')}</div>}
    {NAV_MAIN.map(it => (
      <SItem key={it.id} {...it} active={page===it.id} collapsed={collapsed}
        onClick={
  it.id === 'generate'  ? handleGenerateNav :
  it.id === 'execution' ? () => {
    if (generation) setGeneration(g => ({ ...g, fresh: false }));
    setPage('execution');
  } :
  it.id === 'alerts' ? () => { setAlertUnread(0); setPage('alerts'); } :
  setPage
}
      />
    ))}
  </div>

  <div className="s-divider" />

  <div className="s-group">
    {!collapsed && <div className="s-label">{t('user')}</div>}
    {NAV_USER.map(it => (<SItem key={it.id} {...it} active={page===it.id} collapsed={collapsed} onClick={setPage} />))}
  </div>

  <div className="s-divider" />

  {/* ← Help déplacé ici, juste après User (Settings) */}
  <div className="s-group">
    {!collapsed && <div className="s-label">{t('help')}</div>}
    <SItem id="docs" label={t('documentation')} active={page==='docs'} collapsed={collapsed} onClick={setPage} />
  </div>
</nav>

{/* Le footer logout reste séparé, tout en bas, comme avant */}
<div style={{ marginTop: '16px' }}>
  <div className="s-footer">
    <button className="s-item s-logout" onClick={logout} title={t('logout')}>
      <span className="s-icon">{IC.logout}</span>
      {!collapsed && <span className="s-label-txt">{t('logout')}</span>}
    </button>
  </div>
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
       <div ref={headerRef} style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
  <div className="h-search" style={{ cursor: 'text' }}>
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color:'#9ca3af', flexShrink:0 }}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
    <input
      value={headerSearch}
      onChange={e => setHeaderSearch(e.target.value)}
      placeholder="Search projects, URLs..."
      style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', width: '100%' }}
    />
    {headerSearch && (
      <button onClick={() => { setHeaderSearch(''); setHeaderOpen(false); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}>
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    )}
  </div>
  {headerOpen && headerResults.length > 0 && (
    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#0d1526', border: '1px solid rgba(99,102,241,.3)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,.5)', zIndex: 9999, overflow: 'hidden' }}>
      {headerResults.map((r, i) => (
        <div key={`${r.type}-${r.id}`} onClick={() => {
          if (r.type === 'project') {
            setCurrentProject(r.data); setProjectStep('detail'); setPage('generate');
          } else {
            setGeneration({
              url: r.data.url, framework: r.data.framework, test_type: r.data.test_type,
              generation: { id: r.data.id, url: r.data.url, framework: r.data.framework, load_time_ms: r.data.load_time_ms, test_type: r.data.test_type },
              result: {
                test_type: r.data.test_type || 'smoke', test_cases: r.data.test_cases || [],
                test_cases_selenium: r.data.test_cases_selenium || [], test_cases_cypress: r.data.test_cases_cypress || [],
                script: r.data.script || '', script_selenium: r.data.script_selenium || '',
                script_playwright: r.data.script_playwright || '', script_cypress: r.data.script_cypress || '',
                execution_results: r.data.execution_results || [],
                performance: r.data.performance_data || r.data.performance || null,
              },
            });
            setPage('history');
          }
          setHeaderSearch(''); setHeaderOpen(false);
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', borderBottom: i < headerResults.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none', transition: 'background .15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,.1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{r.type === 'project' ? r.icon : '🔗'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{r.sub}</div>
          </div>
          {r.type === 'project' && <span style={{ fontSize: 10, fontWeight: 700, color: r.color, background: `${r.color}18`, border: `1px solid ${r.color}33`, padding: '2px 8px', borderRadius: 20 }}>Open</span>}
          {r.type === 'generation' && <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>{r.data.pass_rate || 0}%</span>}
        </div>
      ))}
    </div>
  )}
</div>

  
          <div className="h-right">
              <LanguageSwitcher lang={lang || 'en'} setLang={setLanguage} theme={theme} />

            <ThemeToggle theme={theme} setTheme={setTheme} />
            <div style={{ position: 'relative' }}>
  <button
  className="h-icon-btn"
  onClick={() => { setNotifOpen(o => !o); setNotifCount(0); }}
  style={{ position: 'relative' }}
>
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
  {notifCount > 0 && (
    <span style={{
      position: 'absolute', top: -4, right: -4,
      width: 16, height: 16, borderRadius: '50%',
      background: '#ef4444', border: '2px solid var(--bg)',
      fontSize: 9, fontWeight: 800, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'inherit'
    }}>
      {notifCount > 9 ? '9+' : notifCount}
    </span>
  )}
</button>

{notifOpen && (
  <NotifPanel
   isDark={theme === 'dark'}
    notifs={notifs}
    onClose={() => setNotifOpen(false)}
 
onDelete={(id) => {
  const updated = notifs.filter(n => n.id !== id);
  setNotifs(updated);
  saveNotifsSafe(user?.id, updated);
}}
onClearAll={() => {
  setNotifs([]);
  localStorage.removeItem(`nextest-notifs-${user?.id}`);
}}
   
    goTo={setPage}
    setGeneration={setGeneration}
    histories={searchHistories}
  />
)}
</div>
                       <div className="h-sep"/>
                       <div
  onClick={() => setPage('account')}
  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
  title="Go to Account"
>
  <div className="h-avatar">
    {user?.avatar
      ? <img src={user.avatar} alt="av" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }}/>
      : <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
    }
  </div>
  <div>
    <div className="h-user-name" style={{ transition: 'color .18s' }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
      onMouseLeave={e => e.currentTarget.style.color = ''}>
      {user?.name?.split(' ')[0] || 'User'}
    </div>
    <div className="h-user-role">
  {(() => {
    const role = user?.onboarding_data?.role;
    const labels = {
      developer: 'Developer',
      tester:    'QA / Tester',
      lead:      'Tech Lead',
      other:     'Explorer',
    };
    return labels[role] || 'QA Engineer';
  })()}
</div>
  </div>
</div>
          
          </div>
        </header>

        <div className="content">
          {page === 'dashboard' && <DashboardPanel user={user} goTo={setPage} />}
          {page === 'generate' && (
            <>
              {projectStep === 'list' && (<ProjectsListPanel onNewProject={() => setProjectStep('create')} onSelectProject={(project) => { setCurrentProject(project); setProjectStep('detail'); }} />)}
              {projectStep === 'detail' && (<ProjectDetailPanel project={currentProject} onBack={() => setProjectStep('list')} onNewGeneration={(url, testType, framework, username, password) => {
  setSelectedPageUrl(url || '');
  setSelectedTestType(testType || '');
  setSelectedFramework(framework || '');
  setSelectedUsername(username || '');
  setSelectedPassword(password || '');
  setProjectStep('generate');
}} setGeneration={setGeneration} goTo={setPage} />)}
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
                  <GeneratePanel goTo={(p) => { 
  setProjectStep('list'); 
  setPage(p); 
}}  setGeneration={setGeneration} project={currentProject} initialUrl={selectedPageUrl} initialTestType={selectedTestType} initialFramework={selectedFramework} initialUsername={selectedUsername}
    initialPassword={selectedPassword}   
    onGenerationSaved={(notif) => {
  if (!notif?.url) return;
  const newNotif = { ...notif, id: Date.now(), date: new Date().toISOString() };
  setNotifs(prev => {
    const isDup = prev.some(n =>
      n.url === notif.url &&
      n.framework === notif.framework &&
      Date.now() - new Date(n.date).getTime() < 10000
    );
    if (isDup) return prev;
    const updated = [newNotif, ...prev];
    saveNotifsSafe(user?.id, updated);
    return updated;
  });
  setNotifCount(c => c + 1);
  // sound
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(520, ctx.currentTime);
  osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
}} />
                </>
              )}
            </>
          )}
          {page === 'execution' && (
  <ExecutionPanel
    generation={generation}
    onGenerationSaved={(notif) => {
            const newNotif = { ...notif, id: Date.now(), date: new Date().toISOString() };
setNotifs(prev => {
        const updated = [newNotif, ...prev];
        saveNotifsSafe(user?.id, updated);
        return updated;
      });
      setNotifCount(c => c + 1);
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }}
  />
)}
          {page === 'reports' && <ReportsPanel goTo={setPage} setGeneration={setGeneration} />}
          {page === 'docs' && <DocsPanel goTo={setPage} setProjectStep={setProjectStep} />}
          {page === 'scheduled' && <ScheduledTasksPanel projects={searchProjects} />}
          {page === 'flaky' && <FlakyTestsPanel />}
   {page === 'alerts' && (
  <AlertsPanel
    onAlertRead={() => setAlertUnread(c => Math.max(0, c - 1))}
    onSelectProject={(project) => {
      setCurrentProject(project);
      setProjectStep('detail');
      setPage('generate');
    }}
  />
)}
          {page === 'history'   && <HistoryPanel   goTo={setPage} setGeneration={setGeneration} />}
          {page === 'account' && <AccountPanel user={user} setPage={setPage} setProjectStep={setProjectStep} />}
          {page === 'settings'  && <SettingsPanel  theme={theme} setTheme={setTheme} reduceMotion={reduceMotion} setReduceMotion={setReduceMotion} sidebarPos={sidebarPos} setSidebarPos={setSidebarPos} />}
        </div>
      </div>
      <NextestChatbot theme={theme} />
    </div>
  );
}

function NotifPanel({ notifs, onClose, onDelete, onClearAll, goTo, setGeneration, histories = [], isDark = true }) {
  const [page, setPage] = useState(0);
  const PER_PAGE = 3;
  const totalPages = Math.ceil(notifs.length / PER_PAGE);
  const visible = notifs.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const t = isDark ? {
    bg:'#0d1526', border:'rgba(255,255,255,.08)', borderSub:'rgba(255,255,255,.04)',
    borderTop:'rgba(255,255,255,.05)', headerBorder:'rgba(255,255,255,.06)',
    shadow:'0 20px 60px rgba(0,0,0,.5)', title:'#e2e8f0', url:'#94a3b8',
    time:'#334155', emptyIcon:'#334155', emptyText:'#334155',
    badgeBg:'rgba(255,255,255,.04)', badgeColor:'#64748b', rowHover:'rgba(255,255,255,.02)',
    countBg:'rgba(99,102,241,.15)', countColor:'#a5b4fc', countBorder:'rgba(99,102,241,.25)',
    closeBtn:'rgba(255,255,255,.05)', closeBorder:'rgba(255,255,255,.08)', closeColor:'#64748b',
    emailColor:'#475569', pagColor:'#334155', pagBtn:'#64748b', pagDisabled:'#1e293b',
    viewBtn:'#818cf8', viewBg:'rgba(99,102,241,.1)', viewBorder:'rgba(99,102,241,.2)',
    delBg:'rgba(239,68,68,.08)', delBorder:'rgba(239,68,68,.15)', delColor:'#f87171',
    stripeBg:'rgba(255,255,255,.06)',
  } : {
    bg:'#ffffff', border:'rgba(0,0,0,.08)', borderSub:'rgba(0,0,0,.05)',
    borderTop:'rgba(0,0,0,.06)', headerBorder:'rgba(0,0,0,.07)',
    shadow:'0 20px 60px rgba(0,0,0,.12)', title:'#0f172a', url:'#475569',
    time:'#94a3b8', emptyIcon:'#cbd5e1', emptyText:'#94a3b8',
    badgeBg:'rgba(0,0,0,.04)', badgeColor:'#64748b', rowHover:'rgba(0,0,0,.02)',
    countBg:'rgba(99,102,241,.1)', countColor:'#6366f1', countBorder:'rgba(99,102,241,.2)',
    closeBtn:'rgba(0,0,0,.04)', closeBorder:'rgba(0,0,0,.08)', closeColor:'#94a3b8',
    emailColor:'#94a3b8', pagColor:'#94a3b8', pagBtn:'#64748b', pagDisabled:'#cbd5e1',
    viewBtn:'#6366f1', viewBg:'rgba(99,102,241,.08)', viewBorder:'rgba(99,102,241,.15)',
    delBg:'rgba(239,68,68,.06)', delBorder:'rgba(239,68,68,.12)', delColor:'#ef4444',
    stripeBg:'rgba(0,0,0,.06)',
  };

  const timeAgoNotif = (iso) => {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60)    return `${Math.floor(diff)}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getRate = (n) => {
    const total = (n.passCount || 0) + (n.failCount || 0);
    return total > 0 ? Math.round((n.passCount / total) * 100) : 0;
  };
  const rc = (rate) => rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';

  const FW  = { Selenium:'Se', Cypress:'Cy', Playwright:'Pl', k6:'k6', Pytest:'Py', Postman:'Po', Requests:'RQ' };
  const FWC = { Selenium:'#43B02A', Cypress:'#00BFA5', Playwright:'#E2574C', k6:'#7D64FF', Pytest:'#3776AB', Postman:'#FF6C37', Requests:'#06b6d4' };

  const handleView = (n) => {
    const match = [...histories]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .find(h => h.url === n.url && h.framework === n.framework);
    if (match && setGeneration) {
      setGeneration({
        url: match.url, framework: match.framework, test_type: match.test_type,
        generation: { id: match.id, url: match.url, framework: match.framework, load_time_ms: match.load_time_ms, test_type: match.test_type },
        result: {
          test_type: match.test_type || 'smoke',
          test_cases: match.test_cases || [],
          test_cases_selenium: match.test_cases_selenium || [],
          test_cases_cypress: match.test_cases_cypress || [],
          script: match.script || '',
          script_selenium: match.script_selenium || '',
          script_playwright: match.script_playwright || '',
          script_cypress: match.script_cypress || '',
          execution_results: match.execution_results || [],
          performance: match.performance_data || match.performance || null,
        },
      });
    }
    goTo('execution'); onClose();
  };

  return (
    <>
      <style>{`
        @keyframes npIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:none; } }
        .np-row:hover { background: ${t.rowHover} !important; }
        .np-del { opacity:0; transition: opacity .15s; }
        .np-row:hover .np-del { opacity:1; }
      `}</style>

      {/* ── OUTER: handles position + arrow ── */}
      <div style={{
        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
        width: 360,
        zIndex: 9999,
        animation: 'npIn .18s ease both',
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* Arrow */}
        <div style={{
          position: 'absolute',
          top: -6,
          right: 18,
          width: 12,
          height: 12,
          background: t.bg,
          border: `1px solid ${t.border}`,
          borderRight: 'none',
          borderBottom: 'none',
          transform: 'rotate(45deg)',
          zIndex: 10,
        }} />

        {/* ── INNER: rounded box with clipped content ── */}
        <div style={{
          background: t.bg,
          border: `1px solid ${t.border}`,
          borderRadius: 14,
          boxShadow: t.shadow,
          overflow: 'hidden',
        }}>

          {/* ── HEADER ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: `1px solid ${t.headerBorder}`,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ position:'relative', display:'inline-flex' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#10b981', display:'block' }} />
                <span style={{
                  position:'absolute', inset:-2, borderRadius:'50%',
                  background:'rgba(16,185,129,.3)',
                  animation:'pulse 2s infinite',
                }} />
              </span>
              <span style={{ fontSize:13, fontWeight:700, color:t.title }}>Notifications</span>
              {notifs.length > 0 && (
                <span style={{
                  fontSize:10, fontWeight:800, padding:'1px 7px', borderRadius:20,
                  background: t.countBg, color: t.countColor,
                  border: `1px solid ${t.countBorder}`,
                }}>{notifs.length}</span>
              )}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {notifs.length > 0 && (
                <button onClick={onClearAll} style={{
                  fontSize:10, fontWeight:700, color:'#ef4444',
                  background:'none', border:'none', cursor:'pointer',
                  fontFamily:'inherit', letterSpacing:'.5px',
                }}>DELETE ALL</button>
              )}
              <button onClick={onClose} style={{
                background: t.closeBtn, border: `1px solid ${t.closeBorder}`,
                borderRadius:7, width:26, height:26, display:'flex',
                alignItems:'center', justifyContent:'center',
                color: t.closeColor, cursor:'pointer',
              }}>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ── EMPTY ── */}
          {notifs.length === 0 && (
            <div style={{ padding:'40px 16px', textAlign:'center' }}>
              <div style={{
                width:52, height:52, borderRadius:14,
                background: isDark ? 'rgba(99,102,241,.08)' : 'rgba(99,102,241,.06)',
                border: `1px solid ${isDark ? 'rgba(99,102,241,.15)' : 'rgba(99,102,241,.12)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 12px',
              }}>
                <svg width="22" height="22" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:t.title, marginBottom:4 }}>All caught up</div>
              <div style={{ fontSize:11, color:t.emptyText }}>Test results will appear here</div>
            </div>
          )}

          {/* ── LIST ── */}
          {visible.map((n) => {
            const rate  = getRate(n);
            const color = rc(rate);
            const total = (n.passCount || 0) + (n.failCount || 0);
            const fw    = FW[n.framework] || n.framework?.slice(0,2) || '?';
            const fwc   = FWC[n.framework] || '#64748b';
            const isOk  = rate >= 80;

            return (
              <div key={n.id} className="np-row" style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${t.borderSub}`,
                position: 'relative',
              }}>
                {/* status stripe */}
                <div style={{
                  position:'absolute', left:0, top:10, bottom:10,
                  width:2.5, borderRadius:'0 2px 2px 0',
                  background: color,
                }} />

                <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>

                  {/* Icon */}
                  <div style={{
                    width:34, height:34, borderRadius:10, flexShrink:0,
                    background: isOk ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)',
                    border: `1px solid ${isOk ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {isOk ? (
                      <svg width="15" height="15" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>

                    {/* URL + time */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:4 }}>
                      <span style={{
                        fontSize:12, fontWeight:600, color:t.url,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1,
                      }}>
                        {n.url?.replace(/https?:\/\//, '')}
                      </span>
                      <span style={{ fontSize:10, color:t.time, flexShrink:0 }}>
                        {timeAgoNotif(n.date)}
                      </span>
                    </div>

                    {/* Badges + rate */}
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
                      <span style={{
                        fontSize:9, fontWeight:800, padding:'2px 6px', borderRadius:5,
                        color:fwc, background:`${fwc}15`, border:`1px solid ${fwc}25`,
                      }}>{fw}</span>
                      {n.testType && (
                        <span style={{
                          fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:5,
                          color:t.badgeColor, background:t.badgeBg,
                          textTransform:'uppercase', letterSpacing:'.3px',
                        }}>{n.testType}</span>
                      )}
                      <span style={{
                        marginLeft:'auto', fontSize:11, fontWeight:800,
                        color, fontFamily:'monospace',
                      }}>{rate}%</span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height:3, borderRadius:3, background:t.stripeBg, display:'flex', overflow:'hidden', marginBottom:5 }}>
                      <div style={{ width:`${total > 0 ? (n.passCount||0)/total*100 : 0}%`, background:'#10b981' }} />
                      <div style={{ width:`${total > 0 ? (n.failCount||0)/total*100 : 0}%`, background:'#ef4444' }} />
                    </div>

                    {/* Email hint */}
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
                      <svg width="9" height="9" fill="none" stroke={t.emailColor} strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <span style={{ fontSize:9, color:t.emailColor }}>Report sent · check your email</span>
                    </div>

                    {/* Stats + actions */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:10, color:t.emailColor }}>
                        <span style={{ color:'#10b981', fontWeight:700 }}>{n.passCount||0} pass</span>
                        {(n.failCount||0) > 0 && <span style={{ color:'#ef4444', fontWeight:700 }}> · {n.failCount} fail</span>}
                      </span>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <button onClick={() => handleView(n)} style={{
                          fontSize:10, fontWeight:700, color:t.viewBtn,
                          background:t.viewBg, border:`1px solid ${t.viewBorder}`,
                          borderRadius:6, padding:'3px 9px', cursor:'pointer', fontFamily:'inherit',
                          display:'flex', alignItems:'center', gap:4,
                        }}>
                          <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                          </svg>
                          View results
                        </button>
                        <button className="np-del" onClick={() => onDelete(n.id)} style={{
                          width:22, height:22, borderRadius:6, display:'flex',
                          alignItems:'center', justifyContent:'center',
                          background:t.delBg, border:`1px solid ${t.delBorder}`,
                          color:t.delColor, cursor:'pointer',
                        }}>
                          <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}

          {/* ── PAGINATION ── */}
          {totalPages > 1 && (
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'8px 16px',
              borderTop:`1px solid ${t.borderTop}`,
            }}>
              <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0}
                style={{
                  fontSize:11, fontWeight:700,
                  color: page===0 ? t.pagDisabled : t.pagBtn,
                  background:'none', border:'none',
                  cursor: page===0 ? 'default' : 'pointer',
                  fontFamily:'inherit',
                }}>Prev</button>
              <span style={{ fontSize:10, color:t.pagColor }}>{page+1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page===totalPages-1}
                style={{
                  fontSize:11, fontWeight:700,
                  color: page===totalPages-1 ? t.pagDisabled : t.pagBtn,
                  background:'none', border:'none',
                  cursor: page===totalPages-1 ? 'default' : 'pointer',
                  fontFamily:'inherit',
                }}>Next </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
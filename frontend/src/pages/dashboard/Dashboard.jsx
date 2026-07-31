
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


import { TrendingUp, Flame, Zap, Waves, CheckCircle2, XCircle, AlertTriangle, MinusCircle, Clock, BarChart3, Users} from 'lucide-react';

import {
  Globe, Lock, Settings2, Smartphone, Check, ChevronDown, Link as LinkIcon,
  ShieldCheck, Sparkles, Tag, User, FileText, ArrowRight, Save, Rocket,
  Wand2, TrendingUp as TrendUpIcon, Loader2, Info, Type, Code2, ListFilter,
  Calendar, ChevronLeft, ChevronRight, X, Mail, Eye, EyeOff, Search, Bot,
  UploadCloud, FileUp, Trash2, ArrowUpRight, Folder, FlaskConical
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
  chatbot: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4" strokeLinecap="round"/><circle cx="12" cy="3" r="1.2" fill="currentColor" stroke="none"/><path d="M4 12H2M22 12h-2" strokeLinecap="round"/><circle cx="9" cy="14" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="14" r="1.4" fill="currentColor" stroke="none"/></svg>,};

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
        {t('dbLoadingDashboard')}
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
      setAiVerdict({ rating: null, text: t('dbAiVerdictError') });
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
    title={t('activeProjects')}
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
  {t('dbTestsTrend')}
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
      {t('dbTestResults')}
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
  const statusLabel = isGood ? t('dbStable') : rate >= 50 ? t('dbNeedsAttention') : t('dbCritical');
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
  {t('dbMostTestedApp')}
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
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{t('dbPassRateLabel')}</div>
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
            {aiLoading ? t('dbAiAnalyzing') : t('dbAiVerdictBtn')}
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
      {[t('dbColHash'), t('dbColUrl'), t('dbColTool'), t('tests'), t('passRate')].map(h => (
        <div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</div>
      ))}
    </div>
    {topUrls.length === 0 ? (
      <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
        {t('dbNoUrlsYet')}
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
                    <span style={{ color: 'var(--muted)' }}>{item.framework} {t('dbTestsCompletedOn')} </span>
                    <span style={{ color: 'var(--indigo2)', cursor: 'pointer' }}
                      onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                      {item.url}
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ color: 'var(--muted)' }}>{item.framework} {t('dbScanFailedOn')} </span>
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
                {item.tests} tests · {t('dbPassRateColon')} <span style={{ color: rc, fontWeight: 700 }}>{rate}%</span>
              </div>
              {!isOk && (
                <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                  {item.tests - item.pass} {(item.tests - item.pass) > 1 ? t('dbCriticalIssuesFound') : t('dbCriticalIssueFound')}
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
  const { t } = useLang(); 
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
    if (diff < 60)    return t('plSecondsAgo').replace('{n}', Math.floor(diff));
    if (diff < 3600)  return t('plMinutesAgo').replace('{n}', Math.floor(diff / 60));
    if (diff < 86400) return t('plHoursAgo').replace('{n}', Math.floor(diff / 3600));
    return t('plDaysAgo').replace('{n}', Math.floor(diff / 86400));
  };

  return (
    <div className="panel">
      <div className="p-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="p-title">{t('my')} <span className="g">{t('projects')}</span></h1>
          <p className="p-sub">{t('plSubtitle')}</p>
        </div>
        <button className="btn-primary" onClick={onNewProject}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          {t('plNewProject')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { icon: <IconFolder size={28} stroke={1.5} style={{ color: '#6366f1' }} />, val: projects.length, lbl: t('plTotalProjects'), accent: 'linear-gradient(90deg,#6366f1,#818cf8)' },
          { icon: <IconWorld size={28} stroke={1.5} style={{ color: '#4f86e8' }} />, val: totalPublic, lbl: t('plPublicProjects'), accent: 'linear-gradient(90deg,#4f86e8,#6fa3ff)' },
          { icon: <IconLock size={28} stroke={1.5} style={{ color: '#8b5cf6' }} />, val: totalInternal, lbl: t('plInternalProjects'), accent: 'linear-gradient(90deg,#8b5cf6,#a78bfa)' },
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
            placeholder={t('plSearchPlaceholder')}
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
            { key: 'all',      label: t('all'),          icon: <IconFolder size={14} stroke={1.5} /> },
            { key: 'public',   label: t('publicBadge'),   icon: <IconWorld  size={14} stroke={1.5} /> },
            { key: 'internal', label: t('internalBadge'), icon: <IconLock   size={14} stroke={1.5} /> },
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
            {filtered.length} {filtered.length !== 1 ? t('plResultsPlural') : t('plResult')}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, gap: 20 }}>
          <LogoSpinner size={80} />
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
            {t('plLoadingProjects')}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--indigo-bg)', border: '1px solid var(--indigo-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 20 }}>📁</div>
          <h3 style={{ fontFamily: 'var(--C)', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{search || filterType !== 'all' ? t('plNoResultsTitle') : t('plNoProjectsTitle')}</h3>
          <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.7, maxWidth: 300, marginBottom: 24 }}>{search || filterType !== 'all' ? t('plNoResultsDesc') : t('plNoProjectsDesc')}</p>
          {!search && filterType === 'all' && (
            <button className="btn-primary" onClick={onNewProject}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              {t('plCreateFirstProject')}
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
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20, color, background: colorBg, border: `1px solid ${colorBd}` }}>{isPublic ? t('publicBadge') : t('internalBadge')}</span>
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
                    <p style={{ fontSize: 12, color: 'var(--dimmed)', fontStyle: 'italic', marginBottom: 16 }}>{t('plNoDescription')}</p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--border3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                      {project.generations_count || 0} {project.generations_count !== 1 ? t('plGenerationsPlural') : t('plGeneration')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {timeAgo(project.created_at)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color, letterSpacing: '.5px', textTransform: 'uppercase' }}>
                      {t('plOpen')}
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
              {t('plPrev')}
              </button>
              {Array.from({ length: projTotalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setProjPage(p)}
                  style={{ width: 34, height: 34, borderRadius: 8, background: projPage === p ? 'linear-gradient(135deg,var(--indigo),#4f46e5)' : 'var(--card)', border: projPage === p ? 'none' : '1px solid var(--border)', color: projPage === p ? '#fff' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, boxShadow: projPage === p ? '0 4px 12px rgba(99,102,241,.35)' : 'none', transform: projPage === p ? 'scale(1.08)' : 'scale(1)', transition: 'all .18s' }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setProjPage(p => Math.min(projTotalPages, p + 1))} disabled={projPage === projTotalPages}
                style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', color: projPage === projTotalPages ? 'var(--muted)' : 'var(--text)', cursor: projPage === projTotalPages ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, opacity: projPage === projTotalPages ? 0.5 : 1 }}>
                {t('plNext')}
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
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{t('plEditProject')}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{t('plEditProjectDesc')}</div>
              </div>
              <button onClick={() => setEditingProject(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 8 }}>{t('plProjectNameLabel')}</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={60} placeholder={t('cpNamePlaceholder')} autoFocus
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,.03)', border: `1.5px solid ${editName.trim() ? 'rgba(99,102,241,.4)' : 'rgba(255,255,255,.08)'}`, color: '#e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', transition: 'border-color .2s' }}
                />
                <div style={{ fontSize: 10, color: '#475569', marginTop: 4, textAlign: 'right' }}>{editName.length}/60</div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 8 }}>
                  {t('plDescriptionOptional')} <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({t('optionalBadge')})</span>
                </label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} maxLength={280} rows={3} placeholder={t('cpDescPlaceholder')}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,.03)', border: '1.5px solid rgba(255,255,255,.08)', color: '#e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.08)'}
                />
                <div style={{ fontSize: 10, color: '#475569', marginTop: 4, textAlign: 'right' }}>{editDesc.length}/280</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)', marginBottom: 24 }}>
                <svg width="13" height="13" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                <span style={{ fontSize: 11, color: '#f59e0b' }}>{t('plTypeLockedNotice').replace('{type}', editingProject.type)}</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEditingProject(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t('plCancel')}
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
                  {editSaving ? <><span className="spinner" /> {t('saving')}</> : <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> {t('saveChanges')}</>}
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
     <button onClick={onBack} style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 8, marginBottom: 20,
    background: 'var(--card)', border: '1.5px solid var(--border2)',
    color: 'var(--sub)', fontSize: 11, fontWeight: 700,
    letterSpacing: '.5px', cursor: 'pointer',
    transition: 'all .22s cubic-bezier(.22,1,.36,1)',
    boxShadow: '0 1px 3px rgba(0,0,0,.2)',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.background = 'var(--indigo-bg)';
    e.currentTarget.style.color = 'var(--indigo3)';
    e.currentTarget.style.borderColor = 'var(--indigo-border)';
    e.currentTarget.style.transform = 'translateX(-3px)';
    e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,.15)';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.background = 'var(--card)';
    e.currentTarget.style.color = 'var(--sub)';
    e.currentTarget.style.borderColor = 'var(--border2)';
    e.currentTarget.style.transform = 'translateX(0)';
    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.2)';
  }}
>
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
  Back to Projects
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
        item.username || saved.username || '',
        item.password || saved.password || ''
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

const getProjectTypes = (t) => [
  { id: 'public',  label: t('cpTypePublicLabel'),  desc: t('cpTypePublicDesc'),  Icon: Globe, accent: '#4F86E8' },
  { id: 'private', label: t('cpTypePrivateLabel'), desc: t('cpTypePrivateDesc'), Icon: Lock,  accent: '#6D5DFC' },
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
 
export function CreateProjectPanel({ onProjectCreated, goTo }) {
  const { t } = useLang();
  const PROJECT_TYPES = getProjectTypes(t);
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
    if (!name.trim()) { setNameError(t('cpNameRequired')); nameRef.current?.focus(); return; }
    if (!projectType) return;
    setSubmitting(true);
    try {
      const res = await api.post('/projects', {
        name: name.trim(), type: projectType, description: description.trim(),
      });
      onProjectCreated(res.data);
    } catch (err) {
      console.error(err);
      setNameError(t('cpCreateError'));
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
      <div className="p-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="p-title">{t('cpTitle1')} <span className="g">{t('cpTitle2')}</span></h1>
          <p className="p-sub">{t('cpSubtitle')}</p>
        </div>

        <button
          type="button"
          onClick={() => goTo('project')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 10,
            background: 'var(--indigo-bg)', border: '1.5px solid var(--indigo-border)',
            color: 'var(--indigo3)', fontSize: 12, fontWeight: 700,
            letterSpacing: '.5px', cursor: 'pointer', transition: 'all .2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--indigo2)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--indigo2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--indigo-bg)'; e.currentTarget.style.color = 'var(--indigo3)'; e.currentTarget.style.borderColor = 'var(--indigo-border)'; }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          {t('backToProject')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT COLUMN ── */}
        <div className="cpv5-left">

          {/* Step 1 — Project type */}
          <div className="cpv5-section">
            <div className="cpv5-section-header">
              <span className="cpv5-sec-num">01</span>
              <div>
                <div className="cpv5-sec-title">{t('cpProjectType')}</div>
                <div className="cpv5-sec-sub">{t('cpWhatTesting')}</div>
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
      <div className="cpv5-sec-title">{t('cpProjectName')}</div>
      <div className="cpv5-sec-sub">{t('cpGiveName')}</div>
    </div>
  </div>

            <div className={`cpv5-input-wrap${name ? ' filled' : ''}${nameError ? ' error' : ''}`}>
  <span className="cpv5-input-ico"><FileText size={16} /></span>
              <input
                ref={nameRef}
                className="cpv5-input"
                placeholder={t('cpNamePlaceholder')}
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
<div className="cpv5-sec-title">{t('cpDescription')}</div>                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 1,
                    color: 'var(--indigo3)', background: 'var(--indigo-bg)',
                    border: '1px solid var(--indigo-border)', borderRadius: 8,
                    padding: '1px 7px', textTransform: 'uppercase',
                  }}>
                    {t('optionalBadge')}
                  </span>
                </div>
                <div className="cpv5-sec-sub">{t('cpDescSub')}</div>
              </div>
            </div>
            <div className="cpv5-textarea-wrap">
  <span className="cpv5-textarea-ico"><IconAlignLeft size={16} /></span>
  <textarea
    className="cpv5-textarea"
    rows={4}
    maxLength={280}
    placeholder={t('cpDescPlaceholder')}
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
            {t('cpLaunchProject')}
          </button>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="cpv5-right">

          {/* ── Progress card (v6 — carte unique, plus de doublon) ── */}
          <div className="cpv6-progress-outer">

            <div className="cpv6-progress-badge">
              <span className="cpv6-progress-badge-dot" />
              {t('cpProgress')}
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
                <div className="cpv6-progress-title">{t('cpSetupProgress')}</div>
                <div className="cpv6-progress-subtitle">
                  {progress === 100
                    ? t('cpAllSet')
                    : isReady
                      ? t('cpRequiredComplete')
                      : t('cpStepsRemaining')
                          .replace('{done}', stepDone.filter(Boolean).length)
                          .replace('{total}', stepDone.length)}
                </div>
              </div>
            </div>

            <div className="cpv6-steps">
              {[
                { key: 'type', label: t('cpProjectType'), val: selectedType?.label, optional: false, weight: 40, Icon: selectedType?.Icon || Settings2, color: selectedType ? (TYPE_COLORS[projectType]?.tc) : '#6D5DFC' },
                { key: 'name', label: t('cpProjectName'), val: name.trim(), optional: false, weight: 40, Icon: FileText, color: '#4F86E8' },
                { key: 'desc', label: t('cpDescription'), val: description.trim(), optional: true, weight: 20, Icon: IconAlignLeft, color: '#10B981' },
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
{s.optional && !done && <span className="cpv6-step-optional">{t('optionalBadge')}</span>}                      </div>
                      <div className={`cpv6-step-val${done ? ' filled' : ''}`}>
{s.val || (s.optional ? t('cpSkipped') : t('cpWaitingInput'))}                      </div>
                    </div>
                    {i < arr.length - 1 && <div className="cpv6-step-connector" />}
                  </div>
                );
              })}
            </div>

            <div className={`cpv6-status ${isReady ? 'ready' : 'waiting'}`}>
  <span className={`cpv6-status-dot ${isReady ? 'ready-pulse' : ''}`} />
  {isReady ? t('cpReadyLaunch') : t('cpPercentLeft').replace('{pct}', 100 - progress)}
</div>
          </div>

          {/* What happens next card */}
          <div className="gp4-how-card">
            <div className="gp4-how-head">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              {t('cpWhatNext')}
            </div>
            <div className="gp4-how-steps">
              {[
                { n: '01', title: t('cpStep1Title'), desc: t('cpStep1Desc'), Icon: IconFolder, color: '#6D5DFC' },
                { n: '02', title: t('cpStep2Title'), desc: t('cpStep2Desc'), Icon: IconLink,   color: '#0EA5E9' },
                { n: '03', title: t('cpStep3Title'), desc: t('cpStep3Desc'), Icon: IconRobot,  color: '#F59E0B' },
                { n: '04', title: t('cpStep4Title'), desc: t('cpStep4Desc'), Icon: IconFileText, color: '#10B981' },
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

const [docFiles, setDocFiles] = useState([]);
const [dragOver, setDragOver] = useState(false);

  const [urlValid, setUrlValid] = useState(() => {
  if (!initialUrl) return null;
  try { new URL(initialUrl); return true; } catch { return false; }
});

  const isInternal = project?.type === 'private' || project?.type === 'internal';


useEffect(() => {
  if (isInternal && username && password && initialUrl) {
    localStorage.setItem(`creds-${initialUrl}`, JSON.stringify({ username, password }));
  }
}, [username, password]);

 const PUBLIC_TEST_TYPES = [
  { key: 'smoke',       label: t('smokeLabel'),       desc: t('smokeDesc'),       letter: 'S', letterClass: 'gp4-letter-s', badge: t('badgeQuick'),    badgeClass: 'gp-badge-quick', time: '~20s'  },
  { key: 'functional',  label: t('functionalLabel'),  desc: t('functionalDesc'),  letter: 'F', letterClass: 'gp4-letter-f', badge: t('badgeMedium'),   badgeClass: 'gp-badge-mid',   time: '~45s' },
  { key: 'performance', label: t('performanceLabel'), desc: t('performanceDesc'), letter: 'P', letterClass: 'gp4-letter-r', badge: t('badgeAdvanced'), badgeClass: 'gp-badge-full',  time: '~2min' },
  { key: 'seo', label: t('seoLabel'), desc: t('seoDesc'), letter: 'S', letterClass: 'gp4-letter-seo', badge: t('publicBadge'), badgeClass: 'gp-badge-seo', time: '~50s' },
];
 const INTERNAL_TEST_TYPES = [
  { key: 'smoke',       label: t('smokeLabel'),       desc: t('smokeDesc'),       letter: 'S', letterClass: 'gp4-letter-s',    badge: t('badgeQuick'),     badgeClass: 'gp-badge-quick', time: '~20s'  },
  { key: 'functional',  label: t('functionalLabel'),  desc: t('functionalDesc'),  letter: 'F', letterClass: 'gp4-letter-f',    badge: t('badgeMedium'),    badgeClass: 'gp-badge-mid',   time: '~45s' },
  { key: 'performance', label: t('performanceLabel'), desc: t('performanceDesc'), letter: 'P', letterClass: 'gp4-letter-r',    badge: t('badgeAdvanced'),  badgeClass: 'gp-badge-full',  time: '~2min' },
  { key: 'api',         label: t('apiLabel'),         desc: t('apiDesc'),         letter: 'A', letterClass: 'gp4-letter-api',  badge: t('badgeTechnical'), badgeClass: 'gp-badge-tech',  time: '~1min' },
  { key: 'regression',  label: t('regressionLabel'),  desc: t('regressionDesc'),  letter: 'R', letterClass: 'gp4-letter-reg',  badge: t('badgeThorough'),  badgeClass: 'gp-badge-thoro', time: '~4min' },
  { key: 'security',    label: t('securityLabel'),    desc: t('securityDesc'),    letter: 'S', letterClass: 'gp4-letter-sec',  badge: t('badgeCritical'),  badgeClass: 'gp-badge-crit',  time: '~6min' },
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
  if (!url) return;
   if (isInternal && (!username.trim() || !password.trim())) {
    setError(t('generationErrorCreds'));
    return;
  }
  setLoad(true); setError('');

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

if (genData.test_type === 'performance' || genData.result?.test_type === 'performance') {
  genData.result = genData.result || {};
  genData.result.performance = genData.performance || genData.result?.performance;
  genData.result.test_cases  = genData.result.test_cases || genData.generation?.test_cases || [];
}

setGeneration(genData);
goTo('execution');
  } catch (err) {
    setError(err.response?.data?.error || t('genericError'));
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
  const urlLabel       = isInternal ? t('targetUrlOrApi') : t('targetUrl');
  const urlHint        = isInternal ? t('urlHintInternal') : t('urlHintPublic');
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

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

  return (
    <div className="panel">
      
      <div className="p-header" style={{ marginBottom: 32 }}>
  <div>
    <h1 className="p-title">{t('new')} <span className="g">{t('generation')}</span></h1>
    <p className="p-sub" style={{ marginTop: 6, color: 'var(--muted)', fontWeight: 500 }}>{t('generateDesc')}</p>
    {project && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'var(--card)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)' }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          {project.name}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: isInternal ? 'rgba(139,92,246,.1)' : 'rgba(79,134,232,.1)', border: `1px solid ${isInternal ? 'rgba(139,92,246,.25)' : 'rgba(79,134,232,.25)'}`, fontSize: 12, fontWeight: 700, color: isInternal ? '#8b5cf6' : '#4f86e8' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: isInternal ? '#8b5cf6' : '#4f86e8' }} />
          {isInternal ? t('internalBadge') : t('publicBadge')}
        </div>
      </div>
    )}
  </div>

  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
   <button
  type="button"
  onClick={() => goTo('project')}
  style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '10px 18px', borderRadius: 10,
    background: 'var(--indigo-bg)', border: '1.5px solid var(--indigo-border)',
    color: 'var(--indigo3)', fontSize: 12, fontWeight: 700,
    letterSpacing: '.5px', cursor: 'pointer', transition: 'all .2s'
  }}
  onMouseEnter={e => { e.currentTarget.style.background = 'var(--indigo2)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--indigo2)'; }}
  onMouseLeave={e => { e.currentTarget.style.background = 'var(--indigo-bg)'; e.currentTarget.style.color = 'var(--indigo3)'; e.currentTarget.style.borderColor = 'var(--indigo-border)'; }}
>
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
  {t('backToProject')}
</button>

    {isReady && (
      <div className="gp-ready-badge" style={loading ? { background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.3)', color: 'var(--indigo2)' } : {}}>
        <span className="gp-ready-dot" style={loading ? { background: 'var(--indigo2)' } : {}} />
        {loading ? t('inExecution') : t('readyToGenerate')}
      </div>
    )}
  </div>
</div>

      {error && <div className="error-msg" style={{ marginBottom: 24 }}>✗ {error}</div>}

      <form onSubmit={submit}>
        <div className="gp4-layout">
          <div className="gp4-left gp4-stack-fix">

            {/* ── Row 1 — URL + Credentials side by side ── */}
            <div className={isInternal ? 'gp4-row-2col' : ''}>
              <div className="gp4-section">
                <div className="gp4-section-header">
                  <span className="gp4-num">01</span>
                  <div><div className="gp4-section-title">{urlLabel}</div><div className="gp4-section-sub">{urlHint}</div></div>
                </div>
                <div className={`gp4-url-wrap${urlValid === true ? ' valid' : urlValid === false ? ' invalid' : ''}`}>
                  {isInternal ? <Lock size={16} color="var(--indigo2)" /> : <Globe size={16} color="var(--indigo2)" />}
                  <input type="url" placeholder={urlPlaceholder} value={url} onChange={e => { setUrl(e.target.value); validateUrl(e.target.value); }} required />
                  {urlValid === true  && <Check size={16} color="#10b981" strokeWidth={2.5} />}
                  {urlValid === false && <X size={16} color="#ef4444" strokeWidth={2.5} />}
                </div>
                {urlValid === false && <div className="gp4-url-error">{t('urlInvalid')}</div>}

                {isInternal && !url && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)', alignSelf: 'center' }}>{t('quickFill')}</span>
                    {['https://anpe.dgac.tn', 'https://api.internal.company.com/v1'].map(sug => (
                      <button
                        type="button"
                        key={sug}
                        onClick={() => { setUrl(sug); validateUrl(sug); }}
                        style={{
                          padding: '5px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                          color: 'var(--indigo3)', background: 'var(--indigo-bg)',
                          border: '1px solid var(--indigo-border)', cursor: 'pointer'
                        }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isInternal && (
                <div className="gp4-section">
                  <div className="gp4-section-header">
                    <span className="gp4-num">02</span>
                    <div><div className="gp4-section-title">{t('credentialsTitle')}</div><div className="gp4-section-sub">{t('credentialsDesc')}</div></div>
                  </div>

                  {/* Honeypot fields — piège l'autofill du navigateur */}
                  <input type="text"     style={{ display: 'none' }} readOnly tabIndex={-1} />
                  <input type="password" style={{ display: 'none' }} readOnly tabIndex={-1} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="gp4-url-wrap">
                      <Mail size={16} color="var(--indigo2)" />
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
                    <div className="gp4-url-wrap">
                      <Lock size={16} color="var(--indigo2)" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoComplete="new-password"
                        name={`pwd-${Math.random()}`}
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Row 2 — Test Type (full width) ── */}
            <div className="gp4-section">
              <div className="gp4-section-header">
                <span className="gp4-num">{isInternal ? '03' : '02'}</span>
                <div><div className="gp4-section-title">{t('testTypeTitle')}</div><div className="gp4-section-sub">{isInternal ? t('testTypeDescInternal') : t('testTypeDescPublic')}</div></div>
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
                      <div className="gp4-radio">{testType === tt.key && <Check size={12} color="var(--indigo2)" strokeWidth={3} />}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Row 3 — Framework + Project Context side by side ── */}
            <div className={isInternal ? 'gp4-row-2col' : ''}>
              <div className="gp4-section gp4-section--compact">
                <div className="gp4-section-header">
                  <span className="gp4-num">{isInternal ? '04' : '03'}</span>
                  <div><div className="gp4-section-title">Automated Testing Frameworks and Tools</div><div className="gp4-section-sub">Pick the automation tool that will power and execute your test scripts</div></div>
                 </div>
                <div className="gp4-frameworks">
                  {FRAMEWORKS.map(f => (
                    <div key={f.key} className={`gp4-fw-card${fw === f.key ? ' selected' : ''}${f.note ? ' gp4-fw-card--optional' : ''}`} onClick={() => setFw(f.key)} style={{ '--fw-color': f.color }}>
                      <div className={`gp4-fw-letter-badge ${f.letterClass}`}>{f.letters}</div>
                      <span className="gp4-fw-name">{f.key}</span>
                      {f.note && <span className="gp4-fw-note">{f.note}</span>}
                      {fw === f.key && (<div className="gp4-fw-check"><Check size={10} strokeWidth={3} /></div>)}
                    </div>
                  ))}
                </div>
              </div>

              {isInternal && (
                <div className="gp4-section gp4-section--compact">
                  <div className="gp4-section-header">
                    <span className="gp4-num">05</span>
                    <div><div className="gp4-section-title">{t('projectContextTitle')} <span className="gp4-optional-badge">{t('optionalBadge')}</span></div><div className="gp4-section-sub">{t('projectContextDesc')}</div></div>
                  </div>

                  <label
                    className={`gp4-dropzone${dragOver ? ' drag' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                  >
                    <input type="file" multiple accept=".pdf,.txt,.json,.yaml,.yml,.md,.docx" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
                    <div className="gp4-dropzone-icon">
                      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <div className="gp4-dropzone-title">{t('dragDrop')}</div>
                    <div className="gp4-dropzone-sub">{t('clickBrowse')}</div>
                  </label>

                  {docFiles.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                      {docFiles.map(f => (
                        <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--indigo-bg)', border: '1px solid var(--indigo-border)', borderRadius: 8 }}>
                          <svg width="13" height="13" fill="none" stroke="var(--indigo2)" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <span style={{ fontSize: 12, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{formatSize(f.size)}</span>
                          <button type="button" onClick={() => removeFile(f.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button type="button" className="gp4-submit" disabled={loading || !isReady}
              onClick={() => { if (!isReady) return; submit({ preventDefault: () => {} }); }}>
              {loading ? (<><span className="spinner" /> {t('analyzingGenerating')}</>) : (
                <><Wand2 size={15} strokeWidth={2.5} />{t('generateTests')}{isReady && <ArrowUpRight size={14} className="gp4-submit-arrow" />}</>
              )}
            </button>
          </div>

          <div className="gp4-right">
            <div className="gp4-summary-card">
  <div className="gp4-summary-head">
    <Check size={13} strokeWidth={2.5} />
    {t('configSummary')}
  </div>

  <div className="gp4-progress-mini">
    <div className="gp4-progress-mini-track">
      <div
        className={`gp4-progress-mini-fill${isReady ? ' ready' : ''}`}
        style={{
          width: `${Math.round(
            ([url && urlValid, testType, fw, !isInternal || (username && password)]
              .filter(Boolean).length /
              4) * 100
          )}%`
        }}
      />
    </div>
    <div className="gp4-progress-mini-txt">
      <span>{[url && urlValid, testType, fw, !isInternal || (username && password)].filter(Boolean).length}/4 {t('completedLabel')}</span>
      <span>{isReady ? t('readyShort') : t('inProgress')}</span>
    </div>
  </div>

  <div className="gp4-summary-body">
    {project && (<>
      <div className={`gp4-sum-row${project ? ' filled' : ''}`}>
        <div className="gp4-sum-row-left">
          <div className="gp4-sum-icon"><Folder size={12} /></div>
          <span className="gp4-sum-label">{t('projectLabel')}</span>
        </div>
        <span className="gp4-sum-val" style={{ fontSize: 11, color: 'var(--indigo3)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{project.name}</span>
      </div>
      <div className="gp4-sum-divider" />
    </>)}

    <div className={`gp4-sum-row${url && urlValid ? ' filled' : ''}`}>
      <div className="gp4-sum-row-left">
        <div className="gp4-sum-icon">{isInternal ? <Lock size={12} /> : <Globe size={12} />}</div>
        <span className="gp4-sum-label">URL</span>
      </div>
      {url ? <span className="gp4-sum-val" style={{ color: urlValid ? 'var(--green)' : 'var(--red)', fontSize: 11, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{url}</span> : <span className="gp4-sum-empty">{t('notSet')}</span>}
    </div>
    <div className="gp4-sum-divider" />

    <div className={`gp4-sum-row${testType ? ' filled' : ''}`}>
      <div className="gp4-sum-row-left">
        <div className="gp4-sum-icon"><FlaskConical size={12} /></div>
        <span className="gp4-sum-label">{t('testTypeTitle')}</span>
      </div>
      <span className="gp4-sum-val">{selectedType?.label || <span className="gp4-sum-empty">{t('notSelected')}</span>}</span>
    </div>
    <div className="gp4-sum-divider" />

    <div className={`gp4-sum-row${fw ? ' filled' : ''}`}>
      <div className="gp4-sum-row-left">
        <div className="gp4-sum-icon" style={fw ? { background: `${selectedFw?.color}22`, borderColor: `${selectedFw?.color}55`, color: selectedFw?.color } : {}}><Code2 size={12} /></div>
        <span className="gp4-sum-label">{t('frameworkTitle')}</span>
      </div>
      <span className="gp4-sum-val">{selectedFw?.key || <span className="gp4-sum-empty">{t('notSelected')}</span>}</span>
    </div>
    <div className="gp4-sum-divider" />

    {isInternal && username && (<>
      <div className="gp4-sum-row filled">
        <div className="gp4-sum-row-left">
          <div className="gp4-sum-icon"><Mail size={12} /></div>
          <span className="gp4-sum-label">{t('emailAddress')}</span>
        </div>
        <span className="gp4-sum-val" style={{ fontSize: 11, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{username}</span>
      </div>
      <div className="gp4-sum-divider" />
    </>)}
    {isInternal && password && (<>
      <div className="gp4-sum-row filled">
        <div className="gp4-sum-row-left">
          <div className="gp4-sum-icon"><Lock size={12} /></div>
          <span className="gp4-sum-label">{t('password')}</span>
        </div>
        <span className="gp4-sum-val">{'•'.repeat(Math.min(password.length, 8))}</span>
      </div>
      <div className="gp4-sum-divider" />
    </>)}

    {docFiles.length > 0 && (<>
      <div className="gp4-sum-row filled">
        <div className="gp4-sum-row-left">
          <div className="gp4-sum-icon" style={{ background: 'rgba(127,119,221,.15)', borderColor: 'rgba(127,119,221,.4)', color: '#7F77DD' }}><FileUp size={12} /></div>
          <span className="gp4-sum-label">{t('contextLabel')}</span>
        </div>
        <span className="gp4-sum-val" style={{ color: '#7F77DD' }}>{docFiles.length} {docFiles.length > 1 ? t('filesWord') : t('fileWord')}</span>
      </div>
      <div className="gp4-sum-divider" />
    </>)}

    <div className="gp4-sum-row">
      <div className="gp4-sum-row-left">
        <div className="gp4-sum-icon"><Clock size={12} /></div>
        <span className="gp4-sum-label">{t('estTime')}</span>
      </div>
      <span className="gp4-sum-val" style={{ color: 'var(--indigo2)' }}>{selectedType?.time || '—'}</span>
    </div>
  </div>

  <div className={`gp4-summary-status ${isReady ? 'ready' : 'waiting'}`}>
    <span className={`gp4-status-dot ${isReady ? 'ready' : ''}`} />
    {isReady ? t('readyToGenerate') : t('completeAllFields')}
  </div>
</div>
            <div className="gp4-how-card">
              <div className="gp4-how-head"><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>{t('howItWorks')}</div>
              <div className="gp4-how-steps">
             {[
  { n: '01', title: t('domScanning'), desc: t('domScanningDesc'), icon: <Search size={16} />, color: '#4F86E8' },
  { n: '02', title: t('aiAnalysis'), desc: t('aiAnalysisDesc'), icon: <Bot size={16} />, color: '#8B5CF6' },
  { n: '03', title: t('testGeneration'), desc: t('testGenerationDesc'), icon: <Sparkles size={16} />, color: '#F59E0B' },
  { n: '04', title: t('scriptExport'), desc: t('scriptExportDesc'), icon: <FileText size={16} />, color: '#10B981' },
].map((s, i, arr) => (
  <div key={s.n} className="gp4-how-step">
    <div className="gp4-how-step-left">
      <div className="gp4-how-circle" style={{ '--step-color': s.color }}>{s.icon}</div>
      {i < arr.length - 1 && <div className="gp4-how-line" />}
    </div>
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

const PERF_METRIC_LABELS = {
  load_time_ms:   ['Page Load Time', 'ms'],
  fcp_ms:         ['First Contentful Paint', 'ms'],
  lcp_ms:         ['Largest Contentful Paint', 'ms'],
  tti_ms:         ['Time to Interactive', 'ms'],
  request_count:  ['Network Requests', ''],
  total_size_kb:  ['Total Resource Size', 'KB'],
  dom_size:       ['DOM Elements', ''],
  js_size_kb:     ['JavaScript Size', 'KB'],
  css_size_kb:    ['CSS Size', 'KB'],
  image_size_kb:  ['Images Size', 'KB'],
};
 
const PERF_CAT_MAP = {
  load_time_ms: 'TIMING', fcp_ms: 'TIMING', lcp_ms: 'TIMING', tti_ms: 'TIMING',
  request_count: 'NETWORK', total_size_kb: 'NETWORK',
  js_size_kb: 'ASSETS', css_size_kb: 'ASSETS', image_size_kb: 'ASSETS',
  dom_size: 'DOM',
};
 
const PERF_SEVERITY = {
  load_time_ms: 'HIGH', fcp_ms: 'HIGH', lcp_ms: 'HIGH', tti_ms: 'MEDIUM',
  request_count: 'MEDIUM', total_size_kb: 'MEDIUM', js_size_kb: 'HIGH',
  css_size_kb: 'LOW', image_size_kb: 'MEDIUM', dom_size: 'LOW',
};
 
const PERF_SCENARIO_PLAN = [
  ['load_time_ms',  'Page Load Time',           'Total time from navigation start to the load event firing',        'timing',  'window.performance.timing',                    'HIGH'],
  ['fcp_ms',        'First Contentful Paint',   'Time until the first text or image is painted on screen',           'timing',  'PerformanceObserver — paint',                   'HIGH'],
  ['lcp_ms',        'Largest Contentful Paint', 'Time until the largest visible element finishes rendering',         'timing',  'PerformanceObserver — largest-contentful-paint', 'HIGH'],
  ['tti_ms',        'Time to Interactive',      'Time until the page is fully interactive for the user',             'timing',  'domInteractive / Long Tasks API',               'MEDIUM'],
  ['request_count', 'Network Requests Count',   'Total number of HTTP requests fired to load the page',              'network', "performance.getEntriesByType('resource')",     'MEDIUM'],
  ['total_size_kb', 'Total Page Size',          'Combined transfer size of every resource loaded',                   'network', 'resource-timing-api transferSize',              'MEDIUM'],
  ['js_size_kb',    'JavaScript Bundle Size',   'Combined size of all JavaScript files loaded',                      'assets',  'script[src] transferSize',                      'HIGH'],
  ['css_size_kb',   'CSS Stylesheets Size',     'Combined size of all CSS files loaded',                             'assets',  "link[rel=stylesheet] transferSize",             'LOW'],
  ['image_size_kb', 'Images Total Size',        'Combined size of every image loaded on the page',                   'assets',  'img transferSize aggregate',                    'MEDIUM'],
  ['dom_size',      'DOM Elements Count',       'Total number of DOM nodes rendered on the page',                    'dom',     "document.querySelectorAll('*').length",         'LOW'],
];
 
const SECTION_META = {
  timing:  { label: 'Timing',  color: '#6366f1', desc: 'Core Web Vitals — how fast the page loads and becomes usable' },
  network: { label: 'Network', color: '#0ea5e9', desc: 'Requests and total bytes transferred over the wire' },
  assets:  { label: 'Assets',  color: '#f97316', desc: 'Size of JS, CSS, and image resources' },
  dom:     { label: 'DOM',     color: '#8b5cf6', desc: 'Structural complexity of the rendered page' },
};
 
const PRI_COLOR = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981', critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' };
const PRI_BG    = { critical: 'rgba(239,68,68,.08)', high: 'rgba(249,115,22,.08)', medium: 'rgba(245,158,11,.08)', low: 'rgba(16,185,129,.08)' };
 
function gradeFromScore(score) {
  if (score >= 90) return ['A', '#10b981'];
  if (score >= 75) return ['B', '#22c55e'];
  if (score >= 50) return ['C', '#f59e0b'];
  if (score >= 25) return ['D', '#ef4444'];
  return ['F', '#dc2626'];
}
 
function fmtVal(key, value, unit) {
  if (value == null) return 'N/A';
  if (['load_time_ms', 'fcp_ms', 'lcp_ms', 'tti_ms'].includes(key)) {
    const ms = Number(value);
    return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;
  }
  return `${Number(value).toLocaleString()}${unit}`;
}
 
// ── SVG chart builders (pas de dépendance externe) ───────────────────────────
 
function svgScoreGauge(score, color) {
  const r = 54, c = 2 * Math.PI * r, offset = c - (score / 100) * c;
  return `
    <svg width="160" height="160" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r="${r}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="10"/>
      <circle cx="70" cy="70" r="${r}" fill="none" stroke="${color}" stroke-width="10"
        stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
        stroke-linecap="round" transform="rotate(-90 70 70)"/>
      <text x="70" y="66" text-anchor="middle" font-size="30" font-weight="800" fill="${color}"
        font-family="'Cormorant Garamond',Georgia,serif">${score}</text>
      <text x="70" y="88" text-anchor="middle" font-size="11" fill="#64748b"
        font-family="'DM Sans',sans-serif">/ 100</text>
    </svg>`;
}
 
function svgRadarChart(catScores) {
  // catScores: [{label, color, value(0-100)}]
  const n = catScores.length, cx = 180, cy = 165, maxR = 120;
  const angle = i => (Math.PI * 2 * i) / n - Math.PI / 2;
  const ringPts = frac => catScores.map((_, i) => {
    const a = angle(i), r = maxR * frac;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
  const dataPts = catScores.map((s, i) => {
    const a = angle(i), r = maxR * (Math.max(0, Math.min(100, s.value)) / 100);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
  const labels = catScores.map((s, i) => {
    const a = angle(i), lr = maxR + 26;
    const x = cx + lr * Math.cos(a), y = cy + lr * Math.sin(a);
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle"
      font-size="11" font-weight="800" fill="#e2e8f0">${s.label}</text>`;
  }).join('');
  const valueLabels = catScores.map((s, i) => {
    const a = angle(i), r = maxR * (Math.max(0, Math.min(100, s.value)) / 100) + 14;
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    return `<circle cx="${cx + maxR * (s.value / 100) * Math.cos(a)}" cy="${cy + maxR * (s.value / 100) * Math.sin(a)}"
      r="4" fill="${s.color}" stroke="#0d1526" stroke-width="1.5"/>
      <text x="${x}" y="${y}" text-anchor="middle" font-size="10" font-weight="700"
        fill="#94a3b8">${s.value}%</text>`;
  }).join('');
  const rings = [0.25, 0.5, 0.75, 1].map(f =>
    `<polygon points="${ringPts(f)}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1"/>`
  ).join('');
  const spokes = catScores.map((_, i) => {
    const a = angle(i);
    return `<line x1="${cx}" y1="${cy}" x2="${cx + maxR * Math.cos(a)}" y2="${cy + maxR * Math.sin(a)}"
      stroke="rgba(255,255,255,.06)" stroke-width="1"/>`;
  }).join('');
  return `
    <svg width="360" height="330" viewBox="0 0 360 330">
      ${rings}${spokes}
      <polygon points="${dataPts}" fill="rgba(99,102,241,.22)" stroke="#6366f1" stroke-width="2"/>
      ${valueLabels}${labels}
    </svg>`;
}
 
function svgCategoryBreakdown(cats) {
  // cats: [{label, color, pass, fail}]
  const w = 640, h = 260, padL = 40, padB = 40, padT = 20, barW = 70, gap = 46;
  const maxV = Math.max(1, ...cats.map(c => c.pass + c.fail));
  const scaleY = (h - padT - padB) / maxV;
  const bars = cats.map((c, i) => {
    const x = padL + i * (barW + gap);
    const passH = c.pass * scaleY, failH = c.fail * scaleY;
    const yPass = h - padB - passH;
    const yFail = yPass - failH;
    return `
      <rect x="${x}" y="${yFail}" width="${barW}" height="${failH}" fill="#ef4444" rx="3"/>
      <rect x="${x}" y="${yPass}" width="${barW}" height="${passH}" fill="#10b981" rx="3"/>
      <text x="${x + barW / 2}" y="${h - padB + 18}" text-anchor="middle" font-size="11"
        font-weight="700" fill="#94a3b8">${c.label}</text>
      <text x="${x + barW / 2}" y="${yFail - 6}" text-anchor="middle" font-size="10"
        font-weight="700" fill="#e2e8f0">${c.pass + c.fail}</text>`;
  }).join('');
  const gridLines = [0.25, 0.5, 0.75, 1].map(f => {
    const y = h - padB - (h - padT - padB) * f;
    return `<line x1="${padL - 10}" y1="${y}" x2="${w - 10}" y2="${y}" stroke="rgba(255,255,255,.05)"/>`;
  }).join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${gridLines}${bars}</svg>`;
}
 
function svgHorizontalBars(items, { unitSuffix = '%', markerAt = null } = {}) {
  // items: [{label, value, display, color}]
  const rowH = 34, padL = 210, w = 640, h = items.length * rowH + 30;
  const maxV = Math.max(...items.map(it => it.value), markerAt || 0) * 1.15;
  const scaleX = (w - padL - 60) / maxV;
  const rows = items.map((it, i) => {
    const y = i * rowH + 14;
    const barW = Math.max(2, it.value * scaleX);
    return `
      <text x="${padL - 12}" y="${y + 14}" text-anchor="end" font-size="11"
        font-weight="700" fill="#94a3b8">${it.label}</text>
      <rect x="${padL}" y="${y}" width="${barW}" height="18" rx="4" fill="${it.color}"/>
      <text x="${padL + barW + 8}" y="${y + 14}" font-size="10.5" font-weight="700"
        fill="#e2e8f0">${it.display}</text>`;
  }).join('');
  const marker = markerAt != null
    ? `<line x1="${padL + markerAt * scaleX}" y1="4" x2="${padL + markerAt * scaleX}" y2="${h - 10}"
        stroke="#64748b" stroke-dasharray="4,3" stroke-width="1.2"/>
       <text x="${padL + markerAt * scaleX}" y="${h - 2}" text-anchor="middle" font-size="9"
        fill="#64748b">${markerAt}${unitSuffix}</text>`
    : '';
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${rows}${marker}</svg>`;
}
//  page of PerformanceExecutionPanel
function PerformanceExecutionPanel({ generation, onGenerationSaved }) {
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

setRunning(true); setTerminalLines([]); setDropdownOpen(false);
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
      if (onGenerationSaved) {
        onGenerationSaved({
          url: generation?.generation?.url || generation?.url || '',
          framework: generation?.framework || generation?.generation?.framework || 'Playwright',
          testType: 'performance',
          passCount: pass,
          failCount: fail,
          timestamp: Date.now(),
          durationMs: 0,
        });
      }
    }, 1200);
  };

  playAnimation();
}, [generation?.generation?.id, generation?.fresh]);


function downloadHtml_PerformancePublic() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const genId = generation?.generation?.id || 'nextest';
 
  const result    = generation?.result || {};
  const perfData  = result?.performance || generation?.performance || {};
  const tests     = result?.test_cases || result?.execution_results || [];
  const metrics   = perfData?.metrics || result?.metrics || {};
  const thresholds= perfData?.thresholds || {};
  const recs      = perfData?.recommendations || [];
  const score     = perfData?.global_score || 0;
  const scoreLabel= perfData?.score_label || 'N/A';
  const scoreColor= perfData?.score_color || '#f59e0b';
  const siteType  = perfData?.site_type || 'general';
  const analysis  = perfData?.site_analysis || '';
  const summary   = perfData?.performance_summary || '';
  const url       = generation?.generation?.url || generation?.url || '';
  const framework = generation?.framework || generation?.generation?.framework || 'Playwright';
 
  const statusByKey = {};
  tests.forEach(t => { if (t.metric_key) statusByKey[t.metric_key] = t.status; });
 
  const pass = Object.values(statusByKey).filter(s => s === 'pass').length;
  const fail = Object.values(statusByKey).filter(s => s === 'fail').length;
  const total = Object.keys(statusByKey).length || 1;
  const passRate = Math.round((pass / total) * 100);
 
  const [grade, gradeColor] = gradeFromScore(score);
 
  const secHdr = (icon, title, color = '#c9a227') => `
    <div style="display:flex;align-items:center;gap:10px;margin:36px 0 14px;
      padding-bottom:10px;border-bottom:2.5px solid ${color}">
      <span style="font-size:16px;color:${color};font-weight:800">■</span>
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;
        font-weight:700;color:#e2e8f0">${title}</span>
    </div>`;
 
  const tblWrap = (inner, accent = '#6366f1') => `
    <div style="background:#0d1526;border:1px solid ${accent}44;border-radius:14px;
      overflow:hidden;margin-bottom:20px;box-shadow:0 4px 20px rgba(0,0,0,.3)">
      <table style="width:100%;border-collapse:collapse">${inner}</table>
    </div>`;
 
  const thRow = cols => `
    <thead><tr style="background:#040914">
      ${cols.map(c => `<th style="padding:11px 14px;text-align:${c.align || 'left'};
        font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#4f6480;
        font-weight:700;white-space:nowrap">${c.l}</th>`).join('')}
    </tr></thead>`;
 
  // ── 1. HEADER ──────────────────────────────────────────────────────────
  const header = `
    <div class="anim" style="background:linear-gradient(135deg,#040914 0%,#0a1035 50%,#040914 100%);
      border:1px solid rgba(201,162,39,.15);border-radius:24px;padding:40px 48px;margin-bottom:32px;
      position:relative;overflow:hidden">
      <div style="position:absolute;bottom:0;left:0;right:0;height:3px;
        background:linear-gradient(90deg,transparent,#0d9488,transparent)"></div>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap">
        <div>
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:700;
            letter-spacing:4px;text-transform:uppercase;color:#e2e8f0">
            Nex<span style="color:#0d9488;font-style:italic;font-weight:300">Test</span>
          </div>
          <div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;
            color:#5eead4;opacity:.8;margin-top:2px">Performance Test Report (Public)</div>
        </div>
        <div style="text-align:right;font-size:11px;color:#64748b">
          Generated<br/><span style="color:#94a3b8">${dateStr} · ${timeStr}</span>
        </div>
      </div>
      <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;font-weight:700;
        color:#e2e8f0;margin-top:22px">Performance Test Report</div>
    </div>`;
 
  // ── Info box ───────────────────────────────────────────────────────────
  const infoRow = (l, v) => `
    <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
      <td style="padding:10px 14px;background:rgba(255,255,255,.02);color:#64748b;
        font-weight:700;font-size:12px;white-space:nowrap">${l}</td>
      <td style="padding:10px 14px;font-size:12px;color:#e2e8f0">${v}</td>
    </tr>`;
  const infoBox = tblWrap(`<tbody>
    ${infoRow('URL', url)}
    ${infoRow('Framework', `<span style="color:#0d9488;font-weight:700">${framework}</span>`)}
    ${infoRow('Test Type', `<span style="color:#0d9488;font-weight:700">Performance Test (Public)</span>`)}
    ${infoRow('Generated', now.toISOString().slice(0, 16).replace('T', '  '))}
  </tbody>`, '#0d9488');
 
  // ── 2. Stat cards ──────────────────────────────────────────────────────
  const statCards = [
    ['✅', pass, 'PASSED', '#10b981'],
    ['❌', fail, 'FAILED', '#ef4444'],
    ['📈', `${passRate}%`, 'PASS RATE', '#f59e0b'],
    ['🎯', score, 'SCORE', scoreColor],
    ['🔢', total, 'TOTAL', '#3b82f6'],
  ].map(([icon, val, lbl, c]) => `
    <div style="background:${c}12;border:1px solid ${c}33;border-radius:16px;padding:20px 14px;
      text-align:center">
      <div style="font-size:18px;margin-bottom:8px">${icon}</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:700;
        color:${c};line-height:1;margin-bottom:6px">${val}</div>
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:${c}99;
        text-transform:uppercase">${lbl}</div>
    </div>`).join('');
 
  const statsSection = `
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:6px">
      ${statCards}
    </div>
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:20px">
      Pass Rate is a simple count of metric checks. Score is severity-weighted —
      that is why the two numbers differ.
    </div>`;
 
  // ── 3. Performance Score (gauge hero) ─────────────────────────────────
  const scoreHero = `
    ${secHdr('■', 'Performance Score', scoreColor)}
    <div style="display:flex;align-items:center;gap:32px;flex-wrap:wrap;
      background:#0d1526;border:1.5px solid ${scoreColor}66;border-radius:16px;padding:26px 30px;
      margin-bottom:24px">
      <div>${svgScoreGauge(score, scoreColor)}</div>
      <div style="flex:1;min-width:280px">
        <div style="font-size:20px;font-weight:800;color:${scoreColor};margin-bottom:10px">
          ${scoreLabel}</div>
        <p style="font-size:13px;color:#94a3b8;line-height:1.7;margin:0 0 10px">${analysis}</p>
        ${summary ? `<p style="font-size:12px;color:#64748b;font-style:italic;margin:0 0 10px">
          ${summary}</p>` : ''}
        <div style="font-size:11px;color:#64748b">Detected site type:
          <b style="color:${scoreColor}">${siteType.toUpperCase()}</b> — thresholds adapted
          accordingly by AI.</div>
      </div>
    </div>`;
 
  // ── 4. How this report works ──────────────────────────────────────────
  const methodology = `
    ${secHdr('■', 'How This Report Works')}
    <p style="font-size:13px;color:#94a3b8;line-height:1.8;margin-bottom:24px">
      This performance audit measures 10 Web Vitals and resource metrics across 4 categories
      (Timing, Network, Assets, DOM) by rendering the page in a headless Chromium browser
      (Playwright) and capturing real navigation timing via the browser Performance API.
      Thresholds are adapted by AI based on the detected site type
      (<b style="color:#e2e8f0">${siteType.toUpperCase()}</b>).
    </p>`;
 
  // ── 5. Key Metrics table ───────────────────────────────────────────────
  const keyMetricsRows = Object.entries(PERF_METRIC_LABELS).map(([key, [label, unit]]) => {
    const value = metrics?.[key];
    const status = statusByKey[key];
    const sc = status === 'pass' ? '#10b981' : status === 'fail' ? '#ef4444' : status === 'skip' ? '#f59e0b' : '#94a3b8';
    const badge = status === 'pass' ? '✓ PASS' : status === 'fail' ? '■ FAIL' : status === 'skip' ? '■ WARN' : 'N/A';
    return `
      <tr style="border-left:3px solid ${sc};border-bottom:1px solid rgba(255,255,255,.04);
        background:${status === 'fail' ? 'rgba(239,68,68,.04)' : status === 'pass' ? 'rgba(16,185,129,.03)' : 'transparent'}">
        <td style="padding:11px 14px;font-weight:700;color:#e2e8f0;font-size:12.5px">${label}</td>
        <td style="padding:11px 14px;text-align:center;font-weight:800;font-size:13px;
          color:${sc}">${fmtVal(key, value, unit)}</td>
        <td style="padding:11px 14px;text-align:center">
          <span style="font-size:10px;font-weight:800;letter-spacing:1px;padding:3px 10px;
            border-radius:12px;color:${sc};background:${sc}18;border:1px solid ${sc}33">
            ${badge}</span>
        </td>
      </tr>`;
  }).join('');
  const keyMetrics = `
    ${secHdr('■', 'Key Metrics', '#0d9488')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Quick-glance summary of all measured metrics, Lighthouse-style.
    </div>
    ${tblWrap(`${thRow([{ l: 'Metric' }, { l: 'Value', align: 'center' }, { l: 'Status', align: 'center' }])}
      <tbody>${keyMetricsRows}</tbody>`, '#0d9488')}`;
 
  // ── 6. Performance Test Scenarios (grouped by section) ────────────────
  const bySectionPlan = {};
  PERF_SCENARIO_PLAN.forEach(row => {
    const sec = row[3];
    (bySectionPlan[sec] = bySectionPlan[sec] || []).push(row);
  });
  const scenariosHtml = ['timing', 'network', 'assets', 'dom'].map(sec => {
    const rows = bySectionPlan[sec] || [];
    if (!rows.length) return '';
    const sm = SECTION_META[sec];
    const trs = rows.map(([key, title, desc, , api, priority], i) => {
      const wasTested = key in statusByKey;
      const pc = PRI_COLOR[priority];
      return `
        <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
          <td style="padding:10px 14px;color:#64748b;text-align:center;font-weight:700;
            font-size:11px">${i + 1}</td>
          <td style="padding:10px 14px">
            <div style="font-weight:700;color:#e2e8f0;font-size:12.5px;margin-bottom:2px">${title}</div>
            <div style="font-size:10.5px;color:#64748b">${desc}</div>
          </td>
          <td style="padding:10px 14px;font-family:monospace;font-size:10px;color:#818cf8">${api}</td>
          <td style="padding:10px 14px;text-align:center">
            <span style="font-size:9px;font-weight:800;padding:3px 8px;border-radius:12px;
              color:${pc};background:${pc}18;border:1px solid ${pc}44">${priority}</span>
          </td>
          <td style="padding:10px 14px;text-align:center;font-weight:700;font-size:11.5px;
            color:${wasTested ? '#10b981' : '#64748b'}">${wasTested ? '✓ Yes' : '— No'}</td>
        </tr>`;
    }).join('');
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;
        background:${sm.color}12;border:1px solid ${sm.color}33;border-radius:10px 10px 0 0;
        margin-top:16px">
        <span style="font-weight:800;color:${sm.color};font-size:13px">${sm.label}</span>
        <span style="font-size:11px;color:#64748b">${sm.desc}</span>
      </div>
      ${tblWrap(`${thRow([{ l: '#', align: 'center' }, { l: 'Scenario' }, { l: 'Browser API' },
        { l: 'Priority', align: 'center' }, { l: 'Tested', align: 'center' }])}
        <tbody>${trs}</tbody>`, sm.color)}`;
  }).join('');
  const scenariosSection = `
    ${secHdr('■', 'Performance Test Scenarios', '#8b5cf6')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:6px">
      Test plan for ${url} — what each performance check measures. See the metrics table above
      for pass/fail outcomes.
    </div>
    ${scenariosHtml}`;
 
  // ── 7. Results by Category ─────────────────────────────────────────────
  const catAgg = { TIMING: { pass: 0, fail: 0, total: 0 }, NETWORK: { pass: 0, fail: 0, total: 0 },
    ASSETS: { pass: 0, fail: 0, total: 0 }, DOM: { pass: 0, fail: 0, total: 0 } };
  Object.entries(PERF_CAT_MAP).forEach(([key, cat]) => {
    const st = statusByKey[key];
    if (st == null) return;
    catAgg[cat].total++;
    if (st === 'pass') catAgg[cat].pass++;
    else if (st === 'fail') catAgg[cat].fail++;
  });
  const catColors = { TIMING: '#6366f1', NETWORK: '#0ea5e9', ASSETS: '#f97316', DOM: '#8b5cf6' };
  const catRows = Object.entries(catAgg).filter(([, d]) => d.total > 0).map(([cat, d]) => {
    const rate = Math.round((d.pass / d.total) * 100);
    const verdict = d.fail === 0 ? 'PASS' : 'FAIL';
    const vc = d.fail === 0 ? '#10b981' : '#ef4444';
    const bg = d.fail === 0 ? 'rgba(16,185,129,.05)' : 'rgba(239,68,68,.05)';
    return `
      <tr style="background:${bg};border-bottom:1px solid rgba(255,255,255,.04)">
        <td style="padding:11px 14px;font-weight:800;color:${catColors[cat]}">${cat}</td>
        <td style="padding:11px 14px;text-align:center;color:#e2e8f0;font-weight:700">${d.total}</td>
        <td style="padding:11px 14px;text-align:center;color:#10b981;font-weight:700">${d.pass}</td>
        <td style="padding:11px 14px;text-align:center;color:#ef4444;font-weight:700">${d.fail}</td>
        <td style="padding:11px 14px;text-align:center;color:${vc};font-weight:700">${rate}%</td>
        <td style="padding:11px 14px;text-align:center">
          <span style="font-size:10px;font-weight:800;padding:3px 10px;border-radius:12px;
            color:${vc};background:${vc}18;border:1px solid ${vc}44">${verdict}</span>
        </td>
      </tr>`;
  }).join('');
  const resultsByCategory = `
    ${secHdr('■', 'Results by Category', '#0d9488')}
    ${tblWrap(`${thRow([{ l: 'Category' }, { l: 'Total', align: 'center' },
      { l: 'Passed', align: 'center' }, { l: 'Failed', align: 'center' },
      { l: 'Pass Rate', align: 'center' }, { l: 'Verdict', align: 'center' }])}
      <tbody>${catRows}</tbody>`, '#0d9488')}
    <div style="font-size:11px;color:#64748b;margin-bottom:24px">
      <b>Severity Legend:</b>
      <span style="color:#ef4444;font-weight:700">■ HIGH</span> — blocks performance, fix first &nbsp;&nbsp;
      <span style="color:#f59e0b;font-weight:700">■ MEDIUM</span> — hurts UX, should be fixed &nbsp;&nbsp;
      <span style="color:#10b981;font-weight:700">■ LOW</span> — minor, optional improvement
    </div>`;
 
  // ── 8. Detailed Performance Test Results ───────────────────────────────
  const detailRows = Object.entries(PERF_METRIC_LABELS).map(([key, [label, unit]], i) => {
    const value = metrics?.[key];
    const th = thresholds?.[key] || {};
    const status = statusByKey[key];
    const cat = PERF_CAT_MAP[key];
    const pri = PERF_SEVERITY[key];
    const sc = status === 'pass' ? '#10b981' : status === 'fail' ? '#ef4444' : '#f59e0b';
    const badge = status === 'pass' ? '■ PASS' : status === 'fail' ? '■ FAIL' : '■ N/A';
    const detail = `Measured ${fmtVal(key, value, unit)}` +
      (th.good != null ? ` — good ≤ ${Number(th.good).toLocaleString()}${unit}, poor ≥ ${Number(th.poor).toLocaleString()}${unit}` : '');
    return `
      <tr style="border-bottom:1px solid rgba(255,255,255,.04);
        background:${status === 'fail' ? 'rgba(239,68,68,.03)' : 'transparent'}">
        <td style="padding:10px 14px;color:#64748b;text-align:center;font-weight:700">${i + 1}</td>
        <td style="padding:10px 14px;color:#e2e8f0;font-weight:700;font-size:12px">${label}</td>
        <td style="padding:10px 14px;text-align:center;font-size:10.5px;font-weight:700;
          color:${catColors[cat]}">${cat}</td>
        <td style="padding:10px 14px;text-align:center">
          <span style="font-size:9.5px;font-weight:800;color:${sc}">${badge}</span></td>
        <td style="padding:10px 14px;font-size:11px;color:#94a3b8">${detail}</td>
        <td style="padding:10px 14px;text-align:center;font-size:10px;font-weight:800;
          color:${PRI_COLOR[pri]}">${pri}</td>
      </tr>`;
  }).join('');
  const detailedResults = `
    ${secHdr('■', 'Detailed Performance Test Results', '#0d9488')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Real analysis results from Playwright. Each row shows the check performed, its outcome,
      and the actual value found.
    </div>
    ${tblWrap(`${thRow([{ l: '#', align: 'center' }, { l: 'Check' }, { l: 'Category', align: 'center' },
      { l: 'Status', align: 'center' }, { l: 'Result / Detail' }, { l: 'Severity', align: 'center' }])}
      <tbody>${detailRows}</tbody>`, '#0d9488')}`;
 
  // ── 9. Category Score Radar ─────────────────────────────────────────────
  const radarData = Object.entries(catAgg).filter(([, d]) => d.total > 0).map(([cat, d]) => ({
    label: cat, color: catColors[cat],
    value: d.total > 0 ? Math.round((d.pass / d.total) * 100) : 0,
  }));
  const worstCat = radarData.reduce((a, b) => (b.value < a.value ? b : a), radarData[0] || { label: '', value: 100 });
  const radarInsight = worstCat && worstCat.value < 100
    ? `${worstCat.label} has the lowest pass rate (${worstCat.value}%) — prioritize fixing checks in this category to raise the overall score fastest.`
    : 'All categories are at 100% pass rate — no category needs prioritization.';
  const radarSection = `
    ${secHdr('■', 'Category Score Radar', '#8b5cf6')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Pass rate per category (Timing, Network, Assets, DOM) — the closer to 100%,
      the fewer failing checks in that group.
    </div>
    <div style="background:#0d1526;border:1px solid rgba(139,92,246,.3);border-radius:14px;
      padding:16px;display:flex;justify-content:center;margin-bottom:12px">
      ${svgRadarChart(radarData)}
    </div>
    <div style="background:rgba(139,92,246,.06);border:1px solid rgba(139,92,246,.25);
      border-radius:10px;padding:12px 16px;font-size:12px;color:#94a3b8;margin-bottom:24px">
      <b style="color:#8b5cf6">AI Analysis:</b> ${radarInsight}
    </div>`;
 
  // ── 10. Category Breakdown Chart ────────────────────────────────────────
  const breakdownCats = Object.entries(catAgg).filter(([, d]) => d.total > 0)
    .map(([cat, d]) => ({ label: cat, color: catColors[cat], pass: d.pass, fail: d.fail }));
  const worstBreak = breakdownCats.reduce((a, b) => (b.fail > a.fail ? b : a), breakdownCats[0] || { fail: 0, label: '' });
  const breakInsight = worstBreak.fail > 0
    ? `${worstBreak.label} has the most failing checks (${worstBreak.fail}) — prioritize this category to raise the overall score fastest.`
    : 'No category has failing checks — all measured metrics are within their good thresholds.';
  const breakdownSection = `
    ${secHdr('■', 'Category Breakdown Chart', '#0d9488')}
    <div style="background:#0d1526;border:1px solid rgba(13,148,136,.3);border-radius:14px;
      padding:16px;display:flex;justify-content:center;margin-bottom:12px">
      ${svgCategoryBreakdown(breakdownCats)}
    </div>
    <div style="display:flex;gap:16px;font-size:11px;color:#94a3b8;margin-bottom:12px">
      <span><span style="display:inline-block;width:10px;height:10px;background:#10b981;
        border-radius:2px;margin-right:5px"></span>Passed</span>
      <span><span style="display:inline-block;width:10px;height:10px;background:#ef4444;
        border-radius:2px;margin-right:5px"></span>Failed</span>
    </div>
    <div style="background:rgba(13,148,136,.06);border:1px solid rgba(13,148,136,.25);
      border-radius:10px;padding:12px 16px;font-size:12px;color:#94a3b8;margin-bottom:24px">
      <b style="color:#0d9488">AI Analysis:</b> ${breakInsight}
    </div>`;
 
  // ── 11. Metric Risk Distribution ────────────────────────────────────────
  const riskItems = Object.entries(PERF_METRIC_LABELS).map(([key, [label, unit]]) => {
    const value = metrics?.[key];
    const poor = thresholds?.[key]?.poor;
    if (value == null || !poor) return null;
    const pct = Math.min(150, Math.round((value / poor) * 100));
    const status = statusByKey[key];
    const color = status === 'fail' ? '#ef4444' : '#10b981';
    return { label: `${label}  (${fmtVal(key, value, unit)})`, value: pct, display: `${pct}%`, color };
  }).filter(Boolean);
  const riskSection = riskItems.length ? `
    ${secHdr('■', 'Metric Risk Distribution', '#0d9488')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Each bar shows how close the measured value is to the "poor" threshold —
      past the 100% line means the metric failed.
    </div>
    <div style="background:#0d1526;border:1px solid rgba(13,148,136,.3);border-radius:14px;
      padding:16px;overflow-x:auto;margin-bottom:24px">
      ${svgHorizontalBars(riskItems, { markerAt: 100 })}
    </div>` : '';
 
  // ── 12. Resource Size Waterfall ─────────────────────────────────────────
  const jsKb = Number(metrics?.js_size_kb || 0), cssKb = Number(metrics?.css_size_kb || 0),
        imgKb = Number(metrics?.image_size_kb || 0);
  const totalKb = Number(metrics?.total_size_kb || (jsKb + cssKb + imgKb));
  const otherKb = Math.max(0, totalKb - (jsKb + cssKb + imgKb));
  const parts = [
    { label: 'JavaScript', value: jsKb, color: '#f59e0b' },
    { label: 'Images', value: imgKb, color: '#ec4899' },
    { label: 'CSS', value: cssKb, color: '#3b82f6' },
    { label: 'Other / Fonts', value: otherKb, color: '#8b5cf6' },
  ].sort((a, b) => b.value - a.value).map(p => ({ ...p, display: `${Math.round(p.value)} KB` }));
  const biggest = parts[0];
  const biggestPct = totalKb ? Math.round((biggest.value / totalKb) * 100) : 0;
  const waterfallInsight = `${biggest.label} is the heaviest resource type at ${Math.round(biggest.value)} KB (${biggestPct}% of ${Math.round(totalKb)} KB total) — this is the best place to trim page weight.`;
  const waterfallSection = `
    ${secHdr('■', 'Resource Size Waterfall', '#8b5cf6')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Each bar shows the total size of one resource type — the longer the bar,
      the more it weighs down page load time.
    </div>
    <div style="background:#0d1526;border:1px solid rgba(139,92,246,.3);border-radius:14px;
      padding:16px;overflow-x:auto;margin-bottom:12px">
      ${svgHorizontalBars(parts, { unitSuffix: ' KB' })}
    </div>
    <div style="background:rgba(139,92,246,.06);border:1px solid rgba(139,92,246,.25);
      border-radius:10px;padding:12px 16px;font-size:12px;color:#94a3b8;margin-bottom:24px">
      <b style="color:#8b5cf6">AI Analysis:</b> ${waterfallInsight}
    </div>`;
 
  // ── 13. Execution Environment ───────────────────────────────────────────
  const envItems = [
    ['BROWSER', generation?.browser || 'Chromium 138', '#6366f1'],
    ['FRAMEWORK', framework, '#0d9488'],
    ['VIEWPORT', generation?.viewport || '1920×1080', '#f59e0b'],
    ['EXECUTION TIME', timeStr, '#8b5cf6'],
    ['DEVICE', generation?.device_type || 'Desktop', '#3b82f6'],
    ['NEXTEST VERSION', generation?.nextest_version || '1.0.0', '#10b981'],
  ];
  const envCards = envItems.map(([l, v, c]) => `
    <div style="background:#0d1526;border:1px solid ${c}55;border-top:3px solid ${c};
      border-radius:10px;padding:14px;text-align:center">
      <div style="font-size:9px;font-weight:700;color:${c};letter-spacing:1px;margin-bottom:6px">${l}</div>
      <div style="font-size:14px;font-weight:800;color:#e2e8f0">${v}</div>
    </div>`).join('');
  const envSection = `
    ${secHdr('■', 'Execution Environment', '#0d9488')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:14px">
      Browser, viewport, and framework used to run this performance audit —
      for reproducibility of the results above.
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
      ${envCards}
    </div>`;
 
  // ── 14. AI Recommendations table ────────────────────────────────────────
  const recRows = recs.map(rec => {
    const pri = (rec.priority || 'medium').toLowerCase();
    const pc = PRI_COLOR[pri] || '#f59e0b';
    return `
      <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
        <td style="padding:10px 14px;text-align:center">
          <span style="font-size:9.5px;font-weight:800;color:${pc}">${pri.toUpperCase()}</span></td>
        <td style="padding:10px 14px;font-size:11px;font-weight:700;color:#818cf8">
          ${(rec.category || '').toUpperCase()}</td>
        <td style="padding:10px 14px;font-size:11.5px;color:#e2e8f0">${rec.title || ''}</td>
        <td style="padding:10px 14px;font-size:11px;color:#94a3b8">${(rec.description || '').slice(0, 160)}</td>
      </tr>`;
  }).join('');
  const recsSection = recs.length ? `
    ${secHdr('■', 'AI Recommendations', '#6366f1')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Global performance recommendations generated by AI — prioritized by impact on load time.
    </div>
    ${tblWrap(`${thRow([{ l: 'Priority', align: 'center' }, { l: 'Category' }, { l: 'Issue' }, { l: 'Fix' }])}
      <tbody>${recRows}</tbody>`, '#6366f1')}` : '';
 
  // ── 15. Action Plan ──────────────────────────────────────────────────────
  const priOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedRecs = [...recs].sort((a, b) =>
    (priOrder[(a.priority || 'medium').toLowerCase()] ?? 2) - (priOrder[(b.priority || 'medium').toLowerCase()] ?? 2));
  const actionSteps = sortedRecs.map((rec, i) => `
    <div style="display:flex;gap:10px;padding:10px 14px;background:#0d1526;
      border:1px solid rgba(201,162,39,.2);border-radius:8px;margin-bottom:6px">
      <span style="color:#c9a227;font-weight:800;flex-shrink:0">Step ${i + 1}:</span>
      <span style="font-size:12px;color:#94a3b8">${rec.description || rec.title || ''}</span>
    </div>`).join('');
  const actionPlanSection = sortedRecs.length ? `
    ${secHdr('■', 'Action Plan', '#c9a227')}
    <div style="margin-bottom:24px">${actionSteps}</div>` : '';
 
  // ── 16. Executive Summary ────────────────────────────────────────────────
  const topRecs = [...sortedRecs].slice(0, 2);
  const execCards = topRecs.map((rec, i) => `
    <div style="background:#0d1526;border:1px solid rgba(201,162,39,.3);border-radius:12px;
      padding:16px 18px;margin-bottom:10px">
      <div style="display:flex;gap:12px">
        <span style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:800;
          color:#c9a227;flex-shrink:0">${i + 1}</span>
        <div>
          <div style="font-size:10px;font-weight:800;color:#818cf8;letter-spacing:1px;
            margin-bottom:4px">${(rec.category || '').toUpperCase()}</div>
          <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:4px">${rec.title || ''}</div>
          <div style="font-size:11.5px;color:#94a3b8;line-height:1.6">${rec.description || ''}</div>
        </div>
      </div>
    </div>`).join('');
  const execInsight = `Fixing these ${topRecs.length} item(s) targets the biggest gaps behind the current
    score of ${score}/100 — re-run the audit after applying them to confirm improvement.`;
  const execSection = topRecs.length ? `
    ${secHdr('■', 'Executive Summary', '#c9a227')}
    <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:10px">Top Priority Actions</div>
    ${execCards}
    <div style="background:rgba(201,162,39,.06);border:1px solid rgba(201,162,39,.25);
      border-radius:10px;padding:12px 16px;font-size:12px;color:#94a3b8;margin-bottom:24px">
      <b style="color:#c9a227">AI Analysis:</b> ${execInsight}
    </div>` : '';
 
  // ── 17. Final Verdict ────────────────────────────────────────────────────
  let verdict;
  if (fail > 0 && score < 50) {
    verdict = { c: '#ef4444', bg: 'rgba(239,68,68,.08)', bd: '#ef4444', i: '🔴',
      t: `Performance validation FAILED — score ${score}/100 with ${fail} metric(s) exceeding poor thresholds. Optimization required before production.` };
  } else if (fail > 0) {
    verdict = { c: '#f59e0b', bg: 'rgba(245,158,11,.08)', bd: '#f59e0b', i: '🟡',
      t: `Performance validation passed with warnings — score ${score}/100, ${fail} metric(s) need attention.` };
  } else {
    verdict = { c: '#10b981', bg: 'rgba(16,185,129,.08)', bd: '#10b981', i: '🟢',
      t: `Performance validation PASSED — score ${score}/100. All ${pass} metrics are within good thresholds for this site type.` };
  }
  const verdictSection = `
    <div style="background:${verdict.bg};border:1.5px solid ${verdict.bd};border-radius:14px;
      padding:16px 20px;display:flex;gap:12px;align-items:flex-start;margin-bottom:28px">
      <span style="font-size:22px">${verdict.i}</span>
      <div>
        <div style="font-size:12px;font-weight:700;color:${verdict.c};margin-bottom:4px">
          Final Performance Verdict</div>
        <p style="font-size:12.5px;color:${verdict.c};margin:0;line-height:1.6">${verdict.t}</p>
      </div>
    </div>`;
 
  // ── 18. Certificate ──────────────────────────────────────────────────────
  const certificate = `
    ${secHdr('■', 'Certificate of Performance Analysis', '#c9a227')}
    <div style="background:#0d1526;border:1.5px solid rgba(201,162,39,.35);border-radius:16px;
      overflow:hidden;text-align:center">
      <div style="height:4px;background:${scoreColor}"></div>
      <div style="padding:28px 24px">
        <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#64748b;margin-bottom:14px">
          CERTIFICATE OF PERFORMANCE ANALYSIS</div>
        <div style="font-size:15px;color:#e2e8f0;font-style:italic;margin-bottom:16px">${url}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:46px;font-weight:800;
          color:${scoreColor};line-height:1;margin-bottom:14px">${score}<span style="font-size:16px;
          color:#64748b"> /100</span></div>
        <div style="display:flex;justify-content:center;gap:10px;margin-bottom:14px">
          <span style="padding:6px 16px;border-radius:20px;background:${gradeColor};color:#fff;
            font-weight:800;font-size:12px">GRADE ${grade}</span>
          <span style="padding:6px 16px;border-radius:20px;border:1px solid ${scoreColor};
            color:${scoreColor};font-weight:800;font-size:12px">${scoreLabel.toUpperCase()}</span>
        </div>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,.06);padding:10px;font-size:10px;
        color:#64748b;background:rgba(255,255,255,.02)">
        Validated by <b style="color:#94a3b8">NexTest AI</b> &nbsp;•&nbsp; ${dateStr}
      </div>
    </div>`;
 
  // ── Assemblage final ─────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>NexTest Performance Report #${genId}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,300;1,700&family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#070e1c;color:#e2e8f0;font-family:'DM Sans',sans-serif;min-height:100vh;
    background-image:linear-gradient(rgba(13,148,136,.025) 1px,transparent 1px),
      linear-gradient(90deg,rgba(13,148,136,.025) 1px,transparent 1px);
    background-size:48px 48px}
  .page{max-width:1140px;margin:0 auto;padding:48px 32px 80px}
  table{width:100%;border-collapse:collapse}
  @media print{
    body{background:#fff;color:#000;background-image:none}
    .no-print{display:none}
    .page{padding:10mm}
    @page{margin:15mm;size:A4}
  }
</style>
</head>
<body>
<div class="page">
  ${header}
  ${infoBox}
  <div class="no-print" style="margin-bottom:24px">
    <button onclick="window.print()" style="padding:10px 20px;border-radius:10px;
      background:linear-gradient(135deg,#0d9488,#0f766e);border:none;color:#fff;
      font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;
      text-transform:uppercase;cursor:pointer">🖨 Print / Save as PDF</button>
  </div>
  ${statsSection}
  ${scoreHero}
  ${methodology}
  ${keyMetrics}
  ${scenariosSection}
  ${resultsByCategory}
  ${detailedResults}
  ${radarSection}
  ${breakdownSection}
  ${riskSection}
  ${waterfallSection}
  ${envSection}
  ${recsSection}
  ${actionPlanSection}
  ${execSection}
  ${verdictSection}
  ${certificate}
 
  <div style="margin-top:40px;padding:20px 28px;background:rgba(6,9,20,.6);
    border:1px solid rgba(255,255,255,.05);border-radius:16px;display:flex;
    align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:700;
      letter-spacing:2px;text-transform:uppercase;color:#64748b">
      Nex<span style="color:#0d9488">Test</span> · AI-Powered Automation
    </div>
    <div style="font-size:11px;color:#64748b">
      Generated ${dateStr} · Performance Test (Public) · ${total} metrics · Score: ${score}/100
    </div>
  </div>
</div>
</body>
</html>`;
 
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `performance_report_${genId}.html`;
  link.click();
 
  return html;
}
const downloadXlsx_Performance = async () => {
  setDropdownOpen(false);
  const genId = generation?.generation?.id;
  if (!genId) return;

  try {
    const res  = await api.get(`/generations/${genId}/xlsx`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `performance_report_${genId}.xlsx`;
    link.click();
  } catch (err) {
    console.error('[XLSX] download error', err);
    alert('Excel export failed: ' + (err.response?.data?.error || err.message));
  }
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
<div className="ep-actions" style={{ opacity: (pdfLoading || running) ? 0.3 : 1, pointerEvents: (pdfLoading || running) ? 'none' : 'auto', transition: 'opacity .3s' }}>
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

                  {/* XLSX */}
<button onClick={downloadXlsx_Performance} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 600, transition: 'all .15s', textAlign: 'left' }}
  onMouseEnter={e => { e.currentTarget.style.background = 'var(--green-bg)'; e.currentTarget.style.color = 'var(--green)'; }}
  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sub)'; }}>
  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#10b981' }}>XLSX</span>
  <div><div style={{ fontSize: 12, fontWeight: 700 }}>rapport.xlsx</div><div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>Classeur Excel</div></div>
</button>

                  {/* HTML */}
<button onClick={downloadHtml_PerformancePublic}  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 600, transition: 'all .15s', textAlign: 'left' }}
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
  { key: 'scenario', label: 'Scenario', Icon: IconTarget, count: running ? 0 : 10 },
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
      {/* ── SCENARIO TAB ── */}
{activeSection === 'scenario' && (() => {

  const PERF_CHECK_PLAN = [
    { key: 'load_time_ms',  title: 'Page Load Time',           desc: 'Total time from navigation start to the load event firing',        section: 'timing',  api: 'window.performance.timing',                    priority: 'HIGH'   },
    { key: 'fcp_ms',        title: 'First Contentful Paint',   desc: 'Time until the first text or image is painted on screen',           section: 'timing',  api: 'PerformanceObserver — paint',                   priority: 'HIGH'   },
    { key: 'lcp_ms',        title: 'Largest Contentful Paint', desc: 'Time until the largest visible element finishes rendering',         section: 'timing',  api: 'PerformanceObserver — largest-contentful-paint', priority: 'HIGH'   },
    { key: 'tti_ms',        title: 'Time to Interactive',      desc: 'Time until the page is fully interactive for the user',             section: 'timing',  api: 'domInteractive / Long Tasks API',               priority: 'MEDIUM' },
    { key: 'request_count', title: 'Network Requests Count',   desc: 'Total number of HTTP requests fired to load the page',              section: 'network', api: "performance.getEntriesByType('resource')",     priority: 'MEDIUM' },
    { key: 'total_size_kb', title: 'Total Page Size',          desc: 'Combined transfer size of every resource loaded',                   section: 'network', api: 'resource-timing-api transferSize',              priority: 'MEDIUM' },
    { key: 'js_size_kb',    title: 'JavaScript Bundle Size',   desc: 'Combined size of all JavaScript files loaded',                      section: 'assets',  api: "script[src] transferSize",                      priority: 'HIGH'   },
    { key: 'css_size_kb',   title: 'CSS Stylesheets Size',     desc: 'Combined size of all CSS files loaded',                             section: 'assets',  api: "link[rel=stylesheet] transferSize",             priority: 'LOW'    },
    { key: 'image_size_kb', title: 'Images Total Size',        desc: 'Combined size of every image loaded on the page',                   section: 'assets',  api: 'img transferSize aggregate',                    priority: 'MEDIUM' },
    { key: 'dom_size',      title: 'DOM Elements Count',       desc: 'Total number of DOM nodes rendered on the page',                    section: 'dom',     api: "document.querySelectorAll('*').length",         priority: 'LOW'    },
  ];

  const SECTION_META_PLAN = {
    timing:  { label: 'Timing',  color: '#6366f1', desc: 'Core Web Vitals — how fast the page loads and becomes usable' },
    network: { label: 'Network', color: '#0ea5e9', desc: 'Requests and total bytes transferred over the wire' },
    assets:  { label: 'Assets',  color: '#f97316', desc: 'Size of JS, CSS, and image resources' },
    dom:     { label: 'DOM',     color: '#8b5cf6', desc: 'Structural complexity of the rendered page' },
  };

  const priColor = (p) => p === 'HIGH' ? '#ef4444' : p === 'MEDIUM' ? '#f59e0b' : '#10b981';

  const bySectionPlan = PERF_CHECK_PLAN.reduce((acc, chk) => {
    if (!acc[chk.section]) acc[chk.section] = [];
    acc[chk.section].push(chk);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.2)',
        borderRadius: 10, padding: '10px 16px', fontSize: 12, color: 'var(--muted)',
      }}>
        Test plan — what each performance check measures, independent of execution results. See the <b style={{ color: 'var(--indigo2)' }}>Metrics</b> tab for pass/fail outcomes.
      </div>

      {['timing', 'network', 'assets', 'dom'].map(sec => {
        const secChecks = bySectionPlan[sec] || [];
        if (!secChecks.length) return null;
        const sm = SECTION_META_PLAN[sec];

        return (
          <div key={sec} style={{ background: 'var(--card)', border: `1px solid ${sm.color}33`, borderRadius: 16, overflow: 'hidden' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: `${sm.color}0d`, borderBottom: `1px solid ${sm.color}33` }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${sm.color}18`, border: `1px solid ${sm.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, color: sm.color, fontSize: 13 }}>
                {sec[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: sm.color }}>{sm.label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sm.desc}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 220px 90px 90px', gap: 12, padding: '10px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              {['#', 'Scenario', 'Browser API', 'Priority', 'Tested'].map(h => (
                <div key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</div>
              ))}
            </div>

            {secChecks.map((chk, i) => {
              const wasTested = tests.some(t => t.metric_key === chk.key);
              return (
                <div key={chk.key} style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr 220px 90px 90px', gap: 12,
                  padding: '13px 20px', alignItems: 'center',
                  borderBottom: i < secChecks.length - 1 ? '1px solid var(--border)' : 'none',
                  animation: `dFadeUp .2s var(--ease) ${i * 0.03}s both`,
                }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{chk.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{chk.desc}</div>
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#818cf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chk.api}
                  </div>
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
        );
      })}
    </div>
  );
})()}
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
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    {(() => {
      const aiResult   = generation?.result?.ai || {};
      const aiRecs     = aiResult.recommendations || [];
      const aiSummary  = aiResult.summary || '';
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

// ── Config partagée (mêmes couleurs que le PDF/XLSX k6) ─────────────────────
const K6_TYPE_CONFIG = {
  load:   { label: 'Load Test',   color: '#6366f1', icon: '📈' },
  stress: { label: 'Stress Test', color: '#ef4444', icon: '🔥' },
  spike:  { label: 'Spike Test',  color: '#f59e0b', icon: '⚡' },
  soak:   { label: 'Soak Test',   color: '#0ea5e9', icon: '🌊' },
};
const K6_TYPE_ORDER = ['load', 'stress', 'spike', 'soak'];
 
const K6_SECTION_COLORS = {
  'Response Time': '#6366f1', 'Error Rate': '#ef4444', 'Throughput': '#10b981',
  'Scalability': '#f97316', 'Reliability': '#8b5cf6', 'Thresholds': '#0ea5e9',
};
const K6_SECTION_ORDER = ['Response Time', 'Error Rate', 'Throughput', 'Scalability', 'Reliability', 'Thresholds'];
 
const K6_CHECK_PLAN = [
  ['Response Time p95',      'p95 response time must stay under the type-specific threshold', 'PERFORMANCE', 'HIGH'],
  ['Average Response Time',  'Mean response time across all requests during the run',          'PERFORMANCE', 'MEDIUM'],
  ['Max Response Time',      'Slowest single response observed during the run',                'PERFORMANCE', 'LOW'],
  ['Error Rate',             'HTTP error rate must stay under the type-specific limit',        'RELIABILITY', 'HIGH'],
  ['Throughput (req/s)',     'Sustained requests-per-second the system can handle',            'PERFORMANCE', 'MEDIUM'],
  ['Max Virtual Users',      'Peak concurrent virtual users reached during the run',           'SCALABILITY', 'MEDIUM'],
  ["k6 Checks Pass Rate",    'Percentage of k6 assertions (checks) that passed — must exceed 95%', 'RELIABILITY', 'HIGH'],
];
const K6_CAT_COLOR = { PERFORMANCE: '#6366f1', RELIABILITY: '#ef4444', SCALABILITY: '#0ea5e9' };
const K6_PRI_COLOR = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };
 
// ── Helpers génériques ───────────────────────────────────────────────────────
function k6ScoreLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 25) return 'Poor';
  return 'Critical';
}
function k6GradeFromScore(score) {
  if (score >= 90) return ['A', '#10b981'];
  if (score >= 75) return ['B', '#22c55e'];
  if (score >= 50) return ['C', '#f59e0b'];
  if (score >= 25) return ['D', '#ef4444'];
  return ['F', '#dc2626'];
}
function k6ParseMs(val) {
  if (val == null) return 0;
  const s = String(val).replace('ms', '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
function k6Fmt(n, digits = 1) {
  if (n == null || isNaN(n)) return 'N/A';
  return Number(n).toFixed(digits);
}
 
// ── SVG chart primitives (pas de lib externe, tout inline) ──────────────────
function svgK6Gauge(score, color) {
  const size = 150, r = 58, cx = size / 2, cy = size / 2 + 6;
  const startAngle = -225, sweep = 270;
  const angle = startAngle + sweep * Math.min(100, Math.max(0, score)) / 100;
  const polar = (cx, cy, r, deg) => {
    const rad = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const arcPath = (a0, a1) => {
    const [x0, y0] = polar(cx, cy, r, a0);
    const [x1, y1] = polar(cx, cy, r, a1);
    const large = (a1 - a0) % 360 > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <path d="${arcPath(startAngle, startAngle + sweep)}" stroke="#1e293b" stroke-width="14"
        fill="none" stroke-linecap="round"/>
      <path d="${arcPath(startAngle, angle)}" stroke="${color}" stroke-width="14"
        fill="none" stroke-linecap="round"/>
      <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="30" font-weight="800"
        fill="${color}" font-family="'DM Sans',sans-serif">${Math.round(score)}</text>
      <text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="11" fill="#64748b"
        font-family="'DM Sans',sans-serif">/ 100</text>
    </svg>`;
}
 
function svgK6LineChart(labels, values, color, unit = '') {
  const W = 640, H = 220, padL = 46, padR = 20, padT = 26, padB = 34;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const max = Math.max(...values, 1) * 1.25;
  const x = i => padL + (innerW / Math.max(labels.length - 1, 1)) * i;
  const y = v => padT + innerH - (v / max) * innerH;
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const area = `${padL},${padT + innerH} ${points} ${x(values.length - 1)},${padT + innerH}`;
  const dots = values.map((v, i) => `
    <circle cx="${x(i)}" cy="${y(v)}" r="5" fill="white" stroke="${color}" stroke-width="2.5"/>
    <text x="${x(i)}" y="${y(v) - 12}" text-anchor="middle" font-size="11" font-weight="700"
      fill="#e2e8f0" font-family="'DM Sans',sans-serif">${k6Fmt(v, 0)}${unit}</text>`).join('');
  const xLabels = labels.map((l, i) => `
    <text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" font-weight="700"
      fill="#94a3b8" font-family="'DM Sans',sans-serif">${l}</text>`).join('');
  const gridY = [0.25, 0.5, 0.75, 1].map(f => `
    <line x1="${padL}" y1="${padT + innerH * (1 - f)}" x2="${W - padR}" y2="${padT + innerH * (1 - f)}"
      stroke="#1e293b" stroke-width="1"/>`).join('');
  return `
    <svg width="100%" viewBox="0 0 ${W} ${H}" style="max-width:${W}px">
      ${gridY}
      <polygon points="${area}" fill="${color}" opacity="0.08"/>
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5"/>
      ${dots}
      ${xLabels}
    </svg>`;
}
 
function svgK6BarChart(labels, values, colors, unit = '') {
  const W = 640, H = 220, padL = 46, padR = 20, padT = 26, padB = 34;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const max = Math.max(...values, 1) * 1.3;
  const bw = (innerW / labels.length) * 0.5;
  const gap = (innerW / labels.length);
  const bars = values.map((v, i) => {
    const bx = padL + gap * i + (gap - bw) / 2;
    const bh = (v / max) * innerH;
    const by = padT + innerH - bh;
    return `
      <rect x="${bx}" y="${by}" width="${bw}" height="${Math.max(bh, 1)}" rx="4"
        fill="${colors[i % colors.length]}"/>
      <text x="${bx + bw / 2}" y="${by - 8}" text-anchor="middle" font-size="11" font-weight="700"
        fill="#e2e8f0" font-family="'DM Sans',sans-serif">${k6Fmt(v, unit === '' ? 0 : 1)}${unit}</text>
      <text x="${bx + bw / 2}" y="${H - 8}" text-anchor="middle" font-size="11" font-weight="700"
        fill="#94a3b8" font-family="'DM Sans',sans-serif">${labels[i]}</text>`;
  }).join('');
  const gridY = [0.25, 0.5, 0.75, 1].map(f => `
    <line x1="${padL}" y1="${padT + innerH * (1 - f)}" x2="${W - padR}" y2="${padT + innerH * (1 - f)}"
      stroke="#1e293b" stroke-width="1"/>`).join('');
  return `<svg width="100%" viewBox="0 0 ${W} ${H}" style="max-width:${W}px">${gridY}${bars}</svg>`;
}
 
function svgK6GroupedBars(labels, series) {
  // series = [{ name, color, values: [] }]
  const W = 640, H = 240, padL = 46, padR = 20, padT = 26, padB = 46;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const allVals = series.flatMap(s => s.values);
  const max = Math.max(...allVals, 1) * 1.25;
  const groupW = innerW / labels.length;
  const barW = (groupW * 0.6) / series.length;
  let bars = '';
  labels.forEach((label, gi) => {
    const groupX = padL + groupW * gi + groupW * 0.2;
    series.forEach((s, si) => {
      const v = s.values[gi] || 0;
      const bh = (v / max) * innerH;
      const bx = groupX + si * barW;
      const by = padT + innerH - bh;
      bars += `
        <rect x="${bx}" y="${by}" width="${barW - 2}" height="${Math.max(bh, 1)}" rx="3" fill="${s.color}"/>
        ${v > 0 ? `<text x="${bx + barW / 2}" y="${by - 5}" text-anchor="middle" font-size="9"
          font-weight="700" fill="#94a3b8">${v}</text>` : ''}`;
    });
    bars += `<text x="${groupX + (groupW * 0.6) / 2}" y="${H - 26}" text-anchor="middle"
      font-size="11" font-weight="700" fill="#94a3b8">${label}</text>`;
  });
  const legend = series.map((s, i) => `
    <rect x="${padL + i * 100}" y="${H - 16}" width="10" height="10" rx="2" fill="${s.color}"/>
    <text x="${padL + i * 100 + 14}" y="${H - 7}" font-size="10" fill="#94a3b8">${s.name}</text>`).join('');
  const gridY = [0.25, 0.5, 0.75, 1].map(f => `
    <line x1="${padL}" y1="${padT + innerH * (1 - f)}" x2="${W - padR}" y2="${padT + innerH * (1 - f)}"
      stroke="#1e293b" stroke-width="1"/>`).join('');
  return `<svg width="100%" viewBox="0 0 ${W} ${H}" style="max-width:${W}px">${gridY}${bars}${legend}</svg>`;
}
 
// ── Recommandations déterministes (fallback si pas d'AI stockée) ────────────
function k6BuildRecommendations(summary, tests, url) {
  const perfRecs = [], relRecs = [], uxRecs = [];
  K6_TYPE_ORDER.forEach(tk => {
    if (!summary[tk]) return;
    const cfg = K6_TYPE_CONFIG[tk];
    const m = summary[tk].metrics || {};
    const p95 = m.http_req_duration_p95 || 'N/A';
    const status = summary[tk].status || 'pass';
    const duration = summary[tk].duration_seconds ?? '-';
    if (status === 'fail') {
      perfRecs.push(`${cfg.label} exceeded its response-time threshold (p95: ${p95}, duration: ${duration}s). Investigate slow endpoints and review server-side timeout/threshold configuration for this profile.`);
    } else {
      perfRecs.push(`${cfg.label} completed in ${duration}s with a p95 of ${p95}, within the target range. No immediate action required — continue tracking this metric across future releases.`);
    }
  });
  if (!perfRecs.length) perfRecs.push('No performance data available. Check k6 output format.');
 
  const failedTests = tests.filter(t => t.status === 'fail');
  if (failedTests.length) {
    failedTests.slice(0, 3).forEach(t => relRecs.push(`Fix "${(t.name || '').slice(0, 50)}" — threshold exceeded: ${(t.suite || '').slice(0, 60)}`));
  } else {
    relRecs.push('All k6 threshold checks passed across every load profile — no reliability regressions detected in this run. Re-run this suite after significant backend or infrastructure changes to confirm behavior remains stable.');
  }
  const skipTests = tests.filter(t => !['pass', 'fail'].includes(t.status));
  if (skipTests.length) relRecs.push(`${skipTests.length} test(s) warn/skip — verify k6 metric output format.`);
 
  K6_TYPE_ORDER.forEach(tk => {
    if (!summary[tk]) return;
    const cfg = K6_TYPE_CONFIG[tk];
    const m = summary[tk].metrics || {};
    const err = m.http_req_failed_rate;
    const checks = m.checks_rate;
    if (err != null && Number(err) > 1) {
      uxRecs.push(`${cfg.label}: error rate ${Number(err).toFixed(1)}% — users experience failures under this load profile.`);
    } else if (checks != null) {
      uxRecs.push(`${cfg.label}: check pass rate ${Number(checks).toFixed(1)}% — user-facing assertions ${Number(checks) >= 95 ? 'pass' : 'need attention'}.`);
    }
  });
  if (!uxRecs.length) uxRecs.push('No user-facing errors were observed during any of the tested load profiles. End users should experience consistent response times and no failed requests under traffic comparable to this test.');
 
  return { perfRecs, relRecs, uxRecs };
}
 
function k6BuildActionPlan(summary) {
  const plan = [];
  K6_TYPE_ORDER.forEach(tk => {
    if (!summary[tk]) return;
    const cfg = K6_TYPE_CONFIG[tk];
    plan.push({
      scenario: `Continuous Performance Monitoring — ${cfg.label}`,
      category: 'Monitoring', priority: 'LOW',
      action: `Track p95 and error rate for ${cfg.label} over time to catch regressions early.`,
      responsible: 'DevOps', deadline: 'Next Sprint', status: 'To Do',
    });
  });
  return plan;
}

function downloadHtml_K6Report(generation) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const genId = generation?.generation?.id || 'nextest';
 
  const result  = generation?.result || {};
  const tests   = result?.execution_results || result?.test_cases || generation?.execution_results || generation?.test_cases || [];
  const summary = result?.summary || generation?.summary || {};
  const url       = generation?.generation?.url || generation?.url || '';
  const framework = generation?.framework || generation?.generation?.framework || 'k6';
 
  const passCount = tests.filter(t => t.status === 'pass').length;
  const failCount = tests.filter(t => t.status === 'fail').length;
  const skipCount = tests.filter(t => t.status === 'skip' || t.status === 'warn').length;
  const total = tests.length || 1;
  const passRate = Math.round((passCount / total) * 100);
 
  let k6Score = passRate;
  if (failCount) k6Score = Math.max(0, k6Score - failCount * 8);
  k6Score = Math.min(100, k6Score);
  const scoreColor = k6Score >= 80 ? '#10b981' : k6Score >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = k6ScoreLabel(k6Score);
  const [grade, gradeColor] = k6GradeFromScore(k6Score);
 
  const profilesRun = K6_TYPE_ORDER.filter(k => summary[k]).map(k => K6_TYPE_CONFIG[k].label).join(', ');
 
  const aiResult = result?.ai || {};
  const hasAi = (aiResult.recommendations && aiResult.recommendations.length) || aiResult.action_plan;
  const { perfRecs, relRecs, uxRecs } = k6BuildRecommendations(summary, tests, url);
  const actionPlan = (hasAi && aiResult.action_plan?.length) ? aiResult.action_plan : k6BuildActionPlan(summary);
 
  const secHdr = (title, color = '#7D64FF') => `
    <div style="display:flex;align-items:center;gap:10px;margin:36px 0 14px;
      padding-bottom:10px;border-bottom:2.5px solid ${color}">
      <span style="font-size:16px;color:${color};font-weight:800">■</span>
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;
        font-weight:700;color:#e2e8f0">${title}</span>
    </div>`;
  const tblWrap = (inner, accent = '#6366f1') => `
    <div style="background:#0d1526;border:1px solid ${accent}44;border-radius:14px;
      overflow:hidden;margin-bottom:20px;box-shadow:0 4px 20px rgba(0,0,0,.3)">
      <table style="width:100%;border-collapse:collapse">${inner}</table>
    </div>`;
  const thRow = cols => `
    <thead><tr style="background:#040914">
      ${cols.map(c => `<th style="padding:11px 14px;text-align:${c.align || 'left'};
        font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#4f6480;
        font-weight:700;white-space:nowrap">${c.l}</th>`).join('')}
    </tr></thead>`;
  const insightBox = (text, color) => `
    <div style="background:${color}0f;border:1px solid ${color}44;border-left:3px solid ${color};
      border-radius:10px;padding:12px 16px;font-size:12px;color:#94a3b8;margin-bottom:20px">
      <b style="color:${color}">AI Analysis:</b> ${text}
    </div>`;
 
  // ── 1. HEADER ────────────────────────────────────────────────────────────
  const header = `
    <div style="background:linear-gradient(135deg,#040914 0%,#0a0f2e 50%,#040914 100%);
      border:1px solid rgba(125,100,255,.15);border-radius:24px;padding:40px 48px;margin-bottom:32px;
      position:relative;overflow:hidden">
      <div style="position:absolute;bottom:0;left:0;right:0;height:3px;
        background:linear-gradient(90deg,transparent,#7D64FF,transparent)"></div>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap">
        <div>
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:700;
            letter-spacing:4px;text-transform:uppercase;color:#e2e8f0">
            Nex<span style="color:#7D64FF;font-style:italic;font-weight:300">Test</span>
          </div>
          <div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;
            color:#a89bff;opacity:.8;margin-top:2px">k6 Performance Test Report</div>
        </div>
        <div style="text-align:right;font-size:11px;color:#64748b">
          Generated<br/><span style="color:#94a3b8">${dateStr} · ${timeStr}</span>
        </div>
      </div>
      <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;font-weight:700;
        color:#e2e8f0;margin-top:22px">k6 Performance Test Report</div>
    </div>`;
 
  const infoRow = (l, v) => `
    <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
      <td style="padding:10px 14px;background:rgba(255,255,255,.02);color:#64748b;
        font-weight:700;font-size:12px;white-space:nowrap">${l}</td>
      <td style="padding:10px 14px;font-size:12px;color:#e2e8f0">${v}</td>
    </tr>`;
  const infoBox = tblWrap(`<tbody>
    ${infoRow('URL', url)}
    ${infoRow('Framework', `<span style="color:#7D64FF;font-weight:700">k6 Load Testing</span>`)}
    ${infoRow('Test Type', `<span style="color:#7D64FF;font-weight:700">Performance Test</span>`)}
    ${infoRow('Test Profiles', profilesRun || 'N/A')}
    ${infoRow('Generated', now.toISOString().slice(0, 16).replace('T', '  '))}
  </tbody>`, '#7D64FF');
 
  // ── 2. Stat cards ────────────────────────────────────────────────────────
  const statCards = [
    ['✅', passCount, 'PASSED', '#10b981'],
    ['❌', failCount, 'FAILED', '#ef4444'],
    ['⚠️', skipCount, 'WARN/SKIP', '#f59e0b'],
    ['📈', `${passRate}%`, 'PASS RATE', '#f59e0b'],
    ['🔢', total, 'TOTAL', '#3b82f6'],
  ].map(([icon, val, lbl, c]) => `
    <div style="background:${c}12;border:1px solid ${c}33;border-radius:16px;padding:20px 14px;text-align:center">
      <div style="font-size:18px;margin-bottom:8px">${icon}</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:700;
        color:${c};line-height:1;margin-bottom:6px">${val}</div>
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:${c}99;
        text-transform:uppercase">${lbl}</div>
    </div>`).join('');
  const statsSection = `
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:6px">${statCards}</div>
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:20px">
      Pass Rate reflects the raw proportion of threshold checks that succeeded, while the Performance
      Score applies severity weighting to failed checks and response-time degradation.
    </div>`;
 
  // ── 3. Executive Summary intro ──────────────────────────────────────────
  const execIntro = failCount === 0
    ? `This k6 performance audit exercised <b style="color:#e2e8f0">${url}</b> across ${profilesRun}
       load profiles, executing ${total} threshold checks with zero failures. Response time,
       throughput, and error-rate metrics all remained within their target thresholds, confirming that
       the application handles the tested traffic patterns without degradation.`
    : `This k6 performance audit exercised <b style="color:#e2e8f0">${url}</b> across ${profilesRun}
       load profiles, executing ${total} threshold checks — ${failCount} did not meet their target.
       Review the failing checks below before promoting this build to production.`;
  const execIntroSection = `
    ${secHdr('Executive Summary', '#7D64FF')}
    <p style="font-size:13px;color:#94a3b8;line-height:1.8;margin-bottom:24px">${execIntro}</p>`;
 
  // ── 4. Score hero ────────────────────────────────────────────────────────
  const scoreAnalysis = failCount === 0
    ? `${url} successfully met all ${total} performance thresholds across the ${profilesRun} load
       profiles. Response times, throughput, and error rates all remained within their target
       ranges, demonstrating stable and reliable performance under the tested traffic conditions.
       Continued monitoring under real-world load is still recommended.`
    : `${url} did not meet ${failCount} of ${total} performance thresholds across the ${profilesRun}
       load profiles. The failing checks below identify which metrics and load conditions require
       investigation before this build is promoted to production.`;
  const scoreHero = `
    ${secHdr('Performance Score', scoreColor)}
    <div style="display:flex;align-items:center;gap:32px;flex-wrap:wrap;background:#0d1526;
      border:1.5px solid ${scoreColor}66;border-radius:16px;padding:26px 30px;margin-bottom:24px">
      <div>${svgK6Gauge(k6Score, scoreColor)}</div>
      <div style="flex:1;min-width:280px">
        <div style="font-size:20px;font-weight:800;color:${scoreColor};margin-bottom:10px">${scoreLabel}</div>
        <p style="font-size:13px;color:#94a3b8;line-height:1.7;margin:0 0 10px">${scoreAnalysis}</p>
        <div style="font-size:11px;color:#64748b">The score is severity-weighted from the ${failCount}
          failed threshold(s) out of ${total} — refer to Pass Rate above for the unweighted check count.</div>
      </div>
    </div>`;
 
  // ── 5. Key metrics table ────────────────────────────────────────────────
  function findK6Test(typeLabel, keyword) {
    const prefix = `[${typeLabel}]`;
    return tests.find(t => (t.name || '').includes(prefix) && (t.name || '').toLowerCase().includes(keyword.toLowerCase()));
  }
  let keyMetricsRows = '';
  K6_TYPE_ORDER.forEach(tk => {
    if (!summary[tk]) return;
    const cfg = K6_TYPE_CONFIG[tk];
    const m = summary[tk].metrics || {};
    const checks = [
      ['p95 Response Time', 'Response Time p95', m.http_req_duration_p95 ?? 'N/A'],
      ['Throughput', 'Throughput (req/s)', m.http_reqs_per_second != null ? `${Number(m.http_reqs_per_second).toFixed(1)}/s` : 'N/A'],
      ['Error Rate', 'Error Rate', m.http_req_failed_rate != null ? `${Number(m.http_req_failed_rate).toFixed(1)}%` : 'N/A'],
    ];
    checks.forEach(([label, keyword, value]) => {
      const t = findK6Test(cfg.label, keyword);
      const status = t?.status;
      const sc = status === 'pass' ? '#10b981' : status === 'fail' ? '#ef4444' : '#94a3b8';
      const badge = status === 'pass' ? '● PASS' : status === 'fail' ? '● FAIL' : 'N/A';
      keyMetricsRows += `
        <tr style="border-left:3px solid ${sc};border-bottom:1px solid rgba(255,255,255,.04)">
          <td style="padding:11px 14px;font-weight:700;color:${cfg.color};font-size:12px">${cfg.label}</td>
          <td style="padding:11px 14px;color:#e2e8f0;font-size:12px">${label}</td>
          <td style="padding:11px 14px;text-align:center;font-weight:800;font-size:13px;color:${sc}">${value}</td>
          <td style="padding:11px 14px;text-align:center">
            <span style="font-size:10px;font-weight:800;letter-spacing:1px;padding:3px 10px;
              border-radius:12px;color:${sc};background:${sc}18;border:1px solid ${sc}33">${badge}</span>
          </td>
        </tr>`;
    });
  });
  const keyMetrics = `
    ${secHdr('Key Metrics', '#7D64FF')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Quick-glance summary of p95 response time, throughput, and error rate for each load profile.
    </div>
    ${tblWrap(`${thRow([{ l: 'Test Type' }, { l: 'Metric' }, { l: 'Value', align: 'center' }, { l: 'Status', align: 'center' }])}
      <tbody>${keyMetricsRows}</tbody>`, '#7D64FF')}`;
 
  // ── 6. Test scenarios (grouped by profile) ──────────────────────────────
  let scenariosHtml = '';
  K6_TYPE_ORDER.forEach(tk => {
    if (!summary[tk]) return;
    const cfg = K6_TYPE_CONFIG[tk];
    const groupTests = tests.filter(t => (t.name || '').toLowerCase().includes(`[${cfg.label}]`.toLowerCase()));
    const trs = K6_CHECK_PLAN.map(([title, desc, cat, pri], i) => {
      const wasTested = groupTests.some(t => (t.name || '').includes(title));
      const pc = K6_PRI_COLOR[pri];
      const cc = K6_CAT_COLOR[cat];
      return `
        <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
          <td style="padding:10px 14px;color:#64748b;text-align:center;font-weight:700;font-size:11px">${i + 1}</td>
          <td style="padding:10px 14px">
            <div style="font-weight:700;color:#e2e8f0;font-size:12.5px;margin-bottom:2px">${title}</div>
            <div style="font-size:10.5px;color:#64748b">${desc}</div>
          </td>
          <td style="padding:10px 14px;text-align:center;font-size:9.5px;font-weight:800;color:${cc}">${cat}</td>
          <td style="padding:10px 14px;text-align:center">
            <span style="font-size:9px;font-weight:800;padding:3px 8px;border-radius:12px;
              color:${pc};background:${pc}18;border:1px solid ${pc}44">${pri}</span>
          </td>
          <td style="padding:10px 14px;text-align:center;font-weight:700;font-size:11.5px;
            color:${wasTested ? '#10b981' : '#64748b'}">${wasTested ? '✓ Yes' : '— No'}</td>
        </tr>`;
    }).join('');
    scenariosHtml += `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;
        background:${cfg.color}12;border:1px solid ${cfg.color}33;border-radius:10px 10px 0 0;margin-top:16px">
        <span style="font-weight:800;color:${cfg.color};font-size:13px">${cfg.icon} ${cfg.label}</span>
      </div>
      ${tblWrap(`${thRow([{ l: '#', align: 'center' }, { l: 'Scenario' }, { l: 'Category', align: 'center' },
        { l: 'Priority', align: 'center' }, { l: 'Tested', align: 'center' }])}
        <tbody>${trs}</tbody>`, cfg.color)}`;
  });
  const scenariosSection = `
    ${secHdr('k6 Performance Test Scenarios', '#7D64FF')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:6px">
      Performance test plan executed against ${url} — ${total} threshold checks spanning the four
      standard load profiles, each validating a specific aspect of application behavior under traffic.
    </div>
    ${scenariosHtml}`;
 
  // ── 7. Results by Test Type ──────────────────────────────────────────────
  const typeStats = {};
  tests.forEach(t => {
    const name = t.name || '';
    let tk = 'load';
    if (name.includes('Stress')) tk = 'stress'; else if (name.includes('Spike')) tk = 'spike';
    else if (name.includes('Soak')) tk = 'soak';
    if (!typeStats[tk]) typeStats[tk] = { pass: 0, fail: 0, skip: 0, total: 0 };
    typeStats[tk].total++;
    if (t.status === 'pass') typeStats[tk].pass++;
    else if (t.status === 'fail') typeStats[tk].fail++;
    else typeStats[tk].skip++;
  });
  let typeRows = '';
  K6_TYPE_ORDER.forEach(tk => {
    if (!typeStats[tk] && !summary[tk]) return;
    const d = typeStats[tk] || { pass: 0, fail: 0, skip: 0, total: 0 };
    const cfg = K6_TYPE_CONFIG[tk];
    const duration = summary[tk]?.duration_seconds ?? '—';
    const rate = d.total ? Math.round((d.pass / d.total) * 100) : 0;
    const verdict = d.fail === 0 ? 'PASS' : 'FAIL';
    const vc = d.fail === 0 ? '#10b981' : '#ef4444';
    const bg = d.fail === 0 ? 'rgba(16,185,129,.05)' : 'rgba(239,68,68,.05)';
    typeRows += `
      <tr style="background:${bg};border-bottom:1px solid rgba(255,255,255,.04)">
        <td style="padding:11px 14px;font-weight:800;color:${cfg.color}">${cfg.icon} ${cfg.label}</td>
        <td style="padding:11px 14px;text-align:center;color:#e2e8f0;font-weight:700">${d.total}</td>
        <td style="padding:11px 14px;text-align:center;color:#10b981;font-weight:700">${d.pass}</td>
        <td style="padding:11px 14px;text-align:center;color:#ef4444;font-weight:700">${d.fail}</td>
        <td style="padding:11px 14px;text-align:center;color:${vc};font-weight:700">${rate}%</td>
        <td style="padding:11px 14px;text-align:center;color:#94a3b8">${duration}s</td>
        <td style="padding:11px 14px;text-align:center">
          <span style="font-size:10px;font-weight:800;padding:3px 10px;border-radius:12px;
            color:${vc};background:${vc}18;border:1px solid ${vc}44">${verdict}</span>
        </td>
      </tr>`;
  });
  const resultsByType = `
    ${secHdr('Results by Test Type', '#7D64FF')}
    ${tblWrap(`${thRow([{ l: 'Test Type' }, { l: 'Total', align: 'center' }, { l: 'Passed', align: 'center' },
      { l: 'Failed', align: 'center' }, { l: 'Pass Rate', align: 'center' }, { l: 'Duration', align: 'center' },
      { l: 'Status', align: 'center' }])}
      <tbody>${typeRows}</tbody>`, '#7D64FF')}`;
 
  // ── 8. Performance Comparison Charts (p95 / throughput / error / VUs) ───
  const p95Vals = K6_TYPE_ORDER.filter(k => summary[k]).map(k => k6ParseMs(summary[k].metrics?.http_req_duration_p95));
  const throughputVals = K6_TYPE_ORDER.filter(k => summary[k]).map(k => Number(summary[k].metrics?.http_reqs_per_second || 0));
  const errorVals = K6_TYPE_ORDER.filter(k => summary[k]).map(k => Number(summary[k].metrics?.http_req_failed_rate || 0));
  const vusVals = K6_TYPE_ORDER.filter(k => summary[k]).map(k => Number(summary[k].metrics?.vus_max || 0));
  const chartLabels = K6_TYPE_ORDER.filter(k => summary[k]).map(k => K6_TYPE_CONFIG[k].label.replace(' Test', ''));
  const chartColors = K6_TYPE_ORDER.filter(k => summary[k]).map(k => K6_TYPE_CONFIG[k].color);
 
  function bestWorst(vals, labels, lowerIsBetter) {
    if (!vals.length) return null;
    const bestIdx = lowerIsBetter ? vals.indexOf(Math.min(...vals)) : vals.indexOf(Math.max(...vals));
    const worstIdx = lowerIsBetter ? vals.indexOf(Math.max(...vals)) : vals.indexOf(Math.min(...vals));
    return { bestLabel: labels[bestIdx], bestVal: vals[bestIdx], worstLabel: labels[worstIdx], worstVal: vals[worstIdx] };
  }
  const p95BW = bestWorst(p95Vals, chartLabels, true);
  const thrBW = bestWorst(throughputVals, chartLabels, false);
  const errBW = bestWorst(errorVals, chartLabels, true);
  const vusBW = bestWorst(vusVals, chartLabels, false);
 
  const chartsSection = `
    ${secHdr('Performance Comparison Charts', '#7D64FF')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Side-by-side comparison of key metrics across the four load profiles.
    </div>
 
    <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:8px">p95 Response Time (ms)</div>
    <div style="background:#0d1526;border:1px solid rgba(99,102,241,.3);border-radius:14px;padding:16px;
      display:flex;justify-content:center;margin-bottom:12px">
      ${svgK6LineChart(chartLabels, p95Vals, '#6366f1', 'ms')}
    </div>
    ${p95BW ? insightBox(`${p95BW.bestLabel} performed best at ${k6Fmt(p95BW.bestVal, 1)}ms, while
      ${p95BW.worstLabel} recorded the highest value at ${k6Fmt(p95BW.worstVal, 1)}ms.`, '#6366f1') : ''}
 
    <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:8px">Throughput (req/s)</div>
    <div style="background:#0d1526;border:1px solid rgba(16,185,129,.3);border-radius:14px;padding:16px;
      display:flex;justify-content:center;margin-bottom:12px">
      ${svgK6BarChart(chartLabels, throughputVals, chartColors, '/s')}
    </div>
    ${thrBW ? insightBox(`${thrBW.bestLabel} sustains the highest throughput at ${k6Fmt(thrBW.bestVal, 1)} req/s,
      showing the application's capacity under that load pattern.`, '#10b981') : ''}
 
    <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:8px">Error Rate (%)</div>
    <div style="background:#0d1526;border:1px solid rgba(239,68,68,.3);border-radius:14px;padding:16px;
      display:flex;justify-content:center;margin-bottom:12px">
      ${svgK6BarChart(chartLabels, errorVals, chartColors, '%')}
    </div>
    ${errBW ? insightBox(errBW.worstVal > 0
      ? `${errBW.worstLabel} recorded the highest error rate at ${k6Fmt(errBW.worstVal, 2)}%.`
      : 'No HTTP request failures were recorded across any of the tested load profiles.', '#ef4444') : ''}
 
    <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:8px">Maximum Virtual Users</div>
    <div style="background:#0d1526;border:1px solid rgba(14,165,233,.3);border-radius:14px;padding:16px;
      display:flex;justify-content:center;margin-bottom:12px">
      ${svgK6BarChart(chartLabels, vusVals, chartColors, '')}
    </div>
    ${vusBW ? insightBox(`${vusBW.bestLabel} reached the highest peak concurrency at ${vusBW.bestVal}
      virtual users, giving context for how demanding this load pattern was.`, '#0ea5e9') : ''}`;
 
  // ── 9. Threshold Validation matrix ──────────────────────────────────────
  const grouped = {};
  K6_SECTION_ORDER.forEach(s => { grouped[s] = { load: { total: 0, fail: 0 }, stress: { total: 0, fail: 0 }, spike: { total: 0, fail: 0 }, soak: { total: 0, fail: 0 } }; });
  tests.forEach(t => {
    const name = t.name || '', section = t.section || 'Thresholds';
    if (!grouped[section]) return;
    let tk = 'load';
    if (name.includes('Stress')) tk = 'stress'; else if (name.includes('Spike')) tk = 'spike'; else if (name.includes('Soak')) tk = 'soak';
    grouped[section][tk].total++;
    if (t.status === 'fail') grouped[section][tk].fail++;
  });
  const cellHtml = d => {
    if (!d.total) return `<span style="color:#334155">—</span>`;
    const c = d.fail > 0 ? '#ef4444' : '#10b981';
    return `<span style="color:${c};font-weight:700">${d.total}</span>` + (d.fail > 0 ? ` <span style="color:#ef4444;font-size:10px">(${d.fail} fail)</span>` : '');
  };
  const thresholdRows = K6_SECTION_ORDER.map(section => {
    const d = grouped[section];
    const anyFail = Object.values(d).some(v => v.fail > 0);
    const statusHtml = anyFail ? `<span style="color:#ef4444;font-weight:800">FAIL</span>` : `<span style="color:#10b981;font-weight:800">PASS</span>`;
    return `
      <tr style="background:${anyFail ? 'rgba(239,68,68,.04)' : 'transparent'};border-bottom:1px solid rgba(255,255,255,.04)">
        <td style="padding:11px 14px;font-weight:700;color:${K6_SECTION_COLORS[section]}">${section}</td>
        <td style="padding:11px 14px;text-align:center">${cellHtml(d.load)}</td>
        <td style="padding:11px 14px;text-align:center">${cellHtml(d.stress)}</td>
        <td style="padding:11px 14px;text-align:center">${cellHtml(d.spike)}</td>
        <td style="padding:11px 14px;text-align:center">${cellHtml(d.soak)}</td>
        <td style="padding:11px 14px;text-align:center">${statusHtml}</td>
      </tr>`;
  }).join('');
  const thresholdSection = `
    ${secHdr('Threshold Validation', '#7D64FF')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Cross-tabulation of threshold outcomes for ${url}, broken down by validation category (rows)
      and load profile (columns) — highlights whether failures are isolated or systemic.
    </div>
    ${tblWrap(`${thRow([{ l: 'Section' }, { l: 'Load', align: 'center' }, { l: 'Stress', align: 'center' },
      { l: 'Spike', align: 'center' }, { l: 'Soak', align: 'center' }, { l: 'Status', align: 'center' }])}
      <tbody>${thresholdRows}</tbody>`, '#7D64FF')}`;
 
  // ── 10. Pass/Warn/Fail distribution ─────────────────────────────────────
  const breakdownSeries = [
    { name: 'Passed', color: '#10b981', values: K6_TYPE_ORDER.filter(k => typeStats[k]).map(k => typeStats[k].pass) },
    { name: 'Warn/Skip', color: '#f59e0b', values: K6_TYPE_ORDER.filter(k => typeStats[k]).map(k => typeStats[k].skip) },
    { name: 'Failed', color: '#ef4444', values: K6_TYPE_ORDER.filter(k => typeStats[k]).map(k => typeStats[k].fail) },
  ];
  const breakdownLabels = K6_TYPE_ORDER.filter(k => typeStats[k]).map(k => K6_TYPE_CONFIG[k].label.replace(' Test', ''));
  const breakdownInsight = failCount === 0
    ? `All ${total} threshold validations completed without failures or warnings, demonstrating
       consistent reliability across every executed load profile.`
    : `${failCount} of ${total} threshold validation(s) failed — review the affected test type(s) above
       before promoting this build.`;
  const breakdownSection = `
    ${secHdr('Pass / Fail Distribution', '#8b5cf6')}
    <div style="background:#0d1526;border:1px solid rgba(139,92,246,.3);border-radius:14px;padding:16px;
      display:flex;justify-content:center;margin-bottom:12px">
      ${svgK6GroupedBars(breakdownLabels, breakdownSeries)}
    </div>
    ${insightBox(breakdownInsight, '#8b5cf6')}`;
 
  // ── 11. Execution Environment ────────────────────────────────────────────
  const urlDisplay = url.replace('https://', '').replace('http://', '');
  const envItems = [
    ['LOAD GENERATOR', 'k6', '#7D64FF'],
    ['TARGET URL', urlDisplay, '#6366f1'],
    ['EXECUTION TIME', timeStr, '#8b5cf6'],
    ['TEST PROFILES', `${Object.keys(summary).length} (${profilesRun})`, '#f59e0b'],
    ['NEXTEST VERSION', generation?.nextest_version || '1.0.0', '#10b981'],
    ['FRAMEWORK', 'k6 Load Testing', '#0ea5e9'],
  ];
  const envCards = envItems.map(([l, v, c]) => `
    <div style="background:#0d1526;border:1px solid ${c}55;border-top:3px solid ${c};border-radius:10px;
      padding:14px;text-align:center">
      <div style="font-size:9px;font-weight:700;color:${c};letter-spacing:1px;margin-bottom:6px">${l}</div>
      <div style="font-size:14px;font-weight:800;color:#e2e8f0">${v}</div>
    </div>`).join('');
  const envSection = `
    ${secHdr('Execution Environment', '#7D64FF')}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">${envCards}</div>`;
 
  // ── 12. Detailed Test Results ────────────────────────────────────────────
  const detailRows = tests.map((t, i) => {
    const status = t.status || 'skip';
    const sc = status === 'pass' ? '#10b981' : status === 'fail' ? '#ef4444' : '#f59e0b';
    const badge = status === 'pass' ? '● PASS' : status === 'fail' ? '● FAIL' : '● SKIP';
    const name = t.name || '';
    let tk = 'load';
    if (name.includes('Stress')) tk = 'stress'; else if (name.includes('Spike')) tk = 'spike'; else if (name.includes('Soak')) tk = 'soak';
    const cfg = K6_TYPE_CONFIG[tk];
    const section = t.section || '-';
    return `
      <tr style="border-bottom:1px solid rgba(255,255,255,.04);
        background:${status === 'fail' ? 'rgba(239,68,68,.03)' : 'transparent'}">
        <td style="padding:10px 14px;color:#64748b;text-align:center;font-weight:700">${i + 1}</td>
        <td style="padding:10px 14px;color:#e2e8f0;font-weight:700;font-size:12px">${name}</td>
        <td style="padding:10px 14px;text-align:center;font-size:10.5px;font-weight:700;color:${cfg.color}">${tk.toUpperCase()}</td>
        <td style="padding:10px 14px;text-align:center;font-size:10.5px;font-weight:700;
          color:${K6_SECTION_COLORS[section] || '#64748b'}">${section}</td>
        <td style="padding:10px 14px;text-align:center">
          <span style="font-size:9.5px;font-weight:800;color:${sc}">${badge}</span></td>
        <td style="padding:10px 14px;font-size:11px;color:#94a3b8">${(t.suite || '').slice(0, 80)}</td>
      </tr>`;
  }).join('');
  const detailedResults = `
    ${secHdr('Detailed Test Results', '#0d9488')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Individual threshold checks as executed by k6, one row per assertion, grouped by load profile
      and validation category.
    </div>
    ${tblWrap(`${thRow([{ l: '#', align: 'center' }, { l: 'Test Name' }, { l: 'Type', align: 'center' },
      { l: 'Section', align: 'center' }, { l: 'Status', align: 'center' }, { l: 'Result / Value' }])}
      <tbody>${detailRows}</tbody>`, '#0d9488')}`;
 
  // ── 13. AI Recommendations ───────────────────────────────────────────────
  const categorized = [
    ...perfRecs.map(r => ['PERFORMANCE', r.toLowerCase().includes('exceeded') ? 'HIGH' : 'MEDIUM', r]),
    ...relRecs.map(r => ['RELIABILITY', r.toLowerCase().startsWith('fix') ? 'HIGH' : 'LOW', r]),
    ...uxRecs.map(r => ['UX', r.toLowerCase().includes('error rate') ? 'MEDIUM' : 'LOW', r]),
  ];
  const recRows = categorized.map(([cat, pri, issue]) => `
    <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
      <td style="padding:10px 14px;text-align:center">
        <span style="font-size:9.5px;font-weight:800;color:${K6_PRI_COLOR[pri]}">${pri}</span></td>
      <td style="padding:10px 14px;font-size:11px;font-weight:700;color:#818cf8">${cat}</td>
      <td style="padding:10px 14px;font-size:11.5px;color:#e2e8f0">${issue}</td>
    </tr>`).join('');
  const recsTableSection = `
    ${secHdr('Recommendations Summary', '#6366f1')}
    <div style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">
      Consolidated recommendations derived from this run's execution evidence, threshold analysis,
      and observed performance signals.
    </div>
    ${tblWrap(`${thRow([{ l: 'Priority', align: 'center' }, { l: 'Category' }, { l: 'Issue' }])}
      <tbody>${recRows}</tbody>`, '#6366f1')}`;
 
  const recBlock = (title, items, color) => !items.length ? '' : `
    <div style="font-size:13px;font-weight:700;color:${color};margin:16px 0 8px">${title}</div>
    ${items.map(r => `
      <div style="display:flex;gap:10px;padding:10px 14px;background:#0d1526;
        border:1px solid ${color}33;border-left:3px solid ${color};border-radius:8px;margin-bottom:6px">
        <span style="font-size:12px;color:#94a3b8;line-height:1.6">${r}</span>
      </div>`).join('')}`;
  const recsDetailSection = `
    ${recBlock('Performance Analysis', perfRecs, '#f59e0b')}
    ${recBlock('Reliability & Fixes', relRecs, '#4f46e5')}
    ${recBlock('User Impact', uxRecs, '#10b981')}`;
 
  // ── 14. Final Verdict ─────────────────────────────────────────────────────
  let verdict;
  if (failCount > 0) {
    verdict = { c: '#ef4444', bg: 'rgba(239,68,68,.08)', bd: '#ef4444', i: '🔴',
      t: `k6 Performance Test FAILED — ${failCount} of ${total} threshold(s) were exceeded. Address the
          failing checks identified above before promoting this build to production.` };
  } else {
    verdict = { c: '#10b981', bg: 'rgba(16,185,129,.08)', bd: '#10b981', i: '🟢',
      t: `k6 Performance Test PASSED — all ${passCount} threshold checks were met across every load
          profile (${profilesRun}). Response times remained well below configured limits, throughput
          stayed stable under increasing load, and no request failures were detected. These results
          indicate a robust and scalable backend architecture capable of sustaining concurrent traffic
          while maintaining consistent service quality.` };
  }
  const verdictSection = `
    <div style="background:${verdict.bg};border:1.5px solid ${verdict.bd};border-radius:14px;
      padding:16px 20px;display:flex;gap:12px;align-items:flex-start;margin-bottom:28px">
      <span style="font-size:22px">${verdict.i}</span>
      <div>
        <div style="font-size:12px;font-weight:700;color:${verdict.c};margin-bottom:4px">Final AI Verdict</div>
        <p style="font-size:12.5px;color:${verdict.c};margin:0 0 8px;line-height:1.6">${verdict.t}</p>
        <div style="font-size:11px;color:#94a3b8">
          <b style="color:#e2e8f0">Quality Score:</b> <span style="color:${verdict.c};font-weight:700">${k6Score}/100</span>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <b style="color:#e2e8f0">Risk Level:</b>
          <span style="color:${k6Score >= 80 ? '#10b981' : k6Score >= 60 ? '#f59e0b' : '#ef4444'};font-weight:700">
            ${k6Score >= 80 ? 'LOW' : k6Score >= 60 ? 'MEDIUM' : 'HIGH'}</span>
        </div>
      </div>
    </div>`;
 
  // ── 15. Action Plan ──────────────────────────────────────────────────────
  const actionRows = actionPlan.map((item, i) => `
    <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
      <td style="padding:10px 14px;color:#64748b;text-align:center;font-weight:700">${i + 1}</td>
      <td style="padding:10px 14px;font-size:11.5px;color:#e2e8f0">${item.scenario || ''}</td>
      <td style="padding:10px 14px;text-align:center;font-size:10.5px;color:#818cf8;font-weight:700">${(item.category || '').toUpperCase()}</td>
      <td style="padding:10px 14px;text-align:center">
        <span style="font-size:9.5px;font-weight:800;color:${K6_PRI_COLOR[item.priority] || '#f59e0b'}">${item.priority || 'MEDIUM'}</span></td>
      <td style="padding:10px 14px;font-size:11px;color:#94a3b8">${item.action || ''}</td>
      <td style="padding:10px 14px;text-align:center;font-size:10.5px;color:#94a3b8">${item.responsible || '-'}</td>
      <td style="padding:10px 14px;text-align:center;font-size:10.5px;color:#94a3b8">${item.deadline || '-'}</td>
    </tr>`).join('');
  const actionPlanSection = actionPlan.length ? `
    ${secHdr('AI-Generated Action Plan', '#c9a227')}
    ${tblWrap(`${thRow([{ l: '#', align: 'center' }, { l: 'Scenario' }, { l: 'Category', align: 'center' },
      { l: 'Priority', align: 'center' }, { l: 'Action' }, { l: 'Responsible', align: 'center' },
      { l: 'Deadline', align: 'center' }])}
      <tbody>${actionRows}</tbody>`, '#c9a227')}` : '';
 
  // ── 16. Executive Summary — Top Priority Actions ────────────────────────
  const priOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const topActions = [...actionPlan].sort((a, b) => (priOrder[a.priority] ?? 1) - (priOrder[b.priority] ?? 1)).slice(0, 2);
  const execCards = topActions.map((item, i) => `
    <div style="background:#0d1526;border:1px solid rgba(201,162,39,.3);border-radius:12px;
      padding:16px 18px;margin-bottom:10px">
      <div style="display:flex;gap:12px">
        <span style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:800;
          color:#c9a227;flex-shrink:0">${i + 1}</span>
        <div>
          <div style="font-size:10px;font-weight:800;color:#818cf8;letter-spacing:1px;margin-bottom:4px">
            ${(item.category || '').toUpperCase()}</div>
          <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:4px">${item.scenario || ''}</div>
          <div style="font-size:11.5px;color:#94a3b8;line-height:1.6">${item.action || ''}</div>
        </div>
      </div>
    </div>`).join('');
  const execInsight = k6Score >= 90
    ? `These ${topActions.length} action(s) are proactive optimizations rather than corrections — the
       current score of ${k6Score}/100 for ${url} already reflects a healthy performance baseline.`
    : `Addressing these ${topActions.length} action(s) targets the largest contributors to the current
       score of ${k6Score}/100 for ${url}. Re-run the k6 suite after applying them to confirm improvement.`;
  const execSummarySection = topActions.length ? `
    ${secHdr('Executive Summary', '#c9a227')}
    <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:10px">Top Priority Actions</div>
    ${execCards}
    ${insightBox(execInsight, '#c9a227')}` : '';
 
  // ── 17. Certificate ───────────────────────────────────────────────────────
  const certificate = `
    ${secHdr('Certificate of Performance Analysis', '#c9a227')}
    <div style="background:#0d1526;border:1.5px solid rgba(201,162,39,.35);border-radius:16px;
      overflow:hidden;text-align:center">
      <div style="height:4px;background:${scoreColor}"></div>
      <div style="padding:28px 24px">
        <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#64748b;margin-bottom:14px">
          CERTIFICATE OF PERFORMANCE ANALYSIS</div>
        <div style="font-size:15px;color:#e2e8f0;font-style:italic;margin-bottom:16px">${url}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:46px;font-weight:800;
          color:${scoreColor};line-height:1;margin-bottom:14px">${k6Score}<span style="font-size:16px;
          color:#64748b"> /100</span></div>
        <div style="display:flex;justify-content:center;gap:10px;margin-bottom:14px">
          <span style="padding:6px 16px;border-radius:20px;background:${gradeColor};color:#fff;
            font-weight:800;font-size:12px">GRADE ${grade}</span>
          <span style="padding:6px 16px;border-radius:20px;border:1px solid ${scoreColor};
            color:${scoreColor};font-weight:800;font-size:12px">${scoreLabel.toUpperCase()}</span>
        </div>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,.06);padding:10px;font-size:10px;
        color:#64748b;background:rgba(255,255,255,.02)">
        Validated by <b style="color:#94a3b8">NexTest AI</b> &nbsp;•&nbsp; ${dateStr}
      </div>
    </div>`;
 
  // ── Assemblage final ──────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>NexTest k6 Performance Report #${genId}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,300;1,700&family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#070e1c;color:#e2e8f0;font-family:'DM Sans',sans-serif;min-height:100vh;
    background-image:linear-gradient(rgba(125,100,255,.025) 1px,transparent 1px),
      linear-gradient(90deg,rgba(125,100,255,.025) 1px,transparent 1px);
    background-size:48px 48px}
  .page{max-width:1140px;margin:0 auto;padding:48px 32px 80px}
  table{width:100%;border-collapse:collapse}
  @media print{
    body{background:#fff;color:#000;background-image:none}
    .no-print{display:none}
    .page{padding:10mm}
    @page{margin:15mm;size:A4}
  }
</style>
</head>
<body>
<div class="page">
  ${header}
  ${infoBox}
  <div class="no-print" style="margin-bottom:24px">
    <button onclick="window.print()" style="padding:10px 20px;border-radius:10px;
      background:linear-gradient(135deg,#7D64FF,#5b3ff0);border:none;color:#fff;
      font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;
      text-transform:uppercase;cursor:pointer">🖨 Print / Save as PDF</button>
  </div>
  ${statsSection}
  ${execIntroSection}
  ${scoreHero}
  ${keyMetrics}
  ${scenariosSection}
  ${resultsByType}
  ${chartsSection}
  ${thresholdSection}
  ${breakdownSection}
  ${envSection}
  ${detailedResults}
  ${recsTableSection}
  ${recsDetailSection}
  ${verdictSection}
  ${actionPlanSection}
  ${execSummarySection}
  ${certificate}
 
  <div style="margin-top:40px;padding:20px 28px;background:rgba(6,9,20,.6);
    border:1px solid rgba(255,255,255,.05);border-radius:16px;display:flex;
    align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:700;
      letter-spacing:2px;text-transform:uppercase;color:#64748b">
      Nex<span style="color:#7D64FF">Test</span> · AI-Powered Automation
    </div>
    <div style="font-size:11px;color:#64748b">
      Generated ${dateStr} · k6 Performance Test · ${total} checks · Score: ${k6Score}/100
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
 
  return html;
}
 

function K6ExecutionPanel({ generation, onGenerationSaved }) {
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

setRunning(true); setTerminalLines([]); setDropdownOpen(false);
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
      if (onGenerationSaved) {
        onGenerationSaved({
          url: generation?.generation?.url || generation?.url || '',
          framework: generation?.framework || generation?.generation?.framework || 'Playwright',
          testType: 'performance',
          passCount: pass,
          failCount: fail,
          timestamp: Date.now(),
          durationMs: 0,
        });
      }
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

 
const downloadHtml = () => {
  const html = downloadHtml_K6Report(generation);
  // downloadHtml_K6Report télécharge déjà le fichier tout seul (blob + click)
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

  <div className="ep-actions" style={{ opacity: (pdfLoading || running) ? 0.3 : 1, pointerEvents: (pdfLoading || running) ? 'none' : 'auto', transition: 'opacity .3s' }}>    {/* Bouton download script — toujours visible pour k6 */}
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
                    {/* XLSX */}
<button onClick={async () => {
  try {
    const id = generation?.generation?.id;
    if (!id) return;
    const res = await api.get(`/generations/${id}/xlsx`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `k6_performance_report_${id}.xlsx`;
    link.click();
  } catch (err) { console.error(err); }
}} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 600, transition: 'all .15s', textAlign: 'left' }}
  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,.08)'; e.currentTarget.style.color = '#10b981'; }}
  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sub)'; }}>
  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#10b981' }}>XLS</span>
  <div><div style={{ fontSize: 12, fontWeight: 700 }}>rapport.xlsx</div><div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>Feuille de calcul complète</div></div>
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

    {(() => {
  const tabsElement = (
    <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', opacity: running ? 0.3 : 1, pointerEvents: running ? 'none' : 'auto', transition: 'opacity .3s' }}>
      {[
        { key: 'results',         label: 'Test Cases',     count: running ? 0 : tests.length, Icon: IconFileText },
        { key: 'scenarios',       label: 'Scenarios',       count: running ? 0 : tests.length, Icon: IconTarget },
        { key: 'recommendations', label: 'Recommendations', count: running ? 0 : aiRecsCount,  Icon: IconBulb },
      ].map(tab => (
        <button key={tab.key} onClick={() => { if (!running) setActiveTab(tab.key); }} disabled={running}
          style={{ padding: '10px 18px', border: 'none', background: 'none', cursor: running ? 'not-allowed' : 'pointer', fontFamily: 'var(--D)', fontSize: 13, fontWeight: 700, color: running ? 'var(--muted)' : (activeTab === tab.key ? 'var(--indigo2)' : 'var(--muted)'), borderBottom: !running && activeTab === tab.key ? '2px solid var(--indigo2)' : '2px solid transparent', marginBottom: -1, transition: 'all .18s', display: 'flex', alignItems: 'center', gap: 8 }}>
          <tab.Icon size={15} stroke={1.8} />
          {tab.label}
          <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: running ? 'var(--bg2)' : (activeTab === tab.key ? 'var(--indigo-bg)' : 'var(--bg2)'), color: running ? 'var(--muted)' : (activeTab === tab.key ? 'var(--indigo2)' : 'var(--muted)') }}>{tab.count}</span>
        </button>
      ))}
    </div>
  );

  if (running) {
    return (
      <>
        {tabsElement}
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
      </>
    );
  }

  if (availableTypes.length > 0) {
    return (
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
        {tabsElement}
      </>
    );
  }

  return tabsElement;
})()}
 
    {/* ── ACTIVE TYPE DETAIL ── */}
{(() => { const aiRecsCount = (generation?.result?.ai?.recommendations || []).length; return null; })()}
      



{!running && (
<>
 
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
      result: { ...generation?.result, execution_results: allTests, screenshot: runResults?.screenshot ?? null },
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
    return <K6ExecutionPanel generation={generation} onGenerationSaved={onGenerationSaved} />;
}
if (testType === 'performance') {
    return <PerformanceExecutionPanel generation={generation} onGenerationSaved={onGenerationSaved} />;
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
  const isSmoke = testType === 'smoke';

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

const downloadCsv_Seo = async () => {
  setDropdownOpen(false);
  const genId = generation?.generation?.id;
  if (!genId) return;

  try {
    const res = await api.get(`/generations/${genId}/xlsx`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `seo_report_${genId}.xlsx`;
    link.click();
  } catch (err) {
    console.error('[XLSX] download error', err);
    alert('Excel export failed: ' + (err.response?.data?.error || err.message));
  }
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
const screenshot = result?.screenshot || null;
const executionTime = result?.execution_time || null;

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
  ${screenshot ? `
  <div style="margin-bottom:16px">
    ${secHdr('📸', 'Page Screenshot', '#16a34a')}
    <p style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:12px">Visual snapshot of ${url} at analysis time.</p>
    <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <img src="data:image/png;base64,${screenshot}" style="width:100%;display:block" />
    </div>
  </div>` : ''}
  ${secHdr('📘', 'Audit Methodology', '#3b82f6')}
  <p style="font-size:12px;color:#475569;line-height:1.7;margin-bottom:20px">
    This SEO audit performs 17 automated checks across 9 categories (Security, Accessibility, Meta, Structure,
    Mobile, Technical, Social, Content, Performance) by rendering the page in a headless Chromium browser
    (Playwright) and parsing the resulting DOM with BeautifulSoup, ensuring dynamically-loaded content
    (JS-rendered elements) is captured. Each check is evaluated against a fixed rule (tag presence, character
    length ranges, HTTP status codes) and enriched with a root-cause and fix recommendation generated by
    LLaMA 3.3, based on the actual values detected on the page.
  </p>
  ${secHdr('🔍', 'SEO Test Scenarios', '#16a34a')}
  ${tblWrap(`${tblHdr([{l:'#',align:'center'},{l:'SEO Check'},{l:'Category',align:'center'},{l:'Expected Result'},{l:'Impact',align:'center'}])}
    <tbody>${scenarioRows}</tbody></table>`)}

  ${secHdr('📊', 'Results by Category', '#16a34a')}
  ${tblWrap(`${tblHdr([{l:'Category'},{l:'Total',align:'center'},{l:'Passed',align:'center'},{l:'Failed',align:'center'},{l:'Pass Rate',align:'center'},{l:'Verdict',align:'center'}])}
    <tbody>${catRows}</tbody></table>`)}
<div style="font-size:12px;color:#1e293b;margin-bottom:20px;padding:10px 16px;background:#fff;border:1px solid #e2e8f0;border-radius:8px">
    <b>Severity Legend:</b>
    <span style="color:#ef4444;font-weight:700;margin-left:8px">■ HIGH</span>
    <span style="color:#64748b;font-size:11px"> — blocks search visibility, fix first &nbsp;&nbsp;&nbsp;</span>
    <span style="color:#f59e0b;font-weight:700">■ MEDIUM</span>
    <span style="color:#64748b;font-size:11px"> — hurts ranking, should be fixed &nbsp;&nbsp;&nbsp;</span>
    <span style="color:#10b981;font-weight:700">■ LOW</span>
    <span style="color:#64748b;font-size:11px"> — minor, optional improvement</span>
  </div>

  ${secHdr('📈', 'Category Breakdown Chart', '#16a34a')}
${(() => {
  const catEntries = Object.entries(cats);
  const yMax = Math.max(...catEntries.map(([,d]) => d.total), 1);
  const chartW = 760, chartH = 320;
  const marginL = 44, marginB = 90, marginT = 24, marginR = 24;
  const plotW = chartW - marginL - marginR;
  const plotH = chartH - marginT - marginB;
  const barSlot = plotW / catEntries.length;
  const barW = Math.min(46, barSlot * 0.5);

  const yTicks = [];
  for (let i = 0; i <= yMax; i++) yTicks.push(i);

  const bars = catEntries.map(([cat, d], i) => {
    const xCenter = marginL + barSlot * i + barSlot / 2;
    const x = xCenter - barW / 2;
    const passH = (d.pass / yMax) * plotH;
    const failH = (d.fail / yMax) * plotH;
    const yBase = marginT + plotH;
    const passY = yBase - passH;
    const failY = passY - failH;
    return `
      <rect x="${x}" y="${passY}" width="${barW}" height="${Math.max(passH,0)}" fill="#10b981" rx="2"/>
      <rect x="${x}" y="${failY}" width="${barW}" height="${Math.max(failH,0)}" fill="#ef4444" rx="2"/>
      <text x="0" y="0" font-size="10" fill="#475569" text-anchor="end"
        transform="translate(${xCenter},${yBase+12}) rotate(-35)">${cat.toUpperCase()}</text>
    `;
  }).join('');

  const gridLines = yTicks.map(t => {
    const y = marginT + plotH - (t / yMax) * plotH;
    return `
      <line x1="${marginL}" y1="${y}" x2="${marginL+plotW}" y2="${y}" stroke="#f1f5f9" stroke-width="1"/>
      <text x="${marginL-8}" y="${y+4}" font-size="10" fill="#94a3b8" text-anchor="end">${t}</text>
    `;
  }).join('');

  return `
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px 20px 10px;margin-bottom:16px">
    <svg viewBox="0 0 ${chartW} ${chartH}" style="width:100%;height:auto;font-family:'DM Sans',sans-serif">
      ${gridLines}
      <line x1="${marginL}" y1="${marginT}" x2="${marginL}" y2="${marginT+plotH}" stroke="#cbd5e1" stroke-width="1"/>
      <line x1="${marginL}" y1="${marginT+plotH}" x2="${marginL+plotW}" y2="${marginT+plotH}" stroke="#cbd5e1" stroke-width="1"/>
      <text x="0" y="0" font-size="11" fill="#64748b" text-anchor="middle"
        transform="translate(${marginL-30},${marginT+plotH/2}) rotate(-90)">Checks</text>
      ${bars}
      <rect x="${chartW-150}" y="4" width="10" height="10" fill="#10b981"/>
      <text x="${chartW-135}" y="13" font-size="10" fill="#475569">Passed</text>
      <rect x="${chartW-75}" y="4" width="10" height="10" fill="#ef4444"/>
      <text x="${chartW-60}" y="13" font-size="10" fill="#475569">Failed</text>
    </svg>
  </div>`;
})()}
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

  ${secHdr('⚙️', 'Environment & Execution Info', '#0d9488')}
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
    ${[
      {l:'NexTest Version', v:'1.0.0'},
      {l:'Analyzer Engine', v:'Playwright (Chromium) + BeautifulSoup'},
      {l:'Execution Time', v: executionTime ? `${executionTime.toFixed(2)}s` : '—'},
      {l:'Generated', v: dateStr},
    ].map(e => `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #0d9488;border-radius:8px;padding:10px 14px">
      <div style="font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#0d9488;margin-bottom:4px">${e.l}</div>
      <div style="font-size:12px;font-weight:700;color:#1e293b">${e.v}</div>
    </div>`).join('')}
  </div>

  ${(() => {
    const highRecs = recs.filter(r => (r.priority||'').toLowerCase() === 'high').slice(0, 3);
    if (!highRecs.length) return '';
    return `
  ${secHdr('🎯', 'Executive Summary', '#4f46e5')}
  <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:12px">Top Priority Actions</div>
  ${highRecs.map((r, i) => `
    <div style="display:flex;gap:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 16px;margin-bottom:8px;align-items:flex-start">
      <div style="width:24px;height:24px;border-radius:50%;background:#ef4444;color:#fff;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i+1}</div>
      <div>
        <div style="font-size:9px;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">${r.category||'—'}</div>
        <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:3px">${r.issue||''}</div>
        <div style="font-size:12px;color:#64748b">${r.fix||''}</div>
      </div>
    </div>`).join('')}
  <div style="margin-bottom:20px"></div>`;
  })()}

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
const downloadHtml_Smoke = () => {
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const genId   = generation?.generation?.id || 'nextest';
  const allTests = tests;

  const pass  = allTests.filter(t => t.status === 'pass').length;
  const fail  = allTests.filter(t => t.status === 'fail').length;
  const skip  = allTests.filter(t => t.status !== 'pass' && t.status !== 'fail').length;
  const total = allTests.length || 1;
  const rate  = Math.round(pass / total * 100);
  const rateColor = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';

  const ACCENT = '#0EA5E9';
const rawScreenshot = generation?.result?.screenshot
  || generation?.generation?.screenshot
  || generation?.result?.scraped?.screenshot
  || generation?.scraped?.screenshot
  || runResults?.screenshot
  || null;
const screenshot = rawScreenshot ? rawScreenshot.replace(/^data:image\/\w+;base64,/, '') : null;
console.log('[SMOKE HTML] screenshot trouvé:', !!rawScreenshot,
  '| result.screenshot:', !!generation?.result?.screenshot,
  '| generation.screenshot:', !!generation?.generation?.screenshot,
  '| scraped.screenshot:', !!generation?.result?.scraped?.screenshot,
  '| runResults.screenshot:', !!runResults?.screenshot);

  // ── Smoke Quality Score (severity-weighted) ──────────────────────────────
  const HIGH_TYPES = new Set(['body','heading','main_content','auth','http_status','ssl','performance']);
  let totalW = 0, earnedW = 0;
  allTests.forEach(t => {
    const w = HIGH_TYPES.has(t.type) ? 3 : 1;
    totalW += w;
    if (t.status === 'pass') earnedW += w;
  });
  const score = totalW ? Math.round(earnedW / totalW * 100) : 0;
  const scoreLabel = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 50 ? 'Acceptable' : 'Critical';
  const scoreColor = score >= 90 ? '#10b981' : score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 50 ? 'C' : score >= 25 ? 'D' : 'F';

  // ── Category classification (mirrors PDF logic) ──────────────────────────
  const getSmokeCategory = (t) => {
    const cat = (t.category || '').toLowerCase();
    const typ = (t.type || '').toLowerCase();
    const name = (t.name || '').toLowerCase();
    if (typ === 'image' || name.includes('image')) return ['Images', '#ec4899'];
    if (typ === 'logo' || name.includes('logo') || cat === 'branding') return ['Branding', '#ec4899'];
    if (['navigation','nav_link','cta','pagination'].includes(typ) || ['navigation','action'].includes(cat)) return ['Navigation', '#10b981'];
    if (typ === 'input_field' || cat === 'form') return ['Forms', '#f59e0b'];
    if (['http_status','ssl'].includes(typ) || ['security','technical'].includes(cat)) return ['Security', '#ef4444'];
    if (typ === 'lang_switch' || cat === 'accessibility') return ['Accessibility', '#0ea5e9'];
    return ['Rendering', '#8b5cf6'];
  };

  const critical_fail = allTests.some(t => t.status === 'fail' && HIGH_TYPES.has(t.type));
  const highPriorityFailCount = allTests.filter(t => {
    if (t.status !== 'fail') return false;
    const pri = (t.priority || t.severity || '').toLowerCase();
    return pri === 'high' || pri === 'critical' || HIGH_TYPES.has(t.type);
  }).length;

  const overallStatus = critical_fail ? 'CRITICAL ISSUES' : fail > 0 ? 'PASSED W/ WARNINGS' : 'ALL CHECKS PASSED';
  const statusColor    = critical_fail ? '#ef4444' : fail > 0 ? '#f59e0b' : '#10b981';
  const riskLevel       = critical_fail ? 'HIGH' : fail > 0 ? 'MEDIUM' : 'LOW';
  const deployText      = critical_fail ? 'NOT READY' : fail > 0 ? 'READY W/ CAUTION' : 'READY';
  const statusExplain   = critical_fail
    ? 'One or more critical checks failed (page load, headings, main content, auth, HTTP status, or SSL). These affect core functionality — deployment is not recommended until resolved.'
    : fail > 0
    ? `All critical checks passed, but ${fail} secondary check(s) failed (e.g. images, pagination, minor UI elements). The application remains functional — review the failing checks below before deploying with confidence.`
    : 'Every check passed, including all critical ones. The application is stable and ready to move to the next testing phase.';

  const secHdr = (title, color = ACCENT) => `
    <div style="display:flex;align-items:center;gap:10px;margin:32px 0 12px;
      padding-bottom:8px;border-bottom:2.5px solid ${color}">
      <span style="font-size:20px;font-weight:700;color:#1e293b">${title}</span>
    </div>`;

  const secDesc = (text) => `<p style="font-size:11px;color:#64748b;font-style:italic;margin-bottom:14px;line-height:1.6">${text}</p>`;

  const tblWrap = (inner, border = ACCENT) => `
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

  const insightBox = (text, color, label = 'AI Analysis') => `
    <div style="background:#f8fafc;border:1px solid ${color}44;border-left:3px solid ${color};
      border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:11.5px;color:#475569;line-height:1.6">
      <b style="color:${color}">${label}: </b>${text}
    </div>`;

  // ── 1. OVERVIEW HERO STATS ────────────────────────────────────────────────
  const heroStats = [
    { l: 'OVERALL STATUS', v: overallStatus, c: statusColor },
    { l: 'QUALITY SCORE',  v: `${score}/100`, c: scoreColor },
    { l: 'RISK LEVEL',     v: riskLevel, c: statusColor },
    { l: 'DEPLOYMENT',     v: deployText, c: statusColor },
  ];
  const sectionOverview = `
    ${secHdr('Smoke Test Overview')}
    ${secDesc(statusExplain)}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      ${heroStats.map(s => `
        <div style="background:#f8fafc;border:1px solid ${s.c};border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#94a3b8;margin-bottom:6px">${s.l}</div>
          <div style="font-size:15px;font-weight:800;color:${s.c}">${s.v}</div>
        </div>`).join('')}
    </div>`;

  // ── 2. KEY METRICS ────────────────────────────────────────────────────────
  const parseMs = (d) => {
    if (!d) return 0;
    const s = String(d);
    if (s.endsWith('ms')) return parseFloat(s) || 0;
    if (s.endsWith('s'))  return (parseFloat(s) || 0) * 1000;
    return 0;
  };
  const totalMs = allTests.reduce((sum, t) => sum + parseMs(t.duration), 0);
  const avgMs   = allTests.length ? totalMs / allTests.length : 0;
  const critCount = allTests.filter(t => t.status === 'fail' && (
    ['high','critical'].includes((t.priority||t.severity||'').toLowerCase()) || HIGH_TYPES.has(t.type)
  )).length;
  const catCounts = { Navigation: 0, Rendering: 0, Security: 0 };
  allTests.forEach(t => { const [c] = getSmokeCategory(t); if (catCounts[c] !== undefined) catCounts[c]++; });

  const keyMetrics = [
    { l: 'EXECUTION TIME',    v: totalMs ? `${(totalMs/1000).toFixed(2)}s` : 'N/A', c: ACCENT },
    { l: 'CRITICAL CHECKS',   v: String(critCount), c: '#ef4444' },
    { l: 'NAVIGATION CHECKS', v: String(catCounts.Navigation), c: '#10b981' },
    { l: 'RENDERING CHECKS',  v: String(catCounts.Rendering), c: '#8b5cf6' },
    { l: 'SECURITY CHECKS',   v: String(catCounts.Security), c: '#f59e0b' },
    { l: 'AVG TEST DURATION', v: avgMs ? `${avgMs.toFixed(0)}ms` : 'N/A', c: '#ec4899' },
  ];
  const sectionKeyMetrics = `
    ${secHdr('Key Metrics')}
    ${secDesc("Snapshot of this run's execution footprint — how long it took, how many checks fell into each category, and where the critical checks are concentrated.")}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      ${keyMetrics.map(m => `
        <div style="background:#fff;border:1px solid ${m.c};border-top:3px solid ${m.c};border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:${m.c};margin-bottom:6px">${m.l}</div>
          <div style="font-size:14px;font-weight:800;color:#1e293b">${m.v}</div>
        </div>`).join('')}
    </div>`;

  // ── 3. SCREENSHOT ─────────────────────────────────────────────────────────
  const sectionScreenshot = `
    ${secHdr('Page Screenshot')}
    ${secDesc('Visual snapshot of the page as captured by Playwright at test execution time.')}
    ${screenshot
      ? `<div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);margin-bottom:16px">
          <img src="data:image/png;base64,${screenshot}" style="width:100%;display:block"/>
        </div>`
      : `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:40px;text-align:center;color:#94a3b8;font-size:12px;margin-bottom:16px">
          No screenshot was captured for this run.
        </div>`}`;

  // ── 4. SCORE ──────────────────────────────────────────────────────────────
  const sectionScore = `
    ${secHdr('Smoke Quality Score', scoreColor)}
    <div style="display:flex;align-items:center;gap:24px;background:#f8fafc;border:1.5px solid ${scoreColor};border-radius:14px;padding:24px;margin-bottom:16px">
      <div style="width:110px;height:110px;border-radius:50%;background:conic-gradient(${scoreColor} ${score*3.6}deg, #e2e8f0 0deg);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <div style="width:82px;height:82px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <span style="font-size:24px;font-weight:800;color:${scoreColor}">${score}</span>
          <span style="font-size:10px;color:#94a3b8">/ 100</span>
        </div>
      </div>
      <div>
        <div style="font-size:17px;font-weight:800;color:${scoreColor};margin-bottom:8px">${scoreLabel}</div>
        <p style="font-size:12px;color:#475569;line-height:1.6;margin:0">
          Smoke Quality Score weighs critical checks (page load, HTTP/SSL, auth, navigation) more heavily than
          optional elements (images, pagination). Excellent ≥ 90 · Good ≥ 75 · Acceptable ≥ 50 · Critical below.
        </p>
      </div>
    </div>`;

  // ── 5. METHODOLOGY + SCENARIOS ───────────────────────────────────────────
  const scenarioRows = allTests.map((t, i) => {
    const [catLabel, catColor] = getSmokeCategory(t);
    const priority = (t.priority || 'medium').toLowerCase();
    const priColor = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#10b981';
    const expected = t.reason || t.expected || t.description || 'Element present and visible';
    return `<tr style="border-bottom:1px solid #f1f5f9;background:${i%2===0?'#fff':'#f8fafc'}">
      <td style="padding:9px 12px;color:#64748b;font-weight:700;text-align:center">${i+1}</td>
      <td style="padding:9px 12px;font-weight:700;color:#1e293b;font-size:13px">${t.name}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${catColor};font-weight:700;font-size:10px">${catLabel.toUpperCase()}</span></td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${priColor};font-weight:700;font-size:10px">${priority.toUpperCase()}</span></td>
      <td style="padding:9px 12px;font-size:11px;color:#475569">${String(expected).substring(0,75)}</td>
    </tr>`;
  }).join('');

  const sectionMethodology = `
    ${secHdr('Smoke Test Methodology')}
    <p style="font-size:12px;color:#475569;line-height:1.7;margin-bottom:16px">
      Smoke Testing validates the most critical functionalities of the application before deeper testing
      proceeds — page accessibility, HTTP response, navigation, branding, essential UI elements, images,
      forms, security indicators, and basic rendering. Tests are executed automatically using Playwright in
      headless Chromium, checking element presence and visibility against the live DOM.
    </p>
    ${secHdr('Smoke Test Scenarios')}
    ${secDesc(`Planned smoke checks for <b>${url}</b> — ${total} scenarios validating the most critical functionalities before deeper testing.`)}
    ${tblWrap(`${tblHdr([{l:'#',align:'center'},{l:'Scenario'},{l:'Category',align:'center'},{l:'Priority',align:'center'},{l:'Expected'}])}
      <tbody>${scenarioRows}</tbody></table>`)}`;

  // ── 6. RESULTS BY CATEGORY ────────────────────────────────────────────────
  const cats = {};
  allTests.forEach(t => {
    const [c] = getSmokeCategory(t);
    if (!cats[c]) cats[c] = { pass: 0, fail: 0, total: 0 };
    cats[c].total++;
    if (t.status === 'pass') cats[c].pass++; else if (t.status === 'fail') cats[c].fail++;
  });
  const catRows = Object.entries(cats).map(([cat, d]) => {
    const r = Math.round(d.pass / d.total * 100);
    const rc = r === 100 ? '#10b981' : r >= 60 ? '#f59e0b' : '#ef4444';
    const vc = d.fail === 0 ? '#10b981' : '#ef4444';
    const bg = d.fail === 0 ? 'rgba(16,185,129,.06)' : 'rgba(239,68,68,.06)';
    return `<tr style="background:${bg};border-bottom:1px solid #f1f5f9">
      <td style="padding:10px 12px;font-weight:700;color:#1e293b">${cat}</td>
      <td style="padding:10px 12px;text-align:center;color:#1e293b;font-weight:700">${d.total}</td>
      <td style="padding:10px 12px;text-align:center;color:#10b981;font-weight:700">${d.pass}</td>
      <td style="padding:10px 12px;text-align:center;color:#ef4444;font-weight:700">${d.fail}</td>
      <td style="padding:10px 12px;text-align:center;color:${rc};font-weight:700">${r}%</td>
      <td style="padding:10px 12px;text-align:center"><span style="color:${vc};font-weight:800;font-size:11px">${d.fail===0?'✅ PASS':'❌ FAIL'}</span></td>
    </tr>`;
  }).join('');
  const sectionCategorySummary = `
    ${secHdr('Results by Category')}
    ${tblWrap(`${tblHdr([{l:'Category'},{l:'Total',align:'center'},{l:'Passed',align:'center'},{l:'Failed',align:'center'},{l:'Pass Rate',align:'center'},{l:'Verdict',align:'center'}])}
      <tbody>${catRows}</tbody></table>`)}`;

  // ── 7. CHARTS (SVG) ───────────────────────────────────────────────────────
  const catEntries = Object.entries(cats);
  const catYMax = Math.max(...catEntries.map(([,d]) => d.total), 1);
  const chartW = 760, chartH = 300, mL = 44, mB = 80, mT = 24, mR = 24;
  const plotW = chartW - mL - mR, plotH = chartH - mT - mB;
  const barSlot = plotW / (catEntries.length || 1);
  const barW = Math.min(46, barSlot * 0.5);
  const catBars = catEntries.map(([cat, d], i) => {
    const xCenter = mL + barSlot * i + barSlot / 2;
    const x = xCenter - barW / 2;
    const passH = (d.pass / catYMax) * plotH;
    const failH = (d.fail / catYMax) * plotH;
    const yBase = mT + plotH;
    const passY = yBase - passH;
    const failY = passY - failH;
    return `
      <rect x="${x}" y="${passY}" width="${barW}" height="${Math.max(passH,0)}" fill="#10b981" rx="2"/>
      <rect x="${x}" y="${failY}" width="${barW}" height="${Math.max(failH,0)}" fill="#ef4444" rx="2"/>
      <text x="0" y="0" font-size="10" fill="#475569" text-anchor="end" transform="translate(${xCenter},${yBase+12}) rotate(-30)">${cat.toUpperCase()}</text>`;
  }).join('');
  const catGrid = Array.from({length: catYMax+1}, (_,t) => {
    const y = mT + plotH - (t/catYMax)*plotH;
    return `<line x1="${mL}" y1="${y}" x2="${mL+plotW}" y2="${y}" stroke="#f1f5f9"/><text x="${mL-8}" y="${y+4}" font-size="10" fill="#94a3b8" text-anchor="end">${t}</text>`;
  }).join('');

  const worstCat = catEntries.length ? catEntries.reduce((a,b) => cats[b[0]].fail > cats[a[0]].fail ? b : a)[0] : null;
  const catInsight = worstCat && cats[worstCat].fail > 0
    ? `${worstCat} currently has the most failures (${cats[worstCat].fail}) — this is the category to prioritize first.`
    : 'No category shows any failures — coverage is currently clean across the board.';

  const distTotal = pass + fail + skip || 1;
  const distItems = [
    { l: 'Passed', v: pass, c: '#10b981' },
    { l: 'Failed', v: fail, c: '#ef4444' },
    { l: 'Skipped', v: skip, c: '#f59e0b' },
  ];
  const distMax = Math.max(...distItems.map(d=>d.v), 1);
  const distBars = distItems.map((d,i) => {
    const y = 20 + i * 50;
    const w = (d.v / distMax) * 500;
    return `
      <rect x="90" y="${y}" width="${w}" height="28" fill="${d.c}" rx="4"/>
      <text x="80" y="${y+19}" font-size="12" fill="#475569" text-anchor="end" font-weight="700">${d.l}</text>
      <text x="${100+w}" y="${y+19}" font-size="12" fill="#1e293b" font-weight="700">${d.v} (${Math.round(d.v/distTotal*100)}%)</text>`;
  }).join('');
  const distInsight = `Out of ${distTotal} executed checks: ${pass} passed (${Math.round(pass/distTotal*100)}%), ${fail} failed (${Math.round(fail/distTotal*100)}%), and ${skip} skipped (${Math.round(skip/distTotal*100)}%).`;

  const sectionCharts = `
    ${secHdr('Category Breakdown Chart')}
    ${secDesc('This chart compares the number of passed and failed checks across each smoke test category, helping you quickly spot which areas need attention.')}
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px 20px 10px;margin-bottom:8px">
      <svg viewBox="0 0 ${chartW} ${chartH}" style="width:100%;height:auto">
        ${catGrid}
        <line x1="${mL}" y1="${mT}" x2="${mL}" y2="${mT+plotH}" stroke="#cbd5e1"/>
        <line x1="${mL}" y1="${mT+plotH}" x2="${mL+plotW}" y2="${mT+plotH}" stroke="#cbd5e1"/>
        ${catBars}
        <rect x="${chartW-150}" y="4" width="10" height="10" fill="#10b981"/><text x="${chartW-135}" y="13" font-size="10" fill="#475569">Passed</text>
        <rect x="${chartW-75}" y="4" width="10" height="10" fill="#ef4444"/><text x="${chartW-60}" y="13" font-size="10" fill="#475569">Failed</text>
      </svg>
    </div>
    ${insightBox(catInsight, ACCENT)}

    ${secHdr('Pass / Fail / Skipped Distribution')}
    ${secDesc('This chart shows the overall distribution of test outcomes — how many checks passed, failed, or were skipped during this smoke run.')}
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:8px">
      <svg viewBox="0 0 760 190" style="width:100%;height:auto">${distBars}</svg>
    </div>
    ${insightBox(distInsight, ACCENT)}`;

  // ── 8. DETAILED RESULTS ───────────────────────────────────────────────────
  const detailRows = allTests.map((t, i) => {
    const sc = t.status==='pass'?'#10b981':t.status==='fail'?'#ef4444':'#f59e0b';
    const sl = t.status==='pass'?'✓ PASS':t.status==='fail'?'✗ FAIL':'■ SKIP';
    const sb = t.status==='pass'?'rgba(16,185,129,.06)':t.status==='fail'?'rgba(239,68,68,.06)':'rgba(245,158,11,.06)';
    const [catLabel, catColor] = getSmokeCategory(t);
    const reason = t.reason || t.suite || t.error || '—';
    return `<tr style="border-bottom:1px solid #f1f5f9;background:${i%2===0?'#fff':'#f8fafc'}">
      <td style="padding:9px 12px;color:#64748b;font-weight:700;text-align:center">${i+1}</td>
      <td style="padding:9px 12px;font-weight:700;color:#1e293b;font-size:13px">${t.name}</td>
      <td style="padding:9px 12px;text-align:center"><span style="color:${catColor};font-weight:700;font-size:10px">${catLabel.toUpperCase()}</span></td>
      <td style="padding:9px 12px;text-align:center;background:${sb}"><span style="color:${sc};font-weight:800;font-size:11px">${sl}</span></td>
      <td style="padding:9px 12px;font-size:11px;color:#475569">${String(reason).substring(0,90)}</td>
      <td style="padding:9px 12px;text-align:center;font-size:11px;color:#64748b;font-weight:700">${t.duration||'—'}</td>
    </tr>`;
  }).join('');
  const sectionDetailedResults = `
    ${secHdr('Detailed Smoke Results', '#0d9488')}
    ${secDesc('Real results from Playwright execution. Every value comes directly from the test runner.')}
    ${tblWrap(`${tblHdr([{l:'#',align:'center'},{l:'Test Name'},{l:'Category',align:'center'},{l:'Status',align:'center'},{l:'Result / Reason'},{l:'Duration',align:'center'}])}
      <tbody>${detailRows}</tbody></table>`, '#0d9488')}`;

  // ── 9. TOP FINDINGS ───────────────────────────────────────────────────────
  const failList = allTests.filter(t=>t.status==='fail').map(t => t.name + (t.reason ? ` — ${t.reason.substring(0,60)}` : ''));
  const passList = allTests.filter(t=>t.status==='pass').map(t => t.name);
  const findings = [...failList.slice(0,8).map(f=>[false,f]), ...passList.slice(0,8).map(p=>[true,p])];
  const sectionFindings = `
    ${secHdr('Top Findings')}
    ${secDesc('Quick-glance summary of the most relevant outcomes from this run.')}
    <div style="background:#fafafa;border:1px solid #e2e8f0;border-radius:10px;padding:4px 0;margin-bottom:16px">
      ${findings.length === 0
        ? `<div style="padding:16px;text-align:center;color:#94a3b8;font-size:12px">No findings to display.</div>`
        : findings.map(([ok, text]) => `
          <div style="padding:8px 16px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#1e293b">
            <span style="color:${ok?'#10b981':'#ef4444'};font-weight:700">${ok?'✓':'⚠'}</span>
            &nbsp;${String(text).substring(0,90)}
          </div>`).join('')}
    </div>`;

  // ── 10. AI ANALYSIS + RECOMMENDATIONS + ACTION PLAN ──────────────────────
  const aiResult = generation?.result?.ai || runResults?.ai || {};
  const aiSummary = aiResult.summary || `This smoke run executed ${total} critical checks on <b>${url}</b>, with ${pass} passed and ${fail} failed (${rate}% pass rate). ${critical_fail ? 'Critical failures were detected and should be resolved before deployment.' : 'No critical failures were detected — the build is a reasonable candidate for the next testing phase.'}`;
  const aiRecs = aiResult.recommendations || [];
  const aiActionPlan = aiResult.action_plan || [];

  const recRows = aiRecs.map(r => {
    const pri = (r.priority || 'medium').toLowerCase();
    const pc = pri === 'high' ? '#ef4444' : pri === 'medium' ? '#f59e0b' : '#10b981';
    return `<tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:9px 12px;text-align:center"><span style="color:${pc};font-weight:700;font-size:10px">${pri.toUpperCase()}</span></td>
      <td style="padding:9px 12px;font-size:11px;color:#4f46e5;font-weight:700">${(r.category||'').toUpperCase()}</td>
      <td style="padding:9px 12px;font-size:11px;color:#1e293b">${(r.issue||'').substring(0,70)}</td>
      <td style="padding:9px 12px;font-size:11px;color:#475569">${(r.fix||'').substring(0,80)}</td>
    </tr>`;
  }).join('');

  const sectionAI = `
    ${secHdr('AI Analysis', '#4f46e5')}
    <p style="font-size:12px;color:#475569;line-height:1.7;margin-bottom:16px">${aiSummary}</p>
    ${secHdr('AI Recommendations', '#4f46e5')}
    ${secDesc('Consolidated recommendations derived from execution evidence and page profile analysis.')}
    ${aiRecs.length > 0
      ? tblWrap(`${tblHdr([{l:'Priority',align:'center'},{l:'Category'},{l:'Issue'},{l:'Recommended Fix'}])}<tbody>${recRows}</tbody></table>`, '#4f46e5')
      : `<div style="color:#94a3b8;font-size:12px;padding:16px">No specific issues flagged by AI for this run.</div>`}
    ${aiActionPlan.length > 0 ? `
      ${secHdr('AI Generated Action Plan', '#c9a227')}
      ${aiActionPlan.map((step,i) => `
        <div style="display:flex;gap:10px;padding:9px 14px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:4px;font-size:12px;color:#475569">
          <span style="color:#c9a227;font-weight:700">${i+1}.</span> ${step}
        </div>`).join('')}` : ''}`;

  // ── 11. EXECUTIVE SUMMARY ─────────────────────────────────────────────────
  const topRecs = aiRecs.slice().sort((a,b) => ({high:0,medium:1,low:2}[a.priority]??1) - ({high:0,medium:1,low:2}[b.priority]??1)).slice(0,2);
  const sectionExec = topRecs.length ? `
    ${secHdr('Executive Summary', '#c9a227')}
    <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:10px">Top Priority Actions</div>
    ${topRecs.map((r,i) => `
      <div style="display:flex;gap:12px;background:#fafafa;border:1px solid #c9a227;border-radius:10px;padding:14px 16px;margin-bottom:8px">
        <div style="width:22px;height:22px;border-radius:50%;background:#c9a227;color:#fff;font-weight:700;font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i+1}</div>
        <div>
          <div style="font-size:9px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">${(r.category||'').toUpperCase()}</div>
          <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:3px">${r.issue||''}</div>
          <div style="font-size:12px;color:#64748b">${r.fix||''}</div>
        </div>
      </div>`).join('')}
    ${insightBox(`These ${topRecs.length} action(s) target the largest contributors to the current score of ${score}/100. Re-run the smoke suite after applying them to confirm improvement.`, '#c9a227')}` : '';

  // ── 12. ENVIRONMENT & EXECUTION INFO ──────────────────────────────────────
  const sectionEnv = `
    ${secHdr('Environment & Execution Info', ACCENT)}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      ${[
        ['BROWSER', 'Chromium (headless)'],
        ['FRAMEWORK', framework],
        ['VIEWPORT', '1920×1080'],
        ['EXECUTION TIME', totalMs ? `${(totalMs/1000).toFixed(2)}s` : 'N/A'],
        ['CHECKS RUN', String(total)],
        ['NEXTEST VERSION', '1.0.0'],
      ].map(([l,v]) => `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid ${ACCENT};border-radius:8px;padding:10px 14px">
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${ACCENT};margin-bottom:4px">${l}</div>
          <div style="font-size:12px;font-weight:700;color:#1e293b">${v}</div>
        </div>`).join('')}
    </div>`;

  // ── 13. FINAL VERDICT ─────────────────────────────────────────────────────
  const vc = critical_fail ? '#ef4444' : highPriorityFailCount > 0 || fail > 0 ? '#b45309' : '#059669';
  const vb = critical_fail ? '#fef2f2' : highPriorityFailCount > 0 || fail > 0 ? '#fffbeb' : '#f0fdf4';
  const vi = critical_fail ? '🔴' : highPriorityFailCount > 0 || fail > 0 ? '🟡' : '🟢';
  const vt = critical_fail
    ? `Smoke Test FAILED — critical checks did not pass on ${url}. Core page structure, authentication, or connectivity issues were detected. Deployment is NOT recommended until these are resolved.`
    : highPriorityFailCount > 0
    ? `Smoke Test passed with ${highPriorityFailCount} high-priority issue(s) on ${url}. Core functionality is operational, but the failed check(s) should be reviewed before deployment.`
    : fail > 0
    ? `Smoke Test passed with ${fail} non-critical issue(s) on ${url}. Core functionality is operational but the failing checks should be reviewed before full deployment.`
    : `Smoke Test PASSED — all ${pass} checks succeeded on ${url}. The application is stable and ready to proceed to deeper functional and regression testing.`;

  const sectionVerdict = `
    ${secHdr('Final AI Verdict', ACCENT)}
    <div style="background:${vb};border:2px solid ${vc};border-radius:12px;padding:18px 22px;margin-bottom:16px">
      <div style="font-size:14px;font-weight:700;color:${vc};margin-bottom:8px">${vi} Final Verdict</div>
      <p style="font-size:13px;color:${vc};margin:0 0 12px;line-height:1.6">${vt}</p>
      <div style="font-size:12px">
        <span style="color:#64748b;font-weight:700">Smoke Quality Score: </span><span style="color:${vc};font-weight:700">${score}/100</span>
        <span style="color:#94a3b8;margin:0 10px">|</span>
        <span style="color:#64748b;font-weight:700">Risk Level: </span><span style="color:${vc};font-weight:700">${riskLevel}</span>
        <span style="color:#94a3b8;margin:0 10px">|</span>
        <span style="color:#64748b;font-weight:700">Overall Health: </span><span style="color:${vc};font-weight:700">${scoreLabel}</span>
      </div>
    </div>`;

  // ── 14. CERTIFICATE ───────────────────────────────────────────────────────
  const sectionCert = `
    ${secHdr('Certificate of Smoke Test Validation', ACCENT)}
    ${secDesc('Official validation summary confirming the outcome of this smoke test run — issued automatically by NexTest AI based on the results above.')}
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;margin-bottom:20px">
      <div style="height:4px;background:${scoreColor}"></div>
      <div style="padding:24px;text-align:center">
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#94a3b8;margin-bottom:8px">CERTIFICATE OF SMOKE TEST VALIDATION</div>
        <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:10px">${url}</div>
        <div style="font-size:38px;font-weight:800;color:${scoreColor};margin-bottom:10px">${score}<span style="font-size:16px;color:#cbd5e1">/100</span></div>
        <div style="display:flex;align-items:center;justify-content:center;gap:12px">
          <span style="background:${scoreColor};color:#fff;font-weight:700;font-size:12px;padding:5px 16px;border-radius:20px">GRADE ${grade}</span>
          <span style="border:1px solid ${scoreColor};color:${scoreColor};font-weight:700;font-size:12px;padding:5px 16px;border-radius:20px">${scoreLabel.toUpperCase()}</span>
        </div>
      </div>
      <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:10px;text-align:center;font-size:10px;color:#94a3b8">
        Validated by <b style="color:#475569">NexTest AI</b> · ${dateStr}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px">
      ${[
        ['Validation Date', `${dateStr} ${timeStr}`, ACCENT, '#f0f9ff'],
        ['Framework', framework, ACCENT, '#f0f9ff'],
        ['Browser', 'Chromium (headless)', '#6366f1', '#eef2ff'],
        ['Viewport', '1920×1080', '#6366f1', '#eef2ff'],
        ['Execution Time', totalMs ? `${(totalMs/1000).toFixed(2)}s` : 'N/A', '#8b5cf6', '#f5f3ff'],
        ['Smoke Quality Score', `${score}/100`, '#8b5cf6', '#f5f3ff'],
        ['Overall Grade', grade, '#10b981', '#f0fdf4'],
        ['AI Validation Status', 'Verified by NexTest AI', '#10b981', '#f0fdf4'],
      ].map(([l,v,c,bg]) => `
        <div style="background:${bg};border-left:3px solid ${c};padding:12px 16px">
          <div style="font-size:9px;font-weight:700;color:${c};margin-bottom:3px">${l}</div>
          <div style="font-size:12px;color:#1e293b">${v}</div>
        </div>`).join('')}
    </div>`;

  // ── FULL HTML DOCUMENT ────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>NexTest Smoke Report #${genId}</title>
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

  <div style="background:linear-gradient(135deg,#0a0f1e 0%,#082530 50%,#0a0f1e 100%);
    border-radius:20px;padding:40px 48px;margin-bottom:32px;position:relative;overflow:hidden">
    <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,transparent,${ACCENT},transparent)"></div>
    <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:${ACCENT}"></div>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:20px">
      <div>
        <div style="font-size:28px;font-weight:700;color:#fff;letter-spacing:2px;margin-bottom:4px">
          <span style="color:${ACCENT}">NEX</span>TEST
        </div>
        <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:8px">Smoke Test Report</div>
        <div style="font-size:11px;color:#94a3b8">Generated ${dateStr} · ${timeStr}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:28px">
      ${[
        {l:'URL', v:`<span style="color:#7dd3fc;font-size:11px;word-break:break-all">${url}</span>`},
        {l:'Framework', v:`<span style="color:${ACCENT};font-weight:700">${framework}</span>`},
        {l:'Test Type', v:`<span style="color:${ACCENT};font-weight:700">Smoke Test</span>`},
        {l:'Generated', v:`<span style="color:#fff">${dateStr}</span>`},
      ].map(r => `<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:12px 14px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4f6480;margin-bottom:5px">${r.l}</div>
        <div style="font-size:12px">${r.v}</div>
      </div>`).join('')}
    </div>
  </div>

  <div class="no-print" style="margin-bottom:28px">
    <button onclick="window.print()" style="padding:10px 24px;border-radius:10px;background:linear-gradient(135deg,${ACCENT},#0284c7);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
      🖨 Print / Save as PDF
    </button>
  </div>

  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:12px">
    ${[
      {icon:'✅',val:pass,lbl:'PASSED',c:'#10b981',bg:'#d1fae5',bd:'#a7f3d0'},
      {icon:'❌',val:fail,lbl:'FAILED',c:'#ef4444',bg:'#fee2e2',bd:'#fca5a5'},
      {icon:'⏭️',val:skip,lbl:'SKIPPED',c:'#f59e0b',bg:'#fef3c7',bd:'#fde68a'},
      {icon:'🎯',val:`${rate}%`,lbl:'PASS RATE',c:rateColor,bg:'#eff6ff',bd:'#bfdbfe'},
      {icon:'🔢',val:total,lbl:'TOTAL',c:'#3b82f6',bg:'#dbeafe',bd:'#93c5fd'},
    ].map(s => `<div style="background:${s.bg};border:1px solid ${s.bd};border-radius:14px;padding:20px;text-align:center">
      <div style="font-size:20px;margin-bottom:8px">${s.icon}</div>
      <div style="font-size:36px;font-weight:700;color:${s.c};line-height:1;margin-bottom:4px">${s.val}</div>
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:${s.c};opacity:.8;text-transform:uppercase">${s.lbl}</div>
    </div>`).join('')}
  </div>

  ${sectionOverview}
  ${sectionKeyMetrics}
  ${sectionScreenshot}
  ${sectionScore}
  ${sectionMethodology}
  ${sectionCategorySummary}
  ${sectionCharts}
  ${sectionDetailedResults}
  ${sectionFindings}
  ${sectionAI}
  ${sectionExec}
  ${sectionEnv}
  ${sectionVerdict}
  ${sectionCert}

  <div style="margin-top:48px;padding:20px 28px;background:rgba(14,165,233,.04);border-radius:12px;
    display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;border:1px solid rgba(14,165,233,.15)">
    <div style="font-size:14px;font-weight:700;color:#64748b"><span style="color:${ACCENT}">NEX</span>TEST · Smoke Test Report</div>
    <div style="font-size:11px;color:#94a3b8">Generated ${dateStr} · ${framework} · ${total} checks · ${rate}% pass rate · Score: ${score}/100</div>
  </div>

</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `smoke_report_${genId}.html`;
  link.click();
  saveReportToStorage({
    url, framework, testType: 'smoke',
    passCount: pass, failCount: fail,
    htmlContent: html,
    generationData: generation,
  });
  setDropdownOpen(false);
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
                  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#10b981', letterSpacing: .5 }}>{isSeo ? 'XLSX' : 'CSV'}</span>
<div><div style={{ fontSize: 12, fontWeight: 700 }}>{isSeo ? 'rapport.xlsx' : 'rapport.csv'}</div><div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{isSeo ? 'Classeur Excel' : 'Données tabulaires'}</div></div>
                </button>
                <button onClick={isSecurity ? downloadHtml_Security : isRegression ? downloadHtml_Regression : isFunctional ? downloadHtml_Functional : isSeo ? downloadHtml_Seo : isSmoke ? downloadHtml_Smoke : downloadHtml}

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
    { key: 'results',         label: 'Test Cases',     count: running ? 0 : tests.length, Icon: IconFileText },
    { key: 'scenarios',       label: 'Scenarios',       count: running ? 0 : tests.length, Icon: IconTarget },
    { key: 'recommendations', label: 'Recommendations', count: running ? 0 : (generation?.result?.ai?.recommendations || []).length, Icon: IconBulb },
  ].map(tab => (
    <button
      key={tab.key}
      onClick={() => { if (!running) setActiveTab(tab.key); }}
      disabled={running}
      style={{
        padding: '10px 18px', border: 'none', background: 'none',
        cursor: running ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--D)', fontSize: 13, fontWeight: 700,
        color: running ? 'var(--dimmed)' : (activeTab === tab.key ? 'var(--indigo2)' : 'var(--muted)'),
        borderBottom: !running && activeTab === tab.key ? '2px solid var(--indigo2)' : '2px solid transparent',
        marginBottom: -1, transition: 'all .18s',
        display: 'flex', alignItems: 'center', gap: 8,
        opacity: running ? 0.45 : 1,
      }}
    >
      <tab.Icon size={15} stroke={1.8} />
      {tab.label}
      <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: running ? 'var(--bg2)' : (activeTab === tab.key ? 'var(--indigo-bg)' : 'var(--bg2)'), color: running ? 'var(--dimmed)' : (activeTab === tab.key ? 'var(--indigo2)' : 'var(--muted)') }}>{tab.count}</span>
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
    if (diff < 60)     return t('plSecondsAgo').replace('{n}', Math.floor(diff));
    if (diff < 3600)   return t('plMinutesAgo').replace('{n}', Math.floor(diff / 60));
    if (diff < 86400)  return t('plHoursAgo').replace('{n}', Math.floor(diff / 3600));
    if (diff < 604800) return t('plDaysAgo').replace('{n}', Math.floor(diff / 86400));

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
      const cfg  = TYPE_ICONS[g.test_type] || TYPE_ICONS.smoke;
      return {
        icon:       cfg.icon,
        color:      cfg.color,
        border:     cfg.border,
        kind:       'generation',
        testType:   g.test_type,
        url:        g.url,
        time:       timeAgo(g.created_at),
        created_at: g.created_at,
      };
    });

    const projActivities = projs.map(p => ({
      icon:  <svg width="16" height="16" fill="none" stroke="#818cf8" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
      color:      'rgba(99,102,241,.12)',
      border:     'rgba(99,102,241,.25)',
      kind:       'project',
      projectName: p.name,
      time:        timeAgo(p.created_at),
      created_at:  p.created_at,
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
} catch(err) { setError(t('acRevokeSessionsError')); }  setLoading(false);
};

const deactivateAccount = async () => {
  setLoading(true);
  try {
    await api.put('/profile/deactivate');
    setUser(null);
  } catch(err) { setError(t('acDeactivateError')); }
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
        <div style={{ fontSize:16, fontWeight:700, color:'var(--text, #e8eaf0)' }}>{t('acDeactivateAccountBtn')}</div>
      </div>

      <p style={{ fontSize:13, color:'var(--muted, #8892a4)', lineHeight:1.6, marginBottom:22 }}>
        {t('acDeactivateModalText')}
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
         {t('plCancel')}
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
{loading ? <><span className="spinner"/> {t('acDeactivating')}</> : t('acYesDeactivate')}</button>
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
              const labels = { developer:t('roleDeveloper'), tester:t('roleTester'), lead:t('roleLead'), other:t('acExplorer') };
              return labels[role] || t('qaEngineer');
            })()}
          </div>
        </div>
        <div className="ac2-hero-email">{user?.email || '—'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {t('acMemberSince')} {user?.created_at 
  ? new Date(user.created_at).toLocaleDateString('en-US', {month:'short', year:'numeric'}) 
  : '—'}
          </span>
          <span style={{ color: 'var(--muted)' }}>|</span>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
       {t('acLastLoginPrefix')} {stats.last_login || '—'}
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
          <span style={{ fontSize:10, color:'var(--muted)', marginTop:4, fontWeight:600 }}>{t('acTestRuns')}</span>
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
          <span style={{ fontSize:10, color:'var(--muted)', marginTop:4, fontWeight:600 }}>{t('projects')}</span>
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
          <span style={{ fontSize:10, color:'var(--muted)', marginTop:4, fontWeight:600 }}>{t('acSuccessRate')}</span>
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
          <span style={{ fontSize:10, color:'var(--muted)', marginTop:4, fontWeight:600 }}>{t('alerts')}</span>
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
        <div className="ac2-card-sub">{t('acUpdatePersonalDetails')}</div>
      </div>
    </div>
    <div className="ac2-card-body">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        {/* Full Name */}
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>{t('fullName')}</label>
          <div style={{ position:'relative' }}>
            <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            <input value={name} onChange={e => setName(e.target.value)} style={{ background:'rgba(255,255,255,.04)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px 9px 32px', fontSize:13, color:'var(--text)', outline:'none', width:'100%' }}/>
          </div>
        </div>
        {/* Phone */}
<div style={{ display:'flex', flexDirection:'column', gap:4 }}>
  <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>{t('acPhoneNumber')}</label>
  <div style={{ position:'relative' }}>
    <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l1.17-1.17a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
    <input 
      value={phone} 
      onChange={e => setPhone(e.target.value)}
      placeholder={t('acPhonePlaceholder')}
      style={{ background:'rgba(255,255,255,.04)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px 9px 32px', fontSize:13, color:'var(--text)', outline:'none', width:'100%' }}
    />
  </div>
</div>
        {/* Company */}
<div style={{ display:'flex', flexDirection:'column', gap:4 }}>
  <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>{t('acCompany')}</label>
  <div style={{ position:'relative' }}>
    <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    <input 
      value={company} 
      onChange={e => setCompany(e.target.value)}
      placeholder={t('acCompanyPlaceholder')}
      style={{ background:'rgba(255,255,255,.04)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px 9px 32px', fontSize:13, color:'var(--text)', outline:'none', width:'100%' }}
    />
  </div>
</div>
        {/* Email */}
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>{t('emailAddress')}</label>
          <div style={{ position:'relative' }}>
            <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" style={{ background:'rgba(255,255,255,.04)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px 9px 32px', fontSize:13, color:'var(--text)', outline:'none', width:'100%' }}/>
          </div>
        </div>
        {/* Position */}
<div style={{ display:'flex', flexDirection:'column', gap:4 }}>
  <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>{t('acPosition')}</label>
  <div style={{ position:'relative' }}>
    <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
    <input 
      value={position} 
      onChange={e => setPosition(e.target.value)}
      placeholder={t('acPositionPlaceholder')}
      style={{ background:'rgba(255,255,255,.04)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px 9px 32px', fontSize:13, color:'var(--text)', outline:'none', width:'100%' }}
    />
  </div>
</div>
</div>
      <button onClick={saveProfile} disabled={loading} style={{ width:'100%', padding:'11px', borderRadius:10, background:'linear-gradient(135deg,#b8860b,#c9a227)', border:'none', color:'#000', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        {loading ? t('saving') : t('saveChanges')}
      </button>
    </div>
  </div>

  {/* Card 2 : Security Settings */}
  <div className="ac2-card">
  <div className="ac2-card-head">
    <div className="ac2-card-head-icon">{IconShield}</div>
    <div>
      <div className="ac2-card-title">{t('acSecuritySettings')}</div>
      <div className="ac2-card-sub">{t('acManageSecurity')}</div>
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
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{t('changePassword')}</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{t('acUpdatePwdRegularly')}</div>
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
            <span className="ac2-strength-label">{newPwd.length<4?t('acWeak'):newPwd.length<7?t('acFair'):newPwd.length<10?t('acGood'):t('acStrong')}</span>
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
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{t('acLoginHistory')}</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{t('acViewLoginActivity')}</div>
        </div>
      </div>
      <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: showLoginHistory ? 'rotate(90deg)' : 'none', transition:'transform .2s' }}><polyline points="9 18 15 12 9 6"/></svg>
    </div>
    {showLoginHistory && (
      <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,.02)' }}>
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:1, background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:10, color:'var(--muted)', fontWeight:600, marginBottom:4 }}>{t('acIpAddress')}</div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{user?.last_login_ip || '—'}</div>
          </div>
          <div style={{ flex:1, background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:10, color:'var(--muted)', fontWeight:600, marginBottom:4 }}>{t('acLastLoginLabel')}</div>
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
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{t('acActiveSessions')}</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{t('acManageSessions')}</div>
        </div>
      </div>
      <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: showSessions ? 'rotate(90deg)' : 'none', transition:'transform .2s' }}><polyline points="9 18 15 12 9 6"/></svg>
    </div>
    {showSessions && (
      <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,.02)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ fontSize:12, color:'var(--muted)' }}>
            <span style={{ color:'#22c55e', fontWeight:700, fontSize:18 }}>{sessionCount}</span> {sessionCount > 1 ? t('acActiveSessionsPlural') : t('acActiveSessionSingular')}
          </div>
          <button onClick={revokeAllSessions} disabled={loading}
            style={{ fontSize:12, fontWeight:600, color:'#ef4444', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, padding:'6px 14px', cursor:'pointer' }}>
            {t('acRevokeAll')}
          </button>
        </div>
        <div style={{ fontSize:11, color:'var(--muted)' }}>{t('acRevokeAllDesc')}</div>
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
          <div style={{ fontSize:13, fontWeight:600, color:'#ef4444' }}>{t('acDangerZone')}</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{t('acDeactivateAccount')}</div>
        </div>
      </div>
      <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: showDanger ? 'rotate(90deg)' : 'none', transition:'transform .2s' }}><polyline points="9 18 15 12 9 6"/></svg>
    </div>
    {showDanger && (
      <div style={{ padding:'16px 20px', background:'rgba(239,68,68,.03)' }}>
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:12, lineHeight:1.6 }}>
         {t('acDeactivateWarningPart1')} <strong style={{ color:'#ef4444' }}>{t('acDisableAccess')}</strong> {t('acDeactivateWarningPart2')}
</div>
        <button onClick={() => setShowDeactivateModal(true)} disabled={loading}

          style={{ width:'100%', padding:'11px', borderRadius:10, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', color:'#ef4444', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
          {t('acDeactivateAccountBtn')}
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
          <div className="ac2-card-title">{t('recentActivity')}</div>
          <div className="ac2-card-sub">{t('acLatestActions')}</div>
        </div>
      </div>
      
    </div>
    <div className="ac2-card-body" style={{ padding:0 }}>
      {recentActivity.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
          {t('acNoActivityYet')}
        </div>
      ) : recentActivity.map((item, i, arr) => (
       <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none', transition:'background .15s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.02)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
          <div style={{ width:8, height:8, borderRadius:'50%', background: item.border, border:`2px solid ${item.color}`, flexShrink:0, boxShadow: `0 0 6px ${item.border}` }}/>
          <div style={{ width:34, height:34, borderRadius:9, flexShrink:0, background:item.color, border:`1px solid ${item.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>{item.icon}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>
              {item.kind === 'project'
                ? `${t('acProjectWord')} "${item.projectName}" ${t('acCreatedWord')}`
                : `${{ smoke:t('typeSmoke'), functional:t('typeFunctional'), performance:t('typePerformance'), security:t('typeSecurity'), regression:t('typeRegression'), api:t('typeApi'), seo:t('typeSeo') }[item.testType] || t('test')} ${t('acRunOn')} ${item.url}`}
            </div>
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
    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t('acQuickActions')}</span>
  </div>
  <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, marginLeft: 28 }}>{t('acShortcuts')}</p>
  <div style={{ display: 'flex', gap: 12 }}>
     {[{ label: t('acCreateProject'), sub: t('acStartNewProject'), color: '#818cf8', bg: 'rgba(99,102,241,.08)', border: 'rgba(99,102,241,.2)',
        action: () => { setProjectStep('create'); setPage('generate'); },
        icon: <svg width="22" height="22" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg> },
      { label: t('acRunTests'), sub: t('acExecuteTests'), color: '#22c55e', bg: 'rgba(34,197,94,.08)', border: 'rgba(34,197,94,.2)',
        action: () => { setProjectStep('list'); setPage('generate'); },
        icon: <svg width="22" height="22" fill="none" stroke="#22c55e" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> },
      { label: t('acViewReports'), sub: t('acExploreReports'), color: '#c9a227', bg: 'rgba(201,162,39,.08)', border: 'rgba(201,162,39,.2)',
        action: () => setPage('reports'),
        icon: <svg width="22" height="22" fill="none" stroke="#c9a227" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
      { label: t('settings'), sub: t('acManagePreferences'), color: '#94a3b8', bg: 'rgba(148,163,184,.08)', border: 'rgba(148,163,184,.2)',
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
  const { t } = useLang();
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
    smoke:       { label: t('typeSmoke'),       color: '#64748b', icon: '🔍' },
    functional:  { label: t('typeFunctional'),  color: '#6366f1', icon: '⚙️' },
    performance: { label: t('typePerformance'), color: '#8b5cf6', icon: '⚡' },
    api:         { label: t('typeApi'),         color: '#10b981', icon: '🔗' },
    regression:  { label: t('typeRegression'),  color: '#f97316', icon: '🔄' },
    security:    { label: t('typeSecurity'),    color: '#ef4444', icon: '🔒' },
    seo:         { label: t('typeSeo'),         color: '#06b6d4', icon: '🔎' },
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

const downloadCsv = async (report) => {
  const genId = report.generationData?.generation?.id;
  if (!genId) {
    alert("Excel export unavailable: this report has no linked generation ID.");
    return;
  }
  try {
    const res = await api.get(`/generations/${genId}/xlsx`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${report.testType || 'report'}_report_${genId}.xlsx`;
    link.click();
  } catch (err) {
    console.error('[XLSX] download error', err);
    alert('Excel export failed: ' + (err.response?.data?.error || err.message));
  }
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
    if (lastVal === 0 && thisVal === 0) return { label: t('rpNoDataYet'), positive: null };
    if (lastVal === 0) return { label: `+${thisVal} ${t('rpThisWeekSuffix')}`, positive: !invertBad };
    const pct  = Math.round(((thisVal - lastVal) / lastVal) * 100);
    const sign = pct >= 0 ? '+' : '';
    return { label: `${sign}${pct}% ${t('rpVsLastWeek')}`, positive: pct === 0 ? null : (pct > 0 ? !invertBad : invertBad) };
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
                  {total + skip} {t('tests')}
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
                      {t('rpFullPreview')}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ width:'100%', height:160, borderRadius:10, border:'1px solid var(--border)', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontSize:11 }}>
                 {t('rpNoPreview')}
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>{t('rpTestSummary')}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {[
                      { val: report.passCount||0, lbl:t('passed'),  color:'#10b981', bg:'rgba(16,185,129,.12)', border:'rgba(16,185,129,.2)' },
{ val: report.failCount||0, lbl:t('failed'),  color:'#ef4444', bg:'rgba(239,68,68,.12)',   border:'rgba(239,68,68,.2)'  },
{ val: skip,                lbl:t('skipped'), color:'#f59e0b', bg:'rgba(245,158,11,.12)',  border:'rgba(245,158,11,.2)' },
{ val: total + skip,        lbl:t('total'),   color:'var(--text)', bg:'var(--bg2)', border:'var(--border)' },
                    ].map(s => (
                      <div key={s.lbl} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 12px', borderRadius:8, background:s.bg, border:`1px solid ${s.border}` }}>
                        <span style={{ fontSize:12, color:s.color, fontWeight:700 }}>{s.lbl}</span>
                        <span style={{ fontSize:15, fontWeight:800, color:s.color, fontFamily:'var(--C)' }}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>{t('rpTestEnvironment')}</div>
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
                        <span style={{ fontSize:12, color:'var(--muted)' }}>{t('rpDurationLabel')}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{dur}</span>
                      </div>
                    )}
                    {perf && avgResp && (
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 12px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8 }}>
                        <span style={{ fontSize:12, color:'var(--muted)' }}>{t('rpAvgResponse')}</span>
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
                    <IconEye size={13} stroke={2}/> {t('rpViewFullResults')}
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
  <IconFileTypeCsv size={12} stroke={2}/> XLSX
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
                  <IconTrash size={12} stroke={2}/> {t('rpDeleteBtn')}
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
                {count} {count !== 1 ? t('rpRunsWord') : t('rpRunWord')}
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'var(--muted)' }}>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {t('rpLastRun')}{timeStr(latest.date)}
              </span>
            </div>
          </div>

          {/* Sparkline of recent pass rates */}
          {rates.length > 1 && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flexShrink:0 }}>
              <Sparkline rates={rates} color={rc} />
<span style={{ fontSize:9, color:'var(--muted)', fontWeight:700 }}>{t('rpLastWord')} {rates.length}</span>            </div>
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
              {t('rpRunHistory')} ({count})
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
          <h1 className="p-title">{t('rpTitle1')}<span className="g"> {t('rpTitle2')}</span></h1>
<p className="p-sub">{t('rpSubtitle')}</p>
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
            <option value="all">{t('rpAllTime')}</option>
<option value="today">{t('rpToday')}</option>
<option value="week">{t('rpThisWeekFilter')}</option>
<option value="month">{t('rpThisMonth')}</option>
          </select>

          {/* New Generation */}
          <button onClick={() => goTo('generate')}
            style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 16px', borderRadius:9, background:'linear-gradient(135deg,var(--indigo),#4f46e5)', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', letterSpacing:'1px', textTransform:'uppercase', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(99,102,241,.3)' }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            {t('newGeneration')}
          </button>


        </div>
      </div>

      {reports.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'90px 32px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, textAlign:'center' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--indigo-bg)', border:'1px solid var(--indigo-border)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, color:'var(--indigo2)' }}>
            <IconFileText size={32} stroke={1.5} />
          </div>
          <h3 style={{ fontFamily:'var(--C)', fontSize:24, fontWeight:700, color:'var(--text)', marginBottom:8 }}>{t('rpNoReportsTitle')}</h3>
          <p style={{ fontSize:13, color:'var(--sub)', lineHeight:1.7, maxWidth:320, marginBottom:24 }}>
            {t('rpNoReportsDesc')}          </p>
          <button className="btn-primary" onClick={() => goTo('generate')}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            {t('rpGenerateTests')}
          </button>
        </div>
      ) : (
        <>
          {/* ── COMPACT STATS STRIP (pro icons) ── */}
<div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:20 }}>
  {[
    { Icon: IconFileText,    val: reports.length,          lbl: t('rpTotalReports'),  color: '#818cf8', trend: trendReports, barW: `${Math.min(100, reports.length * 5)}%`              },
    { Icon: IconCircleCheck, val: kpiTotalPass,             lbl: t('rpTestsPassed'),   color: '#10b981', trend: trendPass,    barW: `${kpiTotalTests > 0 ? Math.round(kpiTotalPass / kpiTotalTests * 100) : 0}%` },
    { Icon: IconCircleX,     val: kpiTotalFail,             lbl: t('rpTestsFailed'),   color: '#ef4444', trend: trendFail,    barW: `${kpiTotalTests > 0 ? Math.round(kpiTotalFail / kpiTotalTests * 100) : 0}%` },
    { Icon: IconTarget,      val: `${kpiAvgRate}%`,         lbl: t('rpAvgPassRate'),  color: rateColorOf(kpiAvgRate), trend: trendRate, barW: `${kpiAvgRate}%` },
    { Icon: IconActivity,    val: fmtDur(kpiTotalMinutes),  lbl: t('rpTotalDuration'), color: '#4f86e8', trend: trendDur,    barW: `${Math.min(100, kpiTotalMinutes / 10)}%`             },
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
          {t('rpPassRateTrend')}
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
          <option value="daily">{t('rpDaily')}</option>
<option value="weekly">{t('rpWeekly')}</option>
<option value="monthly">{t('rpMonthly')}</option>
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
        {t('rpTestsSummary')}
      </div>
      {(() => {
        const pass  = reports.reduce((s, r) => s + (r.passCount || 0), 0);
        const fail  = reports.reduce((s, r) => s + (r.failCount || 0), 0);
        const skip  = reports.reduce((s, r) => s + (r.skipCount  || 0), 0);
        const total = pass + fail + skip;
        const pct   = v => total > 0 ? Math.round(v / total * 100) : 0;

        const donutData = [
          { name: t('passed'),  value: pass, color: '#10b981' },
          { name: t('failed'),  value: fail, color: '#ef4444' },
          { name: t('skipped'), value: skip, color: '#f59e0b' },
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
                <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{t('rpTotalTestsSmall')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {[
               
                { label: t('passed'),  val: pass, color: '#10b981' },
                { label: t('failed'),  val: fail, color: '#ef4444' },
                { label: t('skipped'), val: skip, color: '#f59e0b' },
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
        {t('rpReportsByType')}
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
                <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{t('rpTotalSmall')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', maxHeight: 120 }}>
              {typeData.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', paddingTop: 20 }}>{t('rpNoDataYet')}</div>
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
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('rpSearchPlaceholder')}
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
                { id: 'timeline', label: `🕐 ${t('rpTimelineView')}` },
                { id: 'byTest',   label: `📊 ${t('rpByTestView')}`   },
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
              {['all', 'smoke', 'functional', 'performance', 'api', 'regression', 'security', 'seo'].map(tt => {
                const cfg = TYPE_CONFIG[tt];
                const active = filterType === tt;
                return (
                  <button key={tt} onClick={() => setFilterType(tt)}
                    style={{ padding:'7px 13px', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', border: active ? `1.5px solid ${cfg?.color || '#818cf8'}` : '1.5px solid var(--border)', background: active ? `${cfg?.color || '#818cf8'}15` : 'var(--card)', color: active ? (cfg?.color || '#818cf8') : 'var(--muted)', transition:'all .18s', textTransform:'capitalize' }}>
                    {tt === 'all' ? t('all') : cfg?.label}
                  </button>
                );
              })}
            </div>
          </div>

{/* ── TIMELINE / BY TEST ── */}
{(viewMode === 'timeline' ? filtered.length === 0 : groupedByTest.length === 0) ? (
  <div style={{ padding:'48px 32px', textAlign:'center', background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, color:'var(--muted)', fontSize:13 }}>
    {t('rpNoResultsFilters')}
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
            {label === 'Today' ? t('rpToday') : label === 'Yesterday' ? t('rpYesterday') : label === 'This Week' ? t('rpThisWeekGroup') : t('rpEarlier')}
          </span>
          <span style={{ fontSize:10, color:'var(--muted)', background:'var(--bg2)', border:'1px solid var(--border)', padding:'2px 8px', borderRadius:20 }}>
            {new Date(items[0]?.date).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}
          </span>
          <div style={{ flex:1, height:1, background:'var(--border)' }} />
          <span style={{ fontSize:10, color:'var(--muted)' }}>{items.length} {t('rpReportsWord')}</span>        </div>

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
      {t('rpShowing')}{' '}
      <span style={{ color: 'var(--text)', fontWeight: 700 }}>
        {(currentPage - 1) * ITEMS_PER_PAGE + 1}
      </span>{' '}
      {t('rpToWord')}{' '}
      <span style={{ color: 'var(--text)', fontWeight: 700 }}>
        {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
      </span>{' '}
      {t('rpOfWord')}{' '}
      <span style={{ color: 'var(--indigo2)', fontWeight: 700 }}>
        {filtered.length}
      </span>{' '}
      {t('rpReportsWord')}
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
        {t('rpPrevBtn')}
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
        {t('rpNextBtn')}
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
      {t('rpShowing')}{' '}
      <span style={{ color: 'var(--text)', fontWeight: 700 }}>
        {(currentPage - 1) * ITEMS_PER_PAGE + 1}
      </span>{' '}
      {t('rpToWord')}{' '}
      <span style={{ color: 'var(--text)', fontWeight: 700 }}>
        {Math.min(currentPage * ITEMS_PER_PAGE, groupedByTest.length)}
      </span>{' '}
      {t('rpOfWord')}{' '}
      <span style={{ color: 'var(--indigo2)', fontWeight: 700 }}>
        {groupedByTest.length}
      </span>{' '}
      {t('rpTestGroupsWord')}
    </span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', background: 'var(--card)', border: '1px solid var(--border)', color: currentPage === 1 ? 'var(--muted)' : 'var(--text)', opacity: currentPage === 1 ? 0.5 : 1 }}
      >
        {t('rpPrevBtn')}
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
        {t('rpNextBtn')}
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
   const { t } = useLang();

  const onNavigate = (page, step = null) => {
    if (step && setProjectStep) {
      setProjectStep(step);
    }
    goTo(page);
  };

  const sections = [
    { group: t('docsGettingStartedGroup'), items: [
      { id: 'overview',        label: t('docsOverview'),         Icon: IconLayoutDashboard },
      { id: 'getting-started', label: t('docsGettingStarted'),   Icon: IconRocket },
      { id: 'architecture',    label: t('docsArchitecture'),     Icon: IconCode },
      { id: 'frameworks',      label: t('docsFrameworks'),       Icon: IconTestPipe },
      { id: 'ai-engine',       label: t('docsAiEngine'),         Icon: IconRobot },
    ]},
    { group: t('docsTestTypesGroup'), items: [
      { id: 'smoke',       label: t('smokeLabel'),       Icon: IconEye },
      { id: 'functional',  label: t('functionalLabel'),  Icon: IconClick },
      { id: 'performance', label: t('performanceLabel'), Icon: IconBolt },
      { id: 'security',    label: t('securityLabel'),    Icon: IconShieldLock },
      { id: 'regression',  label: t('regressionLabel'),  Icon: IconRefresh },
      { id: 'api',         label: t('apiLabel'),         Icon: IconApi },
      { id: 'seo',         label: t('seoLabel'),         Icon: IconSeeding },
    ]},
    { group: t('docsMoreGroup'), items: [
      { id: 'reports',     label: t('docsReportsExports'), Icon: IconFileText },
      { id: 'flaky-tests', label: t('flakyTests'),         Icon: IconActivity  }, 
      { id: 'faq',         label: t('docsFaq'),            Icon: IconBulb },
    ]},
  ];

  const FRAMEWORKS = [
    { name:'Selenium',   color:'#43B02A', role:t('docsFwSeleniumRole'), usedFor:[t('docsFwUsedSmoke'),t('docsFwUsedFuncFallback')], lang:'Python' },
    { name:'Cypress',    color:'#00BFA5', role:t('docsFwCypressRole'), usedFor:[t('docsFwUsedSmokePublic')], lang:'JavaScript' },
    { name:'Playwright', color:'#E2574C', role:t('docsFwPlaywrightRole'), usedFor:[t('docsFwUsedSmoke'),t('functionalLabel'),t('performanceLabel'),t('regressionLabel')], lang:'Python' },
    { name:'Pytest',     color:'#3776AB', role:t('docsFwPytestRole'), usedFor:[t('apiLabel'),t('securityLabel')], lang:'Python' },
    { name:'Postman / Newman', color:'#FF6C37', role:t('docsFwPostmanRole'), usedFor:[t('apiLabel')], lang:'JSON / CLI' },
    { name:'k6',         color:'#7D64FF', role:t('docsFwK6Role'), usedFor:[t('performanceLabel')], lang:'JavaScript' },
    { name:'Requests + BeautifulSoup', color:'#06b6d4', role:t('docsFwRequestsRole'), usedFor:[t('seoLabel')], lang:'Python' },
  ];

  const content = {
    overview: {
      title: t('docsOvTitle'),
      desc: t('docsOvDesc'),
      items: [
        { Icon: IconRobot,        color:'#6366f1', bg:'rgba(99,102,241,.12)', title:t('docsOvF1Title'), desc:t('docsOvF1Desc') },
        { Icon: IconWorld, color:'#10b981', bg:'rgba(16,185,129,.12)', title:t('docsOvF2Title'), desc:t('docsOvF2Desc') },
        { Icon: IconChartBar,     color:'#8b5cf6', bg:'rgba(139,92,246,.12)', title:t('docsOvF3Title'), desc:t('docsOvF3Desc') },
        { Icon: IconBellRinging,  color:'#f59e0b', bg:'rgba(245,158,11,.12)', title:t('docsOvF4Title'), desc:t('docsOvF4Desc') },
        { Icon: IconTestPipe, color:'#E2574C', bg:'rgba(226,87,76,.12)', title:t('docsOvF5Title'), desc:t('docsOvF5Desc') },
        { Icon: IconShieldLock, color:'#ef4444', bg:'rgba(239,68,68,.12)', title:t('docsOvF6Title'), desc:t('docsOvF6Desc') },
      ]
    },
  };

 const testTypeContent = {
    smoke:       { color:'#64748b', badge:t('docsBadgeQuick30'), Icon: IconEye, title:t('smokeLabel'), scope:t('docsScopeBoth'), desc:t('docsSmokeDesc'), frameworks:[{n:'Selenium',c:'#43B02A'},{n:'Cypress',c:'#00BFA5'},{n:'Playwright',c:'#E2574C'}], steps:[t('docsSmokeStep1'),t('docsSmokeStep2'),t('docsSmokeStep3')], when:t('docsSmokeWhen'), config:[t('docsSmokeCfg1'),t('docsSmokeCfg2'),t('docsSmokeCfg3')], tips:[t('docsSmokeTip1'),t('docsSmokeTip2')] },
    functional:  { color:'#6366f1', badge:t('docsBadgeMedium1m'), Icon: IconClick, title:t('functionalLabel'), scope:t('docsScopeBoth'), desc:t('docsFunctionalDocDesc'), frameworks:[{n:'Playwright',c:'#E2574C'}], steps:[t('docsFuncStep1'),t('docsFuncStep2'),t('docsFuncStep3')], when:t('docsFuncWhen'), config:[t('docsFuncCfg1'),t('docsFuncCfg2'),t('docsFuncCfg3')], tips:[t('docsFuncTip1'),t('docsFuncTip2')] },
    performance: { color:'#8b5cf6', badge:t('docsBadgeAdv3m'), Icon: IconBolt, title:t('performanceLabel'), scope:t('docsScopeBoth'), desc:t('docsPerfDocDesc'), frameworks:[{n:'Playwright',c:'#E2574C'},{n:'k6',c:'#7D64FF'}], steps:[t('docsPerfStep1'),t('docsPerfStep2'),t('docsPerfStep3')], when:t('docsPerfWhen'), config:[t('docsPerfCfg1'),t('docsPerfCfg2'),t('docsPerfCfg3')], tips:[t('docsPerfTip1'),t('docsPerfTip2')] },
    security:    { color:'#ef4444', badge:t('docsBadgeCrit5m'), Icon: IconShieldLock, title:t('securityLabel'), scope:t('docsScopeInternal'), desc:t('docsSecDocDesc'), frameworks:[{n:'Pytest',c:'#3776AB'}], steps:[t('docsSecStep1'),t('docsSecStep2'),t('docsSecStep3')], when:t('docsSecWhen'), config:[t('docsSecCfg1'),t('docsSecCfg2'),t('docsSecCfg3')], tips:[t('docsSecTip1'),t('docsSecTip2')] },
    regression:  { color:'#f97316', badge:t('docsBadgeThor3m'), Icon: IconRefresh, title:t('regressionLabel'), scope:t('docsScopeInternal'), desc:t('docsRegDocDesc'), frameworks:[{n:'Playwright',c:'#E2574C'}], steps:[t('docsRegStep1'),t('docsRegStep2'),t('docsRegStep3')], when:t('docsRegWhen'), config:[t('docsRegCfg1'),t('docsRegCfg2'),t('docsRegCfg3')], tips:[t('docsRegTip1')] },
    api:         { color:'#10b981', badge:t('docsBadgeTech2m'), Icon: IconApi, title:t('apiLabel'), scope:t('docsScopeInternal'), desc:t('docsApiDocDesc'), frameworks:[{n:'Pytest',c:'#3776AB'},{n:'Postman',c:'#FF6C37'}], steps:[t('docsApiStep1'),t('docsApiStep2'),t('docsApiStep3')], when:t('docsApiWhen'), config:[t('docsApiCfg1'),t('docsApiCfg2'),t('docsApiCfg3')], tips:[t('docsApiTip1'),t('docsApiTip2')] },
    seo:         { color:'#06b6d4', badge:t('docsBadgePublic1m'), Icon: IconSeeding, title:t('seoLabel'), scope:t('docsScopePublic'), desc:t('docsSeoDocDesc'), frameworks:[{n:'Requests + BeautifulSoup',c:'#06b6d4'}], steps:[t('docsSeoStep1'),t('docsSeoStep2'),t('docsSeoStep3')], when:t('docsSeoWhen'), config:[t('docsSeoCfg1'),t('docsSeoCfg2')], tips:[t('docsSeoTip1'),t('docsSeoTip2')] },
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
          {goLabel || t('docsClickHere')}
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
 {t('docsClickHere')}
  </button>
)}       </div>
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
            <h1 style={{ fontSize:26, fontWeight:700, color:'var(--text)', marginBottom:10 }}>{t('docsGettingStarted')}</h1>
            <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.8, marginBottom:28, maxWidth:600 }}>
              {t('docsGsSubtitle')}
            </p>

<GenericSection title={t('docsGsStep1Title')} color="#6366f1" onGo={() => onNavigate('generate', 'create')} goLabel={t('docsClickHere')}>
  <StepList color="#6366f1" onNavigate={onNavigate} steps={[
    t('docsGsStep1_1'),
    t('docsGsStep1_2'),
    t('docsGsStep1_3'),
    t('docsGsStep1_4'),
  ]} />
</GenericSection>

<GenericSection title={t('docsGsStep2Title')} color="#8b5cf6">
  <StepList color="#8b5cf6" onNavigate={onNavigate} steps={[
    t('docsGsStep2_1'),
    t('docsGsStep2_2'),
    t('docsGsStep2_3'),
    t('docsGsStep2_4'),
    t('docsGsStep2_5'),
    t('docsGsStep2_6'),
  ]} />
</GenericSection>
<GenericSection title={t('docsGsStep3Title')} color="#10b981">
  <StepList color="#10b981" onNavigate={onNavigate} steps={[
    t('docsGsStep3_1'),
    t('docsGsStep3_2'),
    t('docsGsStep3_3'),
    t('docsGsStep3_4'),
    t('docsGsStep3_5'),
  ]} />
</GenericSection>
          </>
        )}
      {active === 'architecture' && (
          <>
            <h1 style={{ fontSize:26, fontWeight:700, color:'var(--text)', marginBottom:10 }}>{t('docsArchitecture')}</h1>
            <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.8, marginBottom:28, maxWidth:640 }}>
              {t('docsArchDesc')}
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:32 }}>
              {[
                { label:'React (Vite)',  desc:t('docsArchReactDesc'),  color:'#61dafb' },
                { label:'Laravel API',   desc:t('docsArchLaravelDesc'), color:'#ef4444' },
                { label:'FastAPI + Groq', desc:t('docsArchFastApiDesc'), color:'#10b981' },
                { label:'PostgreSQL',    desc:t('docsArchPostgresDesc'), color:'#336791' },
              ].map(s => (
                <div key={s.label} style={{ background:'var(--card)', border:'1px solid var(--border)', borderTop:`3px solid ${s.color}`, borderRadius:12, padding:'16px' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:6 }}>{s.label}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', lineHeight:1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>
            <GenericSection title={t('docsArchFlowTitle')} subtitle={t('docsArchFlowSubtitle')}>
              <StepList color="#6366f1" onNavigate={onNavigate} steps={[
                t('docsArchFlow1'),
                t('docsArchFlow2'),
                t('docsArchFlow3'),
                t('docsArchFlow4'),
                t('docsArchFlow5'),
              ]} />
            </GenericSection>
            <GenericSection title={t('docsArchSupportTitle')}>
  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
    {[
      ['n8n / Gmail SMTP', t('docsArchN8nDesc')],
      ['pm2', t('docsArchPm2Desc')],
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
            <h1 style={{ fontSize:26, fontWeight:700, color:'var(--text)', marginBottom:10 }}>{t('docsFrameworks')}</h1>
            <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.8, marginBottom:28, maxWidth:640 }}>
              {t('docsFwDesc')}
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
            <h1 style={{ fontSize:26, fontWeight:700, color:'var(--text)', marginBottom:10 }}>{t('docsAiEngine')}</h1>
            <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.8, marginBottom:28, maxWidth:640 }}>
              {t('docsAiIntroPart1')} <strong style={{ color:'var(--text)' }}>Groq</strong>, {t('docsAiIntroPart2')} <strong style={{ color:'var(--text)' }}>LLaMA 3.3-70b-versatile</strong> {t('docsAiIntroPart3')}
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:32 }}>
              {[
                { title:t('docsAiF1Title'), color:'#6366f1', desc:t('docsAiF1Desc') },
                { title:t('docsAiF2Title'), color:'#10b981', desc:t('docsAiF2Desc') },
                { title:t('docsAiF3Title'), color:'#06b6d4', desc:t('docsAiF3Desc') },
                { title:t('docsAiF4Title'), color:'#f59e0b', desc:t('docsAiF4Desc') },
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
                <strong style={{ color:'#f59e0b' }}>{t('docsAiRateLimitLabel')}</strong> {t('docsAiRateLimitDesc')}
              </div>
            </div>
          </>
        )}

{active === 'reports' && (
  <>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
      <h1 style={{ fontSize:26, fontWeight:700, color:'var(--text)', margin:0 }}>{t('docsReportsExports')}</h1>
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
        {t('docsClickHere')}
      </button>
    </div>
    <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.8, marginBottom:28, maxWidth:640 }}>
      {t('docsReportsDesc')}
    </p>
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {[
        { fmt:'PDF',  color:'#ef4444', desc:t('docsReportsPdfDesc') },
        { fmt:'HTML', color:'#818cf8', desc:t('docsReportsHtmlDesc') },
        { fmt:'CSV',  color:'#10b981', desc:t('docsReportsCsvDesc') },
      ].map(r => (
        <div key={r.fmt} style={{ display:'flex', gap:16, alignItems:'center', background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px' }}>
          <span style={{ width:52, height:36, borderRadius:8, background:`${r.color}15`, border:`1px solid ${r.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:r.color, flexShrink:0 }}>{r.fmt}</span>
          <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.6 }}>{r.desc}</div>
        </div>
      ))}
    </div>
    <div style={{ marginTop:24 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)', marginBottom:12 }}>{t('docsScheduledReportsTitle')}</div>
      <p style={{ fontSize:12, color:'var(--sub)', lineHeight:1.7, maxWidth:600 }}>
        {t('docsScheduledReportsDesc')}
      </p>
    </div>
  </>
)}
          
{active === 'flaky-tests' && (
  <>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
      <h1 style={{ fontSize:26, fontWeight:700, color:'var(--text)', margin:0 }}>{t('flakyTests')}</h1>
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
        {t('docsClickHere')}
      </button>
    </div>
    <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.8, marginBottom:28, maxWidth:640 }}>
      {t('docsFlakyDesc')}
    </p>

    <div style={{ marginBottom:32 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)', marginBottom:12 }}>{t('docsFlakyStatusLevelsTitle')}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {[
          [t('docsFlakyStable'),   '#10b981', t('docsFlakyStableDesc')],
          [t('docsFlakyWarning'),  '#f59e0b', t('docsFlakyWarningDesc')],
          [t('docsFlakyFlaky'),    '#f97316', t('docsFlakyFlakyDesc')],
          [t('docsFlakyCritical'), '#ef4444', t('docsFlakyCriticalDesc')],
          [t('docsFlakyIgnored'),  '#64748b', t('docsFlakyIgnoredDesc')],
        ].map(([label, color, desc]) => (
          <div key={label} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 14px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:10 }}>
            <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, color, background:`${color}15`, border:`1px solid ${color}33`, minWidth:70, textAlign:'center' }}>{label}</span>
            <span style={{ fontSize:12, color:'var(--muted)' }}>{desc}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={{ marginBottom:32 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)', marginBottom:16 }}>{t('docsHowItWorks')}</div>
      <StepList color="#f97316" onNavigate={onNavigate} steps={[
        t('docsFlakyHow1'),
        t('docsFlakyHow2'),
        t('docsFlakyHow3'),
        t('docsFlakyHow4'),
        t('docsFlakyHow5'),
      ]} />
    </div>

    <div style={{ background:'rgba(249,115,22,.06)', border:'1px solid rgba(249,115,22,.2)', borderRadius:12, padding:'16px 20px', display:'flex', gap:12 }}>
      <IconBulb size={20} color="#f97316" style={{ flexShrink:0, marginTop:2 }} />
      <div style={{ fontSize:12, color:'var(--sub)', lineHeight:1.7 }}>
        <strong style={{ color:'#f97316' }}>{t('docsNoteLabel')}</strong> {t('docsFlakyNote')}
      </div>
    </div>
  </>
)}
        {active === 'faq' && (
          <>
            <h1 style={{ fontSize:26, fontWeight:700, color:'var(--text)', marginBottom:10 }}>{t('docsFaq')}</h1>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:20 }}>
              {[
                [t('docsFaqQ1'), t('docsFaqA1')],
                [t('docsFaqQ2'), t('docsFaqA2')],
                [t('docsFaqQ3'), t('docsFaqA3')],
                [t('docsFaqQ4'), t('docsFaqA4')],
                [t('docsFaqQ5'), t('docsFaqA5')],
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
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)', marginBottom:12 }}>{t('docsSupportedFrameworks')}</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {current.frameworks.map(fw => (
                    <span key={fw.n} style={{ fontSize:12, fontWeight:700, padding:'5px 14px', borderRadius:20, color:fw.c, background:`${fw.c}15`, border:`1px solid ${fw.c}30` }}>{fw.n}</span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:32 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)', marginBottom:16 }}>{t('docsHowItWorks')}</div>
                <StepList steps={current.steps} color={current.color} onNavigate={onNavigate} />
              </div>

              {current.config && (
                <div style={{ marginBottom:32 }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)', marginBottom:12 }}>{t('docsConfiguration')}</div>
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
                  <div style={{ fontSize:10, fontWeight:700, color:current.color, marginBottom:6, letterSpacing:1.5, textTransform:'uppercase' }}>{t('docsWhenToUse')}</div>
                  <div style={{ fontSize:13, color:'var(--sub)', lineHeight:1.7 }}>{current.when}</div>
                </div>
              </div>

              {current.tips && (
                <div style={{ marginTop:20 }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--muted)', marginBottom:12 }}>{t('docsTips')}</div>
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
  const [chatOpen, setChatOpen] = useState(false);
  const [chatVisible, setChatVisible] = useState(true);
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
  <div className="s-group">
    {!collapsed && <div className="s-label">{t('help')}</div>}
    <SItem id="docs" label={t('documentation')} active={page==='docs'} collapsed={collapsed} onClick={setPage} />
     <SItem
  id="chatbot"
  label={t('assistant')}
  active={chatOpen}
  collapsed={collapsed}
  onClick={() => { setChatVisible(true); setChatOpen(o => !o); }}
/>
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
  <CreateProjectPanel
    onProjectCreated={(project) => { setCurrentProject(project); setProjectStep('detail'); }}
    goTo={(p) => { if (p === 'project') setProjectStep('list'); }}
  />
)}
              {projectStep === 'generate' && (
                <>
                  
               <GeneratePanel goTo={(p) => { 
  if (p === 'project') {
    setProjectStep('detail'); // retourne sur la fiche du projet en cours
  } else {
    setProjectStep('list');
    setPage(p);
  }
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
      <NextestChatbot
  theme={theme}
  open={chatOpen}
  visible={chatVisible}
  onToggle={setChatOpen}
  onHide={() => { setChatOpen(false); setChatVisible(false); }}
/>
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
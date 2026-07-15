import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import {
  IconPlus, IconPlayerPlay, IconPlayerPauseFilled, IconPencil, IconTrash,
  IconClock, IconActivity, IconChecks, IconHourglass, IconX, IconRobot,
  IconMail, IconChevronDown, IconCalendarTime, IconBolt, IconWorld, IconLock,
  IconDots, IconAlertTriangle, IconCircleCheck,
} from '@tabler/icons-react';

import CalendarView from './CalendarView';

import { LogoSpinner } from '../dashboard/Dashboard';



const FRAMEWORKS_BY_TYPE = {
  smoke:       ['Selenium', 'Cypress', 'Playwright'],
  functional:  ['Playwright'],
  performance: ['Playwright', 'k6'],
  security:    ['Pytest'],
  regression:  ['Playwright'],
  api:         ['Pytest', 'Postman'],
  seo:         ['BeautifulSoup'],
};

const TEST_TYPE_CONFIG = {
  smoke:       { label: 'Smoke',       color: '#64748b', bg: 'rgba(100,116,139,.1)', border: 'rgba(100,116,139,.25)' },
  functional:  { label: 'Functional',  color: '#6366f1', bg: 'rgba(99,102,241,.1)',  border: 'rgba(99,102,241,.25)'  },
  performance: { label: 'Performance', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)',  border: 'rgba(139,92,246,.25)'  },
  api:         { label: 'API',         color: '#10b981', bg: 'rgba(16,185,129,.1)',  border: 'rgba(16,185,129,.25)'  },
  regression:  { label: 'Regression',  color: '#f97316', bg: 'rgba(249,115,22,.1)',  border: 'rgba(249,115,22,.25)'  },
  security:    { label: 'Security',    color: '#ef4444', bg: 'rgba(239,68,68,.1)',   border: 'rgba(239,68,68,.25)'   },
  seo:         { label: 'SEO',         color: '#06b6d4', bg: 'rgba(6,182,212,.1)',   border: 'rgba(6,182,212,.25)'   },
};

const SCHEDULE_PRESETS = [
  { key: 'hourly',  label: 'Hourly',  desc: 'Runs at the top of every hour',          cron: '0 * * * *'     },
  { key: 'daily',   label: 'Daily',   desc: 'Runs once a day at a fixed time',        cron: '0 9 * * *'     },
  { key: 'weekly',  label: 'Weekly',  desc: 'Runs once a week on a chosen day',       cron: '0 9 * * 1'     },
  { key: 'monthly', label: 'Monthly', desc: 'Runs once a month on a chosen date',     cron: '0 9 1 * *'     },
  { key: 'custom',  label: 'Custom Cron Expression', desc: 'Define your own schedule', cron: '' },
];

const SCHEDULE_LABEL = { hourly: 'Hourly', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', custom: 'Custom' };
const SCHEDULE_COLOR = { hourly: '#0ea5e9', daily: '#6366f1', weekly: '#8b5cf6', monthly: '#f97316', custom: '#c9a227' };



function Toggle({ on, onToggle, size = 'md' }) {
  const w = size === 'sm' ? 36 : 44;
  const h = size === 'sm' ? 20 : 24;
  const knob = size === 'sm' ? 14 : 16;
  return (
    <div
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      style={{
        width: w, height: h, borderRadius: h,
        background: on ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'var(--bg2)',
        position: 'relative', cursor: 'pointer', flexShrink: 0,
        border: `1px solid ${on ? 'rgba(99,102,241,.5)' : 'var(--border)'}`,
        transition: 'background .2s, border-color .2s',
      }}
    >
      <span style={{
        position: 'absolute', top: (h - knob) / 2 - 1,
        left: on ? w - knob - 3 : 3,
        width: knob, height: knob, borderRadius: '50%',
        background: '#fff', transition: 'left .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,.3)',
      }} />
    </div>
  );
}

function TypeBadge({ type }) {
  const c = TEST_TYPE_CONFIG[type] || TEST_TYPE_CONFIG.smoke;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
      color: c.color, background: c.bg, border: `1px solid ${c.border}`,
      textTransform: 'uppercase', letterSpacing: .5, whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  );
}

function ScheduleBadge({ type }) {
  const color = SCHEDULE_COLOR[type] || '#64748b';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      color, background: `${color}15`, border: `1px solid ${color}33`,
    }}>
      <IconClock size={11} stroke={2.2} />
      {SCHEDULE_LABEL[type] || type}
    </span>
  );
}

function StatusBadge({ status }) {
  const isActive = status === 'active';
  const color = isActive ? '#10b981' : '#f59e0b';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
      color, background: `${color}15`, border: `1px solid ${color}33`,
      textTransform: 'uppercase', letterSpacing: .6,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: isActive ? `0 0 6px ${color}` : 'none' }} />
      {isActive ? 'Active' : 'Paused'}
    </span>
  );
}

function LastRunBadge({ status }) {
  if (!status || status !== 'pass') return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#10b981' }}>
      <IconCircleCheck size={13} stroke={2.2} />
      Passed
    </span>
  );
}

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = (d.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rel = abs < 3600
    ? `${Math.round(abs / 60)}m`
    : abs < 86400
    ? `${Math.round(abs / 3600)}h`
    : `${Math.round(abs / 86400)}d`;
  const when = diff >= 0 ? `in ${rel}` : `${rel} ago`;
  return `${when} · ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};



function KpiCard({ icon, val, lbl, color, bg, border }) {
  return (
    <div style={{
      background: 'var(--card)', border: `1px solid ${border}`, borderRadius: 16,
      padding: '20px 22px', position: 'relative', overflow: 'hidden',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,transparent,${color},transparent)`, opacity: .7 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, background: bg, border: `1px solid ${border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--C)', lineHeight: 1, marginBottom: 6 }}>{val}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{lbl}</div>
    </div>
  );
}



function RowActions({ task, onEdit, onRunNow, onDelete, onToggleStatus, running }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuH = 168;
      const spaceBelow = window.innerHeight - rect.bottom;
      const goUp = spaceBelow < menuH;
      setPos({
        top: goUp ? rect.top - menuH - 6 : rect.bottom + 6,
        left: rect.right - 190,
      });
    }
    setOpen(o => !o);
  };

const menu = open ? createPortal(
    <div ref={menuRef} style={{
      position: 'fixed', top: pos.top, left: pos.left, zIndex: 99999,
      width: 190, background: '#131c30', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12,
      padding: 6, boxShadow: '0 16px 40px rgba(0,0,0,.6)', animation: 'dFadeUp .15s ease both',
    }}>
      <button onClick={() => { onEdit(task); setOpen(false); }} style={menuBtnStyle()}
        onMouseEnter={e => menuHover(e, '#818cf8', 'rgba(99,102,241,.12)')} onMouseLeave={menuLeave}>
        <IconPencil size={14} stroke={2} /> Edit
      </button>
      <button onClick={() => { onRunNow(task); setOpen(false); }} disabled={running} style={menuBtnStyle(running)}
        onMouseEnter={e => menuHover(e, '#10b981', 'rgba(16,185,129,.12)')} onMouseLeave={menuLeave}>
        {running ? <span className="spinner" /> : <IconPlayerPlay size={14} stroke={2} />} Run Now
      </button>
      <button onClick={() => { onToggleStatus(task); setOpen(false); }} style={menuBtnStyle()}
        onMouseEnter={e => menuHover(e, '#f59e0b', 'rgba(245,158,11,.12)')} onMouseLeave={menuLeave}>
        {task.status === 'active' ? <IconPlayerPauseFilled size={14} stroke={2} /> : <IconPlayerPlay size={14} stroke={2} />}
        {task.status === 'active' ? 'Pause' : 'Activate'}
      </button>
      <div style={{ height: 1, background: 'rgba(255,255,255,.08)', margin: '5px 6px' }} />
      <button onClick={() => { onDelete(task); setOpen(false); }} style={menuBtnStyle()}
        onMouseEnter={e => menuHover(e, '#f87171', 'rgba(239,68,68,.12)')} onMouseLeave={menuLeave}>
        <IconTrash size={14} stroke={2} /> Delete
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
     <button
  ref={btnRef}
  onClick={handleOpen}
  style={{
    width: 30, height: 30, borderRadius: 8,
    background: open ? 'rgba(99,102,241,.15)' : 'rgba(255,255,255,.05)',
    border: `1px solid ${open ? 'rgba(99,102,241,.5)' : 'rgba(255,255,255,.12)'}`,
    color: open ? '#818cf8' : '#cbd5e1', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .15s',
  }}
  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--indigo-border)'; e.currentTarget.style.color = '#818cf8'; e.currentTarget.style.background = 'rgba(99,102,241,.12)'; }}
  onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'rgba(255,255,255,.05)'; } }}
>
  <IconDots size={16} stroke={2.3} />
</button>
      {menu}
    </div>
  );
}

const menuBtnStyle = (disabled) => ({
  display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 10px',
  borderRadius: 8, background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
  color: '#e2e8f0', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
  transition: 'all .15s', textAlign: 'left', opacity: disabled ? .5 : 1,
});

const menuHover = (e, color, bg) => { e.currentTarget.style.background = bg; e.currentTarget.style.color = color; };
const menuLeave = (e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#e2e8f0'; };


// Delete confirm modal
function DeleteTaskModal({ task, onConfirm, onCancel, loading }) {
  if (!task) return null;
  return createPortal(
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 420, background: '#0d1526', border: '1px solid rgba(239,68,68,.3)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.7)', fontFamily: "'DM Sans', sans-serif", animation: 'dFadeUp .2s ease both' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #ef4444, transparent)' }} />
        <div style={{ padding: '22px 26px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconTrash size={17} stroke={2} color="#ef4444" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#e2e8f0' }}>Delete Scheduled Task</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>This action cannot be undone</div>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><IconX size={16} /></button>
        </div>
        <div style={{ padding: '22px 26px' }}>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 18 }}>
            Delete <strong style={{ color: '#e2e8f0' }}>{task.name}</strong>? Its schedule will stop running immediately.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={onConfirm} disabled={loading} style={{ flex: 2, padding: '11px', borderRadius: 10, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? .7 : 1 }}>
              {loading ? <><span className="spinner" /> Deleting…</> : <><IconTrash size={13} stroke={2.5} /> Delete Task</>}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// New / Edit Task modal
function NewTaskModal({ open, onClose, onSave, projects, editingTask }) {
  const isEdit = !!editingTask;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [testType, setTestType] = useState('smoke');
  const [scheduleType, setScheduleType] = useState('daily');
  const [cron, setCron] = useState('0 9 * * *');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [status, setStatus] = useState('active');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [url, setUrl] = useState('');
  const [testedUrls, setTestedUrls] = useState([]);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlMode, setUrlMode] = useState('existing');

  const [scheduleHour, setScheduleHour] = useState(9);
  const [scheduleMinute, setScheduleMinute] = useState(0);
  const [weekDay, setWeekDay] = useState(1);
  const [monthDay, setMonthDay] = useState(1);
  const [framework, setFramework] = useState('');

  const buildCron = (type, h, m, wDay, mDay) => {
    switch (type) {
      case 'hourly':  return `0 * * * *`;
      case 'daily':   return `${m} ${h} * * *`;
      case 'weekly':  return `${m} ${h} * * ${wDay}`;
      case 'monthly': return `${m} ${h} ${mDay} * *`;
      default:        return cron;
    }
  };
  

 useEffect(() => {
    if (!open) return;
    if (editingTask) {
      setName(editingTask.name || '');
      setDescription(editingTask.description || '');
      setProjectId(String(editingTask.project_id || ''));
      setTestType(editingTask.test_type || 'smoke');
      setScheduleType(editingTask.schedule_type || 'daily');
      setCron(editingTask.cron || '0 9 * * *');
      setNotifyEmail(!!editingTask.notify_email);
      setStatus(editingTask.status || 'active');
      setUrl(editingTask.url || '');
      setFramework(editingTask.framework || '');

      const parts = (editingTask.cron || '0 9 * * *').split(' ');
      const [cMin, cHour, cMonthDay, , cWeekDay] = parts;
      if (cMin !== '*') setScheduleMinute(Number(cMin));
      if (cHour !== '*') setScheduleHour(Number(cHour));
      if (cMonthDay !== '*') setMonthDay(Number(cMonthDay));
      if (cWeekDay !== '*') setWeekDay(Number(cWeekDay));
    } else {
      setName(''); setDescription(''); setProjectId(projects[0] ? String(projects[0].id) : '');
      setTestType('smoke'); setScheduleType('daily'); setCron('0 9 * * *');
      setNotifyEmail(true); setStatus('active');
      setUrl('');
      setFramework('');
      setScheduleHour(9); setScheduleMinute(0); setWeekDay(1); setMonthDay(1);
    }
    setNameError('');
  }, [open, editingTask]); // eslint-disable-line

  useEffect(() => {
    if (!open || !projectId) return;
    setUrlLoading(true);
    api.get(`/projects/${projectId}/tested-urls`, { params: { test_type: testType } })
      .then(res => {
        const urls = res.data.urls || [];
        setTestedUrls(urls);
        if (!isEdit) {
          if (urls.length) {
            setUrlMode('existing');
            if (!url) setUrl(urls[0]);
          } else {
            setUrlMode('new');
          }
        }
      })
      .catch(() => setTestedUrls([]))
      .finally(() => setUrlLoading(false));
  }, [projectId, testType, open]); // eslint-disable-line
  useEffect(() => {
    if (scheduleType !== 'custom') {
      setCron(buildCron(scheduleType, scheduleHour, scheduleMinute, weekDay, monthDay));
    }
  }, [scheduleHour, scheduleMinute, weekDay, monthDay, scheduleType]); // eslint-disable-line

  useEffect(() => {
    const available = FRAMEWORKS_BY_TYPE[testType] || [];
    if (!available.includes(framework)) {
      setFramework(available[0] || '');
    }
  }, [testType]); // eslint-disable-line

  


  if (!open) return null;



  const selectedProject = projects.find(p => String(p.id) === String(projectId));
  const TEST_TYPES = ['smoke', 'functional', 'performance', 'api', 'regression', 'security', 'seo'];

 

const submit = async () => {
    if (!name.trim()) { setNameError('Task name is required'); return; }
    if (!projectId) { setNameError('Select a project'); return; }
    if (!url.trim()) { setNameError('Target URL is required'); return; }  
    setSaving(true);

    const payload = {
      name: name.trim(),
      description: description.trim(),
      project_id: Number(projectId),
      url: url.trim(),
      test_type: testType,
      framework: framework,
      schedule_type: scheduleType,
      cron: cron,
      notify_email: notifyEmail,
      status,
    };

    try {
      await onSave(payload, editingTask?.id || null);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 13.5,
    background: 'rgba(255,255,255,.03)', border: '1.5px solid rgba(255,255,255,.08)',
    color: '#e2e8f0', fontFamily: 'inherit', outline: 'none', transition: 'border-color .2s',
  };
  const labelStyle = { fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 8 };
  const sectionHead = (num, title, sub) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.25)', borderRadius: 7, padding: '3px 8px', flexShrink: 0, marginTop: 1 }}>{num}</span>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#e2e8f0' }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 640, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto',
        background: '#0a0f1e', border: '1px solid rgba(99,102,241,.25)', borderRadius: 20,
        boxShadow: '0 30px 80px rgba(0,0,0,.7)', fontFamily: "'DM Sans', sans-serif",
        animation: 'dFadeUp .22s cubic-bezier(.22,1,.36,1) both',
      }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,transparent,#6366f1,transparent)', position: 'sticky', top: 0 }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '22px 28px 18px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconCalendarTime size={20} stroke={1.8} color="#818cf8" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{isEdit ? 'Edit Scheduled Task' : 'New Scheduled Task'}</div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Automate recurring test runs for a project</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconX size={15} />
          </button>
        </div>

        <div style={{ padding: '26px 28px' }}>

          {/* General Information */}
          {sectionHead('01', 'General Information', 'Name and describe this scheduled task')}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Task Name *</label>
            <input value={name} onChange={e => { setName(e.target.value); setNameError(''); }} placeholder="e.g. Nightly Smoke Sweep" maxLength={70}
              style={{ ...inputStyle, borderColor: nameError ? '#ef4444' : 'rgba(255,255,255,.08)' }} />
            {nameError && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}><IconAlertTriangle size={12} />{nameError}</div>}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Description <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={200} placeholder="What does this task verify?"
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Project *</label>
            <div style={{ position: 'relative' }}>
              <select value={projectId} onChange={e => setProjectId(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', paddingRight: 36, colorScheme: 'dark' }}>
                {projects.length === 0 && <option value="">No projects available</option>}
                {projects.map(p => (
                  <option key={p.id} value={p.id} style={{ background: '#0d1526', color: '#e2e8f0' }}>
                    {p.name}
                  </option>
                ))}
              </select>
              <IconChevronDown size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
            </div>
            {selectedProject && (
              <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, color: selectedProject.type === 'public' ? '#4f86e8' : '#8b5cf6', background: selectedProject.type === 'public' ? 'rgba(79,134,232,.1)' : 'rgba(139,92,246,.1)', border: `1px solid ${selectedProject.type === 'public' ? 'rgba(79,134,232,.25)' : 'rgba(139,92,246,.25)'}` }}>
                {selectedProject.type === 'public' ? <IconWorld size={12} /> : <IconLock size={12} />}
                {selectedProject.type === 'public' ? 'Public' : 'Internal'} project
              </div>
            )}
          </div>

          
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Target URL *</label>

            {testedUrls.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {[
                  { key: 'existing', label: 'Choose existing URL' },
                  { key: 'new', label: 'Type a new URL' },
                ].map(m => {
                  const active = urlMode === m.key;
                  return (
                    <button key={m.key} type="button"
                      onClick={() => {
                        setUrlMode(m.key);
                        if (m.key === 'existing' && testedUrls.length) setUrl(testedUrls[0]);
                        if (m.key === 'new') setUrl('');
                      }}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                        background: active ? 'rgba(99,102,241,.12)' : 'rgba(255,255,255,.02)',
                        border: `1.5px solid ${active ? '#6366f1' : 'rgba(255,255,255,.08)'}`,
                        color: active ? '#818cf8' : '#64748b',
                      }}>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}

            {urlLoading && (
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Loading tested URLs…</div>
            )}

            {urlMode === 'existing' && testedUrls.length > 0 ? (
              <div style={{ position: 'relative' }}>
                <select value={url} onChange={e => setUrl(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', paddingRight: 36, colorScheme: 'dark' }}>
                  {testedUrls.map((u, i) => (
                    <option key={i} value={u} style={{ background: '#0d1526', color: '#e2e8f0' }}>{u}</option>
                  ))}
                </select>
                <IconChevronDown size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
              </div>
            ) : (
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com"
                style={inputStyle}
              />
            )}

            {!urlLoading && testedUrls.length === 0 && projectId && (
              <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
                No tests run yet for this project + type — enter the URL manually.
              </div>
            )}
          </div>
          

          {/* Test Configuration */}
          {sectionHead('02', 'Test Configuration', 'Choose which test suite to run on schedule')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {TEST_TYPES.map(tt => {
              const cfg = TEST_TYPE_CONFIG[tt];
              const active = testType === tt;
              return (
                <button key={tt} type="button" onClick={() => setTestType(tt)}
                  style={{
                    padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all .15s',
                    background: active ? cfg.bg : 'rgba(255,255,255,.02)',
                    border: `1.5px solid ${active ? cfg.color : 'rgba(255,255,255,.08)'}`,
                    color: active ? cfg.color : '#64748b',
                  }}>
                  {cfg.label}
                </button>
              );
            })}
          </div>
<div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Framework *</label>
            <div style={{ position: 'relative' }}>
              <select value={framework} onChange={e => setFramework(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', paddingRight: 36, colorScheme: 'dark' }}>
                {(FRAMEWORKS_BY_TYPE[testType] || []).map(fw => (
                  <option key={fw} value={fw} style={{ background: '#0d1526', color: '#e2e8f0' }}>{fw}</option>
                ))}
              </select>
              <IconChevronDown size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
            </div>
          </div>

         
          {/* Schedule Configuration */}
          {sectionHead('03', 'Schedule Configuration', 'How often should this task run?')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }}>
            {SCHEDULE_PRESETS.map(s => {
              const active = scheduleType === s.key;
              const color = SCHEDULE_COLOR[s.key];
              return (
                <div key={s.key} onClick={() => {
                    setScheduleType(s.key);
                    if (s.key !== 'custom') setCron(buildCron(s.key, scheduleHour, scheduleMinute, weekDay, monthDay));
                  }}
                  style={{
                    padding: '13px 14px', borderRadius: 12, cursor: 'pointer', transition: 'all .18s',
                    background: active ? `${color}12` : 'rgba(255,255,255,.02)',
                    border: `1.5px solid ${active ? color : 'rgba(255,255,255,.08)'}`,
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: active ? color : '#cbd5e1' }}>{s.label}</span>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${active ? color : 'rgba(255,255,255,.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{s.desc}</div>
                </div>
              );
            })}
          </div>

          {scheduleType !== 'custom' && scheduleType !== 'hourly' && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Time</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <select value={scheduleHour} onChange={e => setScheduleHour(Number(e.target.value))}
                    style={{ ...inputStyle, colorScheme: 'dark', cursor: 'pointer' }}>
                    {Array.from({ length: 24 }, (_, i) => i).map(h => (
                      <option key={h} value={h} style={{ background: '#0d1526', color: '#e2e8f0' }}>
                        {String(h).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  <span style={{ color: '#64748b', fontWeight: 700 }}>:</span>
                  <select value={scheduleMinute} onChange={e => setScheduleMinute(Number(e.target.value))}
  style={{ ...inputStyle, colorScheme: 'dark', cursor: 'pointer' }}>
  {Array.from({ length: 60 }, (_, i) => i).map(m => (
    <option key={m} value={m} style={{ background: '#0d1526', color: '#e2e8f0' }}>
      {String(m).padStart(2, '0')}
    </option>
  ))}
</select>
                </div>
              </div>

              {scheduleType === 'weekly' && (
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Day of week</label>
                  <select value={weekDay} onChange={e => setWeekDay(Number(e.target.value))}
  style={{ ...inputStyle, colorScheme: 'dark', cursor: 'pointer' }}>
  {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d, i) => (
    <option key={i} value={i} style={{ background: '#0d1526', color: '#e2e8f0' }}>{d}</option>
  ))}
</select>
                </div>
              )}

              {scheduleType === 'monthly' && (
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Day of month</label>
                  <select value={monthDay} onChange={e => setMonthDay(Number(e.target.value))}
  style={{ ...inputStyle, colorScheme: 'dark', cursor: 'pointer' }}>
  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
    <option key={d} value={d} style={{ background: '#0d1526', color: '#e2e8f0' }}>{d}</option>
  ))}
</select>
                </div>
              )}
            </div>
          )}

          {scheduleType === 'custom' && (
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Cron Expression</label>
              <input value={cron} onChange={e => setCron(e.target.value)} placeholder="e.g. */30 * * * *"
                style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: .5 }} />
              <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>Standard 5-field cron syntax — minute hour day month weekday.</div>
            </div>
          )}
          {scheduleType !== 'custom' && (
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 8, background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.15)' }}>
              <IconClock size={13} color="#818cf8" />
              <span style={{ fontSize: 11.5, color: '#a5b4fc' }}>Resolved cron: <code style={{ fontFamily: 'monospace' }}>{cron}</code></span>
            </div>
          )}

          {/* Notifications */}
          {sectionHead('04', 'Notifications', 'Get notified when a scheduled run completes')}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderRadius: 12, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconMail size={15} color="#818cf8" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Email notification via n8n</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Triggers an n8n workflow to email the run summary</div>
              </div>
            </div>
            <Toggle on={notifyEmail} onToggle={() => setNotifyEmail(p => !p)} />
          </div>

          {/* Status */}
          {sectionHead('05', 'Status', 'Whether this task starts running immediately')}
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            {[{ key: 'active', label: 'Active', icon: <IconPlayerPlay size={14} />, color: '#10b981' }, { key: 'paused', label: 'Paused', icon: <IconPlayerPauseFilled size={14} />, color: '#f59e0b' }].map(s => {
              const active = status === s.key;
              return (
                <button key={s.key} type="button" onClick={() => setStatus(s.key)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '11px', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 13, fontWeight: 700, transition: 'all .18s',
                    background: active ? `${s.color}15` : 'rgba(255,255,255,.02)',
                    border: `1.5px solid ${active ? s.color : 'rgba(255,255,255,.08)'}`,
                    color: active ? s.color : '#64748b',
                  }}>
                  {s.icon} {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, padding: '18px 28px', borderTop: '1px solid rgba(255,255,255,.06)', position: 'sticky', bottom: 0, background: '#0a0f1e' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 11, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#94a3b8', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={submit} disabled={saving} style={{
            flex: 2, padding: '12px', borderRadius: 11, border: 'none', color: '#fff', fontSize: 13, fontWeight: 800,
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
            boxShadow: '0 6px 20px rgba(99,102,241,.35)', opacity: saving ? .75 : 1,
          }}>
            {saving ? <><span className="spinner" /> {isEdit ? 'Saving…' : 'Creating…'}</> : <><IconCalendarTime size={14} stroke={2.4} /> {isEdit ? 'Save Changes' : 'Create Task'}</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}



export default function ScheduledTasksPanel({ projects = [] }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [runningId, setRunningId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState('table');

  useEffect(() => {
    api.get('/scheduled-tasks')
      .then(res => setTasks(res.data))
      .catch(err => { console.error('[ScheduledTasks] load', err); setError('Could not load scheduled tasks.'); })
      .finally(() => setLoading(false));
  }, []);

  const projectName = (id) => projects.find(p => String(p.id) === String(id))?.name || '—';

  const stats = {
    total: tasks.length,
    active: tasks.filter(t => t.status === 'active').length,
    paused: tasks.filter(t => t.status === 'paused').length,
    today: tasks.filter(t => t.last_run && (Date.now() - new Date(t.last_run).getTime()) < 86400e3).length,
  };

  const filtered = tasks.filter(t => {
    const matchFilter = filter === 'all' || t.status === filter;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || projectName(t.project_id).toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleSave = async (payload, editingId) => {
    setError('');
    try {
      if (editingId) {
        const res = await api.put(`/scheduled-tasks/${editingId}`, payload);
        setTasks(prev => prev.map(t => t.id === editingId ? res.data : t));
      } else {
        const res = await api.post('/scheduled-tasks', payload);
        setTasks(prev => [res.data, ...prev]);
      }
      setModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      console.error('[ScheduledTasks] save', err);
      setError(err.response?.data?.message || 'Could not save the task.');
    }
  };

  const handleRunNow = async (task) => {
    setRunningId(task.id);
    setError('');
    try {
      const res = await api.post(`/scheduled-tasks/${task.id}/run`);
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
    } catch (err) {
      console.error('[ScheduledTasks] run', err);
      setError('Could not run this task.');
    }
    setRunningId(null);
  };

  const handleToggleStatus = async (task) => {
    setError('');
    try {
      const res = await api.patch(`/scheduled-tasks/${task.id}/status`);
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
    } catch (err) {
      console.error('[ScheduledTasks] toggle', err);
      setError('Could not update task status.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      await api.delete(`/scheduled-tasks/${deleteTarget.id}`);
      setTasks(prev => prev.filter(t => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('[ScheduledTasks] delete', err);
      setError('Could not delete this task.');
    }
    setDeleting(false);
  };

  return (
    <div className="panel">

      {/* HEADER */}
      <div className="p-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="p-title">Scheduled <span className="g">Tasks</span></h1>
          <p className="p-sub">Automate your test generation workflows.</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditingTask(null); setModalOpen(true); }}>
          <IconPlus size={14} stroke={2.5} />
          New Task
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 18, padding: '10px 16px', borderRadius: 10, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#ef4444', fontSize: 12.5, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard icon={<IconCalendarTime size={19} stroke={1.7} />} val={stats.total} lbl="Total Tasks" color="#818cf8" bg="rgba(99,102,241,.12)" border="rgba(99,102,241,.25)" />
        <KpiCard icon={<IconActivity size={19} stroke={1.7} />} val={stats.active} lbl="Active Tasks" color="#10b981" bg="rgba(16,185,129,.12)" border="rgba(16,185,129,.25)" />
        <KpiCard icon={<IconHourglass size={19} stroke={1.7} />} val={stats.paused} lbl="Paused Tasks" color="#f59e0b" bg="rgba(245,158,11,.12)" border="rgba(245,158,11,.25)" />
        <KpiCard icon={<IconChecks size={19} stroke={1.7} />} val={stats.today} lbl="Executions Today" color="#c9a227" bg="rgba(201,162,39,.12)" border="rgba(201,162,39,.25)" />
      </div>

      {/* TOOLBAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 240px', minWidth: 220, background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '9px 14px' }}>
          <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks by name or project…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ key: 'all', label: 'All' }, { key: 'active', label: 'Active' }, { key: 'paused', label: 'Paused' }].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '8px 14px', borderRadius: 9, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              border: filter === f.key ? '1.5px solid rgba(99,102,241,.4)' : '1.5px solid var(--border)',
              background: filter === f.key ? 'rgba(99,102,241,.12)' : 'var(--card)',
              color: filter === f.key ? '#818cf8' : 'var(--muted)', transition: 'all .15s',
            }}>{f.label}</button>
          ))}
        </div>
         
  <div style={{ display: 'flex', gap: 6 }}>
    {['table', 'calendar'].map(v => (
      <button key={v} onClick={() => setView(v)} style={{
        padding: '8px 14px', borderRadius: 9, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        border: view === v ? '1.5px solid rgba(99,102,241,.4)' : '1.5px solid var(--border)',
        background: view === v ? 'rgba(99,102,241,.12)' : 'var(--card)',
        color: view === v ? '#818cf8' : 'var(--muted)', transition: 'all .15s', textTransform: 'capitalize',
      }}>{v}</button>
    ))}
  </div>
</div>
    

    {/* TABLE OR CALENDAR */}
      {view === 'table' ? (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.6fr 1.1fr 0.9fr 0.9fr 1.2fr 1.2fr 0.8fr 50px',
            gap: 10, padding: '12px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          }}>
            {['Task Name', 'Project', 'Test Type', 'Schedule', 'Next Run', 'Last Run', 'Status', 'Actions'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', gap: 20 }}>
              <LogoSpinner size={80} />
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
                Loading Scheduled Tasks...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--indigo-bg)', border: '1px solid var(--indigo-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <IconCalendarTime size={24} stroke={1.6} color="#818cf8" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                {search || filter !== 'all' ? 'No tasks match your filters' : 'No scheduled tasks yet'}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                {search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Create one to automate recurring test runs.'}
              </div>
            </div>
          ) : filtered.map((task, i) => (
            <div key={task.id} style={{
              display: 'grid', gridTemplateColumns: '1.6fr 1.1fr 0.9fr 0.9fr 1.2fr 1.2fr 0.8fr 50px',
              gap: 10, padding: '14px 20px', alignItems: 'center',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border3, var(--border))' : 'none',
              transition: 'background .15s', opacity: task.status === 'paused' ? .72 : 1,
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</div>
                {task.description && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.description}</div>}
                {task.notify_email && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, color: '#818cf8' }}>
                    <IconMail size={10} /> Email via n8n
                  </div>
                )}
              </div>

              <div style={{ fontSize: 12.5, color: 'var(--sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{projectName(task.project_id)}</div>

              <div><TypeBadge type={task.test_type} /></div>

              <div><ScheduleBadge type={task.schedule_type} /></div>

              <div style={{ fontSize: 11.5, color: 'var(--sub)' }}>{task.status === 'active' ? fmtDate(task.next_run) : <span style={{ color: 'var(--muted)' }}>Paused</span>}</div>

              <div>
                <div style={{ fontSize: 11.5, color: 'var(--sub)', marginBottom: 2 }}>{fmtDate(task.last_run)}</div>
                <LastRunBadge status={task.last_status} />
              </div>

              <div><StatusBadge status={task.status} /></div>

              <RowActions
                task={task}
                running={runningId === task.id}
                onEdit={(t) => { setEditingTask(t); setModalOpen(true); }}
                onRunNow={handleRunNow}
                onDelete={(t) => setDeleteTarget(t)}
                onToggleStatus={handleToggleStatus}
              />
            </div>
          ))}
        </div>
      ) : (
        <CalendarView
          tasks={tasks}
          TEST_TYPE_CONFIG={TEST_TYPE_CONFIG}
          onTaskClick={(t) => { setEditingTask(t); setModalOpen(true); }}
        />
      )}

      {/* MODALS */}
      <NewTaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSave={handleSave}
        projects={projects}
        editingTask={editingTask}
      />
      <DeleteTaskModal
        task={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
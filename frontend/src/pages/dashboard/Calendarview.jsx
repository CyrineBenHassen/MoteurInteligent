import { useState } from 'react';
import { IconChevronLeft, IconChevronRight, IconCalendarTime } from '@tabler/icons-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildMonthGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  // leading blanks from previous month
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  // trailing blanks to complete the last week row
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSameDay(a, b) {
  return a && b && a.toDateString() === b.toDateString();
}

export default function CalendarView({ tasks, TEST_TYPE_CONFIG, onTaskClick }) {
  const [monthDate, setMonthDate] = useState(new Date());
  const [hovered, setHovered] = useState(null); // task id being hovered, for tooltip

  const today = new Date();
  const cells = buildMonthGrid(monthDate);

  const tasksForDay = (day) => {
    if (!day) return [];
    return tasks.filter(t => t.next_run && isSameDay(new Date(t.next_run), day));
  };

  const STATUS_STYLE = {
    active: { color: '#10b981', bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.3)', label: 'Active' },
    paused: { color: '#f59e0b', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.3)', label: 'Paused' },
  };

  // Which statuses actually appear this month, for the legend
  const statusesInMonth = new Set();
  cells.forEach(day => tasksForDay(day).forEach(t => statusesInMonth.add(t.status)));
  const legendStatuses = ['active', 'paused'].filter(s => statusesInMonth.has(s));

  const hasAnyRunThisMonth = cells.some(day => tasksForDay(day).length > 0);

  const goPrev = () => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNext = () => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday = () => setMonthDate(new Date());

  const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>

      {/* Header: month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCalendarTime size={16} stroke={1.8} color="#818cf8" />
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{monthLabel}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={goToday} style={navBtnStyle(false)}>Today</button>
          <button onClick={goPrev} style={navBtnStyle(true)}><IconChevronLeft size={15} /></button>
          <button onClick={goNext} style={navBtnStyle(true)}><IconChevronRight size={15} /></button>
        </div>
      </div>

      {/* Legend + empty state */}
      {hasAnyRunThisMonth ? (
        legendStatuses.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
            {legendStatuses.map(s => {
              const st = STATUS_STYLE[s];
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sub)' }}>{st.label}</span>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(99,102,241,.05)' }}>
          <IconCalendarTime size={14} color="#818cf8" />
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>No scheduled runs this month — activate a task to see it appear here.</span>
        </div>
      )}

      {/* Weekday labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ padding: '10px 0', textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--muted)' }}>
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((day, i) => {
          const dayTasks = tasksForDay(day);
          const isToday = isSameDay(day, today);
          return (
            <div key={i} style={{
              minHeight: 96, padding: '8px 8px 6px', borderRight: (i % 7 !== 6) ? '1px solid var(--border)' : 'none',
              borderBottom: '1px solid var(--border)', background: day ? 'transparent' : 'var(--bg)',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              {day && (
                <>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11.5, fontWeight: isToday ? 800 : 600,
                    color: isToday ? '#fff' : 'var(--sub)',
                    background: isToday ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'transparent',
                  }}>
                    {day.getDate()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {dayTasks.slice(0, 3).map(t => {
                      const st = STATUS_STYLE[t.status] || STATUS_STYLE.active;
                      return (
                        <div
                          key={t.id}
                          onClick={() => onTaskClick && onTaskClick(t)}
                          onMouseEnter={() => setHovered(t.id)}
                          onMouseLeave={() => setHovered(null)}
                          title={t.name}
                          style={{
                            fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6,
                            color: st.color, background: st.bg, border: `1px solid ${st.border}`,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            cursor: 'pointer', transition: 'transform .12s',
                            transform: hovered === t.id ? 'scale(1.03)' : 'scale(1)',
                          }}>
                          {t.name}
                        </div>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <div style={{ fontSize: 9.5, color: 'var(--muted)', fontWeight: 700, paddingLeft: 2 }}>
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const navBtnStyle = (icon) => ({
  width: icon ? 30 : 'auto', height: 30, padding: icon ? 0 : '0 12px',
  borderRadius: 8, background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)',
  color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit', transition: 'all .15s',
});
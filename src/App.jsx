import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import './App.css'

const WORKPLACE_OPTIONS = [
  { label: 'On Campus', value: 'on-campus', color: '#bbdefb', border: '#90caf9', text: '#222' }, // Softer blue
  { label: 'Remote', value: 'remote', color: '#c8e6c9', border: '#81c784', text: '#222' },      // Softer green
  { label: 'Out of Office', value: 'out-of-office', color: '#ffe0b2', border: '#ffb74d', text: '#222' }, // Softer orange
];

function getDateKey(date) {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Returns an array of last 12 week objects: [{start: Date, end: Date, label: 'MM/DD-MM/DD'}]
function getLast12Weeks() {
  const weeks = [];
  const today = new Date();
  // Set to Monday of this week
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  for (let i = 0; i < 12; i++) {
    const start = new Date(monday);
    start.setDate(monday.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 4); // Friday
    // Format MM/DD-MM/DD (with leading zeros)
    const pad = n => n.toString().padStart(2, '0');
    const label = `${pad(start.getMonth() + 1)}/${pad(start.getDate())}-${pad(end.getMonth() + 1)}/${pad(end.getDate())}`;
    weeks.push({ start, end, label });
  }
  return weeks;
}

// Returns an object: { [weekKey]: { onCampus: number, remote: number, outOfOffice: number, total: number } }
function weeklyCompliance(workplaceMap) {
  // Helper to get week key: 'YYYY-WW'
  function getWeekKey(dateStr) {
    const date = new Date(dateStr);
    // Set to Monday of this week (should be the Monday that date falls on)
    const day = date.getDay();
    // JS: 0=Sunday, 1=Monday, ..., 6=Saturday
    // If Sunday (0), treat as next day (Monday)
    let offset = (day === 0) ? 1 : (day === 1 ? 0 : 1 - day);
    const monday = new Date(date);
    monday.setDate(date.getDate() + offset);
    const year = monday.getFullYear();
    // Get ISO week number
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const week1 = new Date(jan4);
    week1.setDate(jan4.getDate() - (jan4Day - 1));
    const diff = (monday - week1) / (7 * 24 * 60 * 60 * 1000);
    const week = 1 + Math.round(diff);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }
  const result = {};
  // For each of the last 12 weeks, fill in all weekdays (Mon-Fri)
  const last12Weeks = getLast12Weeks();
  last12Weeks.forEach(({ start }) => {
    const weekKey = getWeekKey(start.toISOString().split('T')[0]);
    if (!result[weekKey]) {
      result[weekKey] = { onCampus: 0, remote: 0, outOfOffice: 0, total: 0 };
    }
    for (let i = 0; i < 5; i++) { // Mon-Fri
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateKey = getDateKey(d);
      const value = workplaceMap[dateKey];
      if (value === 'on-campus') result[weekKey].onCampus++;
      else if (value === 'out-of-office') result[weekKey].outOfOffice++;
      else result[weekKey].remote++; // treat missing or 'remote' as remote
      result[weekKey].total++;
    }
  });
  return result;
}

// Calculate the average in-office percent for the best 8 of the last 12 weeks
function beltCalculation(weekPercents) {
  // weekPercents: array of { percent: number|null }
  const percents = weekPercents.map(w => w.percent == null ? 0 : w.percent);
  const top8 = percents.sort((a, b) => b - a).slice(0, 8);
  if (top8.length === 0) return 0;
  const avg = top8.reduce((sum, p) => sum + p, 0) / top8.length;
  return Math.round(avg);
}

function App() {
  // Initialize workplaceMap from localStorage for true persistence
  const [workplaceMap, setWorkplaceMap] = useState(() => {
    const data = localStorage.getItem('workplaceMap');
    return data ? JSON.parse(data) : {};
  });
  const [date, setDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState('month')
  const [selectedWorkplace, setSelectedWorkplace] = useState('')

  // Update selectedWorkplace when date or workplaceMap changes
  useEffect(() => {
    const key = getDateKey(date);
    setSelectedWorkplace(workplaceMap[key] || '');
  }, [date, workplaceMap]);

  // Save to localStorage when workplaceMap changes
  useEffect(() => {
    localStorage.setItem('workplaceMap', JSON.stringify(workplaceMap));
  }, [workplaceMap]);

  // Hide weekends: only show Monday (1) to Friday (5)
  const tileDisabled = ({ date, view }) => {
    if (view === 'month') {
      const day = date.getDay();
      return day === 0 || day === 6; // 0: Sunday, 6: Saturday
    }
    return false;
  };

  // Color code calendar tiles based on workplaceMap
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const key = getDateKey(date);
      const value = workplaceMap[key];
      if (value) {
        const opt = WORKPLACE_OPTIONS.find(o => o.value === value);
        return (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: opt.color,
            opacity: 0.45,
            zIndex: 0,
            borderRadius: 6,
          }} />
        );
      }
    }
    return null;
  };

  // Add a class to the tile for stacking background and text
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const key = getDateKey(date);
      if (workplaceMap[key]) {
        return 'wfh-tile-has-bg';
      }
    }
    return '';
  };

  const handleWorkplaceClick = (value) => {
    const key = getDateKey(date);
    setWorkplaceMap(prev => ({ ...prev, [key]: value }));
    setSelectedWorkplace(value);
  };

  const last12Weeks = getLast12Weeks();
  const weekly = weeklyCompliance(workplaceMap);
  // Map week label to weekKey for compliance lookup
  const weekKeyForDate = (date) => {
    // Use the same week key logic as weeklyCompliance
    const d = new Date(date);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const year = monday.getFullYear();
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const week1 = new Date(jan4);
    week1.setDate(jan4.getDate() - (jan4Day - 1));
    const diff = (monday - week1) / (7 * 24 * 60 * 60 * 1000);
    const week = 1 + Math.round(diff);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  };
  const last12OfficePercents = last12Weeks.map(({ start, label }) => {
    const weekKey = weekKeyForDate(start);
    const w = weekly[weekKey];
    if (!w || !w.total) return { week: label, percent: null };
    return { week: label, percent: Math.round((w.onCampus / w.total) * 100) };
  });

  return (
    <>
      <header>
        <h1>Hybrid Workspace Planner</h1>
      </header>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '2rem',
        margin: '2rem 0',
        width: 'auto',
        maxWidth: '100vw',
      }}>
        {/* Left: calendar + stats stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem' }}>
            <Calendar
              onChange={setDate}
              value={date}
              view={calendarView}
              onViewChange={({ activeStartDate, view }) => setCalendarView(view)}
              tileDisabled={tileDisabled}
              tileContent={tileContent}
              tileClassName={tileClassName}
            />
            <div style={{ minWidth: 200, padding: '1rem', border: '1px solid #eee', borderRadius: 8, background: '#fafbfc', height: 'fit-content' }}>
              <div style={{ fontWeight: 'bold', marginBottom: 16 }}>Where did you work?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {WORKPLACE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    style={{
                      padding: '0.5rem',
                      fontWeight: 'bold',
                      background: opt.color,
                      color: opt.text,
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      boxShadow: selectedWorkplace === opt.value ? '0 0 0 2px #1976d2' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'box-shadow 0.2s',
                    }}
                    onClick={() => handleWorkplaceClick(opt.value)}
                    aria-pressed={selectedWorkplace === opt.value}
                  >
                    <span>{opt.label}</span>
                    {selectedWorkplace === opt.value && (
                      <span style={{ color: 'limegreen', marginLeft: 8, fontSize: 20 }} aria-label="selected">✔</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <section style={{ width: 'max-content', minWidth: 600, maxWidth: '100%', padding: '1.5rem', border: '1px solid #eee', borderRadius: 8, background: '#f7f7fa', alignSelf: 'flex-start' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 12 }}>Workplace Statistics</h2>
            {(() => {
              const values = Object.values(workplaceMap).filter(Boolean);
              const total = values.length;
              if (!total) return <div style={{ color: '#888' }}>No data yet.</div>;
              return (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {WORKPLACE_OPTIONS.map(opt => {
                    const count = values.filter(v => v === opt.value).length;
                    const percent = ((count / total) * 100).toFixed(1);
                    return (
                      <li key={opt.value} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                        <span style={{ display: 'inline-block', width: 16, height: 16, background: opt.color, borderRadius: 4, marginRight: 8, border: `1px solid ${opt.border}` }}></span>
                        <span style={{ flex: 1 }}>{opt.label}</span>
                        <span style={{ fontWeight: 'bold', minWidth: 48, textAlign: 'right' }}>{percent}%</span>
                      </li>
                    );
                  })}
                </ul>
              );
            })()}
          </section>
        </div>
        {/* Right: compliance table */}
        <div style={{
          minWidth: 220,
          padding: '1rem',
          border: '1px solid #eee',
          borderRadius: 8,
          background: '#f7f7fa',
          alignSelf: 'stretch',
          display: 'flex',
          flexDirection: 'column',
          height: 'auto',
        }}>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', textAlign: 'center' }}>Current Compliance</h3>
          <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 12 }}>
            {(() => {
              const belt = beltCalculation(last12OfficePercents);
              let color = 'green';
              if (belt <= 40) color = 'red';
              else if (belt < 60) color = '#FFD600';
              return <span style={{ color, fontWeight: 'bold', fontSize: 40, lineHeight: 1 }}>{belt}%</span>;
            })()} BELT
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
            {last12OfficePercents.map(({ week, percent }) => (
              <li key={week} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ flex: 1 }}>{week}</span>
                {percent === null ? (
                  <span style={{ color: '#888', fontStyle: 'italic', minWidth: 48, textAlign: 'right', marginLeft: 8 }}>No data</span>
                ) : (
                  <>
                    <span style={{ fontWeight: 'bold', minWidth: 32, textAlign: 'right', marginLeft: 8 }}>{percent}%</span>
                    {percent >= 60 ? (
                      <span style={{ color: 'green', fontSize: 20, marginLeft: 8 }} aria-label="compliant">✔</span>
                    ) : percent === 40 ? (
                      <span style={{
                        display: 'inline-block',
                        width: 20,
                        height: 20,
                        background: '#FFD600',
                        marginLeft: 8,
                        verticalAlign: 'middle',
                        borderRadius: 4,
                        lineHeight: 1,
                      }} aria-label="marginal"></span>
                    ) : (
                      <span style={{ color: 'red', fontSize: 20, marginLeft: 8 }} aria-label="not compliant">⦸</span>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <style>{`
        .wfh-tile-has-bg {
          position: relative;
          z-index: 1;
        }
        .react-calendar__tile {
          position: relative;
          z-index: 2;
        }
      `}</style>
    </>
  )
}

export default App

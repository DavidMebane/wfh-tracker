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

  return (
    <>
      <header>
        <h1>Hybrid Workspace Planner</h1>
      </header>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '2rem', margin: '2rem 0' }}>
        <Calendar
          onChange={setDate}
          value={date}
          view={calendarView}
          onViewChange={({ activeStartDate, view }) => setCalendarView(view)}
          tileDisabled={tileDisabled}
          tileContent={tileContent}
          tileClassName={tileClassName}
        />
        <div style={{ minWidth: 200, padding: '1rem', border: '1px solid #eee', borderRadius: 8, background: '#fafbfc' }}>
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

import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import './App.css'

const WORKPLACE_OPTIONS = [
  { label: 'On Campus', value: 'on-campus', color: '#e3f2fd', border: '#90caf9' },
  { label: 'Remote', value: 'remote', color: '#e8f5e9', border: '#81c784' },
  { label: 'Out of Office', value: 'out-of-office', color: '#fff3e0', border: '#ffb74d' },
];

function getDateKey(date) {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function App() {
  const [date, setDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState('month')
  const [workplaceMap, setWorkplaceMap] = useState({})
  const [selectedWorkplace, setSelectedWorkplace] = useState('')

  // Load from localStorage on mount
  useEffect(() => {
    const data = localStorage.getItem('workplaceMap');
    if (data) setWorkplaceMap(JSON.parse(data));
  }, []);

  // Update selectedWorkplace when date changes
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
                  border: `2px solid ${selectedWorkplace === opt.value ? '#1976d2' : opt.border}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                  outline: selectedWorkplace === opt.value ? '2px solid #1976d2' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onClick={() => handleWorkplaceClick(opt.value)}
                aria-pressed={selectedWorkplace === opt.value}
              >
                <span>{opt.label}</span>
                {selectedWorkplace === opt.value && (
                  <span style={{ color: 'green', marginLeft: 8, fontSize: 20 }} aria-label="selected">✔</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default App

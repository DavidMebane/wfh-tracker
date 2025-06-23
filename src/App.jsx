import { useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import './App.css'

function App() {
  const [date, setDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState('month')

  // Hide weekends: only show Monday (1) to Friday (5)
  const tileDisabled = ({ date, view }) => {
    if (view === 'month') {
      const day = date.getDay();
      return day === 0 || day === 6; // 0: Sunday, 6: Saturday
    }
    return false;
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
            <button style={{ padding: '0.5rem', fontWeight: 'bold', background: '#e3f2fd', border: '1px solid #90caf9', borderRadius: 4, cursor: 'pointer' }}>On Campus</button>
            <button style={{ padding: '0.5rem', fontWeight: 'bold', background: '#e8f5e9', border: '1px solid #81c784', borderRadius: 4, cursor: 'pointer' }}>Remote</button>
            <button style={{ padding: '0.5rem', fontWeight: 'bold', background: '#fff3e0', border: '1px solid #ffb74d', borderRadius: 4, cursor: 'pointer' }}>Out of Office</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default App

import { Routes, Route, Link } from 'react-router-dom'
import NewRound from './pages/NewRound'
import Dashboard from './pages/Dashboard'
import Stats from './pages/Stats'

export default function App() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px'}}>
      <nav style={{ display: 'flex', gap: 24, marginBottom: 32, borderBottom: '1px solid #eee', paddingBottom: 16}}>
        <Link to="/" style={{ textDecoration: 'none', color: '#1a1a1a', fontWeight: 500 }}>Dashboard</Link>
        <Link to="/new-round" style={{ textDecoration: 'none', color: '#1a1a1a', fontWeight: 500 }}>New Round</Link>
        <Link to="/stats" style={{ textDecoration: 'none', color: '#1a1a1a', fontWeight: 500 }}>Stats</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new-round" element={<NewRound />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </div>
  )
}
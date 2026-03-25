import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

export default function Stats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/stats`)
      .then(r => r.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <p style={{ color: '#888' }}>Loading...</p>
  if (!stats || stats.message) return <p style={{ color: '#888' }}>No rounds logged yet</p>

  const statCard = (label, value) => (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 20 }}>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 500 }}>{value}</p>
    </div>
  )

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 24 }}>Stats</h1>

      <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, color: '#888' }}>Scoring</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        {statCard('Scoring average', stats.scoring_average)}
        {statCard('Total rounds', stats.total_rounds)}
        {statCard('Avg differential', stats.avg_differential)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
        <div style={{ background: '#EAF3DE', border: '1px solid #C0DD97', borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 12, color: '#3B6D11', marginBottom: 8 }}>Best round</p>
          <p style={{ fontSize: 28, fontWeight: 500, color: '#3B6D11' }}>{stats.best_round.score}</p>
          <p style={{ fontSize: 13, color: '#3B6D11', marginTop: 4 }}>{stats.best_round.course}</p>
          <p style={{ fontSize: 12, color: '#3B6D11', marginTop: 2 }}>
            {new Date(stats.best_round.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div style={{ background: '#FCEBEB', border: '1px solid #F09595', borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 12, color: '#A32D2D', marginBottom: 8 }}>Worst round</p>
          <p style={{ fontSize: 28, fontWeight: 500, color: '#A32D2D' }}>{stats.worst_round.score}</p>
          <p style={{ fontSize: 13, color: '#A32D2D', marginTop: 4 }}>{stats.worst_round.course}</p>
          <p style={{ fontSize: 12, color: '#A32D2D', marginTop: 2 }}>
            {new Date(stats.worst_round.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, color: '#888' }}>Rounds per course</h2>
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eee', color: '#888', fontSize: 12 }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Course</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>Rounds</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.rounds_per_course)
              .sort((a, b) => b[1] - a[1])
              .map(([course, count], i, arr) => (
                <tr key={course} style={{ borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{course}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>{count}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {stats.hole_stats ? (
        <>
          <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 4, color: '#888' }}>Hole-by-hole averages per round</h2>
          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>
            Based on {stats.hole_stats.rounds_with_hole_data} rounds with hole data
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Eagles', value: stats.hole_stats.avg_eagles_per_round, color: '#854F0B', bg: '#FAEEDA' },
              { label: 'Birdies', value: stats.hole_stats.avg_birdies_per_round, color: '#3B6D11', bg: '#EAF3DE' },
              { label: 'Pars', value: stats.hole_stats.avg_pars_per_round, color: '#185FA5', bg: '#E6F1FB' },
              { label: 'Bogeys', value: stats.hole_stats.avg_bogeys_per_round, color: '#854F0B', bg: '#FAEEDA' },
              { label: 'Doubles', value: stats.hole_stats.avg_doubles_per_round, color: '#A32D2D', bg: '#FCEBEB' },
              { label: 'Triples+', value: stats.hole_stats.avg_triples_plus_per_round, color: '#791F1F', bg: '#F7C1C1' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 12, padding: 20 }}>
                <p style={{ fontSize: 12, color, marginBottom: 8 }}>{label}</p>
                <p style={{ fontSize: 28, fontWeight: 500, color }}>{value}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#888', fontSize: 14 }}>Log a round with hole-by-hole scores to unlock detailed stats</p>
        </div>
      )}
    </div>
  )
}
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export default function Dashboard() {
  const [handicap, setHandicap] = useState(null)
  const [rounds, setRounds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/handicap`).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_URL}/rounds`).then(r => r.json())
    ]).then(([handicapData, roundsData]) => {
      setHandicap(handicapData)
      setRounds(roundsData)
      setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ color: '#888' }}>Loading...</p>

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 24 }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        <div style={{ background: '#1a1a1a', borderRadius: 12, padding: 24, color: '#fff' }}>
          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>Handicap index</p>
          <p style={{ fontSize: 40, fontWeight: 500, lineHeight: 1 }}>
            {handicap?.handicap_index ?? '—'}
          </p>
          {handicap?.rounds_until_handicap > 0 && (
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>
              {handicap.rounds_until_handicap} more rounds needed
            </p>
          )}
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24 }}>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Rounds logged</p>
          <p style={{ fontSize: 40, fontWeight: 500, lineHeight: 1 }}>{handicap?.total_rounds ?? 0}</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24 }}>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Avg differential</p>
          <p style={{ fontSize: 40, fontWeight: 500, lineHeight: 1 }}>
            {rounds.length > 0
              ? (rounds.reduce((sum, r) => sum + r.score_differential, 0) / rounds.length).toFixed(1)
              : '—'}
          </p>
        </div>
      </div>

    {rounds.length >= 2 && (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24, marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>Handicap trend</h2>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart
                    data={[...rounds].reverse().map((r, i) => ({
                        round: i + 1,
                        differential: r.score_differential,
                        date: r.played_at
                    }))}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                    <XAxis dataKey="round" tick={{ fontSize: 12, fill: '#aaa' }} label={{ value: 'Round', position: 'insideBottom', fontSize: 12, fill: '#aaa' }}/>
                    <YAxis tick={{ fontSize: 12, fill: '#aaa' }} domain={['auto', 'auto']} />
                    <Tooltip
                        contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #eee' }}
                        formatter={(val) => [val.toFixed(1), 'Differential']}
                        labelFormatter={(label) => `Round: ${label}`}
                    />
                    <ReferenceLine
                        y={handicap?.handicap_index}
                        stroke="#1a1a1a"
                        strokeDasharray="4 4"
                        label={{ value: `Index: ${handicap?.handicap_index}`, position: 'right', fontSize: 11, fill: '#888' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="differential"
                        stroke="#3B6D11"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#3B6D11' }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )}

      <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 12 }}>Recent rounds</h2>

      {rounds.length === 0 ? (
        <p style={{ color: '#888', fontSize: 14 }}>No rounds logged yet — go to Log Round to add one</p>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee', color: '#888', fontSize: 12 }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Course</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>Gross</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>Differential</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((r, i) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: i < rounds.length - 1 ? '1px solid #f5f5f5' : 'none' }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{r.course_name}</td>
                  <td style={{ padding: '12px 16px', color: '#888' }}>
                    {new Date(r.played_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>{r.gross_score}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      background: r.score_differential < 15 ? '#EAF3DE' : '#FCEBEB',
                      color: r.score_differential < 15 ? '#3B6D11' : '#A32D2D',
                      padding: '2px 10px',
                      borderRadius: 99,
                      fontSize: 13,
                      fontWeight: 500
                    }}>
                      {r.score_differential}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
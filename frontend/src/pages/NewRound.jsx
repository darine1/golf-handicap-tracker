import { useState, useEffect } from 'react'

const PARS = [4,5,3,4,4,5,3,4,4,4,3,5,4,4,3,5,4,4]

export default function NewRound() {
  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState('')
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().split('T')[0])
  const [scores, setScores] = useState(Array(18).fill(''))
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/courses`)
      .then(r => r.json())
      .then(data => {
        setCourses(data)
        if (data.length > 0) setCourseId(data[0].id)
      })
  }, [])

  function setScore(index, value) {
    const updated = [...scores]
    updated[index] = value
    setScores(updated)
  }

  function getTotal(start, end) {
    const slice = scores.slice(start, end)
    if (slice.some(s => s === '')) return null
    return slice.reduce((sum, s) => sum + parseInt(s), 0)
  }

  const front = getTotal(0, 9)
  const back = getTotal(9, 18)
  const total = front !== null && back !== null ? front + back : null

  function scoreColor(strokes, par) {
    if (strokes === '') return {}
    const diff = parseInt(strokes) - par
    if (diff <= -2) return { background: '#FAEEDA', color: '#854F0B' }
    if (diff === -1) return { background: '#EAF3DE', color: '#3B6D11' }
    if (diff === 1)  return { background: '#FCEBEB', color: '#A32D2D' }
    if (diff >= 2)   return { background: '#F7C1C1', color: '#791F1F' }
    return {}
  }

  async function handleSubmit() {
    if (!courseId) { setMessage('Please add a course first'); return }
    if (total === null) { setMessage('Please fill in all 18 holes'); return }

    const res = await fetch(`${import.meta.env.VITE_API_URL}/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: courseId,
        played_at: playedAt,
        gross_score: total,
        notes
      })
    })

    if (res.ok) {
      const data = await res.json()
      setResult({ ...data, saved_gross: total })
      setScores(Array(18).fill(''))
      setNotes('')
      setMessage('')
    } else {
      setMessage('Something went wrong saving the round')
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 24 }}>Log a round</h1>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Course</label>
            <select
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Date played</label>
            <input
              type="date"
              value={playedAt}
              onChange={e => setPlayedAt(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#888' }}>
                <td style={{ padding: '4px 6px' }}>Hole</td>
                {Array.from({length: 9}, (_, i) => (
                  <td key={i} style={{ padding: '4px 6px', textAlign: 'center' }}>{i+1}</td>
                ))}
                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 500 }}>Out</td>
                {Array.from({length: 9}, (_, i) => (
                  <td key={i+9} style={{ padding: '4px 6px', textAlign: 'center' }}>{i+10}</td>
                ))}
                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 500 }}>In</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 500 }}>Tot</td>
              </tr>
              <tr style={{ color: '#aaa' }}>
                <td style={{ padding: '4px 6px' }}>Par</td>
                {PARS.slice(0,9).map((p,i) => (
                  <td key={i} style={{ padding: '4px 6px', textAlign: 'center' }}>{p}</td>
                ))}
                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 500 }}>36</td>
                {PARS.slice(9).map((p,i) => (
                  <td key={i+9} style={{ padding: '4px 6px', textAlign: 'center' }}>{p}</td>
                ))}
                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 500 }}>36</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 500 }}>72</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '4px 6px', color: '#888', fontSize: 12 }}>Score</td>
                {scores.slice(0,9).map((s, i) => (
                  <td key={i} style={{ padding: '2px' }}>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={s}
                      onChange={e => setScore(i, e.target.value)}
                      style={{
                        width: 36, height: 30, textAlign: 'center',
                        border: '1px solid #ddd', borderRadius: 4,
                        ...scoreColor(s, PARS[i])
                      }}
                    />
                  </td>
                ))}
                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 500 }}>
                  {front ?? '—'}
                </td>
                {scores.slice(9).map((s, i) => (
                  <td key={i+9} style={{ padding: '2px' }}>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={s}
                      onChange={e => setScore(i+9, e.target.value)}
                      style={{
                        width: 36, height: 30, textAlign: 'center',
                        border: '1px solid #ddd', borderRadius: 4,
                        ...scoreColor(s, PARS[i+9])
                      }}
                    />
                  </td>
                ))}
                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 500 }}>
                  {back ?? '—'}
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 500 }}>
                  {total ?? '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Notes (optional)</label>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Windy day, played well on back 9"
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
          />
        </div>

        <button
          onClick={handleSubmit}
          style={{ marginTop: 16, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px' }}
        >
          Save round
        </button>

        {message && <p style={{ marginTop: 12, fontSize: 13, color: '#A32D2D' }}>{message}</p>}
      </div>

      {result && (
        <div style={{ background: '#EAF3DE', border: '1px solid #C0DD97', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 12, color: '#3B6D11' }}>Round saved</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ background: '#fff', borderRadius: 8, padding: 12 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Gross score</p>
              <p style={{ fontSize: 24, fontWeight: 500 }}>{result.saved_gross}</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 8, padding: 12 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Score differential</p>
              <p style={{ fontSize: 24, fontWeight: 500 }}>{result.score_differential}</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 8, padding: 12 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Handicap index</p>
              <p style={{ fontSize: 24, fontWeight: 500 }}>
                {result.handicap_index ?? `Need ${result.rounds_until_handicap} more rounds`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
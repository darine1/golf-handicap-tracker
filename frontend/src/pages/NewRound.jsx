import { useState } from 'react'

const API = import.meta.env.VITE_API_URL

export default function NewRound() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedTee, setSelectedTee] = useState(null)
  const [courseDetails, setCourseDetails] = useState(null)
  const [playedAt, setPlayedAt] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  const [scores, setScores] = useState(Array(18).fill(''))
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const [searching, setSearching] = useState(false)
  const [loadingCourse, setLoadingCourse] = useState(false)

  async function handleSearch() {
    if (!query) return
    setSearching(true)
    const res = await fetch(`${API}/courses/search?q=${encodeURIComponent(query)}`)
    const data = await res.json()
    setSearchResults(data)
    setSearching(false)
  }

  async function handleSelectCourse(course) {
    setLoadingCourse(true)
    setSelectedCourse(course)
    setSearchResults([])
    setQuery('')
    const res = await fetch(`${API}/courses/details/${course.id}`)
    const data = await res.json()
    setCourseDetails(data)
    setSelectedTee(data.tee_name)
    setScores(Array(18).fill(''))
    setResult(null)
    setLoadingCourse(false)
  }

  function handleTeeChange(teeName) {
    setSelectedTee(teeName)
  }

  function getCurrentPars() {
    if (!courseDetails) return Array(18).fill(4)
    if (!courseDetails.available_tees || courseDetails.available_tees.length === 0) {
      return courseDetails.hole_pars || Array(18).fill(4)
    }
    return courseDetails.hole_pars || Array(18).fill(4)
  }

  const pars = getCurrentPars()
  const frontPar = pars.slice(0, 9).reduce((a, b) => a + b, 0)
  const backPar = pars.slice(9).reduce((a, b) => a + b, 0)

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
    if (!courseDetails) { setMessage('Please select a course first'); return }
    if (total === null) { setMessage('Please fill in all 18 holes'); return }

    // First save the course to our database if not already there
    const courseRes = await fetch(`${API}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${courseDetails.club_name} - ${courseDetails.course_name}`,
        location: courseDetails.location?.city
          ? `${courseDetails.location.city}, ${courseDetails.location.state}`
          : null,
        course_rating: courseDetails.course_rating,
        slope_rating: courseDetails.slope_rating,
        par: courseDetails.par_total,
        hole_pars: courseDetails.hole_pars,
        external_id: String(courseDetails.external_id)
      })
    })
    const savedCourse = await courseRes.json()

    // Then save the round
    const roundRes = await fetch(`${API}/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: savedCourse.id,
        played_at: playedAt,
        gross_score: total,
        notes,
        hole_scores: scores.map((strokes, i) => ({
          hole_number: i + 1,
          strokes: parseInt(strokes),
          par: pars[i]
        }))
      })
    })

    if (roundRes.ok) {
      const data = await roundRes.json()
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

      {/* Course search */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 12 }}>Find your course</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search for a course..."
            style={{ flex: 1, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            style={{ background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px' }}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
            {searchResults.map((c, i) => (
              <div
                key={c.id}
                onClick={() => handleSelectCourse(c)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: i < searchResults.length - 1 ? '1px solid #f5f5f5' : 'none',
                  background: '#fff'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f9f9f9'}
                onMouseOut={e => e.currentTarget.style.background = '#fff'}
              >
                <p style={{ fontWeight: 500, fontSize: 14 }}>{c.club_name}</p>
                <p style={{ fontSize: 12, color: '#888' }}>
                  {c.course_name !== c.club_name ? c.course_name + ' · ' : ''}
                  {c.location?.city && `${c.location.city}, ${c.location.state}`}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Selected course */}
        {loadingCourse && <p style={{ fontSize: 13, color: '#888', marginTop: 8 }}>Loading course details...</p>}
        {courseDetails && !loadingCourse && (
          <div style={{ marginTop: 12, background: '#EAF3DE', borderRadius: 8, padding: '10px 14px' }}>
            <p style={{ fontWeight: 500, fontSize: 14, color: '#3B6D11' }}>
              {courseDetails.club_name} — {courseDetails.course_name}
            </p>
            <p style={{ fontSize: 12, color: '#3B6D11', marginTop: 4 }}>
              {courseDetails.tee_name} tees · Rating: {courseDetails.course_rating} · Slope: {courseDetails.slope_rating} · Par {courseDetails.par_total}
            </p>
            {courseDetails.available_tees?.length > 1 && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#3B6D11' }}>Change tee:</span>
                {courseDetails.available_tees.map(t => (
                  <span
                    key={t}
                    onClick={() => handleTeeChange(t)}
                    style={{
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 99,
                      cursor: 'pointer',
                      background: selectedTee === t ? '#3B6D11' : '#C0DD97',
                      color: selectedTee === t ? '#fff' : '#3B6D11'
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scorecard — only show once a course is selected */}
      {courseDetails && !loadingCourse && (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Date played</label>
            <input
              type="date"
              value={playedAt}
              onChange={e => setPlayedAt(e.target.value)}
              style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
            />
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
                  {pars.slice(0,9).map((p,i) => (
                    <td key={i} style={{ padding: '4px 6px', textAlign: 'center' }}>{p}</td>
                  ))}
                  <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 500 }}>{frontPar}</td>
                  {pars.slice(9).map((p,i) => (
                    <td key={i+9} style={{ padding: '4px 6px', textAlign: 'center' }}>{p}</td>
                  ))}
                  <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 500 }}>{backPar}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 500 }}>{frontPar + backPar}</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 6px', color: '#888', fontSize: 12 }}>Score</td>
                  {scores.slice(0,9).map((s, i) => (
                    <td key={i} style={{ padding: '2px' }}>
                      <input
                        type="number" min="1" max="15" value={s}
                        onChange={e => setScore(i, e.target.value)}
                        style={{ width: 36, height: 30, textAlign: 'center', border: '1px solid #ddd', borderRadius: 4, ...scoreColor(s, pars[i]) }}
                      />
                    </td>
                  ))}
                  <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 500 }}>{front ?? '—'}</td>
                  {scores.slice(9).map((s, i) => (
                    <td key={i+9} style={{ padding: '2px' }}>
                      <input
                        type="number" min="1" max="15" value={s}
                        onChange={e => setScore(i+9, e.target.value)}
                        style={{ width: 36, height: 30, textAlign: 'center', border: '1px solid #ddd', borderRadius: 4, ...scoreColor(s, pars[i+9]) }}
                      />
                    </td>
                  ))}
                  <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 500 }}>{back ?? '—'}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 500 }}>{total ?? '—'}</td>
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
      )}

      {/* Result */}
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
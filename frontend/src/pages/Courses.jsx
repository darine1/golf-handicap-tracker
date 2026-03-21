import { useState, useEffect } from 'react'

export default function Courses() {
    const [courses, setCourses] = useState([])
    const [name, setName] = useState('')
    const [location, setLocation] = useState('')
    const [courseRating, setCourseRating] = useState('')
    const [slopeRating, setSlopeRating] = useState('')
    const [par, setPar] = useState(72)
    const [message, setMessage] = useState('')

    useEffect(() => {
        fetchCourses()
    }, [])

    async function fetchCourses() {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/courses`)
        const data = await res.json()
        setCourses(data)
    }

    async function handleSubmit() {
        if (!name || !courseRating || !slopeRating) {
            setMessage('Please fill in name, course rating, and slope rating')
            return
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                location,
                course_rating: parseFloat(courseRating),
                slope_rating: parseInt(slopeRating),
                par: parseInt(par)
            })
        })

        if (res.ok) {
            setMessage('Course added!')
            setName('')
            setLocation('')
            setCourseRating('')
            setSlopeRating('')
            setPar(72)
            fetchCourses()
        } else {
            setMessage('Something went wrong')
        }
    }

    return (
        <div>
            <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 24 }}>Courses</h1>

            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24, marginBottom: 32}}>
                <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom:16 }}>Add a course</h2>

                <div style={{ display: 'grid', gridTemplateColums: '1fr 1fr', gap: 12, marginBottom: 12}}>
                    <div>
                        <label style= {{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4}}>Course name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Troon North"
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4}}>Location</label>
                        <input
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder="e.g. Scottsdale, AZ"
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4}}>Course rating</label>
                        <input
                            value={courseRating}
                            onChange={e => setCourseRating(e.target.value)}
                            placeholder="e.g. 73.9"
                            type="number"
                            step="0.1"
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Slope rating</label>
                        <input
                            value={slopeRating}
                            onChange={e => setSlopeRating(e.target.value)}
                            placeholder="e.g. 145"
                            type="number"
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Par</label>
                        <input
                            value={par}
                            onChange={e => setPar(e.target.value)}
                            type="number"
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
                        />
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    style={{ background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px' }}
                >
                    Add course
                </button>

                {message && <p style={{ marginTop: 12, fontSize: 13, color: '#3B6D11' }}>{message}</p>}
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 12 }}>Your courses</h2>
            {courses.length === 0 ? (
                <p style={{ color: '#888', fontSize: 14 }}>No courses added yet</p>
            ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                    {courses.map(c => (
                        <div key={c.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontWeight: 500 }}>{c.name}</p>
                                <p style={{ fontSize: 13, color: '#888' }}>{c.location}</p>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: 13, color: '#666' }}>
                                <p>Rating: {c.course_rating}</p>
                                <p>Slope: {c.slope_rating} · Par {c.par}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
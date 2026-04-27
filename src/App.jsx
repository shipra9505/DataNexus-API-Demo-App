import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL
console.log('API URL is:', API)

export default function App() {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', message: '',
    villageId: '', villageName: '',
    subDistrict: '', district: '', state: '', country: 'India'
  })

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null) // ✅ NEW
  const debounceRef = useRef(null)

  // Debounced autocomplete
  useEffect(() => {
    if (query.length < 2) return;

    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${API}/search/autocomplete?q=${query}`);
        setSuggestions(res?.data?.data ?? []);
      } catch (err) {
        console.error(err);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const selectVillage = async (village) => {
    setSuggestions([])
    setQuery(village.label)
    setError(null) // ✅ clear old errors

    try {
      const res = await axios.get(`${API}/villages/${village.value}`)
      const h   = res.data.data.hierarchy

      setForm(f => ({
        ...f,
        villageId:   village.value,
        villageName: h.village,
        subDistrict: h.subDistrict,
        district:    h.district,
        state:       h.state,
        country:     h.country,
      }))
    } catch (err) {
      console.error(err)

      // ✅ Proper error handling
      if (err.response) {
        setError(err.response.data?.error || 'Failed to load village details')
      } else if (err.request) {
        setError('Network error. Please check your connection.')
      } else {
        setError('Something went wrong')
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', form)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Form submitted!</h2>
          <p className="text-gray-500 text-sm mb-1">
            <span className="font-medium">Name:</span> {form.fullName}
          </p>
          <p className="text-gray-500 text-sm mb-4">
            <span className="font-medium">Address:</span> {form.villageName}, {form.subDistrict}, {form.district}, {form.state}, {form.country}
          </p>
          <button onClick={() => {
            setSubmitted(false)
            setForm({
              fullName:'',email:'',phone:'',message:'',
              villageId:'',villageName:'',
              subDistrict:'',district:'',state:'',country:'India'
            })
            setQuery('')
          }}
          className="text-sm text-blue-600 hover:underline">
            Submit another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Contact Form</h1>
        </div>

        {/* ✅ ERROR UI */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">

          <input
            required
            value={form.fullName}
            onChange={e => setForm(f => ({...f, fullName: e.target.value}))}
            placeholder="Full name"
            className="w-full border px-3 py-2 rounded-lg text-sm"
          />

          <input
            required
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({...f, email: e.target.value}))}
            placeholder="Email"
            className="w-full border px-3 py-2 rounded-lg text-sm"
          />

          <input
            value={form.phone}
            onChange={e => setForm(f => ({...f, phone: e.target.value}))}
            placeholder="Phone"
            className="w-full border px-3 py-2 rounded-lg text-sm"
          />

          {/* Village */}
          <input
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setError(null) // ✅ clear error while typing
              setForm(f => ({...f, villageId:'', villageName:'', subDistrict:'', district:'', state:''}))
            }}
            placeholder="Search village..."
            className="w-full border px-3 py-2 rounded-lg text-sm"
          />

          {suggestions.map(s => (
            <button key={s.value} type="button" onClick={() => selectVillage(s)}>
              {s.label}
            </button>
          ))}

          <textarea
            value={form.message}
            onChange={e => setForm(f => ({...f, message: e.target.value}))}
            placeholder="Message"
            className="w-full border px-3 py-2 rounded-lg text-sm"
          />

          <button className="w-full bg-blue-600 text-white py-2 rounded-lg">
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}
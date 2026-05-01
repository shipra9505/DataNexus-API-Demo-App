import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function App() {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', message: '',
    villageId: '', villageName: '',
    subDistrict: '', district: '', state: '', country: 'India'
  })

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const debounceRef = useRef(null)

  // 🔍 Debounced Autocomplete
  useEffect(() => {
    if (query.length < 2) {
      return
    }

    clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await axios.get(`${API}/search/autocomplete?q=${query}`)
        setSuggestions(res?.data?.data ?? [])
      } catch (err) {
        console.error(err)
        setSuggestions([])
        setError('Failed to fetch suggestions')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  // 📍 Select Village
  const selectVillage = async (village) => {
    setSuggestions([])
    setQuery(village.label)
    setError(null)

    try {
      const res = await axios.get(`${API}/villages/${village.value}`)
      const h = res.data.data.hierarchy

      setForm(f => ({
        ...f,
        villageId: village.value,
        villageName: h.village,
        subDistrict: h.subDistrict,
        district: h.district,
        state: h.state,
        country: h.country,
      }))
    } catch (err) {
      console.error(err)

      if (err.response) {
        setError(err.response.data?.error || 'Failed to load village details')
      } else if (err.request) {
        setError('Network error. Please check connection.')
      } else {
        setError('Something went wrong')
      }
    }
  }

  // ✅ Submit
  const handleSubmit = (e) => {
    e.preventDefault()

    // 🔒 Basic validation
    if (!form.fullName || !form.email || !form.villageId) {
      setError('Please fill all required fields and select a village')
      return
    }

    console.log('Form submitted:', form)
    setSubmitted(true)
  }

  // ✅ Reset
  const resetForm = () => {
    setSubmitted(false)
    setForm({
      fullName:'',email:'',phone:'',message:'',
      villageId:'',villageName:'',
      subDistrict:'',district:'',state:'',country:'India'
    })
    setQuery('')
    setError(null)
  }

  // 🎉 Success Screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border p-10 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-2">Form submitted!</h2>
          <p className="text-sm mb-1"><b>Name:</b> {form.fullName}</p>
          <p className="text-sm mb-4">
            <b>Address:</b> {form.villageName}, {form.subDistrict}, {form.district}, {form.state}, {form.country}
          </p>
          <button onClick={resetForm} className="text-blue-600 text-sm hover:underline">
            Submit another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        <h1 className="text-2xl font-semibold text-center mb-6">Contact Form</h1>

        {/* ❌ ERROR UI */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border space-y-6">

          {/* Name + Email */}
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              required
              value={form.fullName}
              onChange={e => setForm(f => ({...f, fullName: e.target.value}))}
              placeholder="Full name"
              className="border px-3 py-2 rounded-lg text-sm"
            />
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({...f, email: e.target.value}))}
              placeholder="Email"
              className="border px-3 py-2 rounded-lg text-sm"
            />
          </div>

          {/* Phone */}
          <input
            value={form.phone}
            onChange={e => setForm(f => ({...f, phone: e.target.value}))}
            placeholder="Phone"
            className="w-full border px-3 py-2 rounded-lg text-sm"
          />

          {/* 🔍 Village Search */}
          <div className="relative">
            <input
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                setError(null)
                setForm(f => ({
                  ...f,
                  villageId:'', villageName:'',
                  subDistrict:'', district:'', state:''
                }))
              }}
              placeholder="Search village..."
              className="w-full border px-3 py-2 rounded-lg text-sm"
            />

            {/* Loader */}
            {loading && (
              <div className="absolute right-3 top-2.5 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}

            {/* Suggestions */}
            {query.length >= 2 && suggestions.length > 0 && (
              <div className="absolute w-full bg-white border rounded-lg mt-1 shadow-lg z-10">
                {suggestions.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => selectVillage(s)}
                    className="block w-full text-left px-4 py-2 hover:bg-blue-50"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 📍 Auto-filled fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            {['subDistrict','district','state','country'].map(field => (
              <input
                key={field}
                readOnly
                value={form[field]}
                placeholder={field}
                className="border px-3 py-2 rounded-lg text-sm bg-gray-100"
              />
            ))}
          </div>

          {/* Message */}
          <textarea
            value={form.message}
            onChange={e => setForm(f => ({...f, message: e.target.value}))}
            placeholder="Message"
            className="w-full border px-3 py-2 rounded-lg text-sm"
          />

          {/* 🚫 Disable if village not selected */}
          <button
            disabled={!form.villageId}
            className={`w-full py-2 rounded-lg text-white ${
              form.villageId ? 'bg-blue-600' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}
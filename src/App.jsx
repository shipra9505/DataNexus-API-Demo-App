import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || "http://localhost:3000"

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

  // 🔍 AUTOCOMPLETE
  useEffect(() => {
    if (query.length < 2) return

    clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await axios.get(
          `${API}/api/v1/search/autocomplete?q=${query}`
        )
        setSuggestions(res?.data?.data ?? [])
      } catch (err) {
        console.error(err)
        setSuggestions([])

        if (err.response) {
          setError(err.response.data?.error || 'Failed to fetch suggestions')
        } else if (err.request) {
          setError('Network error. Backend not reachable.')
        } else {
          setError('Something went wrong')
        }
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [query])


  // 📍 SELECT VILLAGE
  const selectVillage = async (village) => {
    setSuggestions([])
    setQuery(village.label)
    setError(null)

    try {
      const res = await axios.get(
        `${API}/api/v1/villages/${village.value}`
      )

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
        setError('Network error while fetching village')
      } else {
        setError('Something went wrong')
      }
    }
  }

  // ✅ SUBMIT
  const handleSubmit = (e) => {
    e.preventDefault()

    if (!form.fullName || !form.email || !form.villageId) {
      setError('Please fill all required fields and select a village')
      return
    }

    console.log('Form submitted:', form)
    setSubmitted(true)
  }

  // 🔁 RESET
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

  // 🎉 SUCCESS UI
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <h2 className="text-xl font-semibold mb-2">Form submitted!</h2>
          <p className="text-sm mb-2"><b>Name:</b> {form.fullName}</p>
          <p className="text-sm mb-4">
            <b>Address:</b> {form.villageName}, {form.subDistrict}, {form.district}, {form.state}
          </p>
          <button onClick={resetForm} className="text-blue-600 hover:underline">
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

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl space-y-5">

          <div className="grid sm:grid-cols-2 gap-4">
            <input
              required
              value={form.fullName}
              onChange={e => setForm(f => ({...f, fullName: e.target.value}))}
              placeholder="Full name"
              className="border px-3 py-2 rounded"
            />
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({...f, email: e.target.value}))}
              placeholder="Email"
              className="border px-3 py-2 rounded"
            />
          </div>

          <input
            value={form.phone}
            onChange={e => setForm(f => ({...f, phone: e.target.value}))}
            placeholder="Phone"
            className="w-full border px-3 py-2 rounded"
          />

          {/* 🔍 VILLAGE SEARCH */}
          <div className="relative">
            <input
              value={query}
              onChange={e => {
                const newQuery = e.target.value
                setQuery(newQuery)
                if (newQuery.length < 2) {
                  setSuggestions([])
                }
                setError(null)
                setForm(f => ({
                  ...f,
                  villageId:'', villageName:'',
                  subDistrict:'', district:'', state:''
                }))
              }}
              placeholder="Search village..."
              className="w-full border px-3 py-2 rounded"
            />

            {loading && (
              <div className="absolute right-3 top-2.5 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}

            {suggestions.length > 0 && (
              <div className="absolute w-full bg-white border rounded mt-1 shadow z-10">
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

          {/* AUTO FILL */}
          <div className="grid sm:grid-cols-2 gap-4">
            {['subDistrict','district','state','country'].map(field => (
              <input
                key={field}
                readOnly
                value={form[field]}
                className="border px-3 py-2 rounded bg-gray-100"
              />
            ))}
          </div>

          <textarea
            value={form.message}
            onChange={e => setForm(f => ({...f, message: e.target.value}))}
            placeholder="Message"
            className="w-full border px-3 py-2 rounded"
          />

          <button
            disabled={!form.villageId}
            className={`w-full py-2 rounded text-white ${
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
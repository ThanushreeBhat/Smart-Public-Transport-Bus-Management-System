
import { useState } from 'react'
import { Plus, Search, Trash2, MapPin, Pencil } from 'lucide-react'

function RoutesPage() {
  const [routes, setRoutes] = useState([
    {
      id: 1,
      name: 'Mangalore - Udupi',
      source: 'Mangalore',
      destination: 'Udupi',
      stops: ['Surathkal', 'Mulki', 'Padubidri'],
    },
    {
      id: 2,
      name: 'Mangalore - Karkala',
      source: 'Mangalore',
      destination: 'Karkala',
      stops: ['Vamanjoor', 'Moodbidri', 'Nitte'],
    },
    {
      id: 3,
      name: 'Udupi - Kundapura',
      source: 'Udupi',
      destination: 'Kundapura',
      stops: ['Manipal', 'Brahmavar', 'Sasthana'],
    },
  ])

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    source: '',
    destination: '',
    stops: '',
  })

  const filteredRoutes = routes.filter((route) =>
    `${route.name} ${route.source} ${route.destination} ${route.stops.join(' ')}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const resetForm = () => {
    setForm({ name: '', source: '', destination: '', stops: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const saveRoute = (e) => {
    e.preventDefault()

    const name = form.name.trim()
    const source = form.source.trim()
    const destination = form.destination.trim()
    const stops = form.stops
      .split(',')
      .map((stop) => stop.trim())
      .filter(Boolean)
      if (!name || !source || !destination) {
  alert('Please fill in all route details.')
  return
}

if (name.length < 3) {
  alert('Route name must contain at least 3 characters.')
  return
}

    if (source.toLowerCase() === destination.toLowerCase()) {
      alert('Source and destination must be different.')
      return
    }
    const uniqueStops = new Set(
  stops.map((stop) => stop.toLowerCase())
)

if (uniqueStops.size !== stops.length) {
  alert('Duplicate intermediate stops are not allowed.')
  return
}

    if (stops.length === 0) {
      alert('Please enter at least one intermediate stop.')
      return
    }

    const duplicate = routes.some(
      (route) =>
        route.id !== editingId &&
        route.name.toLowerCase() === name.toLowerCase()
    )

    if (duplicate) {
      alert('This route name already exists.')
      return
    }

    const updatedRoute = { name, source, destination, stops }

    if (editingId !== null) {
      setRoutes((current) =>
        current.map((route) =>
          route.id === editingId ? { ...route, ...updatedRoute } : route
        )
      )
    } else {
      setRoutes((current) => [
        ...current,
        { id: Date.now(), ...updatedRoute },
      ])
    }

    resetForm()
  }

  const editRoute = (route) => {
    setForm({
      name: route.name,
      source: route.source,
      destination: route.destination,
      stops: route.stops.join(', '),
    })
    setEditingId(route.id)
    setShowForm(true)
  }

  const deleteRoute = (id) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      setRoutes((current) => current.filter((route) => route.id !== id))
      if (editingId === id) resetForm()
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Route Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage bus routes and their stops in travel order.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm()
            } else {
              setForm({ name: '', source: '', destination: '', stops: '' })
              setEditingId(null)
              setShowForm(true)
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> Add Route
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={saveRoute}
          className="bg-white p-6 rounded-xl shadow-sm mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            required
            placeholder="Route Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-3 rounded-lg"
          />

          <input
            required
            placeholder="Starting Point"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            className="border p-3 rounded-lg"
          />

          <input
            required
            placeholder="Destination"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            className="border p-3 rounded-lg"
          />

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Intermediate Stops
            </label>
            <textarea
              required
              rows="3"
              placeholder="Enter stops separated by commas: Surathkal, Mulki, Padubidri"
              value={form.stops}
              onChange={(e) => setForm({ ...form, stops: e.target.value })}
              className="border p-3 rounded-lg w-full"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter stops in the order the bus visits them. Do not include the
              starting point or destination here.
            </p>
          </div>

          <button className="bg-green-600 text-white rounded-lg p-3 md:col-span-2">
            {editingId !== null ? 'Update Route' : 'Save Route'}
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="border border-slate-300 rounded-lg p-3 md:col-span-2"
          >
            Cancel
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 mb-5 max-w-sm">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search routes or stops..."
            className="outline-none w-full text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="p-4">Route Name</th>
                <th className="p-4">Source</th>
                <th className="p-4">Destination</th>
                <th className="p-4">Intermediate Stops</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRoutes.map((route) => (
                <tr key={route.id} className="border-t text-sm">
                  <td className="p-4 font-medium">{route.name}</td>
                  <td className="p-4">
                    <span className="flex items-center gap-1">
                      <MapPin size={15} /> {route.source}
                    </span>
                  </td>
                  <td className="p-4">{route.destination}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {route.stops.map((stop, index) => (
                        <span
                          key={`${route.id}-${index}`}
                          className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs"
                        >
                          {index + 1}. {stop}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => editRoute(route)}
                        className="text-blue-600"
                        title="Edit route"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        onClick={() => deleteRoute(route.id)}
                        className="text-red-600"
                        title="Delete route"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRoutes.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-slate-500">
                    No routes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default RoutesPage


import { useState } from 'react'
import {
  Plus,
  Search,
  Trash2,
  CalendarDays,
  Pencil,
} from 'lucide-react'

function Trips() {
  const [trips, setTrips] = useState([
    {
      id: 1,
      bus: 'KA-19-1234',
      driver: 'Rahul Kumar',
      route: 'Mangalore - Udupi',
      date: '2026-11-02',
      startTime: '08:00',
      endTime: '10:30',
      status: 'Scheduled',
    },
    {
      id: 2,
      bus: 'KA-19-5678',
      driver: 'Arun Shetty',
      route: 'Mangalore - Karkala',
      date: '2026-11-02',
      startTime: '09:30',
      endTime: '12:00',
      status: 'Ongoing',
    },
  ])

  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)

  const emptyForm = {
    bus: '',
    driver: '',
    route: '',
    date: '',
    startTime: '',
    endTime: '',
  }

  const [form, setForm] = useState(emptyForm)

  const filteredTrips = trips.filter((trip) =>
    `${trip.bus} ${trip.driver} ${trip.route}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const saveTrip = (e) => {
    e.preventDefault()
    if (!form.bus || !form.driver || !form.route || !form.date) {
  alert('Please fill in all trip details.')
  return
}

const today = new Date().toLocaleDateString('en-CA')

if (form.date < today) {
  alert('You cannot schedule a trip in the past.')
  return
}

    if (form.endTime <= form.startTime) {
      alert('End time must be later than start time.')
      return
    }

    const busAlreadyScheduled = trips.some(
      (trip) =>
        trip.id !== editingId &&
        trip.bus === form.bus &&
        trip.date === form.date &&
        form.startTime < trip.endTime &&
        form.endTime > trip.startTime
    )

    if (busAlreadyScheduled) {
      alert('This bus already has an overlapping trip on this date.')
      return
    }

    const updatedTrip = {
      ...form,
      status: editingId !== null
        ? trips.find((trip) => trip.id === editingId).status
        : 'Scheduled',
    }

    if (editingId !== null) {
      setTrips((current) =>
        current.map((trip) =>
          trip.id === editingId
            ? { ...trip, ...updatedTrip }
            : trip
        )
      )
    } else {
      setTrips((current) => [
        ...current,
        { id: Date.now(), ...updatedTrip },
      ])
    }

    resetForm()
  }

  const editTrip = (trip) => {
    setForm({
      bus: trip.bus,
      driver: trip.driver,
      route: trip.route,
      date: trip.date,
      startTime: trip.startTime,
      endTime: trip.endTime,
    })
    setEditingId(trip.id)
    setShowForm(true)
  }

  const deleteTrip = (id) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      setTrips((current) => current.filter((trip) => trip.id !== id))
      if (editingId === id) resetForm()
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Trip Management
          </h1>
          <p className="text-slate-500 mt-1">
            Schedule and manage bus trips.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm()
            } else {
              setForm(emptyForm)
              setEditingId(null)
              setShowForm(true)
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} />
          Schedule Trip
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={saveTrip}
          className="bg-white p-6 rounded-xl shadow-sm mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <select
            required
            value={form.bus}
            onChange={(e) => setForm({ ...form, bus: e.target.value })}
            className="border p-3 rounded-lg"
          >
            <option value="">Select Bus</option>
            <option value="KA-19-1234">KA-19-1234</option>
            <option value="KA-19-5678">KA-19-5678</option>
            <option value="KA-19-9012">KA-19-9012</option>
          </select>

          <select
            required
            value={form.driver}
            onChange={(e) => setForm({ ...form, driver: e.target.value })}
            className="border p-3 rounded-lg"
          >
            <option value="">Select Driver</option>
            <option value="Rahul Kumar">Rahul Kumar</option>
            <option value="Arun Shetty">Arun Shetty</option>
            <option value="Vijay Rao">Vijay Rao</option>
          </select>

          <select
            required
            value={form.route}
            onChange={(e) => setForm({ ...form, route: e.target.value })}
            className="border p-3 rounded-lg"
          >
            <option value="">Select Route</option>
            <option value="Mangalore - Udupi">Mangalore - Udupi</option>
            <option value="Mangalore - Karkala">Mangalore - Karkala</option>
            <option value="Udupi - Kundapura">Udupi - Kundapura</option>
          </select>

          <input
            required
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="border p-3 rounded-lg"
          />

          <div>
            <label className="block text-sm text-slate-600 mb-1">
              Start Time
            </label>
            <input
              required
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="border p-3 rounded-lg w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">
              End Time
            </label>
            <input
              required
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="border p-3 rounded-lg w-full"
            />
          </div>

          <button className="bg-green-600 text-white rounded-lg p-3 md:col-span-2">
            {editingId !== null ? 'Update Trip' : 'Save Trip'}
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
            placeholder="Search trips..."
            className="outline-none w-full text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="p-4">Bus</th>
                <th className="p-4">Driver</th>
                <th className="p-4">Route</th>
                <th className="p-4">Date</th>
                <th className="p-4">Start</th>
                <th className="p-4">End</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTrips.map((trip) => (
                <tr key={trip.id} className="border-t text-sm">
                  <td className="p-4 font-medium">{trip.bus}</td>
                  <td className="p-4">{trip.driver}</td>
                  <td className="p-4">{trip.route}</td>
                  <td className="p-4">{trip.date}</td>
                  <td className="p-4">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={15} />
                      {trip.startTime}
                    </span>
                  </td>
                  <td className="p-4">{trip.endTime}</td>
                  <td className="p-4">{trip.status}</td>
                  <td className="p-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => editTrip(trip)}
                        className="text-blue-600"
                        title="Edit trip"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        onClick={() => deleteTrip(trip.id)}
                        className="text-red-600"
                        title="Delete trip"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTrips.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-slate-500">
                    No trips found.
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

export default Trips

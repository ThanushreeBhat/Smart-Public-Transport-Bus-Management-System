import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Trash2,
  CalendarDays,
  Pencil,
} from 'lucide-react'
import { getTrips, addTrip, updateTrip as apiUpdateTrip, deleteTrip as apiDeleteTrip } from '../services/tripService'
import { getBuses } from '../services/busService'
import { getDrivers } from '../services/driverService'
import { getRoutes } from '../services/routeService'

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

  const [availableBuses, setAvailableBuses] = useState(['KA-19-1234', 'KA-19-5678', 'KA-19-9012'])
  const [availableDrivers, setAvailableDrivers] = useState(['Rahul Kumar', 'Arun Shetty', 'Vijay Rao'])
  const [availableRoutes, setAvailableRoutes] = useState(['Mangalore - Udupi', 'Mangalore - Karkala', 'Udupi - Kundapura'])

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

  const loadTrips = () => {
    getTrips()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTrips(data)
        }
      })
      .catch((err) => console.warn('Using local trips state:', err.message))
  }

  useEffect(() => {
    loadTrips()

    // Populate dropdown options dynamically from database
    getBuses()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const numbers = data.map((b) => b.number || b.bus_number).filter(Boolean)
          setAvailableBuses(Array.from(new Set([...numbers, 'KA-19-1234', 'KA-19-5678', 'KA-19-9012'])))
        }
      })
      .catch(() => {})

    getDrivers()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const names = data.map((d) => d.name).filter(Boolean)
          setAvailableDrivers(Array.from(new Set([...names, 'Rahul Kumar', 'Arun Shetty', 'Vijay Rao'])))
        }
      })
      .catch(() => {})

    getRoutes()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const rNames = data.map((r) => r.name || r.route_name).filter(Boolean)
          setAvailableRoutes(Array.from(new Set([...rNames, 'Mangalore - Udupi', 'Mangalore - Karkala', 'Udupi - Kundapura'])))
        }
      })
      .catch(() => {})
  }, [])

  const filteredTrips = trips.filter((trip) =>
    `${trip.bus || trip.bus_number || ''} ${trip.driver || trip.driver_name || ''} ${trip.route || trip.route_name || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const saveTrip = async (e) => {
    e.preventDefault()
    if (!form.bus || !form.driver || !form.route || !form.date) {
      alert('Please fill in all trip details.')
      return
    }

    if (form.endTime && form.startTime && form.endTime <= form.startTime) {
      alert('End time must be later than start time.')
      return
    }

    const busAlreadyScheduled = trips.some(
      (trip) =>
        (trip.id || trip.trip_id) !== editingId &&
        (trip.bus || trip.bus_number) === form.bus &&
        (trip.date || trip.trip_date) === form.date &&
        form.startTime < (trip.endTime || trip.end_time) &&
        (form.endTime ? form.endTime > (trip.startTime || trip.start_time) : true)
    )

    if (busAlreadyScheduled) {
      alert('This bus already has an overlapping trip on this date.')
      return
    }

    const updatedTrip = {
      ...form,
      status: editingId !== null
        ? (trips.find((trip) => (trip.id || trip.trip_id) === editingId)?.status || 'Scheduled')
        : 'Scheduled',
    }

    try {
      if (editingId !== null) {
        await apiUpdateTrip(editingId, {
          bus: form.bus,
          driver: form.driver,
          route: form.route,
          trip_date: form.date,
          start_time: form.startTime,
          end_time: form.endTime,
          status: updatedTrip.status
        })
      } else {
        await addTrip({
          bus: form.bus,
          driver: form.driver,
          route: form.route,
          trip_date: form.date,
          start_time: form.startTime,
          end_time: form.endTime,
          status: 'Scheduled'
        })
      }
      loadTrips()
    } catch (err) {
      console.warn('API error saving trip, updating local state:', err.message)
      if (editingId !== null) {
        setTrips((current) =>
          current.map((trip) =>
            (trip.id || trip.trip_id) === editingId
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
    }

    resetForm()
  }

  const editTrip = (trip) => {
    setForm({
      bus: trip.bus || trip.bus_number || '',
      driver: trip.driver || trip.driver_name || '',
      route: trip.route || trip.route_name || '',
      date: trip.date || trip.trip_date || '',
      startTime: trip.startTime || (trip.start_time ? trip.start_time.substring(0, 5) : ''),
      endTime: trip.endTime || (trip.end_time ? trip.end_time.substring(0, 5) : ''),
    })
    setEditingId(trip.id || trip.trip_id)
    setShowForm(true)
  }

  const deleteTrip = async (id) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await apiDeleteTrip(id)
        loadTrips()
      } catch (err) {
        const msg = err.response?.data?.message || err.message
        alert(`Delete failed: ${msg}`)
        setTrips((current) => current.filter((trip) => (trip.id || trip.trip_id) !== id))
      }
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
            {availableBuses.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            required
            value={form.driver}
            onChange={(e) => setForm({ ...form, driver: e.target.value })}
            className="border p-3 rounded-lg"
          >
            <option value="">Select Driver</option>
            {availableDrivers.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            required
            value={form.route}
            onChange={(e) => setForm({ ...form, route: e.target.value })}
            className="border p-3 rounded-lg"
          >
            <option value="">Select Route</option>
            {availableRoutes.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
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
                <tr key={trip.id || trip.trip_id} className="border-t text-sm">
                  <td className="p-4 font-medium">{trip.bus || trip.bus_number}</td>
                  <td className="p-4">{trip.driver || trip.driver_name}</td>
                  <td className="p-4">{trip.route || trip.route_name}</td>
                  <td className="p-4">{trip.date || trip.trip_date}</td>
                  <td className="p-4">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={15} />
                      {trip.startTime || (trip.start_time ? trip.start_time.substring(0, 5) : '')}
                    </span>
                  </td>
                  <td className="p-4">{trip.endTime || (trip.end_time ? trip.end_time.substring(0, 5) : '')}</td>
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
                        onClick={() => deleteTrip(trip.id || trip.trip_id)}
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

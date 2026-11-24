import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { getBuses, addBus, updateBus as apiUpdateBus, deleteBus as apiDeleteBus } from '../services/busService'

function Buses() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [buses, setBuses] = useState([
    { id: 1, number: 'KA-19-1234', capacity: 50, type: 'Standard', status: 'Active' },
    { id: 2, number: 'KA-19-5678', capacity: 40, type: 'Mini Bus', status: 'Active' },
    { id: 3, number: 'KA-19-9012', capacity: 55, type: 'Standard', status: 'Inactive' },
  ])

  const [form, setForm] = useState({
    number: '',
    capacity: '',
    type: 'Standard',
  })

  const loadBuses = () => {
    getBuses()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBuses(data)
        }
      })
      .catch((err) => {
        console.warn('Using local buses state:', err.message)
      })
  }

  useEffect(() => {
    loadBuses()
  }, [])

  const filteredBuses = buses.filter((bus) =>
    (bus.number || bus.bus_number || '').toLowerCase().includes(search.toLowerCase())
  )

  const resetForm = () => {
    setForm({ number: '', capacity: '', type: 'Standard' })
    setEditingId(null)
    setShowForm(false)
  }

  const saveBus = async (e) => {
    e.preventDefault()
    if (!form.number.trim()) {
      alert('Please enter a bus number.')
      return
    }

    if (!form.capacity || Number(form.capacity) < 1) {
      alert('Please enter a valid seating capacity.')
      return
    }

    const duplicate = buses.some(
      (bus) =>
        (bus.number || bus.bus_number || '').toLowerCase() === form.number.trim().toLowerCase() &&
        (bus.id || bus.bus_id) !== editingId
    )

    if (duplicate) {
      alert('This bus number already exists.')
      return
    }

    try {
      if (editingId !== null) {
        await apiUpdateBus(editingId, {
          bus_number: form.number.trim(),
          capacity: Number(form.capacity),
          bus_type: form.type
        })
      } else {
        await addBus({
          bus_number: form.number.trim(),
          capacity: Number(form.capacity),
          bus_type: form.type,
          status: 'Active'
        })
      }
      loadBuses()
    } catch (err) {
      console.warn('API error during bus save, updating local state:', err.message)
      if (editingId !== null) {
        setBuses(buses.map((bus) =>
          (bus.id || bus.bus_id) === editingId
            ? { ...bus, ...form, number: form.number.trim(), capacity: Number(form.capacity) }
            : bus
        ))
      } else {
        setBuses([
          ...buses,
          {
            id: Date.now(),
            ...form,
            number: form.number.trim(),
            capacity: Number(form.capacity),
            status: 'Active',
          },
        ])
      }
    }

    resetForm()
  }

  const editBus = (bus) => {
    setForm({
      number: bus.number || bus.bus_number || '',
      capacity: String(bus.capacity),
      type: bus.type || bus.bus_type || 'Standard',
    })
    setEditingId(bus.id || bus.bus_id)
    setShowForm(true)
  }

  const deleteBus = async (id) => {
    if (window.confirm('Are you sure you want to delete this bus?')) {
      try {
        await apiDeleteBus(id)
        loadBuses()
      } catch (err) {
        const msg = err.response?.data?.message || err.message
        alert(`Delete failed: ${msg}`)
        setBuses(buses.filter((bus) => (bus.id || bus.bus_id) !== id))
      }
      if (editingId === id) resetForm()
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bus Management</h1>
          <p className="text-slate-500 mt-1">Manage your transport fleet.</p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm()
            } else {
              setEditingId(null)
              setForm({ number: '', capacity: '', type: 'Standard' })
              setShowForm(true)
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> Add Bus
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveBus} className="bg-white p-6 rounded-xl shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            required
            placeholder="Bus Number"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            className="border p-3 rounded-lg"
          />

          <input
            required
            type="number"
            min="1"
            placeholder="Seating Capacity"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            className="border p-3 rounded-lg"
          />

          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="border p-3 rounded-lg"
          >
            <option>Standard</option>
            <option>Mini Bus</option>
            <option>Express</option>
          </select>

          <button className="bg-green-600 text-white rounded-lg p-3 md:col-span-3">
            {editingId !== null ? 'Update Bus' : 'Save Bus'}
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="border border-slate-300 rounded-lg p-3 md:col-span-3"
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
            placeholder="Search bus number..."
            className="outline-none w-full text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="p-4">Bus Number</th>
                <th className="p-4">Capacity</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredBuses.map((bus) => (
                <tr key={bus.id || bus.bus_id} className="border-t text-sm">
                  <td className="p-4 font-medium">{bus.number || bus.bus_number}</td>
                  <td className="p-4">{bus.capacity}</td>
                  <td className="p-4">{bus.type || bus.bus_type}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      bus.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {bus.status}
                    </span>
                  </td>
                  <td className="p-4 flex gap-3">
                    <button
                      onClick={() => editBus(bus)}
                      className="text-blue-600"
                      title="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => deleteBus(bus.id || bus.bus_id)}
                      className="text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredBuses.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-slate-500">
                    No buses found.
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

export default Buses

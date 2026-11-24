import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { getDrivers, addDriver, updateDriver as apiUpdateDriver, deleteDriver as apiDeleteDriver } from '../services/driverService'

function Drivers() {
  const [drivers, setDrivers] = useState([
    { id: 1, name: 'Rahul Kumar', phone: '9876543210', license: 'DL12345', status: 'Active' },
    { id: 2, name: 'Arun Shetty', phone: '9876543211', license: 'DL12346', status: 'Active' },
    { id: 3, name: 'Vijay Rao', phone: '9876543212', license: 'DL12347', status: 'Inactive' },
  ])

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    license: '',
  })

  const loadDrivers = () => {
    getDrivers()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDrivers(data)
        }
      })
      .catch((err) => {
        console.warn('Using local drivers state:', err.message)
      })
  }

  useEffect(() => {
    loadDrivers()
  }, [])

  const filteredDrivers = drivers.filter((driver) =>
    (driver.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const resetForm = () => {
    setForm({ name: '', phone: '', license: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const saveDriver = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      alert('Please enter the driver name.')
      return
    }

    if (!/^[0-9+ -]{7,15}$/.test(form.phone.trim())) {
      alert('Please enter a valid phone number.')
      return
    }

    if (!form.license.trim()) {
      alert('Please enter the driving licence number.')
      return
    }

    const duplicate = drivers.some(
      (driver) =>
        (driver.id || driver.driver_id) !== editingId &&
        (
          driver.phone === form.phone.trim() ||
          (driver.license || driver.license_no || '').toLowerCase() === form.license.trim().toLowerCase()
        )
    )

    if (duplicate) {
      alert('Phone number or driving licence already exists.')
      return
    }

    try {
      if (editingId !== null) {
        await apiUpdateDriver(editingId, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          license_no: form.license.trim()
        })
      } else {
        await addDriver({
          name: form.name.trim(),
          phone: form.phone.trim(),
          license_no: form.license.trim(),
          status: 'Active'
        })
      }
      loadDrivers()
    } catch (err) {
      console.warn('API error during driver save, updating local state:', err.message)
      if (editingId !== null) {
        setDrivers(drivers.map((driver) =>
          (driver.id || driver.driver_id) === editingId
            ? { ...driver, ...form, name: form.name.trim(), license: form.license.trim() }
            : driver
        ))
      } else {
        setDrivers([
          ...drivers,
          {
            id: Date.now(),
            ...form,
            name: form.name.trim(),
            license: form.license.trim(),
            status: 'Active',
          },
        ])
      }
    }

    resetForm()
  }

  const editDriver = (driver) => {
    setForm({
      name: driver.name || '',
      phone: driver.phone || '',
      license: driver.license || driver.license_no || '',
    })
    setEditingId(driver.id || driver.driver_id)
    setShowForm(true)
  }

  const deleteDriver = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await apiDeleteDriver(id)
        loadDrivers()
      } catch (err) {
        const msg = err.response?.data?.message || err.message
        alert(`Delete failed: ${msg}`)
        setDrivers(drivers.filter((driver) => (driver.id || driver.driver_id) !== id))
      }
      if (editingId === id) resetForm()
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Driver Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage bus driver information.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm()
            } else {
              setForm({ name: '', phone: '', license: '' })
              setEditingId(null)
              setShowForm(true)
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> Add Driver
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={saveDriver}
          className="bg-white p-6 rounded-xl shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <input
            required
            placeholder="Driver Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-3 rounded-lg"
          />

          <input
            required
            type="tel"
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="border p-3 rounded-lg"
          />

          <input
            required
            placeholder="Driving License Number"
            value={form.license}
            onChange={(e) => setForm({ ...form, license: e.target.value })}
            className="border p-3 rounded-lg"
          />

          <button className="bg-green-600 text-white rounded-lg p-3 md:col-span-3">
            {editingId !== null ? 'Update Driver' : 'Save Driver'}
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
            placeholder="Search driver..."
            className="outline-none w-full text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="p-4">Driver Name</th>
                <th className="p-4">Phone</th>
                <th className="p-4">License Number</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredDrivers.map((driver) => (
                <tr key={driver.id || driver.driver_id} className="border-t text-sm">
                  <td className="p-4 font-medium">{driver.name}</td>
                  <td className="p-4">{driver.phone}</td>
                  <td className="p-4">{driver.license || driver.license_no}</td>
                  <td className="p-4">{driver.status}</td>
                  <td className="p-4 flex gap-3">
                    <button
                      onClick={() => editDriver(driver)}
                      className="text-blue-600"
                      title="Edit driver"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() => deleteDriver(driver.id || driver.driver_id)}
                      className="text-red-600"
                      title="Delete driver"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredDrivers.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-slate-500">
                    No drivers found.
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

export default Drivers

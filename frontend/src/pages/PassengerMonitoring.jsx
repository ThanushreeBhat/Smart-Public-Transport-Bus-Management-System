
import { useState } from 'react'
import { AlertTriangle, ShieldCheck } from 'lucide-react'

function PassengerMonitoring() {
  const [passengerCount, setPassengerCount] = useState('')
  const [selectedTrip, setSelectedTrip] = useState('KA-19-1234')
  const [records, setRecords] = useState([
    {
      id: 1,
      bus: 'KA-19-1234',
      count: 42,
      capacity: 50,
      status: 'Normal',
    },
    {
      id: 2,
      bus: 'KA-19-5678',
      count: 53,
      capacity: 50,
      status: 'Overcrowded',
    },
  ])

  const busCapacity = 50

  const occupancy = passengerCount
    ? (Number(passengerCount) / busCapacity) * 100
    : 0

  const isOvercrowded = Number(passengerCount) > busCapacity

  const handleSubmit = (e) => {
    e.preventDefault()

    if (
      passengerCount === '' ||
      !Number.isInteger(Number(passengerCount)) ||
      Number(passengerCount) < 0
    ) {
      alert('Please enter a valid whole number of passengers.')
      return
    }

    const newRecord = {
      id: Date.now(),
      bus: selectedTrip,
      count: Number(passengerCount),
      capacity: busCapacity,
      status: isOvercrowded ? 'Overcrowded' : 'Normal',
    }

    setRecords((previousRecords) => [
      newRecord,
      ...previousRecords,
    ])

    setPassengerCount('')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Passenger Monitoring
        </h1>
        <p className="text-slate-500 mt-1">
          Monitor passenger occupancy and bus safety.
        </p>
      </div>

      {/* Passenger Entry Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6"
      >
        <h2 className="font-semibold text-lg mb-5">
          Record Passenger Count
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-2 text-slate-600">
              Select Bus
            </label>

            <select
              value={selectedTrip}
              onChange={(e) => setSelectedTrip(e.target.value)}
              className="w-full border p-3 rounded-lg"
            >
              <option value="KA-19-1234">KA-19-1234</option>
              <option value="KA-19-5678">KA-19-5678</option>
              <option value="KA-19-9012">KA-19-9012</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-600">
              Current Passenger Count
            </label>

            <input
              type="number"
              min="0"
              step="1"
              required
              value={passengerCount}
              onChange={(e) => setPassengerCount(e.target.value)}
              placeholder="Enter passenger count"
              className="w-full border p-3 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-600">
              Bus Capacity
            </label>

            <input
              value={busCapacity}
              readOnly
              className="w-full border p-3 rounded-lg bg-slate-100"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-5 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Record Passenger Count
        </button>
      </form>

      {/* Occupancy Display */}
      {passengerCount !== '' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">
            Occupancy Status
          </h2>

          <div className="flex justify-between mb-2">
            <span className="text-slate-600">
              {passengerCount} / {busCapacity} passengers
            </span>

            <span className="font-bold">
              {occupancy.toFixed(1)}%
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full ${
                isOvercrowded ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(occupancy, 100)}%` }}
            />
          </div>

          {isOvercrowded ? (
            <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-lg flex gap-3">
              <AlertTriangle />
              <div>
                <p className="font-bold">Overcrowding Detected!</p>
                <p className="text-sm">
                  Passenger count exceeds the bus capacity.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 bg-green-50 text-green-700 p-4 rounded-lg flex gap-3">
              <ShieldCheck />
              <p className="font-semibold">
                Occupancy Within Capacity
              </p>
            </div>
          )}
        </div>
      )}

      {/* Passenger Records */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="font-semibold text-lg mb-4">
          Passenger Records
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="p-4">Bus Number</th>
                <th className="p-4">Passengers</th>
                <th className="p-4">Capacity</th>
                <th className="p-4">Occupancy</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-6 text-center text-slate-500"
                  >
                    No passenger records available yet.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="border-t text-sm">
                    <td className="p-4 font-medium">
                      {record.bus}
                    </td>
                    <td className="p-4">{record.count}</td>
                    <td className="p-4">{record.capacity}</td>
                    <td className="p-4">
                      {(
                        (record.count / record.capacity) *
                        100
                      ).toFixed(1)}%
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          record.status === 'Overcrowded'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PassengerMonitoring

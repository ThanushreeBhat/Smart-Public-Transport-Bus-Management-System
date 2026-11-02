import { useState } from 'react'
import { Download } from 'lucide-react'

function TripReport() {
  const [selectedTrip, setSelectedTrip] = useState('TRIP-001')

  const reports = {
    'TRIP-001': {
      bus: 'KA-19-1234',
      route: 'Mysuru - Bengaluru',
      capacity: 50,
      maxPassengers: 53,
      incidents: 1,
    },
    'TRIP-002': {
      bus: 'KA-19-5678',
      route: 'Mysuru - Mandya',
      capacity: 60,
      maxPassengers: 42,
      incidents: 0,
    },
    'TRIP-003': {
      bus: 'KA-19-9012',
      route: 'Mysuru - Hassan',
      capacity: 50,
      maxPassengers: 48,
      incidents: 0,
    },
  }

  const report = reports[selectedTrip]
  const occupancy = Math.round(
    (report.maxPassengers / report.capacity) * 100
  )
  const downloadReport = () => {
  const csv = [
    ['Field', 'Details'],
    ['Trip ID', selectedTrip],
    ['Bus Number', report.bus],
    ['Route', report.route],
    ['Bus Capacity', report.capacity],
    ['Maximum Passengers', report.maxPassengers],
    ['Occupancy', `${occupancy}%`],
    ['Safety Incidents', report.incidents],
    ['Status', occupancy > 100 ? 'Overcrowded' : 'Normal'],
  ]
    .map((row) => row.join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${selectedTrip}-report.csv`
  link.click()

  URL.revokeObjectURL(url)
}

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Trip Reports
          </h1>
          <p className="text-slate-500 mt-1">
            View passenger occupancy and safety reports.
          </p>
        </div>
        <button
  onClick={downloadReport}
  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
>
  <Download size={18} />
  Download CSV
</button>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm mb-6">
        <label className="block font-medium mb-2">
          Select Trip
        </label>

        <select
          value={selectedTrip}
          onChange={(e) => setSelectedTrip(e.target.value)}
          className="border border-slate-300 rounded-lg p-3 w-full md:w-80"
        >
          <option value="TRIP-001">TRIP-001</option>
          <option value="TRIP-002">TRIP-002</option>
          <option value="TRIP-003">TRIP-003</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <p className="text-slate-500 text-sm">Bus Number</p>
          <h2 className="text-xl font-bold mt-2">{report.bus}</h2>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm">
          <p className="text-slate-500 text-sm">Route</p>
          <h2 className="text-lg font-bold mt-2">{report.route}</h2>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm">
          <p className="text-slate-500 text-sm">Maximum Passengers</p>
          <h2 className="text-2xl font-bold mt-2">
            {report.maxPassengers}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm">
          <p className="text-slate-500 text-sm">Safety Incidents</p>
          <h2 className="text-2xl font-bold mt-2">
            {report.incidents}
          </h2>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="font-bold text-lg mb-4">
          Passenger Occupancy
        </h2>

        <div className="flex justify-between mb-2">
          <span>Occupancy Rate</span>
          <span className="font-bold">{occupancy}%</span>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full ${
              occupancy > 100 ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(occupancy, 100)}%` }}
          />
        </div>

        <p className={`mt-4 font-semibold ${
          occupancy > 100 ? 'text-red-600' : 'text-green-600'
        }`}>
          {occupancy > 100 ? 'Overcrowding Detected' : 'Normal Occupancy'}
        </p>

        <p className="text-sm text-slate-500 mt-2">
          Bus Capacity: {report.capacity} passengers
        </p>
      </div>
    </div>
  )
}

export default TripReport
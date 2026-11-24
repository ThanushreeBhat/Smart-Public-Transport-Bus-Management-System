import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { getTripReport } from '../services/reportService'
import { getTrips } from '../services/tripService'

function TripReport() {
  const [selectedTrip, setSelectedTrip] = useState('TRIP-001')
  const [availableTripOptions, setAvailableTripOptions] = useState([
    { id: 'TRIP-001', label: 'TRIP-001' },
    { id: 'TRIP-002', label: 'TRIP-002' },
    { id: 'TRIP-003', label: 'TRIP-003' },
  ])

  const [reports, setReports] = useState({
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
  })

  // Load available trips for dropdown
  useEffect(() => {
    getTrips()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const options = data.map((t) => {
            const code = `TRIP-${String(t.id || t.trip_id).padStart(3, '0')}`
            return {
              id: code,
              tripId: t.id || t.trip_id,
              label: `${code} (${t.bus || t.bus_number} - ${t.route || t.route_name})`
            }
          })
          setAvailableTripOptions(options)
          if (options.length > 0) {
            setSelectedTrip(options[0].id)
          }
        }
      })
      .catch(() => {})
  }, [])

  // When selectedTrip changes, fetch from MySQL Stored Procedure
  useEffect(() => {
    getTripReport(selectedTrip)
      .then((data) => {
        if (data && (data.bus || data.bus_number)) {
          setReports((prev) => ({
            ...prev,
            [selectedTrip]: {
              bus: data.bus || data.bus_number,
              route: data.route || data.route_name,
              capacity: Number(data.capacity || data.bus_capacity || 50),
              maxPassengers: Number(data.maxPassengers || data.maximum_passengers || 0),
              incidents: Number(data.incidents || data.total_safety_incidents || 0),
            }
          }))
        }
      })
      .catch((err) => {
        console.warn('Using local report data fallback:', err.message)
      })
  }, [selectedTrip])

  const report = reports[selectedTrip] || {
    bus: 'KA-19-1234',
    route: 'Mangaluru Transit',
    capacity: 50,
    maxPassengers: 0,
    incidents: 0,
  }

  const occupancy = report.capacity > 0
    ? Math.round((report.maxPassengers / report.capacity) * 100)
    : 0

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
          {availableTripOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
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

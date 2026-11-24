import { useState, useEffect } from 'react'
import {
  Bus,
  CalendarDays,
  AlertTriangle,
  ShieldCheck,
  Users,
  FileBarChart,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getDashboardData } from '../services/dashboardService'

const initialStats = [
  {
    title: 'Total Buses',
    value: '25',
    icon: Bus,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: "Today's Trips",
    value: '48',
    icon: CalendarDays,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Overcrowded Trips',
    value: '06',
    icon: AlertTriangle,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    title: 'Open Incidents',
    value: '03',
    icon: ShieldCheck,
    color: 'bg-red-100 text-red-600',
  },
]

const quickLinks = [
  {
    title: 'Manage Buses',
    description: 'View and manage bus details',
    icon: Bus,
    path: '/buses',
  },
  {
    title: 'Monitor Passengers',
    description: 'Check passenger occupancy',
    icon: Users,
    path: '/passengers',
  },
  {
    title: 'Safety Incidents',
    description: 'Review and resolve incidents',
    icon: AlertTriangle,
    path: '/incidents',
  },
  {
    title: 'Trip Reports',
    description: 'View trip safety reports',
    icon: FileBarChart,
    path: '/reports',
  },
]

function Dashboard() {
  const [stats, setStats] = useState(initialStats)
  const [recentTrips, setRecentTrips] = useState([
    { bus: 'KA-19-1234', route: 'Mangalore - Udupi', status: 'Completed' },
    { bus: 'KA-19-5678', route: 'Mangalore - Karkala', status: 'Ongoing' },
    { bus: 'KA-19-9012', route: 'Udupi - Kundapura', status: 'Scheduled' },
  ])
  const [safetyAlerts, setSafetyAlerts] = useState([
    {
      type: 'Overcrowding Detected',
      message: 'Bus KA-19-1234 — Passenger count: 53 / 50',
      isOvercrowding: true
    },
    {
      type: 'Safety Incident Reported',
      message: 'Bus KA-19-5678 — Incident under investigation',
      isOvercrowding: false
    }
  ])

  useEffect(() => {
    let isMounted = true
    getDashboardData()
      .then((data) => {
        if (!isMounted || !data) return

        if (Array.isArray(data.stats)) {
          setStats((prev) =>
            prev.map((item) => {
              const matched = data.stats.find((s) => s.title === item.title)
              return matched ? { ...item, value: matched.value } : item
            })
          )
        } else {
          setStats((prev) =>
            prev.map((item) => {
              if (item.title === 'Total Buses' && data.total_buses !== undefined) {
                return { ...item, value: String(data.total_buses).padStart(2, '0') }
              }
              if (item.title === "Today's Trips" && (data.todays_trips !== undefined || data["today's_trips"] !== undefined)) {
                return { ...item, value: String(data.todays_trips || data["today's_trips"]).padStart(2, '0') }
              }
              if (item.title === 'Overcrowded Trips' && data.overcrowded_trips !== undefined) {
                return { ...item, value: String(data.overcrowded_trips).padStart(2, '0') }
              }
              if (item.title === 'Open Incidents' && data.open_incidents !== undefined) {
                return { ...item, value: String(data.open_incidents).padStart(2, '0') }
              }
              return item
            })
          )
        }

        if (Array.isArray(data.recent_trips) && data.recent_trips.length > 0) {
          setRecentTrips(data.recent_trips)
        }

        if (Array.isArray(data.recent_unresolved_alerts) && data.recent_unresolved_alerts.length > 0) {
          setSafetyAlerts(
            data.recent_unresolved_alerts.map((alert) => ({
              type: alert.incident_type === 'Overcrowding' ? 'Overcrowding Detected' : 'Safety Incident Reported',
              message: `${alert.bus_number || 'Bus'} — ${alert.description || 'Incident reported'}`,
              isOvercrowding: alert.incident_type === 'Overcrowding'
            }))
          )
        }
      })
      .catch((err) => {
        console.warn('Dashboard live fetch fallback to local state:', err.message)
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Dashboard Overview
        </h1>
        <p className="text-slate-500 mt-1">
          Monitor bus operations and passenger safety.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {item.title}
                  </p>
                  <h2 className="text-3xl font-bold text-slate-800 mt-2">
                    {item.value}
                  </h2>
                </div>

                <div className={`p-3 rounded-lg ${item.color}`}>
                  <Icon size={25} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Navigation */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          Quick Access
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {quickLinks.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.title}
                to={item.path}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition"
              >
                <div className="flex justify-between items-center">
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                    <Icon size={22} />
                  </div>
                  <ArrowRight size={18} className="text-slate-400" />
                </div>

                <h3 className="font-semibold text-slate-800 mt-4">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {item.description}
                </p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Trips and Safety Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

        {/* Recent Trips */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Recent Trips
          </h2>

          <div className="space-y-4">
            {recentTrips.map((trip, idx) => (
              <div
                key={`${trip.bus}-${idx}`}
                className="flex justify-between items-center border-b pb-3"
              >
                <div>
                  <p className="font-medium text-slate-800">
                    {trip.bus}
                  </p>
                  <p className="text-sm text-slate-500">
                    {trip.route}
                  </p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  {trip.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Alerts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Safety Alerts
          </h2>

          <div className="space-y-4">
            {safetyAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`${alert.isOvercrowding ? 'bg-red-50' : 'bg-orange-50'} p-4 rounded-lg`}
              >
                <p className={`font-semibold ${alert.isOvercrowding ? 'text-red-700' : 'text-orange-700'}`}>
                  {alert.type}
                </p>
                <p className="text-sm text-slate-600">
                  {alert.message}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard

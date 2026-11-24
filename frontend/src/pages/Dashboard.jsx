
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

const stats = [
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
            {[
              { bus: 'KA-19-1234', route: 'Mangalore - Udupi', status: 'Completed' },
              { bus: 'KA-19-5678', route: 'Mangalore - Karkala', status: 'Ongoing' },
              { bus: 'KA-19-9012', route: 'Udupi - Kundapura', status: 'Scheduled' },
            ].map((trip) => (
              <div
                key={trip.bus}
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
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="font-semibold text-red-700">
                Overcrowding Detected
              </p>
              <p className="text-sm text-slate-600">
                Bus KA-19-1234 — Passenger count: 53 / 50
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="font-semibold text-orange-700">
                Safety Incident Reported
              </p>
              <p className="text-sm text-slate-600">
                Bus KA-19-5678 — Incident under investigation
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard

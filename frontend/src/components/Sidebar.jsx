import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Bus,
  Users,
  Map,
  CalendarDays,
  ShieldAlert,
  FileBarChart,
  UserRound,
} from 'lucide-react'

const menuItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Buses', path: '/buses', icon: Bus },
  { name: 'Drivers', path: '/drivers', icon: Users },
  { name: 'Routes', path: '/routes', icon: Map },
  { name: 'Trips', path: '/trips', icon: CalendarDays },
  { name: 'Passenger Monitoring', path: '/passengers', icon: UserRound },
  { name: 'Safety Incidents', path: '/incidents', icon: ShieldAlert },
  { name: 'Reports', path: '/reports', icon: FileBarChart },
]

function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white p-5">
      <h1 className="text-xl font-bold mb-2">
        SmartBus
      </h1>

      <p className="text-xs text-slate-400 mb-8">
        Transport Safety System
      </p>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
import { Bell, Search, UserCircle } from 'lucide-react'

function Navbar() {
  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">

      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Smart Transport Management
        </h2>
        <p className="text-sm text-slate-500">
          Bus Overcrowding & Passenger Safety
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2">
          <Search size={18} className="text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none px-2 text-sm w-32"
          />
        </div>

        <button className="relative text-slate-600">
          <Bell size={22} />
        </button>

        <div className="flex items-center gap-2 text-slate-700">
          <UserCircle size={28} />
          <span className="text-sm font-medium">Admin</span>
        </div>
      </div>

    </header>
  )
}

export default Navbar
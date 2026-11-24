import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="p-8 flex-1">
          {children}
        </main>

      </div>
    </div>
  )
}

export default DashboardLayout
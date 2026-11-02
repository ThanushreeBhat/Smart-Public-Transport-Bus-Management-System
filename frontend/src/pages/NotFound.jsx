import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-slate-800">404</h1>

      <p className="mt-3 text-lg text-slate-600">
        Oops! The page you're looking for doesn't exist.
      </p>

      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
      >
        <Home size={18} />
        Back to Dashboard
      </Link>
    </div>
  )
}

export default NotFound
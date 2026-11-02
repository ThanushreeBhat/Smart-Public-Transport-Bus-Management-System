import { Routes, Route } from 'react-router-dom'

import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Buses from './pages/Buses'
import Drivers from './pages/Drivers'
import RoutesPage from './pages/Routes'
import Trips from './pages/Trips'
import PassengerMonitoring from './pages/PassengerMonitoring'
import SafetyIncidents from './pages/SafetyIncidents'
import TripReport from './pages/TripReport'
import NotFound from './pages/NotFound'

function App() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/buses" element={<Buses />} />
        <Route path="/drivers" element={<Drivers />}/>
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/trips" element={<Trips />} />
        <Route
  path="/passengers"
  element={<PassengerMonitoring />}

/>
        <Route
          path="/incidents"
          element={<SafetyIncidents />}
        />
        <Route path="/reports" element={<TripReport />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </DashboardLayout>
  )
}

export default App

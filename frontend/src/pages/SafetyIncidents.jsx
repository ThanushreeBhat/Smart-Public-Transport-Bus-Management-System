import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { getIncidents, updateIncidentStatus as apiUpdateIncidentStatus } from '../services/incidentService'

function SafetyIncidents() {
  const [incidents, setIncidents] = useState([
    {
      id: 1,
      bus: 'KA-19-1234',
      type: 'Overcrowding',
      description: 'Passenger count exceeded bus capacity',
      severity: 'High',
      status: 'Open',
    },
    {
      id: 2,
      bus: 'KA-19-5678',
      type: 'Passenger Safety',
      description: 'Passenger reported unsafe boarding',
      severity: 'Medium',
      status: 'Open',
    },
    {
      id: 3,
      bus: 'KA-19-9012',
      type: 'Overcrowding',
      description: 'Bus exceeded permitted capacity',
      severity: 'High',
      status: 'Resolved',
    },
  ])

  const loadIncidents = () => {
    getIncidents()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setIncidents(data)
        }
      })
      .catch((err) => {
        console.warn('Using local incidents state:', err.message)
      })
  }

  useEffect(() => {
    loadIncidents()
  }, [])

  const resolveIncident = async (id) => {
    const incident = incidents.find((item) => (item.id || item.incident_id) === id)

    if (!incident || incident.status === 'Resolved') {
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to resolve this incident?'
    )

    if (!confirmed) return

    try {
      await apiUpdateIncidentStatus(id, 'Resolved')
      loadIncidents()
    } catch (err) {
      console.warn('API error resolving incident, updating local state:', err.message)
      setIncidents((previousIncidents) =>
        previousIncidents.map((item) =>
          (item.id || item.incident_id) === id
            ? { ...item, status: 'Resolved' }
            : item
        )
      )
    }
  }

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'High':
      case 'Critical':
        return 'bg-red-100 text-red-700'
      case 'Medium':
        return 'bg-orange-100 text-orange-700'
      case 'Low':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">
        Safety Incidents
      </h1>

      <p className="text-slate-500 mt-1 mb-6">
        Monitor and manage passenger safety incidents.
      </p>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              {[
                'Bus',
                'Incident Type',
                'Description',
                'Severity',
                'Status',
                'Action',
              ].map((heading) => (
                <th
                  key={heading}
                  className="p-4 text-sm text-slate-600"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="p-8 text-center text-slate-500"
                >
                  No safety incidents recorded yet.
                </td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr key={incident.id || incident.incident_id} className="border-t">
                  <td className="p-4">{incident.bus || incident.bus_number}</td>
                  <td className="p-4">{incident.type || incident.incident_type}</td>
                  <td className="p-4">{incident.description}</td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityStyle(
                        incident.severity
                      )}`}
                    >
                      {incident.severity}
                    </span>
                  </td>

                  <td className="p-4">
                    {incident.status === 'Open' ? (
                      <span className="text-red-600 font-medium">
                        Open
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium">
                        Resolved
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    {incident.status === 'Open' ? (
                      <button
                        onClick={() => resolveIncident(incident.id || incident.incident_id)}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                      >
                        Resolve
                      </button>
                    ) : (
                      <CheckCircle
                        className="text-green-600"
                        size={20}
                      />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SafetyIncidents

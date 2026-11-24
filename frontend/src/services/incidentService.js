import api from './api'

export const getIncidents = async () => {
  const response = await api.get('/incidents')
  return response.data
}

export const updateIncidentStatus = async (id, status) => {
  const response = await api.patch(`/incidents/${id}/status`, { status })
  return response.data
}
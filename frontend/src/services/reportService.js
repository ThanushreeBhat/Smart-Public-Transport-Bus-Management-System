import api from './api'

export const getTripReport = async (tripId) => {
  const response = await api.get(`/reports/trip/${tripId}`)
  return response.data?.data !== undefined ? response.data.data : response.data
}

import api from './api'

export const getPassengerRecords = async (tripId) => {
  const response = await api.get(`/passengers/${tripId}`)
  return response.data
}

export const addPassengerRecord = async (passengerData) => {
  const response = await api.post('/passengers', passengerData)
  return response.data
}
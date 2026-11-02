
import api from './api'

// Get all trips
export const getTrips = async () => {
  const response = await api.get('/trips')
  return response.data
}

// Create a new trip
export const addTrip = async (tripData) => {
  const response = await api.post('/trips', tripData)
  return response.data
}

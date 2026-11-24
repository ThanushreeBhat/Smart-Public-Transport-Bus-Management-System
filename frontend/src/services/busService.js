
import api from './api'

// Get all buses
export const getBuses = async () => {
  const response = await api.get('/buses')
  return response.data
}

// Add a new bus
export const addBus = async (busData) => {
  const response = await api.post('/buses', busData)
  return response.data
}

// Update an existing bus
export const updateBus = async (id, busData) => {
  const response = await api.put(`/buses/${id}`, busData)
  return response.data
}

// Delete a bus
export const deleteBus = async (id) => {
  const response = await api.delete(`/buses/${id}`)
  return response.data
}

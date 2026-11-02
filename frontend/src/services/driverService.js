
import api from './api'

// Get all drivers
export const getDrivers = async () => {
  const response = await api.get('/drivers')
  return response.data
}

// Add a new driver
export const addDriver = async (driverData) => {
  const response = await api.post('/drivers', driverData)
  return response.data
}

// Update an existing driver
export const updateDriver = async (id, driverData) => {
  const response = await api.put(`/drivers/${id}`, driverData)
  return response.data
}

// Delete a driver
export const deleteDriver = async (id) => {
  const response = await api.delete(`/drivers/${id}`)
  return response.data
}

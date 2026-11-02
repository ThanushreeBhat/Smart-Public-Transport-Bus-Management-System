
import api from './api'

// Get all routes
export const getRoutes = async () => {
  const response = await api.get('/routes')
  return response.data
}

// Add a new route
export const addRoute = async (routeData) => {
  const response = await api.post('/routes', routeData)
  return response.data
}

// Update an existing route
export const updateRoute = async (id, routeData) => {
  const response = await api.put(`/routes/${id}`, routeData)
  return response.data
}

// Delete a route
export const deleteRoute = async (id) => {
  const response = await api.delete(`/routes/${id}`)
  return response.data
}

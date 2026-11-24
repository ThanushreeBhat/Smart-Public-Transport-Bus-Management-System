import api from './api'

export const getDrivers = async () => {
  const response = await api.get('/drivers')
  return response.data?.data !== undefined ? response.data.data : response.data
}

export const addDriver = async (driverData) => {
  const response = await api.post('/drivers', driverData)
  return response.data?.data !== undefined ? response.data.data : response.data
}

export const updateDriver = async (id, driverData) => {
  const response = await api.put(`/drivers/${id}`, driverData)
  return response.data?.data !== undefined ? response.data.data : response.data
}

export const deleteDriver = async (id) => {
  const response = await api.delete(`/drivers/${id}`)
  return response.data?.data !== undefined ? response.data.data : response.data
}

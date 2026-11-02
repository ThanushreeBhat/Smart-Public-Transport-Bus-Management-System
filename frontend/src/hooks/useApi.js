import { useState } from 'react'

function useApi(apiFunction) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const request = async (...args) => {
    try {
      setLoading(true)
      setError(null)

      const result = await apiFunction(...args)
      setData(result)

      return result
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, request }
}

export default useApi
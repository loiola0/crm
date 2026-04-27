import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function setAccessToken(token: string | null) {
  if (!token) {
    delete api.defaults.headers.common.Authorization
    return
  }

  api.defaults.headers.common.Authorization = `Bearer ${token}`
}

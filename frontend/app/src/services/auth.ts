import { api } from './api'
import type { LoginRequest, LoginResponse, UserSummary } from '../types/contracts'

export async function login(payload: LoginRequest) {
  const { data } = await api.post<LoginResponse>('/auth/login', payload)
  return data
}

export async function getMe() {
  const { data } = await api.get<UserSummary>('/auth/me')
  return data
}

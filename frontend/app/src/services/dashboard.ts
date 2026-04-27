import { api } from './api'
import type { DashboardOverview } from '../types/contracts'

export async function getDashboardOverview() {
  const { data } = await api.get<DashboardOverview>('/dashboard')
  return data
}

import { api } from './api'
import type {
  AddConversationMessageRequest,
  AddLeadNoteRequest,
  ConversationMessage,
  CreateLeadRequest,
  LeadDetail,
  LeadListItem,
  LeadNote,
  LeadQuery,
  PagedResult,
  UpdateLeadStatusRequest,
} from '../types/contracts'

export async function getLeads(params: LeadQuery) {
  const { data } = await api.get<PagedResult<LeadListItem>>('/leads', { params })
  return data
}

export async function getLeadById(id: string) {
  const { data } = await api.get<LeadDetail>(`/leads/${id}`)
  return data
}

export async function createLead(payload: CreateLeadRequest) {
  const { data } = await api.post<LeadDetail>('/leads', payload)
  return data
}

export async function updateLeadStatus(id: string, payload: UpdateLeadStatusRequest) {
  const { data } = await api.post<LeadDetail>(`/leads/${id}/status`, payload)
  return data
}

export async function addLeadNote(id: string, payload: AddLeadNoteRequest) {
  const { data } = await api.post<LeadNote>(`/leads/${id}/notes`, payload)
  return data
}

export async function addLeadMessage(id: string, payload: AddConversationMessageRequest) {
  const { data } = await api.post<ConversationMessage>(`/leads/${id}/messages`, payload)
  return data
}

export async function recalculateLeadScore(id: string) {
  const { data } = await api.post<{ score: number }>(`/leads/${id}/score/recalculate`)
  return data
}

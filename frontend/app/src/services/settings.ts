import { api } from './api'
import type {
  LeadScoringRuleRequest,
  PromptTemplate,
  PromptTemplateRequest,
  SettingsOverview,
} from '../types/contracts'

export async function getSettingsOverview() {
  const { data } = await api.get<SettingsOverview>('/settings')
  return data
}

export async function saveScoringRules(payload: LeadScoringRuleRequest[]) {
  const { data } = await api.put('/settings/scoring-rules', payload)
  return data
}

export async function createPromptTemplate(payload: PromptTemplateRequest) {
  const { data } = await api.post<PromptTemplate>('/settings/prompt-templates', payload)
  return data
}

export async function updatePromptTemplate(id: string, payload: PromptTemplateRequest) {
  const { data } = await api.put<PromptTemplate>(`/settings/prompt-templates/${id}`, payload)
  return data
}

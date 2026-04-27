import { api } from './api'
import type { AiPreviewRequest, AiPreviewResponse } from '../types/contracts'

export async function previewAiReply(payload: AiPreviewRequest) {
  const { data } = await api.post<AiPreviewResponse>('/automation/ai/preview', payload)
  return data
}

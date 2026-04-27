import type { EnrollmentStatus, LeadSource, LeadStatus, MessageDirection, ScoringRuleType, UserRole } from '../types/contracts'

const leadStatusLabels: Record<LeadStatus, string> = {
  New: 'Novo',
  Contacted: 'Contatado',
  Qualified: 'Qualificado',
  Converted: 'Convertido',
  Lost: 'Perdido',
}

const leadSourceLabels: Record<LeadSource, string> = {
  Manual: 'Manual',
  WhatsApp: 'WhatsApp',
  Ads: 'Anuncios',
  Organic: 'Organico',
  Referral: 'Indicacao',
  Event: 'Evento',
  Other: 'Outro',
}

const messageDirectionLabels: Record<MessageDirection, string> = {
  Inbound: 'Entrada',
  Outbound: 'Saida',
}

const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  Pending: 'Pendente',
  Active: 'Ativa',
  Completed: 'Concluida',
  Cancelled: 'Cancelada',
}

const scoringRuleTypeLabels: Record<ScoringRuleType, string> = {
  TagContains: 'Contem tag',
  MessageCountAtLeast: 'Minimo de mensagens',
  EngagementAtLeast: 'Engajamento minimo',
}

const userRoleLabels: Record<UserRole, string> = {
  Master: 'Master',
  Admin: 'Administrador',
  Sales: 'Comercial',
  Manager: 'Gerente',
}

const timelineTypeLabels: Record<string, string> = {
  'lead.created': 'Lead criado',
  'lead.updated': 'Lead atualizado',
  'lead.status.updated': 'Status alterado',
  'lead.note.added': 'Nota adicionada',
  'message.received': 'Mensagem recebida',
  'message.sent': 'Mensagem enviada',
  'enrollment.created': 'Matricula criada',
  'ai.preview.generated': 'Previa de IA gerada',
}

const channelLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  instagram: 'Instagram',
  manual: 'Manual',
}

const providerLabels: Record<string, string> = {
  n8n: 'n8n',
  whatsapp: 'WhatsApp',
  openai: 'OpenAI',
}

export function formatLeadStatus(status: LeadStatus) {
  return leadStatusLabels[status]
}

export function formatLeadSource(source: LeadSource | string) {
  return leadSourceLabels[source as LeadSource] ?? source
}

export function formatMessageDirection(direction: MessageDirection) {
  return messageDirectionLabels[direction]
}

export function formatEnrollmentStatus(status: EnrollmentStatus) {
  return enrollmentStatusLabels[status]
}

export function formatScoringRuleType(type: ScoringRuleType) {
  return scoringRuleTypeLabels[type]
}

export function formatUserRole(role?: UserRole | null) {
  if (!role) {
    return 'Sem perfil'
  }

  return userRoleLabels[role]
}

export function formatTimelineType(type: string) {
  return timelineTypeLabels[type] ?? type
}

export function formatChannel(channel: string) {
  return channelLabels[channel.toLowerCase()] ?? channel
}

export function formatProvider(provider: string) {
  return providerLabels[provider.toLowerCase()] ?? provider
}

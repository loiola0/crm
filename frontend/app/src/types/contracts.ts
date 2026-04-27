export type UserRole = 'Master' | 'Admin' | 'Sales' | 'Manager'
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost'
export type LeadSource = 'Manual' | 'WhatsApp' | 'Ads' | 'Organic' | 'Referral' | 'Event' | 'Other'
export type MessageDirection = 'Inbound' | 'Outbound'
export type EnrollmentStatus = 'Pending' | 'Active' | 'Completed' | 'Cancelled'
export type ScoringRuleType = 'TagContains' | 'MessageCountAtLeast' | 'EngagementAtLeast'

export interface LoginRequest {
  email: string
  password: string
}

export interface UserSummary {
  id: string
  fullName: string
  email: string
  role: UserRole
  isActive: boolean
}

export interface LoginResponse {
  token: string
  expiresAtUtc: string
  user: UserSummary
}

export interface DashboardMetric {
  today: number
  thisWeek: number
  thisMonth: number
  totalOpenLeads: number
}

export interface FunnelStage {
  status: LeadStatus
  count: number
}

export interface TimelineEvent {
  id: string
  type: string
  description: string
  happenedAtUtc: string
}

export interface TrendPoint {
  label: string
  count: number
}

export interface RevenuePoint {
  label: string
  value: number
}

export interface SourcePoint {
  source: string
  count: number
}

export interface DashboardOverview {
  metrics: DashboardMetric
  conversionRate: number
  revenueThisMonth: number
  revenueTotal: number
  funnel: FunnelStage[]
  activityTimeline: TimelineEvent[]
  leadTrend: TrendPoint[]
  revenueTrend: RevenuePoint[]
  sourceBreakdown: SourcePoint[]
}

export interface LeadQuery {
  search?: string
  status?: LeadStatus
  source?: LeadSource
  page?: number
  pageSize?: number
}

export interface LeadListItem {
  id: string
  fullName: string
  email?: string | null
  phone: string
  company?: string | null
  courseInterest?: string | null
  status: LeadStatus
  source: LeadSource
  score: number
  potentialRevenue: number
  closedRevenue?: number | null
  ownerName?: string | null
  tags: string[]
  updatedAtUtc: string
}

export interface LeadNote {
  id: string
  content: string
  isPinned: boolean
  createdByUserId: string
  createdAtUtc: string
}

export interface ConversationMessage {
  id: string
  channel: string
  direction: MessageDirection
  content: string
  externalMessageId?: string | null
  sentAtUtc: string
}

export interface EnrollmentSummary {
  id: string
  courseId: string
  courseName: string
  classSessionId?: string | null
  classTitle?: string | null
  status: EnrollmentStatus
  amountPaid: number
}

export interface LeadDetail {
  id: string
  fullName: string
  email?: string | null
  phone: string
  company?: string | null
  courseInterest?: string | null
  externalId?: string | null
  status: LeadStatus
  source: LeadSource
  score: number
  manualScoreAdjustment: number
  engagementScore: number
  potentialRevenue: number
  closedRevenue?: number | null
  ownerUserId?: string | null
  ownerName?: string | null
  tags: string[]
  notes: LeadNote[]
  messages: ConversationMessage[]
  enrollments: EnrollmentSummary[]
  createdAtUtc: string
  updatedAtUtc: string
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface CreateLeadRequest {
  fullName: string
  email?: string
  phone: string
  company?: string
  courseInterest?: string
  source: LeadSource
  potentialRevenue: number
  closedRevenue?: number | null
  manualScoreAdjustment: number
  ownerUserId?: string | null
  tags?: string[]
  initialNote?: string
}

export interface UpdateLeadStatusRequest {
  status: LeadStatus
}

export interface AddLeadNoteRequest {
  content: string
  isPinned: boolean
}

export interface AddConversationMessageRequest {
  channel: string
  direction: MessageDirection
  content: string
  externalMessageId?: string
  sentAtUtc?: string
}

export interface ClassSession {
  id: string
  title: string
  instructor?: string | null
  capacity: number
  startDateUtc: string
  endDateUtc: string
}

export interface Course {
  id: string
  name: string
  description: string
  price: number
  isActive: boolean
  enrollmentCount: number
  classes: ClassSession[]
}

export interface Enrollment {
  id: string
  leadId: string
  leadName: string
  courseId: string
  courseName: string
  classSessionId?: string | null
  classTitle?: string | null
  status: EnrollmentStatus
  amountPaid: number
  enrolledAtUtc?: string | null
}

export interface CreateCourseRequest {
  name: string
  description: string
  price: number
  isActive: boolean
}

export interface CreateClassSessionRequest {
  title: string
  instructor?: string
  capacity: number
  startDateUtc: string
  endDateUtc: string
}

export interface CreateEnrollmentRequest {
  leadId: string
  courseId: string
  classSessionId?: string | null
  status: EnrollmentStatus
  amountPaid: number
  enrolledAtUtc?: string
}

export interface AiPreviewRequest {
  leadId: string
  message: string
  promptTemplateId?: string
}

export interface AiPreviewResponse {
  promptTemplateName: string
  reply: string
  qualificationSummary: string
  recommendedNextStep: string
}

export interface LeadScoringRule {
  id: string
  name: string
  ruleType: ScoringRuleType
  conditionValue?: string | null
  threshold: number
  points: number
  isEnabled: boolean
}

export interface LeadScoringRuleRequest {
  id?: string
  name: string
  ruleType: ScoringRuleType
  conditionValue?: string | null
  threshold: number
  points: number
  isEnabled: boolean
}

export interface PromptTemplate {
  id: string
  name: string
  description: string
  systemPrompt: string
  userPromptTemplate: string
  isDefault: boolean
}

export interface PromptTemplateRequest {
  name: string
  description: string
  systemPrompt: string
  userPromptTemplate: string
  isDefault: boolean
}

export interface RecentWebhookLog {
  id: string
  provider: string
  eventType: string
  success: boolean
  statusCode?: number | null
  errorMessage?: string | null
  createdAtUtc: string
}

export interface RecentAiLog {
  id: string
  promptTemplateName: string
  success: boolean
  model?: string | null
  tokensUsed: number
  createdAtUtc: string
}

export interface SettingsOverview {
  openAiConfigured: boolean
  webhookSecretConfigured: boolean
  scoringRules: LeadScoringRule[]
  promptTemplates: PromptTemplate[]
  recentWebhookLogs: RecentWebhookLog[]
  recentAiLogs: RecentAiLog[]
}

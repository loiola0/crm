import type { EnrollmentStatus, LeadSource, LeadStatus, MessageDirection, ScoringRuleType } from '../types/contracts'

export const leadStatuses: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost']
export const leadSources: LeadSource[] = ['Manual', 'WhatsApp', 'Ads', 'Organic', 'Referral', 'Event', 'Other']
export const messageDirections: MessageDirection[] = ['Inbound', 'Outbound']
export const enrollmentStatuses: EnrollmentStatus[] = ['Pending', 'Active', 'Completed', 'Cancelled']
export const scoringRuleTypes: ScoringRuleType[] = ['TagContains', 'MessageCountAtLeast', 'EngagementAtLeast']

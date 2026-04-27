# API Reference

Base URL examples:

- Local backend: `http://localhost:8080`
- Local frontend proxied API: `/api`

Authentication patterns:

- `Bearer <jwt>` for authenticated CRM endpoints
- `X-Webhook-Secret: <WEBHOOK_SECRET>` for public webhook endpoints

## POST `/api/auth/login`

- Auth: `Public`
- Purpose: Authenticate a CRM user and receive a JWT.

Request example:

```json
{
  "email": "master@focarlab.local",
  "password": "ChangeMe123!"
}
```

Response example:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAtUtc": "2026-04-27T20:00:00Z",
  "user": {
    "id": "7cc91fe3-4b45-4b8e-81af-8e3bfaf8d4b7",
    "fullName": "Focar Lab Master",
    "email": "master@focarlab.local",
    "role": "Master",
    "isActive": true
  }
}
```

## GET `/api/auth/me`

- Auth: `Bearer`
- Purpose: Resolve the currently authenticated user.

Response example:

```json
{
  "id": "7cc91fe3-4b45-4b8e-81af-8e3bfaf8d4b7",
  "fullName": "Focar Lab Master",
  "email": "master@focarlab.local",
  "role": "Master",
  "isActive": true
}
```

## GET `/api/dashboard`

- Auth: `Bearer`
- Purpose: Return CRM KPIs, funnel summary, revenue, sources, and recent activity.

Response example:

```json
{
  "metrics": {
    "today": 4,
    "thisWeek": 19,
    "thisMonth": 63,
    "totalOpenLeads": 42
  },
  "conversionRate": 18.25,
  "revenueThisMonth": 12400,
  "revenueTotal": 49300,
  "funnel": [
    { "status": "New", "count": 14 },
    { "status": "Contacted", "count": 12 },
    { "status": "Qualified", "count": 8 },
    { "status": "Converted", "count": 7 },
    { "status": "Lost", "count": 3 }
  ],
  "activityTimeline": [
    {
      "id": "3b755ae8-c1a4-4d91-bf2d-04dbd9120b15",
      "type": "lead.created",
      "description": "Lead Ana Costa was created.",
      "happenedAtUtc": "2026-04-27T14:30:00Z"
    }
  ],
  "leadTrend": [{ "label": "21 Apr", "count": 2 }],
  "revenueTrend": [{ "label": "Apr 26", "value": 12400 }],
  "sourceBreakdown": [{ "source": "WhatsApp", "count": 16 }]
}
```

## GET `/api/leads`

- Auth: `Bearer`
- Purpose: Search and page leads.
- Query params: `search`, `status`, `source`, `page`, `pageSize`

Response example:

```json
{
  "items": [
    {
      "id": "d97207f8-a3c1-4eb2-90d5-84f0a1a7d950",
      "fullName": "Ana Costa",
      "email": "ana@example.com",
      "phone": "+5511999999999",
      "company": "Escola Horizonte",
      "courseInterest": "Laboratorio de IA",
      "status": "Qualified",
      "source": "WhatsApp",
      "score": 38,
      "potentialRevenue": 3500,
      "closedRevenue": null,
      "ownerName": "Focar Lab Master",
      "tags": ["vip", "warm"],
      "updatedAtUtc": "2026-04-27T14:30:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

## POST `/api/leads`

- Auth: `Bearer`
- Purpose: Create a lead, tags, optional starter note, and initial score.

Request example:

```json
{
  "fullName": "Ana Costa",
  "email": "ana@example.com",
  "phone": "+5511999999999",
  "company": "Escola Horizonte",
  "courseInterest": "Laboratorio de IA",
  "source": "WhatsApp",
  "potentialRevenue": 3500,
  "closedRevenue": null,
  "manualScoreAdjustment": 5,
  "ownerUserId": null,
  "tags": ["vip", "warm"],
  "initialNote": "Lead pediu proposta para decisao nesta semana."
}
```

Response example:

```json
{
  "id": "d97207f8-a3c1-4eb2-90d5-84f0a1a7d950",
  "fullName": "Ana Costa",
  "status": "New",
  "source": "WhatsApp",
  "score": 20,
  "manualScoreAdjustment": 5,
  "engagementScore": 2,
  "potentialRevenue": 3500,
  "closedRevenue": null,
  "ownerUserId": null,
  "ownerName": null,
  "tags": ["vip", "warm"],
  "notes": [],
  "messages": [],
  "enrollments": [],
  "createdAtUtc": "2026-04-27T14:30:00Z",
  "updatedAtUtc": "2026-04-27T14:30:00Z"
}
```

## GET `/api/leads/{id}`

- Auth: `Bearer`
- Purpose: Return full lead detail, including notes, messages, tags, and enrollments.

Response example:

```json
{
  "id": "d97207f8-a3c1-4eb2-90d5-84f0a1a7d950",
  "fullName": "Ana Costa",
  "email": "ana@example.com",
  "phone": "+5511999999999",
  "company": "Escola Horizonte",
  "courseInterest": "Laboratorio de IA",
  "externalId": "lead_ana_001",
  "status": "Qualified",
  "source": "WhatsApp",
  "score": 38,
  "manualScoreAdjustment": 5,
  "engagementScore": 14,
  "potentialRevenue": 3500,
  "closedRevenue": null,
  "ownerUserId": null,
  "ownerName": null,
  "tags": ["vip", "warm"],
  "notes": [],
  "messages": [],
  "enrollments": [],
  "createdAtUtc": "2026-04-27T14:30:00Z",
  "updatedAtUtc": "2026-04-27T14:55:00Z"
}
```

## PUT `/api/leads/{id}`

- Auth: `Bearer`
- Purpose: Replace the core lead profile.

Request example:

```json
{
  "fullName": "Ana Costa",
  "email": "ana@example.com",
  "phone": "+5511999999999",
  "company": "Escola Horizonte",
  "courseInterest": "Laboratorio de IA",
  "status": "Qualified",
  "source": "WhatsApp",
  "potentialRevenue": 3500,
  "closedRevenue": null,
  "manualScoreAdjustment": 8,
  "ownerUserId": null,
  "tags": ["vip", "objection-price"]
}
```

Response example:

```json
{
  "id": "d97207f8-a3c1-4eb2-90d5-84f0a1a7d950",
  "status": "Qualified",
  "score": 41,
  "tags": ["objection-price", "vip"]
}
```

## DELETE `/api/leads/{id}`

- Auth: `Bearer` with `Master` or `Admin`
- Purpose: Permanently delete a lead.
- Response: `204 No Content`

## POST `/api/leads/{id}/status`

- Auth: `Bearer`
- Purpose: Move a lead between funnel stages.

Request example:

```json
{
  "status": "Converted"
}
```

Response example:

```json
{
  "id": "d97207f8-a3c1-4eb2-90d5-84f0a1a7d950",
  "status": "Converted",
  "score": 45
}
```

## POST `/api/leads/{id}/notes`

- Auth: `Bearer`
- Purpose: Add a note to a lead.

Request example:

```json
{
  "content": "Cliente pediu contrato e plano de pagamento.",
  "isPinned": false
}
```

Response example:

```json
{
  "id": "1c44ac60-e896-4837-bcd5-0ecf03ab1adc",
  "content": "Cliente pediu contrato e plano de pagamento.",
  "isPinned": false,
  "createdByUserId": "7cc91fe3-4b45-4b8e-81af-8e3bfaf8d4b7",
  "createdAtUtc": "2026-04-27T15:10:00Z"
}
```

## POST `/api/leads/{id}/messages`

- Auth: `Bearer`
- Purpose: Persist an inbound or outbound CRM message.

Request example:

```json
{
  "channel": "whatsapp",
  "direction": "Inbound",
  "content": "Quais horarios estao disponiveis?",
  "externalMessageId": "wamid.HBgLNTU...",
  "sentAtUtc": "2026-04-27T15:12:00Z"
}
```

Response example:

```json
{
  "id": "e0855a3c-352d-4e80-b28d-08f0ea345e30",
  "channel": "whatsapp",
  "direction": "Inbound",
  "content": "Quais horarios estao disponiveis?",
  "externalMessageId": "wamid.HBgLNTU...",
  "sentAtUtc": "2026-04-27T15:12:00Z"
}
```

## POST `/api/leads/{id}/score/recalculate`

- Auth: `Bearer`
- Purpose: Force a lead score recalculation.

Response example:

```json
{
  "score": 42
}
```

## GET `/api/courses`

- Auth: `Bearer`
- Purpose: Return course catalog and linked class sessions.

Response example:

```json
[
  {
    "id": "93e2861a-2dd2-4c0d-a8b0-184f1fe621e4",
    "name": "Laboratorio de IA",
    "description": "Programa intensivo para aplicacao de IA no negocio educacional.",
    "price": 3500,
    "isActive": true,
    "enrollmentCount": 12,
    "classes": [
      {
        "id": "d62ee1d8-9d3d-42cc-bbb0-c5dc0d7150ef",
        "title": "Turma Maio 2026",
        "instructor": "Victor Martins",
        "capacity": 30,
        "startDateUtc": "2026-05-10T19:00:00Z",
        "endDateUtc": "2026-07-10T21:00:00Z"
      }
    ]
  }
]
```

## POST `/api/courses`

- Auth: `Bearer` with `Master`, `Admin`, or `Manager`
- Purpose: Create a course.

Request example:

```json
{
  "name": "Laboratorio de IA",
  "description": "Programa intensivo para aplicacao de IA no negocio educacional.",
  "price": 3500,
  "isActive": true
}
```

Response example:

```json
{
  "id": "93e2861a-2dd2-4c0d-a8b0-184f1fe621e4",
  "name": "Laboratorio de IA",
  "description": "Programa intensivo para aplicacao de IA no negocio educacional.",
  "price": 3500,
  "isActive": true,
  "enrollmentCount": 0,
  "classes": []
}
```

## POST `/api/courses/{courseId}/classes`

- Auth: `Bearer` with `Master`, `Admin`, or `Manager`
- Purpose: Add a class session to a course.

Request example:

```json
{
  "title": "Turma Maio 2026",
  "instructor": "Victor Martins",
  "capacity": 30,
  "startDateUtc": "2026-05-10T19:00:00Z",
  "endDateUtc": "2026-07-10T21:00:00Z"
}
```

Response example:

```json
{
  "id": "d62ee1d8-9d3d-42cc-bbb0-c5dc0d7150ef",
  "title": "Turma Maio 2026",
  "instructor": "Victor Martins",
  "capacity": 30,
  "startDateUtc": "2026-05-10T19:00:00Z",
  "endDateUtc": "2026-07-10T21:00:00Z"
}
```

## GET `/api/enrollments`

- Auth: `Bearer`
- Purpose: Return enrollments tied to leads and courses.

Response example:

```json
[
  {
    "id": "e8fa71f1-0fc7-44d0-bfe1-7750cb5d7202",
    "leadId": "d97207f8-a3c1-4eb2-90d5-84f0a1a7d950",
    "leadName": "Ana Costa",
    "courseId": "93e2861a-2dd2-4c0d-a8b0-184f1fe621e4",
    "courseName": "Laboratorio de IA",
    "classSessionId": "d62ee1d8-9d3d-42cc-bbb0-c5dc0d7150ef",
    "classTitle": "Turma Maio 2026",
    "status": "Active",
    "amountPaid": 3500,
    "enrolledAtUtc": "2026-04-27T15:20:00Z"
  }
]
```

## POST `/api/enrollments`

- Auth: `Bearer` with `Master`, `Admin`, or `Manager`
- Purpose: Create an enrollment and optionally convert a lead.

Request example:

```json
{
  "leadId": "d97207f8-a3c1-4eb2-90d5-84f0a1a7d950",
  "courseId": "93e2861a-2dd2-4c0d-a8b0-184f1fe621e4",
  "classSessionId": "d62ee1d8-9d3d-42cc-bbb0-c5dc0d7150ef",
  "status": "Active",
  "amountPaid": 3500,
  "enrolledAtUtc": "2026-04-27T15:20:00Z"
}
```

Response example:

```json
{
  "id": "e8fa71f1-0fc7-44d0-bfe1-7750cb5d7202",
  "leadId": "d97207f8-a3c1-4eb2-90d5-84f0a1a7d950",
  "leadName": "Ana Costa",
  "courseId": "93e2861a-2dd2-4c0d-a8b0-184f1fe621e4",
  "courseName": "Laboratorio de IA",
  "classSessionId": "d62ee1d8-9d3d-42cc-bbb0-c5dc0d7150ef",
  "classTitle": "Turma Maio 2026",
  "status": "Active",
  "amountPaid": 3500,
  "enrolledAtUtc": "2026-04-27T15:20:00Z"
}
```

## POST `/api/automation/ai/preview`

- Auth: `Bearer`
- Purpose: Generate an AI-powered sales reply preview.

Request example:

```json
{
  "leadId": "d97207f8-a3c1-4eb2-90d5-84f0a1a7d950",
  "message": "Gostei do curso, mas queria saber se posso parcelar.",
  "promptTemplateId": "8d1ad88d-aad0-4bcc-a469-bab10b25c8b1"
}
```

Response example:

```json
{
  "promptTemplateName": "Sales qualifier",
  "reply": "Claro. Podemos parcelar e eu te explico a melhor opcao para a sua turma. Se fizer sentido, te mando agora as condicoes e as datas disponiveis para voce escolher com calma.",
  "qualificationSummary": "The lead is qualified and ready for offer-driven follow-up. Current score: 38.",
  "recommendedNextStep": "Send urgency-driven CTA with class availability and payment link."
}
```

## GET `/api/settings`

- Auth: `Bearer`
- Purpose: Return scoring rules, prompt templates, and recent automation logs.

Response example:

```json
{
  "openAiConfigured": true,
  "webhookSecretConfigured": true,
  "scoringRules": [
    {
      "id": "c12113a0-2754-4fdb-ab03-496f6061ca32",
      "name": "3+ messages",
      "ruleType": "MessageCountAtLeast",
      "conditionValue": null,
      "threshold": 3,
      "points": 10,
      "isEnabled": true
    }
  ],
  "promptTemplates": [
    {
      "id": "8d1ad88d-aad0-4bcc-a469-bab10b25c8b1",
      "name": "Sales qualifier",
      "description": "Default prompt for warm, concise WhatsApp sales follow-up.",
      "systemPrompt": "You are a senior education sales assistant for Focar Lab...",
      "userPromptTemplate": "Lead name: {leadName}\\nIncoming message: {message}",
      "isDefault": true
    }
  ],
  "recentWebhookLogs": [],
  "recentAiLogs": []
}
```

## PUT `/api/settings/scoring-rules`

- Auth: `Bearer` with `Master` or `Admin`
- Purpose: Replace the full scoring rule list.

Request example:

```json
[
  {
    "id": "c12113a0-2754-4fdb-ab03-496f6061ca32",
    "name": "3+ messages",
    "ruleType": "MessageCountAtLeast",
    "conditionValue": null,
    "threshold": 3,
    "points": 10,
    "isEnabled": true
  },
  {
    "name": "VIP tag boost",
    "ruleType": "TagContains",
    "conditionValue": "vip",
    "threshold": 0,
    "points": 20,
    "isEnabled": true
  }
]
```

Response example:

```json
[
  {
    "id": "c12113a0-2754-4fdb-ab03-496f6061ca32",
    "name": "3+ messages",
    "ruleType": "MessageCountAtLeast",
    "conditionValue": null,
    "threshold": 3,
    "points": 10,
    "isEnabled": true
  }
]
```

## POST `/api/settings/prompt-templates`

- Auth: `Bearer` with `Master` or `Admin`
- Purpose: Create a prompt template.

Request example:

```json
{
  "name": "Objection handler",
  "description": "Template focused on price and time objections.",
  "systemPrompt": "You are a senior education closer for Focar Lab.",
  "userPromptTemplate": "Lead: {leadName}\\nStatus: {status}\\nMessage: {message}",
  "isDefault": false
}
```

Response example:

```json
{
  "id": "eb22228d-2b8f-4728-87cb-5f56926742fc",
  "name": "Objection handler",
  "description": "Template focused on price and time objections.",
  "systemPrompt": "You are a senior education closer for Focar Lab.",
  "userPromptTemplate": "Lead: {leadName}\\nStatus: {status}\\nMessage: {message}",
  "isDefault": false
}
```

## PUT `/api/settings/prompt-templates/{id}`

- Auth: `Bearer` with `Master` or `Admin`
- Purpose: Update a prompt template.

Request example:

```json
{
  "name": "Sales qualifier",
  "description": "Updated default prompt for warm WhatsApp follow-up.",
  "systemPrompt": "You are a senior education sales assistant for Focar Lab.",
  "userPromptTemplate": "Lead name: {leadName}\\nIncoming message: {message}",
  "isDefault": true
}
```

Response example:

```json
{
  "id": "8d1ad88d-aad0-4bcc-a469-bab10b25c8b1",
  "name": "Sales qualifier",
  "description": "Updated default prompt for warm WhatsApp follow-up.",
  "systemPrompt": "You are a senior education sales assistant for Focar Lab.",
  "userPromptTemplate": "Lead name: {leadName}\\nIncoming message: {message}",
  "isDefault": true
}
```

## POST `/api/webhooks/n8n`

- Auth: `Public` with `X-Webhook-Secret`
- Purpose: Receive automation events from n8n.

Request example:

```json
{
  "eventType": "lead.created",
  "data": {
    "fullName": "Ana Costa",
    "email": "ana@example.com",
    "phone": "+5511999999999",
    "company": "Escola Horizonte",
    "courseInterest": "Laboratorio de IA",
    "source": "WhatsApp",
    "potentialRevenue": 3500,
    "externalId": "lead_ana_001"
  }
}
```

Response example:

```json
{
  "provider": "n8n",
  "eventType": "lead.created",
  "success": true,
  "message": "Webhook processed successfully."
}
```

## POST `/api/webhooks/whatsapp`

- Auth: `Public` with `X-Webhook-Secret`
- Purpose: Receive normalized WhatsApp message payloads.

Request example:

```json
{
  "contact": {
    "wa_id": "+5511999999999",
    "name": "Ana Costa"
  },
  "message": {
    "id": "wamid.HBgLNTUxMTk5OTk5OTk5OQ==",
    "text": "Gostei do curso, mas queria saber se posso parcelar."
  }
}
```

Response example:

```json
{
  "provider": "whatsapp",
  "eventType": "message.received",
  "success": true,
  "message": "WhatsApp message stored."
}
```

## GET `/health`

- Auth: `Public`
- Purpose: Basic application health endpoint.
- Response: `200 OK`

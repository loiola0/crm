# Curl Examples

## Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "master@focarlab.local",
    "password": "ChangeMe123!"
  }'
```

## Create lead

```bash
curl -X POST http://localhost:8080/api/leads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Ana Costa",
    "email": "ana@example.com",
    "phone": "+5511999999999",
    "company": "Escola Horizonte",
    "courseInterest": "Laboratorio de IA",
    "source": "WhatsApp",
    "potentialRevenue": 3500,
    "manualScoreAdjustment": 5,
    "tags": ["vip", "warm"],
    "initialNote": "Lead pediu proposta para esta semana."
  }'
```

## Dashboard

```bash
curl http://localhost:8080/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Add message to lead

```bash
curl -X POST http://localhost:8080/api/leads/LEAD_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "whatsapp",
    "direction": "Inbound",
    "content": "Quais horarios estao disponiveis?"
  }'
```

## AI preview

```bash
curl -X POST http://localhost:8080/api/automation/ai/preview \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "LEAD_ID",
    "message": "Gostei do curso, mas queria entender parcelamento."
  }'
```

## n8n webhook

```bash
curl -X POST http://localhost:8080/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_WEBHOOK_SECRET" \
  -d '{
    "eventType": "lead.status.updated",
    "data": {
      "leadId": "LEAD_ID",
      "status": "Qualified"
    }
  }'
```

## WhatsApp webhook

```bash
curl -X POST http://localhost:8080/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_WEBHOOK_SECRET" \
  -d '{
    "contact": {
      "wa_id": "+5511999999999",
      "name": "Ana Costa"
    },
    "message": {
      "id": "wamid.HBgLNTUxMTk5OTk5OTk5OQ==",
      "text": "Gostei do curso, mas queria saber se posso parcelar."
    }
  }'
```

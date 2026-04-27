# Focar Lab CRM

Production-shaped CRM for an educational business, built for automation-first workflows and external integrations such as n8n, WhatsApp Cloud API, and OpenAI.

## Stack

- Backend: .NET 8, ASP.NET Core Web API, Entity Framework Core, PostgreSQL, JWT, Serilog, Swagger
- Frontend: React 19, Vite, TypeScript, TailwindCSS 4, React Query, Recharts, dnd-kit
- Infra: Docker, Docker Compose, environment-variable configuration, local EF tool manifest

## Monorepo layout

```text
backend/
  .config/
  src/
    FocarLab.CRM.Domain/
    FocarLab.CRM.Application/
    FocarLab.CRM.Infrastructure/
    FocarLab.CRM.API/
frontend/
  app/
docs/
examples/
docker-compose.yml
```

## Included product areas

- JWT authentication with seeded master user and RBAC-ready roles
- CRM dashboard with funnel, trend, revenue, source, and activity widgets
- Leads management with tags, notes, messages, scoring, and Kanban pipeline
- Education module with courses, class sessions, and enrollments
- AI reply preview backed by prompt templates and OpenAI integration
- Secure webhook endpoints for n8n and WhatsApp
- Request, webhook, and AI logging
- Dockerized local/prod-style deployment
- Initial EF migration and local `dotnet-ef` tool manifest

## Quick start

1. Copy `.env.example` to `.env` and update secrets.
2. Start the stack:

```bash
docker compose up --build
```

3. Open:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Swagger: [http://localhost:8080/swagger](http://localhost:8080/swagger)
- Health: [http://localhost:8080/health](http://localhost:8080/health)

## Default seeded login

- Email: `master@focarlab.local`
- Password: `ChangeMe123!`

Change both immediately in production via `MASTER_USER_EMAIL` and `MASTER_USER_PASSWORD`.

## Local development

### Backend

```bash
cd backend
dotnet restore
dotnet build FocarLab.CRM.sln
dotnet run --project src/FocarLab.CRM.API/FocarLab.CRM.API.csproj
```

### Frontend

```bash
cd frontend/app
npm install
npm run dev
```

By default the frontend expects `VITE_API_URL` to be `/api`. For standalone local frontend development, create `frontend/app/.env.local` with:

```env
VITE_API_URL=http://localhost:8080/api
```

## Database and migrations

The API runs `Database.Migrate()` and seeds baseline data on startup.

Local EF tool usage:

```bash
cd backend
dotnet tool restore
dotnet dotnet-ef database update --project src/FocarLab.CRM.Infrastructure/FocarLab.CRM.Infrastructure.csproj --startup-project src/FocarLab.CRM.API/FocarLab.CRM.API.csproj
```

Initial migration already exists under:

- [backend/src/FocarLab.CRM.Infrastructure/Persistence/Migrations](/C:/Users/Victor%20Martins/Documents/New%20project%204/backend/src/FocarLab.CRM.Infrastructure/Persistence/Migrations)

## Documentation and examples

- API reference: [docs/api-reference.md](/C:/Users/Victor%20Martins/Documents/New%20project%204/docs/api-reference.md)
- Curl examples: [examples/curl-examples.md](/C:/Users/Victor%20Martins/Documents/New%20project%204/examples/curl-examples.md)
- n8n workflow: [examples/n8n/focarlab-crm-workflow.json](/C:/Users/Victor%20Martins/Documents/New%20project%204/examples/n8n/focarlab-crm-workflow.json)
- Webhook payloads: [examples/webhooks](/C:/Users/Victor%20Martins/Documents/New%20project%204/examples/webhooks)
- Prompt examples: [examples/openai-prompts.md](/C:/Users/Victor%20Martins/Documents/New%20project%204/examples/openai-prompts.md)

## Deployment notes

- Reverse proxy or expose the frontend container on port `3000`
- Expose the backend on port `8080`
- Point `FRONTEND_URL` to the public frontend origin for CORS
- Rotate `JWT_SECRET` and `WEBHOOK_SECRET` before production
- Back up PostgreSQL volumes and centralize logs if you move beyond single-VPS deployment

## OpenAI integration note

The backend OpenAI client is implemented against the official Responses API model described in the OpenAI docs: [OpenAI Responses guide](https://platform.openai.com/docs/guides/text?api-mode=responses).

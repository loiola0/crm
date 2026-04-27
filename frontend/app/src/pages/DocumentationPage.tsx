import { useState } from 'react'
import { Bot, Code2, ExternalLink, FileCode2, Globe, ShieldCheck, Webhook, Workflow } from 'lucide-react'

type DocumentationTab = 'overview' | 'api' | 'webhooks' | 'n8n' | 'ai'

const documentationTabs: Array<{ id: DocumentationTab; label: string }> = [
  { id: 'overview', label: 'Visao geral' },
  { id: 'api', label: 'API' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'n8n', label: 'n8n' },
  { id: 'ai', label: 'IA' },
]

const endpointGroups = [
  {
    title: 'Autenticacao',
    description: 'Entradas para login, sessao autenticada e controle de acesso via JWT.',
    items: [
      { method: 'POST', path: '/api/auth/login', auth: 'Publico', purpose: 'Autentica usuario e retorna token JWT.' },
      { method: 'GET', path: '/api/auth/me', auth: 'Bearer', purpose: 'Retorna o usuario autenticado atual.' },
    ],
  },
  {
    title: 'CRM e dashboard',
    description: 'Operacoes centrais de leads, pipeline, score e metricas do negocio.',
    items: [
      { method: 'GET', path: '/api/dashboard', auth: 'Bearer', purpose: 'KPIs, funil, faturamento e timeline recente.' },
      { method: 'GET', path: '/api/leads', auth: 'Bearer', purpose: 'Lista e pesquisa leads com paginacao.' },
      { method: 'POST', path: '/api/leads', auth: 'Bearer', purpose: 'Cria lead com tags, nota inicial e score.' },
      { method: 'GET', path: '/api/leads/{id}', auth: 'Bearer', purpose: 'Detalhe completo do lead com mensagens e matriculas.' },
      { method: 'POST', path: '/api/leads/{id}/status', auth: 'Bearer', purpose: 'Move o lead pelo funil.' },
      { method: 'POST', path: '/api/leads/{id}/notes', auth: 'Bearer', purpose: 'Adiciona anotacao interna ao lead.' },
      { method: 'POST', path: '/api/leads/{id}/messages', auth: 'Bearer', purpose: 'Armazena mensagens do CRM ou WhatsApp.' },
      { method: 'POST', path: '/api/leads/{id}/score/recalculate', auth: 'Bearer', purpose: 'Recalcula o score do lead sob demanda.' },
    ],
  },
  {
    title: 'Educacao',
    description: 'Cursos, turmas e matriculas conectados ao funil comercial.',
    items: [
      { method: 'GET', path: '/api/courses', auth: 'Bearer', purpose: 'Catalogo de cursos com turmas vinculadas.' },
      { method: 'POST', path: '/api/courses', auth: 'Bearer + role', purpose: 'Cria um novo curso.' },
      { method: 'POST', path: '/api/courses/{courseId}/classes', auth: 'Bearer + role', purpose: 'Cria uma nova turma.' },
      { method: 'GET', path: '/api/enrollments', auth: 'Bearer', purpose: 'Lista matriculas com lead, curso e status.' },
      { method: 'POST', path: '/api/enrollments', auth: 'Bearer + role', purpose: 'Converte lead em aluno e registra pagamento.' },
    ],
  },
  {
    title: 'Automacao e configuracoes',
    description: 'Prompts, score, IA e configuracoes operacionais.',
    items: [
      { method: 'POST', path: '/api/automation/ai/preview', auth: 'Bearer', purpose: 'Gera previa de resposta comercial com IA.' },
      { method: 'GET', path: '/api/settings', auth: 'Bearer', purpose: 'Retorna score rules, prompts e logs recentes.' },
      { method: 'PUT', path: '/api/settings/scoring-rules', auth: 'Bearer + role', purpose: 'Substitui a lista de regras de score.' },
      { method: 'POST', path: '/api/settings/prompt-templates', auth: 'Bearer + role', purpose: 'Cria um prompt template.' },
      { method: 'PUT', path: '/api/settings/prompt-templates/{id}', auth: 'Bearer + role', purpose: 'Atualiza um prompt template existente.' },
    ],
  },
]

const curlExamples = {
  login: `curl -X POST http://localhost:8080/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "master@focarlab.local",
    "password": "ChangeMe123!"
  }'`,
  createLead: `curl -X POST http://localhost:8080/api/leads \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fullName": "Ana Costa",
    "email": "ana@example.com",
    "phone": "+5511999999999",
    "company": "Escola Horizonte",
    "courseInterest": "Laboratorio de IA",
    "source": "WhatsApp",
    "potentialRevenue": 3500,
    "manualScoreAdjustment": 5,
    "tags": ["vip", "warm"]
  }'`,
  aiPreview: `curl -X POST http://localhost:8080/api/automation/ai/preview \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "leadId": "LEAD_ID",
    "message": "Gostei do curso, mas queria entender parcelamento."
  }'`,
}

const webhookExamples = {
  n8n: `{
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
}`,
  whatsapp: `{
  "contact": {
    "wa_id": "+5511999999999",
    "name": "Ana Costa"
  },
  "message": {
    "id": "wamid.HBgLNTUxMTk5OTk5OTk5OQ==",
    "text": "Gostei do curso, mas queria saber se posso parcelar."
  }
}`,
}

const promptExamples = [
  {
    title: 'Qualificacao padrao de vendas',
    systemPrompt:
      'You are a senior education sales assistant for Focar Lab. Be warm, concise, and conversion-focused.',
    userPrompt:
      'Lead name: {leadName}\\nLead source: {source}\\nLead status: {status}\\nCourse interest: {courseInterest}\\nIncoming message: {message}\\n\\nWrite the next WhatsApp reply in Brazilian Portuguese.',
  },
  {
    title: 'Objeção de preco',
    systemPrompt:
      'You are a Focar Lab closer handling pricing objections for education products. Be consultative, emphasize outcomes, and avoid sounding pushy.',
    userPrompt:
      'Lead name: {leadName}\\nCurrent stage: {status}\\nCourse interest: {courseInterest}\\nIncoming message: {message}\\n\\nWrite a concise WhatsApp response in Brazilian Portuguese.',
  },
]

export function DocumentationPage() {
  const [activeTab, setActiveTab] = useState<DocumentationTab>('overview')

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="eyebrow">Documentacao</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold text-slate-950">API, webhooks e automacoes</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
            Um hub unico para consultar endpoints, autenticacao, exemplos de payload, integracao com n8n e prompts usados nas automacoes de IA do CRM.
          </p>
        </div>

        <a
          href="http://localhost:8080/swagger"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Abrir Swagger
          <ExternalLink className="h-4 w-4" />
        </a>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard
          icon={<Globe className="h-5 w-5" />}
          title="Base URLs"
          description="Backend local em http://localhost:8080 e API proxied no frontend em /api."
        />
        <InfoCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Autenticacao"
          description="JWT Bearer para endpoints autenticados e X-Webhook-Secret para entradas publicas."
        />
        <InfoCard
          icon={<FileCode2 className="h-5 w-5" />}
          title="Arquivos de apoio"
          description="Exemplos completos tambem existem no repositorio em docs/ e examples/."
        />
      </section>

      <section className="panel">
        <div className="flex flex-wrap gap-3">
          {documentationTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-slate-950 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === 'overview' ? <OverviewTab /> : null}
          {activeTab === 'api' ? <ApiTab /> : null}
          {activeTab === 'webhooks' ? <WebhooksTab /> : null}
          {activeTab === 'n8n' ? <N8nTab /> : null}
          {activeTab === 'ai' ? <AiTab /> : null}
        </div>
      </section>
    </div>
  )
}

function OverviewTab() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
        <p className="eyebrow">Canais principais</p>
        <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Mapa rapido</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <MiniCard icon={<Code2 className="h-4 w-4" />} title="API REST" detail="Auth, leads, dashboard, educacao e settings." />
          <MiniCard icon={<Webhook className="h-4 w-4" />} title="Webhooks" detail="n8n e WhatsApp com validacao por segredo." />
          <MiniCard icon={<Workflow className="h-4 w-4" />} title="n8n" detail="Fluxos de criacao, atualizacao e automacao de leads." />
          <MiniCard icon={<Bot className="h-4 w-4" />} title="OpenAI" detail="Previa de respostas e templates prontos para vendas." />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
        <p className="eyebrow">Atalhos uteis</p>
        <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">O que consultar primeiro</h3>
        <div className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
          <p><strong>Swagger:</strong> visualize e teste endpoints em `http://localhost:8080/swagger`.</p>
          <p><strong>Referencia completa:</strong> o repositorio tambem inclui `docs/api-reference.md`.</p>
          <p><strong>Exemplos de curl:</strong> consulte `examples/curl-examples.md`.</p>
          <p><strong>Workflow n8n:</strong> importe `examples/n8n/focarlab-crm-workflow.json`.</p>
          <p><strong>Prompts OpenAI:</strong> veja `examples/openai-prompts.md`.</p>
        </div>
      </div>
    </div>
  )
}

function ApiTab() {
  return (
    <div className="space-y-6">
      {endpointGroups.map((group) => (
        <div key={group.title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
          <p className="eyebrow">{group.title}</p>
          <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">{group.description}</h3>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.24em] text-slate-400">
                <tr>
                  <th className="pb-3">Metodo</th>
                  <th className="pb-3">Endpoint</th>
                  <th className="pb-3">Auth</th>
                  <th className="pb-3">Finalidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {group.items.map((item) => (
                  <tr key={item.path}>
                    <td className="py-4">
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">{item.method}</span>
                    </td>
                    <td className="py-4 font-mono text-slate-800">{item.path}</td>
                    <td className="py-4 text-slate-600">{item.auth}</td>
                    <td className="py-4 text-slate-600">{item.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="grid gap-6 xl:grid-cols-2">
        <CodeBlockCard title="Curl de login" code={curlExamples.login} />
        <CodeBlockCard title="Curl de criacao de lead" code={curlExamples.createLead} />
      </div>
    </div>
  )
}

function WebhooksTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
          <p className="eyebrow">Seguranca</p>
          <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Cabecalhos esperados</h3>
          <div className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
            <p><strong>Header obrigatorio:</strong> `X-Webhook-Secret`</p>
            <p><strong>n8n:</strong> `POST /api/webhooks/n8n`</p>
            <p><strong>WhatsApp:</strong> `POST /api/webhooks/whatsapp`</p>
            <p><strong>Comportamento:</strong> os logs ficam visiveis na area de configuracoes do CRM.</p>
          </div>
        </div>

        <CodeBlockCard title="Curl de webhook n8n" code={`curl -X POST http://localhost:8080/api/webhooks/n8n \\\n  -H "Content-Type: application/json" \\\n  -H "X-Webhook-Secret: YOUR_WEBHOOK_SECRET" \\\n  -d '${webhookExamples.n8n}'`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <CodeBlockCard title="Payload de exemplo do n8n" code={webhookExamples.n8n} />
        <CodeBlockCard title="Payload de exemplo do WhatsApp" code={webhookExamples.whatsapp} />
      </div>
    </div>
  )
}

function N8nTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
        <p className="eyebrow">Workflow pronto</p>
        <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Integracao recomendada</h3>
        <div className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
          <p><strong>Arquivo:</strong> `examples/n8n/focarlab-crm-workflow.json`</p>
          <p><strong>Entrada:</strong> webhook com `eventType` e objeto `data` normalizado.</p>
          <p><strong>Casos comuns:</strong> criar lead, alterar status, disparar automacao e sincronizar mensagens.</p>
          <p><strong>Boas praticas:</strong> envie `externalId`, mantenha idempotencia e sempre repasse o `X-Webhook-Secret`.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <CodeBlockCard title="Evento lead.created" code={webhookExamples.n8n} />
        <CodeBlockCard title="Evento lead.status.updated" code={`{\n  "eventType": "lead.status.updated",\n  "data": {\n    "leadId": "LEAD_ID",\n    "status": "Qualified"\n  }\n}`} />
      </div>
    </div>
  )
}

function AiTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <CodeBlockCard title="Curl de previa com IA" code={curlExamples.aiPreview} />
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
          <p className="eyebrow">Endpoint</p>
          <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">POST /api/automation/ai/preview</h3>
          <div className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
            <p><strong>Auth:</strong> Bearer JWT</p>
            <p><strong>Objetivo:</strong> gerar resposta comercial, resumo de qualificacao e proximo passo recomendado.</p>
            <p><strong>Campos:</strong> `leadId`, `message` e `promptTemplateId` opcional.</p>
            <p><strong>Uso ideal:</strong> SDRs e closers validando abordagem antes de responder no WhatsApp.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {promptExamples.map((prompt) => (
          <div key={prompt.title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
            <p className="eyebrow">{prompt.title}</p>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Exemplo de prompt</h3>
            <div className="mt-6 space-y-4">
              <CodeBlockCard title="System prompt" code={prompt.systemPrompt} compact />
              <CodeBlockCard title="User prompt template" code={prompt.userPrompt} compact />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InfoCard({
  description,
  icon,
  title,
}: {
  description: string
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="panel">
      <div className="inline-flex rounded-2xl bg-orange-100 p-3 text-orange-600">{icon}</div>
      <p className="mt-4 font-heading text-2xl font-semibold text-slate-950">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
    </div>
  )
}

function MiniCard({
  detail,
  icon,
  title,
}: {
  detail: string
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <div className="inline-flex rounded-xl bg-slate-100 p-2 text-slate-700">{icon}</div>
      <p className="mt-3 font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  )
}

function CodeBlockCard({
  code,
  compact = false,
  title,
}: {
  code: string
  compact?: boolean
  title: string
}) {
  return (
    <div className={`rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 ${compact ? '' : 'h-full'}`}>
      <p className="eyebrow">{title}</p>
      <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  )
}

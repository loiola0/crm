import { useEffect, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Bot, ShieldCheck, Webhook } from 'lucide-react'
import { scoringRuleTypes } from '../lib/constants'
import { formatDateTime } from '../lib/format'
import { formatProvider, formatScoringRuleType } from '../lib/labels'
import { createPromptTemplate, getSettingsOverview, saveScoringRules, updatePromptTemplate } from '../services/settings'
import type { LeadScoringRuleRequest, PromptTemplateRequest, ScoringRuleType } from '../types/contracts'

const emptyPromptTemplate: PromptTemplateRequest = {
  name: '',
  description: '',
  systemPrompt: '',
  userPromptTemplate: '',
  isDefault: false,
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: getSettingsOverview,
  })

  const [rules, setRules] = useState<LeadScoringRuleRequest[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  const [promptForm, setPromptForm] = useState<PromptTemplateRequest>(emptyPromptTemplate)

  useEffect(() => {
    if (!settingsQuery.data) {
      return
    }

    setRules(
      settingsQuery.data.scoringRules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        ruleType: rule.ruleType,
        conditionValue: rule.conditionValue,
        threshold: rule.threshold,
        points: rule.points,
        isEnabled: rule.isEnabled,
      })),
    )
  }, [settingsQuery.data])

  const saveRulesMutation = useMutation({
    mutationFn: saveScoringRules,
    onSuccess: () => {
      toast.success('Regras de score salvas.')
      void queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const savePromptMutation = useMutation({
    mutationFn: async () => {
      if (selectedPromptId) {
        return updatePromptTemplate(selectedPromptId, promptForm)
      }

      return createPromptTemplate(promptForm)
    },
    onSuccess: () => {
      toast.success('Template de prompt salvo.')
      setSelectedPromptId(null)
      setPromptForm(emptyPromptTemplate)
      void queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const settings = settingsQuery.data

  if (!settings) {
    return <div className="panel text-sm text-slate-500">Carregando configuracoes...</div>
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow">Configuracao</p>
        <h2 className="mt-2 font-heading text-3xl font-semibold text-slate-950">Controles de automacao e ajustes operacionais</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Ajuste as regras de score, controle prompts da IA e acompanhe os eventos recentes de webhook e IA em um unico painel administrativo.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatusCard
          icon={<Bot className="h-5 w-5" />}
          label="OpenAI"
          value={settings.openAiConfigured ? 'Configurado' : 'Chave ausente'}
          tone={settings.openAiConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
        />
        <StatusCard
          icon={<Webhook className="h-5 w-5" />}
          label="Segredo do webhook"
          value={settings.webhookSecretConfigured ? 'Configurado' : 'Segredo ausente'}
          tone={settings.webhookSecretConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
        />
        <StatusCard icon={<ShieldCheck className="h-5 w-5" />} label="RBAC e JWT" value="Ativado" tone="bg-slate-100 text-slate-700" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Score de lead</p>
                <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Construtor de regras</h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  setRules([
                    ...rules,
                    {
                      name: '',
                      ruleType: 'MessageCountAtLeast',
                      conditionValue: '',
                      threshold: 1,
                      points: 5,
                      isEnabled: true,
                    },
                  ])
                }
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Adicionar regra
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {rules.map((rule, index) => (
                <div key={`${rule.id ?? 'new'}-${index}`} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={rule.name}
                      onChange={(event) => updateRule(index, { name: event.target.value })}
                      placeholder="Nome da regra"
                      className="input-field"
                    />
                    <select
                      value={rule.ruleType}
                      onChange={(event) => updateRule(index, { ruleType: event.target.value as ScoringRuleType })}
                      className="input-field"
                    >
                      {scoringRuleTypes.map((type) => (
                        <option key={type} value={type}>
                          {formatScoringRuleType(type)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <input
                      value={rule.conditionValue ?? ''}
                      onChange={(event) => updateRule(index, { conditionValue: event.target.value })}
                      placeholder="Valor da condicao"
                      className="input-field"
                    />
                    <input
                      type="number"
                      value={rule.threshold}
                      onChange={(event) => updateRule(index, { threshold: Number(event.target.value) })}
                      placeholder="Limite"
                      className="input-field"
                    />
                    <input
                      type="number"
                      value={rule.points}
                      onChange={(event) => updateRule(index, { points: Number(event.target.value) })}
                      placeholder="Pontos"
                      className="input-field"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                      <input
                        checked={rule.isEnabled}
                        onChange={(event) => updateRule(index, { isEnabled: event.target.checked })}
                        type="checkbox"
                      />
                      Ativa
                    </label>
                    <button
                      type="button"
                      onClick={() => setRules(rules.filter((_, itemIndex) => itemIndex !== index))}
                      className="text-sm font-semibold text-rose-600"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => saveRulesMutation.mutate(rules)}
              className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Salvar regras de score
            </button>
          </div>

          <div className="panel">
            <p className="eyebrow">Logs recentes</p>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Trilha de webhook e IA</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-semibold text-slate-900">Webhooks recentes</p>
                <div className="mt-4 space-y-3">
                  {settings.recentWebhookLogs.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-white p-3">
                      <p className="font-semibold text-slate-900">{formatProvider(item.provider)} | {item.eventType}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.success ? 'Sucesso' : item.errorMessage || 'Falhou'}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">{formatDateTime(item.createdAtUtc)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-semibold text-slate-900">Interacoes recentes com IA</p>
                <div className="mt-4 space-y-3">
                  {settings.recentAiLogs.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-white p-3">
                      <p className="font-semibold text-slate-900">{item.promptTemplateName}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.model || 'Sem modelo'} | {item.tokensUsed} tokens</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">{formatDateTime(item.createdAtUtc)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Templates de prompt</p>
                <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Design das respostas com IA</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPromptId(null)
                  setPromptForm(emptyPromptTemplate)
                }}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Novo template
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {settings.promptTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setSelectedPromptId(template.id)
                    setPromptForm({
                      name: template.name,
                      description: template.description,
                      systemPrompt: template.systemPrompt,
                      userPromptTemplate: template.userPromptTemplate,
                      isDefault: template.isDefault,
                    })
                  }}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-300"
                >
                  {template.name}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <input value={promptForm.name} onChange={(event) => setPromptForm({ ...promptForm, name: event.target.value })} placeholder="Nome do template" className="input-field" />
              <input value={promptForm.description} onChange={(event) => setPromptForm({ ...promptForm, description: event.target.value })} placeholder="Descricao" className="input-field" />
              <textarea rows={4} value={promptForm.systemPrompt} onChange={(event) => setPromptForm({ ...promptForm, systemPrompt: event.target.value })} placeholder="System prompt" className="input-field" />
              <textarea rows={6} value={promptForm.userPromptTemplate} onChange={(event) => setPromptForm({ ...promptForm, userPromptTemplate: event.target.value })} placeholder="Template do user prompt com placeholders como {leadName} e {message}" className="input-field" />
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input checked={promptForm.isDefault} onChange={(event) => setPromptForm({ ...promptForm, isDefault: event.target.checked })} type="checkbox" />
                Definir como template padrao
              </label>
              <button type="button" onClick={() => savePromptMutation.mutate()} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Salvar template
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )

  function updateRule(index: number, partial: Partial<LeadScoringRuleRequest>) {
    setRules((currentRules) => currentRules.map((rule, itemIndex) => itemIndex === index ? { ...rule, ...partial } : rule))
  }
}

function StatusCard({
  icon,
  label,
  tone,
  value,
}: {
  icon: ReactNode
  label: string
  tone: string
  value: string
}) {
  return (
    <div className="panel">
      <div className={`inline-flex rounded-2xl p-3 ${tone}`}>{icon}</div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

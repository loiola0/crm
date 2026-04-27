import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Sparkles } from 'lucide-react'
import { previewAiReply } from '../../services/automation'
import type { PromptTemplate } from '../../types/contracts'

export function AiPreviewCard({
  leadId,
  promptTemplates,
}: {
  leadId: string
  promptTemplates: PromptTemplate[]
}) {
  const [message, setMessage] = useState('')
  const [promptTemplateId, setPromptTemplateId] = useState<string | undefined>(promptTemplates[0]?.id)

  useEffect(() => {
    if (!promptTemplateId && promptTemplates.length > 0) {
      setPromptTemplateId(promptTemplates[0].id)
    }
  }, [promptTemplateId, promptTemplates])

  const previewMutation = useMutation({
    mutationFn: previewAiReply,
    onError: () => {
      toast.error('Nao foi possivel gerar a previa com IA.')
    },
  })

  async function handleGenerate() {
    if (!message.trim()) {
      toast.error('Escreva uma mensagem do lead antes de gerar a previa.')
      return
    }

    await previewMutation.mutateAsync({
      leadId,
      message,
      promptTemplateId,
    })
  }

  return (
    <div className="panel">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="eyebrow">Previa OpenAI</p>
          <h3 className="mt-2 font-heading text-xl font-semibold text-slate-950">Resposta comercial com IA</h3>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {promptTemplates.length === 0 ? (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            Ainda nao existe nenhum template de prompt. Peca para um administrador criar isso em Configuracoes.
          </div>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Template de prompt</span>
          <select
            value={promptTemplateId}
            onChange={(event) => setPromptTemplateId(event.target.value)}
            className="input-field"
          >
            {promptTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Mensagem recebida do lead</span>
          <textarea
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ex.: Gostei do curso, mas queria entender prazo e valor."
            className="input-field"
          />
        </label>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={previewMutation.isPending || promptTemplates.length === 0}
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {previewMutation.isPending ? 'Gerando...' : 'Gerar previa com IA'}
        </button>

        {previewMutation.data ? (
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">{previewMutation.data.promptTemplateName}</p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{previewMutation.data.reply}</p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Qualificacao</p>
                <p className="mt-2 text-sm text-slate-600">{previewMutation.data.qualificationSummary}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Proximo passo recomendado</p>
                <p className="mt-2 text-sm text-slate-600">{previewMutation.data.recommendedNextStep}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

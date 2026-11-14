// Biblioteca de hábitos/protocolos + gerenciamento dos templates de mensagem
// por etapa do funil (listar, criar, copiar, abrir no WhatsApp).
import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  habitLibraryService,
  messageTemplatesService,
  Category,
  STAGE_LABELS,
  STAGE_ORDER,
  StageId,
} from '@/services/crm'
import { renderTemplate } from '@/services/templates'
import { Plus, Trash2, Copy, BookOpen, MessageSquareText } from 'lucide-react'
import { WhatsappIcon } from '@/components/whatsapp/WhatsappIcon'
import { waLink } from '@/services/crm'

const CATEGORIES: Array<Category> = [
  'Sono',
  'Alimentação',
  'Movimento',
  'Gestão de Estresse',
]
const CAT_EMOJI: Record<Category, string> = {
  Sono: '😴',
  Alimentação: '🥗',
  Movimento: '🏃',
  'Gestão de Estresse': '🧘',
}

export function HabitsTemplatesPage() {
  return (
    <Tabs defaultValue="habitos" className="space-y-4">
      <TabsList>
        <TabsTrigger value="habitos" className="gap-1.5">
          <BookOpen className="h-4 w-4" /> Biblioteca de hábitos
        </TabsTrigger>
        <TabsTrigger value="templates" className="gap-1.5">
          <MessageSquareText className="h-4 w-4" /> Templates de mensagem
        </TabsTrigger>
      </TabsList>

      <TabsContent value="habitos">
        <HabitLibrary />
      </TabsContent>
      <TabsContent value="templates">
        <TemplatesManager />
      </TabsContent>
    </Tabs>
  )
}

function HabitLibrary() {
  const [habits, setHabits] = useState<
    Array<import('@/services/crm').HabitProtocol>
  >([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('Sono')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setHabits(await habitLibraryService.list())
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const add = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await habitLibraryService.create({
        title: title.trim(),
        category,
        description: description.trim() || undefined,
      })
      setTitle('')
      setDescription('')
      await load()
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    await habitLibraryService.remove(id)
    await load()
  }

  if (loading)
    return <p className="text-sm text-muted-foreground">Carregando hábitos…</p>

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Adicionar hábito/protocolo
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Higiene do sono — luz baixa 1h antes de dormir"
          />
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as Category)}
          >
            <SelectTrigger aria-label="Categoria">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CAT_EMOJI[c]} {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={add} disabled={saving}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
          <Textarea
            className="sm:col-span-3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição do protocolo (opcional)"
            rows={2}
          />
        </CardContent>
      </Card>

      {CATEGORIES.map((cat) => {
        const items = habits.filter((h) => h.category === cat)
        return (
          <div key={cat}>
            <h3 className="mb-2 font-semibold">
              {CAT_EMOJI[cat]} {cat}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                ({items.length})
              </span>
            </h3>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum hábito nesta categoria ainda.
              </p>
            ) : (
              <Accordion type="multiple" className="w-full">
                {items.map((h) => (
                  <AccordionItem key={h.id} value={h.id}>
                    <AccordionTrigger>{h.title}</AccordionTrigger>
                    <AccordionContent>
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                          {h.description || 'Sem descrição.'}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(h.id)}
                          aria-label={`Remover ${h.title}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TemplatesManager() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<
    Array<import('@/services/crm').MessageTemplate>
  >([])
  const [loading, setLoading] = useState(true)
  const [newTpl, setNewTpl] = useState({
    stage: 'lead_frio' as StageId,
    title: '',
    body: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      setTemplates(await messageTemplatesService.list())
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: 'Copiado!',
        description: 'Modelo copiado para a área de transferência.',
      })
    } catch {
      toast({ title: 'Não foi possível copiar', variant: 'destructive' })
    }
  }

  const add = async () => {
    if (!newTpl.title.trim() || !newTpl.body.trim()) return
    await messageTemplatesService.create({
      stage: newTpl.stage,
      title: newTpl.title.trim(),
      body: newTpl.body.trim(),
    })
    setNewTpl({ stage: 'lead_frio', title: '', body: '' })
    await load()
  }

  const remove = async (id: string) => {
    await messageTemplatesService.remove(id)
    await load()
  }

  if (loading)
    return (
      <p className="text-sm text-muted-foreground">Carregando templates…</p>
    )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Novo template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
            <Select
              value={newTpl.stage}
              onValueChange={(v) =>
                setNewTpl((t) => ({ ...t, stage: v as StageId }))
              }
            >
              <SelectTrigger aria-label="Etapa">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGE_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={newTpl.title}
              onChange={(e) =>
                setNewTpl((t) => ({ ...t, title: e.target.value }))
              }
              placeholder="Título do modelo (ex.: Primeiro contato — WhatsApp)"
            />
          </div>
          <Textarea
            value={newTpl.body}
            onChange={(e) => setNewTpl((t) => ({ ...t, body: e.target.value }))}
            rows={3}
            placeholder={
              'Mensagem. Use variáveis: {{nome}}, {{queixa}}, {{data}}, {{hora}}, {{ciclo}}.'
            }
          />
          <Button onClick={add}>
            <Plus className="mr-1 h-4 w-4" /> Salvar template
          </Button>
        </CardContent>
      </Card>

      {STAGE_ORDER.map((stage) => {
        const items = templates.filter((t) => t.stage === stage)
        return (
          <div key={stage}>
            <h3 className="mb-2 font-semibold">
              {STAGE_LABELS[stage]}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                ({items.length})
              </span>
            </h3>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum modelo para esta etapa.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((t) => (
                  <Card key={t.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{t.title}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                            {t.body}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copy(t.body)}
                            aria-label="Copiar mensagem"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-[#25D366] hover:text-[#1eb856]"
                            onClick={() =>
                              window.open(
                                waLink(
                                  '',
                                  renderTemplate(t.body, { nome: 'Paciente' }),
                                ),
                                '_blank',
                              )
                            }
                            aria-label="Abrir no WhatsApp"
                          >
                            <WhatsappIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(t.id)}
                            aria-label="Remover template"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )
      })}
      <p className="text-xs text-muted-foreground">
        A integração com a API oficial da Meta (WhatsApp Business) ficará para
        uma fase futura — hoje o envio é manual via wa.me.
      </p>
    </div>
  )
}

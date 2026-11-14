// Diálogo para cadastrar um novo lead manualmente no CRM.
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import {
  leadsService,
  LeadSource,
  STAGE_LABELS,
  STAGE_ORDER,
  StageId,
} from '@/services/crm'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultStage?: StageId
}

export function NewLeadDialog({
  open,
  onOpenChange,
  defaultStage = 'lead_frio',
}: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    mainComplaint: '',
    source: 'Instagram' as LeadSource,
    stage: defaultStage as StageId,
  })

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Informe ao menos nome e telefone/WhatsApp.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await leadsService.create({
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, ''),
        email: form.email || undefined,
        main_complaint: form.mainComplaint || undefined,
        source: form.source,
        stage: form.stage,
      })
      onOpenChange(false)
      setForm({
        name: '',
        phone: '',
        email: '',
        mainComplaint: '',
        source: 'Instagram',
        stage: 'lead_frio',
      })
    } catch (err) {
      setError(leadsService.error(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo lead</DialogTitle>
          <DialogDescription>
            Cadastre um contato no funil. O estágio inicial padrão é "Lead
            Frio".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="nl-name">Nome</Label>
            <Input
              id="nl-name"
              value={form.name}
              onChange={(e) => set('name')(e.target.value)}
              placeholder="Nome do paciente"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nl-phone">Telefone/WhatsApp</Label>
            <Input
              id="nl-phone"
              value={form.phone}
              onChange={(e) => set('phone')(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nl-email">E-mail (opcional)</Label>
            <Input
              id="nl-email"
              type="email"
              value={form.email}
              onChange={(e) => set('email')(e.target.value)}
              placeholder="voce@email.com"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nl-complaint">Principal queixa/objetivo</Label>
            <Textarea
              id="nl-complaint"
              rows={2}
              value={form.mainComplaint}
              onChange={(e) => set('mainComplaint')(e.target.value)}
              placeholder="Ex.: dor lombar há 2 anos..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Origem</Label>
              <Select
                value={form.source}
                onValueChange={(v) => set('source')(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Google">Google</SelectItem>
                  <SelectItem value="Indicação">Indicação</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Estágio inicial</Label>
              <Select value={form.stage} onValueChange={(v) => set('stage')(v)}>
                <SelectTrigger>
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
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

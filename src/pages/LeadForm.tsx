// Formulário de captação de leads da landing page (nome, WhatsApp, e-mail,
// queixa, origem). Cria um registro na collection `leads` com estágio "Lead Frio".
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { leadsService, LeadSource, waLink } from '@/services/crm'

const formSchema = z.object({
  name: z.string().min(2, 'Informe seu nome completo'),
  phone: z
    .string()
    .min(10, 'Informe um WhatsApp válido com DDD')
    .max(20, 'Número muito longo'),
  email: z.string().email('E-mail inválido').or(z.literal('')),
  mainComplaint: z.string().min(5, 'Conte brevemente sua queixa ou objetivo'),
  source: z.enum(['Instagram', 'Google', 'Indicação', 'Outro']),
})

type FormValues = z.infer<typeof formSchema>

const SOURCE_OPTIONS: Array<{ value: FormValues['source']; label: string }> = [
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Google', label: 'Google' },
  { value: 'Indicação', label: 'Indicação' },
  { value: 'Outro', label: 'Outro' },
]

export function LeadForm() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [savedName, setSavedName] = useState('')

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      mainComplaint: '',
      source: 'Instagram',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      await leadsService.create({
        name: values.name,
        phone: values.phone.replace(/\D/g, ''),
        email: values.email || undefined,
        main_complaint: values.mainComplaint,
        source: values.source as LeadSource,
      })
      setSavedName(values.name.split(' ')[0])
      setSubmitted(true)
    } catch (err) {
      setServerError(leadsService.error(err))
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center space-y-4">
        <Send className="mx-auto h-10 w-10 text-primary" />
        <h3 className="text-xl font-semibold">
          Recebemos seu contato, {savedName}!
        </h3>
        <p className="text-muted-foreground">
          Nossa equipe entrará em contato pelo WhatsApp em até 1 dia útil. Se
          preferir, fale com a gente agora mesmo.
        </p>
        <Button asChild className="bg-[#25D366] hover:bg-[#1eb856] text-white">
          <a
            href={waLink('5511996522323')}
            target="_blank"
            rel="noopener noreferrer"
          >
            Falar no WhatsApp
          </a>
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo</FormLabel>
                <FormControl>
                  <Input placeholder="Maria da Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp</FormLabel>
                <FormControl>
                  <Input
                    placeholder="(11) 99999-9999"
                    inputMode="tel"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail (opcional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="voce@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mainComplaint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Principal queixa ou objetivo</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex.: dor lombar há 2 anos que me impede de caminhar..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Como nos conheceu?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…
            </>
          ) : (
            'Quero agendar minha avaliação'
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Seus dados são confidenciais e usados apenas para contato sobre o seu
          tratamento.
        </p>
      </form>
    </Form>
  )
}

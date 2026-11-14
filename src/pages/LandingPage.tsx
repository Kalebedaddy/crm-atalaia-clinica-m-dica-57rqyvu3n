import { useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { LeadForm } from './LeadForm'
import { WhatsappIcon } from '@/components/whatsapp/WhatsappIcon'
import { waLink } from '@/services/crm'
import {
  Stethoscope,
  Sparkles,
  Activity,
  HeartPulse,
  BrainCircuit,
  Leaf,
  CalendarCheck,
  ClipboardList,
  ArrowRight,
  Star,
  Quote,
  CheckCircle2,
} from 'lucide-react'

const DOCTOR_PHOTO =
  'https://static.wixstatic.com/media/9b959a_5f57d46d877e4294903e88c487828618~mv2.jpg/v1/crop/x_0,y_198,w_2252,h_3603/fill/w_800,h_1280,al_c,q_85,enc_avif/20250405_152340.jpg'
const CLINIC_PHOTO =
  'https://static.wixstatic.com/media/9b959a_853a2df2a06d42198c258f88888c9a27~mv2.jpg/v1/fill/w_800,h_1028,al_c,q_85,enc_avif/imagem%20dr%20kleber%20Gratid%C3%A3o_edited.jpg'
const WHATSAPP = '5511996522323'

const scrollTo = (id: string) => {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const specialties = [
  {
    icon: Stethoscope,
    title: 'Ortopedia Integrativa',
    text: 'Diagnóstico preciso e tratamento moderno para lesões articulares, musculares e ósseas — com o menor impacto possível na sua rotina.',
  },
  {
    icon: Activity,
    title: 'Acupuntura Médica',
    text: 'Estímulo de pontos específicos com agulhas finas para aliviar a dor, equilibrar o corpo e melhorar a saúde geral, em conjunto com a medicina convencional.',
  },
  {
    icon: BrainCircuit,
    title: 'Medicina da Dor',
    text: 'Diagnóstico e tratamento da dor crônica com medicamentos, terapias físicas e intervenções minimamente invasivas para devolver qualidade de vida.',
  },
  {
    icon: Leaf,
    title: 'Prescrição baseada no Sistema Endocanabinoide',
    text: 'Modulação com fitocanabinoides para dores crônicas, sono, humor e imunidade, com eficácia comprovada em estudos clínicos.',
  },
  {
    icon: Sparkles,
    title: 'Ortopedia Integrativa & Aromaterapia',
    text: 'Abordagens complementares e naturais para o manejo de dores crônicas, promovendo alívio e bem-estar duradouros.',
  },
  {
    icon: HeartPulse,
    title: 'Estilo de Vida & Mapa da Saúde Life Up',
    text: 'Avaliação completa integrativa de sono, alimentação, movimento e gestão de estresse — a base dos nossos planos de acompanhamento.',
  },
]

const methodologyPillars = [
  {
    icon: ClipboardList,
    title: '1. Avaliação Completa Integrativa',
    text: 'O Mapa da Saúde Life Up investiga suas dores, seus hábitos e sua rotina — sono, alimentação, movimento e gestão de estresse — para achar a causa, não só o sintoma.',
  },
  {
    icon: Activity,
    title: '2. Diagnóstico e Tratamento',
    text: 'Ortopedia, acupuntura médica e medicina da dor combinadas em um plano de tratamento conservador e minimamente invasivo, feito sob medida.',
  },
  {
    icon: CalendarCheck,
    title: '3. Acompanhamento Longitudinal',
    text: 'Planos de 6, 8, 12 ou 24 semanas com protocolos de hábitos e check-ins semanais, acompanhando sua evolução de perto até o resultado sustentável.',
  },
]

const testimonials = [
  {
    name: 'Marta R.',
    text: 'Depois de anos convivendo com dor no joelho e já pensando em cirurgia, o Dr. Kleber montou um plano que resolveu sem operar. Hoje caminho sem dor.',
  },
  {
    name: 'João P.',
    text: 'O acompanhamento semanal faz toda a diferença. Ele não só trata a dor, ele cuida de você como um todo — sono, alimentação, tudo.',
  },
  {
    name: 'Cláudia M.',
    text: 'Avaliação super completa e humanizada. Pela primeira vez alguém olhou as causas da minha dor, não só o sintoma. Recomendo de olhos fechados.',
  },
  {
    name: 'Roberto S.',
    text: 'A acupuntura médica aliada à ortopedia me devolveu a qualidade de vida. Em poucas semanas, voltei a treinar sem dores.',
  },
]

const faqs = [
  {
    q: 'O que é Ortopedia Integrativa?',
    a: 'É a combinação do rigor técnico da ortopedia com abordagens complementares — acupuntura médica, medicina da dor e medicina de estilo de vida — para tratar a causa da dor e não apenas o sintoma.',
  },
  {
    q: 'O que é o Mapa da Saúde Life Up?',
    a: 'É a nossa metodologia de avaliação completa integrativa: mapeamos sono, alimentação, movimento e gestão de estresse junto do diagnóstico ortopédico, e a partir daí montamos um plano de acompanhamento longitudinal de 6, 8, 12 ou 24 semanas.',
  },
  {
    q: 'Preciso de encaminhamento para agendar?',
    a: 'Não. O atendimento é particular e você pode agendar diretamente pelo WhatsApp ou pelo formulário desta página.',
  },
  {
    q: 'Como funciona a primeira consulta?',
    a: 'A avaliação completa integrativa dura cerca de 60 minutos: histórico detalhado, exame físico e construção do seu Mapa da Saúde, com plano de tratamento personalizado.',
  },
  {
    q: 'O atendimento é particular ou convênio?',
    a: 'O modelo é 100% particular. Isso garante consultas sem pressa, acompanhamento próximo e um plano realmente individualizado.',
  },
  {
    q: 'Quanto tempo leva para sentir resultado?',
    a: 'Depende de cada quadro — muitos pacientes relatam melhora já nas primeiras semanas. O plano de acompanhamento é justamente para sustentar esse resultado de vez.',
  },
]

export default function LandingPage() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname !== '/') return
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <a href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              KB
            </span>
            <span className="hidden sm:inline">Dr. Kleber Barbosa</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <button
              onClick={() => scrollTo('sobre')}
              className="text-muted-foreground hover:text-foreground"
            >
              Sobre
            </button>
            <button
              onClick={() => scrollTo('especialidades')}
              className="text-muted-foreground hover:text-foreground"
            >
              Especialidades
            </button>
            <button
              onClick={() => scrollTo('metodologia')}
              className="text-muted-foreground hover:text-foreground"
            >
              Metodologia
            </button>
            <button
              onClick={() => scrollTo('depoimentos')}
              className="text-muted-foreground hover:text-foreground"
            >
              Depoimentos
            </button>
            <button
              onClick={() => scrollTo('faq')}
              className="text-muted-foreground hover:text-foreground"
            >
              FAQ
            </button>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="bg-primary text-primary-foreground shadow-md"
            >
              <Link to="/crm">
                <Stethoscope className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Área do médico</span>
                <span className="sm:hidden">CRM</span>
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-[#25D366] hover:bg-[#1eb856] text-white"
            >
              <a
                href={waLink(
                  WHATSAPP,
                  'Olá! Eu gostaria de agendar uma avaliação com o Dr. Kleber Barbosa.',
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsappIcon className="mr-1 h-4 w-4" /> Agendar
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div className="space-y-6 animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Ortopedia Integrativa ·
              Acupuntura Médica · Medicina da Dor
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Resolva suas dores crônicas
              <span className="block text-primary">de uma vez por todas</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              O Dr. Kleber Barbosa combina a precisão da ortopedia com a visão
              integrativa da acupuntura e do estilo de vida para investigar a
              causa da sua dor — e não apenas o sintoma.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => scrollTo('captacao')}>
                Quero agendar minha avaliação{' '}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-[#25D366] hover:bg-[#1eb856] text-white border-transparent"
              >
                <a
                  href={waLink(
                    WHATSAPP,
                    'Olá! Eu gostaria de agendar um atendimento com o Dr. Kleber Barbosa.',
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsappIcon className="mr-2 h-5 w-5" /> WhatsApp
                </a>
              </Button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> CRM 99463
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> RQE
                23472/23473
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Atendimento
                particular
              </span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div
              className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl"
              aria-hidden
            />
            <img
              src={DOCTOR_PHOTO}
              alt="Dr. Kleber Barbosa, médico ortopedista e acupunturista"
              className="relative w-full rounded-3xl object-cover shadow-2xl aspect-[3/4]"
            />
            <div className="absolute -bottom-4 -left-4 rounded-2xl border bg-white p-4 shadow-xl">
              <p className="text-xs text-muted-foreground">
                Metodologia própria
              </p>
              <p className="text-sm font-semibold">Mapa da Saúde Life Up</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="mx-auto max-w-6xl px-4 py-16 scroll-mt-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <img
              src={CLINIC_PHOTO}
              alt="Dr. Kleber Barbosa"
              className="w-full rounded-3xl object-cover shadow-xl aspect-[4/5]"
            />
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Sobre o médico
            </span>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Conheça o Dr. Kleber Barbosa
            </h2>
            <p className="text-muted-foreground">
              Com uma trajetória dedicada à saúde musculoesquelética e ao alívio
              da dor, o Dr. Kleber Barbosa combina o conhecimento técnico
              rigoroso da Ortopedia com a visão integrativa da Acupuntura.
            </p>
            <p className="text-muted-foreground">
              Seu objetivo é oferecer um tratamento que não apenas trate os
              sintomas, mas que investigue as causas subjacentes — promovendo
              uma recuperação sustentável e melhorando a qualidade de vida de
              forma global.
            </p>
            <ul className="space-y-3">
              {[
                'Especialista em Ortopedia e Traumatologia',
                'Formação avançada em Acupuntura Médica',
                'Atendimento personalizado e humanizado',
                'Foco em tratamentos conservadores e minimamente invasivos',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Especialidades */}
      <section id="especialidades" className="bg-muted/40 py-16 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Áreas de atuação
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Especialidades e tratamentos
            </h2>
            <p className="mt-3 text-muted-foreground">
              Uma abordagem completa para dores crônicas e saúde
              musculoesquelética, com tratamentos conservadores e minimamente
              invasivos.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {specialties.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Metodologia */}
      <section
        id="metodologia"
        className="mx-auto max-w-6xl px-4 py-16 scroll-mt-20"
      >
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Metodologia integrativa
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Mapa da Saúde Life Up
          </h2>
          <p className="mt-3 text-muted-foreground">
            Nossa metodologia própria mapeia sua saúde por inteiro e transforma
            o diagnóstico em um plano de acompanhamento com hábitos e metas —
            para que o resultado dure, e não apenas alivie.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {methodologyPillars.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">
            Planos de acompanhamento longitudinal
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Protocolos personalizados de sono, alimentação, movimento e gestão
            de estresse, com check-ins semanais.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {['6 semanas', '8 semanas', '12 semanas', '24 semanas'].map((c) => (
              <span
                key={c}
                className="rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="bg-muted/40 py-16 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Depoimentos
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Histórias de quem já viveu sem dor
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="flex flex-col rounded-2xl border bg-white p-6 shadow-sm"
              >
                <Quote className="h-6 w-6 text-primary/40" />
                <p className="mt-3 flex-1 text-sm text-muted-foreground">
                  “{t.text}”
                </p>
                <div className="mt-4 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm font-medium">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 scroll-mt-20">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Perguntas frequentes
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Dúvidas sobre o atendimento
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-8">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-medium">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Formulário de captação */}
      <section id="captacao" className="bg-primary py-16 scroll-mt-20">
        <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-2">
          <div className="space-y-4 text-primary-foreground">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Agende sua avaliação completa integrativa
            </h2>
            <p className="text-primary-foreground/80">
              Preencha o formulário e nossa equipe entra em contato pelo
              WhatsApp para agendar sua consulta com o Dr. Kleber Barbosa.
              Atendimento 100% particular, sem fila de espera.
            </p>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Avaliação de cerca de 60
                minutos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Mapa da Saúde Life Up
                personalizado
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Planos de 6 a 24 semanas
                com check-in semanal
              </li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <LeadForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-4 text-sm text-muted-foreground">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <p className="font-semibold text-foreground">
                Dr. Kleber Barbosa
              </p>
              <p>
                Médico Ortopedista e Acupunturista · CRM 99463 · RQE 23472/23473
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="bg-[#25D366] hover:bg-[#1eb856] text-white"
            >
              <a
                href={waLink(
                  WHATSAPP,
                  'Olá! Gostaria de agendar uma avaliação com o Dr. Kleber Barbosa.',
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsappIcon className="mr-1 h-4 w-4" /> Agende sua consulta
              </a>
            </Button>
          </div>
        </div>
      </footer>

      {/* Botão flutuante de WhatsApp */}
      <a
        href={waLink(
          WHATSAPP,
          'Olá! Gostaria de agendar uma avaliação com o Dr. Kleber Barbosa.',
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] transition-transform hover:-translate-y-1"
        aria-label="Falar no WhatsApp"
      >
        <WhatsappIcon className="h-7 w-7" />
      </a>

      {/* Botão fixo de acesso ao CRM — sempre visível durante o scroll */}
      <Link
        to="/crm"
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_4px_14px_0_rgba(0,0,0,0.3)] ring-2 ring-primary/30 transition-transform hover:-translate-y-1"
        aria-label="Ir para a Área do médico (CRM)"
      >
        <Stethoscope className="h-5 w-5" />
        <span>Área do médico</span>
      </Link>
    </div>
  )
}

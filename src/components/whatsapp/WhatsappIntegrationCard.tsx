import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import useWhatsappStore from '@/stores/useWhatsappStore'
import { CheckCircle2, MessageCircle } from 'lucide-react'
import { WhatsappIcon } from './WhatsappIcon'

const formSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'O número é obrigatório')
    .regex(
      /^\+?[1-9]\d{7,14}$/,
      'Formato inválido. Use código do país e número (ex: 5511999999999)',
    ),
})

export function WhatsappIntegrationCard() {
  const { isConnected, phoneNumber, connect, disconnect } = useWhatsappStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: '',
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    connect(values.phoneNumber)
  }

  const handleStartChat = () => {
    if (phoneNumber) {
      window.open(
        `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`,
        '_blank',
      )
    }
  }

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <WhatsappIcon className="h-5 w-5 text-green-500" />
          WhatsApp Business
        </CardTitle>
        <CardDescription>
          Integre seu número para iniciar conversas rápidas.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        {isConnected ? (
          <div className="flex items-center gap-3 bg-green-50/50 text-green-800 p-3 rounded-lg border border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Conectado</span>
              <span className="text-xs text-green-700/80 font-medium">
                {phoneNumber}
              </span>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do WhatsApp</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+55 11 99999-9999"
                        className="rounded-md bg-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
              >
                Conectar WhatsApp
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      {isConnected && (
        <CardFooter className="flex gap-3 pt-0">
          <Button
            onClick={handleStartChat}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Iniciar Chat
          </Button>
          <Button
            variant="outline"
            onClick={disconnect}
            className="flex-none text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50 hover:border-red-300 rounded-md font-medium"
          >
            Desconectar
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

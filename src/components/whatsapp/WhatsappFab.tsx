import { Button } from '@/components/ui/button'
import useWhatsappStore from '@/stores/useWhatsappStore'
import { WhatsappIcon } from './WhatsappIcon'

export function WhatsappFab() {
  const { isConnected, phoneNumber } = useWhatsappStore()

  if (!isConnected || !phoneNumber) return null

  const handleStartChat = () => {
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`, '_blank')
  }

  return (
    <Button
      size="icon"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.23)] hover:-translate-y-1 transition-all duration-300 z-50"
      onClick={handleStartChat}
      title="Iniciar conversa no WhatsApp"
    >
      <WhatsappIcon className="h-7 w-7 text-white" />
    </Button>
  )
}

import { createContext, useContext, useState, ReactNode } from 'react'

interface WhatsappContextType {
  phoneNumber: string | null
  isConnected: boolean
  connect: (number: string) => void
  disconnect: () => void
}

const WhatsappContext = createContext<WhatsappContextType | undefined>(
  undefined,
)

export const WhatsappProvider = ({ children }: { children: ReactNode }) => {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const connect = (number: string) => {
    setPhoneNumber(number)
    setIsConnected(true)
  }

  const disconnect = () => {
    setPhoneNumber(null)
    setIsConnected(false)
  }

  return (
    <WhatsappContext.Provider
      value={{ phoneNumber, isConnected, connect, disconnect }}
    >
      {children}
    </WhatsappContext.Provider>
  )
}

const useWhatsappStore = () => {
  const context = useContext(WhatsappContext)
  if (!context) {
    throw new Error('useWhatsappStore must be used within a WhatsappProvider')
  }
  return context
}

export default useWhatsappStore

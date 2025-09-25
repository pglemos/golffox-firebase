'use client'

import PassengerApp from '../../views/PassengerApp'
import { useAppContext } from '../providers'

export default function PassageiroPage() {
  const { employees } = useAppContext()

  return (
    <div className="h-screen w-screen">
      <PassengerApp employees={employees} />
    </div>
  )
}
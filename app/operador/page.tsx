'use client'

import ClientPortal from '../../views/ClientPortal'
import { useAppContext } from '../providers'

export default function OperadorPage() {
  const {
    employees,
    setEmployees,
    companies,
    permissionProfiles,
  } = useAppContext()

  return (
    <div className="h-screen w-screen">
      <ClientPortal 
        employees={employees} 
        setEmployees={setEmployees}
        companies={companies}
        permissionProfiles={permissionProfiles}
      />
    </div>
  )
}
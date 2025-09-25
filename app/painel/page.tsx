'use client'

import ManagementPanel from '../../views/ManagementPanel'
import { useAppContext } from '../providers'

export default function PainelPage() {
  const {
    routes,
    setRoutes,
    companies,
    setCompanies,
    employees,
    setEmployees,
    permissionProfiles,
    setPermissionProfiles,
  } = useAppContext()

  return (
    <div className="h-screen w-screen">
      <ManagementPanel 
        routes={routes} 
        setRoutes={setRoutes}
        companies={companies} 
        setCompanies={setCompanies}
        employees={employees} 
        setEmployees={setEmployees}
        permissionProfiles={permissionProfiles}
        setPermissionProfiles={setPermissionProfiles}
      />
    </div>
  )
}
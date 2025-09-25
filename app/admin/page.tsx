'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import AdminPanel from '../../components/AdminPanel'

export default function AdminPage() {
  return (
    <div className="h-screen w-screen">
      <ProtectedRoute>
        <AdminPanel />
      </ProtectedRoute>
    </div>
  )
}
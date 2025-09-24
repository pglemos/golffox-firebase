import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const authStatus = localStorage.getItem('adminAuthenticated');
    setIsAuthenticated(authStatus === 'true');
  }, []);

  const handleLogin = (success: boolean) => {
    setIsAuthenticated(success);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    setIsAuthenticated(false);
  };

  // Mostrar loading enquanto verifica autenticação
  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  // Se autenticado, mostrar conteúdo protegido com opção de logout
  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center">
        <span className="text-sm font-medium">Área Administrativa - Golffox</span>
        <button
          onClick={handleLogout}
          className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-sm"
        >
          Sair
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default ProtectedRoute;
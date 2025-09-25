import React from 'react';
import Link from 'next/link';

const HomePage: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full mx-4">
        <div className="text-center mb-8">
          <img 
            src="/assets/golffox-logo.svg" 
            alt="Golffox Logo" 
            className="h-20 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Sistema Golffox</h1>
          <p className="text-gray-600">Selecione o módulo que deseja acessar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/painel"
            className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg text-center transition-colors duration-200 block"
          >
            <div className="text-xl font-semibold mb-2">Painel de Gestão</div>
            <div className="text-sm opacity-90">Sistema completo de gestão Golffox</div>
          </Link>

          <Link
            href="/motorista"
            className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg text-center transition-colors duration-200 block"
          >
            <div className="text-xl font-semibold mb-2">App do Motorista</div>
            <div className="text-sm opacity-90">Interface para motoristas</div>
          </Link>

          <Link
            href="/passageiro"
            className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg text-center transition-colors duration-200 block"
          >
            <div className="text-xl font-semibold mb-2">App do Passageiro</div>
            <div className="text-sm opacity-90">Interface para passageiros</div>
          </Link>

          <Link
            href="/operador"
            className="bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-lg text-center transition-colors duration-200 block"
          >
            <div className="text-xl font-semibold mb-2">Portal do Operador</div>
            <div className="text-sm opacity-90">Interface para operadores</div>
          </Link>
        </div>

        <div className="text-center">
          <Link
            href="/admin"
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Área Administrativa
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
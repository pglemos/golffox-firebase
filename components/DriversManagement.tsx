import React from 'react';
import { MOCK_DRIVERS } from '../constants';
import type { Driver } from '../types';
import { PlusCircleIcon, DocumentTextIcon } from './icons/Icons';

const getStatusClass = (status: 'Disponível' | 'Em Rota' | 'Indisponível') => {
  switch (status) {
    case 'Disponível':
      return 'bg-green-100 text-green-800';
    case 'Em Rota':
      return 'bg-blue-100 text-blue-800';
    case 'Indisponível':
      return 'bg-gray-200 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const DriversManagement: React.FC = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-golffox-gray-dark">Gerenciamento de Motoristas</h2>
        <button className="bg-golffox-orange-primary text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-orange-600 transition-colors">
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Cadastrar Motorista
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_DRIVERS.map((driver: Driver) => (
          <div key={driver.id} className="bg-white rounded-lg shadow-md p-5 flex flex-col items-center text-center">
            <img src={driver.photoUrl} alt={driver.name} className="w-24 h-24 rounded-full mb-4 border-4 border-golffox-gray-light" />
            <h3 className="text-xl font-bold text-golffox-gray-dark">{driver.name}</h3>
            <p className="text-sm text-golffox-gray-medium mb-2">CNH: {driver.cnh}</p>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(driver.status)} mb-4`}>
                {driver.status}
            </span>
            <button className="w-full mt-auto bg-golffox-gray-light hover:bg-gray-200 text-golffox-gray-dark font-semibold py-2 px-4 rounded-lg flex items-center justify-center text-sm transition-colors">
                <DocumentTextIcon className="h-4 w-4 mr-2"/>
                Ver Anexo CNH
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DriversManagement;
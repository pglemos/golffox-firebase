import React from 'react';
import { MOCK_VEHICLES } from '../constants';
import type { Vehicle } from '../types';
import { VehicleStatus } from '../types';
import { PlusCircleIcon, WrenchScrewdriverIcon, PencilIcon, TrashIcon } from './icons/Icons';

const getStatusClass = (status: VehicleStatus) => {
  switch (status) {
    case VehicleStatus.Moving:
      return 'bg-green-100 text-green-800';
    case VehicleStatus.Stopped:
      return 'bg-yellow-100 text-yellow-800';
    case VehicleStatus.Problem:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const VehiclesManagement: React.FC = () => {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h2 className="text-2xl sm:text-3xl font-bold text-golffox-gray-dark">Gerenciamento de Veículos</h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <button className="bg-golffox-blue-light text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-golffox-blue-dark transition-colors touch-manipulation no-tap-highlight min-h-[44px]">
              <WrenchScrewdriverIcon className="h-5 w-5 mr-2" />
              <span className="text-sm sm:text-base">Agendar Manutenção</span>
            </button>
            <button className="bg-golffox-orange-primary text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-orange-600 transition-colors touch-manipulation no-tap-highlight min-h-[44px]">
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              <span className="text-sm sm:text-base">Cadastrar Veículo</span>
            </button>
        </div>
      </div>
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-golffox-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-golffox-blue-dark text-white">
            <tr>
              <th className="py-3 px-6 text-left font-semibold">Placa</th>
              <th className="py-3 px-6 text-left font-semibold">Modelo</th>
              <th className="py-3 px-6 text-left font-semibold">Motorista Atual</th>
              <th className="py-3 px-6 text-center font-semibold">Status</th>
              <th className="py-3 px-6 text-left font-semibold">Última Manutenção</th>
              <th className="py-3 px-6 text-left font-semibold">Próxima Manutenção</th>
              <th className="py-3 px-6 text-center font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="text-golffox-gray-medium">
            {MOCK_VEHICLES.filter(vehicle => vehicle.isRegistered === true).map((vehicle: Vehicle, index: number) => (
              <tr key={vehicle.id} className={index % 2 === 0 ? 'bg-white' : 'bg-golffox-gray-light'}>
                <td className="py-4 px-6 font-bold text-golffox-gray-dark">{vehicle.plate}</td>
                <td className="py-4 px-6">{vehicle.model}</td>
                <td className="py-4 px-6">{vehicle.driver}</td>
                <td className="py-4 px-6 text-center">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(vehicle.status)}`}>
                    {vehicle.status}
                  </span>
                </td>
                <td className="py-4 px-6">{new Date(vehicle.lastMaintenance).toLocaleDateString()}</td>
                <td className="py-4 px-6">{new Date(vehicle.nextMaintenance).toLocaleDateString()}</td>
                <td className="py-4 px-6 text-center">
                  <div className="flex justify-center items-center space-x-2">
                    <button className="text-golffox-blue-light hover:text-golffox-blue-dark p-1" title="Editar Veículo">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button className="text-golffox-red hover:text-red-700 p-1" title="Excluir Veículo">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {MOCK_VEHICLES.filter(vehicle => vehicle.isRegistered === true).map((vehicle: Vehicle) => (
          <div key={vehicle.id} className="bg-white rounded-lg shadow-md p-4 border border-golffox-gray-light">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-golffox-gray-dark">{vehicle.plate}</h3>
                <p className="text-sm text-golffox-gray-medium">{vehicle.model}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(vehicle.status)}`}>
                {vehicle.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-golffox-gray-dark">Motorista:</span>
                <span className="text-sm text-golffox-gray-medium">{vehicle.driver}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-golffox-gray-dark">Última Manutenção:</span>
                <span className="text-sm text-golffox-gray-medium">{new Date(vehicle.lastMaintenance).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-golffox-gray-dark">Próxima Manutenção:</span>
                <span className="text-sm text-golffox-gray-medium">{new Date(vehicle.nextMaintenance).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-3 border-t border-golffox-gray-light">
              <button className="text-golffox-blue-light hover:text-golffox-blue-dark p-2 touch-manipulation no-tap-highlight" title="Editar Veículo">
                <PencilIcon className="h-5 w-5" />
              </button>
              <button className="text-golffox-red hover:text-red-700 p-2 touch-manipulation no-tap-highlight" title="Excluir Veículo">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehiclesManagement;
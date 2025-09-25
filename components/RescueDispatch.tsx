import React, { useState } from 'react';
import { MOCK_ROUTES, MOCK_DRIVERS, MOCK_VEHICLES } from '../constants';
import { RouteStatus } from '../types';
import { LifebuoyIcon, PaperAirplaneIcon } from './icons/Icons';

const RescueDispatch: React.FC = () => {
  const routesWithProblems = MOCK_ROUTES.filter(r => r.status === RouteStatus.Problem);
  const availableDrivers = MOCK_DRIVERS.filter(d => d.status === 'Ativo');
  // Simple check for available vehicles (not currently on a problem route)
  const problemRouteVehiclePlates = routesWithProblems.map(r => r.vehicle);
  const availableVehicles = MOCK_VEHICLES.filter(v => v.isRegistered === true && !problemRouteVehiclePlates.includes(v.plate));

  const [selectedRoute, setSelectedRoute] = useState<string>(routesWithProblems[0]?.id || '');

  return (
    <div>
      <div className="flex items-center mb-6">
        <LifebuoyIcon className="h-8 w-8 mr-3 text-golffox-red" />
        <h2 className="text-3xl font-bold text-golffox-gray-dark">Despacho de Socorro</h2>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <p className="text-golffox-gray-medium mb-6">
          Utilize este painel para enviar um motorista e veículo de socorro para uma rota que apresentou problemas.
        </p>

        <div className="space-y-6">
          <div>
            <label htmlFor="problem-route" className="block text-sm font-bold text-golffox-gray-dark mb-1">1. Selecione a Rota com Problema</label>
            <select
              id="problem-route"
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="w-full p-3 bg-red-50 border border-golffox-red/50 rounded-md focus:ring-2 focus:ring-golffox-red focus:outline-none"
            >
              {routesWithProblems.length > 0 ? (
                routesWithProblems.map(route => (
                  <option key={route.id} value={route.id}>
                    {route.name} (Veículo: {route.vehicle} / Motorista: {route.driver})
                  </option>
                ))
              ) : (
                <option disabled>Nenhuma rota com problema</option>
              )}
            </select>
          </div>

          <div>
            <label htmlFor="rescue-driver" className="block text-sm font-bold text-golffox-gray-dark mb-1">2. Escolha o Motorista de Socorro</label>
            <select id="rescue-driver" className="w-full p-3 border border-golffox-gray-light rounded-md focus:ring-2 focus:ring-golffox-orange-primary focus:outline-none">
              {availableDrivers.map(driver => (
                <option key={driver.id} value={driver.id}>{driver.name} (Status: {driver.status})</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rescue-vehicle" className="block text-sm font-bold text-golffox-gray-dark mb-1">3. Escolha o Veículo de Socorro</label>
            <select id="rescue-vehicle" className="w-full p-3 border border-golffox-gray-light rounded-md focus:ring-2 focus:ring-golffox-orange-primary focus:outline-none">
                {availableVehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} ({vehicle.model})</option>
                ))}
            </select>
          </div>
        </div>

        <div className="mt-8 border-t pt-6">
          <button
            disabled={!selectedRoute}
            className="w-full bg-golffox-orange-primary text-white font-bold py-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:bg-golffox-gray-medium disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-6 w-6 mr-3" />
            Despachar Socorro Agora
          </button>
        </div>

      </div>
    </div>
  );
};

export default RescueDispatch;
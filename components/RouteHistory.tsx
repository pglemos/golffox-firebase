import React, { useState, useMemo } from 'react';
import type { RouteHistory } from '../types';
import { ChartBarIcon, ClockIcon, TruckIcon, UserGroupIcon, MapIcon } from './icons/Icons';

// Mock data para demonstração
const MOCK_ROUTE_HISTORY: RouteHistory[] = [
  {
    id: 'rh1',
    routeId: 'r1',
    routeName: 'Rota Minerva Foods - Turno Manhã',
    driverId: 'd1',
    driverName: 'João Silva',
    vehicleId: 'v1',
    vehiclePlate: 'ABC-1234',
    executionDate: '2024-01-15',
    startTime: '06:30',
    endTime: '08:45',
    totalTime: 135,
    totalDistance: 45.2,
    passengersBoarded: 28,
    passengersNotBoarded: 2,
    totalPassengers: 30,
    fuelConsumption: 12.5,
    operationalCost: 185.50,
    punctuality: -5,
    routeOptimization: 92
  },
  {
    id: 'rh2',
    routeId: 'r2',
    routeName: 'Rota JBS - Turno Tarde',
    driverId: 'd2',
    driverName: 'Maria Santos',
    vehicleId: 'v2',
    vehiclePlate: 'DEF-5678',
    executionDate: '2024-01-15',
    startTime: '13:00',
    endTime: '15:30',
    totalTime: 150,
    totalDistance: 52.8,
    passengersBoarded: 35,
    passengersNotBoarded: 0,
    totalPassengers: 35,
    fuelConsumption: 14.2,
    operationalCost: 210.75,
    punctuality: 8,
    routeOptimization: 88
  },
  {
    id: 'rh3',
    routeId: 'r1',
    routeName: 'Rota Minerva Foods - Turno Manhã',
    driverId: 'd1',
    driverName: 'João Silva',
    vehicleId: 'v1',
    vehiclePlate: 'ABC-1234',
    executionDate: '2024-01-14',
    startTime: '06:35',
    endTime: '08:50',
    totalTime: 135,
    totalDistance: 47.1,
    passengersBoarded: 30,
    passengersNotBoarded: 0,
    totalPassengers: 30,
    fuelConsumption: 13.1,
    operationalCost: 192.25,
    punctuality: 0,
    routeOptimization: 90
  }
];

const RouteHistory: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [selectedRoute, setSelectedRoute] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const filteredHistory = useMemo(() => {
    let filtered = [...MOCK_ROUTE_HISTORY];

    // Filtrar por rota
    if (selectedRoute !== 'all') {
      filtered = filtered.filter(h => h.routeId === selectedRoute);
    }

    // Filtrar por período
    const now = new Date();
    const periodDays = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    
    filtered = filtered.filter(h => new Date(h.executionDate) >= cutoffDate);

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.executionDate).getTime() - new Date(a.executionDate).getTime();
        case 'punctuality':
          return Math.abs(a.punctuality) - Math.abs(b.punctuality);
        case 'efficiency':
          return b.routeOptimization - a.routeOptimization;
        case 'cost':
          return a.operationalCost - b.operationalCost;
        default:
          return 0;
      }
    });

    return filtered;
  }, [selectedPeriod, selectedRoute, sortBy]);

  const metrics = useMemo(() => {
    if (filteredHistory.length === 0) return null;

    const totalRoutes = filteredHistory.length;
    const avgTime = filteredHistory.reduce((sum, h) => sum + h.totalTime, 0) / totalRoutes;
    const avgDistance = filteredHistory.reduce((sum, h) => sum + h.totalDistance, 0) / totalRoutes;
    const totalPassengers = filteredHistory.reduce((sum, h) => sum + h.passengersBoarded, 0);
    const avgFuelConsumption = filteredHistory.reduce((sum, h) => sum + h.fuelConsumption, 0) / totalRoutes;
    const totalCost = filteredHistory.reduce((sum, h) => sum + h.operationalCost, 0);
    const onTimeRoutes = filteredHistory.filter(h => Math.abs(h.punctuality) <= 5).length;
    const punctualityRate = (onTimeRoutes / totalRoutes) * 100;
    const avgOptimization = filteredHistory.reduce((sum, h) => sum + h.routeOptimization, 0) / totalRoutes;

    return {
      totalRoutes,
      avgTime: Math.round(avgTime),
      avgDistance: avgDistance.toFixed(1),
      totalPassengers,
      avgFuelConsumption: avgFuelConsumption.toFixed(1),
      totalCost: totalCost.toFixed(2),
      punctualityRate: punctualityRate.toFixed(1),
      avgOptimization: avgOptimization.toFixed(1)
    };
  }, [filteredHistory]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getPunctualityColor = (punctuality: number) => {
    if (Math.abs(punctuality) <= 5) return 'text-green-600';
    if (Math.abs(punctuality) <= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOptimizationColor = (optimization: number) => {
    if (optimization >= 90) return 'text-green-600';
    if (optimization >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-golffox-blue-dark mb-2">Histórico de Rotas</h1>
        <p className="text-golffox-gray-medium">Acompanhe o desempenho e métricas das rotas executadas</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-golffox-gray-light/20 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-golffox-blue-dark mb-2">Período</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-golffox-gray-light/30 rounded-lg focus:ring-2 focus:ring-golffox-orange-primary/20 focus:border-golffox-orange-primary"
            >
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="90days">Últimos 90 dias</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-golffox-blue-dark mb-2">Rota</label>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="w-full px-3 py-2 border border-golffox-gray-light/30 rounded-lg focus:ring-2 focus:ring-golffox-orange-primary/20 focus:border-golffox-orange-primary"
            >
              <option value="all">Todas as rotas</option>
              <option value="r1">Rota Minerva Foods - Turno Manhã</option>
              <option value="r2">Rota JBS - Turno Tarde</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-golffox-blue-dark mb-2">Ordenar por</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-golffox-gray-light/30 rounded-lg focus:ring-2 focus:ring-golffox-orange-primary/20 focus:border-golffox-orange-primary"
            >
              <option value="date">Data (mais recente)</option>
              <option value="punctuality">Pontualidade</option>
              <option value="efficiency">Eficiência</option>
              <option value="cost">Custo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Métricas Resumo */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total de Rotas</p>
                <p className="text-2xl font-bold text-blue-800">{metrics.totalRoutes}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Pontualidade</p>
                <p className="text-2xl font-bold text-green-800">{metrics.punctualityRate}%</p>
              </div>
              <ClockIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Passageiros</p>
                <p className="text-2xl font-bold text-orange-800">{metrics.totalPassengers}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Custo Total</p>
                <p className="text-2xl font-bold text-purple-800">R$ {metrics.totalCost}</p>
              </div>
              <TruckIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Histórico */}
      <div className="bg-white rounded-lg shadow-sm border border-golffox-gray-light/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-golffox-gray-light/20">
          <h2 className="text-lg font-semibold text-golffox-blue-dark">Execuções de Rotas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-golffox-gray-light/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Data/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Rota</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Motorista</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Duração</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Distância</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Passageiros</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Pontualidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Otimização</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Custo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-golffox-gray-light/20">
              {filteredHistory.map((history) => (
                <tr key={history.id} className="hover:bg-golffox-gray-light/5">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-golffox-blue-dark">
                      {new Date(history.executionDate).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-sm text-golffox-gray-medium">
                      {history.startTime} - {history.endTime}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-golffox-blue-dark">{history.routeName}</div>
                    <div className="text-sm text-golffox-gray-medium">{history.vehiclePlate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-golffox-blue-dark">{history.driverName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-golffox-blue-dark">{formatTime(history.totalTime)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-golffox-blue-dark">{history.totalDistance} km</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-golffox-blue-dark">
                      {history.passengersBoarded}/{history.totalPassengers}
                    </div>
                    {history.passengersNotBoarded > 0 && (
                      <div className="text-xs text-red-600">
                        {history.passengersNotBoarded} não embarcaram
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getPunctualityColor(history.punctuality)}`}>
                      {history.punctuality > 0 ? `+${history.punctuality}` : history.punctuality} min
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getOptimizationColor(history.routeOptimization)}`}>
                      {history.routeOptimization}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-golffox-blue-dark">R$ {history.operationalCost.toFixed(2)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredHistory.length === 0 && (
          <div className="text-center py-12">
            <MapIcon className="mx-auto h-12 w-12 text-golffox-gray-medium" />
            <h3 className="mt-2 text-sm font-medium text-golffox-blue-dark">Nenhuma rota encontrada</h3>
            <p className="mt-1 text-sm text-golffox-gray-medium">
              Não há execuções de rotas para os filtros selecionados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteHistory;
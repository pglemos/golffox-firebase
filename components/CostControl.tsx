import React, { useState, useMemo } from 'react';
import type { CostControl } from '../types';
import { CurrencyDollarIcon, ChartBarIcon, TruckIcon, MapIcon, ClockIcon } from './icons/Icons';

// Mock data para demonstração
const MOCK_COST_CONTROL: CostControl[] = [
  {
    id: 'cc1',
    routeId: 'r1',
    routeName: 'Rota Minerva Foods - Turno Manhã',
    period: 'Janeiro 2024',
    totalKilometers: 1356.0,
    averageFuelConsumption: 3.6,
    fuelCost: 5.89,
    totalFuelCost: 2218.45,
    driverCost: 4500.00,
    vehicleMaintenanceCost: 850.00,
    operationalCost: 7568.45,
    revenuePerPassenger: 12.50,
    totalRevenue: 11250.00,
    profitMargin: 32.7,
    costPerKm: 5.58,
    costPerPassenger: 8.41
  },
  {
    id: 'cc2',
    routeId: 'r2',
    routeName: 'Rota JBS - Turno Tarde',
    period: 'Janeiro 2024',
    totalKilometers: 1584.0,
    averageFuelConsumption: 3.4,
    fuelCost: 5.89,
    totalFuelCost: 2744.12,
    driverCost: 4500.00,
    vehicleMaintenanceCost: 920.00,
    operationalCost: 8164.12,
    revenuePerPassenger: 12.50,
    totalRevenue: 13125.00,
    profitMargin: 37.8,
    costPerKm: 5.15,
    costPerPassenger: 7.77
  },
  {
    id: 'cc3',
    routeId: 'r3',
    routeName: 'Rota Marfrig - Turno Noite',
    period: 'Janeiro 2024',
    totalKilometers: 892.0,
    averageFuelConsumption: 3.8,
    fuelCost: 5.89,
    totalFuelCost: 1382.45,
    driverCost: 4800.00,
    vehicleMaintenanceCost: 650.00,
    operationalCost: 6832.45,
    revenuePerPassenger: 12.50,
    totalRevenue: 7500.00,
    profitMargin: 8.9,
    costPerKm: 7.66,
    costPerPassenger: 11.39
  }
];

const CostControl: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedRoute, setSelectedRoute] = useState('all');
  const [viewMode, setViewMode] = useState('summary');

  const filteredCosts = useMemo(() => {
    let filtered = [...MOCK_COST_CONTROL];

    if (selectedRoute !== 'all') {
      filtered = filtered.filter(c => c.routeId === selectedRoute);
    }

    return filtered;
  }, [selectedRoute]);

  const totalMetrics = useMemo(() => {
    if (filteredCosts.length === 0) return null;

    const totalKm = filteredCosts.reduce((sum, c) => sum + c.totalKilometers, 0);
    const totalFuelCost = filteredCosts.reduce((sum, c) => sum + c.totalFuelCost, 0);
    const totalDriverCost = filteredCosts.reduce((sum, c) => sum + c.driverCost, 0);
    const totalMaintenanceCost = filteredCosts.reduce((sum, c) => sum + c.vehicleMaintenanceCost, 0);
    const totalOperationalCost = filteredCosts.reduce((sum, c) => sum + c.operationalCost, 0);
    const totalRevenue = filteredCosts.reduce((sum, c) => sum + c.totalRevenue, 0);
    const avgProfitMargin = filteredCosts.reduce((sum, c) => sum + c.profitMargin, 0) / filteredCosts.length;
    const avgCostPerKm = totalOperationalCost / totalKm;
    const avgFuelConsumption = filteredCosts.reduce((sum, c) => sum + c.averageFuelConsumption, 0) / filteredCosts.length;

    return {
      totalKm: totalKm.toFixed(1),
      totalFuelCost: totalFuelCost.toFixed(2),
      totalDriverCost: totalDriverCost.toFixed(2),
      totalMaintenanceCost: totalMaintenanceCost.toFixed(2),
      totalOperationalCost: totalOperationalCost.toFixed(2),
      totalRevenue: totalRevenue.toFixed(2),
      totalProfit: (totalRevenue - totalOperationalCost).toFixed(2),
      avgProfitMargin: avgProfitMargin.toFixed(1),
      avgCostPerKm: avgCostPerKm.toFixed(2),
      avgFuelConsumption: avgFuelConsumption.toFixed(1),
      fuelCostPercentage: ((totalFuelCost / totalOperationalCost) * 100).toFixed(1),
      driverCostPercentage: ((totalDriverCost / totalOperationalCost) * 100).toFixed(1),
      maintenanceCostPercentage: ((totalMaintenanceCost / totalOperationalCost) * 100).toFixed(1)
    };
  }, [filteredCosts]);

  const getProfitMarginColor = (margin: number) => {
    if (margin >= 30) return 'text-green-600';
    if (margin >= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCostEfficiencyColor = (costPerKm: number) => {
    if (costPerKm <= 5.0) return 'text-green-600';
    if (costPerKm <= 7.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-golffox-blue-dark mb-2">Controle de Custos</h1>
        <p className="text-golffox-gray-medium">Análise detalhada dos custos operacionais e rentabilidade das rotas</p>
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
              <option value="current">Mês Atual</option>
              <option value="last">Mês Anterior</option>
              <option value="quarter">Último Trimestre</option>
              <option value="year">Ano Atual</option>
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
              <option value="r3">Rota Marfrig - Turno Noite</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-golffox-blue-dark mb-2">Visualização</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="w-full px-3 py-2 border border-golffox-gray-light/30 rounded-lg focus:ring-2 focus:ring-golffox-orange-primary/20 focus:border-golffox-orange-primary"
            >
              <option value="summary">Resumo Geral</option>
              <option value="detailed">Detalhado por Rota</option>
              <option value="comparison">Comparativo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Métricas Principais */}
      {totalMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Receita Total</p>
                <p className="text-2xl font-bold text-green-800">R$ {totalMetrics.totalRevenue}</p>
                <p className="text-xs text-green-600 mt-1">Lucro: R$ {totalMetrics.totalProfit}</p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Custo Operacional</p>
                <p className="text-2xl font-bold text-blue-800">R$ {totalMetrics.totalOperationalCost}</p>
                <p className="text-xs text-blue-600 mt-1">R$ {totalMetrics.avgCostPerKm}/km</p>
              </div>
              <TruckIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Margem de Lucro</p>
                <p className={`text-2xl font-bold ${getProfitMarginColor(parseFloat(totalMetrics.avgProfitMargin))}`}>
                  {totalMetrics.avgProfitMargin}%
                </p>
                <p className="text-xs text-purple-600 mt-1">Média das rotas</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Quilometragem</p>
                <p className="text-2xl font-bold text-orange-800">{totalMetrics.totalKm} km</p>
                <p className="text-xs text-orange-600 mt-1">{totalMetrics.avgFuelConsumption} km/l</p>
              </div>
              <MapIcon className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Distribuição de Custos */}
      {totalMetrics && (
        <div className="bg-white rounded-lg shadow-sm border border-golffox-gray-light/20 p-6 mb-6">
          <h2 className="text-lg font-semibold text-golffox-blue-dark mb-4">Distribuição de Custos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <div className="w-24 h-24 rounded-full bg-blue-200 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-800">{totalMetrics.fuelCostPercentage}%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-golffox-blue-dark">Combustível</p>
              <p className="text-xs text-golffox-gray-medium">R$ {totalMetrics.totalFuelCost}</p>
            </div>

            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <div className="w-24 h-24 rounded-full bg-green-200 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-800">{totalMetrics.driverCostPercentage}%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-golffox-blue-dark">Motoristas</p>
              <p className="text-xs text-golffox-gray-medium">R$ {totalMetrics.totalDriverCost}</p>
            </div>

            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <div className="w-24 h-24 rounded-full bg-orange-200 flex items-center justify-center">
                  <span className="text-lg font-bold text-orange-800">{totalMetrics.maintenanceCostPercentage}%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-golffox-blue-dark">Manutenção</p>
              <p className="text-xs text-golffox-gray-medium">R$ {totalMetrics.totalMaintenanceCost}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabela Detalhada */}
      <div className="bg-white rounded-lg shadow-sm border border-golffox-gray-light/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-golffox-gray-light/20">
          <h2 className="text-lg font-semibold text-golffox-blue-dark">Análise Detalhada por Rota</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-golffox-gray-light/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Rota</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Período</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Quilometragem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Custo Combustível</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Custo Operacional</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Receita</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Margem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-golffox-blue-dark uppercase tracking-wider">Custo/km</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-golffox-gray-light/20">
              {filteredCosts.map((cost) => (
                <tr key={cost.id} className="hover:bg-golffox-gray-light/5">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-golffox-blue-dark">{cost.routeName}</div>
                    <div className="text-sm text-golffox-gray-medium">{cost.averageFuelConsumption} km/l</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-golffox-blue-dark">{cost.period}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-golffox-blue-dark">{cost.totalKilometers.toFixed(1)} km</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-golffox-blue-dark">R$ {cost.totalFuelCost.toFixed(2)}</div>
                    <div className="text-xs text-golffox-gray-medium">R$ {cost.fuelCost}/L</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-golffox-blue-dark">R$ {cost.operationalCost.toFixed(2)}</div>
                    <div className="text-xs text-golffox-gray-medium">
                      Motorista: R$ {cost.driverCost.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-golffox-blue-dark">R$ {cost.totalRevenue.toFixed(2)}</div>
                    <div className="text-xs text-golffox-gray-medium">
                      R$ {cost.revenuePerPassenger}/passageiro
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getProfitMarginColor(cost.profitMargin)}`}>
                      {cost.profitMargin.toFixed(1)}%
                    </div>
                    <div className="text-xs text-golffox-gray-medium">
                      Lucro: R$ {(cost.totalRevenue - cost.operationalCost).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getCostEfficiencyColor(cost.costPerKm)}`}>
                      R$ {cost.costPerKm.toFixed(2)}
                    </div>
                    <div className="text-xs text-golffox-gray-medium">
                      R$ {cost.costPerPassenger.toFixed(2)}/passageiro
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCosts.length === 0 && (
          <div className="text-center py-12">
            <CurrencyDollarIcon className="mx-auto h-12 w-12 text-golffox-gray-medium" />
            <h3 className="mt-2 text-sm font-medium text-golffox-blue-dark">Nenhum dado encontrado</h3>
            <p className="mt-1 text-sm text-golffox-gray-medium">
              Não há dados de custos para os filtros selecionados.
            </p>
          </div>
        )}
      </div>

      {/* Insights e Recomendações */}
      {totalMetrics && (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-golffox-blue-dark mb-4">💡 Insights e Recomendações</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="font-medium text-golffox-blue-dark mb-2">Eficiência de Combustível</h4>
              <p className="text-sm text-golffox-gray-medium">
                Consumo médio: {totalMetrics.avgFuelConsumption} km/l. 
                {parseFloat(totalMetrics.avgFuelConsumption) < 3.5 
                  ? ' ⚠️ Considere revisão dos veículos ou treinamento de condução econômica.'
                  : ' ✅ Consumo dentro do esperado para veículos comerciais.'
                }
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="font-medium text-golffox-blue-dark mb-2">Rentabilidade</h4>
              <p className="text-sm text-golffox-gray-medium">
                Margem média: {totalMetrics.avgProfitMargin}%. 
                {parseFloat(totalMetrics.avgProfitMargin) < 20 
                  ? ' ⚠️ Margem baixa. Considere otimização de rotas ou revisão de preços.'
                  : ' ✅ Margem saudável para o setor de transporte.'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostControl;
import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js';
import {
  Line,
  Bar,
  Pie,
  Doughnut,
  Radar,
  PolarArea
} from 'react-chartjs-2';
import { TrendingUp, BarChart3, PieChart, Activity, Zap, Target } from 'lucide-react';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

interface InteractiveChartsProps {
  data?: any;
  onClose?: () => void;
}

export const InteractiveCharts: React.FC<InteractiveChartsProps> = ({ data, onClose }) => {
  const [selectedChart, setSelectedChart] = useState<string>('performance');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isAnimated, setIsAnimated] = useState(true);

  // Dados simulados para os gráficos
  const generatePerformanceData = () => {
    const labels = [];
    const datasets = [];
    
    // Gerar labels baseados no período selecionado
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('pt-BR', { 
        month: 'short', 
        day: 'numeric' 
      }));
    }

    // Dataset de distância percorrida
    const distanceData = labels.map(() => Math.floor(Math.random() * 500) + 200);
    datasets.push({
      label: 'Distância (km)',
      data: distanceData,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    });

    // Dataset de tempo de viagem
    const timeData = labels.map(() => Math.floor(Math.random() * 8) + 4);
    datasets.push({
      label: 'Tempo (horas)',
      data: timeData,
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
      yAxisID: 'y1'
    });

    return { labels, datasets };
  };

  const generateVehicleData = () => {
    const vehicles = ['Veículo A', 'Veículo B', 'Veículo C', 'Veículo D', 'Veículo E'];
    const efficiency = vehicles.map(() => Math.floor(Math.random() * 30) + 70);
    const utilization = vehicles.map(() => Math.floor(Math.random() * 40) + 60);

    return {
      labels: vehicles,
      datasets: [
        {
          label: 'Eficiência (%)',
          data: efficiency,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)'
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)',
            'rgb(139, 92, 246)'
          ],
          borderWidth: 2
        },
        {
          label: 'Utilização (%)',
          data: utilization,
          backgroundColor: 'rgba(156, 163, 175, 0.6)',
          borderColor: 'rgb(156, 163, 175)',
          borderWidth: 2
        }
      ]
    };
  };

  const generateRouteDistribution = () => {
    const routes = ['Centro', 'Norte', 'Sul', 'Leste', 'Oeste'];
    const data = routes.map(() => Math.floor(Math.random() * 100) + 20);

    return {
      labels: routes,
      datasets: [{
        data,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)'
        ],
        borderWidth: 2
      }]
    };
  };

  const generateRadarData = () => {
    return {
      labels: ['Eficiência', 'Pontualidade', 'Segurança', 'Economia', 'Satisfação', 'Sustentabilidade'],
      datasets: [
        {
          label: 'Performance Atual',
          data: [85, 92, 78, 88, 90, 82],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(59, 130, 246)'
        },
        {
          label: 'Meta',
          data: [90, 95, 85, 90, 95, 88],
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgb(16, 185, 129)',
          pointBackgroundColor: 'rgb(16, 185, 129)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(16, 185, 129)'
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: isAnimated ? 1000 : 0
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: getChartTitle()
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: selectedChart === 'performance' ? {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    } : undefined,
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: isAnimated ? 1000 : 0
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Análise de Performance Multidimensional'
      }
    },
    scales: {
      r: {
        angleLines: {
          display: false
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    }
  };

  function getChartTitle(): string {
    switch (selectedChart) {
      case 'performance':
        return `Performance Operacional - ${timeRange.toUpperCase()}`;
      case 'vehicles':
        return 'Análise Comparativa de Veículos';
      case 'routes':
        return 'Distribuição de Rotas por Região';
      case 'radar':
        return 'Análise de Performance Multidimensional';
      default:
        return 'Gráfico Interativo';
    }
  }

  const chartTypes = [
    {
      id: 'performance',
      name: 'Performance',
      description: 'Tendências de performance ao longo do tempo',
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      id: 'vehicles',
      name: 'Veículos',
      description: 'Comparação de eficiência da frota',
      icon: BarChart3,
      color: 'text-green-600'
    },
    {
      id: 'routes',
      name: 'Rotas',
      description: 'Distribuição geográfica das rotas',
      icon: PieChart,
      color: 'text-orange-600'
    },
    {
      id: 'radar',
      name: 'Radar',
      description: 'Análise multidimensional',
      icon: Target,
      color: 'text-purple-600'
    }
  ];

  const timeRanges = [
    { id: '7d' as const, name: '7 dias' },
    { id: '30d' as const, name: '30 dias' },
    { id: '90d' as const, name: '90 dias' },
    { id: '1y' as const, name: '1 ano' }
  ];

  const renderChart = () => {
    switch (selectedChart) {
      case 'performance':
        return <Line data={generatePerformanceData()} options={chartOptions} />;
      case 'vehicles':
        return <Bar data={generateVehicleData()} options={chartOptions} />;
      case 'routes':
        return <Doughnut data={generateRouteDistribution()} options={chartOptions} />;
      case 'radar':
        return <Radar data={generateRadarData()} options={radarOptions} />;
      default:
        return <Line data={generatePerformanceData()} options={chartOptions} />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Gráficos Interativos</h2>
        </div>
        <div className="flex items-center space-x-4">
          {/* Toggle de Animação */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isAnimated}
              onChange={(e) => setIsAnimated(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Animações</span>
          </label>
          
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Seletor de Gráficos */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tipo de Gráfico</h3>
          <div className="space-y-2">
            {chartTypes.map((chart) => {
              const Icon = chart.icon;
              const isSelected = selectedChart === chart.id;
              
              return (
                <button
                  key={chart.id}
                  onClick={() => setSelectedChart(chart.id)}
                  className={`w-full p-3 text-left border rounded-lg transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${chart.color}`} />
                    <div>
                      <h4 className="font-medium text-gray-900">{chart.name}</h4>
                      <p className="text-sm text-gray-600">{chart.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Seletor de Período (apenas para performance) */}
          {selectedChart === 'performance' && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Período</h3>
              <div className="space-y-2">
                {timeRanges.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setTimeRange(range.id)}
                    className={`w-full p-2 text-left border rounded transition-all ${
                      timeRange === range.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {range.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Área do Gráfico */}
        <div className="lg:col-span-3">
          <div className="bg-gray-50 rounded-lg p-4" style={{ height: '500px' }}>
            {renderChart()}
          </div>

          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Tendência</span>
              </div>
              <div className="text-2xl font-bold text-blue-900 mt-1">+12%</div>
              <div className="text-xs text-blue-700">vs. período anterior</div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Eficiência</span>
              </div>
              <div className="text-2xl font-bold text-green-900 mt-1">87%</div>
              <div className="text-xs text-green-700">média geral</div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Volume</span>
              </div>
              <div className="text-2xl font-bold text-orange-900 mt-1">2.4K</div>
              <div className="text-xs text-orange-700">rotas processadas</div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Meta</span>
              </div>
              <div className="text-2xl font-bold text-purple-900 mt-1">94%</div>
              <div className="text-xs text-purple-700">do objetivo</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
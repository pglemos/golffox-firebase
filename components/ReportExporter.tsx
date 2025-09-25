import React, { useState } from 'react';
import { Download, FileText, Table, File, Clock, CheckCircle, AlertCircle, X, Settings } from 'lucide-react';
import { useReportExport } from '../hooks/useReportExport';
import { useAnalytics } from '../hooks/useAnalytics';
import { useVehicleTracking } from '../hooks/useVehicleTracking';
import { useRouteOptimization } from '../hooks/useRouteOptimization';

interface ReportExporterProps {
  onClose?: () => void;
}

export const ReportExporter: React.FC<ReportExporterProps> = ({ onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [selectedReports, setSelectedReports] = useState<string[]>(['analytics']);
  const [customFileName, setCustomFileName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(true);

  const {
    isExporting,
    exportHistory,
    error,
    exportConsolidatedReport,
    exportRouteReport,
    exportVehicleReport,
    exportKPIReport,
    exportMultipleReports,
    clearError,
    getExportStats
  } = useReportExport();

  const { 
    performance, 
    routeAnalytics, 
    vehicleAnalytics, 
    kpis 
  } = useAnalytics();

  const { vehicles } = useVehicleTracking();
  const { state: routeOptimizationState } = useRouteOptimization();

  const reportTypes = [
    {
      id: 'analytics',
      name: 'Dashboard de Análises',
      description: 'Relatório completo com todas as métricas',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      id: 'routes',
      name: 'Análise de Rotas',
      description: 'Otimização e performance de rotas',
      icon: FileText,
      color: 'text-green-600'
    },
    {
      id: 'vehicles',
      name: 'Performance da Frota',
      description: 'Análise detalhada dos veículos',
      icon: FileText,
      color: 'text-orange-600'
    },
    {
      id: 'kpis',
      name: 'Indicadores (KPIs)',
      description: 'Métricas chave de performance',
      icon: FileText,
      color: 'text-purple-600'
    }
  ];

  const formatOptions = [
    {
      id: 'pdf' as const,
      name: 'PDF',
      description: 'Documento formatado para impressão',
      icon: FileText,
      color: 'text-red-600'
    },
    {
      id: 'excel' as const,
      name: 'Excel',
      description: 'Planilha para análise de dados',
      icon: Table,
      color: 'text-green-600'
    },
    {
      id: 'csv' as const,
      name: 'CSV',
      description: 'Dados tabulares simples',
      icon: File,
      color: 'text-blue-600'
    }
  ];

  const handleReportToggle = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleExport = async () => {
    if (selectedReports.length === 0) return;

    clearError();

    try {
      if (selectedReports.length === 1) {
        const reportType = selectedReports[0];
        const options = {
          format: selectedFormat,
          fileName: customFileName || undefined,
          includeCharts,
          includeRawData
        };

        switch (reportType) {
          case 'analytics':
            await exportConsolidatedReport({
              performance,
              routeAnalytics,
              vehicleAnalytics,
              kpis
            }, selectedFormat);
            break;
          case 'routes':
            await exportRouteReport(routeOptimizationState.optimizationHistory, selectedFormat);
            break;
          case 'vehicles':
            await exportVehicleReport(vehicles, selectedFormat);
            break;
          case 'kpis':
            await exportKPIReport(kpis, selectedFormat);
            break;
        }
      } else {
        // Exportação múltipla
        const reports = selectedReports.map(reportType => {
          switch (reportType) {
            case 'analytics':
              return {
                data: { performance, routeAnalytics, vehicleAnalytics, kpis },
                type: 'consolidated' as const
              };
            case 'routes':
              return { data: routeOptimizationState.optimizationHistory, type: 'route' as const };
            case 'vehicles':
              return { data: vehicles, type: 'vehicle' as const };
            case 'kpis':
              return { data: kpis, type: 'kpi' as const };
            default:
              return { data: [], type: 'route' as const };
          }
        });

        await exportMultipleReports(reports, selectedFormat);
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
    }
  };

  const exportStats = getExportStats();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Download className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Exportar Relatórios</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={clearError}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seleção de Relatórios */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Selecionar Relatórios</h3>
          <div className="space-y-3">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              const isSelected = selectedReports.includes(report.id);
              
              return (
                <div
                  key={report.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleReportToggle(report.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${report.color}`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{report.name}</h4>
                      <p className="text-sm text-gray-600">{report.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Configurações de Exportação */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Formato de Exportação</h3>
          
          {/* Formatos */}
          <div className="space-y-3 mb-6">
            {formatOptions.map((format) => {
              const Icon = format.icon;
              const isSelected = selectedFormat === format.id;
              
              return (
                <div
                  key={format.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFormat(format.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${format.color}`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{format.name}</h4>
                      <p className="text-sm text-gray-600">{format.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nome do Arquivo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Arquivo (opcional)
            </label>
            <input
              type="text"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder="relatorio_personalizado"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Configurações Avançadas */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <Settings className="h-4 w-4" />
              <span>Configurações Avançadas</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Incluir gráficos</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeRawData}
                    onChange={(e) => setIncludeRawData(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Incluir dados brutos</span>
                </label>
              </div>
            )}
          </div>

          {/* Botão de Exportação */}
          <button
            onClick={handleExport}
            disabled={isExporting || selectedReports.length === 0}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Exportar Relatórios</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Histórico de Exportações */}
      {exportHistory.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Histórico de Exportações</h3>
          
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-lg font-semibold text-gray-900">{exportStats.totalExports}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Formato Preferido</div>
              <div className="text-lg font-semibold text-gray-900">{exportStats.mostUsedFormat}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Último Export</div>
              <div className="text-lg font-semibold text-gray-900">
                {exportStats.lastExport ? exportStats.lastExport.format : 'N/A'}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">PDF</div>
              <div className="text-lg font-semibold text-gray-900">
                {exportStats.formatCounts.PDF || 0}
              </div>
            </div>
          </div>

          {/* Lista do Histórico */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {exportHistory.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.fileName}</div>
                    <div className="text-xs text-gray-600">
                      {item.reportType} • {item.format} • {item.size}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {item.exportedAt.toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
import { useState, useCallback } from 'react';
import { ReportExportService, ReportData, ExportOptions } from '../services/reportExportService';

interface ExportState {
  isExporting: boolean;
  lastExportedFile: string | null;
  exportHistory: ExportHistoryItem[];
  error: string | null;
}

interface ExportHistoryItem {
  id: string;
  fileName: string;
  format: string;
  exportedAt: Date;
  reportType: string;
  size: string;
}

export const useReportExport = () => {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    lastExportedFile: null,
    exportHistory: [],
    error: null
  });

  const reportService = ReportExportService.getInstance();

  // Exporta relatório
  const exportReport = useCallback(async (
    reportData: ReportData,
    options: ExportOptions
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, isExporting: true, error: null }));

    try {
      let fileName: string;
      
      switch (options.format) {
        case 'pdf':
          await reportService.exportToPDF(reportData, options);
          fileName = options.fileName || `relatorio_${formatDate(reportData.generatedAt)}.pdf`;
          break;
        case 'excel':
          await reportService.exportToExcel(reportData, options);
          fileName = options.fileName || `relatorio_${formatDate(reportData.generatedAt)}.xlsx`;
          break;
        case 'csv':
          await reportService.exportToCSV(reportData, options);
          fileName = options.fileName || `relatorio_${formatDate(reportData.generatedAt)}.csv`;
          break;
        default:
          throw new Error('Formato de exportação não suportado');
      }

      // Adiciona ao histórico
      const historyItem: ExportHistoryItem = {
        id: generateId(),
        fileName,
        format: options.format.toUpperCase(),
        exportedAt: new Date(),
        reportType: reportData.title,
        size: calculateFileSize(reportData)
      };

      setState(prev => ({
        ...prev,
        isExporting: false,
        lastExportedFile: fileName,
        exportHistory: [historyItem, ...prev.exportHistory.slice(0, 9)], // Mantém últimos 10
        error: null
      }));

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isExporting: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na exportação'
      }));
      return false;
    }
  }, [reportService]);

  // Exporta relatório de rotas
  const exportRouteReport = useCallback(async (
    routeData: any[],
    format: 'pdf' | 'excel' | 'csv' = 'pdf'
  ): Promise<boolean> => {
    const reportData = reportService.generateRouteAnalysisReport(routeData);
    return exportReport(reportData, { format });
  }, [exportReport, reportService]);

  // Exporta relatório de veículos
  const exportVehicleReport = useCallback(async (
    vehicleData: any[],
    format: 'pdf' | 'excel' | 'csv' = 'pdf'
  ): Promise<boolean> => {
    const reportData = reportService.generateVehiclePerformanceReport(vehicleData);
    return exportReport(reportData, { format });
  }, [exportReport, reportService]);

  // Exporta relatório de KPIs
  const exportKPIReport = useCallback(async (
    kpiData: Record<string, any>,
    format: 'pdf' | 'excel' | 'csv' = 'pdf'
  ): Promise<boolean> => {
    const reportData = reportService.generateKPIReport(kpiData);
    return exportReport(reportData, { format });
  }, [exportReport, reportService]);

  // Exporta relatório consolidado
  const exportConsolidatedReport = useCallback(async (
    analyticsData: any,
    format: 'pdf' | 'excel' | 'csv' = 'pdf'
  ): Promise<boolean> => {
    const reportData = reportService.generateConsolidatedReport(analyticsData);
    return exportReport(reportData, { format });
  }, [exportReport, reportService]);

  // Exporta múltiplos relatórios
  const exportMultipleReports = useCallback(async (
    reports: { data: any; type: 'route' | 'vehicle' | 'kpi' | 'consolidated' }[],
    format: 'pdf' | 'excel' | 'csv' = 'pdf'
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, isExporting: true, error: null }));

    try {
      const results = await Promise.all(
        reports.map(async ({ data, type }) => {
          switch (type) {
            case 'route':
              return exportRouteReport(data, format);
            case 'vehicle':
              return exportVehicleReport(data, format);
            case 'kpi':
              return exportKPIReport(data, format);
            case 'consolidated':
              return exportConsolidatedReport(data, format);
            default:
              return false;
          }
        })
      );

      const allSuccessful = results.every(result => result);
      
      if (!allSuccessful) {
        setState(prev => ({
          ...prev,
          isExporting: false,
          error: 'Alguns relatórios falharam na exportação'
        }));
      }

      return allSuccessful;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isExporting: false,
        error: 'Erro na exportação múltipla de relatórios'
      }));
      return false;
    }
  }, [exportRouteReport, exportVehicleReport, exportKPIReport, exportConsolidatedReport]);

  // Limpa histórico de exportação
  const clearExportHistory = useCallback(() => {
    setState(prev => ({ ...prev, exportHistory: [] }));
  }, []);

  // Limpa erro
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Gera relatório personalizado
  const generateCustomReport = useCallback((
    title: string,
    data: any[],
    summary?: Record<string, any>
  ): ReportData => {
    return {
      title,
      subtitle: 'Relatório Personalizado',
      generatedAt: new Date(),
      data,
      summary
    };
  }, []);

  // Obtém estatísticas de exportação
  const getExportStats = useCallback(() => {
    const { exportHistory } = state;
    const totalExports = exportHistory.length;
    const formatCounts = exportHistory.reduce((acc, item) => {
      acc[item.format] = (acc[item.format] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const lastExport = exportHistory[0];
    const mostUsedFormat = Object.entries(formatCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    return {
      totalExports,
      formatCounts,
      lastExport,
      mostUsedFormat
    };
  }, [state]);

  // Valida dados para exportação
  const validateExportData = useCallback((data: any[]): boolean => {
    if (!Array.isArray(data)) return false;
    if (data.length === 0) return false;
    return true;
  }, []);

  // Formata opções de exportação
  const formatExportOptions = useCallback((
    format: 'pdf' | 'excel' | 'csv',
    customOptions?: Partial<ExportOptions>
  ): ExportOptions => {
    const defaultOptions: ExportOptions = {
      format,
      includeCharts: format === 'pdf',
      includeRawData: true,
      orientation: 'portrait'
    };

    return { ...defaultOptions, ...customOptions };
  }, []);

  return {
    // Estado
    isExporting: state.isExporting,
    lastExportedFile: state.lastExportedFile,
    exportHistory: state.exportHistory,
    error: state.error,

    // Funções de exportação
    exportReport,
    exportRouteReport,
    exportVehicleReport,
    exportKPIReport,
    exportConsolidatedReport,
    exportMultipleReports,

    // Utilitários
    clearExportHistory,
    clearError,
    generateCustomReport,
    getExportStats,
    validateExportData,
    formatExportOptions
  };
};

// Funções auxiliares
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function calculateFileSize(reportData: ReportData): string {
  // Simula cálculo de tamanho do arquivo
  const dataSize = JSON.stringify(reportData).length;
  if (dataSize < 1024) return `${dataSize} B`;
  if (dataSize < 1024 * 1024) return `${(dataSize / 1024).toFixed(1)} KB`;
  return `${(dataSize / (1024 * 1024)).toFixed(1)} MB`;
}
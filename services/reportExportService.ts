// Interfaces para exportação de relatórios
export interface ReportData {
  title: string;
  subtitle?: string;
  generatedAt: Date;
  data: any[];
  summary?: Record<string, any>;
  charts?: ChartData[];
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
    }[];
  };
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts?: boolean;
  includeRawData?: boolean;
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
}

export class ReportExportService {
  private static instance: ReportExportService;

  public static getInstance(): ReportExportService {
    if (!ReportExportService.instance) {
      ReportExportService.instance = new ReportExportService();
    }
    return ReportExportService.instance;
  }

  // Exporta relatório para PDF
  async exportToPDF(reportData: ReportData, options: ExportOptions = { format: 'pdf' }): Promise<void> {
    try {
      // Simula geração de PDF
      const content = this.generatePDFContent(reportData);
      const fileName = options.fileName || `relatorio_${this.formatDate(reportData.generatedAt)}.pdf`;
      
      // Simula download do arquivo
      this.downloadFile(content, fileName, 'application/pdf');
      
      console.log(`Relatório PDF exportado: ${fileName}`);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      throw new Error('Falha na exportação do relatório PDF');
    }
  }

  // Exporta relatório para Excel
  async exportToExcel(reportData: ReportData, options: ExportOptions = { format: 'excel' }): Promise<void> {
    try {
      // Simula geração de Excel
      const content = this.generateExcelContent(reportData);
      const fileName = options.fileName || `relatorio_${this.formatDate(reportData.generatedAt)}.xlsx`;
      
      // Simula download do arquivo
      this.downloadFile(content, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      console.log(`Relatório Excel exportado: ${fileName}`);
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      throw new Error('Falha na exportação do relatório Excel');
    }
  }

  // Exporta relatório para CSV
  async exportToCSV(reportData: ReportData, options: ExportOptions = { format: 'csv' }): Promise<void> {
    try {
      const content = this.generateCSVContent(reportData);
      const fileName = options.fileName || `relatorio_${this.formatDate(reportData.generatedAt)}.csv`;
      
      // Simula download do arquivo
      this.downloadFile(content, fileName, 'text/csv');
      
      console.log(`Relatório CSV exportado: ${fileName}`);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      throw new Error('Falha na exportação do relatório CSV');
    }
  }

  // Gera conteúdo do PDF (simulado)
  private generatePDFContent(reportData: ReportData): string {
    const content = `
      %PDF-1.4
      1 0 obj
      <<
      /Type /Catalog
      /Pages 2 0 R
      >>
      endobj
      
      2 0 obj
      <<
      /Type /Pages
      /Kids [3 0 R]
      /Count 1
      >>
      endobj
      
      3 0 obj
      <<
      /Type /Page
      /Parent 2 0 R
      /MediaBox [0 0 612 792]
      /Contents 4 0 R
      >>
      endobj
      
      4 0 obj
      <<
      /Length 200
      >>
      stream
      BT
      /F1 12 Tf
      100 700 Td
      (${reportData.title}) Tj
      0 -20 Td
      (Gerado em: ${reportData.generatedAt.toLocaleString('pt-BR')}) Tj
      0 -40 Td
      (Total de registros: ${reportData.data.length}) Tj
      ET
      endstream
      endobj
      
      xref
      0 5
      0000000000 65535 f 
      0000000009 00000 n 
      0000000058 00000 n 
      0000000115 00000 n 
      0000000206 00000 n 
      trailer
      <<
      /Size 5
      /Root 1 0 R
      >>
      startxref
      456
      %%EOF
    `;
    
    return content;
  }

  // Gera conteúdo do Excel (simulado)
  private generateExcelContent(reportData: ReportData): string {
    // Simula estrutura básica de Excel em XML
    const header = `<?xml version="1.0" encoding="UTF-8"?>
    <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheets>
        <sheet name="Relatório" sheetId="1" r:id="rId1"/>
      </sheets>
    </workbook>`;
    
    return header;
  }

  // Gera conteúdo do CSV
  private generateCSVContent(reportData: ReportData): string {
    if (!reportData.data || reportData.data.length === 0) {
      return `${reportData.title}\nNenhum dado disponível\n`;
    }

    // Extrai cabeçalhos das chaves do primeiro objeto
    const headers = Object.keys(reportData.data[0]);
    const csvHeaders = headers.join(',');
    
    // Converte dados para linhas CSV
    const csvRows = reportData.data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escapa aspas e adiciona aspas se necessário
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    // Adiciona informações do cabeçalho
    const csvContent = [
      `# ${reportData.title}`,
      `# Gerado em: ${reportData.generatedAt.toLocaleString('pt-BR')}`,
      `# Total de registros: ${reportData.data.length}`,
      '',
      csvHeaders,
      ...csvRows
    ].join('\n');

    return csvContent;
  }

  // Simula download do arquivo
  private downloadFile(content: string, fileName: string, mimeType: string): void {
    // Em um ambiente real, isso criaria um blob e iniciaria o download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Formata data para nome do arquivo
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  // Gera relatório de análise de rotas
  generateRouteAnalysisReport(routeData: any[]): ReportData {
    const totalRoutes = routeData.length;
    const totalDistance = routeData.reduce((sum, route) => sum + (route.distanceSaved || 0), 0);
    const totalTimeSaved = routeData.reduce((sum, route) => sum + (route.timeSaved || 0), 0);
    const totalCostSaved = routeData.reduce((sum, route) => sum + (route.costSaved || 0), 0);

    return {
      title: 'Relatório de Análise de Rotas',
      subtitle: 'Otimização e Performance de Rotas',
      generatedAt: new Date(),
      data: routeData,
      summary: {
        totalRoutes,
        totalDistance: `${totalDistance.toFixed(1)} km`,
        totalTimeSaved: `${Math.floor(totalTimeSaved / 60)}h ${Math.floor(totalTimeSaved % 60)}min`,
        totalCostSaved: `R$ ${totalCostSaved.toFixed(2)}`,
        averageOptimization: `${((totalDistance / totalRoutes) || 0).toFixed(1)} km por rota`
      }
    };
  }

  // Gera relatório de performance de veículos
  generateVehiclePerformanceReport(vehicleData: any[]): ReportData {
    const totalVehicles = vehicleData.length;
    const averageUtilization = vehicleData.reduce((sum, vehicle) => 
      sum + (vehicle.utilizationRate || 0), 0) / totalVehicles;
    const averageFuelEfficiency = vehicleData.reduce((sum, vehicle) => 
      sum + (vehicle.fuelEfficiency || 0), 0) / totalVehicles;

    return {
      title: 'Relatório de Performance da Frota',
      subtitle: 'Análise Detalhada dos Veículos',
      generatedAt: new Date(),
      data: vehicleData,
      summary: {
        totalVehicles,
        averageUtilization: `${(averageUtilization * 100).toFixed(1)}%`,
        averageFuelEfficiency: `${averageFuelEfficiency.toFixed(1)} km/L`,
        bestPerformer: vehicleData.reduce((best, current) => 
          (current.fuelEfficiency || 0) > (best.fuelEfficiency || 0) ? current : best, vehicleData[0])?.vehicleName || 'N/A'
      }
    };
  }

  // Gera relatório de KPIs
  generateKPIReport(kpiData: Record<string, any>): ReportData {
    const kpiArray = Object.entries(kpiData).map(([key, value]) => ({
      metric: key.replace(/([A-Z])/g, ' $1').trim(),
      value: value.value,
      change: value.change,
      trend: value.trend
    }));

    return {
      title: 'Relatório de KPIs',
      subtitle: 'Indicadores Chave de Performance',
      generatedAt: new Date(),
      data: kpiArray,
      summary: {
        totalKPIs: kpiArray.length,
        positiveKPIs: kpiArray.filter(kpi => kpi.change > 0).length,
        negativeKPIs: kpiArray.filter(kpi => kpi.change < 0).length,
        stableKPIs: kpiArray.filter(kpi => kpi.change === 0).length
      }
    };
  }

  // Gera relatório consolidado
  generateConsolidatedReport(analyticsData: any): ReportData {
    const { performance, routeAnalytics, vehicleAnalytics, kpis } = analyticsData;

    const consolidatedData = [
      { categoria: 'Performance Geral', ...performance },
      { categoria: 'Análise de Rotas', total: routeAnalytics.length },
      { categoria: 'Frota', total: vehicleAnalytics.length },
      { categoria: 'KPIs', total: Object.keys(kpis).length }
    ];

    return {
      title: 'Relatório Consolidado',
      subtitle: 'Visão Geral Completa do Sistema',
      generatedAt: new Date(),
      data: consolidatedData,
      summary: {
        totalDistance: performance?.totalDistance || 0,
        totalTime: performance?.totalTime || 0,
        efficiency: performance?.efficiency || 0,
        activeVehicles: vehicleAnalytics?.length || 0
      }
    };
  }
}
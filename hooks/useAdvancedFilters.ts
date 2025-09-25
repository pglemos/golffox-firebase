import { useState, useCallback, useMemo } from 'react';
import { FilterOptions } from '../components/AdvancedFilters';

export interface FilterableItem {
  id: string;
  name?: string;
  description?: string;
  date?: string;
  vehicleType?: string;
  region?: string;
  status?: string;
  driver?: string;
  priority?: string;
  efficiency?: number;
  [key: string]: any;
}

export const useAdvancedFilters = <T extends FilterableItem>(
  data: T[],
  initialFilters?: Partial<FilterOptions>
) => {
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    dateRange: { start: '', end: '' },
    vehicleTypes: [],
    regions: [],
    status: [],
    drivers: [],
    priority: [],
    sortBy: 'date',
    sortOrder: 'desc',
    ...initialFilters
  });

  // Função para aplicar filtros de busca por texto
  const applyTextSearch = useCallback((items: T[], searchTerm: string): T[] => {
    if (!searchTerm.trim()) return items;

    const searchLower = searchTerm.toLowerCase();
    return items.filter(item => {
      // Busca em campos comuns
      const searchableFields = [
        item.id,
        item.name,
        item.description,
        item.vehicleType,
        item.region,
        item.status,
        item.driver,
        item.priority
      ];

      return searchableFields.some(field => 
        field && field.toString().toLowerCase().includes(searchLower)
      );
    });
  }, []);

  // Função para aplicar filtros de data
  const applyDateFilter = useCallback((items: T[], dateRange: FilterOptions['dateRange']): T[] => {
    if (!dateRange.start && !dateRange.end) return items;

    return items.filter(item => {
      if (!item.date) return true;

      const itemDate = new Date(item.date);
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;

      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;

      return true;
    });
  }, []);

  // Função para aplicar filtros de múltipla seleção
  const applyMultiSelectFilter = useCallback((
    items: T[], 
    filterValues: string[], 
    itemField: keyof T
  ): T[] => {
    if (filterValues.length === 0) return items;

    return items.filter(item => {
      const itemValue = item[itemField];
      return itemValue && filterValues.includes(itemValue.toString());
    });
  }, []);

  // Função para aplicar ordenação
  const applySorting = useCallback((items: T[], sortBy: string, sortOrder: 'asc' | 'desc'): T[] => {
    return [...items].sort((a, b) => {
      let aValue = a[sortBy as keyof T];
      let bValue = b[sortBy as keyof T];

      // Tratamento especial para datas
      if (sortBy === 'date') {
        const aTime = aValue ? new Date(aValue as string).getTime() : 0;
        const bTime = bValue ? new Date(bValue as string).getTime() : 0;
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      }

      // Tratamento especial para números
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Tratamento para strings
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();

      if (sortOrder === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, []);

  // Dados filtrados e ordenados
  const filteredData = useMemo(() => {
    let result = [...data];

    // Aplicar busca por texto
    result = applyTextSearch(result, filters.searchTerm);

    // Aplicar filtro de data
    result = applyDateFilter(result, filters.dateRange);

    // Aplicar filtros de múltipla seleção
    result = applyMultiSelectFilter(result, filters.vehicleTypes, 'vehicleType');
    result = applyMultiSelectFilter(result, filters.regions, 'region');
    result = applyMultiSelectFilter(result, filters.status, 'status');
    result = applyMultiSelectFilter(result, filters.drivers, 'driver');
    result = applyMultiSelectFilter(result, filters.priority, 'priority');

    // Aplicar ordenação
    result = applySorting(result, filters.sortBy, filters.sortOrder);

    return result;
  }, [
    data,
    filters,
    applyTextSearch,
    applyDateFilter,
    applyMultiSelectFilter,
    applySorting
  ]);

  // Estatísticas dos filtros
  const filterStats = useMemo(() => {
    const total = data.length;
    const filtered = filteredData.length;
    const percentage = total > 0 ? Math.round((filtered / total) * 100) : 0;

    return {
      total,
      filtered,
      percentage,
      hidden: total - filtered
    };
  }, [data.length, filteredData.length]);

  // Opções disponíveis para os filtros (baseadas nos dados)
  const availableOptions = useMemo(() => {
    const getUniqueValues = (field: keyof T) => {
      return Array.from(new Set(
        data
          .map(item => item[field])
          .filter(value => value !== null && value !== undefined)
          .map(value => value.toString())
      )).sort();
    };

    return {
      vehicleTypes: getUniqueValues('vehicleType'),
      regions: getUniqueValues('region'),
      statuses: getUniqueValues('status'),
      drivers: getUniqueValues('driver'),
      priorities: getUniqueValues('priority')
    };
  }, [data]);

  // Função para atualizar filtros
  const updateFilters = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);

  // Função para resetar filtros
  const resetFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      dateRange: { start: '', end: '' },
      vehicleTypes: [],
      regions: [],
      status: [],
      drivers: [],
      priority: [],
      sortBy: 'date',
      sortOrder: 'desc'
    });
  }, []);

  // Função para exportar dados filtrados
  const exportFilteredData = useCallback((format: 'json' | 'csv' = 'json') => {
    if (format === 'csv') {
      // Converter para CSV
      if (filteredData.length === 0) return '';

      const headers = Object.keys(filteredData[0]).join(',');
      const rows = filteredData.map(item => 
        Object.values(item).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        ).join(',')
      );

      return [headers, ...rows].join('\n');
    }

    return JSON.stringify(filteredData, null, 2);
  }, [filteredData]);

  // Função para salvar configuração de filtros
  const saveFilterPreset = useCallback((name: string) => {
    const preset = {
      name,
      filters,
      createdAt: new Date().toISOString()
    };

    // Salvar no localStorage
    const existingPresets = JSON.parse(
      localStorage.getItem('filterPresets') || '[]'
    );
    
    const updatedPresets = [...existingPresets, preset];
    localStorage.setItem('filterPresets', JSON.stringify(updatedPresets));

    return preset;
  }, [filters]);

  // Função para carregar configuração de filtros
  const loadFilterPreset = useCallback((presetName: string) => {
    const presets = JSON.parse(
      localStorage.getItem('filterPresets') || '[]'
    );
    
    const preset = presets.find((p: any) => p.name === presetName);
    if (preset) {
      setFilters(preset.filters);
      return true;
    }
    
    return false;
  }, []);

  // Função para obter presets salvos
  const getSavedPresets = useCallback(() => {
    return JSON.parse(localStorage.getItem('filterPresets') || '[]');
  }, []);

  return {
    filters,
    filteredData,
    filterStats,
    availableOptions,
    updateFilters,
    resetFilters,
    exportFilteredData,
    saveFilterPreset,
    loadFilterPreset,
    getSavedPresets
  };
};
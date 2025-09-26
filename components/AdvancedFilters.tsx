import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin, Truck, User, X, ChevronDown, SlidersHorizontal } from 'lucide-react';

export interface FilterOptions {
  searchTerm: string;
  dateRange: {
    start: string;
    end: string;
  };
  vehicleTypes: string[];
  regions: string[];
  status: string[];
  drivers: string[];
  priority: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  initialFilters?: Partial<FilterOptions>;
  availableOptions?: {
    vehicleTypes?: string[];
    regions?: string[];
    statuses?: string[];
    drivers?: string[];
    priorities?: string[];
  };
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  onFiltersChange,
  initialFilters = {},
  availableOptions = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    dateRange: {
      start: '',
      end: ''
    },
    vehicleTypes: [],
    regions: [],
    status: [],
    drivers: [],
    priority: [],
    sortBy: 'date',
    sortOrder: 'desc',
    ...initialFilters
  });

  // Opções padrão
  const defaultOptions = {
    vehicleTypes: ['Van', 'Ônibus', 'Micro-ônibus', 'Sedan', 'SUV'],
    regions: ['Centro', 'Norte', 'Sul', 'Leste', 'Oeste'],
    statuses: ['Ativo', 'Inativo', 'Manutenção', 'Disponível', 'Em Rota'],
    drivers: ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Lima'],
    priorities: ['Baixa', 'Média', 'Alta', 'Crítica'],
    sortOptions: [
      { value: 'date', label: 'Data' },
      { value: 'name', label: 'Nome' },
      { value: 'status', label: 'Status' },
      { value: 'priority', label: 'Prioridade' },
      { value: 'region', label: 'Região' },
      { value: 'efficiency', label: 'Eficiência' }
    ]
  };

  const options = {
    vehicleTypes: availableOptions.vehicleTypes || defaultOptions.vehicleTypes,
    regions: availableOptions.regions || defaultOptions.regions,
    statuses: availableOptions.statuses || defaultOptions.statuses,
    drivers: availableOptions.drivers || defaultOptions.drivers,
    priorities: availableOptions.priorities || defaultOptions.priorities
  };

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }));
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [field]: value }
    }));
  };

  const handleMultiSelectChange = (field: keyof FilterOptions, value: string) => {
    setFilters(prev => {
      const currentValues = prev[field] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return { ...prev, [field]: newValues };
    });
  };

  const handleSortChange = (field: 'sortBy' | 'sortOrder', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
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
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.vehicleTypes.length > 0) count++;
    if (filters.regions.length > 0) count++;
    if (filters.status.length > 0) count++;
    if (filters.drivers.length > 0) count++;
    if (filters.priority.length > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Header com busca e toggle */}
      <div className="flex items-center space-x-4 mb-4">
        {/* Campo de busca */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, ID, descrição..."
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Botão de filtros avançados */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
            isExpanded || activeFiltersCount > 0
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Botão limpar filtros */}
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* Filtros expandidos */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Período
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Data inicial"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Data final"
                />
              </div>
            </div>

            {/* Tipos de Veículo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Truck className="inline h-4 w-4 mr-1" />
                Tipos de Veículo
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {options.vehicleTypes.map((type) => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.vehicleTypes.includes(type)}
                      onChange={() => handleMultiSelectChange('vehicleTypes', type)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Regiões */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Regiões
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {options.regions.map((region) => (
                  <label key={region} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.regions.includes(region)}
                      onChange={() => handleMultiSelectChange('regions', region)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{region}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                Status
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {options.statuses.map((status) => (
                  <label key={status} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={() => handleMultiSelectChange('status', status)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Motoristas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Motoristas
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {options.drivers.map((driver) => (
                  <label key={driver} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.drivers.includes(driver)}
                      onChange={() => handleMultiSelectChange('drivers', driver)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{driver}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {options.priorities.map((priority) => (
                  <label key={priority} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.priority.includes(priority)}
                      onChange={() => handleMultiSelectChange('priority', priority)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{priority}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Ordenação */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordenar por
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleSortChange('sortBy', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {defaultOptions.sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordem
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleSortChange('sortOrder', e.target.value as 'asc' | 'desc')}
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="desc">Decrescente</option>
                  <option value="asc">Crescente</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumo dos filtros ativos */}
      {activeFiltersCount > 0 && !isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Busca: &quot;{filters.searchTerm}&quot;
              </span>
            )}
            {(filters.dateRange.start || filters.dateRange.end) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Período selecionado
              </span>
            )}
            {filters.vehicleTypes.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                {filters.vehicleTypes.length} tipo(s) de veículo
              </span>
            )}
            {filters.regions.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                {filters.regions.length} região(ões)
              </span>
            )}
            {filters.status.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                {filters.status.length} status
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
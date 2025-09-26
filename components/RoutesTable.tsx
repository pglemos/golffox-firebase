import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Route, Passenger, Company, Employee } from '../types';
import { RouteStatus } from '../types';
import { PlusCircleIcon, PencilIcon, TrashIcon, XMarkIcon, UserIcon, MapPinIcon, ClockIcon, TruckIcon } from './icons/Icons';
import { MOCK_COMPANIES, MOCK_EMPLOYEES } from '../constants';
import { routeOptimizationService } from '../services/routeOptimizationService';

const getStatusBadgeClass = (status: RouteStatus) => {
  switch (status) {
    case RouteStatus.OnTime:
      return 'bg-golffox-blue-dark/80 text-white';
    case RouteStatus.Delayed:
      return 'bg-golffox-yellow/80 text-golffox-gray-dark';
    case RouteStatus.Problem:
      return 'bg-golffox-red/80 text-white';
    default:
      return 'bg-golffox-gray-medium/80 text-white';
  }
};

// Props interface for lifted state
interface RoutesTableProps {
  routes: Route[];
  setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
}

const RoutesTable: React.FC<RoutesTableProps> = ({ routes, setRoutes }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Partial<Route> & { passengers: { list: Passenger[] } } | null>(null);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  const [newPassengerName, setNewPassengerName] = useState('');
  const [newPassengerAddress, setNewPassengerAddress] = useState('');
  const [newPassengerCpf, setNewPassengerCpf] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  
  // Automation features state
  const [addressSuggestions, setAddressSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [employeeSuggestions, setEmployeeSuggestions] = useState<Employee[]>([]);
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [routeOptimizationSuggestion, setRouteOptimizationSuggestion] = useState<string>('');
  
  // Refs for autocomplete
  const addressInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  // Initialize Google Maps services
  useEffect(() => {
    if (window.google && window.google.maps) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      geocoder.current = new window.google.maps.Geocoder();
    }
  }, []);

  // Filter employees by company and search term
  const filteredEmployees = useMemo(() => {
    if (!selectedCompany) return [];
    
    let employees = MOCK_EMPLOYEES.filter(emp => emp.companyId === selectedCompany);
    
    if (newPassengerName.trim()) {
      const searchTerm = newPassengerName.toLowerCase();
      employees = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm) ||
        emp.cpf.includes(searchTerm)
      );
    }
    
    return employees.slice(0, 5); // Limit to 5 suggestions
  }, [selectedCompany, newPassengerName]);

  // Handle address autocomplete
  const handleAddressChange = (value: string) => {
    setNewPassengerAddress(value);
    
    if (value.length > 2 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        {
          input: value,
          componentRestrictions: { country: 'br' },
          types: ['address']
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setAddressSuggestions(predictions);
            setShowAddressSuggestions(true);
          } else {
            setAddressSuggestions([]);
            setShowAddressSuggestions(false);
          }
        }
      );
    } else {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    }
  };

  // Handle employee name autocomplete
  const handleNameChange = (value: string) => {
    setNewPassengerName(value);
    setShowEmployeeSuggestions(value.length > 0 && filteredEmployees.length > 0);
  };

  // Select address from suggestions
  const selectAddressSuggestion = (prediction: google.maps.places.AutocompletePrediction) => {
    setNewPassengerAddress(prediction.description);
    setShowAddressSuggestions(false);
    
    // Geocode the selected address
    if (geocoder.current) {
      setIsGeocodingAddress(true);
      geocoder.current.geocode(
        { address: prediction.description },
        (results, status) => {
          setIsGeocodingAddress(false);
          if (status === 'OK' && results && results[0]) {
            // Address geocoded successfully - coordinates will be used for route optimization
            console.log('Geocoded coordinates:', results[0].geometry.location.toJSON());
          }
        }
      );
    }
  };

  // Select employee from suggestions
  const selectEmployeeSuggestion = (employee: Employee) => {
    setNewPassengerName(employee.name);
    setNewPassengerCpf(employee.cpf);
    setNewPassengerAddress(employee.address);
    setShowEmployeeSuggestions(false);
    setShowAddressSuggestions(false);
  };

  // Gera sugestão de otimização baseada no número de passageiros
  const generateRouteOptimizationSuggestion = useCallback((passengerCount: number) => {
    return routeOptimizationService.generateOptimizationSuggestion(passengerCount);
  }, []);

  // Generate route optimization suggestion
  const generateRouteOptimization = () => {
    if (!currentRoute) {
      setRouteOptimizationSuggestion('');
      return;
    }

    const passengerCount = currentRoute.passengers.list.length;
    const suggestion = generateRouteOptimizationSuggestion(passengerCount);
    setRouteOptimizationSuggestion(suggestion);
  };

  // Update route optimization when passengers change
  useEffect(() => {
    generateRouteOptimization();
  }, [currentRoute?.passengers.list]);

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentRoute({ name: '', passengers: { list: [], onboard: 0, total: 0 } });
    setIsModalOpen(true);
  };

  const openEditModal = (route: Route) => {
    setModalMode('edit');
    setCurrentRoute({ ...route, passengers: { ...route.passengers, list: [...route.passengers.list] } });
    setIsModalOpen(true);
  };

  const openConfirmModal = (routeId: string) => {
    setRouteToDelete(routeId);
    setIsConfirmOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setIsConfirmOpen(false);
    setCurrentRoute(null);
    setRouteToDelete(null);
    setNewPassengerName('');
    setNewPassengerAddress('');
    setNewPassengerCpf('');
    setSelectedCompany('');
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    setEmployeeSuggestions([]);
    setShowEmployeeSuggestions(false);
    setIsGeocodingAddress(false);
    setRouteOptimizationSuggestion('');
  };

  const handleSave = () => {
    if (!currentRoute || !currentRoute.name?.trim()) return;

    if (modalMode === 'create') {
      const newRoute: Route = {
        id: `r${Date.now()}`,
        name: currentRoute.name,
        driver: 'A definir',
        vehicle: 'A definir',
        status: RouteStatus.OnTime,
        passengers: { onboard: 0, total: currentRoute.passengers.list.length, list: currentRoute.passengers.list },
        scheduledStart: 'N/A',
        actualStart: 'N/A',
        punctuality: 0,
      };
      setRoutes(prev => [newRoute, ...prev]);
    } else if (modalMode === 'edit' && currentRoute.id) {
       const updatedRoute = { ...currentRoute, passengers: { ...currentRoute.passengers, total: currentRoute.passengers.list.length } } as Route;
       setRoutes(prev => prev.map(r => (r.id === updatedRoute.id ? updatedRoute : r)));
    }
    handleClose();
  };

  const handleDelete = () => {
    if (!routeToDelete) return;
    setRoutes(prev => prev.filter(r => r.id !== routeToDelete));
    handleClose();
  };

  const handleAddPassenger = () => {
      if (!newPassengerName.trim() || !newPassengerAddress.trim() || !currentRoute) return;
      
      // Valida endereço se tiver coordenadas
      const hasValidCoordinates = routeOptimizationService.validateAddress(
        newPassengerAddress.trim(), 
        { lat: 0, lng: 0 }
      );

      const newPassenger: Passenger = {
          id: `p${Date.now()}`,
          name: newPassengerName.trim(),
          address: newPassengerAddress.trim(),
          pickupTime: hasValidCoordinates ? 'Calculando...' : 'A calcular',
          photoUrl: `https://picsum.photos/seed/${Date.now()}/100`,
          cpf: newPassengerCpf || '000.000.000-00',
          position: { lat: 0, lng: 0 } // Will be updated by geocoding
      };
      
      const updatedRoute = {
        ...currentRoute,
        passengers: {
          ...currentRoute.passengers,
          list: [...currentRoute.passengers.list, newPassenger]
        }
      };
      
      setCurrentRoute(updatedRoute);
      
      // Reset form
      setNewPassengerName('');
      setNewPassengerAddress('');
      setNewPassengerCpf('');
      setSelectedCompany('');
      setShowAddressSuggestions(false);
      setShowEmployeeSuggestions(false);
      
      // Atualiza sugestão de otimização
      const suggestion = generateRouteOptimizationSuggestion(updatedRoute.passengers.list.length);
      setRouteOptimizationSuggestion(suggestion);
  };

  const handleRemovePassenger = (passengerId: string) => {
      if (!currentRoute) return;
      setCurrentRoute(prev => prev ? ({ ...prev, passengers: { ...prev.passengers, list: prev.passengers.list.filter(p => p.id !== passengerId) } }) : null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-3xl font-bold text-golffox-gray-dark">Gerenciamento de Rotas</h2>
        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto bg-golffox-orange-primary text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-orange-600 transition-colors">
          <PlusCircleIcon className="h-5 w-5 mr-2" variant="bounce" />
          <span className="hidden sm:inline">Criar Nova Rota</span>
          <span className="sm:hidden">Nova Rota</span>
        </button>
      </div>
      
      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {routes.map((route: Route) => (
          <div key={route.id} className="bg-golffox-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-golffox-gray-dark text-lg">{route.name}</h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(route.status)}`}>
                {route.status}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-golffox-gray-medium">Motorista:</span>
                <span className="font-medium">{route.driver}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-golffox-gray-medium">Veículo:</span>
                <span className="font-medium">{route.vehicle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-golffox-gray-medium">Passageiros:</span>
                <span className="font-medium">{route.passengers.list.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-golffox-gray-medium">Pontualidade:</span>
                <span className={`font-bold ${route.punctuality > 5 ? 'text-golffox-red' : route.punctuality > 0 ? 'text-golffox-yellow' : 'text-golffox-blue-light'}`}>
                  {route.punctuality === 0 ? '✓' : `${route.punctuality > 0 ? '+' : ''}${route.punctuality} min`}
                </span>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => openEditModal(route)}
                className="bg-golffox-blue-light text-white p-2 rounded-lg hover:bg-blue-600 transition-colors">
                <PencilIcon className="h-4 w-4" variant="hover" />
              </button>
              <button
                onClick={() => openConfirmModal(route.id)}
                className="bg-golffox-red text-white p-2 rounded-lg hover:bg-red-600 transition-colors">
                <TrashIcon className="h-4 w-4" variant="pulse" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-golffox-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-golffox-blue-dark text-white">
            <tr>
              <th className="py-3 px-6 text-left font-semibold">Rota</th>
              <th className="py-3 px-6 text-left font-semibold">Motorista</th>
              <th className="py-3 px-6 text-left font-semibold">Veículo</th>
              <th className="py-3 px-6 text-center font-semibold">Status</th>
              <th className="py-3 px-6 text-center font-semibold">Passageiros</th>
              <th className="py-3 px-6 text-center font-semibold">Pontualidade</th>
              <th className="py-3 px-6 text-center font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="text-golffox-gray-medium">
            {routes.map((route: Route, index: number) => (
              <tr key={route.id} className={index % 2 === 0 ? 'bg-white' : 'bg-golffox-gray-light'}>
                <td className="py-4 px-6 font-medium text-golffox-gray-dark">{route.name}</td>
                <td className="py-4 px-6">{route.driver}</td>
                <td className="py-4 px-6">{route.vehicle}</td>
                <td className="py-4 px-6 text-center">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(route.status)}`}>
                    {route.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-center">{`${route.passengers.list.length}`}</td>
                <td className={`py-4 px-6 text-center font-bold ${route.punctuality > 5 ? 'text-golffox-red' : route.punctuality > 0 ? 'text-golffox-yellow' : 'text-golffox-blue-light'}`}>
                  {route.punctuality === 0 ? '✓' : `${route.punctuality > 0 ? '+' : ''}${route.punctuality} min`}
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex justify-center items-center space-x-2">
                    <button onClick={() => openEditModal(route)} className="text-golffox-blue-light hover:text-golffox-blue-dark p-1" title="Editar Rota">
                      <PencilIcon className="h-5 w-5" variant="hover" />
                    </button>
                    <button onClick={() => openConfirmModal(route.id)} className="text-golffox-red hover:text-red-700 p-1" title="Excluir Rota">
                      <TrashIcon className="h-5 w-5" variant="pulse" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && currentRoute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in-down">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-xl font-bold text-golffox-gray-dark">{modalMode === 'create' ? 'Criar Nova Rota' : 'Editar Rota'}</h3>
              <button onClick={handleClose} className="p-1 rounded-full hover:bg-golffox-gray-light">
                <XMarkIcon className="h-6 w-6 text-golffox-gray-medium" variant="rotate" />
              </button>
            </div>
            
            <div className="overflow-y-auto pr-2 flex-grow">
              <div>
                <label htmlFor="routeName" className="block text-sm font-medium text-golffox-gray-dark">Nome da Rota</label>
                <input
                  type="text"
                  id="routeName"
                  value={currentRoute.name || ''}
                  onChange={(e) => setCurrentRoute({...currentRoute, name: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-golffox-gray-light rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-golffox-orange-primary focus:ring-1 focus:ring-golffox-orange-primary"
                  placeholder="Ex: Rota Minerva - Noite"
                />
              </div>

              <hr className="my-6"/>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-golffox-gray-dark">Passageiros da Rota</h4>
                  {routeOptimizationSuggestion && (
                    <div className="flex items-center text-sm text-golffox-blue-light bg-blue-50 px-3 py-1 rounded-lg">
                      <TruckIcon className="h-4 w-4 mr-2" />
                      {routeOptimizationSuggestion}
                    </div>
                  )}
                </div>
                
                <div className="bg-golffox-gray-light p-4 rounded-lg">
                  {/* Company Selection for Employee Suggestions */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-golffox-gray-dark mb-2">
                      Empresa (para sugestões automáticas)
                    </label>
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-golffox-orange-primary"
                    >
                      <option value="">Selecione uma empresa...</option>
                      {MOCK_COMPANIES.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Passenger Input Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    {/* Name Input with Employee Suggestions */}
                    <div className="relative">
                      <input
                        ref={nameInputRef}
                        type="text"
                        placeholder="Nome do Passageiro"
                        value={newPassengerName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-golffox-orange-primary"
                      />
                      {showEmployeeSuggestions && filteredEmployees.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {filteredEmployees.map(employee => (
                            <button
                              key={employee.id}
                              onClick={() => selectEmployeeSuggestion(employee)}
                              className="w-full text-left px-3 py-2 hover:bg-golffox-gray-light text-sm"
                            >
                              <div className="font-medium">{employee.name}</div>
                              <div className="text-xs text-gray-500">{employee.cpf}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* CPF Input */}
                    <div>
                      <input
                        type="text"
                        placeholder="CPF"
                        value={newPassengerCpf}
                        onChange={(e) => setNewPassengerCpf(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-golffox-orange-primary"
                      />
                    </div>

                    {/* Address Input with Autocomplete */}
                    <div className="md:col-span-2 relative">
                      <div className="relative">
                        <input
                          ref={addressInputRef}
                          type="text"
                          placeholder="Endereço Completo"
                          value={newPassengerAddress}
                          onChange={(e) => handleAddressChange(e.target.value)}
                          className="w-full px-3 py-2 pr-8 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-golffox-orange-primary"
                        />
                        {isGeocodingAddress && (
                          <div className="absolute right-2 top-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-golffox-orange-primary"></div>
                          </div>
                        )}
                        <MapPinIcon className="absolute right-2 top-2 h-4 w-4 text-gray-400" variant="float" />
                      </div>
                      {showAddressSuggestions && addressSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {addressSuggestions.map((prediction, index) => (
                            <button
                              key={prediction.place_id}
                              onClick={() => selectAddressSuggestion(prediction)}
                              className="w-full text-left px-3 py-2 hover:bg-golffox-gray-light text-sm"
                            >
                              <div className="flex items-center">
                                <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" variant="float" />
                                {prediction.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleAddPassenger} 
                    disabled={!newPassengerName.trim() || !newPassengerAddress.trim()}
                    className="w-full md:w-auto px-4 py-2 bg-golffox-blue-light text-white text-sm font-semibold rounded-lg hover:bg-golffox-blue-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <PlusCircleIcon className="h-4 w-4 mr-2 inline" variant="bounce" />
                    Adicionar Passageiro
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {currentRoute.passengers.list.length === 0 ? (
                    <p className="text-center text-golffox-gray-medium text-sm py-4">Nenhum passageiro adicionado a esta rota.</p>
                  ) : (
                    <div className="space-y-2">
                      {currentRoute.passengers.list.map((p, index) => (
                        <div key={p.id} className="bg-white border border-golffox-gray-light p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start flex-1">
                              <div className="flex items-center justify-center w-8 h-8 bg-golffox-blue-light text-white rounded-full text-sm font-bold mr-3 mt-1">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <UserIcon className="h-4 w-4 mr-2 text-golffox-gray-medium" variant="hover"/>
                                  <p className="font-semibold text-golffox-gray-dark">{p.name}</p>
                                  {p.cpf !== '000.000.000-00' && (
                                    <span className="ml-2 text-xs text-golffox-gray-medium bg-gray-100 px-2 py-1 rounded">
                                      {p.cpf}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center mb-2">
                                  <MapPinIcon className="h-4 w-4 mr-2 text-golffox-gray-medium" variant="float"/>
                                  <p className="text-sm text-golffox-gray-medium">{p.address}</p>
                                </div>
                                <div className="flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-2 text-golffox-gray-medium" variant="rotate"/>
                                  <p className="text-sm text-golffox-gray-medium">
                                    Horário de coleta: <span className="font-medium">{p.pickupTime}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleRemovePassenger(p.id)} 
                              className="text-golffox-red hover:text-red-700 p-1 ml-2" 
                              title="Remover Passageiro"
                            >
                              <TrashIcon className="h-5 w-5"/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2 flex-shrink-0 border-t pt-4">
              <button onClick={handleClose} className="px-4 py-2 bg-golffox-gray-light text-golffox-gray-dark font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 bg-golffox-orange-primary text-white font-semibold rounded-lg hover:bg-orange-600">Salvar Rota</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in-down">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-golffox-gray-dark">Confirmar Exclusão</h3>
            <p className="text-golffox-gray-medium my-4">Tem certeza que deseja excluir esta rota? Esta ação não pode ser desfeita.</p>
            <div className="mt-6 flex justify-end space-x-2">
              <button onClick={handleClose} className="px-4 py-2 bg-golffox-gray-light text-golffox-gray-dark font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-golffox-red text-white font-semibold rounded-lg hover:bg-red-700">Excluir</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoutesTable;
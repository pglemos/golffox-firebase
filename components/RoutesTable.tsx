import React, { useState } from 'react';
import type { Route, Passenger } from '../types';
import { RouteStatus } from '../types';
import { PlusCircleIcon, PencilIcon, TrashIcon, XMarkIcon, UserIcon } from './icons/Icons';

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
      const newPassenger: Passenger = {
          id: `p${Date.now()}`,
          name: newPassengerName,
          address: newPassengerAddress,
          pickupTime: 'N/A',
          photoUrl: `https://picsum.photos/seed/${Date.now()}/100`,
          cpf: '000.000.000-00',
          position: { lat: 0, lng: 0 }
      };
      setCurrentRoute(prev => prev ? ({ ...prev, passengers: { ...prev.passengers, list: [...prev.passengers.list, newPassenger] } }) : null);
      setNewPassengerName('');
      setNewPassengerAddress('');
  };

  const handleRemovePassenger = (passengerId: string) => {
      if (!currentRoute) return;
      setCurrentRoute(prev => prev ? ({ ...prev, passengers: { ...prev.passengers, list: prev.passengers.list.filter(p => p.id !== passengerId) } }) : null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-golffox-gray-dark">Gerenciamento de Rotas</h2>
        <button
          onClick={openCreateModal}
          className="bg-golffox-orange-primary text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-orange-600 transition-colors">
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Criar Nova Rota
        </button>
      </div>
      <div className="bg-golffox-white rounded-lg shadow-md overflow-hidden">
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
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => openConfirmModal(route.id)} className="text-golffox-red hover:text-red-700 p-1" title="Excluir Rota">
                      <TrashIcon className="h-5 w-5" />
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
                <XMarkIcon className="h-6 w-6 text-golffox-gray-medium" />
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
                <h4 className="text-lg font-bold text-golffox-gray-dark mb-4">Passageiros da Rota</h4>
                <div className="bg-golffox-gray-light p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <input type="text" placeholder="Nome do Passageiro" value={newPassengerName} onChange={e => setNewPassengerName(e.target.value)} className="md:col-span-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-golffox-orange-primary"/>
                    <input type="text" placeholder="Endereço Completo" value={newPassengerAddress} onChange={e => setNewPassengerAddress(e.target.value)} className="md:col-span-2 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-golffox-orange-primary"/>
                  </div>
                  <button onClick={handleAddPassenger} className="w-full md:w-auto px-4 py-2 bg-golffox-blue-light text-white text-sm font-semibold rounded-lg hover:bg-golffox-blue-dark">Adicionar Passageiro</button>
                </div>

                <div className="mt-4 space-y-2">
                  {currentRoute.passengers.list.length === 0 ? (
                    <p className="text-center text-golffox-gray-medium text-sm py-4">Nenhum passageiro adicionado a esta rota.</p>
                  ) : (
                    currentRoute.passengers.list.map(p => (
                      <div key={p.id} className="bg-white border border-golffox-gray-light p-3 rounded-lg flex justify-between items-center">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 mr-3 text-golffox-gray-medium"/>
                          <div>
                            <p className="font-semibold text-golffox-gray-dark">{p.name}</p>
                            <p className="text-xs text-golffox-gray-medium">{p.address}</p>
                          </div>
                        </div>
                        <button onClick={() => handleRemovePassenger(p.id)} className="text-golffox-red hover:text-red-700 p-1" title="Remover Passageiro">
                          <TrashIcon className="h-5 w-5"/>
                        </button>
                      </div>
                    ))
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
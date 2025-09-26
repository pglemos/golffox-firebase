import React from 'react';
import { MOCK_ROUTES, GOLFFOX_LOGO_BASE64 } from '../../constants';
import type { Route } from '../../types';
import { RouteStatus } from '../../types';
import { UserGroupIcon, ChartBarIcon, ClockIcon } from '../icons/Icons';

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


const InfoCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
  <div className="bg-golffox-white rounded-lg shadow-md p-6">
    <div className="flex items-center">
        <div className="p-3 rounded-full bg-golffox-orange-primary/10 mr-4">
            {icon}
        </div>
        <div>
            <h3 className="text-md font-medium text-golffox-gray-medium">{title}</h3>
            <p className="text-2xl font-bold text-golffox-gray-dark">{value}</p>
        </div>
    </div>
  </div>
);


const ClientDashboard: React.FC = () => {
    // Simulating data for a specific client, e.g., "Minerva"
    const clientRoutes = MOCK_ROUTES.filter(r => r.name.includes('Minerva'));
    const totalPassengers = clientRoutes.reduce((sum, route) => sum + route.passengers.onboard, 0);
    const averagePunctuality = clientRoutes.reduce((sum, route) => sum + route.punctuality, 0) / clientRoutes.length;

    return (
        <div className="h-full w-full bg-golffox-gray-light/80 flex flex-col">
            <header className="bg-white p-4 shadow-sm flex justify-between items-center border-b border-golffox-gray-light">
                <div className="flex items-center">
                    <img src={GOLFFOX_LOGO_BASE64} alt="Client Logo" className="h-10 mr-4" />
                     <div>
                        <h1 className="text-2xl font-bold text-golffox-gray-dark">Portal do Operador</h1>
                        <p className="text-sm text-golffox-gray-medium">Contrato: Minerva Foods</p>
                    </div>
                </div>
                 <div className="flex items-center text-sm text-golffox-gray-medium">
                    <span className="mr-2">Powered by</span> 
                    {/* FIX: Use Base64 logo to prevent broken image icon. */}
                    <img src={GOLFFOX_LOGO_BASE64} alt="Golffox Logo" className="h-6" />
                </div>
            </header>

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <InfoCard 
                        title="Colaboradores Transportados Hoje"
                        value={totalPassengers.toString()}
                        icon={<UserGroupIcon className="h-8 w-8 text-golffox-orange-primary" variant="float"/>}
                    />
                    <InfoCard 
                        title="Rotas Contratadas Ativas"
                        value={clientRoutes.length.toString()}
                        icon={<ChartBarIcon className="h-8 w-8 text-golffox-orange-primary" variant="scale"/>}
                    />
                     <InfoCard 
                        title="Pontualidade Média"
                        value={`${averagePunctuality.toFixed(1)} min`}
                        icon={<ClockIcon className="h-8 w-8 text-golffox-orange-primary" variant="rotate"/>}
                    />
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-golffox-gray-dark mb-4">Status das Rotas de Hoje</h2>
                    <div className="bg-golffox-white rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full">
                        <thead className="bg-golffox-blue-dark text-white">
                            <tr>
                            <th className="py-3 px-6 text-left font-semibold">Rota</th>
                            <th className="py-3 px-6 text-left font-semibold">Motorista</th>
                            <th className="py-3 px-6 text-center font-semibold">Status</th>
                            <th className="py-3 px-6 text-center font-semibold">Passageiros</th>
                            <th className="py-3 px-6 text-center font-semibold">Pontualidade</th>
                            </tr>
                        </thead>
                        <tbody className="text-golffox-gray-medium">
                            {clientRoutes.map((route: Route, index: number) => (
                            <tr key={route.id} className={index % 2 === 0 ? 'bg-white' : 'bg-golffox-gray-light'}>
                                <td className="py-4 px-6 font-medium text-golffox-gray-dark">{route.name}</td>
                                <td className="py-4 px-6">{route.driver}</td>
                                <td className="py-4 px-6 text-center">
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(route.status)}`}>
                                    {route.status}
                                </span>
                                </td>
                                <td className="py-4 px-6 text-center">{`${route.passengers.onboard} / ${route.passengers.total}`}</td>
                                <td className={`py-4 px-6 text-center font-bold ${route.punctuality > 5 ? 'text-golffox-red' : route.punctuality > 0 ? 'text-golffox-yellow' : 'text-golffox-blue-light'}`}>
                                {route.punctuality === 0 ? '✓' : `${route.punctuality > 0 ? '+' : ''}${route.punctuality} min`}
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ClientDashboard;
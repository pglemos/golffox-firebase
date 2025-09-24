import React from 'react';
import { MOCK_ROUTES, MOCK_VEHICLES, MOCK_ALERTS } from '../constants';
import { UserGroupIcon, TruckIcon, ChartBarIcon, ExclamationTriangleIcon } from './icons/Icons';
import { AlertType } from '../types';

const InfoCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  borderColor: string;
}> = ({ title, value, icon, borderColor }) => (
  <div className={`bg-golffox-white rounded-lg shadow-md p-4 sm:p-6 flex flex-col justify-between border-t-4 ${borderColor}`}>
    <div className="flex items-center justify-between">
      <h3 className="text-sm sm:text-lg font-medium text-golffox-gray-medium">{title}</h3>
      <div className="text-golffox-orange-primary">{icon}</div>
    </div>
    <p className="text-2xl sm:text-4xl font-bold text-golffox-gray-dark mt-2">{value}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const totalPassengers = MOCK_ROUTES.reduce((sum, route) => sum + route.passengers.onboard, 0);
  const activeVehicles = MOCK_VEHICLES.filter(v => v.status !== 'Parado').length;
  const criticalAlerts = MOCK_ALERTS.filter(a => a.type === AlertType.Critical).length;

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-golffox-gray-dark mb-4 sm:mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <InfoCard
          title="Colaboradores em Trânsito"
          value={totalPassengers.toString()}
          icon={<UserGroupIcon className="h-8 w-8" />}
          borderColor="border-golffox-orange-primary"
        />
        <InfoCard
          title="Veículos Ativos"
          value={`${activeVehicles}/${MOCK_VEHICLES.length}`}
          icon={<TruckIcon className="h-8 w-8" />}
          borderColor="border-golffox-blue-light"
        />
        <InfoCard
          title="Rotas do Dia"
          value={MOCK_ROUTES.length.toString()}
          icon={<ChartBarIcon className="h-8 w-8" />}
          borderColor="border-golffox-blue-dark"
        />
        <InfoCard
          title="Alertas Críticos"
          value={criticalAlerts.toString()}
          icon={<ExclamationTriangleIcon className="h-8 w-8" />}
          borderColor="border-golffox-red"
        />
      </div>

       <div className="mt-6 sm:mt-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-lg sm:text-xl font-bold text-golffox-gray-dark mb-3 sm:mb-4">Visão Geral Rápida</h3>
            <p className="text-sm sm:text-base text-golffox-gray-medium">
                Bem-vindo ao painel de gestão da Golffox. Aqui você pode monitorar todas as operações em tempo real. Utilize o menu para navegar entre as seções de mapa, rotas, alertas e relatórios detalhados.
            </p>
        </div>
    </div>
  );
};

export default Dashboard;
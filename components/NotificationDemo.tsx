import React from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, Clock, Car, Users } from 'lucide-react';
import { useToastNotifications } from '../hooks/useToastNotifications';
import { useNotifications } from '../hooks/useNotifications';
import { AlertType } from '../types';
import { NotificationContainer } from './NotificationToast';

const NotificationDemo: React.FC = () => {
    const {
        toasts,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showRouteOptimized,
        showPassengerPickedUp,
        showDelayAlert,
        showEmergencyAlert,
        showMaintenanceAlert,
        position
    } = useToastNotifications();

    const {
        addAlert,
        generateRouteIssueAlert,
        generatePassengerNotFoundAlert,
        generateEmergencyAlert: generateEmergencyAlertService,
        checkRoutes,
        checkVehicles
    } = useNotifications();

    // Simula dados de teste
    const simulateRouteOptimization = () => {
        showRouteOptimized('Rota Centro-Bairro', 8);
    };

    const simulatePassengerPickup = () => {
        showPassengerPickedUp('Maria Silva', 'Rota Universitária');
    };

    const simulateDelayAlert = () => {
        showDelayAlert('Rota Shopping', 15);
    };

    const simulateEmergencyAlert = () => {
        showEmergencyAlert('ABC-1234', 'Av. Principal, 123');
    };

    const simulateMaintenanceAlert = () => {
        showMaintenanceAlert('XYZ-5678', 1);
    };

    const simulateCustomAlert = () => {
        addAlert({
            type: AlertType.Warning,
            title: 'Tráfego Intenso',
            message: 'Detectado tráfego intenso na Av. Paulista. Rotas podem sofrer atrasos.'
        });
    };

    const simulateRouteIssue = () => {
        generateRouteIssueAlert('RT-001', 'Veículo quebrado no meio da rota', AlertType.Critical);
    };

    const simulatePassengerNotFound = () => {
        generatePassengerNotFoundAlert('João Santos', 'Rota Residencial');
    };

    const simulateServiceEmergency = () => {
        generateEmergencyAlertService('DEF-9012', 'Shopping Center', 'Passageiro passou mal');
    };

    // Simula verificação automática de rotas
    const simulateRouteCheck = () => {
        const mockRoutes = [
            {
                id: 'route1',
                name: 'Rota Centro',
                driver: 'Carlos Silva',
                punctuality: 25, // Atraso crítico
                passengers: { onboard: 8, total: 10 }
            },
            {
                id: 'route2',
                name: 'Rota Universitária',
                driver: 'Ana Costa',
                punctuality: 12, // Atraso normal
                passengers: { onboard: 15, total: 15 }
            }
        ] as any;

        checkRoutes(mockRoutes);
    };

    // Simula verificação automática de veículos
    const simulateVehicleCheck = () => {
        const mockVehicles = [
            {
                id: 'vehicle1',
                plate: 'ABC-1234',
                driver: 'Carlos Silva',
                status: 'Problem', // Problema no veículo
                nextMaintenance: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 dias
            },
            {
                id: 'vehicle2',
                plate: 'XYZ-5678',
                driver: 'Ana Costa',
                status: 'Active',
                nextMaintenance: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() // 1 dia
            }
        ] as any;

        checkVehicles(mockVehicles);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border">
                <div className="flex items-center space-x-2 mb-4">
                    <Bell className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-900">
                        Sistema de Notificações em Tempo Real
                    </h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                    Teste o sistema de notificações com diferentes tipos de alertas e situações.
                </p>

                {/* Notificações Básicas */}
                <div className="mb-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Notificações Básicas</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button
                            onClick={() => showSuccess('Sucesso!', 'Operação realizada com sucesso.')}
                            className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <CheckCircle className="w-4 h-4" />
                            <span>Sucesso</span>
                        </button>
                        
                        <button
                            onClick={() => showError('Erro!', 'Ocorreu um erro na operação.')}
                            className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Erro</span>
                        </button>
                        
                        <button
                            onClick={() => showWarning('Atenção!', 'Verifique as configurações.')}
                            className="flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Aviso</span>
                        </button>
                        
                        <button
                            onClick={() => showInfo('Informação', 'Nova atualização disponível.')}
                            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Info className="w-4 h-4" />
                            <span>Info</span>
                        </button>
                    </div>
                </div>

                {/* Notificações Específicas do Domínio */}
                <div className="mb-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Notificações do Sistema</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <button
                            onClick={simulateRouteOptimization}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <CheckCircle className="w-4 h-4" />
                            <span>Rota Otimizada</span>
                        </button>
                        
                        <button
                            onClick={simulatePassengerPickup}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Users className="w-4 h-4" />
                            <span>Passageiro Coletado</span>
                        </button>
                        
                        <button
                            onClick={simulateDelayAlert}
                            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                        >
                            <Clock className="w-4 h-4" />
                            <span>Atraso Detectado</span>
                        </button>
                        
                        <button
                            onClick={simulateEmergencyAlert}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Emergência</span>
                        </button>
                        
                        <button
                            onClick={simulateMaintenanceAlert}
                            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                        >
                            <Car className="w-4 h-4" />
                            <span>Manutenção</span>
                        </button>
                        
                        <button
                            onClick={simulateCustomAlert}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            <Info className="w-4 h-4" />
                            <span>Tráfego Intenso</span>
                        </button>
                    </div>
                </div>

                {/* Alertas do Serviço */}
                <div className="mb-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Alertas do Serviço</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <button
                            onClick={simulateRouteIssue}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Problema na Rota</span>
                        </button>
                        
                        <button
                            onClick={simulatePassengerNotFound}
                            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                        >
                            <Users className="w-4 h-4" />
                            <span>Passageiro Não Encontrado</span>
                        </button>
                        
                        <button
                            onClick={simulateServiceEmergency}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Emergência Médica</span>
                        </button>
                    </div>
                </div>

                {/* Verificações Automáticas */}
                <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Verificações Automáticas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                            onClick={simulateRouteCheck}
                            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <Clock className="w-4 h-4" />
                            <span>Verificar Rotas</span>
                        </button>
                        
                        <button
                            onClick={simulateVehicleCheck}
                            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <Car className="w-4 h-4" />
                            <span>Verificar Veículos</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Container de Notificações Toast */}
            <NotificationContainer
                notifications={toasts}
                onDismiss={removeToast}
                position={position}
                maxNotifications={5}
            />
        </div>
    );
};

export default NotificationDemo;
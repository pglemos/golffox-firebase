import React, { useState } from 'react';
import { Driver } from '../types';
import { MOCK_DRIVERS } from '../constants';
import DriverRegistrationForm from './DriverRegistrationForm';

const DriversManagement: React.FC = () => {
    const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

    const handleViewCNH = (driver: Driver) => {
        setSelectedDriver(driver);
    };

    const handleAddDriver = () => {
        setEditingDriver(null);
        setShowRegistrationForm(true);
    };

    const handleEditDriver = (driver: Driver) => {
        setEditingDriver(driver);
        setShowRegistrationForm(true);
    };

    const handleSubmitDriver = (driverData: Partial<Driver>) => {
        if (editingDriver) {
            // Editar motorista existente
            setDrivers(prev => prev.map(driver => 
                driver.id === editingDriver.id 
                    ? { ...driver, ...driverData } as Driver
                    : driver
            ));
        } else {
            // Adicionar novo motorista
            const newDriver: Driver = {
                ...driverData,
                id: `d${Date.now()}`,
                photoUrl: 'https://picsum.photos/seed/new/100'
            } as Driver;
            setDrivers(prev => [...prev, newDriver]);
        }
        setShowRegistrationForm(false);
        setEditingDriver(null);
    };

    const handleCancelRegistration = () => {
        setShowRegistrationForm(false);
        setEditingDriver(null);
    };

    const handleDeleteDriver = (driverId: string) => {
        if (confirm('Tem certeza que deseja excluir este motorista?')) {
            setDrivers(prev => prev.filter(driver => driver.id !== driverId));
        }
    };

    const getStatusColor = (status: Driver['status']) => {
        switch (status) {
            case 'Ativo':
                return 'bg-green-100 text-green-800';
            case 'Em análise':
                return 'bg-yellow-100 text-yellow-800';
            case 'Inativo':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Gestão de Motoristas</h2>
                <button 
                    onClick={handleAddDriver}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Cadastrar Motorista
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Motorista
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    CPF
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    CNH
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Categoria
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Validade CNH
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contrato
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {drivers.map((driver) => (
                                <tr key={driver.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img
                                                className="h-10 w-10 rounded-full"
                                                src={driver.photoUrl}
                                                alt={driver.name}
                                            />
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {driver.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {driver.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {driver.cpf}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {driver.cnh}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {driver.cnhCategory}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(driver.cnhValidity)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(driver.status)}`}>
                                            {driver.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {driver.contractType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleViewCNH(driver)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Ver detalhes"
                                            >
                                                👁️
                                            </button>
                                            <button
                                                onClick={() => handleEditDriver(driver)}
                                                className="text-green-600 hover:text-green-900"
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteDriver(driver.id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Excluir"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal para visualizar detalhes do motorista */}
            {selectedDriver && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold">Detalhes do Motorista</h3>
                            <button
                                onClick={() => setSelectedDriver(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Dados Pessoais */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-3">Dados Pessoais</h4>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">Nome:</span> {selectedDriver.name}</p>
                                    <p><span className="font-medium">CPF:</span> {selectedDriver.cpf}</p>
                                    <p><span className="font-medium">RG:</span> {selectedDriver.rg}</p>
                                    <p><span className="font-medium">Nascimento:</span> {formatDate(selectedDriver.birthDate)}</p>
                                    <p><span className="font-medium">Telefone:</span> {selectedDriver.phone}</p>
                                    <p><span className="font-medium">E-mail:</span> {selectedDriver.email}</p>
                                    <p><span className="font-medium">Endereço:</span> {selectedDriver.address}</p>
                                    <p><span className="font-medium">CEP:</span> {selectedDriver.cep}</p>
                                </div>
                            </div>

                            {/* Dados Profissionais */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-3">Dados Profissionais</h4>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">CNH:</span> {selectedDriver.cnh}</p>
                                    <p><span className="font-medium">Validade CNH:</span> {formatDate(selectedDriver.cnhValidity)}</p>
                                    <p><span className="font-medium">Categoria:</span> {selectedDriver.cnhCategory}</p>
                                    <p><span className="font-medium">EAR:</span> {selectedDriver.hasEAR ? 'Sim' : 'Não'}</p>
                                    <p><span className="font-medium">Último Exame:</span> {formatDate(selectedDriver.lastToxicologicalExam)}</p>
                                    {selectedDriver.transportCourseValidity && (
                                        <p><span className="font-medium">Validade Curso:</span> {formatDate(selectedDriver.transportCourseValidity)}</p>
                                    )}
                                </div>
                            </div>

                            {/* Vínculo Golffox */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-3">Vínculo Golffox</h4>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">Contrato:</span> {selectedDriver.contractType}</p>
                                    <p><span className="font-medium">Credenciamento:</span> {formatDate(selectedDriver.credentialingDate)}</p>
                                    <p><span className="font-medium">Status:</span> {selectedDriver.status}</p>
                                    <p><span className="font-medium">Empresa:</span> {selectedDriver.linkedCompany}</p>
                                </div>
                            </div>

                            {/* Informações Operacionais */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-3">Informações Operacionais</h4>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">Rotas:</span> {selectedDriver.assignedRoutes?.join(', ') || 'Nenhuma'}</p>
                                    <p><span className="font-medium">Disponibilidade:</span> {selectedDriver.availability || 'Não informado'}</p>
                                    <p><span className="font-medium">Última Atualização:</span> {formatDate(selectedDriver.lastUpdate)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setSelectedDriver(null)}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Formulário de Cadastro/Edição */}
            {showRegistrationForm && (
                <DriverRegistrationForm
                    onSubmit={handleSubmitDriver}
                    onCancel={handleCancelRegistration}
                    initialData={editingDriver || {}}
                />
            )}
        </div>
    );
};

export default DriversManagement;
import React, { useState } from 'react';
import { GOLFFOX_LOGO_BASE64 } from '../../constants';
import type { Employee, PermissionProfile } from '../../types';

interface ClientLoginScreenProps {
    onLogin: (operator: Employee) => void;
    employees: Employee[];
    permissionProfiles: PermissionProfile[];
}

const ClientLoginScreen: React.FC<ClientLoginScreenProps> = ({ onLogin, employees, permissionProfiles }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Simulate network delay for a better user experience
        setTimeout(() => {
            // 1. Find the 'Operador' permission profile ID
            const operatorProfile = permissionProfiles.find(p => p.name === 'Operador');
            if (!operatorProfile) {
                setError('Perfil de "Operador" não encontrado no sistema.');
                setIsLoading(false);
                return;
            }

            // 2. Find an employee with matching email and password
            const employee = employees.find(emp => emp.email === email && emp.password === password);
            
            // 3. Check if the employee exists and has the correct permission profile
            if (employee && employee.permissionProfileId === operatorProfile.id) {
                onLogin(employee);
            } else {
                setError('Email ou senha inválidos.');
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="w-full flex items-center justify-center bg-golffox-gray-light">
            <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-2xl text-center">
                <img src={GOLFFOX_LOGO_BASE64} alt="Golffox Logo" className="h-20 mb-6 mx-auto" />
                <h1 className="text-3xl font-bold text-golffox-gray-dark mb-2">Portal do Operador</h1>
                <p className="text-golffox-gray-medium mb-8">Faça login para gerenciar suas operações.</p>

                <form onSubmit={handleSubmit}>
                    <div className="w-full space-y-4 text-left">
                         <div>
                            <label className="text-sm font-bold text-golffox-gray-medium">Email</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu.email@empresa.com" 
                                disabled={isLoading}
                                className="mt-1 w-full p-3 bg-white border border-golffox-gray-light rounded-lg text-golffox-gray-dark focus:ring-2 focus:ring-golffox-orange-primary focus:outline-none"
                            />
                        </div>
                         <div>
                            <label className="text-sm font-bold text-golffox-gray-medium">Senha</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="********" 
                                disabled={isLoading}
                                className="mt-1 w-full p-3 bg-white border border-golffox-gray-light rounded-lg text-golffox-gray-dark focus:ring-2 focus:ring-golffox-orange-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    {error && <p className="text-golffox-red mt-4 text-center font-semibold">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-golffox-orange-primary text-white font-bold py-3 rounded-lg mt-8 hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 disabled:bg-golffox-gray-medium disabled:cursor-not-allowed flex items-center justify-center"
                    >
                         {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Acessando...
                            </>
                        ) : 'Acessar Portal'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ClientLoginScreen;
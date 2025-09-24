import React, { useState } from 'react';
import { GOLFFOX_LOGO_BASE64 } from '../../constants';
import type { Employee } from '../../types';

interface PassengerLoginScreenProps {
    employees: Employee[];
    onLoginSuccess: (user: Employee) => void;
}

const PassengerLoginScreen: React.FC<PassengerLoginScreenProps> = ({ employees, onLoginSuccess }) => {
    const [cpf, setCpf] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Simulate network delay for a better user experience
        setTimeout(() => {
            const user = employees.find(emp => emp.cpf === cpf && emp.password === password);

            if (user) {
                onLoginSuccess(user);
            } else {
                setError('CPF ou senha inválidos.');
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full bg-white p-4 sm:p-8">
            <img src={GOLFFOX_LOGO_BASE64} alt="Golffox Logo" className="h-20 sm:h-24 mb-6 sm:mb-8" />
            <h1 className="text-2xl sm:text-3xl font-bold text-golffox-gray-dark mb-2">Acesso do Passageiro</h1>
            <p className="text-golffox-gray-medium mb-8 sm:mb-10 text-center text-sm sm:text-base">Use seu CPF e senha para acompanhar sua rota.</p>

            <form onSubmit={handleSubmit} className="w-full">
                <div className="w-full space-y-4">
                    <input 
                        type="text" 
                        placeholder="CPF" 
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        disabled={isLoading}
                        className="w-full p-4 bg-white border border-golffox-gray-light rounded-lg text-golffox-gray-dark focus:ring-2 focus:ring-golffox-orange-primary focus:outline-none text-base"
                        autoComplete="username"
                    />
                    <input 
                        type="password" 
                        placeholder="Senha" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="w-full p-4 bg-white border border-golffox-gray-light rounded-lg text-golffox-gray-dark focus:ring-2 focus:ring-golffox-orange-primary focus:outline-none text-base"
                        autoComplete="current-password"
                    />
                </div>
                
                {error && <p className="text-golffox-red mt-4 text-center font-semibold">{error}</p>}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-golffox-orange-primary text-white font-bold py-4 rounded-lg mt-6 hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 disabled:bg-golffox-gray-medium disabled:cursor-not-allowed flex items-center justify-center touch-manipulation no-tap-highlight min-h-[48px]"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Entrando...
                        </>
                    ) : 'Entrar'}
                </button>
            </form>

            <p className="text-xs text-golffox-gray-medium mt-auto text-center">
                Sua senha é fornecida pela sua empresa.
            </p>
        </div>
    );
};

export default PassengerLoginScreen;

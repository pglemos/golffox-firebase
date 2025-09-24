import React from 'react';
import { GOLFFOX_LOGO_BASE64 } from '../../constants';

interface LoginScreenProps {
    onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-white p-8">
            <img src={GOLFFOX_LOGO_BASE64} alt="Golffox Logo" className="h-24 mb-8" />
            <h1 className="text-3xl font-bold text-golffox-gray-dark mb-2">Bem-vindo, Motorista</h1>
            <p className="text-golffox-gray-medium mb-10">Faça login para iniciar sua rota.</p>

            <div className="w-full space-y-4">
                <input 
                    type="text" 
                    placeholder="Usuário (CPF)" 
                    defaultValue="123.456.789-00"
                    className="w-full p-4 bg-white border border-golffox-gray-light rounded-lg text-golffox-gray-dark focus:ring-2 focus:ring-golffox-orange-primary focus:outline-none text-base"
                    autoComplete="username"
                />
                <input 
                    type="password" 
                    placeholder="Senha" 
                    defaultValue="********"
                    className="w-full p-4 bg-white border border-golffox-gray-light rounded-lg text-golffox-gray-dark focus:ring-2 focus:ring-golffox-orange-primary focus:outline-none text-base"
                    autoComplete="current-password"
                />
            </div>

            <button
                onClick={onLogin}
                className="w-full bg-golffox-orange-primary text-white font-bold py-4 rounded-lg mt-10 hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 touch-manipulation no-tap-highlight min-h-[48px]"
            >
                Entrar
            </button>

            <p className="text-xs text-golffox-gray-medium mt-auto">
                Em caso de problemas, contate o suporte.
            </p>
        </div>
    );
};

export default LoginScreen;

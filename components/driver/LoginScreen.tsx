import React from 'react';
import { GOLFFOX_LOGO_BASE64 } from '../../constants';

interface LoginScreenProps {
    onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-white p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center min-h-full">
                <img src={GOLFFOX_LOGO_BASE64} alt="Golffox Logo" className="h-16 sm:h-20 md:h-24 mb-6 sm:mb-8" />
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-golffox-gray-dark mb-2 text-center">Bem-vindo, Motorista</h1>
                <p className="text-sm sm:text-base text-golffox-gray-medium mb-6 sm:mb-8 md:mb-10 text-center">Faça login para iniciar sua rota.</p>

                <div className="w-full space-y-3 sm:space-y-4">
                    <input 
                        type="text" 
                        placeholder="Usuário (CPF)" 
                        defaultValue="123.456.789-00"
                        className="w-full p-3 sm:p-4 bg-white border border-golffox-gray-light rounded-lg text-golffox-gray-dark focus:ring-2 focus:ring-golffox-orange-primary focus:outline-none text-sm sm:text-base min-h-[48px]"
                        autoComplete="username"
                    />
                    <input 
                        type="password" 
                        placeholder="Senha" 
                        defaultValue="********"
                        className="w-full p-3 sm:p-4 bg-white border border-golffox-gray-light rounded-lg text-golffox-gray-dark focus:ring-2 focus:ring-golffox-orange-primary focus:outline-none text-sm sm:text-base min-h-[48px]"
                        autoComplete="current-password"
                    />
                </div>

                <button
                    onClick={onLogin}
                    className="w-full bg-golffox-orange-primary text-white font-bold py-3 sm:py-4 rounded-lg mt-6 sm:mt-8 md:mt-10 hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 active:scale-95 touch-manipulation no-tap-highlight min-h-[48px] text-sm sm:text-base"
                >
                    Entrar
                </button>

                <p className="text-xs sm:text-sm text-golffox-gray-medium mt-6 sm:mt-8 text-center">
                    Em caso de problemas, contate o suporte.
                </p>
            </div>
        </div>
    );
};

export default LoginScreen;

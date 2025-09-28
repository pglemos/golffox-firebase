import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { GOLFFOX_LOGO_BASE64 } from '../../config/constants';
import type { Employee, PermissionProfile } from '../../config/types';
import '../../styles/globals.css';

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
        <div className="flex items-center justify-center min-h-screen bg-black px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col md:flex-row w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl bg-black"
            >
                {/* Lado esquerdo - Formulário */}
                <motion.div
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex-1 p-6 sm:p-8 md:p-12 text-white flex flex-col justify-center"
                >
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex justify-center md:justify-start mb-6 sm:mb-8"
                    >
                        <Image
                            src="/golffox_logo.png"
                            alt="Golf Fox Logo"
                            className="w-28 sm:w-32 md:w-36 drop-shadow-[0_0_15px_rgba(255,165,0,0.8)]"
                            width={144}
                            height={48}
                        />
                    </motion.div>

                    {/* Título */}
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                        Portal do Operador<span className="text-orange-400">.</span>
                    </h2>
                    <p className="text-gray-300 mb-6 sm:mb-8">Faça login para gerenciar suas operações</p>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                        {/* Email */}
                        <div className="border-animate rounded-lg">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Digite seu email"
                                required
                                disabled={isLoading}
                                className="w-full px-4 py-3 rounded-lg bg-black text-white outline-none animate-neon-orange"
                            />
                        </div>

                        {/* Senha */}
                        <div className="border-animate rounded-lg">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Digite sua senha"
                                required
                                disabled={isLoading}
                                className="w-full px-4 py-3 rounded-lg bg-black text-white outline-none animate-neon-orange"
                            />
                        </div>

                        {/* Botão Entrar */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="border-animate rounded-lg"
                        >
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 rounded-lg font-semibold text-lg text-white bg-black hover:scale-105 transition-transform animate-neon-orange"
                            >
                                {isLoading ? 'Acessando...' : 'Acessar Portal'}
                            </button>
                        </motion.div>

                        {/* Registrar */}
                        <a
                            href="#"
                            className="block text-center text-sm text-gray-300 hover:text-orange-400 mt-4"
                        >
                            Ainda não tenho uma conta
                        </a>
                    </form>
                </motion.div>

                {/* Lado direito - Imagem (só aparece em telas md pra cima) */}
                <motion.div
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="hidden md:flex flex-1 relative"
                >
                    <Image
                        src="https://images.unsplash.com/photo-1503264116251-35a269479413?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80"
                        alt="Login background"
                        className="w-full h-full object-cover"
                        fill
                    />
                    <div className="absolute inset-0 bg-black/60" />
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ClientLoginScreen;
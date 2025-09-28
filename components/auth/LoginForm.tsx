'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { AlertCircle } from 'lucide-react';
import '../../styles/globals.css';

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  className?: string;
}

export function LoginForm({ onSuccess, onForgotPassword, className = '' }: LoginFormProps) {
  const { signIn, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpa erro quando usuário começa a digitar
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || loading) return;

    // Validação básica
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!formData.password.trim()) {
      setError('Senha é obrigatória');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Email inválido');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { user, error: signInError } = await signIn(formData.email, formData.password);

      if (signInError) {
        setError(signInError.message || 'Erro ao fazer login');
        return;
      }

      if (user) {
        console.log('Login realizado com sucesso:', user.email);
        onSuccess?.();
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro interno. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
            Faça seu login<span className="text-orange-400">.</span>
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Email */}
            <div className="border-animate rounded-lg">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Digite seu email"
                required
                disabled={isSubmitting || loading}
                className="w-full px-4 py-3 rounded-lg bg-black text-white outline-none animate-neon-orange"
              />
            </div>

            {/* Senha */}
            <div className="border-animate rounded-lg">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Digite sua senha"
                required
                disabled={isSubmitting || loading}
                className="w-full px-4 py-3 rounded-lg bg-black text-white outline-none animate-neon-orange"
              />
            </div>

            {/* Esqueci senha */}
            {onForgotPassword && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm text-gray-300 hover:text-orange-400 transition"
                  disabled={isSubmitting || loading}
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {/* Botão Entrar */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="border-animate rounded-lg"
            >
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full py-3 rounded-lg font-semibold text-lg text-white bg-black hover:scale-105 transition-transform animate-neon-orange"
              >
                {isSubmitting || loading ? 'Entrando...' : 'Entrar'}
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
}

export default LoginForm;
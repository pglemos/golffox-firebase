import React from 'react';

export type BusStatus = 'moving' | 'stopped' | 'problem' | 'garage';

interface BusIcon3DProps {
  status: BusStatus;
  size?: number;
  className?: string;
}

const BusIcon3D: React.FC<BusIcon3DProps> = ({ status, size = 26, className = '' }) => {
  // Cores baseadas no status do motorista
  const getColors = (status: BusStatus) => {
    switch (status) {
      case 'moving':
        return {
          primary: '#22C55E', // Verde
          secondary: '#16A34A',
          shadow: '#15803D',
          highlight: '#4ADE80'
        };
      case 'stopped':
        return {
          primary: '#F59E0B', // Amarelo
          secondary: '#D97706',
          shadow: '#B45309',
          highlight: '#FCD34D'
        };
      case 'problem':
        return {
          primary: '#EF4444', // Vermelho
          secondary: '#DC2626',
          shadow: '#B91C1C',
          highlight: '#F87171'
        };
      case 'garage':
        return {
          primary: '#3B82F6', // Azul
          secondary: '#2563EB',
          shadow: '#1D4ED8',
          highlight: '#60A5FA'
        };
      default:
        return {
          primary: '#6B7280',
          secondary: '#4B5563',
          shadow: '#374151',
          highlight: '#9CA3AF'
        };
    }
  };

  const colors = getColors(status);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
    >
      <defs>
        {/* Gradientes para efeito 3D */}
        <linearGradient id={`busGradient-${status}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.highlight} />
          <stop offset="50%" stopColor={colors.primary} />
          <stop offset="100%" stopColor={colors.secondary} />
        </linearGradient>
        
        <linearGradient id={`busShadow-${status}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.secondary} />
          <stop offset="100%" stopColor={colors.shadow} />
        </linearGradient>

        <linearGradient id={`busWindow-${status}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>

      {/* Sombra do ônibus */}
      <ellipse
        cx="16"
        cy="29"
        rx="14"
        ry="2.5"
        fill="rgba(0,0,0,0.15)"
      />

      {/* Corpo principal do ônibus - design mais moderno */}
      <rect
        x="3"
        y="7"
        width="26"
        height="18"
        rx="3"
        ry="3"
        fill={`url(#busGradient-${status})`}
        stroke={colors.shadow}
        strokeWidth="0.3"
      />

      {/* Parte frontal do ônibus (3D) - mais arredondada */}
      <rect
        x="3"
        y="7"
        width="5"
        height="18"
        rx="3"
        ry="3"
        fill={`url(#busShadow-${status})`}
      />

      {/* Para-brisa frontal */}
      <rect
        x="4"
        y="8"
        width="4"
        height="6"
        rx="1"
        fill={`url(#busWindow-${status})`}
        opacity="0.95"
      />

      {/* Janelas laterais - design mais limpo */}
      <rect
        x="10"
        y="9"
        width="4"
        height="5"
        rx="0.8"
        fill={`url(#busWindow-${status})`}
        opacity="0.9"
      />
      <rect
        x="15"
        y="9"
        width="4"
        height="5"
        rx="0.8"
        fill={`url(#busWindow-${status})`}
        opacity="0.9"
      />
      <rect
        x="20"
        y="9"
        width="4"
        height="5"
        rx="0.8"
        fill={`url(#busWindow-${status})`}
        opacity="0.9"
      />
      <rect
        x="25"
        y="9"
        width="3"
        height="5"
        rx="0.8"
        fill={`url(#busWindow-${status})`}
        opacity="0.9"
      />

      {/* Porta - design mais moderno */}
      <rect
        x="10"
        y="16"
        width="4"
        height="7"
        rx="0.8"
        fill={colors.shadow}
        opacity="0.7"
      />
      
      {/* Detalhe da porta */}
      <line
        x1="12"
        y1="17"
        x2="12"
        y2="22"
        stroke={colors.primary}
        strokeWidth="0.3"
        opacity="0.8"
      />

      {/* Rodas - design mais realista */}
      <circle
        cx="8"
        cy="26"
        r="3"
        fill="#1F2937"
        stroke="#111827"
        strokeWidth="0.4"
      />
      <circle
        cx="24"
        cy="26"
        r="3"
        fill="#1F2937"
        stroke="#111827"
        strokeWidth="0.4"
      />

      {/* Aros das rodas */}
      <circle cx="8" cy="26" r="2" fill="#374151" />
      <circle cx="24" cy="26" r="2" fill="#374151" />
      <circle cx="8" cy="26" r="1" fill="#4B5563" />
      <circle cx="24" cy="26" r="1" fill="#4B5563" />

      {/* Faróis - design mais moderno */}
      <ellipse
        cx="5"
        cy="11"
        rx="1.2"
        ry="0.8"
        fill="#F9FAFB"
        opacity="0.95"
      />
      <ellipse
        cx="5"
        cy="20"
        rx="1.2"
        ry="0.8"
        fill="#FEF3C7"
        opacity="0.9"
      />

      {/* Detalhes 3D - reflexos modernos */}
      <rect
        x="4"
        y="8"
        width="24"
        height="0.8"
        fill={colors.highlight}
        opacity="0.5"
        rx="0.4"
      />
      
      {/* Linha lateral para efeito 3D */}
      <line
        x1="3"
        y1="16"
        x2="29"
        y2="16"
        stroke={colors.shadow}
        strokeWidth="0.3"
        opacity="0.6"
      />
      
      {/* Detalhes adicionais para visual profissional */}
      <rect
        x="26"
        y="18"
        width="2"
        height="4"
        rx="0.5"
        fill={colors.secondary}
        opacity="0.8"
      />
    </svg>
  );
};

export default BusIcon3D;
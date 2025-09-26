'use client';

import React from 'react';
import { motion, HTMLMotionProps, Variants } from 'framer-motion';

export interface AnimatedIconProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'hover' | 'pulse' | 'bounce' | 'rotate' | 'scale' | 'float' | 'glow' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  interactive?: boolean;
}

const iconVariants: Record<string, Variants> = {
  hover: {
    rest: { 
      scale: 1, 
      rotate: 0,
      filter: 'brightness(1) drop-shadow(0 0 0px rgba(0,0,0,0))'
    },
    hover: { 
      scale: 1.1, 
      rotate: 5,
      filter: 'brightness(1.2) drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  },
  pulse: {
    rest: { 
      scale: 1,
      opacity: 1
    },
    animate: {
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  bounce: {
    rest: { y: 0 },
    hover: {
      y: [-2, -8, -2],
      transition: {
        duration: 0.6,
        ease: "easeInOut"
      }
    }
  },
  rotate: {
    rest: { rotate: 0 },
    hover: {
      rotate: 360,
      transition: {
        duration: 0.8,
        ease: "easeInOut"
      }
    }
  },
  scale: {
    rest: { 
      scale: 1,
      filter: 'brightness(1)'
    },
    hover: { 
      scale: 1.15,
      filter: 'brightness(1.1)',
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    }
  },
  float: {
    rest: { y: 0 },
    animate: {
      y: [-2, 2, -2],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  glow: {
    rest: { 
      filter: 'drop-shadow(0 0 0px rgba(59, 130, 246, 0))',
      scale: 1
    },
    hover: { 
      filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))',
      scale: 1.05,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  },
  premium: {
    rest: { 
      scale: 1,
      rotate: 0,
      filter: 'brightness(1) drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
    },
    hover: { 
      scale: 1.08,
      rotate: 2,
      filter: 'brightness(1.15) drop-shadow(0 8px 16px rgba(0,0,0,0.2))',
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 12
      }
    },
    tap: {
      scale: 0.95,
      rotate: -1,
      transition: {
        duration: 0.1
      }
    }
  }
};

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  children,
  variant = 'premium',
  size = 'md',
  disabled = false,
  interactive = true,
  className = '',
  ...props
}) => {
  const variants = iconVariants[variant];
  const sizeClass = sizeClasses[size];

  return (
    <motion.div
      className={`inline-flex items-center justify-center ${sizeClass} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : interactive ? 'cursor-pointer' : ''
      }`}
      variants={variants}
      initial="rest"
      animate={variant === 'pulse' || variant === 'float' ? 'animate' : 'rest'}
      whileHover={!disabled && interactive ? 'hover' : undefined}
      whileTap={!disabled && interactive && variant === 'premium' ? 'tap' : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Componente específico para ícones de navegação com animações premium
export const NavigationIcon: React.FC<AnimatedIconProps> = (props) => (
  <AnimatedIcon
    variant="premium"
    size="md"
    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
    {...props}
  />
);

// Componente específico para ícones de dashboard com efeito glow
export const DashboardIcon: React.FC<AnimatedIconProps> = (props) => (
  <AnimatedIcon
    variant="glow"
    size="lg"
    className="text-blue-600 dark:text-blue-400"
    {...props}
  />
);

// Componente específico para ícones de status com pulse
export const StatusIcon: React.FC<AnimatedIconProps> = (props) => (
  <AnimatedIcon
    variant="pulse"
    size="sm"
    interactive={false}
    {...props}
  />
);

// Componente específico para ícones de ação com bounce
export const ActionIcon: React.FC<AnimatedIconProps> = (props) => (
  <AnimatedIcon
    variant="bounce"
    size="md"
    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
    {...props}
  />
);
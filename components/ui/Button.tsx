import React from 'react';
import { designTokens } from '../../styles/design-system';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  const variantClasses = {
    primary: `
      bg-orange-500 hover:bg-orange-600 active:bg-orange-700
      text-white border border-transparent
      focus:ring-orange-500
      shadow-sm hover:shadow-md
    `,
    secondary: `
      bg-blue-900 hover:bg-blue-800 active:bg-blue-700
      text-white border border-transparent
      focus:ring-blue-900
      shadow-sm hover:shadow-md
    `,
    outline: `
      bg-transparent hover:bg-gray-50 active:bg-gray-100
      text-gray-700 border border-gray-300 hover:border-gray-400
      focus:ring-gray-500
    `,
    ghost: `
      bg-transparent hover:bg-gray-100 active:bg-gray-200
      text-gray-700 border border-transparent
      focus:ring-gray-500
    `,
    danger: `
      bg-red-500 hover:bg-red-600 active:bg-red-700
      text-white border border-transparent
      focus:ring-red-500
      shadow-sm hover:shadow-md
    `,
    success: `
      bg-green-500 hover:bg-green-600 active:bg-green-700
      text-white border border-transparent
      focus:ring-green-500
      shadow-sm hover:shadow-md
    `,
    warning: `
      bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700
      text-white border border-transparent
      focus:ring-yellow-500
      shadow-sm hover:shadow-md
    `,
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
    xl: 'px-8 py-4 text-lg h-14',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <button
      className={combinedClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className={`animate-spin -ml-1 mr-2 ${iconSizeClasses[size]}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {!loading && leftIcon && (
        <span className={`mr-2 ${iconSizeClasses[size]}`}>
          {leftIcon}
        </span>
      )}
      
      <span>{children}</span>
      
      {!loading && rightIcon && (
        <span className={`ml-2 ${iconSizeClasses[size]}`}>
          {rightIcon}
        </span>
      )}
    </button>
  );
};

export default Button;
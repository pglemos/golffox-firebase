// Sistema de Design Unificado Golffox
// Tokens de design para consistência visual em todas as plataformas

export const designTokens = {
  // Paleta de Cores Principal
  colors: {
    // Cores da marca Golffox
    primary: {
      orange: '#FF5F00',
      orangeLight: '#FF7A26',
      orangeDark: '#E54A00',
      orangeHover: '#FF6B0D',
    },
    secondary: {
      blueNavy: '#002D56',
      blueNavyLight: '#003A6B',
      blueNavyDark: '#001F3F',
      blueLight: '#004A8D',
      blueLightHover: '#0056A3',
    },
    neutral: {
      white: '#FFFFFF',
      gray50: '#F9FAFB',
      gray100: '#F3F4F6',
      gray200: '#E5E7EB',
      gray300: '#D1D5DB',
      gray400: '#9CA3AF',
      gray500: '#6B7280',
      gray600: '#4B5563',
      gray700: '#374151',
      gray800: '#1F2937',
      gray900: '#111827',
      grayDark: '#2C3E50',
      grayMedium: '#7F8C8D',
      grayLight: '#F4F4F4',
    },
    status: {
      success: '#10B981',
      successLight: '#34D399',
      successDark: '#059669',
      warning: '#F59E0B',
      warningLight: '#FBBF24',
      warningDark: '#D97706',
      error: '#EF4444',
      errorLight: '#F87171',
      errorDark: '#DC2626',
      info: '#3B82F6',
      infoLight: '#60A5FA',
      infoDark: '#2563EB',
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      tertiary: '#F3F4F6',
      dark: '#1F2937',
      darkSecondary: '#374151',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      inverse: '#FFFFFF',
      link: '#3B82F6',
      linkHover: '#2563EB',
    },
    border: {
      light: '#E5E7EB',
      medium: '#D1D5DB',
      dark: '#9CA3AF',
      focus: '#3B82F6',
    }
  },

  // Tipografia
  typography: {
    fontFamily: {
      primary: ['Roboto', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
    }
  },

  // Espaçamentos
  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
  },

  // Bordas e Raios
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Sombras
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },

  // Transições
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },

  // Z-index
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1020,
    banner: 1030,
    overlay: 1040,
    modal: 1050,
    popover: 1060,
    skipLink: 1070,
    toast: 1080,
    tooltip: 1090,
  },

  // Breakpoints responsivos
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Componentes específicos
  components: {
    button: {
      height: {
        sm: '2rem',      // 32px
        md: '2.5rem',    // 40px
        lg: '3rem',      // 48px
        xl: '3.5rem',    // 56px
      },
      padding: {
        sm: '0.5rem 1rem',
        md: '0.75rem 1.5rem',
        lg: '1rem 2rem',
        xl: '1.25rem 2.5rem',
      }
    },
    input: {
      height: {
        sm: '2rem',
        md: '2.5rem',
        lg: '3rem',
      },
      padding: '0.75rem 1rem',
    },
    card: {
      padding: '1.5rem',
      borderRadius: '0.5rem',
      shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
    sidebar: {
      width: '16rem',     // 256px
      widthCollapsed: '4rem', // 64px
    },
    header: {
      height: '4rem',     // 64px
    },
    footer: {
      height: '3rem',     // 48px
    }
  }
};

// Utilitários para aplicação dos tokens
export const getColor = (path: string) => {
  const keys = path.split('.');
  let value: any = designTokens.colors;
  for (const key of keys) {
    value = value[key];
    if (!value) return undefined;
  }
  return value;
};

export const getSpacing = (size: keyof typeof designTokens.spacing) => {
  return designTokens.spacing[size];
};

export const getFontSize = (size: keyof typeof designTokens.typography.fontSize) => {
  return designTokens.typography.fontSize[size];
};

export const getBorderRadius = (size: keyof typeof designTokens.borderRadius) => {
  return designTokens.borderRadius[size];
};

export const getShadow = (size: keyof typeof designTokens.shadows) => {
  return designTokens.shadows[size];
};

// Classes CSS utilitárias baseadas nos tokens
export const cssUtilities = {
  // Cores de fundo
  bgPrimary: 'bg-white',
  bgSecondary: 'bg-gray-50',
  bgTertiary: 'bg-gray-100',
  bgOrange: 'bg-orange-500',
  bgBlueNavy: 'bg-blue-900',
  
  // Cores de texto
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-600',
  textTertiary: 'text-gray-400',
  textInverse: 'text-white',
  textOrange: 'text-orange-500',
  textBlueNavy: 'text-blue-900',
  
  // Espaçamentos comuns
  p4: 'p-4',
  p6: 'p-6',
  p8: 'p-8',
  m4: 'm-4',
  m6: 'm-6',
  m8: 'm-8',
  
  // Bordas
  rounded: 'rounded-lg',
  roundedFull: 'rounded-full',
  border: 'border border-gray-200',
  
  // Sombras
  shadow: 'shadow-md',
  shadowLg: 'shadow-lg',
  
  // Flexbox
  flex: 'flex',
  flexCol: 'flex-col',
  itemsCenter: 'items-center',
  justifyCenter: 'justify-center',
  justifyBetween: 'justify-between',
  
  // Grid
  grid: 'grid',
  gridCols2: 'grid-cols-2',
  gridCols3: 'grid-cols-3',
  gridCols4: 'grid-cols-4',
  
  // Responsividade
  responsive: 'w-full max-w-full',
  container: 'container mx-auto px-4',
};

export default designTokens;
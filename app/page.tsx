'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  const navigateToApp = (path: string) => {
    // Limpar estados de sessão para garantir navegação consistente
    sessionStorage.removeItem('driverAppInitialized')
    sessionStorage.removeItem('driverAppState')
    sessionStorage.removeItem('driverLocation')
    
    // Se for o app do motorista, redirecionar para URL externa
    if (path === '/motorista') {
      window.location.href = 'https://golffox-app.web.app/motorista'
      return
    }
    
    router.push(path)
  }

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#F4F4F4',
    fontFamily: 'Roboto, sans-serif'
  }

  const contentStyle = {
    textAlign: 'center' as const,
    maxWidth: '400px',
    margin: '0 auto',
    padding: '24px'
  }

  const titleStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#002D56',
    marginBottom: '8px'
  }

  const subtitleStyle = {
    color: '#7F8C8D',
    marginBottom: '32px',
    fontSize: '1rem'
  }

  const buttonContainerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px'
  }

  const baseButtonStyle = {
    width: '100%',
    padding: '16px 24px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: 'white'
  }

  const driverButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: '#002D56'
  }

  const passengerButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: '#FF5F00'
  }

  const operatorButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: '#2C3E50'
  }

  const adminButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: '#E74C3C'
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>
          Golffox
        </h1>
        <p style={subtitleStyle}>
          Selecione o aplicativo que deseja acessar
        </p>
        
        <div style={buttonContainerStyle}>
          <button
            onClick={() => navigateToApp('/motorista')}
            style={driverButtonStyle}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#004A8D'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#002D56'}
          >
            🚗 App do Motorista
          </button>
          
          <button
            onClick={() => navigateToApp('/passageiro')}
            style={passengerButtonStyle}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            👤 App do Passageiro
          </button>
          
          <button
            onClick={() => navigateToApp('/operador')}
            style={operatorButtonStyle}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            💼 Portal do Operador
          </button>
          
          <button
            onClick={() => navigateToApp('/admin')}
            style={adminButtonStyle}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            ⚙️ Área Administrativa
          </button>
        </div>
      </div>
    </div>
  )
}
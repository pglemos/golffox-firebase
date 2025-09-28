import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const HomePage: React.FC = () => {
  const containerStyle = {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#F4F4F4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Roboto, sans-serif'
  };

  const cardStyle = {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    maxWidth: '672px',
    width: '100%',
    margin: '0 16px'
  };

  const headerStyle = {
    textAlign: 'center' as const,
    marginBottom: '32px'
  };

  const logoStyle = {
    height: '80px',
    margin: '0 auto 16px auto',
    display: 'block'
  };

  const titleStyle = {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#002D56',
    marginBottom: '8px'
  };

  const subtitleStyle = {
    color: '#7F8C8D',
    fontSize: '1rem'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '32px'
  };

  const baseLinkStyle = {
    padding: '24px',
    borderRadius: '8px',
    textAlign: 'center' as const,
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    display: 'block',
    color: 'white'
  };

  const painelLinkStyle = {
    ...baseLinkStyle,
    backgroundColor: '#002D56'
  };

  const motoristaLinkStyle = {
    ...baseLinkStyle,
    backgroundColor: '#FF5F00'
  };

  const passageiroLinkStyle = {
    ...baseLinkStyle,
    backgroundColor: '#2C3E50'
  };

  const operadorLinkStyle = {
    ...baseLinkStyle,
    backgroundColor: '#E74C3C'
  };

  const linkTitleStyle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '8px'
  };

  const linkDescriptionStyle = {
    fontSize: '0.875rem',
    opacity: 0.9
  };

  const adminContainerStyle = {
    textAlign: 'center' as const
  };

  const adminLinkStyle = {
    color: '#7F8C8D',
    fontSize: '0.875rem',
    textDecoration: 'underline'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <Image 
            src="/assets/golffox-logo.svg" 
            alt="Golffox Logo" 
            style={logoStyle}
            width={120}
            height={40}
          />
          <h1 style={titleStyle}>Sistema Golffox</h1>
          <p style={subtitleStyle}>Selecione o módulo que deseja acessar</p>
        </div>

        <div style={gridStyle}>
          <Link
            href="/painel"
            style={painelLinkStyle}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#004A8D'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#002D56'}
          >
            <div style={linkTitleStyle}>Painel de Gestão</div>
            <div style={linkDescriptionStyle}>Sistema completo de gestão Golffox</div>
          </Link>

          <Link
            href="/motorista"
            style={motoristaLinkStyle}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <div style={linkTitleStyle}>App do Motorista</div>
            <div style={linkDescriptionStyle}>Interface para motoristas</div>
          </Link>

          <Link
            href="/passageiro"
            style={passageiroLinkStyle}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <div style={linkTitleStyle}>App do Passageiro</div>
            <div style={linkDescriptionStyle}>Interface para passageiros</div>
          </Link>

          <Link
            href="/operador"
            style={operadorLinkStyle}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <div style={linkTitleStyle}>Portal do Operador</div>
            <div style={linkDescriptionStyle}>Interface para operadores</div>
          </Link>
        </div>

        <div style={adminContainerStyle}>
          <Link
            href="/admin"
            style={adminLinkStyle}
            onMouseOver={(e) => e.currentTarget.style.color = '#2C3E50'}
            onMouseOut={(e) => e.currentTarget.style.color = '#7F8C8D'}
          >
            Área Administrativa
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
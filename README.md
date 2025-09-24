<div align="center">

# 🚗 Golffox Management System

**Sistema completo de gestão para transporte executivo com painéis para motoristas, passageiros e administração**

[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-purple.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

## 📋 Sobre o Projeto

O **Golffox Management System** é uma aplicação web completa desenvolvida em React + TypeScript que oferece uma solução integrada para gestão de transporte executivo. O sistema possui três interfaces principais:

- **🚗 Painel do Motorista**: Interface para motoristas gerenciarem rotas, checklist e navegação
- **👥 Painel do Passageiro**: Interface para passageiros solicitarem e acompanharem viagens
- **⚙️ Painel de Gestão**: Interface administrativa para gerenciar motoristas, veículos, empresas e relatórios

## ✨ Funcionalidades Principais

### 🚗 Painel do Motorista
- ✅ Sistema de checklist pré-viagem
- 🗺️ Navegação integrada com Google Maps
- 📍 Geolocalização em tempo real
- 🛣️ Visualização de rotas otimizadas
- 📱 Interface responsiva para dispositivos móveis

### 👥 Painel do Passageiro
- 🚖 Solicitação de viagens
- 📍 Acompanhamento em tempo real
- 🏠 Gestão de endereços favoritos
- 📞 Contato direto com motorista
- ⭐ Sistema de avaliação

### ⚙️ Painel de Gestão
- 👨‍💼 Gestão de motoristas e operadores
- 🚗 Controle de frota de veículos
- 🏢 Administração de empresas clientes
- 📊 Relatórios e analytics
- 🚨 Central de despacho para emergências
- 🗺️ Mapa em tempo real com todas as unidades

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3 com design responsivo
- **Maps**: Google Maps JavaScript API
- **AI Integration**: Google Gemini API
- **Icons**: Lucide React
- **State Management**: React Hooks

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 18+ instalado
- Chave da API do Google Maps
- Chave da API do Google Gemini (opcional)

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/pglemos/golffox.git
   cd golffox
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   
   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=sua_chave_do_google_maps
   VITE_GEMINI_API_KEY=sua_chave_do_gemini
   ```

4. **Execute o projeto**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação**
   
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador

## 📁 Estrutura do Projeto

```
golffox/
├── components/           # Componentes React reutilizáveis
│   ├── client/          # Componentes específicos do cliente
│   ├── driver/          # Componentes específicos do motorista
│   ├── passenger/       # Componentes específicos do passageiro
│   └── icons/           # Componentes de ícones
├── views/               # Páginas principais da aplicação
├── services/            # Serviços e integrações externas
├── types.ts             # Definições de tipos TypeScript
├── constants.ts         # Constantes da aplicação
├── config.ts            # Configurações da aplicação
└── index.tsx           # Ponto de entrada da aplicação
```

## 🔧 Configuração das APIs

### Google Maps API
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative as seguintes APIs:
   - Maps JavaScript API
   - Geocoding API
   - Directions API
   - Places API
4. Crie uma chave de API e adicione ao arquivo `.env.local`

### Google Gemini API (Opcional)
1. Acesse o [Google AI Studio](https://makersuite.google.com/)
2. Gere uma chave de API
3. Adicione ao arquivo `.env.local`

## 🎯 Funcionalidades Implementadas

- ✅ Sistema de autenticação por tipo de usuário
- ✅ Interface responsiva para todos os dispositivos
- ✅ Integração completa com Google Maps
- ✅ Geolocalização com tratamento de erros robusto
- ✅ Sistema de checklist para motoristas
- ✅ Painel administrativo completo
- ✅ Gestão de empresas e funcionários
- ✅ Central de despacho para emergências
- ✅ Relatórios e analytics
- ✅ Mapa em tempo real

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Contato

Pedro Lemos - [@pglemos](https://github.com/pglemos)

Link do Projeto: [https://github.com/pglemos/golffox](https://github.com/pglemos/golffox)

---

<div align="center">
Desenvolvido com ❤️ por Pedro Lemos
</div>

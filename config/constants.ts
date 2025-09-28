import type { Route, Alert, Vehicle, Passenger, ChecklistItem, Direction, AppView, View, Driver, Company, Employee, PermissionProfile } from './types';
import { RouteStatus, AlertType, VehicleStatus } from './types';

export const GOLFFOX_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAB3RJTUUH6AYbDCgI12uT+QAAIABJREFUeJzsvcuS5Miy5/u+7+nqnqrqnpme+d7oM5JIAiTMA2yBfJ38BPgR8Bdgj2AL2GNEkiRBQJLRMz3V1VXV1d33/d7/++0PABwAOH7+/v7+/v7+d7f/++1vAJwAxAAI8L+7r69f//b2djUajWq12mq12uvr6+vr62s0GlWr1arVaqPRqKurq6urq9fr9Xq9Xq/Xa7Va/S8Af5/ValWr1Wq1Wq1WKxaLhUIhFosFg8FgMBgMBoPh4eFwOBwOh8PhcEgmk0wmk8FgEAgEAoFALpfL5XK5XC6Xy+VyuVwul8vlcrvdbpVKpVKpVIqFQqFQKBYKhUKhUCgUCgUCgUAgEAgEAoFAIBBIJBKJRCKRSCQSiUQikUgkEolEIpFIJBwOh8PhcDgOh8PhcDiRSCSDwQSDQSAQCASC/wHg/zYajdbW1qanp6enp6enp2e1Wq1WKxQKhUKhUAgEAoFAIBAIBAKBQCDY7XY/Pz+/vb3d7/f7fD7f7/f7/X7fbrfZbDabzWaz2Ww2m81ms9lsNpvNZrfb7Xa73W632+12u93u9/t9Pp/P5/P5fD4ej4fD4XA4HA6Hw+FwOByOQqFQKBQKhUKhUCgUCgUCgUAgEAoEAoFAIBAIBAIBAKBQCAQiUQikUgkEolEIpFIJBJJJBKJRAKBQCDw+voqEAhUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWVlZX/H/r/A4EAgUBAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV...';

export const APP_VIEWS = {
  MANAGEMENT: 'Painel de Gestão (Golffox)',
  DRIVER: 'App do Motorista',
  PASSENGER: 'App do Passageiro',
  CLIENT: 'Portal do Operador',
} as const;

export const VIEWS = {
  DASHBOARD: 'Dashboard',
  MAP: 'Mapa',
  ROUTES: 'Rotas',
  VEHICLES: 'Veículos',
  DRIVERS: 'Motoristas',
  COMPANIES: 'Empresas',
  PERMISSIONS: 'Permissões',
  RESCUE: 'Socorro',
  ALERTS: 'Alertas',
  REPORTS: 'Relatórios',
  ROUTE_HISTORY: 'Histórico de Rotas',
  COST_CONTROL: 'Controle de Custos',
} as const;

// Added a constant for all possible access areas for the permissions modal.
export const ALL_ACCESS_AREAS = [
    'Painel de Gestão (Completo)',
    'Painel de Gestão (Visualização)',
    'Portal do Operador',
    'App do Motorista',
    'App do Passageiro'
];

export const MOCK_PERMISSION_PROFILES: PermissionProfile[] = [
    { id: 'p_admin', name: 'Admin', description: 'Acesso total a todas as áreas do sistema, incluindo gerenciamento de usuários e permissões.', access: ['Painel de Gestão (Completo)', 'Portal do Operador', 'App do Motorista', 'App do Passageiro'], isAdminFeature: true },
    { id: 'p_support', name: 'Suporte', description: 'Acesso às principais funcionalidades do Painel de Gestão para monitoramento e suporte, sem permissão para editar usuários.', access: ['Painel de Gestão (Visualização)'] },
    { id: 'p_driver', name: 'Motorista', description: 'Acesso exclusivo ao aplicativo do motorista para visualização de rotas, checklists e navegação.', access: ['App do Motorista'] },
    { id: 'p_passenger', name: 'Passageiro', description: 'Acesso exclusivo ao aplicativo do passageiro para rastreamento de rotas em tempo real.', access: ['App do Passageiro'] },
    { id: 'p_operator', name: 'Operador', description: 'Acesso ao portal da empresa para gerenciar os funcionários e acompanhar as rotas contratadas.', access: ['Portal do Operador'] },
];

export const MOCK_COMPANIES: Company[] = [
    { 
        id: 'c1', 
        name: 'Minerva Foods', 
        cnpj: '12.345.678/0001-99', 
        contact: 'financeiro@minervafoods.com', 
        status: 'Ativo', 
        address: {
            text: 'Rua das Flores, 123, São Paulo, SP',
            coordinates: { lat: -23.5489, lng: -46.6388 }
        }, 
        contractedPassengers: 50 
    },
    { 
        id: 'c2', 
        name: 'JBS S.A.', 
        cnpj: '02.916.265/0001-60', 
        contact: 'operacional@jbs.com.br', 
        status: 'Ativo', 
        address: {
            text: 'Av. Industrial, 456, Barueri, SP',
            coordinates: { lat: -23.5106, lng: -46.8756 }
        }, 
        contractedPassengers: 120 
    },
    { 
        id: 'c3', 
        name: 'Marfrig', 
        cnpj: '03.853.896/0001-40', 
        contact: 'contato@marfrig.com.br', 
        status: 'Inativo', 
        address: {
            text: 'Estrada Velha, 789, Itapevi, SP',
            coordinates: { lat: -23.5489, lng: -46.9311 }
        }, 
        contractedPassengers: 75 
    },
];

export const MOCK_EMPLOYEES: Employee[] = [
    { id: 'e1', companyId: 'c1', name: 'Fernanda Oliveira', cpf: '123.456.789-10', email: 'fernanda.o@example.com', address: 'Rua das Acácias, 321', status: 'Ativo', password: 'senha123', permissionProfileId: 'p_passenger' },
    { id: 'e2', companyId: 'c1', name: 'Ricardo Santos', cpf: '987.654.321-10', email: 'ricardo.s@example.com', address: 'Av. das Nações, 100', status: 'Ativo', password: 'senha456', permissionProfileId: 'p_passenger' },
    { id: 'e3', companyId: 'c2', name: 'Patrícia Lima', cpf: '111.222.333-44', email: 'patricia.l@example.com', address: 'Praça da Sé, Lado Ímpar', status: 'Inativo', password: 'senha789', permissionProfileId: 'p_passenger' },
    { id: 'e4', companyId: 'c2', name: 'Operador JBS', cpf: '000.000.000-00', email: 'operador@jbs.com.br', address: 'Sede JBS', status: 'Ativo', password: 'operador123', permissionProfileId: 'p_operator' },
];


export const MOCK_PASSENGERS: Passenger[] = [
    { id: 'p1', name: 'Ana Beatriz', pickupTime: '06:05', photoUrl: `https://picsum.photos/seed/p1/100`, cpf: '111.111.111-11', address: 'Av. Paulista, 1578', position: { lat: -23.5613, lng: -46.6564 } },
    { id: 'p2', name: 'Bruno Costa', pickupTime: '06:10', photoUrl: `https://picsum.photos/seed/p2/100`, cpf: '222.222.222-22', address: 'R. Augusta, 1200', position: { lat: -23.557, lng: -46.663 } },
    { id: 'p3', name: 'Carla Dias', pickupTime: '06:15', photoUrl: `https://picsum.photos/seed/p3/100`, cpf: '333.333.333-33', address: 'Al. Santos, 2233', position: { lat: -23.566, lng: -46.652 } },
    { id: 'p4', name: 'Daniel Alves', pickupTime: '06:20', photoUrl: `https://picsum.photos/seed/p4/100`, cpf: '444.444.444-44', address: 'R. da Consolação, 3000', position: { lat: -23.552, lng: -46.669 } },
    { id: 'p5', name: 'Eduarda Lima', pickupTime: '06:25', photoUrl: `https://picsum.photos/seed/p5/100`, cpf: '555.555.555-55', address: 'Av. Brigadeiro Luís Antônio, 4500', position: { lat: -23.575, lng: -46.653 } },
];

export const MOCK_ROUTES: Route[] = [
  {
    id: 'r1',
    name: 'Rota Minerva - Manhã',
    driver: 'João Silva',
    vehicle: 'ABC-1234',
    status: RouteStatus.OnTime,
    passengers: {
      onboard: 18,
      total: 20,
      list: MOCK_PASSENGERS,
    },
    scheduledStart: '06:00',
    actualStart: '06:01',
    punctuality: 1,
  },
  {
    id: 'r2',
    name: 'Rota JBS - Manhã',
    driver: 'Maria Oliveira',
    vehicle: 'DEF-5678',
    status: RouteStatus.Delayed,
    passengers: {
      onboard: 22,
      total: 25,
      list: MOCK_PASSENGERS.slice(0,3),
    },
    scheduledStart: '06:30',
    actualStart: '06:38',
    punctuality: 8,
  },
  {
    id: 'r3',
    name: 'Rota Minerva - Tarde',
    driver: 'Pedro Martins',
    vehicle: 'XYZ-0011',
    status: RouteStatus.OnTime,
    passengers: {
      onboard: 15,
      total: 15,
      list: MOCK_PASSENGERS.slice(1,4),
    },
    scheduledStart: '17:00',
    actualStart: '16:58',
    punctuality: -2,
  },
  {
    id: 'r4',
    name: 'Rota JBS - Tarde',
    driver: 'Carlos Souza',
    vehicle: 'GHI-7890',
    status: RouteStatus.Problem,
    passengers: {
      onboard: 10,
      total: 23,
      list: MOCK_PASSENGERS.slice(2,5),
    },
    scheduledStart: '17:30',
    actualStart: '17:30',
    punctuality: 15,
  },
];

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    plate: 'ABC-1234',
    model: 'Mercedes-Benz Sprinter',
    driver: 'João Silva',
    status: VehicleStatus.Moving,
    position: { lat: -23.5505, lng: -46.6333 },
    routeId: 'r1',
    lastMaintenance: '2024-05-15',
    nextMaintenance: '2024-08-15',
    isRegistered: true,
  },
  {
    id: 'v2',
    plate: 'DEF-5678',
    model: 'Iveco Daily',
    driver: 'Maria Oliveira',
    status: VehicleStatus.Stopped,
    position: { lat: -23.5613, lng: -46.6564 },
    routeId: 'r2',
    lastMaintenance: '2024-06-01',
    nextMaintenance: '2024-09-01',
    isRegistered: true,
  },
  {
    id: 'v3',
    plate: 'GHI-7890',
    model: 'Renault Master',
    driver: 'Carlos Souza',
    status: VehicleStatus.Problem,
    position: { lat: -23.5489, lng: -46.6388 },
    routeId: 'r4',
    lastMaintenance: '2024-04-20',
    nextMaintenance: '2024-07-20',
    isRegistered: true,
  },
  {
    id: 'v4',
    plate: 'XYZ-0011',
    model: 'Mercedes-Benz Sprinter',
    driver: 'Pedro Martins',
    status: VehicleStatus.Moving,
    position: { lat: -23.5510, lng: -46.6330 },
    routeId: 'r3',
    lastMaintenance: '2024-05-30',
    nextMaintenance: '2024-08-30',
    isRegistered: true,
  },
  {
    id: 'v5',
    plate: 'JKL-9999',
    model: 'Ford Transit',
    driver: 'Ana Costa',
    status: VehicleStatus.Moving,
    position: { lat: -23.5520, lng: -46.6340 },
    routeId: 'r5',
    lastMaintenance: '2024-06-10',
    nextMaintenance: '2024-09-10',
    isRegistered: false, // Veículo não cadastrado - não deve aparecer no mapa
  },
  {
    id: 'v6',
    plate: 'MNO-8888',
    model: 'Volkswagen Crafter',
    driver: 'Roberto Lima',
    status: VehicleStatus.Stopped,
    position: { lat: -23.5530, lng: -46.6350 },
    lastMaintenance: '2024-05-25',
    nextMaintenance: '2024-08-25',
    isRegistered: false, // Veículo não cadastrado - não deve aparecer no mapa
  },
  {
    id: 'v7',
    plate: 'PQR-7777',
    model: 'Mercedes-Benz Sprinter',
    driver: 'Fernanda Santos',
    status: VehicleStatus.Garage,
    position: { lat: -23.5495, lng: -46.6320 }, // Posição da garagem
    lastMaintenance: '2024-06-15',
    nextMaintenance: '2024-09-15',
    isRegistered: true,
  },
];

export const MOCK_DRIVERS: Driver[] = [
    { 
        id: 'd1', 
        name: 'João Silva', 
        cpf: '123.456.789-01',
        rg: '12.345.678-9',
        birthDate: '1985-03-15',
        phone: '(11) 99999-1234',
        email: 'joao.silva@email.com',
        address: 'Rua das Flores, 123, São Paulo - SP',
        cep: '01234-567',
        cnh: '123456789', 
        cnhValidity: '2026-03-15',
        cnhCategory: 'D',
        hasEAR: true,
        transportCourseValidity: '2025-12-31',
        lastToxicologicalExam: '2024-01-15',
        photoUrl: 'https://picsum.photos/seed/d1/100',
        contractType: 'CLT',
        credentialingDate: '2023-01-15',
        status: 'Ativo', 
        linkedCompany: 'Empresa ABC',
        assignedRoutes: ['Rota 1', 'Rota 2'],
        availability: 'Segunda a Sexta: 06:00-18:00',
        lastUpdate: '2024-01-15'
    },
    { 
        id: 'd2', 
        name: 'Maria Oliveira', 
        cpf: '987.654.321-01',
        rg: '98.765.432-1',
        birthDate: '1990-07-22',
        phone: '(11) 88888-5678',
        email: 'maria.oliveira@email.com',
        address: 'Av. Paulista, 456, São Paulo - SP',
        cep: '01310-100',
        cnh: '987654321', 
        cnhValidity: '2025-07-22',
        cnhCategory: 'E',
        hasEAR: false,
        transportCourseValidity: '2025-06-30',
        lastToxicologicalExam: '2024-02-10',
        photoUrl: 'https://picsum.photos/seed/d2/100',
        contractType: 'terceirizado',
        credentialingDate: '2023-02-10',
        status: 'Ativo', 
        linkedCompany: 'Empresa XYZ',
        assignedRoutes: ['Rota 3'],
        availability: 'Segunda a Sábado: 05:00-17:00',
        lastUpdate: '2024-02-10'
    },
    { 
        id: 'd3', 
        name: 'Pedro Martins', 
        cpf: '111.222.333-44',
        rg: '11.222.333-4',
        birthDate: '1988-11-05',
        phone: '(11) 77777-9012',
        email: 'pedro.martins@email.com',
        address: 'Rua Augusta, 789, São Paulo - SP',
        cep: '01305-000',
        cnh: '112233445', 
        cnhValidity: '2027-11-05',
        cnhCategory: 'D',
        hasEAR: true,
        transportCourseValidity: '2026-01-31',
        lastToxicologicalExam: '2024-03-01',
        photoUrl: 'https://picsum.photos/seed/d3/100',
        contractType: 'autônomo',
        credentialingDate: '2023-03-01',
        status: 'Ativo', 
        linkedCompany: 'Empresa DEF',
        assignedRoutes: ['Rota 4', 'Rota 5'],
        availability: 'Terça a Sábado: 07:00-19:00',
        lastUpdate: '2024-03-01'
    },
    { 
        id: 'd4', 
        name: 'Carlos Souza', 
        cpf: '555.666.777-88',
        rg: '55.666.777-8',
        birthDate: '1982-09-18',
        phone: '(11) 66666-3456',
        email: 'carlos.souza@email.com',
        address: 'Rua da Consolação, 321, São Paulo - SP',
        cep: '01302-001',
        cnh: '556677889', 
        cnhValidity: '2024-09-18',
        cnhCategory: 'E',
        hasEAR: false,
        transportCourseValidity: '2024-12-31',
        lastToxicologicalExam: '2023-12-15',
        photoUrl: 'https://picsum.photos/seed/d4/100',
        contractType: 'CLT',
        credentialingDate: '2022-12-15',
        status: 'Em análise', 
        linkedCompany: 'Empresa GHI',
        assignedRoutes: [],
        availability: 'Segunda a Sexta: 08:00-20:00',
        lastUpdate: '2023-12-15'
    },
    { 
        id: 'd5', 
        name: 'Ana Costa', 
        cpf: '333.444.555-66',
        rg: '33.444.555-6',
        birthDate: '1995-12-03',
        phone: '(11) 55555-7890',
        email: 'ana.costa@email.com',
        address: 'Rua Oscar Freire, 654, São Paulo - SP',
        cep: '01426-001',
        cnh: '334455667', 
        cnhValidity: '2028-12-03',
        cnhCategory: 'D',
        hasEAR: true,
        transportCourseValidity: '2027-03-31',
        lastToxicologicalExam: '2024-04-20',
        photoUrl: 'https://picsum.photos/seed/d5/100',
        contractType: 'terceirizado',
        credentialingDate: '2024-04-20',
        status: 'Ativo', 
        linkedCompany: 'Empresa JKL',
        assignedRoutes: ['Rota 6'],
        availability: 'Segunda a Domingo: 06:00-22:00',
        lastUpdate: '2024-04-20'
    },
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'a1',
    type: AlertType.Critical,
    title: 'Pneu Furado - Veículo GHI-7890',
    message: 'O motorista Carlos Souza reportou um pneu furado. Rota JBS - Tarde impactada.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'a2',
    type: AlertType.Warning,
    title: 'Trânsito Intenso - Rota JBS Manhã',
    message: 'Atraso estimado de 10 minutos na Rota JBS - Manhã devido a congestionamento na Av. Principal.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'a3',
    type: AlertType.Info,
    title: 'Manutenção Preventiva Agendada',
    message: 'Veículo DEF-5678 com manutenção agendada para amanhã às 8h.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];


export const MOCK_CHECKLIST_ITEMS: { [category: string]: ChecklistItem[] } = {
    'Mecânicos': [
        { id: 'm1', label: 'Nível de óleo do motor', isCritical: true },
        { id: 'm2', label: 'Freios', isCritical: true },
        { id: 'm3', label: 'Luzes de freio e faróis', isCritical: true },
        { id: 'm4', label: 'Calibragem dos pneus', isCritical: false },
    ],
    'Estrutura': [
        { id: 'e1', label: 'Limpeza interna', isCritical: false },
        { id: 'e2', label: 'Limpeza externa (lataria)', isCritical: false },
        { id: 'e3', label: 'Estado dos vidros e espelhos', isCritical: true },
    ],
    'Segurança': [
        { id: 's1', label: 'Cintos de segurança', isCritical: true },
        { id: 's2', label: 'Extintor de incêndio (validade)', isCritical: true },
        { id: 's3', label: 'Kit de primeiros socorros', isCritical: false },
        { id: 's4', label: 'Triângulo de sinalização', isCritical: true },
        { id: 's5', label: 'Chave de roda e macaco', isCritical: false },
        { id: 's6', label: 'Estepe calibrado', isCritical: true },
        { id: 's7', label: 'Lanterna de emergência', isCritical: false },
        { id: 's8', label: 'Cabo de bateria', isCritical: false },
        { id: 's9', label: 'Kit de ferramentas básicas', isCritical: false },
        { id: 's10', label: 'Água para radiador', isCritical: false },
    ],
    'Conforto': [
        { id: 'c1', label: 'Ar condicionado', isCritical: false },
        { id: 'c2', label: 'Bancos e estofados', isCritical: false },
    ],
    'Documentação': [
        { id: 'd1', label: 'Documento do veículo (CRLV)', isCritical: true },
        { id: 'd2', label: 'CNH do motorista', isCritical: true },
    ],
};

export const MOCK_DIRECTIONS: Direction[] = [
    { instruction: 'Siga em frente', distance: '2 km', icon: 'ArrowUpIcon' },
    { instruction: 'Vire à direita na Av. Principal', distance: '800 m', icon: 'ArrowRightIcon' },
    { instruction: 'Mantenha-se à esquerda', distance: '1.2 km', icon: 'ArrowUpIcon' },
    { instruction: 'Faça o retorno', distance: '300 m', icon: 'ArrowUturnLeftIcon' },
    { instruction: 'Você chegou ao Ponto 3', distance: '50 m', icon: 'FlagCheckeredIcon' },
    { instruction: 'Siga para o Ponto 4', distance: '3 km', icon: 'ArrowUpIcon' },
    { instruction: 'Você chegou ao seu destino final', distance: '', icon: 'FlagCheckeredIcon' },
];
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
    { id: 'c1', name: 'Minerva Foods', cnpj: '12.345.678/0001-99', contact: 'financeiro@minervafoods.com', status: 'Ativo', address: 'Rua das Flores, 123, São Paulo, SP', contractedPassengers: 50 },
    { id: 'c2', name: 'JBS S.A.', cnpj: '02.916.265/0001-60', contact: 'operacional@jbs.com.br', status: 'Ativo', address: 'Av. Industrial, 456, Barueri, SP', contractedPassengers: 120 },
    { id: 'c3', name: 'Marfrig', cnpj: '03.853.896/0001-40', contact: 'contato@marfrig.com.br', status: 'Inativo', address: 'Estrada Velha, 789, Itapevi, SP', contractedPassengers: 75 },
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
  },
];

export const MOCK_DRIVERS: Driver[] = [
    { id: 'd1', name: 'João Silva', cnh: '123456789', status: 'Em Rota', photoUrl: 'https://picsum.photos/seed/d1/100' },
    { id: 'd2', name: 'Maria Oliveira', cnh: '987654321', status: 'Em Rota', photoUrl: 'https://picsum.photos/seed/d2/100' },
    { id: 'd3', name: 'Pedro Martins', cnh: '112233445', status: 'Disponível', photoUrl: 'https://picsum.photos/seed/d3/100' },
    { id: 'd4', name: 'Carlos Souza', cnh: '556677889', status: 'Indisponível', photoUrl: 'https://picsum.photos/seed/d4/100' },
    { id: 'd5', name: 'Ana Costa', cnh: '334455667', status: 'Disponível', photoUrl: 'https://picsum.photos/seed/d5/100' },
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
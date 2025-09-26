# API Documentation - GolfFox

Esta documentação descreve os endpoints da API REST do sistema GolfFox.

## Autenticação

Todos os endpoints (exceto login e registro) requerem autenticação via Bearer Token no header:

```
Authorization: Bearer <token>
```

## Estrutura de Resposta

### Sucesso
```json
{
  "success": true,
  "data": {...},
  "message": "Mensagem opcional"
}
```

### Erro
```json
{
  "error": "Descrição do erro"
}
```

### Paginação
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Endpoints

### Autenticação

#### POST /api/auth/login
Realizar login no sistema.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /api/auth/register
Registrar novo usuário.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Nome do Usuário",
  "role": "admin|operator|driver|passenger|client",
  "company_id": "uuid",
  "phone": "11999999999",
  "cpf": "12345678901"
}
```

#### POST /api/auth/logout
Realizar logout (requer autenticação).

#### GET /api/auth/profile
Obter perfil do usuário autenticado.

#### PUT /api/auth/profile
Atualizar perfil do usuário autenticado.

### Empresas

#### GET /api/companies
Listar empresas (Admin/Operator).

**Query Parameters:**
- `page`: Página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `search`: Busca por nome/CNPJ
- `status`: Filtrar por status
- `withStats`: Incluir estatísticas (true/false)

#### POST /api/companies
Criar empresa (Admin).

#### GET /api/companies/[id]
Obter empresa por ID.

#### PUT /api/companies/[id]
Atualizar empresa (Admin).

#### DELETE /api/companies/[id]
Excluir empresa (Admin).

#### POST /api/companies/[id]/toggle-status
Alternar status da empresa (Admin).

### Motoristas

#### GET /api/drivers
Listar motoristas.

**Permissões:**
- Admin: Todos os motoristas
- Operator/Client: Motoristas da empresa
- Driver: Apenas próprios dados

#### POST /api/drivers
Criar motorista (Admin/Operator).

#### GET /api/drivers/[id]
Obter motorista por ID.

#### PUT /api/drivers/[id]
Atualizar motorista (Admin/Operator).

#### DELETE /api/drivers/[id]
Excluir motorista (Admin/Operator).

### Veículos

#### GET /api/vehicles
Listar veículos.

**Permissões:**
- Admin: Todos os veículos
- Operator/Client: Veículos da empresa

#### POST /api/vehicles
Criar veículo (Admin/Operator).

#### GET /api/vehicles/[id]
Obter veículo por ID.

#### PUT /api/vehicles/[id]
Atualizar veículo (Admin/Operator).

#### DELETE /api/vehicles/[id]
Excluir veículo (Admin/Operator).

### Passageiros

#### GET /api/passengers
Listar passageiros.

**Permissões:**
- Admin: Todos os passageiros
- Operator/Client: Passageiros da empresa
- Passenger: Apenas próprios dados

#### POST /api/passengers
Criar passageiro (Admin/Operator/Client).

#### GET /api/passengers/[id]
Obter passageiro por ID.

#### PUT /api/passengers/[id]
Atualizar passageiro (Admin/Operator/Client).

#### DELETE /api/passengers/[id]
Excluir passageiro (Admin/Operator).

### Rotas

#### GET /api/routes
Listar rotas.

**Permissões:**
- Admin: Todas as rotas
- Operator/Client: Rotas da empresa
- Driver: Apenas próprias rotas

#### POST /api/routes
Criar rota (Admin/Operator).

#### GET /api/routes/[id]
Obter rota por ID.

#### PUT /api/routes/[id]
Atualizar rota (Admin/Operator).

#### DELETE /api/routes/[id]
Excluir rota (Admin/Operator).

#### POST /api/routes/[id]/start
Iniciar rota (Admin/Operator/Driver).

#### POST /api/routes/[id]/finish
Finalizar rota (Admin/Operator/Driver).

### Alertas

#### GET /api/alerts
Listar alertas.

**Permissões:**
- Admin: Todos os alertas
- Operator/Client: Alertas da empresa
- Driver/Passenger: Apenas próprios alertas

#### POST /api/alerts
Criar alerta (Todos os usuários autenticados).

#### GET /api/alerts/[id]
Obter alerta por ID.

#### PUT /api/alerts/[id]
Atualizar alerta.

#### DELETE /api/alerts/[id]
Excluir alerta (Admin/Operator).

#### POST /api/alerts/[id]/resolve
Resolver alerta (Admin/Operator).

### Estatísticas

#### GET /api/stats
Obter estatísticas do sistema.

**Permissões:**
- Admin: Estatísticas globais
- Operator/Client: Estatísticas da empresa

## Códigos de Status HTTP

- `200`: Sucesso
- `201`: Criado com sucesso
- `400`: Dados inválidos
- `401`: Não autenticado
- `403`: Acesso negado
- `404`: Recurso não encontrado
- `409`: Conflito (dados duplicados)
- `500`: Erro interno do servidor

## Roles e Permissões

### Admin
- Acesso total ao sistema
- Pode gerenciar todas as empresas
- Pode ver estatísticas globais

### Operator
- Acesso limitado à sua empresa
- Pode gerenciar motoristas, veículos, passageiros e rotas da empresa
- Pode resolver alertas da empresa

### Client
- Acesso limitado à sua empresa
- Pode visualizar dados e criar passageiros
- Acesso somente leitura para a maioria dos recursos

### Driver
- Acesso apenas às suas próprias rotas e alertas
- Pode iniciar/finalizar rotas atribuídas
- Pode criar alertas

### Passenger
- Acesso apenas aos próprios dados e alertas
- Pode criar alertas
- Visualização limitada

## Filtros Comuns

Muitos endpoints suportam os seguintes parâmetros de query:

- `page`: Número da página
- `limit`: Itens por página
- `search`: Busca textual
- `status`: Filtrar por status
- `company_id`: Filtrar por empresa (Admin apenas)
- `withDetails`: Incluir detalhes relacionados
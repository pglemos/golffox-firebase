# 🚀 Guia de Configuração - Projeto Golffox

Este guia irá te ajudar a configurar completamente o projeto Golffox com Supabase.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)
- Editor de código (VS Code recomendado)

## 🎯 Configuração Rápida

### 1. Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. As variáveis do Supabase já estão configuradas no `.env.example`. Se necessário, atualize com suas próprias chaves.

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Banco de Dados Supabase

#### Opção A: Configuração Automática (Recomendada)

Execute o script de verificação para testar a conexão:
```bash
npm run verify-supabase
```

Se houver problemas, siga para a **Opção B**.

#### Opção B: Configuração Manual

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione o projeto **Golffox** (ID: afnlsvaswsokofldoqsf)
3. Vá para **SQL Editor**
4. Execute os scripts na seguinte ordem:

**Primeiro - Schema do Banco:**
```sql
-- Copie e cole todo o conteúdo de: supabase/schema.sql
```

**Segundo - Políticas de Segurança:**
```sql
-- Copie e cole todo o conteúdo de: supabase/rls_policies.sql
```

### 4. Configurar Dados Iniciais

Execute o script de configuração do projeto:
```bash
npm run setup-project
```

Este script irá:
- ✅ Verificar se o Supabase está configurado
- ✅ Criar usuário administrador de teste
- ✅ Inserir dados de exemplo (motorista, veículo, rota, passageiro)

### 5. Iniciar o Projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🔑 Credenciais de Acesso

Após executar o `setup-project`, você terá:

**Usuário Administrador:**
- Email: `admin@golffox.com`
- Senha: `admin123456`

## 📊 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run verify-supabase` | Verifica configuração do Supabase |
| `npm run setup-project` | Configura dados iniciais |
| `npm run db:status` | Alias para verify-supabase |
| `npm run db:setup` | Alias para setup-project |

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- **companies** - Empresas cadastradas
- **users** - Usuários do sistema
- **drivers** - Motoristas com documentação
- **vehicles** - Veículos da frota
- **passengers** - Passageiros das rotas
- **routes** - Rotas de transporte

### Tabelas de Controle
- **alerts** - Alertas do sistema
- **route_history** - Histórico das rotas
- **vehicle_locations** - Localização em tempo real
- **driver_performance** - Performance dos motoristas
- **cost_control** - Controle de custos
- **permission_profiles** - Perfis de permissão

## 🔐 Segurança

O projeto implementa:
- ✅ **Row Level Security (RLS)** em todas as tabelas
- ✅ **Autenticação** via Supabase Auth
- ✅ **Autorização** baseada em roles (admin, operator, driver, passenger)
- ✅ **Isolamento** por empresa (multi-tenant)

## 🎨 Funcionalidades Implementadas

### ✅ Autenticação e Autorização
- Login/logout de usuários
- Controle de acesso por perfil
- Proteção de rotas

### ✅ Gestão de Frota
- Cadastro de motoristas
- Gestão de veículos
- Rastreamento em tempo real

### ✅ Gestão de Rotas
- Criação e edição de rotas
- Associação de passageiros
- Histórico de execução

### ✅ Analytics e Relatórios
- Dashboard com métricas
- Relatórios de performance
- Controle de custos

### ✅ Sistema de Alertas
- Notificações em tempo real
- Diferentes tipos de alerta
- Histórico de alertas

## 🚨 Troubleshooting

### Erro: "Invalid API key"
**Solução:** Verifique se as chaves do Supabase estão corretas no arquivo `.env`

### Erro: "Could not find table"
**Solução:** Execute os scripts SQL no dashboard do Supabase:
1. `supabase/schema.sql`
2. `supabase/rls_policies.sql`

### Erro: "Permission denied"
**Solução:** Certifique-se de que as políticas RLS foram aplicadas corretamente

### Aplicação não carrega
**Solução:** 
1. Verifique se o servidor está rodando: `npm run dev`
2. Verifique se não há erros no console
3. Execute `npm run verify-supabase` para verificar a configuração

## 📱 Testando o Sistema

### 1. Login como Administrador
- Acesse http://localhost:3000
- Use as credenciais: `admin@golffox.com` / `admin123456`

### 2. Explorar Funcionalidades
- **Dashboard**: Visualize métricas e gráficos
- **Motoristas**: Gerencie motoristas e documentação
- **Veículos**: Controle a frota
- **Rotas**: Configure rotas e passageiros
- **Relatórios**: Gere relatórios de performance

### 3. Testar Diferentes Perfis
- Crie usuários com diferentes roles (operator, driver, passenger)
- Teste as permissões de cada perfil

## 🔄 Próximos Passos

1. **Personalização**: Adapte o sistema às suas necessidades
2. **Integração**: Configure APIs externas (Google Maps, etc.)
3. **Deploy**: Publique em produção (Vercel, Netlify, etc.)
4. **Monitoramento**: Configure logs e métricas

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs** no console do navegador
2. **Execute diagnósticos**:
   ```bash
   npm run verify-supabase
   ```
3. **Consulte a documentação** do Supabase: https://supabase.com/docs
4. **Verifique o arquivo** `supabase/README.md` para instruções detalhadas

## 🎉 Conclusão

Parabéns! Seu sistema Golffox está configurado e pronto para uso. O projeto agora possui:

- ✅ Banco de dados Supabase configurado
- ✅ Autenticação e autorização funcionando
- ✅ Interface completa para gestão de transporte
- ✅ Sistema de relatórios e analytics
- ✅ Dados de exemplo para teste

Explore todas as funcionalidades e adapte o sistema conforme suas necessidades!
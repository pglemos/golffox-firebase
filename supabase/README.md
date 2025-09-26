# Configuração do Supabase para Golffox

Este diretório contém os scripts SQL necessários para configurar o banco de dados Supabase para o projeto Golffox.

## 📋 Informações do Projeto

- **Nome**: Golffox
- **Project ID**: afnlsvaswsokofldoqsf
- **URL**: https://afnlsvaswsokofldoqsf.supabase.co

## 📁 Arquivos

- `schema.sql` - Schema completo do banco de dados com todas as tabelas, índices e dados iniciais
- `rls_policies.sql` - Políticas de Row Level Security (RLS) para controle de acesso

## 🚀 Configuração Passo a Passo

### 1. Acesse o Supabase Dashboard

1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o projeto **Golffox** (ID: `afnlsvaswsokofldoqsf`)

### 2. Execute o Schema Principal

1. No dashboard, vá para **SQL Editor** (ícone de código no menu lateral)
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo `schema.sql` e cole no editor
4. Clique em **Run** para executar o script

**⚠️ Importante**: Execute este script primeiro, pois ele cria todas as tabelas, tipos e estruturas necessárias.

### 3. Configure as Políticas RLS

1. Ainda no **SQL Editor**, crie uma nova query
2. Copie todo o conteúdo do arquivo `rls_policies.sql` e cole no editor
3. Clique em **Run** para executar o script

**⚠️ Importante**: Execute este script após o schema, pois ele depende das tabelas criadas anteriormente.

### 4. Verificação da Configuração

Após executar ambos os scripts, verifique se tudo foi criado corretamente:

#### Verificar Tabelas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Você deve ver as seguintes tabelas:
- `alerts`
- `companies`
- `cost_control`
- `driver_performance`
- `drivers`
- `passengers`
- `permission_profiles`
- `route_history`
- `route_passengers`
- `routes`
- `users`
- `vehicle_locations`
- `vehicles`

#### Verificar RLS
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

Todas as tabelas devem ter `rowsecurity = true`.

#### Verificar Políticas
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

### 5. Configuração de Autenticação

1. Vá para **Authentication** > **Settings**
2. Em **Site URL**, adicione: `http://localhost:3000` (para desenvolvimento)
3. Em **Redirect URLs**, adicione: `http://localhost:3000/auth/callback`
4. Salve as configurações

### 6. Configuração de Storage (Opcional)

Se precisar de upload de arquivos:

1. Vá para **Storage**
2. Crie um bucket chamado `uploads`
3. Configure as políticas de acesso conforme necessário

## Estrutura do Banco de Dados

### Principais Entidades

1. **Companies** - Empresas do sistema
2. **Users** - Usuários do sistema (vinculados ao Supabase Auth)
3. **Drivers** - Motoristas
4. **Vehicles** - Veículos
5. **Passengers** - Passageiros
6. **Routes** - Rotas
7. **Route_Passengers** - Relacionamento entre rotas e passageiros
8. **Alerts** - Alertas do sistema
9. **Route_History** - Histórico de execução de rotas
10. **Vehicle_Locations** - Localizações dos veículos
11. **Driver_Performance** - Performance dos motoristas
12. **Cost_Control** - Controle de custos
13. **Permission_Profiles** - Perfis de permissão

### Hierarquia de Roles

1. **Admin** - Acesso total ao sistema
2. **Operator** - Gerenciamento operacional
3. **Driver** - Acesso limitado para motoristas
4. **Passenger** - Acesso limitado para passageiros

## Dados Iniciais

O script `schema.sql` já inclui alguns dados iniciais:

### Permission Profiles
- Admin, Operator, Driver, Passenger com suas respectivas permissões

### Company Padrão
- Uma empresa exemplo para testes iniciais

## Troubleshooting

### Erro de Permissão
Se encontrar erros de permissão, certifique-se de estar usando uma conta com privilégios de administrador no projeto Supabase.

### Erro de Extensão
Se houver erro com extensões (`uuid-ossp`, `postgis`), verifique se elas estão habilitadas:
1. Vá para **Database** > **Extensions**
2. Procure e habilite `uuid-ossp` e `postgis`

### Erro de RLS
Se as políticas RLS não funcionarem:
1. Verifique se o RLS está habilitado nas tabelas
2. Confirme se as funções auxiliares foram criadas corretamente
3. Teste as políticas com diferentes roles

## Próximos Passos

Após a configuração do banco:

1. ✅ Configurar variáveis de ambiente no projeto
2. ✅ Testar conexão com o banco
3. ✅ Implementar autenticação
4. ✅ Testar operações CRUD
5. ✅ Configurar deploy em produção

## Suporte

Para dúvidas ou problemas:
1. Consulte a [documentação do Supabase](https://supabase.com/docs)
2. Verifique os logs no dashboard do Supabase
3. Teste as queries SQL diretamente no SQL Editor
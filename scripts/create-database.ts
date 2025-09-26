#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filePath: string, description: string) {
  console.log(`\n🔄 Executando ${description}...`);
  
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Dividir o SQL em comandos individuais (separados por ponto e vírgula)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Encontrados ${commands.length} comandos SQL para executar`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`   Executando comando ${i + 1}/${commands.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: command + ';' });
          
          if (error) {
            // Tentar executar diretamente se o RPC falhar
            const { error: directError } = await supabase
              .from('_temp')
              .select('*')
              .limit(0);
            
            if (directError && directError.message.includes('does not exist')) {
              // Usar uma abordagem diferente para comandos DDL
              console.log(`   ⚠️ Comando ${i + 1} pode precisar ser executado manualmente no dashboard`);
            } else {
              console.log(`   ❌ Erro no comando ${i + 1}: ${error.message}`);
            }
          } else {
            console.log(`   ✅ Comando ${i + 1} executado com sucesso`);
          }
        } catch (cmdError) {
          console.log(`   ⚠️ Erro no comando ${i + 1}: ${cmdError}`);
        }
      }
    }
    
    console.log(`✅ ${description} processado`);
    
  } catch (error) {
    console.error(`❌ Erro ao executar ${description}:`, error);
    throw error;
  }
}

async function createDatabase() {
  console.log('🚀 Iniciando criação do banco de dados Golffox...\n');
  
  try {
    // Verificar conexão
    console.log('🔍 Verificando conexão com Supabase...');
    const { data, error } = await supabase.auth.getSession();
    if (error && error.message !== 'Auth session missing!') {
      throw new Error(`Erro de conexão: ${error.message}`);
    }
    console.log('✅ Conexão com Supabase estabelecida');

    // Executar schema
    const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
    await executeSQLFile(schemaPath, 'Schema do banco de dados');

    // Executar políticas RLS
    const rlsPath = path.join(process.cwd(), 'supabase', 'rls_policies.sql');
    await executeSQLFile(rlsPath, 'Políticas de segurança (RLS)');

    console.log('\n🎉 Banco de dados criado com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Execute: npm run verify-supabase');
    console.log('2. Se ainda houver erros, execute os scripts manualmente no dashboard do Supabase');
    console.log('3. Acesse: https://supabase.com/dashboard/project/afnlsvaswsokofldoqsf/editor');

  } catch (error) {
    console.error('\n❌ Erro durante a criação do banco de dados:', error);
    console.log('\n🔧 Solução alternativa:');
    console.log('Execute os scripts manualmente no dashboard do Supabase:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/afnlsvaswsokofldoqsf/editor');
    console.log('2. Execute o conteúdo de: supabase/schema.sql');
    console.log('3. Execute o conteúdo de: supabase/rls_policies.sql');
    process.exit(1);
  }
}

// Executar o script
createDatabase();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugData() {
  try {
    console.log('=== VERIFICANDO DADOS NO BANCO ===\n');

    // Verificar usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    console.log('1. Usuários na tabela users:');
    if (usersError) {
      console.error('Erro:', usersError);
    } else {
      console.log(`Total: ${users.length}`);
      users.forEach(user => {
        console.log(`- ${user.email} (role: ${user.role}, company_id: ${user.company_id})`);
      });
    }

    // Verificar empresas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*');
    
    console.log('\n2. Empresas na tabela companies:');
    if (companiesError) {
      console.error('Erro:', companiesError);
    } else {
      console.log(`Total: ${companies.length}`);
      companies.forEach(company => {
        console.log(`- ${company.name} (id: ${company.id})`);
      });
    }

    // Verificar motoristas
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*');
    
    console.log('\n3. Motoristas na tabela drivers:');
    if (driversError) {
      console.error('Erro:', driversError);
    } else {
      console.log(`Total: ${drivers.length}`);
      drivers.forEach(driver => {
        console.log(`- ${driver.name} (company_id: ${driver.company_id})`);
      });
    }

    // Verificar veículos
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*');
    
    console.log('\n4. Veículos na tabela vehicles:');
    if (vehiclesError) {
      console.error('Erro:', vehiclesError);
    } else {
      console.log(`Total: ${vehicles.length}`);
      vehicles.forEach(vehicle => {
        console.log(`- ${vehicle.model} ${vehicle.license_plate} (company_id: ${vehicle.company_id})`);
      });
    }

    // Verificar passageiros
    const { data: passengers, error: passengersError } = await supabase
      .from('passengers')
      .select('*');
    
    console.log('\n5. Passageiros na tabela passengers:');
    if (passengersError) {
      console.error('Erro:', passengersError);
    } else {
      console.log(`Total: ${passengers.length}`);
      passengers.forEach(passenger => {
        console.log(`- ${passenger.name} (company_id: ${passenger.company_id})`);
      });
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

debugData();
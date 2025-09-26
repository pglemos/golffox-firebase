const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testTables() {
  const tables = [
    'vehicles',
    'passengers', 
    'routes',
    'route_passengers',
    'alerts',
    'route_history',
    'vehicle_locations',
    'driver_performance',
    'cost_control'
  ];

  console.log('🔍 Testando tabelas criadas...\n');

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: OK`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

testTables();
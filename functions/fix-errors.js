const fs = require('fs');
const path = require('path');

// Função para corrigir erros de error.message
function fixErrorMessages(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Substituir error.message por error instanceof Error ? error.message : 'Erro desconhecido'
  content = content.replace(
    /throw new Error\(`([^`]*)\$\{error\.message\}`\)/g,
    'throw new Error(`$1${error instanceof Error ? error.message : \'Erro desconhecido\'}`)'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${filePath}`);
}

// Lista de arquivos para corrigir
const filesToFix = [
  'src/users/index.ts',
  'src/companies/index.ts',
  'src/drivers/index.ts',
  'src/vehicles/index.ts',
  'src/routes/index.ts',
  'src/alerts/index.ts',
  'src/notifications/index.ts',
  'src/checkin/index.ts'
];

// Corrigir cada arquivo
filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    fixErrorMessages(fullPath);
  } else {
    console.log(`File not found: ${fullPath}`);
  }
});

console.log('All files fixed!');
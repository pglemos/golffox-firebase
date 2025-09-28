# Script para atualizar imports de config, constants e types
Write-Host "Atualizando imports de config, constants e types..." -ForegroundColor Green

# Função para atualizar imports em um arquivo
function Update-Imports {
    param(
        [string]$FilePath,
        [string]$OldPattern,
        [string]$NewPattern
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw -ErrorAction SilentlyContinue
        if ($content -and $content -match $OldPattern) {
            $newContent = $content -replace $OldPattern, $NewPattern
            Set-Content $FilePath $newContent -NoNewline
            Write-Host "Atualizado: $FilePath" -ForegroundColor Yellow
        }
    }
}

# Buscar todos os arquivos TypeScript e JavaScript
$files = Get-ChildItem -Path . -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx" | Where-Object { 
    $_.FullName -notmatch "node_modules|\.next|dist|out|\.git|config" 
}

foreach ($file in $files) {
    $relativePath = $file.FullName
    
    # Determinar o número de níveis para voltar até a raiz
    $depth = ($file.DirectoryName -replace [regex]::Escape((Get-Location).Path), "").Split('\').Length - 1
    $configPath = "../" * $depth + "config/"
    
    # Atualizar imports de '../types' ou '../../types' etc.
    Update-Imports -FilePath $relativePath -OldPattern "from ['\`""]\.\.+/types['\`""]" -NewPattern "from '${configPath}types'"
    Update-Imports -FilePath $relativePath -OldPattern "import ['\`""]\.\.+/types['\`""]" -NewPattern "import '${configPath}types'"
    
    # Atualizar imports de '../constants' ou '../../constants' etc.
    Update-Imports -FilePath $relativePath -OldPattern "from ['\`""]\.\.+/constants['\`""]" -NewPattern "from '${configPath}constants'"
    Update-Imports -FilePath $relativePath -OldPattern "import ['\`""]\.\.+/constants['\`""]" -NewPattern "import '${configPath}constants'"
    
    # Atualizar imports de '../config' ou '../../config' etc. (mas não config/config)
    Update-Imports -FilePath $relativePath -OldPattern "from ['\`""]\.\.+/config['\`""]" -NewPattern "from '${configPath}config'"
    Update-Imports -FilePath $relativePath -OldPattern "import ['\`""]\.\.+/config['\`""]" -NewPattern "import '${configPath}config'"
}

Write-Host "Atualização de imports concluída!" -ForegroundColor Green
# Script para adicionar export const dynamic = 'force-static' em todas as rotas da API

$apiDir = "app\api"
$routeFiles = Get-ChildItem -Path $apiDir -Recurse -Name "route.ts"

foreach ($file in $routeFiles) {
    $fullPath = Join-Path $apiDir $file
    $content = Get-Content $fullPath -Raw
    
    # Verifica se já tem a linha dynamic
    if ($content -notmatch "export const dynamic") {
        # Encontra a primeira linha de import
        $lines = Get-Content $fullPath
        $importEndIndex = -1
        
        for ($i = 0; $i -lt $lines.Length; $i++) {
            if ($lines[$i] -match "^import" -or $lines[$i] -match "^const" -or $lines[$i] -match "^let" -or $lines[$i] -match "^var") {
                continue
            } elseif ($lines[$i] -match "^\s*$") {
                continue
            } else {
                $importEndIndex = $i
                break
            }
        }
        
        if ($importEndIndex -gt 0) {
            # Adiciona a linha dynamic após os imports
            $newLines = @()
            $newLines += $lines[0..($importEndIndex-1)]
            $newLines += ""
            $newLines += "export const dynamic = 'force-static';"
            $newLines += ""
            $newLines += $lines[$importEndIndex..($lines.Length-1)]
            
            $newLines | Set-Content $fullPath
            Write-Host "Adicionado dynamic export em: $fullPath"
        }
    } else {
        Write-Host "Já existe dynamic export em: $fullPath"
    }
}

Write-Host "Concluído!"
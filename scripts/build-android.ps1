# Construction locale de SlimoTV sous Windows / PowerShell.
# Utilise JDK 21 pour éviter le conflit connu avec JDK 25 / Gradle.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$jdkRoot = 'C:\Program Files\Eclipse Adoptium'
$jdk = Get-ChildItem -Path $jdkRoot -Directory -Filter 'jdk-21*' -ErrorAction SilentlyContinue |
       Sort-Object Name -Descending | Select-Object -First 1
if (-not $jdk) { throw "JDK 21 introuvable dans $jdkRoot. Installer Eclipse Temurin 21." }
$env:JAVA_HOME = $jdk.FullName
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
Write-Host "JDK sélectionné : $env:JAVA_HOME"
Push-Location $root
try {
  if (-not (Test-Path 'node_modules')) {
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'Échec npm ci' }
  }
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw 'Échec du build web' }
  if (-not (Test-Path 'android/app/src/main/AndroidManifest.xml')) {
    & npx.cmd cap add android
    if ($LASTEXITCODE -ne 0) { throw 'Échec de la création Android' }
  }
  & npm.cmd run android:sync
  if ($LASTEXITCODE -ne 0) { throw 'Échec de la synchronisation Android' }
  Push-Location 'android'
  try {
    & .\gradlew.bat assembleDebug
    if ($LASTEXITCODE -ne 0) { throw 'Échec Gradle assembleDebug' }
  } finally { Pop-Location }
  Write-Host "APK : $root\android\app\build\outputs\apk\debug\app-debug.apk"
} finally { Pop-Location }

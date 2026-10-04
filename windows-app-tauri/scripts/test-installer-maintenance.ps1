# Run the actual NSIS maintenance decisions against disposable workspace data.
# No app install, uninstall, registry mutation, elevation or real app-data deletion.
$ErrorActionPreference = 'Stop'
$appRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$workspace = [IO.Path]::GetFullPath((Join-Path $appRoot '..'))
$fixtureRoot = Join-Path $workspace 'scratch/windows-diagnostics/nsis-maintenance-test'
if (-not $fixtureRoot.StartsWith($workspace + [IO.Path]::DirectorySeparatorChar)) { throw 'Unsafe fixture path' }
New-Item -ItemType Directory -Force -Path $fixtureRoot | Out-Null
$template = [IO.File]::ReadAllText((Join-Path $appRoot 'src-tauri/installer/installer.nsi'))
$compareStart = $template.IndexOf('  nsis_tauri_utils::SemverCompare')
$compareEnd = $template.IndexOf('  ; Skip showing the page', $compareStart)
$compare = $template.Substring($compareStart, $compareEnd - $compareStart)
# UI-only translations/header rendering are irrelevant to this noninteractive fixture.
$compare = [regex]::Replace($compare, '(?m)^.*!insertmacro MUI_HEADER_TEXT.*\r?\n', '')
$compare = [regex]::Replace($compare, '\$\((\w+)\)', '$1')
$leaveStart = $template.IndexOf('Function PageLeaveReinstall') + 'Function PageLeaveReinstall'.Length
$leaveEnd = $template.IndexOf('  ; If migrating from Wix', $leaveStart)
$leave = $template.Substring($leaveStart, $leaveEnd - $leaveStart)
$cleanStart = $template.IndexOf('  ; Only remove this app')
$cleanEnd = $template.IndexOf('  ; Copy main executable', $cleanStart)
$clean = $template.Substring($cleanStart, $cleanEnd - $cleanStart)
$clean = $clean.Replace('$APPDATA\${BUNDLEID}', '${FIXTUREDIR}\appdata')
$clean = $clean.Replace('$LOCALAPPDATA\${BUNDLEID}', '${FIXTUREDIR}\localdata')
$clean = $clean.Replace('    SetShellVarContext current', '')
$clean = $clean.Replace('    !insertmacro SetContext', '')
$version = (Get-Content (Join-Path $appRoot 'package.json') -Raw | ConvertFrom-Json).version
$older = '2.0.33'
$nsis = Join-Path $env:LOCALAPPDATA 'tauri/NSIS/makensis.exe'
$plugins = Join-Path $env:LOCALAPPDATA 'tauri/NSIS/Plugins/x86-unicode/additional'
$cases = @(
    @{ Name='update'; Previous=$older; Choice=1; Passive=0; Silent=$false; Update=0; Clean=0; Label='Update (keep all settings)'; LocalOnly=$false },
    @{ Name='reinstall'; Previous=$version; Choice=1; Passive=0; Silent=$false; Update=0; Clean=0; Label='Reinstall (keep all settings)'; LocalOnly=$false },
    @{ Name='clean'; Previous=$version; Choice=2; Passive=0; Silent=$false; Update=1; Clean=1; Label='Reinstall (keep all settings)'; LocalOnly=$false },
    @{ Name='clean-missing-roaming'; Previous=$older; Choice=2; Passive=0; Silent=$false; Update=0; Clean=1; Label='Update (keep all settings)'; LocalOnly=$true },
    @{ Name='passive-keeps'; Previous=$older; Choice=2; Passive=1; Silent=$false; Update=1; Clean=0; Label='Update (keep all settings)'; LocalOnly=$false },
    @{ Name='silent-keeps'; Previous=$version; Choice=2; Passive=0; Silent=$true; Update=1; Clean=0; Label='Reinstall (keep all settings)'; LocalOnly=$false }
)
foreach ($case in $cases) {
    $dir = Join-Path $fixtureRoot $case.Name
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $local = Join-Path $dir 'localdata/settings.txt'
    New-Item -ItemType Directory -Force -Path (Split-Path $local) | Out-Null
    Set-Content -LiteralPath $local -Value 'Disposable settings'
    $roaming = Join-Path $dir 'appdata/profiles.txt'
    if (-not $case.LocalOnly) {
        New-Item -ItemType Directory -Force -Path (Split-Path $roaming) | Out-Null
        Set-Content -LiteralPath $roaming -Value 'Disposable profiles'
    }
    $exe = Join-Path $dir 'maintenance-fixture.exe'
    $result = Join-Path $dir 'result.txt'
    $nsi = @'
Unicode true
RequestExecutionLevel user
!include LogicLib.nsh
!addplugindir "__PLUGINS__"
!define VERSION "__VERSION__"
!define ALLOWDOWNGRADES "false"
!define FIXTUREDIR "__DIR__"
OutFile "__EXE__"
Var PassiveMode
Var UpdateMode
Var CleanInstall
Var ReinstallPageCheck
Function .onInit
  StrCpy $R0 "__PREVIOUS__"
__COMPARE__
  StrCpy $PassiveMode __PASSIVE__
  StrCpy $UpdateMode __UPDATE__
  StrCpy $ReinstallPageCheck __CHOICE__
__LEAVE__
  FileOpen $9 "__RESULT__" w
  FileWrite $9 "$R2$\r$\nCleanInstall=$CleanInstall$\r$\n"
__CLEAN__
  FileWrite $9 "Completed$\r$\n"
  FileClose $9
  SetErrorLevel 0
  Quit
FunctionEnd
Section
SectionEnd
'@
    $replacements = @{PLUGINS=$plugins;VERSION=$version;DIR=$dir;EXE=$exe;PREVIOUS=$case.Previous;COMPARE=$compare;PASSIVE=$case.Passive;UPDATE=$case.Update;CHOICE=$case.Choice;LEAVE=$leave;RESULT=$result;CLEAN=$clean}
    foreach ($key in $replacements.Keys) { $nsi = $nsi.Replace("__$key`__", [string]$replacements[$key]) }
    $script = Join-Path $dir 'fixture.nsi'
    [IO.File]::WriteAllText($script, $nsi, (New-Object System.Text.UTF8Encoding($false)))
    & $nsis '/V2' $script *> (Join-Path $dir 'compile.log')
    if ($LASTEXITCODE -ne 0) { throw "NSIS fixture compile failed: $($case.Name)" }
    $args = if ($case.Silent) { '/S' } else { '' }
    if ($args) { $process = Start-Process -FilePath $exe -ArgumentList $args -Wait -PassThru -WindowStyle Hidden }
    else { $process = Start-Process -FilePath $exe -Wait -PassThru -WindowStyle Hidden }
    $text = [IO.File]::ReadAllText($result)
    if ($process.ExitCode -ne 0 -or -not $text.Contains($case.Label) -or -not $text.Contains("CleanInstall=$($case.Clean)") -or -not $text.Contains('Completed')) {
        throw "Maintenance decision failed: $($case.Name): $text"
    }
    if ((Test-Path -LiteralPath $local) -ne ($case.Clean -eq 0)) { throw "Settings retention failed: $($case.Name)" }
    if (-not $case.LocalOnly -and ((Test-Path -LiteralPath $roaming) -ne ($case.Clean -eq 0))) { throw "Profile retention failed: $($case.Name)" }
    Write-Output "PASS $($case.Name): $($case.Label); CleanInstall=$($case.Clean)"
}

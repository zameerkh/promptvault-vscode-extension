@echo off
REM PromptVault Extension Publisher Batch Wrapper
REM This script makes it easier to run the PowerShell publishing script

setlocal enabledelayedexpansion

echo PromptVault Extension Publisher
echo ================================

REM Check if PowerShell is available
powershell -Command "Write-Host 'PowerShell is available'" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PowerShell is not available or not in PATH
    echo Please ensure PowerShell is installed and accessible
    pause
    exit /b 1
)

REM Parse command line arguments
set "ARGS="
set "PAT="
set "VERSION=patch"
set "PACKAGE_ONLY="
set "FORCE="

:argloop
if "%~1"=="" goto :argend
if /i "%~1"=="--package-only" (
    set "PACKAGE_ONLY=-PackageOnly"
) else if /i "%~1"=="--force" (
    set "FORCE=-Force"
) else if /i "%~1"=="--pat" (
    set "PAT=-PAT '%~2'"
    shift
) else if /i "%~1"=="--version" (
    set "VERSION=%~2"
    shift
) else if /i "%~1"=="--help" (
    goto :help
) else (
    echo Unknown argument: %~1
    goto :help
)
shift
goto :argloop

:argend

REM Build the PowerShell command
set "PS_CMD=.\publish.ps1"
if defined PAT set "PS_CMD=!PS_CMD! !PAT!"
if not "!VERSION!"=="patch" set "PS_CMD=!PS_CMD! -VersionBump !VERSION!"
if defined PACKAGE_ONLY set "PS_CMD=!PS_CMD! !PACKAGE_ONLY!"
if defined FORCE set "PS_CMD=!PS_CMD! !FORCE!"

REM Execute the PowerShell script
echo Executing: powershell -ExecutionPolicy Bypass -File !PS_CMD!
echo.
powershell -ExecutionPolicy Bypass -File !PS_CMD!

set "EXIT_CODE=%errorlevel%"
echo.
if %EXIT_CODE% equ 0 (
    echo Publishing process completed successfully!
) else (
    echo Publishing process completed with errors.
)

pause
exit /b %EXIT_CODE%

:help
echo.
echo Usage: publish.bat [OPTIONS]
echo.
echo Options:
echo   --pat TOKEN        Personal Access Token for publishing
echo   --version TYPE     Version bump type: patch, minor, major, package-only
echo   --package-only     Only create package, don't publish
echo   --force           Force publishing even if Azure DevOps seems unavailable
echo   --help            Show this help message
echo.
echo Examples:
echo   publish.bat                                    ^(package and publish with patch bump^)
echo   publish.bat --package-only                     ^(create .vsix file only^)
echo   publish.bat --pat YOUR_TOKEN --version minor   ^(publish with minor version bump^)
echo   publish.bat --force                            ^(force publish despite service issues^)
echo.
pause
exit /b 0

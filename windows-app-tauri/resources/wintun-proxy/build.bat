@echo off
REM Build script for Wintun Proxy DLL
REM Requires Visual Studio Developer Command Prompt or MinGW

echo Building Wintun Proxy DLL...

REM Try Visual Studio first
where cl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Using Visual Studio compiler...
    cl /LD /O2 /W3 wintun_proxy.c /Fe:wintun.dll /link /DEF:wintun.def
    if exist wintun.dll (
        echo SUCCESS: wintun.dll created!
        echo.
        echo Next steps:
        echo 1. Rename original wintun.dll to wintun_real.dll
        echo 2. Copy new wintun.dll to openconnect folder
        goto done
    )
)

REM Try MinGW gcc
where gcc >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Using MinGW compiler...
    gcc -shared -O2 -o wintun.dll wintun_proxy.c -Wl,--output-def,wintun.def
    if exist wintun.dll (
        echo SUCCESS: wintun.dll created!
        echo.
        echo Next steps:
        echo 1. Rename original wintun.dll to wintun_real.dll
        echo 2. Copy new wintun.dll to openconnect folder
        goto done
    )
)

echo ERROR: No compiler found!
echo Please install Visual Studio or MinGW and run from Developer Command Prompt.
pause
exit /b 1

:done
echo.
echo Build complete!
pause

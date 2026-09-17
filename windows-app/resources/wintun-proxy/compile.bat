@echo off
cd /d "e:\VPN APP\windows-app\resources\wintun-proxy"
echo Compiling...
C:\mingw64\bin\gcc.exe -shared -O2 -Wall -o wintun.dll wintun_proxy.c 2>&1
echo.
echo Exit code: %ERRORLEVEL%
if exist wintun.dll (
    echo SUCCESS: wintun.dll created!
    dir wintun.dll
) else (
    echo FAILED: wintun.dll not created
)

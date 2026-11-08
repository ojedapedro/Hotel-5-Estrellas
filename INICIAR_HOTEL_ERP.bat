@echo off
:: ============================================================
:: HOTEL ERP 5 ESTRELLAS - Script de Inicio Local
:: Ejecutar como Administrador para Docker
:: ============================================================
title Hotel ERP - Iniciando Sistema...

echo.
echo  ========================================================
echo   GRAN HOTEL CARACAS 5 ESTRELLAS - ERP + PMS
echo   Iniciando todos los servicios...
echo  ========================================================
echo.

:: 1. Verificar y levantar contenedores Docker
echo [1/3] Levantando base de datos y cache...
docker start hotel_erp_postgres hotel_erp_redis >nul 2>&1
if %errorlevel% == 0 (
    echo  OK - PostgreSQL en puerto 5434
    echo  OK - Redis en puerto 6380
) else (
    echo  ADVERTENCIA: Docker no disponible o contenedores no creados.
    echo  Ejecuta primero: docker compose -f docker-compose.yml up -d
    pause
    exit /b 1
)

:: Esperar a que PostgreSQL esté listo
echo.
echo     Esperando conexion de PostgreSQL...
timeout /t 3 /nobreak >nul

:: 2. Iniciar Backend en nueva ventana
echo.
echo [2/3] Iniciando Backend NestJS (puerto 3001)...
start "Hotel ERP - Backend" cmd /k "cd /d "c:\Users\Agencia de viajes\OneDrive\Escritorio\proyecto hotel 5 estrellas\hotel-erp\apps\backend" && node dist/main.js"

:: Esperar a que el backend inicie
echo     Esperando que el backend inicie...
timeout /t 5 /nobreak >nul

:: 3. Iniciar Frontend en nueva ventana
echo.
echo [3/3] Iniciando Frontend Vite (puerto 5173)...
start "Hotel ERP - Frontend" cmd /k "cd /d "c:\Users\Agencia de viajes\OneDrive\Escritorio\proyecto hotel 5 estrellas\hotel-erp\apps\frontend" && pnpm run dev"

timeout /t 4 /nobreak >nul

:: Abrir navegador
echo.
echo  ========================================================
echo   SISTEMA LISTO!
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:3001
echo   Swagger:   http://localhost:3001/api/docs
echo.
echo   Credenciales demo:
echo   Email:     admin@hotel.com
echo   Password:  Admin2026*
echo  ========================================================
echo.

start "" "http://localhost:5173"

pause

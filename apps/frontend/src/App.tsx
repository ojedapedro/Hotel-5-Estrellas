import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { RoomsMapPage } from './pages/pms/RoomsMapPage';
import { ReservationsPage } from './pages/pms/ReservationsPage';
import { FolioPage } from './pages/pms/FolioPage';
import { POSPage } from './pages/pos/POSPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { ContabilidadPage } from './pages/contabilidad/ContabilidadPage';
import { UsersPage } from './pages/admin/UsersPage';
import ComprasPage from './pages/compras/ComprasPage';
import EventosPage from './pages/eventos/EventosPage';
import RrhhPage from './pages/rrhh/RrhhPage';
import MantenimientoPage from './pages/mantenimiento/MantenimientoPage';
import SociosPage from './pages/socios/SociosPage';
import FiscalPage from './pages/fiscal/FiscalPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas Protegidas bajo AppLayout */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pms/rooms" element={<RoomsMapPage />} />
          <Route path="/pms/reservations" element={<ReservationsPage />} />
          <Route path="/pms/folio/:id" element={<FolioPage />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/compras" element={<ComprasPage />} />
          <Route path="/eventos" element={<EventosPage />} />
          <Route path="/mantenimiento" element={<MantenimientoPage />} />
          <Route path="/rrhh" element={<RrhhPage />} />
          <Route path="/socios" element={<SociosPage />} />
          <Route path="/fiscal" element={<FiscalPage />} />
          <Route path="/contabilidad" element={<ContabilidadPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

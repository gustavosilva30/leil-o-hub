/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/src/layouts/AuthLayout';
import { DashboardLayout } from '@/src/layouts/DashboardLayout';
import { Login } from '@/src/pages/Login';
import { Dashboard } from '@/src/pages/Dashboard';
import { Auctions } from '@/src/pages/Auctions';
import { Lots } from '@/src/pages/Lots';
import { LotDetails } from '@/src/pages/LotDetails';
import { Favorites } from '@/src/pages/Favorites';
import { Alerts } from '@/src/pages/Alerts';
import { Admin } from '@/src/pages/Admin';
import { Purchases } from '@/src/pages/Purchases';
import { Disassembly } from '@/src/pages/Disassembly';
import { Reports } from '@/src/pages/Reports';
import AuctionSync from '@/src/pages/AuctionSync';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>
          
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/auctions" element={<Auctions />} />
            <Route path="/auctions/sync" element={<AuctionSync />} />
            <Route path="/lots" element={<Lots />} />
            <Route path="/lots/:id" element={<LotDetails />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/disassembly" element={<Disassembly />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </TooltipProvider>
  );
}

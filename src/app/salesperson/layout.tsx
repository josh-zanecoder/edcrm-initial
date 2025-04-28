'use client';

import { useState } from 'react';
import SalespersonSidebar from '@/components/salesperson/SalespersonSidebar';
import SalespersonNavbar from '@/components/salesperson/SalespersonNavbar';


export default function SalespersonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
 

  return (
    <div className="min-h-screen bg-gray-100">
      <SalespersonSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <SalespersonNavbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 
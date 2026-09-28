import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100/70">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

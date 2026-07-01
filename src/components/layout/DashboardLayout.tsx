'use client';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      {loading ? (
        <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-900">
           <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-red-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="flex h-screen overflow-hidden">
          {/* SIDEBAR */}
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

          {/* CONTENT AREA */}
          <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900">
            {/* HEADER */}
            <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* MAIN CONTENT */}
            <main>
              <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                {children}
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

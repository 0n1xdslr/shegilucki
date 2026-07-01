'use client';

import { useState } from 'react';

export default function JsonModal({ data, title }: { data: any, title: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-red-500 hover:underline text-sm font-medium"
      >
        Ver JSON
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-auto bg-slate-50 dark:bg-slate-900 rounded p-4 border border-slate-200 dark:border-slate-700 flex-1">
              <pre className="text-sm text-slate-800 dark:text-slate-300 whitespace-pre-wrap font-mono">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded bg-slate-200 px-4 py-2 font-medium text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

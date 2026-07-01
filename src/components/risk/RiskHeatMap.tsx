'use client';
import { calculateRiskLevel } from '@/lib/utils/risk';
import { useState } from 'react';

type RiskHeatMapProps = {
  risksData: any[]; // Array of risks with probability and impact
};

export default function RiskHeatMap({ risksData }: RiskHeatMapProps) {
  const [selectedCell, setSelectedCell] = useState<{ p: number; i: number } | null>(null);

  // Generate grid 5x5 (Probabilidad Y-axis, Impacto X-axis)
  // Usually Y is 5 at top to 1 at bottom, X is 1 at left to 5 at right
  const grid = [];
  for (let p = 5; p >= 1; p--) {
    const row = [];
    for (let i = 1; i <= 5; i++) {
      row.push({ p, i });
    }
    grid.push(row);
  }

  const getRisksInCell = (p: number, i: number) => {
    return risksData.filter((r) => r.probability === p && r.impact === i);
  };

  const getCellColor = (p: number, i: number) => {
    const level = calculateRiskLevel(p, i);
    switch (level.label) {
      case 'Bajo': return 'bg-green-500 hover:bg-green-600';
      case 'Medio': return 'bg-yellow-400 hover:bg-yellow-500';
      case 'Alto': return 'bg-orange-500 hover:bg-orange-600';
      case 'Crítico': return 'bg-red-600 hover:bg-red-700';
      default: return 'bg-gray-200';
    }
  };

  const selectedRisks = selectedCell ? getRisksInCell(selectedCell.p, selectedCell.i) : [];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      
      {/* MAPA */}
      <div className="flex-1 overflow-x-auto p-4 bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
        <div className="relative inline-block min-w-max">
          
          {/* Eje Y Label */}
          <div className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 font-semibold text-slate-500 tracking-widest">
            PROBABILIDAD
          </div>
          
          <div className="flex">
            {/* Eje Y numbers */}
            <div className="flex flex-col justify-around mr-4 font-bold text-slate-500 h-[400px]">
              <span>5</span>
              <span>4</span>
              <span>3</span>
              <span>2</span>
              <span>1</span>
            </div>

            {/* Grid */}
            <div className="flex flex-col gap-2 h-[400px] w-[400px]">
              {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-2 flex-1">
                  {row.map((cell) => {
                    const count = getRisksInCell(cell.p, cell.i).length;
                    const isSelected = selectedCell?.p === cell.p && selectedCell?.i === cell.i;
                    return (
                      <div
                        key={`${cell.p}-${cell.i}`}
                        onClick={() => setSelectedCell(cell)}
                        className={`flex-1 rounded cursor-pointer transition-all flex items-center justify-center text-white font-bold text-xl
                          ${getCellColor(cell.p, cell.i)}
                          ${isSelected ? 'ring-4 ring-slate-800 dark:ring-white scale-105 z-10' : ''}
                          ${count === 0 ? 'opacity-80' : 'opacity-100 shadow-md'}
                        `}
                      >
                        {count > 0 ? count : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          {/* Eje X numbers */}
          <div className="flex justify-around mt-4 ml-10 font-bold text-slate-500 w-[400px]">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
          
          {/* Eje X Label */}
          <div className="text-center mt-2 font-semibold text-slate-500 tracking-widest ml-10 w-[400px]">
            IMPACTO
          </div>
        </div>
      </div>

      {/* PANEL LATERAL */}
      <div className="w-full lg:w-1/3">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6 min-h-[400px]">
          {selectedCell ? (
            <>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                Riesgos en Celda ({selectedCell.p}, {selectedCell.i})
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Probabilidad: {selectedCell.p} | Impacto: {selectedCell.i}
              </p>
              
              <div className="flex flex-col gap-3">
                {selectedRisks.length > 0 ? (
                  selectedRisks.map(r => (
                    <div key={r.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded">
                      <p className="font-semibold text-slate-800 dark:text-white">{r.name}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-slate-500">{r.assets?.name || 'Activo'}</span>
                        <span className="text-xs font-bold px-2 py-1 bg-white dark:bg-slate-800 rounded shadow-sm">{r.risk_score} pts</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">No hay riesgos mapeados en esta cuadrícula.</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p>Seleccione una celda para ver sus riesgos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

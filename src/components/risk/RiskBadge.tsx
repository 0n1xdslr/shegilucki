import { RiskClassification, calculateRiskLevel } from '@/lib/utils/risk';

export default function RiskBadge({ level }: { level: string }) {
  // If we receive a string that isn't exactly the type, we do a fallback check
  let config;
  
  switch(level) {
    case 'Bajo':
      config = calculateRiskLevel(1, 1);
      break;
    case 'Medio':
      config = calculateRiskLevel(2, 4);
      break;
    case 'Alto':
      config = calculateRiskLevel(3, 4);
      break;
    case 'Crítico':
      config = calculateRiskLevel(4, 5);
      break;
    default:
      config = { color: 'bg-gray-100 text-gray-800', label: level };
  }

  return (
    <span className={`inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-sm font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

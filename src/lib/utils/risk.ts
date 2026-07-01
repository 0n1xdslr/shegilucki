export type RiskClassification = 'Bajo' | 'Medio' | 'Alto' | 'Crítico';

export interface RiskLevelResult {
  score: number;
  label: RiskClassification;
  color: string;
  description: string;
}

/**
 * Calculates the risk level based on probability and impact.
 * 
 * Probability: 1-5
 * Impact: 1-5
 * Score = Probability * Impact
 * 
 * Classification:
 * 1-5 = Bajo (Verde)
 * 6-10 = Medio (Amarillo)
 * 11-15 = Alto (Naranja)
 * 16-25 = Crítico (Rojo)
 * 
 * @param probability Number from 1 to 5
 * @param impact Number from 1 to 5
 * @returns RiskLevelResult
 */
export function calculateRiskLevel(probability: number, impact: number): RiskLevelResult {
  // Ensure values are within boundaries
  const safeProb = Math.max(1, Math.min(5, Math.round(probability)));
  const safeImpact = Math.max(1, Math.min(5, Math.round(impact)));
  
  const score = safeProb * safeImpact;
  
  if (score <= 5) {
    return {
      score,
      label: 'Bajo',
      color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      description: 'Riesgo aceptable, requiere monitoreo periódico.'
    };
  } else if (score <= 10) {
    return {
      score,
      label: 'Medio',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
      description: 'Riesgo moderado, requiere plan de mitigación a mediano plazo.'
    };
  } else if (score <= 15) {
    return {
      score,
      label: 'Alto',
      color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
      description: 'Riesgo importante, requiere atención y recursos a corto plazo.'
    };
  } else {
    return {
      score,
      label: 'Crítico',
      color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      description: 'Riesgo inaceptable, requiere acción inmediata de la alta gerencia.'
    };
  }
}

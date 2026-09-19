export type CrowdLevel = 'quiet' | 'moderate' | 'busy' | 'packed';

export interface CrowdThresholds {
  thresholdLow: number;
  thresholdModerate: number;
  thresholdPacked: number;
}

export interface CrowdStatus {
  level: CrowdLevel;
  label: string;
  badgeClass: string;
  indicatorClassName: string;
  percent: number;
}

export function getCrowdLevel(count: number, thresholds: CrowdThresholds): CrowdStatus {
  const { thresholdLow, thresholdModerate, thresholdPacked } = thresholds;
  const percent = thresholdPacked > 0 ? Math.min(100, Math.round((count / thresholdPacked) * 100)) : 0;

  if (count <= thresholdLow) {
    return { level: 'quiet', label: 'Not Busy', badgeClass: 'bg-green-500/20 text-green-400 border-green-500/30', indicatorClassName: 'bg-green-500', percent };
  }
  if (count <= thresholdModerate) {
    return { level: 'moderate', label: 'Moderate', badgeClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', indicatorClassName: 'bg-yellow-500', percent };
  }
  if (count <= thresholdPacked) {
    return { level: 'busy', label: 'Busy', badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30', indicatorClassName: 'bg-orange-500', percent };
  }
  return { level: 'packed', label: 'Packed', badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30', indicatorClassName: 'bg-red-500', percent };
}

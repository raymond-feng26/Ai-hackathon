export const getScoreColor = (score, isPercentage = false) => {
  const high = isPercentage ? 80 : 8;
  const mid = isPercentage ? 60 : 6;
  if (score >= high) return 'text-green-600';
  if (score >= mid) return 'text-yellow-600';
  return 'text-red-600';
};

export const getOverallColor = (score) => {
  if (score >= 8) return 'bg-green-50 border-green-200';
  if (score >= 6) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
};

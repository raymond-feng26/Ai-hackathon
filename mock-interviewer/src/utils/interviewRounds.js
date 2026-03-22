export const ROUND_LABELS = {
  first: 'Behavioral',
  second: 'Technical',
  final: 'Culture Fit'
};

export const getRoundLabel = (roundKey) => ROUND_LABELS[roundKey] || roundKey;

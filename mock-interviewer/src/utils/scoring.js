export const INTERVIEW_SCORE_TIERS = [
  { range: '9–10', label: 'Exceptional', desc: 'Quantified outcomes, perfect structure, nothing missing.', color: 'text-green-600' },
  { range: '7–8',  label: 'Good',        desc: 'Solid content, specific examples, minor gaps.',           color: 'text-green-500' },
  { range: '5–6',  label: 'Average',     desc: 'Some relevant content but lacks specifics or metrics.',   color: 'text-yellow-600' },
  { range: '3–4',  label: 'Weak',        desc: 'Vague, generic, or missing concrete examples.',           color: 'text-orange-500' },
  { range: '1–2',  label: 'Poor',        desc: 'Barely addresses the question.',                          color: 'text-red-600' },
];

export const MATCH_SCORE_TIERS = [
  { range: '85–100', label: 'Near-perfect', desc: 'Covers virtually all required skills, directly relevant experience.', color: 'text-green-600' },
  { range: '70–84',  label: 'Strong',       desc: 'Most required skills present, few gaps in preferred qualifications.', color: 'text-green-500' },
  { range: '50–69',  label: 'Moderate',     desc: 'Some required skills, transferable experience, notable gaps.',        color: 'text-yellow-600' },
  { range: '30–49',  label: 'Weak',         desc: 'Few required skills, significant upskilling needed.',                 color: 'text-orange-500' },
  { range: '0–29',   label: 'Poor',         desc: 'Fundamentally different field or level, almost no overlap.',          color: 'text-red-600' },
];

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

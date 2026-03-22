// Heroicon wrapper component for consistent sizing

export default function Icon({ icon: IconComponent, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <IconComponent className={`${sizes[size]} ${className}`} />
  );
}

export default function Button({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  type = 'button',
  className = ''
}) {
  const baseStyles = 'px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary text-white hover:bg-blue-700 shadow-md hover:shadow-lg',
    secondary: 'bg-secondary text-white hover:bg-slate-600 shadow-md hover:shadow-lg',
    outline: 'border-2 border-primary text-primary hover:bg-blue-50'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

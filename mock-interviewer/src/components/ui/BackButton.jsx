import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function BackButton({ to, label }) {
  const navigate = useNavigate();

  if (!to) {
    return (
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Link
      to={to}
      className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors"
    >
      <ArrowLeftIcon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  );
}

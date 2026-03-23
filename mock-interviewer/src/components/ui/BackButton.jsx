import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function BackButton({ to, label }) {
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

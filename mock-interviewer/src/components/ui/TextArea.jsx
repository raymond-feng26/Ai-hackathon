export default function TextArea({
  value,
  onChange,
  placeholder,
  rows = 6,
  className = '',
  label,
  name
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-gray-700 font-medium mb-2">
          {label}
        </label>
      )}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors duration-200 resize-none"
      />
    </div>
  );
}

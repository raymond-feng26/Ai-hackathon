import { useState } from 'react';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';

export default function FileUpload({ onFileSelect, accept = '.pdf,.docx' }) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const isValidFile = (file) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const validExtensions = ['.pdf', '.docx'];

    return validTypes.includes(file.type) ||
           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const handleFile = (file) => {
    if (isValidFile(file)) {
      setFileName(file.name);
      onFileSelect(file);
    } else {
      alert('Please upload a PDF or DOCX file');
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
        isDragging
          ? 'border-primary bg-blue-50'
          : 'border-gray-300 hover:border-primary hover:bg-gray-50'
      }`}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <DocumentArrowUpIcon className="w-6 h-6 text-primary" />
          </div>
        </div>
        {fileName ? (
          <p className="text-primary font-medium">{fileName}</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium mb-2">
              Drag & drop your resume here
            </p>
            <p className="text-gray-500 text-sm">PDF or DOCX - click to browse</p>
          </>
        )}
      </label>
    </div>
  );
}

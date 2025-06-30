// ============================================================================
// components/questions/components/SharedComponents.jsx - COMPLETE
// ============================================================================

import React, { useRef, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Enhanced TextEditor Component
export const TextEditor = ({ value, onChange, placeholder, error, minHeight = "120px" }) => (
  <div className={`border rounded-lg overflow-hidden transition-all ${
    error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500'
  }`}>
    {/* Toolbar matching the screenshots */}
    <div className="border-b border-gray-200 p-2 bg-gray-50 flex items-center gap-1">
      <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm transition-colors" title="Paragraph">¶</button>
      <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm font-bold transition-colors" title="Bold">B</button>
      <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm italic transition-colors" title="Italic">I</button>
      <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm underline transition-colors" title="Underline">U</button>
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm transition-colors" title="Numbered List">📝</button>
      <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm transition-colors" title="Bullet List">📋</button>
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm transition-colors" title="Link">🔗</button>
      <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm transition-colors" title="Unlink">🔗</button>
      <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm transition-colors" title="Image">🖼️</button>
      <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm transition-colors" title="Media">🎥</button>
      <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm transition-colors" title="File">📁</button>
      <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm transition-colors" title="H5P">H5P</button>
    </div>
    <textarea
      className="w-full px-4 py-3 border-0 focus:outline-none resize-none"
      style={{ minHeight }}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

// Enhanced TagDropdown Component
export const TagDropdown = ({ tags, onTagToggle, isOpen, onToggle, error, availableTags }) => {
  const dropdownRef = useRef();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onToggle(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => onToggle(!isOpen)}
        className={`w-full px-4 py-3 border rounded-lg cursor-pointer bg-white flex items-center justify-between min-h-[52px] transition-all ${
          error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 hover:border-gray-400'
        } ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
      >
        <div className="flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.map(tag => (
              <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors">
                {tag}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onTagToggle(tag); }}
                  className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-500">Any tags</span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <select className="border-0 bg-transparent text-sm">
            <option>Search</option>
          </select>
          <ChevronDown size={16} className={`transform transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {filteredTags.map(tag => (
            <div
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between transition-colors ${
                tags.includes(tag) ? 'bg-blue-50 text-blue-700' : ''
              }`}
            >
              <span className="text-sm">{tag}</span>
              {tags.includes(tag) && <span className="text-blue-600 font-bold">✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Enhanced FormField Component
export const FormField = ({ 
  label, 
  required = false, 
  error, 
  children, 
  className = "space-y-2",
  description
}) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700">
        {label} 
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    {description && (
      <p className="text-sm text-gray-600">{description}</p>
    )}
    {children}
    {error && (
      <p className="text-sm text-red-600 flex items-center">
        <span className="mr-1">⚠</span>
        {error}
      </p>
    )}
  </div>
);

// Enhanced NumberInput Component
export const NumberInput = ({ 
  value, 
  onChange, 
  min = 0, 
  max, 
  step = 0.1, 
  className = "w-32", 
  error,
  placeholder = "0"
}) => (
  <input
    type="number"
    value={value}
    onChange={e => onChange(Number(e.target.value))}
    min={min}
    max={max}
    step={step}
    placeholder={placeholder}
    className={`${className} px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
      error ? 'border-red-500' : 'border-gray-300'
    }`}
  />
);

// Enhanced Select Component
export const Select = ({ 
  value, 
  onChange, 
  options, 
  className = "px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
  placeholder = "Select an option..."
}) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className={`${className} bg-white transition-all`}
  >
    {placeholder && value === "" && (
      <option value="" disabled>
        {placeholder}
      </option>
    )}
    {options.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

// Enhanced Checkbox Component
export const Checkbox = ({ 
  checked, 
  onChange, 
  label, 
  className = "inline-flex items-center",
  description
}) => (
  <div className="space-y-1">
    <label className={`${className} cursor-pointer`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
      />
      <span className="ml-3 text-sm font-medium text-gray-700">{label}</span>
    </label>
    {description && (
      <p className="text-sm text-gray-600 ml-7">{description}</p>
    )}
  </div>
);

// Enhanced RadioGroup Component
export const RadioGroup = ({ 
  name, 
  value, 
  onChange, 
  options, 
  className = "flex items-center space-x-6" 
}) => (
  <div className={className}>
    {options.map(option => (
      <label 
        key={option.value} 
        className="inline-flex items-center cursor-pointer"
      >
        <input
          type="radio"
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={e => onChange(e.target.value)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 transition-colors"
        />
        <span className="ml-3 text-sm font-medium text-gray-900">
          {option.label}
        </span>
      </label>
    ))}
  </div>
);

// ValidationErrors Component
export const ValidationErrors = ({ errors }) => {
  if (!errors || Object.keys(errors).length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center mb-2">
        <span className="text-red-600 mr-2">⚠</span>
        <h4 className="text-red-800 font-medium">Please fix the following errors:</h4>
      </div>
      <ul className="list-disc list-inside text-red-700 space-y-1">
        {Object.values(errors).map((msg, i) =>
          Array.isArray(msg)
            ? msg.map((m, j) => m && <li key={`${i}-${j}`}>{m}</li>)
            : <li key={i}>{msg}</li>
        )}
      </ul>
    </div>
  );
};

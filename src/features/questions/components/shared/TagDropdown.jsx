
// components/questions/components/TagDropdown.jsx
import React, { useRef, useEffect } from 'react';

const TagDropdown = ({ tags, onTagToggle, isOpen, onToggle, error, availableTags }) => {
  const dropdownRef = useRef();

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

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => onToggle(true)}
        className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md cursor-pointer bg-white flex items-center justify-between min-h-[42px]`}
      >
        <div className="flex flex-wrap gap-1">
          {tags.length > 0 ? (
            tags.map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {tag}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onTagToggle(tag); }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-500">Select tags...</span>
          )}
        </div>
        <span className="ml-2">▼</span>
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {availableTags.map(tag => (
            <div
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between ${
                tags.includes(tag) ? 'bg-blue-50 text-blue-700' : ''
              }`}
            >
              <span>{tag}</span>
              {tags.includes(tag) && <span className="text-blue-600">✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
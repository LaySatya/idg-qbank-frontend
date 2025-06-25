// src/components/questions/shared/BulkEditComponents.jsx
import React, { useState } from 'react';
import { Check, X, Plus, RefreshCw, AlertCircle, Tag } from 'lucide-react';

//  SHARED TAG MANAGER COMPONENT
export const TagManager = ({
  availableTags = [],
  existingTags = [], // For smart removal: [{ tag, count, percentage }]
  selectedAddTags = [],
  selectedRemoveTags = [],
  onTagOperation,
  onAddCustomTag,
  loading = false,
  error = null,
  onRefresh,
  showSmartRemoval = false,
  customTagPlaceholder = "Enter new tag name"
}) => {
  const [customTag, setCustomTag] = useState('');

  // 🔧 FIX: Normalize tag data - handle both string arrays and object arrays
  const normalizeTagData = (tags) => {
    if (!Array.isArray(tags)) return [];
    
    return tags.map(tag => {
      // If it's already a string, return it
      if (typeof tag === 'string') return tag;
      
      // If it's an object, extract the tag name
      if (typeof tag === 'object' && tag !== null) {
        return tag.rawname || tag.name || tag.tag || String(tag);
      }
      
      // Fallback to string conversion
      return String(tag);
    }).filter(Boolean); // Remove any empty/null values
  };

  // 🔧 FIX: Normalize available tags
  const normalizedAvailableTags = normalizeTagData(availableTags);

  const handleAddCustomTag = () => {
    if (customTag.trim()) {
      const success = onAddCustomTag(customTag.trim());
      if (success) {
        setCustomTag('');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddCustomTag();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 flex items-center">
          <Tag size={16} className="mr-2" />
          Tag Management
          {loading && (
            <span className="ml-2 text-xs text-blue-600 flex items-center">
              <RefreshCw size={12} className="animate-spin mr-1" />
              Loading...
            </span>
          )}
          {error && (
            <span className="ml-2 text-xs text-red-600 flex items-center">
              <AlertCircle size={12} className="mr-1" />
              Error
            </span>
          )}
        </h4>
        
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 flex items-center"
            title="Refresh tags from API"
          >
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      {/* Custom Tag Input */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Add Custom Tag
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            placeholder={customTagPlaceholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            onKeyPress={handleKeyPress}
          />
          <button
            type="button"
            onClick={handleAddCustomTag}
            disabled={!customTag.trim() || loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm flex items-center"
          >
            <Plus size={14} className="mr-1" />
            Add
          </button>
        </div>
      </div>

      {/* Add Tags Section */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-3">
          Add Tags - {normalizedAvailableTags.length} available
        </label>
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw size={24} className="animate-spin mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Loading tags from API...</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {normalizedAvailableTags.length === 0 ? (
              <div className="text-center w-full py-4 text-gray-500">
                <Tag size={20} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No tags available</p>
              </div>
            ) : (
              normalizedAvailableTags.map((tag, index) => (
                <button
                  key={`add-tag-${tag}-${index}`} // 🔧 FIX: Unique key with fallback
                  onClick={() => onTagOperation('add', tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    selectedAddTags.includes(tag)
                      ? 'bg-green-100 text-green-800 border border-green-300 shadow-sm'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                  }`}
                >
                  {tag}
                  {selectedAddTags.includes(tag) && (
                    <Check size={12} className="inline ml-1" />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Remove Tags Section */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-3">
          {showSmartRemoval ? (
            <>
              Remove Tags from Selected Questions
              <span className="ml-1 text-gray-500 font-normal">
                - Only showing tags that exist in selected questions
              </span>
            </>
          ) : (
            'Remove Tags from All Questions'
          )}
        </label>

        {showSmartRemoval ? (
          // Smart removal for selected questions
          (() => {
            if (existingTags.length === 0) {
              return (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  <Tag size={20} className="mx-auto mb-2 text-gray-300" />
                  <span className="text-sm">No tags found in selected questions</span>
                </div>
              );
            }

            return (
              <div>
                <div className="mb-3 text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  Found {existingTags.length} unique tags in selected questions
                </div>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {existingTags.map(({ tag, count, percentage }, index) => (
                    <button
                      key={`remove-smart-tag-${tag}-${index}`} // 🔧 FIX: Unique key
                      onClick={() => onTagOperation('remove', tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all relative ${
                        selectedRemoveTags.includes(tag)
                          ? 'bg-red-100 text-red-800 border border-red-300 shadow-sm'
                          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                      }`}
                      title={`Used in ${count} questions (${percentage}%)`}
                    >
                      {tag}
                      <span className="ml-1 text-xs opacity-75">({count})</span>
                      {selectedRemoveTags.includes(tag) && (
                        <X size={12} className="inline ml-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()
        ) : (
          // Standard removal for all tags
          <div>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw size={24} className="animate-spin mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Loading tags from API...</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {normalizedAvailableTags.length === 0 ? (
                  <div className="text-center w-full py-4 text-gray-500">
                    <Tag size={20} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No tags available for removal</p>
                    {error && (
                      <p className="text-xs text-red-500 mt-1">Error: {error}</p>
                    )}
                  </div>
                ) : (
                  normalizedAvailableTags.map((tag, index) => (
                    <button
                      key={`remove-tag-${tag}-${index}`} // 🔧 FIX: Unique key
                      onClick={() => onTagOperation('remove', tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        selectedRemoveTags.includes(tag)
                          ? 'bg-red-100 text-red-800 border border-red-300 shadow-sm'
                          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {tag}
                      {selectedRemoveTags.includes(tag) && (
                        <X size={12} className="inline ml-1" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      {(selectedAddTags.length > 0 || selectedRemoveTags.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <strong>Tag Changes:</strong>
            {selectedAddTags.length > 0 && (
              <span className="ml-2">
                +{selectedAddTags.length} to add
              </span>
            )}
            {selectedRemoveTags.length > 0 && (
              <span className="ml-2">
                -{selectedRemoveTags.length} to remove
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

//  SHARED CATEGORY SELECTOR COMPONENT
export const CategorySelector = ({
  categories = [],
  selectedCategory = '',
  onChange,
  loading = false,
  error = null,
  onRefresh,
  placeholder = "No change",
  label = "Category",
  showNoChange = true
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {loading && (
            <span className="ml-2 text-xs text-blue-600">Loading...</span>
          )}
          {error && (
            <span className="ml-2 text-xs text-red-600">Error</span>
          )}
        </label>
        
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      <select
        value={selectedCategory}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {showNoChange && <option value="">{placeholder}</option>}
        {categories.map((category, index) => (
          <option key={`category-${category.value}-${index}`} value={category.value}>
            {category.label}
          </option>
        ))}
        {categories.length === 0 && !loading && (
          <option value="" disabled>No categories available</option>
        )}
      </select>
    </div>
  );
};

//  SHARED BULK ACTIONS COMPONENT
export const BulkActionsPanel = ({
  title = "Apply to All Questions",
  description,
  children,
  onApply,
  applyButtonText = "Apply Changes",
  disabled = false,
  loading = false,
  className = ""
}) => {
  return (
    <div className={`bg-blue-50 rounded-lg p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      
      <div className="space-y-6">
        {children}
      </div>
      
      {onApply && (
        <div className="mt-6 pt-4 border-t border-blue-200">
          <button
            onClick={onApply}
            disabled={disabled || loading}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              disabled || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <RefreshCw size={16} className="animate-spin mr-2" />
                Processing...
              </span>
            ) : (
              applyButtonText
            )}
          </button>
        </div>
      )}
    </div>
  );
};

//  SHARED CHANGES PREVIEW COMPONENT
export const ChangesPreview = ({
  questions = [],
  individualChanges = {},
  title = "Preview Changes",
  maxHeight = "16rem"
}) => {
  // 🔧 FIX: Normalize tag data for preview
  const normalizeTagsForDisplay = (tags) => {
    if (!Array.isArray(tags)) return [];
    return tags.map(tag => {
      if (typeof tag === 'string') return tag;
      if (typeof tag === 'object' && tag !== null) {
        return tag.rawname || tag.name || tag.tag || String(tag);
      }
      return String(tag);
    }).filter(Boolean);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="space-y-3 overflow-y-auto" style={{ maxHeight }}>
        {questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle size={24} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No questions to preview</p>
          </div>
        ) : (
          questions.map((q, questionIndex) => {
            const changes = individualChanges[q.id] || {};
            const questionTags = normalizeTagsForDisplay(changes.tags || q.tags || []);
            
            return (
              <div key={`preview-question-${q.id}-${questionIndex}`} className="bg-white rounded-md p-4 border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {changes.title || q.title || 'Untitled Question'}
                    </h4>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        <span className="font-medium">Status:</span> {changes.status || q.status || 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Mark:</span> {changes.defaultMark || q.defaultMark || 1}
                      </div>
                      <div>
                        <span className="font-medium">Tags:</span> {questionTags.length}
                      </div>
                    </div>
                    
                    {/* Show tags if available */}
                    {questionTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {questionTags.slice(0, 5).map((tag, tagIndex) => (
                          <span 
                            key={`preview-tag-${tag}-${tagIndex}`} 
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {questionTags.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{questionTags.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">ID: {q.id}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
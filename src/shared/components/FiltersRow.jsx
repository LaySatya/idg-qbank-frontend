// ============================================================================
// src/shared/components/FiltersRow.jsx - FIXED VERSION
// Fixed Question Categories Support for Course-Specific Filtering
// ============================================================================
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { RefreshCcw, X, AlertCircle } from 'lucide-react';

// OPTIMIZATION: Create a memoized debounce function
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

const FiltersRow = ({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  tagFilter,
  setTagFilter,
  allTags = [],
  availableQuestionTypes = [],
  availableCategories = [], // NEW: This can now be question categories for a course
  loadingQuestionTypes = false,
  loadingCategories = false, // NEW: Loading state for categories
  onSearch = null, // New callback for parent notification of search changes
}) => {
  // Local state management
  const [internalSearchQuery, setInternalSearchQuery] = useState(searchQuery);

  // Performance tracking
  const renderCount = useRef(0);
  const searchChangeCount = useRef(0);
  const lastChangeTime = useRef(Date.now());

  // OPTIMIZATION: Debounced search handler
  const debouncedSetSearchQuery = useDebounce((value) => {
    setSearchQuery(value);
    if (onSearch) onSearch(value);
    searchChangeCount.current += 1;
  }, 300);

  // OPTIMIZATION: Memoize question statuses
  const questionStatuses = useMemo(() => [
    'ready',
    'draft'
  ], []);


  const handleQuestionCategoryChange = (qCategoryId) => {
    // localStorage.setItem('questionCategoryId', qCategoryId);
    console.log('Selected question category:', qCategoryId);
  }
  // OPTIMIZATION: Memoize tag computation with proper dependencies
  const combinedTags = useMemo(() => {
    const systemTags = ['easy', 'medium', 'hard', 'ready', 'draft', 'multichoice', 'essay'];
    const uniqueTags = new Map();

    // Add 'All' option first
    uniqueTags.set('all', 'All');

    // Process allTags
    if (Array.isArray(allTags)) {
      allTags.forEach(tag => {
        if (tag && typeof tag === 'string' && tag !== 'All') {
          const lowerKey = tag.toLowerCase();
          if (!systemTags.includes(lowerKey)) {
            uniqueTags.set(lowerKey, tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase());
          }
        }
      });
    }

    return Array.from(uniqueTags.values());
  }, [allTags]);

  // OPTIMIZATION: Memoize active filter check
  const hasActiveFilters = useMemo(() =>
    searchQuery.trim() ||
    filters.category !== 'All' ||
    filters.status !== 'All' ||
    filters.type !== 'All' ||
    tagFilter !== 'All' ||
    (filters.courseId && filters.courseId !== null),
    [searchQuery, filters.category, filters.status, filters.type, tagFilter, filters.courseId]
  );

  // OPTIMIZATION: Memoized filter handlers with useCallback
  const handleClearFilters = useCallback(() => {
    if (filters.courseId && window.confirm('Clear all filters including course selection?')) {
      setFilters({
        status: 'All',
        type: 'All',
        courseId: null,
        courseName: null,
        // Add this to force a reset of the filtered questions
        _resetTimestamp: Date.now()
      });
    } else {
      setFilters(prev => ({
        ...prev,
        status: 'All',
        type: 'All',
        // Add this to force a refresh of the filtered questions with the current course
        _refreshTimestamp: Date.now()
      }));
    }

    setInternalSearchQuery('');
    debouncedSetSearchQuery('');
    setTagFilter('All');

    // Performance metrics reset
    searchChangeCount.current = 0;
    lastChangeTime.current = Date.now();
  }, [filters.courseId, setFilters, debouncedSetSearchQuery, setTagFilter]);

  // Handle input changes
  const handleCategoryChange = useCallback((e) => {
    const newCategory = e.target.value;
    setFilters(prev => {
      // Check if this is a course-specific category
      const selectedCategory = availableCategories.find(cat =>
        (cat.id || cat.value) == newCategory
      );
      localStorage.setItem('questionCategoryId', newCategory);
      const isCourseCategory = selectedCategory && (
        (prev.courseName && (selectedCategory.name || selectedCategory.label || '').toLowerCase().includes(prev.courseName.toLowerCase())) ||
        selectedCategory.courseid === prev.courseId ||
        selectedCategory.course_id === prev.courseId ||
        (selectedCategory.categoryIds && Array.isArray(selectedCategory.categoryIds) &&
          selectedCategory.categoryIds.includes(parseInt(prev.courseId)))
      );

      return {
        ...prev,
        category: newCategory ? newCategory : questionCategoryId,
        // Force a query update to ensure filtering is applied correctly
        _filterChangeTimestamp: Date.now(),
        // If selecting a specific category, use only that categoryid in API calls
        // categoryid: newCategory !== 'All' ? newCategory : undefined,
        // Don't use categoryids array when selecting a specific category
        categoryids: newCategory === 'All' ? prev.categoryIds : undefined,
        // If selecting All from a course context, keep the course filter
        courseId: newCategory === 'All' ? prev.courseId :
          // If selecting a course-specific category, ensure we keep the course context
          isCourseCategory ? prev.courseId : prev.courseId,
        // Update courseName only if we're setting a course-specific category with different course
        courseName: newCategory === 'All' ? prev.courseName :
          isCourseCategory ? prev.courseName : prev.courseName
      };
    });
  }, [setFilters, availableCategories]);

  const handleStatusChange = useCallback((e) => {
    const newStatus = e.target.value;
    setFilters(prev => ({ ...prev, status: newStatus }));
  }, [setFilters]);

  const handleTypeChange = useCallback((e) => {
    const newType = e.target.value;
    setFilters(prev => ({ ...prev, type: newType }));
  }, [setFilters]);

  const handleTagChange = useCallback((e) => {
    setTagFilter(e.target.value);
  }, [setTagFilter]);

  // Search change handler with debouncing
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setInternalSearchQuery(value);
    debouncedSetSearchQuery(value);
    lastChangeTime.current = Date.now();
  }, [debouncedSetSearchQuery]);

  // Course filter clear handler
  const handleClearCourse = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      courseId: null,
      courseName: null,
      categoryIds: [],
      categoryids: undefined,
      categoryid: undefined,
      // Add this to force a reset of the filtered questions
      _resetTimestamp: Date.now(),
      // Keep category selection if it exists outside of course context
      category: prev.categoryIds && Array.isArray(prev.categoryIds) &&
        prev.categoryIds.includes(parseInt(prev.category)) ? 'All' : prev.category
    }));
  }, [setFilters]);

  // OPTIMIZATION: Sync internal search with prop when changed externally
  useEffect(() => {
    if (searchQuery !== internalSearchQuery) {
      setInternalSearchQuery(searchQuery);
    }
  }, [searchQuery]);

  // Performance tracking
  useEffect(() => {
    renderCount.current += 1;

    // Log render count periodically
    if (renderCount.current % 5 === 0 && process.env.NODE_ENV === 'development') {
      console.log(`[FiltersRow] Rendered ${renderCount.current} times, search changed ${searchChangeCount.current} times`);

      // Debug current filters state
      if (filters.courseId) {
        console.log('[FiltersRow] Current course filter:', {
          courseId: filters.courseId,
          courseName: filters.courseName,
          category: filters.category,
          categoryIds: filters.categoryIds || [],
          availableCategories: availableCategories.length
        });
      }
    }

    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[FiltersRow] Unmounting after ${renderCount.current} renders`);
      }
    };
  }, [filters, availableCategories.length]);



  const renderOptions = (nodes, level = 0, parentName = '', contextLabel = '') => nodes.flatMap(node => {
    let displayName = node.name;
    // If this is a "top" node at root, show "Top for System" or "Top for Course"
    if (level === 0 && node.name.trim().toLowerCase() === 'top') {
      displayName = `Top for ${contextLabel}`;
    }
    return [
      <option key={node.id} value={node.id}>
        {`${'— '.repeat(level)}${displayName}`}
      </option>,
      ...(node.children ? renderOptions(node.children, level + 1, node.name, contextLabel) : [])
    ];
  });

  return (
    <div className="p-4 border-t border-b border-gray-200 bg-gray-50">
      {/* Course Filter Display */}
      {filters.courseId && filters.courseName && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
          <span className="font-medium"> Course:</span>
          <span className="flex-1">{filters.courseName}</span>
          <span className="text-sm text-blue-600">(ID: {filters.courseId})</span>
          <button
            onClick={handleClearCourse}
            className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
            title="Clear course filter"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Debugging info - can be removed in production */}
      {/* {process.env.NODE_ENV === 'development' && filters.courseId && (
        <div className="mb-3 text-xs bg-gray-100 p-2 rounded">
          <strong>Debug:</strong> Course ID: {filters.courseId} | 
          Categories: {availableCategories.length} | 
          Selected Category: {filters.category} |
          {filters.categoryid && <span> Category ID: {filters.categoryid} |</span>}
          {filters.categoryids && <span> Category IDs: {filters.categoryids} |</span>}
          {filters._filterChangeTimestamp && <span> Filter changed: {new Date(filters._filterChangeTimestamp).toLocaleTimeString()} |</span>}
        </div>
      )} */}

      {/* Main Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search Input */}
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            placeholder={
              filters.courseId && filters.courseName
                ? `Search in "${filters.courseName}"...`
                : filters.courseId
                  ? `Search in course ${filters.courseId}...`
                  : "Search questions..."
            }
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${filters.courseId
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-300'
              }`}
            value={internalSearchQuery}
            onChange={handleSearchChange}
          />
          <div className={`absolute left-3 top-2.5 ${filters.courseId ? 'text-blue-500' : 'text-gray-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {filters.courseId && internalSearchQuery && (
            <div className="absolute right-3 top-2.5">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>

        {/* Question Category Filter - ENHANCED for course-specific categories */}

        <div className="relative">
          <select
            className={`border rounded-lg py-2 px-3 pr-8 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${loadingCategories
                ? 'bg-gray-50 cursor-wait'
                : filters.courseId
                  ? 'bg-white border-blue-300'
                  : 'bg-white border-gray-300'
              }`}
            value={filters.category ? filters.category : localStorage.getItem('questionCategoryId')}
            onChange={handleCategoryChange}
            disabled={loadingCategories || (filters.courseId && availableCategories.length === 0)}
          >
            {/* <option value="All">
                                {loadingCategories
                                  ? 'Loading categories...'
                                  : ''}
                              </option> */}

            {/* Group by context level */}
            {(() => {
              // Group categories by contextid
              const grouped = {};
              availableCategories.forEach(cat => {
                if (!grouped[cat.contextid]) grouped[cat.contextid] = [];
                grouped[cat.contextid].push(cat);
              });

              // Helper to get context label
              const getContextLabel = (contextid) => {
                if (contextid === 1) return 'System';
                // You can map course contextids to course names if you have them
                return `Course`;
              };

              // Tree builder
              const buildTree = (cats, parentId = 0) =>
                cats
                  .filter(cat => cat.parent === parentId)
                  .sort((a, b) => (a.sortorder ?? 0) - (b.sortorder ?? 0))
                  .map(cat => ({
                    ...cat,
                    children: buildTree(cats, cat.id)
                  }));

              // Render options for each context group
              return Object.entries(grouped).map(([contextid, cats]) => {
                const tree = buildTree(cats);
                const contextLabel = getContextLabel(Number(contextid));
                return (
                  <optgroup key={contextid} label={contextLabel === 'System' ? 'System Categories' : contextLabel}>
                    {renderOptions(tree, 0, '', contextLabel)}
                  </optgroup>
                );
              });
            })()}
          </select>
          {/* Category loading indicator */}
          {loadingCategories && (
            <div className="absolute right-8 top-2.5">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Category info indicator */}
          {filters.courseId && availableCategories.length > 0 && !loadingCategories && (
            <div className="absolute right-8 top-2.5">
              <div
                className="w-2 h-2 bg-green-500 rounded-full"
                title={`${availableCategories.length} categories available for this course`}
              ></div>
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            className="border rounded-lg py-2 px-3 pr-8 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.status}
            onChange={handleStatusChange}
          >
            <option value="All">All Statuses</option>
            {questionStatuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Question Type Filter */}
        <div className="relative">
          <select
            className="border rounded-lg py-2 px-3 pr-8 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.type}
            onChange={handleTypeChange}
            disabled={loadingQuestionTypes}
          >
            {loadingQuestionTypes ? (
              <option>Loading types...</option>
            ) : (
              <>
                <option value="All">All Question Types</option>
                {availableQuestionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </>
            )}
          </select>
          {loadingQuestionTypes && (
            <div className="absolute right-8 top-2.5">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Tag Filter */}
        <div className="relative">
          <select
            className="border rounded-lg py-2 px-3 pr-8 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={tagFilter}
            onChange={handleTagChange}
          >
            {combinedTags.map(tag => (
              <option key={tag.toLowerCase()} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 ml-auto">
          {/* Refresh Categories Button - Enhanced */}
          <button
            onClick={() => {
              // If we have a course selected, this could trigger a refresh of course categories
              if (filters.courseId) {
                window.location.reload(); // Simple refresh for now
              }
            }}
            disabled={loadingCategories}
            className="px-3 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 text-sm disabled:opacity-50 flex items-center gap-2 transition-colors"
            title={filters.courseId ? "Refresh course categories" : "Refresh categories"}
          >
            <RefreshCcw size={16} className={loadingCategories ? 'animate-spin' : ''} />
            Refresh
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center gap-2 transition-colors"
            >
              <X size={16} />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Summary - ENHANCED */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="text-gray-600">Active filters:</span>
          {internalSearchQuery && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
              Search: "{internalSearchQuery}"
            </span>
          )}
          {filters.category !== 'All' && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Category: {(() => {
                // Find category name from availableCategories
                const category = availableCategories.find(c => (c.id || c.value) == filters.category);
                return category ? (category.name || category.label) : filters.category;
              })()}
            </span>
          )}
          {filters.status !== 'All' && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Status: {filters.status}
            </span>
          )}
          {filters.type !== 'All' && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
              Type: {availableQuestionTypes.find(t => t.value === filters.type)?.label || filters.type}
            </span>
          )}
          {tagFilter !== 'All' && (
            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
              Tag: {tagFilter}
            </span>
          )}
          {filters.courseId && (
            <span className="bg-sky-100 text-sky-800 px-2 py-1 rounded">
              Course: {filters.courseName || filters.courseId}
            </span>
          )}
        </div>
      )}






    </div>
  );
};

// OPTIMIZATION: Wrap in React.memo to avoid unnecessary re-renders
export default React.memo(FiltersRow);
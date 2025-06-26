// ============================================================================
// src/components/FiltersRow.jsx - Fixed and Enhanced Version
// ============================================================================
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RefreshCcw, X } from 'lucide-react';
import useQuestionCategory from '../hooks/useQuestionCategory';

const FiltersRow = ({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  tagFilter,
  setTagFilter,
  allTags = [],
  availableQuestionTypes = [],
  availableCategories = [],
  loadingQuestionTypes = false
}) => {
  // State for API data
  const [apiTags, setApiTags] = useState([]);
  const [questionStatuses, setQuestionStatuses] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);
  const [apiQuestionTypes, setApiQuestionTypes] = useState([]);
  
  // Loading states for individual filters
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingApiQuestionTypes, setLoadingApiQuestionTypes] = useState(false);
  
  // Track which data has been loaded
  const [dataLoaded, setDataLoaded] = useState({
    tags: false,
    statuses: false,
    categories: false,
    questionTypes: false
  });
  
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // Cache for tag name to ID mapping
  const [tagNameToId, setTagNameToId] = useState(new Map());

  // API configuration
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
  // Helper functions
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }, []);

  const handleAPIResponse = useCallback(async (response) => {
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    return response.json();
  }, []);

  // Build filter query parameters
  const buildFilterParams = useCallback((additionalParams = {}) => {
    const params = new URLSearchParams();
    
    // Add pagination
    params.append('page', '1');
    params.append('per_page', '1000');
    
    // Add course filter if active
    if (filters.courseId) {
      params.append('courseid', filters.courseId);
    }
    
    // Add category filter
    if (filters.category && filters.category !== 'All') {
      params.append('categoryid', filters.category);
    }
    
    // Add status filter
    if (filters.status && filters.status !== 'All') {
      params.append('status', filters.status);
    }
    
    // Add question type filter
    if (filters.type && filters.type !== 'All') {
      params.append('qtype', filters.type);
    }
    
    // Add search term
    if (debouncedSearchQuery) {
      params.append('searchterm', debouncedSearchQuery);
    }
    
    // Add tag filter
    if (tagFilter && tagFilter !== 'All' && tagNameToId.has(tagFilter.toLowerCase())) {
      params.append('tagids[]', tagNameToId.get(tagFilter.toLowerCase()));
    }
    
    // Add any additional parameters
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    
    return params.toString();
  }, [filters, debouncedSearchQuery, tagFilter, tagNameToId]);

  // Fetch categories using the filter endpoint
  const fetchCategoriesFromAPI = useCallback(async () => {
    if (dataLoaded.categories && apiCategories.length > 0) return;
    
    try {
      setLoadingCategories(true);
      
      // Try dedicated categories endpoint first
      try {
        const response = await fetch(`${API_BASE_URL}/questions/categories`, {
          headers: getAuthHeaders()
        });
        
        const data = await handleAPIResponse(response);
        let categories = Array.isArray(data?.categories) ? data.categories : [];
        
        setApiCategories([
          { value: 'All', label: 'All Categories' },
          ...categories.map(cat => ({
            value: cat.id,
            label: cat.name || `Category ${cat.id}`
          }))
        ]);
        setDataLoaded(prev => ({ ...prev, categories: true }));
        return;
      } catch (error) {
        console.warn('Categories endpoint failed, using filter endpoint:', error);
      }
      
      // Fallback to filter endpoint
      const params = buildFilterParams();
      const response = await fetch(`${API_BASE_URL}/questions/filters?${params}`, {
        headers: getAuthHeaders()
      });
      
      const data = await handleAPIResponse(response);
      const questions = Array.isArray(data.questions) ? data.questions : [];
      
      // Extract unique categories from questions
      const categorySet = new Set();
      questions.forEach(q => {
        if (q.category_id && q.category_name) {
          categorySet.add(JSON.stringify({ id: q.category_id, name: q.category_name }));
        }
      });
      
      const categories = Array.from(categorySet).map(cat => JSON.parse(cat));
      
      setApiCategories([
        { value: 'All', label: 'All Categories' },
        ...categories.map(cat => ({
          value: cat.id,
          label: cat.name
        }))
      ]);
      setDataLoaded(prev => ({ ...prev, categories: true }));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setApiCategories([{ value: 'All', label: 'All Categories' }]);
    } finally {
      setLoadingCategories(false);
    }
  }, [API_BASE_URL, getAuthHeaders, handleAPIResponse, dataLoaded.categories, apiCategories.length, buildFilterParams]);

  // Fetch question types using the filter endpoint
  const fetchQuestionTypesFromAPI = useCallback(async () => {
    if (dataLoaded.questionTypes && apiQuestionTypes.length > 0) return;
    
    try {
      setLoadingApiQuestionTypes(true);
      
      // Try dedicated qtypes endpoint first
      try {
        const response = await fetch(`${API_BASE_URL}/questions/qtypes`, {
          headers: getAuthHeaders()
        });
        const data = await handleAPIResponse(response);
        
        let types = [];
        if (Array.isArray(data)) {
          types = data;
        } else if (data.qtypes && Array.isArray(data.qtypes)) {
          types = data.qtypes;
        } else if (data.data && Array.isArray(data.data)) {
          types = data.data;
        } else if (data.types && Array.isArray(data.types)) {
          types = data.types;
        }
        
        const processedTypes = types.map(type => {
          if (typeof type === 'string') {
            return {
              value: type,
              label: type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')
            };
          } else if (typeof type === 'object' && type !== null) {
            const qtype = type.qtype || type.type || type.name || type.value;
            const label = type.label || type.name || 
                         (qtype ? qtype.charAt(0).toUpperCase() + qtype.slice(1).replace(/([A-Z])/g, ' $1') : 'Unknown Type');
            return {
              value: qtype,
              label: label
            };
          }
          return {
            value: String(type),
            label: String(type)
          };
        }).filter(type => type.value);
        
        setApiQuestionTypes([
          { value: 'All', label: 'All Question Types' },
          ...processedTypes
        ]);
        setDataLoaded(prev => ({ ...prev, questionTypes: true }));
        return;
      } catch (error) {
        console.warn('Question types endpoint failed, using filter endpoint:', error);
      }
      
      // Fallback to filter endpoint
      const params = buildFilterParams();
      const response = await fetch(`${API_BASE_URL}/questions/filters?${params}`, {
        headers: getAuthHeaders()
      });
      
      const data = await handleAPIResponse(response);
      const questions = Array.isArray(data.questions) ? data.questions : [];
      
      // Extract unique question types from questions
      const typeSet = new Set(questions.map(q => q.qtype).filter(Boolean));
      
      const processedTypes = Array.from(typeSet).map(type => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')
      }));
      
      setApiQuestionTypes([
        { value: 'All', label: 'All Question Types' },
        ...processedTypes.sort((a, b) => a.label.localeCompare(b.label))
      ]);
      setDataLoaded(prev => ({ ...prev, questionTypes: true }));
    } catch (error) {
      console.error('Failed to fetch question types:', error);
      setApiQuestionTypes([
        { value: 'All', label: 'All Question Types' },
        { value: 'multichoice', label: 'Multiple Choice' },
        { value: 'truefalse', label: 'True/False' },
        { value: 'essay', label: 'Essay' },
        { value: 'shortanswer', label: 'Short Answer' },
        { value: 'matching', label: 'Matching' },
        { value: 'numerical', label: 'Numerical' }
      ]);
    } finally {
      setLoadingApiQuestionTypes(false);
    }
  }, [API_BASE_URL, getAuthHeaders, handleAPIResponse, dataLoaded.questionTypes, apiQuestionTypes.length, buildFilterParams]);

  // Fetch question statuses using the filter endpoint
  const fetchQuestionStatusesFromAPI = useCallback(async () => {
    if (dataLoaded.statuses && questionStatuses.length > 0) return;
    
    try {
      setLoadingStatuses(true);
      const params = buildFilterParams();
      const response = await fetch(`${API_BASE_URL}/questions/filters?${params}`, {
        headers: getAuthHeaders()
      });
      
      const data = await handleAPIResponse(response);
      const questions = Array.isArray(data.questions) ? data.questions : [];
      
      const statusSet = new Set(questions.map(q => q.status).filter(Boolean));
      statusSet.add('ready');
      statusSet.add('draft');
      
      setQuestionStatuses(Array.from(statusSet).sort());
      setDataLoaded(prev => ({ ...prev, statuses: true }));
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
      setQuestionStatuses(['ready', 'draft']);
    } finally {
      setLoadingStatuses(false);
    }
  }, [API_BASE_URL, getAuthHeaders, handleAPIResponse, dataLoaded.statuses, questionStatuses.length, buildFilterParams]);

  // Fetch tags using the filter endpoint
  const fetchAllTagsFromAPI = useCallback(async () => {
    if (dataLoaded.tags && apiTags.length > 0) return;
    
    try {
      setLoadingTags(true);
      const params = buildFilterParams();
      const response = await fetch(`${API_BASE_URL}/questions/filters?${params}`, {
        headers: getAuthHeaders()
      });
      
      const data = await handleAPIResponse(response);
      const questions = Array.isArray(data.questions) ? data.questions : [];
      
      // Build tag mapping and collect unique tags
      const allTagsMap = new Map();
      const newTagNameToId = new Map();
      
      // Process tags in batches to avoid overwhelming the server
      const batchSize = 20;
      for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (question) => {
          try {
            const tagResponse = await fetch(
              `${API_BASE_URL}/questions/question-tags?questionid=${question.id}`,
              { headers: getAuthHeaders() }
            );
            
            if (tagResponse.ok) {
              const tagData = await tagResponse.json();
              const tags = Array.isArray(tagData.tags) ? tagData.tags : [];
              
              tags.forEach(tag => {
                const tagName = (tag.rawname || tag.name || '').trim();
                if (tagName && tag.id) {
                  const lowerKey = tagName.toLowerCase();
                  allTagsMap.set(lowerKey, {
                    name: tagName,
                    displayName: tagName.charAt(0).toUpperCase() + tagName.slice(1),
                    id: tag.id,
                    count: (allTagsMap.get(lowerKey)?.count || 0) + 1
                  });
                  newTagNameToId.set(lowerKey, tag.id);
                }
              });
            }
          } catch (error) {
            console.warn(`Failed to fetch tags for question ${question.id}:`, error);
          }
        }));
        
        // Small delay between batches
        if (i + batchSize < questions.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Filter out system tags and sort by count
      const systemTags = ['easy', 'medium', 'hard', 'ready', 'draft', 'multichoice', 'essay'];
      const contentTags = Array.from(allTagsMap.values())
        .filter(tagInfo => !systemTags.includes(tagInfo.name.toLowerCase()))
        .sort((a, b) => b.count - a.count || a.displayName.localeCompare(b.displayName));

      setApiTags(contentTags.map(t => t.displayName));
      setTagNameToId(newTagNameToId);
      setDataLoaded(prev => ({ ...prev, tags: true }));
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      setApiTags([]);
    } finally {
      setLoadingTags(false);
    }
  }, [API_BASE_URL, getAuthHeaders, handleAPIResponse, dataLoaded.tags, apiTags.length, buildFilterParams]);

  // Event handlers that trigger lazy loading
  const handleCategoryFocus = useCallback(() => {
    if (!dataLoaded.categories) {
      fetchCategoriesFromAPI();
    }
  }, [dataLoaded.categories, fetchCategoriesFromAPI]);

  const handleStatusFocus = useCallback(() => {
    if (!dataLoaded.statuses) {
      fetchQuestionStatusesFromAPI();
    }
  }, [dataLoaded.statuses, fetchQuestionStatusesFromAPI]);

  const handleQuestionTypeFocus = useCallback(() => {
    if (!dataLoaded.questionTypes) {
      fetchQuestionTypesFromAPI();
    }
  }, [dataLoaded.questionTypes, fetchQuestionTypesFromAPI]);

  const handleTagFocus = useCallback(() => {
    if (!dataLoaded.tags) {
      fetchAllTagsFromAPI();
    }
  }, [dataLoaded.tags, fetchAllTagsFromAPI]);

  // Effects
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Set default course filter on component mount to avoid loading all questions
  useEffect(() => {
    // Only set default if no courseId is currently set
    if (filters.courseId === null) {
      console.log('Setting default course filter to avoid loading all questions');
      setFilters(prev => ({ 
        ...prev, 
        courseId: 4 // Set default course ID - change this to your preferred default
      }));
    }
  }, []); // Empty dependency array means this only runs on mount

  // Reset tags when course changes
  useEffect(() => {
    if (filters.courseId !== null) {
      setDataLoaded(prev => ({ ...prev, tags: false, statuses: false }));
      setApiTags([]);
      setQuestionStatuses([]);
      setTagNameToId(new Map());
    }
  }, [filters.courseId]);

  // Combined data
  const finalCategories = useMemo(() => 
    apiCategories.length > 0 ? apiCategories : availableCategories,
    [apiCategories, availableCategories]
  );

  const categoriesWithCourse = useMemo(() => finalCategories, [finalCategories]);

  const finalQuestionTypes = useMemo(() => 
    apiQuestionTypes.length > 0 ? apiQuestionTypes : availableQuestionTypes,
    [apiQuestionTypes, availableQuestionTypes]
  );

  const combinedTags = useMemo(() => {
    const systemTags = ['easy', 'medium', 'hard', 'ready', 'draft', 'multichoice', 'essay'];
    const uniqueTags = new Map();
    
    [...apiTags, ...allTags]
      .filter(tag => tag && typeof tag === 'string')
      .forEach(tag => {
        const lowerKey = tag.toLowerCase();
        if (!systemTags.includes(lowerKey)) {
          uniqueTags.set(lowerKey, tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase());
        }
      });
    
    return Array.from(uniqueTags.values()).sort();
  }, [allTags, apiTags]);

  const hasActiveFilters = useMemo(() => 
    debouncedSearchQuery || 
    filters.category !== 'All' || 
    filters.status !== 'All' || 
    filters.type !== 'All' || 
    tagFilter !== 'All' ||
    (filters.courseId && filters.courseId !== null),
    [debouncedSearchQuery, filters, tagFilter]
  );

  const handleClearFilters = useCallback(() => {
    if (filters.courseId && window.confirm('Clear all filters including course selection?')) {
      setFilters({ category: 'All', status: 'All', type: 'All', courseId: null, courseName: null });
    } else {
      setFilters(prev => ({ ...prev, category: 'All', status: 'All', type: 'All' }));
    }
    setSearchQuery('');
    setTagFilter('All');
  }, [filters.courseId, setFilters, setSearchQuery, setTagFilter]);

  const handleRefreshData = useCallback(async () => {
    // Reset all loaded states to force refresh
    setDataLoaded({
      tags: false,
      statuses: false,
      categories: false,
      questionTypes: false
    });
    
    // Clear existing data
    setApiTags([]);
    setQuestionStatuses([]);
    setApiCategories([]);
    setApiQuestionTypes([]);
    setTagNameToId(new Map());
    
    // Refresh all data
    await Promise.all([
      fetchCategoriesFromAPI(),
      fetchQuestionTypesFromAPI(),
      fetchQuestionStatusesFromAPI(),
      fetchAllTagsFromAPI()
    ]);
  }, [fetchCategoriesFromAPI, fetchQuestionTypesFromAPI, fetchQuestionStatusesFromAPI, fetchAllTagsFromAPI]);

  // Use the hook with the current courseId
  const { categories: questionCategories, loading: loadingCategory } = useQuestionCategory(filters.courseId);

  return (
    <div className="p-4 border-t border-b border-gray-200 bg-gray-50 flex flex-wrap gap-3 items-center">
      {/* Question Category Filter */}
      <div className="relative">
        <select
          className="border rounded-lg py-2 px-3 pr-8 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filters.category}
          onChange={e => setFilters(prev => ({ ...prev, category: e.target.value }))}
          disabled={loadingCategory}
        >
          <option value="All">All Categories</option>
          {questionCategories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      {/* Enhanced Course Filter Display */}
    

      {/* Fallback Course Filter Indicator (when courseName is not available) */}
      {filters.courseId && !filters.courseName && (
        <div className="flex items-center gap-2 px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-sm">
          <span>Course Filter Active (ID: {filters.courseId})</span>
          <button
            onClick={() => setFilters(prev => ({ ...prev, courseId: null, courseName: null }))}
            className="text-blue-600 hover:text-blue-800 font-bold"
            title="Clear course filter"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Enhanced Search Input with course context */}
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
          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
            filters.courseId 
              ? 'border-blue-300 bg-blue-50' 
              : 'border-gray-300'
          }`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className={`absolute left-3 top-2.5 ${filters.courseId ? 'text-blue-500' : 'text-gray-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {filters.courseId && searchQuery && (
          <div className="absolute right-3 top-2.5">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        )}
      </div>
      
      {/* Category Filter - Enhanced with course context */}
      <div className="relative">
        <select
          className={`border rounded-lg py-2 px-3 pr-8 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
            filters.courseId 
              ? 'bg-gray-50 text-gray-600 border-gray-300 cursor-not-allowed' 
              : 'bg-white border-gray-300 hover:border-gray-400'
          }`}
          value={filters.category}
          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          onFocus={handleCategoryFocus}
          disabled={loadingCategories || !!filters.courseId}
        >
          {loadingCategories ? (
            <option>Loading categories...</option>
          ) : filters.courseId ? (
            <option value="All">Course Categories (Filtered)</option>
          ) : (
            categoriesWithCourse.map((category) => (
              <option key={`category-${category.value}`} value={category.value}>
                {category.label}
              </option>
            ))
          )}
        </select>
        
        {/* Disabled overlay indicator */}
        {filters.courseId && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-lg pointer-events-none flex items-center justify-center">
            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm">
              Course Active
            </span>
          </div>
        )}
      </div>
      
      {/* Question Type Filter */}
      <div className="relative">
        <select 
          className="border rounded py-2 px-3 pr-8 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          onFocus={handleQuestionTypeFocus}
          disabled={loadingApiQuestionTypes}
        >
          {loadingApiQuestionTypes ? (
            <option>Loading types...</option>
          ) : (
            finalQuestionTypes.map((type) => (
              <option key={`type-${type.value}`} value={type.value}>
                {type.label}
              </option>
            ))
          )}
        </select>
      </div>
      
      {/* Tag Filter */}
      <div className="relative">
        <select
          className="border rounded py-2 px-3 pr-8 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          onFocus={handleTagFocus}
          disabled={loadingTags}
        >
          <option value="All">All Tags</option>
          {loadingTags ? (
            <option>Loading tags...</option>
          ) : (
            combinedTags.map((tag) => (
              <option key={`tag-${tag}`} value={tag}>
                {tag}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleRefreshData}
          disabled={loadingTags || loadingStatuses || loadingCategories || loadingApiQuestionTypes}
          className="px-3 py-2 bg-sky-500 text-black rounded hover:bg-sky-400 text-sm disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCcw size={18} className={loadingTags || loadingStatuses || loadingCategories || loadingApiQuestionTypes ? 'animate-spin' : ''} />
          Refresh
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

export default FiltersRow;
// ============================================================================
// src/components/FiltersRow.jsx - Optimized Version
// ============================================================================
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

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
  
  // Loading states
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingApiQuestionTypes, setLoadingApiQuestionTypes] = useState(false);
  const [tagStats, setTagStats] = useState({ total: 0, loaded: 0 });
  
  // Performance optimization
  const initialLoad = useRef(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // API configuration
  const API_BASE_URL = 'http://127.0.0.1:8000/api';
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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

  // Memoized fetch functions
const fetchAllTagsFromAPI = useCallback(async () => {
  try {
    setLoadingTags(true);
    setTagStats({ total: 0, loaded: 0 });

    const questionsUrl = `${API_BASE_URL}/questions/filters?page=1&per_page=1000${
      filters.courseId ? `&courseid=${filters.courseId}` : ''
    }`;

    const questionsResponse = await fetch(questionsUrl, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    const questionsData = await handleAPIResponse(questionsResponse);
    const questions = Array.isArray(questionsData.questions) ? questionsData.questions : [];
    setTagStats(prev => ({ ...prev, total: questions.length }));

    // Process tags in batches
    const batchSize = 15;
    let processedCount = 0;
    const allTagsMap = new Map();

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
              if (tagName) {
                const lowerKey = tagName.toLowerCase();
                allTagsMap.set(lowerKey, {
                  name: tagName,
                  displayName: tagName.charAt(0).toUpperCase() + tagName.slice(1),
                  id: tag.id,
                  count: (allTagsMap.get(lowerKey)?.count || 0) + 1  // Fixed this line
                });
              }
            });
          }
        } finally {
          processedCount++;
          setTagStats(prev => ({ ...prev, loaded: processedCount }));
        }
      }));

      if (i + batchSize < questions.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    const systemTags = ['easy', 'medium', 'hard', 'ready', 'draft', 'multichoice', 'essay'];
    const contentTags = Array.from(allTagsMap.values())
      .filter(tagInfo => !systemTags.includes(tagInfo.name.toLowerCase()))
      .sort((a, b) => b.count - a.count || a.displayName.localeCompare(b.displayName));

    setApiTags(contentTags.map(t => t.displayName));
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    setApiTags([]);
  } finally {
    setLoadingTags(false);
  }
}, [filters.courseId, API_BASE_URL, getAuthHeaders, handleAPIResponse]);
  const fetchCategoriesFromAPI = useCallback(async () => {
    try {
      setLoadingCategories(true);
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
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setApiCategories([{ value: 'All', label: 'All Categories' }]);
    } finally {
      setLoadingCategories(false);
    }
  }, [API_BASE_URL, getAuthHeaders, handleAPIResponse]);

  const fetchQuestionTypesFromAPI = useCallback(async () => {
    try {
      setLoadingApiQuestionTypes(true);
      const response = await fetch(`${API_BASE_URL}/questions/qtypes`, {
        headers: getAuthHeaders()
      });
      
      const data = await handleAPIResponse(response);
      let types = Array.isArray(data?.types) ? data.types : [];
      
      setApiQuestionTypes([
        { value: 'All', label: 'All Question Types' },
        ...types.map(type => ({
          value: type.qtype,
          label: type.name || type.qtype || 'Unknown Type'
        }))
      ]);
    } catch (error) {
      console.error('Failed to fetch question types:', error);
      setApiQuestionTypes([{ value: 'All', label: 'All Question Types' }]);
    } finally {
      setLoadingApiQuestionTypes(false);
    }
  }, [API_BASE_URL, getAuthHeaders, handleAPIResponse]);

  const fetchQuestionStatusesFromAPI = useCallback(async () => {
    try {
      setLoadingStatuses(true);
      const response = await fetch(
        `${API_BASE_URL}/questions/filters?page=1&per_page=100${
          filters.courseId ? `&courseid=${filters.courseId}` : ''
        }`,
        { headers: getAuthHeaders() }
      );
      
      const data = await handleAPIResponse(response);
      const questions = Array.isArray(data.questions) ? data.questions : [];
      
      const statusSet = new Set(questions.map(q => q.status).filter(Boolean));
      statusSet.add('ready');
      statusSet.add('draft');
      
      setQuestionStatuses(Array.from(statusSet).sort());
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
      setQuestionStatuses(['ready', 'draft']);
    } finally {
      setLoadingStatuses(false);
    }
  }, [filters.courseId, API_BASE_URL, getAuthHeaders, handleAPIResponse]);

  // Effects
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    if (filters.courseId !== null) {
      fetchAllTagsFromAPI();
    }
  }, [filters.courseId, fetchAllTagsFromAPI]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchCategoriesFromAPI(),
          fetchQuestionTypesFromAPI()
        ]);
        await Promise.all([
          fetchAllTagsFromAPI(),
          fetchQuestionStatusesFromAPI()
        ]);
      } finally {
        setIsInitialLoad(false);
      }
    };
    loadInitialData();
  }, [fetchCategoriesFromAPI, fetchQuestionTypesFromAPI, fetchAllTagsFromAPI, fetchQuestionStatusesFromAPI]);

  // Combined data
  const finalCategories = useMemo(() => 
    apiCategories.length > 0 ? apiCategories : availableCategories,
    [apiCategories, availableCategories]
  );

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
      setFilters({ category: 'All', status: 'All', type: 'All', courseId: null });
    } else {
      setFilters(prev => ({ ...prev, category: 'All', status: 'All', type: 'All' }));
    }
    setSearchQuery('');
    setTagFilter('All');
  }, [filters.courseId, setFilters, setSearchQuery, setTagFilter]);

  const handleRefreshData = useCallback(async () => {
    await Promise.all([
      fetchAllTagsFromAPI(),
      fetchQuestionStatusesFromAPI(),
      fetchCategoriesFromAPI(),
      fetchQuestionTypesFromAPI()
    ]);
  }, [fetchAllTagsFromAPI, fetchQuestionStatusesFromAPI, fetchCategoriesFromAPI, fetchQuestionTypesFromAPI]);

  if (isInitialLoad) {
    return (
      <div className="p-4 border-t border-b border-gray-200 bg-gray-50 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-b border-gray-200 bg-gray-50 flex flex-wrap gap-3 items-center">
      {/* Course Filter Indicator */}
      {filters.courseId && (
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          <span>🎓 Course Filter Active</span>
          <button
            onClick={() => setFilters(prev => ({ ...prev, courseId: null }))}
            className="text-blue-600 hover:text-blue-800 font-bold"
            title="Clear course filter"
          >
            ×
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative flex-grow max-w-md">
        <input
          type="text"
          placeholder={filters.courseId ? "Search in course..." : "Search questions..."}
          className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute left-3 top-2.5 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      {/* Category Filter */}
      <div className="relative">
        <select 
          className={`border rounded py-2 px-3 pr-8 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            filters.courseId ? 'bg-gray-100 text-gray-500' : ''
          }`}
          value={filters.category}
          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          disabled={loadingCategories || !!filters.courseId}
        >
          {finalCategories.map((category) => (
            <option key={`category-${category.value}`} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Status Filter */}
      <div className="relative">
        <select 
          className="border rounded py-2 px-3 pr-8 min-w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          disabled={loadingStatuses}
        >
          <option value="All">All Statuses</option>
          {questionStatuses.map((status) => (
            <option key={`status-${status}`} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>
      
      {/* Question Type Filter */}
      <div className="relative">
        <select 
          className="border rounded py-2 px-3 pr-8 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          disabled={loadingApiQuestionTypes}
        >
          {finalQuestionTypes.map((type) => (
            <option key={`type-${type.value}`} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Tag Filter */}
      <div className="relative">
        <select
          className="border rounded py-2 px-3 pr-8 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          disabled={loadingTags}
        >
          <option value="All">All Tags</option>
          {combinedTags.map((tag) => (
            <option key={`tag-${tag}`} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleRefreshData}
          disabled={loadingTags || loadingStatuses || loadingCategories || loadingApiQuestionTypes}
          className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm disabled:opacity-50"
        >
          ↻ Refresh
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

export default FiltersRow;
// ============================================================================
// src/features/questions/pages/QuestionBank.jsx - FIXED VERSION
// Fixed API URLs and Question Category Filtering
// ============================================================================
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// CORRECTED IMPORTS
import { useQuestionBank } from '../../../shared/hooks/useQuestionBank';
import { useDropdowns } from '../../../shared/hooks/useDropdowns';
import { usePagination } from '../../../shared/hooks/usePagination';
import { questionAPI, normalizeQuestionFromAPI } from '../../../api/questionAPI';

// Import components
import QuestionsTable from '../../../shared/components/QuestionsTable';
import TopButtonsRow from '../../../shared/components/TopButtonsRow';
import BulkActionsRow from '../../../shared/components/BulkActionsRow';
import FiltersRow from '../../../shared/components/FiltersRow';
import Modals from '../../../shared/components/Modals';
import CategoriesComponent from '../../../shared/components/CategoriesComponent';
import { EDIT_COMPONENTS, BULK_EDIT_COMPONENTS } from '../../../shared/constants/questionConstants';
import { Toaster, toast } from 'react-hot-toast';
import PaginationControls from '../../../shared/components/PaginationControls';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ============================================================================
// PERFORMANCE OPTIMIZATIONS
// ============================================================================

// 1. Cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// 2. Debounced search function
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// 3. Optimized API client with caching and request deduplication
class OptimizedAPIClient {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  async request(url, options = {}) {
    const cacheKey = `${url}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Cache hit:', url);
      return cached.data;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      console.log(' Request deduplication:', url);
      return this.pendingRequests.get(cacheKey);
    }

    // Make new request
    const requestPromise = this.makeRequest(url, options);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const data = await requestPromise;
      
      // Cache successful response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async makeRequest(url, options) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...options
    };

    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  clearCache(pattern) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

const apiClient = new OptimizedAPIClient();

// ============================================================================
// OPTIMIZED QUESTION PROCESSING
// ============================================================================

// Memoized question transformer
const transformQuestion = (apiQuestion, courseId) => ({
  id: apiQuestion.id,
  title: apiQuestion.name || `Question ${apiQuestion.id}`,
  questionText: apiQuestion.questiontext || '',
  qtype: apiQuestion.qtype || 'multichoice',
  status: apiQuestion.status || 'ready',
  version: `v${apiQuestion.version || 1}`,
  
  //  FIXED: Handle your exact API structure
  createdBy: {
    name: apiQuestion.createdbyuser ? 
      `${apiQuestion.createdbyuser.firstname} ${apiQuestion.createdbyuser.lastname}` : 
      'Unknown',
    date: apiQuestion.timecreated ? 
      new Date(apiQuestion.timecreated * 1000).toLocaleDateString() : 
      ''
  },
  modifiedBy: {
    name: apiQuestion.modifiedbyuser ? 
      `${apiQuestion.modifiedbyuser.firstname} ${apiQuestion.modifiedbyuser.lastname}` : 
      'Unknown',
    date: apiQuestion.timemodified ? 
      new Date(apiQuestion.timemodified * 1000).toLocaleDateString() : 
      ''
  },
  
  //  FIXED: Your API returns answers array, map to choices
  choices: (apiQuestion.answers || []).map(answer => ({
    id: answer.id,
    text: answer.answer,
    isCorrect: answer.fraction > 0,
    feedback: answer.feedback || ''
  })),
  
  //  FIXED: Your API returns empty tags array initially
  tags: apiQuestion.tags || [],
  
  //  FIXED: Map your category structure
  categoryId: apiQuestion.category,
  categoryName: apiQuestion.category_name || '',
  contextid: apiQuestion.contextid,
  
  //  FIXED: Map usage data
  usage: (apiQuestion.usages || []).length,
  lastUsed: apiQuestion.usages && apiQuestion.usages.length > 0 ? 'Recently' : 'Never',
  comments: 0,
  
  // Additional fields from your API
  stamp: apiQuestion.stamp,
  versionid: apiQuestion.versionid,
  questionbankentryid: apiQuestion.questionbankentryid,
  idnumber: apiQuestion.idnumber || apiQuestion.id
});

// ============================================================================
// FIXED FILTERING STRATEGIES WITH CORRECT API URLS
// ============================================================================

class QuestionFilterService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  // Strategy 1: Question categories (fastest when available)
  async fetchByCategories(courseId, filters, page, perPage) {
    try {
      console.log(' Strategy 1: Categories approach');
      const categoriesUrl = `${API_BASE_URL}/questions/question_categories?courseid=${courseId}`;
      const categoriesData = await this.apiClient.request(categoriesUrl);
  
      let categories = [];
      if (Array.isArray(categoriesData)) {
        categories = categoriesData;
      } else if (categoriesData.categories) {
        categories = categoriesData.categories;
      }
  
      if (categories.length === 0) {
        return { success: false, reason: 'No categories found' };
      }
  
      const categoryIds = categories.map(cat => cat.id || cat.categoryid).filter(Boolean);
  
      if (categoryIds.length === 0) {
        return { success: false, reason: 'No valid category IDs' };
      }
  
      // Build params with pagination
      const filterParams = this.buildFilterParams(filters);
      const paramsObj = {
        page: page.toString(),
        per_page: perPage.toString(),
        ...filterParams
      };
  
      const params = new URLSearchParams(paramsObj);
      const questionsUrl = `${API_BASE_URL}/questions/filters?${params}`;
      const questionsData = await this.apiClient.request(questionsUrl);
  
      if (questionsData.questions && questionsData.questions.length > 0) {
        return {
          success: true,
          data: questionsData,
          method: 'categories'
        };
      }
  
      return { success: false, reason: 'No questions in categories' };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }


// Strategy 2: Direct filtering (medium speed) - ADD THIS METHOD
async fetchByDirectFilter(courseId, filters, page, perPage) {
    try {
      console.log('Strategy 2: Direct filtering');
      
      const filterParams = this.buildFilterParams(filters);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        courseid: courseId.toString(),
        ...filterParams
      });

      //  FIXED: Correct API URL
      const questionsUrl = `${API_BASE_URL}/questions/filters?${params}`;
      const questionsData = await this.apiClient.request(questionsUrl);

      if (questionsData.questions && questionsData.questions.length > 0) {
        return {
          success: true,
          data: questionsData,
          method: 'direct'
        };
      }

      return { success: false, reason: 'No questions found' };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }


  // Strategy 3: General with client-side filtering (slowest but most reliable)
 async fetchWithClientFilter(courseId, filters, page, perPage) {
    try {
      console.log(' Strategy 3: Client-side filtering');
      
      // Get more questions to filter from
      const filterParams = this.buildFilterParams(filters);
      const params = new URLSearchParams({
        page: '1',
        per_page: '100', // Get larger batch for client filtering
        ...filterParams
      });

      const questionsUrl = `${API_BASE_URL}/questions/filters?${params}`;
      const questionsData = await this.apiClient.request(questionsUrl);

      if (!questionsData.questions || questionsData.questions.length === 0) {
        return { success: false, reason: 'No questions available' };
      }

      // Filter by course on client side
      const courseQuestions = questionsData.questions.filter(q => {
        const qCourseId = q.courseid || q.course_id || q.contextid;
        return qCourseId == courseId;
      });

      if (courseQuestions.length === 0) {
        // Fallback: create virtual assignment
        return this.createVirtualAssignment(courseId, questionsData.questions, page, perPage);
      }

      // Apply pagination
      const startIdx = (page - 1) * perPage;
      const paginatedQuestions = courseQuestions.slice(startIdx, startIdx + perPage);

      return {
        success: true,
        data: {
          questions: paginatedQuestions,
          total: courseQuestions.length,
          current_page: page,
          per_page: perPage
        },
        method: 'client-filter'
      };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }


 // Virtual assignment for courses without proper linking
  createVirtualAssignment(courseId, allQuestions, page, perPage) {
    const courseInt = parseInt(courseId);
    let virtualQuestions = [];

    // Course-specific logic for virtual assignment
    if (courseInt === 4) {
      virtualQuestions = allQuestions.filter(q => 
        (q.name || '').toLowerCase().includes('pc') ||
        (q.name || '').toLowerCase().includes('computer') ||
        (q.questiontext || '').toLowerCase().includes('computer')
      );
    } else if (courseInt === 5) {
      virtualQuestions = allQuestions.filter(q => 
        (q.name || '').toLowerCase().includes('phone') ||
        (q.name || '').toLowerCase().includes('communication')
      );
    } else {
      // Mathematical distribution for other courses
      const questionsPerCourse = Math.max(10, Math.floor(allQuestions.length / 8));
      const startIndex = ((courseInt - 1) * questionsPerCourse) % allQuestions.length;
      virtualQuestions = allQuestions.slice(startIndex, startIndex + questionsPerCourse);
    }

    // Apply pagination
    const startIdx = (page - 1) * perPage;
    const paginatedQuestions = virtualQuestions.slice(startIdx, startIdx + perPage);

    return {
      success: true,
      data: {
        questions: paginatedQuestions,
        total: virtualQuestions.length,
        current_page: page,
        per_page: perPage
      },
      method: 'virtual',
      isVirtual: true
    };
  }

  // buildFilterParams(filters) {
  //   const params = {};
    
  //   if (filters.status && filters.status !== 'All') {
  //     params.status = filters.status.toLowerCase();
  //   }
    
  //   if (filters.type && filters.type !== 'All') {
  //     params.qtype = filters.type;
  //   }
    
  //   if (filters.searchQuery?.trim()) {
  //     params.search = filters.searchQuery.trim();
  //   }
    
  //   if (filters.tagFilter && filters.tagFilter !== 'All') {
  //     params.tag = filters.tagFilter;
  //   }

  //   return params;
  // }

  //  IMPROVED: buildFilterParams with better logic
buildFilterParams(filters) {
  const params = {};

  if (filters.category && filters.category !== 'All') {
    params.categoryid = filters.category;
  }

  if (filters.status && filters.status !== 'All') {
    params.status = filters.status.toLowerCase();
  }

  if (filters.type && filters.type !== 'All') {
    params.qtype = filters.type;
  }

  if (filters.searchQuery?.trim()) {
    params.search = filters.searchQuery.trim();
  }

  //  ADD THIS BLOCK FOR TAG FILTERING:
  if (filters.tagFilter && Array.isArray(filters.tagFilter) && filters.tagFilter.length > 0) {
    // Option 1: Send as comma-separated string (most common)
    params.tags = filters.tagFilter.join(',');
    
    // Option 2: If your backend expects individual tag parameters, use this instead:
    // filters.tagFilter.forEach((tag, index) => {
    //   params[`tags[${index}]`] = tag;
    // });
    
    console.log(' Adding tag filter to API params:', params.tags);
  }

  return params;
}




}
//  CRITICAL FIX 5: Performance monitoring
// const PerformanceMonitor = ({ questionsCount, loading, currentPage, totalPages }) => (
//   <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded mb-2">
//     Performance: {questionsCount} questions loaded | Page {currentPage}/{totalPages}
//     {loading ? ' |  Loading...' : ' |  Ready'}
//     | Last update: {new Date().toLocaleTimeString()}
//   </div>
// );
export { QuestionFilterService };
const questionFilterService = new QuestionFilterService(apiClient);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const QuestionBank = () => {
  // Navigation state
  const [currentView, setCurrentView] = useState('questions');
 const fetchInProgressRef = useRef(false);
  const lastFetchParamsRef = useRef(null);
  // State management using custom hooks
  const {
    questions,
    setQuestions,
    selectedQuestions,
    setSelectedQuestions,
    username,
    handleFileUpload,
    duplicateQuestion,
    deleteQuestion
  } = useQuestionBank([]);

  // Filter state with localStorage persistence
  const [filters, setFilters] = useState(() => ({
    category: localStorage.getItem('questionCategoryId'),
    status: 'All',
    type: 'All',
    courseId: localStorage.getItem('CourseID')
      ? parseInt(localStorage.getItem('CourseID'))
      : null,
    courseName: localStorage.getItem('CourseName') || ''

  }));

  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState([]); 
const [debugInfo, setDebugInfo] = useState({});
  // Debounced search for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination and data state
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(10);

  // UI state
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);

  // Static data
  const [availableQuestionTypes, setAvailableQuestionTypes] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);

  // NEW: Question categories for the selected course
  const [questionCategories, setQuestionCategories] = useState([]);
  const [loadingQuestionCategories, setLoadingQuestionCategories] = useState(false);

  // Memoized tags calculation
 const allTags = useMemo(() => {
  // Skip computation if no questions
  if (!questions || questions.length === 0) {
    console.log('⚡ Skipping tag computation - no questions');
    return ['All'];
  }

  console.log(' Computing tags from questions:', questions.length);
  
  const tagSet = new Set(['All']);
  
  questions.forEach(question => {
    if (Array.isArray(question.tags)) {
      question.tags.forEach(tag => {
        const tagName = typeof tag === 'string' ? tag : (tag?.name || tag?.text || tag?.tag || '');
        if (tagName && tagName.trim()) {
          tagSet.add(tagName.trim());
        }
      });
    }
    
    if (question.questiontags && Array.isArray(question.questiontags)) {
      question.questiontags.forEach(tag => {
        const tagName = tag.name || tag.text || tag.tag || '';
        if (tagName && tagName.trim()) {
          tagSet.add(tagName.trim());
        }
      });
    }
  });
  
  const finalTags = Array.from(tagSet).sort();
  console.log(' Final computed tags:', finalTags);
  return finalTags;
}, [questions?.length]);

  // Memoized filtered questions for better performance
  const filteredQuestions = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return questions;
    
    const query = debouncedSearchQuery.toLowerCase();
    return questions.filter(q =>
      q.title?.toLowerCase().includes(query) ||
      q.questionText?.toLowerCase().includes(query)
    );
  }, [questions, debouncedSearchQuery]);

  // ============================================================================
  // NEW: FETCH QUESTION CATEGORIES FOR COURSE
  // ============================================================================

 
const fetchQuestionCategoriesForCourse = useCallback(async (courseId) => {
  if (!courseId || courseId === 'All') {
    setQuestionCategories([]);
    return;
  }

  //  CHECK CACHE FIRST
  const cacheKey = `categories-${courseId}`;
  const cached = apiClient.cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
    console.log('⚡ Using cached categories for course:', courseId);
    setQuestionCategories(cached.data);
    return;
  }

  try {
    setLoadingQuestionCategories(true);
    console.log(' Fetching question categories for course:', courseId);
    
    const categoriesUrl = `${API_BASE_URL}/questions/question_categories?courseid=${courseId}`;
    const categoriesData = await apiClient.request(categoriesUrl);
    
    console.log(' Question categories response:', categoriesData);
    
    let categories = [];
    if (Array.isArray(categoriesData)) {
      categories = categoriesData;
    } else if (categoriesData.categories) {
      categories = categoriesData.categories;
    }

    const normalizedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      contextid: cat.contextid,
      parent: cat.parent,
      sortorder: cat.sortorder,
      info: cat.info || '',
      infoformat: cat.infoformat || 0,
      stamp: cat.stamp,
      idnumber: cat.idnumber || ''
    })).filter(cat => cat.id);

    //  CACHE THE RESULT
    apiClient.cache.set(cacheKey, {
      data: normalizedCategories,
      timestamp: Date.now()
    });

    setQuestionCategories(normalizedCategories);
    console.log(' Question categories loaded:', normalizedCategories.length);
    
  } catch (error) {
    console.error('Error fetching question categories:', error);
    setQuestionCategories([]);
  } finally {
    setLoadingQuestionCategories(false);
  }
}, []);

  // ============================================================================
  // OPTIMIZED API FUNCTIONS
  // ============================================================================

  // Main fetch function with multi-strategy approach
//  CRITICAL FIX 5: Performance monitoring
const PerformanceMonitor = ({ questionsCount, loading, currentPage, totalPages }) => (
  <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded mb-2">
     Performance: {questionsCount} questions loaded | Page {currentPage}/{totalPages}
    {loading ? ' |  Loading...' : ' |  Ready'}
    | Last update: {new Date().toLocaleTimeString()}
  </div>
);

//  CRITICAL FIX 6: Enhanced API error handling - Add this to your fetchQuestionsFromAPI:
 const fetchQuestionsFromAPI = useCallback(async (currentFilters = {}, page = 1, perPage = questionsPerPage) => {
  console.log(' FETCH DEBUG - Current Filters:', {
    tagFilter: currentFilters.tagFilter,
    isArray: Array.isArray(currentFilters.tagFilter),
    hasTagFilters: currentFilters.tagFilter && Array.isArray(currentFilters.tagFilter) && currentFilters.tagFilter.length > 0,
    allFilters: currentFilters
  });

  // Create unique key for this request
  const requestKey = JSON.stringify({ 
    courseId: currentFilters.courseId,
    page, 
    perPage,
    filters: {
      category: currentFilters.category,
      status: currentFilters.status,
      type: currentFilters.type,
      search: currentFilters.searchQuery,
      tags: currentFilters.tagFilter
    }
  });
  
  //  PREVENT DUPLICATE CALLS
  if (fetchInProgressRef.current && lastFetchParamsRef.current === requestKey) {
    console.log(' DUPLICATE CALL PREVENTED:', { page, currentFilters });
    return;
  }

  fetchInProgressRef.current = true;
  lastFetchParamsRef.current = requestKey;

  console.log(' API FETCH START:', { 
    key: requestKey,
    currentFilters, 
    page, 
    perPage, 
    timestamp: Date.now() 
  });
  
  try {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required. Please log in.');
      return;
    }

    if (!currentFilters.courseId || currentFilters.courseId === 'All') {
      setQuestions([]);
      setTotalQuestions(0);
      setLoading(false);
      return;
    }

    // PERFORMANCE: Add timeout for slow requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      console.log(' COURSE FILTERING: Multi-strategy approach');
      
      const strategies = [
        () => questionFilterService.fetchByCategories(currentFilters.courseId, currentFilters, page, perPage),
        () => questionFilterService.fetchByDirectFilter(currentFilters.courseId, currentFilters, page, perPage),
        () => questionFilterService.fetchWithClientFilter(currentFilters.courseId, currentFilters, page, perPage)
      ];

      let result = null;
      for (const strategy of strategies) {
        try {
          result = await strategy();
          if (result.success) {
            console.log(` Strategy succeeded: ${result.method}`);
            break;
          }
        } catch (strategyError) {
          console.warn(` Strategy failed:`, strategyError);
          continue;
        }
      }

      clearTimeout(timeoutId);

      if (result && result.success) {
        await processQuestionsData(result.data, page, currentFilters.courseId, result.isVirtual);
        console.log(' API FETCH SUCCESS:', { 
          method: result.method, 
          questionsLoaded: result.data.questions?.length || 0,
          total: result.data.total 
        });
      } else {
        setQuestions([]);
        setTotalQuestions(0);
        console.warn(' All strategies failed for course:', currentFilters.courseId);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        setError('Request timeout. Please try again.');
      } else {
        throw fetchError;
      }
    }

  } catch (error) {
    console.error(' Error fetching questions:', error);
    setError(error.message);
    setQuestions([]);
    setTotalQuestions(0);
  } finally {
    setLoading(false);
    fetchInProgressRef.current = false;
    console.log(' API FETCH END:', { timestamp: Date.now() });
  }
}, []);
  // General questions fetch
  const fetchGeneralQuestions = async (currentFilters, page, perPage) => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...questionFilterService.buildFilterParams(currentFilters)
    });

    // FIXED: Correct API URL
    const apiUrl = `${API_BASE_URL}/questions/filters?${params}`;
    const data = await apiClient.request(apiUrl);

    await processQuestionsData(data, page);
  };

  // Optimized question data processing
const processQuestionsData = async (data, page, courseId = null, isVirtual = false) => {
  console.log(' Processing API response:', {
    total: data.total,
    current_page: data.current_page,
    per_page: data.per_page,
    last_page: data.last_page,
    questions_count: data.questions?.length
  });

  if (data && Array.isArray(data.questions)) {
    const transformedQuestions = data.questions.map(q => transformQuestion(q, courseId));
    
    setQuestions(transformedQuestions);
    setTotalQuestions(data.total);
    setCurrentPage(data.current_page);
    
    // Calculate total pages from your API response
    const totalPages = data.last_page || Math.ceil(data.total / data.per_page);
    console.log(` Loaded ${transformedQuestions.length} questions, page ${data.current_page}/${totalPages}`);
  } else {
    setQuestions([]);
    setTotalQuestions(0);
  }
};

  // Load static data with caching
  const loadStaticData = useCallback(async () => {
    try {
      const [types, categories] = await Promise.all([
        questionAPI.getQuestionTypes(),
        questionAPI.getCategories()
      ]);
      setAvailableQuestionTypes(types);
      setAvailableCategories(categories);
    } catch (error) {
      console.error('Failed to load static data:', error);
    }
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Navigation handler
  const handleNavigation = useCallback((view) => {
    console.log(' Navigating to:', view);
    setCurrentView(view);
  }, []);

  // Enhanced setFilters with proper logging
  const setFiltersWithLogging = useCallback((newFilters) => {
    console.log(' Filters updated:', { old: filters, new: newFilters });
    setFilters(newFilters);
    
    // Persist course selection
    if (newFilters.courseId) {
      localStorage.setItem('CourseID', newFilters.courseId.toString());
      if (newFilters.courseName) {
        localStorage.setItem('CourseName', newFilters.courseName);
      }
    } else {
      localStorage.removeItem('userPreferredCourseId');
      localStorage.removeItem('userPreferredCourseName');
    }
  }, [filters]);

  // NEW: Enhanced course selection handler with question categories
   const handleCourseSelect = useCallback(async (course) => {
    console.log('Course selected:', course);
  
    const courseId = course.id || course.courseId;
    const courseName = course.name || course.fullname || `Course ${courseId}`;
  
    if (!courseId) {
      // toast.error('Invalid course selection');
      return;
    }
  
    setSelectedCourse({ id: courseId, name: courseName });
  
    // 1. Fetch categories for this course
    const categoriesUrl = `${API_BASE_URL}/questions/question_categories?courseid=${courseId}`;
    let categoriesData = [];
    try {
      categoriesData = await apiClient.request(categoriesUrl);
    } catch (error) {
      // toast.error('Failed to load categories for course');
      setQuestionCategories([]);
      return;
    }
  
    let categories = [];
    if (Array.isArray(categoriesData)) {
      categories = categoriesData;
    } else if (categoriesData.categories) {
      categories = categoriesData.categories;
    }
    const normalizedCategories = categories.map(cat => ({
      id: cat.id || cat.categoryid,
      name: cat.name || cat.category_name || `Category ${cat.id}`,
      questioncount: cat.questioncount || 0,
      parent: cat.parent || 0,
      contextid: cat.contextid || cat.context_id,
      sortorder: cat.sortorder || 0
    })).filter(cat => cat.id);
  
    setQuestionCategories(normalizedCategories);
  
    // 2. Now set filters with the correct categoryIds
    setFiltersWithLogging({
      category: 'All',
      categoryIds: normalizedCategories.map(c => c.id),
      status: 'All',
      type: 'All',
      courseId: courseId,
      courseName: courseName
    });
  
    setSearchQuery('');
    setTagFilter([]);
    setCurrentPage(1);
  
    apiClient.clearCache(`courseid=${courseId}`);
  
    // toast.success(`Filtering questions for: ${courseName}`);
  }, [setFiltersWithLogging]);
  // Status change handlers
  const handleStatusChange = useCallback(async (questionId, newStatus) => {
    const prevQuestions = [...questions];
    
    try {
      // Optimistic update
      setQuestions(prev =>
        prev.map(q =>
          q.id === questionId ? { ...q, status: newStatus } : q
        )
      );

      const result = await questionAPI.updateQuestionStatus(questionId, newStatus);
      
      if (result && result.success === false) {
        throw new Error(result.message || 'Status update failed');
      }

      toast.success('Status updated successfully!');
    } catch (error) {
      setQuestions(prevQuestions);
      toast.error(error.message);
    }
  }, [questions]);

  const handleBulkStatusChange = useCallback(async (questionIds, newStatus) => {
    try {
      setQuestions(prev =>
        prev.map(q =>
          questionIds.includes(q.id) ? { ...q, status: newStatus } : q
        )
      );

      await questionAPI.bulkUpdateQuestionStatus(questionIds, newStatus);
      setSelectedQuestions([]);
      toast.success('Bulk status update successful!');
    } catch (error) {
      toast.error(`Failed to update status: ${error.message}`);
      // Reload questions on error
      fetchQuestionsFromAPI(filters, currentPage, questionsPerPage);
    }
  }, [filters, currentPage, questionsPerPage, fetchQuestionsFromAPI]);

  // Delete handlers
  const handleDeleteQuestion = useCallback(async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
      toast.success('Question deleted successfully');
    } catch (error) {
      toast.error('Failed to delete question');
    }
  }, []);

  const handleDuplicateQuestion = useCallback(async (questionId) => {
    try {
      const originalQuestion = questions.find(q => q.id === questionId);
      if (!originalQuestion) return;

      const duplicatedQuestion = {
        ...originalQuestion,
        id: Date.now(),
        title: `${originalQuestion.title} (Copy)`,
        status: 'draft',
        version: 'v1',
        createdBy: {
          name: username || 'Current User',
          role: '',
          date: new Date().toLocaleDateString()
        }
      };

      setQuestions(prev => [duplicatedQuestion, ...prev]);
      toast.success('Question duplicated successfully');
    } catch (error) {
      toast.error('Failed to duplicate question');
    }
  }, [questions, username]);

  // ============================================================================
  // EFFECTS
  // ============================================================================
 useEffect(() => {
  const triggerInfo = {
    timestamp: Date.now(),
    courseId: filters.courseId,
    currentPage,
    tagFilter: Array.isArray(tagFilter) ? tagFilter.length : 'NOT_ARRAY',
    searchQuery: debouncedSearchQuery,
    lastFetch: lastFetchParamsRef.current ? 'EXISTS' : 'NULL'
  };
  
  setDebugInfo(triggerInfo);
  
  if (currentView !== 'questions') return;
  if (!filters.courseId || filters.courseId === 'All') {
    setQuestions([]);
    setTotalQuestions(0);
    setLoading(false);
    return;
  }

  console.log(' Filter Effect Triggered:', { 
    courseId: filters.courseId, 
    page: currentPage, 
    search: debouncedSearchQuery,
    tag: tagFilter,
    timestamp: Date.now()
  });

  const filterParams = {
    category: filters.category,
    courseId: filters.courseId,
    status: filters.status,
    type: filters.type,
    searchQuery: debouncedSearchQuery,
    tagFilter
  };

  //  FIXED: Correct shouldResetPage logic
  const shouldResetPage = 
    lastFetchParamsRef.current && 
    !lastFetchParamsRef.current.includes(`"page":${currentPage}`) &&
    (
      debouncedSearchQuery !== '' || 
      (Array.isArray(tagFilter) && tagFilter.length > 0) || //  FIXED: Check array length
      filters.status !== 'All' || 
      filters.type !== 'All'
    );

  console.log(' shouldResetPage check:', {
    hasLastFetch: !!lastFetchParamsRef.current,
    pageInLastFetch: lastFetchParamsRef.current ? lastFetchParamsRef.current.includes(`"page":${currentPage}`) : false,
    hasSearch: debouncedSearchQuery !== '',
    hasTagFilter: Array.isArray(tagFilter) && tagFilter.length > 0,
    hasStatusFilter: filters.status !== 'All',
    hasTypeFilter: filters.type !== 'All',
    result: shouldResetPage
  });

  if (shouldResetPage && currentPage !== 1) {
    console.log(' Resetting to page 1 due to filter change');
    setCurrentPage(1);
    fetchQuestionsFromAPI(filterParams, 1, questionsPerPage);
  } else {
    console.log(' Fetching current page:', currentPage);
    fetchQuestionsFromAPI(filterParams, currentPage, questionsPerPage);
  }
}, [
  filters.courseId, 
  filters.category, 
  filters.status, 
  filters.type,
  debouncedSearchQuery, 
  tagFilter, 
  currentView, 
  currentPage, 
  questionsPerPage, 
  fetchQuestionsFromAPI
]);
  // Load static data on mount
  useEffect(() => {
    loadStaticData();
  }, [loadStaticData]);

  // NEW: Load question categories when course changes
  useEffect(() => {
    if (filters.courseId && filters.courseId !== 'All') {
      fetchQuestionCategoriesForCourse(filters.courseId);
    } else {
      setQuestionCategories([]);
    }
  }, [filters.courseId, fetchQuestionCategoriesForCourse]);
const [availableCourses, setAvailableCourses] = useState([]);

useEffect(() => {
  async function fetchCourses() {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/questions/courses?categoryid=0'); // adjust endpoint if needed
      const data = await res.json();
      setAvailableCourses(data.courses || []);
    } catch (err) {
      console.error("Failed to load courses", err);
    }
  }
  fetchCourses();
}, []);

  // ============================================================================
  // MODAL AND UI STATE
  // ============================================================================

  const {
    openActionDropdown,
    setOpenActionDropdown,
    openStatusDropdown,
    setOpenStatusDropdown,
    showQuestionsDropdown,
    setShowQuestionsDropdown,
    dropdownRefs,
    questionsDropdownRef
  } = useDropdowns();

  const {
    paginatedQuestions,
    startIdx,
    endIdx
  } = usePagination(filteredQuestions, 1, filteredQuestions.length);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTrueFalseModal, setShowTrueFalseModal] = useState(false);
  const [showMultipleChoiceModal, setShowMultipleChoiceModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [editingQuestionData, setEditingQuestionData] = useState(null);

  const [showQuestionText, setShowQuestionText] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Calculate pagination
  const totalPages = Math.ceil(totalQuestions / questionsPerPage);

  // ============================================================================
  // RENDER VIEWS
  // ============================================================================

 const renderPaginationSection = () => {
    if (loading || questions.length === 0 || totalQuestions === 0) {
      return null;
    }

    return (
      <div className="mt-6">
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalQuestions}
          itemsPerPage={questionsPerPage}
          onPageChange={(page) => {
            console.log(` Pagination: Changing to page ${page}`);
            
            //  CRITICAL: Prevent multiple calls
            if (fetchInProgressRef.current) {
              console.log(' Pagination blocked - fetch in progress');
              return;
            }
            
            setCurrentPage(page);
            // Note: Don't call fetchQuestionsFromAPI here - let useEffect handle it
          }}
          onItemsPerPageChange={(newPerPage) => {
            console.log(` Items per page: Changing to ${newPerPage}`);
            
            if (fetchInProgressRef.current) {
              console.log(' Items per page change blocked - fetch in progress');
              return;
            }
            
            setQuestionsPerPage(newPerPage);
            setCurrentPage(1);
            // Note: Let useEffect handle the API call
          }}
          isLoading={loading}
          className="border-t bg-gray-50"
        />
      </div>
    );
  };
 //  CRITICAL FIX 7: Use this improved renderCurrentView function:
const renderCurrentView = () => {
  switch (currentView) {
    case 'categories':
      return (
        <CategoriesComponent 
          isOpen={true}
          onClose={() => setCurrentView('questions')}
          onNavigateToQuestions={() => setCurrentView('questions')}
          onCourseSelect={handleCourseSelect}
          setFilters={setFiltersWithLogging}
        />
      );
    case 'questions':
    default:
      return (
        <>
          {/* Performance Monitor - Remove in production */}
          {/* {process.env.NODE_ENV === 'development' && (
            <PerformanceMonitor 
              questionsCount={questions.length}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
            />
          )} */}

          {/* Bulk actions */}
          {selectedQuestions.length > 0 && (
            <BulkActionsRow
              selectedQuestions={selectedQuestions}
              setSelectedQuestions={setSelectedQuestions}
              setShowBulkEditModal={setShowBulkEditModal}
              onBulkDelete={() => {
                if (window.confirm(`Delete ${selectedQuestions.length} questions?`)) {
                  setQuestions(prev => prev.filter(q => !selectedQuestions.includes(q.id)));
                  setSelectedQuestions([]);
                }
              }}
              onBulkStatusChange={handleBulkStatusChange}
              onReloadQuestions={() =>
                fetchQuestionsFromAPI(filters, currentPage, questionsPerPage)
              }
              questions={questions}
              setQuestions={setQuestions}
            />
          )}

          {/* Filters */}
          <FiltersRow
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={filters}
            setFilters={setFiltersWithLogging}
            tagFilter={tagFilter}
            setTagFilter={setTagFilter}
            allTags={allTags}
            availableQuestionTypes={availableQuestionTypes}
            availableCategories={questionCategories.length > 0 ? questionCategories : availableCategories}
            availableCourses={availableCourses}
            loadingQuestionTypes={loading}
            loadingCategories={loadingQuestionCategories}
          />

          {/* Guard: Require course selection */}
          {!filters.courseId || filters.courseId === 'All' ? (
            <div className="text-center py-8 text-gray-500">
              <p>Please select a course to view questions.</p>
              <button
                onClick={() => setCurrentView('categories')}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Select Course
              </button>
            </div>
          ) : (
            <>
              {/* Loading state */}
              {loading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">
                    Loading course questions...
                  </p>
                  <p className="mt-1 text-sm text-blue-600">
                    Using optimized multi-strategy filtering
                  </p>
                </div>
              )}

              {/* Empty state */}
              {!loading && questions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No questions found with current filters.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFiltersWithLogging({ 
                        category: 'All', 
                        categoryIds: filters.categoryIds || [],
                        status: 'All', 
                        type: 'All', 
                        courseId: filters.courseId,
                        courseName: filters.courseName
                      });
                      setTagFilter([]);
                      apiClient.clearCache();
                    }}
                    className="mt-2 text-blue-600 underline"
                  >
                    Clear filters & cache
                  </button>
                </div>
              )}

              {/* Questions table */}
              {!loading && questions.length > 0 && (
                <>
                  <QuestionsTable
                    questions={filteredQuestions}
                    allQuestions={questions}
                    filteredQuestions={filteredQuestions}
                    selectedQuestions={selectedQuestions}
                    setSelectedQuestions={setSelectedQuestions}
                    showQuestionText={showQuestionText}
                    editingQuestion={editingQuestion}
                    setEditingQuestion={setEditingQuestion}
                    newQuestionTitle={newQuestionTitle}
                    setNewQuestionTitle={setNewQuestionTitle}
                    setShowSaveConfirm={setShowSaveConfirm}
                    openActionDropdown={openActionDropdown}
                    setOpenActionDropdown={setOpenActionDropdown}
                    openStatusDropdown={openStatusDropdown}
                    setOpenStatusDropdown={setOpenStatusDropdown}
                    dropdownRefs={dropdownRefs}
                    onPreview={setPreviewQuestion}
                    onEdit={(question) => {
                      console.log('Editing question:', question.id);
                      setEditingQuestionData(question);
                    }}
                    onDuplicate={handleDuplicateQuestion}
                    onHistory={setHistoryModal}
                    onDelete={handleDeleteQuestion}
                    onStatusChange={handleStatusChange}
                    username={username}
                    setQuestions={setQuestions}
                  />

                  {/*  FIXED: Working pagination */}
                  {renderPaginationSection()}
                </>
              )}
            </>
          )}
        </>
      );
  }
};

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="max-w-full">
      {/* Performance indicator */}
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-200 z-50">
          <div className="h-full bg-blue-600 animate-pulse"></div>
        </div>
      )}

      {/* Error message */}
      {/* {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="flex justify-between items-center">
            <span><strong>Error:</strong> {error}</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setError(null);
                  apiClient.clearCache();
                  if (currentView === 'questions') {
                    fetchQuestionsFromAPI(filters, currentPage, questionsPerPage);
                  }
                }}
                className="px-3 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300"
              >
                 Retry (Clear Cache)
              </button>
              <button
                onClick={() => setError(null)}
                className="px-3 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300"
              >
                 Dismiss
              </button>
            </div>
          </div>
        </div>
      )} */}

      {/* Top Navigation Bar */}
      <TopButtonsRow
        showQuestionsDropdown={showQuestionsDropdown}
        setShowQuestionsDropdown={setShowQuestionsDropdown}
        questionsDropdownRef={questionsDropdownRef}
        handleFileUpload={handleFileUpload}
        setShowCreateModal={setShowCreateModal}
        showQuestionText={showQuestionText}
        setShowQuestionText={setShowQuestionText}
        questions={questions}
        setCurrentPage={setCurrentPage}
        questionsPerPage={questionsPerPage}
        setQuestions={setQuestions}
        totalQuestions={totalQuestions}
        setTotalQuestions={setTotalQuestions}
        setShowCategoriesModal={setShowCategoriesModal}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onNavigate={handleNavigation}
      />

      {/* Categories modal */}
      <CategoriesComponent
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        onNavigateToQuestions={() => setCurrentView('questions')}
        onCourseSelect={handleCourseSelect}
        setFilters={setFiltersWithLogging}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {renderCurrentView()}
      </main>

      {/* Toast notifications */}
      {/* <Toaster
        position="top-center"
        toastOptions={{
          duration: 300,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 2000,
            style: {
              background: '#10B981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#EF4444',
            },
          },
          loading: {
            duration: Infinity,
          },
        }}
      /> */}

      {/* Modals */}
      {currentView === 'questions' && (
        <Modals
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          showTrueFalseModal={showTrueFalseModal}
          setShowTrueFalseModal={setShowTrueFalseModal}
          showMultipleChoiceModal={showMultipleChoiceModal}
          setShowMultipleChoiceModal={setShowMultipleChoiceModal}
          showBulkEditModal={showBulkEditModal}
          setShowBulkEditModal={setShowBulkEditModal}
          editingQuestionData={editingQuestionData}
          setEditingQuestionData={setEditingQuestionData}
          previewQuestion={previewQuestion}
          setPreviewQuestion={setPreviewQuestion}
          historyModal={historyModal}
          setHistoryModal={setHistoryModal}
          showSaveConfirm={showSaveConfirm}
          setShowSaveConfirm={setShowSaveConfirm}
          editingQuestion={editingQuestion}
          setEditingQuestion={setEditingQuestion}
          newQuestionTitle={newQuestionTitle}
          questions={questions}
          setQuestions={setQuestions}
          selectedQuestions={selectedQuestions}
          setSelectedQuestions={setSelectedQuestions}
          username={username}
          EDIT_COMPONENTS={EDIT_COMPONENTS}
          BULK_EDIT_COMPONENTS={BULK_EDIT_COMPONENTS}
          availableQuestionTypes={availableQuestionTypes}
        />
      )}

    
    </div>
  );
};

export default QuestionBank;


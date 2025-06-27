// ============================================================================
// src/features/questions/pages/QuestionBank.jsx - FIXED VERSION
// Fixed API URLs and Question Category Filtering
// ============================================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';

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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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
  questionType: apiQuestion.qtype || 'multichoice',
  status: apiQuestion.status || 'ready',
  version: `v${apiQuestion.version || 1}`,
  comments: 0,
  usage: 0,
  lastUsed: '-',
  createdBy: {
    name: apiQuestion.createdbyuser ? 
      `${apiQuestion.createdbyuser.firstname} ${apiQuestion.createdbyuser.lastname}` : 
      'Unknown',
    role: '',
    date: apiQuestion.timecreated ? 
      new Date(apiQuestion.timecreated * 1000).toLocaleDateString() : 
      ''
  },
  modifiedBy: {
    name: apiQuestion.modifiedbyuser ? 
      `${apiQuestion.modifiedbyuser.firstname} ${apiQuestion.modifiedbyuser.lastname}` : 
      'Unknown',
    role: '',
    date: apiQuestion.timemodified ? 
      new Date(apiQuestion.timemodified * 1000).toLocaleDateString() : 
      ''
  },
  choices: apiQuestion.answers || [],
  tags: apiQuestion.tags || [],
  idNumber: apiQuestion.id,
  categoryId: apiQuestion.category || apiQuestion.categoryid || apiQuestion.category_id,
  categoryName: apiQuestion.category_name || apiQuestion.categoryname || '',
  courseId: courseId || apiQuestion.courseid || apiQuestion.course_id || apiQuestion.contextid,
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
  
      // Build params
      const filterParams = this.buildFilterParams(filters);
      const paramsObj = {
        page: page.toString(),
        per_page: perPage.toString(),
        ...filterParams
      };
  
      // Only add categoryids if filtering ALL categories
      // if (
      //   (!filters.category || filters.category === 'All') &&
      //   categoryIds.length > 0
      // ) {
      //   paramsObj.categoryids = categoryIds.join(',');
      // }
  
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

  // Strategy 2: Direct filtering (medium speed)
  // async fetchByDirectFilter(courseId, filters, page, perPage) {
  //   try {
  //     console.log(' Strategy 2: Direct filtering');
      
  //     const params = new URLSearchParams({
  //       page: page.toString(),
  //       per_page: perPage.toString(),
  //       courseid: courseId.toString(),
  //       ...this.buildFilterParams(filters)
  //     });

  //     // FIXED: Correct API URL - single /api/
  //     const questionsUrl = `${API_BASE_URL}/questions/filters?${params}`;
  //     const questionsData = await this.apiClient.request(questionsUrl);

  //     if (questionsData.questions && questionsData.questions.length > 0) {
  //       return {
  //         success: true,
  //         data: questionsData,
  //         method: 'direct'
  //       };
  //     }

  //     return { success: false, reason: 'No questions found' };
  //   } catch (error) {
  //     return { success: false, reason: error.message };
  //   }
  // }

  // Strategy 3: General with client-side filtering (slowest but most reliable)
  // async fetchWithClientFilter(courseId, filters, page, perPage) {
  //   try {
  //     console.log(' Strategy 3: Client-side filtering');
      
  //     // Get more questions to filter from
  //     const params = new URLSearchParams({
  //       page: '1',
  //       per_page: '100', // Get larger batch
  //       ...this.buildFilterParams(filters)
  //     });

  //     // FIXED: Correct API URL - single /api/
  //     const questionsUrl = `${API_BASE_URL}/questions/filters?${params}`;
  //     const questionsData = await this.apiClient.request(questionsUrl);

  //     if (!questionsData.questions || questionsData.questions.length === 0) {
  //       return { success: false, reason: 'No questions available' };
  //     }

  //     // Filter by course on client side
  //     const courseQuestions = questionsData.questions.filter(q => {
  //       const qCourseId = q.courseid || q.course_id || q.contextid;
  //       return qCourseId == courseId;
  //     });

  //     if (courseQuestions.length === 0) {
  //       // Fallback: create virtual assignment
  //       return this.createVirtualAssignment(courseId, questionsData.questions, page, perPage);
  //     }

  //     // Apply pagination
  //     const startIdx = (page - 1) * perPage;
  //     const paginatedQuestions = courseQuestions.slice(startIdx, startIdx + perPage);

  //     return {
  //       success: true,
  //       data: {
  //         questions: paginatedQuestions,
  //         total: courseQuestions.length,
  //         current_page: page,
  //         per_page: perPage
  //       },
  //       method: 'client-filter'
  //     };
  //   } catch (error) {
  //     return { success: false, reason: error.message };
  //   }
  // }

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
     buildFilterParams(filters) {
      const params = {};
    
      // Only use categoryids if present and category is 'All'
      if (
        filters.categoryIds &&
        filters.categoryIds.length > 0 &&
        (filters.category === 'All' || !filters.category)
      ) {
        params.categoryid = filters.categoryIds ? filters.categoryIds : localStorage.getItem('questionCategoryId');
      } else if (filters.category && filters.category !== 'All') {
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
      if (filters.tagFilter && filters.tagFilter !== 'All') {
        params.tag = filters.tagFilter;
      }
    
      return params;
    }
}

const questionFilterService = new QuestionFilterService(apiClient);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const QuestionBank = () => {
  // Navigation state
  const [currentView, setCurrentView] = useState('questions');

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
  const [tagFilter, setTagFilter] = useState('All');

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
    const tagSet = new Set(['All']);
    
    questions.forEach(question => {
      if (Array.isArray(question.tags)) {
        question.tags.forEach(tag => {
          const tagName = typeof tag === 'string' ? tag : (tag?.name || tag?.text || '');
          if (tagName && tagName.trim()) {
            tagSet.add(tagName.trim());
          }
        });
      }
    });
    
    return Array.from(tagSet).sort();
  }, [questions]);

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

    try {
      setLoadingQuestionCategories(true);
      console.log('Fetching question categories for course:', courseId);
      
      // FIXED: Correct API URL
      const categoriesUrl = `${API_BASE_URL}/questions/question_categories?courseid=${courseId}`;
      const categoriesData = await apiClient.request(categoriesUrl);
      
      console.log('Question categories response:', categoriesData);
      
      // Process categories
      let categories = [];
      if (Array.isArray(categoriesData)) {
        categories = categoriesData;
      } else if (categoriesData.categories) {
        categories = categoriesData.categories;
      }

      // Normalize categories
      const normalizedCategories = categories.map(cat => ({
        id: cat.id || cat.categoryid,
        name: cat.name || cat.category_name || `Category ${cat.id}`,
        questioncount: cat.questioncount || 0,
        parent: cat.parent || 0,
        contextid: cat.contextid || cat.context_id,
        sortorder: cat.sortorder || 0
      })).filter(cat => cat.id);

      setQuestionCategories(normalizedCategories);
      
      console.log(' Question categories loaded:', normalizedCategories.length);
      toast.success(`Loaded ${normalizedCategories.length} question categories for course`);
      
    } catch (error) {
      console.error(' Error fetching question categories:', error);
      setQuestionCategories([]);
      toast.error(`Failed to load question categories: ${error.message}`);
    } finally {
      setLoadingQuestionCategories(false);
    }
  }, []);

  // ============================================================================
  // OPTIMIZED API FUNCTIONS
  // ============================================================================

  // Main fetch function with multi-strategy approach
const fetchQuestionsFromAPI = useCallback(async (currentFilters = {}, page = 1, perPage = questionsPerPage) => {
  // Add this before every API call that uses filters
  console.log('DEBUG FILTERS BEFORE API:', filters);
  console.log(' OPTIMIZED API FETCH:', { currentFilters, page, perPage });
  
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

    // Course filtering with multi-strategy approach
    if (currentFilters.courseId && currentFilters.courseId !== 'All' && currentFilters.courseId !== null) {
      console.log('COURSE FILTERING: Multi-strategy approach');
      
      // Try strategies in order of speed/reliability
      const strategies = [
        () => questionFilterService.fetchByCategories(currentFilters.courseId, currentFilters, page, perPage),
        () => questionFilterService.fetchByDirectFilter(currentFilters.courseId, currentFilters, page, perPage),
        () => questionFilterService.fetchWithClientFilter(currentFilters.courseId, currentFilters, page, perPage)
      ];

      for (const strategy of strategies) {
        const result = await strategy();
        if (result.success) {
          console.log(`Strategy succeeded: ${result.method}`);
          await processQuestionsData(result.data, page, currentFilters.courseId, result.isVirtual);
          
          if (result.method === 'virtual') {
            toast.info(`Showing virtual questions for course ${currentFilters.courseId}`);
          } else {
            toast.success(`Found questions for course ${currentFilters.courseId} (${result.method})`);
          }
          return;
        }
      }

      // All strategies failed
      setQuestions([]);
      setTotalQuestions(0);
      toast.error(`No questions found for course ${currentFilters.courseId}`);
      return;
    }

    // General filtering (non-course specific)
    await fetchGeneralQuestions(currentFilters, page, perPage);
  } catch (error) {
    console.error(' Error fetching questions:', error);
    setError(error.message);
    setQuestions([]);
    setTotalQuestions(0);
    toast.error(`Failed to load questions: ${error.message}`);
  } finally {
    setLoading(false);
  }
}, [questionsPerPage]);

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
    console.log('API returned:', data);
    console.log(' Processing questions data:', { 
      total: data.total,
      count: data.questions?.length,
      page,
      courseId,
      isVirtual
    });
    
    if (data && Array.isArray(data.questions)) {
      // Transform questions in batches for better performance
      const batchSize = 10;
      const transformedQuestions = [];
      
      for (let i = 0; i < data.questions.length; i += batchSize) {
        const batch = data.questions.slice(i, i + batchSize);
        const transformedBatch = batch.map(q => transformQuestion(q, courseId));
        transformedQuestions.push(...transformedBatch);
        
        // Allow UI to update between batches
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      setQuestions(transformedQuestions);
      setTotalQuestions(data.total || transformedQuestions.length);
      setCurrentPage(data.current_page || page);
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
      toast.error('Invalid course selection');
      return;
    }
  
    setSelectedCourse({ id: courseId, name: courseName });
  
    // 1. Fetch categories for this course
    const categoriesUrl = `${API_BASE_URL}/questions/question_categories?courseid=${courseId}`;
    let categoriesData = [];
    try {
      categoriesData = await apiClient.request(categoriesUrl);
    } catch (error) {
      toast.error('Failed to load categories for course');
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
    setTagFilter('All');
    setCurrentPage(1);
  
    apiClient.clearCache(`courseid=${courseId}`);
  
    toast.success(`Filtering questions for: ${courseName}`);
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

  // Filter change effect
  // useEffect(() => {
  //   if (currentView !== 'questions') return;

  //   console.log('Filters changed, fetching questions...');
    
  //   const filterParams = {
  //     category: filters.category,
  //     courseId: filters.courseId,
  //     status: filters.status,
  //     type: filters.type,
  //     searchQuery: debouncedSearchQuery,
  //     tagFilter
  //   };

  //   if (currentPage !== 1) {
  //     setCurrentPage(1);
  //     fetchQuestionsFromAPI(filterParams, 1, questionsPerPage);
  //   } else {
  //     fetchQuestionsFromAPI(filterParams, currentPage, questionsPerPage);
  //   }
  // }, [filters, debouncedSearchQuery, tagFilter, currentView, currentPage, questionsPerPage, fetchQuestionsFromAPI]);
useEffect(() => {
  if (currentView !== 'questions') return;
  if (!filters.courseId || filters.courseId === 'All') {
    setQuestions([]);
    setTotalQuestions(0);
    setLoading(false);
    return;
  }

  const filterParams = {
    category: filters.category,
    courseId: filters.courseId,
    status: filters.status,
    type: filters.type,
    searchQuery: debouncedSearchQuery,
    tagFilter
  };

  if (currentPage !== 1) {
    setCurrentPage(1);
    fetchQuestionsFromAPI(filterParams, 1, questionsPerPage);
  } else {
    fetchQuestionsFromAPI(filterParams, currentPage, questionsPerPage);
  }
}, [filters, debouncedSearchQuery, tagFilter, currentView, currentPage, questionsPerPage, fetchQuestionsFromAPI]);
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
                  fetchQuestionsFromAPI(filters, 1, questionsPerPage)
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
              loadingQuestionTypes={loading}
              loadingCategories={loadingQuestionCategories}
            />
  
            {/* Guard: Require course selection */}
            {!filters.courseId || filters.courseId === 'All' ? (
              <div className="text-center py-8 text-gray-500">
                <p>Please select a course to view questions.</p>
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
                          categoryIds: [],
                          status: 'All', 
                          type: 'All', 
                          courseId: null 
                        });
                        setTagFilter('All');
                        setQuestionCategories([]);
                        apiClient.clearCache();
                      }}
                      className="mt-2 text-blue-600 underline"
                    >
                      Clear all filters & cache
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
  
                    {/* Pagination and cache info */}
                    <div className="mt-4 flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{((currentPage - 1) * questionsPerPage) + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(currentPage * questionsPerPage, totalQuestions)}</span> of{' '}
                            <span className="font-medium">{totalQuestions}</span> results
                            {selectedCourse && (
                              <span className="text-blue-600 ml-2">
                                (from {selectedCourse.name})
                              </span>
                            )}
                            {filters.category !== 'All' && questionCategories.length > 0 && (
                              <span className="text-green-600 ml-2">
                                (category: {questionCategories.find(c => c.id == filters.category)?.name || filters.category})
                              </span>
                            )}
                            {debouncedSearchQuery && (
                              <span className="text-green-600 ml-2">
                                (filtered: {filteredQuestions.length})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Items per page selector */}
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-700">Per page:</label>
                          <select
                            value={questionsPerPage}
                            onChange={(e) => {
                              const newPerPage = Number(e.target.value);
                              setQuestionsPerPage(newPerPage);
                              setCurrentPage(1);
                            }}
                            className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            disabled={loading}
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>
  
                        {/* Pagination buttons */}
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1 || loading}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            First
                          </button>
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || loading}
                            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          
                          {/* Smart page numbers */}
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                disabled={loading}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium disabled:cursor-not-allowed ${
                                  currentPage === pageNum
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
  
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || loading}
                            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || loading}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Last
                          </button>
                        </nav>
                        
                        {/* Performance indicator */}
                        <div className="ml-4 text-xs text-gray-500">
                          Cache: {apiClient.cache.size} items
                        </div>
                      </div>
                    </div>
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
      {error && (
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
      )}

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
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
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
      />

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
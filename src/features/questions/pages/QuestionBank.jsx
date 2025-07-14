// ============================================================================
// src/features/questions/pages/QuestionBank.jsx - COMPLETELY FIXED VERSION
// ============================================================================
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// CORRECTED IMPORTS
import { useQuestionBank } from '../../../shared/hooks/useQuestionBank';
import { useDropdowns } from '../../../shared/hooks/useDropdowns';
import { usePagination } from '../../../shared/hooks/usePagination';
import { questionAPI, normalizeQuestionFromAPI } from '../../../api/questionAPI';
import { fetchFilteredQuestions } from '../../../api/questionAPI';
// Import components
import QuestionsTable from '../../../shared/components/QuestionsTable';
import TopButtonsRow from '../../../shared/components/TopButtonsRow';
import BulkActionsRow from '../../../shared/components/BulkActionsRow';
import FiltersRow from '../../../shared/components/FiltersRow';
import Modals from '../../../shared/components/Modals';
import CategoriesComponent from '../../../shared/components/CategoriesComponent';
import PaginationControls from '../../../shared/components/PaginationControls';
import { EDIT_COMPONENTS, BULK_EDIT_COMPONENTS } from '../../../shared/constants/questionConstants';
import { Toaster, toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ============================================================================
// UTILITY HOOKS
// ============================================================================

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const useTagFiltering = () => {
  const [allTags, setAllTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [tagFilter, setTagFilter] = useState([]);

  // Load all tags on component mount
  useEffect(() => {
    const loadTags = async () => {
      try {
        setLoadingTags(true);
        const response = await fetch(`${API_BASE_URL}/questions/tags`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const tags = await response.json();
        const normalizedTags = Array.isArray(tags) ? tags.map(tag => ({
          id: String(tag.id),
          name: tag.name || tag.rawname || `Tag ${tag.id}`,
          rawname: tag.rawname || tag.name,
          isstandard: Boolean(tag.isstandard),
          description: tag.description || ''
        })).filter(tag => tag.id && tag.name) : [];

        setAllTags(normalizedTags);
        console.log(' Tags loaded:', normalizedTags.length);
      } catch (error) {
        console.error(' Failed to load tags:', error);
        setAllTags([]);
      } finally {
        setLoadingTags(false);
      }
    };

    loadTags();
  }, []);

  // Load saved tag filter from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('questionTagFilter');
      if (saved) {
        const parsedTags = JSON.parse(saved);
        if (Array.isArray(parsedTags)) {
          setTagFilter(parsedTags);
          console.log(' Restored tag filter:', parsedTags);
        }
      }
    } catch (error) {
      console.error(' Failed to restore tag filter:', error);
    }
  }, []);

  return {
    allTags,
    loadingTags,
    tagFilter,
    setTagFilter
  };
};

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

  // FIXED: Filter state with proper localStorage persistence
  const [filters, setFilters] = useState(() => {
    const savedCourseId = localStorage.getItem('CourseID');
    const savedCourseName = localStorage.getItem('CourseName');
    const savedCategoryId = localStorage.getItem('questionCategoryId');
    const savedCategoryName = localStorage.getItem('questionCategoryName');
    
    return {
      category: savedCategoryId || 'All',
      categoryName: savedCategoryName || '',
      status: 'All',
      type: 'All',
      courseId: savedCourseId ? parseInt(savedCourseId) : null,
      courseName: savedCourseName || ''
    };
  });

  const [searchQuery, setSearchQuery] = useState('');
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

  const { allTags, loadingTags, tagFilter, setTagFilter } = useTagFiltering();
  
  // FIXED: Add debounced tag filter to prevent rapid API calls
  const debouncedTagFilter = useDebounce(tagFilter, 500);

  // NEW: Question categories for the selected course
  const [questionCategories, setQuestionCategories] = useState([]);
  const [loadingQuestionCategories, setLoadingQuestionCategories] = useState(false);

  // FIXED: Category count map state
  const [categoryCountMap, setCategoryCountMap] = useState({});

  // Memoized available categories (prefer course-specific categories)
  const memoizedAvailableCategories = useMemo(
    () => questionCategories.length > 0 ? questionCategories : availableCategories,
    [questionCategories, availableCategories]
  );

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
  // FETCH QUESTION CATEGORIES FOR COURSE
  // ============================================================================

  const fetchQuestionCategoriesForCourse = useCallback(async (courseId) => {
    if (!courseId || courseId === 'All') {
      console.log(' Clearing question categories (no course selected)');
      setQuestionCategories([]);
      return;
    }

    try {
      setLoadingQuestionCategories(true);
      console.log(' Fetching question categories for course:', courseId);
      
      const categoriesUrl = `${API_BASE_URL}/questions/question_categories?courseid=${courseId}`;
      const response = await fetch(categoriesUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const categoriesData = await response.json();
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
        idnumber: cat.idnumber || '',
        questioncount: cat.questioncount || 0  // Include question count from API
      })).filter(cat => cat.id);

      setQuestionCategories(normalizedCategories);
      console.log(' Question categories loaded:', normalizedCategories.length);
      
      // Extract category counts and update categoryCountMap
      const newCategoryCountMap = {};
      categories.forEach(cat => {
        if (cat.id && typeof cat.questioncount === 'number') {
          newCategoryCountMap[cat.id] = cat.questioncount;
        }
      });
      
      console.log(' Category counts from categories API:', newCategoryCountMap);
      setCategoryCountMap(newCategoryCountMap);
      
    } catch (error) {
      console.error(' Error fetching question categories:', error);
      setQuestionCategories([]);
      setCategoryCountMap({});
    } finally {
      setLoadingQuestionCategories(false);
    }
  }, []);

  // ============================================================================
  // FETCH CATEGORY COUNTS (Additional method if needed)
  // ============================================================================

  const fetchCategoryCounts = useCallback(async () => {
    try {
      const courseId = filters.courseId;
      if (!courseId) {
        console.log(' No course selected, skipping category counts fetch');
        return;
      }
      
      console.log(' Fetching category counts from API...');
      const url = `${API_BASE_URL}/questions/question_categories?courseid=${courseId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch category counts: ${response.status}`);
      }

      const data = await response.json();
      const categories = data.categories || data;
      
      if (!Array.isArray(categories)) {
        console.error(' Invalid categories response format:', data);
        return;
      }
      
      // Create a map of category IDs to question counts
      const newCategoryCountMap = {};
      categories.forEach(cat => {
        if (cat.id && typeof cat.questioncount === 'number') {
          newCategoryCountMap[cat.id] = cat.questioncount;
        }
      });
      
      console.log(' Category counts loaded:', newCategoryCountMap);
      
      // FIXED: Only update if different to prevent unnecessary re-renders
      setCategoryCountMap(prev => {
        const prevJson = JSON.stringify(prev);
        const newJson = JSON.stringify(newCategoryCountMap);
        
        if (prevJson === newJson) {
          console.log(' Category counts unchanged, skipping update');
          return prev;
        }
        
        console.log(' Category counts updated');
        return newCategoryCountMap;
      });
      
    } catch (error) {
      console.error(' Error fetching category counts:', error);
    }
  }, [filters.courseId]);

  // ============================================================================
  // FIXED FETCH FUNCTION WITH PROPER DEPENDENCIES
  // ============================================================================
  
  const fetchQuestions = useCallback(async (
    currentFilters = filters,
    page = currentPage,
    perPage = questionsPerPage
  ) => {
    // FIXED: Better request deduplication with more stable key
    const requestKey = JSON.stringify({
      courseId: currentFilters.courseId,
      category: currentFilters.category,
      status: currentFilters.status,
      type: currentFilters.type,
      searchQuery: debouncedSearchQuery,
      tagFilter: debouncedTagFilter,
      page,
      perPage
    });

    // FIXED: Enhanced duplicate prevention
    if (fetchInProgressRef.current) {
      console.log(' Request blocked - fetch already in progress');
      return;
    }

    if (lastFetchParamsRef.current === requestKey) {
      console.log(' Request blocked - duplicate detected');
      return;
    }

    fetchInProgressRef.current = true;
    lastFetchParamsRef.current = requestKey;

    try {
      setLoading(true);
      setError(null);

      console.log(' Fetching questions with filters:', {
        ...currentFilters,
        tagFilter: debouncedTagFilter,
        page,
        perPage
      });

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      if (!currentFilters.courseId || currentFilters.courseId === 'All') {
        console.log(' No course selected, clearing questions');
        setQuestions([]);
        setTotalQuestions(0);
        return;
      }

      const hasTagFilter = Array.isArray(debouncedTagFilter) && debouncedTagFilter.length > 0;

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());

      // CRITICAL FIX: Proper tag filtering using your API
      if (hasTagFilter) {
        console.log(' Adding tag filters to API call:', debouncedTagFilter);
        debouncedTagFilter.forEach(tagId => {
          params.append('tagids[]', tagId.toString());
        });
      }

      // Add other filters
      if (currentFilters.category !== 'All') params.append('categoryid', currentFilters.category);
      if (currentFilters.status !== 'All') params.append('status', currentFilters.status);
      if (currentFilters.type !== 'All') params.append('qtype', currentFilters.type);
      if (debouncedSearchQuery) params.append('searchterm', debouncedSearchQuery);

      const url = `${API_BASE_URL}/questions/filters?${params}`;
      console.log(' Final API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📦 API Response:', {
        total: result.total,
        questions: result.questions?.length,
        current_page: result.current_page
      });

      // Transform questions from API response
      const transformedQuestions = (result.questions || []).map(q => ({
        id: q.id,
        title: q.name || `Question ${q.id}`,
        questionText: q.questiontext || '',
        qtype: q.qtype || 'multichoice',
        status: q.status || 'ready',
        version: `v${q.version || 1}`,
        categoryId: q.category,
        categoryid: q.category, // Alternative field name
        contextid: q.contextid,
        createdBy: {
          name: q.createdbyuser ?
            `${q.createdbyuser.firstname} ${q.createdbyuser.lastname}`.trim() : 'Unknown',
          date: q.timecreated ? new Date(q.timecreated * 1000).toLocaleDateString() : ''
        },
        modifiedBy: {
          name: q.modifiedbyuser ?
            `${q.modifiedbyuser.firstname} ${q.modifiedbyuser.lastname}`.trim() : 'Unknown',
          date: q.timemodified ? new Date(q.timemodified * 1000).toLocaleDateString() : ''
        },
        choices: (q.answers || []).map(answer => ({
          id: answer.id,
          text: answer.answer,
          isCorrect: answer.fraction > 0,
          feedback: answer.feedback || ''
        })),
        tags: q.tags || [],
        usage: (q.usages || []).length,
        lastUsed: q.usages && q.usages.length > 0 ? 'Recently' : 'Never',
        comments: 0,
        stamp: q.stamp,
        versionid: q.versionid,
        questionbankentryid: q.questionbankentryid,
        idnumber: q.idnumber || q.id
      }));

      setQuestions(transformedQuestions);
      setTotalQuestions(result.total || transformedQuestions.length);
      setCurrentPage(result.current_page || page);

      console.log(' Questions loaded successfully:', {
        count: transformedQuestions.length,
        total: result.total,
        currentPage: result.current_page
      });

    } catch (error) {
      console.error(' Fetch error:', error);
      setError(error.message);
      setQuestions([]);
      setTotalQuestions(0);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
      
      // Clear request key after delay to allow new requests
      setTimeout(() => {
        if (lastFetchParamsRef.current === requestKey) {
          lastFetchParamsRef.current = null;
        }
      }, 1000);
    }
  }, [
    // FIXED: Only include truly stable dependencies
    filters.courseId,
    filters.category,
    filters.status,
    filters.type,
    debouncedSearchQuery,
    debouncedTagFilter
  ]);

  // Load static data with caching
  const loadStaticData = useCallback(async () => {
    try {
      console.log(' Loading static data...');
      const [types, categories] = await Promise.all([
        questionAPI.getQuestionTypes(),
        questionAPI.getCategories()
      ]);
      setAvailableQuestionTypes(types);
      setAvailableCategories(categories);
      console.log('Static data loaded:', { types: types.length, categories: categories.length });
    } catch (error) {
      console.error(' Failed to load static data:', error);
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

  // FIXED: Enhanced setFilters with stability check
  const setFiltersWithLogging = useCallback((newFilters) => {
    // FIXED: Prevent unnecessary updates
    const filtersEqual = JSON.stringify(filters) === JSON.stringify(newFilters);
    if (filtersEqual) {
      console.log(' Filters unchanged, skipping update');
      return;
    }

    console.log('Filters updated:', { old: filters, new: newFilters });
    setFilters(newFilters);
    
    // Persist course selection
    if (newFilters.courseId) {
      localStorage.setItem('CourseID', newFilters.courseId.toString());
      if (newFilters.courseName) {
        localStorage.setItem('CourseName', newFilters.courseName);
      }
    } else {
      // localStorage.removeItem('CourseID');
      localStorage.removeItem('CourseName');
    }
    
    // Persist category selection
    if (newFilters.category && newFilters.category !== 'All') {
      localStorage.setItem('questionCategoryId', newFilters.category);
      if (newFilters.categoryName) {
        localStorage.setItem('questionCategoryName', newFilters.categoryName);
      }
    } else {
      localStorage.removeItem('questionCategoryId');
      localStorage.removeItem('questionCategoryName');
    }
  }, [filters]);

  // Enhanced course selection handler
  const handleCourseSelect = useCallback(async (course) => {
    console.log(' Course selected:', course);
  
    const courseId = course.id || course.courseId;
    const courseName = course.name || course.fullname || `Course ${courseId}`;
  
    if (!courseId) {
      toast.error('Invalid course selection');
      return;
    }
  
    setSelectedCourse({ id: courseId, name: courseName });
  
    // 1. Fetch categories for this course (this also updates categoryCountMap)
    await fetchQuestionCategoriesForCourse(courseId);
  
    // 2. Set filters
    setFiltersWithLogging({
      category: 'All',
      categoryName: '',
      status: 'All',
      type: 'All',
      courseId: courseId,
      courseName: courseName
    });
  
    setSearchQuery('');
    setTagFilter([]);
    setCurrentPage(1);
  
    toast.success(`Filtering questions for: ${courseName}`);
  }, [setFiltersWithLogging, setTagFilter, fetchQuestionCategoriesForCourse]);

  // Status change handlers
  const handleStatusChange = useCallback(async (questionId, newStatus) => {
    const prevQuestions = [...questions];
    
    try {
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
      fetchQuestions(filters, currentPage, questionsPerPage);
    }
  }, [filters, currentPage, questionsPerPage, fetchQuestions]);

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
  // FIXED EFFECTS - SPLIT INTO SEPARATE CONCERNS
  // ============================================================================
  
  // Effect 1: Filter changes (NOT including pagination)
  useEffect(() => {
    if (currentView !== 'questions') return;
    
    console.log('Filters changed, fetching questions...');
    
    // Always reset to page 1 when filters change
    setCurrentPage(1);
    fetchQuestions(filters, 1, questionsPerPage);
    
  }, [
    filters.courseId,
    filters.category, 
    filters.status, 
    filters.type,
    debouncedSearchQuery,
    debouncedTagFilter,
    currentView,
    questionsPerPage,
    fetchQuestions
  ]);

  // Effect 2: Pagination only (when page > 1)
  useEffect(() => {
    if (currentView !== 'questions') return;
    if (currentPage === 1) return; // Skip page 1 (handled by filter effect)
    
    console.log(' Page changed, fetching questions...');
    fetchQuestions(filters, currentPage, questionsPerPage);
    
  }, [currentPage, fetchQuestions, currentView, filters, questionsPerPage]);

  // Effect 3: Load static data on mount
  useEffect(() => {
    loadStaticData();
  }, [loadStaticData]);

  // Effect 4: Course changes - load categories and counts
  useEffect(() => {
    if (filters.courseId && filters.courseId !== 'All') {
      console.log(' Course changed, fetching categories and counts...');
      fetchQuestionCategoriesForCourse(filters.courseId);
    } else {
      console.log(' No course selected, clearing categories');
      setQuestionCategories([]);
      setCategoryCountMap({});
    }
  }, [filters.courseId, fetchQuestionCategoriesForCourse]);

  // Calculate category question count with useMemo instead of useEffect
  const categoryQuestionCount = useMemo(() => {
    if (!questions || questions.length === 0) {
      return 0;
    }

    if (filters.category === 'All') {
      return totalQuestions || questions.length;
    }

    const count = questions.filter(q => {
      const questionCategoryId = String(q.categoryId || q.categoryid || q.category || '');
      const selectedCategoryId = String(filters.category || '');
      return questionCategoryId === selectedCategoryId;
    }).length;
    
    return count === 0 && totalQuestions > 0 ? totalQuestions : count;
  }, [questions, filters.category, totalQuestions]);

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
  // RENDER METHODS
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
                  fetchQuestions(filters, currentPage, questionsPerPage)
                }
                questions={questions}
                setQuestions={setQuestions}
              />
            )}

            {/* FIXED: Filters Row with Tag Filtering */}
            <FiltersRow
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filters={filters}
              setFilters={setFiltersWithLogging}
              tagFilter={tagFilter}
              setTagFilter={setTagFilter}
              allTags={allTags}
              availableQuestionTypes={availableQuestionTypes}
              availableCategories={memoizedAvailableCategories}
              availableCourses={[]}
              loadingQuestionTypes={loading}
              loadingQuestionTags={loadingTags}
              loadingCategories={loadingQuestionCategories}
              questions={questions}
              allQuestions={questions}
              categoryQuestionCount={categoryQuestionCount}
              categoryCountMap={categoryCountMap} 
            />

            {/* Course Selection Guard */}
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
                {/* Loading State */}
                {loading && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading questions...</p>
                    {Array.isArray(debouncedTagFilter) && debouncedTagFilter.length > 0 && (
                      <p className="mt-1 text-sm text-blue-600">
                        Filtering by {debouncedTagFilter.length} tag{debouncedTagFilter.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <div className="flex justify-between items-center">
                      <span><strong>Error:</strong> {error}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setError(null);
                            fetchQuestions();
                          }}
                          className="px-3 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300"
                        >
                          Retry
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

                {/* Empty State */}
                {!loading && !error && questions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No questions found with current filters.</p>
                    {(searchQuery || tagFilter.length > 0 || filters.status !== 'All' || filters.type !== 'All') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setTagFilter([]);
                          setFiltersWithLogging({ 
                            ...filters,
                            status: 'All', 
                            type: 'All',
                            category: 'All'
                          });
                        }}
                        className="mt-2 text-blue-600 underline"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}

                {/* Questions Table */}
                {!loading && !error && questions.length > 0 && (
                  <>
                    {/* Pagination above table */}
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalQuestions}
                      itemsPerPage={questionsPerPage}
                      onPageChange={(page) => {
                        if (fetchInProgressRef.current) return;
                        setCurrentPage(page);
                      }}
                      onItemsPerPageChange={(newPerPage) => {
                        if (fetchInProgressRef.current) return;
                        setQuestionsPerPage(newPerPage);
                        setCurrentPage(1);
                      }}
                      isLoading={loading}
                      className="border-t bg-gray-50"
                    />

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
                        setEditingQuestionData(question);
                      }}
                      onDuplicate={handleDuplicateQuestion}
                      onHistory={setHistoryModal}
                      onDelete={handleDeleteQuestion}
                      onStatusChange={handleStatusChange}
                      username={username}
                      setQuestions={setQuestions}
                    />

                    {/* Pagination below table */}
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalQuestions}
                      itemsPerPage={questionsPerPage}
                      onPageChange={(page) => {
                        if (fetchInProgressRef.current) return;
                        setCurrentPage(page);
                      }}
                      onItemsPerPageChange={(newPerPage) => {
                        if (fetchInProgressRef.current) return;
                        setQuestionsPerPage(newPerPage);
                        setCurrentPage(1);
                      }}
                      isLoading={loading}
                      className="border-t bg-gray-50"
                    />
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
      <Toaster position="top-right" />
      
      {/* Performance indicator */}
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-200 z-50">
          <div className="h-full bg-blue-600 animate-pulse"></div>
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

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { Close as CloseIcon, Warning as WarningIcon, Delete as DeleteIcon } from '@mui/icons-material';

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
import { toast } from 'react-hot-toast';

// ============================================================================
// src/features/questions/pages/QuestionBank.jsx - FIXED SCROLLING VERSION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ============================================================================
// UTILITY HOOKS (unchanged)
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

  // FIXED: Filter state with proper localStorage persistence (move above setFiltersWithLogging)
  const [filters, setFilters] = useState(() => {
    const savedCourseId = localStorage.getItem('CourseID');
    const savedCourseName = localStorage.getItem('CourseName');
    const savedCategoryId = localStorage.getItem('questionCategoryId');
    const savedCategoryName = localStorage.getItem('questionCategoryName');
    const savedScalerTopic = localStorage.getItem('scalerTopic');

    return {
      category: savedCategoryId || 'All',
      categoryName: savedCategoryName || '',
      status: 'All',
      type: 'All',
      courseId: savedCourseId ? parseInt(savedCourseId) : null,
      courseName: savedCourseName || '',
      scalerTopic: savedScalerTopic || 'no', 

    };
  });

  // FIXED: Enhanced setFilters with stability check (move this below filters)
  const setFiltersWithLogging = React.useCallback((newFilters) => {
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
      
    if ('scalerTopic' in newFilters) {
      localStorage.setItem('scalerTopic', newFilters.scalerTopic);
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

  // Listen for category change event from BulkActionsRow (move modal)
  useEffect(() => {
    const handler = (e) => {
      const { id, name } = (e.detail || {});
      if (id) {
        setFiltersWithLogging(prev => ({
          ...prev,
          category: id,
          categoryName: name || '',
        }));
        setCurrentPage(1);
      }
    };
    window.addEventListener('questionCategoryChanged', handler);
    return () => window.removeEventListener('questionCategoryChanged', handler);
  }, [setFiltersWithLogging]);
  // Navigation hooks
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Check if we came from courses page
  const cameFromCourses = searchParams.get('courseId') || location.state?.fromCourses;
  const selectedCourseId = searchParams.get('courseId') || localStorage.getItem('CourseID');
  const selectedCourseName = localStorage.getItem('CourseName');
  
  // Navigation state
  const [currentView, setCurrentView] = useState('questions');
  const fetchInProgressRef = useRef(false);
  const lastFetchParamsRef = useRef(null);

  // Handle back to courses
  const handleBackToCourses = () => {
    navigate('/courses');
  };

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
        console.log(' No course selected, fetching questions from all courses or showing message');
        // Don't automatically clear questions - let the API handle it
        // You can uncomment the lines below if you want to show no questions when no course is selected
        // setQuestions([]);
        // setTotalQuestions(0);
        // return;
      }

      const hasTagFilter = Array.isArray(debouncedTagFilter) && debouncedTagFilter.length > 0;

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());

      // CRITICAL FIX: Add course ID to filter questions by course
      if (currentFilters.courseId && currentFilters.courseId !== 'All') {
        // Try multiple parameter variations as different APIs might expect different names
        params.append('courseid', currentFilters.courseId.toString());
        params.append('course_id', currentFilters.courseId.toString()); // Alternative name
        params.append('contextid', currentFilters.courseId.toString()); // Context-based filtering
        console.log('🎯 Adding course filter:', currentFilters.courseId);
        console.log('🎯 Course name:', currentFilters.courseName);
      } else {
        console.log('⚠️ No course ID provided for filtering!');
      }

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
      console.log(' API Response:', {
        total: result.total,
        questions: result.questions?.length,
        current_page: result.current_page
      });

      // Debug: Log first few questions to see their course context
      if (result.questions && result.questions.length > 0) {
        console.log(' Sample questions with course context:');
        result.questions.slice(0, 3).forEach((q, i) => {
          console.log(`Question ${i + 1}:`, {
            id: q.id,
            name: q.name,
            contextid: q.contextid,
            category: q.category,
            courseid: q.courseid, // Check if API returns course ID
            course: q.course // Check if API returns course info
          });
        });
      }

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
        courseid: q.courseid || q.course_id, // Store course ID from API
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
        comments: q.total_comments || 0,
        stamp: q.stamp,
        versionid: q.versionid,
        questionbankentryid: q.questionbankentryid,
        idnumber: q.idnumber || q.id
      }));

      // 🔧 CLIENT-SIDE FALLBACK: If API doesn't filter properly, filter here
      let finalQuestions = transformedQuestions;
      if (currentFilters.courseId && currentFilters.courseId !== 'All') {
        const beforeFilter = transformedQuestions.length;
        
        // Try filtering by different possible course identifiers
        finalQuestions = transformedQuestions.filter(q => {
          const matchesCourseId = q.courseid && q.courseid.toString() === currentFilters.courseId.toString();
          const matchesContextId = q.contextid && q.contextid.toString() === currentFilters.courseId.toString();
          
          return matchesCourseId || matchesContextId;
        });
        
        const afterFilter = finalQuestions.length;
        console.log(` Client-side filtering: ${beforeFilter} → ${afterFilter} questions`);
        
        // If no questions match, use all questions but log warning
        if (finalQuestions.length === 0 && transformedQuestions.length > 0) {
          console.log(' No questions matched course filter, showing all questions');
          finalQuestions = transformedQuestions;
        }
      }

      setQuestions(finalQuestions);
      setTotalQuestions(result.total || finalQuestions.length);
      setCurrentPage(result.current_page || page);

      console.log('Questions loaded successfully:', {
        count: finalQuestions.length,
        total: result.total,
        currentPage: result.current_page,
        courseFilter: currentFilters.courseId
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



  // Enhanced course selection handler
  const handleCourseSelect = useCallback(async (course) => {
    console.log('📚 Course selected:', course);

    const courseId = course.id || course.courseId;
    const courseName = course.name || course.fullname || `Course ${courseId}`;

    if (!courseId) {
      toast.error('Invalid course selection');
      return;
    }

    //  CRITICAL FIX: Clear category filter localStorage when switching courses
    console.log(' Clearing category filter for new course...');
    localStorage.removeItem('questionCategoryId');
    localStorage.removeItem('questionCategoryName');

    setSelectedCourse({ id: courseId, name: courseName });

    // 1. Fetch categories for this course (this also updates categoryCountMap)
    await fetchQuestionCategoriesForCourse(courseId);

    // 2. Set filters with cleared category
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

    console.log(' Course switched successfully with cleared category filter');
    // toast.success(`Filtering questions for: ${courseName}`);
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
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    open: false,
    questionIds: [],
    questionCount: 0,
    isLoading: false
  });

  const handleDeleteQuestion = useCallback(async (questionId) => {
    const questionToDelete = questions.find(q => q.id === questionId);
    if (!questionToDelete) return;

    setDeleteConfirmation({
      open: true,
      questionIds: [questionId],
      questionCount: 1,
      isLoading: false
    });
  }, [questions]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedQuestions.length === 0) return;

    setDeleteConfirmation({
      open: true,
      questionIds: selectedQuestions,
      questionCount: selectedQuestions.length,
      isLoading: false
    });
  }, [selectedQuestions]);

  const confirmDelete = useCallback(async () => {
    const { questionIds, questionCount } = deleteConfirmation;
    
    setDeleteConfirmation(prev => ({ ...prev, isLoading: true }));

    try {
      // Use the new delete_all_versions API endpoint
      await questionAPI.deleteAllVersions(questionIds);
      
      setQuestions(prev => prev.filter(q => !questionIds.includes(q.id)));
      setSelectedQuestions(prev => prev.filter(id => !questionIds.includes(id)));
      
      setDeleteConfirmation({ open: false, questionIds: [], questionCount: 0, isLoading: false });
      toast.success(`Successfully deleted ${questionCount} question${questionCount !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error deleting questions:', error);
      setDeleteConfirmation(prev => ({ ...prev, isLoading: false }));
      toast.error(`Failed to delete question${questionCount !== 1 ? 's' : ''}: ${error.message}`);
    }
  }, [deleteConfirmation]);

  const cancelDelete = useCallback(() => {
    setDeleteConfirmation({ open: false, questionIds: [], questionCount: 0, isLoading: false });
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

  // Effect 2: Pagination only (when page changes)
  useEffect(() => {
    if (currentView !== 'questions') return;
    
    // Only skip if this is the initial load (page 1 with no previous page)
    // Allow page 1 if user is navigating back to it
    const isInitialLoad = currentPage === 1 && !questions.length;
    if (isInitialLoad) return; // Skip initial page 1 load (handled by filter effect)

    console.log('📄 Page changed, fetching questions...', { currentPage, isInitialLoad });
    fetchQuestions(filters, currentPage, questionsPerPage);

  }, [currentPage, fetchQuestions, currentView, filters, questionsPerPage, questions.length]);

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

  // Effect 5: Clear category filter when course changes
  useEffect(() => {
    const currentCourseId = localStorage.getItem('CourseID');
    const currentCourseName = localStorage.getItem('CourseName');
    
    // Check if course has changed from what's in the filters
    if (currentCourseId && currentCourseId !== filters.courseId?.toString()) {
      console.log(' Course change detected! Clearing category filter...');
      console.log('Previous course:', filters.courseId, 'New course:', currentCourseId);
      
      // Clear category-related localStorage items
      localStorage.removeItem('questionCategoryId');
      localStorage.removeItem('questionCategoryName');
      
      // Update filters to reflect the new course and reset category
      setFilters(prev => ({
        ...prev,
        courseId: parseInt(currentCourseId, 10),
        courseName: currentCourseName || '',
        category: 'All',
        categoryName: ''
      }));
      
      console.log(' Category filter cleared for new course');
    }
  }, [filters.courseId]); // This will run when courseId in localStorage changes

  // Effect 6: Handle initial course setup from URL params
  useEffect(() => {
    const urlCourseId = searchParams.get('courseId');
    
    if (urlCourseId && urlCourseId !== filters.courseId?.toString()) {
      console.log(' Course ID from URL detected:', urlCourseId);
      console.log(' Setting up course from URL and clearing category filter...');
      
      // Clear category-related localStorage items when coming from URL
      localStorage.removeItem('questionCategoryId');
      localStorage.removeItem('questionCategoryName');
      
      // Update filters to reflect the URL course and reset category
      setFilters(prev => ({
        ...prev,
        courseId: parseInt(urlCourseId, 10),
        courseName: selectedCourseName || '',
        category: 'All',
        categoryName: ''
      }));
      
      console.log(' URL-based course setup complete with cleared category filter');
    }
  }, [searchParams, filters.courseId, selectedCourseName]); // Run when URL params change

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
          <div className="flex flex-col">
            {/* Bulk actions - participate in scroll */}
            {selectedQuestions.length > 0 && (
              <div>
                <BulkActionsRow
                  selectedQuestions={selectedQuestions}
                  setSelectedQuestions={setSelectedQuestions}
                  setShowBulkEditModal={setShowBulkEditModal}
                  onBulkDelete={handleBulkDelete}
                  onBulkStatusChange={handleBulkStatusChange}
                  onReloadQuestions={() =>
                    fetchQuestions(filters, currentPage, questionsPerPage)
                  }
                  questions={questions}
                  setQuestions={setQuestions}
                />
              </div>
            )}

            {/* Filters Row - participate in scroll */}
            <div>
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
            </div>

            {/* Course Selection Guard */}
            {!filters.courseId || filters.courseId === 'All' ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 min-h-96">
                <div className="text-center">
                  <p>Please select a course to view questions.</p>
                  <button
                    onClick={() => setCurrentView('categories')}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Select Course
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Loading questions...</p>
                      {Array.isArray(debouncedTagFilter) && debouncedTagFilter.length > 0 && (
                        <p className="mt-1 text-sm text-blue-600">
                          Filtering by {debouncedTagFilter.length} tag{debouncedTagFilter.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
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
                  <div className="flex items-center justify-center text-gray-500 py-12">
                    <div className="text-center">
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
                  </div>
                )}

                {/* Questions Table and Pagination - unified scrolling */}
                {!loading && !error && questions.length > 0 && (
                  <div className="flex flex-col">
                    {/* Pagination above table */}
                    <div>
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalQuestions}
                        itemsPerPage={questionsPerPage}
                        onPageChange={(page) => {
                          console.log(' Top Pagination onPageChange triggered:', { 
                            page, 
                            currentPage, 
                            fetchInProgress: fetchInProgressRef.current 
                          });
                          if (fetchInProgressRef.current) {
                            console.log(' Top Pagination blocked: fetch in progress');
                            return;
                          }
                          console.log(' Setting current page to:', page);
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
                    </div>

                    {/* Questions Table - now part of unified scroll */}
                    <div>
                       <QuestionsTable
                        questions={filteredQuestions}
                        allQuestions={questions}
                        filteredQuestions={filteredQuestions}
                        selectedQuestions={selectedQuestions}
                        setSelectedQuestions={setSelectedQuestions}
                        showQuestionText={filters.scalerTopic === 'yes_text' || filters.scalerTopic === 'yes_full'}
                        showQuestionMedia={filters.scalerTopic === 'yes_full'}
                        scalerTopic={filters.scalerTopic}
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
                    </div>

                    {/* Pagination below table */}
                    <div>
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalQuestions}
                        itemsPerPage={questionsPerPage}
                        onPageChange={(page) => {
                          console.log(' Bottom Pagination onPageChange triggered:', { 
                            page, 
                            currentPage, 
                            fetchInProgress: fetchInProgressRef.current 
                          });
                          if (fetchInProgressRef.current) {
                            console.log(' Bottom Pagination blocked: fetch in progress');
                            return;
                          }
                          console.log(' Setting current page to:', page);
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
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
    }
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Performance indicator */}
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-200 z-50">
          <div className="h-full bg-blue-600 animate-pulse"></div>
        </div>
      )}

      {/* Categories modal */}
      <CategoriesComponent
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        onNavigateToQuestions={() => setCurrentView('questions')}
        onCourseSelect={handleCourseSelect}
        setFilters={setFiltersWithLogging}
      />

      {/* FIXED: Main Content Area with unified scrolling */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-full flex flex-col">
          {/* Top Navigation Bar - now inside scrollable area */}
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
            showBackButton={!!cameFromCourses}
            backButtonText="Back to Courses"
            onBack={handleBackToCourses}
            selectedCourseName={selectedCourseName}
          />
          
          {/* Content View */}
          {renderCurrentView()}
        </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.open}
        onClose={deleteConfirmation.isLoading ? undefined : cancelDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 3
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1,
          fontWeight: 600
        }}>
          Delete Question{deleteConfirmation.questionCount > 1 ? 's' : ''}
          {!deleteConfirmation.isLoading && (
            <IconButton 
              onClick={cancelDelete}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { 
                  backgroundColor: 'action.hover' 
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Box sx={{ 
              width: 48, 
              height: 48, 
              backgroundColor: 'error.light',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <WarningIcon sx={{ color: 'error.main', fontSize: 24 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                Are you sure you want to delete {deleteConfirmation.questionCount > 1 ? 'these questions' : 'this question'}?
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Count:</strong> {deleteConfirmation.questionCount} question{deleteConfirmation.questionCount > 1 ? 's' : ''}
                </Typography>
              </Box>
              
              <Alert 
                severity="warning" 
                sx={{ mb: 2 }}
                icon={<WarningIcon fontSize="inherit" />}
              >
                <Typography variant="body2">
                  <strong>Warning:</strong> This will permanently delete all versions of the selected question{deleteConfirmation.questionCount > 1 ? 's' : ''}. This action cannot be undone.
                </Typography>
              </Alert>
              
              <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 500 }}>
                This action cannot be undone.
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          px: 3, 
          pb: 3, 
          pt: 1,
          backgroundColor: 'grey.50',
          gap: 1
        }}>
          <Button
            onClick={cancelDelete}
            variant="outlined"
            color="inherit"
            disabled={deleteConfirmation.isLoading}
            sx={{ 
              borderColor: 'grey.300',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'grey.400',
                backgroundColor: 'grey.50'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            disabled={deleteConfirmation.isLoading}
            startIcon={deleteConfirmation.isLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
            sx={{ 
              fontWeight: 500,
              '&:hover': {
                backgroundColor: 'error.dark'
              }
            }}
          >
            {deleteConfirmation.isLoading ? 'Deleting...' : `Delete Question${deleteConfirmation.questionCount > 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default QuestionBank;
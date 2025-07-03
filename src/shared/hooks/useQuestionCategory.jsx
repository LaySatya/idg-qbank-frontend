// ============================================================================
// src/shared/hooks/useQuestionCategory.js - FIXED VERSION
// Corrected API URLs and Enhanced Error Handling
// ============================================================================
import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Global cache for question categories to avoid repeated API calls
const categoryCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

// Request deduplication map
const pendingRequests = new Map();

/**
 * Optimized hook for fetching question categories by course
 * Features:
 * - Global caching to prevent repeated API calls
 * - Request deduplication for concurrent requests
 * - Automatic cleanup on unmount
 * - Error recovery with retry mechanism
 * - FIXED: Correct API URLs
 */
const useQuestionCategory = (courseId) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  // Auth headers helper
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }, []);

  // Check cache first, then make API call
  const fetchCategories = useCallback(async (courseIdParam) => {
    if (!courseIdParam || courseIdParam === 'All' || courseIdParam === null) {
      if (isMountedRef.current) {
        setCategories([]);
        setLoading(false);
        setError(null);
      }
      return;
    }

    const cacheKey = `categories_${courseIdParam}`;
    const cached = categoryCache.get(cacheKey);

    // Check if we have valid cached data
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(' Cache hit for categories:', courseIdParam);
      if (isMountedRef.current) {
        setCategories(cached.data);
        setLoading(false);
        setError(null);
      }
      return;
    }

    // Check if request is already pending
    if (pendingRequests.has(cacheKey)) {
      console.log(' Request already pending for categories:', courseIdParam);
      try {
        const result = await pendingRequests.get(cacheKey);
        if (isMountedRef.current) {
          setCategories(result);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err.message);
          setLoading(false);
        }
      }
      return;
    }

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    // Create the API request promise
    const requestPromise = makeAPIRequest(courseIdParam);
    pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache the successful result
      categoryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      if (isMountedRef.current) {
        setCategories(result);
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      console.error(' Error fetching question categories:', err);
      if (isMountedRef.current) {
        setError(err.message);
        setLoading(false);
        setCategories([]);
      }
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }, [getAuthHeaders]);

  // Actual API request function with FIXED URL
  const makeAPIRequest = async (courseIdParam) => {
    try {
      console.log('Fetching question categories for course:', courseIdParam);
      
      // FIXED: Correct API URL - remove /api/ prefix since API_BASE_URL already includes it
      const url = `${API_BASE_URL}/questions/question_categories?courseid=${courseIdParam}`;
      console.log(' Making request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Authentication expired. Please log in again.');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(' Question categories response:', data);

      // Handle different response formats
      let processedCategories = [];
      
      if (Array.isArray(data)) {
        processedCategories = data;
      } else if (data.categories && Array.isArray(data.categories)) {
        processedCategories = data.categories;
      } else if (data.data && Array.isArray(data.data)) {
        processedCategories = data.data;
      }

      // Process and normalize categories
      const normalizedCategories = processedCategories.map(cat => ({
        id: cat.id || cat.categoryid,
        name: cat.name || cat.category_name || `Category ${cat.id}`,
        info: cat.info || cat.description || '',
        parent: cat.parent || 0,
        contextid: cat.contextid || cat.context_id,
        sortorder: cat.sortorder || 0,
        questioncount: cat.questioncount || 0,
        // Additional fields for better compatibility
        idnumber: cat.idnumber || '',
        stamp: cat.stamp || '',
        timecreated: cat.timecreated || null,
        timemodified: cat.timemodified || null
      })).filter(cat => cat.id); // Remove invalid categories

      console.log('Processed categories:', normalizedCategories.length);
      return normalizedCategories;

    } catch (error) {
      console.error(' API request failed:', error);
      throw error;
    }
  };

  // Effect to fetch categories when courseId changes
  useEffect(() => {
    fetchCategories(courseId);
  }, [courseId, fetchCategories]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Retry function for error recovery
  const retry = useCallback(() => {
    if (courseId) {
      const cacheKey = `categories_${courseId}`;
      categoryCache.delete(cacheKey); // Clear cache for this course
      fetchCategories(courseId);
    }
  }, [courseId, fetchCategories]);

  // Clear cache function (useful for forced refresh)
  const clearCache = useCallback((specificCourseId = null) => {
    if (specificCourseId) {
      const cacheKey = `categories_${specificCourseId}`;
      categoryCache.delete(cacheKey);
    } else {
      categoryCache.clear();
    }
  }, []);

  // Force refresh function
  const forceRefresh = useCallback(() => {
    if (courseId) {
      const cacheKey = `categories_${courseId}`;
      categoryCache.delete(cacheKey);
      pendingRequests.delete(cacheKey);
      fetchCategories(courseId);
    }
  }, [courseId, fetchCategories]);

  return {
    categories,
    loading,
    error,
    retry,
    clearCache,
    forceRefresh, // NEW: Force refresh function
    // Additional utilities
    isEmpty: categories.length === 0 && !loading && !error,
    hasData: categories.length > 0,
    cacheSize: categoryCache.size,
    // Debug information
    courseId: courseId,
    apiUrl: courseId ? `${API_BASE_URL}/questions/question_categories?courseid=${courseId}` : null
  };
};

export default useQuestionCategory;
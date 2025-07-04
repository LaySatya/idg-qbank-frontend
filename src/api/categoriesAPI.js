// ============================================================================
// src/api/categoriesAPI.js - FIXED: Proper Course Categories & Courses Support
// ============================================================================
import { useState, useCallback } from 'react';

// const BASE_URL = 'http://127.0.0.1:8000/api/questions';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }
  return token;
};

/**
 * Standard headers for API requests
 */
const getHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
});

/**
 * Handle API response and errors with timeout handling
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.text();
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const parsedError = JSON.parse(errorData);
      if (parsedError.error && parsedError.exception_message) {
        if (
          parsedError.exception_message.includes('cURL error 28') ||
          parsedError.exception_message.includes('Connection timed out')
        ) {
          throw new Error('API connection timeout. Please check your network and try again.');
        }
        errorMessage = parsedError.error + ': ' + parsedError.exception_message;
      } else {
        errorMessage = parsedError.message || parsedError.error || errorMessage;
      }
    } catch (e) {
      if (
        errorData.includes('cURL error 28') ||
        errorData.includes('Connection timed out')
      ) {
        throw new Error('API connection timeout. Please check your network and try again.');
      }
      errorMessage = errorData || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  if (data.error) {
    if (
      data.exception_message &&
      (data.exception_message.includes('cURL error 28') ||
        data.exception_message.includes('Connection timed out'))
    ) {
      throw new Error('API connection timeout. Please check your network and try again.');
    }
    throw new Error(data.error + (data.exception_message ? ': ' + data.exception_message : ''));
  }

  return data;
};

/**
 * Categories API object with all category-related functions
 */
export const categoriesAPI = {
  /**
   *  NEW: Fetch course categories (different from question categories)
   * These are the main categories that organize courses in Moodle
   * @returns {Promise<Array>} Course categories array
   */
  fetchCourseCategories: async () => {
    try {
      console.log(' Fetching course categories...');
      const response = await fetch(`${API_BASE_URL}/course-categories`, {
        method: 'GET',
        headers: getHeaders()
      });
      const data = await handleResponse(response);
      console.log(' Course categories fetched:', data);
      
      // Return the array directly since the endpoint returns an array
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(' Error fetching course categories:', error);
      throw error;
    }
  },

  /**
   * Fetch all question categories
   * @returns {Promise<Object>} Categories data
   */
  fetchQuestionCategories: async () => {
    try {
      console.log(' Fetching question categories...');
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'GET',
        headers: getHeaders()
      });
      const data = await handleResponse(response);
      console.log(' Question categories fetched:', data);
      return data;
    } catch (error) {
      console.error(' Error fetching question categories:', error);
      throw error;
    }
  },

  /**
   *  FIXED: Fetch courses by category ID using the correct endpoint
   * @param {number} categoryId - Course category ID (not question category ID)
   * @returns {Promise<Array>} Courses array
   */
  fetchCoursesByCategoryId: async (categoryId) => {
    try {
      console.log(' Fetching courses for course category:', categoryId);
      //  FIXED: Use the correct endpoint for courses by course category
      const response = await fetch(`${API_BASE_URL}/courses?categoryid=${categoryId}`, {
        method: 'GET',
        headers: getHeaders()
      });
      const data = await handleResponse(response);
      console.log(' Courses fetched for course category:', categoryId, data);
      
      // FIXED: Handle the correct response structure
      if (data && data.courses && Array.isArray(data.courses)) {
        return data.courses;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        console.warn('Unexpected courses response format:', data);
        return [];
      }
    } catch (error) {
      console.error(' Error fetching courses by course category:', error);
      throw error;
    }
  },

  /**
   *  NEW: Fetch all courses across all categories
   * Useful for getting a complete list of courses
   * @returns {Promise<Array>} All courses array
   */
  fetchAllCourses: async () => {
    try {
      console.log(' Fetching all courses...');
      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: 'GET',
        headers: getHeaders()
      });
      const data = await handleResponse(response);
      console.log(' All courses fetched:', data);
      
      if (data && data.courses && Array.isArray(data.courses)) {
        return data.courses;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        console.warn('Unexpected all courses response format:', data);
        return [];
      }
    } catch (error) {
      console.error(' Error fetching all courses:', error);
      throw error;
    }
  },

  /**
   * Fetch question categories by course ID
   * @param {number} courseId - The course ID
   * @returns {Promise<Object>} Question categories for the specific course
   */
  fetchQuestionCategoriesByCourse: async (courseId) => {
    try {
      console.log(' Fetching question categories for course:', courseId);
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      const response = await fetch(`${API_BASE_URL}/question_categories?courseid=${courseId}`, {
        method: 'GET',
        headers: getHeaders()
      });
      const data = await handleResponse(response);
      console.log(' Question categories for course fetched:', data);
      return data;
    } catch (error) {
      console.error(' Error fetching question categories by course:', error);
      throw error;
    }
  },

  /**
   *  NEW: Get course details by course ID
   * @param {number} courseId - The course ID
   * @returns {Promise<Object>} Course details
   */
  fetchCourseById: async (courseId) => {
    try {
      console.log(' Fetching course details for:', courseId);
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        method: 'GET',
        headers: getHeaders()
      });
      const data = await handleResponse(response);
      console.log(' Course details fetched:', data);
      return data;
    } catch (error) {
      console.error(' Error fetching course details:', error);
      throw error;
    }
  },

  /**
   * Create a new question category
   * @param {Object} categoryData - The category data
   * @param {string} categoryData.name - Category name
   * @param {string} [categoryData.info] - Category description
   * @param {number} [categoryData.parent] - Parent category ID
   * @param {number} [categoryData.contextid] - Context ID
   * @returns {Promise<Object>} Created category
   */
  createQuestionCategory: async (categoryData) => {
    try {
      console.log(' Creating new question category:', categoryData);
      if (!categoryData.name || !categoryData.name.trim()) {
        throw new Error('Category name is required');
      }
      const payload = {
        name: categoryData.name.trim(),
        info: categoryData.info || '',
        parent: categoryData.parent || 0,
        contextid: categoryData.contextid || 0,
        infoformat: 1,
        sortorder: 999
      };
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await handleResponse(response);
      console.log(' Question category created successfully:', data);
      return data;
    } catch (error) {
      console.error(' Error creating question category:', error);
      throw error;
    }
  },

  /**
   * Update a question category
   * @param {number} categoryId - The category ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} Updated category
   */
  updateQuestionCategory: async (categoryId, updateData) => {
    try {
      console.log(' Updating question category:', categoryId, updateData);
      if (!categoryId) {
        throw new Error('Category ID is required');
      }
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData)
      });
      const data = await handleResponse(response);
      console.log(' Question category updated successfully:', data);
      return data;
    } catch (error) {
      console.error(' Error updating question category:', error);
      throw error;
    }
  },



  /**
   * Move category to different parent
   * @param {number} categoryId - The category ID to move
   * @param {number} newParentId - The new parent category ID (0 for root)
   * @returns {Promise<Object>} Updated category
   */
  moveCategoryToParent: async (categoryId, newParentId) => {
    try {
      console.log('Moving category to new parent:', { categoryId, newParentId });
      return await categoriesAPI.updateQuestionCategory(categoryId, {
        parent: newParentId || 0
      });
    } catch (error) {
      console.error(' Error moving category:', error);
      throw error;
    }
  },

  /**
   * Bulk delete categories
   * @param {number[]} categoryIds - Array of category IDs to delete
   * @returns {Promise<Object>} Result summary
   */
  bulkDeleteCategories: async (categoryIds) => {
    try {
      console.log(' Bulk deleting categories:', categoryIds);
      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new Error('Category IDs array is required');
      }
      const results = {
        successful: [],
        failed: [],
        total: categoryIds.length
      };
      for (const categoryId of categoryIds) {
        try {
          await categoriesAPI.deleteQuestionCategory(categoryId);
          results.successful.push(categoryId);
        } catch (error) {
          results.failed.push({ categoryId, error: error.message });
        }
      }
      console.log(' Bulk delete completed:', results);
      return results;
    } catch (error) {
      console.error(' Error in bulk delete:', error);
      throw error;
    }
  },

  /**
   *  NEW: Search courses by name or criteria
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Filtered courses
   */
  searchCourses: async (searchTerm, filters = {}) => {
    try {
      console.log(' Searching courses:', { searchTerm, filters });
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.categoryId) params.append('categoryid', filters.categoryId);
      if (filters.visible !== undefined) params.append('visible', filters.visible);
      
      const response = await fetch(`${API_BASE_URL}/courses?${params.toString()}`, {
        method: 'GET',
        headers: getHeaders()
      });
      const data = await handleResponse(response);
      console.log(' Course search results:', data);
      
      if (data && data.courses && Array.isArray(data.courses)) {
        return data.courses;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        return [];
      }
    } catch (error) {
      console.error(' Error searching courses:', error);
      throw error;
    }
  }
};

/**
 * React hook for managing categories with loading states
 * @returns {Object} Hook utilities for category management
 */
export const useCategoriesAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (apiFunction, ...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction(...args);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      console.error(' Categories API Error:', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    clearError: useCallback(() => setError(null), []),

    // Course categories (main Moodle categories)
    fetchCourseCategories: useCallback(
      (...args) => apiCall(categoriesAPI.fetchCourseCategories, ...args),
      [apiCall]
    ),

    // Question categories
    fetchQuestionCategories: useCallback(
      (...args) => apiCall(categoriesAPI.fetchQuestionCategories, ...args),
      [apiCall]
    ),
    fetchQuestionCategoriesByCourse: useCallback(
      (...args) => apiCall(categoriesAPI.fetchQuestionCategoriesByCourse, ...args),
      [apiCall]
    ),

    // Courses
    fetchCoursesByCategoryId: useCallback(
      (...args) => apiCall(categoriesAPI.fetchCoursesByCategoryId, ...args),
      [apiCall]
    ),
    fetchAllCourses: useCallback(
      (...args) => apiCall(categoriesAPI.fetchAllCourses, ...args),
      [apiCall]
    ),
    fetchCourseById: useCallback(
      (...args) => apiCall(categoriesAPI.fetchCourseById, ...args),
      [apiCall]
    ),
    searchCourses: useCallback(
      (...args) => apiCall(categoriesAPI.searchCourses, ...args),
      [apiCall]
    ),

    // Category management
    createCategory: useCallback(
      (...args) => apiCall(categoriesAPI.createQuestionCategory, ...args),
      [apiCall]
    ),
    updateCategory: useCallback(
      (...args) => apiCall(categoriesAPI.updateQuestionCategory, ...args),
      [apiCall]
    ),
    deleteCategory: useCallback(
      (...args) => apiCall(categoriesAPI.deleteQuestionCategory, ...args),
      [apiCall]
    ),

    // Advanced operations
    moveCategory: useCallback(
      (...args) => apiCall(categoriesAPI.moveCategoryToParent, ...args),
      [apiCall]
    ),
    bulkDeleteCategories: useCallback(
      (...args) => apiCall(categoriesAPI.bulkDeleteCategories, ...args),
      [apiCall]
    )
  };
};

export default categoriesAPI;
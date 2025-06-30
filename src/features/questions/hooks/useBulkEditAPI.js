// src/components/questions/hooks/useBulkEditAPI.js - FIXED VERSION
import { useState, useEffect, useCallback, useMemo } from 'react';

//  SHARED API UTILITIES
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

// Handle API responses
const handleAPIResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usernameoremail');
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// TAGS API HOOK
export const useTags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTags = useCallback(async () => {
    console.log(' Fetching tags from API...');
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Try Laravel API first
        try {
          const response = await fetch(`${API_BASE_URL}/questions/tags`, {
            method: 'GET',
            headers: getAuthHeaders()
          });

          if (response.ok) {
            const data = await handleAPIResponse(response);
            console.log(' Laravel API tags response:', data);
            
            // Handle different response formats
            let apiTags = [];
            if (Array.isArray(data)) {
              apiTags = data;
            } else if (Array.isArray(data.tags)) {
              apiTags = data.tags;
            } else if (Array.isArray(data.data)) {
              apiTags = data.data;
            }

            // Extract and normalize tag names
            const tagNames = apiTags.map(tag => {
              if (typeof tag === 'string') return tag.trim().toLowerCase();
              return (tag.name || tag.tag_name || tag.text || tag.value || String(tag)).trim().toLowerCase();
            }).filter(tag => tag && tag.length > 0);

            if (tagNames.length > 0) {
              const uniqueTags = [...new Set(tagNames)].sort();
              setTags(uniqueTags);
              console.log(`Loaded ${uniqueTags.length} tags from Laravel API`);
              return;
            }
          }
        } catch (laravelError) {
          console.warn(' Laravel API failed:', laravelError);
        }
      }

      // Fallback to default tags
      console.log(' Using fallback tags...');
      const fallbackTags = [
        'easy', 'medium', 'hard',
        'programming', 'mathematics', 'science', 'language', 'history',
        'quiz', 'exam', 'practice', 'assignment', 'homework',
        'multichoice', 'truefalse', 'essay', 'shortanswer',
        'javascript', 'python', 'java', 'html', 'css', 'database'
      ];
      
      setTags(fallbackTags);
      console.log(` Using ${fallbackTags.length} fallback tags`);

    } catch (err) {
      console.error(' Error fetching tags:', err);
      setError(err.message);
      
      // Minimal fallback
      const minimalTags = ['easy', 'medium', 'hard', 'quiz', 'exam'];
      setTags(minimalTags);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCustomTag = useCallback((newTag) => {
    if (newTag && typeof newTag === 'string') {
      const normalizedTag = newTag.trim().toLowerCase();
      if (normalizedTag && !tags.includes(normalizedTag)) {
        setTags(prev => [...prev, normalizedTag].sort());
        console.log(' Added custom tag:', normalizedTag);
        return true;
      }
    }
    return false;
  }, [tags]);

  const refreshTags = useCallback(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    tags,
    loading,
    error,
    addCustomTag,
    refreshTags
  };
};

//  CATEGORIES API HOOK
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    console.log(' Fetching categories from API...');
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/questions/categories`, {
            method: 'GET',
            headers: getAuthHeaders()
          });

          if (response.ok) {
            const data = await handleAPIResponse(response);
            console.log(' Categories API response:', data);
            
            // Handle different response formats
            let apiCategories = [];
            if (Array.isArray(data)) {
              apiCategories = data;
            } else if (Array.isArray(data.categories)) {
              apiCategories = data.categories;
            } else if (Array.isArray(data.data)) {
              apiCategories = data.data;
            }

            // Normalize categories
            const normalizedCategories = apiCategories.map(category => {
              if (typeof category === 'string') {
                return { value: category, label: category };
              } else if (typeof category === 'object') {
                return {
                  value: category.id || category.value || category.name,
                  label: category.name || category.label || category.title || String(category.id || category.value)
                };
              }
              return { value: String(category), label: String(category) };
            }).filter(cat => cat.value && cat.label);

            setCategories(normalizedCategories);
            console.log(` Loaded ${normalizedCategories.length} categories from API`);
            return;
          }
        } catch (laravelError) {
          console.warn(' Categories API failed:', laravelError);
        }
      }

      // Fallback categories
      console.log(' Using fallback categories...');
      const fallbackCategories = [
        { value: 'programming', label: 'Programming' },
        { value: 'mathematics', label: 'Mathematics' },
        { value: 'science', label: 'Science' },
        { value: 'language', label: 'Language Arts' },
        { value: 'history', label: 'History' },
        { value: 'general', label: 'General Knowledge' }
      ];
      
      setCategories(fallbackCategories);
      console.log(` Using ${fallbackCategories.length} fallback categories`);

    } catch (err) {
      console.error(' Error fetching categories:', err);
      setError(err.message);
      
      // Minimal fallback
      const minimalCategories = [
        { value: 'general', label: 'General' }
      ];
      setCategories(minimalCategories);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCategories = useCallback(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refreshCategories
  };
};

//  SMART TAG REMOVAL HOOK (for selected questions) - FIXED VERSION
export const useSmartTagRemoval = (questions = []) => {
  //  FIX: Use useMemo to prevent infinite loops
  const existingTags = useMemo(() => {
    console.log('Analyzing tags in questions...', questions.length);
    
    const tagMap = new Map(); // tag -> count
    
    questions.forEach((question, index) => {
      console.log(` Question ${index + 1}:`, {
        id: question.id,
        title: question.title?.substring(0, 50) + '...',
        tags: question.tags,
        tagsType: Array.isArray(question.tags) ? 'array' : typeof question.tags,
        tagsLength: question.tags?.length
      });

      if (question.tags && Array.isArray(question.tags)) {
        question.tags.forEach(tag => {
          if (tag && typeof tag === 'string' && tag.trim().length > 0) {
            const normalizedTag = tag.trim().toLowerCase();
            tagMap.set(normalizedTag, (tagMap.get(normalizedTag) || 0) + 1);
            console.log(` Found tag: "${normalizedTag}"`);
          }
        });
      }
    });

    // Convert to array with count info
    const tagsWithCounts = Array.from(tagMap.entries()).map(([tag, count]) => ({
      tag,
      count,
      percentage: Math.round((count / questions.length) * 100)
    })).sort((a, b) => {
      // Sort by count (descending), then alphabetically
      if (b.count !== a.count) return b.count - a.count;
      return a.tag.localeCompare(b.tag);
    });

    console.log(` Final analysis: Found ${tagsWithCounts.length} unique tags in ${questions.length} questions:`, tagsWithCounts);
    return tagsWithCounts;
  }, [questions]); //  FIX: Only depend on questions, not the changing existingTags

  const hasExistingTags = existingTags.length > 0;

  return {
    existingTags,
    hasExistingTags
  };
};

//  BULK OPERATIONS API HOOK
export const useBulkOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bulkUpdateQuestions = useCallback(async (questionIds, updates) => {
    console.log(' Bulk updating questions:', { questionIds: questionIds.length, updates });
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Try Laravel API for bulk updates
        const response = await fetch(`${API_BASE_URL}/questions/bulk-update`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            question_ids: questionIds,
            updates: updates
          })
        });

        if (response.ok) {
          const result = await handleAPIResponse(response);
          console.log(' Bulk update successful:', result);
          return result;
        }
      }

      // Fallback: Individual updates
      console.log(' Falling back to individual updates...');
      const results = [];
      
      for (const questionId of questionIds) {
        try {
          if (updates.status) {
            const response = await fetch(`${API_BASE_URL}/questions/set-question-status`, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({
                questionid: questionId,
                status: updates.status
              })
            });
            
            if (response.ok) {
              const result = await handleAPIResponse(response);
              results.push({ questionId, success: true, result });
            } else {
              results.push({ questionId, success: false, error: 'Status update failed' });
            }
          }
        } catch (err) {
          results.push({ questionId, success: false, error: err.message });
        }
      }

      console.log(' Individual updates completed:', results);
      return { results, fallback: true };

    } catch (err) {
      console.error(' Bulk update failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateStatus = useCallback(async (questionIds, status) => {
    return bulkUpdateQuestions(questionIds, { status });
  }, [bulkUpdateQuestions]);

  return {
    loading,
    error,
    bulkUpdateQuestions,
    bulkUpdateStatus
  };
};

//  COMBINED HOOK FOR BULK EDIT COMPONENTS
// export const useBulkEditAPI = (selectedQuestions = []) => {
//   const tags = useTags();
//   const categories = useCategories();
//   const smartTagRemoval = useSmartTagRemoval(selectedQuestions);
//   const bulkOperations = useBulkOperations();

//   const isLoading = tags.loading || categories.loading || bulkOperations.loading;
//   const hasErrors = tags.error || categories.error || bulkOperations.error;

//   const refreshAll = useCallback(() => {
//     tags.refreshTags();
//     categories.refreshCategories();
//   }, [tags.refreshTags, categories.refreshCategories]);

//   return {
//     // Tags
//     tags: tags.tags,
//     tagsLoading: tags.loading,
//     tagsError: tags.error,
//     addCustomTag: tags.addCustomTag,
//     refreshTags: tags.refreshTags,

//     // Categories  
//     categories: categories.categories,
//     categoriesLoading: categories.loading,
//     categoriesError: categories.error,
//     refreshCategories: categories.refreshCategories,

//     // Smart tag removal
//     existingTags: smartTagRemoval.existingTags,
//     hasExistingTags: smartTagRemoval.hasExistingTags,

//     // Bulk operations
//     bulkUpdateQuestions: bulkOperations.bulkUpdateQuestions,
//     bulkUpdateStatus: bulkOperations.bulkUpdateStatus,
//     bulkLoading: bulkOperations.loading,
//     bulkError: bulkOperations.error,

//     // Combined states
//     isLoading,
//     hasErrors,
//     refreshAll
//   };
// };
// ...
export const useBulkEditAPI = (selectedQuestions = []) => {
  const tags = useTags();
  const categories = useCategories();
  // FIX: Only analyze tags from selectedQuestions, not allQuestions
  const smartTagRemoval = useSmartTagRemoval(selectedQuestions);
  const bulkOperations = useBulkOperations();

  const isLoading = tags.loading || categories.loading || bulkOperations.loading;
  const hasErrors = tags.error || categories.error || bulkOperations.error;

  const refreshAll = useCallback(() => {
    tags.refreshTags();
    categories.refreshCategories();
  }, [tags.refreshTags, categories.refreshCategories]);

  return {
    // Tags
    tags: tags.tags,
    tagsLoading: tags.loading,
    tagsError: tags.error,
    addCustomTag: tags.addCustomTag,
    refreshTags: tags.refreshTags,

    // Categories  
    categories: categories.categories,
    categoriesLoading: categories.loading,
    categoriesError: categories.error,
    refreshCategories: categories.refreshCategories,

    // Smart tag removal (now only for selected questions)
    existingTags: smartTagRemoval.existingTags,
    hasExistingTags: smartTagRemoval.hasExistingTags,

    // Bulk operations
    bulkUpdateQuestions: bulkOperations.bulkUpdateQuestions,
    bulkUpdateStatus: bulkOperations.bulkUpdateStatus,
    bulkLoading: bulkOperations.loading,
    bulkError: bulkOperations.error,

    // Combined states
    isLoading,
    hasErrors,
    refreshAll
  };
};
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
// import { questionAPI } from '@/api/questionAPI';

const fetchTagsForAllQuestions = async (questionIds) => {
  console.log(' fetchTagsForAllQuestions called but questions already have tags');
  // Return empty object since questions already have tags from main API
  const emptyResult = {};
  questionIds.forEach(id => {
    emptyResult[id] = [];
  });
  return emptyResult;
};
//   return await questionAPI.getTagsForMultipleQuestions(questionIds);
// };
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
  
  choices: (apiQuestion.answers || []).map(answer => ({
    id: answer.id,
    text: answer.answer,
    isCorrect: answer.fraction > 0,
    feedback: answer.feedback || ''
  })),
  
  //  CRITICAL: Enhanced tag processing based on your API format
  tags: processTagsFromAPI(apiQuestion),
  
  categoryId: apiQuestion.category,
  categoryName: apiQuestion.category_name || '',
  contextid: apiQuestion.contextid,
  usage: (apiQuestion.usages || []).length,
  lastUsed: apiQuestion.usages && apiQuestion.usages.length > 0 ? 'Recently' : 'Never',
  comments: 0,
  stamp: apiQuestion.stamp,
  versionid: apiQuestion.versionid,
  questionbankentryid: apiQuestion.questionbankentryid,
  idnumber: apiQuestion.idnumber || apiQuestion.id
});
// NEW: Process tags from API with multiple fallback strategies
function processTagsFromAPI(apiQuestion) {
  console.log(` Processing tags for question ${apiQuestion.id}:`, {
    tags: apiQuestion.tags,
    questiontags: apiQuestion.questiontags,
    tagnames: apiQuestion.tagnames
  });

  let rawTags = [];
  
  // Strategy 1: Direct tags array (your current API returns empty array initially)
  if (apiQuestion.tags && Array.isArray(apiQuestion.tags)) {
    rawTags = apiQuestion.tags;
    console.log(`   Using direct tags array: ${rawTags.length} items`);
  }
  // Strategy 2: Questiontags property
  else if (apiQuestion.questiontags && Array.isArray(apiQuestion.questiontags)) {
    rawTags = apiQuestion.questiontags;
    console.log(`   Using questiontags array: ${rawTags.length} items`);
  }
  // Strategy 3: Tag names array
  else if (apiQuestion.tagnames && Array.isArray(apiQuestion.tagnames)) {
    rawTags = apiQuestion.tagnames;
    console.log(`   Using tagnames array: ${rawTags.length} items`);
  }
  // Strategy 4: Fetch tags separately (since your API might return empty initially)
  else {
    console.log(`   No tags found in question data for ID ${apiQuestion.id}`);
    // We'll handle this with a separate API call below
    return [];
  }

  // Process the raw tags into consistent format
  const processedTags = rawTags.map((tag, index) => {
    if (typeof tag === 'string') {
      // Simple string tag
      return {
        id: tag,
        name: tag,
        rawname: tag,
        isstandard: false
      };
    } else if (typeof tag === 'number') {
      // Numeric tag ID
      return {
        id: String(tag),
        name: String(tag),
        rawname: String(tag),
        isstandard: false
      };
    } else if (typeof tag === 'object' && tag !== null) {
      // Object tag - normalize to consistent format
      return {
        id: String(tag.id || tag.tagid || tag.name || index),
        name: tag.name || tag.rawname || tag.text || String(tag.id || index),
        rawname: tag.rawname || tag.name || tag.text || String(tag.id || index),
        isstandard: Boolean(tag.isstandard),
        description: tag.description || '',
        flag: tag.flag || 0
      };
    }
    
    // Fallback for unknown format
    console.warn(` Unknown tag format for question ${apiQuestion.id}:`, tag);
    return {
      id: String(index),
      name: String(tag),
      rawname: String(tag),
      isstandard: false
    };
  }).filter(tag => tag && tag.id && tag.name);

  console.log(`   Processed ${processedTags.length} tags for question ${apiQuestion.id}`);
  return processedTags;
}
// ============================================================================
// FIXED FILTERING STRATEGIES WITH CORRECT API URLS
// ============================================================================

class QuestionFilterService {
  constructor(apiClient) {
    this.apiClient = apiClient;
     this.tagFilteredCache = new Map();
  }

  // Strategy 1: Question categories (fastest when available)
  // UPDATED: Enhanced fetchByCategories with client-side tag filtering
  async fetchByCategories(courseId, filters, page, perPage) {
  try {
    console.log('Strategy 1: Categories + Smart tag filtering');
    
    //  STEP 1: Fetch categories for the course
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

    console.log(` Found ${categories.length} categories for course ${courseId}`);

    //  STEP 2: Check if tag filtering is needed
    const hasTagFilter = filters.tagFilter && Array.isArray(filters.tagFilter) && filters.tagFilter.length > 0;
    const hasOtherFilters = filters.searchQuery?.trim() || filters.status !== 'All' || filters.type !== 'All';

    console.log(' Filter analysis:', {
      hasTagFilter,
      tagCount: hasTagFilter ? filters.tagFilter.length : 0,
      hasOtherFilters,
      searchQuery: filters.searchQuery,
      status: filters.status,
      type: filters.type
    });

    //  STEP 3: Route to appropriate strategy
    if (hasTagFilter) {
      console.log(' Using tag filtering strategy');
      return await this.fetchWithTagFiltering(courseId, filters, page, perPage);
    } else if (hasOtherFilters) {
      console.log(' Using filtered strategy (no tags)');
      return await this.fetchWithoutTagFiltering(courseId, filters, page, perPage);
    } else {
      console.log(' Using normal pagination strategy');
      return await this.fetchWithoutTagFiltering(courseId, filters, page, perPage);
    }

  } catch (error) {
    console.error(' fetchByCategories error:', error);
    return { success: false, reason: error.message };
  }
  }



  //  //  NEW: Fetch without tag filtering (normal pagination)
  // async fetchByCategories(courseId, filters, page, perPage) {
  //   try {
  //     console.log(' Strategy 1: Categories + Smart tag filtering');
      
  //     // ✅ STEP 1: Fetch categories for the course
  //     const categoriesUrl = `${API_BASE_URL}/questions/question_categories?courseid=${courseId}`;
  //     const categoriesData = await this.apiClient.request(categoriesUrl);

  //     let categories = [];
  //     if (Array.isArray(categoriesData)) {
  //       categories = categoriesData;
  //     } else if (categoriesData.categories) {
  //       categories = categoriesData.categories;
  //     }

  //     if (categories.length === 0) {
  //       return { success: false, reason: 'No categories found' };
  //     }

  //     console.log(`📂 Found ${categories.length} categories for course ${courseId}`);

  //     // ✅ STEP 2: Check if tag filtering is needed
  //     const hasTagFilter = filters.tagFilter && Array.isArray(filters.tagFilter) && filters.tagFilter.length > 0;
  //     const hasOtherFilters = filters.searchQuery?.trim() || filters.status !== 'All' || filters.type !== 'All';

  //     console.log('🎯 Filter analysis:', {
  //       hasTagFilter,
  //       tagCount: hasTagFilter ? filters.tagFilter.length : 0,
  //       hasOtherFilters,
  //       searchQuery: filters.searchQuery,
  //       status: filters.status,
  //       type: filters.type
  //     });

  //     //  STEP 3: Route to appropriate strategy
  //     if (hasTagFilter) {
  //       console.log(' Using tag filtering strategy');
  //       return await this.fetchWithTagFiltering(courseId, filters, page, perPage);
  //     } else {
  //       console.log(' Using normal pagination strategy');
  //       return await this.fetchWithoutTagFiltering(courseId, filters, page, perPage);
  //     }

  //   } catch (error) {
  //     console.error(' fetchByCategories error:', error);
  //     return { success: false, reason: error.message };
  //   }
  // }
   async fetchWithoutTagFiltering(courseId, filters, page, perPage) {
    try {
      console.log(' Normal fetch strategy - server-side pagination');
      
      const filterParams = this.buildFilterParams(filters);
      
      const paramsObj = {
        page: page.toString(),
        per_page: perPage.toString(),
        ...filterParams
      };

      const params = new URLSearchParams(paramsObj);
      const questionsUrl = `${API_BASE_URL}/questions/filters?${params}`;
      
      console.log(' API call:', questionsUrl);
      const questionsData = await this.apiClient.request(questionsUrl);

      if (!questionsData.questions || questionsData.questions.length === 0) {
        console.log(' No questions found');
        return { success: false, reason: 'No questions found' };
      }

      console.log(` Normal fetch: ${questionsData.questions.length} questions, page ${page}/${questionsData.last_page || 1}`);

      return {
        success: true,
        data: {
          questions: questionsData.questions,
          total: questionsData.total,
          current_page: questionsData.current_page || page,
          per_page: questionsData.per_page || perPage,
          last_page: questionsData.last_page || Math.ceil(questionsData.total / perPage),
          client_filtered: false
        },
        method: 'categories-normal'
      };

    } catch (error) {
      console.error(' fetchWithoutTagFiltering error:', error);
      return { success: false, reason: error.message };
    }
  }
// NEW: Server-side tag filtering using your /questions/tag endpoint
// NEW: Server-side tag filtering using your /questions/tag endpoint
async fetchWithServerSideTagFiltering(courseId, filters, page, perPage) {
  try {
    console.log(' Strategy: Server-side tag filtering');
    
    if (!filters.tagFilter || !Array.isArray(filters.tagFilter) || filters.tagFilter.length === 0) {
      console.log(' No tag filter provided');
      return { success: false, reason: 'No tag filter provided' };
    }

    console.log(` Filtering by tags: [${filters.tagFilter.join(', ')}]`);

    // Use the questionAPI method for better error handling  
    const questionsWithTags = await questionAPI.getQuestionsByTags(filters.tagFilter);

    console.log(' Raw server response:', questionsWithTags);
    console.log(` Found ${questionsWithTags ? questionsWithTags.length : 0} questions with matching tags`);

    if (!questionsWithTags || questionsWithTags.length === 0) {
      console.log(' No questions found with selected tags');
      return {
        success: true,
        data: {
          questions: [],
          total: 0,
          current_page: 1,
          per_page: perPage,
          last_page: 1,
          server_tag_filtered: true
        },
        method: 'server-side-tag-filtered'
      };
    }

    // Apply additional filters (course, category, status, type, search)
    let filteredQuestions = [...questionsWithTags]; // Create a copy

    // Filter by course if specified
    if (courseId && courseId !== 'All') {
      filteredQuestions = filteredQuestions.filter(q => 
        q.courseid === parseInt(courseId) || 
        q.course_id === parseInt(courseId) || 
        q.contextid === parseInt(courseId)
      );
      console.log(`🎯 Course filter: ${filteredQuestions.length} questions remain`);
    }

    // Filter by category if specified
    if (filters.category && filters.category !== 'All') {
      filteredQuestions = filteredQuestions.filter(q => 
        q.category === parseInt(filters.category) || 
        q.categoryid === parseInt(filters.category)
      );
      console.log(` Category filter: ${filteredQuestions.length} questions remain`);
    }

    // Filter by status if specified
    if (filters.status && filters.status !== 'All') {
      filteredQuestions = filteredQuestions.filter(q => 
        q.status === filters.status.toLowerCase()
      );
      console.log(` Status filter: ${filteredQuestions.length} questions remain`);
    }

    // Filter by type if specified
    if (filters.type && filters.type !== 'All') {
      filteredQuestions = filteredQuestions.filter(q => 
        q.qtype === filters.type
      );
      console.log(` Type filter: ${filteredQuestions.length} questions remain`);
    }

    // Filter by search query if specified
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filteredQuestions = filteredQuestions.filter(q => 
        (q.name && q.name.toLowerCase().includes(query)) ||
        (q.questiontext && q.questiontext.toLowerCase().includes(query))
      );
      console.log(` Search filter: ${filteredQuestions.length} questions remain`);
    }

    // Apply pagination
    const totalQuestions = filteredQuestions.length;
    const totalPages = Math.ceil(totalQuestions / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

    console.log(`📄 Server-side pagination: Page ${page}/${totalPages}, showing ${paginatedQuestions.length} of ${totalQuestions}`);

    return {
      success: true,
      data: {
        questions: paginatedQuestions,
        total: totalQuestions,
        current_page: page,
        per_page: perPage,
        last_page: totalPages,
        server_tag_filtered: true,
        applied_filters: {
          tags: filters.tagFilter,
          course: courseId,
          category: filters.category,
          status: filters.status,
          type: filters.type,
          search: filters.searchQuery
        }
      },
      method: 'server-side-tag-filtered'
    };

  } catch (error) {
    console.error(' Server-side tag filtering failed:', error);
    return { success: false, reason: error.message };
  }
}
   //  NEW: Fetch with tag filtering (get all, then filter and paginate)
async fetchWithTagFiltering(courseId, filters, page, perPage) {
  try {
    console.log(' Smart tag filtering strategy selection');
    
    const tagCount = filters.tagFilter ? filters.tagFilter.length : 0;
    
    // Strategy 1: Try server-side tag filtering first (more efficient)
    if (false && tagCount > 0 && tagCount <= 10) {
      console.log(' Trying server-side tag filtering first');
      const serverResult = await this.fetchWithServerSideTagFiltering(courseId, filters, page, perPage);
      if (serverResult && serverResult.success) {
        return serverResult;
      }
      console.log(' Server-side tag filtering failed, falling back to client-side');
    }

    // Strategy 2: Fall back to client-side filtering
    console.log(' Using client-side tag filtering');
    
    // Use your existing client-side tag filtering logic
    const cacheKey = `tag-filter-${courseId}-${filters.category}-${filters.status}-${filters.type}-${encodeURIComponent(filters.searchQuery || '')}-${JSON.stringify(filters.tagFilter)}`;
    
    console.log(' Cache key:', cacheKey);

    // Check cache first
    let allFilteredQuestions = this.tagFilteredCache.get(cacheKey);
    
    if (allFilteredQuestions) {
      console.log('⚡ Cache HIT - using cached filtered results');
      console.log(` Cached results: ${allFilteredQuestions.length} questions`);
    } else {
      console.log(' Cache MISS - fetching all questions for client-side filtering');
      
      // Fetch ALL questions for this course
      const allQuestions = await this.fetchAllQuestionsForTagFiltering(courseId, filters);
      
      if (!allQuestions || allQuestions.length === 0) {
        console.log(' No questions found for client-side tag filtering');
        return { 
          success: true, 
          data: {
            questions: [],
            total: 0,
            current_page: 1,
            per_page: perPage,
            last_page: 1,
            client_filtered: true
          },
          method: 'client-side-tag-filtered' 
        };
      }

      console.log(` Total questions fetched: ${allQuestions.length}`);

      // Apply tag filtering to all questions
      allFilteredQuestions = this.applyTagFilter(allQuestions, filters.tagFilter);
      
      // Cache the filtered results
      this.tagFilteredCache.set(cacheKey, allFilteredQuestions);
      
      // Set cache expiration
      setTimeout(() => {
        if (this.tagFilteredCache.has(cacheKey)) {
          console.log('🗑️ Cache expired for:', cacheKey);
          this.tagFilteredCache.delete(cacheKey);
        }
      }, 5 * 60 * 1000); // 5 minutes
      
      console.log(`🎯 Client-side tag filtering results: ${allQuestions.length} → ${allFilteredQuestions.length} questions`);
    }

    // Apply pagination to the filtered results
    const paginatedResult = this.applyClientPagination(allFilteredQuestions, page, perPage);
    const totalPages = Math.ceil(allFilteredQuestions.length / perPage);

    console.log(` Pagination: Page ${page}/${totalPages}, showing ${paginatedResult.questions.length} of ${allFilteredQuestions.length} total`);

    return {
      success: true,
      data: {
        questions: paginatedResult.questions,
        total: allFilteredQuestions.length,
        current_page: page,
        per_page: perPage,
        last_page: totalPages,
        client_filtered: true,
        tag_filtered_total: allFilteredQuestions.length,
        cache_used: allFilteredQuestions === this.tagFilteredCache.get(cacheKey)
      },
      method: 'client-side-tag-filtered'
    };

  } catch (error) {
    console.error(' Tag filtering strategy failed:', error);
    return { 
      success: false, 
      reason: error.message,
      method: 'tag-filtering-failed'
    };
  }
}


  //  NEW: Fetch all questions for tag filtering
 async fetchAllQuestionsForTagFiltering(courseId, filters) {
    try {
      console.log(' Fetching ALL questions for comprehensive tag filtering...');
      
      const filterParams = this.buildFilterParams(filters);
      let allQuestions = [];
      let currentPage = 1;
      const perPage = 100; // Fetch in chunks of 100
      let hasMorePages = true;
      let totalExpected = 0;

      //  First, get the total count
      const initialParams = new URLSearchParams({
        page: '1',
        per_page: '1',
        ...filterParams
      });
      
      const initialUrl = `${API_BASE_URL}/questions/filters?${initialParams}`;
      const initialData = await this.apiClient.request(initialUrl);
      totalExpected = initialData.total || 0;
      
      console.log(` Total questions expected: ${totalExpected}`);

      //  Now fetch all pages
      while (hasMorePages && currentPage <= 20) { // Safety limit: max 20 pages (2000 questions)
        const paramsObj = {
          page: currentPage.toString(),
          per_page: perPage.toString(),
          ...filterParams
        };

        const params = new URLSearchParams(paramsObj);
        const questionsUrl = `${API_BASE_URL}/questions/filters?${params}`;
        
        try {
          console.log(` Fetching page ${currentPage}...`);
          const questionsData = await this.apiClient.request(questionsUrl);
          
          if (questionsData.questions && questionsData.questions.length > 0) {
            allQuestions = allQuestions.concat(questionsData.questions);
            
            const progress = Math.round((allQuestions.length / totalExpected) * 100);
            console.log(` Progress: ${allQuestions.length}/${totalExpected} (${progress}%) - Page ${currentPage}`);
            
            // Check if there are more pages
            const totalPages = questionsData.last_page || Math.ceil(questionsData.total / perPage);
            hasMorePages = currentPage < totalPages && questionsData.questions.length === perPage;
            currentPage++;
            
            // Add small delay to avoid overwhelming the server
            if (currentPage % 5 === 0) {
              console.log('⏳ Brief pause to avoid server overload...');
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } else {
            console.log(` No more questions on page ${currentPage}`);
            hasMorePages = false;
          }
        } catch (error) {
          console.error(` Error fetching page ${currentPage}:`, error);
          hasMorePages = false;
          break;
        }
      }

      console.log(` Fetching complete: ${allQuestions.length} total questions collected`);
      
      if (allQuestions.length !== totalExpected && totalExpected > 0) {
        console.warn(` Expected ${totalExpected} questions, but got ${allQuestions.length}`);
      }

      return allQuestions;

    } catch (error) {
      console.error(' Error in fetchAllQuestionsForTagFiltering:', error);
      return [];
    }
  }

//  //  NEW: Calculate how many questions to fetch for filtering
//   calculateFetchSize(filters, perPage) {
//           const hasTagFilter = filters.tagFilter && Array.isArray(filters.tagFilter) && filters.tagFilter.length > 0;

    
//     if (hasTagFilter) {
//       // Fetch more questions when tag filtering to ensure we have enough after filtering
//       return Math.max(100, perPage * 10); // Fetch at least 100 or 10x the page size
//     }
    
//     return perPage;
//   }

  //  NEW: Apply tag filtering on client side
applyTagFilter(questions, tagFilter) {
  if (!tagFilter || !Array.isArray(tagFilter) || tagFilter.length === 0) {
    console.log(' No tag filter - returning all questions');
    return questions;
  }

  console.log(` Applying tag filter: [${tagFilter.join(', ')}]`);

  let matchedQuestions = 0;
  let questionsWithTags = 0;
  let questionsWithoutTags = 0;
  let debugInfo = [];

  const filteredQuestions = questions.filter((question, index) => {
    if (!question.tags || !Array.isArray(question.tags) || question.tags.length === 0) {
      questionsWithoutTags++;
      return false;
    }
    questionsWithTags++;

    //  CRITICAL: Ensure consistent string comparison
    const questionTagIds = question.tags.map(tag => {
      const extractedId = this.extractTagId(tag);
      return String(extractedId); // Force string conversion
    }).filter(id => id && id !== 'null' && id !== 'undefined');

    const filterTagIds = tagFilter.map(id => String(id)); // Force string conversion
    const hasMatchingTag = questionTagIds.some(tagId => filterTagIds.includes(tagId));
    if (hasMatchingTag) matchedQuestions++;

    // Debug info
    if (index < 5) {
      debugInfo.push({
        questionId: question.id,
        questionTitle: question.title?.substring(0, 50) + '...',
        questionTags: question.tags,
        extractedTagIds: questionTagIds,
        filterTagIds: filterTagIds,
        matches: questionTagIds.filter(tagId => filterTagIds.includes(tagId))
      });
    }

    return hasMatchingTag;
  });
    //  Enhanced debugging for first few questions
  //   if (index < 5) {
  //     debugInfo.push({
  //       questionId: question.id,
  //       questionTitle: question.title?.substring(0, 50) + '...',
  //       questionTags: question.tags,
  //       extractedTagIds: questionTagIds,
  //       filterTagIds: filterTagIds,
  //       matches: questionTagIds.filter(tagId => filterTagIds.includes(tagId))
  //     });
  //   }

  //   // const hasMatchingTag = questionTagIds.some(tagId => filterTagIds.includes(tagId));
  //   // if (hasMatchingTag) matchedQuestions++;
    
  //   return hasMatchingTag;
  // });

  //  Enhanced logging with debug info
  console.log(`Tag filtering summary:`);
  console.log(`    Total questions processed: ${questions.length}`);
  console.log(`    Questions with tags: ${questionsWithTags}`);
  console.log(`    Questions without tags: ${questionsWithoutTags}`);
  console.log(`    Questions matching filter: ${matchedQuestions}`);
  console.log(`    Filter efficiency: ${questionsWithTags > 0 ? Math.round((matchedQuestions / questionsWithTags) * 100) : 0}%`);
  
  //  Debug info for first few questions
  if (debugInfo.length > 0) {
    console.log(` Debug info for first ${debugInfo.length} questions:`);
    console.table(debugInfo);
  }

  return filteredQuestions;
}


  //  IMPROVED: Extract tag ID from different tag formats
extractTagId(tag) {
  if (tag === null || tag === undefined) {
    console.warn(' Null/undefined tag encountered');
    return null;
  }

  // Always return string for consistent comparison
  if (typeof tag === 'number') {
    return String(tag);
  }
  
  if (typeof tag === 'string') {
    const parsed = parseInt(tag);
    return isNaN(parsed) ? tag : String(parsed);
  }
  
  if (typeof tag === 'object') {
    // Try different possible ID fields
    const possibleIds = [tag.id, tag.tagid, tag.tag_id, tag.tagId];
    for (const id of possibleIds) {
      if (id !== undefined && id !== null) {
        return String(id); //  CRITICAL: Always return string
      }
    }
    
    // Try name as fallback
    if (tag.name) {
      const parsed = parseInt(tag.name);
      return isNaN(parsed) ? tag.name : String(parsed);
    }
    
    console.warn(' Could not extract ID from tag object:', tag);
    return String(tag.id || tag.name || 'unknown');
  }

  console.warn(' Unknown tag type:', typeof tag, tag);
  return String(tag);
}

  //  UNCHANGED: Apply pagination on client side
  applyClientPagination(questions, page, perPage) {
    // Validate inputs
    const validPage = Math.max(1, parseInt(page) || 1);
    const validPerPage = Math.max(1, Math.min(100, parseInt(perPage) || 10)); // Max 100 per page
    
    const totalQuestions = questions.length;
    const totalPages = Math.ceil(totalQuestions / validPerPage);
    const safePage = Math.min(validPage, totalPages || 1);

    const startIndex = (safePage - 1) * validPerPage;
    const endIndex = Math.min(startIndex + validPerPage, totalQuestions);
    const paginatedQuestions = questions.slice(startIndex, endIndex);

    console.log(` Pagination applied: Page ${safePage}/${totalPages}, Items ${startIndex + 1}-${endIndex} of ${totalQuestions}`);

    return {
      questions: paginatedQuestions,
      startIndex,
      endIndex,
      page: safePage,
      perPage: validPerPage,
      totalPages,
      totalQuestions,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1
    };
  }

// Strategy 2: Direct filtering (medium speed) - ADD THIS METHOD
  // Other required methods
  async fetchByDirectFilter(courseId, filters, page, perPage) {
    try {
      console.log(' Strategy 2: Direct filtering');
      
      const hasTagFilter = filters.tagFilter && Array.isArray(filters.tagFilter) && filters.tagFilter.length > 0;
      
      if (hasTagFilter) {
        return await this.fetchWithTagFiltering(courseId, filters, page, perPage);
      }

      return await this.fetchWithoutTagFiltering(courseId, filters, page, perPage);
    } catch (error) {
      console.error(' Direct filter failed:', error);
      return { success: false, reason: error.message };
    }
  }
 async fetchWithClientFilter(courseId, filters, page, perPage) {
    try {
      console.log(' Strategy 3: Client-side filtering');
      
      const hasTagFilter = filters.tagFilter && Array.isArray(filters.tagFilter) && filters.tagFilter.length > 0;
      
      if (hasTagFilter) {
        return await this.fetchWithTagFiltering(courseId, filters, page, perPage);
      }

      return await this.fetchWithoutTagFiltering(courseId, filters, page, perPage);
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }






 // Virtual assignment for courses without proper linking
    createVirtualAssignment(courseId, allQuestions, page, perPage, filters) {
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
      const questionsPerCourse = Math.max(50, Math.floor(allQuestions.length / 8));
      const startIndex = ((courseInt - 1) * questionsPerCourse) % allQuestions.length;
      virtualQuestions = allQuestions.slice(startIndex, startIndex + questionsPerCourse);
    }

    // Apply tag filtering if needed
    const hasTagFilter = filters.tagFilter && Array.isArray(filters.tagFilter) && filters.tagFilter.length > 0;
    if (hasTagFilter) {
      virtualQuestions = this.applyTagFilter(virtualQuestions, filters.tagFilter);
    }

    // Apply pagination
    const paginatedResult = this.applyClientPagination(virtualQuestions, page, perPage);

    return {
      success: true,
      data: {
        questions: paginatedResult.questions,
        total: virtualQuestions.length,
        current_page: page,
        per_page: perPage,
        last_page: Math.ceil(virtualQuestions.length / perPage),
        client_filtered: hasTagFilter
      },
      method: 'virtual-with-tags',
      isVirtual: true
    };
  }





  //  IMPROVED: buildFilterParams with better logic
//  IMPROVED: buildFilterParams with better logic
buildFilterParams(filters) {
  const params = {};

  //  ADD THIS LINE - Filter by course first
  if (filters.courseId && filters.courseId !== 'All') {
    params.courseid = filters.courseId;
  }

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

  return params;
}
  clearTagFilterCache() {
    const cacheSize = this.tagFilteredCache.size;
    console.log(`🧹 Clearing tag filter cache (${cacheSize} entries)`);
    this.tagFilteredCache.clear();
    console.log(' Tag filter cache cleared');
  }


clearTagFilterCacheForCourse(courseId) {
    let cleared = 0;
    console.log(`🧹 Clearing tag filter cache for course: ${courseId}`);
    
    for (const key of this.tagFilteredCache.keys()) {
      if (key.includes(`tag-filter-${courseId}`)) {
        this.tagFilteredCache.delete(key);
        cleared++;
      }
    }
    
    console.log(` Cleared ${cleared} cache entries for course ${courseId}`);
  }



}

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


  // Add category question count state
const [categoryQuestionCount, setCategoryQuestionCount] = useState(0);

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
    questions_count: data.questions?.length,
    client_filtered: data.client_filtered,
    hasTagFilter: Array.isArray(tagFilter) && tagFilter.length > 0
  });

  if (data && Array.isArray(data.questions)) {
    let transformedQuestions = data.questions.map(q => transformQuestion(q, courseId));
    console.log(' Questions already have tags from API response');
    //  NEW: Fetch tags for questions that don't have them
    //    const questionIds = transformedQuestions.map(q => q.id);
    // const tagsByQuestionId = await fetchTagsForAllQuestions(questionIds);
    
    // // If you want to attach tags to each question:
    //  transformedQuestions = transformedQuestions.map(q => ({
    //   ...q,
    //   tags: tagsByQuestionId[q.id] || q.tags || []
    // }));
    
    setQuestions(transformedQuestions);
    setTotalQuestions(data.total);
    setCurrentPage(data.current_page || page);
    
    const totalPages = data.last_page || Math.ceil(data.total / (data.per_page || 10));
    
    if (data.client_filtered) {
      console.log(` Client-side filtering applied: ${transformedQuestions.length} questions shown`);
    }
    
    console.log(` Loaded ${transformedQuestions.length} questions, page ${data.current_page || page}/${totalPages}`);
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
    tagFilter: Array.isArray(tagFilter) ? tagFilter : [],
    tagFilterLength: Array.isArray(tagFilter) ? tagFilter.length : 0,
    searchQuery: debouncedSearchQuery,
    hasFilters: (
      debouncedSearchQuery !== '' || 
      (Array.isArray(tagFilter) && tagFilter.length > 0) || 
      filters.status !== 'All' || 
      filters.type !== 'All'
    )
  };
  
  console.log(' Filter Effect Triggered:', triggerInfo);
  
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
    tagFilter: Array.isArray(tagFilter) ? tagFilter : []
  };
  
  console.log(' Making API call with filters:', filterParams);

  //  FIXED: Properly define tagFilterChanged
  const tagFilterChanged = 
    lastFetchParamsRef.current && 
    !lastFetchParamsRef.current.includes(`"tags":${JSON.stringify(tagFilter)}`);

  const shouldResetPage = 
    (debouncedSearchQuery !== '' || 
     filters.status !== 'All' || 
     filters.type !== 'All' ||
     tagFilterChanged) && 
    currentPage !== 1;

  console.log(' shouldResetPage check:', {
    hasLastFetch: !!lastFetchParamsRef.current,
    pageInLastFetch: lastFetchParamsRef.current ? lastFetchParamsRef.current.includes(`"page":${currentPage}`) : false,
    hasSearch: debouncedSearchQuery !== '',
    hasTagFilter: Array.isArray(tagFilter) && tagFilter.length > 0,
    tagFilterChanged: tagFilterChanged, //  Now properly defined
    hasStatusFilter: filters.status !== 'All',
    hasTypeFilter: filters.type !== 'All',
    result: shouldResetPage
  });

  if (shouldResetPage) {
    console.log(' Resetting to page 1 due to filter change');
    // Clear tag filter cache when filters change
    questionFilterService.clearTagFilterCache();
    setCurrentPage(1);
    fetchQuestionsFromAPI(filterParams, 1, questionsPerPage);
  } else {
    fetchQuestionsFromAPI(filterParams, currentPage, questionsPerPage);
  }
}, [
  filters.courseId, 
  filters.category, 
  filters.status, 
  filters.type,
  debouncedSearchQuery, 
  tagFilter, // This will trigger when tags change
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

const [allTags, setAllTags] = useState([]);

useEffect(() => {
  async function fetchTags() {
    try {
      console.log(' Loading tags for filtering...');
      const tags = await questionAPI.getTags();
      
      if (Array.isArray(tags) && tags.length > 0) {
        console.log(` Loaded ${tags.length} tags for filtering`);
        setAllTags(tags);
      } else {
        console.warn(' No tags found or invalid format');
        setAllTags([]);
      }
    } catch (err) {
      console.error(' Failed to fetch tags:', err);
      setAllTags([]);
    }
  }
  fetchTags();
}, []);
useEffect(() => {
  async function fetchCourses() {
    try {
      const token = localStorage.getItem('token');
      // Update the endpoint below to your actual courses endpoint!
      const res = await fetch(`${API_BASE_URL}/courses?categoryid=0`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      setAvailableCourses(data.courses || []);
    } catch (err) {
      console.error("Failed to load courses", err);
    }
  }
  fetchCourses();
}, []);
  useEffect(() => {
    if (!questions || questions.length === 0) {
      setCategoryQuestionCount(0);
      return;
    }

    // Calculate count based on current filter
    let count = 0;
    
    if (filters.category === 'All') {
      // If "All" is selected, use total questions
      count = totalQuestions || questions.length;
    } else {
      // Count questions that match the selected category
      count = questions.filter(q => {
        const questionCategoryId = String(q.categoryId || q.categoryid || q.category || '');
        const selectedCategoryId = String(filters.category || '');
        return questionCategoryId === selectedCategoryId;
      }).length;
      
      // If no questions match in current page, use totalQuestions as it might be server-filtered
      if (count === 0 && totalQuestions > 0) {
        count = totalQuestions;
      }
    }
    
    console.log(`Category question count: ${count} (category: ${filters.category}, total: ${totalQuestions})`);
    setCategoryQuestionCount(count);
    
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
            questions={questions}
            allQuestions={questions} // Pass all questions for proper counting
            categoryQuestionCount={categoryQuestionCount} // Pass the computed count
          />

          {/* Guard: Require course selection */}
          {!filters.courseId || filters.courseId === 'All' ? (
            <div className="text-center py-8 text-gray-500">
              <p>Please select a course to view questions.</p>
{/*                             
              <button
                onClick={() => {
                  console.log('All questions:', questions);
// Run this in dev console or inside a debug button temporarily:
                const tagMap = {};
                questions.forEach(q => {
                  if (Array.isArray(q.tags)) {
                    q.tags.forEach(tag => {
                      const id = tag.id || tag.tagid;
                      if (id) tagMap[id] = (tagMap[id] || 0) + 1;
                    });
                  }
                });
                console.table(tagMap);


                }}
                style={{ position: 'fixed', top: 10, right: 10, zIndex: 9999 }}
              >
                Log Questions & Tags
              </button> */}
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


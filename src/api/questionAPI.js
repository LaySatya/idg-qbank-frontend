// ============================================================================
// Enhanced: src/api/questionAPI.js - FIXED API URLs and Error Handling
// ============================================================================

export const validateEnvironmentConfig = () => {
  const requiredEnvVars = ['VITE_API_BASE_URL'];
  const missing = requiredEnvVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    console.error(' Missing required environment variables:', missing);
    console.error('Please check your .env file contains:');
    missing.forEach(varName => {
     
    });
    return false;
  }
  
  console.log(' Environment configuration is valid');
  console.log(' API Base URL:', import.meta.env.VITE_API_BASE_URL);
  return true;
};

// Fixed: Use your env variable correctly
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Validate on module load
validateEnvironmentConfig();

// Helper: Auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

// Helper: Handle API responses with better error handling
const handleAPIResponse = async (response) => {
  if (!response.ok) {
 if (response.status === 401) {
  handleSessionExpired();
  throw new Error('Authentication expired');
}
    
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.errors && Array.isArray(errorData.errors)) {
        errorMessage = errorData.errors.join(', ');
      }
    } catch (parseError) {
      console.warn('Failed to parse error response:', parseError);
    }
    
    throw new Error(errorMessage);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  } else {
    const text = await response.text();
    return text || null;
  }
};

// Helper: Map API qtype to internal type
const mapQuestionTypeFromAPI = (apiType) => {
  const typeMapping = {
    'multichoice': 'multichoice',
    'truefalse': 'truefalse',
    'essay': 'essay',
    'shortanswer': 'shortanswer',
    'matching': 'matching',
    'match': 'matching',
    'numerical': 'numerical',
    'calculated': 'calculated',
    'calculatedmulti': 'calculatedmulti',
    'calculatedsimple': 'calculatedsimple',
    'ddimageortext': 'ddimageortext',
    'ddmarker': 'ddmarker',
    'ddwtos': 'ddwtos',
    'multianswer': 'multianswer',
    'randomsamatch': 'randomsamatch',
    'gapselect': 'gapselect',
    'default': 'multichoice'
  };
  const normalizedType = String(apiType || '').toLowerCase().trim();
  return typeMapping[normalizedType] || typeMapping.default;
};

// User cache for performance
const userCache = new Map();

// Helper: Get user info by ID with caching
const getUserById = async (userId) => {
  if (!userId) return null;
  if (userCache.has(userId)) return userCache.get(userId);

  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await handleAPIResponse(response);

    let users = [];
    if (Array.isArray(data)) users = data;
    else if (data.users && Array.isArray(data.users)) users = data.users;
    else if (data.data && Array.isArray(data.data)) users = data.data;

    users.forEach(user => {
      const userInfo = {
        id: user.id,
        firstname: user.firstname || user.first_name || '',
        lastname: user.lastname || user.last_name || '',
        fullname: `${user.firstname || user.first_name || ''} ${user.lastname || user.last_name || ''}`.trim() ||
                  user.fullname || user.displayname || `User ${user.id}`,
        email: user.email || ''
      };
      userCache.set(user.id, userInfo);
    });

    return userCache.get(userId) || null;
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    return null;
  }
};

const getUserNameById = async (userId) => {
  if (!userId) return 'Unknown';
  const user = await getUserById(userId);
  return user ? user.fullname : `User ${userId}`;
};

export const questionAPI = {
   // Add missing cache properties
  cache: new Map(),
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

  // Helper method for making requests
  async makeRequest(url, options = {}) {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      ...options
    });
    return await handleAPIResponse(response);
  },
  // Get all tags with better normalization
 async getTags() {
    try {
      console.log(' Fetching all tags from API...');
      
      const response = await fetch(`${API_BASE_URL}/questions/tags`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await handleAPIResponse(response);
      // console.log(' Raw tags response:', data);
      
      if (Array.isArray(data)) {
        const processedTags = data.map(tag => ({
          id: String(tag.id), //  CRITICAL: Ensure string ID
          name: tag.name,
          rawname: tag.rawname,
          isstandard: tag.isstandard || false,
          description: tag.description || '',
          flag: tag.flag || 0
        }));
        
        console.log(` Processed ${processedTags.length} tags`);
        return processedTags;
      }
      
      console.log(' Tags response was not an array:', typeof data);
      return [];
    } catch (error) {
      console.error(' Failed to fetch tags:', error);
      return [];
    }
  },
// Get tags for a specific question
async getTagsForQuestion(questionId) {
  if (!questionId) {
    console.warn(' No question ID provided');
    return [];
  }

  const cacheKey = `question_tags_${questionId}`;
  const cached = this.cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
    console.log(` Using cached tags for question ${questionId}`);
    return cached.data;
  }

  try {
    console.log(` Fetching tags for question: ${questionId}`);
    
    const url = `${API_BASE_URL}/questions/question-tags?questionid=${questionId}`;
    const response = await this.makeRequest(url);

    console.log(` Question tags response for ${questionId}:`, response);

    // Response format: { questionid: number, tags: array }
    const tags = Array.isArray(response.tags) ? response.tags : [];
    
    const normalizedTags = tags.map(tag => ({
      id: String(tag.id),
      name: tag.name || tag.rawname || String(tag.id),
      rawname: tag.rawname || tag.name || String(tag.id),
      isstandard: Boolean(tag.isstandard),
      description: tag.description || '',
      descriptionformat: tag.descriptionformat || 0,
      flag: tag.flag || 0
    }));

    // Cache the result
    this.cache.set(cacheKey, {
      data: normalizedTags,
      timestamp: Date.now()
    });

    console.log(` Loaded ${normalizedTags.length} tags for question ${questionId}`);
    return normalizedTags;

  } catch (error) {
    console.error(` Failed to fetch tags for question ${questionId}:`, error);
    return [];
  }
},
  // Get tags for a specific question
async getQuestionTags(questionId) {
    try {
      console.log(` Fetching tags for question ${questionId}...`);
      
      const response = await fetch(`${API_BASE_URL}/questions/question-tags?questionid=${questionId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await handleAPIResponse(response);
      console.log(` Tags for question ${questionId}:`, data);
      
      // Handle your API response format: { questionid: 99235, tags: [] }
      let tags = [];
      if (Array.isArray(data.tags)) {
        tags = data.tags;
      } else if (Array.isArray(data.questiontags)) {
        tags = data.questiontags;
      } else if (Array.isArray(data)) {
        tags = data;
      }

      // Normalize tag format ensuring string IDs
      const normalizedTags = tags.map(tag => {
        if (typeof tag === 'string') {
          return {
            id: tag,
            name: tag,
            rawname: tag,
            isstandard: false
          };
        } else if (typeof tag === 'object' && tag !== null) {
          return {
            id: String(tag.id || tag.name || tag.rawname), //  CRITICAL: String ID
            name: tag.name || tag.rawname || tag.text || tag.value,
            rawname: tag.rawname || tag.name || tag.text || tag.value,
            isstandard: tag.isstandard || false,
            description: tag.description || '',
            flag: tag.flag || 0
          };
        }
        return null;
      }).filter(Boolean);

      console.log(` Normalized ${normalizedTags.length} tags for question ${questionId}`);
      return normalizedTags;

    } catch (error) {
      console.error(` Failed to fetch tags for question ${questionId}:`, error);
      return [];
    }
  },

// Get questions by specific tag IDs - NEW method based on your API
async getQuestionsByTagsWithFilters(tagIds, additionalFilters = {}, page = 1, perPage = 10) {
  try {
    console.log(' Filtering questions by tags:', tagIds);
    
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      console.warn('No tag IDs provided');
      return { questions: [], total: 0 };
    }

    // Build URL with proper tag parameter format
    const params = new URLSearchParams();
    
    // Add pagination
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    
    // Add tag filters - CRITICAL: Use correct format from your API docs
    tagIds.forEach(tagId => {
      params.append('tags[id][]', tagId.toString());
    });
    
    // Add other filters
    if (additionalFilters.categoryid) {
      params.append('categoryid', additionalFilters.categoryid);
    }
    if (additionalFilters.status && additionalFilters.status !== 'All') {
      params.append('status', additionalFilters.status);
    }
    if (additionalFilters.qtype && additionalFilters.qtype !== 'All') {
      params.append('qtype', additionalFilters.qtype);
    }
    if (additionalFilters.searchterm) {
      params.append('searchterm', additionalFilters.searchterm);
    }

    const url = `${API_BASE_URL}/questions/filters?${params.toString()}`;
    console.log(' Tag filter URL:', url);

    const response = await fetch(url, {
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

    const data = await response.json();
    console.log(' Tag filtering response:', {
      total: data.total,
      current_page: data.current_page,
      questions_count: data.questions?.length,
      filtered_tagids: data.filtered_tagids
    });

    return {
      questions: data.questions || [],
      total: data.total || 0,
      current_page: data.current_page || page,
      per_page: data.per_page || perPage,
      last_page: data.last_page || 1,
      filtered_tagids: data.filtered_tagids || []
    };

  } catch (error) {
    console.error(' Tag filtering failed:', error);
    throw error;
  }
},

// NEW: Replace getTags method with this
async getAllTags() {
  try {
    console.log(' Fetching all tags...');
    
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
    console.log(' Tags loaded:', tags.length);

    // Normalize tag format
    return Array.isArray(tags) ? tags.map(tag => ({
      id: String(tag.id), // Ensure string ID for react-select
      name: tag.name || tag.rawname || `Tag ${tag.id}`,
      rawname: tag.rawname || tag.name,
      isstandard: Boolean(tag.isstandard),
      description: tag.description || ''
    })).filter(tag => tag.id && tag.name) : [];

  } catch (error) {
    console.error(' Failed to fetch tags:', error);
    return [];
  }
},

  // Get tags for multiple questions
async getTagsForMultipleQuestions(questionIds) {
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return {};
    }

    try {
      console.log(` Fetching tags for ${questionIds.length} questions...`);
      
      // Since there's no bulk endpoint, fetch individually with concurrency control
      const batchSize = 5; // Process 5 questions at a time to avoid overwhelming the API
      const tagsByQuestionId = {};
      
      for (let i = 0; i < questionIds.length; i += batchSize) {
        const batch = questionIds.slice(i, i + batchSize);
        
        console.log(` Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(questionIds.length/batchSize)}: [${batch.join(', ')}]`);
        
        const batchPromises = batch.map(async (questionId) => {
          try {
            const tags = await this.getTagsForQuestion(questionId);
            return { questionId, tags };
          } catch (error) {
            console.warn(` Failed to get tags for question ${questionId}:`, error);
            return { questionId, tags: [] };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { questionId, tags } = result.value;
            tagsByQuestionId[questionId] = tags;
          }
        });

        // Small delay between batches to be nice to the API
        if (i + batchSize < questionIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(` Loaded tags for ${Object.keys(tagsByQuestionId).length}/${questionIds.length} questions`);
      return tagsByQuestionId;

    } catch (error) {
      console.error(' Failed to fetch tags for questions:', error);
      
      // Return empty object as fallback
      const fallback = {};
      questionIds.forEach(id => {
        fallback[id] = [];
      });
      return fallback;
    }
  },

  // Bulk tag operations with proper error handling
 async bulkTagOperations(questionIds, tagIds, operation = 'add') {
  try {
    console.log(` Bulk ${operation} tags:`, { questionIds, tagIds });
    
    //  CORRECT ENDPOINT: /questions/bulk-tags (with 's')
    const url = `${API_BASE_URL}/questions/bulk-tags`;
    const method = operation === 'add' ? 'POST' : 'DELETE';
    
    // Ensure all IDs are integers
    const validQuestionIds = questionIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    const validTagIds = tagIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify({
        questionids: validQuestionIds,
        tagids: validTagIds
      })
    });
    
    const data = await handleAPIResponse(response);
    console.log(` Bulk ${operation} tags successful:`, data);
    
    return data;
  } catch (error) {
    console.error(`Bulk ${operation} tags failed:`, error);
    throw error;
  }
},


  // Get all categories
  async getCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/categories`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await handleAPIResponse(response);
      let categories = [];
      if (Array.isArray(data)) categories = data;
      else if (data.categories && Array.isArray(data.categories)) categories = data.categories;
      else if (data.data && Array.isArray(data.data)) categories = data.data;
      return categories.map(cat => ({
        value: cat.id || cat.value,
        label: cat.name || cat.label || cat.category || `Category ${cat.id}`
      }));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [{ value: 1, label: 'Default Category' }];
    }
  },

  // Get question types - Fixed URL
  // Get question types - Fixed URL
  async getQuestionTypes() {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/qtypes`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await handleAPIResponse(response);
      let types = [];
      if (Array.isArray(data)) types = data;
      else if (data.qtypes && Array.isArray(data.qtypes)) types = data.qtypes;
      else if (data.data && Array.isArray(data.data)) types = data.data;
      // Return the objects as-is, so FiltersRow can use name, label, iconurl, etc.
      return types;
    } catch (error) {
      console.error('Failed to fetch question types:', error);
      return [];
    }
  },
// Get question preview with enhanced image support
async getQuestionPreview(questionId) {
  try {
    console.log(` Fetching preview for question ${questionId}...`);
    
    const response = await fetch(`${API_BASE_URL}/questions/preview?questionid=${questionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Accept': 'text/xml, application/json, text/html',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    console.log(' Preview response content type:', contentType);

    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log(' JSON preview data:', data);
    } else if (contentType && contentType.includes('text/xml')) {
      const xmlText = await response.text();
      data = {
        id: questionId,
        xmlContent: xmlText,
        contentType: 'xml'
      };
      console.log(' XML preview data length:', xmlText.length);
    } else {
      // Handle HTML or other text responses
      const textContent = await response.text();
      data = {
        id: questionId,
        content: textContent,
        contentType: contentType || 'text/plain'
      };
      console.log(' Text preview data length:', textContent.length);
    }

    return data;
  } catch (error) {
    console.error(` Failed to fetch preview for question ${questionId}:`, error);
    throw error;
  }
},

// Enhanced method to get question with full details for preview
async getQuestionDetails(questionId) {
  try {
    console.log(` Fetching detailed question data for ${questionId}...`);
    
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await handleAPIResponse(response);
    console.log('Question details:', data);

    // Process the question data to extract images and other media
    if (data.questiontext) {
      data.images = this.extractImagesFromHTML(data.questiontext);
      data.processedQuestionText = this.processImageURLs(data.questiontext);
    }

    return data;
  } catch (error) {
    console.error(` Failed to fetch question details for ${questionId}:`, error);
    throw error;
  }
},

// Helper method to extract images from HTML content
extractImagesFromHTML(htmlContent) {
  if (!htmlContent) return [];
  
  const images = [];
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  const imgElements = tempDiv.querySelectorAll('img');
  imgElements.forEach((img, index) => {
    const src = img.getAttribute('src');
    const alt = img.getAttribute('alt') || `Image ${index + 1}`;
    const width = img.getAttribute('width');
    const height = img.getAttribute('height');
    
    if (src) {
      images.push({
        src: this.resolveImageURL(src),
        alt,
        width,
        height,
        style: img.getAttribute('style') || '',
        originalSrc: src
      });
    }
  });
  
  return images;
},

// Helper method to resolve image URLs
resolveImageURL(src) {
  if (!src) return '';
  
  // If already absolute URL, return as is
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  
  // Handle relative URLs
  const baseURL = API_BASE_URL.replace('/api', ''); // Remove /api if present
  const cleanSrc = src.startsWith('/') ? src : `/${src}`;
  
  return `${baseURL}${cleanSrc}`;
},

// Helper method to process all image URLs in HTML content
processImageURLs(htmlContent) {
  if (!htmlContent) return '';
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  const imgElements = tempDiv.querySelectorAll('img');
  imgElements.forEach(img => {
    const src = img.getAttribute('src');
    if (src) {
      const resolvedSrc = this.resolveImageURL(src);
      img.setAttribute('src', resolvedSrc);
      
      // Add responsive styling
      if (!img.style.maxWidth) {
        img.style.maxWidth = '100%';
      }
      if (!img.style.height) {
        img.style.height = 'auto';
      }
    }
  });
  
  return tempDiv.innerHTML;
},
  // Get all users
  async getAllUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      return await handleAPIResponse(response);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  },

  // Get questions with filters - Fixed URL
  async getQuestions(filters = {}, page = 1, perPage = 10) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    
    // Fixed: Use correct parameter names
    if (filters.categoryId) params.append('categoryid', filters.categoryId);
    if (filters.courseId) params.append('courseid', filters.courseId);
    if (filters.status && filters.status !== 'All') params.append('status', filters.status.toLowerCase());
    if (filters.type && filters.type !== 'All') params.append('qtype', filters.type);
    if (filters.search) params.append('search', filters.search);
    
 //  CRITICAL FIX: Proper tag array handling
    if (filters.tagFilter && Array.isArray(filters.tagFilter) && filters.tagFilter.length > 0) {
      console.log('Adding tag filters to API call:', filters.tagFilter);
      
      // Method 1: Individual tag parameters (recommended for your API)
      filters.tagFilter.forEach((tagId, index) => {
        params.append(`tags[id][${index}]`, tagId);
      });
      
      // Method 2: Alternative if your API expects different format
      // filters.tagFilter.forEach(tagId => {
      //   params.append('tags[]', tagId);
      // });
      
      console.log(' Final URL with tags:', `${API_BASE_URL}/questions/filters?${params}`);
    }


    try {
      // Fixed: Use correct endpoint
      const response = await fetch(`${API_BASE_URL}/questions/filters?${params}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await handleAPIResponse(response);
      
      // Enhanced processing to include user information
      if (data && data.questions && Array.isArray(data.questions)) {
        await getUserById(1); // Preload users
        for (let question of data.questions) {
          if (question.createdby && !question.creator_name) {
            const creator = await getUserById(question.createdby);
            if (creator) {
              question.creator_name = creator.fullname;
              question.creator_firstname = creator.firstname;
              question.creator_lastname = creator.lastname;
            }
          }
          if (question.modifiedby && !question.modifier_name) {
            const modifier = await getUserById(question.modifiedby);
            if (modifier) {
              question.modifier_name = modifier.fullname;
              question.modifier_firstname = modifier.firstname;
              question.modifier_lastname = modifier.lastname;
            }
          }
        }
      }
      return data;
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      throw error;
    }
  },

  // Get course categories - NEW METHOD
  async getCourseCategories() {
    try {
      console.log(' Fetching course categories');
      
      const response = await fetch(`${API_BASE_URL}/questions/course-categories`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await handleAPIResponse(response);
      console.log(' Course categories response:', data);
      
      return {
        data: Array.isArray(data) ? data : (data.categories || data.data || [])
      };
      
    } catch (error) {
      console.error(' Error fetching course categories:', error);
      throw error;
    }
  },

  // Get question overview - NEW METHOD
  async getQuestionOverview(categoryId) {
    try {
      console.log(' Fetching question overview for category:', categoryId);
      
      const response = await fetch(`${API_BASE_URL}/questions/overview?categoryid=${categoryId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await handleAPIResponse(response);
      console.log(' Question overview response:', data);
      
      return {
        data: data
      };
      
    } catch (error) {
      console.error(' Error fetching question overview:', error);
      throw error;
    }
  },

  // Get question categories for course - Fixed URL
  async getQuestionCategories(courseId) {
    try {
      console.log(' Fetching question categories for course:', courseId);
      
      // Fixed: Use correct endpoint path
      const response = await fetch(`${API_BASE_URL}/questions/question_categories?courseid=${courseId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await handleAPIResponse(response);
      console.log(' Question categories response:', data);
      
      // Handle different response formats
      let categories = [];
      if (Array.isArray(data)) {
        categories = data;
      } else if (data.categories && Array.isArray(data.categories)) {
        categories = data.categories;
      } else if (data.data && Array.isArray(data.data)) {
        categories = data.data;
      }

      return {
        data: categories.map(cat => ({
          id: cat.id || cat.categoryid,
          name: cat.name || cat.category_name || `Category ${cat.id}`,
          info: cat.info || cat.description || '',
          parent: cat.parent || 0,
          contextid: cat.contextid || cat.context_id,
          sortorder: cat.sortorder || 0,
          questioncount: cat.questioncount || 0,
          children: cat.children || []
        })).filter(cat => cat.id)
      };
      
    } catch (error) {
      console.error(' Error fetching question categories:', error);
      throw error;
    }
  },

  // Get courses - Fixed URL
  async getCourses(categoryId = null) {
    try {
      console.log(' Fetching courses:', categoryId ? `for category ${categoryId}` : 'all');
      
      const url = categoryId 
        ? `${API_BASE_URL}/questions/courses?categoryid=${categoryId}`
        : `${API_BASE_URL}/questions/courses`;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await handleAPIResponse(response);
      console.log(' Courses response:', data);
      
      // Handle different response formats
      if (data && data.courses && Array.isArray(data.courses)) {
        return { data: data.courses };
      } else if (Array.isArray(data)) {
        return { data: data };
      } else {
        console.warn('Unexpected courses response format:', data);
        return { data: [] };
      }
    } catch (error) {
      console.error(' Error fetching courses:', error);
      throw error;
    }
  },

  // Update question status
  async updateQuestionStatus(questionId, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/set-question-status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          questionid: questionId,
          newstatus: status
        })
      });
      return handleAPIResponse(response);
    } catch (error) {
      console.error('Failed to update question status:', error);
      throw error;
    }
  },


  
  async updateQuestionName(questionid, name, questiontext, userid) {
    try {
      if (!questionid || !name || !userid) {
        throw new Error('questionid, name, and userid are required');
      }
  
      const params = new URLSearchParams({
        questionid,
        name,
        questiontext: questiontext || '',
        userid,
      });
  
      const response = await fetch(`${API_BASE_URL}/questions?${params.toString()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
        // No body for this PUT request
      });
  
      if (!response.ok) {
        throw new Error('Failed to update question');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to update question name:', error);
      throw error;
    }
  },

  // Bulk update question status
  async bulkUpdateQuestionStatus(questionIds, newStatus) {
    try {
      console.log(' Bulk updating question status:', { questionIds, newStatus });
      
      const response = await fetch(`${API_BASE_URL}/questions/status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          questionids: questionIds,
          newstatus: newStatus
        })
      });
      
      const data = await handleAPIResponse(response);
      console.log(' Bulk status update successful:', data);
      
      return data;
    } catch (error) {
      console.error(' Failed to bulk update question status:', error);
      throw error;
    }
  },

  // Delete all versions of questions
  async deleteAllVersions(questionIds) {
    try {
      console.log(' Deleting all versions of questions:', questionIds);
      
      // Build URL with questionid[] parameters as required by the API
      const params = new URLSearchParams();
      questionIds.forEach((id, index) => {
        params.append(`questionid[${index}]`, id.toString());
      });
      
      const response = await fetch(`${API_BASE_URL}/questions/delete_all_versions?${params.toString()}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const data = await handleAPIResponse(response);
      console.log(' Delete all versions successful:', data);
      
      return data;
    } catch (error) {
      console.error(' Failed to delete all versions:', error);
      throw error;
    }
  },

  // Bulk delete questions
  // async bulkDeleteQuestions(questionIds) {
  //   try {
  //     console.log(' Bulk deleting questions:', questionIds);
      
  //     const response = await fetch(`${API_BASE_URL}/questions/bulk-delete`, {
  //       method: 'DELETE',
  //       headers: getAuthHeaders(),
  //       body: JSON.stringify({ questionids: questionIds })
  //     });
      
  //     const data = await handleAPIResponse(response);
  //     console.log(' Bulk delete successful:', data);
      
  //     return data;
  //   } catch (error) {
  //     console.error('Failed to bulk delete questions:', error);
  //     throw error;
  //   }
  // },

  // Export questions
  // async exportQuestions(questionIds, format = 'xml') {
  //   try {
  //     console.log(' Exporting questions:', { questionIds, format });
      
  //     const response = await fetch(`${API_BASE_URL}/questions/export`, {
  //       method: 'POST',
  //       headers: getAuthHeaders(),
  //       body: JSON.stringify({
  //         questionids: questionIds,
  //         format: format
  //       })
  //     });
      
  //     if (format === 'xml' || format === 'json') {
  //       return await response.text();
  //     } else {
  //       return await response.blob();
  //     }
  //   } catch (error) {
  //     console.error(' Failed to export questions:', error);
  //     throw error;
  //   }
  // },

  // Duplicate questions
  // async duplicateQuestions(questionIds) {
  //   try {
  //     console.log(' Duplicating questions:', questionIds);
      
  //     const response = await fetch(`${API_BASE_URL}/questions/duplicate`, {
  //       method: 'POST',
  //       headers: getAuthHeaders(),
  //       body: JSON.stringify({
  //         questionids: questionIds
  //       })
  //     });
      
  //     const data = await handleAPIResponse(response);
  //     console.log(' Questions duplicated:', data);
      
  //     return data;
  //   } catch (error) {
  //     console.error(' Failed to duplicate questions:', error);
  //     throw error;
  //   }
  // },

  // Get question statistics
  async getQuestionStatistics(questionIds = null) {
    try {
      console.log(' Fetching question statistics:', questionIds);
      
      const url = `${API_BASE_URL}/questions/statistics`;
      
      const response = await fetch(url, {
        method: questionIds ? 'POST' : 'GET',
        headers: getAuthHeaders(),
        body: questionIds ? JSON.stringify({ questionids: questionIds }) : undefined
      });
      
      const data = await handleAPIResponse(response);
      console.log(' Question statistics fetched:', data);
      
      return data;
    } catch (error) {
      console.error(' Failed to fetch question statistics:', error);
      throw error;
    }
  },

  // Clear tag cache
  clearTagCache() {
    console.log(' Clearing tag cache');
    // Implementation depends on your caching strategy
  },

  // Create True/False Question
  // async createTrueFalseQuestion(questionData) {
  //   const payload = {
  //     name: questionData.title,
  //     questiontext: questionData.questionText,
  //     qtype: 'truefalse',
  //     status: questionData.status || 'draft',
  //     defaultmark: questionData.defaultMark || 1,
  //     generalfeedback: questionData.generalFeedback || '',
  //     correctanswer: questionData.correctAnswer,
  //     feedbacktrue: questionData.feedbackTrue || '',
  //     feedbackfalse: questionData.feedbackFalse || '',
  //     penalty: questionData.penalty || 0,
  //     tags: questionData.tags || []
  //   };
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/questions`, {
  //       method: 'POST',
  //       headers: getAuthHeaders(),
  //       body: JSON.stringify(payload)
  //     });
  //     return await handleAPIResponse(response);
  //   } catch (error) {
  //     console.error('Failed to create True/False question:', error);
  //     throw error;
  //   }
  // },

  // Create Multiple Choice Question
  // async createMultipleChoiceQuestion(questionData) {
  //   const payload = {
  //     name: questionData.title,
  //     questiontext: questionData.questionText,
  //     qtype: 'multichoice',
  //     status: questionData.questionStatus || 'Ready',
  //     defaultmark: questionData.defaultMark || 100,
  //     generalfeedback: questionData.generalFeedback || '',
  //     multipleAnswers: questionData.multipleAnswers || false,
  //     shuffleAnswers: questionData.shuffleAnswers || true,
  //     choices: questionData.choices.map(choice => ({
  //       text: choice.text,
  //       grade: choice.grade,
  //       feedback: choice.feedback || ''
  //     })),
  //     tags: questionData.tags || []
  //   };
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/questions`, {
  //       method: 'POST',
  //       headers: getAuthHeaders(),
  //       body: JSON.stringify(payload)
  //     });
  //     return await handleAPIResponse(response);
  //   } catch (error) {
  //     console.error('Failed to create Multiple Choice question:', error);
  //     throw error;
  //   }
  // }
};

// Enhanced normalization helper for question objects
export function normalizeQuestionFromAPI(apiQuestion) {
  const rawQType = apiQuestion.qtype || apiQuestion.type || 'multichoice';
  const normalizedQType = mapQuestionTypeFromAPI(rawQType);

  // Handle choices/answers for multiple choice questions
  let choices = [];
  if (normalizedQType === 'multichoice' || normalizedQType === 'multiple') {
    if (apiQuestion.answers && Array.isArray(apiQuestion.answers)) {
      choices = apiQuestion.answers.map((answer, index) => ({
        id: answer.id || index,
        text: answer.text || answer.answer_text || answer.content || '',
        answer: answer.text || answer.answer_text || answer.content || '',
        isCorrect: answer.is_correct || answer.correct || (answer.fraction && answer.fraction > 0) || false,
        grade: (answer.is_correct || (answer.fraction && answer.fraction > 0)) ? '100%' : '0%',
        feedback: answer.feedback || ''
      }));
    } else if (apiQuestion.choices && Array.isArray(apiQuestion.choices)) {
      choices = apiQuestion.choices.map((choice, index) => ({
        id: choice.id || index,
        text: choice.text || choice.content || '',
        answer: choice.text || choice.content || '',
        isCorrect: choice.is_correct || choice.correct || false,
        grade: choice.is_correct ? '100%' : '0%',
        feedback: choice.feedback || ''
      }));
    }
  }

  // Enhanced: Handle tags from API with better normalization
  const getTagsFromAPI = () => {
    let apiTags = [];
    if (apiQuestion.tags && Array.isArray(apiQuestion.tags)) apiTags = apiQuestion.tags;
    else if (apiQuestion.questiontags && Array.isArray(apiQuestion.questiontags)) apiTags = apiQuestion.questiontags;
    else if (apiQuestion.tag_names && Array.isArray(apiQuestion.tag_names)) apiTags = apiQuestion.tag_names;
    else if (apiQuestion.tagnames && Array.isArray(apiQuestion.tagnames)) apiTags = apiQuestion.tagnames;
    else if (typeof apiQuestion.tags === 'string' && apiQuestion.tags.trim()) {
      apiTags = apiQuestion.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }
    
    return apiTags.map((tag, index) => {
      if (typeof tag === 'string') return tag.trim();
      else if (tag && typeof tag === 'object') {
        return {
          id: tag.id || index,
          name: tag.name || tag.rawname || tag.text || tag.displayname || String(tag.id),
          rawname: tag.rawname || tag.name,
          isstandard: tag.isstandard || false
        };
      }
      return String(tag);
    }).filter(Boolean);
  };

  // Creator/modifier info
  const getCreatorInfo = () => {
    let creatorName = 'Unknown';
    let creatorDate = '';
    if (apiQuestion.creator_name) creatorName = apiQuestion.creator_name;
    else if (apiQuestion.creator_firstname && apiQuestion.creator_lastname) creatorName = `${apiQuestion.creator_firstname} ${apiQuestion.creator_lastname}`.trim();
    else if (apiQuestion.created_by_name) creatorName = apiQuestion.created_by_name;
    else if (apiQuestion.createdby) creatorName = `User ${apiQuestion.createdby}`;
    if (apiQuestion.timecreated) creatorDate = new Date(apiQuestion.timecreated * 1000).toLocaleDateString();
    else if (apiQuestion.created_at) creatorDate = new Date(apiQuestion.created_at).toLocaleDateString();
    else if (apiQuestion.createddate) creatorDate = new Date(apiQuestion.createddate).toLocaleDateString();
    return { name: creatorName, date: creatorDate };
  };

  const getModifierInfo = () => {
    let modifierName = 'Unknown';
    let modifierDate = '';
    if (apiQuestion.modifier_name) modifierName = apiQuestion.modifier_name;
    else if (apiQuestion.modifier_firstname && apiQuestion.modifier_lastname) modifierName = `${apiQuestion.modifier_firstname} ${apiQuestion.modifier_lastname}`.trim();
    else if (apiQuestion.modified_by_name) modifierName = apiQuestion.modified_by_name;
    else if (apiQuestion.modifiedby) modifierName = `User ${apiQuestion.modifiedby}`;
    if (apiQuestion.timemodified) modifierDate = new Date(apiQuestion.timemodified * 1000).toLocaleDateString();
    else if (apiQuestion.updated_at) modifierDate = new Date(apiQuestion.updated_at).toLocaleDateString();
    else if (apiQuestion.modifieddate) modifierDate = new Date(apiQuestion.modifieddate).toLocaleDateString();
    return { name: modifierName, date: modifierDate };
  };

  const getUsageInfo = () => {
    const usage = apiQuestion.usage || apiQuestion.usage_count || 0;
    let lastUsed = 'Never';
    if (apiQuestion.last_used) lastUsed = new Date(apiQuestion.last_used).toLocaleDateString();
    else if (apiQuestion.timemodified && usage > 0) lastUsed = new Date(apiQuestion.timemodified * 1000).toLocaleDateString();
    else if (apiQuestion.updated_at && usage > 0) lastUsed = new Date(apiQuestion.updated_at).toLocaleDateString();
    return { usage: parseInt(usage) || 0, lastUsed };
  };

  const createdBy = getCreatorInfo();
  const modifiedBy = getModifierInfo();
  const usageInfo = getUsageInfo();
  const apiTags = getTagsFromAPI();

  return {
    id: apiQuestion.id,
    title: apiQuestion.name || apiQuestion.title || `Question ${apiQuestion.id}`,
    questionText: apiQuestion.questiontext || apiQuestion.question_text || apiQuestion.text || '',
    qtype: normalizedQType,
    status: apiQuestion.status || 'draft',
    version: `v${apiQuestion.version || 1}`,
    tags: apiTags,
    choices: choices,
    options: choices.map(c => c.text || c.answer || ''),
    correctAnswers: choices.filter(c => c.isCorrect).map(c => c.text || c.answer || ''),
    correctAnswer: normalizedQType === 'truefalse' ? (apiQuestion.correctanswer || apiQuestion.correct_answer || 'true') : undefined,
    feedbackTrue: normalizedQType === 'truefalse' ? (apiQuestion.feedbacktrue || apiQuestion.feedback_true || '') : undefined,
    feedbackFalse: normalizedQType === 'truefalse' ? (apiQuestion.feedbackfalse || apiQuestion.feedback_false || '') : undefined,
    multipleAnswers: choices.filter(c => c.isCorrect).length > 1,
    shuffleAnswers: apiQuestion.shuffleanswers || apiQuestion.shuffle_answers || false,
    numberChoices: apiQuestion.numbering || '1, 2, 3, ...',
    showInstructions: apiQuestion.showinstructions !== false,
    defaultMark: apiQuestion.defaultmark || apiQuestion.default_mark || 1,
    generalFeedback: apiQuestion.generalfeedback || apiQuestion.general_feedback || '',
    combinedFeedback: apiQuestion.combinedfeedback || apiQuestion.combined_feedback || {},
    penaltyFactor: apiQuestion.penalty || apiQuestion.penalty_factor || 0,
    createdBy,
    modifiedBy,
    comments: apiQuestion.comments || apiQuestion.comment_count || 0,
    usage: usageInfo.usage,
    lastUsed: usageInfo.lastUsed,
    history: Array.isArray(apiQuestion.history) ? apiQuestion.history : []
  };
}
//get tag by filter
export const fetchFilteredQuestions = async (categoryId, tagIds = [], page = 1, perPage = 10) => {
  const token = localStorage.getItem('token');
  const queryParams = new URLSearchParams({
    categoryid: categoryId,
    page,
    per_page: perPage,
  });

  tagIds.forEach(tagId => queryParams.append('tagids[]', tagId));

  const response = await fetch(`${API_BASE_URL}/questions/filters?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch filtered questions');
    throw new Error('Failed to fetch filtered questions');
  }

  return response.json();
};

// Enhanced demo tags generator with more realistic tags
export function generateDemoTags(question) {
  const tags = [];
  if (question.status && question.status !== 'draft') tags.push(question.status);
  const questionText = (question.questiontext || question.questionText || question.title || '').toLowerCase();
  
  // Subject-based tags
  if (questionText.includes('google') || questionText.includes('search')) tags.push('google', 'search-engines');
  if (questionText.includes('programming') || questionText.includes('code') || questionText.includes('software')) tags.push('programming', 'software-development');
  if (questionText.includes('computer') || questionText.includes('hardware')) tags.push('computer-science', 'technology');
  if (questionText.includes('math') || questionText.includes('calculate') || questionText.includes('number')) tags.push('mathematics', 'calculations');
  if (questionText.includes('network') || questionText.includes('internet')) tags.push('networking', 'internet');
  if (questionText.includes('database') || questionText.includes('sql')) tags.push('database', 'data-management');
  if (questionText.includes('security') || questionText.includes('encryption')) tags.push('cybersecurity', 'data-protection');
  
  // Difficulty-based tags
  if (question.defaultMark) {
    const mark = parseFloat(question.defaultMark);
    if (mark <= 1) tags.push('easy', 'beginner');
    else if (mark <= 3) tags.push('medium', 'intermediate');
    else tags.push('hard', 'advanced');
  } else {
    const difficulties = [['easy', 'beginner'], ['medium', 'intermediate'], ['hard', 'advanced']];
    const randomDiff = difficulties[Math.floor(Math.random() * difficulties.length)];
    tags.push(...randomDiff);
  }
  
  // Academic context tags
  const academicTags = ['quiz', 'exam', 'practice', 'homework', 'review', 'assessment', 'midterm', 'final'];
  if (Math.random() > 0.3) tags.push(academicTags[Math.floor(Math.random() * academicTags.length)]);
  
  // Question type tags
  switch (question.qtype) {
    case 'multichoice': tags.push('multiple-choice', 'selection'); break;
    case 'truefalse': tags.push('true-false', 'binary-choice'); break;
    case 'essay': tags.push('written-response', 'composition'); break;
    case 'shortanswer': tags.push('short-answer', 'brief-response'); break;
    case 'ddimageortext': tags.push('drag-drop', 'interactive', 'visual'); break;
    case 'matching': tags.push('matching', 'pairing'); break;
    case 'gapselect': tags.push('fill-in-blanks', 'completion'); break;
    case 'numerical': tags.push('numerical', 'calculations'); break;
  }
  
  // Ensure minimum tags
  if (tags.length < 3) {
    const generalTags = ['general', 'standard', 'basic', 'core', 'fundamental'];
    tags.push(...generalTags.slice(0, 3 - tags.length));
  }
  
  // Remove duplicates and return
  return [...new Set(tags.filter(tag => tag && tag.length > 0))];
}

export default questionAPI;
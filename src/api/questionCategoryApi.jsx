// ============================================================================
// src/api/questionCategoryAPI.js - CLEAN & OPTIMIZED
// Dedicated API for Question Categories
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Get authentication headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

/**
 * Handle API response with proper error handling
 */
const handleAPIResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usernameoremail');
      throw new Error('Authentication expired. Please log in again.');
    }
    
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (parseError) {
      // Use default error message if JSON parsing fails
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
};

/**
 * Question Category API
 */
export const questionCategoryAPI = {
  /**
   * Get question categories for a specific course
   * @param {number} courseId - The course ID
   * @returns {Promise<Array>} Array of question categories
   */
  async getQuestionCategories(courseId) {
    if (!courseId || courseId === 'All' || courseId === null) {
      return [];
    }

    try {
      console.log(' Fetching question categories for course:', courseId);
      
      const response = await fetch(
        `${API_BASE_URL}/questions/question_categories?courseid=${courseId}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );

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

      // Normalize categories
      const normalizedCategories = categories.map(cat => ({
        id: cat.id || cat.categoryid,
        name: cat.name || cat.category_name || `Category ${cat.id}`,
        info: cat.info || cat.description || '',
        parent: cat.parent || 0,
        contextid: cat.contextid || cat.context_id,
        sortorder: cat.sortorder || 0,
        questioncount: cat.questioncount || 0,
        // Additional fields that might be useful
        idnumber: cat.idnumber || '',
        stamp: cat.stamp || '',
        timecreated: cat.timecreated || null,
        timemodified: cat.timemodified || null
      })).filter(cat => cat.id); // Remove invalid categories

      console.log(' Processed question categories:', normalizedCategories.length);
      return normalizedCategories;

    } catch (error) {
      console.error(' Error fetching question categories:', error);
      throw error;
    }
  },

  /**
   * Get all question categories (without course filter)
   * @returns {Promise<Array>} Array of all question categories
   */
  async getAllQuestionCategories() {
    try {
      console.log(' Fetching all question categories');
      
      const response = await fetch(
        `${API_BASE_URL}/questions/categories`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );

      const data = await handleAPIResponse(response);
      console.log(' All question categories response:', data);

      // Handle different response formats
      let categories = [];
      
      if (Array.isArray(data)) {
        categories = data;
      } else if (data.categories && Array.isArray(data.categories)) {
        categories = data.categories;
      } else if (data.data && Array.isArray(data.data)) {
        categories = data.data;
      }

      // Normalize categories
      const normalizedCategories = categories.map(cat => ({
        id: cat.id || cat.categoryid,
        name: cat.name || cat.category_name || `Category ${cat.id}`,
        info: cat.info || cat.description || '',
        parent: cat.parent || 0,
        contextid: cat.contextid || cat.context_id,
        sortorder: cat.sortorder || 0,
        questioncount: cat.questioncount || 0
      })).filter(cat => cat.id);

      console.log(' Processed all question categories:', normalizedCategories.length);
      return normalizedCategories;

    } catch (error) {
      console.error(' Error fetching all question categories:', error);
      throw error;
    }
  },

  /**
   * Create a new question category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Created category
   */
  async createQuestionCategory(categoryData) {
    try {
      console.log(' Creating question category:', categoryData);
      
      const response = await fetch(
        `${API_BASE_URL}/questions/categories`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(categoryData)
        }
      );

      const data = await handleAPIResponse(response);
      console.log('Question category created:', data);
      return data;

    } catch (error) {
      console.error('Error creating question category:', error);
      throw error;
    }
  },

  /**
   * Update a question category
   * @param {number} categoryId - Category ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated category
   */
  async updateQuestionCategory(categoryId, updateData) {
    try {
      console.log('Updating question category:', categoryId, updateData);
      
      const response = await fetch(
        `${API_BASE_URL}/questions/categories/${categoryId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updateData)
        }
      );

      const data = await handleAPIResponse(response);
      console.log(' Question category updated:', data);
      return data;

    } catch (error) {
      console.error(' Error updating question category:', error);
      throw error;
    }
  },

  /**
   * Delete a question category
   * @param {number} categoryId - Category ID
   * @returns {Promise<boolean>} Success status
   */
//   async deleteQuestionCategory(categoryId) {
//     try {
//       console.log(' Deleting question category:', categoryId);
      
//       const response = await fetch(
//         `${API_BASE_URL}/questions/categories/${categoryId}`,
//         {
//           method: 'DELETE',
//           headers: getAuthHeaders()
//         }
//       );

//       if (response.ok) {
//         console.log(' Question category deleted');
//         return true;
//       } else {
//         await handleAPIResponse(response);
//       }

//     } catch (error) {
//       console.error(' Error deleting question category:', error);
//       throw error;
//     }
//   }
};

export default questionCategoryAPI;
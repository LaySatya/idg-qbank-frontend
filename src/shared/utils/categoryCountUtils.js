// ============================================================================
// src/shared/utils/categoryCountUtils.js
// Utilities for calculating question counts in categories
// ============================================================================

/**
 * Calculate question count for a specific category
 * @param {Array} questions - Array of questions
 * @param {string|number} categoryId - Category ID to count for
 * @returns {number} Number of questions in the category
 */
export const calculateCategoryQuestionCount = (questions, categoryId) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return 0;
  }

  if (!categoryId || categoryId === 'All') {
    return questions.length;
  }

  const categoryIdStr = String(categoryId);
  
  return questions.filter(question => {
    // Handle different possible field names for category ID
    const questionCategoryId = String(
      question.categoryId || 
      question.categoryid || 
      question.category || 
      question.cat_id || 
      ''
    );
    
    return questionCategoryId === categoryIdStr;
  }).length;
};

/**
 * Calculate question counts for all categories
 * @param {Array} questions - Array of questions
 * @param {Array} categories - Array of categories
 * @returns {Object} Map of categoryId -> questionCount
 */
export const calculateAllCategoryQuestionCounts = (questions, categories) => {
  if (!Array.isArray(questions) || !Array.isArray(categories)) {
    return {};
  }

  const counts = { 'All': questions.length };
  
  categories.forEach(category => {
    if (category && category.id) {
      counts[String(category.id)] = calculateCategoryQuestionCount(questions, category.id);
    }
  });

  return counts;
};

/**
 * Add question counts to category tree structure
 * @param {Array} categoryTree - Hierarchical category tree
 * @param {Array} questions - Array of questions
 * @returns {Array} Category tree with questionCount added to each node
 */
export const addQuestionCountsToCategoryTree = (categoryTree, questions) => {
  if (!Array.isArray(categoryTree) || !Array.isArray(questions)) {
    return categoryTree;
  }

  const addCountsRecursively = (nodes) => {
    return nodes.map(node => {
      if (!node || !node.id) return node;
      
      // Calculate count for this node
      const questionCount = calculateCategoryQuestionCount(questions, node.id);
      
      // Process children recursively
      const children = node.children && Array.isArray(node.children) 
        ? addCountsRecursively(node.children)
        : node.children;
      
      return {
        ...node,
        questionCount,
        children
      };
    });
  };

  return addCountsRecursively(categoryTree);
};

/**
 * Get the question count for a category, preferring the category.questioncount property if available.
 * @param {Object} category - Category object
 * @param {Array} questions - Array of questions (optional, fallback)
 * @returns {number} Number of questions in the category
 */
export const getCategoryQuestionCount = (category, questions = []) => {
  if (category && typeof category.questioncount === 'number') {
    return category.questioncount;
  }
  // Fallback: count from questions array (only valid if unpaginated)
  if (Array.isArray(questions) && category && category.id) {
    return calculateCategoryQuestionCount(questions, category.id);
  }
  return 0;
};

/**
 * Get formatted category label with question count (uses getCategoryQuestionCount)
 * @param {Object} category - Category object
 * @param {Array} questions - Array of questions (optional, fallback)
 * @returns {string} Formatted label
 */
export const formatCategoryLabel = (category, questions = []) => {
  if (!category || !category.name) {
    return 'Unknown Category';
  }
  const count = getCategoryQuestionCount(category, questions);
  return `${category.name} (${count} question${count !== 1 ? 's' : ''})`;
};

/**
 * Debug function to log category question distribution (uses questioncount if present)
 * @param {Array} questions - Array of questions (may be paginated)
 * @param {Array} categories - Array of categories (should have questioncount)
 */
export const debugCategoryQuestionDistribution = (questions, categories) => {
  console.log('Category Question Distribution Debug:');
  console.log(` Total questions (array): ${questions?.length || 0}`);
  console.log(`Total categories: ${categories?.length || 0}`);

  if (!Array.isArray(categories)) {
    console.log(' Invalid input data');
    return;
  }

  // Prefer questioncount from category if present
  const counts = {};
  let totalFromCategories = 0;
  categories.forEach(cat => {
    const count = getCategoryQuestionCount(cat, questions);
    counts[cat.name || cat.id] = count;
    totalFromCategories += count;
  });

  console.log(' Question counts by category:');
  console.table(counts);
  console.log(` Total from categories: ${totalFromCategories}`);

  // Warn if questions array is likely paginated
  if (Array.isArray(questions) && questions.length > 0 && totalFromCategories > questions.length) {
    console.warn(' [QCOUNT] The questions array is likely paginated. Use category.questioncount for accurate counts.');
  }

  // Find categories with no questions
  const emptyCategoriesCount = Object.values(counts).filter(count => count === 0).length;
  console.log(` Categories with no questions: ${emptyCategoriesCount}`);

  // Find questions without valid category (only if full array)
  if (Array.isArray(questions)) {
    const questionsWithoutCategory = questions.filter(q => {
      const categoryId = String(q.categoryId || q.categoryid || q.category || '');
      return !categoryId || categoryId === 'undefined' || categoryId === 'null';
    }).length;
    if (questionsWithoutCategory > 0) {
      console.log(`Questions without valid category: ${questionsWithoutCategory}`);
    }
  }

  // Sample category IDs from questions
  if (Array.isArray(questions)) {
    const sampleCategoryIds = questions.slice(0, 5).map(q => ({
      questionId: q.id,
      categoryId: q.categoryId || q.categoryid || q.category,
      title: q.title || q.name
    }));
    console.log(' Sample question category mappings:', sampleCategoryIds);
  }
};

export default {
  calculateCategoryQuestionCount,
  calculateAllCategoryQuestionCounts,
  addQuestionCountsToCategoryTree,
  formatCategoryLabel,
  debugCategoryQuestionDistribution
};

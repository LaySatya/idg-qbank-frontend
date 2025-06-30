// ============================================================================
// src/shared/utils/categoryUtils.jsx - FIXED: Null Safety & Tree Building
// ============================================================================

/**
 * Safe function to build grouped category tree with comprehensive null checks
 * @param {Array} categories - Array of category objects
 * @param {Array} courses - Array of course objects (optional)
 * @returns {Array} Grouped category tree structure
 */
export const buildGroupedCategoryTree = (categories = [], courses = []) => {
  // Input validation with detailed logging
  if (!Array.isArray(categories)) {
    console.warn('buildGroupedCategoryTree: categories is not an array:', typeof categories);
    return [];
  }
  
  if (!Array.isArray(courses)) {
    console.warn('buildGroupedCategoryTree: courses is not an array:', typeof courses);
    courses = []; // Continue with empty courses array
  }

  console.log('🏗️ Building category tree:', { 
    categoriesCount: categories.length, 
    coursesCount: courses.length 
  });

  // Filter and validate categories
  const validCategories = categories.filter(cat => {
    if (!cat || typeof cat !== 'object') {
      console.warn('Invalid category object:', cat);
      return false;
    }
    
    // Check required fields with null safety
    const hasId = cat.id !== undefined && cat.id !== null;
    const hasName = cat.name && typeof cat.name === 'string' && cat.name.trim() !== '';
    const hasContextId = cat.contextid !== undefined && cat.contextid !== null;
    
    if (!hasId || !hasName || !hasContextId) {
      console.warn('Category missing required fields:', {
        id: hasId ? cat.id : 'MISSING',
        name: hasName ? cat.name : 'MISSING',
        contextid: hasContextId ? cat.contextid : 'MISSING'
      });
      return false;
    }
    
    return true;
  });

  if (validCategories.length === 0) {
    console.warn('No valid categories found after filtering');
    return [];
  }

  console.log(`✅ Filtered categories: ${validCategories.length}/${categories.length} valid`);

  // Group categories by contextid
  const grouped = {};
  validCategories.forEach(cat => {
    const contextid = String(cat.contextid); // Ensure string key
    if (!grouped[contextid]) {
      grouped[contextid] = [];
    }
    grouped[contextid].push({ ...cat }); // Create shallow copy
  });

  console.log('📊 Grouped by contextid:', Object.keys(grouped).map(id => `${id}: ${grouped[id].length}`));

  /**
   * Build hierarchical tree from flat category list
   * @param {Array} flatList - Flat array of categories
   * @returns {Array} Hierarchical tree structure
   */
  const buildTree = (flatList) => {
    if (!Array.isArray(flatList) || flatList.length === 0) {
      return [];
    }

    // Create a map for quick lookup and initialize children arrays
    const idMap = {};
    flatList.forEach(cat => {
      if (cat && cat.id !== undefined) {
        idMap[cat.id] = { 
          ...cat, 
          children: [] 
        };
      }
    });

    const tree = [];

    // Build the tree structure
    flatList.forEach(cat => {
      if (!cat || cat.id === undefined) return;
      
      const node = idMap[cat.id];
      if (!node) return;

      // Check if this category has a parent
      const parentId = cat.parent;
      
      if (parentId && parentId !== 0 && idMap[parentId]) {
        // Add to parent's children
        idMap[parentId].children.push(node);
      } else {
        // Root level category
        tree.push(node);
      }
    });

    return tree;
  };

  /**
   * Get course name by category/context ID with null safety
   * @param {number|string} contextId - Context/category ID
   * @returns {string|null} Course name or null
   */
  const getCourseNameByContextId = (contextId) => {
    if (!contextId || !Array.isArray(courses) || courses.length === 0) {
      return null;
    }

    // Try different possible field mappings
    const course = courses.find(course => {
      if (!course || typeof course !== 'object') return false;
      
      return (
        course.id === contextId ||
        course.contextid === contextId ||
        course.categoryid === contextId ||
        String(course.id) === String(contextId) ||
        String(course.contextid) === String(contextId) ||
        String(course.categoryid) === String(contextId)
      );
    });

    if (!course) return null;

    // Try different name fields
    return (
      course.fullname ||
      course.name ||
      course.displayname ||
      course.shortname ||
      null
    );
  };

  // Build the final grouped result
  const orderedGroups = [];

  // Process non-system contexts first (contextid !== '1')
  Object.entries(grouped)
    .filter(([contextid]) => contextid !== '1')
    .forEach(([contextid, cats]) => {
      if (!Array.isArray(cats) || cats.length === 0) return;

      // Sort categories by sort order
      const sorted = cats.sort((a, b) => {
        const orderA = (a.sortorder !== undefined && a.sortorder !== null) ? Number(a.sortorder) : 999;
        const orderB = (b.sortorder !== undefined && b.sortorder !== null) ? Number(b.sortorder) : 999;
        return orderA - orderB;
      });

      // Build tree for this context
      const tree = buildTree(sorted);

      // Determine label for this group
      let label = `Context ${contextid}`;

      // Try to find a course name
      const courseName = getCourseNameByContextId(Number(contextid));
      if (courseName) {
        label = `Course: ${courseName}`;
      } else {
        // Look for "Top" category to get course context
        const topCategory = sorted.find(cat => 
          cat.name && cat.name.toLowerCase().trim() === 'top'
        );
        
        if (topCategory) {
          const topCourseName = getCourseNameByContextId(topCategory.id);
          if (topCourseName) {
            label = `Course: ${topCourseName}`;
          }
        } else if (sorted.length > 0 && sorted[0].name) {
          // Use first category name as fallback
          label = `Category: ${sorted[0].name}`;
        }
      }

      orderedGroups.push({
        contextid: Number(contextid),
        label,
        tree,
        categoryCount: cats.length
      });
    });

  // Add system context last (contextid === '1')
  if (grouped['1'] && Array.isArray(grouped['1']) && grouped['1'].length > 0) {
    const sorted = grouped['1'].sort((a, b) => {
      const orderA = (a.sortorder !== undefined && a.sortorder !== null) ? Number(a.sortorder) : 999;
      const orderB = (b.sortorder !== undefined && b.sortorder !== null) ? Number(b.sortorder) : 999;
      return orderA - orderB;
    });

    const tree = buildTree(sorted);

    orderedGroups.push({
      contextid: 1,
      label: 'System',
      tree,
      categoryCount: grouped['1'].length
    });
  }

  console.log('🎯 Final grouped tree:', orderedGroups.map(g => 
    `${g.label} (${g.categoryCount} categories, ${g.tree.length} root nodes)`
  ));

  return orderedGroups;
};

/**
 * Render options for select dropdown with proper null safety
 * @param {Array} nodes - Tree nodes to render
 * @param {number} level - Current nesting level
 * @param {React} React - React object for creating elements
 * @returns {Array} Array of option elements
 */
export const renderOptions = (nodes, level = 0, React = null) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return [];
  }

  if (!React) {
    console.warn('renderOptions: React object not provided');
    return [];
  }

  return nodes.flatMap(node => {
    // Null safety checks
    if (!node || typeof node !== 'object') {
      console.warn('renderOptions: Invalid node:', node);
      return [];
    }

    if (!node.id || !node.name) {
      console.warn('renderOptions: Node missing id or name:', { id: node.id, name: node.name });
      return [];
    }

    // Clean and validate name
    const displayName = String(node.name).trim();
    if (!displayName) {
      console.warn('renderOptions: Empty display name for node:', node.id);
      return [];
    }

    const indentation = '— '.repeat(Math.max(0, level));
    const optionText = `${indentation}${displayName}`;

    try {
      const elements = [
        React.createElement('option', {
          key: `option-${node.id}-${level}`,
          value: node.id
        }, optionText)
      ];

      // Recursively add children if they exist
      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        const childElements = renderOptions(node.children, level + 1, React);
        elements.push(...childElements);
      }

      return elements;
    } catch (error) {
      console.error('renderOptions: Error creating option element:', error, { node, level });
      return [];
    }
  });
};

/**
 * Find category by name with comprehensive search options
 * @param {Array} categories - Categories to search
 * @param {string} name - Name to search for
 * @param {boolean} caseSensitive - Whether search is case sensitive
 * @returns {Object|null} Found category or null
 */
export const findCategoryByName = (categories, name, caseSensitive = false) => {
  if (!Array.isArray(categories) || !name || typeof name !== 'string') {
    return null;
  }

  const searchName = caseSensitive ? name.trim() : name.toLowerCase().trim();
  
  return categories.find(cat => {
    if (!cat || !cat.name || typeof cat.name !== 'string') {
      return false;
    }
    
    const catName = caseSensitive ? cat.name.trim() : cat.name.toLowerCase().trim();
    return catName === searchName;
  }) || null;
};

/**
 * Get all category IDs from a tree structure
 * @param {Array} tree - Tree structure
 * @returns {Array} Array of all category IDs
 */
export const getAllCategoryIds = (tree) => {
  if (!Array.isArray(tree)) {
    return [];
  }

  const ids = [];
  
  const traverse = (nodes) => {
    if (!Array.isArray(nodes)) return;
    
    nodes.forEach(node => {
      if (node && node.id !== undefined && node.id !== null) {
        ids.push(node.id);
        
        if (node.children && Array.isArray(node.children)) {
          traverse(node.children);
        }
      }
    });
  };

  traverse(tree);
  return ids;
};

/**
 * Flatten a category tree into a linear array
 * @param {Array} tree - Tree structure
 * @returns {Array} Flattened array with level information
 */
export const flattenCategoryTree = (tree) => {
  if (!Array.isArray(tree)) {
    return [];
  }

  const flattened = [];
  
  const traverse = (nodes, level = 0) => {
    if (!Array.isArray(nodes)) return;
    
    nodes.forEach(node => {
      if (node && node.id !== undefined && node.name) {
        flattened.push({
          ...node,
          level,
          hasChildren: node.children && Array.isArray(node.children) && node.children.length > 0,
          path: generateCategoryPath(node, level)
        });
        
        if (node.children && Array.isArray(node.children)) {
          traverse(node.children, level + 1);
        }
      }
    });
  };

  traverse(tree);
  return flattened;
};

/**
 * Generate a breadcrumb path for a category
 * @param {Object} category - Category object
 * @param {number} level - Category level
 * @returns {string} Breadcrumb path
 */
export const generateCategoryPath = (category, level = 0) => {
  if (!category || !category.name) {
    return '';
  }

  // This is a simplified path - in a real implementation,
  // you'd want to track parent relationships
  const indent = '  '.repeat(level);
  return `${indent}${category.name}`;
};

/**
 * Validate category tree structure
 * @param {Array} tree - Tree to validate
 * @returns {Object} Validation result
 */
export const validateCategoryTree = (tree) => {
  if (!Array.isArray(tree)) {
    return { valid: false, errors: ['Tree is not an array'] };
  }

  const errors = [];
  const ids = new Set();
  
  const validateNode = (node, path = '') => {
    if (!node || typeof node !== 'object') {
      errors.push(`Invalid node at ${path}: not an object`);
      return;
    }

    if (node.id === undefined || node.id === null) {
      errors.push(`Node at ${path} missing id`);
      return;
    }

    if (ids.has(node.id)) {
      errors.push(`Duplicate ID ${node.id} at ${path}`);
    } else {
      ids.add(node.id);
    }

    if (!node.name || typeof node.name !== 'string' || !node.name.trim()) {
      errors.push(`Node ${node.id} at ${path} has invalid name`);
    }

    if (node.children) {
      if (!Array.isArray(node.children)) {
        errors.push(`Node ${node.id} children is not an array`);
      } else {
        node.children.forEach((child, index) => {
          validateNode(child, `${path}/${node.id}[${index}]`);
        });
      }
    }
  };

  tree.forEach((node, index) => {
    validateNode(node, `root[${index}]`);
  });

  return {
    valid: errors.length === 0,
    errors,
    stats: {
      totalNodes: ids.size,
      rootNodes: tree.length
    }
  };
};

// Export all utilities
export default {
  buildGroupedCategoryTree,
  renderOptions,
  findCategoryByName,
  getAllCategoryIds,
  flattenCategoryTree,
  generateCategoryPath,
  validateCategoryTree
};
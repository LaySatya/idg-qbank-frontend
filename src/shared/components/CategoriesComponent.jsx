import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, FolderOpen, Folder, BookOpen, Users, Search, Filter, ChevronRight, ChevronDown, 
  Check, Loader, AlertCircle, Eye, ArrowRight, Radio, CheckCircle, Circle, Home, Building2,
   GraduationCap, FileText, Plus, Minus, RefreshCw
} from 'lucide-react';
import { useCategoriesAPI } from '../../api/categoriesAPI';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CategoriesComponent = ({ 
  isOpen, 
  onClose, 
  onCourseSelect,
  onNavigateToQuestions,
  setFilters 
}) => {
  // State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [coursesMap, setCoursesMap] = useState(new Map()); 
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState(null);
  const [viewMode, setViewMode] = useState('categories');

  // NEW: Performance tracking states
  const [loadingStates, setLoadingStates] = useState({
    categories: false,
    courses: new Set() // Track which categories are loading courses
  });

  //  NEW: Default selections
  const [defaultCategory, setDefaultCategory] = useState(null);
  const [defaultCourse, setDefaultCourse] = useState(null);

  // API
  const {
    loading,
    error,
    clearError,
    fetchQuestionCategories,
    fetchCourseCategories,
    fetchCoursesByCategoryId
  } = useCategoriesAPI();

  // Modal ref for focus trap and portal
  const modalRef = useRef(null);

  // Helper: Build category tree with proper Moodle hierarchy
  function buildCategoryTree(categoriesData) {
    if (!Array.isArray(categoriesData)) return [];
    
    // Create a map of all categories
    const categoryMap = {};
    categoriesData.forEach(category => {
      categoryMap[category.id] = {
        ...category,
        children: [],
        level: 0,
        isExpanded: false
      };
    });

    // Build the tree structure
    const rootCategories = [];
    categoriesData.forEach(category => {
      if (category.parent === 0) {
        // Root level category
        categoryMap[category.id].level = 0;
        rootCategories.push(categoryMap[category.id]);
      } else if (categoryMap[category.parent]) {
        // Child category
        categoryMap[category.id].level = categoryMap[category.parent].level + 1;
        categoryMap[category.parent].children.push(categoryMap[category.id]);
      }
    });

    return rootCategories;
  }

  function findCategoryById(categoryId) {
    const search = cats => {
      for (const c of cats) {
        if (c.id === categoryId) return c;
        if (c.children && c.children.length > 0) {
          const found = search(c.children);
          if (found) return found;
        }
      }
      return null;
    };
    return search(categories);
  }

  //  NEW: Check user preferences on mount
  useEffect(() => {
    if (!isOpen) return;
    const savedCategoryId = localStorage.getItem('CourseCategoryId');
    const savedCourseId = localStorage.getItem('CourseId');
    if (savedCategoryId) setDefaultCategory(parseInt(savedCategoryId));
    if (savedCourseId) setDefaultCourse(parseInt(savedCourseId));
  }, [isOpen]);
  // Load categories from API (only once on mount)
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const loadInitialCategories = async () => {
      try {
        setLoadingStates(prev => ({ ...prev, categories: true }));
        clearError();
        setSuccess(null);
        
        console.log(' Loading course categories from API...');
        const response = await fetch(`${API_BASE_URL}/questions/course-categories`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch course categories: ${response.status}`);
        }

        const courseCategoriesData = await response.json();
        console.log(' Course categories response:', courseCategoriesData);
        
        if (!cancelled) {
          if (Array.isArray(courseCategoriesData) && courseCategoriesData.length > 0) {
            const categoryTree = buildCategoryTree(courseCategoriesData);
            setCategories(categoryTree);
            
            // Auto-expand root categories for better UX
            const rootIds = new Set(categoryTree.map(cat => cat.id));
            setExpandedCategories(rootIds);
            
            // setSuccess({ 
            //   type: 'success', 
            //   message: `Loaded ${courseCategoriesData.length} course categories` 
            // });

            // NEW: Auto-select default category if available
            if (defaultCategory) {
              const categoryExists = courseCategoriesData.find(cat => cat.id === defaultCategory);
              if (categoryExists) {
                console.log(' Auto-selecting default category:', defaultCategory);
                setSelectedCategory(defaultCategory);
               // Auto-load courses for the default category
              loadCoursesForCategory(defaultCategory);
              }
            }
          } else {
            setCategories([]);
            setSuccess({ type: 'info', message: 'No course categories found.' });
          }
        }
      } catch (e) {
        console.error(' Error loading course categories:', e);
        if (!cancelled) {
          setCategories([]);
          setSuccess({ type: 'error', message: `Failed to load categories: ${e.message}` });
        }
      } finally {
        if (!cancelled) {
          setLoadingStates(prev => ({ ...prev, categories: false }));
        }
      }
    };

    loadInitialCategories();
    return () => { cancelled = true; };
  }, [isOpen, defaultCategory]);

  //  NEW: Lazy load courses for a specific category
  const loadCoursesForCategory = async (categoryId, forceReload = false) => {
    // Check if already loaded and not forcing reload
    if (coursesMap.has(categoryId) && !forceReload) {
      console.log(`Courses for category ${categoryId} already loaded`);
      return coursesMap.get(categoryId);
    }

    // Check if already loading
    if (loadingStates.courses.has(categoryId)) {
      console.log(` Courses for category ${categoryId} already loading`);
      return;
    }

    try {
      // Set loading state
      setLoadingStates(prev => ({
        ...prev,
        courses: new Set([...prev.courses, categoryId])
      }));

      console.log(` Loading courses for category ${categoryId}...`);
      
      const response = await fetch(
        `${API_BASE_URL}/questions/courses?categoryid=${categoryId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (response.ok) {
        const coursesData = await response.json();
        console.log(` Courses loaded for category ${categoryId}:`, coursesData);
        
        let coursesArray = [];
        if (Array.isArray(coursesData)) {
          coursesArray = coursesData;
        } else if (coursesData && coursesData.courses && Array.isArray(coursesData.courses)) {
          coursesArray = coursesData.courses;
        }
        
        // Process courses data
        const processedCourses = coursesArray.map(course => ({
          id: course.id || course.courseid,
          name: course.fullname || course.name || 'Unknown Course',
          shortname: course.shortname || '',
          categoryId: categoryId,
          categoryName: findCategoryById(categoryId)?.name || 'Unknown Category',
          summary: course.summary || '',
          visible: course.visible !== 0,
          startdate: course.startdate,
          questioncount: course.questioncount || 0,
          enddate: course.enddate,
          enrolledusers: course.enrolledusers || 0,
          progress: course.progress || 0,
          _originalData: course
        }));

        // Cache the courses
        setCoursesMap(prev => new Map(prev).set(categoryId, processedCourses));
         // NEW: Auto-select default course if available
    if (defaultCourse && defaultCourse !== null) {
      const found = processedCourses.find(c => c.id === defaultCourse);
      if (found) {
        setSelectedCourse(found);
      }
    }

        console.log(` Successfully loaded ${processedCourses.length} courses for category ${categoryId}`);
        return processedCourses;
      } else {
        throw new Error(`Failed to load courses: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(` Error loading courses for category ${categoryId}:`, error);
      setCoursesMap(prev => new Map(prev).set(categoryId, [])); // Cache empty result
      setSuccess({ 
        type: 'error', 
        message: `Failed to load courses for category ${categoryId}: ${error.message}` 
      });
      return [];
    } finally {
      // Clear loading state
      setLoadingStates(prev => {
        const newCourses = new Set(prev.courses);
        newCourses.delete(categoryId);
        return { ...prev, courses: newCourses };
      });
    }
  };

  // Get courses for selected category from cache
  const getCoursesForCategory = (categoryId) => {
    return coursesMap.get(categoryId) || [];
  };

  // Handlers
  const handleCategorySelect = async (categoryId) => {
    console.log(' Category selected:', categoryId);
    
    if (selectedCategory === categoryId) {
      // Deselect if clicking the same category
      setSelectedCategory(null);
      setSelectedCourse(null);
      setSuccess({ type: 'info', message: 'Category deselected' });
    } else {
      setSelectedCategory(categoryId);
      setSelectedCourse(null);
      
      const category = findCategoryById(categoryId);
      const categoryName = category?.name || `Category ${categoryId}`;
      
      // Save user preference
      localStorage.setItem('CourseCategoryId', categoryId.toString());
      
      // setSuccess({ 
      //   type: 'success', 
      //   message: `Selected: ${categoryName} - Loading courses...` 
      // });

      // NEW: Lazy load courses for this category
      const courses = await loadCoursesForCategory(categoryId);
      
      // setSuccess({ 
      //   type: 'success', 
      //   message: `Selected: ${categoryName} (${courses.length} courses loaded)` 
      // });
    }
  };

  //  NEW: Handle course selection
  const handleCourseSelect = (course) => {
    console.log(' Course selected:', course);
    
    setSelectedCourse(course);
  };

  //  NEW: Confirm course selection and navigate
  const confirmCourseSelection = () => {
    if (!selectedCourse) return;

    const course = selectedCourse;
    // When selecting a category
//  localStorage.setItem('userCourseCategoryId', selectedCategory?.toString() || '');
// Save user preference
// localStorage.setItem('userPreferredCourseId', course.id.toString());
// localStorage.setItem('userPreferredCourseName', course.name);
// Save question category name (if available)
//const questionCategoryName = findCategoryById(selectedCategory)?.name || '';
// localStorage.setItem('userPreferredQuestionCategoryName', questionCategoryName);
// Optionally, save the question category id again for clarity
//localStorage.setItem('userPreferredQuestionCategoryId', selectedCategory?.toString() || '');
    // Set filters for course-specific questions

//     This means your questions are filtered by courseId only, not by the categories that belong to that course.
// If your questions are organized by category, this may show questions from other categories as well.


    // if (setFilters) {
    //   setFilters({ 
    //     category: 'All', 
    //     status: 'All', 
    //     type: 'All', 
    //     courseId: course.id,
    //     courseName: course.name
    //   });
    // }
        // Find all categories for this course
    const courseCategories = categories.filter(cat => cat.courseid === course.id || cat.course_id === course.id);
    const categoryIds = courseCategories.map(cat => cat.id);
    
    if (setFilters) {
      setFilters({ 
        category: categoryIds.length === 1 ? categoryIds[0] : 'All',
        categoryIds, 
        status: 'All', 
        type: 'All', 
        courseId: course.id,
        courseName: course.name
      });
    }
    if (onCourseSelect) {
      onCourseSelect({
        id: course.id,
        name: course.name,
        courseId: course.id
      });
    }
    
    if (onNavigateToQuestions) onNavigateToQuestions();
    onClose();
    
    setSuccess({ 
      type: 'success', 
      message: `Selected course: ${course.name} (ID: ${course.id})` 
    });
  };

  const handleClearSelection = () => {
    setSelectedCategory(null);
    setSelectedCourse(null);
    setSuccess({ type: 'info', message: 'Selection cleared' });
  };
  
  const toggleExpanded = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  //  NEW: Handle refresh courses for a category
  const handleRefreshCourses = async (categoryId) => {
    await loadCoursesForCategory(categoryId, true); // Force reload
  };

  // Render category tree with Moodle-style indentation
  const renderCategory = (category, level = 0) => {
    const isSelected = selectedCategory === category.id;
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const coursesInCategory = getCoursesForCategory(category.id);
    const isLoadingCourses = loadingStates.courses.has(category.id);
    const hasLoadedCourses = coursesMap.has(category.id);
    // Inline styles
    const categoryRowStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: 12, // Consistent padding for all levels
      borderRadius: 12,
      border: '1px solid',
      borderColor: isSelected ? '#0ea5e9' : '#e5e7eb',
      background: isSelected ? '#f0f9ff' : '#fff',
      boxShadow: isSelected ? '0 1px 4px 0 rgba(14,165,233,0.08)' : 'none',
      transition: 'all 0.2s',
      cursor: 'pointer',
      marginLeft: 0, // Remove indentation for consistent sizing
      marginBottom: 4,
      minHeight: 44, // Consistent minimum height
    };
    const expandBtnStyle = {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      transition: 'background 0.2s',
      outline: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 20, // Fixed width for consistency
      height: 20, // Fixed height for consistency
      padding: 0,
    };
    const badgeStyle = (bg, color) => ({
      fontSize: 12,
      
      padding: '2px 6px',
      borderRadius: 12,
      background: bg,
      color: color,
      fontWeight: 500,
      marginLeft: 4,
    });
    const idBadgeStyle = badgeStyle(isSelected ? '#e0f2fe' : '#f3f4f6', isSelected ? '#0369a1' : '#6b7280');
    const courseCountBadgeStyle = badgeStyle(isSelected ? '#bae6fd' : '#f3f4f6', isSelected ? '#0369a1' : '#6b7280');
    const levelBadgeStyle = badgeStyle(level === 0 ? '#e0f2fe' : '#f3f4f6', level === 0 ? '#0369a1' : '#64748b');
    const nameStyle = {
      fontWeight: 600,
      fontSize: 14, // Consistent size for all levels
      color: isSelected ? '#0c4a6e' : '#111827', // Consistent color for all levels
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      marginRight: 8,
    };
    const idNumberStyle = {
      fontSize: 12,
      color: '#6b7280',
      marginTop: 2,
    };
    return (
      <div key={category.id} style={{ marginBottom: 4 }}>
        {/* Category Row */}
        <div 
          style={categoryRowStyle}
          onClick={() => handleCategorySelect(category.id)}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={e => { e.stopPropagation(); toggleExpanded(category.id); }}
              style={expandBtnStyle}
              tabIndex={-1}
            >
              {isExpanded ? 
                <Minus size={14} color="#52525b" /> : 
                <Plus size={14} color="#52525b" />
              }
            </button>
          ) : (
            <div style={{ width: 20, height: 20 }} /> // Placeholder to maintain consistent spacing
          )}
          {/* Selection Radio */}
          <div style={{ flexShrink: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isSelected ? (
              <CheckCircle size={16} color="#2563eb" />
            ) : (
              <Circle size={16} color="#9ca3af" />
            )}
          </div>
          {/* Category Icon */}
          <div style={{ flexShrink: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Folder size={16} color={isSelected ? '#2563eb' : '#64748b'} />
          </div>
          {/* Category Name */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={nameStyle}>{category.name}</span>
              {/* Course Count Badge */}
              {/* <span style={courseCountBadgeStyle}>
                {isLoadingCourses ? '...' : 
                 hasLoadedCourses ? `${coursesInCategory.length} course${coursesInCategory.length !== 1 ? 's' : ''}` :
                 'Click to load courses'}
              </span> */}
              {/* Loading indicator */}
              {isLoadingCourses && (
                <Loader size={14} style={{ color: '#2563eb', animation: 'spin 1s linear infinite' }} />
              )}
              {/* ID Badge */}
              {/* <span style={idBadgeStyle}>ID: {category.id}</span> */}
            </div>
            {/* ID Number */}
            {category.idnumber && (
              <div style={idNumberStyle}>{category.idnumber}</div>
            )}
          </div>
          {/* Level Indicator */}
          <div style={{ flexShrink: 0 }}>
            {/* <span style={levelBadgeStyle}>L{level + 1}</span> */}
          </div>
        </div>
        {/* Children */}
        {hasChildren && isExpanded && (
          <div style={{ marginTop: 4 }}>
            {category.children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render course card
  const renderCourse = (course) => {
    const isSelected = selectedCourse?.id === course.id;
    const cardStyle = {
      background: isSelected ? '#f0f9ff' : '#fff',
      border: '2px solid',
      borderColor: isSelected ? '#0ea5e9' : '#e5e7eb',
      borderRadius: 12,
      padding: 16,
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: isSelected ? '0 2px 8px 0 rgba(14,165,233,0.10)' : 'none',
      marginBottom: 8,
    };
    const headerStyle = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 };
    const nameStyle = {
      fontWeight: 600,
      fontSize: 16,
      color: isSelected ? '#0c4a6e' : '#111827',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      marginBottom: 2,
    };
    const shortnameStyle = { fontSize: 14, color: '#2563eb', fontWeight: 500 };
    const badgeStyle = (bg, color) => ({
      fontSize: 12,
      padding: '2px 8px',
      borderRadius: 12,
      background: bg,
      color: color,
      fontWeight: 500,
      marginLeft: 4,
    });
    const visibleBadgeStyle = badgeStyle(course.visible ? '#e0f2fe' : '#f3f4f6', course.visible ? '#0369a1' : '#6b7280');
    const statsStyle = { display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 };
    const statItemStyle = { display: 'flex', alignItems: 'center', gap: 4, color: '#64748b' };
    const arrowStyle = {
      transition: 'all 0.2s',
      color: isSelected ? '#2563eb' : '#9ca3af',
      transform: isSelected ? 'translateX(4px)' : 'none',
    };
    const breadcrumbStyle = { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12, fontSize: 12, color: '#64748b' };
    const summaryStyle = { marginBottom: 12, fontSize: 14, color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
    return (
      <div 
        key={course.id}
        style={cardStyle}
        onClick={() => handleCourseSelect(course)}
      >
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={nameStyle} title={course.name}>{course.name}</h4>
            {course.shortname && (
              <p style={shortnameStyle}>{course.shortname}</p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* <span style={visibleBadgeStyle}>{course.visible ? 'Visible' : 'Hidden'}</span> */}
            {isSelected && <CheckCircle size={20} color="#2563eb" />}
          </div>
        </div>
        {/* Category Breadcrumb */}
        <div style={breadcrumbStyle}>
          <GraduationCap size={12} />
          <span>{course.categoryName}</span>
        </div>
        {/* Summary */}
        {course.summary && (
          <div style={summaryStyle}>
            <p>{course.summary.replace(/<[^>]*>/g, '')}</p>
          </div>
        )}
        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14 }}>
          <div style={statsStyle}>
            {/* <div style={statItemStyle}>
              <Users size={14} />
              <span>{course.enrolledusers || 0}</span>
            </div> */}
            {/* <div style={statItemStyle}>
              <GraduationCap size={14} />
              <span style={{ color: '#2563eb', fontWeight: 500 }}>ID: {course.id}</span>
            </div> */}
          </div>
          {/* <ArrowRight size={16} style={arrowStyle} /> */}
        </div>
      </div>
    );
  };

  // Filter courses based on search and selected category
  const filteredCourses = selectedCategory 
    ? getCoursesForCategory(selectedCategory).filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.shortname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Modal styles
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(30,41,59,0.25)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};
const modalContentStyle = {
  background: '#fff',
  borderRadius: 20,
  boxShadow: '0 8px 32px 0 rgba(30,41,59,0.18)',
  width: '100%',
  maxWidth: 1200,
  maxHeight: '95vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
};

// Modal root for portal
const modalRoot = document.getElementById('modal-root') || document.body;

// Modal close on background click or Esc
function useModalClose(onClose, isOpen) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, isOpen]);
}

// Don't render if modal is not open
if (!isOpen) return null;

// Modal overlay and modal styles
const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(30,41,59,0.25)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 8,
};

const modalStyle = {
  background: '#fff',
  borderRadius: 14,
  boxShadow: '0 4px 24px 0 rgba(30,41,59,0.10)',
  width: '100%',
  maxWidth: 1070,
  minWidth: 320,
  height: '90vh',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  outline: 'none',
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid #e5e7eb',
  background: '#f8fafc',
};

const sectionStyle = {
  flex: 1,
  overflow: 'hidden',
  padding: 16,
  display: 'flex',
  gap: 16,
  flexDirection: 'row',
};

const leftColStyle = {
  width: '45%',
  borderRight: '1px solid #e5e7eb',
  paddingRight: 12,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
};

const rightColStyle = {
  width: '55%',
  paddingLeft: 12,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
};

const footerStyle = {
  borderTop: '1px solid #e5e7eb',
  padding: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#f8fafc',
};

const neutralBadgeStyle = {
  fontSize: 12,
  padding: '2px 8px',
  borderRadius: 12,
  background: '#f3f4f6',
  color: '#64748b',
  fontWeight: 500,
  marginLeft: 4,
};

const neutralButtonStyle = {
  padding: '8px 20px',
  background: '#e5e7eb',
  color: '#334155',
  borderRadius: 8,
  border: 'none',
  fontWeight: 500,
  fontSize: 15,
  cursor: 'pointer',
  transition: 'background 0.2s',
};


const proceedButtonStyle = {
  ...neutralButtonStyle,
  background: '#64748b',
  color: '#fff',
  fontWeight: 600,
};

const clearButtonStyle = {
  ...neutralButtonStyle,
  background: '#fff',
  color: '#ef4444',
  border: '1px solid #ef4444',
};




const modalContent = (
  <div style={overlayStyle} onClick={onClose}>
    <div
      style={modalStyle}
      ref={modalRef}
      tabIndex={-1}
      onClick={e => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Home size={22} color="#64748b" />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#334155', margin: 0 }}>Course Categories & Courses</h2>
        </div>
        <button
          onClick={onClose}
          style={{ ...neutralButtonStyle, padding: 6, background: 'none', color: '#64748b' }}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      {/* Status Messages */}
      {error && (
        <div style={{ margin: '16px 16px 0 16px', background: '#fef2f2', borderLeft: '4px solid #f87171', padding: 8, borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AlertCircle size={14} color="#f87171" style={{ marginRight: 8 }} />
            <span style={{ color: '#b91c1c', fontSize: 13 }}>{error}</span>
            <button onClick={clearError} style={{ marginLeft: 'auto', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={12} />
            </button>
          </div>
        </div>
      )}
      {success && (
        <div style={{ margin: '16px 16px 0 16px', background: '#f3f4f6', borderLeft: '4px solid #2563eb', padding: 8, borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Check size={14} color="#2563eb" style={{ marginRight: 8 }} />
            <span style={{ color: '#2563eb', fontSize: 13 }}>{success.message}</span>
            <button onClick={() => setSuccess(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={12} />
            </button>
          </div>
        </div>
      )}
      {/* Content */}
      <div style={sectionStyle}>
        {/* Left: Categories */}
        <div style={leftColStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#334155', margin: 0 }}>Course Categories</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {selectedCategory && (
                <button
                  onClick={handleClearSelection}
                  style={clearButtonStyle}
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingStates.categories ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
                <Loader className="animate-spin" size={20} color="#64748b" style={{ marginRight: 8 }} />
                <span style={{ color: '#64748b' }}>Loading categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                <Building2 size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 15, fontWeight: 500, color: '#334155', marginBottom: 6 }}>No categories found</p>
                <p style={{ fontSize: 13 }}>Check your API connection.</p>
              </div>
            ) : (
              <div>
                {categories.map(category => renderCategory(category))}
              </div>
            )}
          </div>
        </div>
        {/* Right: Courses */}
        <div style={rightColStyle}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#334155', margin: 0 }}>Courses</h3>
              {selectedCategory && (
                <span style={neutralBadgeStyle}>
                  {loadingStates.courses.has(selectedCategory) ? 'Loading...' : `${filteredCourses.length} courses`}
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 12px 6px 32px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border 0.2s',
                  marginBottom: 0,
                }}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!selectedCategory ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                <BookOpen size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 15, fontWeight: 500, color: '#334155', marginBottom: 6 }}>Select a category</p>
                <p style={{ fontSize: 13 }}>Choose a category to view its courses.</p>
              </div>
            ) : loadingStates.courses.has(selectedCategory) ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
                <Loader className="animate-spin" size={20} color="#64748b" style={{ marginRight: 8 }} />
                <span style={{ color: '#64748b' }}>Loading courses...</span>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                <BookOpen size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 15, fontWeight: 500, color: '#334155', marginBottom: 6 }}>No courses found</p>
                <p style={{ fontSize: 13 }}>No courses available in the selected category.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                {filteredCourses.map(course => renderCourse(course))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Footer */}
      <div style={footerStyle}>
        <div style={{ fontSize: 13, color: '#64748b' }}>
          {selectedCategory 
            ? loadingStates.courses.has(selectedCategory)
              ? 'Loading courses...'
              : `${filteredCourses.length} course(s) in selected category`
            : 'Select a category to view courses'
          }
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onClose}
            style={neutralButtonStyle}
          >
            Close
          </button>
          {selectedCourse && (
            <button
              onClick={confirmCourseSelection}
              style={proceedButtonStyle}
            >
              Proceed to Questions
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);



return ReactDOM.createPortal(modalContent, document.body);


};

export default CategoriesComponent;
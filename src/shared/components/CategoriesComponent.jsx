import React, { useState, useEffect } from 'react';
import { 
  X, FolderOpen, Folder, BookOpen, Users, Search, Filter, ChevronRight, ChevronDown, 
  Check, Loader, AlertCircle, Eye, ArrowRight, Radio, CheckCircle, Circle, Home, 
  Building2, GraduationCap, FileText, Plus, Minus
} from 'lucide-react';
import { useCategoriesAPI } from '../../api/categoriesAPI';

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
  const [allCourses, setAllCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState(null);
  const [viewMode, setViewMode] = useState('categories'); // 'categories' or 'courses'

  // API
  const {
    loading,
    error,
    clearError,
    fetchQuestionCategories,
    fetchCourseCategories,
    fetchCoursesByCategoryId
  } = useCategoriesAPI();

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

  // Load categories and courses from API
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const loadData = async () => {
      try {
        clearError();
        setSuccess(null);
        
        // Load course categories (these are different from question categories)
        console.log('🏛️ Loading course categories from API...');
        const response = await fetch('http://127.0.0.1:8000/api/questions/course-categories', {
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
        console.log('🏛️ Course categories response:', courseCategoriesData);
        
        if (!cancelled) {
          if (Array.isArray(courseCategoriesData) && courseCategoriesData.length > 0) {
            const categoryTree = buildCategoryTree(courseCategoriesData);
            setCategories(categoryTree);
            
            // Auto-expand root categories for better UX
            const rootIds = new Set(categoryTree.map(cat => cat.id));
            setExpandedCategories(rootIds);
            
            setSuccess({ 
              type: 'success', 
              message: `Loaded ${courseCategoriesData.length} course categories from API` 
            });

            // Load all courses for all categories
            await loadAllCourses(courseCategoriesData);
          } else {
            setCategories([]);
            setSuccess({ type: 'info', message: 'No course categories found.' });
          }
        }
      } catch (e) {
        console.error('🏛️ Error loading course categories:', e);
        if (!cancelled) {
          setCategories([]);
          setSuccess({ type: 'error', message: `Failed to load categories: ${e.message}` });
        }
      }
    };

    loadData();
    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, [isOpen]);

  // Load all courses for all categories
  const loadAllCourses = async (categoriesData) => {
    try {
      console.log('📚 Loading courses for all categories...');
      
      const allCoursesMap = new Map();
      
      for (const category of categoriesData) {
        try {
          console.log(`📚 Fetching courses for category ${category.id} (${category.name})`);
          
          const response = await fetch(
            `http://127.0.0.1:8000/api/questions/courses?categoryid=${category.id}`,
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
            console.log(`📚 Courses for category ${category.id}:`, coursesData);
            
            let coursesArray = [];
            if (Array.isArray(coursesData)) {
              coursesArray = coursesData;
            } else if (coursesData && coursesData.courses && Array.isArray(coursesData.courses)) {
              coursesArray = coursesData.courses;
            }
            
            coursesArray.forEach(course => {
              const courseData = {
                id: course.id || course.courseid,
                name: course.fullname || course.name || 'Unknown Course',
                shortname: course.shortname || '',
                categoryId: category.id,
                categoryName: category.name,
                categoryPath: getCategoryPath(category, categoriesData),
                summary: course.summary || '',
                visible: course.visible !== 0,
                startdate: course.startdate,
                enddate: course.enddate,
                enrolledusers: course.enrolledusers || 0,
                progress: course.progress || 0,
                _originalData: course
              };
              
              allCoursesMap.set(course.id, courseData);
            });
          }
        } catch (categoryError) {
          console.warn(`Failed to fetch courses for category ${category.id}:`, categoryError);
        }
      }

      const coursesArray = Array.from(allCoursesMap.values());
      setAllCourses(coursesArray);
      console.log('📚 All courses loaded:', coursesArray.length);
      
    } catch (error) {
      console.error('📚 Error loading all courses:', error);
    }
  };

  // Get category path for breadcrumb
  const getCategoryPath = (category, allCategories) => {
    const path = [category.name];
    let currentCategory = category;
    
    while (currentCategory.parent !== 0) {
      const parentCategory = allCategories.find(cat => cat.id === currentCategory.parent);
      if (parentCategory) {
        path.unshift(parentCategory.name);
        currentCategory = parentCategory;
      } else {
        break;
      }
    }
    
    return path;
  };

  // Get courses for selected category (including subcategories)
  const getCoursesForCategory = (categoryId) => {
    const category = findCategoryById(categoryId);
    if (!category) return [];

    // Get all descendant category IDs
    const getAllDescendantIds = (cat) => {
      const ids = [cat.id];
      if (cat.children && cat.children.length > 0) {
        cat.children.forEach(child => {
          ids.push(...getAllDescendantIds(child));
        });
      }
      return ids;
    };

    const categoryIds = getAllDescendantIds(category);
     return allCourses.filter(course => course.categoryId === categoryId);
    // return allCourses.filter(course => categoryIds.includes(course.categoryId));
  };

  // Handlers
  const handleCategorySelect = (categoryId) => {
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
      const coursesCount = getCoursesForCategory(categoryId).length;
      
      setSuccess({ 
        type: 'success', 
        message: `Selected: ${categoryName} (${coursesCount} courses)` 
      });
    }
  };

  const handleCourseSelect = (course) => {
    console.log('📚 Course selected:', course);
    
    setSelectedCourse(course);
    
    // Set filters for course-specific questions
    if (setFilters) {
      setFilters({ 
        category: 'All', 
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

  // Render category tree with Moodle-style indentation
  const renderCategory = (category, level = 0) => {
    const isSelected = selectedCategory === category.id;
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const coursesInCategory = getCoursesForCategory(category.id);
    
    // Moodle-style indentation
    const indentWidth = level * 24;
    
    return (
      <div key={category.id} className="mb-1">
        {/* Category Row */}
        <div 
          className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 cursor-pointer
            ${isSelected 
              ? 'border-blue-500 bg-blue-50 shadow-sm' 
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          style={{ marginLeft: `${indentWidth}px` }}
          onClick={() => handleCategorySelect(category.id)}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(category.id);
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
            >
              {isExpanded ? 
                <Minus size={14} className="text-gray-600" /> : 
                <Plus size={14} className="text-gray-600" />
              }
            </button>
          )}
          
          {/* Selection Radio */}
          <div className="flex-shrink-0">
            {isSelected ? (
              <CheckCircle size={16} className="text-blue-600" />
            ) : (
              <Circle size={16} className="text-gray-400" />
            )}
          </div>
          
          {/* Category Icon */}
          <div className="flex-shrink-0">
            {level === 0 ? (
              <Building2 size={18} className={isSelected ? "text-blue-600" : "text-gray-600"} />
            ) : hasChildren ? (
              <FolderOpen size={16} className={isSelected ? "text-sky-500" : "text-gray-500"} />
            ) : (
              <Folder size={16} className={isSelected ? "text-blue-500" : "text-gray-500"} />
            )}
          </div>
          
          {/* Category Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium truncate ${
                level === 0 
                  ? (isSelected ? 'text-blue-900 text-base' : 'text-gray-900 text-base')
                  : (isSelected ? 'text-blue-800 text-sm' : 'text-gray-800 text-sm')
              }`}>
                {category.name}
              </span>
              
              {/* Course Count Badge */}
              <span className={`text-xs px-2 py-1 rounded-full ${
                isSelected 
                  ? 'bg-blue-200 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {coursesInCategory.length} course{coursesInCategory.length !== 1 ? 's' : ''}
              </span>
              
              {/* ID Badge */}
              <span className={`text-xs px-2 py-1 rounded ${
                isSelected 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                ID: {category.id}
              </span>
            </div>
            
            {/* ID Number */}
            {category.idnumber && (
              <div className="text-xs text-gray-500 mt-1">
                {category.idnumber}
              </div>
            )}
          </div>
          
          {/* Level Indicator */}
          <div className="flex-shrink-0">
            <span className={`text-xs px-2 py-1 rounded-full ${
              level === 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              L{level + 1}
            </span>
          </div>
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {category.children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render course card
  const renderCourse = (course) => {
    const isSelected = selectedCourse?.id === course.id;
    
    return (
      <div 
        key={course.id}
        className={`group bg-white border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
          ${isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-md' 
            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
          }`}
        onClick={() => handleCourseSelect(course)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold truncate ${
              isSelected ? 'text-blue-900' : 'text-gray-900'
            }`} title={course.name}>
              {course.name}
            </h4>
            {course.shortname && (
              <p className="text-sm text-blue-600 font-medium">
                {course.shortname}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              course.visible 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {course.visible ? 'Visible' : 'Hidden'}
            </span>
            {isSelected && (
              <CheckCircle size={20} className="text-blue-600" />
            )}
          </div>
        </div>
        
        {/* Category Breadcrumb */}
        <div className="flex items-center gap-1 mb-3 text-xs text-gray-600">
          <Home size={12} />
          <span>{course.categoryPath?.join(' > ') || course.categoryName}</span>
        </div>
        
        {/* Summary */}
        {course.summary && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 line-clamp-2">
              {course.summary.replace(/<[^>]*>/g, '')}
            </p>
          </div>
        )}
        
        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Users size={14} className="text-gray-500" />
              <span className="text-gray-600">{course.enrolledusers || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <GraduationCap size={14} className="text-gray-500" />
              <span className="text-blue-600 font-medium">ID: {course.id}</span>
            </div>
          </div>
          <ArrowRight size={16} className={`transition-all duration-200 ${
            isSelected 
              ? 'text-blue-600 transform translate-x-1' 
              : 'text-gray-400 group-hover:text-blue-500 group-hover:transform group-hover:translate-x-1'
          }`} />
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

  // Don't render if modal is not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Course Categories & Courses</h2>
              <p className="text-sm text-gray-600">
                Select a category to view its courses, then choose a course to filter questions
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedCategory && (
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Category Selected
                </span>
              )}
              {selectedCourse && (
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Course: {selectedCourse.name}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border-l-4 border-red-400 p-3 rounded">
            <div className="flex items-center">
              <AlertCircle size={16} className="text-red-400 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
              <button onClick={clearError} className="ml-auto text-red-400 hover:text-red-600">
                <X size={14} />
              </button>
            </div>
          </div>
        )}
        {success && (
          <div className={`mx-6 mt-4 border-l-4 p-3 rounded ${
            success.type === 'error' ? 'bg-red-50 border-red-400' : 
            success.type === 'info' ? 'bg-blue-50 border-blue-400' :
            'bg-green-50 border-green-400'
          }`}>
            <div className="flex items-center">
              <Check size={16} className={`mr-2 ${
                success.type === 'error' ? 'text-red-400' : 
                success.type === 'info' ? 'text-blue-400' :
                'text-green-400'
              }`} />
              <span className={`text-sm ${
                success.type === 'error' ? 'text-red-700' : 
                success.type === 'info' ? 'text-blue-700' :
                'text-green-700'
              }`}>
                {success.message}
              </span>
              <button onClick={() => setSuccess(null)} className="ml-auto hover:opacity-75">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6 flex gap-6">
          {/* Left: Categories */}
          <div className="w-1/2 border-r pr-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Course Categories</h3>
              <div className="flex gap-2">
                {selectedCategory && (
                  <button
                    onClick={handleClearSelection}
                    className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-sm transition-colors"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="animate-spin h-6 w-6 text-blue-600 mr-2" />
                  <span className="text-gray-600">Loading categories...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-700 mb-2">No categories found</p>
                  <p className="text-sm">Check your API connection.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {categories.map(category => renderCategory(category))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Courses */}
          <div className="w-1/2 pl-6 flex flex-col">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Courses</h3>
                {selectedCategory && (
                  <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {filteredCourses.length} courses
                  </span>
                )}
              </div>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {!selectedCategory ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-700 mb-2">Select a category</p>
                  <p className="text-sm">Choose a category to view its courses.</p>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-700 mb-2">No courses found</p>
                  <p className="text-sm">No courses available in the selected category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredCourses.map(course => renderCourse(course))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedCategory 
              ? `${filteredCourses.length} course(s) in selected category`
              : 'Select a category to view courses'
            }
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (setFilters) setFilters({ category: 'All', status: 'All', type: 'All', courseId: null });
                if (onNavigateToQuestions) onNavigateToQuestions();
                onClose();
              }}
              className="px-4 py-2 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <Eye size={14} />
              View All Questions
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesComponent;
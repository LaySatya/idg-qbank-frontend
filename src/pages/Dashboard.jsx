import React, { useState, useEffect, useRef, useMemo } from 'react';
import { questionAPI } from '../api/questionAPI';
import { Users, BookOpen, FileQuestion, FolderOpen, Folder, ChevronRight, Home, Search, Filter, Grid, List, Plus, Eye, Settings } from 'lucide-react';
import TitleIcon from '@mui/icons-material/Title';
import SellIcon from '@mui/icons-material/Sell';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [activePanel, setActivePanel] = useState('categories');
  const [breadcrumb, setBreadcrumb] = useState([{ name: 'Course Categories', panel: 'categories' }]);
  
  // Data states
  const [courseCategories, setCourseCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [questionCategories, setQuestionCategories] = useState([]);
  const [questionOverview, setQuestionOverview] = useState(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Selection tracking
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedQuestionCategory, setSelectedQuestionCategory] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  
  // Tree expansion state
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  
  // Statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalQuestions: 0,
    totalCategories: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadCourseCategories();
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setStatsLoading(true);
    try {
      // First, get course categories
      const categoriesResponse = await questionAPI.getCourseCategories();
      let totalCategories = 0;
      let totalCourses = 0;
      
      if (categoriesResponse?.data && Array.isArray(categoriesResponse.data)) {
        totalCategories = categoriesResponse.data.length;
        
        // Get courses for each category to count total courses
        const coursePromises = categoriesResponse.data.slice(0, 10).map(category => // Limit to first 10 categories for performance
          questionAPI.getCourses(category.id).catch(() => ({ data: [] }))
        );
        
        const courseResponses = await Promise.allSettled(coursePromises);
        totalCourses = courseResponses.reduce((count, response) => {
          if (response.status === 'fulfilled' && response.value?.data) {
            return count + (Array.isArray(response.value.data) ? response.value.data.length : 0);
          }
          return count;
        }, 0);
      }

      // Get questions count
      const questionsResponse = await questionAPI.getQuestions({}, 1, 10000);
      let totalQuestions = 0;
      
      if (questionsResponse?.data) {
        const questionsData = questionsResponse.data;
        if (questionsData.questions && Array.isArray(questionsData.questions)) {
          totalQuestions = questionsData.total || questionsData.questions.length;
        } else if (Array.isArray(questionsData)) {
          totalQuestions = questionsData.length;
        }
      }

      setStats({
        totalUsers: 0, // Users API not implemented yet
        totalCourses,
        totalQuestions,
        totalCategories
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Fallback to zeros instead of fake data
      setStats({
        totalUsers: 0,
        totalCourses: 0,
        totalQuestions: 0,
        totalCategories: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Helper function to build hierarchical tree from flat array
  const buildCategoryTree = (categories) => {
    const categoryMap = new Map();
    const rootCategories = [];

    // First pass: create map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: build tree structure
    categories.forEach(category => {
      const categoryNode = categoryMap.get(category.id);
      if (category.parent === 0) {
        // Root level category
        rootCategories.push(categoryNode);
      } else {
        // Child category - add to parent's children array
        const parent = categoryMap.get(category.parent);
        if (parent) {
          parent.children.push(categoryNode);
        }
      }
    });

    return rootCategories;
  };

  const loadCourseCategories = async () => {
    setLoading(true);
    try {
      const response = await questionAPI.getCourseCategories();
      const flatCategories = response.data || [];
      // Build hierarchical tree structure
      const treeCategories = buildCategoryTree(flatCategories);
      setCourseCategories(treeCategories);
    } catch (error) {
      console.error('Error loading course categories:', error);
      setCourseCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async (categoryId) => {
    setLoading(true);
    try {
      const response = await questionAPI.getCourses(categoryId);
      setCourses(response.data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionCategories = async (courseId) => {
    setLoading(true);
    try {
      const response = await questionAPI.getQuestionCategories(courseId);
      setQuestionCategories(response.data || []);
    } catch (error) {
      console.error('Error loading question categories:', error);
      setQuestionCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionOverview = async (categoryId) => {
    setLoading(true);
    try {
      // Try the dedicated overview endpoint first
      try {
        const response = await questionAPI.getQuestionOverview(categoryId);
        
        if (response.data) {
          // Transform the API response to match our expected format
          const apiData = response.data;
          console.log('🔍 API Overview Data:', apiData); // Debug log
          
          const transformedData = {
            categoryName: apiData.categoryname || 'Unknown Category',
            totalQuestions: apiData.total_questions || 0,
            activeQuestions: apiData.statuses?.total_ready || 0,
            draftQuestions: apiData.statuses?.total_draft || 0,
            archivedQuestions: apiData.statuses?.total_other || 0,
            questionTypes: {},
            tags: apiData.tags || [],
            recentQuestions: [],
            executionTime: apiData.executionms || null
          };
          
          // Transform question types from array to object with enhanced data
          if (apiData.types && Array.isArray(apiData.types)) {
            console.log('🎨 Question Types Raw:', apiData.types); // Debug log
            apiData.types.forEach(type => {
              if (type.qtype && (type.count || type.count === 0)) {
                transformedData.questionTypes[type.qtype] = {
                  count: type.count,
                  name: type.name || type.qtype,
                  icon: type.icon || null
                };
              }
            });
            console.log(' Transformed Question Types:', transformedData.questionTypes); // Debug log
          }
          
          // Transform tags array if available
          if (apiData.tags && Array.isArray(apiData.tags)) {
            console.log(' Tags Raw:', apiData.tags); // Debug log
            transformedData.tags = apiData.tags.map(tag => ({
              name: tag.name,
              count: tag.count || 1
            }));
            console.log(' Transformed Tags:', transformedData.tags); // Debug log
          }
          
          // If there are recent questions in the API response, transform them
          if (apiData.recent_questions && Array.isArray(apiData.recent_questions)) {
            transformedData.recentQuestions = apiData.recent_questions.map(q => ({
              id: q.id,
              title: q.name || q.questiontext || 'Untitled Question',
              type: q.qtype || 'Unknown',
              created: q.timecreated || q.created || Date.now()
            }));
          }
          
          setQuestionOverview(transformedData);
          return;
        }
      } catch (overviewError) {
        console.error('Overview endpoint error:', overviewError);
        
        // Fallback: Use the getQuestions method to get questions from this category
        try {
          const questionsResponse = await questionAPI.getQuestions({
            categoryId: categoryId
          }, 1, 100); // page 1, up to 100 questions
          
          if (questionsResponse && questionsResponse.data && questionsResponse.data.questions) {
            const questions = questionsResponse.data.questions;
            
            // Create overview data from the questions
            const overview = {
              categoryName: 'Question Category',
              totalQuestions: questions.length,
              activeQuestions: questions.filter(q => q.status === 'active' || q.status === 'ready').length,
              draftQuestions: questions.filter(q => q.status === 'draft').length,
              archivedQuestions: questions.filter(q => q.status === 'archived' || q.status === 'hidden').length,
              questionTypes: {},
              tags: [],
              recentQuestions: questions
                .sort((a, b) => new Date(b.timecreated || b.created || 0) - new Date(a.timecreated || a.created || 0))
                .slice(0, 5)
                .map(q => ({
                  id: q.id,
                  title: q.name || q.questiontext || 'Untitled Question',
                  type: q.qtype || 'Unknown',
                  created: q.timecreated || q.created || Date.now()
                })),
              executionTime: null
            };
            
            // Count question types
            questions.forEach(q => {
              const type = q.qtype || 'unknown';
              if (!overview.questionTypes[type]) {
                overview.questionTypes[type] = {
                  count: 0,
                  name: type.replace(/([A-Z])/g, ' $1').trim(),
                  icon: null
                };
              }
              overview.questionTypes[type].count++;
            });
            
            // Extract tags from questions if available
            const tagCounts = {};
            questions.forEach(q => {
              if (q.tags && Array.isArray(q.tags)) {
                q.tags.forEach(tag => {
                  const tagName = typeof tag === 'string' ? tag : tag.name || tag.tag;
                  tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
                });
              }
            });
            
            overview.tags = Object.entries(tagCounts).map(([name, count]) => ({
              name,
              count
            }));
            
            setQuestionOverview(overview);
          } else {
            setQuestionOverview(null);
          }
        } catch (fallbackError) {
          console.error('Fallback questions fetch error:', fallbackError);
          setQuestionOverview(null);
        }
      }
    } catch (error) {
      console.error('Load question overview error:', error);
      setQuestionOverview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setSelectedCourse(null);
    setSelectedQuestionCategory(null);
    setActivePanel('courses');
    setSearchTerm(''); // Reset search when navigating
    setBreadcrumb([
      { name: 'Course Categories', panel: 'categories' },
      { name: category.fullname || category.displayname || category.name || category.shortname || 'Unknown Category', panel: 'courses' }
    ]);
    await loadCourses(category.id);
  };

  const handleCourseSelect = async (course) => {
    setSelectedCourse(course);
    setSelectedQuestionCategory(null);
    setActivePanel('questionCategories');
    setSearchTerm(''); // Reset search when navigating
    setBreadcrumb([
      { name: 'Course Categories', panel: 'categories' },
      { name: selectedCategory.fullname || selectedCategory.displayname || selectedCategory.name || selectedCategory.shortname || 'Unknown Category', panel: 'courses' },
      { name: course.fullname || course.displayname || course.name || course.shortname || 'Unknown Course', panel: 'questionCategories' }
    ]);
    await loadQuestionCategories(course.id);
  };

  const handleQuestionCategorySelect = async (questionCategory) => {
    setSelectedQuestionCategory(questionCategory);
    setActivePanel('overview');
    setSearchTerm(''); // Reset search when navigating
    setBreadcrumb([
      { name: 'Course Categories', panel: 'categories' },
      { name: selectedCategory.fullname || selectedCategory.displayname || selectedCategory.name || selectedCategory.shortname || 'Unknown Category', panel: 'courses' },
      { name: selectedCourse.fullname || selectedCourse.displayname || selectedCourse.name || selectedCourse.shortname || 'Unknown Course', panel: 'questionCategories' },
      { name: questionCategory.fullname || questionCategory.displayname || questionCategory.name || questionCategory.shortname || 'Unknown Question Category', panel: 'overview' }
    ]);
    await loadQuestionOverview(questionCategory.id);
  };

  const handleBreadcrumbClick = (item, index) => {
    setActivePanel(item.panel);
    setBreadcrumb(breadcrumb.slice(0, index + 1));
    setSearchTerm(''); // Reset search when navigating
    
    // Reset states based on panel
    switch (item.panel) {
      case 'categories':
        setSelectedCategory(null);
        setSelectedCourse(null);
        setSelectedQuestionCategory(null);
        setExpandedCategories(new Set()); // Reset tree expansion
        break;
      case 'courses':
        setSelectedCourse(null);
        setSelectedQuestionCategory(null);
        break;
      case 'questionCategories':
        setSelectedQuestionCategory(null);
        break;
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, loading = false }) => (
    <div className={`relative p-6 rounded-xl shadow-sm border border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <p className={`text-3xl font-bold ${color}`}>{value.toLocaleString()}</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-gradient-to-br ${color.replace('text-', 'from-').replace('-600', '-100')} ${color.replace('text-', 'to-').replace('-600', '-200')}`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 rounded-xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );

  const TreeItem = ({ 
    item, 
    onClick, 
    icon: Icon, 
    isSelected = false, 
    depth = 0, 
    hasChildren = false, 
    isExpanded = false, 
    onToggleExpand,
    children 
  }) => {
    // Handle different name properties based on the item type
    const displayName = item.fullname || item.displayname || item.name || item.shortname || 'Unknown';
    const indentLevel = depth * 24; // 24px per level
    
    return (
      <div className="mb-2">
        <div
          className={`group flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
            isSelected 
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md' 
              : 'bg-white border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:border-blue-200 hover:shadow-md'
          }`}
          style={{ marginLeft: `${indentLevel}px` }}
        >
          {/* Expand/Collapse button for categories with children */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(item.id);
              }}
              className="mr-2 p-1 rounded hover:bg-gray-200 transition-colors duration-200"
            >
              <ChevronRight 
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                  isExpanded ? 'transform rotate-90' : ''
                }`} 
              />
            </button>
          )}
          
          {/* Category icon */}
          <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-100'} transition-colors duration-200 ${!hasChildren ? 'ml-6' : ''}`}>
            <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'} transition-colors duration-200`} />
          </div>
          
          {/* Category content */}
          <div 
            className="ml-3 flex-1"
            onClick={() => onClick(item)}
          >
            <div className="flex items-center justify-between">
              <span className={`font-medium text-sm ${isSelected ? 'text-blue-900' : 'text-gray-800 group-hover:text-blue-900'} transition-colors duration-200`}>
                {displayName}
              </span>
              {item.coursecount > 0 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {item.coursecount} courses
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>
            )}
            {item.idnumber && (
              <p className="text-xs text-gray-400 mt-1">ID: {item.idnumber}</p>
            )}
          </div>
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && children && (
          <div className="mt-1">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Filter function for search - memoized to prevent unnecessary re-renders
  const filterItems = useMemo(() => {
    return (items, searchTerm) => {
      if (!searchTerm.trim()) return items;
      
      const filterTree = (nodes) => {
        return nodes.reduce((filtered, node) => {
          const searchableText = [
            node.fullname,
            node.displayname, 
            node.name,
            node.shortname,
            node.description,
            node.idnumber
          ].join(' ').toLowerCase();
          
          const matchesSearch = searchableText.includes(searchTerm.toLowerCase());
          const filteredChildren = node.children ? filterTree(node.children) : [];
          
          // Include node if it matches search OR has matching children
          if (matchesSearch || filteredChildren.length > 0) {
            filtered.push({
              ...node,
              children: filteredChildren
            });
          }
          
          return filtered;
        }, []);
      };
      
      return filterTree(items);
    };
  }, []);

  // Function to expand categories that have matching search results
  const expandCategoriesWithMatches = (categories, searchTerm) => {
    if (!searchTerm.trim()) return;

    const newExpanded = new Set();

    const checkAndExpand = (nodes) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          const hasMatchingChildren = node.children.some(child => {
            const searchableText = [
              child.fullname,
              child.displayname,
              child.name,
              child.shortname,
              child.description,
              child.idnumber
            ].join(' ').toLowerCase();
            return searchableText.includes(searchTerm.toLowerCase());
          });

          if (hasMatchingChildren) {
            newExpanded.add(node.id);
          }

          checkAndExpand(node.children);
        }
      });
    };

    checkAndExpand(categories);

    // Only update state if the expanded set actually changed
    const isSame = expandedCategories.size === newExpanded.size && [...expandedCategories].every(id => newExpanded.has(id));
    if (!isSame) {
      setExpandedCategories(newExpanded);
    }
  };

  // Handle expand/collapse
  const handleToggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

const SearchAndFilterBar = ({ itemCount, itemType }) => {
  const searchInputRef = useRef(null);

  // Ensure input stays focused after typing
  useEffect(() => {
    if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchTerm]);

  return (
       <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500" />
            <input
              ref={searchInputRef}
              type="text" // Make sure this is "text"
              placeholder={`Search ${itemType}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-blue-200 focus:border-blue-300 transition-all duration-200 text-gray-900 bg-white placeholder-gray-400 outline-none"
              autoComplete="off"
            />
          </div>
          <div className="text-sm text-gray-500 font-medium">
            {itemCount} {itemType}
          </div>
        </div>
      </div>
    </div>
  );
};

  const CategoryPanel = () => {
    const filteredCategories = useMemo(() => 
      filterItems(courseCategories, searchTerm), 
      [courseCategories, searchTerm, filterItems]
    );

    // Auto-expand matching categories when searching
    useEffect(() => {
      if (searchTerm.trim()) {
        expandCategoriesWithMatches(courseCategories, searchTerm);
      }
    }, [searchTerm, courseCategories]);

    // Recursive function to render category tree
    const renderCategoryTree = (categories, depth = 0) => {
      return categories.map((category) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedCategories.has(category.id);
        
        return (
          <TreeItem
            key={category.id}
            item={category}
            onClick={handleCategorySelect}
            icon={Folder}
            isSelected={selectedCategory?.id === category.id}
            depth={depth}
            hasChildren={hasChildren}
            isExpanded={isExpanded}
            onToggleExpand={handleToggleExpand}
          >
            {hasChildren && isExpanded && renderCategoryTree(category.children, depth + 1)}
          </TreeItem>
        );
      });
    };

    // Count total categories recursively
    const countTotalCategories = (categories) => {
      return categories.reduce((count, category) => {
        return count + 1 + (category.children ? countTotalCategories(category.children) : 0);
      }, 0);
    };

    const totalCategoryCount = countTotalCategories(filteredCategories);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Course Categories</h2>
          {/* <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
            <Plus className="h-4 w-4" />
            Add Category
          </button> */}
        </div>
        
        <SearchAndFilterBar 
          itemCount={totalCategoryCount}
          itemType="categories"
        />

        {/* Expand/Collapse All Controls */}
        {courseCategories.length > 0 && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                if (expandedCategories.size === 0) {
                  // Expand all
                  const allIds = new Set();
                  const collectIds = (categories) => {
                    categories.forEach(cat => {
                      if (cat.children && cat.children.length > 0) {
                        allIds.add(cat.id);
                        collectIds(cat.children);
                      }
                    });
                  };
                  collectIds(courseCategories);
                  setExpandedCategories(allIds);
                } else {
                  // Collapse all
                  setExpandedCategories(new Set());
                }
              }}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${expandedCategories.size === 0 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {expandedCategories.size === 0 ? 'Expand All' : 'Collapse All'}
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading categories...</p>
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No categories found' : 'No course categories found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? `No categories match "${searchTerm}". Try adjusting your search.`
                : 'Get started by creating your first course category.'
              }
            </p>
            {!searchTerm && (
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                <Plus className="h-4 w-4" />
                Create First Category
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {renderCategoryTree(filteredCategories)}
          </div>
        )}
      </div>
    );
  };

  const CoursePanel = () => {
    const filteredCourses = useMemo(() => 
      filterItems(courses, searchTerm), 
      [courses, searchTerm, filterItems]
    );
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Courses</h2>
            <p className="text-gray-600 mt-1">
              in {selectedCategory?.fullname || selectedCategory?.displayname || selectedCategory?.name || selectedCategory?.shortname || 'Unknown Category'}
            </p>
          </div>
          {/* <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
            <Plus className="h-4 w-4" />
            Add Course
          </button> */}
        </div>
        
        <SearchAndFilterBar 
          itemCount={filteredCourses.length}
          itemType="courses"
        />
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
              <p className="text-gray-600">Loading courses...</p>
            </div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No courses found' : 'No courses in this category'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? `No courses match "${searchTerm}". Try adjusting your search.`
                : 'This category doesn\'t have any courses yet.'
              }
            </p>
            {!searchTerm && (
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
                <Plus className="h-4 w-4" />
                Create First Course
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {filteredCourses.map((course) => (
              <TreeItem
                key={course.id}
                item={course}
                onClick={handleCourseSelect}
                icon={BookOpen}
                isSelected={selectedCourse?.id === course.id}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const QuestionCategoryPanel = () => {
    const filteredQuestionCategories = useMemo(() => 
      filterItems(questionCategories, searchTerm), 
      [questionCategories, searchTerm, filterItems]
    );
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Question Categories</h2>
            <p className="text-gray-600 mt-1">
              in {selectedCourse?.fullname || selectedCourse?.displayname || selectedCourse?.name || selectedCourse?.shortname || 'Unknown Course'}
            </p>
          </div>
          {/* <button className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors duration-200">
            <Plus className="h-4 w-4" />
            Add Question Category
          </button> */}
        </div>
        
        <SearchAndFilterBar 
          itemCount={filteredQuestionCategories.length}
          itemType="question categories"
        />
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mb-4"></div>
              <p className="text-gray-600">Loading question categories...</p>
            </div>
          </div>
        ) : filteredQuestionCategories.length === 0 ? (
          <div className="text-center py-16">
            <FileQuestion className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No question categories found' : 'No question categories in this course'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? `No question categories match "${searchTerm}". Try adjusting your search.`
                : 'This course doesn\'t have any question categories yet.'
              }
            </p>
            {!searchTerm && (
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors duration-200">
                <Plus className="h-4 w-4" />
                Create First Question Category
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {filteredQuestionCategories.map((category) => (
              <TreeItem
                key={category.id}
                item={category}
                onClick={handleQuestionCategorySelect}
                icon={FileQuestion}
                isSelected={selectedQuestionCategory?.id === category.id}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const QuestionOverviewPanel = () => {
    return (
      <div className="space-y-6">
        {/* <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Question Overview</h2>
            <p className="text-gray-600 mt-1">
              {questionOverview?.categoryName || selectedQuestionCategory?.fullname || selectedQuestionCategory?.displayname || selectedQuestionCategory?.name || selectedQuestionCategory?.shortname || 'Unknown Question Category'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/questions', { state: { categoryId: selectedQuestionCategory?.id } })}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Eye className="h-4 w-4" />
              View All Questions
            </button>
            <button
              onClick={() => navigate('/questions/create', { state: { categoryId: selectedQuestionCategory?.id } })}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              Create Question
            </button>
          </div>
        </div> */}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading question overview...</p>
            </div>
          </div>
        ) : questionOverview ? (
          <div className="space-y-8">
            {/* Main Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Total Questions"
                value={questionOverview.totalQuestions || 0}
                icon={FileQuestion}
                color="text-blue-600"
              />
              <StatCard
                title="Ready Questions"
                value={questionOverview.activeQuestions || 0}
                icon={FolderOpen}
                color="text-green-600"
              />
              <StatCard
                title="Draft Questions"
                value={questionOverview.draftQuestions || 0}
                icon={FileQuestion}
                color="text-yellow-600"
              />
              <StatCard
                title="Total Tags"
                value={questionOverview.tags ? questionOverview.tags.length : 0}
                icon={SellIcon}
                color="text-gray-600"
              />
            </div>

            {/* Question Types with Icons */}
            {questionOverview.questionTypes && Object.keys(questionOverview.questionTypes).length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <TitleIcon className="h-5 w-5 text-blue-600" />
                  Question Types Distribution ({Object.keys(questionOverview.questionTypes).length} types)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(questionOverview.questionTypes).map(([type, data]) => {
                    // Handle both old format (count only) and new format (object with count and details)
                    const count = typeof data === 'object' ? data.count : data;
                    const name = typeof data === 'object' ? data.name : type.replace(/([A-Z])/g, ' $1').trim();
                    const icon = typeof data === 'object' ? data.icon : null;
                    
                    console.log(` Rendering question type: ${type}`, { count, name, icon }); // Debug log
                    
                    return (
                      <div key={type} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center gap-3">
                          {icon ? (
                            <img 
                              src={icon} 
                              alt={name}
                              className="h-6 w-6"
                              onError={(e) => {
                                console.error(`Failed to load icon for ${type}:`, icon);
                                e.target.style.display = 'none';
                              }}
                              onLoad={() => {
                                console.log(`Successfully loaded icon for ${type}:`, icon);
                              }}
                            />
                          ) : (
                            <div className="h-6 w-6 rounded bg-blue-100 flex items-center justify-center">
                              <FileQuestion className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-gray-800 capitalize">
                              {name}
                            </span>
                            <p className="text-xs text-gray-500">{type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-blue-600">{count}</span>
                         
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-800"> No question types data available</p>
                <p className="text-sm text-yellow-600 mt-1">
                  questionTypes: {JSON.stringify(questionOverview?.questionTypes)}
                </p>
              </div>
            )}

            {/* Tags Cloud */}
            {questionOverview.tags && questionOverview.tags.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <SellIcon className="h-5 w-5 text-blue-600" />
                  Question Tags ({questionOverview.tags.length} tags)
                </h3>
                <div className="flex flex-wrap gap-3">
                  {questionOverview.tags.map((tag, index) => {
                    const tagData = typeof tag === 'object' ? tag : { name: tag, count: 1 };
                    return (
                      <div
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm border border-gray-300 bg-gray-50 text-gray-800 cursor-pointer"
                        title={`${tagData.count} question(s) with this tag`}
                      >
                        <span className="font-medium">{tagData.name}</span>
                        <span className="text-xs bg-white bg-opacity-70 px-2 py-1 rounded-full">
                          {tagData.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-800"> No tags data available</p>
                <p className="text-sm text-yellow-600 mt-1">
                  tags: {JSON.stringify(questionOverview?.tags)}
                </p>
              </div>
            )}

            {/* Recent Questions */}
            {questionOverview.recentQuestions && questionOverview.recentQuestions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FileQuestion className="h-5 w-5 text-green-600" />
                  Recent Questions
                </h3>
                <div className="space-y-4">
                  {questionOverview.recentQuestions.map((question, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{question.title || question.name}</h4>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {question.type}
                          </span>
                          <span className="text-sm text-gray-500">
                            Created: {new Date(question.created).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/questions/${question.id}`)}
                        className="ml-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

       
          </div>
        ) : (
          <div className="text-center py-16">
            <FileQuestion className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Question Data Available</h3>
            <p className="text-gray-600 mb-6">Unable to load question overview for this category.</p>
            <button
              onClick={() => loadQuestionOverview(selectedQuestionCategory?.id)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <FileQuestion className="h-4 w-4" />
              Retry Loading
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderActivePanel = () => {
    switch (activePanel) {
      case 'categories':
        return <CategoryPanel />;
      case 'courses':
        return <CoursePanel />;
      case 'questionCategories':
        return <QuestionCategoryPanel />;
      case 'overview':
        return <QuestionOverviewPanel />;
      default:
        return <CategoryPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
              {/* <p className="text-lg text-gray-600">Manage your courses, categories, and questions</p> */}
            </div>
            {/* <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-200">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                <Plus className="h-4 w-4" />
                Quick Add
              </button>
            </div> */}
          </div>
        </div>

        {/* Statistics Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            color="text-blue-600"
            loading={statsLoading}
          />
          <StatCard
            title="Total Courses"
            value={stats.totalCourses}
            icon={BookOpen}
            color="text-green-600"
            loading={statsLoading}
          />
          <StatCard
            title="Total Questions"
            value={stats.totalQuestions}
            icon={FileQuestion}
            color="text-sky-600"
            loading={statsLoading}
          />
          <StatCard
            title="Categories"
            value={stats.totalCategories}
            icon={FolderOpen}
            color="text-orange-600"
            loading={statsLoading}
          />
        </div> */}

        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center text-gray-500">
              <Home className="h-4 w-4 mr-2" />
              <span>Dashboard</span>
            </div>
            {breadcrumb.map((item, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="h-4 w-4 text-gray-300" />
                <button
                  onClick={() => handleBreadcrumbClick(item, index)}
                  className={`px-3 py-1 rounded-lg transition-colors duration-200 ${
                    index === breadcrumb.length - 1
                      ? 'text-blue-600 font-medium bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {item.name}
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Main Content Panel */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {renderActivePanel()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
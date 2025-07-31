import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faFilter, faTimes, faTag, faLayerGroup, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { buildGroupedCategoryTree, addQuestionCountToCategoryTree } from '@/shared/utils/categoryUtils.jsx';
import Select from 'react-select';
import Autocomplete from '@mui/material/Autocomplete';
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  MenuItem,
  Button,
  Chip,
  Paper,
  Typography
} from '@mui/material';

const TagFilterStatus = ({ tagFilter, allTags }) => {
  if (!Array.isArray(tagFilter) || tagFilter.length === 0) {
    return null;
  }

  const selectedTagNames = tagFilter.map(tagId => {
    const tag = allTags.find(t => String(t.id) === String(tagId));
    return tag ? tag.name : `Tag ${tagId}`;
  });

  // return (
  //   <Box sx={{ mt: 1, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
  //     <Typography variant="body2" color="info.dark">
  //       <FontAwesomeIcon icon={faFilter} style={{ marginRight: 8 }} />
  //       Filtering by {tagFilter.length} tag{tagFilter.length !== 1 ? 's' : ''}: 
  //       <strong> {selectedTagNames.join(', ')}</strong>
  //     </Typography>
  //   </Box>
  // );
};

const ClearTagFilterButton = ({ tagFilter, setTagFilter }) => {
  if (!Array.isArray(tagFilter) || tagFilter.length === 0) {
    return null;
  }

  const handleClearTags = () => {
    setTagFilter([]);
    localStorage.removeItem('questionTagFilter');
    console.log(' Tag filter cleared');
  };

  // return (
  //   <Button
  //     size="small"
  //     variant="outlined"
  //     color="error"
  //     onClick={handleClearTags}
  //     startIcon={<FontAwesomeIcon icon={faTimes} />}
  //     sx={{ ml: 1 }}
  //   >
  //     Clear Tags ({tagFilter.length})
  //   </Button>
  // );
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

const FiltersRow = ({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  tagFilter,
  setTagFilter,
  allTags = [],
  availableQuestionTypes = [],
  availableCategories = [],
  availableCourses = [],
  loadingQuestionTypes = false,
  loadingQuestionTags = false,
  loadingCategories = false,
  onSearch = null,
  questions = [],
  questioncount,
  allQuestions = null,
  categoryQuestionCount = 0,
  categoryCountMap = {}, 
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState(searchQuery);
  const lastRequestTimeRef = useRef(0);
  const lastCategoryChangeRef = useRef(0);
  const MIN_REQUEST_INTERVAL = 300;

  const debouncedSearchQuery = useDebounce(internalSearchQuery, 300);
  const debouncedTagFilter = useDebounce(tagFilter, 500);

  useEffect(() => {
    setInternalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      setSearchQuery(debouncedSearchQuery);
      if (onSearch) onSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, searchQuery, setSearchQuery, onSearch]);

  const questionStatuses = useMemo(() => ['ready', 'draft'], []);

  const tagOptions = useMemo(() => {
    if (!Array.isArray(allTags) || allTags.length === 0) {
      return [];
    }
    
    return allTags
      .filter(tag => tag && tag.id && tag.name)
      .map(tag => ({
        value: String(tag.id),
        label: tag.name,
        rawname: tag.rawname,
        isstandard: tag.isstandard,
        description: tag.description
      }));
  }, [allTags]);

  const typeOptions = useMemo(() => [
    { value: 'All', label: 'All Question Types' },
    ...availableQuestionTypes
      .filter(type => type && type.name && type.label)
      .map(type => ({
        value: type.name,
        label: type.label,
        iconurl: type.iconurl
      }))
  ], [availableQuestionTypes]);

  const statusOptions = useMemo(() => [
    { value: 'All', label: 'All Statuses' },
    ...questionStatuses.map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    }))
  ], [questionStatuses]);

  const normalizedQuestions = useMemo(() => 
    questions.map(q => ({
      ...q,
      categoryid: q.categoryid || q.category || q.catId || q.categoryId
    })), [questions]
  );

  const categoriesWithCounts = useMemo(() => 
    addQuestionCountToCategoryTree(
      availableCategories, 
      normalizedQuestions,
      categoryCountMap
    ), [availableCategories, normalizedQuestions, categoryCountMap]
  );

  const categoryGroups = useMemo(() => 
    buildGroupedCategoryTree(categoriesWithCounts),
    [categoriesWithCounts]
  );

  // FIXED: Calculate total questions across all categories
  const totalQuestionsAllCategories = useMemo(() => {
    return Object.values(categoryCountMap).reduce((sum, count) => sum + (count || 0), 0);
  }, [categoryCountMap]);

  const hasActiveFilters = useMemo(() =>
    internalSearchQuery.trim() ||
    filters.category !== 'All' ||
    filters.status !== 'All' ||
    filters.type !== 'All' ||
    (Array.isArray(tagFilter) && tagFilter.length > 0) ||
    (filters.courseId && filters.courseId !== null),
    [internalSearchQuery, filters.category, filters.status, filters.type, tagFilter, filters.courseId]
  );

  const handleClearFilters = useCallback(() => {
    console.log('🧹 Clearing all filters including tags');
    
    const clearedFilters = {
      status: 'All',
      type: 'All',
      category: 'All',
      courseId: filters.courseId,
      courseName: filters.courseName
    };
    
    setFilters(clearedFilters);
    setInternalSearchQuery('');
    setSearchQuery('');
    setTagFilter([]);
    
    localStorage.removeItem('questionTagFilter');
    localStorage.removeItem('questionCategoryId');
    localStorage.removeItem('questionCategoryName');
    
  }, [setFilters, setSearchQuery, setTagFilter, filters.courseId, filters.courseName]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setInternalSearchQuery(value);
  }, []);

  const handleCategoryChange = useCallback((e) => {
    const newCategory = e.target.value;
    const now = Date.now();
    
    if (filters.category === newCategory) {
      console.log(' Category unchanged, skipping update');
      return;
    }

    if (now - lastCategoryChangeRef.current < MIN_REQUEST_INTERVAL) {
      console.log(' Category change throttled - too rapid');
      return;
    }
    lastCategoryChangeRef.current = now;

    const selectedCat = availableCategories.find(cat => String(cat.id) === newCategory);
    const selectedName = selectedCat ? selectedCat.name : '';
    const selectedContextId = selectedCat ? selectedCat.contextid : '';

    console.log(' Category changing:', { from: filters.category, to: newCategory, name: selectedName, contextid: selectedContextId });

    setFilters(prev => ({
      ...prev,
      category: newCategory,
      categoryName: selectedName
    }));

    localStorage.setItem('questionCategoryId', newCategory);
    localStorage.setItem('questionCategoryName', selectedName);
    if (selectedContextId) {
      localStorage.setItem('questionCategoryContextId', selectedContextId);
    } else {
      localStorage.removeItem('questionCategoryContextId');
    }
  }, [setFilters, availableCategories, filters.category]);

  const handleStatusChange = useCallback((e) => {
    const newStatus = e.target.value;
    
    if (filters.status === newStatus) {
      console.log(' Status unchanged, skipping update');
      return;
    }
    
    console.log(' Status changing:', { from: filters.status, to: newStatus });
    setFilters(prev => ({ ...prev, status: newStatus }));
  }, [setFilters, filters.status]);

  const handleTypeChange = useCallback((e) => {
    const newType = e.target.value;
    
    if (filters.type === newType) {
      console.log(' Type unchanged, skipping update');
      return;
    }
    
    console.log(' Type changing:', { from: filters.type, to: newType });
    setFilters(prev => ({ ...prev, type: newType }));
  }, [setFilters, filters.type]);

  const handleTagChange = useCallback((_, newValue) => {
    const now = Date.now();
    
    if (now - lastRequestTimeRef.current < MIN_REQUEST_INTERVAL) {
      console.log(' Tag change throttled - too rapid');
      return;
    }
    lastRequestTimeRef.current = now;
    
    console.log(' Tag selection changed:', newValue);
    
    const newTags = newValue ? newValue.map(opt => String(opt.value)) : [];
    
    if (JSON.stringify(newTags.sort()) === JSON.stringify([...tagFilter].sort())) {
      console.log(' Tags unchanged, skipping update');
      return;
    }
    
    console.log(' Setting tag filter to:', newTags);
    
    localStorage.setItem('questionTagFilter', JSON.stringify(newTags));
    setTagFilter(newTags);
    
    if (newTags.length > 0) {
      console.log(` Filtering by ${newTags.length} tag(s): ${newTags.join(', ')}`);
    } else {
      console.log('Tag filter cleared');
    }
  }, [tagFilter, setTagFilter]);

  const selectedTagValues = useMemo(() => {
    return tagOptions.filter(opt => 
      Array.isArray(tagFilter) && tagFilter.includes(opt.value)
    );
  }, [tagOptions, tagFilter]);

  // FIXED: Better category rendering function
  const renderCategoryOptions = useCallback((nodes, level = 0, contextLabel = '') => {
    if (!Array.isArray(nodes)) return [];
    if (level > 3) return [];
    
    return nodes.flatMap(node => {
      if (!node || !node.name || !node.id) return [];
      
      let displayName = node.name;
      let iconPrefix = '';
      
      // Smart display name generation
      if (node.name.trim().toLowerCase() === 'top') {
        // For "top" categories, show "Top for [Context Name]"
        if (contextLabel && contextLabel !== `Context ${node.contextid}`) {
          displayName = `Top for ${contextLabel}`;
        } else {
          displayName = `Top for Context ${node.contextid}`;
        }
        // iconPrefix = ' ';
      } else if (node.name.toLowerCase().startsWith('default for ')) {
        // For "Default for X" categories, KEEP the "Default for" prefix
        displayName = node.name; // Keep the original name with "Default for"
        // iconPrefix = ' ';
      } else if (level > 0) {
        // iconPrefix = ' ';
      }
      
      // Get question count with fallback
      const questionCount = categoryCountMap?.[node.id] || 
                           node.totalQuestionCount || 
                           node.questioncount || 0;
      
      const menuItems = [
        <MenuItem 
          key={`category-${node.id}-${level}`} 
          value={String(node.id)} 
          sx={{ 
            pl: 2 + level * 2,
            '&:hover': {
              backgroundColor: '#e3f2fd'
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            width: '100%', 
            alignItems: 'center' 
          }}>
            <Box sx={{ 
              color: level === 0 ? '#1976d2' : 'inherit',
              fontWeight: level === 0 ? 500 : 'normal',
              fontSize: level === 0 ? '0.9rem' : '0.875rem'
            }}>
              {iconPrefix}{displayName}
            </Box>
            <Box sx={{ 
              color: questionCount > 0 ? '#2e7d32' : '#999', 
              fontSize: '0.8rem',
              fontWeight: questionCount > 0 ? 600 : 'normal',
              minWidth: '2rem',
              textAlign: 'right'
            }}>
              ({questionCount})
            </Box>
          </Box>
        </MenuItem>
      ];
      
      // Add children recursively
      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        const childItems = renderCategoryOptions(node.children, level + 1, contextLabel);
        menuItems.push(...childItems);
      }
      
      return menuItems;
    });
  }, [categoryCountMap]);

  // Calculate group totals properly
  const calculateGroupTotal = useCallback((tree) => {
    return tree.reduce((sum, node) => {
      const nodeCount = categoryCountMap?.[node.id] || node.totalQuestionCount || node.questioncount || 0;
      const childrenCount = node.children ? calculateGroupTotal(node.children) : 0;
      return sum + nodeCount + childrenCount;
    }, 0);
  }, [categoryCountMap]);

  const selectedCategoryObj = useMemo(() => 
    availableCategories.find(cat => String(cat.id) === String(filters.category)),
    [availableCategories, filters.category]
  );

  const selectedCategoryName = selectedCategoryObj ? selectedCategoryObj.name : 'All';

  const totalCount = useMemo(() => 
    categoryCountMap?.[filters.category] || 
    selectedCategoryObj?.totalQuestionCount || 
    selectedCategoryObj?.questioncount || 0,
    [categoryCountMap, filters.category, selectedCategoryObj]
  );

  const filteredCount = useMemo(() => 
    questions.filter(q => 
      String(q.categoryid || q.categoryId || q.category) === String(filters.category)
    ).length,
    [questions, filters.category]
  );

  const validCategory = useMemo(() => {
    if (filters.category === 'All') return 'All';
    const allCategoryIds = availableCategories
      .filter(cat => cat && cat.id)
      .map(cat => String(cat.id));
    return allCategoryIds.includes(String(filters.category)) ? filters.category : 'All';
  }, [filters.category, availableCategories]);

  const validStatus = useMemo(() => {
    if (filters.status === 'All') return 'All';
    return statusOptions.some(opt => opt.value === filters.status) ? filters.status : 'All';
  }, [filters.status, statusOptions]);

  const validType = useMemo(() => {
    if (filters.type === 'All') return 'All';
    return typeOptions.some(opt => opt.value === filters.type) ? filters.type : 'All';
  }, [filters.type, typeOptions]);

  // Debug effect
  useEffect(() => {
    console.log(' FiltersRow Debug:', {
      totalQuestionsAllCategories,
      categoryGroups: categoryGroups.map(g => ({
        label: g.label,
        contextid: g.contextid,
        treeLength: g.tree.length,
        groupTotal: calculateGroupTotal(g.tree)
      })),
      categoryCountMap,
      selectedCategory: filters.category,
      selectedCategoryCount: categoryCountMap?.[filters.category]
    });
  }, [categoryGroups, categoryCountMap, filters.category, totalQuestionsAllCategories, calculateGroupTotal]);

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2, boxShadow: 0.4 }}>
      <Grid container spacing={2} alignItems="flex-end">
        {/* Search */}
        <Grid item sx={{ width: 300 }}>
          <TextField
            id="search-questions"
            fullWidth
            sx={{ minWidth: 300 }} 
            label="Search Questions"
            variant="outlined"
            size="small"
            value={internalSearchQuery}
            onChange={handleSearchChange}
            placeholder={
              filters.courseId && filters.courseName
                ? `Search in "${filters.courseName}"...`
                : "Search questions..."
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FontAwesomeIcon icon={faSearch} style={{ color: '#9ca3af' }} />
                </InputAdornment>
              ),
              endAdornment: internalSearchQuery && (
                <InputAdornment position="end">
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      setInternalSearchQuery('');
                      setSearchQuery('');
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        {/* Category - COMPLETELY FIXED */}
       <Grid item sx={{ width: 300 }}>
          <TextField
            id="category-select"
            select
            fullWidth
            label="Category"
            value={validCategory}
            onChange={handleCategoryChange}
            size="small"
            disabled={loadingCategories}
            SelectProps={{
              renderValue: (selected) => {
                if (selected === 'All') {
                  return `All Categories (${totalQuestionsAllCategories})`;
                }
                
                const selectedCategory = availableCategories.find(cat => String(cat.id) === String(selected));
                const count = categoryCountMap?.[selected] || selectedCategory?.totalQuestionCount || selectedCategory?.questioncount || 0;
                
                if (selectedCategory) {
                  return `${selectedCategory.name} (${count})`;
                }
                
                return filters.categoryName ? `${filters.categoryName} (${count})` : `Category ${selected} (${count})`;
              }
            }}
          >
            {/* All Categories Option */}
            <MenuItem value="All">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <Box sx={{ fontWeight: 500 }}>All Categories</Box>
                <Box sx={{ color: '#2e7d32', fontSize: '0.875rem', fontWeight: 600 }}>
                  ({totalQuestionsAllCategories})
                </Box>
              </Box>
            </MenuItem>

            {/* Category Groups */}
            {categoryGroups.map(group => {
              const groupTotal = calculateGroupTotal(group.tree);
              
              // FIXED: Keep group label as is, don't remove "Default for"
              let groupLabel = group.label;

              return [
                // Group Header
                <MenuItem
                  key={`group-header-${group.contextid}`}
                  disabled
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#3b82f6',
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    '&.Mui-disabled': {
                      opacity: 1
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Box> {groupLabel}</Box>
                    <Box sx={{ color: '#666', fontSize: '0.875rem', fontWeight: 'normal' }}>
                      ({groupTotal} total)
                    </Box>
                  </Box>
                </MenuItem>,

                // Group Categories
                ...renderCategoryOptions(group.tree, 0, groupLabel)
              ];
            })}
          </TextField>
        </Grid>

        
        {/* Type */}
       <Grid item sx={{ width: 300 }}>
          <TextField
            id="type-select"
            select
            fullWidth
            label="Type"
            value={validType}
            onChange={handleTypeChange}
            size="small"
            disabled={loadingQuestionTypes}
            SelectProps={{
              renderValue: (selected) => {
                const selectedType = typeOptions.find(opt => opt.value === selected);
                return (
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {selectedType?.iconurl && (
                      <img
                        src={selectedType.iconurl}
                        alt={selectedType.label}
                        style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }}
                      />
                    )}
                    {selectedType ? selectedType.label : selected}
                  </span>
                );
              }
            }}
          >
            {typeOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {opt.iconurl && (
                    <img
                      src={opt.iconurl}
                      alt={opt.label}
                      style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }}
                    />
                  )}
                  {opt.label}
                </span>
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Tags */}
        <Grid item sx={{ width: 200 }}>
          <Autocomplete
            id="tags-autocomplete"
            multiple
            options={tagOptions}
            getOptionLabel={(option) => option.label}
            value={selectedTagValues}
            onChange={handleTagChange}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.label}
                  {...getTagProps({ index })}
                  key={option.value}
                  color="primary"
                  variant="outlined"
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Tags"
                placeholder="Select tags"
                size="small"
              />
            )}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            disableCloseOnSelect
            fullWidth
            sx={{
              '& .MuiAutocomplete-inputRoot': {
                minHeight: 40,
                maxHeight: 40,
                minWidth: 200,
                maxWidth: 200,
                overflowX: 'auto',
                flexWrap: 'nowrap',
                alignItems: 'center'
              },
              '& .MuiChip-root': {
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }
            }}
          />
        </Grid>
        {/* Status */}
       <Grid item sx={{ width: 150 }}>
          <TextField
            id="status-select"
            select
            fullWidth
            label="Status"
            value={validStatus}
            onChange={handleStatusChange}
            size="small"
          >
            {statusOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
        </Grid>


        {/* Clear Button */}
        <Grid item xs={10}>
          {hasActiveFilters && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              sx={{ borderRadius: 2, textTransform: 'none', minWidth: 10 }}
              startIcon={<FontAwesomeIcon icon={faTimes} />}
              onClick={handleClearFilters}
              fullWidth
            >
              Clear
            </Button>
          )}
        </Grid>
      </Grid>

      {/* Tag filter status and clear button */}
      <Box>     
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TagFilterStatus tagFilter={tagFilter} allTags={allTags} />
          <ClearTagFilterButton tagFilter={tagFilter} setTagFilter={setTagFilter} />
        </Box>
      </Box>

      {/* FIXED: Display selected category question count */}
      {filters.category !== 'All' && (
        <Box sx={{ mt: 1, mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {(() => {
              const categoryCount = categoryCountMap?.[filters.category] || 0;
              const selectedCategory = availableCategories.find(cat => String(cat.id) === String(filters.category));
              const categoryName = selectedCategory?.name || filters.categoryName || 'Selected Category';
              
              // return (
              //   <>
              //     {/* Showing <strong>{filteredCount}</strong> of <strong>{categoryCount}</strong> total questions in <strong>{categoryName}</strong>
              //     {filteredCount !== categoryCount && categoryCount > 0 && (
              //       <Box component="span" sx={{ color: '#f57c00', ml: 1 }}>
              //         (filtered from {categoryCount} total)
              //       </Box>
              //     )} */}
              //   </>
              // );
            })()}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default React.memo(FiltersRow);
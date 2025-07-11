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

  return (
    <Box sx={{ mt: 1, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
      <Typography variant="body2" color="info.dark">
        <FontAwesomeIcon icon={faFilter} style={{ marginRight: 8 }} />
        Filtering by {tagFilter.length} tag{tagFilter.length !== 1 ? 's' : ''}: 
        <strong> {selectedTagNames.join(', ')}</strong>
      </Typography>
    </Box>
  );
};

// Clear tag filter button
const ClearTagFilterButton = ({ tagFilter, setTagFilter }) => {
  if (!Array.isArray(tagFilter) || tagFilter.length === 0) {
    return null;
  }

  const handleClearTags = () => {
    setTagFilter([]);
    localStorage.removeItem('questionTagFilter');
    console.log('🗑️ Tag filter cleared');
  };

  return (
    <Button
      size="small"
      variant="outlined"
      color="error"
      onClick={handleClearTags}
      startIcon={<FontAwesomeIcon icon={faTimes} />}
      sx={{ ml: 1 }}
    >
      Clear Tags ({tagFilter.length})
    </Button>
  );
};

//  FIXED: Debounce hook with proper cleanup
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

  //  FIXED: Refs for throttling and debouncing
  const lastRequestTimeRef = useRef(0);
  const lastCategoryChangeRef = useRef(0);
  const MIN_REQUEST_INTERVAL = 300; // Minimum 300ms between requests

  // FIXED: Proper debounce functions
  const debouncedSearchQuery = useDebounce(internalSearchQuery, 300);
  const debouncedTagFilter = useDebounce(tagFilter, 500);

  //  FIXED: Sync internal search with external prop
  useEffect(() => {
    setInternalSearchQuery(searchQuery);
  }, [searchQuery]);

  //  FIXED: Apply debounced search changes
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
      .filter(tag => tag && tag.id && tag.name) // Only valid tags
      .map(tag => ({
        value: String(tag.id), // Ensure string value for react-select
        label: tag.name,
        rawname: tag.rawname,
        isstandard: tag.isstandard,
        description: tag.description
      }));
  }, [allTags]);

  // Category options for Chips
  const categoryOptions = useMemo(() => [
    { value: 'All', label: 'All Categories' },
    ...availableCategories
      .filter(cat => cat && cat.id && cat.name) // Added null checks
      .map(cat => ({
        value: String(cat.id),
        label: cat.name
      }))
  ], [availableCategories]);

  // Type options for select
  const typeOptions = useMemo(() => [
    { value: 'All', label: 'All Question Types' },
    ...availableQuestionTypes
      .filter(type => type && type.name && type.label)
      .map(type => ({
        value: type.name, // Use 'name' as the value
        label: type.label,
        iconurl: type.iconurl
      }))
  ], [availableQuestionTypes]);

  // Status options for select
  const statusOptions = useMemo(() => [
    { value: 'All', label: 'All Statuses' },
    ...questionStatuses.map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    }))
  ], [questionStatuses]);

  //  FIXED: Stable category processing
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

  // Check if any filter is active
  const hasActiveFilters = useMemo(() =>
    internalSearchQuery.trim() ||
    filters.category !== 'All' ||
    filters.status !== 'All' ||
    filters.type !== 'All' ||
    (Array.isArray(tagFilter) && tagFilter.length > 0) ||
    (filters.courseId && filters.courseId !== null),
    [internalSearchQuery, filters.category, filters.status, filters.type, tagFilter, filters.courseId]
  );

  //  FIXED: Clear all filters with proper cleanup
  const handleClearFilters = useCallback(() => {
    console.log('🧹 Clearing all filters including tags');
    
    // Clear everything at once to prevent multiple updates
    const clearedFilters = {
      status: 'All',
      type: 'All',
      category: 'All',
      courseId: filters.courseId, // Keep course selection
      courseName: filters.courseName
      //  REMOVED: _resetTimestamp (was causing issues)
    };
    
    setFilters(clearedFilters);
    setInternalSearchQuery('');
    setSearchQuery('');
    setTagFilter([]);
    
    // Clear localStorage
    localStorage.removeItem('questionTagFilter');
    localStorage.removeItem('questionCategoryId');
    localStorage.removeItem('questionCategoryName');
    
  }, [setFilters, setSearchQuery, setTagFilter, filters.courseId, filters.courseName]);

  //  FIXED: Search input change with proper debouncing
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setInternalSearchQuery(value);
    // The debounced effect will handle setting the actual search query
  }, []);

  //  FIXED: Category change with throttling and duplicate prevention
  const handleCategoryChange = useCallback((e) => {
    const newCategory = e.target.value;
    const now = Date.now();
    
    //  Prevent unnecessary updates
    if (filters.category === newCategory) {
      console.log(' Category unchanged, skipping update');
      return;
    }

    //  Throttle rapid category changes
    if (now - lastCategoryChangeRef.current < MIN_REQUEST_INTERVAL) {
      console.log(' Category change throttled - too rapid');
      return;
    }
    lastCategoryChangeRef.current = now;

    const selectedCat = availableCategories.find(cat => String(cat.id) === newCategory);
    const selectedName = selectedCat ? selectedCat.name : '';

    console.log(' Category changing:', { from: filters.category, to: newCategory });

    setFilters(prev => ({
      ...prev,
      category: newCategory,
      categoryName: selectedName
      //  REMOVED: _filterChangeTimestamp (causes infinite updates)
    }));

    localStorage.setItem('questionCategoryId', newCategory);
    localStorage.setItem('questionCategoryName', selectedName);
  }, [setFilters, availableCategories, filters.category]);

  //  FIXED: Status change with stability
  const handleStatusChange = useCallback((e) => {
    const newStatus = e.target.value;
    
    // Prevent unnecessary updates
    if (filters.status === newStatus) {
      console.log(' Status unchanged, skipping update');
      return;
    }
    
    console.log(' Status changing:', { from: filters.status, to: newStatus });
    setFilters(prev => ({ ...prev, status: newStatus }));
  }, [setFilters, filters.status]);

  //  FIXED: Type change with stability
  const handleTypeChange = useCallback((e) => {
    const newType = e.target.value;
    
    // Prevent unnecessary updates
    if (filters.type === newType) {
      console.log(' Type unchanged, skipping update');
      return;
    }
    
    console.log(' Type changing:', { from: filters.type, to: newType });
    setFilters(prev => ({ ...prev, type: newType }));
  }, [setFilters, filters.type]);

  //  FIXED: Tag change with proper throttling and debouncing
  const handleTagChange = useCallback((_, newValue) => {
    const now = Date.now();
    
    //  Throttle rapid requests
    if (now - lastRequestTimeRef.current < MIN_REQUEST_INTERVAL) {
      console.log(' Tag change throttled - too rapid');
      return;
    }
    lastRequestTimeRef.current = now;
    
    console.log(' Tag selection changed:', newValue);
    
    const newTags = newValue ? newValue.map(opt => String(opt.value)) : [];
    
    //  Prevent unnecessary updates
    if (JSON.stringify(newTags.sort()) === JSON.stringify([...tagFilter].sort())) {
      console.log(' Tags unchanged, skipping update');
      return;
    }
    
    console.log(' Setting tag filter to:', newTags);
    
    // Save to localStorage
    localStorage.setItem('questionTagFilter', JSON.stringify(newTags));
    
    // Apply the filter immediately (no debouncing for direct user interaction)
    setTagFilter(newTags);
    
    // Log for debugging
    if (newTags.length > 0) {
      console.log(` Filtering by ${newTags.length} tag(s): ${newTags.join(', ')}`);
    } else {
      console.log(' Tag filter cleared');
    }
  }, [tagFilter, setTagFilter]);

  //  FIXED: Selected tag values calculation
  const selectedTagValues = useMemo(() => {
    return tagOptions.filter(opt => 
      Array.isArray(tagFilter) && tagFilter.includes(opt.value)
    );
  }, [tagOptions, tagFilter]);

  // Category display calculations
  const selectedCategoryObj = useMemo(() => 
    availableCategories.find(cat => String(cat.id) === String(filters.category)),
    [availableCategories, filters.category]
  );

  const selectedCategoryName = selectedCategoryObj ? selectedCategoryObj.name : 'All';

  // Get the total count from categoryCountMap if available, fall back to other sources
  const totalCount = useMemo(() => 
    categoryCountMap?.[filters.category] || 
    selectedCategoryObj?.totalQuestionCount || 
    selectedCategoryObj?.questioncount || 0,
    [categoryCountMap, filters.category, selectedCategoryObj]
  );

  // Current filtered count
  const filteredCount = useMemo(() => 
    questions.filter(q => 
      String(q.categoryid || q.categoryId || q.category) === String(filters.category)
    ).length,
    [questions, filters.category]
  );

  //  FIXED: Stable render options function
  const renderOptions = useCallback((nodes, level = 0, parentName = '', contextLabel = '') => {
    if (!Array.isArray(nodes)) return [];
    if (level > 1) return []; // Only show up to 2 levels deep
    
    return nodes.flatMap(node => {
      if (!node || !node.name || !node.id) return [];
      
      let displayName = node.name;
      if (level === 0 && node.name.trim().toLowerCase() === 'top') {
        displayName = `Top for ${contextLabel}`;
      }
      
      const questionCount = categoryCountMap?.[node.id] || node.totalQuestionCount || node.questioncount || 0;
      
      return [
        <MenuItem key={`${node.id}-${level}`} value={String(node.id)} sx={{ pl: 2 + level * 2 }}>
          {displayName}
          <span style={{ color: '#888', marginLeft: 8, fontSize: 13 }}>
            ({questionCount})
          </span>
        </MenuItem>,
        ...(node.children && Array.isArray(node.children)
          ? renderOptions(node.children, level + 1, node.name, contextLabel)
          : [])
      ];
    });
  }, [categoryCountMap]);

  // Ensure select values are always valid
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

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2, boxShadow: 0.4 }}>
      {/* Grid container - Compatible with current MUI version */}
      <Grid container spacing={2} alignItems="flex-end">
        {/* Search */}
        <Grid item xs={12}>
          <TextField
            id="search-questions"
            fullWidth
            sx={{ minWidth: 350 }} 
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

        {/* Category */}
        <Grid item xs={12}>
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
              renderValue: () => {
                // Only show the category name, not the count
                if (filters.category === 'All') {
                  return 'All Categories';
                }
                const selectedCategory = availableCategories.find(cat => String(cat.id) === String(filters.category));
                return selectedCategory ? selectedCategory.name : filters.categoryName || 'Unknown';
              }
            }}
          >
            <MenuItem value="All">
              All Categories
            </MenuItem>
            {categoryGroups.map(group => [
              <MenuItem
                key={`group-${group.contextid}`}
                disabled
                sx={{ fontWeight: 'bold', color: '#3b82f6' }}
              >
                {group.label} <span style={{ color: '#888', marginLeft: 8, fontSize: 13 }}>
                  ({
                    // Sum all category counts in this group
                    group.tree.reduce((sum, cat) => {
                      // Use the most reliable count source
                      const count = categoryCountMap?.[cat.id] || cat.totalQuestionCount || cat.questioncount || 0;
                      return sum + count;
                    }, 0)
                  })
                </span>
              </MenuItem>,
              ...renderOptions(group.tree, 0, '', group.label)
            ])}
          </TextField>
        </Grid>

        {/* Status */}
        <Grid item xs={12}>
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

        {/* Type */}
        <Grid item xs={12}>
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
        <Grid item xs={12}>
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
                minWidth: 100,
                maxWidth: 300,
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

        {/* Clear Button */}
        <Grid item xs={12}>
          {hasActiveFilters && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<FontAwesomeIcon icon={faTimes} />}
              onClick={handleClearFilters}
              fullWidth
            >
              Clear All
            </Button>
          )}
        </Grid>
      </Grid>

      {/* Tag filter status and clear button below row */}
      <Box>     
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TagFilterStatus tagFilter={tagFilter} allTags={allTags} />
          <ClearTagFilterButton tagFilter={tagFilter} setTagFilter={setTagFilter} />
        </Box>
      </Box>

      {/* Display selected category question count */}
      {filters.category !== 'All' && (
        <Box sx={{ mt: 1, mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> total questions in <strong>{selectedCategoryName}</strong>
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default React.memo(FiltersRow);
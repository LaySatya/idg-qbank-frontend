import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faFilter, faTimes, faTag, faLayerGroup, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { buildGroupedCategoryTree, addQuestionCountToCategoryTree } from '@/shared/utils/categoryUtils.jsx';
import Select from 'react-select';

// Then use:
// await questionAPI.getTagsForMultipleQuestions(questionIds);
// MUI - Compatible with your current version
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


// Debounce hook
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => { callback(...args); }, delay);
  }, [callback, delay]);
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
  allQuestions = null, // <-- Add this prop for all questions (optional)
  categoryQuestionCount = 0 
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState(searchQuery);

  const debouncedSetSearchQuery = useDebounce((value) => {
    setSearchQuery(value);
    if (onSearch) onSearch(value);
  }, 300);

  const debouncedSetTagFilter = useDebounce((values) => {
    setTagFilter(values);
  }, 300);

  const questionStatuses = useMemo(() => ['ready', 'draft'], []);


const tagOptions = useMemo(() => {
  if (!Array.isArray(allTags) || allTags.length === 0) {
    console.log('No tags available for filtering');
    return [];
  }
  
  console.log(`Processing ${allTags.length} tags for options`);
  
  const options = allTags
    .filter(tag => tag && tag.id && tag.name)
    .map(tag => ({
      value: String(tag.id), // Ensure string value for react-select
      label: tag.name,
      rawname: tag.rawname,
      isstandard: tag.isstandard,
      description: tag.description,
      originalTag: tag
    }));
    
  console.log(`Created ${options.length} tag options`);
  console.log('Sample tag options:', options.slice(0, 3));
  
  return options;
}, [allTags]);
const debugTagData = useCallback(() => {
  console.log(' === TAG DEBUGGING SESSION ===');
  
  // Analyze questions and their tags
  console.log(` Analyzing ${questions.length} questions:`);
  
  const tagAnalysis = {};
  const questionTagSamples = [];
  
  questions.slice(0, 10).forEach((q, index) => {
    if (q.tags && Array.isArray(q.tags) && q.tags.length > 0) {
      const analysis = {
        questionId: q.id,
        questionTitle: q.title?.substring(0, 30) + '...',
        tags: q.tags,
        tagTypes: q.tags.map(tag => typeof tag),
        extractedIds: q.tags.map(tag => questionFilterService.extractTagId(tag))
      };
      questionTagSamples.push(analysis);
      
      // Count tag ID types
      q.tags.forEach(tag => {
        const extractedId = questionFilterService.extractTagId(tag);
        const idType = typeof extractedId;
        tagAnalysis[idType] = (tagAnalysis[idType] || 0) + 1;
      });
    }
  });
  
  console.log(' Tag ID type distribution:', tagAnalysis);
  console.log(' Sample question tags:', questionTagSamples);
  
  // Analyze available tags
  console.log(` Available tags (${allTags.length} total):`);
  console.log('Sample allTags:', allTags.slice(0, 5));
  
  // Analyze current filter
  console.log(` Current tag filter:`, tagFilter);
  console.log(` Filter types:`, tagFilter.map(tag => `${tag} (${typeof tag})`));
  
  console.log(' === END TAG DEBUGGING ===');
}, [questions, allTags, tagFilter]);

//  Add this button temporarily for debugging
const DebugButton = () => (
  <button
    onClick={debugTagData}
    style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 9999,
      background: '#f59e0b',
      color: 'white',
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}
  >
     Debug Tags
  </button>
);

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
      .filter(type => type && type.value && type.label) // Added null checks
      .map(type => ({
        value: type.value,
        label: type.label
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

  // Grouped category tree for dropdown
  const categoryGroups = useMemo(() => buildGroupedCategoryTree(availableCategories), [availableCategories]);

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

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    console.log(' Clearing all filters including tags');
    setFilters({
      status: 'All',
      type: 'All',
      category: 'All',
        courseId: filters.courseId, // Keep course selection
      courseName: filters.courseName,
      _resetTimestamp: Date.now()
   });
    setSearchQuery('');
    setTagFilter([]); // Clear tag filter
  }, [setFilters, setSearchQuery, setTagFilter, filters.courseId, filters.courseName]);

  // Search input change
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setInternalSearchQuery(value);
    debouncedSetSearchQuery(value);
  }, [debouncedSetSearchQuery]);

  // Category change
  const handleCategoryChange = useCallback((e) => {
  const newCategory = e.target.value;

  const selectedCat = availableCategories.find(cat => String(cat.id) === newCategory);
  const selectedName = selectedCat ? selectedCat.name : '';

  setFilters(prev => ({
    ...prev,
    category: newCategory,
    categoryName: selectedName,
    _filterChangeTimestamp: Date.now()
  }));

  localStorage.setItem('questionCategoryId', newCategory);
  localStorage.setItem('questionCategoryName', selectedName);
}, [setFilters, availableCategories]);

  // Status change
  const handleStatusChange = useCallback((e) => {
    const newStatus = e.target.value;
    setFilters(prev => ({ ...prev, status: newStatus }));
  }, [setFilters]);

  // Type change
  const handleTypeChange = useCallback((e) => {
    const newType = e.target.value;
    setFilters(prev => ({ ...prev, type: newType }));
  }, [setFilters]);

  // Tag change
const handleTagChange = useCallback((selectedOptions) => {
  console.log(' Tag selection changed:', selectedOptions);
  
  // Debug: Check what the user actually selected
  if (selectedOptions && selectedOptions.length > 0) {
    selectedOptions.forEach(option => {
      console.log(' Selected tag:', {
        value: option.value,
        label: option.label, 
        originalTag: option.originalTag
      });
    });
  }
  
  const newTags = selectedOptions ? selectedOptions.map(opt => String(opt.value)) : [];
  
  console.log(' Setting tag filter to:', newTags);
  
  // Debug: Show a sample of all available tags
  console.log('Available tags sample:', allTags.slice(0, 10).map(tag => ({
    id: tag.id,
    name: tag.name
  })));
  
  setTagFilter(newTags);
  localStorage.setItem('questionTagFilter', JSON.stringify(newTags));
}, [setTagFilter, allTags]);

  // Get selected category name for chip display
  const selectedCategoryObj = availableCategories.find(
    cat => String(cat.id) === String(filters.category)
  );
  const selectedCategoryName = selectedCategoryObj ? selectedCategoryObj.name : 'All';

  // Remove question count from renderOptions
  const renderOptions = (nodes, level = 0, parentName = '', contextLabel = '') => {
    if (!Array.isArray(nodes)) return [];
    return nodes.flatMap(node => {
      if (!node || !node.name || !node.id) return [];
      let displayName = node.name;
      if (level === 0 && node.name.trim().toLowerCase() === 'top') {
        displayName = `Top for ${contextLabel}`;
      }
      // Only show the name, not the count
      return [
        <MenuItem key={`${node.id}-${level}`} value={String(node.id)} sx={{ pl: 2 + level * 2 }}>
          {displayName}
        </MenuItem>,
        ...(node.children && Array.isArray(node.children) 
          ? renderOptions(node.children, level + 1, node.name, contextLabel) 
          : [])
      ];
    });
  };

  // Ensure select values are always valid
  const validCategory = useMemo(() => {
    if (filters.category === 'All') return 'All';
    const allCategoryIds = availableCategories
      .filter(cat => cat && cat.id)
      .map(cat => cat.id);
    return allCategoryIds.includes(filters.category) ? filters.category : 'All';
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
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      {/* Grid container - Compatible with current MUI version */}
      <Grid container spacing={2} alignItems="flex-end">
        {/* Search */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
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
                  <IconButton size="small" onClick={() => { setInternalSearchQuery(''); debouncedSetSearchQuery(''); }}>
                    <FontAwesomeIcon icon={faTimes} />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        {/* Category */}
        <Grid item xs={12} md={2}>
<TextField
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
    <MenuItem key={`group-${group.contextid}`} disabled sx={{ fontWeight: 'bold', color: '#3b82f6' }}>
      {group.label}
    </MenuItem>,
    ...renderOptions(group.tree, 0, '', group.label)
  ])}
</TextField>

        </Grid>

        {/* Status */}
        <Grid item xs={12} md={2}>
          <TextField
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
        <Grid item xs={12} md={2}>
          <TextField
            select
            fullWidth
            label="Question Type"
            value={validType}
            onChange={handleTypeChange}
            size="small"
            disabled={loadingQuestionTypes}
          >
            {typeOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Clear Button */}
        <Grid item xs={12} md={2}>
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

      {/* Tags Filter */}
   <Box mt={3}>
        <Typography variant="subtitle2" gutterBottom>
          Filter by Tags {tagOptions.length > 0 && `(${tagOptions.length} available)`}
        </Typography>
        
        {tagOptions.length > 0 ? (
          <Select
            isMulti
            value={tagOptions.filter(opt => 
              Array.isArray(tagFilter) && tagFilter.includes(opt.value)
            )}
            onChange={handleTagChange}
            options={tagOptions}
            placeholder="Select tags to filter questions..."
            isSearchable
            isClearable
            classNamePrefix="react-select"
            noOptionsMessage={() => "No tags match your search"}
            styles={{
              control: (base) => ({
                ...base,
                minHeight: 40,
                fontSize: 14
              }),
              multiValue: (base) => ({
                ...base,
                backgroundColor: '#e3f2fd',
                borderRadius: 4
              }),
              multiValueLabel: (base) => ({
                ...base,
                color: '#1976d2',
                fontSize: 12
              })
            }}
          />
        ) : (
          <Box 
            sx={{ 
              p: 2, 
              border: '1px dashed #ccc', 
              borderRadius: 1, 
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            <Typography variant="body2">
              No tags available for filtering
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Tags will appear here once questions are loaded
            </Typography>
          </Box>
        )}
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary">
              Debug: Category "{filters.category}" has {categoryQuestionCount} questions
              | Total questions loaded: {questions.length}
              | All questions: {allQuestions?.length || 'not provided'}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default React.memo(FiltersRow);
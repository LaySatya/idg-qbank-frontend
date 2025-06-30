import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faFilter, faTimes, faTag, faLayerGroup, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { buildGroupedCategoryTree } from '@/shared/utils/categoryUtils.jsx';
import Select from 'react-select';

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

  // Tag options for react-select
  const tagOptions = useMemo(() => {
    if (!Array.isArray(allTags)) return [];
    return allTags
      .filter(tag => tag && tag !== 'All') // Added null check
      .map(tag => ({
        value: tag,
        label: tag.charAt(0).toUpperCase() + tag.slice(1)
      }));
  }, [allTags]);

  // Category options for Chips
  const categoryOptions = useMemo(() => [
    { value: 'All', label: 'All Categories' },
    ...availableCategories
      .filter(cat => cat && cat.id && cat.name) // Added null checks
      .map(cat => ({
        value: cat.id,
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
    setFilters({
      status: 'All',
      type: 'All',
      category: 'All',
      courseId: null,
      courseName: null,
      _resetTimestamp: Date.now()
    });
    setInternalSearchQuery('');
    debouncedSetSearchQuery('');
    debouncedSetTagFilter([]);
  }, [setFilters, debouncedSetSearchQuery, debouncedSetTagFilter]);

  // Search input change
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setInternalSearchQuery(value);
    debouncedSetSearchQuery(value);
  }, [debouncedSetSearchQuery]);

  // Category change
  const handleCategoryChange = useCallback((e) => {
    const newCategory = e.target.value;
    setFilters(prev => ({
      ...prev,
      category: newCategory,
      _filterChangeTimestamp: Date.now()
    }));
    localStorage.setItem('questionCategoryId', newCategory);
  }, [setFilters]);

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
    const newTags = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    debouncedSetTagFilter(newTags);
  }, [debouncedSetTagFilter]);

  // Keep internal search in sync with prop
  useEffect(() => {
    if (searchQuery !== internalSearchQuery) {
      setInternalSearchQuery(searchQuery);
    }
  }, [searchQuery]);

  // Render category tree options with safety checks
  const renderOptions = (nodes, level = 0, parentName = '', contextLabel = '') => {
    if (!Array.isArray(nodes)) return [];
    
    return nodes.flatMap(node => {
      if (!node || !node.name || !node.id) return [];
      
      let displayName = node.name;
      if (level === 0 && node.name.trim().toLowerCase() === 'top') {
        displayName = `Top for ${contextLabel}`;
      }
      
      return [
        <MenuItem key={`${node.id}-${level}`} value={node.id} sx={{ pl: 2 + level * 2 }}>
          {`${'— '.repeat(level)}${displayName}`}
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

  // Safe category tree building
  const categoryGroups = useMemo(() => {
    try {
      if (!Array.isArray(availableCategories) || !Array.isArray(availableCourses)) {
        return [];
      }
      return buildGroupedCategoryTree(availableCategories, availableCourses);
    } catch (error) {
      console.warn('Error building category tree:', error);
      return [];
    }
  }, [availableCategories, availableCourses]);

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
          >
            <MenuItem value="All">All Categories</MenuItem>
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
          Filter by Tags
        </Typography>
        <Select
          isMulti
          value={tagOptions.filter(opt => Array.isArray(tagFilter) && tagFilter.includes(opt.value))}
          onChange={handleTagChange}
          options={tagOptions}
          placeholder="Select tags to filter..."
          isSearchable
          isClearable
          classNamePrefix="react-select"
          noOptionsMessage={() => "No tags available"}
          isLoading={loadingQuestionTags}
        />
      </Box>
    </Paper>
  );
};

export default React.memo(FiltersRow);
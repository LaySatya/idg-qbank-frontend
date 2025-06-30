import React, { useState } from 'react';
import {
  Paper, Box, Typography, Button, Chip, TextField, Divider, CircularProgress, IconButton, MenuItem, Select, InputLabel, FormControl, Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LabelIcon from '@mui/icons-material/Label';

export const TagManager = ({
  availableTags = [],
  existingTags = [],
  selectedAddTags = [],
  selectedRemoveTags = [],
  onTagOperation,
  onAddCustomTag,
  loading = false,
  error = null,
  onRefresh,
  showSmartRemoval = false,
  customTagPlaceholder = "Enter new tag name"
}) => {
  const [customTag, setCustomTag] = useState('');

  const normalizeTagData = (tags) => {
    if (!Array.isArray(tags)) return [];
    return tags.map(tag =>
      typeof tag === 'string'
        ? tag
        : tag?.rawname || tag?.name || tag?.tag || String(tag)
    ).filter(Boolean);
  };

  const normalizedAvailableTags = normalizeTagData(availableTags);

  const handleAddCustomTag = () => {
    if (customTag.trim()) {
      const success = onAddCustomTag(customTag.trim());
      if (success) setCustomTag('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleAddCustomTag();
  };

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center">
          <LabelIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="subtitle1">Tag Management</Typography>
          {loading && (
            <Box ml={2} display="flex" alignItems="center" color="primary.main">
              <CircularProgress size={14} sx={{ mr: 1 }} />
              <Typography variant="caption">Loading...</Typography>
            </Box>
          )}
          {error && (
            <Box ml={2} display="flex" alignItems="center" color="error.main">
              <ErrorOutlineIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="caption">Error</Typography>
            </Box>
          )}
        </Box>
        {onRefresh && (
          <Tooltip title="Refresh tags from API">
            <span>
              <IconButton onClick={onRefresh} disabled={loading} size="small" color="primary">
                <RefreshIcon className={loading ? 'animate-spin' : ''} fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      {/* Custom Tag Input */}
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <TextField
          size="small"
          label="Add Custom Tag"
          value={customTag}
          onChange={e => setCustomTag(e.target.value)}
          placeholder={customTagPlaceholder}
          onKeyPress={handleKeyPress}
          disabled={loading}
          sx={{ flex: 1 }}
        />
        <Button
          variant="contained"
          color="success"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddCustomTag}
          disabled={!customTag.trim() || loading}
        >
          Add
        </Button>
      </Box>

      {/* Add Tags Section */}
      <Box mb={2}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Add Tags - {normalizedAvailableTags.length} available
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
          {loading ? (
            <CircularProgress size={20} />
          ) : normalizedAvailableTags.length === 0 ? (
            <Typography variant="body2" color="text.disabled">No tags available</Typography>
          ) : (
            normalizedAvailableTags.map((tag, idx) => (
              <Chip
                key={`add-tag-${tag}-${idx}`}
                label={tag}
                color={selectedAddTags.includes(tag) ? "success" : "default"}
                variant={selectedAddTags.includes(tag) ? "filled" : "outlined"}
                onClick={() => onTagOperation('add', tag)}
                icon={selectedAddTags.includes(tag) ? <CheckIcon fontSize="small" /> : undefined}
                sx={{ cursor: 'pointer' }}
              />
            ))
          )}
        </Box>
      </Box>

      {/* Remove Tags Section */}
      <Box mb={2}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {showSmartRemoval
            ? "Remove Tags from Selected Questions - Only showing tags that exist in selected questions"
            : "Remove Tags from All Questions"}
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
          {showSmartRemoval ? (
            existingTags.length === 0 ? (
              <Typography variant="body2" color="text.disabled">No tags found in selected questions</Typography>
            ) : (
              existingTags.map(({ tag, count }, idx) => (
                <Chip
                  key={`remove-smart-tag-${tag}-${idx}`}
                  label={`${tag} (${count})`}
                  color={selectedRemoveTags.includes(tag) ? "error" : "default"}
                  variant={selectedRemoveTags.includes(tag) ? "filled" : "outlined"}
                  onClick={() => onTagOperation('remove', tag)}
                  icon={selectedRemoveTags.includes(tag) ? <CloseIcon fontSize="small" /> : undefined}
                  sx={{ cursor: 'pointer' }}
                />
              ))
            )
          ) : loading ? (
            <CircularProgress size={20} />
          ) : normalizedAvailableTags.length === 0 ? (
            <Typography variant="body2" color="text.disabled">No tags available for removal</Typography>
          ) : (
            normalizedAvailableTags.map((tag, idx) => (
              <Chip
                key={`remove-tag-${tag}-${idx}`}
                label={tag}
                color={selectedRemoveTags.includes(tag) ? "error" : "default"}
                variant={selectedRemoveTags.includes(tag) ? "filled" : "outlined"}
                onClick={() => onTagOperation('remove', tag)}
                icon={selectedRemoveTags.includes(tag) ? <CloseIcon fontSize="small" /> : undefined}
                sx={{ cursor: 'pointer' }}
              />
            ))
          )}
        </Box>
      </Box>

      {/* Summary */}
      {(selectedAddTags.length > 0 || selectedRemoveTags.length > 0) && (
        <Box bgcolor="primary.light" color="primary.dark" p={1.5} borderRadius={1} mt={2}>
          <Typography variant="body2">
            <strong>Tag Changes:</strong>
            {selectedAddTags.length > 0 && (
              <span> +{selectedAddTags.length} to add</span>
            )}
            {selectedRemoveTags.length > 0 && (
              <span> -{selectedRemoveTags.length} to remove</span>
            )}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export const CategorySelector = ({
  categories = [],
  selectedCategory = '',
  onChange,
  loading = false,
  error = null,
  onRefresh,
  placeholder = "No change",
  label = "Category",
  showNoChange = true
}) => (
  <Box mb={2}>
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
      <InputLabel>{label}</InputLabel>
      {onRefresh && (
        <Tooltip title="Refresh categories">
          <span>
            <IconButton onClick={onRefresh} disabled={loading} size="small" color="primary">
              <RefreshIcon className={loading ? 'animate-spin' : ''} fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Box>
    <FormControl fullWidth size="small">
      <Select
        value={selectedCategory}
        onChange={e => onChange(e.target.value)}
        disabled={loading}
        displayEmpty
      >
        {showNoChange && <MenuItem value="">{placeholder}</MenuItem>}
        {categories.map((category, idx) => (
          <MenuItem key={`category-${category.value}-${idx}`} value={category.value}>
            {category.label}
          </MenuItem>
        ))}
        {categories.length === 0 && !loading && (
          <MenuItem value="" disabled>No categories available</MenuItem>
        )}
      </Select>
    </FormControl>
    {loading && <Typography variant="caption" color="primary">Loading...</Typography>}
    {error && <Typography variant="caption" color="error">Error</Typography>}
  </Box>
);

export const BulkActionsPanel = ({
  title = "Apply to All Questions",
  description,
  children,
  onApply,
  applyButtonText = "Apply Changes",
  disabled = false,
  loading = false,
  className = ""
}) => (
  <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
    <Typography variant="h6" gutterBottom>{title}</Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {description}
      </Typography>
    )}
    <Box my={2}>{children}</Box>
    {onApply && (
      <>
        <Divider sx={{ my: 2 }} />
        <Button
          variant="contained"
          color="primary"
          onClick={onApply}
          disabled={disabled || loading}
          endIcon={loading ? <CircularProgress size={18} /> : null}
        >
          {loading ? 'Processing...' : applyButtonText}
        </Button>
      </>
    )}
  </Paper>
);

export const ChangesPreview = ({
  questions = [],
  individualChanges = {},
  title = "Preview Changes",
  maxHeight = "16rem"
}) => {
  const normalizeTagsForDisplay = (tags) => {
    if (!Array.isArray(tags)) return [];
    return tags.map(tag =>
      typeof tag === 'string'
        ? tag
        : tag?.rawname || tag?.name || tag?.tag || String(tag)
    ).filter(Boolean);
  };

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Box sx={{ maxHeight, overflowY: 'auto' }}>
        {questions.length === 0 ? (
          <Box textAlign="center" py={4} color="text.disabled">
            <ErrorOutlineIcon fontSize="large" sx={{ mb: 1 }} />
            <Typography variant="body2">No questions to preview</Typography>
          </Box>
        ) : (
          questions.map((q, idx) => {
            const changes = individualChanges[q.id] || {};
            const questionTags = normalizeTagsForDisplay(changes.tags || q.tags || []);
            return (
              <Paper key={`preview-question-${q.id}-${idx}`} sx={{ p: 2, mb: 2 }} variant="outlined">
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {changes.title || q.title || 'Untitled Question'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Status:</strong> {changes.status || q.status || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Mark:</strong> {changes.defaultMark || q.defaultMark || 1}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Tags:</strong> {questionTags.length}
                    </Typography>
                    {questionTags.length > 0 && (
                      <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                        {questionTags.slice(0, 5).map((tag, tagIdx) => (
                          <Chip key={`preview-tag-${tag}-${tagIdx}`} label={tag} size="small" color="primary" />
                        ))}
                        {questionTags.length > 5 && (
                          <Typography variant="caption" color="text.secondary">
                            +{questionTags.length - 5} more
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    ID: {q.id}
                  </Typography>
                </Box>
              </Paper>
            );
          })
        )}
      </Box>
    </Paper>
  );
};
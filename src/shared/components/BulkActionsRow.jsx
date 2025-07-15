import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Menu,
  MenuItem,
  IconButton,
  Paper,
  Stack,
  Checkbox,
  Chip,
  TextField,
  InputAdornment,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BarChartIcon from '@mui/icons-material/BarChart';
import TagIcon from '@mui/icons-material/Tag';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import GroupIcon from '@mui/icons-material/Group';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BulkActionsRow = ({
  selectedQuestions,
  setSelectedQuestions,
  setShowBulkEditModal,
  onBulkDelete,
  onBulkStatusChange,
  questions,
  setQuestions,
  fetchQuestions 

}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);

  // Tag management state
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [commonTags, setCommonTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [selectedTagsToAdd, setSelectedTagsToAdd] = useState([]);

  // Debounce search term
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch all tags and common tags when tag modal opens
  useEffect(() => {
    if (showTagModal) {
      fetchAllTags();
      fetchCommonTags();
      setSelectedTagsToAdd([]); // Clear selected tags when opening modal
      setSearchTerm('');
    }
  }, [showTagModal, selectedQuestions]);

  const fetchAllTags = async () => {
    setLoadingTags(true);
    try {
      const res = await fetch(`${API_BASE_URL}/questions/tags`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      setAllTags(Array.isArray(data) ? data : (data.tags || data.data || []));
    } catch (error) {
      console.error('Error fetching tags:', error);
      setAllTags([]);
    } finally {
      setLoadingTags(false);
    }
  };

  const fetchCommonTags = async (showError = true) => {
    if (selectedQuestions.length === 0) return;
    try {
      const tagLists = await Promise.all(
        selectedQuestions.map(qid =>
          fetch(`${API_BASE_URL}/questions/question-tags?questionid=${qid}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Accept': 'application/json'
            }
          })
            .then(res => res.json())
            .then(data => (data.tags || []))
        )
      );
      let intersection = tagLists[0] || [];
      for (let i = 1; i < tagLists.length; i++) {
        intersection = intersection.filter(tag =>
          tagLists[i].some(t => t.id === tag.id)
        );
      }
      setCommonTags(intersection);
    } catch (error) {
      console.error('Error fetching common tags:', error);
      if (showError) toast.error('Failed to fetch common tags');
      setCommonTags([]);
    }
  };

  const handleCreateTag = async (tagName) => {
    if (!tagName || !tagName.trim()) {
      toast.error('Please enter a tag name');
      return null;
    }

    setCreatingTag(true);
    try {
      const trimmedName = tagName.trim();
      
      // Use the new manage_tags endpoint
      const res = await fetch(`${API_BASE_URL}/questions/manage_tags?name=${encodeURIComponent(trimmedName)}&rawname=${encodeURIComponent(trimmedName)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });

      const data = await res.json();
      
      // Check if the response contains an error even if status is 200
      if (!res.ok || data.exception || data.errorcode || data.error) {
        // Handle specific error cases
        if (data.errorcode === 'invalidrecord' || data.exception === 'dml_missing_record_exception') {
          throw new Error('Tag creation service is not available. Please contact your administrator.');
        }
        throw new Error(data.message || data.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      // Check if we have a valid response with required fields
      if (!data.id || !data.name) {
        throw new Error('Invalid response from server - missing required fields');
      }

      console.log('✅ Tag created successfully:', data);
      
      // Add the new tag to the local state
      const newTag = {
        id: data.id,
        name: data.name,
        rawname: data.rawname || data.name
      };
      
      setAllTags(prev => [...prev, newTag]);
      setSearchTerm('');
      toast.success(`Tag "${data.name}" created successfully!`);
      
      return newTag;
    } catch (error) {
      console.error('❌ Error creating tag:', error);
      toast.error(`Failed to create tag: ${error.message}`);
      return null;
    } finally {
      setCreatingTag(false);
    }
  };

const handleAddTag = async (tagId) => {
  const tagName = allTags.find(t => t.id === tagId)?.name || 'this tag';
  const questionCount = selectedQuestions.length;
  
  if (!window.confirm(
    `Add "${tagName}" to ${questionCount} question${questionCount !== 1 ? 's' : ''}?\n\nThis action will update all selected questions.`
  )) {
    return;
  }
  
  try {
    console.log(' Adding tag to questions:', { 
      tagId, 
      questionCount, 
      selectedQuestions,
      tagName 
    });
    
    // Ensure question IDs are integers
    const validQuestionIds = selectedQuestions
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);
    
    if (validQuestionIds.length === 0) {
      toast.error('No valid question IDs selected');
      return;
    }
    
    //  CORRECT ENDPOINT: /questions/bulk-tags (with 's')
    const res = await fetch(`${API_BASE_URL}/questions/bulk-tags`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        questionids: validQuestionIds,  // Array of integers
        tagids: [parseInt(tagId)]       // Array with single integer
      })
    });
    
    console.log(' API Response Status:', res.status);
    const data = await res.json();
    console.log(' API Response Data:', data);
    
    if (res.ok && data.success) {
      // Update frontend state
      setQuestions(prevQuestions =>
        prevQuestions.map(q => {
          if (!validQuestionIds.includes(q.id)) return q;
          let newTags = Array.isArray(q.tags) ? [...q.tags] : [];
          const tagObj = allTags.find(t => t.id == tagId);
          if (tagObj && !newTags.some(t => t.id == tagId)) {
            newTags.push(tagObj);
          }
          return { ...q, tags: newTags };
        })
      );
      
      toast.success(`"${tagName}" tag added successfully!`);
      fetchCommonTags();
    } else {
      console.error(' API returned failure:', data);
      toast.error(data.message || data.error || 'Failed to add tag');
    }
    
  } catch (error) {
    console.error(' Network/API error:', error);
    toast.error(`Error adding tag: ${error.message}`);
  }
};

const handleRemoveTag = async (tagId) => {
  const tagName = commonTags.find(t => t.id === tagId)?.name || 'this tag';
  const questionCount = selectedQuestions.length;
  
  if (!window.confirm(
    `Remove "${tagName}" from ${questionCount} question${questionCount !== 1 ? 's' : ''}?\n\nThis action cannot be undone.`
  )) {
    return;
  }
  
  try {
    console.log(' Removing tag from questions:', { 
      tagId, 
      questionCount, 
      selectedQuestions,
      tagName 
    });
    
    // Ensure question IDs are integers
    const validQuestionIds = selectedQuestions
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);
    
    if (validQuestionIds.length === 0) {
      toast.error('No valid question IDs selected');
      return;
    }
    
    //  CORRECT ENDPOINT: /questions/bulk-tags (with 's')
    const res = await fetch(`${API_BASE_URL}/questions/bulk-tags`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        questionids: validQuestionIds,  // Array of integers
        tagids: [parseInt(tagId)]       // Array with single integer
      })
    });
    
    console.log('API Response Status:', res.status);
    const data = await res.json();
    console.log(' API Response Data:', data);
    
    if (res.ok && data.success) {
      // Update frontend state
      setQuestions(prevQuestions =>
        prevQuestions.map(q => {
          if (!validQuestionIds.includes(q.id)) return q;
          let newTags = Array.isArray(q.tags) ? [...q.tags] : [];
          newTags = newTags.filter(t => t.id != tagId);
          return { ...q, tags: newTags };
        })
      );
      setCommonTags(prevTags => prevTags.filter(t => t.id !== tagId));
      toast.success(`Removed "${tagName}" from ${questionCount} question${questionCount !== 1 ? 's' : ''}`);
      fetchCommonTags();
    } else {
      console.error(' API returned failure:', data);
      toast.error(data.message || data.error || 'Failed to remove tag');
    }
    
  } catch (error) {
    console.error('Network/API error:', error);
    toast.error(`Error removing tag: ${error.message}`);
  }
};


  // Enhanced tag search/filter logic with options for autocomplete
  const tagOptions = allTags.map(tag => ({
    label: tag.name || '',
    value: tag.id,
    rawname: tag.rawname || ''
  }));

  const availableTagOptions = tagOptions.filter(option =>
    !commonTags.some(commonTag => commonTag.id === option.value)
  );

  const filteredAvailableOptions = availableTagOptions.filter(option =>
    option.label && option.label.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  // Handle tag selection with autocomplete (simplified - no new tag creation)
  const handleTagAutocompleteChange = async (event, newValue, reason) => {
    if (reason === 'clear') {
      setSelectedTagsToAdd([]);
      return;
    }

    if (Array.isArray(newValue)) {
      // Only handle existing tags (no string values for new tags)
      const validTags = newValue.filter(value => typeof value === 'object' && value.value);
      setSelectedTagsToAdd(validTags);
    }
  };

  // Handle adding selected tags to questions
  const handleAddSelectedTags = async () => {
    if (selectedTagsToAdd.length === 0) {
      toast.error('Please select tags to add');
      return;
    }

    const tagIds = selectedTagsToAdd.map(tag => tag.value);
    const tagNames = selectedTagsToAdd.map(tag => tag.label).join(', ');
    
    try {
      const validQuestionIds = selectedQuestions
        .map(id => parseInt(id))
        .filter(id => !isNaN(id) && id > 0);
      
      if (validQuestionIds.length === 0) {
        toast.error('No valid question IDs selected');
        return;
      }
      
      const res = await fetch(`${API_BASE_URL}/questions/bulk-tags`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          questionids: validQuestionIds,
          tagids: tagIds.map(id => parseInt(id))
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Update frontend state
        setQuestions(prevQuestions =>
          prevQuestions.map(q => {
            if (!validQuestionIds.includes(q.id)) return q;
            let newTags = Array.isArray(q.tags) ? [...q.tags] : [];
            
            selectedTagsToAdd.forEach(tagOption => {
              const existingTag = allTags.find(t => t.id === tagOption.value);
              if (existingTag && !newTags.some(t => t.id === tagOption.value)) {
                newTags.push(existingTag);
              }
            });
            
            return { ...q, tags: newTags };
          })
        );
        
        toast.success(`Added tags "${tagNames}" to ${validQuestionIds.length} question${validQuestionIds.length !== 1 ? 's' : ''}`);
        fetchCommonTags();
        setSelectedTagsToAdd([]);
      } else {
        toast.error(data.message || data.error || 'Failed to add tags');
      }
    } catch (error) {
      console.error('Error adding tags:', error);
      toast.error(`Error adding tags: ${error.message}`);
    }
  };

  // Menu and modal handlers
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleAction = (action) => {
    setAnchorEl(null);
    switch (action) {
      case 'status':
        setShowStatusModal(true); break;
      case 'tags':
        setShowTagModal(true); break;
      case 'duplicate':
        setShowDuplicateModal(true); break;
      case 'export':
        setShowExportModal(true); break;
      case 'preview':
        setShowPreviewModal(true); break;
      case 'statistics':
        setShowStatisticsModal(true); break;
      default: break;
    }
  };

  if (selectedQuestions.length === 0) return null;

  return (
    <>
      <Paper elevation={1} sx={{ mb: 2, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Selection Info */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <GroupIcon color="primary" />
          <Typography variant="subtitle1">
            {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
          </Typography>
          <Button size="small" color="primary" onClick={() => setSelectedQuestions([])}>
            Clear selection
          </Button>
        </Stack>
        {/* Actions */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            // startIcon={<EditIcon />}
            onClick={() => setShowBulkEditModal(true)}
          >
            Bulk Edit
            {<EditIcon />}
          </Button>
           <Button
            variant="outlined"
            
            onClick={handleMenuClick}
          >
            Actions
            {<MoreVertIcon />}
          </Button>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => handleAction('status')}>
              <EditIcon sx={{ mr: 1 }} /> Change Status
            </MenuItem>
            <MenuItem onClick={() => handleAction('tags')}>
              <TagIcon sx={{ mr: 1 }} /> Manage Tags
            </MenuItem>
            <MenuItem onClick={() => handleAction('duplicate')}>
              <ContentCopyIcon sx={{ mr: 1 }} /> Duplicate Questions
            </MenuItem>
            <MenuItem onClick={() => handleAction('export')}>
              <DownloadIcon sx={{ mr: 1 }} /> Export to XML
            </MenuItem>
            <MenuItem onClick={() => handleAction('preview')}>
              <VisibilityIcon sx={{ mr: 1 }} /> Preview Questions
            </MenuItem>
            <MenuItem onClick={() => handleAction('statistics')}>
              <BarChartIcon sx={{ mr: 1 }} /> View Statistics
            </MenuItem>
          </Menu>
          <Button
            variant="contained"
            color="error"
             onClick={onBulkDelete}
            >
              Delete
            {<DeleteIcon />}
           
          
            
          </Button>
        </Stack>
      </Paper>

      {/* Status Modal */}
      <Dialog open={showStatusModal} onClose={() => setShowStatusModal(false)}>
        <DialogTitle>Change Status</DialogTitle>
        <DialogContent>
          <Typography>
            Update status for {selectedQuestions.length} selected question{selectedQuestions.length !== 1 ? 's' : ''}
          </Typography>
          <Stack spacing={2} mt={2}>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<WarningIcon />}
              onClick={() => {
                onBulkStatusChange(selectedQuestions, 'draft');
                setShowStatusModal(false);
              }}
            >
              Set as Draft
            </Button>
            <Button
              variant="outlined"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => {
                onBulkStatusChange(selectedQuestions, 'ready');
                setShowStatusModal(false);
              }}
            >
              Set as Ready
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStatusModal(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Tag Management Modal - Enhanced with MUI styling */}
      <Dialog open={showTagModal} onClose={() => setShowTagModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TagIcon color="primary" />
            <Typography variant="h6">Manage Tags</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Add or remove tags for <strong>{selectedQuestions.length}</strong> selected question{selectedQuestions.length !== 1 ? 's' : ''}
          </Typography>
          
          {/* Common Tags Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
              Common tags for all selected questions:
            </Typography>
            {commonTags.length > 0 ? (
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {commonTags.map(tag => (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    color="primary"
                    variant="filled"
                    onDelete={() => handleRemoveTag(tag.id)}
                    deleteIcon={<DeleteIcon />}
                    sx={{
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      '& .MuiChip-deleteIcon': {
                        color: '#d32f2f',
                        '&:hover': {
                          color: '#b71c1c'
                        }
                      }
                    }}
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No common tags found for all selected questions.
              </Typography>
            )}
          </Box>
          
          {/* Add Tags Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
              Add tags to all selected questions:
            </Typography>
            
            <Autocomplete
              multiple
              // freeSolo - Remove this to disable new tag creation
              options={filteredAvailableOptions}
              value={selectedTagsToAdd}
              onChange={handleTagAutocompleteChange}
              getOptionLabel={(option) => {
                if (typeof option === 'string') {
                  return option;
                }
                return option.label || '';
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={typeof option === 'string' ? option : option.value}
                      label={typeof option === 'string' ? option : option.label}
                      {...tagProps}
                      color="secondary"
                      variant="outlined"
                      size="small"
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search and select existing tags..."
                  variant="outlined"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {creatingTag && <CircularProgress size={20} />}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <li key={key} {...otherProps}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TagIcon fontSize="small" color="action" />
                      <Typography variant="body2">{option.label}</Typography>
                    </Box>
                  </li>
                );
              }}
              loading={loadingTags}
              loadingText="Loading tags..."
              noOptionsText="No tags found matching your search."
              sx={{ mb: 2 }}
            />
            
            {selectedTagsToAdd.length > 0 && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddSelectedTags}
                fullWidth
                sx={{ mb: 2 }}
              >
                Add {selectedTagsToAdd.length} Tag{selectedTagsToAdd.length !== 1 ? 's' : ''} to Questions
              </Button>
            )}
          </Box>
          
          {/* Available Tags Section */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
              Available tags:
            </Typography>
            {filteredAvailableOptions.length > 0 ? (
              <Box sx={{ 
                maxHeight: 200, 
                overflowY: 'auto',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                p: 1
              }}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {filteredAvailableOptions.map(option => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedTagsToAdd(prev => [...prev, option]);
                      }}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: '#f5f5f5'
                        }
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No available tags found.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowTagModal(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => setShowTagModal(false)}
            color="primary"
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Modal */}
      <Dialog open={showDuplicateModal} onClose={() => setShowDuplicateModal(false)}>
        <DialogTitle>Duplicate Questions</DialogTitle>
        <DialogContent>
          <Typography>
            This will create copies of {selectedQuestions.length} selected question{selectedQuestions.length !== 1 ? 's' : ''}. Are you sure you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDuplicateModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowDuplicateModal(false)}>Duplicate</Button>
        </DialogActions>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={showExportModal} onClose={() => setShowExportModal(false)}>
        <DialogTitle>Export to XML</DialogTitle>
        <DialogContent>
          <Typography mb={2}>
            Export {selectedQuestions.length} selected question{selectedQuestions.length !== 1 ? 's' : ''} to XML format.
          </Typography>
          <Stack spacing={1}>
            <Box display="flex" alignItems="center">
              <Checkbox defaultChecked />
              <Typography>Include question text</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Checkbox defaultChecked />
              <Typography>Include answer choices</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Checkbox />
              <Typography>Include explanations</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportModal(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={() => setShowExportModal(false)}>Download XML</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onClose={() => setShowPreviewModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Preview Questions</DialogTitle>
        <DialogContent>
          <Typography>
            Previewing {selectedQuestions.length} selected question{selectedQuestions.length !== 1 ? 's' : ''}
          </Typography>
          <Box mt={2} sx={{ maxHeight: 300, overflowY: 'auto' }}>
            <Typography color="text.secondary">Question preview content will be displayed here...</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Statistics Modal */}
      <Dialog open={showStatisticsModal} onClose={() => setShowStatisticsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Question Statistics</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Box display="flex" justifyContent="space-between">
              <Typography color="text.secondary">Total Questions:</Typography>
              <Typography fontWeight="medium">{selectedQuestions.length}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography color="text.secondary">Draft Status:</Typography>
              <Typography fontWeight="medium">-</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography color="text.secondary">Ready Status:</Typography>
              <Typography fontWeight="medium">-</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography color="text.secondary">Average Tags:</Typography>
              <Typography fontWeight="medium">-</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStatisticsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkActionsRow;
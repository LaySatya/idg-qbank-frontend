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
  const [showConfirmAddModal, setShowConfirmAddModal] = useState(false);
  const [pendingTagOperation, setPendingTagOperation] = useState(null);

  // Tag management state
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [commonTags, setCommonTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [selectedTagsToAdd, setSelectedTagsToAdd] = useState([]);

  // Debounce search term (removed as no longer needed)

  // Fetch all tags and common tags when tag modal opens
  useEffect(() => {
    if (showTagModal) {
      fetchAllTags();
      fetchCommonTags();
      setSelectedTagsToAdd([]); // Clear selected tags when opening modal
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
    
    console.log('🔍 Fetching common tags for questions:', selectedQuestions);
    console.log('🔍 Current commonTags state before API call:', commonTags);
    
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
            .then(data => {        console.log(`📊 Tags for question ${qid}:`, data.tags || []);
        // Log tag IDs and their types
        if (data.tags && data.tags.length > 0) {
          console.log(`� Tag IDs and types for question ${qid}:`, 
            data.tags.map(tag => ({ id: tag.id, type: typeof tag.id, name: tag.name }))
          );
        }
        return data.tags || [];
            })
        )
      );
      
      console.log(' Tag lists from API:', tagLists);
      
      let intersection = tagLists[0] || [];
      for (let i = 1; i < tagLists.length; i++) {
        intersection = intersection.filter(tag =>
          tagLists[i].some(t => t.id === tag.id)
        );
      }
      
      console.log(' Common tags intersection:', intersection);
      console.log(' Setting commonTags to:', intersection);
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
      toast.success(`Tag "${data.name}" created successfully!`);
      
      return newTag;
    } catch (error) {
      console.error(' Error creating tag:', error);
      toast.error(`Failed to create tag: ${error.message}`);
      return null;
    } finally {
      setCreatingTag(false);
    }
  };

const handleAddTag = async (tagId) => {
  const tagName = allTags.find(t => t.id === tagId)?.name || 'this tag';
  const questionCount = selectedQuestions.length;
  
  // Store the pending operation and show confirmation modal
  setPendingTagOperation({
    type: 'add',
    tagId,
    tagName,
    questionCount
  });
  setShowConfirmAddModal(true);
};

const handleConfirmAddTag = async () => {
  if (!pendingTagOperation) return;
  
  const { tagId, tagName, questionCount } = pendingTagOperation;
  
  try {
    console.log('Adding tag to questions:', { 
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
    
    //  FIXED: Using correct URL parameters format as per API documentation
    console.log('🔧 Using corrected API call with URL parameters for tag addition');
    
    // Build URL with query parameters as required by the API
    const params = new URLSearchParams();
    validQuestionIds.forEach((id, index) => {
      params.append(`questionids[${index}]`, id.toString());
    });
    params.append('tagids[0]', tagId.toString());
    
    const addUrl = `${API_BASE_URL}/questions/bulk-tags?${params.toString()}`;
    console.log('🚀 Sending POST request to:', addUrl);
    
    const res = await fetch(addUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Accept': 'application/json'
      }
      // No body needed - all parameters are in the URL
    });
    
    console.log('API Response Status:', res.status);
    const data = await res.json();
    console.log('API Response Data:', data);
    
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
      
      // Update common tags by adding the new tag
      const tagObj = allTags.find(t => t.id == tagId);
      if (tagObj) {
        setCommonTags(prevTags => {
          // Only add if not already present
          if (!prevTags.some(t => t.id === tagId)) {
            console.log('➕ Adding tag to commonTags:', tagObj);
            return [...prevTags, tagObj];
          }
          console.log('ℹ️ Tag already in commonTags:', tagObj);
          return prevTags;
        });
      }
      
      toast.success(`"${tagName}" tag added successfully!`);
      
      // Don't call fetchCommonTags() here as it might override our manual state update
      console.log('✅ Tag addition completed successfully');
    } else {
      console.error('API returned failure:', data);
      toast.error(data.message || data.error || 'Failed to add tag');
    }
    
  } catch (error) {
    console.error('Network/API error:', error);
    toast.error(`Error adding tag: ${error.message}`);
  } finally {
    setShowConfirmAddModal(false);
    setPendingTagOperation(null);
  }
};

const handleRemoveTag = async (tagId) => {
  const tagName = commonTags.find(t => t.id === tagId)?.name || 'this tag';
  const questionCount = selectedQuestions.length;
  
  // Store the pending operation and show confirmation modal
  setPendingTagOperation({
    type: 'remove',
    tagId,
    tagName,
    questionCount
  });
  setShowConfirmAddModal(true);
};

const handleConfirmRemoveTag = async () => {
  if (!pendingTagOperation) return;
  
  const { tagId, tagName, questionCount } = pendingTagOperation;
  
  try {
    console.log('Removing tag from questions:', { 
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
    
    //  FIXED: Using correct URL parameters format as per API documentation
    console.log('🔧 Using corrected API call with URL parameters');
    
    // Build URL with query parameters as required by the API
    const params = new URLSearchParams();
    validQuestionIds.forEach((id, index) => {
      params.append(`questionids[${index}]`, id.toString());
    });
    params.append('tagids[0]', tagId.toString());
    
    const deleteUrl = `${API_BASE_URL}/questions/bulk-tags?${params.toString()}`;
    console.log('� Sending DELETE request to:', deleteUrl);
    
    const res = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Accept': 'application/json'
      }
      // No body needed - all parameters are in the URL
    });
    
    console.log('Tag Removal API Response Status:', res.status);
    const data = await res.json();
    console.log('🔥 Tag Removal API Response Data:', data);
    
    // Add detailed debugging
    console.log('🔍 Question IDs:', validQuestionIds);
    console.log('🔍 Tag ID:', tagId, 'Type:', typeof tagId);
    console.log('🔍 URL Parameters:', params.toString());
    
    // Check what the question's current tags are
    if (validQuestionIds.length > 0) {
      const currentQuestion = questions.find(q => q.id === validQuestionIds[0]);
      if (currentQuestion && currentQuestion.tags) {
        console.log('🔍 Current question tags:', currentQuestion.tags);
        console.log('🔍 Question tag IDs and types:', 
          currentQuestion.tags.map(tag => ({ id: tag.id, type: typeof tag.id, name: tag.name }))
        );
        const hasTag = currentQuestion.tags.some(t => t.id == tagId);
        console.log('🔍 Question has tag before removal:', hasTag);
        
        // Check exact match with type conversion
        const exactMatch = currentQuestion.tags.find(t => t.id == tagId);
        const strictMatch = currentQuestion.tags.find(t => t.id === tagId);
        console.log('🔍 Exact match (loose ==):', exactMatch);
        console.log('🔍 Strict match (===):', strictMatch);
      }
    }
    
    // Check if operation was successful
    const allSuccessful = res.ok && data.success;
    console.log('✅ All operations successful:', allSuccessful);
    
    // Log detailed response analysis
    if (data.results && data.results.length > 0) {
      console.log('📊 Processing results:');
      data.results.forEach((result, index) => {
        console.log(`  Question ${result.questionid}: ${result.status} - ${result.message}`);
        console.log(`  Processed tags: ${result.processed_tagids}`);
        console.log(`  Failed tags: ${result.failed_tagids}`);
      });
    }
    
    // Check for actual effectiveness - if all results are "skipped", it means no changes were made
    const hasEffectiveChanges = data.results && data.results.some(result => 
      result.status === 'success' && result.processed_tagids && result.processed_tagids.length > 0
    );
    
    console.log('🔄 Has effective changes:', hasEffectiveChanges);
    
    if (allSuccessful && hasEffectiveChanges) {
      // Update frontend state
      setQuestions(prevQuestions =>
        prevQuestions.map(q => {
          if (!validQuestionIds.includes(q.id)) return q;
          let newTags = Array.isArray(q.tags) ? [...q.tags] : [];
          newTags = newTags.filter(t => t.id != tagId);
          return { ...q, tags: newTags };
        })
      );
      
      // Update common tags by removing the deleted tag
      setCommonTags(prevTags => {
        const filteredTags = prevTags.filter(t => t.id !== tagId);
        console.log(' Updating commonTags:', { 
          before: prevTags.length, 
          after: filteredTags.length, 
          removedTagId: tagId 
        });
        return filteredTags;
      });
      
      // Remove the tag from selected tags if it was selected
      setSelectedTagsToAdd(prevSelected => prevSelected.filter(t => t.value !== tagId));
      
      toast.success(`Removed "${tagName}" from ${questionCount} question${questionCount !== 1 ? 's' : ''}`);
      
      // Don't call fetchCommonTags() here as it might override our manual state update
      console.log('✅ Tag removal completed successfully');
      
      // Verify the tag was actually removed by checking one question's tags
      setTimeout(async () => {
        try {
          const verifyRes = await fetch(`${API_BASE_URL}/questions/question-tags?questionid=${validQuestionIds[0]}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Accept': 'application/json'
            }
          });
          const verifyData = await verifyRes.json();
          console.log('🔍 Verification: Tags for question', validQuestionIds[0], ':', verifyData.tags || []);
          const tagStillExists = (verifyData.tags || []).some(t => t.id == tagId);
          console.log('🔍 Tag still exists in database?', tagStillExists);
        } catch (error) {
          console.error('Error verifying tag removal:', error);
        }
      }, 1000); // Wait 1 second before verifying
      
    } else {
      console.error('❌ Tag removal failed or was ineffective');
      console.error('Response details:', data);
      
      // Handle different failure scenarios
      if (allSuccessful && !hasEffectiveChanges) {
        // API succeeded but no changes were made
        const skippedResults = data.results.filter(r => r.status === 'skipped');
        if (skippedResults.length > 0) {
          console.log('⚠️ Tag removal was skipped - tag may not be associated with question(s)');
          toast.error(`Tag "${tagName}" is not associated with the selected question${questionCount !== 1 ? 's' : ''}`);
        } else {
          toast.error('No effective changes were made');
        }
      } else {
        // API failed or returned errors
        let errorMessage = 'Failed to remove tag';
        if (data.results && data.results.length > 0) {
          const failedResults = data.results.filter(r => r.status === 'error');
          if (failedResults.length > 0) {
            errorMessage = `Failed to remove tag from ${failedResults.length} question${failedResults.length !== 1 ? 's' : ''}`;
          }
        }
        toast.error(errorMessage);
      }
    }
    
  } catch (error) {
    console.error('Network/API error:', error);
    toast.error(`Error removing tag: ${error.message}`);
  } finally {
    setShowConfirmAddModal(false);
    setPendingTagOperation(null);
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

  // For the autocomplete component, we'll use availableTagOptions directly
  const filteredAvailableOptions = availableTagOptions;

  // Handle tag selection with autocomplete (with new tag creation and immediate adding)
  const handleTagAutocompleteChange = async (event, newValue, reason) => {
    if (reason === 'clear') {
      setSelectedTagsToAdd([]);
      return;
    }

    if (Array.isArray(newValue)) {
      const processedTags = [];
      const tagsToAdd = [];
      
      for (const value of newValue) {
        if (typeof value === 'string') {
          // User entered a new tag name
          if (value.trim()) {
            // Check if tag already exists
            const existingTag = allTags.find(tag => 
              tag.name.toLowerCase() === value.trim().toLowerCase()
            );
            
            if (existingTag) {
              // Use existing tag
              const tagOption = {
                label: existingTag.name,
                value: existingTag.id,
                rawname: existingTag.rawname || existingTag.name
              };
              processedTags.push(tagOption);
              tagsToAdd.push(tagOption);
            } else {
              // Create new tag
              const newTag = await handleCreateTag(value.trim());
              if (newTag) {
                const tagOption = {
                  label: newTag.name,
                  value: newTag.id,
                  rawname: newTag.rawname || newTag.name
                };
                processedTags.push(tagOption);
                tagsToAdd.push(tagOption);
              }
            }
          }
        } else if (typeof value === 'object' && value.value) {
          // Existing tag option
          processedTags.push(value);
          // Check if this is a newly selected tag (not in previous selectedTagsToAdd)
          if (!selectedTagsToAdd.some(tag => tag.value === value.value)) {
            tagsToAdd.push(value);
          }
        }
      }
      
      setSelectedTagsToAdd(processedTags);
      
      // Automatically add newly selected tags
      if (tagsToAdd.length > 0) {
        await handleAddTagsDirectly(tagsToAdd);
      }
    }
  };

  // Handle adding tags directly without button click
  const handleAddTagsDirectly = async (tagsToAdd) => {
    const tagIds = tagsToAdd.map(tag => tag.value);
    const tagNames = tagsToAdd.map(tag => tag.label).join(', ');
    
    try {
      const validQuestionIds = selectedQuestions
        .map(id => parseInt(id))
        .filter(id => !isNaN(id) && id > 0);
      
      if (validQuestionIds.length === 0) {
        toast.error('No valid question IDs selected');
        return;
      }
      
      //  FIXED: Using correct URL parameters format as per API documentation
      console.log('🔧 Using corrected API call with URL parameters for bulk tag addition');
      
      // Build URL with query parameters as required by the API
      const params = new URLSearchParams();
      validQuestionIds.forEach((id, index) => {
        params.append(`questionids[${index}]`, id.toString());
      });
      tagIds.forEach((id, index) => {
        params.append(`tagids[${index}]`, id.toString());
      });
      
      const addUrl = `${API_BASE_URL}/questions/bulk-tags?${params.toString()}`;
      console.log('🚀 Sending POST request to:', addUrl);
      
      const res = await fetch(addUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
        // No body needed - all parameters are in the URL
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Update frontend state
        setQuestions(prevQuestions =>
          prevQuestions.map(q => {
            if (!validQuestionIds.includes(q.id)) return q;
            let newTags = Array.isArray(q.tags) ? [...q.tags] : [];
            
            tagsToAdd.forEach(tagOption => {
              const existingTag = allTags.find(t => t.id === tagOption.value);
              if (existingTag && !newTags.some(t => t.id === tagOption.value)) {
                newTags.push(existingTag);
              }
            });
            
            return { ...q, tags: newTags };
          })
        );
        
        // Update common tags by adding the new tags
        const newCommonTags = tagsToAdd.map(tagOption => 
          allTags.find(t => t.id === tagOption.value)
        ).filter(Boolean);
        
        setCommonTags(prevTags => {
          const updatedTags = [...prevTags];
          newCommonTags.forEach(newTag => {
            if (!updatedTags.some(t => t.id === newTag.id)) {
              updatedTags.push(newTag);
            }
          });
          console.log(' Adding tags to commonTags:', newCommonTags);
          return updatedTags;
        });
        toast.success('successfully added tags');
        // toast.success(`Added "${tagNames}" to ${validQuestionIds.length} question${validQuestionIds.length !== 1 ? 's' : ''}`);
        
        // Don't call fetchCommonTags() here as it might override our manual state update
        console.log(' Tags addition completed successfully');
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
              Search and add tags (tags will be added automatically when selected):
            </Typography>
            
            <Autocomplete
              multiple
              freeSolo // Enable new tag creation
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
                  const isNewTag = typeof option === 'string' || !option.value;
                  return (
                    <Chip
                      key={typeof option === 'string' ? option : option.value}
                      label={typeof option === 'string' ? option : option.label}
                      {...tagProps}
                      color={isNewTag ? "success" : "secondary"}
                      variant={isNewTag ? "filled" : "outlined"}
                      size="small"
                      icon={isNewTag ? <AddIcon /> : <TagIcon />}
                      sx={{
                        m: 0.5,
                        '& .MuiChip-icon': {
                          color: isNewTag ? '#fff' : 'inherit'
                        }
                      }}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search and select tags (auto-added) or type new tag names..."
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1976d2',
                      }
                    }
                  }}
                />
              )}
              renderOption={(props, option, { inputValue }) => {
                const { key, ...otherProps } = props;
                const isCreateOption = option.isCreateOption || false;
                
                return (
                  <li key={key} {...otherProps}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      width: '100%',
                      py: 0.5
                    }}>
                      {isCreateOption ? (
                        <>
                          <AddIcon fontSize="small" color="success" />
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#2e7d32' }}>
                            {option.label}
                          </Typography>
                        </>
                      ) : (
                        <>
                          <TagIcon fontSize="small" color="action" />
                          <Typography variant="body2">{option.label}</Typography>
                        </>
                      )}
                    </Box>
                  </li>
                );
              }}
              filterOptions={(options, { inputValue }) => {
                const filtered = options.filter(option =>
                  option.label.toLowerCase().includes(inputValue.toLowerCase())
                );
                
                // Add create option if inputValue doesn't match any existing tag
                if (inputValue && !filtered.some(option => 
                  option.label.toLowerCase() === inputValue.toLowerCase()
                )) {
                  filtered.push({
                    label: `Create "${inputValue}"`,
                    value: `create_${inputValue}`,
                    inputValue: inputValue,
                    isCreateOption: true
                  });
                }
                
                return filtered;
              }}
              loading={loadingTags}
              loadingText="Loading tags..."
              noOptionsText="Type to create a new tag..."
              sx={{ mb: 2 }}
            />
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

      {/* Confirmation Modal for Tag Operations */}
      <Dialog open={showConfirmAddModal} onClose={() => setShowConfirmAddModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {pendingTagOperation?.type === 'add' ? (
              <AddIcon color="primary" />
            ) : (
              <DeleteIcon color="error" />
            )}
            <Typography variant="h6">
              {pendingTagOperation?.type === 'add' ? 'Add Tag' : 'Remove Tag'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {pendingTagOperation?.type === 'add' ? (
              <>
                Add tag <strong>"{pendingTagOperation?.tagName}"</strong> to{' '}
                <strong>{pendingTagOperation?.questionCount}</strong> selected question
                {pendingTagOperation?.questionCount !== 1 ? 's' : ''}?
              </>
            ) : (
              <>
                Remove tag <strong>"{pendingTagOperation?.tagName}"</strong> from{' '}
                <strong>{pendingTagOperation?.questionCount}</strong> selected question
                {pendingTagOperation?.questionCount !== 1 ? 's' : ''}?
              </>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {pendingTagOperation?.type === 'add' ? (
              'This action will update all selected questions with the new tag.'
            ) : (
              'This action cannot be undone.'
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowConfirmAddModal(false);
              setPendingTagOperation(null);
            }}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={pendingTagOperation?.type === 'add' ? handleConfirmAddTag : handleConfirmRemoveTag}
            variant="contained"
            color={pendingTagOperation?.type === 'add' ? 'primary' : 'error'}
            startIcon={pendingTagOperation?.type === 'add' ? <AddIcon /> : <DeleteIcon />}
          >
            {pendingTagOperation?.type === 'add' ? 'Add Tag' : 'Remove Tag'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkActionsRow;
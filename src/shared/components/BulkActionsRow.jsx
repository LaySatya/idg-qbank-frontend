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
import DriveFileMoveOutlineIcon from '@mui/icons-material/DriveFileMoveOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import GroupIcon from '@mui/icons-material/Group';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-hot-toast';
import CloseSharpIcon from '@mui/icons-material/CloseSharp';
import SellSharpIcon from '@mui/icons-material/SellSharp';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  buildGroupedCategoryTree,
  flattenCategoryTree,
  generateCategoryPath
} from '../../shared/utils/categoryUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BulkActionsRow = ({
  selectedQuestions,
  setSelectedQuestions,
  setShowBulkEditModal,
  onBulkDelete,
  onBulkStatusChange,
  questions,
  setQuestions,
  fetchQuestions,
  availableCategories // <-- pass this prop from parent if you have the full list
}) => {
  // Clear selection when category filter changes (e.g., after move or filter change)
  useEffect(() => {
    const handleCategoryChange = () => {
      setSelectedQuestions([]);
    };
    window.addEventListener('questionCategoryChanged', handleCategoryChange);
    return () => {
      window.removeEventListener('questionCategoryChanged', handleCategoryChange);
    };
  }, [setSelectedQuestions]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [statusDropdownAnchorEl, setStatusDropdownAnchorEl] = useState(null);
  const [showTagModal, setShowTagModal] = useState(false);
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
    
    console.log(' Fetching common tags for questions:', selectedQuestions);
    console.log(' Current commonTags state before API call:', commonTags);
    
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
          console.log(` Tag IDs and types for question ${qid}:`, 
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

      console.log(' Tag created successfully:', data);
      
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
    console.log(' Using corrected API call with URL parameters for tag addition');
    
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
          console.log('Tag already in commonTags:', tagObj);
          return prevTags;
        });
      }
      
      toast.success(`"${tagName}" tag added successfully!`);
      
      // Don't call fetchCommonTags() here as it might override our manual state update
      console.log(' Tag addition completed successfully');
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
    console.log(' Tag Removal API Response Data:', data);
    
    // Add detailed debugging
    console.log(' Question IDs:', validQuestionIds);
    console.log(' Tag ID:', tagId, 'Type:', typeof tagId);
    console.log(' URL Parameters:', params.toString());
    
    // Check what the question's current tags are
    if (validQuestionIds.length > 0) {
      const currentQuestion = questions.find(q => q.id === validQuestionIds[0]);
      if (currentQuestion && currentQuestion.tags) {
        console.log(' Current question tags:', currentQuestion.tags);
        console.log(' Question tag IDs and types:', 
          currentQuestion.tags.map(tag => ({ id: tag.id, type: typeof tag.id, name: tag.name }))
        );
        const hasTag = currentQuestion.tags.some(t => t.id == tagId);
        console.log(' Question has tag before removal:', hasTag);
        
        // Check exact match with type conversion
        const exactMatch = currentQuestion.tags.find(t => t.id == tagId);
        const strictMatch = currentQuestion.tags.find(t => t.id === tagId);
        console.log(' Exact match (loose ==):', exactMatch);
        console.log(' Strict match (===):', strictMatch);
      }
    }
    
    // Check if operation was successful
    const allSuccessful = res.ok && data.success;
    console.log(' All operations successful:', allSuccessful);
    
    // Log detailed response analysis
    if (data.results && data.results.length > 0) {
      console.log(' Processing results:');
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
    
    console.log(' Has effective changes:', hasEffectiveChanges);
    
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
      console.log(' Tag removal completed successfully');
      
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
          console.log(' Verification: Tags for question', validQuestionIds[0], ':', verifyData.tags || []);
          const tagStillExists = (verifyData.tags || []).some(t => t.id == tagId);
          console.log(' Tag still exists in database?', tagStillExists);
        } catch (error) {
          console.error('Error verifying tag removal:', error);
        }
      }, 1000); // Wait 1 second before verifying
      
    } else {
      console.error(' Tag removal failed or was ineffective');
      console.error('Response details:', data);
      
      // Handle different failure scenarios
      if (allSuccessful && !hasEffectiveChanges) {
        // API succeeded but no changes were made
        const skippedResults = data.results.filter(r => r.status === 'skipped');
        if (skippedResults.length > 0) {
          console.log(' Tag removal was skipped - tag may not be associated with question(s)');
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
      console.log(' Using corrected API call with URL parameters for bulk tag addition');
      
      // Build URL with query parameters as required by the API
      const params = new URLSearchParams();
      validQuestionIds.forEach((id, index) => {
        params.append(`questionids[${index}]`, id.toString());
      });
      tagIds.forEach((id, index) => {
        params.append(`tagids[${index}]`, id.toString());
      });
      
      const addUrl = `${API_BASE_URL}/questions/bulk-tags?${params.toString()}`;
      console.log('Sending POST request to:', addUrl);
      
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
  // --- Move Questions State ---
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetCategory, setMoveTargetCategory] = useState('');
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveResult, setMoveResult] = useState(null);
  const [moveError, setMoveError] = useState(null);

  // --- Category List for Move Modal ---
  const [courseCategories, setCourseCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Fetch categories for the current course when move modal opens
  useEffect(() => {
    if (showMoveModal) {
      const courseId = localStorage.getItem('CourseID');
      if (!courseId) return;
      setCategoriesLoading(true);
      fetch(`${API_BASE_URL}/questions/question_categories?courseid=${courseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data.categories)) {
            // Use the full category object, not just id and name, to preserve contextid and parent
            setCourseCategories(data.categories);
          } else {
            setCourseCategories([]);
          }
        })
        .catch(() => setCourseCategories([]))
        .finally(() => setCategoriesLoading(false));
    }
  }, [showMoveModal]);

  // Use fetched categories for move modal, fallback to uniqueCategories from questions if not loaded
  const uniqueCategories = courseCategories.length > 0
    ? courseCategories
    : (questions || [])
      .map(q => ({
        id: q.categoryid || q.category || q.catId || q.categoryId,
        name: q.categoryname || q.categoryName || q.category || q.catName || ''
      }))
      .filter(cat => cat.id)
      .reduce((acc, cat) => {
        if (!acc.some(c => c.id === cat.id)) acc.push(cat);
        return acc;
      }, []);

  // Get source category from first selected question
  const sourceCategoryId = (() => {
    if (!selectedQuestions || selectedQuestions.length === 0) return '';
    const q = questions.find(q => q.id === selectedQuestions[0]);
    return q ? (q.categoryid || q.category || q.catId || q.categoryId) : '';
  })();

  const handleOpenMoveModal = () => {
    setMoveTargetCategory(''); // Always reset target category when opening modal
    setMoveResult(null);
    setMoveError(null);
    setShowMoveModal(true);
  };

  const handleMoveQuestions = async () => {
    setMoveLoading(true);
    setMoveResult(null);
    setMoveError(null);
    try {
      const validQuestionIds = selectedQuestions
        .map(id => parseInt(id))
        .filter(id => !isNaN(id) && id > 0);
      if (validQuestionIds.length === 0) {
        setMoveError('No valid question IDs selected');
        setMoveLoading(false);
        return;
      }
      if (!sourceCategoryId) {
        setMoveError('Source category not found');
        setMoveLoading(false);
        return;
      }
      if (!moveTargetCategory) {
        setMoveError('Please select a target category');
        setMoveLoading(false);
        return;
      }
      const params = new URLSearchParams();
      validQuestionIds.forEach((id) => {
        params.append('questionids[]', id.toString());
      });
      params.append('sourcecategoryid', sourceCategoryId);
      params.append('targetcategoryid', moveTargetCategory);
      const url = `${API_BASE_URL}/questions/move?${params.toString()}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      setMoveResult(data);
      if (data.success) {
        toast.success(`Moved to: ${data.targetcategoryname}`);
        setQuestions(prev => prev.map(q =>
          validQuestionIds.includes(q.id)
            ? { ...q, categoryid: moveTargetCategory, categoryname: data.targetcategoryname }
            : q
        ));
        setSelectedQuestions([]);
        setMoveTargetCategory(''); // Reset after move
        setShowMoveModal(false);
        // Set filter to show only the new target category in QuestionBank
        if (typeof window !== 'undefined') {
          localStorage.setItem('questionCategoryId', moveTargetCategory);
          localStorage.setItem('questionCategoryName', data.targetcategoryname || '');
          // Optionally, trigger a custom event to notify QuestionBank to update filters
          window.dispatchEvent(new CustomEvent('questionCategoryChanged', { detail: { id: moveTargetCategory, name: data.targetcategoryname } }));
        }
        if (fetchQuestions) fetchQuestions();
      } else {
        setMoveError(data.errors?.map(e => e.error).join(', ') || 'Move failed');
        toast.error('Move failed');
      }
    } catch (err) {
      setMoveError(err.message);
      toast.error('Move failed: ' + err.message);
    } finally {
      setMoveLoading(false);
    }
  };

  const handleAction = (action) => {
    setAnchorEl(null);
    switch (action) {
      case 'status':
        setShowStatusModal(true); break;
      case 'tags':
        setShowTagModal(true); break;
      case 'move':
        handleOpenMoveModal(); break;
      default: break;
    }
  };

  if (selectedQuestions.length === 0) return null;

  // Remove selectedQuestions from localStorage on mount and when selection changes
  useEffect(() => {
    localStorage.removeItem('selectedQuestions');
  }, [selectedQuestions]);

  return (
    <>
      <Paper
  elevation={0}
  sx={{
    mb: 2,
    p: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
  }}
>
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
            onClick={handleMenuClick}
          >
            Actions
            <MoreVertIcon />
          </Button>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem
              onClick={e => {
                e.stopPropagation();
                setStatusDropdownAnchorEl(e.currentTarget);
                handleMenuClose();
              }}
            >
              <EditIcon sx={{ mr: 1 }} /> Change Status
            </MenuItem>
            <MenuItem onClick={() => handleAction('tags')}>
              <SellSharpIcon sx={{ mr: 1 }} /> Manage Tags
            </MenuItem>
            <MenuItem onClick={() => handleAction('move')}>
              <DriveFileMoveOutlineIcon sx={{ mr: 1 }} /> Move to ...
            </MenuItem>
          </Menu>
         
          <Button
            variant="outlined"
            color="error"
            onClick={onBulkDelete}
          >
            Delete
            <DeleteIcon />
          </Button>
           
        </Stack>
      </Paper>

      {/* Status Modal */}
      {/* Move Questions Modal */}
      <Dialog 
        open={showMoveModal} 
        onClose={() => setShowMoveModal(false)} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'flex-start',
            paddingTop: '80px'
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            border: '1px solid #e5e7eb'
          }
        }}
      >
        {/* Header */}
        <DialogTitle 
          sx={{ 
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            color: '#111827',
            p: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  backgroundColor: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <DriveFileMoveOutlineIcon sx={{ fontSize: 20, color: '#6b7280' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.5 }}>
                  Move Questions to Another Category
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setShowMoveModal(false)}
              sx={{
                color: '#6b7280',
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: '#e5e7eb',
                  color: '#374151'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        {/* Main Content */}
        <DialogContent sx={{ p: 0 }}>
          <Box 
            sx={{ 
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              p: 3
            }}
          >
            <Typography variant="body2" color="#6b7280">
              Select a target category to move the selected questions
            </Typography>
          </Box>
          <Box sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <strong>Source Category:</strong> {sourceCategoryId || 'N/A'}
            </Box>
            <TextField
              select
              label="Target Category"
              value={moveTargetCategory}
              onChange={e => setMoveTargetCategory(e.target.value)}
              fullWidth
              margin="normal"
              disabled={categoriesLoading}
            >
              <MenuItem value="" disabled>
                {categoriesLoading ? 'Loading categories...' : 'Select category'}
              </MenuItem>
              {/* Render hierarchical category tree with parent/child indentation and full path as tooltip */}
              {(() => {
                // Use courseCategories if loaded, else fallback to uniqueCategories (flat)
                let grouped = [];
                if (courseCategories && courseCategories.length > 0) {
                  grouped = buildGroupedCategoryTree(courseCategories);
                } else if (uniqueCategories && uniqueCategories.length > 0) {
                  grouped = [{ contextid: 0, label: 'Categories', tree: uniqueCategories }];
                }

                // Use the real total count from the category object (from API)
                return grouped.flatMap(group => {
                  const flat = flattenCategoryTree(group.tree);
                  return flat
                    .filter(cat => cat.id && cat.id !== sourceCategoryId)
                    .map(cat => {
                      // Use totalQuestionCount or questioncount from the category object
                      const count = cat.totalQuestionCount ?? cat.questioncount ?? 0;
                      return (
                        <MenuItem
                          key={`cat-${cat.id}`}
                          value={cat.id}
                          title={cat.path || generateCategoryPath(cat, cat.level)}
                          style={{ paddingLeft: 16 + (cat.level || 0) * 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <span>
                            {cat.level > 0 && (
                              <span style={{ opacity: 0.5, marginRight: 4 }}>{'— '.repeat(cat.level)}</span>
                            )}
                            {cat.name || cat.id}
                            {group.label && group.label !== 'Categories' && cat.level === 0 && (
                              <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>({group.label})</span>
                            )}
                          </span>
                          <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 12, minWidth: 32, textAlign: 'right' }}>
                            {count}
                          </span>
                        </MenuItem>
                      );
                    });
                });
              })()}
            </TextField>
            {moveError && <div style={{ color: 'red', marginTop: 8 }}>{moveError}</div>}
            {moveResult && (
              <div style={{ marginTop: 16 }}>
                <div><strong>Result:</strong></div>
                <div>Success: {moveResult.success ? 'Yes' : 'No'}</div>
                <div>New Category: {moveResult.targetcategoryname || moveResult.targetcategoryid}</div>
                {moveResult.errors && moveResult.errors.length > 0 && (
                  <div style={{ color: 'red' }}>
                    Errors:
                    <ul>
                      {moveResult.errors.map((err, idx) => (
                        <li key={idx}>{err.questionid}: {err.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Box>
        </DialogContent>
        {/* Footer */}
        <DialogActions 
          sx={{ 
            backgroundColor: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
            p: 3,
            gap: 2,
            justifyContent: 'flex-end'
          }}
        >
          <Button 
            onClick={() => setShowMoveModal(false)} 
            variant="outlined"
            sx={{ 
              px: 3,
              py: 1,
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 500,
              borderColor: '#d1d5db',
              color: '#6b7280',
              backgroundColor: 'white',
              '&:hover': {
                borderColor: '#9ca3af',
                backgroundColor: '#f9fafb',
                color: '#374151'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleMoveQuestions} 
            variant="contained" 
            color="primary" 
            disabled={moveLoading || !moveTargetCategory}
            sx={{ 
              px: 3,
              py: 1,
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 500,
              backgroundColor: '#2c64b8',
              color: 'white',
              '&:hover': {
                 backgroundColor: '#2c64b8',
            borderColor: '#2c64b8'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {moveLoading ? 'Moving...' : 'Move'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Status Dropdown anchored to Change Status button */}
      <Menu
        anchorEl={statusDropdownAnchorEl}
        open={Boolean(statusDropdownAnchorEl)}
        onClose={() => setStatusDropdownAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" sx={{ px: 1 }}>
            Change Status for {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onBulkStatusChange(selectedQuestions, 'draft');
            setStatusDropdownAnchorEl(null);
          }}
        >
          <WarningIcon sx={{ mr: 1 }} color="warning" />  Draft
        </MenuItem>
        <MenuItem
          onClick={() => {
            onBulkStatusChange(selectedQuestions, 'ready');
            setStatusDropdownAnchorEl(null);
          }}
        >
          <CheckCircleIcon sx={{ mr: 1 }} color="success" />  Ready
        </MenuItem>
        <MenuItem
          onClick={() => setStatusDropdownAnchorEl(null)}
          sx={{ color: '#888' }}
        >
          Cancel
        </MenuItem>
      </Menu>

      {/* Tag Management Modal - Enhanced with MUI styling */}
      <Dialog 
        open={showTagModal} 
        onClose={() => setShowTagModal(false)} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'flex-start',
            paddingTop: '80px'
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            border: '1px solid #e5e7eb'
          }
        }}
      >
        {/* Minimal Header */}
        <DialogTitle 
          sx={{ 
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            color: '#111827',
            p: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  backgroundColor: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <SellSharpIcon sx={{ fontSize: 20, color: '#6b7280' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.5 }}>
                  Manage Tags
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setShowTagModal(false)}
              sx={{
                color: '#6b7280',
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: '#e5e7eb',
                  color: '#374151'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        {/* Main Content */}
        <DialogContent sx={{ p: 0 }}>
          {/* Info Bar */}
          <Box 
            sx={{ 
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              p: 3
            }}
          >
            <Typography variant="body2" color="#6b7280">
              Add or remove tags for selected questions
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            {/* Common Tags Section */}
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 2,
                  fontWeight: 600,
                  color: '#111827'
                }}
              >
                Current Tags
              </Typography>
              
              {commonTags.length > 0 ? (
                <Box 
                  sx={{ 
                    p: 3,
                    backgroundColor: '#f9fafb',
                    borderRadius: 1,
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {commonTags.map(tag => (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        onDelete={() => handleRemoveTag(tag.id)}
                        deleteIcon={<CloseSharpIcon />}
                        sx={{
                          backgroundColor: '#e5e7eb',
                          color: '#374151',
                          fontSize: '0.875rem',
                          height: '32px',
                          borderRadius: '6px',
                          '& .MuiChip-label': {
                            fontWeight: 500,
                            px: 1.5
                          },
                          '& .MuiChip-deleteIcon': {
                            color: '#6b7280',
                            fontSize: '18px',
                            '&:hover': {
                              color: '#374151',
                              backgroundColor: '#d1d5db',
                              borderRadius: '50%'
                            }
                          },
                          '&:hover': {
                            backgroundColor: '#d1d5db'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    p: 3,
                    backgroundColor: '#f9fafb',
                    borderRadius: 1,
                    border: '1px dashed #d1d5db',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="body2" color="#6b7280" sx={{ fontStyle: 'italic' }}>
                    No common tags found for all selected questions
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* Add Tags Section */}
            <Box>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 2,
                  fontWeight: 600,
                  color: '#111827'
                }}
              >
                Add Tags
              </Typography>
              
              <Typography variant="body2" color="#6b7280" sx={{ mb: 3 }}>
                Search existing tags or create new ones
              </Typography>
            
              <Autocomplete
                multiple
                freeSolo
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
                        sx={{
                          m: 0.5,
                          height: '28px',
                          fontSize: '0.8rem',
                          backgroundColor: isNewTag ? '#111827' : '#e5e7eb',
                          color: isNewTag ? 'white' : '#374151',
                          borderRadius: '6px',
                          '& .MuiChip-label': {
                            fontWeight: 500,
                            px: 1
                          },
                          '& .MuiChip-deleteIcon': {
                            color: isNewTag ? 'rgba(255,255,255,0.7)' : '#6b7280',
                            '&:hover': {
                              color: isNewTag ? 'white' : '#374151'
                            }
                          }
                        }}
                      />
                    );
                  })
                }
                                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search or create tags..."
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#9ca3af', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {creatingTag && <CircularProgress size={20} />}
                          <ArrowDropDownIcon sx={{ color: '#9ca3af', fontSize: 22, ml: 1 }} />
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        minHeight: '48px',
                        fontSize: '0.875rem',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        '& fieldset': {
                          borderColor: '#d1d5db'
                        },
                        '&:hover fieldset': {
                          borderColor: '#9ca3af'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#6b7280',
                          borderWidth: '1px'
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
                        gap: 2,
                        width: '100%',
                        py: 1,
                        px: 1
                      }}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '4px',
                            backgroundColor: isCreateOption ? '#111827' : '#e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isCreateOption ? (
                            <AddIcon fontSize="small" sx={{ color: 'white' }} />
                          ) : (
                            <SellSharpIcon fontSize="small" sx={{ color: '#6b7280' }} />
                          )}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 500,
                              color: '#374151'
                            }}
                          >
                            {option.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                            {isCreateOption ? 'Create new' : 'Existing'}
                          </Typography>
                        </Box>
                      </Box>
                    </li>
                  );
                }}
                filterOptions={(options, { inputValue }) => {
                  const filtered = options.filter(option =>
                    option.label.toLowerCase().includes(inputValue.toLowerCase())
                  );
                  
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
          </Box>
        </DialogContent>
        {/* Minimal Footer */}
        <DialogActions 
          sx={{ 
            backgroundColor: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
            p: 3,
            gap: 2,
            justifyContent: 'flex-end'
          }}
        >
          <Button 
            onClick={() => setShowTagModal(false)} 
            variant="outlined"
            sx={{ 
              px: 3,
              py: 1,
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 500,
              borderColor: '#d1d5db',
              color: '#6b7280',
              backgroundColor: 'white',
              '&:hover': {
                borderColor: '#9ca3af',
                backgroundColor: '#f9fafb',
                color: '#374151'
              }
            }}
          >
            Cancel
          </Button>
                  <Button 
            variant="contained" 
            onClick={() => setShowTagModal(false)}
            sx={{ 
              px: 3,
              py: 1,
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 500,
              backgroundColor: '#2c64b8',
              borderColor: '#2c64b8',
              color: 'white',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#2c64b8',
                borderColor: '#2c64b8'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Modal */}

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
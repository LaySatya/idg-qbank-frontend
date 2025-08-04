import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
// ============================================================================
// components/QuestionsTable.jsx - COMPLETE FIXED VERSION
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import { questionAPI } from '../../api/questionAPI';
import { toast } from 'react-hot-toast';
// ...existing code...
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import TagIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import Quill from 'quill';
import ReactQuill from 'react-quill';

ReactQuill.Quill = Quill;

import 'react-quill/dist/quill.snow.css';
import QuestionPreviewModal from './QuestionPreviewModal';
import QuestionHistoryView from './QuestionHistoryView';
import ReactModal from 'react-modal';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import QuestionCommentsModal from './preview/comments/QuestionCommentsModal';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// import CreateMultipleChoiceQuestion from '../../features/questions/components/forms/CreateMultipleChoiceQuestion';
// import CreateTrueFalseQuestion from '../../features/questions/components/forms/CreateTrueFalseQuestion';

// Enhanced Tag Management Modal Component with styling from BulkActionsRow
const TagManagementModal = ({
  isOpen,
  onRequestClose,
  question,
  onTagsUpdated,
  setQuestions
}) => {
  const [allTags, setAllTags] = useState([]);
  const [questionTags, setQuestionTags] = useState([]);
  const [selectedTagsToAdd, setSelectedTagsToAdd] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);

  // Load all tags and question tags when modal opens
  useEffect(() => {
    if (isOpen && question) {
      loadAllTags();
      loadQuestionTags();
      setSelectedTagsToAdd([]); // Clear selected tags when opening modal
    }
  }, [isOpen, question]);

  const loadAllTags = async () => {
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
      console.error('Error loading tags:', error);
      setAllTags([]);
    } finally {
      setLoadingTags(false);
    }
  };

  const loadQuestionTags = async () => {
    if (!question) return;
    try {
      const res = await fetch(`${API_BASE_URL}/questions/question-tags?questionid=${question.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      setQuestionTags(data.tags || []);
    } catch (error) {
      console.error('Error loading question tags:', error);
      setQuestionTags([]);
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
      
      // Use the manage_tags endpoint like in BulkActionsRow
      const res = await fetch(`${API_BASE_URL}/questions/manage_tags?name=${encodeURIComponent(trimmedName)}&rawname=${encodeURIComponent(trimmedName)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });

      const data = await res.json();
      
      if (!res.ok || data.exception || data.errorcode || data.error) {
        throw new Error(data.message || data.exception || 'Failed to create tag');
      }

      if (!data.id || !data.name) {
        throw new Error('Invalid response format from server');
      }

      console.log('Tag created successfully:', data);
      
      const newTag = {
        id: data.id,
        name: data.name,
        rawname: data.rawname || data.name
      };
      
      setAllTags(prev => [...prev, newTag]);
      toast.success(`Tag "${data.name}" created successfully!`);
      
      return newTag;
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error(`Failed to create tag: ${error.message}`);
      return null;
    } finally {
      setCreatingTag(false);
    }
  };

  const addTagToQuestion = async (tag) => {
    if (!question) return;
    try {
      const params = new URLSearchParams();
      params.append('questionids[0]', question.id.toString());
      params.append('tagids[0]', tag.id.toString());
      
      const addUrl = `${API_BASE_URL}/questions/bulk-tags?${params.toString()}`;
      
      const res = await fetch(addUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        loadQuestionTags();
        if (onTagsUpdated) onTagsUpdated([...questionTags, tag]);
        toast.success(`Tag "${tag.name}" added to question.`);
      } else {
        toast.error(`Failed to add tag "${tag.name}" to question.`);
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error(`Failed to add tag "${tag.name}" to question.`);
    }
  };

  const removeTagFromQuestion = async (tag) => {
    if (!question) return;
    try {
      const params = new URLSearchParams();
      params.append('questionids[0]', question.id.toString());
      params.append('tagids[0]', tag.id.toString());
      
      const deleteUrl = `${API_BASE_URL}/questions/bulk-tags?${params.toString()}`;
      
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        loadQuestionTags();
        if (onTagsUpdated) onTagsUpdated(questionTags.filter(t => t.id !== tag.id));
        toast.success(`Removed "${tag.name}" from question.`);
      } else {
        toast.error(`Failed to remove tag "${tag.name}" from question.`);
      }
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error(`Failed to remove tag "${tag.name}" from question.`);
    }
  };

  // Enhanced tag search/filter logic with options for autocomplete
  const tagOptions = allTags.map(tag => ({
    label: tag.name || '',
    value: tag.id,
    rawname: tag.rawname || ''
  }));

  const availableTagOptions = tagOptions.filter(option =>
    !questionTags.some(questionTag => questionTag.id === option.value)
  );

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
          // New tag creation
          const createdTag = await handleCreateTag(value);
          if (createdTag) {
            processedTags.push({
              label: createdTag.name,
              value: createdTag.id,
              rawname: createdTag.rawname
            });
            tagsToAdd.push({
              label: createdTag.name,
              value: createdTag.id
            });
          }
        } else if (value && value.isCreateOption) {
          // Create option selected
          const createdTag = await handleCreateTag(value.label);
          if (createdTag) {
            processedTags.push({
              label: createdTag.name,
              value: createdTag.id,
              rawname: createdTag.rawname
            });
            tagsToAdd.push({
              label: createdTag.name,
              value: createdTag.id
            });
          }
        } else if (value && value.value) {
          // Existing tag selected
          processedTags.push(value);
          tagsToAdd.push(value);
        }
      }
      
      setSelectedTagsToAdd(processedTags);
      
      // Automatically add newly selected tags
      if (tagsToAdd.length > 0) {
        for (const tagToAdd of tagsToAdd) {
          const tag = allTags.find(t => t.id === tagToAdd.value);
          if (tag) {
            await addTagToQuestion(tag);
          }
        }
        // Clear selection after adding
        setSelectedTagsToAdd([]);
      }
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onRequestClose} 
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
              <TagIcon sx={{ fontSize: 20, color: '#6b7280' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.5 }}>
                Manage Tags
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Question #{question?.id}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onRequestClose}
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
        {/* Question Info */}
        <Box 
          sx={{ 
            backgroundColor: 'white',
            borderBottom: '1px solid #e5e7eb',
            p: 3
          }}
        >
          <Typography variant="body2" color="#6b7280">
            {questionTags.length} tag{questionTags.length !== 1 ? 's' : ''} currently assigned
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          {/* Current Tags Section */}
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
            
            {questionTags.length > 0 ? (
              <Box 
                sx={{ 
                  p: 3,
                  backgroundColor: '#f9fafb',
                  borderRadius: 1,
                  border: '1px solid #e5e7eb'
                }}
              >
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {questionTags.map(tag => (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      onDelete={() => removeTagFromQuestion(tag)}
                      deleteIcon={<DeleteIcon />}
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
                  No tags assigned to this question
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
            freeSolo // Enable new tag creation
            options={availableTagOptions}
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
                        <TagIcon fontSize="small" sx={{ color: '#6b7280' }} />
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
              
              // Add create option if inputValue doesn't match any existing tag
              if (inputValue && !filtered.some(option => 
                option.label.toLowerCase() === inputValue.toLowerCase()
              )) {
                filtered.push({
                  label: `Create "${inputValue}"`,
                  value: `create-${inputValue}`,
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
        onClick={onRequestClose} 
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
        onClick={onRequestClose}
        sx={{ 
          px: 3,
          py: 1,
          borderRadius: '6px',
          textTransform: 'none',
          fontWeight: 500,
          backgroundColor: '#111827',
          color: 'white',
          '&:hover': {
            backgroundColor: '#000000'
          },
          transition: 'all 0.2s ease'
        }}
      >
        Done
      </Button>
    </DialogActions>
  </Dialog>
  );
};

const QuestionsTable = ({
  questions = [],
  allQuestions = [],
  filteredQuestions = [],
  selectedQuestions = [],
  setSelectedQuestions = () => {},
  showQuestionText = false,
  showQuestionMedia = false,
  scalerTopic = 'no',
  editingQuestion = null,
  setEditingQuestion = () => {},
  newQuestionTitle = '',
  setNewQuestionTitle = () => {},
  setShowSaveConfirm = () => {},
  openActionDropdown = null,
  setOpenActionDropdown = () => {},
  openStatusDropdown = null,
  setOpenStatusDropdown = () => {},
  dropdownRefs = { current: {} },
  onPreview = () => {},
  onEdit = () => {},
  onDuplicate = () => {},
  onHistory = () => {},
  onDelete = () => {},
  onStatusChange = () => {},
  setQType = () => {},
  username = '',
  setQuestions = () => {},
  onBack = null,
}) => {
  const [showSaveConfirmModal, setShowSaveConfirmModal] = React.useState(false);
  const [pendingSaveQuestionId, setPendingSaveQuestionId] = React.useState(null);
  const [dropdownDirection, setDropdownDirection] = useState({});
  const [showMoodlePreview, setShowMoodlePreview] = useState(false);
  const [moodlePreviewUrl, setMoodlePreviewUrl] = useState('');
  const [loadingMoodlePreview, setLoadingMoodlePreview] = useState(false);
  const [loadingDuplicate, setLoadingDuplicate] = useState(false);
  const [moodleFormLoading, setMoodleFormLoading] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagModalQuestion, setTagModalQuestion] = useState(null);
  const fetchedQuestionsRef = useRef(new Set());
  const isFetchingRef = useRef(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [historyQuestion, setHistoryQuestion] = useState(null);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [commentsQuestion, setCommentsQuestion] = useState(null);
  const [qtypeIcons, setQtypeIcons] = useState({});
  const [highlightedQuestions, setHighlightedQuestions] = useState(new Set());
  const [verifiedQuestions, setVerifiedQuestions] = useState(new Set());
  const [lastActionedQuestionId, setLastActionedQuestionId] = useState(null);
  const [lastActionType, setLastActionType] = useState(null);

const extractMediaFromHtml = (html) => {
  if (!html) return [];
  const div = document.createElement('div');
  div.innerHTML = html;
  const images = Array.from(div.querySelectorAll('img'));
  const videos = Array.from(div.querySelectorAll('video'));
  return [...images, ...videos].map(el => el.outerHTML);
};



function addTokenToImageSrc(html, token) {
  if (!token) return html;
  return html.replace(/<img([^>]+)src="([^"]+)"/g, (match, attrs, src) => {
    const separator = src.includes('?') ? '&' : '?';
    return `<img${attrs}src="${src}${src.includes('token=') ? '' : `${separator}token=${token}`}"`;
  });
}

  useEffect(() => {
    async function fetchQtypeIcons() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token available for fetching qtype icons');
          return;
        }

        const res = await fetch(`${API_BASE_URL}/questions/qtypes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        const iconMap = {};
        
        if (Array.isArray(data)) {
          data.forEach(qt => {
            if (qt && qt.name) {
              iconMap[qt.name] = qt;
            }
          });
        }
        
        setQtypeIcons(iconMap);
      } catch (e) {
        console.error('Error fetching qtype icons:', e);
        setQtypeIcons({});
      }
    }
    fetchQtypeIcons();
  }, []);

  const openCommentsModal = (question) => {
    if (!question) {
      console.error('No question provided to openCommentsModal');
      return;
    }
    setCommentsQuestion(question);
    setCommentsModalOpen(true);
  };

  const renderTags = (question) => {
    // Only show loading if:
    // 1. Question exists and has an ID
    // 2. Tags property is undefined/null (not fetched yet) or is an empty array AND hasn't been fetched yet
    // 3. Currently fetching tags
    const hasUndefinedTags = !question?.tags || (Array.isArray(question.tags) && question.tags.length === 0);
    const notFetchedYet = question?.id && !fetchedQuestionsRef.current.has(question.id);
    const isLoadingTags = question && question.id && hasUndefinedTags && notFetchedYet && isFetchingRef.current;
    
    if (isLoadingTags) {
      return (
        <div className="flex items-center gap-2 mt-1">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-sky-500"></div>
          <span className="italic text-gray-500 text-xs">Loading tags...</span>
        </div>
      );
    }

    if (!question || !Array.isArray(question.tags) || question.tags.length === 0) {
      return <span className="italic text-gray-400 text-xs">No tags</span>;
    }

    const maxVisibleTags = 3;
    const visibleTags = question.tags.slice(0, maxVisibleTags);
    const remainingCount = question.tags.length - maxVisibleTags;

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {visibleTags.map((tag) => {
          if (!tag || !tag.id) return null;
          
          return (
            <span
              key={tag.id}
              className="bg-sky-100 text-gray-800 text-xs px-2 py-1 rounded-full whitespace-nowrap"
              title={tag.name || `Tag ${tag.id}`}
            >
              {tag.name || `Tag ${tag.id}`}
            </span>
          );
        }).filter(Boolean)}
        {remainingCount > 0 && (
          <span
            className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full whitespace-nowrap cursor-help"
            title={`${remainingCount} more tags: ${question.tags.slice(maxVisibleTags).map(t => t.name || `Tag ${t.id}`).join(', ')}`}
          >
            +{remainingCount} more
          </span>
        )}
      </div>
    );
  };

  // Fetch comment counts for questions
  const fetchCommentCounts = async (questionIds) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const batchSize = 10; // Process 10 questions at a time
      const commentCounts = {};

      for (let i = 0; i < questionIds.length; i += batchSize) {
        const batch = questionIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (questionId) => {
          try {
            const response = await fetch(`${API_BASE_URL}/questions/comments?questionid=${questionId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              let commentsList = [];
              if (Array.isArray(data)) {
                commentsList = data;
              } else if (data.comments && Array.isArray(data.comments)) {
                commentsList = data.comments;
              } else if (data.data && Array.isArray(data.data)) {
                commentsList = data.data;
              }
              
              return { questionId, count: commentsList.length };
            } else {
              return { questionId, count: 0 };
            }
          } catch (error) {
            console.warn(`Failed to fetch comments for question ${questionId}:`, error);
            return { questionId, count: 0 };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            commentCounts[result.value.questionId] = result.value.count;
          }
        });

        // Small delay between batches to avoid overwhelming the server
        if (i + batchSize < questionIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Update questions with comment counts
      if (setQuestions && Object.keys(commentCounts).length > 0) {
        setQuestions(prev => {
          if (!Array.isArray(prev)) return prev;
          
          return prev.map(q => ({
            ...q,
            comments: commentCounts[q.id] !== undefined ? commentCounts[q.id] : (q.comments || 0)
          }));
        });
      }

    } catch (error) {
      console.error('Error fetching comment counts:', error);
    }
  };

  // Fetch comment counts when questions change
  useEffect(() => {
    if (!Array.isArray(questions) || questions.length === 0) return;
    
    // Only fetch for questions that don't have comment counts
    const questionsNeedingComments = questions.filter(q => 
      q && q.id && (q.comments === undefined || q.comments === null)
    );
    
    if (questionsNeedingComments.length > 0) {
      const questionIds = questionsNeedingComments.map(q => q.id);
      fetchCommentCounts(questionIds);
    }
  }, [questions?.length]);

  // Mark questions as fetched if they already have tags from initial load
  useEffect(() => {
    if (!Array.isArray(questions)) return;
    
    questions.forEach(question => {
      if (question?.id && Array.isArray(question.tags) && question.tags.length > 0) {
        fetchedQuestionsRef.current.add(question.id);
      }
    });
  }, [questions]);

  useEffect(() => {
    if (!Array.isArray(questions) || questions.length === 0 || isFetchingRef.current) return;

    const questionsNeedingTags = questions.filter(q => {
      if (!q || !q.id) return false;
      
      if (fetchedQuestionsRef.current.has(q.id)) {
        return false;
      }

      return !Array.isArray(q.tags) || q.tags.length === 0;
    });

    if (questionsNeedingTags.length === 0) {
      return;
    }

    console.log(`Fetching tags for ${questionsNeedingTags.length} questions`);

    async function fetchTagsForQuestions() {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token for tag fetching');
          return;
        }

        const batchSize = 3;
        let updatedQuestions = {};

        for (let i = 0; i < questionsNeedingTags.length; i += batchSize) {
          const batch = questionsNeedingTags.slice(i, i + batchSize);

          console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(questionsNeedingTags.length / batchSize)}`);

          const batchPromises = batch.map(async (question) => {
            try {
              if (!question || !question.id) {
                return { questionId: null, tags: [] };
              }

              const response = await fetch(`${API_BASE_URL}/questions/question-tags?questionid=${question.id}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
              });

              if (!response.ok) {
                console.warn(`Failed to fetch tags for question ${question.id}: ${response.status}`);
                return { questionId: question.id, tags: [] };
              }

              const data = await response.json();
              console.log(`Tags for question ${question.id}:`, data);

              const tags = Array.isArray(data.tags) ? data.tags : [];

              return { questionId: question.id, tags };
            } catch (error) {
              console.error(`Error fetching tags for question ${question.id}:`, error);
              return { questionId: question.id, tags: [] };
            }
          });

          const batchResults = await Promise.allSettled(batchPromises);

          batchResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.questionId) {
              const { questionId, tags } = result.value;
              updatedQuestions[questionId] = tags;
              fetchedQuestionsRef.current.add(questionId);
            }
          });

          if (i + batchSize < questionsNeedingTags.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        if (Object.keys(updatedQuestions).length > 0 && setQuestions) {
          setQuestions(prev => {
            if (!Array.isArray(prev)) return prev;
            
            return prev.map(q => {
              if (updatedQuestions.hasOwnProperty(q.id)) {
                return {
                  ...q,
                  tags: updatedQuestions[q.id] || []
                };
              }
              return q;
            });
          });

          console.log(`Successfully updated tags for ${Object.keys(updatedQuestions).length} questions`);
        }

      } catch (error) {
        console.error('Error in tag fetching process:', error);
        questionsNeedingTags.forEach(q => {
          if (q && q.id) {
            fetchedQuestionsRef.current.add(q.id);
          }
        });
      } finally {
        isFetchingRef.current = false;
      }
    }

    fetchTagsForQuestions();
  }, [questions?.length, setQuestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openActionDropdown && dropdownRefs?.current?.[openActionDropdown]) {
        if (!dropdownRefs.current[openActionDropdown].contains(event.target)) {
          setOpenActionDropdown(null);
        }
      }

      if (openStatusDropdown) {
        const statusDropdown = document.querySelector(`[data-status-dropdown="${openStatusDropdown}"]`);
        if (statusDropdown && !statusDropdown.contains(event.target)) {
          setOpenStatusDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionDropdown, openStatusDropdown, setOpenActionDropdown, setOpenStatusDropdown, dropdownRefs]);

  const getQuestionTypeIcon = (qtype, question) => {
    if (!question) return <span className="w-6 h-6 inline-block">•</span>;
    
    // Check if qtypes are still loading (empty qtypeIcons object)
    const isLoadingQtypes = Object.keys(qtypeIcons).length === 0;
    
    if (isLoadingQtypes) {
      return (
        <div className="flex items-center justify-center w-6 h-6">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500"></div>
        </div>
      );
    }
    
    const normalizedType = qtype || question.questionType || question.qtype;
    const qtypeInfo = qtypeIcons[normalizedType];
    
    if (qtypeInfo && qtypeInfo.iconurl) {
      return (
        <img
          src={qtypeInfo.iconurl}
          className="w-6 h-6"
          alt={qtypeInfo.label || normalizedType}
          title={qtypeInfo.label || normalizedType}
          style={{ background: '#fff', borderRadius: 4 }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'inline';
          }}
        />
      );
    }
    return <span className="icon text-gray-400">?</span>;
  };

  const handlePreviewMoodle = async (question) => {
    if (!question || !question.id) {
      toast.error('Invalid question for preview');
      return;
    }

    setLoadingMoodlePreview(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Add timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      const res = await fetch(`${API_BASE_URL}/questions/preview_moodle_question?questionid=${question.id}&_t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Cache-Control': 'no-cache' // Prevent caching
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.status && data.previewurl) {
        setMoodlePreviewUrl(data.previewurl);
        setShowMoodlePreview(true);
        setMoodleFormLoading(false);
      } else {
        toast.error(data.message || 'Failed to get preview URL');
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to fetch Moodle preview. Please try again.');
    } finally {
      setLoadingMoodlePreview(false);
    }
  };


const handleDuplicateMoodle = async (question) => {
  if (!question || !question.id) {
    toast.error('Invalid question for duplication');
    return;
  }

  setLoadingDuplicate(true);
  
  const token = localStorage.getItem('token');
  let courseId = localStorage.getItem('CourseID') ||
    localStorage.getItem('courseid') ||
    localStorage.getItem('courseId');

  if (courseId) {
    courseId = parseInt(courseId, 10);
  }

  if (!token) {
    toast.error('Missing authentication token');
    setLoadingDuplicate(false);
    return;
  }

  if (!courseId || isNaN(courseId)) {
    toast.error('Missing or invalid course ID. Please select a course first.');
    setLoadingDuplicate(false);
    return;
  }

  try {
    const url = `${API_BASE_URL}/questions/duplicate_moodle_form?questionid=${question.id}&courseid=${courseId}`;
    console.log('Fetching duplicate form from:', url);
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Duplicate form error response:', errorText);
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log('Duplicate form response:', data);

    if (data.duplicate_form_url) {
      setMoodlePreviewUrl(data.duplicate_form_url);
      setShowMoodlePreview(true);
      setMoodleFormLoading(false);
    } else {
      console.warn('No duplicate form URL in response:', data);
      toast.error('No duplicate form URL available for this question');
    }
  } catch (error) {
    console.error('Duplicate form error:', error);
    toast.error('Failed to fetch Moodle duplicate form. Please try again.');
  } finally {
    setLoadingDuplicate(false);
  }
};
//use for test edit in real too 
const handleEditClick = (questionId, courseIdParam) => {
  const baseMoodleUrl = import.meta.env.VITE_MOODLE_BASE_URL;
  const frontendBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:5173'
    : 'https://your-vercel-app.vercel.app';

  const courseId = courseIdParam || localStorage.getItem('CourseID');

  if (!courseId) {
    toast.error('Course ID is missing. Cannot open Moodle editor.');
    return;
  }

  const returnUrl = encodeURIComponent(`${frontendBaseUrl}/edit-complete?questionid=${questionId}`);
  const editFormUrl = `${baseMoodleUrl}/question/bank/editquestion/question.php?courseid=${courseId}&id=${questionId}&returnurl=${returnUrl}`;

  console.log('Opening Moodle edit with:', editFormUrl);
  setMoodlePreviewUrl(editFormUrl);
  setShowMoodlePreview(true);
  setMoodleFormLoading(false);
};


  ///edit for real  moodle question
const handleEditMoodle = async (question) => {
  if (!question || !question.id) {
    toast.error('Invalid question for editing');
    return;
  }
  
  const token = localStorage.getItem('token');

  let courseId = localStorage.getItem('CourseID') ||
    localStorage.getItem('courseid') ||
    localStorage.getItem('courseId');

  if (courseId) {
    courseId = parseInt(courseId, 10);
  }

  if (!token) {
    toast.error('Missing authentication token');
    return;
  }

  if (!courseId || isNaN(courseId)) {
    toast.error('Missing or invalid course ID. Please select a course first.');
    return;
  }

  try {
    // Get edit form URL from backend
    const url = `${API_BASE_URL}/questions/full_edit_moodle_form?questionid=${question.id}&courseid=${courseId}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();

    if (data.edit_form_url) {
      setMoodlePreviewUrl(data.edit_form_url);
      setShowMoodlePreview(true);
      setMoodleFormLoading(false);
    } else {
      toast.error(data.message || 'Failed to get edit form URL');
    }
  } catch (error) {
    console.error('Edit form error:', error);
    toast.error('Failed to fetch Moodle edit form. Please try again.');
  }
};


  const openTagModal = (question) => {
    if (!question) {
      console.error('No question provided to openTagModal');
      return;
    }
    setTagModalQuestion(question);
    setTagModalOpen(true);
  };

  const handlePreview = (question) => {
    if (!question) {
      console.error('No question provided to handlePreview');
      return;
    }
    setPreviewQuestion(question);
    setPreviewModalOpen(true);
    setLastActionedQuestionId(question.id);
    setLastActionType('preview');
  };

  const handleHistory = (question) => {
    if (!question) {
      console.error('No question provided to handleHistory');
      return;
    }
    const questionWithQbankEntry = {
      ...question,
      qbankentryid: question.qbankentryid || question.qbank_entry_id || question.entryid,
    };
    setHistoryQuestion(questionWithQbankEntry);
    setShowHistoryView(true);
    setLastActionedQuestionId(question.id);
    setLastActionType('history');
  };

  const handleBackFromHistory = () => {
    setShowHistoryView(false);
    setHistoryQuestion(null);
    setLastActionedQuestionId(null);
    setLastActionType(null);
  };

  const toggleQuestionSelection = (id) => {
    if (!setSelectedQuestions) return;
    setSelectedQuestions(prev => {
      if (!Array.isArray(prev)) prev = [];
      const newSelection = prev.includes(id)
        ? prev.filter(qId => qId !== id)
        : [...prev, id];
      localStorage.setItem('selectedQuestions', JSON.stringify(newSelection));
      return newSelection;
    });
    setLastActionedQuestionId(id);
    setLastActionType('select');
  };

  const toggleQuestionVerification = (id) => {
    setVerifiedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      
      // Save to localStorage to persist across sessions
      localStorage.setItem('verifiedQuestions', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
    setLastActionedQuestionId(id);
    setLastActionType('verify');
  };

  // Load verified questions from localStorage on component mount
  useEffect(() => {
    const savedVerified = localStorage.getItem('verifiedQuestions');
    if (savedVerified) {
      try {
        const verifiedArray = JSON.parse(savedVerified);
        setVerifiedQuestions(new Set(verifiedArray));
      } catch (error) {
        console.error('Error loading verified questions:', error);
      }
    }
  }, []);

  // Load selected questions from localStorage on component mount
  useEffect(() => {
    const savedSelected = localStorage.getItem('selectedQuestions');
    if (savedSelected && setSelectedQuestions) {
      try {
        const selectedArray = JSON.parse(savedSelected);
        if (Array.isArray(selectedArray)) {
          setSelectedQuestions(selectedArray);
        }
      } catch (error) {
        console.error('Error loading selected questions:', error);
      }
    }
  }, [setSelectedQuestions]);

  const handleSelectAll = (e) => {
    if (!setSelectedQuestions || !Array.isArray(filteredQuestions)) return;
    
    const newSelection = e.target.checked 
      ? filteredQuestions.map(q => q.id).filter(Boolean)
      : [];
    
    setSelectedQuestions(newSelection);
    
    // Save to localStorage to persist across page refreshes
    localStorage.setItem('selectedQuestions', JSON.stringify(newSelection));
  };

  const initiateQuestionSave = async (questionId) => {
    if (!newQuestionTitle.trim()) {
      alert('Question title cannot be empty');
      return;
    }

    if (!Array.isArray(questions)) {
      console.error('Questions is not an array');
      return;
    }

    try {
      const userid = localStorage.getItem('userid');
      if (!userid) {
        const shouldReload = confirm('Session expired. Reload the page?');
        if (shouldReload) window.location.reload();
        return;
      }

      const question = questions.find(q => q.id === questionId);
      if (!question) {
        console.error('Question not found:', questionId);
        return;
      }

      // Only update the question name, keep existing question text
      const result = await questionAPI.updateQuestionName(
        questionId,
        newQuestionTitle,
        question.questiontext || question.questionText || '', // Preserve existing question text
        Number(userid)
      );

      if (result.status) {
        if (setQuestions) {
          setQuestions(prev => {
            if (!Array.isArray(prev)) return prev;
            
            return prev.map(q =>
              q.id === questionId
                ? { ...q, name: newQuestionTitle, modifiedBy: result.modifiedby }
                : q
            );
          });
        }
        setEditingQuestion(null);
        toast.success(result.message || 'Question updated successfully');
      } else {
        toast.error(result.message || 'Failed to update question');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(`Failed to update: ${error.message}`);
    }
  };

  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No questions found.</p>
      </div>
    );
  }

  if (showHistoryView && historyQuestion) {
    return (
      <QuestionHistoryView
        question={historyQuestion}
        onBack={handleBackFromHistory}
        onPreview={(version) => {
          console.log('Preview version:', version);
          setShowHistoryView(false);
          setPreviewQuestion(version);
          setPreviewModalOpen(true);
        }}
        onRevert={(version) => {
          console.log('Revert to version:', version);
          toast.success(`Reverted to version ${version.version}`);
          setShowHistoryView(false);
        }}
      />
    );
  }

  return (
    <>
      
      
      <ReactModal
        isOpen={showMoodlePreview}
        onRequestClose={() => {
          setShowMoodlePreview(false);
          setMoodlePreviewUrl('');
          setMoodleFormLoading(false);
        }}
        contentLabel="Moodle Form"
        style={{
          overlay: { zIndex: 1000, background: 'rgba(0,0,0,0.5)' },
          content: {
            width: '95vw',
            maxWidth: 1400,
            height: '90vh',
            maxHeight: 900,
            margin: 'auto',
            padding: 0,
            overflow: 'hidden',
            borderRadius: '0',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }
        }}
      >
        <div style={{ position: 'absolute', top: 16, right: 24, zIndex: 10 }}>
          <button
            onClick={() => {
              setShowMoodlePreview(false);
              setMoodlePreviewUrl('');
              setMoodleFormLoading(false);
            }}
            style={{
              background: 'rgba(255,255,255,0.85)',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              cursor: 'pointer',
              fontSize: 24,
              color: '#333',
              transition: 'background 0.2s',
            }}
            title="Close"
            aria-label="Close"
          >
            <span style={{ fontSize: 24, lineHeight: 1 }}>&#10005;</span>
          </button>
        </div>
        <div style={{
          position: 'relative',
          width: '90vw',
          maxWidth: 1300,
          paddingBottom: '56.25%', // 16:9 aspect ratio
          height: 0,
          background: '#f9f9f9'
        }}>
          <iframe
            src={moodlePreviewUrl}
            title="Moodle Form"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            allowFullScreen
          />
        </div>
      </ReactModal>
      
   

      <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        {/* Back button header */}
        {onBack && (
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <button 
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Question Bank</h3>
              <p className="text-sm text-gray-600">Manage your questions</p>
            </div>
          </div>
        )}

        {questions.length === 0 ? (
          <div className="flex items-center justify-center text-gray-500 py-12">
            <div className="text-center">
              <i className="fas fa-question-circle text-4xl mb-4 text-gray-300"></i>
              <p className="text-lg">No questions found.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-[1100px] w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase border-b border-gray-200 w-25" scope="col">
                    <input
                      id="qbheadercheckbox"
                      name="qbheadercheckbox"
                      type="checkbox"
                      value="1"
                      onChange={handleSelectAll}
                      checked={
                        Array.isArray(selectedQuestions) && 
                        Array.isArray(filteredQuestions) && 
                        selectedQuestions.length === filteredQuestions.length && 
                        filteredQuestions.length > 0
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200 mx-auto"
                    />
                    <label htmlFor="qbheadercheckbox" className="sr-only">Select all</label>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-b border-gray-200 min-w-[300px]" scope="col">
                    <div className="flex flex-col gap-1">
                      <span>Question</span>
                      <div className="flex flex-row gap-2 text-xs text-gray-500 font-normal">
                        <span>Question name</span>
                        <span className="text-gray-300">|</span>
                        <span>TAGS</span>
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-b border-gray-200 w-24" scope="col">Status</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-b border-gray-200 w-20" scope="col">Comments</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-b border-gray-200 w-20" scope="col">Version</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-b border-gray-200 w-24" scope="col">
                    <span>Created by</span>
                    <div className="flex flex-row gap-2 text-xs text-gray-500 font-normal justify-center mt-1">
                      <span>First name</span>
                      <span className="text-gray-300">|</span>
                      <span>Last name</span>
                      <span className="text-gray-300">|</span>
                      <span>Date</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-b border-gray-200 min-w-[100px]" scope="col">
                    <span>Modified by</span>
                    <div className="flex flex-row gap-2 text-xs text-gray-500 font-normal justify-center mt-1">
                      <span>First name</span>
                      <span className="text-gray-300">|</span>
                      <span>Last name</span>
                      <span className="text-gray-300">|</span>
                      <span>Date</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-b border-gray-200 w-20" scope="col">Usage</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-b border-gray-200 w-16" scope="col">
                    <span className="flex items-center justify-center gap-1">Type <i className="fa fa-sort-asc fa-fw text-gray-500" title="Ascending" role="img" aria-label="Ascending"></i></span>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-b border-gray-200 w-20" scope="col">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {questions.map((question, index) => {
                if (!question || !question.id) {
                  console.warn('Invalid question at index:', index);
                  return null;
                }

                // Highlight last actioned question with a distinct color, but keep verified color for verified questions
                let rowClass = '';
                if (verifiedQuestions.has(question.id)) {
                  rowClass = 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm hover:bg-blue-100';
                } else if (lastActionedQuestionId === question.id) {
                  rowClass = 'bg-blue-100 border-l-4 border-l-blue-400 shadow-sm hover:bg-blue-200'; // highlight color for last actioned
                } else if (Array.isArray(selectedQuestions) && selectedQuestions.includes(question.id)) {
                  rowClass = 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm hover:bg-blue-100';
                } else {
                  rowClass = `${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 hover:shadow-md hover:border-l-4 hover:border-l-blue-500`;
                }

                return (
                  <React.Fragment key={question.id}>
                  <tr 
                    // key={question.id} 
                    className={`group transition-all duration-200 cursor-pointer ${rowClass}`}
                    onClick={() => {
                      handlePreviewMoodle(question);
                      setLastActionedQuestionId(question.id);
                      setLastActionType('rowClick');
                    }}
                    title={`Click anywhere to preview in Moodle${verifiedQuestions.has(question.id) ? ' (Verified ✓)' : ''}`}
                  >
                    <td className={`px-3 py-4 whitespace-nowrap${lastActionedQuestionId === question.id ? ' bg-blue-100 border-l-4 border-l-blue-400' : ''}`} onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <input
                          id={`checkq${question.id}`}
                          name={`q${question.id}`}
                          type="checkbox"
                          value="1"
                          checked={Array.isArray(selectedQuestions) && selectedQuestions.includes(question.id)}
                          onChange={() => toggleQuestionSelection(question.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                        />
                        <label htmlFor={`checkq${question.id}`} className="sr-only">Select</label>
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex flex-col items-start w-full relative pr-20 min-h-[60px]">
                        {/* <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                          <div className="flex items-center justify-center text-xs text-blue-600 bg-blue-100 w-8 h-8 rounded-full">
                            <i className="fas fa-eye"></i>
                          </div>
                        </div> */}
                        {/* {Array.isArray(selectedQuestions) && selectedQuestions.includes(question.id) && (
                          <div className="absolute -top-2 -right-2 z-20">
                            <div className="flex items-center justify-center text-xs text-white bg-blue-600 w-6 h-6 rounded-full shadow-lg border border-white">
                              <i className="fas fa-check"></i>
                            </div>
                          </div>
                        )} */}
                        {verifiedQuestions.has(question.id) && (
                          <div className="absolute top-0 right-10 z-15">
                            <div className="flex items-center justify-center text-xs text-white bg-blue-600 w-6 h-6 rounded-full shadow-lg border border-white">
                              <CheckCircleTwoToneIcon style={{ fontSize: 18, color: 'white' }} />
                            </div>
                          </div>
                        )}
                        <div className="w-full mb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              {editingQuestion === question.id ? (
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    value={newQuestionTitle}
                                    onChange={(e) => setNewQuestionTitle(e.target.value)}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                    autoFocus
                                    onKeyDown={async (e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        setPendingSaveQuestionId(question.id);
                                        setShowSaveConfirmModal(true);
                                      }
                                      if (e.key === 'Escape') {
                                        e.preventDefault();
                                        setEditingQuestion(null);
                                      }
                                    }}
                                  />
                                  {/* <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPendingSaveQuestionId(question.id);
                                      setShowSaveConfirmModal(true);
                                    }}
                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                  >
                                    Save
                                  </button> */}
                            {/* Save Confirmation Modal (MUI) */}
                            <Dialog open={showSaveConfirmModal} onClose={() => {
                              setShowSaveConfirmModal(false);
                              setEditingQuestion(null);
                              setPendingSaveQuestionId(null);
                            }}>
                              <DialogTitle>Confirm Save</DialogTitle>
                              <DialogContent>
                                Are you sure you want to save this question name?
                              </DialogContent>
                              <DialogActions>
                                <Button onClick={() => {
                                  setShowSaveConfirmModal(false);
                                  setEditingQuestion(null);
                                  setPendingSaveQuestionId(null);
                                }} color="inherit">Cancel</Button>
                                <Button
                                  onClick={async () => {
                                    setShowSaveConfirmModal(false);
                                    if (pendingSaveQuestionId) {
                                      await initiateQuestionSave(pendingSaveQuestionId);
                                      setEditingQuestion(null);
                                      setPendingSaveQuestionId(null);
                                    }
                                  }}
                                  color="primary"
                                  variant="contained"
                                >
                                  Confirm
                                </Button>
                              </DialogActions>
                            </Dialog>
                          {/* <button
                                    onClick={() => {
                                      setEditingQuestion(null);
                                    }}
                                    className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 transition-colors"
                                  >
                                    Cancel
                                  </button> */}
                                </div>
                            ) : (
                              <span
                                className="inline-flex items-center group cursor-pointer hover:bg-blue-50 rounded px-1 py-1 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Editing question:', question.id, question.name);
                                  setEditingQuestion(question.id);
                                  setNewQuestionTitle(question.name || question.title || '');
                                }}
                              >
                                <span className="ml-2 text-black hover:text-blue-700 flex items-center" style={{ fontFamily: "'Noto Sans Khmer', Arial, sans-serif" }}>
                                  {question.name || question.title || '(No title)'}
                                  <span className="ml-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <EditIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
                                  </span>
                                </span>
                              </span>
                            )}
                          </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleQuestionVerification(question.id);
                              }}
                              className={`ml-2 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                                verifiedQuestions.has(question.id)
                                  ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                                  : 'bg-gray-200 text-gray-500 hover:bg-blue-100 hover:text-blue-600'
                              }`}
                              title={verifiedQuestions.has(question.id) ? 'Mark as unverified' : 'Mark as verified'}
                            >
                              {verifiedQuestions.has(question.id)
                                ? <CheckCircleTwoToneIcon style={{ fontSize: 20, color: 'white' }} />
                                : <CheckCircleOutlineIcon style={{ fontSize: 20, color: '#22c55e' }} />}
                            </button>
                          </div>
                          {question.idNumber && (
                            <span className="ml-1">
                              <span className="sr-only">ID number</span>&nbsp;
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-small bg-grey-100 text-grey-800">ID {question.idNumber}</span>
                            </span>
                          )}
                        </div>
                        {question.questiontext && (
                          <div className="text-xs text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: question.questiontext }} />
                        )}
                        <div className="w-full">
                          {renderTags(question)}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap w-32 min-w-[110px]" onClick={(e) => e.stopPropagation()}>
                      <div className="relative" data-status-dropdown={question.id}>
                        <select
                          id={`question_status_dropdown-${question.id}`}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8"
                          name="question_status_dropdown"
                          value={question.status || 'ready'}
                          onChange={(e) => onStatusChange(question.id, e.target.value)}
                        >
                          <option value="ready">Ready</option>
                          <option value="draft">Draft</option>
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <i className="fa fa-sort text-gray-400" aria-hidden="true"></i>
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        className={`text-blue-600 hover:text-blue-900 underline cursor-pointer${lastActionedQuestionId === question.id ? ' bg-sky-100 border-l-4 border-l-blue-400' : ''}`}
                        onClick={() => {
                          openCommentsModal(question);
                          setLastActionedQuestionId(question.id);
                          setLastActionType('comments');
                        }}
                      >
                        {question.comments || 0}
                      </button>
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{question.version || 'v1'}</td>

                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{question.createdBy?.name || ''}</span>
                      <br />
                      <span className="text-xs text-gray-500">{question.createdBy?.date || ''}</span>
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{question.modifiedBy?.name || ''}</span>
                      <br />
                      <span className="text-xs text-gray-500">{question.modifiedBy?.date || ''}</span>
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <a href="#" className="text-blue-600 hover:text-blue-900 cursor-pointer">
                        {question.usage || 0}
                      </a>
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap">
                      {getQuestionTypeIcon(question.qtype || question.questionType, question)}
                    </td>

                    <td className={`px-3 py-4 whitespace-nowrap${lastActionedQuestionId === question.id ? ' bg-blue-100 border-l-4 border-l-blue-400' : ''}`} onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <div className="flex">
                          <div className="relative" ref={el => {
                            if (dropdownRefs?.current) {
                              dropdownRefs.current[question.id] = el;
                            }
                          }}>
                            <div>
                              <a
                                href="#"
                                className="text-blue-600 hover:text-blue-900 focus:outline-none cursor-pointer"
                                aria-label="Edit"
                                role="button"
                                aria-haspopup="true"
                                aria-expanded={openActionDropdown === question.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (dropdownRefs?.current?.[question.id]) {
                                    const el = dropdownRefs.current[question.id];
                                    const rect = el.getBoundingClientRect();
                                    const dropdownHeight = 350;
                                    const spaceBelow = window.innerHeight - rect.bottom;
                                    setDropdownDirection(prev => ({
                                      ...prev,
                                      [question.id]: spaceBelow < dropdownHeight ? 'up' : 'down'
                                    }));
                                  }
                                  setOpenActionDropdown(openActionDropdown === question.id ? null : question.id);
                                }}
                              >
                                Edit
                                <i className="fa fa-chevron-down ml-1"></i>
                              </a>
                              {openActionDropdown === question.id && (
                                <div
                                  className={`absolute right-0 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1
                                  ${dropdownDirection[question.id] === 'up' ? 'bottom-full mb-2' : 'mt-2'}`}
                                  style={{
                                    ...(dropdownDirection[question.id] === 'up' ? { bottom: '100%' } : { top: '100%' })
                                  }}
                                >
                                  <a
                                    href="#"
                                    className={`flex items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-900 transition-colors cursor-pointer ${loadingMoodlePreview ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      if (!loadingMoodlePreview) {
                                        await handlePreviewMoodle(question);
                                        setLastActionedQuestionId(question.id);
                                        setLastActionType('preview');
                                        setOpenActionDropdown(null);
                                      }
                                    }}
                                  >
                                    <i className={`fa ${loadingMoodlePreview ? 'fa-spinner fa-spin' : 'fa-eye'} w-4 text-center mr-2 text-blue-500`}></i>
                                    <span>{loadingMoodlePreview ? 'Loading...' : 'Preview Moodle'}</span>
                                  </a>
                                  <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-900 transition-colors cursor-pointer"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      // Use the same iframe modal for Edit in Moodle
                                      await handleEditMoodle(question);
                                      setLastActionedQuestionId(question.id);
                                      setLastActionType('editMoodle');
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className="fa fa-edit w-4 text-center mr-2 text-blue-500"></i>
                                    <span>Edit in Moodle</span>
                                  </a>
                                  <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-900 transition-colors cursor-pointer"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      // Use the same iframe modal for Duplicate in Moodle
                                      await handleDuplicateMoodle(question);
                                      setLastActionedQuestionId(question.id);
                                      setLastActionType('duplicate');
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className="fa fa-copy w-4 text-center mr-2 text-blue-500"></i>
                                    <span>Duplicate in Moodle</span>
                                  </a>
                                  {/* <a
                                href="#"
                                className="flex items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                                role="menuitem"
                                tabIndex="-1"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleEditClick(question.id, question.courseid|| localStorage.getItem('CourseID')); // or question.courseId based on your API

                                  setOpenActionDropdown(null);
                                }}
                              >
                                <i className="fa fa-edit w-4 text-center mr-2 text-blue-500"></i>
                                <span>Edit  Moodle</span>
                              </a> */}

                                  <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setEditingQuestion(question.id);
                                      setNewQuestionTitle(question.name || question.title || '');
                                      setLastActionedQuestionId(question.id);
                                      setLastActionType('editName');
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className="fa fa-cog w-4 text-center mr-2 text-gray-500"></i>
                                    <span>Edit question name</span>
                                  </a>
                                  {/* <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      onDuplicate(question.id);
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className="fa fa-copy w-4 text-center mr-2 text-gray-500"></i>
                                    <span>Duplicate</span>
                                  </a> */}
                                  <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      openTagModal(question);
                                      setLastActionedQuestionId(question.id);
                                      setLastActionType('tags');
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className="fa fa-tags w-4 text-center mr-2 text-gray-500"></i>
                                    <span>Manage tags</span>
                                  </a>
                                  <a
                                    href="#"
                                    className={`flex items-center px-4 py-2 text-sm transition-colors cursor-pointer ${
                                      verifiedQuestions.has(question.id)
                                        ? 'text-green-700 hover:bg-green-50 hover:text-green-900'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      toggleQuestionVerification(question.id);
                                      setLastActionedQuestionId(question.id);
                                      setLastActionType('verify');
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className={`fa ${verifiedQuestions.has(question.id) ? 'fa-check-double text-blue-500' : 'fa-check text-gray-500'} w-4 text-center mr-2`}></i>
                                    <span>{verifiedQuestions.has(question.id) ? 'Mark as unverified' : 'Mark as verified'}</span>
                                  </a>
                                  <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handlePreview(question);
                                      setLastActionedQuestionId(question.id);
                                      setLastActionType('preview');
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className="fa fa-search w-4 text-center mr-2 text-gray-500"></i>
                                    <span>Preview</span>
                                  </a>
                                  <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleHistory(question);
                                      setLastActionedQuestionId(question.id);
                                      setLastActionType('history');
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className="fa fa-list w-4 text-center mr-2 text-gray-500"></i>
                                    <span>History</span>
                                  </a>
                                  <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      onDelete(question.id);
                                      setLastActionedQuestionId(question.id);
                                      setLastActionType('delete');
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className="fa fa-trash w-4 text-center mr-2 text-red-500"></i>
                                    <span>Delete</span>
                                  </a>
                                  {/* <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setOpenActionDropdown(null);
                                      setLastActionedQuestionId(question.id);
                                      setLastActionType('export');
                                    }}
                                  >
                                    <i className="fa fa-download w-4 text-center mr-2 text-gray-500"></i>
                                    <span>Export as Moodle XML</span>
                                  </a> */}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                  </tr>
                        {(showQuestionText || showQuestionMedia) && (question.questiontext || question.questionText) && (
        <tr>
          <td colSpan={10} style={{ background: '#f9fafb', padding: 0 }}>
            <div style={{ padding: '16px 32px', borderTop: '1px solid #e5e7eb' }}>
                           {showQuestionText && (
                <div
                  className="text-sm text-gray-700"
                  style={{ marginBottom: showQuestionMedia ? 12 : 0 }}
                  dangerouslySetInnerHTML={{
                    __html: addTokenToImageSrc(
                      showQuestionMedia
                        ? (question.questiontext || question.questionText)
                        : (question.questiontext || question.questionText).replace(/<img[^>]*>/g, ''),
                      localStorage.getItem('token')
                    )
                  }}
                />
              )}
              {/* {showQuestionMedia && (
                <div className="flex flex-wrap gap-4 mt-2">
                  {extractMediaFromHtml(question.questiontext || question.questionText).map((mediaHtml, i) => (
                    <span
                      key={i}
                      dangerouslySetInnerHTML={{ __html: mediaHtml }}
                      style={{ maxWidth: 300, maxHeight: 200, display: 'inline-block' }}
                    />
                  ))}
                </div>
              )} */}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
                );
              }).filter(Boolean)}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Tag Management Modal */}
      <TagManagementModal
        isOpen={tagModalOpen}
        onRequestClose={() => {
          setTagModalOpen(false);
          setTagModalQuestion(null);
        }}
        question={tagModalQuestion}
        onTagsUpdated={(updatedTags) => {
          if (setQuestions && tagModalQuestion) {
            setQuestions(prev => {
              if (!Array.isArray(prev)) return prev;
              
              return prev.map(q =>
                q.id === tagModalQuestion.id
                  ? { ...q, tags: updatedTags }
                  : q
              );
            });
          }
        }}
        setQuestions={setQuestions}
      />
      
      {/* Comments Modal */}
      {commentsModalOpen && commentsQuestion && (
        <QuestionCommentsModal
          isOpen={commentsModalOpen}
          onRequestClose={() => {
            setCommentsModalOpen(false);
            setCommentsQuestion(null);
          }}
          question={commentsQuestion}
          setQuestions={setQuestions}
        />
      )}

      {/* Enhanced Question Preview Modal */}
      <QuestionPreviewModal
        isOpen={previewModalOpen}
        onRequestClose={() => {
          setPreviewModalOpen(false);
          setPreviewQuestion(null);
        }}
        question={previewQuestion}
        onEdit={(question) => {
          setPreviewModalOpen(false);
          setEditingQuestion(question.id);
          setNewQuestionTitle(question.name || question.title || '');
        }}
        onDuplicate={(questionId) => {
          setPreviewModalOpen(false);
          onDuplicate(questionId);
        }}
        onDelete={(questionId) => {
          setPreviewModalOpen(false);
          onDelete(questionId);
        }}
      />
    </>
  );
};

export default QuestionsTable;
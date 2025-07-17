// ============================================================================
// components/QuestionsTable.jsx - COMPLETE FIXED VERSION
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import { questionAPI } from '../../api/questionAPI';
import { toast } from 'react-hot-toast';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Quill from 'quill';
import ReactQuill from 'react-quill';

ReactQuill.Quill = Quill;

import 'react-quill/dist/quill.snow.css';
import QuestionPreviewModal from './QuestionPreviewModal';
import QuestionHistoryView from './QuestionHistoryModal';
import ReactModal from 'react-modal';
import QuestionCommentsModal from './preview/comments/QuestionCommentsModal';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import CreateMultipleChoiceQuestion from '../../features/questions/components/forms/CreateMultipleChoiceQuestion';
import CreateTrueFalseQuestion from '../../features/questions/components/forms/CreateTrueFalseQuestion';

// Simplified Tag Management Modal Component
const TagManagementModal = ({
  isOpen,
  onRequestClose,
  question,
  onTagsUpdated,
  setQuestions
}) => {
  const [allTags, setAllTags] = useState([]);
  const [questionTags, setQuestionTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [loadingTags, setLoadingTags] = useState(false);

  // Load all tags and question tags when modal opens
  useEffect(() => {
    if (isOpen && question) {
      loadAllTags();
      loadQuestionTags();
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

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/questions/tags`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name: newTagName })
      });
      const data = await res.json();
      if (data.success) {
        setNewTagName('');
        loadAllTags();
      }
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const addTagToQuestion = async (tag) => {
    if (!question) return;
    try {
      const res = await fetch(`${API_BASE_URL}/questions/bulk-tags`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ questionids: [question.id], tagids: [tag.id] })
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
      const res = await fetch(`${API_BASE_URL}/questions/bulk-tags`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ questionids: [question.id], tagids: [tag.id] })
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

  const filteredTags = allTags.filter(tag =>
    tag.name && tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const availableTags = filteredTags.filter(tag =>
    !questionTags.some(qt => qt.id === tag.id)
  );

  return (
    <Dialog open={isOpen} onClose={onRequestClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manage Tags</DialogTitle>
      <DialogContent>
        <Typography>
          Add or remove tags for this question.
        </Typography>
        <Box mt={2}>
          <Typography color="text.secondary" mb={1}>Current tags:</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
            {questionTags.map(tag => (
              <Box key={tag.id} sx={{ bgcolor: '#e0e7ff', px: 1.5, py: 0.5, borderRadius: 2, display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">{tag.name}</Typography>
                <Button size="small" color="error" sx={{ ml: 1 }} onClick={() => removeTagFromQuestion(tag)}>Remove</Button>
              </Box>
            ))}
            {questionTags.length === 0 && (
              <Typography variant="body2" color="text.secondary">No tags assigned.</Typography>
            )}
          </Stack>
          <Typography color="text.secondary" mb={1}>Add tag:</Typography>
          <Box display="flex" gap={1} mb={2}>
            <input
              type="text"
              placeholder="Search or create tag"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
            <Button variant="contained" onClick={handleCreateTag} disabled={!searchTerm.trim()}>Create</Button>
          </Box>
          <Box display="flex" gap={1} flexWrap="wrap">
            {availableTags.map(tag => (
              <Button key={tag.id} size="small" variant="outlined" onClick={() => addTagToQuestion(tag)}>
                {tag.name}
              </Button>
            ))}
            {availableTags.length === 0 && (
              <Typography variant="body2" color="text.secondary">No tags found.</Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onRequestClose}>Close</Button>
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
  showQuestionText = true,
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
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingSaveQuestionId, setPendingSaveQuestionId] = useState(null);
  const [pendingSaveTitle, setPendingSaveTitle] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalQuestion, setEditModalQuestion] = useState(null);
  const [editModalType, setEditModalType] = useState(null);
  const [editModalName, setEditModalName] = useState('');
  const [editModalText, setEditModalText] = useState('');
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

  const openEditModalByType = (question) => {
    if (!question) {
      console.error('No question provided to openEditModalByType');
      return;
    }
    setEditModalQuestion(question);
    setEditModalOpen(true);
    setEditModalType(question.qtype || question.questionType || 'multichoice');
  };

  const openCommentsModal = (question) => {
    if (!question) {
      console.error('No question provided to openCommentsModal');
      return;
    }
    setCommentsQuestion(question);
    setCommentsModalOpen(true);
  };

  const renderTags = (question) => {
    if (!question || !Array.isArray(question.tags) || question.tags.length === 0) {
      return <span className="italic text-gray-400 text-xs">Tags: None</span>;
    }

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {question.tags.map((tag) => {
          if (!tag || !tag.id) return null;
          
          return (
            <span
              key={tag.id}
              className="bg-sky-100 text-gray-800 text-xs px-2 py-1 rounded-full"
            >
              {tag.name || `Tag ${tag.id}`}
            </span>
          );
        }).filter(Boolean)}
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
        // Use modal instead of popup window for better cross-platform compatibility
        console.log('Opening preview URL in modal:', data.previewurl);
        setMoodlePreviewUrl(data.previewurl);
        setShowMoodlePreview(true);
        setMoodleFormLoading(true);
        toast.success('Moodle preview is loading...');
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
      console.log('Opening duplicate form URL:', data.duplicate_form_url);
      setMoodlePreviewUrl(data.duplicate_form_url);
      setShowMoodlePreview(true);
      setMoodleFormLoading(true);
      toast.success('Moodle duplicate form is loading...');
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
  window.open(editFormUrl, '_blank');
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
    // Step 1: Get preview URL (for returnurl)
    const previewRes = await fetch(`${API_BASE_URL}/questions/preview_moodle_question?questionid=${question.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    let returnUrl = encodeURIComponent(window.location.href); // fallback

    if (previewRes.ok) {
      const previewData = await previewRes.json();
      if (previewData.status && previewData.previewurl) {
        const questionIdMatch = previewData.previewurl.match(/[?&]id=(\d+)/);
        if (questionIdMatch) {
          const previewUrl = `${previewData.previewurl.split('/question/')[0]}/question/bank/previewquestion/preview.php?id=${questionIdMatch[1]}`;
          returnUrl = encodeURIComponent(previewUrl);
        } else {
          returnUrl = encodeURIComponent(previewData.previewurl);
        }
      }
    }

    // Step 2: Get edit form URL from backend
    const url = `${API_BASE_URL}/questions/full_edit_moodle_form?questionid=${question.id}&courseid=${courseId}&returnurl=${returnUrl}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();

    if (data.edit_form_url) {
      setMoodlePreviewUrl(data.edit_form_url);   // Set modal iframe src
      setShowMoodlePreview(true);                // Open modal
      toast.success('Moodle edit form is loading...');
    } else {
      toast.error(data.message || 'Failed to get edit form URL');
    }
  } catch (error) {
    console.error('Edit form error:', error);
    toast.error('Failed to fetch Moodle edit form. Please try again.');
  }
};


  const openEditModal = (question) => {
    if (!question) {
      console.error('No question provided to openEditModal');
      return;
    }
    setEditModalQuestion(question);
    setEditModalName(question.name || question.title || '');
    setEditModalText(question.questiontext || question.questionText || '');
    setEditModalOpen(true);
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
    console.log('Opening preview for question:', question);
    setPreviewQuestion(question);
    setPreviewModalOpen(true);
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
  };

  const handleBackFromHistory = () => {
    setShowHistoryView(false);
    setHistoryQuestion(null);
  };

  const handleEditModalSave = async () => {
    if (!editModalName.trim()) {
      toast.error('Question name cannot be empty');
      return;
    }

    if (!editModalQuestion) {
      toast.error('No question to save');
      return;
    }

    try {
      const userid = localStorage.getItem('userid');
      if (!userid) {
        toast.error('User session expired');
        return;
      }

      const result = await questionAPI.updateQuestionName(
        editModalQuestion.id,
        editModalName,
        editModalText,
        Number(userid)
      );

      if (result.status) {
        if (setQuestions) {
          setQuestions(prev => {
            if (!Array.isArray(prev)) return prev;
            
            return prev.map(q =>
              q.id === editModalQuestion.id
                ? {
                  ...q,
                  name: editModalName,
                  questiontext: editModalText,
                  questionText: editModalText,
                  modifiedBy: {
                    name: result.modifiedby?.name || q.modifiedBy?.name || '',
                    date: result.modifiedby?.date || q.modifiedBy?.date || '',
                  }
                }
                : q
            );
          });
        }
        toast.success(result.message || 'Question updated successfully');
        setEditModalOpen(false);
        setEditModalQuestion(null);
      } else {
        toast.error(result.message || 'Failed to update question');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(`Failed to update: ${error.message}`);
    }
  };

  const toggleQuestionSelection = (id) => {
    if (!setSelectedQuestions) return;
    
    setSelectedQuestions(prev => {
      if (!Array.isArray(prev)) return [id];
      
      return prev.includes(id)
        ? prev.filter(qId => qId !== id)
        : [...prev, id];
    });
  };

  const handleSelectAll = (e) => {
    if (!setSelectedQuestions || !Array.isArray(filteredQuestions)) return;
    
    if (e.target.checked) {
      setSelectedQuestions(filteredQuestions.map(q => q.id).filter(Boolean));
    } else {
      setSelectedQuestions([]);
    }
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

      const result = await questionAPI.updateQuestionName(
        questionId,
        newQuestionTitle,
        question.questiontext || '',
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
          overlay: { zIndex: 1000 },
          content: {
            maxWidth: '90%',
            height: '90%',
            margin: 'auto',
            padding: 0,
            overflow: 'hidden',
            borderRadius: '12px'
          }
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">
              {moodlePreviewUrl.includes('editquestion') ? 'Edit in Real Moodle' : 
               moodlePreviewUrl.includes('duplicate') ? 'Duplicate in Moodle' : 
               moodlePreviewUrl.includes('preview') ? 'Preview in Moodle' :
               'Moodle Form'}
            </h3>
            <button 
              onClick={() => {
                setShowMoodlePreview(false);
                setMoodlePreviewUrl('');
                setMoodleFormLoading(false);
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              &times;
            </button>
          </div>
          
          {/* Loading overlay */}
          {moodleFormLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading Moodle form...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a moment due to server processing</p>
              </div>
            </div>
          )}
          
          <iframe
            src={moodlePreviewUrl}
            style={{ flexGrow: 1, border: 'none' }}
            width="100%"
            height="100%"
            title="Moodle Form"
            onLoad={(e) => {
              // Form has loaded successfully
              console.log('Moodle form loaded successfully');
              setMoodleFormLoading(false);
            }}
            onError={(e) => {
              console.error('Moodle form failed to load:', e);
              setMoodleFormLoading(false);
              toast.error('Failed to load Moodle form. Please try again.');
            }}
          />
        </div>
      </ReactModal>

      <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
        {questions.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="text-center">
              <i className="fas fa-question-circle text-4xl mb-4 text-gray-300"></i>
              <p className="text-lg">No questions found.</p>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-12" scope="col">
                    <div className="flex items-center justify-center">
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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="qbheadercheckbox" className="sr-only">Select all</label>
                    </div>
                  </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 min-w-[300px]" scope="col">
                  <div className="font-semibold">Question</div>
                  <div className="mt-1 space-x-1">
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by Question name ascending">Question name</a>
                    <span className="text-gray-400">/</span>
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by ID number ascending">ID number</a>
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-24" scope="col">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-20" scope="col">Comments</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-20" scope="col">Version</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-20" scope="col">Usage</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-24" scope="col">Last used</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 min-w-[140px]" scope="col">
                  <div className="font-semibold">Created by</div>
                  <div className="mt-1 space-x-1">
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by First name ascending">First name</a>
                    <span className="text-gray-400">/</span>
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by Last name ascending">Last name</a>
                    <span className="text-gray-400">/</span>
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by Date ascending">Date</a>
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 min-w-[140px]" scope="col">
                  <div className="font-semibold">Modified by</div>
                  <div className="mt-1 space-x-1">
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by First name ascending">First name</a>
                    <span className="text-gray-400">/</span>
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by Last name ascending">Last name</a>
                    <span className="text-gray-400">/</span>
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by Date ascending">Date</a>
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-16" scope="col">
                  <div>
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by Question type descending">
                      T<i className="fa fa-sort-asc fa-fw ml-1 text-gray-500" title="Ascending" role="img" aria-label="Ascending"></i>
                    </a>
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-20" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {questions.map((question, index) => {
                if (!question || !question.id) {
                  console.warn('Invalid question at index:', index);
                  return null;
                }

                return (
                  <tr key={question.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <input
                        id={`checkq${question.id}`}
                        name={`q${question.id}`}
                        type="checkbox"
                        value="1"
                        checked={Array.isArray(selectedQuestions) && selectedQuestions.includes(question.id)}
                        onChange={() => toggleQuestionSelection(question.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`checkq${question.id}`} className="sr-only">Select</label>
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex flex-col items-start w-full">
                        <div className="w-full mb-2">
                          <label htmlFor={`checkq${question.id}`} className="block">
                            {editingQuestion === question.id ? (
                              <input
                                type="text"
                                value={newQuestionTitle}
                                onChange={(e) => setNewQuestionTitle(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                autoFocus
                                onBlur={() => {
                                  setPendingSaveQuestionId(question.id);
                                  setPendingSaveTitle(newQuestionTitle);
                                  setShowSaveModal(true);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setPendingSaveQuestionId(question.id);
                                    setPendingSaveTitle(newQuestionTitle);
                                    setShowSaveModal(true);
                                  }
                                  if (e.key === 'Escape') setEditingQuestion(null);
                                }}
                              />
                            ) : (
                              <span
                                className="inline-flex items-center group cursor-pointer"
                                onClick={() => openEditModal(question)}
                              >
                                <span className="ml-2 text-black hover:text-blue-700 flex items-center" style={{ fontFamily: "'Noto Sans Khmer', Arial, sans-serif" }}>
                                  {question.name || question.title || '(No title)'}
                                  <span className="ml-2">
                                    <i className="fa-regular fa-pen-to-square text-gray-400"></i>
                                  </span>
                                </span>
                              </span>
                            )}
                          </label>
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

                    <td className="px-3 py-4 whitespace-nowrap w-32 min-w-[110px]">
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
                    <td className="px-3 py-4 whitespace-nowrap">
                      <button
                        className="text-blue-600 hover:text-blue-900 underline"
                        onClick={() => openCommentsModal(question)}
                      >
                        {question.comments || 0}
                      </button>
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{question.version || 'v1'}</td>

                    <td className="px-3 py-4 whitespace-nowrap">
                      <a href="#" className="text-blue-600 hover:text-blue-900">
                        {question.usage || 0}
                      </a>
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{question.lastUsed || 'Never'}</span>
                    </td>

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

                    <td className="px-3 py-4 whitespace-nowrap">
                      {getQuestionTypeIcon(question.qtype || question.questionType, question)}
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap">
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
                                className="text-blue-600 hover:text-blue-900 focus:outline-none"
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
                                    maxHeight: 350,
                                    overflowY: 'auto',
                                    ...(dropdownDirection[question.id] === 'up' ? { bottom: '100%' } : { top: '100%' })
                                  }}
                                >
                                  <a
                                    href="#"
                                    className={`flex items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-900 transition-colors ${loadingMoodlePreview ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      if (!loadingMoodlePreview) {
                                        await handlePreviewMoodle(question);
                                        setOpenActionDropdown(null);
                                      }
                                    }}
                                  >
                                    <i className={`fa ${loadingMoodlePreview ? 'fa-spinner fa-spin' : 'fa-eye'} w-4 text-center mr-2 text-blue-500`}></i>
                                    <span>{loadingMoodlePreview ? 'Loading...' : 'Preview Moodle'}</span>
                                  </a>
                                  {/* <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      await handleEditMoodle(question);
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className="fa fa-edit w-4 text-center mr-2 text-blue-500"></i>
                                    <span>Edit in Moodle</span>
                                  </a> */}
                                  <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 hover:text-green-900 transition-colors"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      await handleDuplicateMoodle(question);
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className="fa fa-copy w-4 text-center mr-2 text-green-500"></i>
                                    <span>Duplicate in Moodle</span>
                                  </a>
                                  <a
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
                              </a>

                                  <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      openEditModalByType(question);
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className="fa fa-cog w-4 text-center mr-2 text-gray-500"></i>
                                    <span>Edit question</span>
                                  </a>
                                  <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
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
                                  </a>
                                  <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      openTagModal(question);
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className="fa fa-tags w-4 text-center mr-2 text-gray-500"></i>
                                    <span>Manage tags</span>
                                  </a>
                                  <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handlePreview(question);
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className="fa fa-search w-4 text-center mr-2 text-gray-500"></i>
                                    <span>Preview</span>
                                  </a>
                                  <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleHistory(question);
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className="fa fa-list w-4 text-center mr-2 text-gray-500"></i>
                                    <span>History</span>
                                  </a>
                                  <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      onDelete(question.id);
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className="fa fa-trash w-4 text-center mr-2 text-red-500"></i>
                                    <span>Delete</span>
                                  </a>
                                  <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setOpenActionDropdown(null);
                                    }}
                                  >
                                    <i className="fa fa-download w-4 text-center mr-2 text-gray-500"></i>
                                    <span>Export as Moodle XML</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }).filter(Boolean)}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Save confirmation modal */}
      {showSaveModal && pendingSaveQuestionId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 rounded shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="font-bold text-lg mb-2">Save Changes?</h3>
            <p className="mb-4">
              Do you want to save the new question name:
              <span className="font-semibold text-blue-700"> "{pendingSaveTitle}"</span>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => {
                  setShowSaveModal(false);
                  setEditingQuestion(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-sky-600 text-white hover:bg-sky-700"
                onClick={async () => {
                  await initiateQuestionSave(pendingSaveQuestionId);
                  setShowSaveModal(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      <ReactModal
        isOpen={editModalOpen}
        onRequestClose={() => setEditModalOpen(false)}
        contentLabel="Edit Question"
        style={{
          overlay: { zIndex: 1000 },
          content: {
            maxWidth: 1000,
            margin: 'auto',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '32px',
            borderRadius: '20px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          }
        }}
      >
        {editModalOpen && editModalQuestion && (
          <>
            {editModalType === 'multichoice' && (
              <CreateMultipleChoiceQuestion
                question={editModalQuestion}
                onClose={() => setEditModalOpen(false)}
                onSave={(updatedQuestion) => {
                  setEditModalOpen(false);
                }}
              />
            )}
            {editModalType === 'truefalse' && (
              <CreateTrueFalseQuestion
                existingQuestion={editModalQuestion}
                onClose={() => setEditModalOpen(false)}
                onSave={(updatedQuestion) => {
                  setEditModalOpen(false);
                }}
              />
            )}
            {(!editModalType || (editModalType !== 'multichoice' && editModalType !== 'truefalse')) && (
              <>
                <h3 className="text-xl font-bold mb-6">Edit Question</h3>
                <form className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Question Name</label>
                    <input
                      type="text"
                      value={editModalName}
                      onChange={e => setEditModalName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Question Text</label>
                    <ReactQuill
                      value={editModalText}
                      onChange={setEditModalText}
                      theme="snow"
                      style={{ minHeight: '280px' }}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                      onClick={() => setEditModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-sky-600 text-white hover:bg-sky-700"
                      onClick={handleEditModalSave}
                    >
                      Save
                    </button>
                  </div>
                </form>
              </>
            )}
          </>
        )}
      </ReactModal>

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
          openEditModal(question);
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
// ============================================================================
// components/QuestionsTable.jsx - ENHANCED: Tag Management Modal
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
// import QuestionPreviewFilter from './preview/QuestionPreviewFilter';
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
      // handle error
    }
  };
//add ad delete tags for place manage tag in questions table
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
      }
    } catch (error) {}
    ToastRoot.error(`Failed to add tag "${tag.name}" to question.`);
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
    toast.error(`Failed to remove tag "${tag.name}" from question.`);
  }
};

  const filteredTags = allTags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
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
  questions,
  allQuestions,
  filteredQuestions,
  selectedQuestions,
  setSelectedQuestions,
  showQuestionText,
  editingQuestion,
  setEditingQuestion,
  newQuestionTitle,
  setNewQuestionTitle,
  setShowSaveConfirm,
  openActionDropdown,
  setOpenActionDropdown,
  openStatusDropdown,
  setOpenStatusDropdown,
  dropdownRefs,
  onPreview,
  onEdit,
  onDuplicate,
  onHistory,
  onDelete,
  onStatusChange,
  setQType,
  username,
  setQuestions,
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingSaveQuestionId, setPendingSaveQuestionId] = useState(null);
  const [pendingSaveTitle, setPendingSaveTitle] = useState('');
  //edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalQuestion, setEditModalQuestion] = useState(null);
  const [editModalType, setEditModalType] = useState(null);
  const [editModalName, setEditModalName] = useState('');
  const [editModalText, setEditModalText] = useState('');
  
const [dropdownDirection, setDropdownDirection] = useState({});
 //preview  direct to real moodle
 const [showMoodlePreview, setShowMoodlePreview] = useState(false);
const [moodlePreviewUrl, setMoodlePreviewUrl] = useState('');
const [loadingMoodlePreview, setLoadingMoodlePreview] = useState(false);
  
  // Tag management modal state
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagModalQuestion, setTagModalQuestion] = useState(null);

  // CRITICAL FIX: Track fetched questions to prevent infinite loops
  const fetchedQuestionsRef = useRef(new Set());
  const isFetchingRef = useRef(false);

  // Preview question 
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);

  // History view state
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [historyQuestion, setHistoryQuestion] = useState(null);
const [commentsModalOpen, setCommentsModalOpen] = useState(false);
const [commentsQuestion, setCommentsQuestion] = useState(null);


///get tyep icon 
const [qtypeIcons, setQtypeIcons] = useState({});
useEffect(() => {
  async function fetchQtypeIcons() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/questions/qtypes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      const iconMap = {};
      data.forEach(qt => {
        iconMap[qt.name] = qt;
      });
      setQtypeIcons(iconMap);
    } catch (e) {
      setQtypeIcons({});
    }
  }
  fetchQtypeIcons();
}, []);


const openEditModalByType = (question) => {
  setEditModalQuestion(question);
  setEditModalOpen(true);
  setEditModalType(question.qtype); // or question.questionType
};
const openCommentsModal = (question) => {
  setCommentsQuestion(question);
  setCommentsModalOpen(true);
};
  // FIXED: Enhanced tag rendering with REAL API data
const renderTags = (question) => {
  if (!Array.isArray(question.tags) || question.tags.length === 0) {
    return <span className="italic text-gray-400 text-xs">Tags: None</span>;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {question.tags.map((tag) => (
        <span
          key={tag.id}
          className="bg-sky-100 text-gray-800 text-xs px-2 py-1 rounded-full"
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
};


  // CRITICAL FIX: Smart tag fetching - only fetch once per question
  useEffect(() => {
    if (!questions || questions.length === 0 || isFetchingRef.current) return;
    
    // Find questions that need tags fetched
    const questionsNeedingTags = questions.filter(q => {
      // Skip if already fetched
      if (fetchedQuestionsRef.current.has(q.id)) {
        return false;
      }
      
      // Check if tags need to be fetched (empty or not an array)
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

        // Process questions in smaller batches to avoid overwhelming the API
        const batchSize = 3;
        let updatedQuestions = {};

        for (let i = 0; i < questionsNeedingTags.length; i += batchSize) {
          const batch = questionsNeedingTags.slice(i, i + batchSize);
          
          console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(questionsNeedingTags.length/batchSize)}`);
          
          // Fetch tags for each question in the batch
          const batchPromises = batch.map(async (question) => {
            try {
              // Use your exact API endpoint format
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

              // Extract tags from your API response format: { questionid: 0, tags: [] }
              const tags = Array.isArray(data.tags) ? data.tags : [];
              
              return { questionId: question.id, tags };
            } catch (error) {
              console.error(`Error fetching tags for question ${question.id}:`, error);
              return { questionId: question.id, tags: [] };
            }
          });

          // Wait for the batch to complete
          const batchResults = await Promise.allSettled(batchPromises);
          
          // Process results
          batchResults.forEach((result) => {
            if (result.status === 'fulfilled') {
              const { questionId, tags } = result.value;
              updatedQuestions[questionId] = tags;
              fetchedQuestionsRef.current.add(questionId);
            }
          });

          // Small delay between batches to be respectful to the API
          if (i + batchSize < questionsNeedingTags.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        // Update questions state with fetched tags
        if (Object.keys(updatedQuestions).length > 0) {
          setQuestions(prev => {
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
        // Mark all questions as fetched to prevent retry loops
        questionsNeedingTags.forEach(q => {
          fetchedQuestionsRef.current.add(q.id);
        });
      } finally {
        isFetchingRef.current = false;
      }
    }

    fetchTagsForQuestions();
  }, [questions?.length, setQuestions]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openActionDropdown && dropdownRefs.current[openActionDropdown]) {
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

  // Get question type icon
  // const getQuestionTypeIcon = (qtype, question) => {
  //   if (!question) {
  //     return <span className="w-6 h-6 inline-block">•</span>;
  //   }
    
  //   const normalizedType = qtype || question.questionType || question.qtype;
    
  //   switch (normalizedType) {
  //     case 'calculated':
  //       return <img src="/src/assets/icon/Calculated.svg" className="w-6 h-6" alt="Calculated" />;
  //     case 'calculatedmulti':
  //       return <img src="/src/assets/icon/Calculated-multichoice.svg" className="w-6 h-6" alt="Calculated multichoice" />;
  //     case 'calculatedsimple':
  //       return <img src="/src/assets/icon/Calculated simple.svg" className="w-6 h-6" alt="Calculated simple" />;
  //     case 'ddimageortext':
  //       return <img src="/src/assets/icon/Drag and drop onto image.svg" className="w-6 h-6" alt="Drag and drop onto image" />;
  //     case 'ddmarker':
  //       return <img src="/src/assets/icon/Drag and drop markers.svg" className="w-6 h-6" alt="Drag and Drop Markers" />;
  //     case 'ddwtos':
  //       return <img src="/src/assets/icon/Drag and drop into text.svg" className="w-6 h-6" alt="Drag and drop into text" />;
  //     case 'description':
  //       return <img src="/src/assets/icon/Description.svg" className="w-6 h-6" alt="Description" />;
  //     case 'essay':
  //       return <img src="/src/assets/icon/Essay.svg" className="w-6 h-6" alt="Essay" />;
  //     case 'gapselect':
  //       return <img src="/src/assets/icon/Select-missing words.svg" className="w-6 h-6" alt="Select missing words" />;
  //     case 'match':
  //       return <img src="/src/assets/icon/Matching.svg" className="w-6 h-6" alt="Matching" />;
  //     case'multianswer':
  //       return <img src="/src/assets/icon/Embedded answers (Cloze).svg" className="w-6 h-6" alt="Embedded answers (Cloze)" />;
  //     case 'multichoice':
  //       return <img src="/src/assets/icon/Multiple-choice.svg" className="w-6 h-6" alt="Multiple Choice" />;
  //     case'numerical':
  //       return <img src="/src/assets/icon/Numerical.svg" className="w-6 h-6" alt="Numerical" />;
  //     case'ordering':
  //       return <img src="/src/assets/icon/Ordering.svg" className="w-6 h-6" alt="Ordering" />;
     
  //     case 'randomsamatch':
  //       return <img src="/src/assets/icon/Random short-answer matching.svg" className="w-6 h-6" alt="Random Short Answer Matching" />;
  //     case 'shortanswer':
  //       return <img src="/src/assets/icon/Short-answer.svg" className="w-6 h-6" alt="Short Answer" />;
  //     case 'truefalse':
  //       return <img src="/src/assets/icon/True-False.svg" className="w-6 h-6" alt="True/False" />;
  //     default:
  //       return <span className="icon text-gray-400">?</span>;
  //   }
  // };
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
        />
      );
    }
    return <span className="icon text-gray-400">?</span>;
  };
///real moodle preview directly 
const handlePreviewMoodle = async (question) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/questions/preview_moodle_question?questionid=${question.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    const data = await res.json();
    if (data.status && data.previewurl) {
      //  Option 1: New tab (best for user experience)
      window.open(data.previewurl, "_blank", "width=800,height=600");

      // OR
      // window.open(data.previewurl, '_blank', 'noopener,noreferrer');
      //  Option 2: Same tab (replaces your app)
      //  window.location.href = data.previewurl;
    } else {
      toast.error(data.message || 'Failed to get preview URL');
    }
  } catch (error) {
    toast.error('Failed to fetch Moodle preview');
  }
};
const handleEditMoodle = async (question) => {
  const token = localStorage.getItem('token');
  
  let courseId = localStorage.getItem('CourseID') || 
                 localStorage.getItem('courseid') || 
                 localStorage.getItem('courseId');
  
  if (courseId) {
    courseId = parseInt(courseId, 10);
  }

  console.log(' Token:', token);
  console.log(' Course ID:', courseId);
  console.log('Question:', question);

  if (!token) {
    toast.error('Missing authentication token');
    return;
  }
  
  if (!courseId || isNaN(courseId)) {
    toast.error('Missing or invalid course ID. Please select a course first.');
    return;
  }
  
  if (!question?.id) {
    toast.error('Missing question ID');
    return;
  }

  try {
    const returnUrl = encodeURIComponent('/');
    const url = `${API_BASE_URL}/questions/full_edit_moodle_form?questionid=${question.id}&courseid=${courseId}&returnurl=${returnUrl}`;
    
    console.log(' Edit form URL:', url);
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();
    console.log(' Edit form response:', data);
    
    if (data.edit_form_url) {
      // FIXED: Open in new tab instead of iframe
      window.open(data.edit_form_url, '_blank', 'noopener,noreferrer');
      toast.success('Opening Moodle edit form in new tab...');
    } else {
      toast.error(data.message || 'Failed to get edit form URL');
      console.error('API Error:', data);
    }
  } catch (error) {
    toast.error('Failed to fetch Moodle edit form');
    console.error('Fetch error:', error);
  }
};

// ALTERNATIVE: If you want to also check the current filters
// const handleEditMoodleWithFilters = async (question) => {
//   const token = localStorage.getItem('token');
  
//   // Try to get course ID from multiple sources
//   let courseId = localStorage.getItem('CourseID') || 
//                  localStorage.getItem('courseid') || 
//                  localStorage.getItem('courseId') ||
//                  filters?.courseId; // From your current filters state
  
//   if (courseId) {
//     courseId = parseInt(courseId, 10);
//   }

//   console.log('🧪 Token:', token);
//   console.log('🧪 Course ID:', courseId);
//   console.log('🧪 Question:', question);
//   console.log('🧪 Filters courseId:', filters?.courseId);

//   if (!token) {
//     toast.error('Missing authentication token');
//     return;
//   }
  
//   if (!courseId || isNaN(courseId)) {
//     toast.error('Please select a course first before editing questions.');
//     return;
//   }
  
//   if (!question?.id) {
//     toast.error('Missing question ID');
//     return;
//   }

//   try {
//     const returnUrl = encodeURIComponent('/');
//     const url = `${API_BASE_URL}/questions/full_edit_moodle_form?questionid=${question.id}&courseid=${courseId}&returnurl=${returnUrl}`;
    
//     console.log('🌐 Edit form URL:', url);
    
//     const res = await fetch(url, {
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Accept': 'application/json'
//       }
//     });

//     if (!res.ok) {
//       throw new Error(`HTTP ${res.status}: ${res.statusText}`);
//     }

//     const data = await res.json();
//     console.log('📝 Edit form response:', data);
    
//     if (data.edit_form_url) {
//       setMoodlePreviewUrl(data.edit_form_url);
//       setShowMoodlePreview(true);
//       toast.success('Opening Moodle edit form...');
//     } else {
//       toast.error(data.message || 'Failed to get edit form URL');
//       console.error('API Error:', data);
//     }
//   } catch (error) {
//     toast.error(`Failed to fetch Moodle edit form: ${error.message}`);
//     console.error('Fetch error:', error);
//   }
// };



  // Open modal when clicking question name
  const openEditModal = (question) => {
    setEditModalQuestion(question);
    setEditModalName(question.name || question.title || '');
    setEditModalText(question.questiontext || question.questionText || '');
    setEditModalOpen(true);
  };

  // Open tag management modal
  const openTagModal = (question) => {
    setTagModalQuestion(question);
    setTagModalOpen(true);
  };

  // Handle preview question 
  const handlePreview = (question) => {
    console.log('Opening preview for question:', question);
    setPreviewQuestion(question);
    setPreviewModalOpen(true);
  };

  // Handle history question
  // const handleHistory = (question) => {
  //   console.log('Opening history for question:', question);
  //   setHistoryQuestion(question);
  //   setShowHistoryView(true);
  // };
const handleHistory = (question) => {
  const questionWithQbankEntry = {
    ...question,
    qbankentryid: question.qbankentryid || question.qbank_entry_id || question.entryid, // pick available one
  };

  console.log("Opening history for question:", questionWithQbankEntry);

  setHistoryQuestion(questionWithQbankEntry);
  setShowHistoryView(true);
};


  // Handle back from history view
  const handleBackFromHistory = () => {
    setShowHistoryView(false);
    setHistoryQuestion(null);
  };

  const handleEditModalSave = async () => {
    if (!editModalName.trim()) {
      toast.error('Question name cannot be empty');
      return;
    }
    try {
      const userid = localStorage.getItem('userid');
      const result = await questionAPI.updateQuestionName(
        editModalQuestion.id,
        editModalName,
        editModalText,
        Number(userid)
      );
      if (result.status) {
        setQuestions(prev =>
          prev.map(q =>
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
          )
        );
        toast.success(result.message || 'Question updated successfully');
        setEditModalOpen(false);
        setEditModalQuestion(null);
      } else {
        toast.error(result.message || 'Failed to update question');
      }
    } catch (error) {
      toast.error(`Failed to update: ${error.message}`);
    }
  };

  // Toggle question selection
  const toggleQuestionSelection = (id) => {
    setSelectedQuestions(prev => 
      prev.includes(id) 
        ? prev.filter(qId => qId !== id) 
        : [...prev, id]
    );
  };

  // Handle select all
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedQuestions(filteredQuestions.map(q => q.id));
    } else {
      setSelectedQuestions([]);
    }
  };

  // Initiate question save
  const initiateQuestionSave = async (questionId) => {
    if (newQuestionTitle.trim() === '') {
      alert('Question title cannot be empty');
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
      if (!question) return;

      // Use the updated API method
      const result = await questionAPI.updateQuestionName(
        questionId,
        newQuestionTitle,
        question.questiontext || '',
        Number(userid)
      );

      if (result.status) {
        setQuestions(prev => 
          prev.map(q => 
            q.id === questionId
              ? { ...q, name: newQuestionTitle, modifiedBy: result.modifiedby }
              : q
          )
        );
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

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No questions found.</p>
      </div>
    );
  }

  // Show history view instead of questions table
  if (showHistoryView && historyQuestion) {
    return (
      <QuestionHistoryView
        question={historyQuestion}
        onBack={handleBackFromHistory}
        onPreview={(version) => {
          // Handle preview of specific version
          console.log('Preview version:', version);
          setShowHistoryView(false);
          setPreviewQuestion(version);
          setPreviewModalOpen(true);
        }}
        onRevert={(version) => {
          // Handle revert to specific version
          console.log('Revert to version:', version);
          toast.success(`Reverted to version ${version.version}`);
          setShowHistoryView(false);
          // You can add API call here to revert to the selected version
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
  }}
  contentLabel="Edit in Real Moodle"
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
        {moodlePreviewUrl.includes('editquestion') ? 'Edit in Real Moodle' : 'Preview in Real Moodle'}
      </h3>
      <button onClick={() => setShowMoodlePreview(false)}>&times;</button>
    </div>

    <iframe
      src={moodlePreviewUrl}
      style={{ flexGrow: 1, border: 'none' }}
      width="100%"
      height="100%"
      title="Moodle Edit Form"
    />
  </div>
</ReactModal>

      <div
        // className="overflow-x-auto"
        // style={{ minHeight: '300px', height: 'unset', maxHeight: 'unset', overflowY: 'auto' }}
      >
        {questions.length === 0 ? (
          <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            No questions found.
          </div>
        ) : (
          <table id="categoryquestions" className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
                  <span title="Select questions for bulk actions">
                    <input 
                      id="qbheadercheckbox" 
                      name="qbheadercheckbox" 
                      type="checkbox"  
                      value="1"
                      data-action="toggle"
                      data-toggle="master"
                      data-togglegroup="qbank"
                      data-toggle-selectall="Select all"
                      data-toggle-deselectall="Deselect all"
                      onChange={handleSelectAll}
                      checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="qbheadercheckbox" className="sr-only">Select all</label>
                  </span>
                </th>
                <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
                  <div className="font-semibold">Question</div>
                  <div className="mt-1 space-x-1">
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by Question name ascending">Question name</a>
                    <span className="text-gray-400">/</span>
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by ID number ascending">ID number</a>
                  </div>
                </th>
                <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">Status</th>
                <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">Comments</th>
                <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">Version</th>
                <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">Usage</th>
                <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">Last used</th>
                <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
                  <div className="font-semibold">Created by</div>
                  <div className="mt-1 space-x-1">
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by First name ascending">First name</a>
                    <span className="text-gray-400">/</span>
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by Last name ascending">Last name</a>
                    <span className="text-gray-400">/</span>
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by Date ascending">Date</a>
                  </div>
                </th>
                <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
                  <div className="font-semibold">Modified by</div>
                  <div className="mt-1 space-x-1">
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by First name ascending">First name</a>
                    <span className="text-gray-400">/</span>
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by Last name ascending">Last name</a>
                    <span className="text-gray-400">/</span>
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by Date ascending">Date</a>
                  </div>
                </th>
                <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
                  <div>
                    <a href="#" className="text-gray-700 hover:text-gray-900 no-underline focus:outline-none focus:text-gray-900" title="Sort by Question type descending">
                      T<i className="fa fa-sort-asc fa-fw ml-1 text-gray-500" title="Ascending" role="img" aria-label="Ascending"></i>
                    </a>
                  </div>
                </th>
                <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {questions.map((question, index) => (
                <tr key={question.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input 
                      id={`checkq${question.id}`}
                      name={`q${question.id}`}
                      type="checkbox"  
                      value="1"
                      data-action="toggle"
                      data-toggle="slave"
                      data-togglegroup="qbank"
                      checked={selectedQuestions.includes(question.id)}
                      onChange={() => toggleQuestionSelection(question.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`checkq${question.id}`} className="sr-only">Select</label>
                  </td>
                  
                  {/* Question text and tags */}
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
                              <span className="ml-2 text-black font-semibold hover:text-blue-700 flex items-center">
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
                      {/* Render question text as HTML if present */}
                      {question.questiontext && (
                        <div className="text-xs text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: question.questiontext }} />
                      )}
                      {/* FIXED: Tags Rendering Section */}
                      <div className="w-full">
                        {renderTags(question)}
                      </div>
                    </div>
                  </td>
                  
                  {/* Status Column */}
                  <td className="px-3 py-4 whitespace-nowrap w-32 min-w-[110px]">
                    <div className="relative" data-status-dropdown={question.id}>
                      <select
                        id={`question_status_dropdown-${question.id}`}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8"
                        name="question_status_dropdown"
                        value={question.status}
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
                      {question.comments?.length || 0} 
                    </button>
                  </td>
                  
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{question.version}</td>
                  
                  <td className="px-3 py-4 whitespace-nowrap">
                    <a href="#" className="text-blue-600 hover:text-blue-900" data-target={`questionusagepreview_${question.id}`} data-questionid={question.id} data-courseid="985">
                      {question.usage || 0}
                    </a>
                  </td>
                  
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{question.lastUsed}</span>
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
                    <div className="relative" data-enhance="moodle-core-actionmenu">
                      <div className="flex">
                        <div className="relative" ref={el => dropdownRefs.current[question.id] = el}>
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
                                const el = dropdownRefs.current[question.id];
                                if (el) {
                                  const rect = el.getBoundingClientRect();
                                  const dropdownHeight = 350; // Approximate height of your dropdown
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
                                  className="flex items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                                  role="menuitem"
                                  tabIndex="-1"
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    await handlePreviewMoodle(question);
                                    setOpenActionDropdown(null);
                                  }}
                                >
                                  <i className="fa fa-eye w-4 text-center mr-2 text-blue-500"></i>
                                  <span>Preview Moodle</span>
                                </a>
                                <a
                                  href="#"
                                  className="flex items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                                  role="menuitem"
                                  tabIndex="-1"
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    await handleEditMoodle(question);  // This will load Moodle's edit form into the modal iframe
                                    setOpenActionDropdown(null);       // Close the dropdown menu
                                  }}
                                >
                                  <i className="fa fa-edit w-4 text-center mr-2 text-blue-500"></i>
                                  <span>Edit in Moodle</span>
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
              ))}
            </tbody>
          </table>
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
                  // Optionally update questions state here
                }}
              />
            )}
            {editModalType === 'truefalse' && (
              <CreateTrueFalseQuestion
                existingQuestion={editModalQuestion}
                onClose={() => setEditModalOpen(false)}
                onSave={(updatedQuestion) => {
                  setEditModalOpen(false);
                  // Optionally update questions state here
                }}
              />
            )}
            {/* Add more types as needed */}
          </>
        )}
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
          // Update the question in the questions list
          setQuestions(prev => 
            prev.map(q => 
              q.id === tagModalQuestion.id 
                ? { ...q, tags: updatedTags }
                : q
            )
          );
        }}
        setQuestions={setQuestions}
      />
            {commentsModalOpen && commentsQuestion && (
        <QuestionCommentsModal
          isOpen={commentsModalOpen}
          onRequestClose={() => setCommentsModalOpen(false)}
          question={commentsQuestion}
          setQuestions={setQuestions}
        />
      )}

      {/* Question Preview Modal */}
      {/* <QuestionPreviewModal
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
      /> */}
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
          // Handle edit action
          console.log(' Edit question:', question);
        }}
        onDuplicate={(questionId) => {
          setPreviewModalOpen(false);
          // Handle duplicate action
          console.log(' Duplicate question:', questionId);
        }}
        onDelete={(questionId) => {
          setPreviewModalOpen(false);
          // Handle delete action
          console.log(' Delete question:', questionId);
        }}
      />
            {/* <QuestionPreviewFilter
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
      /> */}
    </>
  );
};

export default QuestionsTable;
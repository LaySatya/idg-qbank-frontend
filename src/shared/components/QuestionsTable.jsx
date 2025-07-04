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
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import QuestionPreviewModal from './QuestionPreviewModal';
import QuestionHistoryView from './QuestionHistoryModal';
import ReactModal from 'react-modal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
      }
    } catch (error) {}
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
      }
    } catch (error) {}
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalQuestion, setEditModalQuestion] = useState(null);
  const [editModalName, setEditModalName] = useState('');
  const [editModalText, setEditModalText] = useState('');
  
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

  // FIXED: Enhanced tag rendering with REAL API data
  const renderTags = (question) => {
    // Get tags from the question object - your API returns tags in the 'tags' property
    const questionTags = question.tags || [];
    
    // If no tags, show standard Moodle empty state
    if (!questionTags || questionTags.length === 0) {
      return (
        <div className="text-xs text-gray-400 italic">
          <span className="text-gray-500">Tags: </span>
          <span>None</span>
        </div>
      );
    }

    // Normalize tags to handle both string and object formats
    const normalizedTags = questionTags.map((tag, index) => {
      if (typeof tag === 'string') {
        return {
          id: `string-${index}`,
          name: tag.trim(),
          displayName: tag.trim()
        };
      } else if (tag && typeof tag === 'object') {
        return {
          id: tag.id || tag.tagid || `obj-${index}`,
          name: tag.name || tag.rawname || tag.displayname || `Tag ${index}`,
          displayName: tag.rawname || tag.name || tag.displayname || `Tag ${index}`,
          description: tag.description || '',
          isStandard: Boolean(tag.isstandard)
        };
      }
      return null;
    }).filter(Boolean);

    // Moodle typically shows all tags, but we can limit for UI space
    const maxVisibleTags = 5;
    const visibleTags = normalizedTags.slice(0, maxVisibleTags);
    const hiddenTagsCount = Math.max(0, normalizedTags.length - maxVisibleTags);

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#4B5563', marginRight: '0.25rem' }}>Tags:</span>
        {visibleTags.map((tag) => (
          <span
            key={`tag-${question.id}-${tag.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.125rem 0.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              backgroundColor: '#0ea5e9', // sky-400
              color: '#fff',
              transition: 'background 0.2s',
            }}
            title={tag.description || `Tag: ${tag.displayName}`}
          >
            {tag.displayName}
          </span>
        ))}
        {hiddenTagsCount > 0 && (
          <span 
            style={{ fontSize: '0.75rem', fontWeight: 500, color: '#2563eb', cursor: 'pointer' }}
            title={`${hiddenTagsCount} more tags`}
          >
            +{hiddenTagsCount} more
          </span>
        )}
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
  const getQuestionTypeIcon = (qtype, question) => {
    if (!question) {
      return <span className="w-6 h-6 inline-block">•</span>;
    }
    
    const normalizedType = qtype || question.questionType || question.qtype;
    
    switch (normalizedType) {
      case 'calculated':
        return <img src="/src/assets/icon/Calculated.svg" className="w-6 h-6" alt="Calculated" />;
      case 'calculatedmulti':
        return <img src="/src/assets/icon/Calculated-multichoice.svg" className="w-6 h-6" alt="Calculated multichoice" />;
      case 'calculatedsimple':
        return <img src="/src/assets/icon/Calculated simple.svg" className="w-6 h-6" alt="Calculated simple" />;
      case 'ddimageortext':
        return <img src="/src/assets/icon/Drag and drop onto image.svg" className="w-6 h-6" alt="Drag and drop onto image" />;
      case 'ddmarker':
        return <img src="/src/assets/icon/Drag and drop markers.svg" className="w-6 h-6" alt="Drag and Drop Markers" />;
      case 'ddwtos':
        return <img src="/src/assets/icon/Drag and drop into text.svg" className="w-6 h-6" alt="Drag and drop into text" />;
      case 'description':
        return <img src="/src/assets/icon/Description.svg" className="w-6 h-6" alt="Description" />;
      case 'essay':
        return <img src="/src/assets/icon/Essay.svg" className="w-6 h-6" alt="Essay" />;
      case 'gapselect':
        return <img src="/src/assets/icon/Select-missing words.svg" className="w-6 h-6" alt="Select missing words" />;
      case 'match':
        return <img src="/src/assets/icon/Matching.svg" className="w-6 h-6" alt="Matching" />;
      case'multianswer':
        return <img src="/src/assets/icon/Embedded answers (Cloze).svg" className="w-6 h-6" alt="Embedded answers (Cloze)" />;
      case 'multichoice':
        return <img src="/src/assets/icon/Multiple-choice.svg" className="w-6 h-6" alt="Multiple Choice" />;
      case'numerical':
        return <img src="/src/assets/icon/Numerical.svg" className="w-6 h-6" alt="Numerical" />;
      case'ordering':
        return <img src="/src/assets/icon/Ordering.svg" className="w-6 h-6" alt="Ordering" />;
     
      case 'randomsamatch':
        return <img src="/src/assets/icon/Random short-answer matching.svg" className="w-6 h-6" alt="Random Short Answer Matching" />;
      case 'shortanswer':
        return <img src="/src/assets/icon/Short-answer.svg" className="w-6 h-6" alt="Short Answer" />;
      case 'truefalse':
        return <img src="/src/assets/icon/True-False.svg" className="w-6 h-6" alt="True/False" />;
      default:
        return <span className="icon text-gray-400">?</span>;
    }
  };

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
  const handleHistory = (question) => {
    console.log('Opening history for question:', question);
    setHistoryQuestion(question);
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
                    <a href="#" className="text-blue-600 hover:text-blue-900" data-target={`questioncommentpreview_${question.id}`} data-questionid={question.id} data-courseid="985" data-contextid="1">
                      {question.comments || 0}
                    </a>
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
                                setOpenActionDropdown(openActionDropdown === question.id ? null : question.id);
                              }}
                            >
                              Edit
                              <i className="fa fa-chevron-down ml-1"></i>
                            </a>
                            {openActionDropdown === question.id && (
                              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                                <a
                                  href="#"
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                  role="menuitem"
                                  tabIndex="-1"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    openEditModal(question);
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

      {/* Question Preview Modal */}
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
// ============================================================================
// components/QuestionsTable.jsx - FIXED: Stop Infinite Tag Loop
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import { questionAPI } from '../../api/questionAPI'; 
import { toast } from 'react-hot-toast';
import ReactModal from 'react-modal';
ReactModal.setAppElement('#root');
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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

  //  CRITICAL FIX: Track fetched questions to prevent infinite loops
  const fetchedQuestionsRef = useRef(new Set());
  const isFetchingRef = useRef(false);

  // FIXED: Enhanced tag rendering with REAL API data
// 1. FIXED: Simplified and accurate tag rendering function
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
    <div className="flex flex-wrap items-center gap-1 mt-2">
      <span className="text-xs font-medium text-gray-600 mr-1">Tags:</span>
      
      {visibleTags.map((tag) => (
        <span
          key={`tag-${question.id}-${tag.id}`}
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-colors ${
            tag.isStandard 
              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={tag.description || `Tag: ${tag.displayName}`}
        >
          {tag.displayName}
        </span>
      ))}
      
      {hiddenTagsCount > 0 && (
        <span 
          className="text-xs font-medium text-blue-600 cursor-pointer hover:text-blue-800"
          title={`${hiddenTagsCount} more tags`}
        >
          +{hiddenTagsCount} more
        </span>
      )}
    </div>
  );
};


  //  CRITICAL FIX: Smart tag fetching - only fetch once per question
// 2. FIXED: Enhanced useEffect for fetching tags (uncomment and use this version)
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

  console.log(` Fetching tags for ${questionsNeedingTags.length} questions`);

  async function fetchTagsForQuestions() {
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error(' No authentication token for tag fetching');
        return;
      }

      // Process questions in smaller batches to avoid overwhelming the API
      const batchSize = 3;
      let updatedQuestions = {};

      for (let i = 0; i < questionsNeedingTags.length; i += batchSize) {
        const batch = questionsNeedingTags.slice(i, i + batchSize);
        
        console.log(` Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(questionsNeedingTags.length/batchSize)}`);
        
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
            console.log(` Tags for question ${question.id}:`, data);

            // Extract tags from your API response format: { questionid: 0, tags: [] }
            const tags = Array.isArray(data.tags) ? data.tags : [];
            
            return { questionId: question.id, tags };
          } catch (error) {
            console.error(` Error fetching tags for question ${question.id}:`, error);
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
        
        console.log(` Successfully updated tags for ${Object.keys(updatedQuestions).length} questions`);
      }
        
    } catch (error) {
      console.error(' Error in tag fetching process:', error);
      // Mark all questions as fetched to prevent retry loops
      questionsNeedingTags.forEach(q => {
        fetchedQuestionsRef.current.add(q.id);
      });
    } finally {
      isFetchingRef.current = false;
    }
  }

  fetchTagsForQuestions();
}, [questions?.length, setQuestions]); // Dependencies: only re-run when questions length changes

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
      case 'multichoice':
      case 'multiple':
        return <img src="/src/assets/icon/Multiple-choice.svg" className="w-6 h-6" alt="Multiple Choice" />;
      case 'matching':
      case 'match':
        return <img src="/src/assets/icon/Matching.svg" className="w-6 h-6" alt="Matching" />;
      case 'essay':
        return <img src="/src/assets/icon/Essay.svg" className="w-6 h-6" alt="Essay" />;
      case 'shortanswer':
        return <img src="/src/assets/icon/Short-answer.svg" className="w-6 h-6" alt="Short Answer" />;
      case 'truefalse':
        return <img src="/src/assets/icon/True-False.svg" className="w-6 h-6" alt="True/False" />;
      case 'ddimageortext':
        return <img src="/src/assets/icon/Drag and drop into text.svg" className="w-6 h-6" alt="Drag and Drop Text" />;
      case 'gapselect':
        return <img src="/src/assets/icon/Gapfill.svg" className="w-6 h-6" alt="Gap Fill" />;
      case 'ddmarker':
        return <img src="/src/assets/icon/Drag and drop markers.svg" className="w-6 h-6" alt="Drag and Drop Markers" />;
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
        );a
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

  return (
    <>
      <div
        className="overflow-x-auto"
        style={{ minHeight: '300px', height: 'unset', maxHeight: 'unset', overflowY: 'auto' }}
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
                <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell" scope="col">Status</th>
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
                 <td className="px-3 py-4 whitespace-nowrap hidden sm:table-cell">
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
                                    openEditModal(question); // Use the unified modal for editing
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
                                    onPreview(question); 
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
                                    onHistory(question); 
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
        <div className="absolute z-50 bg-white border border-gray-300 rounded shadow-lg p-4"
             style={{
               left: '50%',
               top: '50%',
               transform: 'translate(-50%, -50%)'
             }}>
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
      // width: 'auto',
      margin: 'auto',
      // maxHeight: '50vh',
      overflowY: 'auto',
      //  inset: '20px',
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
        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
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

    </>
 

);


};

export default QuestionsTable;
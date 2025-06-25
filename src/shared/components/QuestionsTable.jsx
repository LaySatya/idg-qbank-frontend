// ============================================================================
// components/QuestionsTable.jsx - Complete File with Fixed Tag Display
// ============================================================================
import React, { useEffect } from 'react';
import { questionAPI } from '../../api/questionAPI'; 
import { toast } from 'react-hot-toast';
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

  //  FIXED: Enhanced tag rendering with proper error handling
  const renderTags = (question) => {
    console.log(` Rendering tags for question ${question.id}:`, {
      question_title: question.title?.substring(0, 30) + '...',
      tags: question.tags,
      tags_type: typeof question.tags,
      tags_is_array: Array.isArray(question.tags),
      tags_length: Array.isArray(question.tags) ? question.tags.length : 'not array'
    });

    // Ensure we have a valid tags array
    if (!Array.isArray(question.tags) || question.tags.length === 0) {
      console.log(` No valid tags array for question ${question.id}`);
      return (
        <div className="text-xs text-gray-400 italic mt-1">
          No tags available
        </div>
      );
    }

    // System tags to exclude from display (removed 'exam' since it's a valid content tag)
    const systemTags = [
      'easy', 'medium', 'hard', 'beginner', 'intermediate', 'advanced',
      'ready', 'draft', 'hidden', 'published',
      'true-false', 'truefalse', 'multichoice', 'matching',
      'essay', 'shortanswer', 'ddmarker', 'ddimageortext', 'gapselect',
      'quiz', 'test' // Note: 'exam' removed - it's a valid content tag
    ];

    // Process and filter tags
    const contentTags = question.tags
      .map((tag, index) => {
        try {
          let tagName = '';
          let tagDisplay = '';
          let tagId = index;
          
          if (typeof tag === 'string') {
            tagName = tag.toLowerCase().trim();
            tagDisplay = tag.trim();
            tagId = tag;
          } else if (typeof tag === 'object' && tag !== null) {
            // Handle your API format: { id, name, rawname, isstandard, description, descriptionformat, flag }
            const rawName = tag.rawname || tag.name || tag.text || tag.value || '';
            tagName = String(rawName).toLowerCase().trim();
            tagDisplay = String(rawName).trim();
            tagId = tag.id || rawName || index;
          } else {
            tagName = String(tag || '').toLowerCase().trim();
            tagDisplay = String(tag || '').trim();
            tagId = index;
          }
          
          // Skip empty tags or system tags
          if (!tagName || 
              tagName === '[object object]' || 
              systemTags.includes(tagName)) {
            return null;
          }
          
          return {
            name: tagName,
            display: tagDisplay,
            id: tagId,
            original: tag
          };
          
        } catch (error) {
          console.warn(`Error processing tag ${index} for question ${question.id}:`, tag, error);
          return null;
        }
      })
      .filter(Boolean); // Remove null entries

    console.log(` Filtered tags for question ${question.id}:`, {
      original_count: question.tags.length,
      filtered_count: contentTags.length,
      content_tags: contentTags.map(t => t.display)
    });

    if (contentTags.length === 0) {
      console.log(` No content tags to display for question ${question.id}`);
      return (
        <div className="text-xs text-gray-400 italic mt-1">
          No content tags available
        </div>
      );
    }
// Limit to 2 tags, show "..." if more
  const maxTagsToShow = 2;
  const tagsToShow = contentTags.slice(0, maxTagsToShow);
  const hasMore = contentTags.length > maxTagsToShow;

     return (
    <div className="flex flex-wrap gap-1 mt-1">
      <span className="text-xs font-medium text-gray-600 mr-1">Tags:</span>
      {tagsToShow.map((processedTag, index) => {
        const uniqueKey = `${question.id}-tag-${processedTag.id}-${index}`;
        return (
          <span
            key={uniqueKey}
            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-cyan-600 text-white rounded hover:bg-cyan-700 cursor-pointer transition-colors"
            title={`Filter by tag: ${processedTag.display}`}
          >
            {processedTag.display}
          </span>
        );
      })}
      {hasMore && (
        <span className="text-xs font-medium text-gray-500 ml-1">...</span>
      )}
    </div>
  );
};
  // Fetch tags for each question if not present or if they're in string format
  useEffect(() => {
    if (!questions || questions.length === 0) return;
    
    console.log(' CHECKING TAGS: Questions for tag validation:', questions.map(q => ({
      id: q.id,
      title: q.title ? q.title.substring(0, 30) + '...' : '(no title)',
      hasTags: Array.isArray(q.tags),
      tagCount: Array.isArray(q.tags) ? q.tags.length : 0,
      tagFormat: Array.isArray(q.tags) && q.tags.length > 0 ? typeof q.tags[0] : 'none',
      firstTag: q.tags?.[0]
    })));

    // Check if any questions need tag fetching
    const questionsNeedingTags = questions.filter(q => {
      if (!Array.isArray(q.tags) || q.tags.length === 0) {
        console.log(` Question ${q.id} has no tags, needs fetching`);
        return true;
      }
      
      // Check if tags are in old string format instead of object format
      if (typeof q.tags[0] === 'string') {
        console.log(` Question ${q.id} has string tags, needs API refresh:`, q.tags);
        return true;
      }
      
      console.log(`Question ${q.id} has proper object tags:`, q.tags);
      return false;
    });
    
    if (questionsNeedingTags.length === 0) {
      console.log(' All questions already have proper object-format tags');
      return;
    }

    console.log(` Fetching/refreshing tags for ${questionsNeedingTags.length} questions:`, 
      questionsNeedingTags.map(q => q.id));

    // Prevent multiple simultaneous fetches
    let isFetching = false;

    async function fetchTagsForQuestions() {
      if (isFetching) {
        console.log(' Already fetching tags, skipping...');
        return;
      }
      
      isFetching = true;
      console.log(' Starting tag fetch process...');
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error(' No authentication token for tag fetching');
          return;
        }

        const updatedQuestions = await Promise.all(
          questions.map(async (q) => {
            // Skip if already has proper object-format tags
            if (Array.isArray(q.tags) && q.tags.length > 0 && typeof q.tags[0] === 'object') {
              console.log(`Question ${q.id} already has proper object tags`);
              return q;
            }
            
            try {
              console.log(` Fetching fresh tags for question ${q.id}`);
              const res = await fetch(`http://127.0.0.1:8000/api/questions/question-tags?questionid=${q.id}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
              });
              
              if (res.ok) {
                const data = await res.json();
                console.log(` Received fresh tags for question ${q.id}:`, data);
                
                // Extract tags array from the response
                const tags = Array.isArray(data.tags) ? data.tags : [];
                console.log(`Updating question ${q.id} with ${tags.length} fresh tags:`, tags);
                
                return { ...q, tags };
              } else {
                console.warn(` Failed to fetch tags for question ${q.id}: ${res.status}`);
                return q;
              }
            } catch (error) {
              console.error(` Error fetching tags for question ${q.id}:`, error);
              return q; // Keep original question if fetch fails
            }
          })
        );
        
        console.log(' Setting updated questions with fresh tags');
        console.log('Updated questions preview:', updatedQuestions.map(q => ({
          id: q.id,
          tagCount: Array.isArray(q.tags) ? q.tags.length : 0,
          tagFormat: Array.isArray(q.tags) && q.tags.length > 0 ? typeof q.tags[0] : 'none',
          sampleTags: Array.isArray(q.tags) ? q.tags.slice(0, 2) : []
        })));
        
        setQuestions(updatedQuestions);
      } finally {
        isFetching = false;
        console.log(' Tag fetch process completed');
      }
    }

    fetchTagsForQuestions();
  }, [questions?.length, questions?.map(q => q.id).join(',')]);

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

  // Enhanced debugging for questions AND tag collection
  useEffect(() => {
    console.log(' QuestionsTable received questions:', {
      questionsCount: questions?.length || 0,
      sampleQuestion: questions?.[0] ? {
        id: questions[0].id,
        title: questions[0].title,
        tags: questions[0].tags,
        tagsType: typeof questions[0].tags,
        tagsLength: Array.isArray(questions[0].tags) ? questions[0].tags.length : 'not array'
      } : 'no questions'
    });

    // Collect all unique tags for debugging
    if (questions && questions.length > 0) {
      const allTagsFromQuestions = new Set();
      const allContentTags = new Set();
      
      questions.forEach(question => {
        if (Array.isArray(question.tags)) {
          question.tags.forEach(tag => {
            let tagName = '';
            if (typeof tag === 'string') {
              tagName = tag;
            } else if (typeof tag === 'object' && tag !== null) {
              tagName = tag.name || tag.rawname || '';
            }
            
            if (tagName) {
              allTagsFromQuestions.add(tagName);
              
              // Check if it's a content tag (not filtered out)
              const exclude = [
                'easy', 'medium', 'hard', 'beginner', 'intermediate', 'advanced',
                'ready', 'draft', 'true-false', 'truefalse', 'multichoice', 'matching',
                'essay', 'shortanswer', 'ddmarker', 'ddimageortext', 'gapselect',
                'quiz', 'test' // Note: 'exam' removed - it's a valid content tag
              ];
              
              if (!exclude.includes(tagName.toLowerCase().trim())) {
                allContentTags.add(tagName);
              }
            }
          });
        }
      });
      
      console.log(' ALL TAGS FOUND IN QUESTIONS:', Array.from(allTagsFromQuestions).sort());
      console.log(' CONTENT TAGS (after filtering):', Array.from(allContentTags).sort());
      console.log(' FILTERED OUT TAGS:', 
        Array.from(allTagsFromQuestions).filter(tag => !allContentTags.has(tag)).sort()
      );
    }
  }, [questions]);

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

  // Start editing title
  const startEditingTitle = (question) => {
    setEditingQuestion(question.id);
    setNewQuestionTitle(question.name || question.title || '');
  };

  // Initiate question save
  // const initiateQuestionSave = (questionId) => {
  //   if (newQuestionTitle.trim() === '') return;
  //   setShowSaveConfirm(true);
  // };

const initiateQuestionSave = async (questionId) => {
  if (newQuestionTitle.trim() === '') {
    alert('Question title cannot be empty');
    return;
  }

  try {
    const userid = localStorage.getItem('userid');
    if (!userid) {
      // More helpful error message
      const shouldReload = confirm('Session expired. Reload the page?');
      if (shouldReload) window.location.reload();
      return;
    }

    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    await questionAPI.updateQuestionName(
      questionId,
      newQuestionTitle,
      question.questiontext || '',
      Number(userid) // Ensure it's a number
    );

    // Update local state
    setQuestions(prev => 
      prev.map(q => 
        q.id === questionId ? { ...q, name: newQuestionTitle } : q
      )
    );
    setEditingQuestion(null);
    toast.success('Question updated successfully');
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
    <div className="overflow-x-auto">
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
          {/* question text and tag  */}
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
                          onBlur={() => initiateQuestionSave(question.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') initiateQuestionSave(question.id);
                            if (e.key === 'Escape') setEditingQuestion(null);
                          }}
                        />
                      ) : (
                        <span 
                          className="inline-flex items-center group cursor-pointer"
                          onClick={() => startEditingTitle(question)}
                        >
                          <a href="#" className=" ml-2 text-black-900 hover:text-blue-900">
                            {question.name || question.title || '(No title)'} 
                            <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <i className="fa-regular fa-pen-to-square text-gray-400"></i>
                            </span>
                          </a>
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
                  
                  {/* 🔧 FIXED: Tags Rendering Section */}
                  <div className="w-full">
                    {renderTags(question)}
                  </div>
                </div>
              </td>
              


              
              {/* Status Column */}
              <td className="px-3 py-4 whitespace-nowrap">
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
                                onEdit(question);
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
      
      {/* 🔍 OPTIONAL: Development Debug Panel - Remove in production */}
      {/* {process.env.NODE_ENV === 'development' && questions.length > 0 && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg border">
          <div className="text-sm font-bold text-gray-800 mb-2">🔍 Debug: Tag Analysis</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questions.slice(0, 3).map(question => (
              <div key={question.id} className="bg-white p-3 rounded border">
                <div className="text-xs font-bold text-blue-600 mb-1">
                  Question {question.id}: {question.title?.substring(0, 20)}...
                </div>
                <div className="text-xs space-y-1">
                  <div><strong>Tags Type:</strong> {typeof question.tags}</div>
                  <div><strong>Is Array:</strong> {Array.isArray(question.tags) ? 'Yes' : 'No'}</div>
                  <div><strong>Length:</strong> {Array.isArray(question.tags) ? question.tags.length : 'N/A'}</div>
                  {Array.isArray(question.tags) && question.tags.length > 0 && (
                    <>
                      <div><strong>First Tag:</strong></div>
                      <pre className="text-xs bg-gray-50 p-1 rounded overflow-x-auto">
                        {JSON.stringify(question.tags[0], null, 1)}
                      </pre>
                      <div><strong>Content Tags:</strong></div>
                      <div className="text-xs text-green-600">
                        {question.tags
                          .map(tag => (typeof tag === 'object' ? (tag.rawname || tag.name) : tag))
                          .filter(name => {
                            const systemTags = ['ready', 'draft', 'multichoice', 'matching', 'essay', 'shortanswer', 'ddmarker', 'quiz', 'test']; // Note: 'exam' removed
                            return name && !systemTags.includes(name.toLowerCase());
                          })
                          .join(', ') || 'None'
                        }
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-600">
            This debug panel will be hidden in production. It shows the structure of the first 3 questions' tags.
          </div>
        </div>
      )} */}
    </div>
  );
};

export default QuestionsTable;
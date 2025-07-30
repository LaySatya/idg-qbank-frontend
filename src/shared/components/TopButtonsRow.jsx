import React, { useState, useRef } from 'react';
import CreateQuestionModal from './CreateQuestionModal';
import { ChevronDown, Check, Upload, Plus, AlertCircle, CheckCircle, FolderOpen, ArrowLeft, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TopButtonsRow = ({
  showQuestionsDropdown,
  setShowQuestionsDropdown,
  questionsDropdownRef,
  handleFileUpload,
  // setShowCreateModal, // Removed duplicate declaration
  showQuestionText,
  setShowQuestionText,
  questions,
  setCurrentPage,
  questionsPerPage,
  setQuestions,
  totalQuestions,
  setTotalQuestions,
   setShowCategoriesModal,
  // Add these new props for navigation
  currentView = 'questions', // default to questions view
  setCurrentView,
  onNavigate,
  // New props for back navigation
  showBackButton = false,
  backButtonText = 'Back to Courses',
  onBack,
  selectedCourseName
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [loadingQuestionTypes, setLoadingQuestionTypes] = useState(false);
  const fileInputRef = useRef(null);

// Enhanced navigation handler
const handleNavigation = (value) => {
// ...existing code...

    if (value.includes('import')) {
      handleImportClick();
      return;
    }
    
    // Handle different navigation options
    if (value.includes('categories')) {
      if (setCurrentView) setCurrentView('categories');
      // toast('Navigating to Categories...', { icon: '' });
      if (onNavigate) onNavigate('categories');
    } else if (value.includes('export')) {
      if (setCurrentView) setCurrentView('export');
      // toast('Navigating to Export...', { icon: '' });
      if (onNavigate) onNavigate('export');
    } else if (value.includes('edit')) {
      if (setCurrentView) setCurrentView('questions');
      // toast('Navigating to Questions...', { icon: '' });
      if (onNavigate) onNavigate('questions');
    }
  };


  // Show create modal and fetch question types from API
  const handleCreateQuestion = async () => {
    setShowCreateModal(true);
    setLoadingQuestionTypes(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/questions/qtypes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const types = await response.json();
        setQuestionTypes(types);
      } else {
        setQuestionTypes([]);
        toast.error('Failed to load question types from API');
      }
    } catch (error) {
      setQuestionTypes([]);
      toast.error('Error loading question types');
    } finally {
      setLoadingQuestionTypes(false);
    }
  };

  // File import click - Updated to use real category IDs with correct context
  const handleImportClick = async () => {
    // Log current values for debugging if needed
    console.log('\n === MOODLE IMPORT REDIRECT ===');
    
    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const courseId = localStorage.getItem('CourseID');
    const categoryId = localStorage.getItem('questionCategoryId');
    
    console.log(' Real category ID from your system:', categoryId);
    
    // Try multiple approaches to find working import URL
    // Based on discovery: categoryid=7528&contextid=115135 works!
    const testCases = [
      // Try with your real category ID and the discovered context pattern
      { categoryid: categoryId, contextid: '115135', note: 'Real category ID with discovered context 115135' },
      { categoryid: categoryId, contextid: '1', note: 'Real category ID with context 1' },
      { categoryid: categoryId, contextid: courseId, note: 'Real category ID with course context' },
      
      // Fallback to known working IDs if real one fails
      { categoryid: '7', contextid: '1', note: 'Known working: category 7' },
      { categoryid: '8', contextid: '1', note: 'Known working: category 8' },
    ];
    
    console.log(' Testing import URLs in order of preference...');
    
    for (const testCase of testCases) {
      // Skip if we don't have the required values
      if (!testCase.categoryid || testCase.categoryid === 'All') continue;
      
      try {
        const importUrl = `${API_BASE_URL}/questions/import?categoryid=${testCase.categoryid}&contextid=${testCase.contextid}&courseid=${courseId}`;
        console.log(`\n Testing: ${testCase.note}`);
        console.log(`   URL: ${importUrl}`);
        
        const response = await fetch(importUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(' SUCCESS! Import form URL received:', data);
          
          if (data.import_form_url) {
            console.log(' Opening Moodle import form...');
            console.log(' Form URL:', data.import_form_url);
            
            // Show user what's happening
            // toast(`Opening Moodle import form (Category: ${testCase.categoryid}, Context: ${testCase.contextid})...`, { 
            //   icon: '' 
            // });
            
            // Open Moodle import form in new window/tab
            window.open(data.import_form_url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
            
            // Update status
            setTimeout(() => {
              // toast.success('Import form opened! Upload your questions in the new window.');
            }, 1000);
            
            return; // Success - stop trying other URLs
          }
        } else {
          const errorText = await response.text();
          console.log(` Failed (${response.status}):`, errorText);
        }
        
      } catch (error) {
        console.log(` Error testing ${testCase.note}:`, error.message);
      }
    }
    
    // If all import URLs failed, fallback to local import
    console.log(' All import URLs failed. Falling back to local file import...');
    // toast('Could not connect to Moodle import. Using local import instead...', { 
    //   icon: '' 
    // });
    fileInputRef.current?.click();
  };

  // Preview all questions in category
  const handlePreviewClick = async () => {
    console.log('\n=== QUESTIONS PREVIEW ===');
    
    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const categoryId = localStorage.getItem('questionCategoryId');
    
    console.log('Category ID for preview:', categoryId);
    
    if (!categoryId || categoryId === 'All') {
      // toast('Please select a specific category to preview questions.', { 
      //   icon: '' 
      // });
      return;
    }
    
    try {
      // Show loading status
      // toast('Loading questions preview...', { 
      //   icon: '' 
      // });
      
      const previewUrl = `${API_BASE_URL}/questions/multi_preview?categoryid=${categoryId}`;
      console.log('Preview URL:', previewUrl);
      
      const response = await fetch(previewUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(' Preview response:', data);
        
        if (data.multi_preview_url) {
          console.log(' Opening questions preview...');
          console.log(' Preview URL:', data.multi_preview_url);
          
          // Open preview in new window
          window.open(data.multi_preview_url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
          
          toast.success('Questions preview opened in new window!');
          
        } else {
          console.log('No preview URL received');
          // toast('No questions available for preview in this category.', { 
          //   icon: '' 
          // });
        }
      } else {
        const errorText = await response.text();
        console.log(` Preview failed (${response.status}):`, errorText);
        toast.error(`Failed to load preview: ${response.status}`);
      }
      
    } catch (error) {
      console.error(' Preview error:', error);
      // toast.error('Error connecting to preview service.');
    }
  };

  // Parse XML
  const parseXMLQuestions = (xmlContent) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) throw new Error('Invalid XML format');
      const questions = [];
      const questionElements = xmlDoc.querySelectorAll('question');
      questionElements.forEach((questionEl, index) => {
        const type = questionEl.getAttribute('type');
        if (!type || type === 'category') return;
        const nameEl = questionEl.querySelector('name text');
        const questionTextEl = questionEl.querySelector('questiontext text');
        const question = {
          id: `imported_${Date.now()}_${index}`,
          title: nameEl ? nameEl.textContent.trim() : `Imported Question ${index + 1}`,
          questionText: questionTextEl ? questionTextEl.textContent.trim() : '',
          qtype: type === 'multichoice' ? 'multichoice' : type === 'truefalse' ? 'truefalse' : 'multichoice',
          status: 'draft',
          version: 'v1',
          tags: [],
          choices: [],
          createdBy: { name: 'Imported', role: '', date: new Date().toLocaleDateString() },
          comments: 0,
          usage: 0,
          lastUsed: '',
          modifiedBy: { name: 'System', role: '', date: new Date().toLocaleDateString() },
          history: []
        };
        if (type === 'multichoice') {
          const answerElements = questionEl.querySelectorAll('answer');
          question.choices = Array.from(answerElements).map((answerEl, answerIndex) => {
            const fraction = parseFloat(answerEl.getAttribute('fraction') || '0');
            const textEl = answerEl.querySelector('text');
            const feedbackEl = answerEl.querySelector('feedback text');
            return {
              id: answerIndex,
              text: textEl ? textEl.textContent.trim() : '',
              answer: textEl ? textEl.textContent.trim() : '',
              isCorrect: fraction > 0,
              grade: fraction > 0 ? '100%' : '0%',
              feedback: feedbackEl ? feedbackEl.textContent.trim() : ''
            };
          });
          question.multipleAnswers = question.choices.filter(c => c.isCorrect).length > 1;
          question.shuffleAnswers = questionEl.querySelector('shuffleanswers')?.textContent === '1';
          question.numberChoices = '1, 2, 3, ...';
          question.showInstructions = true;
        }
        if (type === 'truefalse') {
          const trueAnswerEl = questionEl.querySelector('answer[fraction="100"] text');
          question.correctAnswer = trueAnswerEl ? 'true' : 'false';
          question.feedbackTrue = questionEl.querySelector('answer[fraction="100"] feedback text')?.textContent || '';
          question.feedbackFalse = questionEl.querySelector('answer[fraction="0"] feedback text')?.textContent || '';
        }
        question.defaultMark = parseFloat(questionEl.querySelector('defaultgrade')?.textContent || '1');
        question.generalFeedback = questionEl.querySelector('generalfeedback text')?.textContent || '';
        question.penaltyFactor = parseFloat(questionEl.querySelector('penalty')?.textContent || '0');
        questions.push(question);
      });
      return questions;
    } catch (error) {
      throw new Error(`Failed to parse XML: ${error.message}`);
    }
  };

  // Parse JSON
  const parseJSONQuestions = (jsonContent) => {
    try {
      const data = JSON.parse(jsonContent);
      let questionsArray = [];
      if (Array.isArray(data)) questionsArray = data;
      else if (data.questions && Array.isArray(data.questions)) questionsArray = data.questions;
      else throw new Error('Invalid JSON structure - expected questions array');
      return questionsArray.map((q, index) => ({
        id: q.id || `imported_${Date.now()}_${index}`,
        title: q.title || q.name || `Imported Question ${index + 1}`,
        questionText: q.questionText || q.question || '',
        qtype: q.qtype || q.type || 'multichoice',
        status: q.status || 'draft',
        version: q.version || 'v1',
        tags: q.tags || [],
        choices: q.choices || q.options?.map((opt, i) => ({
          id: i,
          text: opt,
          answer: opt,
          isCorrect: q.correctAnswers?.includes(opt) || false,
          grade: q.correctAnswers?.includes(opt) ? '100%' : '0%',
          feedback: ''
        })) || [],
        correctAnswer: q.correctAnswer,
        feedbackTrue: q.feedbackTrue || '',
        feedbackFalse: q.feedbackFalse || '',
        multipleAnswers: q.multipleAnswers || false,
        shuffleAnswers: q.shuffleAnswers || false,
        numberChoices: q.numberChoices || '1, 2, 3, ...',
        showInstructions: q.showInstructions !== false,
        defaultMark: q.defaultMark || 1,
        generalFeedback: q.generalFeedback || '',
        penaltyFactor: q.penaltyFactor || 0,
        createdBy: q.createdBy || { name: 'Imported', role: '', date: new Date().toLocaleDateString() },
        comments: q.comments || 0,
        usage: q.usage || 0,
        lastUsed: q.lastUsed || '',
        modifiedBy: q.modifiedBy || { name: 'System', role: '', date: new Date().toLocaleDateString() },
        history: Array.isArray(q.history) ? q.history : []
      }));
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  };

  // Detect duplicates
  const detectDuplicates = (newQuestions, existingQuestions) => {
    const duplicates = [];
    const unique = [];
    newQuestions.forEach(newQ => {
      const isDuplicate = existingQuestions.some(existingQ =>
        existingQ.title.toLowerCase().trim() === newQ.title.toLowerCase().trim() ||
        existingQ.questionText.toLowerCase().trim() === newQ.questionText.toLowerCase().trim()
      );
      if (isDuplicate) duplicates.push(newQ);
      else unique.push(newQ);
    });
    return { duplicates, unique };
  };

  // Handle file change and update pagination
  const handleFileChange = async (event) => {
    if (!event || !event.target || !event.target.files) {
      // toast.error('No file selected or event is invalid.');
      return;
    }
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    // toast(`Processing ${file.name}...`, { icon: '' });

    try {
      const fileContent = await file.text();
      let parsedQuestions = [];
      if (file.name.endsWith('.xml')) parsedQuestions = parseXMLQuestions(fileContent);
      else if (file.name.endsWith('.json')) parsedQuestions = parseJSONQuestions(fileContent);
      else throw new Error('Unsupported file format. Please use XML or JSON files.');

      if (parsedQuestions.length === 0) throw new Error('No valid questions found in the file.');
      const { unique, duplicates } = detectDuplicates(parsedQuestions, questions || []);

      // Save imported questions to backend using the import endpoint
      if (unique.length > 0) {
        try {
          const token = localStorage.getItem('token');
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
          
          // Get required parameters from localStorage
          const courseId = localStorage.getItem('CourseID');
          const categoryId = localStorage.getItem('questionCategoryId');
          
          console.log(' Saving imported questions to server...', {
            questionsCount: unique.length,
            courseId,
            categoryId
          });
          
          // Save each question individually to the questions endpoint
          const savePromises = unique.map(async (question) => {
            const payload = {
              name: question.title,
              questiontext: question.questionText,
              qtype: question.qtype,
              status: question.status || 'draft',
              defaultmark: question.defaultMark || 1,
              generalfeedback: question.generalFeedback || '',
              penalty: question.penaltyFactor || 0,
              tags: question.tags || [],
              // Add category and course information if available
              ...(categoryId && categoryId !== 'All' && { categoryid: categoryId }),
              ...(courseId && { courseid: courseId }),
              // Question type specific fields
              ...(question.qtype === 'truefalse' && {
                correctanswer: question.correctAnswer,
                feedbacktrue: question.feedbackTrue || '',
                feedbackfalse: question.feedbackFalse || ''
              }),
              ...(question.qtype === 'multichoice' && {
                answers: question.choices || [],
                single: !question.multipleAnswers,
                shuffleanswers: question.shuffleAnswers ? 1 : 0,
                answernumbering: question.numberChoices || '1, 2, 3, ...',
                showstandardinstruction: question.showInstructions ? 1 : 0
              })
            };
            
            const response = await fetch(`${API_BASE_URL}/questions/create`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.warn(`Failed to save question "${question.title}": ${response.status} - ${errorText}`);
              
              // If create endpoint doesn't work, try other common patterns
              if (response.status === 404 || response.status === 405) {
                console.log(`Trying alternative endpoint for question: ${question.title}`);
                
                // Try /api/questions/store (Laravel resource pattern)
                const storeResponse = await fetch(`${API_BASE_URL}/questions/store`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  body: JSON.stringify(payload)
                });
                
                if (storeResponse.ok) {
                  return await storeResponse.json();
                }
                
                // If still not working, log the available methods
                console.error(`Both /questions/create and /questions/store failed for "${question.title}"`);
              }
              
              return null;
            }
            
            return await response.json();
          });
          
          const savedQuestions = await Promise.all(savePromises);
          const successfulSaves = savedQuestions.filter(q => q !== null);
          
          console.log(`Successfully saved ${successfulSaves.length} out of ${unique.length} questions to server`);
          
          // Update parent state for pagination with imported questions
          if (handleFileUpload) {
            await handleFileUpload(file, successfulSaves.length > 0 ? successfulSaves : unique);
          }
          
          // Update local state
          if (setQuestions && questions) {
            const newQuestions = [...(successfulSaves.length > 0 ? successfulSaves : unique), ...questions];
            setQuestions(newQuestions.slice(0, questionsPerPage));
            if (setTotalQuestions) setTotalQuestions(newQuestions.length);
            if (setCurrentPage) setCurrentPage(1);
          }
          
          const statusMessage = successfulSaves.length === unique.length
            ? `Import complete! Added ${unique.length} question(s) to server. ${duplicates.length} duplicate(s) skipped.`
            : `Import partially successful! Added ${successfulSaves.length} out of ${unique.length} questions. ${unique.length - successfulSaves.length} failed. ${duplicates.length} duplicate(s) skipped.`;
          
          if (successfulSaves.length === unique.length) {
            toast.success(statusMessage);
          } else {
            toast(statusMessage, { icon: '⚠️' });
          }
          
        } catch (saveError) {
          console.error(' Failed to save questions to server:', saveError);
          
          // Fallback: Still update local state even if server saves failed
          if (handleFileUpload) {
            await handleFileUpload(file, unique);
          }
          
          if (setQuestions && questions) {
            const newQuestions = [...unique, ...questions];
            setQuestions(newQuestions.slice(0, questionsPerPage));
            if (setTotalQuestions) setTotalQuestions(newQuestions.length);
            if (setCurrentPage) setCurrentPage(1);
          }
          
          // toast(`Questions imported locally but failed to save to server: ${saveError.message}. Questions will disappear after page refresh.`, { 
          //   icon: '' 
          // });
        }
      } else {
        // toast(`No new questions to import. ${duplicates.length} duplicate(s) found.`, { 
        //   icon: '' 
        // });
      }
    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
    event.target.value = '';
  };



  // Handle type selection from modal
  const handleSelectType = async (typeObj) => {
    setShowCreateModal(false);
    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const categoryId = localStorage.getItem('questionCategoryId');
    const contextId = localStorage.getItem('CourseID') || '1';
    const qtype = typeObj.value || typeObj.name;

    if (!categoryId || categoryId === 'All') {
      toast.error('Please select a category first.');
      return;
    }

    try {
      const url = `${API_BASE_URL}/questions/create?qtype=${qtype}&categoryid=${categoryId}&contextid=${contextId}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.create_form_url) {
          window.open(data.create_form_url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
          toast.success('Question creation form opened!');
        } else {
          toast.error('No form URL received from server.');
        }
      } else {
        toast.error(`Failed to get create form: ${response.status}`);
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  // Show question text change
  const handleQuestionTextChange = (value) => {
    setShowQuestionText(value === "1" || value === "2");
  };

  // Export questions handler
  const handleExportClick = async () => {
    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const categoryId = localStorage.getItem('questionCategoryId');
    const contextId = localStorage.getItem('questionCategoryContextId');

    if (!categoryId || categoryId === 'All' || !contextId) {
      toast.error('Please select a valid category first.');
      return;
    }

    try {
      const url = `${API_BASE_URL}/questions/export?categoryid=${categoryId}&contextid=${contextId}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.export_form_url) {
          window.open(data.export_form_url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
          toast.success('Export form opened!');
        } else {
          toast.error('No export form URL received from server.');
        }
      } else {
        toast.error(`Failed to get export form: ${response.status}`);
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <div className="w-full border-2 border-white shadow-sm mb-4">
      <div className="py-3 px-5 flex flex-col justify-between md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Back Button and Course Info - show when coming from courses */}
        {showBackButton && (
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-200 transition-colors duration-200"
              title={backButtonText}
            >
              <ArrowLeft size={16} />
              {backButtonText}
            </button>
            {selectedCourseName && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Selected Course:</span>
                <span className="text-sm font-medium text-gray-900 bg-blue-50 px-2 py-1 rounded border">
                  {selectedCourseName}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Navigation Dropdown */}
        <div className="flex items-center gap-3 ">
          <label htmlFor="url_select" className="sr-only">
            Question bank tertiary navigation
          </label>
        </div>
  
        {/* Main Actions */}
        <div className="flex items-center gap-4 justify-start flex-1">
          {/* Import from File Button - show in questions view */}
          {(currentView === 'questions' || !currentView) && (
            <>
              <button
                type="button"
                className="text-sky-600 border border-sky-600 inline-flex items-center gap-2 rounded-md bg-transparent px-4 py-2 font-semibold shadow hover:bg-sky-50 hover:text-sky-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-sky-600"
                onClick={handleImportClick}
                disabled={isImporting}
              >
                {isImporting ? 'Importing...' : 'Import Questions'}
                <Upload size={18} />
              </button>


              <button
                type="button"
                className="text-sky-600 border border-sky-600 inline-flex items-center gap-2 rounded-md bg-transparent px-4 py-2 font-semibold shadow hover:bg-sky-50 hover:text-sky-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-sky-600"
                onClick={handlePreviewClick}
                title="Preview all questions in selected category"
              >
                Preview Questions
                <Eye size={18} />
              </button>

              <button
                type="button"
                className="text-sky-600 border border-sky-600 inline-flex items-center gap-2 rounded-md bg-transparent px-4 py-2 font-semibold shadow hover:bg-sky-50 hover:text-sky-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-sky-600"
                onClick={handleExportClick}
                title="Export questions in selected category"
              >
                Export Questions
                <FolderOpen size={18} />
              </button>

              <button
                type="button"
                className="text-sky-600 border border-sky-600 inline-flex items-center gap-2 rounded-md bg-transparent px-4 py-2 font-semibold shadow hover:bg-sky-50 hover:text-sky-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-sky-600"
                onClick={handleCreateQuestion}
                title="Create new question in selected category"
              >
                Create New Question
                <Plus size={18} />
              </button>
            </>
          )}
        
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".xml,.json"
            onChange={handleFileChange}
          />
        </div>
      </div>
    {/* Create Question Modal */}
    {showCreateModal && (
      <CreateQuestionModal
        onClose={() => setShowCreateModal(false)}
        onSelectType={handleSelectType}
        availableQuestionTypes={questionTypes}
        loadingQuestionTypes={loadingQuestionTypes}
      />
    )}
  </div>
  );
};

export default TopButtonsRow;
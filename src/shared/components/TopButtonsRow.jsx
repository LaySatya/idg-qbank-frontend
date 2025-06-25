import React, { useState, useRef } from 'react';
import { ChevronDown, Check, Upload, Plus, AlertCircle, CheckCircle, FolderOpen } from 'lucide-react';

const TopButtonsRow = ({
  showQuestionsDropdown,
  setShowQuestionsDropdown,
  questionsDropdownRef,
  handleFileUpload,
  setShowCreateModal,
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
  onNavigate
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Enhanced navigation handler
  const handleNavigation = (value) => {
    if (value.includes('import')) {
      handleImportClick();
      return;
    }
    
    // Handle different navigation options
    if (value.includes('categories')) {
      if (setCurrentView) setCurrentView('categories');
      setImportStatus({ type: 'info', message: 'Navigating to Categories...' });
      if (onNavigate) onNavigate('categories');
    } else if (value.includes('export')) {
      if (setCurrentView) setCurrentView('export');
      setImportStatus({ type: 'info', message: 'Navigating to Export...' });
      if (onNavigate) onNavigate('export');
    } else if (value.includes('edit')) {
      if (setCurrentView) setCurrentView('questions');
      setImportStatus({ type: 'info', message: 'Navigating to Questions...' });
      if (onNavigate) onNavigate('questions');
    }
    
    setTimeout(() => setImportStatus(null), 2000);
  };

  // Create question modal
  const handleCreateQuestion = () => {
    setShowCreateModal(true);
  };

  // File import click
  const handleImportClick = () => {
    fileInputRef.current?.click();
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
      setImportStatus({ type: 'error', message: 'No file selected or event is invalid.' });
      return;
    }
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus({ type: 'info', message: `Processing ${file.name}...` });

    try {
      const fileContent = await file.text();
      let parsedQuestions = [];
      if (file.name.endsWith('.xml')) parsedQuestions = parseXMLQuestions(fileContent);
      else if (file.name.endsWith('.json')) parsedQuestions = parseJSONQuestions(fileContent);
      else throw new Error('Unsupported file format. Please use XML or JSON files.');

      if (parsedQuestions.length === 0) throw new Error('No valid questions found in the file.');
      const { unique, duplicates } = detectDuplicates(parsedQuestions, questions || []);

      // Update parent state for pagination
      if (handleFileUpload) {
        await handleFileUpload(file, unique);
        // Update questions and totalQuestions for pagination
        if (setQuestions && questions) {
          const newQuestions = [...unique, ...questions];
          setQuestions(newQuestions.slice(0, questionsPerPage));
          if (setTotalQuestions) setTotalQuestions(newQuestions.length);
          if (setCurrentPage) setCurrentPage(1);
        }
        setImportStatus({
          type: 'success',
          message: `Import complete! Added ${unique.length} question(s). ${duplicates.length} duplicate(s) skipped.`
        });
      } else {
        setImportStatus({
          type: 'success',
          message: `File processed successfully! Found ${parsedQuestions.length} questions.`
        });
      }
    } catch (error) {
      setImportStatus({ type: 'error', message: `Import failed: ${error.message}` });
    } finally {
      setIsImporting(false);
      setTimeout(() => setImportStatus(null), 5000);
    }
    event.target.value = '';
  };

  // Show question text change
  const handleQuestionTextChange = (value) => {
    setShowQuestionText(value === "1" || value === "2");
  };

  return (
    <div className="w-full bg-gradient-to-br from-white to-sky-50 border-b border-gray-200 shadow-sm mb-7">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Navigation Dropdown */}
        <div className="flex items-center gap-3">
          <label htmlFor="url_select" className="sr-only">
            Question bank tertiary navigation
          </label>
          <select
            id="url_select"
            className="block rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-200 focus:ring-opacity-100 min-w-[200px] transition-colors duration-200"
            name="jump"
            onChange={(e) => handleNavigation(e.target.value)}
            value={currentView === 'questions' ? '/question/edit.php' : 
                  currentView === 'categories' ? '/question/bank/managecategories/category.php' :
                  currentView === 'export' ? '/question/bank/exportquestions/export.php' :
                  '/question/edit.php'}
          >
            <option value="/question/edit.php">Questions</option>
            <option value="/question/bank/managecategories/category.php">Categories</option>
            <option value="/question/bank/importquestions/import.php">Import</option>
            <option value="/question/bank/exportquestions/export.php">Export</option>
          </select>

          {/* Quick Categories Button - only show when not in categories view */}
          {/* {currentView !== 'categories' && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-green-600 text-white px-3 py-2 text-sm font-medium shadow hover:bg-green-700 transition-colors duration-200"
              onClick={() => handleNavigation('/question/bank/managecategories/category.php')}
              title="Manage Categories"
            >
              <FolderOpen size={16} />
              Categories
            </button>
          )} */}
        </div>
  
        {/* Main Actions */}
                
        <div className="flex flex-wrap items-center gap-4">
          {/* Create new question - only show in questions view */}
          {(currentView === 'questions' || !currentView) && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-gray-200 text-black px-4 py-2 font-semibold shadow hover:bg-gray-300 transition-colors duration-200"
                onClick={handleCreateQuestion}
              >
                <Plus size={18} />
                Create a new question ...
              </button>
        
              {/* Show question text selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="qbshowtext" className="text-gray-700 text-sm font-medium">
                  Show question text?
                </label>
                <select
                  id="qbshowtext"
                  name="qbshowtext"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  value={showQuestionText ? "1" : "0"}
                  onChange={(e) => handleQuestionTextChange(e.target.value)}
                >
                  <option value="0">No</option>
                  <option value="1">Yes, text only</option>
                  <option value="2">Yes, with images, media, etc.</option>
                </select>
              </div>
            </div>
          )}
        
          {/* Open Categories Modal Button */}
          {(currentView === 'questions' || !currentView) && (
            <button
              type="button"
              onClick={() => setShowCategoriesModal(true)}
              className="inline-flex items-center gap-2 rounded-md bg-sky-700 text-white px-4 py-2 font-semibold shadow hover:bg-blue-700 transition"
            >
              <FolderOpen size={18} />
              Open Categories
            </button>
            
          )}
        
          {/* Import Button - show in questions view */}
          {(currentView === 'questions' || !currentView) && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-sky-600 text-white px-4 py-2 font-semibold shadow hover:bg-sky-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleImportClick}
              disabled={isImporting}
            >
              <Upload size={18} />
              {isImporting ? 'Importing...' : 'Import Questions'}
            </button>
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

      {/* Status Message */}
      {importStatus && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-md shadow-lg flex items-center gap-2 text-white font-semibold transition-all duration-300
            ${importStatus.type === 'info' ? 'bg-blue-600' : ''}
            ${importStatus.type === 'success' ? 'bg-green-600' : ''}
            ${importStatus.type === 'error' ? 'bg-red-600' : ''}
          `}
        >
          {importStatus.type === 'info' && <AlertCircle size={20} />}
          {importStatus.type === 'success' && <CheckCircle size={20} />}
          {importStatus.type === 'error' && <AlertCircle size={20} />}
          <span>{importStatus.message}</span>
          <button 
            onClick={() => setImportStatus(null)}
            className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default TopButtonsRow;
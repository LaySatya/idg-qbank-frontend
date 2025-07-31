import React, { useState, useRef } from 'react';
import CreateQuestionModal from './CreateQuestionModal';
import { ChevronDown, Check, Upload, Plus, AlertCircle, CheckCircle, FolderOpen, ArrowLeft, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
const TopButtonsRow = ({
  // Define handlePreviewClick to fix ReferenceError
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
  // Define handlePreviewClick inside the component after props
  // Define handlePreviewClick inside the component
  const handlePreviewClick = () => {
    toast('Preview feature not implemented yet');
  };
  const [isImporting, setIsImporting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [loadingQuestionTypes, setLoadingQuestionTypes] = useState(false);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    if (!showQuestionsDropdown) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowQuestionsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQuestionsDropdown, setShowQuestionsDropdown]);

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
            // Open Moodle import form in new window/tab
            window.open(data.import_form_url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
            setTimeout(() => {}, 1000);
            return; // Success - stop trying other URLs
          }
        }
      } 
      catch (error) {
        console.log(` Error testing ${testCase.note}:`, error.message);
      }
    }
    // If all import URLs failed, fallback to local import
    console.log(' All import URLs failed. Falling back to local file import...');
    fileInputRef.current?.click();
  };

  // Handler to clear category localStorage and go back
  const handleBackToCourses = () => {
    localStorage.removeItem('questionCategoryId');
    localStorage.removeItem('questionCategoryName');
    localStorage.removeItem('questionCategoryContextId');
    if (typeof onBack === 'function') {
      onBack();
    }
  };

  // Define handleFileChange to fix ReferenceError
  const handleFileChange = async (event) => {
    if (!event || !event.target || !event.target.files) {
      return;
    }
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const fileContent = await file.text();
      let parsedQuestions = [];
      // You may want to implement parseXMLQuestions and parseJSONQuestions as needed
      if (file.name.endsWith('.xml')) {
        // parsedQuestions = parseXMLQuestions(fileContent);
        toast('XML import not implemented');
      } else if (file.name.endsWith('.json')) {
        // parsedQuestions = parseJSONQuestions(fileContent);
        toast('JSON import not implemented');
      } else {
        throw new Error('Unsupported file format. Please use XML or JSON files.');
      }
      // Further logic for handling parsedQuestions can be added here
    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  // ...existing code...

  return (
    <div className="w-full border-2 border-white shadow-sm mb-4">
      <div className="py-3 px-5 flex flex-col justify-between md:flex-row md:items-center md:justify-between gap-4">
        {/* Back Button and Course Info - show when coming from courses */}
        {showBackButton && (
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <button
              type="button"
              onClick={handleBackToCourses}
              className="w-full md:w-auto flex items-center gap-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-200 transition-colors duration-200"
              title={backButtonText}
              style={{ minWidth: 120 }}
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
          {/* Import/Export Dropdown and other actions */}
          {(currentView === 'questions' || !currentView) && (
            <>
              <div className="relative inline-block text-left" ref={dropdownRef}>
                <button
                  type="button"
                  className="w-full md:w-auto flex items-center gap-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-200 transition-colors duration-200"
                  onClick={() => setShowQuestionsDropdown(prev => !prev)}
                  aria-haspopup="true"
                  aria-expanded={showQuestionsDropdown}
                  style={{ minWidth: 120 }}
                >
                  Import/Export
                  <ChevronDown size={18} />
                </button>
                {showQuestionsDropdown && (
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-gray-100 ring-opacity-60 z-10">
                    <div className="py-1">
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:text-gray-900 rounded-md"
                        onClick={() => {
                          setShowQuestionsDropdown(false);
                          handleImportClick();
                        }}
                        disabled={isImporting}
                        style={{ minWidth: 120 }}
                      >
                        {isImporting ? 'Importing...' : 'Import Questions'}
                        <Upload size={16} className="ml-2 inline" />
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:text-gray-900 rounded-md"
                        onClick={() => {
                          setShowQuestionsDropdown(false);
                          handleExportClick();
                        }}
                        style={{ minWidth: 120 }}
                      >
                        Export Questions
                        <FolderOpen size={16} className="ml-2 inline" />
                      </button>
                    </div>
                  </div>
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

              <button
                type="button"
                className="w-full md:w-auto flex items-center gap-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handlePreviewClick}
                title="Preview all questions in selected category"
                style={{ minWidth: 120 }}
              >
                Preview Questions
                <Eye size={18} />
              </button>

              <button
                type="button"
                className="w-full md:w-auto flex items-center gap-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCreateQuestion}
                title="Create new question in selected category"
                style={{ minWidth: 120 }}
              >
                Create New Question
                <Plus size={18} />
              </button>
            </>
          )}
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
// ...existing code...
}

export default TopButtonsRow;
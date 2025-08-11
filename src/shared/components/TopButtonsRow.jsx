import React, { useState, useRef } from 'react';
import CreateQuestionModal from './CreateQuestionModal';
import { ChevronDown, Check, Upload, Plus, AlertCircle, CheckCircle, FolderOpen, ArrowLeft, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TopButtonsRow = ({
  showQuestionsDropdown,
  setShowQuestionsDropdown,
  questionsDropdownRef,
  handleFileUpload,
  showQuestionText,
  setShowQuestionText,
  questions,
  setCurrentPage,
  questionsPerPage,
  setQuestions,
  totalQuestions,
  setTotalQuestions,
  setShowCategoriesModal,
  currentView = 'questions', // default to questions view
  setCurrentView,
  onNavigate,
  showBackButton = false,
  backButtonText = 'Back to Courses',
  onBack,
  selectedCourseName
}) => {
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  // Modal states for Import/Export/Create
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportUrl, setExportUrl] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [showCreateModalIframe, setShowCreateModalIframe] = useState(false);
  const [createUrl, setCreateUrl] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [showTypeSelectModal, setShowTypeSelectModal] = useState(false);
  const [selectedQType, setSelectedQType] = useState("");

  const handleExportClick = async () => {
    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const categoryId = localStorage.getItem('questionCategoryId');
    const contextId = localStorage.getItem('questionCategoryContextId') || '1';
    if (!categoryId || categoryId === 'All') {
      toast.error('Please select a category first.');
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
      const data = await response.json();
      if (data.export_form_url) {
        window.open(data.export_form_url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        toast.success('Export form opened!');
      } else {
        toast.error('No export URL received from server.');
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const handlePreviewClick = async () => {
    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const categoryId = localStorage.getItem('questionCategoryId');
    if (!categoryId || categoryId === 'All') {
      toast.error('Please select a category first.');
      return;
    }
    try {
      const url = `${API_BASE_URL}/questions/multi_preview?categoryid=${categoryId}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (data.multi_preview_url) {
        window.open(data.multi_preview_url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        toast.success('Preview opened!');
      } else {
        toast.error('No preview URL received from server.');
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
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
    if (value.includes('import')) {
      handleImportClick();
      return;
    }
    
    // Handle different navigation options
    if (value.includes('categories')) {
      if (setCurrentView) setCurrentView('categories');
      if (onNavigate) onNavigate('categories');
    } else if (value.includes('export')) {
      if (setCurrentView) setCurrentView('export');
      if (onNavigate) onNavigate('export');
    } else if (value.includes('edit')) {
      if (setCurrentView) setCurrentView('questions');
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

  // File import click
  const handleImportClick = async () => {
    console.log('\n === MOODLE IMPORT REDIRECT ===');

    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const courseId = localStorage.getItem('CourseID');
    const categoryId = localStorage.getItem('questionCategoryId');

    console.log(' Real category ID from your system:', categoryId);

    const testCases = [
      { categoryid: categoryId, contextid: '115135', note: 'Real category ID with discovered context 115135' },
      { categoryid: categoryId, contextid: '1', note: 'Real category ID with context 1' },
      { categoryid: categoryId, contextid: courseId, note: 'Real category ID with course context' },
      { categoryid: '7', contextid: '1', note: 'Known working: category 7' },
      { categoryid: '8', contextid: '1', note: 'Known working: category 8' },
    ];

    console.log(' Testing import URLs in order of preference...');

    for (const testCase of testCases) {
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
            window.open(data.import_form_url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
            setTimeout(() => {}, 1000);
            return;
          }
        }
      } 
      catch (error) {
        console.log(` Error testing ${testCase.note}:`, error.message);
      }
    }
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
      if (file.name.endsWith('.xml')) {
        toast('XML import not implemented');
      } else if (file.name.endsWith('.json')) {
        toast('JSON import not implemented');
      } else {
        throw new Error('Unsupported file format. Please use XML or JSON files.');
      }
    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  // Handle type selection from modal
  const handleSelectType = async (typeObj) => {
    setShowCreateModal(false);
    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const categoryId = localStorage.getItem('questionCategoryId');
    const contextId = localStorage.getItem('questionCategoryContextId') || '1';
    const qtype = typeObj.value || typeObj.name;

    if (!categoryId || categoryId === 'All') {
      toast.error('Please select a category first.');
      return;
    }

    try {
      const url = `${API_BASE_URL}/questions/create?qtype=${qtype}&categoryid=${categoryId}&contextid=${contextId}`;
      console.log('[CreateQuestion] Request URL:', url);
      console.log('[CreateQuestion] Token:', token);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text;
      }
      console.log('[CreateQuestion] Response:', data);
      if (response.ok && data.create_form_url) {
        window.open(data.create_form_url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        toast.success('Question creation form opened!');
      } else {
        toast.error('No form URL received from server.');
        if (data && data.message) {
          toast.error(`Server message: ${data.message}`);
        }
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  // Responsive iframe component
  function ResponsiveIframe({ src, title }) {
    return (
      <div style={{
        position: 'relative',
        width: '80vw',
        maxWidth: 1100,
        minWidth: 320,
        paddingBottom: '50%',
        height: 0,
        overflow: 'hidden',
        background: '#f9f9f9'
      }}>
        <iframe
          src={src}
          title={title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 0
          }}
          allowFullScreen
        />
      </div>
    );
  }

  // Loader-enhanced iframe component
  function IframeWithLoader({ src, title }) {
    const [loading, setLoading] = React.useState(true);
    return (
      <div style={{
        position: 'relative',
        width: '80vw',
        maxWidth: 1100,
        minWidth: 320,
        paddingBottom: '55%',
        height: 0,
        overflow: 'hidden',
        background: '#f9f9f9'
      }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255,255,255,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            <span style={{ marginLeft: 16, fontSize: 18, color: '#2563eb' }}>Loading...</span>
          </div>
        )}
        <iframe
          src={src}
          title={title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 0,
            zIndex: 1
          }}
          allowFullScreen
          onLoad={() => setLoading(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-full border-2 border-white shadow-sm mb-4">
      <div className="py-3 px-5 flex flex-col justify-between md:flex-row md:items-center md:justify-between gap-4">
        {/* Back Button and Course Info */}
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
                        onClick={async () => {
                          setShowQuestionsDropdown(false);
                          setImportLoading(true);
                          setShowImportModal(true);
                          setImportUrl("");
                          const token = localStorage.getItem('token');
                          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
                          const courseId = localStorage.getItem('CourseID');
                          const categoryId = localStorage.getItem('questionCategoryId');
                          const contextId = localStorage.getItem('questionCategoryContextId') || '1';
                          if (!categoryId || categoryId === 'All') {
                            toast.error('Please select a category first.');
                            setImportLoading(false);
                            return;
                          }
                          try {
                            const url = `${API_BASE_URL}/questions/import?categoryid=${categoryId}&contextid=${contextId}&courseid=${courseId}`;
                            const response = await fetch(url, {
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/json'
                              }
                            });
                            const data = await response.json();
                            if (data.import_form_url) {
                              setImportUrl(data.import_form_url);
                            } else {
                              toast.error('No import URL received from server.');
                            }
                          } catch (error) {
                            toast.error(`Error: ${error.message}`);
                          } finally {
                            setImportLoading(false);
                          }
                        }}
                        style={{ minWidth: 120 }}
                      >
                        Import Questions
                        <Upload size={16} className="ml-2 inline" />
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:text-gray-900 rounded-md"
                        onClick={async () => {
                          setShowQuestionsDropdown(false);
                          setExportLoading(true);
                          setShowExportModal(true);
                          setExportUrl("");
                          const token = localStorage.getItem('token');
                          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
                          const categoryId = localStorage.getItem('questionCategoryId');
                          const contextId = localStorage.getItem('questionCategoryContextId') || '1';
                          if (!categoryId || categoryId === 'All') {
                            toast.error('Please select a category first.');
                            setExportLoading(false);
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
                            const data = await response.json();
                            if (data.export_form_url) {
                              setExportUrl(data.export_form_url);
                            } else {
                              toast.error('No export URL received from server.');
                            }
                          } catch (error) {
                            toast.error(`Error: ${error.message}`);
                          } finally {
                            setExportLoading(false);
                          }
                        }}
                        style={{ minWidth: 120 }}
                      >
                        Export Questions
                        <FolderOpen size={16} className="ml-2 inline" />
                      </button>
                    </div>
                  </div>
                )}
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
                onClick={async () => {
                  setPreviewLoading(true);
                  setShowPreviewModal(true);
                  setPreviewUrl("");
                  const token = localStorage.getItem('token');
                  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
                  const categoryId = localStorage.getItem('questionCategoryId');
                  if (!categoryId || categoryId === 'All') {
                    toast.error('Please select a category first.');
                    setPreviewLoading(false);
                    return;
                  }
                  try {
                    const url = `${API_BASE_URL}/questions/multi_preview?categoryid=${categoryId}`;
                    const response = await fetch(url, {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                      }
                    });
                    const data = await response.json();
                    if (data.multi_preview_url) {
                      setPreviewUrl(data.multi_preview_url);
                    } else {
                      toast.error('No preview URL received from server.');
                    }
                  } catch (error) {
                    toast.error(`Error: ${error.message}`);
                  } finally {
                    setPreviewLoading(false);
                  }
                }}
                title="Preview all questions in selected category"
                style={{ minWidth: 120 }}
              >
                Preview Questions
                <Eye size={18} />
              </button>

              <button
                type="button"
                className="w-full md:w-auto flex items-center gap-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={async () => {
                  setLoadingQuestionTypes(true);
                  setShowTypeSelectModal(true);
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
                }}
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

      {/* Preview Questions Modal */}
      {showPreviewModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="modal-container"
            style={{
              background: '#fff',
              padding: 8,
              borderRadius: 8,
              position: 'relative',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              width: '80vw',
              minWidth: 320,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowPreviewModal(false)} 
              style={{
                position: 'absolute',
                top: -15,
                right: -15,
                background: '#ef4444',
                border: 'none',
                borderRadius: '50%',
                width: 40,
                height: 40,
                fontSize: 20,
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 1001,
                fontWeight: 'bold'
              }}
              title="Close"
            >&times;</button>
            {previewLoading ? (
              <div style={{ padding: 40, textAlign: 'center', fontSize: 18 }}>Loading preview...</div>
            ) : previewUrl ? (
              <ResponsiveIframe src={previewUrl} title="Preview Questions" />
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>No preview available.</div>
            )}
          </div>
        </div>
      )}

      {/* Type Selection Modal */}
      {showTypeSelectModal && (
        <CreateQuestionModal
          onClose={() => setShowTypeSelectModal(false)}
          onSelectType={async (typeObj) => {
            setShowTypeSelectModal(false);
            setCreateLoading(true);
            setShowCreateModalIframe(true);
            setCreateUrl("");
            const token = localStorage.getItem('token');
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const categoryId = localStorage.getItem('questionCategoryId');
            const contextId = localStorage.getItem('questionCategoryContextId') || '1';
            const courseId = localStorage.getItem('CourseID');
            const qtype = typeObj.value || typeObj.name;
            if (!categoryId || categoryId === 'All') {
              toast.error('Please select a category first.');
              setCreateLoading(false);
              return;
            }
            try {
              const url = `${API_BASE_URL}/questions/create?qtype=${qtype}&categoryid=${categoryId}&contextid=${contextId}&courseid=${courseId}`;
              const response = await fetch(url, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json'
                }
              });
              const data = await response.json();
              if (data.create_form_url) {
                setCreateUrl(data.create_form_url);
              } else {
                toast.error('No create form URL received from server.');
              }
            } catch (error) {
              toast.error(`Error: ${error.message}`);
            } finally {
              setCreateLoading(false);
            }
          }}
          availableQuestionTypes={questionTypes}
          loadingQuestionTypes={loadingQuestionTypes}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="modal-container"
            style={{
              background: '#fff',
              padding: 8,
              borderRadius: 8,
              position: 'relative',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              width: '80vw',
              minWidth: 320,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowImportModal(false)} 
              style={{
                position: 'absolute',
                top: -15,
                right: -15,
                background: '#ef4444',
                border: 'none',
                borderRadius: '50%',
                width: 40,
                height: 40,
                fontSize: 20,
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 1001,
                fontWeight: 'bold'
              }}
              title="Close"
            >&times;</button>
            {importLoading ? (
              <div style={{ padding: 40, textAlign: 'center', fontSize: 18 }}>Loading import form...</div>
            ) : importUrl ? (
              <IframeWithLoader src={importUrl} title="Import Questions" />
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>No import form available.</div>
            )}
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="modal-container"
            style={{
              background: '#fff',
              padding: 8,
              borderRadius: 8,
              position: 'relative',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              width: '80vw',
              minWidth: 320,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowExportModal(false)} 
              style={{
                position: 'absolute',
                top: -15,
                right: -15,
                background: '#ef4444',
                border: 'none',
                borderRadius: '50%',
                width: 40,
                height: 40,
                fontSize: 20,
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 1001,
                fontWeight: 'bold'
              }}
              title="Close"
            >&times;</button>
            {exportLoading ? (
              <div style={{ padding: 40, textAlign: 'center', fontSize: 18 }}>Loading export form...</div>
            ) : exportUrl ? (
              <IframeWithLoader src={exportUrl} title="Export Questions" />
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>No export form available.</div>
            )}
          </div>
        </div>
      )}

      {/* Create New Question Modal (iframe) */}
      {showCreateModalIframe && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowCreateModalIframe(false)}
        >
          <div
            className="modal-container"
            style={{
              background: '#fff',
              padding: 8,
              borderRadius: 8,
              position: 'relative',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              width: '80vw',
              minWidth: 320,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowCreateModalIframe(false)} 
              style={{
                position: 'absolute',
                top: -15,
                right: -15,
                background: '#ef4444',
                border: 'none',
                borderRadius: '50%',
                width: 40,
                height: 40,
                fontSize: 20,
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 1001,
                fontWeight: 'bold'
              }}
              title="Close"
            >&times;</button>
            {createLoading ? (
              <div style={{ padding: 40, textAlign: 'center', fontSize: 18 }}>Loading create form...</div>
            ) : createUrl ? (
              <IframeWithLoader src={createUrl} title="Create New Question" />
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>No create form available.</div>
            )}
          </div>
        </div>
      )}

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
// ============================================================================
// src/shared/components/QuestionHistoryView.jsx
// ============================================================================
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const QuestionHistoryView = ({ 
  question,
  onBack,
  onPreview,
  onRevert 
}) => {
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load question history when component mounts
  useEffect(() => {
    if (question) {
      loadQuestionHistory();
    }
  }, [question]);

  const loadQuestionHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/questions/history?qbankentryid=${question.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setHistoryData(data);
    } catch (error) {
      console.error('Error loading question history:', error);
      setError(error.message);
      toast.error('Failed to load question history');
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get question type icon
  const getQuestionTypeIcon = (qtype) => {
    switch (qtype) {
      case 'multichoice':
        return <img src="/src/assets/icon/Multiple-choice.svg" className="w-6 h-6" alt="Multiple Choice" />;
      case 'matching':
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

  // Handle preview version
  const handlePreviewVersion = (version) => {
    console.log('Preview version:', version);
    if (onPreview) {
      onPreview(version);
    }
  };

  // Handle revert to version
  const handleRevertToVersion = (version) => {
    if (window.confirm(`Are you sure you want to revert to version ${version.version}? This will create a new version based on the selected version.`)) {
      console.log('Revert to version:', version);
      if (onRevert) {
        onRevert(version);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-black bg-sky-100 hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <i className="fa fa-arrow-left mr-2"></i>
            Back to Questions
          </button>
        </div>
        <div className="text-right">
          <h3 className="text-lg font-semibold text-gray-900">Question History</h3>
          <p className="text-sm text-blue-700">
            {question.name || question.title} (ID: {question.id})
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading history...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600">
              <i className="fa fa-exclamation-circle mr-2"></i>
              Error loading history: {error}
            </div>
          </div>
        </div>
      )}

      {/* History Table - Exact same as questions table */}
      {historyData && historyData.versions && (
        <div className="overflow-x-auto" style={{ minHeight: '300px', height: 'unset', maxHeight: 'unset', overflowY: 'auto' }}>
          <table id="categoryquestions" className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
                  Version
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
              {historyData.versions.map((version, index) => (
                <tr key={version.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                  {/* Version Badge */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-blue-800">
                        v{version.version}
                      </span>
                      {version.version === 1 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-green-800">
                          Original
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* Question text and content */}
                  <td className="px-3 py-4">
                    <div className="flex flex-col items-start w-full">
                      <div className="w-full mb-2">
                        <span className="inline-flex items-center group">
                          <span className="ml-2 text-black font-semibold">
                            {version.name || '(No title)'}
                          </span>
                        </span>
                        <span className="ml-1">
                          <span className="sr-only">ID number</span>&nbsp;
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-small bg-grey-100 text-grey-800">ID {version.questionid}</span>
                        </span>
                      </div>
                      {/* Render question text as HTML if present */}
                      {version.questiontext && (
                        <div className="text-xs text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: version.questiontext }} />
                      )}
                    </div>
                  </td>
                  
                  {/* Status Column */}
                  <td className="px-3 py-4 whitespace-nowrap w-32 min-w-[110px]">
                    <div className="relative">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        version.status === 'ready' ? 'bg-gray-100 text-green-800' :
                        version.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {version.status}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-3 py-4 whitespace-nowrap">
                    <a href="#" className="text-blue-600 hover:text-blue-900">
                      0
                    </a>
                  </td>
                  
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">v{version.version}</td>
                  
                  <td className="px-3 py-4 whitespace-nowrap">
                    <a href="#" className="text-blue-600 hover:text-blue-900">
                      0
                    </a>
                  </td>
                  
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">Never</span>
                  </td>
                  
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {version.createdbyuser ? 
                        `${version.createdbyuser.firstname} ${version.createdbyuser.lastname}` : 
                        `User ${version.createdby}`
                      }
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">{formatDate(version.timecreated)}</span>
                  </td>
                  
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {version.modifiedbyuser ? 
                        `${version.modifiedbyuser.firstname} ${version.modifiedbyuser.lastname}` : 
                        `User ${version.modifiedby}`
                      }
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">{formatDate(version.timemodified)}</span>
                  </td>
                  
                  <td className="px-3 py-4 whitespace-nowrap">
                    {getQuestionTypeIcon(version.qtype)}
                  </td>
                  
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="relative" data-enhance="moodle-core-actionmenu">
                      <div className="flex">
                        <div className="relative">
                          <div>
                            <a 
                              href="#" 
                              className="text-blue-600 hover:text-blue-900 focus:outline-none" 
                              aria-label="Preview" 
                              role="button" 
                              onClick={(e) => {
                                e.preventDefault();
                                handlePreviewVersion(version);
                              }}
                            >
                              Preview
                            </a>
                            <span className="mx-1 text-gray-400">|</span>
                            <a 
                              href="#" 
                              className="text-green-600 hover:text-green-900 focus:outline-none" 
                              aria-label="Revert" 
                              role="button" 
                              onClick={(e) => {
                                e.preventDefault();
                                handleRevertToVersion(version);
                              }}
                            >
                              Revert
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No History */}
      {historyData && (!historyData.versions || historyData.versions.length === 0) && (
        <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
          No version history found.
        </div>
      )}
    </div>
  );
};

export default QuestionHistoryView;
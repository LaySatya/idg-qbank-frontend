import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
  IconButton
} from '@mui/material';

import { 
  Close as CloseIcon, 
  Warning as WarningIcon, 
  Delete as DeleteIcon,
  ArrowBackIos as ArrowBackIosIcon 
} from '@mui/icons-material';

import PaginationControls from './PaginationControls';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const QuestionHistoryView = ({ 
  question,
  onBack,
  onPreview,
  onRevert // not used anymore
}) => {
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingVersions, setDeletingVersions] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState(null);

  // Dropdown state for actions
  const [openActionDropdowns, setOpenActionDropdowns] = useState([]);
  const dropdownRefs = useRef({});
  const [dropdownDirection, setDropdownDirection] = useState({});
  const [questionData, setQuestionData] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (question?.questionbankentryid) {
      fetch(`${API_BASE_URL}/questions/entry/${question.questionbankentryid}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error('Question not found');
          }
          return res.json();
        })
        .then(data => {
          setQuestionData(data);
        })
        .catch(err => {
          setQuestionData(null);
          toast.error('Question not found');
        });
    }
  }, [question?.questionbankentryid]);

  useEffect(() => {
    loadQuestionHistory(page, itemsPerPage);
    // eslint-disable-next-line
  }, [question?.questionbankentryid, page, itemsPerPage]);

  useEffect(() => {
    if (openActionDropdowns.length === 0) return;

    const handleClickOutside = (event) => {
      let clickedInside = false;
      openActionDropdowns.forEach(id => {
        const ref = dropdownRefs.current[id];
        if (ref && ref.contains(event.target)) {
          clickedInside = true;
        }
      });
      if (!clickedInside) {
        setOpenActionDropdowns([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionDropdowns]);

  const loadQuestionHistory = async (pageNum = 1, perPage = 10) => {
    const qbankId = question?.questionbankentryid;
    if (!qbankId) {
      toast.error('Missing question bank entry ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/questions/history?qbankentryid=${qbankId}&page=${pageNum}&per_page=${perPage}`, {
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
        return <span className="text-gray-400">?</span>;
    }
  };

  // Preview in Moodle logic (replace with your API call/modal logic)
  const handlePreviewMoodle = async (version) => {
    toast.success(`Preview in Moodle for version ${version.version}`);
  };

  // Comments modal logic (replace with your modal logic)
  const openCommentsModal = (version) => {
    toast.success(`Open comments for version ${version.version}`);
  };

  // Handle delete version
  const handleDeleteVersion = async (version) => {
    setVersionToDelete(version);
    setShowDeleteModal(true);
  };

  // Confirm delete version
  const confirmDeleteVersion = async () => {
    if (!versionToDelete) return;
    const version = versionToDelete;
    setShowDeleteModal(false);
    setDeletingVersions(prev => new Set([...prev, version.questionid]));
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/questions/delete_specific_versions?questionid[]=${version.questionid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.errors && data.errors.length > 0 && data.errors[0]) {
        toast.error(data.errors[0]);
      } else {
        const isCurrentVersion = version.version === latestVersionNumber;
        if (isCurrentVersion) {
          toast.success(`Current version ${version.version} deleted successfully. Previous version is now current.`);
        } else {
          toast.success(`Version ${version.version} deleted successfully`);
        }
      }
      await loadQuestionHistory(page, itemsPerPage);
    } catch (error) {
      toast.error('Failed to delete version. Please try again.');
    } finally {
      setDeletingVersions(prev => {
        const newSet = new Set(prev);
        newSet.delete(version.questionid);
        return newSet;
      });
      setVersionToDelete(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setVersionToDelete(null);
  };

  // Calculate the latest version
  const latestVersionNumber = historyData?.versions?.length > 0 
    ? Math.max(...historyData.versions.map(v => v.version)) 
    : null;

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button 
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex-shrink-0"
          >
            <ArrowBackIosIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Question History</h3>
            {questionData ? (
              <p className="text-xs sm:text-sm text-blue-600 truncate">
                {questionData?.name || questionData?.title} (ID: {questionData?.id})
              </p>
            ) : (
              historyData?.versions?.length > 0 ? null : (
                <p className="text-xs sm:text-sm text-red-600 truncate">
                  Question not found
                </p>
              )
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-0">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600">Loading history...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 sm:p-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded text-sm">
              Error loading history: {error}
            </div>
          </div>
        )}

        {/* History Table - Desktop */}
        {historyData && historyData.versions && (
          <>
            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">
                      <div>
                        <div className="font-semibold">Question</div>
                        <div className="text-xs text-gray-400">Question name / ID number</div>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Comments
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Version
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Usage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Last used
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                      <div>
                        <div className="font-semibold">Created by</div>
                        <div className="text-xs text-gray-400">First name / Last name / Date</div>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                      <div>
                        <div className="font-semibold">Modified by</div>
                        <div className="text-xs text-gray-400">First name / Last name / Date</div>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historyData.versions.map((version, index) => (
                    <tr 
                      key={version.id} 
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      {/* Version Badge */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            v{version.version}
                          </span>
                          {version.version === latestVersionNumber && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Current
                            </span>
                          )}
                          {version.version === 1 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Original
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Question text and content */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <div className="mb-2">
                            <div className="font-medium text-gray-900">
                              {version.name || '(No title)'}
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                              ID {version.questionid}
                            </span>
                          </div>
                          {version.questiontext && (
                            <div 
                              className="text-sm text-gray-600 line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: version.questiontext }}
                            />
                          )}
                        </div>
                      </td>
                      
                      {/* Status Column */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          version.status === 'ready' ? 'bg-green-100 text-green-800' : 
                          version.status === 'draft' ? 'bg-orange-100 text-orange-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {version.status}
                        </span>
                      </td>
                      
                      {/* Comments */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                        {version.comments || 0}
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        v{version.version}
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                        0
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        Never
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {version.createdbyuser ? 
                            `${version.createdbyuser.firstname} ${version.createdbyuser.lastname}` : 
                            `User ${version.createdby}`
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(version.timecreated)}
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {version.modifiedbyuser ? 
                            `${version.modifiedbyuser.firstname} ${version.modifiedbyuser.lastname}` : 
                            `User ${version.modifiedby}`
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(version.timemodified)}
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex justify-center">
                          {getQuestionTypeIcon(version.qtype)}
                        </div>
                      </td>
                      
                      {/* Actions Dropdown */}
                      <td className="px-4 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="relative">
                          <div className="flex">
                            <div className="relative" ref={el => {
                              if (dropdownRefs?.current) {
                                dropdownRefs.current[version.id] = el;
                              }
                            }}>
                              <a
                                href="#"
                                className="text-gray-700 hover:text-blue-700 focus:outline-none cursor-pointer flex items-center"
                                aria-label="Actions"
                                role="button"
                                aria-haspopup="true"
                                aria-expanded={openActionDropdowns.includes(version.id)}
                                onClick={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (dropdownRefs?.current?.[version.id]) {
                                    const el = dropdownRefs.current[version.id];
                                    const rect = el.getBoundingClientRect();
                                    const dropdownHeight = 150;
                                    const spaceBelow = window.innerHeight - rect.bottom;
                                    setDropdownDirection(prev => ({
                                      ...prev,
                                      [version.id]: spaceBelow < dropdownHeight ? 'up' : 'down'
                                    }));
                                  }
                                  setOpenActionDropdowns(prev =>
                                    prev.includes(version.id)
                                      ? prev.filter(id => id !== version.id)
                                      : [...prev, version.id]
                                  );
                                }}
                              >
                                <i className="fa fa-ellipsis-h mr-1"></i>
                                Edit
                              </a>
                              {openActionDropdowns.includes(version.id) && (() => {
                                const el = dropdownRefs.current[version.id];
                                if (!el) return null;
                                const elRect = el.getBoundingClientRect();
                                const dropdownHeight = 150;
                                const direction = dropdownDirection[version.id] || 'down';
                                let left = elRect.left;
                                let top = direction === 'up'
                                  ? elRect.top - dropdownHeight
                                  : elRect.bottom;
                                const maxTop = window.innerHeight - dropdownHeight - 8;
                                if (direction === 'down' && top > maxTop) top = maxTop;
                                if (direction === 'up' && top < 8) top = 8;
                                const maxLeft = window.innerWidth - 240;
                                if (left > maxLeft) left = maxLeft;
                                if (left < 8) left = 8;
                                return ReactDOM.createPortal(
                                  <div
                                    className={`absolute w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1 ${direction === 'up' ? 'mb-2' : 'mt-2'}`}
                                    style={{
                                      left,
                                      top,
                                      position: 'fixed'
                                    }}
                                    onMouseDown={e => e.stopPropagation()}
                                  >
                                    {/* Preview in Moodle */}
                                    <a
                                      href="#"
                                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-700 transition-colors cursor-pointer"
                                      role="menuitem"
                                      tabIndex="-1"
                                      onClick={async e => {
                                        e.preventDefault();
                                        await handlePreviewMoodle(version);
                                        setOpenActionDropdowns(prev => prev.filter(id => id !== version.id));
                                      }}
                                    >
                                      <i className="fa fa-eye mr-2 text-blue-500"></i>
                                      <span>Preview in Moodle</span>
                                    </a>
                                    {/* Comments */}
                                    <a
                                      href="#"
                                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-700 transition-colors cursor-pointer"
                                      role="menuitem"
                                      tabIndex="-1"
                                      onClick={e => {
                                        e.preventDefault();
                                        openCommentsModal(version);
                                        setOpenActionDropdowns(prev => prev.filter(id => id !== version.id));
                                      }}
                                    >
                                      <i className="fa fa-comment mr-2 text-blue-500"></i>
                                      <span>Comments ({version.comments || 0})</span>
                                    </a>
                                    {/* Delete */}
                                    <a
                                      href="#"
                                      className={`flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900 transition-colors cursor-pointer${deletingVersions.has(version.questionid) ? ' opacity-50 cursor-not-allowed' : ''}`}
                                      role="menuitem"
                                      tabIndex="-1"
                                      onClick={e => {
                                        e.preventDefault();
                                        if (!deletingVersions.has(version.questionid)) {
                                          handleDeleteVersion(version);
                                          setOpenActionDropdowns(prev => prev.filter(id => id !== version.id));
                                        }
                                      }}
                                    >
                                      <i className="fa fa-trash mr-2 text-red-500"></i>
                                      <span>
                                        {deletingVersions.has(version.questionid) ? (
                                          <span className="flex items-center gap-1">
                                            <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                            Deleting...
                                          </span>
                                        ) : (
                                          'Delete'
                                        )}
                                      </span>
                                    </a>
                                  </div>,
                                  document.body
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>
                     
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              {historyData.total > 0 && (
                <PaginationControls
                  currentPage={historyData.current_page}
                  totalPages={historyData.last_page}
                  totalItems={historyData.total}
                  itemsPerPage={historyData.per_page}
                  onPageChange={setPage}
                  onItemsPerPageChange={setItemsPerPage}
                  isLoading={loading}
                  className="mt-2"
                />
              )}
            </div>

            {/* Mobile Card View - Visible on mobile and tablet */}
            <div className="lg:hidden">
              <div className="divide-y divide-gray-200">
                {historyData.versions.map((version, index) => (
                  <div key={version.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                    {/* Mobile Card Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          v{version.version}
                        </span>
                        {version.version === latestVersionNumber && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Current
                          </span>
                        )}
                        {version.version === 1 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Original
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {getQuestionTypeIcon(version.qtype)}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                          version.status === 'ready' ? 'bg-green-100 text-green-800' : 
                          version.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {version.status}
                        </span>
                      </div>
                    </div>

                    {/* Question Info */}
                    <div className="mb-3">
                      <div className="font-medium text-gray-900 mb-1">
                        {version.name || '(No title)'}
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        ID {version.questionid}
                      </span>
                      {version.questiontext && (
                        <div 
                          className="text-sm text-gray-600 mt-2 line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: version.questiontext }}
                        />
                      )}
                    </div>

                    {/* Mobile Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div>
                        <span className="text-gray-500 block">Created by</span>
                        <span className="text-gray-900 font-medium">
                          {version.createdbyuser ? 
                            `${version.createdbyuser.firstname} ${version.createdbyuser.lastname}` : 
                            `User ${version.createdby}`
                          }
                        </span>
                        <span className="text-gray-500 block text-xs">
                          {formatDate(version.timecreated)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Modified by</span>
                        <span className="text-gray-900 font-medium">
                          {version.modifiedbyuser ? 
                            `${version.modifiedbyuser.firstname} ${version.modifiedbyuser.lastname}` : 
                            `User ${version.modifiedby}`
                          }
                        </span>
                        <span className="text-gray-500 block text-xs">
                          {formatDate(version.timemodified)}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      <button 
                        className="flex-1 sm:flex-none px-3 py-2 text-xs text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 hover:text-blue-700 transition-colors flex items-center justify-center"
                        onClick={() => handlePreviewMoodle(version)}
                      >
                        <i className="fa fa-eye mr-2 text-blue-500"></i>
                        Preview in Moodle
                      </button>
                      <button 
                        className="flex-1 sm:flex-none px-3 py-2 text-xs text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 hover:text-blue-700 transition-colors flex items-center justify-center"
                        onClick={() => openCommentsModal(version)}
                      >
                        <i className="fa fa-comment mr-2 text-blue-500"></i>
                        Comments ({version.comments || 0})
                      </button>
                      <button 
                        className="flex-1 sm:flex-none px-3 py-2 text-xs text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center disabled:opacity-50"
                        onClick={() => handleDeleteVersion(version)}
                        disabled={deletingVersions.has(version.questionid)}
                      >
                        <i className="fa fa-trash mr-2 text-red-500"></i>
                        {deletingVersions.has(version.questionid) ? (
                          <span className="flex items-center justify-center gap-1">
                            <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            Deleting...
                          </span>
                        ) : (
                          'Delete'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                {/* Pagination Controls for mobile */}
                {historyData.total > 0 && (
                  <PaginationControls
                    currentPage={historyData.current_page}
                    totalPages={historyData.last_page}
                    totalItems={historyData.total}
                    itemsPerPage={historyData.per_page}
                    onPageChange={setPage}
                    onItemsPerPageChange={setItemsPerPage}
                    isLoading={loading}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* No History */}
        {historyData && (!historyData.versions || historyData.versions.length === 0) && (
          <div className="flex items-center justify-center py-8 sm:py-12 text-gray-500">
            <div className="text-center">
              <p className="text-sm sm:text-base">No version history found.</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={showDeleteModal}
        onClose={cancelDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 3
          }
        }}
      >
        {/* Modal Header */}
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1,
          fontWeight: 600
        }}>
          Delete Version {versionToDelete?.version}
          <IconButton 
            onClick={cancelDelete}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { 
                backgroundColor: 'action.hover' 
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Modal Body */}
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Box sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {/* <WarningIcon sx={{ color: 'error.main', fontSize: 24 }} /> */}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                Are you sure you want to delete this version?
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" component="span">
                    <strong>Version:</strong> {versionToDelete?.version}
                  </Typography>
                  {versionToDelete?.version === latestVersionNumber && (
                    <Chip 
                      label="Current" 
                      size="small" 
                      sx={{ 
                        ml: 1,
                        backgroundColor: 'success.light',
                        color: 'success.dark',
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}
                    />
                  )}
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Question:</strong> {versionToDelete?.name || '(No title)'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Question ID:</strong> {versionToDelete?.questionid}
                </Typography>
              </Box>
              
              {versionToDelete?.version === latestVersionNumber && (
                <Alert 
                  severity="warning" 
                  sx={{ mb: 2 }}
                  icon={<WarningIcon fontSize="inherit" />}
                >
                  <Typography variant="body2">
                    <strong>Note:</strong> This is the current version. Deleting it will automatically promote the previous version to become the new current version.
                  </Typography>
                </Alert>
              )}
              
              <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 500 }}>
                This action cannot be undone.
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        {/* Modal Footer */}
        <DialogActions sx={{ 
          px: 3, 
          pb: 3, 
          pt: 1,
          backgroundColor: 'grey.50',
          gap: 1
        }}>
          <Button
            onClick={cancelDelete}
            variant="outlined"
            color="inherit"
            sx={{ 
              borderColor: 'grey.300',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'grey.400',
                backgroundColor: 'grey.50'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteVersion}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            sx={{ 
              fontWeight: 500,
              '&:hover': {
                backgroundColor: 'error.dark'
              }
            }}
          >
            Delete Version
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default QuestionHistoryView;
// ============================================================================
// src/shared/components/QuestionHistoryView.jsx
// ============================================================================
import React, { useState, useEffect } from 'react';
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Close as CloseIcon, Warning as WarningIcon, Delete as DeleteIcon } from '@mui/icons-material';

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
  const [deletingVersions, setDeletingVersions] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState(null);

  // Load question history when component mounts or question changes
  useEffect(() => {
    if (question) {
      loadQuestionHistory();
    }
  }, [question]);

  const loadQuestionHistory = async () => {
    const qbankId = question?.questionbankentryid;

    if (!qbankId) {
      toast.error('Missing question bank entry ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/questions/history?qbankentryid=${qbankId}`, {
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
        return <span className="text-gray-400">?</span>;
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
      
      // Always refresh the history data after a successful API call
      await loadQuestionHistory();
      
    } catch (error) {
      console.error('Error deleting version:', error);
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
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <ArrowBackIcon className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Question History</h3>
            <p className="text-sm text-blue-600">
              {question?.name || question?.title} (ID: {question?.id})
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-0">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading history...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Error loading history: {error}
            </div>
          </div>
        )}

        {/* History Table */}
        {historyData && historyData.versions && (
          <div className="overflow-x-auto">
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
                        version.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {version.status}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                      0
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
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button 
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          onClick={() => handlePreviewVersion(version)}
                        >
                          Preview
                        </button>
                        <span className="text-gray-300">|</span>
                        <button 
                          className="text-green-600 hover:text-green-800 text-sm"
                          onClick={() => handleRevertToVersion(version)}
                        >
                          Revert
                        </button>
                        <span className="text-gray-300">|</span>
                        <button 
                          className="text-red-600 hover:text-red-800 text-sm"
                          onClick={() => handleDeleteVersion(version)}
                          disabled={deletingVersions.has(version.questionid)}
                        >
                          {deletingVersions.has(version.questionid) ? (
                            <span className="flex items-center gap-1">
                              <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              Deleting...
                            </span>
                          ) : (
                            'Delete'
                          )}
                        </button>
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
          <div className="flex items-center justify-center py-12 text-gray-500">
            <p>No version history found.</p>
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
              backgroundColor: 'error.light',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <WarningIcon sx={{ color: 'error.main', fontSize: 24 }} />
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

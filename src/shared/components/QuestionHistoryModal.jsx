// ============================================================================
// src/shared/components/QuestionHistoryModal.jsx
// ============================================================================
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography, 
  CircularProgress, 
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton
} from '@mui/material';
import { Close as CloseIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const QuestionHistoryModal = ({ 
  open,
  onClose,
  question,
  onPreview,
  onRevert 
}) => {
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load question history when component mounts or question changes
  useEffect(() => {
    if (open && question) {
      loadQuestionHistory();
    }
  }, [open, question]);
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
  // Add this helper function to calculate the latest version
  const latestVersionNumber = historyData?.versions?.length > 0 
    ? Math.max(...historyData.versions.map(v => v.version)) 
    : null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '90vh',
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={onClose}
            sx={{ 
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              '&:hover': { backgroundColor: '#bfdbfe' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
              Question History
            </Typography>
            <Typography variant="body2" color="primary.main">
              {question?.name || question?.title} (ID: {question?.id})
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Loading State */}
        {loading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            py: 8,
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading history...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                Error loading history: {error}
              </Typography>
            </Alert>
          </Box>
        )}

        {/* History Table */}
        {historyData && historyData.versions && (
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                    Version
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', minWidth: 300 }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>Question</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Question name / ID number</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', width: 96 }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', width: 80 }}>
                    Comments
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', width: 80 }}>
                    Version
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', width: 80 }}>
                    Usage
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', width: 96 }}>
                    Last used
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', minWidth: 140 }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>Created by</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>First name / Last name / Date</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', minWidth: 140 }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>Modified by</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>First name / Last name / Date</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', width: 64 }}>
                    Type
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', width: 80 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyData.versions.map((version, index) => (
                  <TableRow 
                    key={version.id} 
                    hover
                    sx={{ 
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                      '&:hover': { backgroundColor: '#f1f5f9' }
                    }}
                  >
                    {/* Version Badge */}
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Chip 
                          label={`v${version.version}`} 
                          size="small" 
                          sx={{ 
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}
                        />
                        {version.version === latestVersionNumber && (
                          <Chip 
                            label="Current" 
                            size="small" 
                            sx={{ 
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          />
                        )}
                        {version.version === 1 && (
                          <Chip 
                            label="Original" 
                            size="small" 
                            sx={{ 
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    
                    {/* Question text and content */}
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {version.name || '(No title)'}
                          </Typography>
                          <Chip 
                            label={`ID ${version.questionid}`} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              ml: 1,
                              fontSize: '0.75rem',
                              height: 20
                            }}
                          />
                        </Box>
                        {version.questiontext && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.secondary',
                              mt: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                            dangerouslySetInnerHTML={{ __html: version.questiontext }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    
                    {/* Status Column */}
                    <TableCell>
                      <Chip 
                        label={version.status}
                        size="small"
                        sx={{
                          backgroundColor: version.status === 'ready' ? '#dcfce7' : 
                                         version.status === 'draft' ? '#fef3c7' : '#f1f5f9',
                          color: version.status === 'ready' ? '#15803d' : 
                                version.status === 'draft' ? '#d97706' : '#475569',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'primary.main', cursor: 'pointer' }}>
                        0
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        v{version.version}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'primary.main', cursor: 'pointer' }}>
                        0
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        Never
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {version.createdbyuser ? 
                            `${version.createdbyuser.firstname} ${version.createdbyuser.lastname}` : 
                            `User ${version.createdby}`
                          }
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {formatDate(version.timecreated)}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {version.modifiedbyuser ? 
                            `${version.modifiedbyuser.firstname} ${version.modifiedbyuser.lastname}` : 
                            `User ${version.modifiedby}`
                          }
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {formatDate(version.timemodified)}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {getQuestionTypeIcon(version.qtype)}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          size="small" 
                          variant="text" 
                          sx={{ 
                            color: 'primary.main',
                            fontSize: '0.75rem',
                            minWidth: 'auto',
                            p: 0.5
                          }}
                          onClick={() => handlePreviewVersion(version)}
                        >
                          Preview
                        </Button>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mx: 0.5 }}>
                          |
                        </Typography>
                        <Button 
                          size="small" 
                          variant="text" 
                          sx={{ 
                            color: 'success.main',
                            fontSize: '0.75rem',
                            minWidth: 'auto',
                            p: 0.5
                          }}
                          onClick={() => handleRevertToVersion(version)}
                        >
                          Revert
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* No History */}
        {historyData && (!historyData.versions || historyData.versions.length === 0) && (
          <Box sx={{ 
            minHeight: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary'
          }}>
            <Typography variant="body1">
              No version history found.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        px: 3,
        py: 2
      }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionHistoryModal;
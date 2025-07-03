import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Menu,
  MenuItem,
  IconButton,
  Paper,
  Stack,
  Checkbox,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BarChartIcon from '@mui/icons-material/BarChart';
import TagIcon from '@mui/icons-material/Tag';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import GroupIcon from '@mui/icons-material/Group';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BulkActionsRow = ({
  selectedQuestions,
  setSelectedQuestions,
  setShowBulkEditModal,
  onBulkDelete,
  onBulkStatusChange,
  questions,
  setQuestions
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);

  // Tag management state
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [commonTags, setCommonTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // Fetch all tags and common tags when tag modal opens
  useEffect(() => {
    if (showTagModal) {
      fetchAllTags();
      fetchCommonTags();
    }
  }, [showTagModal, selectedQuestions]);

  const fetchAllTags = async () => {
    setLoadingTags(true);
    try {
      const res = await fetch(`${API_BASE_URL}/questions/tags`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      setAllTags(Array.isArray(data) ? data : (data.tags || data.data || []));
    } catch (error) {
      console.error('Error fetching tags:', error);
      setAllTags([]);
    } finally {
      setLoadingTags(false);
    }
  };

  const fetchCommonTags = async () => {
    if (selectedQuestions.length === 0) return;
    try {
      const tagLists = await Promise.all(
        selectedQuestions.map(qid =>
          fetch(`${API_BASE_URL}/questions/question-tags?questionid=${qid}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Accept': 'application/json'
            }
          })
            .then(res => res.json())
            .then(data => (data.tags || []))
        )
      );
      let intersection = tagLists[0] || [];
      for (let i = 1; i < tagLists.length; i++) {
        intersection = intersection.filter(tag =>
          tagLists[i].some(t => t.id === tag.id)
        );
      }
      setCommonTags(intersection);
    } catch (error) {
      console.error('Error fetching common tags:', error);
      setCommonTags([]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/questions/tags`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name: newTagName })
      });
      const data = await res.json();
      if (data.success) {
        setAllTags([...allTags, data.tag]);
        setNewTagName('');
        toast.success('Tag created!');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Failed to create tag');
    }
  };

const handleAddTag = async (tagId) => {
  const tagName = allTags.find(t => t.id === tagId)?.name || 'this tag';
  const questionCount = selectedQuestions.length;
  
  if (!window.confirm(
    `Add "${tagName}" to ${questionCount} question${questionCount !== 1 ? 's' : ''}?\n\nThis action will update all selected questions.`
  )) {
    return;
  }
  
  try {
    console.log(' Adding tag to questions:', { 
      tagId, 
      questionCount, 
      selectedQuestions,
      tagName 
    });
    
    // Ensure question IDs are integers
    const validQuestionIds = selectedQuestions
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);
    
    if (validQuestionIds.length === 0) {
      toast.error('No valid question IDs selected');
      return;
    }
    
    //  CORRECT ENDPOINT: /questions/bulk-tags (with 's')
    const res = await fetch(`${API_BASE_URL}/questions/bulk-tags`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        questionids: validQuestionIds,  // Array of integers
        tagids: [parseInt(tagId)]       // Array with single integer
      })
    });
    
    console.log(' API Response Status:', res.status);
    const data = await res.json();
    console.log(' API Response Data:', data);
    
    if (res.ok && data.success) {
      // Update frontend state
      setQuestions(prevQuestions =>
        prevQuestions.map(q => {
          if (!validQuestionIds.includes(q.id)) return q;
          let newTags = Array.isArray(q.tags) ? [...q.tags] : [];
          const tagObj = allTags.find(t => t.id == tagId);
          if (tagObj && !newTags.some(t => t.id == tagId)) {
            newTags.push(tagObj);
          }
          return { ...q, tags: newTags };
        })
      );
      
      toast.success(`"${tagName}" tag added successfully!`);
      fetchCommonTags();
    } else {
      console.error(' API returned failure:', data);
      toast.error(data.message || data.error || 'Failed to add tag');
    }
    
  } catch (error) {
    console.error(' Network/API error:', error);
    toast.error(`Error adding tag: ${error.message}`);
  }
};

const handleRemoveTag = async (tagId) => {
  const tagName = commonTags.find(t => t.id === tagId)?.name || 'this tag';
  const questionCount = selectedQuestions.length;
  
  if (!window.confirm(
    `Remove "${tagName}" from ${questionCount} question${questionCount !== 1 ? 's' : ''}?\n\nThis action cannot be undone.`
  )) {
    return;
  }
  
  try {
    console.log(' Removing tag from questions:', { 
      tagId, 
      questionCount, 
      selectedQuestions,
      tagName 
    });
    
    // Ensure question IDs are integers
    const validQuestionIds = selectedQuestions
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);
    
    if (validQuestionIds.length === 0) {
      toast.error('No valid question IDs selected');
      return;
    }
    
    // ✅ CORRECT ENDPOINT: /questions/bulk-tags (with 's')
    const res = await fetch(`${API_BASE_URL}/questions/bulk-tags`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        questionids: validQuestionIds,  // Array of integers
        tagids: [parseInt(tagId)]       // Array with single integer
      })
    });
    
    console.log('🔗 API Response Status:', res.status);
    const data = await res.json();
    console.log('📊 API Response Data:', data);
    
    if (res.ok && data.success) {
      // Update frontend state
      setQuestions(prevQuestions =>
        prevQuestions.map(q => {
          if (!validQuestionIds.includes(q.id)) return q;
          let newTags = Array.isArray(q.tags) ? [...q.tags] : [];
          newTags = newTags.filter(t => t.id != tagId);
          return { ...q, tags: newTags };
        })
      );
      
      toast.success(`Removed "${tagName}" from ${questionCount} question${questionCount !== 1 ? 's' : ''}`);
      fetchCommonTags();
    } else {
      console.error(' API returned failure:', data);
      toast.error(data.message || data.error || 'Failed to remove tag');
    }
    
  } catch (error) {
    console.error('Network/API error:', error);
    toast.error(`Error removing tag: ${error.message}`);
  }
};


  // Tag search/filter logic
  const filteredTags = allTags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const availableTags = filteredTags.filter(tag =>
    !commonTags.some(commonTag => commonTag.id === tag.id)
  );

  // Menu and modal handlers
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleAction = (action) => {
    setAnchorEl(null);
    switch (action) {
      case 'status':
        setShowStatusModal(true); break;
      case 'tags':
        setShowTagModal(true); break;
      case 'duplicate':
        setShowDuplicateModal(true); break;
      case 'export':
        setShowExportModal(true); break;
      case 'preview':
        setShowPreviewModal(true); break;
      case 'statistics':
        setShowStatisticsModal(true); break;
      default: break;
    }
  };

  if (selectedQuestions.length === 0) return null;

  return (
    <>
      <Paper elevation={1} sx={{ mb: 2, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Selection Info */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <GroupIcon color="primary" />
          <Typography variant="subtitle1">
            {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
          </Typography>
          <Button size="small" color="primary" onClick={() => setSelectedQuestions([])}>
            Clear selection
          </Button>
        </Stack>
        {/* Actions */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            // startIcon={<EditIcon />}
            onClick={() => setShowBulkEditModal(true)}
          >
            Bulk Edit
            {<EditIcon />}
          </Button>
           <Button
            variant="outlined"
            
            onClick={handleMenuClick}
          >
            Actions
            {<MoreVertIcon />}
          </Button>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => handleAction('status')}>
              <EditIcon sx={{ mr: 1 }} /> Change Status
            </MenuItem>
            <MenuItem onClick={() => handleAction('tags')}>
              <TagIcon sx={{ mr: 1 }} /> Manage Tags
            </MenuItem>
            <MenuItem onClick={() => handleAction('duplicate')}>
              <ContentCopyIcon sx={{ mr: 1 }} /> Duplicate Questions
            </MenuItem>
            <MenuItem onClick={() => handleAction('export')}>
              <DownloadIcon sx={{ mr: 1 }} /> Export to XML
            </MenuItem>
            <MenuItem onClick={() => handleAction('preview')}>
              <VisibilityIcon sx={{ mr: 1 }} /> Preview Questions
            </MenuItem>
            <MenuItem onClick={() => handleAction('statistics')}>
              <BarChartIcon sx={{ mr: 1 }} /> View Statistics
            </MenuItem>
          </Menu>
          <Button
            variant="contained"
            color="error"
             onClick={onBulkDelete}
            >
              Delete
            {<DeleteIcon />}
           
          
            
          </Button>
        </Stack>
      </Paper>

      {/* Status Modal */}
      <Dialog open={showStatusModal} onClose={() => setShowStatusModal(false)}>
        <DialogTitle>Change Status</DialogTitle>
        <DialogContent>
          <Typography>
            Update status for {selectedQuestions.length} selected question{selectedQuestions.length !== 1 ? 's' : ''}
          </Typography>
          <Stack spacing={2} mt={2}>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<WarningIcon />}
              onClick={() => {
                onBulkStatusChange(selectedQuestions, 'draft');
                setShowStatusModal(false);
              }}
            >
              Set as Draft
            </Button>
            <Button
              variant="outlined"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => {
                onBulkStatusChange(selectedQuestions, 'ready');
                setShowStatusModal(false);
              }}
            >
              Set as Ready
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStatusModal(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Tag Management Modal */}
      <Dialog open={showTagModal} onClose={() => setShowTagModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Tags</DialogTitle>
        <DialogContent>
          <Typography>
            Add or remove tags for {selectedQuestions.length} selected question{selectedQuestions.length !== 1 ? 's' : ''}
          </Typography>
          <Box mt={2}>
            <Typography color="text.secondary" mb={1}>Common tags for all selected questions:</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
              {commonTags.map(tag => (
                <Box key={tag.id} sx={{ bgcolor: '#e0e7ff', px: 1.5, py: 0.5, borderRadius: 2, display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">{tag.name}</Typography>
                  <Button size="small" color="error" sx={{ ml: 1 }} onClick={() => handleRemoveTag(tag.id)}>Remove</Button>
                </Box>
              ))}
              {commonTags.length === 0 && (
                <Typography variant="body2" color="text.secondary">No common tags.</Typography>
              )}
            </Stack>
            <Typography color="text.secondary" mb={1}>Add tag to all selected:</Typography>
            <Box display="flex" gap={1} mb={2}>
              <input
                type="text"
                placeholder="Search or create tag"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <Button variant="contained" onClick={handleCreateTag} disabled={!newTagName.trim()}>Create</Button>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              {availableTags.map(tag => (
                <Button key={tag.id} size="small" variant="outlined" onClick={() => handleAddTag(tag.id)}>
                  {tag.name}
                </Button>
              ))}
              {availableTags.length === 0 && (
                <Typography variant="body2" color="text.secondary">No tags found.</Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTagModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowTagModal(false)}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Modal */}
      <Dialog open={showDuplicateModal} onClose={() => setShowDuplicateModal(false)}>
        <DialogTitle>Duplicate Questions</DialogTitle>
        <DialogContent>
          <Typography>
            This will create copies of {selectedQuestions.length} selected question{selectedQuestions.length !== 1 ? 's' : ''}. Are you sure you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDuplicateModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowDuplicateModal(false)}>Duplicate</Button>
        </DialogActions>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={showExportModal} onClose={() => setShowExportModal(false)}>
        <DialogTitle>Export to XML</DialogTitle>
        <DialogContent>
          <Typography mb={2}>
            Export {selectedQuestions.length} selected question{selectedQuestions.length !== 1 ? 's' : ''} to XML format.
          </Typography>
          <Stack spacing={1}>
            <Box display="flex" alignItems="center">
              <Checkbox defaultChecked />
              <Typography>Include question text</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Checkbox defaultChecked />
              <Typography>Include answer choices</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Checkbox />
              <Typography>Include explanations</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportModal(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={() => setShowExportModal(false)}>Download XML</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onClose={() => setShowPreviewModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Preview Questions</DialogTitle>
        <DialogContent>
          <Typography>
            Previewing {selectedQuestions.length} selected question{selectedQuestions.length !== 1 ? 's' : ''}
          </Typography>
          <Box mt={2} sx={{ maxHeight: 300, overflowY: 'auto' }}>
            <Typography color="text.secondary">Question preview content will be displayed here...</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Statistics Modal */}
      <Dialog open={showStatisticsModal} onClose={() => setShowStatisticsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Question Statistics</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Box display="flex" justifyContent="space-between">
              <Typography color="text.secondary">Total Questions:</Typography>
              <Typography fontWeight="medium">{selectedQuestions.length}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography color="text.secondary">Draft Status:</Typography>
              <Typography fontWeight="medium">-</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography color="text.secondary">Ready Status:</Typography>
              <Typography fontWeight="medium">-</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography color="text.secondary">Average Tags:</Typography>
              <Typography fontWeight="medium">-</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStatisticsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkActionsRow;
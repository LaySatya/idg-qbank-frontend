import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Stack,
  Alert,
  CircularProgress,
  Checkbox,
  Toolbar,
  Tooltip,
  InputAdornment,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Tag as TagIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import PaginationControls from '../shared/components/PaginationControls';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ManageTags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagRawName, setNewTagRawName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch all tags
  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/questions/tags`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      setTags(Array.isArray(data) ? data : (data.tags || data.data || []));
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast.error('Failed to fetch tags');
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  // Create new tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Please enter a tag name');
      return;
    }

    setCreating(true);
    try {
      const trimmedName = newTagName.trim();
      const trimmedRawName = newTagRawName.trim() || trimmedName;
      
      if (editingTag) {
        // Update existing tag
        const res = await fetch(`${API_BASE_URL}/questions/manage_tags?id=${editingTag.id}&name=${encodeURIComponent(trimmedName)}&rawname=${encodeURIComponent(trimmedRawName)}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          }
        });

        const data = await res.json();
        console.log('PUT response:', data);
        
        // Check for actual errors (not warnings)
        if (!res.ok) {
          throw new Error(data.message || data.error || `HTTP ${res.status}: ${res.statusText}`);
        }
        
        // Handle warnings separately (they don't prevent success)
        if (data.warnings && data.warnings.length > 0) {
          const warning = data.warnings[0];
          if (warning.warningcode === 'tagnotfound') {
            throw new Error('Tag not found. It may have been deleted by another user.');
          }
          // For other warnings, just log them but continue
          console.warn('API Warning:', warning.message);
        }
        
        // Check for exception/errorcode which indicate real errors
        if (data.exception || data.errorcode || data.error) {
          throw new Error(data.message || data.error || 'Failed to update tag');
        }

        console.log('Tag updated successfully:', data);
        
        // Update the tag in local state
        // The PUT endpoint might return the updated tag data or just success confirmation
        const updatedTag = {
          id: editingTag.id,
          name: data.name || trimmedName,
          rawname: data.rawname || trimmedRawName
        };
        
        setTags(prev => prev.map(tag => 
          tag.id === editingTag.id ? updatedTag : tag
        ));
        
        toast.success(`Tag "${updatedTag.name}" updated successfully!`);
        
      } else {
        // Create new tag
        const res = await fetch(`${API_BASE_URL}/questions/manage_tags?name=${encodeURIComponent(trimmedName)}&rawname=${encodeURIComponent(trimmedRawName)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          }
        });

        const data = await res.json();
        
        if (!res.ok || data.exception || data.errorcode || data.error) {
          throw new Error(data.message || data.error || `HTTP ${res.status}: ${res.statusText}`);
        }

        if (!data.id || !data.name) {
          throw new Error('Invalid response from server - missing required fields');
        }

        console.log(' Tag created successfully:', data);
        
        // Add the new tag to the beginning of the local state so it appears on first page
        const newTag = {
          id: data.id,
          name: data.name,
          rawname: data.rawname || data.name
        };
        
        setTags(prev => [newTag, ...prev]);
        toast.success(`Tag "${data.name}" created successfully!`);
        
        // Stay on first page to show the new tag at the top
        setCurrentPage(1);
      }
      
      // Reset form
      setNewTagName('');
      setNewTagRawName('');
      setShowCreateModal(false);
      setEditingTag(null);
      
    } catch (error) {
      console.error('Error saving tag:', error);
      toast.error(`Failed to ${editingTag ? 'update' : 'create'} tag: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  // Delete selected tags
  const handleDeleteTags = async () => {
    if (selectedTags.length === 0) {
      toast.error('Please select tags to delete');
      return;
    }

    setDeleting(true);
    try {
      // Build URL with tagids[] parameters
      const params = new URLSearchParams();
      selectedTags.forEach(tagId => {
        params.append('tagids[]', tagId.toString());
      });
      
      const deleteUrl = `${API_BASE_URL}/questions/manage_tags?${params.toString()}`;
      console.log('🚀 Sending DELETE request to:', deleteUrl);
      
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });

      const data = await res.json();
      console.log('Delete response:', data);
      
      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      // Remove deleted tags from local state
      setTags(prevTags => prevTags.filter(tag => !selectedTags.includes(tag.id)));
      setSelectedTags([]);
      
      const deletedCount = data.deletedcount || 0;
      if (deletedCount > 0) {
        toast.success(`Successfully deleted ${deletedCount} tag${deletedCount !== 1 ? 's' : ''}`);
      } else {
        toast.warning('No tags were deleted - they may not exist or may be in use');
      }
      
      setShowDeleteModal(false);
      
      // Adjust current page if needed after deletion
      const remainingTags = tags.filter(tag => !selectedTags.includes(tag.id));
      const newTotalPages = Math.ceil(remainingTags.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      
    } catch (error) {
      console.error('Error deleting tags:', error);
      toast.error(`Failed to delete tags: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  // Filter tags based on search term
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tag.rawname && tag.rawname.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic
  const totalItems = filteredTags.length;
  const totalPagesCalculated = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTags = filteredTags.slice(startIndex, endIndex);

  // Update total pages when filtered tags change
  useEffect(() => {
    const newTotalPages = Math.ceil(filteredTags.length / itemsPerPage);
    setTotalPages(newTotalPages);
    
    // Reset to first page if current page exceeds total pages
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredTags.length, itemsPerPage, currentPage]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedTags([]); // Clear selections when changing pages
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    setSelectedTags([]); // Clear selections
  };

  // Handle select all/none
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedTags(paginatedTags.map(tag => tag.id));
    } else {
      setSelectedTags([]);
    }
  };

  // Handle individual tag selection
  const handleTagSelect = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  useEffect(() => {
    fetchTags();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TagIcon color="primary" />
          Manage Tags
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create, edit, and delete tags for your question bank
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" component="div">
              {tags.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Tags
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" component="div">
              {selectedTags.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Selected Tags
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" component="div">
              {filteredTags.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Filtered Results
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" component="div">
              {totalPages}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Pages
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content */}
      <Paper elevation={1} sx={{ p: 0 }}>
        {/* Toolbar */}
        <Toolbar sx={{ pl: 2, pr: 1, bgcolor: 'grey.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <TextField
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Tag
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchTags}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
          
          {selectedTags.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {selectedTags.length} selected
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setShowDeleteModal(true)}
                size="small"
              >
                Delete Selected
              </Button>
            </Box>
          )}
        </Toolbar>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedTags.length > 0 && selectedTags.length < paginatedTags.length}
                    checked={paginatedTags.length > 0 && selectedTags.length === paginatedTags.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Raw Name</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredTags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No tags found matching your search.' : 'No tags found.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTags.map((tag) => (
                  <TableRow key={tag.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedTags.includes(tag.id)}
                        onChange={() => handleTagSelect(tag.id)}
                      />
                    </TableCell>
                    <TableCell>{tag.id}</TableCell>
                    <TableCell>
                      <Chip 
                        label={tag.name} 
                        color="primary" 
                        variant="outlined" 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {tag.rawname || tag.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Edit Tag">
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              setEditingTag(tag);
                              setNewTagName(tag.name);
                              setNewTagRawName(tag.rawname || tag.name);
                              setShowCreateModal(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Tag">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => {
                              setSelectedTags([tag.id]);
                              setShowDeleteModal(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Controls */}
        {filteredTags.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            isLoading={loading}
          />
        )}
      </Paper>

      {/* Create/Edit Tag Modal */}
      <Dialog 
        open={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 4px 24px 0 rgba(30,41,59,0.10)',
            overflow: 'hidden',
          }
        }}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid #e5e7eb',
          bgcolor: '#f8fafc'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TagIcon sx={{ color: '#64748b', fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 700, color: '#334155', margin: 0 }}>
              {editingTag ? 'Edit Tag' : 'Create New Tag'}
            </Typography>
          </Box>
          <IconButton
            onClick={() => {
              setShowCreateModal(false);
              setEditingTag(null);
              setNewTagName('');
              setNewTagRawName('');
            }}
            sx={{ 
              p: 0.5,
              color: '#64748b',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
            }}
          >
            <span style={{ fontSize: 18 }}>×</span>
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            <TextField
              label="Tag Name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              fullWidth
              required
              placeholder="Enter tag name"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <TextField
              label="Raw Name"
              value={newTagRawName}
              onChange={(e) => setNewTagRawName(e.target.value)}
              fullWidth
              placeholder="Enter raw name (optional)"
              helperText="If empty, will use the same value as Tag Name"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
          </Stack>
        </Box>

        {/* Footer */}
        <Box sx={{ 
          borderTop: '1px solid #e5e7eb',
          p: 1.5,
          bgcolor: '#f8fafc',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.5
        }}>
          <Button 
            onClick={() => {
              setShowCreateModal(false);
              setEditingTag(null);
              setNewTagName('');
              setNewTagRawName('');
            }}
            sx={{
              px: 2.5,
              py: 1,
              bgcolor: '#e5e7eb',
              color: '#334155',
              borderRadius: 1,
              fontWeight: 500,
              fontSize: 15,
              textTransform: 'none',
              '&:hover': { bgcolor: '#d1d5db' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateTag}
            disabled={creating || !newTagName.trim()}
            startIcon={creating ? <CircularProgress size={20} /> : (editingTag ? <EditIcon /> : <AddIcon />)}
            sx={{
              px: 2.5,
              py: 1,
              bgcolor: '#64748b',
              color: '#fff',
              borderRadius: 1,
              fontWeight: 600,
              fontSize: 15,
              textTransform: 'none',
              '&:hover': { bgcolor: '#475569' },
              '&:disabled': { bgcolor: '#cbd5e1', color: '#94a3b8' }
            }}
          >
            {creating ? (editingTag ? 'Updating...' : 'Creating...') : (editingTag ? 'Update Tag' : 'Create Tag')}
          </Button>
        </Box>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog 
        open={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 4px 24px 0 rgba(30,41,59,0.10)',
            overflow: 'hidden',
          }
        }}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid #e5e7eb',
          bgcolor: '#f8fafc'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <DeleteIcon sx={{ color: '#ef4444', fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 700, color: '#334155', margin: 0 }}>
              Confirm Delete
            </Typography>
          </Box>
          <IconButton
            onClick={() => setShowDeleteModal(false)}
            sx={{ 
              p: 0.5,
              color: '#64748b',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
            }}
          >
            <span style={{ fontSize: 18 }}>×</span>
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 2,
              bgcolor: '#fef2f2',
              borderLeft: '4px solid #f87171',
              border: 'none',
              borderRadius: 1.5,
              '& .MuiAlert-icon': { color: '#f87171' }
            }}
          >
            <Typography variant="body2" sx={{ color: '#b91c1c' }}>
              This action cannot be undone. Deleted tags will be removed from all questions.
            </Typography>
          </Alert>
          <Typography variant="body1" sx={{ mb: 2, color: '#374151' }}>
            Are you sure you want to delete <strong>{selectedTags.length}</strong> tag{selectedTags.length !== 1 ? 's' : ''}?
          </Typography>
          {selectedTags.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Tags to be deleted:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {selectedTags.map(tagId => {
                  const tag = tags.find(t => t.id === tagId);
                  return tag ? (
                    <Chip 
                      key={tagId} 
                      label={tag.name} 
                      sx={{
                        bgcolor: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #f87171',
                        borderRadius: 1.5,
                        fontSize: 12,
                        height: 24
                      }}
                      size="small"
                    />
                  ) : null;
                })}
              </Stack>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ 
          borderTop: '1px solid #e5e7eb',
          p: 1.5,
          bgcolor: '#f8fafc',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.5
        }}>
          <Button 
            onClick={() => setShowDeleteModal(false)}
            sx={{
              px: 2.5,
              py: 1,
              bgcolor: '#e5e7eb',
              color: '#334155',
              borderRadius: 1,
              fontWeight: 500,
              fontSize: 15,
              textTransform: 'none',
              '&:hover': { bgcolor: '#d1d5db' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteTags}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
            sx={{
              px: 2.5,
              py: 1,
              bgcolor: '#ef4444',
              color: '#fff',
              borderRadius: 1,
              fontWeight: 600,
              fontSize: 15,
              textTransform: 'none',
              '&:hover': { bgcolor: '#dc2626' },
              '&:disabled': { bgcolor: '#fca5a5', color: '#fef2f2' }
            }}
          >
            {deleting ? 'Deleting...' : 'Delete Tags'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ManageTags;

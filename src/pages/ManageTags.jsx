import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Dialog,
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
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckBox as CheckBoxIcon,
  Sell as SellIcon,
  Close as CloseIcon,
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
        if (!res.ok || data.error) throw new Error(data.message || data.error || 'Failed to update tag');
        const updatedTag = { id: editingTag.id, name: data.name || trimmedName, rawname: data.rawname || trimmedRawName };
        setTags(prev => prev.map(tag => tag.id === editingTag.id ? updatedTag : tag));
        toast.success(`Tag "${updatedTag.name}" updated!`);
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
        if (!res.ok || data.error) throw new Error(data.message || data.error || 'Failed to create tag');
        const newTag = { id: data.id, name: data.name, rawname: data.rawname || data.name };
        setTags(prev => [newTag, ...prev]);
        toast.success(`Tag "${data.name}" created!`);
        setCurrentPage(1);
      }
      setNewTagName('');
      setNewTagRawName('');
      setShowCreateModal(false);
      setEditingTag(null);
    } catch (error) {
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
      const params = new URLSearchParams();
      selectedTags.forEach(tagId => params.append('tagids[]', tagId.toString()));
      const deleteUrl = `${API_BASE_URL}/questions/manage_tags?${params.toString()}`;
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to delete tags');
      setTags(prevTags => prevTags.filter(tag => !selectedTags.includes(tag.id)));
      setSelectedTags([]);
      toast.success(`Deleted ${selectedTags.length} tag(s)`);
      setShowDeleteModal(false);
    } catch (error) {
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

  useEffect(() => {
    setTotalPages(Math.ceil(filteredTags.length / itemsPerPage));
    if (currentPage > Math.ceil(filteredTags.length / itemsPerPage) && filteredTags.length > 0) {
      setCurrentPage(1);
    }
  }, [filteredTags.length, itemsPerPage, currentPage]);

  useEffect(() => {
    fetchTags();
  }, []);

  // Selection handlers
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedTags(paginatedTags.map(tag => tag.id));
    } else {
      setSelectedTags([]);
    }
  };
  const handleTagSelect = (tagId) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, width: '100%', maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SellIcon color="primary" />
          Manage Tags
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create, edit, and delete tags for your question bank
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 2, mb: 3 }}>
        <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid #e5e7eb', background: '#fff' }}>
          <CardContent>
            <Typography variant="h6">{tags.length}</Typography>
            <Typography variant="body2" color="text.secondary">Total Tags</Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid #e5e7eb', background: '#fff' }}>
          <CardContent>
            <Typography variant="h6">{selectedTags.length}</Typography>
            <Typography variant="body2" color="text.secondary">Selected</Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid #e5e7eb', background: '#fff' }}>
          <CardContent>
            <Typography variant="h6">{filteredTags.length}</Typography>
            <Typography variant="body2" color="text.secondary">Filtered</Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid #e5e7eb', background: '#fff' }}>
          <CardContent>
            <Typography variant="h6">{totalPages}</Typography>
            <Typography variant="body2" color="text.secondary">Pages</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          maxWidth: '100%',
          margin: '0 auto',
          border: '1px solid #e5e7eb',
          boxShadow: 'none',
          background: '#fff',
        }}
      >
        {/* Toolbar */}
        <Toolbar
          sx={{
            pl: 2,
            pr: 1,
            bgcolor: 'grey.50',
            borderBottom: '1px solid',
            borderColor: 'divider',
            minHeight: '60px !important',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <TextField
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              minWidth: 260,
              maxWidth: 340,
              background: '#fff',
              borderRadius: 1.5,
              boxShadow: 'none',
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                bgcolor: '#fff',
                fontSize: '0.95rem',
                height: 40,
                '& fieldset': {
                  borderColor: '#e5e7eb',
                },
                '&:hover fieldset': {
                  borderColor: '#b6c2e2',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#90caf9',
                  boxShadow: 'none',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateModal(true)}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              px: 2.5,
              fontSize: '0.95rem',
              boxShadow: 'none',
              backgroundColor: '#2c64b8',
              '&:hover': {
                  backgroundColor: '#2c64b8',
            borderColor: '#2c64b8'
              },
            }}
            size="small"
          >
            Create Tag
          </Button>
          {/* <Button
            variant="outlined"
            endIcon={<RefreshIcon />}
            onClick={fetchTags}
            disabled={loading}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              fontSize: '0.95rem',
              borderColor: '#e5e7eb',
              color: '#334155',
              background: '#fff',
              '&:hover': {
                borderColor: '#b6c2e2',
                background: '#f8fafc',
                color: '#1e293b',
              },
            }}
            size="small"
          >
            Refresh
          </Button> */}
                                       {selectedTags.length > 0 && (
                      <Box
                        tabIndex={0}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          bgcolor: 'error.50',
                          px: 2,
                          py: 0.75,
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: 'error.200',
                          boxShadow: 'none',
                          transition: 'outline 0.2s',
                          outline: 'none', // fallback for browsers that show outline by default
                          '&:focus': {
                            outline: '2px solid #2563eb', // your custom color
                            outlineOffset: '2px',
                            boxShadow: 'none',
                          },
                          '&:focus-visible': {
                            outline: '2px solid #2563eb', // your custom color
                            outlineOffset: '2px',
                            boxShadow: 'none',
                          },
                          '&:active': {
                            outline: 'none',
                            boxShadow: 'none',
                          },
                        }}
                      >
                        <Typography variant="body2" sx={{ color: 'error.dark', fontWeight: 600, fontSize: '0.9rem' }}>
                          {selectedTags.length} selected
                        </Typography>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => setShowDeleteModal(true)}
                          size="small"
                          sx={{
                            borderRadius: 1,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            px: 1.5,
                            py: 0.5,
                            minHeight: 'auto',
                            boxShadow: 'none',
                            bgcolor: 'error.main',
                            '&:hover': {
                              bgcolor: 'error.dark',
                            },
                            '&:focus': {
                              bgcolor: 'error.dark',
                            },
                            '&:active': {
                              bgcolor: 'error.light',
                            },
                          }}
                        >
                          Delete
                        </Button>
                      </Box>
                    )}
        </Toolbar>

        {/* Table View */}
        <TableContainer>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell padding="checkbox" sx={{ width: '50px' }}>
                  <Checkbox
                    indeterminate={selectedTags.length > 0 && selectedTags.length < paginatedTags.length}
                    checked={paginatedTags.length > 0 && selectedTags.length === paginatedTags.length}
                    onChange={handleSelectAll}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ width: '80px', fontWeight: 700, fontSize: '0.95rem', color: '#334155' }}>ID</TableCell>
                <TableCell sx={{ width: '300px', fontWeight: 700, fontSize: '0.95rem', color: '#334155' }}>Name</TableCell>
                <TableCell sx={{ width: '250px', fontWeight: 700, fontSize: '0.95rem', color: '#334155' }}>Raw Name</TableCell>
                <TableCell sx={{ width: '140px', fontWeight: 700, fontSize: '0.95rem', color: '#334155' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : filteredTags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm ? 'No tags found matching your search.' : 'No tags found.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTags.map((tag, idx) => (
                  <TableRow
                    key={tag.id}
                    hover
                    sx={{
                      backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb',
                      transition: 'background 0.2s',
                      '&:hover': {
                        backgroundColor: '#e0f2fe',
                      },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedTags.includes(tag.id)}
                        onChange={() => handleTagSelect(tag.id)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontFamily: 'monospace',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                        }}
                      >
                        #{tag.id}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SellIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: '250px',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: 'primary.main',
                          }}
                        >
                          {tag.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: tag.rawname ? 'text.primary' : 'text.secondary',
                          fontSize: '0.9rem',
                          fontStyle: tag.rawname ? 'normal' : 'italic',
                          maxWidth: '230px',
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {tag.rawname || 'No raw name'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
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
                            sx={{
                              p: 0.5,
                              color: 'primary.main',
                              '&:hover': {
                                bgcolor: 'primary.50',
                                color: 'primary.dark',
                              },
                            }}
                          >
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Tag">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedTags([tag.id]);
                              setShowDeleteModal(true);
                            }}
                            sx={{
                              p: 0.5,
                              color: 'error.main',
                              '&:hover': {
                                bgcolor: 'error.50',
                                color: 'error.dark',
                              },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
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
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
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
            borderRadius: 2,
            boxShadow: 'none',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            background: '#fff',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2.5,
            borderBottom: '1px solid #e5e7eb',
            bgcolor: 'grey.50',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SellIcon sx={{ color: '#64748b', fontSize: 22 }} />
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
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
            }}
          >
            <CloseIcon sx={{ fontSize: 22 }} />
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
                  fontSize: '1rem',
                },
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
                  fontSize: '1rem',
                },
              }}
            />
          </Stack>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            borderTop: '1px solid #e5e7eb',
            p: 2,
            bgcolor: 'grey.50',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
          }}
        >
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
              '&:hover': { bgcolor: '#d1d5db' },
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
              bgcolor: '#2c64b8',
              color: '#fff',
              borderRadius: 1,
              fontWeight: 600,
              fontSize: 15,
              textTransform: 'none',
              '&:hover': { bgcolor: '#2c64b8' },
              '&:disabled': { bgcolor: '#cbd5e1', color: '#94a3b8' },
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
            borderRadius: 2,
            boxShadow: 'none',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            background: '#fff',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2.5,
            borderBottom: '1px solid #e5e7eb',
            bgcolor: 'grey.50',
          }}
        >
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
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
            }}
          >
            <CloseIcon sx={{ fontSize: 22 }} />
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
              borderRadius: 1,
              '& .MuiAlert-icon': { color: '#f87171' },
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
                        borderRadius: 1,
                        fontSize: 13,
                        height: 28,
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
        <Box
          sx={{
            borderTop: '1px solid #e5e7eb',
            p: 2,
            bgcolor: 'grey.50',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
          }}
        >
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
              '&:hover': { bgcolor: '#d1d5db' },
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
              '&:disabled': { bgcolor: '#fca5a5', color: '#fef2f2' },
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
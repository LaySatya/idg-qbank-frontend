// ============================================================================
// Modern Manage Users Page Component
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
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
  Avatar,
  Checkbox,
  Toolbar,
  Tooltip,
  InputAdornment,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TableSortLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Filter as FilterIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { userAPI } from '../api/userapi.jsx';
import EditUserModal from '../components/modals/EditUserModal';
import { CreateUserModal, UserDetailsModal } from '../components/modals/CreateUserModal';
import PaginationControls from '../shared/components/PaginationControls';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('fullname');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Roles state
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Load users and roles
  useEffect(() => {
    loadUsersAndRoles();
  }, []);

  const loadUsersAndRoles = async () => {
    try {
      // Load users first
      const userData = await loadUsers();
      // Then load roles (which can fall back to user roles if API fails)
      await loadRoles(userData);
    } catch (error) {
      console.error(' Failed to load users and roles:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Try to get users with role information first
      console.log(' Attempting to fetch users with role information...');
      let usersData;
      
      try {
        usersData = await userAPI.getUsersWithRoles();
        console.log(' Successfully fetched users with roles:', usersData.length);
      } catch (roleError) {
        console.warn(' Failed to fetch users with roles, falling back to basic user fetch:', roleError.message);
        usersData = await userAPI.getUsers();
      }
      
      // Debug: Log the actual response structure
      console.log('Raw API Response:', usersData);
      
      // Handle the API response structure you provided
      let normalizedUsers = [];
      if (usersData.users && Array.isArray(usersData.users)) {
        normalizedUsers = usersData.users;
      } else if (Array.isArray(usersData)) {
        normalizedUsers = usersData;
      } else if (usersData.data && Array.isArray(usersData.data)) {
        normalizedUsers = usersData.data;
      }

      // Normalize user data to ensure consistent field names
      const processedUsers = normalizedUsers.map(user => ({
        id: user.id,
        username: user.username || 'N/A',
        fullname: user.fullname || `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'N/A',
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || 'N/A',
        role: user.userrole || user.role || user.rolename || 'Unknown',
        status: user.suspended === false ? 'Active' : 'Inactive',
        avatar: user.profileimageurl || null,
        department: user.department || 'N/A',
        lastaccess: user.lastaccess || null,
        firstaccess: user.firstaccess || null,
        timecreated: user.timecreated || null,
        timemodified: user.timemodified || null,
        confirmed: user.confirmed || false,
        suspended: user.suspended || false,
        deleted: user.deleted || false,
        phone1: user.phone1 || '',
        phone2: user.phone2 || '',
        institution: user.institution || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
        lang: user.lang || 'en',
        // Keep original data for modals
        ...user
      }));

      setUsers(processedUsers);
      return processedUsers; // Return the processed users for use in loadRoles
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
      return []; // Return empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async (usersData = null) => {
    try {
      setRolesLoading(true);
      const rolesData = await userAPI.getRoles();
      console.log(' Roles fetched:', rolesData);
      
      // Extract roles array from the response
      let rolesArray = rolesData.roles || [];
      
      // If no roles from API, create roles from users data
      const availableUsers = usersData || users;
      if (rolesArray.length === 0 && availableUsers.length > 0) {
        console.log(' No roles from API, extracting from users data');
        const uniqueUserRoles = [...new Set(availableUsers.map(user => user.role))];
        rolesArray = uniqueUserRoles.map((roleName, index) => ({
          id: index + 1,
          name: roleName,
          shortname: roleName.toLowerCase(),
          description: `${roleName} role`
        }));
        console.log(' Extracted roles from users:', rolesArray);
      }
      
      setRoles(rolesArray);
    } catch (error) {
      console.error(' Failed to load roles:', error);
      
      // Final fallback: create basic roles from current users
      const availableUsers = usersData || users;
      if (availableUsers.length > 0) {
        console.log(' Creating fallback roles from users');
        const uniqueUserRoles = [...new Set(availableUsers.map(user => user.role))];
        const fallbackRoles = uniqueUserRoles.map((roleName, index) => ({
          id: index + 1,
          name: roleName,
          shortname: roleName.toLowerCase(),
          description: `${roleName} role`
        }));
        setRoles(fallbackRoles);
        console.log(' Using fallback roles:', fallbackRoles);
      } else {
        setRoles([]);
      }
      
      // Don't show error toast for API failures, just log them
      console.warn(' Using fallback role extraction instead of API');
    } finally {
      setRolesLoading(false);
    }
  };  const handleRefresh = async () => {
    await loadUsersAndRoles();
  };

  // Filter and sort users
  const filteredAndSortedUsers = users
    .filter(user => {
      const matchesSearch = 
        user.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Enhanced role matching: match by shortname (which is what the API uses)
      const matchesRole = filterRole === 'all' || 
        user.role === filterRole || 
        user.role.toLowerCase() === filterRole.toLowerCase() ||
        // Also check if user role matches any role shortname or name from API
        roles.some(role => 
          role.shortname === filterRole && (
            role.shortname === user.role ||
            role.shortname.toLowerCase() === user.role.toLowerCase() ||
            (role.name && role.name.toLowerCase() === user.role.toLowerCase())
          )
        );
      
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const paginatedUsers = filteredAndSortedUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedUsers([]); // Clear selections when changing pages
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setUsersPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    setSelectedUsers([]); // Clear selections
  };

  // Event handlers
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      // TODO: Implement API call
      // await userAPI.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user. Please try again.');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to delete');
      return;
    }
    
    try {
      // TODO: Implement bulk delete API call
      setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
      setShowDeleteModal(false);
      toast.success(`Successfully deleted ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Failed to delete users:', error);
      toast.error('Failed to delete users. Please try again.');
    }
  };

  // const handleSort = (property) => {
  //   const isAsc = sortBy === property && sortOrder === 'asc';
  //   setSortOrder(isAsc ? 'desc' : 'asc');
  //   setSortBy(property);
  // };

  // Handle select all/none
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedUsers(paginatedUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Handle individual user selection
  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'bg-purple-100 text-purple-800',
      'teacher': 'bg-blue-100 text-blue-800',
      'student': 'bg-green-100 text-green-800',
      'manager': 'bg-orange-100 text-orange-800',
    };
    return colors[role?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          Manage Users
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and organize your system users
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" component="div">
              {users.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Users
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" component="div">
              {selectedUsers.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Selected Users
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" component="div">
              {filteredAndSortedUsers.length}
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
              placeholder="Search users by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                label="Role"
                disabled={rolesLoading}
              >
                <MenuItem value="all">All Roles</MenuItem>
                {roles.map(role => (
                  <MenuItem key={role.id} value={role.shortname}>
                    {role.name && role.name.trim() !== '' ? role.name : role.shortname}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </Select>
            </FormControl> */}

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateModal(true)}
            >
              Add User
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading || rolesLoading}
            >
              Refresh
            </Button>
          </Box>
          
          {selectedUsers.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {selectedUsers.length} selected
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
                    indeterminate={selectedUsers.length > 0 && selectedUsers.length < paginatedUsers.length}
                    checked={paginatedUsers.length > 0 && selectedUsers.length === paginatedUsers.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'fullname'}
                    direction={sortBy === 'fullname' ? sortOrder : 'asc'}
                    onClick={() => handleSort('fullname')}
                  >
                    User
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'email'}
                    direction={sortBy === 'email' ? sortOrder : 'asc'}
                    onClick={() => handleSort('email')}
                  >
                    Email
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'role'}
                    direction={sortBy === 'role' ? sortOrder : 'asc'}
                    onClick={() => handleSort('role')}
                  >
                    Role
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  {/* <TableSortLabel
                    active={sortBy === 'status'}
                    direction={sortBy === 'status' ? sortOrder : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel> */}
                </TableCell>
                <TableCell>Last Access</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchQuery || filterRole !== 'all' || filterStatus !== 'all' 
                        ? 'No users found matching your criteria.' 
                        : 'No users found.'}
                    </Typography>
                    {(searchQuery || filterRole !== 'all' || filterStatus !== 'all') && (
                      <Button
                        onClick={() => {
                          setSearchQuery('');
                          setFilterRole('all');
                          setFilterStatus('all');
                        }}
                        sx={{ mt: 1 }}
                        size="small"
                      >
                        Clear filters
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserSelect(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={user.avatar} alt={user.fullname}>
                          {user.fullname.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {user.fullname}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.username && user.username !== 'N/A' ? `@${user.username}` : ''}
                            {user.department && user.department !== 'N/A' && user.username && user.username !== 'N/A' ? ' • ' : ''}
                            {user.department && user.department !== 'N/A' ? user.department : ''}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{user.email}</Typography>
                        {user.phone1 && user.phone1 !== '' && (
                          <Typography variant="caption" color="text.secondary">
                            {user.phone1}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        color="primary" 
                        variant="outlined" 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {/* <Stack spacing={0.5}>
                        <Chip 
                          label={user.status} 
                          color={user.status === 'Active' ? 'success' : 'error'} 
                          variant="outlined" 
                          size="small"
                        />
                        {user.confirmed === false && (
                          <Chip 
                            label="Unconfirmed" 
                            color="warning" 
                            variant="outlined" 
                            size="small"
                          />
                        )}
                      </Stack> */}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {formatDate(user.lastaccess)}
                        </Typography>
                        {user.firstaccess && user.firstaccess !== user.lastaccess && (
                          <Typography variant="caption" color="text.secondary">
                            First: {formatDate(user.firstaccess)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewUser(user)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit User">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditUser(user)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteUser(user.id)}
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
        {filteredAndSortedUsers.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAndSortedUsers.length}
            itemsPerPage={usersPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            isLoading={loading}
          />
        )}
      </Paper>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            <Typography variant="h6">Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete <strong>{selectedUsers.length}</strong> user{selectedUsers.length !== 1 ? 's' : ''}?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteModal(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteSelected}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete Users
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onUserCreated={(newUser) => {
            setUsers(prev => [newUser, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onUserUpdated={(updatedUser) => {
            setUsers(prev => prev.map(user => 
              user.id === updatedUser.id ? updatedUser : user
            ));
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          isOpen={showDetailsModal}
          user={selectedUser}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </Box>
  );
};

export default ManageUsers;
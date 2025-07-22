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
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { userAPI } from '../api/userapi.jsx';
import PaginationControls from '../shared/components/PaginationControls';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('fullname');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(20);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [totalAvailableUsers, setTotalAvailableUsers] = useState(0);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  // Load only roles on initial page load
  useEffect(() => {
    let mounted = true;
    
    const loadInitialData = async () => {
      if (mounted && roles.length === 0) {
        await loadRolesOnly();
      }
    };
    
    loadInitialData();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Load roles only (optimized initial load)
  const loadRolesOnly = async () => {
    if (roles.length > 0) {
      console.log('Roles already loaded, skipping...');
      return;
    }
    
    try {
      setInitialLoading(true);
      console.log('🔧 Loading roles...');
      const rolesData = await userAPI.getRoles();
      console.log('✅ Loaded roles:', rolesData);
      
      let normalizedRoles = [];
      if (rolesData.roles && Array.isArray(rolesData.roles)) {
        normalizedRoles = rolesData.roles;
      } else if (Array.isArray(rolesData)) {
        normalizedRoles = rolesData;
      }
      setRoles(normalizedRoles);
    } catch (error) {
      console.error('❌ Failed to load roles:', error);
      setRoles([]);
    } finally {
      setInitialLoading(false);
    }
  };

  // Load users by specific role with server-side pagination support
  const loadUsersByRole = async (rolename, loadAll = false, specificPage = null) => {
    if (rolename === 'all') {
      return loadUsersAndRoles();
    }
    
    try {
      setLoading(true);
      if (loadAll) {
        setIsLoadingAll(true);
      }
      
      if (!specificPage) {
        setUsers([]);
      }
      
      console.log(`🔍 Loading users with role: ${rolename}`);
      
      let allUsers = [];
      let totalCount = 0;
      const perPage = usersPerPage;
      
      if (loadAll) {
        // Load all users by paginating through all pages
        let currentPageNum = 1;
        let hasMorePages = true;
        
        while (hasMorePages) {
          console.log(`📄 Loading page ${currentPageNum} for role: ${rolename}`);
          const usersData = await userAPI.getUsersByRole(rolename, currentPageNum, perPage);
          
          if (usersData.users && Array.isArray(usersData.users)) {
            allUsers = [...allUsers, ...usersData.users];
            totalCount = usersData.totalcount || 0;
            
            hasMorePages = usersData.users.length === perPage && allUsers.length < totalCount;
            currentPageNum++;
            
            console.log(`📈 Progress: ${allUsers.length} / ${totalCount} users loaded`);
            
            if (hasMorePages) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } else {
            hasMorePages = false;
          }
        }
        
        console.log(`✅ Loaded ${allUsers.length} of ${totalCount} total users for role: ${rolename}`);
      } else {
        // Load specific page for server-side pagination
        const pageToLoad = specificPage || currentPage;
        console.log(`📄 Loading page ${pageToLoad} for role: ${rolename} (server-side pagination)`);
        const usersData = await userAPI.getUsersByRole(rolename, pageToLoad, perPage);
        
        if (usersData.users && Array.isArray(usersData.users)) {
          allUsers = usersData.users;
          totalCount = usersData.totalcount || 0;
        }
        
        console.log(`📊 Loaded ${allUsers.length} users from page ${pageToLoad} (${totalCount} total available)`);
      }

      // Process users
      const processedUsers = allUsers.map(user => ({
        id: user.id,
        username: user.username || 'N/A',
        fullname: user.fullname || `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'N/A',
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || 'N/A',
        role: user.userrole || user.role || user.rolename || rolename,
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
        ...user
      }));

      setUsers(processedUsers);
      
      if (!specificPage) {
        setCurrentPage(1);
      }
      
      setSelectedUsers([]);
      setTotalAvailableUsers(totalCount);
      
      // Show success message
      if (loadAll) {
        toast.success(`Loaded all ${processedUsers.length} users for role: ${rolename}`);
      } else {
        const pageInfo = specificPage ? ` (page ${specificPage})` : '';
        toast.success(`Loaded ${processedUsers.length} users for role: ${rolename}${pageInfo} (${totalCount} total available)`);
      }
    } catch (error) {
      console.error(`❌ Failed to load users for role ${rolename}:`, error);
      toast.error(`Failed to load users for role: ${rolename}`);
      setUsers([]);
    } finally {
      setLoading(false);
      setIsLoadingAll(false);
    }
  };

  const loadUsersAndRoles = async () => {
    try {
      setLoading(true);
      
      console.log('🔧 Loading roles...');
      const rolesData = await userAPI.getRoles();
      console.log('✅ Loaded roles:', rolesData);
      
      let normalizedRoles = [];
      if (rolesData.roles && Array.isArray(rolesData.roles)) {
        normalizedRoles = rolesData.roles;
      } else if (Array.isArray(rolesData)) {
        normalizedRoles = rolesData;
      }
      setRoles(normalizedRoles);
      
      console.log('🔧 Loading users with roles...');
      const usersData = await userAPI.getUsersWithRoles();
      console.log('✅ Loaded users:', usersData);
      
      let normalizedUsers = [];
      if (usersData.users && Array.isArray(usersData.users)) {
        normalizedUsers = usersData.users;
      } else if (Array.isArray(usersData)) {
        normalizedUsers = usersData;
      } else if (usersData.data && Array.isArray(usersData.data)) {
        normalizedUsers = usersData.data;
      }

      const processedUsers = normalizedUsers.map(user => ({
        id: user.id,
        username: user.username || 'N/A',
        fullname: user.fullname || `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'N/A',
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || 'N/A',
        role: user.userrole || user.role || user.rolename || 'User',
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
        ...user
      }));

      setUsers(processedUsers);
      setTotalAvailableUsers(processedUsers.length);
    } catch (error) {
      console.error('❌ Failed to load users and roles:', error);
      setUsers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort users
  const isServerSidePagination = filterRole !== 'all';
  
  let filteredAndSortedUsers, paginatedUsers, totalPages;
  
  if (isServerSidePagination) {
    // Server-side pagination: use users directly from API
    filteredAndSortedUsers = users;
    paginatedUsers = users;
    totalPages = Math.ceil(totalAvailableUsers / usersPerPage);
  } else {
    // Client-side pagination for "all roles" view
    const allFilteredUsers = users
      .filter(user => {
        const matchesSearch = 
          user.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.role.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
        
        return matchesSearch && matchesStatus;
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
      
    filteredAndSortedUsers = allFilteredUsers;
    totalPages = Math.ceil(allFilteredUsers.length / usersPerPage);
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    paginatedUsers = allFilteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  }

  // Handle page change with server-side pagination support
  const handlePageChange = (page) => {
    console.log(`🔄 Page change requested: ${currentPage} → ${page}`);
    setCurrentPage(page);
    setSelectedUsers([]);
    
    if (filterRole !== 'all') {
      loadUsersByRole(filterRole, false, page);
    }
  };

  // Handle items per page change  
  const handleItemsPerPageChange = (newItemsPerPage) => {
    console.log(`📝 Items per page change: ${usersPerPage} → ${newItemsPerPage}`);
    setUsersPerPage(newItemsPerPage);
    setCurrentPage(1);
    setSelectedUsers([]);
    
    // If we're in server-side pagination mode, reload with new page size
    if (filterRole !== 'all') {
      loadUsersByRole(filterRole, false, 1);
    }
  };

  // Event handlers
  const handleEditUser = (user) => {
    console.log('Edit user:', user);
  };

  const handleViewUser = (user) => {
    console.log('View user:', user);
  };

  const handleDeleteUser = async (userId) => {
    try {
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
      setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
      setShowDeleteModal(false);
      toast.success(`Successfully deleted ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Failed to delete users:', error);
      toast.error('Failed to delete users. Please try again.');
    }
  };

  const handleSort = (property) => {
    const isAsc = sortBy === property && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedUsers(paginatedUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

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

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading roles...</Typography>
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
              {totalAvailableUsers > users.length && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  / {totalAvailableUsers}
                </Typography>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalAvailableUsers > users.length ? 'Loaded / Total Users' : 'Total Users'}
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
              {filterRole !== 'all' ? filterRole : 'All Roles'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Current Filter
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
                onChange={async (e) => {
                  const selectedRole = e.target.value;
                  setFilterRole(selectedRole);
                  setCurrentPage(1);
                  setSelectedUsers([]);
                  
                  if (selectedRole === 'all') {
                    await loadUsersAndRoles();
                  } else {
                    await loadUsersByRole(selectedRole, false, 1);
                  }
                }}
                label="Role"
                disabled={loading}
              >
                <MenuItem value="all">All Roles</MenuItem>
                {roles.map(role => (
                  <MenuItem key={role.id} value={role.shortname}>
                    {role.name || role.shortname}
                    {role.name && role.name !== role.shortname && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({role.shortname})
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
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
            </FormControl>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => console.log('Add user')}
            >
              Add User
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={async () => {
                if (filterRole === 'all') {
                  await loadUsersAndRoles();
                } else {
                  await loadUsersByRole(filterRole, false, currentPage);
                }
              }}
              disabled={loading}
            >
              Refresh
            </Button>
            
            {filterRole !== 'all' && users.length > 0 && totalAvailableUsers > users.length && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={isLoadingAll ? <CircularProgress size={16} /> : null}
                onClick={async () => {
                  await loadUsersByRole(filterRole, true);
                }}
                disabled={loading || isLoadingAll}
                sx={{ 
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.main',
                  }
                }}
              >
                {isLoadingAll ? 'Loading All Users...' : `Load All Users (${totalAvailableUsers})`}
              </Button>
            )}
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
                  <TableSortLabel
                    active={sortBy === 'status'}
                    direction={sortBy === 'status' ? sortOrder : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
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
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Loading users for {filterRole === 'all' ? 'all roles' : `role: ${filterRole}`}...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filterRole === 'all' && users.length === 0 && !searchQuery && filterStatus === 'all' ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Select a role to view users
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Choose a specific role from the dropdown above to load and view users.
                    </Typography>
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
                          setCurrentPage(1);
                          setSelectedUsers([]);
                          setUsers([]);
                          setTotalAvailableUsers(0);
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
                      <Stack spacing={0.5}>
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
                      </Stack>
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

        {/* Professional Pagination Controls - Only show when needed */}
        {(totalAvailableUsers > usersPerPage || totalPages > 1) && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={filterRole !== 'all' ? Math.ceil(totalAvailableUsers / usersPerPage) : totalPages}
            totalItems={filterRole !== 'all' ? totalAvailableUsers : filteredAndSortedUsers.length}
            itemsPerPage={usersPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            isLoading={loading}
          />
        )}
        
        {/* Show total count if no pagination needed */}
        {totalPages <= 1 && filteredAndSortedUsers.length > 0 && (
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Showing all {filteredAndSortedUsers.length.toLocaleString()} users
            </Typography>
          </Box>
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
    </Box>
  );
};

export default ManageUsers;

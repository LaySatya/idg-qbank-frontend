import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Pagination,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowForward as ArrowForwardIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import PaginationControls from '../shared/components/PaginationControls';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CoursesPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false); // Changed to false - no loading initially
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const [coursesPerPage, setCoursesPerPage] = useState(12); // For list view pagination
  const [hasSearched, setHasSearched] = useState(false); // Track if user has searched
  
  // Fetch courses from API - Now uses search endpoint when searching
  const fetchCourses = async (page = 1, search = '') => {
    // If no search term, don't fetch anything (Google-like behavior)
    if (!search.trim()) {
      setCourses([]);
      setTotalCourses(0);
      setTotalPages(1);
      setCurrentPage(1);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      
      // Use the search endpoint when there's a search term
      const response = await fetch(`${API_BASE_URL}/questions/searchcourses?criteriavalue=${encodeURIComponent(search.trim())}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to search courses: ${response.status}`);
      }

      const data = await response.json();
      console.log(' Course Search API Response:', data);

      const searchResults = data.courses || [];
      setCourses(searchResults);
      setTotalCourses(data.total || searchResults.length);
      
      // For search results, we typically get all results at once
      setTotalPages(1);
      setCurrentPage(1);

    } catch (error) {
      console.error(' Error searching courses:', error);
      toast.error('Failed to search courses');
      setCourses([]);
      setTotalCourses(0);
    } finally {
      setLoading(false);
    }
  };

  // Effects - Modified for search-only behavior
  useEffect(() => {
    setCurrentPage(1);
    fetchCourses(1, searchTerm);
  }, [searchTerm]); // Only search term dependency

  // Remove the currentPage effect since search results don't need pagination

  // Handlers
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleViewModeChange = (event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
      setCurrentPage(1); // Reset to first page when changing view mode
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setCoursesPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleCourseSelect = (course) => {
    // Save course information to localStorage
    localStorage.setItem('CourseID', course.id.toString());
    localStorage.setItem('CourseName', course.fullname || course.displayname);
    localStorage.setItem('selectedCourseData', JSON.stringify(course));
    
    toast.success(`Selected: ${course.fullname || course.displayname}`);
    
    // Navigate to question bank with the selected course
    navigate(`/question-bank?courseId=${course.id}`);
  };

  // Format date helper
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Get course image with authentication token
  const getCourseImage = (course) => {
    if (course.overviewfiles && course.overviewfiles.length > 0) {
      const fileurl = course.overviewfiles[0].fileurl;
      const token = localStorage.getItem('token');
      
      if (fileurl && token) {
        // Check if URL already has parameters
        const separator = fileurl.includes('?') ? '&' : '?';
        const authenticatedUrl = `${fileurl}${separator}token=${token}`;
        console.log(' Course image URL with token:', authenticatedUrl);
        return authenticatedUrl;
      }
      
      console.warn(' No token available for course image:', fileurl);
      return fileurl;
    }
    return null;
  };

  // Render course card for grid view
  const renderCourseCard = (course) => (
    <Card 
      key={course.id}
      sx={{
        height: 300, // Reduced height for simpler layout
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          borderColor: 'primary.main',
          '& .course-image': {
            transform: 'scale(1.05)',
          }
        },
        position: 'relative'
      }}
      onClick={() => handleCourseSelect(course)}
    >
      {/* Course Image */}
      <Box
        sx={{
          height: 180, // Balanced image height
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'grey.50',
        }}
      >
        {getCourseImage(course) ? (
          <img 
            className="course-image"
            src={getCourseImage(course)} 
            alt={course.fullname}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              transition: 'transform 0.3s ease'
            }}
            onError={(e) => {
              console.warn('Failed to load course image:', getCourseImage(course));
              // Hide the image and show fallback
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* Fallback avatar - always present but hidden if image loads */}
        <Box
          className="course-image"
          sx={{
            width: '100%',
            height: '100%',
            display: getCourseImage(course) ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            transition: 'transform 0.3s ease'
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: 'primary.main',
              fontSize: '2rem',
              fontWeight: 'bold'
            }}
          >
            {(course.fullname || course.shortname || 'C')[0].toUpperCase()}
          </Avatar>
        </Box>

        {/* Category badge */}
        {course.categoryname && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: 'primary.main', // Changed from white to primary color
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 600,
                color: 'white', // Changed to white text for contrast
                fontSize: '0.75rem'
              }}
            >
              {course.categoryname}
            </Typography>
          </Box>
        )}
      </Box>

      <CardContent sx={{ 
        flexGrow: 1, 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}>
        {/* Course Title */}
        <Typography 
          variant="h6"
          component="h3"
          sx={{ 
            fontWeight: 400, // Changed from 700 to 400 (not bold)
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            color: 'text.primary',
            fontSize: '1.1rem',
            textAlign: 'left' // Changed from 'center' to 'left'
          }}
        >
          {course.fullname || course.displayname}
        </Typography>
      </CardContent>
    </Card>
  );

  // Render course item for list view
  const renderCourseListItem = (course) => (
    <Card 
      key={course.id}
      sx={{
        mb: 3,
        cursor: 'pointer',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          borderColor: 'primary.main',
          '& .course-list-image': {
            transform: 'scale(1.05)',
          }
        }
      }}
      onClick={() => handleCourseSelect(course)}
    >
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', minHeight: 140 }}>
          {/* Course Image/Avatar */}
          <Box 
            sx={{ 
              width: 200,
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: 'grey.50'
            }}
          >
            {getCourseImage(course) ? (
              <img 
                className="course-list-image"
                src={getCourseImage(course)} 
                alt={course.fullname}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease'
                }}
                onError={(e) => {
                  console.warn('Failed to load course image:', getCourseImage(course));
                  // Hide the image and show fallback
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            
            {/* Fallback avatar - always present but hidden if image loads */}
            <Box
              className="course-list-image"
              sx={{
                width: '100%',
                height: '100%',
                display: getCourseImage(course) ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                transition: 'transform 0.3s ease'
              }}
            >
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  color: 'primary.main',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}
              >
                {(course.fullname || course.shortname || 'C')[0].toUpperCase()}
              </Avatar>
            </Box>

            {/* Visibility badge */}
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 12, 
                right: 12,
                backgroundColor: course.visible ? 'success.main' : 'error.main',
                borderRadius: '50%',
                p: 0.5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              {course.visible ? (
                <VisibilityIcon sx={{ color: 'white', fontSize: 16 }} />
              ) : (
                <VisibilityOffIcon sx={{ color: 'white', fontSize: 16 }} />
              )}
            </Box>
          </Box>

          {/* Course Info */}
          <Box sx={{ 
            flexGrow: 1, 
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {/* Header section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography 
                  variant="h6" 
                  component="h3"
                  sx={{ 
                    fontWeight: 700,
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    flex: 1,
                    mr: 2,
                    fontSize: '1.1rem'
                  }}
                >
                  {course.fullname || course.displayname}
                </Typography>
                
                <ArrowForwardIcon 
                  sx={{ 
                    color: 'primary.main', 
                    fontSize: 24,
                    transition: 'transform 0.2s ease',
                    '&:hover': { transform: 'translateX(4px)' }
                  }} 
                />
              </Box>

              {/* Short name and Category */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {course.shortname && (
                  <Chip 
                    label={course.shortname}
                    size="small"
                    sx={{ 
                      backgroundColor: 'primary.light',
                      color: 'primary.dark',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}
                  />
                )}
                {course.categoryname && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CategoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {course.categoryname}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Summary */}
              {course.summary && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {course.summary.replace(/<[^>]*>/g, '')}
                </Typography>
              )}
            </Box>

            {/* Footer section */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Left side - chips */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={(course.format || 'COURSE').toUpperCase()} 
                  size="small" 
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    borderColor: 'primary.main',
                    color: 'primary.main'
                  }}
                />
                {course.idnumber && (
                  <Chip 
                    label={course.idnumber}
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      fontSize: '0.7rem',
                      fontWeight: 500
                    }}
                  />
                )}
              </Box>

              {/* Right side - dates */}
              {(course.startdate > 0 || course.enddate > 0) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {course.startdate > 0 ? formatDate(course.startdate) : 'Ongoing'} - {course.enddate > 0 ? formatDate(course.enddate) : 'No end'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
     <Box sx={{ p: 3 }}>
    {/* Header */}
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <SchoolIcon sx={{ fontSize: 32, color: 'primary.dark' }} />
        Course Search
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {hasSearched
          ? `Found ${totalCourses} course${totalCourses !== 1 ? 's' : ''} matching your search`
          : 'Search for courses by name to get started'
        }
      </Typography>
    </Box>

      {/* Search and View Controls */}
                    <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 6 },
              mb: 3,
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid',
              borderColor: 'divider',
              background: '#fff'
            }}
          >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          {/* Search */}
                            <TextField
                      placeholder="Search courses by name..."
                      variant="outlined"
                      size="small"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      sx={{
                        minWidth: 500,
                        maxWidth: 400,
                        background: '#fff',
                        borderRadius: 3, // More rounded
                        boxShadow: '0 2px 8px rgba(80,112,255,0.06)',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          background: '#fff',
                          paddingRight: 0,
                          fontSize: 16,
                          height: 48,
                          '& fieldset': {
                           borderColor: '#e0e7ef',  // light gray border
                          },
                          '&:hover fieldset': {
                            borderColor: '#b6c2e2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#90caf9', 
                             boxShadow: 'none',  
                          },
                        },
                        '& .MuiInputAdornment-root': {
                          marginRight: 1,
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                          </InputAdornment>
                        ),
                        sx: {
                          pl: 1.5,
                          pr: 0,
                          fontSize: 16,
                          height: 48,
                          background: '#fff',
                          borderRadius: 6,
                        }
                      }}
                    />
          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="grid">
              <ViewModuleIcon />
            </ToggleButton>
            <ToggleButton value="list">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Courses Content */}
      {!loading && (
        <>
          {courses.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {!hasSearched 
                  ? 'Start searching for courses'
                  : 'No courses found'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {!hasSearched 
                  ? 'Type in the search box above to find courses by name'
                  : searchTerm 
                    ? `No courses found matching "${searchTerm}". Try different keywords.`
                    : 'Enter a search term to find courses'
                }
              </Typography>
            </Box>
          ) : (
            <>
              {/* Results summary - only show when there are results */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Found {courses.length} course{courses.length !== 1 ? 's' : ''} matching "{searchTerm}"
                </Typography>
              </Box>

              {/* Courses Grid/List */}
              {viewMode === 'grid' ? (
                <Box sx={{ flexGrow: 1 }}>
                  <Grid container spacing={3} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                    {courses.map((course) => (
                      <Grid key={course.id} size={{ xs: 4, sm: 4, md: 4, lg: 4 }}>
                        {renderCourseCard(course)}
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Box>
                  {courses.map((course) => renderCourseListItem(course))}
                </Box>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default CoursesPage;
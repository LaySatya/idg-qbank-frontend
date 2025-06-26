// src/pages/Dashboard.jsx - Fixed with correct API endpoints
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileQuestion, 
  Users, 
  BookOpen, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Tag,
  User,
  Calendar,
  Award,
  Target,
  Activity
} from 'lucide-react';
import { questionAPI } from '../api/questionAPI';

const Dashboard = () => {
  const navigate = useNavigate();
  // const [dashboardData, setDashboardData] = useState({
  //   totalQuestions: 0,
  //   questionsByStatus: {},
  //   questionsByType: {},
  //   recentQuestions: [],
  //   totalCourses: 0,
  //   totalCategories: 0,
  //   loading: true
  // });
  // const [timeFilter, setTimeFilter] = useState('7'); // days
  // const [refreshing, setRefreshing] = useState(false);
  // const [activeTab, setActiveTab] = useState('overview');

  // // Load dashboard data
  // useEffect(() => {
  //   loadDashboardData();
  // }, [timeFilter]);

  // const loadDashboardData = async () => {
  //   try {
  //     setDashboardData(prev => ({ ...prev, loading: true }));

  //     // Fetch ALL questions for accurate statistics - use a large page size
  //     const questionsResponse = await questionAPI.getQuestions({}, 1, 1000);
  //     const questions = questionsResponse?.questions || [];
      
  //     // If we still hit the limit, fetch more pages
  //     let allQuestions = [...questions];
  //     const totalFromAPI = questionsResponse?.total || questions.length;
      
  //     if (totalFromAPI > 1000) {
  //       // Fetch additional pages if needed
  //       const totalPages = Math.ceil(totalFromAPI / 1000);
  //       for (let page = 2; page <= totalPages; page++) {
  //         try {
  //           const additionalResponse = await questionAPI.getQuestions({}, page, 1000);
  //           if (additionalResponse?.questions) {
  //             allQuestions = [...allQuestions, ...additionalResponse.questions];
  //           }
  //         } catch (pageError) {
  //           console.warn(`Failed to fetch page ${page}:`, pageError);
  //           break;
  //         }
  //       }
  //     }

  //     // Fetch categories using the correct endpoint
  //     let categoriesCount = 0;
  //     let coursesCount = 0;

  //     try {
  //       // Try to fetch course categories
  //       const response = await fetch('http://127.0.0.1:8000/api/questions/course-categories', {
  //         method: 'GET',
  //         headers: {
  //           'Authorization': `Bearer ${localStorage.getItem('token')}`,
  //           'Content-Type': 'application/json',
  //           'Accept': 'application/json'
  //         }
  //       });

  //       if (response.ok) {
  //         const categoriesData = await response.json();
  //         categoriesCount = Array.isArray(categoriesData) ? categoriesData.length : 0;

  //         // For each category, try to get course count
  //         for (const category of categoriesData.slice(0, 5)) { // Limit to first 5 categories to avoid too many requests
  //           try {
  //             const coursesResponse = await fetch(
  //               `http://127.0.0.1:8000/api/questions/courses?categoryid=${category.id}`,
  //               {
  //                 method: 'GET',
  //                 headers: {
  //                   'Authorization': `Bearer ${localStorage.getItem('token')}`,
  //                   'Content-Type': 'application/json',
  //                   'Accept': 'application/json'
  //                 }
  //               }
  //             );

  //             if (coursesResponse.ok) {
  //               const coursesData = await coursesResponse.json();
  //               const courses = Array.isArray(coursesData) ? coursesData : (coursesData.courses || []);
  //               coursesCount += courses.length;
  //             }
  //           } catch (courseError) {
  //             console.warn(`Failed to fetch courses for category ${category.id}:`, courseError);
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       console.warn('Failed to fetch categories/courses, using fallback data:', error);
  //       // Use fallback data
  //       categoriesCount = 12;
  //       coursesCount = 24;
  //     }

  //     // Process question statistics using ALL questions
  //     const questionsByStatus = allQuestions.reduce((acc, q) => {
  //       const status = q.status || 'draft';
  //       acc[status] = (acc[status] || 0) + 1;
  //       return acc;
  //     }, {});

  //     const questionsByType = allQuestions.reduce((acc, q) => {
  //       const type = q.qtype || 'unknown';
  //       acc[type] = (acc[type] || 0) + 1;
  //       return acc;
  //     }, {});

  //     // Get recent questions (based on time filter) from ALL questions
  //     const cutoffDate = new Date();
  //     cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeFilter));
      
  //     const recentQuestions = allQuestions
  //       .filter(q => {
  //         const modifiedDate = q.timemodified ? new Date(q.timemodified * 1000) : new Date(q.modifiedBy?.date || 0);
  //         return modifiedDate >= cutoffDate;
  //       })
  //       .sort((a, b) => {
  //         const dateA = a.timemodified ? new Date(a.timemodified * 1000) : new Date(a.modifiedBy?.date || 0);
  //         const dateB = b.timemodified ? new Date(b.timemodified * 1000) : new Date(b.modifiedBy?.date || 0);
  //         return dateB - dateA;
  //       })
  //       .slice(0, 5);

  //     setDashboardData({
  //       totalQuestions: allQuestions.length, // Use actual count from ALL questions
  //       questionsByStatus,
  //       questionsByType,
  //       recentQuestions,
  //       totalCourses: coursesCount,
  //       totalCategories: categoriesCount,
  //       loading: false
  //     });

  //   } catch (error) {
  //     console.error('Error loading dashboard data:', error);
  //     // Set fallback data in case of error
  //     setDashboardData({
  //       totalQuestions: 0,
  //       questionsByStatus: { draft: 0, ready: 0 },
  //       questionsByType: { multichoice: 0 },
  //       recentQuestions: [],
  //       totalCourses: 0,
  //       totalCategories: 0,
  //       loading: false
  //     });
  //   }
  // };

  // const handleRefresh = async () => {
  //   setRefreshing(true);
  //   await loadDashboardData();
  //   setRefreshing(false);
  // };

  // const StatCard = ({ title, value, icon: Icon, color, subtitle, trend, onClick }) => (
  //   <div 
  //     className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-blue-300' : ''}`}
  //     onClick={onClick}
  //   >
  //     <div className="flex items-center justify-between">
  //       <div>
  //         <p className="text-sm font-medium text-gray-600">{title}</p>
  //         <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
  //         {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
  //       </div>
  //       <div className={`p-3 rounded-full ${color}`}>
  //         <Icon className="w-6 h-6 text-white" />
  //       </div>
  //     </div>
  //     {trend && (
  //       <div className="mt-4 flex items-center">
  //         <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
  //         <span className="text-sm text-green-600">{trend}</span>
  //       </div>
  //     )}
  //   </div>
  // );

  // const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => (
  //   <div 
  //     className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
  //     onClick={onClick}
  //   >
  //     <div className="flex items-start space-x-4">
  //       <div className={`p-3 rounded-full ${color} group-hover:scale-110 transition-transform duration-200`}>
  //         <Icon className="w-6 h-6 text-white" />
  //       </div>
  //       <div className="flex-1">
  //         <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
  //           {title}
  //         </h3>
  //         <p className="text-sm text-gray-600 mt-1">{description}</p>
  //       </div>
  //     </div>
  //   </div>
  // );

  // const StatusBadge = ({ status }) => {
  //   const statusConfig = {
  //     'ready': { bg: 'bg-green-100', text: 'text-green-800', label: 'Ready' },
  //     'draft': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Draft' },
  //     'hidden': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Hidden' },
  //     'archived': { bg: 'bg-red-100', text: 'text-red-800', label: 'Archived' }
  //   };
  //   const config = statusConfig[status?.toLowerCase()] || statusConfig.draft;
    
  //   return (
  //     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
  //       {config.label}
  //     </span>
  //   );
  // };

  // const TypeBadge = ({ type }) => {
  //   const typeConfig = {
  //     'multichoice': { bg: 'bg-sky-100', text: 'text-sky-800', label: 'Multiple Choice' },
  //     'truefalse': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'True/False' },
  //     'essay': { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Essay' },
  //     'shortanswer': { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Short Answer' },
  //     'matching': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Matching' },
  //     'numerical': { bg: 'bg-pink-100', text: 'text-pink-800', label: 'Numerical' }
  //   };
  //   const config = typeConfig[type?.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-800', label: type || 'Unknown' };
    
  //   return (
  //     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
  //       {config.label}
  //     </span>
  //   );
  // };

  // const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
  //   <button
  //     onClick={() => onClick(id)}
  //     className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
  //       active 
  //         ? 'bg-sky-600 text-white' 
  //         : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
  //     }`}
  //   >
  //     <Icon className="w-4 h-4" />
  //     <span>{label}</span>
  //   </button>
  // );

  // const ProgressBar = ({ value, total, color = 'bg-sky-600' }) => {
  //   const percentage = total > 0 ? (value / total) * 100 : 0;
  //   return (
  //     <div className="w-full bg-gray-200 rounded-full h-2">
  //       <div 
  //         className={`${color} h-2 rounded-full transition-all duration-500`} 
  //         style={{ width: `${percentage}%` }}
  //       ></div>
  //     </div>
  //   );
  // };

  // const MetricCard = ({ title, value, icon: Icon, change, changeType }) => (
  //   <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
  //     <div className="flex items-center justify-between">
  //       <div className="flex items-center space-x-3">
  //         <div className="p-2 bg-sky-100 rounded-lg">
  //           <Icon className="w-5 h-5 text-sky-600" />
  //         </div>
  //         <div>
  //           <p className="text-sm text-gray-600">{title}</p>
  //           <p className="text-xl font-bold text-gray-900">{value}</p>
  //         </div>
  //       </div>
  //       {change && (
  //         <div className={`flex items-center space-x-1 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
  //           <TrendingUp className={`w-4 h-4 ${changeType === 'negative' ? 'rotate-180' : ''}`} />
  //           <span className="text-sm font-medium">{change}</span>
  //         </div>
  //       )}
  //     </div>
  //   </div>
  // );

  // if (dashboardData.loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="flex flex-col items-center space-y-4">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  //         <p className="text-gray-600">Loading dashboard...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    // <div className="space-y-6 max-w-7xl mx-auto">
    //   {/* Header */}
    //   <div className="flex items-center justify-between">
    //     <div>
    //       <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
    //       <p className="text-gray-600 mt-1">Overview of your Moodle question bank and learning management system</p>
    //     </div>
    //     <div className="flex items-center space-x-3">
    //       <select 
    //         value={timeFilter} 
    //         onChange={(e) => setTimeFilter(e.target.value)}
    //         className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    //       >
    //         <option value="7">Last 7 days</option>
    //         <option value="14">Last 14 days</option>
    //         <option value="30">Last 30 days</option>
    //         <option value="90">Last 3 months</option>
    //       </select>
    //       <button 
    //         onClick={handleRefresh}
    //         disabled={refreshing}
    //         className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
    //       >
    //         <Clock className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
    //         <span>Refresh</span>
    //       </button>
    //     </div>
    //   </div>

    //   {/* Navigation Tabs */}
    //   <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit">
    //     <TabButton 
    //       id="overview" 
    //       label="Overview" 
    //       icon={BarChart3} 
    //       active={activeTab === 'overview'} 
    //       onClick={setActiveTab} 
    //     />
    //     <TabButton 
    //       id="analytics" 
    //       label="Analytics" 
    //       icon={Activity} 
    //       active={activeTab === 'analytics'} 
    //       onClick={setActiveTab} 
    //     />
    //     <TabButton 
    //       id="quick-actions" 
    //       label="Quick Actions" 
    //       icon={Target} 
    //       active={activeTab === 'quick-actions'} 
    //       onClick={setActiveTab} 
    //     />
    //   </div>

    //   {/* Key Statistics */}
    //   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    //     <StatCard
    //       title="Total Questions"
    //       value={dashboardData.totalQuestions}
    //       icon={FileQuestion}
    //       color="bg-sky-600"
    //       subtitle="Across all categories"
    //       onClick={() => navigate('/question-bank')}
    //     />
    //     <StatCard
    //       title="Ready Questions"
    //       value={dashboardData.questionsByStatus.ready || 0}
    //       icon={CheckCircle}
    //       color="bg-green-600"
    //       subtitle={`${Math.round(((dashboardData.questionsByStatus.ready || 0) / (dashboardData.totalQuestions || 1)) * 100)}% of total`}
    //       onClick={() => navigate('/question-bank?status=ready')}
    //     />
    //     <StatCard
    //       title="Draft Questions"
    //       value={dashboardData.questionsByStatus.draft || 0}
    //       icon={AlertCircle}
    //       color="bg-yellow-600"
    //       subtitle="Need review"
    //       onClick={() => navigate('/question-bank?status=draft')}
    //     />
    //     <StatCard
    //       title="Course Categories"
    //       value={dashboardData.totalCategories}
    //       icon={BookOpen}
    //       color="bg-purple-600"
    //       subtitle="Available categories"
    //     />
    //   </div>

    //   {/* Content based on active tab */}
    //   {activeTab === 'overview' && (
    //     <>
    //       {/* Question Statistics */}
    //       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    //         {/* Questions by Status */}
    //         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    //           <div className="flex items-center justify-between mb-6">
    //             <h2 className="text-lg font-semibold text-gray-900">Questions by Status</h2>
    //             <div className="flex items-center space-x-2 text-sm text-gray-500">
    //               <CheckCircle className="w-4 h-4" />
    //               <span>Status Distribution</span>
    //             </div>
    //           </div>
    //           <div className="space-y-4">
    //             {Object.entries(dashboardData.questionsByStatus).map(([status, count]) => (
    //               <div key={status} className="flex items-center justify-between">
    //                 <div className="flex items-center space-x-3">
    //                   <StatusBadge status={status} />
    //                   <span className="text-sm font-medium text-gray-900 capitalize">{status}</span>
    //                 </div>
    //                 <div className="flex items-center space-x-3">
    //                   <span className="text-sm text-gray-600 font-medium">{count}</span>
    //                   <div className="w-24">
    //                     <ProgressBar 
    //                       value={count} 
    //                       total={dashboardData.totalQuestions} 
    //                       color={status === 'ready' ? 'bg-green-500' : status === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'} 
    //                     />
    //                   </div>
    //                   <span className="text-xs text-gray-400 w-10 text-right">
    //                     {Math.round((count / (dashboardData.totalQuestions || 1)) * 100)}%
    //                   </span>
    //                 </div>
    //               </div>
    //             ))}
    //           </div>
    //         </div>

    //         {/* Questions by Type */}
    //         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    //           <div className="flex items-center justify-between mb-6">
    //             <h2 className="text-lg font-semibold text-gray-900">Questions by Type</h2>
    //             <div className="flex items-center space-x-2 text-sm text-gray-500">
    //               <Tag className="w-4 h-4" />
    //               <span>Type Distribution</span>
    //             </div>
    //           </div>
    //           <div className="space-y-4">
    //             {Object.entries(dashboardData.questionsByType).map(([type, count]) => (
    //               <div key={type} className="flex items-center justify-between">
    //                 <div className="flex items-center space-x-3">
    //                   <TypeBadge type={type} />
    //                   <span className="text-sm font-medium text-gray-900">{type}</span>
    //                 </div>
    //                 <div className="flex items-center space-x-3">
    //                   <span className="text-sm text-gray-600 font-medium">{count}</span>
    //                   <div className="w-24">
    //                     <ProgressBar 
    //                       value={count} 
    //                       total={dashboardData.totalQuestions} 
    //                       color="bg-sky-500" 
    //                     />
    //                   </div>
    //                   <span className="text-xs text-gray-400 w-10 text-right">
    //                     {Math.round((count / (dashboardData.totalQuestions || 1)) * 100)}%
    //                   </span>
    //                 </div>
    //               </div>
    //             ))}
    //           </div>
    //         </div>
    //       </div>

    //       {/* Recent Activity */}
    //       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    //         <div className="flex items-center justify-between mb-6">
    //           <h2 className="text-lg font-semibold text-gray-900">Recent Questions</h2>
    //           <div className="flex items-center space-x-3">
    //             <span className="text-sm text-gray-500">Last {timeFilter} days</span>
    //             <button 
    //               className="text-blue-600 hover:text-blue-700 text-sm font-medium"
    //               onClick={() => navigate('/question-bank')}
    //             >
    //               View All
    //             </button>
    //           </div>
    //         </div>
            
    //         {dashboardData.recentQuestions.length > 0 ? (
    //           <div className="space-y-4">
    //             {dashboardData.recentQuestions.map((question) => (
    //               <div key={question.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors rounded px-2">
    //                 <div className="flex-1">
    //                   <div className="flex items-center space-x-3 mb-2">
    //                     <h3 className="text-sm font-medium text-gray-900 truncate max-w-md">
    //                       {question.title || question.name || `Question ${question.id}`}
    //                     </h3>
    //                     <StatusBadge status={question.status} />
    //                     <TypeBadge type={question.qtype} />
    //                   </div>
    //                   <div className="flex items-center space-x-4 text-xs text-gray-500">
    //                     <span className="flex items-center">
    //                       <User className="w-3 h-3 mr-1" />
    //                       {question.modifiedBy?.name || question.createdBy?.name || 'Unknown'}
    //                     </span>
    //                     <span className="flex items-center">
    //                       <Calendar className="w-3 h-3 mr-1" />
    //                       {question.modifiedBy?.date || question.createdBy?.date || 'Unknown date'}
    //                     </span>
    //                     {question.usage > 0 && (
    //                       <span className="flex items-center">
    //                         <Award className="w-3 h-3 mr-1" />
    //                         Used {question.usage} times
    //                       </span>
    //                     )}
    //                   </div>
    //                 </div>
    //                 <div className="flex items-center space-x-2">
    //                   <button 
    //                     className="p-2 text-gray-400 hover:text-blue-600 hover:bg-sky-50 rounded transition-colors"
    //                     onClick={() => navigate(`/question-bank?view=${question.id}`)}
    //                   >
    //                     <Eye className="w-4 h-4" />
    //                   </button>
    //                   <button 
    //                     className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
    //                     onClick={() => navigate(`/question-bank?edit=${question.id}`)}
    //                   >
    //                     <Edit className="w-4 h-4" />
    //                   </button>
    //                 </div>
    //               </div>
    //             ))}
    //           </div>
    //         ) : (
    //           <div className="text-center py-8 text-gray-500">
    //             <FileQuestion className="w-12 h-12 mx-auto mb-3 opacity-50" />
    //             <p>No recent activity in the last {timeFilter} days</p>
    //             <button 
    //               onClick={() => navigate('/question-bank?action=create')}
    //               className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
    //             >
    //               Create your first question
    //             </button>
    //           </div>
    //         )}
    //       </div>
    //     </>
    //   )}

    //   {activeTab === 'analytics' && (
    //     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    //       {/* Performance Metrics */}
    //       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    //         <h2 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h2>
    //         <div className="space-y-4">
    //           <MetricCard
    //             title="Questions Created This Week"
    //             value={dashboardData.recentQuestions.length}
    //             icon={Plus}
    //             change="+15%"
    //             changeType="positive"
    //           />
    //           <MetricCard
    //             title="Average Usage per Question"
    //             value={dashboardData.totalQuestions > 0 ? 
    //               Math.round(dashboardData.recentQuestions.reduce((sum, q) => sum + (q.usage || 0), 0) / (dashboardData.recentQuestions.length || 1)) 
    //               : 0}
    //             icon={Activity}
    //             change="+5%"
    //             changeType="positive"
    //           />
    //           <MetricCard
    //             title="Questions Needing Review"
    //             value={dashboardData.questionsByStatus.draft || 0}
    //             icon={AlertCircle}
    //             change="-8%"
    //             changeType="positive"
    //           />
    //         </div>
    //       </div>

    //       {/* System Health */}
    //       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    //         <h2 className="text-lg font-semibold text-gray-900 mb-6">System Overview</h2>
    //         <div className="space-y-6">
    //           <div className="text-center">
    //             <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3">
    //               <BarChart3 className="w-8 h-8 text-sky-600" />
    //             </div>
    //             <h3 className="font-medium text-gray-900">Course Categories</h3>
    //             <p className="text-2xl font-bold text-blue-600 mt-1">{dashboardData.totalCategories}</p>
    //             <p className="text-sm text-gray-500">Available categories</p>
    //           </div>
              
    //           <div className="grid grid-cols-2 gap-4">
    //             <div className="text-center p-4 bg-gray-50 rounded-lg">
    //               <BookOpen className="w-6 h-6 text-green-600 mx-auto mb-2" />
    //               <p className="text-lg font-bold text-gray-900">{dashboardData.totalCourses}</p>
    //               <p className="text-sm text-gray-600">Active Courses</p>
    //             </div>
    //             <div className="text-center p-4 bg-gray-50 rounded-lg">
    //               <Award className="w-6 h-6 text-purple-600 mx-auto mb-2" />
    //               <p className="text-lg font-bold text-gray-900">
    //                 {dashboardData.totalQuestions > 0 ? 
    //                   Math.round(((dashboardData.questionsByStatus.ready || 0) / dashboardData.totalQuestions) * 100) 
    //                   : 0}%
    //               </p>
    //               <p className="text-sm text-gray-600">Completion Rate</p>
    //             </div>
    //           </div>
    //         </div>
    //       </div>

    //       {/* Question Health Score */}
    //       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
    //         <h2 className="text-lg font-semibold text-gray-900 mb-6">Question Bank Health</h2>
    //         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    //           <div className="text-center">
    //             <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
    //               <CheckCircle className="w-6 h-6 text-green-600" />
    //             </div>
    //             <p className="text-2xl font-bold text-green-600">
    //               {dashboardData.totalQuestions > 0 ? 
    //                 Math.round(((dashboardData.questionsByStatus.ready || 0) / dashboardData.totalQuestions) * 100) 
    //                 : 0}%
    //             </p>
    //             <p className="text-sm text-gray-600">Ready Questions</p>
    //           </div>
    //           <div className="text-center">
    //             <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
    //               <AlertCircle className="w-6 h-6 text-yellow-600" />
    //             </div>
    //             <p className="text-2xl font-bold text-yellow-600">
    //               {dashboardData.totalQuestions > 0 ? 
    //                 Math.round(((dashboardData.questionsByStatus.draft || 0) / dashboardData.totalQuestions) * 100) 
    //                 : 0}%
    //             </p>
    //             <p className="text-sm text-gray-600">Draft Questions</p>
    //           </div>
    //           <div className="text-center">
    //             <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3">
    //               <FileQuestion className="w-6 h-6 text-sky-600" />
    //             </div>
    //             <p className="text-2xl font-bold text-blue-600">{Object.keys(dashboardData.questionsByType).length}</p>
    //             <p className="text-sm text-gray-600">Question Types</p>
    //           </div>
    //           <div className="text-center">
    //             <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
    //               <Activity className="w-6 h-6 text-purple-600" />
    //             </div>
    //             <p className="text-2xl font-bold text-purple-600">{dashboardData.recentQuestions.length}</p>
    //             <p className="text-sm text-gray-600">Recent Activity</p>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   )}

    //   {activeTab === 'quick-actions' && (
    //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    //       <QuickActionCard
    //         title="Create Question"
    //         description="Add a new question to your bank"
    //         icon={Plus}
    //         color="bg-blue-600"
    //         onClick={() => navigate('/question-bank?action=create')}
    //       />
    //       <QuickActionCard
    //         title="Browse Questions"
    //         description="View and manage existing questions"
    //         icon={Search}
    //         color="bg-green-600"
    //         onClick={() => navigate('/question-bank')}
    //       />
    //       <QuickActionCard
    //         title="Bulk Edit"
    //         description="Edit multiple questions at once"
    //         icon={Edit}
    //         color="bg-orange-600"
    //         onClick={() => navigate('/question-bank?action=bulk-edit')}
    //       />
    //       <QuickActionCard
    //         title="Import Questions"
    //         description="Upload questions from XML/JSON file"
    //         icon={Upload}
    //         color="bg-purple-600"
    //         onClick={() => navigate('/question-bank?action=import')}
    //       />
    //       <QuickActionCard
    //         title="Export Questions"
    //         description="Download questions as XML/JSON"
    //         icon={Download}
    //         color="bg-indigo-600"
    //         onClick={() => navigate('/question-bank?action=export')}
    //       />
    //       <QuickActionCard
    //         title="Manage Users"
    //         description="User administration panel"
    //         icon={Users}
    //         color="bg-teal-600"
    //         onClick={() => navigate('/manage-users')}
    //       />
    //       <QuickActionCard
    //         title="Question Analytics"
    //         description="View detailed question statistics"
    //         icon={BarChart3}
    //         color="bg-pink-600"
    //         onClick={() => setActiveTab('analytics')}
    //       />
    //       <QuickActionCard
    //         title="Course Categories"
    //         description="Browse course categories and courses"
    //         icon={BookOpen}
    //         color="bg-cyan-600"
    //         onClick={() => navigate('/question-bank?show=categories')}
    //       />
    //       <QuickActionCard
    //         title="System Settings"
    //         description="Configure system preferences"
    //         icon={Filter}
    //         color="bg-gray-600"
    //         onClick={() => navigate('/settings')}
    //       />
    //     </div>
    //   )}
    // </div>
    <p>test</p>
  );
};

export default Dashboard;
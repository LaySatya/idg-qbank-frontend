import React, { useState, useEffect, useRef } from 'react';
import {
  faEdit, faTrash, faCopy, faDownload, faChevronDown, faUsers, faEye,
  faChartBar, faExclamationTriangle, faCheckCircle, faBug, faTag,
  faPlusCircle, faMinusCircle, faTimes, faSearch, faPlus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-hot-toast';

const statusOptions = [
  {
    value: 'draft',
    label: 'Draft',
    color: 'text-yellow-800',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500" />
  },
  {
    value: 'ready',
    label: 'Ready',
    color: 'text-green-800',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
  }
];

const BulkActionsRow = ({
  selectedQuestions,
  setSelectedQuestions,
  setShowBulkEditModal,
  onBulkDelete,
  onBulkStatusChange,
  questions,
  setQuestions
}) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [commonTags, setCommonTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const statusDropdownRef = useRef(null);
  const moreActionsRef = useRef(null);
  const tagDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
      if (moreActionsRef.current && !moreActionsRef.current.contains(event.target)) {
        setShowMoreActions(false);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target)) {
        setShowTagDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all tags when dropdown opens
  useEffect(() => {
    if (showTagDropdown) {
      fetchAllTags();
      fetchCommonTags();
    }
  }, [showTagDropdown]);

  const fetchAllTags = async () => {
    setLoadingTags(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/questions/tags', {
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
      toast.error('Failed to load tags');
    } finally {
      setLoadingTags(false);
    }
  };

  const fetchCommonTags = async () => {
    if (selectedQuestions.length === 0) return;
    try {
      const tagLists = await Promise.all(
        selectedQuestions.map(qid =>
          fetch(`http://127.0.0.1:8000/api/questions/question-tags?questionid=${qid}`, {
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
      const res = await fetch('http://127.0.0.1:8000/api/questions/tags', {
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
        toast.success('Tag created successfully!');
      } else {
        toast.error(data.message || 'Failed to create tag');
      }
    } catch (error) {
      toast.error('Error creating tag');
    }
  };

  const handleAddTag = async (tagId) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/questions/bulk-tags', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          questionids: selectedQuestions,
          tagids: [tagId]
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setQuestions(prevQuestions =>
          prevQuestions.map(q => {
            if (!selectedQuestions.includes(q.id)) return q;
            let newTags = Array.isArray(q.tags) ? [...q.tags] : [];
            const tagObj = allTags.find(t => t.id === tagId);
            if (tagObj && !newTags.some(t => t.id === tagId)) {
              newTags.push(tagObj);
            }
            return { ...q, tags: newTags };
          })
        );
        toast.success('Tag added successfully!');
        fetchCommonTags();
      } else {
        toast.error(data.message || 'Failed to add tag');
      }
    } catch (error) {
      toast.error('Error adding tag');
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/questions/bulk-tags', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          questionids: selectedQuestions,
          tagids: [tagId]
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setQuestions(prevQuestions =>
          prevQuestions.map(q => {
            if (!selectedQuestions.includes(q.id)) return q;
            let newTags = Array.isArray(q.tags) ? [...q.tags] : [];
            newTags = newTags.filter(t => t.id !== tagId);
            return { ...q, tags: newTags };
          })
        );
        toast.success('Tag removed successfully!');
        fetchCommonTags();
      } else {
        toast.error(data.message || 'Failed to remove tag');
      }
    } catch (error) {
      toast.error('Error removing tag');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedQuestions.length) {
      toast.error('Please select at least one question.');
      return;
    }
    
    const statusLabel = statusOptions.find(s => s.value === newStatus)?.label || newStatus;
    
    if (window.confirm(`Change status of ${selectedQuestions.length} question(s) to "${statusLabel}"?`)) {
      try {
        if (onBulkStatusChange) {
          await onBulkStatusChange(selectedQuestions, newStatus);
          toast.success(`Status updated to "${statusLabel}" for ${selectedQuestions.length} question(s)`);
        }
      } catch (error) {
        toast.error(`Failed to update status to "${statusLabel}"`);
      }
    }
    setShowStatusDropdown(false);
  };

  const filteredTags = allTags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableTags = filteredTags.filter(tag => 
    !commonTags.some(commonTag => commonTag.id === tag.id)
  );

  if (selectedQuestions.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm mb-4 font-sans">
      {/* Main Actions Bar */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        {/* Selection Info */}
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 bg-blue-100 rounded flex items-center justify-center">
            <FontAwesomeIcon icon={faUsers} className="text-blue-600" />
          </span>
          <span className="text-sm text-gray-800">
            {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
          </span>
          <button
            className="ml-3 text-xs text-blue-600 hover:text-blue-800 underline"
            onClick={() => setSelectedQuestions([])}
          >
            Clear
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Edit */}
          <button
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded hover:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
            onClick={() => setShowBulkEditModal(true)}
          >
            <FontAwesomeIcon icon={faEdit} />
            Bulk Edit
          </button>

          {/* Tag Dropdown */}
          <div className="relative" ref={tagDropdownRef}>
            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
              onClick={() => setShowTagDropdown(!showTagDropdown)}
            >
              <FontAwesomeIcon icon={faTag} />
              Manage Tags
              <FontAwesomeIcon 
                icon={faChevronDown} 
                className={`ml-1 transition-transform ${showTagDropdown ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {showTagDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 w-80">
                <div className="p-3">
                  {/* Search Bar */}
                  <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-sm" />
                    </div>
                    <input
                      type="text"
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-md w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Create New Tag Input */}
                  {searchTerm && !allTags.some(t => t.name.toLowerCase() === searchTerm.toLowerCase()) && (
                    <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="New tag name"
                          value={newTagName || searchTerm}
                          onChange={(e) => setNewTagName(e.target.value)}
                        />
                        <button
                          onClick={handleCreateTag}
                          className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Current Tags Section */}
                  {commonTags.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        Current Tags
                      </h5>
                      <div className="max-h-24 overflow-y-auto">
                        {commonTags.map(tag => (
                          <div 
                            key={`current-${tag.id}`}
                            className="flex justify-between items-center p-2 bg-blue-50 rounded mb-1 hover:bg-blue-100"
                          >
                            <span className="text-sm text-blue-800 font-medium">{tag.name}</span>
                            <button
                              onClick={() => handleRemoveTag(tag.id)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              title="Remove tag"
                            >
                              <FontAwesomeIcon icon={faTimes} size="xs" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available Tags Section */}
                  <div>
                    <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Add Tags
                    </h5>
                    {loadingTags ? (
                      <div className="text-center text-gray-500 py-4 text-sm">Loading tags...</div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto">
                        {availableTags.length > 0 ? (
                          availableTags.map(tag => (
                            <div 
                              key={`available-${tag.id}`}
                              className="flex justify-between items-center p-2 hover:bg-gray-50 rounded mb-1"
                            >
                              <span className="text-sm text-gray-700">{tag.name}</span>
                              <button
                                onClick={() => handleAddTag(tag.id)}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                title="Add tag"
                              >
                                <FontAwesomeIcon icon={faPlus} size="xs" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 py-2 text-center">
                            {searchTerm ? `No tags found matching "${searchTerm}"` : 'No available tags to add'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              Set Status
              <FontAwesomeIcon icon={faChevronDown} className={`ml-1 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[140px]">
                <div className="py-1">
                  <div className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 border-b border-gray-200">
                    Question status
                  </div>
                  {statusOptions.map((status) => (
                    <button
                      key={status.value}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 text-sm transition"
                      onClick={() => handleStatusChange(status.value)}
                    >
                      <span>{status.icon}</span>
                      <span className={`font-normal ${status.color}`}>{status.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* More Actions Dropdown */}
          <div className="relative" ref={moreActionsRef}>
            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
              onClick={() => setShowMoreActions(!showMoreActions)}
            >
              <FontAwesomeIcon icon={faChevronDown} />
              More
            </button>
            {showMoreActions && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[160px]">
                <div className="py-1">
                  <div className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 border-b border-gray-200">
                    Actions
                  </div>
                  <button className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 text-sm transition">
                    <FontAwesomeIcon icon={faCopy} className="text-gray-600" />
                    Duplicate
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 text-sm transition">
                    <FontAwesomeIcon icon={faDownload} className="text-gray-600" />
                    Export XML
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 text-sm transition">
                    <FontAwesomeIcon icon={faEye} className="text-gray-600" />
                    Preview
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 text-sm transition">
                    <FontAwesomeIcon icon={faChartBar} className="text-gray-600" />
                    Statistics
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 text-sm transition">
                    <FontAwesomeIcon icon={faBug} className="text-purple-600" />
                    Debug
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-red-700 rounded hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-400 transition"
            onClick={onBulkDelete}
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsRow;
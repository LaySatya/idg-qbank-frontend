import React, { useState } from 'react';
import { X } from 'lucide-react';

const BulkEditModal = ({ questions, onClose, onSave }) => {
  const [editData, setEditData] = useState({
    category: '',
    difficulty: '',
    status: '',
    tags: ''
  });

  if (!questions || questions.length === 0) return null;

  const handleSave = () => {
    const updates = {};
    if (editData.category) updates.category = editData.category;
    if (editData.difficulty) updates.difficulty = editData.difficulty;
    if (editData.status) updates.status = editData.status;
    if (editData.tags) {
      const newTags = editData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      updates.tags = newTags;
    }

    onSave(questions.map(q => q.id), updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Bulk Edit {questions.length} Questions</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={editData.category}
              onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">Keep existing</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Web Development">Web Development</option>
              <option value="Database Systems">Database Systems</option>
              <option value="Networking">Networking</option>
              <option value="Programming">Programming</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={editData.difficulty}
              onChange={(e) => setEditData(prev => ({ ...prev, difficulty: e.target.value }))}
            >
              <option value="">Keep existing</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={editData.status}
              onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">Keep existing</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Tags (comma-separated)
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g., Updated, Reviewed"
              value={editData.tags}
              onChange={(e) => setEditData(prev => ({ ...prev, tags: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkEditModal;
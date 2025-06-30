import React, { useState } from 'react';

const EditUserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState(user);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal">
      <h2>Edit User</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Name" />
        <input name="email" value={formData.email || ''} onChange={handleChange} placeholder="Email" />
        {/* Add more fields as needed */}
        <button type="submit">Save</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
};

export default EditUserModal;
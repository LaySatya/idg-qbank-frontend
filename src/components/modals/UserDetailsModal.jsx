import React from 'react';

const UserDetailsModal = ({ user, onClose, onEdit }) => (
  <div className="modal">
    <h2>User Details</h2>
    <p>Name: {user?.name}</p>
    <p>Email: {user?.email}</p>
    {/* Add more user details as needed */}
    <button onClick={onEdit}>Edit</button>
    <button onClick={onClose}>Close</button>
  </div>
);

export default UserDetailsModal;
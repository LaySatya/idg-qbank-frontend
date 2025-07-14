// src/utils/sessionManager.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

let isDialogOpen = false;

export function handleSessionExpired() {
  if (isDialogOpen) return;

  isDialogOpen = true;

  const dialogContainer = document.createElement('div');
  document.body.appendChild(dialogContainer);
  const root = createRoot(dialogContainer);

  const handleClose = () => {
    isDialogOpen = false;
    localStorage.clear();
    window.location.href = '/login';
  };

  root.render(
    <Dialog open={true}>
      <DialogTitle>Session Expired</DialogTitle>
      <DialogContent>Your session has expired. Please log in again.</DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="contained" color="primary">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

const LogoutConfirmationModal = ({ isOpen, onConfirm, onCancel, isLoading }) => (
  <Dialog
    open={isOpen}
    onClose={isLoading ? undefined : onCancel}
    maxWidth="xs"
    fullWidth
    aria-labelledby="logout-dialog-title"
  >
    <DialogTitle id="logout-dialog-title">Confirm Logout</DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary">
        Are you sure you want to sign out? You'll need to log in again to access your account.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button
        onClick={onCancel}
        disabled={isLoading}
        variant="outlined"
        color="primary"
      >
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        disabled={isLoading}
        variant="contained"
        color="error"
        startIcon={isLoading ? <CircularProgress size={18} /> : null}
      >
        {isLoading ? 'Signing out...' : 'Sign out'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default LogoutConfirmationModal;
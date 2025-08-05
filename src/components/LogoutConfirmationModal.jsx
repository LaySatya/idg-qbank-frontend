import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const LogoutConfirmationModal = ({ isOpen, onConfirm, onCancel, isLoading }) => (
  <Dialog
    open={isOpen}
    onClose={isLoading ? undefined : onCancel}
    maxWidth="sm"
    fullWidth
    aria-labelledby="logout-dialog-title"
    PaperProps={{
      sx: {
        borderRadius: 3,
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        backgroundColor: '#fff',
      }
    }}
  >
    <DialogTitle 
      id="logout-dialog-title"
      sx={{ 
        backgroundColor: '#fff',
        color: '#111',
        py: 3,
        px: 3,
        position: 'relative',
        borderBottom: '1px solid #eee'
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: '#fff',
            border: '2px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <LogoutIcon sx={{ fontSize: 28, color: '#ef4444' }} />
        </Box>
        <Box>
          <Typography variant="h6" component="div" fontWeight={700} color="#111">
            Confirm <span style={{ color: '#ef4444' }}>Logout</span>
          </Typography>
          {/* <Typography variant="body2" sx={{ color: '#ef4444', mt: 0.5, fontWeight: 500 }}>
            Are you sure you want to sign out?
          </Typography> */}
        </Box>
      </Box>
      <IconButton
        onClick={onCancel}
        disabled={isLoading}
        sx={{
          position: 'absolute',
          right: 12,
          top: 12,
          color: '#ef4444',
          '&:hover': {
            backgroundColor: '#fee2e2'
          }
        }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>

    <DialogContent sx={{ py: 4, px: 3, backgroundColor: '#fff' }}>
      <Box display="flex" alignItems="flex-start" gap={2}>
        <Box
          // sx={{
          //   width: 40,
          //   height: 40,
          //   borderRadius: '50%',
          //   backgroundColor: '#fee2e2',
          //   display: 'flex',
          //   alignItems: 'center',
          //   justifyContent: 'center',
          //   flexShrink: 0,
          //   mt: 0.5
          // }}
        >
          {/* <LogoutIcon sx={{ fontSize: 20, color: '#ef4444' }} /> */}
       </Box>
                <Box>
          <Typography variant="body1" color="#ef4444" fontWeight={500} mb={1}>
              Are you sure you want to log out?
          </Typography>
            <Typography variant="body1" color="#111" fontWeight={500} mb={2}>
            You'll need to log in again to access your account. Any unsaved work may be lost.
          </Typography>
          {/* <Typography variant="body2" color="#111" lineHeight={1.6}>
            Logging out will end your current session and return you to the login page.
            <span style={{ color: '#ef4444', fontWeight: 500 }}> Please make sure all your work is saved.</span>
          </Typography> */}
        </Box>
      </Box>
    </DialogContent>

    <DialogActions 
      sx={{ 
        px: 3, 
        py: 2.5, 
        backgroundColor: '#fff',
        borderTop: '1px solid #eee',
        gap: 1.5
      }}
    >
      <Button
        onClick={onCancel}
        disabled={isLoading}
        variant="outlined"
        size="large"
        sx={{
          minWidth: 100,
          borderColor: '#ef4444',
          color: '#ef4444',
          fontWeight: 600,
          '&:hover': {
            borderColor: '#b91c1c',
            backgroundColor: '#fff5f5',
            color: '#b91c1c',
          }
        }}
      >
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        disabled={isLoading}
        variant="contained"
        size="large"
        startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <LogoutIcon />}
        sx={{
          minWidth: 140,
          backgroundColor: '#ef4444',
          color: '#fff',
          fontWeight: 700,
          boxShadow: '0 2px 4px -1px rgba(239,68,68,0.15)',
          '&:hover': {
            backgroundColor: '#b91c1c',
            boxShadow: '0 4px 6px -1px rgba(239,68,68,0.25)',
          },
          '&:disabled': {
            background: '#fee2e2',
            color: '#fff',
            boxShadow: 'none'
          }
        }}
      >
        {isLoading ? 'Signing out...' : 'Sign out'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default LogoutConfirmationModal;
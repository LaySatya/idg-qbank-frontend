import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  Grid,
  Paper,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const AccountSettingsModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700}>Account Settings</Typography>
        <IconButton aria-label="close" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Paper elevation={0} sx={{ p: 2, mb: 2, background: '#f9fafb' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar
                src={user.profileimageurl}
                alt={user.fullname}
                sx={{ width: 72, height: 72, border: '2px solid #e5e7eb' }}
              />
            </Grid>
            <Grid item xs>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                {user.fullname}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.username}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Department: <strong>{user.department}</strong>
              </Typography>
            </Grid>
          </Grid>
        </Paper>
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2"><strong>Address:</strong> {user.address}</Typography>
              <Typography variant="body2"><strong>City:</strong> {user.city}</Typography>
              <Typography variant="body2"><strong>Country:</strong> {user.country}</Typography>
              <Typography variant="body2"><strong>ID Number:</strong> {user.idnumber || '-'}</Typography>
              <Typography variant="body2"><strong>Auth Method:</strong> {user.auth || '-'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2"><strong>Language:</strong> {user.lang || '-'}</Typography>
              <Typography variant="body2"><strong>Timezone:</strong> {user.timezone || '-'}</Typography>
              <Typography variant="body2"><strong>Confirmed:</strong> {user.confirmed ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2"><strong>Suspended:</strong> {user.suspended ? 'Yes' : 'No'}</Typography>
            </Grid>
          </Grid>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Custom Fields</Typography>
        <List dense>
          {user.customfields?.map((field, idx) => (
            <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
              <ListItemText
                primary={
                  <Typography variant="body2">
                    <strong>{field.name}:</strong> {field.value}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountSettingsModal;
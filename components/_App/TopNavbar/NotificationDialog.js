
import React from "react";
import { Dialog, DialogTitle, DialogContent, Typography, IconButton, Button, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { formatDateWithTime } from "@/components/utils/formatHelper";

const NotificationDialog = ({ open, onClose, note }) => {
  if (!note) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {note.title}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ fontSize: "14px", color: "#A9A9C8", mb: 2 }}>
          {formatDateWithTime(note.createdOn)}
        </Typography>
        <Typography sx={{ fontSize: "16px", color: "#333", whiteSpace: "pre-wrap" }}>
          {note.description}
        </Typography>
        <Box my={2}>
          <Button onClick={onClose} variant="contained" color="error">Close</Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationDialog;

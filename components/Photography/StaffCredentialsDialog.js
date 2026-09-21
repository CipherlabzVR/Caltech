import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { toast } from "react-toastify";

/**
 * Shows temporary login credentials after creating a photographer or technician.
 */
export default function StaffCredentialsDialog({ open, onClose, email, temporaryPassword, emailSent }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = `Email: ${email}\nPassword: ${temporaryPassword}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Credentials copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Login created</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Share these credentials with the user. They should change the password after first login.
        </Typography>
        <Box
          sx={{
            p: 2,
            borderRadius: 1,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Email / Username
              </Typography>
              <Typography fontWeight={600}>{email}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Temporary password
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography fontWeight={600} fontFamily="monospace">
                  {temporaryPassword}
                </Typography>
                <IconButton size="small" onClick={handleCopy} aria-label="Copy credentials">
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          </Stack>
        </Box>
        <Typography variant="body2" sx={{ mt: 2 }} color={emailSent ? "success.main" : "warning.main"}>
          {emailSent
            ? "A credentials email was sent."
            : "Email was not sent. Please copy and share the password manually."}
        </Typography>
        {copied && (
          <Typography variant="caption" color="success.main">
            Copied
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCopy} variant="outlined" size="small">
          Copy
        </Button>
        <Button onClick={onClose} variant="contained" size="small">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

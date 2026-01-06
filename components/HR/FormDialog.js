import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const FormDialog = ({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  maxWidth = "md",
  loading = false,
  submitColor = "primary",
  showActions = true,
  customActions,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "background.paper",
          borderRadius: 2,
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Button
            onClick={onClose}
            sx={{ minWidth: "auto", p: 0.5 }}
            disabled={loading}
          >
            <CloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box>{children}</Box>
        </DialogContent>
        {showActions && (
          <DialogActions
            sx={{
              px: 3,
              py: 2,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            {customActions || (
              <>
                <Button onClick={onClose} disabled={loading}>
                  {cancelLabel}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color={submitColor}
                  disabled={loading}
                  sx={{ minWidth: 100 }}
                >
                  {loading ? "Saving..." : submitLabel}
                </Button>
              </>
            )}
          </DialogActions>
        )}
      </form>
    </Dialog>
  );
};

export default FormDialog;


import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  Button,
  TextField,
  Typography,
  Box,
  Slide,
  InputAdornment,
  IconButton,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import { clearFirstLoginPasswordOffer } from "@/components/utils/firstLoginPasswordOffer";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const PASSWORD_RULE =
  /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;

const FirstLoginChangePasswordDialog = ({ open, onFinished }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState({
    next: false,
    confirm: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSubmitting(false);
  }, [open]);

  const finish = () => {
    clearFirstLoginPasswordOffer();
    onFinished?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }
    if (!PASSWORD_RULE.test(newPassword)) {
      setError(
        "New password must be at least 8 characters and include lowercase, uppercase, a number, and a special character (!@#$%^&*)."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password must match.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/User/ChangePasswordOnFirstLogin`, {
        method: "POST",
        body: JSON.stringify({
          NewPassword: newPassword,
          ConfirmNewPassword: confirmPassword,
        }),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success(data.result || "Password changed successfully.");
        finish();
        return;
      }
      setError(data.message || "Could not change password. Please try again.");
    } catch (err) {
      setError(err.message || "Could not change password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const visibilityAdornment = (field) => (
    <InputAdornment position="end">
      <IconButton
        aria-label={`toggle ${field} visibility`}
        onClick={() => setShow((prev) => ({ ...prev, [field]: !prev[field] }))}
        onMouseDown={(e) => e.preventDefault()}
        edge="end"
        size="small"
      >
        {show[field] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      disableEscapeKeyDown
      TransitionComponent={Transition}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "20px",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          background: "linear-gradient(135deg, #5e81f4 0%, #4a6fd0 100%)",
          px: 3,
          pt: 4,
          pb: 3,
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
            color: "#fff",
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: 44 }} />
        </Box>
        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 0.5 }}>
          Change your password
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
          This is your first login. You must change the password that was created for your account before continuing.
        </Typography>
      </Box>

      <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="New Password"
            type={show.next ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="8+ characters with upper, lower, number, and special character"
            InputProps={{ endAdornment: visibilityAdornment("next") }}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Confirm New Password"
            type={show.confirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            InputProps={{ endAdornment: visibilityAdornment("confirm") }}
          />

          {error ? (
            <Typography color="error" fontSize={13} sx={{ mt: 1.5 }}>
              {error}
            </Typography>
          ) : null}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={submitting}
            sx={{
              mt: 2.5,
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#5e81f4",
              "&:hover": { backgroundColor: "#4a6fd0" },
            }}
          >
            {submitting ? "Saving..." : "Change Password"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default FirstLoginChangePasswordDialog;

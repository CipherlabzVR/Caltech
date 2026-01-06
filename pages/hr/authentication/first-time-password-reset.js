import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Grid,
  Typography,
  Box,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { Lock, ArrowBack } from "@mui/icons-material";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function FirstTimePasswordReset() {
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get email from localStorage if available
    const storedEmail = localStorage.getItem("user");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !temporaryPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/hr/HRAuthentication/first-time-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Email: email,
          TemporaryPassword: temporaryPassword,
          NewPassword: newPassword,
          ConfirmPassword: confirmPassword,
        }),
      });

      const responseData = await response.json();
      const statusCode = responseData.statusCode || responseData.StatusCode;
      const isSuccess = 
        response.ok && (
          statusCode === 200 || 
          statusCode === "200" ||
          statusCode === "SUCCESS"
        );

      if (isSuccess) {
        toast.success("Password reset successfully! Please login with your new password.");
        setTimeout(() => {
          router.push("/hr/authentication/login");
        }, 2000);
      } else {
        toast.error(responseData.message || responseData.Message || "Password reset failed");
      }
    } catch (error) {
      toast.error(error.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <Box
        sx={{
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0f2f5",
          p: 2,
        }}
      >
        <Grid
          container
          sx={{
            maxWidth: 600,
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            backgroundColor: "#fff",
            p: 4,
          }}
        >
          <Box sx={{ width: "100%" }}>
            <Link
              href="/hr/authentication/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                color: "#1976d2",
                textDecoration: "none",
                marginBottom: 2,
              }}
            >
              <ArrowBack sx={{ mr: 1 }} />
              Back to Login
            </Link>

            <Typography variant="h5" fontWeight={700} mb={1}>
              First-Time Password Reset
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Please set a new password for your account
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                margin="normal"
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!localStorage.getItem("user")}
              />

              <TextField
                fullWidth
                margin="normal"
                label="Temporary Password"
                type="password"
                value={temporaryPassword}
                onChange={(e) => setTemporaryPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                }}
                helperText="Enter the temporary password provided to you"
              />

              <TextField
                fullWidth
                margin="normal"
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                }}
                helperText="Password must be at least 6 characters"
              />

              <TextField
                fullWidth
                margin="normal"
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  py: 1.3,
                  fontWeight: 600,
                  fontSize: 16,
                  borderRadius: "8px",
                  backgroundColor: "#1976d2",
                  "&:hover": { backgroundColor: "#1565c0" },
                }}
              >
                {loading ? <CircularProgress size={24} /> : "Reset Password"}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Box>
    </>
  );
}


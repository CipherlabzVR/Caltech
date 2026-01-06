import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Card from "@mui/material/Card";
import { keyframes } from "@mui/material/styles";
import BASE_URL from "Base/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

export default function UserVerified() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!router.isReady) {
        return;
      }

      const userId = router.query.userId;

      if (!userId) {
        return;
      }

      try {
        setLoading(true);
        
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = {
          "Content-Type": "application/json",
        };
        
        // Add authorization header only if token exists (optional for public verification)
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        const response = await fetch(
          `${BASE_URL}/User/VerifyEmailByUserId?userId=${userId}`,
          {
            method: "POST",
            headers: headers,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || "Failed to verify email");
        }

        const data = await response.json();
        setVerified(true);
        setLoading(false);
        //toast.success(data?.message || "Email verified successfully");
      } catch (error) {
        console.error("Verification error:", error);
        // Keep loading on error - don't set loading to false
        // The page will continue showing loading state
      }
    };

    verifyEmail();
  }, [router.isReady, router.query.userId]);

  return (
    <>
      <ToastContainer />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: 3,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-50%",
            right: "-50%",
            width: "200%",
            height: "200%",
            background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
            animation: `${pulse} 4s ease-in-out infinite`,
          },
        }}
      >
        <Card
          sx={{
            maxWidth: 500,
            width: "100%",
            padding: 4,
            borderRadius: 4,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(10px)",
            animation: `${fadeIn} 0.6s ease-out`,
            position: "relative",
            zIndex: 1,
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                animation: `${fadeIn} 0.5s ease-out`,
              }}
            >
              <CircularProgress
                size={70}
                thickness={4}
                sx={{
                  mb: 3,
                  color: "primary.main",
                  animation: `${pulse} 2s ease-in-out infinite`,
                }}
              />
              <Typography
                variant="h5"
                fontWeight={600}
                color="text.primary"
                gutterBottom
                sx={{ mb: 1 }}
              >
                Verifying Email
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Please wait while we verify your email address...
              </Typography>
            </Box>
          ) : verified ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                animation: `${scaleIn} 0.6s ease-out`,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  mb: 3,
                  animation: `${scaleIn} 0.5s ease-out`,
                }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 24px rgba(76, 175, 80, 0.4)",
                    position: "relative",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      inset: -4,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
                      opacity: 0.3,
                      animation: `${pulse} 2s ease-in-out infinite`,
                    },
                  }}
                >
                  <CheckCircleIcon
                    sx={{
                      fontSize: 70,
                      color: "white",
                      position: "relative",
                      zIndex: 1,
                    }}
                  />
                </Box>
              </Box>
              <Typography
                variant="h4"
                fontWeight={700}
                color="success.main"
                gutterBottom
                sx={{ mb: 1.5 }}
              >
                Email Verified!
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, lineHeight: 1.7 }}
              >
                Your email address has been successfully verified. You can now access all features
                of your account.
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ 
                  mb: 3, 
                  lineHeight: 1.7,
                  fontStyle: "italic",
                  color: "info.main"
                }}
              >
                you will receive an email with your credentials shortly.
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  height: 4,
                  borderRadius: 2,
                  background: "linear-gradient(90deg, #4caf50 0%, #45a049 100%)",
                  mt: 2,
                }}
              />
            </Box>
          ) : null}
        </Card>
      </Box>
    </>
  );
}


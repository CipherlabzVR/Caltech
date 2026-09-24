import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Button,
  TextField,
  Typography,
  Box,
  Slide,
  Fade,
  InputAdornment,
  LinearProgress,
} from "@mui/material";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const STEPS = [
  {
    icon: <SecurityOutlinedIcon sx={{ fontSize: 48 }} />,
    title: "New Device Detected",
    subtitle: "We noticed you're logging in from a new device. For your security, we'd like to register it.",
  },
  {
    icon: <EditOutlinedIcon sx={{ fontSize: 48 }} />,
    title: "Name Your Device",
    subtitle: "Give this device a recognizable name so you can identify it later in your account settings.",
  },
  {
    icon: <CheckCircleOutlineIcon sx={{ fontSize: 48 }} />,
    title: "You're All Set!",
    subtitle: "Your device has been registered successfully. You won't be asked again on this device.",
  },
];

const DeviceNameDialog = ({ open, value, onChange, onCancel, onConfirm }) => {
  const [step, setStep] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0);
      setFadeIn(true);
      setError("");
      setSaving(false);
    }
  }, [open]);

  const goToStep = (nextStep) => {
    setFadeIn(false);
    setTimeout(() => {
      setStep(nextStep);
      setFadeIn(true);
    }, 200);
  };

  const handleNext = () => {
    if (step === 0) {
      goToStep(1);
    }
  };

  const handleSave = async () => {
    const trimmed = (value || "").trim();
    if (!trimmed) {
      setError("Please enter a device name");
      return;
    }
    setError("");
    setSaving(true);
    goToStep(2);
    setTimeout(() => {
      setSaving(false);
      onConfirm();
    }, 1200);
  };

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Dialog
      open={open}
      onClose={step < 2 ? onCancel : undefined}
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
          position: "relative",
        }}
      >
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: "rgba(255,255,255,0.2)",
            "& .MuiLinearProgress-bar": {
              backgroundColor: "#fff",
              transition: "transform 0.5s ease",
            },
          }}
        />

        <Fade in={fadeIn} timeout={400}>
          <Box>
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
                animation: step === 2 ? "pulse 1s ease-in-out" : "none",
                "@keyframes pulse": {
                  "0%": { transform: "scale(0.8)", opacity: 0.5 },
                  "50%": { transform: "scale(1.1)" },
                  "100%": { transform: "scale(1)", opacity: 1 },
                },
              }}
            >
              {currentStep.icon}
            </Box>

            <Typography
              variant="h6"
              sx={{ color: "#fff", fontWeight: 700, mb: 0.5 }}
            >
              {currentStep.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}
            >
              {currentStep.subtitle}
            </Typography>
          </Box>
        </Fade>
      </Box>

      <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
        <Fade in={fadeIn} timeout={400}>
          <Box>
            {step === 0 && (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 2,
                    borderRadius: "12px",
                    backgroundColor: "#F0F4FF",
                    mb: 2,
                  }}
                >
                  <DevicesOutlinedIcon sx={{ color: "#5e81f4" }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      Why register devices?
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Device registration helps protect your account by tracking where it's accessed from.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Button
                    onClick={onCancel}
                    color="inherit"
                    sx={{
                      flex: 1,
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleNext}
                    variant="contained"
                    sx={{
                      flex: 1,
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 600,
                      backgroundColor: "#5e81f4",
                      "&:hover": { backgroundColor: "#4a6fd0" },
                    }}
                  >
                    Register Device
                  </Button>
                </Box>
              </Box>
            )}

            {step === 1 && (
              <Box>
                <TextField
                  autoFocus
                  fullWidth
                  label="Device Name"
                  value={value}
                  onChange={(e) => {
                    onChange(e.target.value);
                    if (error) setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                  }}
                  placeholder="e.g. Office Laptop, Home PC"
                  error={!!error}
                  helperText={error || "Choose a name you'll recognize later"}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DevicesOutlinedIcon sx={{ color: "#5e81f4" }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Button
                    onClick={() => goToStep(0)}
                    color="inherit"
                    sx={{
                      flex: 1,
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={saving}
                    sx={{
                      flex: 1,
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 600,
                      backgroundColor: "#5e81f4",
                      "&:hover": { backgroundColor: "#4a6fd0" },
                    }}
                  >
                    {saving ? "Saving..." : "Save & Continue"}
                  </Button>
                </Box>
              </Box>
            )}

            {step === 2 && (
              <Box sx={{ textAlign: "center", py: 1 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    backgroundColor: "#E8F5E9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                    animation: "scaleIn 0.4s ease",
                    "@keyframes scaleIn": {
                      "0%": { transform: "scale(0)" },
                      "80%": { transform: "scale(1.1)" },
                      "100%": { transform: "scale(1)" },
                    },
                  }}
                >
                  <CheckCircleOutlineIcon sx={{ color: "#4CAF50", fontSize: 32 }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Redirecting you now...
                </Typography>
              </Box>
            )}
          </Box>
        </Fade>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceNameDialog;

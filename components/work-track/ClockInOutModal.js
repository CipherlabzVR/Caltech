import React, { useState, useRef, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import { useMediaQuery, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

export default function ClockInOutModal({ open, onClose, type, onSuccess, workTrackDetailId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [selfie, setSelfie] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (open) {
      getLocation();
      startCamera();
    } else {
      stopCamera();
      setSelfie(null);
      setLocation(null);
      setLocationError(null);
    }
  }, [open]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // Front camera for selfie
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast("Unable to access camera. Please check permissions.", { type: "error" });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/png");
    setSelfie(imageData);
    setCapturing(false);
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError("Unable to get your location. Please enable location services.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async () => {
    if (!selfie) {
      toast("Please capture your selfie", { type: "warning" });
      return;
    }

    if (!location) {
      toast("Please allow location access", { type: "warning" });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `${BASE_URL}/WorkTrackWorkSession/${type === "clockin" ? "ClockIn" : "ClockOut"}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workTrackDetailId: workTrackDetailId,
            selfie: selfie,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          }),
        }
      );

      const result = await response.json();

      if (result?.statusCode === 200 || response.ok) {
        toast(`${type === "clockin" ? "Clocked in" : "Clocked out"} successfully!`, {
          type: "success",
        });
        stopCamera();
        onSuccess();
        onClose();
      } else {
        toast(result?.message || `Failed to ${type === "clockin" ? "clock in" : "clock out"}`, {
          type: "error",
        });
      }
    } catch (error) {
      console.error(`Error ${type === "clockin" ? "clocking in" : "clocking out"}:`, error);
      toast(`Failed to ${type === "clockin" ? "clock in" : "clock out"}`, { type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant={isMobile ? "h6" : "h6"}>
            {type === "clockin" ? "Clock In" : "Clock Out"}
          </Typography>
          <IconButton onClick={onClose} disabled={submitting} size={isMobile ? "medium" : "small"}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ px: isMobile ? 2 : 3 }}>
        <Box display="flex" flexDirection="column" gap={2}>
          {/* Location Section */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <LocationOnIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                Location
              </Typography>
              <IconButton size="small" onClick={getLocation} disabled={submitting}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Box>
            {location ? (
              <Alert severity="success">
                <Typography variant="body2" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
                  Latitude: {location.latitude.toFixed(6)}
                  <br />
                  Longitude: {location.longitude.toFixed(6)}
                  <br />
                  Accuracy: {location.accuracy?.toFixed(0)}m
                </Typography>
              </Alert>
            ) : locationError ? (
              <Alert severity="error">{locationError}</Alert>
            ) : (
              <Alert severity="info">Getting your location...</Alert>
            )}
          </Box>

          {/* Selfie Section */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <CameraAltIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                Selfie
              </Typography>
            </Box>
            {selfie ? (
              <Box textAlign="center">
                <img
                  src={selfie}
                  alt="Selfie"
                  style={{
                    maxWidth: "100%",
                    maxHeight: isMobile ? 250 : 300,
                    border: "2px solid #1976d2",
                    borderRadius: 8,
                    display: "block",
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<CameraAltIcon />}
                  onClick={captureSelfie}
                  disabled={submitting}
                  sx={{ mt: 1 }}
                >
                  Retake
                </Button>
              </Box>
            ) : (
              <Box>
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    maxHeight: 300,
                    bgcolor: "#000",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CameraAltIcon />}
                  onClick={captureSelfie}
                  disabled={capturing || submitting}
                  sx={{ mt: 1 }}
                >
                  {capturing ? "Capturing..." : "Capture Selfie"}
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!selfie || !location || submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {submitting
            ? `${type === "clockin" ? "Clocking in" : "Clocking out"}...`
            : type === "clockin"
            ? "Clock In"
            : "Clock Out"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


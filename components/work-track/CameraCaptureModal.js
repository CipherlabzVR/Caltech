import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import FlipCameraIosIcon from "@mui/icons-material/FlipCameraIos";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";

export default function CameraCaptureModal({ open, onClose, onCapture, title = "Take Photo" }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState("environment"); // "environment" = back camera, "user" = front camera
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
    }
    return () => stopCamera();
  }, [open, facingMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      // Stop any existing stream first
      stopCamera();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError("Unable to access camera. Please check permissions.");
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

  const toggleCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    
    // If using front camera, mirror the image
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get the image as base64
    const imageData = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(imageData);
    setCapturing(false);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
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
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 2 }}>
        {cameraError ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="error" gutterBottom>{cameraError}</Typography>
            <Button variant="outlined" onClick={startCamera} startIcon={<RefreshIcon />}>
              Retry
            </Button>
          </Box>
        ) : capturedImage ? (
          // Show captured image
          <Box>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                bgcolor: "#000",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <img
                src={capturedImage}
                alt="Captured"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            </Box>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<RefreshIcon />}
              onClick={retakePhoto}
              sx={{ mt: 2 }}
            >
              Retake Photo
            </Button>
          </Box>
        ) : (
          // Show camera preview
          <Box>
            <Box
              sx={{
                position: "relative",
                width: "100%",
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
                  transform: facingMode === "user" ? "scaleX(-1)" : "none",
                }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              
              {/* Camera switch button */}
              <IconButton
                onClick={toggleCamera}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  bgcolor: "rgba(0,0,0,0.5)",
                  color: "white",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                }}
              >
                <FlipCameraIosIcon />
              </IconButton>
            </Box>
            
            <Button
              variant="contained"
              fullWidth
              startIcon={capturing ? <CircularProgress size={20} color="inherit" /> : <CameraAltIcon />}
              onClick={capturePhoto}
              disabled={capturing}
              sx={{ mt: 2 }}
            >
              {capturing ? "Capturing..." : "Capture Photo"}
            </Button>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={!capturedImage}
        >
          Use This Photo
        </Button>
      </DialogActions>
    </Dialog>
  );
}


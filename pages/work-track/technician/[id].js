import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "@/styles/PageTitle.module.css";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useMediaQuery, useTheme } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import TimerIcon from "@mui/icons-material/Timer";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ArrowDropDownCircleIcon from "@mui/icons-material/ArrowDropDownCircle";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ListAltIcon from "@mui/icons-material/ListAlt";
import CoffeeIcon from "@mui/icons-material/Coffee";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import FreeBreakfastIcon from "@mui/icons-material/FreeBreakfast";
import ClockInOutModal from "@/components/work-track/ClockInOutModal";
import CameraCaptureModal from "@/components/work-track/CameraCaptureModal";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";

export default function TechnicianWorkTrackDetailView() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { id } = router.query;
  const hasFetched = useRef(false);

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [checklists, setChecklists] = useState([]);
  const [expandedChecklists, setExpandedChecklists] = useState({});
  const [workSummary, setWorkSummary] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [liveTimer, setLiveTimer] = useState(0);
  const timerIntervalRef = useRef(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInOutModalOpen, setClockInOutModalOpen] = useState(false);
  const [clockInOutType, setClockInOutType] = useState("clockin");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Break state
  const [breakActive, setBreakActive] = useState(false);
  const [breakType, setBreakType] = useState(null); // "1st", "lunch", "2nd"
  const [breakCountdown, setBreakCountdown] = useState(0);
  const [pendingBreakSync, setPendingBreakSync] = useState(null);
  const breakIntervalRef = useRef(null);
  const [breaksTaken, setBreaksTaken] = useState({
    first: { taken: false, duration: 0 },
    lunch: { taken: false, duration: 0 },
    second: { taken: false, duration: 0 }
  });
  const [workCompletedSummary, setWorkCompletedSummary] = useState(null);

  // Camera capture modal
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraItemId, setCameraItemId] = useState(null);

  // Break API functions - save to database for cross-browser sync
  const saveBreaksToAPI = useCallback(async (breaks, currentBreakType = null) => {
    if (!id) return;
    try {
      await fetch(`${BASE_URL}/WorkTrackDetail/SaveBreakData`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workTrackDetailId: parseInt(id),
          firstBreakTaken: breaks.first?.taken || false,
          firstBreakDuration: breaks.first?.duration || 0,
          firstBreakStartTime: breaks.first?.startedAt ? new Date(breaks.first.startedAt).toISOString() : null,
          lunchBreakTaken: breaks.lunch?.taken || false,
          lunchBreakDuration: breaks.lunch?.duration || 0,
          lunchBreakStartTime: breaks.lunch?.startedAt ? new Date(breaks.lunch.startedAt).toISOString() : null,
          secondBreakTaken: breaks.second?.taken || false,
          secondBreakDuration: breaks.second?.duration || 0,
          secondBreakStartTime: breaks.second?.startedAt ? new Date(breaks.second.startedAt).toISOString() : null,
          currentBreakType: currentBreakType,
        }),
      });
    } catch (error) {
      console.error("Error saving breaks to API:", error);
    }
  }, [id]);

  const loadBreaksFromAPI = useCallback(async () => {
    if (!id) return null;
    try {
      const response = await fetch(`${BASE_URL}/WorkTrackDetail/GetBreakData?workTrackDetailId=${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();
      const data = result?.data || result?.result;
      if (data) {
        return {
          first: { 
            taken: data.first?.taken || false, 
            duration: data.first?.duration || 0,
            startedAt: data.first?.startedAt ? data.first.startedAt : null
          },
          lunch: { 
            taken: data.lunch?.taken || false, 
            duration: data.lunch?.duration || 0,
            startedAt: data.lunch?.startedAt ? data.lunch.startedAt : null
          },
          second: { 
            taken: data.second?.taken || false, 
            duration: data.second?.duration || 0,
            startedAt: data.second?.startedAt ? data.second.startedAt : null
          },
          currentBreakType: data.currentBreakType
        };
      }
    } catch (error) {
      console.error("Error loading breaks from API:", error);
    }
    return {
      first: { taken: false, duration: 0 },
      lunch: { taken: false, duration: 0 },
      second: { taken: false, duration: 0 }
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (hasFetched.current) return;
    
    const initialize = async () => {
      await fetchCurrentUser();
      hasFetched.current = true;
      // Load breaks from API (database)
      const apiBreaks = await loadBreaksFromAPI();
      if (apiBreaks) {
        setBreaksTaken(apiBreaks);
        // If there's an active break, start the countdown
        if (apiBreaks.currentBreakType) {
          const breakKey = apiBreaks.currentBreakType;
          const breakData = apiBreaks[breakKey];
          if (breakData?.startedAt) {
            const BREAK_DURATIONS_MAP = { first: 600, lunch: 1800, second: 600 };
            const elapsed = Math.floor((Date.now() - breakData.startedAt) / 1000);
            const remaining = BREAK_DURATIONS_MAP[breakKey] - elapsed;
            if (remaining > 0) {
              const breakTypeMap = { first: "1st", lunch: "lunch", second: "2nd" };
              setBreakType(breakTypeMap[breakKey]);
              setBreakActive(true);
              startBreakCountdown(remaining, breakTypeMap[breakKey]);
            }
          }
        }
      }
      await fetchData();
    };
    
    initialize();
  }, [id, loadBreaksFromAPI]);

  // Sync breaks from API (database) - only used to START countdowns from API, not stop them
  const syncBreaksFromAPI = useCallback(async () => {
    const apiBreaks = await loadBreaksFromAPI();
    if (apiBreaks) {
      setBreaksTaken(apiBreaks);
      
      // Check if there's an active break in the database that we need to sync locally
      if (apiBreaks.currentBreakType) {
        const breakKey = apiBreaks.currentBreakType;
        const breakData = apiBreaks[breakKey];
        if (breakData?.startedAt) {
          const BREAK_DURATIONS_MAP = { first: 600, lunch: 1800, second: 600 };
          const elapsed = Math.floor((Date.now() - breakData.startedAt) / 1000);
          const remaining = BREAK_DURATIONS_MAP[breakKey] - elapsed;
          
          if (remaining > 0) {
            const breakTypeMap = { first: "1st", lunch: "lunch", second: "2nd" };
            // Set pending sync - will be handled by useEffect (only if not already active)
            setPendingBreakSync({ action: 'start', remaining, type: breakTypeMap[breakKey] });
          }
          // Note: Don't stop countdown here - let the local countdown handle expiration
        }
      }
      // Note: Don't set 'stop' action - local countdown is authoritative
      return apiBreaks;
    }
    return null;
  }, [loadBreaksFromAPI]);

  // Periodically refresh work summary and break data for real-time sync (every 2 seconds)
  useEffect(() => {
    if (!id) return;
    
    // Sync immediately on mount
    syncBreaksFromAPI();
    
    const refreshInterval = setInterval(async () => {
      // Sync breaks from API first
      await syncBreaksFromAPI();
      // Then refresh work summary
      fetchWorkSummary();
    }, 2000); // Refresh every 2 seconds for real-time sync
    
    return () => clearInterval(refreshInterval);
  }, [id, syncBreaksFromAPI]);

  // Sync immediately when page gains focus
  useEffect(() => {
    const handleFocus = () => {
      syncBreaksFromAPI();
      fetchWorkSummary();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncBreaksFromAPI]);

  useEffect(() => {
    if (detail && currentUserId && detail.assignedTechnicianId !== currentUserId) {
      toast("You are not assigned to this work track", { type: "error" });
      router.push("/work-track/technician");
    }
  }, [detail, currentUserId]);

  const fetchCurrentUser = async () => {
    // Get current user ID from localStorage (set during sign-in)
    const userId = localStorage.getItem("userid");
    if (userId) {
      const userIdNum = parseInt(userId, 10);
      if (!isNaN(userIdNum)) {
        setCurrentUserId(userIdNum);
        console.log("Current user ID from localStorage:", userIdNum);
      } else {
        console.error("Invalid user ID in localStorage:", userId);
      }
    } else {
      console.warn("No user ID found in localStorage. User may not be logged in.");
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const detailResponse = await fetch(`${BASE_URL}/WorkTrackDetail/GetWorkTrackDetailById?id=${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const detailResult = await detailResponse.json();

      let detailData = null;
      if (detailResult?.data) {
        detailData = detailResult.data;
      } else if (detailResult?.result) {
        detailData = detailResult.result;
      } else if (detailResult && detailResult.id) {
        detailData = detailResult;
      }

      if (detailData && detailData.id) {
        setDetail(detailData);
      } else {
        toast("Work track detail not found", { type: "error" });
        return;
      }

      await fetchChecklists();
      await fetchWorkSummary();
      await checkClockInStatus();
    } catch (error) {
      console.error("Error fetching data:", error);
      toast("Failed to load data", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const checkClockInStatus = async () => {
    try {
      const response = await fetch(`${BASE_URL}/WorkTrackWorkSession/GetClockInStatus?workTrackDetailId=${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();
      const isClockedIn = result?.data?.isClockedIn || result?.result?.isClockedIn || false;
      setClockedIn(isClockedIn);
    } catch (error) {
      console.error("Error checking clock in status:", error);
    }
  };

  const fetchSessionHistory = async () => {
    try {
      const response = await fetch(`${BASE_URL}/WorkTrackWorkSession/GetSessionHistory?workTrackDetailId=${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();
      const history = result?.data || result?.result || [];
      setSessionHistory(Array.isArray(history) ? history : []);
    } catch (error) {
      console.error("Error fetching session history:", error);
    }
  };

  const fetchChecklists = async () => {
    try {
      const response = await fetch(`${BASE_URL}/WorkTrackChecklist/GetChecklistsByWorkTrackDetailId?workTrackDetailId=${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();

      let checklistData = [];
      if (result?.data && Array.isArray(result.data)) {
        checklistData = result.data;
      } else if (result?.result && Array.isArray(result.result)) {
        checklistData = result.result;
      } else if (Array.isArray(result)) {
        checklistData = result;
      }

      setChecklists(checklistData);
      const expanded = {};
      checklistData.forEach((cl) => {
        expanded[cl.id] = true;
      });
      setExpandedChecklists(expanded);
    } catch (error) {
      console.error("Error fetching checklists:", error);
    }
  };

  const fetchWorkSummary = async () => {
    try {
      const response = await fetch(`${BASE_URL}/WorkTrackWorkSession/GetWorkSummary?workTrackDetailId=${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();

      let summaryData = null;
      if (result?.data) {
        summaryData = result.data;
      } else if (result?.result) {
        summaryData = result.result;
      }

      setWorkSummary(summaryData);
      
      // Start live timer ONLY if work is actively in progress (not on break/hold)
      if (summaryData?.currentStatus === "Started") {
        // Use totalWorkDuration from server (excludes break time)
        const baseTime = summaryData.totalWorkDuration || 0;
        startLiveTimer(baseTime);
        // If we were on break but backend says Started, clear break state
        if (breakActive) {
          setBreakActive(false);
          setBreakType(null);
          stopBreakCountdown();
        }
      } else if (summaryData?.currentStatus === "Held") {
        // Stop work timer when on break
        stopLiveTimer();
        setLiveTimer(summaryData?.totalWorkDuration || 0);
        // Break countdown is handled by syncBreaksFromAPI - don't interfere here
      } else {
        // Not started or completed
        stopLiveTimer();
        setLiveTimer(summaryData?.totalWorkDuration || 0);
      }
    } catch (error) {
      console.error("Error fetching work summary:", error);
    }
  };

  const stopLiveTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      // Clear sync interval if it exists
      if (timerIntervalRef.current.syncInterval) {
        clearInterval(timerIntervalRef.current.syncInterval);
      }
      timerIntervalRef.current = null;
    }
  }, []);

  const startLiveTimer = useCallback((initialSeconds) => {
    stopLiveTimer();
    setLiveTimer(initialSeconds);
    const interval = setInterval(() => {
      setLiveTimer((prev) => prev + 1);
    }, 1000);
    timerIntervalRef.current = interval;
    
    // Periodically sync with server every 30 seconds to keep in sync with work track detail page
    const syncInterval = setInterval(async () => {
      try {
        const response = await fetch(`${BASE_URL}/WorkTrackWorkSession/GetWorkSummary?workTrackDetailId=${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const result = await response.json();
        
        let summaryData = null;
        if (result?.data) {
          summaryData = result.data;
        } else if (result?.result) {
          summaryData = result.result;
        }
        
        if (summaryData && summaryData.currentStatus === "Started") {
          // Only sync when actively working (not on break)
          const serverTime = summaryData.totalWorkDuration || 0;
          // Only update if there's a significant difference (more than 2 seconds) to avoid jitter
          setLiveTimer((current) => {
            if (Math.abs(serverTime - current) > 2) {
              return serverTime;
            }
            return current;
          });
        } else if (summaryData && summaryData.currentStatus === "Held") {
          // On break - stop the timer and show static work duration
          stopLiveTimer();
          setLiveTimer(summaryData.totalWorkDuration || 0);
        }
      } catch (error) {
        console.error("Error syncing timer:", error);
      }
    }, 30000); // Sync every 30 seconds
    
    // Store sync interval for cleanup
    if (timerIntervalRef.current) {
      timerIntervalRef.current.syncInterval = syncInterval;
    }
  }, [id, stopLiveTimer]);

  useEffect(() => {
    return () => {
      stopLiveTimer();
      stopBreakCountdown();
    };
  }, [stopLiveTimer]);

  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Play notification sound when break ends
  const playBreakEndSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Play a pleasant notification melody
      const playTone = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      // Play a pleasant 3-note chime
      playTone(523.25, now, 0.2);        // C5
      playTone(659.25, now + 0.2, 0.2);  // E5
      playTone(783.99, now + 0.4, 0.4);  // G5
      
      // Clean up audio context after sounds finish
      setTimeout(() => {
        audioContext.close();
      }, 1000);
    } catch (error) {
      console.log("Could not play notification sound:", error);
    }
  }, []);

  // Break timer functions
  const stopBreakCountdown = useCallback(() => {
    if (breakIntervalRef.current) {
      clearInterval(breakIntervalRef.current);
      breakIntervalRef.current = null;
    }
    setBreakActive(false);
    setBreakType(null);
    setBreakCountdown(0);
  }, []);

  const startBreakCountdown = useCallback((durationSeconds, type) => {
    stopBreakCountdown();
    setBreakActive(true);
    setBreakType(type);
    setBreakCountdown(durationSeconds);
    
    breakIntervalRef.current = setInterval(() => {
      setBreakCountdown(prev => {
        if (prev <= 1) {
          // Break time finished - save final duration and resume work
          const breakKey = type === "1st" ? "first" : type === "lunch" ? "lunch" : "second";
          const fullDuration = BREAK_DURATIONS[breakKey];
          const actualDuration = fullDuration; // Full duration since countdown reached 0
          
          setBreaksTaken(currentBreaks => {
            const updatedBreaks = {
              ...currentBreaks,
              [breakKey]: { ...currentBreaks[breakKey], duration: actualDuration, startedAt: null }
            };
            saveBreaksToAPI(updatedBreaks, null); // null = no active break
            return updatedBreaks;
          });
          
          stopBreakCountdown();
          playBreakEndSound();
          
          // Auto-resume work when break timer ends
          fetch(`${BASE_URL}/WorkTrackWorkSession/ResumeWork?workTrackDetailId=${id}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }).then(() => {
            fetchWorkSummary();
          }).catch(err => console.error("Error auto-resuming work:", err));
          
          toast(`${type === "1st" ? "1st Break" : type === "lunch" ? "Lunch Break" : "2nd Break"} time is over! Work resumed.`, { type: "info" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [id, playBreakEndSound, saveBreaksToAPI, fetchWorkSummary, stopBreakCountdown]);

  // Handle pending break sync from API
  useEffect(() => {
    if (!pendingBreakSync) return;
    
    if (pendingBreakSync.action === 'start' && !breakActive) {
      startBreakCountdown(pendingBreakSync.remaining, pendingBreakSync.type);
    } else if (pendingBreakSync.action === 'stop' && breakActive) {
      stopBreakCountdown();
    }
    
    setPendingBreakSync(null);
  }, [pendingBreakSync, breakActive, startBreakCountdown, stopBreakCountdown]);

  // Break duration constants (in seconds)
  const BREAK_DURATIONS = {
    first: 10 * 60,  // 10 minutes
    lunch: 30 * 60,  // 30 minutes
    second: 10 * 60  // 10 minutes
  };

  const formatBreakCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartBreak = async (type) => {
    if (breakActive || workSummary?.currentStatus !== "Started") return;
    
    let duration;
    let breakKey;
    
    if (type === "1st") {
      duration = BREAK_DURATIONS.first;
      breakKey = "first";
    } else if (type === "lunch") {
      duration = BREAK_DURATIONS.lunch;
      breakKey = "lunch";
    } else {
      duration = BREAK_DURATIONS.second;
      breakKey = "second";
    }
    
    try {
      setSessionLoading(true);
      
      // Call HoldWork API to pause work timer on backend
      const response = await fetch(`${BASE_URL}/WorkTrackWorkSession/HoldWork?workTrackDetailId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: `${type === "1st" ? "1st Break" : type === "lunch" ? "Lunch Break" : "2nd Break"}` }),
      });
      const result = await response.json();
      
      if (result?.statusCode === 200) {
        // Mark break as taken and save to API (database)
        const updatedBreaks = {
          ...breaksTaken,
          [breakKey]: { taken: true, duration: duration, startedAt: Date.now() }
        };
        setBreaksTaken(updatedBreaks);
        saveBreaksToAPI(updatedBreaks, breakKey);
        
        // Stop live work timer during break
        stopLiveTimer();
        
        startBreakCountdown(duration, type);
        toast(`${type === "1st" ? "1st Break" : type === "lunch" ? "Lunch Break" : "2nd Break"} started! Work timer paused.`, { type: "info" });
        await fetchWorkSummary();
      } else {
        toast(result?.message || "Failed to start break", { type: "error" });
      }
    } catch (error) {
      console.error("Error starting break:", error);
      toast("Failed to start break", { type: "error" });
    } finally {
      setSessionLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!breakActive) return;
    
    // Calculate actual break time taken
    const type = breakType;
    let breakKey = type === "1st" ? "first" : type === "lunch" ? "lunch" : "second";
    let fullDuration = BREAK_DURATIONS[breakKey];
    let actualDuration = fullDuration - breakCountdown;
    
    try {
      setSessionLoading(true);
      
      // Call ResumeWork API to continue work timer on backend
      const response = await fetch(`${BASE_URL}/WorkTrackWorkSession/ResumeWork?workTrackDetailId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();
      
      if (result?.statusCode === 200) {
        // Update breaks and save to API (database)
        const updatedBreaks = {
          ...breaksTaken,
          [breakKey]: { ...breaksTaken[breakKey], duration: actualDuration, startedAt: null }
        };
        setBreaksTaken(updatedBreaks);
        saveBreaksToAPI(updatedBreaks, null); // null = no active break
        
        stopBreakCountdown();
        toast("Break ended. Work timer resumed!", { type: "info" });
        await fetchWorkSummary();
      } else {
        toast(result?.message || "Failed to resume work", { type: "error" });
      }
    } catch (error) {
      console.error("Error ending break:", error);
      toast("Failed to end break", { type: "error" });
    } finally {
      setSessionLoading(false);
    }
  };

  const handleResumeWork = async () => {
    try {
      setSessionLoading(true);
      
      // Clear break data in database first
      const updatedBreaks = {
        ...breaksTaken,
        currentBreakType: null
      };
      await saveBreaksToAPI(updatedBreaks, null);
      
      const response = await fetch(`${BASE_URL}/WorkTrackWorkSession/ResumeWork?workTrackDetailId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();
      
      if (result?.statusCode === 200) {
        toast("Work resumed!", { type: "success" });
        // Notify other pages of session update
        localStorage.setItem(`workTrackSessionUpdate_${id}`, Date.now().toString());
        stopBreakCountdown();
        await fetchWorkSummary();
      } else {
        toast(result?.message || "Failed to resume work", { type: "error" });
      }
    } catch (error) {
      console.error("Error resuming work:", error);
      toast("Failed to resume work", { type: "error" });
    } finally {
      setSessionLoading(false);
    }
  };

  const handleClockIn = () => {
    setClockInOutType("clockin");
    setClockInOutModalOpen(true);
  };

  const handleClockOut = () => {
    // Check if all checklist items are completed before allowing clock out
    const allItemsCompleted = getAllItemsCompleted();
    if (!allItemsCompleted) {
      toast("Please complete all required checklist items before clocking out", { type: "warning" });
      return;
    }
    
    setClockInOutType("clockout");
    setClockInOutModalOpen(true);
  };

  const handleClockInOutSuccess = async () => {
    if (clockInOutType === "clockin") {
      setClockedIn(true);
    } else {
      setClockedIn(false);
    }
    // Notify other pages of session update
    localStorage.setItem(`workTrackSessionUpdate_${id}`, Date.now().toString());
    await fetchWorkSummary();
    // Re-fetch checklists to ensure they remain visible after clock out
    await fetchChecklists();
  };

  const handleStartWork = async () => {
    if (!clockedIn) {
      toast("Please clock in first before starting work", { type: "warning" });
      return;
    }

    try {
      setSessionLoading(true);
      const response = await fetch(`${BASE_URL}/WorkTrackWorkSession/StartWork?workTrackDetailId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();

      if (result?.statusCode === 200) {
        toast("Work started!", { type: "success" });
        // Notify other pages of session update
        localStorage.setItem(`workTrackSessionUpdate_${id}`, Date.now().toString());
        await fetchWorkSummary();
      } else {
        toast(result?.message || "Failed to start work", { type: "error" });
      }
    } catch (error) {
      console.error("Error starting work:", error);
      toast("Failed to start work", { type: "error" });
    } finally {
      setSessionLoading(false);
    }
  };

  const handleEndWork = async () => {
    try {
      setSessionLoading(true);
      
      // Check if all checklist items are completed
      const allItemsCompleted = getAllItemsCompleted();
      if (!allItemsCompleted) {
        toast("Please complete all checklist items before ending work", { type: "warning" });
        setSessionLoading(false);
        return;
      }
      
      // Stop break if active
      if (breakActive) {
        handleEndBreak();
      }
      
      const response = await fetch(`${BASE_URL}/WorkTrackWorkSession/EndWork?workTrackDetailId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();

      if (result?.statusCode === 200) {
        // Calculate total break time
        const totalBreakTime = 
          breaksTaken.first.duration + 
          breaksTaken.lunch.duration + 
          breaksTaken.second.duration;
        
        // Create completion summary
        const summary = {
          totalWorkTime: liveTimer,
          firstBreak: breaksTaken.first.duration,
          lunchBreak: breaksTaken.lunch.duration,
          secondBreak: breaksTaken.second.duration,
          totalBreakTime: totalBreakTime,
          totalDuration: liveTimer + totalBreakTime
        };
        setWorkCompletedSummary(summary);
        
        toast("Work completed successfully!", { type: "success" });
        // Notify other pages of session update
        localStorage.setItem(`workTrackSessionUpdate_${id}`, Date.now().toString());
        stopLiveTimer();
        stopBreakCountdown();
        await fetchWorkSummary();
        await fetchChecklists();
        await fetchData(); // Refresh detail to get updated status
      } else {
        toast(result?.message || "Failed to end work", { type: "error" });
      }
    } catch (error) {
      console.error("Error ending work:", error);
      toast("Failed to end work", { type: "error" });
    } finally {
      setSessionLoading(false);
    }
  };

  const handleToggleItem = async (itemId, isCompleted) => {
    if (!clockedIn || workSummary?.currentStatus !== "Started") {
      toast("Please clock in and start work before ticking checklist items", { type: "warning" });
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/WorkTrackChecklist/ToggleChecklistItem`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: itemId, isCompleted }),
      });

      if (response.ok) {
        await fetchChecklists();
      }
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  };

  const handleUpdateItemValue = async (itemId, selectedValue) => {
    if (!clockedIn || workSummary?.currentStatus !== "Started") {
      toast("Please clock in and start work before updating items", { type: "warning" });
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/WorkTrackChecklist/UpdateChecklistItemValue`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: itemId, selectedValue }),
      });

      if (response.ok) {
        await fetchChecklists();
      }
    } catch (error) {
      console.error("Error updating item value:", error);
    }
  };

  const openCameraModal = (itemId) => {
    if (!clockedIn || workSummary?.currentStatus !== "Started") {
      toast("Please clock in and start work before capturing images", { type: "warning" });
      return;
    }
    setCameraItemId(itemId);
    setCameraModalOpen(true);
  };

  const handleCameraCapture = async (imageData) => {
    if (!cameraItemId) return;

    try {
      const response = await fetch(`${BASE_URL}/WorkTrackChecklist/UploadChecklistItemImage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: cameraItemId, imageData }),
      });

      const result = await response.json();
      if (result?.statusCode === 200 || response.ok) {
        await fetchChecklists();
        toast("Photo captured and uploaded successfully!", { type: "success" });
      } else {
        toast(result?.message || "Failed to upload photo", { type: "error" });
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast("Failed to upload photo", { type: "error" });
    }
  };

  const toggleChecklistExpand = (checklistId) => {
    setExpandedChecklists((prev) => ({
      ...prev,
      [checklistId]: !prev[checklistId],
    }));
  };

  const getChecklistProgress = (checklist) => {
    if (!checklist.items || checklist.items.length === 0) return 0;
    const completed = checklist.items.filter((item) => item.isCompleted).length;
    return Math.round((completed / checklist.items.length) * 100);
  };

  const getAllItemsCompleted = () => {
    return checklists.every((checklist) => {
      if (!checklist.items || checklist.items.length === 0) return true;
      return checklist.items.every((item) => item.isCompleted);
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!detail) {
    return (
      <Box>
        <Typography color="error">Work track detail not found</Typography>
      </Box>
    );
  }

  const isWorkActive = workSummary?.currentStatus === "Started";
  const canStartWork = clockedIn && workSummary?.currentStatus !== "Started";
  const canEndWork = workSummary?.currentStatus === "Started";

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Work Assignment Details</h1>
        <ul>
          <li>
            <Link href="/work-track/technician/">My Work Assignments</Link>
          </li>
          <li>Details</li>
        </ul>
      </div>
      <ToastContainer />

      {/* Previous Clock In/Out History - Show when there was a previous session */}
      {detail?.clockOutTime && !clockedIn && (
        <Card sx={{ mb: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon color="primary" />
                Previous Clock In/Out Session
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  fetchSessionHistory();
                  setHistoryModalOpen(true);
                }}
              >
                See Full History
              </Button>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, bgcolor: '#dcfce7' }}>
                  <Typography variant="body2" color="textSecondary">Clock In</Typography>
                  <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                    {detail.clockInTime ? new Date(detail.clockInTime).toLocaleString() : '-'}
                  </Typography>
                  {detail.clockInSelfie && (
                    <Box mt={1}>
                      <img 
                        src={detail.clockInSelfie} 
                        alt="Clock In Selfie" 
                        style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => window.open(detail.clockInSelfie, '_blank')}
                      />
                    </Box>
                  )}
                  {detail.clockInLatitude && detail.clockInLongitude && (
                    <Button
                      size="small"
                      startIcon={<LocationOnIcon />}
                      onClick={() => window.open(`https://www.google.com/maps?q=${detail.clockInLatitude},${detail.clockInLongitude}`, '_blank')}
                      sx={{ mt: 1 }}
                    >
                      View Location
                    </Button>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, bgcolor: '#fef2f2' }}>
                  <Typography variant="body2" color="textSecondary">Clock Out</Typography>
                  <Typography variant="subtitle1" fontWeight="bold" color="error.main">
                    {detail.clockOutTime ? new Date(detail.clockOutTime).toLocaleString() : '-'}
                  </Typography>
                  {detail.clockOutSelfie && (
                    <Box mt={1}>
                      <img 
                        src={detail.clockOutSelfie} 
                        alt="Clock Out Selfie" 
                        style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => window.open(detail.clockOutSelfie, '_blank')}
                      />
                    </Box>
                  )}
                  {detail.clockOutLatitude && detail.clockOutLongitude && (
                    <Button
                      size="small"
                      startIcon={<LocationOnIcon />}
                      onClick={() => window.open(`https://www.google.com/maps?q=${detail.clockOutLatitude},${detail.clockOutLongitude}`, '_blank')}
                      sx={{ mt: 1 }}
                    >
                      View Location
                    </Button>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Clock In/Out Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box 
            display="flex" 
            flexDirection={isMobile ? "column" : "row"}
            justifyContent="space-between" 
            alignItems={isMobile ? "stretch" : "center"} 
            flexWrap="wrap" 
            gap={2}
          >
            <Box display="flex" alignItems="center" gap={2} flex={1}>
              <AccessTimeIcon color={clockedIn ? "success" : "disabled"} sx={{ fontSize: isMobile ? 32 : 40 }} />
              <Box>
                <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="bold" color={clockedIn ? "success.main" : "textSecondary"}>
                  {clockedIn ? "Clocked In" : "Not Clocked In"}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {clockedIn
                    ? "You are clocked in and can start work"
                    : "Please clock in before starting work"}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={1} width={isMobile ? "100%" : "auto"}>
              {!clockedIn ? (
                <Button 
                  variant="contained" 
                  color="success" 
                  onClick={handleClockIn} 
                  size={isMobile ? "medium" : "large"}
                  fullWidth={isMobile}
                >
                  Clock In
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  color="error" 
                  onClick={handleClockOut} 
                  size={isMobile ? "medium" : "large"}
                  fullWidth={isMobile}
                >
                  Clock Out
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Work Session Card */}
      <Card sx={{ mb: 3, border: isWorkActive ? "2px solid" : "none", borderColor: "success.main" }}>
        <CardContent>
          <Box 
            display="flex" 
            flexDirection={isMobile ? "column" : "row"}
            justifyContent="space-between" 
            alignItems={isMobile ? "stretch" : "center"} 
            flexWrap="wrap" 
            gap={2}
          >
            <Box display="flex" alignItems="center" gap={2} flex={1} flexWrap="wrap">
              <TimerIcon color={isWorkActive ? "primary" : "disabled"} sx={{ fontSize: isMobile ? 32 : 40 }} />
              <Box>
                <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color={isWorkActive ? "primary" : "textSecondary"}>
                  {formatDuration(liveTimer)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {workSummary?.currentStatus === "Started" && !breakActive && "Work in Progress..."}
                  {workSummary?.currentStatus === "Completed" && "Work Completed"}
                  {(!workSummary?.currentStatus || workSummary?.currentStatus === "NotStarted") && "Not Started"}
                </Typography>
              </Box>
              
              {/* Break Countdown Display */}
              {breakActive && (
                <Box 
                  sx={{ 
                    ml: isMobile ? 0 : 2,
                    mt: isMobile ? 1 : 0,
                    p: isMobile ? 1.5 : 2, 
                    borderRadius: 2, 
                    bgcolor: breakType === "1st" ? '#fef3c7' : breakType === "lunch" ? '#d1fae5' : '#ede9fe',
                    border: '2px solid',
                    borderColor: breakType === "1st" ? '#f59e0b' : breakType === "lunch" ? '#10b981' : '#8b5cf6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flex: isMobile ? "1 1 100%" : "0 0 auto"
                  }}
                >
                  {breakType === "1st" && <CoffeeIcon sx={{ fontSize: isMobile ? 24 : 32, color: '#f59e0b' }} />}
                  {breakType === "lunch" && <RestaurantIcon sx={{ fontSize: isMobile ? 24 : 32, color: '#10b981' }} />}
                  {breakType === "2nd" && <FreeBreakfastIcon sx={{ fontSize: isMobile ? 24 : 32, color: '#8b5cf6' }} />}
                  <Box>
                    <Typography variant={isMobile ? "caption" : "body2"} fontWeight="bold" sx={{ color: breakType === "1st" ? '#92400e' : breakType === "lunch" ? '#065f46' : '#5b21b6' }}>
                      {breakType === "1st" ? "1st Break" : breakType === "lunch" ? "Lunch Break" : "2nd Break"}
                    </Typography>
                    <Typography variant={isMobile ? "h6" : "h4"} fontWeight="bold" sx={{ color: breakType === "1st" ? '#f59e0b' : breakType === "lunch" ? '#10b981' : '#8b5cf6' }}>
                      {formatBreakCountdown(breakCountdown)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: breakType === "1st" ? '#92400e' : breakType === "lunch" ? '#065f46' : '#5b21b6' }}>
                      remaining
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            <Box display="flex" gap={1} flexWrap="wrap" width={isMobile ? "100%" : "auto"}>
              {canStartWork && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleStartWork}
                  disabled={sessionLoading}
                  size={isMobile ? "medium" : "large"}
                  fullWidth={isMobile}
                >
                  Start Work
                </Button>
              )}

              {/* Break Buttons - Show when started and not on break */}
              {workSummary?.currentStatus === "Started" && !breakActive && (
                <>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
                    startIcon={<CoffeeIcon />}
                    onClick={() => handleStartBreak("1st")}
                    disabled={sessionLoading || breaksTaken.first.taken}
                    size={isMobile ? "medium" : "large"}
                    fullWidth={isMobile}
                  >
                    1st Break
                  </Button>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                    startIcon={<RestaurantIcon />}
                    onClick={() => handleStartBreak("lunch")}
                    disabled={sessionLoading || breaksTaken.lunch.taken}
                    size={isMobile ? "medium" : "large"}
                    fullWidth={isMobile}
                  >
                    Lunch Break
                  </Button>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                    startIcon={<FreeBreakfastIcon />}
                    onClick={() => handleStartBreak("2nd")}
                    disabled={sessionLoading || breaksTaken.second.taken}
                    size={isMobile ? "medium" : "large"}
                    fullWidth={isMobile}
                  >
                    2nd Break
                  </Button>
                </>
              )}

              {/* End Break Button - Show when on break */}
              {breakActive && (
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleEndBreak}
                  size={isMobile ? "medium" : "large"}
                  fullWidth={isMobile}
                >
                  End Break Early
                </Button>
              )}

              {/* Resume Work Button - Show when held but no active break countdown */}
              {workSummary?.currentStatus === "Held" && !breakActive && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleResumeWork}
                  disabled={sessionLoading}
                  size={isMobile ? "medium" : "large"}
                  fullWidth={isMobile}
                >
                  Resume Work
                </Button>
              )}

              {canEndWork && !breakActive && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={handleEndWork}
                  disabled={sessionLoading}
                  size={isMobile ? "medium" : "large"}
                  fullWidth={isMobile}
                >
                  End Work
                </Button>
              )}
            </Box>
          </Box>

          {!clockedIn && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Please clock in before starting work. You need to provide your location and take a selfie.
            </Alert>
          )}

          {/* Break Status Indicators */}
          {workSummary?.currentStatus === "Started" && (
            <Box mt={2} pt={2} borderTop="1px solid #eee">
              <Typography variant="body2" color="textSecondary" mb={1}>Break Status</Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip 
                  icon={<CoffeeIcon />}
                  label={breaksTaken.first.taken ? "1st Break ✓" : "1st Break"}
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    bgcolor: breaksTaken.first.taken ? '#fef3c7' : '#f1f5f9',
                    color: breaksTaken.first.taken ? '#92400e' : '#64748b',
                    fontWeight: breaksTaken.first.taken ? 600 : 400
                  }}
                />
                <Chip 
                  icon={<RestaurantIcon />}
                  label={breaksTaken.lunch.taken ? "Lunch ✓" : "Lunch"}
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    bgcolor: breaksTaken.lunch.taken ? '#d1fae5' : '#f1f5f9',
                    color: breaksTaken.lunch.taken ? '#065f46' : '#64748b',
                    fontWeight: breaksTaken.lunch.taken ? 600 : 400
                  }}
                />
                <Chip 
                  icon={<FreeBreakfastIcon />}
                  label={breaksTaken.second.taken ? "2nd Break ✓" : "2nd Break"}
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    bgcolor: breaksTaken.second.taken ? '#ede9fe' : '#f1f5f9',
                    color: breaksTaken.second.taken ? '#5b21b6' : '#64748b',
                    fontWeight: breaksTaken.second.taken ? 600 : 400
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Work Summary Stats */}
          {workSummary && (workSummary.totalWorkDuration > 0 || workSummary.totalHoldDuration > 0) && (
            <Box mt={2} pt={2} borderTop="1px solid #eee">
              <Grid container spacing={2}>
                <Grid item xs={6} sm={2}>
                  <Typography variant="body2" color="textSecondary">Work Time</Typography>
                  <Typography variant={isMobile ? "body1" : "h6"} color="success.main" fontWeight="bold">
                    {workSummary.formattedWorkDuration || formatDuration(workSummary.totalWorkDuration || 0)}
                  </Typography>
                </Grid>
                <Grid item xs={4} sm={2}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <CoffeeIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                    <Typography variant="body2" color="textSecondary">1st Break</Typography>
                  </Box>
                  <Typography variant={isMobile ? "body1" : "h6"} sx={{ color: '#f59e0b' }} fontWeight="bold">
                    {breakActive && breakType === "1st" 
                      ? formatBreakCountdown(breakCountdown)
                      : breaksTaken.first.taken 
                        ? formatDuration(breaksTaken.first.duration) 
                        : "-"}
                  </Typography>
                </Grid>
                <Grid item xs={4} sm={2}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <RestaurantIcon sx={{ fontSize: 16, color: '#10b981' }} />
                    <Typography variant="body2" color="textSecondary">Lunch</Typography>
                  </Box>
                  <Typography variant={isMobile ? "body1" : "h6"} sx={{ color: '#10b981' }} fontWeight="bold">
                    {breakActive && breakType === "lunch" 
                      ? formatBreakCountdown(breakCountdown)
                      : breaksTaken.lunch.taken 
                        ? formatDuration(breaksTaken.lunch.duration) 
                        : "-"}
                  </Typography>
                </Grid>
                <Grid item xs={4} sm={2}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <FreeBreakfastIcon sx={{ fontSize: 16, color: '#8b5cf6' }} />
                    <Typography variant="body2" color="textSecondary">2nd Break</Typography>
                  </Box>
                  <Typography variant={isMobile ? "body1" : "h6"} sx={{ color: '#8b5cf6' }} fontWeight="bold">
                    {breakActive && breakType === "2nd" 
                      ? formatBreakCountdown(breakCountdown)
                      : breaksTaken.second.taken 
                        ? formatDuration(breaksTaken.second.duration) 
                        : "-"}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Typography variant="body2" color="textSecondary">Total Time</Typography>
                  <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold">
                    {formatDuration((workSummary.totalWorkDuration || 0) + breaksTaken.first.duration + breaksTaken.lunch.duration + breaksTaken.second.duration)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Typography variant="body2" color="textSecondary">Sessions</Typography>
                  <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold">
                    {workSummary.sessionCount || 0} ({workSummary.completedSessions || 0} completed)
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Work Completed Summary Dashboard */}
      {workCompletedSummary && (
        <Card sx={{ mb: 3, bgcolor: '#f0fdf4', border: '2px solid #22c55e' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <CheckCircleIcon sx={{ fontSize: isMobile ? 28 : 32, color: 'success.main', mr: 1 }} />
              <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="bold" color="success.main">
                Work Completed Successfully!
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <Paper sx={{ p: isMobile ? 1.5 : 2, textAlign: 'center', bgcolor: '#dcfce7' }}>
                  <Typography variant="body2" color="textSecondary">Work Time</Typography>
                  <Typography variant={isMobile ? "h6" : "h5"} color="success.main" fontWeight="bold">
                    {formatDuration(workCompletedSummary.totalWorkTime)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Paper sx={{ p: isMobile ? 1.5 : 2, textAlign: 'center', bgcolor: '#fef3c7' }}>
                  <CoffeeIcon sx={{ color: '#f59e0b', mb: 0.5, fontSize: isMobile ? 20 : 24 }} />
                  <Typography variant="body2" color="textSecondary">1st Break</Typography>
                  <Typography variant={isMobile ? "body1" : "h6"} sx={{ color: '#f59e0b' }} fontWeight="bold">
                    {workCompletedSummary.firstBreak > 0 ? formatDuration(workCompletedSummary.firstBreak) : "Not taken"}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Paper sx={{ p: isMobile ? 1.5 : 2, textAlign: 'center', bgcolor: '#d1fae5' }}>
                  <RestaurantIcon sx={{ color: '#10b981', mb: 0.5, fontSize: isMobile ? 20 : 24 }} />
                  <Typography variant="body2" color="textSecondary">Lunch Break</Typography>
                  <Typography variant={isMobile ? "body1" : "h6"} sx={{ color: '#10b981' }} fontWeight="bold">
                    {workCompletedSummary.lunchBreak > 0 ? formatDuration(workCompletedSummary.lunchBreak) : "Not taken"}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Paper sx={{ p: isMobile ? 1.5 : 2, textAlign: 'center', bgcolor: '#ede9fe' }}>
                  <FreeBreakfastIcon sx={{ color: '#8b5cf6', mb: 0.5, fontSize: isMobile ? 20 : 24 }} />
                  <Typography variant="body2" color="textSecondary">2nd Break</Typography>
                  <Typography variant={isMobile ? "body1" : "h6"} sx={{ color: '#8b5cf6' }} fontWeight="bold">
                    {workCompletedSummary.secondBreak > 0 ? formatDuration(workCompletedSummary.secondBreak) : "Not taken"}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Paper sx={{ p: isMobile ? 1.5 : 2, textAlign: 'center', bgcolor: '#fef9c3' }}>
                  <Typography variant="body2" color="textSecondary">Total Break Time</Typography>
                  <Typography variant={isMobile ? "body1" : "h6"} sx={{ color: '#ca8a04' }} fontWeight="bold">
                    {formatDuration(workCompletedSummary.totalBreakTime)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Paper sx={{ p: isMobile ? 1.5 : 2, textAlign: 'center', bgcolor: '#e0e7ff' }}>
                  <Typography variant="body2" color="textSecondary">Total Duration</Typography>
                  <Typography variant={isMobile ? "h6" : "h5"} sx={{ color: '#4f46e5' }} fontWeight="bold">
                    {formatDuration(workCompletedSummary.totalDuration)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center">
              <IconButton onClick={() => router.push("/work-track/technician")} sx={{ mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6">Summary</Typography>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">
                Track ID
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {detail.trackId || "-"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">
                Serial Number
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {detail.serialNumber || "-"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">
                Customer
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {detail.workTrackCustomerName || "-"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">
                Project
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {detail.workTrackProjectName || "-"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">
                Task Complete
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {detail.taskCompletePercentage != null ? `${detail.taskCompletePercentage}%` : "-"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">
                Status
              </Typography>
              <Chip
                label={detail.submissionStatus || "Draft"}
                size="small"
                color={
                  detail.submissionStatus === "Completed"
                    ? "success"
                    : detail.submissionStatus === "PendingApproval"
                    ? "warning"
                    : "default"
                }
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Checklists Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <ListAltIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Checklists
          </Typography>

          {checklists.length === 0 ? (
            <Alert severity="info">No checklists available for this work assignment.</Alert>
          ) : (
            checklists.map((checklist) => (
              <Paper key={checklist.id} variant="outlined" sx={{ mb: 2, p: isMobile ? 1.5 : 2 }}>
                <Box 
                  display="flex" 
                  flexDirection={isMobile ? "column" : "row"}
                  justifyContent="space-between" 
                  alignItems={isMobile ? "flex-start" : "center"} 
                  mb={1}
                  gap={1}
                >
                  <Box display="flex" alignItems="center" gap={1} flex={1} width="100%">
                    <IconButton 
                      size="small" 
                      onClick={() => toggleChecklistExpand(checklist.id)}
                      sx={{ flexShrink: 0 }}
                    >
                      {expandedChecklists[checklist.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <Typography 
                      variant={isMobile ? "body1" : "subtitle1"} 
                      fontWeight="bold"
                      sx={{ flex: 1, wordBreak: "break-word" }}
                    >
                      {checklist.title}
                    </Typography>
                    <Chip
                      label={`${getChecklistProgress(checklist)}%`}
                      size="small"
                      color={getChecklistProgress(checklist) === 100 ? "success" : "primary"}
                      sx={{ flexShrink: 0 }}
                    />
                  </Box>
                </Box>

                {checklist.description && (
                  <Typography 
                    variant="body2" 
                    color="textSecondary" 
                    sx={{ ml: isMobile ? 4 : 5, mb: 1, wordBreak: "break-word" }}
                  >
                    {checklist.description}
                  </Typography>
                )}

                <Box sx={{ ml: isMobile ? 4 : 5, mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={getChecklistProgress(checklist)}
                    color={getChecklistProgress(checklist) === 100 ? "success" : "primary"}
                  />
                </Box>

                <Collapse in={expandedChecklists[checklist.id]}>
                  <Divider sx={{ my: 1 }} />
                  {(!checklist.items || checklist.items.length === 0) ? (
                    <Typography color="textSecondary" variant="body2" sx={{ ml: 5, p: 2 }}>
                      No items in this checklist.
                    </Typography>
                  ) : (
                    checklist.items.map((item) => (
                      <Box
                        key={item.id}
                        sx={{
                          bgcolor: item.isCompleted ? "action.hover" : "transparent",
                          borderBottom: "1px solid #eee",
                          p: isMobile ? 1.5 : 2,
                        }}
                      >
                        <Box display="flex" alignItems="flex-start" gap={1}>
                          {item.itemType === "Checkbox" && (
                            <Checkbox
                              checked={item.isCompleted || false}
                              onChange={(e) => handleToggleItem(item.id, e.target.checked)}
                              icon={<RadioButtonUncheckedIcon />}
                              checkedIcon={<CheckCircleIcon color="success" />}
                              disabled={!clockedIn || workSummary?.currentStatus !== "Started"}
                              sx={{ flexShrink: 0, mt: 0.5 }}
                            />
                          )}

                          {item.itemType === "Radio" && (
                            <RadioButtonCheckedIcon
                              color={item.isCompleted ? "success" : "action"}
                              sx={{ mr: 1, mt: 0.5, flexShrink: 0 }}
                            />
                          )}

                          {item.itemType === "Dropdown" && (
                            <ArrowDropDownCircleIcon
                              color={item.isCompleted ? "success" : "action"}
                              sx={{ mr: 1, mt: 0.5, flexShrink: 0 }}
                            />
                          )}

                          {item.itemType === "Image" && (
                            <CameraAltIcon
                              color={item.isCompleted ? "success" : "action"}
                              sx={{ mr: 1, mt: 0.5, flexShrink: 0 }}
                            />
                          )}

                          <Box flex={1} sx={{ minWidth: 0 }}>
                            <Typography
                              variant={isMobile ? "body2" : "body1"}
                              sx={{
                                textDecoration: item.isCompleted ? "line-through" : "none",
                                wordBreak: "break-word",
                              }}
                            >
                              {item.title}
                            </Typography>

                            {item.description && (
                              <Typography 
                                variant="body2" 
                                color="textSecondary" 
                                sx={{ mt: 0.5, wordBreak: "break-word" }}
                              >
                                {item.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {/* Radio Buttons */}
                        {item.itemType === "Radio" && item.optionsList && item.optionsList.length > 0 && (
                          <Box sx={{ ml: isMobile ? 4.5 : 4, mt: 1 }}>
                            <RadioGroup
                              value={item.selectedValue || ""}
                              onChange={(e) => {
                                handleUpdateItemValue(item.id, e.target.value);
                              }}
                            >
                              {item.optionsList.map((option) => (
                                <FormControlLabel
                                  key={option}
                                  value={option}
                                  control={<Radio size="small" />}
                                  label={<Typography variant={isMobile ? "body2" : "body1"}>{option}</Typography>}
                                  disabled={!clockedIn || workSummary?.currentStatus !== "Started"}
                                  sx={{ mb: 0.5 }}
                                />
                              ))}
                            </RadioGroup>
                          </Box>
                        )}

                        {/* Dropdown */}
                        {item.itemType === "Dropdown" && item.optionsList && item.optionsList.length > 0 && (
                          <Box sx={{ ml: isMobile ? 4.5 : 4, mt: 1, maxWidth: isMobile ? "100%" : 300 }}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Select an option</InputLabel>
                              <Select
                                value={item.selectedValue || ""}
                                label="Select an option"
                                onChange={(e) => handleUpdateItemValue(item.id, e.target.value)}
                                disabled={!clockedIn || workSummary?.currentStatus !== "Started"}
                              >
                                <MenuItem value="">
                                  <em>None</em>
                                </MenuItem>
                                {item.optionsList.map((option) => (
                                  <MenuItem key={option} value={option}>
                                    {option}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        )}

                        {/* Image Upload */}
                        {item.itemType === "Image" && (
                          <Box sx={{ ml: isMobile ? 4.5 : 4, mt: 1 }}>
                            {item.imageUrl ? (
                              <Box>
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: isMobile ? 150 : 200,
                                    border: "1px solid #ddd",
                                    borderRadius: 4,
                                    display: "block",
                                  }}
                                />
                                {clockedIn && workSummary?.currentStatus === "Started" && (
                                  <Box mt={1}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<CameraAltIcon />}
                                      onClick={() => openCameraModal(item.id)}
                                    >
                                      Retake Photo
                                    </Button>
                                  </Box>
                                )}
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  border: "2px dashed #ccc",
                                  borderRadius: 2,
                                  p: 3,
                                  textAlign: "center",
                                }}
                              >
                                <CameraAltIcon sx={{ fontSize: 40, color: "#aaa", mb: 1 }} />
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                  {!clockedIn || workSummary?.currentStatus !== "Started"
                                    ? "No photo captured"
                                    : "Tap to capture photo"}
                                </Typography>
                                {clockedIn && workSummary?.currentStatus === "Started" && (
                                  <Button
                                    variant="contained"
                                    startIcon={<CameraAltIcon />}
                                    sx={{ mt: 1 }}
                                    onClick={() => openCameraModal(item.id)}
                                  >
                                    Take Photo
                                  </Button>
                                )}
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    ))
                  )}
                </Collapse>
              </Paper>
            ))
          )}
        </CardContent>
      </Card>

      {/* Clock In/Out Modal */}
      <ClockInOutModal
        open={clockInOutModalOpen}
        onClose={() => setClockInOutModalOpen(false)}
        type={clockInOutType}
        onSuccess={handleClockInOutSuccess}
        workTrackDetailId={parseInt(id)}
      />

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        open={cameraModalOpen}
        onClose={() => {
          setCameraModalOpen(false);
          setCameraItemId(null);
        }}
        onCapture={handleCameraCapture}
        title="Capture Work Photo"
      />

      {/* Session History Modal */}
      <Dialog
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Work Session History</Typography>
            <IconButton onClick={() => setHistoryModalOpen(false)} size="small">
              <ExpandLessIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {/* Clock In/Out from Detail */}
          {detail?.clockInTime && (
            <Box mb={3}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Clock In/Out Record
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: '#dcfce7' }}>
                    <Typography variant="body2" color="textSecondary">Clock In</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                      {new Date(detail.clockInTime).toLocaleString()}
                    </Typography>
                    {detail.clockInSelfie && (
                      <Box mt={1}>
                        <img 
                          src={detail.clockInSelfie} 
                          alt="Clock In Selfie" 
                          style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => window.open(detail.clockInSelfie, '_blank')}
                        />
                      </Box>
                    )}
                  </Paper>
                </Grid>
                {detail.clockOutTime && (
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: '#fef2f2' }}>
                      <Typography variant="body2" color="textSecondary">Clock Out</Typography>
                      <Typography variant="subtitle1" fontWeight="bold" color="error.main">
                        {new Date(detail.clockOutTime).toLocaleString()}
                      </Typography>
                      {detail.clockOutSelfie && (
                        <Box mt={1}>
                          <img 
                            src={detail.clockOutSelfie} 
                            alt="Clock Out Selfie" 
                            style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => window.open(detail.clockOutSelfie, '_blank')}
                          />
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {/* Work Sessions Table */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Work Sessions ({sessionHistory.length})
          </Typography>
          {sessionHistory.length === 0 ? (
            <Alert severity="info">No work sessions recorded yet.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Work Time</strong></TableCell>
                    <TableCell><strong>Break Time</strong></TableCell>
                    <TableCell><strong>User</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessionHistory.map((session, index) => (
                    <TableRow key={session.id || index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#fafafa' } }}>
                      <TableCell>
                        {session.createdOn ? new Date(session.createdOn).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={session.status || 'Unknown'} 
                          size="small"
                          color={
                            session.status === 'Completed' ? 'success' :
                            session.status === 'Started' ? 'primary' :
                            session.status === 'Held' ? 'warning' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{session.formattedWorkDuration || '-'}</TableCell>
                      <TableCell>{session.formattedHoldDuration || '-'}</TableCell>
                      <TableCell>{session.userName || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}


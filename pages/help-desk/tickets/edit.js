import React, { useState, useEffect } from "react";
import {
  Grid,
  IconButton,
  Tooltip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  Divider,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  createFilterOptions,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import useApi from "@/components/utils/useApi";
import RichTextEditor from "@/components/help-desk/RichTextEditor";
import TicketChecklist from "@/components/help-desk/TicketChecklist";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { formatDate } from "@/components/utils/formatHelper";

const filter = createFilterOptions();

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: "95%", md: "95%", xs: "100%" },
  maxWidth: "1400px",
  height: { xs: "100vh", sm: "95vh", md: "90vh" },
  maxHeight: { xs: "100vh", sm: "95vh", md: "90vh" },
  bgcolor: "#F5F5F5",
  boxShadow: 24,
  borderRadius: { xs: 0, sm: 2 },
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const commentValidationSchema = Yup.object().shape({
  comment: Yup.string().trim().required("Comment is required"),
});

const validationSchema = Yup.object().shape({
  subject: Yup.string().trim().required("Subject is required"),
  description: Yup.string().required("Description is required").test(
    "not-empty",
    "Description is required",
    (value) => {
      if (!value) return false;
      // Remove HTML tags and check if there's actual content
      const textContent = value.replace(/<[^>]*>/g, "").trim();
      return textContent.length > 0;
    }
  ),
  status: Yup.number().required("Status is required"),
  priority: Yup.number().required("Priority is required"),
  categoryId: Yup.number().required("Category is required"),
  projectIds: Yup.array().of(Yup.number()).nullable(),
  startDate: Yup.string(),
  startTime: Yup.string(),
  dueDate: Yup.string(),
  dueTime: Yup.string(),
  customerName: Yup.string().trim(),
  customerId: Yup.number().nullable(),
  feedbackRating: Yup.number().nullable(),
  feedbackComment: Yup.string().trim(),
});

export default function EditTicketModal({ fetchItems, item, currentPage = 1, currentSearch = "", currentPageSize = 10, open: externalOpen, onClose: externalOnClose }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [timeUpdateTrigger, setTimeUpdateTrigger] = useState(0);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isHelpDeskCustomer, setIsHelpDeskCustomer] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [canClockIn, setCanClockIn] = useState(false);
  const [ticketProject, setTicketProject] = useState(null);
  const [checklist, setChecklist] = useState([]);

  // Clock in/out state
  const [clockEntries, setClockEntries] = useState([]);
  const [clockLoading, setClockLoading] = useState(false);
  const [clockError, setClockError] = useState("");
  const [clockInAt, setClockInAt] = useState("");
  const [clockOutAt, setClockOutAt] = useState("");
  const [geoStatus, setGeoStatus] = useState("");
  const [geo, setGeo] = useState(null); // { lat, lng, accuracy, timestamp }
  const [geoPlaceName, setGeoPlaceName] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [clockDetailsOpen, setClockDetailsOpen] = useState(false);
  const [selectedClockEntry, setSelectedClockEntry] = useState(null);
  const [clockInPlaceName, setClockInPlaceName] = useState("");
  const [clockOutPlaceName, setClockOutPlaceName] = useState("");
  const fileInputRef = React.useRef(null);
  const geocodeCacheRef = React.useRef(new Map());

  // Ticket logs (stored as internal comments via existing API)
  const [logText, setLogText] = useState("");
  const [logSubmitting, setLogSubmitting] = useState(false);
  
  // Get permissions
  const cId = typeof window !== 'undefined' ? sessionStorage.getItem("category") : null;
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const handleOpen = () => {
    if (externalOpen === undefined) {
      setInternalOpen(true);
    }
  };
  const handleClose = () => {
    // Refresh ticket list when modal closes to update checklist percentage
    if (item?.id) {
      fetchItems(currentPage, currentSearch, currentPageSize);
    }
    if (externalOpen === undefined) {
      setInternalOpen(false);
    } else if (externalOnClose) {
      externalOnClose();
    }
  };

  const currentUserId = typeof window !== "undefined" ? Number(localStorage.getItem("userid")) || null : null;

  // Check if current user is Admin or HelpDeskSupport (for Assign To dropdown visibility)
  const userType = typeof window !== "undefined" ? localStorage.getItem("type") : null;
  const userTypeNum = userType ? Number(userType) : null;
  const isAdmin = userTypeNum === 1 || userTypeNum === 0; // ADMIN = 1, SuperAdmin = 0
  const isHelpDeskSupportUser = userTypeNum === 14; // HelpDeskSupport = 14
  const canAssignTicket = isAdmin || isHelpDeskSupportUser;

  // State for Assign To
  const [helpDeskUsers, setHelpDeskUsers] = useState([]);
  const [loadingHelpDeskUsers, setLoadingHelpDeskUsers] = useState(false);
  const [customAssigneeNames, setCustomAssigneeNames] = useState([]); // Store custom names entered by user

  // Auto-open when item is set and modal is controlled externally
  useEffect(() => {
    if (externalOpen !== undefined && item && !open) {
      // This will be handled by parent
    }
  }, [item, externalOpen, open]);

  // Check if current user is SuperAdmin and HelpDeskCustomer
  useEffect(() => {
    const checkUserType = async () => {
      try {
        const roleId = localStorage.getItem("role");
        const userType = localStorage.getItem("type");
        
        // Check if user is HelpDeskCustomer (UserType = 25)
        if (userType === "25" || userType === 25) {
          setIsHelpDeskCustomer(true);
        } else {
          setIsHelpDeskCustomer(false);
        }

        if (!roleId) {
          setIsSuperAdmin(false);
          return;
        }

        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/User/GetAllUserRoles?SkipCount=0&MaxResultCount=1000&Search=null`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        let resolvedRoleName = "";
        if (response.ok) {
          const data = await response.json();
          const roles = data?.result?.items || data?.items || [];
          const currentRole = roles.find((r) => r.id === parseInt(roleId));
          if (currentRole && (currentRole.name === "SuperAdmin" || currentRole.displayName === "SuperAdmin")) {
            setIsSuperAdmin(true);
            resolvedRoleName = currentRole.name || currentRole.displayName || "";
            setRoleName(resolvedRoleName);
          } else {
            setIsSuperAdmin(false);
            resolvedRoleName = currentRole?.name || currentRole?.displayName || "";
            setRoleName(resolvedRoleName);
          }
        } else {
          setIsSuperAdmin(false);
          setRoleName("");
        }

        const isHelpDeskSupport = userType === "14" || userType === 14;
        const isAdminType = userType === "1" || userType === 1 || userType === "0" || userType === 0;
        const isAdminRole =
          (resolvedRoleName || "").toLowerCase() === "admin" ||
          (resolvedRoleName || "").toLowerCase() === "superadmin";

        // Clock In tab is now available to all users
        setCanClockIn(true);
      } catch (error) {
        console.error("Error checking user type:", error);
        setIsSuperAdmin(false);
        setIsHelpDeskCustomer(false);
        setRoleName("");
        // Clock In tab is now available to all users
        setCanClockIn(true);
      }
    };

    if (open) {
      checkUserType();
    }
  }, [open]);

  // Clock In tab is now available to all users, so no need to switch tabs

  const toLocalDateTimeInputValue = (date) => {
    // returns yyyy-MM-ddTHH:mm (for datetime-local input)
    const pad = (n) => String(n).padStart(2, "0");
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const loadClockEntries = async () => {
    if (!item?.id) return;
    try {
      setClockLoading(true);
      setClockError("");
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/GetTicketClockEntries?ticketId=${item.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      const list = data?.result ?? data ?? [];
      setClockEntries(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error loading clock entries:", err);
      setClockError(err?.message || "Failed to load clock entries");
    } finally {
      setClockLoading(false);
    }
  };

  const getActiveClockEntry = React.useMemo(() => {
    if (!currentUserId) return null;
    return (clockEntries ?? []).find((e) => (e.userId ?? e.UserId) === currentUserId && !(e.clockOutAt ?? e.ClockOutAt));
  }, [clockEntries, currentUserId]);

  useEffect(() => {
    if (!open) return;
    if (!item?.id) return;

    // initialize datetime inputs when opening
    setClockInAt(toLocalDateTimeInputValue(new Date()));
    setClockOutAt(toLocalDateTimeInputValue(new Date()));

    // If user switches to clock tab, load entries and start geolocation watch
    if (activeTab !== 1) return;

    loadClockEntries();

    if (!navigator?.geolocation) {
      setGeoStatus("Geolocation is not supported by this browser.");
      return;
    }

    setGeoStatus("Fetching live location…");
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setGeoStatus("Live location ready");
      },
      (error) => {
        console.error("Geolocation error:", error);
        setGeoStatus(error?.message || "Failed to get location");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, [open, activeTab, item?.id]);

  const stopCamera = () => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {
      // ignore
    } finally {
      setCameraStream(null);
    }
  };

  useEffect(() => {
    if (!open || activeTab !== 1) return;
    return () => {
      stopCamera();
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [open, activeTab]);

  const startCamera = async () => {
    try {
      setCameraError("");
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError("Camera is not supported in this browser. Use the upload button instead.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(err?.message || "Failed to access camera");
    }
  };

  const takePhoto = async () => {
    try {
      setCameraError("");
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, width, height);

      await new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            setCameraError("Failed to capture photo.");
            resolve();
            return;
          }
          const file = new File([blob], `clock_${Date.now()}.jpg`, { type: "image/jpeg" });
          setPhotoFile(file);
          if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
          setPhotoPreviewUrl(URL.createObjectURL(file));
          resolve();
        }, "image/jpeg", 0.92);
      });
    } catch (err) {
      console.error("Take photo error:", err);
      setCameraError(err?.message || "Failed to take photo");
    }
  };

  const onPhotoPicked = (file) => {
    if (!file) return;
    setPhotoFile(file);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const clearSelectedPhoto = () => {
    setPhotoFile(null);
    setCameraError("");
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl("");
    if (fileInputRef.current) {
      // allow re-selecting the same file again
      fileInputRef.current.value = "";
    }
  };

  const submitClockIn = async () => {
    if (!item?.id) return;
    try {
      setClockLoading(true);
      setClockError("");
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing");

      if (!photoFile) {
        setClockError("Clock-in photo is required.");
        return;
      }

      const fd = new FormData();
      fd.append("TicketId", String(item.id));
      fd.append("ClockInAt", clockInAt ? new Date(clockInAt).toISOString() : "");
      if (geo?.lat != null) fd.append("Latitude", String(geo.lat));
      if (geo?.lng != null) fd.append("Longitude", String(geo.lng));
      if (geo?.accuracy != null) fd.append("AccuracyMeters", String(geo.accuracy));
      fd.append("photo", photoFile);

      const response = await fetch(`${BASE_URL}/HelpDesk/ClockIn`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const data = await response.json();
      const ok = response.ok && (data?.statusCode === 200 || data?.status === "SUCCESS" || data?.status === 200 || data?.statusCode === "SUCCESS");
      if (!ok) throw new Error(data?.message || "Clock-in failed");

      toast.success("Clocked in successfully");
      clearSelectedPhoto();
      await loadClockEntries();
    } catch (err) {
      console.error("Clock-in error:", err);
      setClockError(err?.message || "Clock-in failed");
    } finally {
      setClockLoading(false);
    }
  };

  const submitClockOut = async () => {
    if (!item?.id) return;
    try {
      setClockLoading(true);
      setClockError("");
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing");

      if (!photoFile) {
        setClockError("Clock-out photo is required.");
        return;
      }

      const fd = new FormData();
      fd.append("TicketId", String(item.id));
      fd.append("ClockOutAt", clockOutAt ? new Date(clockOutAt).toISOString() : "");
      if (geo?.lat != null) fd.append("Latitude", String(geo.lat));
      if (geo?.lng != null) fd.append("Longitude", String(geo.lng));
      if (geo?.accuracy != null) fd.append("AccuracyMeters", String(geo.accuracy));
      fd.append("photo", photoFile);

      const response = await fetch(`${BASE_URL}/HelpDesk/ClockOut`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const data = await response.json();
      const ok = response.ok && (data?.statusCode === 200 || data?.status === "SUCCESS" || data?.status === 200 || data?.statusCode === "SUCCESS");
      if (!ok) throw new Error(data?.message || "Clock-out failed");

      toast.success("Clocked out successfully");
      clearSelectedPhoto();
      await loadClockEntries();
    } catch (err) {
      console.error("Clock-out error:", err);
      setClockError(err?.message || "Clock-out failed");
    } finally {
      setClockLoading(false);
    }
  };

  const openClockEntryDetails = (entry) => {
    setSelectedClockEntry(entry);
    setClockDetailsOpen(true);
  };

  const closeClockEntryDetails = () => {
    setClockDetailsOpen(false);
    setSelectedClockEntry(null);
    setClockInPlaceName("");
    setClockOutPlaceName("");
    setLogText("");
  };

  const buildMapsLink = (lat, lng) => {
    if (lat == null || lng == null) return null;
    return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;
  };

  const reverseGeocode = async (lat, lng, signal) => {
    if (lat == null || lng == null) return "";

    const key = `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
    const cache = geocodeCacheRef.current;
    if (cache.has(key)) return cache.get(key) || "";

    // OpenStreetMap Nominatim reverse geocoding (no API key).
    // We debounce + cache to avoid excessive requests.
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;

    const res = await fetch(url, {
      method: "GET",
      signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) throw new Error(`Reverse geocode failed (${res.status})`);

    const data = await res.json();
    const name = data?.display_name || "";
    cache.set(key, name);
    return name;
  };

  // Live location name (debounced)
  useEffect(() => {
    if (!geo?.lat || !geo?.lng) {
      setGeoPlaceName("");
      return;
    }

    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const name = await reverseGeocode(geo.lat, geo.lng, controller.signal);
        setGeoPlaceName(name);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setGeoPlaceName("");
      }
    }, 900);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [geo?.lat, geo?.lng]);

  // Selected entry location names (debounced)
  useEffect(() => {
    if (!clockDetailsOpen || !selectedClockEntry) return;

    const inLat = selectedClockEntry.clockInLatitude ?? selectedClockEntry.ClockInLatitude;
    const inLng = selectedClockEntry.clockInLongitude ?? selectedClockEntry.ClockInLongitude;
    const outLat = selectedClockEntry.clockOutLatitude ?? selectedClockEntry.ClockOutLatitude;
    const outLng = selectedClockEntry.clockOutLongitude ?? selectedClockEntry.ClockOutLongitude;

    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        if (inLat != null && inLng != null) {
          const inName = await reverseGeocode(inLat, inLng, controller.signal);
          setClockInPlaceName(inName);
        } else {
          setClockInPlaceName("");
        }
      } catch (e) {
        if (e?.name !== "AbortError") setClockInPlaceName("");
      }

      try {
        if (outLat != null && outLng != null) {
          const outName = await reverseGeocode(outLat, outLng, controller.signal);
          setClockOutPlaceName(outName);
        } else {
          setClockOutPlaceName("");
        }
      } catch (e) {
        if (e?.name !== "AbortError") setClockOutPlaceName("");
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [clockDetailsOpen, selectedClockEntry]);

  // Fetch the ticket's project if it exists and is not in the normalizedProjects list
  useEffect(() => {
    const fetchTicketProject = async () => {
      if (!open || !item) {
        setTicketProject(null);
        return;
      }
      
      // First try to get projectId from the ticket
      let ticketProjectId = item.projectId ?? item.projectEntity?.id;
      
      // If projectId is null but Project name exists, try to find the project by name in Project Management
      if (!ticketProjectId && item.project) {
        console.log("EditTicket: ProjectId is null but Project name exists:", item.project);
        console.log("EditTicket: Searching for project by name in normalizedProjects...");
        
        // Wait for normalizedProjects to be available
        const checkProjects = () => {
          if (normalizedProjects && normalizedProjects.length > 0) {
            const foundByName = normalizedProjects.find(p => 
              p.name?.toLowerCase() === item.project?.toLowerCase() ||
              p.code?.toLowerCase() === item.project?.toLowerCase()
            );
            if (foundByName) {
              console.log("EditTicket: Found project by name:", foundByName);
              setTicketProject(foundByName);
              return true;
            }
          }
          return false;
        };
        
        // Check immediately if projects are already loaded
        if (checkProjects()) {
          return;
        }
        
        // If not found, try fetching from Project Management by name
        // This will be handled by the project fetching logic below
      }
      
      if (!ticketProjectId) {
        console.log("EditTicket: No projectId found in ticket");
        setTicketProject(null);
        return;
      }

      // Fetch the project by ID - try Project Management first, then fallback to old Project endpoint
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("No token available for fetching project");
          return;
        }

        console.log("EditTicket: Fetching ticket project with ID:", ticketProjectId);
        
        // First try Project Management module
        let response = await fetch(`${BASE_URL}/ProjectManagementModule/projects/${ticketProjectId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        let project = null;
        
        if (response.ok) {
          const data = await response.json();
          project = data?.result || data;
          if (project) {
            console.log("EditTicket: Found project in Project Management module");
          }
        }

        // If not found in Project Management, try old Project endpoint
        if (!project) {
          console.log("EditTicket: Project not found in Project Management, trying old Project endpoint");
          response = await fetch(`${BASE_URL}/Project/GetProjectById?id=${ticketProjectId}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            project = data?.result || data;
            if (project) {
              console.log("EditTicket: Found project in old Project table");
            }
          }
        }

        if (project) {
          // Normalize the project to match the format expected by normalizedProjects
          const normalizedProject = {
            ...project,
            id: toNumericId(project.id || project.projectId || ticketProjectId),
            customerIdNormalized: project.customerId,
            customerNameNormalized: project.customerName || 
              project.customer?.displayName || 
              project.customer?.name ||
              [project.customer?.firstName, project.customer?.lastName].filter(Boolean).join(" ").trim() ||
              "",
          };
          setTicketProject(normalizedProject);
          console.log("EditTicket: Fetched and set ticket project:", normalizedProject);
        } else {
          console.warn("EditTicket: Project not found in either Project Management or old Project table");
          setTicketProject(null);
        }
      } catch (error) {
        console.error("EditTicket: Error fetching ticket project:", error);
        setTicketProject(null);
      }
    };

    if (open && item) {
      fetchTicketProject();
    } else {
      setTicketProject(null);
    }
  }, [open, item]);

  // Fetch checklist and comments when modal opens
  useEffect(() => {
    if (open && item?.id) {
      fetchComments();
      // Initialize checklist from item data
      if (item?.checklist && Array.isArray(item.checklist)) {
        const formattedChecklist = item.checklist.map(c => ({
          id: c.id,
          item: c.item,
          isCompleted: c.isCompleted || false,
          order: c.order || 0,
        }));
        setChecklist(formattedChecklist);
      } else {
        setChecklist([]);
      }
    }
  }, [open, item?.id, item?.checklist]);

  // Timer to update remaining time display for editable comments
  useEffect(() => {
    if (!open) return;
    
    const hasEditableComments = comments.some(comment => isCommentEditable(comment));
    if (!hasEditableComments) return;

    const interval = setInterval(() => {
      // Force re-render to update remaining time display
      setTimeUpdateTrigger(prev => prev + 1);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [open, comments]);

  // Checklist removed from frontend

  const fetchComments = async () => {
    try {
      if (!item?.id) {
        console.warn("Cannot fetch comments: item.id is missing");
        return;
      }
      
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token available for fetching comments");
        return;
      }

      const response = await fetch(
        `${BASE_URL}/HelpDesk/GetCommentsByTicketId?ticketId=${item.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched comments data:", data);
        
        // Handle different response formats - backend returns ApiResponse with result property
        let commentsList = [];
        if (Array.isArray(data)) {
          commentsList = data;
        } else if (data?.result) {
          // ApiResponse format: { statusCode: 200, message: "...", result: [...] }
          commentsList = Array.isArray(data.result) ? data.result : [];
        } else if (data?.data) {
          commentsList = Array.isArray(data.data) ? data.data : [];
        } else if (data?.items) {
          commentsList = Array.isArray(data.items) ? data.items : [];
        }
        
        // Sort comments in descending order (newest first)
        commentsList = commentsList.sort((a, b) => {
          const dateA = new Date(a.createdOn || 0).getTime();
          const dateB = new Date(b.createdOn || 0).getTime();
          return dateB - dateA; // Descending order
        });
        
        console.log("Setting comments list:", commentsList.length, "comments");
        setComments(commentsList);
      } else {
        console.error("Failed to fetch comments. Status:", response.status);
        try {
          const errorText = await response.text();
          console.error("Error response:", errorText);
        } catch (textError) {
          console.error("Could not read error response");
        }
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      // Don't crash the app - just log the error
    }
  };

  const addTicketLog = async () => {
    try {
      if (!item?.id) {
        toast.error("Ticket ID is missing");
        return;
      }

      const text = (logText || "").trim();
      if (!text) {
        toast.error("Log message is required");
        return;
      }

      setLogSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing. Please log in again.");
        return;
      }

      const response = await fetch(`${BASE_URL}/HelpDesk/CreateComment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticketId: item.id,
          comment: text,
          isInternal: true,
        }),
      });

      // Some endpoints return non-standard shapes; treat HTTP 200 as success unless explicitly FAILED
      const responseText = await response.text().catch(() => "");
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {};
      }

      const ok =
        response.ok &&
        !(
          data?.statusCode === -99 ||
          data?.statusCode === "FAILED" ||
          data?.status === "FAILED"
        );

      if (!ok) throw new Error(data?.message || "Failed to add log");

      toast.success(data?.message || "Log added");
      setLogText("");
      await fetchComments();
    } catch (err) {
      console.error("Add log error:", err);
      toast.error(err?.message || "Failed to add log");
    } finally {
      setLogSubmitting(false);
    }
  };

  // Check if comment is within 2 minutes of creation
  const isCommentEditable = (comment) => {
    if (!comment.createdOn) return false;
    const createdTime = new Date(comment.createdOn).getTime();
    const currentTime = new Date().getTime();
    const twoMinutes = 2 * 60 * 1000; // 2 minutes in milliseconds
    return (currentTime - createdTime) <= twoMinutes;
  };

  // Get remaining time in seconds
  const getRemainingTime = (comment) => {
    if (!comment.createdOn) return 0;
    const createdTime = new Date(comment.createdOn).getTime();
    const currentTime = new Date().getTime();
    const twoMinutes = 2 * 60 * 1000;
    const elapsed = currentTime - createdTime;
    const remaining = Math.max(0, Math.floor((twoMinutes - elapsed) / 1000));
    return remaining;
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing");
        return;
      }

      const response = await fetch(`${BASE_URL}/HelpDesk/DeleteComment?commentId=${commentId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let responseText = "";
      try {
        responseText = await response.text();
        console.log("Delete comment response text:", responseText);
      } catch (textError) {
        console.error("Error reading response text:", textError);
        toast.error("Failed to read server response. Please try again.");
        return;
      }

      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        if (response.ok) {
          toast.success("Comment deleted successfully");
          await fetchComments();
          return;
        } else {
          toast.error("Invalid response from server. Please try again.");
          return;
        }
      }

      console.log("Parsed delete comment response:", data);

      // Check for success - backend returns statusCode (200 for SUCCESS, -99 for FAILED)
      const isSuccess = response.ok && (
        data.statusCode === 200 || 
        data.statusCode === "SUCCESS" ||
        data.status === "SUCCESS" || 
        data.status === 200 ||
        response.status === 200
      );

      if (isSuccess) {
        toast.success(data.message || "Comment deleted successfully");
        await fetchComments();
      } else {
        const errorMessage = data.message || data.error || "Failed to delete comment";
        console.error("API returned error:", data);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("An error occurred while deleting comment");
    }
  };

  // Handle edit comment
  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.comment);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  // Handle save edited comment
  const handleSaveComment = async (commentId) => {
    if (!editingCommentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing");
        return;
      }

      console.log("Updating comment:", { commentId, comment: editingCommentText.trim() });
      console.log("API URL:", `${BASE_URL}/HelpDesk/UpdateComment`);

      const response = await fetch(`${BASE_URL}/HelpDesk/UpdateComment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          commentId: commentId,
          comment: editingCommentText.trim(),
        }),
      });

      console.log("Update comment response status:", response.status);

      let responseText = "";
      try {
        responseText = await response.text();
        console.log("Update comment response text:", responseText);
      } catch (textError) {
        console.error("Error reading response text:", textError);
        toast.error("Failed to read server response. Please try again.");
        return;
      }

      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        if (response.ok) {
          toast.success("Comment updated successfully");
          setEditingCommentId(null);
          setEditingCommentText("");
          await fetchComments();
          return;
        } else {
          toast.error("Invalid response from server. Please try again.");
          return;
        }
      }

      console.log("Parsed update comment response:", data);

      // Check for success - backend returns statusCode (200 for SUCCESS, -99 for FAILED)
      const isSuccess = response.ok && (
        data.statusCode === 200 || 
        data.statusCode === "SUCCESS" ||
        data.status === "SUCCESS" || 
        data.status === 200 ||
        response.status === 200
      );

      if (isSuccess) {
        toast.success(data.message || "Comment updated successfully");
        setEditingCommentId(null);
        setEditingCommentText("");
        await fetchComments();
      } else {
        const errorMessage = data.message || data.error || "Failed to update comment";
        console.error("API returned error:", data);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error(error.message || "An error occurred while updating comment");
    }
  };

  const handleAddComment = async (values, { resetForm, setSubmitting }) => {
    try {
      if (!item?.id) {
        toast.error("Ticket ID is missing");
        setSubmitting(false);
        return;
      }

      if (!values.comment || !values.comment.trim()) {
        toast.error("Please enter a comment");
        setSubmitting(false);
        return;
      }

      setSubmitting(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Authentication token is missing. Please log in again.");
        setSubmitting(false);
        return;
      }

      const requestBody = {
        ticketId: item.id,
        comment: values.comment.trim(),
        isInternal: isHelpDeskCustomer ? false : (values.isInternal || false),
      };

      console.log("=== COMMENT SUBMISSION START ===");
      console.log("Creating comment:", requestBody);
      console.log("API URL:", `${BASE_URL}/HelpDesk/CreateComment`);
      console.log("Ticket ID:", item.id);
      console.log("Token exists:", !!token);

      let response;
      try {
        response = await fetch(`${BASE_URL}/HelpDesk/CreateComment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
      } catch (fetchError) {
        console.error("Network error:", fetchError);
        toast.error("Network error. Please check your connection and try again.");
        setSubmitting(false);
        return;
      }

      // Check HTTP status first - if 200, the request was successful
      const isHttpSuccess = response.ok && response.status === 200;
      
      if (isHttpSuccess) {
        // HTTP 200 means success - comment was created
        // Try to read response for message, but don't fail if we can't
        let data = {};
        try {
          const responseText = await response.text();
          if (responseText) {
            try {
              data = JSON.parse(responseText);
            } catch (parseError) {
              // Response is not JSON, but that's okay - HTTP 200 means success
              console.log("Response is not JSON, but HTTP 200 indicates success");
            }
          }
        } catch (readError) {
          // Can't read response, but HTTP 200 means success
          console.log("Could not read response body, but HTTP 200 indicates success");
        }

        // Check if there's an explicit error in the response data
        if (data.statusCode === -99 || data.statusCode === "FAILED" || data.status === "FAILED") {
          const errorMessage = data?.message || data?.error || "Failed to add comment";
          toast.error(errorMessage);
        } else {
          // Success - show success message
          toast.success(data.message || "Comment added successfully");
          resetForm();
          
          // Refresh comments from server immediately to get the complete data
          await fetchComments();
        }
      } else {
        // HTTP error - try to read error message
        let errorMessage = `Server error (${response.status}). Please try again.`;
        try {
          const responseText = await response.text();
          if (responseText) {
            try {
              const data = JSON.parse(responseText);
              errorMessage = data?.message || data?.error || errorMessage;
            } catch (parseError) {
              // Couldn't parse, use default message
            }
          }
        } catch (readError) {
          // Couldn't read response, use default message
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(error.message || "An error occurred while adding comment. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const { data: categoriesData } = useApi("/HelpDesk/GetAllCategories?SkipCount=0&MaxResultCount=1000&Search=null");
  // Fetch projects from Project Management module instead of regular Project module
  const [projectsData, setProjectsData] = useState(null);
  
  useEffect(() => {
    const fetchProjectManagementProjects = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/ProjectManagementModule/projects`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          // Normalize the response to match the expected format
          const projectList = Array.isArray(data?.result) ? data.result : [];
          setProjectsData({ result: projectList });
          console.log("Fetched Project Management projects for edit:", projectList);
        } else {
          console.error("Failed to fetch Project Management projects:", response.status);
          setProjectsData({ result: [] });
        }
      } catch (error) {
        console.error("Error fetching Project Management projects:", error);
        setProjectsData({ result: [] });
      }
    };
    
    if (open) {
      fetchProjectManagementProjects();
    }
  }, [open]);
  const { data: prioritySettingsData } = useApi("/HelpDesk/GetPrioritySettings");

  const categories = categoriesData?.items || [];
  
  // Fetch HelpDeskSupport users
  const fetchHelpDeskSupportUsers = async () => {
    try {
      setLoadingHelpDeskUsers(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/User/GetUsersByUserType?userType=14`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        const users = Array.isArray(data) 
          ? data 
          : Array.isArray(data?.result) 
            ? data.result 
            : Array.isArray(data?.data)
              ? data.data
              : [];
        
        // Deduplicate users by ID
        const deduped = new Map();
        users.forEach((user) => {
          if (!user) return;
          const key = user?.id ?? user?.userId ?? null;
          if (key === null || key === undefined) return;
          if (!deduped.has(key)) {
            deduped.set(key, user);
          }
        });
        
        const uniqueUsers = Array.from(deduped.values());
        setHelpDeskUsers(uniqueUsers);
        console.log(`EditTicket: Found ${deduped.size} HelpDeskSupport users`);
        return uniqueUsers; // Return users for immediate use
      }
      return [];
    } catch (error) {
      console.error("Error fetching HelpDeskSupport users:", error);
      return [];
    } finally {
      setLoadingHelpDeskUsers(false);
    }
  };

  // Fetch HelpDeskSupport users when modal opens
  useEffect(() => {
    if (open) {
      fetchHelpDeskSupportUsers();
      // Load existing custom assignee name if ticket has one
      if (item?.assignedToName) {
        setCustomAssigneeNames([item.assignedToName]);
      }
    }
  }, [open, item]);

  // Handle adding new assignee name (just store the name, no user creation)
  const handleAddNewAssigneeName = (assigneeName, setFieldValue) => {
    if (!assigneeName || !assigneeName.trim()) {
      toast.error("Name is required");
      return;
    }

    const trimmedName = assigneeName.trim();
    
    // Add to custom names list if not already present
    if (!customAssigneeNames.includes(trimmedName)) {
      setCustomAssigneeNames([...customAssigneeNames, trimmedName]);
    }
    
    // Set the name directly (will be stored in AssignedToName field)
    setFieldValue("assignedToName", trimmedName);
    setFieldValue("assignedToUserId", null); // Clear user ID when using custom name
    
    toast.success(`Assignee "${trimmedName}" will be saved with the ticket`);
  };

  const normalizeProjectSource = React.useMemo(() => {
    if (!projectsData) return [];
    if (Array.isArray(projectsData)) return projectsData;
    if (Array.isArray(projectsData?.result)) return projectsData.result;
    if (Array.isArray(projectsData?.items)) return projectsData.items;
    return [];
  }, [projectsData]);

  const toNumericId = (value) => {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const deriveCustomerName = (project) => {
    const candidateNames = [
      project.customerName,
      project.customer?.displayName,
      project.customer?.name,
      project.customer?.customerName,
      project.customer?.company,
      project.customerDetails?.displayName,
      project.customerDetails?.name,
      project.customerInfo?.displayName,
      project.customerInfo?.name,
    ];

    const fromParts = [
      [project.customer?.firstName, project.customer?.lastName],
      [project.customerDetails?.firstName, project.customerDetails?.lastName],
      [project.customerInfo?.firstName, project.customerInfo?.lastName],
    ];

    const directName = candidateNames.find(
      (name) => typeof name === "string" && name.trim().length > 0
    );
    if (directName) return directName.trim();

    const composed = fromParts
      .map((parts) => parts.filter(Boolean).join(" ").trim())
      .find((name) => name.length > 0);

    if (composed) return composed;

    return "";
  };

  const normalizedProjects = React.useMemo(() => {
    // Project Management projects come directly from the API, not from normalizeProjectSource
    const sourceProjects = normalizeProjectSource;
    
    console.log("EditTicket: Normalizing projects", {
      sourceProjectsCount: sourceProjects?.length || 0,
      ticketProject: ticketProject ? { id: ticketProject.id, name: ticketProject.name } : null,
    });

    if (!sourceProjects || sourceProjects.length === 0) {
      console.log("EditTicket: No Project Management projects available in edit form");
      // If no projects but we have a ticketProject, return it
      if (ticketProject) {
        console.log("EditTicket: Only ticketProject available, returning it");
        return [{
          ...ticketProject,
          id: toNumericId(ticketProject.id),
          customerIdNormalized: ticketProject.customerId,
          customerNameNormalized: deriveCustomerName(ticketProject),
        }];
      }
      return [];
    }

    const projects = sourceProjects.map((project) => {
      // Project Management projects use 'id' directly
      const projectId = project.id || project.projectId;
      
      const customerIdCandidates = [
        project.customerId,
        project.assignedToCustomerId,
        project.customer?.id,
        project.customer?.customerId,
        project.customerDetails?.id,
        project.customerDetails?.customerId,
        project.customerInfo?.id,
        project.customerInfo?.customerId,
      ];

      const customerId =
        customerIdCandidates
          .map((candidate) => toNumericId(candidate))
          .find((candidate) => candidate !== null && candidate !== undefined) ?? null;

      return {
        ...project,
        id: toNumericId(projectId), // Ensure id is numeric
        customerIdNormalized: customerId,
        customerNameNormalized: deriveCustomerName(project),
      };
    });

    console.log("EditTicket: Normalized projects:", projects.map(p => ({ id: p.id, name: p.name })));

    // Add the ticket's project if it exists and is not already in the list
    if (ticketProject) {
      const ticketProjectId = toNumericId(ticketProject.id);
      const alreadyIncluded = projects.some(p => {
        const pId = toNumericId(p.id);
        const match = pId === ticketProjectId;
        if (!match && projects.length < 10) {
          console.log(`EditTicket: Comparing project ${pId} with ticket project ${ticketProjectId} - No match`);
        }
        return match;
      });
      
      if (!alreadyIncluded) {
        console.log("EditTicket: Adding ticket project to normalizedProjects:", {
          id: ticketProject.id,
          normalizedId: ticketProjectId,
          name: ticketProject.name,
        });
        const normalizedTicketProject = {
          ...ticketProject,
          id: ticketProjectId, // Ensure id is numeric
          customerIdNormalized: ticketProject.customerId || ticketProject.customerIdNormalized,
          customerNameNormalized: ticketProject.customerNameNormalized || deriveCustomerName(ticketProject),
        };
        projects.push(normalizedTicketProject);
        console.log("EditTicket: Added ticket project to list. New count:", projects.length);
      } else {
        console.log("EditTicket: Ticket project already in normalizedProjects list");
      }
    } else if (item?.project && projects.length > 0) {
      // If no ticketProject but item.project name exists, try to find it by name
      const foundByName = projects.find(p => 
        p.name?.toLowerCase() === item.project?.toLowerCase() ||
        p.code?.toLowerCase() === item.project?.toLowerCase()
      );
      if (foundByName) {
        console.log("EditTicket: Found project by name in normalizedProjects:", foundByName);
      } else {
        console.log("EditTicket: Project name exists but not found in normalizedProjects:", item.project);
      }
    } else {
      console.log("EditTicket: No ticketProject to add");
    }

    console.log("EditTicket: Final normalizedProjects count:", projects.length);
    return projects;
  }, [normalizeProjectSource, ticketProject]);

  const prioritySettings = Array.isArray(prioritySettingsData?.result)
    ? prioritySettingsData.result
    : Array.isArray(prioritySettingsData)
    ? prioritySettingsData
    : [];

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const selectedProjectIds = Array.isArray(values.projectIds)
        ? values.projectIds.filter((id) => id !== null && id !== undefined)
        : [];
      const primaryProjectId = selectedProjectIds.length > 0 ? selectedProjectIds[0] : null;
      const primaryProject =
        primaryProjectId !== null
          ? normalizedProjects.find((proj) => proj?.id === primaryProjectId) || null
          : null;
      const primaryProjectName = primaryProject?.name || null;

      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/UpdateTicket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: item.id,
          subject: values.subject,
          description: values.description,
          status: values.status,
          priority: values.priority,
          categoryId: values.categoryId,
          assignedToUserId: values.assignedToUserId || null,
          assignedToName: values.assignedToName || null,
          resolutionNotes: values.resolutionNotes || "",
          project: primaryProjectName,
          projectId: primaryProjectId,
          projectIds: selectedProjectIds,
          startDate: values.startDate ? (values.startTime ? `${values.startDate}T${values.startTime}:00` : `${values.startDate}T00:00:00`) : null,
          dueDate: values.dueDate ? (values.dueTime ? `${values.dueDate}T${values.dueTime}:00` : `${values.dueDate}T23:59:59`) : null,
          customerName: values.customerName ? values.customerName.trim() : null,
          customerId: values.customerId || null,
          customerEmail: null,
          customerPhone: null,
          customerCompany: null,
          feedbackRating: values.feedbackRating ? Number(values.feedbackRating) : null,
          feedbackComment: values.feedbackComment ? values.feedbackComment.trim() : null,
        }),
      });

      const data = await response.json();

      // Check if the request was successful
      if (response.ok) {
        // If response is OK, treat as success unless explicitly marked as error
        const isSuccess = data.status === "SUCCESS" || 
                         data.statusCode === 200 || 
                         response.status === 200 ||
                         !data.status || // If no status field, assume success
                         (data.status && data.status !== "ERROR" && data.status !== "FAIL");
        
        if (isSuccess) {
          toast.success(data.message || "Ticket updated successfully!");
          handleClose();
          // Refresh the table with current page parameters
          fetchItems(currentPage, currentSearch, currentPageSize);
        } else {
          // Response is OK but status indicates failure
          toast.error(data.message || "Failed to update ticket");
        }
      } else {
        // HTTP error response
        toast.error(data.message || "Failed to update ticket");
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("An error occurred while updating the ticket");
    } finally {
      setSubmitting(false);
    }
  };

  if (!item) {
    return null;
  }

  const initialProjectIds = React.useMemo(() => {
    if (!item) {
      console.log("EditTicket: No item provided for initialProjectIds");
      return [];
    }

    const normalizeId = (id) => {
      if (id === null || id === undefined) return null;
      if (typeof id === "number") return id;
      if (typeof id === "string") {
        const parsed = parseInt(id, 10);
        return Number.isNaN(parsed) ? null : parsed;
      }
      return null;
    };

    const fromArray = (arr) =>
      arr
        .map((entry) => {
          if (entry === null || entry === undefined) return null;
          if (typeof entry === "number" || typeof entry === "string") {
            return normalizeId(entry);
          }
          if (typeof entry === "object") {
            const candidate = entry.projectId ?? entry.id ?? entry.value ?? null;
            return normalizeId(candidate);
          }
          return null;
        })
        .filter((val) => val !== null && val !== undefined);

    console.log("EditTicket: Checking project IDs from item:", {
      projectId: item.projectId,
      projectEntity: item.projectEntity,
      projectIds: item.projectIds,
      ticketProjects: item.ticketProjects,
      projects: item.projects,
    });

    // First check if projectIds array exists
    if (Array.isArray(item.projectIds) && item.projectIds.length > 0) {
      const result = fromArray(item.projectIds);
      console.log("EditTicket: Found projectIds array:", result);
      return result;
    }

    // Check other possible array fields
    if (Array.isArray(item.ticketProjects) && item.ticketProjects.length > 0) {
      const result = fromArray(item.ticketProjects);
      console.log("EditTicket: Found ticketProjects array:", result);
      return result;
    }

    if (Array.isArray(item.projects) && item.projects.length > 0) {
      const result = fromArray(item.projects);
      console.log("EditTicket: Found projects array:", result);
      return result;
    }

    // Most importantly: check projectId (singular) - this is what the backend stores
    const directId = normalizeId(item.projectId ?? item.projectEntity?.id);
    if (directId !== null) {
      console.log("EditTicket: Found item.projectId or projectEntity.id:", directId);
      return [directId];
    }

    console.log("EditTicket: No project ID found in item");
    return [];
  }, [item]);

  const initialCustomerId = React.useMemo(() => {
    if (!item) return null;

    const candidates = [
      item.customerId,
      item.customer?.id,
      item.customer?.customerId,
      item.customerDetails?.id,
      item.customerDetails?.customerId,
      item.customerInfo?.id,
      item.customerInfo?.customerId,
    ];

    return (
      candidates
        .map((candidate) => toNumericId(candidate))
        .find((candidate) => candidate !== null && candidate !== undefined) ?? null
    );
  }, [item]);

  return (
    <>
      {externalOpen === undefined && (
        <Tooltip title="Edit Ticket">
          <IconButton size="small" onClick={handleOpen} color="primary">
            <BorderColorIcon />
          </IconButton>
        </Tooltip>
      )}

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="edit-ticket-modal"
        aria-describedby="edit-ticket-form"
        sx={{
          "& .MuiBackdrop-root": {
            bgcolor: "rgba(0, 0, 0, 0.8)",
          },
        }}
      >
        <Box sx={style}>
          {/* Header */}
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid #E2E8F0",
              bgcolor: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <Typography variant="h6" sx={{ color: "#1A202C", fontWeight: 600 }}>
              Edit Ticket
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {activeTab === 0 ? (
                <Button
                  type="submit"
                  form="edit-ticket-form"
                  variant="contained"
                  size="small"
                  sx={{ bgcolor: "#2196F3", "&:hover": { bgcolor: "#1976D2" } }}
                >
                  Save
                </Button>
              ) : null}
              <IconButton
                onClick={handleClose}
                sx={{
                  color: "#666",
                  "&:hover": { bgcolor: "#E2E8F0", color: "#1A202C" },
                }}
              >
                ×
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ bgcolor: "white", borderBottom: "1px solid #E2E8F0", px: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{ minHeight: 44 }}
            >
              <Tab label="Details" sx={{ minHeight: 44 }} />
              <Tab label="Clock In" sx={{ minHeight: 44 }} />
            </Tabs>
          </Box>

          {activeTab === 0 ? (
            <Formik
              initialValues={{
                subject: item.subject || "",
                description: item.description || "",
                status: item.status || 1,
                priority: item.priority || 2,
                categoryId: item.categoryId || "",
                assignedToUserId: item.assignedToUserId || null,
                assignedToName: item.assignedToName || null,
                resolutionNotes: item.resolutionNotes || "",
                projectIds: initialProjectIds,
                startDate: item.startDate ? new Date(item.startDate).toISOString().split("T")[0] : "",
                startTime: item.startDate ? new Date(item.startDate).toTimeString().slice(0, 5) : "",
                dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : "",
                dueTime: item.dueDate ? new Date(item.dueDate).toTimeString().slice(0, 5) : "",
                customerName:
                  item.customerName ||
                  item.customer?.displayName ||
                  item.customer?.name ||
                  [item.customer?.firstName, item.customer?.lastName].filter(Boolean).join(" ").trim() ||
                  "",
                customerId: initialCustomerId,
                feedbackRating: item.feedbackRating || null,
                feedbackComment: item.feedbackComment || "",
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ values, errors, touched, setFieldValue, isSubmitting }) => (
                <Form id="edit-ticket-form" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <Box
                    sx={{
                      display: "flex",
                      flex: 1,
                      height: "100%",
                      minHeight: 0,
                      overflow: "hidden",
                      flexDirection: { xs: "column", md: "row" },
                    }}
                  >
                    {/* Left Panel - Form Fields */}
                    <Box
                      sx={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        p: { xs: 2, sm: 3 },
                        bgcolor: "white",
                        borderRight: { xs: "none", md: "1px solid #E2E8F0" },
                        borderBottom: { xs: "1px solid #E2E8F0", md: "none" },
                        maxHeight: { xs: "50vh", md: "none" },
                      }}
                    >
                    <Grid container spacing={2}>
                      {/* Customer Name and Project fields at the top */}
                      <Grid item xs={12} md={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          name="customerName"
                          label="Customer Name"
                          value={values.customerName}
                          size="small"
                          disabled={true}
                          onChange={(e) => {
                            setFieldValue("customerName", e.target.value);
                            setFieldValue("customerId", null);
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: "white",
                              "& fieldset": {
                                borderColor: "#E2E8F0",
                              },
                              "&:hover fieldset": {
                                borderColor: "#CBD5E0",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "#2196F3",
                              },
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          disabled={!isSuperAdmin}
                          options={normalizedProjects}
                          getOptionLabel={(option) => option?.name || ""}
                          isOptionEqualToValue={(option, value) => option?.id === value?.id}
                          value={(() => {
                            console.log("EditTicket Autocomplete: Calculating value", {
                              valuesProjectIds: values.projectIds,
                              itemProjectId: item?.projectId,
                              itemProjectEntityId: item?.projectEntity?.id,
                              itemProject: item?.project, // Project name (used when ProjectId is null)
                              normalizedProjectsCount: normalizedProjects.length,
                              normalizedProjectsIds: normalizedProjects.map(p => ({ id: p.id, name: p.name, code: p.code, type: typeof p.id })),
                            });

                            // First try to find from values.projectIds array
                            if (Array.isArray(values.projectIds) && values.projectIds.length > 0) {
                              for (const projectId of values.projectIds) {
                                const normalizedProjectId = toNumericId(projectId);
                                const found = normalizedProjects.find((project) => 
                                  toNumericId(project.id) === normalizedProjectId
                                );
                                if (found) {
                                  console.log("EditTicket: Found project from values.projectIds:", found);
                                  return found;
                                }
                              }
                            }
                            
                            // Fallback: check item.projectId directly (in case form hasn't initialized yet)
                            const ticketProjectId = toNumericId(item?.projectId ?? item?.projectEntity?.id);
                            if (ticketProjectId) {
                              console.log("EditTicket: Looking for project with ID:", ticketProjectId, "Type:", typeof ticketProjectId);
                              console.log("EditTicket: Available projects count:", normalizedProjects.length);
                              console.log("EditTicket: Available project IDs:", normalizedProjects.map(p => ({ 
                                id: p.id, 
                                idType: typeof p.id,
                                normalizedId: toNumericId(p.id),
                                name: p.name 
                              })));
                              
                              const found = normalizedProjects.find((project) => {
                                const projectIdNormalized = toNumericId(project.id);
                                const match = projectIdNormalized === ticketProjectId;
                                if (!match) {
                                  console.log(`EditTicket: Comparing ${projectIdNormalized} (${typeof projectIdNormalized}) with ${ticketProjectId} (${typeof ticketProjectId}) - No match`);
                                }
                                return match;
                              });
                              
                              if (found) {
                                console.log("EditTicket: Found project from item.projectId:", found);
                                return found;
                              } else {
                                console.warn("EditTicket: Project ID", ticketProjectId, "not found in normalizedProjects list");
                                console.warn("EditTicket: Item projectId:", item?.projectId, "projectEntity?.id:", item?.projectEntity?.id);
                                console.warn("EditTicket: All normalized project IDs:", normalizedProjects.map(p => toNumericId(p.id)));
                              }
                            }
                            
                            // Last resort: if projectId is null but Project name exists, try to find by name
                            // This happens when project is from Project Management (foreign key can't reference it)
                            if (!ticketProjectId && item?.project && normalizedProjects.length > 0) {
                              console.log("EditTicket: ProjectId is null, trying to find project by name:", item.project);
                              const foundByName = normalizedProjects.find(p => {
                                const nameMatch = p.name?.toLowerCase() === item.project?.toLowerCase();
                                const codeMatch = p.code?.toLowerCase() === item.project?.toLowerCase();
                                const codeNameMatch = `${p.code} - ${p.name}`.toLowerCase() === item.project?.toLowerCase();
                                return nameMatch || codeMatch || codeNameMatch;
                              });
                              if (foundByName) {
                                console.log("EditTicket: Found project by name:", foundByName);
                                return foundByName;
                              } else {
                                console.warn("EditTicket: Project name not found in normalizedProjects:", item.project);
                                console.warn("EditTicket: Available project names:", normalizedProjects.map(p => ({ name: p.name, code: p.code })));
                              }
                            }
                            
                            console.log("EditTicket: No project found, returning null");
                            return null;
                          })()}
                          onChange={(event, newValue) => {
                            const projectId = newValue?.id ?? null;
                            setFieldValue("projectIds", projectId ? [projectId] : []);

                            if (newValue) {
                              if (newValue.customerNameNormalized) {
                                setFieldValue("customerName", newValue.customerNameNormalized);
                              }
                              setFieldValue("customerId", newValue.customerIdNormalized || null);
                            } else {
                              setFieldValue("customerId", null);
                              setFieldValue("customerName", "");
                            }
                          }}
                          renderOption={(props, option) => (
                            <li {...props}>
                              <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {option?.name || "Unnamed Project"}
                                </Typography>
                                {option.customerNameNormalized ? (
                                  <Typography variant="caption" color="text.secondary">
                                    {option.customerNameNormalized}
                                  </Typography>
                                ) : null}
                              </Box>
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Project"
                              placeholder="Select project"
                              size="small"
                              disabled={!isSuperAdmin}
                              error={touched.projectIds && !!errors.projectIds}
                              helperText={touched.projectIds ? errors.projectIds : (!isSuperAdmin ? "Only SuperAdmin can change project" : "")}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  bgcolor: "white",
                                  "& fieldset": { borderColor: "#E2E8F0" },
                                  "&:hover fieldset": { borderColor: "#CBD5E0" },
                                  "&.Mui-focused fieldset": { borderColor: "#2196F3" },
                                },
                              }}
                            />
                          )}
                          noOptionsText="No projects found"
                          loadingText="Loading projects..."
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          name="subject"
                          label="Subject"
                          disabled={!isSuperAdmin}
                          error={touched.subject && !!errors.subject}
                          helperText={touched.subject ? errors.subject : (!isSuperAdmin ? "Only SuperAdmin can change subject" : "")}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: "white",
                              "& fieldset": {
                                borderColor: "#E2E8F0",
                              },
                              "&:hover fieldset": {
                                borderColor: "#CBD5E0",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "#2196F3",
                              },
                            },
                          }}
                        />
                      </Grid>

                      {/* Assign To dropdown - Only visible to Admin and HelpDeskSupport */}
                      {canAssignTicket && (
                        <Grid item xs={12} md={6}>
                          <Autocomplete
                            disabled={!isSuperAdmin}
                            options={[
                              ...helpDeskUsers,
                              ...customAssigneeNames.map(name => ({ id: null, firstName: name, lastName: "", isCustomName: true }))
                            ]}
                            loading={loadingHelpDeskUsers}
                            getOptionLabel={(option) => {
                              if (!option) return "";
                              // Handle the "Add new" option
                              if (option.inputValue) {
                                return option.inputValue;
                              }
                              // Handle custom names
                              if (option.isCustomName) {
                                return option.firstName || "";
                              }
                              const name = `${option.firstName || ""} ${option.lastName || ""}`.trim();
                              return name || option.email || option.userName || "Unknown";
                            }}
                            filterOptions={(options, params) => {
                              const filtered = filter(options, {
                                ...params,
                                getOptionLabel: (option) => {
                                  if (option.isCustomName) {
                                    return option.firstName || "";
                                  }
                                  const name = `${option.firstName || ""} ${option.lastName || ""}`.trim();
                                  return name || option.email || option.userName || "";
                                },
                              });

                              const { inputValue } = params;
                              // Check if input matches existing option
                              const isExisting = options.some((option) => {
                                if (option.isCustomName) {
                                  return (option.firstName || "").toLowerCase() === inputValue.toLowerCase();
                                }
                                const name = `${option.firstName || ""} ${option.lastName || ""}`.trim();
                                return name.toLowerCase() === inputValue.toLowerCase();
                              });

                              // Suggest adding a new value if it doesn't exist
                              if (inputValue !== "" && !isExisting && inputValue.trim().length > 0 && isSuperAdmin) {
                                filtered.push({
                                  inputValue: inputValue.trim(),
                                  isNewOption: true,
                                  firstName: `Add "${inputValue.trim()}"`,
                                });
                              }

                              return filtered;
                            }}
                            isOptionEqualToValue={(option, value) => {
                              if (option.isCustomName && value?.isCustomName) {
                                return option.firstName === value.firstName;
                              }
                              return option?.id === value?.id;
                            }}
                            value={
                              values.assignedToName 
                                ? { id: null, firstName: values.assignedToName, lastName: "", isCustomName: true }
                                : helpDeskUsers.find((u) => u?.id === values.assignedToUserId) || null
                            }
                            onChange={(event, newValue) => {
                              if (newValue && newValue.isNewOption) {
                                // Add new custom name
                                handleAddNewAssigneeName(newValue.inputValue, setFieldValue);
                              } else if (newValue && newValue.isCustomName) {
                                // Selected a custom name
                                setFieldValue("assignedToName", newValue.firstName);
                                setFieldValue("assignedToUserId", null);
                              } else if (newValue) {
                                // Selected an existing user
                                setFieldValue("assignedToUserId", newValue.id);
                                setFieldValue("assignedToName", null);
                              } else {
                                // Cleared selection
                                setFieldValue("assignedToUserId", null);
                                setFieldValue("assignedToName", null);
                              }
                            }}
                            selectOnFocus
                            clearOnBlur
                            handleHomeEndKeys
                            freeSolo
                            renderOption={(props, option) => {
                              if (option.isNewOption) {
                                return (
                                  <li {...props} style={{ color: "#1976d2", fontWeight: 500 }}>
                                    <AddIcon sx={{ mr: 1, fontSize: 18 }} />
                                    {option.firstName}
                                  </li>
                                );
                              }
                              if (option.isCustomName) {
                                return (
                                  <li {...props} style={{ color: "#28a745", fontWeight: 500 }}>
                                    {option.firstName}
                                  </li>
                                );
                              }
                              const name = `${option.firstName || ""} ${option.lastName || ""}`.trim();
                              return (
                                <li {...props}>
                                  {name || option.email || option.userName || "Unknown"}
                                </li>
                              );
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Assign To (Optional)"
                                size="small"
                                disabled={!isSuperAdmin}
                                placeholder={isSuperAdmin ? "Select user or type name to add..." : ""}
                                helperText={!isSuperAdmin ? "Only SuperAdmin can change assignment" : ""}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    bgcolor: "white",
                                    "& fieldset": { borderColor: "#E2E8F0" },
                                    "&:hover fieldset": { borderColor: "#CBD5E0" },
                                    "&.Mui-focused fieldset": { borderColor: "#2196F3" },
                                  },
                                }}
                                InputProps={{
                                  ...params.InputProps,
                                  endAdornment: (
                                    <>
                                      {loadingHelpDeskUsers ? <CircularProgress color="inherit" size={20} /> : null}
                                      {params.InputProps.endAdornment}
                                    </>
                                  ),
                                }}
                              />
                            )}
                            noOptionsText={isSuperAdmin ? "No users found. Type a name to add new." : "No help desk support users found"}
                            loadingText="Loading help desk support users..."
                          />
                        </Grid>
                      )}

                      {/* Category aligned with Assign To */}
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={touched.categoryId && !!errors.categoryId} size="small">
                          <InputLabel size="small">Category</InputLabel>
                          <Field
                            as={Select}
                            name="categoryId"
                            label="Category"
                            value={values.categoryId}
                            disabled={!isSuperAdmin}
                            size="small"
                            sx={{
                              bgcolor: "white",
                              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E2E8F0" },
                              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#CBD5E0" },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2196F3" },
                            }}
                          >
                            {Array.isArray(categories) && categories.length > 0 ? (
                              categories.map((cat) => (
                                <MenuItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </MenuItem>
                              ))
                            ) : (
                              <MenuItem disabled>No categories available</MenuItem>
                            )}
                          </Field>
                          {!isSuperAdmin && (
                            <Typography variant="caption" sx={{ color: "#666", mt: 0.5, display: "block" }}>
                              Only SuperAdmin can change category
                            </Typography>
                          )}
                        </FormControl>
                      </Grid>

                      <Grid item xs={12}>
                        <Field name="description">
                          {({ field, form }) => (
                            <RichTextEditor
                              value={field.value || ""}
                              onChange={(content) => {
                                form.setFieldValue("description", content);
                                form.setFieldTouched("description", true);
                              }}
                              error={touched.description && !!errors.description}
                              helperText={touched.description && errors.description}
                              label="Description *"
                            />
                          )}
                        </Field>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={touched.status && !!errors.status} size="small">
                          <InputLabel size="small">Status</InputLabel>
                          <Field
                            as={Select}
                            name="status"
                            label="Status"
                            value={values.status}
                            size="small"
                            sx={{
                              bgcolor: "white",
                              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E2E8F0" },
                              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#CBD5E0" },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2196F3" },
                            }}
                          >
                            <MenuItem value={1}>Open</MenuItem>
                            <MenuItem value={2}>In Progress</MenuItem>
                            <MenuItem value={3}>Resolved</MenuItem>
                            <MenuItem value={4}>Closed</MenuItem>
                            <MenuItem value={5}>On Hold</MenuItem>
                          </Field>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={touched.priority && !!errors.priority} size="small">
                          <InputLabel size="small">Priority</InputLabel>
                          <Field name="priority">
                            {({ field, form }) => (
                              <Select
                                {...field}
                                label="Priority"
                                size="small"
                                sx={{
                                  bgcolor: "white",
                                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E2E8F0" },
                                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#CBD5E0" },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2196F3" },
                                }}
                                onChange={(e) => {
                                  const newPriority = e.target.value;
                                  form.setFieldValue("priority", newPriority);
                                  
                                  // Check if the selected priority is Critical
                                  const isCritical = (() => {
                                    if (Array.isArray(prioritySettings) && prioritySettings.length > 0) {
                                      const selectedPrioritySetting = prioritySettings.find(
                                        (p) => p.priority === newPriority
                                      );
                                      if (selectedPrioritySetting) {
                                        const displayName = (selectedPrioritySetting.displayName || "").toLowerCase();
                                        return displayName.includes("critical");
                                      }
                                    }
                                    // Fallback: check if value is 4 (Critical)
                                    return newPriority === 4;
                                  })();
                                  
                                  // If Critical, set Start Date to today
                                  if (isCritical) {
                                    const today = new Date().toISOString().split("T")[0];
                                    form.setFieldValue("startDate", today);
                                  }
                                }}
                              >
                                {Array.isArray(prioritySettings) && prioritySettings.length > 0
                                  ? prioritySettings.map((priority) => (
                                      <MenuItem key={priority.priority} value={priority.priority}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                          <Box
                                            sx={{
                                              width: 12,
                                              height: 12,
                                              borderRadius: "50%",
                                              bgcolor: priority.colorHex || "#2563EB",
                                            }}
                                          />
                                          {priority.displayName || priority.priority}
                                        </Box>
                                      </MenuItem>
                                    ))
                                  : [
                                      <MenuItem key="low" value={1}>Low</MenuItem>,
                                      <MenuItem key="medium" value={2}>Medium</MenuItem>,
                                      <MenuItem key="high" value={3}>High</MenuItem>,
                                      <MenuItem key="critical" value={4}>Critical</MenuItem>,
                                    ]}
                              </Select>
                            )}
                          </Field>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          name="startDate"
                          label="Start Date"
                          type="date"
                          InputLabelProps={{ shrink: true }}
                          value={values.startDate}
                          size="small"
                          disabled={(() => {
                            // Check if current priority is Critical
                            if (Array.isArray(prioritySettings) && prioritySettings.length > 0) {
                              const selectedPrioritySetting = prioritySettings.find(
                                (p) => p.priority === values.priority
                              );
                              if (selectedPrioritySetting) {
                                const displayName = (selectedPrioritySetting.displayName || "").toLowerCase();
                                return displayName.includes("critical");
                              }
                            }
                            // Fallback: check if value is 4 (Critical)
                            return values.priority === 4;
                          })()}
                          onChange={(e) => {
                            // Only allow change if priority is not Critical
                            const isCritical = (() => {
                              if (Array.isArray(prioritySettings) && prioritySettings.length > 0) {
                                const selectedPrioritySetting = prioritySettings.find(
                                  (p) => p.priority === values.priority
                                );
                                if (selectedPrioritySetting) {
                                  const displayName = (selectedPrioritySetting.displayName || "").toLowerCase();
                                  return displayName.includes("critical");
                                }
                              }
                              return values.priority === 4;
                            })();
                            if (!isCritical) {
                              setFieldValue("startDate", e.target.value);
                            }
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: "white",
                              "& fieldset": { borderColor: "#E2E8F0" },
                              "&:hover fieldset": { borderColor: "#CBD5E0" },
                              "&.Mui-focused fieldset": { borderColor: "#2196F3" },
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          name="startTime"
                          label="Start Time"
                          type="time"
                          InputLabelProps={{ shrink: true }}
                          value={values.startTime}
                          size="small"
                          onChange={(e) => setFieldValue("startTime", e.target.value)}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: "white",
                              "& fieldset": { borderColor: "#E2E8F0" },
                              "&:hover fieldset": { borderColor: "#CBD5E0" },
                              "&.Mui-focused fieldset": { borderColor: "#2196F3" },
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          name="dueDate"
                          label="Due Date"
                          type="date"
                          InputLabelProps={{ shrink: true }}
                          value={values.dueDate}
                          size="small"
                          onChange={(e) => setFieldValue("dueDate", e.target.value)}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: "white",
                              "& fieldset": { borderColor: "#E2E8F0" },
                              "&:hover fieldset": { borderColor: "#CBD5E0" },
                              "&.Mui-focused fieldset": { borderColor: "#2196F3" },
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          name="dueTime"
                          label="Due Time"
                          type="time"
                          InputLabelProps={{ shrink: true }}
                          value={values.dueTime}
                          size="small"
                          onChange={(e) => setFieldValue("dueTime", e.target.value)}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: "white",
                              "& fieldset": { borderColor: "#E2E8F0" },
                              "&:hover fieldset": { borderColor: "#CBD5E0" },
                              "&.Mui-focused fieldset": { borderColor: "#2196F3" },
                            },
                          }}
                        />
                      </Grid>

                      {/* Category moved above, removed here */}

                      {/* Resolution Notes and Customer Feedback - Always visible */}
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          multiline
                          rows={3}
                          name="resolutionNotes"
                          label="Resolution Notes"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: "white",
                              "& fieldset": { borderColor: "#E2E8F0" },
                              "&:hover fieldset": { borderColor: "#CBD5E0" },
                              "&.Mui-focused fieldset": { borderColor: "#2196F3" },
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Customer Feedback Rating</InputLabel>
                          <Select
                            value={values.feedbackRating ?? ""}
                            label="Customer Feedback Rating"
                            onChange={(e) =>
                              setFieldValue("feedbackRating", e.target.value ? Number(e.target.value) : null)
                            }
                            sx={{
                              bgcolor: "white",
                              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E2E8F0" },
                              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#CBD5E0" },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2196F3" },
                            }}
                          >
                            <MenuItem value="">Not Provided</MenuItem>
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <MenuItem key={rating} value={rating}>
                                {rating} Star{rating > 1 ? "s" : ""}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          multiline
                          minRows={3}
                          name="feedbackComment"
                          label="Customer Feedback Comment"
                          value={values.feedbackComment}
                          onChange={(e) => setFieldValue("feedbackComment", e.target.value)}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: "white",
                              "& fieldset": { borderColor: "#E2E8F0" },
                              "&:hover fieldset": { borderColor: "#CBD5E0" },
                              "&.Mui-focused fieldset": { borderColor: "#2196F3" },
                            },
                          }}
                        />
                      </Grid>

                      {/* Checklist Section */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: "#1A202C" }}>
                          Checklist
                        </Typography>
                        <TicketChecklist
                          ticketId={item?.id}
                          checklist={checklist}
                          onChecklistChange={(updatedChecklist) => {
                            setChecklist(updatedChecklist);
                            // Refresh ticket list to update checklist percentage
                            if (item?.id) {
                              fetchItems(currentPage, currentSearch, currentPageSize);
                            }
                          }}
                          readOnly={!update}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                          <Button 
                            onClick={handleClose} 
                            variant="outlined"
                            sx={{
                              color: "#666",
                              borderColor: "#E2E8F0",
                              "&:hover": { borderColor: "#CBD5E0", bgcolor: "#F7FAFC" },
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            variant="contained" 
                            disabled={isSubmitting}
                            sx={{
                              bgcolor: "#2196F3",
                              "&:hover": { bgcolor: "#1976D2" },
                            }}
                          >
                            {isSubmitting ? "Updating..." : "Update Ticket"}
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                    </Box>

                    {/* Right Panel - Comments */}
                    <Box
                      sx={{
                        width: { xs: "100%", md: "400px" },
                        minHeight: 0,
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: "#F7FAFC",
                        maxHeight: { xs: "50vh", md: "none" },
                      }}
                    >
                    <Box sx={{ p: { xs: 2, sm: 3 }, pb: 1, flexShrink: 0 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h6" sx={{ color: "#1A202C" }}>
                          Comments and activity
                        </Typography>
                      </Box>

                      {/* Add Comment Form */}
                    <Formik
                      initialValues={{ comment: "", isInternal: false }}
                      validationSchema={commentValidationSchema}
                      onSubmit={async (values, formikHelpers) => {
                        console.log("=== FORM SUBMISSION TRIGGERED ===");
                        console.log("Form values:", values);
                        console.log("Formik helpers:", formikHelpers);
                        try {
                          console.log("Calling handleAddComment...");
                          await handleAddComment(values, formikHelpers);
                          console.log("handleAddComment completed");
                        } catch (error) {
                          console.error("=== UNEXPECTED ERROR IN FORM SUBMISSION ===");
                          console.error("Error:", error);
                          console.error("Error stack:", error.stack);
                          toast.error("An unexpected error occurred. Please try again.");
                          formikHelpers.setSubmitting(false);
                        }
                      }}
                    >
                      {({ values: commentValues, errors: commentErrors, touched: commentTouched, setFieldValue: setCommentFieldValue, isSubmitting: isCommentSubmitting, handleSubmit }) => (
                        <Box>
                          <TextField
                            fullWidth
                            multiline
                            minRows={4}
                            maxRows={10}
                            name="comment"
                            placeholder="Write a comment... (Press Enter for new line)"
                            value={commentValues.comment}
                            onChange={(e) => setCommentFieldValue("comment", e.target.value)}
                            error={commentTouched.comment && !!commentErrors.comment}
                            helperText={commentTouched.comment && commentErrors.comment}
                            sx={{
                              mb: 2,
                              "& .MuiOutlinedInput-root": {
                                bgcolor: "white",
                                "& fieldset": {
                                  borderColor: "#E2E8F0",
                                },
                                "&:hover fieldset": {
                                  borderColor: "#CBD5E0",
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: "#2196F3",
                                },
                              },
                            }}
                          />
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            {!isHelpDeskCustomer && (
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <input
                                  type="checkbox"
                                  checked={commentValues.isInternal || false}
                                  onChange={(e) => setCommentFieldValue("isInternal", e.target.checked)}
                                  style={{ marginRight: 8 }}
                                />
                                <Typography sx={{ color: "#666", fontSize: "0.875rem" }}>
                                  Internal Note
                                </Typography>
                              </Box>
                            )}
                            {isHelpDeskCustomer && <Box />}
                            <Button
                              type="button"
                              variant="contained"
                              disabled={isCommentSubmitting || !commentValues.comment.trim()}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("=== ADD COMMENT BUTTON CLICKED ===");
                                console.log("Button disabled:", isCommentSubmitting || !commentValues.comment.trim());
                                console.log("Comment value:", commentValues.comment);
                                console.log("Is submitting:", isCommentSubmitting);
                                // Manually trigger Formik's handleSubmit
                                handleSubmit(e);
                              }}
                              sx={{
                                bgcolor: "#2196F3",
                                "&:hover": { bgcolor: "#1976D2" },
                                textTransform: "uppercase",
                                fontWeight: 600,
                              }}
                            >
                              {isCommentSubmitting ? "Adding..." : "ADD COMMENT"}
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Formik>
                    </Box>

                    {/* Comments List - Scrollable */}
                    <Box
                      sx={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        overflowX: "hidden",
                        px: { xs: 2, sm: 3 },
                        pt: 1,
                        pb: 3,
                        "&::-webkit-scrollbar": {
                          width: "8px",
                        },
                        "&::-webkit-scrollbar-track": {
                          background: "#f1f1f1",
                          borderRadius: "4px",
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: "#888",
                          borderRadius: "4px",
                          "&:hover": {
                            background: "#555",
                          },
                        },
                      }}
                    >
                      {comments.length === 0 ? (
                        <Typography sx={{ color: "#999", fontSize: "0.875rem" }}>
                          No comments yet
                        </Typography>
                      ) : (
                        comments.map((comment) => {
                          const editable = isCommentEditable(comment);
                          const remainingTime = getRemainingTime(comment);
                          const isEditing = editingCommentId === comment.id;

                          return (
                            <Box key={comment.id} sx={{ mb: 2, p: { xs: 1.5, sm: 2 }, bgcolor: "white", borderRadius: 1, border: "1px solid #E2E8F0" }}>
                              <Box sx={{ display: "flex", gap: 1, mb: 1, justifyContent: "space-between", alignItems: "flex-start", flexWrap: { xs: "wrap", sm: "nowrap" } }}>
                                <Box sx={{ display: "flex", gap: 1, flex: 1, minWidth: 0 }}>
                                  <Avatar
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      bgcolor: "#2196F3",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    {comment.user?.firstName?.[0] || comment.user?.email?.[0] || "U"}
                                  </Avatar>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ color: "#1A202C", fontSize: "0.875rem", fontWeight: 500 }}>
                                      {comment.user?.firstName && comment.user?.lastName
                                        ? `${comment.user.firstName} ${comment.user.lastName}`
                                        : comment.user?.email || comment.user?.userName || "Unknown User"}
                                    </Typography>
                                    <Typography sx={{ color: "#718096", fontSize: "0.75rem" }}>
                                      {formatDate(comment.createdOn)}
                                      {comment.isInternal && (
                                        <Chip
                                          label="Internal"
                                          size="small"
                                          sx={{ ml: 1, height: 18, fontSize: "0.65rem", bgcolor: "#EDF2F7", color: "#4A5568" }}
                                        />
                                      )}
                                    </Typography>
                                  </Box>
                                </Box>
                                {editable && !isEditing && (
                                  <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                                    <Tooltip title="Edit comment">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleEditComment(comment)}
                                        sx={{ color: "#2196F3" }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete comment">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteComment(comment.id)}
                                        sx={{ color: "#F44336" }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                )}
                              </Box>
                              
                              {editable && !isEditing && (
                                <Box sx={{ mb: 1, p: 1, bgcolor: "#FFF3CD", borderRadius: 1, border: "1px solid #FFC107" }}>
                                  <Typography sx={{ color: "#856404", fontSize: "0.75rem", fontWeight: 500 }}>
                                    ⚠️ You have {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')} to edit or delete this comment
                                  </Typography>
                                </Box>
                              )}

                              {isEditing ? (
                                <Box sx={{ ml: 5 }}>
                                  <TextField
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    maxRows={10}
                                    value={editingCommentText}
                                    onChange={(e) => setEditingCommentText(e.target.value)}
                                    sx={{ mb: 1 }}
                                  />
                                  <Box sx={{ display: "flex", gap: 1 }}>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      startIcon={<SaveIcon />}
                                      onClick={() => handleSaveComment(comment.id)}
                                      sx={{ bgcolor: "#4CAF50", "&:hover": { bgcolor: "#45a049" } }}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<CancelIcon />}
                                      onClick={handleCancelEdit}
                                    >
                                      Cancel
                                    </Button>
                                  </Box>
                                </Box>
                              ) : (
                                <Typography 
                                  sx={{ 
                                    color: "#2D3748", 
                                    fontSize: "0.875rem", 
                                    ml: 5,
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    lineHeight: 1.6,
                                  }}
                                >
                                  {comment.comment}
                                </Typography>
                              )}
                            </Box>
                          );
                        })
                      )}
                    </Box>
                    </Box>
                  </Box>
                </Form>
              )}
            </Formik>
          ) : (
            <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2, sm: 3 }, bgcolor: "white" }}>
              <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A202C" }}>
                    Clock In / Clock Out
                  </Typography>

                  {clockError ? <Alert severity="error">{clockError}</Alert> : null}

                  <Box sx={{ p: 2, border: "1px solid #E2E8F0", borderRadius: 2, bgcolor: "#F8FAFC" }}>
                    <Typography variant="subtitle2" sx={{ color: "#64748B", mb: 1 }}>
                      Live Location
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#0F172A" }}>
                      {geoStatus || "—"}
                    </Typography>
                    {geoPlaceName ? (
                      <Typography variant="caption" sx={{ color: "#475569", display: "block", mt: 0.5 }}>
                        {geoPlaceName}
                      </Typography>
                    ) : geo ? (
                      <Typography variant="caption" sx={{ color: "#475569", display: "block", mt: 0.5 }}>
                        Lat: {geo.lat}, Lng: {geo.lng} (±{Math.round(geo.accuracy || 0)}m)
                      </Typography>
                    ) : null}
                  </Box>

                  <Box sx={{ p: 2, border: "1px solid #E2E8F0", borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: "#64748B", mb: 1 }}>
                      Live Photo
                    </Typography>

                    {cameraError ? <Alert severity="warning" sx={{ mb: 1 }}>{cameraError}</Alert> : null}

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1 }}>
                      <Button variant="outlined" onClick={startCamera}>
                        Start Camera
                      </Button>
                      <Button variant="contained" onClick={takePhoto} disabled={!cameraStream}>
                        Take Photo
                      </Button>
                      <Button variant="text" color="inherit" onClick={stopCamera} disabled={!cameraStream}>
                        Stop
                      </Button>
                      <Button variant="outlined" component="label">
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          hidden
                          ref={fileInputRef}
                          onChange={(e) => onPhotoPicked(e.target.files?.[0])}
                        />
                      </Button>
                      <Button
                        variant="text"
                        color="error"
                        onClick={clearSelectedPhoto}
                        disabled={!photoFile && !photoPreviewUrl}
                      >
                        Remove Photo
                      </Button>
                    </Stack>

                    <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
                      <Box sx={{ flex: 1 }}>
                        <video
                          ref={videoRef}
                          style={{ width: "100%", borderRadius: 8, background: "#0B1220" }}
                          playsInline
                          muted
                        />
                        <canvas ref={canvasRef} style={{ display: "none" }} />
                      </Box>
                      <Box sx={{ width: { xs: "100%", md: 280 } }}>
                        <Typography variant="caption" sx={{ color: "#64748B" }}>
                          Preview
                        </Typography>
                        <Box
                          sx={{
                            mt: 0.5,
                            width: "100%",
                            height: 200,
                            borderRadius: 2,
                            border: "1px dashed #CBD5E1",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "#F1F5F9",
                          }}
                        >
                          {photoPreviewUrl ? (
                            <img
                              src={photoPreviewUrl}
                              alt="Clock photo preview"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <Typography variant="body2" sx={{ color: "#64748B" }}>
                              No photo selected
                            </Typography>
                          )}
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={clearSelectedPhoto}
                            disabled={!photoFile && !photoPreviewUrl}
                            fullWidth
                          >
                            Delete photo
                          </Button>
                        </Stack>
                      </Box>
                    </Box>
                  </Box>

                  {getActiveClockEntry ? (
                    <Box sx={{ p: 2, border: "1px solid #E2E8F0", borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: "#0F172A" }}>
                        You are currently clocked in (since{" "}
                        {formatDate(getActiveClockEntry.clockInAt ?? getActiveClockEntry.ClockInAt)})
                      </Typography>
                      <TextField
                        label="Clock Out Time"
                        type="datetime-local"
                        value={clockOutAt}
                        onChange={(e) => setClockOutAt(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ maxWidth: 320, mb: 2 }}
                      />
                      <Box>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={submitClockOut}
                          disabled={clockLoading || !photoFile}
                        >
                          {clockLoading ? "Clocking out..." : "Clock Out"}
                        </Button>
                      </Box>
                      {!photoFile ? (
                        <Typography variant="caption" sx={{ color: "#B91C1C", display: "block", mt: 1 }}>
                          Photo is required to clock out.
                        </Typography>
                      ) : null}
                    </Box>
                  ) : (
                    <Box sx={{ p: 2, border: "1px solid #E2E8F0", borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: "#0F172A" }}>
                        Clock In
                      </Typography>
                      <TextField
                        label="Clock In Time"
                        type="datetime-local"
                        value={clockInAt}
                        onChange={(e) => setClockInAt(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ maxWidth: 320, mb: 2 }}
                      />
                      <Box>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={submitClockIn}
                          disabled={clockLoading || !photoFile}
                        >
                          {clockLoading ? "Clocking in..." : "Clock In"}
                        </Button>
                      </Box>
                      <Typography variant="caption" sx={{ color: "#64748B", display: "block", mt: 1 }}>
                        Note: Photo is required. Location is captured if you allow it in the browser.
                      </Typography>
                    </Box>
                  )}

                  <Divider />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Clock History
                    </Typography>
                    <Button variant="outlined" onClick={loadClockEntries} disabled={clockLoading}>
                      Refresh
                    </Button>
                  </Box>

                  {clockLoading ? (
                    <Typography variant="body2" color="text.secondary">
                      Loading...
                    </Typography>
                  ) : (clockEntries?.length ?? 0) === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No clock entries yet.
                    </Typography>
                  ) : (
                    <Box sx={{ display: "grid", gap: 1 }}>
                      {(clockEntries ?? []).map((e) => (
                        <Box
                          key={e.id ?? e.Id}
                          sx={{
                            p: 1.5,
                            border: "1px solid #E2E8F0",
                            borderRadius: 2,
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 2,
                            flexWrap: "wrap",
                            cursor: "pointer",
                            "&:hover": { bgcolor: "#F8FAFC" },
                          }}
                          role="button"
                          tabIndex={0}
                          onClick={() => openClockEntryDetails(e)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openClockEntryDetails(e);
                            }
                          }}
                        >
                          <Box sx={{ minWidth: 260 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {(e.userName ?? e.UserName) || "User"}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#334155" }}>
                              In: {formatDate(e.clockInAt ?? e.ClockInAt)}{" "}
                              {e.clockOutAt || e.ClockOutAt ? `• Out: ${formatDate(e.clockOutAt ?? e.ClockOutAt)}` : "• (active)"}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748B", display: "block", mt: 0.25 }}>
                              Click to view details
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                            {(e.clockInImageUrl ?? e.ClockInImageUrl) ? (
                              <a href={e.clockInImageUrl ?? e.ClockInImageUrl} target="_blank" rel="noreferrer">
                                <Chip label="Clock-in photo" size="small" />
                              </a>
                            ) : null}
                            {(e.clockOutImageUrl ?? e.ClockOutImageUrl) ? (
                              <a href={e.clockOutImageUrl ?? e.ClockOutImageUrl} target="_blank" rel="noreferrer">
                                <Chip label="Clock-out photo" size="small" />
                              </a>
                            ) : null}
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={(ev) => {
                                ev.preventDefault();
                                ev.stopPropagation();
                                openClockEntryDetails(e);
                              }}
                            >
                              Details
                            </Button>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Stack>
            </Box>
          )}
        </Box>
      </Modal>

      <Dialog open={clockDetailsOpen} onClose={closeClockEntryDetails} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Clocking Details</DialogTitle>
        <DialogContent dividers>
          {selectedClockEntry ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  User
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {(selectedClockEntry.userName ?? selectedClockEntry.UserName) || "—"}
                </Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Box sx={{ p: 2, border: "1px solid #E2E8F0", borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#0F172A", fontWeight: 700 }}>
                    Clock In
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#334155", mt: 0.5 }}>
                    Time: {formatDate(selectedClockEntry.clockInAt ?? selectedClockEntry.ClockInAt)}
                  </Typography>
                  {(() => {
                    const lat = selectedClockEntry.clockInLatitude ?? selectedClockEntry.ClockInLatitude;
                    const lng = selectedClockEntry.clockInLongitude ?? selectedClockEntry.ClockInLongitude;
                    const acc = selectedClockEntry.clockInAccuracyMeters ?? selectedClockEntry.ClockInAccuracyMeters;
                    const link = buildMapsLink(lat, lng);
                    if (lat == null || lng == null) return null;
                    return (
                      <Typography variant="body2" sx={{ color: "#334155", mt: 0.5 }}>
                        Location:{" "}
                        {clockInPlaceName
                          ? clockInPlaceName
                          : `${lat}, ${lng} ${acc != null ? `(±${Math.round(Number(acc))}m)` : ""}`}{" "}
                        {link ? (
                          <a href={link} target="_blank" rel="noreferrer" style={{ marginLeft: 8 }}>
                            View on map
                          </a>
                        ) : null}
                      </Typography>
                    );
                  })()}
                </Box>

                <Box sx={{ p: 2, border: "1px solid #E2E8F0", borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#0F172A", fontWeight: 700 }}>
                    Clock Out
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#334155", mt: 0.5 }}>
                    Time:{" "}
                    {selectedClockEntry.clockOutAt || selectedClockEntry.ClockOutAt
                      ? formatDate(selectedClockEntry.clockOutAt ?? selectedClockEntry.ClockOutAt)
                      : "—"}
                  </Typography>
                  {(() => {
                    const lat = selectedClockEntry.clockOutLatitude ?? selectedClockEntry.ClockOutLatitude;
                    const lng = selectedClockEntry.clockOutLongitude ?? selectedClockEntry.ClockOutLongitude;
                    const acc = selectedClockEntry.clockOutAccuracyMeters ?? selectedClockEntry.ClockOutAccuracyMeters;
                    const link = buildMapsLink(lat, lng);
                    if (lat == null || lng == null) return null;
                    return (
                      <Typography variant="body2" sx={{ color: "#334155", mt: 0.5 }}>
                        Location:{" "}
                        {clockOutPlaceName
                          ? clockOutPlaceName
                          : `${lat}, ${lng} ${acc != null ? `(±${Math.round(Number(acc))}m)` : ""}`}{" "}
                        {link ? (
                          <a href={link} target="_blank" rel="noreferrer" style={{ marginLeft: 8 }}>
                            View on map
                          </a>
                        ) : null}
                      </Typography>
                    );
                  })()}
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Box sx={{ p: 2, border: "1px solid #E2E8F0", borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#0F172A", fontWeight: 700, mb: 1 }}>
                    Clock-in Photo
                  </Typography>
                  {(selectedClockEntry.clockInImageUrl ?? selectedClockEntry.ClockInImageUrl) ? (
                    <a
                      href={selectedClockEntry.clockInImageUrl ?? selectedClockEntry.ClockInImageUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={selectedClockEntry.clockInImageUrl ?? selectedClockEntry.ClockInImageUrl}
                        alt="Clock-in"
                        style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 8 }}
                      />
                    </a>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </Box>

                <Box sx={{ p: 2, border: "1px solid #E2E8F0", borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "#0F172A", fontWeight: 700, mb: 1 }}>
                    Clock-out Photo
                  </Typography>
                  {(selectedClockEntry.clockOutImageUrl ?? selectedClockEntry.ClockOutImageUrl) ? (
                    <a
                      href={selectedClockEntry.clockOutImageUrl ?? selectedClockEntry.ClockOutImageUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={selectedClockEntry.clockOutImageUrl ?? selectedClockEntry.ClockOutImageUrl}
                        alt="Clock-out"
                        style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 8 }}
                      />
                    </a>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider />

              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A" }}>
                    Ticket Logs
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748B" }}>
                    Latest comments/activity
                  </Typography>
                </Box>

                {update ? (
                  <Box sx={{ mb: 1.5 }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      maxRows={5}
                      value={logText}
                      onChange={(e) => setLogText(e.target.value)}
                      placeholder="Add a log..."
                      sx={{ bgcolor: "white" }}
                    />
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                      <Button
                        variant="contained"
                        onClick={addTicketLog}
                        disabled={logSubmitting || !logText.trim()}
                        sx={{ bgcolor: "#2196F3", "&:hover": { bgcolor: "#1976D2" } }}
                      >
                        {logSubmitting ? "Adding..." : "Add Log"}
                      </Button>
                    </Box>
                    <Typography variant="caption" sx={{ color: "#64748B", display: "block", mt: 0.5 }}>
                      Logs are saved as internal ticket notes.
                    </Typography>
                  </Box>
                ) : null}

                {(comments?.length ?? 0) === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No logs found.
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      border: "1px solid #E2E8F0",
                      borderRadius: 2,
                      bgcolor: "#F8FAFC",
                      maxHeight: 260,
                      overflowY: "auto",
                      p: 1,
                    }}
                  >
                    {comments.map((c) => (
                      <Box
                        key={c.id ?? c.Id ?? `${c.createdOn ?? c.CreatedOn}-${c.comment ?? c.Comment}`}
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          bgcolor: "white",
                          border: "1px solid #E2E8F0",
                          mb: 1,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              bgcolor: "#2196F3",
                              fontSize: "0.8rem",
                            }}
                          >
                            {c.user?.firstName?.[0] || c.user?.email?.[0] || "U"}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A" }}>
                                {c.user?.firstName && c.user?.lastName
                                  ? `${c.user.firstName} ${c.user.lastName}`
                                  : c.user?.email || c.user?.userName || "User"}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#64748B" }}>
                                {formatDate(c.createdOn ?? c.CreatedOn)}
                              </Typography>
                              {(c.isInternal ?? c.IsInternal) ? (
                                <Chip label="Internal" size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
                              ) : null}
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#334155",
                                mt: 0.5,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {c.comment ?? c.Comment ?? ""}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeClockEntryDetails} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}


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
  Paper,
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
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LocationOffIcon from "@mui/icons-material/LocationOff";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import RefreshIcon from "@mui/icons-material/Refresh";
import HistoryIcon from "@mui/icons-material/History";
import CameraswitchIcon from "@mui/icons-material/Cameraswitch";
import FlipCameraIosIcon from "@mui/icons-material/FlipCameraIos";
import useApi from "@/components/utils/useApi";
import RichTextEditor from "@/components/help-desk/RichTextEditor";
import TicketChecklist from "@/components/help-desk/TicketChecklist";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { formatDate } from "@/components/utils/formatHelper";
import AddCustomerDialog from "@/pages/master/customers/create";
import CreateHelpDeskProjectModal from "@/pages/help-desk/projects/create";

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
  const editFormikRef = React.useRef(null);

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
  const isSuperAdminByType = userTypeNum === 0 || userTypeNum === 1; // SuperAdmin = 0, Admin = 1
  const isHelpDeskSupportUser = userTypeNum === 14; // HelpDeskSupport = 14
  const canAssignTicket = isAdmin || isHelpDeskSupportUser;

  // State for Assign To
  const [helpDeskUsers, setHelpDeskUsers] = useState([]);
  const [loadingHelpDeskUsers, setLoadingHelpDeskUsers] = useState(false);
  const [customAssigneeNames, setCustomAssigneeNames] = useState([]); // Store custom names entered by user

  // State for Customers dropdown
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [createCustomerModalOpen, setCreateCustomerModalOpen] = useState(false);
  const [customerAutocompleteOpen, setCustomerAutocompleteOpen] = useState(false);
  
  // State for Create Project Modal
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [projectAutocompleteOpen, setProjectAutocompleteOpen] = useState(false);

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

  // Fetch customers for dropdown
  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/Customer/GetAllCustomer`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        const customerList = Array.isArray(data) ? data : Array.isArray(data?.result) ? data.result : [];
        setCustomers(customerList);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Refresh projects list function
  const refreshProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/GetProjectsForAssign`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        const projectList = Array.isArray(data?.result) ? data.result : (Array.isArray(data) ? data : []);
        setProjectsData({ result: projectList });
        return projectList;
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
    return [];
  };

  // Load customers when modal opens
  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open]);

  // Get customer display name
  const getCustomerDisplayName = (customer) => {
    if (!customer) return "";
    const firstName = customer.firstName || customer.FirstName || "";
    const lastName = customer.lastName || customer.LastName || "";
    const company = customer.company || customer.Company || "";
    const name = `${firstName} ${lastName}`.trim();
    return company ? `${name} (${company})` : name;
  };

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
        
        // Try ProjectManagementModule endpoint
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
            console.log("EditTicket: Found project in ProjectManagement API");
          }
        }

        if (!project) {
          // Fallback: try old master projects API
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
          }
        }

        if (project) {
          const projectId = project.Id || project.id || project.projectId || ticketProjectId;
          const customerId = project.CustomerId || project.customerId;
          const normalizedProject = {
            ...project,
            id: toNumericId(projectId),
            name: project.Name || project.name || "",
            code: project.Code || project.code || "",
            customerIdNormalized: toNumericId(customerId),
            customerNameNormalized: deriveCustomerName(project),
          };
          setTicketProject(normalizedProject);
          console.log("EditTicket: Fetched and set ticket project:", normalizedProject);
        } else {
          console.warn("EditTicket: Project not found");
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
        const response = await fetch(`${BASE_URL}/HelpDesk/GetProjectsForAssign`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          const projectList = Array.isArray(data?.result) ? data.result : (Array.isArray(data) ? data : []);
          setProjectsData({ result: projectList });
          console.log("Fetched project management projects for edit:", projectList);
        } else {
          console.error("Failed to fetch project management projects:", response.status);
          setProjectsData({ result: [] });
        }
      } catch (error) {
        console.error("Error fetching project management projects:", error);
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
      project.ClientName,
      project.clientName,
      project.CustomerName,
      project.customerName,
      project.customer?.displayName,
      project.customer?.DisplayName,
      project.customer?.name,
      project.customer?.Name,
      project.customer?.customerName,
      project.customer?.CustomerName,
      project.customer?.company,
      project.customer?.Company,
      project.Customer?.displayName,
      project.Customer?.DisplayName,
      project.Customer?.name,
      project.Customer?.Name,
      project.Customer?.customerName,
      project.Customer?.CustomerName,
      project.Customer?.company,
      project.Customer?.Company,
      project.customerDetails?.displayName,
      project.customerDetails?.name,
      project.customerInfo?.displayName,
      project.customerInfo?.name,
    ];

    const fromParts = [
      [project.customer?.firstName, project.customer?.lastName],
      [project.customer?.FirstName, project.customer?.LastName],
      [project.Customer?.firstName, project.Customer?.lastName],
      [project.Customer?.FirstName, project.Customer?.LastName],
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
    // Master projects come from normalizeProjectSource
    const sourceProjects = normalizeProjectSource;
    
    console.log("EditTicket: Normalizing projects", {
      sourceProjectsCount: sourceProjects?.length || 0,
      ticketProject: ticketProject ? { id: ticketProject.id, name: ticketProject.name } : null,
    });

    if (!sourceProjects || sourceProjects.length === 0) {
      console.log("EditTicket: No master projects available in edit form");
      // If no projects but we have a ticketProject, return it
      if (ticketProject) {
        console.log("EditTicket: Only ticketProject available, returning it");
        return [{
          ...ticketProject,
          id: toNumericId(ticketProject.id),
          customerIdNormalized: ticketProject.customerId || ticketProject.CustomerId,
          customerNameNormalized: deriveCustomerName(ticketProject),
        }];
      }
      return [];
    }

    const projects = sourceProjects.map((project) => {
      // Master projects use 'Id' (capital I) or 'id'
      const projectId = project.Id || project.id || project.projectId;
      
      // Master projects use 'CustomerId' (capital C) or 'customerId'
      const customerIdCandidates = [
        project.CustomerId,
        project.customerId,
        project.assignedToCustomerId,
        project.AssignedToCustomerId,
        project.customer?.Id,
        project.customer?.id,
        project.customer?.customerId,
        project.customer?.CustomerId,
        project.Customer?.Id,
        project.Customer?.id,
        project.Customer?.customerId,
        project.Customer?.CustomerId,
      ];

      const customerId =
        customerIdCandidates
          .map((candidate) => toNumericId(candidate))
          .find((candidate) => candidate !== null && candidate !== undefined) ?? null;

      return {
        ...project,
        id: toNumericId(projectId), // Ensure id is numeric
        name: project.Name || project.name || "",
        code: project.Code || project.code || "",
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

  // Filter projects by selected customer
  const filteredProjectsByCustomer = React.useMemo(() => {
    return (customerId) => {
      if (!customerId) {
        // If no customer selected, return all projects
        return normalizedProjects;
      }
      // Normalize the customer ID for comparison
      const normalizedCustomerId = toNumericId(customerId);
      if (!normalizedCustomerId) {
        return normalizedProjects;
      }
      
      return normalizedProjects.filter((project) => {
        const projectCustomerId = project.customerIdNormalized;
        // Compare normalized IDs
        return projectCustomerId !== null && projectCustomerId === normalizedCustomerId;
      });
    };
  }, [normalizedProjects]);

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
              innerRef={editFormikRef}
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
                      gap: { xs: 0, md: 3 },
                      px: { xs: 0, md: 2 },
                      py: { xs: 0, md: 1 },
                    }}
                  >
                    {/* Left Panel - Form Fields */}
                    <Box
                      sx={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        p: { xs: 2, sm: 4 },
                        m: { xs: 0, md: "0 0 0 10px" },
                        bgcolor: "white",
                        borderRadius: { xs: 0, md: 1 },
                        borderRight: { xs: "none", md: "1px solid #E2E8F0" },
                        borderBottom: { xs: "1px solid #E2E8F0", md: "none" },
                        maxHeight: { xs: "50vh", md: "none" },
                      }}
                    >
                    <Grid container spacing={2}>
                      {/* Customer Name and Project fields at the top */}
                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          id="customer-autocomplete-edit"
                          disabled={!isSuperAdminByType}
                          open={customerAutocompleteOpen}
                          onOpen={() => setCustomerAutocompleteOpen(true)}
                          onClose={() => setCustomerAutocompleteOpen(false)}
                          options={customers}
                          getOptionLabel={(option) => {
                            if (!option) return "";
                            if (option.isCreateOption) return "";
                            return getCustomerDisplayName(option);
                          }}
                          filterOptions={(options, params) => {
                            const { inputValue } = params;
                            
                            // If no search input, show only first 10 customers (without Create option - it will be fixed at bottom)
                            if (!inputValue || inputValue.trim() === "") {
                              return options.slice(0, 10);
                            }
                            
                            // If searching, filter through all customers
                            const filtered = filter(options, {
                              ...params,
                              getOptionLabel: (option) => getCustomerDisplayName(option),
                            });

                            return filtered;
                          }}
                          isOptionEqualToValue={(option, value) => {
                            if (!option || !value) return false;
                            if (option.isCreateOption || value.isCreateOption) return false;
                            const optionId = option.id || option.Id;
                            const valueId = value.id || value.Id || value;
                            return optionId === valueId;
                          }}
                          value={
                            values.customerId
                              ? customers.find((c) => (c.id || c.Id) === values.customerId) || 
                                { firstName: values.customerName, id: values.customerId }
                              : values.customerName
                                ? { firstName: values.customerName, id: null }
                                : null
                          }
                          loading={loadingCustomers}
                          onChange={(event, newValue) => {
                            if (newValue) {
                              const newCustomerId = newValue.id || newValue.Id || null;
                              const displayName = getCustomerDisplayName(newValue);
                              setFieldValue("customerName", displayName);
                              setFieldValue("customerId", newCustomerId);
                              
                              // Validate and clear project selection if it doesn't belong to the new customer
                              if (Array.isArray(values.projectIds) && values.projectIds.length > 0 && newCustomerId) {
                                const normalizedCustomerId = toNumericId(newCustomerId);
                                const currentProject = normalizedProjects.find(p => 
                                  values.projectIds.includes(p.id)
                                );
                                
                                // If current project doesn't belong to new customer, clear it
                                if (currentProject && normalizedCustomerId) {
                                  const projectCustomerId = currentProject.customerIdNormalized;
                                  if (projectCustomerId !== normalizedCustomerId) {
                                    setFieldValue("projectIds", []);
                                  }
                                } else {
                                  setFieldValue("projectIds", []);
                                }
                              } else {
                                setFieldValue("projectIds", []);
                              }
                            } else {
                              setFieldValue("customerName", "");
                              setFieldValue("customerId", null);
                              setFieldValue("projectIds", []);
                            }
                          }}
                          ListboxProps={{
                            sx: {
                              maxHeight: '300px',
                              overflowY: 'auto',
                              '&::-webkit-scrollbar': {
                                width: '8px',
                              },
                              '&::-webkit-scrollbar-track': {
                                background: '#f1f1f1',
                              },
                              '&::-webkit-scrollbar-thumb': {
                                background: '#888',
                                borderRadius: '4px',
                              },
                              '&::-webkit-scrollbar-thumb:hover': {
                                background: '#555',
                              },
                            },
                          }}
                          PaperComponent={isSuperAdminByType ? (props) => (
                            <Paper {...props} sx={{ ...props.sx, position: 'relative', overflow: 'hidden' }}>
                              {props.children}
                              <Divider />
                              <Box
                                sx={{
                                  p: 1.5,
                                  bgcolor: 'background.paper',
                                  borderTop: '1px solid',
                                  borderColor: 'divider',
                                  position: 'sticky',
                                  bottom: 0,
                                  zIndex: 1,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                  },
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setCustomerAutocompleteOpen(false);
                                  setTimeout(() => {
                                    setCreateCustomerModalOpen(true);
                                  }, 100);
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main", fontWeight: 500 }}>
                                  <AddIcon sx={{ fontSize: 18 }} />
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    Create Customer
                                  </Typography>
                                </Box>
                              </Box>
                            </Paper>
                          ) : undefined}
                          renderOption={(props, option) => {
                            const displayName = getCustomerDisplayName(option);
                            return (
                              <li {...props} key={option.id || option.Id}>
                                <Box sx={{ display: "flex", flexDirection: "column" }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {displayName || "Unnamed"}
                                  </Typography>
                                  {option.company && (
                                    <Typography variant="caption" color="text.secondary">
                                      {option.company}
                                    </Typography>
                                  )}
                                </Box>
                              </li>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Customer Name"
                              placeholder="Search customer..."
                              size="small"
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {loadingCustomers ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
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
                          )}
                          noOptionsText="No customers found"
                          loadingText="Loading customers..."
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          id="project-autocomplete-edit"
                          disabled={!isSuperAdminByType}
                          open={projectAutocompleteOpen}
                          onOpen={() => setProjectAutocompleteOpen(true)}
                          onClose={() => setProjectAutocompleteOpen(false)}
                          options={values.customerId ? filteredProjectsByCustomer(values.customerId) : normalizedProjects}
                          getOptionLabel={(option) => {
                            if (!option) return "";
                            if (option.isCreateOption) return "";
                            return `${option?.code || ""} - ${option?.name || ""}`.trim() || "";
                          }}
                          filterOptions={(options, params) => {
                            const { inputValue } = params;
                            
                            // If no search input, show only first 10 projects
                            if (!inputValue || inputValue.trim() === "") {
                              return options.slice(0, 10);
                            }
                            
                            // If searching, filter through all projects
                            const filtered = filter(options, {
                              ...params,
                              getOptionLabel: (option) => `${option?.code || ""} - ${option?.name || ""}`.trim() || "",
                            });
                            
                            return filtered;
                          }}
                          isOptionEqualToValue={(option, value) => {
                            if (!option || !value) return false;
                            if (option.isCreateOption || value.isCreateOption) return false;
                            return option?.id === value?.id;
                          }}
                          value={(() => {
                            // Use filtered projects if customer is selected, otherwise use all projects
                            const availableProjects = values.customerId 
                              ? filteredProjectsByCustomer(values.customerId) 
                              : normalizedProjects;
                            
                            console.log("EditTicket Autocomplete: Calculating value", {
                              valuesProjectIds: values.projectIds,
                              customerId: values.customerId,
                              itemProjectId: item?.projectId,
                              itemProjectEntityId: item?.projectEntity?.id,
                              itemProject: item?.project,
                              availableProjectsCount: availableProjects.length,
                              normalizedProjectsCount: normalizedProjects.length,
                            });

                            // First try to find from values.projectIds array
                            if (Array.isArray(values.projectIds) && values.projectIds.length > 0) {
                              for (const projectId of values.projectIds) {
                                const normalizedProjectId = toNumericId(projectId);
                                const found = availableProjects.find((project) => 
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
                              const found = availableProjects.find((project) => {
                                const projectIdNormalized = toNumericId(project.id);
                                return projectIdNormalized === ticketProjectId;
                              });
                              
                              if (found) {
                                console.log("EditTicket: Found project from item.projectId:", found);
                                return found;
                              }
                            }
                            
                            // Last resort: if projectId is null but Project name exists, try to find by name
                            if (!ticketProjectId && item?.project && availableProjects.length > 0) {
                              const foundByName = availableProjects.find(p => {
                                const nameMatch = p.name?.toLowerCase() === item.project?.toLowerCase();
                                const codeMatch = p.code?.toLowerCase() === item.project?.toLowerCase();
                                const codeNameMatch = `${p.code} - ${p.name}`.toLowerCase() === item.project?.toLowerCase();
                                return nameMatch || codeMatch || codeNameMatch;
                              });
                              if (foundByName) {
                                console.log("EditTicket: Found project by name:", foundByName);
                                return foundByName;
                              }
                            }
                            
                            return null;
                          })()}
                          onChange={(event, newValue) => {
                            if (newValue && newValue.isCreateOption) {
                              setProjectAutocompleteOpen(false);
                              setTimeout(() => {
                                setCreateProjectModalOpen(true);
                              }, 100);
                              return;
                            }
                            
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
                              placeholder={values.customerId ? "Select project for this customer" : "Select project"}
                              size="small"
                              disabled={!isSuperAdminByType}
                              error={touched.projectIds && !!errors.projectIds}
                              helperText={
                                touched.projectIds && errors.projectIds
                                  ? errors.projectIds
                                  : !isSuperAdminByType
                                    ? "Only SuperAdmin can change project"
                                    : values.customerId
                                      ? `Showing projects assigned to selected customer (${filteredProjectsByCustomer(values.customerId).length} available)`
                                      : "Select a customer first to filter projects"
                              }
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
                          noOptionsText={values.customerId ? "No projects found for the selected customer" : "No projects found"}
                          loadingText="Loading projects..."
                          key={`project-autocomplete-edit-${values.customerId || 'no-customer'}`}
                          ListboxProps={{
                            sx: {
                              maxHeight: '300px',
                              overflowY: 'auto',
                              '&::-webkit-scrollbar': {
                                width: '8px',
                              },
                              '&::-webkit-scrollbar-track': {
                                background: '#f1f1f1',
                              },
                              '&::-webkit-scrollbar-thumb': {
                                background: '#888',
                                borderRadius: '4px',
                              },
                              '&::-webkit-scrollbar-thumb:hover': {
                                background: '#555',
                              },
                            },
                          }}
                          PaperComponent={isSuperAdminByType ? (props) => (
                            <Paper {...props} sx={{ ...props.sx, position: 'relative', overflow: 'hidden' }}>
                              {props.children}
                              <Divider />
                              <Box
                                component="div"
                                role="button"
                                tabIndex={0}
                                sx={{
                                  p: 1.5,
                                  bgcolor: 'background.paper',
                                  borderTop: '1px solid',
                                  borderColor: 'divider',
                                  position: 'sticky',
                                  bottom: 0,
                                  zIndex: 10,
                                  cursor: 'pointer',
                                  pointerEvents: 'auto',
                                  userSelect: 'none',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                  },
                                  '&:active': {
                                    bgcolor: 'action.selected',
                                  },
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Close the autocomplete first
                                  setProjectAutocompleteOpen(false);
                                  // Use requestAnimationFrame to ensure state updates properly
                                  requestAnimationFrame(() => {
                                    setTimeout(() => {
                                      setCreateProjectModalOpen(true);
                                    }, 100);
                                  });
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onMouseUp={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setProjectAutocompleteOpen(false);
                                    requestAnimationFrame(() => {
                                      setTimeout(() => {
                                        setCreateProjectModalOpen(true);
                                      }, 100);
                                    });
                                  }
                                }}
                              >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main", fontWeight: 500 }}>
                                  <AddIcon sx={{ fontSize: 18 }} />
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    Create Project
                                  </Typography>
                                </Box>
                              </Box>
                            </Paper>
                          ) : undefined}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          name="subject"
                          label="Subject"
                          disabled={!isSuperAdminByType}
                          error={touched.subject && !!errors.subject}
                          helperText={touched.subject ? errors.subject : (!isSuperAdminByType ? "Only SuperAdmin can change subject" : "")}
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
                            disabled={!isSuperAdminByType}
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
                              if (inputValue !== "" && !isExisting && inputValue.trim().length > 0 && isSuperAdminByType) {
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
                                disabled={!isSuperAdminByType}
                                placeholder={isSuperAdminByType ? "Select user or type name to add..." : ""}
                                helperText={!isSuperAdminByType ? "Only SuperAdmin can change assignment" : ""}
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
                            noOptionsText={isSuperAdminByType ? "No users found. Type a name to add new." : "No help desk support users found"}
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
                            disabled={!isSuperAdminByType}
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
                          {!isSuperAdminByType && (
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
                        borderRadius: { xs: 0, md: 1 },
                        m: { xs: 0, md: "0 8px 0 0" },
                      }}
                    >
                    <Box sx={{ p: { xs: 2, sm: 4 }, pb: 1, flexShrink: 0 }}>
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
                        px: { xs: 2, sm: 4 },
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
            <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2, sm: 3 }, bgcolor: "#F8FAFC" }}>
              <Stack spacing={3}>
                  {/* Header Section */}
                  <Box sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 2
                  }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "12px",
                        background: getActiveClockEntry 
                          ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" 
                          : "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)"
                      }}>
                        <AccessTimeIcon sx={{ color: "white", fontSize: 24 }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A202C", lineHeight: 1.2 }}>
                          Time Tracker
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748B" }}>
                          {getActiveClockEntry ? "Currently working" : "Ready to start"}
                        </Typography>
                      </Box>
                    </Box>
                    {getActiveClockEntry && (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                        label={`Active since ${formatDate(getActiveClockEntry.clockInAt ?? getActiveClockEntry.ClockInAt)}`}
                        sx={{
                          bgcolor: "#ECFDF5",
                          color: "#059669",
                          fontWeight: 600,
                          "& .MuiChip-icon": { color: "#10B981" }
                        }}
                      />
                    )}
                  </Box>

                  {clockError ? <Alert severity="error" sx={{ borderRadius: 2 }}>{clockError}</Alert> : null}

                  {/* Main Action Card */}
                  <Box sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    bgcolor: "white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
                    border: "1px solid #E2E8F0"
                  }}>
                    {/* Status Indicators Row */}
                    <Box sx={{ 
                      display: "grid", 
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, 
                      gap: 2, 
                      mb: 3 
                    }}>
                      {/* Location Status Card */}
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: geo ? "#F0FDF4" : "#FEF2F2",
                        border: geo ? "1px solid #BBF7D0" : "1px solid #FECACA",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5
                      }}>
                        <Box sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "10px",
                          bgcolor: geo ? "#DCFCE7" : "#FEE2E2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          {geo ? (
                            <LocationOnIcon sx={{ color: "#16A34A", fontSize: 22 }} />
                          ) : (
                            <LocationOffIcon sx={{ color: "#DC2626", fontSize: 22 }} />
                          )}
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ 
                            fontWeight: 600, 
                            color: geo ? "#166534" : "#991B1B",
                            mb: 0.25
                          }}>
                            {geo ? "Location Ready" : "Location Required"}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: geo ? "#15803D" : "#B91C1C",
                            display: "block",
                            lineHeight: 1.4
                          }}>
                            {geoPlaceName || geoStatus || (geo ? `${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}` : "Please allow location access")}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Photo Status Card */}
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: photoFile ? "#F0FDF4" : "#FEF3C7",
                        border: photoFile ? "1px solid #BBF7D0" : "1px solid #FDE68A",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5
                      }}>
                        <Box sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "10px",
                          bgcolor: photoFile ? "#DCFCE7" : "#FEF9C3",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          {photoFile ? (
                            <CheckCircleIcon sx={{ color: "#16A34A", fontSize: 22 }} />
                          ) : (
                            <CameraAltIcon sx={{ color: "#CA8A04", fontSize: 22 }} />
                          )}
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ 
                            fontWeight: 600, 
                            color: photoFile ? "#166534" : "#92400E",
                            mb: 0.25
                          }}>
                            {photoFile ? "Photo Captured" : "Photo Required"}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: photoFile ? "#15803D" : "#B45309",
                            display: "block"
                          }}>
                            {photoFile ? "Ready to submit" : "Take or upload a photo"}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {cameraError ? <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>{cameraError}</Alert> : null}

                    {/* Camera & Photo Section */}
                    <Box sx={{ 
                      display: "grid", 
                      gridTemplateColumns: { xs: "1fr", md: "1fr 320px" }, 
                      gap: 3 
                    }}>
                      {/* Camera View */}
                      <Box>
                        <Box sx={{ 
                          position: "relative",
                          borderRadius: 2,
                          overflow: "hidden",
                          bgcolor: "#0F172A",
                          aspectRatio: "16/9",
                          minHeight: 240
                        }}>
                          <video
                            ref={videoRef}
                            style={{ 
                              width: "100%", 
                              height: "100%",
                              objectFit: "cover",
                              display: cameraStream ? "block" : "none"
                            }}
                            playsInline
                            muted
                          />
                          <canvas ref={canvasRef} style={{ display: "none" }} />
                          
                          {/* Camera Placeholder */}
                          {!cameraStream && (
                            <Box sx={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 2,
                              color: "#64748B"
                            }}>
                              <PhotoCameraIcon sx={{ fontSize: 48, opacity: 0.5 }} />
                              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                Camera not started
                              </Typography>
                            </Box>
                          )}

                          {/* Camera Controls Overlay */}
                          <Box sx={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            p: 2,
                            background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                            display: "flex",
                            justifyContent: "center",
                            gap: 1.5
                          }}>
                            {!cameraStream ? (
                              <Button
                                variant="contained"
                                startIcon={<PhotoCameraIcon />}
                                onClick={startCamera}
                                sx={{
                                  bgcolor: "white",
                                  color: "#1E293B",
                                  fontWeight: 600,
                                  px: 3,
                                  "&:hover": { bgcolor: "#F1F5F9" }
                                }}
                              >
                                Start Camera
                              </Button>
                            ) : (
                              <>
                                <IconButton
                                  onClick={stopCamera}
                                  sx={{
                                    bgcolor: "rgba(255,255,255,0.2)",
                                    color: "white",
                                    "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }
                                  }}
                                >
                                  <CancelIcon />
                                </IconButton>
                                <Button
                                  variant="contained"
                                  onClick={takePhoto}
                                  sx={{
                                    bgcolor: "white",
                                    color: "#1E293B",
                                    fontWeight: 600,
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: "28px",
                                    "&:hover": { bgcolor: "#F1F5F9" }
                                  }}
                                >
                                  <CameraAltIcon sx={{ fontSize: 28 }} />
                                </Button>
                                <IconButton
                                  sx={{
                                    bgcolor: "rgba(255,255,255,0.2)",
                                    color: "white",
                                    "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }
                                  }}
                                >
                                  <FlipCameraIosIcon />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </Box>

                        {/* Upload Alternative */}
                        <Box sx={{ mt: 2, textAlign: "center" }}>
                          <Typography variant="body2" sx={{ color: "#64748B", mb: 1 }}>
                            or
                          </Typography>
                          <Button
                            variant="outlined"
                            component="label"
                            startIcon={<CloudUploadIcon />}
                            sx={{
                              borderColor: "#E2E8F0",
                              color: "#475569",
                              fontWeight: 500,
                              "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" }
                            }}
                          >
                            Upload from Device
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              hidden
                              ref={fileInputRef}
                              onChange={(e) => onPhotoPicked(e.target.files?.[0])}
                            />
                          </Button>
                        </Box>
                      </Box>

                      {/* Photo Preview & Action */}
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {/* Preview Card */}
                        <Box sx={{
                          flex: 1,
                          borderRadius: 2,
                          border: photoPreviewUrl ? "2px solid #10B981" : "2px dashed #CBD5E1",
                          overflow: "hidden",
                          bgcolor: photoPreviewUrl ? "transparent" : "#F8FAFC",
                          display: "flex",
                          flexDirection: "column",
                          minHeight: 200
                        }}>
                          {photoPreviewUrl ? (
                            <Box sx={{ position: "relative", flex: 1 }}>
                              <img
                                src={photoPreviewUrl}
                                alt="Clock photo preview"
                                style={{ 
                                  width: "100%", 
                                  height: "100%", 
                                  objectFit: "cover",
                                  minHeight: 200
                                }}
                              />
                              <IconButton
                                onClick={clearSelectedPhoto}
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  bgcolor: "rgba(0,0,0,0.6)",
                                  color: "white",
                                  "&:hover": { bgcolor: "rgba(220,38,38,0.9)" }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                              <Box sx={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                p: 1.5,
                                bgcolor: "rgba(16,185,129,0.95)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1
                              }}>
                                <CheckCircleIcon sx={{ fontSize: 18, color: "white" }} />
                                <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
                                  Photo Ready
                                </Typography>
                              </Box>
                            </Box>
                          ) : (
                            <Box sx={{
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 1,
                              p: 3
                            }}>
                              <CameraAltIcon sx={{ fontSize: 40, color: "#CBD5E1" }} />
                              <Typography variant="body2" sx={{ color: "#94A3B8", textAlign: "center" }}>
                                Your photo will appear here
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* Clock In/Out Button */}
                        {getActiveClockEntry ? (
                          <Box>
                            <TextField
                              label="Clock Out Time"
                              type="datetime-local"
                              value={clockOutAt}
                              onChange={(e) => setClockOutAt(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              fullWidth
                              size="small"
                              sx={{ mb: 2 }}
                            />
                            <Button
                              variant="contained"
                              fullWidth
                              size="large"
                              startIcon={clockLoading ? <CircularProgress size={20} color="inherit" /> : <LogoutIcon />}
                              onClick={submitClockOut}
                              disabled={clockLoading || !photoFile}
                              sx={{
                                py: 1.5,
                                borderRadius: 2,
                                fontWeight: 700,
                                fontSize: "1rem",
                                textTransform: "none",
                                bgcolor: "#DC2626",
                                boxShadow: "0 4px 14px rgba(220,38,38,0.35)",
                                "&:hover": { 
                                  bgcolor: "#B91C1C",
                                  boxShadow: "0 6px 20px rgba(220,38,38,0.4)"
                                },
                                "&:disabled": {
                                  bgcolor: "#FCA5A5",
                                  color: "white"
                                }
                              }}
                            >
                              {clockLoading ? "Processing..." : "Clock Out"}
                            </Button>
                          </Box>
                        ) : (
                          <Box>
                            <TextField
                              label="Clock In Time"
                              type="datetime-local"
                              value={clockInAt}
                              onChange={(e) => setClockInAt(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              fullWidth
                              size="small"
                              sx={{ mb: 2 }}
                            />
                            <Button
                              variant="contained"
                              fullWidth
                              size="large"
                              startIcon={clockLoading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                              onClick={submitClockIn}
                              disabled={clockLoading || !photoFile}
                              sx={{
                                py: 1.5,
                                borderRadius: 2,
                                fontWeight: 700,
                                fontSize: "1rem",
                                textTransform: "none",
                                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                                boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
                                "&:hover": { 
                                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                                  boxShadow: "0 6px 20px rgba(16,185,129,0.4)"
                                },
                                "&:disabled": {
                                  background: "#A7F3D0",
                                  color: "white"
                                }
                              }}
                            >
                              {clockLoading ? "Processing..." : "Clock In"}
                            </Button>
                          </Box>
                        )}

                        {!photoFile && (
                          <Typography variant="caption" sx={{ 
                            color: "#92400E", 
                            textAlign: "center",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.5
                          }}>
                            <CameraAltIcon sx={{ fontSize: 14 }} />
                            Photo is required to {getActiveClockEntry ? "clock out" : "clock in"}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* Clock History Section */}
                  <Box sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    bgcolor: "white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
                    border: "1px solid #E2E8F0"
                  }}>
                    <Box sx={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      mb: 2.5
                    }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "10px",
                          bgcolor: "#EEF2FF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <HistoryIcon sx={{ color: "#6366F1", fontSize: 20 }} />
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1E293B" }}>
                          Clock History
                        </Typography>
                      </Box>
                      <IconButton 
                        onClick={loadClockEntries} 
                        disabled={clockLoading}
                        sx={{
                          bgcolor: "#F1F5F9",
                          "&:hover": { bgcolor: "#E2E8F0" }
                        }}
                      >
                        <RefreshIcon sx={{ fontSize: 20, color: "#64748B" }} />
                      </IconButton>
                    </Box>

                    {clockLoading ? (
                      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={32} />
                      </Box>
                    ) : (clockEntries?.length ?? 0) === 0 ? (
                      <Box sx={{ 
                        textAlign: "center", 
                        py: 4,
                        bgcolor: "#F8FAFC",
                        borderRadius: 2,
                        border: "1px dashed #E2E8F0"
                      }}>
                        <HistoryIcon sx={{ fontSize: 40, color: "#CBD5E1", mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          No clock entries yet
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        {(clockEntries ?? []).map((e) => {
                          const isActive = !(e.clockOutAt || e.ClockOutAt);
                          return (
                            <Box
                              key={e.id ?? e.Id}
                              sx={{
                                p: 2,
                                border: isActive ? "2px solid #10B981" : "1px solid #E2E8F0",
                                borderRadius: 2,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 2,
                                flexWrap: "wrap",
                                cursor: "pointer",
                                bgcolor: isActive ? "#F0FDF4" : "white",
                                transition: "all 0.2s ease",
                                "&:hover": { 
                                  bgcolor: isActive ? "#DCFCE7" : "#F8FAFC",
                                  borderColor: isActive ? "#10B981" : "#CBD5E1",
                                  transform: "translateY(-1px)",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                                },
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
                              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0 }}>
                                <Avatar sx={{ 
                                  width: 44, 
                                  height: 44, 
                                  bgcolor: isActive ? "#10B981" : "#6366F1",
                                  fontSize: 16,
                                  fontWeight: 600
                                }}>
                                  {((e.userName ?? e.UserName) || "U").charAt(0).toUpperCase()}
                                </Avatar>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1E293B" }}>
                                      {(e.userName ?? e.UserName) || "User"}
                                    </Typography>
                                    {isActive && (
                                      <Chip
                                        size="small"
                                        label="Active"
                                        sx={{
                                          height: 20,
                                          fontSize: 11,
                                          fontWeight: 600,
                                          bgcolor: "#10B981",
                                          color: "white"
                                        }}
                                      />
                                    )}
                                  </Box>
                                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                                    <Chip
                                      size="small"
                                      icon={<LoginIcon sx={{ fontSize: 14 }} />}
                                      label={formatDate(e.clockInAt ?? e.ClockInAt)}
                                      sx={{
                                        height: 24,
                                        fontSize: 12,
                                        bgcolor: "#EEF2FF",
                                        color: "#4F46E5",
                                        "& .MuiChip-icon": { color: "#6366F1" }
                                      }}
                                    />
                                    {(e.clockOutAt || e.ClockOutAt) && (
                                      <Chip
                                        size="small"
                                        icon={<LogoutIcon sx={{ fontSize: 14 }} />}
                                        label={formatDate(e.clockOutAt ?? e.ClockOutAt)}
                                        sx={{
                                          height: 24,
                                          fontSize: 12,
                                          bgcolor: "#FEF2F2",
                                          color: "#DC2626",
                                          "& .MuiChip-icon": { color: "#EF4444" }
                                        }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                {(e.clockInImageUrl ?? e.ClockInImageUrl) && (
                                  <Tooltip title="View clock-in photo">
                                    <IconButton
                                      size="small"
                                      onClick={(ev) => {
                                        ev.stopPropagation();
                                        window.open(e.clockInImageUrl ?? e.ClockInImageUrl, "_blank");
                                      }}
                                      sx={{ 
                                        bgcolor: "#EEF2FF",
                                        "&:hover": { bgcolor: "#E0E7FF" }
                                      }}
                                    >
                                      <CameraAltIcon sx={{ fontSize: 18, color: "#6366F1" }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {(e.clockOutImageUrl ?? e.ClockOutImageUrl) && (
                                  <Tooltip title="View clock-out photo">
                                    <IconButton
                                      size="small"
                                      onClick={(ev) => {
                                        ev.stopPropagation();
                                        window.open(e.clockOutImageUrl ?? e.ClockOutImageUrl, "_blank");
                                      }}
                                      sx={{ 
                                        bgcolor: "#FEF2F2",
                                        "&:hover": { bgcolor: "#FEE2E2" }
                                      }}
                                    >
                                      <CameraAltIcon sx={{ fontSize: 18, color: "#EF4444" }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <IconButton
                                  size="small"
                                  sx={{
                                    bgcolor: "#F1F5F9",
                                    "&:hover": { bgcolor: "#E2E8F0" }
                                  }}
                                >
                                  <BorderColorIcon sx={{ fontSize: 16, color: "#64748B" }} />
                                </IconButton>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
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

      {/* Create Customer Modal - Using Master Customer Create Component */}
      <AddCustomerDialog
        fetchItems={async (newCustomer) => {
          // Refresh customer list
          await fetchCustomers();
          
          // If a new customer was created, select it in the form
          if (newCustomer && editFormikRef.current) {
            // Wait a bit for state to update
            setTimeout(() => {
              if (editFormikRef.current) {
                const customerId = newCustomer.id || newCustomer.Id;
                if (customerId) {
                  // Use the newCustomer data directly since we just created it
                  const displayName = getCustomerDisplayName(newCustomer);
                  editFormikRef.current.setFieldValue("customerName", displayName);
                  editFormikRef.current.setFieldValue("customerId", customerId);
                }
              }
            }, 200);
          }
        }}
        chartOfAccounts={[]}
        externalOpen={createCustomerModalOpen}
        onClose={() => setCreateCustomerModalOpen(false)}
        showButton={false}
      />

      {/* Create Project Modal - Using HelpDesk Project Create Component */}
      <CreateHelpDeskProjectModal
        fetchItems={async (newProject) => {
          if (newProject) {
            const projectId = toNumericId(newProject.id || newProject.Id || newProject.projectId);
            const customerId = toNumericId(newProject.CustomerId || newProject.customerId || newProject.customerIdNormalized);
            const projectEntry = {
              id: projectId,
              code: newProject.code || newProject.Code || "",
              name: newProject.name || newProject.Name || "",
              customerId: customerId,
              clientName: newProject.clientName || newProject.ClientName || "",
            };
            setProjectsData(prev => {
              const prevList = Array.isArray(prev?.result) ? prev.result : [];
              const exists = prevList.some(p => toNumericId(p.id || p.Id) === projectId);
              return { result: exists ? prevList : [projectEntry, ...prevList] };
            });
          }

          refreshProjects();

          if (newProject && editFormikRef.current) {
            setTimeout(() => {
              if (editFormikRef.current) {
                const projectId = toNumericId(newProject.id || newProject.Id || newProject.projectId);
                if (projectId) {
                  editFormikRef.current.setFieldValue("projectIds", [projectId]);

                  if (!editFormikRef.current.values.customerId) {
                    const customerId = toNumericId(newProject.CustomerId || newProject.customerId || newProject.customerIdNormalized);
                    if (customerId) {
                      editFormikRef.current.setFieldValue("customerId", customerId);
                    }
                  }
                }
              }
            }, 200);
          }
        }}
        open={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        showButton={false}
      />

    </>
  );
}


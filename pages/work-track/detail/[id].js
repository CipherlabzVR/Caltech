import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "@/styles/PageTitle.module.css";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Checkbox from "@mui/material/Checkbox";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
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
import FormLabel from "@mui/material/FormLabel";
import ImageIcon from "@mui/icons-material/Image";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import ArrowDropDownCircleIcon from "@mui/icons-material/ArrowDropDownCircle";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import StopIcon from "@mui/icons-material/Stop";
import TimerIcon from "@mui/icons-material/Timer";
import PersonIcon from "@mui/icons-material/Person";
import SendIcon from "@mui/icons-material/Send";
import DrawIcon from "@mui/icons-material/Draw";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import LockIcon from "@mui/icons-material/Lock";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ListAltIcon from "@mui/icons-material/ListAlt";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";
import SignatureCanvas from "react-signature-canvas";

export default function WorkTrackDetailView() {
  const router = useRouter();
  const { id } = router.query;
  const hasFetched = useRef(false);

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [checklists, setChecklists] = useState([]);
  const [expandedChecklists, setExpandedChecklists] = useState({});

  // Checklist modals
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [checklistTitle, setChecklistTitle] = useState("");
  const [checklistDescription, setChecklistDescription] = useState("");
  const [savingChecklist, setSavingChecklist] = useState(false);

  // Checklist Item modals
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [parentChecklistId, setParentChecklistId] = useState(null);
  const [itemTitle, setItemTitle] = useState("");
  const [itemType, setItemType] = useState("Checkbox");
  const [itemOptions, setItemOptions] = useState([]);
  const [newOption, setNewOption] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemIsRequired, setItemIsRequired] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  
  // Image upload
  const imageInputRef = useRef(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState(""); // "checklist" or "item"
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Work session state
  const [workSummary, setWorkSummary] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [liveTimer, setLiveTimer] = useState(0);
  const timerIntervalRef = useRef(null);

  // Technician assignment
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [assigningTechnician, setAssigningTechnician] = useState(false);

  // Submit to Admin modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submissionSummary, setSubmissionSummary] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Signature modal
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureType, setSignatureType] = useState(""); // "Technician" or "Admin" (Admin displays as "Authorized Person")
  const [savingSignature, setSavingSignature] = useState(false);
  const technicianSigRef = useRef(null);
  const adminSigRef = useRef(null);

  // Check if work is completed (read-only mode)
  const isCompleted = detail?.submissionStatus === "Completed";
  const isPendingApproval = detail?.submissionStatus === "PendingApproval";
  const isReadOnly = isCompleted;

  useEffect(() => {
    if (!id) return;
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchData();
    fetchTechnicians();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch work track detail
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
        setSelectedTechnician(detailData.assignedTechnicianId || "");
      } else {
        toast("Work track detail not found", { type: "error" });
        return;
      }

      // Fetch checklists
      await fetchChecklists();
      
      // Fetch work summary
      await fetchWorkSummary();
    } catch (error) {
      console.error("Error fetching data:", error);
      toast("Failed to load data", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await fetch(`${BASE_URL}/WorkTrackDetail/GetTechnicians`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();
      
      if (result?.data) {
        setTechnicians(result.data);
      } else if (result?.result) {
        setTechnicians(result.result);
      }
    } catch (error) {
      console.error("Error fetching technicians:", error);
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
      
      // Start live timer if work is in progress
      if (summaryData?.currentStatus === "Started" || summaryData?.currentStatus === "Held") {
        startLiveTimer(summaryData.totalDuration || 0);
      } else {
        stopLiveTimer();
        setLiveTimer(summaryData?.totalDuration || 0);
      }
    } catch (error) {
      console.error("Error fetching work summary:", error);
    }
  };

  const startLiveTimer = useCallback((initialSeconds) => {
    stopLiveTimer();
    setLiveTimer(initialSeconds);
    timerIntervalRef.current = setInterval(() => {
      setLiveTimer(prev => prev + 1);
    }, 1000);
  }, []);

  const stopLiveTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => stopLiveTimer();
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

  const handleStartWork = async () => {
    if (isReadOnly) return;
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

  const handleHoldWork = async () => {
    if (isReadOnly) return;
    try {
      setSessionLoading(true);
      const response = await fetch(`${BASE_URL}/WorkTrackWorkSession/HoldWork?workTrackDetailId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();
      
      if (result?.statusCode === 200) {
        toast("Work put on hold", { type: "info" });
        stopLiveTimer();
        await fetchWorkSummary();
      } else {
        toast(result?.message || "Failed to hold work", { type: "error" });
      }
    } catch (error) {
      console.error("Error holding work:", error);
      toast("Failed to hold work", { type: "error" });
    } finally {
      setSessionLoading(false);
    }
  };

  const handleResumeWork = async () => {
    if (isReadOnly) return;
    try {
      setSessionLoading(true);
      const response = await fetch(`${BASE_URL}/WorkTrackWorkSession/ResumeWork?workTrackDetailId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();
      
      if (result?.statusCode === 200) {
        toast("Work resumed!", { type: "success" });
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

  const handleEndWork = async () => {
    if (isReadOnly) return;
    try {
      setSessionLoading(true);
      const response = await fetch(`${BASE_URL}/WorkTrackWorkSession/EndWork?workTrackDetailId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();
      
      if (result?.statusCode === 200) {
        toast("Work completed!", { type: "success" });
        stopLiveTimer();
        await fetchWorkSummary();
        await fetchChecklists(); // Refresh to update completion percentage
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

  const handleAssignTechnician = async () => {
    if (!selectedTechnician || isReadOnly) return;
    
    try {
      setAssigningTechnician(true);
      const response = await fetch(`${BASE_URL}/WorkTrackDetail/AssignTechnician`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workTrackDetailId: parseInt(id),
          technicianId: parseInt(selectedTechnician),
        }),
      });
      const result = await response.json();
      
      if (result?.statusCode === 200) {
        toast("Technician assigned successfully!", { type: "success" });
        await fetchData();
      } else {
        toast(result?.message || "Failed to assign technician", { type: "error" });
      }
    } catch (error) {
      console.error("Error assigning technician:", error);
      toast("Failed to assign technician", { type: "error" });
    } finally {
      setAssigningTechnician(false);
    }
  };

  const handleOpenSubmitModal = async () => {
    try {
      const response = await fetch(`${BASE_URL}/WorkTrackDetail/GetWorkSummaryForSubmission?workTrackDetailId=${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();
      
      if (result?.statusCode === 200) {
        setSubmissionSummary(result.data || result.result);
        setSubmitModalOpen(true);
      } else {
        toast(result?.message || "Failed to get work summary", { type: "error" });
      }
    } catch (error) {
      console.error("Error getting work summary:", error);
      toast("Failed to get work summary", { type: "error" });
    }
  };

  const handleSubmitToAdmin = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`${BASE_URL}/WorkTrackDetail/SubmitToAdmin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workTrackDetailId: parseInt(id) }),
      });
      const result = await response.json();
      
      if (result?.statusCode === 200) {
        toast("Submitted to admin successfully!", { type: "success" });
        setSubmitModalOpen(false);
        await fetchData();
      } else {
        toast(result?.message || "Failed to submit", { type: "error" });
      }
    } catch (error) {
      console.error("Error submitting to admin:", error);
      toast("Failed to submit", { type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenSignatureModal = (type) => {
    setSignatureType(type);
    setSignatureModalOpen(true);
  };

  const handleSaveSignature = async () => {
    const sigRef = signatureType === "Technician" ? technicianSigRef : adminSigRef;
    
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast("Please draw your signature", { type: "warning" });
      return;
    }

    try {
      setSavingSignature(true);
      const signatureData = sigRef.current.toDataURL("image/png");
      
      const response = await fetch(`${BASE_URL}/WorkTrackDetail/AddSignature`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workTrackDetailId: parseInt(id),
          signature: signatureData,
          signatureType: signatureType,
        }),
      });
      const result = await response.json();
      
      if (result?.statusCode === 200) {
        const displayType = signatureType === "Admin" ? "Authorized Person" : signatureType;
        toast(`${displayType} signature added successfully!`, { type: "success" });
        setSignatureModalOpen(false);
        await fetchData();
      } else {
        toast(result?.message || "Failed to save signature", { type: "error" });
      }
    } catch (error) {
      console.error("Error saving signature:", error);
      toast("Failed to save signature", { type: "error" });
    } finally {
      setSavingSignature(false);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`${BASE_URL}/WorkTrackDetail/FinalSubmit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workTrackDetailId: parseInt(id) }),
      });
      const result = await response.json();
      
      if (result?.statusCode === 200) {
        toast("Work completed successfully!", { type: "success" });
        router.push("/work-track");
      } else {
        toast(result?.message || "Failed to complete", { type: "error" });
      }
    } catch (error) {
      console.error("Error completing work:", error);
      toast("Failed to complete", { type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const isWorkActive = workSummary?.currentStatus === "Started" || workSummary?.currentStatus === "Held";

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
      
      // Auto-expand all checklists by default
      const expanded = {};
      checklistData.forEach(cl => {
        expanded[cl.id] = true;
      });
      setExpandedChecklists(expanded);
    } catch (error) {
      console.error("Error fetching checklists:", error);
    }
  };

  const goBack = () => {
    if (detail?.workTrackId) {
      router.push(`/work-track/edit/${detail.workTrackId}`);
    } else {
      router.push("/work-track");
    }
  };

  const toggleChecklistExpand = (checklistId) => {
    setExpandedChecklists(prev => ({
      ...prev,
      [checklistId]: !prev[checklistId]
    }));
  };

  // Checklist CRUD
  const handleOpenChecklistModal = (checklist = null) => {
    if (isReadOnly) return;
    setEditingChecklist(checklist);
    setChecklistTitle(checklist?.title || "");
    setChecklistDescription(checklist?.description || "");
    setChecklistModalOpen(true);
  };

  const handleCloseChecklistModal = () => {
    setChecklistModalOpen(false);
    setEditingChecklist(null);
    setChecklistTitle("");
    setChecklistDescription("");
  };

  const handleSaveChecklist = async () => {
    if (!checklistTitle.trim()) {
      toast("Please enter a checklist title", { type: "warning" });
      return;
    }

    try {
      setSavingChecklist(true);
      const payload = editingChecklist
        ? {
            id: editingChecklist.id,
            title: checklistTitle,
            description: checklistDescription,
            isCompleted: editingChecklist.isCompleted,
            sortOrder: editingChecklist.sortOrder,
          }
        : {
            workTrackDetailId: parseInt(id),
            title: checklistTitle,
            description: checklistDescription,
            sortOrder: checklists.length,
          };

      const url = editingChecklist
        ? `${BASE_URL}/WorkTrackChecklist/UpdateChecklist`
        : `${BASE_URL}/WorkTrackChecklist/CreateChecklist`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result?.statusCode === 200 || response.ok) {
        handleCloseChecklistModal();
        await fetchChecklists();
        toast(editingChecklist ? "Checklist updated!" : "Checklist added!", { type: "success" });
      } else {
        toast(result?.message || "Failed to save checklist", { type: "error" });
      }
    } catch (error) {
      console.error("Error saving checklist:", error);
      toast("Failed to save checklist", { type: "error" });
    } finally {
      setSavingChecklist(false);
    }
  };

  // Checklist Item CRUD
  const handleOpenItemModal = (checklistId, item = null) => {
    if (isReadOnly) return;
    setParentChecklistId(checklistId);
    setEditingItem(item);
    setItemTitle(item?.title || "");
    setItemType(item?.itemType || "Checkbox");
    setItemOptions(item?.optionsList || []);
    setItemDescription(item?.description || "");
    setItemIsRequired(item?.isRequired || false);
    setNewOption("");
    setItemModalOpen(true);
  };

  const handleCloseItemModal = () => {
    setItemModalOpen(false);
    setEditingItem(null);
    setParentChecklistId(null);
    setItemTitle("");
    setItemType("Checkbox");
    setItemOptions([]);
    setNewOption("");
    setItemDescription("");
    setItemIsRequired(false);
  };

  const handleAddOption = () => {
    if (newOption.trim() && !itemOptions.includes(newOption.trim())) {
      setItemOptions([...itemOptions, newOption.trim()]);
      setNewOption("");
    }
  };

  const handleRemoveOption = (index) => {
    setItemOptions(itemOptions.filter((_, i) => i !== index));
  };

  const handleSaveItem = async () => {
    if (!itemTitle.trim()) {
      toast("Please enter an item title", { type: "warning" });
      return;
    }

    // Validate options for Radio/Dropdown
    if ((itemType === "Radio" || itemType === "Dropdown") && itemOptions.length < 2) {
      toast("Please add at least 2 options for Radio/Dropdown items", { type: "warning" });
      return;
    }

    try {
      setSavingItem(true);
      const checklist = checklists.find(c => c.id === parentChecklistId);
      const itemsCount = checklist?.items?.length || 0;

      const payload = editingItem
        ? {
            id: editingItem.id,
            title: itemTitle,
            isCompleted: editingItem.isCompleted,
            sortOrder: editingItem.sortOrder,
            itemType: itemType,
            options: (itemType === "Radio" || itemType === "Dropdown") ? itemOptions : null,
            description: itemDescription || null,
            isRequired: itemIsRequired,
          }
        : {
            workTrackChecklistId: parentChecklistId,
            title: itemTitle,
            sortOrder: itemsCount,
            itemType: itemType,
            options: (itemType === "Radio" || itemType === "Dropdown") ? itemOptions : null,
            description: itemDescription || null,
            isRequired: itemIsRequired,
          };

      const url = editingItem
        ? `${BASE_URL}/WorkTrackChecklist/UpdateChecklistItem`
        : `${BASE_URL}/WorkTrackChecklist/CreateChecklistItem`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result?.statusCode === 200 || response.ok) {
        handleCloseItemModal();
        await fetchChecklists();
        toast(editingItem ? "Item updated!" : "Item added!", { type: "success" });
      } else {
        toast(result?.message || "Failed to save item", { type: "error" });
      }
    } catch (error) {
      console.error("Error saving item:", error);
      toast("Failed to save item", { type: "error" });
    } finally {
      setSavingItem(false);
    }
  };

  // Handle updating item value (for Radio/Dropdown)
  const handleUpdateItemValue = async (itemId, selectedValue) => {
    if (isReadOnly) return;
    
    if (workSummary?.currentStatus !== "Started") {
      toast("Please start work before updating items", { type: "warning" });
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

  // Handle image upload for Image type items
  const handleImageUpload = async (itemId, event) => {
    if (isReadOnly) return;
    
    if (workSummary?.currentStatus !== "Started") {
      toast("Please start work before uploading images", { type: "warning" });
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast("Please select an image file", { type: "error" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast("Image size must be less than 5MB", { type: "error" });
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target.result;
        
        const response = await fetch(`${BASE_URL}/WorkTrackChecklist/UploadChecklistItemImage`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: itemId, imageData }),
        });

        const result = await response.json();
        if (result?.statusCode === 200 || response.ok) {
          await fetchChecklists();
          toast("Image uploaded successfully!", { type: "success" });
        } else {
          toast(result?.message || "Failed to upload image", { type: "error" });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast("Failed to upload image", { type: "error" });
    }
  };

  const handleToggleItem = async (itemId, isCompleted) => {
    if (isReadOnly) return;
    
    // Only allow toggling if work has started
    if (workSummary?.currentStatus !== "Started") {
      toast("Please start work before ticking checklist items", { type: "warning" });
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

  // Delete handlers
  const handleDeleteClick = (type, id) => {
    if (isReadOnly) return;
    setDeleteType(type);
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      const url = deleteType === "checklist"
        ? `${BASE_URL}/WorkTrackChecklist/DeleteChecklist?id=${deleteId}`
        : `${BASE_URL}/WorkTrackChecklist/DeleteChecklistItem?id=${deleteId}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        await fetchChecklists();
        toast(`${deleteType === "checklist" ? "Checklist" : "Item"} deleted!`, { type: "success" });
      } else {
        toast("Failed to delete", { type: "error" });
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast("Failed to delete", { type: "error" });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteType("");
      setDeleteId(null);
    }
  };

  // Calculate checklist progress
  const getChecklistProgress = (checklist) => {
    if (!checklist.items || checklist.items.length === 0) return 0;
    const completed = checklist.items.filter(item => item.isCompleted).length;
    return Math.round((completed / checklist.items.length) * 100);
  };

  // Calculate overall completion
  const getAllItemsCompleted = () => {
    const allItems = checklists.flatMap(cl => cl.items || []);
    if (allItems.length === 0) return false;
    return allItems.every(item => item.isCompleted);
  };

  // Dashboard Statistics
  const allItems = checklists.flatMap(cl => cl.items || []);
  const totalChecklistItems = allItems.length;
  const completedChecklistItems = allItems.filter(item => item.isCompleted).length;
  const pendingChecklistItems = totalChecklistItems - completedChecklistItems;
  const checklistCompletionPercentage = totalChecklistItems > 0 
    ? Math.round((completedChecklistItems / totalChecklistItems) * 100) 
    : 0;
  const totalChecklists = checklists.length;
  const completedChecklists = checklists.filter(cl => {
    const items = cl.items || [];
    return items.length > 0 && items.every(item => item.isCompleted);
  }).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!detail) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="error" gutterBottom>
          Work Track Detail could not be loaded
        </Typography>
        <Button variant="contained" onClick={() => router.push("/work-track")}>
          Back to Work Track List
        </Button>
      </Box>
    );
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Work Track Detail {isCompleted && <Chip label="COMPLETED" color="success" size="small" sx={{ ml: 1 }} />}</h1>
        <ul>
          <li>
            <Link href="/work-track/">Work Track</Link>
          </li>
          <li>Detail</li>
        </ul>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Completed Work Banner */}
      {isCompleted && (
        <Alert 
          severity="success" 
          icon={<DoneAllIcon />}
          sx={{ mb: 3, fontSize: '1.1rem' }}
        >
          <Typography variant="h6">This work has been completed</Typography>
          <Typography variant="body2">
            Completed on: {detail.completedOn ? formatDate(detail.completedOn) : formatDate(detail.dateCompleted)}
          </Typography>
        </Alert>
      )}

      {/* Pending Approval Banner */}
      {isPendingApproval && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
        >
          <Typography variant="h6">Pending Admin Approval</Typography>
          <Typography variant="body2">
            This work has been submitted and is awaiting signatures and final approval.
          </Typography>
        </Alert>
      )}

      {/* Summary Dashboard */}
      <Card 
        sx={{ 
          mb: 3, 
          background: isCompleted 
            ? "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)" 
            : "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)",
          color: isCompleted ? "white" : "inherit",
          border: isCompleted ? "none" : "1px solid #e2e8f0",
          boxShadow: isCompleted 
            ? "0 10px 40px rgba(16, 185, 129, 0.3)" 
            : "0 4px 20px rgba(0, 0, 0, 0.08)"
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <TrendingUpIcon sx={{ fontSize: 28, color: isCompleted ? "white" : "#6366f1" }} />
            <Typography variant="h6" fontWeight="bold" sx={{ color: isCompleted ? "white" : "#1e293b" }}>
              Checklist Dashboard
            </Typography>
            {isCompleted && (
              <Chip 
                label="✓ COMPLETED" 
                size="small" 
                sx={{ 
                  ml: 2, 
                  bgcolor: "rgba(255,255,255,0.25)", 
                  color: "white",
                  fontWeight: "bold"
                }} 
              />
            )}
          </Box>
          
          <Grid container spacing={3}>
            {/* Total Items */}
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2.5, 
                  textAlign: "center", 
                  background: isCompleted 
                    ? "rgba(255,255,255,0.15)" 
                    : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: isCompleted 
                    ? "1px solid rgba(255,255,255,0.2)" 
                    : "none",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 45, 
                    height: 45, 
                    borderRadius: "50%", 
                    background: isCompleted 
                      ? "rgba(255,255,255,0.25)" 
                      : "rgba(255,255,255,0.2)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5
                  }}
                >
                  <AssignmentIcon sx={{ color: "white", fontSize: 24 }} />
                </Box>
                <Typography variant="h3" fontWeight="bold" sx={{ color: "white", lineHeight: 1 }}>
                  {totalChecklistItems}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontWeight: 500 }}>
                  Total Items
                </Typography>
              </Paper>
            </Grid>

            {/* Completed Items */}
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2.5, 
                  textAlign: "center", 
                  background: isCompleted 
                    ? "rgba(255,255,255,0.15)" 
                    : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: isCompleted 
                    ? "1px solid rgba(255,255,255,0.2)" 
                    : "none",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 45, 
                    height: 45, 
                    borderRadius: "50%", 
                    background: isCompleted 
                      ? "rgba(255,255,255,0.25)" 
                      : "rgba(255,255,255,0.2)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5
                  }}
                >
                  <CheckCircleOutlineIcon sx={{ color: "white", fontSize: 24 }} />
                </Box>
                <Typography variant="h3" fontWeight="bold" sx={{ color: "white", lineHeight: 1 }}>
                  {completedChecklistItems}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontWeight: 500 }}>
                  Completed
                </Typography>
              </Paper>
            </Grid>

            {/* Pending Items */}
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2.5, 
                  textAlign: "center", 
                  background: isCompleted 
                    ? "rgba(255,255,255,0.15)" 
                    : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: isCompleted 
                    ? "1px solid rgba(255,255,255,0.2)" 
                    : "none",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 45, 
                    height: 45, 
                    borderRadius: "50%", 
                    background: isCompleted 
                      ? "rgba(255,255,255,0.25)" 
                      : "rgba(255,255,255,0.2)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5
                  }}
                >
                  <PendingActionsIcon sx={{ color: "white", fontSize: 24 }} />
                </Box>
                <Typography variant="h3" fontWeight="bold" sx={{ color: "white", lineHeight: 1 }}>
                  {pendingChecklistItems}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontWeight: 500 }}>
                  Pending
                </Typography>
              </Paper>
            </Grid>

            {/* Total Checklists */}
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2.5, 
                  textAlign: "center", 
                  background: isCompleted 
                    ? "rgba(255,255,255,0.15)" 
                    : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: isCompleted 
                    ? "1px solid rgba(255,255,255,0.2)" 
                    : "none",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 45, 
                    height: 45, 
                    borderRadius: "50%", 
                    background: isCompleted 
                      ? "rgba(255,255,255,0.25)" 
                      : "rgba(255,255,255,0.2)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5
                  }}
                >
                  <ListAltIcon sx={{ color: "white", fontSize: 24 }} />
                </Box>
                <Typography variant="h3" fontWeight="bold" sx={{ color: "white", lineHeight: 1 }}>
                  {totalChecklists}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontWeight: 500 }}>
                  Checklists
                </Typography>
              </Paper>
            </Grid>

            {/* Completed Checklists */}
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2.5, 
                  textAlign: "center", 
                  background: isCompleted 
                    ? "rgba(255,255,255,0.15)" 
                    : "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: isCompleted 
                    ? "1px solid rgba(255,255,255,0.2)" 
                    : "none",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 45, 
                    height: 45, 
                    borderRadius: "50%", 
                    background: isCompleted 
                      ? "rgba(255,255,255,0.25)" 
                      : "rgba(255,255,255,0.2)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5
                  }}
                >
                  <DoneAllIcon sx={{ color: "white", fontSize: 24 }} />
                </Box>
                <Typography variant="h3" fontWeight="bold" sx={{ color: "white", lineHeight: 1 }}>
                  {completedChecklists}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontWeight: 500 }}>
                  Done Lists
                </Typography>
              </Paper>
            </Grid>

            {/* Work Time */}
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2.5, 
                  textAlign: "center", 
                  background: isCompleted 
                    ? "rgba(255,255,255,0.15)" 
                    : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: isCompleted 
                    ? "1px solid rgba(255,255,255,0.2)" 
                    : "none",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 45, 
                    height: 45, 
                    borderRadius: "50%", 
                    background: isCompleted 
                      ? "rgba(255,255,255,0.25)" 
                      : "rgba(255,255,255,0.2)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5
                  }}
                >
                  <AccessTimeIcon sx={{ color: "white", fontSize: 24 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ color: "white", lineHeight: 1.2 }}>
                  {workSummary?.formattedTotalDuration || "0s"}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontWeight: 500 }}>
                  Work Time
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Overall Progress Section */}
          <Box 
            sx={{ 
              mt: 3, 
              p: 3, 
              background: isCompleted 
                ? "rgba(255,255,255,0.1)" 
                : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", 
              borderRadius: 3,
              border: isCompleted 
                ? "1px solid rgba(255,255,255,0.15)"
                : "1px solid #e2e8f0"
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: isCompleted ? "rgba(255,255,255,0.9)" : "#475569", 
                    mb: 1.5, 
                    fontWeight: 600 
                  }}
                >
                  Overall Completion Progress
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={checklistCompletionPercentage} 
                      sx={{ 
                        height: 14, 
                        borderRadius: 7,
                        backgroundColor: isCompleted 
                          ? "rgba(255,255,255,0.2)" 
                          : "#e2e8f0",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 7,
                          background: isCompleted 
                            ? "rgba(255,255,255,0.9)"
                            : checklistCompletionPercentage === 100 
                              ? "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
                              : checklistCompletionPercentage >= 50 
                                ? "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)"
                                : "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)"
                        }
                      }}
                    />
                  </Box>
                  <Typography 
                    variant="h4" 
                    fontWeight="bold" 
                    sx={{ 
                      color: isCompleted ? "white" : "#1e293b", 
                      minWidth: 80,
                      textAlign: "right"
                    }}
                  >
                    {checklistCompletionPercentage}%
                  </Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: isCompleted ? "rgba(255,255,255,0.7)" : "#64748b", 
                    mt: 1 
                  }}
                >
                  {completedChecklistItems} of {totalChecklistItems} items completed • {completedChecklists} of {totalChecklists} checklists done
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box 
                  sx={{ 
                    textAlign: "center",
                    p: 2,
                    borderRadius: 2,
                    background: isCompleted 
                      ? "rgba(255,255,255,0.1)" 
                      : checklistCompletionPercentage === 100 
                        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" 
                        : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"
                  }}
                >
                  {checklistCompletionPercentage === 100 ? (
                    <>
                      <CheckCircleOutlineIcon sx={{ fontSize: 40, color: "white" }} />
                      <Typography variant="h6" fontWeight="bold" sx={{ color: "white", mt: 1 }}>
                        All Tasks Complete!
                      </Typography>
                    </>
                  ) : (
                    <>
                      <PendingActionsIcon sx={{ fontSize: 40, color: "white" }} />
                      <Typography variant="h6" fontWeight="bold" sx={{ color: "white", mt: 1 }}>
                        {pendingChecklistItems} Tasks Remaining
                      </Typography>
                    </>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Additional Info Row */}
          {(detail?.assignee || detail?.trackId || workSummary?.sessionCount) && (
            <Box 
              sx={{ 
                mt: 2, 
                pt: 2, 
                borderTop: isCompleted ? "1px solid rgba(255,255,255,0.2)" : "1px solid #e2e8f0",
                display: "flex",
                flexWrap: "wrap",
                gap: 3
              }}
            >
              {detail?.trackId && (
                <Box>
                  <Typography variant="caption" sx={{ color: isCompleted ? "rgba(255,255,255,0.7)" : "#64748b" }}>
                    Track ID
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" sx={{ color: isCompleted ? "white" : "#1e293b" }}>
                    {detail.trackId}
                  </Typography>
                </Box>
              )}
              {detail?.assignee && (
                <Box>
                  <Typography variant="caption" sx={{ color: isCompleted ? "rgba(255,255,255,0.7)" : "#64748b" }}>
                    Assigned To
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" sx={{ color: isCompleted ? "white" : "#1e293b" }}>
                    {detail.assignee}
                  </Typography>
                </Box>
              )}
              {workSummary?.sessionCount > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: isCompleted ? "rgba(255,255,255,0.7)" : "#64748b" }}>
                    Work Sessions
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" sx={{ color: isCompleted ? "white" : "#1e293b" }}>
                    {workSummary.sessionCount} ({workSummary.completedSessions || 0} completed)
                  </Typography>
                </Box>
              )}
              {detail?.submissionStatus && (
                <Box>
                  <Typography variant="caption" sx={{ color: isCompleted ? "rgba(255,255,255,0.7)" : "#64748b" }}>
                    Status
                  </Typography>
                  <Chip 
                    label={detail.submissionStatus} 
                    size="small"
                    sx={{ 
                      mt: 0.5,
                      bgcolor: isCompleted 
                        ? "rgba(255,255,255,0.25)" 
                        : detail.submissionStatus === "PendingApproval" 
                          ? "#fef3c7" 
                          : "#f1f5f9",
                      color: isCompleted 
                        ? "white" 
                        : detail.submissionStatus === "PendingApproval" 
                          ? "#92400e" 
                          : "#475569",
                      fontWeight: 600
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Work Session Card - Hide if completed */}
      {!isCompleted && (
        <Card sx={{ mb: 3, border: isWorkActive ? '2px solid' : 'none', borderColor: workSummary?.currentStatus === 'Started' ? 'success.main' : 'warning.main' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <TimerIcon color={isWorkActive ? "primary" : "disabled"} sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color={isWorkActive ? "primary" : "textSecondary"}>
                    {formatDuration(liveTimer)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {workSummary?.currentStatus === "Started" && "Work in Progress..."}
                    {workSummary?.currentStatus === "Held" && "Work on Hold"}
                    {workSummary?.currentStatus === "Completed" && "Work Completed"}
                    {(!workSummary?.currentStatus || workSummary?.currentStatus === "NotStarted") && "Not Started"}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" gap={1} flexWrap="wrap">
                {/* Start Button - Show when not started or completed */}
                {(!workSummary?.currentStatus || workSummary?.currentStatus === "NotStarted" || workSummary?.currentStatus === "Completed") && !isPendingApproval && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleStartWork}
                    disabled={sessionLoading}
                    size="large"
                  >
                    Start Work
                  </Button>
                )}

                {/* Hold Button - Show when started */}
                {workSummary?.currentStatus === "Started" && (
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<PauseIcon />}
                    onClick={handleHoldWork}
                    disabled={sessionLoading}
                    size="large"
                  >
                    Hold
                  </Button>
                )}

                {/* Resume Button - Show when held */}
                {workSummary?.currentStatus === "Held" && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleResumeWork}
                    disabled={sessionLoading}
                    size="large"
                  >
                    Resume
                  </Button>
                )}

                {/* End Button - Show when started or held */}
                {(workSummary?.currentStatus === "Started" || workSummary?.currentStatus === "Held") && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<StopIcon />}
                    onClick={handleEndWork}
                    disabled={sessionLoading}
                    size="large"
                  >
                    End Work
                  </Button>
                )}
              </Box>
            </Box>

            {/* Work Summary Stats */}
            {workSummary && (workSummary.totalWorkDuration > 0 || workSummary.totalHoldDuration > 0) && (
              <Box mt={2} pt={2} borderTop="1px solid #eee">
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="textSecondary">Work Time</Typography>
                    <Typography variant="h6" color="success.main">
                      {workSummary.formattedWorkDuration || "0s"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="textSecondary">Hold Time</Typography>
                    <Typography variant="h6" color="warning.main">
                      {workSummary.formattedHoldDuration || "0s"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="textSecondary">Total Time</Typography>
                    <Typography variant="h6">
                      {workSummary.formattedTotalDuration || "0s"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="textSecondary">Sessions</Typography>
                    <Typography variant="h6">
                      {workSummary.sessionCount || 0} ({workSummary.completedSessions || 0} completed)
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Alert when work not started */}
            {(!workSummary?.currentStatus || workSummary?.currentStatus === "NotStarted") && !isPendingApproval && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Click "Start Work" to begin. You can only tick checklist items after starting work.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Technician Assignment Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <PersonIcon color="primary" />
            <Typography variant="h6">Technician Assignment</Typography>
          </Box>
          
          {isReadOnly ? (
            <Typography variant="body1">
              <strong>Assigned Technician:</strong> {detail.assignee || detail.assignedTechnicianName || "Not assigned"}
            </Typography>
          ) : (
            <Box display="flex" alignItems="center" gap={2}>
              <FormControl sx={{ minWidth: 250 }} size="small">
                <InputLabel>Select Technician</InputLabel>
                <Select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  label="Select Technician"
                  disabled={isReadOnly}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {technicians.map((tech) => (
                    <MenuItem key={tech.id} value={tech.id}>
                      {tech.fullName || tech.userName || tech.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleAssignTechnician}
                disabled={!selectedTechnician || assigningTechnician || isReadOnly}
              >
                {assigningTechnician ? "Assigning..." : "Assign"}
              </Button>
              {detail.assignee && (
                <Chip 
                  label={`Current: ${detail.assignee}`} 
                  color="primary" 
                  variant="outlined"
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center">
              <IconButton onClick={goBack} sx={{ mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6">Summary</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={detail.submissionStatus || "Draft"}
                size="small"
                color={isCompleted ? "success" : isPendingApproval ? "warning" : "default"}
              />
              <Chip
                label={detail.source === "Excel" ? "Excel Import" : "Manual Entry"}
                size="small"
                color={detail.source === "Excel" ? "primary" : "default"}
                variant="outlined"
              />
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">Track ID</Typography>
              <Typography variant="body1" fontWeight="medium">{detail.trackId || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">Model Year</Typography>
              <Typography variant="body1" fontWeight="medium">{detail.modelYear || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">Manufacturer ID</Typography>
              <Typography variant="body1" fontWeight="medium">{detail.manufacturerId || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">Model ID</Typography>
              <Typography variant="body1" fontWeight="medium">{detail.modelId || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Equipment Description</Typography>
              <Typography variant="body1" fontWeight="medium">{detail.equipmentDescription || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">License Number</Typography>
              <Typography variant="body1" fontWeight="medium">{detail.licenseNumber || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">Serial Number</Typography>
              <Typography variant="body1" fontWeight="medium">{detail.serialNumber || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">Meter Reading</Typography>
              <Typography variant="body1" fontWeight="medium">{detail.latestMeter1Reading || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">Assignee</Typography>
              <Typography variant="body1" fontWeight="medium">{detail.assignee || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">Task Complete</Typography>
              <Typography variant="body1" fontWeight="medium">
                {detail.taskCompletePercentage != null ? `${detail.taskCompletePercentage}%` : "-"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">Status</Typography>
              <Typography variant="body1" fontWeight="medium">{detail.status || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">Status Code</Typography>
              <Typography variant="body1" fontWeight="medium">{detail.statusCode || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">Date Completed</Typography>
              <Typography variant="body1" fontWeight="medium">
                {detail.dateCompleted ? formatDate(detail.dateCompleted) : "-"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">Created Date</Typography>
              <Typography variant="body1" fontWeight="medium">{formatDate(detail.createdOn)}</Typography>
            </Grid>
            {detail.notes && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Notes</Typography>
                <Typography variant="body1">{detail.notes}</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Signature Section - Show when pending approval or completed */}
      {(isPendingApproval || isCompleted) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <DrawIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              E-Signatures
            </Typography>
            
            <Grid container spacing={3}>
              {/* Technician Signature */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Technician Signature
                  </Typography>
                  {detail.technicianSignature ? (
                    <Box>
                      <img 
                        src={detail.technicianSignature} 
                        alt="Technician Signature" 
                        style={{ maxWidth: '100%', maxHeight: 150, border: '1px solid #ddd' }} 
                      />
                      <Typography variant="caption" display="block" mt={1}>
                        Signed on: {detail.technicianSignedOn ? formatDate(detail.technicianSignedOn) : "-"}
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Typography color="textSecondary" sx={{ mb: 2 }}>Not signed yet</Typography>
                      {!isCompleted && (
                        <Button 
                          variant="outlined" 
                          startIcon={<DrawIcon />}
                          onClick={() => handleOpenSignatureModal("Technician")}
                        >
                          Add Signature
                        </Button>
                      )}
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Authorized Person Signature */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Authorized Person Signature
                  </Typography>
                  {detail.adminSignature ? (
                    <Box>
                      <img 
                        src={detail.adminSignature} 
                        alt="Authorized Person Signature" 
                        style={{ maxWidth: '100%', maxHeight: 150, border: '1px solid #ddd' }} 
                      />
                      <Typography variant="caption" display="block" mt={1}>
                        Signed on: {detail.adminSignedOn ? formatDate(detail.adminSignedOn) : "-"}
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Typography color="textSecondary" sx={{ mb: 2 }}>Not signed yet</Typography>
                      {!isCompleted && (
                        <Button 
                          variant="outlined" 
                          startIcon={<DrawIcon />}
                          onClick={() => handleOpenSignatureModal("Admin")}
                        >
                          Add Signature
                        </Button>
                      )}
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>

            {/* Final Submit Button */}
            {isPendingApproval && detail.technicianSignature && detail.adminSignature && (
              <Box mt={3} textAlign="center">
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<DoneAllIcon />}
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Completing..." : "Complete & Submit"}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Checklists Card */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Checklists
              {isReadOnly && <LockIcon sx={{ ml: 1, fontSize: 18, color: 'text.secondary' }} />}
            </Typography>
            <Box display="flex" gap={1}>
              {!isReadOnly && !isPendingApproval && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenChecklistModal()}
                >
                  Add Checklist
                </Button>
              )}
              {/* Submit to Admin Button - Show when all items completed and status is Draft */}
              {!isReadOnly && !isPendingApproval && getAllItemsCompleted() && checklists.length > 0 && detail.submissionStatus === "Draft" && (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<SendIcon />}
                  onClick={handleOpenSubmitModal}
                >
                  Submit to Admin
                </Button>
              )}
            </Box>
          </Box>

          {checklists.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">
                {isReadOnly ? "No checklists were created for this work." : 'No checklists yet. Click "Add Checklist" to create one.'}
              </Typography>
            </Box>
          ) : (
            <Box>
              {checklists.map((checklist) => (
                <Paper key={checklist.id} variant="outlined" sx={{ mb: 2, overflow: "hidden" }}>
                  {/* Checklist Header */}
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "#f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box display="flex" alignItems="center" flex={1}>
                      <IconButton
                        size="small"
                        onClick={() => toggleChecklistExpand(checklist.id)}
                      >
                        {expandedChecklists[checklist.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      <Box ml={1} flex={1}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {checklist.title}
                        </Typography>
                        {checklist.description && (
                          <Typography variant="body2" color="textSecondary">
                            {checklist.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 100, mr: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                          {getChecklistProgress(checklist)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={getChecklistProgress(checklist)}
                          sx={{ height: 6, borderRadius: 3 }}
                          color={getChecklistProgress(checklist) === 100 ? "success" : "primary"}
                        />
                      </Box>
                      {!isReadOnly && !isPendingApproval && (
                        <>
                          <Tooltip title="Add Item">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenItemModal(checklist.id)}
                            >
                              <AddIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Checklist">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenChecklistModal(checklist)}
                            >
                              <EditIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Checklist">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick("checklist", checklist.id)}
                            >
                              <DeleteOutlineIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>

                  {/* Checklist Items */}
                  <Collapse in={expandedChecklists[checklist.id]}>
                    <Divider />
                    <List disablePadding>
                      {(!checklist.items || checklist.items.length === 0) ? (
                        <ListItem>
                          <ListItemText
                            primary={
                              <Typography color="textSecondary" variant="body2">
                                {isReadOnly ? "No items in this checklist." : "No items. Click the + button to add sub-items."}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ) : (
                        checklist.items.map((item) => (
                          <Box
                            key={item.id}
                            sx={{
                              bgcolor: item.isCompleted ? "action.hover" : "transparent",
                              borderBottom: "1px solid #eee",
                              p: 2,
                            }}
                          >
                            {/* Item Header with Title and Actions */}
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={item.itemType !== "Checkbox" ? 1 : 0}>
                              <Box display="flex" alignItems="center" flex={1}>
                                {/* Checkbox Type */}
                                {(!item.itemType || item.itemType === "Checkbox") && (
                                  <Tooltip title={isReadOnly ? "" : (workSummary?.currentStatus !== "Started" ? "Start work to tick items" : "")}>
                                    <span>
                                      <Checkbox
                                        checked={item.isCompleted}
                                        onChange={(e) => handleToggleItem(item.id, e.target.checked)}
                                        icon={<RadioButtonUncheckedIcon />}
                                        checkedIcon={<CheckCircleIcon color="success" />}
                                        disabled={isReadOnly || isPendingApproval || workSummary?.currentStatus !== "Started"}
                                      />
                                    </span>
                                  </Tooltip>
                                )}
                                
                                {/* Type Icon for non-checkbox items */}
                                {item.itemType && item.itemType !== "Checkbox" && (
                                  <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                                    {item.itemType === "Radio" && <RadioButtonCheckedIcon color={item.isCompleted ? "success" : "action"} />}
                                    {item.itemType === "Dropdown" && <ArrowDropDownCircleIcon color={item.isCompleted ? "success" : "action"} />}
                                    {item.itemType === "Image" && <ImageIcon color={item.isCompleted ? "success" : "action"} />}
                                  </Box>
                                )}
                                
                                <Box flex={1}>
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      textDecoration: item.isCompleted ? "line-through" : "none",
                                      opacity: item.isCompleted ? 0.7 : 1,
                                    }}
                                  >
                                    {item.title}
                                    {item.isRequired && <Chip label="Required" size="small" color="error" variant="outlined" sx={{ ml: 1, height: 20 }} />}
                                  </Typography>
                                  {item.description && (
                                    <Typography variant="caption" color="textSecondary">
                                      {item.description}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                              
                              {!isReadOnly && !isPendingApproval && (
                                <Box>
                                  <Tooltip title="Edit Item">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenItemModal(checklist.id, item)}
                                    >
                                      <EditIcon fontSize="inherit" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete Item">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteClick("item", item.id)}
                                    >
                                      <DeleteOutlineIcon fontSize="inherit" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              )}
                            </Box>

                            {/* Radio Buttons */}
                            {item.itemType === "Radio" && item.optionsList && item.optionsList.length > 0 && (
                              <Box sx={{ ml: 4, mt: 1 }}>
                                <RadioGroup
                                  value={item.selectedValue || ""}
                                  onChange={(e) => handleUpdateItemValue(item.id, e.target.value)}
                                >
                                  {item.optionsList.map((option, idx) => (
                                    <FormControlLabel
                                      key={idx}
                                      value={option}
                                      control={<Radio size="small" />}
                                      label={option}
                                      disabled={isReadOnly || isPendingApproval || workSummary?.currentStatus !== "Started"}
                                    />
                                  ))}
                                </RadioGroup>
                              </Box>
                            )}

                            {/* Dropdown */}
                            {item.itemType === "Dropdown" && item.optionsList && item.optionsList.length > 0 && (
                              <Box sx={{ ml: 4, mt: 1, maxWidth: 300 }}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Select an option</InputLabel>
                                  <Select
                                    value={item.selectedValue || ""}
                                    label="Select an option"
                                    onChange={(e) => handleUpdateItemValue(item.id, e.target.value)}
                                    disabled={isReadOnly || isPendingApproval || workSummary?.currentStatus !== "Started"}
                                  >
                                    <MenuItem value="">
                                      <em>None</em>
                                    </MenuItem>
                                    {item.optionsList.map((option, idx) => (
                                      <MenuItem key={idx} value={option}>
                                        {option}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Box>
                            )}

                            {/* Image Upload */}
                            {item.itemType === "Image" && (
                              <Box sx={{ ml: 4, mt: 1 }}>
                                {item.imageUrl ? (
                                  <Box>
                                    <img
                                      src={item.imageUrl}
                                      alt={item.title}
                                      style={{
                                        maxWidth: "100%",
                                        maxHeight: 200,
                                        borderRadius: 8,
                                        border: "1px solid #ddd",
                                      }}
                                    />
                                    {!isReadOnly && !isPendingApproval && workSummary?.currentStatus === "Started" && (
                                      <Box mt={1}>
                                        <Button
                                          variant="outlined"
                                          size="small"
                                          startIcon={<CloudUploadIcon />}
                                          component="label"
                                        >
                                          Replace Image
                                          <input
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            onChange={(e) => handleImageUpload(item.id, e)}
                                          />
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
                                      bgcolor: "#fafafa",
                                    }}
                                  >
                                    <CloudUploadIcon sx={{ fontSize: 40, color: "#aaa", mb: 1 }} />
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                      {isReadOnly || isPendingApproval || workSummary?.currentStatus !== "Started"
                                        ? "No image uploaded"
                                        : "Click to upload an image"}
                                    </Typography>
                                    {!isReadOnly && !isPendingApproval && workSummary?.currentStatus === "Started" && (
                                      <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<CloudUploadIcon />}
                                        component="label"
                                      >
                                        Upload Image
                                        <input
                                          type="file"
                                          accept="image/*"
                                          hidden
                                          onChange={(e) => handleImageUpload(item.id, e)}
                                        />
                                      </Button>
                                    )}
                                  </Box>
                                )}
                              </Box>
                            )}
                          </Box>
                        ))
                      )}
                    </List>
                  </Collapse>
                </Paper>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Checklist Modal */}
      <Dialog open={checklistModalOpen} onClose={handleCloseChecklistModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {editingChecklist ? "Edit Checklist" : "Add Checklist"}
            </Typography>
            <IconButton onClick={handleCloseChecklistModal}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Checklist Title"
            value={checklistTitle}
            onChange={(e) => setChecklistTitle(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ mb: 2 }}
            autoFocus
          />
          <TextField
            fullWidth
            label="Description (optional)"
            value={checklistDescription}
            onChange={(e) => setChecklistDescription(e.target.value)}
            variant="outlined"
            size="small"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseChecklistModal} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveChecklist}
            variant="contained"
            disabled={savingChecklist}
          >
            {savingChecklist ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Checklist Item Modal */}
      <Dialog open={itemModalOpen} onClose={handleCloseItemModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {editingItem ? "Edit Item" : "Add Item"}
            </Typography>
            <IconButton onClick={handleCloseItemModal}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Item Title"
            value={itemTitle}
            onChange={(e) => setItemTitle(e.target.value)}
            variant="outlined"
            size="small"
            autoFocus
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Description (optional)"
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            variant="outlined"
            size="small"
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />

          {/* Item Type Selection */}
          <FormControl component="fieldset" sx={{ mb: 2, width: "100%" }}>
            <FormLabel component="legend" sx={{ mb: 1 }}>Item Type</FormLabel>
            <Box display="flex" gap={1} flexWrap="wrap">
              {[
                { value: "Checkbox", label: "Checkbox", icon: <CheckCircleIcon fontSize="small" /> },
                { value: "Radio", label: "Radio Buttons", icon: <RadioButtonCheckedIcon fontSize="small" /> },
                { value: "Dropdown", label: "Dropdown", icon: <ArrowDropDownCircleIcon fontSize="small" /> },
                { value: "Image", label: "Image Upload", icon: <ImageIcon fontSize="small" /> },
              ].map((type) => (
                <Chip
                  key={type.value}
                  icon={type.icon}
                  label={type.label}
                  onClick={() => setItemType(type.value)}
                  color={itemType === type.value ? "primary" : "default"}
                  variant={itemType === type.value ? "filled" : "outlined"}
                  sx={{ cursor: "pointer" }}
                />
              ))}
            </Box>
          </FormControl>

          {/* Options for Radio/Dropdown */}
          {(itemType === "Radio" || itemType === "Dropdown") && (
            <Box sx={{ mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Options {itemType === "Radio" ? "(Radio Buttons)" : "(Dropdown)"}
              </Typography>
              
              {/* Add new option */}
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add an option..."
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAddOption}
                  disabled={!newOption.trim()}
                >
                  Add
                </Button>
              </Box>

              {/* Options list */}
              {itemOptions.length > 0 ? (
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {itemOptions.map((option, index) => (
                    <Chip
                      key={index}
                      label={option}
                      onDelete={() => handleRemoveOption(index)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No options added yet. Add at least 2 options.
                </Typography>
              )}
            </Box>
          )}

          {/* Image type info */}
          {itemType === "Image" && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Users will be able to upload an image for this item. Supported formats: JPG, PNG, GIF. Max size: 5MB.
            </Alert>
          )}

          {/* Required checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={itemIsRequired}
                onChange={(e) => setItemIsRequired(e.target.checked)}
              />
            }
            label="This item is required"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseItemModal} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveItem}
            variant="contained"
            disabled={savingItem}
          >
            {savingItem ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete this {deleteType}?
            {deleteType === "checklist" && " All sub-items will also be deleted."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit to Admin Modal */}
      <Dialog open={submitModalOpen} onClose={() => setSubmitModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Work Summary - Submit to Admin</Typography>
            <IconButton onClick={() => setSubmitModalOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {submissionSummary && (
            <Box>
              {/* Work Details */}
              <Typography variant="h6" gutterBottom>Work Details</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Track ID</Typography>
                  <Typography variant="body1">{submissionSummary.workTrackDetail?.trackId || "-"}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Serial Number</Typography>
                  <Typography variant="body1">{submissionSummary.workTrackDetail?.serialNumber || "-"}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Customer</Typography>
                  <Typography variant="body1">{submissionSummary.workTrackDetail?.workTrackCustomerName || "-"}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Project</Typography>
                  <Typography variant="body1">{submissionSummary.workTrackDetail?.workTrackProjectName || "-"}</Typography>
                </Grid>
              </Grid>

              {/* Completion Stats */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h4" color="primary">
                      {submissionSummary.completionPercentage || 0}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Completion Rate
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="h6">
                      {submissionSummary.completedChecklistItems || 0} / {submissionSummary.totalChecklistItems || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Tasks Completed
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Checklist Summary */}
              <Typography variant="h6" gutterBottom>Checklist Summary</Typography>
              {submissionSummary.checklistSummary?.map((checklist) => (
                <Paper key={checklist.checklistId} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {checklist.checklistTitle}
                    </Typography>
                    <Chip 
                      label={`${checklist.completedItems}/${checklist.totalItems}`}
                      color={checklist.completedItems === checklist.totalItems ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                  <List dense>
                    {checklist.items?.map((item) => (
                      <ListItem key={item.id} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          {item.isCompleted ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <RadioButtonUncheckedIcon fontSize="small" />
                          )}
                        </ListItemIcon>
                        <ListItemText primary={item.title} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmitToAdmin}
            variant="contained"
            color="primary"
            disabled={submitting}
            startIcon={<SendIcon />}
          >
            {submitting ? "Submitting..." : "Submit to Admin"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Signature Modal */}
      <Dialog open={signatureModalOpen} onClose={() => setSignatureModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{signatureType === "Admin" ? "Authorized Person" : signatureType} Signature</Typography>
            <IconButton onClick={() => setSignatureModalOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Please draw your signature in the box below:
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              border: '2px dashed #ccc', 
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <SignatureCanvas
              ref={signatureType === "Technician" ? technicianSigRef : adminSigRef}
              canvasProps={{
                width: 500,
                height: 200,
                className: "signature-canvas",
                style: { width: '100%', height: '200px' }
              }}
              backgroundColor="white"
            />
          </Paper>
          <Box mt={2}>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => {
                const sigRef = signatureType === "Technician" ? technicianSigRef : adminSigRef;
                sigRef.current?.clear();
              }}
            >
              Clear
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignatureModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveSignature}
            variant="contained"
            disabled={savingSignature}
          >
            {savingSignature ? "Saving..." : "Save Signature"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

import React, { useEffect, useState, useRef } from "react";
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
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import * as XLSX from "xlsx";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Checkbox from "@mui/material/Checkbox";
import LinearProgress from "@mui/material/LinearProgress";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DescriptionIcon from "@mui/icons-material/Description";
import TableChartIcon from "@mui/icons-material/TableChart";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";
import { Search, StyledInputBase } from "@/styles/main/search-styles";

export default function EditWorkTrack() {
  const router = useRouter();
  const { id } = router.query;
  const hasFetched = useRef(false);

  const [loading, setLoading] = useState(true);
  const [workTrackData, setWorkTrackData] = useState(null);
  const [details, setDetails] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailToDelete, setDetailToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("All"); // "All", "Manual", "Excel"
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewTab, setPreviewTab] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [confirmingUpload, setConfirmingUpload] = useState(false);
  const [replaceDuplicates, setReplaceDuplicates] = useState(false);
  const [showErrorEntries, setShowErrorEntries] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef(null);

  // Debug: Log when dialog state changes
  useEffect(() => {
    console.log("Preview dialog open:", previewDialogOpen);
    console.log("Preview data:", previewData);
  }, [previewDialogOpen, previewData]);

  // Fetch work track data and its details
  useEffect(() => {
    if (!id) return;
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      try {
        // Fetch work track info
        const workTrackResponse = await fetch(`${BASE_URL}/WorkTrack/GetWorkTrackById?id=${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const workTrackResult = await workTrackResponse.json();
        
        let workTrack = null;
        if (workTrackResult?.data) {
          workTrack = workTrackResult.data;
        } else if (workTrackResult?.result) {
          workTrack = workTrackResult.result;
        } else if (workTrackResult && workTrackResult.id) {
          workTrack = workTrackResult;
        }

        if (workTrack && workTrack.id) {
          setWorkTrackData(workTrack);
        } else {
          toast("Work track not found", { type: "error" });
          return;
        }

        // Fetch details
        await fetchDetails();
      } catch (error) {
        console.error("Error fetching data:", error);
        toast("Failed to load work track", { type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const fetchDetails = async () => {
    try {
      console.log("Fetching details for workTrackId:", id);
      const response = await fetch(`${BASE_URL}/WorkTrackDetail/GetAllDetailsByWorkTrackId?workTrackId=${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();
      console.log("Fetch details result:", result);
      
      // Handle different response formats
      let detailsData = null;
      if (result?.data && Array.isArray(result.data)) {
        detailsData = result.data;
      } else if (result?.data?.items && Array.isArray(result.data.items)) {
        detailsData = result.data.items;
      } else if (Array.isArray(result)) {
        detailsData = result;
      } else if (result?.result && Array.isArray(result.result)) {
        detailsData = result.result;
      }
      
      if (detailsData) {
        console.log("Setting details:", detailsData);
        setDetails(detailsData);
      } else {
        console.log("No details found, setting empty array");
        setDetails([]);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
      setDetails([]);
    }
  };

  const handleOpenForm = (detail = null) => {
    setEditingDetail(detail);
    setFormModalOpen(true);
  };

  const handleCloseForm = () => {
    setFormModalOpen(false);
    setEditingDetail(null);
  };

  const handleDeleteClick = (detail) => {
    setDetailToDelete(detail);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!detailToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`${BASE_URL}/WorkTrackDetail/DeleteWorkTrackDetail?id=${detailToDelete.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const result = await response.json();
      if (result?.status === 1) {
        await fetchDetails();
        toast("Form deleted successfully!", { type: "success", autoClose: 3000 });
      } else {
        toast(result?.message || "Failed to delete form", { type: "error", autoClose: 3000 });
      }
    } catch (error) {
      toast("Failed to delete form", { type: "error", autoClose: 3000 });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDetailToDelete(null);
    }
  };

  const handleFormSubmit = async (values, { resetForm }) => {
    try {
      setSubmitting(true);

      const payload = {
        workTrackId: parseInt(id),
        trackId: values.trackId || null,
        manufacturerId: values.manufacturerId || null,
        modelYear: values.modelYear || null,
        modelId: values.modelId || null,
        equipmentDescription: values.equipmentDescription || null,
        licenseNumber: values.licenseNumber || null,
        latestMeter1Reading: values.latestMeter1Reading ? parseFloat(values.latestMeter1Reading) : null,
        serialNumber: values.serialNumber || null,
        statusCode: values.statusCode || null,
        status: values.status || null,
        dateCompleted: values.dateCompleted ? values.dateCompleted.toISOString() : null,
        mac: values.mac || null,
        sim: values.sim || null,
        ssid: values.ssid || null,
        wifiKey: values.wifiKey || null,
        notes: values.notes || null,
        assignee: values.assignee || null,
        taskCompletePercentage: values.taskCompletePercentage ? parseFloat(values.taskCompletePercentage) : null,
      };

      let url = `${BASE_URL}/WorkTrackDetail/CreateWorkTrackDetail`;
      if (editingDetail) {
        payload.id = editingDetail.id;
        url = `${BASE_URL}/WorkTrackDetail/UpdateWorkTrackDetail`;
      }

      console.log("Submitting payload:", payload);
      console.log("URL:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("API Response:", result);
      console.log("Response status:", result?.status);

      // Check if save was successful (status can be 1 or "1" or true)
      const isSuccess = result?.status === 1 || result?.status === "1" || result?.status === true || response.ok;
      
      if (isSuccess && !result?.message?.toLowerCase().includes("fail")) {
        // Close the form first
        setFormModalOpen(false);
        setEditingDetail(null);
        resetForm();
        
        // Refresh the details list using the same fetchDetails function
        await fetchDetails();
        
        // Show success message
        alert("Form saved successfully!");
      } else {
        alert("Failed to save: " + (result?.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    router.push("/work-track");
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      alert("Please select a valid Excel file (.xlsx or .xls)");
      return;
    }

    try {
      setUploading(true);
      setSelectedFile(file);

      const formData = new FormData();
      formData.append("file", file);

      // First, get preview
      const response = await fetch(
        `${BASE_URL}/WorkTrackDetail/PreviewExcel?workTrackId=${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      const result = await response.json();
      console.log("Preview result:", result);
      console.log("Response status:", result?.status, "statusCode:", result?.statusCode);
      console.log("Response data:", result?.data);

      // Check multiple possible success indicators
      const isSuccess = result?.status === 1 || 
                       result?.statusCode === 1 || 
                       result?.status === "1" || 
                       (response.ok && (result?.data || result?.result));

      // Get data from different possible locations
      const previewData = result?.data || result?.result || result;

      if (isSuccess && previewData) {
        console.log("Setting preview data:", previewData);
        setPreviewData(previewData);
        setPreviewTab(0);
        setPreviewDialogOpen(true);
      } else {
        console.error("Preview failed:", result);
        // Still try to show the dialog if there's any data
        if (previewData) {
          console.log("Showing preview with error data:", previewData);
          setPreviewData(previewData);
          setPreviewTab(0);
          setPreviewDialogOpen(true);
        } else {
          alert(result?.message || "Failed to preview Excel file. Please check console for details.");
          setSelectedFile(null);
        }
      }
    } catch (error) {
      console.error("Preview error:", error);
      alert("Error previewing file: " + error.message);
      setSelectedFile(null);
    } finally {
      setUploading(false);
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !previewData?.validItems) {
      alert("No valid items to upload");
      return;
    }

    try {
      setConfirmingUpload(true);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `${BASE_URL}/WorkTrackDetail/UploadExcel?workTrackId=${id}&replaceDuplicates=${replaceDuplicates}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      const result = await response.json();
      console.log("Upload result:", result);

      // Check multiple possible success indicators
      const isSuccess = result?.status === 1 || 
                       result?.statusCode === 1 || 
                       result?.status === "1" || 
                       response.ok;

      if (isSuccess) {
        // Close preview dialog first
        setPreviewDialogOpen(false);
        setPreviewData(null);
        setSelectedFile(null);
        setReplaceDuplicates(false);
        setShowErrorEntries(false);
        
        // Switch to Excel filter to show the imported data
        setSourceFilter("Excel");
        
        // Refresh the details list to show newly imported data
        try {
          await fetchDetails();
          
          // Show success message after data is refreshed
          const message = result?.message || "Excel data imported successfully!";
          toast(message, { 
            type: "success", 
            autoClose: 3000,
            position: "top-right"
          });
        } catch (fetchError) {
          console.error("Error refreshing details:", fetchError);
          toast("Data imported but failed to refresh. Please refresh the page.", { 
            type: "warning", 
            autoClose: 5000 
          });
        }
      } else {
        toast(result?.message || "Failed to upload Excel file", { 
          type: "error", 
          autoClose: 3000 
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading file: " + error.message);
    } finally {
      setConfirmingUpload(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewDialogOpen(false);
    setPreviewData(null);
    setSelectedFile(null);
    setReplaceDuplicates(false);
    setShowErrorEntries(false);
    setPreviewTab(0);
  };

  const handleDownloadTemplate = () => {
    // Define the template columns based on WorkTrackDetail fields
    const templateHeaders = [
      "Track ID",
      "Manufacturer ID",
      "Model Year",
      "Model ID",
      "Equipment Description",
      "License Number",
      "Latest Meter 1 Reading",
      "Serial Number",
      "Status Code",
      "Status",
      "Date Completed",
      "MAC",
      "SIM",
      "SSID",
      "Wifi Key",
      "Notes",
      "Assignee",
      "Task Complete Percentage",
    ];

    // Create worksheet with headers and one example row
    const worksheetData = [
      templateHeaders,
      // Example row with sample data
      [
        "TRK-001",
        "MFR-001",
        "2024",
        "MDL-001",
        "Equipment description here",
        "LIC-12345",
        "1000",
        "SN-001",
        "ACTIVE",
        "In Progress",
        "2024-12-31",
        "AA:BB:CC:DD:EE:FF",
        "1234567890",
        "WiFi_Network",
        "password123",
        "Notes here",
        "John Doe",
        "50",
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_array ? 
      XLSX.utils.aoa_to_sheet(worksheetData) : 
      XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths for better readability
    worksheet["!cols"] = templateHeaders.map((header) => ({
      wch: Math.max(header.length + 5, 15),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "WorkTrack Template");

    // Download the file
    XLSX.writeFile(workbook, "WorkTrack_Upload_Template.xlsx");
    
    toast("Template downloaded successfully!", { type: "success", autoClose: 2000 });
  };

  const formInitialValues = {
    trackId: editingDetail?.trackId || "",
    manufacturerId: editingDetail?.manufacturerId || "",
    modelYear: editingDetail?.modelYear || "",
    modelId: editingDetail?.modelId || "",
    equipmentDescription: editingDetail?.equipmentDescription || "",
    licenseNumber: editingDetail?.licenseNumber || "",
    latestMeter1Reading: editingDetail?.latestMeter1Reading || "",
    serialNumber: editingDetail?.serialNumber || "",
    statusCode: editingDetail?.statusCode || "",
    status: editingDetail?.status || "",
    dateCompleted: editingDetail?.dateCompleted ? dayjs(editingDetail.dateCompleted) : null,
    mac: editingDetail?.mac || "",
    sim: editingDetail?.sim || "",
    ssid: editingDetail?.ssid || "",
    wifiKey: editingDetail?.wifiKey || "",
    notes: editingDetail?.notes || "",
    assignee: editingDetail?.assignee || "",
    taskCompletePercentage: editingDetail?.taskCompletePercentage || "",
  };

  // Filter details based on source filter
  const allForms = details;
  const manualForms = details.filter((d) => d.source === "Manual" || !d.source);
  const excelForms = details.filter((d) => d.source === "Excel");
  
  // Get forms based on source filter
  const getFilteredBySource = () => {
    if (sourceFilter === "Manual") return manualForms;
    if (sourceFilter === "Excel") return excelForms;
    return allForms; // "All"
  };
  
  // Filter by search term
  const filterBySearch = (forms) => {
    if (!searchTerm.trim()) return forms;
    const term = searchTerm.toLowerCase().trim();
    return forms.filter((form) => {
      return (
        (form.trackId && form.trackId.toLowerCase().includes(term)) ||
        (form.manufacturerId && form.manufacturerId.toLowerCase().includes(term)) ||
        (form.modelYear && form.modelYear.toLowerCase().includes(term)) ||
        (form.modelId && form.modelId.toLowerCase().includes(term)) ||
        (form.equipmentDescription && form.equipmentDescription.toLowerCase().includes(term)) ||
        (form.licenseNumber && form.licenseNumber.toLowerCase().includes(term)) ||
        (form.serialNumber && form.serialNumber.toLowerCase().includes(term)) ||
        (form.status && form.status.toLowerCase().includes(term)) ||
        (form.statusCode && form.statusCode.toLowerCase().includes(term)) ||
        (form.mac && form.mac.toLowerCase().includes(term)) ||
        (form.sim && form.sim.toLowerCase().includes(term)) ||
        (form.ssid && form.ssid.toLowerCase().includes(term)) ||
        (form.wifiKey && form.wifiKey.toLowerCase().includes(term)) ||
        (form.notes && form.notes.toLowerCase().includes(term))
      );
    });
  };
  
  const displayedForms = filterBySearch(getFilteredBySource());

  // Dashboard Statistics
  const totalItems = details.length;
  const completedItems = details.filter(d => d.taskCompletePercentage === 100).length;
  const pendingItems = details.filter(d => d.taskCompletePercentage !== 100).length;
  const inProgressItems = details.filter(d => d.taskCompletePercentage > 0 && d.taskCompletePercentage < 100).length;
  const notStartedItems = details.filter(d => !d.taskCompletePercentage || d.taskCompletePercentage === 0).length;
  
  // Calculate overall completion percentage
  const overallCompletion = totalItems > 0 
    ? Math.round(details.reduce((sum, d) => sum + (d.taskCompletePercentage || 0), 0) / totalItems) 
    : 0;
  
  // Calculate completion rate (completed / total * 100)
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!workTrackData) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="error" gutterBottom>
          Work Track data could not be loaded
        </Typography>
        <Button variant="contained" onClick={goBack}>
          Back to Work Track List
        </Button>
      </Box>
    );
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Work Track Forms</h1>
        <ul>
          <li>
            <Link href="/work-track/">Work Track</Link>
          </li>
          <li>Forms</li>
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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center">
              <IconButton onClick={goBack} sx={{ mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6">Work Track Information</Typography>
            </Box>
            <Box display="flex" gap={1}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleExcelUpload}
                accept=".xlsx,.xls"
                style={{ display: "none" }}
              />
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
                color="success"
              >
                Download Template
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload Excel"}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenForm()}
              >
                New Work Track Form
              </Button>
            </Box>
          </Box>

          {/* Show parent form info */}
          <Box sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Customer</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {workTrackData?.customerName || "Not specified"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Project</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {workTrackData?.projectName || "Not specified"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Remarks</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {workTrackData?.remarks || "No remarks"}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Summary Dashboard */}
      <Card sx={{ mb: 3, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <TrendingUpIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight="bold">
              Dashboard Summary
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {/* Total Items */}
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2.5, 
                  textAlign: "center", 
                  background: "rgba(255,255,255,0.15)", 
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.2)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.2)"
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: "50%", 
                    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                    boxShadow: "0 4px 15px rgba(59,130,246,0.4)"
                  }}
                >
                  <AssignmentIcon sx={{ color: "white", fontSize: 26 }} />
                </Box>
                <Typography variant="h3" fontWeight="bold" sx={{ color: "white", lineHeight: 1 }}>
                  {totalItems}
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
                  background: "rgba(255,255,255,0.15)", 
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.2)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.2)"
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: "50%", 
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                    boxShadow: "0 4px 15px rgba(16,185,129,0.4)"
                  }}
                >
                  <CheckCircleOutlineIcon sx={{ color: "white", fontSize: 26 }} />
                </Box>
                <Typography variant="h3" fontWeight="bold" sx={{ color: "#4ade80", lineHeight: 1 }}>
                  {completedItems}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontWeight: 500 }}>
                  Completed
                </Typography>
              </Paper>
            </Grid>

            {/* In Progress Items */}
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2.5, 
                  textAlign: "center", 
                  background: "rgba(255,255,255,0.15)", 
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.2)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.2)"
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: "50%", 
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                    boxShadow: "0 4px 15px rgba(245,158,11,0.4)"
                  }}
                >
                  <PendingActionsIcon sx={{ color: "white", fontSize: 26 }} />
                </Box>
                <Typography variant="h3" fontWeight="bold" sx={{ color: "#fbbf24", lineHeight: 1 }}>
                  {inProgressItems}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontWeight: 500 }}>
                  In Progress
                </Typography>
              </Paper>
            </Grid>

            {/* Not Started Items */}
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2.5, 
                  textAlign: "center", 
                  background: "rgba(255,255,255,0.15)", 
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.2)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.2)"
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: "50%", 
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                    boxShadow: "0 4px 15px rgba(239,68,68,0.4)"
                  }}
                >
                  <DescriptionIcon sx={{ color: "white", fontSize: 26 }} />
                </Box>
                <Typography variant="h3" fontWeight="bold" sx={{ color: "#f87171", lineHeight: 1 }}>
                  {notStartedItems}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontWeight: 500 }}>
                  Not Started
                </Typography>
              </Paper>
            </Grid>

            {/* Manual Forms */}
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2.5, 
                  textAlign: "center", 
                  background: "rgba(255,255,255,0.15)", 
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.2)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.2)"
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: "50%", 
                    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                    boxShadow: "0 4px 15px rgba(139,92,246,0.4)"
                  }}
                >
                  <EditIcon sx={{ color: "white", fontSize: 26 }} />
                </Box>
                <Typography variant="h3" fontWeight="bold" sx={{ color: "#a78bfa", lineHeight: 1 }}>
                  {manualForms.length}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontWeight: 500 }}>
                  Manual
                </Typography>
              </Paper>
            </Grid>

            {/* Excel Forms */}
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2.5, 
                  textAlign: "center", 
                  background: "rgba(255,255,255,0.15)", 
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.2)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.2)"
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: "50%", 
                    background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                    boxShadow: "0 4px 15px rgba(6,182,212,0.4)"
                  }}
                >
                  <TableChartIcon sx={{ color: "white", fontSize: 26 }} />
                </Box>
                <Typography variant="h3" fontWeight="bold" sx={{ color: "#22d3ee", lineHeight: 1 }}>
                  {excelForms.length}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontWeight: 500 }}>
                  Excel Import
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Overall Progress Section */}
          <Box 
            sx={{ 
              mt: 3, 
              p: 3, 
              background: "rgba(255,255,255,0.1)", 
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.15)"
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.9)", mb: 1.5, fontWeight: 600 }}>
                  Overall Task Completion
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={overallCompletion} 
                      sx={{ 
                        height: 12, 
                        borderRadius: 6,
                        backgroundColor: "rgba(255,255,255,0.2)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 6,
                          background: overallCompletion === 100 
                            ? "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
                            : overallCompletion >= 50 
                              ? "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)"
                              : "linear-gradient(90deg, #ef4444 0%, #f87171 100%)"
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: "white", minWidth: 60 }}>
                    {overallCompletion}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.9)", mb: 1.5, fontWeight: 600 }}>
                  Completion Rate
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={completionRate} 
                      sx={{ 
                        height: 12, 
                        borderRadius: 6,
                        backgroundColor: "rgba(255,255,255,0.2)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 6,
                          background: completionRate === 100 
                            ? "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
                            : completionRate >= 50 
                              ? "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)"
                              : "linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)"
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: "white", minWidth: 60 }}>
                    {completionRate}%
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5, display: "block" }}>
                  {completedItems} of {totalItems} items completed
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Forms Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
            <Typography variant="h6">Saved Forms ({displayedForms.length})</Typography>
            <Box display="flex" gap={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Filter by Source</InputLabel>
                <Select
                  value={sourceFilter}
                  label="Filter by Source"
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <MenuItem value="All">All ({allForms.length})</MenuItem>
                  <MenuItem value="Manual">Manual ({manualForms.length})</MenuItem>
                  <MenuItem value="Excel">Excel ({excelForms.length})</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ width: 300 }}>
                <Search className="search-form">
                  <StyledInputBase
                    placeholder="Search forms..."
                    inputProps={{ "aria-label": "search" }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Search>
              </Box>
            </Box>
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell>Source</TableCell>
                  <TableCell>Track ID</TableCell>
                  <TableCell>Model Year</TableCell>
                  <TableCell>Manufacturer ID</TableCell>
                  <TableCell>Model ID</TableCell>
                  <TableCell>Equipment Desc</TableCell>
                  <TableCell>License No</TableCell>
                  <TableCell>Meter Reading</TableCell>
                  <TableCell>Serial No</TableCell>
                  <TableCell>Assignee</TableCell>
                  <TableCell>Task Complete %</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedForms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} align="center">
                      <Typography color="textSecondary" py={3}>
                        {sourceFilter === "Manual" 
                          ? 'No manual forms found. Click "New Work Track Form" to add one.'
                          : sourceFilter === "Excel"
                          ? 'No forms imported from Excel found. Click "Upload Excel" to import.'
                          : 'No forms found. Click "New Work Track Form" to add one or "Upload Excel" to import.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedForms.map((detail) => (
                    <TableRow 
                      key={detail.id} 
                      hover 
                      onClick={() => router.push(`/work-track/detail/${detail.id}`)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>
                        <Chip 
                          label={detail.source === "Excel" ? "Excel" : "Manual"} 
                          size="small"
                          color={detail.source === "Excel" ? "primary" : "default"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{detail.trackId || "-"}</TableCell>
                      <TableCell>{detail.modelYear || "-"}</TableCell>
                      <TableCell>{detail.manufacturerId || "-"}</TableCell>
                      <TableCell>{detail.modelId || "-"}</TableCell>
                      <TableCell>{detail.equipmentDescription || "-"}</TableCell>
                      <TableCell>{detail.licenseNumber || "-"}</TableCell>
                      <TableCell>{detail.latestMeter1Reading || "-"}</TableCell>
                      <TableCell>{detail.serialNumber || "-"}</TableCell>
                      <TableCell>{detail.assignee || "-"}</TableCell>
                      <TableCell>{detail.taskCompletePercentage != null ? `${detail.taskCompletePercentage}%` : "-"}</TableCell>
                      <TableCell>{formatDate(detail.createdOn)}</TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenForm(detail);
                            }}
                          >
                            <EditIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(detail);
                            }}
                          >
                            <DeleteOutlineIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Form Modal */}
      <Dialog open={formModalOpen} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {editingDetail ? "Edit Work Track Form" : "New Work Track Form"}
            </Typography>
            <IconButton onClick={handleCloseForm}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Formik
            initialValues={formInitialValues}
            onSubmit={handleFormSubmit}
            enableReinitialize
          >
            {({ values, setFieldValue }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Track ID"
                      name="trackId"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Manufacturer ID"
                      name="manufacturerId"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Model Year"
                      name="modelYear"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Model ID"
                      name="modelId"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Equipment Description"
                      name="equipmentDescription"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="License Number"
                      name="licenseNumber"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Latest Meter 1 Reading"
                      name="latestMeter1Reading"
                      variant="outlined"
                      size="small"
                      type="number"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Serial Number"
                      name="serialNumber"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Status Code"
                      name="statusCode"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Status"
                      name="status"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Date Completed"
                        value={values.dateCompleted}
                        onChange={(date) => setFieldValue("dateCompleted", date)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            size="small"
                            variant="outlined"
                          />
                        )}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="MAC"
                      name="mac"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="SIM"
                      name="sim"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="SSID"
                      name="ssid"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Wifi Key"
                      name="wifiKey"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Assignee"
                      name="assignee"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Task Complete %"
                      name="taskCompletePercentage"
                      variant="outlined"
                      size="small"
                      type="number"
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Notes"
                      name="notes"
                      variant="outlined"
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                      <Button variant="outlined" onClick={handleCloseForm}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={submitting}
                      >
                        {submitting ? "Saving..." : "Save Form"}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Form</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to delete this form? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Excel Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={handleClosePreview} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { minHeight: "70vh" } }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Excel Import Preview</Typography>
            <IconButton onClick={handleClosePreview}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {uploading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>Processing Excel file...</Typography>
            </Box>
          ) : previewData ? (
            <>
              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#e3f2fd" }}>
                    <Typography variant="h4" color="primary">{previewData.totalItems || 0}</Typography>
                    <Typography variant="body2" color="textSecondary">Total Items</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#e8f5e9" }}>
                    <Typography variant="h4" sx={{ color: "success.main" }}>{previewData.validItems || 0}</Typography>
                    <Typography variant="body2" color="textSecondary">Valid Items</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#fff3e0" }}>
                    <Typography variant="h4" sx={{ color: "warning.main" }}>{previewData.duplicateItems || 0}</Typography>
                    <Typography variant="body2" color="textSecondary">Duplicates</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#ffebee" }}>
                    <Typography variant="h4" color="error">{previewData.invalidItems || 0}</Typography>
                    <Typography variant="body2" color="textSecondary">Invalid Items</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Options Section */}
              <Box sx={{ mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={replaceDuplicates}
                        onChange={(e) => setReplaceDuplicates(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          Replace Duplicates
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          When enabled, existing duplicate entries will be replaced with new ones. When disabled, only new entries will be uploaded.
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showErrorEntries}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setShowErrorEntries(checked);
                          // If disabling and currently on Invalid tab, switch to Valid tab
                          if (!checked && previewTab === 2) {
                            setPreviewTab(0);
                          }
                        }}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          Show Error Entries
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          When enabled, error entries will be displayed in the preview tabs.
                        </Typography>
                      </Box>
                    }
                  />
                </FormGroup>
              </Box>

              {/* Structure Errors Section */}
              {(previewData.hasStructureErrors || 
                (previewData.structureErrors && previewData.structureErrors.length > 0) || 
                (previewData.missingColumns && previewData.missingColumns.length > 0)) && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Paper sx={{ p: 2, bgcolor: "#fff3e0", border: "1px solid #ff9800" }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <WarningIcon color="warning" />
                      <Typography variant="h6" color="warning.main">
                        Excel File Structure Issues
                      </Typography>
                    </Box>
                    
                    {previewData.structureErrors && previewData.structureErrors.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Errors Found:
                        </Typography>
                        {(previewData.structureErrors || []).map((error, index) => (
                          <Box key={index} display="flex" alignItems="center" gap={1} sx={{ ml: 2, mb: 0.5 }}>
                            <ErrorIcon color="error" fontSize="small" />
                            <Typography variant="body2" color="error">{error}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {previewData.missingColumns && previewData.missingColumns.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Missing Columns:
                        </Typography>
                        {(previewData.missingColumns || []).map((col, index) => (
                          <Box key={index} display="flex" alignItems="center" gap={1} sx={{ ml: 2, mb: 0.5 }}>
                            <ErrorIcon color="error" fontSize="small" />
                            <Typography variant="body2" color="error">{col}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Box>
              )}

              {/* Expected Column Format */}
              {previewData.expectedColumns && previewData.expectedColumns.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography 
                    variant="subtitle2" 
                    color="primary" 
                    sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 0.5 }}
                    onClick={() => {
                      const el = document.getElementById("expected-columns-section");
                      if (el) el.style.display = el.style.display === "none" ? "block" : "none";
                    }}
                  >
                    📋 View Expected Excel Format (Click to expand/collapse)
                  </Typography>
                  <Box id="expected-columns-section" sx={{ display: "none", mt: 1 }}>
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Column #</TableCell>
                            <TableCell>Expected Header</TableCell>
                            <TableCell>Required</TableCell>
                            <TableCell>Found in File</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(previewData.expectedColumns || []).map((col, index) => {
                            const foundCol = (previewData.foundColumns || []).find(f => f.columnNumber === col.columnNumber);
                            return (
                              <TableRow key={index} hover>
                                <TableCell>{col.columnNumber}</TableCell>
                                <TableCell>{col.columnName}</TableCell>
                                <TableCell>
                                  {col.isRequired ? (
                                    <Chip label="Required" size="small" color="error" />
                                  ) : (
                                    <Chip label="Optional" size="small" variant="outlined" />
                                  )}
                                </TableCell>
                                <TableCell>
                                  {foundCol ? (
                                    foundCol.isFound ? (
                                      <Chip label={foundCol.columnName} size="small" color="success" />
                                    ) : (
                                      <Chip label="Empty Header" size="small" color="warning" />
                                    )
                                  ) : (
                                    <Chip label="Missing" size="small" color="error" />
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Preview Tabs */}
              <Tabs 
                value={previewTab} 
                onChange={(e, newValue) => setPreviewTab(newValue)}
                sx={{ mb: 2 }}
              >
                <Tab 
                  icon={<CheckCircleIcon color="success" />}
                  iconPosition="start"
                  label={`Valid (${previewData.validItems || 0})`}
                />
                <Tab 
                  icon={<WarningIcon color="warning" />}
                  iconPosition="start"
                  label={`Duplicates (${previewData.duplicateItems || 0})`}
                />
                {showErrorEntries && (
                  <Tab 
                    icon={<ErrorIcon color="error" />}
                    iconPosition="start"
                    label={`Invalid (${previewData.invalidItems || 0})`}
                  />
                )}
              </Tabs>

              {/* Valid Items Tab */}
              {previewTab === 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Row</TableCell>
                        <TableCell>Track ID</TableCell>
                        <TableCell>Manufacturer ID</TableCell>
                        <TableCell>Model Year</TableCell>
                        <TableCell>Model ID</TableCell>
                        <TableCell>Serial No</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(!previewData.validRows || previewData.validRows.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Typography color="textSecondary" py={2}>No valid items found</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        (previewData.validRows || []).map((row, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{row.rowNumber}</TableCell>
                            <TableCell>{row.trackId || "-"}</TableCell>
                            <TableCell>{row.manufacturerId || "-"}</TableCell>
                            <TableCell>{row.modelYear || "-"}</TableCell>
                            <TableCell>{row.modelId || "-"}</TableCell>
                            <TableCell>{row.serialNumber || "-"}</TableCell>
                            <TableCell>
                              <Chip label="Valid" size="small" color="success" />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Duplicate Items Tab */}
              {previewTab === 1 && (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Row</TableCell>
                        <TableCell>Track ID</TableCell>
                        <TableCell>Manufacturer ID</TableCell>
                        <TableCell>Model ID</TableCell>
                        <TableCell>Serial No</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(!previewData.duplicateRows || previewData.duplicateRows.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography color="textSecondary" py={2}>No duplicate items found</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        (previewData.duplicateRows || []).map((row, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{row.rowNumber}</TableCell>
                            <TableCell>{row.trackId || "-"}</TableCell>
                            <TableCell>{row.manufacturerId || "-"}</TableCell>
                            <TableCell>{row.modelId || "-"}</TableCell>
                            <TableCell>{row.serialNumber || "-"}</TableCell>
                            <TableCell>
                              <Chip 
                                label={row.duplicateReason || "Duplicate"} 
                                size="small" 
                                color="warning" 
                                sx={{ maxWidth: 200 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Invalid Items Tab */}
              {showErrorEntries && previewTab === 2 && (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Row</TableCell>
                        <TableCell>Track ID</TableCell>
                        <TableCell>Manufacturer ID</TableCell>
                        <TableCell>Model ID</TableCell>
                        <TableCell>Error</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(!previewData.invalidRows || previewData.invalidRows.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="textSecondary" py={2}>No invalid items found</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        (previewData.invalidRows || []).map((row, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{row.rowNumber}</TableCell>
                            <TableCell>{row.trackId || "-"}</TableCell>
                            <TableCell>{row.manufacturerId || "-"}</TableCell>
                            <TableCell>{row.modelId || "-"}</TableCell>
                            <TableCell>
                              <Chip 
                                label={row.validationError || "Invalid data"} 
                                size="small" 
                                color="error"
                                sx={{ maxWidth: 250 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {previewData.validItems === 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "#fff3e0", borderRadius: 1 }}>
                  <Typography color="warning.main">
                    ⚠️ No valid items to import. Please fix the issues in your Excel file and try again.
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography color="textSecondary">
                No preview data available. Please try uploading the file again.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClosePreview} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmUpload}
            variant="contained"
            color="primary"
            disabled={confirmingUpload || !previewData?.validItems}
            startIcon={<UploadFileIcon />}
          >
            {confirmingUpload 
              ? "Importing..." 
              : `Import ${previewData?.validItems || 0} Valid Items`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

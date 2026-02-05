import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "@/styles/PageTitle.module.css";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import { Box, Pagination, Chip, CircularProgress, Card, CardContent, useMediaQuery, useTheme, Tooltip, Avatar, Autocomplete, TextField } from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { ToastContainer, toast } from "react-toastify";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";

export default function TechnicianWorkTrackList() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  // All hooks must be called at the top, before any conditional returns
  const [currentUserId, setCurrentUserId] = useState(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [workTracks, setWorkTracks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Admin and technician filtering
  const [isAdmin, setIsAdmin] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [techniciansLoading, setTechniciansLoading] = useState(false);
  
  // Image preview dialog
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageDialogTitle, setImageDialogTitle] = useState("");
  
  // Map dialog
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [mapLocation, setMapLocation] = useState({ lat: null, lng: null });
  const [mapDialogTitle, setMapDialogTitle] = useState("");

  useEffect(() => {
    sessionStorage.setItem("category", "154"); // Work Track Technician
    const cId = sessionStorage.getItem("category");
    
    // Check if user is admin
    const userType = localStorage.getItem("type");
    const isAdminUser = userType === "1" || userType === "0" || userType === 1 || userType === 0;
    setIsAdmin(isAdminUser);
    
    // Check permissions
    const checkPermissions = async () => {
      try {
        const role = localStorage.getItem("role");
        if (!role || !cId) {
          setPermissionLoading(false);
          return;
        }

        const response = await fetch(`${BASE_URL}/User/GetModuleCategoryPermissions?roleId=${role}&categoryId=${cId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          const data = result?.result?.result || result?.result || result?.data || [];
          const canNavigate = data.some(item => item.permissionType === 1);
          setHasPermission(canNavigate);
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
      } finally {
        setPermissionLoading(false);
      }
    };

    checkPermissions();
    
    // Fetch technicians if admin
    if (isAdminUser) {
      fetchTechnicians();
    }
  }, []);

  // Fetch technicians list
  const fetchTechnicians = async () => {
    try {
      setTechniciansLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/WorkTrackDetail/GetTechnicians`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const techniciansList = data?.result || data?.data || [];
        setTechnicians(techniciansList);
      } else {
        toast.error("Failed to load technicians");
      }
    } catch (error) {
      console.error("Error fetching technicians:", error);
      toast.error("Error loading technicians");
    } finally {
      setTechniciansLoading(false);
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem("userid");
    if (userId) {
      const userIdNum = parseInt(userId, 10);
      if (!isNaN(userIdNum)) {
        setCurrentUserId(userIdNum);
      }
    }
  }, []);

  useEffect(() => {
    if (permissionLoading) return;
    if (!hasPermission) {
      setLoading(false);
      setWorkTracks([]);
      setTotalCount(0);
      return;
    }
    
    // For admin: use selectedTechnician, for technician: use currentUserId
    const technicianId = isAdmin && selectedTechnician ? selectedTechnician.id : currentUserId;
    
    if (!technicianId) {
      setLoading(false);
      if (isAdmin && !selectedTechnician) {
        // Admin hasn't selected a technician yet, show empty
        setWorkTracks([]);
        setTotalCount(0);
      }
      return;
    }
    
    const fetchWorkTracks = async () => {
      try {
        setLoading(true);
        const url = `${BASE_URL}/WorkTrackDetail/GetWorkTracksByTechnician?technicianId=${technicianId}&SkipCount=${(page - 1) * pageSize}&MaxResultCount=${pageSize}&Search=${encodeURIComponent(search || "")}`;
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        if (!response.ok) {
          toast("Failed to load work tracks", { type: "error" });
          setWorkTracks([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }

        const result = await response.json();
        let items = [];
        let total = 0;
        
        const resultData = result?.result || result?.Result;
        
        if (resultData) {
          const itemsArray = resultData.items || resultData.Items || resultData.result?.items || resultData.Result?.items;
          const totalCountValue = resultData.totalCount || resultData.TotalCount || resultData.result?.totalCount || resultData.Result?.TotalCount;
          
          if (Array.isArray(itemsArray)) {
            items = itemsArray;
            total = totalCountValue || items.length;
          } else if (Array.isArray(resultData)) {
            items = resultData;
            total = resultData.length;
          }
        }
        
        if (items.length === 0 && (result?.data || result?.Data)) {
          const dataProp = result.data || result.Data;
          const itemsArray = dataProp.items || dataProp.Items;
          const totalCountValue = dataProp.totalCount || dataProp.TotalCount;
          
          if (Array.isArray(itemsArray)) {
            items = itemsArray;
            total = totalCountValue || items.length;
          } else if (Array.isArray(dataProp)) {
            items = dataProp;
            total = dataProp.length;
          }
        }
        
        if (items.length === 0 && Array.isArray(result)) {
          items = result;
          total = result.length;
        }
        
        setWorkTracks(items);
        setTotalCount(total);
      } catch (error) {
        console.error("Error fetching work tracks:", error);
        toast("Failed to load work tracks", { type: "error" });
        setWorkTracks([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkTracks();
  }, [currentUserId, hasPermission, permissionLoading, page, pageSize, search, isAdmin, selectedTechnician]);

  if (permissionLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!hasPermission) {
    return <AccessDenied />;
  }

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleViewClick = (workTrackDetail) => {
    router.push(`/work-track/technician/${workTrackDetail.id}`);
  };

  const handleTechnicianChange = (event, newValue) => {
    setSelectedTechnician(newValue);
    setPage(1); // Reset to first page when technician changes
  };

  // Format time for display
  const formatTime = (dateTime) => {
    if (!dateTime) return "-";
    const date = new Date(dateTime);
    return date.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true 
    });
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "-";
    const date = new Date(dateTime);
    return date.toLocaleString("en-US", { 
      month: "short",
      day: "numeric",
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true 
    });
  };

  // Open image preview dialog
  const handleImageClick = (imageUrl, title) => {
    if (!imageUrl) return;
    setSelectedImage(imageUrl);
    setImageDialogTitle(title);
    setImageDialogOpen(true);
  };

  // Open map dialog
  const handleLocationClick = (latitude, longitude, title) => {
    if (!latitude || !longitude) return;
    setMapLocation({ lat: latitude, lng: longitude });
    setMapDialogTitle(title);
    setMapDialogOpen(true);
  };

  // Open location in Google Maps (new tab)
  const openInGoogleMaps = () => {
    if (mapLocation.lat && mapLocation.lng) {
      window.open(
        `https://www.google.com/maps?q=${mapLocation.lat},${mapLocation.lng}`,
        "_blank"
      );
    }
  };

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>
          {isAdmin 
            ? (selectedTechnician 
                ? `Work Assignments - ${selectedTechnician.fullName || selectedTechnician.FullName || selectedTechnician.email || selectedTechnician.Email || "Technician"}`
                : "Technician Work Assignments")
            : "My Work Assignments"}
        </h1>
        <ul>
          <li>
            <Link href="/work-track/technician/">
              {isAdmin ? "Technician Work Assignments" : "My Work Assignments"}
            </Link>
          </li>
        </ul>
      </div>
      <ToastContainer />
      <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        {/* Admin: Technician Selection Dropdown */}
        {isAdmin && (
          <>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={technicians}
                getOptionLabel={(option) => option?.fullName || option?.FullName || option?.email || option?.Email || ""}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                value={selectedTechnician}
                onChange={handleTechnicianChange}
                loading={techniciansLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Technician"
                    placeholder="Search technician..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {techniciansLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                noOptionsText="No technicians found"
                loadingText="Loading technicians..."
              />
            </Grid>
            {selectedTechnician && (
              <Grid item xs={12} md={6} display="flex" alignItems="center" justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedTechnician(null);
                    setWorkTracks([]);
                    setTotalCount(0);
                    setPage(1);
                  }}
                >
                  Clear Selection
                </Button>
              </Grid>
            )}
          </>
        )}
        
        <Grid item xs={12} lg={isAdmin ? 6 : 6} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search work assignments..."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          {isMobile ? (
            // Mobile: Card View
            <Box>
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress size={24} />
                </Box>
              ) : (isAdmin && !selectedTechnician) ? (
                <Card>
                  <CardContent>
                    <Box textAlign="center" p={2}>
                      <Typography color="textSecondary" gutterBottom>
                        Please select a technician to view their work assignments
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ) : (!isAdmin && !currentUserId) ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <Typography color="textSecondary">Loading user information...</Typography>
                </Box>
              ) : workTracks.length === 0 ? (
                <Card>
                  <CardContent>
                    <Box textAlign="center" p={2}>
                      <Typography color="textSecondary" gutterBottom>
                        No work assignments available
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <Box>
                  {workTracks.map((workTrack) => {
                    const isCompleted = workTrack.submissionStatus === "Completed" || 
                                       (workTrack.taskCompletePercentage != null && workTrack.taskCompletePercentage >= 99.5);
                    return (
                    <Card 
                      key={workTrack.id} 
                      sx={{ 
                        mb: 2,
                        border: isCompleted ? '2px solid #22c55e' : 'none',
                        bgcolor: isCompleted ? '#f0fdf4' : 'background.paper'
                      }}
                    >
                      <CardContent>
                        <Box display="flex" flexDirection="column" gap={1.5}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box flex={1}>
                              <Typography variant="caption" color="textSecondary">Track ID</Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {workTrack.trackId || "-"}
                              </Typography>
                            </Box>
                            <Chip
                              label={isCompleted ? "Complete" : (workTrack.submissionStatus || "Draft")}
                              size="small"
                              color="success"
                              sx={{
                                bgcolor: isCompleted ? '#22c55e' : undefined,
                                color: isCompleted ? 'white' : undefined,
                              }}
                            />
                          </Box>
                          
                          <Box>
                            <Typography variant="caption" color="textSecondary">Serial Number</Typography>
                            <Typography variant="body2">{workTrack.serialNumber || "-"}</Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="caption" color="textSecondary">Customer</Typography>
                            <Typography variant="body2">{workTrack.workTrackCustomerName || "-"}</Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="caption" color="textSecondary">Project</Typography>
                            <Typography variant="body2">{workTrack.workTrackProjectName || "-"}</Typography>
                          </Box>
                          
                          {/* Clock In/Out Section - Mobile */}
                          <Box sx={{ p: 1.5, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                            <Typography variant="caption" color="textSecondary" fontWeight="bold">
                              Clock In / Out
                            </Typography>
                            <Box display="flex" justifyContent="space-between" mt={1}>
                              {/* Clock In */}
                              <Box flex={1}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <LoginIcon fontSize="small" color="success" />
                                  <Typography variant="caption">In</Typography>
                                </Box>
                                <Typography variant="body2">
                                  {formatDateTime(workTrack.clockInTime)}
                                </Typography>
                                <Box display="flex" gap={0.5} mt={0.5}>
                                  {workTrack.clockInSelfie && (
                                    <Avatar 
                                      src={workTrack.clockInSelfie} 
                                      sx={{ width: 32, height: 32, cursor: "pointer" }}
                                      onClick={() => handleImageClick(workTrack.clockInSelfie, "Clock In Selfie")}
                                    />
                                  )}
                                  {workTrack.clockInLatitude && workTrack.clockInLongitude && (
                                    <IconButton 
                                      size="small" 
                                      color="primary"
                                      onClick={() => handleLocationClick(workTrack.clockInLatitude, workTrack.clockInLongitude, "Clock In Location")}
                                    >
                                      <LocationOnIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </Box>
                              </Box>
                              {/* Clock Out */}
                              <Box flex={1}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <LogoutIcon fontSize="small" color="error" />
                                  <Typography variant="caption">Out</Typography>
                                </Box>
                                <Typography variant="body2">
                                  {formatDateTime(workTrack.clockOutTime)}
                                </Typography>
                                <Box display="flex" gap={0.5} mt={0.5}>
                                  {workTrack.clockOutSelfie && (
                                    <Avatar 
                                      src={workTrack.clockOutSelfie} 
                                      sx={{ width: 32, height: 32, cursor: "pointer" }}
                                      onClick={() => handleImageClick(workTrack.clockOutSelfie, "Clock Out Selfie")}
                                    />
                                  )}
                                  {workTrack.clockOutLatitude && workTrack.clockOutLongitude && (
                                    <IconButton 
                                      size="small" 
                                      color="primary"
                                      onClick={() => handleLocationClick(workTrack.clockOutLatitude, workTrack.clockOutLongitude, "Clock Out Location")}
                                    >
                                      <LocationOnIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                          
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="caption" color="textSecondary">Completion</Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {workTrack.taskCompletePercentage != null ? `${workTrack.taskCompletePercentage}%` : "0%"}
                              </Typography>
                            </Box>
                            <Box textAlign="right">
                              <Typography variant="caption" color="textSecondary">Created</Typography>
                              <Typography variant="body2">{formatDate(workTrack.createdOn)}</Typography>
                            </Box>
                          </Box>
                          
                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewClick(workTrack)}
                            sx={{ mt: 1 }}
                          >
                            View Details
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                    );
                  })}
                </Box>
              )}
              {workTracks.length > 0 && (
                <Box display="flex" justifyContent="center" mt={3} mb={2}>
                  <Pagination
                    count={Math.max(1, Math.ceil(totalCount / pageSize))}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    shape="rounded"
                    size="small"
                  />
                </Box>
              )}
            </Box>
          ) : (
            // Desktop: Table View
            <TableContainer component={Paper}>
              <Table aria-label="work tracks table" className="dark-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Track ID</TableCell>
                    <TableCell>Serial Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Completion</TableCell>
                    <TableCell align="center">Clock In</TableCell>
                    <TableCell align="center">Clock Out</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10}>
                        <Box display="flex" justifyContent="center" p={2}>
                          <CircularProgress size={24} />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (isAdmin && !selectedTechnician) ? (
                    <TableRow>
                      <TableCell colSpan={10}>
                        <Box display="flex" justifyContent="center" p={2}>
                          <Typography color="textSecondary">Please select a technician to view their work assignments</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (!isAdmin && !currentUserId) ? (
                    <TableRow>
                      <TableCell colSpan={10}>
                        <Box display="flex" justifyContent="center" p={2}>
                          <Typography color="textSecondary">Loading user information...</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : workTracks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10}>
                        <Box textAlign="center" p={3}>
                          <Typography color="textSecondary" gutterBottom>
                            No work assignments available
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    workTracks.map((workTrack) => {
                      const isCompleted = workTrack.submissionStatus === "Completed" || 
                                         (workTrack.taskCompletePercentage != null && workTrack.taskCompletePercentage >= 99.5);
                      return (
                        <TableRow 
                          key={workTrack.id}
                          sx={{
                            bgcolor: isCompleted ? '#f0fdf4' : 'transparent',
                            '&:hover': {
                              bgcolor: isCompleted ? '#dcfce7' : 'action.hover'
                            }
                          }}
                        >
                          <TableCell>{workTrack.trackId || "-"}</TableCell>
                          <TableCell>{workTrack.serialNumber || "-"}</TableCell>
                          <TableCell>{workTrack.workTrackCustomerName || "-"}</TableCell>
                          <TableCell>{workTrack.workTrackProjectName || "-"}</TableCell>
                          <TableCell>
                            <Chip
                              label={isCompleted ? "Complete" : (workTrack.submissionStatus || "Draft")}
                              size="small"
                              color="success"
                              sx={{
                                bgcolor: isCompleted ? '#22c55e' : undefined,
                                color: isCompleted ? 'white' : undefined,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {workTrack.taskCompletePercentage != null
                              ? `${workTrack.taskCompletePercentage}%`
                              : "0%"}
                          </TableCell>
                          
                          {/* Clock In Column */}
                          <TableCell align="center">
                            {workTrack.clockInTime ? (
                              <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                                <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                  <AccessTimeIcon fontSize="inherit" color="success" />
                                  {formatTime(workTrack.clockInTime)}
                                </Typography>
                                <Box display="flex" gap={0.5}>
                                  {workTrack.clockInSelfie && (
                                    <Tooltip title="View Clock In Selfie">
                                      <Avatar 
                                        src={workTrack.clockInSelfie} 
                                        sx={{ width: 28, height: 28, cursor: "pointer", border: "2px solid #22c55e" }}
                                        onClick={() => handleImageClick(workTrack.clockInSelfie, "Clock In Selfie")}
                                      />
                                    </Tooltip>
                                  )}
                                  {workTrack.clockInLatitude && workTrack.clockInLongitude && (
                                    <Tooltip title="View Clock In Location">
                                      <IconButton 
                                        size="small" 
                                        color="success"
                                        onClick={() => handleLocationClick(workTrack.clockInLatitude, workTrack.clockInLongitude, "Clock In Location")}
                                        sx={{ p: 0.5 }}
                                      >
                                        <LocationOnIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="textSecondary">-</Typography>
                            )}
                          </TableCell>
                          
                          {/* Clock Out Column */}
                          <TableCell align="center">
                            {workTrack.clockOutTime ? (
                              <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                                <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                  <AccessTimeIcon fontSize="inherit" color="error" />
                                  {formatTime(workTrack.clockOutTime)}
                                </Typography>
                                <Box display="flex" gap={0.5}>
                                  {workTrack.clockOutSelfie && (
                                    <Tooltip title="View Clock Out Selfie">
                                      <Avatar 
                                        src={workTrack.clockOutSelfie} 
                                        sx={{ width: 28, height: 28, cursor: "pointer", border: "2px solid #ef4444" }}
                                        onClick={() => handleImageClick(workTrack.clockOutSelfie, "Clock Out Selfie")}
                                      />
                                    </Tooltip>
                                  )}
                                  {workTrack.clockOutLatitude && workTrack.clockOutLongitude && (
                                    <Tooltip title="View Clock Out Location">
                                      <IconButton 
                                        size="small" 
                                        color="error"
                                        onClick={() => handleLocationClick(workTrack.clockOutLatitude, workTrack.clockOutLongitude, "Clock Out Location")}
                                        sx={{ p: 0.5 }}
                                      >
                                        <LocationOnIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="textSecondary">-</Typography>
                            )}
                          </TableCell>
                          
                          <TableCell>{formatDate(workTrack.createdOn)}</TableCell>
                          <TableCell align="right">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleViewClick(workTrack)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <Grid container justifyContent="space-between" mt={2} mb={2}>
                <Pagination
                  count={Math.max(1, Math.ceil(totalCount / pageSize))}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  shape="rounded"
                />
              </Grid>
            </TableContainer>
          )}
        </Grid>
      </Grid>

      {/* Image Preview Dialog */}
      <Dialog 
        open={imageDialogOpen} 
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{imageDialogTitle}</Typography>
            <IconButton onClick={() => setImageDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box display="flex" justifyContent="center">
              <img 
                src={selectedImage} 
                alt={imageDialogTitle}
                style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Map Dialog */}
      <Dialog 
        open={mapDialogOpen} 
        onClose={() => setMapDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{mapDialogTitle}</Typography>
            <IconButton onClick={() => setMapDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {mapLocation.lat && mapLocation.lng && (
            <Box>
              <Box sx={{ mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Latitude:</strong> {mapLocation.lat}
                </Typography>
                <Typography variant="body2">
                  <strong>Longitude:</strong> {mapLocation.lng}
                </Typography>
              </Box>
              <Box sx={{ width: "100%", height: 400, borderRadius: 1, overflow: "hidden" }}>
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${mapLocation.lat},${mapLocation.lng}&z=15&output=embed`}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMapDialogOpen(false)} color="inherit">
            Close
          </Button>
          <Button onClick={openInGoogleMaps} variant="contained" startIcon={<LocationOnIcon />}>
            Open in Google Maps
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

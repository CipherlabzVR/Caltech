import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Drawer,
  Stack,
  FormControlLabel,
  Checkbox,
  LinearProgress,
} from "@mui/material";
import { ToastContainer } from "react-toastify";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ListIcon from "@mui/icons-material/List";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import dynamic from "next/dynamic";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";

// Dynamically import modals that use RichTextEditor (Quill) to avoid SSR issues
const CreateTicketModal = dynamic(() => import("./create"), { ssr: false });
const EditTicketModal = dynamic(() => import("./edit"), { ssr: false });
const ViewTicketModal = dynamic(() => import("./view"), { ssr: false });
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";
import { toast } from "react-toastify";
import { keyframes } from "@emotion/react";

// Animation for Critical priority tickets - eye-catching blinking effect (responsive)
const blink = keyframes`
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 15px rgba(198, 40, 40, 0.8),
                0 0 30px rgba(198, 40, 40, 0.6),
                0 0 45px rgba(198, 40, 40, 0.4),
                0 2px 10px rgba(198, 40, 40, 0.5);
  }
  50% {
    opacity: 0.75;
    box-shadow: 0 0 25px rgba(255, 23, 68, 1),
                0 0 50px rgba(255, 23, 68, 0.8),
                0 0 75px rgba(255, 23, 68, 0.6),
                0 4px 20px rgba(255, 23, 68, 0.7);
  }
`;

// Mobile-optimized blink animation
const blinkMobile = keyframes`
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 10px rgba(198, 40, 40, 0.8),
                0 0 20px rgba(198, 40, 40, 0.6),
                0 2px 8px rgba(198, 40, 40, 0.5);
  }
  50% {
    opacity: 0.75;
    box-shadow: 0 0 20px rgba(255, 23, 68, 1),
                0 0 40px rgba(255, 23, 68, 0.8),
                0 4px 15px rgba(255, 23, 68, 0.7);
  }
`;

const statusConfig = [
  { value: 1, label: "Open", color: "#2196F3", bgColor: "#E3F2FD", columnBg: "#E8F4FD" },
  { value: 2, label: "In Progress", color: "#FF9800", bgColor: "#FFF3E0", columnBg: "#FFF8E1" },
  { value: 3, label: "Resolved", color: "#4CAF50", bgColor: "#E8F5E9", columnBg: "#F1F8F4" },
  { value: 4, label: "Closed", color: "#9E9E9E", bgColor: "#F5F5F5", columnBg: "#FAFAFA" },
  { value: 5, label: "On Hold", color: "#F44336", bgColor: "#FFEBEE", columnBg: "#FFF5F5" },
];

const statusNameToValue = {
  open: 1,
  "inprogress": 2,
  "in_progress": 2,
  "in progress": 2,
  resolved: 3,
  closed: 4,
  "onhold": 5,
  "on_hold": 5,
  "on hold": 5,
};

const defaultPriorityPalette = {
  1: { label: "Low", color: "#1976D2", bgColor: "#E3F2FD", cardBg: "#E8F4FD" },
  2: { label: "Medium", color: "#F57C00", bgColor: "#FFF3E0", cardBg: "#FFF8E1" },
  3: { label: "High", color: "#D32F2F", bgColor: "#FFEBEE", cardBg: "#FFE0E0" },
  4: { label: "Critical", color: "#C62828", bgColor: "#FFCDD2", cardBg: "#FFB3BA" },
};

export default function Tickets() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("category", "105");
    }
  }, []);

  const cId = typeof window !== 'undefined' ? sessionStorage.getItem("category") : null;
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editTicket, setEditTicket] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuTicket, setMenuTicket] = useState(null);
  const [draggedTicket, setDraggedTicket] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [priorityPalette, setPriorityPalette] = useState(defaultPriorityPalette);
  const [filterDrawer, setFilterDrawer] = useState(false);
  // Calculate default dates: end date = today, start date = 3 months ago
  const getDefaultDates = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    threeMonthsAgo.setHours(0, 0, 0, 0); // Start of day
    
    return {
      startDate: threeMonthsAgo.toISOString().split('T')[0], // Format as YYYY-MM-DD
      endDate: today.toISOString().split('T')[0], // Format as YYYY-MM-DD
    };
  };

  const defaultDates = getDefaultDates();
  
  const [selectedFilters, setSelectedFilters] = useState({
    statuses: [],
    priorities: [],
    categories: [],
    assignedTo: [],
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
  });
  const [filterOptions, setFilterOptions] = useState({
    statuses: [],
    priorities: [],
    categories: [],
    assignedTo: [],
  });
  const [loadingFilterOptions, setLoadingFilterOptions] = useState({
    categories: false,
    assignedTo: false,
  });

  const {
    data: ticketList,
    totalCount,
    page,
    pageSize,
    search,
    setSearch,
    fetchData: fetchTicketList,
  } = usePaginatedFetch("HelpDesk/GetAllTickets", "", 10000, false);

  // Optimistic updates state - tracks tickets that are being moved
  const [optimisticUpdates, setOptimisticUpdates] = useState({});
  
  // Merge ticketList with optimistic updates
  const mergedTicketList = useMemo(() => {
    if (!Array.isArray(ticketList)) return ticketList;
    return ticketList.map(ticket => {
      const update = optimisticUpdates[ticket.id];
      if (update) {
        return { ...ticket, ...update };
      }
      return ticket;
    });
  }, [ticketList, optimisticUpdates]);

  useEffect(() => {
    // Only fetch on client side to avoid SSR issues
    if (typeof window === 'undefined') return;
    
    const loadPrioritySettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/HelpDesk/GetPrioritySettings`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        const settings = Array.isArray(data?.result) ? data.result : [];
        if (settings.length === 0) return;

        const palette = { ...defaultPriorityPalette };
        settings.forEach((setting) => {
          const baseColorRaw = setting.colorHex || palette[setting.priority]?.color || "#2563EB";
          const baseColor = baseColorRaw.startsWith("#") ? baseColorRaw : `#${baseColorRaw}`;
          const withAlpha = (hex, alphaHex) => (hex.length === 7 ? `${hex}${alphaHex}` : hex);
          palette[setting.priority] = {
            label: setting.displayName || palette[setting.priority]?.label || `Priority ${setting.priority}`,
            color: baseColor,
            bgColor: withAlpha(baseColor, "1A") || palette[setting.priority]?.bgColor || "#E3F2FD",
            cardBg: withAlpha(baseColor, "14") || palette[setting.priority]?.cardBg || "#E8F4FD",
          };
        });

        setPriorityPalette(palette);
      } catch (error) {
        console.error("Error loading priority settings", error);
      }
    };

    loadPrioritySettings();
  }, []);

  // Group tickets by status
  const ticketsByStatus = useMemo(() => {
    const grouped = {};
    statusConfig.forEach((status) => {
      grouped[status.value] = [];
    });
    // Use mergedTicketList instead of ticketList for optimistic updates
    const listToUse = mergedTicketList || ticketList;
    // Ensure listToUse is an array
    if (Array.isArray(listToUse)) {
      console.log("Grouping tickets. Total tickets:", listToUse.length);
      listToUse.forEach((ticket) => {
        if (!ticket) return;

        const tryParseNumeric = (value) => {
          if (value === null || value === undefined) return undefined;
          const parsed = typeof value === "number" ? value : parseInt(value, 10);
          return Number.isNaN(parsed) ? undefined : parsed;
        };

        let statusValue = tryParseNumeric(ticket.status);

        if (statusValue === undefined && typeof ticket.status === "string") {
          const normalized = ticket.status.trim().toLowerCase();
          statusValue = statusNameToValue[normalized];
        }

        if (statusValue === undefined && ticket.statusId !== undefined) {
          statusValue = tryParseNumeric(ticket.statusId);
        }

        if (statusValue === undefined && typeof ticket.statusId === "string") {
          const normalized = ticket.statusId.trim().toLowerCase();
          statusValue = statusNameToValue[normalized];
        }

        if (statusValue === undefined || grouped[statusValue] === undefined) {
          // Fallback to Open column to ensure ticket remains visible
          statusValue = 1;
        }
        grouped[statusValue].push(ticket);
      });
      console.log("Grouped tickets:", Object.keys(grouped).map(k => ({ status: k, count: grouped[k].length })));
    } else {
      console.warn("ticketList is not an array:", typeof listToUse, listToUse);
    }
    return grouped;
  }, [mergedTicketList, ticketList]);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    // Only fetch on client side to avoid SSR issues
    if (typeof window === 'undefined') return;
    
    // Fetch categories
    setLoadingFilterOptions(prev => ({ ...prev, categories: true }));
    try {
      const token = localStorage.getItem("token");
      const categoriesResponse = await fetch(`${BASE_URL}/HelpDesk/GetAllCategories?SkipCount=0&MaxResultCount=1000&Search=null`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        const categories = Array.isArray(categoriesData?.result?.items) 
          ? categoriesData.result.items 
          : Array.isArray(categoriesData?.result) 
          ? categoriesData.result 
          : [];
        setFilterOptions(prev => ({ ...prev, categories: categories.map(cat => ({ id: cat.id, name: cat.name || cat.categoryName || "" })) }));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingFilterOptions(prev => ({ ...prev, categories: false }));
    }

    // Fetch users (assigned to)
    setLoadingFilterOptions(prev => ({ ...prev, assignedTo: true }));
    try {
      const token = localStorage.getItem("token");
      const usersResponse = await fetch(`${BASE_URL}/User/GetAllUser`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const users = Array.isArray(usersData) ? usersData : Array.isArray(usersData?.result) ? usersData.result : [];
        const assignedToOptions = users.map(user => ({
          id: user.id,
          label: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.userName || user.email || `User #${user.id}`,
        }));
        setFilterOptions(prev => ({ ...prev, assignedTo: assignedToOptions }));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingFilterOptions(prev => ({ ...prev, assignedTo: false }));
    }

    // Set status and priority options
    setFilterOptions(prev => ({
      ...prev,
      statuses: statusConfig.map(s => s.label),
      priorities: Object.values(priorityPalette).map(p => p.label),
    }));
  }, [priorityPalette]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Filter handlers
  const handleFilterToggle = (group, value) => {
    setSelectedFilters((prev) => {
      const currentValues = prev[group];
      const exists = currentValues.includes(value);
      return {
        ...prev,
        [group]: exists ? currentValues.filter((item) => item !== value) : [...currentValues, value],
      };
    });
  };

  const handleDateChange = (field) => (event) => {
    const value = event.target.value;
    setSelectedFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Filter tickets by search and filters
  const filteredTicketsByStatus = useMemo(() => {
    let filtered = { ...ticketsByStatus };

    // Apply status filter
    if (selectedFilters.statuses.length > 0) {
      const statusValues = selectedFilters.statuses.map(statusLabel => {
        const status = statusConfig.find(s => s.label === statusLabel);
        return status?.value;
      }).filter(Boolean);
      const filteredByStatus = {};
      statusConfig.forEach((status) => {
        if (statusValues.includes(status.value)) {
          filteredByStatus[status.value] = filtered[status.value] || [];
        } else {
          filteredByStatus[status.value] = [];
        }
      });
      filtered = filteredByStatus;
    }

    // Apply priority filter
    if (selectedFilters.priorities.length > 0) {
      const priorityValues = selectedFilters.priorities.map(priorityLabel => {
        const priority = Object.entries(priorityPalette).find(([_, p]) => p.label === priorityLabel);
        return priority ? parseInt(priority[0]) : null;
      }).filter(p => p !== null);
      statusConfig.forEach((status) => {
        filtered[status.value] = (filtered[status.value] || []).filter(ticket => 
          priorityValues.includes(ticket.priority)
        );
      });
    }

    // Apply category filter
    if (selectedFilters.categories.length > 0) {
      statusConfig.forEach((status) => {
        filtered[status.value] = (filtered[status.value] || []).filter(ticket => {
          const categoryName = ticket.categoryName || ticket.category?.name || "";
          return selectedFilters.categories.includes(categoryName);
        });
      });
    }

    // Apply assigned to filter
    if (selectedFilters.assignedTo.length > 0) {
      statusConfig.forEach((status) => {
        filtered[status.value] = (filtered[status.value] || []).filter(ticket => {
          const assignedToName = ticket.assignedToUser
            ? `${ticket.assignedToUserFirstName || ticket.assignedToUser?.firstName || ""} ${ticket.assignedToUserLastName || ticket.assignedToUser?.lastName || ""}`.trim() ||
              ticket.assignedToUserEmail ||
              ticket.assignedToUser?.email ||
              ticket.assignedToUserName ||
              ticket.assignedToUser?.userName ||
              ""
            : "Unassigned";
          return selectedFilters.assignedTo.includes(assignedToName);
        });
      });
    }

    // Apply date range filter - filter by ticket created date (createdOn)
    if (selectedFilters.startDate || selectedFilters.endDate) {
      const startDate = selectedFilters.startDate ? new Date(selectedFilters.startDate) : null;
      if (startDate) {
        startDate.setHours(0, 0, 0, 0);
      }
      
      const endDate = selectedFilters.endDate ? new Date(selectedFilters.endDate) : null;
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
      }
      
      statusConfig.forEach((status) => {
        filtered[status.value] = (filtered[status.value] || []).filter(ticket => {
          // Filter by ticket created date (createdOn)
          if (!ticket.createdOn) return false;
          const created = new Date(ticket.createdOn);
          if (Number.isNaN(created.getTime())) return false;
          
          const createdDate = new Date(created);
          createdDate.setHours(0, 0, 0, 0);
          
          // Check if created date is within range
          const matchesStart = !startDate || createdDate >= startDate;
          const matchesEnd = !endDate || createdDate <= endDate;
          
          return matchesStart && matchesEnd;
        });
      });
    }

    // Apply search filter
    if (search && search.trim() !== "") {
      const searchLower = search.toLowerCase();
      statusConfig.forEach((status) => {
        filtered[status.value] = (filtered[status.value] || []).filter((ticket) => {
          return (
            ticket.ticketNumber?.toLowerCase().includes(searchLower) ||
            ticket.subject?.toLowerCase().includes(searchLower) ||
            ticket.description?.toLowerCase().includes(searchLower) ||
            ticket.categoryName?.toLowerCase().includes(searchLower) ||
            (ticket.category?.name && ticket.category.name.toLowerCase().includes(searchLower)) ||
            ticket.customerName?.toLowerCase().includes(searchLower) ||
            ticket.customerEmail?.toLowerCase().includes(searchLower) ||
            ticket.customerPhone?.toLowerCase().includes(searchLower) ||
            ticket.customerCompany?.toLowerCase().includes(searchLower)
          );
        });
      });
    }

    return filtered;
  }, [ticketsByStatus, search, selectedFilters, priorityPalette]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setViewModalOpen(true);
    setAnchorEl(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedTicket(null);
    fetchTicketList(page, search, pageSize);
  };

  const handleMenuOpen = (event, ticket) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuTicket(ticket);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTicket(null);
  };

  const handleDragStart = (e, ticket) => {
    if (!update) {
      e.preventDefault();
      return false;
    }
    e.stopPropagation();
    console.log("Drag started for ticket:", ticket.id, "Status:", ticket.status);
    setIsDragging(true);
    setDraggedTicket(ticket.id);
    e.dataTransfer.setData("text/plain", ticket.id.toString()); // Use text/plain as fallback
    e.dataTransfer.setData("ticketId", ticket.id.toString());
    e.dataTransfer.setData("currentStatus", ticket.status.toString());
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnd = (e) => {
    // Clear drag states immediately
    setIsDragging(false);
    // Don't clear draggedTicket here - let handleDrop handle it to prevent glitch
    setDragOverColumn(null);
  };

  const handleDragOver = (e, status) => {
    if (!update) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  // Clear optimistic updates when ticket list refreshes - only if status matches
  useEffect(() => {
    if (ticketList && ticketList.length > 0) {
      setOptimisticUpdates(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        Object.keys(updated).forEach(ticketId => {
          const ticket = ticketList.find(t => t.id === parseInt(ticketId));
          if (ticket) {
            // Only clear if the status in the new data matches the optimistic update
            // This means the server has confirmed the change
            if (ticket.status === updated[ticketId]?.status) {
              delete updated[ticketId];
              hasChanges = true;
            }
            // If status doesn't match, keep the optimistic update (might be stale data)
          } else {
            // Ticket not found, might have been deleted, clear the update
            delete updated[ticketId];
            hasChanges = true;
          }
        });
        return hasChanges ? updated : prev;
      });
    }
  }, [ticketList]);

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e, newStatus) => {
    if (!update) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Clear drag states immediately to prevent glitch
    setIsDragging(false);
    setDragOverColumn(null);

    // Use draggedTicket state if available, otherwise use dataTransfer
    let ticketId = draggedTicket;
    let ticketIdStr = null;
    if (!ticketId) {
      ticketIdStr = e.dataTransfer.getData("ticketId") || e.dataTransfer.getData("text/plain");
      if (ticketIdStr) {
        ticketId = parseInt(ticketIdStr);
      }
    }

    if (!ticketId) {
      console.error("No ticket ID available");
      setDraggedTicket(null);
      return;
    }

    // Find the ticket to verify it exists - try both string and number comparison
    const ticket = mergedTicketList.find((t) => {
      const tId = t.id;
      return tId === ticketId || 
             tId === parseInt(ticketId) || 
             String(tId) === String(ticketId) ||
             (ticketIdStr && (tId === parseInt(ticketIdStr) || String(tId) === ticketIdStr));
    });
    
    if (!ticket) {
      console.error("Ticket not found in list");
      setDraggedTicket(null);
      return;
    }
    
    // Use the ticket's actual ID and current status
    const actualTicketId = ticket.id;
    const currentStatus = ticket.status;

    // If same status, no update needed
    if (currentStatus === newStatus) {
      setDraggedTicket(null);
      return;
    }

    // Clear dragged ticket state immediately to prevent visual glitch
    setDraggedTicket(null);
    
    // Optimistically update the UI immediately
    setOptimisticUpdates(prev => ({
      ...prev,
      [actualTicketId]: { status: newStatus }
    }));

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/UpdateTicketStatus?ticketId=${actualTicketId}&status=${newStatus}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();

      if (response.ok && (data.status === "SUCCESS" || data.statusCode === 200 || response.status === 200)) {
        // Refresh the ticket list - the optimistic update will be automatically cleared
        // by the useEffect when the new data arrives and matches the optimistic status
        fetchTicketList(page, search, pageSize);
      } else {
        // Rollback optimistic update on error
        setOptimisticUpdates(prev => {
          const updated = { ...prev };
          delete updated[actualTicketId];
          return updated;
        });
        console.error("Update failed:", data);
      }
    } catch (error) {
      // Rollback optimistic update on error
      setOptimisticUpdates(prev => {
        const updated = { ...prev };
        delete updated[actualTicketId];
        return updated;
      });
      console.error("Error updating ticket status:", error);
    }
  };

  if (!navigate) {
    return <div>Access Denied</div>;
  }

  return (
    <>
      <ToastContainer />
      <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#F5F7FA", minHeight: "100vh" }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "stretch", md: "center" },
              gap: 2,
              mb: 2,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#1A202C",
                fontSize: { xs: "1.5rem", md: "1.875rem" },
                flexShrink: 0,
              }}
            >
              Help Desk Board
            </Typography>

            {/* Search and Create Button */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: { xs: "stretch", sm: "center" },
                flexDirection: { xs: "column", sm: "row" },
                flex: 1,
                justifyContent: "flex-end",
              }}
            >
              <Box sx={{ width: { xs: "100%", sm: "400px", md: "450px" } }}>
                <TextField
                  placeholder="Search tickets..."
                  value={search}
                  onChange={handleSearchChange}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "white",
                      borderRadius: 2,
                      height: { xs: "48px", sm: "52px" },
                      fontSize: "0.9375rem",
                      "& fieldset": {
                        borderColor: "#E2E8F0",
                        borderWidth: "1.5px",
                      },
                      "&:hover fieldset": {
                        borderColor: "#CBD5E0",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#4299E1",
                        borderWidth: "2px",
                      },
                    },
                    "& .MuiInputBase-input": {
                      py: { xs: 1.5, sm: 1.75 },
                      px: 1,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ ml: 1 }}>
                        <SearchIcon sx={{ color: "#718096", fontSize: "1.5rem" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              {create && (
                <Box sx={{ flexShrink: 0 }}>
                  <CreateTicketModal
                    fetchItems={fetchTicketList}
                    currentPage={page}
                    currentSearch={search}
                    currentPageSize={pageSize}
                  />
                </Box>
              )}
              <IconButton 
                color="primary" 
                onClick={() => setFilterDrawer(true)}
                sx={{
                  bgcolor: "white",
                  border: "1px solid #E2E8F0",
                  "&:hover": {
                    bgcolor: "#F7FAFC",
                    borderColor: "#CBD5E0",
                  },
                }}
              >
                <FilterAltOutlinedIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Kanban Board */}
        <Box
          sx={{
            display: "flex",
            gap: { xs: 1.25, sm: 1.5, md: 2 },
            overflowX: "auto",
            overflowY: "hidden",
            pb: { xs: 1.5, sm: 2 },
            px: { xs: 0.5, sm: 0 },
            mx: { xs: -0.5, sm: 0 },
            "&::-webkit-scrollbar": {
              height: { xs: 6, sm: 8 },
            },
            "&::-webkit-scrollbar-track": {
              bgcolor: "#E2E8F0",
              borderRadius: { xs: 3, sm: 4 },
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "#CBD5E0",
              borderRadius: { xs: 3, sm: 4 },
              "&:hover": {
                bgcolor: "#A0AEC0",
              },
            },
            // Smooth scrolling on mobile
            WebkitOverflowScrolling: "touch",
            scrollBehavior: "smooth",
          }}
        >
          {statusConfig.map((status) => {
            const tickets = filteredTicketsByStatus[status.value] || [];
            const isDragOver = dragOverColumn === status.value;
            
            // Debug logging
            if (tickets.length > 0) {
              console.log(`Status ${status.value} (${status.label}): ${tickets.length} tickets`);
            }

            return (
              <Box
                key={status.value}
                sx={{
                  minWidth: { xs: "260px", sm: "280px", md: "300px", lg: "320px" },
                  width: { xs: "260px", sm: "280px", md: "300px", lg: "320px" },
                  maxWidth: { xs: "calc(100vw - 32px)", sm: "none" },
                  flexShrink: 0,
                  bgcolor: status.columnBg,
                  borderRadius: { xs: 1.5, sm: 2 },
                  p: { xs: 1, sm: 1.25, md: 1.5 },
                  border: `2px solid ${status.color}40`,
                }}
              >
                {/* Column Header */}
                <Box
                  sx={{
                    mb: { xs: 1, sm: 1.25, md: 1.5 },
                    p: { xs: 1, sm: 1.25, md: 1.5 },
                    bgcolor: "white",
                    borderRadius: { xs: 1.5, sm: 2 },
                    border: isDragOver ? `2px solid ${status.color}` : `1px solid ${status.color}60`,
                    boxShadow: isDragOver
                      ? `0 4px 12px ${status.color}40`
                      : `0 2px 4px ${status.color}20`,
                    transition: "all 0.2s",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: status.color,
                        fontSize: { xs: "0.875rem", sm: "0.9375rem", md: "1rem" },
                        lineHeight: 1.2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {status.label}
                    </Typography>
                    <Chip
                      label={tickets.length}
                      size="small"
                      sx={{
                        bgcolor: status.bgColor,
                        color: status.color,
                        fontWeight: 600,
                        minWidth: { xs: "28px", sm: "32px" },
                        height: { xs: "24px", sm: "28px" },
                        fontSize: { xs: "0.6875rem", sm: "0.75rem" },
                        flexShrink: 0,
                      }}
                    />
                  </Box>
                </Box>

                {/* Tickets */}
                <Box
                  onDrop={(e) => {
                    console.log("onDrop triggered for status:", status.value);
                    handleDrop(e, status.value);
                  }}
                  onDragOver={(e) => {
                    handleDragOver(e, status.value);
                  }}
                  onDragEnter={(e) => {
                    if (update) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  onDragLeave={handleDragLeave}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: { xs: 0.75, sm: 1 },
                    minHeight: { xs: "150px", sm: "180px", md: "200px" },
                    maxHeight: { xs: "calc(100vh - 240px)", sm: "calc(100vh - 260px)", md: "calc(100vh - 280px)" },
                    overflowY: "auto",
                    overflowX: "hidden",
                    p: isDragOver ? { xs: 0.25, sm: 0.5 } : 0,
                    transition: "all 0.2s ease",
                    bgcolor: isDragOver ? `${status.bgColor}60` : "transparent",
                    border: isDragOver ? `2px dashed ${status.color}` : "2px dashed transparent",
                    borderRadius: { xs: 0.75, sm: 1 },
                    transform: isDragOver ? "scale(1.01)" : "scale(1)",
                    "&::-webkit-scrollbar": {
                      width: { xs: 4, sm: 6 },
                    },
                    "&::-webkit-scrollbar-track": {
                      bgcolor: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      bgcolor: "#CBD5E0",
                      borderRadius: { xs: 2, sm: 3 },
                    },
                  }}
                >
                  {tickets.length === 0 ? (
                    <Box
                      sx={{
                        p: 3,
                        textAlign: "center",
                        color: "#A0AEC0",
                        fontSize: "0.875rem",
                      }}
                    >
                      No tickets
                    </Box>
                  ) : (
                    tickets.map((ticket) => {
                      const priority = priorityPalette[ticket.priority] || defaultPriorityPalette[1];
                      const isDragging = draggedTicket === ticket.id;

                      // Get priority-based colors
                      const priorityBorderColor = priority.color;
                      const priorityBgColor = priority.bgColor;
                      const priorityCardBg = priority.cardBg || "#FFFFFF";

                      return (
                        <Box
                          key={ticket.id}
                          draggable={update ? true : false}
                          onDragStart={(e) => {
                            console.log("onDragStart triggered for ticket:", ticket.id);
                            handleDragStart(e, ticket);
                          }}
                          onDragEnd={(e) => {
                            console.log("onDragEnd triggered");
                            handleDragEnd();
                          }}
                          onMouseDown={(e) => {
                            if (update && (e.target.closest('button') || e.target.closest('[role="button"]'))) {
                              e.stopPropagation();
                              e.preventDefault();
                            }
                          }}
                          onClick={(e) => {
                            // Don't open modal if we just finished dragging
                            if (isDragging) {
                              return;
                            }
                            // Open ticket edit modal on click (but not if clicking menu button)
                            if (!e.target.closest('button') && !e.target.closest('[role="button"]')) {
                              if (update) {
                                setEditTicket(ticket);
                                setEditModalOpen(true);
                              } else {
                                handleViewTicket(ticket);
                              }
                            }
                          }}
                          sx={{
                            cursor: update ? "grab" : "pointer",
                            opacity: isDragging ? 0.8 : 1,
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            MozUserSelect: "none",
                            msUserSelect: "none",
                            touchAction: "none",
                            transition: isDragging ? "opacity 0.2s ease" : "all 0.2s ease",
                            transform: isDragging ? "scale(0.98)" : "scale(1)",
                            "&:active": {
                              cursor: update ? "grabbing" : "pointer",
                            },
                            "&:hover": {
                              transform: update && !isDragging ? "translateY(-2px)" : "scale(1)",
                            },
                          }}
                        >
                          <Card
                            sx={{
                              bgcolor: priorityCardBg,
                              borderRadius: { xs: 1.5, sm: 2 },
                              border: ticket.priority === 4 
                                ? `2px solid ${priorityBorderColor}` 
                                : `1px solid ${priorityBorderColor}40`,
                              borderLeft: ticket.priority === 4 
                                ? { xs: `5px solid ${priorityBorderColor}`, sm: `6px solid ${priorityBorderColor}` }
                                : ticket.priority === 3
                                ? { xs: `4px solid ${priorityBorderColor}`, sm: `5px solid ${priorityBorderColor}` }
                                : { xs: `3px solid ${priorityBorderColor}`, sm: `4px solid ${priorityBorderColor}` },
                              boxShadow: ticket.priority === 4
                                ? `0 2px 8px ${priorityBorderColor}60`
                                : ticket.priority === 3
                                ? `0 2px 6px ${priorityBorderColor}40`
                                : "0 1px 3px rgba(0,0,0,0.08)",
                              transition: ticket.priority === 4 ? "none" : "all 0.2s ease",
                              pointerEvents: "auto",
                              width: "100%",
                              maxWidth: "100%",
                              position: "relative",
                              overflow: "hidden",
                              mb: { xs: 0.5, sm: 0.75 },
                              // Eye-catching blinking animation for Critical priority tickets (responsive)
                              ...(ticket.priority === 4 && {
                                animation: {
                                  xs: `${blinkMobile} 1s ease-in-out infinite`,
                                  sm: `${blink} 1s ease-in-out infinite`,
                                },
                                borderColor: priorityBorderColor,
                                willChange: "opacity, box-shadow",
                              }),
                              "&:hover": {
                                boxShadow: ticket.priority === 4
                                  ? `0 0 30px rgba(255, 23, 68, 1),
                                     0 0 60px rgba(255, 23, 68, 0.8),
                                     0 6px 20px ${priorityBorderColor}80`
                                  : ticket.priority === 3
                                  ? `0 4px 14px ${priorityBorderColor}60`
                                  : "0 4px 12px rgba(0,0,0,0.12)",
                                transform: isDragging ? "none" : (ticket.priority === 4 ? "none" : "translateY(-2px)"),
                                borderColor: ticket.priority === 4 || ticket.priority === 3
                                  ? `${priorityBorderColor}FF`
                                  : `${priorityBorderColor}80`,
                              },
                            }}
                            onDragStart={(e) => {
                              // Prevent Card from interfering
                              e.stopPropagation();
                            }}
                          >
                            <CardContent sx={{ 
                              p: { xs: 0.875, sm: 1 }, 
                              position: "relative", 
                              zIndex: 1, 
                              "&:last-child": { pb: { xs: 0.875, sm: 1 } },
                              "& .MuiCardContent-root": {
                                padding: { xs: "0.875rem", sm: "1rem" },
                              }
                            }}>
                              {/* Ticket Header */}
                              <Box sx={{ 
                                display: "flex", 
                                justifyContent: "space-between", 
                                alignItems: "flex-start", 
                                mb: { xs: 0.5, sm: 0.75 },
                                gap: 0.5,
                              }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    color: "#2D3748",
                                    fontSize: { xs: "0.6875rem", sm: "0.75rem" },
                                    mb: 0.25,
                                    lineHeight: 1.3,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                    minWidth: 0,
                                  }}
                                >
                                  {ticket.ticketNumber}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuOpen(e, ticket);
                                  }}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                  sx={{ 
                                    p: { xs: 0.375, sm: 0.5 }, 
                                    color: "#718096", 
                                    pointerEvents: "auto",
                                    flexShrink: 0,
                                    minWidth: { xs: "28px", sm: "32px" },
                                    width: { xs: "28px", sm: "32px" },
                                    height: { xs: "28px", sm: "32px" },
                                  }}
                                >
                                  <MoreVertIcon sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }} />
                                </IconButton>
                              </Box>

                            {/* Subject */}
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 500,
                                color: "#1A202C",
                                mb: { xs: 0.5, sm: 0.75 },
                                fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                                lineHeight: { xs: 1.25, sm: 1.3 },
                                display: "-webkit-box",
                                WebkitLineClamp: { xs: 2, sm: 2 },
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                wordBreak: "break-word",
                                hyphens: "auto",
                              }}
                            >
                              {ticket.subject}
                            </Typography>

                            {/* Category */}
                            {(ticket.categoryName || ticket.category?.name) && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#718096",
                                  display: "block",
                                  mb: { xs: 0.5, sm: 0.75 },
                                  fontSize: { xs: "0.625rem", sm: "0.6875rem" },
                                  lineHeight: 1.3,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {ticket.categoryName || ticket.category?.name}
                              </Typography>
                            )}

                            {(ticket.customerName || ticket.customerEmail || ticket.customerPhone) && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: { xs: 0.5, sm: 0.75 },
                                  mb: { xs: 0.5, sm: 0.75 },
                                  color: "#4A5568",
                                  fontSize: { xs: "0.625rem", sm: "0.6875rem" },
                                }}
                              >
                                <PersonIcon sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }} />
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: "block",
                                      fontWeight: 600,
                                      color: "#2D3748",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      maxWidth: { xs: 130, sm: 160 },
                                    }}
                                  >
                                    {ticket.customerName || "Customer"}
                                  </Typography>
                                  {ticket.customerEmail && (
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        display: "block",
                                        color: "#718096",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: { xs: 130, sm: 160 },
                                      }}
                                    >
                                      {ticket.customerEmail}
                                    </Typography>
                                  )}
                                  {!ticket.customerEmail && ticket.customerPhone && (
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        display: "block",
                                        color: "#718096",
                                      }}
                                    >
                                      {ticket.customerPhone}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            )}

                            {/* Priority */}
                            <Box sx={{ mb: { xs: 0.5, sm: 0.75 } }}>
                              <Chip
                                label={priority.label}
                                size="small"
                                sx={{
                                  bgcolor: priority.bgColor,
                                  color: priority.color,
                                  fontWeight: 600,
                                  fontSize: { xs: "0.625rem", sm: "0.6875rem" },
                                  height: { xs: "18px", sm: "20px" },
                                  "& .MuiChip-label": {
                                    px: { xs: 0.75, sm: 1 },
                                    py: 0,
                                  },
                                }}
                              />
                            </Box>

                            {/* Footer */}
                            <Box sx={{ 
                              display: "flex", 
                              flexDirection: "column", 
                              gap: { xs: 0.5, sm: 0.75 }, 
                              mt: { xs: 0.75, sm: 1 }, 
                              pt: { xs: 0.625, sm: 0.75 }, 
                              borderTop: "1px solid #E2E8F0" 
                            }}>
                              {/* Checklist Section */}
                              {ticket.checklist && Array.isArray(ticket.checklist) && ticket.checklist.length > 0 && (
                                <Box sx={{ mb: { xs: 0.5, sm: 0.75 } }}>
                                  <Box sx={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    gap: { xs: 0.375, sm: 0.5 },
                                    mb: { xs: 0.375, sm: 0.5 }
                                  }}>
                                    <ListIcon sx={{ 
                                      fontSize: { xs: "0.75rem", sm: "0.875rem" }, 
                                      color: "#718096",
                                      flexShrink: 0,
                                    }} />
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: "#718096",
                                        fontSize: { xs: "0.625rem", sm: "0.6875rem" },
                                        fontWeight: 500,
                                      }}
                                    >
                                      Checklist
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: "#4A5568",
                                        fontSize: { xs: "0.625rem", sm: "0.6875rem" },
                                        fontWeight: 600,
                                        ml: "auto",
                                      }}
                                    >
                                      {ticket.checklistCompletionPercentage !== null && ticket.checklistCompletionPercentage !== undefined
                                        ? `${ticket.checklistCompletionPercentage}%`
                                        : (() => {
                                            const completed = ticket.checklist.filter(c => c.isCompleted).length;
                                            const total = ticket.checklist.length;
                                            return total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%";
                                          })()}
                                    </Typography>
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={ticket.checklistCompletionPercentage !== null && ticket.checklistCompletionPercentage !== undefined
                                      ? ticket.checklistCompletionPercentage
                                      : (() => {
                                          const completed = ticket.checklist.filter(c => c.isCompleted).length;
                                          const total = ticket.checklist.length;
                                          return total > 0 ? Math.round((completed / total) * 100) : 0;
                                        })()}
                                    sx={{
                                      height: { xs: 4, sm: 6 },
                                      borderRadius: { xs: 2, sm: 3 },
                                      bgcolor: "#E2E8F0",
                                      "& .MuiLinearProgress-bar": {
                                        borderRadius: { xs: 2, sm: 3 },
                                        bgcolor: (() => {
                                          const percentage = ticket.checklistCompletionPercentage !== null && ticket.checklistCompletionPercentage !== undefined
                                            ? ticket.checklistCompletionPercentage
                                            : (() => {
                                                const completed = ticket.checklist.filter(c => c.isCompleted).length;
                                                const total = ticket.checklist.length;
                                                return total > 0 ? Math.round((completed / total) * 100) : 0;
                                              })();
                                          return percentage === 100 ? "#4CAF50" : "#2196F3";
                                        })(),
                                      },
                                    }}
                                  />
                                  <Box sx={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    gap: { xs: 0.25, sm: 0.375 },
                                    mt: { xs: 0.25, sm: 0.375 }
                                  }}>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: "#718096",
                                        fontSize: { xs: "0.5625rem", sm: "0.625rem" },
                                      }}
                                    >
                                      {(() => {
                                        const completed = ticket.checklist.filter(c => c.isCompleted).length;
                                        const total = ticket.checklist.length;
                                        return `${completed}/${total} completed`;
                                      })()}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                              <Box sx={{ 
                                display: "flex", 
                                justifyContent: "space-between", 
                                alignItems: "center",
                                gap: { xs: 0.5, sm: 1 },
                                flexWrap: "wrap",
                              }}>
                                <Box sx={{ 
                                  display: "flex", 
                                  alignItems: "center", 
                                  gap: { xs: 0.375, sm: 0.5 },
                                  minWidth: 0,
                                  flex: { xs: "1 1 100%", sm: "0 1 auto" },
                                }}>
                                  <PersonIcon sx={{ 
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" }, 
                                    color: "#A0AEC0",
                                    flexShrink: 0,
                                  }} />
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "#718096",
                                      fontSize: { xs: "0.625rem", sm: "0.6875rem" },
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      minWidth: 0,
                                    }}
                                  >
                                    {ticket.assignedToUser
                                      ? `${ticket.assignedToUserFirstName || ticket.assignedToUser?.firstName || ""} ${ticket.assignedToUserLastName || ticket.assignedToUser?.lastName || ""}`.trim() ||
                                        ticket.assignedToUserEmail ||
                                        ticket.assignedToUser?.email ||
                                        ticket.assignedToUserName ||
                                        ticket.assignedToUser?.userName ||
                                        "Unknown"
                                      : "Unassigned"}
                                  </Typography>
                                </Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#A0AEC0",
                                    fontSize: { xs: "0.625rem", sm: "0.75rem" },
                                    flexShrink: 0,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {formatDate(ticket.createdOn)}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                        </Box>
                      );
                    })
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {update && menuTicket && (
          <MenuItem
            onClick={() => {
              setEditTicket(menuTicket);
              setEditModalOpen(true);
              handleMenuClose();
            }}
          >
            <EditIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
            Edit
          </MenuItem>
        )}
        {!update && menuTicket && (
          <MenuItem
            onClick={() => {
              handleViewTicket(menuTicket);
              handleMenuClose();
            }}
          >
            <VisibilityIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
            View Details
          </MenuItem>
        )}
        {remove && menuTicket && (
          <>
            <Divider />
            <MenuItem onClick={handleMenuClose}>
              <DeleteIcon sx={{ mr: 1, fontSize: "1.2rem", color: "error.main" }} />
              <DeleteConfirmationById
                id={menuTicket.id}
                controller="HelpDesk/DeleteTicket"
                fetchItems={fetchTicketList}
              />
            </MenuItem>
          </>
        )}
      </Menu>

      {/* View Modal */}
      {selectedTicket && (
        <ViewTicketModal
          open={viewModalOpen}
          onClose={handleCloseViewModal}
          ticket={selectedTicket}
          fetchItems={fetchTicketList}
        />
      )}

      {/* Edit Modal */}
      {editTicket && (
        <EditTicketModal
          fetchItems={fetchTicketList}
          item={editTicket}
          currentPage={page}
          currentSearch={search}
          currentPageSize={pageSize}
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditTicket(null);
          }}
        />
      )}

      {/* Filter Drawer */}
      <Drawer anchor="right" open={filterDrawer} onClose={() => setFilterDrawer(false)}>
        <Box sx={{ width: { xs: 280, sm: 320 }, p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Filters
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Narrow the board to focus on specific tickets.
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {/* Status Filter */}
          {filterOptions.statuses.length > 0 && (
            <>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>
                Status
              </Typography>
              <Stack spacing={1} mb={2}>
                {filterOptions.statuses.map((statusLabel) => (
                  <FormControlLabel
                    key={statusLabel}
                    control={
                      <Checkbox
                        checked={selectedFilters.statuses.includes(statusLabel)}
                        onChange={() => handleFilterToggle("statuses", statusLabel)}
                      />
                    }
                    label={statusLabel}
                  />
                ))}
              </Stack>
              <Divider sx={{ mb: 2 }} />
            </>
          )}

          {/* Priority Filter */}
          {filterOptions.priorities.length > 0 && (
            <>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>
                Priority
              </Typography>
              <Stack spacing={1} mb={2}>
                {filterOptions.priorities.map((priorityLabel) => (
                  <FormControlLabel
                    key={priorityLabel}
                    control={
                      <Checkbox
                        checked={selectedFilters.priorities.includes(priorityLabel)}
                        onChange={() => handleFilterToggle("priorities", priorityLabel)}
                      />
                    }
                    label={priorityLabel}
                  />
                ))}
              </Stack>
              <Divider sx={{ mb: 2 }} />
            </>
          )}

          {/* Category Filter */}
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Category
          </Typography>
          <Stack spacing={1} mb={2}>
            {loadingFilterOptions.categories ? (
              <Typography color="text.secondary">Loading categories...</Typography>
            ) : filterOptions.categories.length === 0 ? (
              <Typography color="text.secondary">No categories available.</Typography>
            ) : (
              filterOptions.categories.map((category) => (
                <FormControlLabel
                  key={category.id}
                  control={
                    <Checkbox
                      checked={selectedFilters.categories.includes(category.name)}
                      onChange={() => handleFilterToggle("categories", category.name)}
                    />
                  }
                  label={category.name}
                />
              ))
            )}
          </Stack>
          <Divider sx={{ mb: 2 }} />

          {/* Assigned To Filter */}
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Assigned To
          </Typography>
          <Stack spacing={1} mb={2}>
            {loadingFilterOptions.assignedTo ? (
              <Typography color="text.secondary">Loading users...</Typography>
            ) : filterOptions.assignedTo.length === 0 ? (
              <Typography color="text.secondary">No users available.</Typography>
            ) : (
              <>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedFilters.assignedTo.includes("Unassigned")}
                      onChange={() => handleFilterToggle("assignedTo", "Unassigned")}
                    />
                  }
                  label="Unassigned"
                />
                {filterOptions.assignedTo.map((user) => (
                  <FormControlLabel
                    key={user.id}
                    control={
                      <Checkbox
                        checked={selectedFilters.assignedTo.includes(user.label)}
                        onChange={() => handleFilterToggle("assignedTo", user.label)}
                      />
                    }
                    label={user.label}
                  />
                ))}
              </>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Date Range Filter */}
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Date Range
          </Typography>
          <Stack spacing={1} direction="row" mb={2}>
            <TextField
              type="date"
              size="small"
              fullWidth
              label="Start Date"
              value={selectedFilters.startDate}
              onChange={handleDateChange("startDate")}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              size="small"
              fullWidth
              label="End Date"
              value={selectedFilters.endDate}
              onChange={handleDateChange("endDate")}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <Stack direction="row" spacing={1.5} mt={3}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() =>
                setSelectedFilters({
                  statuses: [],
                  priorities: [],
                  categories: [],
                  assignedTo: [],
                  startDate: "",
                  endDate: "",
                })
              }
            >
              Clear
            </Button>
            <Button variant="contained" onClick={() => setFilterDrawer(false)}>
              Apply
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}

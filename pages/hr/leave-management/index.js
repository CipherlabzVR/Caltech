import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import {
  Box,
  CircularProgress,
  Grid,
  Typography,
  Pagination,
  MenuItem,
  Chip,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import {
  createAuthHeaders,
  getOrgId,
  parsePagedResponse,
  parseObjectResponse,
  formatDate,
} from "@/components/utils/apiHelpers";
import MetricCard from "@/components/HR/ModernCard";
import ModernTable from "@/components/HR/ModernTable";
import ModernSearch from "@/components/HR/ModernSearch";
import ModernFilter from "@/components/HR/ModernFilter";
import AddButton from "@/components/HR/AddButton";
import ActionButtons from "@/components/HR/ActionButtons";
import ConfirmDialog from "@/components/HR/ConfirmDialog";
import FormDialog from "@/components/HR/FormDialog";
import FormField from "@/components/HR/FormField";
import EventNoteIcon from "@mui/icons-material/EventNote";
import PendingIcon from "@mui/icons-material/Pending";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

const LEAVE_STATUS_LABELS = {
  Pending: "Pending",
  Approved: "Approved",
  Rejected: "Rejected",
  Cancelled: "Cancelled",
};

const LEAVE_TYPE_LABELS = {
  Annual: "Annual",
  Sick: "Sick",
  Casual: "Casual",
  Maternity: "Maternity",
  Paternity: "Paternity",
  Unpaid: "Unpaid",
  Compensatory: "Compensatory",
};

const getStatusColor = (status) => {
  switch (status) {
    case "Approved":
      return "success";
    case "Rejected":
      return "error";
    case "Cancelled":
      return "default";
    default:
      return "warning";
  }
};

const LeaveManagement = () => {
  const categoryId = 129;
  const moduleId = 6;

  useEffect(() => {
    sessionStorage.setItem("moduleid", moduleId);
    sessionStorage.setItem("category", categoryId);
    
    // Ensure orgId is set from sessionStorage or localStorage
    if (!sessionStorage.getItem("orgId")) {
      const orgIdFromLocal = localStorage.getItem("orgId");
      if (orgIdFromLocal) {
        sessionStorage.setItem("orgId", orgIdFromLocal);
      }
    }
  }, [moduleId, categoryId]);

  const { navigate } = IsPermissionEnabled(categoryId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    averageLeaveDays: 0,
  });

  useEffect(() => {
    if (!navigate) {
      return;
    }

    let ignore = false;

    const loadLeaveData = async () => {
      try {
        setLoading(true);
        setError(null);

        const orgId = getOrgId();
        const headers = createAuthHeaders();
        const skip = (page - 1) * pageSize;

        // Load leave requests
        let query = `${BASE_URL}/hr/leaves/requests?OrgId=${orgId || 0}&SkipCount=${skip}&MaxResultCount=${pageSize}`;
        
        if (search) {
          // Search by employee profile ID if it's a number
          const searchNum = parseInt(search);
          if (!isNaN(searchNum)) {
            query += `&EmployeeProfileId=${searchNum}`;
          }
        }
        
        if (statusFilter) {
          query += `&Status=${encodeURIComponent(statusFilter)}`;
        }
        
        // Add date range filter for current month
        const today = new Date();
        const fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        query += `&From=${fromDate.toISOString()}&To=${toDate.toISOString()}`;
        
        const [requestsResponse, analyticsResponse] = await Promise.all([
          fetch(query, { headers }),
          fetch(
            `${BASE_URL}/hr/leaves/analytics?OrgId=${orgId || 0}&From=${fromDate.toISOString()}&To=${toDate.toISOString()}`,
            { headers }
          ),
        ]);

        if (!requestsResponse.ok) {
          throw new Error("Unable to load leave requests");
        }

        const requestsPayload = parsePagedResponse(await requestsResponse.json());
        
        if (analyticsResponse.ok) {
          const analyticsPayload = parseObjectResponse(await analyticsResponse.json());
          if (!ignore) {
            setAnalytics({
              totalRequests: analyticsPayload.totalRequests ?? 0,
              pendingRequests: analyticsPayload.pendingRequests ?? 0,
              approvedRequests: analyticsPayload.approvedRequests ?? 0,
              rejectedRequests: analyticsPayload.rejectedRequests ?? 0,
              averageLeaveDays: analyticsPayload.averageLeaveDays ?? 0,
            });
          }
        }

        if (ignore) {
          return;
        }

        setLeaveRequests(requestsPayload.items ?? []);
        setTotalCount(requestsPayload.totalCount ?? 0);
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load leave data");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadLeaveData();

    return () => {
      ignore = true;
    };
  }, [navigate, page, pageSize, search, statusFilter]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(event.target.value);
    setPage(1);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleAdd = () => {
    setFormMode("add");
    setFormData({
      employeeProfileId: "",
      leavePolicyId: "",
      startDate: "",
      endDate: "",
      duration: "",
      reason: "",
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleEdit = (item) => {
    setFormMode("edit");
    setFormData({
      id: item.id,
      employeeProfileId: item.employeeProfileId || "",
      leavePolicyId: item.leavePolicyId || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      duration: item.duration || "",
      reason: item.reason || "",
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.employeeProfileId) errors.employeeProfileId = "Employee is required";
    if (!formData.leavePolicyId) errors.leavePolicyId = "Leave Policy is required";
    if (!formData.startDate) errors.startDate = "Start Date is required";
    if (!formData.endDate) errors.endDate = "End Date is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      const headers = createAuthHeaders();
      const payload = {
        employeeProfileId: parseInt(formData.employeeProfileId),
        leavePolicyId: parseInt(formData.leavePolicyId),
        startDate: formData.startDate,
        endDate: formData.endDate,
        duration: formData.duration ? parseFloat(formData.duration) : 0,
        reason: formData.reason || null,
      };

      const url = formMode === "add"
        ? `${BASE_URL}/hr/leaves/requests`
        : `${BASE_URL}/hr/leaves/requests/${formData.id}`;
      const method = formMode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save leave request");
      }

      setFormOpen(false);
      toast.success(formMode === "add" ? "Leave request created successfully!" : "Leave request updated successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error(error.message || "Failed to save leave request");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    
    try {
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      
      const response = await fetch(`${BASE_URL}/hr/leaves/requests/${selectedItem.id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete leave request");
      }

      setDeleteDialogOpen(false);
      setSelectedItem(null);
      
      toast.success("Leave request deleted successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error(error.message || "Failed to delete leave request");
    }
  };

  const summaryCards = [
    {
      title: "Total Requests",
      value: analytics.totalRequests,
      subtitle: "All leave requests",
      icon: <EventNoteIcon />,
      color: "primary",
    },
    {
      title: "Pending",
      value: analytics.pendingRequests,
      subtitle: "Awaiting approval",
      icon: <PendingIcon />,
      color: "warning",
    },
    {
      title: "Approved",
      value: analytics.approvedRequests,
      subtitle: "Approved requests",
      icon: <CheckCircleIcon />,
      color: "success",
    },
    {
      title: "Rejected",
      value: analytics.rejectedRequests,
      subtitle: "Rejected requests",
      icon: <CancelIcon />,
      color: "danger",
    },
  ];

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Leave Management</h1>
        <ul>
          <li>
            <Link href="/hr/leave-management/">Leave Management</Link>
          </li>
        </ul>
      </div>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={320}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {error ? (
            <Box mb={3}>
              <Typography color="error">{error}</Typography>
            </Box>
          ) : null}

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {summaryCards.map((card) => (
              <Grid item xs={12} sm={6} md={3} key={card.title}>
                <MetricCard {...card} />
              </Grid>
            ))}
            <Grid item xs={12} md={4}>
              <MetricCard
                title="Average Leave Days"
                value={analytics.averageLeaveDays?.toFixed?.(1) ?? analytics.averageLeaveDays}
                subtitle="Average days per request"
                icon={<CalendarTodayIcon />}
                color="info"
              />
            </Grid>
          </Grid>

          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
                Leave Requests
              </Typography>
              <AddButton
                label="Request Leave"
                onClick={() => {
                  // TODO: Navigate to add leave request page or open modal
                  handleAdd();
                }}
              />
            </Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <ModernSearch
                  placeholder="Search leave requests..."
                  value={search}
                  onChange={handleSearchChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ModernFilter
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  options={[
                    { value: "", label: "All Statuses" },
                    ...Object.keys(LEAVE_STATUS_LABELS).map((status) => ({
                      value: status,
                      label: LEAVE_STATUS_LABELS[status],
                    })),
                  ]}
                />
              </Grid>
            </Grid>

            <ModernTable
              columns={[
                { id: "employeeProfileId", label: "Employee" },
                {
                  id: "leaveType",
                  label: "Leave Type",
                  render: (value) => LEAVE_TYPE_LABELS[value] || value || "-",
                },
                {
                  id: "startDate",
                  label: "Start Date",
                  render: (value) => formatDate(value),
                },
                {
                  id: "endDate",
                  label: "End Date",
                  render: (value) => formatDate(value),
                },
                {
                  id: "days",
                  label: "Days",
                  render: (_, row) => {
                    const startDate = row.startDate ? new Date(row.startDate) : null;
                    const endDate = row.endDate ? new Date(row.endDate) : null;
                    return startDate && endDate
                      ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
                      : row.days || "-";
                  },
                },
                {
                  id: "status",
                  label: "Status",
                  render: (value) => (
                    <Chip
                      label={LEAVE_STATUS_LABELS[value] || value || "-"}
                      color={getStatusColor(value)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  ),
                },
                {
                  id: "appliedOn",
                  label: "Applied On",
                  render: (_, row) => formatDate(row.appliedOn || row.createdOn),
                },
                {
                  id: "reason",
                  label: "Reason",
                  render: (value) => (
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {value || "-"}
                    </Typography>
                  ),
                },
                {
                  id: "actions",
                  label: "Actions",
                  align: "center",
                  render: (_, row) => (
                    <ActionButtons
                      onEdit={() => handleEdit(row)}
                      onDelete={() => handleDelete(row)}
                      showDelete={row.status === "Pending" || row.status === "Draft"}
                    />
                  ),
                },
              ]}
              rows={leaveRequests.map((request) => ({
                id: request.id || request.internalId,
                employeeProfileId: request.employeeProfileId || "-",
                leaveType: request.leaveType,
                startDate: request.startDate,
                endDate: request.endDate,
                days: request.days,
                status: request.status,
                appliedOn: request.appliedOn || request.createdOn,
                reason: request.reason,
              }))}
              emptyMessage="No leave requests found"
            />
          </Box>

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={4}
            sx={{
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <ModernFilter
              label="Page Size"
              value={pageSize}
              onChange={handlePageSizeChange}
              options={[
                { value: 10, label: "10" },
                { value: 20, label: "20" },
                { value: 50, label: "50" },
                { value: 100, label: "100" },
              ]}
              fullWidth={false}
              sx={{ minWidth: 120 }}
            />
            <Pagination
              count={Math.ceil(totalCount / pageSize)}
              page={page}
              onChange={handlePageChange}
              color="primary"
              sx={{
                "& .MuiPaginationItem-root": {
                  borderRadius: "8px",
                },
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Showing {leaveRequests.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(page * pageSize, totalCount)} of {totalCount} requests
            </Typography>
          </Box>

          <ConfirmDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSelectedItem(null);
            }}
            onConfirm={confirmDelete}
            title="Delete Leave Request"
            message={`Are you sure you want to delete this leave request? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            confirmColor="error"
          />

          <FormDialog
            open={formOpen}
            onClose={() => setFormOpen(false)}
            title={formMode === "add" ? "Request Leave" : "Edit Leave Request"}
            onSubmit={handleFormSubmit}
            submitLabel={formMode === "add" ? "Submit" : "Update"}
            loading={formLoading}
            maxWidth="md"
          >
            <Grid container spacing={2}>
              <FormField
                name="employeeProfileId"
                label="Employee ID"
                type="number"
                value={formData.employeeProfileId}
                onChange={handleFormChange}
                required
                error={!!formErrors.employeeProfileId}
                helperText={formErrors.employeeProfileId}
              />
              <FormField
                name="leavePolicyId"
                label="Leave Policy ID"
                type="number"
                value={formData.leavePolicyId}
                onChange={handleFormChange}
                required
                error={!!formErrors.leavePolicyId}
                helperText={formErrors.leavePolicyId}
              />
              <FormField
                name="startDate"
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={handleFormChange}
                required
                error={!!formErrors.startDate}
                helperText={formErrors.startDate}
              />
              <FormField
                name="endDate"
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={handleFormChange}
                required
                error={!!formErrors.endDate}
                helperText={formErrors.endDate}
              />
              <FormField
                name="duration"
                label="Duration (days)"
                type="number"
                value={formData.duration}
                onChange={handleFormChange}
                xs={6}
              />
              <FormField
                name="reason"
                label="Reason"
                type="textarea"
                value={formData.reason}
                onChange={handleFormChange}
                rows={3}
                xs={12}
              />
            </Grid>
          </FormDialog>
        </>
      )}
    </>
  );
};

export default LeaveManagement;


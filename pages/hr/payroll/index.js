import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Pagination,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Chip,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import BASE_URL from "Base/api";
import ActionButtons from "@/components/HR/ActionButtons";
import ConfirmDialog from "@/components/HR/ConfirmDialog";
import ModernTable from "@/components/HR/ModernTable";
import AddButton from "@/components/HR/AddButton";
import FormDialog from "@/components/HR/FormDialog";
import FormField from "@/components/HR/FormField";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import {
  createAuthHeaders,
  getOrgId,
  parsePagedResponse,
  parseObjectResponse,
  formatDate,
} from "@/components/utils/apiHelpers";

const CYCLE_STATUS_LABELS = {
  Draft: "Draft",
  Active: "Active",
  Closed: "Closed",
  Cancelled: "Cancelled",
};

const RUN_STATUS_LABELS = {
  Initiated: "Initiated",
  Processing: "Processing",
  Completed: "Completed",
  Failed: "Failed",
  Cancelled: "Cancelled",
};

const getStatusColor = (status) => {
  switch (status) {
    case "Active":
    case "Completed":
      return "success";
    case "Closed":
    case "Failed":
      return "error";
    case "Cancelled":
      return "default";
    case "Draft":
    case "Initiated":
      return "info";
    default:
      return "warning";
  }
};

const Payroll = () => {
  const categoryId = 132;
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
  const [payrollCycles, setPayrollCycles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalEmployees: 0,
    totalPayrollAmount: 0,
    completedRuns: 0,
    pendingRuns: 0,
    averageSalary: 0,
  });

  useEffect(() => {
    if (!navigate) {
      return;
    }

    let ignore = false;

    const loadPayrollData = async () => {
      try {
        setLoading(true);
        setError(null);

        const orgId = getOrgId();
        const headers = createAuthHeaders();
        const skip = (page - 1) * pageSize;

        // Load payroll cycles
        let query = `${BASE_URL}/hr/payroll/cycles?OrgId=${orgId || 0}&skip=${skip}&take=${pageSize}`;
        
        if (search) {
          // Filter will be done client-side since API doesn't support search parameter
        }

        // Load dashboard metrics
        const today = new Date();
        const fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const [cyclesResponse, dashboardResponse] = await Promise.all([
          fetch(query, { headers }),
          fetch(
            `${BASE_URL}/hr/payroll/dashboard?OrgId=${orgId || 0}&from=${fromDate.toISOString()}&to=${toDate.toISOString()}`,
            { headers }
          ),
        ]);

        if (!cyclesResponse.ok) {
          throw new Error("Unable to load payroll cycles");
        }

        const cyclesPayload = parsePagedResponse(await cyclesResponse.json());

        if (dashboardResponse.ok) {
          const dashboardPayload = parseObjectResponse(await dashboardResponse.json());
          if (!ignore) {
            setDashboardMetrics({
              totalEmployees: dashboardPayload.totalEmployees ?? 0,
              totalPayrollAmount: dashboardPayload.totalPayrollAmount ?? 0,
              completedRuns: dashboardPayload.completedRuns ?? 0,
              pendingRuns: dashboardPayload.pendingRuns ?? 0,
              averageSalary: dashboardPayload.averageSalary ?? 0,
            });
          }
        }

        if (ignore) {
          return;
        }

        // Filter cycles based on search
        let filteredCycles = cyclesPayload.items || [];
        if (search) {
          const searchLower = search.toLowerCase();
          filteredCycles = filteredCycles.filter(
            (cycle) =>
              cycle.name?.toLowerCase().includes(searchLower) ||
              cycle.description?.toLowerCase().includes(searchLower)
          );
        }

        setPayrollCycles(filteredCycles);
        setTotalCount(cyclesPayload.totalCount ?? filteredCycles.length);
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load payroll data");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadPayrollData();

    return () => {
      ignore = true;
    };
  }, [navigate, page, pageSize, search]);

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

  const formatCurrency = (value) => {
    if (!value) return "0.00";
    const number = parseFloat(value);
    if (isNaN(number)) return "0.00";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  };

  const handleAdd = () => {
    setFormMode("add");
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      payPeriod: "Monthly",
      status: "Draft",
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleEdit = (item) => {
    setFormMode("edit");
    setFormData({
      id: item.id,
      name: item.name || "",
      description: item.description || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      payPeriod: item.payPeriod || "Monthly",
      status: item.status || "Draft",
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
    if (!formData.name?.trim()) errors.name = "Cycle Name is required";
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
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      const payload = {
        orgId,
        name: formData.name,
        description: formData.description || null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        payPeriod: formData.payPeriod || "Monthly",
        status: formData.status || "Draft",
      };

      const url = formMode === "add"
        ? `${BASE_URL}/hr/payroll/cycles`
        : `${BASE_URL}/hr/payroll/cycles/${formData.id}`;
      const method = formMode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save payroll cycle");
      }

      setFormOpen(false);
      toast.success(formMode === "add" ? "Payroll cycle created successfully!" : "Payroll cycle updated successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error(error.message || "Failed to save payroll cycle");
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
      
      const response = await fetch(`${BASE_URL}/hr/payroll/cycles/${selectedItem.id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete payroll cycle");
      }

      setDeleteDialogOpen(false);
      setSelectedItem(null);
      
      toast.success("Payroll cycle deleted successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error(error.message || "Failed to delete payroll cycle");
    }
  };

  const summaryCards = [
    {
      title: "Total Employees",
      value: dashboardMetrics.totalEmployees,
      subtitle: "Employees in payroll",
    },
    {
      title: "Total Payroll",
      value: `$${formatCurrency(dashboardMetrics.totalPayrollAmount)}`,
      subtitle: "Total payroll amount",
    },
    {
      title: "Completed Runs",
      value: dashboardMetrics.completedRuns,
      subtitle: "Completed payroll runs",
    },
    {
      title: "Pending Runs",
      value: dashboardMetrics.pendingRuns,
      subtitle: "Pending payroll runs",
    },
    {
      title: "Average Salary",
      value: `$${formatCurrency(dashboardMetrics.averageSalary)}`,
      subtitle: "Average employee salary",
    },
  ];

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Payroll</h1>
        <ul>
          <li>
            <Link href="/hr/payroll/">Payroll</Link>
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

          <Grid container spacing={2} mb={3}>
            {summaryCards.map((card) => (
              <Grid item xs={12} sm={6} md={4} key={card.title}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {card.title}
                    </Typography>
                    <Typography variant="h4" sx={{ my: 1 }}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.subtitle}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
              Payroll Cycles
            </Typography>
            <AddButton
              label="New Payroll Cycle"
              onClick={() => {
                handleAdd();
              }}
            />
          </Box>

          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={6}>
              <Search>
                <StyledInputBase
                  placeholder="Search payroll cycles..."
                  inputProps={{ "aria-label": "search" }}
                  value={search}
                  onChange={handleSearchChange}
                />
              </Search>
            </Grid>
          </Grid>

            <ModernTable
              columns={[
                { id: "name", label: "Cycle Name" },
                {
                  id: "description",
                  label: "Description",
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
                  id: "status",
                  label: "Status",
                  render: (value) => (
                    <Chip
                      label={CYCLE_STATUS_LABELS[value] || value || "-"}
                      color={getStatusColor(value)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  ),
                },
                { id: "payPeriod", label: "Pay Period" },
                {
                  id: "actions",
                  label: "Actions",
                  align: "center",
                  render: (_, row) => (
                    <ActionButtons
                      onEdit={() => handleEdit(row)}
                      onDelete={() => handleDelete(row)}
                      showDelete={row.status === "Draft"}
                    />
                  ),
                },
              ]}
              rows={payrollCycles.map((cycle) => ({
                id: cycle.id || cycle.internalId,
                name: cycle.name || "-",
                description: cycle.description,
                startDate: cycle.startDate,
                endDate: cycle.endDate,
                status: cycle.status,
                payPeriod: cycle.payPeriod || "-",
              }))}
              emptyMessage="No payroll cycles found"
            />

          <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Page Size</InputLabel>
              <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
            <Pagination
              count={Math.ceil(totalCount / pageSize)}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
            <Typography variant="body2" color="text.secondary">
              Showing {payrollCycles.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(page * pageSize, totalCount)} of {totalCount} cycles
            </Typography>
          </Box>

          <ConfirmDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSelectedItem(null);
            }}
            onConfirm={confirmDelete}
            title="Delete Payroll Cycle"
            message={`Are you sure you want to delete payroll cycle "${selectedItem?.name || selectedItem?.id}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            confirmColor="error"
          />

          <FormDialog
            open={formOpen}
            onClose={() => setFormOpen(false)}
            title={formMode === "add" ? "New Payroll Cycle" : "Edit Payroll Cycle"}
            onSubmit={handleFormSubmit}
            submitLabel={formMode === "add" ? "Create" : "Update"}
            loading={formLoading}
            maxWidth="md"
          >
            <Grid container spacing={2}>
              <FormField
                name="name"
                label="Cycle Name"
                value={formData.name}
                onChange={handleFormChange}
                required
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
              <FormField
                name="description"
                label="Description"
                type="textarea"
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
                xs={12}
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
                name="payPeriod"
                label="Pay Period"
                type="select"
                value={formData.payPeriod}
                onChange={handleFormChange}
                options={["Monthly", "Bi-Weekly", "Weekly", "Semi-Monthly"].map(v => ({ value: v, label: v }))}
              />
              <FormField
                name="status"
                label="Status"
                type="select"
                value={formData.status}
                onChange={handleFormChange}
                options={["Draft", "Active", "Completed", "Cancelled"].map(v => ({ value: v, label: v }))}
              />
            </Grid>
          </FormDialog>
        </>
      )}
    </>
  );
};

export default Payroll;


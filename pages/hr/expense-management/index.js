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
import FormDialog from "@/components/HR/FormDialog";
import FormField from "@/components/HR/FormField";
import AddButton from "@/components/HR/AddButton";
import ModernFilter from "@/components/HR/ModernFilter";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { useCurrency } from "@/components/HR/CurrencyContext";
import {
  createAuthHeaders,
  getOrgId,
  parsePagedResponse,
  parseObjectResponse,
  formatDate,
} from "@/components/utils/apiHelpers";

const EXPENSE_STATUS_LABELS = {
  Draft: "Draft",
  Submitted: "Submitted",
  Approved: "Approved",
  Rejected: "Rejected",
  Settled: "Settled",
  Cancelled: "Cancelled",
};

const getStatusColor = (status) => {
  switch (status) {
    case "Approved":
    case "Settled":
      return "success";
    case "Rejected":
      return "error";
    case "Cancelled":
      return "default";
    case "Draft":
      return "info";
    default:
      return "warning";
  }
};

const ExpenseManagement = () => {
  const { currency, setCurrency, formatCurrencyWithSymbol } = useCurrency();
  const categoryId = 130;
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
  const [expenseClaims, setExpenseClaims] = useState([]);
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
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalClaims: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    totalAmount: 0,
    averageClaimAmount: 0,
    settledAmount: 0,
  });

  useEffect(() => {
    if (!navigate) {
      return;
    }

    let ignore = false;

    const loadExpenseData = async () => {
      try {
        setLoading(true);
        setError(null);

        const orgId = getOrgId();
        const headers = createAuthHeaders();
        const skip = (page - 1) * pageSize;

        // Load expense claims
        let query = `${BASE_URL}/hr/expenses/claims?OrgId=${orgId || 0}&SkipCount=${skip}&MaxResultCount=${pageSize}`;
        
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

        // Load dashboard metrics (reuse date variables)
        
        const [claimsResponse, dashboardResponse] = await Promise.all([
          fetch(query, { headers }),
          fetch(
            `${BASE_URL}/hr/expenses/dashboard?OrgId=${orgId || 0}&from=${fromDate.toISOString()}&to=${toDate.toISOString()}`,
            { headers }
          ),
        ]);

        if (!claimsResponse.ok) {
          throw new Error("Unable to load expense claims");
        }

        const claimsPayload = parsePagedResponse(await claimsResponse.json());
        
        if (dashboardResponse.ok) {
          const dashboardPayload = parseObjectResponse(await dashboardResponse.json());
          if (!ignore) {
            setDashboardMetrics({
              totalClaims: dashboardPayload.totalClaims ?? 0,
              pendingClaims: dashboardPayload.pendingClaims ?? 0,
              approvedClaims: dashboardPayload.approvedClaims ?? 0,
              totalAmount: dashboardPayload.totalAmount ?? 0,
              averageClaimAmount: dashboardPayload.averageClaimAmount ?? 0,
              settledAmount: dashboardPayload.settledAmount ?? 0,
            });
          }
        }

        if (ignore) {
          return;
        }

        setExpenseClaims(claimsPayload.items ?? []);
        setTotalCount(claimsPayload.totalCount ?? 0);
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load expense data");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadExpenseData();

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
      title: "",
      currency: currency || "USD",
      submit: false,
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleEdit = (item) => {
    setFormMode("edit");
    setFormData({
      id: item.id,
      employeeProfileId: item.employeeProfileId || "",
      title: item.description || item.purpose || "",
      currency: item.currency || "USD",
      submit: false,
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
    if (!formData.title?.trim()) errors.title = "Title is required";
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
        title: formData.title,
        currency: formData.currency || "USD",
        lineItems: [],
        submit: formData.submit || false,
      };

      const url = formMode === "add"
        ? `${BASE_URL}/hr/expenses/claims`
        : `${BASE_URL}/hr/expenses/claims/${formData.id}`;
      const method = formMode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save expense claim");
      }

      setFormOpen(false);
      toast.success(formMode === "add" ? "Expense claim created successfully!" : "Expense claim updated successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error(error.message || "Failed to save expense claim");
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
      
      const response = await fetch(`${BASE_URL}/hr/expenses/claims/${selectedItem.id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete expense claim");
      }

      setDeleteDialogOpen(false);
      setSelectedItem(null);
      
      toast.success("Expense claim deleted successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error(error.message || "Failed to delete expense claim");
    }
  };

  // Use currency context for formatting

  const summaryCards = [
    {
      title: "Total Claims",
      value: dashboardMetrics.totalClaims,
      subtitle: "All expense claims",
    },
    {
      title: "Pending",
      value: dashboardMetrics.pendingClaims,
      subtitle: "Awaiting approval",
    },
    {
      title: "Approved",
      value: dashboardMetrics.approvedClaims,
      subtitle: "Approved claims",
    },
    {
      title: "Total Amount",
      value: formatCurrencyWithSymbol(dashboardMetrics.totalAmount),
      subtitle: "Total claim amount",
    },
    {
      title: "Average Claim",
      value: formatCurrencyWithSymbol(dashboardMetrics.averageClaimAmount),
      subtitle: "Average per claim",
    },
    {
      title: "Settled Amount",
      value: formatCurrencyWithSymbol(dashboardMetrics.settledAmount),
      subtitle: "Amount settled",
    },
  ];

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Expense Management</h1>
        <ul>
          <li>
            <Link href="/hr/expense-management/">Expense Management</Link>
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

          <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
            <ModernFilter
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={[
                { value: "USD", label: "USD ($)" },
                { value: "LKR", label: "LKR (Rs.)" },
              ]}
              sx={{ minWidth: 150 }}
            />
          </Box>

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
              Expense Claims
            </Typography>
            <AddButton label="New Expense Claim" onClick={handleAdd} />
          </Box>

          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={6}>
              <Search>
                <StyledInputBase
                  placeholder="Search expense claims..."
                  inputProps={{ "aria-label": "search" }}
                  value={search}
                  onChange={handleSearchChange}
                />
              </Search>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {Object.keys(EXPENSE_STATUS_LABELS).map((status) => (
                    <MenuItem key={status} value={status}>
                      {EXPENSE_STATUS_LABELS[status]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

            <ModernTable
              columns={[
                { id: "employeeProfileId", label: "Employee" },
                {
                  id: "claimDate",
                  label: "Claim Date",
                  render: (_, row) => formatDate(row.claimDate || row.createdOn),
                },
                {
                  id: "description",
                  label: "Description",
                  render: (value, row) => (
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {value || row.purpose || "-"}
                    </Typography>
                  ),
                },
                {
                  id: "totalAmount",
                  label: "Amount",
                  render: (value, row) => {
                    const totalAmount = value || 
                      (row.lineItems && row.lineItems.length > 0
                        ? row.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0)
                        : 0);
                    return formatCurrencyWithSymbol(totalAmount);
                  },
                },
                {
                  id: "status",
                  label: "Status",
                  render: (value) => (
                    <Chip
                      label={EXPENSE_STATUS_LABELS[value] || value || "-"}
                      color={getStatusColor(value)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  ),
                },
                {
                  id: "submittedOn",
                  label: "Submitted On",
                  render: (_, row) => formatDate(row.submittedOn || row.createdOn),
                },
                {
                  id: "approvedOn",
                  label: "Approved On",
                  render: (value) => formatDate(value),
                },
                {
                  id: "actions",
                  label: "Actions",
                  align: "center",
                  render: (_, row) => (
                    <ActionButtons
                      onEdit={() => handleEdit(row)}
                      onDelete={() => handleDelete(row)}
                      showDelete={row.status === "Draft" || row.status === "Submitted"}
                    />
                  ),
                },
              ]}
              rows={expenseClaims.map((claim) => ({
                id: claim.id || claim.internalId,
                employeeProfileId: claim.employeeProfileId || "-",
                claimDate: claim.claimDate || claim.createdOn,
                description: claim.description || claim.purpose,
                totalAmount: claim.totalAmount,
                lineItems: claim.lineItems,
                status: claim.status,
                submittedOn: claim.submittedOn || claim.createdOn,
                approvedOn: claim.approvedOn,
                claimNumber: claim.claimNumber,
              }))}
              emptyMessage="No expense claims found"
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
              Showing {expenseClaims.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(page * pageSize, totalCount)} of {totalCount} claims
            </Typography>
          </Box>

          <ConfirmDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSelectedItem(null);
            }}
            onConfirm={confirmDelete}
            title="Delete Expense Claim"
            message={`Are you sure you want to delete expense claim "${selectedItem?.claimNumber || selectedItem?.id}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            confirmColor="error"
          />

          <FormDialog
            open={formOpen}
            onClose={() => setFormOpen(false)}
            title={formMode === "add" ? "New Expense Claim" : "Edit Expense Claim"}
            onSubmit={handleFormSubmit}
            submitLabel={formMode === "add" ? "Create" : "Update"}
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
                name="title"
                label="Claim Title"
                value={formData.title}
                onChange={handleFormChange}
                required
                error={!!formErrors.title}
                helperText={formErrors.title}
              />
              <FormField
                name="currency"
                label="Currency"
                type="select"
                value={formData.currency}
                onChange={handleFormChange}
                options={["USD", "LKR"].map(v => ({ value: v, label: v }))}
                xs={6}
              />
            </Grid>
          </FormDialog>
        </>
      )}
    </>
  );
};

export default ExpenseManagement;


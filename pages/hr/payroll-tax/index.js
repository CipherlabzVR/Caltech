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
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import {
  createAuthHeaders,
  getOrgId,
  parsePagedResponse,
  parseObjectResponse,
  formatDate,
} from "@/components/utils/apiHelpers";

const REPORT_STATUS_LABELS = {
  Draft: "Draft",
  Generated: "Generated",
  Submitted: "Submitted",
  Approved: "Approved",
  Rejected: "Rejected",
};

const COMPLIANCE_STATUS_LABELS = {
  Compliant: "Compliant",
  NonCompliant: "Non-Compliant",
  Pending: "Pending",
  UnderReview: "Under Review",
};

const getStatusColor = (status) => {
  switch (status) {
    case "Approved":
    case "Compliant":
    case "Generated":
      return "success";
    case "Rejected":
    case "NonCompliant":
      return "error";
    case "Draft":
    case "Pending":
      return "info";
    default:
      return "warning";
  }
};

const PayrollTax = () => {
  const categoryId = 133;
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
  const [taxReports, setTaxReports] = useState([]);
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
  const [complianceStatus, setComplianceStatus] = useState({
    overallStatus: "Pending",
    totalDeclarations: 0,
    pendingDeclarations: 0,
    submittedDeclarations: 0,
    totalTaxAmount: 0,
  });

  useEffect(() => {
    if (!navigate) {
      return;
    }

    let ignore = false;

    const loadTaxData = async () => {
      try {
        setLoading(true);
        setError(null);

        const orgId = getOrgId();
        const headers = createAuthHeaders();
        const skip = (page - 1) * pageSize;

        // Load tax reports
        let query = `${BASE_URL}/hr/tax/reports?OrgId=${orgId || 0}&SkipCount=${skip}&MaxResultCount=${pageSize}`;
        
        if (search) {
          // Search by report name or type
          query += `&ReportType=${encodeURIComponent(search)}`;
        }
        
        if (statusFilter) {
          // Note: Tax reports may not have status filter, but we'll include it if the API supports it
        }
        
        // Add date range filter for current month
        const today = new Date();
        const fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        query += `&From=${fromDate.toISOString()}&To=${toDate.toISOString()}`;

        // Load compliance status
        const [reportsResponse, complianceResponse] = await Promise.all([
          fetch(query, { headers }),
          fetch(`${BASE_URL}/hr/tax/compliance/status?OrgId=${orgId || 0}`, { headers }),
        ]);

        if (!reportsResponse.ok) {
          throw new Error("Unable to load tax reports");
        }

        const reportsPayload = parsePagedResponse(await reportsResponse.json());

        if (complianceResponse.ok) {
          const compliancePayload = parseObjectResponse(await complianceResponse.json());
          if (!ignore) {
            setComplianceStatus({
              overallStatus: compliancePayload.overallStatus || "Pending",
              totalDeclarations: compliancePayload.totalDeclarations ?? 0,
              pendingDeclarations: compliancePayload.pendingDeclarations ?? 0,
              submittedDeclarations: compliancePayload.submittedDeclarations ?? 0,
              totalTaxAmount: compliancePayload.totalTaxAmount ?? 0,
            });
          }
        }

        if (ignore) {
          return;
        }

        setTaxReports(reportsPayload.items ?? []);
        setTotalCount(reportsPayload.totalCount ?? 0);
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load tax data");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadTaxData();

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
    const currentYear = new Date().getFullYear();
    setFormData({
      reportType: "Annual",
      periodStart: new Date(currentYear, 0, 1).toISOString().split('T')[0],
      periodEnd: new Date(currentYear, 11, 31).toISOString().split('T')[0],
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleEdit = (item) => {
    setFormMode("edit");
    setFormData({
      id: item.id,
      reportType: item.reportType || "Annual",
      periodStart: item.periodStart ? new Date(item.periodStart).toISOString().split('T')[0] : new Date().getFullYear() + "-01-01",
      periodEnd: item.periodEnd ? new Date(item.periodEnd).toISOString().split('T')[0] : new Date().getFullYear() + "-12-31",
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
    if (!formData.reportType?.trim()) errors.reportType = "Report Type is required";
    if (!formData.periodStart) errors.periodStart = "Period Start is required";
    if (!formData.periodEnd) errors.periodEnd = "Period End is required";
    if (formData.periodStart && formData.periodEnd && new Date(formData.periodEnd) <= new Date(formData.periodStart)) {
      errors.periodEnd = "Period End must be after Period Start";
    }
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
        reportType: formData.reportType || "Annual",
        periodStart: formData.periodStart || new Date(parseInt(formData.fiscalYear), 0, 1).toISOString(),
        periodEnd: formData.periodEnd || new Date(parseInt(formData.fiscalYear), 11, 31).toISOString(),
      };

      const url = formMode === "add"
        ? `${BASE_URL}/hr/tax/reports`
        : `${BASE_URL}/hr/tax/reports/${formData.id}`;
      const method = formMode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save tax report");
      }

      setFormOpen(false);
      toast.success(formMode === "add" ? "Tax report created successfully!" : "Tax report updated successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error(error.message || "Failed to save tax report");
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
      
      const response = await fetch(`${BASE_URL}/hr/tax/reports/${selectedItem.id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete tax report");
      }

      setDeleteDialogOpen(false);
      setSelectedItem(null);
      
      toast.success("Tax report deleted successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error(error.message || "Failed to delete tax report");
    }
  };

  const summaryCards = [
    {
      title: "Compliance Status",
      value: COMPLIANCE_STATUS_LABELS[complianceStatus.overallStatus] || complianceStatus.overallStatus,
      subtitle: "Overall compliance status",
      color: getStatusColor(complianceStatus.overallStatus),
    },
    {
      title: "Total Declarations",
      value: complianceStatus.totalDeclarations,
      subtitle: "All tax declarations",
    },
    {
      title: "Pending",
      value: complianceStatus.pendingDeclarations,
      subtitle: "Pending declarations",
    },
    {
      title: "Submitted",
      value: complianceStatus.submittedDeclarations,
      subtitle: "Submitted declarations",
    },
    {
      title: "Total Tax Amount",
      value: `$${formatCurrency(complianceStatus.totalTaxAmount)}`,
      subtitle: "Total tax amount",
    },
  ];

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Payroll Tax</h1>
        <ul>
          <li>
            <Link href="/hr/payroll-tax/">Payroll Tax</Link>
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
                      {card.color ? (
                        <Chip
                          label={card.value}
                          color={card.color}
                          size="small"
                          sx={{ fontSize: "1.5rem", height: "auto", py: 1 }}
                        />
                      ) : (
                        card.value
                      )}
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
              Tax Reports
            </Typography>
            <AddButton
              label="New Tax Declaration"
              onClick={() => {
                handleAdd();
              }}
            />
          </Box>

          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={6}>
              <Search>
                <StyledInputBase
                  placeholder="Search tax reports..."
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
                  {Object.keys(REPORT_STATUS_LABELS).map((status) => (
                    <MenuItem key={status} value={status}>
                      {REPORT_STATUS_LABELS[status]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

            <ModernTable
              columns={[
                { id: "reportName", label: "Report Name", render: (value, row) => value || row.name || "-" },
                { id: "reportType", label: "Report Type" },
                { id: "fiscalYear", label: "Fiscal Year" },
                { id: "period", label: "Period" },
                {
                  id: "status",
                  label: "Status",
                  render: (value) => (
                    <Chip
                      label={REPORT_STATUS_LABELS[value] || value || "-"}
                      color={getStatusColor(value)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  ),
                },
                {
                  id: "generatedOn",
                  label: "Generated On",
                  render: (_, row) => formatDate(row.generatedOn || row.createdOn),
                },
                {
                  id: "totalAmount",
                  label: "Total Amount",
                  render: (value) => `$${formatCurrency(value)}`,
                },
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
              rows={taxReports.map((report) => ({
                id: report.id || report.internalId,
                reportName: report.reportName || report.name,
                name: report.name,
                reportType: report.reportType || "-",
                fiscalYear: report.fiscalYear || "-",
                period: report.period || "-",
                status: report.status,
                generatedOn: report.generatedOn || report.createdOn,
                totalAmount: report.totalAmount,
              }))}
              emptyMessage="No tax reports found"
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
              Showing {taxReports.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(page * pageSize, totalCount)} of {totalCount} reports
            </Typography>
          </Box>

          <ConfirmDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSelectedItem(null);
            }}
            onConfirm={confirmDelete}
            title="Delete Tax Report"
            message={`Are you sure you want to delete tax report "${selectedItem?.reportName || selectedItem?.name || selectedItem?.id}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            confirmColor="error"
          />

          <FormDialog
            open={formOpen}
            onClose={() => setFormOpen(false)}
            title={formMode === "add" ? "New Tax Report" : "Edit Tax Report"}
            onSubmit={handleFormSubmit}
            submitLabel={formMode === "add" ? "Create" : "Update"}
            loading={formLoading}
            maxWidth="md"
          >
            <Grid container spacing={2}>
              <FormField
                name="reportType"
                label="Report Type"
                type="select"
                value={formData.reportType}
                onChange={handleFormChange}
                required
                error={!!formErrors.reportType}
                helperText={formErrors.reportType}
                options={["Annual", "Quarterly", "Monthly", "Ad-hoc"].map(v => ({ value: v, label: v }))}
              />
              <FormField
                name="periodStart"
                label="Period Start"
                type="date"
                value={formData.periodStart}
                onChange={handleFormChange}
                required
                error={!!formErrors.periodStart}
                helperText={formErrors.periodStart}
                xs={6}
              />
              <FormField
                name="periodEnd"
                label="Period End"
                type="date"
                value={formData.periodEnd}
                onChange={handleFormChange}
                required
                error={!!formErrors.periodEnd}
                helperText={formErrors.periodEnd}
                xs={6}
              />
            </Grid>
          </FormDialog>
        </>
      )}
    </>
  );
};

export default PayrollTax;


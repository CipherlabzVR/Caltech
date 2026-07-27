import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PrintIcon from "@mui/icons-material/Print";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import ActionButtons from "@/components/HR/ActionButtons";
import AddButton from "@/components/HR/AddButton";
import ConfirmDialog from "@/components/HR/ConfirmDialog";
import FormDialog from "@/components/HR/FormDialog";
import FormField from "@/components/HR/FormField";
import ModernFilter from "@/components/HR/ModernFilter";
import ModernSearch from "@/components/HR/ModernSearch";
import ModernTable from "@/components/HR/ModernTable";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import {
  createAuthHeaders,
  formatDate,
  getOrgId,
  parseObjectResponse,
} from "@/components/utils/apiHelpers";

const categoryId = 204;
const moduleId = 6;

const EMPLOYMENT_TYPES = ["Permanent", "Contract", "Casual", "Trainee"];
const PAYMENT_MODES = ["Bank Transfer", "Cash"];
const LEAVE_TYPES = [
  "Annual",
  "Sick",
  "Casual",
  "Maternity",
  "Paternity",
  "Unpaid",
  "Compensatory",
];

const CSV_TEMPLATE_HEADERS = [
  "FirstName",
  "LastName",
  "NIC",
  "MobileNumber",
  "Department",
  "EmploymentType",
  "JoinDate",
  "BasicSalary",
  "AttendanceAllowance",
  "TransportAllowance",
  "ProfessionalAllowance",
  "MobileAllowance",
  "PayrollCycle",
  "BankName",
  "BranchName",
  "AccountNumber",
  "PaymentMode",
  "EPFEmployeePercent",
  "EPFEmployerPercent",
  "ETFPercent",
];

const CSV_TEMPLATE_EXAMPLE = [
  "John",
  "Silva",
  "199012345678",
  "0771234567",
  "Operations",
  "Permanent",
  "2024-01-15",
  "50000",
  "2000",
  "3000",
  "1500",
  "500",
  "Monthly",
  "Commercial Bank",
  "Colombo",
  "1234567890",
  "Bank Transfer",
  "8",
  "12",
  "3",
];

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const getEmptyEmployeeForm = () => ({
  firstName: "",
  lastName: "",
  nic: "",
  mobileNumber: "",
  department: "",
  employmentType: "Permanent",
  joinDate: "",
  basicSalary: "",
  attendanceAllowance: 0,
  transportAllowance: 0,
  professionalAllowance: 0,
  mobileAllowance: 0,
  payrollCycle: "Monthly",
  bankName: "",
  branchName: "",
  accountNumber: "",
  paymentMode: "Bank Transfer",
  epfEmployeePercent: 8,
  epfEmployerPercent: 12,
  etfPercent: 3,
});

const getEmptyAdvanceForm = () => ({
  salaryEmployeeId: "",
  amount: "",
  advanceDate: new Date().toISOString().split("T")[0],
  reason: "",
});

const getEmptyLeaveForm = () => ({
  salaryEmployeeId: "",
  leaveType: "Annual",
  startDate: "",
  endDate: "",
  duration: "",
  reason: "",
});

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getApiErrorMessage = async (response, fallback) => {
  try {
    const data = await response.json();
    return data.message || data.title || data.error || fallback;
  } catch {
    return fallback;
  }
};

const normalizeListResponse = (payload) => {
  const data = parseObjectResponse(payload);
  return {
    items: data.items || data.Items || [],
    totalCount: data.totalCount ?? data.TotalCount ?? (data.items || data.Items || []).length,
  };
};

const parseCsvLine = (line) => {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};

const parseCsvText = (text) => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.replace(/^"|"$/g, ""));
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    if (values.every((value) => !value)) {
      continue;
    }

    const row = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] || "").replace(/^"|"$/g, "");
    });
    rows.push(row);
  }

  return rows;
};

const getAdvanceStatusChip = (status) => {
  const value = Number(status);
  const config = {
    0: { label: "Pending", color: "warning" },
    1: { label: "Approved", color: "success" },
    2: { label: "Settled", color: "info" },
    3: { label: "Rejected", color: "error" },
  };
  const current = config[value] || config[0];
  return <Chip label={current.label} color={current.color} size="small" sx={{ fontWeight: 600 }} />;
};

const getLeaveStatusChip = (status) => {
  const value = Number(status);
  const config = {
    0: { label: "Pending", color: "warning" },
    1: { label: "Approved", color: "success" },
    2: { label: "Rejected", color: "error" },
  };
  const current = config[value] || config[0];
  return <Chip label={current.label} color={current.color} size="small" sx={{ fontWeight: 600 }} />;
};

const matchesEmployeeSearch = (item, search) => {
  if (!search.trim()) {
    return true;
  }

  const term = search.trim().toLowerCase();
  const name = String(item.employeeName || item.EmployeeName || "").toLowerCase();
  const code = String(item.employeeCode || item.EmployeeCode || "").toLowerCase();
  return name.includes(term) || code.includes(term);
};

const getEmployeeDisplayLabel = (employee) => {
  const name =
    employee.fullName ||
    employee.FullName ||
    `${employee.firstName || employee.FirstName || ""} ${employee.lastName || employee.LastName || ""}`.trim();
  const code = employee.employeeCode || employee.EmployeeCode;
  if (name && code) {
    return `${name} (${code})`;
  }
  return name || code || "Unknown";
};

const buildEmployeePayload = (form) => ({
  OrgId: parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10),
  FirstName: form.firstName,
  LastName: form.lastName,
  NIC: form.nic,
  MobileNumber: form.mobileNumber,
  Department: form.department || null,
  EmploymentType: form.employmentType,
  JoinDate: form.joinDate,
  BasicSalary: parseFloat(form.basicSalary) || 0,
  AttendanceAllowance: parseFloat(form.attendanceAllowance) || 0,
  TransportAllowance: parseFloat(form.transportAllowance) || 0,
  ProfessionalAllowance: parseFloat(form.professionalAllowance) || 0,
  MobileAllowance: parseFloat(form.mobileAllowance) || 0,
  PayrollCycle: form.payrollCycle || "Monthly",
  BankName: form.bankName || null,
  BranchName: form.branchName || null,
  AccountNumber: form.accountNumber || null,
  PaymentMode: form.paymentMode || "Bank Transfer",
  EPFEmployeePercent: parseFloat(form.epfEmployeePercent) || 8,
  EPFEmployerPercent: parseFloat(form.epfEmployerPercent) || 12,
  ETFPercent: parseFloat(form.etfPercent) || 3,
});

export default function SalaryManager() {
  const perms = IsPermissionEnabled(categoryId);

  const [activeTab, setActiveTab] = useState(0);

  const [employees, setEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeTotalCount, setEmployeeTotalCount] = useState(0);
  const [employeePage, setEmployeePage] = useState(1);
  const [employeePageSize, setEmployeePageSize] = useState(10);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState(getEmptyEmployeeForm());
  const [employeeFormLoading, setEmployeeFormLoading] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [uploadResults, setUploadResults] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [confirmDeleteEmployeeOpen, setConfirmDeleteEmployeeOpen] = useState(false);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState(null);

  const [advances, setAdvances] = useState([]);
  const [loadingAdvances, setLoadingAdvances] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [employeeDropdown, setEmployeeDropdown] = useState([]);
  const [filterEmployeeSearch, setFilterEmployeeSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [addAdvanceOpen, setAddAdvanceOpen] = useState(false);
  const [editAdvanceOpen, setEditAdvanceOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [advanceForm, setAdvanceForm] = useState(getEmptyAdvanceForm());
  const [confirmDeleteAdvanceOpen, setConfirmDeleteAdvanceOpen] = useState(false);
  const [deletingAdvanceId, setDeletingAdvanceId] = useState(null);
  const [addLeaveOpen, setAddLeaveOpen] = useState(false);
  const [editLeaveOpen, setEditLeaveOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveForm, setLeaveForm] = useState(getEmptyLeaveForm());
  const [advanceEmployeeSearch, setAdvanceEmployeeSearch] = useState("");
  const [leaveEmployeeSearch, setLeaveEmployeeSearch] = useState("");
  const [confirmDeleteLeaveOpen, setConfirmDeleteLeaveOpen] = useState(false);
  const [deletingLeaveId, setDeletingLeaveId] = useState(null);

  const currentYear = new Date().getFullYear();
  const [salaryMonth, setSalaryMonth] = useState(new Date().getMonth() + 1);
  const [salaryYear, setSalaryYear] = useState(currentYear);
  const [salarySearch, setSalarySearch] = useState("");
  const [salaryPage, setSalaryPage] = useState(1);
  const [salaryPageSize, setSalaryPageSize] = useState(10);
  const [salaryData, setSalaryData] = useState([]);
  const [loadingSalary, setLoadingSalary] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("moduleid", moduleId);
    sessionStorage.setItem("category", categoryId);

    if (!sessionStorage.getItem("orgId")) {
      const orgIdFromLocal = localStorage.getItem("orgId");
      if (orgIdFromLocal) {
        sessionStorage.setItem("orgId", orgIdFromLocal);
      }
    }
  }, []);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const orgId = parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10);
      const headers = createAuthHeaders();
      const response = await fetch(
        `${BASE_URL}/hr/salary-manager/employees?orgId=${parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10)}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Unable to load employees"));
      }

      const payload = normalizeListResponse(await response.json());
      setEmployees((payload.items || []).reverse());
      setEmployeeTotalCount(payload.totalCount ?? payload.items.length);
    } catch (error) {
      toast.error(error.message || "Failed to load employees");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadEmployeeDropdown = async () => {
    try {
      const orgId = parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10);
      const headers = createAuthHeaders();
      const response = await fetch(
        `${BASE_URL}/hr/salary-manager/employees?orgId=${parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10)}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Unable to load employees"));
      }

      const payload = normalizeListResponse(await response.json());
      setEmployeeDropdown(payload.items);
    } catch (error) {
      toast.error(error.message || "Failed to load employee list");
    }
  };

  const loadAdvances = async () => {
    try {
      setLoadingAdvances(true);
      const orgId = parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10);
      const headers = createAuthHeaders();
      let query = `${BASE_URL}/hr/salary-manager/advances?orgId=${parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10)}`;
      if (filterMonth) {
        query += `&month=${filterMonth}`;
      }
      if (filterYear) {
        query += `&year=${filterYear}`;
      }

      const response = await fetch(query, { headers });
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Unable to load advances"));
      }

      const payload = normalizeListResponse(await response.json());
      setAdvances(payload.items);
    } catch (error) {
      toast.error(error.message || "Failed to load advances");
    } finally {
      setLoadingAdvances(false);
    }
  };

  const loadLeaves = async () => {
    try {
      setLoadingLeaves(true);
      const orgId = parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10);
      const headers = createAuthHeaders();
      let query = `${BASE_URL}/hr/salary-manager/leaves?orgId=${parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10)}`;
      if (filterMonth) {
        query += `&month=${filterMonth}`;
      }
      if (filterYear) {
        query += `&year=${filterYear}`;
      }

      const response = await fetch(query, { headers });
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Unable to load leaves"));
      }

      const payload = normalizeListResponse(await response.json());
      setLeaves(payload.items);
    } catch (error) {
      toast.error(error.message || "Failed to load leaves");
    } finally {
      setLoadingLeaves(false);
    }
  };

  const reloadAdvancesAndLeaves = async () => {
    await Promise.all([loadAdvances(), loadLeaves()]);
  };

  useEffect(() => {
    if (!perms.navigate) {
      return;
    }
    loadEmployees();
    loadEmployeeDropdown();
  }, [perms.navigate]);

  useEffect(() => {
    if (!perms.navigate || activeTab !== 1) {
      return;
    }
    reloadAdvancesAndLeaves();
  }, [perms.navigate, activeTab, filterMonth, filterYear]);

  useEffect(() => {
    setSalaryPage(1);
  }, [salarySearch]);

  const handleEmployeeFormChange = (event) => {
    const { name, value } = event.target;
    setEmployeeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdvanceFormChange = (event) => {
    const { name, value } = event.target;
    setAdvanceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLeaveFormChange = (event) => {
    const { name, value } = event.target;
    setLeaveForm((prev) => ({ ...prev, [name]: value }));
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate >= startDate) {
      const diffTime = endDate - startDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setLeaveForm((prev) => ({ ...prev, duration: diffDays }));
    }
  };

  const handleLeaveStartDateChange = (event) => {
    const { value } = event.target;
    setLeaveForm((prev) => ({ ...prev, startDate: value }));
    calculateDuration(value, leaveForm.endDate);
  };

  const handleLeaveEndDateChange = (event) => {
    const { value } = event.target;
    setLeaveForm((prev) => ({ ...prev, endDate: value }));
    calculateDuration(leaveForm.startDate, value);
  };

  const openAddEmployee = () => {
    setEmployeeForm(getEmptyEmployeeForm());
    setAddEmployeeOpen(true);
  };

  const openEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm({
      firstName: employee.firstName || employee.FirstName || "",
      lastName: employee.lastName || employee.LastName || "",
      nic: employee.nic || employee.NIC || "",
      mobileNumber: employee.mobileNumber || employee.MobileNumber || "",
      department: employee.department || employee.Department || "",
      employmentType: employee.employmentType || employee.EmploymentType || "Permanent",
      joinDate: formatDate(employee.joinDate || employee.JoinDate),
      basicSalary: employee.basicSalary ?? employee.BasicSalary ?? "",
      attendanceAllowance: employee.attendanceAllowance ?? employee.AttendanceAllowance ?? 0,
      transportAllowance: employee.transportAllowance ?? employee.TransportAllowance ?? 0,
      professionalAllowance: employee.professionalAllowance ?? employee.ProfessionalAllowance ?? 0,
      mobileAllowance: employee.mobileAllowance ?? employee.MobileAllowance ?? 0,
      payrollCycle: employee.payrollCycle || employee.PayrollCycle || "Monthly",
      bankName: employee.bankName || employee.BankName || "",
      branchName: employee.branchName || employee.BranchName || "",
      accountNumber: employee.accountNumber || employee.AccountNumber || "",
      paymentMode: employee.paymentMode || employee.PaymentMode || "Bank Transfer",
      epfEmployeePercent: employee.epfEmployeePercent ?? employee.EPFEmployeePercent ?? 8,
      epfEmployerPercent: employee.epfEmployerPercent ?? employee.EPFEmployerPercent ?? 12,
      etfPercent: employee.etfPercent ?? employee.ETFPercent ?? 3,
    });
    setEditEmployeeOpen(true);
  };

  const submitAddEmployee = async (event) => {
    event.preventDefault();
    setEmployeeFormLoading(true);
    try {
      const headers = createAuthHeaders();
      const response = await fetch(`${BASE_URL}/hr/salary-manager/employees`, {
        method: "POST",
        headers,
        body: JSON.stringify(buildEmployeePayload(employeeForm)),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to create employee"));
      }

      toast.success("Employee created successfully");
      setAddEmployeeOpen(false);
      await loadEmployees();
      await loadEmployeeDropdown();
    } catch (error) {
      toast.error(error.message || "Failed to create employee");
    } finally {
      setEmployeeFormLoading(false);
    }
  };

  const submitEditEmployee = async (event) => {
    event.preventDefault();
    if (!selectedEmployee) {
      return;
    }

    setEmployeeFormLoading(true);
    try {
      const headers = createAuthHeaders();
      const employeeId = selectedEmployee.id || selectedEmployee.Id;
      const response = await fetch(`${BASE_URL}/hr/salary-manager/employees/${employeeId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          Id: employeeId,
          ...buildEmployeePayload(employeeForm),
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to update employee"));
      }

      toast.success("Employee updated successfully");
      setEditEmployeeOpen(false);
      setSelectedEmployee(null);
      await loadEmployees();
      await loadEmployeeDropdown();
    } catch (error) {
      toast.error(error.message || "Failed to update employee");
    } finally {
      setEmployeeFormLoading(false);
    }
  };

  const confirmDeleteEmployee = async () => {
    if (!deletingEmployeeId) {
      return;
    }

    try {
      const headers = createAuthHeaders();
      const response = await fetch(
        `${BASE_URL}/hr/salary-manager/employees/${deletingEmployeeId}`,
        { method: "DELETE", headers }
      );

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to delete employee"));
      }

      toast.success("Employee deleted successfully");
      setConfirmDeleteEmployeeOpen(false);
      setDeletingEmployeeId(null);
      await loadEmployees();
      await loadEmployeeDropdown();
    } catch (error) {
      toast.error(error.message || "Failed to delete employee");
    }
  };

  const downloadEmployeeTemplate = () => {
    const csvContent = [
      CSV_TEMPLATE_HEADERS.join(","),
      CSV_TEMPLATE_EXAMPLE.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "salary_employee_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBulkFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rows = parseCsvText(e.target.result || "");
      setParsedRows(
        rows.map((row, index) => ({
          ...row,
          rowNumber: index + 1,
          uploadStatus: "Ready",
          uploadError: "",
        }))
      );
      setUploadResults(null);
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleBulkUpload = async () => {
    if (parsedRows.length === 0) {
      toast.error("Please select a CSV file first");
      return;
    }

    setUploadLoading(true);
    try {
      const headers = createAuthHeaders();
      const response = await fetch(`${BASE_URL}/hr/salary-manager/employees/bulk`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          OrgId: parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10),
          Employees: parsedRows.map((row) => ({
            FirstName: row.FirstName,
            LastName: row.LastName,
            NIC: row.NIC,
            MobileNumber: row.MobileNumber,
            Department: row.Department || "",
            EmploymentType: row.EmploymentType,
            JoinDate: row.JoinDate,
            BasicSalary: parseFloat(row.BasicSalary) || 0,
            AttendanceAllowance: parseFloat(row.AttendanceAllowance) || 0,
            TransportAllowance: parseFloat(row.TransportAllowance) || 0,
            ProfessionalAllowance: parseFloat(row.ProfessionalAllowance) || 0,
            MobileAllowance: parseFloat(row.MobileAllowance) || 0,
            PayrollCycle: row.PayrollCycle || "Monthly",
            BankName: row.BankName || "",
            BranchName: row.BranchName || "",
            AccountNumber: row.AccountNumber || "",
            PaymentMode: row.PaymentMode || "Bank Transfer",
            EPFEmployeePercent: parseFloat(row.EPFEmployeePercent) || 8,
            EPFEmployerPercent: parseFloat(row.EPFEmployerPercent) || 12,
            ETFPercent: parseFloat(row.ETFPercent) || 3,
            OrgId: parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Bulk upload failed"));
      }

      const result = parseObjectResponse(await response.json());
      setUploadResults(result);

      const resultMap = new Map(
        (result.results || result.Results || []).map((item) => [item.rowNumber || item.RowNumber, item])
      );

      setParsedRows((prev) =>
        prev.map((row) => {
          const rowResult = resultMap.get(row.rowNumber);
          if (!rowResult) {
            return row;
          }
          const success = rowResult.success ?? rowResult.Success;
          return {
            ...row,
            uploadStatus: success ? "Created" : rowResult.errorMessage || rowResult.ErrorMessage || "Failed",
            uploadError: success ? "" : rowResult.errorMessage || rowResult.ErrorMessage || "Failed",
            employeeCode: rowResult.employeeCode || rowResult.EmployeeCode || row.employeeCode,
          };
        })
      );

      const successCount = result.successCount ?? result.SuccessCount ?? 0;
      const failedCount = result.failedCount ?? result.FailedCount ?? 0;
      const totalRows = result.totalRows ?? result.TotalRows ?? parsedRows.length;

      if (failedCount === 0) {
        toast.success(`${successCount} of ${totalRows} employees created successfully`);
      } else if (successCount === 0) {
        toast.error(`All ${totalRows} rows failed to upload`);
      } else {
        toast.warning(`${successCount} of ${totalRows} created. ${failedCount} failed.`);
      }

      if (successCount > 0) {
        await loadEmployees();
        await loadEmployeeDropdown();
      }
    } catch (error) {
      toast.error(error.message || "Bulk upload failed");
    } finally {
      setUploadLoading(false);
    }
  };

  const submitAddAdvance = async (event) => {
    event.preventDefault();
    if (!advanceForm.salaryEmployeeId) {
      toast.error("Please select an employee from search results");
      return;
    }

    setEmployeeFormLoading(true);
    try {
      const headers = createAuthHeaders();
      const response = await fetch(`${BASE_URL}/hr/salary-manager/advances`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          OrgId: parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10),
          SalaryEmployeeId: parseInt(advanceForm.salaryEmployeeId, 10),
          Amount: parseFloat(advanceForm.amount) || 0,
          AdvanceDate: advanceForm.advanceDate,
          Reason: advanceForm.reason || null,
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to create advance"));
      }

      toast.success("Advance created successfully");
      setAddAdvanceOpen(false);
      setAdvanceForm(getEmptyAdvanceForm());
      setAdvanceEmployeeSearch("");
      await reloadAdvancesAndLeaves();
    } catch (error) {
      toast.error(error.message || "Failed to create advance");
    } finally {
      setEmployeeFormLoading(false);
    }
  };

  const submitEditAdvance = async (event) => {
    event.preventDefault();
    if (!selectedAdvance) {
      return;
    }

    setEmployeeFormLoading(true);
    try {
      const headers = createAuthHeaders();
      const advanceId = selectedAdvance.id || selectedAdvance.Id;
      const response = await fetch(`${BASE_URL}/hr/salary-manager/advances/${advanceId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          Id: advanceId,
          Amount: parseFloat(advanceForm.amount) || 0,
          AdvanceDate: advanceForm.advanceDate,
          Reason: advanceForm.reason || null,
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to update advance"));
      }

      toast.success("Advance updated successfully");
      setEditAdvanceOpen(false);
      setSelectedAdvance(null);
      await reloadAdvancesAndLeaves();
    } catch (error) {
      toast.error(error.message || "Failed to update advance");
    } finally {
      setEmployeeFormLoading(false);
    }
  };

  const approveAdvance = async (advance) => {
    try {
      const headers = createAuthHeaders();
      const advanceId = advance.id || advance.Id;
      const response = await fetch(`${BASE_URL}/hr/salary-manager/advances/${advanceId}/approve`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          ApprovedBy: localStorage.getItem("name") || "HR",
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to approve advance"));
      }

      toast.success("Advance approved successfully");
      await reloadAdvancesAndLeaves();
    } catch (error) {
      toast.error(error.message || "Failed to approve advance");
    }
  };

  const confirmDeleteAdvance = async () => {
    if (!deletingAdvanceId) {
      return;
    }

    try {
      const headers = createAuthHeaders();
      const response = await fetch(
        `${BASE_URL}/hr/salary-manager/advances/${deletingAdvanceId}`,
        { method: "DELETE", headers }
      );

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to delete advance"));
      }

      toast.success("Advance deleted successfully");
      setConfirmDeleteAdvanceOpen(false);
      setDeletingAdvanceId(null);
      await reloadAdvancesAndLeaves();
    } catch (error) {
      toast.error(error.message || "Failed to delete advance");
    }
  };

  const submitAddLeave = async (event) => {
    event.preventDefault();
    if (!leaveForm.salaryEmployeeId) {
      toast.error("Please select an employee from search results");
      return;
    }

    setEmployeeFormLoading(true);
    try {
      const headers = createAuthHeaders();
      const response = await fetch(`${BASE_URL}/hr/salary-manager/leaves`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          OrgId: parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10),
          SalaryEmployeeId: parseInt(leaveForm.salaryEmployeeId, 10),
          LeaveType: leaveForm.leaveType,
          StartDate: leaveForm.startDate,
          EndDate: leaveForm.endDate,
          Duration: parseFloat(leaveForm.duration) || 0,
          Reason: leaveForm.reason || null,
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to create leave"));
      }

      toast.success("Leave request created successfully");
      setAddLeaveOpen(false);
      setLeaveForm(getEmptyLeaveForm());
      setLeaveEmployeeSearch("");
      await reloadAdvancesAndLeaves();
    } catch (error) {
      toast.error(error.message || "Failed to create leave");
    } finally {
      setEmployeeFormLoading(false);
    }
  };

  const submitEditLeave = async (event) => {
    event.preventDefault();
    if (!selectedLeave) {
      return;
    }

    setEmployeeFormLoading(true);
    try {
      const headers = createAuthHeaders();
      const leaveId = selectedLeave.id || selectedLeave.Id;
      const response = await fetch(`${BASE_URL}/hr/salary-manager/leaves/${leaveId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          Id: leaveId,
          LeaveType: leaveForm.leaveType,
          StartDate: leaveForm.startDate,
          EndDate: leaveForm.endDate,
          Duration: parseFloat(leaveForm.duration) || 0,
          Reason: leaveForm.reason || null,
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to update leave"));
      }

      toast.success("Leave request updated successfully");
      setEditLeaveOpen(false);
      setSelectedLeave(null);
      await reloadAdvancesAndLeaves();
    } catch (error) {
      toast.error(error.message || "Failed to update leave");
    } finally {
      setEmployeeFormLoading(false);
    }
  };

  const approveLeave = async (leave) => {
    try {
      const headers = createAuthHeaders();
      const leaveId = leave.id || leave.Id;
      const response = await fetch(`${BASE_URL}/hr/salary-manager/leaves/${leaveId}/approve`, {
        method: "PATCH",
        headers,
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to approve leave"));
      }

      toast.success("Leave approved successfully");
      await reloadAdvancesAndLeaves();
    } catch (error) {
      toast.error(error.message || "Failed to approve leave");
    }
  };

  const confirmDeleteLeave = async () => {
    if (!deletingLeaveId) {
      return;
    }

    try {
      const headers = createAuthHeaders();
      const response = await fetch(
        `${BASE_URL}/hr/salary-manager/leaves/${deletingLeaveId}`,
        { method: "DELETE", headers }
      );

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to delete leave"));
      }

      toast.success("Leave deleted successfully");
      setConfirmDeleteLeaveOpen(false);
      setDeletingLeaveId(null);
      await reloadAdvancesAndLeaves();
    } catch (error) {
      toast.error(error.message || "Failed to delete leave");
    }
  };

  const calculateMonthlySalary = async () => {
    setLoadingSalary(true);
    try {
      const orgId = parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10);
      const headers = createAuthHeaders();

      const [employeesResponse, advancesResponse, leavesResponse] = await Promise.all([
        fetch(`${BASE_URL}/hr/salary-manager/employees?orgId=${parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10)}`, { headers }),
        fetch(
          `${BASE_URL}/hr/salary-manager/advances?orgId=${parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10)}&month=${salaryMonth}&year=${salaryYear}&status=1`,
          { headers }
        ),
        fetch(
          `${BASE_URL}/hr/salary-manager/leaves?orgId=${parseInt(localStorage.getItem("company") || sessionStorage.getItem("orgId") || "0", 10)}&month=${salaryMonth}&year=${salaryYear}&status=1`,
          { headers }
        ),
      ]);

      if (!employeesResponse.ok) {
        throw new Error(await getApiErrorMessage(employeesResponse, "Unable to load employees"));
      }
      if (!advancesResponse.ok) {
        throw new Error(await getApiErrorMessage(advancesResponse, "Unable to load advances"));
      }
      if (!leavesResponse.ok) {
        throw new Error(await getApiErrorMessage(leavesResponse, "Unable to load leaves"));
      }

      const employeeItems = normalizeListResponse(await employeesResponse.json()).items;
      const advanceItems = normalizeListResponse(await advancesResponse.json()).items;
      const leaveItems = normalizeListResponse(await leavesResponse.json()).items;

      const calculated = employeeItems.map((employee) => {
        const employeeId = employee.id || employee.Id;
        const basicSalary = Number(employee.basicSalary ?? employee.BasicSalary ?? 0);
        const grossSalary =
          basicSalary +
          Number(employee.attendanceAllowance ?? employee.AttendanceAllowance ?? 0) +
          Number(employee.transportAllowance ?? employee.TransportAllowance ?? 0) +
          Number(employee.professionalAllowance ?? employee.ProfessionalAllowance ?? 0) +
          Number(employee.mobileAllowance ?? employee.MobileAllowance ?? 0);
        const dailyRate = basicSalary / 30;

        const lwpDays = leaveItems
          .filter((leave) => {
            const leaveEmployeeId = leave.salaryEmployeeId || leave.SalaryEmployeeId;
            const leaveType = leave.leaveType || leave.LeaveType;
            return leaveEmployeeId === employeeId && leaveType === "Unpaid";
          })
          .reduce((sum, leave) => sum + Number(leave.duration ?? leave.Duration ?? 0), 0);

        const advanceDeduction = advanceItems
          .filter((advance) => (advance.salaryEmployeeId || advance.SalaryEmployeeId) === employeeId)
          .reduce((sum, advance) => sum + Number(advance.amount ?? advance.Amount ?? 0), 0);

        const lwpDeduction = dailyRate * lwpDays;
        const netPay = grossSalary - lwpDeduction - advanceDeduction;

        return {
          id: employeeId,
          employeeId,
          employeeCode: employee.employeeCode || employee.EmployeeCode || "-",
          empCode: employee.employeeCode || employee.EmployeeCode || "-",
          fullName:
            employee.fullName ||
            employee.FullName ||
            `${employee.firstName || employee.FirstName || ""} ${employee.lastName || employee.LastName || ""}`.trim(),
          name:
            employee.fullName ||
            employee.FullName ||
            `${employee.firstName || employee.FirstName || ""} ${employee.lastName || employee.LastName || ""}`.trim(),
          grossSalary,
          lwpDays,
          lwpDeduction,
          advanceDeduction,
          netPay,
        };
      });

      setSalaryData(calculated);
      setSalaryPage(1);
      toast.success("Monthly salary calculated");
    } catch (error) {
      toast.error(error.message || "Failed to calculate monthly salary");
    } finally {
      setLoadingSalary(false);
    }
  };

  const exportSalaryCsv = () => {
    if (salaryData.length === 0) {
      toast.error("Calculate salary before exporting");
      return;
    }

    const totals = salaryData.reduce(
      (acc, row) => ({
        grossSalary: acc.grossSalary + row.grossSalary,
        lwpDays: acc.lwpDays + row.lwpDays,
        lwpDeduction: acc.lwpDeduction + row.lwpDeduction,
        advanceDeduction: acc.advanceDeduction + row.advanceDeduction,
        netPay: acc.netPay + row.netPay,
      }),
      { grossSalary: 0, lwpDays: 0, lwpDeduction: 0, advanceDeduction: 0, netPay: 0 }
    );

    const rows = [
      ["EMP CODE", "NAME", "GROSS SALARY", "LWP DAYS", "LWP DEDUCTION", "ADVANCE DEDUCTION", "NET PAY"],
      ...salaryData.map((row) => [
        row.employeeCode,
        row.fullName,
        row.grossSalary.toFixed(2),
        row.lwpDays.toFixed(2),
        row.lwpDeduction.toFixed(2),
        row.advanceDeduction.toFixed(2),
        row.netPay.toFixed(2),
      ]),
      [
        "TOTAL",
        "",
        totals.grossSalary.toFixed(2),
        totals.lwpDays.toFixed(2),
        totals.lwpDeduction.toFixed(2),
        totals.advanceDeduction.toFixed(2),
        totals.netPay.toFixed(2),
      ],
    ];

    const csvContent = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `salary_${salaryMonth}_${salaryYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const PAYSLIP_MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const getPayslipStyles = () => `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #333; padding: 40px; }
        .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { font-size: 22px; color: #4f46e5; letter-spacing: 2px; }
        .header h2 { font-size: 14px; color: #666; margin-top: 4px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 12px; font-weight: bold; color: #4f46e5; 
                         text-transform: uppercase; letter-spacing: 1px;
                         border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; 
                         margin-bottom: 12px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .info-item { display: flex; flex-direction: column; }
        .info-label { font-size: 11px; color: #888; }
        .info-value { font-size: 13px; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f3f4f6; text-align: left; padding: 8px 12px; 
             font-size: 12px; color: #555; }
        td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
        td.amount { text-align: right; }
        th.amount { text-align: right; }
        .total-row td { font-weight: bold; border-top: 2px solid #e5e7eb; }
        .net-pay-box { background: #4f46e5; color: white; padding: 20px; 
                       border-radius: 8px; text-align: center; margin-top: 24px; }
        .net-pay-box .label { font-size: 13px; opacity: 0.85; }
        .net-pay-box .amount { font-size: 28px; font-weight: bold; margin-top: 4px; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #aaa; }
        @media print {
          body { padding: 20px; }
          button { display: none; }
        }
  `;

  const getPayslipBodyHtml = (employeeSalary, monthLabel) => {
    const empDetails = employees.find(
      (e) => (e.id || e.Id) === (employeeSalary.employeeId || employeeSalary.id)
    );

    return `
      <div class="header">
        <h1>PAYSLIP</h1>
        <h2>Pay Period: ${monthLabel} ${salaryYear}</h2>
      </div>

      <div class="section">
        <div class="section-title">Employee Details</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Employee Code</span>
            <span class="info-value">${employeeSalary.empCode}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Employee Name</span>
            <span class="info-value">${employeeSalary.name}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Department</span>
            <span class="info-value">${empDetails?.department || empDetails?.Department || "-"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Employment Type</span>
            <span class="info-value">${empDetails?.employmentType || empDetails?.EmploymentType || "-"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Bank</span>
            <span class="info-value">${empDetails?.bankName || empDetails?.BankName || "-"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Account No</span>
            <span class="info-value">${empDetails?.accountNumber || empDetails?.AccountNumber || "-"}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Earnings</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="amount">Amount (LKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary</td>
              <td class="amount">${Number(empDetails?.basicSalary ?? empDetails?.BasicSalary ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Attendance Allowance</td>
              <td class="amount">${Number(empDetails?.attendanceAllowance ?? empDetails?.AttendanceAllowance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Transport Allowance</td>
              <td class="amount">${Number(empDetails?.transportAllowance ?? empDetails?.TransportAllowance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Professional Allowance</td>
              <td class="amount">${Number(empDetails?.professionalAllowance ?? empDetails?.ProfessionalAllowance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Mobile Allowance</td>
              <td class="amount">${Number(empDetails?.mobileAllowance ?? empDetails?.MobileAllowance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total-row">
              <td>Gross Salary</td>
              <td class="amount">${Number(employeeSalary.grossSalary || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Deductions</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="amount">Amount (LKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Leave Without Pay (${employeeSalary.lwpDays} days)</td>
              <td class="amount">${Number(employeeSalary.lwpDeduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Cash Advances</td>
              <td class="amount">${Number(employeeSalary.advanceDeduction || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total-row">
              <td>Total Deductions</td>
              <td class="amount">${Number((employeeSalary.lwpDeduction || 0) + (employeeSalary.advanceDeduction || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="net-pay-box">
        <div class="label">NET PAY</div>
        <div class="amount">LKR ${Number(employeeSalary.netPay || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
      </div>

      <div class="footer">
        Generated on ${new Date().toLocaleDateString()} — This is a system generated payslip.
      </div>
    `;
  };

  const generatePayslipPDF = (employeeSalary) => {
    const monthLabel = PAYSLIP_MONTH_NAMES[salaryMonth - 1];
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payslip - ${employeeSalary.name} - ${monthLabel} ${salaryYear}</title>
      <style>${getPayslipStyles()}</style>
    </head>
    <body>
      ${getPayslipBodyHtml(employeeSalary, monthLabel)}
    </body>
    </html>
  `;

    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) {
      toast.error("Unable to open print window. Please allow pop-ups.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const printAllPayslips = () => {
    if (salaryData.length === 0) {
      toast.error("Calculate salary before printing payslips");
      return;
    }

    const monthLabel = PAYSLIP_MONTH_NAMES[salaryMonth - 1];
    const combinedBody = salaryData
      .map(
        (employeeSalary, index) =>
          `<div style="${index < salaryData.length - 1 ? "page-break-after: always;" : ""}">${getPayslipBodyHtml(employeeSalary, monthLabel)}</div>`
      )
      .join("");

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payslips - ${monthLabel} ${salaryYear}</title>
      <style>${getPayslipStyles()}</style>
    </head>
    <body>
      ${combinedBody}
    </body>
    </html>
  `;

    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) {
      toast.error("Unable to open print window. Please allow pop-ups.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const yearOptions = [currentYear - 1, currentYear, currentYear + 1].map((year) => ({
    value: year,
    label: String(year),
  }));

  const renderEmployeeFormFields = () => (
    <Grid container spacing={2}>
      <FormField name="firstName" label="First Name" value={employeeForm.firstName} onChange={handleEmployeeFormChange} required />
      <FormField name="lastName" label="Last Name" value={employeeForm.lastName} onChange={handleEmployeeFormChange} required />
      <FormField name="nic" label="NIC" value={employeeForm.nic} onChange={handleEmployeeFormChange} required />
      <FormField name="mobileNumber" label="Mobile Number" value={employeeForm.mobileNumber} onChange={handleEmployeeFormChange} required />
      <FormField name="department" label="Department" value={employeeForm.department} onChange={handleEmployeeFormChange} />
      <FormField
        name="employmentType"
        label="Employment Type"
        type="select"
        value={employeeForm.employmentType}
        onChange={handleEmployeeFormChange}
        options={EMPLOYMENT_TYPES.map((value) => ({ value, label: value }))}
        required
      />
      <FormField name="joinDate" label="Join Date" type="date" value={employeeForm.joinDate} onChange={handleEmployeeFormChange} required />
      <FormField name="basicSalary" label="Basic Salary" type="number" value={employeeForm.basicSalary} onChange={handleEmployeeFormChange} required />
      <FormField name="attendanceAllowance" label="Attendance Allowance" type="number" value={employeeForm.attendanceAllowance} onChange={handleEmployeeFormChange} />
      <FormField name="transportAllowance" label="Transport Allowance" type="number" value={employeeForm.transportAllowance} onChange={handleEmployeeFormChange} />
      <FormField name="professionalAllowance" label="Professional Allowance" type="number" value={employeeForm.professionalAllowance} onChange={handleEmployeeFormChange} />
      <FormField name="mobileAllowance" label="Mobile Allowance" type="number" value={employeeForm.mobileAllowance} onChange={handleEmployeeFormChange} />
      <FormField name="payrollCycle" label="Payroll Cycle" value={employeeForm.payrollCycle} onChange={handleEmployeeFormChange} />
      <FormField name="bankName" label="Bank Name" value={employeeForm.bankName} onChange={handleEmployeeFormChange} />
      <FormField name="branchName" label="Branch Name" value={employeeForm.branchName} onChange={handleEmployeeFormChange} />
      <FormField name="accountNumber" label="Account Number" value={employeeForm.accountNumber} onChange={handleEmployeeFormChange} />
      <FormField
        name="paymentMode"
        label="Payment Mode"
        type="select"
        value={employeeForm.paymentMode}
        onChange={handleEmployeeFormChange}
        options={PAYMENT_MODES.map((value) => ({ value, label: value }))}
      />
      <FormField name="epfEmployeePercent" label="EPF Employee %" type="number" value={employeeForm.epfEmployeePercent} onChange={handleEmployeeFormChange} />
      <FormField name="epfEmployerPercent" label="EPF Employer %" type="number" value={employeeForm.epfEmployerPercent} onChange={handleEmployeeFormChange} />
      <FormField name="etfPercent" label="ETF %" type="number" value={employeeForm.etfPercent} onChange={handleEmployeeFormChange} />
    </Grid>
  );

  const filteredAdvances = advances.filter((advance) => matchesEmployeeSearch(advance, filterEmployeeSearch));
  const filteredLeaves = leaves.filter((leave) => matchesEmployeeSearch(leave, filterEmployeeSearch));

  const searchEmployees = (search) => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return [];
    }

    return employeeDropdown
      .filter((employee) => {
        const name =
          employee.fullName ||
          employee.FullName ||
          `${employee.firstName || employee.FirstName || ""} ${employee.lastName || employee.LastName || ""}`.trim();
        const code = String(employee.employeeCode || employee.EmployeeCode || "");
        return name.toLowerCase().includes(term) || code.toLowerCase().includes(term);
      })
      .slice(0, 8);
  };

  const renderEmployeeSearchField = (searchValue, setSearchValue, selectedEmployeeId, onSelectEmployeeId) => {
    const matchingEmployees =
      searchValue.trim() && !selectedEmployeeId ? searchEmployees(searchValue) : [];

    return (
    <Grid item xs={12} sm={6} md={6}>
      <Box sx={{ pt: 1.5, mb: -1.5 }}>
        <TextField
          label="Employee"
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.target.value);
            onSelectEmployeeId("");
          }}
          required
          fullWidth
          placeholder="Search by name or code"
        />
        {matchingEmployees.length > 0 && (
          <Paper elevation={1} sx={{ mt: 1, maxHeight: 220, overflow: "auto" }}>
            {matchingEmployees.map((employee) => {
              const employeeId = String(employee.id || employee.Id);
              return (
                <Box
                  key={employeeId}
                  onClick={() => {
                    onSelectEmployeeId(employeeId);
                    setSearchValue(getEmployeeDisplayLabel(employee));
                  }}
                  sx={{
                    px: 1.5,
                    py: 1,
                    cursor: "pointer",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:hover": { bgcolor: "action.hover" },
                    "&:last-child": { borderBottom: "none" },
                  }}
                >
                  <Typography variant="body2">{getEmployeeDisplayLabel(employee)}</Typography>
                </Box>
              );
            })}
          </Paper>
        )}
        {searchValue.trim() && !selectedEmployeeId && matchingEmployees.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, px: 0.5 }}>
            No employees found
          </Typography>
        )}
        {selectedEmployeeId && (
          <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: "block" }}>
            Employee selected
          </Typography>
        )}
      </Box>
    </Grid>
    );
  };

  const handleEmployeePageChange = (event, value) => {
    setEmployeePage(value);
  };

  const handleEmployeePageSizeChange = (event) => {
    setEmployeePageSize(Number(event.target.value));
    setEmployeePage(1);
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.department?.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const mappedEmployees = filteredEmployees.map((employee) => ({
    ...employee,
    id: employee.id || employee.Id,
    employeeCode: employee.employeeCode || employee.EmployeeCode,
    fullName:
      employee.fullName ||
      employee.FullName ||
      `${employee.firstName || employee.FirstName || ""} ${employee.lastName || employee.LastName || ""}`.trim(),
    department: employee.department || employee.Department,
    employmentType: employee.employmentType || employee.EmploymentType,
    basicSalary: employee.basicSalary ?? employee.BasicSalary,
    grossSalary: employee.grossSalary ?? employee.GrossSalary,
    isActive: employee.isActive ?? employee.IsActive,
  }));

  const paginatedEmployees = mappedEmployees.slice(
    (employeePage - 1) * employeePageSize,
    employeePage * employeePageSize
  );

  const filteredEmployeeCount = mappedEmployees.length;
  const employeePageStart = filteredEmployeeCount > 0 ? (employeePage - 1) * employeePageSize + 1 : 0;
  const employeePageEnd = Math.min(employeePage * employeePageSize, filteredEmployeeCount);

  const filteredSalaryData = salaryData.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(salarySearch.toLowerCase()) ||
      emp.empCode?.toLowerCase().includes(salarySearch.toLowerCase())
  );

  const paginatedSalaryData = filteredSalaryData.slice(
    (salaryPage - 1) * salaryPageSize,
    salaryPage * salaryPageSize
  );

  const salaryTotals = filteredSalaryData.reduce(
    (acc, row) => ({
      grossSalary: acc.grossSalary + row.grossSalary,
      lwpDays: acc.lwpDays + row.lwpDays,
      lwpDeduction: acc.lwpDeduction + row.lwpDeduction,
      advanceDeduction: acc.advanceDeduction + row.advanceDeduction,
      netPay: acc.netPay + row.netPay,
    }),
    { grossSalary: 0, lwpDays: 0, lwpDeduction: 0, advanceDeduction: 0, netPay: 0 }
  );

  const handleSalaryPageChange = (event, value) => {
    setSalaryPage(value);
  };

  const handleSalaryPageSizeChange = (event) => {
    setSalaryPageSize(Number(event.target.value));
    setSalaryPage(1);
  };

  const filteredSalaryCount = filteredSalaryData.length;
  const salaryPageStart = filteredSalaryCount > 0 ? (salaryPage - 1) * salaryPageSize + 1 : 0;
  const salaryPageEnd = Math.min(salaryPage * salaryPageSize, filteredSalaryCount);

  if (!perms.navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Salary Manager</h1>
        <ul>
          <li>
            <Link href="/hr/salary-manager/">Salary Manager</Link>
          </li>
        </ul>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label="Employees" />
          <Tab label="Advances & Leaves" />
          <Tab label="Monthly Salary" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Employees
            </Typography>
            <Box display="flex" gap={1}>
              <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setBulkUploadOpen(true)} size="small">
                Bulk Upload
              </Button>
              {perms.create && <AddButton label="Add Employee" onClick={openAddEmployee} />}
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search by name, code or department..."
              value={employeeSearch}
              onChange={(event) => setEmployeeSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {loadingEmployees ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : (
            <>
            <ModernTable
              columns={[
                { id: "employeeCode", label: "EMP CODE" },
                { id: "fullName", label: "NAME" },
                { id: "department", label: "DEPARTMENT", render: (value) => value || "-" },
                { id: "employmentType", label: "EMPLOYMENT TYPE" },
                {
                  id: "basicSalary",
                  label: "BASIC SALARY",
                  render: (value) => formatMoney(value),
                },
                {
                  id: "grossSalary",
                  label: "GROSS SALARY",
                  render: (value, row) =>
                    formatMoney(
                      value ??
                        Number(row.basicSalary || 0) +
                          Number(row.attendanceAllowance || 0) +
                          Number(row.transportAllowance || 0) +
                          Number(row.professionalAllowance || 0) +
                          Number(row.mobileAllowance || 0)
                    ),
                },
                {
                  id: "isActive",
                  label: "STATUS",
                  render: (value) => (
                    <Chip
                      label={value ? "Active" : "Inactive"}
                      color={value ? "success" : "default"}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  ),
                },
                {
                  id: "actions",
                  label: "ACTIONS",
                  align: "center",
                  render: (_, row) => (
                    <ActionButtons
                      onEdit={() => openEditEmployee(row)}
                      onDelete={() => {
                        setDeletingEmployeeId(row.id || row.Id);
                        setConfirmDeleteEmployeeOpen(true);
                      }}
                    />
                  ),
                },
              ]}
              rows={paginatedEmployees}
              emptyMessage="No employees found"
            />

            <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={employeePageSize} label="Page Size" onChange={handleEmployeePageSizeChange}>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
              <Pagination
                count={Math.max(1, Math.ceil(filteredEmployeeCount / employeePageSize))}
                page={employeePage}
                onChange={handleEmployeePageChange}
                color="primary"
              />
              <Typography variant="body2" color="text.secondary">
                Showing {employeePageStart} to {employeePageEnd} of {filteredEmployeeCount} employees
              </Typography>
            </Box>
            </>
          )}
        </>
      )}

      {activeTab === 1 && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <ModernSearch
                placeholder="Search by employee name or code..."
                value={filterEmployeeSearch}
                onChange={(event) => setFilterEmployeeSearch(event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ModernFilter
                label="Month"
                value={filterMonth}
                onChange={(event) => setFilterMonth(Number(event.target.value))}
                options={MONTH_OPTIONS}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ModernFilter
                label="Year"
                value={filterYear}
                onChange={(event) => setFilterYear(Number(event.target.value))}
                options={yearOptions}
              />
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Cash Advances
            </Typography>
            {perms.create && (
              <AddButton
                label="Add Advance"
                onClick={() => {
                  setAdvanceForm(getEmptyAdvanceForm());
                  setAdvanceEmployeeSearch("");
                  setAddAdvanceOpen(true);
                }}
              />
            )}
          </Box>

          {loadingAdvances ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <ModernTable
              columns={[
                {
                  id: "advanceDate",
                  label: "DATE",
                  render: (value) => formatDate(value),
                },
                { id: "employeeName", label: "EMPLOYEE" },
                {
                  id: "amount",
                  label: "AMOUNT",
                  render: (value) => formatMoney(value),
                },
                {
                  id: "reason",
                  label: "REASON",
                  render: (value) => value || "-",
                },
                {
                  id: "status",
                  label: "STATUS",
                  render: (value) => getAdvanceStatusChip(value),
                },
                {
                  id: "approvedBy",
                  label: "APPROVED BY",
                  render: (value) => value || "-",
                },
                {
                  id: "actions",
                  label: "ACTIONS",
                  align: "center",
                  render: (_, row) =>
                    Number(row.status) === 0 ? (
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        <Tooltip title="Approve">
                          <IconButton color="success" size="small" onClick={() => approveAdvance(row)}>
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <ActionButtons
                          onEdit={() => {
                            setSelectedAdvance(row);
                            setAdvanceForm({
                              salaryEmployeeId: String(row.salaryEmployeeId || row.SalaryEmployeeId || ""),
                              amount: row.amount ?? row.Amount ?? "",
                              advanceDate: formatDate(row.advanceDate || row.AdvanceDate),
                              reason: row.reason || row.Reason || "",
                            });
                            setEditAdvanceOpen(true);
                          }}
                          onDelete={() => {
                            setDeletingAdvanceId(row.id || row.Id);
                            setConfirmDeleteAdvanceOpen(true);
                          }}
                        />
                      </Box>
                    ) : (
                      "-"
                    ),
                },
              ]}
              rows={filteredAdvances.map((advance) => ({
                ...advance,
                id: advance.id || advance.Id,
                advanceDate: advance.advanceDate || advance.AdvanceDate,
                employeeName: advance.employeeName || advance.EmployeeName,
                amount: advance.amount ?? advance.Amount,
                reason: advance.reason || advance.Reason,
                status: advance.status ?? advance.Status,
                approvedBy: advance.approvedBy || advance.ApprovedBy,
                salaryEmployeeId: advance.salaryEmployeeId || advance.SalaryEmployeeId,
              }))}
              emptyMessage="No advances found"
            />
          )}

          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ my: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Leave Requests
            </Typography>
            {perms.create && (
              <AddButton
                label="Add Leave"
                onClick={() => {
                  setLeaveForm(getEmptyLeaveForm());
                  setLeaveEmployeeSearch("");
                  setAddLeaveOpen(true);
                }}
              />
            )}
          </Box>

          {loadingLeaves ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <ModernTable
              columns={[
                { id: "employeeName", label: "EMPLOYEE" },
                { id: "leaveType", label: "TYPE" },
                {
                  id: "startDate",
                  label: "START",
                  render: (value) => formatDate(value),
                },
                {
                  id: "endDate",
                  label: "END",
                  render: (value) => formatDate(value),
                },
                {
                  id: "duration",
                  label: "DAYS",
                  render: (value) => Number(value || 0).toFixed(2),
                },
                {
                  id: "status",
                  label: "STATUS",
                  render: (value) => getLeaveStatusChip(value),
                },
                {
                  id: "reason",
                  label: "REASON",
                  render: (value) => value || "-",
                },
                {
                  id: "actions",
                  label: "ACTIONS",
                  align: "center",
                  render: (_, row) =>
                    Number(row.status) === 0 ? (
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        <Tooltip title="Approve">
                          <IconButton color="success" size="small" onClick={() => approveLeave(row)}>
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <ActionButtons
                          onEdit={() => {
                            setSelectedLeave(row);
                            setLeaveForm({
                              salaryEmployeeId: String(row.salaryEmployeeId || row.SalaryEmployeeId || ""),
                              leaveType: row.leaveType || row.LeaveType || "Annual",
                              startDate: formatDate(row.startDate || row.StartDate),
                              endDate: formatDate(row.endDate || row.EndDate),
                              duration: row.duration ?? row.Duration ?? "",
                              reason: row.reason || row.Reason || "",
                            });
                            setEditLeaveOpen(true);
                          }}
                          onDelete={() => {
                            setDeletingLeaveId(row.id || row.Id);
                            setConfirmDeleteLeaveOpen(true);
                          }}
                        />
                      </Box>
                    ) : (
                      "-"
                    ),
                },
              ]}
              rows={filteredLeaves.map((leave) => ({
                ...leave,
                id: leave.id || leave.Id,
                employeeName: leave.employeeName || leave.EmployeeName,
                leaveType: leave.leaveType || leave.LeaveType,
                startDate: leave.startDate || leave.StartDate,
                endDate: leave.endDate || leave.EndDate,
                duration: leave.duration ?? leave.Duration,
                status: leave.status ?? leave.Status,
                reason: leave.reason || leave.Reason,
                salaryEmployeeId: leave.salaryEmployeeId || leave.SalaryEmployeeId,
              }))}
              emptyMessage="No leave requests found"
            />
          )}
        </>
      )}

      {activeTab === 2 && (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <ModernFilter
                  label="Month"
                  value={salaryMonth}
                  onChange={(event) => setSalaryMonth(Number(event.target.value))}
                  options={MONTH_OPTIONS}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernFilter
                  label="Year"
                  value={salaryYear}
                  onChange={(event) => setSalaryYear(Number(event.target.value))}
                  options={yearOptions}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button variant="contained" onClick={calculateMonthlySalary} disabled={loadingSalary}>
                  {loadingSalary ? "Calculating..." : "Calculate"}
                </Button>
              </Grid>
            </Grid>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={printAllPayslips}
                size="small"
                sx={{ whiteSpace: "nowrap" }}
                disabled={salaryData.length === 0}
              >
                Print All Payslips
              </Button>
              <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportSalaryCsv} size="small" sx={{ whiteSpace: "nowrap" }}>
                Export CSV
              </Button>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search by name or code..."
              value={salarySearch}
              onChange={(event) => setSalarySearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {loadingSalary ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>EMP CODE</TableCell>
                    <TableCell>NAME</TableCell>
                    <TableCell>GROSS SALARY</TableCell>
                    <TableCell>LWP DAYS</TableCell>
                    <TableCell>LWP DEDUCTION</TableCell>
                    <TableCell>ADVANCE DEDUCTION</TableCell>
                    <TableCell>NET PAY</TableCell>
                    <TableCell align="center">ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salaryData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary" py={3}>
                          Click Calculate to generate monthly salary
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {paginatedSalaryData.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.employeeCode}</TableCell>
                          <TableCell>{row.fullName}</TableCell>
                          <TableCell>{formatMoney(row.grossSalary)}</TableCell>
                          <TableCell>{Number(row.lwpDays).toFixed(2)}</TableCell>
                          <TableCell>{formatMoney(row.lwpDeduction)}</TableCell>
                          <TableCell>{formatMoney(row.advanceDeduction)}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "primary.main" }}>
                            {formatMoney(row.netPay)}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Download Payslip">
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => generatePayslipPDF(row)}
                              >
                                <FileDownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>TOTAL</TableCell>
                        <TableCell />
                        <TableCell sx={{ fontWeight: 700 }}>{formatMoney(salaryTotals.grossSalary)}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{salaryTotals.lwpDays.toFixed(2)}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{formatMoney(salaryTotals.lwpDeduction)}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{formatMoney(salaryTotals.advanceDeduction)}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "primary.main" }}>
                          {formatMoney(salaryTotals.netPay)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!loadingSalary && salaryData.length > 0 && (
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={salaryPageSize} label="Page Size" onChange={handleSalaryPageSizeChange}>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
              <Pagination
                count={Math.max(1, Math.ceil(filteredSalaryCount / salaryPageSize))}
                page={salaryPage}
                onChange={handleSalaryPageChange}
                color="primary"
              />
              <Typography variant="body2" color="text.secondary">
                Showing {salaryPageStart} to {salaryPageEnd} of {filteredSalaryCount} employees
              </Typography>
            </Box>
          )}
        </>
      )}

      <FormDialog
        open={addEmployeeOpen}
        onClose={() => setAddEmployeeOpen(false)}
        title="Add Employee"
        onSubmit={submitAddEmployee}
        submitLabel="Create"
        loading={employeeFormLoading}
        maxWidth="md"
      >
        {renderEmployeeFormFields()}
      </FormDialog>

      <FormDialog
        open={editEmployeeOpen}
        onClose={() => setEditEmployeeOpen(false)}
        title="Edit Employee"
        onSubmit={submitEditEmployee}
        submitLabel="Update"
        loading={employeeFormLoading}
        maxWidth="md"
      >
        {renderEmployeeFormFields()}
      </FormDialog>

      <FormDialog
        open={bulkUploadOpen}
        onClose={() => {
          setBulkUploadOpen(false);
          setParsedRows([]);
          setUploadResults(null);
        }}
        title="Bulk Upload Employees"
        showActions={false}
        maxWidth="lg"
      >
        <Box display="flex" gap={1} mb={2}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={downloadEmployeeTemplate}>
            Download Template
          </Button>
          <Button variant="outlined" component="label">
            Select CSV
            <input hidden accept=".csv" type="file" onChange={handleBulkFileChange} />
          </Button>
        </Box>

        {parsedRows.length > 0 && (
          <>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Row No</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>NIC</TableCell>
                    <TableCell>Employment Type</TableCell>
                    <TableCell>Basic Salary</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedRows.map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>{`${row.FirstName || ""} ${row.LastName || ""}`.trim()}</TableCell>
                      <TableCell>{row.NIC}</TableCell>
                      <TableCell>{row.EmploymentType}</TableCell>
                      <TableCell>{formatMoney(row.BasicSalary)}</TableCell>
                      <TableCell>
                        {row.uploadStatus === "Created" ? (
                          <Chip label="Created" color="success" size="small" />
                        ) : row.uploadStatus && row.uploadStatus !== "Ready" ? (
                          <Chip label={row.uploadError || row.uploadStatus} color="error" size="small" />
                        ) : (
                          <Chip label="Ready" color="default" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {uploadResults && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                {uploadResults.successCount ?? uploadResults.SuccessCount ?? 0} of{" "}
                {uploadResults.totalRows ?? uploadResults.TotalRows ?? parsedRows.length} created.{" "}
                {uploadResults.failedCount ?? uploadResults.FailedCount ?? 0} failed.
              </Typography>
            )}

            <Box display="flex" justifyContent="flex-end">
              <Button variant="contained" onClick={handleBulkUpload} disabled={uploadLoading}>
                {uploadLoading ? "Uploading..." : "Upload Employees"}
              </Button>
            </Box>
          </>
        )}
      </FormDialog>

      <FormDialog
        open={addAdvanceOpen}
        onClose={() => {
          setAddAdvanceOpen(false);
          setAdvanceEmployeeSearch("");
        }}
        title="Add Advance"
        onSubmit={submitAddAdvance}
        submitLabel="Create"
        loading={employeeFormLoading}
      >
        <Grid container spacing={2}>
          {renderEmployeeSearchField(
            advanceEmployeeSearch,
            setAdvanceEmployeeSearch,
            advanceForm.salaryEmployeeId,
            (employeeId) => setAdvanceForm((prev) => ({ ...prev, salaryEmployeeId: employeeId }))
          )}
          <FormField name="amount" label="Amount" type="number" value={advanceForm.amount} onChange={handleAdvanceFormChange} required />
          <FormField name="advanceDate" label="Date" type="date" value={advanceForm.advanceDate} onChange={handleAdvanceFormChange} required />
          <FormField name="reason" label="Reason" type="textarea" value={advanceForm.reason} onChange={handleAdvanceFormChange} xs={12} sm={12} md={12} />
        </Grid>
      </FormDialog>

      <FormDialog
        open={editAdvanceOpen}
        onClose={() => setEditAdvanceOpen(false)}
        title="Edit Advance"
        onSubmit={submitEditAdvance}
        submitLabel="Update"
        loading={employeeFormLoading}
      >
        <Grid container spacing={2}>
          <FormField name="amount" label="Amount" type="number" value={advanceForm.amount} onChange={handleAdvanceFormChange} required />
          <FormField name="advanceDate" label="Date" type="date" value={advanceForm.advanceDate} onChange={handleAdvanceFormChange} required />
          <FormField name="reason" label="Reason" type="textarea" value={advanceForm.reason} onChange={handleAdvanceFormChange} xs={12} sm={12} md={12} />
        </Grid>
      </FormDialog>

      <FormDialog
        open={addLeaveOpen}
        onClose={() => {
          setAddLeaveOpen(false);
          setLeaveEmployeeSearch("");
        }}
        title="Add Leave"
        onSubmit={submitAddLeave}
        submitLabel="Create"
        loading={employeeFormLoading}
      >
        <Grid container spacing={2}>
          {renderEmployeeSearchField(
            leaveEmployeeSearch,
            setLeaveEmployeeSearch,
            leaveForm.salaryEmployeeId,
            (employeeId) => setLeaveForm((prev) => ({ ...prev, salaryEmployeeId: employeeId }))
          )}
          <FormField
            name="leaveType"
            label="Leave Type"
            type="select"
            value={leaveForm.leaveType}
            onChange={handleLeaveFormChange}
            options={LEAVE_TYPES.map((value) => ({ value, label: value }))}
            required
          />
          <FormField name="startDate" label="Start Date" type="date" value={leaveForm.startDate} onChange={handleLeaveStartDateChange} required />
          <FormField name="endDate" label="End Date" type="date" value={leaveForm.endDate} onChange={handleLeaveEndDateChange} required />
          <FormField
            name="duration"
            label="Duration (days)"
            type="number"
            value={leaveForm.duration}
            onChange={handleLeaveFormChange}
            required
            disabled
            helperText="Auto-calculated from start and end dates"
          />
          <FormField name="reason" label="Reason" type="textarea" value={leaveForm.reason} onChange={handleLeaveFormChange} xs={12} sm={12} md={12} />
        </Grid>
      </FormDialog>

      <FormDialog
        open={editLeaveOpen}
        onClose={() => setEditLeaveOpen(false)}
        title="Edit Leave"
        onSubmit={submitEditLeave}
        submitLabel="Update"
        loading={employeeFormLoading}
      >
        <Grid container spacing={2}>
          <FormField
            name="leaveType"
            label="Leave Type"
            type="select"
            value={leaveForm.leaveType}
            onChange={handleLeaveFormChange}
            options={LEAVE_TYPES.map((value) => ({ value, label: value }))}
            required
          />
          <FormField name="startDate" label="Start Date" type="date" value={leaveForm.startDate} onChange={handleLeaveFormChange} required />
          <FormField name="endDate" label="End Date" type="date" value={leaveForm.endDate} onChange={handleLeaveFormChange} required />
          <FormField name="duration" label="Duration (days)" type="number" value={leaveForm.duration} onChange={handleLeaveFormChange} required />
          <FormField name="reason" label="Reason" type="textarea" value={leaveForm.reason} onChange={handleLeaveFormChange} xs={12} sm={12} md={12} />
        </Grid>
      </FormDialog>

      <ConfirmDialog
        open={confirmDeleteEmployeeOpen}
        onClose={() => {
          setConfirmDeleteEmployeeOpen(false);
          setDeletingEmployeeId(null);
        }}
        onConfirm={confirmDeleteEmployee}
        title="Delete Employee"
        message="Are you sure you want to delete this employee?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />

      <ConfirmDialog
        open={confirmDeleteAdvanceOpen}
        onClose={() => {
          setConfirmDeleteAdvanceOpen(false);
          setDeletingAdvanceId(null);
        }}
        onConfirm={confirmDeleteAdvance}
        title="Delete Advance"
        message="Are you sure you want to delete this advance?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />

      <ConfirmDialog
        open={confirmDeleteLeaveOpen}
        onClose={() => {
          setConfirmDeleteLeaveOpen(false);
          setDeletingLeaveId(null);
        }}
        onConfirm={confirmDeleteLeave}
        title="Delete Leave"
        message="Are you sure you want to delete this leave request?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />
    </>
  );
}

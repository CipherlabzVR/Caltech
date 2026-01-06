import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import PeopleIcon from "@mui/icons-material/People";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import NotificationsIcon from "@mui/icons-material/Notifications";
import GavelIcon from "@mui/icons-material/Gavel";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import BlockIcon from "@mui/icons-material/Block";
import CancelIcon from "@mui/icons-material/Cancel";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import SchoolIcon from "@mui/icons-material/School";
import EditNoteIcon from "@mui/icons-material/EditNote";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import UploadIcon from "@mui/icons-material/Upload";
import AddIcon from "@mui/icons-material/Add";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";

const EMPLOYMENT_STATUS_LABELS = {
  0: "Draft",
  1: "Active",
  2: "Probation",
  3: "Suspended",
  4: "Terminated",
  5: "Resigned",
  6: "Retired",
  7: "Alumni",
  Draft: "Draft",
  Active: "Active",
  Probation: "Probation",
  Suspended: "Suspended",
  Terminated: "Terminated",
  Resigned: "Resigned",
  Retired: "Retired",
  Alumni: "Alumni",
};

// Map enum values to form values
const mapEnumToFormStatus = (status) => {
  if (status === undefined || status === null) return "Draft";
  
  // Handle numeric enum values
  if (typeof status === "number") {
    const statusMap = {
      0: "Draft",
      1: "Active",
      2: "Probation",
      3: "Suspended",
      4: "Terminated",
      5: "Resigned",
      6: "Retired",
      7: "Alumni",
    };
    return statusMap[status] || "Draft";
  }
  
  // Handle string enum values
  if (typeof status === "string") {
    // If it's already a valid form value, return it
    const validValues = ["Draft", "Active", "Probation", "Suspended", "Terminated", "Resigned", "Retired", "Alumni"];
    if (validValues.includes(status)) {
      return status;
    }
    
    // Map enum names to form values
    const enumMap = {
      "Draft": "Draft",
      "Active": "Active",
      "Probation": "Probation",
      "Suspended": "Suspended",
      "Terminated": "Terminated",
      "Resigned": "Resigned",
      "Retired": "Retired",
      "Alumni": "Alumni",
    };
    return enumMap[status] || "Draft";
  }
  
  return "Draft";
};

// Map form values to enum values for backend
const mapFormStatusToEnum = (formStatus) => {
  const formToEnum = {
    "Draft": 0,
    "Active": 1,
    "Probation": 2,
    "Suspended": 3,
    "Terminated": 4,
    "Resigned": 5,
    "Retired": 6,
    "Alumni": 7,
  };
  return formToEnum[formStatus] ?? 0;
};

const EmployeeLifecycle = () => {
  const categoryId = 127;
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
  const [employeeProfiles, setEmployeeProfiles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [employeeTagsCache, setEmployeeTagsCache] = useState({}); // Cache for employee Tags JSON (same as profile view uses)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("");
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    onProbationEmployees: 0,
    onboardingEmployees: 0,
    offboardingEmployees: 0,
    upcomingReminders: 0,
    openGrievances: 0,
    newHiresThisMonth: 0,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedEmployeeProfile, setSelectedEmployeeProfile] = useState(null);
  const [profileTabValue, setProfileTabValue] = useState(0);
  const [employmentTimeline, setEmploymentTimeline] = useState([]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyEventType, setHistoryEventType] = useState("Promotion");
  const [historyFormData, setHistoryFormData] = useState({
    effectiveDate: "",
    remarks: "",
    // Promotion fields
    oldJobTitleId: null,
    newJobTitleId: null,
    oldDepartmentId: null,
    newDepartmentId: null,
    oldSalary: "",
    newSalary: "",
    // Transfer fields
    oldLocation: "",
    newLocation: "",
    // Disciplinary Action fields
    actionType: "",
    actionDescription: "",
    // Salary Revision fields
    oldBasicSalary: "",
    newBasicSalary: "",
    oldAllowances: "",
    newAllowances: "",
  });
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [jobTitles, setJobTitles] = useState([]);
  const [loadingJobTitles, setLoadingJobTitles] = useState(false);
  const [filteredEmployeesDialogOpen, setFilteredEmployeesDialogOpen] = useState(false);
  const [filteredEmployeesTitle, setFilteredEmployeesTitle] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  const loadDepartments = useCallback(async () => {
    try {
      setLoadingDepartments(true);
      const headers = createAuthHeaders();
      
      const response = await fetch(
        `${BASE_URL}/Department/GetAllDepartment?SkipCount=0&MaxResultCount=100`,
        { headers }
      );
      
      if (response.ok) {
        const jsonResponse = await response.json();
        const deptData = parsePagedResponse(jsonResponse);
        const deptList = deptData.items || [];
        setDepartments(deptList);
      } else {
        console.error("Failed to load departments:", response.status, response.statusText);
        setDepartments([]);
      }
    } catch (err) {
      console.error("Error loading departments:", err);
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  const loadJobTitles = useCallback(async () => {
    try {
      setLoadingJobTitles(true);
      const headers = createAuthHeaders();
      
      const response = await fetch(
        `${BASE_URL}/JobTitle/GetAllJobTitle?SkipCount=0&MaxResultCount=100`,
        { headers }
      );
      
      if (response.ok) {
        const jsonResponse = await response.json();
        const jobTitleData = parsePagedResponse(jsonResponse);
        const jobTitleList = jobTitleData.items || [];
        setJobTitles(jobTitleList);
      } else {
        console.error("Failed to load job titles:", response.status, response.statusText);
        setJobTitles([]);
      }
    } catch (err) {
      console.error("Error loading job titles:", err);
      setJobTitles([]);
    } finally {
      setLoadingJobTitles(false);
    }
  }, []);

  useEffect(() => {
    if (!navigate) {
      return;
    }

    let ignore = false;

    const loadEmployeeProfiles = async () => {
      try {
        setLoading(true);
        setError(null);

        const orgId = getOrgId();
        const headers = createAuthHeaders();
        const skip = (page - 1) * pageSize;

        let query = `${BASE_URL}/hr/employees?OrgId=${orgId || 0}&SkipCount=${skip}&MaxResultCount=${pageSize}`;
        
        if (search) {
          query += `&Search=${encodeURIComponent(search)}`;
        }
        
        if (departmentFilter) {
          query += `&DepartmentId=${departmentFilter}`;
        }
        
        if (statusFilter) {
          query += `&EmploymentStatus=${encodeURIComponent(statusFilter)}`;
        }
        
        if (employmentTypeFilter) {
          query += `&EmploymentType=${encodeURIComponent(employmentTypeFilter)}`;
        }
        

        const [employeesResponse, dashboardResponse] = await Promise.all([
          fetch(query, { headers }),
          fetch(`${BASE_URL}/hr/employees/dashboard?orgId=${orgId || 0}`, { headers }),
        ]);

        if (!employeesResponse.ok) {
          throw new Error("Unable to load employee profiles");
        }

        const employeesJson = await employeesResponse.json();
        const payload = parsePagedResponse(employeesJson);
        
        // Debug: Check if Tags JSON is in the response for employee 002
        if (payload.items && payload.items.length > 0) {
          const emp002 = payload.items.find(e => (e.employeeCode === "002" || e.EmployeeCode === "002"));
          if (emp002) {
            console.log("Raw API Response for employee 002:", {
              hasTags: !!(emp002.tags || emp002.Tags),
              tagsValue: emp002.tags || emp002.Tags,
              tagsType: typeof (emp002.tags || emp002.Tags),
              allKeys: Object.keys(emp002).filter(k => k.toLowerCase().includes('tag') || k.toLowerCase().includes('employment'))
            });
          }
        }
        
        if (dashboardResponse.ok) {
          const dashboardData = parseObjectResponse(await dashboardResponse.json());
          console.log("Dashboard API Response:", dashboardData);
          
          if (!ignore) {
            // Calculate probation employees from loaded employee profiles if not provided by API
            const probationCount = payload.items?.filter(emp => {
              const status = emp.employmentStatus !== undefined ? emp.employmentStatus : (emp.EmploymentStatus !== undefined ? emp.EmploymentStatus : null);
              return status === 2 || status === "Probation" || status === "probation" || status === "2" || String(status) === "2";
            }).length || 0;
            
            // Extract values with proper fallback - API returns PascalCase
            const metrics = {
              totalEmployees: dashboardData.TotalEmployees ?? dashboardData.totalEmployees ?? 0,
              activeEmployees: dashboardData.ActiveEmployees ?? dashboardData.activeEmployees ?? 0,
              onProbationEmployees: dashboardData.ProbationEmployees ?? dashboardData.onProbationEmployees ?? probationCount,
              onboardingEmployees: dashboardData.OnboardingsInProgress ?? dashboardData.onboardingEmployees ?? dashboardData.onboardingsInProgress ?? 0,
              offboardingEmployees: dashboardData.OffboardingsInProgress ?? dashboardData.offboardingEmployees ?? dashboardData.offboardingsInProgress ?? 0,
              upcomingReminders: dashboardData.PendingReminders ?? dashboardData.upcomingReminders ?? dashboardData.pendingReminders ?? 0,
              openGrievances: dashboardData.OpenGrievances ?? dashboardData.openGrievances ?? 0,
              newHiresThisMonth: dashboardData.NewHires ?? dashboardData.newHiresThisMonth ?? dashboardData.newHires ?? 0,
            };
            
            console.log("Extracted Metrics:", metrics);
            setDashboardMetrics(metrics);
          }
        } else {
          console.error("Dashboard API failed:", dashboardResponse.status, dashboardResponse.statusText);
        }

        if (ignore) {
          return;
        }

        const loadedProfiles = payload.items ?? [];
        // Normalize data to have both camelCase and PascalCase properties
        const normalizedProfiles = loadedProfiles.map(emp => {
          // Parse Tags JSON to extract location and employmentType (same as profile view does)
          let tagsData = {};
          try {
            if (emp.tags || emp.Tags) {
              const tagsStr = emp.tags || emp.Tags;
              if (tagsStr && typeof tagsStr === 'string' && tagsStr.trim() !== "") {
                tagsData = JSON.parse(tagsStr);
              }
            }
          } catch (e) {
            // Tags JSON parsing failed, continue with empty object
          }
          
          // Extract location from Tags JSON or direct properties (same as profile view)
          const locationFromTags = tagsData.location || tagsData.Location;
          const locationFromDirect = emp.location ?? emp.Location;
          const location = locationFromTags ?? locationFromDirect ?? null;
          
          // Preserve all original properties including Tags JSON (EXACT same as profile view expects)
          const normalized = {
            ...emp,
            // Preserve Tags JSON exactly as received (critical for employmentType and location - same as profile view)
            tags: emp.tags ?? emp.Tags ?? null,
            Tags: emp.Tags ?? emp.tags ?? null,
            // Ensure both camelCase and PascalCase for IDs
            departmentId: emp.departmentId ?? emp.DepartmentId ?? null,
            DepartmentId: emp.DepartmentId ?? emp.departmentId ?? null,
            jobTitleId: emp.jobTitleId ?? emp.JobTitleId ?? null,
            JobTitleId: emp.JobTitleId ?? emp.jobTitleId ?? null,
            // Extract location from Tags JSON if not in direct properties
            location: location,
            Location: location,
            // Ensure names are available if provided
            departmentName: emp.departmentName ?? emp.DepartmentName ?? null,
            DepartmentName: emp.DepartmentName ?? emp.departmentName ?? null,
            jobTitleName: emp.jobTitleName ?? emp.JobTitleName ?? null,
            JobTitleName: emp.JobTitleName ?? emp.jobTitleName ?? null,
          };
          
          return normalized;
        });
        
        // Enrich profiles with individual employee data if Tags JSON is missing or incomplete
        // This uses the EXACT same endpoint and method as profile view (handleViewProfile)
        const enrichedProfiles = await Promise.all(normalizedProfiles.map(async (emp) => {
          const empId = emp.id || emp.internalId || emp.Id || emp.InternalId;
          
          // Check if Tags JSON exists and has employmentType (same check as profile view)
          let tagsData = {};
          let hasEmploymentType = false;
          try {
            if (emp.tags || emp.Tags) {
              const tagsStr = emp.tags || emp.Tags;
              if (tagsStr && typeof tagsStr === 'string' && tagsStr.trim() !== "") {
                tagsData = JSON.parse(tagsStr);
                hasEmploymentType = !!(tagsData.employmentType || tagsData.EmploymentType);
              }
            }
          } catch (e) {
            // Tags JSON parsing failed
          }
          
          // If Tags JSON is missing or doesn't have employmentType, fetch individual employee data
          // This is the EXACT same fetch as profile view uses (line 647)
          if (!hasEmploymentType && empId) {
            try {
              const headers = createAuthHeaders();
              const response = await fetch(`${BASE_URL}/hr/employees/${empId}`, { headers });
              if (response.ok) {
                const data = await response.json();
                const profileData = parseObjectResponse(data);
                const profile = profileData.profile || profileData.Profile || profileData;
                
                // Use EXACT same structure as profile view (lines 2717-2741)
                // Merge Tags JSON from individual employee data
                if (profile.tags || profile.Tags) {
                  emp.tags = profile.tags || profile.Tags;
                  emp.Tags = profile.Tags || profile.tags;
                  
                  // Extract location from enriched Tags JSON (same as profile view)
                  try {
                    const enrichedTagsData = JSON.parse(profile.tags || profile.Tags);
                    const locationFromTags = enrichedTagsData.location || enrichedTagsData.Location;
                    if (locationFromTags) {
                      emp.location = locationFromTags;
                      emp.Location = locationFromTags;
                    }
                  } catch (e) {
                    // Failed to parse enriched Tags JSON
                  }
                  
                  // Cache Tags JSON for render function (same as profile view uses)
                  setEmployeeTagsCache(prev => ({
                    ...prev,
                    [empId]: profile.tags || profile.Tags
                  }));
                }
              }
            } catch (e) {
              console.error(`Failed to enrich employee ${empId}:`, e);
            }
          } else if (hasEmploymentType && empId) {
            // Cache Tags JSON if it already exists
            setEmployeeTagsCache(prev => ({
              ...prev,
              [empId]: emp.tags || emp.Tags
            }));
          }
          
          return emp;
        }));
        
        setEmployeeProfiles(enrichedProfiles);
        setTotalCount(payload.totalCount ?? 0);
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load employee profiles");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadEmployeeProfiles();
    loadDepartments();
    loadJobTitles();

    return () => {
      ignore = true;
    };
  }, [navigate, page, pageSize, search, departmentFilter, statusFilter, employmentTypeFilter]);

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

  // Calculate status counts from employee profiles
  const statusCounts = useMemo(() => {
    const counts = {
      Draft: 0,
      Active: 0,
      Probation: 0,
      Suspended: 0,
      Terminated: 0,
      Resigned: 0,
      Retired: 0,
      Alumni: 0,
      Total: employeeProfiles.length,
    };

    employeeProfiles.forEach(emp => {
      const status = emp.employmentStatus !== undefined ? emp.employmentStatus : (emp.EmploymentStatus !== undefined ? emp.EmploymentStatus : null);
      const statusLabel = mapEnumToFormStatus(status);
      
      if (counts.hasOwnProperty(statusLabel)) {
        counts[statusLabel]++;
      }
    });

    return counts;
  }, [employeeProfiles]);

  const handleAdd = () => {
    setFormMode("add");
    setFormData({
      // Personal Info
      employeeCode: "", // Will be auto-generated if empty
      firstName: "",
      lastName: "",
      fullName: "",
      nameWithInitials: "",
      nic: "",
      passportNo: "",
      dateOfBirth: "",
      gender: "",
      maritalStatus: "",
      dependentsCount: 0,
      mobileNumber: "",
      landlineNumber: "",
      email: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      district: "",
      province: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: "",
      // Employment Info
      hireDate: new Date().toISOString().split("T")[0],
      dateJoined: new Date().toISOString().split("T")[0],
      departmentId: "",
      jobTitleId: "",
      location: "",
      managerId: "",
      employmentType: "Permanent",
      probationStartDate: "",
      probationEndDate: "",
      probationStatus: "",
      appointmentLetterUrl: "",
      appointmentLetterFile: null,
      workScheduleId: "",
      status: "Active",
      profilePhotoUrl: "",
      // Compensation
      basicSalary: 0,
      salaryGrade: "",
      attendanceAllowance: 0,
      transportAllowance: 0,
      professionalAllowance: 0,
      mobileAllowance: 0,
      otherAllowance: 0,
      otherAllowanceDescription: "",
      overtimeEligible: false,
      payrollCycle: "Monthly",
      // Statutory
      epfNumber: "",
      etfNumber: "",
      epfEmployeeContributionPercent: 8,
      epfEmployerContributionPercent: 12,
      etfContributionPercent: 3,
      // Banking
      bankName: "",
      bankCode: "",
      branchName: "",
      branchCode: "",
      accountNumber: "",
      accountType: "Savings",
      paymentMode: "Bank Transfer",
      // Documents
      documents: [],
      documentsJson: null,
      // Legacy
      phone: "",
      employmentStatus: "Draft",
    });
    setFormErrors({});
    setFormStep(0);
    setFormOpen(true);
    // Load departments when opening the form if not already loaded
    if (departments.length === 0) {
      loadDepartments();
    }
    // Load job titles when opening the form if not already loaded
    if (jobTitles.length === 0) {
      loadJobTitles();
    }
  };

  // Helper function to format date for date input (YYYY-MM-DD)
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return "";
    
    try {
      // If it's already in YYYY-MM-DD format, return as is
      if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }
      
      // Parse the date and format it
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date value:", dateValue);
        return "";
      }
      
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error, dateValue);
      return "";
    }
  };

  const handleViewProfile = async (item) => {
    try {
      const headers = createAuthHeaders();
      const response = await fetch(`${BASE_URL}/hr/employees/${item.id || item.internalId}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        const profileData = parseObjectResponse(data);
        const profile = profileData.profile || profileData.Profile || profileData;
        
        // Normalize profile data to have both camelCase and PascalCase properties
        const normalizedProfile = {
          ...profile,
          // Ensure both camelCase and PascalCase for IDs (preserve existing, add missing)
          departmentId: profile.departmentId ?? profile.DepartmentId ?? null,
          DepartmentId: profile.DepartmentId ?? profile.departmentId ?? null,
          jobTitleId: profile.jobTitleId ?? profile.JobTitleId ?? null,
          JobTitleId: profile.JobTitleId ?? profile.jobTitleId ?? null,
          location: profile.location ?? profile.Location ?? null,
          Location: profile.Location ?? profile.location ?? null,
          // Ensure names are available if provided
          departmentName: profile.departmentName ?? profile.DepartmentName ?? null,
          DepartmentName: profile.DepartmentName ?? profile.departmentName ?? null,
          jobTitleName: profile.jobTitleName ?? profile.JobTitleName ?? null,
          JobTitleName: profile.JobTitleName ?? profile.jobTitleName ?? null,
        };
        
        // Get employment timeline from profileData
        const timeline = profileData.employmentTimeline || profileData.EmploymentTimeline || [];
        
        setSelectedEmployeeProfile(normalizedProfile);
        setEmploymentTimeline(timeline);
        setProfileDialogOpen(true);
      } else {
        toast.error("Failed to load employee profile");
      }
    } catch (error) {
      console.error("Error loading employee profile:", error);
      toast.error("Error loading employee profile");
    }
  };

  const handleEdit = (item) => {
    setFormMode("edit");
    
    // Parse JSON fields
    let addressData = {};
    let salaryData = {};
    let tagsData = {};
    
    try {
      if (item.addressJson || item.AddressJson) {
        addressData = JSON.parse(item.addressJson || item.AddressJson);
      }
    } catch (e) {
      console.error("Error parsing addressJson:", e);
    }
    
    try {
      if (item.salaryStructureJson || item.SalaryStructureJson) {
        salaryData = JSON.parse(item.salaryStructureJson || item.SalaryStructureJson);
      }
    } catch (e) {
      console.error("Error parsing salaryStructureJson:", e);
    }
    
    try {
      if (item.tags || item.Tags) {
        tagsData = JSON.parse(item.tags || item.Tags);
      }
    } catch (e) {
      console.error("Error parsing tags:", e);
    }
    
    // Map employment status from enum value to form value
    const statusValue = item.employmentStatus !== undefined ? item.employmentStatus : (item.EmploymentStatus !== undefined ? item.EmploymentStatus : null);
    const mappedStatus = mapEnumToFormStatus(statusValue);
    
    console.log("Edit - Original status:", statusValue, "Type:", typeof statusValue, "Mapped:", mappedStatus);
    
    // Format dates for date input fields
    const formattedHireDate = formatDateForInput(item.hireDate || item.HireDate);
    const formattedDateOfBirth = formatDateForInput(item.dateOfBirth || item.DateOfBirth);
    
    setFormData({
      id: item.id || item.internalId,
      // Personal Info (from database and Tags JSON)
      employeeCode: item.employeeCode || item.EmployeeCode || "",
      firstName: item.firstName || item.FirstName || "",
      lastName: item.lastName || item.LastName || "",
      fullName: tagsData.fullName || item.fullName || item.FullName || "",
      nameWithInitials: tagsData.nameWithInitials || item.nameWithInitials || item.NameWithInitials || "",
      nic: tagsData.nic || item.nic || item.NIC || "",
      passportNo: tagsData.passportNo || item.passportNo || item.PassportNo || "",
      dateOfBirth: formattedDateOfBirth,
      gender: tagsData.gender || item.gender || item.Gender || "",
      maritalStatus: tagsData.maritalStatus || item.maritalStatus || item.MaritalStatus || "",
      dependentsCount: tagsData.dependentsCount || item.dependentsCount || item.DependentsCount || 0,
      mobileNumber: addressData.mobileNumber || item.mobileNumber || item.MobileNumber || "",
      landlineNumber: addressData.landlineNumber || item.landlineNumber || item.LandlineNumber || "",
      email: item.email || item.Email || "",
      phone: item.phone || item.Phone || "",
      addressLine1: addressData.addressLine1 || item.addressLine1 || item.AddressLine1 || "",
      addressLine2: addressData.addressLine2 || item.addressLine2 || item.AddressLine2 || "",
      city: addressData.city || item.city || item.City || "",
      district: addressData.district || item.district || item.District || "",
      province: addressData.province || item.province || item.Province || "",
      emergencyContactName: addressData.emergencyContactName || item.emergencyContactName || item.EmergencyContactName || "",
      emergencyContactRelationship: addressData.emergencyContactRelationship || item.emergencyContactRelationship || item.EmergencyContactRelationship || "",
      emergencyContactPhone: addressData.emergencyContactPhone || item.emergencyContactPhone || item.EmergencyContactPhone || "",
      // Employment Info (from database and Tags JSON)
      hireDate: formattedHireDate,
      dateJoined: formatDateForInput(tagsData.dateJoined || item.dateJoined || item.DateJoined || item.hireDate || item.HireDate),
      departmentId: item.departmentId ? String(item.departmentId) : "",
      jobTitleId: item.jobTitleId ? String(item.jobTitleId) : "",
      location: tagsData.location || item.location || item.Location || "",
      managerId: item.managerId ? String(item.managerId) : "",
      employmentType: tagsData.employmentType || item.employmentType || item.EmploymentType || "Permanent",
      probationStartDate: formatDateForInput(tagsData.probationStartDate || item.probationStartDate || item.ProbationStartDate),
      probationEndDate: formatDateForInput(item.probationEndDate || item.ProbationEndDate),
      probationStatus: item.probationStatus || item.ProbationStatus || "",
      appointmentLetterUrl: tagsData.appointmentLetterUrl || item.appointmentLetterUrl || item.AppointmentLetterUrl || "",
      workScheduleId: tagsData.workScheduleId ? String(tagsData.workScheduleId) : (item.workScheduleId ? String(item.workScheduleId) : ""),
      status: tagsData.status || item.status || item.Status || "Active",
      profilePhotoUrl: tagsData.profilePhotoUrl || item.profilePhotoUrl || item.ProfilePhotoUrl || "",
      employmentStatus: mappedStatus,
      // Compensation (from SalaryStructureJson)
      basicSalary: salaryData.basicSalary || item.compensations?.[0]?.basicSalary || item.compensations?.[0]?.BasicSalary || 0,
      salaryGrade: salaryData.salaryGrade || item.compensations?.[0]?.salaryGrade || item.compensations?.[0]?.SalaryGrade || "",
      attendanceAllowance: salaryData.attendanceAllowance || item.compensations?.[0]?.attendanceAllowance || item.compensations?.[0]?.AttendanceAllowance || 0,
      transportAllowance: salaryData.transportAllowance || item.compensations?.[0]?.transportAllowance || item.compensations?.[0]?.TransportAllowance || 0,
      professionalAllowance: salaryData.professionalAllowance || item.compensations?.[0]?.professionalAllowance || item.compensations?.[0]?.ProfessionalAllowance || 0,
      mobileAllowance: salaryData.mobileAllowance || item.compensations?.[0]?.mobileAllowance || item.compensations?.[0]?.MobileAllowance || 0,
      otherAllowance: salaryData.otherAllowance || 0,
      otherAllowanceDescription: salaryData.otherAllowanceDescription || "",
      overtimeEligible: salaryData.overtimeEligible || false,
      payrollCycle: salaryData.payrollCycle || item.compensations?.[0]?.payrollCycle || item.compensations?.[0]?.PayrollCycle || "Monthly",
      // Statutory (from SalaryStructureJson)
      epfNumber: salaryData.epfNumber || item.statutoryInfos?.[0]?.epfNumber || item.statutoryInfos?.[0]?.EPFNumber || "",
      etfNumber: salaryData.etfNumber || item.statutoryInfos?.[0]?.etfNumber || item.statutoryInfos?.[0]?.ETFNumber || "",
      epfEmployeeContributionPercent: salaryData.epfEmployeeContributionPercent || item.statutoryInfos?.[0]?.epfEmployeeContribution || item.statutoryInfos?.[0]?.EPFEmployeeContribution || 8,
      epfEmployerContributionPercent: salaryData.epfEmployerContributionPercent || item.statutoryInfos?.[0]?.epfEmployerContribution || item.statutoryInfos?.[0]?.EPFEmployerContribution || 12,
      etfContributionPercent: salaryData.etfContributionPercent || item.statutoryInfos?.[0]?.etfContribution || item.statutoryInfos?.[0]?.ETFContribution || 3,
      // Banking (from SalaryStructureJson)
      bankName: salaryData.bankName || item.bankDetails?.[0]?.bankName || item.bankDetails?.[0]?.BankName || "",
      bankCode: salaryData.bankCode || item.bankDetails?.[0]?.bankCode || item.bankDetails?.[0]?.BankCode || "",
      branchName: salaryData.branchName || item.bankDetails?.[0]?.branchName || item.bankDetails?.[0]?.BranchName || "",
      branchCode: salaryData.branchCode || item.bankDetails?.[0]?.branchCode || item.bankDetails?.[0]?.BranchCode || "",
      accountNumber: salaryData.accountNumber || item.bankDetails?.[0]?.accountNumber || item.bankDetails?.[0]?.AccountNumber || "",
      accountType: salaryData.accountType || item.bankDetails?.[0]?.accountType || item.bankDetails?.[0]?.AccountType || "Savings",
      paymentMode: salaryData.paymentMode || item.bankDetails?.[0]?.paymentMode || item.bankDetails?.[0]?.PaymentMode || "Bank Transfer",
      // Documents
      documents: [],
      documentsJson: item.documentsJson || item.DocumentsJson || null,
    });
    setFormErrors({});
    setFormOpen(true);
    // Load departments when opening the form if not already loaded
    if (departments.length === 0) {
      loadDepartments();
    }
    // Load job titles when opening the form if not already loaded
    if (jobTitles.length === 0) {
      loadJobTitles();
    }
  };

  // Validate NIC format (old: 9 digits + V, new: 12 digits)
  const validateNIC = (nic) => {
    if (!nic) return { valid: false, message: "NIC is required" };
    const cleaned = nic.replace(/[-\s]/g, "");
    // Old format: 9 digits + V or X
    const oldFormat = /^[0-9]{9}[VXvx]$/;
    // New format: 12 digits
    const newFormat = /^[0-9]{12}$/;
    
    if (oldFormat.test(cleaned) || newFormat.test(cleaned)) {
      return { valid: true, message: "" };
    }
    return { valid: false, message: "Invalid NIC format. Use old format (9 digits + V) or new format (12 digits)" };
  };

  const getProvinceFromDistrict = (district) => {
    const districtProvinceMap = {
      "Colombo": "Western", "Gampaha": "Western", "Kalutara": "Western",
      "Kandy": "Central", "Matale": "Central", "Nuwara Eliya": "Central",
      "Galle": "Southern", "Matara": "Southern", "Hambantota": "Southern",
      "Jaffna": "Northern", "Kilinochchi": "Northern", "Mannar": "Northern",
      "Mullaitivu": "Northern", "Vavuniya": "Northern",
      "Batticaloa": "Eastern", "Ampara": "Eastern", "Trincomalee": "Eastern",
      "Kurunegala": "North Western", "Puttalam": "North Western",
      "Anuradhapura": "North Central", "Polonnaruwa": "North Central",
      "Badulla": "Uva", "Moneragala": "Uva",
      "Ratnapura": "Sabaragamuwa", "Kegalle": "Sabaragamuwa",
    };
    return districtProvinceMap[district] || "";
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-fill province when district changes
      if (name === "district" && value) {
        updated.province = getProvinceFromDistrict(value);
      }
      // Auto-fill bank code when bank name changes
      if (name === "bankName" && value) {
        const bankCodes = {
          "Bank of Ceylon": "BOC",
          "People's Bank": "PB",
          "Sampath Bank": "SAMPATH",
          "Commercial Bank": "COMBANK",
          "Hatton National Bank": "HNB",
          "NDB Bank": "NDB",
          "DFCC Bank": "DFCC",
          "National Savings Bank": "NSB",
          "Seylan Bank": "SEYLAN",
        };
        updated.bankCode = bankCodes[value] || "";
      }
      return updated;
    });
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
    // Employee code is optional (auto-generated if empty)
    if (!formData.firstName?.trim()) errors.firstName = "First Name is required";
    if (!formData.lastName?.trim()) errors.lastName = "Last Name is required";
    
    // NIC validation
    if (!formData.nic?.trim()) {
      errors.nic = "NIC is required";
    } else {
      const nicValidation = validateNIC(formData.nic);
      if (!nicValidation.valid) {
        errors.nic = nicValidation.message;
      }
    }
    
    // Email validation
    if (!formData.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    
    if (!formData.mobileNumber?.trim()) errors.mobileNumber = "Mobile Number is required";
    if (!formData.hireDate) errors.hireDate = "Date Joined is required";
    if (!formData.employmentType?.trim()) errors.employmentType = "Employment Type is required";
    
    // Dependents count validation for EPF/ETF
    if (formData.dependentsCount === undefined || formData.dependentsCount === null) {
      errors.dependentsCount = "Dependents count is required for EPF/ETF";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    console.log("Form submit triggered", { formData, formMode });
    
    if (!validateForm()) {
      console.log("Form validation failed", formErrors);
      return;
    }

    setFormLoading(true);
    try {
      // Get orgId from multiple sources
      let orgIdInt = 0;
      
      // Try getOrgId() first
      const orgId = getOrgId();
      if (orgId && !isNaN(orgId) && orgId > 0) {
        orgIdInt = typeof orgId === 'number' ? orgId : parseInt(String(orgId), 10);
      }
      
      // If still 0, try sessionStorage
      if (orgIdInt <= 0) {
        const orgIdFromStorage = sessionStorage.getItem("orgId");
        if (orgIdFromStorage) {
          const parsed = parseInt(orgIdFromStorage, 10);
          if (!isNaN(parsed) && parsed > 0) {
            orgIdInt = parsed;
          }
        }
      }
      
      // If still 0, try localStorage (company)
      if (orgIdInt <= 0) {
        const company = localStorage.getItem("company");
        if (company) {
          const parsed = parseInt(company, 10);
          if (!isNaN(parsed) && parsed > 0) {
            orgIdInt = parsed;
          }
        }
      }
      
      console.log("OrgId resolved:", orgIdInt);
      
      // If orgId is still 0, log warning but proceed (backend will handle validation)
      if (orgIdInt <= 0) {
        console.warn("OrgId is 0 or not found, proceeding with request anyway");
      }

      const headers = createAuthHeaders();
      console.log("Headers created:", headers);
      
      // Format dates properly - handle both YYYY-MM-DD and ISO formats
      let hireDate;
      if (formData.hireDate) {
        try {
          // If it's in YYYY-MM-DD format, add time component
          if (typeof formData.hireDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(formData.hireDate)) {
            hireDate = new Date(formData.hireDate + 'T00:00:00').toISOString();
          } else {
            // Try to parse as date
            const date = new Date(formData.hireDate);
            if (isNaN(date.getTime())) {
              throw new Error("Invalid hire date");
            }
            hireDate = date.toISOString();
          }
        } catch (error) {
          console.error("Error parsing hire date:", error, formData.hireDate);
          hireDate = new Date().toISOString();
        }
      } else {
        hireDate = new Date().toISOString();
      }

      let dateOfBirth = null;
      if (formData.dateOfBirth) {
        try {
          // If it's in YYYY-MM-DD format, add time component
          if (typeof formData.dateOfBirth === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth)) {
            dateOfBirth = new Date(formData.dateOfBirth + 'T00:00:00').toISOString();
          } else {
            // Try to parse as date
            const date = new Date(formData.dateOfBirth);
            if (!isNaN(date.getTime())) {
              dateOfBirth = date.toISOString();
            }
          }
        } catch (error) {
          console.error("Error parsing date of birth:", error, formData.dateOfBirth);
          dateOfBirth = null;
        }
      }

      // Backend expects enum name as string (e.g., "Draft", "Active", "Probation"), not the number
      // The form already has the correct string value, so we can use it directly
      const employmentStatusString = formData.employmentStatus || "Draft";
      
      console.log("Submit - Form status:", formData.employmentStatus, "Sending to backend:", employmentStatusString);
      
      // Format additional dates
      const formatDateForPayload = (dateStr) => {
        if (!dateStr) return null;
        try {
          if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return new Date(dateStr + 'T00:00:00').toISOString();
          }
          const date = new Date(dateStr);
          return !isNaN(date.getTime()) ? date.toISOString() : null;
        } catch {
          return null;
        }
      };

      const payload = {
        // Personal Info (only fields that exist in database)
        EmployeeCode: formData.employeeCode?.trim() || null, // Auto-generated if null
        FirstName: formData.firstName?.trim() || "",
        LastName: formData.lastName?.trim() || "",
        DateOfBirth: dateOfBirth,
        Email: formData.email?.trim() || null,
        Phone: formData.phone?.trim() || null,
        // Employment Info
        HireDate: hireDate,
        DepartmentId: formData.departmentId ? parseInt(formData.departmentId, 10) : null,
        JobTitleId: formData.jobTitleId ? parseInt(formData.jobTitleId, 10) : null,
        ManagerId: formData.managerId ? parseInt(formData.managerId, 10) : null,
        EmploymentStatus: employmentStatusString,
        ProbationEndDate: formatDateForPayload(formData.probationEndDate),
        ContractEndDate: formatDateForPayload(formData.contractEndDate),
        // Legacy JSON fields (store additional data here)
        AddressJson: JSON.stringify({
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          district: formData.district,
          province: formData.province,
          mobileNumber: formData.mobileNumber,
          landlineNumber: formData.landlineNumber,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactRelationship: formData.emergencyContactRelationship,
          emergencyContactPhone: formData.emergencyContactPhone,
        }),
        DocumentsJson: formData.documentsJson || null,
        SalaryStructureJson: JSON.stringify({
          basicSalary: formData.basicSalary || 0,
          salaryGrade: formData.salaryGrade,
          attendanceAllowance: formData.attendanceAllowance || 0,
          transportAllowance: formData.transportAllowance || 0,
          professionalAllowance: formData.professionalAllowance || 0,
          mobileAllowance: formData.mobileAllowance || 0,
          otherAllowance: formData.otherAllowance || 0,
          otherAllowanceDescription: formData.otherAllowanceDescription,
          overtimeEligible: formData.overtimeEligible || false,
          payrollCycle: formData.payrollCycle || "Monthly",
          epfNumber: formData.epfNumber,
          etfNumber: formData.etfNumber,
          epfEmployeeContributionPercent: formData.epfEmployeeContributionPercent || 8,
          epfEmployerContributionPercent: formData.epfEmployerContributionPercent || 12,
          etfContributionPercent: formData.etfContributionPercent || 3,
          bankName: formData.bankName,
          bankCode: formData.bankCode,
          branchName: formData.branchName,
          branchCode: formData.branchCode,
          accountNumber: formData.accountNumber,
          accountType: formData.accountType || "Savings",
          paymentMode: formData.paymentMode || "Bank Transfer",
        }),
        Tags: JSON.stringify({
          fullName: formData.fullName,
          nameWithInitials: formData.nameWithInitials,
          nic: formData.nic,
          passportNo: formData.passportNo,
          gender: formData.gender,
          maritalStatus: formData.maritalStatus,
          dependentsCount: formData.dependentsCount,
          employmentType: formData.employmentType,
          location: formData.location,
          probationStartDate: formData.probationStartDate,
          status: formData.status,
          profilePhotoUrl: formData.profilePhotoUrl,
          appointmentLetterUrl: formData.appointmentLetterUrl,
          workScheduleId: formData.workScheduleId,
          dateJoined: formData.dateJoined,
        }),
      };

      // For updates, include Id in the payload
      if (formMode === "edit" && formData.id) {
        payload.Id = parseInt(formData.id, 10);
      }
      
      const url = formMode === "add"
        ? `${BASE_URL}/hr/employees`
        : `${BASE_URL}/hr/employees/${formData.id}`;
      const method = formMode === "add" ? "POST" : "PUT";

      console.log("Sending request:", { url, method, payload });
      
      const response = await fetch(url, {
        method,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      console.log("Response received:", { status: response.status, ok: response.ok });

      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        let errorMessage = "Failed to save employee";
        
        if (responseData.errors) {
          // Handle validation errors
          const errorMessages = [];
          Object.keys(responseData.errors).forEach(key => {
            if (Array.isArray(responseData.errors[key])) {
              errorMessages.push(...responseData.errors[key]);
            } else {
              errorMessages.push(responseData.errors[key]);
            }
          });
          errorMessage = errorMessages.join(", ") || errorMessage;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.title) {
          errorMessage = responseData.title;
        }
        
        throw new Error(errorMessage);
      }

      // Check if the response indicates success
      if (responseData.statusCode && responseData.statusCode !== 200) {
        throw new Error(responseData.message || "Failed to save employee");
      }

      if (responseData.status && responseData.status !== "SUCCESS") {
        throw new Error(responseData.message || "Failed to save employee");
      }

      setFormOpen(false);
      toast.success(formMode === "add" ? "Employee created successfully!" : "Employee updated successfully!");
      
      // Reload the employee list instead of full page reload
      const reloadOrgId = getOrgId();
      const skip = (page - 1) * pageSize;
      let query = `${BASE_URL}/hr/employees?OrgId=${reloadOrgId || 0}&SkipCount=${skip}&MaxResultCount=${pageSize}`;
      
      if (search) {
        query += `&Search=${encodeURIComponent(search)}`;
      }
      
      if (departmentFilter) {
        query += `&DepartmentId=${departmentFilter}`;
      }
      
      if (statusFilter) {
        query += `&EmploymentStatus=${encodeURIComponent(statusFilter)}`;
      }

      // Reload the employee list
      try {
        const reloadResponse = await fetch(query, { headers });
        if (reloadResponse.ok) {
          const reloadData = parsePagedResponse(await reloadResponse.json());
          const reloadedProfiles = reloadData.items ?? [];
          // Normalize data to have both camelCase and PascalCase properties
          const normalizedReloadedProfiles = reloadedProfiles.map(emp => {
            // Parse Tags JSON to extract location if it's stored there
            let tagsData = {};
            try {
              if (emp.tags || emp.Tags) {
                const tagsStr = emp.tags || emp.Tags;
                if (tagsStr && typeof tagsStr === 'string') {
                  tagsData = JSON.parse(tagsStr);
                }
              }
            } catch (e) {
              // Silently fail - tags might not be valid JSON
            }
            
            // Get location from Tags JSON or direct properties (same as handleEdit)
            const locationFromTags = tagsData.location || tagsData.Location;
            const locationFromDirect = emp.location ?? emp.Location;
            const location = locationFromTags ?? locationFromDirect ?? null;
            
            // Get employmentType from Tags JSON or direct properties (same as handleEdit)
            // Use || instead of ?? to handle empty strings
            const employmentTypeFromTags = tagsData.employmentType || tagsData.EmploymentType || tagsData.employment_type;
            const employmentTypeFromDirect = emp.employmentType || emp.EmploymentType;
            const employmentType = employmentTypeFromTags || employmentTypeFromDirect || null;
            
            return {
              ...emp,
              // Ensure both camelCase and PascalCase for IDs (preserve existing, add missing)
              departmentId: emp.departmentId ?? emp.DepartmentId ?? null,
              DepartmentId: emp.DepartmentId ?? emp.departmentId ?? null,
              jobTitleId: emp.jobTitleId ?? emp.JobTitleId ?? null,
              JobTitleId: emp.JobTitleId ?? emp.jobTitleId ?? null,
              // Extract location from Tags JSON if not in direct properties
              location: location,
              Location: location,
              // Extract employmentType from Tags JSON if not in direct properties
              employmentType: employmentType,
              EmploymentType: employmentType,
              // Ensure names are available if provided
              departmentName: emp.departmentName ?? emp.DepartmentName ?? null,
              DepartmentName: emp.DepartmentName ?? emp.departmentName ?? null,
              jobTitleName: emp.jobTitleName ?? emp.JobTitleName ?? null,
              JobTitleName: emp.JobTitleName ?? emp.jobTitleName ?? null,
            };
          });
          setEmployeeProfiles(normalizedReloadedProfiles);
          setTotalCount(reloadData.totalCount ?? 0);
        }
      } catch (reloadError) {
        console.error("Error reloading employee list:", reloadError);
        // Fallback to page reload if API reload fails
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      toast.error(error.message || "Failed to save employee");
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
      
      const response = await fetch(`${BASE_URL}/hr/employees/${selectedItem.id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete employee");
      }

      setDeleteDialogOpen(false);
      setSelectedItem(null);
      
      toast.success("Employee deleted successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error(error.message || "Failed to delete employee");
    }
  };

  const handleMetricCardClick = (statusLabel) => {
    // Filter employees by the selected status
    const filtered = employeeProfiles.filter(emp => {
      const status = emp.employmentStatus !== undefined ? emp.employmentStatus : (emp.EmploymentStatus !== undefined ? emp.EmploymentStatus : null);
      const mappedStatus = mapEnumToFormStatus(status);
      return mappedStatus === statusLabel;
    });
    
    setFilteredEmployees(filtered);
    setFilteredEmployeesTitle(`${statusLabel} Employees`);
    setFilteredEmployeesDialogOpen(true);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Employee Directory</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
              @page { margin: 1cm; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Employee Directory</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Emp No</th>
                <th>Name</th>
                <th>Dept</th>
                <th>Employment Type</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${employeeProfiles.map(emp => `
                <tr>
                  <td>${emp.employeeCode || emp.EmployeeCode || "-"}</td>
                  <td>${emp.fullName || emp.FullName || [emp.firstName || emp.FirstName, emp.lastName || emp.LastName].filter(Boolean).join(" ") || "-"}</td>
                  <td>${emp.departmentName || emp.DepartmentName || "-"}</td>
                  <td>${(() => {
                    let tagsData = {};
                    try {
                      if (emp.tags || emp.Tags) {
                        tagsData = JSON.parse(emp.tags || emp.Tags);
                      }
                    } catch (e) {}
                    return tagsData.employmentType || tagsData.EmploymentType || emp.employmentType || emp.EmploymentType || "-";
                  })()}</td>
                  <td>${emp.location || emp.Location || "-"}</td>
                  <td>${emp.status || emp.Status || emp.employmentStatus || emp.EmploymentStatus || "-"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleExport = async () => {
    try {
      const orgId = getOrgId();
      const headers = createAuthHeaders();

      // Build query params for export
      const queryParams = new URLSearchParams({
        orgId: (orgId || 0).toString(),
        skipCount: "0",
        maxResultCount: totalCount.toString(),
        ...(search && { search }),
        ...(departmentFilter && { departmentId: departmentFilter }),
        ...(employmentTypeFilter && { employmentType: employmentTypeFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`${BASE_URL}/hr/employees?${queryParams}`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        const profiles = data.items || data.Items || [];

        // Generate CSV
        const csvHeaders = ["Employee No", "Name", "Dept", "Employment Type", "Location", "Status", "Email", "Mobile", "NIC", "Date Joined"];
        const csvRows = profiles.map(emp => {
          // Parse Tags JSON to get employmentType
          let tagsData = {};
          try {
            if (emp.tags || emp.Tags) {
              tagsData = JSON.parse(emp.tags || emp.Tags);
            }
          } catch (e) {}
          const employmentType = tagsData.employmentType || tagsData.EmploymentType || emp.employmentType || emp.EmploymentType || "";
          
          return [
            emp.employeeCode || emp.EmployeeCode || "",
            emp.fullName || emp.FullName || [emp.firstName || emp.FirstName, emp.lastName || emp.LastName].filter(Boolean).join(" "),
            emp.departmentName || emp.DepartmentName || "",
            employmentType,
            emp.location || emp.Location || "",
            emp.status || emp.Status || emp.employmentStatus || emp.EmploymentStatus || "",
            emp.email || emp.Email || "",
            emp.mobileNumber || emp.MobileNumber || emp.phone || emp.Phone || "",
            emp.nic || emp.NIC || "",
            emp.dateJoined || emp.DateJoined || emp.hireDate || emp.HireDate || "",
          ];
        });

        const csvContent = [
          csvHeaders.join(","),
          ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        // Download CSV
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Employees_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success("Export completed successfully");
      } else {
        toast.error("Failed to export employees");
      }
    } catch (error) {
      console.error("Error exporting employees:", error);
      toast.error("Error exporting employees");
    }
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className={styles.pageTitle}>
        <h1>Employee Lifecycle</h1>
        <ul>
          <li>
            <Link href="/hr/employee-lifecycle/">Employee Lifecycle</Link>
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
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Employees"
                value={statusCounts.Total}
                subtitle="All employees in system"
                icon={<PeopleIcon />}
                color="primary"
                onClick={() => {
                  setFilteredEmployees(employeeProfiles);
                  setFilteredEmployeesTitle("All Employees");
                  setFilteredEmployeesDialogOpen(true);
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Draft"
                value={statusCounts.Draft}
                subtitle="Draft employees"
                icon={<EditNoteIcon />}
                color="info"
                onClick={() => handleMetricCardClick("Draft")}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Active"
                value={statusCounts.Active}
                subtitle="Currently active"
                icon={<CheckCircleIcon />}
                color="success"
                onClick={() => handleMetricCardClick("Active")}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Probation"
                value={statusCounts.Probation}
                subtitle="Under probation period"
                icon={<HourglassEmptyIcon />}
                color="warning"
                onClick={() => handleMetricCardClick("Probation")}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Suspended"
                value={statusCounts.Suspended}
                subtitle="Suspended employees"
                icon={<BlockIcon />}
                color="error"
                onClick={() => handleMetricCardClick("Suspended")}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Terminated"
                value={statusCounts.Terminated}
                subtitle="Terminated employees"
                icon={<CancelIcon />}
                color="error"
                onClick={() => handleMetricCardClick("Terminated")}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Resigned"
                value={statusCounts.Resigned}
                subtitle="Resigned employees"
                icon={<ExitToAppIcon />}
                color="secondary"
                onClick={() => handleMetricCardClick("Resigned")}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Retired"
                value={statusCounts.Retired}
                subtitle="Retired employees"
                icon={<SchoolIcon />}
                color="info"
                onClick={() => handleMetricCardClick("Retired")}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Alumni"
                value={statusCounts.Alumni}
                subtitle="Alumni employees"
                icon={<PeopleIcon />}
                color="info"
                onClick={() => handleMetricCardClick("Alumni")}
              />
            </Grid>
          </Grid>

          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
                Employee Directory
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExport}
                  size="small"
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => toast.info("Bulk upload feature coming soon")}
                  size="small"
                >
                  Bulk Upload
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={handlePrint}
                  size="small"
                >
                  Print
                </Button>
                <AddButton
                  label="Add Employee"
                  onClick={() => {
                    handleAdd();
                  }}
                />
              </Box>
            </Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <ModernSearch
                  placeholder="Search by name, NIC, or employee number..."
                  value={search}
                  onChange={handleSearchChange}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <ModernFilter
                  label="Department"
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    setPage(1);
                  }}
                  options={[
                    { value: "", label: "All Departments" },
                    ...departments.map((dept) => ({
                      value: String(dept.id || dept.Id),
                      label: dept.name || dept.Name,
                    })),
                  ]}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <ModernFilter
                  label="Employment Type"
                  value={employmentTypeFilter}
                  onChange={(e) => {
                    setEmploymentTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  options={[
                    { value: "", label: "All Types" },
                    { value: "Permanent", label: "Permanent" },
                    { value: "Contract", label: "Contract" },
                    { value: "Casual", label: "Casual" },
                    { value: "Trainee", label: "Trainee" },
                  ]}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <ModernFilter
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  options={[
                    { value: "", label: "All Statuses" },
                    { value: "Active", label: "Active" },
                    { value: "Resigned", label: "Resigned" },
                    { value: "On Leave", label: "On Leave" },
                    ...Object.keys(EMPLOYMENT_STATUS_LABELS).map((status) => ({
                      value: status,
                      label: EMPLOYMENT_STATUS_LABELS[status],
                    })),
                  ]}
                />
              </Grid>
            </Grid>

            <ModernTable
              columns={[
                {
                  id: "profilePhoto",
                  label: "",
                  render: (value, row) => {
                    let tagsData = {};
                    try {
                      if (row.tags || row.Tags) {
                        tagsData = JSON.parse(row.tags || row.Tags);
                      }
                    } catch (e) {}
                    
                    const photoUrl = tagsData.profilePhotoUrl || row.profilePhotoUrl || row.ProfilePhotoUrl;
                    const fullName = tagsData.fullName || row.fullName || row.FullName || [row.firstName, row.lastName].filter(Boolean).join(" ");
                    
                    return (
                      <Avatar
                        src={photoUrl}
                        alt={fullName}
                        sx={{ width: 40, height: 40 }}
                      >
                        {(fullName || "E").charAt(0).toUpperCase()}
                      </Avatar>
                    );
                  },
                },
                { 
                  id: "employeeCode", 
                  label: "Emp No",
                  render: (value) => value || "-"
                },
                {
                  id: "name",
                  label: "Name",
                  render: (_, row) => {
                    let tagsData = {};
                    try {
                      if (row.tags || row.Tags) {
                        tagsData = JSON.parse(row.tags || row.Tags);
                      }
                    } catch (e) {}
                    return tagsData.fullName || row.fullName || row.FullName || [row.firstName, row.lastName].filter(Boolean).join(" ") || "-";
                  },
                },
                { 
                  id: "departmentId", 
                  label: "Dept",
                  render: (value, row) => {
                    // First try to get from row (if API includes it)
                    if (row.departmentName || row.DepartmentName) {
                      return row.departmentName || row.DepartmentName;
                    }
                    // Get departmentId from row (handle both camelCase and PascalCase)
                    // value might be undefined if column.id doesn't match property name
                    const deptId = value ?? row.departmentId ?? row.DepartmentId;
                    // Otherwise, look it up from departments list
                    if (deptId != null && deptId !== "" && departments && departments.length > 0) {
                      const id = typeof deptId === 'number' ? deptId : parseInt(String(deptId), 10);
                      if (!isNaN(id) && id > 0) {
                        const dept = departments.find(d => {
                          const dId = d.id ?? d.Id ?? d.internalId ?? d.InternalId;
                          return dId != null && (dId === id || String(dId) === String(id));
                        });
                        if (dept) {
                          return dept.name ?? dept.Name ?? "-";
                        }
                      }
                    }
                    return "-";
                  }
                },
                { 
                  id: "employmentType", 
                  label: "Employment Type",
                  render: (value, row) => {
                    const empId = row.id || row.internalId || row.Id || row.InternalId;
                    
                    // Get Tags JSON from row or cache (same source as profile view)
                    const tagsStr = row.tags || row.Tags || employeeTagsCache[empId];
                    
                    // EXACT same logic as profile view (lines 2717-2741 and 2876)
                    // Parse Tags JSON exactly like profile view does
                    let tagsData = {};
                    try {
                      if (tagsStr) {
                        tagsData = JSON.parse(tagsStr);
                      }
                    } catch (e) {
                      console.error("Error parsing tags:", e);
                    }
                    
                    // Use EXACT same expression as profile view line 2876:
                    // tagsData.employmentType || selectedEmployeeProfile.employmentType || selectedEmployeeProfile.EmploymentType || "-"
                    const employmentType = tagsData.employmentType || row.employmentType || row.EmploymentType || "-";
                    
                    return employmentType;
                  }
                },
                { 
                  id: "location", 
                  label: "Location",
                  render: (value, row) => {
                    // Location is already extracted from Tags JSON during normalization
                    // Check all possible sources (value from column.id, direct properties, Tags JSON as fallback)
                    let location = value ?? row.location ?? row.Location;
                    
                    // If still not found, try parsing Tags JSON as fallback
                    if (!location || location === "" || location === "null") {
                      try {
                        if (row.tags || row.Tags) {
                          const tagsStr = row.tags || row.Tags;
                          if (tagsStr && typeof tagsStr === 'string') {
                            const tagsData = JSON.parse(tagsStr);
                            location = tagsData.location || tagsData.Location || null;
                          }
                        }
                      } catch (e) {
                        // Silently fail
                      }
                    }
                    
                    // Return location if valid, otherwise "-"
                    if (location != null && location !== "" && location !== "null" && String(location).trim() !== "") {
                      return String(location).trim();
                    }
                    
                    return "-";
                  }
                },
                {
                  id: "status",
                  label: "Status",
                  render: (value, row) => {
                    const statusValue = row.status || row.Status || row.employmentStatus || row.EmploymentStatus || value;
                    const statusLabel = statusValue === "Active" || statusValue === 1 || statusValue === "1" 
                      ? "Active" 
                      : statusValue === "Resigned" || statusValue === 5 || statusValue === "5"
                      ? "Resigned"
                      : statusValue === "On Leave"
                      ? "On Leave"
                      : EMPLOYMENT_STATUS_LABELS[statusValue] || statusValue || "-";
                    
                    return (
                      <Chip
                        label={statusLabel}
                        size="small"
                        color={
                          statusValue === "Active" || statusValue === 1 || statusValue === "1"
                            ? "success"
                            : statusValue === "Resigned" || statusValue === 5 || statusValue === "5"
                            ? "error"
                            : statusValue === "On Leave"
                            ? "warning"
                            : statusValue === 2 || statusValue === "Probation" || statusValue === "2"
                            ? "warning"
                            : "default"
                        }
                        sx={{ fontWeight: 600 }}
                      />
                    );
                  },
                },
                {
                  id: "actions",
                  label: "Actions",
                  align: "center",
                  render: (_, row) => (
                    <Box display="flex" gap={1} justifyContent="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewProfile(row)}
                      >
                        View
                      </Button>
                      <ActionButtons
                        onEdit={() => handleEdit(row)}
                        onDelete={() => handleDelete(row)}
                      />
                    </Box>
                  ),
                },
              ]}
              rows={employeeProfiles.map((profile) => ({
                id: profile.id || profile.internalId,
                employeeCode: profile.employeeCode || profile.EmployeeCode || "-",
                firstName: profile.firstName || profile.FirstName,
                lastName: profile.lastName || profile.LastName,
                fullName: profile.fullName || profile.FullName,
                email: profile.email || profile.Email || "-",
                phone: profile.phone || profile.Phone || "-",
                departmentId: profile.departmentId || profile.DepartmentId || "-",
                departmentName: profile.departmentName || profile.DepartmentName,
                jobTitleId: profile.jobTitleId || profile.JobTitleId || "-",
                jobTitleName: profile.jobTitleName || profile.JobTitleName,
                location: profile.location || profile.Location,
                status: profile.status || profile.Status,
                employmentStatus: profile.employmentStatus || profile.EmploymentStatus,
                hireDate: profile.hireDate || profile.HireDate,
                profilePhotoUrl: profile.profilePhotoUrl || profile.ProfilePhotoUrl,
              }))}
              emptyMessage="No employee profiles found"
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
              Showing {employeeProfiles.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(page * pageSize, totalCount)} of {totalCount} employees
            </Typography>
          </Box>

          <ConfirmDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSelectedItem(null);
            }}
            onConfirm={confirmDelete}
            title="Delete Employee"
            message={`Are you sure you want to delete "${selectedItem?.firstName || ''} ${selectedItem?.lastName || ''}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            confirmColor="error"
          />

          <FormDialog
            open={formOpen}
            onClose={() => {
              setFormOpen(false);
              setFormStep(0);
            }}
            title={formMode === "add" ? "Add Employee" : "Edit Employee"}
            onSubmit={handleFormSubmit}
            submitLabel={formMode === "add" ? "Create" : "Update"}
            loading={formLoading}
            maxWidth="lg"
            customActions={
              <Box display="flex" gap={1} justifyContent="space-between" width="100%">
                <Button onClick={() => {
                  setFormOpen(false);
                  setFormStep(0);
                }} disabled={formLoading}>
                  Cancel
                </Button>
                <Box display="flex" gap={1}>
                  {formMode === "edit" ? (
                    // In edit mode, show only Update button
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        handleFormSubmit(e);
                      }}
                      variant="contained"
                      disabled={formLoading}
                      sx={{ minWidth: 100 }}
                    >
                      {formLoading ? "Saving..." : "Update"}
                    </Button>
                  ) : (
                    // In add mode, show stepper navigation
                    <>
                      {formStep > 0 && (
                        <Button onClick={() => setFormStep(formStep - 1)} variant="outlined" disabled={formLoading}>
                          Previous
                        </Button>
                      )}
                      {formStep < 5 ? (
                        <Button onClick={() => setFormStep(formStep + 1)} variant="contained" disabled={formLoading}>
                          Next
                        </Button>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            handleFormSubmit(e);
                          }}
                          variant="contained"
                          disabled={formLoading}
                          sx={{ minWidth: 100 }}
                        >
                          {formLoading ? "Saving..." : "Create"}
                        </Button>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            }
          >
            {formMode === "add" && (
              <Box sx={{ mb: 3 }}>
                <Stepper activeStep={formStep} nonLinear>
                  <Step>
                    <StepLabel 
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setFormStep(0)}
                    >
                      Personal Info
                    </StepLabel>
                  </Step>
                  <Step>
                    <StepLabel 
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setFormStep(1)}
                    >
                      Employment Info
                    </StepLabel>
                  </Step>
                  <Step>
                    <StepLabel 
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setFormStep(2)}
                    >
                      Compensation
                    </StepLabel>
                  </Step>
                  <Step>
                    <StepLabel 
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setFormStep(3)}
                    >
                      Statutory
                    </StepLabel>
                  </Step>
                  <Step>
                    <StepLabel 
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setFormStep(4)}
                    >
                      Banking
                    </StepLabel>
                  </Step>
                  <Step>
                    <StepLabel 
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setFormStep(5)}
                    >
                      Documents
                    </StepLabel>
                  </Step>
                </Stepper>
              </Box>
            )}
            <Grid container spacing={2}>
              {(formStep === 0 || formMode === "edit") && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Personal Information</Typography>
                  </Grid>
              <FormField
                name="employeeCode"
                label="Employee Code (Auto-generated if empty)"
                value={formData.employeeCode}
                onChange={handleFormChange}
                helperText="Leave empty to auto-generate"
              />
              <FormField
                name="firstName"
                label="First Name *"
                value={formData.firstName}
                onChange={handleFormChange}
                required
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
              />
              <FormField
                name="lastName"
                label="Last Name *"
                value={formData.lastName}
                onChange={handleFormChange}
                required
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
              />
              <FormField
                name="fullName"
                label="Full Name"
                value={formData.fullName}
                onChange={handleFormChange}
              />
              <FormField
                name="nameWithInitials"
                label="Name with Initials"
                value={formData.nameWithInitials}
                onChange={handleFormChange}
              />
              <FormField
                name="nic"
                label="NIC *"
                value={formData.nic}
                onChange={handleFormChange}
                required
                error={!!formErrors.nic}
                helperText={formErrors.nic || "Enter NIC number (old: 9 digits + V, new: 12 digits)"}
              />
              <FormField
                name="passportNo"
                label="Passport No"
                value={formData.passportNo}
                onChange={handleFormChange}
              />
              <FormField
                name="dateOfBirth"
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleFormChange}
              />
              <FormField
                name="gender"
                label="Gender"
                type="select"
                value={formData.gender}
                onChange={handleFormChange}
                options={[
                  { value: "", label: "Select Gender" },
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                  { value: "Other", label: "Other" },
                ]}
              />
              <FormField
                name="maritalStatus"
                label="Marital Status"
                type="select"
                value={formData.maritalStatus}
                onChange={handleFormChange}
                options={[
                  { value: "", label: "Select Status" },
                  { value: "Single", label: "Single" },
                  { value: "Married", label: "Married" },
                  { value: "Divorced", label: "Divorced" },
                  { value: "Widowed", label: "Widowed" },
                ]}
              />
              <FormField
                name="dependentsCount"
                label="Dependents Count"
                type="number"
                value={formData.dependentsCount}
                onChange={handleFormChange}
              />
              <FormField
                name="mobileNumber"
                label="Mobile Number *"
                value={formData.mobileNumber}
                onChange={handleFormChange}
                required
              />
              <FormField
                name="landlineNumber"
                label="Landline Number"
                value={formData.landlineNumber}
                onChange={handleFormChange}
              />
              <FormField
                name="email"
                label="Email *"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                required
              />
              <FormField
                name="phone"
                label="Phone"
                value={formData.phone}
                onChange={handleFormChange}
              />
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Address</Typography>
              </Grid>
              <FormField
                name="addressLine1"
                label="Address Line 1"
                value={formData.addressLine1}
                onChange={handleFormChange}
              />
              <FormField
                name="addressLine2"
                label="Address Line 2"
                value={formData.addressLine2}
                onChange={handleFormChange}
              />
              <FormField
                name="city"
                label="City"
                value={formData.city}
                onChange={handleFormChange}
              />
              <FormField
                name="district"
                label="District"
                type="select"
                value={formData.district}
                onChange={handleFormChange}
                options={[
                  { value: "", label: "Select District" },
                  { value: "Colombo", label: "Colombo" },
                  { value: "Gampaha", label: "Gampaha" },
                  { value: "Kalutara", label: "Kalutara" },
                  { value: "Kandy", label: "Kandy" },
                  { value: "Matale", label: "Matale" },
                  { value: "Nuwara Eliya", label: "Nuwara Eliya" },
                  { value: "Galle", label: "Galle" },
                  { value: "Matara", label: "Matara" },
                  { value: "Hambantota", label: "Hambantota" },
                  { value: "Jaffna", label: "Jaffna" },
                  { value: "Kilinochchi", label: "Kilinochchi" },
                  { value: "Mannar", label: "Mannar" },
                  { value: "Mullaitivu", label: "Mullaitivu" },
                  { value: "Vavuniya", label: "Vavuniya" },
                  { value: "Batticaloa", label: "Batticaloa" },
                  { value: "Ampara", label: "Ampara" },
                  { value: "Trincomalee", label: "Trincomalee" },
                  { value: "Kurunegala", label: "Kurunegala" },
                  { value: "Puttalam", label: "Puttalam" },
                  { value: "Anuradhapura", label: "Anuradhapura" },
                  { value: "Polonnaruwa", label: "Polonnaruwa" },
                  { value: "Badulla", label: "Badulla" },
                  { value: "Moneragala", label: "Moneragala" },
                  { value: "Ratnapura", label: "Ratnapura" },
                  { value: "Kegalle", label: "Kegalle" },
                ]}
              />
              <FormField
                name="province"
                label="Province (Auto-filled)"
                value={formData.province}
                onChange={handleFormChange}
                disabled
              />
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Emergency Contact</Typography>
              </Grid>
              <FormField
                name="emergencyContactName"
                label="Emergency Contact Name"
                value={formData.emergencyContactName}
                onChange={handleFormChange}
              />
              <FormField
                name="emergencyContactRelationship"
                label="Relationship"
                value={formData.emergencyContactRelationship}
                onChange={handleFormChange}
              />
              <FormField
                name="emergencyContactPhone"
                label="Emergency Contact Phone"
                value={formData.emergencyContactPhone}
                onChange={handleFormChange}
              />
                </>
              )}
              {(formStep === 1 || formMode === "edit") && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Employment Information</Typography>
                  </Grid>
              <FormField
                name="hireDate"
                label="Date Joined *"
                type="date"
                value={formData.hireDate}
                onChange={handleFormChange}
                required
                error={!!formErrors.hireDate}
                helperText={formErrors.hireDate}
              />
              <FormField
                name="departmentId"
                label="Department"
                type="select"
                value={formData.departmentId || ""}
                onChange={handleFormChange}
                options={[
                  { value: "", label: "Select Department" },
                  ...departments.map(dept => ({
                    value: String(dept.id || dept.Id || dept.internalId || dept.InternalId),
                    label: dept.name || dept.Name || "-"
                  }))
                ]}
                xs={12}
              />
              <FormField
                name="location"
                label="Location"
                value={formData.location}
                onChange={handleFormChange}
              />
              <FormField
                name="employmentType"
                label="Employment Type *"
                type="select"
                value={formData.employmentType}
                onChange={handleFormChange}
                required
                options={[
                  { value: "Permanent", label: "Permanent" },
                  { value: "Contract", label: "Contract" },
                  { value: "Casual", label: "Casual" },
                  { value: "Trainee", label: "Trainee" },
                ]}
              />
              <FormField
                name="probationStartDate"
                label="Probation Start Date"
                type="date"
                value={formData.probationStartDate}
                onChange={handleFormChange}
              />
              <FormField
                name="probationEndDate"
                label="Probation End Date"
                type="date"
                value={formData.probationEndDate}
                onChange={handleFormChange}
              />
              <FormField
                name="probationStatus"
                label="Probation Status"
                type="select"
                value={formData.probationStatus}
                onChange={handleFormChange}
                options={[
                  { value: "", label: "Select Status" },
                  { value: "Ongoing", label: "Ongoing" },
                  { value: "Completed", label: "Completed" },
                ]}
              />
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Appointment Letter</Typography>
                <Box sx={{ border: "2px dashed", borderColor: "divider", borderRadius: 2, p: 2, textAlign: "center" }}>
                  <input
                    accept=".pdf"
                    style={{ display: "none" }}
                    id="appointment-letter-upload"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type !== "application/pdf") {
                          toast.error("Only PDF files are allowed for appointment letter");
                          return;
                        }
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error("File size must be less than 10MB");
                          return;
                        }
                        // In production, upload to S3 and get URL
                        // For now, store file reference
                        setFormData(prev => ({
                          ...prev,
                          appointmentLetterFile: file,
                          appointmentLetterUrl: file.name
                        }));
                        toast.success("Appointment letter selected. Upload will be processed on save.");
                      }
                    }}
                  />
                  <label htmlFor="appointment-letter-upload">
                    <Button variant="outlined" component="span" startIcon={<UploadIcon />} size="small">
                      Upload Appointment Letter (PDF)
                    </Button>
                  </label>
                  {formData.appointmentLetterUrl && (
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={formData.appointmentLetterUrl}
                        onDelete={() => {
                          setFormData(prev => ({
                            ...prev,
                            appointmentLetterFile: null,
                            appointmentLetterUrl: ""
                          }));
                        }}
                        size="small"
                      />
                    </Box>
                  )}
                </Box>
              </Grid>
              <FormField
                name="status"
                label="Status"
                type="select"
                value={formData.status}
                onChange={handleFormChange}
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Resigned", label: "Resigned" },
                  { value: "On Leave", label: "On Leave" },
                ]}
              />
              <FormField
                name="employmentStatus"
                label="Employment Status"
                type="select"
                value={formData.employmentStatus}
                onChange={handleFormChange}
                options={[
                  { value: "Draft", label: "Draft" },
                  { value: "Active", label: "Active" },
                  { value: "Probation", label: "Probation" },
                  { value: "Suspended", label: "Suspended" },
                  { value: "Terminated", label: "Terminated" },
                  { value: "Resigned", label: "Resigned" },
                  { value: "Retired", label: "Retired" },
                  { value: "Alumni", label: "Alumni" },
                ]}
              />
                </>
              )}
              {(formStep === 2 || formMode === "edit") && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Compensation</Typography>
                  </Grid>
              <FormField
                name="basicSalary"
                label="Basic Salary"
                type="number"
                value={formData.basicSalary}
                onChange={handleFormChange}
              />
              <FormField
                name="attendanceAllowance"
                label="Attendance Allowance"
                type="number"
                value={formData.attendanceAllowance}
                onChange={handleFormChange}
              />
              <FormField
                name="transportAllowance"
                label="Transport Allowance"
                type="number"
                value={formData.transportAllowance}
                onChange={handleFormChange}
              />
              <FormField
                name="professionalAllowance"
                label="Professional Allowance"
                type="number"
                value={formData.professionalAllowance}
                onChange={handleFormChange}
              />
              <FormField
                name="mobileAllowance"
                label="Mobile Allowance"
                type="number"
                value={formData.mobileAllowance}
                onChange={handleFormChange}
              />
              <FormField
                name="payrollCycle"
                label="Payroll Cycle"
                type="select"
                value={formData.payrollCycle}
                onChange={handleFormChange}
                options={[
                  { value: "Monthly", label: "Monthly" },
                  { value: "Weekly", label: "Weekly" },
                ]}
              />
                </>
              )}
              {(formStep === 3 || formMode === "edit") && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Statutory Information</Typography>
                  </Grid>
              <FormField
                name="epfNumber"
                label="EPF Number"
                value={formData.epfNumber}
                onChange={handleFormChange}
              />
              <FormField
                name="etfNumber"
                label="ETF Number"
                value={formData.etfNumber}
                onChange={handleFormChange}
              />
              <FormField
                name="epfEmployeeContributionPercent"
                label="EPF Employee %"
                type="number"
                value={formData.epfEmployeeContributionPercent}
                onChange={handleFormChange}
              />
              <FormField
                name="epfEmployerContributionPercent"
                label="EPF Employer %"
                type="number"
                value={formData.epfEmployerContributionPercent}
                onChange={handleFormChange}
              />
              <FormField
                name="etfContributionPercent"
                label="ETF Contribution %"
                type="number"
                value={formData.etfContributionPercent}
                onChange={handleFormChange}
              />
                </>
              )}
              {(formStep === 4 || formMode === "edit") && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Banking & Payment</Typography>
                  </Grid>
              <FormField
                name="bankName"
                label="Bank Name"
                type="select"
                value={formData.bankName}
                onChange={handleFormChange}
                options={[
                  { value: "", label: "Select Bank" },
                  { value: "Bank of Ceylon", label: "Bank of Ceylon" },
                  { value: "People's Bank", label: "People's Bank" },
                  { value: "Sampath Bank", label: "Sampath Bank" },
                  { value: "Commercial Bank", label: "Commercial Bank" },
                  { value: "Hatton National Bank", label: "Hatton National Bank" },
                  { value: "NDB Bank", label: "NDB Bank" },
                  { value: "DFCC Bank", label: "DFCC Bank" },
                  { value: "National Savings Bank", label: "National Savings Bank" },
                  { value: "Seylan Bank", label: "Seylan Bank" },
                ]}
              />
              <FormField
                name="branchName"
                label="Branch Name"
                value={formData.branchName}
                onChange={handleFormChange}
              />
              <FormField
                name="accountNumber"
                label="Account Number"
                value={formData.accountNumber}
                onChange={handleFormChange}
              />
              <FormField
                name="accountType"
                label="Account Type"
                type="select"
                value={formData.accountType}
                onChange={handleFormChange}
                options={[
                  { value: "Savings", label: "Savings" },
                  { value: "Current", label: "Current" },
                ]}
              />
              <FormField
                name="paymentMode"
                label="Payment Mode"
                type="select"
                value={formData.paymentMode}
                onChange={handleFormChange}
                options={[
                  { value: "Bank Transfer", label: "Bank Transfer" },
                  { value: "Cash", label: "Cash" },
                  { value: "Cheque", label: "Cheque" },
                ]}
              />
                </>
              )}
              {(formStep === 5 || formMode === "edit") && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Documents</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Upload employee documents (PDF, JPG, PNG - Max 10MB per file)
                    </Typography>
                    <Box sx={{ border: "2px dashed", borderColor: "divider", borderRadius: 2, p: 3, textAlign: "center" }}>
                      <input
                        accept=".pdf,.jpg,.jpeg,.png"
                        style={{ display: "none" }}
                        id="document-upload"
                        multiple
                        type="file"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const validFiles = files.filter(file => {
                            const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
                            const maxSize = 10 * 1024 * 1024; // 10MB
                            return validTypes.includes(file.type) && file.size <= maxSize;
                          });
                          
                          if (validFiles.length !== files.length) {
                            toast.warning("Some files were rejected. Only PDF, JPG, PNG files up to 10MB are allowed.");
                          }
                          
                          // Store file info in formData
                          const documentData = validFiles.map(file => ({
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            // In production, upload to S3 and store URL
                            // For now, store as base64 or file reference
                          }));
                          
                          setFormData(prev => ({
                            ...prev,
                            documents: [...(prev.documents || []), ...validFiles],
                            documentsJson: JSON.stringify(documentData)
                          }));
                        }}
                      />
                      <label htmlFor="document-upload">
                        <Button variant="outlined" component="span" startIcon={<UploadIcon />}>
                          Upload Documents
                        </Button>
                      </label>
                      {formData.documents && formData.documents.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>Uploaded Documents:</Typography>
                          {formData.documents.map((file, idx) => (
                            <Chip
                              key={idx}
                              label={file.name}
                              onDelete={() => {
                                const newDocs = formData.documents.filter((_, i) => i !== idx);
                                setFormData(prev => ({
                                  ...prev,
                                  documents: newDocs,
                                  documentsJson: newDocs.length > 0 ? JSON.stringify(newDocs.map(f => ({ name: f.name, type: f.type, size: f.size }))) : null
                                }));
                              }}
                              sx={{ m: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}
                      <Box sx={{ mt: 2, textAlign: "left" }}>
                        <Typography variant="caption" color="text.secondary">
                          Required Documents:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                          <li>NIC (Front & Back)</li>
                          <li>CV</li>
                          <li>Education Certificates</li>
                          <li>Professional Certificates</li>
                          <li>Medical Reports</li>
                          <li>Police Report (Optional)</li>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </>
              )}
            </Grid>
          </FormDialog>

          {/* Employee Profile View Dialog */}
          <Dialog
            open={profileDialogOpen}
            onClose={() => {
              setProfileDialogOpen(false);
              setSelectedEmployeeProfile(null);
              setProfileTabValue(0);
            }}
            maxWidth="lg"
            fullWidth
          >
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Employee Profile</Typography>
                <Button onClick={() => {
                  if (selectedEmployeeProfile) {
                    handleEdit(selectedEmployeeProfile);
                    setProfileDialogOpen(false);
                  }
                }}>
                  Edit
                </Button>
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedEmployeeProfile && (() => {
                // Parse JSON fields
                let addressData = {};
                let salaryData = {};
                let tagsData = {};
                
                try {
                  if (selectedEmployeeProfile.addressJson || selectedEmployeeProfile.AddressJson) {
                    addressData = JSON.parse(selectedEmployeeProfile.addressJson || selectedEmployeeProfile.AddressJson);
                  }
                } catch (e) {
                  console.error("Error parsing addressJson:", e);
                }
                
                try {
                  if (selectedEmployeeProfile.salaryStructureJson || selectedEmployeeProfile.SalaryStructureJson) {
                    salaryData = JSON.parse(selectedEmployeeProfile.salaryStructureJson || selectedEmployeeProfile.SalaryStructureJson);
                  }
                } catch (e) {
                  console.error("Error parsing salaryStructureJson:", e);
                }
                
                try {
                  if (selectedEmployeeProfile.tags || selectedEmployeeProfile.Tags) {
                    tagsData = JSON.parse(selectedEmployeeProfile.tags || selectedEmployeeProfile.Tags);
                  }
                } catch (e) {
                  console.error("Error parsing tags:", e);
                }
                
                const fullName = tagsData.fullName || selectedEmployeeProfile.fullName || selectedEmployeeProfile.FullName || 
                  [selectedEmployeeProfile.firstName || selectedEmployeeProfile.FirstName, 
                   selectedEmployeeProfile.lastName || selectedEmployeeProfile.LastName].filter(Boolean).join(" ");
                
                return (
                <Grid container spacing={3}>
                  {/* Sidebar with Photo and Quick Details */}
                  <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Avatar
                        src={tagsData.profilePhotoUrl || selectedEmployeeProfile.profilePhotoUrl || selectedEmployeeProfile.ProfilePhotoUrl}
                        sx={{ width: 120, height: 120, mx: "auto", mb: 2 }}
                      >
                        {(fullName || "E").charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        {fullName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {selectedEmployeeProfile.employeeCode || selectedEmployeeProfile.EmployeeCode || "-"}
                      </Typography>
                      <Chip
                        label={tagsData.status || selectedEmployeeProfile.status || selectedEmployeeProfile.Status || "Active"}
                        color="success"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                      <Divider sx={{ my: 2 }} />
                      <Box textAlign="left">
                        <Typography variant="caption" color="text.secondary">Department</Typography>
                        <Typography variant="body2" gutterBottom>
                          {(() => {
                            // First try to get from profile (if API includes it)
                            if (selectedEmployeeProfile.departmentName || selectedEmployeeProfile.DepartmentName) {
                              return selectedEmployeeProfile.departmentName || selectedEmployeeProfile.DepartmentName;
                            }
                            // Otherwise, look it up from departments list
                            const deptId = selectedEmployeeProfile.departmentId ?? selectedEmployeeProfile.DepartmentId;
                            if (deptId != null && deptId !== "" && departments && departments.length > 0) {
                              const id = typeof deptId === 'number' ? deptId : parseInt(String(deptId), 10);
                              if (!isNaN(id) && id > 0) {
                                const dept = departments.find(d => {
                                  const dId = d.id ?? d.Id ?? d.internalId ?? d.InternalId;
                                  return dId != null && (dId === id || String(dId) === String(id));
                                });
                                if (dept) {
                                  return dept.name ?? dept.Name ?? "-";
                                }
                              }
                            }
                            return "-";
                          })()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Designation</Typography>
                        <Typography variant="body2" gutterBottom>
                          {(() => {
                            // First try to get from profile (if API includes it)
                            if (selectedEmployeeProfile.jobTitleName || selectedEmployeeProfile.JobTitleName) {
                              return selectedEmployeeProfile.jobTitleName || selectedEmployeeProfile.JobTitleName;
                            }
                            // Otherwise, look it up from job titles list
                            const jobTitleId = selectedEmployeeProfile.jobTitleId ?? selectedEmployeeProfile.JobTitleId;
                            if (jobTitleId != null && jobTitleId !== "" && jobTitles && jobTitles.length > 0) {
                              const id = typeof jobTitleId === 'number' ? jobTitleId : parseInt(String(jobTitleId), 10);
                              if (!isNaN(id) && id > 0) {
                                const jobTitle = jobTitles.find(jt => {
                                  const jtId = jt.id ?? jt.Id ?? jt.internalId ?? jt.InternalId;
                                  return jtId != null && (jtId === id || String(jtId) === String(id));
                                });
                                if (jobTitle) {
                                  return jobTitle.name ?? jobTitle.Name ?? "-";
                                }
                              }
                            }
                            return "-";
                          })()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Location</Typography>
                        <Typography variant="body2" gutterBottom>
                          {tagsData.location || selectedEmployeeProfile.location || selectedEmployeeProfile.Location || "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Email</Typography>
                        <Typography variant="body2" gutterBottom>
                          {selectedEmployeeProfile.email || selectedEmployeeProfile.Email || "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Mobile</Typography>
                        <Typography variant="body2">
                          {addressData.mobileNumber || selectedEmployeeProfile.mobileNumber || selectedEmployeeProfile.MobileNumber || "-"}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Main Content with Tabs */}
                  <Grid item xs={12} md={9}>
                    <Tabs value={profileTabValue} onChange={(e, newValue) => setProfileTabValue(newValue)}>
                      <Tab label="Personal Info" />
                      <Tab label="Employment" />
                      <Tab label="Compensation" />
                      <Tab label="Statutory" />
                      <Tab label="Banking" />
                      <Tab label="History" />
                      <Tab label="Documents" />
                    </Tabs>
                    
                    <Box sx={{ mt: 3 }}>
                      {profileTabValue === 0 && (
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Full Name:</Typography> <Typography>{fullName || "-"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Name with Initials:</Typography> <Typography>{tagsData.nameWithInitials || selectedEmployeeProfile.nameWithInitials || selectedEmployeeProfile.NameWithInitials || "-"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">NIC:</Typography> <Typography>{tagsData.nic || selectedEmployeeProfile.nic || selectedEmployeeProfile.NIC || "-"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Passport No:</Typography> <Typography>{tagsData.passportNo || selectedEmployeeProfile.passportNo || selectedEmployeeProfile.PassportNo || "-"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Date of Birth:</Typography> <Typography>{formatDate(selectedEmployeeProfile.dateOfBirth || selectedEmployeeProfile.DateOfBirth)}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Gender:</Typography> <Typography>{tagsData.gender || selectedEmployeeProfile.gender || selectedEmployeeProfile.Gender || "-"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Marital Status:</Typography> <Typography>{tagsData.maritalStatus || selectedEmployeeProfile.maritalStatus || selectedEmployeeProfile.MaritalStatus || "-"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Dependents Count (for EPF/ETF):</Typography> <Typography>{tagsData.dependentsCount || selectedEmployeeProfile.dependentsCount || selectedEmployeeProfile.DependentsCount || 0}</Typography></Grid>
                          <Grid item xs={12}><Typography variant="subtitle2">Sri Lankan Address:</Typography> 
                            <Typography>
                              {[
                                addressData.addressLine1 || selectedEmployeeProfile.addressLine1 || selectedEmployeeProfile.AddressLine1,
                                addressData.addressLine2 || selectedEmployeeProfile.addressLine2 || selectedEmployeeProfile.AddressLine2,
                                addressData.city || selectedEmployeeProfile.city || selectedEmployeeProfile.City,
                                addressData.district || selectedEmployeeProfile.district || selectedEmployeeProfile.District,
                                addressData.province || selectedEmployeeProfile.province || selectedEmployeeProfile.Province
                              ].filter(Boolean).join(", ") || "-"}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}><Typography variant="subtitle2">Emergency Contact:</Typography> <Typography>{addressData.emergencyContactName || selectedEmployeeProfile.emergencyContactName || selectedEmployeeProfile.EmergencyContactName || "-"} ({addressData.emergencyContactRelationship || selectedEmployeeProfile.emergencyContactRelationship || selectedEmployeeProfile.EmergencyContactRelationship || "-"}) - {addressData.emergencyContactPhone || selectedEmployeeProfile.emergencyContactPhone || selectedEmployeeProfile.EmergencyContactPhone || "-"}</Typography></Grid>
                        </Grid>
                      )}
                      {profileTabValue === 1 && (
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Date Joined:</Typography> <Typography>{formatDate(tagsData.dateJoined || selectedEmployeeProfile.hireDate || selectedEmployeeProfile.HireDate)}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Employment Type:</Typography> <Typography>{tagsData.employmentType || selectedEmployeeProfile.employmentType || selectedEmployeeProfile.EmploymentType || "-"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Probation Start:</Typography> <Typography>{formatDate(tagsData.probationStartDate || selectedEmployeeProfile.probationStartDate || selectedEmployeeProfile.ProbationStartDate)}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Probation End:</Typography> <Typography>{formatDate(selectedEmployeeProfile.probationEndDate || selectedEmployeeProfile.ProbationEndDate)}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Contract End:</Typography> <Typography>{formatDate(selectedEmployeeProfile.contractEndDate || selectedEmployeeProfile.ContractEndDate)}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Work Schedule ID:</Typography> <Typography>{tagsData.workScheduleId || "-"}</Typography></Grid>
                        </Grid>
                      )}
                      {profileTabValue === 2 && (
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Basic Salary:</Typography> <Typography>LKR {salaryData.basicSalary || selectedEmployeeProfile.compensations?.[0]?.basicSalary || 0}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Salary Grade:</Typography> <Typography>{salaryData.salaryGrade || "-"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Attendance Allowance:</Typography> <Typography>LKR {salaryData.attendanceAllowance || 0}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Transport Allowance:</Typography> <Typography>LKR {salaryData.transportAllowance || 0}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Professional Allowance:</Typography> <Typography>LKR {salaryData.professionalAllowance || 0}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Mobile Allowance:</Typography> <Typography>LKR {salaryData.mobileAllowance || 0}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Other Allowance:</Typography> <Typography>LKR {salaryData.otherAllowance || 0}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Overtime Eligible:</Typography> <Typography>{salaryData.overtimeEligible ? "Yes" : "No"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Payroll Cycle:</Typography> <Typography>{salaryData.payrollCycle || selectedEmployeeProfile.compensations?.[0]?.payrollCycle || "-"}</Typography></Grid>
                        </Grid>
                      )}
                      {profileTabValue === 3 && (
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">EPF Number:</Typography> <Typography>{salaryData.epfNumber || selectedEmployeeProfile.statutoryInfos?.[0]?.epfNumber || selectedEmployeeProfile.statutoryInfos?.[0]?.EPFNumber || "-"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">ETF Number:</Typography> <Typography>{salaryData.etfNumber || selectedEmployeeProfile.statutoryInfos?.[0]?.etfNumber || selectedEmployeeProfile.statutoryInfos?.[0]?.ETFNumber || "-"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">EPF Employee Contribution %:</Typography> <Typography>{salaryData.epfEmployeeContributionPercent || selectedEmployeeProfile.statutoryInfos?.[0]?.epfEmployeeContribution || selectedEmployeeProfile.statutoryInfos?.[0]?.EPFEmployeeContribution || 8}%</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">EPF Employer Contribution %:</Typography> <Typography>{salaryData.epfEmployerContributionPercent || selectedEmployeeProfile.statutoryInfos?.[0]?.epfEmployerContribution || selectedEmployeeProfile.statutoryInfos?.[0]?.EPFEmployerContribution || 12}%</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">ETF Contribution %:</Typography> <Typography>{salaryData.etfContributionPercent || selectedEmployeeProfile.statutoryInfos?.[0]?.etfContribution || selectedEmployeeProfile.statutoryInfos?.[0]?.ETFContribution || 3}%</Typography></Grid>
                        </Grid>
                      )}
                      {profileTabValue === 4 && (
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Bank Name:</Typography> <Typography>{salaryData.bankName || selectedEmployeeProfile.bankDetails?.[0]?.bankName || selectedEmployeeProfile.bankDetails?.[0]?.BankName || "-"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Bank Code:</Typography> <Typography>{salaryData.bankCode || selectedEmployeeProfile.bankDetails?.[0]?.bankCode || selectedEmployeeProfile.bankDetails?.[0]?.BankCode || "-"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Branch:</Typography> <Typography>{salaryData.branchName || selectedEmployeeProfile.bankDetails?.[0]?.branchName || selectedEmployeeProfile.bankDetails?.[0]?.BranchName || "-"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Branch Code:</Typography> <Typography>{salaryData.branchCode || selectedEmployeeProfile.bankDetails?.[0]?.branchCode || selectedEmployeeProfile.bankDetails?.[0]?.BranchCode || "-"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Account Number:</Typography> <Typography>{salaryData.accountNumber || selectedEmployeeProfile.bankDetails?.[0]?.accountNumber || selectedEmployeeProfile.bankDetails?.[0]?.AccountNumber || "-"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Account Type:</Typography> <Typography>{salaryData.accountType || selectedEmployeeProfile.bankDetails?.[0]?.accountType || selectedEmployeeProfile.bankDetails?.[0]?.AccountType || "-"}</Typography></Grid>
                          <Grid item xs={12} sm={6}><Typography variant="subtitle2">Payment Mode:</Typography> <Typography>{salaryData.paymentMode || selectedEmployeeProfile.bankDetails?.[0]?.paymentMode || selectedEmployeeProfile.bankDetails?.[0]?.PaymentMode || "-"}</Typography></Grid>
                        </Grid>
                      )}
                      {profileTabValue === 5 && (
                        <Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">Employment History</Typography>
                            <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={() => {
                                setHistoryFormData({
                                  effectiveDate: "",
                                  remarks: "",
                                  oldJobTitleId: null,
                                  newJobTitleId: null,
                                  oldDepartmentId: null,
                                  newDepartmentId: null,
                                  oldSalary: "",
                                  newSalary: "",
                                  oldLocation: "",
                                  newLocation: "",
                                  actionType: "",
                                  actionDescription: "",
                                  oldBasicSalary: "",
                                  newBasicSalary: "",
                                  oldAllowances: "",
                                  newAllowances: "",
                                });
                                setHistoryEventType("Promotion");
                                setHistoryDialogOpen(true);
                              }}
                            >
                              Add History Event
                            </Button>
                          </Box>
                          {employmentTimeline && employmentTimeline.length > 0 ? (
                            employmentTimeline.map((event, idx) => {
                              const eventType = event.eventType || event.EventType;
                              const eventTypeName = eventType === 1 ? "Promotion" :
                                                   eventType === 2 ? "Transfer" :
                                                   eventType === 3 ? "Salary Revision" :
                                                   eventType === 9 ? "Disciplinary Action" :
                                                   eventType === 0 ? "Onboarded" :
                                                   eventType === 4 ? "Contract Renewal" :
                                                   eventType === 5 ? "Probation Complete" :
                                                   eventType === 6 ? "Exit Initiated" :
                                                   eventType === 7 ? "Exit Completed" :
                                                   eventType === 8 ? "Joined" : "Unknown";
                              
                              let oldValue = {};
                              let newValue = {};
                              try {
                                if (event.oldValueJson || event.OldValueJson) {
                                  oldValue = JSON.parse(event.oldValueJson || event.OldValueJson);
                                }
                                if (event.newValueJson || event.NewValueJson) {
                                  newValue = JSON.parse(event.newValueJson || event.NewValueJson);
                                }
                              } catch (e) {
                                // Failed to parse JSON
                              }
                              
                              return (
                                <Paper key={idx} sx={{ p: 2, mb: 2 }}>
                                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                                    <Box>
                                      <Typography variant="subtitle1" fontWeight="bold">
                                        {eventTypeName}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {formatDate(event.effectiveDate || event.EffectiveDate)}
                                      </Typography>
                                    </Box>
                                    {event.remarks || event.Remarks ? (
                                      <Chip label="Has Remarks" size="small" />
                                    ) : null}
                                  </Box>
                                  
                                  {eventType === 1 && ( // Promotion
                                    <Box mt={1}>
                                      {oldValue.jobTitleId && newValue.jobTitleId && (
                                        <Typography variant="body2">
                                          <strong>Job Title:</strong> {oldValue.jobTitleName || "N/A"} → {newValue.jobTitleName || "N/A"}
                                        </Typography>
                                      )}
                                      {oldValue.departmentId && newValue.departmentId && (
                                        <Typography variant="body2">
                                          <strong>Department:</strong> {oldValue.departmentName || "N/A"} → {newValue.departmentName || "N/A"}
                                        </Typography>
                                      )}
                                      {oldValue.salary && newValue.salary && (
                                        <Typography variant="body2">
                                          <strong>Salary:</strong> LKR {oldValue.salary} → LKR {newValue.salary}
                                        </Typography>
                                      )}
                                    </Box>
                                  )}
                                  
                                  {eventType === 2 && ( // Transfer
                                    <Box mt={1}>
                                      {oldValue.departmentId && newValue.departmentId && (
                                        <Typography variant="body2">
                                          <strong>Department:</strong> {oldValue.departmentName || "N/A"} → {newValue.departmentName || "N/A"}
                                        </Typography>
                                      )}
                                      {oldValue.location && newValue.location && (
                                        <Typography variant="body2">
                                          <strong>Location:</strong> {oldValue.location} → {newValue.location}
                                        </Typography>
                                      )}
                                    </Box>
                                  )}
                                  
                                  {eventType === 3 && ( // Salary Revision
                                    <Box mt={1}>
                                      {oldValue.basicSalary && newValue.basicSalary && (
                                        <Typography variant="body2">
                                          <strong>Basic Salary:</strong> LKR {oldValue.basicSalary} → LKR {newValue.basicSalary}
                                        </Typography>
                                      )}
                                      {oldValue.allowances && newValue.allowances && (
                                        <Typography variant="body2">
                                          <strong>Allowances:</strong> LKR {oldValue.allowances} → LKR {newValue.allowances}
                                        </Typography>
                                      )}
                                    </Box>
                                  )}
                                  
                                  {eventType === 9 && ( // Disciplinary Action
                                    <Box mt={1}>
                                      {newValue.actionType && (
                                        <Typography variant="body2">
                                          <strong>Action Type:</strong> {newValue.actionType}
                                        </Typography>
                                      )}
                                      {newValue.actionDescription && (
                                        <Typography variant="body2">
                                          <strong>Description:</strong> {newValue.actionDescription}
                                        </Typography>
                                      )}
                                    </Box>
                                  )}
                                  
                                  {event.remarks || event.Remarks ? (
                                    <Box mt={1}>
                                      <Typography variant="body2">
                                        <strong>Remarks:</strong> {event.remarks || event.Remarks}
                                      </Typography>
                                    </Box>
                                  ) : null}
                                </Paper>
                              );
                            })
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No history events found.
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
                );
              })()}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setProfileDialogOpen(false);
                setSelectedEmployeeProfile(null);
                setProfileTabValue(0);
              }}>
                Close
              </Button>
            </DialogActions>
          </Dialog>

          {/* Filtered Employees Dialog */}
          <FormDialog
            open={filteredEmployeesDialogOpen}
            onClose={() => {
              setFilteredEmployeesDialogOpen(false);
              setFilteredEmployees([]);
              setFilteredEmployeesTitle("");
            }}
            title={filteredEmployeesTitle}
            submitLabel="Close"
            onSubmit={(e) => {
              e.preventDefault();
              setFilteredEmployeesDialogOpen(false);
              setFilteredEmployees([]);
              setFilteredEmployeesTitle("");
            }}
            maxWidth="lg"
          >
            <ModernTable
              columns={[
                { id: "employeeCode", label: "Employee Code" },
                {
                  id: "name",
                  label: "Name",
                  render: (_, row) =>
                    [row.firstName, row.lastName].filter(Boolean).join(" ") || "-",
                },
                { id: "email", label: "Email" },
                { id: "phone", label: "Phone" },
                { id: "departmentId", label: "Department" },
                {
                  id: "employmentStatus",
                  label: "Status",
                  render: (value) => {
                    // Handle both numeric enum values and string values
                    const statusValue = value !== undefined && value !== null ? value : "";
                    const statusLabel = EMPLOYMENT_STATUS_LABELS[statusValue] || EMPLOYMENT_STATUS_LABELS[String(statusValue)] || statusValue || "-";
                    const numericValue = typeof statusValue === "number" ? statusValue : (typeof statusValue === "string" && !isNaN(statusValue) ? parseInt(statusValue, 10) : null);
                    
                    return (
                      <Chip
                        label={statusLabel}
                        size="small"
                        color={
                          statusValue === 1 || statusValue === "Active" || statusValue === "active" || statusValue === "1"
                            ? "success"
                            : statusValue === 2 || statusValue === "Probation" || statusValue === "probation" || statusValue === "2"
                            ? "warning"
                            : statusValue === 4 || statusValue === 5 || statusValue === "Terminated" || statusValue === "Resigned" || statusValue === "4" || statusValue === "5"
                            ? "error"
                            : "default"
                        }
                        sx={{ fontWeight: 600 }}
                      />
                    );
                  },
                },
                {
                  id: "hireDate",
                  label: "Hire Date",
                  render: (value) => formatDate(value),
                },
                {
                  id: "actions",
                  label: "Actions",
                  align: "center",
                  render: (_, row) => (
                    <ActionButtons
                      onEdit={() => {
                        setFilteredEmployeesDialogOpen(false);
                        handleEdit(row);
                      }}
                      onDelete={() => {
                        setFilteredEmployeesDialogOpen(false);
                        handleDelete(row);
                      }}
                    />
                  ),
                },
              ]}
              rows={filteredEmployees.map((profile) => ({
                id: profile.id || profile.internalId,
                employeeCode: profile.employeeCode || profile.EmployeeCode || "-",
                firstName: profile.firstName || profile.FirstName,
                lastName: profile.lastName || profile.LastName,
                fullName: profile.fullName || profile.FullName,
                email: profile.email || profile.Email || "-",
                phone: profile.phone || profile.Phone || "-",
                departmentId: profile.departmentId || profile.DepartmentId || "-",
                departmentName: profile.departmentName || profile.DepartmentName,
                jobTitleId: profile.jobTitleId || profile.JobTitleId || "-",
                jobTitleName: profile.jobTitleName || profile.JobTitleName,
                location: profile.location || profile.Location,
                status: profile.status || profile.Status,
                employmentStatus: profile.employmentStatus || profile.EmploymentStatus,
                hireDate: profile.hireDate || profile.HireDate,
                profilePhotoUrl: profile.profilePhotoUrl || profile.ProfilePhotoUrl,
              }))}
              emptyMessage={`No ${filteredEmployeesTitle.toLowerCase()} found.`}
            />
            </FormDialog>

          {/* History Event Dialog */}
          <Dialog
            open={historyDialogOpen}
            onClose={() => setHistoryDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Add {historyEventType === "Promotion" ? "Promotion" :
                   historyEventType === "Transfer" ? "Transfer" :
                   historyEventType === "DisciplinaryAction" ? "Disciplinary Action" :
                   historyEventType === "SalaryChange" ? "Salary Revision" : "History Event"}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Event Type</InputLabel>
                  <Select
                    value={historyEventType}
                    onChange={(e) => setHistoryEventType(e.target.value)}
                    label="Event Type"
                  >
                    <MenuItem value="Promotion">Promotion</MenuItem>
                    <MenuItem value="Transfer">Transfer</MenuItem>
                    <MenuItem value="DisciplinaryAction">Disciplinary Action</MenuItem>
                    <MenuItem value="SalaryChange">Salary Revision</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Effective Date"
                  type="date"
                  value={historyFormData.effectiveDate}
                  onChange={(e) => setHistoryFormData({ ...historyFormData, effectiveDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                  required
                />

                {historyEventType === "Promotion" && (
                  <>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Old Job Title</InputLabel>
                      <Select
                        value={historyFormData.oldJobTitleId || ""}
                        onChange={(e) => setHistoryFormData({ ...historyFormData, oldJobTitleId: e.target.value })}
                        label="Old Job Title"
                      >
                        <MenuItem value="">Select Job Title</MenuItem>
                        {jobTitles.map((jt) => (
                          <MenuItem key={jt.id || jt.Id || jt.internalId || jt.InternalId} value={jt.id || jt.Id || jt.internalId || jt.InternalId}>
                            {jt.name || jt.Name || "-"}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>New Job Title</InputLabel>
                      <Select
                        value={historyFormData.newJobTitleId || ""}
                        onChange={(e) => setHistoryFormData({ ...historyFormData, newJobTitleId: e.target.value })}
                        label="New Job Title"
                      >
                        <MenuItem value="">Select Job Title</MenuItem>
                        {jobTitles.map((jt) => (
                          <MenuItem key={jt.id || jt.Id || jt.internalId || jt.InternalId} value={jt.id || jt.Id || jt.internalId || jt.InternalId}>
                            {jt.name || jt.Name || "-"}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Old Department</InputLabel>
                      <Select
                        value={historyFormData.oldDepartmentId || ""}
                        onChange={(e) => setHistoryFormData({ ...historyFormData, oldDepartmentId: e.target.value })}
                        label="Old Department"
                      >
                        <MenuItem value="">Select Department</MenuItem>
                        {departments.map((dept) => (
                          <MenuItem key={dept.id || dept.Id || dept.internalId || dept.InternalId} value={dept.id || dept.Id || dept.internalId || dept.InternalId}>
                            {dept.name || dept.Name || "-"}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>New Department</InputLabel>
                      <Select
                        value={historyFormData.newDepartmentId || ""}
                        onChange={(e) => setHistoryFormData({ ...historyFormData, newDepartmentId: e.target.value })}
                        label="New Department"
                      >
                        <MenuItem value="">Select Department</MenuItem>
                        {departments.map((dept) => (
                          <MenuItem key={dept.id || dept.Id || dept.internalId || dept.InternalId} value={dept.id || dept.Id || dept.internalId || dept.InternalId}>
                            {dept.name || dept.Name || "-"}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Old Salary"
                      type="number"
                      value={historyFormData.oldSalary}
                      onChange={(e) => setHistoryFormData({ ...historyFormData, oldSalary: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="New Salary"
                      type="number"
                      value={historyFormData.newSalary}
                      onChange={(e) => setHistoryFormData({ ...historyFormData, newSalary: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </>
                )}

                {historyEventType === "Transfer" && (
                  <>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Old Department</InputLabel>
                      <Select
                        value={historyFormData.oldDepartmentId || ""}
                        onChange={(e) => setHistoryFormData({ ...historyFormData, oldDepartmentId: e.target.value })}
                        label="Old Department"
                      >
                        <MenuItem value="">Select Department</MenuItem>
                        {departments.map((dept) => (
                          <MenuItem key={dept.id || dept.Id || dept.internalId || dept.InternalId} value={dept.id || dept.Id || dept.internalId || dept.InternalId}>
                            {dept.name || dept.Name || "-"}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>New Department</InputLabel>
                      <Select
                        value={historyFormData.newDepartmentId || ""}
                        onChange={(e) => setHistoryFormData({ ...historyFormData, newDepartmentId: e.target.value })}
                        label="New Department"
                      >
                        <MenuItem value="">Select Department</MenuItem>
                        {departments.map((dept) => (
                          <MenuItem key={dept.id || dept.Id || dept.internalId || dept.InternalId} value={dept.id || dept.Id || dept.internalId || dept.InternalId}>
                            {dept.name || dept.Name || "-"}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Old Location"
                      value={historyFormData.oldLocation}
                      onChange={(e) => setHistoryFormData({ ...historyFormData, oldLocation: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="New Location"
                      value={historyFormData.newLocation}
                      onChange={(e) => setHistoryFormData({ ...historyFormData, newLocation: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </>
                )}

                {historyEventType === "DisciplinaryAction" && (
                  <>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Action Type</InputLabel>
                      <Select
                        value={historyFormData.actionType}
                        onChange={(e) => setHistoryFormData({ ...historyFormData, actionType: e.target.value })}
                        label="Action Type"
                      >
                        <MenuItem value="Warning">Warning</MenuItem>
                        <MenuItem value="Written Warning">Written Warning</MenuItem>
                        <MenuItem value="Suspension">Suspension</MenuItem>
                        <MenuItem value="Termination">Termination</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Action Description"
                      multiline
                      rows={4}
                      value={historyFormData.actionDescription}
                      onChange={(e) => setHistoryFormData({ ...historyFormData, actionDescription: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </>
                )}

                {historyEventType === "SalaryChange" && (
                  <>
                    <TextField
                      fullWidth
                      label="Old Basic Salary"
                      type="number"
                      value={historyFormData.oldBasicSalary}
                      onChange={(e) => setHistoryFormData({ ...historyFormData, oldBasicSalary: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="New Basic Salary"
                      type="number"
                      value={historyFormData.newBasicSalary}
                      onChange={(e) => setHistoryFormData({ ...historyFormData, newBasicSalary: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Old Total Allowances"
                      type="number"
                      value={historyFormData.oldAllowances}
                      onChange={(e) => setHistoryFormData({ ...historyFormData, oldAllowances: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="New Total Allowances"
                      type="number"
                      value={historyFormData.newAllowances}
                      onChange={(e) => setHistoryFormData({ ...historyFormData, newAllowances: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </>
                )}

                <TextField
                  fullWidth
                  label="Remarks"
                  multiline
                  rows={3}
                  value={historyFormData.remarks}
                  onChange={(e) => setHistoryFormData({ ...historyFormData, remarks: e.target.value })}
                  sx={{ mb: 2 }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setHistoryDialogOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  if (!historyFormData.effectiveDate) {
                    toast.error("Please select an effective date");
                    return;
                  }

                  try {
                    const headers = createAuthHeaders();
                    const empId = selectedEmployeeProfile?.id || selectedEmployeeProfile?.internalId || selectedEmployeeProfile?.Id || selectedEmployeeProfile?.InternalId;
                    
                    if (!empId) {
                      toast.error("Employee ID not found");
                      return;
                    }

                    // Build old and new value JSON based on event type
                    let oldValueJson = {};
                    let newValueJson = {};

                    if (historyEventType === "Promotion") {
                      const oldJobTitle = jobTitles.find(jt => (jt.id || jt.Id || jt.internalId || jt.InternalId) == historyFormData.oldJobTitleId);
                      const newJobTitle = jobTitles.find(jt => (jt.id || jt.Id || jt.internalId || jt.InternalId) == historyFormData.newJobTitleId);
                      const oldDept = departments.find(d => (d.id || d.Id || d.internalId || d.InternalId) == historyFormData.oldDepartmentId);
                      const newDept = departments.find(d => (d.id || d.Id || d.internalId || d.InternalId) == historyFormData.newDepartmentId);
                      
                      oldValueJson = {
                        jobTitleId: historyFormData.oldJobTitleId,
                        jobTitleName: oldJobTitle?.name || oldJobTitle?.Name || "",
                        departmentId: historyFormData.oldDepartmentId,
                        departmentName: oldDept?.name || oldDept?.Name || "",
                        salary: historyFormData.oldSalary || null,
                      };
                      newValueJson = {
                        jobTitleId: historyFormData.newJobTitleId,
                        jobTitleName: newJobTitle?.name || newJobTitle?.Name || "",
                        departmentId: historyFormData.newDepartmentId,
                        departmentName: newDept?.name || newDept?.Name || "",
                        salary: historyFormData.newSalary || null,
                      };
                    } else if (historyEventType === "Transfer") {
                      const oldDept = departments.find(d => (d.id || d.Id || d.internalId || d.InternalId) == historyFormData.oldDepartmentId);
                      const newDept = departments.find(d => (d.id || d.Id || d.internalId || d.InternalId) == historyFormData.newDepartmentId);
                      
                      oldValueJson = {
                        departmentId: historyFormData.oldDepartmentId,
                        departmentName: oldDept?.name || oldDept?.Name || "",
                        location: historyFormData.oldLocation || "",
                      };
                      newValueJson = {
                        departmentId: historyFormData.newDepartmentId,
                        departmentName: newDept?.name || newDept?.Name || "",
                        location: historyFormData.newLocation || "",
                      };
                    } else if (historyEventType === "DisciplinaryAction") {
                      newValueJson = {
                        actionType: historyFormData.actionType || "",
                        actionDescription: historyFormData.actionDescription || "",
                      };
                    } else if (historyEventType === "SalaryChange") {
                      oldValueJson = {
                        basicSalary: historyFormData.oldBasicSalary || null,
                        allowances: historyFormData.oldAllowances || null,
                      };
                      newValueJson = {
                        basicSalary: historyFormData.newBasicSalary || null,
                        allowances: historyFormData.newAllowances || null,
                      };
                    }

                    const payload = {
                      employeeProfileId: empId,
                      eventType: historyEventType,
                      effectiveDate: historyFormData.effectiveDate,
                      oldValueJson: Object.keys(oldValueJson).length > 0 ? JSON.stringify(oldValueJson) : null,
                      newValueJson: Object.keys(newValueJson).length > 0 ? JSON.stringify(newValueJson) : null,
                      remarks: historyFormData.remarks || null,
                    };

                    const response = await fetch(`${BASE_URL}/hr/employees/${empId}/events`, {
                      method: "POST",
                      headers: {
                        ...headers,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(payload),
                    });

                    if (response.ok) {
                      toast.success("History event added successfully");
                      setHistoryDialogOpen(false);
                      // Reload employee profile to refresh timeline
                      if (selectedEmployeeProfile) {
                        handleViewProfile(selectedEmployeeProfile);
                      }
                    } else {
                      const errorData = await response.json();
                      toast.error(errorData.message || "Failed to add history event");
                    }
                  } catch (error) {
                    console.error("Error adding history event:", error);
                    toast.error("Error adding history event");
                  }
                }}
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </>
  );
};

export default EmployeeLifecycle;


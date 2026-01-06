import React, { useEffect, useMemo, useState, useCallback } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import {
  Box,
  CircularProgress,
  Grid,
  Typography,
  Chip,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
  Button,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import {
  createAuthHeaders,
  getOrgId,
  parseObjectResponse,
  parsePagedResponse,
  formatDate,
} from "@/components/utils/apiHelpers";
import MetricCard from "@/components/HR/ModernCard";
import ModernTable from "@/components/HR/ModernTable";
import ModernFilter from "@/components/HR/ModernFilter";
import AddButton from "@/components/HR/AddButton";
import ActionButtons from "@/components/HR/ActionButtons";
import ConfirmDialog from "@/components/HR/ConfirmDialog";
import FormDialog from "@/components/HR/FormDialog";
import FormField from "@/components/HR/FormField";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import SendIcon from "@mui/icons-material/Send";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { useCurrency } from "@/components/HR/CurrencyContext";

const JOB_STATUS_LABELS = {
  0: "Draft",
  1: "Published",
  2: "Closed",
  3: "On Hold",
  4: "Filled",
  "Draft": "Draft",
  "Published": "Published",
  "Closed": "Closed",
  "OnHold": "On Hold",
  "On Hold": "On Hold",
  "Filled": "Filled",
};

const VISIBILITY_LABELS = {
  0: "Internal",
  1: "Public",
  2: "Confidential",
  "Internal": "Internal",
  "Public": "Public",
  "Confidential": "Confidential",
};

// Helper function to get status label
const getStatusLabel = (status) => {
  if (status === null || status === undefined) return "-";
  // Handle numeric values
  if (typeof status === 'number') {
    return JOB_STATUS_LABELS[status] || "-";
  }
  // Handle string values (enum names)
  if (typeof status === 'string') {
    return JOB_STATUS_LABELS[status] || status || "-";
  }
  return "-";
};

// Helper function to get visibility label
const getVisibilityLabel = (visibility) => {
  if (visibility === null || visibility === undefined) return "-";
  // Handle numeric values
  if (typeof visibility === 'number') {
    return VISIBILITY_LABELS[visibility] || "-";
  }
  // Handle string values (enum names)
  if (typeof visibility === 'string') {
    return VISIBILITY_LABELS[visibility] || visibility || "-";
  }
  return "-";
};

// Helper function to get status value (normalize to number)
const getStatusValue = (status) => {
  if (status === null || status === undefined) return 0;
  if (typeof status === 'number') return status;
  if (typeof status === 'string') {
    const statusMap = { "Draft": 0, "Published": 1, "Closed": 2, "OnHold": 3, "On Hold": 3, "Filled": 4 };
    return statusMap[status] !== undefined ? statusMap[status] : 0;
  }
  return 0;
};

const Recruitment = () => {
  const { currency, setCurrency, formatCurrencyWithSymbol } = useCurrency();
  const categoryId = 126;
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
  const [analytics, setAnalytics] = useState({
    applicantsCount: 0,
    interviewedCount: 0,
    offeredCount: 0,
    hiredCount: 0,
    averageTimeToHire: 0,
    offerAcceptanceRate: 0,
    costPerHire: 0,
  });
  const [jobOpenings, setJobOpenings] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // "add" or "edit"
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [recruitmentCycles, setRecruitmentCycles] = useState([]);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateFormOpen, setCandidateFormOpen] = useState(false);
  const [candidateFormData, setCandidateFormData] = useState({
    jobOpeningId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    experienceYears: "",
    currentCompany: "",
    source: "Direct",
    notes: "",
  });
  const [candidateFormErrors, setCandidateFormErrors] = useState({});
  const [candidateFormLoading, setCandidateFormLoading] = useState(false);
  
  // Interview management state
  const [interviewFormOpen, setInterviewFormOpen] = useState(false);
  const [interviewFormData, setInterviewFormData] = useState({
    candidateId: "",
    jobOpeningId: "",
    scheduledStart: "",
    scheduledEnd: "",
    mode: "Virtual",
    location: "",
    interviewerIds: "",
  });
  const [interviewFormErrors, setInterviewFormErrors] = useState({});
  const [interviewFormLoading, setInterviewFormLoading] = useState(false);
  
  // Offer management state
  const [offerFormOpen, setOfferFormOpen] = useState(false);
  const [offerFormData, setOfferFormData] = useState({
    candidateId: "",
    jobOpeningId: "",
    offerNumber: "",
    salary: "",
    currency: currency || "USD",
    joinDate: "",
    sendImmediately: true,
  });
  const [offerFormErrors, setOfferFormErrors] = useState({});
  const [offerFormLoading, setOfferFormLoading] = useState(false);
  
  // Interviews and Offers lists
  const [interviews, setInterviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(false);
  
  // Candidate details view
  const [candidateDetailOpen, setCandidateDetailOpen] = useState(false);
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState(null);
  const [loadingCandidateDetail, setLoadingCandidateDetail] = useState(false);
  
  // Offer action dialog
  const [offerActionDialogOpen, setOfferActionDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [offerAction, setOfferAction] = useState(""); // "ACCEPT", "DECLINE", "WITHDRAW"
  
  // Filtered candidates view (for metric card clicks)
  const [filteredCandidatesDialogOpen, setFilteredCandidatesDialogOpen] = useState(false);
  const [filteredCandidatesTitle, setFilteredCandidatesTitle] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  
  // Cycle management state
  const [cycleFormOpen, setCycleFormOpen] = useState(false);
  const [cycleFormMode, setCycleFormMode] = useState("add");
  const [cycleFormData, setCycleFormData] = useState({});
  const [cycleFormErrors, setCycleFormErrors] = useState({});
  const [cycleFormLoading, setCycleFormLoading] = useState(false);

  const loadRecruitmentCycles = useCallback(async () => {
    try {
      setLoadingCycles(true);
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      
      const response = await fetch(
        `${BASE_URL}/hr/recruitment/cycles?OrgId=${orgId || 0}&SkipCount=0&MaxResultCount=100`,
        { headers }
      );
      
      if (response.ok) {
        const jsonResponse = await response.json();
        console.log("Recruitment cycles API response:", jsonResponse);
        
        // The API returns PagedResult directly, not wrapped
        let cycles = [];
        if (Array.isArray(jsonResponse)) {
          cycles = jsonResponse;
        } else if (jsonResponse.items) {
          cycles = jsonResponse.items;
        } else if (jsonResponse.result) {
          if (Array.isArray(jsonResponse.result)) {
            cycles = jsonResponse.result;
          } else if (jsonResponse.result.items) {
            cycles = jsonResponse.result.items;
          }
        }
        
        // Handle both camelCase and PascalCase property names
        const normalizedCycles = cycles.map(cycle => ({
          id: cycle.id || cycle.Id,
          internalId: cycle.internalId || cycle.InternalId,
          name: cycle.name || cycle.Name || `Cycle ${cycle.id || cycle.Id || cycle.internalId || cycle.InternalId || ""}`,
          startDate: cycle.startDate || cycle.StartDate,
          endDate: cycle.endDate || cycle.EndDate,
          status: cycle.status || cycle.Status || "Draft",
        }));
        
        console.log("Normalized recruitment cycles:", normalizedCycles);
        setRecruitmentCycles(normalizedCycles);
      } else {
        const errorText = await response.text();
        console.error("Failed to load recruitment cycles:", response.status, response.statusText, errorText);
        setRecruitmentCycles([]);
      }
    } catch (err) {
      console.error("Failed to load recruitment cycles:", err);
      setRecruitmentCycles([]);
    } finally {
      setLoadingCycles(false);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      setLoadingDepartments(true);
      const headers = createAuthHeaders();
      
      const response = await fetch(
        `${BASE_URL}/Employee/GetAlldepartment`,
        { headers }
      );
      
      if (response.ok) {
        const jsonResponse = await response.json();
        const deptList = jsonResponse.result || jsonResponse || [];
        setDepartments(deptList);
      } else {
        console.error("Failed to load departments:", response.status, response.statusText);
        setDepartments([]);
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  const loadRecruitmentData = useCallback(async () => {
    if (!navigate) {
      return;
    }

      try {
        setLoading(true);
        setError(null);

        const orgId = getOrgId();
        const headers = createAuthHeaders();

        const [analyticsResponse, openingsResponse] = await Promise.all([
          fetch(`${BASE_URL}/hr/recruitment/analytics?OrgId=${orgId || 0}`, {
            headers,
          }),
          fetch(
          `${BASE_URL}/hr/recruitment/job-openings?OrgId=${orgId || 0}&SkipCount=0&MaxResultCount=50&IncludePublic=false`,
            { headers }
          ),
        ]);

        if (!analyticsResponse.ok) {
          throw new Error("Unable to load recruitment analytics");
        }

        if (!openingsResponse.ok) {
          throw new Error("Unable to load job openings");
        }

        const analyticsPayload = parseObjectResponse(await analyticsResponse.json());
        const openingsPayload = parsePagedResponse(await openingsResponse.json());

        setAnalytics({
          applicantsCount: analyticsPayload.applicantsCount ?? 0,
          interviewedCount: analyticsPayload.interviewedCount ?? 0,
          offeredCount: analyticsPayload.offeredCount ?? 0,
          hiredCount: analyticsPayload.hiredCount ?? 0,
          averageTimeToHire: analyticsPayload.averageTimeToHire ?? 0,
          offerAcceptanceRate: analyticsPayload.offerAcceptanceRate ?? 0,
          costPerHire: analyticsPayload.costPerHire ?? 0,
        });

      const loadedOpenings = openingsPayload.items ?? [];
      setJobOpenings(loadedOpenings);
      
      // Debug: log the loaded openings to verify status
      console.log("Loaded job openings:", loadedOpenings.map(item => ({
        id: item.jobOpening?.id || item.jobOpening?.Id,
        title: item.jobOpening?.title || item.jobOpening?.Title,
        status: item.jobOpening?.status ?? item.jobOpening?.Status,
        statusType: typeof (item.jobOpening?.status ?? item.jobOpening?.Status)
      })));
      } catch (err) {
          setError(err.message || "Failed to load recruitment data");
      } finally {
          setLoading(false);
        }
  }, [navigate]);

  const loadInterviews = useCallback(async () => {
    try {
      setLoadingInterviews(true);
      // Note: There's no direct endpoint to get all interviews
      // Interviews are loaded when viewing candidate details
      setInterviews([]);
    } catch (err) {
      console.error("Error loading interviews:", err);
    } finally {
      setLoadingInterviews(false);
    }
  }, []);

  const loadOffers = useCallback(async () => {
    try {
      setLoadingOffers(true);
      // Note: There's no direct endpoint to get all offers
      // Offers are loaded when viewing candidate details
      setOffers([]);
    } catch (err) {
      console.error("Error loading offers:", err);
    } finally {
      setLoadingOffers(false);
    }
  }, []);

  const loadCandidates = useCallback(async () => {
    try {
      setLoadingCandidates(true);
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      
      const response = await fetch(
        `${BASE_URL}/hr/recruitment/candidates?OrgId=${orgId || 0}&SkipCount=0&MaxResultCount=100`,
        { headers }
      );
      
      if (response.ok) {
        const jsonResponse = await response.json();
        console.log("Candidates API response:", jsonResponse);
        const candidatesData = parsePagedResponse(jsonResponse);
        const candidatesList = candidatesData.items || [];
        console.log("Loaded candidates:", candidatesList.length, candidatesList);
        setCandidates(candidatesList);
      } else {
        const errorText = await response.text();
        console.error("Failed to load candidates:", response.status, response.statusText, errorText);
        setCandidates([]);
      }
    } catch (err) {
      console.error("Error loading candidates:", err);
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  }, []);

  useEffect(() => {
    loadRecruitmentData();
    loadRecruitmentCycles();
    loadDepartments();
    loadCandidates();
    loadInterviews();
    loadOffers();
  }, [loadRecruitmentData, loadRecruitmentCycles, loadDepartments, loadCandidates, loadInterviews, loadOffers]);

  // Handle metric card click to show filtered candidates
  const handleMetricCardClick = (cardTitle) => {
    let filtered = [];
    let title = "";
    
    console.log("Filtering candidates for:", cardTitle);
    console.log("All candidates:", candidates);
    
    switch (cardTitle) {
      case "Applicants":
        filtered = candidates.filter(c => {
          const status = c.status !== undefined ? c.status : (c.Status !== undefined ? c.Status : 0);
          const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
          // Applied status (0) or Sourcing stage (1)
          return status === 0 || stage === 1;
        });
        title = "Applicants";
        break;
      case "Interviews":
        filtered = candidates.filter(c => {
          const status = c.status !== undefined ? c.status : (c.Status !== undefined ? c.Status : 0);
          const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
          console.log("Candidate:", c.firstName || c.FirstName, "Status:", status, "Stage:", stage);
          // Interviewing status (2) OR Interview stage (3) OR Screening stage (2)
          return status === 2 || stage === 3 || stage === 2;
        });
        console.log("Filtered interview candidates:", filtered);
        title = "Candidates in Interview Stage";
        break;
      case "Offers":
        filtered = candidates.filter(c => {
          const status = c.status !== undefined ? c.status : (c.Status !== undefined ? c.Status : 0);
          const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
          // Offered status (3) OR Offer stage (4)
          return status === 3 || stage === 4;
        });
        title = "Candidates with Offers";
        break;
      case "Hires":
        filtered = candidates.filter(c => {
          const status = c.status !== undefined ? c.status : (c.Status !== undefined ? c.Status : 0);
          const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
          // Hired status (4) OR Hired stage (5)
          return status === 4 || stage === 5;
        });
        title = "Hired Candidates";
        break;
      default:
        return;
    }
    
    console.log("Final filtered list:", filtered);
    setFilteredCandidates(filtered);
    setFilteredCandidatesTitle(title);
    setFilteredCandidatesDialogOpen(true);
  };

  // Calculate metric counts directly from candidates array for real-time updates
  const calculatedMetrics = useMemo(() => {
    const applicants = candidates.filter(c => {
      const status = c.status !== undefined ? c.status : (c.Status !== undefined ? c.Status : 0);
      const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
      // Applied status (0) or Sourcing stage (1)
      return status === 0 || stage === 1;
    });

    const interviewed = candidates.filter(c => {
      const status = c.status !== undefined ? c.status : (c.Status !== undefined ? c.Status : 0);
      const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
      // Interviewing status (2) OR Interview stage (3) OR Screening stage (2)
      return status === 2 || stage === 3 || stage === 2;
    });

    const offered = candidates.filter(c => {
      const status = c.status !== undefined ? c.status : (c.Status !== undefined ? c.Status : 0);
      const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
      // Offered status (3) OR Offer stage (4)
      return status === 3 || stage === 4;
    });

    const hired = candidates.filter(c => {
      const status = c.status !== undefined ? c.status : (c.Status !== undefined ? c.Status : 0);
      const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
      // Hired status (4) OR Hired stage (5)
      return status === 4 || stage === 5;
    });

    return {
      applicantsCount: applicants.length,
      interviewedCount: interviewed.length,
      offeredCount: offered.length,
      hiredCount: hired.length,
    };
  }, [candidates]);

  const summaryCards = useMemo(
    () => [
      {
        title: "Applicants",
        value: calculatedMetrics.applicantsCount,
        subtitle: "Total applications in pipeline",
        icon: <PeopleIcon />,
        color: "primary",
        onClick: () => handleMetricCardClick("Applicants"),
      },
      {
        title: "Interviews",
        value: calculatedMetrics.interviewedCount,
        subtitle: "Candidates interviewed",
        icon: <AssignmentIndIcon />,
        color: "info",
        onClick: () => handleMetricCardClick("Interviews"),
      },
      {
        title: "Offers",
        value: calculatedMetrics.offeredCount,
        subtitle: "Offers issued",
        icon: <SendIcon />,
        color: "warning",
        onClick: () => handleMetricCardClick("Offers"),
      },
      {
        title: "Hires",
        value: calculatedMetrics.hiredCount,
        subtitle: "Candidates hired",
        icon: <HowToRegIcon />,
        color: "success",
        onClick: () => handleMetricCardClick("Hires"),
      },
    ],
    [calculatedMetrics]
  );

  const handleAdd = () => {
    setFormMode("add");
    setFormData({
      cycleId: "",
      departmentId: "",
      title: "",
      description: "",
      responsibilities: "",
      skills: "",
      salaryMin: "",
      salaryMax: "",
      currency: currency || "USD",
      employmentType: "Full-Time",
      location: "",
      tags: "",
      status: "Draft",
      publish: false,
    });
    setFormErrors({});
    setFormOpen(true);
    loadRecruitmentCycles();
    loadDepartments();
  };

  const handleEdit = (item) => {
    const opening = item.jobOpening || item || {};
    const openingId = opening.id || opening.Id || opening.internalId || opening.InternalId;
    
    // Normalize status value
    const statusValue = opening.status !== undefined ? opening.status : 
                       (opening.Status !== undefined ? opening.Status : 0);
    
    // Map status value to status string
    const statusMap = { 0: "Draft", 1: "Published", 2: "Closed", 3: "OnHold", 4: "Filled" };
    const statusString = statusMap[statusValue] || "Draft";
    
    // Normalize visibility to check publish status
    const visibilityValue = opening.visibility !== undefined ? opening.visibility : 
                          (opening.Visibility !== undefined ? opening.Visibility : 0);
    const isPublic = visibilityValue === 1 || visibilityValue === "Public" || visibilityValue === 1;
    const isPublished = statusValue === 1 || statusValue === "Published";
    
    setFormMode("edit");
    setFormData({
      id: openingId,
      cycleId: String(opening.cycleId || opening.CycleId || ""),
      departmentId: String(opening.departmentId || opening.DepartmentId || ""),
      title: opening.title || opening.Title || "",
      description: opening.description || opening.Description || "",
      responsibilities: opening.responsibilities || opening.Responsibilities || "",
      skills: opening.skills || opening.Skills || "",
      salaryMin: opening.salaryMin !== null && opening.salaryMin !== undefined 
        ? String(opening.salaryMin) 
        : (opening.SalaryMin !== null && opening.SalaryMin !== undefined ? String(opening.SalaryMin) : ""),
      salaryMax: opening.salaryMax !== null && opening.salaryMax !== undefined 
        ? String(opening.salaryMax) 
        : (opening.SalaryMax !== null && opening.SalaryMax !== undefined ? String(opening.SalaryMax) : ""),
      currency: opening.currency || opening.Currency || "USD",
      employmentType: opening.employmentType || opening.EmploymentType || "Full-Time",
      location: opening.location || opening.Location || "",
      tags: opening.tags || opening.Tags || "",
      status: statusString,
      publish: isPublished || isPublic || opening.publish || opening.Publish || false,
    });
    
    setFormErrors({});
    setFormOpen(true);
    loadRecruitmentCycles();
    loadDepartments();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    // Debug log for status changes
    if (name === "status") {
      console.log("Status changed to:", value);
    }
    setFormData((prev) => {
      const updated = {
      ...prev,
      [name]: value,
      };
      // Debug log the updated form data for status
      if (name === "status") {
        console.log("Updated formData.status:", updated.status);
      }
      return updated;
    });
    // Clear error for this field
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
    if (!formData.cycleId) errors.cycleId = "Recruitment cycle is required";
    if (!formData.title?.trim()) errors.title = "Title is required";
    if (!formData.description?.trim()) errors.description = "Description is required";
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
      
      // Ensure orgId is a valid integer (required by backend)
      const orgIdValue = orgId && !isNaN(orgId) ? parseInt(orgId, 10) : 0;
      
      // Find department name from departmentId
      const selectedDepartment = formData.departmentId 
        ? departments.find(d => String(d.id || d.Id) === String(formData.departmentId))
        : null;
      const departmentName = selectedDepartment 
        ? (selectedDepartment.name || selectedDepartment.Name || "")
        : null;

      // Ensure status is properly set - don't default to "Draft" if status is explicitly set
      const statusValue = formData.status && formData.status.trim() !== "" 
        ? formData.status 
        : "Draft";
      
      const payload = {
        OrgId: orgIdValue,
        CycleId: parseInt(formData.cycleId, 10),
        DepartmentId: formData.departmentId ? parseInt(formData.departmentId, 10) : null,
        DepartmentName: departmentName,
        Title: formData.title,
        Description: formData.description,
        Responsibilities: formData.responsibilities || null,
        Skills: formData.skills || null,
        SalaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
        SalaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
        Currency: formData.currency || "USD",
        EmploymentType: formData.employmentType || "Full-Time",
        Location: formData.location || null,
        Tags: formData.tags || null,
        Status: statusValue,
        Publish: formData.publish || false,
      };
      
      console.log("Form Data Status:", formData.status);
      console.log("Payload Status:", payload.Status);

      const url = formMode === "add"
        ? `${BASE_URL}/hr/recruitment/job-openings`
        : `${BASE_URL}/hr/recruitment/job-openings/${formData.id}`;
      const method = formMode === "add" ? "POST" : "PUT";

      // Final verification before sending
      console.log("=== FINAL PAYLOAD BEFORE SEND ===");
      console.log("Full payload:", JSON.stringify(payload, null, 2));
      console.log("Status in payload:", payload.Status);
      console.log("Form data status:", formData.status);
      console.log("================================");

      const response = await fetch(url, {
        method,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      
      // Debug: log the response to see what was saved
      console.log("Response from server:", responseData);
      if (responseData.data) {
        const savedStatus = responseData.data.status !== undefined ? responseData.data.status : 
                           (responseData.data.Status !== undefined ? responseData.data.Status : "unknown");
        console.log("Saved job opening status:", savedStatus);
        console.log("Full saved job opening data:", responseData.data);
      }
      
      // Check both HTTP status and response body statusCode
      if (!response.ok || (responseData.statusCode !== undefined && responseData.statusCode !== 200)) {
        const errorMessage = responseData.message || responseData.Message || "Failed to save job opening";
        throw new Error(errorMessage);
      }

      setFormOpen(false);
      toast.success(formMode === "add" ? "Job opening created successfully!" : "Job opening updated successfully!");
      
      // Reload the data to show the new/updated job opening
      await loadRecruitmentData();
    } catch (error) {
      toast.error(error.message || "Failed to save job opening");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (item) => {
    const opening = item.jobOpening || {};
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    
    try {
      const opening = selectedItem.jobOpening || {};
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      
      const response = await fetch(`${BASE_URL}/hr/recruitment/job-openings/${opening.id || opening.internalId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete job opening");
      }

      setDeleteDialogOpen(false);
      setSelectedItem(null);
      
      toast.success("Job opening deleted successfully!");
      
      // Reload the data to reflect the deletion
      await loadRecruitmentData();
    } catch (error) {
      toast.error(error.message || "Failed to delete job opening");
    }
  };

  // Cycle management functions
  const handleCycleFormChange = (e) => {
    const { name, value } = e.target;
    setCycleFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (cycleFormErrors[name]) {
      setCycleFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateCycleForm = () => {
    const errors = {};
    if (!cycleFormData.name?.trim()) errors.name = "Cycle name is required";
    if (!cycleFormData.startDate) errors.startDate = "Start date is required";
    setCycleFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCycleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateCycleForm()) return;

    setCycleFormLoading(true);
    try {
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      const orgIdValue = orgId && !isNaN(orgId) ? parseInt(orgId, 10) : 0;
      
      const payload = {
        OrgId: orgIdValue,
        Name: cycleFormData.name,
        StartDate: cycleFormData.startDate,
        EndDate: cycleFormData.endDate || null,
        Status: cycleFormData.status || "Draft",
      };

      // Only create is supported for now (no update endpoint)
      const url = `${BASE_URL}/hr/recruitment/cycles`;
      const method = "POST";

      const response = await fetch(url, {
        method,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      
      if (!response.ok || (responseData.statusCode !== undefined && responseData.statusCode !== 200)) {
        const errorMessage = responseData.message || responseData.Message || "Failed to save recruitment cycle";
        throw new Error(errorMessage);
      }

      setCycleFormOpen(false);
      toast.success(cycleFormMode === "add" ? "Recruitment cycle created successfully!" : "Recruitment cycle updated successfully!");
      
      // Reload cycles and job openings
      await loadRecruitmentCycles();
      await loadRecruitmentData();
    } catch (error) {
      toast.error(error.message || "Failed to save recruitment cycle");
    } finally {
      setCycleFormLoading(false);
    }
  };


  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Recruitment</h1>
        <ul>
          <li>
            <Link href="/hr/recruitment/">Recruitment</Link>
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

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {summaryCards.map((card) => (
              <Grid item xs={12} sm={6} md={3} key={card.title}>
                <MetricCard {...card} />
              </Grid>
            ))}
            <Grid item xs={12} md={4}>
              <MetricCard
                title="Offer Acceptance Rate"
                value={`${(analytics.offerAcceptanceRate ?? 0).toFixed(1)}%`}
                subtitle="Percentage of offers accepted by candidates"
                icon={<TrendingUpIcon />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard
                title="Average Time to Hire"
                value={`${(analytics.averageTimeToHire ?? 0).toFixed(1)} days`}
                subtitle="Average duration from application to hire"
                icon={<AccessTimeIcon />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard
                title="Cost per Hire"
                value={formatCurrencyWithSymbol(analytics.costPerHire ?? 0)}
                subtitle="Estimated recruitment spend per hire"
                icon={<AttachMoneyIcon />}
                color="warning"
              />
            </Grid>
          </Grid>

          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
                Recruitment Cycles
              </Typography>
              <AddButton label="Add Cycle" onClick={() => {
                setCycleFormMode("add");
                setCycleFormData({
                  name: "",
                  startDate: "",
                  endDate: "",
                  status: "Draft",
                });
                setCycleFormErrors({});
                setCycleFormOpen(true);
              }} />
            </Box>
            <ModernTable
              columns={[
                { id: "name", label: "Cycle Name" },
                { id: "startDate", label: "Start Date", render: (value) => formatDate(value) },
                { id: "endDate", label: "End Date", render: (value) => formatDate(value) },
                {
                  id: "status",
                  label: "Status",
                  render: (value) => (
                    <Chip
                      label={value || "Draft"}
                      size="small"
                      color={value === "Active" ? "success" : "default"}
                      sx={{ fontWeight: 600 }}
                    />
                  ),
                },
              ]}
              rows={recruitmentCycles.map((cycle) => ({
                id: cycle.id || cycle.internalId,
                name: cycle.name || "-",
                startDate: cycle.startDate,
                endDate: cycle.endDate,
                status: cycle.status,
              }))}
              emptyMessage="No recruitment cycles available. Create one to get started."
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
                Recent Job Openings
              </Typography>
            <AddButton label="Add Job Opening" onClick={handleAdd} />
            </Box>
            <ModernTable
              columns={[
                { id: "title", label: "Job Title" },
                { id: "department", label: "Department" },
                {
                  id: "status",
                  label: "Status",
                  render: (value) => {
                    const statusValue = getStatusValue(value);
                    const statusLabel = getStatusLabel(value);
                    return (
                    <Chip
                        label={statusLabel}
                      size="small"
                      color={
                          statusValue === 1
                          ? "success"
                            : statusValue === 2 || statusValue === 4
                          ? "default"
                            : statusValue === 3
                          ? "warning"
                          : "default"
                      }
                      sx={{ fontWeight: 600 }}
                    />
                    );
                  },
                },
                {
                  id: "visibility",
                  label: "Visibility",
                  render: (value) => {
                    const visibilityLabel = getVisibilityLabel(value);
                    return (
                    <Chip
                        label={visibilityLabel}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                    );
                  },
                },
                { id: "publishedAt", label: "Published" },
                {
                  id: "pipeline",
                  label: "Pipeline",
                  align: "right",
                  render: (_, row) => (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.candidatesCount ?? 0} candidates
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.offersSent ?? 0} offers
                      </Typography>
                    </Box>
                  ),
                },
                {
                  id: "actions",
                  label: "Actions",
                  align: "center",
                  render: (_, row) => (
                    <ActionButtons
                      onEdit={() => handleEdit(row._originalItem || row)}
                      onDelete={() => handleDelete(row._originalItem || row)}
                    />
                  ),
                },
              ]}
              rows={jobOpenings.map((item) => {
                const opening = item.jobOpening || {};
                // Find department name from departmentId
                const departmentId = opening.departmentId || opening.DepartmentId;
                const department = departmentId 
                  ? departments.find(d => String(d.id || d.Id) === String(departmentId))
                  : null;
                const departmentName = department 
                  ? (department.name || department.Name)
                  : (opening.departmentName || opening.DepartmentName || "-");
                
                // Normalize status and visibility values
                // Status can come as number (0, 1, 2, etc.) or string ("Draft", "Published", etc.)
                let statusValue = opening.status !== undefined ? opening.status : 
                                  (opening.Status !== undefined ? opening.Status : 0);
                
                // If status is a string, convert to number
                if (typeof statusValue === 'string') {
                  const statusMap = { "Draft": 0, "Published": 1, "Closed": 2, "OnHold": 3, "Filled": 4 };
                  statusValue = statusMap[statusValue] !== undefined ? statusMap[statusValue] : 0;
                }
                
                const visibilityValue = opening.visibility !== undefined ? opening.visibility : 
                                       (opening.Visibility !== undefined ? opening.Visibility : 0);
                
                return {
                  id: opening.id || opening.Id || opening.internalId || opening.InternalId,
                  title: opening.title || opening.Title || "-",
                  department: departmentName,
                  status: statusValue,
                  visibility: visibilityValue,
                  publishedAt: formatDate(opening.publishedAt || opening.PublishedAt),
                  candidatesCount: item.candidatesCount ?? 0,
                  offersSent: item.offersSent ?? 0,
                  // Store reference to original item for edit/delete
                  _originalItem: item,
                };
              })}
              emptyMessage="No job openings available"
            />
          </Box>

          <FormDialog
            open={cycleFormOpen}
            onClose={() => setCycleFormOpen(false)}
            title="Add Recruitment Cycle"
            onSubmit={handleCycleFormSubmit}
            submitLabel="Create"
            loading={cycleFormLoading}
            maxWidth="md"
          >
            <Grid container spacing={2}>
              <FormField
                name="name"
                label="Cycle Name"
                value={cycleFormData.name}
                onChange={handleCycleFormChange}
                required
                error={!!cycleFormErrors.name}
                helperText={cycleFormErrors.name}
              />
              <FormField
                name="startDate"
                label="Start Date"
                type="date"
                value={cycleFormData.startDate}
                onChange={handleCycleFormChange}
                required
                error={!!cycleFormErrors.startDate}
                helperText={cycleFormErrors.startDate}
                xs={6}
              />
              <FormField
                name="endDate"
                label="End Date"
                type="date"
                value={cycleFormData.endDate}
                onChange={handleCycleFormChange}
                xs={6}
              />
              <FormField
                name="status"
                label="Status"
                type="select"
                value={cycleFormData.status}
                onChange={handleCycleFormChange}
                options={["Draft", "Active", "Closed"].map(v => ({ value: v, label: v }))}
              />
            </Grid>
          </FormDialog>

          <ConfirmDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSelectedItem(null);
            }}
            onConfirm={confirmDelete}
            title="Delete Job Opening"
            message={`Are you sure you want to delete "${selectedItem?.jobOpening?.title || 'this job opening'}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            confirmColor="error"
          />

          <FormDialog
            open={formOpen}
            onClose={() => setFormOpen(false)}
            title={formMode === "add" ? "Add Job Opening" : "Edit Job Opening"}
            onSubmit={handleFormSubmit}
            submitLabel={formMode === "add" ? "Create" : "Update"}
            loading={formLoading}
            maxWidth="md"
          >
            <Grid container spacing={2}>
              <FormField
                name="cycleId"
                label="Recruitment Cycle"
                type="select"
                value={formData.cycleId}
                onChange={handleFormChange}
                required
                error={!!formErrors.cycleId}
                helperText={formErrors.cycleId || (loadingCycles ? "Loading cycles..." : recruitmentCycles.length === 0 ? "No cycles available. Please create a recruitment cycle first." : "")}
                disabled={loadingCycles}
                options={loadingCycles 
                  ? [{ value: "", label: "Loading..." }]
                  : recruitmentCycles.length > 0 
                    ? recruitmentCycles.map(cycle => ({ 
                        value: String(cycle.id || cycle.internalId || ""), 
                        label: cycle.name || `Cycle ${cycle.id || cycle.internalId || ""}` 
                      }))
                    : [{ value: "", label: "No cycles available" }]
                }
                xs={12}
              />
              <FormField
                name="departmentId"
                label="Department"
                type="select"
                value={formData.departmentId}
                onChange={handleFormChange}
                disabled={loadingDepartments}
                helperText={loadingDepartments ? "Loading departments..." : ""}
                options={loadingDepartments 
                  ? [{ value: "", label: "Loading..." }]
                  : departments.length > 0 
                    ? departments.map(dept => ({ 
                        value: String(dept.id || dept.Id || ""), 
                        label: dept.name || dept.Name || `Department ${dept.id || dept.Id || ""}` 
                      }))
                    : [{ value: "", label: "No departments available" }]
                }
                xs={6}
              />
              <FormField
                name="title"
                label="Job Title"
                value={formData.title}
                onChange={handleFormChange}
                required
                error={!!formErrors.title}
                helperText={formErrors.title}
                xs={6}
              />
              <FormField
                name="employmentType"
                label="Employment Type"
                type="select"
                value={formData.employmentType}
                onChange={handleFormChange}
                options={["Full-Time", "Part-Time", "Contract", "Internship", "Temporary"].map(v => ({ value: v, label: v }))}
              />
              <FormField
                name="location"
                label="Location"
                value={formData.location}
                onChange={handleFormChange}
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
              <FormField
                name="salaryMin"
                label="Min Salary"
                type="number"
                value={formData.salaryMin}
                onChange={handleFormChange}
                xs={6}
              />
              <FormField
                name="salaryMax"
                label="Max Salary"
                type="number"
                value={formData.salaryMax}
                onChange={handleFormChange}
                xs={6}
              />
              <FormField
                name="description"
                label="Description"
                type="textarea"
                value={formData.description}
                onChange={handleFormChange}
                required
                error={!!formErrors.description}
                helperText={formErrors.description}
                rows={4}
                xs={12}
              />
              <FormField
                name="responsibilities"
                label="Responsibilities"
                type="textarea"
                value={formData.responsibilities}
                onChange={handleFormChange}
                rows={3}
                xs={12}
              />
              <FormField
                name="skills"
                label="Required Skills"
                type="textarea"
                value={formData.skills}
                onChange={handleFormChange}
                rows={3}
                xs={12}
              />
              <FormField
                name="tags"
                label="Tags (comma-separated)"
                value={formData.tags}
                onChange={handleFormChange}
                xs={12}
              />
              <FormField
                name="status"
                label="Status"
                type="select"
                value={formData.status || "Draft"}
                onChange={handleFormChange}
                options={[
                  { value: "Draft", label: "Draft" },
                  { value: "Published", label: "Published" },
                  { value: "Closed", label: "Closed" },
                  { value: "OnHold", label: "On Hold" },
                  { value: "Filled", label: "Filled" },
                ]}
                xs={6}
              />
              <Grid item xs={6} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="publish"
                      checked={formData.publish || false}
                      onChange={handleFormChange}
                    />
                  }
                  label="Publish (Make Public)"
                />
              </Grid>
            </Grid>
          </FormDialog>

          {/* Candidates Section */}
          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
                Candidates
              </Typography>
              <AddButton label="Add Candidate" onClick={() => {
                setCandidateFormData({
                  jobOpeningId: "",
                  firstName: "",
                  lastName: "",
                  email: "",
                  phone: "",
                  experienceYears: "",
                  currentCompany: "",
                  source: "Direct",
                  notes: "",
                });
                setCandidateFormErrors({});
                setCandidateFormOpen(true);
              }} />
            </Box>
            <ModernTable
              columns={[
                { id: "name", label: "Name", render: (_, row) => `${row.firstName || ""} ${row.lastName || ""}`.trim() || "-" },
                { id: "email", label: "Email" },
                { id: "phone", label: "Phone" },
                { id: "jobOpening", label: "Job Opening", render: (_, row) => row.jobOpeningTitle || "-" },
                {
                  id: "status",
                  label: "Status",
                  render: (value) => {
                    const statusLabels = {
                      0: "Applied",
                      1: "Shortlisted",
                      2: "Interviewing",
                      3: "Offered",
                      4: "Hired",
                      5: "Rejected",
                      6: "Withdrawn",
                    };
                    return (
                      <Chip
                        label={statusLabels[value] || "Applied"}
                        size="small"
                        color={
                          value === 4 ? "success" :
                          value === 5 || value === 6 ? "error" :
                          value === 2 ? "info" :
                          "default"
                        }
                        sx={{ fontWeight: 600 }}
                      />
                    );
                  },
                },
                { id: "source", label: "Source" },
                {
                  id: "actions",
                  label: "Actions",
                  align: "center",
                  render: (_, row) => {
                    const candidate = candidates.find(c => 
                      String(c.id || c.Id || c.internalId || c.InternalId) === String(row.id)
                    );
                    return (
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={async () => {
                              if (candidate) {
                                setLoadingCandidateDetail(true);
                                try {
                                  const headers = createAuthHeaders();
                                  const response = await fetch(
                                    `${BASE_URL}/hr/recruitment/candidates/${row.id}`,
                                    { headers }
                                  );
                                  if (response.ok) {
                                    const data = await response.json();
                                    setSelectedCandidateDetail(data);
                                    setCandidateDetailOpen(true);
                                  } else {
                                    toast.error("Failed to load candidate details");
                                  }
                                } catch (error) {
                                  toast.error("Error loading candidate details");
                                } finally {
                                  setLoadingCandidateDetail(false);
                                }
                              }
                            }}
                          >
                            <PeopleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Schedule Interview">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              if (candidate) {
                                setInterviewFormData({
                                  candidateId: String(row.id),
                                  jobOpeningId: String(candidate.jobOpeningId || candidate.JobOpeningId || ""),
                                  scheduledStart: "",
                                  scheduledEnd: "",
                                  mode: "Virtual",
                                  location: "",
                                  interviewerIds: "",
                                });
                                setInterviewFormErrors({});
                                setInterviewFormOpen(true);
                              }
                            }}
                          >
                            <AssignmentIndIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Create Offer">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              if (candidate) {
                                const offerNumber = `OFF-${Date.now()}`;
                                setOfferFormData({
                                  candidateId: String(row.id),
                                  jobOpeningId: String(candidate.jobOpeningId || candidate.JobOpeningId || ""),
                                  offerNumber: offerNumber,
                                  salary: "",
                                  currency: currency || "USD",
                                  joinDate: "",
                                  sendImmediately: true,
                                });
                                setOfferFormErrors({});
                                setOfferFormOpen(true);
                              }
                            }}
                          >
                            <SendIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    );
                  },
                },
              ]}
              rows={candidates.map((candidate) => {
                // Find job opening title
                const jobOpening = jobOpenings.find(
                  item => (item.jobOpening?.id || item.jobOpening?.Id) === candidate.jobOpeningId
                );
                const jobOpeningTitle = jobOpening?.jobOpening?.title || jobOpening?.jobOpening?.Title || "-";
                
                return {
                  id: candidate.id || candidate.Id || candidate.internalId || candidate.InternalId,
                  firstName: candidate.firstName || candidate.FirstName || "",
                  lastName: candidate.lastName || candidate.LastName || "",
                  email: candidate.email || candidate.Email || "-",
                  phone: candidate.phone || candidate.Phone || "-",
                  jobOpeningTitle: jobOpeningTitle,
                  status: candidate.status !== undefined ? candidate.status : (candidate.Status !== undefined ? candidate.Status : 0),
                  source: candidate.source || candidate.Source || "Direct",
                };
              })}
              emptyMessage="No candidates available. Add candidates to track applications."
            />
          </Box>

          {/* Hired Candidates Section */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Hired Candidates
            </Typography>
            <ModernTable
              columns={[
                { id: "name", label: "Name", render: (_, row) => `${row.firstName || ""} ${row.lastName || ""}`.trim() || "-" },
                { id: "email", label: "Email" },
                { id: "phone", label: "Phone" },
                { id: "jobOpening", label: "Job Opening", render: (_, row) => row.jobOpeningTitle || "-" },
                { id: "source", label: "Source" },
                {
                  id: "hiredDate",
                  label: "Hired Date",
                  render: (value) => value ? formatDate(value) : "-",
                },
                {
                  id: "actions",
                  label: "Actions",
                  align: "center",
                  render: (_, row) => {
                    const candidate = candidates.find(c => 
                      String(c.id || c.Id || c.internalId || c.InternalId) === String(row.id)
                    );
                    return (
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={async () => {
                              if (candidate) {
                                setLoadingCandidateDetail(true);
                                try {
                                  const headers = createAuthHeaders();
                                  const response = await fetch(
                                    `${BASE_URL}/hr/recruitment/candidates/${row.id}`,
                                    { headers }
                                  );
                                  if (response.ok) {
                                    const data = await response.json();
                                    console.log("Candidate detail response:", data);
                                    const detailData = data.result || data.data || data;
                                    setSelectedCandidateDetail(detailData);
                                    setCandidateDetailOpen(true);
                                  } else {
                                    const errorText = await response.text();
                                    console.error("Failed to load candidate details:", response.status, errorText);
                                    toast.error("Failed to load candidate details");
                                  }
                                } catch (error) {
                                  console.error("Error loading candidate details:", error);
                                  toast.error("Error loading candidate details");
                                } finally {
                                  setLoadingCandidateDetail(false);
                                }
                              }
                            }}
                          >
                            <PeopleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    );
                  },
                },
              ]}
              rows={candidates
                .filter(candidate => {
                  const status = candidate.status !== undefined ? candidate.status : (candidate.Status !== undefined ? candidate.Status : 0);
                  const stage = candidate.stage !== undefined ? candidate.stage : (candidate.Stage !== undefined ? candidate.Stage : 0);
                  // Check both status (Hired = 4) and stage (Hired = 4)
                  return status === 4 || stage === 4;
                })
                .map((candidate) => {
                  // Find job opening title - check both direct jobOpeningId and nested structure
                  const jobOpeningId = candidate.jobOpeningId || candidate.JobOpeningId;
                  let jobOpeningTitle = "-";
                  
                  if (jobOpeningId) {
                    const jobOpening = jobOpenings.find(
                      item => {
                        const itemId = item.jobOpening?.id || item.jobOpening?.Id || item.id || item.Id;
                        return String(itemId) === String(jobOpeningId);
                      }
                    );
                    jobOpeningTitle = jobOpening?.jobOpening?.title || jobOpening?.jobOpening?.Title || jobOpening?.title || jobOpening?.Title || "-";
                  }
                  
                  // Find offer to get respondedOn date (hired date)
                  const offer = offers.find(
                    o => String(o.candidateId || o.CandidateId) === String(candidate.id || candidate.Id || candidate.internalId || candidate.InternalId)
                  );
                  const hiredDate = offer?.respondedOn || offer?.RespondedOn || candidate.updatedOn || candidate.UpdatedOn || candidate.appliedOn || candidate.AppliedOn;
                  
                  return {
                    id: candidate.id || candidate.Id || candidate.internalId || candidate.InternalId,
                    firstName: candidate.firstName || candidate.FirstName || "",
                    lastName: candidate.lastName || candidate.LastName || "",
                    email: candidate.email || candidate.Email || "-",
                    phone: candidate.phone || candidate.Phone || "-",
                    jobOpeningTitle: jobOpeningTitle,
                    status: candidate.status !== undefined ? candidate.status : (candidate.Status !== undefined ? candidate.Status : 0),
                    source: candidate.source || candidate.Source || "Direct",
                    hiredDate: hiredDate,
                  };
                })}
              emptyMessage="No hired candidates yet. Candidates will appear here after accepting offers."
            />
          </Box>

          {/* Add Candidate Form Dialog */}
          <FormDialog
            open={candidateFormOpen}
            onClose={() => setCandidateFormOpen(false)}
            title="Add Candidate"
            onSubmit={async (e) => {
              e.preventDefault();
              
              // Validate
              const errors = {};
              if (!candidateFormData.jobOpeningId) errors.jobOpeningId = "Job opening is required";
              if (!candidateFormData.firstName?.trim()) errors.firstName = "First name is required";
              if (!candidateFormData.lastName?.trim()) errors.lastName = "Last name is required";
              setCandidateFormErrors(errors);
              
              if (Object.keys(errors).length > 0) return;
              
              setCandidateFormLoading(true);
              try {
                const orgId = getOrgId();
                const headers = createAuthHeaders();
                const orgIdValue = orgId && !isNaN(orgId) ? parseInt(orgId, 10) : 0;
                
                const payload = {
                  OrgId: orgIdValue,
                  JobOpeningId: parseInt(candidateFormData.jobOpeningId, 10),
                  FirstName: candidateFormData.firstName,
                  LastName: candidateFormData.lastName,
                  Email: candidateFormData.email || null,
                  Phone: candidateFormData.phone || null,
                  ExperienceYears: candidateFormData.experienceYears ? parseFloat(candidateFormData.experienceYears) : null,
                  CurrentCompany: candidateFormData.currentCompany || null,
                  Source: candidateFormData.source || "Direct",
                  Notes: candidateFormData.notes || null,
                };
                
                const response = await fetch(`${BASE_URL}/hr/recruitment/candidates`, {
                  method: "POST",
                  headers: {
                    ...headers,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(payload),
                });
                
                const responseData = await response.json();
                console.log("Candidate creation response:", responseData);
                
                if (!response.ok || (responseData.statusCode !== undefined && responseData.statusCode !== 200)) {
                  const errorMessage = responseData.message || responseData.Message || "Failed to create candidate";
                  throw new Error(errorMessage);
                }
                
                setCandidateFormOpen(false);
                toast.success("Candidate added successfully!");
                
                // Reset form data
                setCandidateFormData({
                  jobOpeningId: "",
                  firstName: "",
                  lastName: "",
                  email: "",
                  phone: "",
                  experienceYears: "",
                  currentCompany: "",
                  source: "Direct",
                  notes: "",
                });
                setCandidateFormErrors({});
                
                // Reload data - ensure both are called and awaited
                console.log("Reloading candidates and recruitment data...");
                try {
                  await Promise.all([
                    loadCandidates(),
                    loadRecruitmentData(), // Refresh analytics
                  ]);
                  console.log("Data reloaded successfully");
                } catch (reloadError) {
                  console.error("Error reloading data after adding candidate:", reloadError);
                  // Still try to reload individually
                  try {
                    await loadCandidates();
                  } catch (err) {
                    console.error("Error reloading candidates:", err);
                  }
                  try {
                    await loadRecruitmentData();
                  } catch (err) {
                    console.error("Error reloading recruitment data:", err);
                  }
                }
              } catch (error) {
                console.error("Error adding candidate:", error);
                toast.error(error.message || "Failed to add candidate");
              } finally {
                setCandidateFormLoading(false);
              }
            }}
            submitLabel="Add Candidate"
            loading={candidateFormLoading}
            maxWidth="md"
          >
            <Grid container spacing={2}>
              <FormField
                name="jobOpeningId"
                label="Job Opening"
                type="select"
                value={candidateFormData.jobOpeningId}
                onChange={(e) => {
                  setCandidateFormData(prev => ({ ...prev, jobOpeningId: e.target.value }));
                  if (candidateFormErrors.jobOpeningId) {
                    setCandidateFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.jobOpeningId;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!candidateFormErrors.jobOpeningId}
                helperText={candidateFormErrors.jobOpeningId}
                options={jobOpenings.map(item => {
                  const opening = item.jobOpening || {};
                  return {
                    value: String(opening.id || opening.Id || opening.internalId || opening.InternalId || ""),
                    label: opening.title || opening.Title || `Job Opening ${opening.id || opening.Id || ""}`
                  };
                })}
                xs={12}
              />
              <FormField
                name="firstName"
                label="First Name"
                value={candidateFormData.firstName}
                onChange={(e) => {
                  setCandidateFormData(prev => ({ ...prev, firstName: e.target.value }));
                  if (candidateFormErrors.firstName) {
                    setCandidateFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.firstName;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!candidateFormErrors.firstName}
                helperText={candidateFormErrors.firstName}
                xs={6}
              />
              <FormField
                name="lastName"
                label="Last Name"
                value={candidateFormData.lastName}
                onChange={(e) => {
                  setCandidateFormData(prev => ({ ...prev, lastName: e.target.value }));
                  if (candidateFormErrors.lastName) {
                    setCandidateFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.lastName;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!candidateFormErrors.lastName}
                helperText={candidateFormErrors.lastName}
                xs={6}
              />
              <FormField
                name="email"
                label="Email"
                type="email"
                value={candidateFormData.email}
                onChange={(e) => setCandidateFormData(prev => ({ ...prev, email: e.target.value }))}
                xs={6}
              />
              <FormField
                name="phone"
                label="Phone"
                value={candidateFormData.phone}
                onChange={(e) => setCandidateFormData(prev => ({ ...prev, phone: e.target.value }))}
                xs={6}
              />
              <FormField
                name="experienceYears"
                label="Experience (Years)"
                type="number"
                value={candidateFormData.experienceYears}
                onChange={(e) => setCandidateFormData(prev => ({ ...prev, experienceYears: e.target.value }))}
                xs={6}
              />
              <FormField
                name="currentCompany"
                label="Current Company"
                value={candidateFormData.currentCompany}
                onChange={(e) => setCandidateFormData(prev => ({ ...prev, currentCompany: e.target.value }))}
                xs={6}
              />
              <FormField
                name="source"
                label="Source"
                type="select"
                value={candidateFormData.source}
                onChange={(e) => setCandidateFormData(prev => ({ ...prev, source: e.target.value }))}
                options={["Direct", "Referral", "Job Board", "LinkedIn", "Agency", "Other"].map(v => ({ value: v, label: v }))}
                xs={6}
              />
              <FormField
                name="notes"
                label="Notes"
                type="textarea"
                value={candidateFormData.notes}
                onChange={(e) => setCandidateFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                xs={12}
              />
            </Grid>
          </FormDialog>

          {/* Schedule Interview Form Dialog */}
          <FormDialog
            open={interviewFormOpen}
            onClose={() => setInterviewFormOpen(false)}
            title="Schedule Interview"
            onSubmit={async (e) => {
              e.preventDefault();
              
              // Validate
              const errors = {};
              if (!interviewFormData.candidateId) errors.candidateId = "Candidate is required";
              if (!interviewFormData.jobOpeningId) errors.jobOpeningId = "Job opening is required";
              if (!interviewFormData.scheduledStart) errors.scheduledStart = "Start time is required";
              if (!interviewFormData.scheduledEnd) errors.scheduledEnd = "End time is required";
              if (interviewFormData.scheduledStart && interviewFormData.scheduledEnd && 
                  new Date(interviewFormData.scheduledEnd) <= new Date(interviewFormData.scheduledStart)) {
                errors.scheduledEnd = "End time must be later than start time";
              }
              setInterviewFormErrors(errors);
              
              if (Object.keys(errors).length > 0) return;
              
              setInterviewFormLoading(true);
              try {
                const orgId = getOrgId();
                const headers = createAuthHeaders();
                
                const payload = {
                  CandidateId: parseInt(interviewFormData.candidateId, 10),
                  JobOpeningId: parseInt(interviewFormData.jobOpeningId, 10),
                  ScheduledStart: new Date(interviewFormData.scheduledStart).toISOString(),
                  ScheduledEnd: new Date(interviewFormData.scheduledEnd).toISOString(),
                  Mode: interviewFormData.mode || "Virtual",
                  Location: interviewFormData.location || null,
                  InterviewerIds: interviewFormData.interviewerIds || null,
                };
                
                const response = await fetch(`${BASE_URL}/hr/recruitment/interviews`, {
                  method: "POST",
                  headers: {
                    ...headers,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(payload),
                });
                
                const responseData = await response.json();
                
                if (!response.ok || (responseData.statusCode !== undefined && responseData.statusCode !== 200)) {
                  const errorMessage = responseData.message || responseData.Message || "Failed to schedule interview";
                  throw new Error(errorMessage);
                }
                
                setInterviewFormOpen(false);
                toast.success("Interview scheduled successfully!");
                
                // Reload data
                await loadCandidates();
                await loadRecruitmentData(); // Refresh analytics
              } catch (error) {
                toast.error(error.message || "Failed to schedule interview");
              } finally {
                setInterviewFormLoading(false);
              }
            }}
            submitLabel="Schedule Interview"
            loading={interviewFormLoading}
            maxWidth="md"
          >
            <Grid container spacing={2}>
              <FormField
                name="candidateId"
                label="Candidate"
                type="select"
                value={interviewFormData.candidateId}
                onChange={(e) => {
                  setInterviewFormData(prev => ({ ...prev, candidateId: e.target.value }));
                  if (interviewFormErrors.candidateId) {
                    setInterviewFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.candidateId;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!interviewFormErrors.candidateId}
                helperText={interviewFormErrors.candidateId}
                options={candidates.map(candidate => ({
                  value: String(candidate.id || candidate.Id || candidate.internalId || candidate.InternalId || ""),
                  label: `${candidate.firstName || candidate.FirstName || ""} ${candidate.lastName || candidate.LastName || ""}`.trim() || `Candidate ${candidate.id || candidate.Id || ""}`
                }))}
                xs={12}
              />
              <FormField
                name="jobOpeningId"
                label="Job Opening"
                type="select"
                value={interviewFormData.jobOpeningId}
                onChange={(e) => {
                  setInterviewFormData(prev => ({ ...prev, jobOpeningId: e.target.value }));
                  if (interviewFormErrors.jobOpeningId) {
                    setInterviewFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.jobOpeningId;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!interviewFormErrors.jobOpeningId}
                helperText={interviewFormErrors.jobOpeningId}
                options={jobOpenings.map(item => {
                  const opening = item.jobOpening || {};
                  return {
                    value: String(opening.id || opening.Id || opening.internalId || opening.InternalId || ""),
                    label: opening.title || opening.Title || `Job Opening ${opening.id || opening.Id || ""}`
                  };
                })}
                xs={12}
              />
              <FormField
                name="scheduledStart"
                label="Start Time"
                type="datetime-local"
                value={interviewFormData.scheduledStart}
                onChange={(e) => {
                  setInterviewFormData(prev => ({ ...prev, scheduledStart: e.target.value }));
                  if (interviewFormErrors.scheduledStart) {
                    setInterviewFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.scheduledStart;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!interviewFormErrors.scheduledStart}
                helperText={interviewFormErrors.scheduledStart}
                xs={6}
              />
              <FormField
                name="scheduledEnd"
                label="End Time"
                type="datetime-local"
                value={interviewFormData.scheduledEnd}
                onChange={(e) => {
                  setInterviewFormData(prev => ({ ...prev, scheduledEnd: e.target.value }));
                  if (interviewFormErrors.scheduledEnd) {
                    setInterviewFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.scheduledEnd;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!interviewFormErrors.scheduledEnd}
                helperText={interviewFormErrors.scheduledEnd}
                xs={6}
              />
              <FormField
                name="mode"
                label="Interview Mode"
                type="select"
                value={interviewFormData.mode}
                onChange={(e) => setInterviewFormData(prev => ({ ...prev, mode: e.target.value }))}
                options={[
                  { value: "Virtual", label: "Virtual" },
                  { value: "InPerson", label: "In Person" },
                  { value: "Phone", label: "Phone" },
                ]}
                xs={6}
              />
              <FormField
                name="location"
                label="Location"
                value={interviewFormData.location}
                onChange={(e) => setInterviewFormData(prev => ({ ...prev, location: e.target.value }))}
                xs={6}
              />
              <FormField
                name="interviewerIds"
                label="Interviewer IDs (comma-separated)"
                value={interviewFormData.interviewerIds}
                onChange={(e) => setInterviewFormData(prev => ({ ...prev, interviewerIds: e.target.value }))}
                helperText="Enter user IDs separated by commas"
                xs={12}
              />
            </Grid>
          </FormDialog>

          {/* Create Job Offer Form Dialog */}
          <FormDialog
            open={offerFormOpen}
            onClose={() => setOfferFormOpen(false)}
            title="Create Job Offer"
            onSubmit={async (e) => {
              e.preventDefault();
              
              // Validate
              const errors = {};
              if (!offerFormData.candidateId) errors.candidateId = "Candidate is required";
              if (!offerFormData.jobOpeningId) errors.jobOpeningId = "Job opening is required";
              if (!offerFormData.offerNumber?.trim()) errors.offerNumber = "Offer number is required";
              if (!offerFormData.salary) errors.salary = "Salary is required";
              if (!offerFormData.joinDate) errors.joinDate = "Join date is required";
              setOfferFormErrors(errors);
              
              if (Object.keys(errors).length > 0) return;
              
              setOfferFormLoading(true);
              try {
                const orgId = getOrgId();
                const headers = createAuthHeaders();
                
                const payload = {
                  CandidateId: parseInt(offerFormData.candidateId, 10),
                  JobOpeningId: parseInt(offerFormData.jobOpeningId, 10),
                  OfferNumber: offerFormData.offerNumber,
                  Salary: parseFloat(offerFormData.salary),
                  Currency: offerFormData.currency || "USD",
                  JoinDate: new Date(offerFormData.joinDate).toISOString(),
                  SendImmediately: offerFormData.sendImmediately || false,
                };
                
                const response = await fetch(`${BASE_URL}/hr/recruitment/offers`, {
                  method: "POST",
                  headers: {
                    ...headers,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(payload),
                });
                
                const responseData = await response.json();
                
                if (!response.ok || (responseData.statusCode !== undefined && responseData.statusCode !== 200)) {
                  const errorMessage = responseData.message || responseData.Message || "Failed to create offer";
                  throw new Error(errorMessage);
                }
                
                setOfferFormOpen(false);
                toast.success("Job offer created successfully!");
                
                // Reload data
                await loadCandidates();
                await loadRecruitmentData(); // Refresh analytics
              } catch (error) {
                toast.error(error.message || "Failed to create offer");
              } finally {
                setOfferFormLoading(false);
              }
            }}
            submitLabel="Create Offer"
            loading={offerFormLoading}
            maxWidth="md"
          >
            <Grid container spacing={2}>
              <FormField
                name="candidateId"
                label="Candidate"
                type="select"
                value={offerFormData.candidateId}
                onChange={(e) => {
                  setOfferFormData(prev => ({ ...prev, candidateId: e.target.value }));
                  if (offerFormErrors.candidateId) {
                    setOfferFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.candidateId;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!offerFormErrors.candidateId}
                helperText={offerFormErrors.candidateId}
                options={candidates.map(candidate => ({
                  value: String(candidate.id || candidate.Id || candidate.internalId || candidate.InternalId || ""),
                  label: `${candidate.firstName || candidate.FirstName || ""} ${candidate.lastName || candidate.LastName || ""}`.trim() || `Candidate ${candidate.id || candidate.Id || ""}`
                }))}
                xs={12}
              />
              <FormField
                name="jobOpeningId"
                label="Job Opening"
                type="select"
                value={offerFormData.jobOpeningId}
                onChange={(e) => {
                  setOfferFormData(prev => ({ ...prev, jobOpeningId: e.target.value }));
                  if (offerFormErrors.jobOpeningId) {
                    setOfferFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.jobOpeningId;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!offerFormErrors.jobOpeningId}
                helperText={offerFormErrors.jobOpeningId}
                options={jobOpenings.map(item => {
                  const opening = item.jobOpening || {};
                  return {
                    value: String(opening.id || opening.Id || opening.internalId || opening.InternalId || ""),
                    label: opening.title || opening.Title || `Job Opening ${opening.id || opening.Id || ""}`
                  };
                })}
                xs={12}
              />
              <FormField
                name="offerNumber"
                label="Offer Number"
                value={offerFormData.offerNumber}
                onChange={(e) => {
                  setOfferFormData(prev => ({ ...prev, offerNumber: e.target.value }));
                  if (offerFormErrors.offerNumber) {
                    setOfferFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.offerNumber;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!offerFormErrors.offerNumber}
                helperText={offerFormErrors.offerNumber}
                xs={6}
              />
              <FormField
                name="salary"
                label="Salary"
                type="number"
                value={offerFormData.salary}
                onChange={(e) => {
                  setOfferFormData(prev => ({ ...prev, salary: e.target.value }));
                  if (offerFormErrors.salary) {
                    setOfferFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.salary;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!offerFormErrors.salary}
                helperText={offerFormErrors.salary}
                xs={6}
              />
              <FormField
                name="currency"
                label="Currency"
                type="select"
                value={offerFormData.currency}
                onChange={(e) => setOfferFormData(prev => ({ ...prev, currency: e.target.value }))}
                options={["USD", "LKR"].map(v => ({ value: v, label: v }))}
                xs={6}
              />
              <FormField
                name="joinDate"
                label="Join Date"
                type="date"
                value={offerFormData.joinDate}
                onChange={(e) => {
                  setOfferFormData(prev => ({ ...prev, joinDate: e.target.value }));
                  if (offerFormErrors.joinDate) {
                    setOfferFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.joinDate;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!offerFormErrors.joinDate}
                helperText={offerFormErrors.joinDate}
                xs={6}
              />
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="sendImmediately"
                      checked={offerFormData.sendImmediately || false}
                      onChange={(e) => setOfferFormData(prev => ({ ...prev, sendImmediately: e.target.checked }))}
                    />
                  }
                  label="Send Offer Immediately"
                />
              </Grid>
            </Grid>
          </FormDialog>

          {/* Candidate Details Dialog */}
          <FormDialog
            open={candidateDetailOpen}
            onClose={() => {
              setCandidateDetailOpen(false);
              setSelectedCandidateDetail(null);
            }}
            title="Candidate Details"
            submitLabel="Close"
            onSubmit={(e) => {
              e.preventDefault();
              setCandidateDetailOpen(false);
              setSelectedCandidateDetail(null);
            }}
            maxWidth="lg"
          >
            {selectedCandidateDetail && (() => {
              const candidate = selectedCandidateDetail.candidate || selectedCandidateDetail.Candidate || {};
              const stageHistory = selectedCandidateDetail.stageHistory || selectedCandidateDetail.StageHistory || [];
              const interviewSlots = selectedCandidateDetail.interviewSlots || selectedCandidateDetail.InterviewSlots || [];
              const feedback = selectedCandidateDetail.feedback || selectedCandidateDetail.Feedback || [];
              const offer = selectedCandidateDetail.offer || selectedCandidateDetail.Offer;
              
              return (
                <Grid container spacing={2}>
                  {/* Candidate Basic Information */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      {candidate.firstName || candidate.FirstName || ""} {candidate.lastName || candidate.LastName || ""}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1, mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Basic Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Email</Typography>
                          <Typography variant="body1">{candidate.email || candidate.Email || "-"}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Phone</Typography>
                          <Typography variant="body1">{candidate.phone || candidate.Phone || "-"}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Experience (Years)</Typography>
                          <Typography variant="body1">{candidate.experienceYears !== undefined ? candidate.experienceYears : (candidate.ExperienceYears !== undefined ? candidate.ExperienceYears : "-")}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Current Company</Typography>
                          <Typography variant="body1">{candidate.currentCompany || candidate.CurrentCompany || "-"}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Source</Typography>
                          <Typography variant="body1">{candidate.source || candidate.Source || "Direct"}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip
                            label={
                              candidate.status === 0 || candidate.Status === 0 ? "Applied" :
                              candidate.status === 1 || candidate.Status === 1 ? "Shortlisted" :
                              candidate.status === 2 || candidate.Status === 2 ? "Interviewing" :
                              candidate.status === 3 || candidate.Status === 3 ? "Offered" :
                              candidate.status === 4 || candidate.Status === 4 ? "Hired" :
                              candidate.status === 5 || candidate.Status === 5 ? "Rejected" :
                              candidate.status === 6 || candidate.Status === 6 ? "Withdrawn" :
                              "Applied"
                            }
                            size="small"
                            color={
                              candidate.status === 4 || candidate.Status === 4 ? "success" :
                              candidate.status === 5 || candidate.status === 6 || candidate.Status === 5 || candidate.Status === 6 ? "error" :
                              candidate.status === 2 || candidate.Status === 2 ? "info" :
                              "default"
                            }
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Stage</Typography>
                          <Typography variant="body1">
                            {candidate.stage === 0 || candidate.Stage === 0 ? "Sourcing" :
                             candidate.stage === 1 || candidate.Stage === 1 ? "Screening" :
                             candidate.stage === 2 || candidate.Stage === 2 ? "Interview" :
                             candidate.stage === 3 || candidate.Stage === 3 ? "Offer" :
                             candidate.stage === 4 || candidate.Stage === 4 ? "Hired" :
                             candidate.stage === 5 || candidate.Stage === 5 ? "Rejected" :
                             "Sourcing"}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Applied On</Typography>
                          <Typography variant="body1">{formatDate(candidate.appliedOn || candidate.AppliedOn)}</Typography>
                        </Grid>
                        {candidate.notes || candidate.Notes ? (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">Notes</Typography>
                            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>{candidate.notes || candidate.Notes || "-"}</Typography>
                          </Grid>
                        ) : null}
                      </Grid>
                    </Box>
                  </Grid>

                  {/* Stage History Section */}
                  {stageHistory.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        Stage History
                      </Typography>
                      <ModernTable
                        columns={[
                          { id: "fromStage", label: "From Stage", render: (value) => {
                            const stageMap = { 0: "Sourcing", 1: "Screening", 2: "Interview", 3: "Offer", 4: "Hired", 5: "Rejected" };
                            return stageMap[value] || value;
                          }},
                          { id: "toStage", label: "To Stage", render: (value) => {
                            const stageMap = { 0: "Sourcing", 1: "Screening", 2: "Interview", 3: "Offer", 4: "Hired", 5: "Rejected" };
                            return stageMap[value] || value;
                          }},
                          { id: "comment", label: "Comment" },
                          { id: "changedOn", label: "Changed On", render: (value) => formatDate(value) },
                        ]}
                        rows={stageHistory.map(history => ({
                          id: history.id || history.Id,
                          fromStage: history.fromStage !== undefined ? history.fromStage : (history.FromStage !== undefined ? history.FromStage : 0),
                          toStage: history.toStage !== undefined ? history.toStage : (history.ToStage !== undefined ? history.ToStage : 0),
                          comment: history.comment || history.Comment || "-",
                          changedOn: history.changedOn || history.ChangedOn,
                        }))}
                        emptyMessage="No stage history available"
                      />
                    </Grid>
                  )}
                
                  {/* Interviews Section */}
                  {interviewSlots.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        Interviews
                      </Typography>
                      <ModernTable
                        columns={[
                          { id: "scheduledStart", label: "Start Time", render: (value) => formatDate(value) },
                          { id: "scheduledEnd", label: "End Time", render: (value) => formatDate(value) },
                          { id: "mode", label: "Mode" },
                          { id: "location", label: "Location" },
                          { id: "status", label: "Status" },
                        ]}
                        rows={interviewSlots.map(slot => ({
                          id: slot.id || slot.Id,
                          scheduledStart: slot.scheduledStart || slot.ScheduledStart,
                          scheduledEnd: slot.scheduledEnd || slot.ScheduledEnd,
                          mode: slot.mode || slot.Mode || "Virtual",
                          location: slot.location || slot.Location || "-",
                          status: slot.status || slot.Status || "Scheduled",
                        }))}
                        emptyMessage="No interviews scheduled"
                      />
                    </Grid>
                  )}

                  {/* Interview Feedback Section */}
                  {feedback.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        Interview Feedback
                      </Typography>
                      <ModernTable
                        columns={[
                          { id: "overallScore", label: "Overall Score", render: (value) => value !== undefined ? value.toFixed(1) : "-" },
                          { id: "recommendation", label: "Recommendation" },
                          { id: "comments", label: "Comments" },
                          { id: "submittedOn", label: "Submitted On", render: (value) => formatDate(value) },
                        ]}
                        rows={feedback.map(fb => ({
                          id: fb.id || fb.Id,
                          overallScore: fb.overallScore !== undefined ? fb.overallScore : (fb.OverallScore !== undefined ? fb.OverallScore : 0),
                          recommendation: fb.recommendation || fb.Recommendation || "Undecided",
                          comments: fb.comments || fb.Comments || "-",
                          submittedOn: fb.submittedOn || fb.SubmittedOn,
                        }))}
                        emptyMessage="No feedback available"
                      />
                    </Grid>
                  )}

                  {/* Offer Section */}
                  {offer && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Job Offer
                    </Typography>
                    <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Offer Number</Typography>
                          <Typography variant="body1">{offer.offerNumber || offer.OfferNumber || "-"}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Salary</Typography>
                          <Typography variant="body1">
                            {formatCurrencyWithSymbol(offer.salary || offer.Salary || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Join Date</Typography>
                          <Typography variant="body1">{formatDate(offer.joinDate || offer.JoinDate)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip
                            label={offer.status || offer.Status || "Draft"}
                            size="small"
                            color={
                              (offer.status || offer.Status) === "Accepted" || (offer.status || offer.Status) === 2 ? "success" :
                              (offer.status || offer.Status) === "Declined" || (offer.status || offer.Status) === 3 ? "error" :
                              "default"
                            }
                          />
                        </Grid>
                        {((offer.status === "Sent" || offer.Status === "Sent" || offer.status === 1 || offer.Status === 1)) && (
                          <Grid item xs={12}>
                            <Box display="flex" gap={1}>
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={async () => {
                                  try {
                                    const headers = createAuthHeaders();
                                    const offerId = offer.id || offer.Id;
                                    const response = await fetch(
                                      `${BASE_URL}/hr/recruitment/offers/${offerId}/actions`,
                                      {
                                        method: "POST",
                                        headers: {
                                          ...headers,
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          Action: "ACCEPT",
                                          OrgId: getOrgId() || 0,
                                        }),
                                      }
                                    );
                                    const responseData = await response.json();
                                    if (response.ok) {
                                      toast.success("Offer accepted! Candidate will be hired.");
                                      setCandidateDetailOpen(false);
                                      setSelectedCandidateDetail(null);
                                      await loadCandidates();
                                      await loadRecruitmentData();
                                    } else {
                                      toast.error(responseData.message || responseData.Message || "Failed to accept offer");
                                    }
                                  } catch (error) {
                                    toast.error("Error accepting offer");
                                  }
                                }}
                              >
                                Accept Offer
                              </Button>
                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={async () => {
                                  try {
                                    const headers = createAuthHeaders();
                                    const offerId = offer.id || offer.Id;
                                    const response = await fetch(
                                      `${BASE_URL}/hr/recruitment/offers/${offerId}/actions`,
                                      {
                                        method: "POST",
                                        headers: {
                                          ...headers,
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          Action: "DECLINE",
                                          OrgId: getOrgId() || 0,
                                        }),
                                      }
                                    );
                                    const responseData = await response.json();
                                    if (response.ok) {
                                      toast.success("Offer declined");
                                      setCandidateDetailOpen(false);
                                      setSelectedCandidateDetail(null);
                                      await loadCandidates();
                                      await loadRecruitmentData();
                                    } else {
                                      toast.error(responseData.message || responseData.Message || "Failed to decline offer");
                                    }
                                  } catch (error) {
                                    toast.error("Error declining offer");
                                  }
                                }}
                              >
                                Decline Offer
                              </Button>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Grid>
                  )}
                </Grid>
              );
            })()}
          </FormDialog>

          {/* Filtered Candidates Dialog */}
          <FormDialog
            open={filteredCandidatesDialogOpen}
            onClose={() => {
              setFilteredCandidatesDialogOpen(false);
              setFilteredCandidates([]);
              setFilteredCandidatesTitle("");
            }}
            title={filteredCandidatesTitle}
            submitLabel="Close"
            onSubmit={(e) => {
              e.preventDefault();
              setFilteredCandidatesDialogOpen(false);
              setFilteredCandidates([]);
              setFilteredCandidatesTitle("");
            }}
            maxWidth="lg"
          >
            <ModernTable
              columns={[
                { id: "name", label: "Name", render: (_, row) => `${row.firstName || ""} ${row.lastName || ""}`.trim() || "-" },
                { id: "email", label: "Email" },
                { id: "phone", label: "Phone" },
                { id: "jobOpening", label: "Job Opening", render: (_, row) => row.jobOpeningTitle || "-" },
                {
                  id: "status",
                  label: "Status",
                  render: (value) => {
                    const statusLabels = {
                      0: "Applied",
                      1: "Shortlisted",
                      2: "Interviewing",
                      3: "Offered",
                      4: "Hired",
                      5: "Rejected",
                      6: "Withdrawn",
                    };
                    return (
                      <Chip
                        label={statusLabels[value] || "Applied"}
                        size="small"
                        color={
                          value === 4 ? "success" :
                          value === 5 || value === 6 ? "error" :
                          value === 2 ? "info" :
                          "default"
                        }
                        sx={{ fontWeight: 600 }}
                      />
                    );
                  },
                },
                { id: "source", label: "Source" },
                {
                  id: "actions",
                  label: "Actions",
                  align: "center",
                  render: (_, row) => {
                    const candidate = filteredCandidates.find(c => 
                      String(c.id || c.Id || c.internalId || c.InternalId) === String(row.id)
                    );
                    return (
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={async () => {
                              if (candidate) {
                                setLoadingCandidateDetail(true);
                                try {
                                  const headers = createAuthHeaders();
                                  const response = await fetch(
                                    `${BASE_URL}/hr/recruitment/candidates/${row.id}`,
                                    { headers }
                                  );
                                  if (response.ok) {
                                    const data = await response.json();
                                    console.log("Candidate detail response:", data);
                                    const detailData = data.result || data.data || data;
                                    setSelectedCandidateDetail(detailData);
                                    setCandidateDetailOpen(true);
                                    setFilteredCandidatesDialogOpen(false);
                                  } else {
                                    const errorText = await response.text();
                                    console.error("Failed to load candidate details:", response.status, errorText);
                                    toast.error("Failed to load candidate details");
                                  }
                                } catch (error) {
                                  console.error("Error loading candidate details:", error);
                                  toast.error("Error loading candidate details");
                                } finally {
                                  setLoadingCandidateDetail(false);
                                }
                              }
                            }}
                          >
                            <PeopleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    );
                  },
                },
              ]}
              rows={filteredCandidates.map((candidate) => {
                // Find job opening title
                const jobOpening = jobOpenings.find(
                  item => (item.jobOpening?.id || item.jobOpening?.Id) === candidate.jobOpeningId
                );
                const jobOpeningTitle = jobOpening?.jobOpening?.title || jobOpening?.jobOpening?.Title || "-";
                
                return {
                  id: candidate.id || candidate.Id || candidate.internalId || candidate.InternalId,
                  firstName: candidate.firstName || candidate.FirstName || "",
                  lastName: candidate.lastName || candidate.LastName || "",
                  email: candidate.email || candidate.Email || "-",
                  phone: candidate.phone || candidate.Phone || "-",
                  jobOpeningTitle: jobOpeningTitle,
                  status: candidate.status !== undefined ? candidate.status : (candidate.Status !== undefined ? candidate.Status : 0),
                  source: candidate.source || candidate.Source || "Direct",
                };
              })}
              emptyMessage={`No ${filteredCandidatesTitle.toLowerCase()} found.`}
            />
          </FormDialog>
        </>
      )}
    </>
  );
};

export default Recruitment;

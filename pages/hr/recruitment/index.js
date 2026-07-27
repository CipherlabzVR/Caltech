import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import SearchIcon from "@mui/icons-material/Search";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import {
  Box,
  CircularProgress,
  Divider,
  Grid,
  Typography,
  Chip,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
  Button,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  InputAdornment,
  Switch,
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
import { formatFileSize } from "@/components/utils/formatHelper";
import MetricCard from "@/components/HR/ModernCard";
import ModernTable from "@/components/HR/ModernTable";
import AddButton from "@/components/HR/AddButton";
import RecruitmentKanbanBoard from "@/components/HR/RecruitmentKanbanBoard";
import RecruitmentPaginationBar from "@/components/HR/RecruitmentPaginationBar";
import ActionButtons from "@/components/HR/ActionButtons";
import ConfirmDialog from "@/components/HR/ConfirmDialog";
import FormDialog from "@/components/HR/FormDialog";
import FormField from "@/components/HR/FormField";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import SendIcon from "@mui/icons-material/Send";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useCurrency } from "@/components/HR/CurrencyContext";

const HR_RECRUITMENT_DASHBOARD_VISIBLE_KEY = "hr-recruitment-dashboard-visible";

/** Add Candidate CV — keep in sync with `<input accept>` and submit checks. */
const CANDIDATE_CV_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const CANDIDATE_CV_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function isAllowedCandidateCvFile(file) {
  if (!file?.name) return false;
  return /\.(pdf|docx?)$/i.test(file.name);
}

/** Latest non-cancelled interview slot (by scheduled start); used for interviewer notes. */
function getPrimaryInterviewSlotForNotes(interviewSlots) {
  if (!Array.isArray(interviewSlots) || interviewSlots.length === 0) return null;
  const normalized = interviewSlots.map((slot) => ({
    id: slot.id ?? slot.Id,
    scheduledStartMs: new Date(slot.scheduledStart || slot.ScheduledStart || 0).getTime(),
    status: String(slot.status || slot.Status || ""),
    interviewerNotes: slot.interviewerNotes ?? slot.InterviewerNotes ?? "",
  }));
  const active = normalized.filter((s) => s.status.toLowerCase() !== "cancelled");
  const list = (active.length > 0 ? active : normalized).sort(
    (a, b) => b.scheduledStartMs - a.scheduledStartMs
  );
  const first = list[0];
  return first && first.id != null ? first : null;
}

/** HrInterviewMode — matches ApexflowERP.Domain.Enums.HR.HrInterviewMode */
const INTERVIEW_MODE_LABELS = {
  0: "In Person",
  1: "Virtual",
  2: "Phone",
  InPerson: "In Person",
  Virtual: "Virtual",
  Phone: "Phone",
};

function getInterviewModeLabel(mode) {
  if (mode === undefined || mode === null || mode === "") return "-";
  if (Object.prototype.hasOwnProperty.call(INTERVIEW_MODE_LABELS, mode)) {
    return INTERVIEW_MODE_LABELS[mode];
  }
  const num = Number(mode);
  if (!Number.isNaN(num) && Object.prototype.hasOwnProperty.call(INTERVIEW_MODE_LABELS, num)) {
    return INTERVIEW_MODE_LABELS[num];
  }
  return String(mode);
}

/** Labels/colors for candidate list status chips (main + filtered dialogs). */
function getCandidateListStatusChipProps(value, row) {
  const statusRaw = row?.status !== undefined ? row.status : value;
  const stageRaw =
    row?.stage !== undefined ? row.stage : row?.Stage !== undefined ? row.Stage : undefined;
  const statusNum = Number(statusRaw);
  const statusStrNorm =
    typeof statusRaw === "string"
      ? String(statusRaw).toLowerCase().replace(/\s+/g, "")
      : "";
  const stageNum = Number(stageRaw);
  const stageStr =
    typeof stageRaw === "string" ? String(stageRaw).toLowerCase() : "";

  const isInOnboarding =
    (!Number.isNaN(statusNum) && statusNum === 7) ||
    statusStrNorm === "inonboarding" ||
    (!Number.isNaN(stageNum) && stageNum === 8) ||
    stageStr === "onboarding";

  const isInterviewedStage =
    !isInOnboarding && !Number.isNaN(stageNum) && stageNum === 7;

  const statusLabels = {
    0: "Applied",
    1: "Shortlisted",
    2: "Interviewing",
    3: "Offered",
    4: "Hired",
    5: "Rejected",
    6: "Withdrawn",
    7: "In Onboarding",
  };

  const label = isInOnboarding
    ? "In Onboarding"
    : isInterviewedStage
      ? "Interviewed"
      : statusLabels[!Number.isNaN(statusNum) ? statusNum : -1] || "Applied";

  const color = isInOnboarding
    ? "info"
    : isInterviewedStage
      ? "warning"
      : !Number.isNaN(statusNum) && statusNum === 4
        ? "success"
        : !Number.isNaN(statusNum) && (statusNum === 5 || statusNum === 6)
          ? "error"
          : !Number.isNaN(statusNum) && statusNum === 2
            ? "info"
            : "default";

  return { label, color };
}

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

/** Integer PK only — backend CycleId is int; never use Guid internalId here. */
function getCycleOptionValue(cycle) {
  const raw = cycle?.id ?? cycle?.Id;
  if (raw === undefined || raw === null || raw === "") return "";
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(n);
}

/** Map stored Location (warehouse id or legacy name) to warehouse id for the dropdown; returns "" if unknown. */
function resolveLocationToWarehouseId(raw, warehouseList) {
  if (raw === null || raw === undefined || !warehouseList?.length) return "";
  const s = String(raw).trim();
  if (!s) return "";
  const byId = warehouseList.find((w) => String(w.id ?? w.Id ?? "") === s);
  if (byId) return String(byId.id ?? byId.Id ?? "");
  const byName = warehouseList.find(
    (w) => String(w.name ?? w.Name ?? "").toLowerCase() === s.toLowerCase()
  );
  if (byName) return String(byName.id ?? byName.Id ?? "");
  return "";
}

const Recruitment = () => {
  const { currency, formatCurrencyWithSymbol, formatAmountForCurrency } = useCurrency();
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

  const { navigate, create, update, remove, approve1 } = IsPermissionEnabled(categoryId);

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
  const [warehouses, setWarehouses] = useState([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  /** Full candidate list for dashboard metrics and metric-card dialogs (not paged). */
  const [dashboardCandidates, setDashboardCandidates] = useState([]);
  const [hiredCandidates, setHiredCandidates] = useState([]);
  const [loadingHiredCandidates, setLoadingHiredCandidates] = useState(false);
  const [inOnboardingCandidates, setInOnboardingCandidates] = useState([]);
  const [loadingInOnboarding, setLoadingInOnboarding] = useState(false);
  const [inOnboardingTotalCount, setInOnboardingTotalCount] = useState(0);
  const [recruitmentCycleOptions, setRecruitmentCycleOptions] = useState([]);
  const [cyclesTotalCount, setCyclesTotalCount] = useState(0);
  const [cyclesPage, setCyclesPage] = useState(0);
  const [jobOpeningsTotalCount, setJobOpeningsTotalCount] = useState(0);
  const [jobOpeningsPage, setJobOpeningsPage] = useState(0);
  const [candidatesTotalCount, setCandidatesTotalCount] = useState(0);
  const [candidatesPage, setCandidatesPage] = useState(0);
  const [hiredCandidatesTotalCount, setHiredCandidatesTotalCount] = useState(0);
  const [hiredCandidatesPage, setHiredCandidatesPage] = useState(0);
  /** jobOpeningId → title for candidate tables when job list is paged */
  const [jobOpeningTitles, setJobOpeningTitles] = useState({});
  /** Up to 500 openings for selects (Add Candidate / interview / offer), not the paged table list */
  const [jobOpeningFormOptions, setJobOpeningFormOptions] = useState([]);
  const [jobOpeningsLoading, setJobOpeningsLoading] = useState(false);
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
    cvFile: null,
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
  const [markInterviewedLoading, setMarkInterviewedLoading] = useState(false);
  const [interviewerNotesDraft, setInterviewerNotesDraft] = useState("");
  const [interviewerNotesSaving, setInterviewerNotesSaving] = useState(false);
  
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
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [cycleDeleteDialogOpen, setCycleDeleteDialogOpen] = useState(false);
  const [cycleDeleteLoading, setCycleDeleteLoading] = useState(false);

  const [activeTab, setActiveTab] = useState(0);
  const [showRecruitmentDashboard, setShowRecruitmentDashboard] = useState(true);

  const [candidateCycleSearchQuery, setCandidateCycleSearchQuery] = useState("");
  const [candidateStatusFilter, setCandidateStatusFilter] = useState("all");

  const [cycleSearchQuery, setCycleSearchQuery] = useState("");
  const [cycleStatusFilter, setCycleStatusFilter] = useState("all");

  // Job openings tab: search + status filter (server-side via loadJobOpenings)
  const [jobOpeningSearchQuery, setJobOpeningSearchQuery] = useState("");
  const [jobOpeningStatusFilter, setJobOpeningStatusFilter] = useState("all");
  /** Shared page size for recruitment list API calls (cycles, openings, candidates, hired). */
  const [recruitmentPageSize, setRecruitmentPageSize] = useState(10);

  /** Kanban Applied→Interview: resolve/reject when Schedule Interview dialog completes or is dismissed. */
  const kanbanScheduleInterviewPromiseRef = useRef(null);

  /** Kanban Interviewed→Offer: resolve/reject when Create Job Offer dialog completes or is dismissed. */
  const kanbanInterviewedToOfferPromiseRef = useRef(null);

  const resolveKanbanScheduleInterviewFlow = useCallback(() => {
    const pending = kanbanScheduleInterviewPromiseRef.current;
    if (!pending) return;
    kanbanScheduleInterviewPromiseRef.current = null;
    pending.resolve();
  }, []);

  const rejectKanbanScheduleInterviewFlow = useCallback(() => {
    const pending = kanbanScheduleInterviewPromiseRef.current;
    if (!pending) return;
    kanbanScheduleInterviewPromiseRef.current = null;
    pending.reject(new Error("cancelled"));
  }, []);

  const handleKanbanAppliedToInterview = useCallback((ctx) => {
    return new Promise((resolve, reject) => {
      kanbanScheduleInterviewPromiseRef.current = { resolve, reject };
      setInterviewFormData({
        candidateId: String(ctx.candidateId ?? ""),
        jobOpeningId:
          ctx.jobOpeningId !== undefined && ctx.jobOpeningId !== null && ctx.jobOpeningId !== ""
            ? String(ctx.jobOpeningId)
            : "",
        scheduledStart: "",
        scheduledEnd: "",
        mode: "Virtual",
        location: "",
        interviewerIds: "",
      });
      setInterviewFormErrors({});
      setInterviewFormOpen(true);
    });
  }, []);

  const resolveKanbanInterviewedToOfferFlow = useCallback(() => {
    const pending = kanbanInterviewedToOfferPromiseRef.current;
    if (!pending) return;
    kanbanInterviewedToOfferPromiseRef.current = null;
    pending.resolve();
  }, []);

  const rejectKanbanInterviewedToOfferFlow = useCallback(() => {
    const pending = kanbanInterviewedToOfferPromiseRef.current;
    if (!pending) return;
    kanbanInterviewedToOfferPromiseRef.current = null;
    pending.reject(new Error("cancelled"));
  }, []);

  const handleKanbanInterviewedToOffer = useCallback((ctx) => {
    return new Promise((resolve, reject) => {
      kanbanInterviewedToOfferPromiseRef.current = { resolve, reject };
      const offerNumber = `OFF-${Date.now()}`;
      setOfferFormData({
        candidateId: String(ctx.candidateId ?? ""),
        jobOpeningId:
          ctx.jobOpeningId !== undefined && ctx.jobOpeningId !== null && ctx.jobOpeningId !== ""
            ? String(ctx.jobOpeningId)
            : "",
        offerNumber,
        salary: "",
        currency: currency || "USD",
        joinDate: "",
        sendImmediately: true,
      });
      setOfferFormErrors({});
      setOfferFormOpen(true);
    });
  }, [currency]);

  const handleOfferFormDialogClose = useCallback(() => {
    rejectKanbanInterviewedToOfferFlow();
    setOfferFormOpen(false);
  }, [rejectKanbanInterviewedToOfferFlow]);

  const handleInterviewFormDialogClose = useCallback(() => {
    rejectKanbanScheduleInterviewFlow();
    setInterviewFormOpen(false);
  }, [rejectKanbanScheduleInterviewFlow]);

  const loadRecruitmentCycles = useCallback(async () => {
    try {
      setLoadingCycles(true);
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      const params = new URLSearchParams();
      params.set("OrgId", String(orgId || 0));
      params.set("SkipCount", String(cyclesPage * recruitmentPageSize));
      params.set("MaxResultCount", String(recruitmentPageSize));
      if (cycleStatusFilter !== "all") {
        params.set("Status", cycleStatusFilter);
      }
      const cq = cycleSearchQuery.trim();
      if (cq) {
        params.set("Search", cq);
      }

      const response = await fetch(
        `${BASE_URL}/hr/recruitment/cycles?${params.toString()}`,
        { headers }
      );

      if (response.ok) {
        const jsonResponse = await response.json();
        const parsed = parsePagedResponse(jsonResponse);
        const cycles = parsed.items || [];
        setCyclesTotalCount(parsed.totalCount ?? 0);
        const normalizedCycles = cycles.map((cycle) => ({
          id: cycle.id ?? cycle.Id,
          internalId: cycle.internalId ?? cycle.InternalId,
          name:
            cycle.name ||
            cycle.Name ||
            `Cycle ${cycle.id ?? cycle.Id ?? cycle.internalId ?? cycle.InternalId ?? ""}`,
          startDate: cycle.startDate || cycle.StartDate,
          endDate: cycle.endDate || cycle.EndDate,
          status: cycle.status || cycle.Status || "Draft",
        }));
        setRecruitmentCycles(normalizedCycles);
      } else {
        setRecruitmentCycles([]);
        setCyclesTotalCount(0);
      }
    } catch (err) {
      console.error("Failed to load recruitment cycles:", err);
      setRecruitmentCycles([]);
      setCyclesTotalCount(0);
    } finally {
      setLoadingCycles(false);
    }
  }, [cyclesPage, cycleSearchQuery, cycleStatusFilter, recruitmentPageSize]);

  const loadRecruitmentCycleOptions = useCallback(async () => {
    try {
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      const params = new URLSearchParams();
      params.set("OrgId", String(orgId || 0));
      params.set("SkipCount", "0");
      params.set("MaxResultCount", "500");
      const response = await fetch(
        `${BASE_URL}/hr/recruitment/cycles?${params.toString()}`,
        { headers }
      );
      if (!response.ok) {
        setRecruitmentCycleOptions([]);
        return;
      }
      const parsed = parsePagedResponse(await response.json());
      const cycles = parsed.items || [];
      setRecruitmentCycleOptions(
        cycles.map((cycle) => ({
          id: cycle.id ?? cycle.Id,
          internalId: cycle.internalId ?? cycle.InternalId,
          name:
            cycle.name ||
            cycle.Name ||
            `Cycle ${cycle.id ?? cycle.Id ?? cycle.internalId ?? cycle.InternalId ?? ""}`,
          startDate: cycle.startDate || cycle.StartDate,
          endDate: cycle.endDate || cycle.EndDate,
          status: cycle.status || cycle.Status || "Draft",
        }))
      );
    } catch {
      setRecruitmentCycleOptions([]);
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

  const loadWarehouses = useCallback(async () => {
    try {
      setLoadingWarehouses(true);
      const headers = createAuthHeaders();
      const response = await fetch(`${BASE_URL}/Warehouse/GetAllWarehouse`, {
        headers,
      });
      if (response.ok) {
        const jsonResponse = await response.json();
        const list = Array.isArray(jsonResponse?.result)
          ? jsonResponse.result
          : Array.isArray(jsonResponse)
            ? jsonResponse
            : [];
        setWarehouses(list);
        return list;
      }
      console.error("Failed to load warehouses:", response.status, response.statusText);
      setWarehouses([]);
      return [];
    } catch (err) {
      console.error("Failed to load warehouses:", err);
      setWarehouses([]);
      return [];
    } finally {
      setLoadingWarehouses(false);
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

      const analyticsResponse = await fetch(
        `${BASE_URL}/hr/recruitment/analytics?OrgId=${orgId || 0}`,
        { headers }
      );

      if (!analyticsResponse.ok) {
        throw new Error("Unable to load recruitment analytics");
      }

      const analyticsPayload = parseObjectResponse(await analyticsResponse.json());

      setAnalytics({
        applicantsCount: analyticsPayload.applicantsCount ?? 0,
        interviewedCount: analyticsPayload.interviewedCount ?? 0,
        offeredCount: analyticsPayload.offeredCount ?? 0,
        hiredCount: analyticsPayload.hiredCount ?? 0,
        averageTimeToHire: analyticsPayload.averageTimeToHire ?? 0,
        offerAcceptanceRate: analyticsPayload.offerAcceptanceRate ?? 0,
        costPerHire: analyticsPayload.costPerHire ?? 0,
      });
    } catch (err) {
      setError(err.message || "Failed to load recruitment data");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const loadJobOpenings = useCallback(async () => {
    if (!navigate) return;
    try {
      setJobOpeningsLoading(true);
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      const params = new URLSearchParams();
      params.set("OrgId", String(orgId || 0));
      params.set("SkipCount", String(jobOpeningsPage * recruitmentPageSize));
      params.set("MaxResultCount", String(recruitmentPageSize));
      params.set("IncludePublic", "true");
      if (jobOpeningStatusFilter !== "all") {
        params.set("Status", jobOpeningStatusFilter);
      }
      const sq = jobOpeningSearchQuery.trim();
      if (sq) {
        params.set("Search", sq);
      }

      const response = await fetch(
        `${BASE_URL}/hr/recruitment/job-openings?${params.toString()}`,
        { headers }
      );
      if (!response.ok) {
        setJobOpenings([]);
        setJobOpeningsTotalCount(0);
        return;
      }
      const openingsPayload = parsePagedResponse(await response.json());
      setJobOpeningsTotalCount(openingsPayload.totalCount ?? 0);
      setJobOpenings(openingsPayload.items ?? []);
    } catch (err) {
      console.error("Failed to load job openings:", err);
      setJobOpenings([]);
      setJobOpeningsTotalCount(0);
    } finally {
      setJobOpeningsLoading(false);
    }
  }, [navigate, jobOpeningsPage, jobOpeningSearchQuery, jobOpeningStatusFilter, recruitmentPageSize]);

  const loadJobOpeningTitlesIndex = useCallback(async () => {
    try {
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      const params = new URLSearchParams();
      params.set("OrgId", String(orgId || 0));
      params.set("SkipCount", "0");
      params.set("MaxResultCount", "500");
      params.set("IncludePublic", "true");
      const response = await fetch(
        `${BASE_URL}/hr/recruitment/job-openings?${params.toString()}`,
        { headers }
      );
      if (!response.ok) return;
      const parsed = parsePagedResponse(await response.json());
      const next = {};
      const opts = [];
      (parsed.items || []).forEach((item) => {
        const jo = item.jobOpening || item;
        const id = jo?.id ?? jo?.Id;
        const t = jo?.title ?? jo?.Title;
        if (id != null) {
          const sid = String(id);
          next[sid] = t || "-";
          opts.push({
            value: sid,
            label: t || `Job Opening ${sid}`,
          });
        }
      });
      setJobOpeningTitles(next);
      setJobOpeningFormOptions(opts);
    } catch {
      /* ignore */
    }
  }, []);

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

  const loadDashboardCandidates = useCallback(async () => {
    try {
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      const params = new URLSearchParams();
      params.set("OrgId", String(orgId || 0));
      params.set("SkipCount", "0");
      params.set("MaxResultCount", "500");
      const response = await fetch(
        `${BASE_URL}/hr/recruitment/candidates?${params.toString()}`,
        { headers }
      );
      if (!response.ok) {
        setDashboardCandidates([]);
        return;
      }
      const parsed = parsePagedResponse(await response.json());
      setDashboardCandidates(parsed.items || []);
    } catch {
      setDashboardCandidates([]);
    }
  }, []);

  const loadCandidatesPage = useCallback(async () => {
    try {
      setLoadingCandidates(true);
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      const params = new URLSearchParams();
      params.set("OrgId", String(orgId || 0));
      params.set("SkipCount", String(candidatesPage * recruitmentPageSize));
      params.set("MaxResultCount", String(recruitmentPageSize));

      const cf = candidateStatusFilter;
      if (cf === "interviewed") {
        params.set("Stage", "Interviewed");
      } else if (cf === "2") {
        params.set("Status", "Interviewing");
        params.set("ExcludeInterviewedStage", "true");
      } else if (cf !== "all") {
        const candidateStatusFilterToApi = {
          "0": "Applied",
          "3": "Offered",
          "4": "Hired",
          "5": "Rejected",
          "7": "InOnboarding",
        };
        const apiStatus = candidateStatusFilterToApi[cf];
        if (apiStatus) {
          params.set("Status", apiStatus);
        }
      }

      const cs = candidateCycleSearchQuery.trim();
      if (cs) {
        params.set("CycleSearch", cs);
      }

      const response = await fetch(
        `${BASE_URL}/hr/recruitment/candidates?${params.toString()}`,
        { headers }
      );
      if (!response.ok) {
        setCandidates([]);
        setCandidatesTotalCount(0);
        return;
      }
      const parsed = parsePagedResponse(await response.json());
      setCandidatesTotalCount(parsed.totalCount ?? 0);
      setCandidates(parsed.items || []);
    } catch (err) {
      console.error("Error loading candidates:", err);
      setCandidates([]);
      setCandidatesTotalCount(0);
    } finally {
      setLoadingCandidates(false);
    }
  }, [candidatesPage, candidateStatusFilter, candidateCycleSearchQuery, recruitmentPageSize]);

  const loadHiredCandidatesPage = useCallback(async () => {
    try {
      setLoadingHiredCandidates(true);
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      const params = new URLSearchParams();
      params.set("OrgId", String(orgId || 0));
      params.set("SkipCount", String(hiredCandidatesPage * recruitmentPageSize));
      params.set("MaxResultCount", String(recruitmentPageSize));
      params.set("Status", "Hired");

      const response = await fetch(
        `${BASE_URL}/hr/recruitment/candidates?${params.toString()}`,
        { headers }
      );
      if (!response.ok) {
        setHiredCandidates([]);
        setHiredCandidatesTotalCount(0);
        return;
      }
      const parsed = parsePagedResponse(await response.json());
      setHiredCandidatesTotalCount(parsed.totalCount ?? 0);
      setHiredCandidates(parsed.items || []);
    } catch {
      setHiredCandidates([]);
      setHiredCandidatesTotalCount(0);
    } finally {
      setLoadingHiredCandidates(false);
    }
  }, [hiredCandidatesPage, recruitmentPageSize]);

  const loadInOnboardingCandidatesPage = useCallback(async () => {
    try {
      setLoadingInOnboarding(true);
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      const params = new URLSearchParams();
      params.set("OrgId", String(orgId || 0));
      params.set("SkipCount", "0");
      params.set("MaxResultCount", "200");
      params.set("Status", "InOnboarding");
      const response = await fetch(
        `${BASE_URL}/hr/recruitment/candidates?${params.toString()}`,
        { headers }
      );
      if (!response.ok) { setInOnboardingCandidates([]); setInOnboardingTotalCount(0); return; }
      const parsed = parsePagedResponse(await response.json());
      setInOnboardingTotalCount(parsed.totalCount ?? 0);
      setInOnboardingCandidates(parsed.items || []);
    } catch {
      setInOnboardingCandidates([]); setInOnboardingTotalCount(0);
    } finally {
      setLoadingInOnboarding(false);
    }
  }, [recruitmentPageSize]);

  const refreshRecruitmentCandidateData = useCallback(async () => {
    await Promise.all([
      loadRecruitmentData(),
      loadJobOpenings(),
      loadJobOpeningTitlesIndex(),
      loadRecruitmentCycles(),
      loadDashboardCandidates(),
      loadCandidatesPage(),
      loadHiredCandidatesPage(),
      loadInOnboardingCandidatesPage(),
    ]);
  }, [
    loadRecruitmentData,
    loadJobOpenings,
    loadJobOpeningTitlesIndex,
    loadRecruitmentCycles,
    loadDashboardCandidates,
    loadCandidatesPage,
    loadHiredCandidatesPage,
    loadInOnboardingCandidatesPage,
  ]);

  useEffect(() => {
    if (!navigate) return;
    loadRecruitmentData();
    loadDepartments();
    loadWarehouses();
    loadInterviews();
    loadOffers();
    loadRecruitmentCycleOptions();
    loadJobOpeningTitlesIndex();
  }, [
    navigate,
    loadRecruitmentData,
    loadDepartments,
    loadWarehouses,
    loadInterviews,
    loadOffers,
    loadRecruitmentCycleOptions,
    loadJobOpeningTitlesIndex,
  ]);

  useEffect(() => {
    if (!navigate) return;
    loadJobOpenings();
  }, [navigate, loadJobOpenings]);

  useEffect(() => {
    if (!navigate) return;
    loadRecruitmentCycles();
  }, [navigate, loadRecruitmentCycles]);

  useEffect(() => {
    if (!navigate) return;
    loadDashboardCandidates();
  }, [navigate, loadDashboardCandidates]);

  useEffect(() => {
    if (!navigate) return;
    loadCandidatesPage();
  }, [navigate, loadCandidatesPage]);

  useEffect(() => {
    if (!navigate) return;
    loadHiredCandidatesPage();
    loadInOnboardingCandidatesPage();
  }, [navigate, loadHiredCandidatesPage, loadInOnboardingCandidatesPage]);

  useEffect(() => {
    setCyclesPage(0);
  }, [cycleSearchQuery, cycleStatusFilter]);

  useEffect(() => {
    setJobOpeningsPage(0);
  }, [jobOpeningSearchQuery, jobOpeningStatusFilter]);

  useEffect(() => {
    setCandidatesPage(0);
  }, [candidateCycleSearchQuery, candidateStatusFilter]);

  useEffect(() => {
    setCyclesPage(0);
    setJobOpeningsPage(0);
    setCandidatesPage(0);
    setHiredCandidatesPage(0);
  }, [recruitmentPageSize]);

  useEffect(() => {
    const eventName = "hr-recruitment-candidates-changed";
    const onCandidatesChanged = (event) => {
      const detail = event?.detail || {};
      if (detail.stageMove) {
        void Promise.all([
          loadDashboardCandidates(),
          loadCandidatesPage(),
          loadHiredCandidatesPage(),
          loadInOnboardingCandidatesPage(),
        ]);
      } else {
        void refreshRecruitmentCandidateData();
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener(eventName, onCandidatesChanged);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(eventName, onCandidatesChanged);
      }
    };
  }, [
    refreshRecruitmentCandidateData,
    loadDashboardCandidates,
    loadCandidatesPage,
    loadHiredCandidatesPage,
    loadInOnboardingCandidatesPage,
  ]);

  useEffect(() => {
    if (!candidateDetailOpen || !selectedCandidateDetail) {
      setInterviewerNotesDraft("");
      return;
    }
    const slots =
      selectedCandidateDetail.interviewSlots || selectedCandidateDetail.InterviewSlots || [];
    const primary = getPrimaryInterviewSlotForNotes(slots);
    setInterviewerNotesDraft(
      primary ? String(primary.interviewerNotes ?? "") : ""
    );
  }, [candidateDetailOpen, selectedCandidateDetail]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(HR_RECRUITMENT_DASHBOARD_VISIBLE_KEY);
      if (raw !== null) {
        setShowRecruitmentDashboard(raw === "1" || raw === "true");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleRecruitmentDashboardToggle = useCallback(
    (event, checked) => {
      setShowRecruitmentDashboard(checked);
      if (checked && navigate) {
        loadRecruitmentCycleOptions();
      }
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            HR_RECRUITMENT_DASHBOARD_VISIBLE_KEY,
            checked ? "1" : "0"
          );
        } catch {
          /* ignore */
        }
      }
    },
    [navigate, loadRecruitmentCycleOptions]
  );

  // Handle metric card click to show filtered candidates
  const handleMetricCardClick = (cardTitle) => {
    let filtered = [];
    let title = "";
    
    switch (cardTitle) {
      case "Applicants":
        filtered = dashboardCandidates.filter(c => {
          const status = c.status !== undefined ? c.status : (c.Status !== undefined ? c.Status : 0);
          const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
          // Applied status (0) or Sourcing stage (1)
          return status === 0 || stage === 1;
        });
        title = "Applicants";
        break;
      case "Interview":
      case "Interviews":
        filtered = dashboardCandidates.filter(c => {
          const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
          // Backend HrRecruitmentStage.Interview = 3
          return Number(stage) === 3;
        });
        title = "Candidates in Interview Stage";
        break;
      case "Interviewed":
        filtered = dashboardCandidates.filter(c => {
          const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
          // Backend HrRecruitmentStage.Interviewed = 7
          return Number(stage) === 7;
        });
        title = "Candidates in Interviewed Stage";
        break;
      case "Offers":
        filtered = dashboardCandidates.filter(c => {
          const status = c.status !== undefined ? c.status : (c.Status !== undefined ? c.Status : 0);
          const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
          // Offered status (3) OR Offer stage (4)
          return status === 3 || stage === 4;
        });
        title = "Candidates with Offers";
        break;
      case "Hires":
        filtered = dashboardCandidates.filter(c => {
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
    
    setFilteredCandidates(filtered);
    setFilteredCandidatesTitle(title);
    setFilteredCandidatesDialogOpen(true);
  };

  // Dashboard metrics from a larger candidate snapshot (not the paged table list).
  const calculatedMetrics = useMemo(() => {
    const applicants = dashboardCandidates.filter(c => {
      const status = c.status !== undefined ? c.status : (c.Status !== undefined ? c.Status : 0);
      const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
      // Applied status (0) or Sourcing stage (1)
      return status === 0 || stage === 1;
    });

    const interviews = dashboardCandidates.filter(c => {
      const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
      // HrRecruitmentStage.Interview = 3 (active / scheduled interview)
      return Number(stage) === 3;
    });

    const interviewedStage = dashboardCandidates.filter(c => {
      const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
      // HrRecruitmentStage.Interviewed = 7 (post-interview, before offer)
      return Number(stage) === 7;
    });

    const offered = dashboardCandidates.filter(c => {
      const status = c.status !== undefined ? c.status : (c.Status !== undefined ? c.Status : 0);
      const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
      // Offered status (3) OR Offer stage (4)
      return status === 3 || stage === 4;
    });

    const hired = dashboardCandidates.filter(c => {
      const status = c.status !== undefined ? c.status : (c.Status !== undefined ? c.Status : 0);
      const stage = c.stage !== undefined ? c.stage : (c.Stage !== undefined ? c.Stage : 0);
      // Hired status (4) OR Hired stage (5)
      return status === 4 || stage === 5;
    });

    return {
      applicantsCount: applicants.length,
      interviewsCount: interviews.length,
      interviewedStageCount: interviewedStage.length,
      offeredCount: offered.length,
      hiredCount: hired.length,
    };
  }, [dashboardCandidates]);

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
        value: calculatedMetrics.interviewsCount,
        subtitle: "In interview stage",
        icon: <AssignmentIndIcon />,
        color: "info",
        onClick: () => handleMetricCardClick("Interviews"),
      },
      {
        title: "Interviewed",
        value: calculatedMetrics.interviewedStageCount,
        subtitle: "Interview completed, before offer",
        icon: <FactCheckIcon />,
        color: "warning",
        valueSx: { color: "warning.dark" },
        onClick: () => handleMetricCardClick("Interviewed"),
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

  /** Active cycles only for job opening dropdown; in edit mode, include current cycle if not Active so selection stays visible. */
  const jobOpeningCycleDropdownOptions = useMemo(() => {
    const activeOnly = recruitmentCycleOptions.filter(
      (c) => String(c.status || "").trim().toLowerCase() === "active"
    );
    if (formMode === "edit" && formData.cycleId) {
      const cid = String(formData.cycleId);
      const hasCurrent = activeOnly.some(
        (c) => getCycleOptionValue(c) === cid
      );
      if (!hasCurrent) {
        const fallback = recruitmentCycleOptions.find(
          (c) => getCycleOptionValue(c) === cid
        );
        if (fallback) {
          return [...activeOnly, fallback];
        }
      }
    }
    return activeOnly;
  }, [recruitmentCycleOptions, formMode, formData.cycleId]);

  /** Dashboard breakdown from loaded cycle options (up to API page size). */
  const recruitmentCycleDashboardStats = useMemo(() => {
    const list = recruitmentCycleOptions || [];
    let active = 0;
    let closed = 0;
    let draft = 0;
    for (const c of list) {
      const s = String(c.status || "").trim().toLowerCase();
      if (s === "active") active += 1;
      else if (s === "closed") closed += 1;
      else draft += 1;
    }
    return { total: list.length, active, closed, draft };
  }, [recruitmentCycleOptions]);

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
    });
    setFormErrors({});
    setFormOpen(true);
    loadRecruitmentCycles();
    loadRecruitmentCycleOptions();
    loadDepartments();
    loadWarehouses();
  };

  const handleEdit = async (item) => {
    const opening = item.jobOpening || item || {};
    const openingId = opening.id || opening.Id || opening.internalId || opening.InternalId;
    
    // Normalize status value
    const statusValue = opening.status !== undefined ? opening.status : 
                       (opening.Status !== undefined ? opening.Status : 0);
    
    // Map status value to status string
    const statusMap = { 0: "Draft", 1: "Published", 2: "Closed", 3: "OnHold", 4: "Filled" };
    const statusString = statusMap[statusValue] || "Draft";
    
    const warehouseList = await loadWarehouses();
    const rawLocation = opening.location ?? opening.Location ?? "";
    const locationField = resolveLocationToWarehouseId(rawLocation, warehouseList);
    
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
      location: locationField,
      tags: opening.tags || opening.Tags || "",
      status: statusString,
    });
    
    setFormErrors({});
    setFormOpen(true);
    loadRecruitmentCycles();
    loadRecruitmentCycleOptions();
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

      const parsedCycleId = Number.parseInt(String(formData.cycleId ?? "").trim(), 10);
      if (!Number.isFinite(parsedCycleId) || parsedCycleId <= 0) {
        toast.error("Please select a valid recruitment cycle.");
        setFormLoading(false);
        return;
      }
      
      const payload = {
        OrgId: orgIdValue,
        CycleId: parsedCycleId,
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
        Publish: String(formData.status || "").trim().toLowerCase() === "published",
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

      const rawText = await response.text();
      let responseData = {};
      try {
        responseData = rawText ? JSON.parse(rawText) : {};
      } catch {
        responseData = {};
      }

      const apiStatus =
        responseData.statusCode ?? responseData.StatusCode;
      const isLogicalSuccess =
        apiStatus === undefined ||
        apiStatus === 200 ||
        apiStatus === "200";

      console.log("Response from server:", responseData, "HTTP", response.status);

      if (responseData.result || responseData.data) {
        const inner = responseData.result ?? responseData.data;
        if (inner) {
          const savedStatus =
            inner.status !== undefined
              ? inner.status
              : inner.Status !== undefined
                ? inner.Status
                : "unknown";
          console.log("Saved job opening status:", savedStatus);
        }
      }

      if (!response.ok || !isLogicalSuccess) {
        const errorMessage =
          responseData.message ||
          responseData.Message ||
          responseData.title ||
          `Request failed (${response.status})`;
        throw new Error(errorMessage);
      }

      setFormOpen(false);
      toast.success(formMode === "add" ? "Job opening created successfully!" : "Job opening updated successfully!");

      await Promise.all([
        loadJobOpenings(),
        loadJobOpeningTitlesIndex(),
        loadRecruitmentData(),
      ]);
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
      const openingId = opening.id ?? opening.Id;
      if (openingId === undefined || openingId === null || openingId === "") {
        toast.error("Job opening id is missing. Cannot delete.");
        return;
      }

      const headers = createAuthHeaders();

      const response = await fetch(
        `${BASE_URL}/hr/recruitment/job-openings/${openingId}`,
        {
          method: "DELETE",
          headers,
        }
      );

      const responseData = await response.json().catch(() => ({}));
      const statusCode =
        responseData.statusCode ?? responseData.StatusCode;
      // Backend returns HTTP 200 for both success and logical failure; ApiResponse.StatusCode is 200 (SUCCESS) or -99 (FAILED).
      const isLogicalSuccess =
        response.ok &&
        (statusCode === undefined ||
          Number(statusCode) === 200 ||
          statusCode === "200");

      if (!isLogicalSuccess) {
        const msg =
          responseData.message ||
          responseData.Message ||
          `Failed to delete job opening (${response.status})`;
        throw new Error(msg);
      }

      setDeleteDialogOpen(false);
      setSelectedItem(null);

      toast.success("Job opening deleted successfully!");

      await Promise.all([
        loadJobOpenings(),
        loadJobOpeningTitlesIndex(),
        loadRecruitmentData(),
      ]);
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
      
      const isEdit = cycleFormMode === "edit";
      const cycleId = isEdit ? Number(selectedCycle?.id) : 0;

      if (isEdit && (!Number.isFinite(cycleId) || cycleId <= 0)) {
        toast.error("Invalid recruitment cycle selected for update.");
        setCycleFormLoading(false);
        return;
      }

      const payload = isEdit
        ? {
            CycleId: cycleId,
            Name: cycleFormData.name,
            StartDate: cycleFormData.startDate,
            EndDate: cycleFormData.endDate || null,
            Status: cycleFormData.status || "Draft",
          }
        : {
            OrgId: orgIdValue,
            Name: cycleFormData.name,
            StartDate: cycleFormData.startDate,
            EndDate: cycleFormData.endDate || null,
            Status: cycleFormData.status || "Draft",
          };

      const url = isEdit
        ? `${BASE_URL}/hr/recruitment/cycles/${cycleId}`
        : `${BASE_URL}/hr/recruitment/cycles`;
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let responseData = null;
      const rawText = await response.text();
      if (rawText) {
        try {
          responseData = JSON.parse(rawText);
        } catch {
          responseData = null;
        }
      }

      const statusCode =
        responseData?.statusCode ?? responseData?.StatusCode;
      const ok =
        response.ok && (statusCode === undefined || statusCode === 200);

      if (!ok) {
        const errorMessage =
          responseData?.message ||
          responseData?.Message ||
          responseData?.title ||
          (rawText && !responseData ? rawText : null) ||
          `Failed to save recruitment cycle (HTTP ${response.status})`;
        throw new Error(errorMessage);
      }

      setCycleFormOpen(false);
      toast.success(cycleFormMode === "add" ? "Recruitment cycle created successfully!" : "Recruitment cycle updated successfully!");
      
      // Reload cycles, dropdown options, and job openings
      await loadRecruitmentCycles();
      await loadRecruitmentCycleOptions();
      await loadRecruitmentData();
    } catch (error) {
      toast.error(error.message || "Failed to save recruitment cycle");
    } finally {
      setCycleFormLoading(false);
    }
  };

  const toDateInputValue = (value) => {
    if (!value) return "";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "";
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return "";
    }
  };

  const handleCycleEdit = (cycle) => {
    if (!cycle) return;
    setSelectedCycle(cycle);
    setCycleFormMode("edit");
    setCycleFormData({
      name: cycle.name || "",
      startDate: toDateInputValue(cycle.startDate),
      endDate: toDateInputValue(cycle.endDate),
      status: cycle.status || "Draft",
    });
    setCycleFormErrors({});
    setCycleFormOpen(true);
  };

  const handleCycleDelete = (cycle) => {
    if (!cycle) return;
    setSelectedCycle(cycle);
    setCycleDeleteDialogOpen(true);
  };

  const confirmCycleDelete = async () => {
    if (!selectedCycle) return;
    const cycleId = Number(selectedCycle.id);
    if (!Number.isFinite(cycleId) || cycleId <= 0) {
      toast.error("Invalid recruitment cycle.");
      return;
    }

    setCycleDeleteLoading(true);
    try {
      const headers = createAuthHeaders();
      const response = await fetch(
        `${BASE_URL}/hr/recruitment/cycles/${cycleId}`,
        {
          method: "DELETE",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
        }
      );

      let responseData = null;
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      const statusCode = responseData?.statusCode ?? responseData?.StatusCode;
      const ok =
        response.ok && (statusCode === undefined || statusCode === 200);

      if (!ok) {
        const errorMessage =
          responseData?.message ||
          responseData?.Message ||
          responseData?.title ||
          "Failed to delete recruitment cycle";
        throw new Error(errorMessage);
      }

      toast.success(
        responseData?.message ||
          responseData?.Message ||
          "Recruitment cycle deleted successfully!"
      );
      setCycleDeleteDialogOpen(false);
      setSelectedCycle(null);
      await loadRecruitmentCycleOptions();
      await refreshRecruitmentCandidateData();
    } catch (error) {
      toast.error(error.message || "Failed to delete recruitment cycle");
    } finally {
      setCycleDeleteLoading(false);
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

          {activeTab !== 4 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                mb: showRecruitmentDashboard ? 2 : 1,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={showRecruitmentDashboard}
                    onChange={handleRecruitmentDashboardToggle}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Hide dashboard
                  </Typography>
                }
                labelPlacement="start"
                sx={{ mr: 0, userSelect: "none" }}
              />
            </Box>
          )}

          {activeTab !== 4 && showRecruitmentDashboard && (
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "grid",
                gap: 3,
                mb: 3,
                alignItems: "stretch",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(5, minmax(0, 1fr))",
                },
              }}
            >
              {summaryCards.map((card) => (
                <Box key={card.title} sx={{ display: "flex", minWidth: 0 }}>
                  <MetricCard {...card} />
                </Box>
              ))}
            </Box>
            <Grid container spacing={3}>
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
                  title="Recruitment Cycles"
                  value={`${recruitmentCycleDashboardStats.total} cycle${recruitmentCycleDashboardStats.total === 1 ? "" : "s"}`}
                  subtitle={`Active: ${recruitmentCycleDashboardStats.active} · Closed: ${recruitmentCycleDashboardStats.closed} · Draft: ${recruitmentCycleDashboardStats.draft}`}
                  icon={<EventRepeatIcon />}
                  color="error"
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
            </Grid>
          </Box>
          )}

          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              mb: 3,
              bgcolor: "background.paper",
              borderRadius: 1,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTab-root": {
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.95rem",
                  minHeight: 48,
                },
              }}
            >
              <Tab label="Recruitment Cycles" />
              <Tab label="Job Openings" />
              <Tab label="Candidates" />
              <Tab label="Onboarding & Hired" />
              <Tab label="Kanban Board" />
            </Tabs>
          </Box>

          {activeTab === 0 && (
          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
                Recruitment Cycles
              </Typography>
              {create && (
                <AddButton label="Add Cycle" onClick={() => {
                  setSelectedCycle(null);
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
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                alignItems: "center",
                mb: 2,
              }}
            >
              <TextField
                size="small"
                placeholder="Search by cycle name or ID…"
                value={cycleSearchQuery}
                onChange={(e) => setCycleSearchQuery(e.target.value)}
                sx={{ flexGrow: 1, minWidth: 220, maxWidth: { sm: 400 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                size="small"
                label="Status"
                value={cycleStatusFilter}
                onChange={(e) => setCycleStatusFilter(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="all">All statuses</MenuItem>
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
              </TextField>
              {(cycleSearchQuery.trim() !== "" || cycleStatusFilter !== "all") && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    setCycleSearchQuery("");
                    setCycleStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </Box>

            <ModernTable
              columns={[
                { id: "name", label: "Cycle Name" },
                { id: "startDate", label: "Start Date", render: (value) => formatDate(value) },
                { id: "endDate", label: "End Date", render: (value) => formatDate(value) },
                {
                  id: "status",
                  label: "Status",
                  render: (value) => {
                    const chipColor = value === "Active" ? "success" : "default";
                    return (
                    <Chip
                      label={value || "Draft"}
                      size="small"
                      color={chipColor}
                      sx={(theme) => ({
                        fontWeight: 600,
                        ...(chipColor !== "default"
                          ? {
                              backgroundColor: `${theme.palette[chipColor].main}1F`,
                              color: theme.palette[chipColor].dark,
                            }
                          : {
                              backgroundColor: `${theme.palette.grey[500]}1A`,
                              color: theme.palette.text.secondary,
                            }),
                      })}
                    />
                    );
                  },
                },
                {
                  id: "actions",
                  label: "Actions",
                  align: "right",
                  render: (_, row) => (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <ActionButtons
                        onEdit={() => handleCycleEdit(row._originalCycle || row)}
                        onDelete={() => handleCycleDelete(row._originalCycle || row)}
                        showEdit={update}
                        showDelete={remove}
                      />
                    </Box>
                  ),
                },
              ]}
              rows={recruitmentCycles.map((cycle) => ({
                id: cycle.id || cycle.internalId,
                name: cycle.name || "-",
                startDate: cycle.startDate,
                endDate: cycle.endDate,
                status: cycle.status,
                _originalCycle: cycle,
              }))}
              emptyMessage={
                cyclesTotalCount === 0
                  ? "No recruitment cycles available. Create one to get started."
                  : "No cycles match your search or status filter."
              }
            />
            {cyclesTotalCount > 0 && (
              <RecruitmentPaginationBar
                idSuffix="cycles"
                totalCount={cyclesTotalCount}
                page={cyclesPage}
                onPageChange={setCyclesPage}
                pageSize={recruitmentPageSize}
                onPageSizeChange={setRecruitmentPageSize}
              />
            )}
          </Box>
          )}

          {activeTab === 1 && (
          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
                Recent Job Openings
              </Typography>
            {create && <AddButton label="Add Job Opening" onClick={handleAdd} />}
            </Box>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                alignItems: "center",
                mb: 2,
              }}
            >
              <TextField
                size="small"
                placeholder="Search by title or department…"
                value={jobOpeningSearchQuery}
                onChange={(e) => setJobOpeningSearchQuery(e.target.value)}
                sx={{ flexGrow: 1, minWidth: 220, maxWidth: { sm: 400 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                size="small"
                label="Status"
                value={jobOpeningStatusFilter}
                onChange={(e) => setJobOpeningStatusFilter(String(e.target.value))}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="all">All statuses</MenuItem>
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Published">Published</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
                <MenuItem value="OnHold">On Hold</MenuItem>
                <MenuItem value="Filled">Filled</MenuItem>
              </TextField>
              {(jobOpeningSearchQuery.trim() !== "" || jobOpeningStatusFilter !== "all") && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    setJobOpeningSearchQuery("");
                    setJobOpeningStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
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
                    const chipColor =
                      statusValue === 1
                        ? "success"
                        : statusValue === 3
                          ? "warning"
                          : "default";
                    return (
                    <Chip
                        label={statusLabel}
                      size="small"
                      color={chipColor}
                      sx={(theme) => ({
                        fontWeight: 600,
                        ...(chipColor !== "default"
                          ? {
                              backgroundColor: `${theme.palette[chipColor].main}1F`,
                              color: theme.palette[chipColor].dark,
                            }
                          : {
                              backgroundColor: `${theme.palette.grey[500]}1A`,
                              color: theme.palette.text.secondary,
                            }),
                      })}
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
                  align: "right",
                  render: (_, row) => (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <ActionButtons
                        onEdit={() => handleEdit(row._originalItem || row)}
                        onDelete={() => handleDelete(row._originalItem || row)}
                        showEdit={update}
                        showDelete={remove}
                      />
                    </Box>
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
              emptyMessage={
                jobOpeningsTotalCount === 0
                  ? "No job openings available"
                  : "No job openings match your search or status filter."
              }
            />
            {jobOpeningsTotalCount > 0 && (
              <RecruitmentPaginationBar
                idSuffix="job-openings"
                totalCount={jobOpeningsTotalCount}
                page={jobOpeningsPage}
                onPageChange={setJobOpeningsPage}
                pageSize={recruitmentPageSize}
                onPageSizeChange={setRecruitmentPageSize}
              />
            )}
          </Box>
          )}

          <FormDialog
            open={cycleFormOpen}
            onClose={() => setCycleFormOpen(false)}
            title={cycleFormMode === "edit" ? "Edit Recruitment Cycle" : "Add Recruitment Cycle"}
            onSubmit={handleCycleFormSubmit}
            submitLabel={cycleFormMode === "edit" ? "Update" : "Create"}
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
            open={cycleDeleteDialogOpen}
            onClose={() => {
              if (cycleDeleteLoading) return;
              setCycleDeleteDialogOpen(false);
              setSelectedCycle(null);
            }}
            onConfirm={confirmCycleDelete}
            title="Delete Recruitment Cycle"
            message={`Are you sure you want to delete "${selectedCycle?.name || 'this recruitment cycle'}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            confirmColor="error"
            loading={cycleDeleteLoading}
          />

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
                helperText={
                  formErrors.cycleId ||
                  (loadingCycles
                    ? "Loading cycles..."
                    : jobOpeningCycleDropdownOptions.length === 0
                      ? formMode === "add"
                        ? "No active recruitment cycles. Activate a cycle before adding a job opening."
                        : "No cycles available."
                      : "")
                }
                disabled={loadingCycles}
                options={loadingCycles 
                  ? [{ value: "", label: "Loading..." }]
                  : jobOpeningCycleDropdownOptions.length > 0 
                    ? jobOpeningCycleDropdownOptions.map((cycle) => ({
                        value: getCycleOptionValue(cycle),
                        label:
                          cycle.name ||
                          `Cycle ${getCycleOptionValue(cycle) || "?"}`,
                      })).filter((opt) => opt.value !== "")
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
                type="select"
                value={formData.location ?? ""}
                onChange={handleFormChange}
                disabled={loadingWarehouses}
                helperText={
                  loadingWarehouses
                    ? "Loading warehouses..."
                    : warehouses.length === 0
                      ? "No warehouses found."
                      : ""
                }
                options={
                  loadingWarehouses
                    ? [{ value: "", label: "Loading..." }]
                    : [
                        { value: "", label: "Select warehouse (optional)" },
                        ...warehouses.map((wh) => ({
                          value: String(wh.id ?? wh.Id ?? ""),
                          label: wh.name ?? wh.Name ?? `Warehouse ${wh.id ?? wh.Id ?? ""}`,
                        })),
                      ]
                }
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
            </Grid>
          </FormDialog>

          {/* Candidates Section */}
          {activeTab === 2 && (
          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
                Candidates
              </Typography>
              {create && (
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
                    cvFile: null,
                  });
                  setCandidateFormErrors({});
                  setCandidateFormOpen(true);
                }} />
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                alignItems: "center",
                mb: 2,
              }}
            >
              <TextField
                size="small"
                label="Recruitment cycle"
                placeholder="Search by cycle name or ID…"
                value={candidateCycleSearchQuery}
                onChange={(e) => setCandidateCycleSearchQuery(e.target.value)}
                sx={{ flexGrow: 1, minWidth: 220, maxWidth: { sm: 360 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                select
                size="small"
                label="Status"
                value={candidateStatusFilter}
                onChange={(e) => setCandidateStatusFilter(e.target.value)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="0">Applied</MenuItem>
                <MenuItem value="2">Interviewing</MenuItem>
                <MenuItem value="interviewed">Interviewed</MenuItem>
                <MenuItem value="3">Offered</MenuItem>
                <MenuItem value="4">Hired</MenuItem>
                <MenuItem value="5">Rejected</MenuItem>
                <MenuItem value="7">In Onboarding</MenuItem>
              </TextField>

              {(candidateCycleSearchQuery.trim() !== "" || candidateStatusFilter !== "all") && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    setCandidateCycleSearchQuery("");
                    setCandidateStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
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
                  render: (value, row) => {
                    const { label, color } = getCandidateListStatusChipProps(value, row);
                    return (
                      <Chip
                        label={label}
                        size="small"
                        color={color}
                        sx={(theme) => ({
                          fontWeight: 600,
                          height: 24,
                          fontSize: "0.75rem",
                          ...(color !== "default"
                            ? {
                                backgroundColor: `${theme.palette[color].main}1F`,
                                color: theme.palette[color].dark,
                              }
                            : {
                                backgroundColor: `${theme.palette.grey[500]}1A`,
                                color: theme.palette.text.secondary,
                              }),
                          "& .MuiChip-label": {
                            px: 1.25,
                            py: 0,
                            lineHeight: "24px",
                          },
                        })}
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
                        {create && (
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
                        )}
                        {create && (
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
                        )}
                      </Box>
                    );
                  },
                },
              ]}
              rows={candidates.map((candidate) => {
                const jobOpeningId = candidate.jobOpeningId ?? candidate.JobOpeningId;
                const jid = jobOpeningId != null ? String(jobOpeningId) : "";
                const jobOpeningTitle =
                  (jid && jobOpeningTitles[jid]) || "-";

                return {
                  id: candidate.id || candidate.Id || candidate.internalId || candidate.InternalId,
                  firstName: candidate.firstName || candidate.FirstName || "",
                  lastName: candidate.lastName || candidate.LastName || "",
                  email: candidate.email || candidate.Email || "-",
                  phone: candidate.phone || candidate.Phone || "-",
                  jobOpeningTitle,
                  status: candidate.status !== undefined ? candidate.status : (candidate.Status !== undefined ? candidate.Status : 0),
                  stage: candidate.stage !== undefined ? candidate.stage : (candidate.Stage !== undefined ? candidate.Stage : 0),
                  source: candidate.source || candidate.Source || "Direct",
                };
              })}
              emptyMessage={
                candidateCycleSearchQuery.trim() !== "" || candidateStatusFilter !== "all"
                  ? "No candidates match the selected filters."
                  : "No candidates available. Add candidates to track applications."
              }
            />
            {candidatesTotalCount > 0 && (
              <RecruitmentPaginationBar
                idSuffix="candidates"
                totalCount={candidatesTotalCount}
                page={candidatesPage}
                onPageChange={setCandidatesPage}
                pageSize={recruitmentPageSize}
                onPageSizeChange={setRecruitmentPageSize}
              />
            )}
          </Box>
          )}

          {/* Onboarding & Hired Section */}
          {activeTab === 3 && (
          <Box sx={{ mt: 4 }}>

            {/* ── In Onboarding ── */}
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: "info.main" }}>
              In Onboarding
              {inOnboardingTotalCount > 0 && (
                <Chip label={inOnboardingTotalCount} size="small" color="info" sx={{ ml: 1 }} />
              )}
            </Typography>
            {loadingInOnboarding ? (
              <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
            ) : inOnboardingCandidates.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: "italic" }}>
                No candidates currently in onboarding.
              </Typography>
            ) : (
              <ModernTable
                columns={[
                  { id: "name", label: "Name", render: (_, row) => `${row.firstName || ""} ${row.lastName || ""}`.trim() || "-" },
                  { id: "email", label: "Email" },
                  { id: "phone", label: "Phone" },
                  { id: "jobOpening", label: "Job Opening", render: (_, row) => row.jobOpeningTitle || "-" },
                  { id: "movedOn", label: "Date Moved to Onboarding", render: (_, row) => row.movedOn ? formatDate(row.movedOn) : "-" },
                  { id: "status", label: "Status", render: () => <Chip label="In Onboarding" color="info" size="small" /> },
                ]}
                rows={inOnboardingCandidates.map((c) => {
                  const jobOpeningId = c.jobOpeningId ?? c.JobOpeningId;
                  const jid = jobOpeningId != null ? String(jobOpeningId) : "";
                  const jobOpeningTitle = (jid && jobOpeningTitles[jid]) || c.jobOpening?.title || c.JobOpening?.Title || "-";
                  return {
                    id: c.id ?? c.Id,
                    firstName: c.firstName || c.FirstName || "",
                    lastName: c.lastName || c.LastName || "",
                    email: c.email || c.Email || "-",
                    phone: c.phone || c.Phone || "-",
                    jobOpeningTitle,
                    movedOn: c.updatedOn || c.UpdatedOn || c.appliedOn || c.AppliedOn,
                  };
                })}
                emptyMessage="No candidates in onboarding."
              />
            )}

            <Divider sx={{ my: 3 }} />

            {/* ── Hired ── */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
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
                    return (
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={async () => {
                              setLoadingCandidateDetail(true);
                              try {
                                const headers = createAuthHeaders();
                                const response = await fetch(
                                  `${BASE_URL}/hr/recruitment/candidates/${row.id}`,
                                  { headers }
                                );
                                if (response.ok) {
                                  const data = await response.json();
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
              rows={hiredCandidates.map((candidate) => {
                const jobOpeningId = candidate.jobOpeningId ?? candidate.JobOpeningId;
                const jid = jobOpeningId != null ? String(jobOpeningId) : "";
                const jobOpeningTitle = (jid && jobOpeningTitles[jid]) || "-";
                const cid =
                  candidate.id ?? candidate.Id ?? candidate.internalId ?? candidate.InternalId;
                const offer = offers.find(
                  (o) =>
                    String(o.candidateId || o.CandidateId) === String(cid)
                );
                const hiredDate =
                  offer?.respondedOn ||
                  offer?.RespondedOn ||
                  candidate.updatedOn ||
                  candidate.UpdatedOn ||
                  candidate.appliedOn ||
                  candidate.AppliedOn;

                return {
                  id: cid,
                  firstName: candidate.firstName || candidate.FirstName || "",
                  lastName: candidate.lastName || candidate.LastName || "",
                  email: candidate.email || candidate.Email || "-",
                  phone: candidate.phone || candidate.Phone || "-",
                  jobOpeningTitle,
                  status:
                    candidate.status !== undefined
                      ? candidate.status
                      : candidate.Status !== undefined
                        ? candidate.Status
                        : 0,
                  stage:
                    candidate.stage !== undefined
                      ? candidate.stage
                      : candidate.Stage !== undefined
                        ? candidate.Stage
                        : 0,
                  source: candidate.source || candidate.Source || "Direct",
                  hiredDate,
                };
              })}
              emptyMessage="No hired candidates yet. Candidates will appear here after accepting offers."
            />
            {hiredCandidatesTotalCount > 0 && (
              <RecruitmentPaginationBar
                idSuffix="hired"
                totalCount={hiredCandidatesTotalCount}
                page={hiredCandidatesPage}
                onPageChange={setHiredCandidatesPage}
                pageSize={recruitmentPageSize}
                onPageSizeChange={setRecruitmentPageSize}
              />
            )}
          </Box>
          )}

          {/* Kanban Board Section */}
          {activeTab === 4 && (
            <Box sx={{ mt: 2 }}>
              <RecruitmentKanbanBoard
                embedded
                canCreate={create}
                onKanbanAppliedToInterview={handleKanbanAppliedToInterview}
                onKanbanInterviewedToOffer={handleKanbanInterviewedToOffer}
                onAddCandidate={
                  create
                    ? () => {
                        setActiveTab(2);
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
                          cvFile: null,
                        });
                        setCandidateFormErrors({});
                        setCandidateFormOpen(true);
                      }
                    : undefined
                }
              />
            </Box>
          )}

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

              if (candidateFormData.cvFile) {
                if (!isAllowedCandidateCvFile(candidateFormData.cvFile)) {
                  toast.error("CV must be a PDF or Word file (.pdf, .doc, .docx).");
                  return;
                }
                if (candidateFormData.cvFile.size > CANDIDATE_CV_MAX_BYTES) {
                  toast.error(
                    `CV must be ${formatFileSize(CANDIDATE_CV_MAX_BYTES)} or smaller (selected: ${formatFileSize(
                      candidateFormData.cvFile.size
                    )}).`
                  );
                  return;
                }
              }

              setCandidateFormLoading(true);
              try {
                const orgId = getOrgId();
                const orgIdValue = orgId && !isNaN(orgId) ? parseInt(orgId, 10) : 0;

                // Use FormData so the CV file can be uploaded alongside fields.
                // Do NOT set Content-Type manually — the browser will set the
                // correct multipart/form-data boundary automatically.
                const formData = new FormData();
                formData.append("OrgId", String(orgIdValue));
                formData.append("JobOpeningId", String(parseInt(candidateFormData.jobOpeningId, 10)));
                formData.append("FirstName", candidateFormData.firstName || "");
                formData.append("LastName", candidateFormData.lastName || "");
                if (candidateFormData.email) formData.append("Email", candidateFormData.email);
                if (candidateFormData.phone) formData.append("Phone", candidateFormData.phone);
                if (candidateFormData.experienceYears) {
                  formData.append("ExperienceYears", String(parseFloat(candidateFormData.experienceYears)));
                }
                if (candidateFormData.currentCompany) formData.append("CurrentCompany", candidateFormData.currentCompany);
                formData.append("Source", candidateFormData.source || "Direct");
                if (candidateFormData.notes) formData.append("Notes", candidateFormData.notes);
                if (candidateFormData.cvFile) {
                  formData.append("CvFile", candidateFormData.cvFile);
                }

                const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                const response = await fetch(`${BASE_URL}/hr/recruitment/candidates`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                  body: formData,
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
                  cvFile: null,
                });
                setCandidateFormErrors({});
                
                // Reload data - ensure both are called and awaited
                try {
                  await refreshRecruitmentCandidateData();
                } catch (reloadError) {
                  console.error("Error reloading data after adding candidate:", reloadError);
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
                options={jobOpeningFormOptions}
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
              <Grid item xs={12}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: "text.secondary" }}>
                    CV / Resume
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      sx={{ textTransform: "none" }}
                    >
                      {candidateFormData.cvFile ? "Change file" : "Upload CV"}
                      <input
                        type="file"
                        hidden
                        accept={CANDIDATE_CV_ACCEPT}
                        onChange={(e) => {
                          const input = e.target;
                          const file = input.files?.[0] ?? null;
                          if (!file) return;
                          if (!isAllowedCandidateCvFile(file)) {
                            input.value = "";
                            toast.error("Please choose a PDF or Word file (.pdf, .doc, .docx).");
                            return;
                          }
                          if (file.size > CANDIDATE_CV_MAX_BYTES) {
                            input.value = "";
                            toast.error(
                              `File is too large. Maximum size is ${formatFileSize(CANDIDATE_CV_MAX_BYTES)} (selected: ${formatFileSize(file.size)}).`
                            );
                            return;
                          }
                          input.value = "";
                          setCandidateFormData((prev) => ({ ...prev, cvFile: file }));
                        }}
                      />
                    </Button>
                    {candidateFormData.cvFile && (
                      <Button
                        type="button"
                        variant="text"
                        size="small"
                        sx={{ textTransform: "none" }}
                        onClick={() => {
                          const f = candidateFormData.cvFile;
                          if (!f) return;
                          const url = URL.createObjectURL(f);
                          window.open(url, "_blank", "noopener,noreferrer");
                          window.setTimeout(() => URL.revokeObjectURL(url), 120000);
                        }}
                      >
                        View CV
                      </Button>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, maxWidth: 480 }}>
                    Accepted types: PDF, Microsoft Word (.doc, .docx). Maximum size: {formatFileSize(CANDIDATE_CV_MAX_BYTES)}.
                  </Typography>
                  {candidateFormData.cvFile && (
                    <Typography variant="caption" color="text.secondary">
                      Selected: {candidateFormData.cvFile.name} ({formatFileSize(candidateFormData.cvFile.size)})
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </FormDialog>

          {/* Schedule Interview Form Dialog */}
          <FormDialog
            open={interviewFormOpen}
            onClose={handleInterviewFormDialogClose}
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
                
                resolveKanbanScheduleInterviewFlow();
                setInterviewFormOpen(false);
                toast.success("Interview scheduled successfully!");
                
                await refreshRecruitmentCandidateData();
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
                options={dashboardCandidates.map(candidate => ({
                  value: String(candidate.id || candidate.Id || candidate.internalId || candidate.InternalId || ""),
                  label: `${candidate.firstName || candidate.FirstName || ""} ${candidate.lastName || candidate.LastName || ""}`.trim() || `Candidate ${candidate.id || candidate.Id || ""}`
                }))}
                disabled={Boolean(interviewFormData.candidateId && interviewFormData.jobOpeningId)}
                IconComponent={
                  interviewFormData.candidateId && interviewFormData.jobOpeningId ? () => null : undefined
                }
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
                options={jobOpeningFormOptions}
                disabled={Boolean(interviewFormData.candidateId && interviewFormData.jobOpeningId)}
                IconComponent={
                  interviewFormData.candidateId && interviewFormData.jobOpeningId ? () => null : undefined
                }
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
            onClose={handleOfferFormDialogClose}
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

                resolveKanbanInterviewedToOfferFlow();
                setOfferFormOpen(false);
                toast.success("Job offer created successfully!");

                await refreshRecruitmentCandidateData();
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
                options={dashboardCandidates.map(candidate => ({
                  value: String(candidate.id || candidate.Id || candidate.internalId || candidate.InternalId || ""),
                  label: `${candidate.firstName || candidate.FirstName || ""} ${candidate.lastName || candidate.LastName || ""}`.trim() || `Candidate ${candidate.id || candidate.Id || ""}`
                }))}
                disabled={Boolean(offerFormData.candidateId && offerFormData.jobOpeningId)}
                IconComponent={
                  offerFormData.candidateId && offerFormData.jobOpeningId ? () => null : undefined
                }
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
                options={jobOpeningFormOptions}
                disabled={Boolean(offerFormData.candidateId && offerFormData.jobOpeningId)}
                IconComponent={
                  offerFormData.candidateId && offerFormData.jobOpeningId ? () => null : undefined
                }
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
            showCancelButton={false}
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
                    <Box
                      component="details"
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        mb: 2,
                        overflow: "hidden",
                        "& > summary": {
                          listStyle: "none",
                          cursor: "pointer",
                          p: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          userSelect: "none",
                          "&::-webkit-details-marker": { display: "none" },
                        },
                        "&[open] > summary .basic-info-toggle-icon": {
                          transform: "rotate(180deg)",
                        },
                      }}
                    >
                      <Box component="summary">
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Basic Information
                        </Typography>
                        <Box
                          className="basic-info-toggle-icon"
                          component="span"
                          sx={{
                            display: "inline-flex",
                            transition: "transform 0.2s ease",
                            fontSize: "0.875rem",
                            lineHeight: 1,
                            color: "text.secondary",
                          }}
                        >
                          ▼
                        </Box>
                      </Box>
                      <Box sx={{ px: 2, pb: 2 }}>
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
                          {(() => {
                            const stageVal = candidate.stage !== undefined ? candidate.stage : candidate.Stage;
                            const isInterviewed = Number(stageVal) === 7;
                            const statusVal = candidate.status !== undefined ? candidate.status : candidate.Status;
                            const label = isInterviewed ? "Interviewed" :
                              statusVal === 0 ? "Applied" :
                              statusVal === 1 ? "Shortlisted" :
                              statusVal === 2 ? "Interviewing" :
                              statusVal === 3 ? "Offered" :
                              statusVal === 4 ? "Hired" :
                              statusVal === 5 ? "Rejected" :
                              statusVal === 6 ? "Withdrawn" :
                              statusVal === 7 ? "In Onboarding" :
                              "Applied";
                            const chipColor = isInterviewed ? "warning" :
                              statusVal === 4 ? "success" :
                              statusVal === 7 ? "info" :
                              statusVal === 5 || statusVal === 6 ? "error" :
                              statusVal === 2 ? "info" :
                              "default";
                            return (
                              <Chip
                                label={label}
                                size="small"
                                color={chipColor}
                                sx={(theme) => ({
                                  ...(chipColor !== "default"
                                    ? {
                                        backgroundColor: `${theme.palette[chipColor].main}1F`,
                                        color: theme.palette[chipColor].dark,
                                      }
                                    : {
                                        backgroundColor: `${theme.palette.grey[500]}1A`,
                                        color: theme.palette.text.secondary,
                                      }),
                                })}
                              />
                            );
                          })()}
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Stage</Typography>
                          <Typography variant="body1">
                            {(() => {
                              const stageValue = candidate.stage !== undefined ? candidate.stage : candidate.Stage;
                              const stageMap = {
                                0: "Draft",
                                1: "Sourcing",
                                2: "Screening",
                                3: "Interview",
                                4: "Offer",
                                5: "Hired",
                                6: "Rejected",
                                7: "Interviewed",
                              };
                              return stageMap[stageValue] || "Sourcing";
                            })()}
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
                    </Box>
                  </Grid>

                  {/* CV / Resume Section */}
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1, mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        CV / Resume
                      </Typography>
                      {(() => {
                        const resumeUrl = candidate.resumeUrl || candidate.ResumeUrl || "";
                        if (!resumeUrl) {
                          return (
                            <Typography variant="body2" color="text.secondary">
                              No CV uploaded for this candidate.
                            </Typography>
                          );
                        }

                        const fileName = (() => {
                          try {
                            const pathname = new URL(resumeUrl).pathname;
                            const segments = pathname.split("/").filter(Boolean);
                            const last = segments[segments.length - 1] || "";
                            return decodeURIComponent(last) || "CV";
                          } catch {
                            const segs = resumeUrl.split("/").filter(Boolean);
                            return decodeURIComponent(segs[segs.length - 1] || "CV");
                          }
                        })();

                        const candidateName =
                          `${candidate.firstName || candidate.FirstName || ""} ${candidate.lastName || candidate.LastName || ""}`.trim() ||
                          "candidate";

                        const handleDownload = async () => {
                          try {
                            const response = await fetch(resumeUrl);
                            if (!response.ok) throw new Error("Failed to fetch CV file");
                            const blob = await response.blob();
                            const ext = fileName.includes(".") ? fileName.substring(fileName.lastIndexOf(".")) : "";
                            const suggestedName = `${candidateName.replace(/\s+/g, "_")}_CV${ext}`;
                            const objectUrl = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = objectUrl;
                            a.download = suggestedName;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(objectUrl);
                          } catch (err) {
                            console.error("CV download failed:", err);
                            window.open(resumeUrl, "_blank", "noopener,noreferrer");
                          }
                        };

                        return (
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                p: 1.5,
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 1,
                                bgcolor: "background.default",
                                flexGrow: 1,
                                minWidth: 0,
                              }}
                            >
                              <DescriptionIcon color="primary" />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={fileName}>
                                  {fileName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Uploaded CV / Resume
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<OpenInNewIcon />}
                                component="a"
                                href={resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View
                              </Button>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={handleDownload}
                              >
                                Download
                              </Button>
                            </Box>
                          </Box>
                        );
                      })()}
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
                            const stageMap = { 0: "Draft", 1: "Sourcing", 2: "Screening", 3: "Interview", 4: "Offer", 5: "Hired", 6: "Rejected", 7: "Interviewed" };
                            return stageMap[value] || value;
                          }},
                          { id: "toStage", label: "To Stage", render: (value) => {
                            const stageMap = { 0: "Draft", 1: "Sourcing", 2: "Screening", 3: "Interview", 4: "Offer", 5: "Hired", 6: "Rejected", 7: "Interviewed" };
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
                          {
                            id: "scheduledStart",
                            label: "Start Time",
                            render: (value) => {
                              if (!value) return "";
                              const d = new Date(value);
                              if (isNaN(d.getTime())) return "";
                              return `${formatDate(value)} ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
                            },
                          },
                          {
                            id: "scheduledEnd",
                            label: "End Time",
                            render: (value) => {
                              if (!value) return "";
                              const d = new Date(value);
                              if (isNaN(d.getTime())) return "";
                              return `${formatDate(value)} ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
                            },
                          },
                          { id: "mode", label: "Mode", render: (value) => getInterviewModeLabel(value) },
                          { id: "location", label: "Location" },
                          { id: "status", label: "Status" },
                        ]}
                        rows={interviewSlots.map(slot => ({
                          id: slot.id || slot.Id,
                          scheduledStart: slot.scheduledStart || slot.ScheduledStart,
                          scheduledEnd: slot.scheduledEnd || slot.ScheduledEnd,
                          mode: slot.mode !== undefined ? slot.mode : slot.Mode,
                          location: slot.location || slot.Location || "-",
                          status: slot.status || slot.Status || "Scheduled",
                        }))}
                        emptyMessage="No interviews scheduled"
                      />
                      {(() => {
                        const stageVal = candidate.stage !== undefined ? candidate.stage : candidate.Stage;
                        const statusVal = candidate.status !== undefined ? candidate.status : candidate.Status;
                        const stageNum = Number(stageVal);
                        const statusNum = Number(statusVal);
                        const primary = getPrimaryInterviewSlotForNotes(interviewSlots);
                        if (!primary?.id) return null;
                        const savedNotes = String(primary.interviewerNotes ?? "").trim();

                        const isInterviewingPipeline =
                          statusNum === 2 && interviewSlots.length > 0 && stageNum === 3;

                        if (isInterviewingPipeline) {
                          const interviewId = primary.id;
                          const candidateIdForReload =
                            candidate.id || candidate.Id || candidate.candidateId || candidate.CandidateId;
                          return (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Interview Notes
                              </Typography>
                              <TextField
                                fullWidth
                                multiline
                                minRows={4}
                                placeholder="Add notes for the interviewer..."
                                value={interviewerNotesDraft}
                                onChange={(e) => setInterviewerNotesDraft(e.target.value)}
                                disabled={interviewerNotesSaving}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    bgcolor: "background.paper",
                                    alignItems: "flex-start",
                                  },
                                }}
                              />
                              <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  disabled={interviewerNotesSaving}
                                  onClick={async () => {
                                    setInterviewerNotesSaving(true);
                                    try {
                                      const headers = createAuthHeaders();
                                      const response = await fetch(
                                        `${BASE_URL}/hr/recruitment/interviews/${interviewId}/notes`,
                                        {
                                          method: "PATCH",
                                          headers: {
                                            ...headers,
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({ notes: interviewerNotesDraft }),
                                        }
                                      );
                                      const responseData = await response.json().catch(() => ({}));
                                      const statusCode = responseData?.statusCode ?? responseData?.StatusCode;
                                      const ok =
                                        response.ok &&
                                        (statusCode === undefined || Number(statusCode) === 200);
                                      if (!ok) {
                                        throw new Error(
                                          responseData?.message ||
                                            responseData?.Message ||
                                            "Failed to save interview notes."
                                        );
                                      }
                                      toast.success("Interview notes saved.");
                                      if (candidateIdForReload) {
                                        const reload = await fetch(
                                          `${BASE_URL}/hr/recruitment/candidates/${candidateIdForReload}`,
                                          { headers }
                                        );
                                        if (reload.ok) {
                                          const data = await reload.json();
                                          const detailData = data.result || data.data || data;
                                          setSelectedCandidateDetail(detailData);
                                        }
                                      }
                                    } catch (err) {
                                      toast.error(err.message || "Failed to save interview notes.");
                                    } finally {
                                      setInterviewerNotesSaving(false);
                                    }
                                  }}
                                  sx={{ textTransform: "none", fontWeight: 600 }}
                                >
                                  SAVE NOTES
                                </Button>
                              </Box>
                            </Box>
                          );
                        }

                        if (stageNum === 7 && savedNotes) {
                          return (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Interview Notes
                              </Typography>
                              <Box
                                sx={{
                                  pl: 2,
                                  py: 1.5,
                                  pr: 1.5,
                                  borderLeft: "4px solid",
                                  borderLeftColor: "primary.main",
                                  bgcolor: "grey.50",
                                  borderRadius: 1,
                                  border: "1px solid",
                                  borderColor: "divider",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "block", mb: 0.75, fontWeight: 600 }}
                                >
                                  Notes for interviewer
                                </Typography>
                                <Typography
                                  sx={{
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    color: "text.primary",
                                    fontSize: "0.875rem",
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {savedNotes}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        }

                        return null;
                      })()}
                      {/* Mark as Interviewed — only shown while stage is Interview (3) */}
                      {(() => {
                        const stageVal = candidate.stage !== undefined ? candidate.stage : candidate.Stage;
                        if (Number(stageVal) !== 3) return null;
                        const candidateId = candidate.id || candidate.Id || candidate.candidateId || candidate.CandidateId;
                        return (
                          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                            <Button
                              variant="contained"
                              color="warning"
                              size="small"
                              disabled={markInterviewedLoading}
                              startIcon={markInterviewedLoading ? <CircularProgress size={16} color="inherit" /> : <FactCheckIcon />}
                              onClick={async () => {
                                setMarkInterviewedLoading(true);
                                try {
                                  const headers = createAuthHeaders();
                                  const response = await fetch(
                                    `${BASE_URL}/hr/recruitment/candidates/${candidateId}/stage`,
                                    {
                                      method: "PATCH",
                                      headers: { ...headers, "Content-Type": "application/json" },
                                      body: JSON.stringify({ ToStage: "Interviewed", Comment: "Marked as interviewed from candidate detail view" }),
                                    }
                                  );
                                  const responseData = await response.json().catch(() => null);
                                  if (response.ok) {
                                    toast.success("Candidate moved to Interviewed stage.");
                                    setCandidateDetailOpen(false);
                                    setSelectedCandidateDetail(null);
                                    await refreshRecruitmentCandidateData();
                                  } else {
                                    toast.error(
                                      responseData?.message || responseData?.Message || "Failed to update stage."
                                    );
                                  }
                                } catch {
                                  toast.error("Error updating candidate stage.");
                                } finally {
                                  setMarkInterviewedLoading(false);
                                }
                              }}
                            >
                              Mark as Interviewed
                            </Button>
                          </Box>
                        );
                      })()}
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
                            {formatAmountForCurrency(
                              offer.salary || offer.Salary || 0,
                              offer.currency || offer.Currency
                            )}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Join Date</Typography>
                          <Typography variant="body1">{formatDate(offer.joinDate || offer.JoinDate)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip
                            label={(() => {
                              const status = offer.status !== undefined ? offer.status : offer.Status;
                              const offerStatusLabels = {
                                0: "Draft",
                                1: "Sent",
                                2: "Accepted",
                                3: "Declined",
                                4: "Withdrawn",
                                5: "Expired",
                              };
                              if (status === undefined || status === null || status === "") return "Draft";
                              if (Object.prototype.hasOwnProperty.call(offerStatusLabels, status)) {
                                return offerStatusLabels[status];
                              }
                              const num = Number(status);
                              if (!Number.isNaN(num) && Object.prototype.hasOwnProperty.call(offerStatusLabels, num)) {
                                return offerStatusLabels[num];
                              }
                              return String(status);
                            })()}
                            size="small"
                            color={
                              (offer.status || offer.Status) === "Accepted" || (offer.status || offer.Status) === 2 ? "success" :
                              (offer.status || offer.Status) === "Declined" || (offer.status || offer.Status) === 3 ? "error" :
                              "default"
                            }
                            sx={(theme) => {
                              const offerStatus = offer.status !== undefined ? offer.status : offer.Status;
                              const offerChipColor =
                                offerStatus === "Accepted" || offerStatus === 2 ? "success" :
                                offerStatus === "Declined" || offerStatus === 3 ? "error" :
                                "default";
                              return {
                                ...(offerChipColor !== "default"
                                  ? {
                                      backgroundColor: `${theme.palette[offerChipColor].main}1F`,
                                      color: theme.palette[offerChipColor].dark,
                                    }
                                  : {
                                      backgroundColor: `${theme.palette.grey[500]}1A`,
                                      color: theme.palette.text.secondary,
                                    }),
                              };
                            }}
                          />
                        </Grid>
                        {approve1 && ((offer.status === "Sent" || offer.Status === "Sent" || offer.status === 1 || offer.Status === 1)) && (
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
                                      toast.success("Offer accepted! Candidate moved to onboarding queue. Assign an onboarding profile from HR → Onboarding → Assign.");
                                      setCandidateDetailOpen(false);
                                      setSelectedCandidateDetail(null);
                                      await refreshRecruitmentCandidateData();
                                    } else {
                                      toast.error(responseData.message || responseData.Message || "Failed to accept offer");
                                    }
                                  } catch (error) {
                                    toast.error("Error accepting offer");
                                  }
                                }}
                              >
                                Offer Accepted
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
                                      await refreshRecruitmentCandidateData();
                                    } else {
                                      toast.error(responseData.message || responseData.Message || "Failed to decline offer");
                                    }
                                  } catch (error) {
                                    toast.error("Error declining offer");
                                  }
                                }}
                              >
                                Offer Declined
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
            showCancelButton={false}
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
                  render: (value, row) => {
                    const { label, color } = getCandidateListStatusChipProps(value, row);
                    return (
                      <Chip
                        label={label}
                        size="small"
                        color={color}
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
                  stage: candidate.stage !== undefined ? candidate.stage : (candidate.Stage !== undefined ? candidate.Stage : 0),
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

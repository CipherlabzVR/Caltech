import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { toast, ToastContainer } from "react-toastify";
import styles from "@/styles/PageTitle.module.css";
import BASE_URL from "Base/api";
import {
  createAuthHeaders,
  getOrgId,
  parsePagedResponse,
} from "@/components/utils/apiHelpers";
import { useCurrency } from "@/components/HR/CurrencyContext";

/** Visual tokens aligned with Help Desk Kanban (tinted columns, header chip, card accents). */
const COLUMNS = [
  {
    id: "applied",
    title: "Applied",
    color: "#2196F3",
    bgColor: "#E3F2FD",
    columnBg: "#E8F4FD",
  },
  {
    id: "interview",
    title: "Interview",
    color: "#7C3AED",
    bgColor: "#EDE9FE",
    columnBg: "#F5F3FF",
  },
  {
    id: "interviewed",
    title: "Interviewed",
    color: "#8B5CF6",
    bgColor: "#EDE9FE",
    columnBg: "#FAF5FF",
  },
  {
    id: "offer",
    title: "Offer",
    color: "#FF9800",
    bgColor: "#FFF3E0",
    columnBg: "#FFF8E1",
  },
  {
    id: "onboarding",
    title: "In Onboarding",
    /** Aligns with MUI `Chip color="info"` used on recruitment Onboarding & Hired tab */
    color: "#0288D1",
    bgColor: "#E1F5FE",
    columnBg: "#E0F7FA",
  },
  {
    id: "hired",
    title: "Hired",
    color: "#4CAF50",
    bgColor: "#E8F5E9",
    columnBg: "#F1F8F4",
  },
  {
    id: "rejected",
    title: "Rejected",
    color: "#9E9E9E",
    bgColor: "#F5F5F5",
    columnBg: "#FAFAFA",
  },
];


const COLUMN_TO_API_STAGE = {
  applied: "Sourcing",
  interview: "Interview",
  interviewed: "Interviewed",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

// Stage numeric values mirror the backend HrRecruitmentStage enum:
// Draft=0, Sourcing=1, Screening=2, Interview=3, Offer=4, Hired=5, Rejected=6, Interviewed=7, Onboarding=8
// HrCandidateStatus.InOnboarding = 7 (distinct from stage 7 = Interviewed)
const COLUMN_OPTIMISTIC = {
  applied: { stage: 1, status: 0 },
  interview: { stage: 3, status: 2 },
  interviewed: { stage: 7, status: 2 },
  offer: { stage: 4, status: 3 },
  onboarding: { stage: 8, status: 7 },
  hired: { stage: 5, status: 4 },
  rejected: { stage: 6, status: 5 },
};

const HR_RECRUITMENT_CANDIDATES_CHANGED = "hr-recruitment-candidates-changed";

function notifyRecruitmentPagesCandidatesChanged(detail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(HR_RECRUITMENT_CANDIDATES_CHANGED, { detail })
  );
}

function patchCandidateForColumn(candidate, columnId) {
  const { stage, status } = COLUMN_OPTIMISTIC[columnId] || COLUMN_OPTIMISTIC.applied;
  return {
    ...candidate,
    stage,
    status,
    Stage: stage,
    Status: status,
  };
}

const getCandidateId = (candidate) =>
  candidate?.id ??
  candidate?.Id ??
  candidate?.internalId ??
  candidate?.InternalId;

function candidateMatchesId(candidate, itemId) {
  const id = getCandidateId(candidate);
  return id !== undefined && id !== null && String(id) === String(itemId);
}

const resolveColumnId = (candidate) => {
  const rawStatus =
    candidate?.status !== undefined ? candidate.status : candidate?.Status;
  const rawStage =
    candidate?.stage !== undefined ? candidate.stage : candidate?.Stage;

  const statusStrNorm =
    typeof rawStatus === "string"
      ? rawStatus.toLowerCase().replace(/\s+/g, "")
      : "";
  if (statusStrNorm === "inonboarding") return "onboarding";

  const statusNumEarly = Number(rawStatus);
  if (
    !Number.isNaN(statusNumEarly) &&
    rawStatus !== null &&
    rawStatus !== undefined &&
    statusNumEarly === 7
  ) {
    return "onboarding";
  }

  const stageStr =
    typeof rawStage === "string" ? rawStage.toLowerCase() : "";
  if (stageStr) {
    if (stageStr === "onboarding") return "onboarding";
    if (stageStr === "interviewed") return "interviewed";
    if (stageStr === "interview") return "interview";
    if (stageStr === "offer") return "offer";
    if (stageStr === "hired") return "hired";
    if (stageStr === "rejected") return "rejected";
    if (stageStr === "sourcing" || stageStr === "screening" || stageStr === "draft") return "applied";
  }

  const stageNum = Number(rawStage);
  if (!Number.isNaN(stageNum) && rawStage !== null && rawStage !== undefined) {
    switch (stageNum) {
      case 8:
        return "onboarding";
      case 7:
        return "interviewed";
      case 3:
        return "interview";
      case 4:
        return "offer";
      case 5:
        return "hired";
      case 6:
        return "rejected";
      case 0:
      case 1:
      case 2:
        return "applied";
      default:
        break;
    }
  }

  const statusStr =
    typeof rawStatus === "string" ? rawStatus.toLowerCase() : "";
  if (statusStr) {
    if (statusStr === "applied" || statusStr === "shortlisted") return "applied";
    if (statusStr === "interviewing") return "interview";
    if (statusStr === "offered") return "offer";
    if (statusStr === "hired") return "hired";
    if (statusStr === "rejected" || statusStr === "withdrawn") return "rejected";
  }

  const statusNum = Number(rawStatus);
  if (!Number.isNaN(statusNum) && rawStatus !== null && rawStatus !== undefined) {
    switch (statusNum) {
      case 0:
      case 1:
        return "applied";
      case 2:
        return "interview";
      case 3:
        return "offer";
      case 4:
        return "hired";
      case 5:
      case 6:
        return "rejected";
      default:
        break;
    }
  }

  return "applied";
};

const getFullName = (candidate) => {
  const first = candidate?.firstName || candidate?.FirstName || "";
  const last = candidate?.lastName || candidate?.LastName || "";
  const combined = `${first} ${last}`.trim();
  return combined || "Unnamed Candidate";
};

const getJobOpeningTitle = (candidate, jobOpeningMap) => {
  const direct =
    candidate?.jobOpeningName ||
    candidate?.JobOpeningName ||
    candidate?.jobOpeningTitle ||
    candidate?.JobOpeningTitle;
  if (direct) return direct;

  const jobOpeningId = candidate?.jobOpeningId ?? candidate?.JobOpeningId;
  if (jobOpeningId !== undefined && jobOpeningId !== null) {
    const lookup = jobOpeningMap.get(String(jobOpeningId));
    if (lookup) return lookup;
  }

  return "-";
};

/** Latest non-cancelled interview slot by scheduled start (for interviewer notes / slot id). */
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

const defaultVisibleStages = () =>
  COLUMNS.reduce((acc, col) => {
    acc[col.id] = true;
    return acc;
  }, {});

export default function RecruitmentKanbanBoard({
  embedded = false,
  canCreate = false,
  onAddCandidate,
  onKanbanAppliedToInterview,
  onKanbanInterviewedToOffer,
} = {}) {
  const [candidates, setCandidates] = useState([]);
  const [jobOpeningMap, setJobOpeningMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const draggedItemRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDrawer, setFilterDrawer] = useState(false);
  const [visibleStages, setVisibleStages] = useState(defaultVisibleStages);

  /** Interview → Interviewed: optional notes then stage PATCH */
  const [interviewToInterviewedState, setInterviewToInterviewedState] = useState({
    open: false,
    candidateId: null,
    interviewId: null,
    notesDraft: "",
    fetchLoading: false,
    actionLoading: false,
  });
  const interviewToInterviewedRef = useRef(interviewToInterviewedState);
  interviewToInterviewedRef.current = interviewToInterviewedState;

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [detailData, setDetailData] = useState(null);

  const openCandidateDetail = useCallback(async (candidateId) => {
    if (candidateId === undefined || candidateId === null || candidateId === "") {
      return;
    }
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailData(null);
    try {
      const headers = createAuthHeaders();
      const response = await fetch(
        `${BASE_URL}/hr/recruitment/candidates/${candidateId}`,
        { headers }
      );
      if (!response.ok) {
        throw new Error(`Failed to load candidate details (${response.status})`);
      }
      const json = await response.json();
      const data = json?.result || json?.data || json;
      setDetailData(data);
    } catch (err) {
      console.error("Error loading candidate detail:", err);
      setDetailError(err.message || "Failed to load candidate details");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeCandidateDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailData(null);
    setDetailError(null);
  }, []);

  const [interviewNotesReadOnlyState, setInterviewNotesReadOnlyState] = useState({
    open: false,
    loading: false,
    notes: "",
  });

  const closeInterviewNotesReadOnlyDialog = useCallback(() => {
    setInterviewNotesReadOnlyState({
      open: false,
      loading: false,
      notes: "",
    });
  }, []);

  const openInterviewNotesReadOnly = useCallback(
    async (item) => {
      setInterviewNotesReadOnlyState({ open: true, loading: true, notes: "" });
      try {
        const raw = item?.raw || {};
        const slotsOnCard = raw.interviewSlots ?? raw.InterviewSlots;
        let trimmed = "";
        if (Array.isArray(slotsOnCard) && slotsOnCard.length > 0) {
          const primary = getPrimaryInterviewSlotForNotes(slotsOnCard);
          trimmed = String(
            primary?.interviewerNotes ?? primary?.InterviewerNotes ?? ""
          ).trim();
        } else {
          const id = item?.id;
          if (id === undefined || id === null || id === "") {
            throw new Error("Candidate id is missing");
          }
          const headers = createAuthHeaders();
          const res = await fetch(`${BASE_URL}/hr/recruitment/candidates/${id}`, {
            headers,
          });
          if (!res.ok) throw new Error("Failed to load candidate");
          const json = await res.json();
          const detail = json?.result || json?.data || json;
          const slots = detail?.interviewSlots || detail?.InterviewSlots || [];
          const primary = getPrimaryInterviewSlotForNotes(slots);
          trimmed = String(
            primary?.interviewerNotes ?? primary?.InterviewerNotes ?? ""
          ).trim();
        }
        setInterviewNotesReadOnlyState({
          open: true,
          loading: false,
          notes: trimmed,
        });
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Could not load interview notes.");
        closeInterviewNotesReadOnlyDialog();
      }
    },
    [closeInterviewNotesReadOnlyDialog]
  );

  const handleKanbanCardClick = useCallback(
    (item, columnId) => {
      if (columnId === "interviewed") {
        void openInterviewNotesReadOnly(item);
        return;
      }
      openCandidateDetail(item.id);
    },
    [openCandidateDetail, openInterviewNotesReadOnly]
  );

  const loadBoard = useCallback(async (options = {}) => {
    const silent = options.silent === true;
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const orgId = getOrgId();
      const headers = createAuthHeaders();

      const [candidatesResponse, jobsResponse] = await Promise.all([
        fetch(
          `${BASE_URL}/hr/recruitment/candidates?OrgId=${orgId || 0}&SkipCount=0&MaxResultCount=200`,
          { headers }
        ),
        fetch(
          `${BASE_URL}/hr/recruitment/job-openings?OrgId=${orgId || 0}&SkipCount=0&MaxResultCount=100&IncludePublic=true`,
          { headers }
        ),
      ]);

      if (!candidatesResponse.ok) {
        throw new Error("Unable to load candidates");
      }

      const candidatesJson = await candidatesResponse.json();
      const candidatesList = parsePagedResponse(candidatesJson).items || [];
      setCandidates(candidatesList);

      const nextJobMap = new Map();
      if (jobsResponse.ok) {
        const jobsJson = await jobsResponse.json();
        const jobItems = parsePagedResponse(jobsJson).items || [];
        jobItems.forEach((item) => {
          const jobOpening = item?.jobOpening || item?.JobOpening || item;
          const id =
            jobOpening?.id ?? jobOpening?.Id ?? item?.id ?? item?.Id;
          const title =
            jobOpening?.title ||
            jobOpening?.Title ||
            item?.title ||
            item?.Title;
          if (id !== undefined && id !== null && title) {
            nextJobMap.set(String(id), title);
          }
        });
      }
      setJobOpeningMap(nextJobMap);
    } catch (err) {
      console.error("Error loading recruitment kanban:", err);
      setError(err.message || "Failed to load recruitment board");
      if (!silent) {
        setCandidates([]);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onChanged = (event) => {
      if (event?.detail?.stageMove) {
        return;
      }
      loadBoard({ silent: true });
    };
    window.addEventListener(HR_RECRUITMENT_CANDIDATES_CHANGED, onChanged);
    return () => {
      window.removeEventListener(HR_RECRUITMENT_CANDIDATES_CHANGED, onChanged);
    };
  }, [loadBoard]);

  const searchFilteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) => {
      const name = getFullName(c).toLowerCase();
      const email = (c?.email || c?.Email || "").toLowerCase();
      const job = getJobOpeningTitle(c, jobOpeningMap).toLowerCase();
      return name.includes(q) || email.includes(q) || job.includes(q);
    });
  }, [candidates, jobOpeningMap, searchQuery]);

  const board = useMemo(() => {
    const buckets = COLUMNS.reduce((acc, column) => {
      acc[column.id] = [];
      return acc;
    }, {});

    searchFilteredCandidates.forEach((candidate) => {
      const columnId = resolveColumnId(candidate);
      if (!buckets[columnId]) return;
      const id = getCandidateId(candidate);
      const phone = candidate?.phone || candidate?.Phone || "";
      const appliedOn = candidate?.appliedOn || candidate?.AppliedOn || null;
      buckets[columnId].push({
        id,
        name: getFullName(candidate),
        email: candidate?.email || candidate?.Email || "",
        phone,
        appliedOn,
        jobOpeningTitle: getJobOpeningTitle(candidate, jobOpeningMap),
        raw: candidate,
      });
    });

    return COLUMNS.map((column) => ({
      ...column,
      items: buckets[column.id],
    }));
  }, [searchFilteredCandidates, jobOpeningMap]);

  const visibleBoard = useMemo(
    () => board.filter((column) => visibleStages[column.id] !== false),
    [board, visibleStages]
  );

  const persistStageMove = useCallback(async (candidateId, targetColumnId) => {
    const toStage = COLUMN_TO_API_STAGE[targetColumnId];
    if (!toStage) {
      return { success: false, error: "Invalid column" };
    }

    const headers = createAuthHeaders();
    const response = await fetch(
      `${BASE_URL}/hr/recruitment/candidates/${candidateId}/stage`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ toStage }),
      }
    );

    const data = await response.json().catch(() => null);
    const statusCode = data?.statusCode ?? data?.StatusCode;
    const ok =
      response.ok && (statusCode === undefined || Number(statusCode) === 200);

    if (!ok) {
      const message =
        data?.message ||
        data?.Message ||
        `Failed to update candidate (${response.status})`;
      return { success: false, error: message };
    }

    return { success: true };
  }, []);

  /** Same POST as recruitment page "Offer Accepted" (Accept button). */
  const acceptOfferForKanban = useCallback(async (offerId) => {
    const headers = createAuthHeaders();
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
    const data = await response.json().catch(() => ({}));
    const statusCode = data?.statusCode ?? data?.StatusCode;
    const ok =
      response.ok && (statusCode === undefined || Number(statusCode) === 200);
    if (!ok) {
      const message =
        data?.message ||
        data?.Message ||
        `Failed to accept offer (${response.status})`;
      return { success: false, error: message };
    }
    return { success: true };
  }, []);

  const closeInterviewToInterviewedDialog = useCallback(() => {
    setInterviewToInterviewedState({
      open: false,
      candidateId: null,
      interviewId: null,
      notesDraft: "",
      fetchLoading: false,
      actionLoading: false,
    });
  }, []);

  useEffect(() => {
    if (!interviewToInterviewedState.open || interviewToInterviewedState.candidateId == null) {
      return;
    }
    let cancelled = false;
    const cid = interviewToInterviewedState.candidateId;
    setInterviewToInterviewedState((prev) => ({ ...prev, fetchLoading: true }));
    (async () => {
      try {
        const headers = createAuthHeaders();
        const res = await fetch(`${BASE_URL}/hr/recruitment/candidates/${cid}`, { headers });
        if (!res.ok) throw new Error("Failed to load candidate");
        const json = await res.json();
        const detail = json?.result || json?.data || json;
        const slots = detail?.interviewSlots || detail?.InterviewSlots || [];
        const primary = getPrimaryInterviewSlotForNotes(slots);
        if (cancelled) return;
        setInterviewToInterviewedState((prev) => ({
          ...prev,
          fetchLoading: false,
          interviewId: primary?.id ?? null,
          notesDraft: String(primary?.interviewerNotes ?? ""),
        }));
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          toast.error("Could not load interview details.");
          setInterviewToInterviewedState({
            open: false,
            candidateId: null,
            interviewId: null,
            notesDraft: "",
            fetchLoading: false,
            actionLoading: false,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [interviewToInterviewedState.open, interviewToInterviewedState.candidateId]);

  const handleInterviewToInterviewedCancel = useCallback(() => {
    closeInterviewToInterviewedDialog();
  }, [closeInterviewToInterviewedDialog]);

  const handleInterviewToInterviewedSkip = useCallback(async () => {
    const snap = interviewToInterviewedRef.current;
    const { candidateId, actionLoading, fetchLoading } = snap;
    if (!candidateId || actionLoading || fetchLoading) return;
    setInterviewToInterviewedState((p) => ({ ...p, actionLoading: true }));
    const result = await persistStageMove(candidateId, "interviewed");
    if (!result.success) {
      setInterviewToInterviewedState((p) => ({ ...p, actionLoading: false }));
      toast.error(result.error || "Could not move candidate");
      return;
    }
    closeInterviewToInterviewedDialog();
    await loadBoard({ silent: true });
    notifyRecruitmentPagesCandidatesChanged({ stageMove: true });
  }, [persistStageMove, loadBoard, closeInterviewToInterviewedDialog]);

  const handleInterviewToInterviewedSaveAndContinue = useCallback(async () => {
    const snap = interviewToInterviewedRef.current;
    const { candidateId, interviewId, notesDraft, actionLoading, fetchLoading } = snap;
    if (!candidateId || actionLoading || fetchLoading) return;
    if (!interviewId) {
      toast.error("No interview slot found to save notes.");
      return;
    }
    setInterviewToInterviewedState((p) => ({ ...p, actionLoading: true }));
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
          body: JSON.stringify({ notes: notesDraft }),
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
      const moveResult = await persistStageMove(candidateId, "interviewed");
      if (!moveResult.success) {
        throw new Error(moveResult.error || "Could not move candidate");
      }
      toast.success("Interview notes saved.");
      closeInterviewToInterviewedDialog();
      await loadBoard({ silent: true });
      notifyRecruitmentPagesCandidatesChanged({ stageMove: true });
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setInterviewToInterviewedState((p) => ({ ...p, actionLoading: false }));
    }
  }, [persistStageMove, loadBoard, closeInterviewToInterviewedDialog]);

  const handleDragStart = useCallback((sourceColumnId, itemId) => {
    const payload = { sourceColumnId, itemId };
    draggedItemRef.current = payload;
    setDraggedItem(payload);
  }, []);

  const handleDragEnd = useCallback(() => {
    draggedItemRef.current = null;
    setDraggedItem(null);
  }, []);

  const handleDropCard = useCallback(
    async (targetColumnId) => {
      const active = draggedItemRef.current ?? draggedItem;
      if (!active) return;

      const { sourceColumnId, itemId } = active;
      draggedItemRef.current = null;
      setDraggedItem(null);

      if (sourceColumnId === targetColumnId) return;

      if (sourceColumnId === "onboarding") {
        return;
      }

      if (targetColumnId === "onboarding" && sourceColumnId !== "offer") {
        return;
      }

      const candidateId = itemId;
      if (candidateId === undefined || candidateId === null || candidateId === "") {
        toast.error("Candidate id is missing");
        return;
      }

      const snapshot = candidates;

      if (
        sourceColumnId === "applied" &&
        targetColumnId === "interview" &&
        typeof onKanbanAppliedToInterview === "function"
      ) {
        const raw = snapshot.find((c) => candidateMatchesId(c, candidateId));
        const jobOpeningId = raw?.jobOpeningId ?? raw?.JobOpeningId;
        if (jobOpeningId === undefined || jobOpeningId === null || jobOpeningId === "") {
          toast.error("Job opening is required to schedule an interview for this candidate.");
          return;
        }
        try {
          await onKanbanAppliedToInterview({
            candidateId,
            jobOpeningId,
            rawCandidate: raw,
          });
          await loadBoard({ silent: true });
          notifyRecruitmentPagesCandidatesChanged({ stageMove: true });
        } catch {
          /* user cancelled schedule dialog or flow rejected */
        }
        return;
      }

      if (sourceColumnId === "interview" && targetColumnId === "interviewed") {
        setInterviewToInterviewedState({
          open: true,
          candidateId,
          interviewId: null,
          notesDraft: "",
          fetchLoading: true,
          actionLoading: false,
        });
        return;
      }

      if (
        sourceColumnId === "interviewed" &&
        targetColumnId === "offer" &&
        typeof onKanbanInterviewedToOffer === "function"
      ) {
        const raw = snapshot.find((c) => candidateMatchesId(c, candidateId));
        const jobOpeningId = raw?.jobOpeningId ?? raw?.JobOpeningId;
        if (jobOpeningId === undefined || jobOpeningId === null || jobOpeningId === "") {
          toast.error("Job opening is required to create an offer for this candidate.");
          return;
        }
        try {
          await onKanbanInterviewedToOffer({
            candidateId,
            jobOpeningId,
            rawCandidate: raw,
          });
          const moveResult = await persistStageMove(candidateId, "offer");
          if (!moveResult.success) {
            toast.error(moveResult.error || "Could not update candidate stage.");
          }
          await loadBoard({ silent: true });
          notifyRecruitmentPagesCandidatesChanged({ stageMove: true });
        } catch {
          /* user cancelled Create Job Offer dialog */
        }
        return;
      }

      if (sourceColumnId === "offer" && targetColumnId === "onboarding") {
        const raw = snapshot.find((c) => candidateMatchesId(c, candidateId));
        let offerId =
          raw?.offerId ??
          raw?.OfferId ??
          raw?.jobOfferId ??
          raw?.JobOfferId ??
          raw?.activeOfferId ??
          raw?.ActiveOfferId;

        if (offerId === undefined || offerId === null || offerId === "") {
          try {
            const headers = createAuthHeaders();
            const res = await fetch(`${BASE_URL}/hr/recruitment/candidates/${candidateId}`, {
              headers,
            });
            if (!res.ok) throw new Error("Failed to load candidate");
            const json = await res.json();
            const detail = json?.result || json?.data || json;
            const offer = detail?.offer || detail?.Offer;
            offerId = offer?.id ?? offer?.Id;
          } catch (err) {
            toast.error(err.message || "Could not resolve offer for this candidate.");
            return;
          }
        }

        if (offerId === undefined || offerId === null || offerId === "") {
          toast.error("No offer found for this candidate.");
          return;
        }

        const nextCandidates = snapshot.map((c) =>
          candidateMatchesId(c, candidateId)
            ? patchCandidateForColumn(c, "onboarding")
            : c
        );
        setCandidates(nextCandidates);

        const acceptResult = await acceptOfferForKanban(offerId);
        if (!acceptResult.success) {
          setCandidates(snapshot);
          toast.error(acceptResult.error || "Failed to accept offer");
          return;
        }

        toast.success(
          "Offer accepted. Candidate moved to onboarding queue."
        );
        await loadBoard({ silent: true });
        notifyRecruitmentPagesCandidatesChanged({ stageMove: true });
        return;
      }

      const nextCandidates = snapshot.map((c) =>
        candidateMatchesId(c, candidateId)
          ? patchCandidateForColumn(c, targetColumnId)
          : c
      );
      setCandidates(nextCandidates);

      const result = await persistStageMove(candidateId, targetColumnId);

      if (!result.success) {
        setCandidates(snapshot);
        toast.error(result.error || "Could not move candidate");
        return;
      }

      notifyRecruitmentPagesCandidatesChanged({ stageMove: true });
    },
    [draggedItem, candidates, persistStageMove, loadBoard, onKanbanAppliedToInterview, onKanbanInterviewedToOffer, acceptOfferForKanban]
  );

  const totalCandidates = candidates.length;
  const filteredCount = searchFilteredCandidates.length;

  const outerSx = embedded
    ? {
        bgcolor: "#F5F7FA",
        borderRadius: 2,
        px: { xs: 1.5, sm: 2, md: 2.5 },
        py: { xs: 2, sm: 2.5 },
        mx: { xs: -0.5, sm: 0 },
      }
    : {
        bgcolor: "#F5F7FA",
        minHeight: "100vh",
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 3 },
      };

  return (
    <>
      {!embedded && <ToastContainer />}
      {!embedded && (
        <div className={styles.pageTitle}>
          <h1>Recruitment Kanban</h1>
          <ul>
            <li>
              <Link href="/hr/recruitment/">Recruitment</Link>
            </li>
            <li>Kanban</li>
          </ul>
        </div>
      )}

      <Box sx={outerSx}>
        {/* Toolbar — pattern aligned with Help Desk board */}
        <Box sx={{ mb: embedded ? 2 : 3, flexShrink: 0 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "stretch", md: "center" },
              gap: 2,
              mb: embedded ? 0 : 1,
            }}
          >
            {!embedded && (
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: "#1A202C",
                  fontSize: { xs: "1.35rem", md: "1.5rem" },
                  flexShrink: 0,
                }}
              >
                Recruitment Board
              </Typography>
            )}

            <Box
              sx={{
                display: "flex",
                flex: 1,
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "stretch", sm: "center" },
                gap: 2,
                minWidth: 0,
              }}
            >
              <Box sx={{ flex: { md: 1 }, minWidth: 0, display: { md: "block" } }} />

              <Box
                sx={{
                  flex: { md: "0 1 auto" },
                  width: "100%",
                  maxWidth: { sm: "450px", md: "480px" },
                  mx: { md: "auto" },
                }}
              >
                <TextField
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

              <Box
                sx={{
                  flex: { md: 1 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: { xs: "stretch", sm: "flex-end" },
                  gap: 1.5,
                  flexWrap: "wrap",
                  minWidth: 0,
                }}
              >
                {canCreate && typeof onAddCandidate === "function" && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onAddCandidate}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 2,
                      boxShadow: "0 2px 4px rgba(66, 153, 225, 0.25)",
                      flexShrink: 0,
                    }}
                  >
                    New Candidate
                  </Button>
                )}
                <IconButton
                  color="primary"
                  onClick={() => setFilterDrawer(true)}
                  sx={{
                    bgcolor: "white",
                    border: "1px solid #E2E8F0",
                    flexShrink: 0,
                    "&:hover": {
                      bgcolor: "#F7FAFC",
                      borderColor: "#CBD5E0",
                    },
                  }}
                  aria-label="Filters"
                >
                  <FilterAltOutlinedIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>

          <Typography variant="caption" sx={{ color: "#718096", display: "block", mt: embedded ? 1 : 0 }}>
            {loading
              ? " "
              : `${filteredCount} of ${totalCandidates} candidate${totalCandidates === 1 ? "" : "s"} shown · Drag cards to change stage`}
          </Typography>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 8,
            }}
          >
            <CircularProgress size={28} />
            <Typography color="text.secondary" sx={{ ml: 2 }}>
              Loading board...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              gap: { xs: 1.25, sm: 1.5, md: 2 },
              overflowX: "auto",
              overflowY: "hidden",
              pb: { xs: 1.5, sm: 2 },
              px: { xs: 0.5, sm: 0 },
              mx: { xs: -0.5, sm: 0 },
              minHeight: embedded ? { xs: 360, md: 420 } : { xs: 400, md: 480 },
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
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "smooth",
            }}
          >
            {visibleBoard.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                columnMaxHeight={
                  embedded ? "min(72vh, calc(100vh - 280px))" : "calc(100vh - 220px)"
                }
                onDragStart={handleDragStart}
                onDropCard={handleDropCard}
                onDragEnd={handleDragEnd}
                onCardClick={handleKanbanCardClick}
                onViewCandidateDetail={(item) => openCandidateDetail(item.id)}
                onViewInterviewNotes={openInterviewNotesReadOnly}
              />
            ))}
          </Box>
        )}

        <Drawer anchor="right" open={filterDrawer} onClose={() => setFilterDrawer(false)}>
          <Box sx={{ width: { xs: 280, sm: 320 }, p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Board filters
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose which pipeline stages are visible. Search only affects the candidate list, not the API.
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={0.5}>
              {COLUMNS.map((col) => (
                <FormControlLabel
                  key={col.id}
                  control={
                    <Checkbox
                      checked={visibleStages[col.id] !== false}
                      onChange={(e) =>
                        setVisibleStages((prev) => ({
                          ...prev,
                          [col.id]: e.target.checked,
                        }))
                      }
                    />
                  }
                  label={col.title}
                />
              ))}
            </Stack>
            <Button
              sx={{ mt: 2 }}
              onClick={() => setVisibleStages(defaultVisibleStages())}
            >
              Reset stages
            </Button>
          </Box>
        </Drawer>
      </Box>

      <Dialog
        open={interviewNotesReadOnlyState.open}
        onClose={closeInterviewNotesReadOnlyDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Interview Notes</DialogTitle>
        <DialogContent>
          {interviewNotesReadOnlyState.loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={32} />
            </Box>
          ) : interviewNotesReadOnlyState.notes ? (
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
                {interviewNotesReadOnlyState.notes}
              </Typography>
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ py: 1 }}>
              No notes recorded for this interview.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={closeInterviewNotesReadOnlyDialog}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            CLOSE
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={interviewToInterviewedState.open}
        onClose={(event, reason) => {
          if (interviewToInterviewedState.actionLoading) {
            return;
          }
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            handleInterviewToInterviewedCancel();
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Interview Notes</DialogTitle>
        <DialogContent>
          {interviewToInterviewedState.fetchLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <TextField
              fullWidth
              multiline
              minRows={4}
              placeholder="Add notes for the interviewer..."
              value={interviewToInterviewedState.notesDraft}
              onChange={(e) =>
                setInterviewToInterviewedState((prev) => ({
                  ...prev,
                  notesDraft: e.target.value,
                }))
              }
              disabled={interviewToInterviewedState.actionLoading}
              sx={{
                mt: 0.5,
                "& .MuiOutlinedInput-root": {
                  bgcolor: "background.paper",
                  alignItems: "flex-start",
                },
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: "wrap" }}>
          <Button
            onClick={handleInterviewToInterviewedCancel}
            disabled={interviewToInterviewedState.actionLoading}
            sx={{ textTransform: "none" }}
          >
            CANCEL
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            onClick={handleInterviewToInterviewedSkip}
            disabled={
              interviewToInterviewedState.actionLoading || interviewToInterviewedState.fetchLoading
            }
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            SKIP
          </Button>
          <Button
            variant="contained"
            onClick={handleInterviewToInterviewedSaveAndContinue}
            disabled={
              interviewToInterviewedState.actionLoading ||
              interviewToInterviewedState.fetchLoading ||
              !interviewToInterviewedState.interviewId
            }
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {"SAVE & CONTINUE"}
          </Button>
        </DialogActions>
      </Dialog>

      <CandidateDetailDialog
        open={detailOpen}
        loading={detailLoading}
        error={detailError}
        data={detailData}
        onClose={closeCandidateDetail}
      />
    </>
  );
}

function formatKanbanCardDate(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  } catch {
    return "—";
  }
}

function KanbanColumn({
  column,
  columnMaxHeight,
  onDragStart,
  onDropCard,
  onDragEnd,
  onCardClick,
  onViewCandidateDetail,
  onViewInterviewNotes,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    onDropCard?.(column.id);
  };

  const { color, bgColor, columnBg } = column;

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        minWidth: { xs: "260px", sm: "280px", md: "300px", lg: "320px" },
        width: { xs: "260px", sm: "280px", md: "300px", lg: "320px" },
        maxWidth: { xs: "calc(100vw - 32px)", sm: "none" },
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: columnBg,
        borderRadius: { xs: 1.5, sm: 2 },
        p: { xs: 1, sm: 1.25, md: 1.5 },
        border: `2px solid ${color}40`,
        maxHeight: columnMaxHeight,
      }}
    >
      <Box
        sx={{
          mb: { xs: 1, sm: 1.25, md: 1.5 },
          p: { xs: 1, sm: 1.25, md: 1.5 },
          bgcolor: "white",
          borderRadius: { xs: 1.5, sm: 2 },
          border: isDragOver ? `2px solid ${color}` : `1px solid ${color}60`,
          boxShadow: isDragOver
            ? `0 4px 12px ${color}40`
            : `0 2px 4px ${color}20`,
          transition: "all 0.2s",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color,
              fontSize: { xs: "0.875rem", sm: "0.9375rem", md: "1rem" },
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {column.title}
          </Typography>
          <Chip
            label={column.items.length}
            size="small"
            sx={{
              bgcolor: bgColor,
              color,
              fontWeight: 600,
              minWidth: { xs: "28px", sm: "32px" },
              height: { xs: "24px", sm: "28px" },
              fontSize: { xs: "0.6875rem", sm: "0.75rem" },
              flexShrink: 0,
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: { xs: 0.75, sm: 1 },
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          p: isDragOver ? { xs: 0.25, sm: 0.5 } : 0,
          transition: "all 0.2s ease",
          bgcolor: isDragOver ? `${bgColor}99` : "transparent",
          border: isDragOver ? `2px dashed ${color}` : "2px dashed transparent",
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
        {column.items.length === 0 ? (
          <Box
            sx={{
              p: 3,
              textAlign: "center",
              color: "#A0AEC0",
              fontSize: "0.875rem",
            }}
          >
            No candidates
          </Box>
        ) : (
          column.items.map((item) => (
            <KanbanCard
              key={String(item.id)}
              item={item}
              columnId={column.id}
              columnColor={color}
              stageTitle={column.title}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onClick={onCardClick}
              onViewCandidateDetail={onViewCandidateDetail}
              onViewInterviewNotes={
                column.id === "interviewed" ? onViewInterviewNotes : undefined
              }
            />
          ))
        )}
      </Box>
    </Box>
  );
}

function KanbanCard({
  item,
  columnId,
  columnColor,
  stageTitle,
  onDragStart,
  onDragEnd,
  onClick,
  onViewCandidateDetail,
  onViewInterviewNotes,
}) {
  const wasDraggedRef = useRef(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const handleViewDetails = () => {
    setMenuAnchor(null);
    onViewCandidateDetail?.(item);
  };

  const handleViewInterviewNotes = () => {
    setMenuAnchor(null);
    onViewInterviewNotes?.(item);
  };

  const phoneDisplay = String(item.phone ?? "").trim();
  const isOnboardingColumn = columnId === "onboarding";

  return (
    <Box
      draggable={!isOnboardingColumn}
      onDragStart={
        isOnboardingColumn
          ? undefined
          : (event) => {
              wasDraggedRef.current = true;
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData(
                "application/json",
                JSON.stringify({ columnId, itemId: item.id })
              );
              onDragStart?.(columnId, item.id);
            }
      }
      onDragEnd={
        isOnboardingColumn
          ? undefined
          : () => {
              setTimeout(() => {
                wasDraggedRef.current = false;
              }, 50);
              onDragEnd?.();
            }
      }
      onClick={(e) => {
        if (wasDraggedRef.current) return;
        if (e.target.closest("button") || e.target.closest('[role="button"]')) return;
        onClick?.(item, columnId);
      }}
      sx={{
        cursor: isOnboardingColumn ? "default" : "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: isOnboardingColumn ? "auto" : "none",
        transition: "all 0.2s ease",
        ...(!isOnboardingColumn
          ? {
              "&:active": { cursor: "grabbing" },
              "&:hover": {
                transform: "translateY(-2px)",
              },
            }
          : {}),
      }}
    >
      <Card
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: { xs: 1.5, sm: 2 },
          border: `1px solid ${columnColor}33`,
          borderLeft: { xs: `4px solid ${columnColor}`, sm: `5px solid ${columnColor}` },
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          transition: "all 0.2s ease",
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          },
        }}
      >
        <CardContent
          sx={{
            p: { xs: 1, sm: 1.125 },
            "&:last-child": { pb: { xs: 1, sm: 1.125 } },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: { xs: 0.5, sm: 0.75 },
              gap: 0.5,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: "#2D3748",
                fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
                minWidth: 0,
              }}
              title={item.name}
            >
              {item.name}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setMenuAnchor(e.currentTarget);
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
                flexShrink: 0,
                minWidth: { xs: "28px", sm: "32px" },
                width: { xs: "28px", sm: "32px" },
                height: { xs: "28px", sm: "32px" },
              }}
              aria-label="Candidate actions"
            >
              <MoreVertIcon sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }} />
            </IconButton>
          </Box>

          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: "#1A202C",
              mb: { xs: 0.75, sm: 1 },
              fontSize: { xs: "0.75rem", sm: "0.8125rem" },
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            title={item.jobOpeningTitle}
          >
            {item.jobOpeningTitle}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: { xs: 0.75, sm: 1 } }}>
            <Chip
              label={stageTitle}
              size="small"
              sx={{
                height: 22,
                fontSize: "0.6875rem",
                fontWeight: 600,
                bgcolor: `${columnColor}18`,
                color: columnColor,
                border: `1px solid ${columnColor}40`,
              }}
            />
          </Box>

          {item.email ? (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{ mb: { xs: 0.75, sm: 1 }, color: "#4A5568" }}
            >
              <EmailOutlinedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
              <Typography
                variant="caption"
                noWrap
                title={item.email}
                sx={{ flex: 1, minWidth: 0, fontSize: "0.75rem" }}
              >
                {item.email}
              </Typography>
            </Stack>
          ) : null}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              pt: 0.5,
              borderTop: "1px solid #EDF2F7",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: phoneDisplay ? "#4A5568" : "#A0AEC0",
                fontSize: "0.6875rem",
                fontWeight: phoneDisplay ? 500 : 400,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
                minWidth: 0,
              }}
              title={phoneDisplay || undefined}
            >
              {phoneDisplay || "No phone"}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#718096", fontSize: "0.6875rem", flexShrink: 0 }}
            >
              {formatKanbanCardDate(item.appliedOn)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails();
          }}
        >
          <VisibilityOutlinedIcon fontSize="small" sx={{ mr: 1, color: "#718096" }} />
          View details
        </MenuItem>
        {onViewInterviewNotes ? (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleViewInterviewNotes();
            }}
          >
            <DescriptionIcon fontSize="small" sx={{ mr: 1, color: "#718096" }} />
            View Notes
          </MenuItem>
        ) : null}
      </Menu>
    </Box>
  );
}

const CANDIDATE_STATUS_LABELS = {
  0: "Applied",
  1: "Shortlisted",
  2: "Interviewing",
  3: "Offered",
  4: "Hired",
  5: "Rejected",
  6: "Withdrawn",
};

const CANDIDATE_STAGE_LABELS = {
  0: "Draft",
  1: "Sourcing",
  2: "Screening",
  3: "Interview",
  4: "Offer",
  5: "Hired",
  6: "Rejected",
};

function formatDate(value) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  } catch {
    return "-";
  }
}

function DetailField({ label, value, xs = 6 }) {
  return (
    <Grid item xs={xs}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: "break-word" }}>
        {value ?? "-"}
      </Typography>
    </Grid>
  );
}

function CandidateDetailDialog({ open, loading, error, data, onClose }) {
  const { formatAmountForCurrency } = useCurrency();
  const candidate = data?.candidate || data?.Candidate || data || {};
  const offer = data?.offer || data?.Offer;

  const firstName = candidate?.firstName || candidate?.FirstName || "";
  const lastName = candidate?.lastName || candidate?.LastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Candidate Details";

  const email = candidate?.email || candidate?.Email || "";
  const phone = candidate?.phone || candidate?.Phone || "";
  const experience =
    candidate?.experienceYears ??
    candidate?.ExperienceYears ??
    null;
  const currentCompany =
    candidate?.currentCompany || candidate?.CurrentCompany || "";
  const source = candidate?.source || candidate?.Source || "Direct";
  const appliedOn = candidate?.appliedOn || candidate?.AppliedOn;
  const notes = candidate?.notes || candidate?.Notes || "";
  const jobOpeningTitle =
    candidate?.jobOpeningName ||
    candidate?.JobOpeningName ||
    candidate?.jobOpeningTitle ||
    candidate?.JobOpeningTitle ||
    "";

  const statusRaw = candidate?.status ?? candidate?.Status;
  const stageRaw = candidate?.stage ?? candidate?.Stage;
  const statusLabel =
    (typeof statusRaw === "number" && CANDIDATE_STATUS_LABELS[statusRaw]) ||
    (typeof statusRaw === "string" ? statusRaw : "Applied");
  const stageLabel =
    (typeof stageRaw === "number" && CANDIDATE_STAGE_LABELS[stageRaw]) ||
    (typeof stageRaw === "string" ? stageRaw : "Sourcing");

  const resumeUrl = candidate?.resumeUrl || candidate?.ResumeUrl || "";
  const resumeFileName = (() => {
    if (!resumeUrl) return "";
    try {
      const pathname = new URL(resumeUrl).pathname;
      const segs = pathname.split("/").filter(Boolean);
      return decodeURIComponent(segs[segs.length - 1] || "CV");
    } catch {
      const segs = resumeUrl.split("/").filter(Boolean);
      return decodeURIComponent(segs[segs.length - 1] || "CV");
    }
  })();

  const handleDownload = async () => {
    if (!resumeUrl) return;
    try {
      const response = await fetch(resumeUrl);
      if (!response.ok) throw new Error("Failed to fetch CV file");
      const blob = await response.blob();
      const ext = resumeFileName.includes(".")
        ? resumeFileName.substring(resumeFileName.lastIndexOf("."))
        : "";
      const suggestedName = `${fullName.replace(/\s+/g, "_") || "candidate"}_CV${ext}`;
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = suggestedName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(resumeUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        {loading ? "Candidate Details" : fullName}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8, color: "grey.500" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ textAlign: "center", py: 3 }}>
            {error}
          </Typography>
        ) : !data ? (
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
            No details available.
          </Typography>
        ) : (
          <Stack spacing={2.5}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip label={`Status: ${statusLabel}`} size="small" color="primary" />
                <Chip label={`Stage: ${stageLabel}`} size="small" variant="outlined" />
                {jobOpeningTitle && (
                  <Chip
                    icon={<WorkOutlineIcon />}
                    label={jobOpeningTitle}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Basic Information
              </Typography>
              <Grid container spacing={1.5}>
                <DetailField label="Email" value={email || "-"} />
                <DetailField label="Phone" value={phone || "-"} />
                <DetailField
                  label="Experience (Years)"
                  value={experience !== null && experience !== undefined ? experience : "-"}
                />
                <DetailField label="Current Company" value={currentCompany || "-"} />
                <DetailField label="Source" value={source || "-"} />
                <DetailField
                  label="Applied On"
                  value={appliedOn ? formatDate(appliedOn) : "-"}
                />
                {notes ? (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Notes
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {notes}
                    </Typography>
                  </Grid>
                ) : null}
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                CV / Resume
              </Typography>
              {resumeUrl ? (
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
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={resumeFileName}>
                        {resumeFileName}
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
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No CV uploaded for this candidate.
                </Typography>
              )}
            </Box>

            {offer ? (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Offer
                  </Typography>
                  <Grid container spacing={1.5}>
                    <DetailField
                      label="Offer Number"
                      value={offer.offerNumber || offer.OfferNumber || "-"}
                    />
                    <DetailField
                      label="Status"
                      value={offer.status || offer.Status || "-"}
                    />
                    <DetailField
                      label="Salary"
                      value={formatAmountForCurrency(
                        offer.salary ?? offer.Salary ?? 0,
                        offer.currency || offer.Currency
                      )}
                    />
                    <DetailField
                      label="Join Date"
                      value={formatDate(offer.joinDate || offer.JoinDate)}
                    />
                  </Grid>
                </Box>
              </>
            ) : null}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

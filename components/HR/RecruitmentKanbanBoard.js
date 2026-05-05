import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
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

const COLUMNS = [
  { id: "applied", title: "Applied", color: "#3b82f6" },
  { id: "interview", title: "Interview", color: "#6366f1" },
  { id: "interviewed", title: "Interviewed", color: "#8b5cf6" },
  { id: "offer", title: "Offer", color: "#f59e0b" },
  { id: "hired", title: "Hired", color: "#10b981" },
  { id: "rejected", title: "Rejected", color: "#ef4444" },
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
// Draft=0, Sourcing=1, Screening=2, Interview=3, Offer=4, Hired=5, Rejected=6, Interviewed=7
const COLUMN_OPTIMISTIC = {
  applied: { stage: 1, status: 0 },
  interview: { stage: 3, status: 2 },
  interviewed: { stage: 7, status: 2 },
  offer: { stage: 4, status: 3 },
  hired: { stage: 5, status: 4 },
  rejected: { stage: 6, status: 5 },
};

const HR_RECRUITMENT_CANDIDATES_CHANGED = "hr-recruitment-candidates-changed";

function notifyRecruitmentPagesCandidatesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HR_RECRUITMENT_CANDIDATES_CHANGED));
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

  const stageStr =
    typeof rawStage === "string" ? rawStage.toLowerCase() : "";
  if (stageStr) {
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

export default function RecruitmentKanbanBoard({ embedded = false } = {}) {
  const [candidates, setCandidates] = useState([]);
  const [jobOpeningMap, setJobOpeningMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const draggedItemRef = useRef(null);

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

  const loadBoard = useCallback(async () => {
    try {
      setLoading(true);
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
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onChanged = () => {
      loadBoard();
    };
    window.addEventListener(HR_RECRUITMENT_CANDIDATES_CHANGED, onChanged);
    return () => {
      window.removeEventListener(HR_RECRUITMENT_CANDIDATES_CHANGED, onChanged);
    };
  }, [loadBoard]);

  const board = useMemo(() => {
    const buckets = COLUMNS.reduce((acc, column) => {
      acc[column.id] = [];
      return acc;
    }, {});

    candidates.forEach((candidate) => {
      const columnId = resolveColumnId(candidate);
      if (!buckets[columnId]) return;
      const id = getCandidateId(candidate);
      buckets[columnId].push({
        id,
        name: getFullName(candidate),
        email: candidate?.email || candidate?.Email || "",
        jobOpeningTitle: getJobOpeningTitle(candidate, jobOpeningMap),
        raw: candidate,
      });
    });

    return COLUMNS.map((column) => ({
      ...column,
      items: buckets[column.id],
    }));
  }, [candidates, jobOpeningMap]);

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

      const candidateId = itemId;
      if (candidateId === undefined || candidateId === null || candidateId === "") {
        toast.error("Candidate id is missing");
        return;
      }

      const snapshot = candidates;
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

      notifyRecruitmentPagesCandidatesChanged();
    },
    [draggedItem, candidates, persistStageMove]
  );

  const totalCandidates = candidates.length;

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

      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 3 }}
      >
        <Typography variant="subtitle1" color="text.secondary">
          Visual view of the recruitment pipeline by stage — drag cards to change stage
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          {totalCandidates} candidate{totalCandidates === 1 ? "" : "s"} across{" "}
          {COLUMNS.length} stages
        </Typography>
      </Stack>

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
            flexDirection: "row",
            alignItems: "flex-start",
            overflowX: "auto",
            pb: 3,
            pr: 1,
            scrollbarWidth: "thin",
            "&::-webkit-scrollbar": { height: 8 },
            "&::-webkit-scrollbar-thumb": {
              borderRadius: 10,
              backgroundColor: "rgba(148, 163, 184, 0.6)",
            },
          }}
        >
          {board.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onDragStart={handleDragStart}
              onDropCard={handleDropCard}
              onDragEnd={handleDragEnd}
              onCardClick={openCandidateDetail}
            />
          ))}
        </Box>
      )}

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

function KanbanColumn({ column, onDragStart, onDropCard, onDragEnd, onCardClick }) {
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

  return (
    <Box
      sx={{
        minWidth: { xs: 280, md: 300 },
        maxWidth: { xs: 280, md: 300 },
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.paper",
        borderRadius: 3,
        p: 2,
        mr: 2,
        boxShadow: "0px 8px 24px rgba(15, 23, 42, 0.06)",
        border: "1px solid",
        borderColor: isDragOver ? "primary.main" : "divider",
        maxHeight: "calc(100vh - 220px)",
        transition: "border-color 0.2s ease",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ pb: 1.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: column.color,
            }}
          />
          <Typography variant="subtitle1" fontWeight={600}>
            {column.title}
          </Typography>
        </Stack>
        <Chip
          label={column.items.length}
          size="small"
          sx={{
            fontWeight: 600,
            backgroundColor: `${column.color}20`,
            color: column.color,
          }}
        />
      </Stack>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          display: "grid",
          gap: 1.5,
          pr: 0.5,
        }}
      >
        {column.items.length === 0 ? (
          <Box
            sx={{
              borderRadius: 2,
              border: "1px dashed",
              borderColor: "divider",
              p: 3,
              textAlign: "center",
              color: "text.secondary",
              fontSize: "0.85rem",
              bgcolor: "background.default",
            }}
          >
            No candidates in this stage
          </Box>
        ) : (
          column.items.map((item) => (
            <KanbanCard
              key={String(item.id)}
              item={item}
              columnId={column.id}
              columnColor={column.color}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onClick={onCardClick}
            />
          ))
        )}
      </Box>
    </Box>
  );
}

function KanbanCard({ item, columnId, columnColor, onDragStart, onDragEnd, onClick }) {
  const wasDraggedRef = useRef(false);

  return (
    <Paper
      variant="outlined"
      draggable
      onDragStart={(event) => {
        wasDraggedRef.current = true;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(
          "application/json",
          JSON.stringify({ columnId, itemId: item.id })
        );
        onDragStart?.(columnId, item.id);
      }}
      onDragEnd={() => {
        setTimeout(() => {
          wasDraggedRef.current = false;
        }, 50);
        onDragEnd?.();
      }}
      onClick={() => {
        if (wasDraggedRef.current) return;
        onClick?.(item.id);
      }}
      sx={{
        p: 1.75,
        borderRadius: 2,
        borderLeft: `3px solid ${columnColor}`,
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0px 10px 24px rgba(15, 23, 42, 0.08)",
        },
        "&:active": {
          cursor: "grabbing",
        },
      }}
    >
      <Typography variant="subtitle2" fontWeight={600} noWrap title={item.name}>
        {item.name}
      </Typography>

      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{ mt: 0.75, color: "text.secondary" }}
      >
        <WorkOutlineIcon sx={{ fontSize: 16 }} />
        <Typography
          variant="caption"
          noWrap
          title={item.jobOpeningTitle}
          sx={{ flexGrow: 1 }}
        >
          {item.jobOpeningTitle}
        </Typography>
      </Stack>

      {item.email ? (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{ mt: 0.5, color: "text.secondary" }}
        >
          <EmailOutlinedIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" noWrap title={item.email} sx={{ flexGrow: 1 }}>
            {item.email}
          </Typography>
        </Stack>
      ) : null}
    </Paper>
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

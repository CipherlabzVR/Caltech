import { useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Collapse,
  IconButton,
  Typography,
  Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReplayIcon from "@mui/icons-material/Replay";

function formatDateTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function AttemptAnswer({ attempt }) {
  const itemType = attempt.itemType || attempt.ItemType || "Checkbox";
  const selectedValue = attempt.selectedValue ?? attempt.SelectedValue;
  const imageUrl = attempt.imageUrl ?? attempt.ImageUrl;
  const isCompleted = attempt.isCompleted ?? attempt.IsCompleted;

  if (itemType === "Image" && imageUrl) {
    return (
      <Box sx={{ mt: 1 }}>
        <img
          src={imageUrl}
          alt={`Attempt ${attempt.attemptNumber ?? attempt.AttemptNumber}`}
          style={{
            maxWidth: "100%",
            maxHeight: 140,
            borderRadius: 6,
            border: "1px solid #ddd",
            display: "block",
          }}
        />
      </Box>
    );
  }

  if ((itemType === "Radio" || itemType === "Dropdown") && selectedValue) {
    return (
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        Answer: <strong>{selectedValue}</strong>
      </Typography>
    );
  }

  return (
    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
      {isCompleted ? (
        <>
          <CheckCircleIcon color="success" fontSize="small" />
          <Typography variant="body2">Marked complete</Typography>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Not completed
        </Typography>
      )}
    </Box>
  );
}

/**
 * Shows the amber "Redo required" banner and a collapsible previous-attempts list.
 * @param {object} props
 * @param {object} props.item - checklist item with needsRedo / responses
 * @param {boolean} [props.readOnly] - when true, still shows history (technician view)
 */
export default function ChecklistItemHistory({ item, readOnly = false }) {
  const [expanded, setExpanded] = useState(false);

  if (!item) return null;

  const needsRedo = Boolean(item.needsRedo ?? item.NeedsRedo);
  const redoReason = item.redoReason ?? item.RedoReason;
  const redoRequestedByName = item.redoRequestedByName ?? item.RedoRequestedByName;
  const redoRequestedOn = item.redoRequestedOn ?? item.RedoRequestedOn;

  const responses = Array.isArray(item.responses)
    ? item.responses
    : Array.isArray(item.Responses)
      ? item.Responses
      : [];

  // History of previous (non-current) attempts — current live answer is shown elsewhere.
  // When NeedsRedo, the rejected attempt is still IsCurrent=true until technician re-answers,
  // so include all responses that have a redo reason OR are not current.
  const historyAttempts = responses.filter((r) => {
    const isCurrent = r.isCurrent ?? r.IsCurrent;
    const hasRedoReason = Boolean(r.redoReason ?? r.RedoReason);
    if (needsRedo) {
      // Show the rejected current attempt plus older ones
      return true;
    }
    // After a new answer, show only non-current history
    return !isCurrent || hasRedoReason;
  });

  // Prefer non-current for "previous"; if NeedsRedo and only current exists, still show it as history
  const previousAttempts = needsRedo
    ? historyAttempts
    : historyAttempts.filter((r) => !(r.isCurrent ?? r.IsCurrent));

  const attemptCount = previousAttempts.length;

  if (!needsRedo && attemptCount === 0) {
    return null;
  }

  return (
    <Box sx={{ ml: { xs: 0, sm: 4 }, mt: 1.5 }}>
      {needsRedo && (
        <Alert
          severity="warning"
          icon={<ReplayIcon fontSize="inherit" />}
          sx={{ mb: attemptCount > 0 ? 1 : 0 }}
        >
          <Typography variant="subtitle2" fontWeight={600}>
            Redo required{readOnly ? "" : " (manager)"}
          </Typography>
          {redoReason && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {redoReason}
            </Typography>
          )}
          {(redoRequestedByName || redoRequestedOn) && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {[
                redoRequestedByName ? `Requested by ${redoRequestedByName}` : null,
                redoRequestedOn ? formatDateTime(redoRequestedOn) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Typography>
          )}
        </Alert>
      )}

      {attemptCount > 0 && (
        <Box>
          <Box
            display="flex"
            alignItems="center"
            sx={{ cursor: "pointer", userSelect: "none" }}
            onClick={() => setExpanded((v) => !v)}
          >
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Previous attempts ({attemptCount})
            </Typography>
            <IconButton size="small" sx={{ ml: 0.5 }}>
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>

          <Collapse in={expanded}>
            <Box display="flex" flexDirection="column" gap={1} mt={1}>
              {previousAttempts.map((attempt) => {
                const attemptNumber = attempt.attemptNumber ?? attempt.AttemptNumber;
                const submittedByName = attempt.submittedByName ?? attempt.SubmittedByName;
                const submittedOn = attempt.submittedOn ?? attempt.SubmittedOn;
                const attemptRedoReason = attempt.redoReason ?? attempt.RedoReason;
                const attemptRedoBy = attempt.redoRequestedByName ?? attempt.RedoRequestedByName;
                const key = attempt.id ?? attempt.Id ?? `${attemptNumber}-${submittedOn}`;

                return (
                  <Paper
                    key={key}
                    variant="outlined"
                    sx={{ p: 1.5, bgcolor: "grey.50" }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={0.5}>
                      <Typography variant="subtitle2">
                        Attempt #{attemptNumber}
                      </Typography>
                      {attemptRedoReason ? (
                        <Chip size="small" color="warning" label="Sent back" />
                      ) : null}
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {[
                        submittedByName ? `By ${submittedByName}` : null,
                        submittedOn ? formatDateTime(submittedOn) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Typography>
                    <AttemptAnswer attempt={attempt} />
                    {attemptRedoReason && (
                      <Typography variant="caption" color="warning.dark" display="block" sx={{ mt: 1 }}>
                        Redo reason{attemptRedoBy ? ` (${attemptRedoBy})` : ""}: {attemptRedoReason}
                      </Typography>
                    )}
                  </Paper>
                );
              })}
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
}

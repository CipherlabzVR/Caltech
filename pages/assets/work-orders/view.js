import React, { useCallback, useEffect, useState } from "react";
import {
  Grid,
  Typography,
  Box,
  Button,
  Modal,
  Tooltip,
  IconButton,
  Chip,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

const modalShellSx = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "calc(100vw - 24px)", sm: "min(94vw, 920px)" },
  maxWidth: 920,
  maxHeight: "min(92vh, 960px)",
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: (theme) => theme.shadows[12],
  border: (theme) => `1px solid ${theme.palette.divider}`,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  outline: "none",
};

const sectionTitleSx = {
  py: 1,
  px: 1.5,
  mb: 0.5,
  borderRadius: 1,
  borderLeft: 4,
  borderLeftColor: "primary.main",
  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
};

const detailCellSx = {
  height: "100%",
  p: 1.75,
  borderRadius: 1.5,
  border: 1,
  borderColor: "divider",
  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.06),
  transition: "box-shadow 120ms ease, border-color 120ms ease",
  "&:hover": {
    borderColor: "action.selected",
    boxShadow: 1,
  },
};

const labelSx = {
  display: "block",
  mb: 0.75,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  fontSize: "0.65rem",
  color: "text.secondary",
};

const valueSx = {
  fontWeight: 600,
  lineHeight: 1.45,
  color: "text.primary",
  wordBreak: "break-word",
};

const getWorkOrderTypeLabel = (t) => {
  switch (Number(t)) {
    case 1:
      return "Preventive";
    case 2:
      return "Corrective";
    case 3:
      return "Inspection";
    case 4:
      return "Emergency";
    default:
      return "—";
  }
};

const emptyDraftRow = () => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  partName: "",
  partNumber: "",
  quantity: "",
  unitOfMeasure: "",
  unitCost: "",
  totalCost: "",
  inventoryItemId: "",
});

export default function ViewWorkOrder({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const [draftParts, setDraftParts] = useState([]);
  const [savingParts, setSavingParts] = useState(false);
  const [partsList, setPartsList] = useState([]);
  const [partsLoading, setPartsLoading] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    if (open) setDraftParts([]);
  }, [open]);

  const loadWorkOrderParts = useCallback(async () => {
    const woId = item?.id;
    if (!woId) return;
    setPartsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/maintenance/work-orders/${woId}/parts`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json().catch(() => ({}));
      const ok =
        res.ok &&
        (data.statusCode === 200 ||
          data.status === "SUCCESS" ||
          data.StatusCode === 200);
      const raw = data.result ?? data.Result;
      if (ok && Array.isArray(raw)) {
        setPartsList(raw);
        return;
      }
      setPartsList([]);
    } catch {
      setPartsList([]);
    } finally {
      setPartsLoading(false);
    }
  }, [item?.id]);

  useEffect(() => {
    if (!open) {
      setPartsList([]);
      return;
    }
    loadWorkOrderParts();
  }, [open, loadWorkOrderParts]);

  const partsLocked = item?.status === 5;

  const getStatusChip = (status) => {
    const statusMap = {
      1: { label: "Open", color: "info" },
      2: { label: "In Progress", color: "warning" },
      3: { label: "On Hold", color: "default" },
      4: { label: "Completed", color: "success" },
      5: { label: "Cancelled", color: "error" },
    };
    const config = statusMap[status] || { label: "Unknown", color: "default" };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 1:
        return "Low";
      case 2:
        return "Medium";
      case 3:
        return "High";
      case 4:
        return "Critical";
      default:
        return "Unknown";
    }
  };

  const DetailRow = ({ label, value }) => (
    <Grid item xs={12} sm={6} md={4}>
      <Box sx={detailCellSx}>
        <Typography variant="caption" sx={labelSx}>
          {label}
        </Typography>
        <Typography variant="body2" sx={valueSx}>
          {value ?? "—"}
        </Typography>
      </Box>
    </Grid>
  );

  const SectionHeading = ({ children }) => (
    <Grid item xs={12}>
      <Box sx={sectionTitleSx}>
        <Typography
          variant="overline"
          sx={{ fontWeight: 700, letterSpacing: "0.12em", color: "primary.main", lineHeight: 1.3 }}
        >
          {children}
        </Typography>
      </Box>
    </Grid>
  );

  const addDraftRow = () => {
    setDraftParts((rows) => [...rows, emptyDraftRow()]);
  };

  const updateDraft = useCallback((key, field, value) => {
    setDraftParts((rows) =>
      rows.map((r) => (r.key === key ? { ...r, [field]: value } : r))
    );
  }, []);

  const removeDraft = (key) => {
    setDraftParts((rows) => rows.filter((r) => r.key !== key));
  };

  const buildPayloadParts = () => {
    const out = [];
    for (const d of draftParts) {
      const name = String(d.partName || "").trim();
      const q = Number(d.quantity);
      if (!name || Number.isNaN(q) || q <= 0) continue;
      const inv = String(d.inventoryItemId || "").trim();
      const invNum = inv === "" ? null : Number(inv);
      out.push({
        inventoryItemId: invNum != null && !Number.isNaN(invNum) ? invNum : null,
        partName: name,
        partNumber: String(d.partNumber || "").trim() || null,
        quantity: q,
        unitOfMeasure: String(d.unitOfMeasure || "").trim() || null,
        unitCost:
          d.unitCost === "" || d.unitCost == null || String(d.unitCost).trim() === ""
            ? null
            : Number(d.unitCost),
        totalCost:
          d.totalCost === "" || d.totalCost == null || String(d.totalCost).trim() === ""
            ? null
            : Number(d.totalCost),
      });
    }
    return out;
  };

  const validDraftCount = buildPayloadParts().length;

  const saveNewParts = async () => {
    const parts = buildPayloadParts();
    if (parts.length === 0) {
      toast.error("Add at least one part with a name and quantity greater than zero.");
      return;
    }
    setSavingParts(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/maintenance/work-orders/${item.id}/parts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parts }),
      });
      const data = await res.json().catch(() => ({}));
      if (
        res.ok &&
        (data.statusCode === 200 || data.isSuccess || data.status === "SUCCESS")
      ) {
        toast.success(data.message || "Parts saved to work order");
        setDraftParts([]);
        await loadWorkOrderParts();
        if (typeof fetchItems === "function") fetchItems();
      } else {
        toast.error(data.message || "Failed to save parts");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to save parts");
    } finally {
      setSavingParts(false);
    }
  };

  if (!item) return null;

  return (
    <>
      <Tooltip title="View Details" placement="top">
        <IconButton onClick={handleOpen} aria-label="view" size="small">
          <VisibilityIcon color="info" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="view-wo-modal"
        BackdropProps={{
          sx: (theme) => ({
            backgroundColor: alpha(theme.palette.common.black, 0.45),
            backdropFilter: "blur(2px)",
          }),
        }}
      >
        <Box sx={modalShellSx}>
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              py: 2,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.07)} 0%, ${alpha(
                  theme.palette.primary.main,
                  0.02
                )} 55%, transparent 100%)`,
            }}
          >
            <Typography
              id="view-wo-modal"
              variant="h5"
              sx={{ fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}
            >
              Work Order: {item.workOrderNumber}
            </Typography>
            {getStatusChip(item.status)}
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", px: { xs: 2, sm: 3 }, py: 2.5 }}>
            <Grid container spacing={2}>
              <SectionHeading>Summary</SectionHeading>
              <DetailRow
                label="Asset"
                value={(() => {
                  const code = item.asset?.assetCode ?? item.assetCode;
                  const name = item.asset?.assetName ?? item.assetName;
                  const s = [code, name].filter(Boolean).join(" — ");
                  return s || "—";
                })()}
              />
              <DetailRow label="Priority" value={getPriorityText(item.priority)} />
              <DetailRow
                label="Scheduled"
                value={
                  item.scheduledDate
                    ? new Date(item.scheduledDate).toLocaleDateString()
                    : "—"
                }
              />
              <DetailRow label="Type" value={getWorkOrderTypeLabel(item.workOrderType ?? item.WorkOrderType)} />
              <DetailRow
                label="Est. Cost"
                value={
                  item.estimatedCost != null && item.estimatedCost !== ""
                    ? `$${Number(item.estimatedCost).toFixed(2)}`
                    : "—"
                }
              />
              <DetailRow
                label="Actual Cost"
                value={
                  item.actualCost != null && item.actualCost !== ""
                    ? `$${Number(item.actualCost).toFixed(2)}`
                    : "—"
                }
              />

              <Grid item xs={12}>
                <Box sx={{ ...detailCellSx, p: 2 }}>
                  <Typography variant="caption" sx={labelSx}>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ ...valueSx, fontWeight: 500, whiteSpace: "pre-wrap" }}>
                    {item.description || "—"}
                  </Typography>
                </Box>
              </Grid>

              {item.resolutionNotes && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      ...detailCellSx,
                      p: 2,
                      borderColor: (theme) => alpha(theme.palette.success.main, 0.35),
                      bgcolor: (theme) => alpha(theme.palette.success.main, 0.06),
                    }}
                  >
                    <Typography variant="caption" sx={labelSx}>
                      Resolution Notes
                    </Typography>
                    <Typography variant="body2" sx={{ ...valueSx, fontWeight: 500, whiteSpace: "pre-wrap" }}>
                      {item.resolutionNotes}
                    </Typography>
                  </Box>
                </Grid>
              )}

              <SectionHeading>Parts Used</SectionHeading>
              <Grid item xs={12}>
                {partsLoading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
                    <CircularProgress size={22} />
                    <Typography variant="body2" color="text.secondary">
                      Loading parts…
                    </Typography>
                  </Box>
                ) : partsList.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                    No parts recorded yet.
                  </Typography>
                ) : (
                  <TableContainer
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1.5,
                      overflow: "hidden",
                    }}
                  >
                    <Table size="small" aria-label="saved work order parts">
                      <TableHead>
                        <TableRow sx={{ bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08) }}>
                          <TableCell>Part</TableCell>
                          <TableCell>#</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell>UOM</TableCell>
                          <TableCell align="right">Unit $</TableCell>
                          <TableCell align="right">Total $</TableCell>
                          <TableCell align="right">Inv. ID</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {partsList.map((p) => (
                          <TableRow key={p.id ?? `${p.partName}-${p.partNumber}`}>
                            <TableCell>{p.partName}</TableCell>
                            <TableCell>{p.partNumber || "—"}</TableCell>
                            <TableCell align="right">{p.quantity}</TableCell>
                            <TableCell>{p.unitOfMeasure || "—"}</TableCell>
                            <TableCell align="right">
                              {p.unitCost != null ? Number(p.unitCost).toFixed(2) : "—"}
                            </TableCell>
                            <TableCell align="right">
                              {p.totalCost != null ? Number(p.totalCost).toFixed(2) : "—"}
                            </TableCell>
                            <TableCell align="right">
                              {p.inventoryItemId ?? p.InventoryItemId ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Grid>

              {!partsLocked && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary">
                      Add parts (save to attach to this work order)
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={addDraftRow}
                      >
                        Add line
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={savingParts || validDraftCount === 0}
                        onClick={saveNewParts}
                      >
                        {savingParts ? "Saving…" : "Save parts"}
                      </Button>
                    </Box>
                  </Box>

                  {draftParts.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      Use + Add line to enter one or more parts, then Save parts.
                    </Typography>
                  ) : (
                    <TableContainer
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1.5,
                        overflow: "auto",
                      }}
                    >
                      <Table size="small" aria-label="draft work order parts">
                        <TableHead>
                          <TableRow sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06) }}>
                            <TableCell sx={{ minWidth: 140 }}>Part name *</TableCell>
                            <TableCell sx={{ minWidth: 90 }}>Part #</TableCell>
                            <TableCell sx={{ minWidth: 72 }}>Qty *</TableCell>
                            <TableCell sx={{ minWidth: 64 }}>UOM</TableCell>
                            <TableCell sx={{ minWidth: 88 }}>Unit $</TableCell>
                            <TableCell sx={{ minWidth: 88 }}>Total $</TableCell>
                            <TableCell sx={{ minWidth: 80 }}>Inv. item ID</TableCell>
                            <TableCell align="right" sx={{ width: 56 }} />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {draftParts.map((row) => (
                            <TableRow key={row.key}>
                              <TableCell sx={{ verticalAlign: "top", py: 1 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  placeholder="Name"
                                  value={row.partName}
                                  onChange={(e) => updateDraft(row.key, "partName", e.target.value)}
                                />
                              </TableCell>
                              <TableCell sx={{ verticalAlign: "top", py: 1 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={row.partNumber}
                                  onChange={(e) => updateDraft(row.key, "partNumber", e.target.value)}
                                />
                              </TableCell>
                              <TableCell sx={{ verticalAlign: "top", py: 1 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  type="number"
                                  inputProps={{ min: 0, step: "any" }}
                                  value={row.quantity}
                                  onChange={(e) => updateDraft(row.key, "quantity", e.target.value)}
                                />
                              </TableCell>
                              <TableCell sx={{ verticalAlign: "top", py: 1 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  placeholder="EA"
                                  value={row.unitOfMeasure}
                                  onChange={(e) => updateDraft(row.key, "unitOfMeasure", e.target.value)}
                                />
                              </TableCell>
                              <TableCell sx={{ verticalAlign: "top", py: 1 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  type="number"
                                  inputProps={{ min: 0, step: "0.01" }}
                                  value={row.unitCost}
                                  onChange={(e) => updateDraft(row.key, "unitCost", e.target.value)}
                                />
                              </TableCell>
                              <TableCell sx={{ verticalAlign: "top", py: 1 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  type="number"
                                  inputProps={{ min: 0, step: "0.01" }}
                                  value={row.totalCost}
                                  onChange={(e) => updateDraft(row.key, "totalCost", e.target.value)}
                                />
                              </TableCell>
                              <TableCell sx={{ verticalAlign: "top", py: 1 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  type="number"
                                  placeholder="Optional"
                                  inputProps={{ min: 1, step: 1 }}
                                  value={row.inventoryItemId}
                                  onChange={(e) => updateDraft(row.key, "inventoryItemId", e.target.value)}
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ verticalAlign: "top", py: 0.5 }}>
                                <IconButton
                                  size="small"
                                  aria-label="remove line"
                                  onClick={() => removeDraft(row.key)}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Grid>
              )}

              {partsLocked && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Parts cannot be added to a cancelled work order.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>

          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              py: 2,
              borderTop: 1,
              borderColor: "divider",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button variant="contained" onClick={handleClose}>
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

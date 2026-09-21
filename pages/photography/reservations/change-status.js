import React, { useEffect, useMemo, useState } from "react";
import { Grid, IconButton, MenuItem, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import photographyReservationNoteService from "@/Services/photographyReservationNoteService";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 420, xs: 340 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

export default function ChangeStatus({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const [statusId, setStatusId] = useState(item.currentStatusId || "");
  const [remark, setRemark] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [userAgentType, setUserAgentType] = useState(null);

  const loadStatuses = async (agentType) => {
    const token = localStorage.getItem("token");
    const qs = agentType ? `?agentType=${agentType}` : "";
    const res = await fetch(`${BASE_URL}/PhotographyEventStatus/GetActiveStatuses${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const list = data?.result ?? data?.Result ?? [];
    setStatuses(Array.isArray(list) ? list : []);
  };

  const handleOpen = async (e) => {
    e?.stopPropagation?.();
    setStatusId(item.currentStatusId || "");
    setRemark("");
    setOpen(true);
    try {
      const agentRes = await photographyReservationNoteService.getCurrentUserAgentType();
      const type = agentRes?.result?.agentType ?? agentRes?.result?.AgentType ?? null;
      setUserAgentType(type);
      await loadStatuses(type);
    } catch {
      await loadStatuses(null);
    }
  };
  const handleClose = () => setOpen(false);

  const options = useMemo(() => {
    // Always include current status even if not in agent's list, so UI stays consistent.
    const list = [...statuses];
    if (
      item.currentStatusId &&
      !list.some((s) => Number(s.id ?? s.Id) === Number(item.currentStatusId))
    ) {
      list.unshift({
        id: item.currentStatusId,
        name: item.currentStatusName || `Status #${item.currentStatusId}`,
      });
    }
    return list;
  }, [statuses, item.currentStatusId, item.currentStatusName]);

  const handleSave = () => {
    if (!statusId) {
      toast.error("Please select a status");
      return;
    }
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/PhotographyReservation/ChangeStatus`, {
      method: "POST",
      body: JSON.stringify({
        ReservationId: item.id,
        StatusId: Number(statusId),
        Remark: remark,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const sc = data.statusCode ?? data.StatusCode;
        const msg = data.message ?? data.Message ?? "";
        if (sc === 200 || sc === "SUCCESS") {
          toast.success(msg || "Status updated");
          handleClose();
          fetchItems?.();
        } else {
          toast.error(msg || "Failed to change status");
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  return (
    <>
      <Tooltip title="Change Status" placement="top">
        <IconButton
          onClick={handleOpen}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="change status"
          size="small"
        >
          <SyncAltIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Change Status
              </Typography>
              {userAgentType != null && (
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  Showing statuses assigned to your agent type
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
              >
                {options.map((s) => (
                  <MenuItem key={s.id ?? s.Id} value={s.id ?? s.Id}>
                    {s.name ?? s.Name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Remark"
                multiline
                rows={2}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="space-between" mt={1}>
              <Button variant="contained" color="error" size="small" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="contained" size="small" onClick={handleSave}>
                Save
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

import React, { useState } from "react";
import { Grid, IconButton, MenuItem, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import GroupsIcon from "@mui/icons-material/Groups";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import useApi from "@/components/utils/useApi";

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

export default function AssignTeam({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const [teamId, setTeamId] = useState(item.assignedTeamId || "");
  const { data: teams } = useApi("/PhotographyTeam/GetActiveTeams");

  const handleOpen = () => {
    setTeamId(item.assignedTeamId || "");
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleSave = () => {
    if (!teamId) {
      toast.error("Please select a team");
      return;
    }
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/PhotographyReservation/AssignTeam`, {
      method: "POST",
      body: JSON.stringify({ ReservationId: item.id, TeamId: Number(teamId) }),
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
          toast.success(msg || "Team assigned");
          handleClose();
          fetchItems?.();
        } else {
          toast.error(msg || "Failed to assign team");
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  return (
    <>
      <Tooltip title="Assign Team" placement="top">
        <IconButton onClick={handleOpen} aria-label="assign team" size="small">
          <GroupsIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ fontWeight: "500", mb: "12px" }}>
                Assign Team
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                Team for {item.cardNo}
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
              >
                {(teams || []).map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Box display="flex" mt={2} justifyContent="space-between">
            <Button variant="contained" color="error" onClick={handleClose} size="small">
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSave} size="small">
              Assign
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

import React, { useState } from "react";
import { Grid, TextField, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
};

export default function RejectById({ id, fetchItems }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = useState("");
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setReason("");
  };

  const handleSubmit = () => {
    const token = localStorage.getItem("token");
    fetch(
      `${BASE_URL}/ReservationApproval/RejectReservationPayment?id=${id}&rejectRemark=${reason}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.result.message);
          fetchItems();
          setOpen(false);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };
  return (
    <>
      <Tooltip title="Reject" placement="top">
        <Button onClick={handleOpen} color="error" variant="outlined">
          Reject
        </Button>
      </Tooltip>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box mt={2}>
            <Grid container>
              <Grid item xs={12} mt={2}>
                <Typography variant="h5" fontWeight="bold">
                  Are you sure you want to reject this payment?
                </Typography>
                <Typography color="secondary">Please enter reason</Typography>
              </Grid>
              <Grid item xs={12} mt={2}>
                <TextField
                  value={reason}
                  placeholder="Please Enter Reason"
                  fullWidth
                  size="small"
                  onChange={(e) => setReason(e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Button
              variant="contained"
              color="primary"
              onClick={handleClose}
              sx={{
                mt: 2,
                textTransform: "capitalize",
                borderRadius: "8px",
                fontWeight: "500",
                fontSize: "13px",
                padding: "12px 20px",
              }}
            >
              No
            </Button>
            <Button
              type="submit"
              disabled={reason != "" ? false : true}
              variant="contained"
              color="error"
              onClick={handleSubmit}
              sx={{
                mt: 2,
                textTransform: "capitalize",
                borderRadius: "8px",
                fontWeight: "500",
                fontSize: "13px",
                padding: "12px 20px",
                color: "#fff !important",
              }}
            >
              Yes
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

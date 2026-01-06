import React, { useState } from "react";
import { Grid, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import ClearIcon from '@mui/icons-material/Clear';
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

export default function CancelConfirmation({id,fetchItems}) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setReason("");
  };

  const handleSubmit = () => {
    if(reason === ""){
      toast.info("Please Enter Reason");
      return;
    }
    const token = localStorage.getItem("token");
    fetch(
      `${BASE_URL}/Reservation/CancelReservation?reservationId=${id}&reason=${reason}`,
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
          toast.success(data.message);
          fetchItems();
          setOpen(false);
          setReason("");
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
      <Tooltip sx={{width:'30px',height: '30px' }}title="Cancel" placement="top">
        <IconButton onClick={handleOpen} aria-label="Cancel" size="small">
          <ClearIcon color="error" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Grid container>
              <Grid item xs={12}>
                <Typography
                  as="h5"
                  sx={{
                    fontWeight: "500",
                    fontSize: "14px",
                    mb: "12px",
                  }}
                >
                  Are you sure you want to cancel this ?
                </Typography>
                <TextField fullWidth value={reason} placeholder="Please Enter Reason" type="text" onChange={(e)=> setReason(e.target.value)}/>
              </Grid>
            </Grid>
          </Box>
          <Box mt={2} display="flex" justifyContent="space-between">
            <Button
              variant="contained"
              color="primary"
              onClick={handleClose}
              size="small"
            >
              No
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="error"
              onClick={handleSubmit}
              size="small"
            >
              Yes
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

import React, { useState } from "react";
import { Grid, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteIcon from "@mui/icons-material/Delete";

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

export default function DeleteConfirmationWithReasonById({ id, controller, fetchItems, date }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = useState("");
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setReason("");
  };

  const handleSubmit = () => {
    if (reason === "") {
      toast.warning("Please enter reason for delete");
      return;
    }
    const token = localStorage.getItem("token");
    fetch(
      `${BASE_URL}/${controller}?id=${id}&reason=${reason}`,
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
          if (fetchItems && date) {
            fetchItems(date);
          }else{
            fetchItems();
          }
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
      <Tooltip title="Delete" placement="top">
        <IconButton onClick={handleOpen} aria-label="delete" size="small">
          <DeleteIcon color="error" />
        </IconButton>
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
              <Grid item xs={12}>
                <Typography
                  as="h5"
                  sx={{
                    fontWeight: "500",
                    fontSize: "14px",
                    mb: "12px",
                  }}
                >
                  Are you sure you want to delete this ?
                </Typography>
                <TextField size="small" placeholder="Please enter reason" fullWidth value={reason} type="text" onChange={(e) => setReason(e.target.value)} />
              </Grid>
            </Grid>
          </Box>
          <Box display="flex" mt={2} justifyContent="space-between">
            <Button
              variant="contained"
              color="primary"
              onClick={handleClose}
            >
              No
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="error"
              onClick={handleSubmit}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

import React, { useState } from "react";
import { Grid, IconButton, TextField, Tooltip, Typography } from "@mui/material";
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

export default function AddFollowUps({ fetchItems, sentQuotId }) {
  const [open, setOpen] = React.useState(false);
  const [comment, setComment] = useState("");
  const [dateTime, setDateTime] = useState("");
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setComment("");
    setDateTime("");
  }
  const handleSubmit = () => {
    const token = localStorage.getItem("token");
    if (comment === "") {
      toast.info("Please Enter Comment");
      return;
    }

    fetch(`${BASE_URL}/Inquiry/CreateFollowUpComment?sentQuotId=${sentQuotId}&comment=${comment}&dateTime=${dateTime}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          setOpen(false);
          toast.success(data.result.message);
          fetchItems();
          resetForm();
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  const isFormValid = comment && dateTime;

  return (
    <>

      <Button onClick={handleOpen} color="success" variant="contained">
        Add Comment
      </Button>
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
                    mb: "5px",
                  }}
                >
                  Add Comment
                </Typography>
              </Grid>
              <Grid item xs={12} my={2}>
                <TextField size="small" fullWidth value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Please Enter Comment" />
              </Grid>
              <Grid item xs={12}>
                <Typography>Next Followup Date & Time</Typography>
              </Grid>
              <Grid item xs={12} my={2}>
                <TextField size="small" type="datetime-local" fullWidth value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
              </Grid>
            </Grid>
          </Box>
          <Box display="flex" justifyContent="space-between">
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
              color="success"
              onClick={handleSubmit}
              disabled={!isFormValid}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

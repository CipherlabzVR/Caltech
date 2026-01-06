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

export default function UpdateConfirmQuotation({ fetchItems, sentQuotId, type, isConfirm }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = useState("");
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = () => {
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/Inquiry/UpdateProjectStatusType?sentQuotId=${sentQuotId}&type=${type}&reason=${reason ? reason : "-"}`, {
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
          if (isConfirm) {
            toast.success(data.result.message);
          } else {
            toast.success("Quotation Rejected Successfully:!");
          }

          fetchItems();
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

      {isConfirm ?
        <Button onClick={handleOpen} color="success" variant="contained">
          Confirm
        </Button>
        :
        <Button onClick={handleOpen} color="error" variant="outlined">
          Reject
        </Button>
      }
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Grid container>
              <Grid item xs={12} mb={2}>
                <Typography
                  as="h5"
                  sx={{
                    fontWeight: "500",
                    fontSize: "14px",
                    mb: "5px",
                  }}
                >
                  Are you sure you want to {isConfirm ? "confirm" : "reject"} this ?
                </Typography>
              </Grid>
              {!isConfirm ?
                <Grid item xs={12} mb={2}>
                  <TextField size="small" fullWidth value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Please Enter Comment" />
                </Grid>
                : ""}
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
            >
              Yes
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

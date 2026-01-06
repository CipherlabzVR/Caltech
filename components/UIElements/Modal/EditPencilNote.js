import React, { useState } from "react";
import {
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditIcon from "@mui/icons-material/Edit";

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

export default function EditPencilNote({ id, url }) {
  const [open, setOpen] = React.useState(false);
  const [expiryDate, setExpiryDate] = useState(null);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = () => {
    fetch(`${BASE_URL}/${url}?id=${id}&expireDate=${expiryDate}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          setOpen(false);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };
  const handleSetDate = (event) => {
    setExpiryDate(event.target.value);
  };
  return (
    <>
      <Button size="small" onClick={handleOpen}>
        <EditIcon />
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
              <Grid item mb={3} xs={12}>
                <Typography
                  as="h5"
                  sx={{
                    fontWeight: "500",
                    fontSize: "14px",
                    mb: "12px",
                  }}
                >
                  Do you need to extend the Expiry Date?
                </Typography>
                <TextField
                  size="small"
                  type="date"
                  onChange={handleSetDate}
                  fullWidth
                  inputProps={{ min: new Date(Date.now() + 86400000).toISOString().split("T")[0] }} 
                />
              </Grid>
            </Grid>
          </Box>
          <Box display="flex" justifyContent="space-between">
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
              disabled={expiryDate != null ? false : true}
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

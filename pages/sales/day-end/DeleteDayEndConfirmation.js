import React, { useState } from "react";
import { IconButton, Tooltip, Typography } from "@mui/material";
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
  borderRadius: 1,
};

export default function DeleteDayEndConfirmation({ id, fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = () => {
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/DayEnd/DeleteDayEnd?id=${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const text = await response.text();
        let data = null;
        if (text && text.trim()) {
          try {
            data = JSON.parse(text);
          } catch {
            toast.error("Invalid response from server.");
            return;
          }
        }

        if (!response.ok) {
          toast.error(
            data?.message || `Request failed (${response.status})`
          );
          return;
        }

        if (!data) {
          toast.warning(
            "Empty response from server. The list will refresh — verify the day end was removed."
          );
          fetchItems();
          handleClose();
          return;
        }

        if (data.statusCode === 200) {
          toast.success(data.message || "Deleted successfully!");
          fetchItems();
          handleClose();
        } else {
          toast.error(data.message || "Failed to delete day end.");
        }
      })
      .catch((error) => {
        toast.error(error.message || "An error occurred.");
      });
  };

  return (
    <>
      <Tooltip title="Delete" placement="top">
        <IconButton onClick={handleOpen} aria-label="delete" size="small">
          <DeleteIcon color="error" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="delete-day-end-title"
        aria-describedby="delete-day-end-description"
      >
        <Box sx={style}>
          <Typography
            id="delete-day-end-title"
            sx={{ fontWeight: "500", fontSize: "16px", mb: "12px" }}
          >
            Are you sure you want to delete this day end?
          </Typography>
          <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
            <Button variant="outlined" color="primary" onClick={handleClose}>
              No
            </Button>
            <Button variant="contained" color="error" onClick={handleSubmit}>
              Delete
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

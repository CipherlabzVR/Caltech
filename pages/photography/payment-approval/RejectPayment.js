import React, { useState } from "react";
import { Box, Button, Modal, TextField, Typography, IconButton, Tooltip } from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";

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

export default function RejectPayment({ id, fetchItems }) {
  const [open, setOpen] = useState(false);
  const [remark, setRemark] = useState("");
  const handleOpen = () => {
    setRemark("");
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    if (!remark.trim()) {
      toast.error("Please enter a reason for rejection");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${BASE_URL}/PhotographyPayment/RejectPayment?id=${id}&rejectRemark=${encodeURIComponent(remark.trim())}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        toast.success(data.message || "Payment rejected");
        handleClose();
        fetchItems?.();
      } else {
        toast.error(data.message || "Failed to reject payment");
      }
    } catch (e) {
      toast.error(e.message || "Failed to reject payment");
    }
  };

  return (
    <>
      <Tooltip title="Reject" placement="top">
        <IconButton size="small" onClick={handleOpen}>
          <CancelIcon color="error" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Typography sx={{ fontWeight: "500", fontSize: "16px", mb: "12px" }}>
            Reject this payment?
          </Typography>
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={3}
            placeholder="Reason for rejection"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
          <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
            <Button variant="outlined" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="contained" color="error" onClick={handleSubmit}>
              Reject
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

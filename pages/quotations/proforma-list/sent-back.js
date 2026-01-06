import React, { useState } from "react";
import { Grid, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';

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

export default function SentBack({ id, fetchItems }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [remark, setRemark] = useState("");

  const handleSubmit = () => {
    if (remark === "") {
      toast.warning("Please Enter Remark");
      return;
    }
    const token = localStorage.getItem("token");
    fetch(
      `${BASE_URL}/Inquiry/UpdateProformaInvoiceToSentQuotation?inquiryId=${id}&remark=${remark}`,
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
        if (data.result.statusCode == 200) {
          toast.success(data.result.message);
          fetchItems();
          setOpen(false);
        } else {
          toast.error(data.result.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };
  return (
    <>
      <Tooltip title="Sent Back" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <SettingsBackupRestoreIcon color="primary" fontSize="medium" />
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
                  Are you sure you want to sent back this ?
                </Typography>
              </Grid>
              <Grid item xs={12} mb={2}>
                <TextField value={remark} fullWidth onChange={(e) => setRemark(e.target.value)} placeholder="Please enter reason" />
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
            >
              Yes
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

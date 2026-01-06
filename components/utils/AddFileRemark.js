import React, { useState } from "react";
import { Grid, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import BASE_URL from "Base/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddCommentIcon from '@mui/icons-material/AddComment';

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

export default function AddFileRemark({ id, checked }) {
  const [open, setOpen] = React.useState(false);
  const [remark, setRemark] = useState("");
  const handleOpen = () => {
    setOpen(true);
    fetchDocument();
  };
  const handleClose = () => {
    setOpen(false);
    setRemark("");
  };

  const fetchDocument = async () => {
    try {
      const response = await fetch(`${BASE_URL}/AWS/GetDocumentPanelByID?docId=${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Fabric List");
      }

      const data = await response.json();
      const doc = data.result.result[0];
      setRemark(doc.remark);
    } catch (error) {
      console.error("Error fetching Fabric List:", error);
    }
  };

  const handleSubmit = () => {
    if (remark === "") {
      toast.warning("Please enter remark");
      return;
    }
    const token = localStorage.getItem("token");
    fetch(
      `${BASE_URL}/AWS/CreateDocumentRemark?id=${id}&remark=${remark}`,
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
        if (data.statusCode === 200) {
          toast.success(data.message);
          setOpen(false);
          setRemark("");
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
    
      <Tooltip title="Add Remark" placement="top">
        <span>
          <IconButton
            disabled={!checked}
            onClick={handleOpen}
            aria-label="remark"
          >
            <AddCommentIcon color={checked ? "primary" : ""} />
          </IconButton>
        </span>
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
                  Remark
                </Typography>
                <TextField size="small" placeholder="Please enter remark" fullWidth value={remark} type="text" onChange={(e) => setRemark(e.target.value)} />
              </Grid>
            </Grid>
          </Box>
          <Box display="flex" mt={2} justifyContent="space-between">
            <Button
              variant="outlined"
              color="primary"
              onClick={handleClose}
            >
              Close
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              onClick={handleSubmit}
            >
              Update
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

import React, { useState } from "react";
import { Grid, IconButton, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

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

export default function Delete({ id, url ,fetchItems,date}) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = () => {
    fetch(
      `${BASE_URL}/${url}?id=${id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.result.message);
          setOpen(false);
          fetchItems(date);
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
        <IconButton onClick={handleOpen}>
                  <DeleteOutlineIcon color="error"/>
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
              <Grid item mb={3} xs={12}>
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
              onClick={handleSubmit}
              size="small"
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

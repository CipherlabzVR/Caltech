import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import { IconButton } from "@mui/material";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: '50%',
  bgcolor: "background.paper",
  boxShadow: 24,
  height: '600px',
  overflowY: 'scroll',
  p: 4,
};

export default function ViewImage({ imageURL }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  return (
    <>
      <IconButton onClick={handleOpen} disabled={!imageURL} color="dark"><FullscreenIcon /></IconButton>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} display="flex" alignItems="center" className="bg-black">
          <img src={imageURL} />
        </Box>
      </Modal>
    </>
  );
}

import React from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "50%",
  bgcolor: "background.paper",
  boxShadow: 24,
  height: "600px",
  overflowY: "scroll",
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
        <Box sx={style} className="bg-black">
          <IconButton
            aria-label="Close preview"
            color="error"
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 1,
              width: 40,
              height: 40,
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100%"
          >
            <img src={imageURL} alt="Preview" style={{ maxWidth: "100%", maxHeight: "100%" }} />
          </Box>
        </Box>
      </Modal>
    </>
  );
}

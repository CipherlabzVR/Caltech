import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import DocImageList from "../SwiperSlider/DocImageList";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

export default function ViewImages() {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Button fullWidth onClick={handleOpen}>View Images</Button>
      <Modal
        open={open}s
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
            <DocImageList/>
            <Box display="flex" justifyContent="space-between">
              <Button
                variant="contained"
                color="error"
                onClick={handleClose}
                sx={{
                  mt: 2,
                  textTransform: "capitalize",
                  borderRadius: "8px",
                  fontWeight: "500",
                  fontSize: "13px",
                  padding: "12px 20px",
                }}
              >
                Close
              </Button>
            </Box>
        </Box>
      </Modal>
    </>
  );
}

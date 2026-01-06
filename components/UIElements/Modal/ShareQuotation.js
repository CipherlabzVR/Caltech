import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import {
  Card,
  Grid,
  Typography,
} from "@mui/material";
import ShareIcon from '@mui/icons-material/Share';
//import { PDFViewer } from "@react-pdf/renderer";

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

export default function ShareQuotation() {
  const [openShare, setOpenShare] = useState(false);
  const [selectedCard, setSelectedCard] = useState(0); 

  const handleShareOpen = () => setOpenShare(true);
  const handleShareClose = () => setOpenShare(false);

  const handleCardClick = (id) => {
    setSelectedCard(id);
  };

  const handleShareNow = () => {
    console.log("Selected Card ID:", selectedCard);
  };

  return (
    <>
      <Button variant="outlined" sx={{ ml: 1 }} onClick={handleShareOpen}>
       <ShareIcon sx={{mr:3}}/> Share Quotation
      </Button>
      <Modal
        open={openShare}
        onClose={handleShareClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Grid container>
            <Grid item xs={12} mt={2}>
              <Typography
                as="h4"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  mb: "12px",
                }}
              >
                Share On
              </Typography>
            </Grid>
            <Grid item xs={4} mt={2}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  width: "100px",
                  height: "100px",
                  backgroundImage: `url('/images/quotation/w.png')`,
                  position: "relative",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: selectedCard === 0 ? "3px solid #757fef" : "1px solid #e5e5e5",
                  cursor: "pointer",
                }}
                onClick={() => handleCardClick(0)}
              ></Card>
            </Grid>
            <Grid item xs={4} mt={2}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  width: "100px",
                  height: "100px",
                  backgroundImage: `url('/images/quotation/e.jpg')`,
                  position: "relative",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: selectedCard === 1 ? "3px solid #757fef" : "1px solid #e5e5e5",
                  cursor: "pointer",
                }}
                onClick={() => handleCardClick(1)}
              ></Card>
            </Grid>
            <Grid item xs={4} mt={2}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  width: "100px",
                  height: "100px",
                  backgroundImage: `url('/images/quotation/m.jpg')`,
                  position: "relative",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: selectedCard === 2 ? "3px solid #757fef" : "1px solid #e5e5e5",
                  cursor: "pointer",
                }}
                onClick={() => handleCardClick(2)}
              ></Card>
            </Grid>
            <Grid item xs={12} mt={2}>
              <Button variant="outlined" onClick={handleShareNow}>Share Now</Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

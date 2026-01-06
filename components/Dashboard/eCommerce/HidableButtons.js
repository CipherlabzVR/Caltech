import React, { useState } from "react";
import { Button, Box, IconButton, Typography } from "@mui/material";
import Link from "next/link";
import AddInquiry from "@/components/UIElements/Modal/AddInquiry";
import SummarizeIcon from "@mui/icons-material/Summarize";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

const HidableButtons = () => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: "fixed",
        display: "block",
        bottom: "20%",
        right: "5px",
        zIndex: "100",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          borderRadius: "10px",
          padding: "5px",
          zIndex: "100",
          opacity: isHovered ? "100%" : "0%",
          transition: "opacity 0.3s",
        }}
      >
        <AddInquiry type={2}/>
       

        {/* <Box sx={{ textAlign: "center", mt: 3 }}>
          <Link href="/quotations/pending-quotation">
            <IconButton
              sx={{
                background: "#b3bae2",
                width: "50px",
                height: "50px",
                "&:hover": {
                  backgroundColor: "#b3bae2",
                },
              }}
            >
              <SummarizeIcon />
            </IconButton>
          </Link>
          <Typography sx={{ fontWeight: "500" }}>Quotations</Typography>
        </Box>

        <Box sx={{ textAlign: "center", mt: 3 }}>
          <IconButton
            sx={{
              background: "#c5d2e2",
              width: "50px",
              height: "50px",
              "&:hover": {
                backgroundColor: "#c5d2e2",
              },
            }}
          >
            <LocalShippingIcon />
          </IconButton>
          <Typography sx={{ fontWeight: "500" }}>Place Order</Typography>
        </Box> */}
      </Box>
    </Box>
  );
};

export default HidableButtons;

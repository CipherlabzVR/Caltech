import React, { useState } from "react";
import { Avatar, Box, Button, Grid, Modal, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import BASE_URL from "Base/api";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 600, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
};

export default function Steward({onSelectSteward}) {
  const [open, setOpen] = useState(false);
  const [stewards, setStewards] = useState([]);
  const [selectedSteward, setSelectedSteward] = useState(null);
  const [selectedStewardId, setSelectedStewardId] = useState(null);

  const handleOpen = () => {
    setOpen(true);
    fetchStewards();
  };
  const handleClose = () => {
    setOpen(false);
    setSelectedStewardId(null);
  };

  const fetchStewards = async () => {
    try {
      const response = await fetch(`${BASE_URL}/RestaurantPOS/GetAllStewards`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setStewards(data.result);
    } catch (error) {
      console.error("Error fetching :", error);
    }
  };

  const handleSelectSteward = (item) => {
    setSelectedStewardId(item.id);
    setSelectedSteward(item);
  };

  const handleConfirm = () => {
    if (selectedSteward) {
      onSelectSteward(selectedSteward);
    }
    handleClose();
  };

  return (
    <>
      <Button
        variant="outlined"
        sx={{
          borderColor: "#fe6564",
          color: "#fe6564",
          "&:hover": {
            borderColor: "#fe6564",
            backgroundColor: "rgba(254, 101, 100, 0.1)",
          },
          textTransform: "none",
          fontSize: "0.75rem",
          minWidth: 64,
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          py: 1,
        }}
        onClick={handleOpen}
      >
        <PersonIcon sx={{ fontSize: 20 }} />
        Steward
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Grid container>
            <Grid item xs={12}>
              <Box sx={{ background: "#fe6564", p: 2 }}>
                <Typography variant="h6" sx={{ color: "#fff" }}>
                  Select Steward
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box p={2}>
                <Grid container spacing={1}>
                  {stewards.length === 0 ? (
                    <Typography>No Data Available</Typography>
                  ) : (
                    stewards.map((item, i) => (
                      <Grid
                        key={i}
                        item
                        xs={6}
                        lg={2}
                        display="flex"
                        justifyContent="center"
                      >
                        <Box
                          onClick={() =>
                            item.isAvailable && handleSelectSteward(item)
                          }
                          sx={{
                            border:
                              selectedStewardId === item.id
                                ? "3px solid #fe6564"
                                : item.isAvailable
                                ? "2px solid #fe6564"
                                : "2px solid #e5e5e5",
                            borderRadius: "5px",
                            p: 2,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            cursor: item.isAvailable ? "pointer" : "not-allowed",
                            backgroundColor:
                              selectedStewardId === item.id
                                ? "rgba(254,101,100,0.1)"
                                : "transparent",
                          }}
                        >
                          <Avatar
                            alt={item.firstName}
                            src={
                              item.isAvailable
                                ? "/images/restaurant/waiter.png"
                                : "/images/restaurant/waiter2.png"
                            }
                            sx={{
                              width: 50,
                              height: 50,
                              border: "3px solid #e5e5e5",
                              background: "#f2e7eb",
                            }}
                          />
                          <Typography mt={1}>{item.firstName}</Typography>
                        </Box>
                      </Grid>
                    ))
                  )}
                </Grid>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box
                px={2}
                mt={1}
                pb={1}
                display="flex"
                sx={{ width: "100%" }}
                justifyContent="space-between"
              >
                <Button onClick={handleClose} variant="outlined" color="error">
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#fe6564",
                    "&:hover": { backgroundColor: "#fe6564" },
                  }}
                  disabled={!selectedStewardId}
                  onClick={handleConfirm}
                >
                  Select
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

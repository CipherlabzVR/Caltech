import React, { useState } from "react";
import {
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import "react-toastify/dist/ReactToastify.css";
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import style from "@/styles/reservation/modal";
import BASE_URL from "Base/api";

export default function ViewDetails({ id }) {
  const [open, setOpen] = React.useState(false);
  const [packages, setPackages] = useState([]);
  const handleOpen = () => {
    setOpen(true);
    fetchPackages();
  };
  const fetchPackages = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Booking/GetBookingDetails?id=${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setPackages(data);
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };


  return (
    <>
      <IconButton onClick={handleOpen}>
        <RemoveRedEyeIcon />
      </IconButton>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Grid container>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                  <Typography variant="h5" fontWeight="bold">
                    Selected Packages
                  </Typography>
                  <Box>
                    {packages[0] ? <>
                      <Typography variant="h6" fontWeight="bold">{packages[0].slotStartTime} - {packages[0].slotEndTime}</Typography>
                    </> : ""}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} mt={2}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Package Name</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {packages.length === 0 ?
                        <TableRow>
                          <TableCell colSpan={1}>No Packages Selected</TableCell>
                        </TableRow>
                        : (packages.map((payment, index) => (
                          <TableRow key={index}>
                            <TableCell>{payment.packageName}</TableCell>
                          </TableRow>
                        )))}

                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

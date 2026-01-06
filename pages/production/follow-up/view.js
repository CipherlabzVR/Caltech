import React, { useState } from "react";
import { Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import BASE_URL from "Base/api";
import "react-toastify/dist/ReactToastify.css";
import { formatDate } from "@/components/utils/formatHelper";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 650, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

export default function ViewComments({ item }) {
  const [open, setOpen] = React.useState(false);
  const [comments, setComments] = useState([]);
  const handleClose = () => setOpen(false);
  const handleOpen = async () => {
    fetchComments();
    setOpen(true);
  };


  const fetchComments = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Inquiry/GetAllFollowUpComments?inquiryId=${item.inquiryId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ");
      }

      const data = await response.json();
      setComments(data.result);
    } catch (error) {
      console.error("Error fetching Supplier List:", error);
    }
  };
  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        view
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
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "500",
                  mb: "5px",
                }}
              >
                Follow Up Comments
              </Typography>
              <Typography>
                {item.customerName}/Inquiry Code : {item.inquiryCode}
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ height: "50vh", overflowY: "scroll" }}>
            <Grid container spacing={1}>
              <Grid item xs={12} my={2}>
                <TableContainer component={Paper}>
                  <Table aria-label="simple table" className="dark-table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Option</TableCell>
                        <TableCell>Done By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {comments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2}>
                            <Typography color="error">No Comments Available</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        comments.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{formatDate(item.createdOn)}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.optionName}</TableCell>
                            <TableCell>{item.doneBy}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
          <Grid container>
            <Grid
              display="flex"
              justifyContent="space-between"
              item
              xs={12}
              p={1}
            >
              <Button
                variant="contained"
                size="small"
                color="error"
                onClick={handleClose}
              >
                Close
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

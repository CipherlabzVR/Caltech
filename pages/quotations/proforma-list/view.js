import React, { useState } from "react";
import { Chip, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import BASE_URL from "Base/api";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import UpdateConfirmQuotation from "@/components/UIElements/Modal/UpdateConfirmQuotation";
import ViewComments from "../comments";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 1200, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

export default function ViewSentQuotations({ item }) {
  const [open, setOpen] = React.useState(false);
  const [quots, setQuots] = useState([]);
  const handleClose = () => setOpen(false);
  const handleOpen = async () => {
    fetchSentQuotList();
    setOpen(true);
  };


  const fetchSentQuotList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Inquiry/GetAllSentQuotationsByCustomerId?id=${item.customerId}&inquiryId=${item.inquiryId}`, {
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
      const result = data.result.filter(item => item.projectStatusType === 10);
      setQuots(result);

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
                Invoice Quotations
              </Typography>
              <Typography>
                {item.customerName}/Inquiry Code : {item.inquiryCode}
              </Typography>
            </Grid>
            <Box sx={{ height: "50vh", overflowY: "scroll" }}>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <TableContainer component={Paper}>
                    <Table aria-label="simple table" className="dark-table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Doc.&nbsp;No</TableCell>
                          <TableCell>Sent&nbsp;Date</TableCell>
                          <TableCell>Start&nbsp;Date</TableCell>
                          <TableCell>Adv.&nbsp;Payment (%)</TableCell>
                          <TableCell>Valid&nbsp;Days</TableCell>
                          <TableCell>Working&nbsp;Days</TableCell>
                          <TableCell>Credit Term&nbsp;Days</TableCell>
                          <TableCell>Selected&nbsp;Option</TableCell>
                          <TableCell>Total&nbsp;Amount</TableCell>
                          <TableCell>Advance&nbsp;Amount</TableCell>
                          <TableCell>Comments</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {quots.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10}>
                              <Typography color="error">No Quotations Available</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          quots.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.documentNo}</TableCell>
                              <TableCell>{formatDate(item.sentDate)}</TableCell>
                              <TableCell>{formatDate(item.startDate)}</TableCell>
                              <TableCell>{item.advancePaymentPercentage}</TableCell>
                              <TableCell>{item.validDays}</TableCell>
                              <TableCell>{item.workingDays}</TableCell>
                              <TableCell>{item.creditTermDays}</TableCell>
                              <TableCell>{item.selectedOption}</TableCell>
                              <TableCell>{formatCurrency(item.totalAmount)}</TableCell>
                              <TableCell>{formatCurrency(item.advanceAmount)}</TableCell>
                              <TableCell>
                                <ViewComments item={item} />
                              </TableCell>

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
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

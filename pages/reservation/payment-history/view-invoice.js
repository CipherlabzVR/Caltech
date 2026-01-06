import React, { useEffect, useState } from "react";
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
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { getPaymentMethods } from "@/components/types/types";

export default function ViewInvoices({ reservation }) {
  const [open, setOpen] = React.useState(false);
  const [grossTotal, setGrossTotal] = useState(0);
  const [payments, setPayments] = useState([]);
  const handleOpen = () => {
    setOpen(true);
    fetchPayments();
  };

  useEffect(() => {
    const gross = payments.reduce(
      (gross, row) => gross + (Number(row.paidAmount) || 0),
      0
    );
    setGrossTotal(gross);
  }, [payments]);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${BASE_URL}/ReservationPaymentHistory/GetAllPaymentsById?reservationId=${reservation.reservationId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setPayments(data.result);
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
                    Payment History                     
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ textAlign: 'right' }}>
                    {reservation.documentNo}<br />
                    {reservation.customerName} - {reservation.nic}
                  </Typography>
                  
                </Box>
                <Typography color="primary">Payment Code : {reservation.paymentCode}</Typography>
              </Grid>
              <Grid item xs={12} mt={2}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Payment Type</TableCell>
                        <TableCell>Paid Amount</TableCell>
                        <TableCell>Pay Slip</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.length === 0 ?
                        <TableRow>
                          <TableCell colSpan={5}>No Payments Available</TableCell>
                        </TableRow>
                        : (payments.map((payment, index) => (
                          <TableRow key={index}>
                            <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                            <TableCell>{getPaymentMethods(payment.paymentType)}</TableCell>
                            <TableCell>{formatCurrency(payment.paidAmount)}</TableCell>
                            <TableCell>
                              {payment.paySlip ?
                                <a href={payment.paySlip} target="_blank">
                                  View
                                </a> : "-"}
                            </TableCell>
                            <TableCell>{payment.description}</TableCell>
                          </TableRow>
                        )))}

                    </TableBody>
                    <TableHead>
                      <TableRow>
                        <TableCell colSpan={4}>Total</TableCell>
                        <TableCell>{formatCurrency(grossTotal)}</TableCell>
                      </TableRow>
                    </TableHead>
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

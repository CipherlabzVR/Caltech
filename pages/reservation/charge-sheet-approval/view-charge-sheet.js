import React, { useEffect, useState } from "react";
import {
  Button,
  Grid,
  IconButton,
  Paper,
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
import { formatCurrency } from "@/components/utils/formatHelper";
import RejectById from "./RejectById";
import ChargeSheetApproval from "./ApproveById";

export default function ViewChargeSheet({ reservation,fetchItems, approve , remove }) {
  const [open, setOpen] = React.useState(false);
  const [grossTotal, setGrossTotal] = useState(0);
  const [refundTotal, setRefundTotal] = useState(0);
  const [charges, setCharges] = useState([
    { label: "Hair,Make-up & Dressing Charges", cost: null, qty: null, total: null },
    { label: "Wedding Bride", cost: "", qty: 1, total: 0 },
    { label: "Home Coming Bride", cost: "", qty: 1, total: 0 },
    { label: "Engagement Bride", cost: "", qty: 1, total: 0 },
    { label: "Photoshoot or Event Bride", cost: "", qty: 1, total: 0 },
    { label: "Wedding Bridesmaids", cost: "", qty: "", total: 0 },
    { label: "Going away Bridesmaids", cost: "", qty: "", total: 0 },
    { label: "Pupil Maids", cost: "", qty: "", total: 0 },
    { label: "Little Maids", cost: "", qty: "", total: 0 },
    { label: "Flower Girls", cost: "", qty: "", total: 0 },
    { label: "jewellery rental Charges", cost: null, qty: null, total: null },
    { label: "Jewelley Set for Bride", cost: "", qty: 1, total: 0 },
    { label: "Jewelley Set for Bridesmaids", cost: "", qty: "", total: 0 },
    { label: "Jewelley Set for Bride & Bridesmaids", cost: "", qty: "", total: 0 },
    { label: "Kandyan Gold Set", cost: "", qty: 1, total: 0 },
    { label: "Jeweller Changing Fee", cost: "", qty: 1, total: 0 },
    { label: "outfit Charges", cost: null, qty: null, total: null },
    { label: "Designing Charges", cost: "", qty: 1, total: 0 },
    { label: "Wedding Bridal Outfit", cost: "", qty: 1, total: 0 },
    { label: "Veil", cost: "", qty: 1, total: 0 },
    { label: "Home Coming Bridal Outfit", cost: "", qty: 1, total: 0 },
    { label: "Going away Bridal Outfit", cost: "", qty: 1, total: 0 },
    { label: "Photoshoot or Event Bridal Outfit", cost: "", qty: 1, total: 0 },
    { label: "Bridesmaids Outfit", cost: "", qty: "", total: 0 },
    { label: "Pupil Maids Outfit", cost: "", qty: "", total: 0 },
    { label: "Little Maids Outfit", cost: "", qty: "", total: 0 },
    { label: "Flower Girls' Outfit", cost: "", qty: "", total: 0 },
    { label: "other Charges", cost: null, qty: null, total: null },
    { label: "Bridal Trial", cost: "", qty: 1, total: 0 },
    { label: "Bride Touchups", cost: "", qty: 1, total: 0 },
    { label: "Bride & Bridemaids Touchups", cost: "", qty: 1, total: 0 },
    { label: "Mother's Outfit", cost: "", qty: 1, total: 0 },
    { label: "Sister's Outfit", cost: "", qty: 1, total: 0 },
    { label: "Mother's Dressing", cost: "", qty: 1, total: 0 },
    { label: "Sister's Dressing", cost: "", qty: 1, total: 0 },
    { label: "Others Dressing", cost: "", qty: 1, total: 0 },
    { label: "Transport", cost: "", qty: 1, total: 0 },
  ]);
  const [refunds, setRefunds] = useState([
    { label: "Hair Extention Deposit", value: "" },
    { label: "Jewelry Deposit", value: "" },
  ]);
  const handleOpen = () => {
    setOpen(true);
    fetchReservation();
  };
  const handleClose = () => {
    setOpen(false);
  };

  const fetchReservation = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Reservation/GetReservationById?id=${reservation.reservationId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();

      const fetchedCharges = data.result.result.chargeSheetChargeSheetLineDetails;
      if (fetchedCharges) {
        setCharges(prevCharges =>
          prevCharges.map(charge => {
            const matched = fetchedCharges.find(
              fc => fc.description === charge.label
            );
            return matched
              ? {
                ...charge,
                cost: matched.cost ?? charge.cost,
                qty: matched.count ?? charge.qty,
                total: matched.lineTotal ?? charge.total,
              }
              : charge;
          })
        );
        setRefunds(prevRefunds =>
          prevRefunds.map(refund => {
            const matched = fetchedCharges.find(
              fc => fc.description === refund.label
            );
            return matched
              ? {
                ...refund,
                value: matched.cost ?? refund.value,
              }
              : refund;
          })
        );

      }

    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  useEffect(() => {
    const gross = charges.reduce(
      (gross, row) => gross + (Number(row.total) || 0),
      0
    );
    const refund = refunds.reduce(
      (refund, row) => refund + (Number(row.value) || 0),
      0
    );
    setGrossTotal(gross);
    setRefundTotal(refund);
  }, [charges, refunds]);

  const handleSubmit = () => {
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
                    Review Charge Sheet
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ textAlign: 'right' }}>
                    {reservation.documentNo}- {reservation.customerName}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ height: '60vh', overflowY: 'scroll' }}>
              <Grid container>
                <Grid item xs={12} mt={2}>
                  <TableContainer component={Paper}>
                    <Table size="small" className="dark-table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Outfit Charges</TableCell>
                          <TableCell>Cost</TableCell>
                          <TableCell>Qty</TableCell>
                          <TableCell align="right">Total&nbsp;Cost</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {charges.map((row, index) => {
                          const isAllNull = row.cost == null && row.qty == null && row.total == null;
                          return (
                            <TableRow key={index}>
                              {isAllNull ? (
                                <TableCell colSpan={4}>
                                  <Typography sx={{ fontWeight: '600', textTransform: 'uppercase' }} color="primary">{row.label}</Typography>
                                </TableCell>
                              ) : (
                                <>
                                  <TableCell>{row.label}</TableCell>
                                  <TableCell>
                                    {row.cost}
                                  </TableCell>
                                  <TableCell>
                                    {row.qty !== 1 ? (
                                      row.qty
                                    ) : (
                                      ""
                                    )}
                                  </TableCell>
                                  <TableCell align="right">{formatCurrency(row.total)}</TableCell>
                                </>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                      <TableHead>
                        <TableRow>
                          <TableCell>Total</TableCell>
                          <TableCell align="right" colSpan={3}>{formatCurrency(grossTotal)}</TableCell>
                        </TableRow>
                      </TableHead>
                    </Table>
                  </TableContainer>
                </Grid>
                <Grid item xs={12} mt={2}>
                  <TableContainer component={Paper}>
                    <Table className="dark-table">
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <Typography variant="h6">Total Cost</Typography>
                          </TableCell>
                          <TableCell align="right" colSpan={3}>
                            <Typography variant="h6">{formatCurrency(grossTotal)}</Typography></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <Typography variant="h6">Discount</Typography>
                          </TableCell>
                          <TableCell>
                            {reservation.discountRate}
                          </TableCell>
                          <TableCell>
                            {reservation.discountValue}
                          </TableCell>
                          <TableCell>
                            <Typography variant="h6">
                              {formatCurrency(reservation.discountAmount)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Typography variant="h6">Advance Payment</Typography>
                          </TableCell>
                          <TableCell align="right" colSpan={3}>
                            <Typography variant="h6">({formatCurrency(reservation?.ReservationAdvance || 0)})</Typography></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Typography variant="h6">Net Total</Typography>
                          </TableCell>
                          <TableCell align="right" colSpan={3}>
                            <Typography variant="h6">
                              {formatCurrency(reservation.netAmount)}
                            </Typography>

                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                <Grid item xs={12} my={3}>
                  <Typography variant="h6">Refund Details</Typography>
                  <TableContainer component={Paper}>
                    <Table size="small" className="dark-table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {refunds.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.label}</TableCell>
                            <TableCell>
                              {row.value}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableHead>
                        <TableRow>
                          <TableCell>Refund Total</TableCell>
                          <TableCell align="right" colSpan={3}>{formatCurrency(refundTotal)}</TableCell>
                        </TableRow>
                      </TableHead>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
            <Grid container>
              <Grid item xs={6} mt={2}>
                <Button onClick={handleClose} variant="outlined" color="error">Cancel</Button>
              </Grid>
              <Grid item xs={6} gap={1} display="flex" justifyContent="end" mt={2}>
                {remove ? <RejectById id={reservation.id} fetchItems={fetchItems} onClose={handleClose}/> : ""}                
                {approve ? <ChargeSheetApproval id={reservation.id} fetchItems={fetchItems} onClose={handleClose}/> : ""}
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

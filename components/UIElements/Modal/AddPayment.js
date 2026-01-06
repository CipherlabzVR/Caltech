import React, { useState } from "react";
import {
  FormControlLabel,
  FormLabel,
  Grid,
  InputAdornment,
  OutlinedInput,
  Paper,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import FormControl from "@mui/material/FormControl";
import ViewInvoice from "./ViewInvoice";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

export default function AddPayment() {
  const [open, setOpen] = React.useState(false);
  const [viewAdvance, setViewAdvance] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [fullPayment, setFullPayment] = useState(50000);
  const [advance, setAdvance] = useState("");
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handlePaymentChange = (event) => {
    const value = event.target.value;
    setPaymentMethod(value);
    if (value == 1) {
      setViewAdvance(true);
    } else {
      setViewAdvance(false);
      setAdvance();
    }
  };

  const handleAdvance = (value) => {
    setAdvance(value);
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        fullWidth
        variant="contained"
        color="success"
      >
        Payment
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Grid container>
              <Grid item xs={6}>
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      as="h5"
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Amount
                    </Typography>
                    <FormControl fullWidth>
                      <OutlinedInput
                        value={fullPayment}
                        disabled
                        id="outlined-adornment-amount"
                        endAdornment={
                          <InputAdornment position="start">LKR</InputAdornment>
                        }
                      />
                    </FormControl>
                  </Grid>
                
                <Grid item xs={12} mt={2}>
                  <FormControl>
                    <FormLabel id="demo-row-radio-buttons-group-label">
                      Payments
                    </FormLabel>
                    <RadioGroup
                      row
                      aria-labelledby="demo-row-radio-buttons-group-label"
                      name="row-radio-buttons-group"
                      value={paymentMethod}
                      onChange={handlePaymentChange}
                    >
                      <FormControlLabel
                        value="1"
                        control={<Radio />}
                        label="Advance Payment"
                      />
                      <FormControlLabel
                        value="2"
                        control={<Radio />}
                        label="Full Payment"
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                {viewAdvance ? (
                  <Grid item xs={12} mt={2}>
                    <Typography
                      as="h5"
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Advance Payment Amount
                    </Typography>
                    <FormControl
                      value={advance}
                      onChange={(e) => handleAdvance(e.target.value)}
                      fullWidth
                    >
                      <OutlinedInput
                        id="outlined-adornment-amount"
                        endAdornment={
                          <InputAdornment position="start">LKR</InputAdornment>
                        }
                      />
                    </FormControl>
                  </Grid>
                ) : (
                  ""
                )}
                <Grid item xs={12} mt={2}>
                <ViewInvoice advance={advance}
                full={fullPayment} />
                </Grid>
                </Grid>
              </Grid>
              <Grid item xs={6}>
                <Grid container>
                  <Grid item xs={12} p={2}>
                    <TableContainer component={Paper}>
                      <Table
                        size="small"
                        aria-label="simple table"
                        className="dark-table"
                      >
                        <TableHead>
                          <TableRow>
                            <TableCell>Amount(LKR)</TableCell>
                            <TableCell>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>30,000</TableCell>
                            <TableCell>12-04-2024</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
          <Box mt={2}>
            
          </Box>
        </Box>
      </Modal>
    </>
  );
}

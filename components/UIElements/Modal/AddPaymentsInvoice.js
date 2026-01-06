import React, { useState } from "react";
import Box from "@mui/material/Box";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import {
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import InvoiceView from "./InvoiceView";
import { formatCurrency } from "@/components/utils/formatHelper";

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

export default function AddPaymentsInvoice({ invoice,fetchItems }) {
  const [open, setOpen] = useState(false);
  const [cash, setCash] = useState();
  const [balance, setBalance] = useState();
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setCash(undefined);
    setBalance(undefined);
    setOpen(false);
  };
  

  const isButtonDisabled = !cash;

  const handleSetCash = (value) => {
    setCash(value);
    const getBalance = invoice.netTotal - value;
    setBalance(getBalance);
  };
  return (
    <>
      <Tooltip title="Print" placement="top">
        <IconButton onClick={handleOpen} aria-label="print" size="small">
          <LocalPrintshopIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Grid container>
            <Grid
              item
              xs={12}
              mb={3}
              display="flex"
              justifyContent="space-between"
            >
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                Net Total
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                {formatCurrency(invoice.netTotal)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontWeight: "bold" }}>Payment</Typography>
              <TextField
                type="number"
                value={cash}
                onChange={(e) => handleSetCash(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} mt={3}>
              <Typography sx={{ fontWeight: "bold" }}>
                Balance Payment
              </Typography>
              <TextField
                type="number"
                disabled
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} mt={3}>
              <InvoiceView
                from={2}
                isDisabled={isButtonDisabled}
                invoice={invoice}
                CashPay={cash}
                BalancePay={balance}
                fetchItems={fetchItems}
                onCloseModal={handleClose}
              />
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

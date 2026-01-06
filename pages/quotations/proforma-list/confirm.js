import React, { useEffect, useState } from "react";
import { Grid, MenuItem, Select, Typography, TextField } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency } from "@/components/utils/formatHelper";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
};

export default function ConfirmInovoiceById({ id, fetchItems, paidAmount = 0 }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [paymentType, setPaymentType] = useState(null);
  const [paidAmountInput, setPaidAmountInput] = useState(paidAmount || 0);

  useEffect(() => {
    setPaidAmountInput(paidAmount || 0);
  }, [paidAmount]);

  const handleSubmit = () => {
    if(paymentType == null){
      toast.warning("Please Select Payment Method");
      return;
    }
    const token = localStorage.getItem("token");
    fetch(
      `${BASE_URL}/Inquiry/ConfirmProformaInvoice?invoiceId=${id}&paymentType=${paymentType}&advancePayment=${paidAmountInput || 0}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.result.statusCode == 200) {
          toast.success(data.result.message);
          fetchItems();
          setOpen(false);
        } else {
          toast.error(data.result.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };
  return (
    <>
      <Button onClick={handleOpen} color="success" variant="outlined">
        Confirm
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box mt={2}>
            <Grid container>
              <Grid item xs={12}>
                <Typography
                  as="h5"
                  sx={{
                    fontWeight: "500",
                    fontSize: "14px",
                    mb: "12px",
                  }}
                >
                  Are you sure you want to confirm this ?
                </Typography>
              </Grid>
              <Grid item xs={12} mb={3}>
                <Typography component="label" sx={{ display: "block", mb: 1 }}>
                  Paid Amount (Advance)
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  type="number"
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(Number(e.target.value) || 0)}
                  InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                />
              </Grid>
              <Grid item xs={12} mb={3}>
                <Box mt={1}>
                  <Typography component="label">Payment Method</Typography>
                  <Select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} fullWidth size="small">
                    <MenuItem value={1}>Cash</MenuItem>
                    <MenuItem value={2}>Card</MenuItem>
                    <MenuItem value={3}>Cash & Card</MenuItem>
                    <MenuItem value={4}>Bank Transfer</MenuItem>
                    <MenuItem value={5}>Cheque</MenuItem>
                  </Select>
                </Box>
              </Grid>
            </Grid>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Button
              variant="contained"
              color="primary"
              onClick={handleClose}
            >
              No
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="success"
              onClick={handleSubmit}
            >
              Yes
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

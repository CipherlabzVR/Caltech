import React, { useEffect, useState } from "react";
import { Grid, MenuItem, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useApi from "@/components/utils/useApi";
import { formatDate } from "@/components/utils/formatHelper";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 400, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const BANK_ACCOUNT_TYPE = 4;

export default function ReplenishFund({ fundId, fetchItems }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [replenishmentDate, setReplenishmentDate] = useState(formatDate(new Date()));
  const [bankAccounts, setBankAccounts] = useState([]);
  const { data: accountList } = useApi("/ChartOfAccount/GetAll");

  const handleClose = () => setOpen(false);
  const handleOpen = () => setOpen(true);

  useEffect(() => {
    if (accountList) {
      setBankAccounts(accountList.filter((acc) => acc.accountType === BANK_ACCOUNT_TYPE));
    }
  }, [accountList]);

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.warning("Please enter a valid amount");
      return;
    }
    if (!bankAccountId) {
      toast.warning("Please select a bank account");
      return;
    }

    fetch(`${BASE_URL}/PettyCash/Replenish/${fundId}`, {
      method: "POST",
      body: JSON.stringify({
        Amount: parseFloat(amount),
        BankAccountId: Number(bankAccountId),
        ReplenishmentDate: replenishmentDate,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode === 200 || data.statusCode === 1) {
          toast.success(data.message);
          setOpen(false);
          setAmount("");
          setBankAccountId("");
          fetchItems();
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  return (
    <>
      <Button variant="outlined" color="secondary" onClick={handleOpen}>
        Replenish Fund
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ fontWeight: "500", mb: "5px" }}>
                Replenish Petty Cash Fund
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontWeight: "500", mb: "5px" }}>Date</Typography>
              <TextField
                fullWidth
                type="date"
                size="small"
                value={replenishmentDate}
                onChange={(e) => setReplenishmentDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontWeight: "500", mb: "5px" }}>Amount</Typography>
              <TextField
                fullWidth
                type="number"
                size="small"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputProps={{ min: 0, step: "0.01" }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontWeight: "500", mb: "5px" }}>Bank Account</Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
              >
                <MenuItem value="" disabled>
                  Select bank account
                </MenuItem>
                {bankAccounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>
                    {acc.code} - {acc.description}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="space-between" mt={1}>
              <Button variant="contained" size="small" color="error" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="contained" size="small" onClick={handleSubmit}>
                Replenish
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

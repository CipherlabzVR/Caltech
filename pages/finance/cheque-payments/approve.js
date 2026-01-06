import React, { useEffect, useState } from "react";
import { Grid, MenuItem, Select, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useApi from "@/components/utils/useApi";

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

export default function ApproveCheque({ id, fetchItems }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [bankId, setBankId] = useState(null);
  const [cashFlowTypeId, setCashFlowTypeId] = useState(null);
  const { data: bankList } = useApi("/Bank/GetAllBanks");
  const { data: cashFlowTypeList } = useApi("/CashFlowType/GetCashFlowTypesByType?cashType=3");
  const [banks, setBanks] = useState([]);
  const [cashFlowTypes, setCashFlowTypes] = useState([]);

  const handleSubmit = () => {
    if (bankId == null) {
      toast.warning("Please Select Bank");
      return;
    }
    if (cashFlowTypeId == null) {
      toast.warning("Please Select Cash Flow Type");
      return;
    }
    const token = localStorage.getItem("token");
    fetch(
      `${BASE_URL}/BankHistory/ApproveChequePaymentAsync?chequeId=${id}&bankId=${bankId}&cashFlowTypeId=${cashFlowTypeId}`,
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
        if (data.statusCode == 200) {
          toast.success(data.message);
          fetchItems();
          setOpen(false);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  useEffect(() => {
    if (bankList) {
      setBanks(bankList);
    }
  }, [bankList]);

  useEffect(() => {
    if (cashFlowTypeList) {
      setCashFlowTypes(cashFlowTypeList.filter(x => x.isActive));
    }
  }, [cashFlowTypeList]);
  return (
    <>
      <Button onClick={handleOpen} color="success" variant="outlined">
        Approve
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
                  Are you sure you want to approve this ?
                </Typography>
              </Grid>
              <Grid item xs={12} mb={2}>
                <Box mt={1}>
                  <Typography component="label">Select Bank</Typography>
                  <Select value={bankId} onChange={(e) => setBankId(e.target.value)} fullWidth size="small">
                    {banks.length === 0 ? <MenuItem value="">No Data Available</MenuItem> :
                      (banks.map((bank, i) => (
                        <MenuItem key={i} value={bank.id}>{bank.name} - {bank.accountNo}</MenuItem>
                      )))}
                  </Select>
                </Box>
              </Grid>
              <Grid item xs={12} mb={3}>
                <Box mt={1}>
                  <Typography component="label">Select Category</Typography>
                  <Select value={cashFlowTypeId} onChange={(e) => setCashFlowTypeId(e.target.value)} fullWidth size="small">
                    {cashFlowTypes.length === 0 ? <MenuItem value="">No Data Available</MenuItem> :
                      (cashFlowTypes.map((type, i) => (
                        <MenuItem key={i} value={type.id}>{type.name}</MenuItem>
                      )))}
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

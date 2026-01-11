import React, { useEffect, useRef, useState } from "react";
import { Grid, IconButton, MenuItem, Select, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useApi from "@/components/utils/useApi";
import BorderColorIcon from "@mui/icons-material/BorderColor";

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

const validationSchema = Yup.object().shape({
  Amount: Yup.string().required("Amount is required"),
  Description: Yup.string().required("Description is required"),
});

export default function EditBankHistory({ item, fetchItems, banks }) {
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);
  const inputRef = useRef(null);
  const [cashFlowTypeId, setCashFlowTypeId] = useState(item.cashFlowTypeId || null);
  const [bankId, setBankId] = useState(item.bankId || null);
  const [transactionType, setTransactionType] = useState(item.transactionType || 1);
  const { data: cashFlowTypeList } = useApi("/CashFlowType/GetCashFlowTypesByType?cashType=3");
  const [cashFlowTypes, setCashFlowTypes] = useState([]);

  const handleOpen = async () => {
    setCashFlowTypeId(item.cashFlowTypeId || null);
    setBankId(item.bankId || null);
    setTransactionType(item.transactionType || 1);
    setOpen(true);
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    if (cashFlowTypeList) {
      setCashFlowTypes(cashFlowTypeList.filter(x => x.isActive));
    }
  }, [cashFlowTypeList]);

  const formatDateTimeLocal = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const convertToSLTime = (datetimeLocalValue) => {
    if (!datetimeLocalValue) return null;
    // datetime-local value is in format: "YYYY-MM-DDTHH:mm"
    // We need to treat this as SL time (UTC+5:30) and convert to ISO string
    // Append seconds and SL timezone offset (+05:30)
    const slTimeString = `${datetimeLocalValue}:00+05:30`;
    const date = new Date(slTimeString);
    return date.toISOString();
  };

  const handleSubmit = (values) => {
    if(!bankId){
      toast.error("Please Select Bank");
      return;
    }
    if(!cashFlowTypeId){
      toast.error("Please Select Category");
      return;
    }
    const payload = {
      Id: item.id,
      Amount: values.Amount,
      Description: values.Description,
      CashFlowTypeId: cashFlowTypeId,
      BankId: bankId,
      TransactionType: transactionType,
      ReferanceDate: values.ReferenceDate ? new Date(values.ReferenceDate).toISOString() : null,
      CreatedOn: values.CreatedOn,
    }

    fetch(`${BASE_URL}/BankHistory/UpdateBankHistory`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          setOpen(false);
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
      <Tooltip title="Edit" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={{
              Description: item.description || "",
              Amount: item.amount || "",
              ReferenceDate: item.referenceDate ? new Date(item.referenceDate).toISOString().split('T')[0] : (item.createdOn ? new Date(item.createdOn).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
              CreatedOn: item.createdOn ? formatDateTimeLocal(item.createdOn) : formatDateTimeLocal(new Date()),
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Edit Bank History
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Description
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Description"
                      inputRef={inputRef}
                      error={touched.Description && Boolean(errors.Description)}
                      helperText={touched.Description && errors.Description}
                    />
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Bank
                    </Typography>
                    <Select value={bankId} onChange={(e) => setBankId(e.target.value)} fullWidth>
                      {banks && banks.length === 0 ? <MenuItem value="">No Data Available</MenuItem> :
                        (banks && banks.map((bank, i) => (
                          <MenuItem key={i} value={bank.id}>{bank.name} - {bank.accountNo}</MenuItem>
                        )))}
                    </Select>
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Category
                    </Typography>
                    <Select value={cashFlowTypeId} onChange={(e) => setCashFlowTypeId(e.target.value)} fullWidth>
                      {cashFlowTypes.length === 0 ? <MenuItem value="">No Data Available</MenuItem> :
                        (cashFlowTypes.map((type, i) => (
                          <MenuItem key={i} value={type.id}>{type.name}</MenuItem>
                        )))}
                    </Select>
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Transaction Type
                    </Typography>
                    <Select fullWidth value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
                      <MenuItem value={1}>Deposit</MenuItem>
                      <MenuItem value={2}>Withdrawal</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Reference Date
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="ReferenceDate"
                      type="date"
                      value={values.ReferenceDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setFieldValue("ReferenceDate", e.target.value);
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Created On
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="CreatedOn"
                      type="datetime-local"
                      value={values.CreatedOn}
                      onChange={(e) => {
                        setFieldValue("CreatedOn", e.target.value);
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Amount
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Amount"
                      error={touched.Amount && Boolean(errors.Amount)}
                      helperText={touched.Amount && errors.Amount}
                    />
                  </Grid>
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
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" size="small">
                      Save
                    </Button>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}

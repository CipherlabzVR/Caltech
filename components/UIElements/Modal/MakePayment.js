import React, { useEffect, useState } from "react";
import {
  Card,
  Grid,
  RadioGroup,
  Typography,
  TextField,
  Button,
  Modal,
  Box,
  CircularProgress,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import BASE_URL from "Base/api";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { formatCurrency } from "@/components/utils/formatHelper";
import getNext from "@/components/utils/getNext";
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 700, xs: 400 },
  maxHeight: '90vh',
  overflowY: 'scroll',
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  borderRadius: 2,
};

const paymentOptions = [
  { value: 1, label: "Cash", icon: <AttachMoneyOutlinedIcon /> },
  { value: 2, label: "Card", icon: <CreditCardOutlinedIcon /> },
  { value: 3, label: "Cash & Card", icon: <MonetizationOnOutlinedIcon /> },
  { value: 4, label: "Bank Transfer", icon: <AccountBalanceOutlinedIcon /> },
  { value: 6, label: "No Advance", icon: <DoNotDisturbIcon /> },
];


export default function MakePayment({
  customer,
  closeParentModal,
  fetchItems,
  type,
  item,
  res
}) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [loading, setLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [totalAmount, setTotalAmount] = useState(null);
  const [resId, setResId] = useState(null);
  const [cashAmount, setCashAmount] = useState(null);
  const [cardAmount, setCardAmount] = useState(null);
  const [bankAmount, setBankAmount] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState(null);
  const [paidAmount, setPaidAmount] = useState(null);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [selectedValue, setSelectedValue] = useState(1);
  const { data: documentNo } = getNext(`15`);

  const handleCardClick = (value, setFieldValue) => {
    setTotalAmount(item ? item.totalAmount : null);
    setCashAmount(null);
    setCardAmount(null);
    setBankAmount(null);
    setSelectedValue(value);
    setFieldValue("PaymentType", value);
  };

  useEffect(() => {
    setResId(customer);
    const itemTotal = item ? item.balanceAmount : totalAmount;
    const cash = parseFloat(cashAmount) || 0;
    const card = parseFloat(cardAmount) || 0;
    const bank = parseFloat(bankAmount) || 0;
    const isValidAmount = itemTotal > 0;

    let balance = itemTotal;
    let paid = 0;
    let isAmountMatch = false;

    if (selectedValue === 6) {
      isAmountMatch = true;
    } else if (isValidAmount) {
      switch (selectedValue) {
        case 1:
          paid = cash;
          isAmountMatch = cash > 0 && cash <= itemTotal;
          break;
        case 2:
          paid = card;
          isAmountMatch = card > 0 && card <= itemTotal;
          break;
        case 3:
          paid = cash + card;
          isAmountMatch = cash > 0 && card > 0 && paid <= itemTotal;
          break;
        case 4:
          paid = bank;
          isAmountMatch = bank > 0 && bank <= itemTotal;
          break;
        default:
          isAmountMatch = false;
      }
      balance = itemTotal - paid;
    }

    setBalanceAmount(balance);
    setPaidAmount(paid);
    setIsDisabled(!isAmountMatch);
  }, [item, totalAmount, cashAmount, cardAmount, bankAmount, selectedValue, customer]);



  const handleSubmit = async (values) => {
    const formData = new FormData();

    if ((values.PaymentType !== 1 && values.PaymentType !== 6) && values.File === null) {
      toast.info("Please Upload Receipt");
      return;
    }
    if (values.PaymentType === 6 && values.PaymentDescription === "") {
      toast.info("Please Enter Description");
      return;
    }

    formData.append("File", values.File);
    formData.append("FileName", values.File ? values.File.name : "");
    formData.append("BankAmount", parseFloat(values.BankAmount || 0));
    formData.append("CardAmount", parseFloat(values.CardAmount || 0));
    formData.append("CashAmount", parseFloat(values.CashAmount || 0));
    formData.append("IsApproved", values.IsApproved);
    formData.append("PaidAmount", paidAmount || 0);
    formData.append("PaymentDate", values.PaymentDate || today);
    formData.append("PaymentType", values.PaymentType);
    formData.append("ReservationId", values.ReservationId);
    formData.append("BalanceAmount", balanceAmount || 0);
    formData.append("TotalAmount", values.PaidAmount || 0);
    formData.append("PaymentDescription", values.PaymentDescription || "");
    formData.append("Institution", null);
    formData.append("DocumentNo", documentNo);
    formData.append("PaymentCode", values.PaymentCode || "");
    formData.append("IsFinalPayment", res.type === 11 ? true : false);

    setLoading(true);

    try {
      const response = await fetch(
        `${BASE_URL}/ReservationApproval/CreateApproval`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const responseData = await response.json();
      if (response.ok) {
        toast.success(responseData.result.message);
        setOpen(false);
        fetchItems();
        closeParentModal();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>

      <Button
        disabled={!customer}
        onClick={handleOpen}
        variant="contained"
        color="primary"
      >
        {type === 1 ? "Next" : "Add Payment"}
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Formik
            initialValues={{
              PaidAmount: item ? item.totalAmount : "",
              PaymentDate: today,
              PaymentDescription: "",
              PaymentType: selectedValue,
              CashAmount: "",
              CardAmount: "",
              BankAmount: "",
              IsApproved: false,
              FileName: "",
              PaymentCode: "",
              File: null,
              ReservationId: resId,
            }}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, setFieldValue, values, resetForm }) => (
              <Form>
                <Box mt={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6" mb={2}>
                      Select Payment Method {res.type === 11 ? "(Final Payment )" : ""}
                    </Typography>
                    {item ? <Typography variant="h6" mb={2}>
                      Balance Payment : {formatCurrency(item.balanceAmount)}
                    </Typography> : ""}
                    {res.type === 11 ? <Typography variant="h6" mb={2}>
                      Balance Payment : {formatCurrency(res.finalBalanceAmount)}
                    </Typography> : ""}
                  </Box>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <RadioGroup value={values.PaymentType} name="PaymentType">
                        <Grid container spacing={2} wrap="nowrap" alignItems="stretch">
                          {paymentOptions.map((option) => (
                            <Grid item sx={{ flex: 1 }} key={option.value}>
                              <Card
                                sx={{
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  p: 2,
                                  borderRadius: 2,
                                  textAlign: "center",
                                  border:
                                    values.PaymentType === option.value
                                      ? "2px solid #1976d2"
                                      : "2px solid #e0e0e0",
                                  boxShadow: values.PaymentType === option.value ? 3 : 1,
                                  cursor: "pointer",
                                  transition: "all 0.3s",
                                  "&:hover": {
                                    border: "2px solid #1976d2",
                                    boxShadow: 3,
                                  },
                                }}
                                onClick={() => {
                                  handleCardClick(option.value, setFieldValue);
                                  resetForm({
                                    values: {
                                      PaymentType: option.value,
                                      PaidAmount: item ? item.totalAmount : "",
                                      CashAmount: "",
                                      CardAmount: "",
                                      BankAmount: "",
                                      FileName: "",
                                      File: null,
                                      ReservationId: resId,
                                      IsApproved: false,
                                    },
                                  });
                                }}
                              >
                                <Box
                                  display="flex"
                                  justifyContent="center"
                                  alignItems="center"
                                  mb={1}
                                  sx={{
                                    color:
                                      values.PaymentType === option.value
                                        ? "#1976d2"
                                        : "#757575",
                                  }}
                                >
                                  {option.icon}
                                </Box>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight:
                                      values.PaymentType === option.value
                                        ? "bold"
                                        : "normal",
                                  }}
                                >
                                  {option.label}
                                </Typography>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </RadioGroup>
                    </Grid>                    
                    <Grid item xs={12} lg={6}>
                      <Typography>Date</Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="PaymentDate"
                        type="date"
                        error={
                          touched.PaymentDate && Boolean(errors.PaymentDate)
                        }
                        helperText={touched.PaymentDate && errors.PaymentDate}
                        inputProps={{
                          max: new Date().toISOString().split("T")[0],
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} lg={6}>
                      <Typography>Payment Code</Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="PaymentCode"
                        type="text"
                      />
                    </Grid>
                    <Grid item xs={12} lg={12}>
                      <Typography>Payment Description</Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="PaymentDescription"
                        type="text"
                        placeholder="Enter Description"
                      />
                    </Grid>
                    {[1, 2, 3, 4].includes(selectedValue) && (
                      <Grid item xs={12} lg={6}>
                        <Typography>Total Amount</Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="PaidAmount"
                          disabled={item}
                          type="number"
                          placeholder="Enter Total Amount"
                          onChange={(e) => {
                            setTotalAmount(e.target.value);
                            setFieldValue("PaidAmount", e.target.value);
                          }}
                        />
                      </Grid>
                    )}
                    {(selectedValue === 1 || selectedValue === 3) && (
                      <Grid item xs={12} lg={6}>
                        <Typography>Cash Amount</Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="CashAmount"
                          type="number"
                          placeholder="Enter Cash Amount"
                          onChange={(e) => {
                            setCashAmount(e.target.value);
                            setFieldValue("CashAmount", e.target.value);
                          }}
                        />
                      </Grid>
                    )}
                    {(selectedValue === 2 || selectedValue === 3) && (
                      <Grid item xs={12} lg={6}>
                        <Typography>Card Amount</Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="CardAmount"
                          type="number"
                          placeholder="Enter Card Amount"
                          onChange={(e) => {
                            setCardAmount(e.target.value);
                            setFieldValue("CardAmount", e.target.value);
                          }}
                        />
                      </Grid>
                    )}
                    {selectedValue === 4 && (
                      <Grid item xs={12} lg={6}>
                        <Typography>Transferred Amount</Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="BankAmount"
                          type="number"
                          placeholder="Enter Transferred Amount"
                          onChange={(e) => {
                            setBankAmount(e.target.value);
                            setFieldValue("BankAmount", e.target.value);
                          }}
                        />
                      </Grid>
                    )}
                    {[2, 3, 4].includes(selectedValue) && (
                      <Grid item xs={12}>
                        <Typography>Upload Receipt</Typography>
                        <input
                          type="file"
                          onChange={(event) => {
                            const file = event.target.files[0];
                            setFieldValue("File", file);
                          }}
                        />
                        {touched.File && errors.File && (
                          <Typography color="error" variant="body2">
                            {errors.File}
                          </Typography>
                        )}
                      </Grid>
                    )}
                  </Grid>
                </Box>
                <Box display="flex" justifyContent="space-between" mt={3}>
                  <Button
                    variant="contained"
                    onClick={handleClose}
                    color="error"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={loading || isDisabled}
                    type="submit"
                    variant="contained"
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Submitting...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}

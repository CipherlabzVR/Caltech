import React, { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Checkbox,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/router";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import { getPaymentMethods } from "@/components/types/types";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import SearchSupplier from "@/components/utils/SearchSupplier";
import BASE_URL from "Base/api";
import useApi from "@/components/utils/useApi";
import getNext from "@/components/utils/getNext";

const PaymentCreate = () => {
  const today = new Date();
  const router = useRouter();
  const supplierRef = useRef();
  const { data:docNo , fetchData } = getNext(`24`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentType, setPaymentType] = useState(1);
  const [paymentMode, setPaymentMode] = useState(0);
  const [account, setAccount] = useState(0);
  const [paymentTo, setPaymentTo] = useState(0);
  const [fullAmount, setFullAmount] = useState(0);
  const [refNo, setRefNo] = useState("");
  const [remark, setRemark] = useState("");
  const [supplier, setSupplier] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [grnList, setGRNList] = useState([]);
  const [selectedGRNList, setSelectedGRNList] = useState([]);
  const [paymentDate, setPaymentDate] = useState(formatDate(today));
  const { data: accountList } = useApi("/ChartOfAccount/GetAll");

  const navigateToBack = () => {
    router.push({
      pathname: "/finance/payments",
    });
  };

  useEffect(() => {
    if (accountList) {
      setAccounts(accountList);
    }
  }, [accountList]);

  useEffect(() => {
    const total = selectedGRNList.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setFullAmount(total);
  }, [selectedGRNList]);


  const handleGetGRNList = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/GoodReceivedNote/GetAllCreditGRNBySupplierId?supplierId=${id}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setGRNList(data.result);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const handleCheckBoxCheck = (checked, grn) => {
    if (checked) {
      setSelectedGRNList(prev => [
        ...prev.filter(item => item.id !== grn.id),
        { id: grn.id, grnNumber: grn.grnNumber, amount: grn.dueAmount, grnDate: grn.grnDate, grnId: grn.grnId }
      ]);
    } else {
      setSelectedGRNList(prev => prev.filter(item => item.id !== grn.id));
    }
  };

  const handleAmountChange = (id, value, maxAmount) => {
    const numericValue = parseFloat(value) || 0;
    const cappedValue = numericValue > maxAmount ? maxAmount : numericValue;

    setSelectedGRNList(prev =>
      prev.map(item =>
        item.id === id ? { ...item, amount: cappedValue } : item
      )
    );
  };

  const resetForm = () => {
    fetchData();
    setRemark("");
    setSelectedGRNList([]);
    setGRNList([]);
    setPaymentMode(0);
    setPaymentType(1);
    setPaymentTo(0);
    setSupplier({});
    setRefNo("");
    setAccount(0);
    setFullAmount(0);
    supplierRef.current?.reset();
  };


  const handleSubmit = async () => {
    const paymentLines = selectedGRNList.map(row => ({
      DocumentNo: docNo,
      GRNId: row.grnId,
      GRNNumber: row.grnNumber,
      GRNDate: row.grnDate,
      PaymentDate: today,
      WarehouseId: "1",
      ReceivedAmount: row.amount
    }));

    const validations = [
      { condition: !paymentType, message: "Payment Type is required" },
      { condition: !paymentMode, message: "Payment Mode is required" },
      { condition: !paymentTo, message: "Payment To is required" },
      { condition: !supplier, message: "Supplier is required" },
      { condition: !account, message: "Account is required" },
      { condition: paymentLines.length === 0, message: "At least one payment line is required" }
    ];

    for (const v of validations) {
      if (v.condition) {
        toast.error(v.message);
        return;
      }
    }

    const data = {
      DocumentNo: docNo,
      SupplierId: supplier.id,
      SupplierName: supplier.name,
      RefferanceNo: refNo,
      PaymentDate: paymentDate,
      Remark: remark,
      WarehouseId: "1",
      PaymentType: paymentType,
      PaymentMode: paymentMode,
      PaymentTo: paymentTo,
      ChartOfAccountId: account,
      NetAmount: fullAmount,
      PaymentsLineDetails: paymentLines
    };

    try {
      setIsSubmitting(true);

      const res = await fetch(`${BASE_URL}/Payments/CreatePayment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (res.ok && json.result.result) {
        toast.success(json.result.message);
        resetForm();
      } else {
        toast.error(json.result.message || "Please fill all required fields");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Payment Create</h1>
        <ul>
          <li>
            <Link href="/sales/receipt">Payments</Link>
          </li>
          <li>Create</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1} spacing={1}>
            <Grid item xs={12} gap={2} display="flex" justifyContent="end">
              <Button variant="outlined" disabled>
                <Typography sx={{ fontWeight: "bold" }}>
                  No: {docNo}
                </Typography>
              </Button>
              <Button variant="outlined" onClick={() => navigateToBack()}>
                <Typography sx={{ fontWeight: "bold" }}>Go Back</Typography>
              </Button>
            </Grid>
            <Grid item lg={6} xs={12} display="flex" justifyContent="space-between">
              <Typography>Payment Type</Typography>
              <Select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} sx={{ width: "60%" }} size="small">
                <MenuItem value={1}>Cash</MenuItem>
                <MenuItem value={2}>Card</MenuItem>
                <MenuItem value={4}>Bank Transfer</MenuItem>
                <MenuItem value={5}>Cheque</MenuItem>
              </Select>
            </Grid>
            <Grid item lg={6} xs={12} display="flex" justifyContent="space-between">
              <Typography>Date</Typography>
              <TextField value={paymentDate} type="date" onChange={(e) => setPaymentDate(e.target.value)} sx={{ width: "60%" }} size="small" />
            </Grid>
            <Grid item lg={6} xs={12} display="flex" justifyContent="space-between">
              <Typography>Payment Mode</Typography>
              <Select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} sx={{ width: "60%" }} size="small">
                <MenuItem value={1}>Good Receive Note</MenuItem>
              </Select>
            </Grid>
            <Grid item lg={6} xs={12} display="flex" justifyContent="space-between">
              <Typography>Reference No</Typography>
              <TextField value={refNo} onChange={(e) => setRefNo(e.target.value)} sx={{ width: "60%" }} size="small" />
            </Grid>
            <Grid item lg={6} xs={12} display="flex" justifyContent="space-between">
              <Typography>Payment To</Typography>
              <Select value={paymentTo} onChange={(e) => setPaymentTo(e.target.value)} sx={{ width: "60%" }} size="small">
                <MenuItem value={1}>Supplier</MenuItem>
              </Select>
            </Grid>
            <Grid item lg={6} xs={12} display="flex" justifyContent="space-between">
              <Typography>Remark</Typography>
              <TextField value={remark} onChange={(e) => setRemark(e.target.value)} sx={{ width: "60%" }} size="small" />
            </Grid>
            <Grid item lg={6} xs={12} display="flex" justifyContent="space-between">
              <Typography>Supplier</Typography>
              <SearchSupplier
                ref={supplierRef}
                label=""
                placeholder="Search Supplier by name"
                fetchUrl={`${BASE_URL}/Supplier/GetSuppliersByName`}
                onSelect={(item) => {
                  setSupplier(item);
                  handleGetGRNList(item.id)
                }}
              />
            </Grid>
            <Grid item lg={6} xs={12} display="flex" justifyContent="space-between">
              <Typography>Account</Typography>
              <Select value={account} onChange={(e) => setAccount(e.target.value)} sx={{ width: "60%" }} size="small">
                {accounts.length === 0 ? <MenuItem>No Accounts Availabel</MenuItem> : (accounts.map((acc, index) => (
                  <MenuItem key={index} value={acc.id}>{acc.code} - {acc.description}</MenuItem>
                )))}
              </Select>
            </Grid>
            <Grid item xs={12} >
              <Typography variant="h6">{getPaymentMethods(paymentType)} Details</Typography>
            </Grid>
            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between">
              <Typography>Amount</Typography>
              <TextField value={fullAmount} sx={{ width: "60%" }} size="small" disabled />
            </Grid>
            <Grid item xs={12} my={2}>
              <TableContainer component={Paper}>
                <Table
                  size="small"
                  aria-label="invoice table"
                  className="dark-table"
                >
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell
                        sx={{ color: "#fff" }}
                        align="center"
                      ></TableCell>
                      <TableCell sx={{ color: "#fff" }}>GRN No.</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Total Amount</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Paid Amount</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Due Amount</TableCell>
                      <TableCell align="right" sx={{ color: "#fff" }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {grnList.length === 0 ?
                      <TableRow>
                        <TableCell>No Credit GRN Availabel</TableCell>
                      </TableRow>
                      : (
                        grnList.map((grn, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Checkbox
                                onChange={(e) => handleCheckBoxCheck(e.target.checked, grn)}
                                checked={selectedGRNList.some(item => item.id === grn.id)}
                              />
                            </TableCell>
                            <TableCell>{grn.grnNumber}</TableCell>
                            <TableCell>{formatCurrency(grn.totalAmount)}</TableCell>
                            <TableCell>{formatCurrency(grn.paidAmount)}</TableCell>
                            <TableCell>{formatCurrency(grn.dueAmount)}</TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                disabled={!selectedGRNList.some(item => item.id === grn.id)}
                                value={selectedGRNList.find(item => item.id === grn.id)?.amount || ""}
                                onChange={(e) => handleAmountChange(grn.id, e.target.value, grn.totalAmount)}
                                inputProps={{ max: grn.totalAmount, min: 0 }}
                              />

                            </TableCell>
                          </TableRow>
                        ))
                      )}

                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid
              item
              xs={12}
              my={1}
              sx={{ display: "flex", justifyContent: "flex-end" }}
            >
              <LoadingButton
                loading={isSubmitting}
                handleSubmit={() => handleSubmit()}
                disabled={isSubmitting}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default PaymentCreate;

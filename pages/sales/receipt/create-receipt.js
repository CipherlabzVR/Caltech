import React, { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Checkbox,
  Typography,
  Select,
  Box,
  MenuItem,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import useApi from "@/components/utils/useApi";
import getNext from "@/components/utils/getNext";
import { formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import { v4 as uuidv4 } from 'uuid';
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import useShiftCheck from "@/components/utils/useShiftCheck";
import { getPaymentMethods } from "@/components/types/types";

const ReceiptCreate = () => {
  const today = new Date();
  const [isDisable, setIsDisable] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [salesPerson, setSalesPerson] = useState([]);
  const [salePerson, setSalePerson] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [customer, setCustomer] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [receiptDate, setReceiptDate] = useState(formatDate(today));
  const [receiptNo, setReceiptNo] = useState("");
  const [remark, setRemark] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [address3, setAddress3] = useState("");
  const [address4, setAddress4] = useState("");
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const router = useRouter();
  const [grossTotal, setGrossTotal] = useState(0);
  const [banks, setBanks] = useState([]);
  const [bankId, setBankId] = useState(null);
  const [chequeDate, setChequeDate] = useState(null);
  const [chequeNo, setChequeNo] = useState(null);
  const [paymentType, setPaymentType] = useState(null);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [selectedInvoicesList, setSelectedInvoicesList] = useState([]);
  const [invoices, setInvoices] = useState([]); // Populate this with API data
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [issubmitting, setIssubmitting] = useState(false);
  const guidRef = useRef(uuidv4());
  const { data: bankList } = useApi("/Bank/GetAllBanks");
  const { data: IsReceiptAllOutstandingView } = IsAppSettingEnabled("IsReceiptAllOutstandingView");
  //API Calls
  const { data: customerList } = useApi("/Customer/GetAllCustomer");
  const { result: shiftResult, message: shiftMessage } = useShiftCheck();

  const { data: selectedCustomerDetails, error: selectedCustomerError } =
    useApi(`/Customer/GetCustomerById/${customer?.id}`);
  const { data: salesPersonList } = useApi("/SalesPerson/GetAllSalesPerson");

  const { data: invoicesApiResult } = useApi(
    customer?.id
      ? `/SalesInvoice/GetInvoicesByCustomerId?customerId=${customer.id}`
      : null
  );

  const { data: totalOutstandingApiResult } = useApi(
    customer?.id
      ? `/Outstanding/GetCustomerWiseTotalOutstandingAmount?customerId=${customer.id}`
      : null
  );

  const { data: receiptNumber } = getNext(`5`);

  useEffect(() => {
    const gross = selectedRows.reduce(
      (gross, row) => gross + (Number(row.totalPrice) || 0),
      0
    );
    setGrossTotal(gross.toFixed(2));
    if (bankList) {
      setBanks(bankList);
    }
  }, [selectedRows, bankList]);

  const navigateToBack = () => {
    router.push({
      pathname: "/sales/receipt",
    });
  };

  const handleSelectInvoice = (id, isChecked, invoice) => {
    setSelectedInvoicesList((prevInvoice) => {
      let updatedInvoices;

      if (isChecked) {
        updatedInvoices = [...prevInvoice, invoice];
      } else {
        // Remove the invoice from the list
        updatedInvoices = prevInvoice.filter(
          (selectedInvoice) => selectedInvoice !== invoice
        );
      }

      return updatedInvoices;
    });

    // Update the list of selected invoice ids
    setSelectedInvoices((prevSelected) => {
      let updatedIds;

      if (isChecked) {
        // Add the id to the array
        updatedIds = [...prevSelected, id];
      } else {
        // Remove the id from the array
        updatedIds = prevSelected.filter((selectedId) => selectedId !== id);
      }

      return updatedIds;
    });
  };

  const fetchInvoices = async (customer) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Outstanding/GetAllCustomerwiseOustandingsByIsSettled?customerId=${customer.id}&isSettled=false`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCustomerInvoices(data.result);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => { }, [selectedInvoices]); // Runs whenever selectedInvoices changes
  const handlePayingAmountChange = (index, value, invoiceId) => {
    // Get the current invoice
    const invoice = customerInvoices[index];

    // Calculate the dueAmount dynamically (netTotal - paymentAmount)

    // Update customerInvoices
    setCustomerInvoices((prev) =>
      prev.map((inv, i) =>
        i === index
          ? {
            ...inv,
            payingAmount: value, // Ensures the amount doesn't exceed the due amount
          }
          : inv
      )
    );

    setSelectedInvoicesList((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
            ...inv,
            payingAmount: value,
          }
          : inv
      )
    );

    // Update cashAmount based on selectedInvoicesList
  };

  useEffect(() => {
    setCashAmount(
      selectedInvoicesList.reduce(
        (total, inv) => total + (Number(inv.payingAmount) || 0),
        0
      )
    );
  }, [customerInvoices, selectedInvoicesList]);

  const handleSubmit = async () => {
    if (shiftResult) {
      toast.warning(shiftMessage);
      return;
    }
    if (!customer) {
      toast.error("Please Select Customer.");
      return;
    }
    if (receiptDate === "") {
      toast.error("Please Select Receipt Date.");
      return;
    }
    if (cashAmount <= 0) {
      toast.error("Amount Cannot be 0");
      return;
    }
    if (!paymentType) {
      toast.error("Please Select Payment Type");
      return;
    }

    if (paymentType === 5) {
      if (!chequeNo) {
        toast.error("Please Enter Cheque No");
        return;
      }
      if (!chequeDate) {
        toast.error("Please Enter Cheque Date");
        return;
      }
    }

    if (paymentType === 2 || paymentType === 3 || paymentType === 4) {
      if (!bankId) {
        toast.error("Please Select Bank");
        return;
      }

      if (paymentType === 3 && (cardAmount === "" || cardAmount === 0)) {
        toast.error("Please Enter Card Amount");
        return;
      }
    }
    
    const data = {
      ReceiptNumber: "R12345",
      ReceiptDate: receiptDate,
      CustomerId: customer.id,
      CustomerName: customer?.firstName || "N/A",
      CustomerAddressLine1: customer.addressLine1 || "N/A",
      CustomerAddressLine2: customer.addressLine2 || "N/A",
      CustomerAddressLine3: customer.addressLine3 || "N/A",
      CurrentTotalOutstanding: totalOutstanding,
      ReferenceNumber: "SAMPLE",
      Remark: remark,
      TotalPaidAmount: cashAmount,
      InventoryPeriodId: 2,
      SalesPersonId: salePerson ? salePerson.id : null,
      SalesPersonCode: salePerson ? salePerson.code : null,
      SalesPersonName: salePerson ? salePerson.name : null,
      PaymentType: paymentType,
      FormSubmitId: guidRef.current,
      ChequeDate: chequeDate,
      ChequeNo: chequeNo,
      BankId: bankId,
      CardAmount : cardAmount || 0,
      ReceiptLineDetails: (IsReceiptAllOutstandingView ? customerInvoices : selectedInvoicesList).map((row) => ({
        InvoiceId: row.invoiceId,
        InvoiceNo: row.invoiceNumber,
        InvoiceTotalAmount: row.totalInvoiceAmount,
        CurrentOutstandingAmount: parseFloat(row.outstandingAmount || 0) - parseFloat(row.payingAmount || 0),
        SalesReturnedAmount: row.creditAmount || 0,
        ReceivedAmount: row.payingAmount || 0,
        InventoryPeriodId: row.fiscalPeriodId,
      })),
    };

    try {
      setIssubmitting(true);
      const response = await fetch(`${BASE_URL}/Receipt/CreateReceipt`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const jsonResponse = await response.json();

        if (jsonResponse.message != "" && jsonResponse.statusCode === 200) {
          setIsDisable(true);
          toast.success(jsonResponse.message);
          setTimeout(() => {
            window.location.href = "/sales/receipt";
          }, 1500);

        } else {
          toast.error(jsonResponse.message);
        }
      } else {
        toast.error("Please fill all required fields");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIssubmitting(false);
    }
  };

  useEffect(() => {
    if (customerList) {
      setCustomers(customerList);
    }

    if (receiptNumber) {
      setReceiptNo(receiptNumber);
    }
    if (salesPersonList) {
      setSalesPerson(salesPersonList);
    }
  }, [receiptNo, customerList, salesPerson]);

  useEffect(() => {
    if (customer) {
      // Update any states with the returned customer details
      // You can set specific data, e.g., addresses
      setAddress1(customer.addressLine1 || "");
      setAddress2(customer.addressLine2 || "");
      setAddress3(customer.addressLine3 || "");
      setCustomerId(customer.id || "");
    }
  }, [customer]);

  useEffect(() => {
    if (customer) {
      if (invoicesApiResult) {
        setInvoices(invoicesApiResult);
      }

      if (totalOutstandingApiResult) {
        setTotalOutstanding(totalOutstandingApiResult);
      }
    }
  }, [invoicesApiResult, totalOutstandingApiResult, customer]);

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Receipt Create</h1>
        <ul>
          <li>
            <Link href="/sales/receipt">Receipt</Link>
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
                  Receipt No: {receiptNo}
                </Typography>
              </Button>
              <Button variant="outlined" onClick={() => navigateToBack()}>
                <Typography sx={{ fontWeight: "bold" }}>Go Back</Typography>
              </Button>
            </Grid>
            <Grid item xs={12} lg={6}>
              <Box mt={1} display="flex" justifyContent="space-between">
                <Typography component="label">Customer</Typography>
                <Autocomplete
                  sx={{ width: "60%" }}
                  options={customers}
                  getOptionLabel={(option) => option.firstName || ""}
                  value={customer}
                  onChange={(event, newValue) => {
                    setCustomer(newValue);
                    fetchInvoices(newValue);
                    if (newValue) {
                      setAddress1(newValue.addressLine1 || "");
                      setAddress2(newValue.addressLine2 || "");
                      setAddress3(newValue.addressLine3 || "");
                    } else {
                      setAddress1("");
                      setAddress2("");
                      setAddress3("");
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      fullWidth
                      placeholder="Search Customer"
                    />
                  )}
                />
              </Box>
              <Box mt={1} display="flex" justifyContent="space-between">
                <Typography component="label">Bill to</Typography>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  placeholder="Address Line 1"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                />
              </Box>
              <Box mt={1} display="flex" justifyContent="end">
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  placeholder="Address Line 2"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                />
              </Box>
              <Box mt={1} display="flex" justifyContent="end">
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  placeholder="Address Line 3"
                  value={address3}
                  onChange={(e) => setAddress3(e.target.value)}
                />
              </Box>
              <Box mt={1} display="flex" justifyContent="end">
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  placeholder="Address Line 4"
                  value={address4}
                  onChange={(e) => setAddress4(e.target.value)}
                />
              </Box>
              <Box mt={1} display="flex" justifyContent="space-between">
                <Typography component="label">Amount</Typography>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  value={cashAmount}
                  InputProps={{ readOnly: true }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} lg={6}>
              <Box mt={1} display="flex" justifyContent="space-between">
                <Typography component="label">Date</Typography>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  type="date"
                  fullWidth
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                />
              </Box>
              <Box mt={1} display="flex" justifyContent="space-between">
                <Typography component="label">Sales Person</Typography>
                <Autocomplete
                  sx={{ width: "60%" }}
                  options={salesPerson}
                  getOptionLabel={(option) => option.name || ""}
                  value={salePerson}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  onChange={(event, newValue) => setSalePerson(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      fullWidth
                      placeholder="Search Sales Person"
                    />
                  )}
                />
              </Box>
              <Box mt={1} display="flex" justifyContent="space-between">
                <Typography component="label">Payment Method</Typography>
                <Select
                  value={paymentType}
                  onChange={(e) => {
                    setPaymentType(e.target.value);
                    setBankId(null);
                    setChequeDate(null);
                    setChequeNo("");
                  }} sx={{ width: "60%" }} size="small">
                  <MenuItem value={1}>Cash</MenuItem>
                  <MenuItem value={2}>Card</MenuItem>
                  <MenuItem value={3}>Cash & Card</MenuItem>
                  <MenuItem value={4}>Bank Transfer</MenuItem>
                  <MenuItem value={5}>Cheque</MenuItem>
                </Select>
              </Box>
              <Box mt={1} display="flex" justifyContent="space-between">
                <Typography component="label">Total Outstanding</Typography>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  value={totalOutstanding}
                  disabled
                />
              </Box>
              <Box mt={1} display="flex" justifyContent="space-between">
                <Typography component="label">Remark</Typography>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />
              </Box>
            </Grid>
            {(paymentType && paymentType != 1) ?
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" component="label">
                    {getPaymentMethods(paymentType)} Details
                  </Typography>
                </Grid>
                {paymentType != 5 ?
                  <Grid item xs={12} lg={6}>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <Typography component="label">Select Bank</Typography>
                      <Select size="small" sx={{ width: "60%" }} fullWidth value={bankId} onChange={(e) => setBankId(e.target.value)}>
                        {banks.length === 0 ? <MenuItem value="">No Data Available</MenuItem> :
                          (banks.map((bank, i) => (
                            <MenuItem key={i} value={bank.id}>{bank.name} - {bank.accountNo}</MenuItem>
                          )))}
                      </Select>
                    </Box>
                  </Grid>
                  : ""}
                {paymentType === 3 ? <>
                  <Grid item xs={12} lg={6}>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <Typography component="label">Card Amount</Typography>
                      <TextField
                        sx={{ width: "60%" }}
                        size="small"
                        fullWidth
                        type="number"
                        value={cardAmount}
                        onChange={(e) => {
                          var am = e.target.value;
                          if (am < cashAmount) {
                            setCardAmount(e.target.value);
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                </> : ""}
                {paymentType === 5 ?
                  <>
                    <Grid item xs={12} lg={6}>
                      <Box mt={1} display="flex" justifyContent="space-between">
                        <Typography component="label">Cheque No</Typography>
                        <TextField
                          sx={{ width: "60%" }}
                          size="small"
                          fullWidth
                          value={chequeNo}
                          onChange={(e) => setChequeNo(e.target.value)}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} lg={6}>
                      <Box mt={1} display="flex" justifyContent="space-between">
                        <Typography component="label">Cheque Date</Typography>
                        <TextField
                          sx={{ width: "60%" }}
                          size="small"
                          fullWidth
                          type="date"
                          value={chequeDate}
                          onChange={(e) => setChequeDate(e.target.value)}
                        />
                      </Box>
                    </Grid>
                  </>
                  : ""}
              </>
              : ""}


            <Grid item xs={12} my={2}>
              <TableContainer component={Paper}>
                <Table
                  size="small"
                  aria-label="invoice table"
                  className="dark-table"
                >
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}>#</TableCell>
                      <TableCell
                        sx={{ color: "#fff" }}
                        align="center"
                      ></TableCell>
                      <TableCell sx={{ color: "#fff" }}>Invoice No.</TableCell>
                      {/* <TableCell sx={{ color: "#fff" }}>Reference No.</TableCell> */}
                      <TableCell sx={{ color: "#fff" }}>Total Amount</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Received Amount
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Sales Returned Amount
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>Due Amount</TableCell>
                      <TableCell align="right" sx={{ color: "#fff" }}>
                        Payment Amount
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customerInvoices.map((invoice, index) => {
                      const dueAmount =
                        invoice.totalInvoiceAmount != null &&
                          invoice.paymentAmount != null
                          ? invoice.totalInvoiceAmount - invoice.paymentAmount
                          : "N/A"; // You can replace 'N/A' with another default value if necessary

                      return (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={selectedInvoices.includes(invoice.id)}
                              onChange={(e) =>
                                handleSelectInvoice(
                                  invoice.id,
                                  e.target.checked,
                                  invoice
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>{invoice.invoiceNumber}</TableCell>
                          <TableCell>{invoice.totalInvoiceAmount}</TableCell>
                          <TableCell>
                            {invoice.totalInvoiceAmount -
                              (invoice.outstandingAmount + invoice.returnedAmount)}

                          </TableCell>
                          <TableCell>{invoice.returnedAmount}</TableCell>
                          <TableCell>{invoice.outstandingAmount}</TableCell>
                          <TableCell align="right">
                            <TextField
                              sx={{ width: "150px" }}
                              size="small"
                              type="number"
                              inputProps={{
                                min: 0,
                              }}
                              value={invoice.payingAmount || ""}
                              onChange={(e) =>
                                handlePayingAmountChange(
                                  index,
                                  e.target.value,
                                  invoice.id
                                )
                              }
                              error={invoice.payingAmount > dueAmount}
                              disabled={!selectedInvoices.includes(invoice.id)}
                              helperText={
                                invoice.payingAmount > dueAmount
                                  ? "Payment cannot exceed due amount"
                                  : ""
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid
              item
              xs={12}
              my={3}
              sx={{ display: "flex", justifyContent: "flex-end" }}
            >
              <LoadingButton
                loading={issubmitting}
                handleSubmit={() => handleSubmit()}
                disabled={isDisable}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default ReceiptCreate;
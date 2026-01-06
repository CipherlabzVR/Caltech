import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Button,
  TextField,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
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
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import useShiftCheck from "@/components/utils/useShiftCheck";

const CreateCreditNote = () => {
  const [issubmitting, setIssubmitting] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const today = new Date();
  const [customers, setCustomers] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(formatDate(today));
  const [remark, setRemark] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [address3, setAddress3] = useState("");
  const [address4, setAddress4] = useState("");
  const router = useRouter();
  const [salesPerson, setSalesPerson] = useState("");
  const [outstandingAmounts, setOutstandingAmounts] = useState("");
  const { result: shiftResult, message: shiftMessage } = useShiftCheck();
  const [invoicesForCustomer, setInvoicesForCustomer] = useState([]);
  const [customerId, setCustomerId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceFocused, setInvoiceFocused] = useState(false);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [noteType, setNoteType] = useState("Credit");
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState("unsettled");
  const [documentNo, setDocumentNo] = useState("");

  const { data: customerList } = useApi("/Customer/GetAllCustomer");
  const { data: salesPersonList } = useApi("/SalesPerson/GetAllSalesPerson");

  // Dynamically fetch next document number based on Note Type
  // Credit Note ID = 7, Debit Note ID = 47
  const docTypeId = noteType === "Credit" ? 7 : 47;
  const { data: nextDocNo } = getNext(`${docTypeId}`);

  useEffect(() => {
    if (nextDocNo) {
      setDocumentNo(nextDocNo);
    }
  }, [nextDocNo]);

  const navigateToBack = () => {
    router.push({
      pathname: "/sales/credit-note",
    });
  };

  const handleSubmit = async () => {
    if (shiftResult) {
      toast.warning(shiftMessage);
      return;
    }
    if (!customer) {
      toast.error("Please Select Customer.");
      return;
    }
    if (!selectedInvoice || !selectedInvoice.invoiceNumber) {
      toast.error("Please select an invoice.");
      return;
    }

    if (
      noteType === "Credit" &&
      (parseFloat(amount) > (selectedInvoice?.totalInvoiceAmount || 0) ||
        parseFloat(amount) < 0)
    ) {
      toast.error(
        "Credit Amount must be less than the Invoice Outstanding Amount."
      );
      return;
    }

    const data = {
      customerId: customer?.id || 0,
      customerName: customer?.firstName || "N/A",
      customerAddressLine1: address1 || "",
      customerAddressLine2: address2 || "",
      customerAddressLine3: address3 || "",
      date: invoiceDate,
      oustandingAmount: parseFloat(selectedInvoice.totalInvoiceAmount || 0),
      amount: parseFloat(amount || 0),
      salesPersonId: salesPerson?.id || 0,
      salesPersonCode: salesPerson?.code || "",
      salesPersonName: salesPerson?.name || "",
      invoiceId: selectedInvoice?.invoiceId || 0,
      invoiceNumber: selectedInvoice?.invoiceNumber || 0,
      remark: remark || "",
      noteType: noteType,
    };

    try {
      setIssubmitting(true);
      const response = await fetch(`${BASE_URL}/CreditNote/CreateCreditNote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse.result.result !== "") {
          setIsDisable(true);
          toast.success(jsonResponse.result.message);
          setTimeout(() => {
            window.location.href = "/sales/credit-note";
          }, 1500);
        } else {
          toast.error(jsonResponse.result.message);
        }
      } else {
        const errorResponse = await response.json();
        toast.error(
          "Error: " +
          (errorResponse.message || "Please fill all required fields")
        );
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while submitting the data.");
    } finally {
      setIssubmitting(false);
    }
  };

  const handleAmountChange = (e) => {
    const newAmount = e.target.value;

    if (noteType === "Credit") {
      const numericAmount = parseFloat(newAmount);
      if (
        !isNaN(numericAmount) &&
        (numericAmount > (selectedInvoice?.totalInvoiceAmount || 0) || numericAmount < 0)
      ) {
        setAmountError(
          "Amount must be less than the Invoice Outstanding Amount."
        );
      } else {
        setAmountError("");
      }
    } else {
      setAmountError("");
    }
    setAmount(newAmount);
  };

  const fetchOutstandingAmount = async (customerId) => {
    if (!customerId) return;
    try {
      const response = await fetch(
        `${BASE_URL}/Outstanding/GetCustomerWiseTotalOutstandingAmount?customerId=${customerId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (response.ok) {
        const jsonResponse = await response.json();
        setOutstandingAmounts(jsonResponse.result || 0);
      } else {
        setOutstandingAmounts("");
      }
    } catch (error) {
      setOutstandingAmounts("");
    }
  };

  const fetchInvoicesForCustomer = async (customerId) => {
    if (!customerId) {
      return;
    }
    const isSettled = invoiceFilterStatus === "settled";
    try {
      const response = await fetch(
        `${BASE_URL}/Outstanding/GetAllCustomerInvoicesBySettlementStatus?customerId=${customerId}&isSettled=${isSettled}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse.result && jsonResponse.result.length > 0) {
          setInvoicesForCustomer(
            jsonResponse.result.map((item) => ({
              invoiceId: item.invoiceId,
              invoiceNumber: item.invoiceNumber,
              totalInvoiceAmount: item.outstandingAmount,
            }))
          );
        } else {
          setInvoicesForCustomer([]);
        }
      } else {
        toast.error("Failed to fetch invoices.");
        setInvoicesForCustomer([]);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Error fetching invoices.");
      setInvoicesForCustomer([]);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchInvoicesForCustomer(customerId);
    } else {
      setInvoicesForCustomer([]);
    }
  }, [customerId, invoiceFilterStatus]);

  useEffect(() => {
    if (customerId && invoiceFocused) {
      fetchInvoicesForCustomer(customerId);
    }
  }, [invoiceFocused, customerId]);

  const handleInvoiceFocus = () => setInvoiceFocused(true);
  const handleInvoiceBlur = () => setInvoiceFocused(false);

  useEffect(() => {
    if (customerList) {
      setCustomers(customerList);
    }
  }, [customerList]);

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Customer {noteType} Note Create</h1>
        <ul>
          <li><Link href="/sales/credit-note">Customer {noteType} Notes</Link></li>
          <li>Create</li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} p={1}>
              <FormControl>
                <RadioGroup row value={noteType} onChange={(e) => {
                  setNoteType(e.target.value);
                  setAmountError("");
                }}>
                  <FormControlLabel value="Credit" control={<Radio />} label="Credit Note" />
                  <FormControlLabel value="Debit" control={<Radio />} label="Debit Note" />
                </RadioGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12} display="flex" justifyContent="end" alignItems="center" gap={2} px={1} mb={2}>
              <TextField
                size="small"
                value={documentNo}
                InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}
                sx={{ width: '180px' }}
              />
              <Button variant="outlined" onClick={navigateToBack} size="small">
                <Typography sx={{ fontWeight: "bold" }}>Go Back</Typography>
              </Button>
            </Grid>

            <Grid item xs={12} lg={6} display="flex" flexDirection="column" sx={{ marginLeft: -2 }}>
              <Grid item xs={10} display="flex" justifyContent="space-between" mt={1}>
                 <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>Customer</Typography>
                 <Autocomplete sx={{ width: "60%" }} options={customers} getOptionLabel={(option) => option.firstName || ""} value={customer}
                   onChange={(event, newValue) => {
                     setCustomer(newValue);
                     setCustomerId(newValue?.id || null);
                     setSelectedInvoice(null);
                     setAmount("");
                     if (newValue) {
                       setAddress1(newValue.addressLine1 || "");
                       setAddress2(newValue.addressLine2 || "");
                       setAddress3(newValue.addressLine3 || "");
                       fetchOutstandingAmount(newValue.id);
                     } else {
                       setAddress1(""); setAddress2(""); setAddress3("");
                       setOutstandingAmounts("");
                       setInvoicesForCustomer([]);
                     }
                   }}
                   renderInput={(params) => <TextField {...params} size="small" fullWidth placeholder="Search Customer" />}
                 />
               </Grid>
               <Grid item xs={10} display="flex" flexDirection="column" mt={1} mb={1}>
                 <Grid item xs={12} display="flex" justifyContent="space-between">
                   <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>Address</Typography>
                   <TextField sx={{ width: "60%" }} size="small" fullWidth placeholder="Address Line 1" value={address1} onChange={(e) => setAddress1(e.target.value)} />
                 </Grid>
                 <Grid item xs={12} display="flex" justifyContent="end" mt={1}><TextField sx={{ width: "60%" }} size="small" fullWidth placeholder="Address Line 2" value={address2} onChange={(e) => setAddress2(e.target.value)} /></Grid>
                 <Grid item xs={12} display="flex" justifyContent="end" mt={1}><TextField sx={{ width: "60%" }} size="small" fullWidth placeholder="Address Line 3" value={address3} onChange={(e) => setAddress3(e.target.value)} /></Grid>
                 <Grid item xs={12} display="flex" justifyContent="end" mt={1}><TextField sx={{ width: "60%" }} size="small" fullWidth placeholder="Address Line 4" value={address4} onChange={(e) => setAddress4(e.target.value)} /></Grid>
               </Grid>
               <Grid item xs={10} display="flex" justifyContent="space-between" mt={0} mb={10}>
                 <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>Remark</Typography>
                 <TextField sx={{ width: "60%" }} size="small" fullWidth value={remark} onChange={(e) => setRemark(e.target.value)} />
               </Grid>
            </Grid>

            <Grid item xs={12} lg={6} display="flex" flexDirection="column">
              <Grid container>
                <Grid item xs={12} display="flex" justifyContent="space-between" mt={1}>
                   <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>Date</Typography>
                   <TextField sx={{ width: "60%" }} size="small" type="date" fullWidth value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                </Grid>
                <Grid item xs={12} display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                   <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>Salesperson</Typography>
                   <Autocomplete sx={{ width: "60%" }} options={salesPersonList || []} getOptionLabel={(option) => option.name || ""} value={salesPerson}
                     onChange={(event, newValue) => { setSalesPerson(newValue); }}
                     renderInput={(params) => <TextField {...params} size="small" fullWidth placeholder="Select Salesperson" />}
                   />
                </Grid>
                <Grid item xs={12} display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                   <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>Outstanding Total Amount</Typography>
                   <TextField sx={{ width: "60%" }} size="small" fullWidth placeholder="Outstanding Amount" value={outstandingAmounts} InputProps={{ readOnly: true }} />
                </Grid>

                <Grid item xs={12} display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                    <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>Invoice Status</Typography>
                    <FormControl sx={{ width: "60%" }}>
                        <RadioGroup row value={invoiceFilterStatus} onChange={(e) => {
                            setInvoiceFilterStatus(e.target.value);
                            setSelectedInvoice(null);
                        }}>
                            <FormControlLabel value="unsettled" control={<Radio size="small"/>} label="Unsettled" />
                            <FormControlLabel value="settled" control={<Radio size="small"/>} label="Settled" />
                        </RadioGroup>
                    </FormControl>
                </Grid>

                <Grid item xs={12} display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                  <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>Invoice</Typography>
                  <Autocomplete sx={{ width: "60%" }} options={invoicesForCustomer} getOptionLabel={(option) => `${option.invoiceNumber}`} value={selectedInvoice}
                    onChange={(event, newValue) => setSelectedInvoice(newValue)}
                    onFocus={handleInvoiceFocus} onBlur={handleInvoiceBlur}
                    renderInput={(params) => <TextField {...params} size="small" fullWidth placeholder="Search Invoice" />}
                    renderOption={(props, option) => (
                      <li {...props} key={option.invoiceId}>
                        <Typography variant="body2">{`${option.invoiceNumber} - ${formatCurrency(option.totalInvoiceAmount)}`}</Typography>
                      </li>
                    )}
                  />
                </Grid>

                <Grid item xs={12} display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                  <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>Invoice Outstanding Amount</Typography>
                  <TextField sx={{ width: "60%" }} size="small" fullWidth value={selectedInvoice ? `${selectedInvoice.totalInvoiceAmount}` : ""} placeholder="Invoice Amount" InputProps={{ readOnly: true }}/>
                </Grid>

                <Grid item xs={12} display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                  <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>{noteType} Amount</Typography>
                  <TextField
                    sx={{ width: "60%" }} size="small" fullWidth
                    placeholder={`${noteType} Amount`}
                    value={amount}
                    onChange={handleAmountChange}
                    error={!!amountError}
                    helperText={amountError}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <LoadingButton loading={issubmitting} handleSubmit={handleSubmit} disabled={isDisable} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default CreateCreditNote;
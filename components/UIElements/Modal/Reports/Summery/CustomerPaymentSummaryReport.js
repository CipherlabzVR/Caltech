import React, { useEffect, useState } from "react";
import {
  Button,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import "react-toastify/dist/ReactToastify.css";
import { Visibility } from "@mui/icons-material";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";
import useApi from "@/components/utils/useApi";
import BASE_URL from "Base/api";
import { formatCurrency } from "@/components/utils/formatHelper";

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

export default function CustomerPaymentSummaryReport({ docName, reportName }) {
  const warehouseId = localStorage.getItem("warehouse");
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { data: SalesSummaryReport } = GetReportSettingValueByName(reportName);
  const name = localStorage.getItem("name");
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(0);
  const [paymentType, setPaymentType] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [invoiceId, setInvoiceId] = useState(0);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const { data: customerList } = useApi("/Customer/GetAllCustomer");

  const fetchInvoices = async (customerId) => {
    try {
      const response = await fetch(`${BASE_URL}/SalesInvoice/GetInvoicesByCustomerId?customerId=${customerId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const result = await response.json();
      setInvoices(result.result);
    } catch (err) {
      // setError('Error fetching data');
    }
  };

  const handleSelectCustomer = (customerId) => {
    setCustomerId(customerId);
    fetchInvoices(customerId);
  }

  useEffect(() => {
    if (customerList) {
      setCustomers(customerList);
    }
  }, [customerList]);

  const isFormValid = fromDate && toDate && customerId;

  return (
    <>
      <Tooltip title="View" placement="top">
        <IconButton onClick={handleOpen} aria-label="View" size="small">
          <Visibility color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Grid container spacing={1}>
              <Grid item xs={12} my={2} display="flex" justifyContent="space-between">
                <Typography variant="h5" fontWeight="bold">
                  Customer Payment Summary Report
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  From
                </Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  To
                </Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Select Customer
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={customerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                >
                  {customers.length === 0 ? <MenuItem value="">No Customers Available</MenuItem>
                    : (customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName}</MenuItem>
                    )))}
                </Select>
              </Grid>
              <Grid item xs={12}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Select Invoice
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                >
                  <MenuItem value={0}>All</MenuItem>
                  {invoices.length === 0 ? <MenuItem value="">No Invoices Available</MenuItem>
                    : (invoices.map((item) => (
                      <MenuItem key={item.id} value={item.id}>{item.documentNo} - {formatCurrency(item.grossTotal)}</MenuItem>
                    )))}
                </Select>
              </Grid>
              <Grid item xs={12}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Select Payment Type
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                >
                  <MenuItem value={0}>All</MenuItem>
                  <MenuItem value={1}>Cash</MenuItem>
                  <MenuItem value={2}>Card</MenuItem>
                  <MenuItem value={3}>Cash & Card</MenuItem>
                  <MenuItem value={4}>Bank Transfer</MenuItem>
                  <MenuItem value={5}>Cheque</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
                <Button onClick={handleClose} variant="contained" color="error">
                  Close
                </Button>
                <a href={`${Report}/${docName}?InitialCatalog=${Catelogue}&reportName=${SalesSummaryReport}&fromDate=${fromDate}&toDate=${toDate}&warehouseId=${warehouseId}&currentUser=${name}&customerId=${customerId}&invoiceId=${invoiceId}&paymentType=${paymentType}`} target="_blank">
                  <Button variant="contained" disabled={!isFormValid} aria-label="print" size="small">
                    Submit
                  </Button>
                </a>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

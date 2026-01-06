import React, { useEffect, useState } from "react";
import ReceiptStyles from "../../Styles/receipt-print";
import {
  Document,
  Page,
  Text,
  View,
  PDFViewer,
  Image,
  pdf,
} from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { Box, Button, Grid, IconButton, Modal, Tooltip } from "@mui/material";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import ShareReports from "./ShareReports";
import BASE_URL from "Base/api";
import useApi from "@/components/utils/useApi";

const ReceiptReport = ({ receipt }) => {
  const currentDate = new Date().toISOString().split("T")[0];
  const [open, setOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState(null);
  const [outstandingAmount, setOutstandingAmount] = useState(null);
  const [supplier, setSupplier] = useState({});
  const [items] = useState(receipt.receiptLineDetails);
  const [customer, setCustomer] = useState("");

  const {
    data: customerData,
    loading: Loading,
    error: Error,
  } = useApi(
    `/Customer/GetCustomerDetailByID?customerId=${receipt.customerId}`
  );

  useEffect(() => {
    if (customerData) {
      const customer = customerData.result[0];
      const contact = customer.customerContactDetails[0].contactNo
      setCustomer(contact);
    }
  }, [customerData]);

  const handleClose = () => {
    setOpen(false);
  };

  const UploadPDF = async () => {
    const pdfContent = MyDocument;
    try {
      const blob = await pdf(pdfContent).toBlob();
      const formData = new FormData();
      formData.append("file", blob, `${receipt.receiptNumber}.pdf`);
      formData.append("fileName", `${receipt.receiptNumber}.pdf`);
      formData.append("storePath", "Receipt");

      const response = await fetch(`${BASE_URL}/AWS/DocumentUploadCommon`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  useEffect(() => {
    if (items.length !== 0) {
      const sum = items.reduce((acc, item) => acc + item.receivedAmount, 0);
      const outstanding = receipt.currentTotalOutstanding - sum;
      const paid = items[0].invoiceTotalAmount - outstanding;

      setPaidAmount(paid);
      setOutstandingAmount(outstanding);
    }
  }, [items]);

  const MyDocument = (
    <Document>
      <Page size="A4" style={ReceiptStyles.page}>
        <View style={ReceiptStyles.section}>
          <Image
            style={ReceiptStyles.backgroundImage}
            src="/images/quotation/receipt.jpg"
          />
          <Text style={ReceiptStyles.date}>
            Date : {formatDate(currentDate)}
          </Text>
          <Text style={ReceiptStyles.invoiceNo}>
            Receipt No : {receipt.receiptNumber}
          </Text>
          <Text style={ReceiptStyles.add}>Bill To</Text>
          <Text style={ReceiptStyles.add}>{receipt.customerName}</Text>
          <Text style={ReceiptStyles.add}>{receipt.customerAddressLine1}</Text>
          <Text style={ReceiptStyles.add}>{receipt.customerAddressLine2}</Text>
          <Text style={ReceiptStyles.add}>{receipt.customerAddressLine3}</Text>

          <View style={{ ...ReceiptStyles.table, marginTop: 5 }}>
            <View style={ReceiptStyles.tableRow}>
              <Text
                style={{ ...ReceiptStyles.tableCell, borderBottom: "none" }}
              >
                Invoice No.
              </Text>
              <Text
                style={{ ...ReceiptStyles.tableCell, borderBottom: "none" }}
              >
                Payment Date
              </Text>
              <Text
                style={{ ...ReceiptStyles.tableCell, borderBottom: "none" }}
              >
                Total Invoice Amount
              </Text>
              <Text
                style={{ ...ReceiptStyles.tableCell, borderBottom: "none" }}
              >
                Received Amount
              </Text>
            </View>
          </View>
          <View style={ReceiptStyles.table}>
            {items.length === 0 ? (
              <View style={ReceiptStyles.tableRow}>
                <Text style={{ ...ReceiptStyles.tableCell, textAlign: "left" }}>
                  No Items Available
                </Text>
              </View>
            ) : (
              items.map((item, index) => (
                <View key={index} style={ReceiptStyles.tableRow}>
                  <Text style={ReceiptStyles.tableCell}>
                    {item.invoiceNo ?? ""}
                  </Text>
                  <Text style={ReceiptStyles.tableCell}>
                    {formatDate(item.createdOn)}
                  </Text>
                  <Text style={ReceiptStyles.tableCell}>
                    {formatCurrency(item.invoiceTotalAmount)}
                  </Text>
                  <Text style={ReceiptStyles.tableCell}>
                    {formatCurrency(item.receivedAmount)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={{ ...ReceiptStyles.table, borderTop: "none" }}>
            <View style={ReceiptStyles.tableRow}>
              <Text
                style={{
                  ...ReceiptStyles.tableCell,
                  borderRight: "none",
                  flexGrow: 3,
                }}
              >
                Total Paid Amount
              </Text>
              <Text style={{ ...ReceiptStyles.tableCell, borderRight: "none" }}>
                {formatCurrency(paidAmount)}
              </Text>
            </View>
          </View>

          <View style={{ ...ReceiptStyles.table, borderTop: "none" }}>
            <View style={ReceiptStyles.tableRow}>
              <Text
                style={{
                  ...ReceiptStyles.tableCell,
                  borderRight: "none",
                  flexGrow: 3,
                }}
              >
                Outstanding Amount
              </Text>
              <Text style={{ ...ReceiptStyles.tableCell, borderRight: "none" }}>
                {formatCurrency(outstandingAmount)}
              </Text>
            </View>
          </View>

          <Text style={ReceiptStyles.heading}>Terms & Conditions</Text>
          <Text style={ReceiptStyles.points}>
            1. Please be kind enough to issue the cheques for the payment
            regarding this order to the following account.
          </Text>

          <View style={{ marginTop: "8px" }}>
            <Text style={ReceiptStyles.add}>064 - 010 - 21 - 7256</Text>
            <Text style={ReceiptStyles.add}>A L D Ratnakumara</Text>
            <Text style={ReceiptStyles.add}>Hatton National Bank</Text>
            <Text style={ReceiptStyles.add}>Maharagama Branch</Text>
          </View>
          <View style={{ marginTop: "5px" }}>
            <Text style={ReceiptStyles.add}>
              Your concern regarding this is appreciated
            </Text>
            <Text style={ReceiptStyles.add}>Thank You.</Text>
          </View>
          <View style={{ marginTop: "30px" }}>
            <Text style={ReceiptStyles.add}>Yours Faithfully</Text>
            <Text style={ReceiptStyles.add}>Deshitha Rathna Kumara</Text>
          </View>
        </View>
      </Page>
    </Document>
  );

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
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { lg: 700, xs: 400 },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 2,
          }}
        >
          <Grid container>
            <Grid
              item
              xs={12}
              mt={3}
              mb={3}
              display="flex"
              justifyContent="space-between"
            >
              <Box>
                <ShareReports
                  uploadPDF={UploadPDF}
                  item={receipt}
                  type={2}
                  mobile={customer}
                  closeModal={handleClose}
                />
              </Box>
              <Button
                sx={{ ml: 1 }}
                variant="contained"
                color="error"
                onClick={handleClose}
              >
                Close
              </Button>
            </Grid>
            <Grid item xs={12}>
              <PDFViewer width="100%" height={500}>
                {MyDocument}
              </PDFViewer>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
};

export default ReceiptReport;

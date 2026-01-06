import React, { useState } from "react";
import { Document, Page, Text, View, PDFViewer } from "@react-pdf/renderer";
import Box from "@mui/material/Box";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { Grid, IconButton, Tooltip } from "@mui/material";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import ReservationInvoiceStyles from "@/styles/reservation/reservation-invoice";
import { getPaymentMethods } from "@/components/types/types";

export default function ReservationInvoiceView({ invoice }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const formattedAddress = [
    invoice.addressLine1,
    invoice.addressLine2,
    invoice.addressLine3,
  ]
    .filter(Boolean)
    .join(", ");

  const invAmount = invoice.cashAmount
    ? invoice.cashAmount
    : 0 + invoice.bankAmount
    ? invoice.bankAmount
    : 0 + invoice.cardAmount
    ? invoice.cardAmount
    : 0;

  const balanceAmount =
    (invoice.totalPayble ? invoice.totalPayble : 0) - invAmount;

  const MyDocument = (
    <Document>
      <Page size="A6" style={ReservationInvoiceStyles.page}>
        <View style={ReservationInvoiceStyles.section}>
          <View style={{ alignItems: "center", width: "100%" }}>
            <Text style={ReservationInvoiceStyles.title}>Bridal Dream</Text>
            <Text style={ReservationInvoiceStyles.address}>
              No. 76/1, Kassapa Road, Colombo 05
            </Text>
            <Text style={ReservationInvoiceStyles.subtitle}>receipt</Text>
          </View>
          <View style={{ ...ReservationInvoiceStyles.table, marginTop: 5 }}>
            <View style={ReservationInvoiceStyles.tableRow}>
              <Text style={ReservationInvoiceStyles.tableCell}>
                Date {"\n"}
                {formatDate(invoice.paymentDate)}
              </Text>
              <Text style={ReservationInvoiceStyles.tableCell}>
                Receipt No:
              </Text>
              <Text
                style={{
                  ...ReservationInvoiceStyles.tableCell,
                  borderRight: "none",
                }}
              >
                Payment Method:{"\n"}
                {getPaymentMethods(invoice.paymentType)}
              </Text>
            </View>
          </View>
          <View
            style={{
              ...ReservationInvoiceStyles.table,
              borderTop: "none",
              borderRight: "none",
            }}
          >
            <View style={ReservationInvoiceStyles.tableRow}>
              <Text style={ReservationInvoiceStyles.tableCell}>
                Job: {"\n"}
                {invoice.description}
              </Text>
            </View>

            <View style={ReservationInvoiceStyles.tableRow}>
              <Text
                style={{
                  ...ReservationInvoiceStyles.tableCell,
                  borderBottom: "none",
                }}
              >
                Bill To:
              </Text>
            </View>
            <View style={ReservationInvoiceStyles.tableRow}>
              <Text
                style={{
                  ...ReservationInvoiceStyles.tableCell,
                  borderTop: "none",
                  borderBottom: "none",
                }}
              >
                Name: {invoice.customerName}
              </Text>
            </View>
            <View style={ReservationInvoiceStyles.tableRow}>
              <Text
                style={{
                  ...ReservationInvoiceStyles.tableCell,
                  borderTop: "none",
                  borderBottom: "none",
                }}
              >
                NIC: {invoice.nic}
              </Text>
            </View>
            <View style={ReservationInvoiceStyles.tableRow}>
              <Text
                style={{
                  ...ReservationInvoiceStyles.tableCell,
                  borderTop: "none",
                  borderBottom: "none",
                }}
              >
                Address:
                {formattedAddress}
              </Text>
            </View>
            <View style={ReservationInvoiceStyles.tableRow}>
              <Text
                style={{
                  ...ReservationInvoiceStyles.tableCell,
                  borderTop: "none",
                  borderBottom: "none",
                }}
              >
                Institution:
              </Text>
            </View>
            <View style={ReservationInvoiceStyles.tableRow}>
              <Text style={ReservationInvoiceStyles.tableCell}>
                Contacts: {invoice.phoneNumber}
              </Text>
            </View>
          </View>
          <View
            style={{ ...ReservationInvoiceStyles.table, borderTop: "none" }}
          >
            <View style={ReservationInvoiceStyles.tableRow}>
              <Text style={{ ...ReservationInvoiceStyles.tableCell, flex: 7 }}>
                Description
              </Text>
              <Text
                style={{
                  ...ReservationInvoiceStyles.tableCell,
                  flex: 3,
                  borderRight: "none",
                }}
              >
                Amount
              </Text>
            </View>

            <View style={ReservationInvoiceStyles.tableRow}>
              <Text style={{ ...ReservationInvoiceStyles.tableCell, flex: 7 }}>
                Paid
              </Text>
              <Text
                style={{
                  ...ReservationInvoiceStyles.tableCell,
                  flex: 3,
                  borderRight: "none",
                }}
              >
                {formatCurrency(invAmount)}
              </Text>
            </View>
            <View style={ReservationInvoiceStyles.tableRow}>
              <Text style={{ ...ReservationInvoiceStyles.tableCell, flex: 7 }}>
                Grand Total
              </Text>
              <Text
                style={{
                  ...ReservationInvoiceStyles.tableCell,
                  flex: 3,
                  borderRight: "none",
                }}
              >
                {formatCurrency(invoice.totalPayble)}
              </Text>
            </View>
            {/* <View style={ReservationInvoiceStyles.tableRow}>
              <Text style={{ ...ReservationInvoiceStyles.tableCell, flex: 7 }}>
                1<Text style={{ fontSize: 6, verticalAlign: "super" }}>st</Text>{" "}
                Advance Paid
              </Text>

              <Text
                style={{
                  ...ReservationInvoiceStyles.tableCell,
                  flex: 3,
                  borderRight: "none",
                }}
              >
                {formatCurrency(0)}
              </Text>
            </View>
            <View style={ReservationInvoiceStyles.tableRow}>
              <Text style={{ ...ReservationInvoiceStyles.tableCell, flex: 7 }}>
                2<Text style={{ fontSize: 6, verticalAlign: "super" }}>nd</Text>{" "}
                Advance Paid
              </Text>
              <Text
                style={{
                  ...ReservationInvoiceStyles.tableCell,
                  flex: 3,
                  borderRight: "none",
                }}
              >
                {formatCurrency(0)}
              </Text>
            </View> */}
            <View style={ReservationInvoiceStyles.tableRow}>
              <Text style={{ ...ReservationInvoiceStyles.tableCell, flex: 7 }}>
                Balance
              </Text>
              <Text
                style={{
                  ...ReservationInvoiceStyles.tableCell,
                  flex: 3,
                  borderRight: "none",
                }}
              >
                {formatCurrency(balanceAmount < 0 ? 0 : balanceAmount)}
              </Text>
            </View>
          </View>
          <View
            style={{
              ...ReservationInvoiceStyles.table,
              marginTop: 10,
              border: "none",
            }}
          >
            <View style={ReservationInvoiceStyles.tableRow}>
              <Text
                style={{
                  ...ReservationInvoiceStyles.tableCell,
                  border: "none",
                }}
              >
                Received By
              </Text>
              <Text
                style={{
                  ...ReservationInvoiceStyles.tableCell,
                  border: "none",
                  textAlign: "right",
                }}
              >
                Authorized By
              </Text>
            </View>
          </View>
          <View
            style={{
              ...ReservationInvoiceStyles.table,
              marginTop: 5,
              border: "none",
            }}
          >
            <View style={ReservationInvoiceStyles.tableRow}>
              <Text
                style={{
                  ...ReservationInvoiceStyles.tableCell,
                  border: "none",
                  marginTop: 5,
                }}
              >
                ---------------------
              </Text>
              <Text
                style={{
                  ...ReservationInvoiceStyles.tableCell,
                  border: "none",
                  textAlign: "right",
                  marginTop: 5,
                }}
              >
                --------------------
              </Text>
            </View>
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
            width: "auto",
            maxHeight: "90vh",
            overflowY: "auto",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Grid container>
            <Grid
              item
              xs={12}
              mb={3}
              display="flex"
              justifyContent="space-between"
            >
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
              <PDFViewer width={800} height={500}>
                {MyDocument}
              </PDFViewer>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

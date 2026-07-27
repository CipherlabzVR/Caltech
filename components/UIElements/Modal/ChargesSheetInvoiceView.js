import React, { useState } from "react";
import { Document, Page, Text, View, PDFViewer, pdf } from "@react-pdf/renderer";
import Box from "@mui/material/Box";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { Grid } from "@mui/material";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import ChargesInvoiceStyles from "@/styles/reservation/charges-invoice";

export default function ChargesSheetInvoiceView({
  customerName,
  nic,
  mobileNo,
  address,
  categories = [],
  reservationDate,
  advancePaymentDate,
  advancePaidAmount = 0,
  advancePaymentMethod,
  charges = [],
  refunds = [],
  grossTotal = 0,
  netTotal = 0,
  discountPercentage,
  discountValue,
}) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const discountAmount = discountPercentage
    ? (grossTotal * Number(discountPercentage)) / 100
    : Number(discountValue) || 0;

  const isSectionHeader = (row) =>
    row.cost == null && row.qty == null && row.total == null;

  const renderQty = (qty) => {
    const n = Number(qty);
    if (!qty || n === 0 || n === 1) return "";
    return String(qty);
  };

  const MyDocument = (
    <Document>
      <Page size="A4" style={ChargesInvoiceStyles.page}>
        <View style={ChargesInvoiceStyles.dressingRow}>
          <Text style={ChargesInvoiceStyles.dressingText}>
            WD Dressing Time : 11.00pm - 3.30am
          </Text>
          <Text style={ChargesInvoiceStyles.dressingText}>
            HC Dressing Time : 10.00am - 2.30pm
          </Text>
        </View>

        <View style={ChargesInvoiceStyles.outerBorder}>
          <Text style={ChargesInvoiceStyles.invoiceTitle}>INVOICE</Text>

          <View style={ChargesInvoiceStyles.clientBlock}>
            <View style={ChargesInvoiceStyles.clientCol}>
              <Text style={ChargesInvoiceStyles.clientLabel}>CLIENT:</Text>
              <Text style={ChargesInvoiceStyles.clientName}>
                {customerName || "-"}
              </Text>
              {address ? (
                <Text style={ChargesInvoiceStyles.clientAddress}>{address}</Text>
              ) : null}
              <Text style={ChargesInvoiceStyles.clientValue}>
                NIC / Passport No : {nic || "-"}
              </Text>
              <Text style={ChargesInvoiceStyles.clientValue}>
                Contact No : {mobileNo || "-"}
              </Text>
            </View>
            <View style={[ChargesInvoiceStyles.clientCol, ChargesInvoiceStyles.rightCol]}>
              {categories && categories.length > 0 ? (
                <View style={ChargesInvoiceStyles.categoryRow}>
                  {categories.map((category, index) => (
                    <Text style={ChargesInvoiceStyles.categoryBadge} key={index}>
                      {category}
                    </Text>
                  ))}
                </View>
              ) : null}
              <View style={ChargesInvoiceStyles.datesRow}>
                <Text style={ChargesInvoiceStyles.dateLabel}>INVOICE DATE:</Text>
                <Text style={ChargesInvoiceStyles.dateValue}>
                  {formatDate(new Date())}
                </Text>
              </View>
              <View style={ChargesInvoiceStyles.datesRow}>
                <Text style={ChargesInvoiceStyles.dateLabel}>WD DATE:</Text>
                <Text style={ChargesInvoiceStyles.dateValue}>
                  {reservationDate ? formatDate(reservationDate) : "-"}
                </Text>
              </View>
              <View style={ChargesInvoiceStyles.datesRow}>
                <Text style={ChargesInvoiceStyles.dateLabel}>HC DATE:</Text>
                <Text style={ChargesInvoiceStyles.dateValue}>-</Text>
              </View>
            </View>
          </View>

          <View style={ChargesInvoiceStyles.tableHeaderRow}>
            <Text
              style={[ChargesInvoiceStyles.th, ChargesInvoiceStyles.colDesc]}
            >
              CHARGES
            </Text>
            <Text style={[ChargesInvoiceStyles.th, ChargesInvoiceStyles.colQty]}>
              QTY / DES
            </Text>
            <Text
              style={[ChargesInvoiceStyles.th, ChargesInvoiceStyles.colRate]}
            >
              RATE
            </Text>
            <Text
              style={[
                ChargesInvoiceStyles.th,
                ChargesInvoiceStyles.colAmount,
                { borderRightWidth: 0 },
              ]}
            >
              LKR
            </Text>
          </View>

          {charges.map((row, index) => {
            if (isSectionHeader(row)) {
              return (
                <View style={ChargesInvoiceStyles.sectionRow} key={index}>
                  <Text style={ChargesInvoiceStyles.sectionLabel}>
                    {row.label}
                  </Text>
                </View>
              );
            }
            return (
              <View style={ChargesInvoiceStyles.row} key={index}>
                <Text
                  style={[ChargesInvoiceStyles.td, ChargesInvoiceStyles.colDesc]}
                >
                  {row.label}
                </Text>
                <Text
                  style={[ChargesInvoiceStyles.td, ChargesInvoiceStyles.colQty]}
                >
                  {renderQty(row.qty)}
                </Text>
                <Text
                  style={[ChargesInvoiceStyles.td, ChargesInvoiceStyles.colRate]}
                >
                  {row.cost ? formatCurrency(row.cost) : ""}
                </Text>
                <Text
                  style={[
                    ChargesInvoiceStyles.td,
                    ChargesInvoiceStyles.colAmount,
                  ]}
                >
                  {Number(row.total) ? formatCurrency(row.total) : "-"}
                </Text>
              </View>
            );
          })}

          <View style={ChargesInvoiceStyles.summaryBlock}>
            <View style={ChargesInvoiceStyles.summaryRow}>
              <Text style={ChargesInvoiceStyles.summaryLabel}>GRAND TOTAL</Text>
              <Text style={ChargesInvoiceStyles.summaryValue}>
                {formatCurrency(grossTotal)}
              </Text>
            </View>
            <View style={ChargesInvoiceStyles.summaryRow}>
              <View style={ChargesInvoiceStyles.summaryLabelCol}>
                <Text style={ChargesInvoiceStyles.summaryLabel}>
                  ADVANCE PAID
                  {advancePaymentDate ? `  (${formatDate(advancePaymentDate)})` : ""}
                </Text>
                {advancePaymentMethod ? (
                  <Text style={ChargesInvoiceStyles.summaryHint}>
                    Paid via {advancePaymentMethod}
                  </Text>
                ) : null}
              </View>
              <Text style={ChargesInvoiceStyles.summaryValue}>
                ({formatCurrency(advancePaidAmount || 0)})
              </Text>
            </View>
            <View style={ChargesInvoiceStyles.summaryRow}>
              <Text style={ChargesInvoiceStyles.summaryLabel}>DISCOUNT</Text>
              <Text style={ChargesInvoiceStyles.summaryValue}>
                ({formatCurrency(discountAmount)})
              </Text>
            </View>
            <View style={ChargesInvoiceStyles.netTotalRow}>
              <Text style={ChargesInvoiceStyles.netTotalLabel}>NET TOTAL</Text>
              <Text style={ChargesInvoiceStyles.netTotalValue}>
                {formatCurrency(netTotal < 0 ? 0 : netTotal)}
              </Text>
            </View>
          </View>

          {refunds.map((row, index) => (
            <View style={ChargesInvoiceStyles.totalRow} key={`refund-${index}`}>
              <Text style={ChargesInvoiceStyles.totalLabel}>
                (+) REFUNDABLE {row.label?.toUpperCase()} (SHOULD BE BROUGHT IN
                CASH)
              </Text>
              <Text style={ChargesInvoiceStyles.totalValue}>
                {Number(row.value) ? formatCurrency(row.value) : "-"}
              </Text>
            </View>
          ))}
        </View>

        <View style={ChargesInvoiceStyles.footer}>
          <Text style={ChargesInvoiceStyles.footerText}>
            The NET TOTAL should be paid at least 5 days before wedding date.
          </Text>
          <Text style={ChargesInvoiceStyles.footerRed}>
            The REFUNDABLE JEWELLERY OR HAIR EXTENTION DEPOSIT should be brought
            in cash on wedding date.
          </Text>
          <Text style={ChargesInvoiceStyles.footerText}>
            WAITING CHARGES apply during the Going Away period. LKR 15,000 will
            be charged for each additional 30 minutes of delay.
          </Text>
          <Text style={ChargesInvoiceStyles.thankYou}>
            It was so pleased to work with you! Thank You Very Much!
          </Text>
        </View>
      </Page>
    </Document>
  );

  const handleDownloadPDF = async () => {
    const blob = await pdf(MyDocument).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice-${customerName || "Reservation"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button
        variant="outlined"
        color="error"
        startIcon={<PictureAsPdfIcon />}
        onClick={handleOpen}
      >
        Print Invoice (PDF)
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="charges-invoice-title"
        aria-describedby="charges-invoice-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "auto",
            maxHeight: "95vh",
            overflowY: "auto",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 2,
          }}
        >
          <Grid container>
            <Grid
              item
              xs={12}
              mb={2}
              display="flex"
              justifyContent="flex-end"
              gap={1}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadPDF}
              >
                Download PDF
              </Button>
              <Button variant="contained" color="error" onClick={handleClose}>
                Close
              </Button>
            </Grid>
            <Grid item xs={12}>
              <PDFViewer width={800} height={650}>
                {MyDocument}
              </PDFViewer>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

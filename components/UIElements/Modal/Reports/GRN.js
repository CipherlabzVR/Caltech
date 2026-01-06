import React, { useEffect, useState } from "react";
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
import GRNStyles from "../../Styles/grn-print";

const GRNReport = ({ grn }) => {
  const currentDate = new Date().toISOString().split("T")[0];
  const [open, setOpen] = useState(false);
  const [items] = useState(grn.goodReceivedNoteLineDetails);

  const handleClose = () => {
    setOpen(false);
  };

  const UploadPDF = async () => {
    const pdfContent = MyDocument;
    try {
      const blob = await pdf(pdfContent).toBlob();
      const formData = new FormData();
      formData.append("file", blob, `${grn.purchaseOrderNo}.pdf`);
      formData.append("fileName", `${grn.purchaseOrderNo}.pdf`);
      formData.append("storePath", "GoodsReceivedNote");

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
  const MyDocument = (
    <Document>
      <Page size="A4" style={GRNStyles.page}>
        <View style={GRNStyles.section}>
          <Image
            style={GRNStyles.backgroundImage}
            src="/images/quotation/grn.jpg"
          />
          <Text style={GRNStyles.date}>
            Date : {formatDate(currentDate)}
          </Text>
          <Text style={GRNStyles.invoiceNo}>
            GRN No : {grn.documentNo}
          </Text>
          <Text style={GRNStyles.add}>Bill To</Text>
          <Text style={GRNStyles.add}>{grn.supplierName}</Text>
          <Text style={GRNStyles.add}>{""}</Text>
          <Text style={GRNStyles.add}>{""}</Text>
          <Text style={GRNStyles.add}>{""}</Text>

          <View style={{ ...GRNStyles.table, marginTop: 5 }}>
            <View style={GRNStyles.tableRow}>
              <Text
                style={{ ...GRNStyles.tableCell, borderBottom: "none" }}
              >
                Product Code
              </Text>
              <Text
                style={{ ...GRNStyles.tableCell, borderBottom: "none" }}
              >
                Product Name
              </Text>
              <Text
                style={{ ...GRNStyles.tableCell, borderBottom: "none" }}
              >
                Batch
              </Text>
              <Text
                style={{ ...GRNStyles.tableCell, borderBottom: "none" }}
              >
                Exp Date
              </Text>
              <Text
                style={{ ...GRNStyles.tableCell, borderBottom: "none" }}
              >
                Unit Price
              </Text>
              <Text
                style={{ ...GRNStyles.tableCell, borderBottom: "none" }}
              >
                Quantity
              </Text>
              <Text
                style={{ ...GRNStyles.tableCell, borderBottom: "none" }}
              >
                Cost Price
              </Text>
              <Text
                style={{ ...GRNStyles.tableCell, borderBottom: "none" }}
              >
                Selling Price
              </Text>
              <Text
                style={[GRNStyles.lastTableCell, { borderBottom: "none" }]}
              >
                Total
              </Text>
            </View>
          </View>
          <View style={GRNStyles.table}>
            {items.length === 0 ? (
              <View style={GRNStyles.tableRow}>
                <Text
                  style={{ ...GRNStyles.tableCell, textAlign: "left" }}
                >
                  No Items Available
                </Text>
              </View>
            ) : (
              items.map((item, index) => (
                <View key={index} style={GRNStyles.tableRow}>
                  <Text style={GRNStyles.tableCell}>
                    {item.productCode ?? ""}
                  </Text>
                  <Text style={GRNStyles.tableCell}>
                    {item.productName ?? ""}
                  </Text>
                  <Text style={GRNStyles.tableCell}>{item.batch ?? ""}</Text>
                  <Text style={GRNStyles.tableCell}>
                    {formatDate(item.expDate)}
                  </Text>
                  <Text style={GRNStyles.tableCell}>
                    {formatCurrency(item.unitPrice ?? 0)}
                  </Text>
                  <Text style={GRNStyles.tableCell}>
                    {item.qty ?? 0}
                  </Text>
                  <Text style={GRNStyles.tableCell}>
                    {formatCurrency(item.costPrice ?? 0)}
                  </Text>
                  <Text style={GRNStyles.tableCell}>
                    {formatCurrency(item.sellingPrice ?? 0)}
                  </Text>
                  <Text
                    style={{ ...GRNStyles.tableCell, borderRight: "none" }}
                  >
                    {formatCurrency(item.lineTotal ?? 0)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={{ ...GRNStyles.table, borderTop: "none" }}>
            <View style={GRNStyles.tableRow}>
              <Text
                style={{
                  ...GRNStyles.tableCell,
                  borderRight: "none",
                  flexGrow: 8,
                }}
              >
                Gross Total
              </Text>
              <Text
                style={{ ...GRNStyles.tableCell, borderRight: "none" }}
              >
                {formatCurrency(grn.totalAmount)}
              </Text>
            </View>
          </View>

          <Text style={GRNStyles.heading}>Terms & Conditions</Text>
          <Text style={GRNStyles.points}>
            1. Please be kind enough to issue the cheques for the payment
            regarding this order to the following account.
          </Text>

          <View style={{ marginTop: "8px" }}>
            <Text style={GRNStyles.add}>064 - 010 - 21 - 7256</Text>
            <Text style={GRNStyles.add}>A L D Ratnakumara</Text>
            <Text style={GRNStyles.add}>Hatton National Bank</Text>
            <Text style={GRNStyles.add}>Maharagama Branch</Text>
          </View>
          <View style={{ marginTop: "5px" }}>
            <Text style={GRNStyles.add}>
              Your concern regarding this is appreciated
            </Text>
            <Text style={GRNStyles.add}>Thank You.</Text>
          </View>
          <View style={{ marginTop: "30px" }}>
            <Text style={GRNStyles.add}>Yours Faithfully</Text>
            <Text style={GRNStyles.add}>Deshitha Rathna Kumara</Text>
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
                  item={grn}
                  type={1}
                  mobile={grn.supplierMobileNo}
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

export default GRNReport;

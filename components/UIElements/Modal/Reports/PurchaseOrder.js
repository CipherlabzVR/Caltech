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
import PurchaseOrderStyles from "../../Styles/po-print";

const PurchaseOrderReport = ({ purchaseorder }) => {
  const currentDate = new Date().toISOString().split("T")[0];
  const [open, setOpen] = useState(false);
  const [items] = useState(purchaseorder.goodReceivedNoteLineDetails);

  const handleClose = () => {
    setOpen(false);
  };

  const sum = items.reduce((acc, item) => acc + item.poQty, 0);

  const UploadPDF = async () => {
    const pdfContent = MyDocument;
    try {
      const blob = await pdf(pdfContent).toBlob();
      const formData = new FormData();
      formData.append("file", blob, `${purchaseorder.purchaseOrderNo}.pdf`);
      formData.append("fileName", `${purchaseorder.purchaseOrderNo}.pdf`);
      formData.append("storePath", "PurchaseOrder");

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
      <Page size="A4" style={PurchaseOrderStyles.page}>
        <View style={PurchaseOrderStyles.section}>
          <Image
            style={PurchaseOrderStyles.backgroundImage}
            src="/images/quotation/po.jpg"
          />
          <Text style={PurchaseOrderStyles.date}>
            Date : {formatDate(currentDate)}
          </Text>
          <Text style={PurchaseOrderStyles.invoiceNo}>
            PO No : {purchaseorder.purchaseOrderNo}
          </Text>
          <Text style={PurchaseOrderStyles.add}>Bill To</Text>
          <Text style={PurchaseOrderStyles.add}>{purchaseorder.supplierName}</Text>
          <Text style={PurchaseOrderStyles.add}>{""}</Text>
          <Text style={PurchaseOrderStyles.add}>{""}</Text>
          <Text style={PurchaseOrderStyles.add}>{""}</Text>

          <View style={{ ...PurchaseOrderStyles.table, marginTop: 5 }}>
            <View style={PurchaseOrderStyles.tableRow}>
              <Text
                style={{ ...PurchaseOrderStyles.tableCell, borderBottom: "none" }}
              >
                Product Code
              </Text>
              <Text
                style={{ ...PurchaseOrderStyles.tableCell, borderBottom: "none" }}
              >
                Product Name
              </Text>             
              <Text
                style={{ ...PurchaseOrderStyles.tableCell, borderBottom: "none",borderRight: 'none' }}
              >
                Ordered Qty
              </Text>
            </View>
          </View>
          <View style={PurchaseOrderStyles.table}>
            {items.length === 0 ? (
              <View style={PurchaseOrderStyles.tableRow}>
                <Text
                  style={{ ...PurchaseOrderStyles.tableCell, textAlign: "left" }}
                >
                  No Items Available
                </Text>
              </View>
            ) : (
              items.map((item, index) => (
                <View key={index} style={PurchaseOrderStyles.tableRow}>
                  <Text style={PurchaseOrderStyles.tableCell}>
                    {item.productCode ?? ""}
                  </Text>
                  <Text style={PurchaseOrderStyles.tableCell}>
                    {item.productName ?? ""}
                  </Text>
                  <Text style={{...PurchaseOrderStyles.tableCell,borderRight: 'none'}}>
                    {item.poQty ?? 0}
                  </Text>

                </View>
              ))
            )}
          </View>
          <View style={{ ...PurchaseOrderStyles.table, borderTop: "none" }}>
            <View style={PurchaseOrderStyles.tableRow}>
              <Text
                style={{
                  ...PurchaseOrderStyles.tableCell,
                  borderRight: "none",
                }}
              >
                Total Products : {items.length}
              </Text>
              <Text style={{ ...PurchaseOrderStyles.tableCell, borderRight: "none" }}>
                Total Qty
              </Text>
              <Text style={{ ...PurchaseOrderStyles.tableCell, borderRight: "none" }}>
                {sum}
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
                  item={purchaseorder}
                  type={1}
                  mobile={purchaseorder.supplierMobileNo}
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

export default PurchaseOrderReport;

import React, { useEffect, useState } from "react";
import ShipmentStyles from "../../Styles/shipment-print";
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

const CreditNoteReport = ({ note }) => {
  const currentDate = new Date().toISOString().split("T")[0];
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const UploadPDF = async () => {
    const pdfContent = MyDocument;
    try {
      const blob = await pdf(pdfContent).toBlob();
      const formData = new FormData();
      formData.append("file", blob, `${note.documentNo}.pdf`);
      formData.append("fileName", `${note.documentNo}.pdf`);
      formData.append("storePath", "CreditNote");

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
      <Page size="A4" style={ShipmentStyles.page}>
        <View style={ShipmentStyles.section}>
          <Image
            style={ShipmentStyles.backgroundImage}
            src="/images/quotation/ccn.jpg"
          />
          <Text style={ShipmentStyles.date}>
            Date : {formatDate(currentDate)}
          </Text>
          <Text style={ShipmentStyles.invoiceNo}>
            Document No : {note.documentNo}
          </Text>
          <Text style={ShipmentStyles.add}>Bill To</Text>
          <Text style={ShipmentStyles.add}>{note.customerName}</Text>
          <Text style={ShipmentStyles.add}>{note.customerAddressLine1}</Text>
          <Text style={ShipmentStyles.add}>{note.customerAddressLine2}</Text>
          <Text style={ShipmentStyles.add}>{note.customerAddressLine3}</Text>

          <View style={{ ...ShipmentStyles.table, marginTop: 5 }}>
            <View style={ShipmentStyles.tableRow}>
              <Text
                style={{ ...ShipmentStyles.tableCell, borderBottom: "none" }}
              >
                Date
              </Text>
              <Text
                style={{ ...ShipmentStyles.tableCell, borderBottom: "none" }}
              >
                Invoice No.
              </Text> 
              <Text
                style={{ ...ShipmentStyles.tableCell, borderBottom: "none" }}
              >
                Sales Person
              </Text>
              
              <Text
                style={{ ...ShipmentStyles.tableCell, borderBottom: "none" }}
              >
                Credit Amount
              </Text>
            </View>
          </View>
          <View style={ShipmentStyles.table}>
            
                <View style={ShipmentStyles.tableRow}>
                  <Text style={ShipmentStyles.tableCell}>
                  {formatDate(note.date)}
                  </Text>
                  <Text style={ShipmentStyles.tableCell}>
                    {note.invoiceNumber ?? ""}
                  </Text>
                  
                  <Text style={ShipmentStyles.tableCell}>
                    {note.salesPersonCode ?? ""} - {note.salesPersonName ?? ""}
                  </Text>
                  <Text style={ShipmentStyles.tableCell}>
                    {formatCurrency(note.creditAmount)}
                  </Text>
                </View>
          </View>

          <Text style={ShipmentStyles.heading}>Terms & Conditions</Text>
          <Text style={ShipmentStyles.points}>
            1. Please be kind enough to issue the cheques for the payment
            regarding this order to the following account.
          </Text>

          <View style={{ marginTop: "8px" }}>
            <Text style={ShipmentStyles.add}>064 - 010 - 21 - 7256</Text>
            <Text style={ShipmentStyles.add}>A L D Ratnakumara</Text>
            <Text style={ShipmentStyles.add}>Hatton National Bank</Text>
            <Text style={ShipmentStyles.add}>Maharagama Branch</Text>
          </View>
          <View style={{ marginTop: "5px" }}>
            <Text style={ShipmentStyles.add}>
              Your concern regarding this is appreciated
            </Text>
            <Text style={ShipmentStyles.add}>Thank You.</Text>
          </View>
          <View style={{ marginTop: "30px" }}>
            <Text style={ShipmentStyles.add}>Yours Faithfully</Text>
            <Text style={ShipmentStyles.add}>Deshitha Rathna Kumara</Text>
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
                  item={note}
                  type={5}
                  mobile={note.supplierMobileNo}
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

export default CreditNoteReport;

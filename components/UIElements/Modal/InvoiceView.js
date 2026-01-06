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
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { Card, Grid, IconButton, Tooltip, Typography } from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import { formatCurrency } from "@/components/utils/formatHelper";
import useApi from "@/components/utils/useApi";
import InvoiceStyles from "../Styles/invoice-print";
import { InvoiceDocumentURL } from "Base/document";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 400, xs: 300 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

export default function InvoiceView({
  from,
  isDisabled,
  invoice,
  fetchItems,
  onCloseModal,
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(invoice.invoiceLineDetails);
  const [openShare, setOpenShare] = useState(false);
  const [unitTotal, setUnitTotal] = useState(null);
  const [subTotal, setSubTotal] = useState(null);
  const [customer, setCustomer] = useState({});
  const [pdfShareURL, setPdfShareURL] = useState("");
  const handleClose = () => {
    setOpen(false);
    fetchItems();
    if (onCloseModal) onCloseModal();
  };

  const currentDate = new Date().toISOString().split("T")[0];
  const [selectedCard, setSelectedCard] = useState(0);
  const {
    data: customerData,
    loading: Loading,
    error: Error,
  } = useApi(
    `/Customer/GetCustomerDetailByID?customerId=${invoice.customerID}`
  );

  const handleOpen = () => {
    setOpen(true);
    try {
      const response = fetch(`${BASE_URL}/SalesInvoice/UpdateInvoicePayment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Id: invoice.id,
          PaymentAmount: 0,
          Balance: 0,
          IsPaid: true,
        }),
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleShareOpen = () => {
    setOpenShare(true);
    UploadPDF();
  };

  useEffect(() => {
    if (customerData) {
      setCustomer(customerData.result[0]);
    }
    const getUnitTotal = invoice.invoiceLineDetails.reduce(
      (total, item) => total + (item?.unitPrice || 0),
      0
    );

    const getSubTotal = invoice.invoiceLineDetails.reduce(
      (total, item) => total + (item?.lineTotal || 0),
      0
    );

    setUnitTotal(getUnitTotal);
    setSubTotal(getSubTotal);
  }, [customerData]);

  const handleShareClose = () => setOpenShare(false);

  const UploadPDF = async () => {
    const pdfContent = MyDocument;
    try {
      const blob = await pdf(pdfContent).toBlob();
      const formData = new FormData();
      formData.append("file", blob, `${invoice.documentNo}.pdf`);
      formData.append("fileName", `${invoice.documentNo}.pdf`);
      formData.append("storePath", "Salesinvoice");

      const response = await fetch(`${BASE_URL}/AWS/DocumentUploadCommon`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      setPdfShareURL(response.url);
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  };

  const handleCardClick = (id) => {
    setSelectedCard(id);
  };

  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: "numeric", month: "long", year: "numeric" };
    return date.toLocaleDateString("en-GB", options);
  }

  const handleShareNow = async () => {
    const phoneNumber = customer.customerContactDetails[0].contactNo;
    const formattedPhoneNumber = phoneNumber.replace(/^0/, "94");
    const documentUrl = `${InvoiceDocumentURL}/${invoice.documentNo}.pdf`;
    const message = "Check This Out";

    if (selectedCard === 0) {
      try {
        const apiUrl = `https://api.textmebot.com/send.php?recipient=${formattedPhoneNumber}&apikey=781LrdZkpdLh&document=${encodeURIComponent(
          documentUrl
        )}&text=${message}`;
        const response = await fetch(apiUrl, {
          method: "GET",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
        });
        toast.success("Document sent successfully!");
        setOpen(false);
        setOpenShare(false);
        if (onCloseModal) onCloseModal();
      } catch (error) {
        toast.error("An error occurred while sending the document.");
      }
    } else if (selectedCard === 1) {
    } else {
      toast.info("Please Select Option");
    }
  };

  const gross = items.reduce((acc, item) => acc + item.lineTotal, 0);

  const MyDocument = (
    <Document>
      <Page size="A4" style={InvoiceStyles.page}>
        <View style={InvoiceStyles.section}>
          <Image
            style={InvoiceStyles.backgroundImage}
            src="/images/quotation/invoice.jpg"
          />
          <Text style={InvoiceStyles.date}>
            Date : {formatDate(currentDate)}
          </Text>
          <Text style={InvoiceStyles.invoiceNo}>
            Invoice Number : {invoice.documentNo}
          </Text>
          <Text style={InvoiceStyles.add}>Bill To</Text>
          <Text style={InvoiceStyles.add}>
            {customer && (`${customer.title || ""}${customer.title ? " " : ""}${
              customer.firstName || ""
            }${customer.firstName ? " " : ""}${customer.lastName || ""}`)}
          </Text>
          <Text style={InvoiceStyles.add}>{invoice.billToline1 || ""}</Text>
          <Text style={InvoiceStyles.add}>{invoice.billToline2 || ""}</Text>
          <Text style={InvoiceStyles.add}>{invoice.billToline3 || ""}</Text>

          <View style={{ ...InvoiceStyles.table, marginTop: 5 }}>
            <View style={InvoiceStyles.tableRow}>
              <Text
                style={{ ...InvoiceStyles.tableCell, borderBottom: "none" }}
              >
                Quantity
              </Text>
              <Text
                style={{ ...InvoiceStyles.tableCell, borderBottom: "none" }}
              >
                Description
              </Text>
              <Text
                style={{ ...InvoiceStyles.tableCell, borderBottom: "none" }}
              >
                Unit Price (LKR)
              </Text>
              <Text
                style={[InvoiceStyles.lastTableCell, { borderBottom: "none" }]}
              >
                Amount (Rs)
              </Text>
            </View>
          </View>
          <View style={InvoiceStyles.table}>
            {items.length === 0 ? (
              <View style={InvoiceStyles.tableRow}>
                <Text style={{ ...InvoiceStyles.tableCell, textAlign: "left" }}>
                  No Items Available
                </Text>
              </View>
            ) : (
              items.map((item, index) => (
                <View key={index} style={InvoiceStyles.tableRow}>
                  <Text style={InvoiceStyles.tableCell}>{item.qty ?? ""}</Text>
                  <Text style={InvoiceStyles.tableCell}>
                    {item.productName ?? ""}
                  </Text>
                  <Text style={InvoiceStyles.tableCell}>
                    {formatCurrency(item.unitPrice ?? 0)}
                  </Text>
                  <Text
                    style={{ ...InvoiceStyles.tableCell, borderRight: "none" }}
                  >
                    {formatCurrency(item.lineTotal ?? 0)}
                  </Text>
                </View>
              ))
            )}
            <View style={InvoiceStyles.tableRow}>
              <Text style={{...InvoiceStyles.tableCell, flexGrow: 3,borderRight: "none"}}>Gross Total</Text>
              <Text style={{ ...InvoiceStyles.tableCell, borderLeft: 'none',borderRight: "none" }}>
                {formatCurrency(gross)}
              </Text>
            </View>
          </View>

          <Text style={InvoiceStyles.heading}>Terms & Conditions</Text>
          <Text style={InvoiceStyles.points}>
            1. Please be kind enough to issue the cheques for the payment
            regarding this order to the following account.
          </Text>

          <View style={{ marginTop: "8px" }}>
            <Text style={InvoiceStyles.add}>064 - 010 - 21 - 7256</Text>
            <Text style={InvoiceStyles.add}>A L D Ratnakumara</Text>
            <Text style={InvoiceStyles.add}>Hatton National Bank</Text>
            <Text style={InvoiceStyles.add}>Maharagama Branch</Text>
          </View>
          <View style={{ marginTop: "5px" }}>
            <Text style={InvoiceStyles.add}>
              Your concern regarding this is appreciated
            </Text>
            <Text style={InvoiceStyles.add}>Thank You.</Text>
          </View>
          <View style={{ marginTop: "30px" }}>
            <Text style={InvoiceStyles.add}>Yours Faithfully</Text>
            <Text style={InvoiceStyles.add}>Deshitha Rathna Kumara</Text>
          </View>
        </View>
      </Page>
    </Document>
  );

  return (
    <>
      {from === 1 ? (
        <Tooltip title="Print" placement="top">
          <IconButton onClick={handleOpen} aria-label="print" size="small">
            <LocalPrintshopIcon color="primary" fontSize="inherit" />
          </IconButton>
        </Tooltip>
      ) : (
        <Button
          variant="contained"
          color="primary"
          disabled={isDisabled}
          onClick={handleOpen}
        >
          Next
        </Button>
      )}

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
            p: 4,
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
                <Button
                  variant="outlined"
                  sx={{ ml: 1 }}
                  onClick={handleShareOpen}
                >
                  <ShareIcon sx={{ mr: 3 }} /> Share
                </Button>
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

      <Modal
        open={openShare}
        onClose={handleShareClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Grid container>
            <Grid item xs={12} mt={2}>
              <Typography
                as="h4"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  mb: "12px",
                }}
              >
                Share On
              </Typography>
            </Grid>
            <Grid item xs={6} mt={2}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  width: "100px",
                  height: "100px",
                  backgroundImage: `url('/images/quotation/w.png')`,
                  position: "relative",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border:
                    selectedCard === 0
                      ? "3px solid #757fef"
                      : "1px solid #e5e5e5",
                  cursor: "pointer",
                }}
                onClick={() => handleCardClick(0)}
              ></Card>
            </Grid>
            {/*<Grid item xs={6} mt={2}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  width: "100px",
                  height: "100px",
                  backgroundImage: `url('/images/quotation/e.jpg')`,
                  position: "relative",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border:
                    selectedCard === 1
                      ? "3px solid #757fef"
                      : "1px solid #e5e5e5",
                  cursor: "pointer",
                }}
                onClick={() => handleCardClick(1)}
              ></Card>
            </Grid>
            <Grid item xs={4} mt={2}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  width: "100px",
                  height: "100px",
                  backgroundImage: `url('/images/quotation/m.jpg')`,
                  position: "relative",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border:
                    selectedCard === 2
                      ? "3px solid #757fef"
                      : "1px solid #e5e5e5",
                  cursor: "pointer",
                }}
                onClick={() => handleCardClick(2)}
              ></Card>
            </Grid> */}
            <Grid item xs={12} mt={2}>
              <Button onClick={handleShareNow} variant="outlined">
                Share Now
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

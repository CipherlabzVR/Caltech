import React, { useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  Image,
} from "@react-pdf/renderer";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { Card, Grid, Typography } from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: "#E4E4E4",
    position: "relative",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    top: 0,
    position: "absolute",
    zIndex: -1,
  },
  sign: {
    width: "150px",
    height: "70px",
    bottom: "200px",
    position: "absolute",
    zIndex: -1,
    left: "35px",
  },
  section: {
    margin: 10,
    flexGrow: 1,
    border: "1px solid black",
  },
  title: {
    fontSize: "25px",
    marginBottom: "10px",
    marginTop: "135px",
    marginLeft: "220px",
    textTransform: "uppercase",
  },
  date: {
    fontSize: "12px",
    marginBottom: "20px",
    marginTop: "10px",
    marginLeft: "40px",
  },
  invoiceNo: {
    fontSize: "12px",
    marginBottom: "20px",
    marginTop: "-30px",
    marginLeft: "350px",
  },
  addDesi: {
    fontSize: "12px",
    marginBottom: "5px",
    marginLeft: "40px",
  },
  add: {
    fontSize: "12px",
    marginBottom: "5px",
    marginLeft: "40px",
  },
  tablecell: {
    fontSize: "12px",
    border: "1px solid black",
    padding: "3px",
    paddingHorizontal: "10px",
    borderRight: "none",
  },
  tablecellAmount: {
    fontSize: "12px",
    border: "1px solid black",
    padding: "3px",
    paddingHorizontal: "10px",
  },
  tablecell2: {
    fontSize: "12px",
    border: "1px solid black",
    padding: "3px",
    paddingHorizontal: "10px",
    borderTop: "none",
    borderRight: "none",
  },
  tablecell6: {
    fontSize: "12px",
    border: "1px solid black",
    padding: "3px",
    paddingHorizontal: "10px",
    borderTop: "none",
  },
  tablecellempty: {
    fontSize: "12px",
    border: "1px solid black",
    padding: "9.6px",
    borderTop: "none",
    borderRight: "none",
  },
  tablecell3: {
    fontSize: "12px",
    border: "1px solid black",
    padding: "3px",
    paddingHorizontal: "10px",
    borderTop: "none",
    borderRight: "none",
  },
  tablecell5: {
    fontSize: "12px",
    border: "1px solid black",
    padding: "9.6px",
    borderTop: "none",
    borderLeft: "none",
    borderRight: "none",
  },
  contact: {
    fontSize: "10px",
    border: "1px solid gray",
    padding: "5px",
  },
  heading: {
    fontSize: "12px",
    fontWeight: "bold",
    marginTop: "15px",
    marginBottom: "15px",
    marginLeft: "40px",
  },
  points: {
    fontSize: "12px",
    marginLeft: "20px",
    marginBottom: "8px",
    marginLeft: "40px",
    marginRight: "85px",
  },
});

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

export default function ViewInvoice({ advance, full }) {
  const [open, setOpen] = useState(false);
  const [openShare, setOpenShare] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const currentDate = new Date().toISOString().split("T")[0];
  const [selectedCard, setSelectedCard] = useState(0);

  const handleShareOpen = () => {
    setOpenShare(true);
  };
  const handleShareClose = () => setOpenShare(false);

  const handleCardClick = (id) => {
    setSelectedCard(id);
  };

  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: "numeric", month: "long", year: "numeric" };
    return date.toLocaleDateString("en-GB", options);
  }

  const MyDocument = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Image
            style={styles.backgroundImage}
            src="/images/quotation/invoice.jpg"
          />
          <Text style={styles.title}>Invoice</Text>
          <Text style={styles.date}>Date : {formatDate(currentDate)}</Text>
          <Text style={styles.invoiceNo}>Invoice Number : 1245</Text>
          <Text style={styles.add}>Client : Mr. Buyan Malintha</Text>
          <View
            style={{
              flexDirection: "row",
              marginTop: "10px",
              marginLeft: "40px",
              marginRight: "85px",
            }}
          >
            <View style={{ flexGrow: 1 }}>
              <Text style={styles.tablecell}>Quantity</Text>
              <Text style={styles.tablecell2}>50</Text>
              <Text style={styles.tablecellempty}></Text>
              <Text style={styles.tablecellempty}></Text>
              <Text style={styles.tablecellempty}></Text>
            </View>
            <View style={{ flexGrow: 1 }}>
              <Text style={styles.tablecell}>Item</Text>
              <Text style={styles.tablecell2}>T-Shirt</Text>
              <Text style={styles.tablecell3}>Total</Text>
              <Text style={styles.tablecell3}>
                {advance ? "Advance Payment" : "Full Payment"}
              </Text>
              <Text style={styles.tablecell3}>Balance Payment</Text>
            </View>
            <View style={{ flexGrow: 1 }}>
              <Text style={styles.tablecell}>Unit Price (LKR)</Text>
              <Text style={styles.tablecell2}>1000</Text>
              <Text style={styles.tablecell5}></Text>
              <Text style={styles.tablecell5}></Text>
              <Text style={styles.tablecell5}></Text>
            </View>
            <View style={{ flexGrow: 1 }}>
              <Text style={styles.tablecellAmount}>Amount (Rs)</Text>
              <Text style={styles.tablecell6}>{full}</Text>
              <Text style={styles.tablecell6}>{full}</Text>
              <Text style={styles.tablecell6}>
                ({advance ? advance : full})
              </Text>
              <Text style={styles.tablecell6}>
                {isNaN(parseInt(full) - parseInt(advance))
                  ? "0"
                  : parseInt(full) - parseInt(advance)}
              </Text>
            </View>
          </View>

          <Text style={styles.heading}>Terms & Conditions</Text>
          <Text style={styles.points}>
            1. Please be kind enough to issue the cheques for the payment
            regarding this order to the following account.
          </Text>

          <View style={{ marginTop: "10px" }}>
            <Text style={styles.add}>Tailor Made apparels,</Text>
            <Text style={styles.add}>200010000964,</Text>
            <Text style={styles.add}>Hatton National Bank ,</Text>
            <Text style={styles.add}>Hakmana Branch.</Text>
          </View>
          <View style={{ marginTop: "10px" }}>
            <Text style={styles.add}>
              Your concern regarding this is highly appreciated.
            </Text>
            <Text style={styles.add}>Thank You.</Text>
          </View>
          <Image style={styles.sign} src="/images/quotation/sign2.png" />
          <View style={{ marginTop: "55px" }}>
            <Text style={styles.add}>Yours Faithfully</Text>
            <Text style={styles.add}>Deshitha R Kumara</Text>
          </View>
        </View>
      </Page>
    </Document>
  );

  return (
    <>
      <Button fullWidth onClick={handleOpen} variant="contained">
        Generate Invoice
      </Button>

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
                <Button variant="outlined" sx={{ ml: 1 }}>
                  Save Invoice
                </Button>
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
              <PDFViewer width={800} height={500}>
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
            <Grid item xs={4} mt={2}>
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
            <Grid item xs={4} mt={2}>
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
            </Grid>
            <Grid item xs={12} mt={2}>
              <Button variant="outlined">Share Now</Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

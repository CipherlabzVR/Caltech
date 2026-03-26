import React, { useEffect, useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  Image,
  pdf,
} from "@react-pdf/renderer";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { Grid, Typography, IconButton, Tooltip, Card } from "@mui/material";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import ShareIcon from "@mui/icons-material/Share";
import BASE_URL from "Base/api";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";

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
    width: "120px",
    height: "55px",
    marginLeft: "40px",
    marginBottom: "10px",
  },
  section: {
    margin: 10,
    flexGrow: 1,
    border: "1px solid black",
  },
  title: {
    fontSize: "16px",
    marginBottom: "5px",
    marginTop: "140px",
    marginLeft: "220px",
    fontWeight: 700,
  },
  dateDocRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    marginTop: "5px",
    marginLeft: "40px",
    marginRight: "100px",
    paddingRight: 0,
  },
  date: {
    fontSize: "11px",
  },
  documentNo: {
    fontSize: "11px",
  },
  invoiceNo: {
    fontSize: "11px",
    marginBottom: "8px",
    marginTop: "-25px",
    right: "100px",
    position: "absolute",
  },
  addDesi: {
    fontSize: "11px",
    marginBottom: "2px",
    marginLeft: "40px",
  },
  add: {
    fontSize: "11px",
    marginBottom: "2px",
    marginLeft: "40px",
  },
  tableContainer: {
    border: "1px solid black",
  },
  tableRow: {
    flexDirection: "row",
    minHeight: "18px",
  },
  tableHeaderRow: {
    flexDirection: "row",
    minHeight: "18px",
    borderBottom: "1px solid black",
  },
  tablecell: {
    fontSize: "10px",
    padding: "3px",
    borderRight: "1px solid black",
    justifyContent: "center",
  },
  tablecellLast: {
    fontSize: "10px",
    padding: "3px",
    justifyContent: "center",
  },
  tablecell2: {
    fontSize: "10px",
    padding: "3px",
    borderRight: "1px solid black",
    borderBottom: "1px solid black",
    justifyContent: "center",
  },
  tablecell2Last: {
    fontSize: "10px",
    padding: "3px",
    borderBottom: "1px solid black",
    justifyContent: "center",
  },
  heading: {
    fontSize: "11px",
    fontWeight: "bold",
    marginTop: "15px",
    marginBottom: "5px",
    marginLeft: "40px",
  },
  points: {
    fontSize: "10px",
    marginLeft: "40px",
    marginBottom: "3px",
    marginRight: "85px",
  },
  pointsContainer: {
    flexDirection: "row",
    marginLeft: "40px",
    marginRight: "85px",
    marginBottom: "3px",
  },
  pointNumber: {
    fontSize: "10px",
    fontWeight: "bold",
    width: "20px",
    flexShrink: 0,
  },
  pointText: {
    fontSize: "10px",
    flex: 1,
  },
  quotationSeparator: {
    marginTop: "10px",
    marginBottom: "8px",
    borderTop: "1px solid #ccc",
    paddingTop: "8px",
  },
});

function formatNumberWithSeparator(value) {
  if (value === null || value === undefined) return "0.00";
  const num = Number(value);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatQuantity(value) {
  if (value === null || value === undefined) return "0";
  const num = Number(value);
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getCategoryName(windowType, categories) {
  if (!windowType || windowType === 0) return "Item";
  
  // First try to get from categories if available
  if (categories && categories.length > 0) {
    const category = categories.find(cat => 
      (cat.id === windowType || cat.Id === windowType || cat.ID === windowType)
    );
    if (category) {
      return category.name || category.Name || getWindowTypeName(windowType);
    }
  }
  
  // Fallback to hardcoded mapping (same as ViewQuotation.js)
  return getWindowTypeName(windowType);
}

function getWindowTypeName(windowType) {
  switch (windowType) {
    case 1:
      return "T-Shirt";
    case 2:
      return "Shirt";
    case 3:
      return "Cap";
    case 4:
      return "Visor";
    case 5:
      return "Hat";
    case 6:
      return "Bag";
    case 7:
      return "Bottom";
    case 8:
      return "Short";
    default:
      return "Item";
  }
}

// Get embellishment name from type (all uppercase)
function getEmbellishmentName(type) {
  switch (type) {
    case 1:
      return "EMBROIDER";
    case 2:
      return "SUBLIMATION";
    case 3:
      return "SCREEN PRINT";
    case 4:
      return "DTF";
    default:
      return "";
  }
}

// Format multiple embellishments as numbered list (1. EMBROIDER\n2. SUBLIMATION)
function formatEmbellishments(types) {
  if (!types || types.length === 0) return "-";
  // Return numbered list with embellishment names
  return types
    .sort((a, b) => a - b)
    .map((type, index) => `${index + 1}. ${getEmbellishmentName(type)}`)
    .join("\n");
}

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

function formatDateTime(date) {
  const pad = (n) => n.toString().padStart(2, "0");
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

const ProformaInvoiceReport = ({ proformaInvoice, onShareSuccess }) => {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [quotationsWithDetails, setQuotationsWithDetails] = useState([]);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareURL, setShareURL] = useState("");
  const [saving, setSaving] = useState(false);
  const [openShare, setOpenShare] = useState(false);
  const [selectedCard, setSelectedCard] = useState(0);
  const [whatsappNo, setWhatsappNo] = useState("");
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const handleShareClose = () => setOpenShare(false);
  const { data: IsShareWhatsAppAPIThrough } = IsAppSettingEnabled("IsShareWhatsAppAPIThrough");

  useEffect(() => {
    if (proformaInvoice && proformaInvoice.inquiryId) {
      fetchQuotations();
      fetchCustomerDetails();
      fetchCategories();
    }
  }, [proformaInvoice]);

  // Fetch quotation details when categories are loaded and quotations are available
  useEffect(() => {
    if (categories.length > 0 && quotations.length > 0 && quotationsWithDetails.length === 0) {
      fetchQuotationDetails(quotations);
    }
  }, [categories, quotations]);

  console.log(quotationsWithDetails);
  
  const fetchQuotations = async () => {
    try {
      // Try multiple statuses to get all confirmed quotations for this proforma invoice
      // Status 10 = ProformaInvoiceCreated, Status 12 = ProformaInvoiceProcessing, Status 2 = QuotationConfirmed
      const statusesToTry = [10, 12, 2];
      let allQuotations = [];

      for (const status of statusesToTry) {
        const response = await fetch(
          `${BASE_URL}/Inquiry/GetAllQuotationsByInquiryIdAndStatus?status=${status}&inquiryId=${proformaInvoice.inquiryId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const items = data.result || [];
          allQuotations = [...allQuotations, ...items];
        }
      }

      // Remove duplicates based on ID
      const uniqueQuotations = allQuotations.filter(
        (quotation, index, self) => index === self.findIndex((q) => q.id === quotation.id)
      );

      setQuotations(uniqueQuotations);
      
      // Wait for categories to load, then fetch quotation details
      if (categories.length > 0) {
        await fetchQuotationDetails(uniqueQuotations);
      } else {
        // If categories not loaded yet, wait a bit and try again
        setTimeout(async () => {
          await fetchQuotationDetails(uniqueQuotations);
        }, 500);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryCategory/GetAllInquiryCategory`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Check different possible response structures
        let categoriesList = [];
        if (data.result && data.result.result) {
          categoriesList = data.result.result;
        } else if (data.result && Array.isArray(data.result)) {
          categoriesList = data.result;
        } else if (Array.isArray(data)) {
          categoriesList = data;
        }
        setCategories(categoriesList);
        
        // If quotations are already loaded, fetch details now
        if (quotations.length > 0) {
          await fetchQuotationDetails(quotations);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchQuotationDetails = async (quotations) => {
    try {
      const quotationsWithDetails = await Promise.all(
        quotations.map(async (quotation) => {
          const inquiryId = quotation.inquiryId || quotation.InquiryId;
          const optionId = quotation.optionId || quotation.OptionId;
          
          // windowType is not in SentQuotations, we need to fetch it from InquiryOption
          let windowType = 0;
          let material = "-";
          let embellishments = "-";
          
          if (inquiryId && optionId) {
            try {
              // Fetch inquiry details to get windowType and fabric list
              const inquiryResponse = await fetch(
                `${BASE_URL}/Inquiry/GetInquiryByInquiryId?id=${inquiryId}&optId=${optionId}`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              
              if (inquiryResponse.ok) {
                const inquiryData = await inquiryResponse.json();
                if (inquiryData.result) {
                  const result = inquiryData.result;
                  // API returns WindowType at top level of InquiryResponse (camelCase or PascalCase)
                  const raw = result.windowType ?? result.WindowType ?? result.inquiryOption?.windowType ?? result.inquiryOption?.WindowType ?? 0;
                  windowType = typeof raw === "number" ? raw : (parseInt(raw, 10) || 0);
                  // Get material from fabric list if available in response
                  if (result.fabricList && Array.isArray(result.fabricList) && result.fabricList.length > 0) {
                    const fabricNames = [...new Set(result.fabricList.map(f => f.fabricName || f.FabricName).filter(Boolean))];
                    material = fabricNames.length > 0 ? fabricNames.join(", ") : "-";
                  }
                }
              }
            } catch (error) {
              console.error("Error fetching inquiry details:", error);
            }
            
            // Fetch embellishments from documents
            if (windowType > 0) {
              try {
                const docResponse = await fetch(
                  `${BASE_URL}/AWS/GetAllDocumentsByOption?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                      "Content-Type": "application/json",
                    },
                  }
                );
                if (docResponse.ok) {
                  const docData = await docResponse.json();
                  let docList = [];
                  if (docData.result && Array.isArray(docData.result)) {
                    docList = docData.result;
                  } else if (Array.isArray(docData)) {
                    docList = docData;
                  }
                  
                  if (docList.length > 0) {
                    const excluded = [5, 6, 7];
                    const filteredDocs = docList.filter(
                      (item) => item.documentSubContentType && !excluded.includes(item.documentSubContentType)
                    );
                    const uniqueTypes = [...new Set(filteredDocs.map(item => item.documentSubContentType).filter(Boolean))];
                    embellishments = formatEmbellishments(uniqueTypes);
                  }
                }
              } catch (error) {
                console.error("Error fetching embellishments:", error);
              }
            }
            
            // If material not found from inquiry, try fetching from fabric API
            if (material === "-" && windowType > 0) {
              try {
                const fabricResponse = await fetch(
                  `${BASE_URL}/Inquiry/GetAllInquiryFabric?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                      "Content-Type": "application/json",
                    },
                  }
                );
                if (fabricResponse.ok) {
                  const fabricData = await fabricResponse.json();
                  let fabricList = [];
                  if (fabricData.result && Array.isArray(fabricData.result)) {
                    fabricList = fabricData.result;
                  } else if (Array.isArray(fabricData)) {
                    fabricList = fabricData;
                  }
                  
                  if (fabricList.length > 0) {
                    const fabricNames = [...new Set(fabricList.map(f => f.fabricName || f.FabricName).filter(Boolean))];
                    material = fabricNames.length > 0 ? fabricNames.join(", ") : "-";
                  }
                }
              } catch (error) {
                console.error("Error fetching fabric:", error);
              }
            }
          }

          return {
            ...quotation,
            windowType: windowType, // Store windowType for category lookup
            material,
            embellishments,
          };
        })
      );

      setQuotationsWithDetails(quotationsWithDetails);
    } catch (error) {
      console.error("Error fetching quotation details:", error);
      // Fallback to original quotations if details fetch fails
      setQuotationsWithDetails(quotations);
    }
  };

  const fetchCustomerDetails = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Customer/GetCustomerDetailByID?customerId=${proformaInvoice.customerId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.result && data.result.result && data.result.result.length > 0) {
          const customer = data.result.result[0];
          setCustomerDetails(customer);
          
          // Get WhatsApp number from customer contact details
          if (customer.customerContactDetails && customer.customerContactDetails.length > 0) {
            let oldNumber = customer.customerContactDetails[0].contactNo;
            let newNumber = "+94" + oldNumber.slice(1);
            setWhatsappNo(newNumber);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleCardClick = (id) => {
    setSelectedCard(id);
  };

  const handleOpenWhatsappTemp = (documentUrl) => {
    const encodedMessage = encodeURIComponent(`${documentUrl}`);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const handleShareNow = async () => {
    setLoading(true);
    const url = shareURL;
    if (!url || typeof url !== "string") {
      console.log("Invalid URL");
      setLoading(false);
      return;
    }

    if (selectedCard == 0) {
      const phoneNumber = whatsappNo || proformaInvoice.sentWhatsappNumber || proformaInvoice.customerContactNo;
      if (!phoneNumber) {
        toast.info("Customer Contact Number Not Available");
        setLoading(false);
        return;
      }

      if (IsShareWhatsAppAPIThrough) {
        try {
          const apiUrl = `https://api.textmebot.com/send.php?recipient=${phoneNumber}&apikey=781LrdZkpdLh&document=${encodeURIComponent(url)}`;
          const response = await fetch(apiUrl, {
            method: "GET",
            mode: 'no-cors',
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          });
        } catch (error) {
          console.error("Error sending document:", error);
        }
        toast.success("Document Sent Successfully");
      } else {
        handleOpenWhatsappTemp(url);
      }
      setOpenShare(false);
      setOpen(false);
      setLoading(false);
      onShareSuccess?.();
    } else if (selectedCard == 1) {
      const emailSubject = "Proforma Invoice";
      const emailBody = "Hi there,\n\nPlease find the proforma invoice attached:\n" + url;
      const mailtoLink =
        "mailto:?subject=" +
        encodeURIComponent(emailSubject) +
        "&body=" +
        encodeURIComponent(emailBody);
      const a = document.createElement("a");
      a.href = mailtoLink;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setOpenShare(false);
      setOpen(false);
      setLoading(false);
      onShareSuccess?.();
    } else {
      const messengerLink =
        "https://www.facebook.com/dialog/share?app_id=YourAppID&href=" +
        encodeURIComponent(url);
      const a = document.createElement("a");
      a.href = messengerLink;
      a.target = "_blank";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setOpenShare(false);
      setOpen(false);
      setLoading(false);
      onShareSuccess?.();
    }
  };

  const handleShareOpen = () => {
    const url = shareURL;
    if (!url) {
      setMessage("Please Save Report Before Sharing");
      return;
    } else {
      setMessage("");
    }
    setOpenShare(true);
  };

  const handleSave = () => {
    UploadPDF();
  };

  const UploadPDF = async () => {
    const pdfContent = MyDocument;
    try {
      setSaving(true);
      const blob = await pdf(pdfContent).toBlob();
      const formData = new FormData();
      formData.append("File", blob, `ProformaInvoice_${proformaInvoice.inquiryCode}.pdf`);
      formData.append("InquiryID", proformaInvoice.inquiryId);
      formData.append("InqCode", proformaInvoice.inquiryCode);
      formData.append("DocumentType", 8); // Proforma Invoice document type
      formData.append("DocumentContentType", 6);
      formData.append("DocumentSubContentType", 6);
      formData.append("FileName", `ProformaInvoice_${formatDateTime(today)}.pdf`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const resultURL = data.result;
        setShareURL(resultURL);
        setMessage("");
        toast.success("PDF saved successfully!");
      } else {
        toast.error("Failed to upload PDF");
      }
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast.error("Error uploading PDF");
    } finally {
      setSaving(false);
    }
  };

  const MyDocument = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Image style={styles.backgroundImage} src="/images/quotation/abc.jpg" />
          <Text style={styles.title}>PROFORMA INVOICE</Text>
          <View style={styles.dateDocRow}>
            <Text style={styles.date}>Date : {formatDate(proformaInvoice.invoiceDate)}</Text>
            <Text style={styles.documentNo}>Document No : {proformaInvoice.documentNo || "—"}</Text>
          </View>

          {customerDetails && (
            <>
              <Text style={styles.add}>
                {customerDetails.title} {customerDetails.firstName} {customerDetails.lastName},
              </Text>
              {customerDetails.designation && (
                <Text style={styles.addDesi}>{customerDetails.designation},</Text>
              )}
              {customerDetails.company && <Text style={styles.add}>{customerDetails.company},</Text>}
              <Text style={styles.add}>
                {customerDetails.addressLine1}
                {customerDetails.addressLine2 && `, ${customerDetails.addressLine2}`}
                {customerDetails.addressLine3 && `, ${customerDetails.addressLine3}`}
              </Text>
            </>
          )}

          {/* Combined Table for All Quotations */}
          {(quotationsWithDetails.length > 0 ? quotationsWithDetails : quotations).length > 0 && (
            <View
              style={{
                ...styles.tableContainer,
                marginTop: "15px",
                marginLeft: "40px",
                marginRight: "100px",
              }}
            >
              {/* Header Row */}
              <View style={styles.tableHeaderRow}>
                <View style={{ ...styles.tablecell, width: "60px" }}>
                  <Text style={{ textAlign: "right" }}>Quantity</Text>
                </View>
                <View style={{ ...styles.tablecell, flex: 1 }}>
                  <Text>Item</Text>
                </View>
                <View style={{ ...styles.tablecell, width: "100px" }}>
                  <Text style={{ textAlign: "right" }}>Unit Price (Rs)</Text>
                </View>
                <View style={{ ...styles.tablecellLast, width: "100px" }}>
                  <Text style={{ textAlign: "right" }}>Amount (Rs)</Text>
                </View>
              </View>
              {/* Data Rows - All Quotations */}
              {(quotationsWithDetails.length > 0 ? quotationsWithDetails : quotations).map((quotation, quotationIndex) => (
                <React.Fragment key={quotationIndex}>
                  <View style={styles.tableRow}>
                    <View style={{ ...styles.tablecell2, width: "60px" }}>
                      <Text style={{ textAlign: "right" }}>{formatQuantity(quotation.quantity || quotation.Quantity || 0)}</Text>
                    </View>
                    <View style={{ ...styles.tablecell2, flex: 1 }}>
                      <Text>
                        {(() => {
                          const wt = quotation.windowType ?? quotation.WindowType ?? 0;
                          const name = getCategoryName(wt);
                          if (name !== "Item") return name;
                          return quotation.optionName || quotation.OptionName || name;
                        })()}
                      </Text>
                    </View>
                    <View style={{ ...styles.tablecell2, width: "100px" }}>
                      <Text style={{ textAlign: "right" }}>
                        {formatNumberWithSeparator(quotation.sellingPrice || quotation.SellingPrice || 0)}
                      </Text>
                    </View>
                    <View style={{ ...styles.tablecell2Last, width: "100px" }}>
                      <Text style={{ textAlign: "right" }}>
                        {formatNumberWithSeparator(quotation.totalAmount || quotation.TotalAmount || quotation.revenue || quotation.Revenue || 0)}
                      </Text>
                    </View>
                  </View>
                </React.Fragment>
              ))}
              
              {/* Total Row */}
              <View style={styles.tableRow}>
                <View style={{ ...styles.tablecell2, width: "60px" }}>
                  <Text></Text>
                </View>
                <View style={{ ...styles.tablecell2, flex: 1 }}>
                  <Text>Total</Text>
                </View>
                <View style={{ ...styles.tablecell2, width: "100px" }}>
                  <Text></Text>
                </View>
                <View style={{ ...styles.tablecell2Last, width: "100px" }}>
                  <Text style={{ textAlign: "right" }}>
                    {formatNumberWithSeparator(proformaInvoice.totalPayment)}
                  </Text>
                </View>
              </View>
              
              {/* Advance Payment Row */}
              <View style={styles.tableRow}>
                <View style={{ ...styles.tablecell2, width: "60px" }}>
                  <Text></Text>
                </View>
                <View style={{ ...styles.tablecell2, flex: 1 }}>
                  <Text>Advance Payment</Text>
                </View>
                <View style={{ ...styles.tablecell2, width: "100px" }}>
                  <Text></Text>
                </View>
                <View style={{ ...styles.tablecell2Last, width: "100px" }}>
                  <Text style={{ textAlign: "right" }}>
                    ({formatNumberWithSeparator(proformaInvoice.advancePayment)})
                  </Text>
                </View>
              </View>
              
              {/* Balance Payment Row */}
              <View style={styles.tableRow}>
                <View style={{ ...styles.tablecell2, width: "60px" }}>
                  <Text></Text>
                </View>
                <View style={{ ...styles.tablecell2, flex: 1 }}>
                  <Text style={{ fontWeight: "bold" }}>Balance Payment</Text>
                </View>
                <View style={{ ...styles.tablecell2, width: "100px" }}>
                  <Text></Text>
                </View>
                <View style={{ ...styles.tablecell2Last, width: "100px" }}>
                  <Text style={{ textAlign: "right", fontWeight: "bold" }}>
                    {formatNumberWithSeparator(proformaInvoice.balancePayment)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <Text style={styles.heading}>Terms & Conditions</Text>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointNumber}>1.</Text>
            <Text style={styles.pointText}>
              Please be kind enough to issue the cheques for the payment regarding this order to the following account.
            </Text>
          </View>

          <View style={{ marginTop: "8px" }}>
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
          <View style={{ marginTop: "20px" }}>
            <Image style={styles.sign} src="/images/quotation/sign.png" />
            <Text style={styles.add}>Yours Faithfully</Text>
            <Text style={styles.add}>Deshitha R Kumara</Text>
          </View>
        </View>
      </Page>
    </Document>
  );

  return (
    <>
      <Tooltip title="View Report" placement="top">
        <IconButton onClick={handleOpen} aria-label="view report" size="small">
          <LocalPrintshopIcon color="primary" fontSize="medium" />
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
                <Button disabled={saving} variant="outlined" sx={{ ml: 1 }} onClick={handleSave}>
                  {saving ? "Saving..." : "Save Report"}
                </Button>
                <Button
                  variant="outlined"
                  sx={{ ml: 1 }}
                  onClick={handleShareOpen}
                  disabled={saving}
                >
                  <ShareIcon sx={{ mr: 1 }} /> Share
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
            <Typography sx={{ mb: 2 }} color="error">
              {message ? message : ""}
            </Typography>
            {loading ? (
              <Grid item xs={12}>
                <Typography>Loading...</Typography>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <PDFViewer width={800} height={500}>
                  {MyDocument}
                </PDFViewer>
              </Grid>
            )}
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
              <Button disabled={loading} variant="outlined" onClick={handleShareNow}>
                {loading ? "Sending..." : "Share Now"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
};

export default ProformaInvoiceReport;


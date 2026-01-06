import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Divider,
  Chip,
  Card,
  CardContent,
  alpha,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import { formatDate } from "@/components/utils/formatHelper";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/Print";

const HelpDeskWorkOrderView = () => {
  const router = useRouter();
  const theme = useTheme();
  const { id } = router.query;
  const [workOrder, setWorkOrder] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchWorkOrder();
    }
  }, [id]);

  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/HelpDesk/GetWorkOrderById?id=${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Work Order API Response:", result); // Debug log
        
        // Handle different response structures
        let workOrderData = null;
        let materialsData = [];
        
        if (result.statusCode === 200 || result.statusCode === 1) {
          // Response structure: { statusCode: 1, message: "...", result: { workOrder: {...}, materials: [...] } }
          if (result.result) {
            workOrderData = result.result.workOrder || result.result;
            materialsData = result.result.materials || [];
          } else {
            workOrderData = result;
          }
        } else if (result.result) {
          // Direct result object
          workOrderData = result.result.workOrder || result.result;
          materialsData = result.result.materials || [];
        } else if (result.id) {
          // WorkOrder object directly
          workOrderData = result;
          materialsData = result.materials || [];
        }
        
        if (workOrderData) {
          console.log("Setting work order data:", workOrderData);
          setWorkOrder(workOrderData);
          
          if (Array.isArray(materialsData) && materialsData.length > 0) {
            console.log("Setting materials:", materialsData);
            setMaterials(materialsData);
          } else if (workOrderData.materials && Array.isArray(workOrderData.materials)) {
            console.log("Setting materials from workOrder:", workOrderData.materials);
            setMaterials(workOrderData.materials);
          }
        } else {
          console.error("No work order data found in response");
          toast.error(result.message || "Failed to load work order data");
        }
      } else {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        toast.error("Failed to load work order");
      }
    } catch (error) {
      console.error("Error fetching work order:", error);
      toast.error("An error occurred while loading work order");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!id) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to print the work order");
        return;
      }

      const url = `${BASE_URL}/HelpDesk/GenerateWorkOrderPdf?workOrderId=${id}`;
      
      // Fetch PDF with authorization header
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        
        // Check if the response is actually a PDF
        if (blob.type === "application/pdf" || blob.type === "") {
          const pdfUrl = window.URL.createObjectURL(blob);
          const newWindow = window.open(pdfUrl, "_blank");
          
          if (!newWindow) {
            // If popup blocked, create download link
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = `WorkOrder_${id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.info("PDF downloaded. Please check your downloads folder.");
          }
          
          // Clean up the URL after a delay
          setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 1000);
        } else {
          // If not PDF, might be an error response
          const text = await blob.text();
          try {
            const errorData = JSON.parse(text);
            toast.error(errorData.message || "Failed to generate PDF");
          } catch {
            toast.error("Failed to generate PDF. Please try again.");
          }
        }
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          toast.error(errorData.message || "Failed to generate PDF");
        } catch {
          toast.error(`Failed to generate PDF: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("An error occurred while generating PDF");
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return timeString;
    }
  };

  const InfoField = ({ label, value, fullWidth = false }) => (
    <Grid item xs={12} md={fullWidth ? 12 : 6}>
      <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: "8px", mb: 1.5 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem", display: "block" }}>
          {label}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
          {value || "N/A"}
        </Typography>
      </Box>
    </Grid>
  );

  const SectionCard = ({ title, children, fullWidth = false }) => (
    <Grid item xs={12} md={fullWidth ? 12 : 6}>
      <Card
        sx={{
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          height: "100%",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              p: 1.5,
              borderRadius: "8px",
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              {title}
            </Typography>
          </Box>
          {children}
        </CardContent>
      </Card>
    </Grid>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography>Loading work order details...</Typography>
      </Box>
    );
  }

  if (!workOrder) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Work order not found</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/help-desk/work-order")}
          sx={{ mt: 2 }}
        >
          Back to Work Orders
        </Button>
      </Box>
    );
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Work Order Details</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>
            <Link href="/help-desk/help-desk">Help Desk</Link>
          </li>
          <li>
            <Link href="/help-desk/work-order">Work Order</Link>
          </li>
          <li>View</li>
        </ul>
      </div>

      <Grid container spacing={3}>
        {/* Header Card */}
        <Grid item xs={12}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark || theme.palette.primary.main} 100%)`,
              color: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: "white" }}>
                    Work Order: {workOrder.workOrderNumber}
                  </Typography>
                  <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.9)" }}>
                    Issue Date: {formatDate(workOrder.workOrderIssueDate)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push("/help-desk/work-order")}
                    sx={{
                      borderColor: "white",
                      color: "white",
                      "&:hover": {
                        borderColor: "rgba(255,255,255,0.8)",
                        bgcolor: "rgba(255,255,255,0.1)",
                      },
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    sx={{
                      bgcolor: "white",
                      color: theme.palette.primary.main,
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.9)",
                      },
                    }}
                  >
                    Print PDF
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Basic Information */}
        <SectionCard title="Basic Information">
          <Grid container spacing={0}>
            <InfoField label="Ticket Number" value={workOrder.ticketNumber} />
            <InfoField label="Project Name" value={workOrder.projectName} />
            <InfoField label="Reference PO Number" value={workOrder.referencePONumber} />
            <InfoField
              label="Required Arrival"
              value={
                workOrder.requiredArrivalDate
                  ? `${formatDate(workOrder.requiredArrivalDate)} ${formatTime(workOrder.requiredArrivalTime)}`
                  : "N/A"
              }
            />
          </Grid>
        </SectionCard>

        {/* Job Site Information */}
        <SectionCard title="Job Site Information">
          <Grid container spacing={0}>
            <InfoField label="Client Name" value={workOrder.jobSiteClientName} />
            <InfoField label="Brand" value={workOrder.jobSiteBrand} />
            <InfoField label="Work Location" value={workOrder.jobSiteWorkLocation} />
            <InfoField label="Site Number" value={workOrder.jobSiteSiteNumber} />
            <InfoField label="Address" value={workOrder.jobSiteAddress} fullWidth />
            <InfoField label="City" value={workOrder.jobSiteCity} />
            <InfoField label="State" value={workOrder.jobSiteState} />
            <InfoField label="ZIP" value={workOrder.jobSiteZip} />
          </Grid>
        </SectionCard>

        {/* Partner Information */}
        <SectionCard title="Certified Partner Information">
          <Grid container spacing={0}>
            <InfoField label="Company Name" value={workOrder.partnerCompanyName} />
            <InfoField label="Address" value={workOrder.partnerAddress} fullWidth />
            <InfoField label="City" value={workOrder.partnerCity} />
            <InfoField label="State" value={workOrder.partnerState} />
            <InfoField label="ZIP" value={workOrder.partnerZip} />
            <InfoField label="Telephone" value={workOrder.partnerTelephone} />
            <InfoField label="Facsimile" value={workOrder.partnerFacsimile} />
            <InfoField label="Point of Contact" value={workOrder.partnerPointOfContact} />
          </Grid>
        </SectionCard>

        {/* Customer Information */}
        <SectionCard title="Customer Information">
          <Grid container spacing={0}>
            <InfoField label="Company Name" value={workOrder.customerCompanyName} />
            <InfoField label="Address" value={workOrder.customerAddress} fullWidth />
            <InfoField label="City" value={workOrder.customerCity} />
            <InfoField label="State" value={workOrder.customerState} />
            <InfoField label="ZIP" value={workOrder.customerZip} />
            <InfoField label="Point of Contact" value={workOrder.customerPointOfContact} />
            <InfoField label="Phone" value={workOrder.customerPhone} />
            <InfoField label="Cell" value={workOrder.customerCell} />
            <InfoField label="Project Manager" value={workOrder.customerProjectManager} />
            <InfoField label="Facsimile" value={workOrder.customerFacsimile} />
          </Grid>
        </SectionCard>

        {/* Description of Work Requested */}
        <SectionCard title="Description of Work Requested" fullWidth>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: "8px", mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1 }}>
                  Nature of Activity
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {workOrder.natureOfActivity || "N/A"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: "8px", mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1 }}>
                  Special Instructions
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {workOrder.specialInstructions || "N/A"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: "8px", mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1 }}>
                  Workmanship and Standards
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {workOrder.workmanshipAndStandards || "N/A"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: "8px" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1 }}>
                  Deliverables
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {workOrder.deliverables || "N/A"}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </SectionCard>

        {/* Materials Table */}
        {materials && materials.length > 0 && (
          <Grid item xs={12}>
            <Card
              sx={{
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    p: 1.5,
                    borderRadius: "8px",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                    Material & Other Items Used
                  </Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>#</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Item Description</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Quantity</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Estimated Unit Price</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Estimated Total Price</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Purpose</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {materials.map((material, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            "&:nth-of-type(even)": {
                              bgcolor: alpha(theme.palette.primary.main, 0.02),
                            },
                            "&:hover": {
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                            },
                          }}
                        >
                          <TableCell>{material.lineItem || index + 1}</TableCell>
                          <TableCell>{material.itemDescription || "N/A"}</TableCell>
                          <TableCell>{material.quantity || "N/A"}</TableCell>
                          <TableCell>
                            {material.estimatedUnitPrice
                              ? `$${parseFloat(material.estimatedUnitPrice).toFixed(2)}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {material.estimatedTotalPrice
                              ? `$${parseFloat(material.estimatedTotalPrice).toFixed(2)}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>{material.purpose || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Schedule and Release Information */}
        <SectionCard title="Schedule and Release Information">
          <Grid container spacing={0}>
            <InfoField
              label="Arrival Date"
              value={workOrder.arrivalDate ? formatDate(workOrder.arrivalDate) : "N/A"}
            />
            <InfoField label="Arrival Time" value={formatTime(workOrder.arrivalTime)} />
            <InfoField
              label="Depart Date"
              value={workOrder.departDate ? formatDate(workOrder.departDate) : "N/A"}
            />
            <InfoField label="Depart Time" value={formatTime(workOrder.departTime)} />
            <InfoField label="CNS Release Number" value={workOrder.cnsReleaseNumber} />
            <InfoField label="Technician Name" value={workOrder.technicianName} />
            <InfoField label="Technician Mobile" value={workOrder.technicianMobile} />
          </Grid>
        </SectionCard>

        {/* Site Contact Certification */}
        <SectionCard title="Site Contact Certification & Questionnaire">
          <Grid container spacing={0}>
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: "8px", mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1 }}>
                  Site Contact Certification
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {workOrder.siteContactCertification || "N/A"}
                </Typography>
              </Box>
            </Grid>
            <InfoField
              label="Work Completed"
              value={
                <Chip
                  label={workOrder.workCompleted ? "Yes" : "No"}
                  color={workOrder.workCompleted ? "success" : "default"}
                  size="small"
                />
              }
            />
            <InfoField
              label="No Damage Occurred"
              value={
                <Chip
                  label={workOrder.noDamageOccurred ? "Yes" : "No"}
                  color={workOrder.noDamageOccurred ? "success" : "default"}
                  size="small"
                />
              }
            />
            <InfoField label="Site Contact Name" value={workOrder.siteContactName} />
          </Grid>
        </SectionCard>

        {/* Behavioral Guidelines */}
        {workOrder.behavioralGuidelines && (
          <Grid item xs={12}>
            <Card
              sx={{
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    p: 1.5,
                    borderRadius: "8px",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                    Behavioral Guidelines
                  </Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: "8px" }}>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                    {workOrder.behavioralGuidelines}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
      <ToastContainer />
    </>
  );
};

export default HelpDeskWorkOrderView;

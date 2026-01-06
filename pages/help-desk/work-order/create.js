import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Divider,
  IconButton,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import { formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

const HelpDeskWorkOrderCreate = () => {
  const today = new Date();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { ticketId } = router.query;
  const [ticket, setTicket] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [tickets, setTickets] = useState([]);

  // Work Order Basic Info
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [referencePONumber, setReferencePONumber] = useState("");
  const [requiredArrivalDate, setRequiredArrivalDate] = useState("");
  const [requiredArrivalTime, setRequiredArrivalTime] = useState("");

  // Job Site Information
  const [jobSiteClientName, setJobSiteClientName] = useState("");
  const [jobSiteBrand, setJobSiteBrand] = useState("");
  const [jobSiteWorkLocation, setJobSiteWorkLocation] = useState("");
  const [jobSiteSiteNumber, setJobSiteSiteNumber] = useState("");
  const [jobSiteAddress, setJobSiteAddress] = useState("");
  const [jobSiteCity, setJobSiteCity] = useState("");
  const [jobSiteState, setJobSiteState] = useState("");
  const [jobSiteZip, setJobSiteZip] = useState("");

  // Partner Information
  const [partnerCompanyName, setPartnerCompanyName] = useState("");
  const [partnerAddress, setPartnerAddress] = useState("");
  const [partnerCity, setPartnerCity] = useState("");
  const [partnerState, setPartnerState] = useState("");
  const [partnerZip, setPartnerZip] = useState("");
  const [partnerTelephone, setPartnerTelephone] = useState("");
  const [partnerFacsimile, setPartnerFacsimile] = useState("");
  const [partnerPointOfContact, setPartnerPointOfContact] = useState("");

  // Customer Information
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerCompanyName, setCustomerCompanyName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [customerZip, setCustomerZip] = useState("");
  const [customerPointOfContact, setCustomerPointOfContact] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCell, setCustomerCell] = useState("");
  const [customerProjectManager, setCustomerProjectManager] = useState("");
  const [customerFacsimile, setCustomerFacsimile] = useState("");

  // Description of Work Requested
  const [natureOfActivity, setNatureOfActivity] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [workmanshipAndStandards, setWorkmanshipAndStandards] = useState("");
  const [deliverables, setDeliverables] = useState("");

  // Schedule and Release Information
  const [arrivalDate, setArrivalDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [departTime, setDepartTime] = useState("");
  const [cnsReleaseNumber, setCnsReleaseNumber] = useState("");
  const [technicianName, setTechnicianName] = useState("");
  const [technicianMobile, setTechnicianMobile] = useState("");

  // Site Contact Certification
  const [siteContactCertification, setSiteContactCertification] = useState("");
  const [workCompleted, setWorkCompleted] = useState(false);
  const [noDamageOccurred, setNoDamageOccurred] = useState(false);
  const [siteContactName, setSiteContactName] = useState("");

  // Materials
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    sessionStorage.setItem("category", "108"); // Work Order category
  }, []);

  // Fetch ticket if ticketId is provided
  useEffect(() => {
    if (ticketId) {
      const fetchTicket = async () => {
        try {
          const response = await fetch(`${BASE_URL}/HelpDesk/GetTicketById?id=${ticketId}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.result) {
              const ticketData = result.result;
              setTicket(ticketData);
              setSelectedTicket(ticketData);
              setProjectName(ticketData.project || "");
              if (ticketData.customerId) {
                // Load customer details
                fetchCustomerDetails(ticketData.customerId);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching ticket:", error);
        }
      };
      fetchTicket();
    }
  }, [ticketId]);

  // Fetch all tickets for selection
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/HelpDesk/GetAllTickets?SkipCount=0&MaxResultCount=10000&Search=null`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.result && result.result.items) {
            setTickets(result.result.items);
          } else if (Array.isArray(result.result)) {
            setTickets(result.result);
          }
        }
      } catch (error) {
        console.error("Error fetching tickets:", error);
      }
    };
    fetchTickets();
  }, []);

  // Fetch customers from master data
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/Customer/GetAllCustomers?SkipCount=0&MaxResultCount=10000&Search=null`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.result && result.result.items) {
            setCustomers(result.result.items);
          } else if (Array.isArray(result.result)) {
            setCustomers(result.result);
          }
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();
  }, []);

  const fetchCustomerDetails = async (customerId) => {
    try {
      const response = await fetch(`${BASE_URL}/Customer/GetCustomerById?id=${customerId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.result) {
          const customer = result.result;
          setSelectedCustomer(customer);
          setCustomerCompanyName(customer.company || customer.displayName || "");
          setCustomerAddress(
            `${customer.addressLine1 || ""} ${customer.addressLine2 || ""}`.trim()
          );
          // You can populate more customer fields here
        }
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
  };

  const handleCustomerChange = (event, newValue) => {
    setSelectedCustomer(newValue);
    if (newValue) {
      setCustomerCompanyName(newValue.company || newValue.displayName || "");
      setCustomerAddress(
        `${newValue.addressLine1 || ""} ${newValue.addressLine2 || ""}`.trim()
      );
    }
  };

  const handleAddMaterial = () => {
    const newMaterial = {
      lineItem: materials.length + 1,
      itemDescription: "",
      quantity: 1,
      estimatedUnitPrice: 0,
      estimatedTotalPrice: 0,
      purpose: "",
    };
    setMaterials([...materials, newMaterial]);
  };

  const handleRemoveMaterial = (index) => {
    const updatedMaterials = materials.filter((_, i) => i !== index);
    // Re-number line items
    updatedMaterials.forEach((m, i) => {
      m.lineItem = i + 1;
    });
    setMaterials(updatedMaterials);
  };

  const handleMaterialChange = (index, field, value) => {
    const updatedMaterials = [...materials];
    updatedMaterials[index][field] = value;
    if (field === "quantity" || field === "estimatedUnitPrice") {
      updatedMaterials[index].estimatedTotalPrice =
        (updatedMaterials[index].quantity || 0) *
        (updatedMaterials[index].estimatedUnitPrice || 0);
    }
    setMaterials(updatedMaterials);
  };

  const navigateToBack = () => {
    router.push("/help-desk/work-order");
  };

  const handleSubmit = async () => {
    if (!selectedTicket) {
      toast.error("Please select a ticket");
      return;
    }

    setIsSubmitting(true);

    try {
      // Helper function to convert time string - TimeSpan.TryParse accepts "HH:mm" format
      const convertTimeToTimeSpan = (timeString) => {
        if (!timeString || timeString.trim() === "") return null;
        return timeString; // TimeSpan.TryParse can handle "HH:mm" format
      };

      const workOrderData = {
        ticketId: selectedTicket.id,
        projectName: projectName || null,
        referencePONumber: referencePONumber || null,
        requiredArrivalDate: requiredArrivalDate ? new Date(requiredArrivalDate).toISOString() : null,
        requiredArrivalTime: convertTimeToTimeSpan(requiredArrivalTime),
        jobSiteClientName: jobSiteClientName || null,
        jobSiteBrand: jobSiteBrand || null,
        jobSiteWorkLocation: jobSiteWorkLocation || null,
        jobSiteSiteNumber: jobSiteSiteNumber || null,
        jobSiteAddress: jobSiteAddress || null,
        jobSiteCity: jobSiteCity || null,
        jobSiteState: jobSiteState || null,
        jobSiteZip: jobSiteZip || null,
        partnerCompanyName: partnerCompanyName || null,
        partnerAddress: partnerAddress || null,
        partnerCity: partnerCity || null,
        partnerState: partnerState || null,
        partnerZip: partnerZip || null,
        partnerTelephone: partnerTelephone || null,
        partnerFacsimile: partnerFacsimile || null,
        partnerPointOfContact: partnerPointOfContact || null,
        customerId: selectedCustomer?.id || null,
        customerCompanyName: customerCompanyName || null,
        customerAddress: customerAddress || null,
        customerCity: customerCity || null,
        customerState: customerState || null,
        customerZip: customerZip || null,
        customerPointOfContact: customerPointOfContact || null,
        customerPhone: customerPhone || null,
        customerCell: customerCell || null,
        customerProjectManager: customerProjectManager || null,
        customerFacsimile: customerFacsimile || null,
        natureOfActivity: natureOfActivity || null,
        specialInstructions: specialInstructions || null,
        workmanshipAndStandards: workmanshipAndStandards || null,
        deliverables: deliverables || null,
        arrivalDate: arrivalDate ? new Date(arrivalDate).toISOString() : null,
        arrivalTime: convertTimeToTimeSpan(arrivalTime),
        departDate: departDate ? new Date(departDate).toISOString() : null,
        departTime: convertTimeToTimeSpan(departTime),
        cnsReleaseNumber: cnsReleaseNumber || null,
        technicianName: technicianName || null,
        technicianMobile: technicianMobile || null,
        siteContactCertification: siteContactCertification || null,
        workCompleted: workCompleted || false,
        noDamageOccurred: noDamageOccurred || false,
        siteContactName: siteContactName || null,
        materials: materials.length > 0 ? materials : null,
      };

      const response = await fetch(`${BASE_URL}/HelpDesk/CreateWorkOrder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workOrderData),
      });

      if (response.ok) {
        const jsonResponse = await response.json();
        // Check for success: statusCode 200, 1, "SUCCESS", or if result contains workOrderNumber
        if (
          jsonResponse.statusCode === 200 ||
          jsonResponse.statusCode === 1 ||
          jsonResponse.statusCode === "SUCCESS" ||
          (jsonResponse.result && jsonResponse.result.workOrderNumber)
        ) {
          toast.success(jsonResponse.message || "Work Order created successfully");
          setTimeout(() => {
            router.push("/help-desk/work-order");
          }, 1500);
        } else {
          toast.error(jsonResponse.message || "Failed to create Work Order");
        }
      } else {
        const errorText = await response.text();
        toast.error(`Failed to create Work Order: ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error("Error creating work order:", error);
      toast.error("An error occurred while creating Work Order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Create Work Order</h1>
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
          <li>Create</li>
        </ul>
      </div>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            {/* Basic Information */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Basic Information
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={tickets}
                  getOptionLabel={(option) => `${option.ticketNumber} - ${option.subject}`}
                  value={selectedTicket}
                  onChange={(event, newValue) => setSelectedTicket(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Ticket Number *" required />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Project Name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Reference PO Number"
                  value={referencePONumber}
                  onChange={(e) => setReferencePONumber(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Required Arrival Date"
                  value={requiredArrivalDate}
                  onChange={(e) => setRequiredArrivalDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="time"
                  label="Required Arrival Time"
                  value={requiredArrivalTime}
                  onChange={(e) => setRequiredArrivalTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Job Site Information */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Job Site Information
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Client Name"
                  value={jobSiteClientName}
                  onChange={(e) => setJobSiteClientName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Brand"
                  value={jobSiteBrand}
                  onChange={(e) => setJobSiteBrand(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Work Location"
                  value={jobSiteWorkLocation}
                  onChange={(e) => setJobSiteWorkLocation(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Site Number"
                  value={jobSiteSiteNumber}
                  onChange={(e) => setJobSiteSiteNumber(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={jobSiteAddress}
                  onChange={(e) => setJobSiteAddress(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={jobSiteCity}
                  onChange={(e) => setJobSiteCity(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="State"
                  value={jobSiteState}
                  onChange={(e) => setJobSiteState(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Zip Code"
                  value={jobSiteZip}
                  onChange={(e) => setJobSiteZip(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Partner Information */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Certified Partner Information
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={partnerCompanyName}
                  onChange={(e) => setPartnerCompanyName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Point of Contact"
                  value={partnerPointOfContact}
                  onChange={(e) => setPartnerPointOfContact(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={partnerAddress}
                  onChange={(e) => setPartnerAddress(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={partnerCity}
                  onChange={(e) => setPartnerCity(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="State"
                  value={partnerState}
                  onChange={(e) => setPartnerState(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Zip Code"
                  value={partnerZip}
                  onChange={(e) => setPartnerZip(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Telephone"
                  value={partnerTelephone}
                  onChange={(e) => setPartnerTelephone(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Facsimile"
                  value={partnerFacsimile}
                  onChange={(e) => setPartnerFacsimile(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Customer Information */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Customer Information
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) =>
                    option.displayName || `${option.firstName} ${option.lastName}`.trim()
                  }
                  value={selectedCustomer}
                  onChange={handleCustomerChange}
                  renderInput={(params) => (
                    <TextField {...params} label="Customer" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={customerCompanyName}
                  onChange={(e) => setCustomerCompanyName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="State"
                  value={customerState}
                  onChange={(e) => setCustomerState(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Zip Code"
                  value={customerZip}
                  onChange={(e) => setCustomerZip(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Point of Contact"
                  value={customerPointOfContact}
                  onChange={(e) => setCustomerPointOfContact(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Project Manager"
                  value={customerProjectManager}
                  onChange={(e) => setCustomerProjectManager(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Cell"
                  value={customerCell}
                  onChange={(e) => setCustomerCell(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Facsimile"
                  value={customerFacsimile}
                  onChange={(e) => setCustomerFacsimile(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Description of Work Requested */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Description of Work Requested
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Nature of Activity"
                  value={natureOfActivity}
                  onChange={(e) => setNatureOfActivity(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Special Instructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Workmanship and Standards"
                  value={workmanshipAndStandards}
                  onChange={(e) => setWorkmanshipAndStandards(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Deliverables"
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Materials */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Material & Other Items Used
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddMaterial}
                sx={{ mb: 2 }}
              >
                Add Material
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Line Item</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Item Description</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Qty</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Est. Unit Price</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Est. Total Price</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Purpose</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {materials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary">No materials added</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    materials.map((material, index) => (
                      <TableRow key={index}>
                        <TableCell>{material.lineItem}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={material.itemDescription}
                            onChange={(e) =>
                              handleMaterialChange(index, "itemDescription", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={material.quantity}
                            onChange={(e) =>
                              handleMaterialChange(index, "quantity", parseFloat(e.target.value) || 0)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={material.estimatedUnitPrice}
                            onChange={(e) =>
                              handleMaterialChange(
                                index,
                                "estimatedUnitPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>{material.estimatedTotalPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={material.purpose}
                            onChange={(e) =>
                              handleMaterialChange(index, "purpose", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveMaterial(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 3 }} />

            {/* Schedule and Release Information */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Schedule and Release Information
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Arrival Date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="time"
                  label="Arrival Time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Depart Date"
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="time"
                  label="Depart Time"
                  value={departTime}
                  onChange={(e) => setDepartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="CNS Release Number"
                  value={cnsReleaseNumber}
                  onChange={(e) => setCnsReleaseNumber(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Technician/Engineer Name"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mobile Telephone Number"
                  value={technicianMobile}
                  onChange={(e) => setTechnicianMobile(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Site Contact Certification */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Site Contact Certification & Questionnaire
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Certification Notes"
                  value={siteContactCertification}
                  onChange={(e) => setSiteContactCertification(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={workCompleted}
                      onChange={(e) => setWorkCompleted(e.target.checked)}
                    />
                  }
                  label="Work Completed"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={noDamageOccurred}
                      onChange={(e) => setNoDamageOccurred(e.target.checked)}
                    />
                  }
                  label="No Damage Occurred"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Site Contact Name"
                  value={siteContactName}
                  onChange={(e) => setSiteContactName(e.target.value)}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
              <Button variant="outlined" onClick={navigateToBack}>
                Cancel
              </Button>
              <LoadingButton handleSubmit={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
                Submit
              </LoadingButton>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      <ToastContainer />
    </>
  );
};

export default HelpDeskWorkOrderCreate;


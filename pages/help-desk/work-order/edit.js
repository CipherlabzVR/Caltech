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
import useApi from "@/components/utils/useApi";
import AddItems from "pages/master/items/AddItems";
import GetAllItemDetails from "@/components/utils/GetAllItemDetails";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";

const formatTimeForInput = (value) => {
  if (!value) return "";
  if (typeof value === "string" && value.length >= 5) return value.substring(0, 5);
  return value;
};

const HelpDeskWorkOrderEdit = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;
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
  const [itemSearchResults, setItemSearchResults] = useState({});
  const [itemSearchLoading, setItemSearchLoading] = useState({});
  const searchTimeoutRef = React.useRef({});
  const [currentMaterialIndex, setCurrentMaterialIndex] = useState(null);
  const addItemButtonRef = React.useRef(null);

  // Get item details and app settings for Create Item modal
  const { uoms } = GetAllItemDetails();
  const { data: isPOSSystem } = IsAppSettingEnabled(`IsPosSystem`);
  const { data: isGarmentSystem } = IsAppSettingEnabled(`IsGarmentSystem`);
  const { data: isBarcodeEnabled } = IsAppSettingEnabled(`IsBarcodeEnabled`);
  const { data: IsEcommerceWebSiteAvailable } = IsAppSettingEnabled(`IsEcommerceWebSiteAvailable`);
  const { data: accountList } = useApi("/ChartOfAccount/GetAll");
  
  // Check permission for creating items (category ID: 10)
  const { create: canCreateItem } = IsPermissionEnabled("10");

  useEffect(() => {
    sessionStorage.setItem("category", "108"); // Work Order category
  }, []);

  // Fetch work order by id and populate form
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
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

        if (!response.ok) {
          toast.error("Failed to load work order");
          setLoading(false);
          return;
        }

        const result = await response.json();
        let workOrderData = null;
        let materialsData = [];

        if (result.result) {
          workOrderData = result.result.workOrder || result.result;
          materialsData = result.result.materials || [];
        }
        if (result.result && !workOrderData && result.result.workOrder)
          workOrderData = result.result.workOrder;
        if (result.result && Array.isArray(result.result.materials))
          materialsData = result.result.materials;

        if (!workOrderData) {
          toast.error(result.message || "Work order not found");
          setLoading(false);
          return;
        }

        const wo = workOrderData;
        setProjectName(wo.projectName || "");
        setReferencePONumber(wo.referencePONumber || "");
        setRequiredArrivalDate(wo.requiredArrivalDate ? wo.requiredArrivalDate.split("T")[0] : "");
        setRequiredArrivalTime(formatTimeForInput(wo.requiredArrivalTime) || "");
        setJobSiteClientName(wo.jobSiteClientName || "");
        setJobSiteBrand(wo.jobSiteBrand || "");
        setJobSiteWorkLocation(wo.jobSiteWorkLocation || "");
        setJobSiteSiteNumber(wo.jobSiteSiteNumber || "");
        setJobSiteAddress(wo.jobSiteAddress || "");
        setJobSiteCity(wo.jobSiteCity || "");
        setJobSiteState(wo.jobSiteState || "");
        setJobSiteZip(wo.jobSiteZip || "");
        setPartnerCompanyName(wo.partnerCompanyName || "");
        setPartnerAddress(wo.partnerAddress || "");
        setPartnerCity(wo.partnerCity || "");
        setPartnerState(wo.partnerState || "");
        setPartnerZip(wo.partnerZip || "");
        setPartnerTelephone(wo.partnerTelephone || "");
        setPartnerFacsimile(wo.partnerFacsimile || "");
        setPartnerPointOfContact(wo.partnerPointOfContact || "");
        setCustomerCompanyName(wo.customerCompanyName || "");
        setCustomerAddress(wo.customerAddress || "");
        setCustomerCity(wo.customerCity || "");
        setCustomerState(wo.customerState || "");
        setCustomerZip(wo.customerZip || "");
        setCustomerPointOfContact(wo.customerPointOfContact || "");
        setCustomerPhone(wo.customerPhone || "");
        setCustomerCell(wo.customerCell || "");
        setCustomerProjectManager(wo.customerProjectManager || "");
        setCustomerFacsimile(wo.customerFacsimile || "");
        setNatureOfActivity(wo.natureOfActivity || "");
        setSpecialInstructions(wo.specialInstructions || "");
        setWorkmanshipAndStandards(wo.workmanshipAndStandards || "");
        setDeliverables(wo.deliverables || "");
        setArrivalDate(wo.arrivalDate ? wo.arrivalDate.split("T")[0] : "");
        setArrivalTime(formatTimeForInput(wo.arrivalTime) || "");
        setDepartDate(wo.departDate ? wo.departDate.split("T")[0] : "");
        setDepartTime(formatTimeForInput(wo.departTime) || "");
        setCnsReleaseNumber(wo.cnsReleaseNumber || "");
        setTechnicianName(wo.technicianName || "");
        setTechnicianMobile(wo.technicianMobile || "");
        setSiteContactCertification(wo.siteContactCertification || "");
        setWorkCompleted(!!wo.workCompleted);
        setNoDamageOccurred(!!wo.noDamageOccurred);
        setSiteContactName(wo.siteContactName || "");

        const mappedMaterials = (materialsData || []).map((m, idx) => ({
          lineItem: (m.lineItem != null ? m.lineItem : idx + 1),
          itemId: m.itemId || null,
          selectedItem: null,
          itemDescription: m.itemDescription || "",
          quantity: m.quantity ?? 0,
          estimatedUnitPrice: m.estimatedUnitPrice ?? 0,
          estimatedTotalPrice: m.estimatedTotalPrice ?? 0,
          purpose: m.purpose || "",
        }));
        setMaterials(mappedMaterials);

        if (wo.customerId) {
          fetchCustomerDetails(wo.customerId);
        }
        if (wo.ticketId) {
          const ticketRes = await fetch(
            `${BASE_URL}/HelpDesk/GetTicketById?id=${wo.ticketId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (ticketRes.ok) {
            const ticketResult = await ticketRes.json();
            if (ticketResult.result) {
              setTicket(ticketResult.result);
              setSelectedTicket(ticketResult.result);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching work order:", error);
        toast.error("An error occurred while loading work order");
      } finally {
        setLoading(false);
      }
    };
    fetchWorkOrder();
  }, [id]);

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
    console.log("Fetching customer details for ID:", customerId); // Debug log
    
    // First try to find customer in already-loaded customers array
    const existingCustomer = customers.find(c => c.id === customerId || c.customerId === customerId);
    if (existingCustomer) {
      console.log("Found customer in local array:", existingCustomer); // Debug log
      populateCustomerFields(existingCustomer);
      return;
    }
    
    // If not found, fetch from API
    try {
      const response = await fetch(`${BASE_URL}/Customer/GetCustomerById?id=${customerId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Customer API response status:", response.status); // Debug log

      if (response.ok) {
        const result = await response.json();
        console.log("Customer API result:", result); // Debug log
        
        if (result.result) {
          populateCustomerFields(result.result);
        } else {
          console.log("No result in customer API response"); // Debug log
        }
      } else {
        console.error("Customer API failed with status:", response.status); // Debug log
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
  };

  const populateCustomerFields = (customer, ticketData = null) => {
    console.log("Populating customer fields with:", customer); // Debug log
    console.log("Ticket data for additional info:", ticketData); // Debug log
    setSelectedCustomer(customer);
    
    // Auto-populate all customer information fields
    setCustomerCompanyName(customer.company || customer.companyName || customer.displayName || "");
    
    // Combine address lines
    const addressParts = [
      customer.addressLine1 || "",
      customer.addressLine2 || "",
      customer.addressLine3 || ""
    ].filter(part => part.trim() !== "");
    setCustomerAddress(addressParts.join(", "));
    
    setCustomerCity(customer.city || "");
    setCustomerState(customer.state || customer.country || "");
    setCustomerZip(customer.zipCode || customer.zip || customer.postalCode || "");
    setCustomerPointOfContact(customer.designation || customer.contactPerson || customer.pointOfContact || "");
    
    // Get phone from ticket data if available, otherwise from customer
    const phone = ticketData?.customerPhone || customer.phone || customer.phoneNumber || customer.telephone || "";
    setCustomerPhone(phone);
    setCustomerCell(customer.mobilePhone || customer.cellPhone || customer.mobile || customer.cell || "");
    setCustomerProjectManager(customer.projectManager || customer.accountManager || "");
    setCustomerFacsimile(customer.fax || customer.facsimile || "");
    
    console.log("Customer fields populated successfully"); // Debug log
  };

  const handleCustomerChange = (event, newValue) => {
    if (newValue) {
      populateCustomerFields(newValue);
    } else {
      // Clear all customer fields if no customer is selected
      setSelectedCustomer(null);
      setCustomerCompanyName("");
      setCustomerAddress("");
      setCustomerCity("");
      setCustomerState("");
      setCustomerZip("");
      setCustomerPointOfContact("");
      setCustomerPhone("");
      setCustomerCell("");
      setCustomerProjectManager("");
      setCustomerFacsimile("");
    }
  };

  const handleAddMaterial = () => {
    const newMaterial = {
      lineItem: materials.length + 1,
      itemId: null,
      selectedItem: null,
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

  const searchItems = (index, searchTerm) => {
    // Clear previous timeout for this index
    if (searchTimeoutRef.current[index]) {
      clearTimeout(searchTimeoutRef.current[index]);
    }

    if (!searchTerm || searchTerm.trim().length < 2) {
      setItemSearchResults(prev => ({ ...prev, [index]: [] }));
      setItemSearchLoading(prev => ({ ...prev, [index]: false }));
      return;
    }

    setItemSearchLoading(prev => ({ ...prev, [index]: true }));

    // Debounce: wait 500ms after user stops typing
    searchTimeoutRef.current[index] = setTimeout(async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/Items/GetAllItemsSkipAndTake?SkipCount=0&MaxResultCount=10&Search=${searchTerm}`,
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
          let items = [];
          
          if (result.result && result.result.items) {
            items = result.result.items;
          } else if (Array.isArray(result.result)) {
            items = result.result;
          } else if (Array.isArray(result)) {
            items = result;
          }
          
          console.log(`Items found for "${searchTerm}":`, items.length);
          setItemSearchResults(prev => ({ ...prev, [index]: items }));
        }
      } catch (error) {
        console.error("Error searching items:", error);
        setItemSearchResults(prev => ({ ...prev, [index]: [] }));
      } finally {
        setItemSearchLoading(prev => ({ ...prev, [index]: false }));
      }
    }, 500);
  };

  const handleCreateItemClick = (index) => {
    setCurrentMaterialIndex(index);
    // Programmatically click the AddItems button to open the modal
    setTimeout(() => {
      if (addItemButtonRef.current) {
        const button = addItemButtonRef.current.querySelector('button');
        if (button) {
          button.click();
        }
      }
    }, 100);
  };

  const handleItemCreated = async (newItem) => {
    console.log("New item created:", newItem);
    if (currentMaterialIndex !== null && newItem) {
      // Fetch the newly created item details
      try {
        const response = await fetch(
          `${BASE_URL}/Items/GetAllItemsSkipAndTake?SkipCount=0&MaxResultCount=1&Search=${newItem.code || newItem.name}`,
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
          let items = [];
          
          if (result.result && result.result.items) {
            items = result.result.items;
          } else if (Array.isArray(result.result)) {
            items = result.result;
          }
          
          if (items.length > 0) {
            handleItemSelect(currentMaterialIndex, items[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching newly created item:", error);
      }
    }
    setCurrentMaterialIndex(null);
  };

  const handleItemSelect = (index, selectedItem) => {
    const updatedMaterials = [...materials];
    if (selectedItem) {
      updatedMaterials[index].selectedItem = selectedItem;
      updatedMaterials[index].itemId = selectedItem.id;
      updatedMaterials[index].itemDescription = selectedItem.itemName || selectedItem.name || selectedItem.description || "";
      updatedMaterials[index].estimatedUnitPrice = selectedItem.sellingPrice || selectedItem.unitPrice || selectedItem.price || 0;
      updatedMaterials[index].estimatedTotalPrice =
        (updatedMaterials[index].quantity || 0) * (updatedMaterials[index].estimatedUnitPrice || 0);
    } else {
      updatedMaterials[index].selectedItem = null;
      updatedMaterials[index].itemId = null;
      updatedMaterials[index].itemDescription = "";
      updatedMaterials[index].estimatedUnitPrice = 0;
      updatedMaterials[index].estimatedTotalPrice = 0;
    }
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
    if (!id) {
      toast.error("Work order ID is missing");
      return;
    }

    setIsSubmitting(true);

    try {
      const convertTimeToTimeSpan = (timeString) => {
        if (!timeString || timeString.trim() === "") return null;
        return timeString;
      };

      const updatePayload = {
        id: parseInt(id, 10),
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
        materials: materials.length > 0
          ? materials.map((m) => ({
              lineItem: m.lineItem,
              itemDescription: m.itemDescription || null,
              quantity: m.quantity ?? null,
              estimatedUnitPrice: m.estimatedUnitPrice ?? null,
              estimatedTotalPrice: m.estimatedTotalPrice ?? null,
              purpose: m.purpose || null,
            }))
          : null,
      };

      const response = await fetch(`${BASE_URL}/HelpDesk/UpdateWorkOrder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      if (response.ok) {
        const jsonResponse = await response.json();
        if (
          jsonResponse.statusCode === 200 ||
          jsonResponse.statusCode === 1 ||
          jsonResponse.statusCode === "SUCCESS"
        ) {
          toast.success(jsonResponse.message || "Work Order updated successfully");
          setTimeout(() => {
            router.push("/help-desk/work-order");
          }, 1500);
        } else {
          toast.error(jsonResponse.message || "Failed to update Work Order");
        }
      } else {
        const errorText = await response.text();
        toast.error(`Failed to update Work Order: ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error("Error updating work order:", error);
      toast.error("An error occurred while updating Work Order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Edit Work Order</h1>
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
          <li>Edit</li>
        </ul>
      </div>

      {loading ? (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography>Loading work order...</Typography>
            </Paper>
          </Grid>
        </Grid>
      ) : (
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
                  disabled={!!id}
                  onChange={(event, newValue) => {
                    if (id) return;
                    setSelectedTicket(newValue);
                    // Auto-load Project Name and Customer Information from the selected ticket
                    if (newValue) {
                      setProjectName(newValue.project || newValue.projectName || "");
                      if (newValue.customer) {
                        populateCustomerFields(newValue.customer, newValue);
                      } else {
                        const customerId = newValue.customerId || newValue.CustomerId || newValue.customer_id || newValue.clientId || newValue.ClientId;
                        if (customerId) {
                          fetchCustomerDetails(customerId);
                        } else {
                          setSelectedCustomer(null);
                          setCustomerCompanyName("");
                          setCustomerAddress("");
                          setCustomerCity("");
                          setCustomerState("");
                          setCustomerZip("");
                          setCustomerPointOfContact("");
                          setCustomerPhone("");
                          setCustomerCell("");
                          setCustomerProjectManager("");
                          setCustomerFacsimile("");
                        }
                      }
                    } else {
                      setProjectName("");
                      setSelectedCustomer(null);
                      setCustomerCompanyName("");
                      setCustomerAddress("");
                      setCustomerCity("");
                      setCustomerState("");
                      setCustomerZip("");
                      setCustomerPointOfContact("");
                      setCustomerPhone("");
                      setCustomerCell("");
                      setCustomerProjectManager("");
                      setCustomerFacsimile("");
                    }
                  }}
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
                        <TableCell sx={{ minWidth: 250 }}>
                          <Autocomplete
                            size="small"
                            options={[
                              ...(canCreateItem ? [{ id: 'create-new', itemName: '+ Create New Item', isCreateOption: true }] : []),
                              ...(itemSearchResults[index] || [])
                            ]}
                            getOptionLabel={(option) => 
                              option.itemName || option.name || option.description || option.itemCode || ""
                            }
                            value={material.selectedItem || null}
                            onChange={(event, newValue) => {
                              if (newValue?.isCreateOption) {
                                handleCreateItemClick(index);
                              } else {
                                handleItemSelect(index, newValue);
                              }
                            }}
                            onInputChange={(event, newInputValue, reason) => {
                              if (reason === 'input') {
                                searchItems(index, newInputValue);
                              }
                            }}
                            renderOption={(props, option) => (
                              <li {...props} style={{
                                fontWeight: option.isCreateOption ? 'bold' : 'normal',
                                color: option.isCreateOption ? '#1976d2' : 'inherit',
                                borderBottom: option.isCreateOption ? '1px solid #e0e0e0' : 'none',
                              }}>
                                {option.itemName || option.name || option.description || option.itemCode}
                              </li>
                            )}
                            renderInput={(params) => (
                              <TextField 
                                {...params} 
                                placeholder="Type to search items..."
                                size="small"
                              />
                            )}
                            isOptionEqualToValue={(option, value) =>
                              option?.id === value?.id
                            }
                            loading={itemSearchLoading[index] || false}
                            loadingText="Searching items..."
                            noOptionsText="Type at least 2 characters to search"
                            filterOptions={(x) => x}
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
      )}
      
      {/* Hidden AddItems component for creating new items - Only if user has create permission */}
      {canCreateItem && (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
          <div ref={addItemButtonRef}>
            <AddItems 
              fetchItems={handleItemCreated}
              isPOSSystem={isPOSSystem}
              uoms={uoms}
              isGarmentSystem={isGarmentSystem}
              chartOfAccounts={accountList}
              barcodeEnabled={isBarcodeEnabled}
              IsEcommerceWebSiteAvailable={IsEcommerceWebSiteAvailable}
            />
          </div>
        </div>
      )}
      
      <ToastContainer />
    </>
  );
};

export default HelpDeskWorkOrderEdit;


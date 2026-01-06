import React, { useState, useEffect } from "react";
import {
  Grid,
  IconButton,
  Tooltip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddIcon from "@mui/icons-material/Add";
import useApi from "@/components/utils/useApi";
import RichTextEditor from "@/components/help-desk/RichTextEditor";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 900, xs: "95%" },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  maxHeight: "90vh",
  overflowY: "auto",
};

const validationSchema = Yup.object().shape({
  subject: Yup.string().trim().required("Subject is required"),
  description: Yup.string().required("Description is required").test(
    "not-empty",
    "Description is required",
    (value) => {
      if (!value) return false;
      const textContent = value.replace(/<[^>]*>/g, "").trim();
      return textContent.length > 0;
    }
  ),
  priority: Yup.number().required("Priority is required"),
  categoryId: Yup.number().required("Category is required"),
  projectIds: Yup.array().of(Yup.number()).nullable(),
  projectId: Yup.number().nullable(),
  startDate: Yup.string(),
  startTime: Yup.string(),
  dueDate: Yup.string(),
  dueTime: Yup.string(),
  customerName: Yup.string().trim(),
  customerId: Yup.number().nullable(),
  customerEmail: Yup.string().trim().nullable(),
  customerPhone: Yup.string().trim().nullable(),
  customerCompany: Yup.string().trim().nullable(),
});

export default function CreateTicketModal({ fetchItems, currentPage = 1, currentSearch = "", currentPageSize = 10 }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [customers, setCustomers] = useState([]);
  const [projectManagementProjects, setProjectManagementProjects] = useState([]);
  const [assignCustomers, setAssignCustomers] = useState([]);
  const [assignProjects, setAssignProjects] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingAssignCustomers, setLoadingAssignCustomers] = useState(false);
  const [loadingAssignProjects, setLoadingAssignProjects] = useState(false);

  const { data: categoriesData } = useApi("/HelpDesk/GetAllCategories?SkipCount=0&MaxResultCount=1000&Search=null");
  // Use GetUsersByUserType endpoint to fetch only HelpDeskSupport users (UserType = 14)
  const { data: helpDeskSupportUsersData } = useApi("/User/GetUsersByUserType?userType=14");
  // Removed: const { data: projectsData } = useApi("/Project/GetAllProjects"); - Now using Project Management projects
  const { data: prioritySettingsData } = useApi("/HelpDesk/GetPrioritySettings");

  // Process HelpDeskSupport users from the API response
  const helpDeskSupportUsers = React.useMemo(() => {
    if (!helpDeskSupportUsersData) {
      console.log("CreateTicket: No HelpDeskSupport users data available");
      return [];
    }
    
    const users = Array.isArray(helpDeskSupportUsersData) 
      ? helpDeskSupportUsersData 
      : Array.isArray(helpDeskSupportUsersData?.result) 
        ? helpDeskSupportUsersData.result 
        : Array.isArray(helpDeskSupportUsersData?.data)
          ? helpDeskSupportUsersData.data
          : [];
    
    if (!Array.isArray(users) || users.length === 0) {
      console.log("CreateTicket: No HelpDeskSupport users found");
      return [];
    }

    console.log(`CreateTicket: Found ${users.length} HelpDeskSupport users:`, users.map(u => ({
      id: u?.id,
      email: u?.email,
      firstName: u?.firstName,
      lastName: u?.lastName,
      userType: u?.userType,
      userTypeName: u?.userTypeName
    })));
    
    return users;
  }, [helpDeskSupportUsersData]);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/Customer/GetAllCustomer`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          const customerList = Array.isArray(data) ? data : Array.isArray(data?.result) ? data.result : [];
          setCustomers(customerList);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch project management projects
  useEffect(() => {
    const fetchProjectManagementProjects = async () => {
      try {
        setLoadingProjects(true);
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/ProjectManagementModule/projects`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          const projectList = Array.isArray(data?.result) ? data.result : [];
          setProjectManagementProjects(projectList);
        }
      } catch (error) {
        console.error("Error fetching project management projects:", error);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjectManagementProjects();
  }, []);

  // Fetch customers for assign category
  const fetchAssignCustomers = async () => {
    try {
      setLoadingAssignCustomers(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/GetCustomersForAssign`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        const customerList = Array.isArray(data?.result) ? data.result : [];
        setAssignCustomers(customerList);
      }
    } catch (error) {
      console.error("Error fetching assign customers:", error);
      toast.error("Failed to fetch customers");
    } finally {
      setLoadingAssignCustomers(false);
    }
  };

  // Fetch projects for assign category from Project Management module
  const fetchAssignProjects = async () => {
    try {
      setLoadingAssignProjects(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/ProjectManagementModule/projects`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        const projectList = Array.isArray(data?.result) ? data.result : [];
        console.log("Fetched Project Management projects for assign:", projectList);
        setAssignProjects(projectList);
      } else {
        console.error("Failed to fetch projects:", response.status, response.statusText);
        toast.error("Failed to fetch projects");
      }
    } catch (error) {
      console.error("Error fetching assign projects:", error);
      toast.error("Failed to fetch projects");
    } finally {
      setLoadingAssignProjects(false);
    }
  };

  // Fetch projects immediately on component mount (like project customer assign page)
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingAssignProjects(true);
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/ProjectManagementModule/projects`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          const projectList = Array.isArray(data?.result) ? data.result : [];
          console.log("Fetched Project Management projects for assign:", projectList);
          setAssignProjects(projectList);
        } else {
          console.error("Failed to fetch projects:", response.status, response.statusText);
          toast.error("Failed to fetch projects");
        }
      } catch (error) {
        console.error("Error fetching assign projects:", error);
        toast.error("Failed to fetch projects");
      } finally {
        setLoadingAssignProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // Auto-fetch customer details
  const fetchCustomerDetails = async (customerId, setFieldValue) => {
    if (!customerId) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/GetCustomerDetails?customerId=${customerId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          const customer = data.result;
          setFieldValue("customerName", customer.name || "");
          setFieldValue("customerEmail", customer.email || "");
          setFieldValue("customerPhone", customer.phone || "");
          setFieldValue("customerCompany", customer.company || "");
        }
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
  };

  // Auto-fetch project details and customer from assignment
  const fetchProjectDetails = async (projectId, setFieldValue) => {
    if (!projectId) return;
    try {
      const token = localStorage.getItem("token");
      
      // First, try to get customer from project-customer assignment
      const assignResponse = await fetch(`${BASE_URL}/HelpDesk/GetCustomerByProjectId?projectId=${projectId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (assignResponse.ok) {
        const assignData = await assignResponse.json();
        if ((assignData.statusCode === 200 || assignData.status === "SUCCESS") && assignData.result) {
          // Customer found from assignment
          const customer = assignData.result;
          setFieldValue("customerId", customer.id);
          setFieldValue("customerName", customer.name || "");
          setFieldValue("customerEmail", customer.email || "");
          setFieldValue("customerPhone", customer.phone || "");
          setFieldValue("customerCompany", customer.company || "");
          
          // Also fetch project details
          const projectResponse = await fetch(`${BASE_URL}/HelpDesk/GetProjectDetailsForAssign?projectId=${projectId}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (projectResponse.ok) {
            const projectData = await projectResponse.json();
            if (projectData.result) {
              setFieldValue("project", projectData.result.name || "");
            }
          }
          return;
        }
      }
      
      // Fallback: Get project details and try to get customer from project's customerId
      const response = await fetch(`${BASE_URL}/HelpDesk/GetProjectDetailsForAssign?projectId=${projectId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          const project = data.result;
          setFieldValue("project", project.name || "");
          // Auto-populate customer if project has customer
          if (project.customerId && project.customerName) {
            setFieldValue("customerId", project.customerId);
            setFieldValue("customerName", project.customerName || "");
            setFieldValue("customerEmail", project.customerEmail || "");
            setFieldValue("customerPhone", project.customerPhone || "");
            setFieldValue("customerCompany", project.customerCompany || "");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching project details:", error);
    }
  };

  const categories = categoriesData?.items || [];

  const toNumericId = (value) => {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const deriveCustomerName = (project) => {
    const candidateNames = [
      project.customerName,
      project.customer?.displayName,
      project.customer?.name,
      project.customer?.customerName,
      project.customer?.company,
      project.customerDetails?.displayName,
      project.customerDetails?.name,
      project.customerInfo?.displayName,
      project.customerInfo?.name,
    ];

    const fromParts = [
      [project.customer?.firstName, project.customer?.lastName],
      [project.customerDetails?.firstName, project.customerDetails?.lastName],
      [project.customerInfo?.firstName, project.customerInfo?.lastName],
    ];

    const directName = candidateNames.find(
      (name) => typeof name === "string" && name.trim().length > 0
    );
    if (directName) return directName.trim();

    const composed = fromParts
      .map((parts) => parts.filter(Boolean).join(" ").trim())
      .find((name) => name.length > 0);

    if (composed) return composed;

    return "";
  };

  // Use Project Management projects for all project fields
  const normalizedProjects = React.useMemo(() => {
    // Use projectManagementProjects or assignProjects (both from Project Management module)
    const sourceProjects = projectManagementProjects.length > 0 ? projectManagementProjects : assignProjects;
    
    if (!sourceProjects || sourceProjects.length === 0) {
      console.log("No Project Management projects available");
      return [];
    }

    return sourceProjects.map((project) => {
      // Project Management projects use 'id' not 'projectId'
      const projectId = project.id || project.projectId;
      
      const customerIdCandidates = [
        project.customerId,
        project.assignedToCustomerId,
        project.customer?.id,
        project.customer?.customerId,
        project.customerDetails?.id,
        project.customerDetails?.customerId,
        project.customerInfo?.id,
        project.customerInfo?.customerId,
      ];

      const customerId =
        customerIdCandidates
          .map((candidate) => toNumericId(candidate))
          .find((candidate) => candidate !== null && candidate !== undefined) ?? null;

      return {
        ...project,
        id: toNumericId(projectId), // Ensure id is numeric
        name: project.name || "",
        code: project.code || "",
        customerIdNormalized: customerId,
        customerNameNormalized: deriveCustomerName(project),
      };
    });
  }, [projectManagementProjects, assignProjects]);

  // Filter projects by selected customer
  const filteredProjectsByCustomer = React.useMemo(() => {
    return (customerId) => {
      if (!customerId) {
        // If no customer selected, return empty array (or all projects if you want to show all)
        return [];
      }
      return normalizedProjects.filter((project) => {
        const projectCustomerId = project.customerIdNormalized;
        return projectCustomerId !== null && projectCustomerId === customerId;
      });
    };
  }, [normalizedProjects]);

  const prioritySettings = Array.isArray(prioritySettingsData?.result)
    ? prioritySettingsData.result
    : Array.isArray(prioritySettingsData)
    ? prioritySettingsData
    : [];
  const defaultPriorityValue = prioritySettings.find((p) => p.isDefault)?.priority ?? prioritySettings[0]?.priority ?? 2;

  // Track selected category to fetch assign data
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [hasFetchedAssignData, setHasFetchedAssignData] = useState(false);

  // Fetch customers for assign category when assign category is selected
  useEffect(() => {
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
    const isAssignCategory = selectedCategory?.name?.toLowerCase() === "assign";
    
    if (isAssignCategory && !hasFetchedAssignData) {
      fetchAssignCustomers();
      setHasFetchedAssignData(true);
    } else if (!isAssignCategory) {
      setHasFetchedAssignData(false);
    }
  }, [selectedCategoryId, hasFetchedAssignData]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const selectedProjectIds = Array.isArray(values.projectIds)
        ? values.projectIds.filter((id) => id !== null && id !== undefined)
        : [];
      const primaryProjectId = selectedProjectIds.length > 0 ? selectedProjectIds[0] : null;
      const primaryProject =
        primaryProjectId !== null
          ? normalizedProjects.find((proj) => proj?.id === primaryProjectId) || null
          : null;
      const primaryProjectName = primaryProject?.name || null;

      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/CreateTicket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: values.subject,
          description: values.description,
          priority: values.priority,
          categoryId: values.categoryId,
          assignedToUserId: values.assignedToUserId || null,
          project: primaryProjectName || (values.projectId ? assignProjects.find(p => (p.projectId || p.id) === values.projectId)?.name : null),
          projectId: values.projectId || primaryProjectId,
          projectIds: selectedProjectIds,
          startDate: values.startDate ? (values.startTime ? `${values.startDate}T${values.startTime}:00` : `${values.startDate}T00:00:00`) : null,
          dueDate: values.dueDate ? (values.dueTime ? `${values.dueDate}T${values.dueTime}:00` : `${values.dueDate}T23:59:59`) : null,
          customerName: values.customerName ? values.customerName.trim() : null,
          customerId: values.customerId || null,
          customerEmail: values.customerEmail || null,
          customerPhone: values.customerPhone || null,
          customerCompany: values.customerCompany || null,
        }),
      });

      const data = await response.json();

      // Check if the request was successful
      if (response.ok) {
        // If response is OK, treat as success unless explicitly marked as error
        const isSuccess = data.status === "SUCCESS" || 
                         data.statusCode === 200 || 
                         response.status === 200 ||
                         !data.status || // If no status field, assume success
                         (data.status && data.status !== "ERROR" && data.status !== "FAIL");
        
        if (isSuccess) {
          toast.success(data.message || "Ticket created successfully!");
          resetForm();
          handleClose();
          // Refresh the table with current page parameters
          fetchItems(currentPage, currentSearch, currentPageSize);
        } else {
          // Response is OK but status indicates failure
          toast.error(data.message || "Failed to create ticket");
        }
      } else {
        // HTTP error response
        toast.error(data.message || "Failed to create ticket");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("An error occurred while creating the ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleOpen}
        sx={{
          bgcolor: "#4299E1",
          color: "white",
          borderRadius: 2,
          px: 3,
          py: 1.5,
          textTransform: "none",
          fontWeight: 600,
          boxShadow: "0 4px 6px rgba(66, 153, 225, 0.3)",
          "&:hover": {
            bgcolor: "#3182CE",
            boxShadow: "0 6px 8px rgba(66, 153, 225, 0.4)",
          },
        }}
      >
        New Ticket
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="create-ticket-modal"
        aria-describedby="create-ticket-form"
      >
        <Box sx={style}>
          <Typography id="create-ticket-modal" variant="h6" component="h2" mb={2}>
            Create New Ticket
          </Typography>

          <Formik
            initialValues={{
              subject: "",
              description: "",
              priority: defaultPriorityValue,
              categoryId: "",
              assignedToUserId: null,
              projectIds: [],
              projectId: null,
              startDate: "",
              startTime: "",
              dueDate: "",
              dueTime: "",
              customerName: "",
              customerId: null,
              customerEmail: "",
              customerPhone: "",
              customerCompany: "",
            }}
            enableReinitialize
            validationSchema={validationSchema}
            validate={(values) => {
              const errors = {};
              const selectedCategory = categories.find(cat => cat.id === values.categoryId);
              const isAssignCategory = selectedCategory?.name?.toLowerCase() === "assign";
              
              if (isAssignCategory) {
                if (!values.customerId) {
                  errors.customerId = "Customer is required for assign category";
                }
                if (!values.projectId) {
                  errors.projectId = "Project is required for assign category";
                }
              }
              
              return errors;
            }}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, setFieldValue, isSubmitting }) => {
              // Check if assign category is selected
              const selectedCategory = categories.find(cat => cat.id === values.categoryId);
              const isAssignCategory = selectedCategory?.name?.toLowerCase() === "assign";

              return (
                <Form>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        fullWidth
                        name="subject"
                        label="Subject"
                        size="small"
                        error={touched.subject && !!errors.subject}
                        helperText={touched.subject && errors.subject}
                      />
                    </Grid>

                    {/* Show assign category fields when assign is selected */}
                    {isAssignCategory ? (
                      <>
                        <Grid item xs={12} md={6}>
                          <Autocomplete
                            options={assignCustomers}
                            getOptionLabel={(option) => option?.name || ""}
                            isOptionEqualToValue={(option, value) => option?.id === value?.id}
                            value={assignCustomers.find(c => c.id === values.customerId) || null}
                            onChange={async (event, newValue) => {
                              const customerId = newValue?.id ?? null;
                              setFieldValue("customerId", customerId);
                              if (customerId) {
                                await fetchCustomerDetails(customerId, setFieldValue);
                              } else {
                                setFieldValue("customerName", "");
                                setFieldValue("customerEmail", "");
                                setFieldValue("customerPhone", "");
                                setFieldValue("customerCompany", "");
                              }
                            }}
                            loading={loadingAssignCustomers}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Customer *"
                                placeholder="Select customer"
                                size="small"
                                error={touched.customerId && !!errors.customerId}
                                helperText={touched.customerId && errors.customerId}
                              />
                            )}
                            noOptionsText="No customers found"
                            loadingText="Loading customers..."
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Autocomplete
                            options={assignProjects}
                            getOptionLabel={(option) => `${option?.code || ""} - ${option?.name || ""}`.trim()}
                            isOptionEqualToValue={(option, value) => (option?.projectId || option?.id) === (value?.projectId || value?.id)}
                            value={assignProjects.find(p => (p.projectId || p.id) === values.projectId) || null}
                            onChange={async (event, newValue) => {
                              const projectId = newValue?.projectId || newValue?.id || null;
                              setFieldValue("projectId", projectId);
                              if (projectId) {
                                await fetchProjectDetails(projectId, setFieldValue);
                              }
                            }}
                            loading={loadingAssignProjects}
                            renderOption={(props, option) => (
                              <li {...props}>
                                <Box sx={{ display: "flex", flexDirection: "column" }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {option?.code ? `${option.code} - ` : ""}{option?.name || "Unnamed Project"}
                                  </Typography>
                                  {option?.statusName ? (
                                    <Typography variant="caption" color="text.secondary">
                                      Status: {option.statusName}
                                    </Typography>
                                  ) : null}
                                </Box>
                              </li>
                            )}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Project *"
                                placeholder="Select project from Project Management"
                                size="small"
                                error={touched.projectId && !!errors.projectId}
                                helperText={touched.projectId && errors.projectId}
                              />
                            )}
                            noOptionsText="No projects found"
                            loadingText="Loading projects..."
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="customerName"
                            label="Customer Name"
                            value={values.customerName || ""}
                            size="small"
                            disabled
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="customerEmail"
                            label="Customer Email"
                            value={values.customerEmail || ""}
                            size="small"
                            disabled
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="customerPhone"
                            label="Customer Phone"
                            value={values.customerPhone || ""}
                            size="small"
                            disabled
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="customerCompany"
                            label="Customer Company"
                            value={values.customerCompany || ""}
                            size="small"
                            disabled
                          />
                        </Grid>
                      </>
                    ) : (
                      <>
                        {/* Original project and customer fields for non-assign categories */}
                        {/* Project selection - filtered by customer (if customerId is set) */}
                        <Grid item xs={12} md={6}>
                          <Autocomplete
                            options={values.customerId ? filteredProjectsByCustomer(values.customerId) : normalizedProjects}
                            getOptionLabel={(option) => `${option?.code || ""} - ${option?.name || ""}`.trim() || ""}
                            isOptionEqualToValue={(option, value) => option?.id === value?.id}
                            value={
                              (values.customerId ? filteredProjectsByCustomer(values.customerId) : normalizedProjects).find((project) =>
                                Array.isArray(values.projectIds)
                                  ? values.projectIds.includes(project.id)
                                  : false
                              ) || null
                            }
                            loading={loadingProjects || loadingAssignProjects}
                            onChange={async (event, newValue) => {
                              const projectId = newValue?.id ?? null;
                              setFieldValue("projectIds", projectId ? [projectId] : []);

                              // Only fetch customer details if customerId is not already set
                              if (newValue && projectId && !values.customerId) {
                                try {
                                  const token = localStorage.getItem("token");
                                  
                                  // First, try to get customer from project-customer assignment (same as assign category)
                                  const assignResponse = await fetch(`${BASE_URL}/HelpDesk/GetCustomerByProjectId?projectId=${projectId}`, {
                                    method: "GET",
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                      "Content-Type": "application/json",
                                    },
                                  });
                                  
                                  if (assignResponse.ok) {
                                    const assignData = await assignResponse.json();
                                    if ((assignData.statusCode === 200 || assignData.status === "SUCCESS") && assignData.result) {
                                      // Customer found from assignment
                                      const customer = assignData.result;
                                      setFieldValue("customerId", customer.id);
                                      setFieldValue("customerName", customer.name || customer.displayName || "");
                                      setFieldValue("customerEmail", customer.email || "");
                                      setFieldValue("customerPhone", customer.phone || "");
                                      setFieldValue("customerCompany", customer.company || "");
                                      return;
                                    }
                                  }
                                  
                                  // Fallback: Get customerId from project details
                                  // Try to get customerId from the normalized project or from the original project data
                                  let customerId = newValue.customerIdNormalized || newValue.customerId || null;
                                  
                                  // If customerId is not in the normalized data, try to get it from the original project
                                  if (!customerId) {
                                    const sourceProjects = projectManagementProjects.length > 0 ? projectManagementProjects : assignProjects;
                                    const originalProject = sourceProjects.find(p => (p.projectId || p.id) === projectId);
                                    if (originalProject) {
                                      customerId = originalProject.customerId || null;
                                    }
                                  }
                                  
                                  // If still no customerId, fetch project details to get it
                                  if (!customerId) {
                                    const projectResponse = await fetch(`${BASE_URL}/ProjectManagementModule/projects/${projectId}`, {
                                      method: "GET",
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                        "Content-Type": "application/json",
                                      },
                                    });
                                    if (projectResponse.ok) {
                                      const projectData = await projectResponse.json();
                                      if (projectData.result && projectData.result.customerId) {
                                        customerId = projectData.result.customerId;
                                      }
                                    }
                                  }
                                  
                                  setFieldValue("customerId", customerId);
                                  
                                  // Fetch customer details if customerId exists
                                  if (customerId) {
                                    const customerResponse = await fetch(`${BASE_URL}/Customer/GetCustomerDetailByID?customerId=${customerId}`, {
                                      method: "GET",
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                        "Content-Type": "application/json",
                                      },
                                    });
                                    if (customerResponse.ok) {
                                      const customerData = await customerResponse.json();
                                      // The response structure is: { result: { result: [customer] } }
                                      const customer = Array.isArray(customerData?.result?.result) && customerData.result.result.length > 0 
                                        ? customerData.result.result[0] 
                                        : (Array.isArray(customerData?.result) && customerData.result.length > 0 ? customerData.result[0] : customerData?.result);
                                      
                                      if (customer) {
                                        // Set customer name from displayName, firstName+lastName, or company
                                        const customerName = customer.displayName || 
                                          (customer.firstName && customer.lastName 
                                            ? `${customer.firstName} ${customer.lastName}`.trim() 
                                            : customer.firstName || customer.lastName || customer.company || "");
                                        setFieldValue("customerName", customerName);
                                        
                                        // Set customer email and phone from contact details if available
                                        if (customer.customerContactDetails && customer.customerContactDetails.length > 0) {
                                          const contact = customer.customerContactDetails[0];
                                          setFieldValue("customerEmail", contact.emailAddress || "");
                                          setFieldValue("customerPhone", contact.contactNo || "");
                                        }
                                        setFieldValue("customerCompany", customer.company || "");
                                      }
                                    }
                                  }
                                } catch (error) {
                                  console.error("Error fetching customer details:", error);
                                }
                              }
                            }}
                            renderOption={(props, option) => (
                              <li {...props}>
                                <Box sx={{ display: "flex", flexDirection: "column" }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {option?.code ? `${option.code} - ` : ""}{option?.name || "Unnamed Project"}
                                  </Typography>
                                  {option.customerNameNormalized ? (
                                    <Typography variant="caption" color="text.secondary">
                                      {option.customerNameNormalized}
                                    </Typography>
                                  ) : null}
                                </Box>
                              </li>
                            )}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Project"
                                placeholder="Select project from Project Management"
                                size="small"
                                error={touched.projectIds && !!errors.projectIds}
                                helperText={touched.projectIds && errors.projectIds || (values.customerId ? "Showing projects for selected customer" : "")}
                              />
                            )}
                            noOptionsText={values.customerId ? "No projects found for this customer" : "No projects found"}
                            loadingText="Loading projects..."
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="customerName"
                            label="Customer Name"
                            value={values.customerName}
                            size="small"
                            disabled={true}
                            onChange={(e) => {
                              setFieldValue("customerName", e.target.value);
                              setFieldValue("customerId", null);
                            }}
                          />
                        </Grid>
                      </>
                    )}

                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={helpDeskSupportUsers}
                      getOptionLabel={(option) => {
                        if (!option) return "";
                        const name = `${option.firstName || ""} ${option.lastName || ""}`.trim();
                        return name || option.email || option.userName || "Unknown";
                      }}
                      isOptionEqualToValue={(option, value) => option?.id === value?.id}
                      value={helpDeskSupportUsers.find((u) => u?.id === values.assignedToUserId) || null}
                      onChange={(event, newValue) => {
                        setFieldValue("assignedToUserId", newValue?.id || null);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Assign To (Optional)" size="small" />
                      )}
                      noOptionsText="No help desk support users found"
                      loadingText="Loading help desk support users..."
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Field name="description">
                      {({ field, form }) => (
                        <RichTextEditor
                          value={field.value || ""}
                          onChange={(content) => {
                            form.setFieldValue("description", content);
                            form.setFieldTouched("description", true);
                          }}
                          error={touched.description && !!errors.description}
                          helperText={touched.description && errors.description}
                          label="Description *"
                        />
                      )}
                    </Field>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={touched.priority && !!errors.priority} size="small">
                      <InputLabel size="small">Priority</InputLabel>
                      <Field
                        as={Select}
                        name="priority"
                        label="Priority"
                        value={values.priority}
                        size="small"
                      >
                        {prioritySettings.length > 0 ? (
                          prioritySettings.map((priority) => (
                            <MenuItem key={priority.priority} value={priority.priority}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: priority.colorHex || "#2563EB",
                                  }}
                                />
                                {priority.displayName || priority.priority}
                              </Box>
                            </MenuItem>
                          ))
                        ) : (
                          <>
                            <MenuItem value={1}>Low</MenuItem>
                            <MenuItem value={2}>Medium</MenuItem>
                            <MenuItem value={3}>High</MenuItem>
                            <MenuItem value={4}>Critical</MenuItem>
                          </>
                        )}
                      </Field>
                      {touched.priority && errors.priority && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                          {errors.priority}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={touched.categoryId && !!errors.categoryId} size="small">
                      <InputLabel size="small">Category</InputLabel>
                      <Field name="categoryId">
                        {({ field, form }) => (
                          <Select
                            {...field}
                            label="Category"
                            size="small"
                            onChange={(e) => {
                              const newCategoryId = e.target.value;
                              const oldCategory = categories.find(cat => cat.id === field.value);
                              const newCategory = categories.find(cat => cat.id === newCategoryId);
                              const wasAssignCategory = oldCategory?.name?.toLowerCase() === "assign";
                              const isNowAssignCategory = newCategory?.name?.toLowerCase() === "assign";
                              
                              form.setFieldValue("categoryId", newCategoryId);
                              setSelectedCategoryId(newCategoryId);
                              
                              // Reset assign category fields when switching away from assign
                              if (wasAssignCategory && !isNowAssignCategory) {
                                form.setFieldValue("customerId", null);
                                form.setFieldValue("projectId", null);
                                form.setFieldValue("customerName", "");
                                form.setFieldValue("customerEmail", "");
                                form.setFieldValue("customerPhone", "");
                                form.setFieldValue("customerCompany", "");
                              }
                            }}
                          >
                            {categories.map((cat) => (
                              <MenuItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {touched.categoryId && errors.categoryId && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                          {errors.categoryId}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="startDate"
                      label="Start Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={values.startDate}
                      size="small"
                      onChange={(e) => setFieldValue("startDate", e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="startTime"
                      label="Start Time"
                      type="time"
                      InputLabelProps={{ shrink: true }}
                      value={values.startTime}
                      size="small"
                      onChange={(e) => setFieldValue("startTime", e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="dueDate"
                      label="Due Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={values.dueDate}
                      size="small"
                      onChange={(e) => setFieldValue("dueDate", e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="dueTime"
                      label="Due Time"
                      type="time"
                      InputLabelProps={{ shrink: true }}
                      value={values.dueTime}
                      size="small"
                      onChange={(e) => setFieldValue("dueTime", e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="flex-end" gap={2}>
                      <Button onClick={handleClose} variant="outlined">
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create Ticket"}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Form>
              )
            }}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}


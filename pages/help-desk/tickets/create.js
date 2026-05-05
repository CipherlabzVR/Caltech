import React, { useState, useEffect, useRef } from "react";
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
  CircularProgress,
  createFilterOptions,
  Checkbox,
  FormControlLabel,
  Divider,
  Paper,
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
import AddCustomerDialog from "@/pages/master/customers/create";
import CreateHelpDeskProjectModal from "@/pages/help-desk/projects/create";

const filter = createFilterOptions();

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
  const [masterProjects, setMasterProjects] = useState([]);
  const [assignCustomers, setAssignCustomers] = useState([]);
  const [assignProjects, setAssignProjects] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingAssignCustomers, setLoadingAssignCustomers] = useState(false);
  const [loadingAssignProjects, setLoadingAssignProjects] = useState(false);

  // State for Assign To
  const [helpDeskSupportUsers, setHelpDeskSupportUsers] = useState([]);
  const [loadingHelpDeskUsers, setLoadingHelpDeskUsers] = useState(false);
  const [customAssigneeNames, setCustomAssigneeNames] = useState([]); // Store custom names entered by user

  // State for Create Category Modal
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [refetchCategoriesKey, setRefetchCategoriesKey] = useState(0);

  // State for Create Customer Modal
  const [createCustomerModalOpen, setCreateCustomerModalOpen] = useState(false);
  const [customerAutocompleteOpen, setCustomerAutocompleteOpen] = useState(false);
  
  // State for Create Project Modal
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [projectAutocompleteOpen, setProjectAutocompleteOpen] = useState(false);


  // Check if current user is Admin or HelpDeskSupport
  const userType = typeof window !== "undefined" ? localStorage.getItem("type") : null;
  const userTypeNum = userType ? Number(userType) : null;
  const isAdmin = userTypeNum === 1 || userTypeNum === 0; // ADMIN = 1, SuperAdmin = 0
  const isHelpDeskSupportUser = userTypeNum === 14; // HelpDeskSupport = 14
  const canAssignTicket = isAdmin || isHelpDeskSupportUser;

  const { data: categoriesData } = useApi("/HelpDesk/GetAllCategories?SkipCount=0&MaxResultCount=1000&Search=null");
  const { data: prioritySettingsData } = useApi("/HelpDesk/GetPrioritySettings");

  // Update categories state when categoriesData changes
  useEffect(() => {
    if (categoriesData?.items) {
      setCategories(Array.isArray(categoriesData.items) ? categoriesData.items : []);
    } else if (Array.isArray(categoriesData)) {
      setCategories(categoriesData);
    } else if (categoriesData?.result && Array.isArray(categoriesData.result)) {
      setCategories(categoriesData.result);
    } else {
      setCategories([]);
    }
  }, [categoriesData, refetchCategoriesKey]);

  // Function to manually fetch categories
  const fetchCategories = async (preserveNewCategories = false) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/GetAllCategories?SkipCount=0&MaxResultCount=1000&Search=null`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Ensure items is always an array
        let items = [];
        if (Array.isArray(data?.items)) {
          items = data.items;
        } else if (Array.isArray(data?.result)) {
          items = data.result;
        } else if (Array.isArray(data)) {
          items = data;
        } else if (data?.items && typeof data.items === 'object') {
          // Handle case where items might be an object with array property
          items = Array.isArray(data.items.items) ? data.items.items : [];
        } else if (data?.result && typeof data.result === 'object') {
          // Handle case where result might be an object with array property
          items = Array.isArray(data.result.items) ? data.result.items : [];
        }
        
        // Ensure items is definitely an array before proceeding
        if (!Array.isArray(items)) {
          items = [];
        }
        
        if (preserveNewCategories) {
          // Merge with existing categories, preserving any temporary ones
          setCategories(prevCategories => {
            if (!Array.isArray(prevCategories)) return items;
            if (!Array.isArray(items)) return prevCategories;
            // Keep temporary categories (negative IDs) and merge with server categories
            const tempCategories = prevCategories.filter(cat => cat.id < 0);
            const serverIds = new Set(items.map(cat => cat.id));
            // Remove any existing categories that are now on the server (to avoid duplicates)
            const existingCategories = prevCategories.filter(cat => cat.id >= 0 && !serverIds.has(cat.id));
            return [...items, ...tempCategories, ...existingCategories];
          });
        } else {
          setCategories(items);
        }
        
        // Trigger refetch in useApi by updating the key
        setRefetchCategoriesKey(prev => prev + 1);
        // Return a promise that resolves after state is updated
        // Ensure we return an array
        const itemsToReturn = Array.isArray(items) ? items : [];
        return new Promise((resolve) => {
          setTimeout(() => resolve(itemsToReturn), 100);
        });
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to refresh categories");
    }
    return [];
  };

  // Ref to store the main form's formik instance
  const mainFormikRef = useRef(null);

  // Handle create category
  const handleCreateCategory = async (values, { setSubmitting, resetForm }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/CreateCategory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: values.name,
          description: values.description || "",
          isActive: values.isActive !== undefined ? values.isActive : true,
          ticketPrefix: values.ticketPrefix || "HD",
          ticketSuffix: values.ticketSuffix || "",
          sequencePadding: values.sequencePadding || 6,
        }),
      });

      const data = await response.json();

      if (response.ok && (data.status === "SUCCESS" || data.statusCode === 200 || !data.status || (data.status && data.status !== "ERROR" && data.status !== "FAIL"))) {
        toast.success(data.message || "Category created successfully!");
        resetForm();
        setCreateCategoryModalOpen(false);
        
        // Check if the API response contains the created category
        let newCategoryId = null;
        let newCategoryData = null;
        
        if (data.result) {
          newCategoryId = data.result.id;
          newCategoryData = data.result;
        } else if (data.data) {
          newCategoryId = data.data.id;
          newCategoryData = data.data;
        } else if (data.id) {
          newCategoryId = data.id;
          newCategoryData = data;
        }
        
        // Create category object to add to state immediately
        let categoryToAdd = null;
        if (newCategoryId) {
          categoryToAdd = newCategoryData || {
            id: newCategoryId,
            name: values.name,
            description: values.description || "",
            isActive: values.isActive !== undefined ? values.isActive : true,
            ticketPrefix: values.ticketPrefix || "HD",
            ticketSuffix: values.ticketSuffix || "",
            sequencePadding: values.sequencePadding || 6,
          };
        }
        
        // If we don't have an ID from response, create a temporary category object
        if (!categoryToAdd) {
          // Generate a temporary ID (negative number to indicate it's temporary)
          const tempId = -Date.now();
          categoryToAdd = {
            id: tempId,
            name: values.name,
            description: values.description || "",
            isActive: values.isActive !== undefined ? values.isActive : true,
            ticketPrefix: values.ticketPrefix || "HD",
            ticketSuffix: values.ticketSuffix || "",
            sequencePadding: values.sequencePadding || 6,
          };
        }
        
        // Add the category to state immediately so it appears in dropdown right away
        // This must happen synchronously before any async operations
        setCategories(prevCategories => {
          // Check if category already exists to avoid duplicates
          const exists = Array.isArray(prevCategories) && prevCategories.some(cat => 
            (cat.id === categoryToAdd.id) || 
            (cat.name && categoryToAdd.name && cat.name.toLowerCase() === categoryToAdd.name.toLowerCase())
          );
          if (exists) {
            return prevCategories;
          }
          
          // Add the new category to the beginning of the list
          return Array.isArray(prevCategories) ? [categoryToAdd, ...prevCategories] : [categoryToAdd];
        });
        
        // Select the category immediately (use a small delay to ensure state is updated)
        if (mainFormikRef.current && categoryToAdd.id) {
          // Use the actual ID if we have it, otherwise use the temp ID
          const idToSelect = newCategoryId || categoryToAdd.id;
          // Use requestAnimationFrame to ensure React has updated the state
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (mainFormikRef.current) {
                mainFormikRef.current.setFieldValue("categoryId", idToSelect);
                setSelectedCategoryId(idToSelect);
                mainFormikRef.current.setFieldTouched("categoryId", true);
              }
            }, 0);
          });
        }
        
        // Refresh categories in the background (don't await, let it happen async)
        // This ensures the category appears immediately while we fetch the full list
        // Pass preserveNewCategories=true to keep the newly added category
        fetchCategories(true).then((updatedCategories) => {
          if (Array.isArray(updatedCategories) && updatedCategories.length > 0) {
            // Find the category by name in the updated list
            const serverCategory = updatedCategories.find(cat => cat.name === values.name);
            if (serverCategory && serverCategory.id) {
              // Update state to replace temporary category with real one if needed
              setCategories(prevCategories => {
                if (!Array.isArray(prevCategories)) return updatedCategories;
                
                // If we used a temporary ID, replace it with the real one
                if (categoryToAdd.id < 0) {
                  const filtered = prevCategories.filter(cat => cat.id !== categoryToAdd.id);
                  // Check if real category already exists
                  const exists = filtered.some(cat => cat.id === serverCategory.id);
                  if (!exists) {
                    return [serverCategory, ...filtered];
                  }
                  return filtered;
                } else {
                  // If we already have the real ID, just ensure it's in the list
                  const exists = prevCategories.some(cat => cat.id === serverCategory.id);
                  if (!exists) {
                    return [serverCategory, ...prevCategories];
                  }
                  return prevCategories;
                }
              });
              
              // Update the form with the real category ID if it changed
              if (categoryToAdd.id < 0 && mainFormikRef.current) {
                setTimeout(() => {
                  if (mainFormikRef.current) {
                    mainFormikRef.current.setFieldValue("categoryId", serverCategory.id);
                    setSelectedCategoryId(serverCategory.id);
                  }
                }, 100);
              }
            }
          }
        }).catch(error => {
          console.error("Error refreshing categories:", error);
        });
        
        // For the rest of the code, use the category we just added
        const updatedCategories = [categoryToAdd];
        
        // Function to find and select the category from a categories array
        const findAndSelectCategory = (categoriesList) => {
          if (!Array.isArray(categoriesList)) return null;
          
          let categoryToSelect = null;
          
          // First, try to find by ID if we have it from the response
          if (newCategoryId) {
            categoryToSelect = categoriesList.find(cat => cat.id === newCategoryId);
          }
          
          // If not found by ID, try to find by name
          if (!categoryToSelect) {
            categoryToSelect = categoriesList.find(cat => cat.name === values.name);
          }
          
          return categoryToSelect;
        };
        
        // Try to find the category from the fetched list
        let newCategory = findAndSelectCategory(updatedCategories);
        
        // If not found, check the current state
        if (!newCategory) {
          // Wait a bit for state to update
          await new Promise(resolve => setTimeout(resolve, 200));
          newCategory = findAndSelectCategory(categories);
        }
        
        // If still not found, retry fetching
        if (!newCategory) {
          const retryCategories = await fetchCategories(true);
          await new Promise(resolve => setTimeout(resolve, 200));
          // Ensure retryCategories is an array
          if (Array.isArray(retryCategories)) {
            newCategory = findAndSelectCategory(retryCategories);
          }
        }
        
        // Select the new category in the form
        const categoryIdToSelect = newCategory?.id || newCategoryId;
        if (categoryIdToSelect && mainFormikRef.current) {
          // Use setTimeout to ensure the form and dropdown are ready
          setTimeout(() => {
            if (mainFormikRef.current) {
              mainFormikRef.current.setFieldValue("categoryId", categoryIdToSelect);
              setSelectedCategoryId(categoryIdToSelect);
              // Trigger validation to clear any errors
              mainFormikRef.current.setFieldTouched("categoryId", true);
            }
          }, 150);
        }
      } else {
        toast.error(data.message || "Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("An error occurred while creating the category");
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch HelpDeskSupport users
  const fetchHelpDeskSupportUsers = async () => {
    try {
      setLoadingHelpDeskUsers(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/User/GetUsersByUserType?userType=14`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        const users = Array.isArray(data) 
          ? data 
          : Array.isArray(data?.result) 
            ? data.result 
            : Array.isArray(data?.data)
              ? data.data
              : [];
        setHelpDeskSupportUsers(users);
        console.log(`CreateTicket: Found ${users.length} HelpDeskSupport users`);
        return users; // Return users for immediate use
      }
      return [];
    } catch (error) {
      console.error("Error fetching HelpDeskSupport users:", error);
      return [];
    } finally {
      setLoadingHelpDeskUsers(false);
    }
  };

  // Fetch HelpDeskSupport users on component mount
  useEffect(() => {
    fetchHelpDeskSupportUsers();
  }, []);

  // Handle adding new assignee name (just store the name, no user creation)
  const handleAddNewAssigneeName = (assigneeName, setFieldValue) => {
    if (!assigneeName || !assigneeName.trim()) {
      toast.error("Name is required");
      return;
    }

    const trimmedName = assigneeName.trim();
    
    // Add to custom names list if not already present
    if (!customAssigneeNames.includes(trimmedName)) {
      setCustomAssigneeNames([...customAssigneeNames, trimmedName]);
    }
    
    // Set the name directly (will be stored in AssignedToName field)
    setFieldValue("assignedToName", trimmedName);
    setFieldValue("assignedToUserId", null); // Clear user ID when using custom name
    
    toast.success(`Assignee "${trimmedName}" will be saved with the ticket`);
  };

  // Helper to get option label for Autocomplete
  const getAssigneeOptionLabel = (option) => {
    if (!option) return "";
    // Handle the "Add new" option
    if (option.inputValue) {
      return option.inputValue;
    }
    const name = `${option.firstName || ""} ${option.lastName || ""}`.trim();
    return name || option.email || option.userName || "Unknown";
  };


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

  // Refresh customers list function
  const refreshCustomers = async () => {
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
        return customerList;
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoadingCustomers(false);
    }
    return [];
  };

  // Refresh projects list function
  const refreshProjects = async () => {
    try {
      setLoadingProjects(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/GetProjectsForAssign`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        const projectList = Array.isArray(data?.result) ? data.result : (Array.isArray(data) ? data : []);
        setMasterProjects(projectList);
        return projectList;
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoadingProjects(false);
    }
    return [];
  };

  // Fetch project management projects on mount and when modal opens
  useEffect(() => {
    const fetchProjectManagementProjects = async () => {
      try {
        setLoadingProjects(true);
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/HelpDesk/GetProjectsForAssign`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          const projectList = Array.isArray(data?.result) ? data.result : (Array.isArray(data) ? data : []);
          setMasterProjects(projectList);
        }
      } catch (error) {
        console.error("Error fetching project management projects:", error);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjectManagementProjects();
  }, [open]);

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

  // Fetch projects for assign category from ProjectManagement
  const fetchAssignProjects = async () => {
    try {
      setLoadingAssignProjects(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/GetProjectsForAssign`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        const projectList = Array.isArray(data?.result) ? data.result : (Array.isArray(data) ? data : []);
        console.log("Fetched project management projects for assign:", projectList);
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

  // Fetch projects immediately on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingAssignProjects(true);
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/HelpDesk/GetProjectsForAssign`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          const projectList = Array.isArray(data?.result) ? data.result : (Array.isArray(data) ? data : []);
          console.log("Fetched project management projects for assign:", projectList);
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

  // Categories are now managed via state and useEffect

  const toNumericId = (value) => {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const deriveCustomerName = (project) => {
    const candidateNames = [
      project.ClientName,
      project.clientName,
      project.CustomerName,
      project.customerName,
      project.customer?.displayName,
      project.customer?.DisplayName,
      project.customer?.name,
      project.customer?.Name,
      project.customer?.customerName,
      project.customer?.CustomerName,
      project.customer?.company,
      project.customer?.Company,
      project.Customer?.displayName,
      project.Customer?.DisplayName,
      project.Customer?.name,
      project.Customer?.Name,
      project.Customer?.customerName,
      project.Customer?.CustomerName,
      project.Customer?.company,
      project.Customer?.Company,
      project.customerDetails?.displayName,
      project.customerDetails?.name,
      project.customerInfo?.displayName,
      project.customerInfo?.name,
    ];

    const fromParts = [
      [project.customer?.firstName, project.customer?.lastName],
      [project.customer?.FirstName, project.customer?.LastName],
      [project.Customer?.firstName, project.Customer?.lastName],
      [project.Customer?.FirstName, project.Customer?.LastName],
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
    // Use masterProjects or assignProjects (both from master projects API)
    const sourceProjects = masterProjects.length > 0 ? masterProjects : assignProjects;
    
    if (!sourceProjects || sourceProjects.length === 0) {
      console.log("No master projects available");
      return [];
    }

    return sourceProjects.map((project) => {
      // Master projects use 'Id' (capital I) or 'id'
      const projectId = project.Id || project.id || project.projectId;
      
      // Master projects use 'CustomerId' (capital C) or 'customerId'
      const customerIdCandidates = [
        project.CustomerId,
        project.customerId,
        project.assignedToCustomerId,
        project.AssignedToCustomerId,
        project.customer?.Id,
        project.customer?.id,
        project.customer?.customerId,
        project.customer?.CustomerId,
        project.Customer?.Id,
        project.Customer?.id,
        project.Customer?.customerId,
        project.Customer?.CustomerId,
      ];

      const customerId =
        customerIdCandidates
          .map((candidate) => toNumericId(candidate))
          .find((candidate) => candidate !== null && candidate !== undefined) ?? null;

      return {
        ...project,
        id: toNumericId(projectId), // Ensure id is numeric
        name: project.Name || project.name || "",
        code: project.Code || project.code || "",
        customerIdNormalized: customerId,
        customerNameNormalized: deriveCustomerName(project),
      };
    });
  }, [masterProjects, assignProjects]);

  // Filter projects by selected customer
  const filteredProjectsByCustomer = React.useMemo(() => {
    return (customerId) => {
      if (!customerId) {
        // If no customer selected, return all projects
        return normalizedProjects;
      }
      // Normalize the customer ID for comparison
      const normalizedCustomerId = toNumericId(customerId);
      if (!normalizedCustomerId) {
        return normalizedProjects;
      }
      
      return normalizedProjects.filter((project) => {
        const projectCustomerId = project.customerIdNormalized;
        // Compare normalized IDs
        return projectCustomerId !== null && projectCustomerId === normalizedCustomerId;
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
    if (!Array.isArray(categories) || !selectedCategoryId) return;
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
          assignedToName: values.assignedToName || null,
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
            innerRef={mainFormikRef}
            initialValues={{
              subject: "",
              description: "",
              priority: defaultPriorityValue,
              categoryId: "",
              assignedToUserId: null,
              assignedToName: null,
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
              const selectedCategory = Array.isArray(categories) ? categories.find(cat => cat.id === values.categoryId) : null;
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
              const selectedCategory = Array.isArray(categories) ? categories.find(cat => cat.id === values.categoryId) : null;
              const isAssignCategory = selectedCategory?.name?.toLowerCase() === "assign";

              return (
                <Form>
                  <Grid container spacing={2.5}>
                    {/* Customer Name and Project fields at the top */}
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        id="customer-autocomplete"
                        open={customerAutocompleteOpen}
                        onOpen={() => setCustomerAutocompleteOpen(true)}
                        onClose={() => setCustomerAutocompleteOpen(false)}
                        options={customers}
                        getOptionLabel={(option) => {
                          if (!option) return "";
                          if (option.isCreateOption) return "";
                          const displayName = option.displayName || 
                            (option.firstName && option.lastName 
                              ? `${option.firstName} ${option.lastName}`.trim() 
                              : option.firstName || option.lastName || option.name || option.company || "");
                          return displayName;
                        }}
                        filterOptions={(options, params) => {
                          const { inputValue } = params;
                          
                          // If no search input, show only first 10 customers (without Create option - it will be fixed at bottom)
                          if (!inputValue || inputValue.trim() === "") {
                            return options.slice(0, 10);
                          }
                          
                          // If searching, filter through all customers
                          const filtered = filter(options, {
                            ...params,
                            getOptionLabel: (option) => {
                              const displayName = option.displayName || 
                                (option.firstName && option.lastName 
                                  ? `${option.firstName} ${option.lastName}`.trim() 
                                  : option.firstName || option.lastName || option.name || option.company || "");
                              return displayName;
                            },
                          });

                          return filtered;
                        }}
                        isOptionEqualToValue={(option, value) => {
                          if (!option || !value) return false;
                          if (option.isCreateOption || value.isCreateOption) return false;
                          return option?.id === value?.id;
                        }}
                        value={customers.find(c => c.id === values.customerId) || null}
                        loading={loadingCustomers}
                        onChange={async (event, newValue) => {
                          if (newValue && newValue.isCreateOption) {
                            setCreateCustomerModalOpen(true);
                            return;
                          }
                          
                          if (newValue) {
                            const newCustomerId = newValue.id;
                            setFieldValue("customerId", newCustomerId);
                            
                            // Set customer name from displayName or build from firstName/lastName
                            const customerName = newValue.displayName || 
                              (newValue.firstName && newValue.lastName 
                                ? `${newValue.firstName} ${newValue.lastName}`.trim() 
                                : newValue.firstName || newValue.lastName || newValue.name || newValue.company || "");
                            setFieldValue("customerName", customerName);
                            
                            // Set customer email and phone if available
                            if (newValue.customerContactDetails && newValue.customerContactDetails.length > 0) {
                              const contact = newValue.customerContactDetails[0];
                              setFieldValue("customerEmail", contact.emailAddress || "");
                              setFieldValue("customerPhone", contact.contactNo || "");
                            } else {
                              setFieldValue("customerEmail", newValue.email || "");
                              setFieldValue("customerPhone", newValue.phone || newValue.contactNo || "");
                            }
                            setFieldValue("customerCompany", newValue.company || "");
                            
                            // Validate and clear project selection if it doesn't belong to the new customer
                            if (Array.isArray(values.projectIds) && values.projectIds.length > 0) {
                              const normalizedCustomerId = toNumericId(newCustomerId);
                              const currentProject = normalizedProjects.find(p => 
                                values.projectIds.includes(p.id)
                              );
                              
                              // If current project doesn't belong to new customer, clear it
                              if (currentProject && normalizedCustomerId) {
                                const projectCustomerId = currentProject.customerIdNormalized;
                                if (projectCustomerId !== normalizedCustomerId) {
                                  setFieldValue("projectIds", []);
                                }
                              } else {
                                setFieldValue("projectIds", []);
                              }
                            } else {
                              setFieldValue("projectIds", []);
                            }
                          } else {
                            // Clear all customer fields when selection is cleared
                            setFieldValue("customerId", null);
                            setFieldValue("customerName", "");
                            setFieldValue("customerEmail", "");
                            setFieldValue("customerPhone", "");
                            setFieldValue("customerCompany", "");
                            setFieldValue("projectIds", []);
                          }
                        }}
                        ListboxProps={{
                          sx: {
                            maxHeight: '300px',
                            overflowY: 'auto',
                            '&::-webkit-scrollbar': {
                              width: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                              background: '#f1f1f1',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              background: '#888',
                              borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                              background: '#555',
                            },
                          },
                        }}
                        PaperComponent={isAdmin ? (props) => (
                          <Paper {...props} sx={{ ...props.sx, position: 'relative', overflow: 'hidden' }}>
                            {props.children}
                            <Divider />
                            <Box
                              sx={{
                                p: 1.5,
                                bgcolor: 'background.paper',
                                borderTop: '1px solid',
                                borderColor: 'divider',
                                position: 'sticky',
                                bottom: 0,
                                zIndex: 1,
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: 'action.hover',
                                },
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCustomerAutocompleteOpen(false);
                                setTimeout(() => {
                                  setCreateCustomerModalOpen(true);
                                }, 100);
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main", fontWeight: 500 }}>
                                <AddIcon sx={{ fontSize: 18 }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  Create Customer
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        ) : undefined}
                        renderOption={(props, option) => {
                          const displayName = option.displayName || 
                            (option.firstName && option.lastName 
                              ? `${option.firstName} ${option.lastName}`.trim() 
                              : option.firstName || option.lastName || option.name || option.company || "");
                          return (
                            <li {...props} key={option.id}>
                              <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {displayName || "Unnamed Customer"}
                                </Typography>
                                {option.company && (
                                  <Typography variant="caption" color="text.secondary">
                                    {option.company}
                                  </Typography>
                                )}
                              </Box>
                            </li>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Customer Name"
                            placeholder="Search customer..."
                            size="small"
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {loadingCustomers ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                        noOptionsText="No customers found"
                        loadingText="Loading customers..."
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        id="project-autocomplete"
                        open={projectAutocompleteOpen}
                        onOpen={() => setProjectAutocompleteOpen(true)}
                        onClose={() => setProjectAutocompleteOpen(false)}
                        options={values.customerId ? filteredProjectsByCustomer(values.customerId) : normalizedProjects}
                        getOptionLabel={(option) => {
                          if (!option) return "";
                          if (option.isCreateOption) return "";
                          return `${option?.code || ""} - ${option?.name || ""}`.trim() || "";
                        }}
                        filterOptions={(options, params) => {
                          const { inputValue } = params;
                          
                          // If no search input, show only first 10 projects
                          if (!inputValue || inputValue.trim() === "") {
                            return options.slice(0, 10);
                          }
                          
                          // If searching, filter through all projects
                          const filtered = filter(options, {
                            ...params,
                            getOptionLabel: (option) => `${option?.code || ""} - ${option?.name || ""}`.trim() || "",
                          });
                          
                          return filtered;
                        }}
                        isOptionEqualToValue={(option, value) => {
                          if (!option || !value) return false;
                          if (option.isCreateOption || value.isCreateOption) return false;
                          return option?.id === value?.id;
                        }}
                        value={
                          (values.customerId ? filteredProjectsByCustomer(values.customerId) : normalizedProjects).find((project) =>
                            Array.isArray(values.projectIds)
                              ? values.projectIds.includes(project.id)
                              : false
                          ) || null
                        }
                        loading={loadingProjects || loadingAssignProjects}
                        onChange={async (event, newValue) => {
                          if (newValue && newValue.isCreateOption) {
                            setProjectAutocompleteOpen(false);
                            setTimeout(() => {
                              setCreateProjectModalOpen(true);
                            }, 100);
                            return;
                          }
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
                              let customerId = newValue.customerIdNormalized || newValue.customerId || newValue.CustomerId || null;
                              
                              // If customerId is not in the normalized data, try to get it from the original project
                              if (!customerId) {
                                const sourceProjects = masterProjects.length > 0 ? masterProjects : assignProjects;
                                const originalProject = sourceProjects.find(p => (p.Id || p.id || p.projectId) === projectId);
                                if (originalProject) {
                                  customerId = originalProject.CustomerId || originalProject.customerId || null;
                                }
                              }
                              
                              // If still no customerId, fetch project details from master projects API
                              if (!customerId) {
                                const projectResponse = await fetch(`${BASE_URL}/Project/GetProjectById?id=${projectId}`, {
                                  method: "GET",
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                  },
                                });
                                if (projectResponse.ok) {
                                  const projectData = await projectResponse.json();
                                  if (projectData.result) {
                                    customerId = projectData.result.CustomerId || projectData.result.customerId || null;
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
                        ListboxProps={{
                          sx: {
                            maxHeight: '300px',
                            overflowY: 'auto',
                            '&::-webkit-scrollbar': {
                              width: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                              background: '#f1f1f1',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              background: '#888',
                              borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                              background: '#555',
                            },
                          },
                        }}
                        PaperComponent={isAdmin ? (props) => (
                          <Paper {...props} sx={{ ...props.sx, position: 'relative', overflow: 'hidden' }}>
                            {props.children}
                            <Divider />
                            <Box
                              component="div"
                              role="button"
                              tabIndex={0}
                              sx={{
                                p: 1.5,
                                bgcolor: 'background.paper',
                                borderTop: '1px solid',
                                borderColor: 'divider',
                                position: 'sticky',
                                bottom: 0,
                                zIndex: 10,
                                cursor: 'pointer',
                                pointerEvents: 'auto',
                                userSelect: 'none',
                                '&:hover': {
                                  bgcolor: 'action.hover',
                                },
                                '&:active': {
                                  bgcolor: 'action.selected',
                                },
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Close the autocomplete first
                                setProjectAutocompleteOpen(false);
                                // Use requestAnimationFrame to ensure state updates properly
                                requestAnimationFrame(() => {
                                  setTimeout(() => {
                                    setCreateProjectModalOpen(true);
                                  }, 100);
                                });
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onMouseUp={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setProjectAutocompleteOpen(false);
                                  requestAnimationFrame(() => {
                                    setTimeout(() => {
                                      setCreateProjectModalOpen(true);
                                    }, 100);
                                  });
                                }
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main", fontWeight: 500 }}>
                                <AddIcon sx={{ fontSize: 18 }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  Create Project
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        ) : undefined}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Project"
                            placeholder={values.customerId ? "Select project for this customer" : "Select project from Project Management"}
                            size="small"
                            error={touched.projectIds && !!errors.projectIds}
                            helperText={
                              touched.projectIds && errors.projectIds 
                                ? errors.projectIds 
                                : values.customerId 
                                  ? `Showing projects assigned to selected customer (${filteredProjectsByCustomer(values.customerId).length} available)`
                                  : "Select a customer first to filter projects"
                            }
                          />
                        )}
                        noOptionsText={values.customerId ? "No projects found for the selected customer" : "No projects found"}
                        loadingText="Loading projects..."
                        key={`project-autocomplete-${values.customerId || 'no-customer'}`}
                      />
                    </Grid>

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
                    ) : null}

                  {/* Assign To dropdown - Only visible to Admin and HelpDeskSupport */}
                  {canAssignTicket && (
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        options={[
                          ...helpDeskSupportUsers,
                          ...customAssigneeNames.map(name => ({ id: null, firstName: name, lastName: "", isCustomName: true }))
                        ]}
                        loading={loadingHelpDeskUsers}
                        getOptionLabel={(option) => {
                          if (!option) return "";
                          // Handle the "Add new" option
                          if (option.inputValue) {
                            return option.inputValue;
                          }
                          // Handle custom names
                          if (option.isCustomName) {
                            return option.firstName || "";
                          }
                          const name = `${option.firstName || ""} ${option.lastName || ""}`.trim();
                          return name || option.email || option.userName || "Unknown";
                        }}
                        filterOptions={(options, params) => {
                          const filtered = filter(options, {
                            ...params,
                            getOptionLabel: (option) => {
                              if (option.isCustomName) {
                                return option.firstName || "";
                              }
                              const name = `${option.firstName || ""} ${option.lastName || ""}`.trim();
                              return name || option.email || option.userName || "";
                            },
                          });

                          const { inputValue } = params;
                          // Check if input matches existing option
                          const isExisting = options.some((option) => {
                            if (option.isCustomName) {
                              return (option.firstName || "").toLowerCase() === inputValue.toLowerCase();
                            }
                            const name = `${option.firstName || ""} ${option.lastName || ""}`.trim();
                            return name.toLowerCase() === inputValue.toLowerCase();
                          });

                          // Suggest adding a new value if it doesn't exist
                          if (inputValue !== "" && !isExisting && inputValue.trim().length > 0) {
                            filtered.push({
                              inputValue: inputValue.trim(),
                              isNewOption: true,
                              firstName: `Add "${inputValue.trim()}"`,
                            });
                          }

                          return filtered;
                        }}
                        isOptionEqualToValue={(option, value) => {
                          if (option.isCustomName && value?.isCustomName) {
                            return option.firstName === value.firstName;
                          }
                          return option?.id === value?.id;
                        }}
                        value={
                          values.assignedToName 
                            ? { id: null, firstName: values.assignedToName, lastName: "", isCustomName: true }
                            : helpDeskSupportUsers.find((u) => u?.id === values.assignedToUserId) || null
                        }
                        onChange={(event, newValue) => {
                          if (newValue && newValue.isNewOption) {
                            // Add new custom name
                            handleAddNewAssigneeName(newValue.inputValue, setFieldValue);
                          } else if (newValue && newValue.isCustomName) {
                            // Selected a custom name
                            setFieldValue("assignedToName", newValue.firstName);
                            setFieldValue("assignedToUserId", null);
                          } else if (newValue) {
                            // Selected an existing user
                            setFieldValue("assignedToUserId", newValue.id);
                            setFieldValue("assignedToName", null);
                          } else {
                            // Cleared selection
                            setFieldValue("assignedToUserId", null);
                            setFieldValue("assignedToName", null);
                          }
                        }}
                        selectOnFocus
                        clearOnBlur
                        handleHomeEndKeys
                        freeSolo
                        renderOption={(props, option) => {
                          if (option.isNewOption) {
                            return (
                              <li {...props} style={{ color: "#1976d2", fontWeight: 500 }}>
                                <AddIcon sx={{ mr: 1, fontSize: 18 }} />
                                {option.firstName}
                              </li>
                            );
                          }
                          if (option.isCustomName) {
                            return (
                              <li {...props} style={{ color: "#28a745", fontWeight: 500 }}>
                                {option.firstName}
                              </li>
                            );
                          }
                          const name = `${option.firstName || ""} ${option.lastName || ""}`.trim();
                          return (
                            <li {...props}>
                              {name || option.email || option.userName || "Unknown"}
                            </li>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            label="Assign To (Optional)" 
                            size="small"
                            placeholder="Select user or type name to add..."
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {loadingHelpDeskUsers ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                        noOptionsText="No users found. Type a name to add new."
                        loadingText="Loading help desk support users..."
                      />
                    </Grid>
                  )}

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
                      <Field name="priority">
                        {({ field, form }) => (
                          <Select
                            {...field}
                            label="Priority"
                            size="small"
                            onChange={(e) => {
                              const newPriority = e.target.value;
                              form.setFieldValue("priority", newPriority);
                              
                              // Check if the selected priority is Critical
                              const isCritical = (() => {
                                if (prioritySettings.length > 0) {
                                  const selectedPrioritySetting = prioritySettings.find(
                                    (p) => p.priority === newPriority
                                  );
                                  if (selectedPrioritySetting) {
                                    const displayName = (selectedPrioritySetting.displayName || "").toLowerCase();
                                    return displayName.includes("critical");
                                  }
                                }
                                // Fallback: check if value is 4 (Critical)
                                return newPriority === 4;
                              })();
                              
                              // If Critical, set Start Date to today
                              if (isCritical) {
                                const today = new Date().toISOString().split("T")[0];
                                form.setFieldValue("startDate", today);
                              }
                            }}
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
                          </Select>
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
                              
                              // Check if "Create Category" option was selected
                              if (newCategoryId === "CREATE_NEW") {
                                setCreateCategoryModalOpen(true);
                                // Reset the field value to prevent selecting "CREATE_NEW"
                                form.setFieldValue("categoryId", field.value || "");
                                return;
                              }
                              
                              const oldCategory = Array.isArray(categories) ? categories.find(cat => cat.id === field.value) : null;
                              const newCategory = Array.isArray(categories) ? categories.find(cat => cat.id === newCategoryId) : null;
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
                            {Array.isArray(categories) && categories.map((cat) => (
                              <MenuItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </MenuItem>
                            ))}
                            <Divider />
                            <MenuItem value="CREATE_NEW" sx={{ color: "primary.main", fontWeight: 500 }}>
                              <AddIcon sx={{ mr: 1, fontSize: 18 }} />
                              Create Category
                            </MenuItem>
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
                      disabled={(() => {
                        // Check if current priority is Critical
                        if (prioritySettings.length > 0) {
                          const selectedPrioritySetting = prioritySettings.find(
                            (p) => p.priority === values.priority
                          );
                          if (selectedPrioritySetting) {
                            const displayName = (selectedPrioritySetting.displayName || "").toLowerCase();
                            return displayName.includes("critical");
                          }
                        }
                        // Fallback: check if value is 4 (Critical)
                        return values.priority === 4;
                      })()}
                      onChange={(e) => {
                        // Only allow change if priority is not Critical
                        const isCritical = (() => {
                          if (prioritySettings.length > 0) {
                            const selectedPrioritySetting = prioritySettings.find(
                              (p) => p.priority === values.priority
                            );
                            if (selectedPrioritySetting) {
                              const displayName = (selectedPrioritySetting.displayName || "").toLowerCase();
                              return displayName.includes("critical");
                            }
                          }
                          return values.priority === 4;
                        })();
                        if (!isCritical) {
                          setFieldValue("startDate", e.target.value);
                        }
                      }}
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

      {/* Create Category Modal */}
      <Modal
        open={createCategoryModalOpen}
        onClose={() => setCreateCategoryModalOpen(false)}
        aria-labelledby="create-category-modal"
        aria-describedby="create-category-form"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { lg: 600, xs: 350 },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 3,
            borderRadius: 2,
          }}
        >
          <Typography id="create-category-modal" variant="h6" component="h2" mb={2} sx={{ fontWeight: 700 }}>
            Create New Category
          </Typography>

          <Formik
            initialValues={{
              name: "",
              description: "",
              ticketPrefix: "HD",
              ticketSuffix: "",
              sequencePadding: 6,
              isActive: true,
            }}
            validationSchema={Yup.object().shape({
              name: Yup.string().trim().required("Name is required"),
              description: Yup.string().trim(),
              ticketPrefix: Yup.string().trim().max(10, "Max 10 chars"),
              ticketSuffix: Yup.string().trim().max(10, "Max 10 chars"),
              sequencePadding: Yup.number()
                .typeError("Must be a number")
                .integer("Must be an integer")
                .min(1, "Min 1")
                .max(12, "Max 12")
                .required("Padding is required"),
              isActive: Yup.boolean(),
            })}
            onSubmit={handleCreateCategory}
          >
            {({ values, errors, touched, isSubmitting, setFieldValue }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="name"
                      label="Name *"
                      size="small"
                      error={touched.name && !!errors.name}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      multiline
                      rows={3}
                      name="description"
                      label="Description"
                      size="small"
                      error={touched.description && !!errors.description}
                      helperText={touched.description && errors.description}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="ticketPrefix"
                      label="Ticket Prefix"
                      placeholder="HD"
                      size="small"
                      error={touched.ticketPrefix && !!errors.ticketPrefix}
                      helperText={touched.ticketPrefix && errors.ticketPrefix}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="ticketSuffix"
                      label="Ticket Suffix"
                      placeholder=""
                      size="small"
                      error={touched.ticketSuffix && !!errors.ticketSuffix}
                      helperText={touched.ticketSuffix && errors.ticketSuffix}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="sequencePadding"
                      type="number"
                      label="Sequence Padding *"
                      placeholder="6"
                      size="small"
                      error={touched.sequencePadding && !!errors.sequencePadding}
                      helperText={touched.sequencePadding && errors.sequencePadding}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Field name="isActive">
                      {({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          }
                          label="Active"
                        />
                      )}
                    </Field>
                  </Grid>

                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="flex-end" gap={2}>
                      <Button
                        onClick={() => setCreateCategoryModalOpen(false)}
                        variant="outlined"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create Category"}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>

      {/* Create Customer Modal - Using Master Customer Create Component */}
      <AddCustomerDialog
        fetchItems={async (newCustomer) => {
          // Refresh customer list
          const updatedCustomers = await refreshCustomers();
          
          // If a new customer was created, select it in the form
          if (newCustomer && mainFormikRef.current) {
            // Wait a bit for state to update
            setTimeout(() => {
              if (mainFormikRef.current) {
                const customerId = newCustomer.id || newCustomer.Id;
                if (customerId) {
                  // Find the customer in the updated list
                  const foundCustomer = updatedCustomers.find(c => 
                    (c.id || c.Id) === customerId
                  ) || newCustomer;
                  
                  // Set customer fields
                  mainFormikRef.current.setFieldValue("customerId", customerId);
                  
                  // Set customer name from displayName or build from firstName/lastName
                  const customerName = foundCustomer.displayName || 
                    (foundCustomer.firstName && foundCustomer.lastName 
                      ? `${foundCustomer.firstName} ${foundCustomer.lastName}`.trim() 
                      : foundCustomer.firstName || foundCustomer.lastName || foundCustomer.name || foundCustomer.company || "");
                  mainFormikRef.current.setFieldValue("customerName", customerName);
                  
                  // Set customer email and phone if available
                  if (foundCustomer.customerContactDetails && foundCustomer.customerContactDetails.length > 0) {
                    const contact = foundCustomer.customerContactDetails[0];
                    mainFormikRef.current.setFieldValue("customerEmail", contact.emailAddress || "");
                    mainFormikRef.current.setFieldValue("customerPhone", contact.contactNo || "");
                  } else {
                    mainFormikRef.current.setFieldValue("customerEmail", foundCustomer.email || "");
                    mainFormikRef.current.setFieldValue("customerPhone", foundCustomer.phone || foundCustomer.contactNo || "");
                  }
                  mainFormikRef.current.setFieldValue("customerCompany", foundCustomer.company || "");
                  
                  // Clear project selection when customer changes
                  mainFormikRef.current.setFieldValue("projectIds", []);
                }
              }
            }, 200);
          }
        }}
        chartOfAccounts={[]}
        externalOpen={createCustomerModalOpen}
        onClose={() => setCreateCustomerModalOpen(false)}
        showButton={false}
      />

      {/* Create Project Modal - Using HelpDesk Project Create Component */}
      <CreateHelpDeskProjectModal
        open={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        fetchItems={async (newProject) => {
          if (newProject) {
            const projectId = toNumericId(newProject.id || newProject.Id || newProject.projectId);
            const customerId = toNumericId(newProject.CustomerId || newProject.customerId || newProject.customerIdNormalized);
            const projectEntry = {
              id: projectId,
              code: newProject.code || newProject.Code || "",
              name: newProject.name || newProject.Name || "",
              customerId: customerId,
              clientName: newProject.clientName || newProject.ClientName || "",
            };
            setMasterProjects(prev => {
              const exists = prev.some(p => toNumericId(p.id || p.Id) === projectId);
              return exists ? prev : [projectEntry, ...prev];
            });
            setAssignProjects(prev => {
              const exists = prev.some(p => toNumericId(p.id || p.Id) === projectId);
              return exists ? prev : [projectEntry, ...prev];
            });
          }

          refreshProjects();

          if (newProject && mainFormikRef.current) {
            setTimeout(() => {
              if (mainFormikRef.current) {
                const projectId = toNumericId(newProject.id || newProject.Id || newProject.projectId);
                if (projectId) {
                  mainFormikRef.current.setFieldValue("projectIds", [projectId]);

                  if (!mainFormikRef.current.values.customerId) {
                    const customerId = toNumericId(newProject.CustomerId || newProject.customerId || newProject.customerIdNormalized);
                    if (customerId) {
                      mainFormikRef.current.setFieldValue("customerId", customerId);
                    }
                  }
                }
              }
            }, 200);
          }
        }}
        showButton={false}
      />

    </>
  );
}


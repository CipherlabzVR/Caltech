import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Autocomplete,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import BASE_URL from "Base/api";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { formatDate } from "@/components/utils/formatHelper";

const validationSchema = Yup.object().shape({
  projectId: Yup.number().required("Project is required"),
  customerId: Yup.number().required("Customer is required"),
});

export default function ProjectCustomerAssign() {
  useEffect(() => {
    sessionStorage.setItem("category", "107");
  }, []);

  const cId = sessionStorage.getItem("category");
  const { navigate, create, remove } = IsPermissionEnabled(cId);

  // Fetch projects from Project Management module
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  
  // Fetch customers from Master Data
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
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
          console.log("Fetched projects:", projectList);
          setProjects(projectList);
        } else {
          console.error("Failed to fetch projects:", response.status, response.statusText);
          toast.error("Failed to fetch projects");
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error("Failed to fetch projects");
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

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
          const customerList = Array.isArray(data?.result) ? data.result : [];
          console.log("Fetched customers:", customerList);
          setCustomers(customerList);
        } else {
          console.error("Failed to fetch customers:", response.status, response.statusText);
          toast.error("Failed to fetch customers");
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("Failed to fetch customers");
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch existing assignments
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/GetProjectCustomerAssigns`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched assignments:", data);
        setAssignments(Array.isArray(data.result) ? data.result : []);
      } else {
        console.error("Failed to fetch assignments:", response.status, response.statusText);
        toast.error("Failed to fetch assignments");
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/HelpDesk/CreateProjectCustomerAssign?projectId=${values.projectId}&customerId=${values.customerId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("Create assignment response:", data);

      // Check if the response is successful (statusCode 200 = SUCCESS)
      if (response.ok && data.statusCode === 200) {
        toast.success(data.message || "Project-Customer assignment created successfully!");
        resetForm();
        await fetchAssignments();
      } else {
        // Handle error response
        const errorMessage = data.message || data.Message || "Failed to create assignment";
        console.error("Error creating assignment:", errorMessage, data);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error("An error occurred while creating the assignment");
    } finally {
      setSubmitting(false);
    }
  };

  if (!navigate) {
    return <div>Access Denied</div>;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Project and Customer Assign</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Help Desk / Project and Customer Assign</li>
        </ul>
      </div>

      <Grid container spacing={3}>
        {/* Form Section */}
        {create && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Assign Project to Customer
                </Typography>
                <Formik
                  initialValues={{ projectId: null, customerId: null }}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ values, errors, touched, setFieldValue, isSubmitting }) => (
                    <Form>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Autocomplete
                            options={projects}
                            getOptionLabel={(option) => `${option.code || ""} - ${option.name || ""}`.trim() || ""}
                            isOptionEqualToValue={(option, value) => option.projectId === value?.projectId}
                            value={projects.find((p) => p.projectId === values.projectId) || null}
                            onChange={async (event, newValue) => {
                              const selectedProjectId = newValue?.projectId || null;
                              setFieldValue("projectId", selectedProjectId);
                              
                              // Auto-populate customer from project's CustomerId
                              if (newValue?.customerId) {
                                setFieldValue("customerId", newValue.customerId);
                              } else {
                                // If project doesn't have customer, clear customer field
                                setFieldValue("customerId", null);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Project *"
                                placeholder="Select project from Project Management"
                                error={touched.projectId && !!errors.projectId}
                                helperText={touched.projectId && errors.projectId}
                              />
                            )}
                            loading={loadingProjects}
                            noOptionsText="No projects found"
                            loadingText="Loading projects..."
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Autocomplete
                            options={customers}
                            getOptionLabel={(option) =>
                              option.displayName ||
                              `${option.firstName || ""} ${option.lastName || ""}`.trim() ||
                              option.email ||
                              ""
                            }
                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                            value={customers.find((c) => c.id === values.customerId) || null}
                            onChange={(event, newValue) => {
                              setFieldValue("customerId", newValue?.id || null);
                            }}
                            renderInput={(params) => {
                              const selectedProject = projects.find(p => p.projectId === values.projectId);
                              const isDisabled = !!selectedProject?.customerId;
                              return (
                                <TextField
                                  {...params}
                                  label="Customer *"
                                  placeholder={isDisabled ? "Customer (auto-filled from project)" : "Select customer from Master Data"}
                                  error={touched.customerId && !!errors.customerId}
                                  helperText={touched.customerId && errors.customerId || (isDisabled ? "Customer is auto-filled from selected project" : "")}
                                  disabled={isDisabled}
                                />
                              );
                            }}
                            disabled={!!projects.find(p => p.projectId === values.projectId)?.customerId}
                            loading={loadingCustomers}
                            noOptionsText="No customers found"
                            loadingText="Loading customers..."
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Button
                            type="submit"
                            variant="contained"
                            startIcon={<AddIcon />}
                            disabled={isSubmitting}
                            sx={{ mt: 1 }}
                          >
                            {isSubmitting ? "Saving..." : "Save Assignment"}
                          </Button>
                        </Grid>
                      </Grid>
                    </Form>
                  )}
                </Formik>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Assignments List */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Existing Assignments
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Customer Email</TableCell>
                      <TableCell>Customer Phone</TableCell>
                      <TableCell>Created On</TableCell>
                      {remove && <TableCell>Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={remove ? 6 : 5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Loading...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : assignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={remove ? 6 : 5} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                            No assignments found. Create a new assignment above.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignments.map((assign) => (
                        <TableRow key={assign.id} hover>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <BusinessIcon sx={{ fontSize: "1rem", color: "primary.main" }} />
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {assign.projectName || "N/A"}
                                </Typography>
                                {assign.projectCode && (
                                  <Typography variant="caption" color="text.secondary">
                                    Code: {assign.projectCode}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <PersonIcon sx={{ fontSize: "1rem", color: "success.main" }} />
                              <Typography variant="body2">{assign.customerName || "N/A"}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{assign.customerEmail || "N/A"}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{assign.customerPhone || "N/A"}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {assign.createdOn ? formatDate(assign.createdOn) : "N/A"}
                            </Typography>
                          </TableCell>
                          {remove && (
                            <TableCell>
                              <DeleteConfirmationById
                                id={assign.id}
                                controller="HelpDesk/DeleteProjectCustomerAssign"
                                fetchItems={fetchAssignments}
                              />
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

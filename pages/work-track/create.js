import React, { useState } from "react";
import {
  Grid,
  Typography,
  TextField,
  Button,
  Modal,
  Box,
  IconButton,
  Autocomplete,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useApi from "@/components/utils/useApi";
import CreateCustomerModal from "./create-customer";
import CreateProjectModal from "./create-project";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 700, xs: "95%" },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  maxHeight: "90vh",
  overflowY: "auto",
};

const validationSchema = Yup.object().shape({
  customerId: Yup.number().nullable(),
  projectId: Yup.number().nullable(),
  remarks: Yup.string().trim(),
});

const normalizeToArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.result?.items)) return data.result.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.items)) return data.items;
  if (data && typeof data === "object") {
    const firstArray = Object.values(data).find((value) => Array.isArray(value));
    if (firstArray) return firstArray;
  }
  return [];
};

const toNumericId = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const getCustomerLabel = (customer) => {
  if (!customer) return "";
  if (customer.displayName) return customer.displayName;
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim();
  if (name) return name;
  return customer.company || customer.emailAddress || customer.email || "";
};

const getProjectLabel = (project) => {
  if (!project) return "";
  return project.name || project.code || "";
};

const buildCustomerOptions = (customersData) => {
  const normalized = normalizeToArray(customersData);
  const seen = new Set();

  return normalized
    .map((customer) => {
      const candidateIds = [
        customer?.id,
        customer?.customerId,
        customer?.customer?.id,
        customer?.customer?.customerId,
      ];

      const idCandidate = candidateIds.find(
        (candidate) => candidate !== null && candidate !== undefined
      );

      const id = toNumericId(idCandidate);
      const label = getCustomerLabel(customer);

      if (!id && !label) return null;
      if (id && seen.has(id)) return null;

      if (id) {
        seen.add(id);
      }

      return {
        ...customer,
        id,
        label,
      };
    })
    .filter(Boolean);
};

const buildProjectOptions = (projectsData) => {
  const normalized = normalizeToArray(projectsData);
  const seen = new Set();

  return normalized
    .map((project) => {
      const id = toNumericId(project?.id);
      const label = getProjectLabel(project);

      if (!id && !label) return null;
      if (id && seen.has(id)) return null;

      if (id) {
        seen.add(id);
      }

      return {
        ...project,
        id,
        label,
      };
    })
    .filter(Boolean);
};

export default function CreateWorkTrackModal({ open, onClose, fetchItems }) {
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [refreshCustomers, setRefreshCustomers] = useState(0);
  const [refreshProjects, setRefreshProjects] = useState(0);

  const {
    data: customersData,
    loading: customersLoading,
  } = useApi(`/Customer/GetAllCustomer?refresh=${refreshCustomers}`);
  
  const {
    data: projectsData,
    loading: projectsLoading,
  } = useApi(`/Project/GetAllProjects?refresh=${refreshProjects}`);

  const customerOptions = buildCustomerOptions(customersData);
  const projectOptions = buildProjectOptions(projectsData);

  const handleCustomerCreated = () => {
    setRefreshCustomers(prev => prev + 1);
    setCreateCustomerOpen(false);
  };

  const handleProjectCreated = () => {
    setRefreshProjects(prev => prev + 1);
    setCreateProjectOpen(false);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const token = localStorage.getItem("token");
      
      const selectedCustomer = customerOptions.find(
        (customer) => toNumericId(customer?.id) === toNumericId(values.customerId)
      ) || null;
      const customerName = getCustomerLabel(selectedCustomer);

      const selectedProject = projectOptions.find(
        (project) => toNumericId(project?.id) === toNumericId(values.projectId)
      ) || null;
      const projectName = getProjectLabel(selectedProject);

      const payload = {
        customerId: values.customerId || null,
        customerName: customerName || null,
        projectId: values.projectId || null,
        projectName: projectName || null,
        remarks: values.remarks?.trim() || null,
      };

      const response = await fetch(`${BASE_URL}/WorkTrack/CreateWorkTrack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && (data.status === "SUCCESS" || data.statusCode === 200)) {
        toast.success("Work Track created successfully!");
        resetForm();
        onClose();
        fetchItems();
      } else {
        const errorMessage = data.message || data.error || data.errorMessage || "Failed to create work track";
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while creating the work track");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} aria-labelledby="create-work-track-modal">
        <Box sx={style}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography id="create-work-track-modal" variant="h6" component="h2">
              Add Work Track
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Formik
            initialValues={{
              customerId: null,
              projectId: null,
              remarks: "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, setFieldValue, isSubmitting }) => (
              <Form>
                <Grid container spacing={2}>
                  {/* Customer Selection */}
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="flex-start" gap={1}>
                      <Box flex={1}>
                        <Autocomplete
                          options={customerOptions}
                          getOptionLabel={(option) => option?.label || getCustomerLabel(option) || ""}
                          isOptionEqualToValue={(option, value) =>
                            toNumericId(option?.id) === toNumericId(value?.id)
                          }
                          value={
                            customerOptions.find(
                              (customer) => toNumericId(customer?.id) === toNumericId(values.customerId)
                            ) || null
                          }
                          onChange={(event, newValue) => {
                            setFieldValue("customerId", toNumericId(newValue?.id));
                          }}
                          renderInput={(params) => (
                            <TextField {...params} label="Customer" />
                          )}
                          noOptionsText="No customers found"
                          loading={customersLoading}
                          loadingText="Loading customers..."
                        />
                      </Box>
                      <Button
                        variant="outlined"
                        size="large"
                        sx={{ minWidth: "auto", px: 2, height: 56 }}
                        onClick={() => setCreateCustomerOpen(true)}
                      >
                        <AddIcon />
                      </Button>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Select an existing customer or create a new one
                    </Typography>
                  </Grid>

                  {/* Project Selection */}
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="flex-start" gap={1}>
                      <Box flex={1}>
                        <Autocomplete
                          options={projectOptions}
                          getOptionLabel={(option) => option?.label || getProjectLabel(option) || ""}
                          isOptionEqualToValue={(option, value) =>
                            toNumericId(option?.id) === toNumericId(value?.id)
                          }
                          value={
                            projectOptions.find(
                              (project) => toNumericId(project?.id) === toNumericId(values.projectId)
                            ) || null
                          }
                          onChange={(event, newValue) => {
                            setFieldValue("projectId", toNumericId(newValue?.id));
                          }}
                          renderInput={(params) => (
                            <TextField {...params} label="Project" />
                          )}
                          noOptionsText="No projects found"
                          loading={projectsLoading}
                          loadingText="Loading projects..."
                        />
                      </Box>
                      <Button
                        variant="outlined"
                        size="large"
                        sx={{ minWidth: "auto", px: 2, height: 56 }}
                        onClick={() => setCreateProjectOpen(true)}
                      >
                        <AddIcon />
                      </Button>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Select an existing project or create a new one
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  {/* Remarks */}
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      multiline
                      rows={4}
                      name="remarks"
                      label="Remarks"
                      error={touched.remarks && !!errors.remarks}
                      helperText={touched.remarks && errors.remarks}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
                      <Button onClick={onClose} variant="outlined">
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create Work Track"}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>

      {/* Create Customer Modal */}
      <CreateCustomerModal
        open={createCustomerOpen}
        onClose={() => setCreateCustomerOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
}


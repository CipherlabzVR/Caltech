import React from "react";
import {
  Grid,
  Typography,
  TextField,
  Button,
  Modal,
  Box,
  IconButton,
  Autocomplete,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useApi from "@/components/utils/useApi";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 600, xs: "95%" },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  maxHeight: "90vh",
  overflowY: "auto",
};

const validationSchema = Yup.object().shape({
  name: Yup.string().trim().required("Project name is required"),
  description: Yup.string().trim(),
  customerId: Yup.number().required("Customer is required").typeError("Customer is required"),
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

export default function CreateHelpDeskProjectModal({ open: externalOpen, onClose: externalOnClose, fetchItems, showButton = true }) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [formKey, setFormKey] = React.useState(0);
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  
  const {
    data: customersData,
    loading: customersLoading,
  } = useApi("/Customer/GetAllCustomer");
  const customerOptions = buildCustomerOptions(customersData);

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else if (externalOpen === undefined) {
      setInternalOpen(false);
    }
    setFormKey(prev => prev + 1);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const token = localStorage.getItem("token");
      const selectedCustomer =
        customerOptions.find(
          (customer) => toNumericId(customer?.id) === toNumericId(values.customerId)
        ) || null;
      const customerName = getCustomerLabel(selectedCustomer);
      
      const payload = {
        name: (values.name || "").trim(),
        description: values.description?.trim() || null,
        customerId: values.customerId || null,
        customerName: customerName || null,
      };
      
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });
      
      const response = await fetch(`${BASE_URL}/HelpDesk/CreateHelpDeskProject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && (data.status === "SUCCESS" || data.statusCode === 200)) {
        toast.success("Project created successfully!");
        resetForm();
        handleClose();
        
        const projectFromResponse = data.result || data.data || data;
        const newProject = {
          id: projectFromResponse.id || projectFromResponse.Id || projectFromResponse.projectId,
          Id: projectFromResponse.Id || projectFromResponse.id || projectFromResponse.projectId,
          projectId: projectFromResponse.id || projectFromResponse.Id || projectFromResponse.projectId,
          name: projectFromResponse.name || projectFromResponse.Name || values.name,
          Name: projectFromResponse.Name || projectFromResponse.name || values.name,
          code: projectFromResponse.code || projectFromResponse.Code || "",
          Code: projectFromResponse.Code || projectFromResponse.code || "",
          CustomerId: projectFromResponse.CustomerId || projectFromResponse.customerId || values.customerId,
          customerId: projectFromResponse.customerId || projectFromResponse.CustomerId || values.customerId,
          customerIdNormalized: projectFromResponse.customerId || projectFromResponse.CustomerId || values.customerId,
          clientName: projectFromResponse.clientName || projectFromResponse.ClientName || customerName,
        };
        
        if (fetchItems) {
          fetchItems(newProject);
        }
      } else {
        const errorMessage = data.message || data.error || data.errorMessage || "Failed to create project";
        console.error("API Error Response:", data);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(error.message || "An error occurred while creating the project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="create-helpdesk-project-modal">
      <Box sx={style}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography id="create-helpdesk-project-modal" variant="h6" component="h2">
            Create New Project
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Formik
          key={formKey}
          enableReinitialize
          initialValues={{
            name: "",
            description: "",
            customerId: null,
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, isSubmitting }) => (
            <Form>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    fullWidth
                    name="name"
                    label="Project Name *"
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
                    error={touched.description && !!errors.description}
                    helperText={touched.description && errors.description}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    options={customerOptions}
                    getOptionLabel={getCustomerLabel}
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
                      <TextField
                        {...params}
                        label="Customer *"
                        error={touched.customerId && !!errors.customerId}
                        helperText={touched.customerId && errors.customerId}
                      />
                    )}
                    noOptionsText="No customers found"
                    loading={customersLoading}
                    loadingText="Loading customers..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
                    <Button onClick={handleClose} variant="outlined">
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Project"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </Box>
    </Modal>
  );
}

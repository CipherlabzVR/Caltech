import React from "react";
import {
  Grid,
  Typography,
  TextField,
  Button,
  Modal,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  status: Yup.number().required("Status is required"),
  customerId: Yup.number().nullable(),
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

const extractInitialCustomerId = (project) => {
  if (!project) return null;

  const candidateIds = [
    project.customerId,
    project.assignedCustomerId,
    project.assignedToCustomerId,
    project.customer?.id,
    project.customer?.customerId,
    project.customer?.customer?.id,
    project.customerDetails?.id,
    project.customerDetails?.customerId,
    project.customerInfo?.id,
    project.customerInfo?.customerId,
  ];

  const candidate = candidateIds.find((value) => value !== null && value !== undefined);
  if (candidate === undefined) return null;

  return toNumericId(candidate);
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

export default function EditProjectModal({ open, onClose, project, fetchItems }) {
  const {
    data: customersData,
    loading: customersLoading,
  } = useApi("/Customer/GetAllCustomer");
  const customerOptions = buildCustomerOptions(customersData);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const token = localStorage.getItem("token");
      const selectedCustomer =
        customerOptions.find(
          (customer) => toNumericId(customer?.id) === toNumericId(values.customerId)
        ) || null;
      const customerName = getCustomerLabel(selectedCustomer);
      const response = await fetch(`${BASE_URL}/Project/UpdateProject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: project.id,
          name: values.name,
          description: values.description || null,
          status: Number(values.status) || 1,
          customerId: values.customerId || null,
          assignedToCustomerId: values.customerId || null,
          customerName: customerName || null,
          assignedToUserId: null,
        }),
      });

      const data = await response.json();

      if (response.ok && (data.status === "SUCCESS" || data.statusCode === 200)) {
        toast.success("Project updated successfully!");
        onClose();
        fetchItems();
      } else {
        toast.error(data.message || "Failed to update project");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("An error occurred while updating the project");
    } finally {
      setSubmitting(false);
    }
  };

  if (!project) return null;

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="edit-project-modal">
      <Box sx={style}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography id="edit-project-modal" variant="h6" component="h2">
            Edit Project
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Formik
          initialValues={{
            name: project.name || "",
            description: project.description || "",
            status: project.status !== undefined && project.status !== null ? Number(project.status) : 1,
            customerId: extractInitialCustomerId(project),
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
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

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Field
                      as={Select}
                      name="status"
                      label="Status"
                      value={values.status}
                      onChange={(e) => setFieldValue("status", Number(e.target.value))}
                    >
                      <MenuItem value={1}>Open</MenuItem>
                      <MenuItem value={2}>Closed</MenuItem>
                      <MenuItem value={3}>In Progress</MenuItem>
                      <MenuItem value={4}>Completed</MenuItem>
                      <MenuItem value={5}>Cancelled</MenuItem>
                    </Field>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
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
                      <TextField {...params} label="Assigned Customer (Optional)" />
                    )}
                    noOptionsText="No customers found"
                    loading={customersLoading}
                    loadingText="Loading customers..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
                    <Button onClick={onClose} variant="outlined">
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                      {isSubmitting ? "Updating..." : "Update Project"}
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


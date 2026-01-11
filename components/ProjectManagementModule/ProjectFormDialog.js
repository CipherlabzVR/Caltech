import { useMemo } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Formik } from "formik";
import * as Yup from "yup";
import dayjs from "dayjs";


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

  return (
    customer.company ||
    customer.companyName ||
    customer.customerName ||
    customer.emailAddress ||
    customer.email ||
    ""
  );
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

const extractCustomerContact = (customer) => {
  if (!customer) {
    return { phone: "", email: "" };
  }

  const phoneCandidates = [
    customer.phoneNumber,
    customer.mobileNumber,
    customer.contactNumber,
    customer.contactNo,
    customer.telephone,
    customer.phone,
    customer.phoneNo,
    customer.primaryContact?.phoneNumber,
    customer.primaryContact?.contactNumber,
    customer.customer?.phoneNumber,
  ];

  const emailCandidates = [
    customer.emailAddress,
    customer.email,
    customer.mailAddress,
    customer.primaryContact?.emailAddress,
    customer.primaryContact?.email,
    customer.customer?.emailAddress,
  ];

  const phone =
    phoneCandidates.find(
      (value) => typeof value === "string" && value.trim().length > 0
    ) || "";
  const email =
    emailCandidates.find(
      (value) => typeof value === "string" && value.trim().length > 0
    ) || "";

  return { phone, email };
};

const extractProjectName = (project) => {
  if (!project) return "";

  const candidates = [
    project.name,
    project.projectName,
    project.title,
    project.displayName,
    project.templateName,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return "";
};

const buildProjectNameOptions = (projectsData) => {
  const normalized = normalizeToArray(projectsData);
  const names = normalized
    .map((project) => extractProjectName(project))
    .filter((name) => name.length > 0);

  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
};

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required("Project name is required")
    .min(2, "Project name must be at least 2 characters")
    .max(128, "Project name cannot exceed 128 characters")
    .trim(),
  clientName: Yup.string()
    .nullable()
    .max(128, "Client name cannot exceed 128 characters"),
  clientPhoneNumber: Yup.string()
    .nullable()
    .matches(/^[0-9+\-\s()]*$/, "Please enter a valid phone number (digits, +, -, spaces, and parentheses only)")
    .max(32, "Phone number cannot exceed 32 characters"),
  clientEmail: Yup.string()
    .nullable()
    .email("Please enter a valid email address (e.g., example@domain.com)")
    .max(128, "Email address cannot exceed 128 characters"),
  advancedAmount: Yup.number()
    .nullable()
    .typeError("Advanced amount must be a number")
    .min(0, "Advanced amount cannot be negative")
    .test("max-value", "Advanced amount is too large", (value) => {
      if (value === null || value === undefined) return true;
      return value <= 999999999.99;
    }),
  budgetAmount: Yup.number()
    .nullable()
    .typeError("Budget amount must be a number")
    .min(0, "Budget amount cannot be negative")
    .test("max-value", "Budget amount is too large", (value) => {
      if (value === null || value === undefined) return true;
      return value <= 999999999.99;
    }),
  startDate: Yup.date()
    .required("Start date is required")
    .typeError("Please select a valid start date"),
  endDate: Yup.date()
    .required("End date is required")
    .typeError("Please select a valid end date")
    .min(Yup.ref("startDate"), "End date must be on or after the start date"),
  description: Yup.string()
    .nullable()
    .max(1024, "Description cannot exceed 1024 characters"),
  notes: Yup.string()
    .nullable()
    .max(2048, "Notes cannot exceed 2048 characters"),
  customerId: Yup.number().nullable(),
  primaryOwnerId: Yup.number().nullable(),
  memberIds: Yup.array().of(Yup.number()).nullable(),
});

const ProjectFormDialog = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  teamMembers = [],
  title = "New Project",
  customersData,
  customersLoading = false,
  masterProjectsData,
  masterProjectsLoading = false,
}) => {
  const defaultValues = useMemo(
    () => ({
      name: "",
      clientName: "",
      clientPhoneNumber: "",
      clientEmail: "",
      advancedAmount: null,
      budgetAmount: null,
      startDate: dayjs().startOf("day"),
      endDate: dayjs().add(7, "day").startOf("day"),
      primaryOwnerId: null,
      description: "",
      notes: "",
      memberIds: [],
      customerId: null,
      ...(initialValues || {}),
    }),
    [initialValues]
  );

  const customerOptions = useMemo(
    () => buildCustomerOptions(customersData),
    [customersData]
  );

  const projectNameOptions = useMemo(
    () => buildProjectNameOptions(masterProjectsData),
    [masterProjectsData]
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>
      <Formik
        initialValues={defaultValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={async (values, helpers) => {
          try {
            const sanitizeString = (input, maxLength) => {
              if (input === null || input === undefined) {
                return input;
              }
              const stringValue = String(input).trim();
              if (!maxLength || stringValue.length <= maxLength) {
                return stringValue;
              }
              return stringValue.slice(0, maxLength);
            };

            const sanitizedName = sanitizeString(values.name, 128);
            const sanitizedClientName = sanitizeString(values.clientName, 128);
            const sanitizedPhone = sanitizeString(values.clientPhoneNumber, 32) || null;
            const sanitizedEmail = sanitizeString(values.clientEmail, 128) || null;
            const sanitizedDescription = sanitizeString(values.description, 1024) || null;
            const sanitizedNotes = sanitizeString(values.notes, 2048) || null;

            const normalizedAdvanced =
              values.advancedAmount === "" || values.advancedAmount === null
                ? null
                : Number(values.advancedAmount);
            const safeAdvanced =
              normalizedAdvanced !== null && !Number.isNaN(normalizedAdvanced)
                ? normalizedAdvanced
                : null;

            const normalizedBudget =
              values.budgetAmount === "" || values.budgetAmount === null
                ? null
                : Number(values.budgetAmount);
            const safeBudget =
              normalizedBudget !== null && !Number.isNaN(normalizedBudget)
                ? normalizedBudget
                : null;

            let normalizedFullAmount =
              values.fullAmount !== undefined && values.fullAmount !== null
                ? Number(values.fullAmount)
                : null;

            if (normalizedFullAmount !== null && Number.isNaN(normalizedFullAmount)) {
              normalizedFullAmount = null;
            }

            if (normalizedFullAmount === null) {
              if (safeBudget !== null) {
                normalizedFullAmount = safeBudget;
              } else if (safeAdvanced !== null) {
                normalizedFullAmount = safeAdvanced;
              } else {
                normalizedFullAmount = 0;
              }
            }

            if (safeAdvanced !== null && safeAdvanced > normalizedFullAmount) {
              normalizedFullAmount = safeAdvanced;
            }

            const primaryOwnerIdRaw = values.primaryOwnerId;
            const primaryOwnerIdNumber = Number(primaryOwnerIdRaw);
            const normalizedPrimaryOwnerId =
              Number.isInteger(primaryOwnerIdNumber) && primaryOwnerIdNumber > 0
                ? primaryOwnerIdNumber
                : null;

            const normalizedMemberIds = Array.isArray(values.memberIds)
              ? values.memberIds
                  .map((id) => Number(id))
                  .filter((id) => Number.isInteger(id) && id > 0)
              : [];

            const normalizedCustomerId = toNumericId(values.customerId);

            const payload = {
              ...values,
              name: sanitizedName,
              clientName: sanitizedClientName,
              clientPhoneNumber: sanitizedPhone,
              clientEmail: sanitizedEmail,
              description: sanitizedDescription,
              notes: sanitizedNotes,
              primaryOwnerId: normalizedPrimaryOwnerId,
              memberIds: normalizedMemberIds,
              fullAmount: normalizedFullAmount,
              advancedAmount: safeAdvanced,
              budgetAmount: safeBudget,
              startDate: dayjs(values.startDate).toISOString(),
              endDate: dayjs(values.endDate).toISOString(),
              customerId: normalizedCustomerId,
            };

            await onSubmit(payload);
            helpers.setSubmitting(false);
          } catch (error) {
            helpers.setSubmitting(false);
            helpers.setStatus({
              success: false,
              message: error.message,
            });
          }
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleSubmit,
          setFieldValue,
          setFieldTouched,
          isSubmitting,
          status,
        }) => (
          <>
            <DialogContent dividers sx={{ pt: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      freeSolo
                      options={projectNameOptions}
                      value={values.name ?? ""}
                      inputValue={values.name ?? ""}
                      onChange={(_, newValue) => {
                        setFieldValue("name", newValue ?? "");
                      }}
                      onInputChange={(_, newInputValue) => {
                        if (newInputValue !== undefined) {
                          setFieldValue("name", newInputValue ?? "");
                        }
                      }}
                      loading={masterProjectsLoading}
                      loadingText="Loading master projects..."
                      noOptionsText={
                        masterProjectsLoading
                          ? "Loading master projects..."
                          : "No matching master projects"
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Project Name"
                          error={touched.name && Boolean(errors.name)}
                          helperText={touched.name && errors.name}
                          onBlur={(event) => {
                            if (
                              params.inputProps &&
                              typeof params.inputProps.onBlur === "function"
                            ) {
                              params.inputProps.onBlur(event);
                            }
                            setFieldTouched("name", true, true);
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      freeSolo
                      options={customerOptions}
                      inputValue={values.clientName ?? ""}
                      value={
                        customerOptions.find(
                          (customer) =>
                            toNumericId(customer.id) === toNumericId(values.customerId)
                        ) || null
                      }
                      onChange={(_, newValue) => {
                        // newValue can be an option object or a string (freeSolo)
                        if (typeof newValue === "string") {
                          setFieldValue("customerId", null);
                          setFieldValue("clientName", newValue);
                          return;
                        }

                        setFieldValue("customerId", newValue ? toNumericId(newValue.id) : null);
                        if (newValue) {
                          setFieldValue("clientName", newValue.label || "");
                          const { phone, email } = extractCustomerContact(newValue);
                          if (phone) {
                            setFieldValue("clientPhoneNumber", phone);
                          }
                          if (email) {
                            setFieldValue("clientEmail", email);
                          }
                        }
                      }}
                      onInputChange={(_, newInputValue, reason) => {
                        // When typing, treat it as a new customer name candidate
                        if (reason === "input") {
                          setFieldValue("clientName", newInputValue ?? "");
                          setFieldValue("customerId", null);
                        }
                      }}
                      getOptionLabel={(option) =>
                        typeof option === "string" ? option : option?.label ?? ""
                      }
                      isOptionEqualToValue={(option, value) =>
                        toNumericId(option?.id) === toNumericId(value?.id)
                      }
                      loading={customersLoading}
                      loadingText="Loading customers..."
                      noOptionsText={
                        customersLoading
                          ? "Loading..."
                          : values.clientName
                          ? "No match. Type to add a new customer."
                          : "No customers found"
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Customer"
                          placeholder="Search or type a new customer"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="clientPhoneNumber"
                      label="Client Phone"
                      fullWidth
                      value={values.clientPhoneNumber}
                      onChange={handleChange}
                      error={
                        touched.clientPhoneNumber &&
                        Boolean(errors.clientPhoneNumber)
                      }
                      helperText={
                        touched.clientPhoneNumber && errors.clientPhoneNumber
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="clientEmail"
                      label="Client Email"
                      fullWidth
                      value={values.clientEmail}
                      onChange={handleChange}
                      error={touched.clientEmail && Boolean(errors.clientEmail)}
                      helperText={touched.clientEmail && errors.clientEmail}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="advancedAmount"
                      label="Advanced Amount"
                      type="number"
                      fullWidth
                      value={values.advancedAmount ?? ""}
                      onChange={(event) => {
                        const val = event.target.value;
                        setFieldValue(
                          "advancedAmount",
                          val === "" ? null : Number(val)
                        );
                      }}
                      error={
                        touched.advancedAmount && Boolean(errors.advancedAmount)
                      }
                      helperText={
                        touched.advancedAmount && errors.advancedAmount
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="budgetAmount"
                      label="Budget Amount"
                      type="number"
                      fullWidth
                      value={values.budgetAmount ?? ""}
                      onChange={(event) => {
                        const val = event.target.value;
                        setFieldValue(
                          "budgetAmount",
                          val === "" ? null : Number(val)
                        );
                      }}
                      error={
                        touched.budgetAmount && Boolean(errors.budgetAmount)
                      }
                      helperText={touched.budgetAmount && errors.budgetAmount}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="Start Date"
                      value={values.startDate ? dayjs(values.startDate) : null}
                      onChange={(date) => setFieldValue("startDate", date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={touched.startDate && Boolean(errors.startDate)}
                          helperText={touched.startDate && errors.startDate}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="End Date"
                      value={values.endDate ? dayjs(values.endDate) : null}
                      onChange={(date) => setFieldValue("endDate", date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={touched.endDate && Boolean(errors.endDate)}
                          helperText={touched.endDate && errors.endDate}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="primaryOwnerId"
                      select
                      label="Primary Owner"
                      fullWidth
                      value={values.primaryOwnerId ?? ""}
                      onChange={(event) =>
                        setFieldValue(
                          "primaryOwnerId",
                          event.target.value === "" ? null : event.target.value
                        )
                      }
                    >
                      <MenuItem value="">
                        <em>Unassigned</em>
                      </MenuItem>
                      {teamMembers.map((member) => (
                        <MenuItem key={member.memberId} value={member.memberId}>
                          {member.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      multiple
                      options={teamMembers}
                      value={teamMembers.filter((member) =>
                        (values.memberIds || []).includes(member.memberId)
                      )}
                      getOptionLabel={(option) => option.name}
                      onChange={(_, newValue) =>
                        setFieldValue(
                          "memberIds",
                          newValue.map((member) => member.memberId)
                        )
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Project Members"
                          placeholder="Select members"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="description"
                      label="Project Description"
                      fullWidth
                      multiline
                      minRows={3}
                      value={values.description}
                      onChange={handleChange}
                      error={touched.description && Boolean(errors.description)}
                      helperText={touched.description && errors.description}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="notes"
                      label="Internal Notes"
                      fullWidth
                      multiline
                      minRows={3}
                      value={values.notes}
                      onChange={handleChange}
                      error={touched.notes && Boolean(errors.notes)}
                      helperText={touched.notes && errors.notes}
                    />
                  </Grid>
                </Grid>
              </LocalizationProvider>
            </DialogContent>
            <DialogActions
              sx={{
                px: 3,
                py: 2,
                justifyContent: "space-between",
                borderTop: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box>
                {status?.message ? (
                  <Box
                    component="span"
                    sx={{ color: "error.main", fontSize: 13, mr: 2 }}
                  >
                    {status.message}
                  </Box>
                ) : null}
              </Box>
              <Box display="flex" gap={1}>
                <Button onClick={onClose} color="inherit">
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Project"}
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default ProjectFormDialog;


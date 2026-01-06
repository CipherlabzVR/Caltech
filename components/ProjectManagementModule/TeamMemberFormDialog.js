import { Formik } from "formik";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@mui/material";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required("Member name is required")
    .min(2, "Member name must be at least 2 characters")
    .max(200, "Member name cannot exceed 200 characters")
    .trim(),
  position: Yup.string()
    .nullable()
    .max(100, "Position cannot exceed 100 characters"),
  email: Yup.string()
    .nullable()
    .email("Please enter a valid email address (e.g., example@domain.com)")
    .max(200, "Email address cannot exceed 200 characters"),
  mobileNumber: Yup.string()
    .nullable()
    .matches(/^[0-9+\-\s()]*$/, "Please enter a valid phone number (digits, +, -, spaces, and parentheses only)")
    .max(20, "Mobile number cannot exceed 20 characters"),
  employeeId: Yup.string()
    .nullable()
    .max(50, "Employee ID cannot exceed 50 characters"),
});

const TeamMemberFormDialog = ({
  open,
  onClose,
  initialValues,
  onSubmit,
  title = "Add Team Member",
}) => {
  const defaults = {
    name: "",
    position: "",
    email: "",
    mobileNumber: "",
    employeeId: "",
    isActive: true,
    ...(initialValues || {}),
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>
      <Formik
        initialValues={defaults}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={async (values, helpers) => {
          try {
            await onSubmit(values);
            helpers.setSubmitting(false);
          } catch (error) {
            helpers.setSubmitting(false);
            helpers.setStatus({ success: false, message: error.message });
          }
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleSubmit,
          isSubmitting,
          status,
        }) => (
          <>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    name="name"
                    label="Member Name"
                    fullWidth
                    value={values.name}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="position"
                    label="Role / Position"
                    fullWidth
                    value={values.position}
                    onChange={handleChange}
                    error={touched.position && Boolean(errors.position)}
                    helperText={touched.position && errors.position}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="email"
                    label="Email"
                    fullWidth
                    value={values.email}
                    onChange={handleChange}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="mobileNumber"
                    label="Mobile"
                    fullWidth
                    value={values.mobileNumber}
                    onChange={handleChange}
                    error={touched.mobileNumber && Boolean(errors.mobileNumber)}
                    helperText={touched.mobileNumber && errors.mobileNumber}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="employeeId"
                    label="Employee ID"
                    fullWidth
                    value={values.employeeId}
                    onChange={handleChange}
                    error={touched.employeeId && Boolean(errors.employeeId)}
                    helperText={touched.employeeId && errors.employeeId}
                  />
                </Grid>
              </Grid>
              {status?.message ? (
                <Box sx={{ mt: 2, color: "error.main", fontSize: 13 }}>
                  {status.message}
                </Box>
              ) : null}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={onClose} color="inherit">
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Member"}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default TeamMemberFormDialog;


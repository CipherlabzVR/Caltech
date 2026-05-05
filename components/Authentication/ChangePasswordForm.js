import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import { Typography, IconButton, InputAdornment } from "@mui/material";
import { Box } from "@mui/system";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useFormik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

const validationSchema = Yup.object({
  Password: Yup.string().required("Current password is required"),
  NewPassword: Yup.string()
    .required("Password is required")
    .matches(
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/,
      "Password must contain at least 8 characters, including one lowercase, one uppercase, one number, and one special character (!@#$%^&*)"
    ),
  ConfirmNewPassword: Yup.string()
    .required("Confirm Password is required")
    .oneOf([Yup.ref("NewPassword"), null], "Passwords must match"),
});

const handleSubmit = async (values, { resetForm }) => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${BASE_URL}/User/ChangePassword`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (data.statusCode === 200) {
      toast.success(data.result);
      resetForm(); 
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error(error.message || "Password change failed. Please try again.");
  }
};

const ChangePasswordForm = ({ embedded = false }) => {
  const formik = useFormik({
    initialValues: {
      Password: "",
      NewPassword: "",
      ConfirmNewPassword: "",
    },
    validationSchema,
    onSubmit: handleSubmit,
  });

  const [showPassword, setShowPassword] = useState({
    Password: false,
    NewPassword: false,
    ConfirmNewPassword: false,
  });

  const toggleShowPassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const buildPasswordAdornment = (field) => ({
    style: { borderRadius: 8 },
    endAdornment: (
      <InputAdornment position="end">
        <IconButton
          aria-label={`toggle ${field} visibility`}
          onClick={() => toggleShowPassword(field)}
          onMouseDown={(e) => e.preventDefault()}
          edge="end"
          size="small"
        >
          {showPassword[field] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
        </IconButton>
      </InputAdornment>
    ),
  });

  const content = (
    <Grid item xs={12}>
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography component="h2" fontSize={embedded ? "22px" : "28px"} fontWeight="700" mb="10px">
            Change Password
          </Typography>
          <Typography fontSize="14px" color="text.secondary">
            Update your password to keep your account secure.
          </Typography>
        </Box>

        <Box component="form" noValidate onSubmit={formik.handleSubmit}>
          <Box
            sx={{
              background: embedded ? "#F8FAFC" : "#fff",
              padding: embedded ? "24px" : "30px 20px",
              borderRadius: "16px",
              mb: "20px",
              border: embedded ? "1px solid #E5E7EB" : "none",
            }}
          >
            <Grid container alignItems="center" spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="Password"
                  type={showPassword.Password ? "text" : "password"}
                  required
                  fullWidth
                  label="Current Password"
                  value={formik.values.Password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.Password &&
                    Boolean(formik.errors.Password)
                  }
                  helperText={
                    formik.touched.Password && formik.errors.Password
                  }
                  InputProps={buildPasswordAdornment("Password")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="NewPassword"
                  type={showPassword.NewPassword ? "text" : "password"}
                  required
                  fullWidth
                  label="New Password"
                  value={formik.values.NewPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.NewPassword &&
                    Boolean(formik.errors.NewPassword)
                  }
                  helperText={
                    formik.touched.NewPassword && formik.errors.NewPassword
                  }
                  InputProps={buildPasswordAdornment("NewPassword")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="ConfirmNewPassword"
                  type={showPassword.ConfirmNewPassword ? "text" : "password"}
                  required
                  fullWidth
                  label="Confirm Password"
                  value={formik.values.ConfirmNewPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.ConfirmNewPassword &&
                    Boolean(formik.errors.ConfirmNewPassword)
                  }
                  helperText={
                    formik.touched.ConfirmNewPassword &&
                    formik.errors.ConfirmNewPassword
                  }
                  InputProps={buildPasswordAdornment("ConfirmNewPassword")}
                />
              </Grid>
            </Grid>
          </Box>

          <Button
            type="submit"
            fullWidth={!embedded}
            variant="contained"
            sx={{
              mt: 1,
              textTransform: "capitalize",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "15px",
              padding: "12px 24px",
              minWidth: embedded ? "200px" : "auto",
              color: "#fff !important",
            }}
          >
            Change Password
          </Button>
        </Box>
      </Box>
    </Grid>
  );

  if (embedded) {
    return content;
  }

  return (
    <Box
      component="main"
      sx={{
        maxWidth: "510px",
        ml: "auto",
        mr: "auto",
        padding: "50px 0 100px",
      }}
    >
      {content}
    </Box>
  );
};

export default ChangePasswordForm;

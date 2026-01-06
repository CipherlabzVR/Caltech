import React from "react";
import Grid from "@mui/material/Grid";
import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
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

const ChangePasswordForm = () => {
  const formik = useFormik({
    initialValues: {
      Password: "",
      NewPassword: "",
      ConfirmNewPassword: "",
    },
    validationSchema,
    onSubmit: handleSubmit,
  });

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
      <Grid item xs={12}>
        <Box>
          <Typography as="h2" fontSize="28px" fontWeight="700" mb="15px">
            Change Password
          </Typography>

          <Box component="form" noValidate onSubmit={formik.handleSubmit}>
            <Box
              sx={{
                background: "#fff",
                padding: "30px 20px",
                borderRadius: "10px",
                mb: "20px",
              }}
            >
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    name="Password"
                    type="password"
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
                    InputProps={{
                      style: { borderRadius: 8 },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="NewPassword"
                    type="password"
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
                    InputProps={{
                      style: { borderRadius: 8 },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="ConfirmNewPassword"
                    type="password"
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
                    InputProps={{
                      style: { borderRadius: 8 },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 1,
                textTransform: "capitalize",
                borderRadius: "8px",
                fontWeight: "500",
                fontSize: "16px",
                padding: "12px 10px",
                color: "#fff !important",
              }}
            >
              Change Password
            </Button>
          </Box>
        </Box>
      </Grid>
    </Box>
  );
};

export default ChangePasswordForm;
